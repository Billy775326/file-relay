// build:single 收尾:wrangler dry-run 产物(standalone.js)改名为 worker.js 并报体积
import { renameSync, statSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const bundle = join(fileURLToPath(new URL('..', import.meta.url)), 'dist', '_bundle');
const dist = join(bundle, '..');
const js = readdirSync(bundle).filter((f) => f.endsWith('.js'));

if (js.length !== 1) {
  console.error(`预期 1 个构建产物,实际 ${js.length} 个: ${js.join(', ')}`);
  process.exit(1);
}
renameSync(join(bundle, js[0]), join(dist, 'worker.js'));
rmSync(bundle, { recursive: true, force: true });
console.log(`✔ dist/worker.js(${(statSync(join(dist, 'worker.js')).size / 1024).toFixed(1)} KB)—— 粘贴到 Cloudflare 控制台编辑器即可部署`);
