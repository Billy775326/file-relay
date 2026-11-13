import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import * as miniflare from 'miniflare';
const DAY = 86400000;
const KEY = 'sys:expired-retention-days';
const schema = (await readFile('schema/schema.sql', 'utf8')).replace(/--[^\n]*/g, '').split(';').map(s => s.trim()).filter(Boolean);
for (const [metadata, backend] of [['kv','kv'],['kv','r2'],['d1','r2']]) {
  const options = { modules:true, scriptPath:'dist/worker.js', compatibilityDate:'2025-06-01',
    kvNamespaces:metadata==='kv'?['fileKV']:[], d1Databases:metadata==='d1'?['DB']:[],
    r2Buckets:backend==='r2'?['BUCKET']:[], bindings:{ADMIN_TOKEN:'retention-test-only'} };
  const mf = new miniflare.Miniflare(miniflare.convertV4MiniflareOptions?.(options) ?? options);
  try {
    const kv = metadata==='kv' ? await mf.getKVNamespace('fileKV') : null;
    const db = metadata==='d1' ? await mf.getD1Database('DB') : null;
    const bucket = backend==='r2' ? await mf.getR2Bucket('BUCKET') : null;
    if (db) for (const sql of schema.filter(s=>!s.includes('CREATE TABLE IF NOT EXISTS app_settings'))) await db.prepare(sql).run();
    const call = (path, opts={}) => mf.dispatchFetch('http://localhost'+path,opts);
    const auth = await call('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:'retention-test-only'})});
    const cookie=auth.headers.get('set-cookie').split(';')[0];
    const get=path=>call(path,{headers:{Cookie:cookie}});
    const put=(value,headers={})=>call('/api/admin/settings',{method:'PUT',headers:{Cookie:cookie,'Content-Type':'application/json',...headers},body:JSON.stringify({expiredRetentionDays:value})});
    const cleanup=async()=>{const r=await call('/api/admin/cleanup',{method:'POST',headers:{Cookie:cookie}});assert.equal(r.status,200,await r.clone().text());return r.json();};
    const readSetting=async()=>{const r=await get('/api/admin/settings');assert.equal(r.status,200);return (await r.json()).expiredRetentionDays;};
    assert.equal((await call('/api/admin/settings')).status,401);
    assert.equal((await call('/api/admin/settings',{method:'PUT',headers:{'Content-Type':'application/json'},body:'{"expiredRetentionDays":0}'})).status,401);
    assert.equal(await readSetting(),30); // Includes old D1 schema without settings table.
    for (const value of [-1,3651,1.5,'30',null,{},true]) assert.equal((await put(value)).status,400);
    assert.equal((await put(0,{Origin:'https://other.example'})).status,403);
    assert.equal((await put(0,{'Content-Type':'text/plain'})).status,415);
    assert.equal(await readSetting(),30);
    const now=Date.now();
    async function seed(code,expireAt,kind='file') {
      const r={id:crypto.randomUUID(),code,kind,filename:'retained.txt',size:3,mime:'text/plain',r2Key:kind==='file'?(backend==='kv'?'f:':'')+code:null,text:kind==='text'?'abc':null,pickupCount:1,maxPickups:1,createdAt:now-90*DAY,expireAt};
      if(r.r2Key) {if(bucket) await bucket.put(r.r2Key,'abc');else await kv.put(r.r2Key,'abc');}
      if(kv) await kv.put('s:'+code,JSON.stringify(r),{metadata:{id:r.id,k:kind,n:'cmV0YWluZWQudHh0',s:3,t:r.createdAt,e:expireAt,c:1,m:1,r:r.r2Key,p:null}});
      else await db.prepare('INSERT INTO shares (id,code,kind,filename,size,mime,r2_key,text,max_pickups,pickup_count,created_at,expire_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').bind(r.id,code,kind,r.filename,3,r.mime,r.r2Key,r.text,1,1,r.createdAt,expireAt).run();
      return r;
    }
    const records=await Promise.all([
      seed('200001',now-29*DAY),seed('200002',now-31*DAY),seed('200003',now-31*DAY,'text'),
      seed('200004',now+DAY),seed('200005',null),seed('200006',now-30*DAY+60000),seed('200007',now-30*DAY-60000),
    ]);
    async function exists(r,expected) {
      const record=kv?await kv.get('s:'+r.code):await db.prepare('SELECT code FROM shares WHERE code=?').bind(r.code).first();
      assert.equal(!!record,expected,r.code+' metadata');
      if(r.r2Key) assert.equal(!!(bucket?await bucket.head(r.r2Key):await kv.get(r.r2Key)),expected,r.code+' file');
    }
    if(bucket) {
      const upload=await bucket.createMultipartUpload('orphan');
      const session={id:'stale-session',uploadId:upload.uploadId,r2Key:'orphan',filename:'orphan.txt',mime:'text/plain',size:3,parts:1,expiry:'1d',maxPickups:1,createdAt:now-2*DAY};
      if(kv) await kv.put('u:'+session.id,JSON.stringify(session),{metadata:{t:session.createdAt}});
      else await db.prepare('INSERT INTO upload_sessions (id,upload_id,r2_key,size,parts,created_at) VALUES (?,?,?,?,?,?)').bind(session.id,session.uploadId,session.r2Key,3,1,session.createdAt).run();
    }
    const first=await cleanup();assert.equal(first.deletedShares,3);assert.equal(first.abortedSessions,bucket?1:0);
    for(const r of records) await exists(r,!['200002','200003','200007'].includes(r.code));
    assert.equal((await cleanup()).deletedShares,0);
    assert.equal((await put(60)).status,200);assert.equal(await readSetting(),60);
    const older=await seed('200008',now-40*DAY);
    assert.equal((await cleanup()).deletedShares,0);await exists(older,true);
    assert.equal((await put(1)).status,200);await exists(older,true); // Saving does not delete.
    assert.equal((await cleanup()).deletedShares,3);
    for(const r of [records[0],records[5],older]) await exists(r,false);
    await exists(records[3],true);await exists(records[4],true);
    const recent=await seed('200009',now-1000);
    assert.equal((await put(0)).status,200);assert.equal((await cleanup()).deletedShares,1);await exists(recent,false);
    assert.equal((await put(3650)).status,200);assert.equal(await readSetting(),3650);
    // Invalid persisted data stops destructive cleanup instead of becoming zero days.
    const protectedRecord=await seed('200010',now-60*DAY);
    if(kv) await kv.put(KEY,'broken');
    else await db.prepare('UPDATE app_settings SET value=? WHERE key=?').bind('broken',KEY).run();
    assert.equal((await call('/api/admin/cleanup',{method:'POST',headers:{Cookie:cookie}})).status,500);
    await exists(protectedRecord,true);
    assert.equal((await put(30)).status,200);
    const baseUrl = String(await mf.ready);
    if(metadata==='kv' && backend==='kv') {
      await new Promise((resolve,reject)=>{
        const child=spawn('python',['test/retention_ui.py',baseUrl],{stdio:'inherit'});
        child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error(`retention UI ${code}`)));
      });
    }
    console.log(`PASS retention ${metadata}/${backend}: default/custom cutoff, legacy schema, saved setting, auth/validation, no deletion on save, permanent shares, orphan sessions, fail-closed`);
  } finally {await mf.dispose();}
}
