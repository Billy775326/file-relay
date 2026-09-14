import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import type { Context } from 'hono';
import type { Env } from './types';
import { err } from './util';

export const adminRoutes = new Hono<{ Bindings: Env }>();

const enc = new TextEncoder();
const DAY_MS = 86_400_000;

const hex = (buf: ArrayBuffer): string =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

const sha256 = (s: string): Promise<ArrayBuffer> => crypto.subtle.digest('SHA-256', enc.encode(s));

/** 常量时间字符串比较:先 sha256 归一化长度,优先用 Workers 扩展 timingSafeEqual */
async function safeEqual(a: string, b: string): Promise<boolean> {
  const [da, db] = await Promise.all([sha256(a), sha256(b)]);
  const subtle = crypto.subtle as SubtleCrypto & {
    timingSafeEqual?: (x: ArrayBuffer, y: ArrayBuffer) => boolean;
  };
  if (typeof subtle.timingSafeEqual === 'function') return subtle.timingSafeEqual(da, db);
  const xa = new Uint8Array(da);
  const xb = new Uint8Array(db);
  let diff = 0;
  for (let i = 0; i < xa.length; i++) diff |= xa[i] ^ xb[i];
  return diff === 0;
}

async function hmacHex(key: string, msg: string): Promise<string> {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', k, enc.encode(msg)));
}

/** cookie 值:${exp}.${HMAC-SHA256(ADMIN_TOKEN, "admin:" + exp)} */
async function makeCookieValue(env: Env): Promise<string> {
  const exp = Date.now() + DAY_MS;
  return `${exp}.${await hmacHex(env.ADMIN_TOKEN, 'admin:' + exp)}`;
}

async function isValidCookie(env: Env, value: string | undefined): Promise<boolean> {
  if (!value) return false;
  const dot = value.indexOf('.');
  if (dot < 0) return false;
  const exp = Number(value.slice(0, dot));
  const sig = value.slice(dot + 1);
  if (!Number.isFinite(exp) || exp <= Date.now()) return false;
  return safeEqual(sig, await hmacHex(env.ADMIN_TOKEN, 'admin:' + exp));
}

/** 鉴权中间件:除 /api/admin/login 外全部校验签名 cookie */
adminRoutes.use('*', async (c, next) => {
  if (c.req.method === 'POST' && c.req.path === '/api/admin/login') return next();
  if (!(await isValidCookie(c.env, getCookie(c, 'admin')))) {
    return err(c, 401, 'unauthorized', '未登录或会话已过期');
  }
  await next();
});

adminRoutes.post('/login', async (c) => {
  const body = (await c.req.json().catch(() => null)) as { token?: unknown } | null;
  const token = body?.token;
  if (typeof token !== 'string' || !(await safeEqual(token, c.env.ADMIN_TOKEN || ''))) {
    return err(c, 401, 'unauthorized', '令牌无效');
  }
  // 生产恒为 HTTPS;本地 http://localhost 下 Chrome/FF 仍接受 Secure cookie
  const secure = c.req.url.startsWith('https');
  setCookie(c, 'admin', await makeCookieValue(c.env), {
    httpOnly: true,
    secure,
    sameSite: 'Lax',
    path: '/',
    maxAge: DAY_MS / 1000,
  });
  return c.json({ ok: true });
});

adminRoutes.post('/logout', (c) => {
  deleteCookie(c, 'admin', { path: '/' });
  return c.json({ ok: true });
});

/** 概览统计 */
adminRoutes.get('/stats', async (c) => {
  const now = Date.now();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const s = await c.env.DB.prepare(
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

  const t = await c.env.DB.prepare('SELECT COUNT(*) AS n FROM shares WHERE created_at >= ?1')
    .bind(todayStart.getTime())
    .first<{ n: number }>();

  return c.json({
    total: s?.total ?? 0,
    files: s?.files ?? 0,
    texts: s?.texts ?? 0,
    totalBytes: s?.totalBytes ?? 0,
    active: s?.active ?? 0,
    todayCreated: t?.n ?? 0,
  });
});

/** 分享列表(状态由 SQL 惰性计算),?limit=50&offset=0 */
adminRoutes.get('/shares', async (c) => {
  const limit = Math.min(Math.max(Number(c.req.query('limit') || 50) || 50, 1), 200);
  const offset = Math.max(Number(c.req.query('offset') || 0) || 0, 0);
  const now = Date.now();

  const total = (await c.env.DB.prepare('SELECT COUNT(*) AS n FROM shares').first<{ n: number }>())?.n ?? 0;
  const rows = await c.env.DB.prepare(
    `SELECT id, code, kind, filename, mime, size, pickup_count, max_pickups, expire_at, created_at,
            CASE WHEN (expire_at IS NOT NULL AND expire_at <= ?1) THEN 'expired'
                 WHEN (max_pickups IS NOT NULL AND pickup_count >= max_pickups) THEN 'exhausted'
                 ELSE 'active' END AS status,
            CASE WHEN kind = 'text' THEN substr(text, 1, 50) ELSE NULL END AS text_preview
     FROM shares ORDER BY created_at DESC LIMIT ?2 OFFSET ?3`,
  )
    .bind(now, limit, offset)
    .all();

  return c.json({ total, rows: rows.results ?? [] });
});

/** 删除分享:文件的先删 R2 对象再删行 */
adminRoutes.delete('/shares/:id', async (c) => {
  const id = c.req.param('id');
  const row = await c.env.DB.prepare('SELECT id, kind, r2_key FROM shares WHERE id = ?1')
    .bind(id)
    .first<{ id: string; kind: string; r2_key: string | null }>();
  if (!row) return err(c, 404, 'not_found', '分享不存在');

  if (row.kind === 'file' && row.r2_key) await c.env.BUCKET.delete(row.r2_key);
  await c.env.DB.prepare('DELETE FROM shares WHERE id = ?1').bind(id).run();
  return c.json({ ok: true });
});

export type AdminContext = Context<{ Bindings: Env }>;
