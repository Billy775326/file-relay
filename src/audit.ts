import type { Context } from 'hono';
import type { Env } from './types';
import { CREATE_SETTINGS } from './settings';
import { loginIP, LoginProtectionError } from './login-protection';

export const AUDIT_KEY = '__file-relay/audit-v1.json';
export const AUDIT_DAYS = 30;
export const AUDIT_LIMIT = 1000;
export type AuditCategory = 'login' | 'operation' | 'security';
export type AuditResult = 'success' | 'failed' | 'blocked';
export type AuditEntry = {
  id: string; at: number; category: AuditCategory; action: string; result: AuditResult;
  actor: 'admin' | 'token' | 'anonymous'; ip: string; country: string; region: string; city: string;
  method: string; status: number; target: string; agent: string; durationMs: number;
  detail: Record<string, string | number | boolean>;
};
type Ledger = { version: 1; revision: string; entries: AuditEntry[] };
type AuditState = { authenticated: boolean; actor: AuditEntry['actor']; detail: AuditEntry['detail']; target?: string };
const states = new WeakMap<Context, AuditState>();
export function auditState(c: Context): AuditState {
  let state = states.get(c);
  if (!state) { state = { authenticated: false, actor: 'anonymous', detail: {} }; states.set(c, state); }
  return state;
}
export function auditEnabled(env: Env) { return !!(env.BUCKET || env.DB); }
const text = (value: unknown, max = 80) => typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, max) : '';

function parse(raw: string | null, now: number): Ledger {
  if (raw === null) return { version: 1, revision: '', entries: [] };
  const data = JSON.parse(raw) as Ledger;
  if (data?.version !== 1 || typeof data.revision !== 'string' || !Array.isArray(data.entries) || data.entries.length > AUDIT_LIMIT ||
      data.entries.some(e => !e || typeof e.id !== 'string' || !Number.isSafeInteger(e.at) ||
        !['login', 'operation', 'security'].includes(e.category) || !['success', 'failed', 'blocked'].includes(e.result) ||
        !['admin', 'token', 'anonymous'].includes(e.actor) || !Number.isInteger(e.status) || !Number.isFinite(e.durationMs) ||
        !['action', 'ip', 'country', 'region', 'city', 'method', 'target', 'agent'].every(k => typeof e[k as keyof AuditEntry] === 'string') ||
        !e.detail || typeof e.detail !== 'object' || Array.isArray(e.detail))) throw new Error('Invalid audit state');
  data.entries = data.entries.filter(e => e.at >= now - AUDIT_DAYS * 86400000);
  return data;
}
async function read(env: Env) {
  const now = Date.now();
  if (env.BUCKET) {
    const object = await env.BUCKET.get(AUDIT_KEY);
    return { data: parse(object ? await object.text() : null, now), previous: object?.etag ?? null };
  }
  await env.DB!.prepare(CREATE_SETTINGS).run();
  const row = await env.DB!.prepare('SELECT value FROM app_settings WHERE key=?').bind(AUDIT_KEY).first<{ value: string }>();
  return { data: parse(row?.value ?? null, now), previous: row?.value ?? null };
}
async function write(env: Env, data: Ledger, previous: string | null) {
  data.revision = crypto.randomUUID();
  const value = JSON.stringify(data);
  if (env.BUCKET) return !!await env.BUCKET.put(AUDIT_KEY, value, {
    onlyIf: previous === null ? { etagDoesNotMatch: '*' } : { etagMatches: previous },
    httpMetadata: { contentType: 'application/json' }, storageClass: 'Standard',
  });
  const result = previous === null
    ? await env.DB!.prepare('INSERT INTO app_settings (key,value) VALUES (?,?) ON CONFLICT(key) DO NOTHING').bind(AUDIT_KEY, value).run()
    : await env.DB!.prepare('UPDATE app_settings SET value=? WHERE key=? AND value=?').bind(value, AUDIT_KEY, previous).run();
  return result.meta.changes === 1;
}

/** Separate from the business transaction: never retry a completed user operation for a log failure. */
export async function appendAudit(env: Env, event: AuditEntry): Promise<boolean> {
  if (!auditEnabled(env)) return false;
  try {
    for (let attempt = 0; attempt < 5; attempt++) {
      if (attempt) await new Promise(resolve => setTimeout(resolve, 1100 + Math.random() * 200));
      const { data, previous } = await read(env);
      if (data.entries.some(e => e.id === event.id)) return true;
      data.entries.push(event);
      data.entries.sort((a, b) => b.at - a.at || b.id.localeCompare(a.id));
      data.entries = data.entries.slice(0, AUDIT_LIMIT);
      try { if (await write(env, data, previous)) return true; }
      catch (error) { if (!/429|rate|too many/i.test(String(error))) throw error; }
    }
  } catch { /* The caller exposes the failed write; never print private audit entries. */ }
  console.warn('Audit record could not be saved');
  return false;
}

const routes: Record<string, [AuditCategory, string]> = {
  'POST /api/admin/login': ['login', 'login'],
  'POST /api/admin/logout': ['login', 'logout'],
  'PUT /api/admin/settings': ['operation', 'retention'],
  'PUT /api/admin/upload-policy': ['operation', 'uploadPolicy'],
  'POST /api/admin/login-protection/unblock': ['security', 'unblock'],
  'POST /api/admin/cleanup': ['operation', 'cleanup'],
  'GET /api/admin/audit-logs/export': ['operation', 'export'],
};
export async function auditRequest(c: Context<{ Bindings: Env }>, next: () => Promise<void>) {
  const start = Date.now();
  await next();
  if (!auditEnabled(c.env)) return;
  const state = auditState(c);
  const path = c.req.path;
  let selected = routes[`${c.req.method} ${path}`];
  let target = state.target ?? '';
  const share = /^\/api\/admin\/shares\/(\d{6})(?:\/(source(?:\/activity)?|download))?$/.exec(path);
  if (share) {
    target = share[1];
    if (c.req.method === 'DELETE' && !share[2]) selected = ['operation', 'delete'];
    if (c.req.method === 'PUT' && share[2] === 'source') selected = ['operation', 'note'];
    if (c.req.method === 'GET' && share[2]?.startsWith('source')) selected = ['operation', 'viewSource'];
    if (c.req.method === 'GET' && share[2] === 'download') selected = ['operation', 'download'];
  }
  if (!selected) return;
  const isLogin = path === '/api/admin/login';
  const bearer = path === '/api/admin/cleanup' && c.req.header('Authorization')?.startsWith('Bearer ');
  if (!state.authenticated && !isLogin && !bearer) return;
  if (isLogin && c.res.status === 403) return; // Cross-site rejected requests are not credential attempts.
  const protectionError = c.error instanceof LoginProtectionError ? c.error : null;
  // Log the transition into a ban, not every blocked retry during an attack.
  if (protectionError?.retryAt && !protectionError.newBan) return;
  let [category, action] = selected;
  if (protectionError?.newBan) { category = 'security'; action = 'ban'; state.detail.bannedUntil = protectionError.retryAt!; }
  const cf = c.req.raw.cf;
  const event: AuditEntry = {
    id: crypto.randomUUID(), at: start, category, action,
    result: c.res.status === 429 ? 'blocked' : c.res.status < 400 ? 'success' : 'failed',
    actor: state.actor, ip: loginIP(c), country: text(cf?.country, 2), region: text(cf?.region), city: text(cf?.city),
    method: c.req.method, status: c.res.status, target: text(target), agent: text(c.req.header('User-Agent'), 200),
    durationMs: Math.max(0, Date.now() - start), detail: state.detail,
  };
  if (!await appendAudit(c.env, event)) c.header('X-Audit-Status', 'unavailable');
}

export async function queryAudit(env: Env, query: Record<string, string>) {
  const category = query.category || 'all';
  const result = query.result || 'all';
  const from = query.from ? Number(query.from) : 0;
  const to = query.to ? Number(query.to) : Date.now();
  const offset = query.offset ? Number(query.offset) : 0;
  const limit = query.limit ? Number(query.limit) : 20;
  const q = (query.q || '').trim().toLowerCase();
  if (!['all', 'login', 'operation', 'security'].includes(category) || !['all', 'success', 'failed', 'blocked'].includes(result) ||
      ![from, to, offset, limit].every(Number.isSafeInteger) || from < 0 || to < from || offset < 0 ||
      limit < 1 || limit > AUDIT_LIMIT || q.length > 80) throw new RangeError('Invalid audit filters');
  const enabled = auditEnabled(env);
  const entries = enabled ? (await read(env)).data.entries : [];
  entries.sort((a, b) => b.at - a.at || b.id.localeCompare(a.id));
  const matched = entries.filter(e => (category === 'all' || e.category === category) && (result === 'all' || e.result === result) &&
    e.at >= from && e.at <= to && (!q || `${e.ip} ${e.target} ${e.action}`.toLowerCase().includes(q)));
  return { enabled, retentionDays: AUDIT_DAYS, maxEntries: AUDIT_LIMIT, total: matched.length, offset, limit, rows: matched.slice(offset, offset + limit) };
}
