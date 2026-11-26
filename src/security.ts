import type { Context } from 'hono';
import type { Env } from './types';
import { CREATE_SETTINGS } from './settings';
import { securityDownloadPage } from './security-feedback';
export const SECURITY_KEY = '__file-relay/security-v1.json';
export const SCOPES = ['login', 'upload', 'pickup'] as const;
export type Scope = typeof SCOPES[number];
type Rule = {
    enabled: boolean;
    limit: number;
    window: number;
    duration: number;
};
type Ban = {
    ip: string;
    scopes: Scope[];
    kind: 'manual' | 'auto';
    reason: string;
    failures: number;
    at: number;
    until: number | null;
};
type Allow = {
    ip: string;
    scopes: Scope[];
    note: string;
    created: number;
};
type Region = {
    id: string;
    country: string;
    region: string;
    scopes: Scope[];
    enabled: boolean;
    reason: string;
    at: number;
    until: number | null;
};
type Counter = {
    ip: string;
    scope: Scope;
    times: number[];
};
export type SecurityState = {
    version: 1;
    revision: string;
    configRevision: string;
    rules: Record<Scope, Rule>;
    bans: Ban[];
    allow: Allow[];
    regions: Region[];
    counters: Counter[];
};
export class SecurityError extends Error {
    constructor(public status: 400 | 403 | 409 | 429 | 503, message: string, public retryAt?: number, public newBan = false,
        public reason: 'rate_limit' | 'access_rule' | 'region' | 'service_unavailable' = status === 503 ? 'service_unavailable' : status === 429 ? 'rate_limit' : 'access_rule') { super(message); }
}
export function securityResponse(c: Context<{
    Bindings: Env;
}>, e: unknown) {
    if (!(e instanceof SecurityError))
        return;
    c.header('Cache-Control', 'no-store');
    if (e.retryAt)
        c.header('Retry-After', String(Math.max(1, Math.ceil((e.retryAt - Date.now()) / 1000))));
    const data = { error: e.status === 503 ? 'security_unavailable' : e.status === 409 ? 'security_conflict' : e.status === 400 ? 'bad_request' : 'security_blocked', message: e.message, retryAt: e.retryAt, reason: e.reason, serverTime: Date.now(), requestId: crypto.randomUUID() };
    c.header('X-Request-ID', data.requestId);
    // Correlate feedback in Worker logs without recording codes, filenames, IPs or admin notes.
    console.warn('security_rejection', { requestId: data.requestId, reason: data.reason, status: e.status });
    if (['GET', 'HEAD'].includes(c.req.method) && /^\/api\/pickup\/[^/]+\/download$/.test(c.req.path) && (c.req.header('Accept') || '').includes('text/html')) {
        c.header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
        c.header('Referrer-Policy', 'no-referrer');
        return c.html(securityDownloadPage(data), e.status);
    }
    return c.json(data, e.status);
}
export const securityEnabled = (env: Env) => !!(env.BUCKET || env.DB);
export function canonicalIP(value: unknown): string | null {
    if (typeof value !== 'string' || value.length > 45)
        return null;
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(value) && value.split('.').every(x => Number(x) <= 255 && !/^0\d/.test(x)))
        return value;
    if (!value.includes(':') || !/^[a-fA-F0-9:.]+$/.test(value))
        return null;
    try {
        return new URL(`http://[${value}]/`).hostname.slice(1, -1).toLowerCase();
    }
    catch {
        return null;
    }
}
const MAX_MANUAL_BAN_MINUTES = 30 * 24 * 60;
const defaults = (): SecurityState => ({ version: 1, revision: '', configRevision: '', rules: {
        login: { enabled: true, limit: 5, window: 10, duration: 30 },
        upload: { enabled: true, limit: 20, window: 10, duration: 30 },
        pickup: { enabled: true, limit: 10, window: 10, duration: 30 },
    }, bans: [], allow: [], regions: [], counters: [] });
const integer = (v: unknown, min: number, max: number): v is number => Number.isSafeInteger(v) && (v as number) >= min && (v as number) <= max;
const validScopes = (v: unknown, region = false): v is Scope[] => Array.isArray(v) && v.length > 0 && v.length <= 3 && new Set(v).size === v.length && v.every(s => SCOPES.includes(s) && (!region || s !== 'login'));
const note = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= 120 && !/[\u0000-\u001f\u007f]/.test(v);
const timestamp = (v: unknown): v is number => integer(v, 0, Number.MAX_SAFE_INTEGER);
const untilValid = (v: unknown) => v === null || timestamp(v);
const rulesValid = (v: any) => v && Object.keys(v).length === 3 && SCOPES.every(k => v[k] && typeof v[k].enabled === 'boolean' && integer(v[k].limit, 1, 10000) && integer(v[k].window, 1, 1440) && integer(v[k].duration, 1, 10080));
function parse(raw: string | null): SecurityState {
    if (raw === null)
        return defaults();
    const d = JSON.parse(raw) as SecurityState;
    if (d?.version !== 1 || typeof d.revision !== 'string' || typeof d.configRevision !== 'string' || !rulesValid(d.rules) ||
        !Array.isArray(d.bans) || d.bans.length > 1000 || d.bans.some(b => !b || !((!!canonicalIP(b.ip) && canonicalIP(b.ip) === b.ip) || b.ip === 'unknown') || !validScopes(b.scopes) || !['auto', 'manual'].includes(b.kind) || !note(b.reason) || !integer(b.failures, 0, 10000) || !timestamp(b.at) || !untilValid(b.until)) ||
        !Array.isArray(d.allow) || d.allow.length > 200 || d.allow.some(a => !a || !canonicalIP(a.ip) || canonicalIP(a.ip) !== a.ip || !validScopes(a.scopes) || !note(a.note) || !timestamp(a.created)) ||
        !Array.isArray(d.regions) || d.regions.length > 200 || d.regions.some(r => !r || typeof r.id !== 'string' || !/^[A-Z]{2}$/.test(r.country) || !/^[A-Z0-9-]{0,10}$/.test(r.region) || !validScopes(r.scopes, true) || typeof r.enabled !== 'boolean' || !note(r.reason) || !timestamp(r.at) || !untilValid(r.until)) ||
        !Array.isArray(d.counters) || d.counters.length > 1000 || d.counters.some(c => !c || !((!!canonicalIP(c.ip) && canonicalIP(c.ip) === c.ip) || c.ip === 'unknown') || !SCOPES.includes(c.scope) || !Array.isArray(c.times) || c.times.length > 10000 || c.times.some(n => !timestamp(n))) ||
        d.counters.reduce((n, c) => n + c.times.length, 0) > 20000)
        throw new Error('Invalid security state');
    return d;
}
function prune(d: SecurityState, now: number) {
    d.bans = d.bans.filter(b => b.until === null || b.until > now);
    d.counters = d.counters.filter(c => { c.times = c.times.filter(n => n + d.rules[c.scope].window * 60000 > now); return c.times.length; });
}
async function read(env: Env) {
    if (env.BUCKET) {
        const obj = await env.BUCKET.get(SECURITY_KEY);
        return { data: parse(obj ? await obj.text() : null), previous: obj?.etag ?? null };
    }
    await env.DB!.prepare(CREATE_SETTINGS).run();
    const row = await env.DB!.prepare('SELECT value FROM app_settings WHERE key=?').bind(SECURITY_KEY).first<{
        value: string;
    }>();
    return { data: parse(row?.value ?? null), previous: row?.value ?? null };
}
async function write(env: Env, d: SecurityState, previous: string | null) {
    d.revision = crypto.randomUUID();
    const value = JSON.stringify(d);
    if (env.BUCKET)
        return !!await env.BUCKET.put(SECURITY_KEY, value, { onlyIf: previous === null ? { etagDoesNotMatch: '*' } : { etagMatches: previous }, httpMetadata: { contentType: 'application/json' }, storageClass: 'Standard' });
    const result = previous === null ? await env.DB!.prepare('INSERT INTO app_settings (key,value) VALUES (?,?) ON CONFLICT(key) DO NOTHING').bind(SECURITY_KEY, value).run() : await env.DB!.prepare('UPDATE app_settings SET value=? WHERE key=? AND value=?').bind(value, SECURITY_KEY, previous).run();
    return result.meta.changes === 1;
}
export async function securityState(env: Env): Promise<SecurityState> {
    if (!securityEnabled(env))
        return defaults();
    try {
        const { data } = await read(env);
        prune(data, Date.now());
        return data;
    }
    catch {
        throw new SecurityError(503, '安全防护暂不可用，请稍后重试');
    }
}
async function change(env: Env, edit: (d: SecurityState, now: number) => void | false) {
    if (!securityEnabled(env))
        throw new SecurityError(503, '安全防护需要绑定 R2 或 D1');
    try {
        for (let attempt = 0; attempt < 5; attempt++) {
            if (attempt)
                await new Promise(r => setTimeout(r, 1100 + Math.random() * 200));
            const { data, previous } = await read(env);
            prune(data, Date.now());
            if (edit(data, Date.now()) === false)
                return data;
            try {
                if (await write(env, data, previous))
                    return data;
            }
            catch (e) {
                if (!/429|rate|too many/i.test(String(e)))
                    throw e;
            }
        }
    }
    catch (e) {
        if (e instanceof SecurityError)
            throw e;
    }
    throw new SecurityError(503, '安全防护存储繁忙或不可用，请稍后重试');
}
export function exempt(d: SecurityState, ip: string, scope: Scope) { return d.allow.some(a => a.ip === ip && a.scopes.includes(scope)); }
/** CF-provided country/region codes only. An allow entry never bypasses manual or geographic rules. */
export function evaluate(d: SecurityState, ip: string, scope: Scope, country = '', region = '', now = Date.now()): { blocked: boolean; reason: string; publicReason?: 'rate_limit' | 'access_rule' | 'region'; retryAt?: number; status?: 403 | 429 } {
    const ban = d.bans.find(b => b.ip === ip && b.scopes.includes(scope) && (b.until === null || b.until > now) && (b.kind === 'manual' || !exempt(d, ip, scope)));
    if (ban)
        return { blocked: true, reason: ban.reason, publicReason: ban.kind === 'auto' ? 'rate_limit' as const : 'access_rule' as const, retryAt: ban.until ?? undefined, status: ban.kind === 'auto' ? 429 as const : 403 as const };
    const geo = scope === 'login' ? undefined : d.regions.find(r => r.enabled && r.scopes.includes(scope) && (r.until === null || r.until > now) && country !== '' && r.country === country && (!r.region || r.region === region));
    if (geo)
        return { blocked: true, reason: '命中地区封禁规则', publicReason: 'region' as const, retryAt: geo.until ?? undefined, status: 403 as const };
    return { blocked: false, reason: exempt(d, ip, scope) ? '命中允许名单' : '防护放行', retryAt: undefined };
}
export async function enforceSecurity(env: Env, ip: string, scope: Scope, country = '', region = '', count: boolean | number = false) {
    if (!securityEnabled(env))
        return;
    const check = (d: SecurityState) => { const result = evaluate(d, ip, scope, country, region); if (result.blocked)
        throw new SecurityError(result.status || 403, '当前请求受访问规则限制', result.retryAt, false, result.publicReason); };
    if (!count) {
        check(await securityState(env));
        return;
    }
    const attempts = Number(count);
    let retryAt: number | undefined;
    await change(env, (d, now) => {
        retryAt = undefined;
        check(d);
        const rule = d.rules[scope];
        if (!rule.enabled || exempt(d, ip, scope))
            return false;
        let counter = d.counters.find(c => c.ip === ip && c.scope === scope);
        if (!counter) {
            if (d.counters.length >= 1000)
                throw new SecurityError(503, '防护计数容量已满，请稍后重试');
            counter = { ip, scope, times: [] };
            d.counters.push(counter);
        }
        if (d.counters.reduce((n, c) => n + c.times.length, 0) + attempts > 20000)
            throw new SecurityError(503, '防护计数容量已满，请稍后重试');
        for (let i = 0; i < attempts; i++) counter.times.push(now);
        if (counter.times.length >= rule.limit) {
            if (d.bans.length >= 1000)
                throw new SecurityError(503, '防护记录容量已满，请稍后重试');
            retryAt = now + rule.duration * 60000;
            d.bans.push({ ip, scopes: [scope], kind: 'auto', reason: scope === 'upload' ? '上传请求超过频率限制' : '无效取件口令超过频率限制', failures: counter.times.length, at: now, until: retryAt });
            d.counters = d.counters.filter(c => c !== counter);
        }
    });
    if (retryAt)
        throw new SecurityError(429, '请求过于频繁，请稍后再试', retryAt, true);
}
/** Mutations are validated server-side and serialized with request counters by CAS. */
export async function editSecurity(env: Env, body: any) {
    if (!body || typeof body !== 'object' || typeof body.action !== 'string')
        throw new SecurityError(400, '操作参数无效');
    return change(env, (d, now) => {
        if (body.configRevision !== d.configRevision)
            throw new SecurityError(409, '配置已被其他操作更新，请刷新后重试');
        const bad = () => { throw new SecurityError(400, '规则参数无效或记录已存在'); };
        const ip = canonicalIP(body.ip);
        switch (body.action) {
            case 'rules':
                if (!rulesValid(body.rules))
                    bad();
                d.rules = structuredClone(body.rules);
                d.counters = [];
                break;
            case 'ban':
            case 'allow': {
                if (!ip || !validScopes(body.scopes) || !note(body.note))
                    bad();
                if (body.action === 'allow') {
                    if (d.allow.length >= 200 || d.allow.some(a => a.ip === ip))
                        bad();
                    d.allow.push({ ip: ip!, scopes: body.scopes, note: body.note, created: now });
                }
                else {
                    if (d.bans.length >= 1000 || !integer(body.minutes, 0, MAX_MANUAL_BAN_MINUTES) || d.bans.some(b => b.ip === ip))
                        bad();
                    d.bans.push({ ip: ip!, scopes: body.scopes, kind: 'manual', reason: body.note, failures: 0, at: now, until: body.minutes ? now + body.minutes * 60000 : null });
                }
                break;
            }
            case 'unban':
                if (!Array.isArray(body.ips) || !body.ips.length || body.ips.length > 1000 || body.ips.some((v: unknown) => !canonicalIP(v) && v !== 'unknown'))
                    bad();
                const ips = body.ips.map((ip: string) => canonicalIP(ip) || 'unknown');
                d.bans = d.bans.filter(b => !ips.includes(b.ip));
                d.counters = d.counters.filter(c => !ips.includes(c.ip));
                break;
            case 'removeAllow':
                if (!ip)
                    bad();
                d.allow = d.allow.filter(a => a.ip !== ip);
                break;
            case 'region': {
                const r = body.rule;
                if (!r || typeof r.country !== 'string' || !/^[A-Z]{2}$/.test(r.country) || typeof r.region !== 'string' || !/^[A-Z0-9-]{0,10}$/.test(r.region) || !validScopes(r.scopes, true) || !note(r.reason) || typeof r.enabled !== 'boolean' || !untilValid(r.until) || (r.enabled && r.until !== null && r.until <= now))
                    bad();
                const old = body.id ? d.regions.find(r => r.id === body.id) : undefined;
                if ((body.id && !old) || (!old && d.regions.length >= 200) || d.regions.some(v => v !== old && v.country === r.country && v.region === r.region && v.scopes.some(s => r.scopes.includes(s))))
                    bad();
                const next = { id: old?.id || crypto.randomUUID(), at: old?.at || now, country: r.country, region: r.region, scopes: r.scopes, reason: r.reason, enabled: r.enabled, until: r.until };
                if (old)
                    d.regions[d.regions.indexOf(old)] = next;
                else
                    d.regions.push(next);
                break;
            }
            case 'removeRegion':
                if (typeof body.id !== 'string')
                    bad();
                d.regions = d.regions.filter(r => r.id !== body.id);
                break;
            default: bad();
        }
        d.configRevision = crypto.randomUUID();
    });
}
