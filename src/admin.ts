import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import type { Context } from 'hono';
import type { Env } from './types';
import { err, contentDisposition } from './util';
import { getStore, shareStatusOf } from './store';
import { deleteFile, readFileStream, inspectFile } from './filestore';
import { sourceSummary } from './upload-source';
import { runCleanup } from './cleanup';
import { getCapacityUsage } from './quota';
import { getRetentionDays, setRetentionDays, validRetentionDays, RETENTION_DAY_MS } from './settings';
import { getGuestLimits, setGuestLimits, validGuestLimits } from './upload-policy';
import { checkLogin, recordLogin, loginIP, loginProtectionStatus, unblockLogin } from './login-protection';
import { auditRequest, auditState, queryAudit } from './audit';

export const adminRoutes = new Hono<{ Bindings: Env }>();
adminRoutes.use('*', auditRequest);

/**
 * 管理后台入口路径:读 secret ADMIN_PATH(可选)。
 * 格式:字母/数字/-/_ 组成的单段路径,1-64 位(带不带前导 / 均可);
 * 未设置或非法时回退默认 /admin;保留路径(/api、/pickup)不允许占用。
 */
export function adminPath(env: Env): string {
  const raw = env.ADMIN_PATH?.trim();
  if (!raw) return '/admin';
  const p = raw.startsWith('/') ? raw : `/${raw}`;
  if (!/^\/[A-Za-z0-9_-]{1,64}$/.test(p)) return '/admin';
  if (p === '/api' || p === '/pickup') return '/admin';
  return p;
}

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
  c.header('Cache-Control', 'no-store');
  if (c.req.method === 'POST' && c.req.path === '/api/admin/login') return next();
  // cleanup 双通道:外部定时器/脚本带 Bearer token(Pages 无 Cron Triggers 的补偿),或管理页 cookie
  if (c.req.method === 'POST' && c.req.path === '/api/admin/cleanup') {
    const bearer = c.req.header('Authorization');
    if (bearer?.startsWith('Bearer ')) {
      if (!c.env.ADMIN_TOKEN) return c.json({ error: 'config', message: '管理员令牌未配置' }, 503);
      const ip = loginIP(c);
      await checkLogin(c.env, ip);
      const valid = await safeEqual(bearer.slice(7), c.env.ADMIN_TOKEN);
      await recordLogin(c.env, ip, valid);
      if (valid) { auditState(c).authenticated = true; auditState(c).actor = 'token'; return next(); }
      return err(c, 401, 'unauthorized', '令牌无效');
    }
  }
  if (!(await isValidCookie(c.env, getCookie(c, 'admin')))) {
    return err(c, 401, 'unauthorized', '未登录或会话已过期');
  }
  auditState(c).authenticated = true;
  auditState(c).actor = 'admin';
  await next();
});

adminRoutes.post('/login', async (c) => {
  if (!c.env.ADMIN_TOKEN) return c.json({ error: 'config', message: '管理员令牌未配置' }, 503);
  const origin = c.req.header('Origin');
  if (origin && origin !== new URL(c.req.url).origin) return c.json({ error: 'forbidden', message: '请求来源不匹配' }, 403);
  const ip = loginIP(c);
  await checkLogin(c.env, ip);
  const body = (await c.req.json().catch(() => null)) as { token?: unknown } | null;
  const token = body?.token;
  if (typeof token !== 'string' || !(await safeEqual(token, c.env.ADMIN_TOKEN || ''))) {
    await recordLogin(c.env, ip, false);
    return err(c, 401, 'unauthorized', '令牌无效');
  }
  await recordLogin(c.env, ip, true);
  auditState(c).authenticated = true;
  auditState(c).actor = 'admin';
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

/** Read/export never expose raw headers, tokens or request bodies. */
async function auditList(c: Context<{ Bindings: Env }>) {
  try { return c.json(await queryAudit(c.env, c.req.query())); }
  catch (error) {
    return error instanceof RangeError
      ? c.json({ error: 'bad_request', message: '日志筛选参数无效' }, 400)
      : c.json({ error: 'audit_unavailable', message: '审计日志暂不可用，请稍后重试' }, 503);
  }
}
adminRoutes.get('/audit-logs', auditList);
adminRoutes.get('/audit-logs/export', auditList);

/** Bans affect new logins only; existing authenticated sessions can inspect and unblock. */
adminRoutes.get('/login-protection', async c => c.json(await loginProtectionStatus(c.env)));
adminRoutes.post('/login-protection/unblock', async c => {
  const origin = c.req.header('Origin');
  if (origin && origin !== new URL(c.req.url).origin) return c.json({ error: 'forbidden', message: '请求来源不匹配' }, 403);
  if (!c.req.header('Content-Type')?.startsWith('application/json')) return c.json({ error: 'bad_request', message: '请使用 JSON' }, 415);
  const body = await c.req.json().catch(() => null) as { ip?: unknown } | null;
  if (typeof body?.ip !== 'string' || !/^(unknown|[0-9a-f:.]{3,45})$/.test(body.ip)) return err(c, 400, 'bad_request', 'IP 格式无效');
  auditState(c).target = body.ip;
  await unblockLogin(c.env, body.ip);
  return c.json({ ok: true });
});

/** Retention is applied on the next cleanup run; saving never deletes files. */
adminRoutes.get('/settings', async (c) => c.json({ expiredRetentionDays: await getRetentionDays(c.env) }));
adminRoutes.put('/settings', async (c) => {
  const origin = c.req.header('Origin');
  if (origin && origin !== new URL(c.req.url).origin) return c.json({ error: 'forbidden', message: '请求来源不匹配' }, 403);
  if (!c.req.header('Content-Type')?.startsWith('application/json')) return c.json({ error: 'bad_request', message: '请使用 JSON' }, 415);
  const body = await c.req.json().catch(() => null) as { expiredRetentionDays?: unknown } | null;
  if (!validRetentionDays(body?.expiredRetentionDays)) return err(c, 400, 'bad_request', '保留天数应为 0–3650 的整数');
  auditState(c).detail.expiredRetentionDays = body.expiredRetentionDays;
  await setRetentionDays(c.env, body.expiredRetentionDays);
  return c.json({ expiredRetentionDays: body.expiredRetentionDays });
});

/** Admin-maintained limits for visitors without a note. */
adminRoutes.get('/upload-policy', async c => c.json(await getGuestLimits(c.env)));
adminRoutes.put('/upload-policy', async c => {
  const origin = c.req.header('Origin');
  if (origin && origin !== new URL(c.req.url).origin) return c.json({ error: 'forbidden', message: '请求来源不匹配' }, 403);
  if (!c.req.header('Content-Type')?.startsWith('application/json')) return c.json({ error: 'bad_request', message: '请使用 JSON' }, 415);
  const body: unknown = await c.req.json().catch(() => null);
  if (!validGuestLimits(body)) return err(c, 400, 'bad_request', '周次数应为 0–1000 的整数');
  const limits = { weeklyFileLimit: body.weeklyFileLimit };
  auditState(c).detail.weeklyFileLimit = limits.weeklyFileLimit;
  await setGuestLimits(c.env, limits);
  return c.json(limits);
});

/** 概览统计 */
adminRoutes.get('/stats', async (c) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const stats = await getStore(c.env).stats(todayStart.getTime());
  let storage = null;
  if (c.env.BUCKET) {
    try { storage = await getCapacityUsage(c.env); }
    catch (e) { console.error('Capacity statistics unavailable', e); }
  }
  return c.json({ ...stats, storage, fileBackend: c.env.BUCKET ? 'r2' : 'kv' });
});

/** 分享列表(状态惰性计算),?limit=50&offset=0;响应字段沿用 snake_case(前端契约) */
adminRoutes.get('/shares', async (c) => {
  const limit = Math.min(Math.max(Number(c.req.query('limit') || 50) || 50, 1), 200);
  const offset = Math.max(Number(c.req.query('offset') || 0) || 0, 0);
  const now = Date.now();

  const store = getStore(c.env);
  const { total, rows } = await store.listShares(limit, offset);
  const ids = [...new Set(rows.flatMap((r) => r.source ? [r.source.visitorId] : []))];
  const notes = await store.getVisitorNotes(ids);
  return c.json({
    total,
    rows: rows.map((r) => ({
      id: r.id,
      code: r.code,
      kind: r.kind,
      filename: r.filename,
      size: r.size,
      pickup_count: r.pickupCount,
      max_pickups: r.maxPickups,
      expire_at: r.expireAt,
      created_at: r.createdAt,
      status: shareStatusOf(r.expireAt, r.maxPickups, r.pickupCount, now),
      text_preview: r.textPreview,
      source: r.source ? { ...r.source, note: notes.get(r.source.visitorId) ?? '' } : null,
    })),
  });
});

/** Full filenames are loaded on demand; the KV list uses shortened metadata. */
adminRoutes.get('/shares/:code', async (c) => {
  const code = c.req.param('code');
  if (!/^\d{6}$/.test(code)) return err(c, 400, 'bad_request', '口令非法');
  const store = getStore(c.env);
  const record = await store.getByCode(code);
  if (!record) return err(c, 404, 'not_found', '分享不存在');
  if (record.kind !== 'file') return err(c, 400, 'bad_request', '此分享不是文件');
  const [days, storage, note] = await Promise.all([
    getRetentionDays(c.env), inspectFile(c.env, record.r2Key),
    record.source ? store.getVisitorNote(record.source.visitorId) : Promise.resolve(''),
  ]);
  const evaluatedAt = Date.now();
  const cleanupAfter = record.expireAt === null ? null : record.expireAt + days * RETENTION_DAY_MS;
  const cleanupStatus = cleanupAfter === null ? 'permanent' : record.expireAt! > evaluatedAt ? 'active'
    : cleanupAfter > evaluatedAt ? 'retained' : 'pending';
  return c.json({ code, filename: record.filename, size: record.size, mime: record.mime,
    createdAt: record.createdAt, expireAt: record.expireAt,
    cleanupAfter, cleanupStatus, retentionDays: days, evaluatedAt, storage,
    source: record.source ? { ...sourceSummary(record.source), note } : null,
    pickupCount: record.pickupCount, maxPickups: record.maxPickups,
    status: shareStatusOf(record.expireAt, record.maxPickups, record.pickupCount, evaluatedAt),
    downloadUrl: `/api/admin/shares/${code}/download`,
  });
});

/** Admin downloads read retained files without consuming public pickup limits. */
adminRoutes.get('/shares/:code/download', async (c) => {
  const code = c.req.param('code');
  if (!/^\d{6}$/.test(code)) return err(c, 400, 'bad_request', '口令非法');
  const record = await getStore(c.env).getByCode(code);
  if (!record) return err(c, 404, 'not_found', '分享不存在');
  auditState(c).detail.filename = (record.filename || '').slice(0, 160);
  auditState(c).detail.sizeBytes = record.size;
  if (record.kind !== 'file') return err(c, 400, 'bad_request', '此分享不是文件');
  if (!record.r2Key) return err(c, 410, 'gone', '文件已被清理');
  const body = await readFileStream(c.env, record.r2Key);
  if (!body) return err(c, 410, 'gone', '文件已被清理');
  return c.body(body, 200, {
    'Content-Type': record.mime || 'application/octet-stream',
    'Content-Length': String(record.size),
    'Content-Disposition': contentDisposition(record.filename || 'file'),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
});

/** Full IP is returned only here, behind the admin middleware. */
adminRoutes.get('/shares/:code/source', async (c) => {
  const code = c.req.param('code');
  if (!/^\d{6}$/.test(code)) return err(c, 400, 'bad_request', '口令非法');
  const store = getStore(c.env);
  const record = await store.getByCode(code);
  if (!record) return err(c, 404, 'not_found', '分享不存在');
  return c.json({ source: record.source ? { ...record.source, note: await store.getVisitorNote(record.source.visitorId) } : null });
});

adminRoutes.put('/shares/:code/source', async (c) => {
  const origin = c.req.header('Origin');
  if (origin && origin !== new URL(c.req.url).origin) return c.json({ error: 'forbidden', message: '请求来源不匹配' }, 403);
  if (!c.req.header('Content-Type')?.startsWith('application/json')) return c.json({ error: 'bad_request', message: '请使用 JSON' }, 415);
  const code = c.req.param('code');
  if (!/^\d{6}$/.test(code)) return err(c, 400, 'bad_request', '口令非法');
  const body = await c.req.json().catch(() => null) as { note?: unknown } | null;
  if (typeof body?.note !== 'string' || body.note.length > 64 || /[\u0000-\u001f\u007f]/.test(body.note)) {
    return err(c, 400, 'bad_request', '备注应为不超过 64 字符的单行文本');
  }
  const store = getStore(c.env);
  const record = await store.getByCode(code);
  if (!record) return err(c, 404, 'not_found', '分享不存在');
  if (!record.source) return c.json({ error: 'source_unrecorded', message: '此记录没有访客来源' }, 409);
  const note = body.note.trim();
  auditState(c).detail.notePresent = !!note;
  await store.setVisitorNote(record.source.visitorId, note);
  return c.json({ visitorId: record.source.visitorId, note });
});

/** 删除分享:按口令删(D1/KV 通吃),文件的先删存储对象(R2/KV 按键前缀路由)再删元数据。
 *  幂等:口令不存在(含 KV list 索引滞后窗口里的幽灵行重复删除)同样返回 ok */
adminRoutes.delete('/shares/:code', async (c) => {
  const code = c.req.param('code');
  if (!/^\d{6}$/.test(code)) return err(c, 400, 'bad_request', '口令非法');

  const store = getStore(c.env);
  const rec = await store.getByCode(code);
  if (!rec) { auditState(c).detail.alreadyDeleted = true; return c.json({ ok: true, already: true }); }
  auditState(c).detail.filename = (rec.filename || '').slice(0, 160);
  auditState(c).detail.sizeBytes = rec.size;

  if (rec.kind === 'file') await deleteFile(c.env, rec.r2Key);
  await store.deleteByCode(code);
  return c.json({ ok: true });
});

/** 手动/外部定时触发清理:Pages 部署没有 Cron Triggers,用外部定时器打这里;
 *  Workers 粘贴部署也兼容(与 scheduled 共用 runCleanup)。鉴权见上方中间件(Bearer 或 cookie)。 */
adminRoutes.post('/cleanup', async (c) => {
  const result = await runCleanup(c.env);
  auditState(c).detail = result;
  return c.json({ ok: true, ...result });
});

export type AdminContext = Context<{ Bindings: Env }>;
