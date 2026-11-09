import type { Context } from 'hono';
import { getSignedCookie, setSignedCookie } from 'hono/cookie';
import type { Env } from './types';
import type { UploadSource, SourceSummary } from './store';

const COOKIE = 'relay_visitor';
const MAX_AGE = 365 * 24 * 60 * 60;
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** Browser association only, never an authorization credential. */
export async function ensureVisitor(c: Context<{ Bindings: Env }>): Promise<string> {
  if (!c.env.ADMIN_TOKEN) return crypto.randomUUID(); // No secret: do not trust or issue persistent cookies.
  const secret = `upload-source:${c.env.ADMIN_TOKEN}`;
  const value = await getSignedCookie(c, secret, COOKIE);
  if (value) {
    const [id, expires] = value.split('.');
    if (ID.test(id) && Number(expires) > Date.now() && Number(expires) <= Date.now() + MAX_AGE * 1000) return id;
  }
  const id = crypto.randomUUID();
  await setSignedCookie(c, COOKIE, `${id}.${Date.now() + MAX_AGE * 1000}`, secret, {
    httpOnly: true, secure: c.req.url.startsWith('https:'), sameSite: 'Lax', path: '/', maxAge: MAX_AGE,
  });
  return id;
}

/** Bound UTF-8 bytes so KV list metadata remains below its 1 KiB limit. */
function location(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  let result = '';
  for (const char of value.trim().replace(/[\u0000-\u001f\u007f]/g, '')) {
    if (new TextEncoder().encode(result + char).length > 48) break;
    result += char;
  }
  return result || null;
}

export async function captureSource(c: Context<{ Bindings: Env }>): Promise<UploadSource> {
  const cf = c.req.raw.cf;
  // CF-Connecting-IP is trusted only on the Cloudflare ingress, not arbitrary local proxy headers.
  const rawIP = cf ? c.req.header('CF-Connecting-IP') : undefined;
  const ip = rawIP && /^[0-9a-fA-F:.]{3,45}$/.test(rawIP) ? rawIP : null;
  return {
    visitorId: await ensureVisitor(c), ip,
    country: typeof cf?.country === 'string' && /^[A-Z]{2}$/.test(cf.country) ? cf.country : null,
    region: location(cf?.region), city: location(cf?.city), capturedAt: Date.now(),
  };
}

export function sourceSummary(source?: UploadSource | null): SourceSummary | null {
  if (!source) return null;
  const { visitorId, country, region, city, capturedAt } = source;
  return { visitorId, country, region, city, capturedAt };
}
