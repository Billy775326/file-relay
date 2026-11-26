import { Hono, type Context } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { num, type Env } from './types';
import { getStore, type SessionRecord, type ShareFile, type ShareRecord } from './store';
import { err, parseExpiry, parseMaxPickups } from './util';
import { uploadAccess, checkUploadOptions, admitFile, UploadPolicyError, policyErrorResponse } from './upload-policy';
import { parseSubmission, ensureVisitor } from './upload-source';
import { fileMode, KV_FILE_PREFIX, inspectFile, putFileBytes, readUploadBytes } from './filestore';
import { uploadPartSize, uploadMaxParts } from './limits';
import { reserveFiles, releaseCapacity, CapacityError, R2_CAPACITY_MAX } from './quota';
import { auditState } from './audit';
import { enforceSecurity, securityResponse } from './security';
import { loginIP } from './login-protection';

export const MAX_BATCH_FILES = 10;
export const DRAFT_CLEANUP_GRACE = 120_000;
type BatchContext = Context<{ Bindings: Env }>;

export const batchRoutes = new Hono<{ Bindings: Env }>();
batchRoutes.onError((error, c) => {
  if (error instanceof CapacityError) return c.json({
    error: 'capacity_exceeded', message: error.message, remainingBytes: error.remainingBytes, capacityBytes: R2_CAPACITY_MAX,
  }, 507);
  const rejection = policyErrorResponse(c, error) ?? securityResponse(c, error);
  if (rejection) return rejection;
  console.error('Batch upload failed', error);
  return err(c, 503, 'storage_unavailable', '批次暂时无法处理，请稍后重试');
});

batchRoutes.post('/init', bodyLimit({ maxSize: 32_768, onError: c => err(c, 413, 'too_large', '批次清单过大') }), async c => {
  const body = await c.req.json<Record<string, unknown>>().catch(() => null);
  if (!body || !Array.isArray(body.files) || body.files.length < 2 || body.files.length > MAX_BATCH_FILES)
    return err(c, 400, 'bad_request', '每批需包含 2–10 个文件');
  const expiry = parseExpiry(body.expiry);
  const maxPickups = parseMaxPickups(body.maxPickups);
  const submission = parseSubmission(body);
  if (expiry === undefined || maxPickups === undefined || !submission)
    return err(c, 400, 'bad_request', '分享规则或补充说明无效');
  const mode = fileMode(c.env);
  if (!mode) return err(c, 400, 'config', '未配置文件存储');

  const access = await uploadAccess(c);
  const partSize = uploadPartSize(c.env);
  const maxParts = uploadMaxParts(c.env);
  const files: ShareFile[] = [];
  for (const item of body.files) {
    if (!item || typeof item.filename !== 'string' || !item.filename.trim() || item.filename.length > 255 ||
      /[\u0000-\u001f\u007f]/.test(item.filename) || !Number.isSafeInteger(item.size) || item.size < 1)
      return err(c, 400, 'bad_request', '文件名或大小无效');
    checkUploadOptions(access, item.size, expiry, maxPickups);
    if (mode === 'r2' && Math.ceil(item.size / partSize) > maxParts)
      return err(c, 413, 'too_large', '文件过大，分片数超限');
    const mime = typeof item.mime === 'string' && /^[\w.+-]+\/[\w.+-]+$/.test(item.mime) && item.mime.length <= 127
      ? item.mime : 'application/octet-stream';
    files.push({ filename: item.filename, size: item.size, mime,
      key: (mode === 'kv' ? KV_FILE_PREFIX : '') + crypto.randomUUID(),
      sessionId: mode === 'r2' ? crypto.randomUUID() : undefined });
  }

  const size = files.reduce((sum, file) => sum + file.size, 0);
  const detail = auditState(c).detail;
  detail.fileCount = files.length;
  detail.sizeBytes = size;
  // Global middleware counts the initial request. Each additional file counts as another upload.
  const cf = c.req.raw.cf;
  await enforceSecurity(c.env, loginIP(c), 'upload',
    typeof cf?.country === 'string' ? cf.country : '', typeof cf?.regionCode === 'string' ? cf.regionCode : '', files.length - 1);
  await admitFile(c.env, access, files.length);

  const source = { ...access.source, submission, uploadTier: access.noted ? 'noted' as const : 'guest' as const };
  const draftUntil = Date.now() + num(c.env.SESSION_TTL_MS, 86_400_000);
  const store = getStore(c.env);
  const { code, id } = await store.createShare({
    kind: 'file', files, source, filename: files[0].filename, size, draftUntil,
    maxPickups, expireAt: expiry === null ? null : Date.now() + expiry,
  });

  const slots: { uploadId: string; partSize: number; parts: number }[] = [];
  if (mode === 'kv') return c.json({ draft: code, id, slots, draftUntil }, 201);

  const bucket = c.env.BUCKET!;
  const started: { sessionId: string; multipart: R2MultipartUpload }[] = [];
  try {
    const capacity = await reserveFiles(c.env, files);
    for (const file of files) {
      const uploadId = file.sessionId!;
      const parts = Math.ceil(file.size / partSize);
      const multipart = await bucket.createMultipartUpload(file.key, {
        storageClass: 'Standard', httpMetadata: { contentType: file.mime },
      });
      started.push({ sessionId: uploadId, multipart });
      await store.createSession({ id: uploadId, uploadId: multipart.uploadId, r2Key: file.key,
        filename: file.filename, size: file.size, mime: file.mime,
        parts, createdAt: Date.now(), maxPickups, source, batchCode: code, expiry: String(body.expiry) });
      slots.push({ uploadId, partSize, parts });
    }
    return c.json({ draft: code, id, slots, draftUntil, ...capacity }, 201);
  } catch (error) {
    try {
      for (const { sessionId, multipart } of started) {
        await multipart.abort();
        await store.deleteSession(sessionId);
      }
      await releaseCapacity(c.env, files.map(file => file.key));
      await store.deleteByCode(code);
    } catch {
      console.warn('Batch initialization cleanup deferred');
    }
    throw error;
  }

});

async function loadOwned(c: BatchContext, code: string, id: string | undefined) {
  if (!/^\d{6}$/.test(code) || !id) return null;
  const record = await getStore(c.env).getBatch(code);
  if (record?.id !== id || record.source?.visitorId !== await ensureVisitor(c)) return null;
  return record;
}

async function checkDraftAccess(c: BatchContext, record: ShareRecord) {
  if (!record.draftUntil || record.draftUntil <= Date.now()) return false;
  const access = await uploadAccess(c);
  if (!access.noted && record.source?.uploadTier !== 'guest')
    throw new UploadPolicyError(403, 'upload_policy_changed', '上传权限已变更，请重新上传');
  for (const file of record.files!) checkUploadOptions(access, file.size, record.expireAt === null ? null : 1, record.maxPickups);
  return true;
}

/** R2 slots are created only by batch admission. They may stage bytes, never create single-file shares. */
export async function openBatchSlot(c: BatchContext, session: SessionRecord) {
  if (!session.batchCode) return true;
  const batch = await getStore(c.env).getBatch(session.batchCode);
  return !!batch?.draftUntil && batch.draftUntil > Date.now() &&
    batch.files!.some(file => file.key === session.r2Key);
}

batchRoutes.put('/:code/files/:index', async c => {
  const record = await loadOwned(c, c.req.param('code'), c.req.header('X-Batch-ID'));
  if (!record) return err(c, 404, 'not_found', '上传批次不存在');
  if (!await checkDraftAccess(c, record)) return err(c, 409, 'batch_expired', '上传批次已结束，请重新选择文件');
  const index = c.req.param('index');
  const file = /^[1-9][0-9]*$/.test(index) ? record.files![Number(index) - 1] : undefined;
  if (fileMode(c.env) !== 'kv' || !file || !c.req.raw.body) return err(c, 400, 'bad_request', '文件或存储模式无效');
  // The slot always describes the same file. Retries after a lost response reuse its stored bytes.
  const stored = await inspectFile(c.env, file.key);
  if (stored.state === 'available') return c.json({ staged: true });
  if (stored.state !== 'missing') return err(c, 503, 'storage_unavailable', '暂时无法确认文件状态');
  const bytes = await readUploadBytes(c.req.raw.body, file.size);
  if (!bytes || bytes.length !== file.size) return err(c, 400, 'bad_request', '文件大小与批次清单不一致');
  await putFileBytes(c.env, file.key, bytes.buffer);
  return c.json({ staged: true });
});

function receipt(record: ShareRecord) {
  return { code: record.code, kind: 'file', fileCount: record.files!.length, size: record.size,
    expireAt: record.expireAt, maxPickups: record.maxPickups, pickupUrl: `/pickup?code=${record.code}` };
}

batchRoutes.post('/:code/complete', async c => {
  const code = c.req.param('code');
  const record = await loadOwned(c, code, c.req.header('X-Batch-ID'));
  if (!record) return err(c, 404, 'not_found', '上传批次不存在');
  if (record.draftUntil === null) {
    auditState(c).detail.replayed = true;
    return c.json(receipt(record));
  }
  if (!await checkDraftAccess(c, record)) return err(c, 409, 'batch_expired', '上传批次已过期，请重新上传');

  const files = record.files!;
  const stored = await Promise.all(files.map(file => inspectFile(c.env, file.key)));
  if (stored.some(f => f.state === 'unknown')) return err(c, 503, 'storage_unavailable', '暂时无法确认文件状态，请重试');
  if (stored.some((f, index) => f.state !== 'available' || f.size !== null && f.size !== files[index].size))
    return err(c, 409, 'bad_request', '批次文件尚未全部上传');

  // Workers KV restricts successive writes to the same key. Give the initial draft write time to settle.
  if (c.env.fileKV) {
    const delay = 1100 - (Date.now() - record.createdAt);
    if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));
  }
  const published = await getStore(c.env).publishBatch(code, record.id);
  if (!published) {
    const current = await loadOwned(c, code, record.id);
    if (!current || current.draftUntil !== null) return err(c, 409, 'bad_request', '批次状态已变更，请重试');
    auditState(c).detail.replayed = true;
    return c.json(receipt(current));
  }
  auditState(c).target = code;
  Object.assign(auditState(c).detail, { fileCount: files.length, kind: 'file', sizeBytes: record.size });
  return c.json(receipt(published), 201);
});
