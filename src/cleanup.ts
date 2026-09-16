import { num, type Env } from './types';
import { getStore } from './store';
import { deleteFile, isKvFileKey } from './filestore';

/**
 * 定时清理(scheduled / 本地 --test-scheduled 均调用),存储后端通用:
 * 1. 过期分享:分批删元数据 + 对应文件(R2 批量删 / KV 键逐删,按存储键前缀路由)
 * 2. 孤儿 multipart 会话(超 SESSION_TTL_MS 未 complete):abort + 删台账(仅大存储模式产生)
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

    const r2Keys = expired.filter((r) => r.r2Key && !isKvFileKey(r.r2Key)).map((r) => r.r2Key as string);
    if (r2Keys.length > 0 && env.BUCKET) await env.BUCKET.delete(r2Keys); // R2 支持批量
    await Promise.all(expired.filter((r) => r.r2Key && isKvFileKey(r.r2Key)).map((r) => deleteFile(env, r.r2Key)));
    await store.deleteByCodes(expired.map((r) => r.code));
    deletedShares += expired.length;
  }

  const ttl = num(env.SESSION_TTL_MS, 86_400_000);
  const stale = await store.listStaleSessions(now, ttl);
  for (const s of stale) {
    try {
      // 大存储模式的会话;若部署已切走(BUCKET 未绑)则跳过 abort,仅清台账
      await env.BUCKET?.resumeMultipartUpload(s.r2Key, s.uploadId).abort();
    } catch {
      // 已中止/不存在,忽略
    }
    await store.deleteSession(s.id);
    abortedSessions++;
  }

  return { deletedShares, abortedSessions };
}

const CLEANUP_INTERVAL_MS = 6 * 3_600_000;
const CLEANUP_MARK_KEY = 'sys:cleanup-at'; // 键空间:s:分享 u:会话 f:文件,sys: 系统标记

/**
 * 访客触发的节流清理:首页挂 waitUntil 调用(Pages 无 Cron Triggers 的零依赖补偿)。
 * 6h 窗口内最多真正执行一次——节流标记存 fileKV;D1 元数据模式未绑 KV 时跳过节流
 * (D1 扫描本身廉价)。任何失败静默:清理是尽力而为,绝不影响访客请求。
 */
export async function cleanupIfDue(env: Env): Promise<void> {
  try {
    if (env.fileKV) {
      const last = Number(await env.fileKV.get(CLEANUP_MARK_KEY));
      if (Number.isFinite(last) && Date.now() - last < CLEANUP_INTERVAL_MS) return;
      await env.fileKV.put(CLEANUP_MARK_KEY, String(Date.now()));
    }
    await runCleanup(env);
  } catch {
    // 失败等下个窗口重来
  }
}
