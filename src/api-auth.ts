import type { Context } from 'hono';
import type { Env } from './types';
import { safeEqual } from './auth';
import { auditState } from './audit';
import { checkLogin, recordLogin, loginIP } from './login-protection';
import { enforceSecurity } from './security';

const identities = new WeakMap<Context, string>();
export const apiIdentity = (c: Context) => identities.get(c);
export const isApiPath = (path: string) => path === '/api/v1' || path.startsWith('/api/v1/');

/** Canonical transfer path lets API and browser uploads share protection and audit semantics. */
export function transferPath(path: string, method: string): string {
  if (method === 'POST' && path === '/api/v1/shares') return '/api/shares/text';
  return path.startsWith('/api/v1/') ? '/api/' + path.slice('/api/v1/'.length) : path;
}

export async function requireApiToken(c: Context<{ Bindings: Env }>, next: () => Promise<void>) {
  c.header('Cache-Control', 'no-store');
  c.header('Vary', 'Authorization');
  if (!c.env.API_TOKEN) {
    auditState(c).detail.reason = 'api_disabled';
    return c.json({ error: 'api_disabled', message: '未配置 API_TOKEN，脚本接口未启用' }, 503);
  }
  const origin = c.req.header('Origin');
  if (origin && origin !== new URL(c.req.url).origin) return c.json({ error: 'forbidden', message: '请求来源不匹配' }, 403);
  const ip = loginIP(c);
  await enforceSecurity(c.env, ip, 'login');
  await checkLogin(c.env, ip);
  const match = /^Bearer ([^\s]+)$/i.exec(c.req.header('Authorization') || '');
  const valid = !!match && await safeEqual(match[1], c.env.API_TOKEN);
  await recordLogin(c.env, ip, valid);
  if (!valid) {
    auditState(c).detail.reason = 'unauthorized';
    c.header('WWW-Authenticate', 'Bearer realm="file-relay-api"');
    return c.json({ error: 'unauthorized', message: 'API Token 无效或缺失' }, 401);
  }
  // A deterministic private principal keeps multipart ownership stable without requiring cookies.
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`file-relay-api-visitor-v1:${c.env.API_TOKEN}`))).slice(0, 16);
  bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  identities.set(c, `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`);
  auditState(c).authenticated = true; auditState(c).actor = 'token';
  await next();
}
