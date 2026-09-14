// 校验:HTML/JS 使用的 i18n key 在 zh/en 两份词典中都存在(开发辅助,不参与构建)
globalThis.localStorage = { getItem: () => 'zh', setItem() {} };
const { t } = await import('../public/js/i18n.js');
const fs = await import('fs');

const src = fs.readFileSync(new URL('../public/js/i18n.js', import.meta.url), 'utf8');
function dictOf(lang) {
  const m = src.match(new RegExp('  ' + lang + ': \\{([\\s\\S]*?)\\n  \\},'));
  if (!m) throw new Error('dict block not found: ' + lang);
  const d = {};
  for (const km of m[1].matchAll(/'([a-zA-Z0-9._-]+)':\s*'[^']*'/g)) d[km[1]] = 1;
  for (const km of m[1].matchAll(/'([a-zA-Z0-9._-]+)':\s*"[^"]*"/g)) d[km[1]] = 1;
  return d;
}
const zh = dictOf('zh'), en = dictOf('en');
const onlyZh = Object.keys(zh).filter((k) => !en[k]);
const onlyEn = Object.keys(en).filter((k) => !zh[k]);
console.log('zh keys:', Object.keys(zh).length, ' en keys:', Object.keys(en).length);
if (onlyZh.length || onlyEn.length) {
  console.log('MISMATCH zh-only:', onlyZh, 'en-only:', onlyEn);
  process.exit(1);
}

// 收集 HTML/JS 里用到的 key
const used = new Set();
for (const f of ['index.html', 'pickup.html', 'admin.html', '404.html']) {
  const h = fs.readFileSync(new URL('../public/' + f, import.meta.url), 'utf8');
  for (const m of h.matchAll(/data-i18n(?:-ph|-title|-aria)?="([a-zA-Z0-9._-]+)"/g)) used.add(m[1]);
}
for (const f of ['index.js', 'pickup.js', 'admin.js']) {
  const js = fs.readFileSync(new URL('../public/js/' + f, import.meta.url), 'utf8');
  for (const m of js.matchAll(/\bt\('([a-zA-Z0-9._-]+)'/g)) used.add(m[1]);
}
for (const k of ['ad.st.active', 'ad.st.expired', 'ad.st.exhausted', 'ad.kind.file', 'ad.kind.text']) used.add(k);
const missing = [...used].filter((k) => !zh[k] || !en[k]);
console.log('used keys:', used.size);
if (missing.length) {
  console.log('MISSING:', missing);
  process.exit(1);
}
console.log('ALL KEYS PRESENT in zh+en');
console.log('sample zh:', t('meta.after', '7 天', '2026-09-21 12:00'));
