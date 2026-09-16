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
var etags = /* @__PURE__ */ new Map();
function etagOf(key, body) {
  let tag = etags.get(key);
  if (tag == null) {
    let n = 2166136261;
    for (let i = 0; i < body.length; i++) {
      n = Math.imul(n ^ body.charCodeAt(i), 16777619) >>> 0;
    }
    tag = `W/"${n.toString(16)}-${body.length.toString(16)}"`;
    etags.set(key, tag);
  }
  return tag;
}
__name(etagOf, "etagOf");
async function serveAsset(c, path, status) {
  const key = resolveKey(path);
  const head = c.req.method === "HEAD";
  if (key) {
    const body = inline[key];
    const etag = etagOf(key, body);
    const headers = { etag, "cache-control": "no-cache" };
    if (!status && c.req.header("if-none-match") === etag) {
      return new Response(null, { status: 304, headers });
    }
    return new Response(head ? null : body, {
      status: status ?? 200,
      headers: { "content-type": mime(key), ...headers }
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
<meta name="theme-color" content="#efe8d8">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>\u{1F4E6}</text></svg>">
<title data-i18n="doc.404">404 - \u6587\u4EF6\u4E2D\u8F6C\u7AD9</title>
<link rel="stylesheet" href="/style.css">
<script>
  document.documentElement.dataset.theme =
    localStorage.getItem('theme') ||
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
<\/script>
</head>
<body>
<button id="lang-btn" class="icon-btn lang-btn lang-float" data-i18n-title="nav.lang">EN</button>
<main class="container narrow" style="padding-top:10vh">
  <section class="card center">
    <div style="font-size:48px;margin-bottom:8px">\u{1F9ED}</div>
    <h2 class="title" data-i18n="nf.title">\u9875\u9762\u4E0D\u5B58\u5728</h2>
    <p class="muted" data-i18n="nf.body">\u4F60\u8981\u627E\u7684\u9875\u9762\u4E0D\u5728\u4E2D\u8F6C\u7AD9\u91CC</p>
    <div class="btn-row" style="justify-content:center">
      <a class="btn primary" href="/" data-i18n="nf.send">\u53BB\u53D1\u9001</a>
      <a class="btn ghost" href="/pickup" data-i18n="nf.pickup">\u53BB\u53D6\u4EF6</a>
    </div>
  </section>
</main>

<footer class="foot" data-i18n="foot">\u89C1\u5B57\u5982\u9762</footer>
<script type="module">
  import { initI18n } from '/js/i18n.js';
  initI18n();
<\/script>
</body>
</html>
`, "admin.html": `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="\u6587\u4EF6\u4E2D\u8F6C\u7AD9\u7BA1\u7406\u540E\u53F0">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#efe8d8">
<title data-i18n="doc.admin">\u6587\u4EF6\u4E2D\u8F6C\u7AD9 - \u7BA1\u7406</title>
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
    <div><b data-i18n="brand.name">\u6587\u4EF6\u4E2D\u8F6C\u7AD9</b><small data-i18n="brand.admin">\u7BA1\u7406\u540E\u53F0</small></div>
  </div>
  <div class="actions">
    <button id="lang-btn" class="icon-btn lang-btn" data-i18n-title="nav.lang">EN</button>
    <button id="theme-btn" class="icon-btn" data-i18n-title="nav.theme">\u{1F317}</button>
    <a class="btn ghost small" href="/" data-i18n="nav.send">\u53D1\u9001</a>
  </div>
</header>

<main class="container wide">
  <section class="card center" id="admin-login" hidden>
    <h2 class="title" data-i18n="ad.loginTitle">\u7BA1\u7406\u767B\u5F55</h2>
    <p class="muted" style="margin:0" data-i18n="ad.loginSub">\u8F93\u5165\u90E8\u7F72\u65F6\u8BBE\u7F6E\u7684\u7BA1\u7406\u4EE4\u724C(ADMIN_TOKEN)</p>
    <input id="admin-token" class="token-input" type="password" data-i18n-ph="ad.tokenPh" placeholder="\u7BA1\u7406\u4EE4\u724C" autocomplete="current-password">
    <button id="btn-login" class="btn primary block" data-i18n="ad.login">\u767B\u5F55</button>
    <div id="login-error" class="error-box" hidden></div>
  </section>

  <section id="admin-panel" hidden>
    <div class="stats-row" id="stats-row"></div>
    <div class="card" style="padding:14px">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th data-i18n="ad.th.code">\u53E3\u4EE4</th><th data-i18n="ad.th.kind">\u7C7B\u578B</th><th data-i18n="ad.th.content">\u5185\u5BB9</th><th data-i18n="ad.th.size">\u5927\u5C0F</th>
              <th data-i18n="ad.th.pickups">\u5DF2\u53D6/\u4E0A\u9650</th><th data-i18n="ad.th.expire">\u8FC7\u671F\u65F6\u95F4</th><th data-i18n="ad.th.status">\u72B6\u6001</th><th data-i18n="ad.th.created">\u521B\u5EFA\u65F6\u95F4</th><th></th>
            </tr>
          </thead>
          <tbody id="shares-body"></tbody>
        </table>
      </div>
      <div class="row-between">
        <div class="pager-btns">
          <button id="btn-prev" class="btn small" disabled data-i18n="ad.prev">\u4E0A\u4E00\u9875</button>
          <button id="btn-next" class="btn small" disabled data-i18n="ad.next">\u4E0B\u4E00\u9875</button>
        </div>
        <small class="muted" id="page-info"></small>
        <button id="btn-refresh" class="btn small ghost" data-i18n="ad.refresh">\u21BB \u5237\u65B0</button>
      </div>
      <div class="admin-foot">
        <button id="btn-logout" class="btn ghost small" data-i18n="ad.logout">\u9000\u51FA\u767B\u5F55</button>
      </div>
    </div>
  </section>
</main>

<!-- \u4F5C\u5E9F\u786E\u8BA4\u5F39\u7A97:\u7968\u636E\u98CE,\u66FF\u4EE3\u539F\u751F confirm(ESC / \u70B9\u906E\u7F69 = \u53D6\u6D88) -->
<div class="modal-mask" id="del-mask" hidden>
  <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="del-title">
    <h3 class="modal-title" id="del-title" data-i18n="ad.delTitle">\u4F5C\u5E9F\u8FD9\u5F20\u53D6\u4EF6\u51ED\u8BC1?</h3>
    <div class="del-target" id="del-target"></div>
    <p class="del-warn" data-i18n="ad.delWarn">\u4F5C\u5E9F\u540E\u53E3\u4EE4\u7ACB\u5373\u5931\u6548,\u5BF9\u65B9\u5C06\u65E0\u6CD5\u53D6\u4EF6,\u4E14\u4E0D\u53EF\u6062\u590D\u3002</p>
    <div class="modal-actions">
      <button id="del-cancel" class="btn" data-i18n="btn.cancel">\u53D6\u6D88</button>
      <button id="del-ok" class="btn danger" data-i18n="ad.delOk">\u786E\u8BA4\u4F5C\u5E9F</button>
    </div>
  </div>
</div>

<script type="module" src="/js/admin.js"><\/script>
</body>
</html>
`, "index.html": `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="\u81EA\u6258\u7BA1\u6587\u4EF6/\u6587\u672C\u5206\u4EAB:\u4E0A\u4F20\u751F\u6210 6 \u4F4D\u53D6\u4EF6\u53E3\u4EE4,\u50CF\u53D6\u5FEB\u9012\u4E00\u6837\u53D6\u4EF6">
<meta name="theme-color" content="#efe8d8">
<title data-i18n="doc.send">\u6587\u4EF6\u4E2D\u8F6C\u7AD9 - \u53D1\u9001</title>
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
<header class="topbar wide">
  <div class="brand">
    <span class="logo">\u{1F4E6}</span>
    <div><b data-i18n="brand.name">\u6587\u4EF6\u4E2D\u8F6C\u7AD9</b><small data-i18n="brand.tagline">\u50CF\u53D6\u5FEB\u9012\u4E00\u6837\u53D6\u6587\u4EF6</small></div>
  </div>
  <div class="actions">
    <button id="lang-btn" class="icon-btn lang-btn" data-i18n-title="nav.lang">EN</button>
    <button id="theme-btn" class="icon-btn" data-i18n-title="nav.theme">\u{1F317}</button>
    <a class="btn ghost small" href="/pickup" data-i18n="nav.pickup">\u53D6\u4EF6</a>
  </div>
</header>

<main class="container wide">
  <section class="flow-strip">
    <div class="flow-step"><span class="flow-dot">\u{1F4E6}</span><div class="flow-tt"><b data-i18n="flow.dropT">\u5BC4\u4EF6</b><small data-i18n="flow.dropS">\u4E0A\u4F20\u6587\u4EF6\u6216\u6587\u672C,\u4EA4\u5BC4\u67DC\u53F0</small></div></div>
    <div class="flow-link"></div>
    <div class="flow-step"><span class="flow-dot">\u{1F3AB}</span><div class="flow-tt"><b data-i18n="flow.tickT">\u51FA\u7968</b><small data-i18n="flow.tickS">\u751F\u6210 6 \u4F4D\u53D6\u4EF6\u53E3\u4EE4</small></div></div>
    <div class="flow-link"></div>
    <div class="flow-step"><span class="flow-dot">\u{1F4E5}</span><div class="flow-tt"><b data-i18n="flow.pickT">\u53D6\u4EF6</b><small data-i18n="flow.pickS">\u5BF9\u65B9\u51ED\u7801\u4E00\u6B21\u9886\u8D70</small></div></div>
  </section>
  <div class="send-grid">
  <section class="card form-card">
    <div class="card-cap">
      <span data-i18n="send.cap">\u5BC4\u4EF6\u5355</span>
      <span class="cap-date" id="cap-date"></span>
    </div>
    <div class="tabs">
      <button class="tab active" data-tab="file" data-i18n="tab.file">\u53D1\u6587\u4EF6</button>
      <button class="tab" data-tab="text" data-i18n="tab.text">\u53D1\u6587\u672C</button>
    </div>

    <div id="panel-file" class="panel">
      <div id="dropzone" class="dropzone" tabindex="0" role="button" data-i18n-aria="dz.aria" aria-label="\u9009\u62E9\u6587\u4EF6">
        <input type="file" id="file-input" multiple hidden>
        <div class="dz-icon">\u{1F4C4}</div>
        <p><b data-i18n="dz.click">\u70B9\u51FB\u9009\u62E9\u6587\u4EF6</b><span data-i18n="dz.drop">,\u6216\u62D6\u62FD / \u7C98\u8D34\u5230\u6B64\u5904</span></p>
        <small id="dz-hint" data-i18n="dz.hint">\u4E0A\u4F20\u540E\u751F\u6210 6 \u4F4D\u53D6\u4EF6\u53E3\u4EE4</small>
      </div>
      <div id="file-list" class="file-list" hidden></div>
    </div>

    <div id="panel-text" class="panel" hidden>
      <textarea id="text-input" rows="6" maxlength="65536" data-i18n-ph="text.placeholder" placeholder="\u7C98\u8D34\u6216\u8F93\u5165\u8981\u5206\u4EAB\u7684\u6587\u672C\u2026"></textarea>
      <div class="row-between"><small class="muted" id="text-counter">0 / 65536</small></div>
    </div>

    <div class="options">
      <div class="opt-group">
        <label data-i18n="opt.expiry">\u6709\u6548\u671F</label>
        <div class="seg" id="seg-expiry">
          <button type="button" data-v="1d" data-i18n="seg.1d">1 \u5929</button>
          <button type="button" data-v="7d" class="active" data-i18n="seg.7d">7 \u5929</button>
          <button type="button" data-v="30d" data-i18n="seg.30d">30 \u5929</button>
          <button type="button" data-v="forever" data-i18n="seg.forever">\u6C38\u4E45</button>
        </div>
      </div>
      <div class="opt-group">
        <label data-i18n="opt.pickups">\u53EF\u53D6\u6B21\u6570</label>
        <div class="seg" id="seg-pickups">
          <button type="button" data-v="1" data-i18n="seg.p1">1 \u6B21</button>
          <button type="button" data-v="5" data-i18n="seg.p5">5 \u6B21</button>
          <button type="button" data-v="null" class="active" data-i18n="seg.punlimited">\u4E0D\u9650</button>
        </div>
      </div>
    </div>

    <button id="btn-upload" class="btn primary block" disabled data-i18n="btn.upload">\u5F00\u59CB\u4E0A\u4F20</button>
    <button id="btn-text" class="btn primary block" hidden disabled data-i18n="btn.genCode">\u751F\u6210\u53E3\u4EE4</button>

    <div id="progress" class="progress" hidden>
      <div class="bar"><div id="progress-fill"></div></div>
      <div class="row-between">
        <small id="progress-text">\u2026</small>
        <button id="btn-cancel" class="btn danger small" type="button" data-i18n="btn.cancel">\u53D6\u6D88</button>
      </div>
    </div>

    </section>

    <aside class="send-side">
      <div class="side-cap" data-i18n="receipt.cap">\u56DE\u6267</div>
      <div id="result-placeholder" class="result-placeholder">
        <div class="ph-postmark">PENDING</div>
        <p data-i18n="ph.title">\u5F85\u51FA\u7968</p>
        <small data-i18n="ph.sub">\u4E0A\u4F20\u5B8C\u6210\u540E,\u53D6\u4EF6\u51ED\u8BC1\u4F1A\u51FA\u73B0\u5728\u8FD9\u91CC</small>
        <div class="ph-route">
          <div class="ph-leg"><span class="ph-ic">\u{1F9D1}</span><div><b data-i18n="route.senderT">\u5BC4\u4EF6\u4EBA \xB7 \u4F60</b><small data-i18n="route.senderS">\u628A\u6587\u4EF6\u6216\u6587\u672C\u4EA4\u5BC4\u672C\u67DC\u53F0</small></div></div>
          <div class="ph-dash"></div>
          <div class="ph-leg"><span class="ph-ic">\u2601\uFE0F</span><div><b data-i18n="route.relayT">\u4E2D\u8F6C\u7AD9 \xB7 \u5728\u9014</b><small data-i18n="route.relayS">Cloudflare \u8FB9\u7F18\u9650\u65F6\u4FDD\u7BA1</small></div></div>
          <div class="ph-dash"></div>
          <div class="ph-leg"><span class="ph-ic">\u{1F9F2}</span><div><b data-i18n="route.takerT">\u53D6\u4EF6\u4EBA \xB7 \u5BF9\u65B9</b><small data-i18n="route.takerS">\u51ED 6 \u4F4D\u53E3\u4EE4\u9886\u53D6,\u903E\u671F\u9000\u56DE\u865A\u65E0</small></div></div>
        </div>
        <div class="ph-fine" data-i18n="route.fine">\u9650 \u6B21 \xB7 \u9650 \u65F6 \xB7 \u5230 \u671F \u5373 \u6BC1</div>
      </div>
      <div id="results" class="results"></div>
    </aside>
  </div>
  <section class="feat-band">
    <div class="feat"><span class="feat-ic">\u{1F9E9}</span><div><b data-i18n="feat.splitT">\u5206\u7247\u76F4\u4F20</b><small data-i18n="feat.splitS">\u5355\u6587\u4EF6\u81F3\u9AD8 2 GB</small></div></div>
    <div class="feat"><span class="feat-ic">\u23F3</span><div><b data-i18n="feat.ttlT">\u65F6\u6548\u53EF\u63A7</b><small data-i18n="feat.ttlS">1 ~ 30 \u5929\u6216\u6C38\u4E45</small></div></div>
    <div class="feat"><span class="feat-ic">\u{1F522}</span><div><b data-i18n="feat.limitT">\u9650\u6B21\u53D6\u4EF6</b><small data-i18n="feat.limitS">1 \u6B21 \xB7 5 \u6B21 \xB7 \u4E0D\u9650</small></div></div>
    <div class="feat"><span class="feat-ic">\u{1F512}</span><div><b data-i18n="feat.selfT">\u81EA\u6258\u7BA1</b><small data-i18n="feat.selfS">\u6570\u636E\u5728\u4F60\u81EA\u5DF1\u7684\u8D26\u53F7</small></div></div>
  </section>
</main>

<footer class="foot" data-i18n="foot">\u89C1\u5B57\u5982\u9762</footer>

<script src="/js/vendor/qrcode.js"><\/script>
<script type="module" src="/js/index.js"><\/script>
</body>
</html>
`, "js/admin.js": "import { $, api, fmtBytes, fmtDate, toast, initTheme, el } from './common.js';\nimport { t, onLangChange, initI18n } from './i18n.js';\n\ninitTheme();\ninitI18n();\n\nconst loginCard = $('#admin-login');\nconst panel = $('#admin-panel');\nconst loginError = $('#login-error');\nconst tokenInput = $('#admin-token');\nconst statsRow = $('#stats-row');\nconst tbody = $('#shares-body');\nconst btnPrev = $('#btn-prev');\nconst btnNext = $('#btn-next');\nconst btnRefresh = $('#btn-refresh');\nconst pageInfo = $('#page-info');\n\nconst LIMIT = 20; // \u6BCF\u9875\u884C\u6570:\u540E\u7AEF\u5217\u8868\u4F1A\u9010\u884C\u9A8C\u6D3B(\u8BFB KV),\u9875\u5C0F\u4E00\u70B9\u7701 subrequest\nlet offset = 0;\nlet total = 0;\n\n/* \u8BED\u8A00\u5207\u6362:\u9762\u677F\u53EF\u89C1\u65F6\u6309\u65B0\u8BED\u8A00\u91CD\u62C9\u6587\u6848 */\nonLangChange(() => {\n  if (!panel.hidden) {\n    loadStats();\n    loadList();\n  }\n});\n\n/* ---------- \u767B\u5F55\u6001\u63A2\u6D4B:stats \u901A\u5219\u89C6\u4E3A\u5DF2\u767B\u5F55 ---------- */\n(async () => {\n  try {\n    await api('/api/admin/stats');\n    showPanel();\n  } catch {\n    loginCard.hidden = false;\n    tokenInput.focus();\n  }\n})();\n\nasync function login() {\n  const token = tokenInput.value.trim();\n  if (!token) return;\n  loginError.hidden = true;\n  try {\n    await api('/api/admin/login', { method: 'POST', body: { token } });\n    showPanel();\n  } catch (e) {\n    loginError.textContent = e.message || t('ad.badToken');\n    loginError.hidden = false;\n  }\n}\n$('#btn-login').addEventListener('click', login);\ntokenInput.addEventListener('keydown', (e) => e.key === 'Enter' && login());\n\nfunction showPanel() {\n  loginCard.hidden = true;\n  panel.hidden = false;\n  loadStats();\n  loadList();\n}\n\n$('#btn-logout').addEventListener('click', async () => {\n  try { await api('/api/admin/logout', { method: 'POST', body: {} }); } catch { /* ignore */ }\n  location.reload();\n});\n\n/* ---------- \u7EDF\u8BA1 ---------- */\nlet lastStats = null; // \u5220\u9664\u540E\u672C\u5730\u9012\u51CF\u7528,\u907F\u514D\u7ACB\u5373\u91CD\u62C9\u649E\u4E0A KV \u6700\u7EC8\u4E00\u81F4\u7A97\u53E3\n\nfunction renderStats(s) {\n  statsRow.replaceChildren(\n    el('div', { class: 'stat-card' }, el('b', {}, String(s.total)), el('small', { class: 'muted' }, t('ad.total'))),\n    el('div', { class: 'stat-card' }, el('b', {}, String(s.active)), el('small', { class: 'muted' }, t('ad.active'))),\n    el('div', { class: 'stat-card' }, el('b', {}, String(s.files)), el('small', { class: 'muted' }, t('ad.files'))),\n    el('div', { class: 'stat-card' }, el('b', {}, String(s.texts)), el('small', { class: 'muted' }, t('ad.texts'))),\n    el('div', { class: 'stat-card' }, el('b', {}, fmtBytes(s.totalBytes)), el('small', { class: 'muted' }, t('ad.storage'))),\n    el('div', { class: 'stat-card' }, el('b', {}, String(s.todayCreated)), el('small', { class: 'muted' }, t('ad.today'))),\n  );\n}\n\nasync function loadStats() {\n  try {\n    lastStats = await api('/api/admin/stats');\n    renderStats(lastStats);\n  } catch { /* \u5FFD\u7565,\u5217\u8868\u52A0\u8F7D\u4F1A\u518D\u62A5 */ }\n}\n\n/** \u5220\u9664\u6210\u529F\u540E\u672C\u5730\u540C\u6B65\u7EDF\u8BA1(\u670D\u52A1\u7AEF KV \u7D22\u5F15\u6700\u957F 60s \u624D\u53CD\u6620\u5220\u9664,\u91CD\u62C9\u4F1A\u770B\u5230\u65E7\u6570) */\nfunction statsAfterDelete(r) {\n  if (!lastStats) return;\n  const s = { ...lastStats };\n  s.total = Math.max(0, s.total - 1);\n  if (r.kind === 'file') s.files = Math.max(0, s.files - 1);\n  else s.texts = Math.max(0, s.texts - 1);\n  s.totalBytes = Math.max(0, s.totalBytes - r.size);\n  if (r.status === 'active') s.active = Math.max(0, s.active - 1);\n  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);\n  if (r.created_at >= todayStart.getTime()) s.todayCreated = Math.max(0, s.todayCreated - 1);\n  renderStats(s);\n}\n\n/* ---------- \u5217\u8868 ---------- */\nconst STATUS_KEY = { active: 'ad.st.active', expired: 'ad.st.expired', exhausted: 'ad.st.exhausted' };\nconst KIND_KEY = { file: 'ad.kind.file', text: 'ad.kind.text' };\n\nasync function loadList() {\n  tbody.replaceChildren(el('tr', {}, el('td', { class: 'muted', colspan: 9 }, t('ad.loading'))));\n  try {\n    const data = await api(`/api/admin/shares?limit=${LIMIT}&offset=${offset}`);\n    total = data.total;\n    const rows = data.rows ?? [];\n    tbody.replaceChildren();\n    for (const r of rows) {\n      const content = r.kind === 'text' ? (r.text_preview || t('ad.textFallback')) : (r.filename || t('ad.unnamed'));\n      tbody.append(\n        el('tr', {},\n          el('td', { class: 'mono' }, r.code),\n          el('td', {}, el('span', { class: `badge kind-${r.kind}` }, t(KIND_KEY[r.kind] || r.kind))),\n          el('td', { class: 'wrap' }, content),\n          el('td', {}, r.kind === 'text' ? t('ad.chars', r.size) : fmtBytes(r.size)),\n          el('td', {}, `${r.pickup_count} / ${r.max_pickups ?? '\u221E'}`),\n          el('td', {}, r.expire_at ? fmtDate(r.expire_at) : t('ad.forever')),\n          el('td', {}, el('span', { class: `badge ${r.status}` }, STATUS_KEY[r.status] ? t(STATUS_KEY[r.status]) : r.status)),\n          el('td', {}, fmtDate(r.created_at)),\n          el('td', {}, el('button', { class: 'btn danger small', onclick: (e) => remove(r, e.target.closest('tr')) }, t('ad.delete'))),\n        ),\n      );\n    }\n    if (rows.length === 0) {\n      tbody.replaceChildren(el('tr', {}, el('td', { class: 'muted', colspan: 9 }, t('ad.empty'))));\n    }\n    updatePager();\n  } catch (e) {\n    tbody.replaceChildren(el('tr', {}, el('td', { class: 'muted', colspan: 9 }, e.message || t('ad.loadFail'))));\n  }\n}\n\nfunction updatePager() {\n  const page = Math.floor(offset / LIMIT) + 1;\n  const pages = Math.max(1, Math.ceil(total / LIMIT));\n  pageInfo.textContent = t('ad.page', page, pages, total);\n  btnPrev.disabled = offset <= 0;\n  btnNext.disabled = offset + LIMIT >= total;\n}\nbtnPrev.addEventListener('click', () => { offset = Math.max(0, offset - LIMIT); loadList(); });\nbtnNext.addEventListener('click', () => { offset += LIMIT; loadList(); });\nbtnRefresh.addEventListener('click', () => { loadStats(); loadList(); });\n\n/* ---------- \u5220\u9664:\u7968\u636E\u98CE\u786E\u8BA4\u5F39\u7A97 + \u672C\u5730\u540C\u6B65(KV \u6700\u7EC8\u4E00\u81F4,\u5220\u9664\u540E\u7ACB\u5373\u91CD\u62C9\u4F1A\u770B\u5230\u6B8B\u7559\u7D22\u5F15) ---------- */\nconst delMask = $('#del-mask');\nconst delTarget = $('#del-target');\nlet delResolve = null;\n\nfunction confirmDelete(r) {\n  const content = r.kind === 'text' ? (r.text_preview || t('ad.textFallback')) : (r.filename || t('ad.unnamed'));\n  delTarget.replaceChildren(\n    el('div', { class: 'del-line' }, el('span', { class: 'muted' }, t('ad.th.code')), el('b', { class: 'mono' }, r.code)),\n    el('div', { class: 'del-line' }, el('span', { class: 'muted' }, t('ad.th.content')), el('span', {}, content)),\n    el('div', { class: 'del-line' }, el('span', { class: 'muted' }, t('ad.th.size')),\n      el('span', {}, r.kind === 'text' ? t('ad.chars', r.size) : fmtBytes(r.size))),\n  );\n  delMask.hidden = false;\n  $('#del-cancel').focus();\n  return new Promise((resolve) => { delResolve = resolve; });\n}\n\nfunction closeDelModal(v) {\n  if (!delResolve) return;\n  delMask.hidden = true;\n  const resolve = delResolve;\n  delResolve = null;\n  resolve(v);\n}\n$('#del-cancel').addEventListener('click', () => closeDelModal(false));\n$('#del-ok').addEventListener('click', () => closeDelModal(true));\ndelMask.addEventListener('click', (e) => e.target === delMask && closeDelModal(false));\ndocument.addEventListener('keydown', (e) => e.key === 'Escape' && closeDelModal(false));\n\nasync function remove(r, tr) {\n  if (!(await confirmDelete(r))) return;\n  try {\n    await api(`/api/admin/shares/${r.code}`, { method: 'DELETE' });\n    toast(t('ad.deleted'), 'ok');\n    statsAfterDelete(r);\n    total = Math.max(0, total - 1);\n    tr?.remove();\n    // \u5F53\u524D\u9875\u5220\u7A7A\u4E14\u4E0D\u5728\u7B2C\u4E00\u9875:\u9000\u56DE\u4E0A\u4E00\u9875\u91CD\u62C9,\u907F\u514D\u505C\u5728\u7A7A\u9875\n    if (tbody.rows.length === 0 && offset > 0) {\n      offset = Math.max(0, offset - LIMIT);\n      loadList();\n    } else {\n      updatePager();\n    }\n  } catch (e) {\n    toast(e.message || t('ad.deleteFail'), 'error');\n  }\n}\n", "js/common.js": "import { t } from './i18n.js';\n\nexport const $ = (sel, el = document) => el.querySelector(sel);\nexport const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];\n\n/** fetch JSON \u5C01\u88C5:\u975E 2xx \u629B\u9519(\u5E26\u670D\u52A1\u7AEF\u7684\u4E2D\u6587 message \u4E0E\u673A\u5668\u7801) */\nexport async function api(path, opts = {}) {\n  const res = await fetch(path, {\n    method: opts.method || 'GET',\n    headers: opts.body !== undefined ? { 'Content-Type': 'application/json' } : {},\n    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,\n  });\n  let data = null;\n  try { data = await res.json(); } catch { /* \u975E JSON \u54CD\u5E94 */ }\n  if (!res.ok) {\n    const e = new Error(data?.message || t('req.fail', res.status));\n    e.code = data?.error || 'unknown';\n    e.status = res.status;\n    throw e;\n  }\n  return data;\n}\n\nexport function fmtBytes(n) {\n  if (!Number.isFinite(n) || n < 0) return '-';\n  const units = ['B', 'KB', 'MB', 'GB', 'TB'];\n  let i = 0;\n  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }\n  const v = i === 0 ? Math.round(n) : n >= 100 ? Math.round(n) : Math.round(n * 10) / 10;\n  return `${v} ${units[i]}`;\n}\n\n/** \u6C38\u4E45\u5206\u4EAB\u8FD4\u56DE null,\u7531\u8C03\u7528\u65B9\u6309\u8BED\u8A00\u6E32\u67D3\u300C\u6C38\u4E45 / Forever\u300D */\nexport function fmtDate(ms) {\n  if (ms === null || ms === undefined) return null;\n  const d = new Date(ms);\n  const p = (x) => String(x).padStart(2, '0');\n  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;\n}\n\n/** \u79D2\u6570\u4EBA\u6027\u5316:\u7528\u4E8E\u4E0A\u4F20\u5269\u4F59\u65F6\u95F4 / \u8FC7\u671F\u5012\u8BA1\u65F6,\u5355\u4F4D\u8BCD\u968F\u8BED\u8A00 */\nexport function fmtDuration(sec) {\n  if (!Number.isFinite(sec) || sec < 0) return '-';\n  if (sec < 1) return t('dur.ms');\n  if (sec < 60) return t('dur.s', Math.round(sec));\n  if (sec < 3600) {\n    const m = Math.floor(sec / 60);\n    const s = Math.round(sec % 60);\n    return s ? t('dur.hm', m, s) : t('dur.h', m);\n  }\n  if (sec < 86400) {\n    const h = Math.floor(sec / 3600);\n    const m = Math.round((sec % 3600) / 60);\n    return m ? t('dur.hH', h, m) : t('dur.hH2', h);\n  }\n  return t('dur.d', Math.round(sec / 86400));\n}\n\n/** \u6309\u6587\u4EF6\u540D/ MIME \u6311\u4E00\u4E2A\u76F4\u89C2\u56FE\u6807(\u7EAF\u5C55\u793A\u7528) */\nexport function iconFor(name = '', mime = '') {\n  const ext = (name.split('.').pop() || '').toLowerCase();\n  if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'].includes(ext)) return '\u{1F5BC}\uFE0F';\n  if (mime.startsWith('video/') || ['mp4', 'mkv', 'mov', 'avi', 'webm', 'flv'].includes(ext)) return '\u{1F3AC}';\n  if (mime.startsWith('audio/') || ['mp3', 'flac', 'wav', 'ogg', 'm4a', 'aac'].includes(ext)) return '\u{1F3B5}';\n  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(ext)) return '\u{1F5DC}\uFE0F';\n  if (mime === 'application/pdf' || ext === 'pdf') return '\u{1F4D5}';\n  if (['doc', 'docx', 'txt', 'md', 'ppt', 'pptx', 'xls', 'xlsx', 'csv'].includes(ext)) return '\u{1F4C4}';\n  if (['js', 'ts', 'py', 'json', 'html', 'css', 'java', 'go', 'rs', 'c', 'cpp', 'sh', 'yml', 'yaml', 'xml'].includes(ext)) return '\u{1F9E9}';\n  return '\u{1F4E6}';\n}\n\nexport async function copyText(text) {\n  try {\n    await navigator.clipboard.writeText(text);\n    return true;\n  } catch { /* \u8D70\u964D\u7EA7 */ }\n  try {\n    const ta = document.createElement('textarea');\n    ta.value = text;\n    ta.style.cssText = 'position:fixed;opacity:0';\n    document.body.appendChild(ta);\n    ta.select();\n    const ok = document.execCommand('copy');\n    ta.remove();\n    return ok;\n  } catch {\n    return false;\n  }\n}\n\nexport function toast(msg, type = 'info') {\n  let host = $('#toast-host');\n  if (!host) {\n    host = document.createElement('div');\n    host.id = 'toast-host';\n    document.body.appendChild(host);\n  }\n  const t = document.createElement('div');\n  t.className = `toast ${type}`;\n  t.textContent = msg;\n  host.appendChild(t);\n  requestAnimationFrame(() => t.classList.add('show'));\n  setTimeout(() => {\n    t.classList.remove('show');\n    setTimeout(() => t.remove(), 300);\n  }, 2400);\n}\n\nexport function initTheme() {\n  const btn = $('#theme-btn');\n  const meta = $('meta[name=\"theme-color\"]');\n  const sync = () => {\n    if (meta) meta.content = document.documentElement.dataset.theme === 'dark' ? '#0f1117' : '#f6f7fb';\n  };\n  sync();\n  btn?.addEventListener('click', () => {\n    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';\n    localStorage.setItem('theme', next);\n    document.documentElement.dataset.theme = next;\n    sync();\n  });\n}\n\n/** \u5B89\u5168 DOM \u6784\u5EFA:\u5168\u90E8 textContent,\u9632 XSS */\nexport function el(tag, attrs = {}, ...children) {\n  const n = document.createElement(tag);\n  for (const [k, v] of Object.entries(attrs)) {\n    if (k === 'class') n.className = v;\n    else if (k === 'href' || k === 'download' || k === 'type' || k === 'inputmode' || k === 'colspan') n.setAttribute(k, v);\n    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);\n    else n[k] = v;\n  }\n  for (const c of children.flat(Infinity)) {\n    if (c == null || c === false) continue;\n    n.append(c instanceof Node ? c : document.createTextNode(String(c)));\n  }\n  return n;\n}\n", "js/i18n.js": "/**\n * \u8F7B\u91CF i18n:HTML \u9759\u6001\u6587\u6848\u7528 data-i18n / data-i18n-ph / data-i18n-title \u6807\u8BB0,\n * JS \u52A8\u6001\u5B57\u7B26\u4E32\u7528 t('key', \u2026args);{n} \u5360\u4F4D\u3002\n * \u8BED\u8A00\u4F18\u5148\u7EA7:localStorage('lang') > \u6D4F\u89C8\u5668\u8BED\u8A00(en \u5F00\u5934\u2192\u82F1\u6587)> \u4E2D\u6587\u3002\n * \u5207\u6362\u540E\u8C03\u7528\u5DF2\u6CE8\u518C\u7684\u91CD\u6E32\u67D3\u94A9\u5B50(\u5404\u9875\u9762 setLang \u65F6\u767B\u8BB0)\u3002\n * \u8BCD\u5178\u503C\u4E3A\u6570\u7EC4\u65F6\u968F\u673A\u53D6\u4E00\u6761(\u9875\u811A\u5F69\u86CB,\u6BCF\u6B21\u52A0\u8F7D/\u5207\u8BED\u8A00\u91CD\u6447)\u3002\n */\n\nconst DICT = {\n  zh: {\n    'doc.send': '\u6587\u4EF6\u4E2D\u8F6C\u7AD9 - \u53D1\u9001',\n    'doc.pickup': '\u6587\u4EF6\u4E2D\u8F6C\u7AD9 - \u53D6\u4EF6',\n    'doc.admin': '\u6587\u4EF6\u4E2D\u8F6C\u7AD9 - \u7BA1\u7406',\n    'doc.404': '404 - \u6587\u4EF6\u4E2D\u8F6C\u7AD9',\n\n    'brand.name': '\u6587\u4EF6\u4E2D\u8F6C\u7AD9',\n    'brand.tagline': '\u50CF\u53D6\u5FEB\u9012\u4E00\u6837\u53D6\u6587\u4EF6',\n    'brand.pickup': '\u53D6\u4EF6',\n    'brand.admin': '\u7BA1\u7406\u540E\u53F0',\n    'nav.pickup': '\u53D6\u4EF6',\n    'nav.send': '\u53D1\u9001',\n    'nav.theme': '\u5207\u6362\u4E3B\u9898',\n    'nav.lang': '\u5207\u6362\u8BED\u8A00',\n    'foot': [\n      '\u89C1\u5B57\u5982\u9762',\n      '\u7EB8\u77ED\u60C5\u957F',\n      '\u5C71\u9AD8\u6C34\u957F,\u540E\u4F1A\u6709\u671F',\n      '\u6B64\u4EF6\u5DF2\u7B7E\u6536,\u671B\u73CD\u91CD',\n      '\u98CE\u91CC\u96E8\u91CC,\u4E2D\u8F6C\u7AD9\u7B49\u4F60',\n      '\u6162\u4E00\u70B9,\u4E5F\u6CA1\u5173\u7CFB',\n    ],\n\n    'tab.file': '\u53D1\u6587\u4EF6',\n    'tab.text': '\u53D1\u6587\u672C',\n    'dz.click': '\u70B9\u51FB\u9009\u62E9\u6587\u4EF6',\n    'dz.drop': ',\u6216\u62D6\u62FD / \u7C98\u8D34\u5230\u6B64\u5904',\n    'dz.aria': '\u9009\u62E9\u6587\u4EF6',\n    'dz.hint': '\u4E0A\u4F20\u540E\u751F\u6210 6 \u4F4D\u53D6\u4EF6\u53E3\u4EE4',\n    'dz.hintMax': '\u5355\u4E2A\u6587\u4EF6\u6700\u5927 {0} \xB7 \u652F\u6301\u591A\u9009,\u4E0A\u4F20\u540E\u751F\u6210\u53D6\u4EF6\u53E3\u4EE4',\n    'remove': '\u79FB\u9664',\n    'text.placeholder': '\u7C98\u8D34\u6216\u8F93\u5165\u8981\u5206\u4EAB\u7684\u6587\u672C\u2026',\n    'opt.expiry': '\u6709\u6548\u671F',\n    'opt.pickups': '\u53EF\u53D6\u6B21\u6570',\n    'seg.1d': '1 \u5929', 'seg.7d': '7 \u5929', 'seg.30d': '30 \u5929', 'seg.forever': '\u6C38\u4E45',\n    'seg.p1': '1 \u6B21', 'seg.p5': '5 \u6B21', 'seg.punlimited': '\u4E0D\u9650',\n    'btn.upload': '\u5F00\u59CB\u4E0A\u4F20',\n    'btn.genCode': '\u751F\u6210\u53E3\u4EE4',\n    'btn.cancel': '\u53D6\u6D88',\n    'btn.copyCode': '\u590D\u5236\u53E3\u4EE4',\n    'btn.copyLink': '\u590D\u5236\u94FE\u63A5',\n    'btn.copyAll': '\u590D\u5236\u5168\u90E8\u53E3\u4EE4',\n    'btn.again': '\u518D\u6765\u4E00\u4E2A',\n\n    'prog.preparing': '\u51C6\u5907\u4E2D\u2026',\n    'prog.uploading': '\u4E0A\u4F20\u4E2D\u2026',\n    'prog.init': '\u521D\u59CB\u5316\u2026',\n    'prog.merging': '\u6B63\u5728\u5408\u5E76\u5206\u7247\u2026',\n    'prog.file': '\u7B2C {0}/{1} \u4E2A',\n    'prog.part': '\u7B2C {0}/{1} \u7247',\n    'prog.eta': '\u5269\u4F59 {0}',\n    'prog.retry': '\u4E0A\u4F20\u5931\u8D25,\u91CD\u8BD5 {0}/3\u2026',\n\n    'result.ok': '\u2705 \u5206\u4EAB\u6210\u529F,\u628A\u53E3\u4EE4\u53D1\u7ED9\u5BF9\u65B9',\n    'result.okBatch': '\u2705 {0} \u4E2A\u6587\u4EF6\u5206\u4EAB\u6210\u529F',\n    'ticket.title': '\u53D6\u4EF6\u51ED\u8BC1',\n    'ticket.no': '\u2116 {0}',\n    'send.cap': '\u5BC4\u4EF6\u5355',\n    'receipt.cap': '\u56DE\u6267',\n    'ph.title': '\u5F85\u51FA\u7968',\n    'ph.sub': '\u4E0A\u4F20\u5B8C\u6210\u540E,\u53D6\u4EF6\u51ED\u8BC1\u4F1A\u51FA\u73B0\u5728\u8FD9\u91CC',\n\n    'flow.dropT': '\u5BC4\u4EF6',\n    'flow.dropS': '\u4E0A\u4F20\u6587\u4EF6\u6216\u6587\u672C,\u4EA4\u5BC4\u67DC\u53F0',\n    'flow.tickT': '\u51FA\u7968',\n    'flow.tickS': '\u751F\u6210 6 \u4F4D\u53D6\u4EF6\u53E3\u4EE4',\n    'flow.pickT': '\u53D6\u4EF6',\n    'flow.pickS': '\u5BF9\u65B9\u51ED\u7801\u4E00\u6B21\u9886\u8D70',\n\n    'route.senderT': '\u5BC4\u4EF6\u4EBA \xB7 \u4F60',\n    'route.senderS': '\u628A\u6587\u4EF6\u6216\u6587\u672C\u4EA4\u5BC4\u672C\u67DC\u53F0',\n    'route.relayT': '\u4E2D\u8F6C\u7AD9 \xB7 \u5728\u9014',\n    'route.relayS': 'Cloudflare \u8FB9\u7F18\u9650\u65F6\u4FDD\u7BA1',\n    'route.takerT': '\u53D6\u4EF6\u4EBA \xB7 \u5BF9\u65B9',\n    'route.takerS': '\u51ED 6 \u4F4D\u53E3\u4EE4\u9886\u53D6,\u903E\u671F\u9000\u56DE\u865A\u65E0',\n    'route.fine': '\u9650 \u6B21 \xB7 \u9650 \u65F6 \xB7 \u5230 \u671F \u5373 \u6BC1',\n\n    'feat.splitT': '\u5206\u7247\u76F4\u4F20', 'feat.splitS': '\u5355\u6587\u4EF6\u81F3\u9AD8 2 GB',\n    'feat.ttlT': '\u65F6\u6548\u53EF\u63A7', 'feat.ttlS': '1 ~ 30 \u5929\u6216\u6C38\u4E45',\n    'feat.limitT': '\u9650\u6B21\u53D6\u4EF6', 'feat.limitS': '1 \u6B21 \xB7 5 \u6B21 \xB7 \u4E0D\u9650',\n    'feat.selfT': '\u81EA\u6258\u7BA1', 'feat.selfS': '\u6570\u636E\u5728\u4F60\u81EA\u5DF1\u7684\u8D26\u53F7',\n    'qr.hint': '\u626B\u7801\u76F4\u63A5\u53D6\u4EF6',\n    'label.code': '\u53E3\u4EE4',\n    'label.link': '\u94FE\u63A5',\n    'copied': '{0}\u5DF2\u590D\u5236',\n    'copy.fail': '\u590D\u5236\u5931\u8D25,\u8BF7\u624B\u52A8\u590D\u5236',\n    'copied.btn': '\u2713 \u5DF2\u590D\u5236',\n\n    'meta.after': '{0}\u540E\u8FC7\u671F({1})',\n    'meta.forever': '\u6C38\u4E45\u6709\u6548',\n    'meta.pickups': '\u53EF\u53D6 {0} \u6B21',\n    'meta.unlimited': '\u53D6\u4EF6\u6B21\u6570\u4E0D\u9650',\n    'files.count': '{0} \u4E2A\u6587\u4EF6 \xB7 \u5171 {1}',\n    'unknown.type': '\u672A\u77E5\u7C7B\u578B',\n    'text.counter': '{0} / {1}',\n\n    'err.oversize': '\u6587\u4EF6\u8D85\u8FC7 {0} \u4E0A\u9650({1})',\n    'err.empty': '\u7A7A\u6587\u4EF6\u4E0D\u80FD\u5206\u4EAB',\n    'err.tooMany': '\u4E00\u6B21\u6700\u591A\u5206\u4EAB {0} \u4E2A\u6587\u4EF6',\n    'err.upload': '\u4E0A\u4F20\u5931\u8D25,\u8BF7\u91CD\u8BD5',\n    'err.submit': '\u63D0\u4EA4\u5931\u8D25',\n    'req.fail': '\u8BF7\u6C42\u5931\u8D25 ({0})',\n    'toast.cancelled': '\u5DF2\u53D6\u6D88\u4E0A\u4F20',\n\n    'dur.s': '{0} \u79D2',\n    'dur.ms': '<1 \u79D2',\n    'dur.hm': '{0} \u5206 {1} \u79D2',\n    'dur.h': '{0} \u5206',\n    'dur.hH': '{0} \u65F6 {1} \u5206',\n    'dur.hH2': '{0} \u65F6',\n    'dur.d': '{0} \u5929',\n\n    'pk.title': '\u8F93\u5165\u53D6\u4EF6\u53E3\u4EE4',\n    'pk.sub': '\u8F93\u5165 6 \u4F4D\u6570\u5B57\u53E3\u4EE4,\u53D6\u51FA\u5206\u4EAB\u7684\u6587\u4EF6\u6216\u6587\u672C',\n    'pk.aria': '6 \u4F4D\u53D6\u4EF6\u53E3\u4EE4',\n    'pk.fail': '\u53D6\u4EF6\u5931\u8D25',\n    'pk.textChars': '\u6587\u672C \xB7 {0} \u5B57\u7B26',\n    'pk.copyAllText': '\u4E00\u952E\u590D\u5236\u5168\u6587',\n    'pk.download': '\u2B07 \u4E0B\u8F7D\u6587\u4EF6',\n    'pk.again': '\u91CD\u65B0\u8F93\u5165',\n    'pk.expireAt': '{0} \u8FC7\u671F',\n    'pk.left': '\u5269\u4F59\u53EF\u53D6 {0} \u6B21',\n    'pk.unnamed': '\u672A\u547D\u540D\u6587\u4EF6',\n    'copied.text': '\u5DF2\u590D\u5236\u5168\u6587',\n\n    'ad.loginTitle': '\u7BA1\u7406\u767B\u5F55',\n    'ad.loginSub': '\u8F93\u5165\u90E8\u7F72\u65F6\u8BBE\u7F6E\u7684\u7BA1\u7406\u4EE4\u724C(ADMIN_TOKEN)',\n    'ad.tokenPh': '\u7BA1\u7406\u4EE4\u724C',\n    'ad.login': '\u767B\u5F55',\n    'ad.badToken': '\u4EE4\u724C\u65E0\u6548',\n    'ad.total': '\u5206\u4EAB\u603B\u6570',\n    'ad.active': '\u5F53\u524D\u6709\u6548',\n    'ad.files': '\u6587\u4EF6',\n    'ad.texts': '\u6587\u672C',\n    'ad.storage': '\u5360\u7528\u5B58\u50A8',\n    'ad.today': '\u4ECA\u65E5\u65B0\u589E',\n    'ad.th.code': '\u53E3\u4EE4', 'ad.th.kind': '\u7C7B\u578B', 'ad.th.content': '\u5185\u5BB9',\n    'ad.th.size': '\u5927\u5C0F', 'ad.th.pickups': '\u5DF2\u53D6/\u4E0A\u9650', 'ad.th.expire': '\u8FC7\u671F\u65F6\u95F4',\n    'ad.th.status': '\u72B6\u6001', 'ad.th.created': '\u521B\u5EFA\u65F6\u95F4',\n    'ad.kind.file': '\u6587\u4EF6', 'ad.kind.text': '\u6587\u672C',\n    'ad.st.active': '\u6709\u6548', 'ad.st.expired': '\u5DF2\u8FC7\u671F', 'ad.st.exhausted': '\u5DF2\u53D6\u5B8C',\n    'ad.loading': '\u52A0\u8F7D\u4E2D\u2026',\n    'ad.empty': '\u6682\u65E0\u5206\u4EAB',\n    'ad.loadFail': '\u52A0\u8F7D\u5931\u8D25',\n    'ad.page': '\u7B2C {0} / {1} \u9875 \xB7 \u5171 {2} \u6761',\n    'ad.prev': '\u4E0A\u4E00\u9875', 'ad.next': '\u4E0B\u4E00\u9875',\n    'ad.refresh': '\u21BB \u5237\u65B0',\n    'ad.logout': '\u9000\u51FA\u767B\u5F55',\n    'ad.delete': '\u5220\u9664',\n    'ad.deleted': '\u5DF2\u5220\u9664',\n    'ad.deleteFail': '\u5220\u9664\u5931\u8D25',\n    'ad.delTitle': '\u4F5C\u5E9F\u8FD9\u5F20\u53D6\u4EF6\u51ED\u8BC1?',\n    'ad.delWarn': '\u4F5C\u5E9F\u540E\u53E3\u4EE4\u7ACB\u5373\u5931\u6548,\u5BF9\u65B9\u5C06\u65E0\u6CD5\u53D6\u4EF6,\u4E14\u4E0D\u53EF\u6062\u590D\u3002',\n    'ad.delOk': '\u786E\u8BA4\u4F5C\u5E9F',\n    'ad.textFallback': '(\u6587\u672C)',\n    'ad.unnamed': '(\u672A\u547D\u540D)',\n    'ad.chars': '{0} \u5B57',\n    'ad.forever': '\u6C38\u4E45',\n\n    'nf.title': '\u9875\u9762\u4E0D\u5B58\u5728',\n    'nf.body': '\u4F60\u8981\u627E\u7684\u9875\u9762\u4E0D\u5728\u4E2D\u8F6C\u7AD9\u91CC',\n    'nf.send': '\u53BB\u53D1\u9001',\n    'nf.pickup': '\u53BB\u53D6\u4EF6',\n  },\n\n  en: {\n    'doc.send': 'file-relay - Send',\n    'doc.pickup': 'file-relay - Pickup',\n    'doc.admin': 'file-relay - Admin',\n    'doc.404': '404 - file-relay',\n\n    'brand.name': 'file-relay',\n    'brand.tagline': 'Files, picked up like parcels',\n    'brand.pickup': 'Pickup',\n    'brand.admin': 'Admin',\n    'nav.pickup': 'Pick up',\n    'nav.send': 'Send',\n    'nav.theme': 'Toggle theme',\n    'nav.lang': 'Switch language',\n    'foot': [\n      'Yours, from afar',\n      'Words run short, feelings run long',\n      'See you down the road',\n      'Signed, sealed, delivered',\n      'Through wind and rain, the relay waits',\n      'Take care, until next time',\n    ],\n\n    'tab.file': 'Send file',\n    'tab.text': 'Send text',\n    'dz.click': 'Click to choose files',\n    'dz.drop': ', or drag & drop / paste here',\n    'dz.aria': 'Choose files',\n    'dz.hint': 'A 6-digit pickup code is generated after upload',\n    'dz.hintMax': 'Up to {0} per file \xB7 multiple selection supported',\n    'remove': 'Remove',\n    'text.placeholder': 'Paste or type the text to share\u2026',\n    'opt.expiry': 'Expires',\n    'opt.pickups': 'Pickup limit',\n    'seg.1d': '1 day', 'seg.7d': '7 days', 'seg.30d': '30 days', 'seg.forever': 'Forever',\n    'seg.p1': '1\xD7', 'seg.p5': '5\xD7', 'seg.punlimited': 'Unlimited',\n    'btn.upload': 'Start upload',\n    'btn.genCode': 'Generate code',\n    'btn.cancel': 'Cancel',\n    'btn.copyCode': 'Copy code',\n    'btn.copyLink': 'Copy link',\n    'btn.copyAll': 'Copy all codes',\n    'btn.again': 'New share',\n\n    'prog.preparing': 'Preparing\u2026',\n    'prog.uploading': 'Uploading\u2026',\n    'prog.init': 'Initializing\u2026',\n    'prog.merging': 'Merging parts\u2026',\n    'prog.file': 'file {0}/{1}',\n    'prog.part': 'part {0}/{1}',\n    'prog.eta': 'ETA {0}',\n    'prog.retry': 'Upload failed, retrying {0}/3\u2026',\n\n    'result.ok': '\u2705 Shared! Send the code to the recipient',\n    'result.okBatch': '\u2705 {0} files shared successfully',\n    'ticket.title': 'PICKUP TICKET',\n    'ticket.no': '\u2116 {0}',\n    'send.cap': 'PARCEL FORM',\n    'receipt.cap': 'RECEIPT',\n    'ph.title': 'PENDING',\n    'ph.sub': 'Your pickup ticket will appear here after upload',\n\n    'flow.dropT': 'Send',\n    'flow.dropS': 'Upload files or text to the counter',\n    'flow.tickT': 'Ticket',\n    'flow.tickS': 'A 6-digit pickup code is issued',\n    'flow.pickT': 'Pick up',\n    'flow.pickS': 'The recipient claims it with the code',\n\n    'route.senderT': 'Sender \xB7 you',\n    'route.senderS': 'Hand your file or text to this counter',\n    'route.relayT': 'Relay \xB7 in transit',\n    'route.relayS': 'Held temporarily on Cloudflare edge',\n    'route.takerT': 'Recipient',\n    'route.takerS': 'Claims with the 6-digit code; unclaimed items vanish',\n    'route.fine': 'LIMITED \xB7 TIMED \xB7 DESTROYED ON EXPIRY',\n\n    'feat.splitT': 'Chunked upload', 'feat.splitS': 'Up to 2 GB per file',\n    'feat.ttlT': 'You set the clock', 'feat.ttlS': '1-30 days, or forever',\n    'feat.limitT': 'Limited pickups', 'feat.limitS': '1\xD7 \xB7 5\xD7 \xB7 unlimited',\n    'feat.selfT': 'Self-hosted', 'feat.selfS': 'Data stays in your account',\n    'qr.hint': 'Scan to pick up',\n    'label.code': 'code',\n    'label.link': 'link',\n    'copied': '{0} copied',\n    'copy.fail': 'Copy failed, please copy manually',\n    'copied.btn': '\u2713 Copied',\n\n    'meta.after': 'Expires in {0} ({1})',\n    'meta.forever': 'Never expires',\n    'meta.pickups': '{0} pickups allowed',\n    'meta.unlimited': 'Unlimited pickups',\n    'files.count': '{0} files \xB7 {1} total',\n    'unknown.type': 'unknown type',\n    'text.counter': '{0} / {1}',\n\n    'err.oversize': 'File exceeds the {0} limit ({1})',\n    'err.empty': 'Empty files cannot be shared',\n    'err.tooMany': 'Up to {0} files per batch',\n    'err.upload': 'Upload failed, please retry',\n    'err.submit': 'Submission failed',\n    'req.fail': 'Request failed ({0})',\n    'toast.cancelled': 'Upload cancelled',\n\n    'dur.s': '{0}s',\n    'dur.ms': '<1s',\n    'dur.hm': '{0}m {1}s',\n    'dur.h': '{0}m',\n    'dur.hH': '{0}h {1}m',\n    'dur.hH2': '{0}h',\n    'dur.d': '{0}d',\n\n    'pk.title': 'Enter pickup code',\n    'pk.sub': 'Enter the 6-digit code to retrieve the shared file or text',\n    'pk.aria': '6-digit pickup code',\n    'pk.fail': 'Pickup failed',\n    'pk.textChars': 'Text \xB7 {0} chars',\n    'pk.copyAllText': 'Copy all text',\n    'pk.download': '\u2B07 Download file',\n    'pk.again': 'Try another code',\n    'pk.expireAt': 'Expires {0}',\n    'pk.left': '{0} pickups left',\n    'pk.unnamed': 'Untitled file',\n    'copied.text': 'Full text copied',\n\n    'ad.loginTitle': 'Admin login',\n    'ad.loginSub': 'Enter the admin token (ADMIN_TOKEN) set at deployment',\n    'ad.tokenPh': 'Admin token',\n    'ad.login': 'Log in',\n    'ad.badToken': 'Invalid token',\n    'ad.total': 'Total shares',\n    'ad.active': 'Active',\n    'ad.files': 'Files',\n    'ad.texts': 'Texts',\n    'ad.storage': 'Storage used',\n    'ad.today': 'New today',\n    'ad.th.code': 'Code', 'ad.th.kind': 'Type', 'ad.th.content': 'Content',\n    'ad.th.size': 'Size', 'ad.th.pickups': 'Picked/Limit', 'ad.th.expire': 'Expires',\n    'ad.th.status': 'Status', 'ad.th.created': 'Created',\n    'ad.kind.file': 'File', 'ad.kind.text': 'Text',\n    'ad.st.active': 'Active', 'ad.st.expired': 'Expired', 'ad.st.exhausted': 'Exhausted',\n    'ad.loading': 'Loading\u2026',\n    'ad.empty': 'No shares yet',\n    'ad.loadFail': 'Failed to load',\n    'ad.page': 'Page {0} / {1} \xB7 {2} total',\n    'ad.prev': 'Prev', 'ad.next': 'Next',\n    'ad.refresh': '\u21BB Refresh',\n    'ad.logout': 'Log out',\n    'ad.delete': 'Delete',\n    'ad.deleted': 'Deleted',\n    'ad.deleteFail': 'Delete failed',\n    'ad.delTitle': 'Void this ticket?',\n    'ad.delWarn': 'The code stops working immediately, the recipient can no longer pick it up, and this cannot be undone.',\n    'ad.delOk': 'Void it',\n    'ad.textFallback': '(text)',\n    'ad.unnamed': '(unnamed)',\n    'ad.chars': '{0} chars',\n    'ad.forever': 'Forever',\n\n    'nf.title': 'Page not found',\n    'nf.body': \"The page you're looking for isn't in this relay\",\n    'nf.send': 'Send files',\n    'nf.pickup': 'Pick up',\n  },\n};\n\nexport let LANG =\n  localStorage.getItem('lang') ||\n  ((navigator.language || '').toLowerCase().startsWith('en') ? 'en' : 'zh');\n\n/** \u53D6\u8BCD:\u5F53\u524D\u8BED\u8A00 \u2192 \u4E2D\u6587\u515C\u5E95 \u2192 key \u672C\u8EAB;\u6570\u7EC4\u503C\u968F\u673A\u53D6\u4E00\u6761;{0}{1}\u2026 \u4F9D\u6B21\u66FF\u6362 */\nexport function t(key, ...args) {\n  let s = (DICT[LANG] && DICT[LANG][key]) ?? DICT.zh[key] ?? key;\n  if (Array.isArray(s)) s = s[Math.floor(Math.random() * s.length)];\n  args.forEach((v, i) => { s = s.replaceAll(`{${i}}`, String(v)); });\n  return s;\n}\n\nconst rerenders = [];\n/** \u5404\u9875\u9762\u767B\u8BB0:\u8BED\u8A00\u5207\u6362\u540E\u91CD\u7B97\u52A8\u6001\u6587\u6848 */\nexport function onLangChange(fn) { rerenders.push(fn); }\n\nfunction applyLang() {\n  document.documentElement.lang = LANG === 'en' ? 'en' : 'zh-CN';\n  document.querySelectorAll('[data-i18n]').forEach((n) => { n.textContent = t(n.dataset.i18n); });\n  document.querySelectorAll('[data-i18n-ph]').forEach((n) => { n.placeholder = t(n.dataset.i18nPh); });\n  document.querySelectorAll('[data-i18n-title]').forEach((n) => { n.title = t(n.dataset.i18nTitle); });\n  document.querySelectorAll('[data-i18n-aria]').forEach((n) => { n.setAttribute('aria-label', t(n.dataset.i18nAria)); });\n  const btn = document.getElementById('lang-btn');\n  if (btn) btn.textContent = LANG === 'en' ? '\u4E2D' : 'EN';\n}\n\nexport function initI18n() {\n  applyLang();\n  document.getElementById('lang-btn')?.addEventListener('click', () => {\n    LANG = LANG === 'en' ? 'zh' : 'en';\n    localStorage.setItem('lang', LANG);\n    applyLang();\n    rerenders.forEach((fn) => fn());\n  });\n}\n", "js/index.js": "import { $, $$, api, fmtBytes, fmtDate, fmtDuration, iconFor, copyText, toast, initTheme, el } from './common.js';\nimport { t, onLangChange, initI18n } from './i18n.js';\n\ninitTheme();\ninitI18n();\n\nconst els = {\n  dropzone: $('#dropzone'),\n  dzHint: $('#dz-hint'),\n  fileInput: $('#file-input'),\n  fileList: $('#file-list'),\n  textInput: $('#text-input'),\n  textCounter: $('#text-counter'),\n  btnUpload: $('#btn-upload'),\n  btnText: $('#btn-text'),\n  progress: $('#progress'),\n  progressFill: $('#progress-fill'),\n  progressText: $('#progress-text'),\n  btnCancel: $('#btn-cancel'),\n  results: $('#results'),\n  placeholder: $('#result-placeholder'),\n  capDate: $('#cap-date'),\n};\n\nconst MAX_SIZE_FALLBACK = 2 * 1024 * 1024 * 1024;\nconst MAX_BATCH = 10;\nlet cfg = { fileBackend: 'r2', maxFileSize: MAX_SIZE_FALLBACK }; // /api/config \u52A0\u8F7D\u540E\u8986\u76D6\nlet MAX_SIZE = MAX_SIZE_FALLBACK;\n\nlet files = []; // \u5F85\u4E0A\u4F20\u961F\u5217(File[])\nlet queueUI = new Map(); // File \u2192 { row, bar, status }\nlet queueState = new Map(); // File \u2192 'idle' | { done: code } | 'fail'(\u8BED\u8A00\u5207\u6362\u540E\u91CD\u6E32\u67D3\u7528)\nlet session = null; // \u8FDB\u884C\u4E2D\u7684 R2 \u5206\u7247\u4F1A\u8BDD { uploadId, partSize, parts }\nlet currentXhr = null;\nlet cancelled = false;\nlet uploading = false;\nlet lastResults = [];\n\n/* \u670D\u52A1\u7AEF\u914D\u7F6E:\u51B3\u5B9A\u8D70\u5206\u7247\u4E0A\u4F20(R2 \u5927\u5B58\u50A8)\u8FD8\u662F\u5355\u8BF7\u6C42\u76F4\u4F20(KV \u5C0F\u5B58\u50A8) */\nfunction updateHint() {\n  els.dzHint.textContent = t('dz.hintMax', fmtBytes(MAX_SIZE));\n}\n(async () => {\n  try {\n    cfg = await api('/api/config');\n    MAX_SIZE = cfg.maxFileSize || MAX_SIZE_FALLBACK;\n    updateHint();\n  } catch { /* \u4FDD\u6301\u9ED8\u8BA4 */ }\n})();\n\n/* \u5BC4\u4EF6\u5355\u62AC\u5934\u65E5\u671F(\u88C5\u9970) */\nif (els.capDate) els.capDate.textContent = fmtDate(Date.now()).split(' ')[0];\n\n/* \u8BED\u8A00\u5207\u6362:\u91CD\u7B97\u52A8\u6001\u6587\u6848\u4E0E\u7ED3\u679C\u5361\u7247 */\nonLangChange(() => {\n  if (cfg.maxFileSize) updateHint();\n  renderQueue();\n  if (lastResults.length) showResults(lastResults);\n});\n\n/* ---------- tabs ---------- */\n$$('.tab').forEach((tb) =>\n  tb.addEventListener('click', () => {\n    if (uploading) return; // \u4E0A\u4F20\u4E2D\u7981\u6B62\u5207\u6362\n    $$('.tab').forEach((x) => x.classList.toggle('active', x === tb));\n    const tab = tb.dataset.tab;\n    $('#panel-file').hidden = tab !== 'file';\n    $('#panel-text').hidden = tab !== 'text';\n    els.btnUpload.hidden = tab !== 'file';\n    els.btnText.hidden = tab !== 'text';\n    hideResult();\n  }),\n);\n\n/* ---------- segmented \u9009\u9879 ---------- */\nfor (const id of ['seg-expiry', 'seg-pickups']) {\n  $(`#${id}`).addEventListener('click', (e) => {\n    const b = e.target.closest('button');\n    if (!b) return;\n    $$('button', $(`#${id}`)).forEach((x) => x.classList.toggle('active', x === b));\n  });\n}\nfunction readOptions() {\n  const exp = $('#seg-expiry .active').dataset.v;\n  const pk = $('#seg-pickups .active').dataset.v;\n  return { expiry: exp, maxPickups: pk === 'null' ? null : Number(pk) };\n}\n\n/* ---------- \u6587\u4EF6\u961F\u5217:\u70B9\u51FB / \u5168\u7A97\u53E3\u62D6\u62FD / \u667A\u80FD\u7C98\u8D34,\u518D\u9009\u5373\u6574\u4F53\u66FF\u6362 ---------- */\nels.dropzone.addEventListener('click', () => els.fileInput.click());\nels.dropzone.addEventListener('keydown', (e) => {\n  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); els.fileInput.click(); }\n});\nels.fileInput.addEventListener('change', () => {\n  setFiles([...els.fileInput.files]);\n  els.fileInput.value = '';\n});\n\nfunction showTab(name) {\n  const tb = $(`.tab[data-tab=\"${name}\"]`);\n  if (tb && !tb.classList.contains('active')) tb.click(); // \u4E0A\u4F20\u4E2D\u65F6 tab \u5904\u7406\u5668\u81EA\u5DF1\u4F1A\u62D2\u7EDD\n}\n\n/* \u62D6\u5230\u9875\u9762\u4EFB\u610F\u4F4D\u7F6E\u90FD\u9AD8\u4EAE\u5E76\u53EF\u653E\u4E0B(\u4E0D\u518D\u8981\u6C42\u7CBE\u786E\u547D\u4E2D\u62D6\u62FD\u533A) */\nlet dragDepth = 0;\nwindow.addEventListener('dragenter', (e) => {\n  if (![...(e.dataTransfer?.types || [])].includes('Files')) return;\n  dragDepth++;\n  if (!uploading) els.dropzone.classList.add('dragover');\n});\nwindow.addEventListener('dragleave', () => {\n  if (--dragDepth <= 0) { dragDepth = 0; els.dropzone.classList.remove('dragover'); }\n});\nwindow.addEventListener('dragover', (e) => e.preventDefault());\nwindow.addEventListener('drop', (e) => {\n  e.preventDefault();\n  dragDepth = 0;\n  els.dropzone.classList.remove('dragover');\n  if (e.dataTransfer?.files?.length) setFiles([...e.dataTransfer.files]);\n});\n\n/* \u7C98\u8D34\u667A\u80FD\u8DEF\u7531:\u7C98\u8D34\u6587\u4EF6\u2192\u6587\u4EF6\u9875;\u6587\u4EF6\u9875\u7C98\u8D34\u7EAF\u6587\u672C\u2192\u81EA\u52A8\u5207\u5230\u6587\u672C\u9875 */\ndocument.addEventListener('paste', (e) => {\n  if (e.target?.closest?.('textarea, input')) return; // \u8F93\u5165\u6846\u5185\u7C98\u8D34\u8D70\u9ED8\u8BA4\u884C\u4E3A\n  if (e.clipboardData?.files?.length) {\n    setFiles([...e.clipboardData.files]);\n    return;\n  }\n  const text = e.clipboardData?.getData('text/plain');\n  if (text && $('#panel-text').hidden) {\n    showTab('text');\n    els.textInput.value = text;\n    els.textInput.dispatchEvent(new Event('input'));\n  }\n});\n\nfunction setFiles(list) {\n  if (uploading) return;\n  const ok = [];\n  for (const f of list) {\n    if (f.size > MAX_SIZE) { toast(t('err.oversize', fmtBytes(MAX_SIZE), fmtBytes(f.size)), 'error'); continue; }\n    if (f.size < 1) { toast(t('err.empty'), 'error'); continue; }\n    ok.push(f);\n  }\n  if (ok.length > MAX_BATCH) {\n    toast(t('err.tooMany', MAX_BATCH), 'error');\n    ok.length = MAX_BATCH;\n  }\n  files = ok; // \u66FF\u6362\u8BED\u4E49:\u518D\u6B21\u9009\u62E9\u5373\u91CD\u7F6E\u961F\u5217\n  queueState = new Map(files.map((f) => [f, 'idle']));\n  renderQueue();\n  els.btnUpload.disabled = files.length === 0;\n  hideResult();\n}\n\nfunction statusText(f, st) {\n  if (st === 'fail') return '\u2717';\n  if (st && st.done) return `\u2713 ${st.done}`;\n  return fmtBytes(f.size);\n}\n\nfunction renderQueue() {\n  els.fileList.replaceChildren();\n  queueUI = new Map();\n  files.forEach((f) => {\n    const st = queueState.get(f) || 'idle';\n    const bar = el('div', { class: 'fr-bar' });\n    const status = el('small', { class: 'fr-status' }, statusText(f, st));\n    const row = el('div', {\n      class: `file-row${st === 'fail' ? ' fail' : ''}${st && st.done ? ' done' : ''}`,\n    });\n    row.replaceChildren(\n      el('span', { class: 'fr-icon' }, iconFor(f.name, f.type)),\n      el('div', { class: 'fr-meta' },\n        el('b', { title: f.name }, f.name),\n        el('small', {}, `${fmtBytes(f.size)} \xB7 ${f.type || t('unknown.type')}`),\n      ),\n      status,\n      el('button', { class: 'icon-btn fr-remove', title: t('remove'), type: 'button', onclick: () => removeFile(f) }, '\u2715'),\n      bar,\n    );\n    if (st && st.done) bar.style.width = '100%';\n    queueUI.set(f, { row, bar, status });\n    els.fileList.append(row);\n  });\n  els.fileList.hidden = files.length === 0;\n  els.dropzone.hidden = files.length > 0;\n}\n\nfunction removeFile(f) {\n  if (uploading) return;\n  files = files.filter((x) => x !== f);\n  queueState.delete(f);\n  renderQueue();\n  els.btnUpload.disabled = files.length === 0;\n}\n\n/* ---------- \u6587\u672C\u8F93\u5165 ---------- */\nels.textInput.addEventListener('input', () => {\n  els.textCounter.textContent = t('text.counter', els.textInput.value.length, 65536);\n  els.btnText.disabled = !els.textInput.value.trim();\n});\n\n/* ---------- \u4E0A\u4F20:\u961F\u5217\u987A\u5E8F\u9010\u4E2A,\u805A\u5408\u8FDB\u5EA6 + \u6BCF\u884C\u8FF7\u4F60\u8FDB\u5EA6 ---------- */\nels.btnUpload.addEventListener('click', startUpload);\nels.btnCancel.addEventListener('click', cancelUpload);\nels.btnText.addEventListener('click', submitText);\n\nfunction sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }\n\nfunction xhrPut(url, blob, onProgress) {\n  return new Promise((resolve) => {\n    const xhr = new XMLHttpRequest();\n    currentXhr = xhr;\n    xhr.open('PUT', url);\n    xhr.onload = () => {\n      let etag = null;\n      try { etag = JSON.parse(xhr.responseText).etag; } catch { /* ignore */ }\n      resolve(xhr.status >= 200 && xhr.status < 300 && etag ? etag : null);\n    };\n    xhr.onerror = () => resolve(null);\n    xhr.onabort = () => resolve(null);\n    xhr.upload.onprogress = (e) => onProgress && e.lengthComputable && onProgress(e.loaded);\n    xhr.send(blob);\n  });\n}\n\n/** \u5355\u7247\u6700\u591A\u91CD\u8BD5 3 \u6B21,\u9000\u907F 1s/2s/4s */\nasync function putPartWithRetry(uploadId, n, blob, onProgress) {\n  for (let attempt = 0; attempt < 3; attempt++) {\n    if (cancelled) return null;\n    const etag = await xhrPut(`/api/uploads/${uploadId}/parts/${n}`, blob, onProgress);\n    if (etag) return etag;\n    await sleep([1000, 2000, 4000][attempt] || 4000);\n  }\n  return null;\n}\n\nfunction xhrJson(method, url, blob, onProgress) {\n  return new Promise((resolve) => {\n    const xhr = new XMLHttpRequest();\n    currentXhr = xhr;\n    xhr.open(method, url);\n    xhr.onload = () => {\n      if (xhr.status >= 200 && xhr.status < 300) {\n        try { resolve(JSON.parse(xhr.responseText)); return; } catch { /* fallthrough */ }\n      }\n      resolve(null);\n    };\n    xhr.onerror = () => resolve(null);\n    xhr.onabort = () => resolve(null);\n    xhr.upload.onprogress = (e) => onProgress && e.lengthComputable && onProgress(e.loaded);\n    xhr.send(blob);\n  });\n}\n\nlet speedState = { t: 0, loaded: 0, speed: 0 };\nlet curFileIdx = 0;\nlet curFileTotal = 1;\nfunction updateAggregate(loaded, total) {\n  const pct = Math.min(100, Math.floor((loaded / total) * 100));\n  els.progressFill.style.width = pct + '%';\n  const now = performance.now();\n  if (speedState.t && loaded > speedState.loaded) {\n    const inst = (loaded - speedState.loaded) / ((now - speedState.t) / 1000);\n    speedState.speed = speedState.speed ? speedState.speed * 0.7 + inst * 0.3 : inst;\n  }\n  speedState.t = now;\n  speedState.loaded = loaded;\n  let text = `${pct}% \xB7 ${fmtBytes(loaded)} / ${fmtBytes(total)} \xB7 ${fmtBytes(speedState.speed)}/s`;\n  if (speedState.speed > 1024 && loaded > 0 && loaded < total) {\n    text += ` \xB7 ${t('prog.eta', fmtDuration((total - loaded) / speedState.speed))}`;\n  }\n  if (curFileTotal > 1) text += ` \xB7 ${t('prog.file', curFileIdx, curFileTotal)}`;\n  els.progressText.textContent = text;\n}\n\n/** \u7B49\u5F85\u6001(\u521D\u59CB\u5316/\u91CD\u8BD5\u95F4\u9694/\u5408\u5E76\u5206\u7247):\u8FDB\u5EA6\u6761\u53E0\u52A0\u6D41\u5149\u52A8\u753B */\nfunction setPending(on) {\n  els.progressFill.classList.toggle('pending', on);\n}\n\nasync function startUpload() {\n  if (!files.length || uploading) return;\n  uploading = true;\n  cancelled = false;\n  speedState = { t: 0, loaded: 0, speed: 0 };\n  curFileIdx = 0;\n  curFileTotal = files.length;\n  const opts = readOptions();\n  const responses = [];\n  const totalBytes = files.reduce((s, f) => s + f.size, 0);\n  let baseBytes = 0;\n  setBusy(true);\n  els.progress.hidden = false;\n  els.progressFill.style.width = '0%';\n  setPending(false);\n  els.progressText.textContent = t('prog.preparing');\n\n  for (let i = 0; i < files.length; i++) {\n    if (cancelled) break;\n    const f = files[i];\n    const ui = queueUI.get(f);\n    curFileIdx = i + 1;\n    ui.row.classList.add('uploading');\n    els.progressText.textContent = t('prog.uploading');\n    const onProgress = (loaded) => {\n      ui.bar.style.width = Math.min(100, (loaded / f.size) * 100) + '%';\n      updateAggregate(baseBytes + loaded, totalBytes);\n    };\n    try {\n      const res = cfg.fileBackend === 'kv'\n        ? await directUpload(f, opts, onProgress)\n        : await multipartUpload(f, opts, onProgress);\n      responses.push(res);\n      baseBytes += f.size;\n      queueState.set(f, { done: res.code });\n      ui.bar.style.width = '100%';\n      ui.row.classList.add('done');\n      ui.status.textContent = `\u2713 ${res.code}`;\n    } catch (e) {\n      queueState.set(f, 'fail');\n      ui.row.classList.add('fail');\n      ui.status.textContent = '\u2717';\n      if (!cancelled) toast(`${f.name}: ${e.message || t('err.upload')}`, 'error');\n      break; // \u4E00\u4E2A\u5931\u8D25\u5373\u505C,\u4FDD\u7559\u961F\u5217\u4FBF\u4E8E\u5904\u7406\n    }\n  }\n\n  uploading = false;\n  els.progress.hidden = true;\n  setPending(false);\n  setBusy(false);\n  if (cancelled) toast(t('toast.cancelled'));\n  if (responses.length) showResults(responses);\n}\n\n/* ---------- \u5C0F\u5B58\u50A8\u6A21\u5F0F(KV):\u5355\u8BF7\u6C42\u76F4\u4F20,\u5931\u8D25\u6574\u6587\u4EF6\u91CD\u53D1 ---------- */\nasync function directUpload(f, opts, onProgress) {\n  const qs = new URLSearchParams({\n    filename: f.name,\n    mime: f.type || 'application/octet-stream',\n    expiry: opts.expiry,\n  });\n  if (opts.maxPickups !== null) qs.set('maxPickups', String(opts.maxPickups));\n\n  for (let attempt = 0; attempt < 3; attempt++) {\n    if (cancelled) throw new Error('cancelled');\n    setPending(false);\n    const res = await xhrJson('POST', `/api/shares/file?${qs}`, f, onProgress);\n    if (res) return res;\n    if (cancelled) throw new Error('cancelled');\n    setPending(true);\n    els.progressText.textContent = t('prog.retry', attempt + 1);\n    await sleep([1000, 2000][attempt] || 4000);\n  }\n  throw new Error(t('err.upload'));\n}\n\n/* ---------- \u5927\u5B58\u50A8\u6A21\u5F0F(R2):\u5206\u7247\u4E0A\u4F20 ---------- */\nasync function multipartUpload(f, opts, onProgress) {\n  setPending(true);\n  els.progressText.textContent = t('prog.init');\n  const init = await api('/api/uploads/init', {\n    method: 'POST',\n    body: { filename: f.name, size: f.size, mime: f.type || 'application/octet-stream', ...opts },\n  });\n  session = init;\n  setPending(false);\n\n  const etags = [];\n  let doneBytes = 0;\n  for (let i = 1; i <= init.parts; i++) {\n    const blob = f.slice((i - 1) * init.partSize, Math.min(i * init.partSize, f.size));\n    const etag = await putPartWithRetry(init.uploadId, i, blob, (loaded) =>\n      onProgress(doneBytes + loaded),\n    );\n    if (!etag) {\n      const wasCancelled = cancelled;\n      await abortUpload();\n      throw new Error(wasCancelled ? 'cancelled' : t('err.upload'));\n    }\n    etags.push({ partNumber: i, etag });\n    doneBytes += blob.size;\n  }\n  if (cancelled) throw new Error('cancelled');\n\n  els.progressFill.style.width = '100%';\n  setPending(true);\n  els.progressText.textContent = t('prog.merging');\n  try {\n    const res = await api(`/api/uploads/${init.uploadId}/complete`, {\n      method: 'POST',\n      body: { parts: etags },\n    });\n    session = null;\n    return res;\n  } catch (e) {\n    session = null;\n    throw e;\n  }\n}\n\nasync function cancelUpload() {\n  cancelled = true;\n  currentXhr?.abort();\n  await abortUpload();\n}\n\nasync function abortUpload() {\n  if (!session) return;\n  const id = session.uploadId;\n  session = null;\n  try { await api(`/api/uploads/${id}/abort`, { method: 'POST', body: {} }); } catch { /* ignore */ }\n}\n\nfunction setBusy(busy) {\n  els.btnUpload.disabled = busy || files.length === 0;\n  els.btnText.disabled = busy || !els.textInput.value.trim();\n}\n\n/* \u5237\u65B0/\u5173\u9875\u65F6\u5C3D\u529B\u901A\u77E5\u670D\u52A1\u7AEF\u653E\u5F03(\u4E0D\u662F\u65AD\u70B9\u7EED\u4F20) */\nwindow.addEventListener('pagehide', () => {\n  if (session) navigator.sendBeacon(`/api/uploads/${session.uploadId}/abort`);\n});\n\n/* ---------- \u6587\u672C\u5206\u4EAB ---------- */\nasync function submitText() {\n  const text = els.textInput.value;\n  if (!text.trim()) return;\n  setBusy(true);\n  try {\n    const res = await api('/api/shares/text', { method: 'POST', body: { text, ...readOptions() } });\n    showResults([res]);\n  } catch (e) {\n    toast(e.message || t('err.submit'), 'error');\n  } finally {\n    setBusy(false);\n  }\n}\n\n/* ---------- \u7ED3\u679C\u5361\u7247(\u591A\u6587\u4EF6\u65F6\u9010\u5F20\u5806\u53E0 + \u6279\u91CF\u5934\u90E8) ---------- */\nfunction qrSvgFor(url) {\n  /* vendored qrcode-generator:\u5168\u5C40 window.qrcode(classic script \u5148\u4E8E\u672C\u6A21\u5757\u52A0\u8F7D) */\n  try {\n    const qr = window.qrcode(0, 'M');\n    qr.addData(url);\n    qr.make();\n    const holder = document.createElement('div');\n    holder.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true, alt: t('qr.hint') });\n    return holder.firstElementChild;\n  } catch { return null; }\n}\n\nfunction metaText(r) {\n  const parts = [];\n  parts.push(r.expireAt\n    ? t('meta.after', fmtDuration((r.expireAt - Date.now()) / 1000), fmtDate(r.expireAt))\n    : t('meta.forever'));\n  parts.push(r.maxPickups === null || r.maxPickups === undefined ? t('meta.unlimited') : t('meta.pickups', r.maxPickups));\n  if (r.kind === 'file' && r.size) parts.push(fmtBytes(r.size));\n  return parts.join(' \xB7 ');\n}\n\n/* \u7ED3\u679C\u5361\u7247 = \u53D6\u4EF6\u51ED\u8BC1\u7968\u636E:\u7968\u5934(\u6807\u9898+\u2116) \u2192 \u7968\u8EAB(\u53E3\u4EE4+\u4E8C\u7EF4\u7801) \u2192 \u6495\u7968\u7EBF \u2192 \u7968\u811A(\u64CD\u4F5C) */\nfunction buildResultCard(r, compact) {\n  const link = `${location.origin}/pickup?code=${r.code}`;\n  const qr = qrSvgFor(link);\n  const col = el('div', { class: 'result-col' },\n    compact && r.kind === 'file' && r.filename ? el('div', { class: 'result-file-name' }, r.filename) : null,\n    el('div', { class: 'code' }, ...r.code.split('').map((d) => el('span', {}, d))),\n    el('div', { class: 'result-link' }, link),\n    el('div', { class: 'result-meta' }, metaText(r)),\n  );\n  const main = el('div', { class: 'result-main' },\n    qr ? el('div', { class: 'qr-wrap', title: t('qr.hint') }, qr, el('div', { class: 'qr-hint' }, t('qr.hint'))) : null,\n    col,\n  );\n  return el('div', { class: 'result' },\n    el('div', { class: 'tk-head' },\n      el('span', {}, t('ticket.title')),\n      el('span', { class: 'tk-no' }, t('ticket.no', r.code)),\n    ),\n    el('div', { class: 'tk-body' },\n      compact ? null : el('p', { class: 'result-title' }, t('result.ok')),\n      main,\n    ),\n    el('div', { class: 'tk-tear' }),\n    el('div', { class: 'tk-foot' },\n      el('button', { class: 'btn primary', type: 'button', onclick: (e) => copyBtn(e.currentTarget, r.code, t('label.code')) }, t('btn.copyCode')),\n      el('button', { class: 'btn', type: 'button', onclick: (e) => copyBtn(e.currentTarget, link, t('label.link')) }, t('btn.copyLink')),\n      compact ? null : el('button', { class: 'btn ghost', type: 'button', onclick: resetAll }, t('btn.again')),\n    ),\n  );\n}\n\nfunction showResults(list) {\n  lastResults = list;\n  if (els.placeholder) els.placeholder.hidden = true;\n  els.results.replaceChildren();\n  if (list.length > 1) {\n    els.results.append(\n      el('div', { class: 'result-batch-head' },\n        el('p', { class: 'result-title batch' }, t('result.okBatch', list.length)),\n        el('div', { class: 'btn-row' },\n          el('button', {\n            class: 'btn small', type: 'button',\n            onclick: async (e) => {\n              const ok = await copyText(list.map((r) => r.code).join('\\n'));\n              toast(ok ? t('copied', t('label.code')) : t('copy.fail'), ok ? 'ok' : 'error');\n            },\n          }, t('btn.copyAll')),\n          el('button', { class: 'btn small ghost', type: 'button', onclick: resetAll }, t('btn.again')),\n        ),\n      ),\n    );\n  }\n  for (const r of list) els.results.append(buildResultCard(r, list.length > 1));\n  els.results.scrollIntoView({ behavior: 'smooth', block: 'nearest' });\n}\n\nfunction resetAll() {\n  files = [];\n  queueState = new Map();\n  renderQueue();\n  els.btnUpload.disabled = true;\n  els.textInput.value = '';\n  els.textCounter.textContent = t('text.counter', 0, 65536);\n  els.btnText.disabled = true;\n  hideResult();\n}\n\n/** \u590D\u5236\u6210\u529F\u540E\u6309\u94AE\u77ED\u6682\u53D8\u6210\"\u2713 \u5DF2\u590D\u5236\" */\nasync function copyBtn(btn, text, label) {\n  const ok = await copyText(text);\n  toast(ok ? t('copied', label) : t('copy.fail'), ok ? 'ok' : 'error');\n  if (!ok) return;\n  btn.textContent = t('copied.btn');\n  btn.disabled = true;\n  setTimeout(() => { btn.textContent = label === t('label.code') ? t('btn.copyCode') : t('btn.copyLink'); btn.disabled = false; }, 1500);\n}\n\nfunction hideResult() {\n  lastResults = [];\n  if (els.placeholder) els.placeholder.hidden = false;\n  els.results.replaceChildren();\n}\n", "js/pickup.js": "import { $, $$, api, fmtBytes, fmtDate, copyText, toast, initTheme, el, iconFor } from './common.js';\nimport { t, onLangChange, initI18n } from './i18n.js';\n\ninitTheme();\ninitI18n();\n\nconst boxes = $$('.otp-box');\nconst row = $('#otp-row');\nconst errorBox = $('#pickup-error');\nconst resultCard = $('#pickup-result');\nlet querying = false;\nlet last = null; // { res, code } \u8BED\u8A00\u5207\u6362\u65F6\u91CD\u6E32\u67D3\n\nonLangChange(() => {\n  if (last && !resultCard.hidden) render(last.res, last.code);\n});\n\nfunction value() {\n  return boxes.map((b) => b.value).join('');\n}\n\n/* \u586B\u5165 1-6 \u4F4D\u6570\u5B57:\u591F 6 \u4F4D\u81EA\u52A8\u63D0\u4EA4,\u5426\u5219\u805A\u7126\u5230\u4E0B\u4E00\u4E2A\u7A7A\u683C */\nfunction fill(digits) {\n  boxes.forEach((b, i) => { b.value = digits[i] || ''; });\n  hideError();\n  if (digits.length === 6) {\n    boxes[5].focus();\n    if (!querying) submit();\n  } else {\n    boxes[Math.min(digits.length, 5)].focus();\n  }\n}\n\nboxes.forEach((box, i) => {\n  box.addEventListener('input', () => {\n    box.value = box.value.replace(/\\D/g, '').slice(0, 1);\n    hideError();\n    if (box.value && i < boxes.length - 1) boxes[i + 1].focus();\n    if (value().length === 6 && !querying) submit();\n  });\n  box.addEventListener('keydown', (e) => {\n    if (e.key === 'Backspace' && !box.value && i > 0) {\n      e.preventDefault();\n      boxes[i - 1].value = '';\n      boxes[i - 1].focus();\n    } else if (e.key === 'ArrowLeft' && i > 0) {\n      boxes[i - 1].focus();\n    } else if (e.key === 'ArrowRight' && i < boxes.length - 1) {\n      boxes[i + 1].focus();\n    } else if (e.key === 'Enter' && value().length === 6 && !querying) {\n      submit();\n    }\n  });\n  box.addEventListener('paste', (e) => {\n    e.preventDefault();\n    const digits = (e.clipboardData.getData('text') || '').replace(/\\D/g, '').slice(0, 6);\n    if (digits) fill(digits);\n  });\n  box.addEventListener('focus', () => box.select());\n});\n\nfunction showError(msg) {\n  errorBox.textContent = msg;\n  errorBox.hidden = false;\n  row.classList.remove('shake');\n  void row.offsetWidth; /* \u5F3A\u5236 reflow,\u91CD\u542F\u52A8\u753B */\n  row.classList.add('shake');\n}\nfunction hideError() {\n  errorBox.hidden = true;\n}\n\nasync function submit() {\n  const code = value();\n  querying = true;\n  hideError();\n  resultCard.hidden = true;\n  try {\n    const res = await api('/api/pickup', { method: 'POST', body: { code } });\n    render(res, code);\n  } catch (e) {\n    showError(e.message || t('pk.fail'));\n  } finally {\n    querying = false;\n  }\n}\n\nfunction metaLine(res) {\n  const parts = [];\n  parts.push(res.expireAt ? t('pk.expireAt', fmtDate(res.expireAt)) : t('meta.forever'));\n  parts.push(res.pickupsLeft === null || res.pickupsLeft === undefined ? t('meta.unlimited') : t('pk.left', res.pickupsLeft));\n  return parts.join(' \xB7 ');\n}\n\nfunction render(res, code) {\n  last = { res, code };\n  resultCard.replaceChildren();\n\n  if (res.kind === 'text') {\n    const pre = el('pre', { class: 'text-body' });\n    pre.textContent = res.text ?? '';\n    resultCard.append(\n      el('div', { class: 'share-card' },\n        el('span', { class: 'sc-icon' }, '\u{1F4DD}'),\n        el('div', { class: 'sc-meta' }, el('b', {}, t('pk.textChars', res.size))),\n      ),\n      pre,\n      el('div', { class: 'btn-row' },\n        el('button', { class: 'btn primary', onclick: async () => {\n          (await copyText(res.text)) ? toast(t('copied.text'), 'ok') : toast(t('copy.fail'), 'error');\n        } }, t('pk.copyAllText')),\n      ),\n    );\n  } else {\n    resultCard.append(\n      el('div', { class: 'share-card' },\n        el('span', { class: 'sc-icon' }, iconFor(res.filename, res.mime)),\n        el('div', { class: 'sc-meta' },\n          el('b', {}, res.filename || t('pk.unnamed')),\n          el('small', {}, `${fmtBytes(res.size)} \xB7 ${res.mime || t('unknown.type')}`),\n        ),\n      ),\n      el('a', {\n        class: 'btn primary block',\n        href: `/api/pickup/${code}/download`,\n        download: res.filename || 'file',\n      }, t('pk.download')),\n    );\n  }\n\n  resultCard.append(\n    el('div', { class: 'meta-line' }, metaLine(res)),\n    el('div', { class: 'btn-row' },\n      el('button', { class: 'btn ghost', onclick: reset }, t('pk.again')),\n    ),\n  );\n  resultCard.hidden = false;\n}\n\nfunction reset() {\n  last = null;\n  resultCard.hidden = true;\n  boxes.forEach((b) => { b.value = ''; });\n  hideError();\n  boxes[0].focus();\n}\n\n/* \u652F\u6301 /pickup?code=xxxxxx \u5E26\u53C2\u8FDB\u5165 */\nconst fromUrl = new URLSearchParams(location.search).get('code');\nif (fromUrl && /^\\d{1,6}$/.test(fromUrl)) {\n  fill(fromUrl.slice(0, 6));\n} else {\n  boxes[0].focus();\n}\n", "js/vendor/qrcode.js": `//---------------------------------------------------------------------
//
// QR Code Generator for JavaScript
//
// Copyright (c) 2009 Kazuhiko Arase
//
// URL: http://www.d-project.com/
//
// Licensed under the MIT license:
//  http://www.opensource.org/licenses/mit-license.php
//
// The word 'QR Code' is registered trademark of
// DENSO WAVE INCORPORATED
//  http://www.denso-wave.com/qrcode/faqpatent-e.html
//
//---------------------------------------------------------------------

var qrcode = function() {

  //---------------------------------------------------------------------
  // qrcode
  //---------------------------------------------------------------------

  /**
   * qrcode
   * @param typeNumber 1 to 40
   * @param errorCorrectionLevel 'L','M','Q','H'
   */
  var qrcode = function(typeNumber, errorCorrectionLevel) {

    var PAD0 = 0xEC;
    var PAD1 = 0x11;

    var _typeNumber = typeNumber;
    var _errorCorrectionLevel = QRErrorCorrectionLevel[errorCorrectionLevel];
    var _modules = null;
    var _moduleCount = 0;
    var _dataCache = null;
    var _dataList = [];

    var _this = {};

    var makeImpl = function(test, maskPattern) {

      _moduleCount = _typeNumber * 4 + 17;
      _modules = function(moduleCount) {
        var modules = new Array(moduleCount);
        for (var row = 0; row < moduleCount; row += 1) {
          modules[row] = new Array(moduleCount);
          for (var col = 0; col < moduleCount; col += 1) {
            modules[row][col] = null;
          }
        }
        return modules;
      }(_moduleCount);

      setupPositionProbePattern(0, 0);
      setupPositionProbePattern(_moduleCount - 7, 0);
      setupPositionProbePattern(0, _moduleCount - 7);
      setupPositionAdjustPattern();
      setupTimingPattern();
      setupTypeInfo(test, maskPattern);

      if (_typeNumber >= 7) {
        setupTypeNumber(test);
      }

      if (_dataCache == null) {
        _dataCache = createData(_typeNumber, _errorCorrectionLevel, _dataList);
      }

      mapData(_dataCache, maskPattern);
    };

    var setupPositionProbePattern = function(row, col) {

      for (var r = -1; r <= 7; r += 1) {

        if (row + r <= -1 || _moduleCount <= row + r) continue;

        for (var c = -1; c <= 7; c += 1) {

          if (col + c <= -1 || _moduleCount <= col + c) continue;

          if ( (0 <= r && r <= 6 && (c == 0 || c == 6) )
              || (0 <= c && c <= 6 && (r == 0 || r == 6) )
              || (2 <= r && r <= 4 && 2 <= c && c <= 4) ) {
            _modules[row + r][col + c] = true;
          } else {
            _modules[row + r][col + c] = false;
          }
        }
      }
    };

    var getBestMaskPattern = function() {

      var minLostPoint = 0;
      var pattern = 0;

      for (var i = 0; i < 8; i += 1) {

        makeImpl(true, i);

        var lostPoint = QRUtil.getLostPoint(_this);

        if (i == 0 || minLostPoint > lostPoint) {
          minLostPoint = lostPoint;
          pattern = i;
        }
      }

      return pattern;
    };

    var setupTimingPattern = function() {

      for (var r = 8; r < _moduleCount - 8; r += 1) {
        if (_modules[r][6] != null) {
          continue;
        }
        _modules[r][6] = (r % 2 == 0);
      }

      for (var c = 8; c < _moduleCount - 8; c += 1) {
        if (_modules[6][c] != null) {
          continue;
        }
        _modules[6][c] = (c % 2 == 0);
      }
    };

    var setupPositionAdjustPattern = function() {

      var pos = QRUtil.getPatternPosition(_typeNumber);

      for (var i = 0; i < pos.length; i += 1) {

        for (var j = 0; j < pos.length; j += 1) {

          var row = pos[i];
          var col = pos[j];

          if (_modules[row][col] != null) {
            continue;
          }

          for (var r = -2; r <= 2; r += 1) {

            for (var c = -2; c <= 2; c += 1) {

              if (r == -2 || r == 2 || c == -2 || c == 2
                  || (r == 0 && c == 0) ) {
                _modules[row + r][col + c] = true;
              } else {
                _modules[row + r][col + c] = false;
              }
            }
          }
        }
      }
    };

    var setupTypeNumber = function(test) {

      var bits = QRUtil.getBCHTypeNumber(_typeNumber);

      for (var i = 0; i < 18; i += 1) {
        var mod = (!test && ( (bits >> i) & 1) == 1);
        _modules[Math.floor(i / 3)][i % 3 + _moduleCount - 8 - 3] = mod;
      }

      for (var i = 0; i < 18; i += 1) {
        var mod = (!test && ( (bits >> i) & 1) == 1);
        _modules[i % 3 + _moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
      }
    };

    var setupTypeInfo = function(test, maskPattern) {

      var data = (_errorCorrectionLevel << 3) | maskPattern;
      var bits = QRUtil.getBCHTypeInfo(data);

      // vertical
      for (var i = 0; i < 15; i += 1) {

        var mod = (!test && ( (bits >> i) & 1) == 1);

        if (i < 6) {
          _modules[i][8] = mod;
        } else if (i < 8) {
          _modules[i + 1][8] = mod;
        } else {
          _modules[_moduleCount - 15 + i][8] = mod;
        }
      }

      // horizontal
      for (var i = 0; i < 15; i += 1) {

        var mod = (!test && ( (bits >> i) & 1) == 1);

        if (i < 8) {
          _modules[8][_moduleCount - i - 1] = mod;
        } else if (i < 9) {
          _modules[8][15 - i - 1 + 1] = mod;
        } else {
          _modules[8][15 - i - 1] = mod;
        }
      }

      // fixed module
      _modules[_moduleCount - 8][8] = (!test);
    };

    var mapData = function(data, maskPattern) {

      var inc = -1;
      var row = _moduleCount - 1;
      var bitIndex = 7;
      var byteIndex = 0;
      var maskFunc = QRUtil.getMaskFunction(maskPattern);

      for (var col = _moduleCount - 1; col > 0; col -= 2) {

        if (col == 6) col -= 1;

        while (true) {

          for (var c = 0; c < 2; c += 1) {

            if (_modules[row][col - c] == null) {

              var dark = false;

              if (byteIndex < data.length) {
                dark = ( ( (data[byteIndex] >>> bitIndex) & 1) == 1);
              }

              var mask = maskFunc(row, col - c);

              if (mask) {
                dark = !dark;
              }

              _modules[row][col - c] = dark;
              bitIndex -= 1;

              if (bitIndex == -1) {
                byteIndex += 1;
                bitIndex = 7;
              }
            }
          }

          row += inc;

          if (row < 0 || _moduleCount <= row) {
            row -= inc;
            inc = -inc;
            break;
          }
        }
      }
    };

    var createBytes = function(buffer, rsBlocks) {

      var offset = 0;

      var maxDcCount = 0;
      var maxEcCount = 0;

      var dcdata = new Array(rsBlocks.length);
      var ecdata = new Array(rsBlocks.length);

      for (var r = 0; r < rsBlocks.length; r += 1) {

        var dcCount = rsBlocks[r].dataCount;
        var ecCount = rsBlocks[r].totalCount - dcCount;

        maxDcCount = Math.max(maxDcCount, dcCount);
        maxEcCount = Math.max(maxEcCount, ecCount);

        dcdata[r] = new Array(dcCount);

        for (var i = 0; i < dcdata[r].length; i += 1) {
          dcdata[r][i] = 0xff & buffer.getBuffer()[i + offset];
        }
        offset += dcCount;

        var rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
        var rawPoly = qrPolynomial(dcdata[r], rsPoly.getLength() - 1);

        var modPoly = rawPoly.mod(rsPoly);
        ecdata[r] = new Array(rsPoly.getLength() - 1);
        for (var i = 0; i < ecdata[r].length; i += 1) {
          var modIndex = i + modPoly.getLength() - ecdata[r].length;
          ecdata[r][i] = (modIndex >= 0)? modPoly.getAt(modIndex) : 0;
        }
      }

      var totalCodeCount = 0;
      for (var i = 0; i < rsBlocks.length; i += 1) {
        totalCodeCount += rsBlocks[i].totalCount;
      }

      var data = new Array(totalCodeCount);
      var index = 0;

      for (var i = 0; i < maxDcCount; i += 1) {
        for (var r = 0; r < rsBlocks.length; r += 1) {
          if (i < dcdata[r].length) {
            data[index] = dcdata[r][i];
            index += 1;
          }
        }
      }

      for (var i = 0; i < maxEcCount; i += 1) {
        for (var r = 0; r < rsBlocks.length; r += 1) {
          if (i < ecdata[r].length) {
            data[index] = ecdata[r][i];
            index += 1;
          }
        }
      }

      return data;
    };

    var createData = function(typeNumber, errorCorrectionLevel, dataList) {

      var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectionLevel);

      var buffer = qrBitBuffer();

      for (var i = 0; i < dataList.length; i += 1) {
        var data = dataList[i];
        buffer.put(data.getMode(), 4);
        buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber) );
        data.write(buffer);
      }

      // calc num max data.
      var totalDataCount = 0;
      for (var i = 0; i < rsBlocks.length; i += 1) {
        totalDataCount += rsBlocks[i].dataCount;
      }

      if (buffer.getLengthInBits() > totalDataCount * 8) {
        throw 'code length overflow. ('
          + buffer.getLengthInBits()
          + '>'
          + totalDataCount * 8
          + ')';
      }

      // end code
      if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
        buffer.put(0, 4);
      }

      // padding
      while (buffer.getLengthInBits() % 8 != 0) {
        buffer.putBit(false);
      }

      // padding
      while (true) {

        if (buffer.getLengthInBits() >= totalDataCount * 8) {
          break;
        }
        buffer.put(PAD0, 8);

        if (buffer.getLengthInBits() >= totalDataCount * 8) {
          break;
        }
        buffer.put(PAD1, 8);
      }

      return createBytes(buffer, rsBlocks);
    };

    _this.addData = function(data, mode) {

      mode = mode || 'Byte';

      var newData = null;

      switch(mode) {
      case 'Numeric' :
        newData = qrNumber(data);
        break;
      case 'Alphanumeric' :
        newData = qrAlphaNum(data);
        break;
      case 'Byte' :
        newData = qr8BitByte(data);
        break;
      case 'Kanji' :
        newData = qrKanji(data);
        break;
      default :
        throw 'mode:' + mode;
      }

      _dataList.push(newData);
      _dataCache = null;
    };

    _this.isDark = function(row, col) {
      if (row < 0 || _moduleCount <= row || col < 0 || _moduleCount <= col) {
        throw row + ',' + col;
      }
      return _modules[row][col];
    };

    _this.getModuleCount = function() {
      return _moduleCount;
    };

    _this.make = function() {
      if (_typeNumber < 1) {
        var typeNumber = 1;

        for (; typeNumber < 40; typeNumber++) {
          var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, _errorCorrectionLevel);
          var buffer = qrBitBuffer();

          for (var i = 0; i < _dataList.length; i++) {
            var data = _dataList[i];
            buffer.put(data.getMode(), 4);
            buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber) );
            data.write(buffer);
          }

          var totalDataCount = 0;
          for (var i = 0; i < rsBlocks.length; i++) {
            totalDataCount += rsBlocks[i].dataCount;
          }

          if (buffer.getLengthInBits() <= totalDataCount * 8) {
            break;
          }
        }

        _typeNumber = typeNumber;
      }

      makeImpl(false, getBestMaskPattern() );
    };

    _this.createTableTag = function(cellSize, margin) {

      cellSize = cellSize || 2;
      margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

      var qrHtml = '';

      qrHtml += '<table style="';
      qrHtml += ' border-width: 0px; border-style: none;';
      qrHtml += ' border-collapse: collapse;';
      qrHtml += ' padding: 0px; margin: ' + margin + 'px;';
      qrHtml += '">';
      qrHtml += '<tbody>';

      for (var r = 0; r < _this.getModuleCount(); r += 1) {

        qrHtml += '<tr>';

        for (var c = 0; c < _this.getModuleCount(); c += 1) {
          qrHtml += '<td style="';
          qrHtml += ' border-width: 0px; border-style: none;';
          qrHtml += ' border-collapse: collapse;';
          qrHtml += ' padding: 0px; margin: 0px;';
          qrHtml += ' width: ' + cellSize + 'px;';
          qrHtml += ' height: ' + cellSize + 'px;';
          qrHtml += ' background-color: ';
          qrHtml += _this.isDark(r, c)? '#000000' : '#ffffff';
          qrHtml += ';';
          qrHtml += '"/>';
        }

        qrHtml += '</tr>';
      }

      qrHtml += '</tbody>';
      qrHtml += '</table>';

      return qrHtml;
    };

    _this.createSvgTag = function(cellSize, margin, alt, title) {

      var opts = {};
      if (typeof arguments[0] == 'object') {
        // Called by options.
        opts = arguments[0];
        // overwrite cellSize and margin.
        cellSize = opts.cellSize;
        margin = opts.margin;
        alt = opts.alt;
        title = opts.title;
      }

      cellSize = cellSize || 2;
      margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

      // Compose alt property surrogate
      alt = (typeof alt === 'string') ? {text: alt} : alt || {};
      alt.text = alt.text || null;
      alt.id = (alt.text) ? alt.id || 'qrcode-description' : null;

      // Compose title property surrogate
      title = (typeof title === 'string') ? {text: title} : title || {};
      title.text = title.text || null;
      title.id = (title.text) ? title.id || 'qrcode-title' : null;

      var size = _this.getModuleCount() * cellSize + margin * 2;
      var c, mc, r, mr, qrSvg='', rect;

      rect = 'l' + cellSize + ',0 0,' + cellSize +
        ' -' + cellSize + ',0 0,-' + cellSize + 'z ';

      qrSvg += '<svg version="1.1" xmlns="http://www.w3.org/2000/svg"';
      qrSvg += !opts.scalable ? ' width="' + size + 'px" height="' + size + 'px"' : '';
      qrSvg += ' viewBox="0 0 ' + size + ' ' + size + '" ';
      qrSvg += ' preserveAspectRatio="xMinYMin meet"';
      qrSvg += (title.text || alt.text) ? ' role="img" aria-labelledby="' +
          escapeXml([title.id, alt.id].join(' ').trim() ) + '"' : '';
      qrSvg += '>';
      qrSvg += (title.text) ? '<title id="' + escapeXml(title.id) + '">' +
          escapeXml(title.text) + '</title>' : '';
      qrSvg += (alt.text) ? '<description id="' + escapeXml(alt.id) + '">' +
          escapeXml(alt.text) + '</description>' : '';
      qrSvg += '<rect width="100%" height="100%" fill="white" cx="0" cy="0"/>';
      qrSvg += '<path d="';

      for (r = 0; r < _this.getModuleCount(); r += 1) {
        mr = r * cellSize + margin;
        for (c = 0; c < _this.getModuleCount(); c += 1) {
          if (_this.isDark(r, c) ) {
            mc = c*cellSize+margin;
            qrSvg += 'M' + mc + ',' + mr + rect;
          }
        }
      }

      qrSvg += '" stroke="transparent" fill="black"/>';
      qrSvg += '</svg>';

      return qrSvg;
    };

    _this.createDataURL = function(cellSize, margin) {

      cellSize = cellSize || 2;
      margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

      var size = _this.getModuleCount() * cellSize + margin * 2;
      var min = margin;
      var max = size - margin;

      return createDataURL(size, size, function(x, y) {
        if (min <= x && x < max && min <= y && y < max) {
          var c = Math.floor( (x - min) / cellSize);
          var r = Math.floor( (y - min) / cellSize);
          return _this.isDark(r, c)? 0 : 1;
        } else {
          return 1;
        }
      } );
    };

    _this.createImgTag = function(cellSize, margin, alt) {

      cellSize = cellSize || 2;
      margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

      var size = _this.getModuleCount() * cellSize + margin * 2;

      var img = '';
      img += '<img';
      img += '\\u0020src="';
      img += _this.createDataURL(cellSize, margin);
      img += '"';
      img += '\\u0020width="';
      img += size;
      img += '"';
      img += '\\u0020height="';
      img += size;
      img += '"';
      if (alt) {
        img += '\\u0020alt="';
        img += escapeXml(alt);
        img += '"';
      }
      img += '/>';

      return img;
    };

    var escapeXml = function(s) {
      var escaped = '';
      for (var i = 0; i < s.length; i += 1) {
        var c = s.charAt(i);
        switch(c) {
        case '<': escaped += '&lt;'; break;
        case '>': escaped += '&gt;'; break;
        case '&': escaped += '&amp;'; break;
        case '"': escaped += '&quot;'; break;
        default : escaped += c; break;
        }
      }
      return escaped;
    };

    var _createHalfASCII = function(margin) {
      var cellSize = 1;
      margin = (typeof margin == 'undefined')? cellSize * 2 : margin;

      var size = _this.getModuleCount() * cellSize + margin * 2;
      var min = margin;
      var max = size - margin;

      var y, x, r1, r2, p;

      var blocks = {
        '\u2588\u2588': '\u2588',
        '\u2588 ': '\u2580',
        ' \u2588': '\u2584',
        '  ': ' '
      };

      var blocksLastLineNoMargin = {
        '\u2588\u2588': '\u2580',
        '\u2588 ': '\u2580',
        ' \u2588': ' ',
        '  ': ' '
      };

      var ascii = '';
      for (y = 0; y < size; y += 2) {
        r1 = Math.floor((y - min) / cellSize);
        r2 = Math.floor((y + 1 - min) / cellSize);
        for (x = 0; x < size; x += 1) {
          p = '\u2588';

          if (min <= x && x < max && min <= y && y < max && _this.isDark(r1, Math.floor((x - min) / cellSize))) {
            p = ' ';
          }

          if (min <= x && x < max && min <= y+1 && y+1 < max && _this.isDark(r2, Math.floor((x - min) / cellSize))) {
            p += ' ';
          }
          else {
            p += '\u2588';
          }

          // Output 2 characters per pixel, to create full square. 1 character per pixels gives only half width of square.
          ascii += (margin < 1 && y+1 >= max) ? blocksLastLineNoMargin[p] : blocks[p];
        }

        ascii += '\\n';
      }

      if (size % 2 && margin > 0) {
        return ascii.substring(0, ascii.length - size - 1) + Array(size+1).join('\u2580');
      }

      return ascii.substring(0, ascii.length-1);
    };

    _this.createASCII = function(cellSize, margin) {
      cellSize = cellSize || 1;

      if (cellSize < 2) {
        return _createHalfASCII(margin);
      }

      cellSize -= 1;
      margin = (typeof margin == 'undefined')? cellSize * 2 : margin;

      var size = _this.getModuleCount() * cellSize + margin * 2;
      var min = margin;
      var max = size - margin;

      var y, x, r, p;

      var white = Array(cellSize+1).join('\u2588\u2588');
      var black = Array(cellSize+1).join('  ');

      var ascii = '';
      var line = '';
      for (y = 0; y < size; y += 1) {
        r = Math.floor( (y - min) / cellSize);
        line = '';
        for (x = 0; x < size; x += 1) {
          p = 1;

          if (min <= x && x < max && min <= y && y < max && _this.isDark(r, Math.floor((x - min) / cellSize))) {
            p = 0;
          }

          // Output 2 characters per pixel, to create full square. 1 character per pixels gives only half width of square.
          line += p ? white : black;
        }

        for (r = 0; r < cellSize; r += 1) {
          ascii += line + '\\n';
        }
      }

      return ascii.substring(0, ascii.length-1);
    };

    _this.renderTo2dContext = function(context, cellSize) {
      cellSize = cellSize || 2;
      var length = _this.getModuleCount();
      for (var row = 0; row < length; row++) {
        for (var col = 0; col < length; col++) {
          context.fillStyle = _this.isDark(row, col) ? 'black' : 'white';
          context.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
      }
    }

    return _this;
  };

  //---------------------------------------------------------------------
  // qrcode.stringToBytes
  //---------------------------------------------------------------------

  qrcode.stringToBytesFuncs = {
    'default' : function(s) {
      var bytes = [];
      for (var i = 0; i < s.length; i += 1) {
        var c = s.charCodeAt(i);
        bytes.push(c & 0xff);
      }
      return bytes;
    }
  };

  qrcode.stringToBytes = qrcode.stringToBytesFuncs['default'];

  //---------------------------------------------------------------------
  // qrcode.createStringToBytes
  //---------------------------------------------------------------------

  /**
   * @param unicodeData base64 string of byte array.
   * [16bit Unicode],[16bit Bytes], ...
   * @param numChars
   */
  qrcode.createStringToBytes = function(unicodeData, numChars) {

    // create conversion map.

    var unicodeMap = function() {

      var bin = base64DecodeInputStream(unicodeData);
      var read = function() {
        var b = bin.read();
        if (b == -1) throw 'eof';
        return b;
      };

      var count = 0;
      var unicodeMap = {};
      while (true) {
        var b0 = bin.read();
        if (b0 == -1) break;
        var b1 = read();
        var b2 = read();
        var b3 = read();
        var k = String.fromCharCode( (b0 << 8) | b1);
        var v = (b2 << 8) | b3;
        unicodeMap[k] = v;
        count += 1;
      }
      if (count != numChars) {
        throw count + ' != ' + numChars;
      }

      return unicodeMap;
    }();

    var unknownChar = '?'.charCodeAt(0);

    return function(s) {
      var bytes = [];
      for (var i = 0; i < s.length; i += 1) {
        var c = s.charCodeAt(i);
        if (c < 128) {
          bytes.push(c);
        } else {
          var b = unicodeMap[s.charAt(i)];
          if (typeof b == 'number') {
            if ( (b & 0xff) == b) {
              // 1byte
              bytes.push(b);
            } else {
              // 2bytes
              bytes.push(b >>> 8);
              bytes.push(b & 0xff);
            }
          } else {
            bytes.push(unknownChar);
          }
        }
      }
      return bytes;
    };
  };

  //---------------------------------------------------------------------
  // QRMode
  //---------------------------------------------------------------------

  var QRMode = {
    MODE_NUMBER :    1 << 0,
    MODE_ALPHA_NUM : 1 << 1,
    MODE_8BIT_BYTE : 1 << 2,
    MODE_KANJI :     1 << 3
  };

  //---------------------------------------------------------------------
  // QRErrorCorrectionLevel
  //---------------------------------------------------------------------

  var QRErrorCorrectionLevel = {
    L : 1,
    M : 0,
    Q : 3,
    H : 2
  };

  //---------------------------------------------------------------------
  // QRMaskPattern
  //---------------------------------------------------------------------

  var QRMaskPattern = {
    PATTERN000 : 0,
    PATTERN001 : 1,
    PATTERN010 : 2,
    PATTERN011 : 3,
    PATTERN100 : 4,
    PATTERN101 : 5,
    PATTERN110 : 6,
    PATTERN111 : 7
  };

  //---------------------------------------------------------------------
  // QRUtil
  //---------------------------------------------------------------------

  var QRUtil = function() {

    var PATTERN_POSITION_TABLE = [
      [],
      [6, 18],
      [6, 22],
      [6, 26],
      [6, 30],
      [6, 34],
      [6, 22, 38],
      [6, 24, 42],
      [6, 26, 46],
      [6, 28, 50],
      [6, 30, 54],
      [6, 32, 58],
      [6, 34, 62],
      [6, 26, 46, 66],
      [6, 26, 48, 70],
      [6, 26, 50, 74],
      [6, 30, 54, 78],
      [6, 30, 56, 82],
      [6, 30, 58, 86],
      [6, 34, 62, 90],
      [6, 28, 50, 72, 94],
      [6, 26, 50, 74, 98],
      [6, 30, 54, 78, 102],
      [6, 28, 54, 80, 106],
      [6, 32, 58, 84, 110],
      [6, 30, 58, 86, 114],
      [6, 34, 62, 90, 118],
      [6, 26, 50, 74, 98, 122],
      [6, 30, 54, 78, 102, 126],
      [6, 26, 52, 78, 104, 130],
      [6, 30, 56, 82, 108, 134],
      [6, 34, 60, 86, 112, 138],
      [6, 30, 58, 86, 114, 142],
      [6, 34, 62, 90, 118, 146],
      [6, 30, 54, 78, 102, 126, 150],
      [6, 24, 50, 76, 102, 128, 154],
      [6, 28, 54, 80, 106, 132, 158],
      [6, 32, 58, 84, 110, 136, 162],
      [6, 26, 54, 82, 110, 138, 166],
      [6, 30, 58, 86, 114, 142, 170]
    ];
    var G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0);
    var G18 = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0);
    var G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1);

    var _this = {};

    var getBCHDigit = function(data) {
      var digit = 0;
      while (data != 0) {
        digit += 1;
        data >>>= 1;
      }
      return digit;
    };

    _this.getBCHTypeInfo = function(data) {
      var d = data << 10;
      while (getBCHDigit(d) - getBCHDigit(G15) >= 0) {
        d ^= (G15 << (getBCHDigit(d) - getBCHDigit(G15) ) );
      }
      return ( (data << 10) | d) ^ G15_MASK;
    };

    _this.getBCHTypeNumber = function(data) {
      var d = data << 12;
      while (getBCHDigit(d) - getBCHDigit(G18) >= 0) {
        d ^= (G18 << (getBCHDigit(d) - getBCHDigit(G18) ) );
      }
      return (data << 12) | d;
    };

    _this.getPatternPosition = function(typeNumber) {
      return PATTERN_POSITION_TABLE[typeNumber - 1];
    };

    _this.getMaskFunction = function(maskPattern) {

      switch (maskPattern) {

      case QRMaskPattern.PATTERN000 :
        return function(i, j) { return (i + j) % 2 == 0; };
      case QRMaskPattern.PATTERN001 :
        return function(i, j) { return i % 2 == 0; };
      case QRMaskPattern.PATTERN010 :
        return function(i, j) { return j % 3 == 0; };
      case QRMaskPattern.PATTERN011 :
        return function(i, j) { return (i + j) % 3 == 0; };
      case QRMaskPattern.PATTERN100 :
        return function(i, j) { return (Math.floor(i / 2) + Math.floor(j / 3) ) % 2 == 0; };
      case QRMaskPattern.PATTERN101 :
        return function(i, j) { return (i * j) % 2 + (i * j) % 3 == 0; };
      case QRMaskPattern.PATTERN110 :
        return function(i, j) { return ( (i * j) % 2 + (i * j) % 3) % 2 == 0; };
      case QRMaskPattern.PATTERN111 :
        return function(i, j) { return ( (i * j) % 3 + (i + j) % 2) % 2 == 0; };

      default :
        throw 'bad maskPattern:' + maskPattern;
      }
    };

    _this.getErrorCorrectPolynomial = function(errorCorrectLength) {
      var a = qrPolynomial([1], 0);
      for (var i = 0; i < errorCorrectLength; i += 1) {
        a = a.multiply(qrPolynomial([1, QRMath.gexp(i)], 0) );
      }
      return a;
    };

    _this.getLengthInBits = function(mode, type) {

      if (1 <= type && type < 10) {

        // 1 - 9

        switch(mode) {
        case QRMode.MODE_NUMBER    : return 10;
        case QRMode.MODE_ALPHA_NUM : return 9;
        case QRMode.MODE_8BIT_BYTE : return 8;
        case QRMode.MODE_KANJI     : return 8;
        default :
          throw 'mode:' + mode;
        }

      } else if (type < 27) {

        // 10 - 26

        switch(mode) {
        case QRMode.MODE_NUMBER    : return 12;
        case QRMode.MODE_ALPHA_NUM : return 11;
        case QRMode.MODE_8BIT_BYTE : return 16;
        case QRMode.MODE_KANJI     : return 10;
        default :
          throw 'mode:' + mode;
        }

      } else if (type < 41) {

        // 27 - 40

        switch(mode) {
        case QRMode.MODE_NUMBER    : return 14;
        case QRMode.MODE_ALPHA_NUM : return 13;
        case QRMode.MODE_8BIT_BYTE : return 16;
        case QRMode.MODE_KANJI     : return 12;
        default :
          throw 'mode:' + mode;
        }

      } else {
        throw 'type:' + type;
      }
    };

    _this.getLostPoint = function(qrcode) {

      var moduleCount = qrcode.getModuleCount();

      var lostPoint = 0;

      // LEVEL1

      for (var row = 0; row < moduleCount; row += 1) {
        for (var col = 0; col < moduleCount; col += 1) {

          var sameCount = 0;
          var dark = qrcode.isDark(row, col);

          for (var r = -1; r <= 1; r += 1) {

            if (row + r < 0 || moduleCount <= row + r) {
              continue;
            }

            for (var c = -1; c <= 1; c += 1) {

              if (col + c < 0 || moduleCount <= col + c) {
                continue;
              }

              if (r == 0 && c == 0) {
                continue;
              }

              if (dark == qrcode.isDark(row + r, col + c) ) {
                sameCount += 1;
              }
            }
          }

          if (sameCount > 5) {
            lostPoint += (3 + sameCount - 5);
          }
        }
      };

      // LEVEL2

      for (var row = 0; row < moduleCount - 1; row += 1) {
        for (var col = 0; col < moduleCount - 1; col += 1) {
          var count = 0;
          if (qrcode.isDark(row, col) ) count += 1;
          if (qrcode.isDark(row + 1, col) ) count += 1;
          if (qrcode.isDark(row, col + 1) ) count += 1;
          if (qrcode.isDark(row + 1, col + 1) ) count += 1;
          if (count == 0 || count == 4) {
            lostPoint += 3;
          }
        }
      }

      // LEVEL3

      for (var row = 0; row < moduleCount; row += 1) {
        for (var col = 0; col < moduleCount - 6; col += 1) {
          if (qrcode.isDark(row, col)
              && !qrcode.isDark(row, col + 1)
              &&  qrcode.isDark(row, col + 2)
              &&  qrcode.isDark(row, col + 3)
              &&  qrcode.isDark(row, col + 4)
              && !qrcode.isDark(row, col + 5)
              &&  qrcode.isDark(row, col + 6) ) {
            lostPoint += 40;
          }
        }
      }

      for (var col = 0; col < moduleCount; col += 1) {
        for (var row = 0; row < moduleCount - 6; row += 1) {
          if (qrcode.isDark(row, col)
              && !qrcode.isDark(row + 1, col)
              &&  qrcode.isDark(row + 2, col)
              &&  qrcode.isDark(row + 3, col)
              &&  qrcode.isDark(row + 4, col)
              && !qrcode.isDark(row + 5, col)
              &&  qrcode.isDark(row + 6, col) ) {
            lostPoint += 40;
          }
        }
      }

      // LEVEL4

      var darkCount = 0;

      for (var col = 0; col < moduleCount; col += 1) {
        for (var row = 0; row < moduleCount; row += 1) {
          if (qrcode.isDark(row, col) ) {
            darkCount += 1;
          }
        }
      }

      var ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
      lostPoint += ratio * 10;

      return lostPoint;
    };

    return _this;
  }();

  //---------------------------------------------------------------------
  // QRMath
  //---------------------------------------------------------------------

  var QRMath = function() {

    var EXP_TABLE = new Array(256);
    var LOG_TABLE = new Array(256);

    // initialize tables
    for (var i = 0; i < 8; i += 1) {
      EXP_TABLE[i] = 1 << i;
    }
    for (var i = 8; i < 256; i += 1) {
      EXP_TABLE[i] = EXP_TABLE[i - 4]
        ^ EXP_TABLE[i - 5]
        ^ EXP_TABLE[i - 6]
        ^ EXP_TABLE[i - 8];
    }
    for (var i = 0; i < 255; i += 1) {
      LOG_TABLE[EXP_TABLE[i] ] = i;
    }

    var _this = {};

    _this.glog = function(n) {

      if (n < 1) {
        throw 'glog(' + n + ')';
      }

      return LOG_TABLE[n];
    };

    _this.gexp = function(n) {

      while (n < 0) {
        n += 255;
      }

      while (n >= 256) {
        n -= 255;
      }

      return EXP_TABLE[n];
    };

    return _this;
  }();

  //---------------------------------------------------------------------
  // qrPolynomial
  //---------------------------------------------------------------------

  function qrPolynomial(num, shift) {

    if (typeof num.length == 'undefined') {
      throw num.length + '/' + shift;
    }

    var _num = function() {
      var offset = 0;
      while (offset < num.length && num[offset] == 0) {
        offset += 1;
      }
      var _num = new Array(num.length - offset + shift);
      for (var i = 0; i < num.length - offset; i += 1) {
        _num[i] = num[i + offset];
      }
      return _num;
    }();

    var _this = {};

    _this.getAt = function(index) {
      return _num[index];
    };

    _this.getLength = function() {
      return _num.length;
    };

    _this.multiply = function(e) {

      var num = new Array(_this.getLength() + e.getLength() - 1);

      for (var i = 0; i < _this.getLength(); i += 1) {
        for (var j = 0; j < e.getLength(); j += 1) {
          num[i + j] ^= QRMath.gexp(QRMath.glog(_this.getAt(i) ) + QRMath.glog(e.getAt(j) ) );
        }
      }

      return qrPolynomial(num, 0);
    };

    _this.mod = function(e) {

      if (_this.getLength() - e.getLength() < 0) {
        return _this;
      }

      var ratio = QRMath.glog(_this.getAt(0) ) - QRMath.glog(e.getAt(0) );

      var num = new Array(_this.getLength() );
      for (var i = 0; i < _this.getLength(); i += 1) {
        num[i] = _this.getAt(i);
      }

      for (var i = 0; i < e.getLength(); i += 1) {
        num[i] ^= QRMath.gexp(QRMath.glog(e.getAt(i) ) + ratio);
      }

      // recursive call
      return qrPolynomial(num, 0).mod(e);
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // QRRSBlock
  //---------------------------------------------------------------------

  var QRRSBlock = function() {

    var RS_BLOCK_TABLE = [

      // L
      // M
      // Q
      // H

      // 1
      [1, 26, 19],
      [1, 26, 16],
      [1, 26, 13],
      [1, 26, 9],

      // 2
      [1, 44, 34],
      [1, 44, 28],
      [1, 44, 22],
      [1, 44, 16],

      // 3
      [1, 70, 55],
      [1, 70, 44],
      [2, 35, 17],
      [2, 35, 13],

      // 4
      [1, 100, 80],
      [2, 50, 32],
      [2, 50, 24],
      [4, 25, 9],

      // 5
      [1, 134, 108],
      [2, 67, 43],
      [2, 33, 15, 2, 34, 16],
      [2, 33, 11, 2, 34, 12],

      // 6
      [2, 86, 68],
      [4, 43, 27],
      [4, 43, 19],
      [4, 43, 15],

      // 7
      [2, 98, 78],
      [4, 49, 31],
      [2, 32, 14, 4, 33, 15],
      [4, 39, 13, 1, 40, 14],

      // 8
      [2, 121, 97],
      [2, 60, 38, 2, 61, 39],
      [4, 40, 18, 2, 41, 19],
      [4, 40, 14, 2, 41, 15],

      // 9
      [2, 146, 116],
      [3, 58, 36, 2, 59, 37],
      [4, 36, 16, 4, 37, 17],
      [4, 36, 12, 4, 37, 13],

      // 10
      [2, 86, 68, 2, 87, 69],
      [4, 69, 43, 1, 70, 44],
      [6, 43, 19, 2, 44, 20],
      [6, 43, 15, 2, 44, 16],

      // 11
      [4, 101, 81],
      [1, 80, 50, 4, 81, 51],
      [4, 50, 22, 4, 51, 23],
      [3, 36, 12, 8, 37, 13],

      // 12
      [2, 116, 92, 2, 117, 93],
      [6, 58, 36, 2, 59, 37],
      [4, 46, 20, 6, 47, 21],
      [7, 42, 14, 4, 43, 15],

      // 13
      [4, 133, 107],
      [8, 59, 37, 1, 60, 38],
      [8, 44, 20, 4, 45, 21],
      [12, 33, 11, 4, 34, 12],

      // 14
      [3, 145, 115, 1, 146, 116],
      [4, 64, 40, 5, 65, 41],
      [11, 36, 16, 5, 37, 17],
      [11, 36, 12, 5, 37, 13],

      // 15
      [5, 109, 87, 1, 110, 88],
      [5, 65, 41, 5, 66, 42],
      [5, 54, 24, 7, 55, 25],
      [11, 36, 12, 7, 37, 13],

      // 16
      [5, 122, 98, 1, 123, 99],
      [7, 73, 45, 3, 74, 46],
      [15, 43, 19, 2, 44, 20],
      [3, 45, 15, 13, 46, 16],

      // 17
      [1, 135, 107, 5, 136, 108],
      [10, 74, 46, 1, 75, 47],
      [1, 50, 22, 15, 51, 23],
      [2, 42, 14, 17, 43, 15],

      // 18
      [5, 150, 120, 1, 151, 121],
      [9, 69, 43, 4, 70, 44],
      [17, 50, 22, 1, 51, 23],
      [2, 42, 14, 19, 43, 15],

      // 19
      [3, 141, 113, 4, 142, 114],
      [3, 70, 44, 11, 71, 45],
      [17, 47, 21, 4, 48, 22],
      [9, 39, 13, 16, 40, 14],

      // 20
      [3, 135, 107, 5, 136, 108],
      [3, 67, 41, 13, 68, 42],
      [15, 54, 24, 5, 55, 25],
      [15, 43, 15, 10, 44, 16],

      // 21
      [4, 144, 116, 4, 145, 117],
      [17, 68, 42],
      [17, 50, 22, 6, 51, 23],
      [19, 46, 16, 6, 47, 17],

      // 22
      [2, 139, 111, 7, 140, 112],
      [17, 74, 46],
      [7, 54, 24, 16, 55, 25],
      [34, 37, 13],

      // 23
      [4, 151, 121, 5, 152, 122],
      [4, 75, 47, 14, 76, 48],
      [11, 54, 24, 14, 55, 25],
      [16, 45, 15, 14, 46, 16],

      // 24
      [6, 147, 117, 4, 148, 118],
      [6, 73, 45, 14, 74, 46],
      [11, 54, 24, 16, 55, 25],
      [30, 46, 16, 2, 47, 17],

      // 25
      [8, 132, 106, 4, 133, 107],
      [8, 75, 47, 13, 76, 48],
      [7, 54, 24, 22, 55, 25],
      [22, 45, 15, 13, 46, 16],

      // 26
      [10, 142, 114, 2, 143, 115],
      [19, 74, 46, 4, 75, 47],
      [28, 50, 22, 6, 51, 23],
      [33, 46, 16, 4, 47, 17],

      // 27
      [8, 152, 122, 4, 153, 123],
      [22, 73, 45, 3, 74, 46],
      [8, 53, 23, 26, 54, 24],
      [12, 45, 15, 28, 46, 16],

      // 28
      [3, 147, 117, 10, 148, 118],
      [3, 73, 45, 23, 74, 46],
      [4, 54, 24, 31, 55, 25],
      [11, 45, 15, 31, 46, 16],

      // 29
      [7, 146, 116, 7, 147, 117],
      [21, 73, 45, 7, 74, 46],
      [1, 53, 23, 37, 54, 24],
      [19, 45, 15, 26, 46, 16],

      // 30
      [5, 145, 115, 10, 146, 116],
      [19, 75, 47, 10, 76, 48],
      [15, 54, 24, 25, 55, 25],
      [23, 45, 15, 25, 46, 16],

      // 31
      [13, 145, 115, 3, 146, 116],
      [2, 74, 46, 29, 75, 47],
      [42, 54, 24, 1, 55, 25],
      [23, 45, 15, 28, 46, 16],

      // 32
      [17, 145, 115],
      [10, 74, 46, 23, 75, 47],
      [10, 54, 24, 35, 55, 25],
      [19, 45, 15, 35, 46, 16],

      // 33
      [17, 145, 115, 1, 146, 116],
      [14, 74, 46, 21, 75, 47],
      [29, 54, 24, 19, 55, 25],
      [11, 45, 15, 46, 46, 16],

      // 34
      [13, 145, 115, 6, 146, 116],
      [14, 74, 46, 23, 75, 47],
      [44, 54, 24, 7, 55, 25],
      [59, 46, 16, 1, 47, 17],

      // 35
      [12, 151, 121, 7, 152, 122],
      [12, 75, 47, 26, 76, 48],
      [39, 54, 24, 14, 55, 25],
      [22, 45, 15, 41, 46, 16],

      // 36
      [6, 151, 121, 14, 152, 122],
      [6, 75, 47, 34, 76, 48],
      [46, 54, 24, 10, 55, 25],
      [2, 45, 15, 64, 46, 16],

      // 37
      [17, 152, 122, 4, 153, 123],
      [29, 74, 46, 14, 75, 47],
      [49, 54, 24, 10, 55, 25],
      [24, 45, 15, 46, 46, 16],

      // 38
      [4, 152, 122, 18, 153, 123],
      [13, 74, 46, 32, 75, 47],
      [48, 54, 24, 14, 55, 25],
      [42, 45, 15, 32, 46, 16],

      // 39
      [20, 147, 117, 4, 148, 118],
      [40, 75, 47, 7, 76, 48],
      [43, 54, 24, 22, 55, 25],
      [10, 45, 15, 67, 46, 16],

      // 40
      [19, 148, 118, 6, 149, 119],
      [18, 75, 47, 31, 76, 48],
      [34, 54, 24, 34, 55, 25],
      [20, 45, 15, 61, 46, 16]
    ];

    var qrRSBlock = function(totalCount, dataCount) {
      var _this = {};
      _this.totalCount = totalCount;
      _this.dataCount = dataCount;
      return _this;
    };

    var _this = {};

    var getRsBlockTable = function(typeNumber, errorCorrectionLevel) {

      switch(errorCorrectionLevel) {
      case QRErrorCorrectionLevel.L :
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
      case QRErrorCorrectionLevel.M :
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
      case QRErrorCorrectionLevel.Q :
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
      case QRErrorCorrectionLevel.H :
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
      default :
        return undefined;
      }
    };

    _this.getRSBlocks = function(typeNumber, errorCorrectionLevel) {

      var rsBlock = getRsBlockTable(typeNumber, errorCorrectionLevel);

      if (typeof rsBlock == 'undefined') {
        throw 'bad rs block @ typeNumber:' + typeNumber +
            '/errorCorrectionLevel:' + errorCorrectionLevel;
      }

      var length = rsBlock.length / 3;

      var list = [];

      for (var i = 0; i < length; i += 1) {

        var count = rsBlock[i * 3 + 0];
        var totalCount = rsBlock[i * 3 + 1];
        var dataCount = rsBlock[i * 3 + 2];

        for (var j = 0; j < count; j += 1) {
          list.push(qrRSBlock(totalCount, dataCount) );
        }
      }

      return list;
    };

    return _this;
  }();

  //---------------------------------------------------------------------
  // qrBitBuffer
  //---------------------------------------------------------------------

  var qrBitBuffer = function() {

    var _buffer = [];
    var _length = 0;

    var _this = {};

    _this.getBuffer = function() {
      return _buffer;
    };

    _this.getAt = function(index) {
      var bufIndex = Math.floor(index / 8);
      return ( (_buffer[bufIndex] >>> (7 - index % 8) ) & 1) == 1;
    };

    _this.put = function(num, length) {
      for (var i = 0; i < length; i += 1) {
        _this.putBit( ( (num >>> (length - i - 1) ) & 1) == 1);
      }
    };

    _this.getLengthInBits = function() {
      return _length;
    };

    _this.putBit = function(bit) {

      var bufIndex = Math.floor(_length / 8);
      if (_buffer.length <= bufIndex) {
        _buffer.push(0);
      }

      if (bit) {
        _buffer[bufIndex] |= (0x80 >>> (_length % 8) );
      }

      _length += 1;
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // qrNumber
  //---------------------------------------------------------------------

  var qrNumber = function(data) {

    var _mode = QRMode.MODE_NUMBER;
    var _data = data;

    var _this = {};

    _this.getMode = function() {
      return _mode;
    };

    _this.getLength = function(buffer) {
      return _data.length;
    };

    _this.write = function(buffer) {

      var data = _data;

      var i = 0;

      while (i + 2 < data.length) {
        buffer.put(strToNum(data.substring(i, i + 3) ), 10);
        i += 3;
      }

      if (i < data.length) {
        if (data.length - i == 1) {
          buffer.put(strToNum(data.substring(i, i + 1) ), 4);
        } else if (data.length - i == 2) {
          buffer.put(strToNum(data.substring(i, i + 2) ), 7);
        }
      }
    };

    var strToNum = function(s) {
      var num = 0;
      for (var i = 0; i < s.length; i += 1) {
        num = num * 10 + chatToNum(s.charAt(i) );
      }
      return num;
    };

    var chatToNum = function(c) {
      if ('0' <= c && c <= '9') {
        return c.charCodeAt(0) - '0'.charCodeAt(0);
      }
      throw 'illegal char :' + c;
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // qrAlphaNum
  //---------------------------------------------------------------------

  var qrAlphaNum = function(data) {

    var _mode = QRMode.MODE_ALPHA_NUM;
    var _data = data;

    var _this = {};

    _this.getMode = function() {
      return _mode;
    };

    _this.getLength = function(buffer) {
      return _data.length;
    };

    _this.write = function(buffer) {

      var s = _data;

      var i = 0;

      while (i + 1 < s.length) {
        buffer.put(
          getCode(s.charAt(i) ) * 45 +
          getCode(s.charAt(i + 1) ), 11);
        i += 2;
      }

      if (i < s.length) {
        buffer.put(getCode(s.charAt(i) ), 6);
      }
    };

    var getCode = function(c) {

      if ('0' <= c && c <= '9') {
        return c.charCodeAt(0) - '0'.charCodeAt(0);
      } else if ('A' <= c && c <= 'Z') {
        return c.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
      } else {
        switch (c) {
        case ' ' : return 36;
        case '$' : return 37;
        case '%' : return 38;
        case '*' : return 39;
        case '+' : return 40;
        case '-' : return 41;
        case '.' : return 42;
        case '/' : return 43;
        case ':' : return 44;
        default :
          throw 'illegal char :' + c;
        }
      }
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // qr8BitByte
  //---------------------------------------------------------------------

  var qr8BitByte = function(data) {

    var _mode = QRMode.MODE_8BIT_BYTE;
    var _data = data;
    var _bytes = qrcode.stringToBytes(data);

    var _this = {};

    _this.getMode = function() {
      return _mode;
    };

    _this.getLength = function(buffer) {
      return _bytes.length;
    };

    _this.write = function(buffer) {
      for (var i = 0; i < _bytes.length; i += 1) {
        buffer.put(_bytes[i], 8);
      }
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // qrKanji
  //---------------------------------------------------------------------

  var qrKanji = function(data) {

    var _mode = QRMode.MODE_KANJI;
    var _data = data;

    var stringToBytes = qrcode.stringToBytesFuncs['SJIS'];
    if (!stringToBytes) {
      throw 'sjis not supported.';
    }
    !function(c, code) {
      // self test for sjis support.
      var test = stringToBytes(c);
      if (test.length != 2 || ( (test[0] << 8) | test[1]) != code) {
        throw 'sjis not supported.';
      }
    }('\\u53cb', 0x9746);

    var _bytes = stringToBytes(data);

    var _this = {};

    _this.getMode = function() {
      return _mode;
    };

    _this.getLength = function(buffer) {
      return ~~(_bytes.length / 2);
    };

    _this.write = function(buffer) {

      var data = _bytes;

      var i = 0;

      while (i + 1 < data.length) {

        var c = ( (0xff & data[i]) << 8) | (0xff & data[i + 1]);

        if (0x8140 <= c && c <= 0x9FFC) {
          c -= 0x8140;
        } else if (0xE040 <= c && c <= 0xEBBF) {
          c -= 0xC140;
        } else {
          throw 'illegal char at ' + (i + 1) + '/' + c;
        }

        c = ( (c >>> 8) & 0xff) * 0xC0 + (c & 0xff);

        buffer.put(c, 13);

        i += 2;
      }

      if (i < data.length) {
        throw 'illegal char at ' + (i + 1);
      }
    };

    return _this;
  };

  //=====================================================================
  // GIF Support etc.
  //

  //---------------------------------------------------------------------
  // byteArrayOutputStream
  //---------------------------------------------------------------------

  var byteArrayOutputStream = function() {

    var _bytes = [];

    var _this = {};

    _this.writeByte = function(b) {
      _bytes.push(b & 0xff);
    };

    _this.writeShort = function(i) {
      _this.writeByte(i);
      _this.writeByte(i >>> 8);
    };

    _this.writeBytes = function(b, off, len) {
      off = off || 0;
      len = len || b.length;
      for (var i = 0; i < len; i += 1) {
        _this.writeByte(b[i + off]);
      }
    };

    _this.writeString = function(s) {
      for (var i = 0; i < s.length; i += 1) {
        _this.writeByte(s.charCodeAt(i) );
      }
    };

    _this.toByteArray = function() {
      return _bytes;
    };

    _this.toString = function() {
      var s = '';
      s += '[';
      for (var i = 0; i < _bytes.length; i += 1) {
        if (i > 0) {
          s += ',';
        }
        s += _bytes[i];
      }
      s += ']';
      return s;
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // base64EncodeOutputStream
  //---------------------------------------------------------------------

  var base64EncodeOutputStream = function() {

    var _buffer = 0;
    var _buflen = 0;
    var _length = 0;
    var _base64 = '';

    var _this = {};

    var writeEncoded = function(b) {
      _base64 += String.fromCharCode(encode(b & 0x3f) );
    };

    var encode = function(n) {
      if (n < 0) {
        // error.
      } else if (n < 26) {
        return 0x41 + n;
      } else if (n < 52) {
        return 0x61 + (n - 26);
      } else if (n < 62) {
        return 0x30 + (n - 52);
      } else if (n == 62) {
        return 0x2b;
      } else if (n == 63) {
        return 0x2f;
      }
      throw 'n:' + n;
    };

    _this.writeByte = function(n) {

      _buffer = (_buffer << 8) | (n & 0xff);
      _buflen += 8;
      _length += 1;

      while (_buflen >= 6) {
        writeEncoded(_buffer >>> (_buflen - 6) );
        _buflen -= 6;
      }
    };

    _this.flush = function() {

      if (_buflen > 0) {
        writeEncoded(_buffer << (6 - _buflen) );
        _buffer = 0;
        _buflen = 0;
      }

      if (_length % 3 != 0) {
        // padding
        var padlen = 3 - _length % 3;
        for (var i = 0; i < padlen; i += 1) {
          _base64 += '=';
        }
      }
    };

    _this.toString = function() {
      return _base64;
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // base64DecodeInputStream
  //---------------------------------------------------------------------

  var base64DecodeInputStream = function(str) {

    var _str = str;
    var _pos = 0;
    var _buffer = 0;
    var _buflen = 0;

    var _this = {};

    _this.read = function() {

      while (_buflen < 8) {

        if (_pos >= _str.length) {
          if (_buflen == 0) {
            return -1;
          }
          throw 'unexpected end of file./' + _buflen;
        }

        var c = _str.charAt(_pos);
        _pos += 1;

        if (c == '=') {
          _buflen = 0;
          return -1;
        } else if (c.match(/^\\s$/) ) {
          // ignore if whitespace.
          continue;
        }

        _buffer = (_buffer << 6) | decode(c.charCodeAt(0) );
        _buflen += 6;
      }

      var n = (_buffer >>> (_buflen - 8) ) & 0xff;
      _buflen -= 8;
      return n;
    };

    var decode = function(c) {
      if (0x41 <= c && c <= 0x5a) {
        return c - 0x41;
      } else if (0x61 <= c && c <= 0x7a) {
        return c - 0x61 + 26;
      } else if (0x30 <= c && c <= 0x39) {
        return c - 0x30 + 52;
      } else if (c == 0x2b) {
        return 62;
      } else if (c == 0x2f) {
        return 63;
      } else {
        throw 'c:' + c;
      }
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // gifImage (B/W)
  //---------------------------------------------------------------------

  var gifImage = function(width, height) {

    var _width = width;
    var _height = height;
    var _data = new Array(width * height);

    var _this = {};

    _this.setPixel = function(x, y, pixel) {
      _data[y * _width + x] = pixel;
    };

    _this.write = function(out) {

      //---------------------------------
      // GIF Signature

      out.writeString('GIF87a');

      //---------------------------------
      // Screen Descriptor

      out.writeShort(_width);
      out.writeShort(_height);

      out.writeByte(0x80); // 2bit
      out.writeByte(0);
      out.writeByte(0);

      //---------------------------------
      // Global Color Map

      // black
      out.writeByte(0x00);
      out.writeByte(0x00);
      out.writeByte(0x00);

      // white
      out.writeByte(0xff);
      out.writeByte(0xff);
      out.writeByte(0xff);

      //---------------------------------
      // Image Descriptor

      out.writeString(',');
      out.writeShort(0);
      out.writeShort(0);
      out.writeShort(_width);
      out.writeShort(_height);
      out.writeByte(0);

      //---------------------------------
      // Local Color Map

      //---------------------------------
      // Raster Data

      var lzwMinCodeSize = 2;
      var raster = getLZWRaster(lzwMinCodeSize);

      out.writeByte(lzwMinCodeSize);

      var offset = 0;

      while (raster.length - offset > 255) {
        out.writeByte(255);
        out.writeBytes(raster, offset, 255);
        offset += 255;
      }

      out.writeByte(raster.length - offset);
      out.writeBytes(raster, offset, raster.length - offset);
      out.writeByte(0x00);

      //---------------------------------
      // GIF Terminator
      out.writeString(';');
    };

    var bitOutputStream = function(out) {

      var _out = out;
      var _bitLength = 0;
      var _bitBuffer = 0;

      var _this = {};

      _this.write = function(data, length) {

        if ( (data >>> length) != 0) {
          throw 'length over';
        }

        while (_bitLength + length >= 8) {
          _out.writeByte(0xff & ( (data << _bitLength) | _bitBuffer) );
          length -= (8 - _bitLength);
          data >>>= (8 - _bitLength);
          _bitBuffer = 0;
          _bitLength = 0;
        }

        _bitBuffer = (data << _bitLength) | _bitBuffer;
        _bitLength = _bitLength + length;
      };

      _this.flush = function() {
        if (_bitLength > 0) {
          _out.writeByte(_bitBuffer);
        }
      };

      return _this;
    };

    var getLZWRaster = function(lzwMinCodeSize) {

      var clearCode = 1 << lzwMinCodeSize;
      var endCode = (1 << lzwMinCodeSize) + 1;
      var bitLength = lzwMinCodeSize + 1;

      // Setup LZWTable
      var table = lzwTable();

      for (var i = 0; i < clearCode; i += 1) {
        table.add(String.fromCharCode(i) );
      }
      table.add(String.fromCharCode(clearCode) );
      table.add(String.fromCharCode(endCode) );

      var byteOut = byteArrayOutputStream();
      var bitOut = bitOutputStream(byteOut);

      // clear code
      bitOut.write(clearCode, bitLength);

      var dataIndex = 0;

      var s = String.fromCharCode(_data[dataIndex]);
      dataIndex += 1;

      while (dataIndex < _data.length) {

        var c = String.fromCharCode(_data[dataIndex]);
        dataIndex += 1;

        if (table.contains(s + c) ) {

          s = s + c;

        } else {

          bitOut.write(table.indexOf(s), bitLength);

          if (table.size() < 0xfff) {

            if (table.size() == (1 << bitLength) ) {
              bitLength += 1;
            }

            table.add(s + c);
          }

          s = c;
        }
      }

      bitOut.write(table.indexOf(s), bitLength);

      // end code
      bitOut.write(endCode, bitLength);

      bitOut.flush();

      return byteOut.toByteArray();
    };

    var lzwTable = function() {

      var _map = {};
      var _size = 0;

      var _this = {};

      _this.add = function(key) {
        if (_this.contains(key) ) {
          throw 'dup key:' + key;
        }
        _map[key] = _size;
        _size += 1;
      };

      _this.size = function() {
        return _size;
      };

      _this.indexOf = function(key) {
        return _map[key];
      };

      _this.contains = function(key) {
        return typeof _map[key] != 'undefined';
      };

      return _this;
    };

    return _this;
  };

  var createDataURL = function(width, height, getPixel) {
    var gif = gifImage(width, height);
    for (var y = 0; y < height; y += 1) {
      for (var x = 0; x < width; x += 1) {
        gif.setPixel(x, y, getPixel(x, y) );
      }
    }

    var b = byteArrayOutputStream();
    gif.write(b);

    var base64 = base64EncodeOutputStream();
    var bytes = b.toByteArray();
    for (var i = 0; i < bytes.length; i += 1) {
      base64.writeByte(bytes[i]);
    }
    base64.flush();

    return 'data:image/gif;base64,' + base64;
  };

  //---------------------------------------------------------------------
  // returns qrcode function.

  return qrcode;
}();

// multibyte support
!function() {

  qrcode.stringToBytesFuncs['UTF-8'] = function(s) {
    // http://stackoverflow.com/questions/18729405/how-to-convert-utf8-string-to-byte-array
    function toUTF8Array(str) {
      var utf8 = [];
      for (var i=0; i < str.length; i++) {
        var charcode = str.charCodeAt(i);
        if (charcode < 0x80) utf8.push(charcode);
        else if (charcode < 0x800) {
          utf8.push(0xc0 | (charcode >> 6),
              0x80 | (charcode & 0x3f));
        }
        else if (charcode < 0xd800 || charcode >= 0xe000) {
          utf8.push(0xe0 | (charcode >> 12),
              0x80 | ((charcode>>6) & 0x3f),
              0x80 | (charcode & 0x3f));
        }
        // surrogate pair
        else {
          i++;
          // UTF-16 encodes 0x10000-0x10FFFF by
          // subtracting 0x10000 and splitting the
          // 20 bits of 0x0-0xFFFFF into two halves
          charcode = 0x10000 + (((charcode & 0x3ff)<<10)
            | (str.charCodeAt(i) & 0x3ff));
          utf8.push(0xf0 | (charcode >>18),
              0x80 | ((charcode>>12) & 0x3f),
              0x80 | ((charcode>>6) & 0x3f),
              0x80 | (charcode & 0x3f));
        }
      }
      return utf8;
    }
    return toUTF8Array(s);
  };

}();

(function (factory) {
  if (typeof define === 'function' && define.amd) {
      define([], factory);
  } else if (typeof exports === 'object') {
      module.exports = factory();
  }
}(function () {
    return qrcode;
}));
`, "pickup.html": `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="\u8F93\u5165 6 \u4F4D\u53D6\u4EF6\u53E3\u4EE4,\u53D6\u51FA\u5206\u4EAB\u7ED9\u4F60\u7684\u6587\u4EF6\u6216\u6587\u672C">
<meta name="theme-color" content="#efe8d8">
<title data-i18n="doc.pickup">\u6587\u4EF6\u4E2D\u8F6C\u7AD9 - \u53D6\u4EF6</title>
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
    <div><b data-i18n="brand.name">\u6587\u4EF6\u4E2D\u8F6C\u7AD9</b><small data-i18n="brand.pickup">\u53D6\u4EF6</small></div>
  </div>
  <div class="actions">
    <button id="lang-btn" class="icon-btn lang-btn" data-i18n-title="nav.lang">EN</button>
    <button id="theme-btn" class="icon-btn" data-i18n-title="nav.theme">\u{1F317}</button>
    <a class="btn ghost small" href="/" data-i18n="nav.send">\u53D1\u9001</a>
  </div>
</header>

<main class="container narrow">
  <section class="card center" id="pickup-input-card">
    <h2 class="title" data-i18n="pk.title">\u8F93\u5165\u53D6\u4EF6\u53E3\u4EE4</h2>
    <p class="muted pk-sub" data-i18n="pk.sub">\u8F93\u5165 6 \u4F4D\u6570\u5B57\u53E3\u4EE4,\u53D6\u51FA\u5206\u4EAB\u7684\u6587\u4EF6\u6216\u6587\u672C</p>
    <div id="otp-row" class="otp-row" role="group" data-i18n-aria="pk.aria" aria-label="6 \u4F4D\u53D6\u4EF6\u53E3\u4EE4">
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

<footer class="foot" data-i18n="foot">\u89C1\u5B57\u5982\u9762</footer>

<script type="module" src="/js/pickup.js"><\/script>
</body>
</html>
`, "style.css": "/* ============================================================\n   \u90AE\u653F\u7968\u636E\u4E3B\u9898:\u725B\u76AE\u7EB8\u5E95 \xB7 \u58A8\u7EFF\u6CB9\u58A8 \xB7 \u6A59\u8272\u90AE\u6233 \xB7 \u786C\u6295\u5F71\u63CF\u8FB9\n   \u7ED3\u679C\u5361\u7247 = \u53D6\u4EF6\u51ED\u8BC1(\u7968\u5934 + \u90AE\u6233\u53E3\u4EE4\u74E6\u7247 + \u6495\u7968\u7EBF + \u7968\u811A)\n   ============================================================ */\n:root {\n  --bag: #efe8d8;            /* \u725B\u76AE\u7EB8\u5E95 */\n  --paper: #fffdf6;          /* \u7968\u636E\u7EB8\u9762 */\n  --ink: #26382c;            /* \u6CB9\u58A8(\u6B63\u6587/\u4E3B\u8272) */\n  --line: #26382c;           /* \u63CF\u8FB9 */\n  --muted: #6b7563;          /* \u892A\u8272\u58A8 */\n  --stamp: #d96f32;          /* \u90AE\u6233\u6A59 */\n  --stamp-dark: #b85a24;\n  --ok: #3c7a52;\n  --ok-soft: #eef3ec;\n  --danger: #b3403a;\n  --danger-soft: #f7e9e4;\n  --warn: #a2661c;\n  --warn-soft: #f8efdd;\n  --rowbg: #f7f2e4;          /* \u6587\u4EF6\u884C\u5E95 */\n  --track: #e6dfca;          /* \u8FDB\u5EA6\u69FD */\n  --tkhead-bg: #26382c;      /* \u7968\u5934\u5E95 */\n  --tkhead-fg: #f4efdd;      /* \u7968\u5934\u5B57 */\n  --hard: rgba(38, 56, 44, 0.9);   /* \u786C\u6295\u5F71 */\n  --mask: rgba(24, 20, 12, 0.55);  /* \u5F39\u7A97\u906E\u7F69 */\n  --hard-soft: rgba(38, 56, 44, 0.35);\n  --dots: rgba(38, 56, 44, 0.05);  /* \u7EB8\u9762\u7F51\u70B9\u7EB9\u7406 */\n  --radius: 14px;\n  --radius-sm: 9px;\n  --serif: Georgia, 'Times New Roman', 'Songti SC', 'SimSun', serif;\n  /* \u52A8\u6548\u8282\u594F */\n  --t-fast: 0.15s;\n  --t-med: 0.25s;\n  --t-slow: 0.35s;\n  --ease: cubic-bezier(0.2, 0, 0, 1);\n}\n[data-theme='dark'] {\n  /* \u58A8\u84DD\u591C\u822A:\u85CF\u84DD\u7EB8\u9762,\u84DD\u6A59\u4E92\u8865,\u90AE\u6233\u6A59\u591C\u91CC\u6700\u8DF3 */\n  --bag: #12161f;\n  --paper: #1a2130;\n  --ink: #e8e5d6;\n  --line: #46516b;\n  --muted: #a9b2c9;\n  --stamp: #e68d4f;\n  --stamp-dark: #c9702f;\n  --ok: #7fc79c;\n  --ok-soft: #254432;\n  --danger: #e08a7c;\n  --danger-soft: #462822;\n  --warn: #d9ab63;\n  --warn-soft: #413120;\n  --rowbg: #222b44;\n  --track: #151b28;\n  --tkhead-bg: #33415c;\n  --tkhead-fg: #f0eee0;\n  --hard: rgba(0, 0, 0, 0.5);\n  --hard-soft: rgba(0, 0, 0, 0.32);\n  /* \u6DF1\u8272\u4E0B\u540C\u900F\u660E\u5EA6\u7684\u906E\u7F69\u51E0\u4E4E\u770B\u4E0D\u51FA\u6765,\u52A0\u6DF1\u4E00\u6863\u4FDD\u4F4F\u5F39\u7A97\u4E0E\u80CC\u666F\u7684\u5206\u79BB\u611F */\n  --mask: rgba(4, 7, 14, 0.72);\n  --dots: rgba(232, 229, 214, 0.05);\n}\n\n* { box-sizing: border-box; }\n/* [hidden] \u515C\u5E95:\u7C7B\u4E0A\u7684 display:flex/inline-flex \u4F1A\u76D6\u8FC7 UA \u6837\u5F0F\u8868\u7684 [hidden]{display:none},\n   \u5BFC\u81F4 .result-placeholder/.file-list \u7B49\u8BBE\u4E86 hidden \u4ECD\u53EF\u89C1 */\n[hidden] { display: none !important; }\nhtml { -webkit-text-size-adjust: 100%; }\nbody {\n  margin: 0;\n  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, Roboto,\n    'PingFang SC', 'HarmonyOS Sans SC', 'MiSans', 'Microsoft YaHei', sans-serif;\n  font-size: 15px;\n  line-height: 1.6;\n  color: var(--ink);\n  min-height: 100vh;\n  /* \u7EB5\u5411 flex \u9AA8\u67B6:main \u5403\u6389\u5269\u4F59\u9AD8\u5EA6,\u9875\u811A\u8D34\u89C6\u53E3\u5E95 */\n  display: flex;\n  flex-direction: column;\n  background:\n    radial-gradient(var(--dots) 1px, transparent 1px) 0 0 / 22px 22px,\n    var(--bag);\n  -webkit-font-smoothing: antialiased;\n  text-rendering: optimizeLegibility;\n}\n\n::selection { background: var(--stamp); color: #fff; }\n\n/* \u7EC6\u6EDA\u52A8\u6761 */\n* { scrollbar-width: thin; scrollbar-color: var(--line) transparent; }\n::-webkit-scrollbar { width: 8px; height: 8px; }\n::-webkit-scrollbar-thumb { background: var(--line); border-radius: 999px; }\n::-webkit-scrollbar-track { background: transparent; }\n\n/* ============ \u9876\u680F ============ */\n.topbar {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 22px 20px 14px;\n  width: 100%; /* body \u6539\u7EB5\u5411 flex \u540E,auto margin \u6761\u76EE\u4F1A\u6536\u7F29\u5230\u5185\u5BB9\u5BBD,\u663E\u5F0F\u62C9\u6EE1\u518D\u7531 max-width \u6536\u53E3 */\n  max-width: 720px;\n  margin: 0 auto 26px;\n  border-bottom: 3px double var(--line);\n}\n.topbar.wide { max-width: 1080px; }\n.brand { display: flex; align-items: center; gap: 12px; }\n.brand .logo {\n  display: grid;\n  place-items: center;\n  width: 42px;\n  height: 42px;\n  font-size: 21px;\n  border-radius: 10px;\n  background: var(--paper);\n  border: 1.5px solid var(--line);\n  box-shadow: 3px 3px 0 var(--hard);\n}\n.brand b {\n  font-family: var(--serif);\n  font-size: 18px;\n  font-weight: 700;\n  display: block;\n  line-height: 1.25;\n  letter-spacing: 0.05em;\n}\n.brand small { color: var(--muted); font-size: 12px; }\n.actions { display: flex; align-items: center; gap: 8px; }\n\n/* ============ \u5E03\u5C40 ============ */\n.container { width: 100%; max-width: 720px; margin: 0 auto; padding: 8px 16px 48px; }\n.container.wide { max-width: 1080px; }\n.container.narrow { max-width: 460px; }\n.card {\n  background: var(--paper);\n  border: 1.5px solid var(--line);\n  border-radius: var(--radius);\n  box-shadow: 6px 6px 0 var(--hard);\n  padding: 24px;\n  margin-bottom: 18px;\n}\n.card.center { text-align: center; }\n.muted { color: var(--muted); }\n.row-between { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 8px; }\n\nmain { flex: 1 0 auto; } /* \u6491\u6EE1\u89C6\u53E3\u5269\u4F59\u9AD8\u5EA6,\u628A\u9875\u811A\u63A8\u5230\u5E95 */\n/* \u515C\u5E95:\u5373\u4F7F main \u6CA1\u6491\u5F00(\u5F02\u5E38\u9875\u9762)\u4E5F\u628A\u9875\u811A\u63A8\u5230\u5E95 */\n.foot {\n  margin-top: auto;\n  text-align: center;\n  color: var(--muted);\n  font-size: 12px;\n  letter-spacing: 0.14em;\n  padding: 32px 16px 10px;\n}\n\n/* ============ \u90AE\u8DEF\u4E09\u6B65\u6761(\u67DC\u53F0\u4E0A\u65B9:\u5BC4\u4EF6\u2192\u51FA\u7968\u2192\u53D6\u4EF6) ============ */\n.flow-strip {\n  display: flex;\n  align-items: center;\n  background: var(--paper);\n  border: 1.5px solid var(--line);\n  border-radius: 13px;\n  box-shadow: 6px 6px 0 var(--hard);\n  padding: 18px 26px;\n  margin-bottom: 24px;\n  animation: fade-up var(--t-slow) var(--ease) both;\n}\n.flow-step { flex: 1; display: flex; align-items: center; gap: 13px; min-width: 0; }\n.flow-dot {\n  width: 46px; height: 46px; flex: none;\n  border: 2.5px double var(--stamp); border-radius: 50%;\n  display: grid; place-items: center;\n  font-size: 20px; color: var(--stamp); font-family: var(--serif);\n}\n.flow-step:nth-child(1) .flow-dot { transform: rotate(-7deg); }\n.flow-step:nth-child(3) .flow-dot { transform: rotate(5deg); }\n.flow-step:nth-child(5) .flow-dot { transform: rotate(-4deg); }\n.flow-tt b { display: block; font-size: 14px; font-family: var(--serif); letter-spacing: 0.06em; }\n.flow-tt small { color: var(--muted); font-size: 12px; }\n.flow-link { flex: 0 0 58px; border-top: 2px dashed var(--line); margin: 0 12px; position: relative; }\n.flow-link::after {\n  content: '\u2708'; position: absolute; right: -4px; top: -11px;\n  font-size: 12px; color: var(--stamp);\n}\n\n/* ============ \u53D1\u9001\u9875:\u67DC\u53F0\u53CC\u680F(\u5DE6\u5BC4\u4EF6\u5355 / \u53F3\u56DE\u6267\u5E38\u9A7B) ============ */\n/* \u5185\u5BB9\u4E0D\u8DB3\u4E00\u5C4F\u65F6\u67DC\u53F0\u4E0A/\u4E0B\u7559\u767D\u5747\u8861;\u8D85\u51FA\u4E00\u5C4F\u65F6 main \u9AD8\u5EA6=\u5185\u5BB9\u9AD8,\u81EA\u52A8\u9000\u5316\u4E3A\u9876\u5BF9\u9F50 */\nmain:has(> .send-grid) { display: flex; flex-direction: column; justify-content: center; }\n.send-grid {\n  display: grid;\n  grid-template-columns: 1.4fr 1fr;\n  gap: 26px;\n  align-items: stretch; /* \u4E24\u680F\u540C\u9AD8:\u7A7A\u6001\u65F6\u53F3\u680F\u5360\u4F4D\u6491\u5230\u4E0E\u8868\u5355\u5361\u9F50\u5E95 */\n}\n.form-card { margin-bottom: 0; align-self: stretch; display: flex; flex-direction: column; } /* \u4E24\u680F\u9F50\u5E95:\u8868\u5355\u5361\u540C\u6837\u62C9\u4F38(\u56DE\u6267\u680F\u5185\u5BB9\u66F4\u9AD8\u65F6\u4E0D\u518D\u53C2\u5DEE) */\n/* \u62C9\u4F38\u540E\u7684\u591A\u4F59\u9AD8\u5EA6\u4EA4\u7ED9\u8F93\u5165\u533A\u5438\u6536:\u62D6\u62FD\u533A/\u6587\u672C\u6846/\u6587\u4EF6\u961F\u5217\u957F\u9AD8,\u9009\u9879\u548C\u6309\u94AE\u4E0D\u88AB\u9876\u5F97\u60AC\u7A7A */\n.form-card .panel { display: flex; flex-direction: column; flex: 1; }\n.form-card .dropzone, .form-card textarea, .form-card .file-list { flex: 1; }\n.form-card .dropzone { display: flex; flex-direction: column; justify-content: center; }\n.card-cap, .side-cap {\n  display: flex;\n  justify-content: space-between;\n  align-items: baseline;\n  margin: -4px 0 16px;\n  font-size: 11.5px;\n  letter-spacing: 0.3em;\n  color: var(--muted);\n  font-weight: 600;\n}\n.card-cap .cap-date {\n  font-family: var(--serif);\n  color: var(--stamp);\n  letter-spacing: 0.08em;\n  font-size: 12.5px;\n}\n/* \u53F3\u680F\u968F\u884C\u9AD8\u62C9\u4F38:sticky \u5728 stretch \u4E0B\u4E0D\u518D\u751F\u6548(\u4E24\u680F\u6C38\u8FDC\u540C\u9AD8,\u65E0\u53EF\u7C98\u6EDE\u4F59\u91CF),\u6539\u4E3A flex \u7EB5\u5411\u680F */\n.send-side { display: flex; flex-direction: column; min-width: 0; }\n.send-side .results { margin-top: 0; }\n/* \u56DE\u6267\u7A7A\u6001:\u5F85\u51FA\u7968\u90AE\u6233 */\n.result-placeholder {\n  border: 1.5px dashed var(--line);\n  border-radius: 13px;\n  padding: 38px 20px;\n  min-height: 340px; /* \u4E0E\u5DE6\u680F\u8868\u5355\u5361\u89C6\u89C9\u5E73\u8861 */\n  flex: 1; /* \u53F3\u680F\u88AB\u62C9\u4F38\u65F6\u5360\u4F4D\u968F\u4E4B\u957F\u9AD8,\u5E95\u8FB9\u4E0E\u8868\u5355\u5361\u5BF9\u9F50 */\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n  align-items: center;\n  text-align: center;\n  animation: fade-up var(--t-slow) var(--ease) both;\n}\n.ph-postmark {\n  width: 76px;\n  height: 76px;\n  margin: 0 auto 14px;\n  border: 2.5px double var(--stamp);\n  border-radius: 50%;\n  display: grid;\n  place-items: center;\n  color: var(--stamp);\n  font-family: var(--serif);\n  font-size: 10px;\n  letter-spacing: 0.22em;\n  text-indent: 0.22em; /* \u8865\u507F\u5B57\u8DDD,\u8BA9\u5706\u5F62\u90AE\u6233\u89C6\u89C9\u5C45\u4E2D */\n  transform: rotate(-8deg);\n  opacity: 0.8;\n}\n.result-placeholder p { margin: 0 0 4px; font-weight: 700; font-family: var(--serif); letter-spacing: 0.08em; }\n.result-placeholder small { color: var(--muted); font-size: 12.5px; }\n/* \u7A7A\u6001\u5185\u5D4C\u300C\u5728\u9014\u90AE\u8DEF\u300D\u7AD6\u5411\u65F6\u95F4\u7EBF:\u53F3\u680F\u4E0D\u7A7A */\n.ph-route { margin-top: 24px; width: 100%; max-width: 300px; text-align: left; }\n.ph-leg { display: flex; gap: 13px; align-items: flex-start; }\n.ph-ic {\n  width: 40px; height: 40px; flex: none;\n  border: 1.5px solid var(--line); border-radius: 50%;\n  background: var(--rowbg);\n  display: grid; place-items: center; font-size: 17px;\n}\n.ph-leg:nth-child(1) .ph-ic { transform: rotate(-6deg); }\n.ph-leg b { display: block; font-size: 13px; font-family: var(--serif); letter-spacing: 0.04em; }\n.ph-leg small { color: var(--muted); font-size: 11.5px; line-height: 1.5; }\n.ph-dash { width: 0; height: 22px; border-left: 2px dashed var(--line); margin: 3px 0 3px 19px; }\n.ph-fine {\n  margin-top: 22px; padding-top: 13px; width: 100%; max-width: 300px;\n  border-top: 1.5px dashed var(--line);\n  color: var(--muted); font-size: 11px; letter-spacing: 0.12em; text-align: center;\n}\n\n/* ============ \u6309\u94AE:\u90AE\u6233\u7AE0 ============ */\n.btn {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  gap: 6px;\n  padding: 9px 18px;\n  border-radius: var(--radius-sm);\n  border: 1.5px solid var(--line);\n  background: var(--paper);\n  color: var(--ink);\n  font-size: 14px;\n  font-weight: 600;\n  cursor: pointer;\n  text-decoration: none;\n  box-shadow: 2px 2px 0 var(--hard-soft);\n  transition: transform var(--t-fast), box-shadow var(--t-fast), background var(--t-fast), color var(--t-fast), opacity var(--t-fast);\n}\n.btn:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 var(--hard-soft); }\n.btn:active { transform: translate(1px, 1px); box-shadow: 1px 1px 0 var(--hard-soft); }\n.btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: 2px 2px 0 var(--hard-soft); }\n.btn.primary {\n  background: var(--tkhead-bg);\n  border-color: var(--line);\n  color: var(--tkhead-fg);\n  box-shadow: 3px 3px 0 var(--stamp);\n}\n.btn.primary:hover { transform: translate(-2px, -2px); box-shadow: 5px 5px 0 var(--stamp); }\n.btn.primary:active { transform: translate(1px, 1px); box-shadow: 1px 1px 0 var(--stamp); }\n.btn.primary:disabled { box-shadow: 2px 2px 0 var(--hard-soft); } /* \u7981\u7528\u65F6\u4E0D\u4EAE\u6A59\u5F71,\u907F\u514D\u8BEF\u8BFB\u4E3A\u53EF\u70B9 */\n.btn.ghost { background: transparent; box-shadow: none; border-color: var(--line); }\n.btn.ghost:hover { background: var(--rowbg); transform: none; }\n.btn.danger { background: var(--danger); border-color: var(--danger); color: #fff; box-shadow: 2px 2px 0 var(--hard-soft); }\n.btn.small { padding: 5px 12px; font-size: 13px; border-radius: 8px; }\n.btn.block { width: 100%; margin-top: 16px; }\n.btn-row { display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap; }\n.icon-btn {\n  background: transparent;\n  border: none;\n  font-size: 17px;\n  cursor: pointer;\n  color: var(--muted);\n  padding: 7px 9px;\n  border-radius: 8px;\n  transition: background var(--t-fast), color var(--t-fast);\n}\n.icon-btn:hover { background: var(--rowbg); color: var(--ink); }\n/* \u8BED\u8A00\u5207\u6362:\u663E\u793A\u76EE\u6807\u8BED\u8A00(\u7528\u5168\u58A8\u8272,\u907F\u514D\u6DF1\u8272\u6A21\u5F0F\u4E0B\u8FC7\u6DE1) */\n.lang-btn { font-size: 13px; font-weight: 700; letter-spacing: 0.02em; padding: 7px 10px; color: var(--ink); }\n.lang-float { position: fixed; top: 14px; right: 14px; z-index: 10; background: var(--paper); border: 1.5px solid var(--line); box-shadow: 3px 3px 0 var(--hard); }\n\n/* ============ Tabs:\u7968\u6839 ============ */\n.tabs { display: flex; gap: 10px; margin-bottom: 20px; }\n.tab {\n  flex: 1;\n  padding: 9px;\n  border: 1.5px dashed var(--line);\n  background: transparent;\n  border-radius: var(--radius-sm);\n  font-size: 14px;\n  font-weight: 600;\n  color: var(--muted);\n  cursor: pointer;\n  transition: color var(--t-fast), background var(--t-fast), border-color var(--t-fast);\n}\n.tab:hover { color: var(--ink); background: var(--rowbg); }\n.tab.active { border-style: solid; background: var(--tkhead-bg); border-color: var(--line); color: var(--tkhead-fg); }\n\n/* ============ \u62D6\u62FD\u533A:\u5305\u88F9\u5355 ============ */\n.dropzone {\n  border: 2px dashed var(--line);\n  border-radius: 12px;\n  padding: 36px 16px;\n  text-align: center;\n  cursor: pointer;\n  transition: background var(--t-fast);\n  outline: none;\n}\n.dropzone:hover, .dropzone:focus-visible, .dropzone.dragover { background: var(--rowbg); }\n.dz-icon { font-size: 34px; margin-bottom: 8px; transition: transform var(--t-med) ease; }\n.dropzone:hover .dz-icon, .dropzone.dragover .dz-icon { transform: scale(1.1) translateY(-2px); }\n.dropzone p { margin: 0 0 6px; font-size: 14px; }\n.dropzone p b { font-weight: 700; }\n.dropzone small { color: var(--muted); font-size: 13px; }\n\n/* ============ \u6587\u4EF6\u961F\u5217(\u591A\u9009\u6279\u91CF) ============ */\n.file-list { display: flex; flex-direction: column; gap: 8px; }\n.file-row {\n  position: relative;\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  background: var(--rowbg);\n  border: 1.5px solid var(--line);\n  border-radius: 10px;\n  padding: 10px 12px;\n  overflow: hidden;\n  animation: fade-up var(--t-slow) var(--ease) both;\n}\n.file-row.uploading { background: var(--warn-soft); }\n.file-row.done { background: var(--ok-soft); }\n.file-row.fail { background: var(--danger-soft); }\n.fr-icon { font-size: 20px; flex: none; }\n.fr-meta { flex: 1; min-width: 0; }\n.fr-meta b { display: block; font-size: 13.5px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.fr-meta small { color: var(--muted); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.fr-status { font-size: 12.5px; color: var(--muted); font-variant-numeric: tabular-nums; white-space: nowrap; font-family: var(--serif); }\n.file-row.done .fr-status { color: var(--ok); font-weight: 700; }\n.file-row.fail .fr-status { color: var(--danger); font-weight: 700; }\n.fr-remove { padding: 5px 7px; font-size: 13px; flex: none; }\n/* \u8FF7\u4F60\u8FDB\u5EA6\u6761:\u8D34\u884C\u5E95\u7F18(\u8721\u5C01\u6761) */\n.fr-bar {\n  position: absolute;\n  left: 0;\n  bottom: 0;\n  height: 3px;\n  width: 0;\n  border-radius: 999px;\n  background: var(--stamp);\n  transition: width var(--t-med) ease;\n}\n.file-row.done .fr-bar { width: 100%; background: var(--ok); }\n.file-row.fail .fr-bar { width: 100%; background: var(--danger); }\n\n/* ============ \u6587\u672C\u8F93\u5165 ============ */\ntextarea {\n  width: 100%;\n  border: 1.5px solid var(--line);\n  border-radius: 10px;\n  background: var(--paper);\n  color: var(--ink);\n  padding: 12px 14px;\n  font-size: 14px;\n  font-family: inherit;\n  line-height: 1.65;\n  resize: vertical;\n  transition: box-shadow var(--t-fast);\n}\ntextarea:focus { outline: none; box-shadow: 3px 3px 0 var(--hard-soft); }\n\n/* ============ \u9009\u9879 segmented:\u90AE\u8D44\u6807\u7B7E ============ */\n.options { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 22px; margin: 22px 0 6px; }\n.opt-group label {\n  display: block;\n  font-size: 11.5px;\n  color: var(--muted);\n  letter-spacing: 0.18em;\n  margin-bottom: 7px;\n}\n.seg { display: flex; gap: 6px; flex-wrap: wrap; }\n.seg button {\n  padding: 6px 13px;\n  border: 1.5px solid var(--line);\n  background: transparent;\n  border-radius: 8px;\n  font-size: 13px;\n  font-weight: 600;\n  color: var(--muted);\n  cursor: pointer;\n  transition: color var(--t-fast), background var(--t-fast);\n}\n.seg button:hover { color: var(--ink); background: var(--rowbg); }\n.seg button.active { background: var(--stamp); border-color: var(--stamp); color: #fff; }\n\n/* ============ \u8FDB\u5EA6\u6761 ============ */\n.progress { margin-top: 18px; }\n.bar {\n  height: 12px;\n  background: var(--track);\n  border: 1.5px solid var(--line);\n  border-radius: 999px;\n  overflow: hidden;\n}\n.bar > div {\n  height: 100%;\n  width: 0;\n  background: linear-gradient(90deg, var(--stamp-dark), var(--stamp));\n  border-radius: 999px;\n  transition: width var(--t-med) ease;\n}\n.progress small { color: var(--muted); font-variant-numeric: tabular-nums; }\n\n/* ============ \u7ED3\u679C:\u53D6\u4EF6\u51ED\u8BC1(\u7968\u636E) ============ */\n.results { display: flex; flex-direction: column; gap: 16px; margin-top: 20px; }\n.result {\n  background: var(--paper);\n  border: 1.5px solid var(--line);\n  border-radius: 13px;\n  box-shadow: 6px 6px 0 var(--hard);\n  overflow: hidden;\n}\n/* \u6279\u91CF\u5934\u90E8 */\n.result-batch-head {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n  flex-wrap: wrap;\n  padding: 13px 16px;\n  border-radius: 13px;\n  background: var(--ok-soft);\n  border: 1.5px solid var(--line);\n  box-shadow: 4px 4px 0 var(--hard);\n}\n.result-batch-head .result-title { margin: 0; }\n.result-batch-head .btn-row { margin: 0; flex-wrap: nowrap; }\n.result-title { margin: 0; font-weight: 700; font-size: 14.5px; }\n.result-title.batch { font-family: var(--serif); letter-spacing: 0.04em; }\n/* \u7968\u5934 */\n.tk-head {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  background: var(--tkhead-bg);\n  color: var(--tkhead-fg);\n  padding: 9px 16px;\n  font-size: 12px;\n  letter-spacing: 0.3em;\n  font-weight: 600;\n}\n.tk-head .tk-no { letter-spacing: 0.08em; color: var(--stamp); font-family: var(--serif); }\n/* \u7968\u8EAB */\n.tk-body { padding: 18px 16px 14px; text-align: center; }\n.result-main { display: flex; align-items: center; justify-content: center; gap: 22px; flex-wrap: wrap; }\n.result-col { display: flex; flex-direction: column; align-items: center; min-width: 0; }\n.result-file-name { font-size: 13px; color: var(--muted); word-break: break-all; margin-bottom: 2px; }\n/* \u53E3\u4EE4\u74E6\u7247:\u90AE\u6233 */\n.code { display: flex; justify-content: center; gap: 8px; margin: 8px 0 10px; }\n.code span {\n  display: grid;\n  place-items: center;\n  width: 46px;\n  height: 58px;\n  font-family: var(--serif);\n  font-size: 30px;\n  font-weight: 700;\n  font-variant-numeric: tabular-nums;\n  color: var(--ink);\n  background: var(--paper);\n  border: 1.5px solid var(--line);\n  border-radius: 7px;\n  box-shadow: 2px 2px 0 var(--hard-soft);\n  user-select: all;\n}\n.code span:nth-child(odd) { transform: rotate(-1.6deg); }\n.code span:nth-child(even) { transform: rotate(1.4deg); }\n.result-link { color: var(--muted); font-size: 12px; word-break: break-all; }\n.result-meta { color: var(--muted); font-size: 12.5px; margin-top: 8px; }\n/* \u4E8C\u7EF4\u7801:\u767D\u5E95\u4FDD\u8BC1\u6DF1\u8272\u6A21\u5F0F\u53EF\u626B\u63CF */\n.qr-wrap {\n  flex: none;\n  background: #fff;\n  padding: 8px;\n  border-radius: 9px;\n  border: 1.5px solid var(--line);\n  box-shadow: 2px 2px 0 var(--hard-soft);\n}\n.qr-wrap svg { display: block; width: 110px; height: 110px; }\n.qr-hint { text-align: center; font-size: 10.5px; color: #6b7280; margin-top: 5px; letter-spacing: 0.18em; }\n/* \u6495\u7968\u7EBF(\u5E26\u7F3A\u53E3) */\n.tk-tear { border-top: 2px dashed var(--line); position: relative; margin: 0 14px; }\n.tk-tear::before, .tk-tear::after {\n  content: '';\n  position: absolute;\n  top: -9px;\n  width: 16px;\n  height: 16px;\n  border-radius: 50%;\n  background: var(--bag);\n  border: 1.5px solid var(--line);\n}\n.tk-tear::before { left: -24px; }\n.tk-tear::after { right: -24px; }\n/* \u7968\u811A */\n.tk-foot { display: flex; gap: 10px; justify-content: center; padding: 14px; flex-wrap: wrap; }\n.result .btn-row { justify-content: center; }\n\n/* ============ \u7279\u6027\u5E26(\u67DC\u53F0\u4E0B\u65B9:\u4E00\u6392\u4E1A\u52A1\u516C\u544A\u7AE0) ============ */\n.feat-band { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 28px; }\n.feat {\n  background: var(--paper);\n  border: 1.5px dashed var(--line);\n  border-radius: 11px;\n  box-shadow: 3px 3px 0 var(--hard-soft);\n  padding: 14px 16px;\n  display: flex; gap: 12px; align-items: center;\n  animation: fade-up var(--t-slow) var(--ease) both;\n}\n.feat:nth-child(2) { transform: rotate(0.4deg); }\n.feat:nth-child(3) { transform: rotate(-0.3deg); }\n.feat-ic {\n  width: 40px; height: 40px; flex: none;\n  border: 2px double var(--stamp); border-radius: 50%;\n  display: grid; place-items: center; font-size: 17px;\n}\n.feat b { display: block; font-size: 13.5px; font-family: var(--serif); letter-spacing: 0.04em; }\n.feat small { color: var(--muted); font-size: 12px; }\n\n/* ============ \u53D6\u4EF6\u9875 ============ */\nh2.title { margin: 8px 0 6px; font-size: 22px; font-weight: 700; line-height: 1.3; font-family: var(--serif); letter-spacing: 0.04em; }\n.pk-sub { margin: 0 0 16px; font-size: 13.5px; }\n.error-box {\n  margin-top: 14px;\n  padding: 12px 14px;\n  border-radius: var(--radius-sm);\n  background: var(--danger-soft);\n  border: 1.5px solid var(--danger);\n  color: var(--danger);\n  font-size: 14px;\n}\n.share-card {\n  display: flex;\n  align-items: center;\n  gap: 14px;\n  background: var(--rowbg);\n  border: 1.5px dashed var(--line);\n  border-radius: 10px;\n  padding: 16px;\n}\n.sc-icon { font-size: 32px; }\n.sc-meta { flex: 1; min-width: 0; text-align: left; }\n.sc-meta b { display: block; font-size: 15px; font-weight: 700; word-break: break-all; }\n.sc-meta small { color: var(--muted); }\n.meta-line { color: var(--muted); font-size: 13px; margin: 12px 2px 0; text-align: left; }\npre.text-body {\n  background: var(--rowbg);\n  border: 1.5px solid var(--line);\n  border-radius: 10px;\n  padding: 14px 16px;\n  white-space: pre-wrap;\n  word-break: break-all;\n  font-size: 13px;\n  line-height: 1.7;\n  max-height: 340px;\n  overflow: auto;\n  margin: 0 0 4px;\n  text-align: left;\n}\n\n/* ============ \u7BA1\u7406\u9875 ============ */\n.stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-bottom: 18px; }\n.stat-card {\n  background: var(--paper);\n  border: 1.5px solid var(--line);\n  border-radius: 11px;\n  padding: 16px 12px;\n  text-align: center;\n  box-shadow: 3px 3px 0 var(--hard-soft);\n}\n.stat-card b { display: block; font-size: 24px; font-weight: 700; font-family: var(--serif); font-variant-numeric: tabular-nums; line-height: 1.3; }\n.stat-card small { color: var(--muted); font-size: 12px; letter-spacing: 0.08em; }\n.table-wrap { overflow-x: auto; }\ntable { width: 100%; border-collapse: collapse; font-size: 13px; }\nth, td { text-align: left; padding: 10px; border-bottom: 1px dashed var(--line); white-space: nowrap; }\nth { color: var(--muted); font-weight: 600; font-size: 11.5px; letter-spacing: 0.1em; }\ntbody tr:last-child td { border-bottom: none; }\ntbody tr:hover td { background: var(--rowbg); }\ntd.wrap { white-space: normal; min-width: 140px; max-width: 260px; overflow: hidden; text-overflow: ellipsis; }\n.badge {\n  display: inline-block;\n  padding: 2px 10px;\n  border-radius: 999px;\n  border: 1.5px solid transparent;\n  font-size: 12px;\n  font-weight: 600;\n}\n.badge.active { background: var(--ok-soft); color: var(--ok); border-color: var(--ok); }\n.badge.expired { background: var(--danger-soft); color: var(--danger); border-color: var(--danger); }\n.badge.exhausted { background: var(--warn-soft); color: var(--warn); border-color: var(--warn); }\n.badge.kind-file { background: transparent; color: var(--stamp); border-color: var(--stamp); }\n.badge.kind-text { background: transparent; color: var(--muted); border-color: var(--line); }\n.token-input {\n  width: 100%;\n  padding: 11px 13px;\n  border: 1.5px solid var(--line);\n  border-radius: var(--radius-sm);\n  background: var(--paper);\n  color: var(--ink);\n  font-size: 14px;\n  margin: 12px 0 4px;\n  transition: box-shadow var(--t-fast);\n}\n.token-input:focus { outline: none; box-shadow: 3px 3px 0 var(--hard-soft); }\n.admin-foot { margin-top: 18px; display: flex; justify-content: flex-end; }\n.pager-btns { display: flex; gap: 8px; }\n\n/* ============ \u4F5C\u5E9F\u786E\u8BA4\u5F39\u7A97(\u7BA1\u7406\u9875):\u7968\u636E\u5361 + \u786C\u504F\u79FB\u6295\u5F71 ============ */\n.modal-mask {\n  position: fixed;\n  inset: 0;\n  z-index: 90;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 20px;\n  background: var(--mask);\n}\n.modal-mask[hidden] { display: none; }\n.modal-card {\n  background: var(--paper);\n  border: 2px solid var(--line);\n  border-radius: var(--radius);\n  box-shadow: 8px 8px 0 var(--hard);\n  padding: 22px 22px 18px;\n  width: min(430px, 100%);\n  animation: pop-in 0.18s ease-out;\n}\n.modal-title { margin: 0 0 14px; font-family: var(--serif); font-size: 19px; letter-spacing: 0.04em; }\n.del-target {\n  border: 1.5px dashed var(--line);\n  border-radius: var(--radius-sm);\n  background: var(--rowbg);\n  padding: 10px 14px;\n  margin-bottom: 12px;\n  display: grid;\n  gap: 6px;\n}\n.del-line { display: flex; gap: 10px; align-items: baseline; min-width: 0; }\n.del-line > :first-child { flex: 0 0 4em; font-size: 12px; letter-spacing: 0.08em; }\n.del-line > :last-child { min-width: 0; overflow-wrap: anywhere; }\n.del-warn { margin: 0 0 16px; color: var(--danger); font-size: 13px; line-height: 1.5; }\n.modal-actions { display: flex; justify-content: flex-end; gap: 10px; }\n@keyframes pop-in { from { transform: translateY(8px); opacity: 0; } }\n\n/* ============ toast:\u58A8\u6761 ============ */\n#toast-host {\n  position: fixed;\n  bottom: calc(24px + env(safe-area-inset-bottom, 0px));\n  left: 50%;\n  transform: translateX(-50%);\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  z-index: 99;\n  pointer-events: none;\n}\n.toast {\n  background: var(--tkhead-bg);\n  color: var(--tkhead-fg);\n  padding: 10px 18px;\n  border: 1.5px solid var(--line);\n  border-radius: 10px;\n  font-size: 14px;\n  box-shadow: 3px 3px 0 var(--hard);\n  opacity: 0;\n  transform: translateY(8px);\n  transition: opacity var(--t-med), transform var(--t-med);\n}\n.toast.show { opacity: 1; transform: translateY(0); }\n.toast.ok { background: var(--ok); border-color: var(--ok); color: #fff; }\n.toast.error { background: var(--danger); border-color: var(--danger); color: #fff; }\n\n/* ============ \u79FB\u52A8\u7AEF ============ */\n/* \u53CC\u680F\u5E76\u56DE\u5355\u680F:\u53F3\u680F\u56DE\u5230\u8868\u5355\u4E0B\u65B9,\u7A7A\u6001\u5360\u4F4D\u9690\u85CF */\n@media (max-width: 880px) {\n  .send-grid { grid-template-columns: 1fr; gap: 18px; }\n  .send-side .side-cap, .result-placeholder { display: none; }\n  /* \u90AE\u8DEF\u6761\u7AD6\u6392,\u8FDE\u7EBF\u8F6C\u4E3A\u5411\u4E0B\u865A\u7EBF;\u7279\u6027\u5E26\u4E24\u5217 */\n  .flow-strip { flex-direction: column; align-items: stretch; gap: 14px; padding: 16px 18px; }\n  .flow-link { flex: 0 0 0; width: 0; height: 26px; border-top: none; border-left: 2px dashed var(--line); margin: 0 0 0 22px; }\n  .flow-link::after { right: -6px; top: 12px; }\n  .feat-band { grid-template-columns: repeat(2, 1fr); margin-top: 20px; gap: 12px; }\n}\n@media (max-width: 640px) {\n  .options { grid-template-columns: 1fr; }\n  .card { padding: 18px; }\n  .topbar { padding: 14px 16px 8px; }\n  .code { gap: 6px; }\n  .code span { width: 42px; height: 52px; font-size: 27px; }\n  .otp-row { gap: 6px; }\n  .otp-box { width: 42px; height: 54px; font-size: 24px; }\n  .btn-row .btn { flex: 1; }\n  th, td { padding: 8px 6px; }\n  .row-between { flex-wrap: wrap; }\n  .stat-card b { font-size: 21px; }\n  .result-main { gap: 14px; }\n  .qr-wrap svg { width: 92px; height: 92px; }\n  .tk-tear::before, .tk-tear::after { width: 13px; height: 13px; top: -7.5px; }\n  .tk-tear::before { left: -20px; }\n  .tk-tear::after { right: -20px; }\n}\n\n/* ============ \u52A8\u6548 ============ */\n@keyframes fade-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }\n@keyframes pop { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: none; } }\n.card { animation: fade-up var(--t-slow) var(--ease) both; }\n.result:not([hidden]) { animation: pop var(--t-slow) var(--ease) both; }\n\n@keyframes shake {\n  10%, 90% { transform: translateX(-2px); }\n  20%, 80% { transform: translateX(3px); }\n  30%, 50%, 70% { transform: translateX(-5px); }\n  40%, 60% { transform: translateX(5px); }\n}\n.shake { animation: shake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }\n\n/* \u952E\u76D8\u7126\u70B9\u53EF\u89C1\u6027 */\n.btn:focus-visible, .icon-btn:focus-visible, .tab:focus-visible,\n.seg button:focus-visible, a:focus-visible, .otp-box:focus-visible {\n  outline: 2px solid var(--stamp);\n  outline-offset: 2px;\n}\n\n/* \u53D6\u4EF6\u9875:6 \u683C\u53E3\u4EE4\u8F93\u5165(\u90AE\u6233\u683C) */\n.otp-row { display: flex; gap: 8px; justify-content: center; margin: 4px 0 8px; }\n.otp-box {\n  width: 46px;\n  height: 58px;\n  padding: 0;\n  text-align: center;\n  font-family: var(--serif);\n  font-size: 26px;\n  font-weight: 700;\n  font-variant-numeric: tabular-nums;\n  border: 1.5px solid var(--line);\n  border-radius: 9px;\n  background: var(--paper);\n  color: var(--ink);\n  caret-color: var(--stamp);\n  box-shadow: 2px 2px 0 var(--hard-soft);\n  transition: box-shadow var(--t-fast), border-color var(--t-fast);\n}\n.otp-box:focus { outline: none; border-color: var(--stamp); box-shadow: 3px 3px 0 var(--stamp); }\n\n/* \u8FDB\u5EA6\u6761:\u7B49\u5F85\u6001\u6D41\u5149 */\n@keyframes pending-slide { from { background-position: 0 0; } to { background-position: 34px 0; } }\n.bar > div.pending {\n  background-image: repeating-linear-gradient(\n    45deg,\n    rgba(255, 255, 255, 0) 0,\n    rgba(255, 255, 255, 0) 12px,\n    rgba(255, 255, 255, 0.3) 12px,\n    rgba(255, 255, 255, 0.3) 24px\n  );\n  background-size: 34px 34px;\n  animation: pending-slide 0.8s linear infinite;\n}\n\n.mono { font-family: ui-monospace, 'SF Mono', 'Cascadia Mono', Consolas, 'Courier New', monospace; font-variant-numeric: tabular-nums; }\n\n/* \u52A8\u753B\u654F\u611F\u7528\u6237 */\n@media (prefers-reduced-motion: reduce) {\n  *, *::before, *::after {\n    animation-duration: 0.01ms !important;\n    animation-iteration-count: 1 !important;\n    transition-duration: 0.01ms !important;\n  }\n}\n" });

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
      const page = all.slice(offset, offset + limit);
      let kept = page;
      const budget = 48 - Math.ceil(all.length / 1e3);
      if (page.length > 0 && page.length <= budget) {
        const alive = await Promise.all(
          page.map((x) => kv.get(SHARE_PREFIX + x.code).then((v) => v !== null))
        );
        kept = page.filter((_, i) => alive[i]);
      }
      const rows = kept.map(({ code, m }) => ({
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
      return { total: Math.max(0, all.length - (page.length - kept.length)), rows };
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
var CLEANUP_INTERVAL_MS = 6 * 36e5;
var CLEANUP_MARK_KEY = "sys:cleanup-at";
async function cleanupIfDue(env) {
  try {
    if (env.fileKV) {
      const last = Number(await env.fileKV.get(CLEANUP_MARK_KEY));
      if (Number.isFinite(last) && Date.now() - last < CLEANUP_INTERVAL_MS) return;
      await env.fileKV.put(CLEANUP_MARK_KEY, String(Date.now()));
    }
    await runCleanup(env);
  } catch {
  }
}
__name(cleanupIfDue, "cleanupIfDue");

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
  if (c.req.method === "POST" && c.req.path === "/api/admin/cleanup") {
    const bearer = c.req.header("Authorization");
    if (bearer?.startsWith("Bearer ") && await safeEqual(bearer.slice(7), c.env.ADMIN_TOKEN || "")) {
      return next();
    }
  }
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
  if (!rec) return c.json({ ok: true, already: true });
  if (rec.kind === "file") await deleteFile(c.env, rec.r2Key);
  await store.deleteByCode(code);
  return c.json({ ok: true });
});
adminRoutes.post(
  "/cleanup",
  async (c) => c.json({ ok: true, ...await runCleanup(c.env) })
);

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
app.get("/", (c, next) => {
  c.executionCtx.waitUntil(cleanupIfDue(c.env));
  return next();
});
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
  if (asset && (asset.status === 200 || asset.status === 304)) return asset;
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
