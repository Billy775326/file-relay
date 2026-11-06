// Run after build:pages; local workerd/R2 emulator plus Python Playwright.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import * as miniflare from 'miniflare';
const options = {
  modules: true, scriptPath: 'dist/worker.js', compatibilityDate: '2025-06-01',
  kvNamespaces: ['fileKV'], r2Buckets: ['BUCKET'], bindings: { ADMIN_TOKEN: 'quota-test-only' },
};
const mf = new miniflare.Miniflare(miniflare.convertV4MiniflareOptions?.(options) ?? options);
const json = (body) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const call = (path, init) => mf.dispatchFetch('http://localhost' + path, init);
try {
  assert.equal((await (await call('/api/config')).json()).maxFileSize, 9_900_000_000);
  assert.equal((await call('/api/uploads/init', json({ filename: 'oversized', size: 9_900_000_001, expiry: '1d' }))).status, 413);
  const reserved = await call('/api/uploads/init', json({ filename: 'large', size: 9_900_000_000, expiry: '1d' }));
  assert.equal(reserved.status, 200);
  const reservation = await reserved.json();
  assert.equal(reservation.capacityBytes, 9_990_000_000);
  assert.ok(reservation.remainingBytes > 89_999_000 && reservation.remainingBytes < 90_000_000);
  const denied = await call('/api/uploads/init', json({ filename: 'extra', size: 100_000_000, expiry: '1d' }));
  assert.equal(denied.status, 507);
  const rejection = await denied.json();
  assert.equal(rejection.error, 'capacity_exceeded');
  assert.equal(rejection.capacityBytes, 9_990_000_000);
  assert.ok(rejection.remainingBytes > 89_999_000 && rejection.remainingBytes <= reservation.remainingBytes);
  assert.equal((await call(`/api/uploads/${reservation.uploadId}/abort`, json({}))).status, 200);
  const upload = await (await call('/api/uploads/init', json({ filename: 'small', size: 3, expiry: '1d' }))).json();
  const part = await call(`/api/uploads/${upload.uploadId}/parts/1`, { method: 'PUT', body: 'abc' });
  assert.equal(part.status, 200, await part.clone().text());
  const complete = await call(`/api/uploads/${upload.uploadId}/complete`, json({ parts: [await part.json()] }));
  assert.equal(complete.status, 200, await complete.clone().text());
  const share = await complete.json();
  assert.equal(await (await call(`/api/pickup/${share.code}/download`)).text(), 'abc');

  const unfinished = await (await call('/api/uploads/init', json({ filename: 'cancel', size: 3, expiry: '1d' }))).json();
  assert.equal((await call(`/api/uploads/${unfinished.uploadId}/abort`, json({}))).status, 200);
  const login = await call('/api/admin/login', json({ token: 'quota-test-only' }));
  const cookie = login.headers.get('set-cookie').split(';')[0];
  assert.equal((await call(`/api/admin/shares/${share.code}`, { method: 'DELETE', headers: { Cookie: cookie } })).status, 200);
  const bucket = await mf.getR2Bucket('BUCKET');
  const ledger = await (await bucket.get('__file-relay/quota-v1.json')).json();
  assert.deepEqual(ledger.files, {});

  const url = String(await mf.ready);
  const python = `
import sys
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.add_init_script("localStorage.setItem('lang', 'zh')")
    calls = []
    def deny(route):
        calls.append(1)
        route.fulfill(status=507, content_type='application/json', body='{"error":"capacity_exceeded","message":"capacity exceeded","remainingBytes":123456789,"capacityBytes":9990000000}')
    page.route('**/api/uploads/init', deny)
    with page.expect_response('**/api/config'):
        page.goto(sys.argv[1])
    page.set_input_files('#file-input', [
        {'name': 'a.txt', 'mimeType': 'text/plain', 'buffer': b'a'},
        {'name': 'b.txt', 'mimeType': 'text/plain', 'buffer': b'b'},
    ])
    with page.expect_event('dialog') as info:
        page.click('#btn-upload')
    dialog = info.value
    assert '0.123 GB' in dialog.message, dialog.message
    assert '123,456,789' in dialog.message, dialog.message
    assert dialog.message.startswith( '\u5bb9\u91cf\u8d85\u51fa\u514d\u8d39\u989d\u5ea6'), dialog.message
    dialog.accept()
    page.wait_for_function("!document.querySelector('#btn-upload').disabled")
    assert len(calls) == 1, calls
    browser.close()
print('PASS browser: quota alert and batch stops after first rejection')
`;
  await new Promise((resolve, reject) => {
    const child = spawn('python', ['-', url], { stdio: ['pipe', 'inherit', 'inherit'] });
    child.on('error', reject);
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`UI test exited ${code}`)));
    child.stdin.end(python);
  });
  console.log('PASS workerd: quota rejection, streamed upload, complete, download, cancellation and deletion release');
} finally {
  await mf.dispose();
}
