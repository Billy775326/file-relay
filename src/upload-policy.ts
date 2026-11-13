import type { Context } from 'hono';
import type { Env } from './types';
import type { UploadSource, SessionRecord } from './store';
import { getStore } from './store';
import { captureSource } from './upload-source';
import { fileMaxSize } from './filestore';
import { CREATE_SETTINGS, readSetting, writeSetting } from './settings';

const SETTINGS_KEY = 'sys:guest-upload-policy';
export const USAGE_KEY = '__file-relay/guest-uploads-v1.json';
const WEEK = 7 * 86_400_000;
const SHANGHAI_OFFSET = 8 * 3_600_000;
const MAX_SUBJECTS = 10_000;
export interface GuestLimits { weeklyFileLimit: number }
export const DEFAULT_GUEST_LIMITS: GuestLimits = { weeklyFileLimit: 5 };
export function validGuestLimits(value: unknown): value is GuestLimits {
  const v = value as GuestLimits | null;
  return !!v && Number.isInteger(v.weeklyFileLimit) && v.weeklyFileLimit >= 0 && v.weeklyFileLimit <= 1000;
}
export async function getGuestLimits(env: Env): Promise<GuestLimits> {
  const raw = await readSetting(env, SETTINGS_KEY);
  if (raw === null) return { ...DEFAULT_GUEST_LIMITS };
  const limits: unknown = JSON.parse(raw);
  if (!validGuestLimits(limits)) throw new Error('Invalid guest upload policy');
  // Ignore the retired size field in existing settings; preserve weekly quotas.
  return { weeklyFileLimit: limits.weeklyFileLimit };
}
export async function setGuestLimits(env: Env, limits: GuestLimits): Promise<void> {
  if (!validGuestLimits(limits)) throw new Error('Invalid guest upload policy');
  await writeSetting(env, SETTINGS_KEY, JSON.stringify({ weeklyFileLimit: limits.weeklyFileLimit }));
}

export class UploadPolicyError extends Error {
  constructor(public readonly status: 403 | 413 | 429 | 503, public readonly code: string, message: string,
    public readonly resetsAt?: number) { super(message); }
}
export function policyErrorResponse(c: Context<{ Bindings: Env }>, error: Error): Response | undefined {
  if (!(error instanceof UploadPolicyError)) return;
  if (error.resetsAt) c.header('Retry-After', String(Math.max(1, Math.ceil((error.resetsAt - Date.now()) / 1000))));
  return c.json({ error: error.code, message: error.message, resetsAt: error.resetsAt }, error.status);
}

/** Monday 00:00 Asia/Shanghai. Epoch Thursday needs a three-day alignment. */
export function uploadWeek(now: number): number {
  return Math.floor((now + SHANGHAI_OFFSET + 3 * 86_400_000) / WEEK) * WEEK - 3 * 86_400_000 - SHANGHAI_OFFSET;
}
type Ledger = { version: 1; week: number; revision: string; counts: Record<string, number> };
function parseLedger(raw: string | null, week: number): Ledger {
  if (raw === null) return { version: 1, week, revision: '', counts: {} };
  const data = JSON.parse(raw) as Ledger;
  if (data.version !== 1 || !Number.isSafeInteger(data.week) || typeof data.revision !== 'string' ||
      !data.counts || typeof data.counts !== 'object' || Array.isArray(data.counts) ||
      Object.entries(data.counts).some(([key, n]) => !/^[a-f0-9]{64}$/.test(key) || !Number.isSafeInteger(n) || n < 0)) {
    throw new Error('Invalid guest upload ledger');
  }
  if (data.week > week) throw new Error('Guest upload ledger is ahead of server clock');
  return data.week === week ? data : { version: 1, week, revision: '', counts: {} };
}

async function readLedger(env: Env, week: number) {
  if (env.BUCKET) {
    const object = await env.BUCKET.get(USAGE_KEY);
    return { ledger: parseLedger(object ? await object.text() : null, week), previous: object?.etag ?? null };
  }
  if (env.DB) {
    await env.DB.prepare(CREATE_SETTINGS).run();
    const row = await env.DB.prepare('SELECT value FROM app_settings WHERE key=?').bind(USAGE_KEY).first<{ value: string }>();
    return { ledger: parseLedger(row?.value ?? null, week), previous: row?.value ?? null };
  }
  // KV read/modify/write cannot enforce a concurrent quota. Never pretend it can.
  throw new UploadPolicyError(503, 'upload_policy_unavailable', '暂不接受未备注访客上传，请联系管理员');
}
async function writeLedger(env: Env, ledger: Ledger, previous: string | null): Promise<boolean> {
  ledger.revision = crypto.randomUUID();
  const value = JSON.stringify(ledger);
  if (env.BUCKET) return !!(await env.BUCKET.put(USAGE_KEY, value, {
    onlyIf: previous === null ? { etagDoesNotMatch: '*' } : { etagMatches: previous },
    httpMetadata: { contentType: 'application/json' }, storageClass: 'Standard',
  }));
  const result = previous === null
    ? await env.DB!.prepare('INSERT INTO app_settings (key,value) VALUES (?,?) ON CONFLICT(key) DO NOTHING').bind(USAGE_KEY, value).run()
    : await env.DB!.prepare('UPDATE app_settings SET value=? WHERE key=? AND value=?').bind(value, USAGE_KEY, previous).run();
  return result.meta.changes === 1;
}

async function subjects(env: Env, source: UploadSource, week: number): Promise<string[]> {
  if (!env.ADMIN_TOKEN) throw new UploadPolicyError(503, 'upload_policy_unavailable', '上传服务未配置完成');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.ADMIN_TOKEN), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  // No extra raw IP copies in accounting. Missing ingress IP shares one conservative bucket.
  let ip = source.ip?.toLowerCase() ?? 'unknown';
  if (ip.includes(':')) {
    try { ip = new URL(`http://[${ip}]`).hostname; } catch { ip = 'unknown'; }
  }
  return Promise.all([`visitor:${source.visitorId}`, `network:${ip}`].map(async subject => {
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`upload-week:${week}:${subject}`));
    return [...new Uint8Array(sig)].map(n => n.toString(16).padStart(2, '0')).join('');
  }));
}

/** Both counters change in one conditional write. Denied admissions never debit. */
async function weeklyUsage(env: Env, source: UploadSource, limit: number, debit: boolean) {
  for (let attempt = 0; attempt < 5; attempt++) {
    if (attempt) await new Promise(resolve => setTimeout(resolve, 1100 + Math.random() * 200));
    const week = uploadWeek(Date.now());
    const keys = await subjects(env, source, week);
    const { ledger, previous } = await readLedger(env, week);
    const used = Math.max(...keys.map(key => ledger.counts[key] ?? 0));
    const resetsAt = week + WEEK;
    if (!debit) return { remaining: Math.max(0, limit - used), resetsAt };
    if (used >= limit) throw new UploadPolicyError(429, 'weekly_upload_limit', '本周上传额度已用完，请下周再试或联系管理员', resetsAt);
    if (Object.keys(ledger.counts).length + keys.filter(key => ledger.counts[key] === undefined).length > MAX_SUBJECTS) {
      throw new UploadPolicyError(503, 'upload_policy_unavailable', '上传服务繁忙，请稍后重试');
    }
    for (const key of keys) ledger.counts[key] = (ledger.counts[key] ?? 0) + 1;
    try {
      if (await writeLedger(env, ledger, previous)) return { remaining: limit - used - 1, resetsAt };
    } catch (error) {
      if (!/429|rate|too many/i.test(String(error))) throw error;
    }
  }
  throw new UploadPolicyError(503, 'upload_policy_busy', '上传服务繁忙，请稍后重试');
}

export async function uploadAccess(c: Context<{ Bindings: Env }>) {
  const source = await captureSource(c);
  const noted = !!(await getStore(c.env).getVisitorNote(source.visitorId)).trim();
  const limits = await getGuestLimits(c.env);
  return { source, noted, limits, maxFileSize: fileMaxSize(c.env) };
}
export type UploadAccess = Awaited<ReturnType<typeof uploadAccess>>;

export function checkUploadOptions(access: UploadAccess, size: number | null, expiry: number | null, pickups: number | null) {
  if (size !== null && size > access.maxFileSize) throw new UploadPolicyError(413, 'too_large', `单文件不能超过 ${access.maxFileSize} 字节`);
  if (!access.noted && (expiry === null || pickups === null)) {
    throw new UploadPolicyError(403, 'restricted_share_options', '当前仅支持限时、限次分享，请选择有效期和取件次数');
  }
}
export async function admitFile(env: Env, access: UploadAccess) {
  if (!access.noted) await weeklyUsage(env, access.source, access.limits.weeklyFileLimit, true);
}
export async function publicUploadPolicy(c: Context<{ Bindings: Env }>) {
  const access = await uploadAccess(c);
  const base = { maxFileSize: access.maxFileSize, allowPermanent: access.noted, allowUnlimited: access.noted };
  if (access.noted) return { ...base, weeklyFileLimit: null, uploadsRemaining: null, uploadsResetAt: null, fileUploadAvailable: access.maxFileSize > 0 };
  if (!c.env.BUCKET && !c.env.DB) return { ...base, weeklyFileLimit: access.limits.weeklyFileLimit, uploadsRemaining: 0,
    uploadsResetAt: null, fileUploadAvailable: false };
  const usage = await weeklyUsage(c.env, access.source, access.limits.weeklyFileLimit, false);
  return { ...base, weeklyFileLimit: access.limits.weeklyFileLimit, uploadsRemaining: usage.remaining,
    uploadsResetAt: usage.resetsAt, fileUploadAvailable: access.maxFileSize > 0 };
}

/** Recheck ownership and current restrictions, but never charge each part/retry. */
export async function checkUploadSession(c: Context<{ Bindings: Env }>, session: SessionRecord) {
  const access = await uploadAccess(c);
  if (!session.source || session.source.visitorId !== access.source.visitorId) {
    throw new UploadPolicyError(403, 'upload_session_owner', '上传会话不属于当前访客，请重新上传');
  }
  if (!access.noted && session.source.uploadTier !== 'guest') {
    throw new UploadPolicyError(403, 'upload_policy_changed', '上传权限已变更，请重新上传');
  }
  checkUploadOptions(access, session.size, session.expiry === 'forever' ? null : 1, session.maxPickups);
}
