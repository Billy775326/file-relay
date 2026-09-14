import type { Context } from 'hono';

const EXPIRY_MS: Record<string, number> = {
  '1d': 86_400_000,
  '7d': 7 * 86_400_000,
  '30d': 30 * 86_400_000,
};

/**
 * 解析有效期参数。
 * 返回 null 表示永久;undefined 表示非法。
 */
export function parseExpiry(v: unknown): number | null | undefined {
  if (v === 'forever') return null;
  if (typeof v === 'string' && v in EXPIRY_MS) return EXPIRY_MS[v];
  return undefined;
}

/**
 * 解析取件次数上限。
 * 返回 null 表示不限;undefined 表示非法(合法范围 1-999 的整数)。
 */
export function parseMaxPickups(v: unknown): number | null | undefined {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 999) return v;
  return undefined;
}

export type ErrCode = 'not_found' | 'expired' | 'exhausted' | 'too_large' | 'bad_request' | 'unauthorized' | 'gone' | 'internal' | 'config';

export function err(c: Context, status: 400 | 401 | 404 | 410 | 413 | 500, code: ErrCode, message: string) {
  return c.json({ error: code, message }, status);
}

/** RFC 6266 下载头:ASCII fallback + RFC 5987 UTF-8 扩展,兼容中文文件名 */
export function contentDisposition(name: string): string {
  const fallback = name.replace(/[^\x20-\x7e]/g, '').replace(/["\\]/g, '_').trim() || 'file';
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}
