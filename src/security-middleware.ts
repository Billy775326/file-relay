import { transferPath } from './api-auth';
import type { Context } from 'hono';
import type { Env } from './types';
import { enforceSecurity, SecurityError, securityResponse, type Scope } from './security';
import { loginIP } from './login-protection';
import { publicRejection } from './public-audit';
/** Check before consuming a body or returning a file; chunks are checked but never counted again. */
export async function publicSecurity(c: Context<{
    Bindings: Env;
}>, next: () => Promise<void>) {
    const path = transferPath(c.req.path, c.req.method), method = c.req.method;
    const upload = path.startsWith('/api/uploads/') || path === '/api/shares/file' || path === '/api/shares/text';
    const pickup = path === '/api/pickup' || /^\/api\/pickup\/[^/]+\/download$/.test(path);
    if (!upload && !pickup)
        return next();
    // Aborting an owned upload remains possible after a ban, so reserved space can be released.
    if (upload && path.endsWith('/abort'))
        return next();
    const scope: Scope = upload ? 'upload' : 'pickup', ip = loginIP(c);
    const country = typeof c.req.raw.cf?.country === 'string' ? c.req.raw.cf.country : '';
    const region = typeof c.req.raw.cf?.regionCode === 'string' ? c.req.raw.cf.regionCode : '';
    const count = upload && method === 'POST' && ['/api/uploads/init', '/api/shares/file', '/api/shares/text'].includes(path);
    const reject = async (error: unknown) => {
        if (!(error instanceof SecurityError))
            throw error;
        publicRejection(c, error);
        return securityResponse(c, error)!;
    };
    try {
        await enforceSecurity(c.env, ip, scope, country, region, count);
    }
    catch (error) {
        return reject(error);
    }
    await next();
    // Count invalid code attempts, including direct downloads, but not expiry or completed pickups.
    if (pickup && [400, 404].includes(c.res.status) && ['POST', 'GET', 'HEAD'].includes(method)) {
        try {
            await enforceSecurity(c.env, ip, scope, country, region, true);
        }
        catch (error) {
            c.res = await reject(error);
        }
    }
}
