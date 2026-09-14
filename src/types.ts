export interface Env {
  /** 元数据库二选一:KV(默认,免建 D1)或 D1(强一致);都绑定时优先 KV */
  KV?: KVNamespace;
  DB?: D1Database;
  /** 文件存储二选一:绑 BUCKET = 大存储模式(R2 分片,~2GB);不绑 = 小存储模式(KV 直存,≤24MB,需绑 KV) */
  BUCKET?: R2Bucket;
  ASSETS: Fetcher;
  ADMIN_TOKEN: string;
  /** 可选 secret:自定义管理后台入口路径(如 /panel-x7k9);设置后 /admin 返回 404 */
  ADMIN_PATH?: string;
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
