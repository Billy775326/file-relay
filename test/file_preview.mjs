import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import * as miniflare from 'miniflare';

const schema = (await readFile('schema/schema.sql', 'utf8')).replace(/--[^\n]*/g, '').split(';').map(s => s.trim()).filter(Boolean);
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
const hugePng = Buffer.from(png); hugePng.writeUInt32BE(100000, 16); hugePng.writeUInt32BE(1000, 20);
const fixtures = [
  ['notes.txt', Buffer.from('<script>window.previewXSS=1</script>\nHello preview')],
  ['list.csv', Buffer.from('name,note\r\nAlice,"one,two"\r\nBob,"line 1\nline 2"\r\n')],
  ['tiny.png', png], ['file.zip', Buffer.from('PK archive')],
  ['binary.txt', Buffer.from([0, 1, 2])], ['bad.txt', Buffer.from([255, 254, 65])],
  ['long.txt', Buffer.concat([Buffer.alloc(65535, 97), Buffer.from('你好')])],
  ['exact.txt', Buffer.alloc(65536, 97)], ['empty.txt', Buffer.alloc(0)],
  ['fake.png', Buffer.from('<svg onload="alert(1)"></svg>')],
  ['large.png', Buffer.alloc(2 * 1024 * 1024 + 1)], ['pixels.png', hugePng],
  ['missing.txt', null], ['page.html', Buffer.from('<img src=x onerror=alert(1)>')],
  ['tiny.webp', Buffer.from('UklGRjQAAABXRUJQVlA4ICgAAACQAQCdASoCAAMAAUAmJZACdLoAA5gA/u69n/cFJ6Gzy/ubHOLZDAAA', 'base64')],
  ['tiny.jpg', Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAADAAIDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDo6KKK9g8s/9k=', 'base64')],
];
for (const [metadata, backend] of [['kv','kv'],['kv','r2'],['d1','r2']]) {
  const options = { cf: {}, modules: true, scriptPath: 'dist/worker.js', compatibilityDate: '2025-06-01',
    kvNamespaces: metadata === 'kv' ? ['fileKV'] : [], d1Databases: metadata === 'd1' ? ['DB'] : [],
    r2Buckets: backend === 'r2' ? ['BUCKET'] : [], bindings: { ADMIN_TOKEN: 'preview-test-only' } };
  const mf = new miniflare.Miniflare(miniflare.convertV4MiniflareOptions?.(options) ?? options);
  try {
    const kv = metadata === 'kv' ? await mf.getKVNamespace('fileKV') : null;
    const db = metadata === 'd1' ? await mf.getD1Database('DB') : null;
    const bucket = backend === 'r2' ? await mf.getR2Bucket('BUCKET') : null;
    if (db) for (const sql of schema) await db.prepare(sql).run();
    const records=[];
    for (let i=0;i<fixtures.length;i++) {
      const [filename,bytes]=fixtures[i];
      const code=String(200001+i), key=(bucket?'':'f:')+code;
      const r={id:crypto.randomUUID(),code,kind:'file',filename,size:bytes?.length||0,mime:'application/octet-stream',text:null,pickupCount:5,maxPickups:5,createdAt:Date.now(),expireAt:Date.now()-1000,r2Key:key};
      records.push(r);
      if(bytes) { if(bucket)await bucket.put(key,bytes);else await kv.put(key,bytes); }
      if(kv)await kv.put('s:'+code,JSON.stringify(r),{metadata:{id:r.id,k:r.kind,n:Buffer.from(filename).toString('base64'),s:r.size,t:r.createdAt,e:r.expireAt,c:5,m:5,r:key,p:null}});
      else await db.prepare('INSERT INTO shares (id,code,kind,filename,size,mime,r2_key,text,max_pickups,pickup_count,created_at,expire_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
        .bind(r.id,code,r.kind,filename,r.size,r.mime,key,null,5,5,r.createdAt,r.expireAt).run();
    }
    const call=(path,opts={})=>mf.dispatchFetch('http://localhost'+path,opts);
    const url=n=>`/api/admin/shares/${200001+n}/preview`;
    for(const headers of [{},{Cookie:'admin=0.invalid'},{Authorization:'Bearer preview-test-only'}])assert.equal((await call(url(0),{headers})).status,401);
    const login=await call('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:'preview-test-only'})});
    const headers={Cookie:login.headers.get('set-cookie').split(';')[0]};
    const get=n=>call(url(n),{headers});
    for(const [n,reason] of [[3,'type'],[4,'encoding'],[5,'encoding'],[9,'image'],[10,'size'],[11,'image']]) {
      const res=await get(n);assert.equal(res.status,200);assert.deepEqual(await res.json(),{kind:'unsupported',reason});
    }
    const text=await get(0);assert.equal(text.headers.get('cache-control'),'no-store');assert.equal(text.headers.get('x-content-type-options'),'nosniff');
    assert.match(text.headers.get('content-type'),/application\/json/);assert.equal((await text.json()).text,fixtures[0][1].toString());
    const csv=await(await get(1)).json();assert.equal(csv.kind,'csv');
    const img=await get(2);assert.equal(img.headers.get('content-type'),'image/png');assert.equal(img.headers.get('x-preview-width'),'1');assert.deepEqual(Buffer.from(await img.arrayBuffer()),png);
    for (const [n, mime] of [[14,'image/webp'],[15,'image/jpeg']]) {
      const res=await get(n);assert.equal(res.headers.get('content-type'),mime);assert.equal(res.headers.get('x-preview-width'),'2');assert.equal(res.headers.get('x-preview-height'),'3');assert.deepEqual(Buffer.from(await res.arrayBuffer()),fixtures[n][1]);
    }
    const partial=await(await get(6)).json();assert.equal(partial.truncated,true);assert.equal(partial.text,'a'.repeat(65535));
    assert.equal((await(await get(7)).json()).truncated,false);
    assert.equal((await(await get(8)).json()).text,'');
    assert.equal((await get(12)).status,410);
    assert.equal((await(await get(13)).json()).text,fixtures[13][1].toString());
    assert.equal((await call('/api/admin/shares/bad/preview',{headers})).status,400);
    assert.equal((await call('/api/admin/shares/999999/preview',{headers})).status,404);
    if(bucket){const events=await(await call('/api/admin/audit-logs',{headers})).json();assert.ok(events.rows.some(x=>x.action==='preview'));}
    for(const r of records){const stored=kv?await kv.get('s:'+r.code,'json'):await db.prepare('SELECT * FROM shares WHERE code=?').bind(r.code).first();assert.equal(stored.pickupCount??stored.pickup_count,5);}
    if(metadata==='kv'&&backend==='r2') {
      const origin=String(await mf.ready).replace(/\/$/,'');
      await new Promise((resolve,reject)=>{
        const child=spawn('python',['test/file_preview_ui.py',origin],{stdio:'inherit'});
        child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error(`preview UI ${code}`)));
      });
    }
    console.log(`PASS preview ${metadata}/${backend}: auth, bounded UTF-8, CSV, image signature/dimensions, missing/unsupported, retained files, unchanged counts`);
  } finally {await mf.dispose();}
}
