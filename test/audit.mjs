import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import * as miniflare from 'miniflare';

const KEY = '__file-relay/audit-v1.json';
const schema = (await readFile('schema/schema.sql', 'utf8')).replace(/--[^\n]*/g, '').split(';').map(s => s.trim()).filter(Boolean);
for (const mode of ['kv-r2', 'd1', 'kv-only']) {
  const options = { cf: {}, modules: true, scriptPath: 'dist/worker.js', compatibilityDate: '2025-06-01',
    kvNamespaces: mode.startsWith('kv') ? ['fileKV'] : [], d1Databases: mode === 'd1' ? ['DB'] : [],
    r2Buckets: mode === 'kv-r2' ? ['BUCKET'] : [], bindings: { ADMIN_TOKEN: 'audit-test-only' } };
  const mf = new miniflare.Miniflare(miniflare.convertV4MiniflareOptions?.(options) ?? options);
  try {
    const db = mode === 'd1' ? await mf.getD1Database('DB') : null;
    if (db) for (const sql of schema) await db.prepare(sql).run();
    const call = (path, { ip = '203.0.113.10', cookie, json, ...opts } = {}) => mf.dispatchFetch('http://localhost' + path, {
      cf: { country: 'CN', region: 'Zhejiang', city: 'Hangzhou' }, ...opts, headers: { 'CF-Connecting-IP': ip,
        ...(cookie ? { Cookie: cookie } : {}), ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}), ...opts.headers },
      ...(json !== undefined ? { body: JSON.stringify(json) } : {}),
    });
    const login = (token, ip = '203.0.113.10') => call('/api/admin/login', { method: 'POST', ip, json: { token },
      headers: { 'User-Agent': '<img src=x onerror=alert(1)> fixture' } });
    const auth = await login('audit-test-only'); assert.equal(auth.status, 200);
    const cookie = auth.headers.get('set-cookie').split(';')[0];
    const logs = async (query = '') => {
      const r = await call('/api/admin/audit-logs?limit=1000&' + query, { cookie });
      assert.equal(r.status, 200, await r.clone().text()); assert.equal(r.headers.get('Cache-Control'), 'no-store'); return r.json();
    };
    assert.equal((await call('/api/admin/audit-logs')).status, 401);
    assert.equal((await call('/api/admin/audit-logs/export')).status, 401);
    for (const query of ['limit=1001', 'offset=-1', 'from=3&to=2', 'category=private', 'result=foo', 'q=' + 'x'.repeat(81)]) {
      assert.equal((await call('/api/admin/audit-logs?' + query, { cookie })).status, 400);
    }
    if (mode === 'kv-only') {
      assert.equal((await logs()).enabled, false); assert.equal((await logs()).total, 0);
      console.log('PASS audit KV-only: explicit unavailable state, protected list/export, validated queries'); continue;
    }
    let data = await logs(); assert.equal(data.total, 1); assert.equal(data.rows[0].action, 'login'); assert.equal(data.rows[0].actor, 'admin');
    for (let i = 0; i < 4; i++) assert.equal((await login('secret-do-not-log')).status, 401);
    assert.equal((await login('secret-do-not-log')).status, 429);
    data = await logs();
    assert.equal(data.total, 6, 'login success + four failures + one ban');
    assert.equal(data.rows.filter(e => e.action === 'ban').length, 1);
    assert.equal(data.rows.find(e => e.action === 'ban').result, 'blocked');
    for (let i = 0; i < 3; i++) assert.equal((await login('secret-do-not-log')).status, 429);
    assert.equal((await logs()).total, 6, 'blocked retries must not flood the log');
    assert.equal((await call('/api/admin/login-protection/unblock', { cookie, method: 'POST', json: { ip: '203.0.113.10' } })).status, 200);
    assert.equal((await call('/api/admin/settings', { cookie, method: 'PUT', json: { expiredRetentionDays: 7 } })).status, 200);
    assert.equal((await call('/api/admin/settings', { cookie, method: 'PUT', json: { expiredRetentionDays: -1 } })).status, 400);
    assert.equal((await call('/api/admin/upload-policy', { cookie, method: 'PUT', json: { weeklyFileLimit: 9 } })).status, 200);
    // Concurrent independent reads that matter for auditing; no fixture data is deleted.
    const parallel = await Promise.all(Array.from({ length: 6 }, (_, i) => call(`/api/admin/shares/${100000 + i}/download`, { cookie })));
    for (const res of parallel) { assert.equal(res.status, 404); assert.equal(res.headers.get('X-Audit-Status'), null); }
    data = await logs();
    assert.equal(data.rows.filter(e => e.action === 'download').length, 6, 'concurrent audit writes cannot overwrite each other');
    assert.equal(data.rows.find(e => e.action === 'retention' && e.result === 'success').detail.expiredRetentionDays, 7);
    assert.equal((await logs('category=security')).total, 2);
    assert.equal((await logs('result=blocked')).total, 1);
    assert.equal((await logs('q=100003')).total, 1);
    assert.equal((await logs('from=0&to=1')).total, 0);
    const page = await (await call('/api/admin/audit-logs?offset=2&limit=3', { cookie })).json();
    assert.equal(page.rows.length, 3); assert.deepEqual(page.rows.map(e => e.id), data.rows.slice(2, 5).map(e => e.id));
    const serialized = JSON.stringify(data);
    for (const secret of ['audit-test-only', 'secret-do-not-log', cookie, 'Authorization']) assert.equal(serialized.includes(secret), false);
    assert.equal(data.rows.some(e => e.agent.includes('<img')), true, 'untrusted browser text is retained only as text');
    const before = data.total;
    const exported = await call('/api/admin/audit-logs/export?category=security&limit=1000', { cookie });
    assert.equal(exported.status, 200); assert.equal((await exported.json()).total, 2);
    assert.equal((await logs()).total, before + 1, 'export action is audited after snapshot');
    assert.equal((await call('/api/admin/cleanup', { method: 'POST', headers: { Authorization: 'Bearer audit-test-only' } })).status, 200);
    assert.equal((await logs()).rows.find(e => e.action === 'cleanup').actor, 'token');
    const bucket = mode === 'kv-r2' ? await mf.getR2Bucket('BUCKET') : null;
    const read = async () => bucket ? (await bucket.get(KEY)).text() : (await db.prepare('SELECT value FROM app_settings WHERE key=?').bind(KEY).first()).value;
    const write = value => bucket ? bucket.put(KEY, value) : db.prepare('UPDATE app_settings SET value=? WHERE key=?').bind(value, KEY).run();
    const saved = await read();
    await write('{"corrupt":true}');
    assert.equal((await call('/api/admin/audit-logs', { cookie })).status, 503);
    const setting = await call('/api/admin/settings', { cookie, method: 'PUT', json: { expiredRetentionDays: 8 } });
    assert.equal(setting.status, 200, 'log failure must not misreport a completed operation as failed');
    assert.equal(setting.headers.get('X-Audit-Status'), 'unavailable');
    assert.equal((await (await call('/api/admin/settings', { cookie })).json()).expiredRetentionDays, 8);
    await write(saved);
    const sample = JSON.parse(saved).entries[0];
    const entries = Array.from({ length: 1000 }, (_, i) => ({ ...sample, id: crypto.randomUUID(),
      at: Date.now() - 1000 - i, action: 'download', category: 'operation', target: String(100000 + i) }));
    entries[999].at = Date.now() - 31 * 86400000;
    await write(JSON.stringify({ version: 1, revision: '', entries }));
    assert.equal((await logs()).total, 999, 'expired records are hidden');
    await call('/api/admin/settings', { cookie, method: 'PUT', json: { expiredRetentionDays: 30 } });
    await call('/api/admin/settings', { cookie, method: 'PUT', json: { expiredRetentionDays: 7 } });
    data = await logs(); assert.equal(data.total, 1000); assert.equal(data.rows.some(e => e.id === entries[998].id), false);
    assert.equal(JSON.parse(await read()).entries.length, 1000);
    // Browser test fixture: real records + enough safe rows to exercise pagination.
    if (mode === 'kv-r2') {
      const original = JSON.parse(saved);
      original.entries.push(...entries.slice(0, 24));
      await write(JSON.stringify(original));
      const url = String(await mf.ready);
      await new Promise((resolve, reject) => {
        const child = spawn('python', ['test/audit_ui.py', url], { stdio: 'inherit' });
        child.on('error', reject); child.on('exit', code => code === 0 ? resolve() : reject(new Error(`audit UI ${code}`)));
      });
    }
    console.log(`PASS audit ${mode}: real auth/actions, parallel records, filters/export, retention/cap, privacy and non-destructive failure handling`);
  } finally { await mf.dispose(); }
}
