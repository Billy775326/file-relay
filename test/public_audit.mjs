// Isolated public-transfer audit coverage; never sends uploads or protection changes to production.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as miniflare from 'miniflare';
const schema = (await readFile('schema/schema.sql', 'utf8')).replace(/--[^\n]*/g, '').split(';').map(s => s.trim()).filter(Boolean);
for (const mode of ['kv-r2', 'd1', 'kv-d1', 'kv-only']) {
  const kvMode = mode.startsWith('kv');
  const options = { cf: {}, modules: true, scriptPath: 'dist/worker.js', compatibilityDate: '2025-06-01',
    kvNamespaces: kvMode ? ['fileKV'] : [], d1Databases: ['d1', 'kv-d1'].includes(mode) ? ['DB'] : [],
    r2Buckets: mode === 'kv-r2' ? ['BUCKET'] : [], bindings: { ADMIN_TOKEN: 'public-audit-test-only' } };
  const mf = new miniflare.Miniflare(miniflare.convertV4MiniflareOptions?.(options) ?? options);
  try {
    const db = ['d1', 'kv-d1'].includes(mode) ? await mf.getD1Database('DB') : null;
    if (db) for (const sql of schema) await db.prepare(sql).run();
    const kv = kvMode ? await mf.getKVNamespace('fileKV') : null;
    const call = (path, { ip = '203.0.113.10', cookie, json, cf = { country: 'CN', region: 'Zhejiang', regionCode: 'ZJ', city: 'Hangzhou' }, ...opts } = {}) =>
      mf.dispatchFetch('http://localhost' + path, { cf, ...opts, headers: { 'CF-Connecting-IP': ip,
        'User-Agent': '<img src=x onerror=alert(1)> fixture', ...(cookie ? { Cookie: cookie } : {}),
        ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}), ...opts.headers },
        ...(json !== undefined ? { body: JSON.stringify(json) } : {}) });
    const auth = await call('/api/admin/login', { method: 'POST', json: { token: 'public-audit-test-only' } });
    assert.equal(auth.status, 200); const admin = auth.headers.get('set-cookie').split(';')[0];
    const cfg = await call('/api/config'); const visitor = cfg.headers.get('set-cookie').split(';')[0];
    const post = (path, json, extra = {}) => call(path, { method: 'POST', cookie: visitor, json, ...extra });
    const all = async query => {
      const res = await call('/api/admin/audit-logs?limit=1000&' + (query || ''), { cookie: admin });
      assert.equal(res.status, 200); return res.json();
    };
    const change = async (action, data = {}) => {
      const state = await (await call('/api/admin/security', { cookie: admin })).json();
      const res = await call('/api/admin/security', { method: 'POST', cookie: admin, json: { action, configRevision: state.configRevision, ...data } });
      assert.equal(res.status, 200, await res.clone().text());
    };
    if (mode !== 'kv-only') {
      const state = await (await call('/api/admin/security', { cookie: admin })).json();
      state.rules.upload.enabled = false; state.rules.pickup.enabled = false;
      await change('rules', { rules: state.rules });
      assert.equal((await call('/api/admin/upload-policy', { cookie: admin, method: 'PUT', json: { weeklyFileLimit: 100 } })).status, 200);
    }
    const textBody = { text: 'private-content-do-not-log', displayName: 'private-nickname', description: 'private-description', expiry: '1d', maxPickups: 5 };
    const sent = await post('/api/shares/text', textBody); assert.equal(sent.status, 201);
    const code = (await sent.json()).code;
    assert.equal((await post('/api/pickup', { code })).status, 200);
    if (mode === 'kv-only') {
      assert.equal((await all()).enabled, false);
      assert.equal((await post('/api/shares/text', {})).status, 400);
      assert.equal((await all()).total, 0);
      console.log('PASS public audit KV-only: transfers preserved with explicit audit unavailable state');
      continue;
    }
    let rows = (await all()).rows;
    const upload = rows.find(e => e.category === 'upload' && e.result === 'success');
    assert.equal(upload.action, 'upload'); assert.equal(upload.target, code); assert.equal(upload.detail.stage, 'text');
    assert.equal(upload.detail.textLength, textBody.text.length);
    assert.match(upload.detail.visitorId, /^[a-f0-9-]{36}$/);
    assert.equal(upload.ip, '203.0.113.10'); assert.equal(upload.city, 'Hangzhou');
    assert.equal(rows.find(e => e.category === 'pickup' && e.target === code).detail.kind, 'text');
    // A request without a cookie must correlate the new visitor with the persisted share source.
    const fresh = await post('/api/shares/text', textBody, { cookie: '', ip: '203.0.113.11' });
    assert.equal(fresh.status, 201); const freshCode = (await fresh.json()).code;
    const source = await (await call(`/api/admin/shares/${freshCode}/source`, { cookie: admin })).json();
    assert.equal((await all()).rows.find(e => e.target === freshCode && e.category === 'upload').detail.visitorId, source.source.visitorId);
    // Failed requests contain bounded reason codes, never free text/request payloads.
    assert.equal((await post('/api/shares/text', { ...textBody, expiry: 'forever' })).status, 403);
    assert.equal((await post('/api/shares/text', {})).status, 400);
    for (const wrong of ['999990', '999991', '999992']) assert.equal((await post('/api/pickup', { code: wrong })).status, 404);
    rows = (await all('category=pickup&result=failed')).rows;
    assert.equal(rows.length, 1, 'different guessed codes must not create unbounded rows');
    assert.equal(rows[0].detail.count, 3); assert.equal(rows[0].target, '999992');
    assert.ok(rows[0].detail.lastAt >= rows[0].detail.firstAt);
    assert.equal((await all('q=' + upload.detail.visitorId)).total > 0, true);
    const seed = async (code, values) => {
      const record = { id: crypto.randomUUID(), code, kind: 'text', filename: null, mime: null, r2Key: null,
        text: 'private-seeded-text', size: 19, pickupCount: 0, maxPickups: 5, createdAt: Date.now(), expireAt: null, ...values };
      if (kv) await kv.put('s:' + code, JSON.stringify(record));
      else await db.prepare('INSERT INTO shares (id,code,kind,filename,size,mime,r2_key,text,max_pickups,pickup_count,created_at,expire_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
        .bind(record.id, code, record.kind, record.filename, record.size, record.mime, record.r2Key, record.text, record.maxPickups, record.pickupCount, record.createdAt, record.expireAt).run();
    };
    await seed('000001', { expireAt: Date.now() - 1000 });
    await seed('000002', { maxPickups: 1, pickupCount: 1 });
    await seed('000003', { kind: 'file', filename: 'removed.txt', r2Key: 'absent-object', text: null });
    assert.equal((await post('/api/pickup', { code: '000001' })).status, 410);
    assert.equal((await post('/api/pickup', { code: '000002' })).status, 410);
    const html = await call('/api/pickup/000001/download', { headers: { Accept: 'text/html' } });
    assert.equal(html.status, 410); assert.match(html.headers.get('Content-Type'), /html/);
    assert.equal((await call('/api/pickup/000003/download')).status, 410);
    const probe = await call('/api/pickup/000001/download', { method: 'HEAD' });
    assert.equal(probe.status, 410); assert.equal(probe.headers.get('X-Audit-Status'), null);
    rows = (await all()).rows;
    assert.ok(rows.some(e => e.action === 'downloadProbe' && e.detail.reason === 'expired'));
    for (const reason of ['expired', 'exhausted', 'gone']) assert.ok(rows.some(e => e.detail.reason === reason), reason);
    if (mode === 'kv-r2') {
      const init = await post('/api/uploads/init', { filename: 'audit-fixture.txt', size: 3, expiry: '1d', maxPickups: 5 });
      assert.equal(init.status, 200); const session = (await init.json()).uploadId;
      assert.equal((await all('category=upload&result=success')).rows.filter(e => e.detail.kind === 'file').length, 0, 'init alone is not a completed upload');
      assert.equal((await call(`/api/uploads/${session}/parts/2`, { method: 'PUT', cookie: visitor, body: 'abc' })).status, 400);
      const part = await call(`/api/uploads/${session}/parts/1`, { method: 'PUT', cookie: visitor, body: 'abc' }); assert.equal(part.status, 200);
      assert.equal((await post(`/api/uploads/${session}/complete`, { parts: [] })).status, 400);
      const complete = await post(`/api/uploads/${session}/complete`, { parts: [await part.json()] });
      assert.equal(complete.status, 200); const fileCode = (await complete.json()).code;
      assert.equal((await post('/api/pickup', { code: fileCode })).status, 200);
      const download = await call(`/api/pickup/${fileCode}/download`); assert.equal(download.status, 200); assert.equal(await download.text(), 'abc');
      rows = (await all()).rows;
      assert.equal(rows.filter(e => e.category === 'upload' && e.target === fileCode && e.result === 'success').length, 1);
      assert.ok(rows.some(e => e.detail.stage === 'part' && e.result === 'failed' && e.detail.filename === 'audit-fixture.txt'));
      assert.ok(rows.some(e => e.detail.stage === 'complete' && e.result === 'failed'));
      assert.ok(rows.some(e => e.action === 'pickup' && e.target === fileCode));
      assert.ok(rows.some(e => e.action === 'publicDownload' && e.target === fileCode && e.result === 'success'));
      assert.ok((await all('q=audit-fixture.txt')).total > 0);
      assert.ok(!JSON.stringify(rows).includes(session), 'upload session bearer token is never logged');
      const cancel = (await (await post('/api/uploads/init', { filename: 'cancel.txt', size: 3, expiry: '1d', maxPickups: 5 })).json()).uploadId;
      assert.equal((await post(`/api/uploads/${cancel}/abort`, {})).status, 200);
      assert.equal((await post(`/api/uploads/${cancel}/abort`, {})).status, 200);
      assert.equal((await all()).rows.filter(e => e.action === 'uploadCancel' && e.result === 'success').length, 1);
      // Capacity failure and the eventual cancellation remain independent of the business operation.
      const large = await post('/api/uploads/init', { filename: 'large.txt', size: 9_900_000_000, expiry: '1d', maxPickups: 5 }); assert.equal(large.status, 200);
      assert.equal((await post('/api/uploads/init', { filename: 'extra.txt', size: 100_000_000, expiry: '1d', maxPickups: 5 })).status, 507);
      assert.ok((await all()).rows.some(e => e.detail.reason === 'capacity_exceeded'));
      assert.equal((await post(`/api/uploads/${(await large.json()).uploadId}/abort`, {})).status, 200);
    } else if (mode === 'kv-d1') {
      const direct = await call('/api/shares/file?filename=direct.txt&expiry=1d&maxPickups=5', { method: 'POST', cookie: visitor, body: 'abc' });
      assert.equal(direct.status, 201); const fileCode = (await direct.json()).code;
      const downloaded = await call(`/api/pickup/${fileCode}/download`); assert.equal(downloaded.status, 200); assert.equal(await downloaded.text(), 'abc');
      rows = (await all()).rows;
      assert.ok(rows.some(e => e.category === 'upload' && e.detail.stage === 'direct' && e.target === fileCode && e.detail.sizeBytes === 3));
      assert.ok(rows.some(e => e.action === 'publicDownload' && e.target === fileCode));
    }
    // Manual ban and region blocks are captured before request handlers run, across codes.
    await change('ban', { ip: '192.0.2.50', scopes: ['upload', 'pickup'], note: 'private-ban-note', minutes: 60 });
    for (const wrong of ['111110', '111111', '111112']) assert.equal((await post('/api/pickup', { code: wrong }, { ip: '192.0.2.50' })).status, 403);
    assert.equal((await post('/api/shares/text', textBody, { ip: '192.0.2.50' })).status, 403);
    rows = (await all('category=security&q=192.0.2.50')).rows;
    assert.equal(rows.filter(e => e.action === 'accessBlocked' && e.target === 'pickup').length, 1);
    assert.equal(rows.find(e => e.action === 'accessBlocked' && e.target === 'pickup').detail.count, 3);
    assert.ok(rows.some(e => e.action === 'accessBlocked' && e.target === 'upload'));
    await change('region', { rule: { country: 'US', region: '', scopes: ['upload', 'pickup'], enabled: true, reason: 'private-region-note', until: null } });
    const geo = { country: 'US', regionCode: 'CA', region: 'California', city: 'Example city' };
    assert.equal((await post('/api/shares/text', textBody, { cf: geo, ip: '192.0.2.51' })).status, 403);
    assert.equal((await call('/api/pickup/123456/download', { cf: geo, ip: '192.0.2.51', headers: { Accept: 'text/html' } })).status, 403);
    assert.ok((await all()).rows.some(e => e.detail.reason === 'region' && e.city === 'Example city'));
    // New automatic bans appear once; subsequent retries aggregate separately without changing ban semantics.
    const state = await (await call('/api/admin/security', { cookie: admin })).json();
    for (const scope of ['upload', 'pickup']) { state.rules[scope].enabled = true; state.rules[scope].limit = 2; }
    await change('rules', { rules: state.rules });
    for (const [path, payload, ip] of [['/api/shares/text', {}, '192.0.2.60'], ['/api/pickup', { code: 'bad' }, '192.0.2.61']]) {
      assert.equal((await post(path, payload, { ip })).status, 400);
      assert.equal((await post(path, payload, { ip })).status, 429);
      const repeated = await Promise.all(Array.from({ length: 3 }, () => post(path, payload, { ip })));
      assert.ok(repeated.every(r => r.status === 429 && !r.headers.get('X-Audit-Status')));
      rows = (await all('category=security&q=' + ip)).rows;
      assert.equal(rows.filter(e => e.action === 'ban').length, 1);
      assert.equal(rows.find(e => e.action === 'accessBlocked').detail.count, 3, 'parallel aggregate writes cannot lose counts');
    }
    // Ordinary business exceptions must also produce failed records.
    if (kv) {
      await kv.put('s:000004', 'invalid-json');
      const failed = await post('/api/pickup', { code: '000004' }, { ip: '192.0.2.88' });
      assert.equal(failed.status, 503);
      assert.ok((await all('category=pickup&q=192.0.2.88')).rows.some(e => e.result === 'failed' && e.detail.reason === 'internal'));
    }
    const ledgerKey = '__file-relay/audit-v1.json';
    const bucket = mode === 'kv-r2' ? await mf.getR2Bucket('BUCKET') : null;
    const saved = bucket ? await (await bucket.get(ledgerKey)).text() : (await db.prepare('SELECT value FROM app_settings WHERE key=?').bind(ledgerKey).first()).value;
    for (const secret of ['private-content-do-not-log', 'private-nickname', 'private-description', 'private-ban-note', 'private-region-note', 'public-audit-test-only', visitor, admin, 'Authorization'])
      assert.equal(saved.includes(secret), false, secret);
    // Audit failure must preserve successful uploads and readable download response bodies.
    if (bucket) await bucket.put(ledgerKey, '{"invalid":true}');
    else await db.prepare('UPDATE app_settings SET value=? WHERE key=?').bind('{"invalid":true}', ledgerKey).run();
    const stillSent = await post('/api/shares/text', textBody, { ip: '192.0.2.99' });
    assert.equal(stillSent.status, 201); assert.equal(stillSent.headers.get('X-Audit-Status'), 'unavailable');
    const stillPicked = await post('/api/pickup', { code: (await stillSent.json()).code }, { ip: '192.0.2.99' });
    assert.equal(stillPicked.status, 200); assert.equal((await stillPicked.json()).text, textBody.text);
    assert.equal(stillPicked.headers.get('X-Audit-Status'), 'unavailable');
    console.log(`PASS public audit ${mode}: upload/pickup outcomes, file streams, error reasons, bans/regions, grouped counts, privacy and log failures`);
  } finally { await mf.dispose(); }
}
