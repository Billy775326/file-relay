import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import * as miniflare from 'miniflare';
const options = { cf: {}, modules: true, scriptPath: 'dist/worker.js', compatibilityDate: '2025-06-01',
  kvNamespaces: ['fileKV'], r2Buckets: ['BUCKET'], bindings: { ADMIN_TOKEN: 'paint-test-only' } };
const mf = new miniflare.Miniflare(miniflare.convertV4MiniflareOptions?.(options) ?? options);
try {
  const url = String(await mf.ready).replace(/\/$/, '');
  const document = await mf.dispatchFetch(url+'/');
  const version = document.headers.get('x-file-relay-build');assert.match(version,/^[a-f0-9]{16}$/);
  const markup=await document.text();assert.ok(markup.includes('/js/index.js?v='+version));
  for(const path of ['/ui.css','/js/index.js','/js/ui.js','/js/ui-entry.js']){
    const response=await mf.dispatchFetch(url+path+'?v='+version);
    assert.equal(response.headers.get('x-file-relay-build'),version);
    assert.equal(response.headers.get('cloudflare-cdn-cache-control'),'no-store');
    const etag=response.headers.get('etag');assert.ok(etag);
    const conditional=await mf.dispatchFetch(url+path+'?v='+version,{headers:{'If-None-Match':etag}});assert.equal(conditional.status,304);
    const head=await mf.dispatchFetch(url+path+'?v='+version,{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');
  }
  console.log('PASS deployed asset revision headers, versioned entry, HEAD and ETag revalidation');
  await new Promise((resolve, reject) => {
    const child = spawn('python', ['test/first_paint_ui.py', url], { stdio: 'inherit' });
    child.on('error', reject);child.on('exit', code => code === 0 ? resolve() : reject(new Error('First paint UI '+code)));
  });
} finally { await mf.dispose(); }
