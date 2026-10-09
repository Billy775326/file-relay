import assert from 'node:assert/strict';
import { build } from 'esbuild';
const output = await build({ entryPoints: ['src/quota.ts'], bundle: true, format: 'esm', platform: 'node', write: false });
const { reserveCapacity, releaseCapacity, R2_CAPACITY_MAX: cap, QUOTA_KEY, CapacityError } = await import(
  'data:text/javascript;base64,' + Buffer.from(output.outputFiles[0].text).toString('base64')
);

function fixture(initial = [], sessions = []) {
  const objects = new Map(initial.map(([key, size]) => [key, { key, size }]));
  let version = 0;
  let writes = 0;
  const env = {
    fileKV: {
      async list() { return { list_complete: true, keys: sessions.map((s) => ({ name: 'u:' + s.id, metadata: { t: 1 } })) }; },
      async get(key) { return sessions.find((s) => key === 'u:' + s.id) ?? null; },
    },
    BUCKET: {
      async get(key) {
        const record = objects.get(key);
        return record ? { ...record, async json() { return JSON.parse(record.value); } } : null;
      },
      async list({ cursor }) {
        // Tiny pages ensure admission scans all pages, including unrelated bucket files.
        const start = Number(cursor ?? 0);
        const all = [...objects.values()];
        const truncated = start + 2 < all.length;
        return { objects: all.slice(start, start + 2), truncated, cursor: truncated ? String(start + 2) : undefined };
      },
      async put(key, value, { onlyIf }) {
        const old = objects.get(key);
        if (onlyIf.etagMatches && onlyIf.etagMatches !== old?.etag) return null;
        if (onlyIf.etagDoesNotMatch === '*' && old) return null;
        const record = { key, value, size: Buffer.byteLength(value), etag: String(++version) };
        objects.set(key, record);
        writes++;
        return record;
      },
    },
  };
  return { env, objects, writes: () => writes };
}

for (const size of [cap, cap + 1]) {
  const f = fixture([['existing', size]]);
  await assert.rejects(reserveCapacity(f.env, 'new', 1), CapacityError);
  assert.equal(f.writes(), 0);
}
const crossing = fixture([['existing', cap - 1000]]);
await assert.rejects(reserveCapacity(crossing.env, 'new', 1001), CapacityError);

const paged = fixture([['a', 1], ['b', 1], ['c', cap]]);
await assert.rejects(reserveCapacity(paged.env, 'new', 1), CapacityError);

const race = fixture([['existing', cap - 2000]]);
const results = await Promise.allSettled([
  reserveCapacity(race.env, 'upload-a', 1200),
  reserveCapacity(race.env, 'upload-b', 1200),
]);
assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
assert.ok(results.find((r) => r.status === 'rejected').reason instanceof CapacityError);
const ledger = JSON.parse(race.objects.get(QUOTA_KEY).value);
const winner = Object.keys(ledger.files)[0];
await reserveCapacity(race.env, winner, 1200); // Idempotent at full reserved capacity.
await releaseCapacity(race.env, [winner]);
await reserveCapacity(race.env, 'replacement', 1200);

const completed = fixture([['existing', cap - 3000]]);
await reserveCapacity(completed.env, 'done', 1000);
completed.objects.set('done', { key: 'done', size: 1000 });
await reserveCapacity(completed.env, 'next', 1000); // Do not count completed reservation twice.
completed.objects.delete('done');
await releaseCapacity(completed.env, ['done']);
await reserveCapacity(completed.env, 'after-delete', 1000);

const legacy = fixture([], [{ id: 'old', r2Key: 'old-file', size: cap - 500 }]);
await assert.rejects(reserveCapacity(legacy.env, 'new', 600), CapacityError);

const failed = fixture();
failed.env.BUCKET.list = async () => { throw new Error('storage unavailable'); };
await assert.rejects(reserveCapacity(failed.env, 'new', 1), /storage unavailable/);
assert.equal(failed.writes(), 0);
console.log('PASS: 9.99 GB threshold, projected usage, pagination, concurrent reservations, release, legacy sessions and fail-closed');
