var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/asset-resolver.ts
var inline = null;
var revision = null;
function setInlineAssets(files, version) {
  inline = files;
  revision = version ?? null;
  etags.clear();
}
__name(setInlineAssets, "setInlineAssets");
function assetUrl(path) {
  return revision ? `${path}?v=${revision}` : path;
}
__name(assetUrl, "assetUrl");
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
    const headers = {
      etag,
      "cache-control": "no-cache",
      "cdn-cache-control": "no-store",
      "cloudflare-cdn-cache-control": "no-store"
    };
    if (revision) headers["x-file-relay-build"] = revision;
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
<link rel="stylesheet" href="/style.css?v=732e7eabbd2c58e9">
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
`, "admin-layout.css": "/* Approved combination: counter summary/controls, postal table and one enclosing panel. */\n.ui-combined[data-ui-surface=admin] .topbar.wide,\n.ui-combined[data-ui-surface=admin] .container.wide{width:calc(100% - 64px);max-width:1440px}\n.ui-combined .ui-header-band{background:transparent;border:0;margin-bottom:12px}\n.ui-combined .ui-header-band .topbar{min-height:92px;padding-block:14px;gap:28px}\n.ui-combined .admin-nav{align-items:center;gap:4px}\n.ui-combined .admin-nav-link{border:0;border-radius:20px;padding:10px 18px;min-height:38px;background:transparent;color:var(--muted);font-size:13px}\n.ui-combined .admin-nav-link[aria-pressed=true]{background:var(--rowbg);color:var(--ink);box-shadow:inset 0 -2px var(--stamp)}\n.ui-combined .logo{box-shadow:none}\n.ui-combined .btn{box-shadow:none;white-space:nowrap;min-height:36px;font-size:12px}\n.ui-combined .btn.primary{background:var(--tkhead-bg);color:var(--tkhead-fg);border-color:var(--line)}\n.ui-combined #admin-panel{background:var(--paper);border:1px solid color-mix(in srgb,var(--line) 42%,transparent);border-radius:24px;padding:26px 30px 0;box-shadow:0 18px 56px color-mix(in srgb,var(--mask) 24%,transparent)}\n.ui-combined .admin-page-heading{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-bottom:24px}\n.ui-combined .admin-page-heading h1{font:700 32px/1.2 var(--serif);margin:0}\n.ui-combined .stats-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);padding:0 0 24px;margin:0;border:0;border-radius:0;background:transparent;gap:24px;align-items:center}\n.ui-combined .stats-counts{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}\n.ui-combined .stats-counts .stat-card,\n.ui-combined .stats-counts .stat-card:first-child,\n.ui-combined .stats-counts .stat-card:last-child{grid-column:auto;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:9px;min-height:60px;padding:12px 0;border:0;border-radius:0;background:transparent;box-shadow:none;text-align:left}\n.ui-combined .stats-counts b{font:700 33px/1 var(--serif)}\n.ui-combined .stats-counts small{font-size:11px;letter-spacing:0;white-space:nowrap;color:var(--muted)}\n.ui-combined .stats-counts .stat-card:nth-child(2) b{color:var(--ok)}\n.ui-combined .storage-overview{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}\n.ui-combined .storage-card{display:grid;grid-template-columns:1fr;gap:10px;min-width:0;min-height:0;background:var(--bag);border:1px solid color-mix(in srgb,var(--line) 42%,transparent);border-radius:12px;padding:14px;box-shadow:none;text-align:left}\n.ui-combined .storage-heading{display:flex;align-items:center;gap:3px;font-size:11px}\n.ui-combined .storage-heading>small{color:var(--stamp);background:color-mix(in srgb,var(--stamp) 12%,transparent);border-radius:4px;padding:1px 6px;font-size:10px;font-weight:600;letter-spacing:0}\n.ui-combined .kv-storage-card .storage-heading>small{color:var(--ok);background:color-mix(in srgb,var(--ok) 12%,transparent)}\n.ui-combined .storage-help-anchor{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip-path:inset(50%)}\n.ui-combined .storage-heading .ui-help-anchor{margin:0;gap:0}\n.ui-combined .storage-value{display:block;margin:0;text-align:left;white-space:nowrap}\n.ui-combined .storage-value b{display:inline;font:700 23px/1.2 var(--serif)}\n.ui-combined .storage-total{font-size:10px;font-weight:400;color:var(--muted)}\n.ui-combined .storage-meter{height:4px;margin:0;border:0;border-radius:4px}\n.ui-combined .storage-meter::-webkit-meter-bar{height:4px;background:var(--track);border:0}\n.ui-combined .kv-storage-card .storage-meter::-webkit-meter-optimum-value{background:var(--ok)}\n.ui-combined .kv-storage-card .storage-meter::-moz-meter-bar{background:var(--ok)}\n.ui-combined .storage-state{font-size:11px;color:var(--muted)}\n.ui-combined .storage-card small{letter-spacing:0}\n.ui-combined .admin-list-card{background:var(--bag);border:0;border-top:2px solid var(--line);border-radius:0;margin:0 -30px;padding:0 30px 8px;box-shadow:none}\n.ui-combined .admin-collection-top{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:18px 0 12px}\n.ui-combined .admin-status-tabs{display:flex;flex-wrap:wrap;gap:3px;border:1px solid color-mix(in srgb,var(--line) 42%,transparent);border-radius:9px;background:var(--bag);padding:3px}\n.ui-combined .admin-status-tabs button{padding:7px 10px;background:transparent;border:0;border-radius:6px;color:var(--muted);cursor:pointer;font:12px system-ui;white-space:nowrap}\n.ui-combined .admin-status-tabs button[aria-pressed=true]{background:var(--tkhead-bg);color:var(--tkhead-fg);box-shadow:0 2px 6px color-mix(in srgb,var(--mask) 20%,transparent)}\n.ui-combined .admin-query-row{display:flex;align-items:center;gap:8px;margin:0}\n.ui-combined .admin-search-field{position:relative;display:block;min-width:0}\n.ui-combined .admin-search-field input{width:265px}\n.ui-combined .sr-only{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}\n.ui-combined .admin-query-row input,.ui-combined .admin-query-row select{min-height:38px;padding:7px 10px;border:1px solid var(--line);border-radius:7px;background:var(--paper);color:var(--ink);font:12px system-ui;min-width:0}\n.ui-combined .admin-query-row>.ui-help-anchor{margin:0;gap:0}\n.ui-combined .list-toolbar{display:flex;align-items:center;gap:12px;padding:8px 0 12px;margin:0;border:0;background:var(--bag);box-shadow:none;position:sticky;top:8px;z-index:6}\n.ui-combined .list-toolbar .page-summary{font-size:12px;color:var(--muted);white-space:nowrap}\n.ui-combined .list-toolbar>select{min-height:30px;padding:3px 8px;border:1px solid var(--line);border-radius:7px;background:var(--paper);color:var(--ink);font:11px system-ui;max-width:84px}\n.ui-combined .list-toolbar .pager-btns{display:flex;gap:6px;margin-left:auto;width:auto}\n.ui-combined .list-toolbar .btn{font-size:11px;min-height:30px;padding:3px 10px}\n.ui-combined .admin-list-card table{width:100%;table-layout:fixed;border-collapse:collapse;border-spacing:0;font-size:12px}\n.ui-combined .admin-list-card th{background:var(--tkhead-bg);color:var(--tkhead-fg);border:0;padding:13px 12px;font-size:11px;letter-spacing:0}\n.ui-combined .admin-list-card td{background:transparent;border:0;border-bottom:1px dashed var(--line);padding:18px 12px;white-space:normal;line-height:1.7;vertical-align:middle}\n.ui-combined .admin-list-card tbody tr:last-child td{border-bottom:1px dashed var(--line)}\n.ui-combined .admin-list-card tr:hover td{background:color-mix(in srgb,var(--paper) 65%,transparent)}\n.ui-combined .admin-list-card th:nth-child(1){width:76px}\n.ui-combined .admin-list-card th:nth-child(3){width:18%}\n.ui-combined .admin-list-card th:nth-child(4),.ui-combined .admin-list-card th:nth-child(5){width:82px}\n.ui-combined .admin-list-card th:nth-child(6),.ui-combined .admin-list-card th:nth-child(8){width:120px}\n.ui-combined .admin-list-card th:nth-child(7){width:72px}\n.ui-combined .admin-list-card th:nth-child(9){width:46px}\n.ui-combined .share-filename-line{min-width:0;width:100%;align-items:baseline}\n.ui-combined .share-filename{font-size:13px;line-height:1.6}\n.ui-combined .share-kind{font-size:9px}\n.ui-combined .source-cell{min-width:0;max-width:none}\n.ui-combined .source-cell small{font-size:10px;margin-top:3px;color:var(--muted)}\n.ui-combined .badge:not(.share-kind){font-size:10px;padding:3px 7px;border-radius:6px;white-space:nowrap}\n.ui-combined .admin-code{background:transparent;border:0;padding:0;color:var(--ink);font:600 12px ui-monospace,monospace;cursor:pointer}\n.ui-combined .admin-code:hover{color:var(--stamp)}\n.ui-combined .admin-mobile-size{display:none}\n.ui-combined .admin-remove.btn{display:inline-grid;place-items:center;min-width:34px;min-height:34px;width:34px;padding:6px;background:transparent;color:var(--muted);border:1px solid transparent;border-radius:7px;box-shadow:none}\n.ui-combined .admin-remove svg{width:17px;height:17px}\n.ui-combined .admin-remove:hover{background:var(--danger-soft);color:var(--danger);border-color:var(--edge)}\n.ui-combined .admin-footer{margin:0 -30px;padding:18px 30px;display:flex;gap:20px;align-items:center;background:var(--bag);border-radius:0 0 24px 24px;font-size:11px;color:var(--muted)}\n.ui-combined .admin-footer a{color:var(--muted);text-decoration:none}\n.ui-combined .admin-footer a:hover{color:var(--stamp)}\n.ui-combined .audit-card{border:0;border-top:2px solid var(--line);margin:0 -30px;padding:18px 30px;background:var(--bag);border-radius:0;box-shadow:none}\n.ui-combined .audit-heading h2,.ui-combined #security-title{font:700 28px/1.3 var(--serif)}\n.ui-combined .audit-table th,.ui-combined .sec-table th{background:var(--tkhead-bg);color:var(--tkhead-fg);padding-block:13px}\n.ui-combined .audit-table td,.ui-combined .sec-table td{border-bottom:1px dashed var(--line);padding-block:16px}\n.ui-combined .source-dialog,.ui-combined .settings-dialog{border-radius:22px;border-color:color-mix(in srgb,var(--line) 42%,transparent);box-shadow:0 24px 90px var(--mask)}\n.ui-combined .source-heading{padding:18px 22px}\n.ui-combined .source-heading h3{font:700 22px var(--serif)}\n.ui-combined .source-body{padding:20px 22px}\n.ui-combined .source-footer{padding:14px 22px}\n.ui-combined .source-footer .btn{min-height:36px;font-size:12px}\n.ui-combined #source-form{max-width:420px}\n.ui-combined #security-view{padding-top:0}\n.ui-combined #security-view .sec-summary{background:var(--bag);padding:20px 24px;border:1px solid var(--line);border-radius:14px}\n.ui-combined .admin-list-card:has([aria-busy=true]){cursor:progress}\n@media(max-width:1100px){\n .ui-combined .stats-row{grid-template-columns:1fr;gap:18px}\n .ui-combined .stats-counts .stat-card{padding:0;min-height:50px}\n .ui-combined .admin-collection-top{align-items:flex-start;flex-direction:column}\n .ui-combined .admin-query-row{width:100%}\n .ui-combined .admin-search-field{flex:1}\n .ui-combined .admin-search-field input{width:100%}\n .ui-combined .admin-list-card th:nth-child(1){width:65px}\n .ui-combined .admin-list-card th:nth-child(3){width:16%}\n .ui-combined .admin-list-card th:nth-child(4),.ui-combined .admin-list-card th:nth-child(5){width:66px}\n .ui-combined .admin-list-card th:nth-child(6),.ui-combined .admin-list-card th:nth-child(8){width:96px}\n .ui-combined .admin-list-card th,.ui-combined .admin-list-card td{padding-inline:8px}\n}\n@media(max-width:760px){\n .ui-combined[data-ui-surface=admin] .topbar.wide,.ui-combined[data-ui-surface=admin] .container.wide{width:calc(100% - 16px)}\n .ui-combined .ui-header-band{margin-bottom:10px}\n .ui-combined .ui-header-band .topbar{padding:12px 4px 6px;gap:8px;min-height:0}\n .ui-combined #admin-navigation{grid-template-columns:repeat(3,minmax(0,1fr));gap:3px}\n .ui-combined .admin-nav-link{font-size:12px;min-height:44px;padding:9px 5px;border-radius:8px}\n .ui-combined #admin-panel{padding:18px 12px 0;border-radius:16px}\n .ui-combined .admin-page-heading{margin-bottom:20px}\n .ui-combined .admin-page-heading h1{font-size:27px}\n .ui-combined .stats-row{padding-bottom:18px;gap:14px}\n .ui-combined .stats-counts{grid-template-columns:repeat(5,minmax(0,1fr));gap:5px}\n .ui-combined .stats-counts .stat-card,.ui-combined .stats-counts .stat-card:nth-last-child(-n+2){grid-column:auto;align-items:flex-start;text-align:left;min-height:44px;padding:3px 0;gap:7px;border:0;flex-direction:column}\n .ui-combined .stats-counts b{font-size:27px}\n .ui-combined .stats-counts small{font-size:9px}\n .ui-combined .storage-overview{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}\n .ui-combined .storage-card{padding:10px;gap:6px;border-radius:9px;border-top:1px solid var(--line)}\n .ui-combined .storage-value b{font-size:20px}\n .ui-combined .storage-total{display:block;font-size:9px;margin-top:2px}\n .ui-combined .storage-heading .ui-help-anchor{display:flex}\n .ui-combined .admin-list-card{margin:0 -12px;padding:0 12px 8px}\n .ui-combined .admin-collection-top{padding:16px 0 12px;gap:14px;width:100%}\n .ui-combined .admin-status-tabs{gap:1px}\n .ui-combined .admin-status-tabs button{padding:7px;font-size:11px}\n .ui-combined .admin-query-row{display:grid;grid-template-columns:minmax(0,1fr) auto;width:100%;gap:8px}\n .ui-combined .admin-search-field{grid-column:1/-1}\n .ui-combined .admin-query-row input{width:100%;min-height:42px;font-size:16px}\n .ui-combined .admin-query-row select{min-height:42px;width:100%}\n .ui-combined .admin-query-row>.ui-help-anchor{min-height:42px}\n .ui-combined .list-toolbar{flex-wrap:wrap;gap:8px;padding-bottom:10px;top:8px}\n .ui-combined .list-toolbar .page-summary{width:auto;font-size:11px}\n .ui-combined .list-toolbar .pager-btns{width:auto;display:flex;margin-left:auto;gap:4px}\n .ui-combined .list-toolbar .btn{padding:3px 7px;font-size:10px;min-height:44px}\n .ui-combined .list-toolbar>select{max-width:65px;padding-inline:5px;min-height:44px}\n .ui-combined .admin-list-card table{display:block;min-width:0}\n .ui-combined .admin-list-card thead{display:none}\n .ui-combined #shares-body{display:block}\n .ui-combined #shares-body tr{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px 14px;border:0;border-bottom:1px dashed var(--line);padding:18px 0}\n .ui-combined #shares-body td{border:0;padding:0;min-width:0;white-space:normal;font-size:12px;background:transparent;line-height:1.7}\n .ui-combined #shares-body td:nth-child(1){grid-area:2/1;font-size:11px}\n .ui-combined #shares-body td:nth-child(2){grid-area:1/1}\n .ui-combined #shares-body td:nth-child(3){grid-area:3/1;display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}\n .ui-combined #shares-body td:nth-child(4){display:none}\n .ui-combined #shares-body td:nth-child(5){grid-area:2/2;color:var(--muted);font-size:11px;text-align:right}\n .ui-combined #shares-body td:nth-child(5)::before{content:'\u53D6\u4EF6 '}\n .ui-combined[lang=en] #shares-body td:nth-child(5)::before{content:'Picked '}\n .ui-combined #shares-body td:nth-child(6){grid-area:4/1;font-size:10px;color:var(--muted)}\n .ui-combined #shares-body td:nth-child(6)::before{content:'\u6709\u6548\u671F '}\n .ui-combined[lang=en] #shares-body td:nth-child(6)::before{content:'Expires '}\n .ui-combined #shares-body td:nth-child(7){grid-area:1/2;text-align:right}\n .ui-combined #shares-body td:nth-child(8){display:none}\n .ui-combined #shares-body td:nth-child(9){grid-area:3/2/5/3;align-self:end;justify-self:end}\n .ui-combined #shares-body td[colspan]{grid-area:1/1/2/3;display:block;text-align:center}\n .ui-combined .share-filename-line{width:100%}\n .ui-combined .share-filename{font-size:13px}\n .ui-combined .admin-mobile-size{display:inline;margin-left:8px;color:var(--muted);font-size:10px}\n .ui-combined .source-cell small{font-size:10px;margin-top:0}\n .ui-combined .admin-footer{margin:0 -12px;padding:14px 12px;gap:14px;flex-wrap:wrap;border-radius:0 0 16px 16px;font-size:10px}\n .ui-combined .audit-card{margin:0 -12px;padding:16px 12px}\n .ui-combined .source-body{padding:16px;gap:16px}\n .ui-combined .source-heading,.ui-combined .source-footer{padding-inline:16px}\n .ui-combined .source-heading h3{font-size:20px}\n .ui-combined .source-footer .btn{min-height:42px}\n .ui-combined .sec-summary{padding:16px}\n}\n\n@media(min-width:761px) and (max-width:900px){.ui-combined .admin-nav-link{min-height:44px}}\n@media(max-width:760px){.ui-combined .admin-remove.btn{width:44px;min-height:44px}.ui-combined .admin-code{min-height:44px}.ui-combined .source-footer .btn{min-height:44px}}\n\n.ui-combined .sec-rules-dialog .source-heading{padding:10px 18px}\n.ui-combined .sec-rules-dialog .source-footer{padding:8px 18px}\n.ui-combined .storage-overview:not(:has(.kv-storage-card)){grid-template-columns:1fr}\n\n.ui-combined.ui-login[data-ui-surface=admin] .container.wide{width:calc(100% - 48px);max-width:440px}\n", "admin.html": `<!doctype html>
<html lang="zh-CN" class="ui-enhanced ui-soft ui-combined" data-ui-surface="admin">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="\u6587\u4EF6\u4E2D\u8F6C\u7AD9\u7BA1\u7406\u540E\u53F0">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#efe8d8">
<title data-i18n="doc.admin">\u6587\u4EF6\u4E2D\u8F6C\u7AD9 - \u7BA1\u7406</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>\u{1F4E6}</text></svg>">
<link rel="stylesheet" href="/style.css?v=732e7eabbd2c58e9">
<link rel="stylesheet" href="/ui.css?v=732e7eabbd2c58e9">
<link rel="stylesheet" href="/admin-layout.css?v=732e7eabbd2c58e9">
<script>
  document.documentElement.dataset.theme =
    localStorage.getItem('theme') ||
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
<\/script>
</head>
<body>
<div class="ui-header-band">
<header class="topbar wide admin-topbar">
  <div class="brand">
    <span class="logo">\u{1F4E6}</span>
    <div><b data-i18n="brand.name">\u6587\u4EF6\u4E2D\u8F6C\u7AD9</b><small data-i18n="brand.admin">\u7BA1\u7406\u540E\u53F0</small></div>
  </div>
  <nav id="admin-navigation" class="admin-nav" hidden aria-label="\u7BA1\u7406\u9875\u9762" data-i18n-aria="audit.navigation">
    <button id="admin-files-tab" class="admin-nav-link" type="button" aria-pressed="true" aria-controls="admin-files-view" data-i18n="audit.files">\u6587\u4EF6\u7BA1\u7406</button>
    <button id="admin-audit-tab" class="admin-nav-link" type="button" aria-pressed="false" aria-controls="admin-audit-view" data-i18n="audit.title">\u65E5\u5FD7\u5BA1\u8BA1</button>
  </nav>
  <div class="actions">
    <button id="admin-settings-btn" class="icon-btn" type="button" hidden aria-haspopup="dialog" aria-label="\u8BBE\u7F6E" data-i18n-aria="ad.settings" data-i18n-title="ad.settings">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m9 3-.6 2.4-2 .9L4 5.6 1.8 9.4l1.8 1.7v1.8l-1.8 1.7L4 18.4l2.4-.7 2 .9L9 21h6l.6-2.4 2-.9 2.4.7 2.2-3.8-1.8-1.7v-1.8l1.8-1.7L20 5.6l-2.4.7-2-.9L15 3Z"/><circle cx="12" cy="12" r="3"/></svg>
    </button>
    <button id="lang-btn" class="icon-btn lang-btn" data-i18n-title="nav.lang">EN</button>
    <button id="theme-btn" class="icon-btn" data-i18n-title="nav.theme">\u{1F317}</button>
    <a class="btn ghost small ui-new-tab" href="/" target="_blank" rel="noopener noreferrer" data-i18n="nav.send">\u53D1\u9001</a>
  </div>
</header>
</div>

<main class="container wide">
  <section class="card center" id="admin-login" hidden>
    <h2 class="title" data-i18n="ad.loginTitle">\u7BA1\u7406\u767B\u5F55</h2>
    <label class="muted" for="admin-token" data-i18n="ad.loginSub">\u4F7F\u7528\u7BA1\u7406\u4EE4\u724C\u767B\u5F55</label>
    <div class="ui-token-field">
      <input id="admin-token" class="token-input" type="password" required data-i18n-ph="ad.tokenPh" placeholder="\u7BA1\u7406\u4EE4\u724C" autocomplete="current-password">
      <button id="ui-token-toggle" class="btn small ghost" type="button" aria-pressed="false" aria-label="\u663E\u793A\u7BA1\u7406\u4EE4\u724C" data-i18n="ui.show" data-i18n-aria="ui.showToken">\u663E\u793A</button>
    </div>
    <div id="login-error" class="error-box" hidden role="alert"></div>
    <button id="btn-login" class="btn primary block" data-i18n="ad.login">\u767B\u5F55</button>
    <a class="ui-entry-back" href="/" data-i18n="ui.backSend">\u8FD4\u56DE\u53D1\u9001\u9875</a>
  </section>

  <section id="admin-panel" hidden>
    <p id="audit-write-warning" class="error-box" hidden role="alert" data-i18n="audit.writeFailed">\u64CD\u4F5C\u5DF2\u5904\u7406\uFF0C\u4F46\u5BA1\u8BA1\u8BB0\u5F55\u672A\u4FDD\u5B58\uFF0C\u8BF7\u68C0\u67E5\u65E5\u5FD7\u5B58\u50A8\u3002</p>
    <div id="admin-files-view">
      <div class="admin-page-heading"><h1 data-i18n="audit.files">\u6587\u4EF6\u7BA1\u7406</h1><div id="files-refresh-slot"><button id="btn-refresh" class="btn small ghost" data-i18n="ad.refresh">\u21BB \u5237\u65B0</button></div></div>
    <div class="stats-row" id="stats-row"></div>
    <div class="card admin-list-card">
      <div class="admin-collection-top">
        <div id="files-status-tabs" class="admin-status-tabs" role="group" aria-label="\u5206\u4EAB\u72B6\u6001">
          <button type="button" data-status="all" aria-pressed="true" data-i18n="ad.allShares">\u5168\u90E8</button>
          <button type="button" data-status="active" aria-pressed="false" data-i18n="ad.activeShares">\u6709\u6548</button>
          <button type="button" data-status="expired" aria-pressed="false" data-i18n="ad.expiredShares">\u5DF2\u8FC7\u671F</button>
          <button type="button" data-status="exhausted" aria-pressed="false" data-i18n="ad.exhaustedShares">\u5DF2\u53D6\u5B8C</button>
        </div>
        <form id="files-filter" class="admin-query-row">
          <label class="admin-search-field"><span class="sr-only" data-i18n="ad.searchShares">\u641C\u7D22\u5217\u8868\u4E2D\u7684\u6587\u4EF6\u540D\u3001\u53E3\u4EE4\u6216\u8BBF\u5BA2\u6807\u8BC6</span><input id="files-q" type="search" maxlength="80" data-i18n-ph="ad.searchShares" placeholder="\u641C\u7D22\u5217\u8868\u4E2D\u7684\u6587\u4EF6\u540D\u3001\u53E3\u4EE4\u6216\u8BBF\u5BA2\u6807\u8BC6"></label>
          <select id="files-kind" data-i18n-aria="ad.th.content" aria-label="\u5185\u5BB9\u7C7B\u578B"><option value="all" data-i18n="ad.allKinds">\u6240\u6709\u7C7B\u578B</option><option value="file" data-i18n="ad.kind.file">\u6587\u4EF6</option><option value="text" data-i18n="ad.kind.text">\u6587\u672C</option></select>
          <button class="btn small ghost" type="submit" data-i18n="ad.searchButton">\u641C\u7D22</button>
        </form>
      </div>
      <div id="files-pager" class="list-toolbar" role="group" aria-label="\u6587\u4EF6\u5206\u9875" data-i18n-aria="ad.filesPagination">
        <small id="page-info" class="page-summary" role="status" aria-live="polite"></small>
        <div class="pager-btns">
          <button id="btn-prev" class="btn small" type="button" disabled data-i18n="ad.prev">\u4E0A\u4E00\u9875</button>
          <button id="btn-next" class="btn small" type="button" disabled data-i18n="ad.next">\u4E0B\u4E00\u9875</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th data-i18n="ad.th.code">\u53E3\u4EE4</th><th data-i18n="ad.th.content">\u5185\u5BB9</th><th data-i18n="ad.source">\u4E0A\u4F20\u6765\u6E90</th><th data-i18n="ad.th.size">\u5927\u5C0F</th>
              <th data-i18n="ad.th.pickups">\u5DF2\u53D6/\u4E0A\u9650</th><th data-i18n="ad.th.expire">\u8FC7\u671F\u65F6\u95F4</th><th data-i18n="ad.th.status">\u72B6\u6001</th><th data-i18n="ad.th.created">\u521B\u5EFA\u65F6\u95F4</th><th></th>
            </tr>
          </thead>
          <tbody id="shares-body"></tbody>
        </table>
      </div>
    </div>
    </div>
    <section id="admin-audit-view" class="card audit-card" hidden aria-labelledby="audit-title">
      <div class="audit-heading">
        <div><h2 id="audit-title" data-i18n="audit.title">\u65E5\u5FD7\u5BA1\u8BA1</h2><small class="muted" data-i18n="audit.retention">\u6700\u8FD1 30 \u5929\uFF0C\u6700\u591A 1,000 \u6761\uFF1B\u65F6\u95F4\u6309\u672C\u5730\u65F6\u533A\u663E\u793A</small></div>
        <div class="audit-actions"><button id="audit-export" class="btn small ghost" type="button" data-i18n="audit.export">\u5BFC\u51FA\u7B5B\u9009\u7ED3\u679C</button></div>
      </div>
      <div class="audit-categories" role="group" aria-label="\u65E5\u5FD7\u5206\u7C7B" data-i18n-aria="audit.categories">
        <button type="button" data-category="all" aria-pressed="true" data-i18n="audit.all">\u5168\u90E8\u65E5\u5FD7</button>
        <button type="button" data-category="login" aria-pressed="false" data-i18n="audit.login">\u767B\u5F55\u65E5\u5FD7</button>
        <button type="button" data-category="operation" aria-pressed="false" data-i18n="audit.operation">\u64CD\u4F5C\u65E5\u5FD7</button>
        <button type="button" data-category="upload" aria-pressed="false" data-i18n="audit.upload">\u4E0A\u4F20\u65E5\u5FD7</button>
        <button type="button" data-category="pickup" aria-pressed="false" data-i18n="audit.pickup">\u53D6\u4EF6\u65E5\u5FD7</button>
        <button type="button" data-category="security" aria-pressed="false" data-i18n="audit.security">\u5B89\u5168\u4E8B\u4EF6</button>
      </div>
      <form id="audit-filter" class="audit-filter">
        <label><span data-i18n="audit.result">\u7ED3\u679C</span><select id="audit-result"><option value="all" data-i18n="audit.anyResult">\u5168\u90E8\u7ED3\u679C</option><option value="success" data-i18n="audit.success">\u6210\u529F</option><option value="failed" data-i18n="audit.failed">\u5931\u8D25</option><option value="blocked" data-i18n="audit.blocked">\u5DF2\u62E6\u622A</option></select></label>
        <label><span data-i18n="audit.from">\u5F00\u59CB\u65E5\u671F</span><input id="audit-from" type="date"></label>
        <label><span data-i18n="audit.to">\u7ED3\u675F\u65E5\u671F</span><input id="audit-to" type="date"></label>
        <label class="audit-search"><span data-i18n="audit.keyword">IP / \u6587\u4EF6 / \u8BBF\u5BA2</span><input id="audit-q" type="search" maxlength="80" placeholder="\u641C\u7D22 IP\u3001\u53D6\u4EF6\u7801\u3001\u6587\u4EF6\u540D\u6216\u8BBF\u5BA2\u6807\u8BC6" data-i18n-ph="audit.search"></label>
        <div class="audit-actions"><button class="btn small primary" type="submit" data-i18n="audit.filter">\u7B5B\u9009</button><button id="audit-reset" class="btn small ghost" type="button" data-i18n="audit.reset">\u91CD\u7F6E</button></div>
      </form>
      <div id="audit-pager" class="list-toolbar" role="group" aria-label="\u65E5\u5FD7\u5206\u9875" data-i18n-aria="ad.auditPagination">
        <small id="audit-page" class="page-summary" role="status" aria-live="polite"></small>
        <div class="pager-btns">
          <button id="audit-prev" class="btn small" type="button" disabled data-i18n="ad.prev">\u4E0A\u4E00\u9875</button>
          <button id="audit-next" class="btn small" type="button" disabled data-i18n="ad.next">\u4E0B\u4E00\u9875</button>
          <button id="audit-refresh" class="btn small ghost" type="button" data-i18n="ad.refresh">\u21BB \u5237\u65B0</button>
        </div>
      </div>
      <p id="audit-error" class="error-box" role="alert" hidden></p>
      <p id="audit-state" class="muted" role="status"></p>
      <div class="table-wrap audit-table-wrap"><table class="audit-table">
        <thead><tr><th data-i18n="audit.time">\u65F6\u95F4</th><th data-i18n="audit.action">\u64CD\u4F5C</th><th data-i18n="audit.result">\u7ED3\u679C</th><th data-i18n="audit.actor">\u64CD\u4F5C\u8EAB\u4EFD</th><th data-i18n="audit.source">\u6765\u6E90 IP / \u5C5E\u5730</th><th data-i18n="audit.target">\u64CD\u4F5C\u5BF9\u8C61</th><th data-i18n="audit.details">\u8BE6\u60C5</th></tr></thead>
        <tbody id="audit-body"></tbody>
      </table></div>
    </section>
    <footer class="admin-footer"><span data-i18n="ad.adminFooter">\u6587\u4EF6\u4E2D\u8F6C\u7AD9 \xB7 \u89C1\u5B57\u5982\u9762</span><a href="mailto:iblykk@gmail.com" data-i18n="ad.contact">\u8054\u7CFB\u7AD9\u957F</a></footer>
  </section>
</main>

<!-- \u4F5C\u5E9F\u786E\u8BA4\u5F39\u7A97:\u7968\u636E\u98CE,\u66FF\u4EE3\u539F\u751F confirm(ESC / \u70B9\u906E\u7F69 = \u53D6\u6D88) -->
<dialog class="delete-dialog" id="del-mask" aria-labelledby="del-title">
  <div class="modal-card">
    <h3 class="modal-title" id="del-title" data-i18n="ad.delTitle">\u4F5C\u5E9F\u8FD9\u5F20\u53D6\u4EF6\u51ED\u8BC1?</h3>
    <div class="del-target" id="del-target"></div>
    <p class="del-warn" data-i18n="ad.delWarn">\u4F5C\u5E9F\u540E\u53E3\u4EE4\u7ACB\u5373\u5931\u6548,\u5BF9\u65B9\u5C06\u65E0\u6CD5\u53D6\u4EF6,\u4E14\u4E0D\u53EF\u6062\u590D\u3002</p>
    <div class="modal-actions">
      <button id="del-cancel" class="btn" data-i18n="btn.cancel">\u53D6\u6D88</button>
      <button id="del-ok" class="btn danger" data-i18n="ad.delOk">\u786E\u8BA4\u4F5C\u5E9F</button>
    </div>
  </div>
</dialog>

<dialog id="source-dialog" class="source-dialog" aria-labelledby="source-title">
  <div class="source-heading">
    <h3 id="source-title" tabindex="-1" autofocus data-i18n="ad.source">\u4E0A\u4F20\u6765\u6E90</h3>
    <small id="source-context" class="muted mono"></small>
  </div>
  <div class="source-body">
    <div id="source-identity" hidden>
      <div class="source-visitor">
        <small class="muted" data-i18n="ad.visitorId">\u8BBF\u5BA2\u6807\u8BC6</small>
        <span id="source-visitor-id" class="mono"></span>
      </div>
      <form id="source-form" hidden>
        <label for="source-note" data-i18n="ad.noteShort" data-i18n-title="ad.sourceNote">\u5907\u6CE8</label>
        <input id="source-note" type="text" maxlength="64" autocomplete="off" data-i18n-aria="ad.sourceNote" aria-label="\u7BA1\u7406\u5458\u5907\u6CE8">
        <button id="source-save" class="btn small" type="submit" hidden data-i18n="ad.save">\u4FDD\u5B58</button>
        <p class="error-box" id="source-error" hidden role="alert"></p>
      </form>
    </div>
    <div id="source-detail" aria-live="polite"></div>
    <section id="source-history" class="source-history" hidden>
      <h4 data-i18n="ad.recentUploads">\u8FD1\u671F\u4E0A\u4F20</h4>
      <small class="muted" data-i18n="ad.historyScope">\u6700\u8FD1 10 \u6761\u73B0\u5B58\u5206\u4EAB</small>
      <div id="source-history-list" aria-live="polite"></div>
    </section>
  </div>
  <div class="source-footer">
    <button id="source-back" class="btn ghost" type="button" hidden data-i18n="ad.backFile">\u8FD4\u56DE\u6587\u4EF6</button>
    <button id="source-close" class="btn ghost" type="button" data-i18n="ad.sourceClose">\u5173\u95ED</button>
  </div>
</dialog>
<dialog id="file-dialog" class="source-dialog" aria-labelledby="file-title">
  <div class="source-heading">
    <h3 id="file-title" tabindex="-1" autofocus data-i18n="ad.fileDetails">\u6587\u4EF6\u8BE6\u60C5</h3>
    <small id="file-context" class="muted mono"></small>
  </div>
  <div class="source-body">
    <div id="file-detail" class="file-detail-grid" aria-live="polite"></div>
    <div id="file-editor" hidden></div>
  </div>
  <div class="source-footer">
    <button id="text-copy" class="btn primary" type="button" hidden data-i18n="pk.copyAllText">\u4E00\u952E\u590D\u5236\u5168\u6587</button>
    <button id="file-edit" class="btn ghost" type="button" hidden data-i18n="ad.editShare">\u7F16\u8F91\u5206\u4EAB</button>
    <button id="file-close" class="btn ghost" type="button" data-i18n="ad.sourceClose">\u5173\u95ED</button>
    <a id="file-download" class="btn primary" hidden data-i18n="ad.download">\u4E0B\u8F7D</a>
  </div>
</dialog>
<dialog id="audit-dialog" class="source-dialog" aria-labelledby="audit-detail-title">
  <div class="source-heading"><h3 id="audit-detail-title" tabindex="-1" autofocus data-i18n="audit.details">\u65E5\u5FD7\u8BE6\u60C5</h3></div>
  <div class="source-body"><div id="audit-detail" class="file-detail-grid"></div></div>
  <div class="source-footer"><button id="audit-close" class="btn ghost" type="button" data-i18n="ad.sourceClose">\u5173\u95ED</button></div>
</dialog>
<dialog id="settings-dialog" class="source-dialog settings-dialog" aria-labelledby="settings-title">
  <div class="source-heading"><h3 id="settings-title" tabindex="-1" autofocus data-i18n="ad.settings">\u8BBE\u7F6E</h3></div>
  <div class="source-body">
    <p id="settings-audit-warning" class="error-box" hidden role="alert" data-i18n="audit.writeFailed">\u64CD\u4F5C\u5DF2\u5904\u7406\uFF0C\u4F46\u5BA1\u8BA1\u8BB0\u5F55\u672A\u4FDD\u5B58\uFF0C\u8BF7\u68C0\u67E5\u65E5\u5FD7\u5B58\u50A8\u3002</p>
<div class="admin-settings">
      <section class="settings-section display-settings" aria-labelledby="display-title">
        <h4 id="display-title" data-i18n="ad.displaySettings">\u5217\u8868\u663E\u793A</h4>
        <div class="display-options">
        <div class="preference-row"><label for="files-page-size" data-i18n="ad.filesPageSize">\u6587\u4EF6\u6BCF\u9875\u6761\u6570</label><select id="files-page-size"><option value="10">10</option><option value="20">20</option><option value="40">40</option></select></div>
        <div class="preference-row"><label for="audit-page-size" data-i18n="ad.auditPageSize">\u65E5\u5FD7\u6BCF\u9875\u6761\u6570</label><select id="audit-page-size"><option value="20">20</option><option value="50">50</option><option value="100">100</option></select></div>
        </div>
        <small class="muted" data-i18n="ad.browserSettings">\u7ACB\u5373\u751F\u6548\uFF0C\u4EC5\u4FDD\u5B58\u5728\u5F53\u524D\u6D4F\u89C8\u5668</small>
        <p id="preferences-error" class="error-box" role="alert" data-i18n="ad.preferenceNotSaved" hidden></p>
      </section>

      <section class="settings-section share-settings" aria-labelledby="share-settings-title">
        <h4 id="share-settings-title" data-i18n="ad.shareSettings">\u5206\u4EAB\u89C4\u5219</h4>
        <form id="retention-form">
          <label for="retention-days" data-i18n="ad.retentionDays">\u8FC7\u671F\u540E\u4FDD\u7559</label>
          <div class="setting-value"><input id="retention-days" type="number" min="0" max="3650" step="1" required disabled>
          <span data-i18n="ad.days">\u5929</span></div>
          <button id="retention-save" class="btn small" type="submit" disabled data-i18n="ad.save">\u4FDD\u5B58</button>
        </form>
        <p id="retention-error" class="error-box" hidden role="alert"></p>
        <small id="retention-status" class="settings-saved" role="status" data-i18n="ad.settingsSaved" hidden></small>
        <button id="retention-retry" class="btn small ghost" type="button" hidden data-i18n="ad.retry">\u91CD\u8BD5</button>

        <form id="guest-policy-form">
          <label for="guest-weekly" data-i18n="ad.guestWeeklyFiles">\u672A\u5907\u6CE8\u8BBF\u5BA2\u6BCF\u5468\u6587\u4EF6\u6570</label><div class="setting-value"><input id="guest-weekly" type="number" min="0" max="1000" step="1" required disabled></div>
          <button id="guest-save" class="btn small" type="submit" disabled data-i18n="ad.save">\u4FDD\u5B58</button>
        </form>
        <small class="muted" data-i18n="ad.guestRules">\u5317\u4EAC\u65F6\u95F4\u5468\u4E00\u91CD\u7F6E\uFF1B\u5DF2\u63A5\u7EB3\u4E0A\u4F20\u8BA1\u6B21\uFF0C\u53D6\u6D88\u4E0D\u9000\u56DE\u3002\u672A\u5907\u6CE8\u8BBF\u5BA2\u4E0D\u80FD\u6C38\u4E45\u5206\u4EAB\u6216\u4E0D\u9650\u6B21\u53D6\u4EF6\u3002</small>
        <p id="guest-error" class="error-box" hidden role="alert"></p>
        <small id="guest-status" class="settings-saved" role="status" data-i18n="ad.guestSaved" hidden></small>
        <button id="guest-retry" class="btn small ghost" type="button" hidden data-i18n="ad.retry">\u91CD\u8BD5</button>
      </section>
      <section class="settings-section guest-settings" id="login-protection" aria-labelledby="guard-title">
        <div class="login-guard-heading">
          <h4 id="guard-title" data-i18n="ad.loginProtection">\u767B\u5F55\u9632\u62A4</h4>
          <button id="login-guard-refresh" class="btn small ghost" type="button" data-i18n="ad.refresh">\u21BB \u5237\u65B0</button>
        </div>
        <small class="muted" id="login-guard-status" role="status"></small>
        <p id="login-guard-error" class="error-box" hidden role="alert"></p>
        <div id="login-guard-bans" class="login-guard-bans"></div>
      </section>
    </div>
  </div>
  <div class="source-footer">
    <button id="btn-logout" class="btn ghost" type="button" data-i18n="ad.logout">\u9000\u51FA\u767B\u5F55</button>
    <button id="settings-close" class="btn primary" type="button" data-i18n="ad.sourceClose">\u5173\u95ED</button>
  </div>
</dialog>
<script type="module" src="/js/admin.js?v=732e7eabbd2c58e9"><\/script>
</body>
</html>
`, "index.html": `<!doctype html>
<html lang="zh-CN" class="ui-enhanced ui-soft ui-send" data-ui-surface="index">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="\u5206\u4EAB\u6587\u4EF6\u6216\u6587\u672C\uFF0C\u751F\u6210 6 \u4F4D\u53D6\u4EF6\u53E3\u4EE4\u3002\u652F\u6301\u94FE\u63A5\u548C\u626B\u7801\u53D6\u4EF6\uFF0C\u53EF\u8BBE\u7F6E\u6709\u6548\u671F\u4E0E\u53EF\u53D6\u6B21\u6570\u3002">
<meta name="theme-color" content="#efe8d8">
<title data-i18n="doc.send">\u6587\u4EF6\u4E2D\u8F6C\u7AD9 - \u53D1\u9001</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>\u{1F4E6}</text></svg>">
<link rel="stylesheet" href="/style.css?v=732e7eabbd2c58e9">
<link rel="stylesheet" href="/ui.css?v=732e7eabbd2c58e9">
<script>
  // \u9632 FOUC:\u6E32\u67D3\u524D\u5B9A\u4E3B\u9898
  document.documentElement.dataset.theme =
    localStorage.getItem('theme') ||
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
<\/script>
</head>
<body>
<div class="ui-header-band">
<header class="topbar wide ui-public-header">
  <div class="brand">
    <span class="logo">\u{1F4E6}</span>
    <div><b data-i18n="brand.name">\u6587\u4EF6\u4E2D\u8F6C\u7AD9</b><small data-i18n="brand.tagline">\u50CF\u53D6\u5FEB\u9012\u4E00\u6837\u53D6\u6587\u4EF6</small></div>
  </div>
  <nav class="ui-public-nav" aria-label="\u53D1\u9001\u4E0E\u53D6\u4EF6" data-i18n-aria="ui.publicNav">
    <a href="/" class="admin-nav-link" aria-current="page" data-i18n="nav.send">\u53D1\u9001</a>
    <a href="/pickup" class="admin-nav-link" aria-current="false" data-i18n="nav.pickup">\u53D6\u4EF6</a>
  </nav>
  <div class="actions">
    <button id="lang-btn" class="icon-btn lang-btn" data-i18n-title="nav.lang">EN</button>
    <button id="theme-btn" class="icon-btn" data-i18n-title="nav.theme">\u{1F317}</button>
  </div>
</header>
</div>

<main class="container wide">
  <div class="send-grid">
  <section class="card form-card">
    <div class="card-cap">
      <span data-i18n="send.cap">\u5206\u4EAB\u5185\u5BB9</span>
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
      <textarea id="text-input" rows="6" maxlength="65536" data-i18n-aria="tab.text" aria-label="\u53D1\u6587\u672C" data-i18n-ph="text.placeholder" placeholder="\u7C98\u8D34\u6216\u8F93\u5165\u8981\u5206\u4EAB\u7684\u6587\u672C\u2026"></textarea>
      <div class="row-between"><small class="muted" id="text-counter">0 / 65536</small></div>
    </div>

    <details class="upload-context" open>
      <summary><span data-i18n="context.add">\u8865\u5145\u4FE1\u606F\uFF08\u9009\u586B\uFF09</span><small data-i18n="context.visibility">\u8865\u5145\u4FE1\u606F\u4EC5\u7BA1\u7406\u5458\u53EF\u89C1</small></summary>
      <div class="context-fields">
        <div class="context-row">
          <label for="upload-name" data-i18n="context.name">\u600E\u4E48\u79F0\u547C\u4F60</label>
          <input id="upload-name" type="text" maxlength="40" autocomplete="nickname" data-i18n-ph="context.namePh" placeholder="\u586B\u5199\u4F60\u5E38\u7528\u7684\u79F0\u547C">
        </div>
        <div id="upload-description-field" class="context-row">
          <div class="context-label"><label for="upload-description" data-i18n="context.description">\u6587\u4EF6\u8BF4\u660E</label><small id="description-count" class="muted">0 / 300</small></div>
          <textarea id="upload-description" rows="2" maxlength="300" aria-describedby="description-count" data-i18n-ph="context.descriptionPh" placeholder="\u7B80\u8FF0\u6587\u4EF6\u5185\u5BB9\uFF0C\u540C\u6279\u6587\u4EF6\u5171\u7528"></textarea>
        </div>
      </div>
    </details>

    <div class="options">
      <div class="opt-group">
        <label data-i18n="opt.expiry">\u6709\u6548\u671F</label>
        <div class="seg" id="seg-expiry" role="group" data-i18n-aria="opt.expiry" aria-label="\u6709\u6548\u671F">
          <button type="button" data-v="1d" data-i18n="seg.1d">1 \u5929</button>
          <button type="button" data-v="7d" class="active" data-i18n="seg.7d">7 \u5929</button>
          <button type="button" data-v="30d" data-i18n="seg.30d">30 \u5929</button>
          <button type="button" data-v="forever" data-i18n="seg.forever" disabled>\u6C38\u4E45</button>
        </div>
      </div>
      <div class="opt-group">
        <label data-i18n="opt.pickups">\u53EF\u53D6\u6B21\u6570</label>
        <div class="seg" id="seg-pickups" role="group" data-i18n-aria="opt.pickups" aria-label="\u53EF\u53D6\u6B21\u6570">
          <button type="button" data-v="1" data-i18n="seg.p1">1 \u6B21</button>
          <button type="button" data-v="5" class="active" data-i18n="seg.p5">5 \u6B21</button>
          <button type="button" data-v="null" data-i18n="seg.punlimited" disabled>\u4E0D\u9650</button>
        </div>
      </div>
    </div>

    <small id="upload-policy-hint" class="muted" aria-live="polite"></small>
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
      <div class="side-cap" data-i18n="receipt.cap">\u5206\u4EAB\u7ED3\u679C</div>
      <div id="result-placeholder" class="result-placeholder">
        <div class="ph-postmark">READY</div>
        <p data-i18n="ph.title">\u7B49\u5F85\u5206\u4EAB</p>
        <small data-i18n="ph.sub">\u5206\u4EAB\u6210\u529F\u540E\uFF0C\u5728\u8FD9\u91CC\u590D\u5236\u53E3\u4EE4\u6216\u94FE\u63A5</small>
        <div class="ph-route">
          <div class="ph-leg"><span class="ph-ic">\u{1F9D1}</span><div><b data-i18n="route.senderT">\u5BC4\u4EF6\u4EBA \xB7 \u4F60</b><small data-i18n="route.senderS">\u9009\u62E9\u5185\u5BB9\uFF0C\u8BBE\u7F6E\u6709\u6548\u671F\u548C\u53EF\u53D6\u6B21\u6570</small></div></div>
          <div class="ph-dash"></div>
          <div class="ph-leg"><span class="ph-ic">\u2601\uFE0F</span><div><b data-i18n="route.relayT">\u751F\u6210\u5206\u4EAB</b><small data-i18n="route.relayS">\u628A\u53D6\u4EF6\u53E3\u4EE4\u6216\u94FE\u63A5\u53D1\u7ED9\u5BF9\u65B9</small></div></div>
          <div class="ph-dash"></div>
          <div class="ph-leg"><span class="ph-ic">\u{1F9F2}</span><div><b data-i18n="route.takerT">\u53D6\u4EF6\u4EBA \xB7 \u5BF9\u65B9</b><small data-i18n="route.takerS">\u8F93\u5165\u53E3\u4EE4\u6216\u6253\u5F00\u94FE\u63A5\uFF0C\u5373\u53EF\u53D6\u4EF6</small></div></div>
        </div>
        <div class="ph-fine" data-i18n="route.fine">\u53E3\u4EE4\u8BF7\u59A5\u5584\u4FDD\u7BA1\uFF0C\u4EC5\u5206\u4EAB\u7ED9\u9700\u8981\u7684\u4EBA</div>
      </div>
      <div id="results" class="results"></div>
    </aside>
  </div>
</main>

<footer class="foot ui-send-footer">
  <div class="ui-footer-inner">
    <div class="ui-footer-about"><small data-i18n="ui.footerAbout">\u89C1\u5B57\u5982\u9762\uFF0C\u8BA9\u5206\u4EAB\u7B80\u5355\u4E00\u70B9\u3002</small></div>
    <nav class="ui-footer-links" aria-label="\u9875\u5C3E\u5BFC\u822A" data-i18n-aria="ui.footerNav">
      <button id="ui-send-help" class="ui-footer-link" type="button" data-i18n="ui.help">\u4F7F\u7528\u5E2E\u52A9</button>
      <a class="ui-footer-link" href="/pickup" data-i18n="ui.toPickup">\u524D\u5F80\u53D6\u4EF6</a>
    </nav>
    <div class="ui-footer-contact"><a href="mailto:iblykk@gmail.com" data-i18n="ad.contact">\u8054\u7CFB\u7AD9\u957F</a></div>
  </div>
</footer>

<script type="module" src="/js/index.js?v=732e7eabbd2c58e9"><\/script>
</body>
</html>
`, "js/admin-audit.js": "import { $, api, el, fmtDate } from './common.js?v=732e7eabbd2c58e9';\nimport { t, LANG, onLangChange } from './i18n.js?v=732e7eabbd2c58e9';\nimport { pageSize, scrollToList } from './admin-preferences.js?v=732e7eabbd2c58e9';\n\nexport function initAudit() {\n  const view = $('#admin-audit-view');\n  const body = $('#audit-body');\n  const dialog = $('#audit-dialog');\n  let category = 'all', offset = 0, total = 0, request = 0;\n  let filters = {}, rows = [], available = false;\n  let limit = pageSize('audit');\n  const action = row => t(`audit.action.${row.action}`);\n  const actor = row => row.actor === 'anonymous' && (['upload', 'pickup'].includes(row.category) || ['upload', 'pickup'].includes(row.detail.scope))\n    ? t('audit.actor.visitor') : t(`audit.actor.${row.actor}`);\n  const ip = row => row.ip === 'unknown' ? t('ad.sourceUnknown') : row.ip;\n  function auditValue(value) {\n    const key = `audit.value.${value}`, translated = t(key);\n    return translated === key ? String(value) : translated;\n  }\n  function shareRules(value) {\n    try {\n      const rules = JSON.parse(value);\n      if (!Number.isSafeInteger(rules?.pickupCount) || !(rules.maxPickups === null || Number.isSafeInteger(rules.maxPickups)) ||\n          !(rules.expireAt === null || Number.isSafeInteger(rules.expireAt))) return String(value);\n      return `${t('ad.th.pickups')} ${rules.pickupCount} / ${rules.maxPickups ?? '\u221E'} \xB7 ${t('ad.th.expire')} ${rules.expireAt === null ? t('ad.forever') : fmtDate(rules.expireAt)}`;\n    } catch { return String(value); } // Older/external records may not contain a rule snapshot.\n  }\n  function place(row) {\n    let country = row.country;\n    if (/^[A-Z]{2}$/.test(country)) country = new Intl.DisplayNames([LANG === 'zh' ? 'zh-CN' : 'en'], { type: 'region' }).of(country);\n    return [...new Set([country, row.region, row.city].filter(Boolean))].join(' \xB7 ') || t('ad.sourceUnknown');\n  }\n  function close() { dialog.close(); $('#audit-detail').replaceChildren(); }\n  function details(row) {\n    const fields = [\n      [t('audit.time'), fmtDate(row.at)], [t('audit.action'), action(row)],\n      [t('audit.result'), t(`audit.${row.result}`)], [t('audit.actor'), actor(row)],\n      ['IP', ip(row)], [t('ad.sourceLocation'), place(row)],\n      [t('audit.target'), row.target || '\u2014'], [t('audit.http'), `${row.method} \xB7 ${row.status}`],\n      [t('audit.duration'), `${row.durationMs} ms`], [t('audit.id'), row.id],\n      [t('audit.agent'), row.agent || '\u2014'],\n    ];\n    for (const [key, value] of Object.entries(row.detail)) {\n      fields.push([t(`audit.detail.${key}`), ['beforeRules','afterRules'].includes(key) ? shareRules(value) : ['bannedUntil', 'firstAt', 'lastAt'].includes(key) ? fmtDate(value)\n        : ['stage', 'scope', 'reason', 'kind'].includes(key) ? auditValue(value)\n        : typeof value === 'boolean' ? t(value ? 'audit.yes' : 'audit.no') : String(value)]);\n    }\n    if (['download', 'publicDownload'].includes(row.action) && row.result === 'success') fields.push([t('audit.description'), t('audit.downloadHint')]);\n    $('#audit-detail').replaceChildren(...fields.map(([label, value]) => el('div', { class: 'file-field' }, el('small', { class: 'muted' }, label), el('span', {}, value))));\n    dialog.showModal();\n  }\n  function render() {\n    body.replaceChildren(...rows.map(row => el('tr', {},\n      el('td', {}, fmtDate(row.at)),\n      el('td', {}, el('span', {}, action(row)), el('small', { class: 'muted' }, t(`audit.${row.category}`))),\n      el('td', {}, el('span', { class: `audit-result audit-${row.result}` }, t(`audit.${row.result}`)),\n        row.detail.count > 1 ? el('small', { class: 'muted' }, t('audit.repeat', row.detail.count)) : null),\n      el('td', { class: 'audit-actor' }, el('small', { class: 'audit-mobile-label muted' }, t('audit.actor')), actor(row)),\n      el('td', { class: 'audit-source' }, el('span', { class: 'mono' }, ip(row)),\n        row.country || row.region || row.city ? el('small', { class: 'muted' }, place(row)) : null),\n      el('td', { class: 'audit-target' }, el('small', { class: 'audit-mobile-label muted' }, t('audit.target')), row.target || '\u2014'),\n      el('td', {}, el('button', { type: 'button', class: 'btn small ghost', onclick: () => details(row) }, t('audit.details'))),\n    )));\n    $('#audit-page').textContent = t('audit.page', Math.floor(offset / limit) + 1, Math.max(1, Math.ceil(total / limit)), total);\n    $('#audit-prev').disabled = offset === 0;\n    $('#audit-next').disabled = offset + limit >= total;\n  }\n  async function load() {\n    const ticket = ++request;\n    available = false;\n    $('#audit-error').hidden = true;\n    $('#audit-state').textContent = t('ad.loading');\n    $('#audit-page').textContent = '';\n    body.replaceChildren();\n    for (const id of ['audit-prev', 'audit-next', 'audit-export', 'audit-refresh']) $('#' + id).disabled = true;\n    try {\n      const params = new URLSearchParams({ ...filters, category, offset, limit });\n      const data = await api(`/api/admin/audit-logs?${params}`);\n      if (ticket !== request || view.hidden) return;\n      if (typeof data.enabled !== 'boolean' || !Array.isArray(data.rows) || !Number.isSafeInteger(data.total)) throw new Error(t('ad.loadFail'));\n      available = data.enabled;\n      rows = data.rows; total = data.total;\n      if (available && offset > 0 && offset >= total) { offset = Math.max(0, Math.ceil(total / limit) - 1) * limit; return load(); }\n      $('#audit-state').textContent = !available ? t('audit.disabled') : !total ? t('audit.empty') : '';\n      render();\n      $('#audit-export').disabled = !available || total === 0;\n    } catch (e) {\n      if (ticket !== request || view.hidden) return;\n      $('#audit-state').textContent = '';\n      $('#audit-error').textContent = e.message || t('ad.loadFail');\n      $('#audit-error').hidden = false;\n    } finally { if (ticket === request) $('#audit-refresh').disabled = false; }\n  }\n  function selectView(audit) {\n    view.hidden = !audit;\n    $('#admin-files-view').hidden = audit;\n    for (const [id, active] of [['admin-files-tab', !audit], ['admin-audit-tab', audit]]) {\n      $('#' + id).setAttribute('aria-pressed', String(active));\n    }\n    if (audit) load(); else { request++; close(); }\n  }\n  $('#admin-files-tab').addEventListener('click', () => selectView(false));\n  $('#admin-audit-tab').addEventListener('click', () => selectView(true));\n  $('#audit-filter').addEventListener('submit', e => {\n    e.preventDefault();\n    const from = $('#audit-from').value, to = $('#audit-to').value;\n    if (from && to && from > to) {\n      $('#audit-error').textContent = t('audit.dateError'); $('#audit-error').hidden = false; return;\n    }\n    filters = { result: $('#audit-result').value, q: $('#audit-q').value.trim() };\n    if (from) filters.from = new Date(`${from}T00:00:00`).getTime();\n    if (to) { const end = new Date(`${to}T00:00:00`); end.setDate(end.getDate() + 1); filters.to = end.getTime() - 1; }\n    offset = 0; load();\n  });\n  $('#audit-reset').addEventListener('click', () => { $('#audit-filter').reset(); filters = {}; offset = 0; load(); });\n  for (const button of document.querySelectorAll('.audit-categories button')) button.addEventListener('click', () => {\n    category = button.dataset.category; offset = 0;\n    for (const item of document.querySelectorAll('.audit-categories button')) item.setAttribute('aria-pressed', String(item === button));\n    load();\n  });\n  $('#audit-prev').addEventListener('click', async () => { offset = Math.max(0, offset - limit); await load(); if (!view.hidden) scrollToList('#admin-audit-view'); });\n  $('#audit-next').addEventListener('click', async () => { offset += limit; await load(); if (!view.hidden) scrollToList('#admin-audit-view'); });\n  $('#audit-refresh').addEventListener('click', load);\n  window.addEventListener('admin-page-size', event => {\n    if (event.detail.name !== 'audit') return;\n    limit = event.detail.value; offset = 0;\n    if (!view.hidden) load();\n  });\n  $('#audit-export').addEventListener('click', async () => {\n    $('#audit-export').disabled = true;\n    $('#audit-error').hidden = true;\n    const exportFilters = { ...filters, category };\n    try {\n      const params = new URLSearchParams({ ...exportFilters, offset: 0, limit: 1000 });\n      const data = await api(`/api/admin/audit-logs/export?${params}`);\n      const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), filters: exportFilters, ...data }, null, 2)], { type: 'application/json' });\n      const url = URL.createObjectURL(blob);\n      const link = el('a', { href: url, download: `audit-${new Date().toISOString().slice(0, 10)}.json` });\n      document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);\n    } catch (e) { $('#audit-error').textContent = e.message || t('ad.loadFail'); $('#audit-error').hidden = false; }\n    finally { $('#audit-export').disabled = !available || total === 0; }\n  });\n  $('#audit-close').addEventListener('click', close);\n  dialog.addEventListener('cancel', e => { e.preventDefault(); close(); });\n  window.addEventListener('audit-write-failed', () => { $('#audit-write-warning').hidden = false; });\n  onLangChange(() => { close(); if (!view.hidden) load(); });\n}\n", "js/admin-layout.js": `import { $, el, copyText, toast } from './common.js?v=732e7eabbd2c58e9';
import { t, onLangChange } from './i18n.js?v=732e7eabbd2c58e9';

/** The approved counter/seal layout; existing APIs and security controllers remain authoritative. */
export function initCombinedAdmin() {
  const trash = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></svg>';
  const footer = $('.admin-footer');
  const selects = [];
  for (const [name, selector] of [['files', '#files-pager'], ['audit', '#audit-pager']]) {
    const source = $(\`#\${name}-page-size\`), copy = source.cloneNode(true);
    copy.id = \`\${name}-page-size-toolbar\`;
    copy.removeAttribute('data-i18n');
    copy.value = source.value;
    copy.addEventListener('change', () => { source.value = copy.value; source.dispatchEvent(new Event('change', { bubbles: true })); });
    source.addEventListener('change', () => { copy.value = source.value; });
    $(selector).insertBefore(copy, $(selector).querySelector('.pager-btns'));
    selects.push(copy);
  }
  let syncRows;
  function enhanceRows() {
    for (const row of $('#shares-body').rows) {
      if (row.cells.length !== 9) continue;
      const code = row.cells[0];
      if (!code.querySelector('button')) {
        const value = code.textContent;
        const button = el('button', { type: 'button', class: 'admin-code', onclick: async () => toast(t(await copyText(value) ? 'ad.codeCopied' : 'ad.copyFailed')) }, value);
        code.replaceChildren(button);
        code.append(el('small', { class: 'admin-mobile-size' }, row.cells[3].textContent));
      }
      const remove = row.cells[8].querySelector('button');
      if (remove) {
        remove.classList.add('admin-remove');
        remove.setAttribute('aria-label', t('ad.delete') + ' ' + row.cells[1].textContent);
        remove.title = t('ad.delete');
        if (!remove.querySelector('svg')) remove.innerHTML = trash;
      }
    }
  }
  syncRows = new MutationObserver(enhanceRows);
  syncRows.observe($('#shares-body'), { childList: true, subtree: true });
  function labels() {
    footer.firstElementChild.textContent = t('ad.adminFooter');
    footer.lastElementChild.textContent = t('ad.contact');
    for (const select of selects) select.setAttribute('aria-label', t('ad.currentPageSize'));
    $('#stats-row').setAttribute('aria-label', t('ad.overview'));
    enhanceRows();
  }
  // File-search details use the same compact help component as all other explanations.
  const searchHint = el('span', {}, t('ad.searchHint'));
  window.attachHelp($('#files-filter button[type=submit]'), searchHint);
  onLangChange(() => { searchHint.textContent = t('ad.searchHint'); });
  onLangChange(labels);
  labels();
}
`, "js/admin-preferences.js": "import { $ } from './common.js?v=732e7eabbd2c58e9';\nimport { t } from './i18n.js?v=732e7eabbd2c58e9';\n\nconst options = { files: [10, 20, 40], audit: [20, 50, 100] };\nconst values = { files: 20, audit: 20 };\nfor (const name of Object.keys(values)) {\n  try {\n    const saved = Number(localStorage.getItem(`admin-page-size-${name}`));\n    if (options[name].includes(saved)) values[name] = saved;\n  } catch { /* Browser preferences are optional when persistent storage is blocked. */ }\n}\nexport function pageSize(name) { return values[name]; }\n\nexport function scrollToList(selector) {\n  const list = $(selector);\n  const top = list.querySelector('.table-wrap').getBoundingClientRect().top + window.scrollY\n    - list.querySelector('.list-toolbar').getBoundingClientRect().height - 20;\n  window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });\n}\n\nexport function initAdminPreferences() {\n  const dialog = $('#settings-dialog');\n  $('#admin-settings-btn').addEventListener('click', () => dialog.showModal());\n  $('#settings-close').addEventListener('click', () => dialog.close());\n  for (const name of Object.keys(values)) {\n    const select = $(`#${name}-page-size`);\n    select.value = String(values[name]);\n    select.addEventListener('change', () => {\n      const value = Number(select.value);\n      if (!options[name].includes(value)) return;\n      values[name] = value;\n      $('#preferences-error').hidden = true;\n      try { localStorage.setItem(`admin-page-size-${name}`, String(value)); }\n      catch {\n        $('#preferences-error').textContent = t('ad.preferenceNotSaved');\n        $('#preferences-error').hidden = false;\n      }\n      window.dispatchEvent(new CustomEvent('admin-page-size', { detail: { name, value } }));\n    });\n  }\n  window.addEventListener('audit-write-failed', () => { $('#settings-audit-warning').hidden = false; });\n}\n", "js/admin-preview.js": "import { el } from './common.js?v=732e7eabbd2c58e9';\nimport { t } from './i18n.js?v=732e7eabbd2c58e9';\n\n/** CSV excerpt, preserving quoted commas/newlines and omitting an incomplete last record. */\nexport function csvExcerpt(text, truncated) {\n  const rows = []; let row = [], cell = '', quoted = false, afterQuote = false, clipped = truncated;\n  const pushCell = () => { row.push(cell); cell = ''; afterQuote = false; };\n  const pushRow = () => { pushCell(); rows.push(row.slice(0, 20)); if (row.length > 20) clipped = true; row = []; };\n  for (let i = 0; i < text.length; i++) {\n    const c = text[i];\n    if (quoted) {\n      if (c === '\"') { if (text[i + 1] === '\"') { cell += '\"'; i++; } else { quoted = false; afterQuote = true; } }\n      else cell += c;\n    } else if (c === ',' || c === '\\n' || c === '\\r') {\n      if (c === ',') pushCell();\n      else { if (c === '\\r' && text[i + 1] === '\\n') i++; pushRow(); }\n    } else if (c === '\"' && !cell && !afterQuote) quoted = true;\n    else { if (afterQuote || c === '\"') return null; cell += c; }\n    if (rows.length >= 50) { clipped ||= i < text.length - 1; return { rows, clipped }; }\n  }\n  if (!truncated) {\n    if (quoted) return null;\n    if (cell || row.length || afterQuote) pushRow();\n  }\n  return { rows, clipped };\n}\n\nexport function createFilePreview(code, filename) {\n  const scope = el('small', { class: 'muted' });\n  const body = el('div', { class: 'file-preview-body' });\n  const element = el('section', { class: 'file-preview file-wide', 'aria-label': t('preview.title') },\n    el('div', { class: 'file-preview-heading' }, el('b', {}, t('preview.title')), scope), body);\n  let controller, objectUrl, closed = false;\n  function release() { if (objectUrl) URL.revokeObjectURL(objectUrl); objectUrl = null; }\n  async function load() {\n    controller?.abort(); release();\n    const current = new AbortController(); controller = current;\n    const timeout = setTimeout(() => current.abort(), 15000);\n    body.textContent = t('ad.loading'); scope.textContent = '';\n    try {\n      const response = await fetch(`/api/admin/shares/${code}/preview`, { signal: current.signal });\n      if (response.headers.get('X-Audit-Status') === 'unavailable') window.dispatchEvent(new Event('audit-write-failed'));\n      if (!response.ok) throw new Error(t(response.status === 410 || response.status === 404 ? 'ad.fileState.missing' : 'ad.loadFail'));\n      if (response.headers.get('Content-Type')?.startsWith('image/')) {\n        const blob = await response.blob();\n        if (closed || controller !== current) return;\n        if (blob.size > 2 * 1024 * 1024) throw new Error(t('preview.size'));\n        objectUrl = URL.createObjectURL(blob);\n        const img = el('img', { src: objectUrl, alt: filename, class: 'file-preview-image' });\n        img.addEventListener('error', () => { if (!closed && controller === current) { release(); body.textContent = t('preview.image'); } });\n        body.replaceChildren(img);\n        scope.textContent = `${response.headers.get('X-Preview-Width')} \xD7 ${response.headers.get('X-Preview-Height')}`;\n      } else {\n        const data = await response.json();\n        if (closed || controller !== current) return;\n        if (data.kind === 'unsupported') {\n          body.textContent = t(['type', 'size', 'encoding', 'image'].includes(data.reason) ? `preview.${data.reason}` : 'preview.type');\n        } else {\n          if (!['text', 'csv'].includes(data.kind) || typeof data.text !== 'string' || data.text.length > 65536) throw new Error(t('ad.loadFail'));\n          const csv = data.kind === 'csv' ? csvExcerpt(data.text, data.truncated) : null;\n          scope.textContent = t(data.truncated || csv?.clipped ? 'preview.partial' : 'preview.complete');\n          if (csv?.rows.length) {\n            const table = el('table', { class: 'file-preview-table', 'aria-label': t('preview.title') });\n            table.append(el('tbody', {}, ...csv.rows.map(row => el('tr', {}, ...row.map(cell => el('td', {}, cell))))));\n            body.replaceChildren(table);\n          } else body.replaceChildren(el('pre', {}, data.text || t('preview.empty')));\n        }\n      }\n    } catch (error) {\n      if (!closed && controller === current) body.replaceChildren(\n        el('span', { role: 'alert' }, current.signal.aborted ? t('preview.timeout') : error.message || t('ad.loadFail')),\n        el('button', { type: 'button', class: 'btn small ghost', onclick: load }, t('ad.retry')));\n    } finally { clearTimeout(timeout); }\n  }\n  load();\n  return { element, dispose() { closed = true; controller?.abort(); release(); body.replaceChildren(); } };\n}\n", "js/admin-security.js": "import { api } from './common.js?v=732e7eabbd2c58e9';\nexport function initSecurity() {\n    /* Security workspace backed by authenticated, persistent server actions. */\n    (() => {\n        if (!document.querySelector('#admin-panel'))\n            return;\n        const $ = s => document.querySelector(s), nav = $('#admin-navigation');\n        const t = (zh, en) => document.documentElement.lang === 'en' ? en : zh;\n        const el = (tag, attrs = {}, ...children) => { const n = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) {\n            if (k === 'class')\n                n.className = v;\n            else if (k === 'click')\n                n.addEventListener('click', v);\n            else\n                n.setAttribute(k, v);\n        } for (const c of children.flat())\n            if (c != null)\n                n.append(c instanceof Node ? c : document.createTextNode(String(c))); return n; };\n        let pendingAction = false;\n        const btn = (zh, en, fn, cls = 'btn small ghost') => el('button', { type: 'button', class: cls, click: async (event) => {\n                const button = event.currentTarget;\n                if (button.disabled)\n                    return;\n                let controls = [];\n                try {\n                    const result = fn();\n                    if (result && typeof result.then === 'function') {\n                        controls = [...dialog.querySelectorAll('button,input,select')].map(n => [n, n.disabled]);\n                        for (const [n] of controls)\n                            n.disabled = true;\n                        button.disabled = true;\n                        pendingAction = true;\n                        await result;\n                    }\n                }\n                catch (error) {\n                    if (dialog.open)\n                        fail($('#sec-form-error'), error.message);\n                    else {\n                        toast(error.message);\n                        feedback.classList.add('sec-feedback-error');\n                    }\n                }\n                finally {\n                    pendingAction = false;\n                    if (button.isConnected)\n                        button.disabled = false;\n                    for (const [n, disabled] of controls)\n                        if (n.isConnected)\n                            n.disabled = disabled;\n                }\n            } }, t(zh, en));\n        const input = (id, value = '', attrs = {}) => el('input', { id, value, ...attrs });\n        const field = (zh, en, node) => el('label', { class: 'sec-field', for: node.id }, el('span', {}, t(zh, en)), node.type === 'number' ? numberControl(node, t(zh, en)) : node);\n        const numberControl = (node, label) => window.numberControl(node, label);\n        const date = n => new Intl.DateTimeFormat(document.documentElement.lang === 'en' ? 'en-GB' : 'zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(n);\n        const liveBans = () => store.bans.filter(b => b.until === null || b.until > Date.now());\n        const scopes = [['login', '\u540E\u53F0\u767B\u5F55', 'Admin login'], ['upload', '\u4E0A\u4F20', 'Upload'], ['pickup', '\u53D6\u4EF6', 'Pickup']];\n        const scopeName = key => { const s = scopes.find(s => s[0] === key); return t(s[1], s[2]); };\n        const scopeText = list => list.map(scopeName).join(' / ');\n        const scopeBadges = (list, sup = false) => el(sup ? 'sup' : 'div', { class: 'sec-scope-badges' + (sup ? ' sec-scope-sup' : '') }, ...list.map(s => el('span', { 'data-tone': { login: 'blue', upload: 'orange', pickup: 'teal' }[s] }, scopeName(s))));\n        const ipLine = row => el('div', { class: 'sec-ip-line' }, el('b', { class: 'mono' }, row.ip), scopeBadges(row.scopes, true));\n        function scopePicker(values = ['login'], prefix = 'sec-scope', disabled = []) {\n            const checks = scopes.map(([key, zh, en]) => { const n = input(prefix + '-' + key, '', { type: 'checkbox' }); n.disabled = disabled.includes(key); n.checked = !n.disabled && values.includes(key); return { key, n, label: el('label', { class: 'sec-check' }, n, t(zh, en)) }; });\n            return { node: el('fieldset', { class: 'sec-scope-picker' }, el('legend', {}, t('\u4FDD\u62A4\u8303\u56F4', 'Protected actions')), ...checks.map(c => c.label)), values: () => checks.filter(c => c.n.checked && !c.n.disabled && !disabled.includes(c.key)).map(c => c.key) };\n        }\n        const geography = { CN: { label: ['\u4E2D\u56FD', 'China'], regions: { ZJ: ['\u6D59\u6C5F', 'Zhejiang'], GX: ['\u5E7F\u897F', 'Guangxi'], GD: ['\u5E7F\u4E1C', 'Guangdong'], SH: ['\u4E0A\u6D77', 'Shanghai'], BJ: ['\u5317\u4EAC', 'Beijing'] } }, US: { label: ['\u7F8E\u56FD', 'United States'], regions: { CA: ['\u52A0\u5229\u798F\u5C3C\u4E9A', 'California'], NY: ['\u7EBD\u7EA6\u5DDE', 'New York'] } }, SG: { label: ['\u65B0\u52A0\u5761', 'Singapore'], regions: {} }, JP: { label: ['\u65E5\u672C', 'Japan'], regions: { '13': ['\u4E1C\u4EAC\u90FD', 'Tokyo'] } }, DE: { label: ['\u5FB7\u56FD', 'Germany'], regions: {} } };\n        const regionName = r => [geography[r.country] ? t(...geography[r.country].label) : r.country, r.region ? (geography[r.country]?.regions[r.region] ? t(...geography[r.country].regions[r.region]) : r.region) : t('\u5168\u90E8\u5730\u533A', 'All regions')].join(' \xB7 ');\n        const activeRegions = () => store.regions.filter(r => r.enabled && (r.until === null || r.until > Date.now()));\n        const overlaps = (a, b) => a.some(s => b.includes(s));\n        function geoPicker(country = 'CN', region = '', unknown = false) {\n            const countryInput = input('sec-country', country, { list: 'sec-country-options', maxlength: 2, placeholder: unknown ? t('\u7559\u7A7A\u8868\u793A\u672A\u77E5', 'Blank for unknown') : 'CN', autocomplete: 'off' });\n            const countries = el('datalist', { id: 'sec-country-options' }, ...Object.entries(geography).map(([key, g]) => el('option', { value: key }, t(...g.label))));\n            const regionInput = input('sec-region', region, { list: 'sec-region-options', maxlength: 10, placeholder: t('\u5168\u90E8\u7701\u5DDE\uFF08\u53EF\u586B\u4EE3\u7801\uFF09', 'All subdivisions (or enter code)'), autocomplete: 'off' }), regions = el('datalist', { id: 'sec-region-options' });\n            const update = () => { countryInput.value = countryInput.value.toUpperCase(); regions.replaceChildren(...Object.entries(geography[countryInput.value]?.regions || {}).map(([key, label]) => el('option', { value: key }, t(...label)))); };\n            countryInput.addEventListener('input', () => { regionInput.value = ''; update(); });\n            regionInput.addEventListener('input', () => { regionInput.value = regionInput.value.toUpperCase(); });\n            update();\n            const node = el('div', { class: 'sec-form-grid' }, field('\u56FD\u5BB6 / \u5730\u533A\u4EE3\u7801', 'Country code', countryInput), field('\u7701 / \u5DDE\u4EE3\u7801', 'Subdivision code', regionInput), countries, regions);\n            window.attachHelp(node.querySelector('label > span'), el('span', {}, t('\u4F7F\u7528 Cloudflare \u7684\u56FD\u5BB6\u4E0E\u7701\u5DDE\u4EE3\u7801\uFF0C\u5982 CN / ZJ\u3001US / TX\u3002\u7701\u5DDE\u7559\u7A7A\u8868\u793A\u6574\u4E2A\u56FD\u5BB6\uFF1B\u53EF\u9009\u62E9\u5E38\u7528\u4EE3\u7801\u6216\u81EA\u884C\u8F93\u5165\u3002', 'Use Cloudflare country/subdivision codes, e.g. CN / ZJ or US / TX. A blank subdivision covers the country. Select a suggestion or enter a code.')));\n            return { country: countryInput, region: regionInput, node };\n        }\n        /** Four intent-based choices; existing region rules may retain their expiry. */\n        function durationPicker(id, initial = '60', keep = false) {\n            const presets = [['60', '1 \u5C0F\u65F6', '1 hour'], ['1440', '1 \u5929', '1 day'],\n                ['10080', '7 \u5929', '7 days'], ['0', '\u6C38\u4E45', 'Permanent']];\n            const select = el('select', { id }, ...(keep ? [el('option', { value: 'keep' }, t('\u4FDD\u6301\u539F\u5230\u671F\u65F6\u95F4', 'Keep current expiry'))] : []),\n                ...presets.map(([value, zh, en]) => el('option', { value }, t(zh, en))));\n            select.value = initial;\n            return { node: field('\u5C01\u7981\u65F6\u957F', 'Ban duration', select),\n                minutes: () => select.value === 'keep' ? 'keep' : Number(select.value) };\n        }\n        let store = { enabled: false, configRevision: '', rules: { login: { enabled: true, limit: 5, window: 10, duration: 30 }, upload: { enabled: true, limit: 20, window: 10, duration: 30 }, pickup: { enabled: true, limit: 10, window: 10, duration: 30 } }, bans: [], allow: [], regions: [] };\n        const selected = new Set();\n        let tab = 'bans', query = '', kind = 'all', scopeFilter = 'all', page = 1, open = false, failed = false, empty = false, lastFocus = null, loaded = false, loading = false;\n        function validateState(data) {\n            if (!data || typeof data.enabled !== 'boolean' || typeof data.configRevision !== 'string' || !scopes.every(([k]) => data.rules?.[k] && typeof data.rules[k].enabled === 'boolean' && ['limit', 'window', 'duration'].every(n => Number.isInteger(data.rules[k][n]) && data.rules[k][n] > 0)) || !['bans', 'allow', 'regions'].every(k => Array.isArray(data[k]) && data[k].every(r => r && Array.isArray(r.scopes) && r.scopes.every(v => scopes.some(([s]) => s === v)))))\n                throw new Error(t('\u9632\u62A4\u72B6\u6001\u683C\u5F0F\u65E0\u6548', 'Invalid protection response'));\n            return data;\n        }\n        async function refresh() { if (loading)\n            return; loading = true; render(); try {\n            store = validateState(await api('/api/admin/security'));\n            loaded = true;\n            failed = false;\n        }\n        catch (error) {\n            failed = true;\n            throw error;\n        }\n        finally {\n            loading = false;\n            render();\n        } }\n        async function mutate(action, data = {}) { await api('/api/admin/security', { method: 'POST', body: { action, configRevision: store.configRevision, ...data } }); try {\n            store = validateState(await api('/api/admin/security'));\n            failed = false;\n        }\n        catch {\n            failed = true;\n            throw new Error(t('\u64CD\u4F5C\u5DF2\u4FDD\u5B58\uFF0C\u4F46\u72B6\u6001\u5237\u65B0\u5931\u8D25\u3002\u8BF7\u5173\u95ED\u5F39\u7A97\u5E76\u5237\u65B0\uFF0C\u52FF\u91CD\u590D\u63D0\u4EA4\u3002', 'Saved, but refresh failed. Close and refresh without submitting again.'));\n        } }\n        const view = el('section', { id: 'security-view', hidden: '', 'aria-labelledby': 'security-title' });\n        $('#admin-panel').insertBefore(view, $('.admin-footer'));\n        const navButton = btn('\u5B89\u5168\u9632\u62A4', 'Security', () => show(), 'admin-nav-link');\n        navButton.id = 'admin-security-tab';\n        navButton.setAttribute('aria-controls', 'security-view');\n        navButton.setAttribute('aria-pressed', 'false');\n        nav.append(navButton);\n        const dialog = el('dialog', { id: 'security-dialog', class: 'source-dialog sec-dialog', 'aria-labelledby': 'security-dialog-title' });\n        document.body.append(dialog);\n        const old = $('#login-protection');\n        old.hidden = true;\n        const shortcut = el('section', { class: 'settings-section sec-setting-entry' }, el('h4', {}, t('\u5B89\u5168\u9632\u62A4', 'Security')), btn('\u7BA1\u7406\u8BBF\u95EE\u89C4\u5219\u4E0E\u5C01\u7981 \u2192', 'Manage access rules and bans \u2192', () => { $('#settings-dialog').close(); show(); }));\n        old.before(shortcut);\n        const auditEntry = $('.ui-guard-entry');\n        if (auditEntry) {\n            auditEntry.textContent = t('\u5B89\u5168\u9632\u62A4', 'Security');\n            auditEntry.onclick = () => show();\n        }\n        function show() { open = true; $('#admin-files-view').hidden = true; $('#admin-audit-view').hidden = true; view.hidden = false; for (const n of nav.querySelectorAll('button'))\n            n.setAttribute('aria-pressed', String(n === navButton)); render(); if (!loaded && !loading)\n            refresh().catch(error => toast(error.message)); }\n        for (const id of ['#admin-files-tab', '#admin-audit-tab'])\n            $(id).addEventListener('click', () => { open = false; view.hidden = true; navButton.setAttribute('aria-pressed', 'false'); });\n        const feedback = el('div', { id: 'sec-feedback', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' });\n        document.body.append(feedback);\n        let feedbackTimer;\n        function clearFeedback() { clearTimeout(feedbackTimer); feedback.textContent = ''; feedback.classList.remove('sec-feedback-error'); }\n        function toast(msg) { clearFeedback(); feedback.textContent = msg; feedbackTimer = setTimeout(clearFeedback, 4000); }\n        for (const id of ['#admin-files-tab', '#admin-audit-tab'])\n            $(id).addEventListener('click', clearFeedback);\n        dialog.addEventListener('close', () => { if (!open)\n            clearFeedback(); });\n        const auditLabels = { manualBan: ['\u624B\u52A8\u5C01\u7981 IP', 'Manually ban IP'], allowIP: ['\u6DFB\u52A0\u5141\u8BB8 IP', 'Allow IP'], removeAllow: ['\u79FB\u9664\u5141\u8BB8 IP', 'Remove allowed IP'], securityRules: ['\u4FEE\u6539\u9632\u62A4\u89C4\u5219', 'Change protection rules'], regionAdd: ['\u6DFB\u52A0\u5730\u533A\u5C01\u7981', 'Add region ban'], regionEdit: ['\u4FEE\u6539\u5730\u533A\u5C01\u7981', 'Edit region ban'], regionToggle: ['\u5207\u6362\u5730\u533A\u89C4\u5219\u72B6\u6001', 'Toggle region rule'], regionRemove: ['\u79FB\u9664\u5730\u533A\u5C01\u7981', 'Remove region ban'] };\n        function translateAudit() { for (const host of [$('#audit-body'), $('#audit-detail')]) {\n            const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);\n            let n;\n            while (n = walker.nextNode()) {\n                const label = auditLabels[n.textContent.replace('audit.action.', '')];\n                if (label && n.textContent.startsWith('audit.action.'))\n                    n.textContent = t(...label);\n            }\n        } }\n        for (const host of [$('#audit-body'), $('#audit-detail')])\n            new MutationObserver(translateAudit).observe(host, { childList: true, subtree: true });\n        function close() { dialog.close(); if (lastFocus?.isConnected)\n            lastFocus.focus(); }\n        dialog.addEventListener('cancel', e => { e.preventDefault(); if (!pendingAction)\n            close(); });\n        dialog.addEventListener('keydown', e => { if (e.key !== 'Tab')\n            return; const a = [...dialog.querySelectorAll('button,input,select,textarea')].filter(n => !n.disabled && n.getClientRects().length); if (!a.length)\n            return; const first = a[0], last = a.at(-1); if (e.shiftKey && document.activeElement === first) {\n            e.preventDefault();\n            last.focus();\n        }\n        else if (!e.shiftKey && document.activeElement === last) {\n            e.preventDefault();\n            first.focus();\n        } });\n        function modal(zh, en) { clearFeedback(); lastFocus = document.activeElement; dialog.classList.remove('sec-rules-dialog'); dialog.replaceChildren(); const head = el('div', { class: 'source-heading' }, el('h3', { id: 'security-dialog-title' }, t(zh, en)), btn('\u5173\u95ED', 'Close', close)); const body = el('div', { class: 'source-body sec-dialog-body' }), error = el('p', { id: 'sec-form-error', class: 'error-box', hidden: '', role: 'alert' }), foot = el('div', { class: 'source-footer' }); body.append(error); dialog.append(head, body, foot); dialog.showModal(); return { body, foot, error }; }\n        function fail(node, msg) { node.textContent = msg; node.hidden = false; }\n        function canonical(value) { const s = value.trim(); if (/^\\d{1,3}(\\.\\d{1,3}){3}$/.test(s) && s.split('.').every(x => Number(x) <= 255 && !/^0\\d/.test(x)))\n            return s; if (s.includes(':') && !/[\\s/%\\[\\]]/.test(s)) {\n            try {\n                return new URL('http://[' + s + ']/').hostname.slice(1, -1).toLowerCase();\n            }\n            catch { }\n        } return null; }\n        function logLink(ip) { $('#admin-audit-tab').click(); $('#audit-reset').click(); $('#audit-q').value = ip; $('#audit-filter').requestSubmit(); }\n        function confirmUnban(ips) { const current = liveBans().filter(b => ips.includes(b.ip)); if (!current.length)\n            return; const m = modal('\u89E3\u9664 IP \u5C01\u7981', 'Unban IPs'); m.body.prepend(el('p', {}, t(`\u89E3\u9664 ${current.length} \u4E2A IP \u7684\u5C01\u7981\uFF1F`, `Remove bans for ${current.length} IP addresses?`)), ...current.map(b => el('div', {}, el('b', { class: 'mono' }, b.ip), scopeBadges(b.scopes))), el('small', { class: 'muted' }, t('\u5730\u533A\u5C01\u7981\u53CA\u5176\u4ED6\u8BBF\u95EE\u9650\u5236\u4ECD\u7136\u751F\u6548\u3002', 'Region bans and other access restrictions still apply.'))); m.foot.append(btn('\u53D6\u6D88', 'Cancel', close), btn('\u786E\u8BA4\u89E3\u5C01', 'Unban', async () => { await mutate('unban', { ips }); selected.clear(); close(); render(); toast(t('\u5DF2\u89E3\u9664\u5C01\u7981', 'Bans removed')); }, 'btn primary')); }\n        function openAdd(allow = false) {\n            const m = modal(allow ? '\u6DFB\u52A0\u5141\u8BB8 IP' : '\u624B\u52A8\u5C01\u7981 IP', allow ? 'Allow IP' : 'Ban IP');\n            const ip = input('sec-ip', '', { placeholder: '203.0.113.20 / 2001:db8::1', autocomplete: 'off' }), note = input('sec-note', '', { maxlength: 120, placeholder: t('\u7528\u9014\u6216\u539F\u56E0', 'Purpose or reason') });\n            const duration = allow ? null : durationPicker('sec-duration'), scope = scopePicker(allow ? ['login'] : ['login', 'upload', 'pickup']);\n            m.body.prepend(field('IP \u5730\u5740', 'IP address', ip), scope.node, ...(allow ? [] : [duration.node]), field(allow ? '\u5907\u6CE8' : '\u5C01\u7981\u539F\u56E0', allow ? 'Note' : 'Ban reason', note), el('small', { class: 'muted' }, t(allow ? '\u4EC5\u8C41\u514D\u6240\u9009\u8303\u56F4\u7684\u81EA\u52A8\u5C01\u7981\uFF0C\u4E0D\u7ED5\u8FC7\u624B\u52A8\u5C01\u7981\u3001\u5730\u533A\u89C4\u5219\u6216\u8EAB\u4EFD\u6821\u9A8C\u3002' : '\u5728\u6240\u9009\u8303\u56F4\u62E6\u622A\u540E\u7EED\u8BF7\u6C42\uFF1B\u540E\u53F0\u767B\u5F55\u8303\u56F4\u4E0D\u64A4\u9500\u5DF2\u767B\u5F55\u4F1A\u8BDD\u3002', allow ? 'Exempts automatic bans in selected scopes, never manual bans, region rules or authentication.' : 'Blocks subsequent requests in selected scopes; login bans do not revoke existing sessions.')));\n            window.attachHelp($('#security-dialog-title'), m.body.querySelector(':scope > small'));\n            m.foot.append(btn('\u53D6\u6D88', 'Cancel', close), btn(allow ? '\u6DFB\u52A0\u5141\u8BB8 IP' : '\u786E\u8BA4\u5C01\u7981', allow ? 'Allow IP' : 'Ban IP', async () => {\n                const value = canonical(ip.value), chosen = scope.values();\n                if (!value)\n                    return fail(m.error, t('\u8BF7\u8F93\u5165\u5355\u4E2A\u6709\u6548 IPv4 \u6216 IPv6 \u5730\u5740\u3002', 'Enter one valid IPv4 or IPv6 address.'));\n                if (!chosen.length)\n                    return fail(m.error, t('\u81F3\u5C11\u9009\u62E9\u4E00\u4E2A\u4FDD\u62A4\u8303\u56F4\u3002', 'Select at least one protected action.'));\n                if ((allow ? store.allow : liveBans()).some(b => b.ip === value))\n                    return fail(m.error, t('\u8BE5\u540D\u5355\u5DF2\u6709\u6B64 IP\uFF0C\u8BF7\u5148\u79FB\u9664\u539F\u8BB0\u5F55\u518D\u8C03\u6574\u8303\u56F4\u3002', 'This list already contains the IP. Remove the existing entry to change its scope.'));\n                if (!note.value.trim())\n                    return fail(m.error, t('\u8BF7\u586B\u5199\u5907\u6CE8\u6216\u539F\u56E0\uFF0C\u4FBF\u4E8E\u540E\u7EED\u5BA1\u8BA1\u3002', 'Enter a note or reason for the audit trail.'));\n                const minutes = allow ? 0 : duration.minutes();\n                await mutate(allow ? 'allow' : 'ban', { ip: value, scopes: chosen, note: note.value.trim(), minutes });\n                tab = allow ? 'allow' : 'bans';\n                query = '';\n                kind = 'all';\n                scopeFilter = 'all';\n                page = 1;\n                empty = false;\n                close();\n                render();\n                toast(t('\u8BB0\u5F55\u5DF2\u6DFB\u52A0', 'Entry added'));\n            }, 'btn primary'));\n            ip.focus();\n        }\n        function removeAllow(row) { const m = modal('\u79FB\u9664\u5141\u8BB8 IP', 'Remove allowed IP'); m.body.prepend(el('p', { class: 'mono' }, row.ip), scopeBadges(row.scopes), el('p', {}, t('\u79FB\u9664\u540E\uFF0C\u8BE5 IP \u5C06\u91CD\u65B0\u9002\u7528\u6240\u9009\u8303\u56F4\u7684\u81EA\u52A8\u5C01\u7981\u89C4\u5219\u3002', 'Automatic ban rules will apply again in these scopes.'))); m.foot.append(btn('\u53D6\u6D88', 'Cancel', close), btn('\u79FB\u9664', 'Remove', async () => { await mutate('removeAllow', { ip: row.ip }); close(); render(); toast(t('\u5DF2\u79FB\u9664\u5141\u8BB8 IP', 'Allow entry removed')); }, 'btn primary')); }\n        function editRules() {\n            const m = modal('\u81EA\u52A8\u9632\u62A4\u89C4\u5219', 'Automatic protection rules'), controls = [];\n            dialog.classList.add('sec-rules-dialog');\n            m.body.prepend(el('div', { class: 'sec-rules-columns', 'aria-hidden': 'true' },\n                el('span', {}, t('\u4FDD\u62A4\u8303\u56F4', 'Protection')),\n                el('span', {}, t('\u7EDF\u8BA1\u7A97\u53E3 / \u5206\u949F', 'Window / min')),\n                el('span', {}, t('\u89E6\u53D1\u6B21\u6570', 'Threshold')),\n                el('span', {}, t('\u5C01\u7981\u65F6\u957F / \u5206\u949F', 'Ban / min'))));\n            for (const [key, zh, en] of scopes) {\n                const rule = store.rules[key], suffix = key === 'login' ? '' : '-' + key;\n                const enabled = input('sec-enabled' + suffix, '', { type: 'checkbox' });\n                enabled.checked = rule.enabled;\n                const limit = input('sec-threshold' + suffix, rule.limit, { type: 'number', min: 1, max: 10000, step: 1 }), minutes = input('sec-window' + suffix, rule.window, { type: 'number', min: 1, max: 1440, step: 1 }), duration = input('sec-ban-minutes' + suffix, rule.duration, { type: 'number', min: 1, max: 10080, step: 1 });\n                const toggle = () => { for (const n of [limit, minutes, duration])\n                    n.disabled = !enabled.checked; };\n                enabled.onchange = toggle;\n                toggle();\n                const descriptions = { login: ['\u7BA1\u7406\u4EE4\u724C\u6821\u9A8C\u5931\u8D25\u6B21\u6570', 'Failed admin-token checks'], upload: ['\u53D1\u8D77\u5206\u4EAB\u6B21\u6570\uFF1B\u6587\u4EF6\u548C\u6587\u672C\u5747\u8BA1\u5165\uFF0C\u5206\u7247\u4E0D\u91CD\u590D\u8BA1\u6570', 'Share creation attempts; files and text count, chunks do not'], pickup: ['\u65E0\u6548\u53D6\u4EF6\u53E3\u4EE4\u6B21\u6570\uFF1B\u6210\u529F\u53D6\u4EF6\u4E0D\u8BA1\u5165', 'Invalid pickup-code attempts; successful pickups do not count'] };\n                m.body.append(el('section', { class: 'sec-rule-section', 'aria-labelledby': 'sec-rule-label-' + key }, el('label', { class: 'sec-check', id: 'sec-rule-label-' + key }, enabled, el('b', {}, t(zh, en))), el('small', { class: 'muted' }, t(...descriptions[key])), el('div', { class: 'sec-rule-fields' }, field('\u7A97\u53E3\uFF08\u5206\u949F\uFF09', 'Window (min)', minutes), field('\u89E6\u53D1\u6B21\u6570', 'Threshold', limit), field('\u5C01\u7981\uFF08\u5206\u949F\uFF09', 'Ban (min)', duration))));\n                controls.push({ key, enabled, limit, minutes, duration });\n                const section = m.body.lastElementChild;\n                window.attachHelp(section.querySelector('.sec-check'), section.querySelector(':scope > small'));\n            }\n            m.body.append(el('small', { class: 'muted' }, t('\u6309 IP \u72EC\u7ACB\u8BA1\u6570\uFF0C\u4EC5\u5C01\u7981\u89E6\u53D1\u7684\u8303\u56F4\u3002\u505C\u7528\u89C4\u5219\u4E0D\u4F1A\u89E3\u9664\u5DF2\u6709\u5C01\u7981\u3002', 'Counters are per IP and scope. Pausing a rule does not remove existing bans.')));\n            window.attachHelp($('#security-dialog-title'), m.body.lastElementChild);\n            m.foot.append(btn('\u53D6\u6D88', 'Cancel', close), btn('\u4FDD\u5B58\u89C4\u5219', 'Save rules', async () => { if (controls.some(c => c.enabled.checked && [c.limit, c.minutes, c.duration].some(n => !n.value || !n.reportValidity())))\n                return; const rules = structuredClone(store.rules); for (const c of controls)\n                rules[c.key] = { ...rules[c.key], enabled: c.enabled.checked, ...(c.enabled.checked ? { limit: Number(c.limit.value), window: Number(c.minutes.value), duration: Number(c.duration.value) } : {}) }; await mutate('rules', { rules }); close(); render(); toast(t('\u89C4\u5219\u5DF2\u4FDD\u5B58', 'Rules saved')); }, 'btn primary'));\n        }\n        function editRegion(row = null) {\n            const m = modal(row ? '\u7F16\u8F91\u5730\u533A\u5C01\u7981' : '\u6DFB\u52A0\u5730\u533A\u5C01\u7981', row ? 'Edit region ban' : 'Add region ban');\n            const geo = geoPicker(row?.country || 'CN', row?.region || ''), scope = scopePicker(row?.scopes || ['upload', 'pickup'], 'sec-scope', ['login']), reason = input('sec-region-reason', row?.reason || '', { maxlength: 120, placeholder: t('\u586B\u5199\u5C01\u7981\u539F\u56E0', 'Reason for blocking') });\n            const duration = durationPicker('sec-region-duration', row ? 'keep' : '0', !!row);\n            const enabled = input('sec-region-enabled', '', { type: 'checkbox' });\n            enabled.checked = row?.enabled ?? true;\n            m.body.prepend(geo.node, scope.node, el('div', { class: 'sec-form-grid' }, duration.node, el('label', { class: 'sec-check' }, enabled, t('\u542F\u7528\u89C4\u5219', 'Enable rule'))), field('\u539F\u56E0', 'Reason', reason));\n            m.foot.append(btn('\u53D6\u6D88', 'Cancel', close), btn('\u4FDD\u5B58\u89C4\u5219', 'Save rule', async () => {\n                const chosen = scope.values();\n                if (!chosen.length)\n                    return fail(m.error, t('\u81F3\u5C11\u9009\u62E9\u4E00\u4E2A\u4FDD\u62A4\u8303\u56F4\u3002', 'Select at least one protected action.'));\n                if (!reason.value.trim())\n                    return fail(m.error, t('\u8BF7\u586B\u5199\u5C01\u7981\u539F\u56E0\u3002', 'Enter a reason.'));\n                const minutes = duration.minutes();\n                const until = minutes === 'keep' ? row.until : minutes ? Date.now() + minutes * 60000 : null;\n                if (enabled.checked && until !== null && until <= Date.now())\n                    return fail(m.error, t('\u539F\u89C4\u5219\u5DF2\u8FC7\u671F\uFF0C\u8BF7\u91CD\u65B0\u9009\u62E9\u5C01\u7981\u65F6\u957F\u3002', 'This rule expired; choose a new duration.'));\n                const candidate = { country: geo.country.value, region: geo.region.value, scopes: chosen, enabled: enabled.checked, reason: reason.value.trim(), until };\n                if (store.regions.some(r => r !== row && r.country === candidate.country && r.region === candidate.region && overlaps(r.scopes, chosen)))\n                    return fail(m.error, t('\u8BE5\u5730\u533A\u5DF2\u6709\u91CD\u53E0\u8303\u56F4\u7684\u89C4\u5219\uFF0C\u8BF7\u7F16\u8F91\u73B0\u6709\u89C4\u5219\u3002', 'This region has an overlapping rule. Edit that rule instead.'));\n                await mutate('region', { id: row?.id, rule: candidate });\n                tab = 'regions';\n                query = '';\n                scopeFilter = 'all';\n                page = 1;\n                empty = false;\n                close();\n                render();\n                toast(t('\u5730\u533A\u89C4\u5219\u5DF2\u4FDD\u5B58', 'Region rule saved'));\n            }, 'btn primary'));\n        }\n        function toggleRegion(row) {\n            if (row.until !== null && row.until <= Date.now()) {\n                editRegion(row);\n                $('#sec-region-enabled').checked = true;\n                return;\n            }\n            const m = modal(row.enabled ? '\u505C\u7528\u5730\u533A\u89C4\u5219' : '\u542F\u7528\u5730\u533A\u89C4\u5219', row.enabled ? 'Pause region rule' : 'Enable region rule');\n            m.body.prepend(el('b', {}, regionName(row)), scopeBadges(row.scopes), el('p', {}, t(row.enabled ? '\u505C\u7528\u540E\uFF0C\u8BE5\u5730\u533A\u4E0D\u518D\u53D7\u6B64\u89C4\u5219\u9650\u5236\u3002' : '\u542F\u7528\u540E\uFF0C\u5C06\u62E6\u622A\u6B64\u5730\u533A\u5728\u6240\u9009\u8303\u56F4\u7684\u8BF7\u6C42\u3002', row.enabled ? 'This rule will stop blocking the region.' : 'Requests from this region will be blocked in selected scopes.')));\n            m.foot.append(btn('\u53D6\u6D88', 'Cancel', close), btn('\u786E\u8BA4', 'Confirm', async () => { await mutate('region', { id: row.id, rule: { ...row, enabled: !row.enabled } }); close(); render(); toast(t('\u89C4\u5219\u72B6\u6001\u5DF2\u66F4\u65B0', 'Rule status updated')); }, 'btn primary'));\n        }\n        function removeRegion(row) { const m = modal('\u79FB\u9664\u5730\u533A\u89C4\u5219', 'Remove region rule'); m.body.prepend(el('b', {}, regionName(row)), scopeBadges(row.scopes), el('p', {}, t('\u79FB\u9664\u540E\u4E0D\u518D\u6309\u6B64\u89C4\u5219\u62E6\u622A\uFF1B\u5176\u4ED6\u89C4\u5219\u4ECD\u751F\u6548\u3002', 'This rule will be removed; other rules remain active.'))); m.foot.append(btn('\u53D6\u6D88', 'Cancel', close), btn('\u79FB\u9664', 'Remove', async () => { await mutate('removeRegion', { id: row.id }); close(); render(); toast(t('\u5730\u533A\u89C4\u5219\u5DF2\u79FB\u9664', 'Region rule removed')); }, 'btn primary')); }\n        function testRules() {\n            const m = modal('\u89C4\u5219\u6D4B\u8BD5', 'Test rules'), ip = input('sec-test-ip', '203.0.113.20', { autocomplete: 'off' }), geo = geoPicker('US', '', true), scope = el('select', { id: 'sec-test-scope' }, ...scopes.map(([key, zh, en]) => el('option', { value: key }, t(zh, en))));\n            const count = input('sec-test-count', '0', { type: 'number', min: 0, max: 100000, step: 1 }), hint = el('small', { class: 'muted' }), result = el('div', { id: 'sec-test-result', role: 'status', 'aria-live': 'polite', hidden: '' });\n            const update = () => { const key = scope.value, r = store.rules[key]; hint.textContent = t(`\u586B\u5165\u8BE5 IP \u6700\u8FD1 ${r.window} \u5206\u949F\u7684${key === 'upload' ? '\u53D1\u8D77\u5206\u4EAB' : '\u6821\u9A8C\u5931\u8D25'}\u603B\u6B21\u6570\uFF08\u542B\u672C\u6B21\uFF09\uFF1B\u6D4B\u8BD5\u4E0D\u4F1A\u5199\u5165\u5C01\u7981\u3002`, `Enter ${key === 'upload' ? 'share attempts' : 'failed checks'} in the last ${r.window} min, including this request. Testing does not create a ban.`); result.hidden = true; };\n            scope.onchange = update;\n            update();\n            m.body.prepend(el('div', { class: 'sec-form-grid' }, field('\u6A21\u62DF\u8BF7\u6C42 IP', 'Simulated request IP', ip), field('\u8BF7\u6C42\u8303\u56F4', 'Request scope', scope)), geo.node, field('\u7A97\u53E3\u5185\u6B21\u6570\uFF08\u542B\u672C\u6B21\uFF09', 'Count in window (including this request)', count), hint, el('small', { class: 'muted' }, t('\u5C5E\u5730\u7531\u4F60\u624B\u52A8\u6307\u5B9A\uFF0C\u4E0D\u67E5\u8BE2\u6B64 IP \u7684\u5B9E\u9645\u4F4D\u7F6E\u3002\u653E\u884C\u4EC5\u4EE3\u8868\u901A\u8FC7\u9632\u62A4\uFF0C\u4ECD\u9700\u6EE1\u8DB3\u767B\u5F55\u3001\u5206\u4EAB\u53CA\u53D6\u4EF6\u6821\u9A8C\u3002', 'Location is entered manually, not looked up. Passing protection does not bypass authentication or share permissions.')), result);\n            window.attachHelp(m.body.querySelector('label[for=\"sec-test-count\"] > span'), hint);\n            window.attachHelp($('#security-dialog-title'), m.body.querySelector(':scope > small'));\n            for (const n of [ip, geo.country, geo.region, count])\n                n.addEventListener('input', () => { result.hidden = true; });\n            m.foot.append(btn('\u5173\u95ED', 'Close', close), btn('\u6D4B\u8BD5\u89C4\u5219', 'Test rules', async () => {\n                result.hidden = true;\n                const address = canonical(ip.value);\n                if (!address)\n                    return fail(m.error, t('\u8BF7\u8F93\u5165\u6709\u6548 IP \u5730\u5740\u3002', 'Enter a valid IP address.'));\n                if (!count.value || !count.reportValidity())\n                    return;\n                m.error.hidden = true;\n                const key = scope.value;\n                const { blocked, reason } = await api('/api/admin/security/test', { method: 'POST', body: { ip: address, scope: key, country: geo.country.value, region: geo.region.value, count: Number(count.value) } });\n                result.className = 'sec-test-result ' + (blocked ? 'sec-test-blocked' : 'sec-test-pass');\n                result.replaceChildren(el('b', {}, t(blocked ? '\u62E6\u622A' : '\u9632\u62A4\u653E\u884C', blocked ? 'Blocked' : 'Passes protection') + ' \xB7 ' + scopeName(key)), el('p', {}, reason), ...(!geo.country.value ? [el('small', { class: 'muted' }, t('\u5C5E\u5730\u672A\u77E5\uFF0C\u672A\u5339\u914D\u5730\u533A\u89C4\u5219\uFF1BIP \u4E0E\u81EA\u52A8\u9632\u62A4\u4ECD\u53C2\u4E0E\u5224\u65AD\u3002', 'Unknown location: region rules skipped; IP and automatic rules still apply.'))] : []));\n                result.hidden = false;\n            }, 'btn primary'));\n        }\n        function details(row) { const m = modal('\u5C01\u7981\u8BE6\u60C5', 'Ban details'); const pairs = [[t('IP \u5730\u5740', 'IP address'), row.ip], [t('\u4FDD\u62A4\u8303\u56F4', 'Scope'), scopeText(row.scopes)], [t('\u65B9\u5F0F', 'Type'), row.kind === 'auto' ? t('\u81EA\u52A8\u5C01\u7981', 'Automatic') : t('\u624B\u52A8\u5C01\u7981', 'Manual')], [t('\u539F\u56E0', 'Reason'), row.reason], [t('\u89E6\u53D1\u6B21\u6570', 'Trigger count'), row.kind === 'auto' ? row.failures : '\u2014'], [t('\u5C01\u7981\u65F6\u95F4', 'Banned at'), date(row.at)], [t('\u89E3\u5C01\u65F6\u95F4', 'Expires'), row.until === null ? t('\u6C38\u4E45', 'Never') : date(row.until)]]; m.body.prepend(el('dl', { class: 'sec-details' }, ...pairs.map(([k, v]) => el('div', {}, el('dt', { class: 'muted' }, k), el('dd', {}, v))))); m.foot.append(btn('\u67E5\u770B\u65E5\u5FD7', 'View logs', () => { close(); logLink(row.ip); }), btn('\u5173\u95ED', 'Close', close), btn('\u89E3\u5C01', 'Unban', () => { close(); confirmUnban([row.ip]); }, 'btn primary')); }\n        function rows() { if (empty)\n            return []; return (tab === 'bans' ? liveBans() : tab === 'regions' ? store.regions : store.allow).filter(b => (tab !== 'bans' || kind === 'all' || b.kind === kind) && (scopeFilter === 'all' || b.scopes.includes(scopeFilter)) && (!query || [b.ip, b.note || b.reason, b.country ? regionName(b) : '', scopeText(b.scopes)].join(' ').toLowerCase().includes(query.toLowerCase()))); }\n        function exportRows() { if (failed || loading || !store.enabled || filtersDirty())\n            return; const items = rows(), data = tab === 'regions' ? [['Country', 'Subdivision', 'Scope', 'Enabled', 'Reason', 'Expires'], ...items.map(r => [r.country, r.region, r.scopes.join('|'), r.enabled, r.reason, r.until === null ? 'Never' : new Date(r.until).toISOString()])] : [['IP', 'Scope', tab === 'bans' ? 'Type' : 'Note', tab === 'bans' ? 'Reason' : 'Created', ...(tab === 'bans' ? ['Expires'] : [])], ...items.map(b => tab === 'bans' ? [b.ip, b.scopes.join('|'), b.kind, b.reason, b.until === null ? 'Never' : new Date(b.until).toISOString()] : [b.ip, b.scopes.join('|'), b.note, new Date(b.created).toISOString()])]; const csv = '\\uFEFF' + data.map(r => r.map(v => '\"' + String(v).replace(/^[=+\\-@]/, \"'$&\").replaceAll('\"', '\"\"') + '\"').join(',')).join('\\r\\n'); const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); const a = el('a', { href: url, download: 'security-' + tab + '.csv' }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); toast(t('\u5DF2\u5BFC\u51FA\u5168\u90E8\u5339\u914D\u8BB0\u5F55', 'All matching records exported')); }\n        function filtersDirty() { return $('#sec-search') && ($('#sec-search').value.trim() !== query || ($('#sec-kind')?.value || 'all') !== kind || $('#sec-scope-filter').value !== scopeFilter); }\n        function syncExport() {\n            const dirty = filtersDirty(), exportButton = $('#sec-export'), pending = $('#sec-filter-pending');\n            if (exportButton)\n                exportButton.disabled = failed || loading || !store.enabled || dirty || !rows().length;\n            if (pending)\n                pending.hidden = !dirty;\n        }\n        function render() {\n            const focusId = view.contains(document.activeElement) ? document.activeElement.id : null;\n            clearFeedback();\n            const active = liveBans();\n            for (const ip of selected)\n                if (!active.some(b => b.ip === ip))\n                    selected.delete(ip);\n            navButton.textContent = t('\u5B89\u5168\u9632\u62A4', 'Security');\n            view.replaceChildren();\n            const actions = el('div', { class: 'sec-actions' }, btn('\u9632\u62A4\u89C4\u5219', 'Rules', editRules), btn('\u89C4\u5219\u6D4B\u8BD5', 'Test rules', testRules));\n            actions.children[0].id = 'sec-rules';\n            actions.children[1].id = 'sec-test';\n            if (failed || loading || !store.enabled)\n                for (const n of actions.children)\n                    n.disabled = true;\n            const title = el('h2', { id: 'security-title' }, t('\u5B89\u5168\u9632\u62A4', 'Security'));\n            view.append(el('div', { class: 'sec-heading' }, title, actions));\n            window.attachHelp(title, el('span', {}, t('\u4FDD\u62A4\u540E\u53F0\u767B\u5F55\u3001\u4E0A\u4F20\u548C\u53D6\u4EF6\u3002\u5730\u533A\u5C01\u7981\u4EC5\u4F5C\u7528\u4E8E\u4E0A\u4F20\u548C\u53D6\u4EF6\uFF1B\u5141\u8BB8\u540D\u5355\u53EA\u8C41\u514D\u81EA\u52A8\u5C01\u7981\u3002', 'Protects admin login, uploads and pickups. Region bans apply only to uploads and pickups; allowed IPs bypass automatic bans only.')));\n            const enabled = (!failed && !loading && store.enabled) ? Object.values(store.rules).filter(r => r.enabled).length : 0;\n            const summary = el('div', { class: 'sec-summary' }, el('div', { class: 'sec-auto-summary' }, el('b', { class: failed ? 'sec-warning' : enabled ? 'sec-enabled' : 'muted' }, failed || loading || !store.enabled ? t(loading ? '\u6B63\u5728\u8BFB\u53D6' : failed ? '\u72B6\u6001\u672A\u77E5' : '\u672A\u542F\u7528', loading ? 'Loading' : failed ? 'Status unknown' : 'Unavailable') : enabled ? t(`\u81EA\u52A8\u9632\u62A4 ${enabled} / 3 \u5DF2\u542F\u7528`, `${enabled} / 3 automatic rules enabled`) : t('\u81EA\u52A8\u9632\u62A4\u5DF2\u6682\u505C', 'Automatic protection paused'))), el('div', { class: 'sec-metric' }, el('b', { id: 'sec-ip-total' }, failed || loading || !store.enabled ? '\u2014' : empty ? 0 : active.length), el('small', { class: 'muted' }, t('\u5F53\u524D\u5C01\u7981 IP', 'Active IP bans'))), el('div', { class: 'sec-metric' }, el('b', { id: 'sec-region-total' }, failed || loading || !store.enabled ? '\u2014' : empty ? 0 : activeRegions().length), el('small', { class: 'muted' }, t('\u751F\u6548\u5730\u533A\u89C4\u5219', 'Active region rules'))));\n            const ruleGrid = el('div', { class: 'sec-rule-grid' }), triggers = { login: ['\u4EE4\u724C\u6821\u9A8C\u5931\u8D25', 'Failed token checks'], upload: ['\u53D1\u8D77\u6587\u4EF6\u6216\u6587\u672C\u5206\u4EAB\uFF0C\u5206\u7247\u4E0D\u91CD\u590D\u8BA1\u6570', 'File or text share attempts; chunks do not count'], pickup: ['\u65E0\u6548\u53E3\u4EE4\uFF0C\u6210\u529F\u53D6\u4EF6\u4E0D\u8BA1\u5165', 'Invalid codes; successful pickups do not count'] };\n            if (failed || loading || !store.enabled)\n                summary.firstChild.append(el('small', { class: 'muted' }, t('\u65E0\u6CD5\u8BFB\u53D6\u9632\u62A4\u72B6\u6001\uFF0C\u8BF7\u5237\u65B0\u91CD\u8BD5', 'Unable to read protection status; refresh to retry')));\n            else {\n                for (const [key] of scopes) {\n                    const r = store.rules[key], name = el('b', {}, scopeName(key));\n                    const rule = el('div', { class: 'sec-rule-summary' }, name, el('small', { class: 'muted' }, r.enabled ? t(`${r.window} \u5206\u949F ${r.limit} \u6B21`, `${r.limit} in ${r.window} min`) : t('\u5DF2\u6682\u505C', 'Paused')), el('small', { class: r.enabled ? 'muted' : 'sec-rule-inactive' }, r.enabled ? t(`\u5C01\u7981 ${r.duration} \u5206\u949F`, `${r.duration} min ban`) : t('\u4E0D\u89E6\u53D1\u81EA\u52A8\u5C01\u7981', 'No automatic ban')));\n                    ruleGrid.append(rule);\n                    window.attachHelp(name, el('span', {}, t(...triggers[key])));\n                }\n                summary.firstChild.append(ruleGrid);\n            }\n            view.append(summary);\n            const tabs = el('div', { class: 'sec-tabs', role: 'group', 'aria-label': t('\u9632\u62A4\u540D\u5355', 'Protection lists') });\n            for (const [key, zh, en] of [['bans', '\u5C01\u7981 IP', 'Banned IPs'], ['regions', '\u5730\u533A\u5C01\u7981', 'Region bans'], ['allow', '\u5141\u8BB8\u540D\u5355', 'Allowed IPs']]) {\n                const b = btn(zh, en, () => { tab = key; page = 1; query = ''; kind = 'all'; scopeFilter = 'all'; selected.clear(); render(); });\n                b.setAttribute('aria-pressed', String(tab === key));\n                b.dataset.secTab = key;\n                tabs.append(b);\n            }\n            const add = tab === 'bans' ? btn('\u624B\u52A8\u5C01\u7981', 'Ban IP', () => openAdd(false), 'btn small primary') : tab === 'regions' ? btn('\u6DFB\u52A0\u5730\u533A', 'Add region', () => editRegion(), 'btn small primary') : btn('\u6DFB\u52A0\u5141\u8BB8 IP', 'Allow IP', () => openAdd(true), 'btn small primary');\n            add.id = 'sec-add';\n            add.disabled = failed || loading || !store.enabled;\n            view.append(el('div', { class: 'sec-list-heading' }, tabs, add));\n            const search = input('sec-search', query, { type: 'search', placeholder: t(tab === 'regions' ? '\u641C\u7D22\u5730\u533A / \u539F\u56E0' : tab === 'allow' ? '\u641C\u7D22 IP / \u5907\u6CE8' : '\u641C\u7D22 IP / \u539F\u56E0', tab === 'regions' ? 'Search region / reason' : tab === 'allow' ? 'Search IP / note' : 'Search IP / reason'), 'aria-label': t('\u641C\u7D22\u540D\u5355', 'Search list') });\n            const filter = el('select', { id: 'sec-kind', 'aria-label': t('\u5C01\u7981\u65B9\u5F0F', 'Ban type') }, el('option', { value: 'all' }, t('\u5168\u90E8\u65B9\u5F0F', 'All types')), el('option', { value: 'auto' }, t('\u81EA\u52A8\u5C01\u7981', 'Automatic')), el('option', { value: 'manual' }, t('\u624B\u52A8\u5C01\u7981', 'Manual')));\n            filter.value = kind;\n            const scope = el('select', { id: 'sec-scope-filter', 'aria-label': t('\u4FDD\u62A4\u8303\u56F4', 'Protected action') }, el('option', { value: 'all' }, t('\u5168\u90E8\u8303\u56F4', 'All scopes')), ...scopes.filter(([key]) => tab !== 'regions' || key !== 'login').map(([key, zh, en]) => el('option', { value: key }, t(zh, en))));\n            scope.value = scopeFilter;\n            const apply = () => { query = search.value.trim(); kind = filter.value; scopeFilter = scope.value; page = 1; selected.clear(); draw(); };\n            search.addEventListener('input', syncExport);\n            filter.onchange = syncExport;\n            scope.onchange = syncExport;\n            const exportButton = btn('\u5BFC\u51FA\u7B5B\u9009\u7ED3\u679C', 'Export results', exportRows);\n            exportButton.id = 'sec-export';\n            exportButton.title = t('\u5BFC\u51FA\u5F53\u524D\u7C7B\u522B\u548C\u7B5B\u9009\u6761\u4EF6\u4E0B\u7684\u5168\u90E8\u8BB0\u5F55\uFF0C\u5305\u542B\u6240\u6709\u5206\u9875\u3002', 'Export all matching records in this category across pages.');\n            const submit = btn('\u7B5B\u9009', 'Filter', () => { });\n            submit.type = 'submit';\n            const form = el('form', { class: 'sec-toolbar', id: 'sec-filter' }, el('div', { class: 'sec-actions sec-filters' }, search, scope, ...(tab === 'bans' ? [filter] : [])), el('div', { class: 'sec-actions sec-filter-actions' }, submit, btn('\u91CD\u7F6E', 'Reset', () => { query = ''; kind = 'all'; scopeFilter = 'all'; page = 1; selected.clear(); render(); }), exportButton));\n            form.onsubmit = e => { e.preventDefault(); apply(); };\n            view.append(form, el('small', { id: 'sec-filter-pending', class: 'sec-filter-pending', role: 'status', hidden: '' }, t('\u7B5B\u9009\u6761\u4EF6\u5DF2\u66F4\u6539\uFF0C\u8BF7\u5148\u70B9\u51FB\u201C\u7B5B\u9009\u201D\u3002', 'Filters changed. Apply them before exporting.')), el('div', { id: 'sec-list' }));\n            draw();\n            if (focusId)\n                document.getElementById(focusId)?.focus();\n        }\n        function draw() {\n            const host = $('#sec-list');\n            if (!host)\n                return;\n            if (loading || (!store.enabled && !failed)) {\n                host.replaceChildren(el('div', { class: 'sec-empty', role: 'status' }, loading ? t('\u6B63\u5728\u8BFB\u53D6\u9632\u62A4\u72B6\u6001\u2026', 'Loading protection\u2026') : t('\u5B89\u5168\u9632\u62A4\u672A\u542F\u7528\uFF0C\u9700\u8981\u7ED1\u5B9A R2 \u6216 D1\u3002', 'Protection unavailable. Bind R2 or D1.')));\n                syncExport();\n                return;\n            }\n            const focusId = document.activeElement?.id;\n            host.replaceChildren();\n            if (failed) {\n                syncExport();\n                host.append(el('div', { class: 'sec-empty', role: 'alert' }, t('\u9632\u62A4\u6570\u636E\u52A0\u8F7D\u5931\u8D25', 'Failed to load protection data'), btn('\u91CD\u8BD5', 'Retry', () => refresh())));\n                return;\n            }\n            $('#sec-ip-total').textContent = empty ? 0 : liveBans().length;\n            $('#sec-region-total').textContent = empty ? 0 : activeRegions().length;\n            for (const ip of selected)\n                if (!liveBans().some(b => b.ip === ip))\n                    selected.delete(ip);\n            const items = rows(), max = Math.max(1, Math.ceil(items.length / 5));\n            page = Math.min(page, max);\n            const visible = items.slice((page - 1) * 5, page * 5);\n            const prev = btn('\u4E0A\u4E00\u9875', 'Previous', () => { page--; draw(); }), next = btn('\u4E0B\u4E00\u9875', 'Next', () => { page++; draw(); });\n            prev.disabled = page <= 1;\n            next.disabled = page >= max;\n            const bulk = btn(t(`\u89E3\u5C01\u6240\u9009\uFF08${selected.size}\uFF09`, `Unban selected (${selected.size})`), `Unban selected (${selected.size})`, () => confirmUnban([...selected]));\n            bulk.id = 'sec-bulk';\n            bulk.disabled = !selected.size;\n            host.append(el('div', { class: 'sec-pagination' }, el('div', { class: 'sec-actions' }, el('small', { class: 'muted' }, t(`\u5171 ${items.length} \u6761 \xB7 \u7B2C ${page} / ${max} \u9875`, `${items.length} entries \xB7 Page ${page} / ${max}`)), ...(tab === 'bans' && selected.size ? [el('span', { class: 'sec-selection-count' }, t(`\u5DF2\u9009 ${selected.size} \u9879`, `Selected ${selected.size}`)), bulk, btn('\u53D6\u6D88\u9009\u62E9', 'Clear selection', () => { selected.clear(); draw(); })] : [])), el('div', { class: 'sec-actions' }, prev, next, btn('\u5237\u65B0', 'Refresh', async () => { await refresh(); toast(t('\u5DF2\u5237\u65B0', 'Refreshed')); }))));\n            syncExport();\n            if (!items.length) {\n                host.append(el('div', { class: 'sec-empty' }, query ? t('\u6CA1\u6709\u5339\u914D\u7684\u8BB0\u5F55', 'No matching records') : tab === 'bans' ? t('\u5F53\u524D\u6CA1\u6709\u5C01\u7981 IP', 'No active bans') : tab === 'regions' ? t('\u5C1A\u672A\u6DFB\u52A0\u5730\u533A\u89C4\u5219', 'No region rules') : t('\u5C1A\u672A\u6DFB\u52A0\u5141\u8BB8 IP', 'No allowed IPs')));\n                return;\n            }\n            if (tab === 'regions') {\n                drawRegions(host, visible);\n                return;\n            }\n            const table = el('table', { class: 'sec-table', 'aria-label': t(tab === 'bans' ? '\u5C01\u7981\u5217\u8868' : '\u5141\u8BB8\u540D\u5355', tab === 'bans' ? 'Banned IPs' : 'Allowed IPs') });\n            const header = el('tr');\n            if (tab === 'bans') {\n                const all = input('sec-select-page', '', { type: 'checkbox', 'aria-label': t('\u9009\u62E9\u672C\u9875', 'Select this page') });\n                all.checked = visible.every(r => selected.has(r.ip));\n                all.indeterminate = !all.checked && visible.some(r => selected.has(r.ip));\n                all.onchange = () => { for (const r of visible)\n                    all.checked ? selected.add(r.ip) : selected.delete(r.ip); draw(); };\n                header.append(el('th', {}, all));\n            }\n            const cols = tab === 'bans' ? [[\"IP / \u4FDD\u62A4\u8303\u56F4\", \"IP / scope\"], [\"\u539F\u56E0\", \"Reason\"], [\"\u89E6\u53D1\u6B21\u6570\", \"Count\"], [\"\u5C01\u7981\u65F6\u95F4\", \"Banned at\"], [\"\u81EA\u52A8\u89E3\u5C01\", \"Expires\"], [\"\u64CD\u4F5C\", \"Actions\"]] : [[\"IP / \u8C41\u514D\u8303\u56F4\", \"IP / exempt scope\"], [\"\u5907\u6CE8\", \"Note\"], [\"\u6DFB\u52A0\u65F6\u95F4\", \"Added\"], [\"\u64CD\u4F5C\", \"Actions\"]];\n            for (const [zh, en] of cols)\n                header.append(el('th', {}, t(zh, en)));\n            table.append(el('thead', {}, header));\n            const body = el('tbody');\n            for (const r of visible) {\n                const row = el('tr');\n                if (tab === 'bans') {\n                    const check = input('sec-select-' + r.ip, '', { type: 'checkbox', 'aria-label': t('\u9009\u62E9 ' + r.ip, 'Select ' + r.ip) });\n                    check.checked = selected.has(r.ip);\n                    check.onchange = () => { check.checked ? selected.add(r.ip) : selected.delete(r.ip); draw(); };\n                    row.append(el('td', { class: 'sec-select' }, check));\n                    const remaining = r.until === null ? t('\u6C38\u4E45', 'Permanent') : t(`\u5269\u4F59 ${Math.max(1, Math.ceil((r.until - Date.now()) / 60000))} \u5206\u949F`, `${Math.max(1, Math.ceil((r.until - Date.now()) / 60000))} min left`);\n                    row.append(el('td', { 'data-label': 'IP', class: 'sec-address' }, ipLine(r)), el('td', { 'data-label': t('\u539F\u56E0', 'Reason') }, el('div', { class: 'ui-record-line' }, el('span', {}, r.reason), el('sup', { class: 'ui-record-sup', 'data-tone': r.kind === 'auto' ? 'violet' : 'slate' }, r.kind === 'auto' ? t('\u81EA\u52A8\u5C01\u7981', 'Automatic') : t('\u624B\u52A8\u5C01\u7981', 'Manual')))), el('td', { 'data-label': t('\u89E6\u53D1\u6B21\u6570', 'Count') }, r.kind === 'auto' ? r.failures : '\u2014'), el('td', { 'data-label': t('\u5C01\u7981\u65F6\u95F4', 'Banned at') }, date(r.at)), el('td', { 'data-label': t('\u81EA\u52A8\u89E3\u5C01', 'Expires') }, remaining, ...(r.until === null ? [] : [el('small', { class: 'muted' }, date(r.until))])), el('td', { class: 'sec-row-actions' }, btn('\u8BE6\u60C5', 'Details', () => details(r)), btn('\u65E5\u5FD7', 'Logs', () => logLink(r.ip)), btn('\u89E3\u5C01', 'Unban', () => confirmUnban([r.ip]))));\n                }\n                else\n                    row.append(el('td', { 'data-label': 'IP', class: 'sec-address' }, ipLine(r)), el('td', { 'data-label': t('\u5907\u6CE8', 'Note') }, r.note), el('td', { 'data-label': t('\u6DFB\u52A0\u65F6\u95F4', 'Added') }, date(r.created)), el('td', { class: 'sec-row-actions' }, btn('\u65E5\u5FD7', 'Logs', () => logLink(r.ip)), btn('\u79FB\u9664', 'Remove', () => removeAllow(r))));\n                body.append(row);\n            }\n            table.append(body);\n            host.append(el('div', { class: 'sec-table-wrap' }, table));\n            if (focusId?.startsWith('sec-select'))\n                document.getElementById(focusId)?.focus();\n        }\n        function drawRegions(host, items) {\n            const table = el('table', { class: 'sec-table sec-region-table', 'aria-label': t('\u5730\u533A\u5C01\u7981\u89C4\u5219', 'Region ban rules') }), head = el('tr');\n            for (const [zh, en] of [['\u5730\u533A / \u8303\u56F4', 'Region / scope'], ['\u539F\u56E0', 'Reason'], ['\u72B6\u6001', 'Status'], ['\u5230\u671F\u65F6\u95F4', 'Expires'], ['\u64CD\u4F5C', 'Actions']])\n                head.append(el('th', {}, t(zh, en)));\n            table.append(el('thead', {}, head));\n            const body = el('tbody');\n            for (const r of items) {\n                const expired = r.until !== null && r.until <= Date.now(), active = r.enabled && !expired;\n                body.append(el('tr', {}, el('td', { class: 'sec-address' }, el('div', { class: 'sec-ip-line' }, el('b', {}, regionName(r)), scopeBadges(r.scopes, true))), el('td', { 'data-label': t('\u539F\u56E0', 'Reason') }, r.reason), el('td', { 'data-label': t('\u72B6\u6001', 'Status') }, el('span', { class: active ? 'sec-enabled' : 'muted' }, expired ? t('\u5DF2\u8FC7\u671F', 'Expired') : r.enabled ? t('\u751F\u6548\u4E2D', 'Active') : t('\u5DF2\u505C\u7528', 'Paused'))), el('td', { 'data-label': t('\u5230\u671F\u65F6\u95F4', 'Expires') }, r.until === null ? t('\u6C38\u4E45', 'Never') : date(r.until)), el('td', { class: 'sec-row-actions' }, btn('\u7F16\u8F91', 'Edit', () => editRegion(r)), btn(r.enabled && !expired ? '\u505C\u7528' : '\u542F\u7528', r.enabled && !expired ? 'Pause' : 'Enable', () => toggleRegion(r)), btn('\u65E5\u5FD7', 'Logs', () => logLink(r.id)), btn('\u79FB\u9664', 'Remove', () => removeRegion(r)))));\n            }\n            table.append(body);\n            host.append(el('div', { class: 'sec-table-wrap' }, table));\n        }\n        $('#lang-btn').addEventListener('click', () => { navButton.textContent = t('\u5B89\u5168\u9632\u62A4', 'Security');\n            shortcut.querySelector('h4').textContent = t('\u5B89\u5168\u9632\u62A4', 'Security');\n            shortcut.querySelector('button').textContent = t('\u7BA1\u7406\u8BBF\u95EE\u89C4\u5219\u4E0E\u5C01\u7981 \u2192', 'Manage access rules and bans \u2192'); if (open)\n            render(); });\n        setInterval(() => { if (open && !document.hidden && !dialog.open && !loading && $('#sec-list') && !filtersDirty())\n            refresh().catch(error => toast(error.message)); }, 60000);\n    })();\n}\n", "js/admin-share-editor.js": "import { api, el, fmtDate } from './common.js?v=732e7eabbd2c58e9';\nimport { t } from './i18n.js?v=732e7eabbd2c58e9';\n\nconst MAX_COUNT = 2147483647;\nconst WEEK = 7 * 86400000;\nexport function ruleStatus(rules, now = Date.now()) {\n  if (rules.expireAt !== null && rules.expireAt <= now) return 'expired';\n  if (rules.maxPickups !== null && rules.pickupCount >= rules.maxPickups) return 'exhausted';\n  return 'active';\n}\n/** Selecting a status changes visible values; the server still derives the saved status. */\nexport function linkStatus(rules, status, now = Date.now()) {\n  const next = { ...rules };\n  if (status === 'expired') next.expireAt = now;\n  else {\n    if (next.expireAt !== null && next.expireAt <= now) next.expireAt = now + WEEK;\n    if (status === 'active' && next.maxPickups !== null && next.pickupCount >= next.maxPickups)\n      next.maxPickups = next.pickupCount < MAX_COUNT ? next.pickupCount + 1 : null;\n    if (status === 'exhausted') {\n      next.maxPickups ??= Math.max(1, next.pickupCount);\n      next.pickupCount = Math.max(next.pickupCount, next.maxPickups);\n    }\n  }\n  return next;\n}\nfunction localDateTime(value) {\n  const date = new Date(value);\n  const pad = n => String(n).padStart(2, '0');\n  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;\n}\n\nexport function createShareEditor(detail, { onSaved, onCancel, onBusy }) {\n  const form = el('form', { id: 'share-edit-form', class: 'share-edit-form' });\n  const isText = detail.kind === 'text';\n  const text = isText ? el('textarea', { id: 'share-edit-text', value: detail.text ?? '',\n    maxLength: detail.maxTextLength, required: true, spellcheck: false }) : null;\n  const textCount = el('small', { id: 'share-edit-text-count', class: 'muted' });\n  if (text) {\n    text.setAttribute('aria-describedby', textCount.id);\n    const countText = () => { textCount.textContent = `${text.value.length.toLocaleString()} / ${detail.maxTextLength.toLocaleString()}`; };\n    text.addEventListener('input', countText); countText();\n  }\n  const number = (id, value, min) => el('input', { id, type: 'number', value, min, max: MAX_COUNT, step: 1, required: true });\n  const count = number('share-edit-count', detail.pickupCount, 0);\n  const limit = number('share-edit-limit', detail.maxPickups ?? Math.max(1, detail.pickupCount+1), 1);\n  const unlimited = el('input', { id: 'share-edit-unlimited', type: 'checkbox' });\n  unlimited.checked = detail.maxPickups === null;\n  const permanent = el('input', { id: 'share-edit-permanent', type: 'checkbox' });\n  permanent.checked = detail.expireAt === null;\n  const expiry = el('input', { id: 'share-edit-expiry', type: 'datetime-local', step: 60, min: '1970-01-01T00:00', max: '9999-12-31T23:59', required: true });\n  let exactExpiry = detail.expireAt;\n  let displayedExpiry = localDateTime(exactExpiry ?? Date.now()+WEEK);\n  expiry.value = displayedExpiry;\n  const status = el('select', { id: 'share-edit-status' }, ...['active','expired','exhausted'].map(value => el('option', { value }, t('ad.st.'+value))));\n  status.value = detail.status;\n  const field = (label, control) => el('div', { class: 'share-edit-field' }, el('label', { htmlFor: control.id }, label), control);\n  const check = (label, control) => el('label', { class: 'share-edit-check' }, control, label);\n  const limitField = field(t('ad.editLimit'), limit);\n  limitField.append(check(t('ad.editUnlimited'), unlimited));\n  const expiryField = field(t('ad.th.expire'), expiry);\n  expiryField.classList.add('share-edit-expiry');\n  expiryField.append(check(t('ad.forever'), permanent));\n  const linked = el('p', { class: 'share-edit-linked muted', role: 'status', hidden: true });\n  const error = el('p', { id: 'share-edit-error', class: 'error-box', role: 'alert', hidden: true });\n  const reload = el('button', { type: 'button', class: 'btn small ghost', hidden: true, onclick: onCancel }, t('ad.editReload'));\n  const save = el('button', { type: 'submit', class: 'btn primary' }, t('ad.editSave'));\n  const cancel = el('button', { type: 'button', class: 'btn ghost', onclick: onCancel }, t('ad.editCancel'));\n  form.append(isText ? el('div', { class: 'text-edit-field' },\n    el('div', { class: 'text-edit-heading' }, el('label', { htmlFor: text.id }, t('ad.textContent')), textCount), text)\n    : el('strong', { class: 'share-edit-filename', title: detail.filename || '' }, detail.filename || t('ad.unnamed')),\n    el('div', { class: 'share-edit-grid' }, field(t('ad.editCount'), count), limitField, field(t('ad.th.status'), status), expiryField),\n    linked, error, reload, el('div', { class: 'share-edit-actions' }, cancel, save));\n  function values() {\n    return { pickupCount: count.valueAsNumber, maxPickups: unlimited.checked ? null : limit.valueAsNumber,\n      expireAt: permanent.checked ? null : expiry.value === displayedExpiry && exactExpiry !== null ? exactExpiry : new Date(expiry.value).getTime() };\n  }\n  function sync() { limit.disabled = unlimited.checked; expiry.disabled = permanent.checked; }\n  const valid = rules => Number.isSafeInteger(rules.pickupCount) && rules.pickupCount >= 0 && rules.pickupCount <= MAX_COUNT &&\n    (rules.maxPickups === null || (Number.isSafeInteger(rules.maxPickups) && rules.maxPickups >= 1 && rules.maxPickups <= MAX_COUNT)) &&\n    (rules.expireAt === null || Number.isFinite(rules.expireAt));\n  for (const control of [count, limit, unlimited, expiry, permanent]) {\n    control.addEventListener('input', () => { sync(); linked.hidden = true; const rules = values(); if (valid(rules)) status.value = ruleStatus(rules); });\n  }\n  status.addEventListener('change', () => {\n    const before = values();\n    if (!valid(before)) { error.textContent = t('ad.editInvalid'); error.hidden = false; return; }\n    const next = linkStatus(before, status.value), changes = [];\n    if (before.pickupCount !== next.pickupCount) changes.push(`${t('ad.editCount')} \u2192 ${next.pickupCount}`);\n    if (before.maxPickups !== next.maxPickups) changes.push(`${t('ad.editLimit')} \u2192 ${next.maxPickups ?? '\u221E'}`);\n    if (before.expireAt !== next.expireAt) changes.push(`${t('ad.th.expire')} \u2192 ${fmtDate(next.expireAt)}`);\n    count.value = next.pickupCount; unlimited.checked = next.maxPickups === null;\n    if (next.maxPickups !== null) limit.value = next.maxPickups;\n    permanent.checked = next.expireAt === null;\n    exactExpiry = next.expireAt;\n    displayedExpiry = localDateTime(next.expireAt ?? Date.now()+WEEK); expiry.value = displayedExpiry;\n    sync(); linked.textContent = changes.join('\uFF1B'); linked.hidden = !changes.length;\n  });\n  let busy = false;\n  form.addEventListener('submit', async event => {\n    event.preventDefault();\n    if (busy || !form.reportValidity()) return;\n    const rules = values();\n    if (text && (!text.value.trim() || text.value.length > detail.maxTextLength)) { error.textContent = t('ad.textInvalid', detail.maxTextLength); error.hidden = false; text.focus(); return; }\n    if (!valid(rules)) { error.textContent = t('ad.editInvalid'); error.hidden = false; return; }\n    if (status.value !== ruleStatus(rules)) { status.value = ruleStatus(rules); error.textContent = t('ad.editTimeChanged'); error.hidden = false; return; }\n    busy = true; onBusy(true); error.hidden = reload.hidden = true;\n    const controls = [...form.querySelectorAll('input,button,select,textarea')].map(node => [node,node.disabled]);\n    for (const [node] of controls) node.disabled = true;\n    let saved = false;\n    try {\n      await api(`/api/admin/shares/${detail.code}`, { method: 'PUT', body: { expected: {\n        id: detail.id, pickupCount: detail.pickupCount, maxPickups: detail.maxPickups, expireAt: detail.expireAt,\n        ...(isText ? { version: detail.version } : {}),\n      }, rules: { ...rules, status: status.value }, ...(text ? { text: text.value } : {}) } });\n      saved = true;\n    } catch (e) {\n      error.textContent = e.message; error.hidden = false; reload.hidden = e.code !== 'share_conflict';\n    } finally {\n      busy = false; onBusy(false);\n      for (const [node,disabled] of controls) node.disabled = disabled;\n    }\n    if (saved) onSaved();\n  });\n  sync();\n  return { element: form, enhance() {\n    const help = el('span', {}, t('ad.editHint', Intl.DateTimeFormat().resolvedOptions().timeZone));\n    window.attachHelp(expiryField.querySelector('label'), help);\n    window.attachHelp(form.querySelector('label[for=\"share-edit-status\"]'), el('span', {}, t('ad.editStatusHint')));\n    (text || count).focus();\n    if (text) { text.setSelectionRange(0, 0); text.scrollTop = 0; }\n  } };\n}\n", "js/admin.js": "import { initClassifications } from './ui-classifications.js?v=732e7eabbd2c58e9';\nimport { initAuditLayout } from './ui-audit-layout.js?v=732e7eabbd2c58e9';\nimport { initSecurity } from './admin-security.js?v=732e7eabbd2c58e9';\nimport { initCombinedAdmin } from './admin-layout.js?v=732e7eabbd2c58e9';\nimport { kvUsageCard, storageHelp } from './storage-overview.js?v=732e7eabbd2c58e9';\nimport { initUi } from './ui.js?v=732e7eabbd2c58e9';\nimport { $, api, fmtBytes, fmtDate, toast, copyText, initTheme, initDialogs, el } from './common.js?v=732e7eabbd2c58e9';\nimport { LANG, t, onLangChange, initI18n } from './i18n.js?v=732e7eabbd2c58e9';\nimport { initAudit } from './admin-audit.js?v=732e7eabbd2c58e9';\nimport { createFilePreview } from './admin-preview.js?v=732e7eabbd2c58e9';\nimport { createShareEditor } from './admin-share-editor.js?v=732e7eabbd2c58e9';\nimport { pageSize, scrollToList, initAdminPreferences } from './admin-preferences.js?v=732e7eabbd2c58e9';\n\ninitTheme();\ninitI18n();\ninitDialogs();\ninitAdminPreferences();\ninitAudit();\n\nconst loginCard = $('#admin-login');\nconst panel = $('#admin-panel');\nconst loginError = $('#login-error');\nconst tokenInput = $('#admin-token');\nconst statsRow = $('#stats-row');\nconst tbody = $('#shares-body');\nconst btnPrev = $('#btn-prev');\nconst btnNext = $('#btn-next');\nconst btnRefresh = $('#btn-refresh');\nconst pageInfo = $('#page-info');\n\nlet limit = pageSize('files'); // Bounded to 40 to leave room for KV reads on the free plan.\nlet offset = 0;\nlet total = 0;\nlet listRequest = 0;\nlet listBusy = false;\nlet fileFilters = { status: 'all', kind: 'all', q: '' };\n\n/* \u8BED\u8A00\u5207\u6362:\u9762\u677F\u53EF\u89C1\u65F6\u6309\u65B0\u8BED\u8A00\u91CD\u62C9\u6587\u6848 */\nonLangChange(() => {\n  if ($('#source-dialog').open) closeSource();\n  if ($('#file-dialog').open) closeFileDetails();\n  if (!panel.hidden) {\n    loadStats();\n    loadList();\n    loadLoginProtection();\n  }\n});\n\n/* ---------- \u767B\u5F55\u6001\u63A2\u6D4B:stats \u901A\u5219\u89C6\u4E3A\u5DF2\u767B\u5F55 ---------- */\n(async () => {\n  try {\n    await api('/api/admin/stats');\n    showPanel();\n  } catch {\n    loginCard.hidden = false;\n    tokenInput.focus();\n  }\n})();\n\nasync function login() {\n  const token = tokenInput.value.trim();\n  if (!token || $('#btn-login').disabled) return;\n  $('#btn-login').disabled = true;\n  loginError.hidden = true;\n  try {\n    await api('/api/admin/login', { method: 'POST', body: { token } });\n    showPanel();\n  } catch (e) {\n    loginError.textContent = e.code === 'login_blocked' ? t('ad.loginBlocked')\n      : e.code === 'login_protection_unavailable' ? t('ad.guardUnavailable') : e.message || t('ad.badToken');\n    loginError.hidden = false;\n  } finally { $('#btn-login').disabled = false; }\n}\n$('#btn-login').addEventListener('click', login);\ntokenInput.addEventListener('keydown', (e) => e.key === 'Enter' && login());\n\nfunction showPanel() {\n  loginCard.hidden = true;\n  panel.hidden = false;\n  $('#admin-navigation').hidden = false;\n  $('#admin-settings-btn').hidden = false;\n  loadStats();\n  loadList();\n  loadSettings();\n  loadGuestPolicy();\n  loadLoginProtection();\n}\n\n$('#btn-logout').addEventListener('click', async () => {\n  try { await api('/api/admin/logout', { method: 'POST', body: {} }); } catch { /* ignore */ }\n  location.reload();\n});\n\n/* ---------- \u7EDF\u8BA1 ---------- */\nlet lastStats = null; // \u5220\u9664\u540E\u672C\u5730\u9012\u51CF\u7528,\u907F\u514D\u7ACB\u5373\u91CD\u62C9\u649E\u4E0A KV \u6700\u7EC8\u4E00\u81F4\u7A97\u53E3\n\nfunction renderStats(s) {\n  const counts = [\n    [s.total, 'ad.total'], [s.active, 'ad.active'], [s.files, 'ad.files'],\n    [s.texts, 'ad.texts'], [s.todayCreated, 'ad.today'],\n  ];\n  const capacity = s.fileBackend === 'r2' ? s.storage : null;\n  const storageCard = el('div', { class: 'stat-card storage-card' },\n    el('div', { class: 'storage-heading' }, el('small', {}, s.fileBackend === 'r2' ? 'R2' : t('ad.shareBytes')), s.fileBackend === 'r2' ? storageHelp('R2', t('ad.storageReserved')) : null),\n    capacity\n      ? el('div', { class: 'storage-value' },\n          el('b', {}, fmtBytes(capacity.usedBytes)),\n          el('span', { class: 'storage-total' }, ` / ${fmtBytes(capacity.capacityBytes)}`))\n      : el('div', { class: 'storage-value' }, el('b', {}, s.fileBackend === 'r2'\n          ? t('ad.storageUnavailable') : fmtBytes(s.totalBytes))),\n  );\n  if (capacity) {\n    storageCard.append(\n      el('meter', { class: 'storage-meter', min: 0, max: capacity.capacityBytes,\n        value: capacity.usedBytes, ariaLabel: t('ad.storage') }),\n    );\n  }\n  statsRow.replaceChildren(\n    el('div', { class: 'stats-counts' }, ...counts.map(([value, label]) =>\n      el('div', { class: 'stat-card' }, el('b', {}, String(value)), el('small', {}, t(label))))),\n    el('div', { class: 'storage-overview' }, storageCard, kvUsageCard(s.kv)),\n  );\n}\n\nasync function loadStats() {\n  try {\n    lastStats = await api('/api/admin/stats');\n    renderStats(lastStats);\n  } catch { /* \u5FFD\u7565,\u5217\u8868\u52A0\u8F7D\u4F1A\u518D\u62A5 */ }\n}\n\n/** \u5220\u9664\u6210\u529F\u540E\u672C\u5730\u540C\u6B65\u7EDF\u8BA1(\u670D\u52A1\u7AEF KV \u7D22\u5F15\u6700\u957F 60s \u624D\u53CD\u6620\u5220\u9664,\u91CD\u62C9\u4F1A\u770B\u5230\u65E7\u6570) */\nasync function statsAfterDelete(r) {\n  if (!lastStats) return;\n  const s = { ...lastStats };\n  s.total = Math.max(0, s.total - 1);\n  if (r.kind === 'file') s.files = Math.max(0, s.files - 1);\n  else s.texts = Math.max(0, s.texts - 1);\n  s.totalBytes = Math.max(0, s.totalBytes - r.size);\n  if (r.status === 'active') s.active = Math.max(0, s.active - 1);\n  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);\n  if (r.created_at >= todayStart.getTime()) s.todayCreated = Math.max(0, s.todayCreated - 1);\n  lastStats = s;\n  renderStats(s);\n  if (s.fileBackend === 'r2') {\n    try { s.storage = (await api('/api/admin/stats')).storage; }\n    catch { s.storage = null; } // Do not present stale capacity as current after deletion.\n    if (lastStats === s) renderStats(s);\n  }\n}\n\n/* ---------- \u5217\u8868 ---------- */\nconst STATUS_KEY = { active: 'ad.st.active', expired: 'ad.st.expired', exhausted: 'ad.st.exhausted' };\nconst KIND_KEY = { file: 'ad.kind.file', text: 'ad.kind.text' };\n\nasync function loadList() {\n  const request = ++listRequest;\n  listBusy = true;\n  btnPrev.disabled = btnNext.disabled = btnRefresh.disabled = true;\n  pageInfo.textContent = t('ad.loading');\n  tbody.setAttribute('aria-busy', 'true');\n  tbody.replaceChildren(el('tr', {}, el('td', { class: 'muted', colspan: 9 }, t('ad.loading'))));\n  try {\n    const params = new URLSearchParams({ ...fileFilters, limit, offset });\n    const data = await api(`/api/admin/shares?${params}`);\n    if (request !== listRequest) return;\n    if (!Number.isSafeInteger(data.total) || data.total < 0 || !Array.isArray(data.rows)) throw new Error(t('ad.loadFail'));\n    total = data.total;\n    if (offset > 0 && offset >= total) { offset = Math.max(0, Math.ceil(total / limit) - 1) * limit; return loadList(); }\n    const rows = data.rows ?? [];\n    tbody.replaceChildren();\n    for (const r of rows) {\n      const content = r.kind === 'text' ? (r.text_preview || t('ad.textFallback')) : (r.filename || t('ad.unnamed'));\n      tbody.append(\n        el('tr', {},\n          el('td', { class: 'mono' }, r.code),\n          el('td', { class: 'share-content-cell' },\n            el('div', { class: 'share-filename-line' },\n              el('button', { class: 'share-filename file-detail-link', type: 'button', title: content, onclick: () => openFileDetails(r.code) }, content),\n              el('sup', { class: `badge share-kind kind-${r.kind}` }, t(KIND_KEY[r.kind] || r.kind)))),\n          sourceCell(r),\n          el('td', {}, r.kind === 'text' ? t('ad.chars', r.size) : fmtBytes(r.size)),\n          el('td', {}, `${r.pickup_count} / ${r.max_pickups ?? '\u221E'}`),\n          el('td', {}, r.expire_at ? fmtDate(r.expire_at) : t('ad.forever')),\n          el('td', {}, el('span', { class: `badge ${r.status}` }, STATUS_KEY[r.status] ? t(STATUS_KEY[r.status]) : r.status)),\n          el('td', {}, fmtDate(r.created_at)),\n          el('td', {}, el('button', { class: 'btn danger small', onclick: (e) => remove(r, e.target.closest('tr')) }, t('ad.delete'))),\n        ),\n      );\n    }\n    if (rows.length === 0) {\n      tbody.replaceChildren(el('tr', {}, el('td', { class: 'muted', colspan: 9 }, t('ad.empty'))));\n    }\n    listBusy = false;\n    updatePager();\n  } catch (e) {\n    if (request !== listRequest) return;\n    pageInfo.textContent = t('ad.loadFail');\n    tbody.replaceChildren(el('tr', {}, el('td', { class: 'muted', colspan: 9 }, e.message || t('ad.loadFail'))));\n  } finally {\n    if (request === listRequest) {\n      listBusy = false;\n      btnRefresh.disabled = false;\n      tbody.setAttribute('aria-busy', 'false');\n    }\n  }\n}\n\nfunction updatePager() {\n  const page = Math.floor(offset / limit) + 1;\n  const pages = Math.max(1, Math.ceil(total / limit));\n  pageInfo.textContent = t('ad.page', page, pages, total);\n  btnPrev.disabled = listBusy || offset <= 0;\n  btnNext.disabled = listBusy || offset + limit >= total;\n}\nbtnPrev.addEventListener('click', async () => { offset = Math.max(0, offset - limit); await loadList(); if (!$('#admin-files-view').hidden) scrollToList('.admin-list-card'); });\nbtnNext.addEventListener('click', async () => { offset += limit; await loadList(); if (!$('#admin-files-view').hidden) scrollToList('.admin-list-card'); });\nbtnRefresh.addEventListener('click', () => { noteOverrides.clear(); loadStats(); loadList(); });\nwindow.addEventListener('admin-page-size', event => {\n  if (event.detail.name !== 'files') return;\n  limit = event.detail.value; offset = 0;\n  if (!panel.hidden) loadList();\n});\n\n/* ---------- \u5220\u9664:\u7968\u636E\u98CE\u786E\u8BA4\u5F39\u7A97 + \u672C\u5730\u540C\u6B65(KV \u6700\u7EC8\u4E00\u81F4,\u5220\u9664\u540E\u7ACB\u5373\u91CD\u62C9\u4F1A\u770B\u5230\u6B8B\u7559\u7D22\u5F15) ---------- */\nconst delMask = $('#del-mask');\nconst delTarget = $('#del-target');\nlet delResolve = null;\n\nfunction confirmDelete(r) {\n  const content = r.kind === 'text' ? (r.text_preview || t('ad.textFallback')) : (r.filename || t('ad.unnamed'));\n  delTarget.replaceChildren(\n    el('div', { class: 'del-line' }, el('span', { class: 'muted' }, t('ad.th.code')), el('b', { class: 'mono' }, r.code)),\n    el('div', { class: 'del-line' }, el('span', { class: 'muted' }, t('ad.th.content')), el('span', {}, content)),\n    el('div', { class: 'del-line' }, el('span', { class: 'muted' }, t('ad.th.size')),\n      el('span', {}, r.kind === 'text' ? t('ad.chars', r.size) : fmtBytes(r.size))),\n  );\n  delMask.showModal();\n  $('#del-cancel').focus();\n  return new Promise((resolve) => { delResolve = resolve; });\n}\n\nfunction closeDelModal(v) {\n  if (!delResolve) return;\n  delMask.close();\n  const resolve = delResolve;\n  delResolve = null;\n  resolve(v);\n}\n$('#del-cancel').addEventListener('click', () => closeDelModal(false));\n$('#del-ok').addEventListener('click', () => closeDelModal(true));\ndelMask.addEventListener('click', (e) => e.target === delMask && closeDelModal(false));\ndelMask.addEventListener('cancel', e => { e.preventDefault(); closeDelModal(false); });\n\nasync function remove(r, tr) {\n  if (!(await confirmDelete(r))) return;\n  try {\n    await api(`/api/admin/shares/${r.code}`, { method: 'DELETE' });\n    toast(t('ad.deleted'), 'ok');\n    statsAfterDelete(r);\n    total = Math.max(0, total - 1);\n    tr?.remove();\n    // \u5F53\u524D\u9875\u5220\u7A7A\u4E14\u4E0D\u5728\u7B2C\u4E00\u9875:\u9000\u56DE\u4E0A\u4E00\u9875\u91CD\u62C9,\u907F\u514D\u505C\u5728\u7A7A\u9875\n    if (tbody.rows.length === 0 && offset > 0) {\n      offset = Math.max(0, offset - limit);\n      loadList();\n    } else {\n      updatePager();\n    }\n  } catch (e) {\n    toast(e.message || t('ad.deleteFail'), 'error');\n  }\n}\n\n/* Upload source details: source labels are text nodes, never interpolated HTML. */\nconst sourceDialog = $('#source-dialog');\nconst sourceForm = $('#source-form');\nconst sourceNote = $('#source-note');\nconst sourceSave = $('#source-save');\nconst sourceError = $('#source-error');\nconst noteOverrides = new Map(); // Read-your-write while KV propagation completes.\nlet sourceRequest = 0;\nlet activeSource = null;\nlet sourceReturnCode = null;\nlet sourceHistoryLoaded = false;\n\nfunction sourceField(label, value, className = '', hint = '') {\n  return el('div', { class: `source-field ${className}` },\n    el('small', { class: 'muted', ...(hint ? { title: hint } : {}) }, label), el('span', {}, value));\n}\nfunction browserLabel(ua) {\n  if (!ua) return t('ad.sourceUnrecorded');\n  const browser = /Edg\\//.test(ua) ? 'Edge' : /Firefox\\//.test(ua) ? 'Firefox'\n    : /Chrome\\//.test(ua) ? 'Chrome' : /Safari\\//.test(ua) ? 'Safari' : t('ad.sourceUnknown');\n  const os = /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS'\n    : /Windows/.test(ua) ? 'Windows' : /Macintosh/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : '';\n  return [browser, os].filter(Boolean).join(' \xB7 ');\n}\n\nfunction visitorLabel(id) { return t('ad.visitor', id.slice(0, 8).toUpperCase()); }\nfunction sourceLabel(source) {\n  const override = noteOverrides.get(source.visitorId);\n  return (override !== undefined ? override : source.note) || visitorLabel(source.visitorId);\n}\nfunction locationLabel(source) {\n  let country = source.country;\n  if (country && /^[A-Z]{2}$/.test(country)) {\n    country = new Intl.DisplayNames([LANG === 'zh' ? 'zh-CN' : 'en'], { type: 'region' }).of(country);\n  }\n  return [...new Set([country, source.region, source.city].filter(Boolean))].join(' \xB7 ') || t('ad.sourceUnknown');\n}\nfunction sourceCell(row) {\n  if (!row.source) return el('td', { class: 'source-cell muted' }, t('ad.sourceUnrecorded'));\n  const button = el('button', { class: 'source-link', type: 'button', onclick: () => openSource(row) }, sourceLabel(row.source));\n  button.dataset.visitor = row.source.visitorId;\n  button.title = t('ad.source');\n  return el('td', { class: 'source-cell' }, button, el('small', { class: 'muted' }, locationLabel(row.source)));\n}\nasync function openSource(row, returnCode = null) {\n  const request = ++sourceRequest;\n  activeSource = null;\n  sourceReturnCode = returnCode;\n  $('#source-back').hidden = !returnCode;\n  $('#source-history').hidden = true;\n  $('#source-history-list').replaceChildren();\n  sourceHistoryLoaded = false;\n  sourceForm.hidden = true;\n  $('#source-identity').hidden = true;\n  $('#source-visitor-id').textContent = '';\n  sourceError.hidden = true;\n  sourceSave.disabled = false;\n  sourceSave.hidden = true;\n  $('#source-context').textContent = `${t('ad.th.code')} ${row.code}`;\n  $('#source-detail').textContent = t('ad.loading');\n  sourceDialog.showModal();\n  try {\n    const { source } = await api(`/api/admin/shares/${row.code}/source`);\n    if (request !== sourceRequest || !sourceDialog.open) return;\n    if (!source) { $('#source-detail').textContent = t('ad.sourceUnrecorded'); return; }\n    activeSource = { code: row.code, visitorId: source.visitorId };\n    $('#source-visitor-id').textContent = source.visitorId;\n    const ip = el('span', { class: 'source-ip' }, source.ip || t('ad.sourceUnknown'));\n    if (source.ip) ip.append(el('button', { class: 'btn small ghost', type: 'button',\n      onclick: async () => toast(t(await copyText(source.ip) ? 'ad.ipCopied' : 'ad.copyFailed')) }, t('ad.copyIP')));\n    $('#source-detail').replaceChildren(\n      ...(source.displayName ? [sourceField(t('ad.submittedName'), source.displayName)] : []),\n      sourceField(t('ad.requestIP'), ip),\n      sourceField(t('ad.sourceLocation'), locationLabel(source)),\n      ...(source.asn || source.organization ? [sourceField(t('ad.network'),\n        [source.organization, source.asn ? `AS${source.asn}` : null].filter(Boolean).join(' \xB7 '))] : []),\n      sourceField(t('ad.browserReported'), browserLabel(source.userAgent), '', t('ad.browserHint')),\n      sourceField(t('ad.sourceTime'), fmtDate(source.capturedAt)),\n      ...(source.userAgent ? [el('div', { class: 'source-agent source-field-wide' }, el('small', { class: 'muted' }, 'User-Agent'),\n        el('p', { class: 'mono', title: source.userAgent, tabIndex: 0 }, source.userAgent))] : []),\n    );\n    $('#source-history').hidden = false;\n    sourceNote.value = noteOverrides.get(source.visitorId) ?? source.note ?? '';\n    sourceForm.hidden = false;\n    $('#source-identity').hidden = false;\n    sourceSave.hidden = false;\n    loadSourceHistory();\n  } catch (e) {\n    if (request === sourceRequest) $('#source-detail').textContent = e.message || t('ad.loadFail');\n  }\n}\nfunction closeSource() {\n  sourceRequest++;\n  activeSource = null;\n  sourceReturnCode = null;\n  $('#source-history').hidden = true;\n  $('#source-history-list').replaceChildren();\n  $('#source-back').hidden = true;\n  sourceNote.value = '';\n  $('#source-identity').hidden = true;\n  $('#source-visitor-id').textContent = '';\n  sourceForm.hidden = true;\n  sourceSave.hidden = true;\n  $('#source-context').textContent = '';\n  $('#source-detail').replaceChildren();\n  sourceDialog.close();\n}\nsourceDialog.addEventListener('cancel', (e) => { e.preventDefault(); closeSource(); });\n$('#source-close').addEventListener('click', closeSource);\n$('#source-back').addEventListener('click', () => {\n  const code = sourceReturnCode;\n  closeSource();\n  if (code) openFileDetails(code);\n});\nasync function loadSourceHistory() {\n  if (!activeSource || sourceHistoryLoaded) return;\n  sourceHistoryLoaded = true;\n  const request = sourceRequest;\n  const list = $('#source-history-list');\n  list.textContent = t('ad.loading');\n  try {\n    const { rows } = await api(`/api/admin/shares/${activeSource.code}/source/activity`);\n    if (request !== sourceRequest || !sourceDialog.open) return;\n    list.replaceChildren(...rows.map(row => el('div', { class: 'source-activity' },\n      el('div', { class: 'activity-head' },\n        el('button', { type: 'button', class: 'source-link', title: row.kind === 'file' ? row.filename || t('ad.unnamed') : t('ad.textDetails'),\n          onclick: () => { closeSource(); openFileDetails(row.code); } }, row.kind === 'file' ? row.filename || t('ad.unnamed') : t('ad.textFallback')),\n        el('span', { class: `badge ${row.status}` }, t(STATUS_KEY[row.status]))),\n      el('small', { class: 'muted' }, `${fmtDate(row.createdAt)} \xB7 ${row.kind === 'file' ? fmtBytes(row.size) : t('ad.chars', row.size)} \xB7 ${row.code}`),\n      row.ip || row.country || row.region || row.city\n        ? el('small', { class: 'muted' }, [row.ip, row.country || row.region || row.city ? locationLabel(row) : null].filter(Boolean).join(' \xB7 ')) : null,\n    )));\n    if (!rows.length) list.textContent = t('ad.empty');\n  } catch (error) {\n    if (request !== sourceRequest || !sourceDialog.open) return;\n    sourceHistoryLoaded = false;\n    list.replaceChildren(el('p', { class: 'error-box', role: 'alert' }, error.message || t('ad.loadFail')),\n      el('button', { type: 'button', class: 'btn small ghost', onclick: loadSourceHistory }, t('ad.retry')));\n  }\n}\nsourceForm.addEventListener('submit', async (e) => {\n  e.preventDefault();\n  if (!activeSource || sourceSave.disabled) return;\n  const { code } = activeSource;\n  const request = sourceRequest;\n  sourceSave.disabled = true;\n  sourceError.hidden = true;\n  try {\n    const result = await api(`/api/admin/shares/${code}/source`, { method: 'PUT', body: { note: sourceNote.value } });\n    noteOverrides.set(result.visitorId, result.note);\n    document.querySelectorAll('[data-visitor]').forEach((button) => {\n      if (button.dataset.visitor === result.visitorId) button.textContent = result.note || visitorLabel(result.visitorId);\n    });\n    if (request === sourceRequest) closeSource();\n    toast(t('ad.sourceSaved'));\n  } catch (error) {\n    if (request === sourceRequest) {\n      sourceError.textContent = error.message || t('ad.loadFail');\n      sourceError.hidden = false;\n    }\n  } finally {\n    if (request === sourceRequest) sourceSave.disabled = false;\n  }\n});\n\n/* Share details use their own request generation so closed dialogs stay empty. */\nconst fileDialog = $('#file-dialog');\nconst fileDetail = $('#file-detail');\nconst fileDownload = $('#file-download');\nconst textCopy = $('#text-copy');\nlet fileRequest = 0;\nlet activePreview = null;\nlet activeFileDetail = null;\nlet shareEditBusy = false;\nfunction resetShareEditor() {\n  $('#file-editor').hidden = true;\n  $('#file-editor').replaceChildren();\n  fileDetail.hidden = false;\n  fileDialog.querySelector('.source-footer').hidden = false;\n  $('#file-title').textContent = t(activeFileDetail?.kind === 'text' ? 'ad.textDetails' : 'ad.fileDetails');\n}\nfunction fileField(label, value, secondary) {\n  return el('div', { class: 'file-field' }, el('small', { class: 'muted' }, label),\n    el('div', { class: 'file-field-value' }, value), secondary ? el('small', { class: 'muted' }, secondary) : null);\n}\n\nasync function openFileDetails(code) {\n  if (shareEditBusy) return;\n  activeFileDetail = null;\n  resetShareEditor();\n  $('#file-edit').hidden = true;\n  activePreview?.dispose(); activePreview = null;\n  const request = ++fileRequest;\n  fileDownload.hidden = true;\n  textCopy.hidden = true;\n  fileDownload.removeAttribute('href');\n  fileDownload.removeAttribute('download');\n  $('#file-context').textContent = `${t('ad.th.code')} ${code}`;\n  fileDetail.textContent = t('ad.loading');\n  fileDialog.showModal();\n  try {\n    const detail = await api(`/api/admin/shares/${code}`);\n    if (request !== fileRequest || !fileDialog.open) return;\n    activeFileDetail = detail;\n    const isText = detail.kind === 'text';\n    $('#file-title').textContent = t(isText ? 'ad.textDetails' : 'ad.fileDetails');\n    const state = detail.storage?.state || 'unknown';\n    const storageLabels = { available: 'ad.fileState.available', missing: 'ad.fileState.missing', unknown: 'ad.fileState.unknown' };\n    const source = detail.source;\n    const sourceButton = source ? el('button', { type: 'button', class: 'source-link file-source-link',\n      title: t('ad.source'), onclick: () => {\n        closeFileDetails(); openSource({ code }, code);\n        $('#source-back').textContent = t(isText ? 'ad.backText' : 'ad.backFile');\n      },\n    }, sourceLabel(source)) : t('ad.sourceUnrecorded');\n    if (source) sourceButton.dataset.visitor = source.visitorId;\n    fileDetail.replaceChildren(\n      el('div', { class: 'file-identity file-wide' },\n        !isText ? el('strong', {}, detail.filename || t('ad.unnamed')) : null,\n        el('div', { class: 'file-summary' },\n          isText ? el('span', {}, t('ad.chars', detail.size))\n            : el('span', { title: t('ad.exactBytes', detail.size.toLocaleString()) }, fmtBytes(detail.size)),\n          el('span', { class: `badge ${detail.status}`, title: t('ad.shareState') }, t(STATUS_KEY[detail.status])),\n          !isText && state !== 'available' ? el('span', { class: `badge ${state === 'missing' ? 'expired' : ''}` }, t(storageLabels[state])) : null)),\n      ...(isText ? [el('pre', { class: 'text-share-body file-wide', tabIndex: 0,\n        ariaLabel: t('ad.textContent') }, detail.text ?? '')] : []),\n      ...(detail.description ? [el('div', { class: 'file-description file-wide' },\n        el('small', { class: 'muted' }, t(isText ? 'ad.textDescription' : 'ad.fileDescription')), el('p', {}, detail.description))] : []),\n      ...(!isText && state === 'available' ? [(activePreview = createFilePreview(code, detail.filename || '')).element] : []),\n      fileField(t('ad.source'), sourceButton),\n      fileField(t('ad.th.pickups'), `${detail.pickupCount} / ${detail.maxPickups ?? '\u221E'}`),\n      fileField(t('ad.th.created'), fmtDate(detail.createdAt)),\n      fileField(t('ad.th.expire'), detail.expireAt === null ? t('ad.forever') : fmtDate(detail.expireAt)),\n\n    );\n    if (!isText) {\n      fileDownload.href = `/api/admin/shares/${code}/download`;\n      fileDownload.download = detail.filename || 'file';\n      fileDownload.textContent = t(state === 'unknown' ? 'ad.tryDownload' : 'ad.download');\n      fileDownload.hidden = state === 'missing';\n    }\n    textCopy.hidden = !isText;\n    $('#file-edit').hidden = !isText && state !== 'available';\n    $('#file-edit').disabled = detail.cleanupStatus === 'pending';\n    $('#file-edit').title = detail.cleanupStatus === 'pending' ? t('ad.editCleanupPending') : '';\n  } catch (error) {\n    if (request === fileRequest) fileDetail.textContent = error.message || t('ad.loadFail');\n  }\n}\nfunction closeFileDetails() {\n  if (shareEditBusy) return;\n  activeFileDetail = null;\n  resetShareEditor();\n  $('#file-edit').hidden = true;\n  activePreview?.dispose(); activePreview = null;\n  fileRequest++;\n  fileDetail.replaceChildren();\n  $('#file-context').textContent = '';\n  fileDownload.hidden = true;\n  textCopy.hidden = true;\n  fileDownload.removeAttribute('href');\n  fileDownload.removeAttribute('download');\n  fileDialog.close();\n}\n$('#file-close').addEventListener('click', closeFileDetails);\ntextCopy.addEventListener('click', async () => {\n  const detail = activeFileDetail;\n  if (detail?.kind !== 'text') return;\n  const copied = await copyText(detail.text ?? '');\n  toast(t(copied ? 'copied.text' : 'ad.copyFailed'));\n});\n$('#file-edit').addEventListener('click', () => {\n  if (!activeFileDetail || shareEditBusy) return;\n  const detail = activeFileDetail;\n  const editor = createShareEditor(detail, {\n    onBusy(value) { shareEditBusy = value; $('#lang-btn').disabled = value; },\n    onCancel() { openFileDetails(detail.code); },\n    onSaved() {\n      toast(t('ad.editSaved'));\n      openFileDetails(detail.code);\n      loadList(); loadStats();\n    },\n  });\n  fileDetail.hidden = true;\n  fileDialog.querySelector('.source-footer').hidden = true;\n  $('#file-title').textContent = t('ad.editShare');\n  $('#file-editor').replaceChildren(editor.element);\n  $('#file-editor').hidden = false;\n  editor.enhance();\n});\nfileDialog.addEventListener('cancel', e => { e.preventDefault(); closeFileDetails(); });\n\n/* Keep unsaved input local; only a validated save changes retention. */\nconst retentionInput = $('#retention-days');\nconst retentionSave = $('#retention-save');\nconst retentionError = $('#retention-error');\nasync function loadSettings() {\n  $('#retention-status').hidden = true;\n  retentionInput.disabled = true;\n  retentionSave.disabled = true;\n  retentionError.hidden = true;\n  $('#retention-retry').hidden = true;\n  try {\n    const settings = await api('/api/admin/settings');\n    if (!Number.isInteger(settings.expiredRetentionDays) || settings.expiredRetentionDays < 0 || settings.expiredRetentionDays > 3650) throw new Error(t('ad.loadFail'));\n    retentionInput.value = settings.expiredRetentionDays;\n    retentionInput.disabled = false;\n    retentionSave.disabled = false;\n  } catch (error) {\n    retentionError.textContent = error.message || t('ad.loadFail');\n    retentionError.hidden = false;\n    $('#retention-retry').hidden = false;\n  }\n}\n$('#retention-retry').addEventListener('click', loadSettings);\nretentionInput.addEventListener('input', () => { $('#retention-status').hidden = true; });\n$('#retention-form').addEventListener('submit', async e => {\n  e.preventDefault();\n  if (retentionSave.disabled || !retentionInput.reportValidity()) return;\n  retentionSave.disabled = true;\n  retentionInput.disabled = true;\n  retentionError.hidden = true;\n  $('#retention-status').hidden = true;\n  try {\n    const settings = await api('/api/admin/settings', { method: 'PUT', body: { expiredRetentionDays: Number(retentionInput.value) } });\n    retentionInput.value = settings.expiredRetentionDays;\n    $('#retention-status').textContent = t('ad.settingsSaved');\n    $('#retention-status').hidden = false;\n  } catch (error) {\n    retentionError.textContent = error.message || t('ad.loadFail');\n    retentionError.hidden = false;\n  } finally {\n    retentionInput.disabled = false;\n    retentionSave.disabled = false;\n  }\n});\n\nconst guestWeekly = $('#guest-weekly');\nconst guestSave = $('#guest-save');\nconst guestError = $('#guest-error');\nfunction guestBusy(busy) {\n  for (const control of [guestWeekly, guestSave]) control.disabled = busy;\n}\nasync function loadGuestPolicy() {\n  $('#guest-status').hidden = true;\n  guestBusy(true);\n  guestError.hidden = true;\n  $('#guest-retry').hidden = true;\n  try {\n    const policy = await api('/api/admin/upload-policy');\n    if (!Number.isInteger(policy.weeklyFileLimit) || policy.weeklyFileLimit < 0 || policy.weeklyFileLimit > 1000) throw new Error(t('ad.loadFail'));\n    guestWeekly.value = policy.weeklyFileLimit;\n    guestBusy(false);\n  } catch (error) {\n    guestError.textContent = error.message || t('ad.loadFail');\n    guestError.hidden = false;\n    $('#guest-retry').hidden = false;\n  }\n}\n$('#guest-retry').addEventListener('click', loadGuestPolicy);\nguestWeekly.addEventListener('input', () => { $('#guest-status').hidden = true; });\n$('#guest-policy-form').addEventListener('submit', async e => {\n  e.preventDefault();\n  if (guestSave.disabled || !e.target.reportValidity()) return;\n  const body = { weeklyFileLimit: Number(guestWeekly.value) };\n  guestBusy(true);\n  guestError.hidden = true;\n  $('#guest-status').hidden = true;\n  try {\n    await api('/api/admin/upload-policy', { method: 'PUT', body });\n    $('#guest-status').textContent = t('ad.guestSaved');\n    $('#guest-status').hidden = false;\n  } catch (error) {\n    guestError.textContent = error.message || t('ad.loadFail');\n    guestError.hidden = false;\n  } finally { guestBusy(false); }\n});\n\nlet guardRequest = 0;\nasync function loadLoginProtection() {\n  const request = ++guardRequest;\n  const refresh = $('#login-guard-refresh');\n  const error = $('#login-guard-error');\n  refresh.disabled = true;\n  error.hidden = true;\n  $('#login-guard-bans').replaceChildren();\n  $('#login-guard-status').textContent = '';\n  try {\n    const data = await api('/api/admin/login-protection');\n    if (request !== guardRequest) return;\n    if (typeof data.enabled !== 'boolean' || !Array.isArray(data.bans) ||\n        ![data.maxFailures, data.windowSeconds, data.banSeconds].every(n => Number.isInteger(n) && n > 0)) throw new Error(t('ad.loadFail'));\n    $('#login-guard-status').textContent = data.enabled\n      ? t('ad.guardRule', data.windowSeconds / 60, data.maxFailures, data.banSeconds / 60) : t('ad.guardDisabled');\n    if (!data.enabled) return;\n    if (!data.bans.length) $('#login-guard-bans').append(el('small', { class: 'muted' }, t('ad.guardEmpty')));\n    for (const ban of data.bans) {\n      const button = el('button', { class: 'btn small ghost', type: 'button' }, t('ad.guardUnblock'));\n      button.addEventListener('click', async () => {\n        button.disabled = true;\n        error.hidden = true;\n        try {\n          await api('/api/admin/login-protection/unblock', { method: 'POST', body: { ip: ban.ip } });\n          toast(t('ad.guardUnblocked'), 'ok');\n          await loadLoginProtection();\n        } catch (e) {\n          error.textContent = e.message || t('ad.loadFail');\n          error.hidden = false;\n          button.disabled = false;\n        }\n      });\n      $('#login-guard-bans').append(el('div', { class: 'login-guard-row' },\n        el('div', { class: 'login-guard-info' },\n          el('b', {}, ban.ip === 'unknown' ? t('ad.guardUnknown') : ban.ip),\n          el('small', { class: 'muted' }, t('ad.guardFailures', ban.failures) + ' \xB7 ' + t('ad.guardUntil', fmtDate(ban.bannedUntil))),\n          el('small', { class: 'muted' }, t('ad.guardLast', fmtDate(ban.lastFailedAt)))), button));\n    }\n  } catch (e) {\n    if (request !== guardRequest) return;\n    error.textContent = e.message || t('ad.loadFail');\n    error.hidden = false;\n  } finally { if (request === guardRequest) refresh.disabled = false; }\n}\n$('#login-guard-refresh').addEventListener('click', loadLoginProtection);\n\ninitUi();\ninitClassifications();\ninitAuditLayout();\ninitSecurity();\ninitCombinedAdmin();\nfunction applyFileFilters() {\n  fileFilters.q = $('#files-q').value.trim();\n  fileFilters.kind = $('#files-kind').value;\n  offset = 0;\n  loadList();\n}\n$('#files-filter').addEventListener('submit', event => { event.preventDefault(); applyFileFilters(); });\n$('#files-kind').addEventListener('change', applyFileFilters);\nfor (const button of document.querySelectorAll('#files-status-tabs button')) button.addEventListener('click', () => {\n  fileFilters.status = button.dataset.status;\n  for (const node of document.querySelectorAll('#files-status-tabs button')) node.setAttribute('aria-pressed', String(node === button));\n  applyFileFilters();\n});\n", "js/common.js": "import { t } from './i18n.js?v=732e7eabbd2c58e9';\n\nexport const $ = (sel, el = document) => el.querySelector(sel);\nexport const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];\n\n/** Keep Tab within modal content, including the wrap past the final button. */\nexport function initDialogs() {\n  for (const dialog of $$('dialog')) {\n    dialog.addEventListener('keydown', event => {\n      if (event.key !== 'Tab') return;\n      const controls = $$('button, a[href], input, select, textarea, summary, [tabindex]', dialog)\n        .filter(node => !node.disabled && node.tabIndex >= 0 && node.getClientRects().length);\n      const first = controls[0];\n      const last = controls.at(-1);\n      if (!first) { event.preventDefault(); return; }\n      if (!controls.includes(document.activeElement) || (event.shiftKey && document.activeElement === first)) {\n        event.preventDefault(); (event.shiftKey ? last : first).focus();\n      } else if (!event.shiftKey && document.activeElement === last) {\n        event.preventDefault(); first.focus();\n      }\n    });\n  }\n}\n\n/** fetch JSON \u5C01\u88C5:\u975E 2xx \u629B\u9519(\u5E26\u670D\u52A1\u7AEF\u7684\u4E2D\u6587 message \u4E0E\u673A\u5668\u7801) */\nexport async function api(path, opts = {}) {\n  const res = await fetch(path, {\n    method: opts.method || 'GET',\n    headers: opts.body !== undefined ? { 'Content-Type': 'application/json' } : {},\n    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,\n  });\n  if (res.headers.get('X-Audit-Status') === 'unavailable') window.dispatchEvent(new Event('audit-write-failed'));\n  let data = null;\n  try { data = await res.json(); } catch { /* \u975E JSON \u54CD\u5E94 */ }\n  if (!res.ok) {\n    throw responseError(data, res.status);\n  }\n  return data;\n}\n\n/** Shared by fetch and XHR so security errors survive multipart/direct uploads. */\nexport function responseError(data, status) {\n  const error = new Error(data?.message || t('req.fail', status));\n  return Object.assign(error, { code: data?.error || 'unknown', status,\n    remainingBytes: data?.remainingBytes, retryAt: data?.retryAt,\n    serverTime: data?.serverTime, reason: data?.reason, requestId: data?.requestId });\n}\n\nexport function fmtBytes(n) {\n  if (!Number.isFinite(n) || n < 0) return '-';\n  const units = ['B', 'KB', 'MB', 'GB', 'TB'];\n  let i = 0;\n  while (n >= 1000 && i < units.length - 1) { n /= 1000; i++; }\n  const v = i === 0 ? Math.round(n) : n >= 100 ? Math.round(n) : Math.round(n * 100) / 100;\n  return `${v} ${units[i]}`;\n}\n\n/** \u6C38\u4E45\u5206\u4EAB\u8FD4\u56DE null,\u7531\u8C03\u7528\u65B9\u6309\u8BED\u8A00\u6E32\u67D3\u300C\u6C38\u4E45 / Forever\u300D */\nexport function fmtDate(ms) {\n  if (ms === null || ms === undefined) return null;\n  const d = new Date(ms);\n  const p = (x) => String(x).padStart(2, '0');\n  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;\n}\n\n/** \u79D2\u6570\u4EBA\u6027\u5316:\u7528\u4E8E\u4E0A\u4F20\u5269\u4F59\u65F6\u95F4 / \u8FC7\u671F\u5012\u8BA1\u65F6,\u5355\u4F4D\u8BCD\u968F\u8BED\u8A00 */\nexport function fmtDuration(sec) {\n  if (!Number.isFinite(sec) || sec < 0) return '-';\n  if (sec < 1) return t('dur.ms');\n  if (sec < 60) return t('dur.s', Math.round(sec));\n  if (sec < 3600) {\n    const m = Math.floor(sec / 60);\n    const s = Math.round(sec % 60);\n    return s ? t('dur.hm', m, s) : t('dur.h', m);\n  }\n  if (sec < 86400) {\n    const h = Math.floor(sec / 3600);\n    const m = Math.round((sec % 3600) / 60);\n    return m ? t('dur.hH', h, m) : t('dur.hH2', h);\n  }\n  return t('dur.d', Math.round(sec / 86400));\n}\n\n/** \u6309\u6587\u4EF6\u540D/ MIME \u6311\u4E00\u4E2A\u76F4\u89C2\u56FE\u6807(\u7EAF\u5C55\u793A\u7528) */\nexport function iconFor(name = '', mime = '') {\n  const ext = (name.split('.').pop() || '').toLowerCase();\n  if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'].includes(ext)) return '\u{1F5BC}\uFE0F';\n  if (mime.startsWith('video/') || ['mp4', 'mkv', 'mov', 'avi', 'webm', 'flv'].includes(ext)) return '\u{1F3AC}';\n  if (mime.startsWith('audio/') || ['mp3', 'flac', 'wav', 'ogg', 'm4a', 'aac'].includes(ext)) return '\u{1F3B5}';\n  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(ext)) return '\u{1F5DC}\uFE0F';\n  if (mime === 'application/pdf' || ext === 'pdf') return '\u{1F4D5}';\n  if (['doc', 'docx', 'txt', 'md', 'ppt', 'pptx', 'xls', 'xlsx', 'csv'].includes(ext)) return '\u{1F4C4}';\n  if (['js', 'ts', 'py', 'json', 'html', 'css', 'java', 'go', 'rs', 'c', 'cpp', 'sh', 'yml', 'yaml', 'xml'].includes(ext)) return '\u{1F9E9}';\n  return '\u{1F4E6}';\n}\n\nexport async function copyText(text) {\n  try {\n    await navigator.clipboard.writeText(text);\n    return true;\n  } catch { /* \u8D70\u964D\u7EA7 */ }\n  try {\n    const ta = document.createElement('textarea');\n    ta.value = text;\n    ta.style.cssText = 'position:fixed;opacity:0';\n    document.body.appendChild(ta);\n    ta.select();\n    const ok = document.execCommand('copy');\n    ta.remove();\n    return ok;\n  } catch {\n    return false;\n  }\n}\n\nexport function toast(msg, type = 'info') {\n  let host = $('#toast-host');\n  if (!host) {\n    host = document.createElement('div');\n    host.id = 'toast-host';\n    document.body.appendChild(host);\n  }\n  const t = document.createElement('div');\n  t.className = `toast ${type}`;\n  t.textContent = msg;\n  host.appendChild(t);\n  requestAnimationFrame(() => t.classList.add('show'));\n  setTimeout(() => {\n    t.classList.remove('show');\n    setTimeout(() => t.remove(), 300);\n  }, 2400);\n}\n\nexport function initTheme() {\n  const btn = $('#theme-btn');\n  const meta = $('meta[name=\"theme-color\"]');\n  const sync = () => {\n    if (meta) meta.content = document.documentElement.dataset.theme === 'dark' ? '#0f1117' : '#f6f7fb';\n  };\n  window.addEventListener('storage', event => {\n    if(event.key === 'theme' && ['dark','light'].includes(event.newValue)){document.documentElement.dataset.theme=event.newValue;sync();}\n  });\n  sync();\n  btn?.addEventListener('click', () => {\n    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';\n    localStorage.setItem('theme', next);\n    document.documentElement.dataset.theme = next;\n    sync();\n  });\n}\n\n/** \u5B89\u5168 DOM \u6784\u5EFA:\u5168\u90E8 textContent,\u9632 XSS */\nexport function el(tag, attrs = {}, ...children) {\n  const n = document.createElement(tag);\n  for (const [k, v] of Object.entries(attrs)) {\n    if (k === 'class') n.className = v;\n    else if (k === 'href' || k === 'download' || k === 'type' || k === 'inputmode' || k === 'colspan') n.setAttribute(k, v);\n    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);\n    else n[k] = v;\n  }\n  for (const c of children.flat(Infinity)) {\n    if (c == null || c === false) continue;\n    n.append(c instanceof Node ? c : document.createTextNode(String(c)));\n  }\n  return n;\n}\n", "js/i18n.js": `/**
 * \u8F7B\u91CF i18n:HTML \u9759\u6001\u6587\u6848\u7528 data-i18n / data-i18n-ph / data-i18n-title \u6807\u8BB0,
 * JS \u52A8\u6001\u5B57\u7B26\u4E32\u7528 t('key', \u2026args);{n} \u5360\u4F4D\u3002
 * \u8BED\u8A00\u4F18\u5148\u7EA7:localStorage('lang') > \u6D4F\u89C8\u5668\u8BED\u8A00(en \u5F00\u5934\u2192\u82F1\u6587)> \u4E2D\u6587\u3002
 * \u5207\u6362\u540E\u8C03\u7528\u5DF2\u6CE8\u518C\u7684\u91CD\u6E32\u67D3\u94A9\u5B50(\u5404\u9875\u9762 setLang \u65F6\u767B\u8BB0)\u3002
 * \u8BCD\u5178\u503C\u4E3A\u6570\u7EC4\u65F6\u968F\u673A\u53D6\u4E00\u6761(\u9875\u811A\u5F69\u86CB,\u6BCF\u6B21\u52A0\u8F7D/\u5207\u8BED\u8A00\u91CD\u6447)\u3002
 */

const DICT = {
  zh: {
    "audit.action.apiAuth": "API \u9274\u6743",
    "audit.action.apiList": "API \u67E5\u8BE2\u5217\u8868",
    "audit.action.apiRead": "API \u67E5\u8BE2\u8BE6\u60C5",
    "audit.action.apiEdit": "API \u4FEE\u6539\u5206\u4EAB",
    "audit.action.apiDelete": "API \u5220\u9664\u5206\u4EAB",
    "audit.action.apiDownload": "API \u4E0B\u8F7D\u6587\u4EF6",
    "audit.detail.changedFields": "\u4FEE\u6539\u5B57\u6BB5",
    "audit.value.api_disabled": "\u811A\u672C\u63A5\u53E3\u672A\u914D\u7F6E",
    "audit.value.unauthorized": "API Token \u65E0\u6548\u6216\u7F3A\u5931",

    "audit.upload": "\u4E0A\u4F20\u65E5\u5FD7",
    "audit.actor.visitor": "\u8BBF\u5BA2",
    "audit.pickup": "\u53D6\u4EF6\u65E5\u5FD7",
    "audit.repeat": "\u5408\u5E76 {0} \u6B21",
    "audit.action.upload": "\u4E0A\u4F20\u5185\u5BB9",
    "audit.action.uploadCancel": "\u53D6\u6D88\u4E0A\u4F20",
    "audit.action.pickup": "\u67E5\u770B\u5206\u4EAB",
    "audit.action.publicDownload": "\u516C\u5F00\u4E0B\u8F7D",
    "audit.action.downloadProbe": "\u68C0\u67E5\u4E0B\u8F7D",
    "audit.action.accessBlocked": "\u8BBF\u95EE\u62E6\u622A",
    "audit.action.securityRules": "\u4FEE\u6539\u5B89\u5168\u89C4\u5219",
    "audit.detail.stage": "\u5904\u7406\u9636\u6BB5",
    "audit.detail.reason": "\u539F\u56E0",
    "audit.detail.scope": "\u4FDD\u62A4\u8303\u56F4",
    "audit.detail.kind": "\u5185\u5BB9\u7C7B\u578B",
    "audit.detail.visitorId": "\u8BBF\u5BA2\u6807\u8BC6",
    "audit.detail.uploadRef": "\u4E0A\u4F20\u5173\u8054\u53F7",
    "audit.detail.textLength": "\u6587\u672C\u957F\u5EA6\uFF08\u5B57\u7B26\uFF09",
    "audit.detail.count": "\u5408\u5E76\u8BF7\u6C42\u6570",
    "audit.detail.firstAt": "\u9996\u6B21\u53D1\u751F",
    "audit.detail.lastAt": "\u6700\u8FD1\u53D1\u751F",
    "audit.detail.action": "\u89C4\u5219\u64CD\u4F5C",
    "audit.detail.configRevision": "\u914D\u7F6E\u7248\u672C",
    "audit.value.init": "\u4E0A\u4F20\u521D\u59CB\u5316",
    "audit.value.direct": "\u6587\u4EF6\u76F4\u4F20",
    "audit.value.text": "\u6587\u672C",
    "audit.value.file": "\u6587\u4EF6",
    "audit.value.part": "\u4E0A\u4F20\u5206\u7247",
    "audit.value.complete": "\u5B8C\u6210\u4E0A\u4F20",
    "audit.value.abort": "\u53D6\u6D88\u4E0A\u4F20",
    "audit.value.lookup": "\u67E5\u770B\u5206\u4EAB",
    "audit.value.download": "\u4E0B\u8F7D\u6587\u4EF6",
    "audit.value.upload": "\u4E0A\u4F20",
    "audit.value.pickup": "\u53D6\u4EF6",
    "audit.value.rate_limit": "\u8BF7\u6C42\u9891\u7387\u8D85\u9650",
    "audit.value.access_rule": "IP \u5C01\u7981",
    "audit.value.region": "\u5730\u533A\u5C01\u7981",
    "audit.value.service_unavailable": "\u5B89\u5168\u9632\u62A4\u4E0D\u53EF\u7528",
    "audit.value.not_found": "\u53E3\u4EE4\u6216\u4E0A\u4F20\u4F1A\u8BDD\u4E0D\u5B58\u5728",
    "audit.value.bad_request": "\u8BF7\u6C42\u53C2\u6570\u6216\u5206\u7247\u6821\u9A8C\u5931\u8D25",
    "audit.value.expired": "\u5206\u4EAB\u5DF2\u8FC7\u671F",
    "audit.value.exhausted": "\u53D6\u4EF6\u6B21\u6570\u5DF2\u7528\u5B8C",
    "audit.value.gone": "\u6587\u4EF6\u4E0D\u5B58\u5728\u6216\u5DF2\u6E05\u7406",
    "audit.value.too_large": "\u6587\u4EF6\u8D85\u8FC7\u5927\u5C0F\u4E0A\u9650",
    "audit.value.capacity_exceeded": "\u5B58\u50A8\u7A7A\u95F4\u4E0D\u8DB3",
    "audit.value.internal": "\u670D\u52A1\u5904\u7406\u5931\u8D25",
    "audit.value.config": "\u5B58\u50A8\u914D\u7F6E\u4E0D\u652F\u6301\u6B64\u64CD\u4F5C",
    "audit.value.weekly_upload_limit": "\u6BCF\u5468\u4E0A\u4F20\u989D\u5EA6\u5DF2\u7528\u5B8C",
    "audit.value.restricted_share_options": "\u4E0D\u5141\u8BB8\u6C38\u4E45\u6216\u4E0D\u9650\u6B21\u5206\u4EAB",
    "audit.value.upload_session_owner": "\u4E0A\u4F20\u4F1A\u8BDD\u5F52\u5C5E\u4E0D\u7B26",
    "audit.value.upload_policy_changed": "\u4E0A\u4F20\u6743\u9650\u5DF2\u53D8\u66F4",
    "audit.value.upload_policy_unavailable": "\u4E0A\u4F20\u914D\u989D\u670D\u52A1\u4E0D\u53EF\u7528",
    "audit.value.upload_policy_busy": "\u4E0A\u4F20\u914D\u989D\u670D\u52A1\u7E41\u5FD9",
    "audit.value.security_unavailable": "\u5B89\u5168\u9632\u62A4\u4E0D\u53EF\u7528",

    "ui.footerAbout": "\u89C1\u5B57\u5982\u9762\uFF0C\u8BA9\u5206\u4EAB\u7B80\u5355\u4E00\u70B9\u3002",
    "ui.footerNav": "\u9875\u5C3E\u5BFC\u822A",
    "ui.publicNav": "\u53D1\u9001\u4E0E\u53D6\u4EF6",
    "ui.help": "\u4F7F\u7528\u5E2E\u52A9",
    "ui.toPickup": "\u524D\u5F80\u53D6\u4EF6",
    "ui.toSend": "\u524D\u5F80\u53D1\u9001",
    "ui.viewShare": "\u67E5\u770B\u5206\u4EAB",
    "ui.clear": "\u6E05\u7A7A",
    "ui.shareFound": "\u53D6\u4EF6\u6210\u529F",
    "ui.show": "\u663E\u793A",
    "ui.showToken": "\u663E\u793A\u7BA1\u7406\u4EE4\u724C",
    "ui.backSend": "\u8FD4\u56DE\u53D1\u9001\u9875",
    'ad.codeCopied': '\u5DF2\u590D\u5236\u53D6\u4EF6\u53E3\u4EE4',
    'ad.allShares': '\u5168\u90E8',
    'ad.activeShares': '\u6709\u6548',
    'ad.expiredShares': '\u5DF2\u8FC7\u671F',
    'ad.exhaustedShares': '\u5DF2\u53D6\u5B8C',
    'ad.searchShares': '\u641C\u7D22\u5217\u8868\u4E2D\u7684\u6587\u4EF6\u540D\u3001\u53E3\u4EE4\u6216\u8BBF\u5BA2\u6807\u8BC6',
    'ad.searchHint': '\u6587\u4EF6\u540D\u6309\u5217\u8868\u4E2D\u7684\u524D 40 \u4E2A\u5B57\u7B26\u641C\u7D22\uFF1B\u8BBF\u5BA2\u6807\u8BC6\u53EF\u5728\u4E0A\u4F20\u6765\u6E90\u8BE6\u60C5\u67E5\u770B\u3002\u7B5B\u9009\u8986\u76D6\u6240\u6709\u9875\u3002',
    'ad.searchButton': '\u641C\u7D22',
    'ad.allKinds': '\u6240\u6709\u7C7B\u578B',
    'ad.currentPageSize': '\u6BCF\u9875\u6761\u6570',
    'ad.overview': '\u5206\u4EAB\u4E0E\u5BB9\u91CF\u6982\u89C8',
    'ad.contact': '\u8054\u7CFB\u7AD9\u957F',
    'ad.adminFooter': '\u6587\u4EF6\u4E2D\u8F6C\u7AD9 \xB7 \u89C1\u5B57\u5982\u9762',
    'storage.namespace': '\u5143\u6570\u636E\u5B58\u50A8',
    'storage.sharedQuota': '\u672C\u7A7A\u95F4\u7528\u91CF / \u8D26\u6237\u5171\u4EAB\u514D\u8D39\u989D\u5EA6',
    'storage.quotaReference': '\u672C\u547D\u540D\u7A7A\u95F4\u5360\u8D26\u6237\u514D\u8D39\u989D\u5EA6\u7684\u6BD4\u4F8B',
    'storage.notConfigured': '\u5F85\u63A5\u5165\u7528\u91CF\u7EDF\u8BA1',
    'storage.keys': '{0} \u4E2A\u952E',
    'storage.sample': '{0} UTC',
    'storage.dailyPeak': '\u5F53\u65E5\u5CF0\u503C \xB7 \u975E\u5B9E\u65F6 \xB7 \u4EC5\u5F53\u524D\u547D\u540D\u7A7A\u95F4',
    'storage.analyticsRequired': '\u9700\u914D\u7F6E\u53EA\u8BFB Analytics \u51ED\u636E',
    "ad.editShare": "\u7F16\u8F91\u5206\u4EAB",
    "ad.editCount": "\u5DF2\u53D6\u6B21\u6570",
    "ad.editLimit": "\u53D6\u4EF6\u4E0A\u9650",
    "ad.editUnlimited": "\u4E0D\u9650\u6B21",
    "ad.editSave": "\u4FDD\u5B58\u4FEE\u6539",
    "ad.editCancel": "\u53D6\u6D88",
    "ad.editReload": "\u653E\u5F03\u4FEE\u6539\u5E76\u91CD\u65B0\u52A0\u8F7D",
    "ad.editSaved": "\u5206\u4EAB\u5DF2\u66F4\u65B0",
    "ad.editInvalid": "\u8BF7\u586B\u5199\u6709\u6548\u7684\u6B21\u6570\u548C\u8FC7\u671F\u65F6\u95F4",
    "ad.editTimeChanged": "\u6709\u6548\u671F\u5DF2\u5230\uFF0C\u72B6\u6001\u5DF2\u66F4\u65B0\uFF0C\u8BF7\u786E\u8BA4\u540E\u518D\u6B21\u4FDD\u5B58",
    "ad.editCleanupPending": "\u5206\u4EAB\u5DF2\u8FDB\u5165\u6E05\u7406\u671F\uFF0C\u8BF7\u5148\u5907\u4EFD\u5185\u5BB9\u540E\u91CD\u65B0\u5206\u4EAB",
    "ad.editHint": "\u65F6\u95F4\u6309 {0} \u663E\u793A\u548C\u8F93\u5165\u3002\u8FC7\u53BB\u65F6\u95F4\u4F1A\u4F7F\u5206\u4EAB\u8FC7\u671F\uFF0C\u5E76\u6309\u540E\u53F0\u4FDD\u7559\u5929\u6570\u8FDB\u5165\u6E05\u7406\u6D41\u7A0B\u3002\u6C38\u4E45\u5206\u4EAB\u4ECD\u5360\u7528\u5B58\u50A8\u3002",
    "ad.editStatusHint": "\u6709\u6548\uFF1A\u5FC5\u8981\u65F6\u5EF6\u957F\u81F3 7 \u5929\u540E\uFF0C\u5E76\u5C06\u4E0A\u9650\u8BBE\u4E3A\u5DF2\u53D6\u6B21\u6570 + 1\uFF08\u8FBE\u5230\u8BA1\u6570\u4E0A\u754C\u65F6\u8BBE\u4E3A\u4E0D\u9650\u6B21\uFF09\u3002\u5DF2\u8FC7\u671F\uFF1A\u65F6\u95F4\u8BBE\u4E3A\u5F53\u524D\u3002\u5DF2\u53D6\u5B8C\uFF1A\u8865\u9F50\u5DF2\u53D6\u6B21\u6570\uFF1B\u539F\u672C\u4E0D\u9650\u6B21\u65F6\u8BBE\u5B9A\u6709\u9650\u4E0A\u9650\u3002\u539F\u672C\u8FC7\u671F\u7684\u6587\u4EF6\u4F1A\u5EF6\u957F\u81F3 7 \u5929\u540E\u3002\u6240\u6709\u8054\u52A8\u503C\u5747\u663E\u793A\u5728\u8868\u5355\u4E2D\uFF0C\u4FDD\u5B58\u540E\u751F\u6548\u3002",
    "audit.action.editShare": "\u4FEE\u6539\u5206\u4EAB",
    'ad.textDetails': '\u6587\u672C\u8BE6\u60C5',
    'ad.textContent': '\u6B63\u6587',
    'ad.textInvalid': '\u6B63\u6587\u4E0D\u80FD\u4E3A\u7A7A\uFF0C\u6700\u591A {0} \u5B57\u7B26',
    'ad.textDescription': '\u8865\u5145\u8BF4\u660E',
    'ad.backText': '\u8FD4\u56DE\u6587\u672C',
    'audit.detail.beforeTextLength': '\u4FEE\u6539\u524D\u5B57\u7B26\u6570',
    'audit.detail.afterTextLength': '\u4FEE\u6539\u540E\u5B57\u7B26\u6570',
    "audit.detail.beforeRules": "\u4FEE\u6539\u524D",
    "audit.detail.afterRules": "\u4FEE\u6539\u540E",

    'ad.settings': '\u8BBE\u7F6E',
    'ad.shareSettings': '\u5206\u4EAB\u89C4\u5219',
    'ad.guestWeeklyFiles': '\u672A\u5907\u6CE8\u8BBF\u5BA2\u6BCF\u5468\u6587\u4EF6\u6570',
    'ad.displaySettings': '\u5217\u8868\u663E\u793A',
    'ad.filesPageSize': '\u6587\u4EF6\u6BCF\u9875\u6761\u6570',
    'ad.auditPageSize': '\u65E5\u5FD7\u6BCF\u9875\u6761\u6570',
    'ad.browserSettings': '\u7ACB\u5373\u751F\u6548\uFF0C\u4EC5\u4FDD\u5B58\u5728\u5F53\u524D\u6D4F\u89C8\u5668',
    'ad.preferenceNotSaved': '\u672C\u6B21\u5DF2\u751F\u6548\uFF0C\u6D4F\u89C8\u5668\u672A\u80FD\u4FDD\u5B58\u6B64\u504F\u597D',
    'ad.filesPagination': '\u6587\u4EF6\u5206\u9875',
    'ad.auditPagination': '\u65E5\u5FD7\u5206\u9875',
    'context.add': '\u8865\u5145\u4FE1\u606F\uFF08\u9009\u586B\uFF09',
    'context.name': '\u600E\u4E48\u79F0\u547C\u4F60',
    'context.description': '\u6587\u4EF6\u8BF4\u660E',
    'context.namePh': '\u586B\u5199\u4F60\u5E38\u7528\u7684\u79F0\u547C',
    'context.descriptionPh': '\u7B80\u8FF0\u6587\u4EF6\u5185\u5BB9\uFF0C\u540C\u6279\u6587\u4EF6\u5171\u7528',
    'context.visibility': '\u8865\u5145\u4FE1\u606F\u4EC5\u7BA1\u7406\u5458\u53EF\u89C1',
    'ad.retentionTitle': '\u81EA\u52A8\u6E05\u7406',
    'ad.recentUploads': '\u8FD1\u671F\u4E0A\u4F20',
    'ad.historyScope': '\u6700\u8FD1 10 \u6761\u73B0\u5B58\u5206\u4EAB',
    'ad.backFile': '\u8FD4\u56DE\u6587\u4EF6',
    'ad.submittedName': '\u81EA\u586B\u79F0\u547C',
    'ad.requestIP': '\u8BF7\u6C42 IP',
    'ad.network': '\u7F51\u7EDC\u7EC4\u7EC7',
    'ad.browserReported': '\u6D4F\u89C8\u5668',
    'ad.browserHint': '\u7531\u6D4F\u89C8\u5668\u63D0\u4F9B\uFF0C\u53EF\u88AB\u4FEE\u6539\uFF0C\u4EC5\u4F5C\u53C2\u8003',
    'ad.noteShort': '\u5907\u6CE8',
    'ad.copyIP': '\u590D\u5236',
    'ad.ipCopied': 'IP \u5DF2\u590D\u5236',
    'ad.copyFailed': '\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u9009\u62E9',
    'ad.fileDescription': '\u6587\u4EF6\u8BF4\u660E',
    'audit.detail.filename': '\u6587\u4EF6\u540D',
    'audit.detail.sizeBytes': '\u5927\u5C0F\uFF08\u5B57\u8282\uFF09',
    'audit.navigation': "\u7BA1\u7406\u9875\u9762",
    'audit.files': "\u6587\u4EF6\u7BA1\u7406",
    'audit.title': "\u65E5\u5FD7\u5BA1\u8BA1",
    'audit.retention': "\u6700\u8FD1 30 \u5929\uFF0C\u6700\u591A 1,000 \u6761\uFF1B\u65F6\u95F4\u6309\u672C\u5730\u65F6\u533A\u663E\u793A",
    'audit.export': "\u5BFC\u51FA\u7B5B\u9009\u7ED3\u679C",
    'audit.categories': "\u65E5\u5FD7\u5206\u7C7B",
    'audit.all': "\u5168\u90E8\u65E5\u5FD7",
    'audit.login': "\u767B\u5F55\u65E5\u5FD7",
    'audit.operation': "\u64CD\u4F5C\u65E5\u5FD7",
    'audit.security': "\u5B89\u5168\u4E8B\u4EF6",
    'audit.result': "\u7ED3\u679C",
    'audit.anyResult': "\u5168\u90E8\u7ED3\u679C",
    'audit.success': "\u6210\u529F",
    'audit.failed': "\u5931\u8D25",
    'audit.blocked': "\u5DF2\u62E6\u622A",
    'audit.from': "\u5F00\u59CB\u65E5\u671F",
    'audit.to': "\u7ED3\u675F\u65E5\u671F",
    'audit.keyword': "IP / \u6587\u4EF6 / \u8BBF\u5BA2",
    'audit.search': "\u641C\u7D22 IP\u3001\u53D6\u4EF6\u7801\u3001\u6587\u4EF6\u540D\u6216\u8BBF\u5BA2\u6807\u8BC6",
    'audit.filter': "\u7B5B\u9009",
    'audit.reset': "\u91CD\u7F6E",
    'audit.time': "\u65F6\u95F4",
    'audit.action': "\u64CD\u4F5C",
    'audit.actor': "\u64CD\u4F5C\u8EAB\u4EFD",
    'audit.source': "\u6765\u6E90 IP / \u5C5E\u5730",
    'audit.target': "\u64CD\u4F5C\u5BF9\u8C61",
    'audit.details': "\u8BE6\u60C5",
    'audit.empty': "\u6682\u65E0\u5339\u914D\u65E5\u5FD7\u3002\u65E5\u5FD7\u4ECE\u529F\u80FD\u4E0A\u7EBF\u540E\u5F00\u59CB\u8BB0\u5F55\u3002",
    'audit.disabled': "\u672A\u542F\u7528\u65E5\u5FD7\u5BA1\u8BA1\uFF1A\u9700\u7ED1\u5B9A R2 \u6216 D1\u3002",
    'audit.page': "\u7B2C {0} / {1} \u9875 \xB7 \u5171 {2} \u6761",
    'audit.dateError': "\u5F00\u59CB\u65E5\u671F\u4E0D\u80FD\u665A\u4E8E\u7ED3\u675F\u65E5\u671F",
    'audit.http': "\u8BF7\u6C42 / \u72B6\u6001\u7801",
    'audit.duration': "\u5904\u7406\u8017\u65F6",
    'audit.id': "\u65E5\u5FD7\u7F16\u53F7",
    'audit.agent': "\u6D4F\u89C8\u5668\u6807\u8BC6\uFF08\u5BA2\u6237\u7AEF\u63D0\u4F9B\uFF09",
    'audit.yes': "\u662F",
    'audit.no': "\u5426",
    'audit.description': "\u8BF4\u660E",
    'audit.downloadHint': "\u5DF2\u5F00\u59CB\u8FD4\u56DE\u6587\u4EF6\u6D41\uFF0C\u4E0D\u4EE3\u8868\u6D4F\u89C8\u5668\u5DF2\u5B8C\u6210\u4E0B\u8F7D\u3002",
    'audit.writeFailed': "\u64CD\u4F5C\u5DF2\u5904\u7406\uFF0C\u4F46\u5BA1\u8BA1\u8BB0\u5F55\u672A\u4FDD\u5B58\uFF0C\u8BF7\u68C0\u67E5\u65E5\u5FD7\u5B58\u50A8\u3002",
    'audit.action.login': "\u7BA1\u7406\u5458\u767B\u5F55",
    'audit.action.logout': "\u9000\u51FA\u767B\u5F55",
    'audit.action.retention': "\u4FEE\u6539\u8FC7\u671F\u4FDD\u7559\u5929\u6570",
    'audit.action.uploadPolicy': "\u4FEE\u6539\u6BCF\u5468\u4E0A\u4F20\u6B21\u6570",
    'audit.action.unblock': "\u624B\u52A8\u89E3\u5C01 IP",
    'audit.action.cleanup': "\u6267\u884C\u8FC7\u671F\u6E05\u7406",
    'audit.action.export': "\u5BFC\u51FA\u5BA1\u8BA1\u65E5\u5FD7",
    'audit.action.ban': "\u89E6\u53D1\u81EA\u52A8\u5C01\u7981",
    'audit.action.delete': "\u5220\u9664\u5206\u4EAB",
    'audit.action.note': "\u4FEE\u6539\u8BBF\u5BA2\u5907\u6CE8",
    'audit.action.viewSource': "\u67E5\u770B\u6765\u6E90\u8BE6\u60C5",
    'audit.action.download': "\u4E0B\u8F7D\u6587\u4EF6",
    'audit.action.preview': '\u9884\u89C8\u6587\u4EF6',
    'preview.title': '\u5185\u5BB9\u9884\u89C8',
    'preview.partial': '\u90E8\u5206\u5185\u5BB9',
    'preview.complete': '\u5B8C\u6574\u5185\u5BB9',
    'preview.type': '\u6B64\u7C7B\u578B\u6682\u4E0D\u652F\u6301\u5728\u7EBF\u9884\u89C8',
    'preview.size': '\u56FE\u7247\u8D85\u8FC7 2 MiB\uFF0C\u8BF7\u4E0B\u8F7D\u67E5\u770B',
    'preview.encoding': '\u975E UTF-8 \u6587\u672C\u6216\u4E8C\u8FDB\u5236\u5185\u5BB9\uFF0C\u8BF7\u4E0B\u8F7D\u67E5\u770B',
    'preview.image': '\u56FE\u7247\u65E0\u6CD5\u9884\u89C8\u6216\u5C3A\u5BF8\u8D85\u9650\uFF0C\u8BF7\u4E0B\u8F7D\u67E5\u770B',
    'preview.empty': '\u7A7A\u6587\u4EF6',
    'preview.timeout': '\u9884\u89C8\u52A0\u8F7D\u8D85\u65F6',
    'audit.actor.admin': "\u7BA1\u7406\u5458",
    'audit.actor.token': "\u5B9A\u65F6\u5668 / \u4EE4\u724C",
    'audit.actor.anonymous': "\u672A\u8BA4\u8BC1",
    'audit.detail.bannedUntil': "\u5C01\u7981\u622A\u6B62",
    'audit.detail.expiredRetentionDays': "\u8FC7\u671F\u4FDD\u7559\u5929\u6570",
    'audit.detail.weeklyFileLimit': "\u6BCF\u5468\u4E0A\u4F20\u6B21\u6570",
    'audit.detail.notePresent': "\u8BBE\u7F6E\u5907\u6CE8",
    'audit.detail.alreadyDeleted': "\u5206\u4EAB\u5DF2\u4E0D\u5B58\u5728",
    'audit.detail.deletedShares': "\u5DF2\u6E05\u7406\u5206\u4EAB",
    'audit.detail.abortedSessions': "\u5DF2\u53D6\u6D88\u4E0A\u4F20\u4F1A\u8BDD",

    'ad.loginProtection': "\u767B\u5F55\u9632\u62A4",
    'ad.guardRule': "{0} \u5206\u949F\u5185\u5931\u8D25 {1} \u6B21\uFF0C\u5C01\u7981\u767B\u5F55 {2} \u5206\u949F",
    'ad.guardDisabled': "\u672A\u542F\u7528\uFF1A\u9700\u7ED1\u5B9A R2 \u6216 D1",
    'ad.guardEmpty': "\u5F53\u524D\u6CA1\u6709\u5C01\u7981 IP",
    'ad.guardUnknown': "\u672A\u77E5\u6765\u6E90\uFF08\u5171\u7528\u9650\u5236\uFF09",
    'ad.guardFailures': "\u5931\u8D25 {0} \u6B21",
    'ad.guardUntil': "\u89E3\u5C01\u4E8E {0}",
    'ad.guardLast': "\u6700\u8FD1\u5931\u8D25 {0}",
    'ad.guardUnblock': "\u89E3\u5C01",
    'ad.guardUnblocked': "\u5DF2\u89E3\u5C01",
    'ad.loginBlocked': "\u767B\u5F55\u5931\u8D25\u6B21\u6570\u8FC7\u591A\uFF0C\u8BF7\u7B49\u5F85\u5C01\u7981\u5230\u671F\u540E\u91CD\u8BD5",
    'ad.guardUnavailable': "\u767B\u5F55\u9632\u62A4\u6682\u4E0D\u53EF\u7528\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5",

    'ad.formatUnknown': "\u683C\u5F0F\u672A\u77E5",
    'ad.format.archive': "\u538B\u7F29\u5305",
    'ad.format.program': "\u5E94\u7528\u7A0B\u5E8F",
    'ad.format.document': "\u6587\u6863",
    'ad.format.image': "\u56FE\u7247",
    'ad.format.video': "\u89C6\u9891",
    'ad.format.audio': "\u97F3\u9891",
    'ad.format.text': "\u6587\u672C / \u4EE3\u7801",
    'ad.format.file': "\u6587\u4EF6",
    'ad.uploader': "\u4E0A\u4F20\u8005",
    'ad.shareState': "\u5206\u4EAB\u72B6\u6001",
    'ad.fileAvailability': "\u6587\u4EF6\u72B6\u6001",
    'ad.fileState.available': "\u53EF\u4E0B\u8F7D",
    'ad.fileState.missing': "\u6587\u4EF6\u4E0D\u5B58\u5728",
    'ad.fileState.unknown': "\u6682\u65F6\u65E0\u6CD5\u786E\u8BA4",
    'ad.timeLeft': "\u5269\u4F59 {0}",
    'ad.timeExpired': "\u5DF2\u8FC7\u671F {0}",
    'ad.cleanupPermanent': "\u4E0D\u81EA\u52A8\u6E05\u7406",
    'ad.cleanupActive': "\u8FC7\u671F\u540E\u4FDD\u7559 {0} \u5929",
    'ad.cleanupRetained': "\u8FC7\u671F\u4FDD\u7559\u4E2D",
    'ad.cleanupPending': "\u7B49\u5F85\u6E05\u7406\u4EFB\u52A1",
    'ad.technical': "\u6280\u672F\u4FE1\u606F",
    'ad.storedSize': "\u5B58\u50A8\u5927\u5C0F",
    'ad.storedAt': "\u5165\u5E93\u65F6\u95F4",
    'ad.exactBytes': "{0} \u5B57\u8282",
    'ad.formatHint': "\u683C\u5F0F\u6309\u6587\u4EF6\u540D\u8BC6\u522B\uFF0C\u4E0D\u4EE3\u8868\u5185\u5BB9\u6821\u9A8C\u3002",
    'ad.tryDownload': "\u5C1D\u8BD5\u4E0B\u8F7D",
    'ad.guestLimits': "\u672A\u5907\u6CE8\u8BBF\u5BA2\u9650\u5236",
    'ad.weeklyFiles': "\u6BCF\u5468\u6587\u4EF6\u6570",
    'ad.guestRules': "\u5317\u4EAC\u65F6\u95F4\u5468\u4E00\u91CD\u7F6E\uFF1B\u5DF2\u63A5\u7EB3\u4E0A\u4F20\u8BA1\u6B21\uFF0C\u53D6\u6D88\u4E0D\u9000\u56DE\u3002\u672A\u5907\u6CE8\u8BBF\u5BA2\u4E0D\u80FD\u6C38\u4E45\u5206\u4EAB\u6216\u4E0D\u9650\u6B21\u53D6\u4EF6\u3002",
    'ad.guestSaved': "\u5DF2\u4FDD\u5B58\uFF0C\u5C06\u7528\u4E8E\u540E\u7EED\u4E0A\u4F20",
    'policy.expiry': "1 ~ 30 \u5929",
    'policy.pickups': "1 \u6B21 \xB7 5 \u6B21",
    'policy.remaining': "\u672C\u5468\u5269\u4F59 {0} / {1} \u4E2A\u6587\u4EF6 \xB7 {2} \u91CD\u7F6E",
    'policy.unavailable': "\u6B63\u5728\u8BFB\u53D6\u4E0A\u4F20\u6743\u9650\uFF1B\u82E5\u957F\u65F6\u95F4\u672A\u6062\u590D\uFF0C\u8BF7\u5237\u65B0\u9875\u9762",
    'policy.contact': "\u6682\u4E0D\u63A5\u53D7\u6587\u4EF6\u4E0A\u4F20\uFF0C\u8BF7\u8054\u7CFB\u7BA1\u7406\u5458",
    'ad.fileDetails': '\u6587\u4EF6\u8BE6\u60C5',
    'ad.filename': '\u6587\u4EF6\u540D',
    'ad.fileType': '\u6587\u4EF6\u7C7B\u578B',
    'ad.cleanupAfter': '\u6700\u65E9\u6E05\u7406',
    'ad.retentionDays': '\u8FC7\u671F\u540E\u4FDD\u7559',
    'ad.days': '\u5929',
    'ad.save': '\u4FDD\u5B58',
    'ad.retry': '\u91CD\u8BD5',
    'ad.settingsSaved': '\u5DF2\u4FDD\u5B58\uFF0C\u5C06\u7528\u4E8E\u540E\u7EED\u6E05\u7406',
    'ad.source': '\u4E0A\u4F20\u6765\u6E90',
    'ad.visitor': '\u8BBF\u5BA2 {0}',
    'ad.visitorId': '\u8BBF\u5BA2\u6807\u8BC6',
    'ad.sourceUnknown': '\u672A\u77E5',
    'ad.sourceUnrecorded': '\u672A\u8BB0\u5F55',
    'ad.sourceLocation': '\u51FA\u53E3\u5C5E\u5730',
    'ad.sourceTime': '\u8BB0\u5F55\u65F6\u95F4',
    'ad.sourceNote': '\u7BA1\u7406\u5458\u5907\u6CE8',
    'ad.sourceSave': '\u4FDD\u5B58\u5907\u6CE8',
    'ad.sourceClose': '\u5173\u95ED',
    'ad.sourceSaved': '\u5907\u6CE8\u5DF2\u4FDD\u5B58',
    'err.capacity': '\u5BB9\u91CF\u8D85\u51FA\u514D\u8D39\u989D\u5EA6',
    'err.capacityRemaining': '\u5BB9\u91CF\u8D85\u51FA\u514D\u8D39\u989D\u5EA6\uFF0C\u5269\u4F59\u53EF\u7528\u7A7A\u95F4\u7EA6 {0} GB\uFF08{1} \u5B57\u8282\uFF09\u3002',
    'doc.send': '\u6587\u4EF6\u4E2D\u8F6C\u7AD9 - \u53D1\u9001',
    'doc.pickup': '\u6587\u4EF6\u4E2D\u8F6C\u7AD9 - \u53D6\u4EF6',
    'doc.admin': '\u6587\u4EF6\u4E2D\u8F6C\u7AD9 - \u7BA1\u7406',
    'doc.404': '404 - \u6587\u4EF6\u4E2D\u8F6C\u7AD9',

    'brand.name': '\u6587\u4EF6\u4E2D\u8F6C\u7AD9',
    'brand.tagline': '\u50CF\u53D6\u5FEB\u9012\u4E00\u6837\u53D6\u6587\u4EF6',
    'brand.pickup': '\u53D6\u4EF6',
    'brand.admin': '\u7BA1\u7406\u540E\u53F0',
    'nav.pickup': '\u53D6\u4EF6',
    'nav.send': '\u53D1\u9001',
    'nav.theme': '\u5207\u6362\u4E3B\u9898',
    'nav.lang': '\u5207\u6362\u8BED\u8A00',
    'foot': [
      '\u89C1\u5B57\u5982\u9762',
      '\u7EB8\u77ED\u60C5\u957F',
      '\u5C71\u9AD8\u6C34\u957F,\u540E\u4F1A\u6709\u671F',
      '\u6B64\u4EF6\u5DF2\u7B7E\u6536,\u671B\u73CD\u91CD',
      '\u98CE\u91CC\u96E8\u91CC,\u4E2D\u8F6C\u7AD9\u7B49\u4F60',
      '\u6162\u4E00\u70B9,\u4E5F\u6CA1\u5173\u7CFB',
    ],

    'tab.file': '\u53D1\u6587\u4EF6',
    'tab.text': '\u53D1\u6587\u672C',
    'dz.click': '\u70B9\u51FB\u9009\u62E9\u6587\u4EF6',
    'dz.drop': ',\u6216\u62D6\u62FD / \u7C98\u8D34\u5230\u6B64\u5904',
    'dz.aria': '\u9009\u62E9\u6587\u4EF6',
    'dz.hint': '\u4E0A\u4F20\u540E\u751F\u6210 6 \u4F4D\u53D6\u4EF6\u53E3\u4EE4',
    'dz.hintMax': '\u5355\u4E2A\u6587\u4EF6\u6700\u5927 {0} \xB7 \u652F\u6301\u591A\u9009,\u4E0A\u4F20\u540E\u751F\u6210\u53D6\u4EF6\u53E3\u4EE4',
    'remove': '\u79FB\u9664',
    'text.placeholder': '\u7C98\u8D34\u6216\u8F93\u5165\u8981\u5206\u4EAB\u7684\u6587\u672C\u2026',
    'opt.expiry': '\u6709\u6548\u671F',
    'opt.pickups': '\u53EF\u53D6\u6B21\u6570',
    'seg.1d': '1 \u5929', 'seg.7d': '7 \u5929', 'seg.30d': '30 \u5929', 'seg.forever': '\u6C38\u4E45',
    'seg.p1': '1 \u6B21', 'seg.p5': '5 \u6B21', 'seg.punlimited': '\u4E0D\u9650',
    'btn.upload': '\u5F00\u59CB\u4E0A\u4F20',
    'btn.genCode': '\u751F\u6210\u53E3\u4EE4',
    'btn.cancel': '\u53D6\u6D88',
    'btn.copyCode': '\u590D\u5236\u53E3\u4EE4',
    'btn.copyLink': '\u590D\u5236\u94FE\u63A5',
    'btn.copyAll': '\u590D\u5236\u5168\u90E8\u53E3\u4EE4',
    'btn.again': '\u518D\u6765\u4E00\u4E2A',

    'prog.preparing': '\u51C6\u5907\u4E2D\u2026',
    'prog.uploading': '\u4E0A\u4F20\u4E2D\u2026',
    'prog.init': '\u6B63\u5728\u68C0\u67E5\u53EF\u7528\u7A7A\u95F4\u2026',
    'prog.merging': '\u6B63\u5728\u5B8C\u6210\u4E0A\u4F20\u2026',
    'prog.file': '\u7B2C {0}/{1} \u4E2A',
    'prog.part': '\u7B2C {0}/{1} \u7247',
    'prog.eta': '\u5269\u4F59 {0}',
    'prog.retry': '\u4E0A\u4F20\u5931\u8D25,\u91CD\u8BD5 {0}/3\u2026',

    'result.ok': '\u2705 \u5206\u4EAB\u6210\u529F,\u628A\u53E3\u4EE4\u53D1\u7ED9\u5BF9\u65B9',
    'result.okBatch': '\u2705 {0} \u4E2A\u6587\u4EF6\u5206\u4EAB\u6210\u529F',
    'ticket.title': '\u53D6\u4EF6\u51ED\u8BC1',
    'ticket.no': '\u2116 {0}',
    'send.cap': '\u5206\u4EAB\u5185\u5BB9',
    'receipt.cap': '\u5206\u4EAB\u7ED3\u679C',
    'ph.title': '\u7B49\u5F85\u5206\u4EAB',
    'ph.sub': '\u5206\u4EAB\u6210\u529F\u540E\uFF0C\u5728\u8FD9\u91CC\u590D\u5236\u53E3\u4EE4\u6216\u94FE\u63A5',

    'flow.dropT': '\u5BC4\u4EF6',
    'flow.dropS': '\u9009\u62E9\u6587\u4EF6\u6216\u8F93\u5165\u6587\u672C',
    'flow.tickT': '\u5206\u4EAB\u53E3\u4EE4',
    'flow.tickS': '\u751F\u6210 6 \u4F4D\u53D6\u4EF6\u53E3\u4EE4',
    'flow.pickT': '\u53D6\u4EF6',
    'flow.pickS': '\u8F93\u5165\u53E3\u4EE4\u5373\u53EF\u4E0B\u8F7D\u6216\u67E5\u770B',

    'route.senderT': '\u5BC4\u4EF6\u4EBA \xB7 \u4F60',
    'route.senderS': '\u9009\u62E9\u5185\u5BB9\uFF0C\u8BBE\u7F6E\u6709\u6548\u671F\u548C\u53EF\u53D6\u6B21\u6570',
    'route.relayT': '\u751F\u6210\u5206\u4EAB',
    'route.relayS': '\u628A\u53D6\u4EF6\u53E3\u4EE4\u6216\u94FE\u63A5\u53D1\u7ED9\u5BF9\u65B9',
    'route.takerT': '\u53D6\u4EF6\u4EBA \xB7 \u5BF9\u65B9',
    'route.takerS': '\u8F93\u5165\u53E3\u4EE4\u6216\u6253\u5F00\u94FE\u63A5\uFF0C\u5373\u53EF\u53D6\u4EF6',
    'route.fine': '\u53E3\u4EE4\u8BF7\u59A5\u5584\u4FDD\u7BA1\uFF0C\u4EC5\u5206\u4EAB\u7ED9\u9700\u8981\u7684\u4EBA',

    'feat.splitT': '\u6587\u4EF6\u5206\u4EAB', 'feat.splitS': '\u5355\u6587\u4EF6\u6700\u5927 {0}',
    'feat.ttlT': '\u81EA\u9009\u6709\u6548\u671F', 'feat.ttlS': '1 ~ 30 \u5929\u6216\u6C38\u4E45',
    'feat.limitT': '\u9650\u6B21\u53D6\u4EF6', 'feat.limitS': '1 \u6B21 \xB7 5 \u6B21 \xB7 \u4E0D\u9650',
    'feat.selfT': '\u4FBF\u6377\u53D6\u4EF6', 'feat.selfS': '\u652F\u6301\u53E3\u4EE4\u3001\u94FE\u63A5\u548C\u626B\u7801\u53D6\u4EF6',
    'qr.hint': '\u626B\u7801\u76F4\u63A5\u53D6\u4EF6',
    'label.code': '\u53E3\u4EE4',
    'label.link': '\u94FE\u63A5',
    'copied': '{0}\u5DF2\u590D\u5236',
    'copy.fail': '\u590D\u5236\u5931\u8D25,\u8BF7\u624B\u52A8\u590D\u5236',
    'copied.btn': '\u2713 \u5DF2\u590D\u5236',

    'meta.after': '{0}\u540E\u8FC7\u671F({1})',
    'meta.forever': '\u6C38\u4E45\u6709\u6548',
    'meta.pickups': '\u53EF\u53D6 {0} \u6B21',
    'meta.unlimited': '\u53D6\u4EF6\u6B21\u6570\u4E0D\u9650',
    'files.count': '{0} \u4E2A\u6587\u4EF6 \xB7 \u5171 {1}',
    'unknown.type': '\u672A\u77E5\u7C7B\u578B',
    'text.counter': '{0} / {1}',

    'err.oversize': '\u6587\u4EF6\u8D85\u8FC7 {0} \u4E0A\u9650({1})',
    'err.empty': '\u7A7A\u6587\u4EF6\u4E0D\u80FD\u5206\u4EAB',
    'err.tooMany': '\u4E00\u6B21\u6700\u591A\u5206\u4EAB {0} \u4E2A\u6587\u4EF6',
    'err.upload': '\u4E0A\u4F20\u5931\u8D25,\u8BF7\u91CD\u8BD5',
    'err.submit': '\u63D0\u4EA4\u5931\u8D25',
    'req.fail': '\u8BF7\u6C42\u5931\u8D25 ({0})',
    'toast.cancelled': '\u5DF2\u53D6\u6D88\u4E0A\u4F20',

    'dur.s': '{0} \u79D2',
    'dur.ms': '<1 \u79D2',
    'dur.hm': '{0} \u5206 {1} \u79D2',
    'dur.h': '{0} \u5206',
    'dur.hH': '{0} \u65F6 {1} \u5206',
    'dur.hH2': '{0} \u65F6',
    'dur.d': '{0} \u5929',

    'pk.title': '\u8F93\u5165\u53D6\u4EF6\u53E3\u4EE4',
    'pk.sub': '\u8F93\u5165 6 \u4F4D\u6570\u5B57\u53E3\u4EE4,\u53D6\u51FA\u5206\u4EAB\u7684\u6587\u4EF6\u6216\u6587\u672C',
    'pk.aria': '6 \u4F4D\u53D6\u4EF6\u53E3\u4EE4',
    'pk.fail': '\u53D6\u4EF6\u5931\u8D25',
    'pk.textChars': '\u6587\u672C \xB7 {0} \u5B57\u7B26',
    'pk.copyAllText': '\u4E00\u952E\u590D\u5236\u5168\u6587',
    'pk.download': '\u2B07 \u4E0B\u8F7D\u6587\u4EF6',
    'pk.again': '\u91CD\u65B0\u8F93\u5165',
    'pk.expireAt': '{0} \u8FC7\u671F',
    'pk.left': '\u5269\u4F59\u53EF\u53D6 {0} \u6B21',
    'pk.unnamed': '\u672A\u547D\u540D\u6587\u4EF6',
    'copied.text': '\u5DF2\u590D\u5236\u5168\u6587',

    'ad.loginTitle': '\u7BA1\u7406\u767B\u5F55',
    'ad.loginSub': '\u4F7F\u7528\u7BA1\u7406\u4EE4\u724C\u767B\u5F55',
    'ad.tokenPh': '\u7BA1\u7406\u4EE4\u724C',
    'ad.login': '\u767B\u5F55',
    'ad.badToken': '\u4EE4\u724C\u65E0\u6548',
    'ad.total': '\u5206\u4EAB\u603B\u6570',
    'ad.active': '\u5F53\u524D\u6709\u6548',
    'ad.files': '\u6587\u4EF6',
    'ad.texts': '\u6587\u672C',
    'ad.storage': '\u5B58\u50A8\u7A7A\u95F4 \xB7 \u5DF2\u7528 / \u603B\u5BB9\u91CF',
    'ad.storageReserved': '\u542B\u4E0A\u4F20\u9884\u7559\u7A7A\u95F4',
    'ad.storageUnavailable': '\u6682\u4E0D\u53EF\u7528',
    'ad.shareBytes': '\u5206\u4EAB\u5185\u5BB9\u5927\u5C0F',
    'ad.today': '\u4ECA\u65E5\u65B0\u589E',
    'ad.th.code': '\u53E3\u4EE4', 'ad.th.kind': '\u7C7B\u578B', 'ad.th.content': '\u5185\u5BB9',
    'ad.th.size': '\u5927\u5C0F', 'ad.th.pickups': '\u5DF2\u53D6/\u4E0A\u9650', 'ad.th.expire': '\u8FC7\u671F\u65F6\u95F4',
    'ad.th.status': '\u72B6\u6001', 'ad.th.created': '\u521B\u5EFA\u65F6\u95F4',
    'ad.kind.file': '\u6587\u4EF6', 'ad.kind.text': '\u6587\u672C',
    'ad.st.active': '\u6709\u6548', 'ad.st.expired': '\u5DF2\u8FC7\u671F', 'ad.st.exhausted': '\u5DF2\u53D6\u5B8C',
    'ad.loading': '\u52A0\u8F7D\u4E2D\u2026',
    'ad.empty': '\u6682\u65E0\u5206\u4EAB',
    'ad.loadFail': '\u52A0\u8F7D\u5931\u8D25',
    'ad.page': '\u7B2C {0} / {1} \u9875 \xB7 \u5171 {2} \u6761',
    'ad.prev': '\u4E0A\u4E00\u9875', 'ad.next': '\u4E0B\u4E00\u9875',
    'ad.refresh': '\u21BB \u5237\u65B0',
    'ad.logout': '\u9000\u51FA\u767B\u5F55',
    'ad.download': '\u4E0B\u8F7D',
    'ad.delete': '\u5220\u9664',
    'ad.deleted': '\u5DF2\u5220\u9664',
    'ad.deleteFail': '\u5220\u9664\u5931\u8D25',
    'ad.delTitle': '\u4F5C\u5E9F\u8FD9\u5F20\u53D6\u4EF6\u51ED\u8BC1?',
    'ad.delWarn': '\u4F5C\u5E9F\u540E\u53E3\u4EE4\u7ACB\u5373\u5931\u6548,\u5BF9\u65B9\u5C06\u65E0\u6CD5\u53D6\u4EF6,\u4E14\u4E0D\u53EF\u6062\u590D\u3002',
    'ad.delOk': '\u786E\u8BA4\u4F5C\u5E9F',
    'ad.textFallback': '(\u6587\u672C)',
    'ad.unnamed': '(\u672A\u547D\u540D)',
    'ad.chars': '{0} \u5B57',
    'ad.forever': '\u6C38\u4E45',

    'nf.title': '\u9875\u9762\u4E0D\u5B58\u5728',
    'nf.body': '\u4F60\u8981\u627E\u7684\u9875\u9762\u4E0D\u5728\u4E2D\u8F6C\u7AD9\u91CC',
    'nf.send': '\u53BB\u53D1\u9001',
    'nf.pickup': '\u53BB\u53D6\u4EF6',
  },

  en: {
    "audit.action.apiAuth": "API authentication",
    "audit.action.apiList": "API list shares",
    "audit.action.apiRead": "API read share",
    "audit.action.apiEdit": "API edit share",
    "audit.action.apiDelete": "API delete share",
    "audit.action.apiDownload": "API download",
    "audit.detail.changedFields": "Changed fields",
    "audit.value.api_disabled": "Script API not configured",
    "audit.value.unauthorized": "Missing or invalid API Token",

    "audit.upload": "Uploads",
    "audit.actor.visitor": "Visitor",
    "audit.pickup": "Pickups",
    "audit.repeat": "{0} requests combined",
    "audit.action.upload": "Upload content",
    "audit.action.uploadCancel": "Cancel upload",
    "audit.action.pickup": "View share",
    "audit.action.publicDownload": "Public download",
    "audit.action.downloadProbe": "Check download",
    "audit.action.accessBlocked": "Block access",
    "audit.action.securityRules": "Change security rules",
    "audit.detail.stage": "Stage",
    "audit.detail.reason": "Reason",
    "audit.detail.scope": "Protection scope",
    "audit.detail.kind": "Content type",
    "audit.detail.visitorId": "Visitor ID",
    "audit.detail.uploadRef": "Upload reference",
    "audit.detail.textLength": "Text length (characters)",
    "audit.detail.count": "Combined requests",
    "audit.detail.firstAt": "First occurrence",
    "audit.detail.lastAt": "Last occurrence",
    "audit.detail.action": "Rule action",
    "audit.detail.configRevision": "Configuration revision",
    "audit.value.init": "Initialize upload",
    "audit.value.direct": "Direct file upload",
    "audit.value.text": "Text",
    "audit.value.file": "File",
    "audit.value.part": "Upload part",
    "audit.value.complete": "Complete upload",
    "audit.value.abort": "Cancel upload",
    "audit.value.lookup": "View share",
    "audit.value.download": "Download file",
    "audit.value.upload": "Upload",
    "audit.value.pickup": "Pickup",
    "audit.value.rate_limit": "Rate limit exceeded",
    "audit.value.access_rule": "IP ban",
    "audit.value.region": "Region ban",
    "audit.value.service_unavailable": "Security service unavailable",
    "audit.value.not_found": "Code or upload session not found",
    "audit.value.bad_request": "Invalid parameters or parts",
    "audit.value.expired": "Share expired",
    "audit.value.exhausted": "Pickup limit reached",
    "audit.value.gone": "File missing or removed",
    "audit.value.too_large": "File exceeds size limit",
    "audit.value.capacity_exceeded": "Insufficient storage",
    "audit.value.internal": "Service processing failed",
    "audit.value.config": "Unsupported storage configuration",
    "audit.value.weekly_upload_limit": "Weekly upload quota reached",
    "audit.value.restricted_share_options": "Permanent or unlimited shares not allowed",
    "audit.value.upload_session_owner": "Upload session owner mismatch",
    "audit.value.upload_policy_changed": "Upload permission changed",
    "audit.value.upload_policy_unavailable": "Upload quota service unavailable",
    "audit.value.upload_policy_busy": "Upload quota service busy",
    "audit.value.security_unavailable": "Security service unavailable",

    "ui.footerAbout": "A simpler way to share files and words.",
    "ui.footerNav": "Footer navigation",
    "ui.publicNav": "Send and pick up",
    "ui.help": "Help",
    "ui.toPickup": "Pick up a share",
    "ui.toSend": "Send a share",
    "ui.viewShare": "View share",
    "ui.clear": "Clear",
    "ui.shareFound": "Share found",
    "ui.show": "Show",
    "ui.showToken": "Show admin token",
    "ui.backSend": "Back to send",
    'ad.codeCopied': 'Pickup code copied',
    'ad.allShares': 'All',
    'ad.activeShares': 'Active',
    'ad.expiredShares': 'Expired',
    'ad.exhaustedShares': 'Exhausted',
    'ad.searchShares': 'Search listed filename, code or visitor ID',
    'ad.searchHint': 'Filename search uses the first 40 characters shown in the list. Visitor IDs are in upload source details. Filters apply across all pages.',
    'ad.searchButton': 'Search',
    'ad.allKinds': 'All types',
    'ad.currentPageSize': 'Rows per page',
    'ad.overview': 'Shares and storage overview',
    'ad.contact': 'Contact',
    'ad.adminFooter': 'File Relay \xB7 Share with ease',
    'storage.namespace': 'Metadata storage',
    'storage.sharedQuota': 'Namespace usage / shared account allowance',
    'storage.quotaReference': 'Namespace share of the free account allowance',
    'storage.notConfigured': 'Usage not configured',
    'storage.keys': '{0} keys',
    'storage.sample': '{0} UTC',
    'storage.dailyPeak': 'Daily peak \xB7 Delayed \xB7 This namespace only',
    'storage.analyticsRequired': 'Read-only Analytics credentials required',
    "ad.editShare": "Edit share",
    "ad.editCount": "Picked up",
    "ad.editLimit": "Pickup limit",
    "ad.editUnlimited": "Unlimited",
    "ad.editSave": "Save changes",
    "ad.editCancel": "Cancel",
    "ad.editReload": "Discard changes and reload",
    "ad.editSaved": "Share updated",
    "ad.editInvalid": "Enter valid counts and an expiry time",
    "ad.editTimeChanged": "The expiry time has passed. Review the updated status and save again.",
    "ad.editCleanupPending": "This share is eligible for cleanup. Back up its content before sharing again.",
    "ad.editHint": "Dates use {0}. Past dates expire the share and affect scheduled cleanup according to the retention setting. Permanent shares still use storage.",
    "ad.editStatusHint": "Active extends expired dates by 7 days and raises an exhausted limit above the current count (or removes the limit at the count ceiling). Expired sets the expiry to now. Exhausted raises the count to its limit, assigns a limit if unlimited, and extends an expired date by 7 days. Review the changed values before saving.",
    "audit.action.editShare": "Edit share",
    'ad.textDetails': 'Text details',
    'ad.textContent': 'Content',
    'ad.textInvalid': 'Content is required, up to {0} characters',
    'ad.textDescription': 'Description',
    'ad.backText': 'Back to text',
    'audit.detail.beforeTextLength': 'Previous character count',
    'audit.detail.afterTextLength': 'New character count',
    "audit.detail.beforeRules": "Before",
    "audit.detail.afterRules": "After",

    'ad.settings': 'Settings',
    'ad.shareSettings': 'Sharing rules',
    'ad.guestWeeklyFiles': 'Unnoted guest files / week',
    'ad.displaySettings': 'List display',
    'ad.filesPageSize': 'Files per page',
    'ad.auditPageSize': 'Logs per page',
    'ad.browserSettings': 'Applied immediately, saved in this browser',
    'ad.preferenceNotSaved': 'Applied for now; this browser could not save the preference',
    'ad.filesPagination': 'File pagination',
    'ad.auditPagination': 'Log pagination',
    'context.add': 'Additional information (optional)',
    'context.name': 'Your name',
    'context.description': 'File description',
    'context.namePh': 'Your name or nickname',
    'context.descriptionPh': 'Describe the files; applies to this batch',
    'context.visibility': 'Only visible to the administrator',
    'ad.retentionTitle': 'Automatic cleanup',
    'ad.recentUploads': 'Recent uploads',
    'ad.historyScope': 'Latest 10 retained shares',
    'ad.backFile': 'Back to file',
    'ad.submittedName': 'Submitted name',
    'ad.requestIP': 'Request IP',
    'ad.network': 'Network',
    'ad.browserReported': 'Browser',
    'ad.browserHint': 'Reported by the browser; may be modified',
    'ad.noteShort': 'Note',
    'ad.copyIP': 'Copy',
    'ad.ipCopied': 'IP copied',
    'ad.copyFailed': 'Copy failed; select the text manually',
    'ad.fileDescription': 'Description',
    'audit.detail.filename': 'Filename',
    'audit.detail.sizeBytes': 'Size (bytes)',
    'audit.navigation': "Admin pages",
    'audit.files': "Files",
    'audit.title': "Audit logs",
    'audit.retention': "Last 30 days, up to 1,000 entries; times shown in your local timezone",
    'audit.export': "Export results",
    'audit.categories': "Log categories",
    'audit.all': "All logs",
    'audit.login': "Login logs",
    'audit.operation': "Operations",
    'audit.security': "Security",
    'audit.result': "Result",
    'audit.anyResult': "All results",
    'audit.success': "Success",
    'audit.failed': "Failed",
    'audit.blocked': "Blocked",
    'audit.from': "Start date",
    'audit.to': "End date",
    'audit.keyword': "IP / File / Visitor",
    'audit.search': "Search IP, pickup code, filename or visitor ID",
    'audit.filter': "Filter",
    'audit.reset': "Reset",
    'audit.time': "Time",
    'audit.action': "Action",
    'audit.actor': "Actor",
    'audit.source': "Source IP / Location",
    'audit.target': "Target",
    'audit.details': "Details",
    'audit.empty': "No matching logs. Recording starts when this feature is deployed.",
    'audit.disabled': "Audit logging is not enabled: bind R2 or D1.",
    'audit.page': "Page {0} / {1} \xB7 {2} entries",
    'audit.dateError': "Start date must not be after end date",
    'audit.http': "Request / Status",
    'audit.duration': "Processing time",
    'audit.id': "Log ID",
    'audit.agent': "Browser identifier (client supplied)",
    'audit.yes': "Yes",
    'audit.no': "No",
    'audit.description': "Description",
    'audit.downloadHint': "The file stream was opened; this does not confirm the browser finished downloading.",
    'audit.writeFailed': "The operation was processed, but its audit record could not be saved. Check log storage.",
    'audit.action.login': "Admin login",
    'audit.action.logout': "Log out",
    'audit.action.retention': "Change expired retention",
    'audit.action.uploadPolicy': "Change weekly upload quota",
    'audit.action.unblock': "Unblock IP",
    'audit.action.cleanup': "Run expired cleanup",
    'audit.action.export': "Export audit logs",
    'audit.action.ban': "Trigger automatic ban",
    'audit.action.delete': "Delete share",
    'audit.action.note': "Change visitor note",
    'audit.action.viewSource': "View source details",
    'audit.action.download': "Download file",
    'audit.action.preview': 'Preview file',
    'preview.title': 'Content preview',
    'preview.partial': 'Partial content',
    'preview.complete': 'Complete content',
    'preview.type': 'Preview is unavailable for this file type',
    'preview.size': 'Image exceeds 2 MiB. Download to view.',
    'preview.encoding': 'Not UTF-8 text or contains binary data. Download to view.',
    'preview.image': 'Image cannot be previewed or dimensions exceed the limit. Download to view.',
    'preview.empty': 'Empty file',
    'preview.timeout': 'Preview timed out',
    'audit.actor.admin': "Administrator",
    'audit.actor.token': "Scheduler / Token",
    'audit.actor.anonymous': "Unauthenticated",
    'audit.detail.bannedUntil': "Blocked until",
    'audit.detail.expiredRetentionDays': "Expired retention days",
    'audit.detail.weeklyFileLimit': "Weekly upload limit",
    'audit.detail.notePresent': "Note set",
    'audit.detail.alreadyDeleted': "Share already absent",
    'audit.detail.deletedShares': "Shares deleted",
    'audit.detail.abortedSessions': "Upload sessions aborted",

    'ad.loginProtection': "Login protection",
    'ad.guardRule': "{1} failures in {0} minutes block login for {2} minutes",
    'ad.guardDisabled': "Not enabled: bind R2 or D1",
    'ad.guardEmpty': "No blocked IPs",
    'ad.guardUnknown': "Unknown source (shared limit)",
    'ad.guardFailures': "{0} failures",
    'ad.guardUntil': "Unblocks at {0}",
    'ad.guardLast': "Last failure {0}",
    'ad.guardUnblock': "Unblock",
    'ad.guardUnblocked': "IP unblocked",
    'ad.loginBlocked': "Too many failed logins. Wait until the block expires.",
    'ad.guardUnavailable': "Login protection unavailable. Please try again later.",

    'ad.formatUnknown': "Unknown format",
    'ad.format.archive': "Archive",
    'ad.format.program': "Application",
    'ad.format.document': "Document",
    'ad.format.image': "Image",
    'ad.format.video': "Video",
    'ad.format.audio': "Audio",
    'ad.format.text': "Text / code",
    'ad.format.file': "File",
    'ad.uploader': "Uploaded by",
    'ad.shareState': "Share status",
    'ad.fileAvailability': "File status",
    'ad.fileState.available': "Available",
    'ad.fileState.missing': "File missing",
    'ad.fileState.unknown': "Unable to verify",
    'ad.timeLeft': "{0} left",
    'ad.timeExpired': "Expired {0} ago",
    'ad.cleanupPermanent': "No automatic cleanup",
    'ad.cleanupActive': "Kept for {0} days after expiry",
    'ad.cleanupRetained': "Retained after expiry",
    'ad.cleanupPending': "Awaiting cleanup",
    'ad.technical': "Technical details",
    'ad.storedSize': "Stored size",
    'ad.storedAt': "Stored at",
    'ad.exactBytes': "{0} bytes",
    'ad.formatHint': "Format is inferred from the filename; content has not been verified.",
    'ad.tryDownload': "Try download",
    'ad.guestLimits': "Unnoted visitor limits",
    'ad.weeklyFiles': "Files per week",
    'ad.guestRules': "Resets Monday, Beijing time. Accepted uploads count even if cancelled. Unnoted visitors cannot create permanent or unlimited-pickup shares.",
    'ad.guestSaved': "Saved for subsequent uploads",
    'policy.expiry': "1 to 30 days",
    'policy.pickups': "1 or 5 pickups",
    'policy.remaining': "{0} / {1} files left this week \xB7 resets {2}",
    'policy.unavailable': "Loading upload permissions. Refresh if this persists.",
    'policy.contact': "File uploads are unavailable. Contact the administrator.",
    'ad.fileDetails': 'File details',
    'ad.filename': 'Filename',
    'ad.fileType': 'File type',
    'ad.cleanupAfter': 'Cleanup after',
    'ad.retentionDays': 'Keep after expiry',
    'ad.days': 'days',
    'ad.save': 'Save',
    'ad.retry': 'Retry',
    'ad.settingsSaved': 'Saved for subsequent cleanup runs',
    'ad.source': 'Upload source',
    'ad.visitor': 'Visitor {0}',
    'ad.visitorId': 'Visitor ID',
    'ad.sourceUnknown': 'Unknown',
    'ad.sourceUnrecorded': 'Not recorded',
    'ad.sourceLocation': 'Exit location',
    'ad.sourceTime': 'Recorded at',
    'ad.sourceNote': 'Admin note',
    'ad.sourceSave': 'Save note',
    'ad.sourceClose': 'Close',
    'ad.sourceSaved': 'Note saved',
    'err.capacity': 'Storage capacity exceeds the free quota.',
    'err.capacityRemaining': 'Storage capacity exceeds the free quota. Available space: approximately {0} GB ({1} bytes).',
    'doc.send': 'file-relay - Send',
    'doc.pickup': 'file-relay - Pickup',
    'doc.admin': 'file-relay - Admin',
    'doc.404': '404 - file-relay',

    'brand.name': 'file-relay',
    'brand.tagline': 'Files, picked up like parcels',
    'brand.pickup': 'Pickup',
    'brand.admin': 'Admin',
    'nav.pickup': 'Pick up',
    'nav.send': 'Send',
    'nav.theme': 'Toggle theme',
    'nav.lang': 'Switch language',
    'foot': [
      'Yours, from afar',
      'Words run short, feelings run long',
      'See you down the road',
      'Signed, sealed, delivered',
      'Through wind and rain, the relay waits',
      'Take care, until next time',
    ],

    'tab.file': 'Send file',
    'tab.text': 'Send text',
    'dz.click': 'Click to choose files',
    'dz.drop': ', or drag & drop / paste here',
    'dz.aria': 'Choose files',
    'dz.hint': 'A 6-digit pickup code is generated after upload',
    'dz.hintMax': 'Up to {0} per file \xB7 multiple selection supported',
    'remove': 'Remove',
    'text.placeholder': 'Paste or type the text to share\u2026',
    'opt.expiry': 'Expires',
    'opt.pickups': 'Pickup limit',
    'seg.1d': '1 day', 'seg.7d': '7 days', 'seg.30d': '30 days', 'seg.forever': 'Forever',
    'seg.p1': '1\xD7', 'seg.p5': '5\xD7', 'seg.punlimited': 'Unlimited',
    'btn.upload': 'Start upload',
    'btn.genCode': 'Generate code',
    'btn.cancel': 'Cancel',
    'btn.copyCode': 'Copy code',
    'btn.copyLink': 'Copy link',
    'btn.copyAll': 'Copy all codes',
    'btn.again': 'New share',

    'prog.preparing': 'Preparing\u2026',
    'prog.uploading': 'Uploading\u2026',
    'prog.init': 'Checking available space\u2026',
    'prog.merging': 'Finishing upload\u2026',
    'prog.file': 'file {0}/{1}',
    'prog.part': 'part {0}/{1}',
    'prog.eta': 'ETA {0}',
    'prog.retry': 'Upload failed, retrying {0}/3\u2026',

    'result.ok': '\u2705 Shared! Send the code to the recipient',
    'result.okBatch': '\u2705 {0} files shared successfully',
    'ticket.title': 'PICKUP TICKET',
    'ticket.no': '\u2116 {0}',
    'send.cap': 'SHARE CONTENT',
    'receipt.cap': 'SHARE RESULTS',
    'ph.title': 'READY TO SHARE',
    'ph.sub': 'Copy your pickup code or link here after sharing',

    'flow.dropT': 'Send',
    'flow.dropS': 'Choose files or enter text',
    'flow.tickT': 'Ticket',
    'flow.tickS': 'A 6-digit pickup code is issued',
    'flow.pickT': 'Pick up',
    'flow.pickS': 'The recipient claims it with the code',

    'route.senderT': 'Sender \xB7 you',
    'route.senderS': 'Choose content, expiry and pickup limit',
    'route.relayT': 'Create a share',
    'route.relayS': 'Send the pickup code or link to the recipient',
    'route.takerT': 'Recipient',
    'route.takerS': 'Enter the code or open the link to pick up',
    'route.fine': 'Keep the code private; share only with your recipients',

    'feat.splitT': 'File sharing', 'feat.splitS': 'Up to {0} per file',
    'feat.ttlT': 'You set the clock', 'feat.ttlS': '1-30 days, or forever',
    'feat.limitT': 'Limited pickups', 'feat.limitS': '1\xD7 \xB7 5\xD7 \xB7 unlimited',
    'feat.selfT': 'Easy pickup', 'feat.selfS': 'Use a code, link or QR code',
    'qr.hint': 'Scan to pick up',
    'label.code': 'code',
    'label.link': 'link',
    'copied': '{0} copied',
    'copy.fail': 'Copy failed, please copy manually',
    'copied.btn': '\u2713 Copied',

    'meta.after': 'Expires in {0} ({1})',
    'meta.forever': 'Never expires',
    'meta.pickups': '{0} pickups allowed',
    'meta.unlimited': 'Unlimited pickups',
    'files.count': '{0} files \xB7 {1} total',
    'unknown.type': 'unknown type',
    'text.counter': '{0} / {1}',

    'err.oversize': 'File exceeds the {0} limit ({1})',
    'err.empty': 'Empty files cannot be shared',
    'err.tooMany': 'Up to {0} files per batch',
    'err.upload': 'Upload failed, please retry',
    'err.submit': 'Submission failed',
    'req.fail': 'Request failed ({0})',
    'toast.cancelled': 'Upload cancelled',

    'dur.s': '{0}s',
    'dur.ms': '<1s',
    'dur.hm': '{0}m {1}s',
    'dur.h': '{0}m',
    'dur.hH': '{0}h {1}m',
    'dur.hH2': '{0}h',
    'dur.d': '{0}d',

    'pk.title': 'Enter pickup code',
    'pk.sub': 'Enter the 6-digit code to retrieve the shared file or text',
    'pk.aria': '6-digit pickup code',
    'pk.fail': 'Pickup failed',
    'pk.textChars': 'Text \xB7 {0} chars',
    'pk.copyAllText': 'Copy all text',
    'pk.download': '\u2B07 Download file',
    'pk.again': 'Try another code',
    'pk.expireAt': 'Expires {0}',
    'pk.left': '{0} pickups left',
    'pk.unnamed': 'Untitled file',
    'copied.text': 'Full text copied',

    'ad.loginTitle': 'Admin login',
    'ad.loginSub': 'Sign in with your admin token',
    'ad.tokenPh': 'Admin token',
    'ad.login': 'Log in',
    'ad.badToken': 'Invalid token',
    'ad.total': 'Total shares',
    'ad.active': 'Active',
    'ad.files': 'Files',
    'ad.texts': 'Texts',
    'ad.storage': 'Storage \xB7 used / capacity',
    'ad.storageReserved': 'Includes upload reservations',
    'ad.storageUnavailable': 'Unavailable',
    'ad.shareBytes': 'Shared content size',
    'ad.today': 'New today',
    'ad.th.code': 'Code', 'ad.th.kind': 'Type', 'ad.th.content': 'Content',
    'ad.th.size': 'Size', 'ad.th.pickups': 'Picked/Limit', 'ad.th.expire': 'Expires',
    'ad.th.status': 'Status', 'ad.th.created': 'Created',
    'ad.kind.file': 'File', 'ad.kind.text': 'Text',
    'ad.st.active': 'Active', 'ad.st.expired': 'Expired', 'ad.st.exhausted': 'Exhausted',
    'ad.loading': 'Loading\u2026',
    'ad.empty': 'No shares yet',
    'ad.loadFail': 'Failed to load',
    'ad.page': 'Page {0} / {1} \xB7 {2} total',
    'ad.prev': 'Prev', 'ad.next': 'Next',
    'ad.refresh': '\u21BB Refresh',
    'ad.logout': 'Log out',
    'ad.download': 'Download',
    'ad.delete': 'Delete',
    'ad.deleted': 'Deleted',
    'ad.deleteFail': 'Delete failed',
    'ad.delTitle': 'Void this ticket?',
    'ad.delWarn': 'The code stops working immediately, the recipient can no longer pick it up, and this cannot be undone.',
    'ad.delOk': 'Void it',
    'ad.textFallback': '(text)',
    'ad.unnamed': '(unnamed)',
    'ad.chars': '{0} chars',
    'ad.forever': 'Forever',

    'nf.title': 'Page not found',
    'nf.body': "The page you're looking for isn't in this relay",
    'nf.send': 'Send files',
    'nf.pickup': 'Pick up',
  },
};

export let LANG =
  localStorage.getItem('lang') ||
  ((navigator.language || '').toLowerCase().startsWith('en') ? 'en' : 'zh');

/** \u53D6\u8BCD:\u5F53\u524D\u8BED\u8A00 \u2192 \u4E2D\u6587\u515C\u5E95 \u2192 key \u672C\u8EAB;\u6570\u7EC4\u503C\u968F\u673A\u53D6\u4E00\u6761;{0}{1}\u2026 \u4F9D\u6B21\u66FF\u6362 */
export function t(key, ...args) {
  let s = (DICT[LANG] && DICT[LANG][key]) ?? DICT.zh[key] ?? key;
  if (Array.isArray(s)) s = s[Math.floor(Math.random() * s.length)];
  args.forEach((v, i) => { s = s.replaceAll(\`{\${i}}\`, String(v)); });
  return s;
}

const rerenders = [];
/** \u5404\u9875\u9762\u767B\u8BB0:\u8BED\u8A00\u5207\u6362\u540E\u91CD\u7B97\u52A8\u6001\u6587\u6848 */
export function onLangChange(fn) { rerenders.push(fn); }

function applyLang() {
  document.documentElement.lang = LANG === 'en' ? 'en' : 'zh-CN';
  document.querySelectorAll('[data-i18n]').forEach((n) => { n.textContent = t(n.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach((n) => { n.placeholder = t(n.dataset.i18nPh); });
  document.querySelectorAll('[data-i18n-title]').forEach((n) => { n.title = t(n.dataset.i18nTitle); });
  document.querySelectorAll('[data-i18n-aria]').forEach((n) => { n.setAttribute('aria-label', t(n.dataset.i18nAria)); });
  const btn = document.getElementById('lang-btn');
  if (btn) btn.textContent = LANG === 'en' ? '\u4E2D' : 'EN';
}

export function initI18n() {
  applyLang();
  document.getElementById('lang-btn')?.addEventListener('click', () => {
    LANG = LANG === 'en' ? 'zh' : 'en';
    localStorage.setItem('lang', LANG);
    applyLang();
    rerenders.forEach((fn) => fn());
  });
}
`, "js/index.js": "import qrcode from './vendor/qrcode.js?v=732e7eabbd2c58e9';\nimport { initUi } from './ui.js?v=732e7eabbd2c58e9';\nimport { $, $$, api, responseError, fmtBytes, fmtDate, fmtDuration, iconFor, copyText, toast, initTheme, el } from './common.js?v=732e7eabbd2c58e9';\nimport { createSecurityFeedback, isSecurityError } from './security-feedback.js?v=732e7eabbd2c58e9';\nimport { t, onLangChange, initI18n } from './i18n.js?v=732e7eabbd2c58e9';\n\ninitTheme();\ninitI18n();\n\nconst els = {\n  dropzone: $('#dropzone'),\n  dzHint: $('#dz-hint'),\n  fileInput: $('#file-input'),\n  fileList: $('#file-list'),\n  textInput: $('#text-input'),\n  textCounter: $('#text-counter'),\n  btnUpload: $('#btn-upload'),\n  btnText: $('#btn-text'),\n  progress: $('#progress'),\n  progressFill: $('#progress-fill'),\n  progressText: $('#progress-text'),\n  btnCancel: $('#btn-cancel'),\n  results: $('#results'),\n  placeholder: $('#result-placeholder'),\n  capDate: $('#cap-date'),\n};\n\nconst MAX_SIZE_FALLBACK = 25 * 1024 * 1024;\nconst MAX_BATCH = 10;\nlet cfg = { fileBackend: 'kv', maxFileSize: MAX_SIZE_FALLBACK }; // /api/config \u52A0\u8F7D\u540E\u8986\u76D6\nlet MAX_SIZE = MAX_SIZE_FALLBACK;\nlet policyReady = false;\n\nlet files = []; // \u5F85\u4E0A\u4F20\u961F\u5217(File[])\nlet queueUI = new Map(); // File \u2192 { row, bar, status }\nlet queueState = new Map(); // File \u2192 'idle' | { done: code } | 'fail'(\u8BED\u8A00\u5207\u6362\u540E\u91CD\u6E32\u67D3\u7528)\nlet session = null; // \u8FDB\u884C\u4E2D\u7684 R2 \u5206\u7247\u4F1A\u8BDD { uploadId, partSize, parts }\nlet currentXhr = null;\nlet cancelled = false;\nlet uploading = false;\nlet lastResults = [];\nconst securityFeedback = createSecurityFeedback($('.form-card'), 'upload', () =>\n  $('#panel-text').hidden ? startUpload() : submitText());\n\n/* \u670D\u52A1\u7AEF\u914D\u7F6E:\u51B3\u5B9A\u8D70\u5206\u7247\u4E0A\u4F20(R2 \u5927\u5B58\u50A8)\u8FD8\u662F\u5355\u8BF7\u6C42\u76F4\u4F20(KV \u5C0F\u5B58\u50A8) */\nfunction canUploadFiles() {\n  return policyReady && cfg.fileBackend !== 'none' && cfg.fileUploadAvailable !== false && cfg.uploadsRemaining !== 0;\n}\nfunction updateHint() {\n  els.dzHint.textContent = t('dz.hintMax', fmtBytes(MAX_SIZE));\n  for (const [id, value, allowed, fallback] of [\n    ['seg-expiry', 'forever', cfg.allowPermanent === true, '7d'],\n    ['seg-pickups', 'null', cfg.allowUnlimited === true, '5'],\n  ]) {\n    const button = $(`#${id} [data-v=\"${value}\"]`);\n    button.disabled = !allowed;\n    if (!allowed && button.classList.contains('active')) {\n      button.classList.remove('active');\n      $(`#${id} [data-v=\"${fallback}\"]`).classList.add('active');\n    }\n  }\n  $('#upload-policy-hint').textContent = !policyReady ? t('policy.unavailable')\n    : cfg.fileUploadAvailable === false ? t('policy.contact')\n    : cfg.weeklyFileLimit !== null && cfg.weeklyFileLimit !== undefined\n      ? t('policy.remaining', cfg.uploadsRemaining, cfg.weeklyFileLimit, fmtDate(cfg.uploadsResetAt)) : '';\n  $$('.seg button').forEach(button => button.setAttribute('aria-pressed', String(button.classList.contains('active'))));\n}\nasync function refreshPolicy() {\n  try {\n    cfg = await api('/api/config');\n    if (!Number.isSafeInteger(cfg.maxFileSize) || (cfg.maxFileSize < 0 || (cfg.maxFileSize === 0 && cfg.fileBackend !== 'none'))) throw new Error('Invalid upload policy');\n    MAX_SIZE = cfg.maxFileSize;\n    policyReady = true;\n  } catch { policyReady = false; }\n  updateHint();\n  setBusy(uploading);\n}\nupdateHint();\nrefreshPolicy();\n\n/* \u5BC4\u4EF6\u5355\u62AC\u5934\u65E5\u671F(\u88C5\u9970) */\nif (els.capDate) els.capDate.textContent = fmtDate(Date.now()).split(' ')[0];\n\n/* \u8BED\u8A00\u5207\u6362:\u91CD\u7B97\u52A8\u6001\u6587\u6848\u4E0E\u7ED3\u679C\u5361\u7247 */\nonLangChange(() => {\n  if (cfg.maxFileSize) updateHint();\n  renderQueue();\n  if (lastResults.length) showResults(lastResults);\n});\n\n/* ---------- tabs ---------- */\n$$('.tab').forEach((tb) =>\n  tb.addEventListener('click', () => {\n    if (uploading) return; // \u4E0A\u4F20\u4E2D\u7981\u6B62\u5207\u6362\n    $$('.tab').forEach((x) => x.classList.toggle('active', x === tb));\n    const tab = tb.dataset.tab;\n    $('#panel-file').hidden = tab !== 'file';\n    $('#panel-text').hidden = tab !== 'text';\n    $('#upload-description-field').hidden = tab !== 'file';\n    $$('.tab').forEach(x => x.setAttribute('aria-pressed', String(x === tb)));\n    els.btnUpload.hidden = tab !== 'file';\n    els.btnText.hidden = tab !== 'text';\n    hideResult();\n  }),\n);\n\n/* ---------- segmented \u9009\u9879 ---------- */\nfor (const id of ['seg-expiry', 'seg-pickups']) {\n  $(`#${id}`).addEventListener('click', (e) => {\n    const b = e.target.closest('button');\n    if (!b || b.disabled) return;\n    $$('button', $(`#${id}`)).forEach((x) => {\n      x.classList.toggle('active', x === b);\n      x.setAttribute('aria-pressed', String(x === b));\n    });\n  });\n}\nfunction readOptions() {\n  const exp = $('#seg-expiry .active').dataset.v;\n  const pk = $('#seg-pickups .active').dataset.v;\n  return { expiry: exp, maxPickups: pk === 'null' ? null : Number(pk),\n    displayName: $('#upload-name').value.trim(),\n    description: $('#panel-file').hidden ? '' : $('#upload-description').value.trim() };\n}\n$$('.tab, .seg button').forEach(button => button.setAttribute('aria-pressed', String(button.classList.contains('active'))));\n$('#upload-description').addEventListener('input', e => {\n  $('#description-count').textContent = `${e.target.value.length} / 300`;\n});\n\n/* ---------- \u6587\u4EF6\u961F\u5217:\u70B9\u51FB / \u5168\u7A97\u53E3\u62D6\u62FD / \u667A\u80FD\u7C98\u8D34,\u518D\u9009\u5373\u6574\u4F53\u66FF\u6362 ---------- */\nels.dropzone.addEventListener('click', () => els.fileInput.click());\nels.dropzone.addEventListener('keydown', (e) => {\n  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); els.fileInput.click(); }\n});\nels.fileInput.addEventListener('change', () => {\n  setFiles([...els.fileInput.files]);\n  els.fileInput.value = '';\n});\n\nfunction showTab(name) {\n  const tb = $(`.tab[data-tab=\"${name}\"]`);\n  if (tb && !tb.classList.contains('active')) tb.click(); // \u4E0A\u4F20\u4E2D\u65F6 tab \u5904\u7406\u5668\u81EA\u5DF1\u4F1A\u62D2\u7EDD\n}\n\n/* \u62D6\u5230\u9875\u9762\u4EFB\u610F\u4F4D\u7F6E\u90FD\u9AD8\u4EAE\u5E76\u53EF\u653E\u4E0B(\u4E0D\u518D\u8981\u6C42\u7CBE\u786E\u547D\u4E2D\u62D6\u62FD\u533A) */\nlet dragDepth = 0;\nwindow.addEventListener('dragenter', (e) => {\n  if (![...(e.dataTransfer?.types || [])].includes('Files')) return;\n  dragDepth++;\n  if (!uploading) els.dropzone.classList.add('dragover');\n});\nwindow.addEventListener('dragleave', () => {\n  if (--dragDepth <= 0) { dragDepth = 0; els.dropzone.classList.remove('dragover'); }\n});\nwindow.addEventListener('dragover', (e) => e.preventDefault());\nwindow.addEventListener('drop', (e) => {\n  e.preventDefault();\n  dragDepth = 0;\n  els.dropzone.classList.remove('dragover');\n  if (e.dataTransfer?.files?.length) setFiles([...e.dataTransfer.files]);\n});\n\n/* \u7C98\u8D34\u667A\u80FD\u8DEF\u7531:\u7C98\u8D34\u6587\u4EF6\u2192\u6587\u4EF6\u9875;\u6587\u4EF6\u9875\u7C98\u8D34\u7EAF\u6587\u672C\u2192\u81EA\u52A8\u5207\u5230\u6587\u672C\u9875 */\ndocument.addEventListener('paste', (e) => {\n  if (e.target?.closest?.('textarea, input')) return; // \u8F93\u5165\u6846\u5185\u7C98\u8D34\u8D70\u9ED8\u8BA4\u884C\u4E3A\n  if (e.clipboardData?.files?.length) {\n    setFiles([...e.clipboardData.files]);\n    return;\n  }\n  const text = e.clipboardData?.getData('text/plain');\n  if (text && $('#panel-text').hidden) {\n    showTab('text');\n    els.textInput.value = text;\n    els.textInput.dispatchEvent(new Event('input'));\n  }\n});\n\nfunction setFiles(list) {\n  if (uploading) return;\n  const ok = [];\n  for (const f of list) {\n    if (f.size > MAX_SIZE) { toast(t('err.oversize', fmtBytes(MAX_SIZE), fmtBytes(f.size)), 'error'); continue; }\n    if (f.size < 1) { toast(t('err.empty'), 'error'); continue; }\n    ok.push(f);\n  }\n  if (ok.length > MAX_BATCH) {\n    toast(t('err.tooMany', MAX_BATCH), 'error');\n    ok.length = MAX_BATCH;\n  }\n  files = ok; // \u66FF\u6362\u8BED\u4E49:\u518D\u6B21\u9009\u62E9\u5373\u91CD\u7F6E\u961F\u5217\n  queueState = new Map(files.map((f) => [f, 'idle']));\n  renderQueue();\n  els.btnUpload.disabled = files.length === 0 || !canUploadFiles();\n  hideResult();\n}\n\nfunction statusText(f, st) {\n  if (st === 'fail') return '\u2717';\n  if (st && st.done) return `\u2713 ${st.done}`;\n  return fmtBytes(f.size);\n}\n\nfunction renderQueue() {\n  els.fileList.replaceChildren();\n  queueUI = new Map();\n  files.forEach((f) => {\n    const st = queueState.get(f) || 'idle';\n    const bar = el('div', { class: 'fr-bar' });\n    const status = el('small', { class: 'fr-status' }, statusText(f, st));\n    const row = el('div', {\n      class: `file-row${st === 'fail' ? ' fail' : ''}${st && st.done ? ' done' : ''}`,\n    });\n    row.replaceChildren(\n      el('span', { class: 'fr-icon' }, iconFor(f.name, f.type)),\n      el('div', { class: 'fr-meta' },\n        el('b', { title: f.name }, f.name),\n        el('small', {}, `${fmtBytes(f.size)} \xB7 ${f.type || t('unknown.type')}`),\n      ),\n      status,\n      el('button', { class: 'icon-btn fr-remove', title: t('remove'), type: 'button', onclick: () => removeFile(f) }, '\u2715'),\n      bar,\n    );\n    if (st && st.done) bar.style.width = '100%';\n    queueUI.set(f, { row, bar, status });\n    els.fileList.append(row);\n  });\n  els.fileList.hidden = files.length === 0;\n  els.dropzone.hidden = files.length > 0;\n}\n\nfunction removeFile(f) {\n  if (uploading) return;\n  files = files.filter((x) => x !== f);\n  queueState.delete(f);\n  renderQueue();\n  els.btnUpload.disabled = files.length === 0 || !canUploadFiles();\n}\n\n/* ---------- \u6587\u672C\u8F93\u5165 ---------- */\nels.textInput.addEventListener('input', () => {\n  els.textCounter.textContent = t('text.counter', els.textInput.value.length, 65536);\n  els.btnText.disabled = !policyReady || !els.textInput.value.trim();\n});\n\n/* ---------- \u4E0A\u4F20:\u961F\u5217\u987A\u5E8F\u9010\u4E2A,\u805A\u5408\u8FDB\u5EA6 + \u6BCF\u884C\u8FF7\u4F60\u8FDB\u5EA6 ---------- */\nels.btnUpload.addEventListener('click', startUpload);\nels.btnCancel.addEventListener('click', cancelUpload);\nels.btnText.addEventListener('click', submitText);\n\nfunction sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }\n\nfunction xhrPut(url, blob, onProgress) {\n  return new Promise((resolve, reject) => {\n    const xhr = new XMLHttpRequest();\n    currentXhr = xhr;\n    xhr.open('PUT', url);\n    xhr.onload = () => {\n      let etag = null;\n      try {\n        const result = JSON.parse(xhr.responseText);\n        if (result.error === 'capacity_exceeded' || (xhr.status >= 400 && xhr.status < 500) || result.error?.startsWith('upload_policy') || isSecurityError({ code: result.error })) {\n          const error = responseError(result, xhr.status);\n          reject(error);\n          return;\n        }\n        etag = result.etag;\n      } catch { /* ignore */ }\n      resolve(xhr.status >= 200 && xhr.status < 300 && etag ? etag : null);\n    };\n    xhr.onerror = () => resolve(null);\n    xhr.onabort = () => resolve(null);\n    xhr.upload.onprogress = (e) => onProgress && e.lengthComputable && onProgress(e.loaded);\n    xhr.send(blob);\n  });\n}\n\n/** \u5355\u7247\u6700\u591A\u91CD\u8BD5 3 \u6B21,\u9000\u907F 1s/2s/4s */\nasync function putPartWithRetry(uploadId, n, blob, onProgress) {\n  for (let attempt = 0; attempt < 3; attempt++) {\n    if (cancelled) return null;\n    const etag = await xhrPut(`/api/uploads/${uploadId}/parts/${n}`, blob, onProgress);\n    if (etag) return etag;\n    await sleep([1000, 2000, 4000][attempt] || 4000);\n  }\n  return null;\n}\n\nfunction xhrJson(method, url, blob, onProgress, context) {\n  return new Promise((resolve, reject) => {\n    const xhr = new XMLHttpRequest();\n    currentXhr = xhr;\n    xhr.open(method, url);\n    if (context) xhr.setRequestHeader('X-Upload-Context', encodeURIComponent(JSON.stringify(context)));\n    xhr.onload = () => {\n      if (xhr.status >= 200 && xhr.status < 300) {\n        try { resolve(JSON.parse(xhr.responseText)); return; } catch { /* fallthrough */ }\n      }\n      let data;\n      try { data = JSON.parse(xhr.responseText); } catch { /* Use status below. */ }\n      if ((xhr.status >= 400 && xhr.status < 500) || isSecurityError({ code: data?.error })) {\n        reject(responseError(data, xhr.status));\n        return;\n      }\n      resolve(null);\n    };\n    xhr.onerror = () => resolve(null);\n    xhr.onabort = () => resolve(null);\n    xhr.upload.onprogress = (e) => onProgress && e.lengthComputable && onProgress(e.loaded);\n    xhr.send(blob);\n  });\n}\n\nlet speedState = { t: 0, loaded: 0, speed: 0 };\nlet curFileIdx = 0;\nlet curFileTotal = 1;\nfunction updateAggregate(loaded, total) {\n  const pct = Math.min(100, Math.floor((loaded / total) * 100));\n  els.progressFill.style.width = pct + '%';\n  const now = performance.now();\n  if (speedState.t && loaded > speedState.loaded) {\n    const inst = (loaded - speedState.loaded) / ((now - speedState.t) / 1000);\n    speedState.speed = speedState.speed ? speedState.speed * 0.7 + inst * 0.3 : inst;\n  }\n  speedState.t = now;\n  speedState.loaded = loaded;\n  let text = `${pct}% \xB7 ${fmtBytes(loaded)} / ${fmtBytes(total)} \xB7 ${fmtBytes(speedState.speed)}/s`;\n  if (speedState.speed > 1024 && loaded > 0 && loaded < total) {\n    text += ` \xB7 ${t('prog.eta', fmtDuration((total - loaded) / speedState.speed))}`;\n  }\n  if (curFileTotal > 1) text += ` \xB7 ${t('prog.file', curFileIdx, curFileTotal)}`;\n  els.progressText.textContent = text;\n}\n\n/** \u7B49\u5F85\u6001(\u521D\u59CB\u5316/\u91CD\u8BD5\u95F4\u9694/\u5408\u5E76\u5206\u7247):\u8FDB\u5EA6\u6761\u53E0\u52A0\u6D41\u5149\u52A8\u753B */\nfunction setPending(on) {\n  els.progressFill.classList.toggle('pending', on);\n}\n\nasync function startUpload() {\n  if (!files.length || uploading || !canUploadFiles() || !securityFeedback.canRetry()) return;\n  // A retry must not re-upload files already accepted earlier in the batch.\n  const pendingFiles = files.filter(file => !queueState.get(file)?.done);\n  if (!pendingFiles.length) return;\n  securityFeedback.clear();\n  uploading = true;\n  cancelled = false;\n  speedState = { t: 0, loaded: 0, speed: 0 };\n  curFileIdx = 0;\n  curFileTotal = pendingFiles.length;\n  const opts = readOptions();\n  const responses = [];\n  const totalBytes = pendingFiles.reduce((s, f) => s + f.size, 0);\n  let baseBytes = 0;\n  setBusy(true);\n  els.progress.hidden = false;\n  els.progressFill.style.width = '0%';\n  setPending(false);\n  els.progressText.textContent = t('prog.preparing');\n\n  for (let i = 0; i < pendingFiles.length; i++) {\n    if (cancelled) break;\n    const f = pendingFiles[i];\n    const ui = queueUI.get(f);\n    ui.row.classList.remove('fail');\n    curFileIdx = i + 1;\n    ui.row.classList.add('uploading');\n    els.progressText.textContent = t('prog.uploading');\n    const onProgress = (loaded) => {\n      ui.bar.style.width = Math.min(100, (loaded / f.size) * 100) + '%';\n      updateAggregate(baseBytes + loaded, totalBytes);\n    };\n    try {\n      const res = cfg.fileBackend === 'kv'\n        ? await directUpload(f, opts, onProgress)\n        : await multipartUpload(f, opts, onProgress);\n      responses.push(res);\n      baseBytes += f.size;\n      queueState.set(f, { done: res.code });\n      ui.bar.style.width = '100%';\n      ui.row.classList.add('done');\n      ui.status.textContent = `\u2713 ${res.code}`;\n    } catch (e) {\n      await abortUpload();\n      queueState.set(f, 'fail');\n      ui.row.classList.add('fail');\n      ui.status.textContent = '\u2717';\n      if (e.code === 'capacity_exceeded') {\n        window.alert(Number.isSafeInteger(e.remainingBytes) && e.remainingBytes >= 0\n          ? t('err.capacityRemaining', (e.remainingBytes / 1e9).toFixed(3), e.remainingBytes.toLocaleString())\n          : t('err.capacity'));\n      } else if (!cancelled && !securityFeedback.show(e)) toast(`${f.name}: ${e.message || t('err.upload')}`, 'error');\n      break; // \u4E00\u4E2A\u5931\u8D25\u5373\u505C,\u4FDD\u7559\u961F\u5217\u4FBF\u4E8E\u5904\u7406\n    }\n  }\n\n  uploading = false;\n  els.progress.hidden = true;\n  setPending(false);\n  setBusy(false);\n  if (cancelled) toast(t('toast.cancelled'));\n  if (responses.length) showResults([...lastResults, ...responses]);\n  await refreshPolicy();\n}\n\n/* ---------- \u5C0F\u5B58\u50A8\u6A21\u5F0F(KV):\u5355\u8BF7\u6C42\u76F4\u4F20,\u5931\u8D25\u6574\u6587\u4EF6\u91CD\u53D1 ---------- */\nasync function directUpload(f, opts, onProgress) {\n  const qs = new URLSearchParams({\n    filename: f.name,\n    mime: f.type || 'application/octet-stream',\n    expiry: opts.expiry,\n  });\n  if (opts.maxPickups !== null) qs.set('maxPickups', String(opts.maxPickups));\n\n  for (let attempt = 0; attempt < 3; attempt++) {\n    if (cancelled) throw new Error('cancelled');\n    setPending(false);\n    const res = await xhrJson('POST', `/api/shares/file?${qs}`, f, onProgress,\n      { displayName: opts.displayName, description: opts.description });\n    if (res) return res;\n    if (cancelled) throw new Error('cancelled');\n    setPending(true);\n    els.progressText.textContent = t('prog.retry', attempt + 1);\n    await sleep([1000, 2000][attempt] || 4000);\n  }\n  throw new Error(t('err.upload'));\n}\n\n/* ---------- \u5927\u5B58\u50A8\u6A21\u5F0F(R2):\u5206\u7247\u4E0A\u4F20 ---------- */\nasync function multipartUpload(f, opts, onProgress) {\n  setPending(true);\n  els.progressText.textContent = t('prog.init');\n  const init = await api('/api/uploads/init', {\n    method: 'POST',\n    body: { filename: f.name, size: f.size, mime: f.type || 'application/octet-stream', ...opts },\n  });\n  session = init;\n  setPending(false);\n\n  const etags = [];\n  let doneBytes = 0;\n  for (let i = 1; i <= init.parts; i++) {\n    const blob = f.slice((i - 1) * init.partSize, Math.min(i * init.partSize, f.size));\n    const etag = await putPartWithRetry(init.uploadId, i, blob, (loaded) =>\n      onProgress(doneBytes + loaded),\n    );\n    if (!etag) {\n      const wasCancelled = cancelled;\n      await abortUpload();\n      throw new Error(wasCancelled ? 'cancelled' : t('err.upload'));\n    }\n    etags.push({ partNumber: i, etag });\n    doneBytes += blob.size;\n  }\n  if (cancelled) throw new Error('cancelled');\n\n  els.progressFill.style.width = '100%';\n  setPending(true);\n  els.progressText.textContent = t('prog.merging');\n  try {\n    const res = await api(`/api/uploads/${init.uploadId}/complete`, {\n      method: 'POST',\n      body: { parts: etags },\n    });\n    session = null;\n    return res;\n  } catch (e) {\n    await abortUpload();\n    throw e;\n  }\n}\n\nasync function cancelUpload() {\n  cancelled = true;\n  currentXhr?.abort();\n  await abortUpload();\n}\n\nasync function abortUpload() {\n  if (!session) return;\n  const id = session.uploadId;\n  session = null;\n  try { await api(`/api/uploads/${id}/abort`, { method: 'POST', body: {} }); } catch { /* ignore */ }\n}\n\nfunction setBusy(busy) {\n  for (const field of [$('#upload-name'), $('#upload-description')]) field.disabled = busy;\n  els.btnUpload.disabled = busy || files.length === 0 || !canUploadFiles();\n  els.btnText.disabled = busy || !policyReady || !els.textInput.value.trim();\n}\n\n/* \u5237\u65B0/\u5173\u9875\u65F6\u5C3D\u529B\u901A\u77E5\u670D\u52A1\u7AEF\u653E\u5F03(\u4E0D\u662F\u65AD\u70B9\u7EED\u4F20) */\nwindow.addEventListener('pagehide', () => {\n  if (session) navigator.sendBeacon(`/api/uploads/${session.uploadId}/abort`);\n});\n\n/* ---------- \u6587\u672C\u5206\u4EAB ---------- */\nasync function submitText() {\n  const text = els.textInput.value;\n  if (!text.trim() || !policyReady || !securityFeedback.canRetry()) return;\n  securityFeedback.clear();\n  setBusy(true);\n  try {\n    const res = await api('/api/shares/text', { method: 'POST', body: { text, ...readOptions() } });\n    showResults([res]);\n  } catch (e) {\n    if (!securityFeedback.show(e)) toast(e.message || t('err.submit'), 'error');\n  } finally {\n    setBusy(false);\n  }\n}\n\n/* ---------- \u7ED3\u679C\u5361\u7247(\u591A\u6587\u4EF6\u65F6\u9010\u5F20\u5806\u53E0 + \u6279\u91CF\u5934\u90E8) ---------- */\nfunction qrSvgFor(url) {\n  /* Vendored ES module; no parser-blocking classic script or global dependency. */\n  try {\n    const qr = qrcode(0, 'M');\n    qr.addData(url);\n    qr.make();\n    const holder = document.createElement('div');\n    holder.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true, alt: t('qr.hint') });\n    return holder.firstElementChild;\n  } catch { return null; }\n}\n\nfunction metaText(r) {\n  const parts = [];\n  parts.push(r.expireAt\n    ? t('meta.after', fmtDuration((r.expireAt - Date.now()) / 1000), fmtDate(r.expireAt))\n    : t('meta.forever'));\n  parts.push(r.maxPickups === null || r.maxPickups === undefined ? t('meta.unlimited') : t('meta.pickups', r.maxPickups));\n  if (r.kind === 'file' && r.size) parts.push(fmtBytes(r.size));\n  return parts.join(' \xB7 ');\n}\n\n/* \u7ED3\u679C\u5361\u7247 = \u53D6\u4EF6\u51ED\u8BC1\u7968\u636E:\u7968\u5934(\u6807\u9898+\u2116) \u2192 \u7968\u8EAB(\u53E3\u4EE4+\u4E8C\u7EF4\u7801) \u2192 \u6495\u7968\u7EBF \u2192 \u7968\u811A(\u64CD\u4F5C) */\nfunction buildResultCard(r, compact) {\n  const link = `${location.origin}/pickup?code=${r.code}`;\n  const qr = qrSvgFor(link);\n  const col = el('div', { class: 'result-col' },\n    compact && r.kind === 'file' && r.filename ? el('div', { class: 'result-file-name' }, r.filename) : null,\n    el('div', { class: 'code' }, ...r.code.split('').map((d) => el('span', {}, d))),\n    el('div', { class: 'result-link' }, link),\n    el('div', { class: 'result-meta' }, metaText(r)),\n  );\n  const main = el('div', { class: 'result-main' },\n    qr ? el('div', { class: 'qr-wrap', title: t('qr.hint') }, qr, el('div', { class: 'qr-hint' }, t('qr.hint'))) : null,\n    col,\n  );\n  return el('div', { class: 'result' },\n    el('div', { class: 'tk-head' },\n      el('span', {}, t('ticket.title')),\n      el('span', { class: 'tk-no' }, t('ticket.no', r.code)),\n    ),\n    el('div', { class: 'tk-body' },\n      compact ? null : el('p', { class: 'result-title' }, t('result.ok')),\n      main,\n    ),\n    el('div', { class: 'tk-tear' }),\n    el('div', { class: 'tk-foot' },\n      el('button', { class: 'btn primary', type: 'button', onclick: (e) => copyBtn(e.currentTarget, r.code, t('label.code')) }, t('btn.copyCode')),\n      el('button', { class: 'btn', type: 'button', onclick: (e) => copyBtn(e.currentTarget, link, t('label.link')) }, t('btn.copyLink')),\n      compact ? null : el('button', { class: 'btn ghost', type: 'button', onclick: resetAll }, t('btn.again')),\n    ),\n  );\n}\n\nfunction showResults(list) {\n  lastResults = list;\n  if (els.placeholder) els.placeholder.hidden = true;\n  els.results.replaceChildren();\n  if (list.length > 1) {\n    els.results.append(\n      el('div', { class: 'result-batch-head' },\n        el('p', { class: 'result-title batch' }, t('result.okBatch', list.length)),\n        el('div', { class: 'btn-row' },\n          el('button', {\n            class: 'btn small', type: 'button',\n            onclick: async (e) => {\n              const ok = await copyText(list.map((r) => r.code).join('\\n'));\n              toast(ok ? t('copied', t('label.code')) : t('copy.fail'), ok ? 'ok' : 'error');\n            },\n          }, t('btn.copyAll')),\n          el('button', { class: 'btn small ghost', type: 'button', onclick: resetAll }, t('btn.again')),\n        ),\n      ),\n    );\n  }\n  for (const r of list) els.results.append(buildResultCard(r, list.length > 1));\n  els.results.scrollIntoView({ behavior: 'smooth', block: 'nearest' });\n}\n\nfunction resetAll() {\n  files = [];\n  queueState = new Map();\n  renderQueue();\n  els.btnUpload.disabled = true;\n  els.textInput.value = '';\n  els.textCounter.textContent = t('text.counter', 0, 65536);\n  els.btnText.disabled = true;\n  hideResult();\n}\n\n/** \u590D\u5236\u6210\u529F\u540E\u6309\u94AE\u77ED\u6682\u53D8\u6210\"\u2713 \u5DF2\u590D\u5236\" */\nasync function copyBtn(btn, text, label) {\n  const ok = await copyText(text);\n  toast(ok ? t('copied', label) : t('copy.fail'), ok ? 'ok' : 'error');\n  if (!ok) return;\n  btn.textContent = t('copied.btn');\n  btn.disabled = true;\n  setTimeout(() => { btn.textContent = label === t('label.code') ? t('btn.copyCode') : t('btn.copyLink'); btn.disabled = false; }, 1500);\n}\n\nfunction hideResult() {\n  lastResults = [];\n  if (els.placeholder) els.placeholder.hidden = false;\n  els.results.replaceChildren();\n}\n\ninitUi();\n", "js/pickup.js": "import { initUi } from './ui.js?v=732e7eabbd2c58e9';\nimport { createSecurityFeedback } from './security-feedback.js?v=732e7eabbd2c58e9';\nimport { $, $$, api, fmtBytes, fmtDate, copyText, toast, initTheme, el, iconFor } from './common.js?v=732e7eabbd2c58e9';\nimport { t, onLangChange, initI18n } from './i18n.js?v=732e7eabbd2c58e9';\n\ninitTheme();\ninitI18n();\n\nconst boxes = $$('.otp-box');\nconst row = $('#otp-row');\nconst errorBox = $('#pickup-error');\nconst resultCard = $('#pickup-result');\nlet querying = false;\nlet last = null; // { res, code } \u8BED\u8A00\u5207\u6362\u65F6\u91CD\u6E32\u67D3\nconst securityFeedback = createSecurityFeedback($('#pickup-input-card'), 'pickup', submit);\n\nonLangChange(() => {\n  if (last && !resultCard.hidden) render(last.res, last.code);\n});\n\nfunction value() {\n  return boxes.map((b) => b.value).join('');\n}\n\n/* \u586B\u5165 1-6 \u4F4D\u6570\u5B57:\u591F 6 \u4F4D\u81EA\u52A8\u63D0\u4EA4,\u5426\u5219\u805A\u7126\u5230\u4E0B\u4E00\u4E2A\u7A7A\u683C */\nfunction fill(digits) {\n  boxes.forEach((b, i) => { b.value = digits[i] || ''; });\n  hideError();\n  if (digits.length === 6) {\n    boxes[5].focus();\n    if (!querying) submit();\n  } else {\n    boxes[Math.min(digits.length, 5)].focus();\n  }\n}\n\nboxes.forEach((box, i) => {\n  box.addEventListener('input', () => {\n    box.value = box.value.replace(/\\D/g, '').slice(0, 1);\n    hideError();\n    if (box.value && i < boxes.length - 1) boxes[i + 1].focus();\n    if (value().length === 6 && !querying) submit();\n  });\n  box.addEventListener('keydown', (e) => {\n    if (e.key === 'Backspace' && !box.value && i > 0) {\n      e.preventDefault();\n      boxes[i - 1].value = '';\n      boxes[i - 1].focus();\n    } else if (e.key === 'ArrowLeft' && i > 0) {\n      boxes[i - 1].focus();\n    } else if (e.key === 'ArrowRight' && i < boxes.length - 1) {\n      boxes[i + 1].focus();\n    } else if (e.key === 'Enter' && value().length === 6 && !querying) {\n      submit();\n    }\n  });\n  box.addEventListener('paste', (e) => {\n    e.preventDefault();\n    const digits = (e.clipboardData.getData('text') || '').replace(/\\D/g, '').slice(0, 6);\n    if (digits) fill(digits);\n  });\n  box.addEventListener('focus', () => box.select());\n});\n\nfunction showError(msg) {\n  errorBox.textContent = msg;\n  errorBox.hidden = false;\n  row.classList.remove('shake');\n  void row.offsetWidth; /* \u5F3A\u5236 reflow,\u91CD\u542F\u52A8\u753B */\n  row.classList.add('shake');\n}\nfunction hideError() {\n  errorBox.hidden = true;\n}\n\nasync function submit() {\n  const code = value();\n  if (querying || !/^\\d{6}$/.test(code) || !securityFeedback.canRetry()) return;\n  securityFeedback.clear();\n  querying = true;\n  hideError();\n  resultCard.hidden = true;\n  try {\n    const res = await api('/api/pickup', { method: 'POST', body: { code } });\n    render(res, code);\n  } catch (e) {\n    if (!securityFeedback.show(e)) showError(e.message || t('pk.fail'));\n  } finally {\n    querying = false;\n  }\n}\n\nfunction metaLine(res) {\n  const parts = [];\n  parts.push(res.expireAt ? t('pk.expireAt', fmtDate(res.expireAt)) : t('meta.forever'));\n  parts.push(res.pickupsLeft === null || res.pickupsLeft === undefined ? t('meta.unlimited') : t('pk.left', res.pickupsLeft));\n  return parts.join(' \xB7 ');\n}\n\nfunction render(res, code) {\n  last = { res, code };\n  resultCard.replaceChildren();\n\n  if (res.kind === 'text') {\n    const pre = el('pre', { class: 'text-body' });\n    pre.textContent = res.text ?? '';\n    resultCard.append(\n      el('div', { class: 'share-card' },\n        el('span', { class: 'sc-icon' }, '\u{1F4DD}'),\n        el('div', { class: 'sc-meta' }, el('b', {}, t('pk.textChars', res.size))),\n      ),\n      pre,\n      el('div', { class: 'btn-row' },\n        el('button', { class: 'btn primary', onclick: async () => {\n          (await copyText(res.text)) ? toast(t('copied.text'), 'ok') : toast(t('copy.fail'), 'error');\n        } }, t('pk.copyAllText')),\n      ),\n    );\n  } else {\n    resultCard.append(\n      el('div', { class: 'share-card' },\n        el('span', { class: 'sc-icon' }, iconFor(res.filename, res.mime)),\n        el('div', { class: 'sc-meta' },\n          el('b', {}, res.filename || t('pk.unnamed')),\n          el('small', {}, `${fmtBytes(res.size)} \xB7 ${res.mime || t('unknown.type')}`),\n        ),\n      ),\n      el('a', {\n        class: 'btn primary block',\n        href: `/api/pickup/${code}/download`,\n      }, t('pk.download')),\n    );\n  }\n\n  resultCard.append(\n    el('div', { class: 'meta-line' }, metaLine(res)),\n    el('div', { class: 'btn-row' },\n      el('button', { class: 'btn ghost', onclick: reset }, t('pk.again')),\n    ),\n  );\n  resultCard.hidden = false;\n}\n\nfunction reset() {\n  last = null;\n  resultCard.hidden = true;\n  boxes.forEach((b) => { b.value = ''; });\n  hideError();\n  boxes[0].focus();\n}\n\n/* \u652F\u6301 /pickup?code=xxxxxx \u5E26\u53C2\u8FDB\u5165 */\nconst fromUrl = new URLSearchParams(location.search).get('code');\nif (fromUrl && /^\\d{1,6}$/.test(fromUrl)) {\n  fill(fromUrl.slice(0, 6));\n} else {\n  boxes[0].focus();\n}\n\ninitUi();\n", "js/security-download.js": "import { initTheme, responseError } from './common.js?v=732e7eabbd2c58e9';\nimport { initI18n, onLangChange } from './i18n.js?v=732e7eabbd2c58e9';\nimport { createSecurityFeedback } from './security-feedback.js?v=732e7eabbd2c58e9';\n\ninitTheme(); initI18n();\ndocument.documentElement.classList.add('ui-enhanced', 'ui-soft');\nconst data = JSON.parse(document.querySelector('#security-data').textContent);\nconst feedback = createSecurityFeedback(document.querySelector('#download-feedback'), 'download', () => location.reload());\nfeedback.show(responseError(data, 403));\nconst translate = () => {\n  const en = document.documentElement.lang === 'en';\n  document.title = en ? 'File download \xB7 File relay' : '\u6587\u4EF6\u4E0B\u8F7D \xB7 \u6587\u4EF6\u4E2D\u8F6C\u7AD9';\n  document.querySelector('#back-pickup').textContent = en ? 'Back to pickup' : '\u8FD4\u56DE\u53D6\u4EF6\u9875';\n};\nonLangChange(translate); translate();\n", "js/security-feedback.js": "import { el, copyText } from './common.js?v=732e7eabbd2c58e9';\nimport { onLangChange } from './i18n.js?v=732e7eabbd2c58e9';\n\nconst EMAIL = 'iblykk@gmail.com';\nexport const isSecurityError = error => ['security_blocked', 'security_unavailable'].includes(error?.code);\n\n/** One persistent notice per surface. No requests run on countdown expiry. */\nexport function createSecurityFeedback(host, operation, retry) {\n  let current = null, timer = null, deadline = 0, pending = false;\n  const card = el('section', { class: 'security-feedback', hidden: true, tabIndex: -1, ariaLabel: '\u8BBF\u95EE\u63D0\u793A' });\n  host.append(card);\n  const text = (zh, en) => document.documentElement.lang === 'en' ? en : zh;\n  const action = () => ({ upload: text('\u4E0A\u4F20', 'upload'), pickup: text('\u53D6\u4EF6', 'pick up'), download: text('\u4E0B\u8F7D', 'download') })[operation];\n  function clear() {\n    current = null;\n    clearInterval(timer);\n    timer = null;\n    card.hidden = true;\n    card.replaceChildren();\n  }\n  function ready() { return !pending && (!current || performance.now() >= deadline); }\n  function draw() {\n    if (!current) return;\n    const error = current;\n    const unavailable = error.code === 'security_unavailable';\n    const reason = unavailable ? 'service_unavailable' : error.reason;\n    const title = unavailable ? text('\u670D\u52A1\u6682\u65F6\u4E0D\u53EF\u7528', 'Service temporarily unavailable') : text('\u6682\u65F6\u65E0\u6CD5' + action(), 'Unable to ' + action());\n    const descriptions = {\n      rate_limit: text('\u64CD\u4F5C\u8F83\u9891\u7E41\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5\u3002\u5982\u6709\u7591\u95EE\uFF0C\u53EF\u8054\u7CFB\u7AD9\u957F\u3002', 'Too many attempts. Please try again later or contact the site owner.'),\n      region: text('\u5F53\u524D\u8BBF\u95EE\u5730\u533A\u4E0D\u5728\u672C\u7AD9\u5F00\u653E\u8303\u56F4\u5185\u3002\u5982\u6709\u7591\u95EE\uFF0C\u53EF\u8054\u7CFB\u7AD9\u957F\u3002', 'Access is unavailable from your current region. Contact the site owner for help.'),\n      service_unavailable: text('\u6682\u65F6\u65E0\u6CD5\u5904\u7406\u8BF7\u6C42\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002', 'Your request cannot be processed right now. Please try again later.'),\n    };\n    const description = descriptions[reason] || text('\u5F53\u524D\u7F51\u7EDC\u7684\u8BF7\u6C42\u53D7\u5230\u9650\u5236\u3002\u5982\u9700\u534F\u52A9\uFF0C\u8BF7\u8054\u7CFB\u7AD9\u957F\u3002', 'Requests from your current network are restricted. Contact the site owner for help.');\n    const heading = el('h3', {}, title);\n    const content = el('div', {}, heading, el('p', {}, description));\n    const head = el('div', { class: 'security-feedback-head' }, el('span', { class: 'security-feedback-icon', 'aria-hidden': 'true' }, '!'), content);\n    const status = el('p', { class: 'security-feedback-status', role: 'status' });\n    const copy = async value => {\n      if (await copyText(value)) { status.textContent = text('\u5DF2\u590D\u5236', 'Copied'); return; }\n      const dialog = el('dialog', { class: 'security-copy-dialog', 'aria-label': text('\u624B\u52A8\u590D\u5236', 'Copy manually') });\n      const field = el('textarea', { readonly: '', 'aria-label': text('\u5F85\u590D\u5236\u5185\u5BB9', 'Text to copy') });\n      field.value = value;\n      const close = el('button', { type: 'button', class: 'btn ghost', onclick: () => dialog.close() }, text('\u5173\u95ED', 'Close'));\n      dialog.append(field, close); document.body.append(dialog);\n      dialog.addEventListener('close', () => dialog.remove(), { once: true });\n      dialog.showModal(); field.focus(); field.select();\n    };\n    const id = typeof error.requestId === 'string' && /^[a-zA-Z0-9-]{1,80}$/.test(error.requestId) ? error.requestId : '';\n    const feedback = [text('\u6587\u4EF6\u4E2D\u8F6C\u7AD9\u8BBF\u95EE\u53CD\u9988', 'File relay access feedback'),\n      text('\u64CD\u4F5C\uFF1A', 'Action: ') + action(), text('\u63D0\u793A\uFF1A', 'Notice: ') + description,\n      text('\u53D1\u751F\u65F6\u95F4\uFF1A', 'Time: ') + new Date(error.serverTime || error.receivedAt).toISOString(),\n      ...(id ? [text('\u8BF7\u6C42\u7F16\u53F7\uFF1A', 'Request ID: ') + id] : []), '', text('\u8865\u5145\u8BF4\u660E\uFF1A', 'Additional details: ')].join('\\n');\n    const contact = el('a', { class: 'btn ghost', href: `mailto:${EMAIL}?subject=${encodeURIComponent(text('\u6587\u4EF6\u4E2D\u8F6C\u7AD9 \xB7 \u8BBF\u95EE\u53CD\u9988', 'File relay \xB7 Access feedback'))}&body=${encodeURIComponent(feedback)}` }, text('\u8054\u7CFB\u7AD9\u957F', 'Contact site owner'));\n    const retryButton = el('button', { type: 'button', class: 'btn primary', onclick: async () => {\n      if (!ready()) return;\n      pending = true; tick();\n      try { await retry(); }\n      finally { pending = false; if (current) draw(); }\n    } }, text('\u91CD\u65B0\u5C1D\u8BD5', 'Try again'));\n    const contactFirst = !unavailable && reason !== 'rate_limit';\n    if (contactFirst) { contact.className = 'btn primary'; retryButton.className = 'btn ghost'; }\n    const actions = el('div', { class: 'security-feedback-actions' }, ...(contactFirst ? [contact, retryButton] : [retryButton, contact]));\n    const time = el('div', { class: 'security-feedback-time' });\n    const remaining = el('span', {});\n    const hasExpiry = Number.isFinite(error.retryAt) && error.retryAt > 0;\n    time.hidden = !hasExpiry;\n    if (hasExpiry) time.append(el('span', {}, text('\u9884\u8BA1\u53EF\u91CD\u8BD5\uFF1A', 'Try after: ') + new Date(error.retryAt).toLocaleString(document.documentElement.lang, { hour12: false })), remaining);\n    const tip = text('\u8C03\u7528\u90AE\u4EF6\u5E94\u7528\u5E76\u9884\u586B\u53CD\u9988\u4FE1\u606F\uFF0C\u4E0D\u4F1A\u81EA\u52A8\u53D1\u9001\u3002\u672A\u914D\u7F6E\u90AE\u4EF6\u5E94\u7528\u65F6\uFF0C\u53EF\u590D\u5236\u90AE\u7BB1\u540E\u81EA\u884C\u5199\u4FE1\u3002', 'Opens your mail app with a draft; nothing is sent automatically. You can also copy the email address.');\n    const help = el('button', { type: 'button', class: 'security-help', 'aria-label': tip, title: tip, 'aria-expanded': 'false' }, '?');\n    const helpText = el('span', { class: 'security-help-text', role: 'tooltip' }, tip);\n    help.onclick = () => help.setAttribute('aria-expanded', String(help.getAttribute('aria-expanded') !== 'true'));\n    help.onkeydown = event => { if (event.key === 'Escape') help.setAttribute('aria-expanded', 'false'); };\n    const fallback = el('div', { class: 'security-feedback-fallback' },\n      el('button', { type: 'button', class: 'security-text-button', onclick: () => copy(EMAIL) }, text('\u590D\u5236\u90AE\u7BB1', 'Copy email')),\n      el('span', { class: 'security-help-wrap' }, help, helpText));\n    const reference = el('div', { class: 'security-feedback-reference' },\n      el('span', {}, id ? text('\u8BF7\u6C42\u7F16\u53F7 ', 'Request ID ') + id : ''),\n      el('button', { type: 'button', class: 'security-text-button', onclick: () => copy(feedback) }, text('\u590D\u5236\u53CD\u9988\u4FE1\u606F', 'Copy feedback')));\n    card.replaceChildren(head, time, actions, fallback, reference, status);\n    function tick() {\n      const seconds = Math.max(0, Math.ceil((deadline - performance.now()) / 1000));\n      retryButton.disabled = pending || seconds > 0;\n      remaining.textContent = seconds ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : text('\u53EF\u91CD\u65B0\u68C0\u67E5', 'Ready to retry');\n    }\n    clearInterval(timer); tick(); timer = setInterval(tick, 1000);\n  }\n  onLangChange(draw);\n  window.addEventListener('pagehide', () => clearInterval(timer));\n  window.addEventListener('pageshow', () => { if (current) draw(); });\n  return {\n    clear,\n    canRetry: () => !current || performance.now() >= deadline,\n    show(error) {\n      if (!isSecurityError(error)) return false;\n      const receivedAt = Date.now();\n      current = { ...error, receivedAt };\n      const serverTime = Number.isFinite(error.serverTime) ? error.serverTime : receivedAt;\n      deadline = performance.now() + (Number.isFinite(error.retryAt) ? Math.max(0, error.retryAt - serverTime) : 0);\n      draw(); card.hidden = false; card.focus({ preventScroll: true });\n      card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });\n      return true;\n    },\n  };\n}\n", "js/storage-overview.js": "import { el, fmtBytes } from './common.js?v=732e7eabbd2c58e9';\nimport { t } from './i18n.js?v=732e7eabbd2c58e9';\n\n/** Compact help shared by both storage headings; works with pointer, keyboard and touch. */\nexport function storageHelp(label, text) {\n  const anchor = el('span', { class: 'storage-help-anchor' }, label);\n  const content = el('span', {}, text);\n  // Reuse the shared help controller for focus, Escape and lifecycle cleanup.\n  queueMicrotask(() => { if (anchor.isConnected) window.attachHelp(anchor, content); });\n  return anchor;\n}\nexport function kvUsageCard(kv) {\n  if (!kv?.bound) return null;\n  const ready = kv.state === 'available' && Number.isSafeInteger(kv.usedBytes) && kv.usedBytes >= 0;\n  const quota = Number.isSafeInteger(kv.freeQuotaBytes) && kv.freeQuotaBytes > 0 ? kv.freeQuotaBytes : 1_000_000_000;\n  const info = [t('storage.sharedQuota'), t('storage.dailyPeak'), ready ? t('storage.keys', kv.keyCount) + ' \xB7 ' + t('storage.sample', kv.sampleDate) : t('storage.analyticsRequired')].join('\u3002');\n  return el('div', { class: 'stat-card storage-card kv-storage-card' },\n    el('div', { class: 'storage-heading' }, el('small', {}, 'KV'), storageHelp('KV', info)),\n    el('div', { class: 'storage-value' }, el('b', {}, ready ? fmtBytes(kv.usedBytes) : '\u2014'), el('span', { class: 'storage-total' }, ' / ' + fmtBytes(quota))),\n    ready ? el('meter', { class: 'storage-meter', min: 0, max: quota, value: Math.min(kv.usedBytes, quota), ariaLabel: t('storage.quotaReference') }) : el('small', { class: 'storage-state' }, t(kv.state === 'unconfigured' ? 'storage.notConfigured' : 'ad.storageUnavailable')));\n}\n", "js/ui-audit-layout.js": "export function initAuditLayout() {\n    /* Keep category selection, applied filters and export in the same workspace. */\n    (() => {\n        const form = document.querySelector('#audit-filter'), exportButton = document.querySelector('#audit-export');\n        if (!form || !exportButton)\n            return;\n        const oldActions = exportButton.parentElement;\n        form.querySelector('.audit-actions').append(exportButton);\n        oldActions.remove();\n        const notice = document.createElement('small');\n        notice.id = 'ui-audit-pending';\n        notice.className = 'ui-audit-pending';\n        notice.setAttribute('role', 'status');\n        notice.hidden = true;\n        form.append(notice);\n        const fields = ['audit-result', 'audit-from', 'audit-to', 'audit-q'].map(id => document.getElementById(id));\n        const snapshot = () => JSON.stringify(fields.map(n => n.value.trim()));\n        let applied = snapshot();\n        function sync() {\n            const dirty = snapshot() !== applied, en = document.documentElement.lang === 'en';\n            notice.hidden = !dirty;\n            notice.textContent = en ? 'Filters changed. Apply them before exporting.' : '\u7B5B\u9009\u6761\u4EF6\u5DF2\u66F4\u6539\uFF0C\u8BF7\u5148\u70B9\u51FB\u201C\u7B5B\u9009\u201D\u3002';\n            exportButton.setAttribute('aria-disabled', String(dirty));\n            exportButton.title = en ? 'Export all matching records across pages' : '\u5BFC\u51FA\u5F53\u524D\u7C7B\u522B\u53CA\u7B5B\u9009\u6761\u4EF6\u4E0B\u7684\u5168\u90E8\u5339\u914D\u8BB0\u5F55\uFF0C\u5305\u542B\u6240\u6709\u5206\u9875';\n            if (dirty)\n                exportButton.setAttribute('aria-describedby', notice.id);\n            else\n                exportButton.removeAttribute('aria-describedby');\n        }\n        for (const n of fields) {\n            n.addEventListener('input', sync);\n            n.addEventListener('change', sync);\n        }\n        form.addEventListener('submit', () => { const from = fields[1].value, to = fields[2].value; if (from && to && from > to) {\n            sync();\n            return;\n        } applied = snapshot(); sync(); });\n        document.querySelector('#audit-reset').addEventListener('click', () => { applied = snapshot(); sync(); });\n        exportButton.addEventListener('click', e => { if (snapshot() !== applied) {\n            e.preventDefault();\n            e.stopImmediatePropagation();\n            sync();\n        } }, true);\n        document.querySelector('#lang-btn').addEventListener('click', sync);\n        sync();\n    })();\n}\n", "js/ui-classifications.js": "export function initClassifications() {\n    /* Attach record categories to their subject; navigation and outcome badges stay intact. */\n    (() => {\n        const body = document.querySelector('#audit-body');\n        if (!body)\n            return;\n        function enhance() {\n            for (const cell of body.querySelectorAll('tr>td:nth-child(2)')) {\n                const category = cell.querySelector(':scope > small'), action = cell.querySelector(':scope > span');\n                if (!category || !action)\n                    continue;\n                const line = document.createElement('div');\n                line.className = 'ui-record-line';\n                const tag = document.createElement('sup');\n                tag.className = 'ui-record-sup';\n                tag.textContent = category.textContent;\n                const key = [...document.querySelectorAll('.audit-categories button[data-category]')].find(button => button.textContent.trim() === category.textContent.trim())?.dataset.category;\n                tag.dataset.tone = { login: 'blue', operation: 'teal', security: 'amber' }[key] || 'slate';\n                line.append(action, tag);\n                cell.replaceChildren(line);\n            }\n        }\n        enhance();\n        new MutationObserver(enhance).observe(body, { childList: true, subtree: true });\n    })();\n}\n", "js/ui-controls.js": `export function initControls() {
    /* Shared accessible controls. Native inputs and their original events are retained. */
    (() => {
        const en = () => document.documentElement.lang === 'en';
        window.numberControl = (node, label) => {
            if (node.closest('.sec-number'))
                return node.closest('.sec-number');
            const wrap = document.createElement('span');
            wrap.className = 'sec-number';
            const down = document.createElement('button'), up = document.createElement('button');
            for (const button of [down, up]) {
                button.type = 'button';
                button.className = 'sec-step';
            }
            down.textContent = '\u2212';
            up.textContent = '+';
            node.inputMode = 'numeric';
            const labelText = () => typeof label === 'function' ? label() : label;
            const sync = () => {
                node.setAttribute('aria-label', labelText());
                down.setAttribute('aria-label', (en() ? 'Decrease ' : '\u51CF\u5C11') + labelText());
                up.setAttribute('aria-label', (en() ? 'Increase ' : '\u589E\u52A0') + labelText());
                down.disabled = node.disabled || (node.value !== '' && node.min !== '' && node.valueAsNumber <= Number(node.min));
                up.disabled = node.disabled || (node.value !== '' && node.max !== '' && node.valueAsNumber >= Number(node.max));
            };
            down.onclick = () => { node.stepDown(); node.dispatchEvent(new Event('input', { bubbles: true })); node.dispatchEvent(new Event('change', { bubbles: true })); };
            up.onclick = () => { node.stepUp(); node.dispatchEvent(new Event('input', { bubbles: true })); node.dispatchEvent(new Event('change', { bubbles: true })); };
            node.addEventListener('input', sync);
            node.addEventListener('change', sync);
            wrap.addEventListener('focusin', sync);
            wrap.addEventListener('pointerenter', sync);
            new MutationObserver(sync).observe(node, { attributes: true, attributeFilter: ['disabled', 'min', 'max'] });
            wrap.append(down, node, up);
            node.uiSyncNumber = sync;
            sync();
            return wrap;
        };
        let active = null, sequence = 0;
        function hideHelp() { if (!active)
            return; clearTimeout(active.timer); if (active.tip.isConnected && active.tip.matches(':popover-open'))
            active.tip.hidePopover(); active.button.setAttribute('aria-expanded', 'false'); active = null; }
        function help(anchor, content) {
            const row = document.createElement(anchor.closest('summary,label') ? 'span' : 'div');
            row.className = 'ui-help-anchor';
            anchor.before(row);
            row.append(anchor);
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'ui-help-button';
            button.textContent = '?';
            button.setAttribute('aria-expanded', 'false');
            const tip = document.createElement('div');
            tip.id = 'ui-help-' + (++sequence);
            tip.className = 'ui-help-popover';
            tip.setAttribute('popover', 'manual');
            tip.setAttribute('role', 'tooltip');
            tip.append(content);
            button.setAttribute('aria-describedby', tip.id);
            button.setAttribute('aria-controls', tip.id);
            tip.uiHelpButton = button;
            row.append(button);
            (anchor.closest('dialog') || document.body).append(tip);
            const sync = () => button.setAttribute('aria-label', anchor.textContent.trim() + (en() ? ' help' : '\u8BF4\u660E'));
            sync();
            new MutationObserver(sync).observe(anchor, { childList: true, subtree: true, characterData: true });
            function show() {
                if (active?.button === button) {
                    clearTimeout(active.timer);
                    return;
                }
                hideHelp();
                active = { tip, button, pinned: false, timer: null };
                tip.showPopover();
                button.setAttribute('aria-expanded', 'true');
                const r = button.getBoundingClientRect(), width = Math.min(300, innerWidth - 24);
                tip.style.width = width + 'px';
                tip.style.maxHeight = Math.max(80, innerHeight - 24) + 'px';
                const h = tip.getBoundingClientRect().height;
                tip.style.left = Math.max(12, Math.min(r.left, innerWidth - width - 12)) + 'px';
                tip.style.top = Math.max(12, Math.min(r.bottom + 7 + h <= innerHeight - 12 ? r.bottom + 7 : r.top - h - 7, innerHeight - h - 12)) + 'px';
            }
            const leave = () => { if (active?.button === button && !active.pinned)
                active.timer = setTimeout(hideHelp, 180); };
            button.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch')
                show(); });
            button.addEventListener('pointerleave', leave);
            button.addEventListener('focus', show);
            button.addEventListener('blur', leave);
            button.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); if (active?.button === button && active.pinned)
                hideHelp();
            else {
                show();
                active.pinned = true;
            } });
            tip.addEventListener('pointerenter', () => { if (active)
                clearTimeout(active.timer); });
            tip.addEventListener('pointerleave', leave);
        }
        window.attachHelp = help;
        document.addEventListener('close', e => { if (active && e.target.contains(active.tip))
            hideHelp(); }, true);
        document.addEventListener('pointerdown', e => { if (active && !active.tip.contains(e.target) && !active.button.contains(e.target))
            hideHelp(); }, true);
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && active) {
            e.preventDefault();
            e.stopImmediatePropagation();
            hideHelp();
        } }, true);
        window.addEventListener('resize', hideHelp);
        document.addEventListener('scroll', e => { if (active && !active.tip.contains(e.target))
            hideHelp(); }, true);
        function upgrade() {
            if (active && (!active.button.isConnected || !active.tip.isConnected))
                hideHelp();
            for (const tip of document.querySelectorAll('.ui-help-popover'))
                if (!tip.uiHelpButton?.isConnected)
                    tip.remove();
            for (const node of document.querySelectorAll('input[type=number]')) {
                if (node.closest('.sec-number')) {
                    node.uiSyncNumber?.();
                    continue;
                }
                const label = () => document.querySelector('label[for="' + node.id + '"]')?.textContent.trim() || node.id;
                const marker = document.createTextNode('');
                node.before(marker);
                marker.replaceWith(window.numberControl(node, label));
            }
            for (const [key, selector] of [['ad.browserSettings', '#display-title'], ['ad.guestRules', 'label[for="guest-weekly"]'], ['audit.retention', '#audit-title'], ['ad.historyScope', '#source-history h4'], ['context.visibility', '.upload-context summary>[data-i18n="context.add"]']]) {
                const content = document.querySelector('[data-i18n="' + key + '"]'), anchor = document.querySelector(selector);
                if (content && anchor && !content.closest('.ui-help-popover'))
                    help(anchor, content);
            }
            for (const anchor of document.querySelectorAll('#source-detail .source-field>small[title]')) {
                const content = document.createElement('span');
                content.textContent = anchor.title;
                anchor.removeAttribute('title');
                help(anchor, content);
            }
        }
        upgrade();
        new MutationObserver(upgrade).observe(document.body, { childList: true, subtree: true });
    })();
}
`, "js/ui-entry.js": "export function initEntry() {\n    /* Shared send, pickup and login interactions; templates own the initial layout. */\n    const root = document.documentElement, q = s => document.querySelector(s);\n    const en = () => document.documentElement.lang === 'en';\n    const words = [];\n    const label = (node, zh, english) => { words.push([node, zh, english]); node.textContent = en() ? english : zh; return node; };\n    const button = (id, zh, english, cls = 'btn ghost') => { const n = document.createElement('button'); n.type = 'button'; n.id = id; n.className = cls; return label(n, zh, english); };\n    // Stable layout lives in HTML. This module only attaches interactions.\n    if (q('#dropzone') || q('#otp-row')) {\n        const help = q('#ui-send-help');\n        const helpDialog = document.createElement('dialog');\n        helpDialog.id = 'ui-send-help-dialog';\n        helpDialog.className = 'source-dialog ui-send-help-dialog';\n        helpDialog.setAttribute('aria-labelledby', 'ui-send-help-title');\n        const helpHead = document.createElement('div');\n        helpHead.className = 'source-heading';\n        const helpTitle = document.createElement('h3');\n        helpTitle.id = 'ui-send-help-title';\n        label(helpTitle, '\u4F7F\u7528\u5E2E\u52A9', 'Sharing help');\n        helpHead.append(helpTitle);\n        const helpBody = document.createElement('div');\n        helpBody.className = 'source-body ui-send-help-body';\n        for (const [zhTitle, enTitle, zhText, enText] of [\n            ['\u5982\u4F55\u53D1\u9001\uFF1F', 'How do I send?', '\u9009\u62E9\u6587\u4EF6\u6216\u8F93\u5165\u6587\u672C\uFF0C\u8BBE\u7F6E\u6709\u6548\u671F\u4E0E\u53EF\u53D6\u6B21\u6570\uFF0C\u63D0\u4EA4\u540E\u5C06\u751F\u6210\u7684\u53E3\u4EE4\u6216\u94FE\u63A5\u53D1\u7ED9\u5BF9\u65B9\u3002', 'Choose files or enter text, set expiry and pickup limits, then send the generated code or link to your recipient.'],\n            ['\u5BF9\u65B9\u5982\u4F55\u53D6\u4EF6\uFF1F', 'How does the recipient collect it?', '\u5728\u53D6\u4EF6\u9875\u8F93\u5165 6 \u4F4D\u53E3\u4EE4\uFF0C\u4E5F\u53EF\u4EE5\u76F4\u63A5\u6253\u5F00\u5206\u4EAB\u94FE\u63A5\u6216\u626B\u63CF\u4E8C\u7EF4\u7801\u3002', 'Enter the six-digit code on the pickup page, open the share link, or scan its QR code.'],\n            ['\u53E3\u4EE4\u65E0\u6CD5\u4F7F\u7528\u600E\u4E48\u529E\uFF1F', 'Why is a code unavailable?', '\u5148\u68C0\u67E5\u53E3\u4EE4\u662F\u5426\u6B63\u786E\uFF1B\u5206\u4EAB\u8FC7\u671F\u3001\u8FBE\u5230\u53D6\u4EF6\u6B21\u6570\u4E0A\u9650\u6216\u88AB\u5220\u9664\u540E\uFF0C\u5C06\u65E0\u6CD5\u7EE7\u7EED\u53D6\u4EF6\u3002\u53EF\u8054\u7CFB\u53D1\u9001\u8005\u91CD\u65B0\u5206\u4EAB\u3002', 'Check the code first. Expired, deleted or fully collected shares are unavailable. Ask the sender to share again.']\n        ]) {\n            const section = document.createElement('section'), heading = document.createElement('h4'), text = document.createElement('p');\n            label(heading, zhTitle, enTitle);\n            label(text, zhText, enText);\n            section.append(heading, text);\n            helpBody.append(section);\n        }\n        const helpFoot = document.createElement('div');\n        helpFoot.className = 'source-footer';\n        const closeHelp = button('ui-send-help-close', '\u77E5\u9053\u4E86', 'Got it', 'btn primary');\n        helpFoot.append(closeHelp);\n        helpDialog.append(helpHead, helpBody, helpFoot);\n        document.body.append(helpDialog);\n        help.onclick = () => helpDialog.showModal();\n        closeHelp.onclick = () => helpDialog.close();\n        helpDialog.addEventListener('close', () => help.focus());\n    }\n    if (q('#otp-row')) {\n        const card = q('#pickup-input-card'), result = q('#pickup-result'), boxes = [...document.querySelectorAll('.otp-box')], error = q('#pickup-error');\n        const submit = q('#ui-query'), clear = q('#ui-clear');\n        boxes.forEach((box, i) => box.setAttribute('aria-label', en() ? `Digit ${i + 1}` : `\u7B2C ${i + 1} \u4F4D\u53E3\u4EE4`));\n        submit.onclick = () => {\n            const value = boxes.map(n => n.value).join('');\n            if (!/^\\d{6}$/.test(value)) {\n                error.textContent = en() ? 'Enter all 6 digits.' : '\u8BF7\u8F93\u5165\u5B8C\u6574\u7684 6 \u4F4D\u6570\u5B57\u53E3\u4EE4\u3002';\n                error.hidden = false;\n                boxes.find(n => !n.value)?.focus();\n                return;\n            }\n            boxes[5].dispatchEvent(new Event('input', { bubbles: true }));\n        };\n        clear.onclick = () => { boxes.forEach(n => n.value = ''); error.hidden = true; result.hidden = true; boxes[0].focus(); };\n        const sync = () => { card.hidden = !result.hidden; root.classList.toggle('ui-pickup-found', !result.hidden); };\n        new MutationObserver(sync).observe(result, { attributes: true, attributeFilter: ['hidden'] });\n        sync();\n    }\n    const login = q('#admin-login');\n    if (login) {\n        const sync = () => root.classList.toggle('ui-login', !login.hidden);\n        new MutationObserver(sync).observe(login, { attributes: true, attributeFilter: ['hidden'] });\n        sync();\n        const token = q('#admin-token'), toggle = q('#ui-token-toggle');\n        function toggleLabel() {\n            const shown = token.type === 'text';\n            toggle.textContent = en() ? (shown ? 'Hide' : 'Show') : (shown ? '\u9690\u85CF' : '\u663E\u793A');\n            toggle.setAttribute('aria-label', en() ? (shown ? 'Hide admin token' : 'Show admin token') : (shown ? '\u9690\u85CF\u7BA1\u7406\u4EE4\u724C' : '\u663E\u793A\u7BA1\u7406\u4EE4\u724C'));\n        }\n        q('#lang-btn')?.addEventListener('click', toggleLabel);\n        toggle.onclick = () => { const show = token.type === 'password'; token.type = show ? 'text' : 'password'; toggle.setAttribute('aria-pressed', String(show)); toggleLabel(); };\n        token.required = true;\n        q('#btn-login').addEventListener('click', e => { if (!token.reportValidity()) {\n            e.preventDefault();\n            e.stopImmediatePropagation();\n        } }, true);\n    }\n    q('#lang-btn')?.addEventListener('click', () => { for (const [node, zh, english] of words)\n        node.textContent = en() ? english : zh; });\n}\n", "js/ui.js": `import { initEntry } from './ui-entry.js?v=732e7eabbd2c58e9';
import { initControls } from './ui-controls.js?v=732e7eabbd2c58e9';
export function initUi() {
    initEntry();
    initControls();
    const send = document.querySelector('.topbar a[data-i18n="nav.send"]');
    if (send?.target === '_blank') {
        send.classList.add('ui-new-tab');
        const title = () => send.title = document.documentElement.lang === 'en' ? 'Send (opens in a new tab)' : '\u53D1\u9001\uFF08\u65B0\u6807\u7B7E\u9875\u6253\u5F00\uFF09';
        document.querySelector('#lang-btn')?.addEventListener('click', title);
        title();
    }
    for (const link of document.querySelectorAll('.ui-public-nav a[aria-current="page"]'))
        link.addEventListener('click', event => { if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey)
            event.preventDefault(); });
}
`, "js/vendor/qrcode.js": `//---------------------------------------------------------------------
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

// Local ES-module entry; retain the upstream implementation and license.
export default qrcode;
`, "pickup.html": `<!doctype html>
<html lang="zh-CN" class="ui-enhanced ui-soft ui-pickup" data-ui-surface="pickup">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="\u8F93\u5165 6 \u4F4D\u53D6\u4EF6\u53E3\u4EE4,\u53D6\u51FA\u5206\u4EAB\u7ED9\u4F60\u7684\u6587\u4EF6\u6216\u6587\u672C">
<meta name="theme-color" content="#efe8d8">
<title data-i18n="doc.pickup">\u6587\u4EF6\u4E2D\u8F6C\u7AD9 - \u53D6\u4EF6</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>\u{1F4E6}</text></svg>">
<link rel="stylesheet" href="/style.css?v=732e7eabbd2c58e9">
<link rel="stylesheet" href="/ui.css?v=732e7eabbd2c58e9">
<script>
  document.documentElement.dataset.theme =
    localStorage.getItem('theme') ||
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
<\/script>
</head>
<body>
<div class="ui-header-band">
<header class="topbar ui-public-header">
  <div class="brand">
    <span class="logo">\u{1F4E6}</span>
    <div><b data-i18n="brand.name">\u6587\u4EF6\u4E2D\u8F6C\u7AD9</b><small data-i18n="brand.pickup">\u53D6\u4EF6</small></div>
  </div>
  <nav class="ui-public-nav" aria-label="\u53D1\u9001\u4E0E\u53D6\u4EF6" data-i18n-aria="ui.publicNav">
    <a href="/" class="admin-nav-link" aria-current="false" data-i18n="nav.send">\u53D1\u9001</a>
    <a href="/pickup" class="admin-nav-link" aria-current="page" data-i18n="nav.pickup">\u53D6\u4EF6</a>
  </nav>
  <div class="actions">
    <button id="lang-btn" class="icon-btn lang-btn" data-i18n-title="nav.lang">EN</button>
    <button id="theme-btn" class="icon-btn" data-i18n-title="nav.theme">\u{1F317}</button>
  </div>
</header>
</div>

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
    <div class="ui-pickup-actions"><button id="ui-query" class="btn primary" type="button" data-i18n="ui.viewShare">\u67E5\u770B\u5206\u4EAB</button><button id="ui-clear" class="btn ghost" type="button" data-i18n="ui.clear">\u6E05\u7A7A</button></div>
    <div id="pickup-error" class="error-box" hidden></div>
  </section>

  <div class="ui-pickup-caption" data-i18n="ui.shareFound">\u53D6\u4EF6\u6210\u529F</div>
  <section class="card" id="pickup-result" hidden></section>
</main>

<footer class="foot ui-send-footer">
  <div class="ui-footer-inner">
    <div class="ui-footer-about"><small data-i18n="ui.footerAbout">\u89C1\u5B57\u5982\u9762\uFF0C\u8BA9\u5206\u4EAB\u7B80\u5355\u4E00\u70B9\u3002</small></div>
    <nav class="ui-footer-links" aria-label="\u9875\u5C3E\u5BFC\u822A" data-i18n-aria="ui.footerNav">
      <button id="ui-send-help" class="ui-footer-link" type="button" data-i18n="ui.help">\u4F7F\u7528\u5E2E\u52A9</button>
      <a class="ui-footer-link" href="/" data-i18n="ui.toSend">\u524D\u5F80\u53D1\u9001</a>
    </nav>
    <div class="ui-footer-contact"><a href="mailto:iblykk@gmail.com" data-i18n="ad.contact">\u8054\u7CFB\u7AD9\u957F</a></div>
  </div>
</footer>

<script type="module" src="/js/pickup.js?v=732e7eabbd2c58e9"><\/script>
</body>
</html>
`, "style.css": `/* ============================================================
   \u90AE\u653F\u7968\u636E\u4E3B\u9898:\u725B\u76AE\u7EB8\u5E95 \xB7 \u58A8\u7EFF\u6CB9\u58A8 \xB7 \u6A59\u8272\u90AE\u6233 \xB7 \u786C\u6295\u5F71\u63CF\u8FB9
   \u7ED3\u679C\u5361\u7247 = \u53D6\u4EF6\u51ED\u8BC1(\u7968\u5934 + \u90AE\u6233\u53E3\u4EE4\u74E6\u7247 + \u6495\u7968\u7EBF + \u7968\u811A)
   ============================================================ */
:root {
  --bag: #efe8d8;            /* \u725B\u76AE\u7EB8\u5E95 */
  --paper: #fffdf6;          /* \u7968\u636E\u7EB8\u9762 */
  --ink: #26382c;            /* \u6CB9\u58A8(\u6B63\u6587/\u4E3B\u8272) */
  --line: #26382c;           /* \u63CF\u8FB9 */
  --muted: #6b7563;          /* \u892A\u8272\u58A8 */
  --stamp: #d96f32;          /* \u90AE\u6233\u6A59 */
  --stamp-dark: #b85a24;
  --ok: #3c7a52;
  --ok-soft: #eef3ec;
  --danger: #b3403a;
  --danger-soft: #f7e9e4;
  --warn: #a2661c;
  --warn-soft: #f8efdd;
  --rowbg: #f7f2e4;          /* \u6587\u4EF6\u884C\u5E95 */
  --track: #e6dfca;          /* \u8FDB\u5EA6\u69FD */
  --tkhead-bg: #26382c;      /* \u7968\u5934\u5E95 */
  --tkhead-fg: #f4efdd;      /* \u7968\u5934\u5B57 */
  --hard: rgba(38, 56, 44, 0.9);   /* \u786C\u6295\u5F71 */
  --mask: rgba(24, 20, 12, 0.55);  /* \u5F39\u7A97\u906E\u7F69 */
  --hard-soft: rgba(38, 56, 44, 0.35);
  --dots: rgba(38, 56, 44, 0.05);  /* \u7EB8\u9762\u7F51\u70B9\u7EB9\u7406 */
  --radius: 14px;
  --radius-sm: 9px;
  --serif: Georgia, 'Times New Roman', 'Songti SC', 'SimSun', serif;
  /* \u52A8\u6548\u8282\u594F */
  --t-fast: 0.15s;
  --t-med: 0.25s;
  --t-slow: 0.35s;
  --ease: cubic-bezier(0.2, 0, 0, 1);
}
[data-theme='dark'] {
  /* \u58A8\u84DD\u591C\u822A:\u85CF\u84DD\u7EB8\u9762,\u84DD\u6A59\u4E92\u8865,\u90AE\u6233\u6A59\u591C\u91CC\u6700\u8DF3 */
  --bag: #12161f;
  --paper: #1a2130;
  --ink: #e8e5d6;
  --line: #46516b;
  --muted: #a9b2c9;
  --stamp: #e68d4f;
  --stamp-dark: #c9702f;
  --ok: #7fc79c;
  --ok-soft: #254432;
  --danger: #e08a7c;
  --danger-soft: #462822;
  --warn: #d9ab63;
  --warn-soft: #413120;
  --rowbg: #222b44;
  --track: #151b28;
  --tkhead-bg: #33415c;
  --tkhead-fg: #f0eee0;
  --hard: rgba(0, 0, 0, 0.5);
  --hard-soft: rgba(0, 0, 0, 0.32);
  /* \u6DF1\u8272\u4E0B\u540C\u900F\u660E\u5EA6\u7684\u906E\u7F69\u51E0\u4E4E\u770B\u4E0D\u51FA\u6765,\u52A0\u6DF1\u4E00\u6863\u4FDD\u4F4F\u5F39\u7A97\u4E0E\u80CC\u666F\u7684\u5206\u79BB\u611F */
  --mask: rgba(4, 7, 14, 0.72);
  --dots: rgba(232, 229, 214, 0.05);
}

* { box-sizing: border-box; }
/* [hidden] \u515C\u5E95:\u7C7B\u4E0A\u7684 display:flex/inline-flex \u4F1A\u76D6\u8FC7 UA \u6837\u5F0F\u8868\u7684 [hidden]{display:none},
   \u5BFC\u81F4 .result-placeholder/.file-list \u7B49\u8BBE\u4E86 hidden \u4ECD\u53EF\u89C1 */
[hidden] { display: none !important; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, Roboto,
    'PingFang SC', 'HarmonyOS Sans SC', 'MiSans', 'Microsoft YaHei', sans-serif;
  font-size: 15px;
  line-height: 1.6;
  color: var(--ink);
  min-height: 100vh;
  /* \u7EB5\u5411 flex \u9AA8\u67B6:main \u5403\u6389\u5269\u4F59\u9AD8\u5EA6,\u9875\u811A\u8D34\u89C6\u53E3\u5E95 */
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(var(--dots) 1px, transparent 1px) 0 0 / 22px 22px,
    var(--bag);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

::selection { background: var(--stamp); color: #fff; }

/* \u7EC6\u6EDA\u52A8\u6761 */
* { scrollbar-width: thin; scrollbar-color: var(--line) transparent; }
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-thumb { background: var(--line); border-radius: 999px; }
::-webkit-scrollbar-track { background: transparent; }

/* ============ \u9876\u680F ============ */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 20px 14px;
  width: 100%; /* body \u6539\u7EB5\u5411 flex \u540E,auto margin \u6761\u76EE\u4F1A\u6536\u7F29\u5230\u5185\u5BB9\u5BBD,\u663E\u5F0F\u62C9\u6EE1\u518D\u7531 max-width \u6536\u53E3 */
  max-width: 720px;
  margin: 0 auto 26px;
  border-bottom: 3px double var(--line);
}
.topbar.wide { max-width: 1080px; }
.brand { display: flex; align-items: center; gap: 12px; }
.brand .logo {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  font-size: 21px;
  border-radius: 10px;
  background: var(--paper);
  border: 1.5px solid var(--line);
  box-shadow: 3px 3px 0 var(--hard);
}
.brand b {
  font-family: var(--serif);
  font-size: 18px;
  font-weight: 700;
  display: block;
  line-height: 1.25;
  letter-spacing: 0.05em;
}
.brand small { color: var(--muted); font-size: 12px; }
.actions { display: flex; align-items: center; gap: 8px; }

/* ============ \u5E03\u5C40 ============ */
.container { width: 100%; max-width: 720px; margin: 0 auto; padding: 8px 16px 48px; }
.container.wide { max-width: 1080px; }
.container.narrow { max-width: 460px; }
.card {
  background: var(--paper);
  border: 1.5px solid var(--line);
  border-radius: var(--radius);
  box-shadow: 6px 6px 0 var(--hard);
  padding: 24px;
  margin-bottom: 18px;
}
.card.center { text-align: center; }
.muted { color: var(--muted); }
.row-between { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 8px; }

main { flex: 1 0 auto; } /* \u6491\u6EE1\u89C6\u53E3\u5269\u4F59\u9AD8\u5EA6,\u628A\u9875\u811A\u63A8\u5230\u5E95 */
/* \u515C\u5E95:\u5373\u4F7F main \u6CA1\u6491\u5F00(\u5F02\u5E38\u9875\u9762)\u4E5F\u628A\u9875\u811A\u63A8\u5230\u5E95 */
.foot {
  margin-top: auto;
  text-align: center;
  color: var(--muted);
  font-size: 12px;
  letter-spacing: 0.14em;
  padding: 32px 16px 10px;
}

/* ============ \u90AE\u8DEF\u4E09\u6B65\u6761(\u67DC\u53F0\u4E0A\u65B9:\u5BC4\u4EF6\u2192\u51FA\u7968\u2192\u53D6\u4EF6) ============ */
.flow-strip {
  display: flex;
  align-items: center;
  background: var(--paper);
  border: 1.5px solid var(--line);
  border-radius: 13px;
  box-shadow: 6px 6px 0 var(--hard);
  padding: 18px 26px;
  margin-bottom: 24px;
  animation: fade-up var(--t-slow) var(--ease) both;
}
.flow-step { flex: 1; display: flex; align-items: center; gap: 13px; min-width: 0; }
.flow-dot {
  width: 46px; height: 46px; flex: none;
  border: 2.5px double var(--stamp); border-radius: 50%;
  display: grid; place-items: center;
  font-size: 20px; color: var(--stamp); font-family: var(--serif);
}
.flow-step:nth-child(1) .flow-dot { transform: rotate(-7deg); }
.flow-step:nth-child(3) .flow-dot { transform: rotate(5deg); }
.flow-step:nth-child(5) .flow-dot { transform: rotate(-4deg); }
.flow-tt b { display: block; font-size: 14px; font-family: var(--serif); letter-spacing: 0.06em; }
.flow-tt small { color: var(--muted); font-size: 12px; }
.flow-link { flex: 0 0 58px; border-top: 2px dashed var(--line); margin: 0 12px; position: relative; }
.flow-link::after {
  content: '\u2708'; position: absolute; right: -4px; top: -11px;
  font-size: 12px; color: var(--stamp);
}

/* ============ \u53D1\u9001\u9875:\u67DC\u53F0\u53CC\u680F(\u5DE6\u5BC4\u4EF6\u5355 / \u53F3\u56DE\u6267\u5E38\u9A7B) ============ */
/* \u5185\u5BB9\u4E0D\u8DB3\u4E00\u5C4F\u65F6\u67DC\u53F0\u4E0A/\u4E0B\u7559\u767D\u5747\u8861;\u8D85\u51FA\u4E00\u5C4F\u65F6 main \u9AD8\u5EA6=\u5185\u5BB9\u9AD8,\u81EA\u52A8\u9000\u5316\u4E3A\u9876\u5BF9\u9F50 */
main:has(> .send-grid) { display: flex; flex-direction: column; justify-content: center; }
.send-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 26px;
  align-items: stretch; /* \u4E24\u680F\u540C\u9AD8:\u7A7A\u6001\u65F6\u53F3\u680F\u5360\u4F4D\u6491\u5230\u4E0E\u8868\u5355\u5361\u9F50\u5E95 */
}
.form-card { min-width: 0; margin-bottom: 0; align-self: stretch; display: flex; flex-direction: column; } /* \u4E24\u680F\u9F50\u5E95:\u8868\u5355\u5361\u540C\u6837\u62C9\u4F38(\u56DE\u6267\u680F\u5185\u5BB9\u66F4\u9AD8\u65F6\u4E0D\u518D\u53C2\u5DEE) */
/* \u62C9\u4F38\u540E\u7684\u591A\u4F59\u9AD8\u5EA6\u4EA4\u7ED9\u8F93\u5165\u533A\u5438\u6536:\u62D6\u62FD\u533A/\u6587\u672C\u6846/\u6587\u4EF6\u961F\u5217\u957F\u9AD8,\u9009\u9879\u548C\u6309\u94AE\u4E0D\u88AB\u9876\u5F97\u60AC\u7A7A */
.form-card .panel { display: flex; flex-direction: column; flex: 1; }
.form-card .dropzone, .form-card textarea, .form-card .file-list { flex: 1; }
.form-card .dropzone { display: flex; flex-direction: column; justify-content: center; }
.card-cap, .side-cap {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin: -4px 0 16px;
  font-size: 11.5px;
  letter-spacing: 0.3em;
  color: var(--muted);
  font-weight: 600;
}
.card-cap .cap-date {
  font-family: var(--serif);
  color: var(--stamp);
  letter-spacing: 0.08em;
  font-size: 12.5px;
}
/* \u53F3\u680F\u968F\u884C\u9AD8\u62C9\u4F38:sticky \u5728 stretch \u4E0B\u4E0D\u518D\u751F\u6548(\u4E24\u680F\u6C38\u8FDC\u540C\u9AD8,\u65E0\u53EF\u7C98\u6EDE\u4F59\u91CF),\u6539\u4E3A flex \u7EB5\u5411\u680F */
.send-side { display: flex; flex-direction: column; min-width: 0; }
.send-side .results { margin-top: 0; }
/* \u56DE\u6267\u7A7A\u6001:\u5F85\u51FA\u7968\u90AE\u6233 */
.result-placeholder {
  border: 1.5px dashed var(--line);
  border-radius: 13px;
  padding: 38px 20px;
  min-height: 340px; /* \u4E0E\u5DE6\u680F\u8868\u5355\u5361\u89C6\u89C9\u5E73\u8861 */
  flex: 1; /* \u53F3\u680F\u88AB\u62C9\u4F38\u65F6\u5360\u4F4D\u968F\u4E4B\u957F\u9AD8,\u5E95\u8FB9\u4E0E\u8868\u5355\u5361\u5BF9\u9F50 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  animation: fade-up var(--t-slow) var(--ease) both;
}
.ph-postmark {
  width: 76px;
  height: 76px;
  margin: 0 auto 14px;
  border: 2.5px double var(--stamp);
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: var(--stamp);
  font-family: var(--serif);
  font-size: 10px;
  letter-spacing: 0.22em;
  text-indent: 0.22em; /* \u8865\u507F\u5B57\u8DDD,\u8BA9\u5706\u5F62\u90AE\u6233\u89C6\u89C9\u5C45\u4E2D */
  transform: rotate(-8deg);
  opacity: 0.8;
}
.result-placeholder p { margin: 0 0 4px; font-weight: 700; font-family: var(--serif); letter-spacing: 0.08em; }
.result-placeholder small { color: var(--muted); font-size: 12.5px; }
/* \u7A7A\u6001\u5185\u5D4C\u300C\u5728\u9014\u90AE\u8DEF\u300D\u7AD6\u5411\u65F6\u95F4\u7EBF:\u53F3\u680F\u4E0D\u7A7A */
.ph-route { margin-top: 24px; width: 100%; max-width: 300px; text-align: left; }
.ph-leg { display: flex; gap: 13px; align-items: flex-start; }
.ph-ic {
  width: 40px; height: 40px; flex: none;
  border: 1.5px solid var(--line); border-radius: 50%;
  background: var(--rowbg);
  display: grid; place-items: center; font-size: 17px;
}
.ph-leg:nth-child(1) .ph-ic { transform: rotate(-6deg); }
.ph-leg b { display: block; font-size: 13px; font-family: var(--serif); letter-spacing: 0.04em; }
.ph-leg small { color: var(--muted); font-size: 11.5px; line-height: 1.5; }
.ph-dash { width: 0; height: 22px; border-left: 2px dashed var(--line); margin: 3px 0 3px 19px; }
.ph-fine {
  margin-top: 22px; padding-top: 13px; width: 100%; max-width: 300px;
  border-top: 1.5px dashed var(--line);
  color: var(--muted); font-size: 11px; letter-spacing: 0.12em; text-align: center;
}

/* ============ \u6309\u94AE:\u90AE\u6233\u7AE0 ============ */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 18px;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--line);
  background: var(--paper);
  color: var(--ink);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  box-shadow: 2px 2px 0 var(--hard-soft);
  transition: transform var(--t-fast), box-shadow var(--t-fast), background var(--t-fast), color var(--t-fast), opacity var(--t-fast);
}
.btn:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 var(--hard-soft); }
.btn:active { transform: translate(1px, 1px); box-shadow: 1px 1px 0 var(--hard-soft); }
.btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: 2px 2px 0 var(--hard-soft); }
.btn.primary {
  background: var(--tkhead-bg);
  border-color: var(--line);
  color: var(--tkhead-fg);
  box-shadow: 3px 3px 0 var(--stamp);
}
.btn.primary:hover { transform: translate(-2px, -2px); box-shadow: 5px 5px 0 var(--stamp); }
.btn.primary:active { transform: translate(1px, 1px); box-shadow: 1px 1px 0 var(--stamp); }
.btn.primary:disabled { box-shadow: 2px 2px 0 var(--hard-soft); } /* \u7981\u7528\u65F6\u4E0D\u4EAE\u6A59\u5F71,\u907F\u514D\u8BEF\u8BFB\u4E3A\u53EF\u70B9 */
.btn.ghost { background: transparent; box-shadow: none; border-color: var(--line); }
.btn.ghost:hover { background: var(--rowbg); transform: none; }
.btn.danger { background: var(--danger); border-color: var(--danger); color: #fff; box-shadow: 2px 2px 0 var(--hard-soft); }
.btn.small { padding: 5px 12px; font-size: 13px; border-radius: 8px; }
.btn.block { width: 100%; margin-top: 16px; }
.btn-row { display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap; }
.icon-btn {
  background: transparent;
  border: none;
  font-size: 17px;
  cursor: pointer;
  color: var(--muted);
  padding: 7px 9px;
  border-radius: 8px;
  transition: background var(--t-fast), color var(--t-fast);
}
.icon-btn:hover { background: var(--rowbg); color: var(--ink); }
/* \u8BED\u8A00\u5207\u6362:\u663E\u793A\u76EE\u6807\u8BED\u8A00(\u7528\u5168\u58A8\u8272,\u907F\u514D\u6DF1\u8272\u6A21\u5F0F\u4E0B\u8FC7\u6DE1) */
.lang-btn { font-size: 13px; font-weight: 700; letter-spacing: 0.02em; padding: 7px 10px; color: var(--ink); }
.lang-float { position: fixed; top: 14px; right: 14px; z-index: 10; background: var(--paper); border: 1.5px solid var(--line); box-shadow: 3px 3px 0 var(--hard); }

/* ============ Tabs:\u7968\u6839 ============ */
.tabs { display: flex; gap: 10px; margin-bottom: 20px; }
.tab {
  flex: 1;
  padding: 9px;
  border: 1.5px dashed var(--line);
  background: transparent;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 600;
  color: var(--muted);
  cursor: pointer;
  transition: color var(--t-fast), background var(--t-fast), border-color var(--t-fast);
}
.tab:hover { color: var(--ink); background: var(--rowbg); }
.tab.active { border-style: solid; background: var(--tkhead-bg); border-color: var(--line); color: var(--tkhead-fg); }

/* ============ \u62D6\u62FD\u533A:\u5305\u88F9\u5355 ============ */
.dropzone {
  border: 2px dashed var(--line);
  border-radius: 12px;
  padding: 36px 16px;
  text-align: center;
  cursor: pointer;
  transition: background var(--t-fast);
  outline: none;
}
.dropzone:hover, .dropzone:focus-visible, .dropzone.dragover { background: var(--rowbg); }
.dz-icon { font-size: 34px; margin-bottom: 8px; transition: transform var(--t-med) ease; }
.dropzone:hover .dz-icon, .dropzone.dragover .dz-icon { transform: scale(1.1) translateY(-2px); }
.dropzone p { margin: 0 0 6px; font-size: 14px; }
.dropzone p b { font-weight: 700; }
.dropzone small { color: var(--muted); font-size: 13px; }

/* ============ \u6587\u4EF6\u961F\u5217(\u591A\u9009\u6279\u91CF) ============ */
.file-list { display: flex; flex-direction: column; gap: 8px; }
.file-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--rowbg);
  border: 1.5px solid var(--line);
  border-radius: 10px;
  padding: 10px 12px;
  overflow: hidden;
  animation: fade-up var(--t-slow) var(--ease) both;
}
.file-row.uploading { background: var(--warn-soft); }
.file-row.done { background: var(--ok-soft); }
.file-row.fail { background: var(--danger-soft); }
.fr-icon { font-size: 20px; flex: none; }
.fr-meta { flex: 1; min-width: 0; }
.fr-meta b { display: block; font-size: 13.5px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fr-meta small { color: var(--muted); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fr-status { font-size: 12.5px; color: var(--muted); font-variant-numeric: tabular-nums; white-space: nowrap; font-family: var(--serif); }
.file-row.done .fr-status { color: var(--ok); font-weight: 700; }
.file-row.fail .fr-status { color: var(--danger); font-weight: 700; }
.fr-remove { padding: 5px 7px; font-size: 13px; flex: none; }
/* \u8FF7\u4F60\u8FDB\u5EA6\u6761:\u8D34\u884C\u5E95\u7F18(\u8721\u5C01\u6761) */
.fr-bar {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  width: 0;
  border-radius: 999px;
  background: var(--stamp);
  transition: width var(--t-med) ease;
}
.file-row.done .fr-bar { width: 100%; background: var(--ok); }
.file-row.fail .fr-bar { width: 100%; background: var(--danger); }

/* ============ \u6587\u672C\u8F93\u5165 ============ */
textarea {
  width: 100%;
  border: 1.5px solid var(--line);
  border-radius: 10px;
  background: var(--paper);
  color: var(--ink);
  padding: 12px 14px;
  font-size: 14px;
  font-family: inherit;
  line-height: 1.65;
  resize: vertical;
  transition: box-shadow var(--t-fast);
}
textarea:focus { outline: none; box-shadow: 3px 3px 0 var(--hard-soft); }

/* ============ \u9009\u9879 segmented:\u90AE\u8D44\u6807\u7B7E ============ */
.options { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 22px; margin: 22px 0 6px; }
.opt-group label {
  display: block;
  font-size: 11.5px;
  color: var(--muted);
  letter-spacing: 0.18em;
  margin-bottom: 7px;
}
.seg { display: flex; gap: 6px; flex-wrap: wrap; }
.seg button {
  padding: 6px 13px;
  border: 1.5px solid var(--line);
  background: transparent;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  cursor: pointer;
  transition: color var(--t-fast), background var(--t-fast);
}
.seg button:hover { color: var(--ink); background: var(--rowbg); }
.seg button.active { background: var(--stamp); border-color: var(--stamp); color: #fff; }

/* ============ \u8FDB\u5EA6\u6761 ============ */
.progress { margin-top: 18px; }
.bar {
  height: 12px;
  background: var(--track);
  border: 1.5px solid var(--line);
  border-radius: 999px;
  overflow: hidden;
}
.bar > div {
  height: 100%;
  width: 0;
  background: linear-gradient(90deg, var(--stamp-dark), var(--stamp));
  border-radius: 999px;
  transition: width var(--t-med) ease;
}
.progress small { color: var(--muted); font-variant-numeric: tabular-nums; }

/* ============ \u7ED3\u679C:\u53D6\u4EF6\u51ED\u8BC1(\u7968\u636E) ============ */
.results { display: flex; flex-direction: column; gap: 16px; margin-top: 20px; }
.result {
  background: var(--paper);
  border: 1.5px solid var(--line);
  border-radius: 13px;
  box-shadow: 6px 6px 0 var(--hard);
  overflow: hidden;
}
/* \u6279\u91CF\u5934\u90E8 */
.result-batch-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 13px 16px;
  border-radius: 13px;
  background: var(--ok-soft);
  border: 1.5px solid var(--line);
  box-shadow: 4px 4px 0 var(--hard);
}
.result-batch-head .result-title { margin: 0; }
.result-batch-head .btn-row { margin: 0; flex-wrap: nowrap; }
.result-title { margin: 0; font-weight: 700; font-size: 14.5px; }
.result-title.batch { font-family: var(--serif); letter-spacing: 0.04em; }
/* \u7968\u5934 */
.tk-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--tkhead-bg);
  color: var(--tkhead-fg);
  padding: 9px 16px;
  font-size: 12px;
  letter-spacing: 0.3em;
  font-weight: 600;
}
.tk-head .tk-no { letter-spacing: 0.08em; color: var(--stamp); font-family: var(--serif); }
/* \u7968\u8EAB */
.tk-body { padding: 18px 16px 14px; text-align: center; }
.result-main { display: flex; align-items: center; justify-content: center; gap: 22px; flex-wrap: wrap; }
.result-col { display: flex; flex-direction: column; align-items: center; min-width: 0; }
.result-file-name { font-size: 13px; color: var(--muted); word-break: break-all; margin-bottom: 2px; }
/* \u53E3\u4EE4\u74E6\u7247:\u90AE\u6233 */
.code { display: flex; justify-content: center; gap: 8px; margin: 8px 0 10px; }
.code span {
  display: grid;
  place-items: center;
  width: 46px;
  height: 58px;
  font-family: var(--serif);
  font-size: 30px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--ink);
  background: var(--paper);
  border: 1.5px solid var(--line);
  border-radius: 7px;
  box-shadow: 2px 2px 0 var(--hard-soft);
  user-select: all;
}
.code span:nth-child(odd) { transform: rotate(-1.6deg); }
.code span:nth-child(even) { transform: rotate(1.4deg); }
.result-link { color: var(--muted); font-size: 12px; word-break: break-all; }
.result-meta { color: var(--muted); font-size: 12.5px; margin-top: 8px; }
/* \u4E8C\u7EF4\u7801:\u767D\u5E95\u4FDD\u8BC1\u6DF1\u8272\u6A21\u5F0F\u53EF\u626B\u63CF */
.qr-wrap {
  flex: none;
  background: #fff;
  padding: 8px;
  border-radius: 9px;
  border: 1.5px solid var(--line);
  box-shadow: 2px 2px 0 var(--hard-soft);
}
.qr-wrap svg { display: block; width: 110px; height: 110px; }
.qr-hint { text-align: center; font-size: 10.5px; color: #6b7280; margin-top: 5px; letter-spacing: 0.18em; }
/* \u6495\u7968\u7EBF(\u5E26\u7F3A\u53E3) */
.tk-tear { border-top: 2px dashed var(--line); position: relative; margin: 0 14px; }
.tk-tear::before, .tk-tear::after {
  content: '';
  position: absolute;
  top: -9px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--bag);
  border: 1.5px solid var(--line);
}
.tk-tear::before { left: -24px; }
.tk-tear::after { right: -24px; }
/* \u7968\u811A */
.tk-foot { display: flex; gap: 10px; justify-content: center; padding: 14px; flex-wrap: wrap; }
.result .btn-row { justify-content: center; }

/* ============ \u7279\u6027\u5E26(\u67DC\u53F0\u4E0B\u65B9:\u4E00\u6392\u4E1A\u52A1\u516C\u544A\u7AE0) ============ */
.feat-band { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 28px; }
.feat {
  background: var(--paper);
  border: 1.5px dashed var(--line);
  border-radius: 11px;
  box-shadow: 3px 3px 0 var(--hard-soft);
  padding: 14px 16px;
  display: flex; gap: 12px; align-items: center;
  animation: fade-up var(--t-slow) var(--ease) both;
}
.feat:nth-child(2) { transform: rotate(0.4deg); }
.feat:nth-child(3) { transform: rotate(-0.3deg); }
.feat-ic {
  width: 40px; height: 40px; flex: none;
  border: 2px double var(--stamp); border-radius: 50%;
  display: grid; place-items: center; font-size: 17px;
}
.feat b { display: block; font-size: 13.5px; font-family: var(--serif); letter-spacing: 0.04em; }
.feat small { color: var(--muted); font-size: 12px; }

/* ============ \u53D6\u4EF6\u9875 ============ */
h2.title { margin: 8px 0 6px; font-size: 22px; font-weight: 700; line-height: 1.3; font-family: var(--serif); letter-spacing: 0.04em; }
.pk-sub { margin: 0 0 16px; font-size: 13.5px; }
.error-box {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  background: var(--danger-soft);
  border: 1.5px solid var(--danger);
  color: var(--danger);
  font-size: 14px;
}
.share-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--rowbg);
  border: 1.5px dashed var(--line);
  border-radius: 10px;
  padding: 16px;
}
.sc-icon { font-size: 32px; }
.sc-meta { flex: 1; min-width: 0; text-align: left; }
.sc-meta b { display: block; font-size: 15px; font-weight: 700; word-break: break-all; }
.sc-meta small { color: var(--muted); }
.meta-line { color: var(--muted); font-size: 13px; margin: 12px 2px 0; text-align: left; }
pre.text-body {
  background: var(--rowbg);
  border: 1.5px solid var(--line);
  border-radius: 10px;
  padding: 14px 16px;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 13px;
  line-height: 1.7;
  max-height: 340px;
  overflow: auto;
  margin: 0 0 4px;
  text-align: left;
}

/* ============ \u7BA1\u7406\u9875 ============ */
.stats-row { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 16px; margin-bottom: 20px; }
.stats-counts { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }
.stats-counts .stat-card { display: flex; flex-direction: column; justify-content: center; gap: 6px; min-width: 0; }
.stat-card {
  background: var(--paper);
  border: 1.5px solid var(--line);
  border-radius: 11px;
  padding: 16px 12px;
  text-align: center;
  box-shadow: 3px 3px 0 var(--hard-soft);
}
.stat-card b { display: block; font-size: 24px; font-weight: 700; font-family: var(--serif); font-variant-numeric: tabular-nums; line-height: 1.3; }
.stat-card small { color: var(--muted); font-size: 12px; letter-spacing: 0.08em; }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th, td { text-align: left; padding: 10px; border-bottom: 1px dashed var(--line); white-space: nowrap; }
th { color: var(--muted); font-weight: 600; font-size: 11.5px; letter-spacing: 0.1em; }
tbody tr:last-child td { border-bottom: none; }
tbody tr:hover td { background: var(--rowbg); }
td.wrap { white-space: normal; min-width: 140px; max-width: 260px; overflow: hidden; text-overflow: ellipsis; }
.badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  border: 1.5px solid transparent;
  font-size: 12px;
  font-weight: 600;
}
.badge.active { background: var(--ok-soft); color: var(--ok); border-color: var(--ok); }
.badge.expired { background: var(--danger-soft); color: var(--danger); border-color: var(--danger); }
.badge.exhausted { background: var(--warn-soft); color: var(--warn); border-color: var(--warn); }
.badge.kind-file { background: transparent; color: var(--stamp); border-color: var(--stamp); }
.badge.kind-text { background: transparent; color: var(--muted); border-color: var(--line); }
.token-input {
  width: 100%;
  padding: 11px 13px;
  border: 1.5px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--paper);
  color: var(--ink);
  font-size: 14px;
  margin: 12px 0 4px;
  transition: box-shadow var(--t-fast);
}
.token-input:focus { outline: none; box-shadow: 3px 3px 0 var(--hard-soft); }
.admin-foot { margin-top: 18px; display: flex; justify-content: flex-end; }
.pager-btns { display: flex; gap: 8px; }

/* ============ \u4F5C\u5E9F\u786E\u8BA4\u5F39\u7A97(\u7BA1\u7406\u9875):\u7968\u636E\u5361 + \u786C\u504F\u79FB\u6295\u5F71 ============ */
.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: var(--mask);
}
.modal-mask[hidden] { display: none; }
.modal-card {
  background: var(--paper);
  border: 2px solid var(--line);
  border-radius: var(--radius);
  box-shadow: 8px 8px 0 var(--hard);
  padding: 22px 22px 18px;
  width: min(430px, 100%);
  animation: pop-in 0.18s ease-out;
}
.modal-title { margin: 0 0 14px; font-family: var(--serif); font-size: 19px; letter-spacing: 0.04em; }
.del-target {
  border: 1.5px dashed var(--line);
  border-radius: var(--radius-sm);
  background: var(--rowbg);
  padding: 10px 14px;
  margin-bottom: 12px;
  display: grid;
  gap: 6px;
}
.del-line { display: flex; gap: 10px; align-items: baseline; min-width: 0; }
.del-line > :first-child { flex: 0 0 4em; font-size: 12px; letter-spacing: 0.08em; }
.del-line > :last-child { min-width: 0; overflow-wrap: anywhere; }
.del-warn { margin: 0 0 16px; color: var(--danger); font-size: 13px; line-height: 1.5; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
@keyframes pop-in { from { transform: translateY(8px); opacity: 0; } }

/* ============ toast:\u58A8\u6761 ============ */
#toast-host {
  position: fixed;
  bottom: calc(24px + env(safe-area-inset-bottom, 0px));
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 99;
  pointer-events: none;
}
.toast {
  background: var(--tkhead-bg);
  color: var(--tkhead-fg);
  padding: 10px 18px;
  border: 1.5px solid var(--line);
  border-radius: 10px;
  font-size: 14px;
  box-shadow: 3px 3px 0 var(--hard);
  opacity: 0;
  transform: translateY(8px);
  transition: opacity var(--t-med), transform var(--t-med);
}
.toast.show { opacity: 1; transform: translateY(0); }
.toast.ok { background: var(--ok); border-color: var(--ok); color: #fff; }
.toast.error { background: var(--danger); border-color: var(--danger); color: #fff; }

/* ============ \u79FB\u52A8\u7AEF ============ */
/* \u53CC\u680F\u5E76\u56DE\u5355\u680F:\u53F3\u680F\u56DE\u5230\u8868\u5355\u4E0B\u65B9,\u7A7A\u6001\u5360\u4F4D\u9690\u85CF */
@media (max-width: 880px) {
  .send-grid { grid-template-columns: 1fr; gap: 18px; }
  .send-side .side-cap, .result-placeholder { display: none; }
  /* \u90AE\u8DEF\u6761\u7AD6\u6392,\u8FDE\u7EBF\u8F6C\u4E3A\u5411\u4E0B\u865A\u7EBF;\u7279\u6027\u5E26\u4E24\u5217 */
  .flow-strip { flex-direction: column; align-items: stretch; gap: 14px; padding: 16px 18px; }
  .flow-link { flex: 0 0 0; width: 0; height: 26px; border-top: none; border-left: 2px dashed var(--line); margin: 0 0 0 22px; }
  .flow-link::after { right: -6px; top: 12px; }
  .feat-band { grid-template-columns: repeat(2, 1fr); margin-top: 20px; gap: 12px; }
}
@media (max-width: 640px) {
  .options { grid-template-columns: 1fr; }
  .card { padding: 18px; }
  .topbar { padding: 14px 16px 8px; }
  .code { gap: 6px; }
  .code span { width: 42px; height: 52px; font-size: 27px; }
  .otp-row { gap: 6px; }
  .otp-box { width: 42px; height: 54px; font-size: 24px; }
  .btn-row .btn { flex: 1; }
  th, td { padding: 8px 6px; }
  .row-between { flex-wrap: wrap; }
  .stat-card b { font-size: 21px; }
  .result-main { gap: 14px; }
  .qr-wrap svg { width: 92px; height: 92px; }
  .tk-tear::before, .tk-tear::after { width: 13px; height: 13px; top: -7.5px; }
  .tk-tear::before { left: -20px; }
  .tk-tear::after { right: -20px; }
}

/* ============ \u52A8\u6548 ============ */
@keyframes fade-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes pop { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: none; } }
.card { animation: fade-up var(--t-slow) var(--ease) both; }
.result:not([hidden]) { animation: pop var(--t-slow) var(--ease) both; }

@keyframes shake {
  10%, 90% { transform: translateX(-2px); }
  20%, 80% { transform: translateX(3px); }
  30%, 50%, 70% { transform: translateX(-5px); }
  40%, 60% { transform: translateX(5px); }
}
.shake { animation: shake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }

/* \u952E\u76D8\u7126\u70B9\u53EF\u89C1\u6027 */
.btn:focus-visible, .icon-btn:focus-visible, .tab:focus-visible,
.seg button:focus-visible, a:focus-visible, .otp-box:focus-visible {
  outline: 2px solid var(--stamp);
  outline-offset: 2px;
}

/* \u53D6\u4EF6\u9875:6 \u683C\u53E3\u4EE4\u8F93\u5165(\u90AE\u6233\u683C) */
.otp-row { display: flex; gap: 8px; justify-content: center; margin: 4px 0 8px; }
.otp-box {
  width: 46px;
  height: 58px;
  padding: 0;
  text-align: center;
  font-family: var(--serif);
  font-size: 26px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  border: 1.5px solid var(--line);
  border-radius: 9px;
  background: var(--paper);
  color: var(--ink);
  caret-color: var(--stamp);
  box-shadow: 2px 2px 0 var(--hard-soft);
  transition: box-shadow var(--t-fast), border-color var(--t-fast);
}
.otp-box:focus { outline: none; border-color: var(--stamp); box-shadow: 3px 3px 0 var(--stamp); }

/* \u8FDB\u5EA6\u6761:\u7B49\u5F85\u6001\u6D41\u5149 */
@keyframes pending-slide { from { background-position: 0 0; } to { background-position: 34px 0; } }
.bar > div.pending {
  background-image: repeating-linear-gradient(
    45deg,
    rgba(255, 255, 255, 0) 0,
    rgba(255, 255, 255, 0) 12px,
    rgba(255, 255, 255, 0.3) 12px,
    rgba(255, 255, 255, 0.3) 24px
  );
  background-size: 34px 34px;
  animation: pending-slide 0.8s linear infinite;
}

.mono { font-family: ui-monospace, 'SF Mono', 'Cascadia Mono', Consolas, 'Courier New', monospace; font-variant-numeric: tabular-nums; }

/* \u52A8\u753B\u654F\u611F\u7528\u6237 */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

.storage-card { padding: 14px 18px; text-align: left; min-width: 0; }
.storage-card small { letter-spacing: 0; }
.storage-value { display: flex; align-items: baseline; flex-wrap: wrap; gap: 6px; margin: 6px 0 8px; }
.storage-value b { font-size: 24px; white-space: nowrap; }
.storage-total { font-size: 14px; color: var(--muted); white-space: nowrap; }
.storage-meter { display: block; width: 100%; height: 6px; border: 0; background: var(--track); border-radius: 4px; overflow: hidden; }
.storage-meter::-webkit-meter-bar { background: var(--track); border: 0; border-radius: 4px; height: 6px; }
.storage-meter::-webkit-meter-optimum-value { background: var(--stamp); border-radius: 4px; }
.storage-meter::-moz-meter-bar { background: var(--stamp); border-radius: 4px; }
.storage-caption { display: flex; justify-content: space-between; gap: 8px; margin-top: 6px; }
@media (max-width: 1000px) {
  .stats-row { grid-template-columns: minmax(0, 1fr); gap: 12px; }
  .stats-counts .stat-card { min-height: 90px; }
}
@media (max-width: 540px) {
  .stats-counts { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .stats-counts .stat-card:last-child { grid-column: 1 / -1; flex-direction: row; align-items: center; gap: 12px; min-height: 60px; }
}

/* Upload source labels and private admin details. */
.source-cell { min-width: 150px; max-width: 210px; white-space: normal; }
.source-cell small { display: block; font-size: 11px; overflow-wrap: anywhere; }
.source-link { padding: 0; border: 0; background: none; color: var(--ink); font: inherit; text-align: left; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; overflow-wrap: anywhere; }
.source-link:hover { color: var(--stamp); }
.source-dialog { width: min(500px, calc(100vw - 24px)); max-height: calc(100dvh - 24px); overflow: hidden; padding: 0; border: 1px solid var(--line); border-radius: var(--radius); color: var(--ink); background: var(--paper); box-shadow: 0 20px 64px var(--mask); }
.source-dialog[open] { display: flex; flex-direction: column; }
.source-dialog::backdrop { background: var(--mask); }
.source-heading { display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 4px 8px; padding: 8px 12px; border-bottom: 1px solid var(--line); }
.source-heading h3 { margin: 0; font-size: 16px; }
.source-heading h3:focus { outline: none; }
.source-body { padding: 8px 12px; overflow: auto; min-height: 0; }
#source-detail { display: grid; grid-template-columns: minmax(0, 1fr); gap: 4px; font-size: 13px; }
#source-detail:not(:has(.source-field)) { display: block; overflow-wrap: anywhere; }
.source-field { min-width: 0; display: grid; grid-template-columns: 100px minmax(0, 1fr); align-items: baseline; gap: 10px; }
.source-field-wide { grid-column: 1 / -1; }
.source-field small { font-family: inherit; font-size: 12px; font-weight: 400; }
.source-field span { overflow-wrap: anywhere; }
.source-field.mono span { font-size: 12px; line-height: 1.6; }
#source-form { display: grid; grid-template-columns: 80px minmax(0, 1fr); align-items: center; gap: 4px 8px; margin-top: 6px; padding-top: 6px; border-top: 1px dashed var(--line); }
#source-form label { font-size: 12px; color: var(--muted); }
#source-note { width: 100%; min-width: 0; padding: 5px 8px; background: var(--bag); color: var(--ink); border: 1px solid var(--line); border-radius: var(--radius-sm); font: inherit; font-size: 16px; }
#source-note:focus-visible { outline: 2px solid var(--stamp); outline-offset: 2px; }
#source-error { grid-column: 1 / -1; margin: 4px 0 0; }
.source-footer { flex-shrink: 0; display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; padding: 8px 12px; background: var(--paper); border-top: 1px solid var(--line); }
.source-footer .btn { min-height: 36px; padding: 5px 12px; }
@media (max-width: 420px) {
  .source-heading { padding: 8px 12px; }
  .source-body { padding: 8px 12px; }
  .source-field, #source-form { grid-template-columns: 84px minmax(0, 1fr); column-gap: 8px; }
  .source-footer { padding: 8px 12px; }
  .source-footer .btn { flex: 1; min-height: 40px; }
}

/* Keep the type visible above the filename baseline, outside its ellipsis. */
.share-filename-line { display: flex; align-items: baseline; gap: 5px; width: clamp(150px, 18vw, 220px); }
.share-filename { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.share-kind.badge { flex: none; position: relative; top: -0.45em; padding: 0 4px; font-size: 10px; line-height: 1.4; }

/* Phone layouts keep the primary action close to the input. */
@media (max-width: 640px) {
  .topbar { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; padding: 10px 12px; margin-bottom: 12px; }
  .brand { min-width: 0; gap: 8px; }
  .brand .logo { width: 34px; height: 34px; font-size: 18px; flex: none; }
  .brand b { font-size: 16px; letter-spacing: 0; }
  .brand small { display: block; font-size: 11px; }
  .actions { gap: 2px; }
  .actions .btn, .actions .icon-btn { min-height: 40px; min-width: 40px; padding: 7px 8px; }
  .container { padding: 4px 12px 24px; }
  .card { padding: 14px; box-shadow: 3px 3px 0 var(--hard); }
  main:has(> .send-grid) { justify-content: flex-start; }
  .send-grid { grid-template-columns: minmax(0, 1fr); gap: 12px; }
  .flow-strip { flex-direction: row; gap: 6px; padding: 10px; margin-bottom: 12px; box-shadow: 3px 3px 0 var(--hard); }
  .flow-step { flex-direction: column; gap: 3px; text-align: center; }
  .flow-dot { width: 28px; height: 28px; font-size: 15px; }
  .flow-tt b { font-size: 12px; letter-spacing: 0; }
  .flow-tt small, .flow-link { display: none; }
  .card-cap { margin: 0 0 10px; letter-spacing: 0.1em; }
  .tabs { gap: 8px; margin-bottom: 12px; }
  .tab { min-height: 42px; }
  .dropzone { padding: 20px 12px; }
  .dz-icon { font-size: 28px; margin-bottom: 4px; }
  .options { gap: 12px; margin: 14px 0 0; }
  .opt-group label { margin-bottom: 5px; letter-spacing: 0.04em; }
  .seg { display: grid; grid-auto-columns: minmax(0, 1fr); grid-auto-flow: column; gap: 5px; }
  .seg button { min-height: 40px; padding: 6px 4px; font-size: 12px; }
  .btn.block { min-height: 44px; margin-top: 12px; }
  textarea, .token-input { font-size: 16px; }
  .file-row { gap: 8px; padding: 8px; }
  .fr-remove { min-width: 40px; min-height: 40px; }
  .fr-status { max-width: 5em; white-space: normal; overflow-wrap: anywhere; font-size: 12px; }
  .feat-band { gap: 8px; margin-top: 14px; }
  .feat { gap: 8px; padding: 10px; align-items: flex-start; }
  .feat-ic { width: 28px; height: 28px; font-size: 14px; }
  .feat > div { min-width: 0; overflow-wrap: anywhere; }
  .feat b { font-size: 12px; letter-spacing: 0; }
  .feat small { font-size: 11px; }
  .foot { padding: 18px 12px 12px; letter-spacing: 0.06em; }
  .otp-row, .code { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 6px; width: 100%; max-width: 320px; margin-inline: auto; }
  .otp-box, .code span { width: 100%; min-width: 0; height: 48px; font-size: 24px; }
  .code { padding-inline: 2px; } /* Leave room for the tilted digit borders. */
  .result-col { width: 100%; }
  .result-batch-head { padding: 12px; gap: 8px; }
  .result-batch-head .btn-row { width: 100%; flex-wrap: wrap; }
  .result-batch-head .btn { min-width: 0; padding: 8px; }
  .tk-head { gap: 8px; letter-spacing: 0.1em; }
  .tk-body { padding: 14px 12px; }
  .tk-foot { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 12px; gap: 8px; }
  .tk-foot .btn { min-height: 42px; padding: 8px 6px; }
  .sc-meta small { overflow-wrap: anywhere; }
  .modal-mask { padding: 12px; }
  .modal-card { padding: 16px; max-height: calc(100dvh - 24px); overflow: auto; }
  .modal-actions .btn { flex: 1; min-height: 42px; padding: 8px; }
  .stats-counts { grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px; }
  .stats-counts .stat-card { grid-column: span 2; min-height: 66px; padding: 10px 6px; gap: 3px; }
  .stats-counts .stat-card:nth-last-child(-n+2) { grid-column: span 3; }
  .stats-counts .stat-card:last-child { flex-direction: column; }
  .stat-card small { letter-spacing: 0; font-size: 11px; }
  .storage-card { padding: 12px 14px; }
  #admin-panel .table-wrap { overscroll-behavior-x: contain; }
  #admin-panel td .btn { min-height: 40px; }
  .admin-pager { display: grid; grid-template-columns: 1fr auto; gap: 10px; margin-top: 14px; }
  .admin-pager .pager-btns { display: flex; gap: 6px; }
  .admin-pager .btn { min-height: 40px; padding-inline: 8px; }
  .admin-pager #page-info { grid-column: 1 / -1; grid-row: 2; text-align: center; }
}
@media (max-width: 360px) {
  .topbar .brand .logo { display: none; }
  .feat { gap: 6px; padding: 8px; }
}

.file-detail-link { padding: 0; border: 0; background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
.file-detail-link:hover { color: var(--stamp); }
.guest-settings { margin: 0 0 12px; font-size: 13px; }
.guest-settings summary { cursor: pointer; padding: 4px 0; }
.login-guard-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 8px 0; }
.login-guard-heading .btn, .login-guard-row .btn { flex-shrink: 0; }
.login-guard-bans { display: grid; gap: 8px; max-height: 320px; overflow: auto; }
.login-guard-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 0; border-top: 1px dashed var(--line); }
.login-guard-info { display: grid; gap: 3px; min-width: 0; overflow-wrap: anywhere; }
@media (max-width: 540px) { #login-protection .btn { min-height: 40px; } }
#guest-policy-form { display: flex; flex-wrap: wrap; align-items: end; gap: 10px; margin: 10px 0; }
#guest-policy-form label { display: grid; gap: 4px; }
#guest-policy-form input { width: 110px; padding: 7px 8px; border: 1px solid var(--line); border-radius: 6px; background: var(--paper); color: var(--ink); font: inherit; font-size: 16px; }
#guest-policy-form input:focus-visible { outline: 2px solid var(--stamp); outline-offset: 2px; }
#upload-policy-hint { display: block; margin: 0 0 8px; font-size: 12px; }
.seg button:disabled { opacity: .4; cursor: not-allowed; }
.file-detail-link:focus-visible { outline: 2px solid var(--stamp); outline-offset: 2px; }
.file-detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 12px; font-size: 13px; line-height: 1.45; overflow-wrap: anywhere; }
.file-wide { grid-column: 1 / -1; }
.file-identity { display: grid; gap: 2px; padding-bottom: 6px; border-bottom: 1px dashed var(--line); }
.file-identity strong { font-size: 14px; font-weight: 600; line-height: 1.5; }
.file-field { display: grid; align-content: start; gap: 1px; min-width: 0; }
.file-field-value { min-width: 0; font-variant-numeric: tabular-nums; }
.file-field .badge { white-space: normal; }
.file-source-link { max-width: 100%; text-align: left; overflow-wrap: anywhere; }
.text-share-body { margin: 0; padding: 12px; min-width: 0; max-height: min(42vh, 360px); overflow: auto; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--rowbg); font: 13px/1.65 ui-monospace, Consolas, monospace; white-space: pre-wrap; overflow-wrap: anywhere; tab-size: 4; }
.text-share-body:focus-visible { outline: 2px solid var(--stamp); outline-offset: 2px; }
.text-edit-field { display: grid; gap: 6px; min-width: 0; }
.text-edit-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.text-edit-heading small { font-variant-numeric: tabular-nums; white-space: nowrap; }
#share-edit-text { box-sizing: border-box; width: 100%; min-height: 160px; height: clamp(160px, 28vh, 240px); resize: vertical; padding: 10px 12px; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--rowbg); color: var(--ink); font: 14px/1.65 ui-monospace, Consolas, monospace; }
#share-edit-text:focus-visible { outline: 2px solid var(--stamp); outline-offset: 2px; }
#share-edit-text:disabled { opacity: .65; }
@media (max-width: 600px) { #share-edit-text { font-size: 16px; } }
#file-dialog .source-body { padding-top: 8px; padding-bottom: 8px; }
.retention-settings { padding-bottom: 12px; margin-bottom: 8px; border-bottom: 1px dashed var(--line); }
#retention-form { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; font-size: 13px; }
#retention-days { width: 80px; padding: 6px 8px; border: 1px solid var(--line); border-radius: 6px; background: var(--paper); color: var(--ink); font: inherit; font-size: 16px; }
#retention-days:focus-visible { outline: 2px solid var(--stamp); outline-offset: 2px; }
#retention-error { margin: 8px 0; }
@media (max-width: 640px) {
  #retention-form .btn, #retention-days { min-height: 40px; }
}

/* Admin audit keeps the existing theme while separating logs from file management. */
.admin-nav { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 12px; }
#admin-settings-btn svg { display: block; }
.audit-card { padding: 20px; }
.audit-heading { display: flex; justify-content: space-between; gap: 16px; align-items: center; margin-bottom: 18px; }
.audit-heading h2 { margin: 0 0 4px; font-size: 19px; }
.audit-actions { display: flex; gap: 8px; align-items: center; }
.audit-categories { display: flex; flex-wrap: wrap; gap: 8px; border-bottom: 1px solid var(--line); margin-bottom: 14px; }
.audit-categories button { padding: 9px 12px; background: transparent; color: var(--muted); font: inherit; font-size: 13px; border: 0; border-bottom: 2px solid transparent; cursor: pointer; }
.audit-categories button[aria-pressed="true"] { color: var(--ink); border-bottom-color: var(--stamp); font-weight: bold; }
.audit-categories button:focus-visible { outline: 2px solid var(--stamp); outline-offset: -2px; }
.audit-filter { display: flex; align-items: end; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
.audit-filter label { display: grid; gap: 5px; font-size: 12px; min-width: 0; }
.audit-filter input, .audit-filter select { min-width: 0; max-width: 100%; padding: 8px; border: 1px solid var(--line); border-radius: 6px; background: var(--paper); color: var(--ink); font: inherit; font-size: 14px; height: 36px; box-sizing: border-box; }
.audit-filter input:focus-visible, .audit-filter select:focus-visible { outline: 2px solid var(--stamp); outline-offset: 2px; }
.audit-search { flex: 1; min-width: 140px !important; }
.audit-table { width: 100%; font-size: 12px; }
.audit-table td { padding-top: 12px; padding-bottom: 12px; vertical-align: middle; }
.audit-table td small { display: block; margin-top: 3px; }
.audit-table td .audit-mobile-label { display: none; }
.audit-table td.audit-source, .audit-table td.audit-target { white-space: normal; min-width: 125px; max-width: 220px; overflow-wrap: anywhere; }
.audit-result { display: inline-block; border-radius: 5px; padding: 2px 7px; white-space: nowrap; }
.audit-success { color: #25814c; background: #53b77c22; }
.audit-failed { color: #c34b3d; background: #d45e5022; }
.audit-blocked { color: #bd791f; background: #dd9e3522; }
[data-theme="dark"] .audit-success { color: #8cd2a9; }
[data-theme="dark"] .audit-failed { color: #f09a8f; }
[data-theme="dark"] .audit-blocked { color: #ebbd72; }
.audit-pager { gap: 10px; margin-top: 14px; }
#audit-detail .file-field { min-width: 0; overflow-wrap: anywhere; }
#audit-detail .file-field:nth-child(10), #audit-detail .file-field:nth-child(11) { grid-column: 1 / -1; }
@media (max-width: 600px) {
  .audit-card { padding: 12px; }
  .audit-heading { align-items: flex-start; flex-direction: column; gap: 10px; }
  .audit-heading .audit-actions { width: 100%; }
  .audit-heading .audit-actions .btn { flex: 1; }
  .audit-categories { gap: 0; }
  .audit-categories button { flex: 1 0 30%; padding: 9px 5px; font-size: 12px; }
  .audit-filter { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .audit-filter .audit-search { min-width: 0 !important; }
  .audit-filter .audit-actions { grid-column: 1 / -1; }
  .audit-filter .audit-actions .btn { flex: 1; }
  .audit-filter input, .audit-filter select { width: 100%; font-size: 16px; height: 40px; }
  #admin-audit-view .btn, .admin-nav .btn { min-height: 40px; }
  .audit-table-wrap { overflow: visible; }
  .audit-table, .audit-table tbody { display: block; min-width: 0; }
  .audit-table thead { display: none; }
  .audit-table tr { display: grid; grid-template-columns: minmax(0, 1fr) auto; column-gap: 12px; padding: 12px 0; border-top: 1px dashed var(--line); }
  .audit-table tbody tr:hover { background: var(--rowbg); }
  .audit-table tbody tr:hover td { background: transparent; }
  .audit-table td { padding: 2px 0; border: 0; min-width: 0; white-space: normal; }
  .audit-table td:nth-child(1) { grid-row: 2; grid-column: 1; color: var(--muted); }
  .audit-table td:nth-child(2) { grid-row: 1; grid-column: 1; }
  .audit-table td:nth-child(2) small { display: none; }
  .audit-table td:nth-child(3) { grid-row: 1; grid-column: 2; text-align: right; }
  .audit-table td:nth-child(4) { grid-row: 4; grid-column: 1; }
  .audit-table td:nth-child(5) { grid-row: 3; grid-column: 1; }
  .audit-table td:nth-child(6) { grid-row: 5; grid-column: 1 / -1; }
  .audit-table td:nth-child(7) { grid-row: 2 / 5; grid-column: 2; align-self: center; }
  .audit-table td.audit-source, .audit-table td.audit-target { min-width: 0; max-width: none; }
  .audit-table td .audit-mobile-label { display: inline; margin-right: 8px; }
}
/* Shared controls and compact upload context. */
button, input, select, textarea { font: inherit; }
.btn, .icon-btn, .seg button, .tab { min-height: 36px; }
button:focus-visible, summary:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible { outline: 2px solid var(--ink); outline-offset: 3px; }
.source-link, .file-detail-link { min-height: 24px; }
[data-theme='dark'] .btn.danger { color: #241713; }
.upload-context { border-top: 1px solid var(--line); margin-top: 12px; padding-top: 8px; font-size: 13px; }
.upload-context summary, .source-history summary, .source-agent summary { cursor: pointer; min-height: 32px; padding-block: 5px; }
.context-fields { display: grid; gap: 10px; padding: 10px 0 2px; }
.context-row { display: grid; grid-template-columns: 110px minmax(0, 1fr); align-items: start; gap: 10px; }
.context-row > label, .context-label { padding-top: 8px; }
.context-label { display: flex; flex-direction: column; gap: 4px; }
.context-fields label { display: block; font-weight: 500; }
.context-fields input, .context-fields textarea { display: block; width: 100%; min-width: 0; margin: 0; padding: 8px 10px; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--paper); color: var(--ink); font-size: 16px; }
.context-fields textarea { min-height: 76px; resize: vertical; }
#upload-description-field { min-width: 0; }
#description-count { font-size: 11px; font-variant-numeric: tabular-nums; }
.context-fields > small { padding-left: 120px; }
@media (max-width: 600px) {
  .context-row { grid-template-columns: minmax(0, 1fr); gap: 4px; }
  .context-row > label, .context-label { padding-top: 0; }
  .context-label { flex-direction: row; justify-content: space-between; align-items: baseline; gap: 8px; }
  .context-fields > small { padding-left: 0; }
}
.admin-settings { display: grid; grid-template-columns: minmax(0, 1fr); gap: 0; }
.settings-section { min-width: 0; padding: 10px 0; border-bottom: 1px solid var(--line); font-size: 13px; }
.settings-section:last-child { border-bottom: 0; }
.admin-settings .retention-settings, .admin-settings .guest-settings { margin: 0; }
.settings-section form { margin-block: 8px; }
.settings-section .btn, .settings-section input { min-height: 36px; }
.admin-list-card { padding: 14px; }
.source-heading { flex-shrink: 0; }
.source-ip { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; }
.source-ip .btn { min-height: 28px; padding: 2px 8px; font-size: 12px; }
.source-agent { margin-top: 4px; }
.source-agent p { margin: 4px 0; font-size: 12px; overflow-wrap: anywhere; }
.source-history { border-top: 1px solid var(--line); margin-top: 6px; padding-top: 4px; font-size: 13px; }
#source-history-list { display: grid; }
.source-activity { display: grid; gap: 2px; padding: 6px 0; border-bottom: 1px dashed var(--line); }
.source-activity:last-child { border-bottom: 0; }
.source-activity small { overflow-wrap: anywhere; }
.activity-head { display: flex; align-items: baseline; gap: 8px; min-width: 0; }
.activity-head > :first-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
.activity-head .badge { flex-shrink: 0; }
#source-back { margin-right: auto; }
.file-description { padding-bottom: 6px; border-bottom: 1px solid var(--line); }
.file-description p { margin: 4px 0 0; white-space: pre-wrap; }
.delete-dialog { width: min(430px, calc(100vw - 32px)); max-height: calc(100dvh - 32px); overflow: auto; padding: 0; border: 0; border-radius: var(--radius); background: var(--paper); color: var(--ink); }
.delete-dialog::backdrop { background: var(--mask); }
.delete-dialog .modal-card { width: 100%; box-shadow: none; }
@media (max-width: 760px) {
  .admin-settings { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 600px), (pointer: coarse) {
  .btn, .btn.small, .icon-btn, .seg button, .tab, .source-footer .btn,
  .settings-section .btn, .settings-section input, .source-ip .btn, .audit-filter input, .audit-filter select,
  .actions .btn, .actions .icon-btn, #admin-panel td .btn, .admin-pager .btn,
  #login-protection .btn, #retention-form .btn, #retention-days, #admin-audit-view .btn, .admin-nav .btn { min-height: 44px; }
  .source-link, .file-detail-link { min-height: 32px; }
  .source-heading h3 { font-size: 16px; }
  #source-form { grid-template-columns: 84px minmax(0, 1fr); gap: 4px 8px; }
  .source-footer { gap: 6px; }
  .source-footer .btn { padding-inline: 8px; font-size: 13px; }
  .upload-context summary, .source-history summary { min-height: 40px; padding-block: 8px; }
}
/* File content and upload source have separate, compact reading layouts. */
#file-dialog, #source-dialog { width: min(720px, calc(100vw - 24px)); }
#source-detail { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 18px; }
#source-detail .source-field { grid-template-columns: 82px minmax(0, 1fr); gap: 8px; }
#source-form { grid-template-columns: auto minmax(0, 1fr) auto; max-width: 380px; border: 0; margin: 0 0 10px; padding: 0; }
#source-form label { white-space: nowrap; }
#source-note { font-size: 14px; }
.source-agent { position: relative; min-height: 24px; display: grid; grid-template-columns: 82px minmax(0, 1fr); gap: 8px; align-items: baseline; }
.source-agent p { margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.source-agent p:focus { position: absolute; left: 90px; right: 0; top: 0; z-index: 2; white-space: normal; background: var(--paper); outline: 2px solid var(--stamp); outline-offset: 2px; }
#source-history h4 { margin: 4px 0; font-size: 13px; }
.file-preview { border: 1px solid var(--line); border-radius: var(--radius-sm); overflow: hidden; }
.file-preview-heading { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 4px 12px; padding: 8px 10px; background: var(--rowbg); font-size: 13px; }
.file-preview-body { max-height: 320px; overflow: auto; padding: 10px; font-size: 13px; overflow-wrap: anywhere; }
.file-preview-body pre { margin: 0; font: 13px/1.65 ui-monospace, Consolas, monospace; white-space: pre-wrap; overflow-wrap: anywhere; }
.file-preview-body .btn { margin-left: 8px; }
.file-preview-image { display: block; max-width: 100%; max-height: 280px; object-fit: contain; margin: auto; }
.file-preview-table { width: 100%; border-collapse: collapse; }
.file-preview-table td { padding: 5px 8px; border-bottom: 1px solid var(--line); min-width: 100px; max-width: 240px; white-space: pre-wrap; overflow-wrap: anywhere; }
@media (max-width: 600px) {
  #source-detail { grid-template-columns: minmax(0, 1fr); }
  #source-form { gap: 6px; }
  #source-note { font-size: 16px; }
  #source-save { min-height: 44px; }
}
@media (pointer: coarse) {
  .source-agent p { white-space: normal; }
  .source-agent p:focus { position: static; }
}
/* Primary navigation belongs in the header; paging stays with its list. */
.admin-topbar { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 24px; padding-block: 12px; margin-bottom: 12px; background: var(--paper); }
.admin-topbar .brand { min-width: 0; }
.admin-topbar .brand b { white-space: nowrap; }
.admin-topbar .actions { grid-column: 3; }
#admin-navigation { min-width: 0; justify-self: start; flex-wrap: nowrap; gap: 8px; margin: 0; }
.admin-nav-link { min-height: 44px; padding: 10px 12px 7px; border: 0; border-bottom: 3px solid transparent; border-radius: 0; background: transparent; color: var(--muted); font-size: 14px; font-weight: 600; white-space: nowrap; cursor: pointer; }
.admin-nav-link:hover { color: var(--ink); background: var(--rowbg); }
.admin-nav-link[aria-pressed='true'] { color: var(--ink); border-bottom-color: var(--stamp); }
.list-toolbar { position: sticky; top: 8px; z-index: 5; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px 12px; margin: 0 0 10px; padding: 10px 12px; background: var(--paper); border: 1px solid var(--line); border-radius: var(--radius-sm); box-shadow: 0 3px 8px var(--hard-soft); }
.page-summary { color: var(--ink); font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; }
.list-toolbar .pager-btns { flex-wrap: wrap; gap: 6px; }
.admin-list-card .table-wrap, .audit-table-wrap { scroll-margin-top: 84px; }
.file-summary { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 12px; color: var(--muted); }
.file-summary .badge { font-size: 12px; }
#file-detail .file-field { grid-template-columns: auto minmax(0, 1fr); align-items: baseline; column-gap: 8px; }
#file-detail .file-field > small:last-child:not(:first-child) { grid-column: 2; }
.settings-dialog { width: min(540px, calc(100vw - 24px)); }
.settings-dialog h4 { margin: 0 0 8px; font-size: 13px; }
.settings-saved { display: block; color: var(--ok); margin-top: 4px; }
.settings-dialog #btn-logout { margin-right: auto; }
.display-options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.preference-row { display: grid; grid-template-columns: minmax(0, 1fr) 64px; align-items: center; gap: 8px; margin-bottom: 6px; }
.preference-row select { width: 100%; min-height: 36px; padding: 4px 8px; border: 1px solid var(--line); border-radius: 6px; background: var(--paper); color: var(--ink); }
#retention-form, #guest-policy-form { display: grid; grid-template-columns: minmax(0, 1fr) 110px auto; align-items: center; gap: 8px; margin: 0; }
.setting-value { display: flex; align-items: center; gap: 6px; min-width: 0; }
#retention-form .setting-value input, #guest-policy-form input { width: 80px; min-width: 0; }
#guest-policy-form { margin-top: 8px; }
.settings-section > .muted { display: block; margin-top: 6px; line-height: 1.5; }
.settings-dialog .login-guard-heading { margin: 0; }
.settings-dialog .login-guard-heading h4 { margin: 0; }
@media (max-width: 900px) {
  .admin-topbar { grid-template-columns: minmax(0, 1fr) auto; gap: 8px; }
  .admin-topbar .actions { grid-column: 2; }
  #admin-navigation { grid-column: 1 / -1; grid-row: 2; justify-self: stretch; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .list-toolbar { justify-content: space-between; }
}
@media (max-width: 600px) {
  .admin-topbar { padding: 8px 12px; }
  .admin-topbar .actions { gap: 2px; }
  .admin-topbar .actions .icon-btn { width: 36px; padding-inline: 4px; }
  .admin-topbar .actions .btn { padding-inline: 8px; }
  .admin-topbar .brand b { font-size: 16px; white-space: normal; }
  .list-toolbar { top: 4px; padding: 8px; gap: 6px; }
  .list-toolbar .page-summary { width: 100%; }
  .list-toolbar .pager-btns { width: 100%; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .list-toolbar .btn { padding-inline: 5px; }
  .preference-row select { min-height: 44px; font-size: 16px; }
  .display-options { grid-template-columns: minmax(0, 1fr); gap: 0; }
  .preference-row { grid-template-columns: minmax(0, 1fr) 110px; }
  #retention-form, #guest-policy-form { grid-template-columns: minmax(0, 1fr) 90px auto; gap: 6px; }
  #retention-form .setting-value input, #guest-policy-form input { width: 64px; }
  .settings-dialog .source-body { padding: 0 12px; }
  #file-detail .file-field { grid-column: 1 / -1; grid-template-columns: 88px minmax(0, 1fr); }
}
`, "ui.css": `/* Shared responsive layout. Colors, typefaces, textures, buttons and assets stay native. */
.ui-enhanced .flow-strip,.ui-enhanced .feat-band{display:none}
.ui-enhanced .topbar{margin-bottom:16px}
.ui-enhanced .send-grid{gap:26px;align-items:stretch}
/* One shared outer edge for the header, statistics and list. */
.ui-enhanced[data-ui-surface='admin'] .topbar.wide,
.ui-enhanced[data-ui-surface='admin'] .container.wide{width:calc(100% - 64px);max-width:1600px}
.ui-enhanced[data-ui-surface='index'] .topbar.wide,
.ui-enhanced[data-ui-surface='index'] .container.wide{width:calc(100% - 64px);max-width:1200px}
.ui-enhanced[data-ui-surface='admin'] .container.wide,
.ui-enhanced[data-ui-surface='index'] .container.wide{padding-inline:0}
.ui-enhanced[data-ui-surface='index'] main{justify-content:flex-start}
.ui-enhanced .share-filename-line{width:100%;min-width:0}
@media(min-width:1200px){
 .ui-enhanced .admin-list-card table{table-layout:fixed}
 .ui-enhanced .admin-list-card th:nth-child(1){width:80px}
 .ui-enhanced .admin-list-card th:nth-child(3){width:180px}
 .ui-enhanced .admin-list-card th:nth-child(4){width:90px}
 .ui-enhanced .admin-list-card th:nth-child(5){width:80px}
 .ui-enhanced .admin-list-card th:nth-child(6),.ui-enhanced .admin-list-card th:nth-child(8){width:150px}
 .ui-enhanced .admin-list-card th:nth-child(7){width:85px}
 .ui-enhanced .admin-list-card th:nth-child(9){width:80px}
 .ui-enhanced .stats-row{grid-template-columns:minmax(0,1fr) 320px}
}
@media(min-width:601px) and (max-width:1199px){
 .ui-enhanced .share-filename-line{width:clamp(160px,20vw,260px)}
}
.ui-enhanced .upload-context{margin-block:14px}
.ui-enhanced .context-fields{grid-template-columns:minmax(120px,.65fr) minmax(0,1.35fr);gap:10px}
.ui-enhanced .context-row{display:grid;grid-template-columns:1fr;align-content:start;gap:5px}
.ui-enhanced .context-fields textarea{min-height:42px;height:42px}
.ui-enhanced .context-label{display:flex;align-items:center;justify-content:space-between;gap:8px}
.ui-enhanced .context-fields>small{grid-column:1/-1;padding:0}
.ui-enhanced .options{gap:14px}
.ui-enhanced .stats-row{gap:10px;margin-bottom:14px}
.ui-enhanced .stat-card{padding:12px;min-height:82px}
.ui-enhanced .stats-counts .stat-card{gap:2px}
.ui-enhanced .stats-counts .stat-card b{font-size:24px}
.ui-enhanced .storage-value{margin:2px 0 4px}
.ui-enhanced .storage-card{padding:10px 14px}
.ui-enhanced .admin-list-card{padding:12px}
.ui-enhanced .list-toolbar{box-shadow:none;margin-bottom:4px;border-width:0 0 1px;border-radius:0;padding:8px 4px 12px}
.ui-enhanced .audit-heading{align-items:center;margin-bottom:12px}
.ui-enhanced .audit-categories{display:flex;align-items:center;gap:6px}
.ui-enhanced .ui-guard-entry{margin-left:auto}
.ui-enhanced .audit-filter{gap:10px;align-items:end;margin-block:12px}
.ui-enhanced #source-identity{display:grid;grid-template-columns:minmax(0,1fr) 280px;align-items:start;gap:12px 20px;padding:2px 0 12px;margin-bottom:12px;border-bottom:1px solid var(--line)}
.ui-enhanced #source-identity[hidden]{display:none}
.ui-enhanced .source-visitor{display:grid;gap:6px;min-width:0}
.ui-enhanced .source-visitor>small{font-size:12px}
.ui-enhanced #source-visitor-id{font-size:12px;line-height:1.6;overflow-wrap:anywhere;padding-block:7px;user-select:text}
.ui-enhanced #source-form{grid-template-columns:minmax(0,1fr) auto;max-width:280px;width:100%;gap:6px 8px;margin:0;align-items:center}
.ui-enhanced #source-form>label{grid-column:1/-1}
.ui-enhanced #source-note,.ui-enhanced #source-save{min-height:36px}
@media(max-width:600px){
 .ui-enhanced #source-identity{grid-template-columns:1fr;gap:10px}
 .ui-enhanced #source-visitor-id{padding-block:0}
 .ui-enhanced #source-form{grid-template-columns:auto minmax(0,1fr) auto;max-width:none;gap:8px}
 .ui-enhanced #source-form>label{grid-column:auto}
 .ui-enhanced #source-note,.ui-enhanced #source-save{min-height:44px}
}
.ui-enhanced #source-detail .source-field{grid-template-columns:74px minmax(0,1fr);gap:8px}
.ui-enhanced #source-detail{gap:8px 18px}
.ui-enhanced #source-detail .source-field>p{min-width:0;overflow-wrap:anywhere}
.ui-enhanced .source-agent{grid-template-columns:74px minmax(0,1fr)}
.ui-enhanced .source-agent p:focus{left:82px}
.ui-enhanced .source-activity{display:grid;grid-template-columns:minmax(0,1fr);gap:4px 12px;padding-block:9px}
.ui-enhanced .source-activity>small{grid-column:1/-1}
.ui-enhanced .source-activity .source-link{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;max-width:100%}
.ui-enhanced #file-dialog{width:min(680px,calc(100vw - 24px))}
.ui-enhanced #file-detail .file-field{grid-template-columns:70px minmax(0,1fr)}
.ui-enhanced #file-edit{margin-right:auto}
.ui-enhanced .share-edit-form{display:grid;gap:14px}
.ui-enhanced .share-edit-filename{font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ui-enhanced .share-edit-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px 12px;align-items:start}
.ui-enhanced .share-edit-field{display:grid;gap:7px;min-width:0}
.ui-enhanced .share-edit-field>label,.ui-enhanced .share-edit-field>.ui-help-anchor{font-size:12px;color:var(--muted);min-height:24px;display:flex;align-items:center}
.ui-enhanced .share-edit-field input,.ui-enhanced .share-edit-field select{width:100%;min-width:0;box-sizing:border-box}
.ui-enhanced .share-edit-field select,.ui-enhanced .share-edit-field input[type=datetime-local]{min-height:40px;padding:6px 9px;color:var(--ink);background:var(--bag);border:1px solid var(--line);border-radius:var(--radius-sm);font:inherit}
.ui-enhanced .share-edit-expiry{grid-column:1/-1;grid-template-columns:minmax(0,1fr) auto;align-items:center}
.ui-enhanced .share-edit-expiry>.ui-help-anchor,.ui-enhanced .share-edit-expiry>label:first-child{grid-column:1/-1}
.ui-enhanced .share-edit-check{display:flex;align-items:center;gap:6px;white-space:nowrap;min-height:28px}
.ui-enhanced .share-edit-check input{width:16px;height:16px;accent-color:var(--stamp)}
.ui-enhanced[data-theme=dark] .share-edit-field input[type=datetime-local]{color-scheme:dark}
.ui-enhanced .share-edit-linked{margin:0;font-size:12px;line-height:1.7;overflow-wrap:anywhere}
.ui-enhanced .share-edit-actions{display:flex;justify-content:flex-end;gap:8px;padding-top:12px;border-top:1px solid var(--line)}
@media(max-width:600px){
 .ui-enhanced .share-edit-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
 .ui-enhanced .share-edit-field:has(#share-edit-status){grid-column:1/-1}
 .ui-enhanced .share-edit-field select,.ui-enhanced .share-edit-field input[type=datetime-local]{min-height:44px;font-size:16px}
 .ui-enhanced .share-edit-actions>.btn{flex:1;min-height:44px}
 .ui-enhanced .share-edit-expiry{grid-template-columns:1fr}
}
.ui-enhanced .settings-dialog{width:min(560px,calc(100vw - 24px))}
.ui-enhanced .settings-section{padding-block:12px}
.ui-enhanced .display-options{grid-template-columns:1fr 1fr;gap:16px}
.ui-enhanced .settings-section>.muted{font-size:12px}
@media(max-width:600px){
 .ui-enhanced[data-ui-surface='admin'] .topbar.wide,
 .ui-enhanced[data-ui-surface='admin'] .container.wide,
 .ui-enhanced[data-ui-surface='index'] .topbar.wide,
 .ui-enhanced[data-ui-surface='index'] .container.wide{width:calc(100% - 24px)}
 .ui-enhanced .send-grid{gap:16px}
 .ui-enhanced .context-fields{grid-template-columns:1fr}
 .ui-enhanced .stats-counts .stat-card{min-height:60px;padding:8px}
 .ui-enhanced .stats-counts{gap:6px}
 .ui-enhanced .storage-card{padding:10px 12px}
 .ui-enhanced .display-options{grid-template-columns:1fr;gap:4px}
 .ui-enhanced .audit-categories{flex-wrap:wrap}
 .ui-enhanced .ui-guard-entry{margin-left:0}
 .ui-enhanced .list-toolbar .page-summary{width:auto}
 .ui-enhanced .admin-list-card>.table-wrap{overflow:visible}
 .ui-enhanced #shares-body{display:grid;gap:0}
 .ui-enhanced .admin-list-card table{display:block;min-width:0}
 .ui-enhanced .admin-list-card thead{display:none}
 .ui-enhanced #shares-body tr{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:5px 10px;padding:12px 2px;border-bottom:1px dashed var(--line)}
 .ui-enhanced #shares-body td{padding:0;border:0;min-width:0;white-space:normal;text-align:left}
 .ui-enhanced #shares-body td:nth-child(1){grid-area:1/1;color:var(--muted)}
 .ui-enhanced #shares-body td:nth-child(2){grid-area:2/1/3/3}
 .ui-enhanced #shares-body td:nth-child(3){grid-area:3/1/5/2}
 .ui-enhanced #shares-body td:nth-child(4){grid-area:3/2;text-align:right}
 .ui-enhanced #shares-body td:nth-child(5){grid-area:4/2;text-align:right}
 .ui-enhanced #shares-body td:nth-child(5)::before{content:'\u5DF2\u53D6 ';color:var(--muted)}
 .ui-enhanced #shares-body td:nth-child(6){grid-area:5/1;font-size:12px}
 .ui-enhanced #shares-body td:nth-child(6)::before{content:'\u5230\u671F ';color:var(--muted)}
 .ui-enhanced #shares-body td:nth-child(7){grid-area:1/2;text-align:right}
 .ui-enhanced #shares-body td:nth-child(8){grid-area:6/1;font-size:12px;color:var(--muted)}
 .ui-enhanced #shares-body td:nth-child(8)::before{content:'\u521B\u5EFA '}
 .ui-enhanced #shares-body td:nth-child(9){grid-area:5/2/7/3;align-self:center;text-align:right}
 .ui-enhanced #shares-body td[colspan]{grid-area:1/1/2/3}
 .ui-enhanced .source-agent p{white-space:normal}
 .ui-enhanced #file-detail .file-field{grid-template-columns:80px minmax(0,1fr)}
}

/* Quiet outer surfaces; native typography, colors and interactive controls remain. */
.ui-soft{--ui-divider:color-mix(in srgb,var(--line) 38%,transparent)}
.ui-soft .ui-header-band{width:100%;background:var(--paper);border-bottom:1px solid var(--ui-divider);margin-bottom:22px}
.ui-soft .ui-header-band .topbar{margin-block:0;border:0;box-shadow:none;background:transparent;padding-block:14px}
.ui-soft .brand .logo{box-shadow:none}
.ui-soft .stats-row{gap:24px;margin-bottom:24px;align-items:center}
.ui-soft .stats-counts{gap:0}
.ui-soft .stat-card{background:transparent;border:0;border-radius:0;box-shadow:none;padding:8px 18px;min-height:72px}
.ui-soft .stats-counts .stat-card{border-right:1px solid var(--ui-divider);align-items:flex-start;text-align:left}
.ui-soft .stats-counts .stat-card:first-child{padding-left:0}
.ui-soft .stats-counts .stat-card:last-child{border-right:0}
.ui-soft .storage-card{padding-inline:0}
.ui-soft .admin-list-card,.ui-soft .audit-card{background:transparent;border:0;border-radius:0;box-shadow:none;padding:0}
.ui-soft .list-toolbar{padding:12px 0;margin-bottom:12px;border:0;border-radius:0;box-shadow:none;background:var(--bag)}
.ui-soft .admin-list-card th,.ui-soft .audit-table th{background:color-mix(in srgb,var(--paper) 75%,transparent);border-bottom:1px solid var(--ui-divider);padding-block:12px}
.ui-soft .admin-list-card td,.ui-soft .audit-table td{border-bottom:1px solid var(--ui-divider);padding-block:14px}
.ui-soft .admin-list-card tbody tr:last-child td,.ui-soft .audit-table tbody tr:last-child td{border-bottom:0}
.ui-soft .audit-heading{margin-bottom:18px}
.ui-soft .audit-filter{padding:14px 0;border-color:var(--ui-divider);background:transparent}
.ui-soft .audit-categories{border-color:var(--ui-divider)}
.ui-soft .form-card{border:1px solid var(--ui-divider);box-shadow:none}
.ui-soft .result-placeholder{border:1.5px dashed var(--line);border-radius:13px;box-shadow:none}
.ui-soft .ph-fine{border-color:var(--line)}
.ui-soft .source-heading,.ui-soft .source-footer,.ui-soft .settings-section,.ui-soft .source-activity{border-color:var(--ui-divider)}
@media(max-width:600px){
 .ui-soft .ui-header-band{margin-bottom:16px}
 .ui-soft .ui-header-band .topbar{padding-block:8px}
 .ui-soft .stats-row{gap:12px;margin-bottom:12px}
 .ui-soft .stats-counts{row-gap:12px}
 .ui-soft .stats-counts .stat-card{padding:4px 12px;min-height:56px;align-items:center;text-align:center}
 .ui-soft .stats-counts .stat-card:first-child{padding-left:12px}
 .ui-soft .stats-counts .stat-card:nth-child(3){border-right:0}
 .ui-soft .storage-card{padding:12px 0;border-top:1px solid var(--ui-divider)}
 .ui-soft #shares-body tr{padding:14px 0;border-bottom:1px solid var(--ui-divider)}
 .ui-soft #shares-body td{padding:0;border:0}
 .ui-soft .audit-table td{border:0}
}

/* Public entry points: shared header, focused forms and quiet boundaries. */
.ui-enhanced a.ui-new-tab::after{content:'\u2197';margin-left:5px;font-size:12px;opacity:.7}
.ui-enhanced .ui-public-header{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:24px;align-items:center}
.ui-enhanced .ui-public-nav{display:flex;gap:8px;align-items:center}
.ui-enhanced .ui-public-nav a{text-decoration:none;display:inline-flex;align-items:center;justify-content:center}
.ui-enhanced .ui-public-nav a[aria-current='page']{border-bottom-color:var(--stamp);color:var(--ink)}
.ui-enhanced.ui-pickup .topbar,.ui-enhanced.ui-login .topbar.wide{width:calc(100% - 64px);max-width:1200px}
.ui-enhanced.ui-send .form-card{padding:22px 24px}
.ui-enhanced.ui-send .options{margin-top:18px;margin-bottom:6px}
.ui-enhanced.ui-send .upload-context{margin-block:14px 0}
.ui-enhanced.ui-send .context-fields{gap:12px}
.ui-enhanced.ui-send .context-label{flex-direction:row;align-items:baseline;justify-content:space-between;min-height:24px;padding-top:0}
.ui-enhanced.ui-send .context-row>label{min-height:24px;padding-top:0}
.ui-enhanced.ui-send .context-fields input{min-height:48px}
.ui-enhanced.ui-send .context-fields textarea{height:72px;min-height:48px}
.ui-enhanced.ui-send #upload-policy-hint{line-height:1.6}
.ui-enhanced.ui-send .btn.block{min-height:46px;margin-top:18px}
.ui-enhanced.ui-pickup .container.narrow{width:calc(100% - 48px);max-width:500px;padding:clamp(24px,8vh,80px) 0 40px}
.ui-enhanced #pickup-input-card{padding:30px 24px 24px}
.ui-soft #pickup-input-card{background:transparent;border:0;box-shadow:none}
.ui-enhanced #pickup-input-card .title{margin:0 0 10px;font-size:26px}
.ui-enhanced #pickup-input-card .pk-sub{margin-bottom:26px;font-size:13px}
.ui-enhanced #pickup-input-card .otp-row{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));width:100%;max-width:360px;gap:8px;margin:0 auto 18px}
.ui-enhanced #pickup-input-card .otp-box{width:100%;min-width:0;height:58px;font-size:28px}
.ui-enhanced .ui-pickup-actions{display:grid;grid-template-columns:1fr auto;gap:10px;max-width:360px;margin:auto}
.ui-enhanced .ui-pickup-actions .btn{min-height:44px}
.ui-enhanced #pickup-error{max-width:360px;margin:16px auto 0;text-align:left}
.ui-enhanced #pickup-result{padding:24px;border-color:var(--ui-divider,var(--line));box-shadow:none;overflow-wrap:anywhere}
.ui-enhanced #pickup-result .share-card{margin-top:0}
.ui-enhanced #pickup-result .sc-meta{min-width:0}
.ui-enhanced #pickup-result .sc-meta b{overflow-wrap:anywhere}
.ui-enhanced #pickup-result .btn.primary{min-height:46px}
.ui-enhanced .ui-pickup-caption{display:none;font-family:var(--serif);font-size:24px;text-align:center;margin-bottom:22px;font-weight:700}
.ui-enhanced.ui-pickup-found .ui-pickup-caption{display:block}
.ui-enhanced.ui-login .container.wide{width:calc(100% - 48px);max-width:440px;padding:clamp(24px,8vh,80px) 0 40px}
.ui-enhanced #admin-login{padding:28px 26px;border-color:var(--ui-divider,var(--line));box-shadow:none}
.ui-soft #admin-login{background:transparent;border:0}
.ui-enhanced #admin-login .title{margin:0 0 26px;font-size:26px}
.ui-enhanced #admin-login>label{display:block;text-align:left;font-size:13px;margin-bottom:8px}
.ui-enhanced .ui-token-field{position:relative;display:flex;align-items:center;gap:8px}
.ui-enhanced .ui-token-field .token-input{margin:0;min-height:48px;padding-right:74px;font-size:16px}
.ui-enhanced #ui-token-toggle{position:absolute;right:4px;min-height:40px;padding-inline:10px;box-shadow:none;border-color:transparent}
.ui-enhanced #admin-login #btn-login{margin-top:18px;min-height:46px}
.ui-enhanced #admin-login .error-box{margin:12px 0 0;text-align:left}
.ui-enhanced .ui-entry-back{display:inline-block;margin-top:18px;color:var(--muted);font-size:13px;text-underline-offset:4px}
@media(max-width:600px){
 .ui-enhanced .ui-public-header{grid-template-columns:minmax(0,1fr) auto;gap:6px;padding-inline:12px}
 .ui-enhanced .ui-public-header .actions{grid-column:2;grid-row:1}
 .ui-enhanced .ui-public-nav{grid-column:1/-1;grid-row:2;display:grid;grid-template-columns:1fr 1fr}
 .ui-enhanced.ui-pickup .topbar,.ui-enhanced.ui-login .topbar.wide{width:calc(100% - 24px)}
 .ui-enhanced.ui-pickup .container.narrow,.ui-enhanced.ui-login .container.wide{width:calc(100% - 32px);padding-top:28px}
 .ui-enhanced.ui-send .form-card{padding:16px}
 .ui-enhanced #pickup-input-card,.ui-enhanced #admin-login{padding:18px 0}
 .ui-enhanced #pickup-input-card .title,.ui-enhanced #admin-login .title{font-size:24px}
 .ui-enhanced #pickup-input-card .otp-row{gap:6px}
 .ui-enhanced #pickup-input-card .otp-box{height:52px;font-size:24px}
 .ui-enhanced #pickup-result{padding:18px}
}
/* Default desktop state fits the viewport; long queues and small screens grow naturally. */
.ui-enhanced.ui-send{--send-gutter:32px;--send-max-width:1200px}
.ui-enhanced.ui-send :is(.topbar.wide,main.container.wide,.ui-footer-inner){width:calc(100% - 2 * var(--send-gutter));max-width:var(--send-max-width);margin-inline:auto}
.ui-enhanced.ui-send .topbar.wide{padding-inline:0}
.ui-enhanced.ui-send .ui-header-band{margin-bottom:12px}
.ui-enhanced.ui-send main.container.wide{padding-block:0 12px;flex:1 0 auto;justify-content:center}
.ui-enhanced.ui-send .form-card{padding:16px 20px}
.ui-enhanced.ui-send .card-cap{margin:0 0 10px}
.ui-enhanced.ui-send .tabs{margin-bottom:12px}
.ui-enhanced.ui-send .dropzone{padding:16px;min-height:112px}
.ui-enhanced.ui-send .dz-icon{font-size:28px;line-height:1.2;margin-bottom:6px}
.ui-enhanced.ui-send .dropzone p{margin-bottom:3px}
.ui-enhanced.ui-send #text-input{height:132px;min-height:96px;flex:1 0 auto}
.ui-enhanced.ui-send .upload-context{margin-top:10px;padding-top:6px}
.ui-enhanced.ui-send .upload-context summary{min-height:28px;padding-block:3px}
.ui-enhanced.ui-send .upload-context summary>small{float:right;font-size:11px;font-weight:400;line-height:22px}
.ui-enhanced.ui-send .context-fields{padding:6px 0 0;gap:8px 12px}
.ui-enhanced.ui-send .context-label,.ui-enhanced.ui-send .context-row>label{min-height:20px}
.ui-enhanced.ui-send .context-fields input{min-height:44px}
.ui-enhanced.ui-send .context-fields textarea{height:48px;min-height:44px}
.ui-enhanced.ui-send .options{margin-top:12px;margin-bottom:4px}
.ui-enhanced.ui-send #upload-policy-hint{margin-bottom:0}
.ui-enhanced.ui-send .btn.block{min-height:42px;margin-top:12px}
.ui-enhanced.ui-send .result-placeholder{min-height:0;padding:22px 20px}
.ui-enhanced.ui-send .ph-route{margin-top:18px}
.ui-enhanced.ui-send .ph-dash{height:18px}
.ui-enhanced.ui-send .ph-fine{margin-top:18px;padding-top:10px}
.ui-enhanced .ui-send-footer{width:100%;max-width:none;margin:0;padding:0;border-top:0;background:transparent;text-align:left;letter-spacing:0;flex-shrink:0}
.ui-enhanced .ui-footer-inner{display:flex;align-items:center;gap:24px;padding:8px 0;border-top:1px solid var(--ui-divider,var(--line))}
.ui-enhanced.ui-pickup .ui-footer-inner{width:calc(100% - 64px);max-width:1200px;margin-inline:auto}
.ui-enhanced .ui-footer-about{margin-right:auto;color:var(--muted)}
.ui-enhanced .ui-send-footer small{display:block;font-size:12px;line-height:1.7}
.ui-enhanced .ui-footer-contact{display:flex;align-items:center;gap:8px;padding-left:24px;border-left:1px solid var(--ui-divider,var(--line))}
.ui-enhanced .ui-footer-contact::before{content:"";width:14px;height:14px;flex-shrink:0;background:var(--muted);mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect x='3' y='5' width='18' height='14' rx='2' fill='none' stroke='black' stroke-width='1.5'/%3E%3Cpath d='m3 6 9 7 9-7' fill='none' stroke='black' stroke-width='1.5'/%3E%3C/svg%3E") center/contain no-repeat}
.ui-enhanced .ui-footer-links{display:flex;align-items:center;gap:18px;flex-wrap:wrap}
.ui-enhanced .ui-footer-link{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:0;border:0;border-radius:3px;background:transparent;color:var(--muted);font-family:inherit;font-size:12px;line-height:1.5;text-decoration:none;cursor:pointer;box-shadow:none}
.ui-enhanced .ui-footer-link:hover{color:var(--stamp);text-decoration:underline;text-underline-offset:4px}
.ui-enhanced .ui-footer-link:focus-visible{outline:2px solid var(--stamp);outline-offset:4px}
.ui-enhanced .ui-send-help-dialog{width:min(480px,calc(100vw - 24px))}
.ui-enhanced .ui-send-help-body{display:grid;gap:16px;padding:16px}
.ui-enhanced .ui-send-help-body h4{font-size:14px;margin:0 0 6px}
.ui-enhanced .ui-send-help-body p{font-size:13px;line-height:1.7;color:var(--muted);margin:0}
.ui-enhanced .ui-footer-contact a{display:inline-flex;align-items:center;min-height:36px;color:var(--muted);font-size:12px;line-height:1.7;text-decoration:none;text-underline-offset:3px}
.ui-enhanced .ui-footer-contact a:hover{text-decoration:underline;color:var(--stamp)}
.ui-enhanced .ui-footer-contact a:focus-visible{outline:2px solid var(--stamp);outline-offset:4px;border-radius:3px}
@media(min-width:881px) and (max-height:740px){
 .ui-enhanced.ui-send .ui-header-band{margin-bottom:8px}
 .ui-enhanced.ui-send .ui-header-band .topbar{padding-block:8px}
 .ui-enhanced.ui-send .form-card{padding:12px 18px}
 .ui-enhanced.ui-send .card-cap{margin-bottom:6px}
 .ui-enhanced.ui-send .tabs{margin-bottom:8px}
 .ui-enhanced.ui-send .dropzone{min-height:94px;padding-block:10px}
 .ui-enhanced.ui-send #text-input{height:96px}
 .ui-enhanced.ui-send .upload-context{margin-top:8px;padding-top:4px}
 .ui-enhanced.ui-send .options{margin-top:8px}
 .ui-enhanced.ui-send .btn.block{margin-top:8px}
 .ui-enhanced.ui-send .result-placeholder{padding-block:16px}
 .ui-enhanced.ui-send .ui-footer-inner{padding-block:8px}
}
@media(max-width:880px){
 .ui-enhanced.ui-send main.container.wide{justify-content:flex-start}
}
@media(max-width:600px){
 .ui-enhanced.ui-send{--send-gutter:12px}
 .ui-enhanced.ui-send .form-card{padding:14px}
 .ui-enhanced.ui-send .upload-context summary{min-height:40px;padding-block:6px}
 .ui-enhanced.ui-send .upload-context summary>small{float:none;display:block;padding-left:14px;line-height:1.5}
 .ui-enhanced.ui-send .context-fields{gap:10px}
 .ui-enhanced.ui-send .context-fields textarea{height:64px}
 .ui-enhanced.ui-send .btn.block{min-height:44px}
 .ui-enhanced .ui-footer-inner{flex-wrap:wrap;justify-content:flex-start;gap:0 20px;padding-block:10px 12px}
 .ui-enhanced.ui-pickup .ui-footer-inner{width:calc(100% - 24px)}
 .ui-enhanced .ui-footer-about{width:100%;margin-bottom:4px}
 .ui-enhanced .ui-footer-links{gap:18px}
 .ui-enhanced .ui-footer-link{min-height:44px}
 .ui-enhanced .ui-footer-contact{padding-left:0;border-left:0}
 .ui-enhanced .ui-footer-contact a{min-height:44px}
}

.ui-enhanced #security-view{padding:8px 0 32px}
.ui-enhanced .sec-heading,.ui-enhanced .sec-toolbar,.ui-enhanced .sec-pagination{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.ui-enhanced .sec-heading h2{margin:0 0 4px;font:700 22px/1.4 var(--serif)}
.ui-enhanced .sec-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.ui-enhanced .sec-summary{display:grid;grid-template-columns:minmax(0,1fr) 140px 140px;gap:24px;padding:18px 0;margin:0 0 12px;border-bottom:1px solid var(--ui-divider,var(--line));align-items:center}
.ui-enhanced .sec-summary small,.ui-enhanced .sec-table small{display:block;margin-top:4px;font-size:12px}
.ui-enhanced .sec-summary>div:not(:first-child)>b{font:700 24px var(--serif)}
.ui-enhanced .sec-enabled{color:var(--ok)}
.ui-enhanced .sec-warning{color:var(--danger)}
.ui-enhanced .sec-tabs{display:flex;gap:8px;margin:0;min-width:0;flex-wrap:wrap}
.ui-enhanced .sec-tabs .btn{box-shadow:none;border:0;border-radius:0;border-bottom:2px solid transparent;background:transparent}
.ui-enhanced .sec-tabs .btn[aria-pressed=true]{border-bottom-color:var(--stamp);color:var(--ink)}
.ui-enhanced .sec-list-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}
.ui-enhanced .sec-toolbar{justify-content:flex-start;margin-bottom:8px;gap:12px}
.ui-enhanced .sec-filter-actions{gap:8px}
.ui-enhanced #sec-export{margin-left:8px}
.ui-enhanced .sec-filter-pending{display:block;color:var(--warn);font-size:12px;margin:8px 0}
.ui-enhanced .sec-filter-pending[hidden]{display:none}
.ui-enhanced .sec-rule-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin-top:12px;max-width:780px}
.ui-enhanced .sec-summary .sec-rule-summary{display:block;min-width:0}
.ui-enhanced .sec-rule-summary>.ui-help-anchor{gap:2px}
.ui-enhanced .sec-rule-summary b{font-size:13px;font-weight:500}
.ui-enhanced .sec-rule-inactive{color:var(--muted)}
.ui-enhanced .sec-metric{border-left:1px solid var(--ui-divider,var(--line));padding-left:24px}
.ui-enhanced .sec-auto-summary>b{font-size:12px;font-weight:500}
.ui-enhanced .sec-selection-count{font-size:12px;color:var(--muted);border-left:1px solid var(--line);padding-left:12px}
.ui-enhanced .sec-toolbar input,.ui-enhanced .sec-toolbar select,.ui-enhanced .sec-field input,.ui-enhanced .sec-field select{min-width:0;max-width:100%;min-height:38px;padding:7px 10px;font:inherit;background:var(--paper);color:var(--ink);border:1px solid var(--line);border-radius:var(--radius-sm)}
.ui-enhanced #sec-search{width:260px}
.ui-enhanced #sec-feedback{position:fixed;z-index:1000;top:max(16px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:10px;width:max-content;max-width:calc(100% - 32px);box-sizing:border-box;padding:12px 18px;margin:0;border:1px solid var(--ui-divider,var(--line));border-radius:var(--radius-sm);background:var(--paper);box-shadow:0 6px 24px #0003;color:var(--ink);font-size:13px;line-height:1.5;overflow-wrap:anywhere;pointer-events:none}
.ui-enhanced #sec-feedback::before{content:'\u2713';display:grid;place-items:center;flex:0 0 20px;width:20px;height:20px;border-radius:50%;background:color-mix(in srgb,var(--ok) 14%,var(--paper));color:var(--ok);font-weight:700}
.ui-enhanced #sec-feedback:empty{display:none}
.ui-enhanced .sec-pagination{padding:8px 0 14px}
.ui-enhanced .sec-table-wrap{overflow-x:auto}
.ui-enhanced .sec-table{width:100%;font-size:13px}
.ui-enhanced .sec-table th{background:var(--paper);font-size:12px;letter-spacing:0;white-space:nowrap}
.ui-enhanced .sec-table td,.ui-enhanced .sec-table th{padding:12px 8px;border-bottom:1px solid var(--ui-divider,var(--line));vertical-align:middle}
.ui-enhanced .sec-table td{white-space:normal;overflow-wrap:anywhere}
.ui-enhanced .sec-table .sec-address{min-width:160px;max-width:240px}
.ui-enhanced .sec-row-actions{white-space:nowrap!important}
.ui-enhanced .sec-row-actions .btn{padding:5px 8px;margin-right:4px}
.ui-enhanced :is(#security-view,#security-dialog,#share-edit-form) input[type=checkbox]{appearance:none;display:inline-grid;place-content:center;flex:0 0 18px;width:18px;height:18px;min-height:18px;margin:0;padding:0;border:1px solid var(--muted);border-radius:5px;background:var(--paper);vertical-align:middle;cursor:pointer}
.ui-enhanced :is(#security-view,#security-dialog,#share-edit-form) input[type=checkbox]::after{content:'';width:9px;height:5px;border:solid #1a2130;border-width:0 0 2px 2px;transform:translateY(-1px) rotate(-45deg);opacity:0}
.ui-enhanced :is(#security-view,#security-dialog,#share-edit-form) input[type=checkbox]:is(:checked,:indeterminate){background:var(--stamp);border-color:var(--stamp)}
.ui-enhanced :is(#security-view,#security-dialog,#share-edit-form) input[type=checkbox]:is(:checked,:indeterminate)::after{opacity:1}
.ui-enhanced :is(#security-view,#security-dialog,#share-edit-form) input[type=checkbox]:indeterminate::after{height:0;border-width:0 0 2px;transform:none}
.ui-enhanced :is(#security-view,#security-dialog,#share-edit-form) input[type=checkbox]:hover:not(:disabled){border-color:var(--stamp)}
.ui-enhanced :is(#security-view,#security-dialog,#share-edit-form) input[type=checkbox]:focus-visible{outline:2px solid var(--stamp);outline-offset:3px}
.ui-enhanced :is(#security-view,#security-dialog,#share-edit-form) input[type=checkbox]:disabled{background:var(--track);border-color:var(--line);cursor:not-allowed;opacity:.65}
.ui-enhanced .sec-check:has(input:disabled){color:var(--muted);opacity:.65;cursor:not-allowed}
.ui-enhanced .sec-number{display:grid;grid-template-columns:30px minmax(0,1fr) 30px;min-width:0;border:1px solid var(--line);border-radius:var(--radius-sm);background:var(--paper);overflow:hidden}
.ui-enhanced .sec-number:focus-within{border-color:var(--stamp);outline:2px solid color-mix(in srgb,var(--stamp) 25%,transparent);outline-offset:1px}
.ui-enhanced .sec-field .sec-number input{appearance:textfield;-moz-appearance:textfield;border:0;border-radius:0;box-shadow:none;outline:none;text-align:center;padding-inline:2px;font-variant-numeric:tabular-nums;background:transparent}
.ui-enhanced .sec-number input::-webkit-inner-spin-button,.ui-enhanced .sec-number input::-webkit-outer-spin-button{appearance:none;margin:0}
.ui-enhanced .sec-step{border:0;border-radius:0;background:transparent;color:var(--muted);font:20px/1 system-ui;padding:0;cursor:pointer;min-width:0;box-shadow:none}
.ui-enhanced .sec-step:hover:not(:disabled){background:var(--rowbg);color:var(--stamp)}
.ui-enhanced .sec-step:focus-visible{outline:2px solid var(--stamp);outline-offset:-3px}
.ui-enhanced .sec-step:disabled{opacity:.35;cursor:not-allowed}
.ui-enhanced .sec-number:has(input:disabled){background:var(--track);opacity:.65}
.ui-enhanced .sec-empty{padding:40px 12px;text-align:center;display:flex;gap:16px;justify-content:center;align-items:center;color:var(--muted)}
.ui-enhanced .sec-dialog{width:min(560px,calc(100vw - 24px))}
.ui-enhanced .sec-dialog .source-heading{gap:12px}
.ui-enhanced .sec-dialog-body{display:grid;gap:14px;padding-block:16px}
.ui-enhanced .sec-dialog-body p{margin:0}
.ui-enhanced .sec-field{display:grid;gap:6px;font-size:13px;min-width:0}
.ui-enhanced .sec-field>span{color:var(--muted)}
.ui-enhanced .sec-field input,.ui-enhanced .sec-field select{width:100%}
.ui-enhanced .sec-rule-fields{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.ui-enhanced .sec-check{display:flex;gap:8px;align-items:center;font-size:14px}
.ui-enhanced .sec-details{display:grid;gap:12px;margin:0}
.ui-enhanced .sec-details>div{display:grid;grid-template-columns:88px minmax(0,1fr);gap:10px;font-size:13px}
.ui-enhanced .sec-details dd{margin:0;overflow-wrap:anywhere}
.ui-enhanced .sec-ip-list{font:13px/1.7 ui-monospace,Consolas,monospace;overflow-wrap:anywhere}
.ui-enhanced .sec-setting-entry{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.ui-enhanced .sec-rule-summary b{min-width:56px;font-weight:500;color:var(--ink)}
.ui-enhanced .sec-scope-badges{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;font-size:11px;line-height:1.6;font-family:var(--sans,system-ui)}
.ui-enhanced .sec-scope-badges span{border:1px solid var(--line);border-radius:4px;padding:0 5px;color:var(--muted)}
.ui-enhanced .sec-scope-picker{display:flex;flex-wrap:wrap;gap:10px 20px;min-width:0;margin:0;padding:0;border:0}
.ui-enhanced .sec-scope-picker legend{color:var(--muted);font-size:13px;padding:0 0 8px}
.ui-enhanced .sec-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;align-items:end}
.ui-enhanced .sec-form-grid>.sec-check{min-height:38px}
.ui-enhanced .sec-rule-section{display:grid;gap:10px;border-bottom:1px solid var(--line);padding-bottom:14px}
.ui-enhanced .sec-rule-section>small{font-size:12px}
.ui-enhanced .sec-rules-dialog{width:min(720px,calc(100vw - 24px))}
.ui-enhanced .sec-rules-dialog .sec-dialog-body{gap:0;padding-block:8px}
.ui-enhanced .sec-rules-columns{display:grid;grid-template-columns:148px repeat(3,minmax(0,1fr));gap:12px;padding:8px 0;color:var(--muted);font-size:12px}
.ui-enhanced .sec-rules-dialog .sec-rule-section{grid-template-columns:148px minmax(0,1fr);align-items:center;gap:12px;padding:14px 0}
.ui-enhanced .sec-rules-dialog .sec-rule-section:last-child{border-bottom:0}
.ui-enhanced .sec-rules-dialog .sec-check{min-height:38px;gap:6px}
.ui-enhanced .sec-rules-dialog .sec-check b{font-size:13px;font-weight:500}
.ui-enhanced .sec-rules-dialog .sec-rule-fields{gap:12px}
@media(min-width:601px){
 .ui-enhanced .sec-rules-dialog .sec-field>span:first-child{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
 .ui-enhanced .sec-rules-dialog .sec-field{gap:0}
}
@media(max-width:600px){
 .ui-enhanced .sec-rules-columns{display:none}
 .ui-enhanced .sec-rules-dialog .sec-rule-section{grid-template-columns:1fr;gap:6px;padding:10px 0}
 .ui-enhanced .sec-rules-dialog .sec-rule-fields{grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
 .ui-enhanced .sec-rules-dialog .sec-rule-fields .sec-field{grid-template-columns:1fr;font-size:12px;gap:6px}
 .ui-enhanced .sec-rules-dialog .sec-number{grid-template-columns:26px minmax(0,1fr) 26px}
}
@media(max-width:380px){
 .ui-enhanced .sec-rules-dialog .sec-rule-fields{grid-template-columns:1fr}
 .ui-enhanced .sec-rules-dialog .sec-rule-fields .sec-field{grid-template-columns:minmax(0,1fr) 142px}
}
.ui-enhanced .sec-list-help{margin:0 0 16px;font-size:12px;line-height:1.7}
.ui-enhanced .sec-test-result{padding:12px 14px;display:grid;gap:8px;border-left:3px solid var(--ok);background:var(--paper)}
.ui-enhanced .sec-test-result[hidden]{display:none}
.ui-enhanced .sec-test-blocked{border-left-color:var(--danger)}
.ui-enhanced .sec-test-blocked>b{color:var(--danger)}
.ui-enhanced .sec-test-pass>b{color:var(--ok)}
.ui-enhanced .sec-test-result p{font-size:13px}
.ui-enhanced .sec-dialog .source-footer{flex-wrap:wrap}
@media(max-width:900px){.ui-enhanced #admin-navigation:has(#admin-security-tab){grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:600px){
 .ui-enhanced #admin-navigation:has(#admin-security-tab){gap:3px}
 .ui-enhanced #admin-navigation:has(#admin-security-tab) .admin-nav-link{padding-inline:3px;font-size:13px}
 .ui-enhanced .sec-summary{grid-template-columns:1fr 1fr;gap:16px;padding-block:14px}
 .ui-enhanced .sec-summary>div:first-child{grid-column:1/-1}
 .ui-enhanced .sec-rule-grid{gap:8px;margin-top:8px}
 .ui-enhanced .sec-summary .sec-rule-summary small{font-size:11px}
 .ui-enhanced .sec-metric{border-left:0;padding:8px 0 0;border-top:1px solid var(--ui-divider,var(--line));display:flex;gap:10px;align-items:center}
 .ui-enhanced .sec-metric small{margin:0}
 .ui-enhanced .sec-toolbar{display:grid;grid-template-columns:minmax(0,1fr);gap:8px;align-items:stretch}
 .ui-enhanced .sec-filters{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;width:100%}
 .ui-enhanced #sec-search{width:100%;grid-column:1/-1}
 .ui-enhanced .sec-filters:not(:has(#sec-kind)){grid-template-columns:minmax(0,1fr) 116px}
 .ui-enhanced .sec-filters:not(:has(#sec-kind)) #sec-search{grid-column:auto}
 .ui-enhanced .sec-filter-actions{display:grid;grid-template-columns:1fr 1fr 1.6fr}
 .ui-enhanced #sec-export{margin-left:0}
 .ui-enhanced .sec-filter-actions .btn{min-width:0;white-space:normal;padding-inline:6px;min-height:44px}
 .ui-enhanced .sec-list-heading{flex-wrap:wrap;gap:8px;margin-bottom:12px}
 .ui-enhanced .sec-tabs{flex:1 0 100%;border-bottom:1px solid var(--ui-divider,var(--line))}
 .ui-enhanced #sec-add{margin-left:auto;min-height:44px}
 .ui-enhanced .sec-pagination{gap:10px}
 .ui-enhanced .sec-pagination>.sec-actions:last-child{margin-left:auto}
 .ui-enhanced .sec-table{display:block}
 .ui-enhanced .sec-table-wrap{overflow:visible}
 .ui-enhanced .sec-table thead{display:none}
 .ui-enhanced .sec-table tbody{display:block}
 .ui-enhanced .sec-table tr{position:relative;display:grid;grid-template-columns:minmax(0,1fr);gap:8px;padding:16px 0;border-bottom:1px solid var(--ui-divider,var(--line))}
 .ui-enhanced .sec-table td{display:block;padding:0;border:0;min-width:0;max-width:none}
 .ui-enhanced .sec-table .sec-address{max-width:none;min-width:0;padding-right:36px}
 .ui-enhanced .sec-table .sec-select{position:absolute;top:14px;right:0;padding:8px}
 .ui-enhanced .sec-table td[data-label]:not(.sec-address)::before{content:attr(data-label)'\u3000';color:var(--muted);font-size:12px}
 .ui-enhanced .sec-row-actions{display:flex!important;gap:8px;white-space:normal!important}
 .ui-enhanced .sec-row-actions .btn{margin:0;flex:1;min-height:44px}
 .ui-enhanced .sec-toolbar input,.ui-enhanced .sec-toolbar select,.ui-enhanced .sec-field input,.ui-enhanced .sec-field select{min-height:44px;font-size:16px}
 .ui-enhanced .sec-rule-fields{grid-template-columns:1fr}
 .ui-enhanced .sec-rule-fields .sec-field{grid-template-columns:minmax(0,1fr) 134px;align-items:center}
 .ui-enhanced .sec-tabs{gap:2px}
 .ui-enhanced .sec-tabs>.btn{flex:1;padding-inline:4px;font-size:13px}
 .ui-enhanced .sec-form-grid{grid-template-columns:1fr}
 .ui-enhanced .sec-heading>.sec-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));width:auto}
 .ui-enhanced .sec-heading>.sec-actions .btn{min-height:44px}
 .ui-enhanced .sec-region-table .sec-row-actions{display:grid!important;grid-template-columns:1fr 1fr}
 .ui-enhanced .sec-scope-picker .sec-check{min-height:32px}
}
@media(forced-colors:active){
 .ui-enhanced :is(#security-view,#security-dialog,#share-edit-form) input[type=checkbox]{appearance:auto}
 .ui-enhanced :is(#security-view,#security-dialog,#share-edit-form) input[type=checkbox]::after{display:none}
}

.ui-enhanced .sec-number input[type=number]{appearance:textfield;-moz-appearance:textfield;min-width:0;width:100%;min-height:38px;padding:6px 2px;border:0;border-radius:0;box-shadow:none;outline:none;text-align:center;background:transparent;color:var(--ink);font:inherit;font-variant-numeric:tabular-nums}
.ui-enhanced #retention-form,.ui-enhanced #guest-policy-form{grid-template-columns:minmax(0,1fr) 154px auto}
.ui-enhanced .setting-value .sec-number{width:130px;flex:0 1 130px}
.ui-enhanced #retention-form .sec-number input,.ui-enhanced #guest-policy-form .sec-number input{width:100%;min-width:0;border:0;border-radius:0;box-shadow:none;outline:none;background:transparent;padding:6px 2px;text-align:center}
.ui-enhanced .sec-ip-line{display:flex;align-items:baseline;flex-wrap:wrap;column-gap:5px;row-gap:3px}
.ui-enhanced .sec-ip-line>.sec-scope-sup{display:inline-flex;position:relative;top:-.35em;margin:0;font-size:10px;line-height:1.3;gap:3px;vertical-align:super}
.ui-enhanced .sec-scope-sup span{padding:0 3px;white-space:nowrap;border-radius:3px}
.ui-enhanced .sec-table .sec-address:has(.sec-ip-line){min-width:260px;max-width:350px}
.ui-enhanced .ui-help-anchor{display:flex;align-items:center;gap:5px;min-width:0}
.ui-enhanced .ui-help-anchor>h4{margin:0}
.ui-enhanced .settings-section>.ui-help-anchor{margin-bottom:8px}
.ui-enhanced .ui-help-button{position:relative;display:inline-grid;place-items:center;flex:0 0 24px;width:24px;min-height:24px;padding:0;border:0;border-radius:50%;background:transparent;color:var(--muted);font:600 12px/1 system-ui;box-shadow:none;cursor:help}
.ui-enhanced .ui-help-button::before{content:'';position:absolute;inset:4px;border:1px solid currentColor;border-radius:50%}
.ui-enhanced .ui-help-button:hover,.ui-enhanced .ui-help-button[aria-expanded=true]{color:var(--stamp)}
.ui-enhanced .ui-help-button:focus-visible{outline:2px solid var(--stamp);outline-offset:1px}
.ui-enhanced .ui-help-popover{position:fixed;inset:auto;margin:0;padding:10px 12px;border:1px solid var(--line);border-radius:8px;box-shadow:0 6px 24px var(--mask);background:var(--paper);color:var(--ink);font:12px/1.7 system-ui;overflow:auto;overflow-wrap:anywhere}
.ui-enhanced .ui-help-popover small{display:block;color:inherit;font-size:inherit;line-height:inherit}
.ui-enhanced summary>.ui-help-anchor{display:inline-flex;vertical-align:middle}
@media(min-width:601px){.ui-enhanced.ui-send .upload-context summary{padding-block:2px}}
.ui-enhanced .source-heading>.ui-help-anchor{flex-wrap:wrap;row-gap:0}
.ui-enhanced .source-heading .ui-help-anchor>h3{margin:0}
.ui-enhanced .sec-rule-section>.ui-help-anchor{justify-content:flex-start}
.ui-enhanced .sec-field>.ui-help-anchor{min-height:24px}
.ui-enhanced #source-detail .source-field>.ui-help-anchor{gap:2px;align-self:start}
.ui-enhanced #source-history>.ui-help-anchor{margin-bottom:6px}
.ui-enhanced #source-history .ui-help-anchor>h4{margin:0}
@media(max-width:600px){
 .ui-enhanced .sec-number input[type=number]{min-height:44px;font-size:16px}
 .ui-enhanced #retention-form,.ui-enhanced #guest-policy-form{grid-template-columns:minmax(0,1fr) auto;row-gap:6px}
 .ui-enhanced #retention-form>label,.ui-enhanced #guest-policy-form>.ui-help-anchor{grid-column:1/-1}
 .ui-enhanced .setting-value .sec-number{width:146px;flex-basis:146px;grid-template-columns:34px minmax(0,1fr) 34px}
 .ui-enhanced .sec-table .sec-address:has(.sec-ip-line){min-width:0;max-width:none}
 .ui-enhanced .sec-address:has(.sec-ip-line){padding-right:28px}
 .ui-enhanced .ui-help-button{flex-basis:32px;width:32px;min-height:32px}
 .ui-enhanced .ui-help-button::before{inset:8px}
}

.ui-enhanced .ui-record-line{display:flex;align-items:baseline;flex-wrap:wrap;gap:3px 6px;min-width:0;white-space:normal;overflow-wrap:anywhere}
.ui-enhanced .ui-record-sup,.ui-enhanced .share-kind.badge{display:inline-block;position:relative;top:-.35em;flex:none;align-self:baseline;vertical-align:super;margin:0;padding:0 4px;border:1px solid var(--line);border-radius:3px;background:transparent;color:var(--muted);font:400 11px/1.4 system-ui;white-space:nowrap;letter-spacing:0;box-shadow:none}
.ui-enhanced .sec-ip-line>.sec-scope-sup{font-size:11px;line-height:1.4}
.ui-enhanced .sec-scope-sup span{padding:0 4px}
.ui-enhanced{--tag-blue:#1b57a3;--tag-teal:#16645c;--tag-amber:#82500a;--tag-orange:#934615;--tag-violet:#7040a0;--tag-slate:#475970}
.ui-enhanced[data-theme='dark']{--tag-blue:#9cc7ff;--tag-teal:#7ddacb;--tag-amber:#f1c479;--tag-orange:#f6ad78;--tag-violet:#d2afff;--tag-slate:#bcc9dd}
.ui-enhanced [data-tone='blue']{--tag-ink:var(--tag-blue)}
.ui-enhanced [data-tone='teal']{--tag-ink:var(--tag-teal)}
.ui-enhanced [data-tone='amber']{--tag-ink:var(--tag-amber)}
.ui-enhanced [data-tone='orange'],.ui-enhanced .share-kind.kind-file{--tag-ink:var(--tag-orange)}
.ui-enhanced [data-tone='violet'],.ui-enhanced .share-kind.kind-text{--tag-ink:var(--tag-violet)}
.ui-enhanced [data-tone='slate']{--tag-ink:var(--tag-slate)}
.ui-enhanced .ui-record-sup,.ui-enhanced .share-kind.badge,.ui-enhanced .sec-scope-badges [data-tone]{color:var(--tag-ink,var(--muted));border-color:color-mix(in srgb,var(--tag-ink,var(--muted)) 42%,var(--line));background:color-mix(in srgb,var(--tag-ink,var(--muted)) 10%,var(--paper))}
.ui-enhanced #audit-body .ui-record-line{max-width:290px}
.ui-enhanced #audit-body .ui-record-line>span{min-width:0}
@media(max-width:600px){
 .ui-enhanced #audit-body .ui-record-line{max-width:none;row-gap:4px}
 .ui-enhanced .sec-region-table .sec-address{padding-right:0}
}

.ui-enhanced .audit-heading{margin-bottom:8px}
.ui-enhanced #audit-filter{display:grid;grid-template-columns:120px 150px 150px minmax(160px,1fr) auto;gap:12px;align-items:end;margin-block:16px 10px;padding:0;border:0;background:transparent}
.ui-enhanced #audit-filter .audit-search{min-width:0}
.ui-enhanced #audit-filter>.audit-actions{gap:8px}
.ui-enhanced #audit-export{margin-left:8px}
.ui-enhanced #audit-export[aria-disabled=true]{opacity:.45;cursor:not-allowed}
.ui-enhanced .ui-audit-pending{grid-column:1/-1;color:var(--warn);font-size:12px;line-height:1.5}
.ui-enhanced #audit-pager{padding-block:10px;margin-bottom:12px}
@media(max-width:1199px){
 .ui-enhanced #audit-filter{grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
 .ui-enhanced #audit-filter .audit-search{grid-column:1/3}
 .ui-enhanced #audit-filter>.audit-actions{grid-column:3;justify-content:flex-end;flex-wrap:wrap}
 .ui-enhanced #audit-export{margin-left:0}
}
@media(max-width:600px){
 .ui-enhanced #audit-filter{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 8px}
 .ui-enhanced #audit-filter .audit-search{grid-column:auto}
 .ui-enhanced #audit-filter>.audit-actions{grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr 1.6fr}
 .ui-enhanced #audit-filter>.audit-actions .btn{min-width:0;padding-inline:6px;white-space:normal}
 .ui-enhanced .audit-heading{align-items:flex-start}
}

.ui-enhanced #sec-feedback.sec-feedback-error{color:var(--danger)}
.ui-enhanced #sec-feedback.sec-feedback-error::before{content:"!";color:var(--danger);background:transparent}

@media(max-width:600px){
 .ui-enhanced[lang=en] #shares-body td:nth-child(5)::before{content:'Picked '}
 .ui-enhanced[lang=en] #shares-body td:nth-child(6)::before{content:'Expires '}
 .ui-enhanced[lang=en] #shares-body td:nth-child(8)::before{content:'Created '}
}
.ui-enhanced .security-feedback{margin-top:18px;padding:18px;border:1px solid color-mix(in srgb,var(--warn) 45%,var(--line));border-radius:12px;background:color-mix(in srgb,var(--warn-soft) 25%,var(--paper));text-align:left;min-width:0}
.security-feedback:focus{outline:none}.security-feedback-head{display:flex;gap:12px;align-items:flex-start}
.security-feedback-icon{flex:0 0 32px;width:32px;height:32px;display:grid;place-items:center;border:1px solid var(--warn);border-radius:50%;color:var(--warn);font-weight:700}
.security-feedback h3{margin:0 0 6px;font-size:16px}.security-feedback p{margin:0;color:var(--muted);font-size:13px;line-height:1.8}
.security-feedback-time{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;border-top:1px solid var(--line);margin-top:14px;padding-top:10px;color:var(--muted);font-size:12px;font-variant-numeric:tabular-nums}
.security-feedback-actions{display:flex;gap:12px;justify-content:space-between;flex-wrap:wrap;margin-top:16px}.security-feedback-actions .btn{min-height:44px}
.security-feedback-fallback{display:flex;justify-content:flex-end;align-items:center;gap:10px;margin-top:10px}
.security-text-button{border:0;background:none;color:var(--muted);font:inherit;font-size:12px;padding:6px 0;cursor:pointer;text-decoration:underline;text-underline-offset:3px}
.security-text-button:focus-visible,.security-help:focus-visible{outline:2px solid var(--stamp);outline-offset:3px}
.security-help-wrap{position:relative;display:inline-flex}.security-help{width:28px;height:28px;border:1px solid var(--line);border-radius:50%;background:transparent;color:var(--muted);cursor:help}
.security-help-text{display:none;position:absolute;bottom:34px;right:0;width:min(240px,65vw);padding:10px;background:var(--paper);color:var(--ink);border:1px solid var(--line);border-radius:8px;font-size:12px;z-index:5}
.security-help:hover+.security-help-text,.security-help:focus-visible+.security-help-text,.security-help[aria-expanded=true]+.security-help-text{display:block}
.security-feedback-reference{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;border-top:1px solid var(--line);padding-top:10px;margin-top:12px;color:var(--muted);font-size:11px;overflow-wrap:anywhere}.security-feedback-reference>span{min-width:0;flex:1 1 160px}
.security-feedback .security-feedback-status:empty{display:none}.security-feedback .security-feedback-status{margin-top:8px;color:var(--ok)}
.security-copy-dialog{width:min(480px,calc(100vw - 24px));padding:18px;background:var(--paper);color:var(--ink);border:1px solid var(--line);border-radius:12px}.security-copy-dialog::backdrop{background:var(--mask)}
.security-copy-dialog textarea{width:100%;height:160px;margin-bottom:12px;background:var(--bag);color:var(--ink);border:1px solid var(--line);padding:8px}
@media(max-width:600px){.ui-enhanced .security-feedback{padding:14px}.security-feedback-actions .btn{flex:1;font-size:13px;padding-inline:8px}.security-text-button{min-height:44px}}

/* The first paint uses the final templates, even before interaction modules arrive. */
.ui-send .upload-context summary>[data-i18n="context.visibility"]{display:none}
.ui-send #upload-policy-hint{min-height:1.6em}
@media(max-width:600px){
 .ui-send #upload-policy-hint{min-height:3.2em}
 .ui-send #dz-hint{display:block;min-height:3.2em}
}

.ui-send .form-card,.ui-send .result-placeholder,.ui-pickup #pickup-input-card,.ui-combined #admin-login{animation:none}
.ui-enhanced.ui-send .upload-context>summary{display:flex;align-items:center;gap:6px;list-style:none}
.ui-send .upload-context>summary::-webkit-details-marker{display:none}
.ui-send .upload-context>summary::before{content:'\u25B8';transform:rotate(90deg);font-size:12px}
.ui-send .upload-context:not([open])>summary::before{transform:none}
@media(max-width:600px){.ui-enhanced.ui-send .upload-context>summary{min-height:44px}}
/* Reserve the date's line box before its client-local value is filled in. */
.ui-send .cap-date:empty::before{content:'\\00a0'}
` }, "732e7eabbd2c58e9");

// ../../node_modules/hono/dist/compose.js
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

// ../../node_modules/hono/dist/http-exception.js
var HTTPException = class extends Error {
  static {
    __name(this, "HTTPException");
  }
  res;
  status;
  /**
   * Creates an instance of `HTTPException`.
   * @param status - HTTP status code for the exception. Defaults to 500.
   * @param options - Additional options for the exception.
   */
  constructor(status = 500, options) {
    super(options?.message, { cause: options?.cause });
    this.res = options?.res;
    this.status = status;
  }
  /**
   * Returns the response object associated with the exception.
   * If a response object is not provided, a new response is created with the error message and status code.
   * @returns The response object.
   */
  getResponse() {
    if (this.res) {
      const newResponse = new Response(this.res.body, {
        status: this.status,
        headers: this.res.headers
      });
      return newResponse;
    }
    return new Response(this.message, {
      status: this.status
    });
  }
};

// ../../node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// ../../node_modules/hono/dist/utils/buffer.js
var bufferToFormData = /* @__PURE__ */ __name((arrayBuffer, contentType) => {
  const response = new Response(arrayBuffer, {
    headers: {
      // Normalize the media type (case-insensitive) while keeping parameters like the boundary
      "Content-Type": contentType.replace(/^[^;]+/, (mediaType) => mediaType.toLowerCase())
    }
  });
  return response.formData();
}, "bufferToFormData");

// ../../node_modules/hono/dist/utils/body.js
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

// ../../node_modules/hono/dist/utils/url.js
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

// ../../node_modules/hono/dist/request.js
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
    return this.#cachedBody("text").then((text2) => JSON.parse(text2));
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

// ../../node_modules/hono/dist/utils/html.js
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

// ../../node_modules/hono/dist/context.js
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
  text = /* @__PURE__ */ __name((text2, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text2) : this.#newResponse(
      text2,
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
  redirect = /* @__PURE__ */ __name((location2, status) => {
    const locationString = String(location2);
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

// ../../node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch", "query"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// ../../node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// ../../node_modules/hono/dist/hono-base.js
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

// ../../node_modules/hono/dist/router/utils.js
var createNullObject = /* @__PURE__ */ __name(() => /* @__PURE__ */ Object.create(null), "createNullObject");

// ../../node_modules/hono/dist/router/reg-exp-router/matcher.js
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

// ../../node_modules/hono/dist/router/reg-exp-router/node.js
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

// ../../node_modules/hono/dist/router/reg-exp-router/trie.js
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

// ../../node_modules/hono/dist/router/reg-exp-router/router.js
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
    const routes2 = this.#routes;
    if (!middleware) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      this.#tries[method] = new Trie();
      for (const handlerMap of [middleware, routes2]) {
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
      for (const handlerMap of [middleware, routes2]) {
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
        if (!routes2[m][path2]) {
          this.#insertPath(m, path2);
          routes2[m][path2] = findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || [];
        }
        routes2[m][path2].push([handler, path2]);
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
    const routes2 = this.#routes[method];
    const trie = this.#tries[method];
    const staticMap = createNullObject();
    const handlerData = [];
    const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
    for (const r of [middleware, routes2]) {
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

// ../../node_modules/hono/dist/router/smart-router/router.js
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
    const routes2 = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes2.length; i2 < len2; i2++) {
          router.add(...routes2[i2]);
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

// ../../node_modules/hono/dist/router/trie-router/node.js
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

// ../../node_modules/hono/dist/router/trie-router/router.js
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

// ../../node_modules/hono/dist/hono.js
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

// ../../node_modules/hono/dist/middleware/body-limit/index.js
var ERROR_MESSAGE = "Payload Too Large";
var bodyLimit = /* @__PURE__ */ __name((options) => {
  const onError = options.onError || (() => {
    const res = new Response(ERROR_MESSAGE, {
      status: 413
    });
    throw new HTTPException(413, { res });
  });
  const maxSize = options.maxSize;
  return /* @__PURE__ */ __name(async function bodyLimit2(c, next) {
    if (!c.req.raw.body) {
      return next();
    }
    const hasTransferEncoding = c.req.raw.headers.has("transfer-encoding");
    const hasContentLength = c.req.raw.headers.has("content-length");
    if (hasContentLength && !hasTransferEncoding) {
      const contentLength = parseInt(c.req.raw.headers.get("content-length") || "0", 10);
      return contentLength > maxSize ? onError(c) : next();
    }
    let size = 0;
    const chunks = [];
    const rawReader = c.req.raw.body.getReader();
    for (; ; ) {
      const { done, value } = await rawReader.read();
      if (done) {
        break;
      }
      size += value.length;
      if (size > maxSize) {
        return onError(c);
      }
      chunks.push(value);
    }
    const requestInit = {
      body: new ReadableStream({
        start(controller) {
          for (const chunk of chunks) {
            controller.enqueue(chunk);
          }
          controller.close();
        }
      }),
      duplex: "half"
    };
    c.req.raw = new Request(c.req.raw, requestInit);
    return next();
  }, "bodyLimit2");
}, "bodyLimit");

// src/types.ts
function num(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
__name(num, "num");

// src/auth.ts
async function safeEqual(a, b) {
  const encode = new TextEncoder();
  const [da, db] = await Promise.all([a, b].map((value) => crypto.subtle.digest("SHA-256", encode.encode(value))));
  const subtle = crypto.subtle;
  if (subtle.timingSafeEqual) return subtle.timingSafeEqual(da, db);
  const aa = new Uint8Array(da), bb = new Uint8Array(db);
  let difference = 0;
  for (let i = 0; i < aa.length; i++) difference |= aa[i] ^ bb[i];
  return difference === 0;
}
__name(safeEqual, "safeEqual");

// src/settings.ts
var DEFAULT_RETENTION_DAYS = 30;
var MAX_RETENTION_DAYS = 3650;
var RETENTION_DAY_MS = 864e5;
var KEY = "sys:expired-retention-days";
var CREATE_SETTINGS = "CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)";
function validRetentionDays(value) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= MAX_RETENTION_DAYS;
}
__name(validRetentionDays, "validRetentionDays");
async function readSetting(env, key) {
  let raw2;
  if (env.fileKV) raw2 = await env.fileKV.get(key);
  else if (env.DB) {
    try {
      const row = await env.DB.prepare("SELECT value FROM app_settings WHERE key = ?").bind(key).first();
      raw2 = row?.value ?? null;
    } catch (error) {
      const message = error instanceof Error ? `${error.message} ${String(error.cause ?? "")}` : String(error);
      if (/no such table: app_settings/i.test(message)) return null;
      throw error;
    }
  } else throw new Error("No metadata store configured");
  return raw2;
}
__name(readSetting, "readSetting");
async function getRetentionDays(env) {
  const raw2 = await readSetting(env, KEY);
  if (raw2 === null) return DEFAULT_RETENTION_DAYS;
  const days = /^\d+$/.test(raw2) ? Number(raw2) : NaN;
  if (!validRetentionDays(days)) throw new Error("Invalid stored retention setting; cleanup stopped");
  return days;
}
__name(getRetentionDays, "getRetentionDays");
async function setRetentionDays(env, days) {
  if (!validRetentionDays(days)) throw new Error("Invalid retention days");
  await writeSetting(env, KEY, String(days));
}
__name(setRetentionDays, "setRetentionDays");
async function writeSetting(env, key, value) {
  if (env.fileKV) await env.fileKV.put(key, value);
  else if (env.DB) {
    await env.DB.prepare(CREATE_SETTINGS).run();
    await env.DB.prepare("INSERT INTO app_settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(key, value).run();
  } else throw new Error("No metadata store configured");
}
__name(writeSetting, "writeSetting");

// src/security-feedback.ts
function securityDownloadPage(data) {
  const payload = JSON.stringify(data).replace(/</g, "\\u003c");
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>\u6587\u4EF6\u4E0B\u8F7D \xB7 \u6587\u4EF6\u4E2D\u8F6C\u7AD9</title><link rel="stylesheet" href="${assetUrl("/style.css")}"><link rel="stylesheet" href="${assetUrl("/ui.css")}">
<script type="module" src="${assetUrl("/js/security-download.js")}"><\/script></head><body>
<header class="topbar"><div class="brand"><span class="logo">\u{1F4E6}</span><b>\u6587\u4EF6\u4E2D\u8F6C\u7AD9</b></div>
<div class="actions"><button id="lang-btn" class="icon-btn">EN</button><button id="theme-btn" class="icon-btn" aria-label="\u5207\u6362\u4E3B\u9898">\u{1F317}</button></div></header>
<main class="container narrow"><section id="download-feedback"></section>
<noscript><p>\u5F53\u524D\u65E0\u6CD5\u4E0B\u8F7D\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u6216\u8054\u7CFB\u7AD9\u957F\u3002</p><a href="mailto:iblykk@gmail.com">\u8054\u7CFB\u7AD9\u957F</a></noscript>
<p><a id="back-pickup" href="/pickup">\u8FD4\u56DE\u53D6\u4EF6\u9875</a></p></main>
<script type="application/json" id="security-data">${payload}<\/script></body></html>`;
}
__name(securityDownloadPage, "securityDownloadPage");

// src/security.ts
var SECURITY_KEY = "__file-relay/security-v1.json";
var SCOPES = ["login", "upload", "pickup"];
var SecurityError = class extends Error {
  constructor(status, message, retryAt, newBan = false, reason = status === 503 ? "service_unavailable" : status === 429 ? "rate_limit" : "access_rule") {
    super(message);
    this.status = status;
    this.retryAt = retryAt;
    this.newBan = newBan;
    this.reason = reason;
  }
  status;
  retryAt;
  newBan;
  reason;
  static {
    __name(this, "SecurityError");
  }
};
function securityResponse(c, e) {
  if (!(e instanceof SecurityError))
    return;
  c.header("Cache-Control", "no-store");
  if (e.retryAt)
    c.header("Retry-After", String(Math.max(1, Math.ceil((e.retryAt - Date.now()) / 1e3))));
  const data = { error: e.status === 503 ? "security_unavailable" : e.status === 409 ? "security_conflict" : e.status === 400 ? "bad_request" : "security_blocked", message: e.message, retryAt: e.retryAt, reason: e.reason, serverTime: Date.now(), requestId: crypto.randomUUID() };
  c.header("X-Request-ID", data.requestId);
  console.warn("security_rejection", { requestId: data.requestId, reason: data.reason, status: e.status });
  if (["GET", "HEAD"].includes(c.req.method) && /^\/api\/pickup\/[^/]+\/download$/.test(c.req.path) && (c.req.header("Accept") || "").includes("text/html")) {
    c.header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
    c.header("Referrer-Policy", "no-referrer");
    return c.html(securityDownloadPage(data), e.status);
  }
  return c.json(data, e.status);
}
__name(securityResponse, "securityResponse");
var securityEnabled = /* @__PURE__ */ __name((env) => !!(env.BUCKET || env.DB), "securityEnabled");
function canonicalIP(value) {
  if (typeof value !== "string" || value.length > 45)
    return null;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(value) && value.split(".").every((x) => Number(x) <= 255 && !/^0\d/.test(x)))
    return value;
  if (!value.includes(":") || !/^[a-fA-F0-9:.]+$/.test(value))
    return null;
  try {
    return new URL(`http://[${value}]/`).hostname.slice(1, -1).toLowerCase();
  } catch {
    return null;
  }
}
__name(canonicalIP, "canonicalIP");
var MAX_MANUAL_BAN_MINUTES = 30 * 24 * 60;
var defaults = /* @__PURE__ */ __name(() => ({ version: 1, revision: "", configRevision: "", rules: {
  login: { enabled: true, limit: 5, window: 10, duration: 30 },
  upload: { enabled: true, limit: 20, window: 10, duration: 30 },
  pickup: { enabled: true, limit: 10, window: 10, duration: 30 }
}, bans: [], allow: [], regions: [], counters: [] }), "defaults");
var integer = /* @__PURE__ */ __name((v, min, max) => Number.isSafeInteger(v) && v >= min && v <= max, "integer");
var validScopes = /* @__PURE__ */ __name((v, region = false) => Array.isArray(v) && v.length > 0 && v.length <= 3 && new Set(v).size === v.length && v.every((s) => SCOPES.includes(s) && (!region || s !== "login")), "validScopes");
var note = /* @__PURE__ */ __name((v) => typeof v === "string" && v.trim().length > 0 && v.length <= 120 && !/[\u0000-\u001f\u007f]/.test(v), "note");
var timestamp = /* @__PURE__ */ __name((v) => integer(v, 0, Number.MAX_SAFE_INTEGER), "timestamp");
var untilValid = /* @__PURE__ */ __name((v) => v === null || timestamp(v), "untilValid");
var rulesValid = /* @__PURE__ */ __name((v) => v && Object.keys(v).length === 3 && SCOPES.every((k) => v[k] && typeof v[k].enabled === "boolean" && integer(v[k].limit, 1, 1e4) && integer(v[k].window, 1, 1440) && integer(v[k].duration, 1, 10080)), "rulesValid");
function parse(raw2) {
  if (raw2 === null)
    return defaults();
  const d = JSON.parse(raw2);
  if (d?.version !== 1 || typeof d.revision !== "string" || typeof d.configRevision !== "string" || !rulesValid(d.rules) || !Array.isArray(d.bans) || d.bans.length > 1e3 || d.bans.some((b) => !b || !(!!canonicalIP(b.ip) && canonicalIP(b.ip) === b.ip || b.ip === "unknown") || !validScopes(b.scopes) || !["auto", "manual"].includes(b.kind) || !note(b.reason) || !integer(b.failures, 0, 1e4) || !timestamp(b.at) || !untilValid(b.until)) || !Array.isArray(d.allow) || d.allow.length > 200 || d.allow.some((a) => !a || !canonicalIP(a.ip) || canonicalIP(a.ip) !== a.ip || !validScopes(a.scopes) || !note(a.note) || !timestamp(a.created)) || !Array.isArray(d.regions) || d.regions.length > 200 || d.regions.some((r) => !r || typeof r.id !== "string" || !/^[A-Z]{2}$/.test(r.country) || !/^[A-Z0-9-]{0,10}$/.test(r.region) || !validScopes(r.scopes, true) || typeof r.enabled !== "boolean" || !note(r.reason) || !timestamp(r.at) || !untilValid(r.until)) || !Array.isArray(d.counters) || d.counters.length > 1e3 || d.counters.some((c) => !c || !(!!canonicalIP(c.ip) && canonicalIP(c.ip) === c.ip || c.ip === "unknown") || !SCOPES.includes(c.scope) || !Array.isArray(c.times) || c.times.length > 1e4 || c.times.some((n) => !timestamp(n))) || d.counters.reduce((n, c) => n + c.times.length, 0) > 2e4)
    throw new Error("Invalid security state");
  return d;
}
__name(parse, "parse");
function prune(d, now) {
  d.bans = d.bans.filter((b) => b.until === null || b.until > now);
  d.counters = d.counters.filter((c) => {
    c.times = c.times.filter((n) => n + d.rules[c.scope].window * 6e4 > now);
    return c.times.length;
  });
}
__name(prune, "prune");
async function read(env) {
  if (env.BUCKET) {
    const obj = await env.BUCKET.get(SECURITY_KEY);
    return { data: parse(obj ? await obj.text() : null), previous: obj?.etag ?? null };
  }
  await env.DB.prepare(CREATE_SETTINGS).run();
  const row = await env.DB.prepare("SELECT value FROM app_settings WHERE key=?").bind(SECURITY_KEY).first();
  return { data: parse(row?.value ?? null), previous: row?.value ?? null };
}
__name(read, "read");
async function write(env, d, previous) {
  d.revision = crypto.randomUUID();
  const value = JSON.stringify(d);
  if (env.BUCKET)
    return !!await env.BUCKET.put(SECURITY_KEY, value, { onlyIf: previous === null ? { etagDoesNotMatch: "*" } : { etagMatches: previous }, httpMetadata: { contentType: "application/json" }, storageClass: "Standard" });
  const result = previous === null ? await env.DB.prepare("INSERT INTO app_settings (key,value) VALUES (?,?) ON CONFLICT(key) DO NOTHING").bind(SECURITY_KEY, value).run() : await env.DB.prepare("UPDATE app_settings SET value=? WHERE key=? AND value=?").bind(value, SECURITY_KEY, previous).run();
  return result.meta.changes === 1;
}
__name(write, "write");
async function securityState(env) {
  if (!securityEnabled(env))
    return defaults();
  try {
    const { data } = await read(env);
    prune(data, Date.now());
    return data;
  } catch {
    throw new SecurityError(503, "\u5B89\u5168\u9632\u62A4\u6682\u4E0D\u53EF\u7528\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5");
  }
}
__name(securityState, "securityState");
async function change(env, edit) {
  if (!securityEnabled(env))
    throw new SecurityError(503, "\u5B89\u5168\u9632\u62A4\u9700\u8981\u7ED1\u5B9A R2 \u6216 D1");
  try {
    for (let attempt = 0; attempt < 5; attempt++) {
      if (attempt)
        await new Promise((r) => setTimeout(r, 1100 + Math.random() * 200));
      const { data, previous } = await read(env);
      prune(data, Date.now());
      if (edit(data, Date.now()) === false)
        return data;
      try {
        if (await write(env, data, previous))
          return data;
      } catch (e) {
        if (!/429|rate|too many/i.test(String(e)))
          throw e;
      }
    }
  } catch (e) {
    if (e instanceof SecurityError)
      throw e;
  }
  throw new SecurityError(503, "\u5B89\u5168\u9632\u62A4\u5B58\u50A8\u7E41\u5FD9\u6216\u4E0D\u53EF\u7528\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5");
}
__name(change, "change");
function exempt(d, ip, scope) {
  return d.allow.some((a) => a.ip === ip && a.scopes.includes(scope));
}
__name(exempt, "exempt");
function evaluate(d, ip, scope, country = "", region = "", now = Date.now()) {
  const ban = d.bans.find((b) => b.ip === ip && b.scopes.includes(scope) && (b.until === null || b.until > now) && (b.kind === "manual" || !exempt(d, ip, scope)));
  if (ban)
    return { blocked: true, reason: ban.reason, publicReason: ban.kind === "auto" ? "rate_limit" : "access_rule", retryAt: ban.until ?? void 0, status: ban.kind === "auto" ? 429 : 403 };
  const geo = scope === "login" ? void 0 : d.regions.find((r) => r.enabled && r.scopes.includes(scope) && (r.until === null || r.until > now) && country !== "" && r.country === country && (!r.region || r.region === region));
  if (geo)
    return { blocked: true, reason: "\u547D\u4E2D\u5730\u533A\u5C01\u7981\u89C4\u5219", publicReason: "region", retryAt: geo.until ?? void 0, status: 403 };
  return { blocked: false, reason: exempt(d, ip, scope) ? "\u547D\u4E2D\u5141\u8BB8\u540D\u5355" : "\u9632\u62A4\u653E\u884C", retryAt: void 0 };
}
__name(evaluate, "evaluate");
async function enforceSecurity(env, ip, scope, country = "", region = "", count = false) {
  if (!securityEnabled(env))
    return;
  const check = /* @__PURE__ */ __name((d) => {
    const result = evaluate(d, ip, scope, country, region);
    if (result.blocked)
      throw new SecurityError(result.status || 403, "\u5F53\u524D\u8BF7\u6C42\u53D7\u8BBF\u95EE\u89C4\u5219\u9650\u5236", result.retryAt, false, result.publicReason);
  }, "check");
  if (!count) {
    check(await securityState(env));
    return;
  }
  let retryAt;
  await change(env, (d, now) => {
    retryAt = void 0;
    check(d);
    const rule = d.rules[scope];
    if (!rule.enabled || exempt(d, ip, scope))
      return false;
    let counter = d.counters.find((c) => c.ip === ip && c.scope === scope);
    if (!counter) {
      if (d.counters.length >= 1e3)
        throw new SecurityError(503, "\u9632\u62A4\u8BA1\u6570\u5BB9\u91CF\u5DF2\u6EE1\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5");
      counter = { ip, scope, times: [] };
      d.counters.push(counter);
    }
    if (d.counters.reduce((n, c) => n + c.times.length, 0) >= 2e4)
      throw new SecurityError(503, "\u9632\u62A4\u8BA1\u6570\u5BB9\u91CF\u5DF2\u6EE1\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5");
    counter.times.push(now);
    if (counter.times.length >= rule.limit) {
      if (d.bans.length >= 1e3)
        throw new SecurityError(503, "\u9632\u62A4\u8BB0\u5F55\u5BB9\u91CF\u5DF2\u6EE1\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5");
      retryAt = now + rule.duration * 6e4;
      d.bans.push({ ip, scopes: [scope], kind: "auto", reason: scope === "upload" ? "\u4E0A\u4F20\u8BF7\u6C42\u8D85\u8FC7\u9891\u7387\u9650\u5236" : "\u65E0\u6548\u53D6\u4EF6\u53E3\u4EE4\u8D85\u8FC7\u9891\u7387\u9650\u5236", failures: counter.times.length, at: now, until: retryAt });
      d.counters = d.counters.filter((c) => c !== counter);
    }
  });
  if (retryAt)
    throw new SecurityError(429, "\u8BF7\u6C42\u8FC7\u4E8E\u9891\u7E41\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5", retryAt, true);
}
__name(enforceSecurity, "enforceSecurity");
async function editSecurity(env, body) {
  if (!body || typeof body !== "object" || typeof body.action !== "string")
    throw new SecurityError(400, "\u64CD\u4F5C\u53C2\u6570\u65E0\u6548");
  return change(env, (d, now) => {
    if (body.configRevision !== d.configRevision)
      throw new SecurityError(409, "\u914D\u7F6E\u5DF2\u88AB\u5176\u4ED6\u64CD\u4F5C\u66F4\u65B0\uFF0C\u8BF7\u5237\u65B0\u540E\u91CD\u8BD5");
    const bad = /* @__PURE__ */ __name(() => {
      throw new SecurityError(400, "\u89C4\u5219\u53C2\u6570\u65E0\u6548\u6216\u8BB0\u5F55\u5DF2\u5B58\u5728");
    }, "bad");
    const ip = canonicalIP(body.ip);
    switch (body.action) {
      case "rules":
        if (!rulesValid(body.rules))
          bad();
        d.rules = structuredClone(body.rules);
        d.counters = [];
        break;
      case "ban":
      case "allow": {
        if (!ip || !validScopes(body.scopes) || !note(body.note))
          bad();
        if (body.action === "allow") {
          if (d.allow.length >= 200 || d.allow.some((a) => a.ip === ip))
            bad();
          d.allow.push({ ip, scopes: body.scopes, note: body.note, created: now });
        } else {
          if (d.bans.length >= 1e3 || !integer(body.minutes, 0, MAX_MANUAL_BAN_MINUTES) || d.bans.some((b) => b.ip === ip))
            bad();
          d.bans.push({ ip, scopes: body.scopes, kind: "manual", reason: body.note, failures: 0, at: now, until: body.minutes ? now + body.minutes * 6e4 : null });
        }
        break;
      }
      case "unban":
        if (!Array.isArray(body.ips) || !body.ips.length || body.ips.length > 1e3 || body.ips.some((v) => !canonicalIP(v) && v !== "unknown"))
          bad();
        const ips = body.ips.map((ip2) => canonicalIP(ip2) || "unknown");
        d.bans = d.bans.filter((b) => !ips.includes(b.ip));
        d.counters = d.counters.filter((c) => !ips.includes(c.ip));
        break;
      case "removeAllow":
        if (!ip)
          bad();
        d.allow = d.allow.filter((a) => a.ip !== ip);
        break;
      case "region": {
        const r = body.rule;
        if (!r || typeof r.country !== "string" || !/^[A-Z]{2}$/.test(r.country) || typeof r.region !== "string" || !/^[A-Z0-9-]{0,10}$/.test(r.region) || !validScopes(r.scopes, true) || !note(r.reason) || typeof r.enabled !== "boolean" || !untilValid(r.until) || r.enabled && r.until !== null && r.until <= now)
          bad();
        const old = body.id ? d.regions.find((r2) => r2.id === body.id) : void 0;
        if (body.id && !old || !old && d.regions.length >= 200 || d.regions.some((v) => v !== old && v.country === r.country && v.region === r.region && v.scopes.some((s) => r.scopes.includes(s))))
          bad();
        const next = { id: old?.id || crypto.randomUUID(), at: old?.at || now, country: r.country, region: r.region, scopes: r.scopes, reason: r.reason, enabled: r.enabled, until: r.until };
        if (old)
          d.regions[d.regions.indexOf(old)] = next;
        else
          d.regions.push(next);
        break;
      }
      case "removeRegion":
        if (typeof body.id !== "string")
          bad();
        d.regions = d.regions.filter((r) => r.id !== body.id);
        break;
      default:
        bad();
    }
    d.configRevision = crypto.randomUUID();
  });
}
__name(editSecurity, "editSecurity");

// src/login-protection.ts
var LOGIN_GUARD_KEY = "__file-relay/login-guard-v1.json";
var LOGIN_RULES = { maxFailures: 5, windowSeconds: 600, banSeconds: 1800 };
var MAX_RECORDS = 1e3;
var LoginProtectionError = class extends Error {
  constructor(retryAt, newBan = false) {
    super("Login protection unavailable");
    this.retryAt = retryAt;
    this.newBan = newBan;
  }
  retryAt;
  newBan;
  static {
    __name(this, "LoginProtectionError");
  }
};
function loginProtectionResponse(c, error) {
  if (!(error instanceof LoginProtectionError)) return;
  c.header("Cache-Control", "no-store");
  if (error.retryAt) {
    c.header("Retry-After", String(Math.max(1, Math.ceil((error.retryAt - Date.now()) / 1e3))));
    return c.json({ error: "login_blocked", message: "\u767B\u5F55\u5931\u8D25\u6B21\u6570\u8FC7\u591A\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5", retryAt: error.retryAt }, 429);
  }
  return c.json({ error: "login_protection_unavailable", message: "\u767B\u5F55\u9632\u62A4\u6682\u4E0D\u53EF\u7528\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5" }, 503);
}
__name(loginProtectionResponse, "loginProtectionResponse");
function loginIP(c) {
  const raw2 = c.req.raw.cf ? c.req.header("CF-Connecting-IP") : void 0;
  if (!raw2 || !/^[0-9a-fA-F:.]{3,45}$/.test(raw2)) return "unknown";
  try {
    const host = new URL(raw2.includes(":") ? `http://[${raw2}]` : `http://${raw2}`).hostname;
    return host.replace(/^\[|\]$/g, "").toLowerCase();
  } catch {
    return "unknown";
  }
}
__name(loginIP, "loginIP");
function loginProtectionEnabled(env) {
  return !!(env.BUCKET || env.DB);
}
__name(loginProtectionEnabled, "loginProtectionEnabled");
function parse2(raw2, now, windowSeconds = LOGIN_RULES.windowSeconds) {
  if (raw2 === null) return { version: 1, revision: "", entries: [] };
  const data = JSON.parse(raw2);
  if (data?.version !== 1 || typeof data.revision !== "string" || !Array.isArray(data.entries) || data.entries.length > MAX_RECORDS || data.entries.some((e) => !e || typeof e.ip !== "string" || !/^(unknown|[0-9a-f:.]{3,45})$/.test(e.ip) || !Number.isInteger(e.failures) || e.failures < 1 || e.failures > 1e4 || !Array.isArray(e.failedAt) || e.failedAt.length !== e.failures || !e.failedAt.every((n, i) => Number.isSafeInteger(n) && n >= 0 && (i === 0 || n >= e.failedAt[i - 1])) || e.firstFailedAt !== e.failedAt[0] || e.lastFailedAt !== e.failedAt[e.failedAt.length - 1] || ![e.firstFailedAt, e.lastFailedAt, e.bannedUntil].every((n) => Number.isSafeInteger(n) && n >= 0)) || new Set(data.entries.map((e) => e.ip)).size !== data.entries.length) throw new Error("Invalid login protection state");
  data.entries = data.entries.filter((e) => {
    if (e.bannedUntil) return e.bannedUntil > now;
    e.failedAt = e.failedAt.filter((at) => at + windowSeconds * 1e3 > now);
    e.failures = e.failedAt.length;
    e.firstFailedAt = e.failedAt[0];
    return e.failures > 0;
  });
  return data;
}
__name(parse2, "parse");
async function read2(env, now, windowSeconds = LOGIN_RULES.windowSeconds) {
  if (env.BUCKET) {
    const object = await env.BUCKET.get(LOGIN_GUARD_KEY);
    return { data: parse2(object ? await object.text() : null, now, windowSeconds), previous: object?.etag ?? null };
  }
  await env.DB.prepare(CREATE_SETTINGS).run();
  const row = await env.DB.prepare("SELECT value FROM app_settings WHERE key=?").bind(LOGIN_GUARD_KEY).first();
  return { data: parse2(row?.value ?? null, now, windowSeconds), previous: row?.value ?? null };
}
__name(read2, "read");
async function write2(env, data, previous) {
  data.revision = crypto.randomUUID();
  const value = JSON.stringify(data);
  if (env.BUCKET) return !!await env.BUCKET.put(LOGIN_GUARD_KEY, value, {
    onlyIf: previous === null ? { etagDoesNotMatch: "*" } : { etagMatches: previous },
    httpMetadata: { contentType: "application/json" },
    storageClass: "Standard"
  });
  const result = previous === null ? await env.DB.prepare("INSERT INTO app_settings (key,value) VALUES (?,?) ON CONFLICT(key) DO NOTHING").bind(LOGIN_GUARD_KEY, value).run() : await env.DB.prepare("UPDATE app_settings SET value=? WHERE key=? AND value=?").bind(value, LOGIN_GUARD_KEY, previous).run();
  return result.meta.changes === 1;
}
__name(write2, "write");
async function change2(env, edit, windowSeconds) {
  try {
    const window = windowSeconds ?? (await securityState(env)).rules.login.window * 60;
    for (let attempt = 0; attempt < 5; attempt++) {
      if (attempt) await new Promise((resolve) => setTimeout(resolve, 1100 + Math.random() * 200));
      const now = Date.now();
      const { data, previous } = await read2(env, now, window);
      if (!edit(data, now)) return;
      try {
        if (await write2(env, data, previous)) return;
      } catch (error) {
        if (!/429|rate|too many/i.test(String(error))) throw error;
      }
    }
  } catch (error) {
    if (error instanceof LoginProtectionError) throw error;
    console.warn("Login protection storage unavailable");
  }
  throw new LoginProtectionError();
}
__name(change2, "change");
function rejectBanned(entry, now) {
  if (entry && entry.bannedUntil > now) throw new LoginProtectionError(entry.bannedUntil);
}
__name(rejectBanned, "rejectBanned");
async function checkLogin(env, ip) {
  if (!loginProtectionEnabled(env)) return;
  try {
    const config = await securityState(env);
    if (exempt(config, ip, "login")) return;
    const now = Date.now();
    rejectBanned((await read2(env, now, config.rules.login.window * 60)).data.entries.find((e) => e.ip === ip), now);
  } catch (error) {
    if (error instanceof LoginProtectionError) throw error;
    throw new LoginProtectionError();
  }
}
__name(checkLogin, "checkLogin");
async function recordLogin(env, ip, success) {
  if (!loginProtectionEnabled(env)) return;
  const config = await securityState(env), rule = config.rules.login;
  if (exempt(config, ip, "login") || !rule.enabled) return;
  let bannedUntil = 0;
  await change2(env, (data, now) => {
    const entry = data.entries.find((e) => e.ip === ip);
    rejectBanned(entry, now);
    if (success) {
      data.entries = data.entries.filter((e) => e.ip !== ip);
      return !!entry;
    }
    if (!entry && data.entries.length >= MAX_RECORDS) throw new LoginProtectionError();
    const next = entry ?? { ip, failures: 0, failedAt: [], firstFailedAt: now, lastFailedAt: now, bannedUntil: 0 };
    next.failures++;
    next.failedAt.push(now);
    next.lastFailedAt = now;
    if (next.failures >= rule.limit) next.bannedUntil = now + rule.duration * 6e4;
    bannedUntil = next.bannedUntil;
    if (!entry) data.entries.push(next);
    return true;
  }, rule.window * 60);
  if (bannedUntil) throw new LoginProtectionError(bannedUntil, true);
}
__name(recordLogin, "recordLogin");
async function loginProtectionStatus(env) {
  const enabled = loginProtectionEnabled(env);
  if (!enabled) return { enabled, ...LOGIN_RULES, bans: [] };
  try {
    const now = Date.now();
    const rule = (await securityState(env)).rules.login;
    const { data } = await read2(env, now, rule.window * 60);
    return { enabled, automaticEnabled: rule.enabled, maxFailures: rule.limit, windowSeconds: rule.window * 60, banSeconds: rule.duration * 60, bans: data.entries.filter((e) => e.bannedUntil > now).sort((a, b) => b.lastFailedAt - a.lastFailedAt).map(({ failedAt: _times, ...entry }) => entry) };
  } catch {
    throw new LoginProtectionError();
  }
}
__name(loginProtectionStatus, "loginProtectionStatus");
async function unblockLogins(env, ips) {
  if (!loginProtectionEnabled(env)) throw new LoginProtectionError();
  const selected = new Set(ips);
  await change2(env, (data) => {
    const count = data.entries.length;
    data.entries = data.entries.filter((e) => !selected.has(e.ip));
    return data.entries.length !== count;
  });
}
__name(unblockLogins, "unblockLogins");
async function unblockLogin(env, ip) {
  return unblockLogins(env, [ip]);
}
__name(unblockLogin, "unblockLogin");

// src/audit.ts
var AUDIT_KEY = "__file-relay/audit-v1.json";
var AUDIT_DAYS = 30;
var AUDIT_LIMIT = 1e3;
var AUDIT_GROUP_MS = 5 * 6e4;
var CATEGORIES = ["login", "operation", "security", "upload", "pickup"];
var states = /* @__PURE__ */ new WeakMap();
function auditState(c) {
  let state = states.get(c);
  if (!state) {
    state = { authenticated: false, actor: "anonymous", detail: {} };
    states.set(c, state);
  }
  return state;
}
__name(auditState, "auditState");
function auditEnabled(env) {
  return !!(env.BUCKET || env.DB);
}
__name(auditEnabled, "auditEnabled");
var text = /* @__PURE__ */ __name((value, max = 80) => typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, max) : "", "text");
function parse3(raw2, now) {
  if (raw2 === null) return { version: 1, revision: "", entries: [] };
  const data = JSON.parse(raw2);
  if (data?.version !== 1 || typeof data.revision !== "string" || !Array.isArray(data.entries) || data.entries.length > AUDIT_LIMIT || data.entries.some((e) => !e || typeof e.id !== "string" || !Number.isSafeInteger(e.at) || !CATEGORIES.includes(e.category) || !["success", "failed", "blocked"].includes(e.result) || !["admin", "token", "anonymous"].includes(e.actor) || !Number.isInteger(e.status) || !Number.isFinite(e.durationMs) || !["action", "ip", "country", "region", "city", "method", "target", "agent"].every((k) => typeof e[k] === "string") || !e.detail || typeof e.detail !== "object" || Array.isArray(e.detail))) throw new Error("Invalid audit state");
  data.entries = data.entries.filter((e) => e.at >= now - AUDIT_DAYS * 864e5);
  return data;
}
__name(parse3, "parse");
async function read3(env) {
  const now = Date.now();
  if (env.BUCKET) {
    const object = await env.BUCKET.get(AUDIT_KEY);
    return { data: parse3(object ? await object.text() : null, now), previous: object?.etag ?? null };
  }
  await env.DB.prepare(CREATE_SETTINGS).run();
  const row = await env.DB.prepare("SELECT value FROM app_settings WHERE key=?").bind(AUDIT_KEY).first();
  return { data: parse3(row?.value ?? null, now), previous: row?.value ?? null };
}
__name(read3, "read");
async function write3(env, data, previous) {
  data.revision = crypto.randomUUID();
  const value = JSON.stringify(data);
  if (env.BUCKET) return !!await env.BUCKET.put(AUDIT_KEY, value, {
    onlyIf: previous === null ? { etagDoesNotMatch: "*" } : { etagMatches: previous },
    httpMetadata: { contentType: "application/json" },
    storageClass: "Standard"
  });
  const result = previous === null ? await env.DB.prepare("INSERT INTO app_settings (key,value) VALUES (?,?) ON CONFLICT(key) DO NOTHING").bind(AUDIT_KEY, value).run() : await env.DB.prepare("UPDATE app_settings SET value=? WHERE key=? AND value=?").bind(value, AUDIT_KEY, previous).run();
  return result.meta.changes === 1;
}
__name(write3, "write");
async function appendAudit(env, event, aggregate = false) {
  if (!auditEnabled(env)) return false;
  try {
    for (let attempt = 0; attempt < 5; attempt++) {
      if (attempt) await new Promise((resolve) => setTimeout(resolve, 1100 + Math.random() * 200));
      const { data, previous } = await read3(env);
      if (data.entries.some((e) => e.id === event.id)) return true;
      const grouped = aggregate && data.entries.find((e) => Math.floor(e.at / AUDIT_GROUP_MS) === Math.floor(event.at / AUDIT_GROUP_MS) && e.category === event.category && e.action === event.action && e.result === event.result && e.ip === event.ip && e.method === event.method && (e.target === event.target || event.category === "pickup" && ["bad_request", "not_found"].includes(String(event.detail.reason))) && e.detail.reason === event.detail.reason && e.detail.stage === event.detail.stage && (e.detail.uploadRef === event.detail.uploadRef || event.detail.reason === "not_found") && typeof e.detail.count === "number");
      if (grouped) {
        grouped.detail = {
          ...grouped.detail,
          ...event.detail,
          count: Number(grouped.detail.count) + 1,
          firstAt: Math.min(Number(grouped.detail.firstAt), event.at),
          lastAt: Math.max(grouped.at, event.at)
        };
        grouped.at = Math.max(grouped.at, event.at);
        grouped.status = event.status;
        grouped.target = event.target;
      } else data.entries.push(aggregate ? { ...event, detail: { ...event.detail, count: 1, firstAt: event.at, lastAt: event.at } } : event);
      data.entries.sort((a, b) => b.at - a.at || b.id.localeCompare(a.id));
      data.entries = data.entries.slice(0, AUDIT_LIMIT);
      try {
        if (await write3(env, data, previous)) return true;
      } catch (error) {
        if (!/429|rate|too many/i.test(String(error))) throw error;
      }
    }
  } catch {
  }
  console.warn("Audit record could not be saved");
  return false;
}
__name(appendAudit, "appendAudit");
var routes = {
  "POST /api/admin/login": ["login", "login"],
  "POST /api/admin/security": ["security", "securityRules"],
  "POST /api/admin/logout": ["login", "logout"],
  "PUT /api/admin/settings": ["operation", "retention"],
  "PUT /api/admin/upload-policy": ["operation", "uploadPolicy"],
  "POST /api/admin/login-protection/unblock": ["security", "unblock"],
  "POST /api/admin/cleanup": ["operation", "cleanup"],
  "GET /api/admin/audit-logs/export": ["operation", "export"]
};
async function auditRequest(c, next) {
  const start = Date.now();
  await next();
  if (!auditEnabled(c.env)) return;
  const state = auditState(c);
  const path = c.req.path;
  let selected = routes[`${c.req.method} ${path}`];
  let target = state.target ?? "";
  const share = /^\/api\/admin\/shares\/(\d{6})(?:\/(source(?:\/activity)?|download|preview))?$/.exec(path);
  if (share) {
    target = share[1];
    if (c.req.method === "DELETE" && !share[2]) selected = ["operation", "delete"];
    if (c.req.method === "PUT" && !share[2]) selected = ["operation", "editShare"];
    if (c.req.method === "PUT" && share[2] === "source") selected = ["operation", "note"];
    if (c.req.method === "GET" && share[2]?.startsWith("source")) selected = ["operation", "viewSource"];
    if (c.req.method === "GET" && share[2] === "preview") selected = ["operation", "preview"];
    if (c.req.method === "GET" && share[2] === "download") selected = ["operation", "download"];
  }
  if (!selected) return;
  const isLogin = path === "/api/admin/login";
  const bearer = path === "/api/admin/cleanup" && c.req.header("Authorization")?.startsWith("Bearer ");
  if (!state.authenticated && !isLogin && !bearer) return;
  if (isLogin && c.res.status === 403) return;
  if (c.error instanceof SecurityError && [403, 429].includes(c.error.status)) return;
  const protectionError = c.error instanceof LoginProtectionError ? c.error : null;
  if (protectionError?.retryAt && !protectionError.newBan) return;
  let [category, action] = selected;
  if (protectionError?.newBan) {
    category = "security";
    action = "ban";
    state.detail.bannedUntil = protectionError.retryAt;
  }
  const cf = c.req.raw.cf;
  const event = {
    id: crypto.randomUUID(),
    at: start,
    category,
    action,
    result: c.res.status === 429 ? "blocked" : c.res.status < 400 ? "success" : "failed",
    actor: state.actor,
    ip: loginIP(c),
    country: text(cf?.country, 2),
    region: text(cf?.region),
    city: text(cf?.city),
    method: c.req.method,
    status: c.res.status,
    target: text(target),
    agent: text(c.req.header("User-Agent"), 200),
    durationMs: Math.max(0, Date.now() - start),
    detail: state.detail
  };
  if (!await appendAudit(c.env, event)) c.header("X-Audit-Status", "unavailable");
}
__name(auditRequest, "auditRequest");
async function queryAudit(env, query) {
  const category = query.category || "all";
  const result = query.result || "all";
  const from = query.from ? Number(query.from) : 0;
  const to = query.to ? Number(query.to) : Date.now();
  const offset = query.offset ? Number(query.offset) : 0;
  const limit = query.limit ? Number(query.limit) : 20;
  const q = (query.q || "").trim().toLowerCase();
  if (!(category === "all" || CATEGORIES.includes(category)) || !["all", "success", "failed", "blocked"].includes(result) || ![from, to, offset, limit].every(Number.isSafeInteger) || from < 0 || to < from || offset < 0 || limit < 1 || limit > AUDIT_LIMIT || q.length > 80) throw new RangeError("Invalid audit filters");
  const enabled = auditEnabled(env);
  const entries = enabled ? (await read3(env)).data.entries : [];
  entries.sort((a, b) => b.at - a.at || b.id.localeCompare(a.id));
  const matched = entries.filter((e) => (category === "all" || e.category === category) && (result === "all" || e.result === result) && e.at >= from && e.at <= to && (!q || `${e.ip} ${e.target} ${e.action} ${e.detail.filename ?? ""} ${e.detail.visitorId ?? ""}`.toLowerCase().includes(q)));
  return { enabled, retentionDays: AUDIT_DAYS, maxEntries: AUDIT_LIMIT, total: matched.length, offset, limit, rows: matched.slice(offset, offset + limit) };
}
__name(queryAudit, "queryAudit");

// src/api-auth.ts
var identities = /* @__PURE__ */ new WeakMap();
var apiIdentity = /* @__PURE__ */ __name((c) => identities.get(c), "apiIdentity");
var isApiPath = /* @__PURE__ */ __name((path) => path === "/api/v1" || path.startsWith("/api/v1/"), "isApiPath");
function transferPath(path, method) {
  if (method === "POST" && path === "/api/v1/shares") return "/api/shares/text";
  return path.startsWith("/api/v1/") ? "/api/" + path.slice("/api/v1/".length) : path;
}
__name(transferPath, "transferPath");
async function requireApiToken(c, next) {
  c.header("Cache-Control", "no-store");
  c.header("Vary", "Authorization");
  if (!c.env.API_TOKEN) {
    auditState(c).detail.reason = "api_disabled";
    return c.json({ error: "api_disabled", message: "\u672A\u914D\u7F6E API_TOKEN\uFF0C\u811A\u672C\u63A5\u53E3\u672A\u542F\u7528" }, 503);
  }
  const origin = c.req.header("Origin");
  if (origin && origin !== new URL(c.req.url).origin) return c.json({ error: "forbidden", message: "\u8BF7\u6C42\u6765\u6E90\u4E0D\u5339\u914D" }, 403);
  const ip = loginIP(c);
  await enforceSecurity(c.env, ip, "login");
  await checkLogin(c.env, ip);
  const match2 = /^Bearer ([^\s]+)$/i.exec(c.req.header("Authorization") || "");
  const valid = !!match2 && await safeEqual(match2[1], c.env.API_TOKEN);
  await recordLogin(c.env, ip, valid);
  if (!valid) {
    auditState(c).detail.reason = "unauthorized";
    c.header("WWW-Authenticate", 'Bearer realm="file-relay-api"');
    return c.json({ error: "unauthorized", message: "API Token \u65E0\u6548\u6216\u7F3A\u5931" }, 401);
  }
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`file-relay-api-visitor-v1:${c.env.API_TOKEN}`))).slice(0, 16);
  bytes[6] = bytes[6] & 15 | 64;
  bytes[8] = bytes[8] & 63 | 128;
  const hex2 = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  identities.set(c, `${hex2.slice(0, 8)}-${hex2.slice(8, 12)}-${hex2.slice(12, 16)}-${hex2.slice(16, 20)}-${hex2.slice(20)}`);
  auditState(c).authenticated = true;
  auditState(c).actor = "token";
  await next();
}
__name(requireApiToken, "requireApiToken");

// ../../node_modules/hono/dist/utils/cookie.js
var algorithm = { name: "HMAC", hash: "SHA-256" };
var getCryptoKey = /* @__PURE__ */ __name(async (secret) => {
  const secretBuf = typeof secret === "string" ? new TextEncoder().encode(secret) : secret;
  return await crypto.subtle.importKey("raw", secretBuf, algorithm, false, ["sign", "verify"]);
}, "getCryptoKey");
var makeSignature = /* @__PURE__ */ __name(async (value, secret) => {
  const key = await getCryptoKey(secret);
  const signature = await crypto.subtle.sign(algorithm.name, key, new TextEncoder().encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}, "makeSignature");
var verifySignature = /* @__PURE__ */ __name(async (base64Signature, value, secret) => {
  try {
    const signatureBinStr = atob(base64Signature);
    const signature = new Uint8Array(signatureBinStr.length);
    for (let i = 0, len = signatureBinStr.length; i < len; i++) {
      signature[i] = signatureBinStr.charCodeAt(i);
    }
    return await crypto.subtle.verify(algorithm, secret, signature, new TextEncoder().encode(value));
  } catch {
    return false;
  }
}, "verifySignature");
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
var parse4 = /* @__PURE__ */ __name((cookie, name) => {
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
var parseSigned = /* @__PURE__ */ __name(async (cookie, secret, name) => {
  const parsedCookie = /* @__PURE__ */ Object.create(null);
  const secretKey = await getCryptoKey(secret);
  for (const [key, value] of Object.entries(parse4(cookie, name))) {
    const signatureStartPos = value.lastIndexOf(".");
    if (signatureStartPos < 0) {
      continue;
    }
    const signedValue = value.substring(0, signatureStartPos);
    const signature = value.substring(signatureStartPos + 1);
    if (signature.length !== 44 || !signature.endsWith("=")) {
      continue;
    }
    const isVerified = await verifySignature(signature, signedValue, secretKey);
    parsedCookie[key] = isVerified ? signedValue : false;
  }
  return parsedCookie;
}, "parseSigned");
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
var serializeSigned = /* @__PURE__ */ __name(async (name, value, secret, opt = {}) => {
  const signature = await makeSignature(value, secret);
  value = `${value}.${signature}`;
  value = encodeURIComponent(value);
  return _serialize(name, value, opt);
}, "serializeSigned");

// ../../node_modules/hono/dist/helper/cookie/index.js
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
    const obj2 = parse4(cookie, finalKey);
    return obj2[finalKey];
  }
  if (!cookie) {
    return {};
  }
  const obj = parse4(cookie);
  return obj;
}, "getCookie");
var getSignedCookie = /* @__PURE__ */ __name(async (c, secret, key, prefix) => {
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
    const obj2 = await parseSigned(cookie, secret, finalKey);
    return obj2[finalKey];
  }
  if (!cookie) {
    return {};
  }
  const obj = await parseSigned(cookie, secret);
  return obj;
}, "getSignedCookie");
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
var generateSignedCookie = /* @__PURE__ */ __name(async (name, value, secret, opt) => {
  let cookie;
  if (opt?.prefix === "secure") {
    cookie = await serializeSigned("__Secure-" + name, value, secret, {
      path: "/",
      ...opt,
      secure: true
    });
  } else if (opt?.prefix === "host") {
    cookie = await serializeSigned("__Host-" + name, value, secret, {
      ...opt,
      path: "/",
      secure: true,
      domain: void 0
    });
  } else {
    cookie = await serializeSigned(name, value, secret, { path: "/", ...opt });
  }
  return cookie;
}, "generateSignedCookie");
var setSignedCookie = /* @__PURE__ */ __name(async (c, name, value, secret, opt) => {
  const cookie = await generateSignedCookie(name, value, secret, opt);
  c.header("set-cookie", cookie, { append: true });
}, "setSignedCookie");
var deleteCookie = /* @__PURE__ */ __name((c, name, opt) => {
  const deletedCookie = getCookie(c, name, opt?.prefix);
  setCookie(c, name, "", { ...opt, maxAge: 0 });
  return deletedCookie;
}, "deleteCookie");

// src/upload-source.ts
var COOKIE = "relay_visitor";
var MAX_AGE = 365 * 24 * 60 * 60;
var ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
var visitors = /* @__PURE__ */ new WeakMap();
async function ensureVisitor(c) {
  const api = apiIdentity(c);
  if (api) return api;
  const existing = visitors.get(c);
  if (existing) return existing;
  const id = await resolveVisitor(c);
  visitors.set(c, id);
  return id;
}
__name(ensureVisitor, "ensureVisitor");
async function resolveVisitor(c) {
  if (!c.env.ADMIN_TOKEN) return crypto.randomUUID();
  const secret = `upload-source:${c.env.ADMIN_TOKEN}`;
  const value = await getSignedCookie(c, secret, COOKIE);
  if (value) {
    const [id2, expires] = value.split(".");
    if (ID.test(id2) && Number(expires) > Date.now() && Number(expires) <= Date.now() + MAX_AGE * 1e3) return id2;
  }
  const id = crypto.randomUUID();
  await setSignedCookie(c, COOKIE, `${id}.${Date.now() + MAX_AGE * 1e3}`, secret, {
    httpOnly: true,
    secure: c.req.url.startsWith("https:"),
    sameSite: "Lax",
    path: "/",
    maxAge: MAX_AGE
  });
  return id;
}
__name(resolveVisitor, "resolveVisitor");
function location(value) {
  if (typeof value !== "string") return null;
  let result = "";
  for (const char of value.trim().replace(/[\u0000-\u001f\u007f]/g, "")) {
    if (new TextEncoder().encode(result + char).length > 48) break;
    result += char;
  }
  return result || null;
}
__name(location, "location");
async function captureSource(c) {
  const cf = c.req.raw.cf;
  const rawIP = cf ? c.req.header("CF-Connecting-IP") : void 0;
  const ip = rawIP && /^[0-9a-fA-F:.]{3,45}$/.test(rawIP) ? rawIP : null;
  return {
    visitorId: await ensureVisitor(c),
    ip,
    asn: typeof cf?.asn === "number" && Number.isSafeInteger(cf.asn) && cf.asn > 0 ? cf.asn : null,
    organization: boundedText(cf?.asOrganization, 120),
    userAgent: boundedText(c.req.header("User-Agent"), 256),
    country: typeof cf?.country === "string" && /^[A-Z]{2}$/.test(cf.country) ? cf.country : null,
    region: location(cf?.region),
    city: location(cf?.city),
    capturedAt: Date.now()
  };
}
__name(captureSource, "captureSource");
function boundedText(value, max) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max) || null : null;
}
__name(boundedText, "boundedText");
function parseSubmission(body) {
  const displayName = body.displayName ?? "";
  const description = body.description ?? "";
  if (typeof displayName !== "string" || displayName.length > 40 || /[\u0000-\u001f\u007f]/.test(displayName) || typeof description !== "string" || description.length > 300 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(description)) return null;
  return { displayName: displayName.trim(), description: description.trim() };
}
__name(parseSubmission, "parseSubmission");
function sourceSummary(source) {
  if (!source) return null;
  const { visitorId, country, region, city, capturedAt } = source;
  return { visitorId, country, region, city, capturedAt };
}
__name(sourceSummary, "sourceSummary");

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
var SHARE_COLUMNS = "id, code, kind, filename, size, mime, r2_key, text, max_pickups, pickup_count, created_at, expire_at, source_json";
var toRec = /* @__PURE__ */ __name((r) => ({
  source: r.source_json ? JSON.parse(r.source_json) : null,
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
  source: r.source_json ? JSON.parse(r.source_json) : null,
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
        (id, code, kind, filename, size, mime, r2_key, text, max_pickups, pickup_count, created_at, expire_at, source_json)
       VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,0,?10,?11,?12)`
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
    s.expireAt,
    s.source ? JSON.stringify(s.source) : null
  );
}
__name(insertShareStmt, "insertShareStmt");
function createD1Store(db) {
  return {
    async visitorShares(visitorId) {
      const rows = await db.prepare(`SELECT ${SHARE_COLUMNS} FROM shares
        WHERE json_extract(source_json, '$.visitorId') = ?1 ORDER BY created_at DESC, code ASC LIMIT 10`).bind(visitorId).all();
      return (rows.results ?? []).map(toRec);
    },
    async getVisitorNotes(ids) {
      const notes = /* @__PURE__ */ new Map();
      for (let i = 0; i < ids.length; i += 100) {
        const batch = ids.slice(i, i + 100);
        const rows = await db.prepare(`SELECT visitor_id, note FROM visitor_notes WHERE visitor_id IN (${batch.map(() => "?").join(",")})`).bind(...batch).all();
        for (const row of rows.results) notes.set(row.visitor_id, row.note);
      }
      return notes;
    },
    async getVisitorNote(id) {
      const row = await db.prepare("SELECT note FROM visitor_notes WHERE visitor_id = ?1").bind(id).first();
      return row?.note ?? "";
    },
    async setVisitorNote(id, note2) {
      if (!note2) {
        await db.prepare("DELETE FROM visitor_notes WHERE visitor_id = ?1").bind(id).run();
        return;
      }
      await db.prepare("INSERT INTO visitor_notes (visitor_id, note) VALUES (?1, ?2) ON CONFLICT(visitor_id) DO UPDATE SET note = excluded.note").bind(id, note2).run();
    },
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
    async updateRules(code, expected, rules, cleanupCutoff) {
      const row = await db.prepare(`UPDATE shares SET pickup_count=?1, max_pickups=?2, expire_at=?3
        WHERE code=?4 AND id=?5 AND pickup_count=?6 AND max_pickups IS ?7 AND expire_at IS ?8
          AND (expire_at IS NULL OR expire_at>?9)
        RETURNING ${SHARE_COLUMNS}`).bind(
        rules.pickupCount,
        rules.maxPickups,
        rules.expireAt,
        code,
        expected.id,
        expected.pickupCount,
        expected.maxPickups,
        expected.expireAt,
        cleanupCutoff
      ).first();
      return row ? toRec(row) : null;
    },
    async updateShare(code, expected, update, cleanupCutoff) {
      const row = await db.prepare(`UPDATE shares SET filename=?1, text=?2, size=?3, pickup_count=?4, max_pickups=?5, expire_at=?6
        WHERE code=?7 AND id=?8 AND pickup_count=?9 AND max_pickups IS ?10 AND expire_at IS ?11
          AND filename IS ?12 AND text IS ?13 AND size=?14 AND (expire_at IS NULL OR expire_at>?15)
        RETURNING ${SHARE_COLUMNS}`).bind(
        update.filename,
        update.text,
        update.size,
        update.pickupCount,
        update.maxPickups,
        update.expireAt,
        code,
        expected.id,
        expected.pickupCount,
        expected.maxPickups,
        expected.expireAt,
        expected.filename,
        expected.text,
        expected.size,
        cleanupCutoff
      ).first();
      return row ? toRec(row) : null;
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
    async listShares(limit, offset, filter = {}) {
      const clauses = [], values = [];
      if (filter.kind) {
        clauses.push("kind = ?");
        values.push(filter.kind);
      }
      if (filter.status) {
        clauses.push(`(CASE WHEN expire_at IS NOT NULL AND expire_at <= ? THEN 'expired'
          WHEN max_pickups IS NOT NULL AND pickup_count >= max_pickups THEN 'exhausted' ELSE 'active' END) = ?`);
        values.push(Date.now(), filter.status);
      }
      const q = filter.q?.trim().toLowerCase();
      if (q) {
        clauses.push(`(instr(lower(code), ?) > 0 OR instr(lower(substr(COALESCE(filename, ''), 1, 40)), ?) > 0
          OR instr(lower(COALESCE(json_extract(source_json, '$.visitorId'), '')), ?) > 0)`);
        values.push(q, q, q);
      }
      const where = clauses.length ? " WHERE " + clauses.join(" AND ") : "";
      const total = (await db.prepare("SELECT COUNT(*) AS n FROM shares" + where).bind(...values).first())?.n ?? 0;
      const rows = await db.prepare(
        `SELECT id, code, kind, filename, size, pickup_count, max_pickups, expire_at, created_at, source_json,
                  CASE WHEN kind = 'text' THEN substr(text, 1, 50) ELSE NULL END AS text_preview
           FROM shares${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
      ).bind(...values, limit, offset).all();
      return {
        total,
        rows: (rows.results ?? []).map((r) => ({
          source: sourceSummary(r.source_json ? JSON.parse(r.source_json) : null),
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
        `INSERT INTO upload_sessions (id, upload_id, r2_key, filename, mime, size, parts, expiry, max_pickups, created_at, source_json)
           VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)`
      ).bind(s.id, s.uploadId, s.r2Key, s.filename, s.mime, s.size, s.parts, s.expiry, s.maxPickups, s.createdAt, s.source ? JSON.stringify(s.source) : null).run();
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
    o: v.source ? b64encode(JSON.stringify(sourceSummary(v.source))) : void 0,
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
    async visitorShares(visitorId) {
      const matches = (await scanShareMeta(kv)).filter(({ m }) => m.o && JSON.parse(b64decode(m.o)).visitorId === visitorId).sort((a, b) => b.m.t - a.m.t || a.code.localeCompare(b.code)).slice(0, 10);
      const records = await Promise.all(matches.map(({ code }) => kv.get(SHARE_PREFIX + code, "json")));
      return records.filter((record) => !!record && record.source?.visitorId === visitorId);
    },
    async getVisitorNotes(ids) {
      const notes = /* @__PURE__ */ new Map();
      for (let i = 0; i < ids.length; i += 100) {
        const batch = ids.slice(i, i + 100);
        const values = await kv.get(batch.map((id) => "v:" + id), "text");
        for (const id of batch) notes.set(id, values.get("v:" + id) ?? "");
      }
      return notes;
    },
    async getVisitorNote(id) {
      return await kv.get("v:" + id) ?? "";
    },
    async setVisitorNote(id, note2) {
      if (note2) await kv.put("v:" + id, note2);
      else await kv.delete("v:" + id);
    },
    async createShare(s, closeSessionId) {
      for (let i = 0; i < MAX_CODE_RETRIES2; i++) {
        const code = randCode();
        if (await kv.get(SHARE_PREFIX + code) !== null) continue;
        const rec = {
          source: s.source ?? null,
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
    async updateRules(code, expected, rules, cleanupCutoff) {
      const record = await kv.get(SHARE_PREFIX + code, "json");
      if (!record || !sameShareRules(record, expected) || record.expireAt !== null && record.expireAt <= cleanupCutoff) return null;
      const updated = { ...record, ...rules };
      await kv.put(SHARE_PREFIX + code, JSON.stringify(updated), { metadata: metaOf(updated) });
      return updated;
    },
    async updateShare(code, expected, update, cleanupCutoff) {
      const record = await kv.get(SHARE_PREFIX + code, "json");
      if (!record || !sameShareContent(record, expected) || record.expireAt !== null && record.expireAt <= cleanupCutoff) return null;
      const updated = { ...record, ...update };
      await kv.put(SHARE_PREFIX + code, JSON.stringify(updated), { metadata: metaOf(updated) });
      return updated;
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
    async listShares(limit, offset, filter = {}) {
      const scanned = await scanShareMeta(kv);
      const now = Date.now(), q = filter.q?.trim().toLowerCase();
      const all = scanned.filter(({ code, m }) => {
        if (filter.kind && m.k !== filter.kind) return false;
        if (filter.status && shareStatusOf(m.e, m.m, m.c, now) !== filter.status) return false;
        if (!q) return true;
        const source = m.o ? sourceSummary(JSON.parse(b64decode(m.o))) : null;
        return [code, m.n ? b64decode(m.n) : "", source?.visitorId ?? ""].some((value) => value.toLowerCase().includes(q));
      }).sort((a, b) => b.m.t - a.m.t);
      const page = all.slice(offset, offset + limit);
      let kept = page;
      const budget = 48 - Math.ceil(scanned.length / 1e3);
      if (page.length > 0 && page.length <= budget) {
        const alive = await Promise.all(
          page.map((x) => kv.get(SHARE_PREFIX + x.code).then((v) => v !== null))
        );
        kept = page.filter((_, i) => alive[i]);
      }
      const rows = kept.map(({ code, m }) => ({
        source: m.o ? sourceSummary(JSON.parse(b64decode(m.o))) : null,
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
function sameShareRules(record, expected) {
  return record.id === expected.id && record.pickupCount === expected.pickupCount && record.maxPickups === expected.maxPickups && record.expireAt === expected.expireAt;
}
__name(sameShareRules, "sameShareRules");
function sameShareContent(record, expected) {
  return sameShareRules(record, expected) && record.filename === expected.filename && record.text === expected.text && record.size === expected.size;
}
__name(sameShareContent, "sameShareContent");
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

// src/share-edit.ts
async function shareVersion(record) {
  const bytes = new TextEncoder().encode(JSON.stringify([
    record.id,
    record.kind,
    record.filename,
    record.text,
    record.size,
    record.pickupCount,
    record.maxPickups,
    record.expireAt
  ]));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return '"' + Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("") + '"';
}
__name(shareVersion, "shareVersion");
var MAX_PICKUP_COUNT = 2147483647;
var MAX_EXPIRY_TIME = 253402300799999;
function validShareRules(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value;
  return Number.isSafeInteger(v.pickupCount) && v.pickupCount >= 0 && v.pickupCount <= MAX_PICKUP_COUNT && (v.maxPickups === null || Number.isSafeInteger(v.maxPickups) && v.maxPickups >= 1 && v.maxPickups <= MAX_PICKUP_COUNT) && (v.expireAt === null || Number.isSafeInteger(v.expireAt) && v.expireAt >= 0 && v.expireAt <= MAX_EXPIRY_TIME);
}
__name(validShareRules, "validShareRules");
function validShareBase(value) {
  return validShareRules(value) && typeof value.id === "string" && value.id.length > 0 && value.id.length <= 64;
}
__name(validShareBase, "validShareBase");

// src/limits.ts
var KV_VALUE_MAX = 25 * 1024 ** 2;
var DEFAULT_MAX_FILE_SIZE = 99e8;
var WORKER_REQUEST_MAX = 1e8;
var R2_PART_MIN = 5 * 1024 ** 2;
var R2_PARTS_MAX = 1e4;
var R2_OBJECT_MAX = 5 * 1024 ** 4 - 5 * 1024 ** 3;
function uploadPartSize(env) {
  return Math.max(R2_PART_MIN, Math.min(WORKER_REQUEST_MAX, Math.floor(num(env.PART_SIZE, WORKER_REQUEST_MAX))));
}
__name(uploadPartSize, "uploadPartSize");
function uploadMaxParts(env) {
  return Math.max(1, Math.min(R2_PARTS_MAX, Math.floor(num(env.MAX_PARTS, R2_PARTS_MAX))));
}
__name(uploadMaxParts, "uploadMaxParts");
function r2FileMax(env) {
  return Math.min(R2_OBJECT_MAX, uploadPartSize(env) * uploadMaxParts(env));
}
__name(r2FileMax, "r2FileMax");

// src/quota.ts
var R2_CAPACITY_MAX = 999e7;
var QUOTA_KEY = "__file-relay/quota-v1.json";
var CapacityError = class extends Error {
  constructor(remainingBytes) {
    super("\u5BB9\u91CF\u8D85\u51FA\u514D\u8D39\u989D\u5EA6");
    this.remainingBytes = remainingBytes;
  }
  remainingBytes;
  static {
    __name(this, "CapacityError");
  }
};
async function readLedger(bucket) {
  const object = await bucket.get(QUOTA_KEY);
  const ledger = object ? await object.json() : { version: 1, revision: "", files: {} };
  if (ledger.version !== 1 || !ledger.files || typeof ledger.files !== "object" || Object.values(ledger.files).some((n) => !Number.isSafeInteger(n) || n < 1)) {
    throw new Error("R2 capacity ledger is invalid");
  }
  return { object, ledger };
}
__name(readLedger, "readLedger");
async function writeLedger(bucket, ledger, etag) {
  ledger.revision = crypto.randomUUID();
  return bucket.put(QUOTA_KEY, JSON.stringify(ledger), {
    onlyIf: etag ? { etagMatches: etag } : { etagDoesNotMatch: "*" },
    httpMetadata: { contentType: "application/json" },
    storageClass: "Standard"
  });
}
__name(writeLedger, "writeLedger");
async function retryDelay(attempt) {
  if (attempt) await new Promise((resolve) => setTimeout(resolve, 1100 + Math.random() * 200));
}
__name(retryDelay, "retryDelay");
async function scanCapacity(env, ledger, hasLedger) {
  const bucket = env.BUCKET;
  if (!hasLedger) {
    for (const session of await getStore(env).listStaleSessions(Date.now() + 1, 0)) {
      ledger.files[session.r2Key] = session.size;
    }
  }
  const sizes = new Map(Object.entries(ledger.files));
  let cursor;
  let overhead = 0;
  let pages = 0;
  do {
    if (++pages > 500) throw new Error("R2 capacity scan exceeds request budget");
    const page = await bucket.list({ cursor, limit: 1e3 });
    for (const file of page.objects) {
      if (file.key === QUOTA_KEY) {
        overhead = file.size;
        continue;
      }
      sizes.set(file.key, Math.max(file.size, sizes.get(file.key) ?? 0));
    }
    cursor = page.truncated ? page.cursor : void 0;
    if (page.truncated && !cursor) throw new Error("Invalid R2 pagination");
  } while (cursor);
  const used = [...sizes.values()].reduce((sum, n) => sum + n, 0);
  return { sizes, used, overhead };
}
__name(scanCapacity, "scanCapacity");
async function getCapacityUsage(env) {
  const { object, ledger } = await readLedger(env.BUCKET);
  const { used, overhead } = await scanCapacity(env, ledger, !!object);
  return { usedBytes: used + overhead, capacityBytes: R2_CAPACITY_MAX };
}
__name(getCapacityUsage, "getCapacityUsage");
async function reserveCapacity(env, key, size) {
  const bucket = env.BUCKET;
  for (let attempt = 0; attempt < 5; attempt++) {
    await retryDelay(attempt);
    const { object, ledger } = await readLedger(bucket);
    if (ledger.files[key] === size) return;
    if (ledger.files[key] !== void 0) throw new Error("R2 reservation size mismatch");
    const { sizes, used, overhead } = await scanCapacity(env, ledger, !!object);
    ledger.files[key] = size;
    const nextOverhead = new TextEncoder().encode(JSON.stringify({ ...ledger, revision: "0".repeat(36) })).byteLength;
    const addition = sizes.has(key) ? 0 : size;
    if (used + overhead >= R2_CAPACITY_MAX || used + addition + Math.max(overhead, nextOverhead) > R2_CAPACITY_MAX) {
      throw new CapacityError(Math.max(0, R2_CAPACITY_MAX - used - Math.max(overhead, nextOverhead)));
    }
    try {
      if (await writeLedger(bucket, ledger, object?.etag)) {
        return { remainingBytes: Math.max(0, R2_CAPACITY_MAX - used - addition - Math.max(overhead, nextOverhead)), capacityBytes: R2_CAPACITY_MAX };
      }
    } catch (e) {
      if (!/429|rate|too many/i.test(String(e))) throw e;
    }
  }
  throw new Error("R2 capacity accounting busy; retry upload");
}
__name(reserveCapacity, "reserveCapacity");
async function releaseCapacity(env, keys) {
  if (!env.BUCKET || keys.length === 0) return;
  for (let attempt = 0; attempt < 5; attempt++) {
    await retryDelay(attempt);
    const { object, ledger } = await readLedger(env.BUCKET);
    if (!object || !keys.some((key) => ledger.files[key] !== void 0)) return;
    for (const key of keys) delete ledger.files[key];
    try {
      if (await writeLedger(env.BUCKET, ledger, object.etag)) return;
    } catch (e) {
      if (!/429|rate|too many/i.test(String(e))) throw e;
    }
  }
  throw new Error("R2 capacity release busy; retry cleanup");
}
__name(releaseCapacity, "releaseCapacity");

// src/filestore.ts
var KV_FILE_PREFIX = "f:";
var KV_FILE_MAX = KV_VALUE_MAX;
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
  const mode = fileMode(env);
  if (!mode) return 0;
  const platformMax = mode === "kv" ? KV_FILE_MAX : r2FileMax(env);
  return Math.max(1, Math.min(Math.floor(num(env.MAX_FILE_SIZE, DEFAULT_MAX_FILE_SIZE)), platformMax));
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
async function readFilePrefix(env, key, limit) {
  let stream = null;
  if (isKvFileKey(key)) {
    if (!env.fileKV) return null;
    stream = await env.fileKV.get(key, "stream");
  } else {
    if (!env.BUCKET) return null;
    const head = await env.BUCKET.head(key);
    if (!head) return null;
    if (!head.size) return new Uint8Array();
    const object = await env.BUCKET.get(key, { range: { offset: 0, length: Math.min(head.size, limit) } });
    stream = object?.body ?? null;
  }
  if (!stream) return null;
  const reader = stream.getReader();
  const out = new Uint8Array(limit);
  let length = 0;
  try {
    while (length < limit) {
      const { value, done } = await reader.read();
      if (done) break;
      const count = Math.min(value.length, limit - length);
      out.set(value.subarray(0, count), length);
      length += count;
    }
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
  return out.slice(0, length);
}
__name(readFilePrefix, "readFilePrefix");
async function inspectFile(env, key) {
  const unknown = { state: "unknown", size: null, uploadedAt: null };
  const missing = { state: "missing", size: null, uploadedAt: null };
  if (!key) return missing;
  try {
    if (isKvFileKey(key)) {
      if (!env.fileKV) return unknown;
      const stream = await env.fileKV.get(key, "stream");
      if (!stream) return missing;
      await stream.cancel();
      return { state: "available", size: null, uploadedAt: null };
    }
    if (!env.BUCKET) return unknown;
    const object = await env.BUCKET.head(key);
    return object ? { state: "available", size: object.size, uploadedAt: object.uploaded.getTime() } : missing;
  } catch {
    console.warn("File metadata check unavailable");
    return unknown;
  }
}
__name(inspectFile, "inspectFile");
async function deleteFile(env, key) {
  if (!key) return;
  if (isKvFileKey(key)) {
    if (env.fileKV) await env.fileKV.delete(key);
    return;
  }
  if (env.BUCKET) {
    await env.BUCKET.delete(key);
    await releaseCapacity(env, [key]);
  }
}
__name(deleteFile, "deleteFile");

// src/public-audit.ts
var bounded = /* @__PURE__ */ __name((value, max = 80) => typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, max) : "", "bounded");
function transferAudit(c, record) {
  const detail = auditState(c).detail;
  if (record.filename) detail.filename = bounded(record.filename, 160);
  detail[record.kind === "text" ? "textLength" : "sizeBytes"] = record.size;
  if (record.kind) detail.kind = record.kind;
  if (record.source) detail.visitorId = record.source.visitorId;
}
__name(transferAudit, "transferAudit");
function uploadSessionAudit(c, session) {
  transferAudit(c, { ...session, kind: "file" });
}
__name(uploadSessionAudit, "uploadSessionAudit");
function publicRejection(c, error) {
  const detail = auditState(c).detail;
  detail.securityReason = error.reason;
  detail.newBan = error.newBan;
  if (error.retryAt) detail.bannedUntil = error.retryAt;
}
__name(publicRejection, "publicRejection");
function select(path, method) {
  if (method === "POST" && ["/api/shares/file", "/api/shares/text"].includes(path))
    return { category: "upload", stage: path.endsWith("/text") ? "text" : "direct", action: "upload" };
  if (method === "POST" && path === "/api/uploads/init")
    return { category: "upload", stage: "init", action: "upload" };
  const session = /^\/api\/uploads\/([^/]+)\/(complete|abort|parts\/[^/]+)$/.exec(path);
  if (session && (method === "POST" && ["complete", "abort"].includes(session[2]) || method === "PUT" && session[2].startsWith("parts/")))
    return {
      category: "upload",
      stage: session[2].startsWith("parts/") ? "part" : session[2],
      action: session[2] === "abort" ? "uploadCancel" : "upload",
      session: session[1]
    };
  if (method === "POST" && path === "/api/pickup")
    return { category: "pickup", stage: "lookup", action: "pickup" };
  if (["GET", "HEAD"].includes(method) && /^\/api\/pickup\/[^/]+\/download$/.test(path))
    return { category: "pickup", stage: "download", action: method === "HEAD" ? "downloadProbe" : "publicDownload" };
}
__name(select, "select");
async function publicAudit(c, next) {
  const selected = select(transferPath(c.req.path, c.req.method), c.req.method), start = Date.now();
  await next();
  if (!selected || !auditEnabled(c.env) || isApiPath(c.req.path) && !apiIdentity(c)) return;
  try {
    await recordPublicAudit(c, selected, start);
  } catch {
    console.warn("Public audit record could not be prepared");
    c.header("X-Audit-Status", "unavailable");
  }
}
__name(publicAudit, "publicAudit");
async function recordPublicAudit(c, selected, start) {
  const status = c.res.status;
  const state = auditState(c);
  if (status < 400 && (["init", "part"].includes(selected.stage) || selected.stage === "abort" && !state.detail.cancelled)) return;
  if (c.error instanceof SecurityError) publicRejection(c, c.error);
  const detail = { ...state.detail };
  const securityReason = state.detail.securityReason;
  const newBan = state.detail.newBan;
  delete detail.securityReason;
  delete detail.newBan;
  delete detail.cancelled;
  let reason = typeof detail.reason === "string" ? detail.reason : "";
  if (status >= 400 && c.req.method !== "HEAD" && c.res.headers.get("Content-Type")?.includes("application/json")) {
    const error = await c.res.clone().json();
    reason ||= bounded(error.error, 64);
  }
  let category = selected.category, action = selected.action;
  const blocked = status === 403 || status === 429;
  let target = bounded(state.target);
  if (typeof securityReason === "string") {
    category = "security";
    action = newBan ? "ban" : "accessBlocked";
    target = selected.category;
    for (const key of Object.keys(detail)) if (key !== "bannedUntil") delete detail[key];
    detail.scope = selected.category;
    reason = securityReason;
    if (typeof state.detail.bannedUntil === "number") detail.bannedUntil = state.detail.bannedUntil;
  } else {
    detail.stage = selected.stage;
    detail.visitorId = await ensureVisitor(c);
    if ("session" in selected && selected.session) {
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(selected.session));
      detail.uploadRef = Array.from(new Uint8Array(digest).slice(0, 8), (b) => b.toString(16).padStart(2, "0")).join("");
    }
  }
  if (reason) detail.reason = reason;
  const cf = c.req.raw.cf;
  const event = {
    id: crypto.randomUUID(),
    at: start,
    category,
    action,
    result: blocked ? "blocked" : status < 400 ? "success" : "failed",
    actor: apiIdentity(c) ? "token" : "anonymous",
    ip: loginIP(c),
    country: bounded(cf?.country, 2),
    region: bounded(cf?.region),
    city: bounded(cf?.city),
    method: c.req.method,
    status,
    target,
    agent: bounded(c.req.header("User-Agent"), 200),
    durationMs: Math.max(0, Date.now() - start),
    detail
  };
  if (!await appendAudit(c.env, event, status >= 400 && !newBan)) c.header("X-Audit-Status", "unavailable");
}
__name(recordPublicAudit, "recordPublicAudit");

// src/upload-policy.ts
var SETTINGS_KEY = "sys:guest-upload-policy";
var USAGE_KEY = "__file-relay/guest-uploads-v1.json";
var WEEK = 7 * 864e5;
var SHANGHAI_OFFSET = 8 * 36e5;
var MAX_SUBJECTS = 1e4;
var DEFAULT_GUEST_LIMITS = { weeklyFileLimit: 5 };
function validGuestLimits(value) {
  const v = value;
  return !!v && Number.isInteger(v.weeklyFileLimit) && v.weeklyFileLimit >= 0 && v.weeklyFileLimit <= 1e3;
}
__name(validGuestLimits, "validGuestLimits");
async function getGuestLimits(env) {
  const raw2 = await readSetting(env, SETTINGS_KEY);
  if (raw2 === null) return { ...DEFAULT_GUEST_LIMITS };
  const limits = JSON.parse(raw2);
  if (!validGuestLimits(limits)) throw new Error("Invalid guest upload policy");
  return { weeklyFileLimit: limits.weeklyFileLimit };
}
__name(getGuestLimits, "getGuestLimits");
async function setGuestLimits(env, limits) {
  if (!validGuestLimits(limits)) throw new Error("Invalid guest upload policy");
  await writeSetting(env, SETTINGS_KEY, JSON.stringify({ weeklyFileLimit: limits.weeklyFileLimit }));
}
__name(setGuestLimits, "setGuestLimits");
var UploadPolicyError = class extends Error {
  constructor(status, code, message, resetsAt) {
    super(message);
    this.status = status;
    this.code = code;
    this.resetsAt = resetsAt;
  }
  status;
  code;
  resetsAt;
  static {
    __name(this, "UploadPolicyError");
  }
};
function policyErrorResponse(c, error) {
  if (!(error instanceof UploadPolicyError)) return;
  if (error.resetsAt) c.header("Retry-After", String(Math.max(1, Math.ceil((error.resetsAt - Date.now()) / 1e3))));
  return c.json({ error: error.code, message: error.message, resetsAt: error.resetsAt }, error.status);
}
__name(policyErrorResponse, "policyErrorResponse");
function uploadWeek(now) {
  return Math.floor((now + SHANGHAI_OFFSET + 3 * 864e5) / WEEK) * WEEK - 3 * 864e5 - SHANGHAI_OFFSET;
}
__name(uploadWeek, "uploadWeek");
function parseLedger(raw2, week) {
  if (raw2 === null) return { version: 1, week, revision: "", counts: {} };
  const data = JSON.parse(raw2);
  if (data.version !== 1 || !Number.isSafeInteger(data.week) || typeof data.revision !== "string" || !data.counts || typeof data.counts !== "object" || Array.isArray(data.counts) || Object.entries(data.counts).some(([key, n]) => !/^[a-f0-9]{64}$/.test(key) || !Number.isSafeInteger(n) || n < 0)) {
    throw new Error("Invalid guest upload ledger");
  }
  if (data.week > week) throw new Error("Guest upload ledger is ahead of server clock");
  return data.week === week ? data : { version: 1, week, revision: "", counts: {} };
}
__name(parseLedger, "parseLedger");
async function readLedger2(env, week) {
  if (env.BUCKET) {
    const object = await env.BUCKET.get(USAGE_KEY);
    return { ledger: parseLedger(object ? await object.text() : null, week), previous: object?.etag ?? null };
  }
  if (env.DB) {
    await env.DB.prepare(CREATE_SETTINGS).run();
    const row = await env.DB.prepare("SELECT value FROM app_settings WHERE key=?").bind(USAGE_KEY).first();
    return { ledger: parseLedger(row?.value ?? null, week), previous: row?.value ?? null };
  }
  throw new UploadPolicyError(503, "upload_policy_unavailable", "\u6682\u4E0D\u63A5\u53D7\u672A\u5907\u6CE8\u8BBF\u5BA2\u4E0A\u4F20\uFF0C\u8BF7\u8054\u7CFB\u7BA1\u7406\u5458");
}
__name(readLedger2, "readLedger");
async function writeLedger2(env, ledger, previous) {
  ledger.revision = crypto.randomUUID();
  const value = JSON.stringify(ledger);
  if (env.BUCKET) return !!await env.BUCKET.put(USAGE_KEY, value, {
    onlyIf: previous === null ? { etagDoesNotMatch: "*" } : { etagMatches: previous },
    httpMetadata: { contentType: "application/json" },
    storageClass: "Standard"
  });
  const result = previous === null ? await env.DB.prepare("INSERT INTO app_settings (key,value) VALUES (?,?) ON CONFLICT(key) DO NOTHING").bind(USAGE_KEY, value).run() : await env.DB.prepare("UPDATE app_settings SET value=? WHERE key=? AND value=?").bind(value, USAGE_KEY, previous).run();
  return result.meta.changes === 1;
}
__name(writeLedger2, "writeLedger");
async function subjects(env, source, week) {
  if (!env.ADMIN_TOKEN) throw new UploadPolicyError(503, "upload_policy_unavailable", "\u4E0A\u4F20\u670D\u52A1\u672A\u914D\u7F6E\u5B8C\u6210");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.ADMIN_TOKEN), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  let ip = source.ip?.toLowerCase() ?? "unknown";
  if (ip.includes(":")) {
    try {
      ip = new URL(`http://[${ip}]`).hostname;
    } catch {
      ip = "unknown";
    }
  }
  return Promise.all([`visitor:${source.visitorId}`, `network:${ip}`].map(async (subject) => {
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`upload-week:${week}:${subject}`));
    return [...new Uint8Array(sig)].map((n) => n.toString(16).padStart(2, "0")).join("");
  }));
}
__name(subjects, "subjects");
async function weeklyUsage(env, source, limit, debit) {
  for (let attempt = 0; attempt < 5; attempt++) {
    if (attempt) await new Promise((resolve) => setTimeout(resolve, 1100 + Math.random() * 200));
    const week = uploadWeek(Date.now());
    const keys = await subjects(env, source, week);
    const { ledger, previous } = await readLedger2(env, week);
    const used = Math.max(...keys.map((key) => ledger.counts[key] ?? 0));
    const resetsAt = week + WEEK;
    if (!debit) return { remaining: Math.max(0, limit - used), resetsAt };
    if (used >= limit) throw new UploadPolicyError(429, "weekly_upload_limit", "\u672C\u5468\u4E0A\u4F20\u989D\u5EA6\u5DF2\u7528\u5B8C\uFF0C\u8BF7\u4E0B\u5468\u518D\u8BD5\u6216\u8054\u7CFB\u7BA1\u7406\u5458", resetsAt);
    if (Object.keys(ledger.counts).length + keys.filter((key) => ledger.counts[key] === void 0).length > MAX_SUBJECTS) {
      throw new UploadPolicyError(503, "upload_policy_unavailable", "\u4E0A\u4F20\u670D\u52A1\u7E41\u5FD9\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5");
    }
    for (const key of keys) ledger.counts[key] = (ledger.counts[key] ?? 0) + 1;
    try {
      if (await writeLedger2(env, ledger, previous)) return { remaining: limit - used - 1, resetsAt };
    } catch (error) {
      if (!/429|rate|too many/i.test(String(error))) throw error;
    }
  }
  throw new UploadPolicyError(503, "upload_policy_busy", "\u4E0A\u4F20\u670D\u52A1\u7E41\u5FD9\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5");
}
__name(weeklyUsage, "weeklyUsage");
async function uploadAccess(c) {
  const source = await captureSource(c);
  const noted = !!apiIdentity(c) || !!(await getStore(c.env).getVisitorNote(source.visitorId)).trim();
  const limits = await getGuestLimits(c.env);
  return { source, noted, limits, maxFileSize: fileMaxSize(c.env) };
}
__name(uploadAccess, "uploadAccess");
function checkUploadOptions(access, size, expiry, pickups) {
  if (size !== null && size > access.maxFileSize) throw new UploadPolicyError(413, "too_large", `\u5355\u6587\u4EF6\u4E0D\u80FD\u8D85\u8FC7 ${access.maxFileSize} \u5B57\u8282`);
  if (!access.noted && (expiry === null || pickups === null)) {
    throw new UploadPolicyError(403, "restricted_share_options", "\u5F53\u524D\u4EC5\u652F\u6301\u9650\u65F6\u3001\u9650\u6B21\u5206\u4EAB\uFF0C\u8BF7\u9009\u62E9\u6709\u6548\u671F\u548C\u53D6\u4EF6\u6B21\u6570");
  }
}
__name(checkUploadOptions, "checkUploadOptions");
async function admitFile(env, access) {
  if (!access.noted) await weeklyUsage(env, access.source, access.limits.weeklyFileLimit, true);
}
__name(admitFile, "admitFile");
async function publicUploadPolicy(c) {
  const access = await uploadAccess(c);
  const base = { maxFileSize: access.maxFileSize, allowPermanent: access.noted, allowUnlimited: access.noted };
  if (access.noted) return { ...base, weeklyFileLimit: null, uploadsRemaining: null, uploadsResetAt: null, fileUploadAvailable: access.maxFileSize > 0 };
  if (!c.env.BUCKET && !c.env.DB) return {
    ...base,
    weeklyFileLimit: access.limits.weeklyFileLimit,
    uploadsRemaining: 0,
    uploadsResetAt: null,
    fileUploadAvailable: false
  };
  const usage = await weeklyUsage(c.env, access.source, access.limits.weeklyFileLimit, false);
  return {
    ...base,
    weeklyFileLimit: access.limits.weeklyFileLimit,
    uploadsRemaining: usage.remaining,
    uploadsResetAt: usage.resetsAt,
    fileUploadAvailable: access.maxFileSize > 0
  };
}
__name(publicUploadPolicy, "publicUploadPolicy");
async function checkUploadSession(c, session) {
  const access = await uploadAccess(c);
  if (!session.source || session.source.visitorId !== access.source.visitorId) {
    throw new UploadPolicyError(403, "upload_session_owner", "\u4E0A\u4F20\u4F1A\u8BDD\u4E0D\u5C5E\u4E8E\u5F53\u524D\u8BBF\u5BA2\uFF0C\u8BF7\u91CD\u65B0\u4E0A\u4F20");
  }
  if (!access.noted && session.source.uploadTier !== "guest") {
    throw new UploadPolicyError(403, "upload_policy_changed", "\u4E0A\u4F20\u6743\u9650\u5DF2\u53D8\u66F4\uFF0C\u8BF7\u91CD\u65B0\u4E0A\u4F20");
  }
  checkUploadOptions(access, session.size, session.expiry === "forever" ? null : 1, session.maxPickups);
}
__name(checkUploadSession, "checkUploadSession");

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

// src/share.ts
var shareRoutes = new Hono2();
shareRoutes.onError((error, c) => {
  const rejection = policyErrorResponse(c, error) ?? securityResponse(c, error);
  if (rejection) return rejection;
  console.error("Share request failed", error);
  return c.json({ error: "internal", message: "\u5206\u4EAB\u670D\u52A1\u6682\u4E0D\u53EF\u7528\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5" }, 503);
});
async function createTextShare(c) {
  const body = await c.req.json().catch(() => null);
  if (!body) return err(c, 400, "bad_request", "\u8BF7\u6C42\u4F53\u5FC5\u987B\u662F JSON");
  const submission = parseSubmission(body);
  if (!submission) return err(c, 400, "bad_request", "\u79F0\u547C\u9650 40 \u5B57\uFF0C\u8BF4\u660E\u9650 300 \u5B57");
  const text2 = body.text;
  const maxLen = num(c.env.MAX_TEXT_LENGTH, 65536);
  if (typeof text2 !== "string" || !text2.trim()) return err(c, 400, "bad_request", "\u6587\u672C\u5185\u5BB9\u4E0D\u80FD\u4E3A\u7A7A");
  if (text2.length > maxLen) return err(c, 400, "bad_request", `\u6587\u672C\u8D85\u8FC7\u4E0A\u9650 ${maxLen} \u5B57\u7B26`);
  const expMs = parseExpiry(body.expiry);
  if (expMs === void 0) return err(c, 400, "bad_request", "\u6709\u6548\u671F\u53C2\u6570\u975E\u6CD5");
  const mp = parseMaxPickups(body.maxPickups);
  if (mp === void 0) return err(c, 400, "bad_request", "\u53D6\u4EF6\u6B21\u6570\u53C2\u6570\u975E\u6CD5");
  const access = await uploadAccess(c);
  checkUploadOptions(access, null, expMs, mp);
  const now = Date.now();
  const expireAt = expMs === null ? null : now + expMs;
  const created = await getStore(c.env).createShare({
    kind: "text",
    source: { ...access.source, submission },
    size: text2.length,
    text: text2,
    maxPickups: mp,
    expireAt
  });
  auditState(c).target = created.code;
  auditState(c).detail.kind = "text";
  auditState(c).detail.textLength = text2.length;
  return c.json(
    {
      code: created.code,
      kind: "text",
      size: text2.length,
      expireAt,
      maxPickups: mp,
      pickupUrl: `/pickup?code=${created.code}`
    },
    201
  );
}
__name(createTextShare, "createTextShare");
shareRoutes.post("/shares/text", createTextShare);
async function createKVFileShare(c) {
  if (fileMode(c.env) !== "kv") {
    return err(c, 400, "config", "\u5F53\u524D\u4E3A R2 \u5927\u5B58\u50A8\u6A21\u5F0F,\u8BF7\u4F7F\u7528\u5206\u7247\u4E0A\u4F20(/api/uploads/init)");
  }
  const filename = c.req.query("filename")?.trim();
  let context;
  try {
    if ((c.req.header("X-Upload-Context") || "").length > 8192) throw new Error("too long");
    context = JSON.parse(decodeURIComponent(c.req.header("X-Upload-Context") || "%7B%7D"));
    if (!context || typeof context !== "object" || Array.isArray(context)) throw new Error("invalid");
  } catch {
    return err(c, 400, "bad_request", "\u4E0A\u4F20\u8BF4\u660E\u683C\u5F0F\u9519\u8BEF");
  }
  const submission = parseSubmission(context);
  if (!submission) return err(c, 400, "bad_request", "\u79F0\u547C\u9650 40 \u5B57\uFF0C\u8BF4\u660E\u9650 300 \u5B57");
  if (!filename) return err(c, 400, "bad_request", "\u7F3A\u5C11 filename \u67E5\u8BE2\u53C2\u6570");
  auditState(c).detail.filename = filename.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 160);
  const expMs = parseExpiry(c.req.query("expiry"));
  if (expMs === void 0) return err(c, 400, "bad_request", "\u6709\u6548\u671F\u53C2\u6570\u975E\u6CD5");
  const pkRaw = c.req.query("maxPickups");
  const mp = parseMaxPickups(pkRaw === void 0 || pkRaw === "" ? null : Number(pkRaw));
  if (mp === void 0) return err(c, 400, "bad_request", "\u53D6\u4EF6\u6B21\u6570\u53C2\u6570\u975E\u6CD5");
  const access = await uploadAccess(c);
  const maxSize = access.maxFileSize;
  checkUploadOptions(access, null, expMs, mp);
  const declared = Number(c.req.raw.headers.get("content-length") || 0);
  if (declared && declared > maxSize) {
    return err(c, 413, "too_large", `\u6587\u4EF6\u8D85\u8FC7\u4E0A\u9650 ${maxSize} \u5B57\u8282`);
  }
  await admitFile(c.env, access);
  if (!c.req.raw.body) return err(c, 400, "bad_request", "\u6587\u4EF6\u5185\u5BB9\u4E3A\u7A7A");
  const reader = c.req.raw.body.getReader();
  const chunks = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxSize) {
        await reader.cancel();
        return err(c, 413, "too_large", `\u6587\u4EF6\u8D85\u8FC7\u4E0A\u9650 ${maxSize} \u5B57\u8282`);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  if (bytes.byteLength < 1) return err(c, 400, "bad_request", "\u6587\u4EF6\u5185\u5BB9\u4E3A\u7A7A");
  const mime2 = c.req.query("mime")?.trim() || c.req.header("Content-Type")?.split(";")[0] || "application/octet-stream";
  const storageKey = KV_FILE_PREFIX + crypto.randomUUID();
  const expireAt = expMs === null ? null : Date.now() + expMs;
  await putFileBytes(c.env, storageKey, bytes.buffer);
  try {
    const created = await getStore(c.env).createShare({
      kind: "file",
      source: { ...access.source, submission },
      filename: filename.slice(0, 255),
      size: bytes.byteLength,
      mime: mime2,
      r2Key: storageKey,
      maxPickups: mp,
      expireAt
    });
    auditState(c).target = created.code;
    transferAudit(c, { filename, size: bytes.byteLength, kind: "file" });
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
}
__name(createKVFileShare, "createKVFileShare");
shareRoutes.post("/shares/file", createKVFileShare);
shareRoutes.post("/pickup", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const code = String(body?.code ?? "").trim();
  if (!/^\d{6}$/.test(code)) return err(c, 400, "bad_request", "\u8BF7\u8F93\u5165 6 \u4F4D\u53D6\u4EF6\u53E3\u4EE4");
  auditState(c).target = code;
  const store = getStore(c.env);
  const now = Date.now();
  const picked = await store.tryPickup(code, { textOnly: true });
  if (picked) {
    auditState(c).detail.kind = "text";
    auditState(c).detail.textLength = picked.size;
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
  transferAudit(c, { ...row, source: null });
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
  auditState(c).detail.reason = code;
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
  if (/^\d{6}$/.test(code)) auditState(c).target = code;
  const store = getStore(c.env);
  const now = Date.now();
  const row = await store.tryPickup(code);
  if (!row || row.kind !== "file" || !row.r2Key) {
    const raw2 = await store.getByCode(code);
    if (!raw2) return downloadError(c, 404, "not_found", "\u53E3\u4EE4\u4E0D\u5B58\u5728");
    transferAudit(c, { ...raw2, source: null });
    const st = shareStatusOf(raw2.expireAt, raw2.maxPickups, raw2.pickupCount, now);
    if (st === "expired") return downloadError(c, 410, "expired", "\u5206\u4EAB\u5DF2\u8FC7\u671F");
    if (st === "exhausted") return downloadError(c, 410, "exhausted", "\u53D6\u4EF6\u6B21\u6570\u5DF2\u7528\u5B8C");
    return downloadError(c, 410, "gone", "\u6587\u4EF6\u4E0D\u5B58\u5728");
  }
  transferAudit(c, { ...row, source: null });
  const body = await readFileStream(c.env, row.r2Key);
  if (!body) return downloadError(c, 410, "gone", "\u6587\u4EF6\u5DF2\u88AB\u6E05\u7406");
  return c.body(body, 200, {
    "Content-Type": row.mime || "application/octet-stream",
    "Content-Length": String(row.size),
    "Content-Disposition": contentDisposition(row.filename || "file"),
    "Cache-Control": "no-store"
  });
});

// src/file-preview.ts
var TEXT_PREVIEW_BYTES = 64 * 1024;
var IMAGE_PREVIEW_BYTES = 2 * 1024 * 1024;
var IMAGE_PREVIEW_PIXELS = 16e6;
var TEXT_EXTENSIONS = new Set("txt log md csv json xml html htm css js mjs cjs ts tsx jsx py sh sql yaml yml toml ini conf cfg c cpp h java rs go bat ps1".split(" "));
function imageInfo(b) {
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const ascii = /* @__PURE__ */ __name((at, n) => String.fromCharCode(...b.subarray(at, at + n)), "ascii");
  if (b.length >= 24 && b[0] === 137 && ascii(1, 7) === "PNG\r\n\n" && ascii(12, 4) === "IHDR") {
    let at = 8;
    while (at + 12 <= b.length) {
      if (ascii(at + 4, 4) === "acTL") return null;
      const length = v.getUint32(at);
      if (length > b.length - at - 12) return null;
      at += 12 + length;
    }
    return { mime: "image/png", width: v.getUint32(16), height: v.getUint32(20) };
  }
  if (b.length >= 4 && b[0] === 255 && b[1] === 216) {
    let at = 2;
    while (at + 4 <= b.length) {
      if (b[at++] !== 255) return null;
      while (b[at] === 255) at++;
      const marker = b[at++];
      if (marker === 218 || marker === 217 || at + 2 > b.length) return null;
      const size = v.getUint16(at);
      if (size < 2 || at + size > b.length) return null;
      if ([192, 193, 194].includes(marker) && size >= 8) {
        return { mime: "image/jpeg", height: v.getUint16(at + 3), width: v.getUint16(at + 5) };
      }
      at += size;
    }
  }
  if (b.length >= 30 && ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") {
    const type = ascii(12, 4);
    if (type === "VP8X") {
      if (b[20] & 2) return null;
      const u24 = /* @__PURE__ */ __name((i) => b[i] | b[i + 1] << 8 | b[i + 2] << 16, "u24");
      return { mime: "image/webp", width: 1 + u24(24), height: 1 + u24(27) };
    }
    if (type === "VP8 " && b[23] === 157 && b[24] === 1 && b[25] === 42) {
      return { mime: "image/webp", width: v.getUint16(26, true) & 16383, height: v.getUint16(28, true) & 16383 };
    }
    if (type === "VP8L" && b[20] === 47) {
      const bits = v.getUint32(21, true);
      return { mime: "image/webp", width: 1 + (bits & 16383), height: 1 + (bits >>> 14 & 16383) };
    }
  }
  return null;
}
__name(imageInfo, "imageInfo");
async function previewFile(env, key, filename, size) {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const isImage = ["png", "jpg", "jpeg", "webp"].includes(ext);
  if (!isImage && !TEXT_EXTENSIONS.has(ext)) return { kind: "unsupported", reason: "type" };
  if (isImage && size > IMAGE_PREVIEW_BYTES) return { kind: "unsupported", reason: "size" };
  const limit = isImage ? IMAGE_PREVIEW_BYTES : TEXT_PREVIEW_BYTES;
  const bytes = await readFilePrefix(env, key, limit + 1);
  if (!bytes) return null;
  if (isImage) {
    if (bytes.length > limit) return { kind: "unsupported", reason: "size" };
    const info = imageInfo(bytes);
    if (!info || !info.width || !info.height || info.width * info.height > IMAGE_PREVIEW_PIXELS) return { kind: "unsupported", reason: "image" };
    return { kind: "image", bytes, ...info };
  }
  const truncated = bytes.length > limit;
  try {
    const text2 = new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(bytes.subarray(0, limit), { stream: truncated });
    if (/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(text2)) return { kind: "unsupported", reason: "encoding" };
    return { kind: ext === "csv" ? "csv" : "text", text: text2, truncated };
  } catch {
    return { kind: "unsupported", reason: "encoding" };
  }
}
__name(previewFile, "previewFile");

// src/cleanup.ts
async function runCleanup(env) {
  const now = Date.now();
  const store = getStore(env);
  const cutoff = now - await getRetentionDays(env) * RETENTION_DAY_MS;
  let deletedShares = 0;
  let abortedSessions = 0;
  for (let round = 0; round < 20; round++) {
    const expired = await store.listExpiredShares(cutoff, 100);
    if (expired.length === 0) break;
    const r2Keys = expired.filter((r) => r.r2Key && !isKvFileKey(r.r2Key)).map((r) => r.r2Key);
    if (r2Keys.length > 0 && env.BUCKET) {
      await env.BUCKET.delete(r2Keys);
      await releaseCapacity(env, r2Keys);
    }
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
      continue;
    }
    if (env.BUCKET && !await env.BUCKET.head(s.r2Key)) await releaseCapacity(env, [s.r2Key]);
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

// src/kv-usage.ts
var TTL_MS = 3e5;
var cache = /* @__PURE__ */ new Map();
var pending = /* @__PURE__ */ new Map();
async function getKVUsage(env) {
  const base = { bound: !!env.fileKV, freeQuotaBytes: 1e9, quotaScope: "account", state: env.fileKV ? "unconfigured" : "unbound", source: "cloudflare-analytics" };
  if (!env.fileKV) return base;
  const account = env.CF_ACCOUNT_ID, namespace = env.CF_KV_NAMESPACE_ID, token = env.CF_ANALYTICS_TOKEN;
  if (!account || !namespace || !token || !/^[a-f0-9]{32}$/i.test(account) || !/^[a-f0-9]{32}$/i.test(namespace)) return base;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  const identity = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  const key = `${account}:${namespace}:${identity}`;
  const hit = cache.get(key);
  if (hit && hit.until > Date.now()) return hit.value;
  const inflight = pending.get(key);
  if (inflight) return inflight;
  const query = /* @__PURE__ */ __name(async () => {
    let result = { ...base, state: "unavailable" };
    try {
      const now = /* @__PURE__ */ new Date(), start = new Date(now.getTime() - 3 * 864e5);
      const response = await fetch("https://api.cloudflare.com/client/v4/graphql", {
        method: "POST",
        signal: AbortSignal.timeout(5e3),
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ query: `query($accountTag: string!, $namespaceId: string, $start: Date, $end: Date) {
          viewer { accounts(filter: {accountTag: $accountTag}) { kvStorageAdaptiveGroups(
            filter: {namespaceId: $namespaceId, date_geq: $start, date_leq: $end}, limit: 1, orderBy: [date_DESC]
          ) { max { byteCount keyCount } dimensions { date } } } }
        }`, variables: { accountTag: account, namespaceId: namespace, start: start.toISOString().slice(0, 10), end: now.toISOString().slice(0, 10) } })
      });
      if (response.ok) {
        const payload = await response.json();
        const row = payload?.data?.viewer?.accounts?.[0]?.kvStorageAdaptiveGroups?.[0];
        const bytes = row?.max?.byteCount, count = row?.max?.keyCount, date = row?.dimensions?.date;
        if (!payload.errors?.length && typeof bytes === "number" && Number.isSafeInteger(bytes) && bytes >= 0 && typeof count === "number" && Number.isSafeInteger(count) && count >= 0 && typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
          result = { ...base, state: "available", usedBytes: bytes, keyCount: count, sampleDate: date };
        }
      }
    } catch {
    }
    for (const [id, entry] of cache) if (entry.until <= Date.now()) cache.delete(id);
    if (cache.size >= 16) cache.delete(cache.keys().next().value);
    cache.set(key, { until: Date.now() + (result.state === "available" ? TTL_MS : 3e4), value: result });
    return result;
  }, "query");
  const task = query();
  pending.set(key, task);
  try {
    return await task;
  } finally {
    pending.delete(key);
  }
}
__name(getKVUsage, "getKVUsage");

// src/admin.ts
var adminRoutes = new Hono2();
adminRoutes.use("*", auditRequest);
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
  c.header("Cache-Control", "no-store");
  if (c.req.method === "POST" && c.req.path === "/api/admin/login") return next();
  if (c.req.method === "POST" && c.req.path === "/api/admin/cleanup") {
    const bearer = c.req.header("Authorization");
    if (bearer?.startsWith("Bearer ")) {
      if (!c.env.ADMIN_TOKEN) return c.json({ error: "config", message: "\u7BA1\u7406\u5458\u4EE4\u724C\u672A\u914D\u7F6E" }, 503);
      const ip = loginIP(c);
      await enforceSecurity(c.env, ip, "login");
      await checkLogin(c.env, ip);
      const valid = await safeEqual(bearer.slice(7), c.env.ADMIN_TOKEN);
      await recordLogin(c.env, ip, valid);
      if (valid) {
        auditState(c).authenticated = true;
        auditState(c).actor = "token";
        return next();
      }
      return err(c, 401, "unauthorized", "\u4EE4\u724C\u65E0\u6548");
    }
  }
  if (!await isValidCookie(c.env, getCookie(c, "admin"))) {
    return err(c, 401, "unauthorized", "\u672A\u767B\u5F55\u6216\u4F1A\u8BDD\u5DF2\u8FC7\u671F");
  }
  auditState(c).authenticated = true;
  auditState(c).actor = "admin";
  await next();
});
adminRoutes.post("/login", async (c) => {
  if (!c.env.ADMIN_TOKEN) return c.json({ error: "config", message: "\u7BA1\u7406\u5458\u4EE4\u724C\u672A\u914D\u7F6E" }, 503);
  const origin = c.req.header("Origin");
  if (origin && origin !== new URL(c.req.url).origin) return c.json({ error: "forbidden", message: "\u8BF7\u6C42\u6765\u6E90\u4E0D\u5339\u914D" }, 403);
  const ip = loginIP(c);
  await enforceSecurity(c.env, ip, "login");
  await checkLogin(c.env, ip);
  const body = await c.req.json().catch(() => null);
  const token = body?.token;
  if (typeof token !== "string" || !await safeEqual(token, c.env.ADMIN_TOKEN || "")) {
    await recordLogin(c.env, ip, false);
    return err(c, 401, "unauthorized", "\u4EE4\u724C\u65E0\u6548");
  }
  await recordLogin(c.env, ip, true);
  auditState(c).authenticated = true;
  auditState(c).actor = "admin";
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
async function auditList(c) {
  try {
    return c.json(await queryAudit(c.env, c.req.query()));
  } catch (error) {
    return error instanceof RangeError ? c.json({ error: "bad_request", message: "\u65E5\u5FD7\u7B5B\u9009\u53C2\u6570\u65E0\u6548" }, 400) : c.json({ error: "audit_unavailable", message: "\u5BA1\u8BA1\u65E5\u5FD7\u6682\u4E0D\u53EF\u7528\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5" }, 503);
  }
}
__name(auditList, "auditList");
adminRoutes.get("/audit-logs", auditList);
adminRoutes.get("/audit-logs/export", auditList);
adminRoutes.get("/login-protection", async (c) => c.json(await loginProtectionStatus(c.env)));
adminRoutes.post("/login-protection/unblock", async (c) => {
  const origin = c.req.header("Origin");
  if (origin && origin !== new URL(c.req.url).origin) return c.json({ error: "forbidden", message: "\u8BF7\u6C42\u6765\u6E90\u4E0D\u5339\u914D" }, 403);
  if (!c.req.header("Content-Type")?.startsWith("application/json")) return c.json({ error: "bad_request", message: "\u8BF7\u4F7F\u7528 JSON" }, 415);
  const body = await c.req.json().catch(() => null);
  if (typeof body?.ip !== "string" || !/^(unknown|[0-9a-f:.]{3,45})$/.test(body.ip)) return err(c, 400, "bad_request", "IP \u683C\u5F0F\u65E0\u6548");
  auditState(c).target = body.ip;
  await unblockLogin(c.env, body.ip);
  return c.json({ ok: true });
});
async function securityView(env) {
  const state = await securityState(env), legacy = await loginProtectionStatus(env);
  const all = [...state.bans, ...legacy.bans.map((old) => ({ ip: old.ip, scopes: ["login"], kind: "auto", failures: old.failures, reason: "\u767B\u5F55\u5931\u8D25\u6B21\u6570\u8FC7\u591A", at: old.lastFailedAt, until: old.bannedUntil }))];
  const grouped = /* @__PURE__ */ new Map();
  for (const entry of all) grouped.set(entry.ip, [...grouped.get(entry.ip) || [], entry]);
  const bans = [...grouped].map(([ip, segments]) => ({ ip, segments, scopes: [...new Set(segments.flatMap((b) => b.scopes))], kind: segments.some((b) => b.kind === "manual") ? "manual" : "auto", failures: Math.max(...segments.map((b) => b.failures)), reason: [...new Set(segments.map((b) => b.reason))].join(" / "), at: Math.min(...segments.map((b) => b.at)), until: segments.some((b) => b.until === null) ? null : Math.max(...segments.map((b) => b.until)) }));
  return { enabled: securityEnabled(env), configRevision: state.configRevision, rules: state.rules, bans, allow: state.allow, regions: state.regions };
}
__name(securityView, "securityView");
adminRoutes.get("/security", async (c) => c.json(await securityView(c.env)));
adminRoutes.post("/security/test", async (c) => {
  const origin = c.req.header("Origin");
  if (origin && origin !== new URL(c.req.url).origin) return c.json({ error: "forbidden", message: "\u8BF7\u6C42\u6765\u6E90\u4E0D\u5339\u914D" }, 403);
  if (!c.req.header("Content-Type")?.startsWith("application/json")) throw new SecurityError(400, "\u8BF7\u4F7F\u7528 JSON");
  const body = await c.req.json().catch(() => null);
  const ip = canonicalIP(body?.ip), scope = body?.scope;
  if (!securityEnabled(c.env)) throw new SecurityError(503, "\u5B89\u5168\u9632\u62A4\u9700\u8981\u7ED1\u5B9A R2 \u6216 D1");
  if (!ip || !SCOPES.includes(scope) || typeof body.country !== "string" || !/^([A-Z]{2})?$/.test(body.country) || typeof body.region !== "string" || !/^[A-Z0-9-]{0,10}$/.test(body.region) || !Number.isInteger(body.count) || body.count < 0 || body.count > 1e5) throw new SecurityError(400, "\u6D4B\u8BD5\u53C2\u6570\u65E0\u6548");
  const state = await securityState(c.env);
  let result = evaluate(state, ip, scope, body.country, body.region);
  if (!result.blocked && !exempt(state, ip, scope)) {
    if (scope === "login" && (await loginProtectionStatus(c.env)).bans.some((b) => b.ip === ip)) result = { blocked: true, reason: "\u5DF2\u6709\u767B\u5F55\u81EA\u52A8\u5C01\u7981", retryAt: void 0, status: 429 };
    else if (state.rules[scope].enabled && body.count >= state.rules[scope].limit) result = { blocked: true, reason: "\u8FBE\u5230\u81EA\u52A8\u5C01\u7981\u9608\u503C", retryAt: void 0, status: 429 };
  }
  return c.json(result);
});
adminRoutes.post("/security", async (c) => {
  const origin = c.req.header("Origin");
  if (origin && origin !== new URL(c.req.url).origin) return c.json({ error: "forbidden", message: "\u8BF7\u6C42\u6765\u6E90\u4E0D\u5339\u914D" }, 403);
  if (!c.req.header("Content-Type")?.startsWith("application/json")) return c.json({ error: "bad_request", message: "\u8BF7\u4F7F\u7528 JSON" }, 415);
  if (Number(c.req.header("Content-Length") || 0) > 65536) throw new SecurityError(400, "\u89C4\u5219\u8BF7\u6C42\u8FC7\u5927");
  const raw2 = await c.req.text();
  if (raw2.length > 65536) throw new SecurityError(400, "\u89C4\u5219\u8BF7\u6C42\u8FC7\u5927");
  let body;
  try {
    body = JSON.parse(raw2);
  } catch {
    throw new SecurityError(400, "JSON \u683C\u5F0F\u65E0\u6548");
  }
  const next = await editSecurity(c.env, body);
  if (body.action === "unban") await unblockLogins(c.env, body.ips.map((ip) => canonicalIP(ip) || "unknown"));
  auditState(c).target = typeof body.ip === "string" ? body.ip : typeof body.id === "string" ? body.id : "security";
  auditState(c).detail.action = body.action;
  auditState(c).detail.configRevision = next.configRevision;
  return c.json({ ok: true, configRevision: next.configRevision });
});
adminRoutes.get("/settings", async (c) => c.json({ expiredRetentionDays: await getRetentionDays(c.env) }));
adminRoutes.put("/settings", async (c) => {
  const origin = c.req.header("Origin");
  if (origin && origin !== new URL(c.req.url).origin) return c.json({ error: "forbidden", message: "\u8BF7\u6C42\u6765\u6E90\u4E0D\u5339\u914D" }, 403);
  if (!c.req.header("Content-Type")?.startsWith("application/json")) return c.json({ error: "bad_request", message: "\u8BF7\u4F7F\u7528 JSON" }, 415);
  const body = await c.req.json().catch(() => null);
  if (!validRetentionDays(body?.expiredRetentionDays)) return err(c, 400, "bad_request", "\u4FDD\u7559\u5929\u6570\u5E94\u4E3A 0\u20133650 \u7684\u6574\u6570");
  auditState(c).detail.expiredRetentionDays = body.expiredRetentionDays;
  await setRetentionDays(c.env, body.expiredRetentionDays);
  return c.json({ expiredRetentionDays: body.expiredRetentionDays });
});
adminRoutes.get("/upload-policy", async (c) => c.json(await getGuestLimits(c.env)));
adminRoutes.put("/upload-policy", async (c) => {
  const origin = c.req.header("Origin");
  if (origin && origin !== new URL(c.req.url).origin) return c.json({ error: "forbidden", message: "\u8BF7\u6C42\u6765\u6E90\u4E0D\u5339\u914D" }, 403);
  if (!c.req.header("Content-Type")?.startsWith("application/json")) return c.json({ error: "bad_request", message: "\u8BF7\u4F7F\u7528 JSON" }, 415);
  const body = await c.req.json().catch(() => null);
  if (!validGuestLimits(body)) return err(c, 400, "bad_request", "\u5468\u6B21\u6570\u5E94\u4E3A 0\u20131000 \u7684\u6574\u6570");
  const limits = { weeklyFileLimit: body.weeklyFileLimit };
  auditState(c).detail.weeklyFileLimit = limits.weeklyFileLimit;
  await setGuestLimits(c.env, limits);
  return c.json(limits);
});
adminRoutes.get("/stats", async (c) => {
  const todayStart = /* @__PURE__ */ new Date();
  todayStart.setHours(0, 0, 0, 0);
  const stats = await getStore(c.env).stats(todayStart.getTime());
  let storage = null;
  if (c.env.BUCKET) {
    try {
      storage = await getCapacityUsage(c.env);
    } catch (e) {
      console.error("Capacity statistics unavailable", e);
    }
  }
  const kv = await getKVUsage(c.env);
  return c.json({ ...stats, storage, kv, metadataBackend: c.env.fileKV ? "kv" : "d1", fileBackend: c.env.BUCKET ? "r2" : "kv" });
});
adminRoutes.get("/shares", async (c) => {
  const limit = Math.min(Math.max(Number(c.req.query("limit") || 50) || 50, 1), 200);
  const offset = Math.max(Number(c.req.query("offset") || 0) || 0, 0);
  const now = Date.now();
  const store = getStore(c.env);
  const kind = c.req.query("kind"), status = c.req.query("status"), q = c.req.query("q")?.trim() ?? "";
  if (q.length > 80 || kind && !["all", "file", "text"].includes(kind) || status && !["all", "active", "expired", "exhausted"].includes(status)) return err(c, 400, "bad_request", "\u7B5B\u9009\u53C2\u6570\u975E\u6CD5");
  const filter = {
    q,
    ...kind && kind !== "all" ? { kind } : {},
    ...status && status !== "all" ? { status } : {}
  };
  const { total, rows } = await store.listShares(limit, offset, filter);
  const ids = [...new Set(rows.flatMap((r) => r.source ? [r.source.visitorId] : []))];
  const notes = await store.getVisitorNotes(ids);
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
      text_preview: r.textPreview,
      source: r.source ? { ...r.source, note: notes.get(r.source.visitorId) ?? "" } : null
    }))
  });
});
adminRoutes.get("/shares/:code", async (c) => {
  const code = c.req.param("code");
  if (!/^\d{6}$/.test(code)) return err(c, 400, "bad_request", "\u53E3\u4EE4\u975E\u6CD5");
  const store = getStore(c.env);
  const record = await store.getByCode(code);
  if (!record) return err(c, 404, "not_found", "\u5206\u4EAB\u4E0D\u5B58\u5728");
  const [days, storage, note2] = await Promise.all([
    getRetentionDays(c.env),
    record.kind === "file" ? inspectFile(c.env, record.r2Key) : Promise.resolve(null),
    record.source ? store.getVisitorNote(record.source.visitorId) : Promise.resolve("")
  ]);
  const evaluatedAt = Date.now();
  const cleanupAfter = record.expireAt === null ? null : record.expireAt + days * RETENTION_DAY_MS;
  const cleanupStatus = cleanupAfter === null ? "permanent" : record.expireAt > evaluatedAt ? "active" : cleanupAfter > evaluatedAt ? "retained" : "pending";
  c.header("Cache-Control", "no-store");
  return c.json({
    id: record.id,
    code,
    kind: record.kind,
    filename: record.filename,
    size: record.size,
    mime: record.mime,
    ...record.kind === "text" ? { text: record.text, version: await shareVersion(record), maxTextLength: num(c.env.MAX_TEXT_LENGTH, 65536) } : {},
    description: record.source?.submission?.description || null,
    displayName: record.source?.submission?.displayName || null,
    createdAt: record.createdAt,
    expireAt: record.expireAt,
    cleanupAfter,
    cleanupStatus,
    retentionDays: days,
    evaluatedAt,
    storage,
    source: record.source ? { ...sourceSummary(record.source), note: note2 } : null,
    pickupCount: record.pickupCount,
    maxPickups: record.maxPickups,
    status: shareStatusOf(record.expireAt, record.maxPickups, record.pickupCount, evaluatedAt),
    downloadUrl: record.kind === "file" ? `/api/admin/shares/${code}/download` : null
  });
});
adminRoutes.put("/shares/:code", bodyLimit({
  maxSize: 1048576,
  onError: /* @__PURE__ */ __name((c) => err(c, 400, "bad_request", "\u8BF7\u6C42\u8D85\u8FC7 1 MiB \u4E0A\u9650"), "onError")
}), async (c) => {
  const origin = c.req.header("Origin");
  if (origin && origin !== new URL(c.req.url).origin) return err(c, 403, "forbidden", "\u8BF7\u6C42\u6765\u6E90\u4E0D\u5339\u914D");
  if (!c.req.header("Content-Type")?.startsWith("application/json")) return err(c, 415, "bad_request", "\u8BF7\u4F7F\u7528 JSON");
  const code = c.req.param("code");
  if (!/^\d{6}$/.test(code)) return err(c, 400, "bad_request", "\u53E3\u4EE4\u975E\u6CD5");
  const raw2 = await c.req.text();
  let body;
  try {
    body = JSON.parse(raw2);
  } catch {
    return err(c, 400, "bad_request", "JSON \u683C\u5F0F\u65E0\u6548");
  }
  if (!validShareRules(body?.rules) || !validShareBase(body?.expected)) return err(c, 400, "bad_request", "\u6B21\u6570\u3001\u6709\u6548\u671F\u6216\u72B6\u6001\u53C2\u6570\u65E0\u6548");
  const store = getStore(c.env), record = await store.getByCode(code);
  if (!record) return err(c, 404, "not_found", "\u5206\u4EAB\u4E0D\u5B58\u5728");
  const isText = record.kind === "text";
  if (isText && typeof body.expected.version !== "string") return err(c, 400, "bad_request", "\u7F3A\u5C11\u6587\u672C\u7248\u672C\uFF0C\u8BF7\u91CD\u65B0\u6253\u5F00\u8BE6\u60C5");
  if (isText && (!sameShareRules(record, body.expected) || body.expected.version !== await shareVersion(record))) return err(c, 409, "share_conflict", "\u8BB0\u5F55\u5DF2\u88AB\u53D6\u4EF6\u6216\u4FEE\u6539\uFF0C\u8BF7\u91CD\u65B0\u52A0\u8F7D\u540E\u7F16\u8F91");
  if ("text" in body && (!isText || typeof body.text !== "string" || !body.text.trim() || body.text.length > num(c.env.MAX_TEXT_LENGTH, 65536)))
    return err(c, 400, "bad_request", "\u6587\u672C\u4E0D\u80FD\u4E3A\u7A7A\u6216\u8D85\u8FC7\u5B57\u7B26\u4E0A\u9650\uFF0C\u4EC5\u6587\u672C\u5206\u4EAB\u53EF\u4FEE\u6539\u6B63\u6587");
  const cutoff = Date.now() - await getRetentionDays(c.env) * RETENTION_DAY_MS;
  if (record.expireAt !== null && record.expireAt <= cutoff)
    return err(c, 409, "cleanup_pending", "\u5206\u4EAB\u5DF2\u8FDB\u5165\u6E05\u7406\u671F\uFF0C\u4E0D\u80FD\u4FEE\u6539\uFF1B\u8BF7\u5148\u5907\u4EFD\u5185\u5BB9\u540E\u91CD\u65B0\u5206\u4EAB");
  if (!isText) {
    const storage = await inspectFile(c.env, record.r2Key);
    if (storage.state === "missing") return err(c, 410, "gone", "\u6587\u4EF6\u5DF2\u88AB\u6E05\u7406");
    if (storage.state !== "available") return err(c, 503, "storage_unavailable", "\u65E0\u6CD5\u786E\u8BA4\u6587\u4EF6\u5B58\u50A8\u72B6\u6001\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5");
  }
  const { pickupCount, maxPickups, expireAt, status } = body.rules;
  const rules = { pickupCount, maxPickups, expireAt };
  if (shareStatusOf(expireAt, maxPickups, pickupCount, Date.now()) !== status)
    return c.json({ error: "status_mismatch", message: "\u72B6\u6001\u4E0E\u6B21\u6570\u6216\u8FC7\u671F\u65F6\u95F4\u4E0D\u4E00\u81F4\uFF0C\u8BF7\u68C0\u67E5\u540E\u4FDD\u5B58" }, 400);
  const text2 = "text" in body ? body.text : record.text;
  const updated = isText ? await store.updateShare(code, record, {
    filename: record.filename,
    text: text2,
    size: text2?.length ?? 0,
    ...rules
  }, cutoff) : await store.updateRules(code, body.expected, rules, cutoff);
  if (!updated) return err(c, 409, "share_conflict", "\u8BB0\u5F55\u5DF2\u88AB\u53D6\u4EF6\u6216\u4FEE\u6539\uFF0C\u8BF7\u91CD\u65B0\u52A0\u8F7D\u540E\u7F16\u8F91");
  auditState(c).detail.beforeRules = JSON.stringify({ pickupCount: record.pickupCount, maxPickups: record.maxPickups, expireAt: record.expireAt });
  auditState(c).detail.afterRules = JSON.stringify(rules);
  if (isText && text2 !== record.text) {
    auditState(c).detail.changedFields = "text";
    auditState(c).detail.beforeTextLength = record.text?.length ?? 0;
    auditState(c).detail.afterTextLength = text2?.length ?? 0;
  }
  return c.json({ ok: true, code, ...rules, status: shareStatusOf(expireAt, maxPickups, pickupCount, Date.now()) });
});
adminRoutes.get("/shares/:code/preview", async (c) => {
  const code = c.req.param("code");
  if (!/^\d{6}$/.test(code)) return err(c, 400, "bad_request", "\u53E3\u4EE4\u975E\u6CD5");
  const record = await getStore(c.env).getByCode(code);
  if (!record) return err(c, 404, "not_found", "\u5206\u4EAB\u4E0D\u5B58\u5728");
  if (record.kind !== "file") return err(c, 400, "bad_request", "\u6B64\u5206\u4EAB\u4E0D\u662F\u6587\u4EF6");
  if (!record.r2Key) return err(c, 410, "gone", "\u6587\u4EF6\u5DF2\u88AB\u6E05\u7406");
  const preview = await previewFile(c.env, record.r2Key, record.filename || "", record.size);
  if (!preview) return err(c, 410, "gone", "\u6587\u4EF6\u5DF2\u88AB\u6E05\u7406");
  c.header("X-Content-Type-Options", "nosniff");
  c.header("Content-Security-Policy", "default-src 'none'; sandbox");
  if (preview.kind === "image") {
    c.header("Content-Type", preview.mime);
    c.header("Content-Disposition", "inline");
    c.header("X-Preview-Width", String(preview.width));
    c.header("X-Preview-Height", String(preview.height));
    return c.body(new Uint8Array(preview.bytes).buffer);
  }
  return c.json(preview);
});
async function downloadShare(c) {
  const code = c.req.param("code") ?? "";
  if (!/^\d{6}$/.test(code)) return err(c, 400, "bad_request", "\u53E3\u4EE4\u975E\u6CD5");
  const record = await getStore(c.env).getByCode(code);
  if (!record) return err(c, 404, "not_found", "\u5206\u4EAB\u4E0D\u5B58\u5728");
  auditState(c).detail.filename = (record.filename || "").slice(0, 160);
  auditState(c).detail.sizeBytes = record.size;
  if (record.kind !== "file") return err(c, 400, "bad_request", "\u6B64\u5206\u4EAB\u4E0D\u662F\u6587\u4EF6");
  if (!record.r2Key) return err(c, 410, "gone", "\u6587\u4EF6\u5DF2\u88AB\u6E05\u7406");
  const body = await readFileStream(c.env, record.r2Key);
  if (!body) return err(c, 410, "gone", "\u6587\u4EF6\u5DF2\u88AB\u6E05\u7406");
  return c.body(body, 200, {
    "Content-Type": record.mime || "application/octet-stream",
    "Content-Length": String(record.size),
    "Content-Disposition": contentDisposition(record.filename || "file"),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
}
__name(downloadShare, "downloadShare");
adminRoutes.get("/shares/:code/download", downloadShare);
adminRoutes.get("/shares/:code/source", async (c) => {
  const code = c.req.param("code");
  if (!/^\d{6}$/.test(code)) return err(c, 400, "bad_request", "\u53E3\u4EE4\u975E\u6CD5");
  const store = getStore(c.env);
  const record = await store.getByCode(code);
  if (!record) return err(c, 404, "not_found", "\u5206\u4EAB\u4E0D\u5B58\u5728");
  if (!record.source) return c.json({ source: null });
  const { submission, ...source } = record.source;
  return c.json({ source: {
    ...source,
    displayName: submission?.displayName || null,
    note: await store.getVisitorNote(source.visitorId)
  } });
});
adminRoutes.get("/shares/:code/source/activity", async (c) => {
  const code = c.req.param("code");
  if (!/^\d{6}$/.test(code)) return err(c, 400, "bad_request", "\u53E3\u4EE4\u975E\u6CD5");
  const store = getStore(c.env);
  const record = await store.getByCode(code);
  if (!record) return err(c, 404, "not_found", "\u5206\u4EAB\u4E0D\u5B58\u5728");
  const rows = record.source ? await store.visitorShares(record.source.visitorId) : [];
  return c.json({ limit: 10, rows: rows.map((row) => ({
    code: row.code,
    kind: row.kind,
    filename: row.filename,
    size: row.size,
    createdAt: row.createdAt,
    status: shareStatusOf(row.expireAt, row.maxPickups, row.pickupCount, Date.now()),
    ip: row.source?.ip ?? null,
    country: row.source?.country ?? null,
    region: row.source?.region ?? null,
    city: row.source?.city ?? null
  })) });
});
adminRoutes.put("/shares/:code/source", async (c) => {
  const origin = c.req.header("Origin");
  if (origin && origin !== new URL(c.req.url).origin) return c.json({ error: "forbidden", message: "\u8BF7\u6C42\u6765\u6E90\u4E0D\u5339\u914D" }, 403);
  if (!c.req.header("Content-Type")?.startsWith("application/json")) return c.json({ error: "bad_request", message: "\u8BF7\u4F7F\u7528 JSON" }, 415);
  const code = c.req.param("code");
  if (!/^\d{6}$/.test(code)) return err(c, 400, "bad_request", "\u53E3\u4EE4\u975E\u6CD5");
  const body = await c.req.json().catch(() => null);
  if (typeof body?.note !== "string" || body.note.length > 64 || /[\u0000-\u001f\u007f]/.test(body.note)) {
    return err(c, 400, "bad_request", "\u5907\u6CE8\u5E94\u4E3A\u4E0D\u8D85\u8FC7 64 \u5B57\u7B26\u7684\u5355\u884C\u6587\u672C");
  }
  const store = getStore(c.env);
  const record = await store.getByCode(code);
  if (!record) return err(c, 404, "not_found", "\u5206\u4EAB\u4E0D\u5B58\u5728");
  if (!record.source) return c.json({ error: "source_unrecorded", message: "\u6B64\u8BB0\u5F55\u6CA1\u6709\u8BBF\u5BA2\u6765\u6E90" }, 409);
  const note2 = body.note.trim();
  auditState(c).detail.notePresent = !!note2;
  await store.setVisitorNote(record.source.visitorId, note2);
  return c.json({ visitorId: record.source.visitorId, note: note2 });
});
adminRoutes.delete("/shares/:code", async (c) => {
  const code = c.req.param("code");
  if (!/^\d{6}$/.test(code)) return err(c, 400, "bad_request", "\u53E3\u4EE4\u975E\u6CD5");
  const store = getStore(c.env);
  const rec = await store.getByCode(code);
  if (!rec) {
    auditState(c).detail.alreadyDeleted = true;
    return c.json({ ok: true, already: true });
  }
  auditState(c).detail.filename = (rec.filename || "").slice(0, 160);
  auditState(c).detail.sizeBytes = rec.size;
  if (rec.kind === "file") await deleteFile(c.env, rec.r2Key);
  await store.deleteByCode(code);
  return c.json({ ok: true });
});
adminRoutes.post("/cleanup", async (c) => {
  const result = await runCleanup(c.env);
  auditState(c).detail = result;
  return c.json({ ok: true, ...result });
});

// src/upload.ts
var uploadRoutes = new Hono2();
uploadRoutes.onError((e, c) => {
  const rejection = policyErrorResponse(c, e) ?? securityResponse(c, e);
  if (rejection) return rejection;
  if (e instanceof CapacityError) return c.json({ error: "capacity_exceeded", message: e.message, remainingBytes: e.remainingBytes, capacityBytes: R2_CAPACITY_MAX }, 507);
  console.error("Upload failed", e);
  return c.json({ error: "internal", message: "\u4E0A\u4F20\u670D\u52A1\u6682\u4E0D\u53EF\u7528,\u8BF7\u7A0D\u540E\u91CD\u8BD5" }, 503);
});
uploadRoutes.use("*", async (c, next) => {
  if (fileMode(c.env) !== "r2") {
    return err(c, 400, "config", "\u5F53\u524D\u4E3A\u5C0F\u5B58\u50A8\u6A21\u5F0F(KV),\u8BF7\u4F7F\u7528\u76F4\u4F20\u63A5\u53E3 /api/shares/file");
  }
  await next();
});
uploadRoutes.post("/init", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) return err(c, 400, "bad_request", "\u8BF7\u6C42\u4F53\u5FC5\u987B\u662F JSON");
  const submission = parseSubmission(body);
  if (!submission) return err(c, 400, "bad_request", "\u79F0\u547C\u9650 40 \u5B57\uFF0C\u8BF4\u660E\u9650 300 \u5B57");
  const { filename, size, mime: mime2, expiry, maxPickups } = body;
  const maxSize = fileMaxSize(c.env);
  const partSize = uploadPartSize(c.env);
  const maxParts = uploadMaxParts(c.env);
  if (typeof filename !== "string" || !filename.trim()) return err(c, 400, "bad_request", "\u6587\u4EF6\u540D\u4E0D\u80FD\u4E3A\u7A7A");
  if (typeof size !== "number" || !Number.isSafeInteger(size) || size < 1) return err(c, 400, "bad_request", "\u6587\u4EF6\u5927\u5C0F\u975E\u6CD5");
  transferAudit(c, { filename, size, kind: "file" });
  if (size > maxSize) {
    return err(c, 413, "too_large", `\u6587\u4EF6\u8D85\u8FC7\u4E0A\u9650 ${maxSize} \u5B57\u8282`);
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
  const access = await uploadAccess(c);
  checkUploadOptions(access, size, expMs, mp);
  await admitFile(c.env, access);
  const source = { ...access.source, submission, uploadTier: access.noted ? "noted" : "guest" };
  const capacity = await reserveCapacity(c.env, r2Key, size);
  let mpu;
  try {
    mpu = await c.env.BUCKET.createMultipartUpload(r2Key, {
      httpMetadata: { contentType },
      storageClass: "Standard"
    });
    await getStore(c.env).createSession({
      source,
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
  } catch (e) {
    if (mpu) await mpu.abort();
    await releaseCapacity(c.env, [r2Key]);
    throw e;
  }
  return c.json({ uploadId: id, partSize, parts, size, ...capacity });
});
uploadRoutes.put("/:id/parts/:n", async (c) => {
  const id = c.req.param("id");
  const n = Number(c.req.param("n"));
  const sess = await getStore(c.env).getSession(id);
  if (!sess) return err(c, 404, "not_found", "\u4E0A\u4F20\u4F1A\u8BDD\u4E0D\u5B58\u5728\u6216\u5DF2\u8FC7\u671F");
  await checkUploadSession(c, sess);
  uploadSessionAudit(c, sess);
  if (sess.size > fileMaxSize(c.env)) return err(c, 413, "too_large", "\u6587\u4EF6\u8D85\u8FC7\u5F53\u524D\u5355\u6587\u4EF6\u4E0A\u9650,\u8BF7\u91CD\u65B0\u4E0A\u4F20");
  if (!Number.isInteger(n) || n < 1 || n > sess.parts) return err(c, 400, "bad_request", "\u5206\u7247\u5E8F\u53F7\u975E\u6CD5");
  const partSize = uploadPartSize(c.env);
  const contentLength = Number(c.req.raw.headers.get("content-length") || 0);
  if (contentLength && contentLength > partSize) return err(c, 400, "bad_request", "\u5206\u7247\u8FC7\u5927");
  const body = c.req.raw.body;
  if (!body) return err(c, 400, "bad_request", "\u8BF7\u6C42\u4F53\u4E3A\u7A7A");
  if (Math.ceil(sess.size / partSize) !== sess.parts) return err(c, 400, "bad_request", "\u5206\u7247\u914D\u7F6E\u5DF2\u53D8\u66F4,\u8BF7\u91CD\u65B0\u4E0A\u4F20");
  const expected = Math.min(partSize, sess.size - (n - 1) * partSize);
  if (contentLength && contentLength !== expected) return err(c, 400, "bad_request", "\u5206\u7247\u5927\u5C0F\u4E0E\u58F0\u660E\u4E0D\u4E00\u81F4");
  await reserveCapacity(c.env, sess.r2Key, sess.size);
  const abort = new AbortController();
  try {
    const mpu = c.env.BUCKET.resumeMultipartUpload(sess.r2Key, sess.uploadId);
    const stream = new FixedLengthStream(expected);
    const [part] = await Promise.all([
      mpu.uploadPart(n, stream.readable),
      body.pipeTo(stream.writable, { signal: abort.signal })
    ]);
    return c.json({ partNumber: part.partNumber, etag: part.etag });
  } catch {
    return err(c, 500, "internal", "\u5206\u7247\u5199\u5165\u5931\u8D25,\u8BF7\u91CD\u8BD5");
  } finally {
    abort.abort();
  }
});
uploadRoutes.post("/:id/complete", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const store = getStore(c.env);
  const sess = await store.getSession(id);
  if (!sess) return err(c, 404, "not_found", "\u4E0A\u4F20\u4F1A\u8BDD\u4E0D\u5B58\u5728\u6216\u5DF2\u8FC7\u671F");
  await checkUploadSession(c, sess);
  uploadSessionAudit(c, sess);
  if (sess.size > fileMaxSize(c.env)) return err(c, 413, "too_large", "\u6587\u4EF6\u8D85\u8FC7\u5F53\u524D\u5355\u6587\u4EF6\u4E0A\u9650,\u8BF7\u91CD\u65B0\u4E0A\u4F20");
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
  await reserveCapacity(c.env, sess.r2Key, sess.size);
  try {
    const mpu = c.env.BUCKET.resumeMultipartUpload(sess.r2Key, sess.uploadId);
    obj = await mpu.complete(r2parts);
  } catch {
    return err(c, 400, "bad_request", "\u5408\u5E76\u5206\u7247\u5931\u8D25,\u8BF7\u91CD\u8BD5");
  }
  if (obj.size > fileMaxSize(c.env) || obj.size !== sess.size) {
    await c.env.BUCKET.delete(sess.r2Key);
    await releaseCapacity(c.env, [sess.r2Key]);
    await store.deleteSession(id);
    if (obj.size > fileMaxSize(c.env)) return err(c, 413, "too_large", "\u6587\u4EF6\u8D85\u8FC7\u5F53\u524D\u5355\u6587\u4EF6\u4E0A\u9650");
    return err(c, 400, "bad_request", "\u6587\u4EF6\u5927\u5C0F\u6821\u9A8C\u5931\u8D25");
  }
  const parsed = parseExpiry(sess.expiry);
  const expMs = parsed === void 0 ? 7 * 864e5 : parsed;
  const expireAt = expMs === null ? null : Date.now() + expMs;
  const created = await store.createShare(
    {
      kind: "file",
      source: sess.source ?? null,
      filename: sess.filename,
      size: sess.size,
      mime: sess.mime,
      r2Key: sess.r2Key,
      maxPickups: sess.maxPickups,
      expireAt
    },
    id
  );
  auditState(c).target = created.code;
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
    const source = await captureSource(c);
    if (!sess.source || source.visitorId !== sess.source.visitorId) throw new UploadPolicyError(403, "upload_session_owner", "\u4E0A\u4F20\u4F1A\u8BDD\u4E0D\u5C5E\u4E8E\u5F53\u524D\u8BBF\u5BA2");
    uploadSessionAudit(c, sess);
    await c.env.BUCKET.resumeMultipartUpload(sess.r2Key, sess.uploadId).abort();
    if (!await c.env.BUCKET.head(sess.r2Key)) await releaseCapacity(c.env, [sess.r2Key]);
    await store.deleteSession(sess.id);
    auditState(c).detail.cancelled = true;
  }
  return c.json({ ok: true });
});

// src/config.ts
async function configResponse(c) {
  c.header("Cache-Control", "no-store");
  return c.json({
    fileBackend: fileMode(c.env) ?? "none",
    metadataBackend: c.env.fileKV ? "kv" : "d1",
    ...await publicUploadPolicy(c),
    maxTextLength: num(c.env.MAX_TEXT_LENGTH, 65536),
    partSize: uploadPartSize(c.env)
  });
}
__name(configResponse, "configResponse");

// src/api.ts
var apiRoutes = new Hono2();
apiRoutes.onError((error, c) => {
  const rejected = policyErrorResponse(c, error) ?? loginProtectionResponse(c, error) ?? securityResponse(c, error);
  if (rejected) return rejected;
  if (error instanceof CapacityError) return c.json({ error: "capacity_exceeded", message: error.message, remainingBytes: error.remainingBytes, capacityBytes: R2_CAPACITY_MAX }, 507);
  console.error("Script API request failed", error);
  return c.json({ error: "internal", message: "\u63A5\u53E3\u6682\u4E0D\u53EF\u7528\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5" }, 503);
});
var jsonLimit = bodyLimit({ maxSize: 1048576, onError: /* @__PURE__ */ __name((c) => c.json({ error: "too_large", message: "JSON \u8BF7\u6C42\u8D85\u8FC7 1 MiB \u4E0A\u9650" }, 413), "onError") });
apiRoutes.use("*", async (c, next) => {
  const jsonRequest = c.req.method === "PATCH" || c.req.method === "POST" && (c.req.path === "/api/v1/shares" || /^\/api\/v1\/uploads\/(init|[^/]+\/complete)$/.test(c.req.path));
  if (jsonRequest) {
    if (!c.req.header("Content-Type")?.startsWith("application/json")) return c.json({ error: "bad_request", message: "\u8BF7\u4F7F\u7528 JSON" }, 415);
    return jsonLimit(c, next);
  }
  await next();
});
apiRoutes.get("/config", configResponse);
apiRoutes.post("/shares", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some((key) => !["text", "expiry", "maxPickups", "displayName", "description"].includes(key)))
    return c.json({ error: "bad_request", message: "\u6587\u672C\u521B\u5EFA\u53C2\u6570\u65E0\u6548\u6216\u542B\u4E0D\u652F\u6301\u7684\u5B57\u6BB5" }, 400);
  return createTextShare(c);
});
apiRoutes.post("/shares/file", createKVFileShare);
apiRoutes.route("/uploads", uploadRoutes);
function view(record) {
  return {
    id: record.id,
    code: record.code,
    kind: record.kind,
    filename: record.filename,
    size: record.size,
    mime: record.mime,
    text: record.text,
    pickupCount: record.pickupCount,
    maxPickups: record.maxPickups,
    expireAt: record.expireAt,
    createdAt: record.createdAt,
    status: shareStatusOf(record.expireAt, record.maxPickups, record.pickupCount, Date.now()),
    pickupUrl: `/pickup?code=${record.code}`,
    downloadUrl: record.kind === "file" ? `/api/v1/shares/${record.code}/download` : null
  };
}
__name(view, "view");
async function reply(c, record) {
  c.header("ETag", await shareVersion(record));
  return c.json(view(record));
}
__name(reply, "reply");
apiRoutes.get("/shares", async (c) => {
  const limit = Number(c.req.query("limit") || 20), offset = Number(c.req.query("offset") || 0);
  const kind = c.req.query("kind") || "all", status = c.req.query("status") || "all", q = (c.req.query("q") || "").trim();
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger(offset) || offset < 0 || q.length > 80 || !["all", "file", "text"].includes(kind) || !["all", "active", "expired", "exhausted"].includes(status))
    return c.json({ error: "bad_request", message: "\u5206\u9875\u6216\u7B5B\u9009\u53C2\u6570\u65E0\u6548" }, 400);
  const filter = {
    q,
    ...kind !== "all" ? { kind } : {},
    ...status !== "all" ? { status } : {}
  };
  const { total, rows } = await getStore(c.env).listShares(limit, offset, filter);
  return c.json({ total, limit, offset, rows: rows.map((r) => ({
    id: r.id,
    code: r.code,
    kind: r.kind,
    filename: r.filename,
    size: r.size,
    textPreview: r.textPreview,
    pickupCount: r.pickupCount,
    maxPickups: r.maxPickups,
    expireAt: r.expireAt,
    createdAt: r.createdAt,
    status: shareStatusOf(r.expireAt, r.maxPickups, r.pickupCount, Date.now())
  })) });
});
apiRoutes.get("/shares/:code", async (c) => {
  const code = c.req.param("code");
  if (!/^\d{6}$/.test(code)) return c.json({ error: "bad_request", message: "\u53D6\u4EF6\u7801\u5FC5\u987B\u4E3A\u516D\u4F4D\u6570\u5B57" }, 400);
  const record = await getStore(c.env).getByCode(code);
  if (!record) return c.json({ error: "not_found", message: "\u5206\u4EAB\u4E0D\u5B58\u5728" }, 404);
  const etag = await shareVersion(record);
  c.header("ETag", etag);
  if (c.req.header("If-None-Match") === etag) return c.body(null, 304);
  return c.json(view(record));
});
apiRoutes.patch("/shares/:code", async (c) => {
  const code = c.req.param("code");
  if (!/^\d{6}$/.test(code)) return c.json({ error: "bad_request", message: "\u53D6\u4EF6\u7801\u5FC5\u987B\u4E3A\u516D\u4F4D\u6570\u5B57" }, 400);
  if (!c.req.header("Content-Type")?.startsWith("application/json")) return c.json({ error: "bad_request", message: "\u8BF7\u4F7F\u7528 JSON" }, 415);
  const store = getStore(c.env), record = await store.getByCode(code);
  if (!record) return c.json({ error: "not_found", message: "\u5206\u4EAB\u4E0D\u5B58\u5728" }, 404);
  const etag = c.req.header("If-Match");
  if (!etag) return c.json({ error: "precondition_required", message: "\u8BF7\u5148\u67E5\u8BE2\u8BE6\u60C5\u5E76\u901A\u8FC7 If-Match \u63D0\u4EA4 ETag" }, 428);
  if (etag !== await shareVersion(record)) return c.json({ error: "precondition_failed", message: "\u5206\u4EAB\u5DF2\u53D8\u66F4\uFF0C\u8BF7\u91CD\u65B0\u8BFB\u53D6\u540E\u4FEE\u6539" }, 412);
  const body = await c.req.json().catch(() => null);
  const allowed = ["filename", "text", "pickupCount", "maxPickups", "expireAt"];
  if (!body || typeof body !== "object" || Array.isArray(body) || !Object.keys(body).length || Object.keys(body).some((k) => !allowed.includes(k)))
    return c.json({ error: "bad_request", message: "\u4FEE\u6539\u5B57\u6BB5\u4E3A\u7A7A\u6216\u5305\u542B\u4E0D\u652F\u6301\u7684\u5B57\u6BB5" }, 400);
  const patch = body;
  const update = {
    filename: record.filename,
    text: record.text,
    size: record.size,
    pickupCount: record.pickupCount,
    maxPickups: record.maxPickups,
    expireAt: record.expireAt
  };
  for (const key of ["pickupCount", "maxPickups", "expireAt"]) if (key in patch) update[key] = patch[key];
  if (!validShareRules(update)) return c.json({ error: "bad_request", message: "\u6B21\u6570\u6216\u8FC7\u671F\u65F6\u95F4\u65E0\u6548" }, 400);
  if ("filename" in patch) {
    if (record.kind !== "file" || typeof patch.filename !== "string" || !patch.filename.trim() || patch.filename.length > 255 || /[\u0000-\u001f\u007f]/.test(patch.filename))
      return c.json({ error: "bad_request", message: "\u4EC5\u6587\u4EF6\u53EF\u4FEE\u6539\u6587\u4EF6\u540D\uFF0C\u957F\u5EA6\u4E3A 1\u2013255 \u5B57\u7B26" }, 400);
    update.filename = patch.filename.trim();
  }
  if ("text" in patch) {
    if (record.kind !== "text" || typeof patch.text !== "string" || !patch.text.trim() || patch.text.length > num(c.env.MAX_TEXT_LENGTH, 65536))
      return c.json({ error: "bad_request", message: "\u6587\u672C\u5185\u5BB9\u6216\u7C7B\u578B\u65E0\u6548" }, 400);
    update.text = patch.text;
    update.size = patch.text.length;
  }
  const cutoff = Date.now() - await getRetentionDays(c.env) * RETENTION_DAY_MS;
  if (record.expireAt !== null && record.expireAt <= cutoff) return c.json({ error: "cleanup_pending", message: "\u5206\u4EAB\u5DF2\u8FDB\u5165\u6E05\u7406\u671F\uFF0C\u4E0D\u80FD\u4FEE\u6539" }, 409);
  if (record.kind === "file") {
    const storage = await inspectFile(c.env, record.r2Key);
    if (storage.state === "missing") return c.json({ error: "gone", message: "\u6587\u4EF6\u5DF2\u88AB\u6E05\u7406" }, 410);
    if (storage.state !== "available") return c.json({ error: "storage_unavailable", message: "\u65E0\u6CD5\u786E\u8BA4\u6587\u4EF6\u72B6\u6001" }, 503);
  }
  const updated = await store.updateShare(code, record, update, cutoff);
  if (!updated) return c.json({ error: "share_conflict", message: "\u8BB0\u5F55\u5DF2\u88AB\u53D6\u4EF6\u6216\u4FEE\u6539\uFF0C\u8BF7\u91CD\u65B0\u8BFB\u53D6\u540E\u63D0\u4EA4" }, 409);
  auditState(c).detail.changedFields = Object.keys(patch).join(",");
  if (["pickupCount", "maxPickups", "expireAt"].some((key) => key in patch)) {
    const rules = /* @__PURE__ */ __name((r) => ({ pickupCount: r.pickupCount, maxPickups: r.maxPickups, expireAt: r.expireAt }), "rules");
    auditState(c).detail.beforeRules = JSON.stringify(rules(record));
    auditState(c).detail.afterRules = JSON.stringify(rules(updated));
  }
  if (updated.kind === "file") auditState(c).detail.filename = (updated.filename || "").slice(0, 160);
  return reply(c, updated);
});
apiRoutes.get("/shares/:code/download", downloadShare);
apiRoutes.delete("/shares/:code", async (c) => {
  const code = c.req.param("code");
  if (!/^\d{6}$/.test(code)) return c.json({ error: "bad_request", message: "\u53D6\u4EF6\u7801\u5FC5\u987B\u4E3A\u516D\u4F4D\u6570\u5B57" }, 400);
  const store = getStore(c.env), record = await store.getByCode(code);
  if (!record) {
    auditState(c).detail.alreadyDeleted = true;
    return c.json({ ok: true, already: true });
  }
  if (record.r2Key && (isKvFileKey(record.r2Key) ? !c.env.fileKV : !c.env.BUCKET))
    return c.json({ error: "storage_unavailable", message: "\u6587\u4EF6\u5B58\u50A8\u7ED1\u5B9A\u4E0D\u53EF\u7528\uFF0C\u672A\u5220\u9664\u5206\u4EAB" }, 503);
  if (record.kind === "file") await deleteFile(c.env, record.r2Key);
  await store.deleteByCode(code);
  if (record.kind === "file") auditState(c).detail.filename = (record.filename || "").slice(0, 160);
  return c.json({ ok: true });
});

// src/api-audit.ts
async function apiAudit(c, next) {
  const start = Date.now();
  await next();
  if (!auditEnabled(c.env)) return;
  const authenticated = !!apiIdentity(c), state = auditState(c), path = c.req.path;
  let action = "apiAuth";
  const item = /^\/api\/v1\/shares\/([^/]+)(?:\/(download))?$/.exec(path);
  if (authenticated) {
    if (c.req.method === "GET" && path === "/api/v1/shares") action = "apiList";
    else if (item) action = item[2] ? "apiDownload" : { GET: "apiRead", HEAD: "apiRead", PATCH: "apiEdit", DELETE: "apiDelete" }[c.req.method] || "";
    else return;
    if (!action) return;
  }
  const protection = c.error instanceof LoginProtectionError ? c.error : null;
  const security = c.error instanceof SecurityError ? c.error : null;
  const detail = { ...state.detail };
  if (protection?.retryAt) detail.bannedUntil = protection.retryAt;
  if (security) detail.reason = security.reason;
  if (protection?.newBan) {
    action = "ban";
    detail.scope = "login";
  }
  const bounded2 = /* @__PURE__ */ __name((v, n = 80) => typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, n) : "", "bounded");
  const cf = c.req.raw.cf, status = c.res.status;
  const entry = {
    id: crypto.randomUUID(),
    at: start,
    category: authenticated ? "operation" : "security",
    action,
    result: [403, 429].includes(status) ? "blocked" : status < 400 ? "success" : "failed",
    actor: authenticated ? "token" : "anonymous",
    ip: loginIP(c),
    country: bounded2(cf?.country, 2),
    region: bounded2(cf?.region),
    city: bounded2(cf?.city),
    method: c.req.method,
    status,
    target: authenticated && item && /^\d{6}$/.test(item[1]) ? item[1] : "",
    agent: bounded2(c.req.header("User-Agent"), 200),
    durationMs: Math.max(0, Date.now() - start),
    detail
  };
  if (!await appendAudit(c.env, entry, !authenticated && !protection?.newBan)) c.header("X-Audit-Status", "unavailable");
}
__name(apiAudit, "apiAudit");

// src/security-middleware.ts
async function publicSecurity(c, next) {
  const path = transferPath(c.req.path, c.req.method), method = c.req.method;
  const upload = path.startsWith("/api/uploads/") || path === "/api/shares/file" || path === "/api/shares/text";
  const pickup = path === "/api/pickup" || /^\/api\/pickup\/[^/]+\/download$/.test(path);
  if (!upload && !pickup)
    return next();
  if (upload && path.endsWith("/abort"))
    return next();
  const scope = upload ? "upload" : "pickup", ip = loginIP(c);
  const country = typeof c.req.raw.cf?.country === "string" ? c.req.raw.cf.country : "";
  const region = typeof c.req.raw.cf?.regionCode === "string" ? c.req.raw.cf.regionCode : "";
  const count = upload && method === "POST" && ["/api/uploads/init", "/api/shares/file", "/api/shares/text"].includes(path);
  const reject = /* @__PURE__ */ __name(async (error) => {
    if (!(error instanceof SecurityError))
      throw error;
    publicRejection(c, error);
    return securityResponse(c, error);
  }, "reject");
  try {
    await enforceSecurity(c.env, ip, scope, country, region, count);
  } catch (error) {
    return reject(error);
  }
  await next();
  if (pickup && [400, 404].includes(c.res.status) && ["POST", "GET", "HEAD"].includes(method)) {
    try {
      await enforceSecurity(c.env, ip, scope, country, region, true);
    } catch (error) {
      c.res = await reject(error);
    }
  }
}
__name(publicSecurity, "publicSecurity");

// src/index.ts
var app = new Hono2();
app.onError((error, c) => {
  const rejection = policyErrorResponse(c, error) ?? loginProtectionResponse(c, error) ?? securityResponse(c, error);
  if (rejection) return rejection;
  console.error("Request failed", error);
  return c.json({ error: "internal", message: "\u670D\u52A1\u6682\u4E0D\u53EF\u7528\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5" }, 500);
});
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
app.use("/api/*", publicAudit);
app.use("/api/v1/*", apiAudit);
app.use("/api/v1/*", requireApiToken);
app.use("/api/*", async (c, next) => {
  if (!c.env.DB && !c.env.fileKV) {
    return c.json({ error: "config", message: "\u672A\u7ED1\u5B9A\u5143\u6570\u636E\u5E93:\u8BF7\u5728 wrangler.jsonc \u914D\u7F6E KV \u6216 D1(\u4E8C\u9009\u4E00)" }, 500);
  }
  await next();
});
app.use("/api/*", publicSecurity);
app.get("/api/health", (c) => c.json({ ok: true }));
app.get("/", (c, next) => {
  c.executionCtx.waitUntil(cleanupIfDue(c.env));
  return next();
});
app.get("/api/config", configResponse);
app.route("/api/v1", apiRoutes);
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
