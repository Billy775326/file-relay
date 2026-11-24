import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import * as miniflare from 'miniflare';

const ADMIN = 'admin-text-test-only', KEY = 'admin-text-api-test-only';
const DAY = 86400000;
const schema = (await readFile('schema/schema.sql', 'utf8')).replace(/--[^\n]*/g, '').split(';').map(s => s.trim()).filter(Boolean);
for (const mode of ['kv-only', 'kv-r2', 'kv-d1', 'd1-r2', 'd1-only']) {
  const options = { cf: {}, modules: true, scriptPath: 'dist/worker.js', compatibilityDate: '2025-06-01',
    kvNamespaces: mode.startsWith('kv') ? ['fileKV'] : [], r2Buckets: mode.endsWith('r2') ? ['BUCKET'] : [],
    d1Databases: mode.includes('d1') ? ['DB'] : [], bindings: { ADMIN_TOKEN: ADMIN, API_TOKEN: KEY } };
  const mf = new miniflare.Miniflare(miniflare.convertV4MiniflareOptions?.(options) ?? options);
  try {
    const db = mode.includes('d1') ? await mf.getD1Database('DB') : null;
    if (db) for (const sql of schema) await db.prepare(sql).run();
    const call = (path, opts = {}) => mf.dispatchFetch('http://localhost' + path, { cf: { country: 'CN', city: 'Hangzhou' }, ...opts });
    const login = await call('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: ADMIN }) });
    assert.equal(login.status, 200);
    const cookie = login.headers.get('set-cookie').split(';')[0];
    const admin = (path, opts = {}) => call('/api/admin' + path, { ...opts, headers: { Cookie: cookie, ...opts.headers } });
    const json = body => ({ method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const create = async text => {
      const response = await call('/api/v1/shares', { method: 'POST', headers: { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, expiry: '7d', maxPickups: 5, description: 'Text-only context', displayName: 'Sample sender' }) });
      assert.equal(response.status, 201, await response.clone().text());
      return (await response.json()).code;
    };
    const get = async code => { const r = await admin('/shares/' + code); assert.equal(r.status, 200); assert.match(r.headers.get('Cache-Control'), /no-store/); return r.json(); };
    const rules = r => ({ pickupCount: r.pickupCount, maxPickups: r.maxPickups, expireAt: r.expireAt, status: r.status });
    const expected = r => ({ id: r.id, pickupCount: r.pickupCount, maxPickups: r.maxPickups, expireAt: r.expireAt, version: r.version });
    const put = (code, snapshot, patch = {}) => admin('/shares/' + code, json({ expected: expected(snapshot), rules: rules(snapshot), ...patch }));

    const original = 'private-text-audit-marker\n  <script>window.textInjected = true</script>\nhttps://example.test/' + 'a'.repeat(500);
    const code = await create(original);
    assert.equal((await call('/api/admin/shares/' + code)).status, 401);
    assert.equal((await call('/api/admin/shares/' + code, json({ text: 'unauthenticated' }))).status, 401);
    const first = await get(code);
    assert.equal(first.kind, 'text'); assert.equal(first.text, original); assert.equal(first.size, original.length);
    assert.equal(first.storage, null); assert.equal(first.downloadUrl, null); assert.equal(first.maxTextLength, 65536);
    assert.equal(first.description, 'Text-only context'); assert.equal(first.source.city, 'Hangzhou');
    assert.ok(!('ip' in first.source)); assert.ok(!('r2Key' in first));
    assert.match(first.version, /^"[a-f0-9]{64}"$/);
    assert.equal((await get(code)).pickupCount, 0);
    assert.equal((await admin('/shares/' + code, { method: 'HEAD' })).status, 200);
    assert.equal((await get(code)).pickupCount, 0);
    assert.equal((await admin('/shares/' + code + '/download')).status, 400);
    assert.equal((await admin('/shares/' + code + '/preview')).status, 400);
    assert.equal((await admin('/shares/' + code, { ...json({}), headers: { Origin: 'https://untrusted.test', 'Content-Type': 'application/json' } })).status, 403);
    assert.equal((await admin('/shares/' + code, { method: 'PUT', headers: { 'Content-Type': 'text/plain' }, body: '{}' })).status, 415);
    for (const text of ['', ' \n ', 123, null, 'x'.repeat(65537)]) assert.equal((await put(code, first, { text })).status, 400);
    assert.equal((await put(code, first, { text: 'x'.repeat(1_048_576) })).status, 400);
    assert.equal((await put(code, first, { expected: { ...expected(first), version: undefined } })).status, 400);
    assert.equal((await put(code, first, { expected: { ...expected(first), id: 'wrong-snapshot' } })).status, 409);
    assert.equal((await put(code, first, { rules: { ...rules(first), status: 'exhausted' } })).status, 400);
    const large = '汉'.repeat(65536);
    assert.equal((await put(code, first, { text: large, source: { visitorId: 'spoofed' }, filename: 'ignored' })).status, 200);
    let current = await get(code);
    assert.equal(current.text, large); assert.equal(current.size, 65536); assert.equal(current.id, first.id);
    assert.equal(current.createdAt, first.createdAt); assert.equal(current.source.visitorId, first.source.visitorId);
    assert.equal(current.filename, first.filename); assert.notEqual(current.version, first.version);
    assert.equal((await put(code, first, { text: 'stale overwrite' })).status, 409, 'content-only edit invalidates old snapshot');
    assert.equal((await put(code, current, { text: 'private-updated-text\n  preserves whitespace\n' })).status, 200);
    current = await get(code);
    const list = await (await admin('/shares?kind=text&q=' + code)).json();
    assert.ok(list.rows[0].text_preview.startsWith('private-updated-text'));
    assert.ok(current.text.startsWith(list.rows[0].text_preview));
    assert.equal(list.rows[0].size, current.text.length);
    const pickup = await call('/api/pickup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
    assert.equal(pickup.status, 200);
    assert.equal((await put(code, current, { text: 'stale after pickup' })).status, 409);
    current = await get(code);
    const apiDetail = await call('/api/v1/shares/' + code, { headers: { Authorization: 'Bearer ' + KEY } });
    const patch = await call('/api/v1/shares/' + code, { method: 'PATCH', headers: { Authorization: 'Bearer ' + KEY,
      'Content-Type': 'application/json', 'If-Match': apiDetail.headers.get('ETag') }, body: JSON.stringify({ text: 'Changed by script' }) });
    assert.equal(patch.status, 200);
    assert.equal((await put(code, current, { text: 'stale after API edit' })).status, 409);
    current = await get(code);
    assert.equal((await put(code, current, { rules: { ...rules(current), maxPickups: null, expireAt: null } })).status, 200);
    current = await get(code);
    assert.equal(current.text, 'Changed by script'); assert.equal(current.maxPickups, null); assert.equal(current.expireAt, null);
    assert.equal((await put(code, current, { rules: { ...rules(current), expireAt: Date.now() - DAY, status: 'expired' } })).status, 200);
    current = await get(code); assert.equal(current.status, 'expired'); assert.equal(current.text, 'Changed by script');
    assert.equal((await put(code, current, { text: 'Retained text can still be edited' })).status, 200);
    current = await get(code);
    assert.equal((await put(code, current, { rules: { ...rules(current), expireAt: Date.now() - 31 * DAY } })).status, 200);
    current = await get(code); assert.equal(current.cleanupStatus, 'pending');
    assert.equal((await put(code, current, { text: 'Too late' })).status, 409);
    if (mode.startsWith('d1')) {
      const parallelCode = await create('Parallel edit'); const snapshot = await get(parallelCode);
      const responses = await Promise.all(['first writer', 'second writer'].map(text => put(parallelCode, snapshot, { text })));
      assert.deepEqual(responses.map(r => r.status).sort(), [200, 409]);
    }
    if (mode !== 'kv-only') {
      const audit = await (await admin('/audit-logs?limit=1000')).json();
      assert.ok(audit.rows.some(r => r.action === 'editShare' && r.result === 'success' && r.detail.changedFields === 'text' && r.detail.afterTextLength === 65536));
      const serialized = JSON.stringify(audit);
      for (const privateValue of ['private-text-audit-marker', 'private-updated-text', 'Changed by script', KEY, ADMIN, large]) assert.ok(!serialized.includes(privateValue), 'audit must not contain text or credentials');
    }
    if (mode === 'kv-r2') {
      const uiCode = await create(original + '\n' + 'A long text line\n'.repeat(60));
      const child = spawn('python', ['test/admin_text_ui.py', String(await mf.ready), uiCode], { stdio: 'inherit' });
      await new Promise((resolve, reject) => { child.on('error', reject); child.on('exit', c => c === 0 ? resolve() : reject(new Error('Text UI exit ' + c))); });
    }
    console.log('PASS admin text ' + mode + ': full non-counting details, limits, concurrent content/rules, API edits, retention, metadata and audit privacy');
  } finally { await mf.dispose(); }
}
