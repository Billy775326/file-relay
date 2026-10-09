// Pages 部署产物:复制 build:single 的 dist/worker.js 为 dist/pages/_worker.js
// Pages 约定:输出目录根部的 _worker.js = 高级模式,全部请求先进 Worker(前端资产已内联,无需静态目录)
// 此脚本仅生成本地文件；生产绑定与变量在 Pages 项目设置中配置。
import { mkdirSync, copyFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const src = join(root, 'dist', 'worker.js');
const outDir = join(root, 'dist', 'pages');
const out = join(outDir, '_worker.js');

mkdirSync(outDir, { recursive: true });
copyFileSync(src, out);
console.log(
  `Built: dist/pages/_worker.js (${(statSync(out).size / 1024).toFixed(1)} KiB)\n` +
    'Pages build command: npm run build:pages | Output: dist/pages\n' +
    'This command builds locally; nothing has been deployed.\n' +
    'Next: docs/deployment.md | English: docs/deployment.en.md',
);
