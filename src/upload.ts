import { Hono } from 'hono';
import { num, type Env } from './types';
import { err, parseExpiry, parseMaxPickups } from './util';
import { createFileShareAndCloseSession } from './db';

export interface SessionRow {
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

export const uploadRoutes = new Hono<{ Bindings: Env }>();

function getSession(db: D1Database, id: string): Promise<SessionRow | null> {
  return db.prepare('SELECT * FROM upload_sessions WHERE id = ?1').bind(id).first<SessionRow>();
}

/** 初始化分片上传:校验 → 预生成 r2_key → R2 createMultipartUpload → 落会话台账 */
uploadRoutes.post('/init', async (c) => {
  const body = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return err(c, 400, 'bad_request', '请求体必须是 JSON');

  const { filename, size, mime, expiry, maxPickups } = body;
  const maxSize = num(c.env.MAX_FILE_SIZE, 2 * 1024 ** 3);
  const partSize = num(c.env.PART_SIZE, 10 * 1024 ** 2);
  const maxParts = num(c.env.MAX_PARTS, 10_000);

  if (typeof filename !== 'string' || !filename.trim()) return err(c, 400, 'bad_request', '文件名不能为空');
  if (typeof size !== 'number' || !Number.isInteger(size) || size < 1) return err(c, 400, 'bad_request', '文件大小非法');
  if (size > maxSize) {
    const limit = maxSize >= 1024 ** 3 ? `${Math.floor(maxSize / 1024 ** 3)} GB` : `${Math.floor(maxSize / 1024 ** 2)} MB`;
    return err(c, 413, 'too_large', `文件超过上限 ${limit}`);
  }

  const expMs = parseExpiry(expiry);
  if (expMs === undefined) return err(c, 400, 'bad_request', '有效期参数非法');
  const mp = parseMaxPickups(maxPickups);
  if (mp === undefined) return err(c, 400, 'bad_request', '取件次数参数非法');

  const parts = Math.ceil(size / partSize);
  if (parts > maxParts) return err(c, 413, 'too_large', '文件过大(分片数超限)');

  const contentType = typeof mime === 'string' && mime ? mime : 'application/octet-stream';
  const id = crypto.randomUUID(); // 会话 token,客户端只拿这个
  const r2Key = crypto.randomUUID(); // 预生成的对象键

  const mpu = await c.env.BUCKET.createMultipartUpload(r2Key, {
    httpMetadata: { contentType },
  });

  await c.env.DB.prepare(
    `INSERT INTO upload_sessions (id, upload_id, r2_key, filename, mime, size, parts, expiry, max_pickups, created_at)
     VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)`,
  )
    .bind(id, mpu.uploadId, r2Key, filename.slice(0, 255), contentType, size, parts, typeof expiry === 'string' ? expiry : null, mp, Date.now())
    .run();

  return c.json({ uploadId: id, partSize, parts, size });
});

/** 上传单个分片:原始字节流透传给 R2 uploadPart(流式,不缓冲整个分片) */
uploadRoutes.put('/:id/parts/:n', async (c) => {
  const id = c.req.param('id');
  const n = Number(c.req.param('n'));

  const sess = await getSession(c.env.DB, id);
  if (!sess) return err(c, 404, 'not_found', '上传会话不存在或已过期');
  if (!Number.isInteger(n) || n < 1 || n > sess.parts) return err(c, 400, 'bad_request', '分片序号非法');

  const partSize = num(c.env.PART_SIZE, 10 * 1024 ** 2);
  const contentLength = Number(c.req.raw.headers.get('content-length') || 0);
  if (contentLength && contentLength > partSize) return err(c, 400, 'bad_request', '分片过大');

  const body = c.req.raw.body;
  if (!body) return err(c, 400, 'bad_request', '请求体为空');

  try {
    const mpu = c.env.BUCKET.resumeMultipartUpload(sess.r2_key, sess.upload_id);
    const part = await mpu.uploadPart(n, body);
    return c.json({ partNumber: part.partNumber, etag: part.etag });
  } catch {
    return err(c, 500, 'internal', '分片写入失败,请重试');
  }
});

/** 完成上传:R2 complete 校验 etag → 大小比对 → 生成口令落库并关会话(同一 batch) */
uploadRoutes.post('/:id/complete', async (c) => {
  const id = c.req.param('id');
  const body = (await c.req.json().catch(() => null)) as { parts?: unknown } | null;

  const sess = await getSession(c.env.DB, id);
  if (!sess) return err(c, 404, 'not_found', '上传会话不存在或已过期');

  const parts = body?.parts;
  if (!Array.isArray(parts) || parts.length !== sess.parts) return err(c, 400, 'bad_request', '分片列表不完整');

  const seen = new Set<number>();
  const r2parts: R2UploadedPart[] = [];
  for (const p of parts) {
    const rec = p as { partNumber?: unknown; etag?: unknown } | null;
    if (!rec || typeof rec.partNumber !== 'number' || typeof rec.etag !== 'string') {
      return err(c, 400, 'bad_request', '分片列表格式非法');
    }
    if (!Number.isInteger(rec.partNumber) || rec.partNumber < 1 || rec.partNumber > sess.parts || seen.has(rec.partNumber)) {
      return err(c, 400, 'bad_request', '分片序号非法');
    }
    seen.add(rec.partNumber);
    r2parts.push({ partNumber: rec.partNumber, etag: rec.etag } as R2UploadedPart);
  }

  let obj: R2Object;
  try {
    const mpu = c.env.BUCKET.resumeMultipartUpload(sess.r2_key, sess.upload_id);
    obj = await mpu.complete(r2parts);
  } catch {
    return err(c, 400, 'bad_request', '合并分片失败,请重试');
  }

  // 声明大小造假的最后一道闸
  if (obj.size !== sess.size) {
    await c.env.BUCKET.delete(sess.r2_key);
    await c.env.DB.prepare('DELETE FROM upload_sessions WHERE id = ?1').bind(id).run();
    return err(c, 400, 'bad_request', '文件大小校验失败');
  }

  const now = Date.now();
  const parsed = parseExpiry(sess.expiry);
  const expMs = parsed === undefined ? 7 * 86_400_000 : parsed; // 脏数据兜底 7 天
  const expireAt = expMs === null ? null : now + expMs;

  const created = await createFileShareAndCloseSession(
    c.env.DB,
    {
      kind: 'file',
      filename: sess.filename,
      size: sess.size,
      mime: sess.mime,
      r2Key: sess.r2_key,
      maxPickups: sess.max_pickups,
      expireAt,
    },
    id,
    now,
  );

  return c.json({
    code: created.code,
    kind: 'file',
    size: sess.size,
    expireAt,
    maxPickups: sess.max_pickups,
    pickupUrl: `/pickup?code=${created.code}`,
  });
});

/** 放弃上传:幂等,会话不存在也返回 ok(pagehide sendBeacon 与主动取消共用) */
uploadRoutes.post('/:id/abort', async (c) => {
  const id = c.req.param('id');
  const sess = await getSession(c.env.DB, id);
  if (sess) {
    try {
      await c.env.BUCKET.resumeMultipartUpload(sess.r2_key, sess.upload_id).abort();
    } catch {
      // 已中止/不存在,忽略
    }
    await c.env.DB.prepare('DELETE FROM upload_sessions WHERE id = ?1').bind(id).run();
  }
  return c.json({ ok: true });
});
