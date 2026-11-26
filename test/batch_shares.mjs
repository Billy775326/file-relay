import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import * as miniflare from 'miniflare';

const schema = (await readFile('schema/schema.sql', 'utf8')).replace(/--[^\n]*/g, '').split(';').map(s => s.trim()).filter(Boolean);
const migration = (await readFile('schema/migrations/0002-batch-shares.sql', 'utf8')).replace(/--[^\n]*/g, '').split(';').map(s => s.trim()).filter(Boolean);
const ADMIN = 'batch-admin-test-only';
const API = 'batch-script-test-only';
const files = [{ filename: '一号.txt', size: 3, mime: 'text/plain' }, { filename: '二号.txt', size: 4, mime: 'text/plain' }];
const grantCookie = response => response.headers.getSetCookie().find(cookie => cookie.startsWith('relay_pickup_'))?.split(';')[0];

const modes = ['kv-r2', 'd1-r2', 'kv-d1', 'kv-only', 'd1-only'];
for (const mode of modes.filter(mode => !process.argv[2] || mode === process.argv[2])) {
  console.log('Testing batch on ' + mode);
  const hasKV = mode.startsWith('kv'), hasDB = mode.includes('d1'), hasR2 = mode.endsWith('r2');
  const options = { cf: {}, modules: true, scriptPath: 'dist/worker.js', compatibilityDate: '2025-06-01',
    kvNamespaces: hasKV ? ['fileKV'] : [], d1Databases: hasDB ? ['DB'] : [], r2Buckets: hasR2 ? ['BUCKET'] : [],
    bindings: { ADMIN_TOKEN: ADMIN, API_TOKEN: API, MAX_TEXT_LENGTH: '64' } };
  const mf = new miniflare.Miniflare(miniflare.convertV4MiniflareOptions?.(options) ?? options);
  try {
    const db = hasDB ? await mf.getD1Database('DB') : null;
    const kv = hasKV ? await mf.getKVNamespace('fileKV') : null;
    const bucket = hasR2 ? await mf.getR2Bucket('BUCKET') : null;
    if (db) {
      // Verify the additive migration against a database containing a legacy text share.
      const oldSchema = schema.filter(s => !s.includes('idx_shares_draft'))
        .map(s => s.split('\n').filter(line => !/^\s+(files_json|draft_until|batch_code)\b/.test(line)).join('\n'));
      for (const statement of oldSchema) await db.prepare(statement).run();
      await db.prepare("INSERT INTO shares (id,code,kind,size,text,created_at) VALUES ('legacy','100010','text',6,'legacy',?)").bind(Date.now()).run();
      for (const statement of migration) await db.prepare(statement).run();
    }
    const call = (path, { cookie, ip = '203.0.113.4', json, ...rest } = {}) =>
      mf.dispatchFetch('http://localhost' + path, { cf: { country: 'CN' }, ...rest, headers: {
        'CF-Connecting-IP': ip, ...(cookie ? { Cookie: cookie } : {}),
        ...(json === undefined ? {} : { 'Content-Type': 'application/json' }), ...rest.headers,
      }, ...(json === undefined ? {} : { body: JSON.stringify(json) }) });
    const configResponse = await call('/api/config');
    const visitor = configResponse.headers.get('set-cookie').split(';')[0];
    const visitorId = decodeURIComponent(visitor.split('=')[1]).split('.')[0];
    const auth = await call('/api/admin/login', { method: 'POST', json: { token: ADMIN } });
    assert.equal(auth.status, 200);
    const admin = auth.headers.get('set-cookie').split(';')[0];
    const adminCall = (path, opts = {}) => call('/api/admin' + path, { ...opts, cookie: admin });
    const currentConfig = async () => (await (await call('/api/config', { cookie: visitor })).json());
    const init = (opts = {}, override = {}) => call('/api/batches/init', { method: 'POST', cookie: visitor,
      json: { files, expiry: '7d', maxPickups: 1, displayName: 'Sample Sender', description: 'Private group note', ...opts }, ...override });
    const lookup = (code, cookie) => call('/api/pickup', { method: 'POST', cookie, json: { code } });
    const finalize = (draft, cookie = visitor) => call('/api/batches/' + draft.draft + '/complete', {
      method: 'POST', cookie, headers: { 'X-Batch-ID': draft.id },
    });
    const adminList = async () => (await (await adminCall('/shares')).json()).rows;
    if (db && !hasKV) assert.equal((await (await lookup('100010')).json()).text, 'legacy');
    if (!hasKV && !hasR2) { assert.equal((await init()).status, 400); console.log('PASS D1-only preserves text shares'); continue; }

    if (!hasDB && !hasR2) {
      assert.equal((await init()).status, 503, 'KV cannot safely enforce guest file quotas');
      await kv.put('v:' + visitorId, 'Trusted fixture');
    }
    const enforced = hasDB || hasR2;
    if (enforced) {
      const before = await adminCall('/upload-policy', { method: 'PUT', json: { weeklyFileLimit: 3 } });
      assert.equal(before.status, 200);
      assert.equal((await init({ expiry: 'forever' })).status, 403);
      assert.equal((await init({ maxPickups: null })).status, 403);
      assert.equal((await init({ files: [...files, ...files] })).status, 429);
      assert.equal((await currentConfig()).uploadsRemaining, 3, 'quota rejection spends nothing');
    }
    assert.equal((await init({ files: Array(11).fill(files[0]) })).status, 400);
    assert.equal((await init({ files: [{ ...files[0], size: 9_900_000_001 }, files[1]] })).status, 413);
    const response = await init();
    assert.equal(response.status, 201, await response.clone().text());
    const draft = await response.json();
    assert.equal(draft.slots.length, hasR2 ? 2 : 0);
    assert.equal((await lookup(draft.draft)).status, 404);
    assert.equal((await adminCall('/shares/' + draft.draft)).status, 404);
    assert.equal((await adminList()).some(row => row.code === draft.draft), false);
    assert.equal((await finalize(draft, 'wrong-cookie')).status, 404);
    assert.equal((await finalize(draft)).status, 409);
    if (enforced) assert.equal((await currentConfig()).uploadsRemaining, 1, 'each of the two files consumed one quota slot');
    const stage = async (index, value, draftToStage = draft) => {
      if (!hasR2) return call('/api/batches/' + draftToStage.draft + '/files/' + (index + 1), {
        method: 'PUT', cookie: visitor, headers: { 'X-Batch-ID': draftToStage.id }, body: value,
      });
      const slot = draftToStage.slots[index];
      const part = await call('/api/uploads/' + slot.uploadId + '/parts/1', { method: 'PUT', cookie: visitor, body: value });
      assert.equal(part.status, 200, await part.clone().text());
      return call('/api/uploads/' + slot.uploadId + '/complete', { method: 'POST', cookie: visitor, json: { parts: [await part.json()] } });
    };
    if (!hasR2) {
      const path = '/api/batches/' + draft.draft + '/files/1';
      assert.equal((await call(path, { method: 'PUT', headers: { 'X-Batch-ID': draft.id }, body: 'abc' })).status, 404);
      assert.equal((await stage(0, 'oversized')).status, 400);
    }
    assert.deepEqual(await (await stage(0, 'abc')).json(), { staged: true });
    assert.equal((await finalize(draft)).status, 409, 'partial groups cannot publish');
    assert.deepEqual(await (await stage(1, 'defg')).json(), { staged: true });
    assert.deepEqual(await (await stage(1, 'defg')).json(), { staged: true }, 'lost response allows staging retry');
    const published = await finalize(draft);
    assert.equal(published.status, 201, await published.clone().text());
    const { code, fileCount } = await published.json();
    assert.equal(fileCount, 2);
    const retry = await finalize(draft);
    assert.equal(retry.status, 200);
    assert.equal((await retry.json()).code, code);
    assert.equal((await adminList()).filter(row => row.code === code).length, 1);
    assert.equal((await adminList()).find(row => row.code === code).file_count, 2);
    const detailPath = '/shares/' + code;
    const detail = await (await adminCall(detailPath)).json();
    assert.equal(detail.description, 'Private group note');
    assert.equal(detail.files.length, 2);
    assert.equal(detail.size, 7);
    assert.equal(detail.downloadUrl, null);
    assert.equal(detail.pickupCount, 0);
    assert.equal((await call('/api/pickup/' + code + '/files/1/download')).status, 410);
    assert.equal(await (await call(detail.files[1].downloadUrl, { cookie: admin })).text(), 'defg');
    const preview = await adminCall(detailPath + '/files/1/preview');
    assert.equal((await preview.json()).text, 'abc');
    assert.equal((await (await adminCall(detailPath)).json()).pickupCount, 0);
    if (enforced) assert.equal((await init()).status, 429, 'retry/publish did not refund slots');
    const claim = await lookup(code);
    assert.equal(claim.status, 200, await claim.clone().text());
    const result = await claim.json();
    assert.equal(result.pickupsLeft, 0);
    assert.deepEqual(result.files.map(file => file.filename), files.map(file => file.filename));
    for (const file of result.files) assert.deepEqual(Object.keys(file).sort(), ['downloadUrl', 'filename', 'index', 'mime', 'size']);
    assert.ok(!JSON.stringify(result).includes('Private group note'));
    const grant = grantCookie(claim);
    assert.ok(grant);
    assert.equal((await lookup(code)).status, 410);
    assert.equal((await lookup(code, grant)).status, 200);
    assert.equal((await call(result.files[0].downloadUrl, { method: 'HEAD', cookie: grant })).status, 200);
    assert.equal(await (await call(result.files[0].downloadUrl, { cookie: grant })).text(), 'abc');
    assert.equal(await (await call(result.files[1].downloadUrl, { cookie: grant })).text(), 'defg');
    assert.equal((await call(result.files[0].downloadUrl, { cookie: grant + 'tamper' })).status, 410);
    assert.equal((await (await adminCall(detailPath)).json()).pickupCount, 1, 'all files share a single pickup');
    const apiDetail = await (await call('/api/v1/shares/' + code, { headers: { Authorization: 'Bearer ' + API } })).json();
    assert.equal(apiDetail.files.length, 2);
    assert.equal(await (await call(apiDetail.files[1].downloadUrl, { headers: { Authorization: 'Bearer ' + API } })).text(), 'defg');
    const batchRow = hasKV ? await kv.get('s:' + code, 'json') : await db.prepare('SELECT files_json FROM shares WHERE code=?').bind(code).first();
    const keys = (batchRow.files ?? JSON.parse(batchRow.files_json)).map(file => file.key);
    assert.equal((await adminCall(detailPath, { method: 'DELETE' })).status, 200);
    for (const key of keys) assert.equal(hasR2 ? await bucket.head(key) : await kv.get(key), null);
    assert.equal((await call(result.files[0].downloadUrl, { cookie: grant })).status, 404);
    if (enforced) {
      const audit = await (await adminCall('/audit-logs?limit=1000')).json();
      assert.equal(audit.rows.filter(row => row.category === 'upload' && row.target === code && row.result === 'success').length, 1);
      assert.ok(audit.rows.some(row => row.action === 'delete' && row.target === code && row.detail.fileCount === 2));
      assert.ok(!JSON.stringify(audit).includes(draft.id));
    }
    // Force expiry in the isolated metadata store without changing the runtime clock.
    const expires = Date.now() - 180_000;
    if (enforced) await adminCall('/upload-policy', { method: 'PUT', json: { weeklyFileLimit: 8 } });
    const abandoned = await init({}, { ip: '203.0.113.70' });
    assert.equal(abandoned.status, 201, await abandoned.clone().text());
    const pending = await abandoned.json();
    assert.deepEqual(await (await stage(0, 'abc', pending)).json(), { staged: true });
    let pendingKeys;
    if (hasKV) {
      const stored = await kv.getWithMetadata('s:' + pending.draft, 'json');
      pendingKeys = stored.value.files.map(file => file.key);
      await kv.put('s:' + pending.draft, JSON.stringify({ ...stored.value, draftUntil: expires }),
        { metadata: { ...stored.metadata, d: expires } });
    } else {
      const stored = await db.prepare('SELECT files_json FROM shares WHERE code=?').bind(pending.draft).first();
      pendingKeys = JSON.parse(stored.files_json).map(file => file.key);
      await db.prepare('UPDATE shares SET draft_until=? WHERE code=?').bind(expires, pending.draft).run();
    }
    assert.equal((await finalize(pending)).status, 409);
    assert.equal((await adminCall('/cleanup', { method: 'POST' })).status, 200);
    for (const key of pendingKeys) assert.equal(hasR2 ? await bucket.head(key) : await kv.get(key), null);
    if (hasR2) {
      const ledger = await (await bucket.get('__file-relay/quota-v1.json')).json();
      for (const key of pendingKeys) assert.ok(!(key in ledger.files));
    }
    assert.equal((await finalize(pending)).status, 404);

    if (enforced) {
      const { rules, configRevision } = await (await adminCall('/security')).json();
      rules.upload.limit = 3;
      assert.equal((await adminCall('/security', { method: 'POST', json: { action: 'rules', rules, configRevision } })).status, 200);
      const lowBurst = await init({ files: [...files, files[0]] }, { ip: '203.0.113.71' });
      assert.equal(lowBurst.status, 429);
      assert.equal((await lowBurst.json()).reason, 'rate_limit');
    }
    if (mode === 'kv-r2') {
      await adminCall('/upload-policy', { method: 'PUT', json: { weeklyFileLimit: 3 } });
      const { rules, configRevision } = await (await adminCall('/security')).json();
      rules.upload.limit = 20;
      await adminCall('/security', { method: 'POST', json: { action: 'rules', rules, configRevision } });
      const child = spawn('python', ['test/batch_shares_ui.py', String(await mf.ready)], { stdio: 'inherit' });
      await new Promise((resolve, reject) => {
        child.on('error', reject); child.on('exit', status => status === 0 ? resolve() : reject(new Error('Batch UI exit ' + status)));
      });
    }
    console.log('PASS batch ' + mode + ': all-or-nothing publication, ownership, weighted guest quota, non-counting admin download, pickup grant, deletion');
  } finally { await mf.dispose(); }
}
