import assert from 'node:assert/strict';
import { build } from 'esbuild';
const bundle = await build({ entryPoints: ['src/filestore.ts'], bundle: true, platform: 'node', format: 'esm', write: false });
const { inspectFile, readFilePrefix } = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
assert.equal((await inspectFile({}, null)).state, 'missing');
assert.equal((await inspectFile({}, 'f:old')).state, 'unknown');
assert.equal((await inspectFile({}, 'old-r2')).state, 'unknown');
assert.equal((await inspectFile({ BUCKET: { head: async () => null } }, 'gone')).state, 'missing');
assert.equal((await inspectFile({ BUCKET: { head: async () => { throw new Error('simulated outage'); } } }, 'unavailable')).state, 'unknown');
const uploaded = new Date('2026-01-01T00:00:00Z');
assert.deepEqual(await inspectFile({ BUCKET: {
  head: async () => ({ size: 9_900_000_000, uploaded }),
  get: () => { throw new Error('File body must not be fetched'); },
} }, 'large'), { state: 'available', size: 9_900_000_000, uploadedAt: uploaded.getTime() });
let cancelled = false;
assert.equal((await inspectFile({ fileKV: { get: async (key, type) => {
  assert.equal(key, 'f:test'); assert.equal(type, 'stream');
  return { cancel: async () => { cancelled = true; } };
} } }, 'f:test')).state, 'available');
assert.equal(cancelled, true);
assert.equal((await inspectFile({ fileKV: { get: async () => null } }, 'f:gone')).state, 'missing');
assert.equal((await inspectFile({ fileKV: { get: async () => { throw new Error('simulated outage'); } } }, 'f:unknown')).state, 'unknown');
console.log('PASS file inspection: metadata only, KV stream cancellation, missing objects, unavailable backends and outages');
let prefixCancelled = false;
const prefix = await readFilePrefix({ fileKV: { get: async () => new ReadableStream({
  start(c) { c.enqueue(new Uint8Array(100_000).fill(65)); }, cancel() { prefixCancelled = true; },
}) } }, 'f:large', 65537);
assert.equal(prefix.length, 65537);
assert.equal(prefixCancelled, true);
const range = await readFilePrefix({ BUCKET: {
  head: async () => ({ size: 9_900_000_000 }),
  get: async (_, options) => {
    assert.deepEqual(options.range, { offset: 0, length: 65537 });
    return { body: new ReadableStream({ start(c) { c.enqueue(new Uint8Array(65537)); c.close(); } }) };
  },
} }, 'large', 65537);
assert.equal(range.length, 65537);
assert.equal(await readFilePrefix({ BUCKET: { head: async () => null } }, 'missing', 100), null);
await assert.rejects(readFilePrefix({ fileKV: { get: async () => new ReadableStream({ start(c) { c.error(new Error('read failed')); } }) } }, 'f:broken', 100));
console.log('PASS bounded prefix: KV cancellation, 9.9 GB R2 range, missing objects and stream failure');
