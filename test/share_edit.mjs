import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import * as miniflare from 'miniflare';

const DAY = 86400000;
const schema = (await readFile('schema/schema.sql','utf8')).replace(/--[^\n]*/g,'').split(';').map(s=>s.trim()).filter(Boolean);
for (const mode of ['kv','kv-r2','d1-r2']) {
  const options = { cf:{}, modules:true, scriptPath:'dist/worker.js',compatibilityDate:'2025-06-01',
    kvNamespaces:mode.startsWith('kv')?['fileKV']:[],d1Databases:mode==='d1-r2'?['DB']:[],r2Buckets:mode.endsWith('r2')?['BUCKET']:[],bindings:{ADMIN_TOKEN:'edit-test-only'} };
  const mf = new miniflare.Miniflare(miniflare.convertV4MiniflareOptions?.(options)??options);
  try {
    const kv=mode.startsWith('kv')?await mf.getKVNamespace('fileKV'):null;
    const db=mode==='d1-r2'?await mf.getD1Database('DB'):null;
    const bucket=mode.endsWith('r2')?await mf.getR2Bucket('BUCKET'):null;
    if(db)for(const sql of schema)await db.prepare(sql).run();
    const call=(path,opts={})=>mf.dispatchFetch('http://localhost'+path,{cf:{country:'CN'},...opts});
    const login=await call('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:'edit-test-only'})});
    assert.equal(login.status,200);const cookie=login.headers.get('set-cookie').split(';')[0];
    const get=async code=>{const r=await call('/api/admin/shares/'+code,{headers:{Cookie:cookie}});assert.equal(r.status,200);return r.json();};
    const base = record => ({id:record.id,pickupCount:record.pickupCount,maxPickups:record.maxPickups,expireAt:record.expireAt});
    const put=(code,expected,rules,headers={})=>call('/api/admin/shares/'+code,{method:'PUT',headers:{Cookie:cookie,'Content-Type':'application/json',...headers},body:JSON.stringify({expected:base(expected),rules})});
    async function seed(code,patch={}){
      const r={id:crypto.randomUUID(),code,kind:'file',filename:'editable.txt',size:5,mime:'text/plain',r2Key:(bucket?'':'f:')+code,text:null,pickupCount:0,maxPickups:5,createdAt:Date.now(),expireAt:Date.now()+DAY,...patch};
      if(r.r2Key&&!patch.missing){if(bucket)await bucket.put(r.r2Key,'hello');else await kv.put(r.r2Key,'hello');}
      if(kv)await kv.put('s:'+code,JSON.stringify(r),{metadata:{id:r.id,k:r.kind,n:'ZWRpdGFibGUudHh0',s:5,t:r.createdAt,e:r.expireAt,c:r.pickupCount,m:r.maxPickups,r:r.r2Key,p:null}});
      else await db.prepare('INSERT INTO shares(id,code,kind,filename,size,mime,r2_key,text,max_pickups,pickup_count,created_at,expire_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').bind(r.id,r.code,r.kind,r.filename,r.size,r.mime,r.r2Key,r.text,r.maxPickups,r.pickupCount,r.createdAt,r.expireAt).run();
      return r;
    }
    const original=await seed('500001');
    const active={pickupCount:0,maxPickups:5,expireAt:original.expireAt,status:'active'};
    assert.equal((await put('500001',original,active,{Cookie:''})).status,401);
    assert.equal((await put('500001',original,active,{Origin:'https://other.example'})).status,403);
    assert.equal((await put('500001',original,active,{'Content-Type':'text/plain'})).status,415);
    for(const rules of [{...active,pickupCount:-1},{...active,pickupCount:1.5},{...active,maxPickups:0},{...active,maxPickups:'5'},{...active,expireAt:'forever'},{...active,expireAt:Infinity},{...active,status:'expired'}]){
      // JSON null is a valid permanent date; non-finite values need a finite invalid bound instead.
      if(rules.expireAt===Infinity)rules.expireAt=253402300800000;
      assert.equal((await put('500001',original,rules)).status,400);
    }
    assert.equal((await put('500001',original,{...active,pickupCount:2,maxPickups:2,status:'exhausted',r2Key:'do-not-write',filename:'wrong'})).status,200);
    let detail=await get('500001');assert.equal(detail.status,'exhausted');assert.equal(detail.filename,'editable.txt');
    assert.equal((await call('/api/pickup/500001/download')).status,410);
    assert.equal((await put('500001',original,active)).status,409,'stale editor cannot overwrite newer values');
    assert.equal((await put('500001',detail,{...active,pickupCount:2,maxPickups:3})).status,200);
    const stale=await get('500001');
    const download=await call('/api/pickup/500001/download');assert.equal(download.status,200);assert.equal(await download.text(),'hello');
    assert.equal((await put('500001',stale,active)).status,409,'downloads after opening are preserved');
    detail=await get('500001');
    assert.equal((await put('500001',detail,{pickupCount:0,maxPickups:null,expireAt:null,status:'active'})).status,200);
    detail=await get('500001');assert.equal(detail.pickupCount,0);assert.equal(detail.maxPickups,null);assert.equal(detail.expireAt,null);
    assert.equal((await put('500001',detail,{pickupCount:0,maxPickups:null,expireAt:Date.now()-1000,status:'expired'})).status,200);
    const pickup=await call('/api/pickup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:'500001'})});assert.equal(pickup.status,410);assert.equal((await pickup.json()).error,'expired');
    const retained=await call('/api/admin/shares/500001/download',{headers:{Cookie:cookie}});assert.equal(retained.status,200);assert.equal(await retained.text(),'hello');
    const list=await (await call('/api/admin/shares',{headers:{Cookie:cookie}})).json();assert.equal(list.rows.find(r=>r.code==='500001').status,'expired');
    await seed('500002',{expireAt:Date.now()-31*DAY});assert.equal((await put('500002',await get('500002'),active)).status,409);
    await seed('500003',{missing:true});assert.equal((await put('500003',await get('500003'),active)).status,410);
    assert.equal((await put('599999',original,active)).status,404);
    const text=await seed('500005',{kind:'text',r2Key:null,text:'hello'});
    assert.equal((await put('500005',text,active)).status,400,'file editor does not mutate text shares');
    if(db){
      await seed('500004');const snapshot=await get('500004');
      const outcomes=await Promise.all([put('500004',snapshot,{...active,maxPickups:7}),put('500004',snapshot,{...active,maxPickups:9})]);
      assert.deepEqual(outcomes.map(r=>r.status).sort(),[200,409]);
    }
    if(bucket){const audit=await(await call('/api/admin/audit-logs?limit=1000',{headers:{Cookie:cookie}})).json();assert.ok(audit.rows.some(r=>r.action==='editShare'&&r.result==='success'&&r.detail.beforeRules&&r.detail.afterRules));}
    if(mode==='kv-r2'){
      await seed('500010');
      const url=String(await mf.ready);
      await new Promise((resolve,reject)=>{const child=spawn('python',['test/share_edit_ui.py',url],{stdio:'inherit'});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error('Share edit UI '+code)));});
    }
    console.log('PASS share editing '+mode+': validation, auth, conflicts, state transitions, retained bytes, cleanup boundary and audit');
  } finally {await mf.dispose();}
}
