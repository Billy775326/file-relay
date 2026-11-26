import { Hono } from 'hono';
import type { Context } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import type { Env } from './types';
import { num } from './types';
import { getStore, shareStatusOf, type ShareRecord, type ShareUpdate, type ShareListFilter } from './store';
import { getRetentionDays, RETENTION_DAY_MS } from './settings';
import { validShareRules, shareVersion as version } from './share-edit';
import { deleteFileKeys, shareFileKeys, inspectShareFiles, describeFiles } from './filestore';
import { createTextShare, createKVFileShare } from './share';
import { downloadShare } from './admin';
import { uploadRoutes } from './upload';
import { configResponse } from './config';
import { policyErrorResponse } from './upload-policy';
import { loginProtectionResponse } from './login-protection';
import { securityResponse } from './security';
import { CapacityError, R2_CAPACITY_MAX } from './quota';
import { auditState } from './audit';

export const apiRoutes = new Hono<{ Bindings: Env }>();
apiRoutes.onError((error, c) => {
  const rejected = policyErrorResponse(c, error) ?? loginProtectionResponse(c, error) ?? securityResponse(c, error);
  if (rejected) return rejected;
  if (error instanceof CapacityError) return c.json({ error: 'capacity_exceeded', message: error.message, remainingBytes: error.remainingBytes, capacityBytes: R2_CAPACITY_MAX }, 507);
  console.error('Script API request failed', error);
  return c.json({ error: 'internal', message: '接口暂不可用，请稍后重试' }, 503);
});
const jsonLimit = bodyLimit({ maxSize: 1_048_576, onError: c => c.json({ error: 'too_large', message: 'JSON 请求超过 1 MiB 上限' }, 413) });
apiRoutes.use('*', async (c, next) => {
  const jsonRequest = c.req.method === 'PATCH' || c.req.method === 'POST' && (c.req.path === '/api/v1/shares' || /^\/api\/v1\/uploads\/(init|[^/]+\/complete)$/.test(c.req.path));
  if (jsonRequest) {
    if (!c.req.header('Content-Type')?.startsWith('application/json')) return c.json({ error: 'bad_request', message: '请使用 JSON' }, 415);
    return jsonLimit(c, next);
  }
  await next();
});
apiRoutes.get('/config', configResponse);
apiRoutes.post('/shares', async c => {
  const body: unknown = await c.req.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
      Object.keys(body).some(key => !['text', 'expiry', 'maxPickups', 'displayName', 'description'].includes(key)))
    return c.json({ error: 'bad_request', message: '文本创建参数无效或含不支持的字段' }, 400);
  return createTextShare(c);
});
apiRoutes.post('/shares/file', createKVFileShare);
apiRoutes.route('/uploads', uploadRoutes);

function view(record: ShareRecord) {
  return { id: record.id, code: record.code, kind: record.kind, filename: record.filename, size: record.size,
    mime: record.mime, text: record.text, pickupCount: record.pickupCount, maxPickups: record.maxPickups,
    expireAt: record.expireAt, createdAt: record.createdAt,
    status: shareStatusOf(record.expireAt, record.maxPickups, record.pickupCount, Date.now()),
    pickupUrl: `/pickup?code=${record.code}`, files: describeFiles(record, `/api/v1/shares/${record.code}`),
    downloadUrl: record.kind === 'file' && !record.files ? `/api/v1/shares/${record.code}/download` : null };
}
async function reply(c: Context<{ Bindings: Env }>, record: ShareRecord) {
  c.header('ETag', await version(record));
  return c.json(view(record));
}
apiRoutes.get('/shares', async c => {
  const limit = Number(c.req.query('limit') || 20), offset = Number(c.req.query('offset') || 0);
  const kind = c.req.query('kind') || 'all', status = c.req.query('status') || 'all', q = (c.req.query('q') || '').trim();
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger(offset) || offset < 0 || q.length > 80 ||
      !['all', 'file', 'text'].includes(kind) || !['all', 'active', 'expired', 'exhausted'].includes(status))
    return c.json({ error: 'bad_request', message: '分页或筛选参数无效' }, 400);
  const filter: ShareListFilter = { q, ...(kind !== 'all' ? { kind: kind as 'file' | 'text' } : {}),
    ...(status !== 'all' ? { status: status as 'active' | 'expired' | 'exhausted' } : {}) };
  const { total, rows } = await getStore(c.env).listShares(limit, offset, filter);
  return c.json({ total, limit, offset, rows: rows.map(r => ({ id: r.id, code: r.code, kind: r.kind, filename: r.filename,
    size: r.size, fileCount: r.fileCount, textPreview: r.textPreview, pickupCount: r.pickupCount, maxPickups: r.maxPickups,
    expireAt: r.expireAt, createdAt: r.createdAt, status: shareStatusOf(r.expireAt, r.maxPickups, r.pickupCount, Date.now()) })) });
});
apiRoutes.get('/shares/:code', async c => {
  const code = c.req.param('code');
  if (!/^\d{6}$/.test(code)) return c.json({ error: 'bad_request', message: '取件码必须为六位数字' }, 400);
  const record = await getStore(c.env).getByCode(code);
  if (!record) return c.json({ error: 'not_found', message: '分享不存在' }, 404);
  const etag = await version(record);
  c.header('ETag', etag);
  if (c.req.header('If-None-Match') === etag) return c.body(null, 304);
  return c.json(view(record));
});
apiRoutes.patch('/shares/:code', async c => {
  const code = c.req.param('code');
  if (!/^\d{6}$/.test(code)) return c.json({ error: 'bad_request', message: '取件码必须为六位数字' }, 400);
  if (!c.req.header('Content-Type')?.startsWith('application/json')) return c.json({ error: 'bad_request', message: '请使用 JSON' }, 415);
  const store = getStore(c.env), record = await store.getByCode(code);
  if (!record) return c.json({ error: 'not_found', message: '分享不存在' }, 404);
  const etag = c.req.header('If-Match');
  if (!etag) return c.json({ error: 'precondition_required', message: '请先查询详情并通过 If-Match 提交 ETag' }, 428);
  if (etag !== await version(record)) return c.json({ error: 'precondition_failed', message: '分享已变更，请重新读取后修改' }, 412);
  const body: unknown = await c.req.json().catch(() => null);
  const allowed = ['filename', 'text', 'pickupCount', 'maxPickups', 'expireAt'];
  if (!body || typeof body !== 'object' || Array.isArray(body) || !Object.keys(body).length || Object.keys(body).some(k => !allowed.includes(k)))
    return c.json({ error: 'bad_request', message: '修改字段为空或包含不支持的字段' }, 400);
  const patch = body as Record<string, unknown>;
  const update: ShareUpdate = { filename: record.filename, text: record.text, size: record.size,
    pickupCount: record.pickupCount, maxPickups: record.maxPickups, expireAt: record.expireAt };
  for (const key of ['pickupCount', 'maxPickups', 'expireAt'] as const) if (key in patch) (update as Record<string, unknown>)[key] = patch[key];
  if (!validShareRules(update)) return c.json({ error: 'bad_request', message: '次数或过期时间无效' }, 400);
  if ('filename' in patch) {
    if (record.kind !== 'file' || record.files || typeof patch.filename !== 'string' || !patch.filename.trim() || patch.filename.length > 255 || /[\u0000-\u001f\u007f]/.test(patch.filename))
      return c.json({ error: 'bad_request', message: '仅单文件分享可修改文件名，长度为 1–255 字符' }, 400);
    update.filename = patch.filename.trim();
  }
  if ('text' in patch) {
    if (record.kind !== 'text' || typeof patch.text !== 'string' || !patch.text.trim() || patch.text.length > num(c.env.MAX_TEXT_LENGTH, 65_536))
      return c.json({ error: 'bad_request', message: '文本内容或类型无效' }, 400);
    update.text = patch.text; update.size = patch.text.length;
  }
  const cutoff = Date.now() - await getRetentionDays(c.env) * RETENTION_DAY_MS;
  if (record.expireAt !== null && record.expireAt <= cutoff) return c.json({ error: 'cleanup_pending', message: '分享已进入清理期，不能修改' }, 409);
  if (record.kind === 'file') {
    const storage = await inspectShareFiles(c.env, record);
    if (storage.state === 'missing') return c.json({ error: 'gone', message: '文件已被清理' }, 410);
    if (storage.state !== 'available') return c.json({ error: 'storage_unavailable', message: '无法确认文件状态' }, 503);
  }
  const updated = await store.updateShare(code, record, update, cutoff);
  if (!updated) return c.json({ error: 'share_conflict', message: '记录已被取件或修改，请重新读取后提交' }, 409);
  auditState(c).detail.changedFields = Object.keys(patch).join(',');
  if (['pickupCount', 'maxPickups', 'expireAt'].some(key => key in patch)) {
    const rules = (r: ShareRecord) => ({ pickupCount: r.pickupCount, maxPickups: r.maxPickups, expireAt: r.expireAt });
    auditState(c).detail.beforeRules = JSON.stringify(rules(record));
    auditState(c).detail.afterRules = JSON.stringify(rules(updated));
  }
  if (updated.kind === 'file') auditState(c).detail.filename = (updated.filename || '').slice(0, 160);
  return reply(c, updated);
});
apiRoutes.get('/shares/:code/download', downloadShare);
apiRoutes.get('/shares/:code/files/:index/download', downloadShare);
apiRoutes.delete('/shares/:code', async c => {
  const code = c.req.param('code');
  if (!/^\d{6}$/.test(code)) return c.json({ error: 'bad_request', message: '取件码必须为六位数字' }, 400);
  const store = getStore(c.env), record = await store.getByCode(code);
  if (!record) { auditState(c).detail.alreadyDeleted = true; return c.json({ ok: true, already: true }); }
  if (record.kind === 'file' && !await deleteFileKeys(c.env, shareFileKeys(record)))
    return c.json({ error: 'storage_unavailable', message: '文件存储绑定不可用，未删除分享' }, 503);
  if (record.files) auditState(c).detail.fileCount = record.files.length;
  await store.deleteByCode(code);
  if (record.kind === 'file') auditState(c).detail.filename = (record.filename || '').slice(0, 160);
  return c.json({ ok: true });
});
