import { sourceSummary } from './upload-source';
import { sameShareContent, sameShareRules, shareStatusOf } from './store';
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
  d?: number; // Draft deadline; excluded from public and admin listings.
  f?: number;
  o?: string; // Base64 source summary; full IP stays only in the private record.
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
    d: v.draftUntil ?? undefined,
    f: v.files?.length,
    o: v.source ? b64encode(JSON.stringify(sourceSummary(v.source))) : undefined,
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
    async visitorShares(visitorId) {
      const matches = (await scanShareMeta(kv))
        .filter(({ m }) => !m.d && m.o && JSON.parse(b64decode(m.o)).visitorId === visitorId)
        .sort((a, b) => b.m.t - a.m.t || a.code.localeCompare(b.code)).slice(0, 10);
      const records = await Promise.all(matches.map(({ code }) => kv.get<ShareRecord>(SHARE_PREFIX + code, 'json')));
      return records.filter((record): record is ShareRecord => !!record && !record.draftUntil && record.source?.visitorId === visitorId);
    },
    async getVisitorNotes(ids) {
      const notes = new Map<string, string>();
      // KV bulk reads accept at most 100 keys; avoid a subrequest for every list row.
      for (let i = 0; i < ids.length; i += 100) {
        const batch = ids.slice(i, i + 100);
        const values = await kv.get(batch.map(id => 'v:' + id), 'text');
        for (const id of batch) notes.set(id, values.get('v:' + id) ?? '');
      }
      return notes;
    },
    async getVisitorNote(id) { return (await kv.get('v:' + id)) ?? ''; },
    async setVisitorNote(id, note) {
      if (note) await kv.put('v:' + id, note);
      else await kv.delete('v:' + id);
    },
    async createShare(s, closeSessionId) {
      for (let i = 0; i < MAX_CODE_RETRIES; i++) {
        const code = randCode();
        if ((await kv.get(SHARE_PREFIX + code)) !== null) continue; // 先查后写,尽力防碰撞
        const rec: ShareRecord = {
          files: s.files,
          draftUntil: s.draftUntil,
          source: s.source ?? null,
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
      const record = await kv.get<ShareRecord>(SHARE_PREFIX + code, 'json');
      return record?.draftUntil ? null : record;
    },

    async getBatch(code) {
      const record = await kv.get<ShareRecord>(SHARE_PREFIX + code, 'json');
      return record?.files ? record : null;
    },

    async publishBatch(code, id) {
      const record = await kv.get<ShareRecord>(SHARE_PREFIX + code, 'json');
      const now = Date.now();
      if (record?.id !== id || !record.draftUntil || record.draftUntil <= now) return null;
      const updated = { ...record, draftUntil: null, createdAt: now,
        expireAt: record.expireAt === null ? null : now + record.expireAt - record.createdAt };
      await kv.put(SHARE_PREFIX + code, JSON.stringify(updated), { metadata: metaOf(updated) });
      return updated;
    },

    async updateRules(code, expected, rules, cleanupCutoff) {
      const record = await kv.get<ShareRecord>(SHARE_PREFIX + code, 'json');
      if (!record || record.draftUntil || !sameShareRules(record, expected) ||
          (record.expireAt !== null && record.expireAt <= cleanupCutoff)) return null;
      const updated = { ...record, ...rules };
      await kv.put(SHARE_PREFIX + code, JSON.stringify(updated), { metadata: metaOf(updated) });
      return updated;
    },

    async updateShare(code, expected, update, cleanupCutoff) {
      const record = await kv.get<ShareRecord>(SHARE_PREFIX + code, 'json');
      if (!record || record.draftUntil || !sameShareContent(record, expected) ||
          (record.expireAt !== null && record.expireAt <= cleanupCutoff)) return null;
      const updated = { ...record, ...update };
      await kv.put(SHARE_PREFIX + code, JSON.stringify(updated), { metadata: metaOf(updated) });
      return updated;
    },

    async tryPickup(code, opts) {
      const v = await kv.get<ShareRecord>(SHARE_PREFIX + code, 'json');
      if (!v || v.draftUntil || (opts?.id && opts.id !== v.id) || (opts?.kind && opts.kind !== v.kind)) return null;
      if (opts?.textOnly && v.kind !== 'text') return null;
      const now = Date.now();
      if (v.expireAt !== null && v.expireAt <= now) return null;
      if (v.maxPickups !== null && v.pickupCount >= v.maxPickups) return null;
      v.pickupCount++; // 读改写非原子:并发取件可能超次数(KV 无条件写)
      await kv.put(SHARE_PREFIX + code, JSON.stringify(v), { metadata: metaOf(v) });
      return v;
    },

    async listShares(limit, offset, filter = {}) {
      const scanned = await scanShareMeta(kv);
      const now = Date.now(), q = filter.q?.trim().toLowerCase();
      const all = scanned.filter(({ code, m }) => {
        if (m.d) return false;
        if (filter.kind && m.k !== filter.kind) return false;
        if (filter.status && shareStatusOf(m.e, m.m, m.c, now) !== filter.status) return false;
        if (!q) return true;
        const source = m.o ? sourceSummary(JSON.parse(b64decode(m.o))) : null;
        return [code, m.n ? b64decode(m.n) : '', source?.visitorId ?? ''].some(value => value.toLowerCase().includes(q));
      }).sort((a, b) => b.m.t - a.m.t);
      const page = all.slice(offset, offset + limit);
      // KV 的 list 索引反映删除最长滞后约 60s,而 get 立即可见:刚删的口令会在管理列表
      // "死而复生"。逐行 get 验活滤掉幽灵行(管理页专用路径,≤limit 次读可接受);
      // subrequest 预算吃紧(免费档 50 次/请求)时退化为不校验,60s 后自然收敛。
      let kept = page;
      const budget = 48 - Math.ceil(scanned.length / 1000);
      if (page.length > 0 && page.length <= budget) {
        const alive = await Promise.all(
          page.map((x) => kv.get(SHARE_PREFIX + x.code).then((v) => v !== null)),
        );
        kept = page.filter((_, i) => alive[i]);
      }
      const rows = kept.map(({ code, m }): ShareListRow => ({
        source: m.o ? sourceSummary(JSON.parse(b64decode(m.o))) : null,
        id: m.id, code, kind: m.k,
        filename: m.n ? b64decode(m.n) : null,
        size: m.s, fileCount: m.f,
        pickupCount: m.c, maxPickups: m.m, expireAt: m.e, createdAt: m.t,
        textPreview: m.p ? b64decode(m.p) : null,
      }));
      // total 同步扣除本页发现的幽灵行(其他页的幽灵由 60s 自然收敛,统计页同样有此偏差)
      return { total: Math.max(0, all.length - (page.length - kept.length)), rows };
    },

    async stats(todayStart) {
      const now = Date.now();
      const stats: ShareStats = { total: 0, files: 0, texts: 0, totalBytes: 0, active: 0, todayCreated: 0 };
      for (const { m } of await scanShareMeta(kv)) {
        if (m.d) continue;
        stats.total++;
        if (m.k === 'file') stats.files += m.f ?? 1;
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
      const expired = all.filter(({ m }) => !m.d && m.e !== null && m.e <= now).slice(0, limit);
      const keys = expired.filter(({ m }) => m.f).map(({ code }) => SHARE_PREFIX + code);
      const manifests = keys.length ? await kv.get(keys, 'json') : new Map();
      return expired.flatMap(({ code, m }) => {
        const record = manifests.get(SHARE_PREFIX + code) as ShareRecord | null;
        if (m.f && (!record?.files || record.draftUntil || record.expireAt === null || record.expireAt > now)) return [];
        return [{ code, r2Key: m.k === 'file' ? m.r : null, files: record?.files }];
      });
    },

    async listExpiredDrafts(now, limit) {
      const keys = (await scanShareMeta(kv)).filter(({ m }) => m.d && m.d <= now)
        .slice(0, limit).map(({ code }) => SHARE_PREFIX + code);
      if (!keys.length) return [];
      const records = await kv.get(keys, 'json');
      return [...records.values()].filter((record): record is ShareRecord => {
        const draft = record as ShareRecord | null;
        return !!draft?.draftUntil && draft.draftUntil <= now;
      });
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
