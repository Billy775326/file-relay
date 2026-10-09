import { num, type Env } from './types';

// https://developers.cloudflare.com/kv/platform/limits/
export const KV_VALUE_MAX = 25 * 1024 ** 2;
/** Whole-file policy limit (decimal 10 GB), overridable via MAX_FILE_SIZE. */
export const DEFAULT_MAX_FILE_SIZE = 10_000_000_000;
// Browser uploads pass through a Worker: Free request bodies are capped at
// 100 MB (decimal), even though R2 itself accepts much larger parts.
export const WORKER_REQUEST_MAX = 100_000_000;
export const R2_PART_MIN = 5 * 1024 ** 2;
export const R2_PARTS_MAX = 10_000;
export const R2_OBJECT_MAX = 5 * 1024 ** 4 - 5 * 1024 ** 3;

export function uploadPartSize(env: Env): number {
  return Math.max(R2_PART_MIN, Math.min(WORKER_REQUEST_MAX, Math.floor(num(env.PART_SIZE, WORKER_REQUEST_MAX))));
}

export function uploadMaxParts(env: Env): number {
  return Math.max(1, Math.min(R2_PARTS_MAX, Math.floor(num(env.MAX_PARTS, R2_PARTS_MAX))));
}

export function r2FileMax(env: Env): number {
  return Math.min(R2_OBJECT_MAX, uploadPartSize(env) * uploadMaxParts(env));
}
