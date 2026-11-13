import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import * as miniflare from 'miniflare';

const KEY = '__file-relay/login-guard-v1.json';
for (const mode of ['kv-r2', 'd1', 'kv-only', 'kv-no-token']) {
  const options = { cf: {}, modules: true, scriptPath: 'dist/worker.js', compatibilityDate: '2025-06-01',
    kvNamespaces: mode.startsWith('kv') ? ['fileKV'] : [], d1Databases: mode === 'd1' ? ['DB'] : [],
    r2Buckets: mode === 'kv-r2' ? ['BUCKET'] : [], bindings: { ADMIN_TOKEN: mode === 'kv-no-token' ? '' : 'guard-test-only' } };
  const mf = new miniflare.Miniflare(miniflare.convertV4MiniflareOptions?.(options) ?? options);
  try {
    const call = (path, { ip = '203.0.113.10', cookie, json, ...opts } = {}) => mf.dispatchFetch('http://localhost' + path, {
      cf: {}, ...opts, headers: { 'CF-Connecting-IP': ip, ...(cookie ? { Cookie: cookie } : {}),
        ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}), ...opts.headers },
      ...(json !== undefined ? { body: JSON.stringify(json) } : {}),
    });
    const login = (ip, token = 'wrong', extra = {}) => call('/api/admin/login', { ip, method: 'POST', json: { token }, ...extra });
    if (mode === 'kv-no-token') {
      assert.equal((await login(undefined, '')).status, 503);
      // HTTP Headers trim trailing whitespace: an empty Bearer value is not a credential.
      assert.equal((await call('/api/admin/cleanup', { method: 'POST', headers: { Authorization: 'Bearer ' } })).status, 401);
      assert.equal((await call('/api/admin/cleanup', { method: 'POST', headers: { Authorization: 'Bearer wrong' } })).status, 503);
      console.log('PASS login protection: missing admin secret cannot authenticate with an empty token');
      continue;
    }
    const auth = await login('203.0.113.1', 'guard-test-only');
    assert.equal(auth.status, 200); const cookie = auth.headers.get('set-cookie').split(';')[0];
    const status = () => call('/api/admin/login-protection', { cookie });
    const unblock = (ip, extra = {}) => call('/api/admin/login-protection/unblock', { cookie, method: 'POST', json: { ip }, ...extra });
    assert.equal((await call('/api/admin/login-protection')).status, 401);
    assert.equal((await unblock('203.0.113.10', { cookie: '' })).status, 401);
    assert.equal((await unblock('203.0.113.10', { headers: { Origin: 'https://other.test' } })).status, 403);
    assert.equal((await unblock('<script>')).status, 400);
    assert.equal((await login(undefined, 'wrong', { headers: { Origin: 'https://other.test' } })).status, 403);
    assert.equal((await status()).headers.get('Cache-Control'), 'no-store');
    const settings = await (await status()).json();
    assert.deepEqual([settings.maxFailures, settings.windowSeconds, settings.banSeconds], [5, 600, 1800]);
    if (mode === 'kv-only') {
      assert.equal(settings.enabled, false);
      assert.equal((await unblock('203.0.113.10')).status, 503);
      console.log('PASS login protection KV-only: explicitly unavailable; existing login preserved');
      continue;
    }
    assert.equal(settings.enabled, true);
    for (let i = 0; i < 4; i++) assert.equal((await login()).status, 401);
    const fifth = await login();
    assert.equal(fifth.status, 429);
    assert.ok(Number(fifth.headers.get('Retry-After')) > 1700);
    assert.equal(fifth.headers.has('set-cookie'), false);
    assert.equal((await login(undefined, 'guard-test-only')).status, 429, 'correct token cannot skip a ban');
    assert.equal((await login(undefined, 'wrong', { headers: { 'X-Forwarded-For': '203.0.113.99', Cookie: 'relay_visitor=fake' } })).status, 429);
    assert.equal((await login('203.0.113.11', 'guard-test-only')).status, 200);
    let bans = (await (await status()).json()).bans;
    assert.equal(bans.length, 1); assert.equal(bans[0].ip, '203.0.113.10'); assert.equal(bans[0].failures, 5);
    assert.equal((await unblock('203.0.113.10')).status, 200);
    assert.equal((await unblock('203.0.113.10')).status, 200, 'unblock is idempotent');
    assert.equal((await login()).status, 401);
    assert.equal((await login(undefined, 'guard-test-only')).status, 200, 'successful login clears failures');
    for (let i = 0; i < 4; i++) assert.equal((await login()).status, 401);
    // Concurrent failures must persist a ban without lost increments or extra failures beyond the cap.
    const concurrent = await Promise.all(Array.from({ length: 8 }, () => login()));
    for (const r of concurrent) assert.equal(r.status, 429, await r.clone().text());
    assert.equal((await (await status()).json()).bans[0].failures, 5);
    const bucket = mode === 'kv-r2' ? await mf.getR2Bucket('BUCKET') : null;
    const db = mode === 'd1' ? await mf.getD1Database('DB') : null;
    const read = async () => bucket ? (await bucket.get(KEY)).text() : (await db.prepare('SELECT value FROM app_settings WHERE key=?').bind(KEY).first()).value;
    const write = value => bucket ? bucket.put(KEY, value) : db.prepare('UPDATE app_settings SET value=? WHERE key=?').bind(value, KEY).run();
    let ledger = JSON.parse(await read());
    ledger.entries[0].bannedUntil = Date.now() - 1;
    await write(JSON.stringify(ledger));
    assert.equal((await (await status()).json()).bans.length, 0);
    assert.equal((await login()).status, 401, 'expired ban resets failures');
    ledger = JSON.parse(await read()); assert.equal(ledger.entries[0].failures, 1);
    ledger.entries[0].firstFailedAt = ledger.entries[0].lastFailedAt = Date.now() - 600_001;
    ledger.entries[0].failedAt = [ledger.entries[0].firstFailedAt];
    await write(JSON.stringify(ledger));
    assert.equal((await login()).status, 401);
    assert.equal(JSON.parse(await read()).entries[0].failures, 1, 'failure window expires');
    // A rolling window retains recent failures when the oldest one expires.
    ledger = JSON.parse(await read());
    const recent = Date.now() - 1000;
    const old = Date.now() - 600_001;
    ledger.entries[0] = { ip: '203.0.113.10', failures: 4, failedAt: [old, recent, recent, recent],
      firstFailedAt: old, lastFailedAt: recent, bannedUntil: 0 };
    await write(JSON.stringify(ledger));
    assert.equal((await login()).status, 401);
    assert.equal((await login()).status, 429, 'recent failures survive a rolling window boundary');
    // The cleanup Bearer endpoint uses the same admin secret: it must not become a token-guessing bypass.
    for (let i = 0; i < 4; i++) assert.equal((await call('/api/admin/cleanup', { method: 'POST', ip: '203.0.113.44', headers: { Authorization: 'Bearer wrong' } })).status, 401);
    assert.equal((await login('203.0.113.44')).status, 429);
    assert.equal((await call('/api/admin/cleanup', { method: 'POST', ip: '203.0.113.44', headers: { Authorization: 'Bearer guard-test-only' } })).status, 429);
    assert.equal((await login('203.0.113.44', 'guard-test-only')).status, 429);
    for (let i = 0; i < 4; i++) await login('2001:db8:0:0:0:0:0:1');
    assert.equal((await login('2001:db8::1')).status, 429, 'IPv6 forms share one counter');
    await write('{"corrupt":true}');
    assert.equal((await login('203.0.113.11', 'guard-test-only')).status, 503, 'storage corruption fails closed');
    assert.equal((await status()).status, 503);
    const capacityNow = Date.now();
    await write(JSON.stringify({ version: 1, revision: '', entries: Array.from({ length: 1000 }, (_, i) => ({
      ip: `2001:db8::${i.toString(16)}`, failures: 1, failedAt: [capacityNow], firstFailedAt: capacityNow, lastFailedAt: capacityNow, bannedUntil: 0,
    })) }));
    assert.equal((await login('203.0.113.99')).status, 503, 'full ledger cannot evict active counters');
    await write(JSON.stringify({ version: 1, revision: '', entries: [] }));
    if (mode === 'kv-r2') {
      for (let i = 0; i < 5; i++) await login('2001:db8::42');
      const url = String(await mf.ready);
      await new Promise((resolve, reject) => {
        const child = spawn('python', ['test/login_protection_ui.py', url], { stdio: 'inherit' });
        child.on('error', reject); child.on('exit', code => code === 0 ? resolve() : reject(new Error(`login guard UI ${code}`)));
      });
    }
    console.log(`PASS login protection ${mode}: threshold, concurrency, IP isolation, IPv6, reset, expiry, auth, CSRF, fail-closed, bounded state`);
  } finally { await mf.dispose(); }
}
