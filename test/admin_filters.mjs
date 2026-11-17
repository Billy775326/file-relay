import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import * as miniflare from 'miniflare';

// Isolated records only: filters must apply before counting and pagination on either backend.
const now = Date.now(), visitorId = 'a1b2c3d4-1234-4123-8123-123456789abc';
const source = { visitorId, country: 'CN', region: 'Zhejiang', city: 'Hangzhou', capturedAt: now, ip: '203.0.113.42', userAgent: 'Chrome/130 Windows', organization: 'Example Network', asn: 64500 };
const b64 = value => Buffer.from(value).toString('base64');
for (const mode of ['kv-r2', 'd1-r2']) {
  const options = { cf: {}, modules: true, scriptPath: 'dist/worker.js', compatibilityDate: '2025-06-01',
    kvNamespaces: mode === 'kv-r2' ? ['fileKV'] : [], d1Databases: mode === 'd1-r2' ? ['DB'] : [], r2Buckets: ['BUCKET'], bindings: { ADMIN_TOKEN: 'filter-test-only' } };
  const mf = new miniflare.Miniflare(miniflare.convertV4MiniflareOptions?.(options) ?? options);
  try {
    const db = mode === 'd1-r2' ? await mf.getD1Database('DB') : null;
    const kv = mode === 'kv-r2' ? await mf.getKVNamespace('fileKV') : null;
    const bucket = await mf.getR2Bucket('BUCKET');
    if (db) for (const sql of (await readFile('schema/schema.sql', 'utf8')).replace(/--[^\n]*/g, '').split(';').map(s => s.trim()).filter(Boolean)) await db.prepare(sql).run();
    for (let i = 0; i < 9; i++) {
      const r = { id: crypto.randomUUID(), code: String(700000+i), kind: i === 8 ? 'text' : 'file', filename: i === 8 ? null : (i === 7 ? 'Beyond-page Report.txt' : '布局测试_' + i + '_这是供管理员检查单行省略和完整文件名提示的长名称.txt'), size: 5, mime: 'text/plain', r2Key: i === 8 ? null : 'fixture/' + i, text: i === 8 ? 'fixture text' : null, pickupCount: i === 5 || i === 6 ? 5 : 0, maxPickups: 5, createdAt: now-i*1000, expireAt: i === 6 ? now-1000 : now+86400000, source: i === 7 ? null : source };
      if (r.r2Key) await bucket.put(r.r2Key, 'hello');
      if (kv) await kv.put('s:'+r.code, JSON.stringify(r), { metadata: { id:r.id,k:r.kind,n:r.filename?b64(r.filename.slice(0,40)):null,s:r.size,t:r.createdAt,e:r.expireAt,c:r.pickupCount,m:r.maxPickups,r:r.r2Key,p:r.text?b64(r.text):null,...(r.source?{o:b64(JSON.stringify(source))}:{}) } });
      else await db.prepare('INSERT INTO shares(id,code,kind,filename,size,mime,r2_key,text,max_pickups,pickup_count,created_at,expire_at,source_json) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(r.id,r.code,r.kind,r.filename,r.size,r.mime,r.r2Key,r.text,r.maxPickups,r.pickupCount,r.createdAt,r.expireAt,r.source?JSON.stringify(r.source):null).run();
    }
    const call = (path, opts={}) => mf.dispatchFetch('http://localhost'+path, { cf: {country:'CN'}, ...opts });
    const auth = await call('/api/admin/login', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:'filter-test-only'})});
    assert.equal(auth.status,200); const cookie = auth.headers.get('set-cookie').split(';')[0];
    const list = async query => { const response=await call('/api/admin/shares?'+query,{headers:{Cookie:cookie}});assert.equal(response.status,200,await response.clone().text());return response.json(); };
    assert.equal((await call('/api/admin/shares?q=report')).status,401);
    const page = await list('limit=1&offset=0&q=REPORT');assert.equal(page.total,1);assert.equal(page.rows[0].code,'700007');
    assert.equal((await list('q=700007&kind=file')).rows[0].code,'700007');
    assert.equal((await list('q=700007&kind=text')).total,0);
    assert.equal((await list('q=A1B2C3D4')).total,8);
    assert.equal((await list('status=expired')).rows[0].code,'700006');
    assert.equal((await list('status=exhausted')).rows[0].code,'700005');
    assert.equal((await list('status=active')).total,7);
    assert.equal((await list('kind=text')).total,1);
    assert.equal((await list('q=%25')).total,0,'SQL wildcard characters are literal');
    assert.equal((await list('q=REPORT&offset=1')).rows.length,0);
    for (const query of ['kind=bad','status=bad','q='+ 'x'.repeat(81)]) assert.equal((await call('/api/admin/shares?'+query,{headers:{Cookie:cookie}})).status,400);
    const stats=await (await call('/api/admin/stats',{headers:{Cookie:cookie}})).json();assert.equal(stats.kv.bound,!!kv);assert.equal(stats.kv.state,kv?'unconfigured':'unbound');assert.equal(stats.metadataBackend,kv?'kv':'d1');
    if (kv) { const url = String(await mf.ready); await new Promise((resolve,reject)=>{const child=spawn('python',['test/combined_layout_ui.py',url],{stdio:'inherit'});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error('Combined UI '+code)));}); }
    console.log('PASS admin filters '+mode+': global search, pagination, status precedence, kinds, literal queries, auth, validation and KV binding state');
  } finally { await mf.dispose(); }
}
