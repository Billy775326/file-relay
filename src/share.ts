import { Hono } from 'hono';
import { num, type Env } from './types';
import { err, parseExpiry, parseMaxPickups, contentDisposition } from './util';
import { getStore, shareStatusOf } from './store';
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

  const obj = await c.env.BUCKET.get(row.r2Key);
  if (!obj || !obj.body) return downloadError(c, 410, 'gone', '文件已被清理');

  return c.body(obj.body, 200, {
    'Content-Type': row.mime || 'application/octet-stream',
    'Content-Length': String(obj.size),
    'Content-Disposition': contentDisposition(row.filename || 'file'),
    'Cache-Control': 'no-store',
  });
});
