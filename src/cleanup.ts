import { num, type Env } from './types';
import { getStore } from './store';

/**
 * 定时清理(scheduled / 本地 --test-scheduled 均调用),D1/KV 后端通用:
 * 1. 过期分享:分批删元数据 + 对应 R2 对象(单次最多 20 批,余量留给下个周期)
 * 2. 孤儿 multipart 会话(超 SESSION_TTL_MS 未 complete):abort + 删台账
 *
 * 正确性不依赖本函数——所有读路径都有惰性有效性检查;这里只负责回收存储。
 */
export async function runCleanup(env: Env): Promise<{ deletedShares: number; abortedSessions: number }> {
  const now = Date.now();
  const store = getStore(env);
  let deletedShares = 0;
  let abortedSessions = 0;

  for (let round = 0; round < 20; round++) {
    const expired = await store.listExpiredShares(now, 100);
    if (expired.length === 0) break;

    const keys = expired.filter((r) => r.r2Key).map((r) => r.r2Key as string);
    if (keys.length > 0) await env.BUCKET.delete(keys);
    await store.deleteByCodes(expired.map((r) => r.code));
    deletedShares += expired.length;
  }

  const ttl = num(env.SESSION_TTL_MS, 86_400_000);
  const stale = await store.listStaleSessions(now, ttl);
  for (const s of stale) {
    try {
      await env.BUCKET.resumeMultipartUpload(s.r2Key, s.uploadId).abort();
    } catch {
      // 已中止/不存在,忽略
    }
    await store.deleteSession(s.id);
    abortedSessions++;
  }

  return { deletedShares, abortedSessions };
}
