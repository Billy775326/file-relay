import { safeEqual } from './auth';
import { securityEnabled, securityState, enforceSecurity, editSecurity, SecurityError, canonicalIP, evaluate, exempt, SCOPES, type Scope } from './security';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import type { Context } from 'hono';
import { num, type Env } from './types';
import { err, contentDisposition } from './util';
import { getStore, shareStatusOf, sameShareRules } from './store';
import type { ShareListFilter } from './store';
import { readFileStream, inspectShareFiles, describeFiles, shareFile, shareFileKeys, deleteFileKeys } from './filestore';
import { previewFile } from './file-preview';
import { sourceSummary } from './upload-source';
import { runCleanup } from './cleanup';
import { getCapacityUsage } from './quota';
import { getKVUsage } from './kv-usage';
import { getRetentionDays, setRetentionDays, validRetentionDays, RETENTION_DAY_MS } from './settings';
import { getGuestLimits, setGuestLimits, validGuestLimits } from './upload-policy';
import { checkLogin, recordLogin, loginIP, loginProtectionStatus, unblockLogin, unblockLogins } from './login-protection';
import { auditRequest, auditState, queryAudit } from './audit';
import { validShareBase, validShareRules, shareVersion } from './share-edit';

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
      await enforceSecurity(c.env, ip, 'login');
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
  await enforceSecurity(c.env, ip, 'login');
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

/** Existing authenticated sessions retain access even if new logins are blocked. */
async function securityView(env: Env) {
  const state = await securityState(env), legacy = await loginProtectionStatus(env);
  const all = [...state.bans, ...legacy.bans.map(old=>({ip:old.ip,scopes:['login'] as Scope[],kind:'auto' as const,failures:old.failures,reason:'登录失败次数过多',at:old.lastFailedAt,until:old.bannedUntil}))];
  const grouped = new Map<string, typeof all>();
  for(const entry of all) grouped.set(entry.ip,[...(grouped.get(entry.ip)||[]),entry]);
  const bans=[...grouped].map(([ip,segments])=>({ip,segments,scopes:[...new Set(segments.flatMap(b=>b.scopes))],kind:segments.some(b=>b.kind==='manual')?'manual':'auto',failures:Math.max(...segments.map(b=>b.failures)),reason:[...new Set(segments.map(b=>b.reason))].join(' / '),at:Math.min(...segments.map(b=>b.at)),until:segments.some(b=>b.until===null)?null:Math.max(...segments.map(b=>b.until!))}));
  return { enabled: securityEnabled(env), configRevision: state.configRevision, rules: state.rules, bans, allow: state.allow, regions: state.regions };
}
adminRoutes.get('/security', async c => c.json(await securityView(c.env)));
adminRoutes.post('/security/test', async c => {
  const origin=c.req.header('Origin');if(origin&&origin!==new URL(c.req.url).origin)return c.json({error:'forbidden',message:'请求来源不匹配'},403);
  if(!c.req.header('Content-Type')?.startsWith('application/json'))throw new SecurityError(400,'请使用 JSON');
  const body=await c.req.json().catch(()=>null);
  const ip=canonicalIP(body?.ip),scope=body?.scope as Scope;
  if(!securityEnabled(c.env))throw new SecurityError(503,'安全防护需要绑定 R2 或 D1');
  if(!ip||!SCOPES.includes(scope)||typeof body.country!=='string'||!/^([A-Z]{2})?$/.test(body.country)||typeof body.region!=='string'||!/^[A-Z0-9-]{0,10}$/.test(body.region)||!Number.isInteger(body.count)||body.count<0||body.count>100000)throw new SecurityError(400,'测试参数无效');
  const state=await securityState(c.env);let result=evaluate(state,ip,scope,body.country,body.region);
  if(!result.blocked&&!exempt(state,ip,scope)){
    if(scope==='login'&&(await loginProtectionStatus(c.env)).bans.some(b=>b.ip===ip))result={blocked:true,reason:'已有登录自动封禁',retryAt:undefined,status:429};
    else if(state.rules[scope].enabled&&body.count>=state.rules[scope].limit)result={blocked:true,reason:'达到自动封禁阈值',retryAt:undefined,status:429};
  }
  return c.json(result);
});
adminRoutes.post('/security', async c => {
  const origin=c.req.header('Origin');
  if(origin&&origin!==new URL(c.req.url).origin)return c.json({error:'forbidden',message:'请求来源不匹配'},403);
  if(!c.req.header('Content-Type')?.startsWith('application/json'))return c.json({error:'bad_request',message:'请使用 JSON'},415);
  if(Number(c.req.header('Content-Length')||0)>65536)throw new SecurityError(400,'规则请求过大');
  const raw=await c.req.text();if(raw.length>65536)throw new SecurityError(400,'规则请求过大');
  let body:any;try{body=JSON.parse(raw);}catch{throw new SecurityError(400,'JSON 格式无效');}
  const next=await editSecurity(c.env,body);
  if(body.action==='unban')await unblockLogins(c.env,body.ips.map((ip:string)=>canonicalIP(ip)||'unknown'));
  auditState(c).target=typeof body.ip==='string'?body.ip:typeof body.id==='string'?body.id:'security';
  auditState(c).detail.action=body.action;
  auditState(c).detail.configRevision=next.configRevision;
  return c.json({ok:true,configRevision:next.configRevision});
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
  const kv = await getKVUsage(c.env);
  return c.json({ ...stats, storage, kv, metadataBackend: c.env.fileKV ? 'kv' : 'd1', fileBackend: c.env.BUCKET ? 'r2' : 'kv' });
});

/** 分享列表(状态惰性计算),?limit=50&offset=0;响应字段沿用 snake_case(前端契约) */
adminRoutes.get('/shares', async (c) => {
  const limit = Math.min(Math.max(Number(c.req.query('limit') || 50) || 50, 1), 200);
  const offset = Math.max(Number(c.req.query('offset') || 0) || 0, 0);
  const now = Date.now();

  const store = getStore(c.env);
  const kind = c.req.query('kind'), status = c.req.query('status'), q = c.req.query('q')?.trim() ?? '';
  if (q.length > 80 || (kind && !['all', 'file', 'text'].includes(kind)) ||
      (status && !['all', 'active', 'expired', 'exhausted'].includes(status))) return err(c, 400, 'bad_request', '筛选参数非法');
  const filter: ShareListFilter = { q, ...(kind && kind !== 'all' ? { kind: kind as 'file' | 'text' } : {}),
    ...(status && status !== 'all' ? { status: status as 'active' | 'expired' | 'exhausted' } : {}) };
  const { total, rows } = await store.listShares(limit, offset, filter);
  const ids = [...new Set(rows.flatMap((r) => r.source ? [r.source.visitorId] : []))];
  const notes = await store.getVisitorNotes(ids);
  return c.json({
    total,
    rows: rows.map((r) => ({
      id: r.id,
      code: r.code,
      kind: r.kind,
      filename: r.filename,
      file_count: r.fileCount,
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

/** Full file names and text bodies are loaded privately on demand, without pickup. */
adminRoutes.get('/shares/:code', async (c) => {
  const code = c.req.param('code') ?? '';
  if (!/^\d{6}$/.test(code)) return err(c, 400, 'bad_request', '口令非法');
  const store = getStore(c.env);
  const record = await store.getByCode(code);
  if (!record) return err(c, 404, 'not_found', '分享不存在');
  const [days, storage, note] = await Promise.all([
    getRetentionDays(c.env), record.kind === 'file' ? inspectShareFiles(c.env, record) : Promise.resolve(null),
    record.source ? store.getVisitorNote(record.source.visitorId) : Promise.resolve(''),
  ]);
  const evaluatedAt = Date.now();
  const cleanupAfter = record.expireAt === null ? null : record.expireAt + days * RETENTION_DAY_MS;
  const cleanupStatus = cleanupAfter === null ? 'permanent' : record.expireAt! > evaluatedAt ? 'active'
    : cleanupAfter > evaluatedAt ? 'retained' : 'pending';
  c.header('Cache-Control', 'no-store');
  return c.json({ id: record.id, code, kind: record.kind, filename: record.filename, size: record.size, mime: record.mime,
    ...(record.kind === 'text' ? { text: record.text, version: await shareVersion(record), maxTextLength: num(c.env.MAX_TEXT_LENGTH, 65_536) } : {}),
    description: record.source?.submission?.description || null,
    displayName: record.source?.submission?.displayName || null,
    createdAt: record.createdAt, expireAt: record.expireAt,
    cleanupAfter, cleanupStatus, retentionDays: days, evaluatedAt, storage,
    source: record.source ? { ...sourceSummary(record.source), note } : null,
    pickupCount: record.pickupCount, maxPickups: record.maxPickups,
    status: shareStatusOf(record.expireAt, record.maxPickups, record.pickupCount, evaluatedAt),
    files: describeFiles(record, `/api/admin/shares/${code}`),
    downloadUrl: record.kind === 'file' && !record.files ? `/api/admin/shares/${code}/download` : null,
  });
});

/** Text edits compare the content version as well as rules; file edits preserve bytes. */
adminRoutes.put('/shares/:code', bodyLimit({ maxSize: 1_048_576,
  onError: c => err(c, 400, 'bad_request', '请求超过 1 MiB 上限') }), async c => {
  const origin = c.req.header('Origin');
  if (origin && origin !== new URL(c.req.url).origin) return err(c, 403, 'forbidden', '请求来源不匹配');
  if (!c.req.header('Content-Type')?.startsWith('application/json')) return err(c, 415, 'bad_request', '请使用 JSON');
  const code = c.req.param('code') ?? '';
  if (!/^\d{6}$/.test(code)) return err(c, 400, 'bad_request', '口令非法');
  const raw = await c.req.text();
  let body; try { body = JSON.parse(raw); } catch { return err(c, 400, 'bad_request', 'JSON 格式无效'); }
  if (!validShareRules(body?.rules) || !validShareBase(body?.expected)) return err(c, 400, 'bad_request', '次数、有效期或状态参数无效');
  const store = getStore(c.env), record = await store.getByCode(code);
  if (!record) return err(c, 404, 'not_found', '分享不存在');
  const isText = record.kind === 'text';
  if (isText && typeof body.expected.version !== 'string') return err(c, 400, 'bad_request', '缺少文本版本，请重新打开详情');
  if (isText && (!sameShareRules(record, body.expected) || body.expected.version !== await shareVersion(record))) return err(c, 409, 'share_conflict', '记录已被取件或修改，请重新加载后编辑');
  if ('text' in body && (!isText || typeof body.text !== 'string' || !body.text.trim() || body.text.length > num(c.env.MAX_TEXT_LENGTH, 65_536)))
    return err(c, 400, 'bad_request', '文本不能为空或超过字符上限，仅文本分享可修改正文');
  const cutoff = Date.now() - (await getRetentionDays(c.env)) * RETENTION_DAY_MS;
  if (record.expireAt !== null && record.expireAt <= cutoff)
    return err(c, 409, 'cleanup_pending', '分享已进入清理期，不能修改；请先备份内容后重新分享');
  if (!isText) {
    const storage = await inspectShareFiles(c.env, record);
    if (storage.state === 'missing') return err(c, 410, 'gone', '文件已被清理');
    if (storage.state !== 'available') return err(c, 503, 'storage_unavailable', '无法确认文件存储状态，请稍后重试');
  }
  // Explicit projection: callers cannot change storage keys, identity or provenance.
  const { pickupCount, maxPickups, expireAt, status } = body.rules;
  const rules = { pickupCount, maxPickups, expireAt };
  if (shareStatusOf(expireAt, maxPickups, pickupCount, Date.now()) !== status)
    return c.json({ error: 'status_mismatch', message: '状态与次数或过期时间不一致，请检查后保存' }, 400);
  const text = 'text' in body ? body.text as string : record.text;
  const updated = isText ? await store.updateShare(code, record, {
    filename: record.filename, text, size: text?.length ?? 0, ...rules,
  }, cutoff) : await store.updateRules(code, body.expected, rules, cutoff);
  if (!updated) return err(c, 409, 'share_conflict', '记录已被取件或修改，请重新加载后编辑');
  auditState(c).detail.beforeRules = JSON.stringify({ pickupCount: record.pickupCount, maxPickups: record.maxPickups, expireAt: record.expireAt });
  auditState(c).detail.afterRules = JSON.stringify(rules);
  if (isText && text !== record.text) {
    auditState(c).detail.changedFields = 'text';
    auditState(c).detail.beforeTextLength = record.text?.length ?? 0;
    auditState(c).detail.afterTextLength = text?.length ?? 0;
  }
  return c.json({ ok: true, code, ...rules, status: shareStatusOf(expireAt, maxPickups, pickupCount, Date.now()) });
});

/** Private bounded previews leave share state and pickup counts untouched. */
async function previewShare(c: AdminContext) {
  const code = c.req.param('code') ?? '';
  if (!/^\d{6}$/.test(code)) return err(c, 400, 'bad_request', '口令非法');
  const record = await getStore(c.env).getByCode(code);
  if (!record) return err(c, 404, 'not_found', '分享不存在');
  if (record.kind !== 'file') return err(c, 400, 'bad_request', '此分享不是文件');
  const file = shareFile(record, c.req.param('index'));
  if (!file) return err(c, 410, 'gone', '文件不存在');
  auditState(c).detail.filename = file.filename.slice(0, 160);
  const preview = await previewFile(c.env, file.key, file.filename, file.size);
  if (!preview) return err(c, 410, 'gone', '文件已被清理');
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Content-Security-Policy', "default-src 'none'; sandbox");
  if (preview.kind === 'image') {
    c.header('Content-Type', preview.mime);
    c.header('Content-Disposition', 'inline');
    c.header('X-Preview-Width', String(preview.width));
    c.header('X-Preview-Height', String(preview.height));
    return c.body(new Uint8Array(preview.bytes).buffer);
  }
  return c.json(preview);
}
adminRoutes.get('/shares/:code/preview', previewShare);
adminRoutes.get('/shares/:code/files/:index/preview', previewShare);

/** Admin downloads read retained files without consuming public pickup limits. */
export async function downloadShare(c: AdminContext) {
  const code = c.req.param('code') ?? '';
  if (!/^\d{6}$/.test(code)) return err(c, 400, 'bad_request', '口令非法');
  const record = await getStore(c.env).getByCode(code);
  if (!record) return err(c, 404, 'not_found', '分享不存在');
  if (record.kind !== 'file') return err(c, 400, 'bad_request', '此分享不是文件');
  const file = shareFile(record, c.req.param('index'));
  if (!file) return err(c, 410, 'gone', '文件不存在，请选择批次中的文件');
  auditState(c).detail.filename = file.filename.slice(0, 160);
  auditState(c).detail.sizeBytes = file.size;
  if (record.files) auditState(c).detail.fileIndex = Number(c.req.param('index'));
  const body = await readFileStream(c.env, file.key);
  if (!body) return err(c, 410, 'gone', '文件已被清理');
  return c.body(body, 200, {
    'Content-Type': file.mime,
    'Content-Length': String(file.size),
    'Content-Disposition': contentDisposition(file.filename),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
}
adminRoutes.get('/shares/:code/download', downloadShare);
adminRoutes.get('/shares/:code/files/:index/download', downloadShare);

/** Full IP is returned only here, behind the admin middleware. */
adminRoutes.get('/shares/:code/source', async (c) => {
  const code = c.req.param('code') ?? '';
  if (!/^\d{6}$/.test(code)) return err(c, 400, 'bad_request', '口令非法');
  const store = getStore(c.env);
  const record = await store.getByCode(code);
  if (!record) return err(c, 404, 'not_found', '分享不存在');
  if (!record.source) return c.json({ source: null });
  const { submission, ...source } = record.source;
  return c.json({ source: { ...source, displayName: submission?.displayName || null,
    note: await store.getVisitorNote(source.visitorId) } });
});

/** On-demand history is bounded and excludes deleted shares and file descriptions. */
adminRoutes.get('/shares/:code/source/activity', async c => {
  const code = c.req.param('code') ?? '';
  if (!/^\d{6}$/.test(code)) return err(c, 400, 'bad_request', '口令非法');
  const store = getStore(c.env);
  const record = await store.getByCode(code);
  if (!record) return err(c, 404, 'not_found', '分享不存在');
  const rows = record.source ? await store.visitorShares(record.source.visitorId) : [];
  return c.json({ limit: 10, rows: rows.map(row => ({ code: row.code, kind: row.kind,
    filename: row.filename, fileCount: row.files?.length, textPreview: row.kind === 'text' ? row.text?.slice(0, 50) : undefined,
    size: row.size, createdAt: row.createdAt,
    status: shareStatusOf(row.expireAt, row.maxPickups, row.pickupCount, Date.now()),
    ip: row.source?.ip ?? null, country: row.source?.country ?? null,
    region: row.source?.region ?? null, city: row.source?.city ?? null,
  })) });
});

adminRoutes.put('/shares/:code/source', async (c) => {
  const origin = c.req.header('Origin');
  if (origin && origin !== new URL(c.req.url).origin) return c.json({ error: 'forbidden', message: '请求来源不匹配' }, 403);
  if (!c.req.header('Content-Type')?.startsWith('application/json')) return c.json({ error: 'bad_request', message: '请使用 JSON' }, 415);
  const code = c.req.param('code') ?? '';
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
  const code = c.req.param('code') ?? '';
  if (!/^\d{6}$/.test(code)) return err(c, 400, 'bad_request', '口令非法');

  const store = getStore(c.env);
  const rec = await store.getByCode(code);
  if (!rec) { auditState(c).detail.alreadyDeleted = true; return c.json({ ok: true, already: true }); }
  auditState(c).detail.filename = (rec.filename || '').slice(0, 160);
  auditState(c).detail.sizeBytes = rec.size;

  if (rec.files) auditState(c).detail.fileCount = rec.files.length;
  if (rec.kind === 'file' && !await deleteFileKeys(c.env, shareFileKeys(rec)))
    return err(c, 503, 'storage_unavailable', '文件存储绑定不可用，未删除分享');
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
