// Pages 部署产物:复制 build:single 的 dist/worker.js 为 dist/pages/_worker.js
// Pages 约定:输出目录根部的 _worker.js = 高级模式,全部请求先进 Worker(前端资产已内联,无需静态目录)
// 绑定(KV/变量)不随部署上传,全部在 Pages 项目控制台配置,永不被部署覆盖
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
  `✔ dist/pages/_worker.js(${(statSync(out).size / 1024).toFixed(1)} KB)—— ` +
    'Pages 项目:构建命令 npm run build:pages,输出目录 dist/pages;' +
    'KV(fileKV)与变量(ADMIN_TOKEN 等)在 Pages 控制台 Settings → Functions 里绑定',
);
