/**
 * D1 实现:强一致后端(默认)。
 * 取件计数靠单条原子 UPDATE ... WHERE 有效性谓词 RETURNING;
 * 口令唯一靠 UNIQUE 约束 + 碰撞换码重试;会话关闭与分享落库走 batch。
 */
import { randCode, isUniqueViolation } from './code';
import type {
  NewShare,
  SessionRecord,
  ShareListRow,
  ShareRecord,
  ShareStats,
  ShareStore,
} from './store';

interface ShareRow {
  id: string;
  code: string;
  kind: 'text' | 'file';
  filename: string | null;
  size: number;
  mime: string | null;
  r2_key: string | null;
  text: string | null;
  max_pickups: number | null;
  pickup_count: number;
  created_at: number;
  expire_at: number | null;
}

interface SessionRow {
  id: string;
  upload_id: string;
  r2_key: string;
  filename: string | null;
  mime: string | null;
  size: number;
  parts: number;
  expiry: string | null;
  max_pickups: number | null;
  created_at: number;
}

const MAX_CODE_RETRIES = 8;
const SHARE_COLUMNS =
  'id, code, kind, filename, size, mime, r2_key, text, max_pickups, pickup_count, created_at, expire_at';

const toRec = (r: ShareRow): ShareRecord => ({
  id: r.id,
  code: r.code,
  kind: r.kind,
  filename: r.filename,
  size: r.size,
  mime: r.mime,
  r2Key: r.r2_key,
  text: r.text,
  maxPickups: r.max_pickups,
  pickupCount: r.pickup_count,
  createdAt: r.created_at,
  expireAt: r.expire_at,
});

const toSession = (r: SessionRow): SessionRecord => ({
  id: r.id,
  uploadId: r.upload_id,
  r2Key: r.r2_key,
  filename: r.filename,
  mime: r.mime,
  size: r.size,
  parts: r.parts,
  expiry: r.expiry,
  maxPickups: r.max_pickups,
  createdAt: r.created_at,
});

function insertShareStmt(db: D1Database, id: string, code: string, s: NewShare, now: number): D1PreparedStatement {
  return db
    .prepare(
      `INSERT INTO shares
        (id, code, kind, filename, size, mime, r2_key, text, max_pickups, pickup_count, created_at, expire_at)
       VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,0,?10,?11)`,
    )
    .bind(
      id, code, s.kind, s.filename ?? null, s.size, s.mime ?? null,
      s.r2Key ?? null, s.text ?? null, s.maxPickups, now, s.expireAt,
    );
}

export function createD1Store(db: D1Database): ShareStore {
  return {
    async createShare(s, closeSessionId) {
      const now = Date.now();
      for (let i = 0; i < MAX_CODE_RETRIES; i++) {
        const id = crypto.randomUUID();
        const code = randCode();
        try {
          if (closeSessionId) {
            await db.batch([
              insertShareStmt(db, id, code, s, now),
              db.prepare('DELETE FROM upload_sessions WHERE id = ?1').bind(closeSessionId),
            ]);
          } else {
            await insertShareStmt(db, id, code, s, now).run();
          }
          return { id, code };
        } catch (e) {
          if (isUniqueViolation(e)) continue;
          throw e;
        }
      }
      throw new Error('code-space-exhausted');
    },

    async getByCode(code) {
      const r = await db.prepare(`SELECT ${SHARE_COLUMNS} FROM shares WHERE code = ?1`).bind(code).first<ShareRow>();
      return r ? toRec(r) : null;
    },

    /** 原子取件计数:0 行 = 不存在/失效/textOnly 撞上文件,交回调用方分类 */
    async tryPickup(code, opts) {
      const kindCond = opts?.textOnly ? `AND kind = 'text'` : '';
      const r = await db
        .prepare(
          `UPDATE shares SET pickup_count = pickup_count + 1
             WHERE code = ?1 ${kindCond}
               AND (expire_at IS NULL OR expire_at > ?2)
               AND (max_pickups IS NULL OR pickup_count < max_pickups)
             RETURNING ${SHARE_COLUMNS}`,
        )
        .bind(code, Date.now())
        .first<ShareRow>();
      return r ? toRec(r) : null;
    },

    async listShares(limit, offset) {
      const total =
        (await db.prepare('SELECT COUNT(*) AS n FROM shares').first<{ n: number }>())?.n ?? 0;
      const rows = await db
        .prepare(
          `SELECT id, code, kind, filename, size, pickup_count, max_pickups, expire_at, created_at,
                  CASE WHEN kind = 'text' THEN substr(text, 1, 50) ELSE NULL END AS text_preview
           FROM shares ORDER BY created_at DESC LIMIT ?1 OFFSET ?2`,
        )
        .bind(limit, offset)
        .all<{
          id: string; code: string; kind: 'text' | 'file'; filename: string | null; size: number;
          pickup_count: number; max_pickups: number | null; expire_at: number | null; created_at: number;
          text_preview: string | null;
        }>();
      return {
        total,
        rows: (rows.results ?? []).map((r): ShareListRow => ({
          id: r.id, code: r.code, kind: r.kind, filename: r.filename, size: r.size,
          pickupCount: r.pickup_count, maxPickups: r.max_pickups,
          expireAt: r.expire_at, createdAt: r.created_at, textPreview: r.text_preview,
        })),
      };
    },

    async stats(todayStart) {
      const now = Date.now();
      const s = await db
        .prepare(
          `SELECT COUNT(*) AS total,
                  COALESCE(SUM(CASE WHEN kind='file' THEN 1 ELSE 0 END), 0) AS files,
                  COALESCE(SUM(CASE WHEN kind='text' THEN 1 ELSE 0 END), 0) AS texts,
                  COALESCE(SUM(size), 0) AS totalBytes,
                  SUM(CASE WHEN (expire_at IS NULL OR expire_at > ?1)
                            AND (max_pickups IS NULL OR pickup_count < max_pickups)
                           THEN 1 ELSE 0 END) AS active
           FROM shares`,
        )
        .bind(now)
        .first<{ total: number; files: number; texts: number; totalBytes: number; active: number | null }>();
      const t = await db
        .prepare('SELECT COUNT(*) AS n FROM shares WHERE created_at >= ?1')
        .bind(todayStart)
        .first<{ n: number }>();
      return {
        total: s?.total ?? 0,
        files: s?.files ?? 0,
        texts: s?.texts ?? 0,
        totalBytes: s?.totalBytes ?? 0,
        active: s?.active ?? 0,
        todayCreated: t?.n ?? 0,
      };
    },

    async deleteByCode(code) {
      await db.prepare('DELETE FROM shares WHERE code = ?1').bind(code).run();
    },

    async createSession(s) {
      await db
        .prepare(
          `INSERT INTO upload_sessions (id, upload_id, r2_key, filename, mime, size, parts, expiry, max_pickups, created_at)
           VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)`,
        )
        .bind(s.id, s.uploadId, s.r2Key, s.filename, s.mime, s.size, s.parts, s.expiry, s.maxPickups, s.createdAt)
        .run();
    },

    async getSession(id) {
      const r = await db.prepare('SELECT * FROM upload_sessions WHERE id = ?1').bind(id).first<SessionRow>();
      return r ? toSession(r) : null;
    },

    async deleteSession(id) {
      await db.prepare('DELETE FROM upload_sessions WHERE id = ?1').bind(id).run();
    },

    async listExpiredShares(now, limit) {
      const rows = await db
        .prepare('SELECT code, kind, r2_key FROM shares WHERE expire_at IS NOT NULL AND expire_at <= ?1 LIMIT ?2')
        .bind(now, limit)
        .all<{ code: string; kind: string; r2_key: string | null }>();
      return (rows.results ?? []).map((r) => ({ code: r.code, r2Key: r.kind === 'file' ? r.r2_key : null }));
    },

    async deleteByCodes(codes) {
      if (codes.length === 0) return;
      await db.batch(codes.map((code) => db.prepare('DELETE FROM shares WHERE code = ?1').bind(code)));
    },

    async listStaleSessions(now, ttlMs) {
      const rows = await db
        .prepare('SELECT * FROM upload_sessions WHERE created_at < ?1')
        .bind(now - ttlMs)
        .all<SessionRow>();
      return (rows.results ?? []).map(toSession);
    },
  };
}

export type { ShareRow };
