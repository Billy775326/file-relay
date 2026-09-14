const CODE_SPACE = 1_000_000;
// 2^32 内能被 100 万整除的最大值,拒绝采样消除模偏差
const RAND_LIMIT = Math.floor(4_294_967_296 / CODE_SPACE) * CODE_SPACE;

/** 生成 6 位随机数字口令(000000-999999 均匀分布) */
export function randCode(): string {
  const buf = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buf);
    if (buf[0] < RAND_LIMIT) return String(buf[0] % CODE_SPACE).padStart(6, '0');
  }
}

/** D1 唯一约束冲突(口令或 r2_key 碰撞) */
export function isUniqueViolation(e: unknown): boolean {
  return e instanceof Error && e.message.includes('UNIQUE constraint failed');
}
