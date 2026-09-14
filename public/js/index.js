import { $, $$, api, fmtBytes, fmtDate, fmtDuration, iconFor, copyText, toast, initTheme, el } from './common.js';
import { t, onLangChange, initI18n } from './i18n.js';

initTheme();
initI18n();

const els = {
  dropzone: $('#dropzone'),
  dzHint: $('#dz-hint'),
  fileInput: $('#file-input'),
  fileList: $('#file-list'),
  textInput: $('#text-input'),
  textCounter: $('#text-counter'),
  btnUpload: $('#btn-upload'),
  btnText: $('#btn-text'),
  progress: $('#progress'),
  progressFill: $('#progress-fill'),
  progressText: $('#progress-text'),
  btnCancel: $('#btn-cancel'),
  results: $('#results'),
};

const MAX_SIZE_FALLBACK = 2 * 1024 * 1024 * 1024;
const MAX_BATCH = 10;
let cfg = { fileBackend: 'r2', maxFileSize: MAX_SIZE_FALLBACK }; // /api/config 加载后覆盖
let MAX_SIZE = MAX_SIZE_FALLBACK;

let files = []; // 待上传队列(File[])
let queueUI = new Map(); // File → { row, bar, status }
let queueState = new Map(); // File → 'idle' | { done: code } | 'fail'(语言切换后重渲染用)
let session = null; // 进行中的 R2 分片会话 { uploadId, partSize, parts }
let currentXhr = null;
let cancelled = false;
let uploading = false;
let lastResults = [];

/* 服务端配置:决定走分片上传(R2 大存储)还是单请求直传(KV 小存储) */
function updateHint() {
  els.dzHint.textContent = t('dz.hintMax', fmtBytes(MAX_SIZE));
}
(async () => {
  try {
    cfg = await api('/api/config');
    MAX_SIZE = cfg.maxFileSize || MAX_SIZE_FALLBACK;
    updateHint();
  } catch { /* 保持默认 */ }
})();

/* 语言切换:重算动态文案与结果卡片 */
onLangChange(() => {
  if (cfg.maxFileSize) updateHint();
  renderQueue();
  if (lastResults.length) showResults(lastResults);
});

/* ---------- tabs ---------- */
$$('.tab').forEach((tb) =>
  tb.addEventListener('click', () => {
    if (uploading) return; // 上传中禁止切换
    $$('.tab').forEach((x) => x.classList.toggle('active', x === tb));
    const tab = tb.dataset.tab;
    $('#panel-file').hidden = tab !== 'file';
    $('#panel-text').hidden = tab !== 'text';
    els.btnUpload.hidden = tab !== 'file';
    els.btnText.hidden = tab !== 'text';
    hideResult();
  }),
);

/* ---------- segmented 选项 ---------- */
for (const id of ['seg-expiry', 'seg-pickups']) {
  $(`#${id}`).addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    $$('button', $(`#${id}`)).forEach((x) => x.classList.toggle('active', x === b));
  });
}
function readOptions() {
  const exp = $('#seg-expiry .active').dataset.v;
  const pk = $('#seg-pickups .active').dataset.v;
  return { expiry: exp, maxPickups: pk === 'null' ? null : Number(pk) };
}

/* ---------- 文件队列:点击 / 全窗口拖拽 / 智能粘贴,再选即整体替换 ---------- */
els.dropzone.addEventListener('click', () => els.fileInput.click());
els.dropzone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); els.fileInput.click(); }
});
els.fileInput.addEventListener('change', () => {
  setFiles([...els.fileInput.files]);
  els.fileInput.value = '';
});

function showTab(name) {
  const tb = $(`.tab[data-tab="${name}"]`);
  if (tb && !tb.classList.contains('active')) tb.click(); // 上传中时 tab 处理器自己会拒绝
}

/* 拖到页面任意位置都高亮并可放下(不再要求精确命中拖拽区) */
let dragDepth = 0;
window.addEventListener('dragenter', (e) => {
  if (![...(e.dataTransfer?.types || [])].includes('Files')) return;
  dragDepth++;
  if (!uploading) els.dropzone.classList.add('dragover');
});
window.addEventListener('dragleave', () => {
  if (--dragDepth <= 0) { dragDepth = 0; els.dropzone.classList.remove('dragover'); }
});
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => {
  e.preventDefault();
  dragDepth = 0;
  els.dropzone.classList.remove('dragover');
  if (e.dataTransfer?.files?.length) setFiles([...e.dataTransfer.files]);
});

/* 粘贴智能路由:粘贴文件→文件页;文件页粘贴纯文本→自动切到文本页 */
document.addEventListener('paste', (e) => {
  if (e.target?.closest?.('textarea, input')) return; // 输入框内粘贴走默认行为
  if (e.clipboardData?.files?.length) {
    setFiles([...e.clipboardData.files]);
    return;
  }
  const text = e.clipboardData?.getData('text/plain');
  if (text && $('#panel-text').hidden) {
    showTab('text');
    els.textInput.value = text;
    els.textInput.dispatchEvent(new Event('input'));
  }
});

function setFiles(list) {
  if (uploading) return;
  const ok = [];
  for (const f of list) {
    if (f.size > MAX_SIZE) { toast(t('err.oversize', fmtBytes(MAX_SIZE), fmtBytes(f.size)), 'error'); continue; }
    if (f.size < 1) { toast(t('err.empty'), 'error'); continue; }
    ok.push(f);
  }
  if (ok.length > MAX_BATCH) {
    toast(t('err.tooMany', MAX_BATCH), 'error');
    ok.length = MAX_BATCH;
  }
  files = ok; // 替换语义:再次选择即重置队列
  queueState = new Map(files.map((f) => [f, 'idle']));
  renderQueue();
  els.btnUpload.disabled = files.length === 0;
  hideResult();
}

function statusText(f, st) {
  if (st === 'fail') return '✗';
  if (st && st.done) return `✓ ${st.done}`;
  return fmtBytes(f.size);
}

function renderQueue() {
  els.fileList.replaceChildren();
  queueUI = new Map();
  files.forEach((f) => {
    const st = queueState.get(f) || 'idle';
    const bar = el('div', { class: 'fr-bar' });
    const status = el('small', { class: 'fr-status' }, statusText(f, st));
    const row = el('div', {
      class: `file-row${st === 'fail' ? ' fail' : ''}${st && st.done ? ' done' : ''}`,
    });
    row.replaceChildren(
      el('span', { class: 'fr-icon' }, iconFor(f.name, f.type)),
      el('div', { class: 'fr-meta' },
        el('b', { title: f.name }, f.name),
        el('small', {}, `${fmtBytes(f.size)} · ${f.type || t('unknown.type')}`),
      ),
      status,
      el('button', { class: 'icon-btn fr-remove', title: t('remove'), type: 'button', onclick: () => removeFile(f) }, '✕'),
      bar,
    );
    if (st && st.done) bar.style.width = '100%';
    queueUI.set(f, { row, bar, status });
    els.fileList.append(row);
  });
  els.fileList.hidden = files.length === 0;
  els.dropzone.hidden = files.length > 0;
}

function removeFile(f) {
  if (uploading) return;
  files = files.filter((x) => x !== f);
  queueState.delete(f);
  renderQueue();
  els.btnUpload.disabled = files.length === 0;
}

/* ---------- 文本输入 ---------- */
els.textInput.addEventListener('input', () => {
  els.textCounter.textContent = t('text.counter', els.textInput.value.length, 65536);
  els.btnText.disabled = !els.textInput.value.trim();
});

/* ---------- 上传:队列顺序逐个,聚合进度 + 每行迷你进度 ---------- */
els.btnUpload.addEventListener('click', startUpload);
els.btnCancel.addEventListener('click', cancelUpload);
els.btnText.addEventListener('click', submitText);

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function xhrPut(url, blob, onProgress) {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    currentXhr = xhr;
    xhr.open('PUT', url);
    xhr.onload = () => {
      let etag = null;
      try { etag = JSON.parse(xhr.responseText).etag; } catch { /* ignore */ }
      resolve(xhr.status >= 200 && xhr.status < 300 && etag ? etag : null);
    };
    xhr.onerror = () => resolve(null);
    xhr.onabort = () => resolve(null);
    xhr.upload.onprogress = (e) => onProgress && e.lengthComputable && onProgress(e.loaded);
    xhr.send(blob);
  });
}

/** 单片最多重试 3 次,退避 1s/2s/4s */
async function putPartWithRetry(uploadId, n, blob, onProgress) {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (cancelled) return null;
    const etag = await xhrPut(`/api/uploads/${uploadId}/parts/${n}`, blob, onProgress);
    if (etag) return etag;
    await sleep([1000, 2000, 4000][attempt] || 4000);
  }
  return null;
}

function xhrJson(method, url, blob, onProgress) {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    currentXhr = xhr;
    xhr.open(method, url);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)); return; } catch { /* fallthrough */ }
      }
      resolve(null);
    };
    xhr.onerror = () => resolve(null);
    xhr.onabort = () => resolve(null);
    xhr.upload.onprogress = (e) => onProgress && e.lengthComputable && onProgress(e.loaded);
    xhr.send(blob);
  });
}

let speedState = { t: 0, loaded: 0, speed: 0 };
let curFileIdx = 0;
let curFileTotal = 1;
function updateAggregate(loaded, total) {
  const pct = Math.min(100, Math.floor((loaded / total) * 100));
  els.progressFill.style.width = pct + '%';
  const now = performance.now();
  if (speedState.t && loaded > speedState.loaded) {
    const inst = (loaded - speedState.loaded) / ((now - speedState.t) / 1000);
    speedState.speed = speedState.speed ? speedState.speed * 0.7 + inst * 0.3 : inst;
  }
  speedState.t = now;
  speedState.loaded = loaded;
  let text = `${pct}% · ${fmtBytes(loaded)} / ${fmtBytes(total)} · ${fmtBytes(speedState.speed)}/s`;
  if (speedState.speed > 1024 && loaded > 0 && loaded < total) {
    text += ` · ${t('prog.eta', fmtDuration((total - loaded) / speedState.speed))}`;
  }
  if (curFileTotal > 1) text += ` · ${t('prog.file', curFileIdx, curFileTotal)}`;
  els.progressText.textContent = text;
}

/** 等待态(初始化/重试间隔/合并分片):进度条叠加流光动画 */
function setPending(on) {
  els.progressFill.classList.toggle('pending', on);
}

async function startUpload() {
  if (!files.length || uploading) return;
  uploading = true;
  cancelled = false;
  speedState = { t: 0, loaded: 0, speed: 0 };
  curFileIdx = 0;
  curFileTotal = files.length;
  const opts = readOptions();
  const responses = [];
  const totalBytes = files.reduce((s, f) => s + f.size, 0);
  let baseBytes = 0;
  setBusy(true);
  els.progress.hidden = false;
  els.progressFill.style.width = '0%';
  setPending(false);
  els.progressText.textContent = t('prog.preparing');

  for (let i = 0; i < files.length; i++) {
    if (cancelled) break;
    const f = files[i];
    const ui = queueUI.get(f);
    curFileIdx = i + 1;
    ui.row.classList.add('uploading');
    els.progressText.textContent = t('prog.uploading');
    const onProgress = (loaded) => {
      ui.bar.style.width = Math.min(100, (loaded / f.size) * 100) + '%';
      updateAggregate(baseBytes + loaded, totalBytes);
    };
    try {
      const res = cfg.fileBackend === 'kv'
        ? await directUpload(f, opts, onProgress)
        : await multipartUpload(f, opts, onProgress);
      responses.push(res);
      baseBytes += f.size;
      queueState.set(f, { done: res.code });
      ui.bar.style.width = '100%';
      ui.row.classList.add('done');
      ui.status.textContent = `✓ ${res.code}`;
    } catch (e) {
      queueState.set(f, 'fail');
      ui.row.classList.add('fail');
      ui.status.textContent = '✗';
      if (!cancelled) toast(`${f.name}: ${e.message || t('err.upload')}`, 'error');
      break; // 一个失败即停,保留队列便于处理
    }
  }

  uploading = false;
  els.progress.hidden = true;
  setPending(false);
  setBusy(false);
  if (cancelled) toast(t('toast.cancelled'));
  if (responses.length) showResults(responses);
}

/* ---------- 小存储模式(KV):单请求直传,失败整文件重发 ---------- */
async function directUpload(f, opts, onProgress) {
  const qs = new URLSearchParams({
    filename: f.name,
    mime: f.type || 'application/octet-stream',
    expiry: opts.expiry,
  });
  if (opts.maxPickups !== null) qs.set('maxPickups', String(opts.maxPickups));

  for (let attempt = 0; attempt < 3; attempt++) {
    if (cancelled) throw new Error('cancelled');
    setPending(false);
    const res = await xhrJson('POST', `/api/shares/file?${qs}`, f, onProgress);
    if (res) return res;
    if (cancelled) throw new Error('cancelled');
    setPending(true);
    els.progressText.textContent = t('prog.retry', attempt + 1);
    await sleep([1000, 2000][attempt] || 4000);
  }
  throw new Error(t('err.upload'));
}

/* ---------- 大存储模式(R2):分片上传 ---------- */
async function multipartUpload(f, opts, onProgress) {
  setPending(true);
  els.progressText.textContent = t('prog.init');
  const init = await api('/api/uploads/init', {
    method: 'POST',
    body: { filename: f.name, size: f.size, mime: f.type || 'application/octet-stream', ...opts },
  });
  session = init;
  setPending(false);

  const etags = [];
  let doneBytes = 0;
  for (let i = 1; i <= init.parts; i++) {
    const blob = f.slice((i - 1) * init.partSize, Math.min(i * init.partSize, f.size));
    const etag = await putPartWithRetry(init.uploadId, i, blob, (loaded) =>
      onProgress(doneBytes + loaded),
    );
    if (!etag) {
      const wasCancelled = cancelled;
      await abortUpload();
      throw new Error(wasCancelled ? 'cancelled' : t('err.upload'));
    }
    etags.push({ partNumber: i, etag });
    doneBytes += blob.size;
  }
  if (cancelled) throw new Error('cancelled');

  els.progressFill.style.width = '100%';
  setPending(true);
  els.progressText.textContent = t('prog.merging');
  try {
    const res = await api(`/api/uploads/${init.uploadId}/complete`, {
      method: 'POST',
      body: { parts: etags },
    });
    session = null;
    return res;
  } catch (e) {
    session = null;
    throw e;
  }
}

async function cancelUpload() {
  cancelled = true;
  currentXhr?.abort();
  await abortUpload();
}

async function abortUpload() {
  if (!session) return;
  const id = session.uploadId;
  session = null;
  try { await api(`/api/uploads/${id}/abort`, { method: 'POST', body: {} }); } catch { /* ignore */ }
}

function setBusy(busy) {
  els.btnUpload.disabled = busy || files.length === 0;
  els.btnText.disabled = busy || !els.textInput.value.trim();
}

/* 刷新/关页时尽力通知服务端放弃(不是断点续传) */
window.addEventListener('pagehide', () => {
  if (session) navigator.sendBeacon(`/api/uploads/${session.uploadId}/abort`);
});

/* ---------- 文本分享 ---------- */
async function submitText() {
  const text = els.textInput.value;
  if (!text.trim()) return;
  setBusy(true);
  try {
    const res = await api('/api/shares/text', { method: 'POST', body: { text, ...readOptions() } });
    showResults([res]);
  } catch (e) {
    toast(e.message || t('err.submit'), 'error');
  } finally {
    setBusy(false);
  }
}

/* ---------- 结果卡片(多文件时逐张堆叠 + 批量头部) ---------- */
function qrSvgFor(url) {
  /* vendored qrcode-generator:全局 window.qrcode(classic script 先于本模块加载) */
  try {
    const qr = window.qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    const holder = document.createElement('div');
    holder.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true, alt: t('qr.hint') });
    return holder.firstElementChild;
  } catch { return null; }
}

function metaText(r) {
  const parts = [];
  parts.push(r.expireAt
    ? t('meta.after', fmtDuration((r.expireAt - Date.now()) / 1000), fmtDate(r.expireAt))
    : t('meta.forever'));
  parts.push(r.maxPickups === null || r.maxPickups === undefined ? t('meta.unlimited') : t('meta.pickups', r.maxPickups));
  if (r.kind === 'file' && r.size) parts.push(fmtBytes(r.size));
  return parts.join(' · ');
}

/* 结果卡片 = 取件凭证票据:票头(标题+№) → 票身(口令+二维码) → 撕票线 → 票脚(操作) */
function buildResultCard(r, compact) {
  const link = `${location.origin}/pickup?code=${r.code}`;
  const qr = qrSvgFor(link);
  const col = el('div', { class: 'result-col' },
    compact && r.kind === 'file' && r.filename ? el('div', { class: 'result-file-name' }, r.filename) : null,
    el('div', { class: 'code' }, ...r.code.split('').map((d) => el('span', {}, d))),
    el('div', { class: 'result-link' }, link),
    el('div', { class: 'result-meta' }, metaText(r)),
  );
  const main = el('div', { class: 'result-main' },
    qr ? el('div', { class: 'qr-wrap', title: t('qr.hint') }, qr, el('div', { class: 'qr-hint' }, t('qr.hint'))) : null,
    col,
  );
  return el('div', { class: 'result' },
    el('div', { class: 'tk-head' },
      el('span', {}, t('ticket.title')),
      el('span', { class: 'tk-no' }, t('ticket.no', r.code)),
    ),
    el('div', { class: 'tk-body' },
      compact ? null : el('p', { class: 'result-title' }, t('result.ok')),
      main,
    ),
    el('div', { class: 'tk-tear' }),
    el('div', { class: 'tk-foot' },
      el('button', { class: 'btn primary', type: 'button', onclick: (e) => copyBtn(e.currentTarget, r.code, t('label.code')) }, t('btn.copyCode')),
      el('button', { class: 'btn', type: 'button', onclick: (e) => copyBtn(e.currentTarget, link, t('label.link')) }, t('btn.copyLink')),
      compact ? null : el('button', { class: 'btn ghost', type: 'button', onclick: resetAll }, t('btn.again')),
    ),
  );
}

function showResults(list) {
  lastResults = list;
  els.results.replaceChildren();
  if (list.length > 1) {
    els.results.append(
      el('div', { class: 'result-batch-head' },
        el('p', { class: 'result-title batch' }, t('result.okBatch', list.length)),
        el('div', { class: 'btn-row' },
          el('button', {
            class: 'btn small', type: 'button',
            onclick: async (e) => {
              const ok = await copyText(list.map((r) => r.code).join('\n'));
              toast(ok ? t('copied', t('label.code')) : t('copy.fail'), ok ? 'ok' : 'error');
            },
          }, t('btn.copyAll')),
          el('button', { class: 'btn small ghost', type: 'button', onclick: resetAll }, t('btn.again')),
        ),
      ),
    );
  }
  for (const r of list) els.results.append(buildResultCard(r, list.length > 1));
  els.results.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function resetAll() {
  files = [];
  queueState = new Map();
  renderQueue();
  els.btnUpload.disabled = true;
  els.textInput.value = '';
  els.textCounter.textContent = t('text.counter', 0, 65536);
  els.btnText.disabled = true;
  hideResult();
}

/** 复制成功后按钮短暂变成"✓ 已复制" */
async function copyBtn(btn, text, label) {
  const ok = await copyText(text);
  toast(ok ? t('copied', label) : t('copy.fail'), ok ? 'ok' : 'error');
  if (!ok) return;
  btn.textContent = t('copied.btn');
  btn.disabled = true;
  setTimeout(() => { btn.textContent = label === t('label.code') ? t('btn.copyCode') : t('btn.copyLink'); btn.disabled = false; }, 1500);
}

function hideResult() {
  lastResults = [];
  els.results.replaceChildren();
}
