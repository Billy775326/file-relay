import type { Env } from './types';
import { getStore } from './store';

/** Decimal GB; independent of the per-file policy limit. */
export const R2_CAPACITY_MAX = 9_990_000_000;
export const QUOTA_KEY = '__file-relay/quota-v1.json';
type Ledger = { version: 1; revision: string; files: Record<string, number> };
export class CapacityError extends Error {
  constructor() { super('容量超出免费额度'); }
}

async function readLedger(bucket: R2Bucket) {
  const object = await bucket.get(QUOTA_KEY);
  const ledger: Ledger = object ? await object.json() : { version: 1, revision: '', files: {} };
  if (ledger.version !== 1 || !ledger.files || typeof ledger.files !== 'object' ||
      Object.values(ledger.files).some((n) => !Number.isSafeInteger(n) || n < 1)) {
    throw new Error('R2 capacity ledger is invalid'); // Fail closed, never reset accounting silently.
  }
  return { object, ledger };
}

async function writeLedger(bucket: R2Bucket, ledger: Ledger, etag?: string) {
  ledger.revision = crypto.randomUUID(); // Avoid ABA when reservations return to the same values.
  return bucket.put(QUOTA_KEY, JSON.stringify(ledger), {
    onlyIf: etag ? { etagMatches: etag } : { etagDoesNotMatch: '*' },
    httpMetadata: { contentType: 'application/json' },
    storageClass: 'Standard',
  });
}

async function retryDelay(attempt: number) {
  if (attempt) await new Promise((resolve) => setTimeout(resolve, 1100 + Math.random() * 200));
}

/** Reserve before accepting bytes. R2 conditional writes serialize concurrent admission.
 * Completed files retain reservations until deletion, so completion/listing races cannot
 * undercount them. Existing/unmanaged bucket objects are included in every admission scan.
 */
export async function reserveCapacity(env: Env, key: string, size: number): Promise<void> {
  if (size > R2_CAPACITY_MAX) throw new CapacityError();
  const bucket = env.BUCKET!;
  for (let attempt = 0; attempt < 5; attempt++) {
    await retryDelay(attempt);
    const { object, ledger } = await readLedger(bucket);
    if (ledger.files[key] === size) return; // Already reserved, including uploads finishing at the cap.
    if (ledger.files[key] !== undefined) throw new Error('R2 reservation size mismatch');

    // Bootstrap sessions created before this feature. No TTL-based release: bytes must
    // actually be aborted/deleted before their reservation can be reclaimed.
    if (!object) {
      for (const session of await getStore(env).listStaleSessions(Date.now() + 1, 0)) {
        ledger.files[session.r2Key] = session.size;
      }
    }
    const sizes = new Map(Object.entries(ledger.files));
    let cursor: string | undefined;
    let overhead = 0;
    let pages = 0;
    do {
      if (++pages > 500) throw new Error('R2 capacity scan exceeds request budget');
      const page = await bucket.list({ cursor, limit: 1000 });
      for (const file of page.objects) {
        if (file.key === QUOTA_KEY) { overhead = file.size; continue; }
        sizes.set(file.key, Math.max(file.size, sizes.get(file.key) ?? 0));
      }
      cursor = page.truncated ? page.cursor : undefined;
      if (page.truncated && !cursor) throw new Error('Invalid R2 pagination');
    } while (cursor);
    const used = [...sizes.values()].reduce((sum, n) => sum + n, 0);
    ledger.files[key] = size;
    // Include the bookkeeping object's bytes too, reserving fixed-length revision space.
    const nextOverhead = new TextEncoder().encode(JSON.stringify({ ...ledger, revision: '0'.repeat(36) })).byteLength;
    const addition = sizes.has(key) ? 0 : size;
    if (used + overhead >= R2_CAPACITY_MAX || used + addition + Math.max(overhead, nextOverhead) > R2_CAPACITY_MAX) {
      throw new CapacityError();
    }
    try {
      if (await writeLedger(bucket, ledger, object?.etag)) return;
    } catch (e) {
      // R2 limits writes to the same key; contention is retried, other failures block admission.
      if (!/429|rate|too many/i.test(String(e))) throw e;
    }
  }
  throw new Error('R2 capacity accounting busy; retry upload');
}

/** Call only after the object/unfinished multipart bytes have actually been removed. */
export async function releaseCapacity(env: Env, keys: string[]): Promise<void> {
  if (!env.BUCKET || keys.length === 0) return;
  for (let attempt = 0; attempt < 5; attempt++) {
    await retryDelay(attempt);
    const { object, ledger } = await readLedger(env.BUCKET);
    if (!object || !keys.some((key) => ledger.files[key] !== undefined)) return;
    for (const key of keys) delete ledger.files[key];
    try {
      if (await writeLedger(env.BUCKET, ledger, object.etag)) return;
    } catch (e) {
      if (!/429|rate|too many/i.test(String(e))) throw e;
    }
  }
  throw new Error('R2 capacity release busy; retry cleanup');
}
