import type { Env } from './types';

export const DEFAULT_RETENTION_DAYS = 30;
export const MAX_RETENTION_DAYS = 3650;
export const RETENTION_DAY_MS = 86_400_000;
const KEY = 'sys:expired-retention-days';
export const CREATE_SETTINGS = 'CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)';

export function validRetentionDays(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_RETENTION_DAYS;
}

export async function readSetting(env: Env, key: string): Promise<string | null> {
  let raw: string | null;
  if (env.fileKV) raw = await env.fileKV.get(key);
  else if (env.DB) {
    try {
      const row = await env.DB.prepare('SELECT value FROM app_settings WHERE key = ?').bind(key).first<{ value: string }>();
      raw = row?.value ?? null;
    } catch (error) {
      // Older D1 installations get the safe default until the first settings save.
      const message = error instanceof Error ? `${error.message} ${String(error.cause ?? '')}` : String(error);
      if (/no such table: app_settings/i.test(message)) return null;
      throw error;
    }
  } else throw new Error('No metadata store configured');
  return raw;
}

export async function getRetentionDays(env: Env): Promise<number> {
  const raw = await readSetting(env, KEY);
  if (raw === null) return DEFAULT_RETENTION_DAYS;
  const days = /^\d+$/.test(raw) ? Number(raw) : NaN;
  if (!validRetentionDays(days)) throw new Error('Invalid stored retention setting; cleanup stopped');
  return days;
}

export async function setRetentionDays(env: Env, days: number): Promise<void> {
  if (!validRetentionDays(days)) throw new Error('Invalid retention days');
  await writeSetting(env, KEY, String(days));
}

export async function writeSetting(env: Env, key: string, value: string): Promise<void> {
  if (env.fileKV) await env.fileKV.put(key, value);
  else if (env.DB) {
    // Additive initialization only; existing shares and visitor notes are untouched.
    await env.DB.prepare(CREATE_SETTINGS).run();
    await env.DB.prepare('INSERT INTO app_settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value')
      .bind(key, value).run();
  } else throw new Error('No metadata store configured');
}
