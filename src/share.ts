import { Hono } from 'hono';
import { num, type Env } from './types';
import { err, parseExpiry, parseMaxPickups, contentDisposition } from './util';
import { getStore, shareStatusOf } from './store';
import { fileMode, fileMaxSize, KV_FILE_PREFIX, putFileBytes, deleteFile, readFileStream } from './filestore';
import type { Context } from 'hono';

export const shareRoutes = new Hono<{ Bindings: Env }>();

/** 创建文本分享 */
shareRoutes.post('/shares/text', async (c) => {
  const body = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return err(c, 400, 'bad_request', '请求体必须是 JSON');

  const text = body.text;
  const maxLen = num(c.env.MAX_TEXT_LENGTH, 65_536);
  if (typeof text !== 'string' || !text.trim()) return err(c, 400, 'bad_request', '文本内容不能为空');
  if (text.length > maxLen) return err(c, 400, 'bad_request', `文本超过上限 ${maxLen} 字符`);

  const expMs = parseExpiry(body.expiry);
  if (expMs === undefined) return err(c, 400, 'bad_request', '有效期参数非法');
  const mp = parseMaxPickups(body.maxPickups);
  if (mp === undefined) return err(c, 400, 'bad_request', '取件次数参数非法');

  const now = Date.now();
  const expireAt = expMs === null ? null : now + expMs;
  const created = await getStore(c.env).createShare({
    kind: 'text',
    size: text.length,
    text,
    maxPickups: mp,
    expireAt,
  });

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
});

/**
 * 小存储模式(KV)直传:整个文件作为请求体一次性上传(≤24MB,远低于 100MB 请求体限制)。
 * 元数据走查询参数(文件名等需 URL 编码,中文友好)。
 * 大存储模式(R2)请走 /api/uploads 分片流程,此端点返回 400。
 */
shareRoutes.post('/shares/file', async (c) => {
  if (fileMode(c.env) !== 'kv') {
    return err(c, 400, 'config', '当前为 R2 大存储模式,请使用分片上传(/api/uploads/init)');
  }

  const filename = c.req.query('filename')?.trim();
  if (!filename) return err(c, 400, 'bad_request', '缺少 filename 查询参数');
  const expMs = parseExpiry(c.req.query('expiry'));
  if (expMs === undefined) return err(c, 400, 'bad_request', '有效期参数非法');
  const pkRaw = c.req.query('maxPickups');
  const mp = parseMaxPickups(pkRaw === undefined || pkRaw === '' ? null : Number(pkRaw));
  if (mp === undefined) return err(c, 400, 'bad_request', '取件次数参数非法');

  const maxSize = fileMaxSize(c.env);
  const declared = Number(c.req.raw.headers.get('content-length') || 0);
  if (declared && declared > maxSize) {
    return err(c, 413, 'too_large', `文件超过上限 ${Math.floor(maxSize / 1024 / 1024)} MB`);
  }

  const bytes = await c.req.arrayBuffer();
  if (bytes.byteLength < 1) return err(c, 400, 'bad_request', '文件内容为空');
  if (bytes.byteLength > maxSize) {
    return err(c, 413, 'too_large', `文件超过上限 ${Math.floor(maxSize / 1024 / 1024)} MB`);
  }

  const mime = c.req.query('mime')?.trim() || c.req.header('Content-Type')?.split(';')[0] || 'application/octet-stream';
  const storageKey = KV_FILE_PREFIX + crypto.randomUUID();
  const expireAt = expMs === null ? null : Date.now() + expMs;

  // 先落文件再落元数据;元数据失败时回收文件键(补偿,防孤儿字节)
  await putFileBytes(c.env, storageKey, bytes);
  try {
    const created = await getStore(c.env).createShare({
      kind: 'file',
      filename: filename.slice(0, 255),
      size: bytes.byteLength,
      mime,
      r2Key: storageKey,
      maxPickups: mp,
      expireAt,
    });
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
});

/** 取件:文本查看即计数;文件只返回元数据(下载时才计数) */
shareRoutes.post('/pickup', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { code?: unknown };
  const code = String(body?.code ?? '').trim();
  if (!/^\d{6}$/.test(code)) return err(c, 400, 'bad_request', '请输入 6 位取件口令');

  const store = getStore(c.env);
  const now = Date.now();
  const picked = await store.tryPickup(code, { textOnly: true });
  if (picked) {
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

/** 文件下载:原子计数 → R2 流式返回 */
shareRoutes.get('/pickup/:code/download', async (c) => {
  const code = c.req.param('code');
  const store = getStore(c.env);
  const now = Date.now();

  const row = await store.tryPickup(code);
  if (!row || row.kind !== 'file' || !row.r2Key) {
    const raw = await store.getByCode(code);
    if (!raw) return downloadError(c, 404, 'not_found', '口令不存在');
    const st = shareStatusOf(raw.expireAt, raw.maxPickups, raw.pickupCount, now);
    if (st === 'expired') return downloadError(c, 410, 'expired', '分享已过期');
    if (st === 'exhausted') return downloadError(c, 410, 'exhausted', '取件次数已用完');
    return downloadError(c, 410, 'gone', '文件不存在');
  }

  // 按存储键前缀路由到 KV(小存储)或 R2(大存储)
  const body = await readFileStream(c.env, row.r2Key);
  if (!body) return downloadError(c, 410, 'gone', '文件已被清理');

  return c.body(body, 200, {
    'Content-Type': row.mime || 'application/octet-stream',
    'Content-Length': String(row.size),
    'Content-Disposition': contentDisposition(row.filename || 'file'),
    'Cache-Control': 'no-store',
  });
});
