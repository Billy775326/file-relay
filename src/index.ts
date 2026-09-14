import { Hono } from 'hono';
import type { Env } from './types';
import { uploadRoutes } from './upload';
import { shareRoutes } from './share';
import { adminRoutes } from './admin';
import { runCleanup } from './cleanup';

const app = new Hono<{ Bindings: Env }>();

app.get('/api/health', (c) => c.json({ ok: true }));
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
