import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { build } from 'esbuild';
import * as miniflare from 'miniflare';
const bundle = await build({ entryPoints: ['src/upload-policy.ts'], bundle: true, platform: 'node', format: 'esm', write: false });
const { uploadWeek } = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const monday = Date.parse('2026-11-16T00:00:00+08:00');
assert.equal(uploadWeek(monday), monday);
assert.equal(uploadWeek(monday - 1), monday - 7 * 86400000);
assert.equal(uploadWeek(monday + 6 * 86400000), monday);
const schema = (await readFile('schema/schema.sql', 'utf8')).replace(/--[^\n]*/g, '').split(';').map(s => s.trim()).filter(Boolean);
const KEY = '__file-relay/guest-uploads-v1.json';
const cf = { country: 'CN', city: 'Test city' };
for (const mode of ['kv-r2', 'd1-r2', 'kv-d1', 'kv-only', 'd1-only']) {
  const hasR2 = mode.endsWith('r2'), hasKV = mode.startsWith('kv'), hasDB = mode.includes('d1');
  const options = { cf: {}, modules: true, scriptPath: 'dist/worker.js', compatibilityDate: '2025-06-01',
    kvNamespaces: hasKV ? ['fileKV'] : [], d1Databases: hasDB ? ['DB'] : [], r2Buckets: hasR2 ? ['BUCKET'] : [],
    bindings: { ADMIN_TOKEN: 'policy-test-only', PART_SIZE: '5242880' } };
  const mf = new miniflare.Miniflare(miniflare.convertV4MiniflareOptions?.(options) ?? options);
  try {
    const kv = hasKV ? await mf.getKVNamespace('fileKV') : null;
    const db = hasDB ? await mf.getD1Database('DB') : null;
    const bucket = hasR2 ? await mf.getR2Bucket('BUCKET') : null;
    if (db) for (const sql of schema) await db.prepare(sql).run();
    const call = (path, { cookie, ip = '203.0.113.1', json, ...options } = {}) => mf.dispatchFetch('http://localhost' + path,
      { cf, ...options, headers: { ...(cookie ? { Cookie: cookie } : {}), 'CF-Connecting-IP': ip,
        ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
        ...(json !== undefined ? { body: JSON.stringify(json) } : {}) });
    const config = async (cookie, ip) => {
      const r = await call('/api/config', { cookie, ip }); assert.equal(r.status, 200, await r.clone().text()); return r.json();
    };
    const newVisitor = async () => (await call('/api/config')).headers.get('set-cookie').split(';')[0];
    const visitor = await newVisitor();
    const visitorId = decodeURIComponent(visitor.slice(visitor.indexOf('=') + 1)).split('.')[0];
    const auth = await call('/api/admin/login', { method: 'POST', json: { token: 'policy-test-only' } });
    const admin = auth.headers.get('set-cookie').split(';')[0];
    const settings = (json, extra = {}) => call('/api/admin/upload-policy', { method: 'PUT', cookie: admin, json, ...extra });
    assert.equal((await call('/api/admin/upload-policy')).status, 401);
    assert.equal((await settings({ weeklyFileLimit: 0, maxFileSizeMB: 1 }, { cookie: '' })).status, 401);
    assert.equal((await settings({ weeklyFileLimit: 1.5, maxFileSizeMB: 100 })).status, 400);
    assert.equal((await settings({ weeklyFileLimit: 1, maxFileSizeMB: 0 })).status, 400);
    assert.equal((await settings({ weeklyFileLimit: 1, maxFileSizeMB: 100 }, { headers: { Origin: 'https://other.test' } })).status, 403);
    const initial = await config(visitor);
    assert.equal(initial.allowPermanent, false); assert.equal(initial.allowUnlimited, false);
    assert.equal(initial.maxFileSize, hasR2 ? 100_000_000 : hasKV ? 25 * 1024 ** 2 : 0);
    assert.equal(initial.weeklyFileLimit, 5);
    const text = await call('/api/shares/text', { method: 'POST', cookie: visitor, json: { text: 'source fixture', expiry: '1d', maxPickups: 5 } });
    assert.equal(text.status, 201); const code = (await text.json()).code;
    const note = note => call(`/api/admin/shares/${code}/source`, { method: 'PUT', cookie: admin, json: { note } });
    for (const overrides of [{ expiry: 'forever' }, { maxPickups: null }, { maxPickups: 0 }]) {
      const r = await call('/api/shares/text', { method: 'POST', cookie: visitor, json: { text: 'x', expiry: '1d', maxPickups: 5, ...overrides } });
      assert.equal(r.status, overrides.maxPickups === 0 ? 400 : 403);
    }
    if (!hasKV && !hasR2) {
      assert.equal(initial.fileUploadAvailable, false);
      console.log('PASS policy d1-only: text sharing remains available without a file backend');
      continue;
    }
    const upload = (cookie = visitor, ip = '203.0.113.1', overrides = {}) => hasR2
      ? call('/api/uploads/init', { cookie, ip, method: 'POST', json: { filename: 'test.txt', size: 3, expiry: '1d', maxPickups: 5, ...overrides } })
      : call('/api/shares/file?filename=test.txt&expiry=1d&maxPickups=5', { cookie, ip, method: 'POST', body: 'abc' });
    if (!hasDB && !hasR2) {
      assert.equal(initial.fileUploadAvailable, false);
      assert.equal((await upload()).status, 503);
      await note('trusted fixture');
      assert.equal((await upload()).status, 201);
      assert.equal((await config(visitor)).allowPermanent, true);
      console.log('PASS policy kv-only: safe rejection without an atomic quota store; noted uploads work');
      continue;
    }
    assert.equal(initial.uploadsRemaining, 5);
    if (hasR2) {
      assert.equal((await upload(visitor, undefined, { size: 100_000_001 })).status, 413);
      assert.equal((await upload(visitor, undefined, { expiry: 'forever' })).status, 403);
      assert.equal((await upload(visitor, undefined, { maxPickups: null })).status, 403);
      assert.equal((await config(visitor)).uploadsRemaining, 5);
    }
    const accepted = await upload(); assert.equal(accepted.status, hasR2 ? 200 : 201, await accepted.clone().text());
    const item = await accepted.json();
    let completedCode = item.code;
    if (hasR2) {
      const partUrl = `/api/uploads/${item.uploadId}/parts/1`;
      assert.equal((await call(partUrl, { method: 'PUT', body: 'abc' })).status, 403);
      assert.equal((await call(`/api/uploads/${item.uploadId}/abort`, { method: 'POST' })).status, 403);
      const part = await call(partUrl, { method: 'PUT', cookie: visitor, body: 'abc' });
      assert.equal(part.status, 200);
      const parts = [await part.json()];
      assert.equal((await call(`/api/uploads/${item.uploadId}/complete`, { method: 'POST', json: { parts } })).status, 403);
      const completed = await call(`/api/uploads/${item.uploadId}/complete`, { method: 'POST', cookie: visitor, json: { parts } });
      assert.equal(completed.status, 200); completedCode = (await completed.json()).code;
      assert.equal(await (await call(`/api/pickup/${completedCode}/download`)).text(), 'abc');
    }
    assert.equal((await config(visitor)).uploadsRemaining, 4);
    await call(`/api/admin/shares/${completedCode}`, { method: 'DELETE', cookie: admin });
    assert.equal((await config(visitor)).uploadsRemaining, 4, 'deletion must not refund attempts');
    const another = await newVisitor();
    assert.equal((await config(another)).uploadsRemaining, 4, 'clearing cookies must not reset same-IP quota');
    assert.equal((await config(visitor, '203.0.113.2')).uploadsRemaining, 4, 'changing IP must not reset same-visitor quota');
    // Eight simultaneous admissions with four slots left: no overshoot or lost updates.
    const attempts = await Promise.all(Array.from({ length: 8 }, () => upload()));
    assert.equal(attempts.filter(r => r.status === (hasR2 ? 200 : 201)).length, 4);
    for (const r of attempts.filter(r => r.status !== (hasR2 ? 200 : 201))) assert.equal(r.status, 429, await r.clone().text());
    assert.equal((await config(visitor)).uploadsRemaining, 0);
    if (hasR2) {
      for (const r of attempts.filter(r => r.status === 200)) {
        const id = (await r.json()).uploadId;
        assert.equal((await call(`/api/uploads/${id}/abort`, { method: 'POST', cookie: visitor })).status, 200);
      }
      assert.equal((await config(visitor)).uploadsRemaining, 0, 'cancellation must not refund attempts');
    }
    const blocked = await upload(); assert.equal(blocked.status, 429); assert.ok(blocked.headers.get('Retry-After'));
    const fake = visitor.slice(0, -4) + 'fake';
    assert.equal((await upload(fake)).status, 429);
    await note('trusted fixture');
    const noted = await config(visitor);
    assert.equal(noted.allowPermanent, true); assert.equal(noted.uploadsRemaining, null);
    assert.equal(noted.maxFileSize, hasR2 ? 9_900_000_000 : 25 * 1024 ** 2);
    assert.equal((await call('/api/shares/text', { method: 'POST', cookie: visitor, json: { text: 'trusted', expiry: 'forever', maxPickups: null } })).status, 201);
    if (hasR2) {
      const privileged = await upload(visitor, undefined, { size: 100_000_001, expiry: 'forever', maxPickups: null });
      assert.equal(privileged.status, 200); const id = (await privileged.json()).uploadId;
      await note('');
      assert.equal((await call(`/api/uploads/${id}/parts/1`, { method: 'PUT', cookie: visitor, body: 'abc' })).status, 403);
      assert.equal((await call(`/api/uploads/${id}/abort`, { method: 'POST', cookie: visitor })).status, 200, 'revocation must not prevent cancellation');
    } else await note('');
    assert.equal((await config(visitor)).uploadsRemaining, 0);
    assert.equal((await upload()).status, 429);
    await settings({ weeklyFileLimit: 6, maxFileSizeMB: 1 });
    assert.equal((await config(visitor)).uploadsRemaining, 1);
    assert.equal((await config(visitor)).maxFileSize, 1_000_000);
    if (!hasR2) {
      const tooBig = await call('/api/shares/file?filename=x&expiry=1d&maxPickups=5', { method: 'POST', cookie: visitor, body: new Uint8Array(1_000_001) });
      assert.equal(tooBig.status, 413);
    }
    await settings({ weeklyFileLimit: 0, maxFileSizeMB: 1 });
    assert.equal((await upload()).status, 429);
    await settings({ weeklyFileLimit: 5, maxFileSizeMB: 100 });
    const readLedger = async () => bucket ? (await bucket.get(KEY)).text() : (await db.prepare('SELECT value FROM app_settings WHERE key=?').bind(KEY).first()).value;
    const writeLedger = async value => bucket ? bucket.put(KEY, value) : db.prepare('UPDATE app_settings SET value=? WHERE key=?').bind(value, KEY).run();
    const ledger = JSON.parse(await readLedger());
    assert.equal(JSON.stringify(ledger).includes('203.0.113.'), false);
    assert.equal(JSON.stringify(ledger).includes(visitorId), false);
    ledger.week -= 7 * 86400000;
    await writeLedger(JSON.stringify(ledger));
    assert.equal((await config(visitor)).uploadsRemaining, 5);
    assert.equal((await upload()).status, hasR2 ? 200 : 201);
    await writeLedger('{"corrupt":true}');
    assert.equal((await upload()).status, 503, 'bad accounting must stop uploads');
    await writeLedger(JSON.stringify({ ...ledger, week: uploadWeek(Date.now()), counts: {} }));
    if (mode === 'kv-r2') {
      const url = String(await mf.ready);
      await new Promise((resolve, reject) => {
        const child = spawn('python', ['test/upload_policy_ui.py', url], { stdio: 'inherit' });
        child.on('error', reject); child.on('exit', code => code === 0 ? resolve() : reject(new Error(`policy UI ${code}`)));
      });
    }
    console.log(`PASS policy ${mode}: options/size/weekly boundary, parallel admissions, cookie/IP reset resistance, note grants/revocation, session ownership, saved settings, rollover, fail-closed`);
  } finally { await mf.dispose(); }
}
