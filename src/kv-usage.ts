import type { Env } from './types';

export interface KVUsage {
  bound: boolean;
  /** Free-plan reference: shared by every namespace in the account. */
  freeQuotaBytes: number;
  quotaScope: 'account';
  state: 'unbound' | 'unconfigured' | 'available' | 'unavailable';
  usedBytes?: number;
  keyCount?: number;
  sampleDate?: string;
  source: 'cloudflare-analytics';
}
const TTL_MS = 300_000;
const cache = new Map<string, { until: number; value: KVUsage }>();
const pending = new Map<string, Promise<KVUsage>>();
/** Namespace daily peak, not account-wide free quota or real-time admission capacity. */
export async function getKVUsage(env: Env): Promise<KVUsage> {
  const base: KVUsage = { bound: !!env.fileKV, freeQuotaBytes: 1_000_000_000, quotaScope: 'account', state: env.fileKV ? 'unconfigured' : 'unbound', source: 'cloudflare-analytics' };
  if (!env.fileKV) return base;
  const account = env.CF_ACCOUNT_ID, namespace = env.CF_KV_NAMESPACE_ID, token = env.CF_ANALYTICS_TOKEN;
  if (!account || !namespace || !token || !/^[a-f0-9]{32}$/i.test(account) || !/^[a-f0-9]{32}$/i.test(namespace)) return base;
  // Include credential identity to avoid sharing cached authorization results between environments.
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  const identity = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  const key = `${account}:${namespace}:${identity}`;
  const hit = cache.get(key);
  if (hit && hit.until > Date.now()) return hit.value;
  const inflight = pending.get(key);
  if (inflight) return inflight;
  const query = async (): Promise<KVUsage> => {
    let result: KVUsage = { ...base, state: 'unavailable' };
    try {
      const now = new Date(), start = new Date(now.getTime() - 3 * 86400_000);
      const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
        method: 'POST', signal: AbortSignal.timeout(5000),
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `query($accountTag: string!, $namespaceId: string, $start: Date, $end: Date) {
          viewer { accounts(filter: {accountTag: $accountTag}) { kvStorageAdaptiveGroups(
            filter: {namespaceId: $namespaceId, date_geq: $start, date_leq: $end}, limit: 1, orderBy: [date_DESC]
          ) { max { byteCount keyCount } dimensions { date } } } }
        }`, variables: { accountTag: account, namespaceId: namespace, start: start.toISOString().slice(0, 10), end: now.toISOString().slice(0, 10) } }),
      });
      if (response.ok) {
        const payload = await response.json() as { errors?: unknown[]; data?: { viewer?: { accounts?: Array<{ kvStorageAdaptiveGroups?: Array<{ max?: { byteCount?: number; keyCount?: number }; dimensions?: { date?: string } }> }> } } };
        const row = payload?.data?.viewer?.accounts?.[0]?.kvStorageAdaptiveGroups?.[0];
        const bytes = row?.max?.byteCount, count = row?.max?.keyCount, date = row?.dimensions?.date;
        if (!payload.errors?.length && typeof bytes === 'number' && Number.isSafeInteger(bytes) && bytes >= 0 && typeof count === 'number' && Number.isSafeInteger(count) && count >= 0 && typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
          result = { ...base, state: 'available', usedBytes: bytes, keyCount: count, sampleDate: date };
        }
      }
    } catch { /* Analytics failure must not break file management or expose credentials. */ }
    for (const [id, entry] of cache) if (entry.until <= Date.now()) cache.delete(id);
    if (cache.size >= 16) cache.delete(cache.keys().next().value!);
    cache.set(key, { until: Date.now() + (result.state === 'available' ? TTL_MS : 30_000), value: result });
    return result;
  };
  const task = query(); pending.set(key, task);
  try { return await task; } finally { pending.delete(key); }
}
