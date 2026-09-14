import { randCode, isUniqueViolation } from './code';

export interface ShareRow {
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

export interface NewShare {
  kind: 'text' | 'file';
  filename?: string | null;
  size: number;
  mime?: string | null;
  r2Key?: string | null;
  text?: string | null;
  maxPickups: number | null;
  expireAt: number | null;
}

export interface CreatedShare {
  id: string;
  code: string;
}

const INSERT_SQL = `INSERT INTO shares
  (id, code, kind, filename, size, mime, r2_key, text, max_pickups, pickup_count, created_at, expire_at)
  VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,0,?10,?11)`;

function insertShareStmt(db: D1Database, id: string, code: string, s: NewShare, now: number): D1PreparedStatement {
  return db.prepare(INSERT_SQL).bind(
    id, code, s.kind, s.filename ?? null, s.size, s.mime ?? null,
    s.r2Key ?? null, s.text ?? null, s.maxPickups, now, s.expireAt,
  );
}

const MAX_CODE_RETRIES = 8;

/** 创建文本分享:口令碰撞时换码重试(UNIQUE 约束兜底) */
export async function createTextShare(db: D1Database, s: NewShare, now: number): Promise<CreatedShare> {
  for (let i = 0; i < MAX_CODE_RETRIES; i++) {
    const id = crypto.randomUUID();
    const code = randCode();
    try {
      await insertShareStmt(db, id, code, s, now).run();
      return { id, code };
    } catch (e) {
      if (isUniqueViolation(e)) continue;
      throw e;
    }
  }
  throw new Error('code-space-exhausted');
}

/** 完成文件分享:INSERT share + DELETE session 放进同一 batch,事务原子 */
export async function createFileShareAndCloseSession(
  db: D1Database,
  s: NewShare,
  sessionId: string,
  now: number,
): Promise<CreatedShare> {
  for (let i = 0; i < MAX_CODE_RETRIES; i++) {
    const id = crypto.randomUUID();
    const code = randCode();
    try {
      await db.batch([
        insertShareStmt(db, id, code, s, now),
        db.prepare('DELETE FROM upload_sessions WHERE id = ?1').bind(sessionId),
      ]);
      return { id, code };
    } catch (e) {
      if (isUniqueViolation(e)) continue;
      throw e;
    }
  }
  throw new Error('code-space-exhausted');
}

/** 有效性谓词:未过期 且 未取完 */
function validPredicate(): string {
  return '(expire_at IS NULL OR expire_at > ?2) AND (max_pickups IS NULL OR pickup_count < max_pickups)';
}

const SHARE_COLUMNS =
  'id, code, kind, filename, size, mime, r2_key, text, max_pickups, pickup_count, created_at, expire_at';

/**
 * 原子取件计数(文本,D1 单写者保证串行):
 * UPDATE ... WHERE 有效性谓词 RETURNING,0 行即无效(需另行区分 404/410)。
 */
export async function pickTextAndIncrement(db: D1Database, code: string, now: number): Promise<ShareRow | null> {
  return db
    .prepare(
      `UPDATE shares SET pickup_count = pickup_count + 1
        WHERE code = ?1 AND kind = 'text' AND ${validPredicate()}
        RETURNING ${SHARE_COLUMNS}`,
    )
    .bind(code, now)
    .first<ShareRow>();
}

/** 原子取件计数(下载,先计数后流式返回——取消下载也消耗次数,防超取的代价) */
export async function incrementAndGetForDownload(db: D1Database, code: string, now: number): Promise<ShareRow | null> {
  return db
    .prepare(
      `UPDATE shares SET pickup_count = pickup_count + 1
        WHERE code = ?1 AND ${validPredicate()}
        RETURNING ${SHARE_COLUMNS}`,
    )
    .bind(code, now)
    .first<ShareRow>();
}

export async function getShareByCode(db: D1Database, code: string): Promise<ShareRow | null> {
  return db.prepare('SELECT * FROM shares WHERE code = ?1').bind(code).first<ShareRow>();
}

/** 惰性状态计算:不依赖任何落库状态字段 */
export function shareStatus(row: ShareRow, now: number): 'active' | 'expired' | 'exhausted' {
  if (row.expire_at !== null && row.expire_at <= now) return 'expired';
  if (row.max_pickups !== null && row.pickup_count >= row.max_pickups) return 'exhausted';
  return 'active';
}
