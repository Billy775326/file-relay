export const $ = (sel, el = document) => el.querySelector(sel);
export const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

/** fetch JSON 封装:非 2xx 抛错(带服务端的中文 message 与机器码) */
export async function api(path, opts = {}) {
  const res = await fetch(path, {
    method: opts.method || 'GET',
    headers: opts.body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* 非 JSON 响应 */ }
  if (!res.ok) {
    const e = new Error(data?.message || `请求失败 (${res.status})`);
    e.code = data?.error || 'unknown';
    e.status = res.status;
    throw e;
  }
  return data;
}

export function fmtBytes(n) {
  if (!Number.isFinite(n) || n < 0) return '-';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  const v = i === 0 ? Math.round(n) : n >= 100 ? Math.round(n) : Math.round(n * 10) / 10;
  return `${v} ${units[i]}`;
}

export function fmtDate(ms) {
  if (ms === null || ms === undefined) return '永久';
  const d = new Date(ms);
  const p = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** 秒数人性化:用于上传剩余时间 / 过期倒计时 */
export function fmtDuration(sec) {
  if (!Number.isFinite(sec) || sec < 0) return '-';
  if (sec < 1) return '不足 1 秒';
  if (sec < 60) return `${Math.round(sec)} 秒`;
  if (sec < 3600) {
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return s ? `${m} 分 ${s} 秒` : `${m} 分`;
  }
  if (sec < 86400) {
    const h = Math.floor(sec / 3600);
    const m = Math.round((sec % 3600) / 60);
    return m ? `${h} 时 ${m} 分` : `${h} 时`;
  }
  return `${Math.round(sec / 86400)} 天`;
}

/** 按文件名/ MIME 挑一个直观图标(纯展示用) */
export function iconFor(name = '', mime = '') {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'].includes(ext)) return '🖼️';
  if (mime.startsWith('video/') || ['mp4', 'mkv', 'mov', 'avi', 'webm', 'flv'].includes(ext)) return '🎬';
  if (mime.startsWith('audio/') || ['mp3', 'flac', 'wav', 'ogg', 'm4a', 'aac'].includes(ext)) return '🎵';
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(ext)) return '🗜️';
  if (mime === 'application/pdf' || ext === 'pdf') return '📕';
  if (['doc', 'docx', 'txt', 'md', 'ppt', 'pptx', 'xls', 'xlsx', 'csv'].includes(ext)) return '📄';
  if (['js', 'ts', 'py', 'json', 'html', 'css', 'java', 'go', 'rs', 'c', 'cpp', 'sh', 'yml', 'yaml', 'xml'].includes(ext)) return '🧩';
  return '📦';
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch { /* 走降级 */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

export function toast(msg, type = 'info') {
  let host = $('#toast-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toast-host';
    document.body.appendChild(host);
  }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  host.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 300);
  }, 2400);
}

export function initTheme() {
  const btn = $('#theme-btn');
  const meta = $('meta[name="theme-color"]');
  const sync = () => {
    if (meta) meta.content = document.documentElement.dataset.theme === 'dark' ? '#0f1117' : '#f6f7fb';
  };
  sync();
  btn?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', next);
    document.documentElement.dataset.theme = next;
    sync();
  });
}

/** 安全 DOM 构建:全部 textContent,防 XSS */
export function el(tag, attrs = {}, ...children) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k === 'href' || k === 'download' || k === 'type' || k === 'inputmode' || k === 'colspan') n.setAttribute(k, v);
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else n[k] = v;
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    n.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return n;
}
