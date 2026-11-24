import { apiIdentity, isApiPath, transferPath } from './api-auth';
import type { Context } from 'hono';
import type { Env } from './types';
import type { SessionRecord, ShareRecord } from './store';
import { appendAudit, auditEnabled, auditState, type AuditEntry } from './audit';
import { loginIP } from './login-protection';
import { SecurityError } from './security';
import { ensureVisitor } from './upload-source';

const bounded = (value: unknown, max = 80) => typeof value === 'string'
  ? value.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, max) : '';

/** Use server-validated metadata, never the request body or the upload session bearer token. */
export function transferAudit(c: Context, record: Pick<ShareRecord, 'filename' | 'size' | 'source'> & { kind?: string }) {
  const detail = auditState(c).detail;
  if (record.filename) detail.filename = bounded(record.filename, 160);
  detail[record.kind === 'text' ? 'textLength' : 'sizeBytes'] = record.size;
  if (record.kind) detail.kind = record.kind;
  if (record.source) detail.visitorId = record.source.visitorId;
}

export function uploadSessionAudit(c: Context, session: SessionRecord) {
  transferAudit(c, { ...session, kind: 'file' });
}

export function publicRejection(c: Context, error: SecurityError) {
  const detail = auditState(c).detail;
  detail.securityReason = error.reason;
  detail.newBan = error.newBan;
  if (error.retryAt) detail.bannedUntil = error.retryAt;
}

function select(path: string, method: string) {
  if (method === 'POST' && ['/api/shares/file', '/api/shares/text'].includes(path))
    return { category: 'upload' as const, stage: path.endsWith('/text') ? 'text' : 'direct', action: 'upload' };
  if (method === 'POST' && path === '/api/uploads/init')
    return { category: 'upload' as const, stage: 'init', action: 'upload' };
  const session = /^\/api\/uploads\/([^/]+)\/(complete|abort|parts\/[^/]+)$/.exec(path);
  if (session && (method === 'POST' && ['complete', 'abort'].includes(session[2]) || method === 'PUT' && session[2].startsWith('parts/')))
    return { category: 'upload' as const, stage: session[2].startsWith('parts/') ? 'part' : session[2],
      action: session[2] === 'abort' ? 'uploadCancel' : 'upload', session: session[1] };
  if (method === 'POST' && path === '/api/pickup')
    return { category: 'pickup' as const, stage: 'lookup', action: 'pickup' };
  if (['GET', 'HEAD'].includes(method) && /^\/api\/pickup\/[^/]+\/download$/.test(path))
    return { category: 'pickup' as const, stage: 'download', action: method === 'HEAD' ? 'downloadProbe' : 'publicDownload' };
}

/** Outermost API middleware: observes the final response, including pre-handler protection failures. */
export async function publicAudit(c: Context<{ Bindings: Env }>, next: () => Promise<void>) {
  const selected = select(transferPath(c.req.path, c.req.method), c.req.method), start = Date.now();
  await next();
  if (!selected || !auditEnabled(c.env) || isApiPath(c.req.path) && !apiIdentity(c)) return;
  try { await recordPublicAudit(c, selected, start); }
  catch {
    // Preparation errors must not replace a completed transfer response either.
    console.warn('Public audit record could not be prepared');
    c.header('X-Audit-Status', 'unavailable');
  }
}

async function recordPublicAudit(c: Context<{ Bindings: Env }>, selected: NonNullable<ReturnType<typeof select>>, start: number) {
  const status = c.res.status;
  // A multipart success means the completed share, not each accepted part/init or an idempotent abort.
  const state = auditState(c);
  if (status < 400 && (['init', 'part'].includes(selected.stage) || selected.stage === 'abort' && !state.detail.cancelled)) return;
  if (c.error instanceof SecurityError) publicRejection(c, c.error);
  const detail = { ...state.detail };
  const securityReason = state.detail.securityReason;
  const newBan = state.detail.newBan;
  delete detail.securityReason; delete detail.newBan; delete detail.cancelled;
  let reason = typeof detail.reason === 'string' ? detail.reason : '';
  if (status >= 400 && c.req.method !== 'HEAD' && c.res.headers.get('Content-Type')?.includes('application/json')) {
    // Only small, server-generated error responses are read; never consume a file/text response stream.
    const error = await c.res.clone().json() as { error?: unknown };
    reason ||= bounded(error.error, 64);
  }
  let category: AuditEntry['category'] = selected.category, action = selected.action;
  const blocked = status === 403 || status === 429;
  let target = bounded(state.target);
  if (typeof securityReason === 'string') {
    category = 'security'; action = newBan ? 'ban' : 'accessBlocked';
    target = selected.category;
    // Group rejected requests across guessed codes/session IDs; do not persist attacker-chosen targets.
    for (const key of Object.keys(detail)) if (key !== 'bannedUntil') delete detail[key];
    detail.scope = selected.category; reason = securityReason;
    if (typeof state.detail.bannedUntil === 'number') detail.bannedUntil = state.detail.bannedUntil;
  } else {
    detail.stage = selected.stage;
    detail.visitorId = await ensureVisitor(c);
    if ('session' in selected && selected.session) {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(selected.session));
      detail.uploadRef = Array.from(new Uint8Array(digest).slice(0, 8), b => b.toString(16).padStart(2, '0')).join('');
    }
  }
  if (reason) detail.reason = reason;
  const cf = c.req.raw.cf;
  const event: AuditEntry = { id: crypto.randomUUID(), at: start, category, action,
    result: blocked ? 'blocked' : status < 400 ? 'success' : 'failed', actor: apiIdentity(c) ? 'token' : 'anonymous', ip: loginIP(c),
    country: bounded(cf?.country, 2), region: bounded(cf?.region), city: bounded(cf?.city),
    method: c.req.method, status, target, agent: bounded(c.req.header('User-Agent'), 200),
    durationMs: Math.max(0, Date.now() - start), detail };
  if (!await appendAudit(c.env, event, status >= 400 && !newBan)) c.header('X-Audit-Status', 'unavailable');
}
