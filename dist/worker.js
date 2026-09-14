var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/asset-resolver.ts
var inline = null;
function setInlineAssets(files) {
  inline = files;
}
__name(setInlineAssets, "setInlineAssets");
var MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2"
};
function mime(key) {
  return MIME[key.slice(key.lastIndexOf("."))] ?? "application/octet-stream";
}
__name(mime, "mime");
function resolveKey(path) {
  if (!inline) return null;
  const p = path.replace(/^\/+|\/+$/g, "") || "index.html";
  const cands = p.endsWith(".html") ? [p] : [p, `${p}.html`, `${p}/index.html`];
  for (const c of cands) if (inline[c] != null) return c;
  return null;
}
__name(resolveKey, "resolveKey");
async function serveAsset(c, path, status) {
  const key = resolveKey(path);
  const head = c.req.method === "HEAD";
  if (key) {
    return new Response(head ? null : inline[key], {
      status: status ?? 200,
      headers: { "content-type": mime(key) }
    });
  }
  if (c.env.ASSETS) {
    const asset = await c.env.ASSETS.fetch(new Request(new URL(path, c.req.url), { method: c.req.method }));
    const st = status ?? asset.status;
    return new Response(st === asset.status && !head ? asset.body : head ? null : await asset.text(), {
      status: st,
      headers: asset.headers
    });
  }
  return null;
}
__name(serveAsset, "serveAsset");

// src/inline-assets.gen.ts
setInlineAssets({ "404.html": `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="\u9875\u9762\u4E0D\u5B58\u5728">
<meta name="theme-color" content="#f6f7fb">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>\u{1F4E6}</text></svg>">
<title>404 - \u6587\u4EF6\u4E2D\u8F6C\u7AD9</title>
<link rel="stylesheet" href="/style.css">
<script>
  document.documentElement.dataset.theme =
    localStorage.getItem('theme') ||
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
<\/script>
</head>
<body>
<main class="container narrow" style="padding-top:10vh">
  <section class="card center">
    <div style="font-size:48px;margin-bottom:8px">\u{1F9ED}</div>
    <h2 class="title">\u9875\u9762\u4E0D\u5B58\u5728</h2>
    <p class="muted">\u4F60\u8981\u627E\u7684\u9875\u9762\u4E0D\u5728\u4E2D\u8F6C\u7AD9\u91CC</p>
    <div class="btn-row" style="justify-content:center">
      <a class="btn primary" href="/">\u53BB\u53D1\u9001</a>
      <a class="btn ghost" href="/pickup">\u53BB\u53D6\u4EF6</a>
    </div>
  </section>
</main>

<footer class="foot">\u81EA\u6258\u7BA1 \xB7 \u8FD0\u884C\u4E8E Cloudflare Workers</footer>
</body>
</html>
`, "admin.html": `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="\u6587\u4EF6\u4E2D\u8F6C\u7AD9\u7BA1\u7406\u540E\u53F0">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#f6f7fb">
<title>\u6587\u4EF6\u4E2D\u8F6C\u7AD9 - \u7BA1\u7406</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>\u{1F4E6}</text></svg>">
<link rel="stylesheet" href="/style.css">
<script>
  document.documentElement.dataset.theme =
    localStorage.getItem('theme') ||
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
<\/script>
</head>
<body>
<header class="topbar wide">
  <div class="brand">
    <span class="logo">\u{1F4E6}</span>
    <div><b>\u6587\u4EF6\u4E2D\u8F6C\u7AD9</b><small>\u7BA1\u7406\u540E\u53F0</small></div>
  </div>
  <div class="actions">
    <button id="theme-btn" class="icon-btn" title="\u5207\u6362\u4E3B\u9898">\u{1F317}</button>
    <a class="btn ghost small" href="/">\u53D1\u9001</a>
  </div>
</header>

<main class="container wide">
  <section class="card center" id="admin-login" hidden>
    <h2 class="title">\u7BA1\u7406\u767B\u5F55</h2>
    <p class="muted" style="margin:0">\u8F93\u5165\u90E8\u7F72\u65F6\u8BBE\u7F6E\u7684\u7BA1\u7406\u4EE4\u724C(ADMIN_TOKEN)</p>
    <input id="admin-token" class="token-input" type="password" placeholder="\u7BA1\u7406\u4EE4\u724C" autocomplete="current-password">
    <button id="btn-login" class="btn primary block">\u767B\u5F55</button>
    <div id="login-error" class="error-box" hidden></div>
  </section>

  <section id="admin-panel" hidden>
    <div class="stats-row" id="stats-row"></div>
    <div class="card" style="padding:14px">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>\u53E3\u4EE4</th><th>\u7C7B\u578B</th><th>\u5185\u5BB9</th><th>\u5927\u5C0F</th>
              <th>\u5DF2\u53D6/\u4E0A\u9650</th><th>\u8FC7\u671F\u65F6\u95F4</th><th>\u72B6\u6001</th><th>\u521B\u5EFA\u65F6\u95F4</th><th></th>
            </tr>
          </thead>
          <tbody id="shares-body"></tbody>
        </table>
      </div>
      <div class="row-between">
        <div class="pager-btns">
          <button id="btn-prev" class="btn small" disabled>\u4E0A\u4E00\u9875</button>
          <button id="btn-next" class="btn small" disabled>\u4E0B\u4E00\u9875</button>
        </div>
        <small class="muted" id="page-info"></small>
        <button id="btn-refresh" class="btn small ghost">\u21BB \u5237\u65B0</button>
      </div>
      <div class="admin-foot">
        <button id="btn-logout" class="btn ghost small">\u9000\u51FA\u767B\u5F55</button>
      </div>
    </div>
  </section>
</main>

<script type="module" src="/js/admin.js"><\/script>
</body>
</html>
`, "index.html": `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="\u81EA\u6258\u7BA1\u6587\u4EF6/\u6587\u672C\u5206\u4EAB:\u4E0A\u4F20\u751F\u6210 6 \u4F4D\u53D6\u4EF6\u53E3\u4EE4,\u50CF\u53D6\u5FEB\u9012\u4E00\u6837\u53D6\u4EF6">
<meta name="theme-color" content="#f6f7fb">
<title>\u6587\u4EF6\u4E2D\u8F6C\u7AD9 - \u53D1\u9001</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>\u{1F4E6}</text></svg>">
<link rel="stylesheet" href="/style.css">
<script>
  // \u9632 FOUC:\u6E32\u67D3\u524D\u5B9A\u4E3B\u9898
  document.documentElement.dataset.theme =
    localStorage.getItem('theme') ||
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
<\/script>
</head>
<body>
<header class="topbar">
  <div class="brand">
    <span class="logo">\u{1F4E6}</span>
    <div><b>\u6587\u4EF6\u4E2D\u8F6C\u7AD9</b><small>\u50CF\u53D6\u5FEB\u9012\u4E00\u6837\u53D6\u6587\u4EF6</small></div>
  </div>
  <div class="actions">
    <button id="theme-btn" class="icon-btn" title="\u5207\u6362\u4E3B\u9898">\u{1F317}</button>
    <a class="btn ghost small" href="/pickup">\u53D6\u4EF6</a>
  </div>
</header>

<main class="container">
  <section class="card">
    <div class="tabs">
      <button class="tab active" data-tab="file">\u53D1\u6587\u4EF6</button>
      <button class="tab" data-tab="text">\u53D1\u6587\u672C</button>
    </div>

    <div id="panel-file" class="panel">
      <div id="dropzone" class="dropzone" tabindex="0" role="button" aria-label="\u9009\u62E9\u6587\u4EF6">
        <input type="file" id="file-input" hidden>
        <div class="dz-icon">\u{1F4C4}</div>
        <p><b>\u70B9\u51FB\u9009\u62E9\u6587\u4EF6</b>,\u6216\u62D6\u62FD / \u7C98\u8D34\u5230\u6B64\u5904</p>
        <small id="dz-hint">\u4E0A\u4F20\u540E\u751F\u6210 6 \u4F4D\u53D6\u4EF6\u53E3\u4EE4</small>
      </div>
      <div id="file-info" class="file-info" hidden>
        <span class="fi-icon">\u{1F4CE}</span>
        <div class="fi-meta"><b id="fi-name"></b><small id="fi-size"></small></div>
        <button id="fi-remove" class="icon-btn" title="\u79FB\u9664\u6587\u4EF6">\u2715</button>
      </div>
    </div>

    <div id="panel-text" class="panel" hidden>
      <textarea id="text-input" rows="6" maxlength="65536" placeholder="\u7C98\u8D34\u6216\u8F93\u5165\u8981\u5206\u4EAB\u7684\u6587\u672C\u2026"></textarea>
      <div class="row-between"><small class="muted" id="text-counter">0 / 65536</small></div>
    </div>

    <div class="options">
      <div class="opt-group">
        <label>\u6709\u6548\u671F</label>
        <div class="seg" id="seg-expiry">
          <button type="button" data-v="1d">1 \u5929</button>
          <button type="button" data-v="7d" class="active">7 \u5929</button>
          <button type="button" data-v="30d">30 \u5929</button>
          <button type="button" data-v="forever">\u6C38\u4E45</button>
        </div>
      </div>
      <div class="opt-group">
        <label>\u53EF\u53D6\u6B21\u6570</label>
        <div class="seg" id="seg-pickups">
          <button type="button" data-v="1">1 \u6B21</button>
          <button type="button" data-v="5">5 \u6B21</button>
          <button type="button" data-v="null" class="active">\u4E0D\u9650</button>
        </div>
      </div>
    </div>

    <button id="btn-upload" class="btn primary block" disabled>\u5F00\u59CB\u4E0A\u4F20</button>
    <button id="btn-text" class="btn primary block" hidden disabled>\u751F\u6210\u53E3\u4EE4</button>

    <div id="progress" class="progress" hidden>
      <div class="bar"><div id="progress-fill"></div></div>
      <div class="row-between">
        <small id="progress-text">\u51C6\u5907\u4E2D\u2026</small>
        <button id="btn-cancel" class="btn danger small" type="button">\u53D6\u6D88</button>
      </div>
    </div>

    <div id="result" class="result" hidden>
      <p class="result-title">\u2705 \u5206\u4EAB\u6210\u529F,\u628A\u53E3\u4EE4\u53D1\u7ED9\u5BF9\u65B9</p>
      <div class="code" id="result-code"></div>
      <div class="result-link" id="result-link"></div>
      <div class="result-meta" id="result-meta"></div>
      <div class="btn-row">
        <button id="btn-copy-code" class="btn primary" type="button">\u590D\u5236\u53E3\u4EE4</button>
        <button id="btn-copy-link" class="btn" type="button">\u590D\u5236\u94FE\u63A5</button>
        <button id="btn-again" class="btn ghost" type="button">\u518D\u6765\u4E00\u4E2A</button>
      </div>
    </div>
  </section>
</main>

<footer class="foot">\u81EA\u6258\u7BA1 \xB7 \u8FD0\u884C\u4E8E Cloudflare Workers</footer>

<script type="module" src="/js/index.js"><\/script>
</body>
</html>
`, "js/admin.js": "import { $, api, fmtBytes, fmtDate, toast, initTheme, el } from './common.js';\n\ninitTheme();\n\nconst loginCard = $('#admin-login');\nconst panel = $('#admin-panel');\nconst loginError = $('#login-error');\nconst tokenInput = $('#admin-token');\nconst statsRow = $('#stats-row');\nconst tbody = $('#shares-body');\nconst btnPrev = $('#btn-prev');\nconst btnNext = $('#btn-next');\nconst btnRefresh = $('#btn-refresh');\nconst pageInfo = $('#page-info');\n\nconst LIMIT = 50;\nlet offset = 0;\nlet total = 0;\n\n/* ---------- \u767B\u5F55\u6001\u63A2\u6D4B:stats \u901A\u5219\u89C6\u4E3A\u5DF2\u767B\u5F55 ---------- */\n(async () => {\n  try {\n    await api('/api/admin/stats');\n    showPanel();\n  } catch {\n    loginCard.hidden = false;\n    tokenInput.focus();\n  }\n})();\n\nasync function login() {\n  const token = tokenInput.value.trim();\n  if (!token) return;\n  loginError.hidden = true;\n  try {\n    await api('/api/admin/login', { method: 'POST', body: { token } });\n    showPanel();\n  } catch (e) {\n    loginError.textContent = e.message || '\u4EE4\u724C\u65E0\u6548';\n    loginError.hidden = false;\n  }\n}\n$('#btn-login').addEventListener('click', login);\ntokenInput.addEventListener('keydown', (e) => e.key === 'Enter' && login());\n\nfunction showPanel() {\n  loginCard.hidden = true;\n  panel.hidden = false;\n  loadStats();\n  loadList();\n}\n\n$('#btn-logout').addEventListener('click', async () => {\n  try { await api('/api/admin/logout', { method: 'POST', body: {} }); } catch { /* ignore */ }\n  location.reload();\n});\n\n/* ---------- \u7EDF\u8BA1 ---------- */\nasync function loadStats() {\n  try {\n    const s = await api('/api/admin/stats');\n    statsRow.replaceChildren(\n      el('div', { class: 'stat-card' }, el('b', {}, String(s.total)), el('small', { class: 'muted' }, '\u5206\u4EAB\u603B\u6570')),\n      el('div', { class: 'stat-card' }, el('b', {}, String(s.active)), el('small', { class: 'muted' }, '\u5F53\u524D\u6709\u6548')),\n      el('div', { class: 'stat-card' }, el('b', {}, String(s.files)), el('small', { class: 'muted' }, '\u6587\u4EF6')),\n      el('div', { class: 'stat-card' }, el('b', {}, String(s.texts)), el('small', { class: 'muted' }, '\u6587\u672C')),\n      el('div', { class: 'stat-card' }, el('b', {}, fmtBytes(s.totalBytes)), el('small', { class: 'muted' }, '\u5360\u7528\u5B58\u50A8')),\n      el('div', { class: 'stat-card' }, el('b', {}, String(s.todayCreated)), el('small', { class: 'muted' }, '\u4ECA\u65E5\u65B0\u589E')),\n    );\n  } catch { /* \u5FFD\u7565,\u5217\u8868\u52A0\u8F7D\u4F1A\u518D\u62A5 */ }\n}\n\n/* ---------- \u5217\u8868 ---------- */\nconst STATUS_LABEL = { active: '\u6709\u6548', expired: '\u5DF2\u8FC7\u671F', exhausted: '\u5DF2\u53D6\u5B8C' };\n\nasync function loadList() {\n  tbody.replaceChildren(el('tr', {}, el('td', { class: 'muted', colspan: 9 }, '\u52A0\u8F7D\u4E2D\u2026')));\n  try {\n    const data = await api(`/api/admin/shares?limit=${LIMIT}&offset=${offset}`);\n    total = data.total;\n    const rows = data.rows ?? [];\n    tbody.replaceChildren();\n    for (const r of rows) {\n      const content = r.kind === 'text' ? (r.text_preview || '(\u6587\u672C)') : (r.filename || '(\u672A\u547D\u540D)');\n      tbody.append(\n        el('tr', {},\n          el('td', { class: 'mono' }, r.code),\n          el('td', {}, el('span', { class: `badge kind-${r.kind}` }, r.kind === 'file' ? '\u6587\u4EF6' : '\u6587\u672C')),\n          el('td', { class: 'wrap' }, content),\n          el('td', {}, r.kind === 'text' ? `${r.size} \u5B57` : fmtBytes(r.size)),\n          el('td', {}, `${r.pickup_count} / ${r.max_pickups ?? '\u221E'}`),\n          el('td', {}, r.expire_at ? fmtDate(r.expire_at) : '\u6C38\u4E45'),\n          el('td', {}, el('span', { class: `badge ${r.status}` }, STATUS_LABEL[r.status] || r.status)),\n          el('td', {}, fmtDate(r.created_at)),\n          el('td', {}, el('button', { class: 'btn danger small', onclick: () => remove(r) }, '\u5220\u9664')),\n        ),\n      );\n    }\n    if (rows.length === 0) {\n      tbody.replaceChildren(el('tr', {}, el('td', { class: 'muted', colspan: 9 }, '\u6682\u65E0\u5206\u4EAB')));\n    }\n    updatePager();\n  } catch (e) {\n    tbody.replaceChildren(el('tr', {}, el('td', { class: 'muted', colspan: 9 }, e.message || '\u52A0\u8F7D\u5931\u8D25')));\n  }\n}\n\nfunction updatePager() {\n  const page = Math.floor(offset / LIMIT) + 1;\n  const pages = Math.max(1, Math.ceil(total / LIMIT));\n  pageInfo.textContent = `\u7B2C ${page} / ${pages} \u9875 \xB7 \u5171 ${total} \u6761`;\n  btnPrev.disabled = offset <= 0;\n  btnNext.disabled = offset + LIMIT >= total;\n}\nbtnPrev.addEventListener('click', () => { offset = Math.max(0, offset - LIMIT); loadList(); });\nbtnNext.addEventListener('click', () => { offset += LIMIT; loadList(); });\nbtnRefresh.addEventListener('click', () => { loadStats(); loadList(); });\n\n/* ---------- \u5220\u9664 ---------- */\nasync function remove(r) {\n  const label = r.kind === 'text' ? `\u6587\u672C\u300C${(r.text_preview || '').slice(0, 20)}\u2026` : `\u6587\u4EF6\u300C${r.filename || r.code}`;\n  if (!confirm(`\u786E\u5B9A\u5220\u9664${label}\u300D?\u6587\u4EF6\u5C06\u4ECE\u5B58\u50A8\u4E2D\u79FB\u9664,\u53E3\u4EE4 ${r.code} \u5C06\u7ACB\u5373\u5931\u6548\u3002`)) return;\n  try {\n    await api(`/api/admin/shares/${r.code}`, { method: 'DELETE' });\n    toast('\u5DF2\u5220\u9664', 'ok');\n    loadStats();\n    loadList();\n  } catch (e) {\n    toast(e.message || '\u5220\u9664\u5931\u8D25', 'error');\n  }\n}\n", "js/common.js": "export const $ = (sel, el = document) => el.querySelector(sel);\nexport const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];\n\n/** fetch JSON \u5C01\u88C5:\u975E 2xx \u629B\u9519(\u5E26\u670D\u52A1\u7AEF\u7684\u4E2D\u6587 message \u4E0E\u673A\u5668\u7801) */\nexport async function api(path, opts = {}) {\n  const res = await fetch(path, {\n    method: opts.method || 'GET',\n    headers: opts.body !== undefined ? { 'Content-Type': 'application/json' } : {},\n    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,\n  });\n  let data = null;\n  try { data = await res.json(); } catch { /* \u975E JSON \u54CD\u5E94 */ }\n  if (!res.ok) {\n    const e = new Error(data?.message || `\u8BF7\u6C42\u5931\u8D25 (${res.status})`);\n    e.code = data?.error || 'unknown';\n    e.status = res.status;\n    throw e;\n  }\n  return data;\n}\n\nexport function fmtBytes(n) {\n  if (!Number.isFinite(n) || n < 0) return '-';\n  const units = ['B', 'KB', 'MB', 'GB', 'TB'];\n  let i = 0;\n  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }\n  const v = i === 0 ? Math.round(n) : n >= 100 ? Math.round(n) : Math.round(n * 10) / 10;\n  return `${v} ${units[i]}`;\n}\n\nexport function fmtDate(ms) {\n  if (ms === null || ms === undefined) return '\u6C38\u4E45';\n  const d = new Date(ms);\n  const p = (x) => String(x).padStart(2, '0');\n  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;\n}\n\n/** \u79D2\u6570\u4EBA\u6027\u5316:\u7528\u4E8E\u4E0A\u4F20\u5269\u4F59\u65F6\u95F4 / \u8FC7\u671F\u5012\u8BA1\u65F6 */\nexport function fmtDuration(sec) {\n  if (!Number.isFinite(sec) || sec < 0) return '-';\n  if (sec < 1) return '\u4E0D\u8DB3 1 \u79D2';\n  if (sec < 60) return `${Math.round(sec)} \u79D2`;\n  if (sec < 3600) {\n    const m = Math.floor(sec / 60);\n    const s = Math.round(sec % 60);\n    return s ? `${m} \u5206 ${s} \u79D2` : `${m} \u5206`;\n  }\n  if (sec < 86400) {\n    const h = Math.floor(sec / 3600);\n    const m = Math.round((sec % 3600) / 60);\n    return m ? `${h} \u65F6 ${m} \u5206` : `${h} \u65F6`;\n  }\n  return `${Math.round(sec / 86400)} \u5929`;\n}\n\n/** \u6309\u6587\u4EF6\u540D/ MIME \u6311\u4E00\u4E2A\u76F4\u89C2\u56FE\u6807(\u7EAF\u5C55\u793A\u7528) */\nexport function iconFor(name = '', mime = '') {\n  const ext = (name.split('.').pop() || '').toLowerCase();\n  if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'].includes(ext)) return '\u{1F5BC}\uFE0F';\n  if (mime.startsWith('video/') || ['mp4', 'mkv', 'mov', 'avi', 'webm', 'flv'].includes(ext)) return '\u{1F3AC}';\n  if (mime.startsWith('audio/') || ['mp3', 'flac', 'wav', 'ogg', 'm4a', 'aac'].includes(ext)) return '\u{1F3B5}';\n  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(ext)) return '\u{1F5DC}\uFE0F';\n  if (mime === 'application/pdf' || ext === 'pdf') return '\u{1F4D5}';\n  if (['doc', 'docx', 'txt', 'md', 'ppt', 'pptx', 'xls', 'xlsx', 'csv'].includes(ext)) return '\u{1F4C4}';\n  if (['js', 'ts', 'py', 'json', 'html', 'css', 'java', 'go', 'rs', 'c', 'cpp', 'sh', 'yml', 'yaml', 'xml'].includes(ext)) return '\u{1F9E9}';\n  return '\u{1F4E6}';\n}\n\nexport async function copyText(text) {\n  try {\n    await navigator.clipboard.writeText(text);\n    return true;\n  } catch { /* \u8D70\u964D\u7EA7 */ }\n  try {\n    const ta = document.createElement('textarea');\n    ta.value = text;\n    ta.style.cssText = 'position:fixed;opacity:0';\n    document.body.appendChild(ta);\n    ta.select();\n    const ok = document.execCommand('copy');\n    ta.remove();\n    return ok;\n  } catch {\n    return false;\n  }\n}\n\nexport function toast(msg, type = 'info') {\n  let host = $('#toast-host');\n  if (!host) {\n    host = document.createElement('div');\n    host.id = 'toast-host';\n    document.body.appendChild(host);\n  }\n  const t = document.createElement('div');\n  t.className = `toast ${type}`;\n  t.textContent = msg;\n  host.appendChild(t);\n  requestAnimationFrame(() => t.classList.add('show'));\n  setTimeout(() => {\n    t.classList.remove('show');\n    setTimeout(() => t.remove(), 300);\n  }, 2400);\n}\n\nexport function initTheme() {\n  const btn = $('#theme-btn');\n  const meta = $('meta[name=\"theme-color\"]');\n  const sync = () => {\n    if (meta) meta.content = document.documentElement.dataset.theme === 'dark' ? '#0f1117' : '#f6f7fb';\n  };\n  sync();\n  btn?.addEventListener('click', () => {\n    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';\n    localStorage.setItem('theme', next);\n    document.documentElement.dataset.theme = next;\n    sync();\n  });\n}\n\n/** \u5B89\u5168 DOM \u6784\u5EFA:\u5168\u90E8 textContent,\u9632 XSS */\nexport function el(tag, attrs = {}, ...children) {\n  const n = document.createElement(tag);\n  for (const [k, v] of Object.entries(attrs)) {\n    if (k === 'class') n.className = v;\n    else if (k === 'href' || k === 'download' || k === 'type' || k === 'inputmode' || k === 'colspan') n.setAttribute(k, v);\n    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);\n    else n[k] = v;\n  }\n  for (const c of children.flat(Infinity)) {\n    if (c == null || c === false) continue;\n    n.append(c instanceof Node ? c : document.createTextNode(String(c)));\n  }\n  return n;\n}\n", "js/index.js": "import { $, $$, api, fmtBytes, fmtDate, fmtDuration, iconFor, copyText, toast, initTheme } from './common.js';\n\ninitTheme();\n\nconst els = {\n  dropzone: $('#dropzone'),\n  dzHint: $('#dz-hint'),\n  fileInput: $('#file-input'),\n  fileInfo: $('#file-info'),\n  fiName: $('#fi-name'),\n  fiSize: $('#fi-size'),\n  fiIcon: $('.fi-icon'),\n  fiRemove: $('#fi-remove'),\n  textInput: $('#text-input'),\n  textCounter: $('#text-counter'),\n  btnUpload: $('#btn-upload'),\n  btnText: $('#btn-text'),\n  progress: $('#progress'),\n  progressFill: $('#progress-fill'),\n  progressText: $('#progress-text'),\n  btnCancel: $('#btn-cancel'),\n  result: $('#result'),\n  resultCode: $('#result-code'),\n  resultLink: $('#result-link'),\n  resultMeta: $('#result-meta'),\n};\n\nconst MAX_SIZE_FALLBACK = 2 * 1024 * 1024 * 1024;\nlet cfg = { fileBackend: 'r2', maxFileSize: MAX_SIZE_FALLBACK }; // /api/config \u52A0\u8F7D\u540E\u8986\u76D6\nlet MAX_SIZE = MAX_SIZE_FALLBACK;\n\nlet file = null;\nlet session = null; // \u8FDB\u884C\u4E2D\u7684\u4E0A\u4F20\u4F1A\u8BDD { uploadId, partSize, parts }\nlet currentXhr = null;\nlet cancelled = false;\n\n/* \u670D\u52A1\u7AEF\u914D\u7F6E:\u51B3\u5B9A\u8D70\u5206\u7247\u4E0A\u4F20(R2 \u5927\u5B58\u50A8)\u8FD8\u662F\u5355\u8BF7\u6C42\u76F4\u4F20(KV \u5C0F\u5B58\u50A8) */\n(async () => {\n  try {\n    cfg = await api('/api/config');\n    MAX_SIZE = cfg.maxFileSize || MAX_SIZE_FALLBACK;\n    els.dzHint.textContent = `\u5355\u4E2A\u6587\u4EF6\u6700\u5927 ${fmtBytes(MAX_SIZE)} \xB7 \u4E0A\u4F20\u540E\u751F\u6210 6 \u4F4D\u53D6\u4EF6\u53E3\u4EE4`;\n  } catch { /* \u4FDD\u6301\u9ED8\u8BA4 */ }\n})();\n\n/* ---------- tabs ---------- */\n$$('.tab').forEach((t) =>\n  t.addEventListener('click', () => {\n    if (session) return; // \u4E0A\u4F20\u4E2D\u7981\u6B62\u5207\u6362\n    $$('.tab').forEach((x) => x.classList.toggle('active', x === t));\n    const tab = t.dataset.tab;\n    $('#panel-file').hidden = tab !== 'file';\n    $('#panel-text').hidden = tab !== 'text';\n    els.btnUpload.hidden = tab !== 'file';\n    els.btnText.hidden = tab !== 'text';\n    hideResult();\n  }),\n);\n\n/* ---------- segmented \u9009\u9879 ---------- */\nfor (const id of ['seg-expiry', 'seg-pickups']) {\n  $(`#${id}`).addEventListener('click', (e) => {\n    const b = e.target.closest('button');\n    if (!b) return;\n    $$('button', $(`#${id}`)).forEach((x) => x.classList.toggle('active', x === b));\n  });\n}\nfunction readOptions() {\n  const exp = $('#seg-expiry .active').dataset.v;\n  const pk = $('#seg-pickups .active').dataset.v;\n  return { expiry: exp, maxPickups: pk === 'null' ? null : Number(pk) };\n}\n\n/* ---------- \u6587\u4EF6\u9009\u62E9:\u70B9\u51FB / \u5168\u7A97\u53E3\u62D6\u62FD / \u667A\u80FD\u7C98\u8D34 ---------- */\nels.dropzone.addEventListener('click', () => els.fileInput.click());\nels.dropzone.addEventListener('keydown', (e) => {\n  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); els.fileInput.click(); }\n});\nels.fileInput.addEventListener('change', () => {\n  if (els.fileInput.files[0]) setFile(els.fileInput.files[0]);\n  els.fileInput.value = '';\n});\n\nfunction showTab(name) {\n  const t = $(`.tab[data-tab=\"${name}\"]`);\n  if (t && !t.classList.contains('active')) t.click(); // \u4E0A\u4F20\u4E2D\u65F6 tab \u5904\u7406\u5668\u81EA\u5DF1\u4F1A\u62D2\u7EDD\n}\n\n/* \u62D6\u5230\u9875\u9762\u4EFB\u610F\u4F4D\u7F6E\u90FD\u9AD8\u4EAE\u5E76\u53EF\u653E\u4E0B(\u4E0D\u518D\u8981\u6C42\u7CBE\u786E\u547D\u4E2D\u62D6\u62FD\u533A) */\nlet dragDepth = 0;\nwindow.addEventListener('dragenter', (e) => {\n  if (![...(e.dataTransfer?.types || [])].includes('Files')) return;\n  dragDepth++;\n  if (!session) els.dropzone.classList.add('dragover');\n});\nwindow.addEventListener('dragleave', () => {\n  if (--dragDepth <= 0) { dragDepth = 0; els.dropzone.classList.remove('dragover'); }\n});\nwindow.addEventListener('dragover', (e) => e.preventDefault());\nwindow.addEventListener('drop', (e) => {\n  e.preventDefault();\n  dragDepth = 0;\n  els.dropzone.classList.remove('dragover');\n  if (e.dataTransfer?.files?.[0]) setFile(e.dataTransfer.files[0]);\n});\n\n/* \u7C98\u8D34\u667A\u80FD\u8DEF\u7531:\u7C98\u8D34\u6587\u4EF6\u2192\u6587\u4EF6\u9875;\u6587\u4EF6\u9875\u7C98\u8D34\u7EAF\u6587\u672C\u2192\u81EA\u52A8\u5207\u5230\u6587\u672C\u9875 */\ndocument.addEventListener('paste', (e) => {\n  if (e.target?.closest?.('textarea, input')) return; // \u8F93\u5165\u6846\u5185\u7C98\u8D34\u8D70\u9ED8\u8BA4\u884C\u4E3A\n  if (e.clipboardData?.files?.[0]) {\n    setFile(e.clipboardData.files[0]);\n    return;\n  }\n  const text = e.clipboardData?.getData('text/plain');\n  if (text && $('#panel-text').hidden) {\n    showTab('text');\n    els.textInput.value = text;\n    els.textInput.dispatchEvent(new Event('input'));\n  }\n});\n\nfunction setFile(f) {\n  if (session) return;\n  if (f.size > MAX_SIZE) {\n    toast(`\u6587\u4EF6\u8D85\u8FC7 ${fmtBytes(MAX_SIZE)} \u4E0A\u9650(${fmtBytes(f.size)})`, 'error');\n    return;\n  }\n  if (f.size < 1) { toast('\u7A7A\u6587\u4EF6\u4E0D\u80FD\u5206\u4EAB', 'error'); return; }\n  if ($('#panel-file').hidden) showTab('file');\n  file = f;\n  els.fiIcon.textContent = iconFor(f.name, f.type);\n  els.fiName.textContent = f.name;\n  els.fiSize.textContent = `${fmtBytes(f.size)} \xB7 ${f.type || '\u672A\u77E5\u7C7B\u578B'}`;\n  els.fileInfo.hidden = false;\n  els.dropzone.hidden = true;\n  els.btnUpload.disabled = false;\n  hideResult();\n}\nfunction clearFile() {\n  file = null;\n  els.fileInfo.hidden = true;\n  els.dropzone.hidden = false;\n  els.btnUpload.disabled = true;\n}\nels.fiRemove.addEventListener('click', clearFile);\n\n/* ---------- \u6587\u672C\u8F93\u5165 ---------- */\nels.textInput.addEventListener('input', () => {\n  const len = els.textInput.value.length;\n  els.textCounter.textContent = `${len} / 65536`;\n  els.btnText.disabled = !els.textInput.value.trim();\n});\n\n/* ---------- \u4E0A\u4F20 ---------- */\nels.btnUpload.addEventListener('click', startUpload);\nels.btnCancel.addEventListener('click', cancelUpload);\nels.btnText.addEventListener('click', submitText);\n\nfunction sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }\n\nfunction xhrPut(url, blob, onProgress) {\n  return new Promise((resolve) => {\n    const xhr = new XMLHttpRequest();\n    currentXhr = xhr;\n    xhr.open('PUT', url);\n    xhr.onload = () => {\n      let etag = null;\n      try { etag = JSON.parse(xhr.responseText).etag; } catch { /* ignore */ }\n      resolve(xhr.status >= 200 && xhr.status < 300 && etag ? etag : null);\n    };\n    xhr.onerror = () => resolve(null);\n    xhr.onabort = () => resolve(null);\n    xhr.upload.onprogress = (e) => onProgress && e.lengthComputable && onProgress(e.loaded);\n    xhr.send(blob);\n  });\n}\n\n/** \u5355\u7247\u6700\u591A\u91CD\u8BD5 3 \u6B21,\u9000\u907F 1s/2s/4s */\nasync function putPartWithRetry(uploadId, n, blob, onProgress) {\n  for (let attempt = 0; attempt < 3; attempt++) {\n    if (cancelled) return null;\n    const etag = await xhrPut(`/api/uploads/${uploadId}/parts/${n}`, blob, onProgress);\n    if (etag) return etag;\n    await sleep([1000, 2000, 4000][attempt] || 4000);\n  }\n  return null;\n}\n\nlet speedState = { t: 0, loaded: 0, speed: 0 };\nfunction updateProgress(loaded, total, partIdx, parts) {\n  const pct = Math.min(100, Math.floor((loaded / total) * 100));\n  els.progressFill.style.width = pct + '%';\n  const now = performance.now();\n  if (speedState.t && loaded > speedState.loaded) {\n    const inst = (loaded - speedState.loaded) / ((now - speedState.t) / 1000);\n    speedState.speed = speedState.speed ? speedState.speed * 0.7 + inst * 0.3 : inst;\n  }\n  speedState.t = now;\n  speedState.loaded = loaded;\n  let text = `${pct}% \xB7 ${fmtBytes(loaded)} / ${fmtBytes(total)} \xB7 ${fmtBytes(speedState.speed)}/s`;\n  if (speedState.speed > 1024 && loaded > 0 && loaded < total) {\n    text += ` \xB7 \u5269\u4F59 ${fmtDuration((total - loaded) / speedState.speed)}`;\n  }\n  els.progressText.textContent = parts <= 1 ? text : `${text} \xB7 \u7B2C ${partIdx}/${parts} \u7247`;\n}\n\n/** \u7B49\u5F85\u6001(\u521D\u59CB\u5316/\u91CD\u8BD5\u95F4\u9694/\u5408\u5E76\u5206\u7247):\u8FDB\u5EA6\u6761\u53E0\u52A0\u6D41\u5149\u52A8\u753B */\nfunction setPending(on) {\n  els.progressFill.classList.toggle('pending', on);\n}\n\nasync function startUpload() {\n  if (!file || session) return;\n  if (cfg.fileBackend === 'kv') return directUpload();\n  return multipartUpload();\n}\n\n/* ---------- \u5C0F\u5B58\u50A8\u6A21\u5F0F(KV):\u5355\u8BF7\u6C42\u76F4\u4F20,\u5931\u8D25\u6574\u6587\u4EF6\u91CD\u53D1 ---------- */\nasync function directUpload() {\n  const opts = readOptions();\n  setBusy(true);\n  cancelled = false;\n  speedState = { t: 0, loaded: 0, speed: 0 };\n  els.progress.hidden = false;\n  els.progressFill.style.width = '0%';\n  setPending(false);\n  els.progressText.textContent = '\u4E0A\u4F20\u4E2D\u2026';\n\n  const qs = new URLSearchParams({\n    filename: file.name,\n    mime: file.type || 'application/octet-stream',\n    expiry: opts.expiry,\n  });\n  if (opts.maxPickups !== null) qs.set('maxPickups', String(opts.maxPickups));\n\n  for (let attempt = 0; attempt < 3; attempt++) {\n    if (cancelled) { resetAfterUpload(); return; }\n    setPending(false);\n    const res = await xhrJson('POST', `/api/shares/file?${qs}`, file, (loaded) =>\n      updateProgress(loaded, file.size, 1, 1),\n    );\n    if (res) {\n      els.progress.hidden = true;\n      showResult(res);\n      setBusy(false);\n      return;\n    }\n    setPending(true);\n    els.progressText.textContent = `\u4E0A\u4F20\u5931\u8D25,\u91CD\u8BD5 ${attempt + 1}/3\u2026`;\n    await sleep([1000, 2000][attempt] || 4000);\n  }\n  if (!cancelled) toast('\u4E0A\u4F20\u5931\u8D25,\u8BF7\u91CD\u8BD5', 'error');\n  resetAfterUpload();\n}\n\nfunction xhrJson(method, url, blob, onProgress) {\n  return new Promise((resolve) => {\n    const xhr = new XMLHttpRequest();\n    currentXhr = xhr;\n    xhr.open(method, url);\n    xhr.onload = () => {\n      if (xhr.status >= 200 && xhr.status < 300) {\n        try { resolve(JSON.parse(xhr.responseText)); return; } catch { /* fallthrough */ }\n      }\n      resolve(null);\n    };\n    xhr.onerror = () => resolve(null);\n    xhr.onabort = () => resolve(null);\n    xhr.upload.onprogress = (e) => onProgress && e.lengthComputable && onProgress(e.loaded);\n    xhr.send(blob);\n  });\n}\n\n/* ---------- \u5927\u5B58\u50A8\u6A21\u5F0F(R2):\u5206\u7247\u4E0A\u4F20 ---------- */\nasync function multipartUpload() {\n  const opts = readOptions();\n  setBusy(true);\n  speedState = { t: 0, loaded: 0, speed: 0 };\n  els.progress.hidden = false;\n  els.progressFill.style.width = '0%';\n  setPending(true);\n  els.progressText.textContent = '\u521D\u59CB\u5316\u2026';\n\n  try {\n    const init = await api('/api/uploads/init', {\n      method: 'POST',\n      body: { filename: file.name, size: file.size, mime: file.type || 'application/octet-stream', ...opts },\n    });\n    session = init;\n    cancelled = false;\n    setPending(false);\n\n    const etags = [];\n    let doneBytes = 0;\n    for (let i = 1; i <= init.parts; i++) {\n      const blob = file.slice((i - 1) * init.partSize, Math.min(i * init.partSize, file.size));\n      const etag = await putPartWithRetry(init.uploadId, i, blob, (loaded) =>\n        updateProgress(doneBytes + loaded, file.size, i, init.parts),\n      );\n      if (!etag) {\n        if (!cancelled) {\n          await abortUpload();\n          toast('\u4E0A\u4F20\u5931\u8D25,\u8BF7\u91CD\u8BD5', 'error');\n        }\n        resetAfterUpload();\n        return;\n      }\n      etags.push({ partNumber: i, etag });\n      doneBytes += blob.size;\n    }\n    if (cancelled) return;\n\n    els.progressFill.style.width = '100%';\n    setPending(true);\n    els.progressText.textContent = '\u6B63\u5728\u5408\u5E76\u5206\u7247\u2026';\n    const res = await api(`/api/uploads/${init.uploadId}/complete`, {\n      method: 'POST',\n      body: { parts: etags },\n    });\n    session = null;\n    els.progress.hidden = true;\n    showResult(res);\n  } catch (e) {\n    toast(e.message || '\u4E0A\u4F20\u5931\u8D25', 'error');\n    resetAfterUpload();\n  }\n}\n\nasync function cancelUpload() {\n  cancelled = true;\n  currentXhr?.abort();\n  await abortUpload();\n  toast('\u5DF2\u53D6\u6D88\u4E0A\u4F20');\n  resetAfterUpload();\n}\n\nasync function abortUpload() {\n  if (!session) return;\n  const id = session.uploadId;\n  session = null;\n  try { await api(`/api/uploads/${id}/abort`, { method: 'POST', body: {} }); } catch { /* ignore */ }\n}\n\nfunction setBusy(busy) {\n  els.btnUpload.disabled = busy || !file;\n  els.btnText.disabled = busy || !els.textInput.value.trim();\n}\n\nfunction resetAfterUpload() {\n  session = null;\n  els.progress.hidden = true;\n  setPending(false);\n  setBusy(false);\n}\n\n/* \u5237\u65B0/\u5173\u9875\u65F6\u5C3D\u529B\u901A\u77E5\u670D\u52A1\u7AEF\u653E\u5F03(\u4E0D\u662F\u65AD\u70B9\u7EED\u4F20) */\nwindow.addEventListener('pagehide', () => {\n  if (session) navigator.sendBeacon(`/api/uploads/${session.uploadId}/abort`);\n});\n\n/* ---------- \u6587\u672C\u5206\u4EAB ---------- */\nasync function submitText() {\n  const text = els.textInput.value;\n  if (!text.trim()) return;\n  setBusy(true);\n  try {\n    const res = await api('/api/shares/text', { method: 'POST', body: { text, ...readOptions() } });\n    showResult(res);\n  } catch (e) {\n    toast(e.message || '\u63D0\u4EA4\u5931\u8D25', 'error');\n  } finally {\n    setBusy(false);\n  }\n}\n\n/* ---------- \u7ED3\u679C\u5361\u7247 ---------- */\nfunction showResult(res) {\n  /* \u53E3\u4EE4\u9010\u4F4D\u6E32\u67D3\u6210\u74E6\u7247,\u4E0E\u53D6\u4EF6\u9875 OTP \u98CE\u683C\u547C\u5E94 */\n  els.resultCode.replaceChildren(\n    ...res.code.split('').map((d) => {\n      const s = document.createElement('span');\n      s.textContent = d;\n      return s;\n    }),\n  );\n  const link = `${location.origin}/pickup?code=${res.code}`;\n  els.resultLink.textContent = link;\n  const meta = [];\n  meta.push(res.expireAt\n    ? `${fmtDuration((res.expireAt - Date.now()) / 1000)}\u540E\u8FC7\u671F(${fmtDate(res.expireAt)})`\n    : '\u6C38\u4E45\u6709\u6548');\n  meta.push(res.maxPickups === null || res.maxPickups === undefined ? '\u53D6\u4EF6\u6B21\u6570\u4E0D\u9650' : `\u53EF\u53D6 ${res.maxPickups} \u6B21`);\n  if (res.kind === 'file' && res.size) meta.push(fmtBytes(res.size));\n  els.resultMeta.textContent = meta.join(' \xB7 ');\n  els.result.hidden = false;\n  els.result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });\n\n  $('#btn-copy-code').onclick = (e) => copyBtn(e.currentTarget, res.code, '\u53E3\u4EE4');\n  $('#btn-copy-link').onclick = (e) => copyBtn(e.currentTarget, link, '\u94FE\u63A5');\n  $('#btn-again').onclick = () => {\n    hideResult();\n    clearFile();\n    els.textInput.value = '';\n    els.textCounter.textContent = '0 / 65536';\n    els.btnText.disabled = true;\n  };\n}\n\n/** \u590D\u5236\u6210\u529F\u540E\u6309\u94AE\u77ED\u6682\u53D8\u6210\"\u2713 \u5DF2\u590D\u5236\" */\nasync function copyBtn(btn, text, label) {\n  const ok = await copyText(text);\n  toast(ok ? `${label}\u5DF2\u590D\u5236` : '\u590D\u5236\u5931\u8D25,\u8BF7\u624B\u52A8\u590D\u5236', ok ? 'ok' : 'error');\n  if (!ok) return;\n  const orig = btn.textContent;\n  btn.textContent = '\u2713 \u5DF2\u590D\u5236';\n  btn.disabled = true;\n  setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 1500);\n}\nfunction hideResult() { els.result.hidden = true; }\n", "js/pickup.js": "import { $, $$, api, fmtBytes, fmtDate, copyText, toast, initTheme, el, iconFor } from './common.js';\n\ninitTheme();\n\nconst boxes = $$('.otp-box');\nconst row = $('#otp-row');\nconst errorBox = $('#pickup-error');\nconst resultCard = $('#pickup-result');\nlet querying = false;\n\nfunction value() {\n  return boxes.map((b) => b.value).join('');\n}\n\n/* \u586B\u5165 1-6 \u4F4D\u6570\u5B57:\u591F 6 \u4F4D\u81EA\u52A8\u63D0\u4EA4,\u5426\u5219\u805A\u7126\u5230\u4E0B\u4E00\u4E2A\u7A7A\u683C */\nfunction fill(digits) {\n  boxes.forEach((b, i) => { b.value = digits[i] || ''; });\n  hideError();\n  if (digits.length === 6) {\n    boxes[5].focus();\n    if (!querying) submit();\n  } else {\n    boxes[Math.min(digits.length, 5)].focus();\n  }\n}\n\nboxes.forEach((box, i) => {\n  box.addEventListener('input', () => {\n    box.value = box.value.replace(/\\D/g, '').slice(0, 1);\n    hideError();\n    if (box.value && i < boxes.length - 1) boxes[i + 1].focus();\n    if (value().length === 6 && !querying) submit();\n  });\n  box.addEventListener('keydown', (e) => {\n    if (e.key === 'Backspace' && !box.value && i > 0) {\n      e.preventDefault();\n      boxes[i - 1].value = '';\n      boxes[i - 1].focus();\n    } else if (e.key === 'ArrowLeft' && i > 0) {\n      boxes[i - 1].focus();\n    } else if (e.key === 'ArrowRight' && i < boxes.length - 1) {\n      boxes[i + 1].focus();\n    } else if (e.key === 'Enter' && value().length === 6 && !querying) {\n      submit();\n    }\n  });\n  box.addEventListener('paste', (e) => {\n    e.preventDefault();\n    const digits = (e.clipboardData.getData('text') || '').replace(/\\D/g, '').slice(0, 6);\n    if (digits) fill(digits);\n  });\n  box.addEventListener('focus', () => box.select());\n});\n\nfunction showError(msg) {\n  errorBox.textContent = msg;\n  errorBox.hidden = false;\n  row.classList.remove('shake');\n  void row.offsetWidth; /* \u5F3A\u5236 reflow,\u91CD\u542F\u52A8\u753B */\n  row.classList.add('shake');\n}\nfunction hideError() {\n  errorBox.hidden = true;\n}\n\nasync function submit() {\n  const code = value();\n  querying = true;\n  hideError();\n  resultCard.hidden = true;\n  try {\n    const res = await api('/api/pickup', { method: 'POST', body: { code } });\n    render(res, code);\n  } catch (e) {\n    showError(e.message || '\u53D6\u4EF6\u5931\u8D25');\n  } finally {\n    querying = false;\n  }\n}\n\nfunction metaLine(res) {\n  const parts = [];\n  parts.push(res.expireAt ? `${fmtDate(res.expireAt)} \u8FC7\u671F` : '\u6C38\u4E45\u6709\u6548');\n  parts.push(res.pickupsLeft === null || res.pickupsLeft === undefined ? '\u53D6\u4EF6\u6B21\u6570\u4E0D\u9650' : `\u5269\u4F59\u53EF\u53D6 ${res.pickupsLeft} \u6B21`);\n  return parts.join(' \xB7 ');\n}\n\nfunction render(res, code) {\n  resultCard.replaceChildren();\n\n  if (res.kind === 'text') {\n    const pre = el('pre', { class: 'text-body' });\n    pre.textContent = res.text ?? '';\n    resultCard.append(\n      el('div', { class: 'share-card' },\n        el('span', { class: 'sc-icon' }, '\u{1F4DD}'),\n        el('div', { class: 'sc-meta' }, el('b', {}, `\u6587\u672C \xB7 ${res.size} \u5B57\u7B26`)),\n      ),\n      pre,\n      el('div', { class: 'btn-row' },\n        el('button', { class: 'btn primary', onclick: async () => {\n          (await copyText(res.text)) ? toast('\u5DF2\u590D\u5236\u5168\u6587', 'ok') : toast('\u590D\u5236\u5931\u8D25', 'error');\n        } }, '\u4E00\u952E\u590D\u5236\u5168\u6587'),\n      ),\n    );\n  } else {\n    resultCard.append(\n      el('div', { class: 'share-card' },\n        el('span', { class: 'sc-icon' }, iconFor(res.filename, res.mime)),\n        el('div', { class: 'sc-meta' },\n          el('b', {}, res.filename || '\u672A\u547D\u540D\u6587\u4EF6'),\n          el('small', {}, `${fmtBytes(res.size)} \xB7 ${res.mime || '\u672A\u77E5\u7C7B\u578B'}`),\n        ),\n      ),\n      el('a', {\n        class: 'btn primary block',\n        href: `/api/pickup/${code}/download`,\n        download: res.filename || 'file',\n      }, '\u2B07 \u4E0B\u8F7D\u6587\u4EF6'),\n    );\n  }\n\n  resultCard.append(\n    el('div', { class: 'meta-line' }, metaLine(res)),\n    el('div', { class: 'btn-row' },\n      el('button', { class: 'btn ghost', onclick: reset }, '\u91CD\u65B0\u8F93\u5165'),\n    ),\n  );\n  resultCard.hidden = false;\n}\n\nfunction reset() {\n  resultCard.hidden = true;\n  boxes.forEach((b) => { b.value = ''; });\n  hideError();\n  boxes[0].focus();\n}\n\n/* \u652F\u6301 /pickup?code=xxxxxx \u5E26\u53C2\u8FDB\u5165 */\nconst fromUrl = new URLSearchParams(location.search).get('code');\nif (fromUrl && /^\\d{1,6}$/.test(fromUrl)) {\n  fill(fromUrl.slice(0, 6));\n} else {\n  boxes[0].focus();\n}\n", "pickup.html": `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="\u8F93\u5165 6 \u4F4D\u53D6\u4EF6\u53E3\u4EE4,\u53D6\u51FA\u5206\u4EAB\u7ED9\u4F60\u7684\u6587\u4EF6\u6216\u6587\u672C">
<meta name="theme-color" content="#f6f7fb">
<title>\u6587\u4EF6\u4E2D\u8F6C\u7AD9 - \u53D6\u4EF6</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>\u{1F4E6}</text></svg>">
<link rel="stylesheet" href="/style.css">
<script>
  document.documentElement.dataset.theme =
    localStorage.getItem('theme') ||
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
<\/script>
</head>
<body>
<header class="topbar">
  <div class="brand">
    <span class="logo">\u{1F4E6}</span>
    <div><b>\u6587\u4EF6\u4E2D\u8F6C\u7AD9</b><small>\u53D6\u4EF6</small></div>
  </div>
  <div class="actions">
    <button id="theme-btn" class="icon-btn" title="\u5207\u6362\u4E3B\u9898">\u{1F317}</button>
    <a class="btn ghost small" href="/">\u53D1\u9001</a>
  </div>
</header>

<main class="container narrow">
  <section class="card center" id="pickup-input-card">
    <h2 class="title">\u8F93\u5165\u53D6\u4EF6\u53E3\u4EE4</h2>
    <p class="muted" style="margin:0 0 16px">\u8F93\u5165 6 \u4F4D\u6570\u5B57\u53E3\u4EE4,\u53D6\u51FA\u5206\u4EAB\u7684\u6587\u4EF6\u6216\u6587\u672C</p>
    <div id="otp-row" class="otp-row" role="group" aria-label="6 \u4F4D\u53D6\u4EF6\u53E3\u4EE4">
      <input class="otp-box" inputmode="numeric" autocomplete="one-time-code" maxlength="1" autofocus>
      <input class="otp-box" inputmode="numeric" autocomplete="one-time-code" maxlength="1">
      <input class="otp-box" inputmode="numeric" autocomplete="one-time-code" maxlength="1">
      <input class="otp-box" inputmode="numeric" autocomplete="one-time-code" maxlength="1">
      <input class="otp-box" inputmode="numeric" autocomplete="one-time-code" maxlength="1">
      <input class="otp-box" inputmode="numeric" autocomplete="one-time-code" maxlength="1">
    </div>
    <div id="pickup-error" class="error-box" hidden></div>
  </section>

  <section class="card" id="pickup-result" hidden></section>
</main>

<footer class="foot">\u81EA\u6258\u7BA1 \xB7 \u8FD0\u884C\u4E8E Cloudflare Workers</footer>

<script type="module" src="/js/pickup.js"><\/script>
</body>
</html>
`, "style.css": "/* ============ \u4E3B\u9898\u53D8\u91CF ============ */\n:root {\n  --bg: #f6f7fb;\n  --card: #ffffff;\n  --text: #1a1d27;\n  --muted: #6b7280;\n  --border: #e5e7eb;\n  --accent: #4f6ef7;\n  --accent-bright: #7c9bff;\n  --accent-text: #ffffff;\n  --accent-soft: #eef1fe;\n  --violet: #7c5cff;\n  --danger: #e5484d;\n  --danger-soft: #fdecec;\n  --ok: #2fa96e;\n  --ok-soft: #e8f7f0;\n  --warn: #d97a1a;\n  --warn-soft: #fdf3e7;\n  --radius: 16px;\n  --radius-sm: 10px;\n  --shadow: 0 1px 2px rgba(16, 24, 40, 0.05), 0 10px 30px rgba(16, 24, 40, 0.07);\n  --shadow-sm: 0 1px 2px rgba(16, 24, 40, 0.06), 0 2px 8px rgba(16, 24, 40, 0.05);\n}\n[data-theme='dark'] {\n  --bg: #0f1117;\n  --card: #171a23;\n  --text: #e8eaf2;\n  --muted: #9aa1b2;\n  --border: #262b38;\n  --accent: #6d8bff;\n  --accent-bright: #8aa2ff;\n  --accent-text: #0f1117;\n  --accent-soft: #1e2438;\n  --violet: #9d86ff;\n  --danger: #ff6b6f;\n  --danger-soft: #2e1c1e;\n  --ok: #4ecb8f;\n  --ok-soft: #16261e;\n  --warn: #f0a35a;\n  --warn-soft: #2a2118;\n  --shadow: 0 1px 3px rgba(0, 0, 0, 0.4), 0 10px 30px rgba(0, 0, 0, 0.35);\n  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.35);\n}\n\n* { box-sizing: border-box; }\nhtml { -webkit-text-size-adjust: 100%; }\nbody {\n  margin: 0;\n  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, Roboto,\n    'PingFang SC', 'HarmonyOS Sans SC', 'MiSans', 'Microsoft YaHei', sans-serif;\n  font-size: 15px;\n  line-height: 1.6;\n  color: var(--text);\n  min-height: 100vh;\n  background:\n    radial-gradient(1100px 480px at 85% -12%, rgba(79, 110, 247, 0.12), transparent 62%),\n    radial-gradient(800px 420px at -12% 6%, rgba(124, 92, 255, 0.07), transparent 58%),\n    var(--bg);\n  -webkit-font-smoothing: antialiased;\n  text-rendering: optimizeLegibility;\n}\n[data-theme='dark'] body {\n  background:\n    radial-gradient(1100px 480px at 85% -12%, rgba(109, 139, 255, 0.13), transparent 62%),\n    radial-gradient(800px 420px at -12% 6%, rgba(124, 92, 255, 0.08), transparent 58%),\n    var(--bg);\n}\n\n::selection { background: var(--accent); color: #fff; }\n\n/* \u7EC6\u6EDA\u52A8\u6761 */\n* { scrollbar-width: thin; scrollbar-color: var(--border) transparent; }\n::-webkit-scrollbar { width: 8px; height: 8px; }\n::-webkit-scrollbar-thumb { background: var(--border); border-radius: 999px; }\n::-webkit-scrollbar-track { background: transparent; }\n\n/* ============ \u9876\u680F ============ */\n.topbar {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 18px 20px 10px;\n  max-width: 720px;\n  margin: 0 auto;\n}\n.topbar.wide { max-width: 1080px; }\n.brand { display: flex; align-items: center; gap: 12px; }\n.brand .logo {\n  display: grid;\n  place-items: center;\n  width: 40px;\n  height: 40px;\n  font-size: 20px;\n  border-radius: 13px;\n  background: linear-gradient(135deg, var(--accent), var(--violet));\n  box-shadow: 0 3px 10px rgba(79, 110, 247, 0.35);\n}\n.brand b { font-size: 16px; font-weight: 650; display: block; line-height: 1.25; letter-spacing: 0.01em; }\n.brand small { color: var(--muted); font-size: 12px; }\n.actions { display: flex; align-items: center; gap: 8px; }\n\n/* ============ \u5E03\u5C40 ============ */\n.container { max-width: 720px; margin: 0 auto; padding: 6px 16px 48px; }\n.container.wide { max-width: 1080px; }\n.container.narrow { max-width: 440px; }\n.card {\n  background: var(--card);\n  border: 1px solid var(--border);\n  border-radius: var(--radius);\n  box-shadow: var(--shadow);\n  padding: 24px;\n  margin-bottom: 16px;\n}\n.card.center { text-align: center; }\n.muted { color: var(--muted); }\n.row-between { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 8px; }\n\n.foot {\n  text-align: center;\n  color: var(--muted);\n  font-size: 12px;\n  padding: 30px 16px 10px;\n  opacity: 0.85;\n}\n\n/* ============ \u6309\u94AE ============ */\n.btn {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  gap: 6px;\n  padding: 10px 18px;\n  border-radius: var(--radius-sm);\n  border: 1px solid var(--border);\n  background: var(--card);\n  color: var(--text);\n  font-size: 14px;\n  font-weight: 500;\n  cursor: pointer;\n  text-decoration: none;\n  transition: filter 0.15s, transform 0.15s, opacity 0.15s, box-shadow 0.15s, border-color 0.15s, color 0.15s;\n}\n.btn:hover { filter: brightness(1.04); }\n.btn:active { transform: scale(0.98); }\n.btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }\n.btn.primary {\n  background: linear-gradient(135deg, var(--accent-bright), var(--accent));\n  border-color: transparent;\n  color: var(--accent-text);\n  font-weight: 600;\n  box-shadow: 0 2px 6px rgba(79, 110, 247, 0.3), 0 6px 18px rgba(79, 110, 247, 0.2);\n}\n.btn.primary:hover { transform: translateY(-1px); filter: brightness(1.05); }\n.btn.primary:active { transform: translateY(0) scale(0.99); }\n.btn.ghost { background: transparent; }\n.btn.ghost:hover { border-color: var(--accent); color: var(--accent); }\n.btn.danger { background: var(--danger); border-color: var(--danger); color: #fff; }\n.btn.small { padding: 6px 12px; font-size: 13px; border-radius: 8px; }\n.btn.block { width: 100%; margin-top: 14px; }\n.btn-row { display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap; }\n.icon-btn {\n  background: transparent;\n  border: none;\n  font-size: 17px;\n  cursor: pointer;\n  color: var(--muted);\n  padding: 7px 9px;\n  border-radius: 9px;\n  transition: background 0.15s, color 0.15s, transform 0.15s;\n}\n.icon-btn:hover { background: var(--accent-soft); color: var(--accent); }\n.icon-btn:active { transform: scale(0.92); }\n\n/* ============ Tabs ============ */\n.tabs {\n  display: flex;\n  background: var(--bg);\n  border-radius: 12px;\n  padding: 4px;\n  margin-bottom: 20px;\n}\n.tab {\n  flex: 1;\n  padding: 9px;\n  border: none;\n  background: transparent;\n  border-radius: 9px;\n  font-size: 14px;\n  font-weight: 500;\n  color: var(--muted);\n  cursor: pointer;\n  transition: color 0.15s, background 0.15s, box-shadow 0.15s;\n}\n.tab.active { background: var(--card); color: var(--text); font-weight: 600; box-shadow: var(--shadow-sm); }\n\n/* ============ \u62D6\u62FD\u533A ============ */\n.dropzone {\n  border: 2px dashed var(--border);\n  border-radius: 14px;\n  padding: 38px 16px;\n  text-align: center;\n  cursor: pointer;\n  transition: border-color 0.15s, background 0.15s;\n  outline: none;\n}\n.dropzone:hover, .dropzone:focus-visible, .dropzone.dragover {\n  border-color: var(--accent);\n  background: var(--accent-soft);\n}\n.dz-icon { font-size: 36px; margin-bottom: 8px; transition: transform 0.2s ease; }\n.dropzone:hover .dz-icon, .dropzone.dragover .dz-icon { transform: scale(1.1) translateY(-2px); }\n.dropzone p { margin: 0 0 6px; font-size: 14px; }\n.dropzone p b { font-weight: 600; }\n.dropzone small { color: var(--muted); font-size: 13px; }\n\n.file-info {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  background: var(--accent-soft);\n  border: 1px solid var(--border);\n  border-radius: 12px;\n  padding: 12px 14px;\n}\n.fi-icon { font-size: 24px; }\n.fi-meta { flex: 1; min-width: 0; }\n.fi-meta b { display: block; font-size: 14px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.fi-meta small { color: var(--muted); }\n\n/* ============ \u6587\u672C\u8F93\u5165 ============ */\ntextarea {\n  width: 100%;\n  border: 1px solid var(--border);\n  border-radius: 12px;\n  background: var(--bg);\n  color: var(--text);\n  padding: 12px 14px;\n  font-size: 14px;\n  font-family: inherit;\n  line-height: 1.65;\n  resize: vertical;\n  transition: border-color 0.15s, box-shadow 0.15s;\n}\ntextarea:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }\n\n/* ============ \u9009\u9879 segmented ============ */\n.options { display: flex; flex-direction: column; gap: 14px; margin: 20px 0 6px; }\n.opt-group label { display: block; font-size: 13px; color: var(--muted); margin-bottom: 6px; }\n.seg { display: flex; background: var(--bg); border-radius: 10px; padding: 3px; }\n.seg button {\n  flex: 1;\n  padding: 7px 4px;\n  border: none;\n  background: transparent;\n  border-radius: 8px;\n  font-size: 13px;\n  color: var(--muted);\n  cursor: pointer;\n  transition: color 0.15s, background 0.15s, box-shadow 0.15s;\n}\n.seg button.active { background: var(--card); color: var(--text); font-weight: 600; box-shadow: var(--shadow-sm); }\n\n/* ============ \u8FDB\u5EA6\u6761 ============ */\n.progress { margin-top: 18px; }\n.bar {\n  height: 12px;\n  background: var(--bg);\n  border-radius: 999px;\n  overflow: hidden;\n  box-shadow: inset 0 1px 2px rgba(16, 24, 40, 0.06);\n}\n.bar > div {\n  height: 100%;\n  width: 0;\n  background: linear-gradient(90deg, var(--accent), var(--accent-bright));\n  border-radius: 999px;\n  box-shadow: 0 1px 4px rgba(79, 110, 247, 0.35);\n  transition: width 0.2s ease;\n}\n.progress small { color: var(--muted); font-variant-numeric: tabular-nums; }\n\n/* ============ \u7ED3\u679C\u5361\u7247 ============ */\n.result {\n  margin-top: 18px;\n  padding: 22px 20px;\n  border-radius: var(--radius);\n  background: var(--ok-soft);\n  border: 1px solid var(--border);\n  text-align: center;\n}\n.result-title { margin: 0 0 6px; font-weight: 600; font-size: 15px; }\n.code { display: flex; justify-content: center; gap: 10px; margin: 10px 0 12px; }\n.code span {\n  display: grid;\n  place-items: center;\n  min-width: 56px;\n  height: 68px;\n  font-size: 38px;\n  font-weight: 700;\n  font-variant-numeric: tabular-nums;\n  color: var(--text);\n  background: var(--card);\n  border: 1px solid var(--border);\n  border-bottom: 3px solid var(--accent);\n  border-radius: 14px;\n  box-shadow: var(--shadow-sm);\n  user-select: all;\n}\n.result-link { color: var(--muted); font-size: 12px; word-break: break-all; }\n.result-meta { color: var(--muted); font-size: 13px; margin-top: 8px; }\n.result .btn-row { justify-content: center; }\n\n/* ============ \u53D6\u4EF6\u9875 ============ */\nh2.title { margin: 8px 0 6px; font-size: 22px; font-weight: 700; line-height: 1.3; }\n.error-box {\n  margin-top: 14px;\n  padding: 12px 14px;\n  border-radius: var(--radius-sm);\n  background: var(--danger-soft);\n  color: var(--danger);\n  font-size: 14px;\n}\n.share-card {\n  display: flex;\n  align-items: center;\n  gap: 14px;\n  background: var(--bg);\n  border-radius: 14px;\n  padding: 16px;\n}\n.sc-icon { font-size: 32px; }\n.sc-meta { flex: 1; min-width: 0; text-align: left; }\n.sc-meta b { display: block; font-size: 15px; font-weight: 600; word-break: break-all; }\n.sc-meta small { color: var(--muted); }\n.meta-line { color: var(--muted); font-size: 13px; margin: 12px 2px 0; text-align: left; }\npre.text-body {\n  background: var(--bg);\n  border-radius: 14px;\n  padding: 14px 16px;\n  white-space: pre-wrap;\n  word-break: break-all;\n  font-size: 13px;\n  line-height: 1.7;\n  max-height: 340px;\n  overflow: auto;\n  margin: 0 0 4px;\n  text-align: left;\n}\n\n/* ============ \u7BA1\u7406\u9875 ============ */\n.stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin-bottom: 16px; }\n.stat-card {\n  background: var(--card);\n  border: 1px solid var(--border);\n  border-radius: 14px;\n  padding: 16px 12px;\n  text-align: center;\n  box-shadow: var(--shadow-sm);\n}\n.stat-card b { display: block; font-size: 24px; font-weight: 700; font-variant-numeric: tabular-nums; line-height: 1.3; }\n.stat-card small { color: var(--muted); font-size: 12px; }\n.table-wrap { overflow-x: auto; }\ntable { width: 100%; border-collapse: collapse; font-size: 13px; }\nth, td { text-align: left; padding: 10px; border-bottom: 1px solid var(--border); white-space: nowrap; }\nth { color: var(--muted); font-weight: 500; font-size: 12px; }\ntbody tr:last-child td { border-bottom: none; }\ntbody tr:hover td { background: var(--accent-soft); }\ntd.wrap { white-space: normal; min-width: 140px; max-width: 260px; overflow: hidden; text-overflow: ellipsis; }\n.badge {\n  display: inline-block;\n  padding: 2px 9px;\n  border-radius: 999px;\n  font-size: 12px;\n  font-weight: 500;\n}\n.badge.active { background: var(--ok-soft); color: var(--ok); }\n.badge.expired { background: var(--danger-soft); color: var(--danger); }\n.badge.exhausted { background: var(--warn-soft); color: var(--warn); }\n.badge.kind-file { background: var(--accent-soft); color: var(--accent); }\n.badge.kind-text { background: var(--bg); color: var(--muted); }\n.token-input {\n  width: 100%;\n  padding: 11px 13px;\n  border: 1px solid var(--border);\n  border-radius: var(--radius-sm);\n  background: var(--bg);\n  color: var(--text);\n  font-size: 14px;\n  margin: 12px 0 4px;\n  transition: border-color 0.15s, box-shadow 0.15s;\n}\n.token-input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }\n.admin-foot { margin-top: 18px; display: flex; justify-content: flex-end; }\n.pager-btns { display: flex; gap: 8px; }\n\n/* ============ toast ============ */\n#toast-host {\n  position: fixed;\n  bottom: calc(24px + env(safe-area-inset-bottom, 0px));\n  left: 50%;\n  transform: translateX(-50%);\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  z-index: 99;\n  pointer-events: none;\n}\n.toast {\n  background: var(--text);\n  color: var(--bg);\n  padding: 10px 18px;\n  border-radius: 12px;\n  font-size: 14px;\n  opacity: 0;\n  transform: translateY(8px);\n  transition: opacity 0.25s, transform 0.25s;\n  box-shadow: var(--shadow);\n}\n.toast.show { opacity: 1; transform: translateY(0); }\n.toast.ok { background: var(--ok); color: #fff; }\n.toast.error { background: var(--danger); color: #fff; }\n\n/* ============ \u79FB\u52A8\u7AEF ============ */\n@media (max-width: 640px) {\n  .card { padding: 18px; }\n  .topbar { padding: 14px 16px 8px; }\n  .code { gap: 8px; }\n  .code span { min-width: 46px; height: 58px; font-size: 30px; border-radius: 12px; }\n  .otp-row { gap: 6px; }\n  .otp-box { width: 42px; height: 54px; font-size: 24px; }\n  .btn-row .btn { flex: 1; }\n  th, td { padding: 8px 6px; }\n  .row-between { flex-wrap: wrap; }\n  .stat-card b { font-size: 21px; }\n}\n\n/* ============ \u52A8\u6548 ============ */\n@keyframes fade-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }\n@keyframes pop { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: none; } }\n.card { animation: fade-up 0.35s ease both; }\n.result:not([hidden]) { animation: pop 0.3s ease both; }\n\n@keyframes shake {\n  10%, 90% { transform: translateX(-2px); }\n  20%, 80% { transform: translateX(3px); }\n  30%, 50%, 70% { transform: translateX(-5px); }\n  40%, 60% { transform: translateX(5px); }\n}\n.shake { animation: shake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }\n\n/* \u952E\u76D8\u7126\u70B9\u53EF\u89C1\u6027 */\n.btn:focus-visible, .icon-btn:focus-visible, .tab:focus-visible,\n.seg button:focus-visible, a:focus-visible, .otp-box:focus-visible {\n  outline: 2px solid var(--accent);\n  outline-offset: 2px;\n}\n\n/* \u53D6\u4EF6\u9875:6 \u683C\u53E3\u4EE4\u8F93\u5165 */\n.otp-row { display: flex; gap: 8px; justify-content: center; margin: 4px 0 8px; }\n.otp-box {\n  width: 46px;\n  height: 58px;\n  padding: 0;\n  text-align: center;\n  font-size: 26px;\n  font-weight: 600;\n  font-variant-numeric: tabular-nums;\n  border: 2px solid var(--border);\n  border-radius: 12px;\n  background: var(--bg);\n  color: var(--text);\n  caret-color: var(--accent);\n  transition: border-color 0.15s, box-shadow 0.15s;\n}\n.otp-box:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }\n\n/* \u8FDB\u5EA6\u6761:\u7B49\u5F85\u6001(\u521D\u59CB\u5316/\u91CD\u8BD5/\u5408\u5E76\u5206\u7247)\u6D41\u5149 */\n@keyframes pending-slide { from { background-position: 0 0; } to { background-position: 34px 0; } }\n.bar > div.pending {\n  background-image: repeating-linear-gradient(\n    45deg,\n    rgba(255, 255, 255, 0) 0,\n    rgba(255, 255, 255, 0) 12px,\n    rgba(255, 255, 255, 0.28) 12px,\n    rgba(255, 255, 255, 0.28) 24px\n  );\n  background-size: 34px 34px;\n  animation: pending-slide 0.8s linear infinite;\n}\n\n.mono { font-family: ui-monospace, 'SF Mono', 'Cascadia Mono', Consolas, 'Courier New', monospace; font-variant-numeric: tabular-nums; }\n\n/* \u52A8\u753B\u654F\u611F\u7528\u6237 */\n@media (prefers-reduced-motion: reduce) {\n  *, *::before, *::after {\n    animation-duration: 0.01ms !important;\n    animation-iteration-count: 1 !important;\n    transition-duration: 0.01ms !important;\n  }\n}\n" });

// node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err2) {
          if (err2 instanceof Error && onError) {
            context.error = err2;
            res = await onError(err2, context);
            isError = true;
          } else {
            throw err2;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/buffer.js
var bufferToFormData = /* @__PURE__ */ __name((arrayBuffer, contentType) => {
  const response = new Response(arrayBuffer, {
    headers: {
      // Normalize the media type (case-insensitive) while keeping parameters like the boundary
      "Content-Type": contentType.replace(/^[^;]+/, (mediaType) => mediaType.toLowerCase())
    }
  });
  return response.formData();
}, "bufferToFormData");

// node_modules/hono/dist/utils/body.js
var MAX_NESTING_DEPTH = 32;
var MAX_NESTED_OBJECTS = 1e4;
var isRawRequest = /* @__PURE__ */ __name((request) => "headers" in request, "isRawRequest");
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const contentType = headers.get("Content-Type");
  const mediaType = contentType?.split(";")[0].trim().toLowerCase();
  if (mediaType === "multipart/form-data" || mediaType === "application/x-www-form-urlencoded") {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  if (!isRawRequest(request) && request.bodyCache.formData) {
    return convertFormDataToBodyData(
      await request.bodyCache.formData,
      options
    );
  }
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const arrayBuffer = await request.arrayBuffer();
  const formDataPromise = bufferToFormData(arrayBuffer, headers.get("Content-Type") || "");
  if (!isRawRequest(request)) {
    request.bodyCache.formData = formDataPromise;
  }
  const formData = await formDataPromise;
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  const nestingState = { count: 0 };
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value, nestingState);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value, state) => {
  if (/(?:^|\.)__proto__\./.test(key)) {
    return;
  }
  let nestedForm = form;
  const keys = key.split(".", MAX_NESTING_DEPTH + 2);
  if (keys.length > MAX_NESTING_DEPTH + 1) {
    throwNestingLimitExceeded();
  }
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        if (state.count++ >= MAX_NESTED_OBJECTS) {
          throwNestingLimitExceeded();
        }
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");
var throwNestingLimitExceeded = /* @__PURE__ */ __name(() => {
  throw new Error("Nesting limit exceeded");
}, "throwNestingLimitExceeded");

// node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (segment.charCodeAt(segment.length - 1) === 63) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.slice(0, -1);
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => str.indexOf("%") !== -1 ? tryDecode(str, decodeURIComponent_) : str, "tryDecodeURIComponent");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return tryDecodeURIComponent(value);
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  const hashIndex = url.indexOf("#", 8);
  if (hashIndex !== -1) {
    url = url.slice(0, hashIndex);
  }
  let encoded;
  if (!multiple && key && key.indexOf("%") === -1 && key.indexOf("+") === -1) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = /* @__PURE__ */ Object.create(null);
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex]?.[1][key];
    const param = this.#getParamValue(paramKey);
    return param && tryDecodeURIComponent(param);
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex]?.[1] ?? {});
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = tryDecodeURIComponent(value);
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = /* @__PURE__ */ Object.create(null);
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = /* @__PURE__ */ __name((key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    for (const anyCachedKey in bodyCache) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  }, "#cachedBody");
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * `.bytes()` parses the request body as a `Uint8Array`.
   *
   * @see {@link https://hono.dev/docs/api/request#bytes}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.bytes()
   * })
   * ```
   */
  bytes() {
    return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    ;
    (this.#validatedData ??= {})[target] = data;
  }
  valid(target) {
    return this.#validatedData?.[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var createResponseInstance = /* @__PURE__ */ __name((body, init) => new Response(body, init), "createResponseInstance");
var Context = class {
  static {
    __name(this, "Context");
  }
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = /* @__PURE__ */ __name((...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  }, "render");
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = /* @__PURE__ */ __name((renderer) => {
    this.#renderer = renderer;
  }, "setRenderer");
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   // Append multiple headers using the append option (e.g. Vary)
   *   c.header('Vary', 'Accept-Encoding', { append: true })
   *   c.header('Vary', 'User-Agent', { append: true })
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = /* @__PURE__ */ __name((name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  }, "header");
  status = /* @__PURE__ */ __name((status) => {
    this.#status = status;
  }, "status");
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = /* @__PURE__ */ __name((key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  }, "set");
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = /* @__PURE__ */ __name((key) => {
    return this.#var ? this.#var.get(key) : void 0;
  }, "get");
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    let responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders;
    if (typeof arg === "object" && arg.headers) {
      responseHeaders ??= new Headers();
      for (const [key, value] of new Headers(arg.headers)) {
        if (key === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      if (!responseHeaders) {
        let count = 0;
        for (const k in headers) {
          if (++count > 1 || typeof headers[k] !== "string") {
            responseHeaders = new Headers();
            break;
          }
        }
      }
      if (responseHeaders) {
        for (const k in headers) {
          const v = headers[k];
          if (typeof v === "string") {
            responseHeaders.set(k, v);
          } else {
            responseHeaders.delete(k);
            for (const v2 of v) {
              responseHeaders.append(k, v2);
            }
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, {
      status,
      headers: responseHeaders ?? headers
    });
  }
  newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = /* @__PURE__ */ __name((data, arg, headers) => this.#newResponse(data, arg, headers), "body");
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = /* @__PURE__ */ __name((text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  }, "text");
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = /* @__PURE__ */ __name((object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  }, "json");
  html = /* @__PURE__ */ __name((html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  }, "html");
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = /* @__PURE__ */ __name((location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  }, "redirect");
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name(() => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  }, "notFound");
};

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch", "query"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err2, c) => {
  if ("getResponse" in err2) {
    const res = err2.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err2);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = class _Hono {
  static {
    __name(this, "_Hono");
  }
  get;
  post;
  put;
  delete;
  options;
  patch;
  query;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        const methodName = method.toUpperCase();
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(methodName, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(methodName, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          const methodName = m.toUpperCase();
          for (const handler of handlers) {
            this.#addRoute(methodName, this.#path, handler);
          }
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler, r.basePath);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = /* @__PURE__ */ __name((handler) => {
    this.errorHandler = handler;
    return this;
  }, "onError");
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name((handler) => {
    this.#notFoundHandler = handler;
    return this;
  }, "notFound");
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = this.getPath(request).slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler, baseRoutePath) {
    path = mergePath(this._basePath, path);
    const r = {
      basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
      path,
      method,
      handler
    };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err2, c) {
    if (err2 instanceof Error) {
      return this.errorHandler(err2, c);
    }
    throw err2;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err2) {
        return this.#handleError(err2, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err2) => this.#handleError(err2, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err2) {
        return this.#handleError(err2, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} env - env Object
   * @param {ExecutionContext} executionCtx - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = /* @__PURE__ */ __name((request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  }, "fetch");
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = /* @__PURE__ */ __name((input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  }, "request");
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = /* @__PURE__ */ __name(() => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  }, "fire");
};

// node_modules/hono/dist/router/utils.js
var createNullObject = /* @__PURE__ */ __name(() => /* @__PURE__ */ Object.create(null), "createNullObject");

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name(((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }), "match2");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return b === TAIL_WILDCARD_REG_EXP_STR ? -1 : 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = class _Node {
  static {
    __name(this, "_Node");
  }
  // handler index of a dynamic path, or -1 for a static path terminal
  #index;
  #varIndex;
  #children = createNullObject();
  insert(tokens, index, paramMap, context, isStatic) {
    let node = this;
    for (let i = 0, len = tokens.length; i < len; i++) {
      const token = tokens[i];
      const pattern = token.length === 1 ? token === "*" ? i === len - 1 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : null : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
      let nextNode;
      if (pattern) {
        const name = pattern[1];
        let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
        if (name && pattern[2]) {
          if (regexpStr === ".*") {
            throw PATH_ERROR;
          }
          regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
          if (/\((?!\?:)/.test(regexpStr)) {
            throw PATH_ERROR;
          }
          if (regexpStr.length === 1 && regExpMetaChars.has(regexpStr)) {
            throw PATH_ERROR;
          }
        }
        nextNode = node.#children[regexpStr];
        if (!nextNode) {
          if (regexpStr !== ONLY_WILDCARD_REG_EXP_STR && regexpStr !== TAIL_WILDCARD_REG_EXP_STR) {
            for (const k in node.#children) {
              if (
                // a single-char pattern coexists with single-char literals as a literal does
                (regexpStr.length > 1 || k.length > 1) && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
              ) {
                throw PATH_ERROR;
              }
            }
          }
          nextNode = node.#children[regexpStr] = new _Node();
        }
        if (name !== "") {
          nextNode.#varIndex ??= context.varIndex++;
          paramMap.push([name, nextNode.#varIndex]);
        }
      } else {
        nextNode = node.#children[token];
        if (!nextNode) {
          for (const k in node.#children) {
            if (k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR) {
              throw PATH_ERROR;
            }
          }
          nextNode = node.#children[token] = new _Node();
        }
      }
      node = nextNode;
    }
    if (node.#index !== void 0) {
      throw PATH_ERROR;
    }
    node.#index = isStatic ? -1 : index;
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      const childStr = c.buildRegExpStr();
      return childStr === "" ? "" : (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + childStr;
    }).filter(Boolean);
    if (typeof this.#index === "number" && this.#index !== -1) {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  static {
    __name(this, "Trie");
  }
  #context = { varIndex: 0 };
  #root = new Node();
  #index = 0;
  // dynamic path -> [handler index, param assoc]; static paths are not registered
  paths = createNullObject();
  insert(path, isStatic) {
    if (isStatic) {
      this.#root.insert(path.split(""), 0, [], this.#context, true);
      return;
    }
    const paramAssoc = [];
    const groups = [];
    let markedPath = path;
    for (let i = 0; ; ) {
      let replaced = false;
      markedPath = markedPath.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = markedPath.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, this.#index, paramAssoc, this.#context, false);
    this.paths[path] = [this.#index++, paramAssoc];
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var wildcardRegExpCache = createNullObject();
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    `^${path.replace(
      /\/:[^/{}]+(?:\{\[\^\/]\+})?(?=[/{]|$)|\/?\*$|([.\\+*[^\]$()?{}|])/g,
      (match2, metaChar) => metaChar ? `\\${metaChar}` : match2 === "/*" ? TAIL_WILDCARD_REG_EXP_STR : match2 === "*" ? ONLY_WILDCARD_REG_EXP_STR : `/:${LABEL_REG_EXP_STR}`
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function findMiddleware(middleware, path) {
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
  name = "RegExpRouter";
  #middleware;
  #routes;
  #tries;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: createNullObject() };
    this.#routes = { [METHOD_NAME_ALL]: createNullObject() };
    this.#tries = { [METHOD_NAME_ALL]: new Trie() };
  }
  #insertPath(method, path) {
    try {
      this.#tries[method].insert(path, !/\*|\/:/.test(path));
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      this.#tries[method] = new Trie();
      for (const handlerMap of [middleware, routes]) {
        handlerMap[method] = createNullObject();
        for (const p in handlerMap[METHOD_NAME_ALL]) {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
          this.#insertPath(method, p);
        }
      }
    }
    if (path === "/*") {
      path = "*";
    }
    const methods = method === METHOD_NAME_ALL ? Object.keys(middleware) : [method];
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      for (const m of methods) {
        if (!middleware[m][path]) {
          this.#insertPath(m, path);
          middleware[m][path] = findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        }
      }
      for (const handlerMap of [middleware, routes]) {
        for (const m of methods) {
          for (const p in handlerMap[m]) {
            re.test(p) && handlerMap[m][p].push([handler, path]);
          }
        }
      }
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (const path2 of paths) {
      for (const m of methods) {
        if (!routes[m][path2]) {
          this.#insertPath(m, path2);
          routes[m][path2] = findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || [];
        }
        routes[m][path2].push([handler, path2]);
      }
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = createNullObject();
    for (const method of Object.keys(this.#routes)) {
      matchers[method] = this.#buildMatcher(method);
    }
    this.#middleware = this.#routes = this.#tries = void 0;
    wildcardRegExpCache = createNullObject();
    return matchers;
  }
  #buildMatcher(method) {
    const middleware = this.#middleware[method];
    const routes = this.#routes[method];
    const trie = this.#tries[method];
    const staticMap = createNullObject();
    const handlerData = [];
    const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
    for (const r of [middleware, routes]) {
      for (const path in r) {
        const handlers = r[path];
        const pathData = trie.paths[path];
        if (!pathData) {
          staticMap[path] = [handlers.map(([h]) => [h, createNullObject()]), emptyParam];
          continue;
        }
        handlerData[pathData[0]] = handlers.map(([h, handlerPath]) => [
          h,
          trie.paths[handlerPath][1].reduceRight((map, [key], i) => {
            map[key] = paramReplacementMap[pathData[1][i][1]];
            return map;
          }, createNullObject())
        ]);
      }
    }
    return [regexp, indexReplacementMap.map((i) => handlerData[i]), staticMap];
  }
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = createNullObject();
var order = 0;
var Node2 = class _Node2 {
  static {
    __name(this, "_Node");
  }
  #methods = [];
  #children = createNullObject();
  #patterns = [];
  #pattern;
  #params = emptyParams;
  insert(method, path, handler) {
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = /* @__PURE__ */ new Set();
    let i = 0;
    for (const p of parts) {
      const nextP = parts[++i];
      const pattern = getPattern(p, nextP) || (nextP === void 0 && p && p.indexOf("*") === p.length - 1 ? p : null);
      const isParam = Array.isArray(pattern);
      const key = isParam ? pattern[0] : pattern || p;
      const child = curNode.#children[key] ||= new _Node2();
      if (pattern && !child.#pattern) {
        child.#pattern = pattern;
        curNode.#patterns.push(child);
      }
      curNode = child;
      if (isParam) {
        possibleKeys.add(pattern[1]);
      }
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: [...possibleKeys],
        score: ++order
      }
    });
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      if (handlerSet) {
        handlerSet.params = createNullObject();
        handlerSets.push(handlerSet);
        for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
          const key = handlerSet.possibleKeys[i2];
          handlerSet.params[key] = params?.[key] && !i2 ? params[key] : nodeParams[key] ?? params?.[key];
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (const child of node.#patterns) {
          const pattern = child.#pattern;
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (typeof pattern === "string") {
            if (pattern === "*" || part.startsWith(pattern.slice(0, -1))) {
              this.#pushHandlerSets(handlerSets, child, method, node.#params);
              if (pattern === "*") {
                child.#params = params;
                tempNodes.push(child);
              }
            }
            continue;
          }
          const [, name, matcher] = pattern;
          if (!part && matcher === true) {
            continue;
          }
          if (matcher !== true) {
            if (!partOffsets) {
              partOffsets = [];
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.slice(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (m[0].length === restPathString.length && child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  node.#params,
                  params
                );
              }
              for (const _ in child.#children) {
                child.#params = params;
                const componentCount = m[0].match(/\//g)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
                break;
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets[1]) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
  name = "TrieRouter";
  #node = new Node2();
  add(method, path, handler) {
    for (const result of checkOptionalParameter(path) || [path]) {
      this.#node.insert(method, result, handler);
    }
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  static {
    __name(this, "Hono");
  }
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// src/types.ts
function num(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
__name(num, "num");

// src/util.ts
var EXPIRY_MS = {
  "1d": 864e5,
  "7d": 7 * 864e5,
  "30d": 30 * 864e5
};
function parseExpiry(v) {
  if (v === "forever") return null;
  if (typeof v === "string" && v in EXPIRY_MS) return EXPIRY_MS[v];
  return void 0;
}
__name(parseExpiry, "parseExpiry");
function parseMaxPickups(v) {
  if (v === null || v === void 0) return null;
  if (typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 999) return v;
  return void 0;
}
__name(parseMaxPickups, "parseMaxPickups");
function err(c, status, code, message) {
  return c.json({ error: code, message }, status);
}
__name(err, "err");
function contentDisposition(name) {
  const fallback = name.replace(/[^\x20-\x7e]/g, "").replace(/["\\]/g, "_").trim() || "file";
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}
__name(contentDisposition, "contentDisposition");

// src/code.ts
var CODE_SPACE = 1e6;
var RAND_LIMIT = Math.floor(4294967296 / CODE_SPACE) * CODE_SPACE;
function randCode() {
  const buf = new Uint32Array(1);
  for (; ; ) {
    crypto.getRandomValues(buf);
    if (buf[0] < RAND_LIMIT) return String(buf[0] % CODE_SPACE).padStart(6, "0");
  }
}
__name(randCode, "randCode");
function isUniqueViolation(e) {
  return e instanceof Error && e.message.includes("UNIQUE constraint failed");
}
__name(isUniqueViolation, "isUniqueViolation");

// src/store-d1.ts
var MAX_CODE_RETRIES = 8;
var SHARE_COLUMNS = "id, code, kind, filename, size, mime, r2_key, text, max_pickups, pickup_count, created_at, expire_at";
var toRec = /* @__PURE__ */ __name((r) => ({
  id: r.id,
  code: r.code,
  kind: r.kind,
  filename: r.filename,
  size: r.size,
  mime: r.mime,
  r2Key: r.r2_key,
  text: r.text,
  maxPickups: r.max_pickups,
  pickupCount: r.pickup_count,
  createdAt: r.created_at,
  expireAt: r.expire_at
}), "toRec");
var toSession = /* @__PURE__ */ __name((r) => ({
  id: r.id,
  uploadId: r.upload_id,
  r2Key: r.r2_key,
  filename: r.filename,
  mime: r.mime,
  size: r.size,
  parts: r.parts,
  expiry: r.expiry,
  maxPickups: r.max_pickups,
  createdAt: r.created_at
}), "toSession");
function insertShareStmt(db, id, code, s, now) {
  return db.prepare(
    `INSERT INTO shares
        (id, code, kind, filename, size, mime, r2_key, text, max_pickups, pickup_count, created_at, expire_at)
       VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,0,?10,?11)`
  ).bind(
    id,
    code,
    s.kind,
    s.filename ?? null,
    s.size,
    s.mime ?? null,
    s.r2Key ?? null,
    s.text ?? null,
    s.maxPickups,
    now,
    s.expireAt
  );
}
__name(insertShareStmt, "insertShareStmt");
function createD1Store(db) {
  return {
    async createShare(s, closeSessionId) {
      const now = Date.now();
      for (let i = 0; i < MAX_CODE_RETRIES; i++) {
        const id = crypto.randomUUID();
        const code = randCode();
        try {
          if (closeSessionId) {
            await db.batch([
              insertShareStmt(db, id, code, s, now),
              db.prepare("DELETE FROM upload_sessions WHERE id = ?1").bind(closeSessionId)
            ]);
          } else {
            await insertShareStmt(db, id, code, s, now).run();
          }
          return { id, code };
        } catch (e) {
          if (isUniqueViolation(e)) continue;
          throw e;
        }
      }
      throw new Error("code-space-exhausted");
    },
    async getByCode(code) {
      const r = await db.prepare(`SELECT ${SHARE_COLUMNS} FROM shares WHERE code = ?1`).bind(code).first();
      return r ? toRec(r) : null;
    },
    /** 原子取件计数:0 行 = 不存在/失效/textOnly 撞上文件,交回调用方分类 */
    async tryPickup(code, opts) {
      const kindCond = opts?.textOnly ? `AND kind = 'text'` : "";
      const r = await db.prepare(
        `UPDATE shares SET pickup_count = pickup_count + 1
             WHERE code = ?1 ${kindCond}
               AND (expire_at IS NULL OR expire_at > ?2)
               AND (max_pickups IS NULL OR pickup_count < max_pickups)
             RETURNING ${SHARE_COLUMNS}`
      ).bind(code, Date.now()).first();
      return r ? toRec(r) : null;
    },
    async listShares(limit, offset) {
      const total = (await db.prepare("SELECT COUNT(*) AS n FROM shares").first())?.n ?? 0;
      const rows = await db.prepare(
        `SELECT id, code, kind, filename, size, pickup_count, max_pickups, expire_at, created_at,
                  CASE WHEN kind = 'text' THEN substr(text, 1, 50) ELSE NULL END AS text_preview
           FROM shares ORDER BY created_at DESC LIMIT ?1 OFFSET ?2`
      ).bind(limit, offset).all();
      return {
        total,
        rows: (rows.results ?? []).map((r) => ({
          id: r.id,
          code: r.code,
          kind: r.kind,
          filename: r.filename,
          size: r.size,
          pickupCount: r.pickup_count,
          maxPickups: r.max_pickups,
          expireAt: r.expire_at,
          createdAt: r.created_at,
          textPreview: r.text_preview
        }))
      };
    },
    async stats(todayStart) {
      const now = Date.now();
      const s = await db.prepare(
        `SELECT COUNT(*) AS total,
                  COALESCE(SUM(CASE WHEN kind='file' THEN 1 ELSE 0 END), 0) AS files,
                  COALESCE(SUM(CASE WHEN kind='text' THEN 1 ELSE 0 END), 0) AS texts,
                  COALESCE(SUM(size), 0) AS totalBytes,
                  SUM(CASE WHEN (expire_at IS NULL OR expire_at > ?1)
                            AND (max_pickups IS NULL OR pickup_count < max_pickups)
                           THEN 1 ELSE 0 END) AS active
           FROM shares`
      ).bind(now).first();
      const t = await db.prepare("SELECT COUNT(*) AS n FROM shares WHERE created_at >= ?1").bind(todayStart).first();
      return {
        total: s?.total ?? 0,
        files: s?.files ?? 0,
        texts: s?.texts ?? 0,
        totalBytes: s?.totalBytes ?? 0,
        active: s?.active ?? 0,
        todayCreated: t?.n ?? 0
      };
    },
    async deleteByCode(code) {
      await db.prepare("DELETE FROM shares WHERE code = ?1").bind(code).run();
    },
    async createSession(s) {
      await db.prepare(
        `INSERT INTO upload_sessions (id, upload_id, r2_key, filename, mime, size, parts, expiry, max_pickups, created_at)
           VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)`
      ).bind(s.id, s.uploadId, s.r2Key, s.filename, s.mime, s.size, s.parts, s.expiry, s.maxPickups, s.createdAt).run();
    },
    async getSession(id) {
      const r = await db.prepare("SELECT * FROM upload_sessions WHERE id = ?1").bind(id).first();
      return r ? toSession(r) : null;
    },
    async deleteSession(id) {
      await db.prepare("DELETE FROM upload_sessions WHERE id = ?1").bind(id).run();
    },
    async listExpiredShares(now, limit) {
      const rows = await db.prepare("SELECT code, kind, r2_key FROM shares WHERE expire_at IS NOT NULL AND expire_at <= ?1 LIMIT ?2").bind(now, limit).all();
      return (rows.results ?? []).map((r) => ({ code: r.code, r2Key: r.kind === "file" ? r.r2_key : null }));
    },
    async deleteByCodes(codes) {
      if (codes.length === 0) return;
      await db.batch(codes.map((code) => db.prepare("DELETE FROM shares WHERE code = ?1").bind(code)));
    },
    async listStaleSessions(now, ttlMs) {
      const rows = await db.prepare("SELECT * FROM upload_sessions WHERE created_at < ?1").bind(now - ttlMs).all();
      return (rows.results ?? []).map(toSession);
    }
  };
}
__name(createD1Store, "createD1Store");

// src/store-kv.ts
var SHARE_PREFIX = "s:";
var SESSION_PREFIX = "u:";
var MAX_CODE_RETRIES2 = 8;
function b64encode(s) {
  return btoa(String.fromCharCode(...new TextEncoder().encode(s)));
}
__name(b64encode, "b64encode");
function b64decode(s) {
  try {
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(s)) return s;
    return new TextDecoder().decode(Uint8Array.from(atob(s), (ch) => ch.charCodeAt(0)));
  } catch {
    return s;
  }
}
__name(b64decode, "b64decode");
function metaOf(v) {
  return {
    id: v.id,
    k: v.kind,
    n: v.filename ? b64encode(v.filename.slice(0, 40)) : null,
    s: v.size,
    t: v.createdAt,
    e: v.expireAt,
    c: v.pickupCount,
    m: v.maxPickups,
    r: v.kind === "file" ? v.r2Key : null,
    p: v.kind === "text" && v.text ? b64encode(v.text.slice(0, 32)) : null
  };
}
__name(metaOf, "metaOf");
async function scanShareMeta(kv) {
  const out = [];
  let cursor;
  do {
    const page = await kv.list({ prefix: SHARE_PREFIX, cursor });
    for (const key of page.keys) {
      const m = key.metadata;
      if (m) out.push({ code: key.name.slice(SHARE_PREFIX.length), m });
    }
    cursor = page.list_complete ? void 0 : page.cursor;
  } while (cursor);
  return out;
}
__name(scanShareMeta, "scanShareMeta");
function createKVStore(kv) {
  return {
    async createShare(s, closeSessionId) {
      for (let i = 0; i < MAX_CODE_RETRIES2; i++) {
        const code = randCode();
        if (await kv.get(SHARE_PREFIX + code) !== null) continue;
        const rec = {
          id: crypto.randomUUID(),
          code,
          kind: s.kind,
          filename: s.filename ?? null,
          size: s.size,
          mime: s.mime ?? null,
          r2Key: s.r2Key ?? null,
          text: s.text ?? null,
          maxPickups: s.maxPickups,
          pickupCount: 0,
          createdAt: Date.now(),
          expireAt: s.expireAt
        };
        await kv.put(SHARE_PREFIX + code, JSON.stringify(rec), { metadata: metaOf(rec) });
        if (closeSessionId) await kv.delete(SESSION_PREFIX + closeSessionId);
        return { id: rec.id, code };
      }
      throw new Error("code-space-exhausted");
    },
    async getByCode(code) {
      return kv.get(SHARE_PREFIX + code, "json");
    },
    async tryPickup(code, opts) {
      const v = await kv.get(SHARE_PREFIX + code, "json");
      if (!v) return null;
      if (opts?.textOnly && v.kind !== "text") return null;
      const now = Date.now();
      if (v.expireAt !== null && v.expireAt <= now) return null;
      if (v.maxPickups !== null && v.pickupCount >= v.maxPickups) return null;
      v.pickupCount++;
      await kv.put(SHARE_PREFIX + code, JSON.stringify(v), { metadata: metaOf(v) });
      return v;
    },
    async listShares(limit, offset) {
      const all = (await scanShareMeta(kv)).sort((a, b) => b.m.t - a.m.t);
      const rows = all.slice(offset, offset + limit).map(({ code, m }) => ({
        id: m.id,
        code,
        kind: m.k,
        filename: m.n ? b64decode(m.n) : null,
        size: m.s,
        pickupCount: m.c,
        maxPickups: m.m,
        expireAt: m.e,
        createdAt: m.t,
        textPreview: m.p ? b64decode(m.p) : null
      }));
      return { total: all.length, rows };
    },
    async stats(todayStart) {
      const now = Date.now();
      const stats = { total: 0, files: 0, texts: 0, totalBytes: 0, active: 0, todayCreated: 0 };
      for (const { m } of await scanShareMeta(kv)) {
        stats.total++;
        if (m.k === "file") stats.files++;
        else stats.texts++;
        stats.totalBytes += m.s;
        if ((m.e === null || m.e > now) && (m.m === null || m.c < m.m)) stats.active++;
        if (m.t >= todayStart) stats.todayCreated++;
      }
      return stats;
    },
    async deleteByCode(code) {
      await kv.delete(SHARE_PREFIX + code);
    },
    async createSession(s) {
      await kv.put(SESSION_PREFIX + s.id, JSON.stringify(s), { metadata: { t: s.createdAt } });
    },
    async getSession(id) {
      return kv.get(SESSION_PREFIX + id, "json");
    },
    async deleteSession(id) {
      await kv.delete(SESSION_PREFIX + id);
    },
    async listExpiredShares(now, limit) {
      const all = await scanShareMeta(kv);
      return all.filter(({ m }) => m.e !== null && m.e <= now).slice(0, limit).map(({ code, m }) => ({ code, r2Key: m.k === "file" ? m.r : null }));
    },
    async deleteByCodes(codes) {
      await Promise.all(codes.map((code) => kv.delete(SHARE_PREFIX + code)));
    },
    async listStaleSessions(now, ttlMs) {
      const cutoff = now - ttlMs;
      const out = [];
      let cursor;
      do {
        const page = await kv.list({ prefix: SESSION_PREFIX, cursor });
        for (const key of page.keys) {
          const t = key.metadata?.t;
          if (typeof t === "number" && t < cutoff) {
            const s = await kv.get(key.name, "json");
            if (s) out.push(s);
          }
        }
        cursor = page.list_complete ? void 0 : page.cursor;
      } while (cursor);
      return out;
    }
  };
}
__name(createKVStore, "createKVStore");

// src/store.ts
function shareStatusOf(expireAt, maxPickups, pickupCount, now) {
  if (expireAt !== null && expireAt <= now) return "expired";
  if (maxPickups !== null && pickupCount >= maxPickups) return "exhausted";
  return "active";
}
__name(shareStatusOf, "shareStatusOf");
function getStore(env) {
  if (env.fileKV) return createKVStore(env.fileKV);
  if (env.DB) return createD1Store(env.DB);
  throw new Error("\u672A\u7ED1\u5B9A KV \u6216 D1:\u8BF7\u5728 wrangler.jsonc \u914D\u7F6E\u4E8C\u9009\u4E00\u7684\u5143\u6570\u636E\u5E93");
}
__name(getStore, "getStore");

// src/filestore.ts
var KV_FILE_PREFIX = "f:";
var KV_FILE_MAX = 24 * 1024 * 1024;
function fileMode(env) {
  if (env.BUCKET) return "r2";
  if (env.fileKV) return "kv";
  return null;
}
__name(fileMode, "fileMode");
function isKvFileKey(key) {
  return key.startsWith(KV_FILE_PREFIX);
}
__name(isKvFileKey, "isKvFileKey");
function fileMaxSize(env) {
  const configured = num(env.MAX_FILE_SIZE, 2 * 1024 ** 3);
  return fileMode(env) === "kv" ? Math.min(configured, KV_FILE_MAX) : configured;
}
__name(fileMaxSize, "fileMaxSize");
async function putFileBytes(env, key, bytes) {
  await env.fileKV.put(key, bytes);
}
__name(putFileBytes, "putFileBytes");
async function readFileStream(env, key) {
  if (isKvFileKey(key)) {
    if (!env.fileKV) return null;
    return env.fileKV.get(key, "stream");
  }
  if (!env.BUCKET) return null;
  const obj = await env.BUCKET.get(key);
  return obj?.body ?? null;
}
__name(readFileStream, "readFileStream");
async function deleteFile(env, key) {
  if (!key) return;
  if (isKvFileKey(key)) {
    if (env.fileKV) await env.fileKV.delete(key);
    return;
  }
  if (env.BUCKET) await env.BUCKET.delete(key);
}
__name(deleteFile, "deleteFile");

// src/upload.ts
var uploadRoutes = new Hono2();
uploadRoutes.use("*", async (c, next) => {
  if (fileMode(c.env) !== "r2") {
    return err(c, 400, "config", "\u5F53\u524D\u4E3A\u5C0F\u5B58\u50A8\u6A21\u5F0F(KV),\u8BF7\u4F7F\u7528\u76F4\u4F20\u63A5\u53E3 /api/shares/file");
  }
  await next();
});
uploadRoutes.post("/init", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) return err(c, 400, "bad_request", "\u8BF7\u6C42\u4F53\u5FC5\u987B\u662F JSON");
  const { filename, size, mime: mime2, expiry, maxPickups } = body;
  const maxSize = num(c.env.MAX_FILE_SIZE, 2 * 1024 ** 3);
  const partSize = num(c.env.PART_SIZE, 10 * 1024 ** 2);
  const maxParts = num(c.env.MAX_PARTS, 1e4);
  if (typeof filename !== "string" || !filename.trim()) return err(c, 400, "bad_request", "\u6587\u4EF6\u540D\u4E0D\u80FD\u4E3A\u7A7A");
  if (typeof size !== "number" || !Number.isInteger(size) || size < 1) return err(c, 400, "bad_request", "\u6587\u4EF6\u5927\u5C0F\u975E\u6CD5");
  if (size > maxSize) {
    const limit = maxSize >= 1024 ** 3 ? `${Math.floor(maxSize / 1024 ** 3)} GB` : `${Math.floor(maxSize / 1024 ** 2)} MB`;
    return err(c, 413, "too_large", `\u6587\u4EF6\u8D85\u8FC7\u4E0A\u9650 ${limit}`);
  }
  const expMs = parseExpiry(expiry);
  if (expMs === void 0) return err(c, 400, "bad_request", "\u6709\u6548\u671F\u53C2\u6570\u975E\u6CD5");
  const mp = parseMaxPickups(maxPickups);
  if (mp === void 0) return err(c, 400, "bad_request", "\u53D6\u4EF6\u6B21\u6570\u53C2\u6570\u975E\u6CD5");
  const parts = Math.ceil(size / partSize);
  if (parts > maxParts) return err(c, 413, "too_large", "\u6587\u4EF6\u8FC7\u5927(\u5206\u7247\u6570\u8D85\u9650)");
  const contentType = typeof mime2 === "string" && mime2 ? mime2 : "application/octet-stream";
  const id = crypto.randomUUID();
  const r2Key = crypto.randomUUID();
  const mpu = await c.env.BUCKET.createMultipartUpload(r2Key, {
    httpMetadata: { contentType }
  });
  await getStore(c.env).createSession({
    id,
    uploadId: mpu.uploadId,
    r2Key,
    filename: filename.slice(0, 255),
    mime: contentType,
    size,
    parts,
    expiry: typeof expiry === "string" ? expiry : null,
    maxPickups: mp,
    createdAt: Date.now()
  });
  return c.json({ uploadId: id, partSize, parts, size });
});
uploadRoutes.put("/:id/parts/:n", async (c) => {
  const id = c.req.param("id");
  const n = Number(c.req.param("n"));
  const sess = await getStore(c.env).getSession(id);
  if (!sess) return err(c, 404, "not_found", "\u4E0A\u4F20\u4F1A\u8BDD\u4E0D\u5B58\u5728\u6216\u5DF2\u8FC7\u671F");
  if (!Number.isInteger(n) || n < 1 || n > sess.parts) return err(c, 400, "bad_request", "\u5206\u7247\u5E8F\u53F7\u975E\u6CD5");
  const partSize = num(c.env.PART_SIZE, 10 * 1024 ** 2);
  const contentLength = Number(c.req.raw.headers.get("content-length") || 0);
  if (contentLength && contentLength > partSize) return err(c, 400, "bad_request", "\u5206\u7247\u8FC7\u5927");
  const body = c.req.raw.body;
  if (!body) return err(c, 400, "bad_request", "\u8BF7\u6C42\u4F53\u4E3A\u7A7A");
  try {
    const mpu = c.env.BUCKET.resumeMultipartUpload(sess.r2Key, sess.uploadId);
    const part = await mpu.uploadPart(n, body);
    return c.json({ partNumber: part.partNumber, etag: part.etag });
  } catch {
    return err(c, 500, "internal", "\u5206\u7247\u5199\u5165\u5931\u8D25,\u8BF7\u91CD\u8BD5");
  }
});
uploadRoutes.post("/:id/complete", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const store = getStore(c.env);
  const sess = await store.getSession(id);
  if (!sess) return err(c, 404, "not_found", "\u4E0A\u4F20\u4F1A\u8BDD\u4E0D\u5B58\u5728\u6216\u5DF2\u8FC7\u671F");
  const parts = body?.parts;
  if (!Array.isArray(parts) || parts.length !== sess.parts) return err(c, 400, "bad_request", "\u5206\u7247\u5217\u8868\u4E0D\u5B8C\u6574");
  const seen = /* @__PURE__ */ new Set();
  const r2parts = [];
  for (const p of parts) {
    const rec = p;
    if (!rec || typeof rec.partNumber !== "number" || typeof rec.etag !== "string") {
      return err(c, 400, "bad_request", "\u5206\u7247\u5217\u8868\u683C\u5F0F\u975E\u6CD5");
    }
    if (!Number.isInteger(rec.partNumber) || rec.partNumber < 1 || rec.partNumber > sess.parts || seen.has(rec.partNumber)) {
      return err(c, 400, "bad_request", "\u5206\u7247\u5E8F\u53F7\u975E\u6CD5");
    }
    seen.add(rec.partNumber);
    r2parts.push({ partNumber: rec.partNumber, etag: rec.etag });
  }
  let obj;
  try {
    const mpu = c.env.BUCKET.resumeMultipartUpload(sess.r2Key, sess.uploadId);
    obj = await mpu.complete(r2parts);
  } catch {
    return err(c, 400, "bad_request", "\u5408\u5E76\u5206\u7247\u5931\u8D25,\u8BF7\u91CD\u8BD5");
  }
  if (obj.size !== sess.size) {
    await c.env.BUCKET.delete(sess.r2Key);
    await store.deleteSession(id);
    return err(c, 400, "bad_request", "\u6587\u4EF6\u5927\u5C0F\u6821\u9A8C\u5931\u8D25");
  }
  const parsed = parseExpiry(sess.expiry);
  const expMs = parsed === void 0 ? 7 * 864e5 : parsed;
  const expireAt = expMs === null ? null : Date.now() + expMs;
  const created = await store.createShare(
    {
      kind: "file",
      filename: sess.filename,
      size: sess.size,
      mime: sess.mime,
      r2Key: sess.r2Key,
      maxPickups: sess.maxPickups,
      expireAt
    },
    id
  );
  return c.json({
    code: created.code,
    kind: "file",
    size: sess.size,
    expireAt,
    maxPickups: sess.maxPickups,
    pickupUrl: `/pickup?code=${created.code}`
  });
});
uploadRoutes.post("/:id/abort", async (c) => {
  const store = getStore(c.env);
  const sess = await store.getSession(c.req.param("id"));
  if (sess) {
    try {
      await c.env.BUCKET.resumeMultipartUpload(sess.r2Key, sess.uploadId).abort();
    } catch {
    }
    await store.deleteSession(sess.id);
  }
  return c.json({ ok: true });
});

// src/share.ts
var shareRoutes = new Hono2();
shareRoutes.post("/shares/text", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) return err(c, 400, "bad_request", "\u8BF7\u6C42\u4F53\u5FC5\u987B\u662F JSON");
  const text = body.text;
  const maxLen = num(c.env.MAX_TEXT_LENGTH, 65536);
  if (typeof text !== "string" || !text.trim()) return err(c, 400, "bad_request", "\u6587\u672C\u5185\u5BB9\u4E0D\u80FD\u4E3A\u7A7A");
  if (text.length > maxLen) return err(c, 400, "bad_request", `\u6587\u672C\u8D85\u8FC7\u4E0A\u9650 ${maxLen} \u5B57\u7B26`);
  const expMs = parseExpiry(body.expiry);
  if (expMs === void 0) return err(c, 400, "bad_request", "\u6709\u6548\u671F\u53C2\u6570\u975E\u6CD5");
  const mp = parseMaxPickups(body.maxPickups);
  if (mp === void 0) return err(c, 400, "bad_request", "\u53D6\u4EF6\u6B21\u6570\u53C2\u6570\u975E\u6CD5");
  const now = Date.now();
  const expireAt = expMs === null ? null : now + expMs;
  const created = await getStore(c.env).createShare({
    kind: "text",
    size: text.length,
    text,
    maxPickups: mp,
    expireAt
  });
  return c.json(
    {
      code: created.code,
      kind: "text",
      size: text.length,
      expireAt,
      maxPickups: mp,
      pickupUrl: `/pickup?code=${created.code}`
    },
    201
  );
});
shareRoutes.post("/shares/file", async (c) => {
  if (fileMode(c.env) !== "kv") {
    return err(c, 400, "config", "\u5F53\u524D\u4E3A R2 \u5927\u5B58\u50A8\u6A21\u5F0F,\u8BF7\u4F7F\u7528\u5206\u7247\u4E0A\u4F20(/api/uploads/init)");
  }
  const filename = c.req.query("filename")?.trim();
  if (!filename) return err(c, 400, "bad_request", "\u7F3A\u5C11 filename \u67E5\u8BE2\u53C2\u6570");
  const expMs = parseExpiry(c.req.query("expiry"));
  if (expMs === void 0) return err(c, 400, "bad_request", "\u6709\u6548\u671F\u53C2\u6570\u975E\u6CD5");
  const pkRaw = c.req.query("maxPickups");
  const mp = parseMaxPickups(pkRaw === void 0 || pkRaw === "" ? null : Number(pkRaw));
  if (mp === void 0) return err(c, 400, "bad_request", "\u53D6\u4EF6\u6B21\u6570\u53C2\u6570\u975E\u6CD5");
  const maxSize = fileMaxSize(c.env);
  const declared = Number(c.req.raw.headers.get("content-length") || 0);
  if (declared && declared > maxSize) {
    return err(c, 413, "too_large", `\u6587\u4EF6\u8D85\u8FC7\u4E0A\u9650 ${Math.floor(maxSize / 1024 / 1024)} MB`);
  }
  const bytes = await c.req.arrayBuffer();
  if (bytes.byteLength < 1) return err(c, 400, "bad_request", "\u6587\u4EF6\u5185\u5BB9\u4E3A\u7A7A");
  if (bytes.byteLength > maxSize) {
    return err(c, 413, "too_large", `\u6587\u4EF6\u8D85\u8FC7\u4E0A\u9650 ${Math.floor(maxSize / 1024 / 1024)} MB`);
  }
  const mime2 = c.req.query("mime")?.trim() || c.req.header("Content-Type")?.split(";")[0] || "application/octet-stream";
  const storageKey = KV_FILE_PREFIX + crypto.randomUUID();
  const expireAt = expMs === null ? null : Date.now() + expMs;
  await putFileBytes(c.env, storageKey, bytes);
  try {
    const created = await getStore(c.env).createShare({
      kind: "file",
      filename: filename.slice(0, 255),
      size: bytes.byteLength,
      mime: mime2,
      r2Key: storageKey,
      maxPickups: mp,
      expireAt
    });
    return c.json(
      {
        code: created.code,
        kind: "file",
        size: bytes.byteLength,
        expireAt,
        maxPickups: mp,
        pickupUrl: `/pickup?code=${created.code}`
      },
      201
    );
  } catch (e) {
    await deleteFile(c.env, storageKey);
    throw e;
  }
});
shareRoutes.post("/pickup", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const code = String(body?.code ?? "").trim();
  if (!/^\d{6}$/.test(code)) return err(c, 400, "bad_request", "\u8BF7\u8F93\u5165 6 \u4F4D\u53D6\u4EF6\u53E3\u4EE4");
  const store = getStore(c.env);
  const now = Date.now();
  const picked = await store.tryPickup(code, { textOnly: true });
  if (picked) {
    return c.json({
      kind: "text",
      text: picked.text,
      size: picked.size,
      expireAt: picked.expireAt,
      pickupsLeft: picked.maxPickups === null ? null : Math.max(0, picked.maxPickups - picked.pickupCount)
    });
  }
  const row = await store.getByCode(code);
  if (!row) return err(c, 404, "not_found", "\u53E3\u4EE4\u4E0D\u5B58\u5728");
  const st = shareStatusOf(row.expireAt, row.maxPickups, row.pickupCount, now);
  if (st === "expired") return err(c, 410, "expired", "\u5206\u4EAB\u5DF2\u8FC7\u671F");
  if (st === "exhausted") return err(c, 410, "exhausted", "\u53D6\u4EF6\u6B21\u6570\u5DF2\u7528\u5B8C");
  return c.json({
    kind: "file",
    filename: row.filename,
    size: row.size,
    mime: row.mime,
    expireAt: row.expireAt,
    pickupsLeft: row.maxPickups === null ? null : Math.max(0, row.maxPickups - row.pickupCount),
    downloadUrl: `/api/pickup/${code}/download`
  });
});
function downloadError(c, status, code, message) {
  if ((c.req.header("Accept") || "").includes("text/html")) {
    return c.html(
      `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>\u53D6\u4EF6\u5931\u8D25</title></head><body style="font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;background:#f6f7fb;color:#1a1d27;margin:0"><div style="text-align:center"><p style="font-size:18px;margin:0 0 12px">${message}</p><a href="/pickup" style="color:#4f6ef7">\u8FD4\u56DE\u53D6\u4EF6\u9875</a></div></body></html>`,
      status
    );
  }
  return c.json({ error: code, message }, status);
}
__name(downloadError, "downloadError");
shareRoutes.get("/pickup/:code/download", async (c) => {
  const code = c.req.param("code");
  const store = getStore(c.env);
  const now = Date.now();
  const row = await store.tryPickup(code);
  if (!row || row.kind !== "file" || !row.r2Key) {
    const raw2 = await store.getByCode(code);
    if (!raw2) return downloadError(c, 404, "not_found", "\u53E3\u4EE4\u4E0D\u5B58\u5728");
    const st = shareStatusOf(raw2.expireAt, raw2.maxPickups, raw2.pickupCount, now);
    if (st === "expired") return downloadError(c, 410, "expired", "\u5206\u4EAB\u5DF2\u8FC7\u671F");
    if (st === "exhausted") return downloadError(c, 410, "exhausted", "\u53D6\u4EF6\u6B21\u6570\u5DF2\u7528\u5B8C");
    return downloadError(c, 410, "gone", "\u6587\u4EF6\u4E0D\u5B58\u5728");
  }
  const body = await readFileStream(c.env, row.r2Key);
  if (!body) return downloadError(c, 410, "gone", "\u6587\u4EF6\u5DF2\u88AB\u6E05\u7406");
  return c.body(body, 200, {
    "Content-Type": row.mime || "application/octet-stream",
    "Content-Length": String(row.size),
    "Content-Disposition": contentDisposition(row.filename || "file"),
    "Cache-Control": "no-store"
  });
});

// node_modules/hono/dist/utils/cookie.js
var validCookieNameRegEx = /^[\w!#$%&'*.^`|~+-]+$/;
var relaxedCookieNameRegEx = /^[!#-:<>-[\]-~]+$/;
var validCookieValueRegEx = /^[ !#-:<-[\]-~]*$/;
var trimCookieWhitespace = /* @__PURE__ */ __name((value) => {
  let start = 0;
  let end = value.length;
  while (start < end) {
    const charCode = value.charCodeAt(start);
    if (charCode !== 32 && charCode !== 9) {
      break;
    }
    start++;
  }
  while (end > start) {
    const charCode = value.charCodeAt(end - 1);
    if (charCode !== 32 && charCode !== 9) {
      break;
    }
    end--;
  }
  return start === 0 && end === value.length ? value : value.slice(start, end);
}, "trimCookieWhitespace");
var parse = /* @__PURE__ */ __name((cookie, name) => {
  if (name && cookie.indexOf(name) === -1) {
    return {};
  }
  const pairs = cookie.split(";");
  const parsedCookie = /* @__PURE__ */ Object.create(null);
  for (const pairStr of pairs) {
    const valueStartPos = pairStr.indexOf("=");
    if (valueStartPos === -1) {
      continue;
    }
    const cookieName = trimCookieWhitespace(pairStr.substring(0, valueStartPos));
    if (name && name !== cookieName || !relaxedCookieNameRegEx.test(cookieName) || cookieName in parsedCookie) {
      continue;
    }
    let cookieValue = trimCookieWhitespace(pairStr.substring(valueStartPos + 1));
    if (cookieValue.startsWith('"') && cookieValue.endsWith('"')) {
      cookieValue = cookieValue.slice(1, -1);
    }
    if (validCookieValueRegEx.test(cookieValue)) {
      parsedCookie[cookieName] = tryDecodeURIComponent(cookieValue);
      if (name) {
        break;
      }
    }
  }
  return parsedCookie;
}, "parse");
var _serialize = /* @__PURE__ */ __name((name, value, opt = {}) => {
  if (!validCookieNameRegEx.test(name)) {
    throw new Error("Invalid cookie name");
  }
  let cookie = `${name}=${value}`;
  if (name.startsWith("__Secure-") && !opt.secure) {
    throw new Error("__Secure- Cookie must have Secure attributes");
  }
  if (name.startsWith("__Host-")) {
    if (!opt.secure) {
      throw new Error("__Host- Cookie must have Secure attributes");
    }
    if (opt.path !== "/") {
      throw new Error('__Host- Cookie must have Path attributes with "/"');
    }
    if (opt.domain) {
      throw new Error("__Host- Cookie must not have Domain attributes");
    }
  }
  for (const key of ["domain", "path", "sameSite", "priority"]) {
    if (opt[key] && /[;\r\n]/.test(opt[key])) {
      throw new Error(`${key} must not contain ";", "\\r", or "\\n"`);
    }
  }
  if (opt && typeof opt.maxAge === "number" && opt.maxAge >= 0) {
    if (opt.maxAge > 3456e4) {
      throw new Error(
        "Cookies Max-Age SHOULD NOT be greater than 400 days (34560000 seconds) in duration."
      );
    }
    cookie += `; Max-Age=${opt.maxAge | 0}`;
  }
  if (opt.domain && opt.prefix !== "host") {
    cookie += `; Domain=${opt.domain}`;
  }
  if (opt.path) {
    cookie += `; Path=${opt.path}`;
  }
  if (opt.expires) {
    if (opt.expires.getTime() - Date.now() > 3456e7) {
      throw new Error(
        "Cookies Expires SHOULD NOT be greater than 400 days (34560000 seconds) in the future."
      );
    }
    cookie += `; Expires=${opt.expires.toUTCString()}`;
  }
  if (opt.httpOnly) {
    cookie += "; HttpOnly";
  }
  if (opt.secure) {
    cookie += "; Secure";
  }
  if (opt.sameSite) {
    cookie += `; SameSite=${opt.sameSite.charAt(0).toUpperCase() + opt.sameSite.slice(1)}`;
  }
  if (opt.priority) {
    cookie += `; Priority=${opt.priority.charAt(0).toUpperCase() + opt.priority.slice(1)}`;
  }
  if (opt.partitioned) {
    if (!opt.secure) {
      throw new Error("Partitioned Cookie must have Secure attributes");
    }
    cookie += "; Partitioned";
  }
  return cookie;
}, "_serialize");
var serialize = /* @__PURE__ */ __name((name, value, opt) => {
  value = encodeURIComponent(value);
  return _serialize(name, value, opt);
}, "serialize");

// node_modules/hono/dist/helper/cookie/index.js
var getCookie = /* @__PURE__ */ __name((c, key, prefix) => {
  const cookie = c.req.raw.headers.get("Cookie");
  if (typeof key === "string") {
    if (!cookie) {
      return void 0;
    }
    let finalKey = key;
    if (prefix === "secure") {
      finalKey = "__Secure-" + key;
    } else if (prefix === "host") {
      finalKey = "__Host-" + key;
    }
    const obj2 = parse(cookie, finalKey);
    return obj2[finalKey];
  }
  if (!cookie) {
    return {};
  }
  const obj = parse(cookie);
  return obj;
}, "getCookie");
var generateCookie = /* @__PURE__ */ __name((name, value, opt) => {
  let cookie;
  if (opt?.prefix === "secure") {
    cookie = serialize("__Secure-" + name, value, { path: "/", ...opt, secure: true });
  } else if (opt?.prefix === "host") {
    cookie = serialize("__Host-" + name, value, {
      ...opt,
      path: "/",
      secure: true,
      domain: void 0
    });
  } else {
    cookie = serialize(name, value, { path: "/", ...opt });
  }
  return cookie;
}, "generateCookie");
var setCookie = /* @__PURE__ */ __name((c, name, value, opt) => {
  const cookie = generateCookie(name, value, opt);
  c.header("Set-Cookie", cookie, { append: true });
}, "setCookie");
var deleteCookie = /* @__PURE__ */ __name((c, name, opt) => {
  const deletedCookie = getCookie(c, name, opt?.prefix);
  setCookie(c, name, "", { ...opt, maxAge: 0 });
  return deletedCookie;
}, "deleteCookie");

// src/admin.ts
var adminRoutes = new Hono2();
function adminPath(env) {
  const raw2 = env.ADMIN_PATH?.trim();
  if (!raw2) return "/admin";
  const p = raw2.startsWith("/") ? raw2 : `/${raw2}`;
  if (!/^\/[A-Za-z0-9_-]{1,64}$/.test(p)) return "/admin";
  if (p === "/api" || p === "/pickup") return "/admin";
  return p;
}
__name(adminPath, "adminPath");
var enc = new TextEncoder();
var DAY_MS = 864e5;
var hex = /* @__PURE__ */ __name((buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join(""), "hex");
var sha2562 = /* @__PURE__ */ __name((s) => crypto.subtle.digest("SHA-256", enc.encode(s)), "sha256");
async function safeEqual(a, b) {
  const [da, db] = await Promise.all([sha2562(a), sha2562(b)]);
  const subtle = crypto.subtle;
  if (typeof subtle.timingSafeEqual === "function") return subtle.timingSafeEqual(da, db);
  const xa = new Uint8Array(da);
  const xb = new Uint8Array(db);
  let diff = 0;
  for (let i = 0; i < xa.length; i++) diff |= xa[i] ^ xb[i];
  return diff === 0;
}
__name(safeEqual, "safeEqual");
async function hmacHex(key, msg) {
  const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", k, enc.encode(msg)));
}
__name(hmacHex, "hmacHex");
async function makeCookieValue(env) {
  const exp = Date.now() + DAY_MS;
  return `${exp}.${await hmacHex(env.ADMIN_TOKEN, "admin:" + exp)}`;
}
__name(makeCookieValue, "makeCookieValue");
async function isValidCookie(env, value) {
  if (!value) return false;
  const dot = value.indexOf(".");
  if (dot < 0) return false;
  const exp = Number(value.slice(0, dot));
  const sig = value.slice(dot + 1);
  if (!Number.isFinite(exp) || exp <= Date.now()) return false;
  return safeEqual(sig, await hmacHex(env.ADMIN_TOKEN, "admin:" + exp));
}
__name(isValidCookie, "isValidCookie");
adminRoutes.use("*", async (c, next) => {
  if (c.req.method === "POST" && c.req.path === "/api/admin/login") return next();
  if (!await isValidCookie(c.env, getCookie(c, "admin"))) {
    return err(c, 401, "unauthorized", "\u672A\u767B\u5F55\u6216\u4F1A\u8BDD\u5DF2\u8FC7\u671F");
  }
  await next();
});
adminRoutes.post("/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  const token = body?.token;
  if (typeof token !== "string" || !await safeEqual(token, c.env.ADMIN_TOKEN || "")) {
    return err(c, 401, "unauthorized", "\u4EE4\u724C\u65E0\u6548");
  }
  const secure = c.req.url.startsWith("https");
  setCookie(c, "admin", await makeCookieValue(c.env), {
    httpOnly: true,
    secure,
    sameSite: "Lax",
    path: "/",
    maxAge: DAY_MS / 1e3
  });
  return c.json({ ok: true });
});
adminRoutes.post("/logout", (c) => {
  deleteCookie(c, "admin", { path: "/" });
  return c.json({ ok: true });
});
adminRoutes.get("/stats", async (c) => {
  const todayStart = /* @__PURE__ */ new Date();
  todayStart.setHours(0, 0, 0, 0);
  return c.json(await getStore(c.env).stats(todayStart.getTime()));
});
adminRoutes.get("/shares", async (c) => {
  const limit = Math.min(Math.max(Number(c.req.query("limit") || 50) || 50, 1), 200);
  const offset = Math.max(Number(c.req.query("offset") || 0) || 0, 0);
  const now = Date.now();
  const { total, rows } = await getStore(c.env).listShares(limit, offset);
  return c.json({
    total,
    rows: rows.map((r) => ({
      id: r.id,
      code: r.code,
      kind: r.kind,
      filename: r.filename,
      size: r.size,
      pickup_count: r.pickupCount,
      max_pickups: r.maxPickups,
      expire_at: r.expireAt,
      created_at: r.createdAt,
      status: shareStatusOf(r.expireAt, r.maxPickups, r.pickupCount, now),
      text_preview: r.textPreview
    }))
  });
});
adminRoutes.delete("/shares/:code", async (c) => {
  const code = c.req.param("code");
  if (!/^\d{6}$/.test(code)) return err(c, 400, "bad_request", "\u53E3\u4EE4\u975E\u6CD5");
  const store = getStore(c.env);
  const rec = await store.getByCode(code);
  if (!rec) return err(c, 404, "not_found", "\u5206\u4EAB\u4E0D\u5B58\u5728");
  if (rec.kind === "file") await deleteFile(c.env, rec.r2Key);
  await store.deleteByCode(code);
  return c.json({ ok: true });
});

// src/cleanup.ts
async function runCleanup(env) {
  const now = Date.now();
  const store = getStore(env);
  let deletedShares = 0;
  let abortedSessions = 0;
  for (let round = 0; round < 20; round++) {
    const expired = await store.listExpiredShares(now, 100);
    if (expired.length === 0) break;
    const r2Keys = expired.filter((r) => r.r2Key && !isKvFileKey(r.r2Key)).map((r) => r.r2Key);
    if (r2Keys.length > 0 && env.BUCKET) await env.BUCKET.delete(r2Keys);
    await Promise.all(expired.filter((r) => r.r2Key && isKvFileKey(r.r2Key)).map((r) => deleteFile(env, r.r2Key)));
    await store.deleteByCodes(expired.map((r) => r.code));
    deletedShares += expired.length;
  }
  const ttl = num(env.SESSION_TTL_MS, 864e5);
  const stale = await store.listStaleSessions(now, ttl);
  for (const s of stale) {
    try {
      await env.BUCKET?.resumeMultipartUpload(s.r2Key, s.uploadId).abort();
    } catch {
    }
    await store.deleteSession(s.id);
    abortedSessions++;
  }
  return { deletedShares, abortedSessions };
}
__name(runCleanup, "runCleanup");

// src/index.ts
var app = new Hono2();
app.use("*", async (c, next) => {
  if (c.req.method === "GET" || c.req.method === "HEAD") {
    const entry = adminPath(c.env);
    const path = c.req.path;
    if (path === entry) {
      return await serveAsset(c, "/admin.html") ?? c.notFound();
    }
    if (path === "/admin" || path === "/admin.html" || path.startsWith("/admin/")) {
      return await serveAsset(c, "/404.html", 404) ?? c.notFound();
    }
  }
  await next();
});
app.use("/api/*", async (c, next) => {
  if (!c.env.DB && !c.env.fileKV) {
    return c.json({ error: "config", message: "\u672A\u7ED1\u5B9A\u5143\u6570\u636E\u5E93:\u8BF7\u5728 wrangler.jsonc \u914D\u7F6E KV \u6216 D1(\u4E8C\u9009\u4E00)" }, 500);
  }
  await next();
});
app.get("/api/health", (c) => c.json({ ok: true }));
app.get(
  "/api/config",
  (c) => c.json({
    fileBackend: fileMode(c.env) ?? "none",
    maxFileSize: fileMaxSize(c.env),
    maxTextLength: num(c.env.MAX_TEXT_LENGTH, 65536),
    partSize: num(c.env.PART_SIZE, 10 * 1024 * 1024)
  })
);
app.route("/api/uploads", uploadRoutes);
app.route("/api", shareRoutes);
app.route("/api/admin", adminRoutes);
app.on(["GET", "HEAD"], "*", async (c, next) => {
  const asset = await serveAsset(c, c.req.path);
  if (asset && asset.status === 200) return asset;
  await next();
});
app.notFound(async (c) => {
  if (c.req.path.startsWith("/api/")) {
    return c.json({ error: "not_found", message: "\u63A5\u53E3\u4E0D\u5B58\u5728" }, 404);
  }
  return await serveAsset(c, "/404.html", 404) ?? c.text("Not Found", 404);
});
var index_default = {
  fetch: app.fetch,
  scheduled: /* @__PURE__ */ __name((_event, env, ctx) => ctx.waitUntil(runCleanup(env)), "scheduled")
};

// src/standalone.ts
var standalone_default = index_default;
export {
  standalone_default as default
};
//# sourceMappingURL=standalone.js.map
