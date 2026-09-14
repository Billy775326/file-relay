import { num, type Env } from './types';

interface ExpiredRow {
  id: string;
  kind: string;
  r2_key: string | null;
}

interface StaleSessionRow {
  id: string;
  r2_key: string;
  upload_id: string;
}

/**
 * 定时清理(scheduled / 本地 --test-scheduled 均调用):
 * 1. 过期分享:分批删行 + 对应 R2 对象(单次最多 20 批,余量留给下个周期)
 * 2. 孤儿 multipart 会话(超 SESSION_TTL_MS 未 complete):abort + 删台账
 *
 * 正确性不依赖本函数——所有读路径都有惰性有效性检查;这里只负责回收存储。
 */
export async function runCleanup(env: Env): Promise<{ deletedShares: number; abortedSessions: number }> {
  const now = Date.now();
  let deletedShares = 0;
  let abortedSessions = 0;

  for (let round = 0; round < 20; round++) {
    const rows = await env.DB.prepare(
      'SELECT id, kind, r2_key FROM shares WHERE expire_at IS NOT NULL AND expire_at <= ?1 LIMIT 100',
    )
      .bind(now)
      .all<ExpiredRow>();
    const list = rows.results ?? [];
    if (list.length === 0) break;

    const keys = list.filter((r) => r.kind === 'file' && r.r2_key).map((r) => r.r2_key as string);
    if (keys.length > 0) await env.BUCKET.delete(keys);

    await env.DB.batch(list.map((r) => env.DB.prepare('DELETE FROM shares WHERE id = ?1').bind(r.id)));
    deletedShares += list.length;
  }

  const ttl = num(env.SESSION_TTL_MS, 86_400_000);
  const stale = await env.DB.prepare('SELECT id, r2_key, upload_id FROM upload_sessions WHERE created_at < ?1')
    .bind(now - ttl)
    .all<StaleSessionRow>();

  for (const s of stale.results ?? []) {
    try {
      await env.BUCKET.resumeMultipartUpload(s.r2_key, s.upload_id).abort();
    } catch {
      // 已中止/不存在,忽略
    }
    await env.DB.prepare('DELETE FROM upload_sessions WHERE id = ?1').bind(s.id).run();
    abortedSessions++;
  }

  return { deletedShares, abortedSessions };
}
