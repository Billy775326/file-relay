import type { Context } from 'hono';
import type { Env } from './types';
import { CREATE_SETTINGS } from './settings';

export const LOGIN_GUARD_KEY = '__file-relay/login-guard-v1.json';
export const LOGIN_RULES = { maxFailures: 5, windowSeconds: 600, banSeconds: 1800 };
const MAX_RECORDS = 1000;
type Entry = { ip: string; failures: number; failedAt: number[]; firstFailedAt: number; lastFailedAt: number; bannedUntil: number };
type Ledger = { version: 1; revision: string; entries: Entry[] };

export class LoginProtectionError extends Error {
  constructor(public readonly retryAt?: number, public readonly newBan = false) { super('Login protection unavailable'); }
}

export function loginProtectionResponse(c: Context<{ Bindings: Env }>, error: unknown): Response | undefined {
  if (!(error instanceof LoginProtectionError)) return;
  c.header('Cache-Control', 'no-store');
  if (error.retryAt) {
    c.header('Retry-After', String(Math.max(1, Math.ceil((error.retryAt - Date.now()) / 1000))));
    return c.json({ error: 'login_blocked', message: '登录失败次数过多，请稍后再试', retryAt: error.retryAt }, 429);
  }
  return c.json({ error: 'login_protection_unavailable', message: '登录防护暂不可用，请稍后重试' }, 503);
}

/** Only trust Cloudflare ingress, never the caller's forwarded headers. */
export function loginIP(c: Context<{ Bindings: Env }>): string {
  const raw = c.req.raw.cf ? c.req.header('CF-Connecting-IP') : undefined;
  if (!raw || !/^[0-9a-fA-F:.]{3,45}$/.test(raw)) return 'unknown';
  try {
    const host = new URL(raw.includes(':') ? `http://[${raw}]` : `http://${raw}`).hostname;
    return host.replace(/^\[|\]$/g, '').toLowerCase();
  } catch { return 'unknown'; }
}

export function loginProtectionEnabled(env: Env): boolean { return !!(env.BUCKET || env.DB); }

function parse(raw: string | null, now: number): Ledger {
  if (raw === null) return { version: 1, revision: '', entries: [] };
  const data = JSON.parse(raw) as Ledger;
  if (data?.version !== 1 || typeof data.revision !== 'string' || !Array.isArray(data.entries) ||
      data.entries.length > MAX_RECORDS || data.entries.some(e => !e || typeof e.ip !== 'string' ||
        !/^(unknown|[0-9a-f:.]{3,45})$/.test(e.ip) || !Number.isInteger(e.failures) || e.failures < 1 ||
        e.failures > LOGIN_RULES.maxFailures || !Array.isArray(e.failedAt) || e.failedAt.length !== e.failures ||
        !e.failedAt.every((n, i) => Number.isSafeInteger(n) && n >= 0 && (i === 0 || n >= e.failedAt[i - 1])) ||
        e.firstFailedAt !== e.failedAt[0] || e.lastFailedAt !== e.failedAt[e.failedAt.length - 1] ||
        ![e.firstFailedAt, e.lastFailedAt, e.bannedUntil].every(n => Number.isSafeInteger(n) && n >= 0)) ||
      new Set(data.entries.map(e => e.ip)).size !== data.entries.length) throw new Error('Invalid login protection state');
  // Expired bans do not carry their failures into the next window. Bound storage without an external cron.
  data.entries = data.entries.filter(e => {
    if (e.bannedUntil) return e.bannedUntil > now;
    e.failedAt = e.failedAt.filter(at => at + LOGIN_RULES.windowSeconds * 1000 > now);
    e.failures = e.failedAt.length;
    e.firstFailedAt = e.failedAt[0];
    return e.failures > 0;
  });
  return data;
}

async function read(env: Env, now: number) {
  if (env.BUCKET) {
    const object = await env.BUCKET.get(LOGIN_GUARD_KEY);
    return { data: parse(object ? await object.text() : null, now), previous: object?.etag ?? null };
  }
  await env.DB!.prepare(CREATE_SETTINGS).run();
  const row = await env.DB!.prepare('SELECT value FROM app_settings WHERE key=?').bind(LOGIN_GUARD_KEY).first<{ value: string }>();
  return { data: parse(row?.value ?? null, now), previous: row?.value ?? null };
}

async function write(env: Env, data: Ledger, previous: string | null): Promise<boolean> {
  data.revision = crypto.randomUUID();
  const value = JSON.stringify(data);
  if (env.BUCKET) return !!await env.BUCKET.put(LOGIN_GUARD_KEY, value, {
    onlyIf: previous === null ? { etagDoesNotMatch: '*' } : { etagMatches: previous },
    httpMetadata: { contentType: 'application/json' }, storageClass: 'Standard',
  });
  const result = previous === null
    ? await env.DB!.prepare('INSERT INTO app_settings (key,value) VALUES (?,?) ON CONFLICT(key) DO NOTHING').bind(LOGIN_GUARD_KEY, value).run()
    : await env.DB!.prepare('UPDATE app_settings SET value=? WHERE key=? AND value=?').bind(value, LOGIN_GUARD_KEY, previous).run();
  return result.meta.changes === 1;
}

async function change(env: Env, edit: (data: Ledger, now: number) => boolean): Promise<void> {
  try {
    for (let attempt = 0; attempt < 5; attempt++) {
      if (attempt) await new Promise(resolve => setTimeout(resolve, 1100 + Math.random() * 200));
      const now = Date.now();
      const { data, previous } = await read(env, now);
      if (!edit(data, now)) return;
      try { if (await write(env, data, previous)) return; }
      catch (error) { if (!/429|rate|too many/i.test(String(error))) throw error; }
    }
  } catch (error) {
    if (error instanceof LoginProtectionError) throw error;
    // Do not log raw entries, addresses, cookies or supplied credentials.
    console.warn('Login protection storage unavailable');
  }
  throw new LoginProtectionError();
}

function rejectBanned(entry: Entry | undefined, now: number) {
  if (entry && entry.bannedUntil > now) throw new LoginProtectionError(entry.bannedUntil);
}

export async function checkLogin(env: Env, ip: string): Promise<void> {
  if (!loginProtectionEnabled(env)) return;
  try {
    const now = Date.now();
    rejectBanned((await read(env, now)).data.entries.find(e => e.ip === ip), now);
  } catch (error) {
    if (error instanceof LoginProtectionError) throw error;
    throw new LoginProtectionError();
  }
}

export async function recordLogin(env: Env, ip: string, success: boolean): Promise<void> {
  if (!loginProtectionEnabled(env)) return;
  let bannedUntil = 0;
  await change(env, (data, now) => {
    const entry = data.entries.find(e => e.ip === ip);
    rejectBanned(entry, now);
    if (success) {
      data.entries = data.entries.filter(e => e.ip !== ip);
      return !!entry;
    }
    if (!entry && data.entries.length >= MAX_RECORDS) throw new LoginProtectionError();
    const next = entry ?? { ip, failures: 0, failedAt: [], firstFailedAt: now, lastFailedAt: now, bannedUntil: 0 };
    next.failures++;
    next.failedAt.push(now);
    next.lastFailedAt = now;
    if (next.failures >= LOGIN_RULES.maxFailures) next.bannedUntil = now + LOGIN_RULES.banSeconds * 1000;
    bannedUntil = next.bannedUntil;
    if (!entry) data.entries.push(next);
    return true;
  });
  if (bannedUntil) throw new LoginProtectionError(bannedUntil, true);
}

export async function loginProtectionStatus(env: Env) {
  const enabled = loginProtectionEnabled(env);
  if (!enabled) return { enabled, ...LOGIN_RULES, bans: [] as Entry[] };
  try {
    const now = Date.now();
    const { data } = await read(env, now);
    return { enabled, ...LOGIN_RULES, bans: data.entries.filter(e => e.bannedUntil > now)
      .sort((a, b) => b.lastFailedAt - a.lastFailedAt).map(({ failedAt: _times, ...entry }) => entry) };
  } catch { throw new LoginProtectionError(); }
}

export async function unblockLogin(env: Env, ip: string): Promise<void> {
  if (!loginProtectionEnabled(env)) throw new LoginProtectionError();
  await change(env, data => {
    const count = data.entries.length;
    data.entries = data.entries.filter(e => e.ip !== ip);
    return data.entries.length !== count;
  });
}
