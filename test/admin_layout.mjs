import { spawn } from 'node:child_process';
import * as miniflare from 'miniflare';

const options = { cf: {}, modules: true, scriptPath: 'dist/worker.js', compatibilityDate: '2025-06-01',
  kvNamespaces: ['fileKV'], bindings: { ADMIN_TOKEN: 'layout-test-only' } };
const mf = new miniflare.Miniflare(miniflare.convertV4MiniflareOptions?.(options) ?? options);
try {
  const url = String(await mf.ready).replace(/\/$/, '');
  await new Promise((resolve, reject) => {
    const child = spawn('python', ['test/admin_layout_ui.py', url], { stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`Admin layout UI ${code}`)));
  });
} finally { await mf.dispose(); }
