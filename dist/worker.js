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
`, "admin.html": `<!doctype html>\r
<html lang="zh-CN">\r
<head>\r
<meta charset="utf-8">\r
<meta name="viewport" content="width=device-width, initial-scale=1">\r
<meta name="description" content="\u6587\u4EF6\u4E2D\u8F6C\u7AD9\u7BA1\u7406\u540E\u53F0">\r
<meta name="robots" content="noindex">\r
<meta name="theme-color" content="#efe8d8">\r
<title data-i18n="doc.admin">\u6587\u4EF6\u4E2D\u8F6C\u7AD9 - \u7BA1\u7406</title>\r
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>\u{1F4E6}</text></svg>">\r
<link rel="stylesheet" href="/style.css">\r
<script>\r
  document.documentElement.dataset.theme =\r
    localStorage.getItem('theme') ||\r
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');\r
<\/script>\r
</head>\r
<body>\r
<header class="topbar wide">\r
  <div class="brand">\r
    <span class="logo">\u{1F4E6}</span>\r
    <div><b data-i18n="brand.name">\u6587\u4EF6\u4E2D\u8F6C\u7AD9</b><small data-i18n="brand.admin">\u7BA1\u7406\u540E\u53F0</small></div>\r
  </div>\r
  <div class="actions">\r
    <button id="lang-btn" class="icon-btn lang-btn" data-i18n-title="nav.lang">EN</button>\r
    <button id="theme-btn" class="icon-btn" data-i18n-title="nav.theme">\u{1F317}</button>\r
    <a class="btn ghost small" href="/" target="_blank" rel="noopener noreferrer" data-i18n="nav.send">\u53D1\u9001</a>\r
  </div>\r
</header>\r
\r
<main class="container wide">\r
  <section class="card center" id="admin-login" hidden>\r
    <h2 class="title" data-i18n="ad.loginTitle">\u7BA1\u7406\u767B\u5F55</h2>\r
    <p class="muted" style="margin:0" data-i18n="ad.loginSub">\u8F93\u5165\u90E8\u7F72\u65F6\u8BBE\u7F6E\u7684\u7BA1\u7406\u4EE4\u724C(ADMIN_TOKEN)</p>\r
    <input id="admin-token" class="token-input" type="password" data-i18n-ph="ad.tokenPh" placeholder="\u7BA1\u7406\u4EE4\u724C" autocomplete="current-password">\r
    <button id="btn-login" class="btn primary block" data-i18n="ad.login">\u767B\u5F55</button>\r
    <div id="login-error" class="error-box" hidden></div>\r
  </section>\r
\r
  <section id="admin-panel" hidden>\r
    <nav class="admin-nav" aria-label="\u7BA1\u7406\u9875\u9762" data-i18n-aria="audit.navigation">\r
      <button id="admin-files-tab" class="btn small" type="button" aria-pressed="true" data-i18n="audit.files">\u6587\u4EF6\u7BA1\u7406</button>\r
      <button id="admin-audit-tab" class="btn small ghost" type="button" aria-pressed="false" data-i18n="audit.title">\u65E5\u5FD7\u5BA1\u8BA1</button>\r
    </nav>\r
    <p id="audit-write-warning" class="error-box" hidden role="alert" data-i18n="audit.writeFailed">\u64CD\u4F5C\u5DF2\u5904\u7406\uFF0C\u4F46\u5BA1\u8BA1\u8BB0\u5F55\u672A\u4FDD\u5B58\uFF0C\u8BF7\u68C0\u67E5\u65E5\u5FD7\u5B58\u50A8\u3002</p>\r
    <div id="admin-files-view">\r
    <div class="stats-row" id="stats-row"></div>\r
    <div class="card" style="padding:14px">\r
      <div class="retention-settings">\r
        <form id="retention-form">\r
          <label for="retention-days" data-i18n="ad.retentionDays">\u8FC7\u671F\u540E\u4FDD\u7559</label>\r
          <input id="retention-days" type="number" min="0" max="3650" step="1" required disabled>\r
          <span data-i18n="ad.days">\u5929</span>\r
          <button id="retention-save" class="btn small" type="submit" disabled data-i18n="ad.save">\u4FDD\u5B58</button>\r
        </form>\r
        <p id="retention-error" class="error-box" hidden role="alert"></p>\r
        <button id="retention-retry" class="btn small ghost" type="button" hidden data-i18n="ad.retry">\u91CD\u8BD5</button>\r
      </div>\r
      <details class="guest-settings">\r
        <summary data-i18n="ad.guestLimits">\u672A\u5907\u6CE8\u8BBF\u5BA2\u9650\u5236</summary>\r
        <form id="guest-policy-form">\r
          <label><span data-i18n="ad.weeklyFiles">\u6BCF\u5468\u6587\u4EF6\u6570</span><input id="guest-weekly" type="number" min="0" max="1000" step="1" required disabled></label>\r
          <button id="guest-save" class="btn small" type="submit" disabled data-i18n="ad.save">\u4FDD\u5B58</button>\r
        </form>\r
        <small class="muted" data-i18n="ad.guestRules">\u5317\u4EAC\u65F6\u95F4\u5468\u4E00\u91CD\u7F6E\uFF1B\u5DF2\u63A5\u7EB3\u4E0A\u4F20\u8BA1\u6B21\uFF0C\u53D6\u6D88\u4E0D\u9000\u56DE\u3002\u672A\u5907\u6CE8\u8BBF\u5BA2\u4E0D\u80FD\u6C38\u4E45\u5206\u4EAB\u6216\u4E0D\u9650\u6B21\u53D6\u4EF6\u3002</small>\r
        <p id="guest-error" class="error-box" hidden role="alert"></p>\r
        <button id="guest-retry" class="btn small ghost" type="button" hidden data-i18n="ad.retry">\u91CD\u8BD5</button>\r
      </details>\r
      <details class="guest-settings" id="login-protection">\r
        <summary data-i18n="ad.loginProtection">\u767B\u5F55\u9632\u62A4</summary>\r
        <div class="login-guard-heading">\r
          <small class="muted" id="login-guard-status" role="status"></small>\r
          <button id="login-guard-refresh" class="btn small ghost" type="button" data-i18n="ad.refresh">\u21BB \u5237\u65B0</button>\r
        </div>\r
        <p id="login-guard-error" class="error-box" hidden role="alert"></p>\r
        <div id="login-guard-bans" class="login-guard-bans"></div>\r
      </details>\r
      <div class="table-wrap">\r
        <table>\r
          <thead>\r
            <tr>\r
              <th data-i18n="ad.th.code">\u53E3\u4EE4</th><th data-i18n="ad.th.content">\u5185\u5BB9</th><th data-i18n="ad.source">\u4E0A\u4F20\u6765\u6E90</th><th data-i18n="ad.th.size">\u5927\u5C0F</th>\r
              <th data-i18n="ad.th.pickups">\u5DF2\u53D6/\u4E0A\u9650</th><th data-i18n="ad.th.expire">\u8FC7\u671F\u65F6\u95F4</th><th data-i18n="ad.th.status">\u72B6\u6001</th><th data-i18n="ad.th.created">\u521B\u5EFA\u65F6\u95F4</th><th></th>\r
            </tr>\r
          </thead>\r
          <tbody id="shares-body"></tbody>\r
        </table>\r
      </div>\r
      <div class="row-between admin-pager">\r
        <div class="pager-btns">\r
          <button id="btn-prev" class="btn small" disabled data-i18n="ad.prev">\u4E0A\u4E00\u9875</button>\r
          <button id="btn-next" class="btn small" disabled data-i18n="ad.next">\u4E0B\u4E00\u9875</button>\r
        </div>\r
        <small class="muted" id="page-info"></small>\r
        <button id="btn-refresh" class="btn small ghost" data-i18n="ad.refresh">\u21BB \u5237\u65B0</button>\r
      </div>\r
      <div class="admin-foot">\r
        <button id="btn-logout" class="btn ghost small" data-i18n="ad.logout">\u9000\u51FA\u767B\u5F55</button>\r
      </div>\r
    </div>\r
    </div>\r
    <section id="admin-audit-view" class="card audit-card" hidden aria-labelledby="audit-title">\r
      <div class="audit-heading">\r
        <div><h2 id="audit-title" data-i18n="audit.title">\u65E5\u5FD7\u5BA1\u8BA1</h2><small class="muted" data-i18n="audit.retention">\u6700\u8FD1 30 \u5929\uFF0C\u6700\u591A 1,000 \u6761\uFF1B\u65F6\u95F4\u6309\u672C\u5730\u65F6\u533A\u663E\u793A</small></div>\r
        <div class="audit-actions"><button id="audit-export" class="btn small ghost" type="button" data-i18n="audit.export">\u5BFC\u51FA\u7B5B\u9009\u7ED3\u679C</button><button id="audit-refresh" class="btn small" type="button" data-i18n="ad.refresh">\u21BB \u5237\u65B0</button></div>\r
      </div>\r
      <div class="audit-categories" role="group" aria-label="\u65E5\u5FD7\u5206\u7C7B" data-i18n-aria="audit.categories">\r
        <button type="button" data-category="all" aria-pressed="true" data-i18n="audit.all">\u5168\u90E8\u65E5\u5FD7</button>\r
        <button type="button" data-category="login" aria-pressed="false" data-i18n="audit.login">\u767B\u5F55\u65E5\u5FD7</button>\r
        <button type="button" data-category="operation" aria-pressed="false" data-i18n="audit.operation">\u64CD\u4F5C\u65E5\u5FD7</button>\r
        <button type="button" data-category="security" aria-pressed="false" data-i18n="audit.security">\u5B89\u5168\u4E8B\u4EF6</button>\r
      </div>\r
      <form id="audit-filter" class="audit-filter">\r
        <label><span data-i18n="audit.result">\u7ED3\u679C</span><select id="audit-result"><option value="all" data-i18n="audit.anyResult">\u5168\u90E8\u7ED3\u679C</option><option value="success" data-i18n="audit.success">\u6210\u529F</option><option value="failed" data-i18n="audit.failed">\u5931\u8D25</option><option value="blocked" data-i18n="audit.blocked">\u5DF2\u62E6\u622A</option></select></label>\r
        <label><span data-i18n="audit.from">\u5F00\u59CB\u65E5\u671F</span><input id="audit-from" type="date"></label>\r
        <label><span data-i18n="audit.to">\u7ED3\u675F\u65E5\u671F</span><input id="audit-to" type="date"></label>\r
        <label class="audit-search"><span data-i18n="audit.keyword">IP / \u64CD\u4F5C\u5BF9\u8C61</span><input id="audit-q" type="search" maxlength="80" placeholder="\u641C\u7D22 IP \u6216\u53D6\u4EF6\u7801" data-i18n-ph="audit.search"></label>\r
        <div class="audit-actions"><button class="btn small primary" type="submit" data-i18n="audit.filter">\u7B5B\u9009</button><button id="audit-reset" class="btn small ghost" type="button" data-i18n="audit.reset">\u91CD\u7F6E</button></div>\r
      </form>\r
      <p id="audit-error" class="error-box" role="alert" hidden></p>\r
      <p id="audit-state" class="muted" role="status"></p>\r
      <div class="table-wrap audit-table-wrap"><table class="audit-table">\r
        <thead><tr><th data-i18n="audit.time">\u65F6\u95F4</th><th data-i18n="audit.action">\u64CD\u4F5C</th><th data-i18n="audit.result">\u7ED3\u679C</th><th data-i18n="audit.actor">\u64CD\u4F5C\u8EAB\u4EFD</th><th data-i18n="audit.source">\u6765\u6E90 IP / \u5C5E\u5730</th><th data-i18n="audit.target">\u64CD\u4F5C\u5BF9\u8C61</th><th data-i18n="audit.details">\u8BE6\u60C5</th></tr></thead>\r
        <tbody id="audit-body"></tbody>\r
      </table></div>\r
      <div class="row-between audit-pager"><button id="audit-prev" class="btn small" type="button" disabled data-i18n="ad.prev">\u4E0A\u4E00\u9875</button><small id="audit-page" class="muted" role="status"></small><button id="audit-next" class="btn small" type="button" disabled data-i18n="ad.next">\u4E0B\u4E00\u9875</button></div>\r
    </section>\r
  </section>\r
</main>\r
\r
<!-- \u4F5C\u5E9F\u786E\u8BA4\u5F39\u7A97:\u7968\u636E\u98CE,\u66FF\u4EE3\u539F\u751F confirm(ESC / \u70B9\u906E\u7F69 = \u53D6\u6D88) -->\r
<div class="modal-mask" id="del-mask" hidden>\r
  <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="del-title">\r
    <h3 class="modal-title" id="del-title" data-i18n="ad.delTitle">\u4F5C\u5E9F\u8FD9\u5F20\u53D6\u4EF6\u51ED\u8BC1?</h3>\r
    <div class="del-target" id="del-target"></div>\r
    <p class="del-warn" data-i18n="ad.delWarn">\u4F5C\u5E9F\u540E\u53E3\u4EE4\u7ACB\u5373\u5931\u6548,\u5BF9\u65B9\u5C06\u65E0\u6CD5\u53D6\u4EF6,\u4E14\u4E0D\u53EF\u6062\u590D\u3002</p>\r
    <div class="modal-actions">\r
      <button id="del-cancel" class="btn" data-i18n="btn.cancel">\u53D6\u6D88</button>\r
      <button id="del-ok" class="btn danger" data-i18n="ad.delOk">\u786E\u8BA4\u4F5C\u5E9F</button>\r
    </div>\r
  </div>\r
</div>\r
\r
<dialog id="source-dialog" class="source-dialog" aria-labelledby="source-title">\r
  <div class="source-heading">\r
    <h3 id="source-title" tabindex="-1" autofocus data-i18n="ad.source">\u4E0A\u4F20\u6765\u6E90</h3>\r
    <small id="source-context" class="muted mono"></small>\r
  </div>\r
  <div class="source-body">\r
    <div id="source-detail" aria-live="polite"></div>\r
    <form id="source-form" hidden>\r
      <label for="source-note" data-i18n="ad.sourceNote">\u7BA1\u7406\u5458\u5907\u6CE8</label>\r
      <input id="source-note" type="text" maxlength="64" autocomplete="off">\r
      <small class="muted" data-i18n="ad.notePrivileges">\u5907\u6CE8\u540E\u514D\u9664\u8BBF\u5BA2\u4E0A\u4F20\u9650\u5236\uFF0C\u5E76\u5141\u8BB8\u6C38\u4E45\u3001\u4E0D\u9650\u6B21\u5206\u4EAB\uFF1B\u6E05\u7A7A\u5907\u6CE8\u6062\u590D\u9650\u5236\u3002</small>\r
      <p class="error-box" id="source-error" hidden role="alert"></p>\r
    </form>\r
  </div>\r
  <div class="source-footer">\r
    <button id="source-close" class="btn ghost" type="button" data-i18n="ad.sourceClose">\u5173\u95ED</button>\r
    <button id="source-save" class="btn primary" type="submit" form="source-form" hidden data-i18n="ad.sourceSave">\u4FDD\u5B58\u5907\u6CE8</button>\r
  </div>\r
</dialog>\r
<dialog id="file-dialog" class="source-dialog" aria-labelledby="file-title">\r
  <div class="source-heading">\r
    <h3 id="file-title" tabindex="-1" autofocus data-i18n="ad.fileDetails">\u6587\u4EF6\u8BE6\u60C5</h3>\r
    <small id="file-context" class="muted mono"></small>\r
  </div>\r
  <div class="source-body">\r
    <div id="file-detail" class="file-detail-grid" aria-live="polite"></div>\r
  </div>\r
  <div class="source-footer">\r
    <button id="file-close" class="btn ghost" type="button" data-i18n="ad.sourceClose">\u5173\u95ED</button>\r
    <a id="file-download" class="btn primary" target="_blank" rel="noopener noreferrer" hidden data-i18n="ad.download">\u4E0B\u8F7D</a>\r
  </div>\r
</dialog>\r
<dialog id="audit-dialog" class="source-dialog" aria-labelledby="audit-detail-title">\r
  <div class="source-heading"><h3 id="audit-detail-title" tabindex="-1" autofocus data-i18n="audit.details">\u65E5\u5FD7\u8BE6\u60C5</h3></div>\r
  <div class="source-body"><div id="audit-detail" class="file-detail-grid"></div></div>\r
  <div class="source-footer"><button id="audit-close" class="btn ghost" type="button" data-i18n="ad.sourceClose">\u5173\u95ED</button></div>\r
</dialog>\r
<script type="module" src="/js/admin.js"><\/script>\r
</body>\r
</html>\r
`, "index.html": `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="\u5206\u4EAB\u6587\u4EF6\u6216\u6587\u672C\uFF0C\u751F\u6210 6 \u4F4D\u53D6\u4EF6\u53E3\u4EE4\u3002\u652F\u6301\u94FE\u63A5\u548C\u626B\u7801\u53D6\u4EF6\uFF0C\u53EF\u8BBE\u7F6E\u6709\u6548\u671F\u4E0E\u53EF\u53D6\u6B21\u6570\u3002">
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
    <div class="flow-step"><span class="flow-dot">\u{1F4E6}</span><div class="flow-tt"><b data-i18n="flow.dropT">\u5BC4\u4EF6</b><small data-i18n="flow.dropS">\u9009\u62E9\u6587\u4EF6\u6216\u8F93\u5165\u6587\u672C</small></div></div>
    <div class="flow-link"></div>
    <div class="flow-step"><span class="flow-dot">\u{1F3AB}</span><div class="flow-tt"><b data-i18n="flow.tickT">\u5206\u4EAB\u53E3\u4EE4</b><small data-i18n="flow.tickS">\u751F\u6210 6 \u4F4D\u53D6\u4EF6\u53E3\u4EE4</small></div></div>
    <div class="flow-link"></div>
    <div class="flow-step"><span class="flow-dot">\u{1F4E5}</span><div class="flow-tt"><b data-i18n="flow.pickT">\u53D6\u4EF6</b><small data-i18n="flow.pickS">\u8F93\u5165\u53E3\u4EE4\u5373\u53EF\u4E0B\u8F7D\u6216\u67E5\u770B</small></div></div>
  </section>
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
          <button type="button" data-v="forever" data-i18n="seg.forever" disabled>\u6C38\u4E45</button>
        </div>
      </div>
      <div class="opt-group">
        <label data-i18n="opt.pickups">\u53EF\u53D6\u6B21\u6570</label>
        <div class="seg" id="seg-pickups">
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
  <section class="feat-band">
    <div class="feat"><span class="feat-ic">\u{1F9E9}</span><div><b data-i18n="feat.splitT">\u6587\u4EF6\u5206\u4EAB</b><small data-i18n="feat.splitS">\u9009\u62E9\u6587\u4EF6\u540E\u5F00\u59CB\u5206\u4EAB</small></div></div>
    <div class="feat"><span class="feat-ic">\u23F3</span><div><b data-i18n="feat.ttlT">\u81EA\u9009\u6709\u6548\u671F</b><small data-i18n="feat.ttlS">1 ~ 30 \u5929\u6216\u6C38\u4E45</small></div></div>
    <div class="feat"><span class="feat-ic">\u{1F522}</span><div><b data-i18n="feat.limitT">\u9650\u6B21\u53D6\u4EF6</b><small data-i18n="feat.limitS">1 \u6B21 \xB7 5 \u6B21 \xB7 \u4E0D\u9650</small></div></div>
    <div class="feat"><span class="feat-ic">\u{1F512}</span><div><b data-i18n="feat.selfT">\u4FBF\u6377\u53D6\u4EF6</b><small data-i18n="feat.selfS">\u652F\u6301\u53E3\u4EE4\u3001\u94FE\u63A5\u548C\u626B\u7801\u53D6\u4EF6</small></div></div>
  </section>
</main>

<footer class="foot" data-i18n="foot">\u89C1\u5B57\u5982\u9762</footer>

<script src="/js/vendor/qrcode.js"><\/script>
<script type="module" src="/js/index.js"><\/script>
</body>
</html>
`, "js/admin-audit.js": "import { $, api, el, fmtDate } from './common.js';\nimport { t, LANG, onLangChange } from './i18n.js';\n\nexport function initAudit() {\n  const view = $('#admin-audit-view');\n  const body = $('#audit-body');\n  const dialog = $('#audit-dialog');\n  let category = 'all', offset = 0, total = 0, request = 0;\n  let filters = {}, rows = [], available = false;\n  const limit = 20;\n  const action = row => t(`audit.action.${row.action}`);\n  const actor = row => t(`audit.actor.${row.actor}`);\n  const ip = row => row.ip === 'unknown' ? t('ad.sourceUnknown') : row.ip;\n  function place(row) {\n    let country = row.country;\n    if (/^[A-Z]{2}$/.test(country)) country = new Intl.DisplayNames([LANG === 'zh' ? 'zh-CN' : 'en'], { type: 'region' }).of(country);\n    return [...new Set([country, row.region, row.city].filter(Boolean))].join(' \xB7 ') || t('ad.sourceUnknown');\n  }\n  function close() { dialog.close(); $('#audit-detail').replaceChildren(); }\n  function details(row) {\n    const fields = [\n      [t('audit.time'), fmtDate(row.at)], [t('audit.action'), action(row)],\n      [t('audit.result'), t(`audit.${row.result}`)], [t('audit.actor'), actor(row)],\n      ['IP', ip(row)], [t('ad.sourceLocation'), place(row)],\n      [t('audit.target'), row.target || '\u2014'], [t('audit.http'), `${row.method} \xB7 ${row.status}`],\n      [t('audit.duration'), `${row.durationMs} ms`], [t('audit.id'), row.id],\n      [t('audit.agent'), row.agent || '\u2014'],\n    ];\n    for (const [key, value] of Object.entries(row.detail)) {\n      fields.push([t(`audit.detail.${key}`), key === 'bannedUntil' ? fmtDate(value)\n        : typeof value === 'boolean' ? t(value ? 'audit.yes' : 'audit.no') : String(value)]);\n    }\n    if (row.action === 'download') fields.push([t('audit.description'), t('audit.downloadHint')]);\n    $('#audit-detail').replaceChildren(...fields.map(([label, value]) => el('div', { class: 'file-field' }, el('small', { class: 'muted' }, label), el('span', {}, value))));\n    dialog.showModal();\n  }\n  function render() {\n    body.replaceChildren(...rows.map(row => el('tr', {},\n      el('td', {}, fmtDate(row.at)),\n      el('td', {}, el('span', {}, action(row)), el('small', { class: 'muted' }, t(`audit.${row.category}`))),\n      el('td', {}, el('span', { class: `audit-result audit-${row.result}` }, t(`audit.${row.result}`))),\n      el('td', { class: 'audit-actor' }, el('small', { class: 'audit-mobile-label muted' }, t('audit.actor')), actor(row)),\n      el('td', { class: 'audit-source' }, el('span', { class: 'mono' }, ip(row)),\n        row.country || row.region || row.city ? el('small', { class: 'muted' }, place(row)) : null),\n      el('td', { class: 'audit-target' }, el('small', { class: 'audit-mobile-label muted' }, t('audit.target')), row.target || '\u2014'),\n      el('td', {}, el('button', { type: 'button', class: 'btn small ghost', onclick: () => details(row) }, t('audit.details'))),\n    )));\n    $('#audit-page').textContent = t('audit.page', Math.floor(offset / limit) + 1, Math.max(1, Math.ceil(total / limit)), total);\n    $('#audit-prev').disabled = offset === 0;\n    $('#audit-next').disabled = offset + limit >= total;\n  }\n  async function load() {\n    const ticket = ++request;\n    available = false;\n    $('#audit-error').hidden = true;\n    $('#audit-state').textContent = t('ad.loading');\n    $('#audit-page').textContent = '';\n    body.replaceChildren();\n    for (const id of ['audit-prev', 'audit-next', 'audit-export', 'audit-refresh']) $('#' + id).disabled = true;\n    try {\n      const params = new URLSearchParams({ ...filters, category, offset, limit });\n      const data = await api(`/api/admin/audit-logs?${params}`);\n      if (ticket !== request || view.hidden) return;\n      if (typeof data.enabled !== 'boolean' || !Array.isArray(data.rows) || !Number.isSafeInteger(data.total)) throw new Error(t('ad.loadFail'));\n      available = data.enabled;\n      rows = data.rows; total = data.total;\n      if (available && offset > 0 && offset >= total) { offset = Math.max(0, Math.ceil(total / limit) - 1) * limit; return load(); }\n      $('#audit-state').textContent = !available ? t('audit.disabled') : !total ? t('audit.empty') : '';\n      render();\n      $('#audit-export').disabled = !available || total === 0;\n    } catch (e) {\n      if (ticket !== request || view.hidden) return;\n      $('#audit-state').textContent = '';\n      $('#audit-error').textContent = e.message || t('ad.loadFail');\n      $('#audit-error').hidden = false;\n    } finally { if (ticket === request) $('#audit-refresh').disabled = false; }\n  }\n  function selectView(audit) {\n    view.hidden = !audit;\n    $('#admin-files-view').hidden = audit;\n    for (const [id, active] of [['admin-files-tab', !audit], ['admin-audit-tab', audit]]) {\n      $('#' + id).setAttribute('aria-pressed', String(active));\n      $('#' + id).classList.toggle('ghost', !active);\n    }\n    if (audit) load(); else { request++; close(); }\n  }\n  $('#admin-files-tab').addEventListener('click', () => selectView(false));\n  $('#admin-audit-tab').addEventListener('click', () => selectView(true));\n  $('#audit-filter').addEventListener('submit', e => {\n    e.preventDefault();\n    const from = $('#audit-from').value, to = $('#audit-to').value;\n    if (from && to && from > to) {\n      $('#audit-error').textContent = t('audit.dateError'); $('#audit-error').hidden = false; return;\n    }\n    filters = { result: $('#audit-result').value, q: $('#audit-q').value.trim() };\n    if (from) filters.from = new Date(`${from}T00:00:00`).getTime();\n    if (to) { const end = new Date(`${to}T00:00:00`); end.setDate(end.getDate() + 1); filters.to = end.getTime() - 1; }\n    offset = 0; load();\n  });\n  $('#audit-reset').addEventListener('click', () => { $('#audit-filter').reset(); filters = {}; offset = 0; load(); });\n  for (const button of document.querySelectorAll('.audit-categories button')) button.addEventListener('click', () => {\n    category = button.dataset.category; offset = 0;\n    for (const item of document.querySelectorAll('.audit-categories button')) item.setAttribute('aria-pressed', String(item === button));\n    load();\n  });\n  $('#audit-prev').addEventListener('click', () => { offset = Math.max(0, offset - limit); load(); });\n  $('#audit-next').addEventListener('click', () => { offset += limit; load(); });\n  $('#audit-refresh').addEventListener('click', load);\n  $('#audit-export').addEventListener('click', async () => {\n    $('#audit-export').disabled = true;\n    $('#audit-error').hidden = true;\n    const exportFilters = { ...filters, category };\n    try {\n      const params = new URLSearchParams({ ...exportFilters, offset: 0, limit: 1000 });\n      const data = await api(`/api/admin/audit-logs/export?${params}`);\n      const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), filters: exportFilters, ...data }, null, 2)], { type: 'application/json' });\n      const url = URL.createObjectURL(blob);\n      const link = el('a', { href: url, download: `audit-${new Date().toISOString().slice(0, 10)}.json` });\n      document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);\n    } catch (e) { $('#audit-error').textContent = e.message || t('ad.loadFail'); $('#audit-error').hidden = false; }\n    finally { $('#audit-export').disabled = !available || total === 0; }\n  });\n  $('#audit-close').addEventListener('click', close);\n  dialog.addEventListener('cancel', e => { e.preventDefault(); close(); });\n  window.addEventListener('audit-write-failed', () => { $('#audit-write-warning').hidden = false; });\n  onLangChange(() => { close(); if (!view.hidden) load(); });\n}\n", "js/admin.js": "import { $, api, fmtBytes, fmtDate, fmtDuration, toast, initTheme, el } from './common.js';\r\nimport { LANG, t, onLangChange, initI18n } from './i18n.js';\r\nimport { initAudit } from './admin-audit.js';\r\n\r\ninitTheme();\r\ninitI18n();\r\ninitAudit();\r\n\r\nconst loginCard = $('#admin-login');\r\nconst panel = $('#admin-panel');\r\nconst loginError = $('#login-error');\r\nconst tokenInput = $('#admin-token');\r\nconst statsRow = $('#stats-row');\r\nconst tbody = $('#shares-body');\r\nconst btnPrev = $('#btn-prev');\r\nconst btnNext = $('#btn-next');\r\nconst btnRefresh = $('#btn-refresh');\r\nconst pageInfo = $('#page-info');\r\n\r\nconst LIMIT = 20; // \u6BCF\u9875\u884C\u6570:\u540E\u7AEF\u5217\u8868\u4F1A\u9010\u884C\u9A8C\u6D3B(\u8BFB KV),\u9875\u5C0F\u4E00\u70B9\u7701 subrequest\r\nlet offset = 0;\r\nlet total = 0;\r\n\r\n/* \u8BED\u8A00\u5207\u6362:\u9762\u677F\u53EF\u89C1\u65F6\u6309\u65B0\u8BED\u8A00\u91CD\u62C9\u6587\u6848 */\r\nonLangChange(() => {\r\n  if ($('#source-dialog').open) closeSource();\r\n  if ($('#file-dialog').open) closeFileDetails();\r\n  if (!panel.hidden) {\r\n    loadStats();\r\n    loadList();\r\n    loadLoginProtection();\r\n  }\r\n});\r\n\r\n/* ---------- \u767B\u5F55\u6001\u63A2\u6D4B:stats \u901A\u5219\u89C6\u4E3A\u5DF2\u767B\u5F55 ---------- */\r\n(async () => {\r\n  try {\r\n    await api('/api/admin/stats');\r\n    showPanel();\r\n  } catch {\r\n    loginCard.hidden = false;\r\n    tokenInput.focus();\r\n  }\r\n})();\r\n\r\nasync function login() {\r\n  const token = tokenInput.value.trim();\r\n  if (!token || $('#btn-login').disabled) return;\r\n  $('#btn-login').disabled = true;\r\n  loginError.hidden = true;\r\n  try {\r\n    await api('/api/admin/login', { method: 'POST', body: { token } });\r\n    showPanel();\r\n  } catch (e) {\r\n    loginError.textContent = e.code === 'login_blocked' ? t('ad.loginBlocked')\r\n      : e.code === 'login_protection_unavailable' ? t('ad.guardUnavailable') : e.message || t('ad.badToken');\r\n    loginError.hidden = false;\r\n  } finally { $('#btn-login').disabled = false; }\r\n}\r\n$('#btn-login').addEventListener('click', login);\r\ntokenInput.addEventListener('keydown', (e) => e.key === 'Enter' && login());\r\n\r\nfunction showPanel() {\r\n  loginCard.hidden = true;\r\n  panel.hidden = false;\r\n  loadStats();\r\n  loadList();\r\n  loadSettings();\r\n  loadGuestPolicy();\r\n  loadLoginProtection();\r\n}\r\n\r\n$('#btn-logout').addEventListener('click', async () => {\r\n  try { await api('/api/admin/logout', { method: 'POST', body: {} }); } catch { /* ignore */ }\r\n  location.reload();\r\n});\r\n\r\n/* ---------- \u7EDF\u8BA1 ---------- */\r\nlet lastStats = null; // \u5220\u9664\u540E\u672C\u5730\u9012\u51CF\u7528,\u907F\u514D\u7ACB\u5373\u91CD\u62C9\u649E\u4E0A KV \u6700\u7EC8\u4E00\u81F4\u7A97\u53E3\r\n\r\nfunction renderStats(s) {\r\n  const counts = [\r\n    [s.total, 'ad.total'], [s.active, 'ad.active'], [s.files, 'ad.files'],\r\n    [s.texts, 'ad.texts'], [s.todayCreated, 'ad.today'],\r\n  ];\r\n  const capacity = s.fileBackend === 'r2' ? s.storage : null;\r\n  const storageCard = el('div', { class: 'stat-card storage-card' },\r\n    el('small', {}, t(s.fileBackend === 'r2' ? 'ad.storage' : 'ad.shareBytes')),\r\n    capacity\r\n      ? el('div', { class: 'storage-value' },\r\n          el('b', {}, fmtBytes(capacity.usedBytes)),\r\n          el('span', { class: 'storage-total' }, ` / ${fmtBytes(capacity.capacityBytes)}`))\r\n      : el('div', { class: 'storage-value' }, el('b', {}, s.fileBackend === 'r2'\r\n          ? t('ad.storageUnavailable') : fmtBytes(s.totalBytes))),\r\n  );\r\n  if (capacity) {\r\n    const ratio = Math.min(1, Math.max(0, capacity.usedBytes / capacity.capacityBytes));\r\n    storageCard.append(\r\n      el('meter', { class: 'storage-meter', min: 0, max: capacity.capacityBytes,\r\n        value: capacity.usedBytes, ariaLabel: t('ad.storage') }),\r\n      el('div', { class: 'storage-caption' },\r\n        el('small', {}, t('ad.storageReserved')), el('small', {}, `${Math.round(ratio * 100)}%`)),\r\n    );\r\n  }\r\n  statsRow.replaceChildren(\r\n    el('div', { class: 'stats-counts' }, ...counts.map(([value, label]) =>\r\n      el('div', { class: 'stat-card' }, el('b', {}, String(value)), el('small', {}, t(label))))),\r\n    storageCard,\r\n  );\r\n}\r\n\r\nasync function loadStats() {\r\n  try {\r\n    lastStats = await api('/api/admin/stats');\r\n    renderStats(lastStats);\r\n  } catch { /* \u5FFD\u7565,\u5217\u8868\u52A0\u8F7D\u4F1A\u518D\u62A5 */ }\r\n}\r\n\r\n/** \u5220\u9664\u6210\u529F\u540E\u672C\u5730\u540C\u6B65\u7EDF\u8BA1(\u670D\u52A1\u7AEF KV \u7D22\u5F15\u6700\u957F 60s \u624D\u53CD\u6620\u5220\u9664,\u91CD\u62C9\u4F1A\u770B\u5230\u65E7\u6570) */\r\nasync function statsAfterDelete(r) {\r\n  if (!lastStats) return;\r\n  const s = { ...lastStats };\r\n  s.total = Math.max(0, s.total - 1);\r\n  if (r.kind === 'file') s.files = Math.max(0, s.files - 1);\r\n  else s.texts = Math.max(0, s.texts - 1);\r\n  s.totalBytes = Math.max(0, s.totalBytes - r.size);\r\n  if (r.status === 'active') s.active = Math.max(0, s.active - 1);\r\n  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);\r\n  if (r.created_at >= todayStart.getTime()) s.todayCreated = Math.max(0, s.todayCreated - 1);\r\n  lastStats = s;\r\n  renderStats(s);\r\n  if (s.fileBackend === 'r2') {\r\n    try { s.storage = (await api('/api/admin/stats')).storage; }\r\n    catch { s.storage = null; } // Do not present stale capacity as current after deletion.\r\n    if (lastStats === s) renderStats(s);\r\n  }\r\n}\r\n\r\n/* ---------- \u5217\u8868 ---------- */\r\nconst STATUS_KEY = { active: 'ad.st.active', expired: 'ad.st.expired', exhausted: 'ad.st.exhausted' };\r\nconst KIND_KEY = { file: 'ad.kind.file', text: 'ad.kind.text' };\r\n\r\nasync function loadList() {\r\n  tbody.replaceChildren(el('tr', {}, el('td', { class: 'muted', colspan: 9 }, t('ad.loading'))));\r\n  try {\r\n    const data = await api(`/api/admin/shares?limit=${LIMIT}&offset=${offset}`);\r\n    total = data.total;\r\n    const rows = data.rows ?? [];\r\n    tbody.replaceChildren();\r\n    for (const r of rows) {\r\n      const content = r.kind === 'text' ? (r.text_preview || t('ad.textFallback')) : (r.filename || t('ad.unnamed'));\r\n      tbody.append(\r\n        el('tr', {},\r\n          el('td', { class: 'mono' }, r.code),\r\n          el('td', { class: 'share-content-cell' },\r\n            el('div', { class: 'share-filename-line' },\r\n              r.kind === 'file'\r\n                ? el('button', { class: 'share-filename file-detail-link', type: 'button', title: content, onclick: () => openFileDetails(r.code) }, content)\r\n                : el('span', { class: 'share-filename', title: content }, content),\r\n              el('sup', { class: `badge share-kind kind-${r.kind}` }, t(KIND_KEY[r.kind] || r.kind)))),\r\n          sourceCell(r),\r\n          el('td', {}, r.kind === 'text' ? t('ad.chars', r.size) : fmtBytes(r.size)),\r\n          el('td', {}, `${r.pickup_count} / ${r.max_pickups ?? '\u221E'}`),\r\n          el('td', {}, r.expire_at ? fmtDate(r.expire_at) : t('ad.forever')),\r\n          el('td', {}, el('span', { class: `badge ${r.status}` }, STATUS_KEY[r.status] ? t(STATUS_KEY[r.status]) : r.status)),\r\n          el('td', {}, fmtDate(r.created_at)),\r\n          el('td', {}, el('button', { class: 'btn danger small', onclick: (e) => remove(r, e.target.closest('tr')) }, t('ad.delete'))),\r\n        ),\r\n      );\r\n    }\r\n    if (rows.length === 0) {\r\n      tbody.replaceChildren(el('tr', {}, el('td', { class: 'muted', colspan: 9 }, t('ad.empty'))));\r\n    }\r\n    updatePager();\r\n  } catch (e) {\r\n    tbody.replaceChildren(el('tr', {}, el('td', { class: 'muted', colspan: 9 }, e.message || t('ad.loadFail'))));\r\n  }\r\n}\r\n\r\nfunction updatePager() {\r\n  const page = Math.floor(offset / LIMIT) + 1;\r\n  const pages = Math.max(1, Math.ceil(total / LIMIT));\r\n  pageInfo.textContent = t('ad.page', page, pages, total);\r\n  btnPrev.disabled = offset <= 0;\r\n  btnNext.disabled = offset + LIMIT >= total;\r\n}\r\nbtnPrev.addEventListener('click', () => { offset = Math.max(0, offset - LIMIT); loadList(); });\r\nbtnNext.addEventListener('click', () => { offset += LIMIT; loadList(); });\r\nbtnRefresh.addEventListener('click', () => { noteOverrides.clear(); loadStats(); loadList(); });\r\n\r\n/* ---------- \u5220\u9664:\u7968\u636E\u98CE\u786E\u8BA4\u5F39\u7A97 + \u672C\u5730\u540C\u6B65(KV \u6700\u7EC8\u4E00\u81F4,\u5220\u9664\u540E\u7ACB\u5373\u91CD\u62C9\u4F1A\u770B\u5230\u6B8B\u7559\u7D22\u5F15) ---------- */\r\nconst delMask = $('#del-mask');\r\nconst delTarget = $('#del-target');\r\nlet delResolve = null;\r\n\r\nfunction confirmDelete(r) {\r\n  const content = r.kind === 'text' ? (r.text_preview || t('ad.textFallback')) : (r.filename || t('ad.unnamed'));\r\n  delTarget.replaceChildren(\r\n    el('div', { class: 'del-line' }, el('span', { class: 'muted' }, t('ad.th.code')), el('b', { class: 'mono' }, r.code)),\r\n    el('div', { class: 'del-line' }, el('span', { class: 'muted' }, t('ad.th.content')), el('span', {}, content)),\r\n    el('div', { class: 'del-line' }, el('span', { class: 'muted' }, t('ad.th.size')),\r\n      el('span', {}, r.kind === 'text' ? t('ad.chars', r.size) : fmtBytes(r.size))),\r\n  );\r\n  delMask.hidden = false;\r\n  $('#del-cancel').focus();\r\n  return new Promise((resolve) => { delResolve = resolve; });\r\n}\r\n\r\nfunction closeDelModal(v) {\r\n  if (!delResolve) return;\r\n  delMask.hidden = true;\r\n  const resolve = delResolve;\r\n  delResolve = null;\r\n  resolve(v);\r\n}\r\n$('#del-cancel').addEventListener('click', () => closeDelModal(false));\r\n$('#del-ok').addEventListener('click', () => closeDelModal(true));\r\ndelMask.addEventListener('click', (e) => e.target === delMask && closeDelModal(false));\r\ndocument.addEventListener('keydown', (e) => e.key === 'Escape' && closeDelModal(false));\r\n\r\nasync function remove(r, tr) {\r\n  if (!(await confirmDelete(r))) return;\r\n  try {\r\n    await api(`/api/admin/shares/${r.code}`, { method: 'DELETE' });\r\n    toast(t('ad.deleted'), 'ok');\r\n    statsAfterDelete(r);\r\n    total = Math.max(0, total - 1);\r\n    tr?.remove();\r\n    // \u5F53\u524D\u9875\u5220\u7A7A\u4E14\u4E0D\u5728\u7B2C\u4E00\u9875:\u9000\u56DE\u4E0A\u4E00\u9875\u91CD\u62C9,\u907F\u514D\u505C\u5728\u7A7A\u9875\r\n    if (tbody.rows.length === 0 && offset > 0) {\r\n      offset = Math.max(0, offset - LIMIT);\r\n      loadList();\r\n    } else {\r\n      updatePager();\r\n    }\r\n  } catch (e) {\r\n    toast(e.message || t('ad.deleteFail'), 'error');\r\n  }\r\n}\r\n\r\n/* Upload source details: source labels are text nodes, never interpolated HTML. */\r\nconst sourceDialog = $('#source-dialog');\r\nconst sourceForm = $('#source-form');\r\nconst sourceNote = $('#source-note');\r\nconst sourceSave = $('#source-save');\r\nconst sourceError = $('#source-error');\r\nconst noteOverrides = new Map(); // Read-your-write while KV propagation completes.\r\nlet sourceRequest = 0;\r\nlet activeSource = null;\r\n\r\nfunction visitorLabel(id) { return t('ad.visitor', id.slice(0, 8).toUpperCase()); }\r\nfunction sourceLabel(source) {\r\n  const override = noteOverrides.get(source.visitorId);\r\n  return (override !== undefined ? override : source.note) || visitorLabel(source.visitorId);\r\n}\r\nfunction locationLabel(source) {\r\n  let country = source.country;\r\n  if (country && /^[A-Z]{2}$/.test(country)) {\r\n    country = new Intl.DisplayNames([LANG === 'zh' ? 'zh-CN' : 'en'], { type: 'region' }).of(country);\r\n  }\r\n  return [...new Set([country, source.region, source.city].filter(Boolean))].join(' \xB7 ') || t('ad.sourceUnknown');\r\n}\r\nfunction sourceCell(row) {\r\n  if (!row.source) return el('td', { class: 'source-cell muted' }, t('ad.sourceUnrecorded'));\r\n  const button = el('button', { class: 'source-link', type: 'button', onclick: () => openSource(row) }, sourceLabel(row.source));\r\n  button.dataset.visitor = row.source.visitorId;\r\n  button.title = t('ad.source');\r\n  return el('td', { class: 'source-cell' }, button, el('small', { class: 'muted' }, locationLabel(row.source)));\r\n}\r\nasync function openSource(row) {\r\n  const request = ++sourceRequest;\r\n  activeSource = null;\r\n  sourceForm.hidden = true;\r\n  sourceError.hidden = true;\r\n  sourceSave.disabled = false;\r\n  sourceSave.hidden = true;\r\n  $('#source-context').textContent = `${t('ad.th.code')} ${row.code}`;\r\n  $('#source-detail').textContent = t('ad.loading');\r\n  sourceDialog.showModal();\r\n  try {\r\n    const { source } = await api(`/api/admin/shares/${row.code}/source`);\r\n    if (request !== sourceRequest || !sourceDialog.open) return;\r\n    if (!source) { $('#source-detail').textContent = t('ad.sourceUnrecorded'); return; }\r\n    activeSource = { code: row.code, visitorId: source.visitorId };\r\n    $('#source-detail').replaceChildren(...[\r\n      [t('ad.sourceLocation'), locationLabel(source), 'source-field-wide'],\r\n      ['IP', source.ip || t('ad.sourceUnknown'), 'mono'],\r\n      [t('ad.sourceTime'), fmtDate(source.capturedAt), ''],\r\n      [t('ad.visitorId'), source.visitorId, 'source-field-wide mono'],\r\n    ].map(([label, value, className]) => el('div', { class: `source-field ${className}` }, el('small', { class: 'muted' }, label), el('span', {}, value))));\r\n    sourceNote.value = noteOverrides.get(source.visitorId) ?? source.note ?? '';\r\n    sourceForm.hidden = false;\r\n    sourceSave.hidden = false;\r\n  } catch (e) {\r\n    if (request === sourceRequest) $('#source-detail').textContent = e.message || t('ad.loadFail');\r\n  }\r\n}\r\nfunction closeSource() {\r\n  sourceRequest++;\r\n  activeSource = null;\r\n  sourceNote.value = '';\r\n  sourceForm.hidden = true;\r\n  sourceSave.hidden = true;\r\n  $('#source-context').textContent = '';\r\n  $('#source-detail').replaceChildren();\r\n  sourceDialog.close();\r\n}\r\nsourceDialog.addEventListener('cancel', (e) => { e.preventDefault(); closeSource(); });\r\n$('#source-close').addEventListener('click', closeSource);\r\nsourceForm.addEventListener('submit', async (e) => {\r\n  e.preventDefault();\r\n  if (!activeSource || sourceSave.disabled) return;\r\n  const { code } = activeSource;\r\n  const request = sourceRequest;\r\n  sourceSave.disabled = true;\r\n  sourceError.hidden = true;\r\n  try {\r\n    const result = await api(`/api/admin/shares/${code}/source`, { method: 'PUT', body: { note: sourceNote.value } });\r\n    noteOverrides.set(result.visitorId, result.note);\r\n    document.querySelectorAll('[data-visitor]').forEach((button) => {\r\n      if (button.dataset.visitor === result.visitorId) button.textContent = result.note || visitorLabel(result.visitorId);\r\n    });\r\n    if (request === sourceRequest) closeSource();\r\n    toast(t('ad.sourceSaved'));\r\n  } catch (error) {\r\n    if (request === sourceRequest) {\r\n      sourceError.textContent = error.message || t('ad.loadFail');\r\n      sourceError.hidden = false;\r\n    }\r\n  } finally {\r\n    if (request === sourceRequest) sourceSave.disabled = false;\r\n  }\r\n});\r\n\r\n/* File details use their own request generation so closed dialogs stay empty. */\r\nconst fileDialog = $('#file-dialog');\r\nconst fileDetail = $('#file-detail');\r\nconst fileDownload = $('#file-download');\r\nlet fileRequest = 0;\r\nfunction fileFormat(filename) {\r\n  const ext = filename?.match(/\\.([a-z0-9]{1,12})$/i)?.[1]?.toLowerCase();\r\n  const groups = {\r\n    archive: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'],\r\n    program: ['exe', 'msi', 'apk', 'dmg', 'deb', 'rpm'],\r\n    document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'epub'],\r\n    image: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp', 'ico', 'heic', 'avif'],\r\n    video: ['mp4', 'mkv', 'mov', 'avi', 'webm', 'm4v'],\r\n    audio: ['mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac'],\r\n    text: ['txt', 'md', 'csv', 'json', 'xml', 'html', 'js', 'ts', 'py', 'log'],\r\n  };\r\n  if (!ext) return t('ad.formatUnknown');\r\n  const group = Object.entries(groups).find(([, extensions]) => extensions.includes(ext))?.[0] || 'file';\r\n  const keys = { archive: 'ad.format.archive', program: 'ad.format.program', document: 'ad.format.document', image: 'ad.format.image', video: 'ad.format.video', audio: 'ad.format.audio', text: 'ad.format.text', file: 'ad.format.file' };\r\n  return `${ext.toUpperCase()} \xB7 ${t(keys[group])}`;\r\n}\r\nfunction fileField(label, value, secondary) {\r\n  return el('div', { class: 'file-field' }, el('small', { class: 'muted' }, label),\r\n    el('div', { class: 'file-field-value' }, value), secondary ? el('small', { class: 'muted' }, secondary) : null);\r\n}\r\n\r\nasync function openFileDetails(code) {\r\n  const request = ++fileRequest;\r\n  fileDownload.hidden = true;\r\n  fileDownload.removeAttribute('href');\r\n  fileDownload.removeAttribute('download');\r\n  $('#file-context').textContent = `${t('ad.th.code')} ${code}`;\r\n  fileDetail.textContent = t('ad.loading');\r\n  fileDialog.showModal();\r\n  try {\r\n    const detail = await api(`/api/admin/shares/${code}`);\r\n    if (request !== fileRequest || !fileDialog.open) return;\r\n    const now = detail.evaluatedAt ?? Date.now();\r\n    const state = detail.storage?.state || 'unknown';\r\n    const storageLabels = { available: 'ad.fileState.available', missing: 'ad.fileState.missing', unknown: 'ad.fileState.unknown' };\r\n    const source = detail.source;\r\n    const sourceButton = source ? el('button', { type: 'button', class: 'source-link file-source-link',\r\n      title: t('ad.source'), onclick: () => { closeFileDetails(); openSource({ code }); },\r\n    }, sourceLabel(source)) : t('ad.sourceUnrecorded');\r\n    if (source) sourceButton.dataset.visitor = source.visitorId;\r\n    const lifetime = detail.expireAt === null ? null\r\n      : t(detail.expireAt > now ? 'ad.timeLeft' : 'ad.timeExpired', fmtDuration(Math.abs(detail.expireAt - now) / 1000));\r\n    const cleanupLabels = { permanent: 'ad.cleanupPermanent', active: 'ad.cleanupActive', retained: 'ad.cleanupRetained', pending: 'ad.cleanupPending' };\r\n    const cleanupLabel = t(cleanupLabels[detail.cleanupStatus] || 'ad.sourceUnknown', detail.retentionDays);\r\n    const technical = el('details', { class: 'file-technical file-wide' },\r\n      el('summary', {}, t('ad.technical')),\r\n      el('div', { class: 'file-technical-grid' },\r\n        fileField('MIME', detail.mime || t('ad.sourceUnknown')),\r\n        Number.isSafeInteger(detail.storage?.size) ? fileField(t('ad.storedSize'), t('ad.exactBytes', detail.storage.size.toLocaleString())) : null,\r\n        detail.storage?.uploadedAt != null ? fileField(t('ad.storedAt'), fmtDate(detail.storage.uploadedAt)) : null,\r\n      ), el('small', { class: 'muted' }, t('ad.formatHint')));\r\n    fileDetail.replaceChildren(\r\n      el('div', { class: 'file-identity file-wide' },\r\n        el('strong', {}, detail.filename || t('ad.unnamed')), el('small', { class: 'muted' }, fileFormat(detail.filename))),\r\n      fileField(t('ad.th.size'), fmtBytes(detail.size), t('ad.exactBytes', detail.size.toLocaleString())),\r\n      fileField(t('ad.fileAvailability'), el('span', { class: `badge ${state === 'available' ? 'active' : state === 'missing' ? 'expired' : ''}` }, t(storageLabels[state]))),\r\n      fileField(t('ad.uploader'), sourceButton, source ? locationLabel(source) : null),\r\n      fileField(t('ad.shareState'), el('span', { class: `badge ${detail.status}` }, t(STATUS_KEY[detail.status]))),\r\n      fileField(t('ad.th.pickups'), `${detail.pickupCount} / ${detail.maxPickups ?? '\u221E'}`),\r\n      fileField(t('ad.th.created'), fmtDate(detail.createdAt)),\r\n      fileField(t('ad.th.expire'), detail.expireAt === null ? t('ad.forever') : fmtDate(detail.expireAt), lifetime),\r\n      fileField(t('ad.cleanupAfter'), detail.cleanupAfter === null ? t('ad.forever') : fmtDate(detail.cleanupAfter), cleanupLabel),\r\n      technical,\r\n    );\r\n    fileDownload.href = `/api/admin/shares/${code}/download`;\r\n    fileDownload.download = detail.filename || 'file';\r\n    fileDownload.textContent = t(state === 'unknown' ? 'ad.tryDownload' : 'ad.download');\r\n    fileDownload.hidden = state === 'missing';\r\n  } catch (error) {\r\n    if (request === fileRequest) fileDetail.textContent = error.message || t('ad.loadFail');\r\n  }\r\n}\r\nfunction closeFileDetails() {\r\n  fileRequest++;\r\n  fileDetail.replaceChildren();\r\n  $('#file-context').textContent = '';\r\n  fileDownload.hidden = true;\r\n  fileDownload.removeAttribute('href');\r\n  fileDownload.removeAttribute('download');\r\n  fileDialog.close();\r\n}\r\n$('#file-close').addEventListener('click', closeFileDetails);\r\nfileDialog.addEventListener('cancel', e => { e.preventDefault(); closeFileDetails(); });\r\n\r\n/* Keep unsaved input local; only a validated save changes retention. */\r\nconst retentionInput = $('#retention-days');\r\nconst retentionSave = $('#retention-save');\r\nconst retentionError = $('#retention-error');\r\nasync function loadSettings() {\r\n  retentionInput.disabled = true;\r\n  retentionSave.disabled = true;\r\n  retentionError.hidden = true;\r\n  $('#retention-retry').hidden = true;\r\n  try {\r\n    const settings = await api('/api/admin/settings');\r\n    if (!Number.isInteger(settings.expiredRetentionDays) || settings.expiredRetentionDays < 0 || settings.expiredRetentionDays > 3650) throw new Error(t('ad.loadFail'));\r\n    retentionInput.value = settings.expiredRetentionDays;\r\n    retentionInput.disabled = false;\r\n    retentionSave.disabled = false;\r\n  } catch (error) {\r\n    retentionError.textContent = error.message || t('ad.loadFail');\r\n    retentionError.hidden = false;\r\n    $('#retention-retry').hidden = false;\r\n  }\r\n}\r\n$('#retention-retry').addEventListener('click', loadSettings);\r\n$('#retention-form').addEventListener('submit', async e => {\r\n  e.preventDefault();\r\n  if (retentionSave.disabled || !retentionInput.reportValidity()) return;\r\n  retentionSave.disabled = true;\r\n  retentionInput.disabled = true;\r\n  retentionError.hidden = true;\r\n  try {\r\n    const settings = await api('/api/admin/settings', { method: 'PUT', body: { expiredRetentionDays: Number(retentionInput.value) } });\r\n    retentionInput.value = settings.expiredRetentionDays;\r\n    toast(t('ad.settingsSaved'), 'ok');\r\n  } catch (error) {\r\n    retentionError.textContent = error.message || t('ad.loadFail');\r\n    retentionError.hidden = false;\r\n  } finally {\r\n    retentionInput.disabled = false;\r\n    retentionSave.disabled = false;\r\n  }\r\n});\r\n\r\nconst guestWeekly = $('#guest-weekly');\r\nconst guestSave = $('#guest-save');\r\nconst guestError = $('#guest-error');\r\nfunction guestBusy(busy) {\r\n  for (const control of [guestWeekly, guestSave]) control.disabled = busy;\r\n}\r\nasync function loadGuestPolicy() {\r\n  guestBusy(true);\r\n  guestError.hidden = true;\r\n  $('#guest-retry').hidden = true;\r\n  try {\r\n    const policy = await api('/api/admin/upload-policy');\r\n    if (!Number.isInteger(policy.weeklyFileLimit) || policy.weeklyFileLimit < 0 || policy.weeklyFileLimit > 1000) throw new Error(t('ad.loadFail'));\r\n    guestWeekly.value = policy.weeklyFileLimit;\r\n    guestBusy(false);\r\n  } catch (error) {\r\n    guestError.textContent = error.message || t('ad.loadFail');\r\n    guestError.hidden = false;\r\n    $('#guest-retry').hidden = false;\r\n  }\r\n}\r\n$('#guest-retry').addEventListener('click', loadGuestPolicy);\r\n$('#guest-policy-form').addEventListener('submit', async e => {\r\n  e.preventDefault();\r\n  if (guestSave.disabled || !e.target.reportValidity()) return;\r\n  const body = { weeklyFileLimit: Number(guestWeekly.value) };\r\n  guestBusy(true);\r\n  guestError.hidden = true;\r\n  try {\r\n    await api('/api/admin/upload-policy', { method: 'PUT', body });\r\n    toast(t('ad.guestSaved'), 'ok');\r\n  } catch (error) {\r\n    guestError.textContent = error.message || t('ad.loadFail');\r\n    guestError.hidden = false;\r\n  } finally { guestBusy(false); }\r\n});\r\n\r\nlet guardRequest = 0;\r\nasync function loadLoginProtection() {\r\n  const request = ++guardRequest;\r\n  const refresh = $('#login-guard-refresh');\r\n  const error = $('#login-guard-error');\r\n  refresh.disabled = true;\r\n  error.hidden = true;\r\n  $('#login-guard-bans').replaceChildren();\r\n  $('#login-guard-status').textContent = '';\r\n  try {\r\n    const data = await api('/api/admin/login-protection');\r\n    if (request !== guardRequest) return;\r\n    if (typeof data.enabled !== 'boolean' || !Array.isArray(data.bans) ||\r\n        ![data.maxFailures, data.windowSeconds, data.banSeconds].every(n => Number.isInteger(n) && n > 0)) throw new Error(t('ad.loadFail'));\r\n    $('#login-guard-status').textContent = data.enabled\r\n      ? t('ad.guardRule', data.windowSeconds / 60, data.maxFailures, data.banSeconds / 60) : t('ad.guardDisabled');\r\n    if (!data.enabled) return;\r\n    if (!data.bans.length) $('#login-guard-bans').append(el('small', { class: 'muted' }, t('ad.guardEmpty')));\r\n    for (const ban of data.bans) {\r\n      const button = el('button', { class: 'btn small ghost', type: 'button' }, t('ad.guardUnblock'));\r\n      button.addEventListener('click', async () => {\r\n        button.disabled = true;\r\n        error.hidden = true;\r\n        try {\r\n          await api('/api/admin/login-protection/unblock', { method: 'POST', body: { ip: ban.ip } });\r\n          toast(t('ad.guardUnblocked'), 'ok');\r\n          await loadLoginProtection();\r\n        } catch (e) {\r\n          error.textContent = e.message || t('ad.loadFail');\r\n          error.hidden = false;\r\n          button.disabled = false;\r\n        }\r\n      });\r\n      $('#login-guard-bans').append(el('div', { class: 'login-guard-row' },\r\n        el('div', { class: 'login-guard-info' },\r\n          el('b', {}, ban.ip === 'unknown' ? t('ad.guardUnknown') : ban.ip),\r\n          el('small', { class: 'muted' }, t('ad.guardFailures', ban.failures) + ' \xB7 ' + t('ad.guardUntil', fmtDate(ban.bannedUntil))),\r\n          el('small', { class: 'muted' }, t('ad.guardLast', fmtDate(ban.lastFailedAt)))), button));\r\n    }\r\n  } catch (e) {\r\n    if (request !== guardRequest) return;\r\n    error.textContent = e.message || t('ad.loadFail');\r\n    error.hidden = false;\r\n  } finally { if (request === guardRequest) refresh.disabled = false; }\r\n}\r\n$('#login-guard-refresh').addEventListener('click', loadLoginProtection);\r\n", "js/common.js": "import { t } from './i18n.js';\r\n\r\nexport const $ = (sel, el = document) => el.querySelector(sel);\r\nexport const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];\r\n\r\n/** fetch JSON \u5C01\u88C5:\u975E 2xx \u629B\u9519(\u5E26\u670D\u52A1\u7AEF\u7684\u4E2D\u6587 message \u4E0E\u673A\u5668\u7801) */\r\nexport async function api(path, opts = {}) {\r\n  const res = await fetch(path, {\r\n    method: opts.method || 'GET',\r\n    headers: opts.body !== undefined ? { 'Content-Type': 'application/json' } : {},\r\n    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,\r\n  });\r\n  if (res.headers.get('X-Audit-Status') === 'unavailable') window.dispatchEvent(new Event('audit-write-failed'));\r\n  let data = null;\r\n  try { data = await res.json(); } catch { /* \u975E JSON \u54CD\u5E94 */ }\r\n  if (!res.ok) {\r\n    const e = new Error(data?.message || t('req.fail', res.status));\r\n    e.code = data?.error || 'unknown';\r\n    e.status = res.status;\r\n    e.remainingBytes = data?.remainingBytes;\r\n    throw e;\r\n  }\r\n  return data;\r\n}\r\n\r\nexport function fmtBytes(n) {\r\n  if (!Number.isFinite(n) || n < 0) return '-';\r\n  const units = ['B', 'KB', 'MB', 'GB', 'TB'];\r\n  let i = 0;\r\n  while (n >= 1000 && i < units.length - 1) { n /= 1000; i++; }\r\n  const v = i === 0 ? Math.round(n) : n >= 100 ? Math.round(n) : Math.round(n * 100) / 100;\r\n  return `${v} ${units[i]}`;\r\n}\r\n\r\n/** \u6C38\u4E45\u5206\u4EAB\u8FD4\u56DE null,\u7531\u8C03\u7528\u65B9\u6309\u8BED\u8A00\u6E32\u67D3\u300C\u6C38\u4E45 / Forever\u300D */\r\nexport function fmtDate(ms) {\r\n  if (ms === null || ms === undefined) return null;\r\n  const d = new Date(ms);\r\n  const p = (x) => String(x).padStart(2, '0');\r\n  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;\r\n}\r\n\r\n/** \u79D2\u6570\u4EBA\u6027\u5316:\u7528\u4E8E\u4E0A\u4F20\u5269\u4F59\u65F6\u95F4 / \u8FC7\u671F\u5012\u8BA1\u65F6,\u5355\u4F4D\u8BCD\u968F\u8BED\u8A00 */\r\nexport function fmtDuration(sec) {\r\n  if (!Number.isFinite(sec) || sec < 0) return '-';\r\n  if (sec < 1) return t('dur.ms');\r\n  if (sec < 60) return t('dur.s', Math.round(sec));\r\n  if (sec < 3600) {\r\n    const m = Math.floor(sec / 60);\r\n    const s = Math.round(sec % 60);\r\n    return s ? t('dur.hm', m, s) : t('dur.h', m);\r\n  }\r\n  if (sec < 86400) {\r\n    const h = Math.floor(sec / 3600);\r\n    const m = Math.round((sec % 3600) / 60);\r\n    return m ? t('dur.hH', h, m) : t('dur.hH2', h);\r\n  }\r\n  return t('dur.d', Math.round(sec / 86400));\r\n}\r\n\r\n/** \u6309\u6587\u4EF6\u540D/ MIME \u6311\u4E00\u4E2A\u76F4\u89C2\u56FE\u6807(\u7EAF\u5C55\u793A\u7528) */\r\nexport function iconFor(name = '', mime = '') {\r\n  const ext = (name.split('.').pop() || '').toLowerCase();\r\n  if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'].includes(ext)) return '\u{1F5BC}\uFE0F';\r\n  if (mime.startsWith('video/') || ['mp4', 'mkv', 'mov', 'avi', 'webm', 'flv'].includes(ext)) return '\u{1F3AC}';\r\n  if (mime.startsWith('audio/') || ['mp3', 'flac', 'wav', 'ogg', 'm4a', 'aac'].includes(ext)) return '\u{1F3B5}';\r\n  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(ext)) return '\u{1F5DC}\uFE0F';\r\n  if (mime === 'application/pdf' || ext === 'pdf') return '\u{1F4D5}';\r\n  if (['doc', 'docx', 'txt', 'md', 'ppt', 'pptx', 'xls', 'xlsx', 'csv'].includes(ext)) return '\u{1F4C4}';\r\n  if (['js', 'ts', 'py', 'json', 'html', 'css', 'java', 'go', 'rs', 'c', 'cpp', 'sh', 'yml', 'yaml', 'xml'].includes(ext)) return '\u{1F9E9}';\r\n  return '\u{1F4E6}';\r\n}\r\n\r\nexport async function copyText(text) {\r\n  try {\r\n    await navigator.clipboard.writeText(text);\r\n    return true;\r\n  } catch { /* \u8D70\u964D\u7EA7 */ }\r\n  try {\r\n    const ta = document.createElement('textarea');\r\n    ta.value = text;\r\n    ta.style.cssText = 'position:fixed;opacity:0';\r\n    document.body.appendChild(ta);\r\n    ta.select();\r\n    const ok = document.execCommand('copy');\r\n    ta.remove();\r\n    return ok;\r\n  } catch {\r\n    return false;\r\n  }\r\n}\r\n\r\nexport function toast(msg, type = 'info') {\r\n  let host = $('#toast-host');\r\n  if (!host) {\r\n    host = document.createElement('div');\r\n    host.id = 'toast-host';\r\n    document.body.appendChild(host);\r\n  }\r\n  const t = document.createElement('div');\r\n  t.className = `toast ${type}`;\r\n  t.textContent = msg;\r\n  host.appendChild(t);\r\n  requestAnimationFrame(() => t.classList.add('show'));\r\n  setTimeout(() => {\r\n    t.classList.remove('show');\r\n    setTimeout(() => t.remove(), 300);\r\n  }, 2400);\r\n}\r\n\r\nexport function initTheme() {\r\n  const btn = $('#theme-btn');\r\n  const meta = $('meta[name=\"theme-color\"]');\r\n  const sync = () => {\r\n    if (meta) meta.content = document.documentElement.dataset.theme === 'dark' ? '#0f1117' : '#f6f7fb';\r\n  };\r\n  sync();\r\n  btn?.addEventListener('click', () => {\r\n    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';\r\n    localStorage.setItem('theme', next);\r\n    document.documentElement.dataset.theme = next;\r\n    sync();\r\n  });\r\n}\r\n\r\n/** \u5B89\u5168 DOM \u6784\u5EFA:\u5168\u90E8 textContent,\u9632 XSS */\r\nexport function el(tag, attrs = {}, ...children) {\r\n  const n = document.createElement(tag);\r\n  for (const [k, v] of Object.entries(attrs)) {\r\n    if (k === 'class') n.className = v;\r\n    else if (k === 'href' || k === 'download' || k === 'type' || k === 'inputmode' || k === 'colspan') n.setAttribute(k, v);\r\n    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);\r\n    else n[k] = v;\r\n  }\r\n  for (const c of children.flat(Infinity)) {\r\n    if (c == null || c === false) continue;\r\n    n.append(c instanceof Node ? c : document.createTextNode(String(c)));\r\n  }\r\n  return n;\r\n}\r\n", "js/i18n.js": `/**\r
 * \u8F7B\u91CF i18n:HTML \u9759\u6001\u6587\u6848\u7528 data-i18n / data-i18n-ph / data-i18n-title \u6807\u8BB0,\r
 * JS \u52A8\u6001\u5B57\u7B26\u4E32\u7528 t('key', \u2026args);{n} \u5360\u4F4D\u3002\r
 * \u8BED\u8A00\u4F18\u5148\u7EA7:localStorage('lang') > \u6D4F\u89C8\u5668\u8BED\u8A00(en \u5F00\u5934\u2192\u82F1\u6587)> \u4E2D\u6587\u3002\r
 * \u5207\u6362\u540E\u8C03\u7528\u5DF2\u6CE8\u518C\u7684\u91CD\u6E32\u67D3\u94A9\u5B50(\u5404\u9875\u9762 setLang \u65F6\u767B\u8BB0)\u3002\r
 * \u8BCD\u5178\u503C\u4E3A\u6570\u7EC4\u65F6\u968F\u673A\u53D6\u4E00\u6761(\u9875\u811A\u5F69\u86CB,\u6BCF\u6B21\u52A0\u8F7D/\u5207\u8BED\u8A00\u91CD\u6447)\u3002\r
 */\r
\r
const DICT = {\r
  zh: {\r
    'audit.detail.filename': '\u6587\u4EF6\u540D',\r
    'audit.detail.sizeBytes': '\u5927\u5C0F\uFF08\u5B57\u8282\uFF09',\r
    'audit.navigation': "\u7BA1\u7406\u9875\u9762",\r
    'audit.files': "\u6587\u4EF6\u7BA1\u7406",\r
    'audit.title': "\u65E5\u5FD7\u5BA1\u8BA1",\r
    'audit.retention': "\u6700\u8FD1 30 \u5929\uFF0C\u6700\u591A 1,000 \u6761\uFF1B\u65F6\u95F4\u6309\u672C\u5730\u65F6\u533A\u663E\u793A",\r
    'audit.export': "\u5BFC\u51FA\u7B5B\u9009\u7ED3\u679C",\r
    'audit.categories': "\u65E5\u5FD7\u5206\u7C7B",\r
    'audit.all': "\u5168\u90E8\u65E5\u5FD7",\r
    'audit.login': "\u767B\u5F55\u65E5\u5FD7",\r
    'audit.operation': "\u64CD\u4F5C\u65E5\u5FD7",\r
    'audit.security': "\u5B89\u5168\u4E8B\u4EF6",\r
    'audit.result': "\u7ED3\u679C",\r
    'audit.anyResult': "\u5168\u90E8\u7ED3\u679C",\r
    'audit.success': "\u6210\u529F",\r
    'audit.failed': "\u5931\u8D25",\r
    'audit.blocked': "\u5DF2\u62E6\u622A",\r
    'audit.from': "\u5F00\u59CB\u65E5\u671F",\r
    'audit.to': "\u7ED3\u675F\u65E5\u671F",\r
    'audit.keyword': "IP / \u64CD\u4F5C\u5BF9\u8C61",\r
    'audit.search': "\u641C\u7D22 IP \u6216\u53D6\u4EF6\u7801",\r
    'audit.filter': "\u7B5B\u9009",\r
    'audit.reset': "\u91CD\u7F6E",\r
    'audit.time': "\u65F6\u95F4",\r
    'audit.action': "\u64CD\u4F5C",\r
    'audit.actor': "\u64CD\u4F5C\u8EAB\u4EFD",\r
    'audit.source': "\u6765\u6E90 IP / \u5C5E\u5730",\r
    'audit.target': "\u64CD\u4F5C\u5BF9\u8C61",\r
    'audit.details': "\u8BE6\u60C5",\r
    'audit.empty': "\u6682\u65E0\u5339\u914D\u65E5\u5FD7\u3002\u65E5\u5FD7\u4ECE\u529F\u80FD\u4E0A\u7EBF\u540E\u5F00\u59CB\u8BB0\u5F55\u3002",\r
    'audit.disabled': "\u672A\u542F\u7528\u65E5\u5FD7\u5BA1\u8BA1\uFF1A\u9700\u7ED1\u5B9A R2 \u6216 D1\u3002",\r
    'audit.page': "\u7B2C {0} / {1} \u9875 \xB7 \u5171 {2} \u6761",\r
    'audit.dateError': "\u5F00\u59CB\u65E5\u671F\u4E0D\u80FD\u665A\u4E8E\u7ED3\u675F\u65E5\u671F",\r
    'audit.http': "\u8BF7\u6C42 / \u72B6\u6001\u7801",\r
    'audit.duration': "\u5904\u7406\u8017\u65F6",\r
    'audit.id': "\u65E5\u5FD7\u7F16\u53F7",\r
    'audit.agent': "\u6D4F\u89C8\u5668\u6807\u8BC6\uFF08\u5BA2\u6237\u7AEF\u63D0\u4F9B\uFF09",\r
    'audit.yes': "\u662F",\r
    'audit.no': "\u5426",\r
    'audit.description': "\u8BF4\u660E",\r
    'audit.downloadHint': "\u5DF2\u5F00\u59CB\u8FD4\u56DE\u6587\u4EF6\u6D41\uFF0C\u4E0D\u4EE3\u8868\u6D4F\u89C8\u5668\u5DF2\u5B8C\u6210\u4E0B\u8F7D\u3002",\r
    'audit.writeFailed': "\u64CD\u4F5C\u5DF2\u5904\u7406\uFF0C\u4F46\u5BA1\u8BA1\u8BB0\u5F55\u672A\u4FDD\u5B58\uFF0C\u8BF7\u68C0\u67E5\u65E5\u5FD7\u5B58\u50A8\u3002",\r
    'audit.action.login': "\u7BA1\u7406\u5458\u767B\u5F55",\r
    'audit.action.logout': "\u9000\u51FA\u767B\u5F55",\r
    'audit.action.retention': "\u4FEE\u6539\u8FC7\u671F\u4FDD\u7559\u5929\u6570",\r
    'audit.action.uploadPolicy': "\u4FEE\u6539\u6BCF\u5468\u4E0A\u4F20\u6B21\u6570",\r
    'audit.action.unblock': "\u624B\u52A8\u89E3\u5C01 IP",\r
    'audit.action.cleanup': "\u6267\u884C\u8FC7\u671F\u6E05\u7406",\r
    'audit.action.export': "\u5BFC\u51FA\u5BA1\u8BA1\u65E5\u5FD7",\r
    'audit.action.ban': "\u89E6\u53D1\u767B\u5F55\u5C01\u7981",\r
    'audit.action.delete': "\u5220\u9664\u5206\u4EAB",\r
    'audit.action.note': "\u4FEE\u6539\u8BBF\u5BA2\u5907\u6CE8",\r
    'audit.action.viewSource': "\u67E5\u770B\u6765\u6E90\u8BE6\u60C5",\r
    'audit.action.download': "\u4E0B\u8F7D\u6587\u4EF6",\r
    'audit.actor.admin': "\u7BA1\u7406\u5458",\r
    'audit.actor.token': "\u5B9A\u65F6\u5668 / \u4EE4\u724C",\r
    'audit.actor.anonymous': "\u672A\u8BA4\u8BC1",\r
    'audit.detail.bannedUntil': "\u5C01\u7981\u622A\u6B62",\r
    'audit.detail.expiredRetentionDays': "\u8FC7\u671F\u4FDD\u7559\u5929\u6570",\r
    'audit.detail.weeklyFileLimit': "\u6BCF\u5468\u4E0A\u4F20\u6B21\u6570",\r
    'audit.detail.notePresent': "\u8BBE\u7F6E\u5907\u6CE8",\r
    'audit.detail.alreadyDeleted': "\u5206\u4EAB\u5DF2\u4E0D\u5B58\u5728",\r
    'audit.detail.deletedShares': "\u5DF2\u6E05\u7406\u5206\u4EAB",\r
    'audit.detail.abortedSessions': "\u5DF2\u53D6\u6D88\u4E0A\u4F20\u4F1A\u8BDD",\r
\r
    'ad.loginProtection': "\u767B\u5F55\u9632\u62A4",\r
    'ad.guardRule': "{0} \u5206\u949F\u5185\u5931\u8D25 {1} \u6B21\uFF0C\u5C01\u7981\u767B\u5F55 {2} \u5206\u949F",\r
    'ad.guardDisabled': "\u672A\u542F\u7528\uFF1A\u9700\u7ED1\u5B9A R2 \u6216 D1",\r
    'ad.guardEmpty': "\u5F53\u524D\u6CA1\u6709\u5C01\u7981 IP",\r
    'ad.guardUnknown': "\u672A\u77E5\u6765\u6E90\uFF08\u5171\u7528\u9650\u5236\uFF09",\r
    'ad.guardFailures': "\u5931\u8D25 {0} \u6B21",\r
    'ad.guardUntil': "\u89E3\u5C01\u4E8E {0}",\r
    'ad.guardLast': "\u6700\u8FD1\u5931\u8D25 {0}",\r
    'ad.guardUnblock': "\u89E3\u5C01",\r
    'ad.guardUnblocked': "\u5DF2\u89E3\u5C01",\r
    'ad.loginBlocked': "\u767B\u5F55\u5931\u8D25\u6B21\u6570\u8FC7\u591A\uFF0C\u8BF7\u7B49\u5F85\u5C01\u7981\u5230\u671F\u540E\u91CD\u8BD5",\r
    'ad.guardUnavailable': "\u767B\u5F55\u9632\u62A4\u6682\u4E0D\u53EF\u7528\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5",\r
\r
    'ad.formatUnknown': "\u683C\u5F0F\u672A\u77E5",\r
    'ad.format.archive': "\u538B\u7F29\u5305",\r
    'ad.format.program': "\u5E94\u7528\u7A0B\u5E8F",\r
    'ad.format.document': "\u6587\u6863",\r
    'ad.format.image': "\u56FE\u7247",\r
    'ad.format.video': "\u89C6\u9891",\r
    'ad.format.audio': "\u97F3\u9891",\r
    'ad.format.text': "\u6587\u672C / \u4EE3\u7801",\r
    'ad.format.file': "\u6587\u4EF6",\r
    'ad.uploader': "\u4E0A\u4F20\u8005",\r
    'ad.shareState': "\u5206\u4EAB\u72B6\u6001",\r
    'ad.fileAvailability': "\u6587\u4EF6\u72B6\u6001",\r
    'ad.fileState.available': "\u53EF\u4E0B\u8F7D",\r
    'ad.fileState.missing': "\u6587\u4EF6\u4E0D\u5B58\u5728",\r
    'ad.fileState.unknown': "\u6682\u65F6\u65E0\u6CD5\u786E\u8BA4",\r
    'ad.timeLeft': "\u5269\u4F59 {0}",\r
    'ad.timeExpired': "\u5DF2\u8FC7\u671F {0}",\r
    'ad.cleanupPermanent': "\u4E0D\u81EA\u52A8\u6E05\u7406",\r
    'ad.cleanupActive': "\u8FC7\u671F\u540E\u4FDD\u7559 {0} \u5929",\r
    'ad.cleanupRetained': "\u8FC7\u671F\u4FDD\u7559\u4E2D",\r
    'ad.cleanupPending': "\u7B49\u5F85\u6E05\u7406\u4EFB\u52A1",\r
    'ad.technical': "\u6280\u672F\u4FE1\u606F",\r
    'ad.storedSize': "\u5B58\u50A8\u5927\u5C0F",\r
    'ad.storedAt': "\u5165\u5E93\u65F6\u95F4",\r
    'ad.exactBytes': "{0} \u5B57\u8282",\r
    'ad.formatHint': "\u683C\u5F0F\u6309\u6587\u4EF6\u540D\u8BC6\u522B\uFF0C\u4E0D\u4EE3\u8868\u5185\u5BB9\u6821\u9A8C\u3002",\r
    'ad.tryDownload': "\u5C1D\u8BD5\u4E0B\u8F7D",\r
    'ad.guestLimits': "\u672A\u5907\u6CE8\u8BBF\u5BA2\u9650\u5236",\r
    'ad.weeklyFiles': "\u6BCF\u5468\u6587\u4EF6\u6570",\r
    'ad.guestRules': "\u5317\u4EAC\u65F6\u95F4\u5468\u4E00\u91CD\u7F6E\uFF1B\u5DF2\u63A5\u7EB3\u4E0A\u4F20\u8BA1\u6B21\uFF0C\u53D6\u6D88\u4E0D\u9000\u56DE\u3002\u672A\u5907\u6CE8\u8BBF\u5BA2\u4E0D\u80FD\u6C38\u4E45\u5206\u4EAB\u6216\u4E0D\u9650\u6B21\u53D6\u4EF6\u3002",\r
    'ad.notePrivileges': "\u5907\u6CE8\u540E\u514D\u9664\u8BBF\u5BA2\u4E0A\u4F20\u9650\u5236\uFF0C\u5E76\u5141\u8BB8\u6C38\u4E45\u3001\u4E0D\u9650\u6B21\u5206\u4EAB\uFF1B\u6E05\u7A7A\u5907\u6CE8\u6062\u590D\u9650\u5236\u3002",\r
    'ad.guestSaved': "\u5DF2\u4FDD\u5B58\uFF0C\u5C06\u7528\u4E8E\u540E\u7EED\u4E0A\u4F20",\r
    'policy.expiry': "1 ~ 30 \u5929",\r
    'policy.pickups': "1 \u6B21 \xB7 5 \u6B21",\r
    'policy.remaining': "\u672C\u5468\u5269\u4F59 {0} / {1} \u4E2A\u6587\u4EF6 \xB7 {2} \u91CD\u7F6E",\r
    'policy.unavailable': "\u6B63\u5728\u8BFB\u53D6\u4E0A\u4F20\u6743\u9650\uFF1B\u82E5\u957F\u65F6\u95F4\u672A\u6062\u590D\uFF0C\u8BF7\u5237\u65B0\u9875\u9762",\r
    'policy.contact': "\u6682\u4E0D\u63A5\u53D7\u6587\u4EF6\u4E0A\u4F20\uFF0C\u8BF7\u8054\u7CFB\u7BA1\u7406\u5458",\r
    'ad.fileDetails': '\u6587\u4EF6\u8BE6\u60C5',\r
    'ad.filename': '\u6587\u4EF6\u540D',\r
    'ad.fileType': '\u6587\u4EF6\u7C7B\u578B',\r
    'ad.cleanupAfter': '\u6700\u65E9\u6E05\u7406',\r
    'ad.retentionDays': '\u8FC7\u671F\u540E\u4FDD\u7559',\r
    'ad.days': '\u5929',\r
    'ad.save': '\u4FDD\u5B58',\r
    'ad.retry': '\u91CD\u8BD5',\r
    'ad.settingsSaved': '\u5DF2\u4FDD\u5B58\uFF0C\u5C06\u7528\u4E8E\u540E\u7EED\u6E05\u7406',\r
    'ad.source': '\u4E0A\u4F20\u6765\u6E90',\r
    'ad.visitor': '\u8BBF\u5BA2 {0}',\r
    'ad.visitorId': '\u8BBF\u5BA2\u6807\u8BC6',\r
    'ad.sourceUnknown': '\u672A\u77E5',\r
    'ad.sourceUnrecorded': '\u672A\u8BB0\u5F55',\r
    'ad.sourceLocation': 'IP \u5C5E\u5730',\r
    'ad.sourceTime': '\u8BB0\u5F55\u65F6\u95F4',\r
    'ad.sourceNote': '\u7BA1\u7406\u5458\u5907\u6CE8',\r
    'ad.sourceSave': '\u4FDD\u5B58\u5907\u6CE8',\r
    'ad.sourceClose': '\u5173\u95ED',\r
    'ad.sourceSaved': '\u5907\u6CE8\u5DF2\u4FDD\u5B58',\r
    'err.capacity': '\u5BB9\u91CF\u8D85\u51FA\u514D\u8D39\u989D\u5EA6',\r
    'err.capacityRemaining': '\u5BB9\u91CF\u8D85\u51FA\u514D\u8D39\u989D\u5EA6\uFF0C\u5269\u4F59\u53EF\u7528\u7A7A\u95F4\u7EA6 {0} GB\uFF08{1} \u5B57\u8282\uFF09\u3002',\r
    'doc.send': '\u6587\u4EF6\u4E2D\u8F6C\u7AD9 - \u53D1\u9001',\r
    'doc.pickup': '\u6587\u4EF6\u4E2D\u8F6C\u7AD9 - \u53D6\u4EF6',\r
    'doc.admin': '\u6587\u4EF6\u4E2D\u8F6C\u7AD9 - \u7BA1\u7406',\r
    'doc.404': '404 - \u6587\u4EF6\u4E2D\u8F6C\u7AD9',\r
\r
    'brand.name': '\u6587\u4EF6\u4E2D\u8F6C\u7AD9',\r
    'brand.tagline': '\u50CF\u53D6\u5FEB\u9012\u4E00\u6837\u53D6\u6587\u4EF6',\r
    'brand.pickup': '\u53D6\u4EF6',\r
    'brand.admin': '\u7BA1\u7406\u540E\u53F0',\r
    'nav.pickup': '\u53D6\u4EF6',\r
    'nav.send': '\u53D1\u9001',\r
    'nav.theme': '\u5207\u6362\u4E3B\u9898',\r
    'nav.lang': '\u5207\u6362\u8BED\u8A00',\r
    'foot': [\r
      '\u89C1\u5B57\u5982\u9762',\r
      '\u7EB8\u77ED\u60C5\u957F',\r
      '\u5C71\u9AD8\u6C34\u957F,\u540E\u4F1A\u6709\u671F',\r
      '\u6B64\u4EF6\u5DF2\u7B7E\u6536,\u671B\u73CD\u91CD',\r
      '\u98CE\u91CC\u96E8\u91CC,\u4E2D\u8F6C\u7AD9\u7B49\u4F60',\r
      '\u6162\u4E00\u70B9,\u4E5F\u6CA1\u5173\u7CFB',\r
    ],\r
\r
    'tab.file': '\u53D1\u6587\u4EF6',\r
    'tab.text': '\u53D1\u6587\u672C',\r
    'dz.click': '\u70B9\u51FB\u9009\u62E9\u6587\u4EF6',\r
    'dz.drop': ',\u6216\u62D6\u62FD / \u7C98\u8D34\u5230\u6B64\u5904',\r
    'dz.aria': '\u9009\u62E9\u6587\u4EF6',\r
    'dz.hint': '\u4E0A\u4F20\u540E\u751F\u6210 6 \u4F4D\u53D6\u4EF6\u53E3\u4EE4',\r
    'dz.hintMax': '\u5355\u4E2A\u6587\u4EF6\u6700\u5927 {0} \xB7 \u652F\u6301\u591A\u9009,\u4E0A\u4F20\u540E\u751F\u6210\u53D6\u4EF6\u53E3\u4EE4',\r
    'remove': '\u79FB\u9664',\r
    'text.placeholder': '\u7C98\u8D34\u6216\u8F93\u5165\u8981\u5206\u4EAB\u7684\u6587\u672C\u2026',\r
    'opt.expiry': '\u6709\u6548\u671F',\r
    'opt.pickups': '\u53EF\u53D6\u6B21\u6570',\r
    'seg.1d': '1 \u5929', 'seg.7d': '7 \u5929', 'seg.30d': '30 \u5929', 'seg.forever': '\u6C38\u4E45',\r
    'seg.p1': '1 \u6B21', 'seg.p5': '5 \u6B21', 'seg.punlimited': '\u4E0D\u9650',\r
    'btn.upload': '\u5F00\u59CB\u4E0A\u4F20',\r
    'btn.genCode': '\u751F\u6210\u53E3\u4EE4',\r
    'btn.cancel': '\u53D6\u6D88',\r
    'btn.copyCode': '\u590D\u5236\u53E3\u4EE4',\r
    'btn.copyLink': '\u590D\u5236\u94FE\u63A5',\r
    'btn.copyAll': '\u590D\u5236\u5168\u90E8\u53E3\u4EE4',\r
    'btn.again': '\u518D\u6765\u4E00\u4E2A',\r
\r
    'prog.preparing': '\u51C6\u5907\u4E2D\u2026',\r
    'prog.uploading': '\u4E0A\u4F20\u4E2D\u2026',\r
    'prog.init': '\u6B63\u5728\u68C0\u67E5\u53EF\u7528\u7A7A\u95F4\u2026',\r
    'prog.merging': '\u6B63\u5728\u5B8C\u6210\u4E0A\u4F20\u2026',\r
    'prog.file': '\u7B2C {0}/{1} \u4E2A',\r
    'prog.part': '\u7B2C {0}/{1} \u7247',\r
    'prog.eta': '\u5269\u4F59 {0}',\r
    'prog.retry': '\u4E0A\u4F20\u5931\u8D25,\u91CD\u8BD5 {0}/3\u2026',\r
\r
    'result.ok': '\u2705 \u5206\u4EAB\u6210\u529F,\u628A\u53E3\u4EE4\u53D1\u7ED9\u5BF9\u65B9',\r
    'result.okBatch': '\u2705 {0} \u4E2A\u6587\u4EF6\u5206\u4EAB\u6210\u529F',\r
    'ticket.title': '\u53D6\u4EF6\u51ED\u8BC1',\r
    'ticket.no': '\u2116 {0}',\r
    'send.cap': '\u5206\u4EAB\u5185\u5BB9',\r
    'receipt.cap': '\u5206\u4EAB\u7ED3\u679C',\r
    'ph.title': '\u7B49\u5F85\u5206\u4EAB',\r
    'ph.sub': '\u5206\u4EAB\u6210\u529F\u540E\uFF0C\u5728\u8FD9\u91CC\u590D\u5236\u53E3\u4EE4\u6216\u94FE\u63A5',\r
\r
    'flow.dropT': '\u5BC4\u4EF6',\r
    'flow.dropS': '\u9009\u62E9\u6587\u4EF6\u6216\u8F93\u5165\u6587\u672C',\r
    'flow.tickT': '\u5206\u4EAB\u53E3\u4EE4',\r
    'flow.tickS': '\u751F\u6210 6 \u4F4D\u53D6\u4EF6\u53E3\u4EE4',\r
    'flow.pickT': '\u53D6\u4EF6',\r
    'flow.pickS': '\u8F93\u5165\u53E3\u4EE4\u5373\u53EF\u4E0B\u8F7D\u6216\u67E5\u770B',\r
\r
    'route.senderT': '\u5BC4\u4EF6\u4EBA \xB7 \u4F60',\r
    'route.senderS': '\u9009\u62E9\u5185\u5BB9\uFF0C\u8BBE\u7F6E\u6709\u6548\u671F\u548C\u53EF\u53D6\u6B21\u6570',\r
    'route.relayT': '\u751F\u6210\u5206\u4EAB',\r
    'route.relayS': '\u628A\u53D6\u4EF6\u53E3\u4EE4\u6216\u94FE\u63A5\u53D1\u7ED9\u5BF9\u65B9',\r
    'route.takerT': '\u53D6\u4EF6\u4EBA \xB7 \u5BF9\u65B9',\r
    'route.takerS': '\u8F93\u5165\u53E3\u4EE4\u6216\u6253\u5F00\u94FE\u63A5\uFF0C\u5373\u53EF\u53D6\u4EF6',\r
    'route.fine': '\u53E3\u4EE4\u8BF7\u59A5\u5584\u4FDD\u7BA1\uFF0C\u4EC5\u5206\u4EAB\u7ED9\u9700\u8981\u7684\u4EBA',\r
\r
    'feat.splitT': '\u6587\u4EF6\u5206\u4EAB', 'feat.splitS': '\u5355\u6587\u4EF6\u6700\u5927 {0}',\r
    'feat.ttlT': '\u81EA\u9009\u6709\u6548\u671F', 'feat.ttlS': '1 ~ 30 \u5929\u6216\u6C38\u4E45',\r
    'feat.limitT': '\u9650\u6B21\u53D6\u4EF6', 'feat.limitS': '1 \u6B21 \xB7 5 \u6B21 \xB7 \u4E0D\u9650',\r
    'feat.selfT': '\u4FBF\u6377\u53D6\u4EF6', 'feat.selfS': '\u652F\u6301\u53E3\u4EE4\u3001\u94FE\u63A5\u548C\u626B\u7801\u53D6\u4EF6',\r
    'qr.hint': '\u626B\u7801\u76F4\u63A5\u53D6\u4EF6',\r
    'label.code': '\u53E3\u4EE4',\r
    'label.link': '\u94FE\u63A5',\r
    'copied': '{0}\u5DF2\u590D\u5236',\r
    'copy.fail': '\u590D\u5236\u5931\u8D25,\u8BF7\u624B\u52A8\u590D\u5236',\r
    'copied.btn': '\u2713 \u5DF2\u590D\u5236',\r
\r
    'meta.after': '{0}\u540E\u8FC7\u671F({1})',\r
    'meta.forever': '\u6C38\u4E45\u6709\u6548',\r
    'meta.pickups': '\u53EF\u53D6 {0} \u6B21',\r
    'meta.unlimited': '\u53D6\u4EF6\u6B21\u6570\u4E0D\u9650',\r
    'files.count': '{0} \u4E2A\u6587\u4EF6 \xB7 \u5171 {1}',\r
    'unknown.type': '\u672A\u77E5\u7C7B\u578B',\r
    'text.counter': '{0} / {1}',\r
\r
    'err.oversize': '\u6587\u4EF6\u8D85\u8FC7 {0} \u4E0A\u9650({1})',\r
    'err.empty': '\u7A7A\u6587\u4EF6\u4E0D\u80FD\u5206\u4EAB',\r
    'err.tooMany': '\u4E00\u6B21\u6700\u591A\u5206\u4EAB {0} \u4E2A\u6587\u4EF6',\r
    'err.upload': '\u4E0A\u4F20\u5931\u8D25,\u8BF7\u91CD\u8BD5',\r
    'err.submit': '\u63D0\u4EA4\u5931\u8D25',\r
    'req.fail': '\u8BF7\u6C42\u5931\u8D25 ({0})',\r
    'toast.cancelled': '\u5DF2\u53D6\u6D88\u4E0A\u4F20',\r
\r
    'dur.s': '{0} \u79D2',\r
    'dur.ms': '<1 \u79D2',\r
    'dur.hm': '{0} \u5206 {1} \u79D2',\r
    'dur.h': '{0} \u5206',\r
    'dur.hH': '{0} \u65F6 {1} \u5206',\r
    'dur.hH2': '{0} \u65F6',\r
    'dur.d': '{0} \u5929',\r
\r
    'pk.title': '\u8F93\u5165\u53D6\u4EF6\u53E3\u4EE4',\r
    'pk.sub': '\u8F93\u5165 6 \u4F4D\u6570\u5B57\u53E3\u4EE4,\u53D6\u51FA\u5206\u4EAB\u7684\u6587\u4EF6\u6216\u6587\u672C',\r
    'pk.aria': '6 \u4F4D\u53D6\u4EF6\u53E3\u4EE4',\r
    'pk.fail': '\u53D6\u4EF6\u5931\u8D25',\r
    'pk.textChars': '\u6587\u672C \xB7 {0} \u5B57\u7B26',\r
    'pk.copyAllText': '\u4E00\u952E\u590D\u5236\u5168\u6587',\r
    'pk.download': '\u2B07 \u4E0B\u8F7D\u6587\u4EF6',\r
    'pk.again': '\u91CD\u65B0\u8F93\u5165',\r
    'pk.expireAt': '{0} \u8FC7\u671F',\r
    'pk.left': '\u5269\u4F59\u53EF\u53D6 {0} \u6B21',\r
    'pk.unnamed': '\u672A\u547D\u540D\u6587\u4EF6',\r
    'copied.text': '\u5DF2\u590D\u5236\u5168\u6587',\r
\r
    'ad.loginTitle': '\u7BA1\u7406\u767B\u5F55',\r
    'ad.loginSub': '\u8F93\u5165\u90E8\u7F72\u65F6\u8BBE\u7F6E\u7684\u7BA1\u7406\u4EE4\u724C(ADMIN_TOKEN)',\r
    'ad.tokenPh': '\u7BA1\u7406\u4EE4\u724C',\r
    'ad.login': '\u767B\u5F55',\r
    'ad.badToken': '\u4EE4\u724C\u65E0\u6548',\r
    'ad.total': '\u5206\u4EAB\u603B\u6570',\r
    'ad.active': '\u5F53\u524D\u6709\u6548',\r
    'ad.files': '\u6587\u4EF6',\r
    'ad.texts': '\u6587\u672C',\r
    'ad.storage': '\u5B58\u50A8\u7A7A\u95F4 \xB7 \u5DF2\u7528 / \u603B\u5BB9\u91CF',\r
    'ad.storageReserved': '\u542B\u4E0A\u4F20\u9884\u7559\u7A7A\u95F4',\r
    'ad.storageUnavailable': '\u6682\u4E0D\u53EF\u7528',\r
    'ad.shareBytes': '\u5206\u4EAB\u5185\u5BB9\u5927\u5C0F',\r
    'ad.today': '\u4ECA\u65E5\u65B0\u589E',\r
    'ad.th.code': '\u53E3\u4EE4', 'ad.th.kind': '\u7C7B\u578B', 'ad.th.content': '\u5185\u5BB9',\r
    'ad.th.size': '\u5927\u5C0F', 'ad.th.pickups': '\u5DF2\u53D6/\u4E0A\u9650', 'ad.th.expire': '\u8FC7\u671F\u65F6\u95F4',\r
    'ad.th.status': '\u72B6\u6001', 'ad.th.created': '\u521B\u5EFA\u65F6\u95F4',\r
    'ad.kind.file': '\u6587\u4EF6', 'ad.kind.text': '\u6587\u672C',\r
    'ad.st.active': '\u6709\u6548', 'ad.st.expired': '\u5DF2\u8FC7\u671F', 'ad.st.exhausted': '\u5DF2\u53D6\u5B8C',\r
    'ad.loading': '\u52A0\u8F7D\u4E2D\u2026',\r
    'ad.empty': '\u6682\u65E0\u5206\u4EAB',\r
    'ad.loadFail': '\u52A0\u8F7D\u5931\u8D25',\r
    'ad.page': '\u7B2C {0} / {1} \u9875 \xB7 \u5171 {2} \u6761',\r
    'ad.prev': '\u4E0A\u4E00\u9875', 'ad.next': '\u4E0B\u4E00\u9875',\r
    'ad.refresh': '\u21BB \u5237\u65B0',\r
    'ad.logout': '\u9000\u51FA\u767B\u5F55',\r
    'ad.download': '\u4E0B\u8F7D',\r
    'ad.delete': '\u5220\u9664',\r
    'ad.deleted': '\u5DF2\u5220\u9664',\r
    'ad.deleteFail': '\u5220\u9664\u5931\u8D25',\r
    'ad.delTitle': '\u4F5C\u5E9F\u8FD9\u5F20\u53D6\u4EF6\u51ED\u8BC1?',\r
    'ad.delWarn': '\u4F5C\u5E9F\u540E\u53E3\u4EE4\u7ACB\u5373\u5931\u6548,\u5BF9\u65B9\u5C06\u65E0\u6CD5\u53D6\u4EF6,\u4E14\u4E0D\u53EF\u6062\u590D\u3002',\r
    'ad.delOk': '\u786E\u8BA4\u4F5C\u5E9F',\r
    'ad.textFallback': '(\u6587\u672C)',\r
    'ad.unnamed': '(\u672A\u547D\u540D)',\r
    'ad.chars': '{0} \u5B57',\r
    'ad.forever': '\u6C38\u4E45',\r
\r
    'nf.title': '\u9875\u9762\u4E0D\u5B58\u5728',\r
    'nf.body': '\u4F60\u8981\u627E\u7684\u9875\u9762\u4E0D\u5728\u4E2D\u8F6C\u7AD9\u91CC',\r
    'nf.send': '\u53BB\u53D1\u9001',\r
    'nf.pickup': '\u53BB\u53D6\u4EF6',\r
  },\r
\r
  en: {\r
    'audit.detail.filename': 'Filename',\r
    'audit.detail.sizeBytes': 'Size (bytes)',\r
    'audit.navigation': "Admin pages",\r
    'audit.files': "Files",\r
    'audit.title': "Audit logs",\r
    'audit.retention': "Last 30 days, up to 1,000 entries; times shown in your local timezone",\r
    'audit.export': "Export results",\r
    'audit.categories': "Log categories",\r
    'audit.all': "All logs",\r
    'audit.login': "Login logs",\r
    'audit.operation': "Operations",\r
    'audit.security': "Security",\r
    'audit.result': "Result",\r
    'audit.anyResult': "All results",\r
    'audit.success': "Success",\r
    'audit.failed': "Failed",\r
    'audit.blocked': "Blocked",\r
    'audit.from': "Start date",\r
    'audit.to': "End date",\r
    'audit.keyword': "IP / Target",\r
    'audit.search': "Search IP or pickup code",\r
    'audit.filter': "Filter",\r
    'audit.reset': "Reset",\r
    'audit.time': "Time",\r
    'audit.action': "Action",\r
    'audit.actor': "Actor",\r
    'audit.source': "Source IP / Location",\r
    'audit.target': "Target",\r
    'audit.details': "Details",\r
    'audit.empty': "No matching logs. Recording starts when this feature is deployed.",\r
    'audit.disabled': "Audit logging is not enabled: bind R2 or D1.",\r
    'audit.page': "Page {0} / {1} \xB7 {2} entries",\r
    'audit.dateError': "Start date must not be after end date",\r
    'audit.http': "Request / Status",\r
    'audit.duration': "Processing time",\r
    'audit.id': "Log ID",\r
    'audit.agent': "Browser identifier (client supplied)",\r
    'audit.yes': "Yes",\r
    'audit.no': "No",\r
    'audit.description': "Description",\r
    'audit.downloadHint': "The file stream was opened; this does not confirm the browser finished downloading.",\r
    'audit.writeFailed': "The operation was processed, but its audit record could not be saved. Check log storage.",\r
    'audit.action.login': "Admin login",\r
    'audit.action.logout': "Log out",\r
    'audit.action.retention': "Change expired retention",\r
    'audit.action.uploadPolicy': "Change weekly upload quota",\r
    'audit.action.unblock': "Unblock IP",\r
    'audit.action.cleanup': "Run expired cleanup",\r
    'audit.action.export': "Export audit logs",\r
    'audit.action.ban': "Trigger login ban",\r
    'audit.action.delete': "Delete share",\r
    'audit.action.note': "Change visitor note",\r
    'audit.action.viewSource': "View source details",\r
    'audit.action.download': "Download file",\r
    'audit.actor.admin': "Administrator",\r
    'audit.actor.token': "Scheduler / Token",\r
    'audit.actor.anonymous': "Unauthenticated",\r
    'audit.detail.bannedUntil': "Blocked until",\r
    'audit.detail.expiredRetentionDays': "Expired retention days",\r
    'audit.detail.weeklyFileLimit': "Weekly upload limit",\r
    'audit.detail.notePresent': "Note set",\r
    'audit.detail.alreadyDeleted': "Share already absent",\r
    'audit.detail.deletedShares': "Shares deleted",\r
    'audit.detail.abortedSessions': "Upload sessions aborted",\r
\r
    'ad.loginProtection': "Login protection",\r
    'ad.guardRule': "{1} failures in {0} minutes block login for {2} minutes",\r
    'ad.guardDisabled': "Not enabled: bind R2 or D1",\r
    'ad.guardEmpty': "No blocked IPs",\r
    'ad.guardUnknown': "Unknown source (shared limit)",\r
    'ad.guardFailures': "{0} failures",\r
    'ad.guardUntil': "Unblocks at {0}",\r
    'ad.guardLast': "Last failure {0}",\r
    'ad.guardUnblock': "Unblock",\r
    'ad.guardUnblocked': "IP unblocked",\r
    'ad.loginBlocked': "Too many failed logins. Wait until the block expires.",\r
    'ad.guardUnavailable': "Login protection unavailable. Please try again later.",\r
\r
    'ad.formatUnknown': "Unknown format",\r
    'ad.format.archive': "Archive",\r
    'ad.format.program': "Application",\r
    'ad.format.document': "Document",\r
    'ad.format.image': "Image",\r
    'ad.format.video': "Video",\r
    'ad.format.audio': "Audio",\r
    'ad.format.text': "Text / code",\r
    'ad.format.file': "File",\r
    'ad.uploader': "Uploaded by",\r
    'ad.shareState': "Share status",\r
    'ad.fileAvailability': "File status",\r
    'ad.fileState.available': "Available",\r
    'ad.fileState.missing': "File missing",\r
    'ad.fileState.unknown': "Unable to verify",\r
    'ad.timeLeft': "{0} left",\r
    'ad.timeExpired': "Expired {0} ago",\r
    'ad.cleanupPermanent': "No automatic cleanup",\r
    'ad.cleanupActive': "Kept for {0} days after expiry",\r
    'ad.cleanupRetained': "Retained after expiry",\r
    'ad.cleanupPending': "Awaiting cleanup",\r
    'ad.technical': "Technical details",\r
    'ad.storedSize': "Stored size",\r
    'ad.storedAt': "Stored at",\r
    'ad.exactBytes': "{0} bytes",\r
    'ad.formatHint': "Format is inferred from the filename; content has not been verified.",\r
    'ad.tryDownload': "Try download",\r
    'ad.guestLimits': "Unnoted visitor limits",\r
    'ad.weeklyFiles': "Files per week",\r
    'ad.guestRules': "Resets Monday, Beijing time. Accepted uploads count even if cancelled. Unnoted visitors cannot create permanent or unlimited-pickup shares.",\r
    'ad.notePrivileges': "A note grants unrestricted guest uploads and permanent/unlimited-pickup shares. Clear it to restore restrictions.",\r
    'ad.guestSaved': "Saved for subsequent uploads",\r
    'policy.expiry': "1 to 30 days",\r
    'policy.pickups': "1 or 5 pickups",\r
    'policy.remaining': "{0} / {1} files left this week \xB7 resets {2}",\r
    'policy.unavailable': "Loading upload permissions. Refresh if this persists.",\r
    'policy.contact': "File uploads are unavailable. Contact the administrator.",\r
    'ad.fileDetails': 'File details',\r
    'ad.filename': 'Filename',\r
    'ad.fileType': 'File type',\r
    'ad.cleanupAfter': 'Cleanup after',\r
    'ad.retentionDays': 'Keep after expiry',\r
    'ad.days': 'days',\r
    'ad.save': 'Save',\r
    'ad.retry': 'Retry',\r
    'ad.settingsSaved': 'Saved for subsequent cleanup runs',\r
    'ad.source': 'Upload source',\r
    'ad.visitor': 'Visitor {0}',\r
    'ad.visitorId': 'Visitor ID',\r
    'ad.sourceUnknown': 'Unknown',\r
    'ad.sourceUnrecorded': 'Not recorded',\r
    'ad.sourceLocation': 'IP location',\r
    'ad.sourceTime': 'Recorded at',\r
    'ad.sourceNote': 'Admin note',\r
    'ad.sourceSave': 'Save note',\r
    'ad.sourceClose': 'Close',\r
    'ad.sourceSaved': 'Note saved',\r
    'err.capacity': 'Storage capacity exceeds the free quota.',\r
    'err.capacityRemaining': 'Storage capacity exceeds the free quota. Available space: approximately {0} GB ({1} bytes).',\r
    'doc.send': 'file-relay - Send',\r
    'doc.pickup': 'file-relay - Pickup',\r
    'doc.admin': 'file-relay - Admin',\r
    'doc.404': '404 - file-relay',\r
\r
    'brand.name': 'file-relay',\r
    'brand.tagline': 'Files, picked up like parcels',\r
    'brand.pickup': 'Pickup',\r
    'brand.admin': 'Admin',\r
    'nav.pickup': 'Pick up',\r
    'nav.send': 'Send',\r
    'nav.theme': 'Toggle theme',\r
    'nav.lang': 'Switch language',\r
    'foot': [\r
      'Yours, from afar',\r
      'Words run short, feelings run long',\r
      'See you down the road',\r
      'Signed, sealed, delivered',\r
      'Through wind and rain, the relay waits',\r
      'Take care, until next time',\r
    ],\r
\r
    'tab.file': 'Send file',\r
    'tab.text': 'Send text',\r
    'dz.click': 'Click to choose files',\r
    'dz.drop': ', or drag & drop / paste here',\r
    'dz.aria': 'Choose files',\r
    'dz.hint': 'A 6-digit pickup code is generated after upload',\r
    'dz.hintMax': 'Up to {0} per file \xB7 multiple selection supported',\r
    'remove': 'Remove',\r
    'text.placeholder': 'Paste or type the text to share\u2026',\r
    'opt.expiry': 'Expires',\r
    'opt.pickups': 'Pickup limit',\r
    'seg.1d': '1 day', 'seg.7d': '7 days', 'seg.30d': '30 days', 'seg.forever': 'Forever',\r
    'seg.p1': '1\xD7', 'seg.p5': '5\xD7', 'seg.punlimited': 'Unlimited',\r
    'btn.upload': 'Start upload',\r
    'btn.genCode': 'Generate code',\r
    'btn.cancel': 'Cancel',\r
    'btn.copyCode': 'Copy code',\r
    'btn.copyLink': 'Copy link',\r
    'btn.copyAll': 'Copy all codes',\r
    'btn.again': 'New share',\r
\r
    'prog.preparing': 'Preparing\u2026',\r
    'prog.uploading': 'Uploading\u2026',\r
    'prog.init': 'Checking available space\u2026',\r
    'prog.merging': 'Finishing upload\u2026',\r
    'prog.file': 'file {0}/{1}',\r
    'prog.part': 'part {0}/{1}',\r
    'prog.eta': 'ETA {0}',\r
    'prog.retry': 'Upload failed, retrying {0}/3\u2026',\r
\r
    'result.ok': '\u2705 Shared! Send the code to the recipient',\r
    'result.okBatch': '\u2705 {0} files shared successfully',\r
    'ticket.title': 'PICKUP TICKET',\r
    'ticket.no': '\u2116 {0}',\r
    'send.cap': 'SHARE CONTENT',\r
    'receipt.cap': 'SHARE RESULTS',\r
    'ph.title': 'READY TO SHARE',\r
    'ph.sub': 'Copy your pickup code or link here after sharing',\r
\r
    'flow.dropT': 'Send',\r
    'flow.dropS': 'Choose files or enter text',\r
    'flow.tickT': 'Ticket',\r
    'flow.tickS': 'A 6-digit pickup code is issued',\r
    'flow.pickT': 'Pick up',\r
    'flow.pickS': 'The recipient claims it with the code',\r
\r
    'route.senderT': 'Sender \xB7 you',\r
    'route.senderS': 'Choose content, expiry and pickup limit',\r
    'route.relayT': 'Create a share',\r
    'route.relayS': 'Send the pickup code or link to the recipient',\r
    'route.takerT': 'Recipient',\r
    'route.takerS': 'Enter the code or open the link to pick up',\r
    'route.fine': 'Keep the code private; share only with your recipients',\r
\r
    'feat.splitT': 'File sharing', 'feat.splitS': 'Up to {0} per file',\r
    'feat.ttlT': 'You set the clock', 'feat.ttlS': '1-30 days, or forever',\r
    'feat.limitT': 'Limited pickups', 'feat.limitS': '1\xD7 \xB7 5\xD7 \xB7 unlimited',\r
    'feat.selfT': 'Easy pickup', 'feat.selfS': 'Use a code, link or QR code',\r
    'qr.hint': 'Scan to pick up',\r
    'label.code': 'code',\r
    'label.link': 'link',\r
    'copied': '{0} copied',\r
    'copy.fail': 'Copy failed, please copy manually',\r
    'copied.btn': '\u2713 Copied',\r
\r
    'meta.after': 'Expires in {0} ({1})',\r
    'meta.forever': 'Never expires',\r
    'meta.pickups': '{0} pickups allowed',\r
    'meta.unlimited': 'Unlimited pickups',\r
    'files.count': '{0} files \xB7 {1} total',\r
    'unknown.type': 'unknown type',\r
    'text.counter': '{0} / {1}',\r
\r
    'err.oversize': 'File exceeds the {0} limit ({1})',\r
    'err.empty': 'Empty files cannot be shared',\r
    'err.tooMany': 'Up to {0} files per batch',\r
    'err.upload': 'Upload failed, please retry',\r
    'err.submit': 'Submission failed',\r
    'req.fail': 'Request failed ({0})',\r
    'toast.cancelled': 'Upload cancelled',\r
\r
    'dur.s': '{0}s',\r
    'dur.ms': '<1s',\r
    'dur.hm': '{0}m {1}s',\r
    'dur.h': '{0}m',\r
    'dur.hH': '{0}h {1}m',\r
    'dur.hH2': '{0}h',\r
    'dur.d': '{0}d',\r
\r
    'pk.title': 'Enter pickup code',\r
    'pk.sub': 'Enter the 6-digit code to retrieve the shared file or text',\r
    'pk.aria': '6-digit pickup code',\r
    'pk.fail': 'Pickup failed',\r
    'pk.textChars': 'Text \xB7 {0} chars',\r
    'pk.copyAllText': 'Copy all text',\r
    'pk.download': '\u2B07 Download file',\r
    'pk.again': 'Try another code',\r
    'pk.expireAt': 'Expires {0}',\r
    'pk.left': '{0} pickups left',\r
    'pk.unnamed': 'Untitled file',\r
    'copied.text': 'Full text copied',\r
\r
    'ad.loginTitle': 'Admin login',\r
    'ad.loginSub': 'Enter the admin token (ADMIN_TOKEN) set at deployment',\r
    'ad.tokenPh': 'Admin token',\r
    'ad.login': 'Log in',\r
    'ad.badToken': 'Invalid token',\r
    'ad.total': 'Total shares',\r
    'ad.active': 'Active',\r
    'ad.files': 'Files',\r
    'ad.texts': 'Texts',\r
    'ad.storage': 'Storage \xB7 used / capacity',\r
    'ad.storageReserved': 'Includes upload reservations',\r
    'ad.storageUnavailable': 'Unavailable',\r
    'ad.shareBytes': 'Shared content size',\r
    'ad.today': 'New today',\r
    'ad.th.code': 'Code', 'ad.th.kind': 'Type', 'ad.th.content': 'Content',\r
    'ad.th.size': 'Size', 'ad.th.pickups': 'Picked/Limit', 'ad.th.expire': 'Expires',\r
    'ad.th.status': 'Status', 'ad.th.created': 'Created',\r
    'ad.kind.file': 'File', 'ad.kind.text': 'Text',\r
    'ad.st.active': 'Active', 'ad.st.expired': 'Expired', 'ad.st.exhausted': 'Exhausted',\r
    'ad.loading': 'Loading\u2026',\r
    'ad.empty': 'No shares yet',\r
    'ad.loadFail': 'Failed to load',\r
    'ad.page': 'Page {0} / {1} \xB7 {2} total',\r
    'ad.prev': 'Prev', 'ad.next': 'Next',\r
    'ad.refresh': '\u21BB Refresh',\r
    'ad.logout': 'Log out',\r
    'ad.download': 'Download',\r
    'ad.delete': 'Delete',\r
    'ad.deleted': 'Deleted',\r
    'ad.deleteFail': 'Delete failed',\r
    'ad.delTitle': 'Void this ticket?',\r
    'ad.delWarn': 'The code stops working immediately, the recipient can no longer pick it up, and this cannot be undone.',\r
    'ad.delOk': 'Void it',\r
    'ad.textFallback': '(text)',\r
    'ad.unnamed': '(unnamed)',\r
    'ad.chars': '{0} chars',\r
    'ad.forever': 'Forever',\r
\r
    'nf.title': 'Page not found',\r
    'nf.body': "The page you're looking for isn't in this relay",\r
    'nf.send': 'Send files',\r
    'nf.pickup': 'Pick up',\r
  },\r
};\r
\r
export let LANG =\r
  localStorage.getItem('lang') ||\r
  ((navigator.language || '').toLowerCase().startsWith('en') ? 'en' : 'zh');\r
\r
/** \u53D6\u8BCD:\u5F53\u524D\u8BED\u8A00 \u2192 \u4E2D\u6587\u515C\u5E95 \u2192 key \u672C\u8EAB;\u6570\u7EC4\u503C\u968F\u673A\u53D6\u4E00\u6761;{0}{1}\u2026 \u4F9D\u6B21\u66FF\u6362 */\r
export function t(key, ...args) {\r
  let s = (DICT[LANG] && DICT[LANG][key]) ?? DICT.zh[key] ?? key;\r
  if (Array.isArray(s)) s = s[Math.floor(Math.random() * s.length)];\r
  args.forEach((v, i) => { s = s.replaceAll(\`{\${i}}\`, String(v)); });\r
  return s;\r
}\r
\r
const rerenders = [];\r
/** \u5404\u9875\u9762\u767B\u8BB0:\u8BED\u8A00\u5207\u6362\u540E\u91CD\u7B97\u52A8\u6001\u6587\u6848 */\r
export function onLangChange(fn) { rerenders.push(fn); }\r
\r
function applyLang() {\r
  document.documentElement.lang = LANG === 'en' ? 'en' : 'zh-CN';\r
  document.querySelectorAll('[data-i18n]').forEach((n) => { n.textContent = t(n.dataset.i18n); });\r
  document.querySelectorAll('[data-i18n-ph]').forEach((n) => { n.placeholder = t(n.dataset.i18nPh); });\r
  document.querySelectorAll('[data-i18n-title]').forEach((n) => { n.title = t(n.dataset.i18nTitle); });\r
  document.querySelectorAll('[data-i18n-aria]').forEach((n) => { n.setAttribute('aria-label', t(n.dataset.i18nAria)); });\r
  const btn = document.getElementById('lang-btn');\r
  if (btn) btn.textContent = LANG === 'en' ? '\u4E2D' : 'EN';\r
}\r
\r
export function initI18n() {\r
  applyLang();\r
  document.getElementById('lang-btn')?.addEventListener('click', () => {\r
    LANG = LANG === 'en' ? 'zh' : 'en';\r
    localStorage.setItem('lang', LANG);\r
    applyLang();\r
    rerenders.forEach((fn) => fn());\r
  });\r
}\r
`, "js/index.js": "import { $, $$, api, fmtBytes, fmtDate, fmtDuration, iconFor, copyText, toast, initTheme, el } from './common.js';\nimport { t, onLangChange, initI18n } from './i18n.js';\n\ninitTheme();\ninitI18n();\n\nconst els = {\n  dropzone: $('#dropzone'),\n  dzHint: $('#dz-hint'),\n  fileInput: $('#file-input'),\n  fileList: $('#file-list'),\n  textInput: $('#text-input'),\n  textCounter: $('#text-counter'),\n  btnUpload: $('#btn-upload'),\n  btnText: $('#btn-text'),\n  progress: $('#progress'),\n  progressFill: $('#progress-fill'),\n  progressText: $('#progress-text'),\n  btnCancel: $('#btn-cancel'),\n  results: $('#results'),\n  placeholder: $('#result-placeholder'),\n  capDate: $('#cap-date'),\n};\n\nconst MAX_SIZE_FALLBACK = 25 * 1024 * 1024;\nconst MAX_BATCH = 10;\nlet cfg = { fileBackend: 'kv', maxFileSize: MAX_SIZE_FALLBACK }; // /api/config \u52A0\u8F7D\u540E\u8986\u76D6\nlet MAX_SIZE = MAX_SIZE_FALLBACK;\nlet policyReady = false;\n\nlet files = []; // \u5F85\u4E0A\u4F20\u961F\u5217(File[])\nlet queueUI = new Map(); // File \u2192 { row, bar, status }\nlet queueState = new Map(); // File \u2192 'idle' | { done: code } | 'fail'(\u8BED\u8A00\u5207\u6362\u540E\u91CD\u6E32\u67D3\u7528)\nlet session = null; // \u8FDB\u884C\u4E2D\u7684 R2 \u5206\u7247\u4F1A\u8BDD { uploadId, partSize, parts }\nlet currentXhr = null;\nlet cancelled = false;\nlet uploading = false;\nlet lastResults = [];\n\n/* \u670D\u52A1\u7AEF\u914D\u7F6E:\u51B3\u5B9A\u8D70\u5206\u7247\u4E0A\u4F20(R2 \u5927\u5B58\u50A8)\u8FD8\u662F\u5355\u8BF7\u6C42\u76F4\u4F20(KV \u5C0F\u5B58\u50A8) */\nfunction canUploadFiles() {\n  return policyReady && cfg.fileBackend !== 'none' && cfg.fileUploadAvailable !== false && cfg.uploadsRemaining !== 0;\n}\nfunction updateHint() {\n  els.dzHint.textContent = t('dz.hintMax', fmtBytes(MAX_SIZE));\n  const feature = $('[data-i18n=\"feat.splitS\"]');\n  if (feature) feature.textContent = t('feat.splitS', fmtBytes(MAX_SIZE));\n  for (const [id, value, allowed, fallback] of [\n    ['seg-expiry', 'forever', cfg.allowPermanent === true, '7d'],\n    ['seg-pickups', 'null', cfg.allowUnlimited === true, '5'],\n  ]) {\n    const button = $(`#${id} [data-v=\"${value}\"]`);\n    button.disabled = !allowed;\n    if (!allowed && button.classList.contains('active')) {\n      button.classList.remove('active');\n      $(`#${id} [data-v=\"${fallback}\"]`).classList.add('active');\n    }\n  }\n  $('[data-i18n=\"feat.ttlS\"]').textContent = t(cfg.allowPermanent ? 'feat.ttlS' : 'policy.expiry');\n  $('[data-i18n=\"feat.limitS\"]').textContent = t(cfg.allowUnlimited ? 'feat.limitS' : 'policy.pickups');\n  $('#upload-policy-hint').textContent = !policyReady ? t('policy.unavailable')\n    : cfg.fileUploadAvailable === false ? t('policy.contact')\n    : cfg.weeklyFileLimit !== null && cfg.weeklyFileLimit !== undefined\n      ? t('policy.remaining', cfg.uploadsRemaining, cfg.weeklyFileLimit, fmtDate(cfg.uploadsResetAt)) : '';\n}\nasync function refreshPolicy() {\n  try {\n    cfg = await api('/api/config');\n    if (!Number.isSafeInteger(cfg.maxFileSize) || (cfg.maxFileSize < 0 || (cfg.maxFileSize === 0 && cfg.fileBackend !== 'none'))) throw new Error('Invalid upload policy');\n    MAX_SIZE = cfg.maxFileSize;\n    policyReady = true;\n  } catch { policyReady = false; }\n  updateHint();\n  setBusy(uploading);\n}\nupdateHint();\nrefreshPolicy();\n\n/* \u5BC4\u4EF6\u5355\u62AC\u5934\u65E5\u671F(\u88C5\u9970) */\nif (els.capDate) els.capDate.textContent = fmtDate(Date.now()).split(' ')[0];\n\n/* \u8BED\u8A00\u5207\u6362:\u91CD\u7B97\u52A8\u6001\u6587\u6848\u4E0E\u7ED3\u679C\u5361\u7247 */\nonLangChange(() => {\n  if (cfg.maxFileSize) updateHint();\n  renderQueue();\n  if (lastResults.length) showResults(lastResults);\n});\n\n/* ---------- tabs ---------- */\n$$('.tab').forEach((tb) =>\n  tb.addEventListener('click', () => {\n    if (uploading) return; // \u4E0A\u4F20\u4E2D\u7981\u6B62\u5207\u6362\n    $$('.tab').forEach((x) => x.classList.toggle('active', x === tb));\n    const tab = tb.dataset.tab;\n    $('#panel-file').hidden = tab !== 'file';\n    $('#panel-text').hidden = tab !== 'text';\n    els.btnUpload.hidden = tab !== 'file';\n    els.btnText.hidden = tab !== 'text';\n    hideResult();\n  }),\n);\n\n/* ---------- segmented \u9009\u9879 ---------- */\nfor (const id of ['seg-expiry', 'seg-pickups']) {\n  $(`#${id}`).addEventListener('click', (e) => {\n    const b = e.target.closest('button');\n    if (!b || b.disabled) return;\n    $$('button', $(`#${id}`)).forEach((x) => x.classList.toggle('active', x === b));\n  });\n}\nfunction readOptions() {\n  const exp = $('#seg-expiry .active').dataset.v;\n  const pk = $('#seg-pickups .active').dataset.v;\n  return { expiry: exp, maxPickups: pk === 'null' ? null : Number(pk) };\n}\n\n/* ---------- \u6587\u4EF6\u961F\u5217:\u70B9\u51FB / \u5168\u7A97\u53E3\u62D6\u62FD / \u667A\u80FD\u7C98\u8D34,\u518D\u9009\u5373\u6574\u4F53\u66FF\u6362 ---------- */\nels.dropzone.addEventListener('click', () => els.fileInput.click());\nels.dropzone.addEventListener('keydown', (e) => {\n  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); els.fileInput.click(); }\n});\nels.fileInput.addEventListener('change', () => {\n  setFiles([...els.fileInput.files]);\n  els.fileInput.value = '';\n});\n\nfunction showTab(name) {\n  const tb = $(`.tab[data-tab=\"${name}\"]`);\n  if (tb && !tb.classList.contains('active')) tb.click(); // \u4E0A\u4F20\u4E2D\u65F6 tab \u5904\u7406\u5668\u81EA\u5DF1\u4F1A\u62D2\u7EDD\n}\n\n/* \u62D6\u5230\u9875\u9762\u4EFB\u610F\u4F4D\u7F6E\u90FD\u9AD8\u4EAE\u5E76\u53EF\u653E\u4E0B(\u4E0D\u518D\u8981\u6C42\u7CBE\u786E\u547D\u4E2D\u62D6\u62FD\u533A) */\nlet dragDepth = 0;\nwindow.addEventListener('dragenter', (e) => {\n  if (![...(e.dataTransfer?.types || [])].includes('Files')) return;\n  dragDepth++;\n  if (!uploading) els.dropzone.classList.add('dragover');\n});\nwindow.addEventListener('dragleave', () => {\n  if (--dragDepth <= 0) { dragDepth = 0; els.dropzone.classList.remove('dragover'); }\n});\nwindow.addEventListener('dragover', (e) => e.preventDefault());\nwindow.addEventListener('drop', (e) => {\n  e.preventDefault();\n  dragDepth = 0;\n  els.dropzone.classList.remove('dragover');\n  if (e.dataTransfer?.files?.length) setFiles([...e.dataTransfer.files]);\n});\n\n/* \u7C98\u8D34\u667A\u80FD\u8DEF\u7531:\u7C98\u8D34\u6587\u4EF6\u2192\u6587\u4EF6\u9875;\u6587\u4EF6\u9875\u7C98\u8D34\u7EAF\u6587\u672C\u2192\u81EA\u52A8\u5207\u5230\u6587\u672C\u9875 */\ndocument.addEventListener('paste', (e) => {\n  if (e.target?.closest?.('textarea, input')) return; // \u8F93\u5165\u6846\u5185\u7C98\u8D34\u8D70\u9ED8\u8BA4\u884C\u4E3A\n  if (e.clipboardData?.files?.length) {\n    setFiles([...e.clipboardData.files]);\n    return;\n  }\n  const text = e.clipboardData?.getData('text/plain');\n  if (text && $('#panel-text').hidden) {\n    showTab('text');\n    els.textInput.value = text;\n    els.textInput.dispatchEvent(new Event('input'));\n  }\n});\n\nfunction setFiles(list) {\n  if (uploading) return;\n  const ok = [];\n  for (const f of list) {\n    if (f.size > MAX_SIZE) { toast(t('err.oversize', fmtBytes(MAX_SIZE), fmtBytes(f.size)), 'error'); continue; }\n    if (f.size < 1) { toast(t('err.empty'), 'error'); continue; }\n    ok.push(f);\n  }\n  if (ok.length > MAX_BATCH) {\n    toast(t('err.tooMany', MAX_BATCH), 'error');\n    ok.length = MAX_BATCH;\n  }\n  files = ok; // \u66FF\u6362\u8BED\u4E49:\u518D\u6B21\u9009\u62E9\u5373\u91CD\u7F6E\u961F\u5217\n  queueState = new Map(files.map((f) => [f, 'idle']));\n  renderQueue();\n  els.btnUpload.disabled = files.length === 0 || !canUploadFiles();\n  hideResult();\n}\n\nfunction statusText(f, st) {\n  if (st === 'fail') return '\u2717';\n  if (st && st.done) return `\u2713 ${st.done}`;\n  return fmtBytes(f.size);\n}\n\nfunction renderQueue() {\n  els.fileList.replaceChildren();\n  queueUI = new Map();\n  files.forEach((f) => {\n    const st = queueState.get(f) || 'idle';\n    const bar = el('div', { class: 'fr-bar' });\n    const status = el('small', { class: 'fr-status' }, statusText(f, st));\n    const row = el('div', {\n      class: `file-row${st === 'fail' ? ' fail' : ''}${st && st.done ? ' done' : ''}`,\n    });\n    row.replaceChildren(\n      el('span', { class: 'fr-icon' }, iconFor(f.name, f.type)),\n      el('div', { class: 'fr-meta' },\n        el('b', { title: f.name }, f.name),\n        el('small', {}, `${fmtBytes(f.size)} \xB7 ${f.type || t('unknown.type')}`),\n      ),\n      status,\n      el('button', { class: 'icon-btn fr-remove', title: t('remove'), type: 'button', onclick: () => removeFile(f) }, '\u2715'),\n      bar,\n    );\n    if (st && st.done) bar.style.width = '100%';\n    queueUI.set(f, { row, bar, status });\n    els.fileList.append(row);\n  });\n  els.fileList.hidden = files.length === 0;\n  els.dropzone.hidden = files.length > 0;\n}\n\nfunction removeFile(f) {\n  if (uploading) return;\n  files = files.filter((x) => x !== f);\n  queueState.delete(f);\n  renderQueue();\n  els.btnUpload.disabled = files.length === 0 || !canUploadFiles();\n}\n\n/* ---------- \u6587\u672C\u8F93\u5165 ---------- */\nels.textInput.addEventListener('input', () => {\n  els.textCounter.textContent = t('text.counter', els.textInput.value.length, 65536);\n  els.btnText.disabled = !policyReady || !els.textInput.value.trim();\n});\n\n/* ---------- \u4E0A\u4F20:\u961F\u5217\u987A\u5E8F\u9010\u4E2A,\u805A\u5408\u8FDB\u5EA6 + \u6BCF\u884C\u8FF7\u4F60\u8FDB\u5EA6 ---------- */\nels.btnUpload.addEventListener('click', startUpload);\nels.btnCancel.addEventListener('click', cancelUpload);\nels.btnText.addEventListener('click', submitText);\n\nfunction sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }\n\nfunction xhrPut(url, blob, onProgress) {\n  return new Promise((resolve, reject) => {\n    const xhr = new XMLHttpRequest();\n    currentXhr = xhr;\n    xhr.open('PUT', url);\n    xhr.onload = () => {\n      let etag = null;\n      try {\n        const result = JSON.parse(xhr.responseText);\n        if (result.error === 'capacity_exceeded' || (xhr.status >= 400 && xhr.status < 500) || result.error?.startsWith('upload_policy')) {\n          const error = new Error(result.message);\n          error.code = result.error;\n          error.remainingBytes = result.remainingBytes;\n          reject(error);\n          return;\n        }\n        etag = result.etag;\n      } catch { /* ignore */ }\n      resolve(xhr.status >= 200 && xhr.status < 300 && etag ? etag : null);\n    };\n    xhr.onerror = () => resolve(null);\n    xhr.onabort = () => resolve(null);\n    xhr.upload.onprogress = (e) => onProgress && e.lengthComputable && onProgress(e.loaded);\n    xhr.send(blob);\n  });\n}\n\n/** \u5355\u7247\u6700\u591A\u91CD\u8BD5 3 \u6B21,\u9000\u907F 1s/2s/4s */\nasync function putPartWithRetry(uploadId, n, blob, onProgress) {\n  for (let attempt = 0; attempt < 3; attempt++) {\n    if (cancelled) return null;\n    const etag = await xhrPut(`/api/uploads/${uploadId}/parts/${n}`, blob, onProgress);\n    if (etag) return etag;\n    await sleep([1000, 2000, 4000][attempt] || 4000);\n  }\n  return null;\n}\n\nfunction xhrJson(method, url, blob, onProgress) {\n  return new Promise((resolve, reject) => {\n    const xhr = new XMLHttpRequest();\n    currentXhr = xhr;\n    xhr.open(method, url);\n    xhr.onload = () => {\n      if (xhr.status >= 200 && xhr.status < 300) {\n        try { resolve(JSON.parse(xhr.responseText)); return; } catch { /* fallthrough */ }\n      }\n      if (xhr.status >= 400 && xhr.status < 500) {\n        let data;\n        try { data = JSON.parse(xhr.responseText); } catch { /* Use status below. */ }\n        const error = new Error(data?.message || t('req.fail', xhr.status));\n        error.code = data?.error;\n        reject(error);\n        return;\n      }\n      resolve(null);\n    };\n    xhr.onerror = () => resolve(null);\n    xhr.onabort = () => resolve(null);\n    xhr.upload.onprogress = (e) => onProgress && e.lengthComputable && onProgress(e.loaded);\n    xhr.send(blob);\n  });\n}\n\nlet speedState = { t: 0, loaded: 0, speed: 0 };\nlet curFileIdx = 0;\nlet curFileTotal = 1;\nfunction updateAggregate(loaded, total) {\n  const pct = Math.min(100, Math.floor((loaded / total) * 100));\n  els.progressFill.style.width = pct + '%';\n  const now = performance.now();\n  if (speedState.t && loaded > speedState.loaded) {\n    const inst = (loaded - speedState.loaded) / ((now - speedState.t) / 1000);\n    speedState.speed = speedState.speed ? speedState.speed * 0.7 + inst * 0.3 : inst;\n  }\n  speedState.t = now;\n  speedState.loaded = loaded;\n  let text = `${pct}% \xB7 ${fmtBytes(loaded)} / ${fmtBytes(total)} \xB7 ${fmtBytes(speedState.speed)}/s`;\n  if (speedState.speed > 1024 && loaded > 0 && loaded < total) {\n    text += ` \xB7 ${t('prog.eta', fmtDuration((total - loaded) / speedState.speed))}`;\n  }\n  if (curFileTotal > 1) text += ` \xB7 ${t('prog.file', curFileIdx, curFileTotal)}`;\n  els.progressText.textContent = text;\n}\n\n/** \u7B49\u5F85\u6001(\u521D\u59CB\u5316/\u91CD\u8BD5\u95F4\u9694/\u5408\u5E76\u5206\u7247):\u8FDB\u5EA6\u6761\u53E0\u52A0\u6D41\u5149\u52A8\u753B */\nfunction setPending(on) {\n  els.progressFill.classList.toggle('pending', on);\n}\n\nasync function startUpload() {\n  if (!files.length || uploading || !canUploadFiles()) return;\n  uploading = true;\n  cancelled = false;\n  speedState = { t: 0, loaded: 0, speed: 0 };\n  curFileIdx = 0;\n  curFileTotal = files.length;\n  const opts = readOptions();\n  const responses = [];\n  const totalBytes = files.reduce((s, f) => s + f.size, 0);\n  let baseBytes = 0;\n  setBusy(true);\n  els.progress.hidden = false;\n  els.progressFill.style.width = '0%';\n  setPending(false);\n  els.progressText.textContent = t('prog.preparing');\n\n  for (let i = 0; i < files.length; i++) {\n    if (cancelled) break;\n    const f = files[i];\n    const ui = queueUI.get(f);\n    curFileIdx = i + 1;\n    ui.row.classList.add('uploading');\n    els.progressText.textContent = t('prog.uploading');\n    const onProgress = (loaded) => {\n      ui.bar.style.width = Math.min(100, (loaded / f.size) * 100) + '%';\n      updateAggregate(baseBytes + loaded, totalBytes);\n    };\n    try {\n      const res = cfg.fileBackend === 'kv'\n        ? await directUpload(f, opts, onProgress)\n        : await multipartUpload(f, opts, onProgress);\n      responses.push(res);\n      baseBytes += f.size;\n      queueState.set(f, { done: res.code });\n      ui.bar.style.width = '100%';\n      ui.row.classList.add('done');\n      ui.status.textContent = `\u2713 ${res.code}`;\n    } catch (e) {\n      await abortUpload();\n      queueState.set(f, 'fail');\n      ui.row.classList.add('fail');\n      ui.status.textContent = '\u2717';\n      if (e.code === 'capacity_exceeded') {\n        window.alert(Number.isSafeInteger(e.remainingBytes) && e.remainingBytes >= 0\n          ? t('err.capacityRemaining', (e.remainingBytes / 1e9).toFixed(3), e.remainingBytes.toLocaleString())\n          : t('err.capacity'));\n      } else if (!cancelled) toast(`${f.name}: ${e.message || t('err.upload')}`, 'error');\n      break; // \u4E00\u4E2A\u5931\u8D25\u5373\u505C,\u4FDD\u7559\u961F\u5217\u4FBF\u4E8E\u5904\u7406\n    }\n  }\n\n  uploading = false;\n  els.progress.hidden = true;\n  setPending(false);\n  setBusy(false);\n  if (cancelled) toast(t('toast.cancelled'));\n  if (responses.length) showResults(responses);\n  await refreshPolicy();\n}\n\n/* ---------- \u5C0F\u5B58\u50A8\u6A21\u5F0F(KV):\u5355\u8BF7\u6C42\u76F4\u4F20,\u5931\u8D25\u6574\u6587\u4EF6\u91CD\u53D1 ---------- */\nasync function directUpload(f, opts, onProgress) {\n  const qs = new URLSearchParams({\n    filename: f.name,\n    mime: f.type || 'application/octet-stream',\n    expiry: opts.expiry,\n  });\n  if (opts.maxPickups !== null) qs.set('maxPickups', String(opts.maxPickups));\n\n  for (let attempt = 0; attempt < 3; attempt++) {\n    if (cancelled) throw new Error('cancelled');\n    setPending(false);\n    const res = await xhrJson('POST', `/api/shares/file?${qs}`, f, onProgress);\n    if (res) return res;\n    if (cancelled) throw new Error('cancelled');\n    setPending(true);\n    els.progressText.textContent = t('prog.retry', attempt + 1);\n    await sleep([1000, 2000][attempt] || 4000);\n  }\n  throw new Error(t('err.upload'));\n}\n\n/* ---------- \u5927\u5B58\u50A8\u6A21\u5F0F(R2):\u5206\u7247\u4E0A\u4F20 ---------- */\nasync function multipartUpload(f, opts, onProgress) {\n  setPending(true);\n  els.progressText.textContent = t('prog.init');\n  const init = await api('/api/uploads/init', {\n    method: 'POST',\n    body: { filename: f.name, size: f.size, mime: f.type || 'application/octet-stream', ...opts },\n  });\n  session = init;\n  setPending(false);\n\n  const etags = [];\n  let doneBytes = 0;\n  for (let i = 1; i <= init.parts; i++) {\n    const blob = f.slice((i - 1) * init.partSize, Math.min(i * init.partSize, f.size));\n    const etag = await putPartWithRetry(init.uploadId, i, blob, (loaded) =>\n      onProgress(doneBytes + loaded),\n    );\n    if (!etag) {\n      const wasCancelled = cancelled;\n      await abortUpload();\n      throw new Error(wasCancelled ? 'cancelled' : t('err.upload'));\n    }\n    etags.push({ partNumber: i, etag });\n    doneBytes += blob.size;\n  }\n  if (cancelled) throw new Error('cancelled');\n\n  els.progressFill.style.width = '100%';\n  setPending(true);\n  els.progressText.textContent = t('prog.merging');\n  try {\n    const res = await api(`/api/uploads/${init.uploadId}/complete`, {\n      method: 'POST',\n      body: { parts: etags },\n    });\n    session = null;\n    return res;\n  } catch (e) {\n    await abortUpload();\n    throw e;\n  }\n}\n\nasync function cancelUpload() {\n  cancelled = true;\n  currentXhr?.abort();\n  await abortUpload();\n}\n\nasync function abortUpload() {\n  if (!session) return;\n  const id = session.uploadId;\n  session = null;\n  try { await api(`/api/uploads/${id}/abort`, { method: 'POST', body: {} }); } catch { /* ignore */ }\n}\n\nfunction setBusy(busy) {\n  els.btnUpload.disabled = busy || files.length === 0 || !canUploadFiles();\n  els.btnText.disabled = busy || !policyReady || !els.textInput.value.trim();\n}\n\n/* \u5237\u65B0/\u5173\u9875\u65F6\u5C3D\u529B\u901A\u77E5\u670D\u52A1\u7AEF\u653E\u5F03(\u4E0D\u662F\u65AD\u70B9\u7EED\u4F20) */\nwindow.addEventListener('pagehide', () => {\n  if (session) navigator.sendBeacon(`/api/uploads/${session.uploadId}/abort`);\n});\n\n/* ---------- \u6587\u672C\u5206\u4EAB ---------- */\nasync function submitText() {\n  const text = els.textInput.value;\n  if (!text.trim() || !policyReady) return;\n  setBusy(true);\n  try {\n    const res = await api('/api/shares/text', { method: 'POST', body: { text, ...readOptions() } });\n    showResults([res]);\n  } catch (e) {\n    toast(e.message || t('err.submit'), 'error');\n  } finally {\n    setBusy(false);\n  }\n}\n\n/* ---------- \u7ED3\u679C\u5361\u7247(\u591A\u6587\u4EF6\u65F6\u9010\u5F20\u5806\u53E0 + \u6279\u91CF\u5934\u90E8) ---------- */\nfunction qrSvgFor(url) {\n  /* vendored qrcode-generator:\u5168\u5C40 window.qrcode(classic script \u5148\u4E8E\u672C\u6A21\u5757\u52A0\u8F7D) */\n  try {\n    const qr = window.qrcode(0, 'M');\n    qr.addData(url);\n    qr.make();\n    const holder = document.createElement('div');\n    holder.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true, alt: t('qr.hint') });\n    return holder.firstElementChild;\n  } catch { return null; }\n}\n\nfunction metaText(r) {\n  const parts = [];\n  parts.push(r.expireAt\n    ? t('meta.after', fmtDuration((r.expireAt - Date.now()) / 1000), fmtDate(r.expireAt))\n    : t('meta.forever'));\n  parts.push(r.maxPickups === null || r.maxPickups === undefined ? t('meta.unlimited') : t('meta.pickups', r.maxPickups));\n  if (r.kind === 'file' && r.size) parts.push(fmtBytes(r.size));\n  return parts.join(' \xB7 ');\n}\n\n/* \u7ED3\u679C\u5361\u7247 = \u53D6\u4EF6\u51ED\u8BC1\u7968\u636E:\u7968\u5934(\u6807\u9898+\u2116) \u2192 \u7968\u8EAB(\u53E3\u4EE4+\u4E8C\u7EF4\u7801) \u2192 \u6495\u7968\u7EBF \u2192 \u7968\u811A(\u64CD\u4F5C) */\nfunction buildResultCard(r, compact) {\n  const link = `${location.origin}/pickup?code=${r.code}`;\n  const qr = qrSvgFor(link);\n  const col = el('div', { class: 'result-col' },\n    compact && r.kind === 'file' && r.filename ? el('div', { class: 'result-file-name' }, r.filename) : null,\n    el('div', { class: 'code' }, ...r.code.split('').map((d) => el('span', {}, d))),\n    el('div', { class: 'result-link' }, link),\n    el('div', { class: 'result-meta' }, metaText(r)),\n  );\n  const main = el('div', { class: 'result-main' },\n    qr ? el('div', { class: 'qr-wrap', title: t('qr.hint') }, qr, el('div', { class: 'qr-hint' }, t('qr.hint'))) : null,\n    col,\n  );\n  return el('div', { class: 'result' },\n    el('div', { class: 'tk-head' },\n      el('span', {}, t('ticket.title')),\n      el('span', { class: 'tk-no' }, t('ticket.no', r.code)),\n    ),\n    el('div', { class: 'tk-body' },\n      compact ? null : el('p', { class: 'result-title' }, t('result.ok')),\n      main,\n    ),\n    el('div', { class: 'tk-tear' }),\n    el('div', { class: 'tk-foot' },\n      el('button', { class: 'btn primary', type: 'button', onclick: (e) => copyBtn(e.currentTarget, r.code, t('label.code')) }, t('btn.copyCode')),\n      el('button', { class: 'btn', type: 'button', onclick: (e) => copyBtn(e.currentTarget, link, t('label.link')) }, t('btn.copyLink')),\n      compact ? null : el('button', { class: 'btn ghost', type: 'button', onclick: resetAll }, t('btn.again')),\n    ),\n  );\n}\n\nfunction showResults(list) {\n  lastResults = list;\n  if (els.placeholder) els.placeholder.hidden = true;\n  els.results.replaceChildren();\n  if (list.length > 1) {\n    els.results.append(\n      el('div', { class: 'result-batch-head' },\n        el('p', { class: 'result-title batch' }, t('result.okBatch', list.length)),\n        el('div', { class: 'btn-row' },\n          el('button', {\n            class: 'btn small', type: 'button',\n            onclick: async (e) => {\n              const ok = await copyText(list.map((r) => r.code).join('\\n'));\n              toast(ok ? t('copied', t('label.code')) : t('copy.fail'), ok ? 'ok' : 'error');\n            },\n          }, t('btn.copyAll')),\n          el('button', { class: 'btn small ghost', type: 'button', onclick: resetAll }, t('btn.again')),\n        ),\n      ),\n    );\n  }\n  for (const r of list) els.results.append(buildResultCard(r, list.length > 1));\n  els.results.scrollIntoView({ behavior: 'smooth', block: 'nearest' });\n}\n\nfunction resetAll() {\n  files = [];\n  queueState = new Map();\n  renderQueue();\n  els.btnUpload.disabled = true;\n  els.textInput.value = '';\n  els.textCounter.textContent = t('text.counter', 0, 65536);\n  els.btnText.disabled = true;\n  hideResult();\n}\n\n/** \u590D\u5236\u6210\u529F\u540E\u6309\u94AE\u77ED\u6682\u53D8\u6210\"\u2713 \u5DF2\u590D\u5236\" */\nasync function copyBtn(btn, text, label) {\n  const ok = await copyText(text);\n  toast(ok ? t('copied', label) : t('copy.fail'), ok ? 'ok' : 'error');\n  if (!ok) return;\n  btn.textContent = t('copied.btn');\n  btn.disabled = true;\n  setTimeout(() => { btn.textContent = label === t('label.code') ? t('btn.copyCode') : t('btn.copyLink'); btn.disabled = false; }, 1500);\n}\n\nfunction hideResult() {\n  lastResults = [];\n  if (els.placeholder) els.placeholder.hidden = false;\n  els.results.replaceChildren();\n}\n", "js/pickup.js": "import { $, $$, api, fmtBytes, fmtDate, copyText, toast, initTheme, el, iconFor } from './common.js';\nimport { t, onLangChange, initI18n } from './i18n.js';\n\ninitTheme();\ninitI18n();\n\nconst boxes = $$('.otp-box');\nconst row = $('#otp-row');\nconst errorBox = $('#pickup-error');\nconst resultCard = $('#pickup-result');\nlet querying = false;\nlet last = null; // { res, code } \u8BED\u8A00\u5207\u6362\u65F6\u91CD\u6E32\u67D3\n\nonLangChange(() => {\n  if (last && !resultCard.hidden) render(last.res, last.code);\n});\n\nfunction value() {\n  return boxes.map((b) => b.value).join('');\n}\n\n/* \u586B\u5165 1-6 \u4F4D\u6570\u5B57:\u591F 6 \u4F4D\u81EA\u52A8\u63D0\u4EA4,\u5426\u5219\u805A\u7126\u5230\u4E0B\u4E00\u4E2A\u7A7A\u683C */\nfunction fill(digits) {\n  boxes.forEach((b, i) => { b.value = digits[i] || ''; });\n  hideError();\n  if (digits.length === 6) {\n    boxes[5].focus();\n    if (!querying) submit();\n  } else {\n    boxes[Math.min(digits.length, 5)].focus();\n  }\n}\n\nboxes.forEach((box, i) => {\n  box.addEventListener('input', () => {\n    box.value = box.value.replace(/\\D/g, '').slice(0, 1);\n    hideError();\n    if (box.value && i < boxes.length - 1) boxes[i + 1].focus();\n    if (value().length === 6 && !querying) submit();\n  });\n  box.addEventListener('keydown', (e) => {\n    if (e.key === 'Backspace' && !box.value && i > 0) {\n      e.preventDefault();\n      boxes[i - 1].value = '';\n      boxes[i - 1].focus();\n    } else if (e.key === 'ArrowLeft' && i > 0) {\n      boxes[i - 1].focus();\n    } else if (e.key === 'ArrowRight' && i < boxes.length - 1) {\n      boxes[i + 1].focus();\n    } else if (e.key === 'Enter' && value().length === 6 && !querying) {\n      submit();\n    }\n  });\n  box.addEventListener('paste', (e) => {\n    e.preventDefault();\n    const digits = (e.clipboardData.getData('text') || '').replace(/\\D/g, '').slice(0, 6);\n    if (digits) fill(digits);\n  });\n  box.addEventListener('focus', () => box.select());\n});\n\nfunction showError(msg) {\n  errorBox.textContent = msg;\n  errorBox.hidden = false;\n  row.classList.remove('shake');\n  void row.offsetWidth; /* \u5F3A\u5236 reflow,\u91CD\u542F\u52A8\u753B */\n  row.classList.add('shake');\n}\nfunction hideError() {\n  errorBox.hidden = true;\n}\n\nasync function submit() {\n  const code = value();\n  querying = true;\n  hideError();\n  resultCard.hidden = true;\n  try {\n    const res = await api('/api/pickup', { method: 'POST', body: { code } });\n    render(res, code);\n  } catch (e) {\n    showError(e.message || t('pk.fail'));\n  } finally {\n    querying = false;\n  }\n}\n\nfunction metaLine(res) {\n  const parts = [];\n  parts.push(res.expireAt ? t('pk.expireAt', fmtDate(res.expireAt)) : t('meta.forever'));\n  parts.push(res.pickupsLeft === null || res.pickupsLeft === undefined ? t('meta.unlimited') : t('pk.left', res.pickupsLeft));\n  return parts.join(' \xB7 ');\n}\n\nfunction render(res, code) {\n  last = { res, code };\n  resultCard.replaceChildren();\n\n  if (res.kind === 'text') {\n    const pre = el('pre', { class: 'text-body' });\n    pre.textContent = res.text ?? '';\n    resultCard.append(\n      el('div', { class: 'share-card' },\n        el('span', { class: 'sc-icon' }, '\u{1F4DD}'),\n        el('div', { class: 'sc-meta' }, el('b', {}, t('pk.textChars', res.size))),\n      ),\n      pre,\n      el('div', { class: 'btn-row' },\n        el('button', { class: 'btn primary', onclick: async () => {\n          (await copyText(res.text)) ? toast(t('copied.text'), 'ok') : toast(t('copy.fail'), 'error');\n        } }, t('pk.copyAllText')),\n      ),\n    );\n  } else {\n    resultCard.append(\n      el('div', { class: 'share-card' },\n        el('span', { class: 'sc-icon' }, iconFor(res.filename, res.mime)),\n        el('div', { class: 'sc-meta' },\n          el('b', {}, res.filename || t('pk.unnamed')),\n          el('small', {}, `${fmtBytes(res.size)} \xB7 ${res.mime || t('unknown.type')}`),\n        ),\n      ),\n      el('a', {\n        class: 'btn primary block',\n        href: `/api/pickup/${code}/download`,\n        download: res.filename || 'file',\n      }, t('pk.download')),\n    );\n  }\n\n  resultCard.append(\n    el('div', { class: 'meta-line' }, metaLine(res)),\n    el('div', { class: 'btn-row' },\n      el('button', { class: 'btn ghost', onclick: reset }, t('pk.again')),\n    ),\n  );\n  resultCard.hidden = false;\n}\n\nfunction reset() {\n  last = null;\n  resultCard.hidden = true;\n  boxes.forEach((b) => { b.value = ''; });\n  hideError();\n  boxes[0].focus();\n}\n\n/* \u652F\u6301 /pickup?code=xxxxxx \u5E26\u53C2\u8FDB\u5165 */\nconst fromUrl = new URLSearchParams(location.search).get('code');\nif (fromUrl && /^\\d{1,6}$/.test(fromUrl)) {\n  fill(fromUrl.slice(0, 6));\n} else {\n  boxes[0].focus();\n}\n", "js/vendor/qrcode.js": `//---------------------------------------------------------------------
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
`, "style.css": `/* ============================================================\r
   \u90AE\u653F\u7968\u636E\u4E3B\u9898:\u725B\u76AE\u7EB8\u5E95 \xB7 \u58A8\u7EFF\u6CB9\u58A8 \xB7 \u6A59\u8272\u90AE\u6233 \xB7 \u786C\u6295\u5F71\u63CF\u8FB9\r
   \u7ED3\u679C\u5361\u7247 = \u53D6\u4EF6\u51ED\u8BC1(\u7968\u5934 + \u90AE\u6233\u53E3\u4EE4\u74E6\u7247 + \u6495\u7968\u7EBF + \u7968\u811A)\r
   ============================================================ */\r
:root {\r
  --bag: #efe8d8;            /* \u725B\u76AE\u7EB8\u5E95 */\r
  --paper: #fffdf6;          /* \u7968\u636E\u7EB8\u9762 */\r
  --ink: #26382c;            /* \u6CB9\u58A8(\u6B63\u6587/\u4E3B\u8272) */\r
  --line: #26382c;           /* \u63CF\u8FB9 */\r
  --muted: #6b7563;          /* \u892A\u8272\u58A8 */\r
  --stamp: #d96f32;          /* \u90AE\u6233\u6A59 */\r
  --stamp-dark: #b85a24;\r
  --ok: #3c7a52;\r
  --ok-soft: #eef3ec;\r
  --danger: #b3403a;\r
  --danger-soft: #f7e9e4;\r
  --warn: #a2661c;\r
  --warn-soft: #f8efdd;\r
  --rowbg: #f7f2e4;          /* \u6587\u4EF6\u884C\u5E95 */\r
  --track: #e6dfca;          /* \u8FDB\u5EA6\u69FD */\r
  --tkhead-bg: #26382c;      /* \u7968\u5934\u5E95 */\r
  --tkhead-fg: #f4efdd;      /* \u7968\u5934\u5B57 */\r
  --hard: rgba(38, 56, 44, 0.9);   /* \u786C\u6295\u5F71 */\r
  --mask: rgba(24, 20, 12, 0.55);  /* \u5F39\u7A97\u906E\u7F69 */\r
  --hard-soft: rgba(38, 56, 44, 0.35);\r
  --dots: rgba(38, 56, 44, 0.05);  /* \u7EB8\u9762\u7F51\u70B9\u7EB9\u7406 */\r
  --radius: 14px;\r
  --radius-sm: 9px;\r
  --serif: Georgia, 'Times New Roman', 'Songti SC', 'SimSun', serif;\r
  /* \u52A8\u6548\u8282\u594F */\r
  --t-fast: 0.15s;\r
  --t-med: 0.25s;\r
  --t-slow: 0.35s;\r
  --ease: cubic-bezier(0.2, 0, 0, 1);\r
}\r
[data-theme='dark'] {\r
  /* \u58A8\u84DD\u591C\u822A:\u85CF\u84DD\u7EB8\u9762,\u84DD\u6A59\u4E92\u8865,\u90AE\u6233\u6A59\u591C\u91CC\u6700\u8DF3 */\r
  --bag: #12161f;\r
  --paper: #1a2130;\r
  --ink: #e8e5d6;\r
  --line: #46516b;\r
  --muted: #a9b2c9;\r
  --stamp: #e68d4f;\r
  --stamp-dark: #c9702f;\r
  --ok: #7fc79c;\r
  --ok-soft: #254432;\r
  --danger: #e08a7c;\r
  --danger-soft: #462822;\r
  --warn: #d9ab63;\r
  --warn-soft: #413120;\r
  --rowbg: #222b44;\r
  --track: #151b28;\r
  --tkhead-bg: #33415c;\r
  --tkhead-fg: #f0eee0;\r
  --hard: rgba(0, 0, 0, 0.5);\r
  --hard-soft: rgba(0, 0, 0, 0.32);\r
  /* \u6DF1\u8272\u4E0B\u540C\u900F\u660E\u5EA6\u7684\u906E\u7F69\u51E0\u4E4E\u770B\u4E0D\u51FA\u6765,\u52A0\u6DF1\u4E00\u6863\u4FDD\u4F4F\u5F39\u7A97\u4E0E\u80CC\u666F\u7684\u5206\u79BB\u611F */\r
  --mask: rgba(4, 7, 14, 0.72);\r
  --dots: rgba(232, 229, 214, 0.05);\r
}\r
\r
* { box-sizing: border-box; }\r
/* [hidden] \u515C\u5E95:\u7C7B\u4E0A\u7684 display:flex/inline-flex \u4F1A\u76D6\u8FC7 UA \u6837\u5F0F\u8868\u7684 [hidden]{display:none},\r
   \u5BFC\u81F4 .result-placeholder/.file-list \u7B49\u8BBE\u4E86 hidden \u4ECD\u53EF\u89C1 */\r
[hidden] { display: none !important; }\r
html { -webkit-text-size-adjust: 100%; }\r
body {\r
  margin: 0;\r
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, Roboto,\r
    'PingFang SC', 'HarmonyOS Sans SC', 'MiSans', 'Microsoft YaHei', sans-serif;\r
  font-size: 15px;\r
  line-height: 1.6;\r
  color: var(--ink);\r
  min-height: 100vh;\r
  /* \u7EB5\u5411 flex \u9AA8\u67B6:main \u5403\u6389\u5269\u4F59\u9AD8\u5EA6,\u9875\u811A\u8D34\u89C6\u53E3\u5E95 */\r
  display: flex;\r
  flex-direction: column;\r
  background:\r
    radial-gradient(var(--dots) 1px, transparent 1px) 0 0 / 22px 22px,\r
    var(--bag);\r
  -webkit-font-smoothing: antialiased;\r
  text-rendering: optimizeLegibility;\r
}\r
\r
::selection { background: var(--stamp); color: #fff; }\r
\r
/* \u7EC6\u6EDA\u52A8\u6761 */\r
* { scrollbar-width: thin; scrollbar-color: var(--line) transparent; }\r
::-webkit-scrollbar { width: 8px; height: 8px; }\r
::-webkit-scrollbar-thumb { background: var(--line); border-radius: 999px; }\r
::-webkit-scrollbar-track { background: transparent; }\r
\r
/* ============ \u9876\u680F ============ */\r
.topbar {\r
  display: flex;\r
  align-items: center;\r
  justify-content: space-between;\r
  padding: 22px 20px 14px;\r
  width: 100%; /* body \u6539\u7EB5\u5411 flex \u540E,auto margin \u6761\u76EE\u4F1A\u6536\u7F29\u5230\u5185\u5BB9\u5BBD,\u663E\u5F0F\u62C9\u6EE1\u518D\u7531 max-width \u6536\u53E3 */\r
  max-width: 720px;\r
  margin: 0 auto 26px;\r
  border-bottom: 3px double var(--line);\r
}\r
.topbar.wide { max-width: 1080px; }\r
.brand { display: flex; align-items: center; gap: 12px; }\r
.brand .logo {\r
  display: grid;\r
  place-items: center;\r
  width: 42px;\r
  height: 42px;\r
  font-size: 21px;\r
  border-radius: 10px;\r
  background: var(--paper);\r
  border: 1.5px solid var(--line);\r
  box-shadow: 3px 3px 0 var(--hard);\r
}\r
.brand b {\r
  font-family: var(--serif);\r
  font-size: 18px;\r
  font-weight: 700;\r
  display: block;\r
  line-height: 1.25;\r
  letter-spacing: 0.05em;\r
}\r
.brand small { color: var(--muted); font-size: 12px; }\r
.actions { display: flex; align-items: center; gap: 8px; }\r
\r
/* ============ \u5E03\u5C40 ============ */\r
.container { width: 100%; max-width: 720px; margin: 0 auto; padding: 8px 16px 48px; }\r
.container.wide { max-width: 1080px; }\r
.container.narrow { max-width: 460px; }\r
.card {\r
  background: var(--paper);\r
  border: 1.5px solid var(--line);\r
  border-radius: var(--radius);\r
  box-shadow: 6px 6px 0 var(--hard);\r
  padding: 24px;\r
  margin-bottom: 18px;\r
}\r
.card.center { text-align: center; }\r
.muted { color: var(--muted); }\r
.row-between { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 8px; }\r
\r
main { flex: 1 0 auto; } /* \u6491\u6EE1\u89C6\u53E3\u5269\u4F59\u9AD8\u5EA6,\u628A\u9875\u811A\u63A8\u5230\u5E95 */\r
/* \u515C\u5E95:\u5373\u4F7F main \u6CA1\u6491\u5F00(\u5F02\u5E38\u9875\u9762)\u4E5F\u628A\u9875\u811A\u63A8\u5230\u5E95 */\r
.foot {\r
  margin-top: auto;\r
  text-align: center;\r
  color: var(--muted);\r
  font-size: 12px;\r
  letter-spacing: 0.14em;\r
  padding: 32px 16px 10px;\r
}\r
\r
/* ============ \u90AE\u8DEF\u4E09\u6B65\u6761(\u67DC\u53F0\u4E0A\u65B9:\u5BC4\u4EF6\u2192\u51FA\u7968\u2192\u53D6\u4EF6) ============ */\r
.flow-strip {\r
  display: flex;\r
  align-items: center;\r
  background: var(--paper);\r
  border: 1.5px solid var(--line);\r
  border-radius: 13px;\r
  box-shadow: 6px 6px 0 var(--hard);\r
  padding: 18px 26px;\r
  margin-bottom: 24px;\r
  animation: fade-up var(--t-slow) var(--ease) both;\r
}\r
.flow-step { flex: 1; display: flex; align-items: center; gap: 13px; min-width: 0; }\r
.flow-dot {\r
  width: 46px; height: 46px; flex: none;\r
  border: 2.5px double var(--stamp); border-radius: 50%;\r
  display: grid; place-items: center;\r
  font-size: 20px; color: var(--stamp); font-family: var(--serif);\r
}\r
.flow-step:nth-child(1) .flow-dot { transform: rotate(-7deg); }\r
.flow-step:nth-child(3) .flow-dot { transform: rotate(5deg); }\r
.flow-step:nth-child(5) .flow-dot { transform: rotate(-4deg); }\r
.flow-tt b { display: block; font-size: 14px; font-family: var(--serif); letter-spacing: 0.06em; }\r
.flow-tt small { color: var(--muted); font-size: 12px; }\r
.flow-link { flex: 0 0 58px; border-top: 2px dashed var(--line); margin: 0 12px; position: relative; }\r
.flow-link::after {\r
  content: '\u2708'; position: absolute; right: -4px; top: -11px;\r
  font-size: 12px; color: var(--stamp);\r
}\r
\r
/* ============ \u53D1\u9001\u9875:\u67DC\u53F0\u53CC\u680F(\u5DE6\u5BC4\u4EF6\u5355 / \u53F3\u56DE\u6267\u5E38\u9A7B) ============ */\r
/* \u5185\u5BB9\u4E0D\u8DB3\u4E00\u5C4F\u65F6\u67DC\u53F0\u4E0A/\u4E0B\u7559\u767D\u5747\u8861;\u8D85\u51FA\u4E00\u5C4F\u65F6 main \u9AD8\u5EA6=\u5185\u5BB9\u9AD8,\u81EA\u52A8\u9000\u5316\u4E3A\u9876\u5BF9\u9F50 */\r
main:has(> .send-grid) { display: flex; flex-direction: column; justify-content: center; }\r
.send-grid {\r
  display: grid;\r
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);\r
  gap: 26px;\r
  align-items: stretch; /* \u4E24\u680F\u540C\u9AD8:\u7A7A\u6001\u65F6\u53F3\u680F\u5360\u4F4D\u6491\u5230\u4E0E\u8868\u5355\u5361\u9F50\u5E95 */\r
}\r
.form-card { min-width: 0; margin-bottom: 0; align-self: stretch; display: flex; flex-direction: column; } /* \u4E24\u680F\u9F50\u5E95:\u8868\u5355\u5361\u540C\u6837\u62C9\u4F38(\u56DE\u6267\u680F\u5185\u5BB9\u66F4\u9AD8\u65F6\u4E0D\u518D\u53C2\u5DEE) */\r
/* \u62C9\u4F38\u540E\u7684\u591A\u4F59\u9AD8\u5EA6\u4EA4\u7ED9\u8F93\u5165\u533A\u5438\u6536:\u62D6\u62FD\u533A/\u6587\u672C\u6846/\u6587\u4EF6\u961F\u5217\u957F\u9AD8,\u9009\u9879\u548C\u6309\u94AE\u4E0D\u88AB\u9876\u5F97\u60AC\u7A7A */\r
.form-card .panel { display: flex; flex-direction: column; flex: 1; }\r
.form-card .dropzone, .form-card textarea, .form-card .file-list { flex: 1; }\r
.form-card .dropzone { display: flex; flex-direction: column; justify-content: center; }\r
.card-cap, .side-cap {\r
  display: flex;\r
  justify-content: space-between;\r
  align-items: baseline;\r
  margin: -4px 0 16px;\r
  font-size: 11.5px;\r
  letter-spacing: 0.3em;\r
  color: var(--muted);\r
  font-weight: 600;\r
}\r
.card-cap .cap-date {\r
  font-family: var(--serif);\r
  color: var(--stamp);\r
  letter-spacing: 0.08em;\r
  font-size: 12.5px;\r
}\r
/* \u53F3\u680F\u968F\u884C\u9AD8\u62C9\u4F38:sticky \u5728 stretch \u4E0B\u4E0D\u518D\u751F\u6548(\u4E24\u680F\u6C38\u8FDC\u540C\u9AD8,\u65E0\u53EF\u7C98\u6EDE\u4F59\u91CF),\u6539\u4E3A flex \u7EB5\u5411\u680F */\r
.send-side { display: flex; flex-direction: column; min-width: 0; }\r
.send-side .results { margin-top: 0; }\r
/* \u56DE\u6267\u7A7A\u6001:\u5F85\u51FA\u7968\u90AE\u6233 */\r
.result-placeholder {\r
  border: 1.5px dashed var(--line);\r
  border-radius: 13px;\r
  padding: 38px 20px;\r
  min-height: 340px; /* \u4E0E\u5DE6\u680F\u8868\u5355\u5361\u89C6\u89C9\u5E73\u8861 */\r
  flex: 1; /* \u53F3\u680F\u88AB\u62C9\u4F38\u65F6\u5360\u4F4D\u968F\u4E4B\u957F\u9AD8,\u5E95\u8FB9\u4E0E\u8868\u5355\u5361\u5BF9\u9F50 */\r
  display: flex;\r
  flex-direction: column;\r
  justify-content: center;\r
  align-items: center;\r
  text-align: center;\r
  animation: fade-up var(--t-slow) var(--ease) both;\r
}\r
.ph-postmark {\r
  width: 76px;\r
  height: 76px;\r
  margin: 0 auto 14px;\r
  border: 2.5px double var(--stamp);\r
  border-radius: 50%;\r
  display: grid;\r
  place-items: center;\r
  color: var(--stamp);\r
  font-family: var(--serif);\r
  font-size: 10px;\r
  letter-spacing: 0.22em;\r
  text-indent: 0.22em; /* \u8865\u507F\u5B57\u8DDD,\u8BA9\u5706\u5F62\u90AE\u6233\u89C6\u89C9\u5C45\u4E2D */\r
  transform: rotate(-8deg);\r
  opacity: 0.8;\r
}\r
.result-placeholder p { margin: 0 0 4px; font-weight: 700; font-family: var(--serif); letter-spacing: 0.08em; }\r
.result-placeholder small { color: var(--muted); font-size: 12.5px; }\r
/* \u7A7A\u6001\u5185\u5D4C\u300C\u5728\u9014\u90AE\u8DEF\u300D\u7AD6\u5411\u65F6\u95F4\u7EBF:\u53F3\u680F\u4E0D\u7A7A */\r
.ph-route { margin-top: 24px; width: 100%; max-width: 300px; text-align: left; }\r
.ph-leg { display: flex; gap: 13px; align-items: flex-start; }\r
.ph-ic {\r
  width: 40px; height: 40px; flex: none;\r
  border: 1.5px solid var(--line); border-radius: 50%;\r
  background: var(--rowbg);\r
  display: grid; place-items: center; font-size: 17px;\r
}\r
.ph-leg:nth-child(1) .ph-ic { transform: rotate(-6deg); }\r
.ph-leg b { display: block; font-size: 13px; font-family: var(--serif); letter-spacing: 0.04em; }\r
.ph-leg small { color: var(--muted); font-size: 11.5px; line-height: 1.5; }\r
.ph-dash { width: 0; height: 22px; border-left: 2px dashed var(--line); margin: 3px 0 3px 19px; }\r
.ph-fine {\r
  margin-top: 22px; padding-top: 13px; width: 100%; max-width: 300px;\r
  border-top: 1.5px dashed var(--line);\r
  color: var(--muted); font-size: 11px; letter-spacing: 0.12em; text-align: center;\r
}\r
\r
/* ============ \u6309\u94AE:\u90AE\u6233\u7AE0 ============ */\r
.btn {\r
  display: inline-flex;\r
  align-items: center;\r
  justify-content: center;\r
  gap: 6px;\r
  padding: 9px 18px;\r
  border-radius: var(--radius-sm);\r
  border: 1.5px solid var(--line);\r
  background: var(--paper);\r
  color: var(--ink);\r
  font-size: 14px;\r
  font-weight: 600;\r
  cursor: pointer;\r
  text-decoration: none;\r
  box-shadow: 2px 2px 0 var(--hard-soft);\r
  transition: transform var(--t-fast), box-shadow var(--t-fast), background var(--t-fast), color var(--t-fast), opacity var(--t-fast);\r
}\r
.btn:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 var(--hard-soft); }\r
.btn:active { transform: translate(1px, 1px); box-shadow: 1px 1px 0 var(--hard-soft); }\r
.btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: 2px 2px 0 var(--hard-soft); }\r
.btn.primary {\r
  background: var(--tkhead-bg);\r
  border-color: var(--line);\r
  color: var(--tkhead-fg);\r
  box-shadow: 3px 3px 0 var(--stamp);\r
}\r
.btn.primary:hover { transform: translate(-2px, -2px); box-shadow: 5px 5px 0 var(--stamp); }\r
.btn.primary:active { transform: translate(1px, 1px); box-shadow: 1px 1px 0 var(--stamp); }\r
.btn.primary:disabled { box-shadow: 2px 2px 0 var(--hard-soft); } /* \u7981\u7528\u65F6\u4E0D\u4EAE\u6A59\u5F71,\u907F\u514D\u8BEF\u8BFB\u4E3A\u53EF\u70B9 */\r
.btn.ghost { background: transparent; box-shadow: none; border-color: var(--line); }\r
.btn.ghost:hover { background: var(--rowbg); transform: none; }\r
.btn.danger { background: var(--danger); border-color: var(--danger); color: #fff; box-shadow: 2px 2px 0 var(--hard-soft); }\r
.btn.small { padding: 5px 12px; font-size: 13px; border-radius: 8px; }\r
.btn.block { width: 100%; margin-top: 16px; }\r
.btn-row { display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap; }\r
.icon-btn {\r
  background: transparent;\r
  border: none;\r
  font-size: 17px;\r
  cursor: pointer;\r
  color: var(--muted);\r
  padding: 7px 9px;\r
  border-radius: 8px;\r
  transition: background var(--t-fast), color var(--t-fast);\r
}\r
.icon-btn:hover { background: var(--rowbg); color: var(--ink); }\r
/* \u8BED\u8A00\u5207\u6362:\u663E\u793A\u76EE\u6807\u8BED\u8A00(\u7528\u5168\u58A8\u8272,\u907F\u514D\u6DF1\u8272\u6A21\u5F0F\u4E0B\u8FC7\u6DE1) */\r
.lang-btn { font-size: 13px; font-weight: 700; letter-spacing: 0.02em; padding: 7px 10px; color: var(--ink); }\r
.lang-float { position: fixed; top: 14px; right: 14px; z-index: 10; background: var(--paper); border: 1.5px solid var(--line); box-shadow: 3px 3px 0 var(--hard); }\r
\r
/* ============ Tabs:\u7968\u6839 ============ */\r
.tabs { display: flex; gap: 10px; margin-bottom: 20px; }\r
.tab {\r
  flex: 1;\r
  padding: 9px;\r
  border: 1.5px dashed var(--line);\r
  background: transparent;\r
  border-radius: var(--radius-sm);\r
  font-size: 14px;\r
  font-weight: 600;\r
  color: var(--muted);\r
  cursor: pointer;\r
  transition: color var(--t-fast), background var(--t-fast), border-color var(--t-fast);\r
}\r
.tab:hover { color: var(--ink); background: var(--rowbg); }\r
.tab.active { border-style: solid; background: var(--tkhead-bg); border-color: var(--line); color: var(--tkhead-fg); }\r
\r
/* ============ \u62D6\u62FD\u533A:\u5305\u88F9\u5355 ============ */\r
.dropzone {\r
  border: 2px dashed var(--line);\r
  border-radius: 12px;\r
  padding: 36px 16px;\r
  text-align: center;\r
  cursor: pointer;\r
  transition: background var(--t-fast);\r
  outline: none;\r
}\r
.dropzone:hover, .dropzone:focus-visible, .dropzone.dragover { background: var(--rowbg); }\r
.dz-icon { font-size: 34px; margin-bottom: 8px; transition: transform var(--t-med) ease; }\r
.dropzone:hover .dz-icon, .dropzone.dragover .dz-icon { transform: scale(1.1) translateY(-2px); }\r
.dropzone p { margin: 0 0 6px; font-size: 14px; }\r
.dropzone p b { font-weight: 700; }\r
.dropzone small { color: var(--muted); font-size: 13px; }\r
\r
/* ============ \u6587\u4EF6\u961F\u5217(\u591A\u9009\u6279\u91CF) ============ */\r
.file-list { display: flex; flex-direction: column; gap: 8px; }\r
.file-row {\r
  position: relative;\r
  display: flex;\r
  align-items: center;\r
  gap: 12px;\r
  background: var(--rowbg);\r
  border: 1.5px solid var(--line);\r
  border-radius: 10px;\r
  padding: 10px 12px;\r
  overflow: hidden;\r
  animation: fade-up var(--t-slow) var(--ease) both;\r
}\r
.file-row.uploading { background: var(--warn-soft); }\r
.file-row.done { background: var(--ok-soft); }\r
.file-row.fail { background: var(--danger-soft); }\r
.fr-icon { font-size: 20px; flex: none; }\r
.fr-meta { flex: 1; min-width: 0; }\r
.fr-meta b { display: block; font-size: 13.5px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\r
.fr-meta small { color: var(--muted); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\r
.fr-status { font-size: 12.5px; color: var(--muted); font-variant-numeric: tabular-nums; white-space: nowrap; font-family: var(--serif); }\r
.file-row.done .fr-status { color: var(--ok); font-weight: 700; }\r
.file-row.fail .fr-status { color: var(--danger); font-weight: 700; }\r
.fr-remove { padding: 5px 7px; font-size: 13px; flex: none; }\r
/* \u8FF7\u4F60\u8FDB\u5EA6\u6761:\u8D34\u884C\u5E95\u7F18(\u8721\u5C01\u6761) */\r
.fr-bar {\r
  position: absolute;\r
  left: 0;\r
  bottom: 0;\r
  height: 3px;\r
  width: 0;\r
  border-radius: 999px;\r
  background: var(--stamp);\r
  transition: width var(--t-med) ease;\r
}\r
.file-row.done .fr-bar { width: 100%; background: var(--ok); }\r
.file-row.fail .fr-bar { width: 100%; background: var(--danger); }\r
\r
/* ============ \u6587\u672C\u8F93\u5165 ============ */\r
textarea {\r
  width: 100%;\r
  border: 1.5px solid var(--line);\r
  border-radius: 10px;\r
  background: var(--paper);\r
  color: var(--ink);\r
  padding: 12px 14px;\r
  font-size: 14px;\r
  font-family: inherit;\r
  line-height: 1.65;\r
  resize: vertical;\r
  transition: box-shadow var(--t-fast);\r
}\r
textarea:focus { outline: none; box-shadow: 3px 3px 0 var(--hard-soft); }\r
\r
/* ============ \u9009\u9879 segmented:\u90AE\u8D44\u6807\u7B7E ============ */\r
.options { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 22px; margin: 22px 0 6px; }\r
.opt-group label {\r
  display: block;\r
  font-size: 11.5px;\r
  color: var(--muted);\r
  letter-spacing: 0.18em;\r
  margin-bottom: 7px;\r
}\r
.seg { display: flex; gap: 6px; flex-wrap: wrap; }\r
.seg button {\r
  padding: 6px 13px;\r
  border: 1.5px solid var(--line);\r
  background: transparent;\r
  border-radius: 8px;\r
  font-size: 13px;\r
  font-weight: 600;\r
  color: var(--muted);\r
  cursor: pointer;\r
  transition: color var(--t-fast), background var(--t-fast);\r
}\r
.seg button:hover { color: var(--ink); background: var(--rowbg); }\r
.seg button.active { background: var(--stamp); border-color: var(--stamp); color: #fff; }\r
\r
/* ============ \u8FDB\u5EA6\u6761 ============ */\r
.progress { margin-top: 18px; }\r
.bar {\r
  height: 12px;\r
  background: var(--track);\r
  border: 1.5px solid var(--line);\r
  border-radius: 999px;\r
  overflow: hidden;\r
}\r
.bar > div {\r
  height: 100%;\r
  width: 0;\r
  background: linear-gradient(90deg, var(--stamp-dark), var(--stamp));\r
  border-radius: 999px;\r
  transition: width var(--t-med) ease;\r
}\r
.progress small { color: var(--muted); font-variant-numeric: tabular-nums; }\r
\r
/* ============ \u7ED3\u679C:\u53D6\u4EF6\u51ED\u8BC1(\u7968\u636E) ============ */\r
.results { display: flex; flex-direction: column; gap: 16px; margin-top: 20px; }\r
.result {\r
  background: var(--paper);\r
  border: 1.5px solid var(--line);\r
  border-radius: 13px;\r
  box-shadow: 6px 6px 0 var(--hard);\r
  overflow: hidden;\r
}\r
/* \u6279\u91CF\u5934\u90E8 */\r
.result-batch-head {\r
  display: flex;\r
  align-items: center;\r
  justify-content: space-between;\r
  gap: 12px;\r
  flex-wrap: wrap;\r
  padding: 13px 16px;\r
  border-radius: 13px;\r
  background: var(--ok-soft);\r
  border: 1.5px solid var(--line);\r
  box-shadow: 4px 4px 0 var(--hard);\r
}\r
.result-batch-head .result-title { margin: 0; }\r
.result-batch-head .btn-row { margin: 0; flex-wrap: nowrap; }\r
.result-title { margin: 0; font-weight: 700; font-size: 14.5px; }\r
.result-title.batch { font-family: var(--serif); letter-spacing: 0.04em; }\r
/* \u7968\u5934 */\r
.tk-head {\r
  display: flex;\r
  justify-content: space-between;\r
  align-items: center;\r
  background: var(--tkhead-bg);\r
  color: var(--tkhead-fg);\r
  padding: 9px 16px;\r
  font-size: 12px;\r
  letter-spacing: 0.3em;\r
  font-weight: 600;\r
}\r
.tk-head .tk-no { letter-spacing: 0.08em; color: var(--stamp); font-family: var(--serif); }\r
/* \u7968\u8EAB */\r
.tk-body { padding: 18px 16px 14px; text-align: center; }\r
.result-main { display: flex; align-items: center; justify-content: center; gap: 22px; flex-wrap: wrap; }\r
.result-col { display: flex; flex-direction: column; align-items: center; min-width: 0; }\r
.result-file-name { font-size: 13px; color: var(--muted); word-break: break-all; margin-bottom: 2px; }\r
/* \u53E3\u4EE4\u74E6\u7247:\u90AE\u6233 */\r
.code { display: flex; justify-content: center; gap: 8px; margin: 8px 0 10px; }\r
.code span {\r
  display: grid;\r
  place-items: center;\r
  width: 46px;\r
  height: 58px;\r
  font-family: var(--serif);\r
  font-size: 30px;\r
  font-weight: 700;\r
  font-variant-numeric: tabular-nums;\r
  color: var(--ink);\r
  background: var(--paper);\r
  border: 1.5px solid var(--line);\r
  border-radius: 7px;\r
  box-shadow: 2px 2px 0 var(--hard-soft);\r
  user-select: all;\r
}\r
.code span:nth-child(odd) { transform: rotate(-1.6deg); }\r
.code span:nth-child(even) { transform: rotate(1.4deg); }\r
.result-link { color: var(--muted); font-size: 12px; word-break: break-all; }\r
.result-meta { color: var(--muted); font-size: 12.5px; margin-top: 8px; }\r
/* \u4E8C\u7EF4\u7801:\u767D\u5E95\u4FDD\u8BC1\u6DF1\u8272\u6A21\u5F0F\u53EF\u626B\u63CF */\r
.qr-wrap {\r
  flex: none;\r
  background: #fff;\r
  padding: 8px;\r
  border-radius: 9px;\r
  border: 1.5px solid var(--line);\r
  box-shadow: 2px 2px 0 var(--hard-soft);\r
}\r
.qr-wrap svg { display: block; width: 110px; height: 110px; }\r
.qr-hint { text-align: center; font-size: 10.5px; color: #6b7280; margin-top: 5px; letter-spacing: 0.18em; }\r
/* \u6495\u7968\u7EBF(\u5E26\u7F3A\u53E3) */\r
.tk-tear { border-top: 2px dashed var(--line); position: relative; margin: 0 14px; }\r
.tk-tear::before, .tk-tear::after {\r
  content: '';\r
  position: absolute;\r
  top: -9px;\r
  width: 16px;\r
  height: 16px;\r
  border-radius: 50%;\r
  background: var(--bag);\r
  border: 1.5px solid var(--line);\r
}\r
.tk-tear::before { left: -24px; }\r
.tk-tear::after { right: -24px; }\r
/* \u7968\u811A */\r
.tk-foot { display: flex; gap: 10px; justify-content: center; padding: 14px; flex-wrap: wrap; }\r
.result .btn-row { justify-content: center; }\r
\r
/* ============ \u7279\u6027\u5E26(\u67DC\u53F0\u4E0B\u65B9:\u4E00\u6392\u4E1A\u52A1\u516C\u544A\u7AE0) ============ */\r
.feat-band { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 28px; }\r
.feat {\r
  background: var(--paper);\r
  border: 1.5px dashed var(--line);\r
  border-radius: 11px;\r
  box-shadow: 3px 3px 0 var(--hard-soft);\r
  padding: 14px 16px;\r
  display: flex; gap: 12px; align-items: center;\r
  animation: fade-up var(--t-slow) var(--ease) both;\r
}\r
.feat:nth-child(2) { transform: rotate(0.4deg); }\r
.feat:nth-child(3) { transform: rotate(-0.3deg); }\r
.feat-ic {\r
  width: 40px; height: 40px; flex: none;\r
  border: 2px double var(--stamp); border-radius: 50%;\r
  display: grid; place-items: center; font-size: 17px;\r
}\r
.feat b { display: block; font-size: 13.5px; font-family: var(--serif); letter-spacing: 0.04em; }\r
.feat small { color: var(--muted); font-size: 12px; }\r
\r
/* ============ \u53D6\u4EF6\u9875 ============ */\r
h2.title { margin: 8px 0 6px; font-size: 22px; font-weight: 700; line-height: 1.3; font-family: var(--serif); letter-spacing: 0.04em; }\r
.pk-sub { margin: 0 0 16px; font-size: 13.5px; }\r
.error-box {\r
  margin-top: 14px;\r
  padding: 12px 14px;\r
  border-radius: var(--radius-sm);\r
  background: var(--danger-soft);\r
  border: 1.5px solid var(--danger);\r
  color: var(--danger);\r
  font-size: 14px;\r
}\r
.share-card {\r
  display: flex;\r
  align-items: center;\r
  gap: 14px;\r
  background: var(--rowbg);\r
  border: 1.5px dashed var(--line);\r
  border-radius: 10px;\r
  padding: 16px;\r
}\r
.sc-icon { font-size: 32px; }\r
.sc-meta { flex: 1; min-width: 0; text-align: left; }\r
.sc-meta b { display: block; font-size: 15px; font-weight: 700; word-break: break-all; }\r
.sc-meta small { color: var(--muted); }\r
.meta-line { color: var(--muted); font-size: 13px; margin: 12px 2px 0; text-align: left; }\r
pre.text-body {\r
  background: var(--rowbg);\r
  border: 1.5px solid var(--line);\r
  border-radius: 10px;\r
  padding: 14px 16px;\r
  white-space: pre-wrap;\r
  word-break: break-all;\r
  font-size: 13px;\r
  line-height: 1.7;\r
  max-height: 340px;\r
  overflow: auto;\r
  margin: 0 0 4px;\r
  text-align: left;\r
}\r
\r
/* ============ \u7BA1\u7406\u9875 ============ */\r
.stats-row { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 16px; margin-bottom: 20px; }\r
.stats-counts { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }\r
.stats-counts .stat-card { display: flex; flex-direction: column; justify-content: center; gap: 6px; min-width: 0; }\r
.stat-card {\r
  background: var(--paper);\r
  border: 1.5px solid var(--line);\r
  border-radius: 11px;\r
  padding: 16px 12px;\r
  text-align: center;\r
  box-shadow: 3px 3px 0 var(--hard-soft);\r
}\r
.stat-card b { display: block; font-size: 24px; font-weight: 700; font-family: var(--serif); font-variant-numeric: tabular-nums; line-height: 1.3; }\r
.stat-card small { color: var(--muted); font-size: 12px; letter-spacing: 0.08em; }\r
.table-wrap { overflow-x: auto; }\r
table { width: 100%; border-collapse: collapse; font-size: 13px; }\r
th, td { text-align: left; padding: 10px; border-bottom: 1px dashed var(--line); white-space: nowrap; }\r
th { color: var(--muted); font-weight: 600; font-size: 11.5px; letter-spacing: 0.1em; }\r
tbody tr:last-child td { border-bottom: none; }\r
tbody tr:hover td { background: var(--rowbg); }\r
td.wrap { white-space: normal; min-width: 140px; max-width: 260px; overflow: hidden; text-overflow: ellipsis; }\r
.badge {\r
  display: inline-block;\r
  padding: 2px 10px;\r
  border-radius: 999px;\r
  border: 1.5px solid transparent;\r
  font-size: 12px;\r
  font-weight: 600;\r
}\r
.badge.active { background: var(--ok-soft); color: var(--ok); border-color: var(--ok); }\r
.badge.expired { background: var(--danger-soft); color: var(--danger); border-color: var(--danger); }\r
.badge.exhausted { background: var(--warn-soft); color: var(--warn); border-color: var(--warn); }\r
.badge.kind-file { background: transparent; color: var(--stamp); border-color: var(--stamp); }\r
.badge.kind-text { background: transparent; color: var(--muted); border-color: var(--line); }\r
.token-input {\r
  width: 100%;\r
  padding: 11px 13px;\r
  border: 1.5px solid var(--line);\r
  border-radius: var(--radius-sm);\r
  background: var(--paper);\r
  color: var(--ink);\r
  font-size: 14px;\r
  margin: 12px 0 4px;\r
  transition: box-shadow var(--t-fast);\r
}\r
.token-input:focus { outline: none; box-shadow: 3px 3px 0 var(--hard-soft); }\r
.admin-foot { margin-top: 18px; display: flex; justify-content: flex-end; }\r
.pager-btns { display: flex; gap: 8px; }\r
\r
/* ============ \u4F5C\u5E9F\u786E\u8BA4\u5F39\u7A97(\u7BA1\u7406\u9875):\u7968\u636E\u5361 + \u786C\u504F\u79FB\u6295\u5F71 ============ */\r
.modal-mask {\r
  position: fixed;\r
  inset: 0;\r
  z-index: 90;\r
  display: flex;\r
  align-items: center;\r
  justify-content: center;\r
  padding: 20px;\r
  background: var(--mask);\r
}\r
.modal-mask[hidden] { display: none; }\r
.modal-card {\r
  background: var(--paper);\r
  border: 2px solid var(--line);\r
  border-radius: var(--radius);\r
  box-shadow: 8px 8px 0 var(--hard);\r
  padding: 22px 22px 18px;\r
  width: min(430px, 100%);\r
  animation: pop-in 0.18s ease-out;\r
}\r
.modal-title { margin: 0 0 14px; font-family: var(--serif); font-size: 19px; letter-spacing: 0.04em; }\r
.del-target {\r
  border: 1.5px dashed var(--line);\r
  border-radius: var(--radius-sm);\r
  background: var(--rowbg);\r
  padding: 10px 14px;\r
  margin-bottom: 12px;\r
  display: grid;\r
  gap: 6px;\r
}\r
.del-line { display: flex; gap: 10px; align-items: baseline; min-width: 0; }\r
.del-line > :first-child { flex: 0 0 4em; font-size: 12px; letter-spacing: 0.08em; }\r
.del-line > :last-child { min-width: 0; overflow-wrap: anywhere; }\r
.del-warn { margin: 0 0 16px; color: var(--danger); font-size: 13px; line-height: 1.5; }\r
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; }\r
@keyframes pop-in { from { transform: translateY(8px); opacity: 0; } }\r
\r
/* ============ toast:\u58A8\u6761 ============ */\r
#toast-host {\r
  position: fixed;\r
  bottom: calc(24px + env(safe-area-inset-bottom, 0px));\r
  left: 50%;\r
  transform: translateX(-50%);\r
  display: flex;\r
  flex-direction: column;\r
  gap: 8px;\r
  z-index: 99;\r
  pointer-events: none;\r
}\r
.toast {\r
  background: var(--tkhead-bg);\r
  color: var(--tkhead-fg);\r
  padding: 10px 18px;\r
  border: 1.5px solid var(--line);\r
  border-radius: 10px;\r
  font-size: 14px;\r
  box-shadow: 3px 3px 0 var(--hard);\r
  opacity: 0;\r
  transform: translateY(8px);\r
  transition: opacity var(--t-med), transform var(--t-med);\r
}\r
.toast.show { opacity: 1; transform: translateY(0); }\r
.toast.ok { background: var(--ok); border-color: var(--ok); color: #fff; }\r
.toast.error { background: var(--danger); border-color: var(--danger); color: #fff; }\r
\r
/* ============ \u79FB\u52A8\u7AEF ============ */\r
/* \u53CC\u680F\u5E76\u56DE\u5355\u680F:\u53F3\u680F\u56DE\u5230\u8868\u5355\u4E0B\u65B9,\u7A7A\u6001\u5360\u4F4D\u9690\u85CF */\r
@media (max-width: 880px) {\r
  .send-grid { grid-template-columns: 1fr; gap: 18px; }\r
  .send-side .side-cap, .result-placeholder { display: none; }\r
  /* \u90AE\u8DEF\u6761\u7AD6\u6392,\u8FDE\u7EBF\u8F6C\u4E3A\u5411\u4E0B\u865A\u7EBF;\u7279\u6027\u5E26\u4E24\u5217 */\r
  .flow-strip { flex-direction: column; align-items: stretch; gap: 14px; padding: 16px 18px; }\r
  .flow-link { flex: 0 0 0; width: 0; height: 26px; border-top: none; border-left: 2px dashed var(--line); margin: 0 0 0 22px; }\r
  .flow-link::after { right: -6px; top: 12px; }\r
  .feat-band { grid-template-columns: repeat(2, 1fr); margin-top: 20px; gap: 12px; }\r
}\r
@media (max-width: 640px) {\r
  .options { grid-template-columns: 1fr; }\r
  .card { padding: 18px; }\r
  .topbar { padding: 14px 16px 8px; }\r
  .code { gap: 6px; }\r
  .code span { width: 42px; height: 52px; font-size: 27px; }\r
  .otp-row { gap: 6px; }\r
  .otp-box { width: 42px; height: 54px; font-size: 24px; }\r
  .btn-row .btn { flex: 1; }\r
  th, td { padding: 8px 6px; }\r
  .row-between { flex-wrap: wrap; }\r
  .stat-card b { font-size: 21px; }\r
  .result-main { gap: 14px; }\r
  .qr-wrap svg { width: 92px; height: 92px; }\r
  .tk-tear::before, .tk-tear::after { width: 13px; height: 13px; top: -7.5px; }\r
  .tk-tear::before { left: -20px; }\r
  .tk-tear::after { right: -20px; }\r
}\r
\r
/* ============ \u52A8\u6548 ============ */\r
@keyframes fade-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }\r
@keyframes pop { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: none; } }\r
.card { animation: fade-up var(--t-slow) var(--ease) both; }\r
.result:not([hidden]) { animation: pop var(--t-slow) var(--ease) both; }\r
\r
@keyframes shake {\r
  10%, 90% { transform: translateX(-2px); }\r
  20%, 80% { transform: translateX(3px); }\r
  30%, 50%, 70% { transform: translateX(-5px); }\r
  40%, 60% { transform: translateX(5px); }\r
}\r
.shake { animation: shake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }\r
\r
/* \u952E\u76D8\u7126\u70B9\u53EF\u89C1\u6027 */\r
.btn:focus-visible, .icon-btn:focus-visible, .tab:focus-visible,\r
.seg button:focus-visible, a:focus-visible, .otp-box:focus-visible {\r
  outline: 2px solid var(--stamp);\r
  outline-offset: 2px;\r
}\r
\r
/* \u53D6\u4EF6\u9875:6 \u683C\u53E3\u4EE4\u8F93\u5165(\u90AE\u6233\u683C) */\r
.otp-row { display: flex; gap: 8px; justify-content: center; margin: 4px 0 8px; }\r
.otp-box {\r
  width: 46px;\r
  height: 58px;\r
  padding: 0;\r
  text-align: center;\r
  font-family: var(--serif);\r
  font-size: 26px;\r
  font-weight: 700;\r
  font-variant-numeric: tabular-nums;\r
  border: 1.5px solid var(--line);\r
  border-radius: 9px;\r
  background: var(--paper);\r
  color: var(--ink);\r
  caret-color: var(--stamp);\r
  box-shadow: 2px 2px 0 var(--hard-soft);\r
  transition: box-shadow var(--t-fast), border-color var(--t-fast);\r
}\r
.otp-box:focus { outline: none; border-color: var(--stamp); box-shadow: 3px 3px 0 var(--stamp); }\r
\r
/* \u8FDB\u5EA6\u6761:\u7B49\u5F85\u6001\u6D41\u5149 */\r
@keyframes pending-slide { from { background-position: 0 0; } to { background-position: 34px 0; } }\r
.bar > div.pending {\r
  background-image: repeating-linear-gradient(\r
    45deg,\r
    rgba(255, 255, 255, 0) 0,\r
    rgba(255, 255, 255, 0) 12px,\r
    rgba(255, 255, 255, 0.3) 12px,\r
    rgba(255, 255, 255, 0.3) 24px\r
  );\r
  background-size: 34px 34px;\r
  animation: pending-slide 0.8s linear infinite;\r
}\r
\r
.mono { font-family: ui-monospace, 'SF Mono', 'Cascadia Mono', Consolas, 'Courier New', monospace; font-variant-numeric: tabular-nums; }\r
\r
/* \u52A8\u753B\u654F\u611F\u7528\u6237 */\r
@media (prefers-reduced-motion: reduce) {\r
  *, *::before, *::after {\r
    animation-duration: 0.01ms !important;\r
    animation-iteration-count: 1 !important;\r
    transition-duration: 0.01ms !important;\r
  }\r
}\r
\r
.storage-card { padding: 14px 18px; text-align: left; min-width: 0; }\r
.storage-card small { letter-spacing: 0; }\r
.storage-value { display: flex; align-items: baseline; flex-wrap: wrap; gap: 6px; margin: 6px 0 8px; }\r
.storage-value b { font-size: 24px; white-space: nowrap; }\r
.storage-total { font-size: 14px; color: var(--muted); white-space: nowrap; }\r
.storage-meter { display: block; width: 100%; height: 6px; border: 0; background: var(--track); border-radius: 4px; overflow: hidden; }\r
.storage-meter::-webkit-meter-bar { background: var(--track); border: 0; border-radius: 4px; height: 6px; }\r
.storage-meter::-webkit-meter-optimum-value { background: var(--stamp); border-radius: 4px; }\r
.storage-meter::-moz-meter-bar { background: var(--stamp); border-radius: 4px; }\r
.storage-caption { display: flex; justify-content: space-between; gap: 8px; margin-top: 6px; }\r
@media (max-width: 1000px) {\r
  .stats-row { grid-template-columns: minmax(0, 1fr); gap: 12px; }\r
  .stats-counts .stat-card { min-height: 90px; }\r
}\r
@media (max-width: 540px) {\r
  .stats-counts { grid-template-columns: repeat(2, minmax(0, 1fr)); }\r
  .stats-counts .stat-card:last-child { grid-column: 1 / -1; flex-direction: row; align-items: center; gap: 12px; min-height: 60px; }\r
}\r
\r
/* Upload source labels and private admin details. */\r
.source-cell { min-width: 150px; max-width: 210px; white-space: normal; }\r
.source-cell small { display: block; font-size: 11px; overflow-wrap: anywhere; }\r
.source-link { padding: 0; border: 0; background: none; color: var(--ink); font: inherit; text-align: left; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; overflow-wrap: anywhere; }\r
.source-link:hover { color: var(--stamp); }\r
.source-dialog { width: min(480px, calc(100vw - 32px)); max-height: calc(100dvh - 32px); overflow: auto; padding: 0; border: 1px solid var(--line); border-radius: var(--radius); color: var(--ink); background: var(--paper); box-shadow: 0 20px 64px var(--mask); }\r
.source-dialog::backdrop { background: var(--mask); }\r
.source-heading { display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 4px 12px; padding: 10px 16px; border-bottom: 1px solid var(--line); }\r
.source-heading h3 { margin: 0; font-size: 18px; }\r
.source-heading h3:focus { outline: none; }\r
.source-body { padding: 10px 16px; }\r
#source-detail { display: grid; grid-template-columns: minmax(0, 1fr); gap: 6px; font-size: 13px; }\r
#source-detail:not(:has(.source-field)) { display: block; overflow-wrap: anywhere; }\r
.source-field { min-width: 0; display: grid; grid-template-columns: 80px minmax(0, 1fr); align-items: baseline; gap: 10px; }\r
.source-field-wide { grid-column: 1 / -1; }\r
.source-field small { font-family: inherit; font-size: 12px; font-weight: 400; }\r
.source-field span { overflow-wrap: anywhere; }\r
.source-field.mono span { font-size: 12px; line-height: 1.6; }\r
#source-form { display: grid; grid-template-columns: 80px minmax(0, 1fr); align-items: center; gap: 6px 10px; margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--line); }\r
#source-form label { font-size: 12px; color: var(--muted); }\r
#source-note { width: 100%; min-width: 0; padding: 5px 8px; background: var(--bag); color: var(--ink); border: 1px solid var(--line); border-radius: var(--radius-sm); font: inherit; font-size: 16px; }\r
#source-note:focus-visible { outline: 2px solid var(--stamp); outline-offset: 2px; }\r
#source-error { grid-column: 1 / -1; margin: 4px 0 0; }\r
.source-footer { position: sticky; bottom: 0; display: flex; justify-content: flex-end; gap: 8px; padding: 8px 16px; background: var(--paper); border-top: 1px solid var(--line); }\r
.source-footer .btn { min-height: 36px; padding: 5px 12px; }\r
@media (max-width: 420px) {\r
  .source-heading { padding: 10px 12px; }\r
  .source-body { padding: 10px 12px; }\r
  .source-field, #source-form { grid-template-columns: 64px minmax(0, 1fr); column-gap: 8px; }\r
  .source-footer { padding: 8px 12px; }\r
  .source-footer .btn { flex: 1; min-height: 40px; }\r
}\r
\r
/* Keep the type visible above the filename baseline, outside its ellipsis. */\r
.share-filename-line { display: flex; align-items: baseline; gap: 5px; width: clamp(150px, 18vw, 220px); }\r
.share-filename { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\r
.share-kind.badge { flex: none; position: relative; top: -0.45em; padding: 0 4px; font-size: 10px; line-height: 1.4; }\r
\r
/* Phone layouts keep the primary action close to the input. */\r
@media (max-width: 640px) {\r
  .topbar { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; padding: 10px 12px; margin-bottom: 12px; }\r
  .brand { min-width: 0; gap: 8px; }\r
  .brand .logo { width: 34px; height: 34px; font-size: 18px; flex: none; }\r
  .brand b { font-size: 16px; letter-spacing: 0; }\r
  .brand small { display: block; font-size: 11px; }\r
  .actions { gap: 2px; }\r
  .actions .btn, .actions .icon-btn { min-height: 40px; min-width: 40px; padding: 7px 8px; }\r
  .container { padding: 4px 12px 24px; }\r
  .card { padding: 14px; box-shadow: 3px 3px 0 var(--hard); }\r
  main:has(> .send-grid) { justify-content: flex-start; }\r
  .send-grid { grid-template-columns: minmax(0, 1fr); gap: 12px; }\r
  .flow-strip { flex-direction: row; gap: 6px; padding: 10px; margin-bottom: 12px; box-shadow: 3px 3px 0 var(--hard); }\r
  .flow-step { flex-direction: column; gap: 3px; text-align: center; }\r
  .flow-dot { width: 28px; height: 28px; font-size: 15px; }\r
  .flow-tt b { font-size: 12px; letter-spacing: 0; }\r
  .flow-tt small, .flow-link { display: none; }\r
  .card-cap { margin: 0 0 10px; letter-spacing: 0.1em; }\r
  .tabs { gap: 8px; margin-bottom: 12px; }\r
  .tab { min-height: 42px; }\r
  .dropzone { padding: 20px 12px; }\r
  .dz-icon { font-size: 28px; margin-bottom: 4px; }\r
  .options { gap: 12px; margin: 14px 0 0; }\r
  .opt-group label { margin-bottom: 5px; letter-spacing: 0.04em; }\r
  .seg { display: grid; grid-auto-columns: minmax(0, 1fr); grid-auto-flow: column; gap: 5px; }\r
  .seg button { min-height: 40px; padding: 6px 4px; font-size: 12px; }\r
  .btn.block { min-height: 44px; margin-top: 12px; }\r
  textarea, .token-input { font-size: 16px; }\r
  .file-row { gap: 8px; padding: 8px; }\r
  .fr-remove { min-width: 40px; min-height: 40px; }\r
  .fr-status { max-width: 5em; white-space: normal; overflow-wrap: anywhere; font-size: 12px; }\r
  .feat-band { gap: 8px; margin-top: 14px; }\r
  .feat { gap: 8px; padding: 10px; align-items: flex-start; }\r
  .feat-ic { width: 28px; height: 28px; font-size: 14px; }\r
  .feat > div { min-width: 0; overflow-wrap: anywhere; }\r
  .feat b { font-size: 12px; letter-spacing: 0; }\r
  .feat small { font-size: 11px; }\r
  .foot { padding: 18px 12px 12px; letter-spacing: 0.06em; }\r
  .otp-row, .code { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 6px; width: 100%; max-width: 320px; margin-inline: auto; }\r
  .otp-box, .code span { width: 100%; min-width: 0; height: 48px; font-size: 24px; }\r
  .code { padding-inline: 2px; } /* Leave room for the tilted digit borders. */\r
  .result-col { width: 100%; }\r
  .result-batch-head { padding: 12px; gap: 8px; }\r
  .result-batch-head .btn-row { width: 100%; flex-wrap: wrap; }\r
  .result-batch-head .btn { min-width: 0; padding: 8px; }\r
  .tk-head { gap: 8px; letter-spacing: 0.1em; }\r
  .tk-body { padding: 14px 12px; }\r
  .tk-foot { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 12px; gap: 8px; }\r
  .tk-foot .btn { min-height: 42px; padding: 8px 6px; }\r
  .sc-meta small { overflow-wrap: anywhere; }\r
  .modal-mask { padding: 12px; }\r
  .modal-card { padding: 16px; max-height: calc(100dvh - 24px); overflow: auto; }\r
  .modal-actions .btn { flex: 1; min-height: 42px; padding: 8px; }\r
  .stats-counts { grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px; }\r
  .stats-counts .stat-card { grid-column: span 2; min-height: 66px; padding: 10px 6px; gap: 3px; }\r
  .stats-counts .stat-card:nth-last-child(-n+2) { grid-column: span 3; }\r
  .stats-counts .stat-card:last-child { flex-direction: column; }\r
  .stat-card small { letter-spacing: 0; font-size: 11px; }\r
  .storage-card { padding: 12px 14px; }\r
  #admin-panel .table-wrap { overscroll-behavior-x: contain; }\r
  #admin-panel td .btn { min-height: 40px; }\r
  .admin-pager { display: grid; grid-template-columns: 1fr auto; gap: 10px; margin-top: 14px; }\r
  .admin-pager .pager-btns { display: flex; gap: 6px; }\r
  .admin-pager .btn { min-height: 40px; padding-inline: 8px; }\r
  .admin-pager #page-info { grid-column: 1 / -1; grid-row: 2; text-align: center; }\r
}\r
@media (max-width: 360px) {\r
  .topbar .brand .logo { display: none; }\r
  .feat { gap: 6px; padding: 8px; }\r
}\r
\r
.file-detail-link { padding: 0; border: 0; background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }\r
.file-detail-link:hover { color: var(--stamp); }\r
.guest-settings { margin: 0 0 12px; font-size: 13px; }\r
.guest-settings summary { cursor: pointer; padding: 4px 0; }\r
.login-guard-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 8px 0; }\r
.login-guard-heading .btn, .login-guard-row .btn { flex-shrink: 0; }\r
.login-guard-bans { display: grid; gap: 8px; max-height: 320px; overflow: auto; }\r
.login-guard-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 0; border-top: 1px dashed var(--line); }\r
.login-guard-info { display: grid; gap: 3px; min-width: 0; overflow-wrap: anywhere; }\r
@media (max-width: 540px) { #login-protection .btn { min-height: 40px; } }\r
#guest-policy-form { display: flex; flex-wrap: wrap; align-items: end; gap: 10px; margin: 10px 0; }\r
#guest-policy-form label { display: grid; gap: 4px; }\r
#guest-policy-form input { width: 110px; padding: 7px 8px; border: 1px solid var(--line); border-radius: 6px; background: var(--paper); color: var(--ink); font: inherit; font-size: 16px; }\r
#guest-policy-form input:focus-visible { outline: 2px solid var(--stamp); outline-offset: 2px; }\r
#upload-policy-hint { display: block; margin: 0 0 8px; font-size: 12px; }\r
.seg button:disabled { opacity: .4; cursor: not-allowed; }\r
.file-detail-link:focus-visible { outline: 2px solid var(--stamp); outline-offset: 2px; }\r
.file-detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 16px; font-size: 13px; overflow-wrap: anywhere; }\r
.file-wide { grid-column: 1 / -1; }\r
.file-identity { display: grid; gap: 4px; padding-bottom: 10px; border-bottom: 1px dashed var(--line); }\r
.file-identity strong { font-size: 14px; font-weight: 600; line-height: 1.5; }\r
.file-field { display: grid; align-content: start; gap: 3px; min-width: 0; }\r
.file-field-value { min-width: 0; font-variant-numeric: tabular-nums; }\r
.file-field .badge { white-space: normal; }\r
.file-source-link { max-width: 100%; text-align: left; overflow-wrap: anywhere; }\r
.file-technical { border-top: 1px dashed var(--line); padding-top: 8px; }\r
.file-technical summary { cursor: pointer; color: var(--muted); }\r
.file-technical-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin: 8px 0; }\r
.file-technical-grid > :first-child { grid-column: 1 / -1; }\r
#file-dialog .source-body { padding-top: 12px; padding-bottom: 12px; }\r
.retention-settings { padding-bottom: 12px; margin-bottom: 8px; border-bottom: 1px dashed var(--line); }\r
#retention-form { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; font-size: 13px; }\r
#retention-days { width: 80px; padding: 6px 8px; border: 1px solid var(--line); border-radius: 6px; background: var(--paper); color: var(--ink); font: inherit; font-size: 16px; }\r
#retention-days:focus-visible { outline: 2px solid var(--stamp); outline-offset: 2px; }\r
#retention-error { margin: 8px 0; }\r
@media (max-width: 640px) {\r
  #retention-form .btn, #retention-days { min-height: 40px; }\r
}\r
\r
/* Admin audit keeps the existing theme while separating logs from file management. */\r
.admin-nav { display: flex; gap: 8px; margin: 0 0 16px; }\r
.audit-card { padding: 20px; }\r
.audit-heading { display: flex; justify-content: space-between; gap: 16px; align-items: center; margin-bottom: 18px; }\r
.audit-heading h2 { margin: 0 0 4px; font-size: 19px; }\r
.audit-actions { display: flex; gap: 8px; align-items: center; }\r
.audit-categories { display: flex; flex-wrap: wrap; gap: 8px; border-bottom: 1px solid var(--line); margin-bottom: 14px; }\r
.audit-categories button { padding: 9px 12px; background: transparent; color: var(--muted); font: inherit; font-size: 13px; border: 0; border-bottom: 2px solid transparent; cursor: pointer; }\r
.audit-categories button[aria-pressed="true"] { color: var(--ink); border-bottom-color: var(--stamp); font-weight: bold; }\r
.audit-categories button:focus-visible { outline: 2px solid var(--stamp); outline-offset: -2px; }\r
.audit-filter { display: flex; align-items: end; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }\r
.audit-filter label { display: grid; gap: 5px; font-size: 12px; min-width: 0; }\r
.audit-filter input, .audit-filter select { min-width: 0; max-width: 100%; padding: 8px; border: 1px solid var(--line); border-radius: 6px; background: var(--paper); color: var(--ink); font: inherit; font-size: 14px; height: 36px; box-sizing: border-box; }\r
.audit-filter input:focus-visible, .audit-filter select:focus-visible { outline: 2px solid var(--stamp); outline-offset: 2px; }\r
.audit-search { flex: 1; min-width: 140px !important; }\r
.audit-table { width: 100%; font-size: 12px; }\r
.audit-table td { padding-top: 12px; padding-bottom: 12px; vertical-align: middle; }\r
.audit-table td small { display: block; margin-top: 3px; }\r
.audit-table td .audit-mobile-label { display: none; }\r
.audit-table td.audit-source, .audit-table td.audit-target { white-space: normal; min-width: 125px; max-width: 220px; overflow-wrap: anywhere; }\r
.audit-result { display: inline-block; border-radius: 5px; padding: 2px 7px; white-space: nowrap; }\r
.audit-success { color: #25814c; background: #53b77c22; }\r
.audit-failed { color: #c34b3d; background: #d45e5022; }\r
.audit-blocked { color: #bd791f; background: #dd9e3522; }\r
[data-theme="dark"] .audit-success { color: #8cd2a9; }\r
[data-theme="dark"] .audit-failed { color: #f09a8f; }\r
[data-theme="dark"] .audit-blocked { color: #ebbd72; }\r
.audit-pager { gap: 10px; margin-top: 14px; }\r
#audit-detail .file-field { min-width: 0; overflow-wrap: anywhere; }\r
#audit-detail .file-field:nth-child(10), #audit-detail .file-field:nth-child(11) { grid-column: 1 / -1; }\r
@media (max-width: 600px) {\r
  .audit-card { padding: 12px; }\r
  .audit-heading { align-items: flex-start; flex-direction: column; gap: 10px; }\r
  .audit-heading .audit-actions { width: 100%; }\r
  .audit-heading .audit-actions .btn { flex: 1; }\r
  .audit-categories { gap: 0; }\r
  .audit-categories button { flex: 1; padding: 9px 5px; font-size: 12px; }\r
  .audit-filter { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }\r
  .audit-filter .audit-search { min-width: 0 !important; }\r
  .audit-filter .audit-actions { grid-column: 1 / -1; }\r
  .audit-filter .audit-actions .btn { flex: 1; }\r
  .audit-filter input, .audit-filter select { width: 100%; font-size: 16px; height: 40px; }\r
  #admin-audit-view .btn, .admin-nav .btn { min-height: 40px; }\r
  .audit-table-wrap { overflow: visible; }\r
  .audit-table, .audit-table tbody { display: block; min-width: 0; }\r
  .audit-table thead { display: none; }\r
  .audit-table tr { display: grid; grid-template-columns: minmax(0, 1fr) auto; column-gap: 12px; padding: 12px 0; border-top: 1px dashed var(--line); }\r
  .audit-table tbody tr:hover { background: var(--rowbg); }\r
  .audit-table tbody tr:hover td { background: transparent; }\r
  .audit-table td { padding: 2px 0; border: 0; min-width: 0; white-space: normal; }\r
  .audit-table td:nth-child(1) { grid-row: 2; grid-column: 1; color: var(--muted); }\r
  .audit-table td:nth-child(2) { grid-row: 1; grid-column: 1; }\r
  .audit-table td:nth-child(2) small { display: none; }\r
  .audit-table td:nth-child(3) { grid-row: 1; grid-column: 2; text-align: right; }\r
  .audit-table td:nth-child(4) { grid-row: 4; grid-column: 1; }\r
  .audit-table td:nth-child(5) { grid-row: 3; grid-column: 1; }\r
  .audit-table td:nth-child(6) { grid-row: 5; grid-column: 1 / -1; }\r
  .audit-table td:nth-child(7) { grid-row: 2 / 5; grid-column: 2; align-self: center; }\r
  .audit-table td.audit-source, .audit-table td.audit-target { min-width: 0; max-width: none; }\r
  .audit-table td .audit-mobile-label { display: inline; margin-right: 8px; }\r
}\r
` });

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

// node_modules/hono/dist/utils/cookie.js
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
var parseSigned = /* @__PURE__ */ __name(async (cookie, secret, name) => {
  const parsedCookie = /* @__PURE__ */ Object.create(null);
  const secretKey = await getCryptoKey(secret);
  for (const [key, value] of Object.entries(parse(cookie, name))) {
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
async function ensureVisitor(c) {
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
__name(ensureVisitor, "ensureVisitor");
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
    country: typeof cf?.country === "string" && /^[A-Z]{2}$/.test(cf.country) ? cf.country : null,
    region: location(cf?.region),
    city: location(cf?.city),
    capturedAt: Date.now()
  };
}
__name(captureSource, "captureSource");
function sourceSummary(source) {
  if (!source) return null;
  const { visitorId, country, region, city, capturedAt } = source;
  return { visitorId, country, region, city, capturedAt };
}
__name(sourceSummary, "sourceSummary");

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
    async setVisitorNote(id, note) {
      if (!note) {
        await db.prepare("DELETE FROM visitor_notes WHERE visitor_id = ?1").bind(id).run();
        return;
      }
      await db.prepare("INSERT INTO visitor_notes (visitor_id, note) VALUES (?1, ?2) ON CONFLICT(visitor_id) DO UPDATE SET note = excluded.note").bind(id, note).run();
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
        `SELECT id, code, kind, filename, size, pickup_count, max_pickups, expire_at, created_at, source_json,
                  CASE WHEN kind = 'text' THEN substr(text, 1, 50) ELSE NULL END AS text_preview
           FROM shares ORDER BY created_at DESC LIMIT ?1 OFFSET ?2`
      ).bind(limit, offset).all();
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
    async setVisitorNote(id, note) {
      if (note) await kv.put("v:" + id, note);
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
        source: m.o ? JSON.parse(b64decode(m.o)) : null,
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
  const noted = !!(await getStore(c.env).getVisitorNote(source.visitorId)).trim();
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

// src/upload.ts
var uploadRoutes = new Hono2();
uploadRoutes.onError((e, c) => {
  const rejection = policyErrorResponse(c, e);
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
  const { filename, size, mime: mime2, expiry, maxPickups } = body;
  const maxSize = fileMaxSize(c.env);
  const partSize = uploadPartSize(c.env);
  const maxParts = uploadMaxParts(c.env);
  if (typeof filename !== "string" || !filename.trim()) return err(c, 400, "bad_request", "\u6587\u4EF6\u540D\u4E0D\u80FD\u4E3A\u7A7A");
  if (typeof size !== "number" || !Number.isSafeInteger(size) || size < 1) return err(c, 400, "bad_request", "\u6587\u4EF6\u5927\u5C0F\u975E\u6CD5");
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
  const source = { ...access.source, uploadTier: access.noted ? "noted" : "guest" };
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
    await c.env.BUCKET.resumeMultipartUpload(sess.r2Key, sess.uploadId).abort();
    if (!await c.env.BUCKET.head(sess.r2Key)) await releaseCapacity(c.env, [sess.r2Key]);
    await store.deleteSession(sess.id);
  }
  return c.json({ ok: true });
});

// src/share.ts
var shareRoutes = new Hono2();
shareRoutes.onError((error, c) => {
  const rejection = policyErrorResponse(c, error);
  if (rejection) return rejection;
  console.error("Share request failed", error);
  return c.json({ error: "internal", message: "\u5206\u4EAB\u670D\u52A1\u6682\u4E0D\u53EF\u7528\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5" }, 503);
});
shareRoutes.post("/shares/text", async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) return err(c, 400, "bad_request", "\u8BF7\u6C42\u4F53\u5FC5\u987B\u662F JSON");
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
    source: access.source,
    size: text2.length,
    text: text2,
    maxPickups: mp,
    expireAt
  });
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
      source: access.source,
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
function parse2(raw2, now) {
  if (raw2 === null) return { version: 1, revision: "", entries: [] };
  const data = JSON.parse(raw2);
  if (data?.version !== 1 || typeof data.revision !== "string" || !Array.isArray(data.entries) || data.entries.length > MAX_RECORDS || data.entries.some((e) => !e || typeof e.ip !== "string" || !/^(unknown|[0-9a-f:.]{3,45})$/.test(e.ip) || !Number.isInteger(e.failures) || e.failures < 1 || e.failures > LOGIN_RULES.maxFailures || !Array.isArray(e.failedAt) || e.failedAt.length !== e.failures || !e.failedAt.every((n, i) => Number.isSafeInteger(n) && n >= 0 && (i === 0 || n >= e.failedAt[i - 1])) || e.firstFailedAt !== e.failedAt[0] || e.lastFailedAt !== e.failedAt[e.failedAt.length - 1] || ![e.firstFailedAt, e.lastFailedAt, e.bannedUntil].every((n) => Number.isSafeInteger(n) && n >= 0)) || new Set(data.entries.map((e) => e.ip)).size !== data.entries.length) throw new Error("Invalid login protection state");
  data.entries = data.entries.filter((e) => {
    if (e.bannedUntil) return e.bannedUntil > now;
    e.failedAt = e.failedAt.filter((at) => at + LOGIN_RULES.windowSeconds * 1e3 > now);
    e.failures = e.failedAt.length;
    e.firstFailedAt = e.failedAt[0];
    return e.failures > 0;
  });
  return data;
}
__name(parse2, "parse");
async function read(env, now) {
  if (env.BUCKET) {
    const object = await env.BUCKET.get(LOGIN_GUARD_KEY);
    return { data: parse2(object ? await object.text() : null, now), previous: object?.etag ?? null };
  }
  await env.DB.prepare(CREATE_SETTINGS).run();
  const row = await env.DB.prepare("SELECT value FROM app_settings WHERE key=?").bind(LOGIN_GUARD_KEY).first();
  return { data: parse2(row?.value ?? null, now), previous: row?.value ?? null };
}
__name(read, "read");
async function write(env, data, previous) {
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
__name(write, "write");
async function change(env, edit) {
  try {
    for (let attempt = 0; attempt < 5; attempt++) {
      if (attempt) await new Promise((resolve) => setTimeout(resolve, 1100 + Math.random() * 200));
      const now = Date.now();
      const { data, previous } = await read(env, now);
      if (!edit(data, now)) return;
      try {
        if (await write(env, data, previous)) return;
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
__name(change, "change");
function rejectBanned(entry, now) {
  if (entry && entry.bannedUntil > now) throw new LoginProtectionError(entry.bannedUntil);
}
__name(rejectBanned, "rejectBanned");
async function checkLogin(env, ip) {
  if (!loginProtectionEnabled(env)) return;
  try {
    const now = Date.now();
    rejectBanned((await read(env, now)).data.entries.find((e) => e.ip === ip), now);
  } catch (error) {
    if (error instanceof LoginProtectionError) throw error;
    throw new LoginProtectionError();
  }
}
__name(checkLogin, "checkLogin");
async function recordLogin(env, ip, success) {
  if (!loginProtectionEnabled(env)) return;
  let bannedUntil = 0;
  await change(env, (data, now) => {
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
    if (next.failures >= LOGIN_RULES.maxFailures) next.bannedUntil = now + LOGIN_RULES.banSeconds * 1e3;
    bannedUntil = next.bannedUntil;
    if (!entry) data.entries.push(next);
    return true;
  });
  if (bannedUntil) throw new LoginProtectionError(bannedUntil, true);
}
__name(recordLogin, "recordLogin");
async function loginProtectionStatus(env) {
  const enabled = loginProtectionEnabled(env);
  if (!enabled) return { enabled, ...LOGIN_RULES, bans: [] };
  try {
    const now = Date.now();
    const { data } = await read(env, now);
    return { enabled, ...LOGIN_RULES, bans: data.entries.filter((e) => e.bannedUntil > now).sort((a, b) => b.lastFailedAt - a.lastFailedAt).map(({ failedAt: _times, ...entry }) => entry) };
  } catch {
    throw new LoginProtectionError();
  }
}
__name(loginProtectionStatus, "loginProtectionStatus");
async function unblockLogin(env, ip) {
  if (!loginProtectionEnabled(env)) throw new LoginProtectionError();
  await change(env, (data) => {
    const count = data.entries.length;
    data.entries = data.entries.filter((e) => e.ip !== ip);
    return data.entries.length !== count;
  });
}
__name(unblockLogin, "unblockLogin");

// src/audit.ts
var AUDIT_KEY = "__file-relay/audit-v1.json";
var AUDIT_DAYS = 30;
var AUDIT_LIMIT = 1e3;
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
  if (data?.version !== 1 || typeof data.revision !== "string" || !Array.isArray(data.entries) || data.entries.length > AUDIT_LIMIT || data.entries.some((e) => !e || typeof e.id !== "string" || !Number.isSafeInteger(e.at) || !["login", "operation", "security"].includes(e.category) || !["success", "failed", "blocked"].includes(e.result) || !["admin", "token", "anonymous"].includes(e.actor) || !Number.isInteger(e.status) || !Number.isFinite(e.durationMs) || !["action", "ip", "country", "region", "city", "method", "target", "agent"].every((k) => typeof e[k] === "string") || !e.detail || typeof e.detail !== "object" || Array.isArray(e.detail))) throw new Error("Invalid audit state");
  data.entries = data.entries.filter((e) => e.at >= now - AUDIT_DAYS * 864e5);
  return data;
}
__name(parse3, "parse");
async function read2(env) {
  const now = Date.now();
  if (env.BUCKET) {
    const object = await env.BUCKET.get(AUDIT_KEY);
    return { data: parse3(object ? await object.text() : null, now), previous: object?.etag ?? null };
  }
  await env.DB.prepare(CREATE_SETTINGS).run();
  const row = await env.DB.prepare("SELECT value FROM app_settings WHERE key=?").bind(AUDIT_KEY).first();
  return { data: parse3(row?.value ?? null, now), previous: row?.value ?? null };
}
__name(read2, "read");
async function write2(env, data, previous) {
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
__name(write2, "write");
async function appendAudit(env, event) {
  if (!auditEnabled(env)) return false;
  try {
    for (let attempt = 0; attempt < 5; attempt++) {
      if (attempt) await new Promise((resolve) => setTimeout(resolve, 1100 + Math.random() * 200));
      const { data, previous } = await read2(env);
      if (data.entries.some((e) => e.id === event.id)) return true;
      data.entries.push(event);
      data.entries.sort((a, b) => b.at - a.at || b.id.localeCompare(a.id));
      data.entries = data.entries.slice(0, AUDIT_LIMIT);
      try {
        if (await write2(env, data, previous)) return true;
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
  const share = /^\/api\/admin\/shares\/(\d{6})(?:\/(source|download))?$/.exec(path);
  if (share) {
    target = share[1];
    if (c.req.method === "DELETE" && !share[2]) selected = ["operation", "delete"];
    if (c.req.method === "PUT" && share[2] === "source") selected = ["operation", "note"];
    if (c.req.method === "GET" && share[2] === "source") selected = ["operation", "viewSource"];
    if (c.req.method === "GET" && share[2] === "download") selected = ["operation", "download"];
  }
  if (!selected) return;
  const isLogin = path === "/api/admin/login";
  const bearer = path === "/api/admin/cleanup" && c.req.header("Authorization")?.startsWith("Bearer ");
  if (!state.authenticated && !isLogin && !bearer) return;
  if (isLogin && c.res.status === 403) return;
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
  if (!["all", "login", "operation", "security"].includes(category) || !["all", "success", "failed", "blocked"].includes(result) || ![from, to, offset, limit].every(Number.isSafeInteger) || from < 0 || to < from || offset < 0 || limit < 1 || limit > AUDIT_LIMIT || q.length > 80) throw new RangeError("Invalid audit filters");
  const enabled = auditEnabled(env);
  const entries = enabled ? (await read2(env)).data.entries : [];
  entries.sort((a, b) => b.at - a.at || b.id.localeCompare(a.id));
  const matched = entries.filter((e) => (category === "all" || e.category === category) && (result === "all" || e.result === result) && e.at >= from && e.at <= to && (!q || `${e.ip} ${e.target} ${e.action}`.toLowerCase().includes(q)));
  return { enabled, retentionDays: AUDIT_DAYS, maxEntries: AUDIT_LIMIT, total: matched.length, offset, limit, rows: matched.slice(offset, offset + limit) };
}
__name(queryAudit, "queryAudit");

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
  c.header("Cache-Control", "no-store");
  if (c.req.method === "POST" && c.req.path === "/api/admin/login") return next();
  if (c.req.method === "POST" && c.req.path === "/api/admin/cleanup") {
    const bearer = c.req.header("Authorization");
    if (bearer?.startsWith("Bearer ")) {
      if (!c.env.ADMIN_TOKEN) return c.json({ error: "config", message: "\u7BA1\u7406\u5458\u4EE4\u724C\u672A\u914D\u7F6E" }, 503);
      const ip = loginIP(c);
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
  return c.json({ ...stats, storage, fileBackend: c.env.BUCKET ? "r2" : "kv" });
});
adminRoutes.get("/shares", async (c) => {
  const limit = Math.min(Math.max(Number(c.req.query("limit") || 50) || 50, 1), 200);
  const offset = Math.max(Number(c.req.query("offset") || 0) || 0, 0);
  const now = Date.now();
  const store = getStore(c.env);
  const { total, rows } = await store.listShares(limit, offset);
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
  if (record.kind !== "file") return err(c, 400, "bad_request", "\u6B64\u5206\u4EAB\u4E0D\u662F\u6587\u4EF6");
  const [days, storage, note] = await Promise.all([
    getRetentionDays(c.env),
    inspectFile(c.env, record.r2Key),
    record.source ? store.getVisitorNote(record.source.visitorId) : Promise.resolve("")
  ]);
  const evaluatedAt = Date.now();
  const cleanupAfter = record.expireAt === null ? null : record.expireAt + days * RETENTION_DAY_MS;
  const cleanupStatus = cleanupAfter === null ? "permanent" : record.expireAt > evaluatedAt ? "active" : cleanupAfter > evaluatedAt ? "retained" : "pending";
  return c.json({
    code,
    filename: record.filename,
    size: record.size,
    mime: record.mime,
    createdAt: record.createdAt,
    expireAt: record.expireAt,
    cleanupAfter,
    cleanupStatus,
    retentionDays: days,
    evaluatedAt,
    storage,
    source: record.source ? { ...sourceSummary(record.source), note } : null,
    pickupCount: record.pickupCount,
    maxPickups: record.maxPickups,
    status: shareStatusOf(record.expireAt, record.maxPickups, record.pickupCount, evaluatedAt),
    downloadUrl: `/api/admin/shares/${code}/download`
  });
});
adminRoutes.get("/shares/:code/download", async (c) => {
  const code = c.req.param("code");
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
});
adminRoutes.get("/shares/:code/source", async (c) => {
  const code = c.req.param("code");
  if (!/^\d{6}$/.test(code)) return err(c, 400, "bad_request", "\u53E3\u4EE4\u975E\u6CD5");
  const store = getStore(c.env);
  const record = await store.getByCode(code);
  if (!record) return err(c, 404, "not_found", "\u5206\u4EAB\u4E0D\u5B58\u5728");
  return c.json({ source: record.source ? { ...record.source, note: await store.getVisitorNote(record.source.visitorId) } : null });
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
  const note = body.note.trim();
  auditState(c).detail.notePresent = !!note;
  await store.setVisitorNote(record.source.visitorId, note);
  return c.json({ visitorId: record.source.visitorId, note });
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

// src/index.ts
var app = new Hono2();
app.onError((error, c) => {
  const rejection = policyErrorResponse(c, error) ?? loginProtectionResponse(c, error);
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
app.get("/api/config", async (c) => {
  c.header("Cache-Control", "no-store");
  const policy = await publicUploadPolicy(c);
  return c.json({
    fileBackend: fileMode(c.env) ?? "none",
    metadataBackend: c.env.fileKV ? "kv" : "d1",
    ...policy,
    maxTextLength: num(c.env.MAX_TEXT_LENGTH, 65536),
    partSize: uploadPartSize(c.env)
  });
});
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
