// Admin downloads must remain authenticated and must not change share state.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import * as miniflare from 'miniflare';

const bytes = Buffer.from(Array.from({ length: 65536 }, (_, i) => i % 256));
const filename = '测试报告.txt';
const schema = (await readFile('schema/schema.sql', 'utf8')).replace(/--[^\n]*/g, '').split(';').map(s => s.trim()).filter(Boolean);
for (const [metadata, backend] of [['kv', 'kv'], ['kv', 'r2'], ['d1', 'r2']]) {
  const options = { modules: true, scriptPath: 'dist/worker.js', compatibilityDate: '2025-06-01',
    kvNamespaces: metadata === 'kv' ? ['fileKV'] : [], d1Databases: metadata === 'd1' ? ['DB'] : [],
    r2Buckets: backend === 'r2' ? ['BUCKET'] : [], bindings: { ADMIN_TOKEN: 'download-test-only' } };
  const mf = new miniflare.Miniflare(miniflare.convertV4MiniflareOptions?.(options) ?? options);
  const call = (path, opts = {}) => mf.dispatchFetch('http://localhost' + path, opts);
  try {
    const kv = metadata === 'kv' ? await mf.getKVNamespace('fileKV') : null;
    const db = metadata === 'd1' ? await mf.getD1Database('DB') : null;
    const bucket = backend === 'r2' ? await mf.getR2Bucket('BUCKET') : null;
    if (db) for (const sql of schema) await db.prepare(sql).run();
    const base = { kind: 'file', filename, size: bytes.length, mime: 'application/octet-stream',
      text: null, pickupCount: 0, maxPickups: 1, createdAt: Date.now(), expireAt: null };
    const records = [
      { ...base, code: '100001' },
      { ...base, code: '100002', pickupCount: 1 },
      { ...base, code: '100003', expireAt: Date.now() - 1000 },
      { ...base, code: '100004' }, // Object missing.
      { ...base, code: '100005', kind: 'text', text: 'hello', size: 5 },
      { ...base, code: '100006' }, // Storage key missing.
    ].map(r => ({ ...r, id: crypto.randomUUID(), r2Key: ['100005', '100006'].includes(r.code) ? null : (backend === 'kv' ? 'f:' : '') + r.code }));
    for (const r of records) {
      if (r.r2Key && r.code !== '100004') {
        if (bucket) await bucket.put(r.r2Key, bytes);
        else await kv.put(r.r2Key, bytes);
      }
      if (kv) await kv.put('s:' + r.code, JSON.stringify(r), { metadata: {
        id: r.id, k: r.kind, n: Buffer.from(filename).toString('base64'), s: r.size,
        t: r.createdAt, e: r.expireAt, c: r.pickupCount, m: r.maxPickups, r: r.r2Key, p: null,
      } });
      else await db.prepare('INSERT INTO shares (id,code,kind,filename,size,mime,r2_key,text,max_pickups,pickup_count,created_at,expire_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
        .bind(r.id,r.code,r.kind,r.filename,r.size,r.mime,r.r2Key,r.text,r.maxPickups,r.pickupCount,r.createdAt,r.expireAt).run();
    }
    const record = async code => kv ? await kv.get('s:' + code, 'json') : await db.prepare('SELECT * FROM shares WHERE code=?').bind(code).first();
    const url = code => `/api/admin/shares/${code}/download`;
    for (const opts of [{}, { headers: { Cookie: 'admin=0.invalid' } }, { headers: { Authorization: 'Bearer download-test-only' } }]) {
      const res = await call(url('100001'), opts);
      assert.equal(res.status, 401);
      assert.equal(res.headers.get('cache-control'), 'no-store');
    }
    const auth = await call('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: 'download-test-only' }) });
    assert.equal(auth.status, 200);
    const cookie = auth.headers.get('set-cookie').split(';')[0];
    const download = code => call(url(code), { headers: { Cookie: cookie } });
    for (const code of ['100001','100002','100003']) {
      const before = await record(code);
      for (let i = 0; i < 2; i++) {
        const res = await download(code);
        assert.equal(res.status, 200);
        assert.equal(res.headers.get('cache-control'), 'no-store');
        assert.equal(res.headers.get('content-length'), String(bytes.length));
        assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
        assert.match(res.headers.get('content-disposition'), /^attachment;/);
        assert.ok(res.headers.get('content-disposition').includes(encodeURIComponent(filename)));
        assert.deepEqual(Buffer.from(await res.arrayBuffer()), bytes);
      }
      assert.deepEqual(await record(code), before);
    }
    for (const [code,status] of [['bad',400],['999999',404],['100004',410],['100005',400],['100006',410]]) {
      const before = await record(code);
      const res = await download(code);
      assert.equal(res.status, status);
      assert.equal(res.headers.get('cache-control'), 'no-store');
      assert.ok((await res.json()).error);
      assert.deepEqual(await record(code), before);
    }
    // Public downloads retain their limit after any number of admin downloads.
    const publicDownload = await call('/api/pickup/100001/download');
    assert.equal(publicDownload.status, 200); await publicDownload.arrayBuffer();
    assert.equal((await call('/api/pickup/100001/download')).status, 410);
    assert.equal((await call('/api/pickup/100003/download')).status, 410);
    const afterPublic = await record('100001');
    const retained = await download('100001'); assert.equal(retained.status, 200); await retained.arrayBuffer();
    assert.deepEqual(await record('100001'), afterPublic);
    if (metadata === 'kv') {
      const origin = String(await mf.ready).replace(/\/$/, '');
      await new Promise((resolve, reject) => {
        const child = spawn('python', ['test/admin_download_ui.py', origin, createHash('sha256').update(bytes).digest('hex')], { stdio: 'inherit' });
        child.on('error', reject); child.on('exit', code => code === 0 ? resolve() : reject(new Error(`admin download UI ${code}`)));
      });
      assert.deepEqual(await record('100001'), afterPublic);
    }
    console.log(`PASS admin download: ${metadata}/${backend}, auth, bytes, UTF-8 filename, retained states, missing files, unchanged counters`);
  } finally { await mf.dispose(); }
}
