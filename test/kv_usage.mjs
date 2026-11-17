import assert from 'node:assert/strict';
import { getKVUsage } from '../src/kv-usage.ts';
const original = globalThis.fetch;
let calls = 0;
const env = { fileKV: {}, CF_ACCOUNT_ID: 'a'.repeat(32), CF_KV_NAMESPACE_ID: 'b'.repeat(32), CF_ANALYTICS_TOKEN: 'test-only' };
let payload = { data: { viewer: { accounts: [{ kvStorageAdaptiveGroups: [{ max: { byteCount: 2048, keyCount: 9 }, dimensions: { date: new Date().toISOString().slice(0,10) } }] }] } } };
globalThis.fetch = async (url, options) => {
  calls++;
  assert.equal(url, 'https://api.cloudflare.com/client/v4/graphql');
  const body = JSON.parse(options.body);
  assert.equal(body.variables.namespaceId, env.CF_KV_NAMESPACE_ID);
  assert.equal(options.headers.Authorization, 'Bearer test-only');
  return new Response(JSON.stringify(payload));
};
try {
  assert.equal((await getKVUsage({})).state, 'unbound');
  assert.equal((await getKVUsage({ fileKV: {} })).state, 'unconfigured');
  assert.equal(calls, 0);
  const [a,b] = await Promise.all([getKVUsage(env), getKVUsage(env)]);
  assert.deepEqual(a,b);assert.equal(a.freeQuotaBytes,1000000000);assert.equal(a.quotaScope,'account');assert.equal(a.usedBytes,2048);assert.equal(a.keyCount,9);assert.equal(calls,1);
  await getKVUsage(env);assert.equal(calls,1);
  const next = () => ({ ...env, CF_ACCOUNT_ID: (++index).toString(16).padStart(32,'0') });let index=0;
  payload = { errors: [{ message: 'do not expose' }] };
  assert.equal((await getKVUsage(next())).state,'unavailable');
  payload = { data: { viewer: { accounts: [] } } };
  assert.equal((await getKVUsage(next())).state,'unavailable');
  payload = { data: { viewer: { accounts: [{ kvStorageAdaptiveGroups: [{ max: { byteCount: -1, keyCount: 1 }, dimensions: { date: '2026-11-17' } }] }] } } };
  assert.equal((await getKVUsage(next())).state,'unavailable');
  payload.data.viewer.accounts[0].kvStorageAdaptiveGroups[0].max.byteCount = 0;
  const zero=await getKVUsage(next());assert.equal(zero.state,'available');assert.equal(zero.usedBytes,0);
  globalThis.fetch = async () => { throw new Error('network'); };
  const failed=await getKVUsage(next());assert.equal(failed.state,'unavailable');assert.equal(failed.usedBytes,undefined);
  assert.ok(!JSON.stringify(failed).includes(env.CF_ANALYTICS_TOKEN));
  console.log('KV usage: binding, credentials, cache, concurrent requests, invalid/error responses, zero and network failure passed');
} finally { globalThis.fetch = original; }
