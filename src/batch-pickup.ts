import { getSignedCookie, setSignedCookie } from 'hono/cookie';
import type { Context } from 'hono';
import type { Env } from './types';
import type { ShareRecord } from './store';

const PICKUP_WINDOW_MS = 15 * 60_000;
type PickupContext = Context<{ Bindings: Env }>;

function cookieName(record: ShareRecord) {
  return `relay_pickup_${record.code}`;
}

function secret(c: PickupContext, record: ShareRecord) {
  return `batch-pickup:${c.env.ADMIN_TOKEN}:${record.id}`;
}

/** One pickup permits any member downloads in this browser for a short window. */
export async function batchPickupUntil(c: PickupContext, record: ShareRecord, now = Date.now()) {
  if (!record.files || !c.env.ADMIN_TOKEN || (record.expireAt !== null && record.expireAt <= now)) return null;
  const until = Number(await getSignedCookie(c, secret(c, record), cookieName(record)) || 0);
  return Number.isSafeInteger(until) && until > now && until <= now + PICKUP_WINDOW_MS
    ? Math.min(until, record.expireAt ?? until) : null;
}

export async function issueBatchPickup(c: PickupContext, record: ShareRecord, now = Date.now()) {
  const until = Math.min(now + PICKUP_WINDOW_MS, record.expireAt ?? Infinity);
  await setSignedCookie(c, cookieName(record), String(until), secret(c, record), {
    path: '/api/pickup', httpOnly: true, secure: c.req.url.startsWith('https:'), sameSite: 'Lax',
    maxAge: Math.max(1, Math.ceil((until - now) / 1000)),
  });
  return until;
}
