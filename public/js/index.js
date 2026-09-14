import { $, $$, api, fmtBytes, fmtDate, fmtDuration, iconFor, copyText, toast, initTheme } from './common.js';

initTheme();

const els = {
  dropzone: $('#dropzone'),
  dzHint: $('#dz-hint'),
  fileInput: $('#file-input'),
  fileInfo: $('#file-info'),
  fiName: $('#fi-name'),
  fiSize: $('#fi-size'),
  fiIcon: $('.fi-icon'),
  fiRemove: $('#fi-remove'),
  textInput: $('#text-input'),
  textCounter: $('#text-counter'),
  btnUpload: $('#btn-upload'),
  btnText: $('#btn-text'),
  progress: $('#progress'),
  progressFill: $('#progress-fill'),
  progressText: $('#progress-text'),
  btnCancel: $('#btn-cancel'),
  result: $('#result'),
  resultCode: $('#result-code'),
  resultLink: $('#result-link'),
  resultMeta: $('#result-meta'),
};

const MAX_SIZE_FALLBACK = 2 * 1024 * 1024 * 1024;
let cfg = { fileBackend: 'r2', maxFileSize: MAX_SIZE_FALLBACK }; // /api/config 加载后覆盖
let MAX_SIZE = MAX_SIZE_FALLBACK;

let file = null;
let session = null; // 进行中的上传会话 { uploadId, partSize, parts }
let currentXhr = null;
let cancelled = false;

/* 服务端配置:决定走分片上传(R2 大存储)还是单请求直传(KV 小存储) */
(async () => {
  try {
    cfg = await api('/api/config');
    MAX_SIZE = cfg.maxFileSize || MAX_SIZE_FALLBACK;
    els.dzHint.textContent = `单个文件最大 ${fmtBytes(MAX_SIZE)} · 上传后生成 6 位取件口令`;
  } catch { /* 保持默认 */ }
})();

/* ---------- tabs ---------- */
$$('.tab').forEach((t) =>
  t.addEventListener('click', () => {
    if (session) return; // 上传中禁止切换
    $$('.tab').forEach((x) => x.classList.toggle('active', x === t));
    const tab = t.dataset.tab;
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

/* ---------- 文件选择:点击 / 全窗口拖拽 / 智能粘贴 ---------- */
els.dropzone.addEventListener('click', () => els.fileInput.click());
els.dropzone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); els.fileInput.click(); }
});
els.fileInput.addEventListener('change', () => {
  if (els.fileInput.files[0]) setFile(els.fileInput.files[0]);
  els.fileInput.value = '';
});

function showTab(name) {
  const t = $(`.tab[data-tab="${name}"]`);
  if (t && !t.classList.contains('active')) t.click(); // 上传中时 tab 处理器自己会拒绝
}

/* 拖到页面任意位置都高亮并可放下(不再要求精确命中拖拽区) */
let dragDepth = 0;
window.addEventListener('dragenter', (e) => {
  if (![...(e.dataTransfer?.types || [])].includes('Files')) return;
  dragDepth++;
  if (!session) els.dropzone.classList.add('dragover');
});
window.addEventListener('dragleave', () => {
  if (--dragDepth <= 0) { dragDepth = 0; els.dropzone.classList.remove('dragover'); }
});
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => {
  e.preventDefault();
  dragDepth = 0;
  els.dropzone.classList.remove('dragover');
  if (e.dataTransfer?.files?.[0]) setFile(e.dataTransfer.files[0]);
});

/* 粘贴智能路由:粘贴文件→文件页;文件页粘贴纯文本→自动切到文本页 */
document.addEventListener('paste', (e) => {
  if (e.target?.closest?.('textarea, input')) return; // 输入框内粘贴走默认行为
  if (e.clipboardData?.files?.[0]) {
    setFile(e.clipboardData.files[0]);
    return;
  }
  const text = e.clipboardData?.getData('text/plain');
  if (text && $('#panel-text').hidden) {
    showTab('text');
    els.textInput.value = text;
    els.textInput.dispatchEvent(new Event('input'));
  }
});

function setFile(f) {
  if (session) return;
  if (f.size > MAX_SIZE) {
    toast(`文件超过 ${fmtBytes(MAX_SIZE)} 上限(${fmtBytes(f.size)})`, 'error');
    return;
  }
  if (f.size < 1) { toast('空文件不能分享', 'error'); return; }
  if ($('#panel-file').hidden) showTab('file');
  file = f;
  els.fiIcon.textContent = iconFor(f.name, f.type);
  els.fiName.textContent = f.name;
  els.fiSize.textContent = `${fmtBytes(f.size)} · ${f.type || '未知类型'}`;
  els.fileInfo.hidden = false;
  els.dropzone.hidden = true;
  els.btnUpload.disabled = false;
  hideResult();
}
function clearFile() {
  file = null;
  els.fileInfo.hidden = true;
  els.dropzone.hidden = false;
  els.btnUpload.disabled = true;
}
els.fiRemove.addEventListener('click', clearFile);

/* ---------- 文本输入 ---------- */
els.textInput.addEventListener('input', () => {
  const len = els.textInput.value.length;
  els.textCounter.textContent = `${len} / 65536`;
  els.btnText.disabled = !els.textInput.value.trim();
});

/* ---------- 上传 ---------- */
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

let speedState = { t: 0, loaded: 0, speed: 0 };
function updateProgress(loaded, total, partIdx, parts) {
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
    text += ` · 剩余 ${fmtDuration((total - loaded) / speedState.speed)}`;
  }
  els.progressText.textContent = parts <= 1 ? text : `${text} · 第 ${partIdx}/${parts} 片`;
}

/** 等待态(初始化/重试间隔/合并分片):进度条叠加流光动画 */
function setPending(on) {
  els.progressFill.classList.toggle('pending', on);
}

async function startUpload() {
  if (!file || session) return;
  if (cfg.fileBackend === 'kv') return directUpload();
  return multipartUpload();
}

/* ---------- 小存储模式(KV):单请求直传,失败整文件重发 ---------- */
async function directUpload() {
  const opts = readOptions();
  setBusy(true);
  cancelled = false;
  speedState = { t: 0, loaded: 0, speed: 0 };
  els.progress.hidden = false;
  els.progressFill.style.width = '0%';
  setPending(false);
  els.progressText.textContent = '上传中…';

  const qs = new URLSearchParams({
    filename: file.name,
    mime: file.type || 'application/octet-stream',
    expiry: opts.expiry,
  });
  if (opts.maxPickups !== null) qs.set('maxPickups', String(opts.maxPickups));

  for (let attempt = 0; attempt < 3; attempt++) {
    if (cancelled) { resetAfterUpload(); return; }
    setPending(false);
    const res = await xhrJson('POST', `/api/shares/file?${qs}`, file, (loaded) =>
      updateProgress(loaded, file.size, 1, 1),
    );
    if (res) {
      els.progress.hidden = true;
      showResult(res);
      setBusy(false);
      return;
    }
    setPending(true);
    els.progressText.textContent = `上传失败,重试 ${attempt + 1}/3…`;
    await sleep([1000, 2000][attempt] || 4000);
  }
  if (!cancelled) toast('上传失败,请重试', 'error');
  resetAfterUpload();
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

/* ---------- 大存储模式(R2):分片上传 ---------- */
async function multipartUpload() {
  const opts = readOptions();
  setBusy(true);
  speedState = { t: 0, loaded: 0, speed: 0 };
  els.progress.hidden = false;
  els.progressFill.style.width = '0%';
  setPending(true);
  els.progressText.textContent = '初始化…';

  try {
    const init = await api('/api/uploads/init', {
      method: 'POST',
      body: { filename: file.name, size: file.size, mime: file.type || 'application/octet-stream', ...opts },
    });
    session = init;
    cancelled = false;
    setPending(false);

    const etags = [];
    let doneBytes = 0;
    for (let i = 1; i <= init.parts; i++) {
      const blob = file.slice((i - 1) * init.partSize, Math.min(i * init.partSize, file.size));
      const etag = await putPartWithRetry(init.uploadId, i, blob, (loaded) =>
        updateProgress(doneBytes + loaded, file.size, i, init.parts),
      );
      if (!etag) {
        if (!cancelled) {
          await abortUpload();
          toast('上传失败,请重试', 'error');
        }
        resetAfterUpload();
        return;
      }
      etags.push({ partNumber: i, etag });
      doneBytes += blob.size;
    }
    if (cancelled) return;

    els.progressFill.style.width = '100%';
    setPending(true);
    els.progressText.textContent = '正在合并分片…';
    const res = await api(`/api/uploads/${init.uploadId}/complete`, {
      method: 'POST',
      body: { parts: etags },
    });
    session = null;
    els.progress.hidden = true;
    showResult(res);
  } catch (e) {
    toast(e.message || '上传失败', 'error');
    resetAfterUpload();
  }
}

async function cancelUpload() {
  cancelled = true;
  currentXhr?.abort();
  await abortUpload();
  toast('已取消上传');
  resetAfterUpload();
}

async function abortUpload() {
  if (!session) return;
  const id = session.uploadId;
  session = null;
  try { await api(`/api/uploads/${id}/abort`, { method: 'POST', body: {} }); } catch { /* ignore */ }
}

function setBusy(busy) {
  els.btnUpload.disabled = busy || !file;
  els.btnText.disabled = busy || !els.textInput.value.trim();
}

function resetAfterUpload() {
  session = null;
  els.progress.hidden = true;
  setPending(false);
  setBusy(false);
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
    showResult(res);
  } catch (e) {
    toast(e.message || '提交失败', 'error');
  } finally {
    setBusy(false);
  }
}

/* ---------- 结果卡片 ---------- */
function showResult(res) {
  /* 口令逐位渲染成瓦片,与取件页 OTP 风格呼应 */
  els.resultCode.replaceChildren(
    ...res.code.split('').map((d) => {
      const s = document.createElement('span');
      s.textContent = d;
      return s;
    }),
  );
  const link = `${location.origin}/pickup?code=${res.code}`;
  els.resultLink.textContent = link;
  const meta = [];
  meta.push(res.expireAt
    ? `${fmtDuration((res.expireAt - Date.now()) / 1000)}后过期(${fmtDate(res.expireAt)})`
    : '永久有效');
  meta.push(res.maxPickups === null || res.maxPickups === undefined ? '取件次数不限' : `可取 ${res.maxPickups} 次`);
  if (res.kind === 'file' && res.size) meta.push(fmtBytes(res.size));
  els.resultMeta.textContent = meta.join(' · ');
  els.result.hidden = false;
  els.result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  $('#btn-copy-code').onclick = (e) => copyBtn(e.currentTarget, res.code, '口令');
  $('#btn-copy-link').onclick = (e) => copyBtn(e.currentTarget, link, '链接');
  $('#btn-again').onclick = () => {
    hideResult();
    clearFile();
    els.textInput.value = '';
    els.textCounter.textContent = '0 / 65536';
    els.btnText.disabled = true;
  };
}

/** 复制成功后按钮短暂变成"✓ 已复制" */
async function copyBtn(btn, text, label) {
  const ok = await copyText(text);
  toast(ok ? `${label}已复制` : '复制失败,请手动复制', ok ? 'ok' : 'error');
  if (!ok) return;
  const orig = btn.textContent;
  btn.textContent = '✓ 已复制';
  btn.disabled = true;
  setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 1500);
}
function hideResult() { els.result.hidden = true; }
