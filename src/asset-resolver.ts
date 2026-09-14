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
    return new Response(head ? null : inline![key], {
      status: status ?? 200,
      headers: { 'content-type': mime(key) },
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
