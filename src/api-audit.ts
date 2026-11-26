import type { Context } from 'hono';
import type { Env } from './types';
import { auditState, appendAudit, auditEnabled, type AuditEntry } from './audit';
import { apiIdentity } from './api-auth';
import { loginIP, LoginProtectionError } from './login-protection';
import { SecurityError } from './security';

export async function apiAudit(c: Context<{ Bindings: Env }>, next: () => Promise<void>) {
  const start = Date.now();
  await next();
  if (!auditEnabled(c.env)) return;
  const authenticated = !!apiIdentity(c), state = auditState(c), path = c.req.path;
  let action = 'apiAuth';
  const item = /^\/api\/v1\/shares\/([^/]+)(?:\/(?:files\/\d+\/)?(download))?$/.exec(path);
  if (authenticated) {
    if (c.req.method === 'GET' && path === '/api/v1/shares') action = 'apiList';
    else if (item) action = item[2] ? 'apiDownload' : ({ GET: 'apiRead', HEAD: 'apiRead', PATCH: 'apiEdit', DELETE: 'apiDelete' }[c.req.method] || '');
    else return; // Transfer outcomes use the shared public audit; config and unknown paths are not business events.
    if (!action) return;
  }
  const protection = c.error instanceof LoginProtectionError ? c.error : null;
  const security = c.error instanceof SecurityError ? c.error : null;
  const detail = { ...state.detail };
  if (protection?.retryAt) detail.bannedUntil = protection.retryAt;
  if (security) detail.reason = security.reason;
  if (protection?.newBan) { action = 'ban'; detail.scope = 'login'; }
  const bounded = (v: unknown, n = 80) => typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, n) : '';
  const cf = c.req.raw.cf, status = c.res.status;
  const entry: AuditEntry = { id: crypto.randomUUID(), at: start, category: authenticated ? 'operation' : 'security', action,
    result: [403, 429].includes(status) ? 'blocked' : status < 400 ? 'success' : 'failed',
    actor: authenticated ? 'token' : 'anonymous', ip: loginIP(c), country: bounded(cf?.country, 2),
    region: bounded(cf?.region), city: bounded(cf?.city), method: c.req.method, status,
    target: authenticated && item && /^\d{6}$/.test(item[1]) ? item[1] : '', agent: bounded(c.req.header('User-Agent'), 200), durationMs: Math.max(0, Date.now() - start), detail };
  if (!await appendAudit(c.env, entry, !authenticated && !protection?.newBan)) c.header('X-Audit-Status', 'unavailable');
}
