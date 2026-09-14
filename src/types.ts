export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  ASSETS: Fetcher;
  ADMIN_TOKEN: string;
  // 以下均为 wrangler.jsonc vars,运行时是 string
  MAX_FILE_SIZE: string;
  MAX_TEXT_LENGTH: string;
  PART_SIZE: string;
  SESSION_TTL_MS: string;
  MAX_PARTS: string;
}

/** 解析 vars 里的正整数,非法或缺失时回退默认值 */
export function num(v: string | undefined, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
