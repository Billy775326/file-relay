import { securityResponse } from './security';
import { auditState } from './audit';
import { transferAudit } from './public-audit';
import { uploadAccess, checkUploadOptions, admitFile, policyErrorResponse } from './upload-policy';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { batchPickupUntil, issueBatchPickup } from './batch-pickup';
import { num, type Env } from './types';
import { err, parseExpiry, parseMaxPickups, contentDisposition } from './util';
import { getStore, shareStatusOf } from './store';
import { fileMode, KV_FILE_PREFIX, putFileBytes, deleteFile, readFileStream, readUploadBytes, describeFiles, shareFile } from './filestore';
import type { Context } from 'hono';
import { parseSubmission } from './upload-source';

export const shareRoutes = new Hono<{ Bindings: Env }>();
shareRoutes.onError((error, c) => {
  const rejection = policyErrorResponse(c, error) ?? securityResponse(c, error);
  if (rejection) return rejection;
  console.error('Share request failed', error);
  return c.json({ error: 'internal', message: '分享服务暂不可用，请稍后重试' }, 503);
});

/** 创建文本分享 */
export async function createTextShare(c: Context<{ Bindings: Env }>) {
  const body = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return err(c, 400, 'bad_request', '请求体必须是 JSON');
  const submission = parseSubmission(body);
  if (!submission) return err(c, 400, 'bad_request', '称呼限 40 字，说明限 300 字');

  const text = body.text;
  const maxLen = num(c.env.MAX_TEXT_LENGTH, 65_536);
  if (typeof text !== 'string' || !text.trim()) return err(c, 400, 'bad_request', '文本内容不能为空');
  if (text.length > maxLen) return err(c, 400, 'bad_request', `文本超过上限 ${maxLen} 字符`);

  const expMs = parseExpiry(body.expiry);
  if (expMs === undefined) return err(c, 400, 'bad_request', '有效期参数非法');
  const mp = parseMaxPickups(body.maxPickups);
  if (mp === undefined) return err(c, 400, 'bad_request', '取件次数参数非法');

  const access = await uploadAccess(c);
  checkUploadOptions(access, null, expMs, mp);
  const now = Date.now();
  const expireAt = expMs === null ? null : now + expMs;
  const created = await getStore(c.env).createShare({
    kind: 'text',
    source: { ...access.source, submission },
    size: text.length,
    text,
    maxPickups: mp,
    expireAt,
  });
  auditState(c).target = created.code;
  auditState(c).detail.kind = 'text';
  auditState(c).detail.textLength = text.length;

  return c.json(
    {
      code: created.code,
      kind: 'text',
      size: text.length,
      expireAt,
      maxPickups: mp,
      pickupUrl: `/pickup?code=${created.code}`,
    },
    201,
  );
}
shareRoutes.post('/shares/text', bodyLimit({ maxSize: 1_048_576,
  onError: c => err(c, 413, 'too_large', '文本请求超过 1 MiB 上限'),
}), createTextShare);

/**
 * 小存储模式(KV)直传:整个文件作为请求体一次性上传(≤25 MiB,远低于 100MB 请求体限制)。
 * 元数据走查询参数(文件名等需 URL 编码,中文友好)。
 * 大存储模式(R2)请走 /api/uploads 分片流程,此端点返回 400。
 */
export async function createKVFileShare(c: Context<{ Bindings: Env }>) {
  if (fileMode(c.env) !== 'kv') {
    return err(c, 400, 'config', '当前为 R2 大存储模式,请使用分片上传(/api/uploads/init)');
  }

  const filename = c.req.query('filename')?.trim();
  // Header keeps free-text descriptions out of request URLs and access logs.
  let context: Record<string, unknown>;
  try {
    if ((c.req.header('X-Upload-Context') || '').length > 8192) throw new Error('too long');
    context = JSON.parse(decodeURIComponent(c.req.header('X-Upload-Context') || '%7B%7D'));
    if (!context || typeof context !== 'object' || Array.isArray(context)) throw new Error('invalid');
  } catch { return err(c, 400, 'bad_request', '上传说明格式错误'); }
  const submission = parseSubmission(context);
  if (!submission) return err(c, 400, 'bad_request', '称呼限 40 字，说明限 300 字');
  if (!filename) return err(c, 400, 'bad_request', '缺少 filename 查询参数');
  auditState(c).detail.filename = filename.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 160);
  const expMs = parseExpiry(c.req.query('expiry'));
  if (expMs === undefined) return err(c, 400, 'bad_request', '有效期参数非法');
  const pkRaw = c.req.query('maxPickups');
  const mp = parseMaxPickups(pkRaw === undefined || pkRaw === '' ? null : Number(pkRaw));
  if (mp === undefined) return err(c, 400, 'bad_request', '取件次数参数非法');

  const access = await uploadAccess(c);
  const maxSize = access.maxFileSize;
  checkUploadOptions(access, null, expMs, mp);
  const declared = Number(c.req.raw.headers.get('content-length') || 0);
  if (declared && declared > maxSize) {
    return err(c, 413, 'too_large', `文件超过上限 ${maxSize} 字节`);
  }

  await admitFile(c.env, access);
  // Bound actual bytes as well as Content-Length; do not buffer an unbounded request.
  if (!c.req.raw.body) return err(c, 400, 'bad_request', '文件内容为空');
  const bytes = await readUploadBytes(c.req.raw.body, maxSize);
  if (!bytes) return err(c, 413, 'too_large', `文件超过上限 ${maxSize} 字节`);
  if (bytes.byteLength < 1) return err(c, 400, 'bad_request', '文件内容为空');
  const mime = c.req.query('mime')?.trim() || c.req.header('Content-Type')?.split(';')[0] || 'application/octet-stream';
  const storageKey = KV_FILE_PREFIX + crypto.randomUUID();
  const expireAt = expMs === null ? null : Date.now() + expMs;

  // 先落文件再落元数据;元数据失败时回收文件键(补偿,防孤儿字节)
  await putFileBytes(c.env, storageKey, bytes.buffer);
  try {
    const created = await getStore(c.env).createShare({
      kind: 'file',
      source: { ...access.source, submission },
      filename: filename.slice(0, 255),
      size: bytes.byteLength,
      mime,
      r2Key: storageKey,
      maxPickups: mp,
      expireAt,
    });
    auditState(c).target = created.code;
    transferAudit(c, { filename, size: bytes.byteLength, kind: 'file' });
    return c.json(
      {
        code: created.code,
        kind: 'file',
        size: bytes.byteLength,
        expireAt,
        maxPickups: mp,
        pickupUrl: `/pickup?code=${created.code}`,
      },
      201,
    );
  } catch (e) {
    await deleteFile(c.env, storageKey);
    throw e;
  }
}
shareRoutes.post('/shares/file', createKVFileShare);

/** 取件:文本查看即计数;文件只返回元数据(下载时才计数) */
shareRoutes.post('/pickup', async (c) => {
  c.header('Cache-Control', 'no-store');
  const body = (await c.req.json().catch(() => ({}))) as { code?: unknown };
  const code = String(body?.code ?? '').trim();
  if (!/^\d{6}$/.test(code)) return err(c, 400, 'bad_request', '请输入 6 位取件口令');
  auditState(c).target = code;

  const store = getStore(c.env);
  const now = Date.now();
  const picked = await store.tryPickup(code, { textOnly: true });
  if (picked) {
    auditState(c).detail.kind = 'text';
    auditState(c).detail.textLength = picked.size;
    return c.json({
      kind: 'text',
      text: picked.text,
      size: picked.size,
      expireAt: picked.expireAt,
      pickupsLeft:
        picked.maxPickups === null ? null : Math.max(0, picked.maxPickups - picked.pickupCount),
    });
  }

  const row = await store.getByCode(code);
  if (!row) return err(c, 404, 'not_found', '口令不存在');
  transferAudit(c, { ...row, source: null });
  if (row.files) {
    if (!c.env.ADMIN_TOKEN) return err(c, 503, 'config', '取件服务未配置完成');
    let record = row;
    let downloadUntil = await batchPickupUntil(c, record);
    if (!downloadUntil) {
      const claimed = await store.tryPickup(code, { kind: 'file', id: row.id });
      if (!claimed) {
        const current = await store.getByCode(code);
        if (!current || current.id !== row.id) return err(c, 404, 'not_found', '口令不存在');
        const expired = current.expireAt !== null && current.expireAt <= Date.now();
        return expired ? err(c, 410, 'expired', '分享已过期') : err(c, 410, 'exhausted', '取件次数已用完');
      }
      record = claimed;
      downloadUntil = await issueBatchPickup(c, record);
    }
    auditState(c).detail.fileCount = row.files.length;
    return c.json({ kind: 'file', size: record.size, files: describeFiles(record, `/api/pickup/${code}`),
      expireAt: record.expireAt, downloadUntil,
      pickupsLeft: record.maxPickups === null ? null : Math.max(0, record.maxPickups - record.pickupCount) });
  }

  const st = shareStatusOf(row.expireAt, row.maxPickups, row.pickupCount, now);
  if (st === 'expired') return err(c, 410, 'expired', '分享已过期');
  if (st === 'exhausted') return err(c, 410, 'exhausted', '取件次数已用完');

  return c.json({
    kind: 'file',
    filename: row.filename,
    size: row.size,
    mime: row.mime,
    expireAt: row.expireAt,
    pickupsLeft:
      row.maxPickups === null ? null : Math.max(0, row.maxPickups - row.pickupCount),
    downloadUrl: `/api/pickup/${code}/download`,
  });
});

/** 下载错误内容协商:浏览器直接点链接时给极简 HTML 页,API 调用给 JSON */
function downloadError(c: Context, status: 404 | 410, code: string, message: string) {
  auditState(c).detail.reason = code;
  if ((c.req.header('Accept') || '').includes('text/html')) {
    return c.html(
      `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
        `<title>取件失败</title></head>` +
        `<body style="font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;background:#f6f7fb;color:#1a1d27;margin:0">` +
        `<div style="text-align:center"><p style="font-size:18px;margin:0 0 12px">${message}</p>` +
        `<a href="/pickup" style="color:#4f6ef7">返回取件页</a></div></body></html>`,
      status,
    );
  }
  return c.json({ error: code, message }, status);
}

/** Legacy files count a download. A batch member requires an existing pickup grant. */
async function publicDownload(c: Context<{ Bindings: Env }>) {
  c.header('Cache-Control', 'no-store');
  const code = c.req.param('code') || '';
  if (/^\d{6}$/.test(code)) auditState(c).target = code;
  const store = getStore(c.env);
  const row = await store.getByCode(code);
  if (!row) return downloadError(c, 404, 'not_found', '口令不存在');
  const status = shareStatusOf(row.expireAt, row.maxPickups, row.pickupCount, Date.now());
  if (status === 'expired') return downloadError(c, 410, 'expired', '分享已过期');

  const index = c.req.param('index');
  if (row.files && !await batchPickupUntil(c, row)) {
    return downloadError(c, 410, 'pickup_required', '请先输入取件口令，或重新打开取件页');
  }
  if (!row.files && status === 'exhausted') return downloadError(c, 410, 'exhausted', '取件次数已用完');
  const file = shareFile(row, index);
  if (!file) return downloadError(c, 410, 'gone', '文件不存在');

  const body = await readFileStream(c.env, file.key);
  if (!body) return downloadError(c, 410, 'gone', '文件已被清理');
  if (!row.files && c.req.method !== 'HEAD') {
    // Validate existence first. A missing blob or probe must not spend a pickup.
    const counted = await store.tryPickup(code, { kind: 'file', id: row.id });
    if (!counted) {
      await body.cancel();
      const current = await store.getByCode(code);
      if (!current || current.id !== row.id) return downloadError(c, 404, 'not_found', '口令不存在');
      return current.expireAt !== null && current.expireAt <= Date.now()
        ? downloadError(c, 410, 'expired', '分享已过期')
        : downloadError(c, 410, 'exhausted', '取件次数已用完');
    }
  }

  transferAudit(c, { ...file, source: null, kind: 'file' });
  if (row.files) auditState(c).detail.fileIndex = Number(index);
  const headers = {
    'Content-Type': file.mime,
    'Content-Length': String(file.size),
    'Content-Disposition': contentDisposition(file.filename),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  };
  if (c.req.method === 'HEAD') { await body.cancel(); return c.body(null, 200, headers); }
  return c.body(body, 200, headers);
}
shareRoutes.get('/pickup/:code/download', publicDownload);
shareRoutes.get('/pickup/:code/files/:index/download', publicDownload);
