// Local boundary tests; no Cloudflare credentials, storage or network required.
// esbuild is provided by the installed Wrangler toolchain.
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const bundle = await build({
  entryPoints: ['src/index.ts'], bundle: true, platform: 'node', format: 'esm', write: false,
});
const { default: worker } = await import(
  'data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64')
);
const MiB = 1024 ** 2;
function environment(extra = {}) {
  const values = new Map();
  return {
    fileKV: {
      async get(key, type) {
        const value = values.get(key);
        return value === undefined ? null : type === 'json' ? JSON.parse(value) : value;
      },
      async put(key, value) { values.set(key, value); },
      async delete(key) { values.delete(key); },
      async list() { return { keys: [], list_complete: true }; },
    },
    ADMIN_TOKEN: 'local-test-only',
    ...extra,
  };
}
const bucket = {
  async get() { return null; },
  async put() { return {}; },
  async list() { return { objects: [], truncated: false }; },
  async createMultipartUpload() { return { uploadId: crypto.randomUUID() }; },
  resumeMultipartUpload() { throw new Error('Oversized part must be rejected before R2'); },
};
const ctx = { waitUntil() {} };
const request = (env, path, init) => worker.fetch(new Request('http://localhost' + path, init), env, ctx);
const config = async (env) => (await request(env, '/api/config')).json();
const init = (env, size) => request(env, '/api/uploads/init', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ filename: 'boundary.bin', size, expiry: '1d' }),
});

const kv = environment();
assert.equal((await config(kv)).maxFileSize, 25 * MiB);
for (const [size, status] of [[25 * MiB, 201], [25 * MiB + 1, 413]]) {
  // No Content-Length: ensure validation uses actual bytes, not just the header.
  const result = await request(kv, '/api/shares/file?filename=test.bin&expiry=1d', {
    method: 'POST', body: new Uint8Array(size),
  });
  assert.equal(result.status, status, `KV actual payload ${size}`);
}
assert.equal((await config(environment({ MAX_FILE_SIZE: '1048576' }))).maxFileSize, MiB);
assert.equal((await config(environment({ MAX_FILE_SIZE: '999999999999999' }))).maxFileSize, 25 * MiB);

const r2 = environment({ BUCKET: bucket });
const defaults = await config(r2);
assert.equal(defaults.partSize, 100_000_000);
assert.equal(defaults.maxFileSize, 10_000_000_000);
assert.equal((await init(r2, defaults.maxFileSize)).status, 507); // Total-capacity policy is lower.
const boundary = await init(r2, 100_000_000);
assert.equal(boundary.status, 200);
const session = await boundary.json();
assert.equal(session.parts, 1);
assert.equal(session.partSize, defaults.partSize);
assert.equal((await init(r2, defaults.maxFileSize + 1)).status, 413);
assert.equal((await init(r2, Number.MAX_SAFE_INTEGER + 1)).status, 400);
const oversizedPart = await request(r2, `/api/uploads/${session.uploadId}/parts/1`, {
  method: 'PUT', headers: { 'Content-Length': '100000001' }, body: 'x',
});
assert.equal(oversizedPart.status, 400);

for (const [overrides, partSize, maxSize] of [
  [{ PART_SIZE: String(10 * MiB) }, 10 * MiB, 10_000_000_000],
  [{ PART_SIZE: '1', MAX_PARTS: '2' }, 5 * MiB, 10 * MiB],
  [{ PART_SIZE: '9999999999', MAX_PARTS: '20000' }, 100_000_000, 10_000_000_000],
  [{ MAX_FILE_SIZE: '999999999999999' }, 100_000_000, 1_000_000_000_000],
  [{ MAX_FILE_SIZE: 'invalid' }, 100_000_000, 10_000_000_000],
  [{ MAX_FILE_SIZE: '2147483648' }, 100_000_000, 2147483648],
  [{ PART_SIZE: 'invalid', MAX_PARTS: '-1' }, 100_000_000, 10_000_000_000],
]) {
  const env = environment({ BUCKET: bucket, ...overrides });
  const cfg = await config(env);
  assert.equal(cfg.partSize, partSize);
  assert.equal(cfg.maxFileSize, maxSize);
  const accepted = await init(env, Math.min(maxSize, 1_000_000));
  assert.equal(accepted.status, 200);
  assert.equal((await accepted.json()).partSize, partSize);
  assert.equal((await init(env, maxSize + 1)).status, 413);
}
// Lowering the limit must also block already-created multipart sessions.
const lowered = { ...r2, MAX_FILE_SIZE: '1000' };
assert.equal((await request(lowered, `/api/uploads/${session.uploadId}/parts/1`, {
  method: 'PUT', body: 'x',
})).status, 413);
assert.equal((await request(lowered, `/api/uploads/${session.uploadId}/complete`, {
  method: 'POST', body: JSON.stringify({ parts: [] }),
})).status, 413);

// A forged declared size cannot publish an oversized actual R2 object.
let deleted = false;
const forged = environment({ MAX_FILE_SIZE: '100', BUCKET: {
  ...bucket,
  resumeMultipartUpload() { return { async complete() { return { size: 101 }; } }; },
  async delete() { deleted = true; },
} });
const small = await (await init(forged, 100)).json();
const rejected = await request(forged, `/api/uploads/${small.uploadId}/complete`, {
  method: 'POST', body: JSON.stringify({ parts: [{ partNumber: 1, etag: 'test' }] }),
});
assert.equal(rejected.status, 413);
assert.equal(deleted, true);
assert.equal(await forged.fileKV.get('u:' + small.uploadId), null);
console.log('PASS: size boundaries, overrides, existing-session limits and oversized-object cleanup');
