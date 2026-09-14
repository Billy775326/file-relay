/**
 * Workers KV 实现:免建 D1 的轻量后端(最终一致)。
 * 键空间:s:{口令} = 分享全量 JSON,metadata 携带列表/统计投影(list 免逐键 get);
 *        u:{会话token} = 分片上传会话 JSON,metadata.t = 创建时间(cron 扫孤儿用)。
 *
 * 与 D1 的语义差异(自用规模可接受,README 已注明):
 *  - tryPickup 读改写非原子,并发取件可能超出次数上限
 *  - 口令唯一靠先查后写,并发创建存在理论碰撞窗口
 *  - 显式生命周期(cron 删键)而非 KV TTL:会话键不能自动过期,否则孤儿 multipart
 *    无法找回 uploadId 去 abort;过期分享也需保留到 cron 回收 R2 对象之后
 */
import { randCode } from './code';
import type {
  SessionRecord,
  ShareListRow,
  ShareRecord,
  ShareStats,
  ShareStore,
} from './store';

const SHARE_PREFIX = 's:';
const SESSION_PREFIX = 'u:';
const MAX_CODE_RETRIES = 8;

/** KV metadata:扁平小对象(≤1KB),list/统计/清理扫它即可,无需 get 全量值。
 *  字符串字段(n/p)必须纯 ASCII——KV metadata 经 HTTP 头传输,Unicode 会触发
 *  workerd 警告甚至报错,故统一 base64(UTF-8) 编码。 */
interface ShareMeta {
  id: string;
  k: 'text' | 'file';
  n: string | null; // 文件名 base64(截断,列表展示用)
  s: number; // size
  t: number; // createdAt
  e: number | null; // expireAt
  c: number; // pickupCount
  m: number | null; // maxPickups
  r: string | null; // r2Key(仅 file)
  p: string | null; // 文本预览 base64(截断)
}

/** UTF-8 字符串 → ASCII-safe base64(元数据通道专用) */
function b64encode(s: string): string {
  return btoa(String.fromCharCode(...new TextEncoder().encode(s)));
}

function b64decode(s: string): string {
  try {
    // 非法 base64(如未编码的旧数据原文)直接按原文返回,atob 会静默丢字符产生乱码
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(s)) return s;
    return new TextDecoder().decode(Uint8Array.from(atob(s), (ch) => ch.charCodeAt(0)));
  } catch {
    return s;
  }
}

function metaOf(v: ShareRecord): ShareMeta {
  return {
    id: v.id,
    k: v.kind,
    n: v.filename ? b64encode(v.filename.slice(0, 40)) : null,
    s: v.size,
    t: v.createdAt,
    e: v.expireAt,
    c: v.pickupCount,
    m: v.maxPickups,
    r: v.kind === 'file' ? v.r2Key : null,
    p: v.kind === 'text' && v.text ? b64encode(v.text.slice(0, 32)) : null,
  };
}

async function scanShareMeta(kv: KVNamespace): Promise<Array<{ code: string; m: ShareMeta }>> {
  const out: Array<{ code: string; m: ShareMeta }> = [];
  let cursor: string | undefined;
  do {
    const page = await kv.list({ prefix: SHARE_PREFIX, cursor });
    for (const key of page.keys) {
      const m = key.metadata as ShareMeta | undefined;
      if (m) out.push({ code: key.name.slice(SHARE_PREFIX.length), m });
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return out;
}

export function createKVStore(kv: KVNamespace): ShareStore {
  return {
    async createShare(s, closeSessionId) {
      for (let i = 0; i < MAX_CODE_RETRIES; i++) {
        const code = randCode();
        if ((await kv.get(SHARE_PREFIX + code)) !== null) continue; // 先查后写,尽力防碰撞
        const rec: ShareRecord = {
          id: crypto.randomUUID(),
          code,
          kind: s.kind,
          filename: s.filename ?? null,
          size: s.size,
          mime: s.mime ?? null,
          r2Key: s.r2Key ?? null,
          text: s.text ?? null,
          maxPickups: s.maxPickups,
          pickupCount: 0,
          createdAt: Date.now(),
          expireAt: s.expireAt,
        };
        await kv.put(SHARE_PREFIX + code, JSON.stringify(rec), { metadata: metaOf(rec) });
        if (closeSessionId) await kv.delete(SESSION_PREFIX + closeSessionId);
        return { id: rec.id, code };
      }
      throw new Error('code-space-exhausted');
    },

    async getByCode(code) {
      return kv.get<ShareRecord>(SHARE_PREFIX + code, 'json');
    },

    async tryPickup(code, opts) {
      const v = await kv.get<ShareRecord>(SHARE_PREFIX + code, 'json');
      if (!v) return null;
      if (opts?.textOnly && v.kind !== 'text') return null;
      const now = Date.now();
      if (v.expireAt !== null && v.expireAt <= now) return null;
      if (v.maxPickups !== null && v.pickupCount >= v.maxPickups) return null;
      v.pickupCount++; // 读改写非原子:并发取件可能超次数(KV 无条件写)
      await kv.put(SHARE_PREFIX + code, JSON.stringify(v), { metadata: metaOf(v) });
      return v;
    },

    async listShares(limit, offset) {
      const all = (await scanShareMeta(kv)).sort((a, b) => b.m.t - a.m.t);
      const rows = all.slice(offset, offset + limit).map(({ code, m }): ShareListRow => ({
        id: m.id, code, kind: m.k,
        filename: m.n ? b64decode(m.n) : null,
        size: m.s,
        pickupCount: m.c, maxPickups: m.m, expireAt: m.e, createdAt: m.t,
        textPreview: m.p ? b64decode(m.p) : null,
      }));
      return { total: all.length, rows };
    },

    async stats(todayStart) {
      const now = Date.now();
      const stats: ShareStats = { total: 0, files: 0, texts: 0, totalBytes: 0, active: 0, todayCreated: 0 };
      for (const { m } of await scanShareMeta(kv)) {
        stats.total++;
        if (m.k === 'file') stats.files++;
        else stats.texts++;
        stats.totalBytes += m.s;
        if ((m.e === null || m.e > now) && (m.m === null || m.c < m.m)) stats.active++;
        if (m.t >= todayStart) stats.todayCreated++;
      }
      return stats;
    },

    async deleteByCode(code) {
      await kv.delete(SHARE_PREFIX + code);
    },

    async createSession(s) {
      await kv.put(SESSION_PREFIX + s.id, JSON.stringify(s), { metadata: { t: s.createdAt } });
    },

    async getSession(id) {
      return kv.get<SessionRecord>(SESSION_PREFIX + id, 'json');
    },

    async deleteSession(id) {
      await kv.delete(SESSION_PREFIX + id);
    },

    async listExpiredShares(now, limit) {
      const all = await scanShareMeta(kv);
      return all
        .filter(({ m }) => m.e !== null && m.e <= now)
        .slice(0, limit)
        .map(({ code, m }) => ({ code, r2Key: m.k === 'file' ? m.r : null }));
    },

    async deleteByCodes(codes) {
      await Promise.all(codes.map((code) => kv.delete(SHARE_PREFIX + code)));
    },

    async listStaleSessions(now, ttlMs) {
      const cutoff = now - ttlMs;
      const out: SessionRecord[] = [];
      let cursor: string | undefined;
      do {
        const page = await kv.list({ prefix: SESSION_PREFIX, cursor });
        for (const key of page.keys) {
          const t = (key.metadata as { t?: number } | undefined)?.t;
          if (typeof t === 'number' && t < cutoff) {
            const s = await kv.get<SessionRecord>(key.name, 'json');
            if (s) out.push(s);
          }
        }
        cursor = page.list_complete ? undefined : page.cursor;
      } while (cursor);
      return out;
    },
  };
}
