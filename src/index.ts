import { Hono } from 'hono';
import type { Env } from './types';
import { num } from './types';
import { uploadRoutes } from './upload';
import { shareRoutes } from './share';
import { adminRoutes } from './admin';
import { runCleanup } from './cleanup';
import { fileMode, fileMaxSize } from './filestore';

const app = new Hono<{ Bindings: Env }>();

// 元数据库前置检查:D1/KV 至少绑一个(都没绑时给出可读错误而非路由内炸 500)
app.use('/api/*', async (c, next) => {
  if (!c.env.DB && !c.env.KV) {
    return c.json({ error: 'config', message: '未绑定元数据库:请在 wrangler.jsonc 配置 KV 或 D1(二选一)' }, 500);
  }
  await next();
});

app.get('/api/health', (c) => c.json({ ok: true }));

/** 前端据此选择上传方式:fileBackend=r2 走分片,kv 走单请求直传 */
app.get('/api/config', (c) =>
  c.json({
    fileBackend: fileMode(c.env) ?? 'none',
    maxFileSize: fileMaxSize(c.env),
    maxTextLength: num(c.env.MAX_TEXT_LENGTH, 65_536),
    partSize: num(c.env.PART_SIZE, 10 * 1024 * 1024),
  }),
);
app.route('/api/uploads', uploadRoutes);
app.route('/api', shareRoutes);
app.route('/api/admin', adminRoutes);

app.notFound(async (c) => {
  // API 未知路径:JSON 404
  if (c.req.path.startsWith('/api/')) {
    return c.json({ error: 'not_found', message: '接口不存在' }, 404);
  }
  // 页面路径:兜底 404.html(不用 not_found_handling,避免它吞掉 API 的 JSON 404)
  const asset = await c.env.ASSETS.fetch(new Request(new URL('/404.html', c.req.url)));
  return new Response(asset.body, { status: 404, headers: asset.headers });
});

export default {
  fetch: app.fetch,
  scheduled: (_event: ScheduledController, env: Env, ctx: ExecutionContext) =>
    ctx.waitUntil(runCleanup(env)),
} satisfies ExportedHandler<Env>;
