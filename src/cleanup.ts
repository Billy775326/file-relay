import { num, type Env } from './types';
import { getStore, type SessionRecord } from './store';
import { deleteFileKeys, shareFileKeys, isKvFileKey } from './filestore';
import { DRAFT_CLEANUP_GRACE } from './batch';
import { releaseCapacity } from './quota';
import { getRetentionDays, RETENTION_DAY_MS } from './settings';

/**
 * 定时清理(scheduled / 本地 --test-scheduled 均调用),存储后端通用:
 * 1. 超过过期保留期的分享:分批删元数据 + 对应文件(R2 批量删 / KV 键逐删,按存储键前缀路由)
 * 2. 孤儿 multipart 会话(超 SESSION_TTL_MS 未 complete):abort + 删台账(仅大存储模式产生)
 *
 * 公开取件仍检查有效期和次数;管理员可读取尚未清理的文件。本函数负责回收存储。
 */
export async function runCleanup(env: Env): Promise<{ deletedShares: number; abortedSessions: number }> {
  const now = Date.now();
  const store = getStore(env);
  const cutoff = now - (await getRetentionDays(env)) * RETENTION_DAY_MS;
  let deletedShares = 0;
  let abortedSessions = 0;

  for (let round = 0; round < 20; round++) {
    const expired = await store.listExpiredShares(cutoff, 100);
    if (expired.length === 0) break;

    const ready = expired.filter(record => shareFileKeys(record).every(key => isKvFileKey(key) ? !!env.fileKV : !!env.BUCKET));
    if (!ready.length) break;
    await deleteFileKeys(env, ready.flatMap(shareFileKeys));
    await store.deleteByCodes(ready.map(record => record.code));
    deletedShares += ready.length;
    if (ready.length < expired.length) break;
  }

  const ttl = num(env.SESSION_TTL_MS, 86_400_000);
  const stale = await store.listStaleSessions(now, ttl);
  const aborted = new Set<string>();
  async function closeSession(s: SessionRecord, draft: boolean) {
    if (aborted.has(s.id)) return true;
    if (s.batchCode && !env.BUCKET) return false;
    let objectExists = false;
    try {
      // 大存储模式的会话;若部署已切走(BUCKET 未绑)则跳过 abort,仅清台账
      objectExists = s.batchCode ? !!await env.BUCKET?.head(s.r2Key) : false;
      if (!objectExists) {
        await env.BUCKET?.resumeMultipartUpload(s.r2Key, s.uploadId).abort();
      }
    } catch {
      return false; // Keep the session and reservation for a later retry.
    }
    if (!draft && env.BUCKET && !objectExists && !(await env.BUCKET.head(s.r2Key))) await releaseCapacity(env, [s.r2Key]);
    await store.deleteSession(s.id);
    aborted.add(s.id);
    if (!objectExists) abortedSessions++;
    return true;
  }
  const batchDeadlines = new Map<string, number | null>();
  for (const session of stale) {
    const code = session.batchCode;
    if (code && !batchDeadlines.has(code)) {
      batchDeadlines.set(code, (await store.getBatch(code))?.draftUntil ?? null);
    }
    // Batch deadlines are fixed at admission, even if the operator changes the session TTL.
    if (code && batchDeadlines.get(code)) continue;
    await closeSession(session, false);
  }

  // Leave a propagation window after the upload deadline before deleting staged bytes.
  for (const draft of await store.listExpiredDrafts(now - DRAFT_CLEANUP_GRACE, 4)) {
    let canDelete = true;
    for (const file of draft.files ?? []) {
      if (!file.sessionId || aborted.has(file.sessionId)) continue;
      const session = await store.getSession(file.sessionId);
      if (session && !await closeSession(session, true)) { canDelete = false; break; }
    }
    if (!canDelete) continue;
    if (await deleteFileKeys(env, shareFileKeys(draft))) await store.deleteByCode(draft.code);
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
