// 把 public/ 全部内联成 TS 模块(单文件部署):npm run build:single 的第一步
// 产物 src/inline-assets.gen.ts 已 gitignore,每次构建重新生成,勿手改
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative, sep } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const dir = join(root, 'public');

function walk(d) {
  const out = [];
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const files = {};
for (const abs of walk(dir)) {
  files[relative(dir, abs).split(sep).join('/')] = readFileSync(abs, 'utf8');
}

const code = `// 自动生成(npm run build:single),勿手改:public/ 内联进 Worker,单文件部署用
import { setInlineAssets } from './asset-resolver';
setInlineAssets(${JSON.stringify(files)});
`;
writeFileSync(join(root, 'src/inline-assets.gen.ts'), code);
console.log(`内联 ${Object.keys(files).length} 个文件: ${Object.keys(files).join(', ')}`);
