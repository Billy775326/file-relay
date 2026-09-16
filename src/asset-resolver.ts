import type { Context } from 'hono';
import type { Env } from './types';

/**
 * 静态资源服务,双模式:
 * - 仓库模式(默认):静态资源由 Workers Static Assets 托管边缘直出,
 *   Worker 内只借 ASSETS.fetch 取管理页/404 页
 * - 单文件模式(npm run build:single):public/ 全部内联进 Worker
 *   (tools/gen-inline-assets.mjs 生成 src/inline-assets.gen.ts),
 *   无需 assets 绑定,整个服务打包成一个 worker.js,粘贴进控制台编辑器即可部署
 */
let inline: Record<string, string> | null = null;
export function setInlineAssets(files: Record<string, string>) {
  inline = files;
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

function mime(key: string): string {
  return MIME[key.slice(key.lastIndexOf('.'))] ?? 'application/octet-stream';
}

/** 单文件模式:模拟 Static Assets 的路径解析(/ → index.html,/pickup → pickup.html) */
function resolveKey(path: string): string | null {
  if (!inline) return null;
  const p = path.replace(/^\/+|\/+$/g, '') || 'index.html';
  const cands = p.endsWith('.html') ? [p] : [p, `${p}.html`, `${p}/index.html`];
  for (const c of cands) if (inline[c] != null) return c;
  return null;
}

/** 内联资产的内容 ETag(FNV-1a,按 key 记忆化)。
 *  资产文件名不带版本号,若不显式发缓存策略,套在自定义域前面的 CF zone 代理
 *  会按静态扩展名默认缓存 4h,部署后用户拿到旧 JS;统一 no-cache + ETag,
 *  浏览器/边缘每次条件请求,未变 304 免传输,部署即刻生效。 */
const etags = new Map<string, string>();
function etagOf(key: string, body: string): string {
  let tag = etags.get(key);
  if (tag == null) {
    let n = 0x811c9dc5;
    for (let i = 0; i < body.length; i++) {
      n = Math.imul(n ^ body.charCodeAt(i), 0x01000193) >>> 0;
    }
    tag = `W/"${n.toString(16)}-${body.length.toString(16)}"`;
    etags.set(key, tag);
  }
  return tag;
}

/**
 * 取静态资源:单文件模式走内联表,否则回退 ASSETS 绑定;两处都没有返回 null。
 * status 显式指定时以其为准(如 404 页),未指定时单文件 200、ASSETS 沿用其自身状态码。
 */
export async function serveAsset(
  c: Context<{ Bindings: Env }>,
  path: string,
  status?: number,
): Promise<Response | null> {
  const key = resolveKey(path);
  const head = c.req.method === 'HEAD';
  if (key) {
    const body = inline![key];
    const etag = etagOf(key, body);
    const headers = { etag, 'cache-control': 'no-cache' };
    if (!status && c.req.header('if-none-match') === etag) {
      return new Response(null, { status: 304, headers });
    }
    return new Response(head ? null : body, {
      status: status ?? 200,
      headers: { 'content-type': mime(key), ...headers },
    });
  }
  if (c.env.ASSETS) {
    const asset = await c.env.ASSETS.fetch(new Request(new URL(path, c.req.url), { method: c.req.method }));
    const st = status ?? asset.status;
    return new Response(st === asset.status && !head ? asset.body : head ? null : await asset.text(), {
      status: st,
      headers: asset.headers,
    });
  }
  return null;
}
