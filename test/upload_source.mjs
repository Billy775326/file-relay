import { notedVisitor } from './noted_visitor.mjs';
// Isolated workerd regressions for both metadata backends and upload modes.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import * as miniflare from 'miniflare';
const schema = (await readFile('schema/schema.sql', 'utf8')).replaceAll('\r\n', '\n');
const migration = await readFile('schema/migrations/0001-upload-source.sql', 'utf8');
const sqlStatements = (text) => text.replace(/--[^\n]*/g, '').split(';').map(s => s.trim()).filter(Boolean);
const json = (body, extra = {}) => ({ method: 'POST', ...extra, headers: { 'Content-Type': 'application/json', ...extra.headers }, body: JSON.stringify(body) });
const geo = { country: 'CN', region: 'Guangdong', city: 'Shenzhen', asn: 64500, asOrganization: 'Example network' };
const ip = '203.0.113.10';
const oldCode = '000001';
const sourceFields = /visitorId|capturedAt|203\.0\.113|Guangdong|Shenzhen|"source"\s*:|"note"\s*:/;
for (const metadata of ['kv', 'd1']) {
 for (const backend of ['kv', 'r2']) {
  if (metadata === 'd1' && backend === 'kv') continue; // KV file bytes require KV metadata binding.
  const options = { cf: {}, modules: true, scriptPath: 'dist/worker.js', compatibilityDate: '2025-06-01',
    kvNamespaces: metadata === 'kv' ? ['fileKV'] : [], d1Databases: metadata === 'd1' ? ['DB'] : [],
    r2Buckets: backend === 'r2' ? ['BUCKET'] : [], bindings: { ADMIN_TOKEN: 'source-test-only', PART_SIZE: '5242880' } };
  const mf = new miniflare.Miniflare(miniflare.convertV4MiniflareOptions?.(options) ?? options);
  const call = (path, options = {}) => mf.dispatchFetch('http://localhost' + path, options);
  try {
    const legacy = { id: crypto.randomUUID(), code: oldCode, kind: 'text', filename: null, size: 3, text: 'old', mime: null, r2Key: null, maxPickups: null, pickupCount: 0, createdAt: Date.now(), expireAt: null };
    if (metadata === 'd1') {
      const db = await mf.getD1Database('DB');
      const oldSchema = schema.replace(/^.*source_json.*\n/gm, '').replace(/CREATE TABLE IF NOT EXISTS visitor_notes[\s\S]*$/, '');
      for (const sql of sqlStatements(oldSchema)) await db.prepare(sql).run();
      await db.prepare("INSERT INTO shares (id,code,kind,size,text,created_at) VALUES ('legacy',?1,'text',3,'old',?2)").bind(oldCode, Date.now()).run();
      for (const sql of sqlStatements(migration)) await db.prepare(sql).run();
      for (const sql of sqlStatements(schema)) await db.prepare(sql).run(); // Fresh schema is safe on the migrated DB.
    } else {
      const kv = await mf.getKVNamespace('fileKV');
      await kv.put('s:' + oldCode, JSON.stringify(legacy), { metadata: { id: legacy.id, k: 'text', n: null, s: 3, t: legacy.createdAt, e: null, c: 0, m: null, r: null, p: null } });
    }
    const secureCfg = await mf.dispatchFetch('https://localhost/api/config');
    assert.match(secureCfg.headers.get('set-cookie'), /Secure/);
    assert.match(secureCfg.headers.get('set-cookie'), /SameSite=Lax/i);
    const auth = await call('/api/admin/login', json({ token: 'source-test-only' }));
    const admin = auth.headers.get('set-cookie').split(';')[0];
    const adminGet = (path) => call(path, { headers: { Cookie: admin } });
    const cfg = await call('/api/config');
    const cookie = cfg.headers.get('set-cookie').split(';')[0];
    assert.match(cfg.headers.get('set-cookie'), /HttpOnly/i);
    assert.match(cfg.headers.get('cache-control'), /no-store/);
    assert.doesNotMatch(await cfg.text(), sourceFields);
    const description = '<img src=x onerror=alert(1)>\nPrivate file description';
    const submission = { displayName: 'Sample friend', description };
    for (const bad of [{ displayName: 'a'.repeat(41) }, { displayName: 'line\nbreak' }, { description: 'x'.repeat(301) }, { description: {} }]) {
      assert.equal((await call('/api/shares/text', json({ text: 'invalid', expiry: '1d', maxPickups: 5, ...bad }))).status, 400);
      if (backend === 'r2') assert.equal((await call('/api/uploads/init', json({ filename: 'invalid.txt', size: 3, expiry: '1d', maxPickups: 5, ...bad }))).status, 400);
      else assert.equal((await call('/api/shares/file?filename=invalid.txt&expiry=1d&maxPickups=5', { method: 'POST', body: 'abc', headers: { 'X-Upload-Context': encodeURIComponent(JSON.stringify(bad)) } })).status, 400);
    }
    const uploaded = await call('/api/shares/text', json({ text: 'source test', expiry: '1d', maxPickups: 5, ...submission, visitorId: 'forged', source: { ip: '1.1.1.1' } }, { cf: geo, headers: { Cookie: cookie, 'CF-Connecting-IP': ip, 'X-Forwarded-For': '1.1.1.1', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/130.0' } }));
    assert.equal(uploaded.status, 201, await uploaded.clone().text());
    const publicText = await uploaded.text(); assert.doesNotMatch(publicText, sourceFields);
    const first = JSON.parse(publicText).code;
    assert.equal((await call('/api/config', { headers: { Cookie: cookie } })).headers.get('set-cookie'), null);
    const getSource = async code => (await (await adminGet(`/api/admin/shares/${code}/source`)).json()).source;
    const source = await getSource(first);
    assert.match(source.visitorId, /^[a-f0-9-]{36}$/); assert.equal(source.ip, ip);
    assert.equal(source.city, 'Shenzhen'); assert.equal(source.note, '');
    assert.equal(source.asn, 64500); assert.equal(source.organization, 'Example network');
    assert.equal(source.displayName, submission.displayName);
    assert.match(source.userAgent, /Chrome/);
    assert.ok(!('submission' in source)); assert.ok(!('description' in source));
    assert.equal((await call(`/api/admin/shares/${first}/source/activity`)).status, 401);
    assert.equal((await call(`/api/admin/shares/${first}/source`)).status, 401);
    assert.equal((await call(`/api/admin/shares/${first}/source`, json({ note: 'intruder' }, { method: 'PUT' }))).status, 401);
    const edit = note => call(`/api/admin/shares/${first}/source`, json({ note }, { method: 'PUT', headers: { Cookie: admin } }));
    assert.equal((await edit('x'.repeat(65))).status, 400);
    assert.equal((await edit('line\nbreak')).status, 400);
    assert.equal((await call(`/api/admin/shares/${first}/source`, json({ note: 'intruder' }, { method: 'PUT', headers: { Cookie: admin, Origin: 'https://untrusted.example' } }))).status, 403);
    const note = '<img src=x onerror=alert(1)> 同事';
    assert.equal((await edit(note)).status, 200);
    assert.equal((await getSource(first)).note, note);
    const second = await (await call('/api/shares/text', json({ text: 'same browser', expiry: '1d' }, { cf: { country: 'SG', city: null, region: null }, headers: { Cookie: cookie, 'CF-Connecting-IP': '2001:db8::1' } }))).json();
    const same = await getSource(second.code);
    assert.equal(same.visitorId, source.visitorId); assert.equal(same.note, note); assert.equal(same.ip, '2001:db8::1'); assert.equal(same.city, null);
    assert.equal((await getSource(first)).city, 'Shenzhen');
    const third = await (await call('/api/shares/text', json({ text: 'forged cookie', expiry: '1d', maxPickups: 5 }, { headers: { Cookie: cookie + 'tampered', 'X-Forwarded-For': ip } }))).json();
    assert.notEqual((await getSource(third.code)).visitorId, source.visitorId);
    const listResponse = await adminGet('/api/admin/shares?limit=20');
    assert.match(listResponse.headers.get('cache-control'), /no-store/);
    const rows = (await listResponse.json()).rows;
    assert.equal(rows.find(r => r.code === first).source.note, note);
    assert.ok(!Object.hasOwn(rows.find(r => r.code === first).source, 'ip'));
    for (const field of ['submission', 'userAgent', 'asn', 'displayName']) assert.ok(!(field in rows.find(r => r.code === first).source));
    const history = await (await adminGet(`/api/admin/shares/${first}/source/activity`)).json();
    assert.equal(history.rows.length, 2);
    assert.ok(history.rows.some(row => row.ip === '2001:db8::1'));
    assert.ok(history.rows.every(row => [first, second.code].includes(row.code)));
    assert.ok(!JSON.stringify(history).includes('Private file description'));
    assert.equal(rows.find(r => r.code === oldCode).source, null);
    assert.equal(await getSource(oldCode), null);
    assert.equal((await call(`/api/admin/shares/${oldCode}/source`, json({ note: 'legacy' }, { method: 'PUT', headers: { Cookie: admin } }))).status, 409);
    assert.equal((await edit('  ')).status, 200); assert.equal((await getSource(second.code)).note, '');
    assert.doesNotMatch(await (await call('/api/pickup', json({ code: first }))).text(), sourceFields);
    await edit('file fixture'); // File transfer regressions cover the noted tier in every storage mode.
    let file;
    if (backend === 'r2') {
      const init = await call('/api/uploads/init', json({ filename: 'file.txt', size: 3, expiry: '1d', ...submission }, { cf: geo, headers: { Cookie: cookie, 'CF-Connecting-IP': ip } }));
      const upload = await init.json(); assert.equal(init.status, 200);
      assert.doesNotMatch(JSON.stringify(upload), sourceFields);
      const part = await call(`/api/uploads/${upload.uploadId}/parts/1`, { method: 'PUT', body: 'abc', headers: { Cookie: cookie } });
      file = await (await call(`/api/uploads/${upload.uploadId}/complete`, json({ parts: [await part.json()], source: { visitorId: 'changed' } }, { cf: { country: 'US', city: 'New York' }, headers: { Cookie: cookie, 'CF-Connecting-IP': '203.0.113.20' } }))).json();
    } else {
      file = await (await call('/api/shares/file?filename=file.txt&expiry=1d', { method: 'POST', body: 'abc', cf: geo, headers: { Cookie: cookie, 'CF-Connecting-IP': ip, 'X-Upload-Context': encodeURIComponent(JSON.stringify(submission)) } })).json();
    }
    assert.ok(file.code); assert.doesNotMatch(JSON.stringify(file), sourceFields);
    assert.equal((await (await adminGet(`/api/admin/shares/${file.code}`)).json()).description, description);
    assert.equal((await getSource(file.code)).displayName, submission.displayName);
    assert.ok(!(await (await call('/api/pickup', json({ code: file.code }))).text()).includes('Private file description'));
    assert.deepEqual((({ visitorId, ip, city }) => ({ visitorId, ip, city }))(await getSource(file.code)), { visitorId: source.visitorId, ip, city: 'Shenzhen' });
    assert.equal(await (await call(`/api/pickup/${file.code}/download`)).text(), 'abc');
    assert.equal((await getSource(file.code)).visitorId, source.visitorId); // Pickup counter writes preserve source.
    if (metadata === 'kv') {
      const extreme = await (await call('/api/shares/text', json({ text: '😀'.repeat(100), expiry: '1d', maxPickups: 5 }, { cf: { country: 'CN', region: 'R'.repeat(100), city: 'C'.repeat(100) } }))).json();
      const kv = await mf.getKVNamespace('fileKV');
      const page = await kv.list({ prefix: 's:' + extreme.code });
      assert.ok(Buffer.byteLength(JSON.stringify(page.keys[0].metadata)) < 1024);
    }
    await edit('');
    const regressionCookie = await notedVisitor(mf, metadata);
    // Existing broad end-to-end suite, including text, file hash, pickup limits and admin deletion.
    const url = String(await mf.ready);
    await new Promise((resolve, reject) => {
      const child = spawn('python', ['test/e2e_test.py', url.replace(/\/$/, '')], { stdio: 'inherit', env: { ...process.env, FILE_RELAY_ADMIN_TOKEN: 'source-test-only', FILE_RELAY_VISITOR_COOKIE: regressionCookie } });
      child.on('error', reject); child.on('exit', code => code === 0 ? resolve() : reject(new Error(`e2e ${code}`)));
    });
    if (metadata === 'kv' && backend === 'r2') {
      await new Promise((resolve, reject) => {
        const child = spawn('python', ['test/upload_source_ui.py', url.replace(/\/$/, ''), first, second.code, source.visitorId], { stdio: 'inherit' });
        child.on('error', reject); child.on('exit', code => code === 0 ? resolve() : reject(new Error(`UI ${code}`)));
      });
    }
    if (metadata === 'kv') {
      await new Promise((resolve, reject) => {
        const child = spawn('python', ['test/upload_context_ui.py', url.replace(/\/$/, ''), regressionCookie, backend], { stdio: 'inherit' });
        child.on('error', reject); child.on('exit', code => code === 0 ? resolve() : reject(new Error(`Context UI ${code}`)));
      });
    }
    for (let i = 0; i < 11; i++) {
      assert.equal((await call('/api/shares/text', json({ text: 'history limit ' + i, expiry: '1d', maxPickups: 5 }, { headers: { Cookie: cookie } }))).status, 201);
    }
    const capped = await (await adminGet(`/api/admin/shares/${first}/source/activity`)).json();
    assert.equal(capped.rows.length, 10);
    assert.ok(capped.rows.every((row, i) => !i || row.createdAt <= capped.rows[i - 1].createdAt));
    // 101 distinct visitors exercise bulk lookup across a batch boundary.
    const generated = Array.from({ length: 101 }, (_, i) => ({ id: crypto.randomUUID(), code: String(800000 + i) }));
    if (metadata === 'kv') {
      const kv = await mf.getKVNamespace('fileKV');
      for (const { id, code } of generated) {
        const record = { ...legacy, id: crypto.randomUUID(), code, source: { ...source, visitorId: id } };
        const summary = { ...record.source }; delete summary.ip; delete summary.note;
        await kv.put('s:' + code, JSON.stringify(record), { metadata: { id: record.id, k: 'text', n: null, s: 3, t: Date.now(), e: null, c: 0, m: null, r: null, p: null, o: Buffer.from(JSON.stringify(summary)).toString('base64') } });
        await kv.put('v:' + id, 'bulk-' + code);
      }
    } else {
      const db = await mf.getD1Database('DB');
      for (const { id, code } of generated) {
        await db.prepare("INSERT INTO shares (id,code,kind,size,text,created_at,source_json) VALUES (?1,?2,'text',3,'bulk',?3,?4)").bind(crypto.randomUUID(), code, Date.now(), JSON.stringify({ ...source, visitorId: id })).run();
        await db.prepare('INSERT INTO visitor_notes (visitor_id,note) VALUES (?1,?2)').bind(id, 'bulk-' + code).run();
      }
    }
    const bulk = await (await adminGet('/api/admin/shares?limit=200')).json();
    for (const { code } of generated) assert.equal(bulk.rows.find(row => row.code === code).source.note, 'bulk-' + code);
    console.log(`PASS source: ${metadata} metadata / ${backend} files, signed identity, private IP, snapshots, notes, old records`);
  } finally { await mf.dispose(); }
 }
}
