/** Browser navigation gets a readable page; API clients keep the JSON response. */
export function securityDownloadPage(data: object): string {
    const payload = JSON.stringify(data).replace(/</g, '\\u003c');
    return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>文件下载 · 文件中转站</title><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/ui.css">
<script type="module" src="/js/security-download.js"></script></head><body>
<header class="topbar"><div class="brand"><span class="logo">📦</span><b>文件中转站</b></div>
<div class="actions"><button id="lang-btn" class="icon-btn">EN</button><button id="theme-btn" class="icon-btn" aria-label="切换主题">🌗</button></div></header>
<main class="container narrow"><section id="download-feedback"></section>
<noscript><p>当前无法下载，请稍后重试或联系站长。</p><a href="mailto:iblykk@gmail.com">联系站长</a></noscript>
<p><a id="back-pickup" href="/pickup">返回取件页</a></p></main>
<script type="application/json" id="security-data">${payload}</script></body></html>`;
}
