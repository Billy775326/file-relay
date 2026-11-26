import { sourceSummary } from './upload-source';
/**
 * D1 实现:强一致后端(可选)。
 * 取件计数靠单条原子 UPDATE ... WHERE 有效性谓词 RETURNING;
 * 口令唯一靠 UNIQUE 约束 + 碰撞换码重试;会话关闭与分享落库走 batch。
 */
import { randCode, isUniqueViolation } from './code';
import type {
  NewShare,
  ShareFile,
  SessionRecord,
  ShareListRow,
  ShareRecord,
  ShareStats,
  ShareStore,
} from './store';

interface ShareRow {
  files_json: string | null;
  draft_until: number | null;
  source_json: string | null;
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
  batch_code: string | null;
  source_json: string | null;
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
  'id, code, kind, filename, size, mime, r2_key, text, max_pickups, pickup_count, created_at, expire_at, source_json, files_json, draft_until';

const toRec = (r: ShareRow): ShareRecord => ({
  files: r.files_json ? JSON.parse(r.files_json) : undefined,
  draftUntil: r.draft_until,
  source: r.source_json ? JSON.parse(r.source_json) : null,
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
  batchCode: r.batch_code,
  source: r.source_json ? JSON.parse(r.source_json) : null,
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
        (id, code, kind, filename, size, mime, r2_key, text, max_pickups, pickup_count, created_at, expire_at, source_json, files_json, draft_until)
       VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,0,?10,?11,?12,?13,?14)`,
    )
    .bind(
      id, code, s.kind, s.filename ?? null, s.size, s.mime ?? null,
      s.r2Key ?? null, s.text ?? null, s.maxPickups, now, s.expireAt, s.source ? JSON.stringify(s.source) : null,
      s.files ? JSON.stringify(s.files) : null, s.draftUntil ?? null,
    );
}

export function createD1Store(db: D1Database): ShareStore {
  return {
    async visitorShares(visitorId) {
      const rows = await db.prepare(`SELECT ${SHARE_COLUMNS} FROM shares
        WHERE draft_until IS NULL AND json_extract(source_json, '$.visitorId') = ?1 ORDER BY created_at DESC, code ASC LIMIT 10`)
        .bind(visitorId).all<ShareRow>();
      return (rows.results ?? []).map(toRec);
    },
    async getVisitorNotes(ids) {
      const notes = new Map<string, string>();
      for (let i = 0; i < ids.length; i += 100) {
        const batch = ids.slice(i, i + 100);
        const rows = await db.prepare(`SELECT visitor_id, note FROM visitor_notes WHERE visitor_id IN (${batch.map(() => '?').join(',')})`)
          .bind(...batch).all<{ visitor_id: string; note: string }>();
        for (const row of rows.results) notes.set(row.visitor_id, row.note);
      }
      return notes;
    },
    async getVisitorNote(id) {
      const row = await db.prepare('SELECT note FROM visitor_notes WHERE visitor_id = ?1').bind(id).first<{ note: string }>();
      return row?.note ?? '';
    },
    async setVisitorNote(id, note) {
      if (!note) { await db.prepare('DELETE FROM visitor_notes WHERE visitor_id = ?1').bind(id).run(); return; }
      await db.prepare('INSERT INTO visitor_notes (visitor_id, note) VALUES (?1, ?2) ON CONFLICT(visitor_id) DO UPDATE SET note = excluded.note').bind(id, note).run();
    },
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
      const r = await db.prepare(`SELECT ${SHARE_COLUMNS} FROM shares WHERE code = ?1 AND draft_until IS NULL`).bind(code).first<ShareRow>();
      return r ? toRec(r) : null;
    },

    async getBatch(code) {
      const row = await db.prepare(`SELECT ${SHARE_COLUMNS} FROM shares WHERE code=?1 AND files_json IS NOT NULL`)
        .bind(code).first<ShareRow>();
      return row ? toRec(row) : null;
    },

    async publishBatch(code, id) {
      const now = Date.now();
      const row = await db.prepare(`UPDATE shares SET draft_until=NULL, created_at=?1,
        expire_at=CASE WHEN expire_at IS NULL THEN NULL ELSE ?1 + expire_at - created_at END
        WHERE code=?2 AND id=?3 AND draft_until>?1 RETURNING ${SHARE_COLUMNS}`)
        .bind(now, code, id).first<ShareRow>();
      return row ? toRec(row) : null;
    },

    async updateRules(code, expected, rules, cleanupCutoff) {
      const row = await db.prepare(`UPDATE shares SET pickup_count=?1, max_pickups=?2, expire_at=?3
        WHERE code=?4 AND id=?5 AND pickup_count=?6 AND max_pickups IS ?7 AND expire_at IS ?8
          AND (expire_at IS NULL OR expire_at>?9)
        RETURNING ${SHARE_COLUMNS}`)
        .bind(rules.pickupCount, rules.maxPickups, rules.expireAt, code,
          expected.id, expected.pickupCount, expected.maxPickups, expected.expireAt, cleanupCutoff).first<ShareRow>();
      return row ? toRec(row) : null;
    },

    async updateShare(code, expected, update, cleanupCutoff) {
      const row = await db.prepare(`UPDATE shares SET filename=?1, text=?2, size=?3, pickup_count=?4, max_pickups=?5, expire_at=?6
        WHERE code=?7 AND id=?8 AND pickup_count=?9 AND max_pickups IS ?10 AND expire_at IS ?11
          AND filename IS ?12 AND text IS ?13 AND size=?14 AND (expire_at IS NULL OR expire_at>?15)
        RETURNING ${SHARE_COLUMNS}`)
        .bind(update.filename, update.text, update.size, update.pickupCount, update.maxPickups, update.expireAt,
          code, expected.id, expected.pickupCount, expected.maxPickups, expected.expireAt,
          expected.filename, expected.text, expected.size, cleanupCutoff).first<ShareRow>();
      return row ? toRec(row) : null;
    },

    /** 原子取件计数:0 行 = 不存在/失效/textOnly 撞上文件,交回调用方分类 */
    async tryPickup(code, opts) {
      const kind = opts?.textOnly ? 'text' : opts?.kind ?? null;
      const r = await db
        .prepare(
          `UPDATE shares SET pickup_count = pickup_count + 1
             WHERE code = ?1 AND draft_until IS NULL
               AND (?3 IS NULL OR kind=?3) AND (?4 IS NULL OR id=?4)
               AND (expire_at IS NULL OR expire_at > ?2)
               AND (max_pickups IS NULL OR pickup_count < max_pickups)
             RETURNING ${SHARE_COLUMNS}`,
        )
        .bind(code, Date.now(), kind, opts?.id ?? null)
        .first<ShareRow>();
      return r ? toRec(r) : null;
    },

    async listShares(limit, offset, filter = {}) {
      const clauses: string[] = ['draft_until IS NULL'], values: (string | number)[] = [];
      if (filter.kind) { clauses.push('kind = ?'); values.push(filter.kind); }
      if (filter.status) {
        clauses.push(`(CASE WHEN expire_at IS NOT NULL AND expire_at <= ? THEN 'expired'
          WHEN max_pickups IS NOT NULL AND pickup_count >= max_pickups THEN 'exhausted' ELSE 'active' END) = ?`);
        values.push(Date.now(), filter.status);
      }
      const q = filter.q?.trim().toLowerCase();
      if (q) {
        clauses.push(`(instr(lower(code), ?) > 0 OR instr(lower(substr(COALESCE(filename, ''), 1, 40)), ?) > 0
          OR instr(lower(COALESCE(json_extract(source_json, '$.visitorId'), '')), ?) > 0)`);
        values.push(q, q, q);
      }
      const where = clauses.length ? ' WHERE ' + clauses.join(' AND ') : '';
      const total =
        (await db.prepare('SELECT COUNT(*) AS n FROM shares' + where).bind(...values).first<{ n: number }>())?.n ?? 0;
      const rows = await db
        .prepare(
          `SELECT id, code, kind, filename, size, pickup_count, max_pickups, expire_at, created_at, source_json,
                  CASE WHEN kind = 'text' THEN substr(text, 1, 50) ELSE NULL END AS text_preview,
                  json_array_length(files_json) AS file_count
           FROM shares${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        )
        .bind(...values, limit, offset)
        .all<{
          id: string; code: string; kind: 'text' | 'file'; filename: string | null; size: number;
          pickup_count: number; max_pickups: number | null; expire_at: number | null; created_at: number;
          text_preview: string | null; file_count: number | null; source_json: string | null;
        }>();
      return {
        total,
        rows: (rows.results ?? []).map((r): ShareListRow => ({
          source: sourceSummary(r.source_json ? JSON.parse(r.source_json) : null),
          id: r.id, code: r.code, kind: r.kind, filename: r.filename, size: r.size,
          pickupCount: r.pickup_count, maxPickups: r.max_pickups,
          expireAt: r.expire_at, createdAt: r.created_at, textPreview: r.text_preview, fileCount: r.file_count ?? undefined,
        })),
      };
    },

    async stats(todayStart) {
      const now = Date.now();
      const s = await db
        .prepare(
          `SELECT COUNT(*) AS total,
                  COALESCE(SUM(CASE WHEN kind='file' THEN COALESCE(json_array_length(files_json),1) ELSE 0 END), 0) AS files,
                  COALESCE(SUM(CASE WHEN kind='text' THEN 1 ELSE 0 END), 0) AS texts,
                  COALESCE(SUM(size), 0) AS totalBytes,
                  SUM(CASE WHEN (expire_at IS NULL OR expire_at > ?1)
                            AND (max_pickups IS NULL OR pickup_count < max_pickups)
                           THEN 1 ELSE 0 END) AS active
           FROM shares WHERE draft_until IS NULL`,
        )
        .bind(now)
        .first<{ total: number; files: number; texts: number; totalBytes: number; active: number | null }>();
      const t = await db
        .prepare('SELECT COUNT(*) AS n FROM shares WHERE created_at >= ?1 AND draft_until IS NULL')
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
          `INSERT INTO upload_sessions (id, upload_id, r2_key, filename, mime, size, parts, expiry, max_pickups, created_at, source_json, batch_code)
           VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12)`,
        )
        .bind(s.id, s.uploadId, s.r2Key, s.filename, s.mime, s.size, s.parts, s.expiry, s.maxPickups, s.createdAt, s.source ? JSON.stringify(s.source) : null, s.batchCode ?? null)
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
        .prepare('SELECT code, kind, r2_key, files_json FROM shares WHERE draft_until IS NULL AND expire_at IS NOT NULL AND expire_at <= ?1 LIMIT ?2')
        .bind(now, limit)
        .all<{ code: string; kind: string; r2_key: string | null; files_json: string | null }>();
      return (rows.results ?? []).map((r) => ({ code: r.code, r2Key: r.kind === 'file' ? r.r2_key : null, files: r.files_json ? JSON.parse(r.files_json) as ShareFile[] : undefined }));
    },

    async listExpiredDrafts(now, limit) {
      const rows = await db.prepare(`SELECT ${SHARE_COLUMNS} FROM shares WHERE draft_until<=?1 LIMIT ?2`)
        .bind(now, limit).all<ShareRow>();
      return rows.results.map(toRec);
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
