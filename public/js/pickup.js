import { $, api, fmtBytes, fmtDate, copyText, toast, initTheme, el } from './common.js';

initTheme();

const input = $('#code-input');
const errorBox = $('#pickup-error');
const resultCard = $('#pickup-result');
let querying = false;

input.addEventListener('input', () => {
  input.value = input.value.replace(/\D/g, '').slice(0, 6);
  hideError();
  if (input.value.length === 6 && !querying) submit();
});
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && input.value.length === 6 && !querying) submit();
});

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.hidden = false;
}
function hideError() {
  errorBox.hidden = true;
}

async function submit() {
  const code = input.value;
  querying = true;
  hideError();
  resultCard.hidden = true;
  try {
    const res = await api('/api/pickup', { method: 'POST', body: { code } });
    render(res, code);
  } catch (e) {
    showError(e.message || '取件失败');
  } finally {
    querying = false;
  }
}

function metaLine(res) {
  const parts = [];
  parts.push(res.expireAt ? `${fmtDate(res.expireAt)} 过期` : '永久有效');
  parts.push(res.pickupsLeft === null || res.pickupsLeft === undefined ? '取件次数不限' : `剩余可取 ${res.pickupsLeft} 次`);
  return parts.join(' · ');
}

function render(res, code) {
  resultCard.replaceChildren();

  if (res.kind === 'text') {
    const pre = el('pre', { class: 'text-body' });
    pre.textContent = res.text ?? '';
    resultCard.append(
      el('div', { class: 'share-card' },
        el('span', { class: 'sc-icon' }, '📝'),
        el('div', { class: 'sc-meta' }, el('b', {}, `文本 · ${res.size} 字符`)),
      ),
      pre,
      el('div', { class: 'btn-row' },
        el('button', { class: 'btn primary', onclick: async () => {
          (await copyText(res.text)) ? toast('已复制全文', 'ok') : toast('复制失败', 'error');
        } }, '一键复制全文'),
      ),
    );
  } else {
    resultCard.append(
      el('div', { class: 'share-card' },
        el('span', { class: 'sc-icon' }, '📦'),
        el('div', { class: 'sc-meta' },
          el('b', {}, res.filename || '未命名文件'),
          el('small', {}, `${fmtBytes(res.size)} · ${res.mime || '未知类型'}`),
        ),
      ),
      el('a', {
        class: 'btn primary block',
        href: `/api/pickup/${code}/download`,
        download: res.filename || 'file',
      }, '⬇ 下载文件'),
    );
  }

  resultCard.append(
    el('div', { class: 'meta-line' }, metaLine(res)),
    el('div', { class: 'btn-row' },
      el('button', { class: 'btn ghost', onclick: reset }, '重新输入'),
    ),
  );
  resultCard.hidden = false;
}

function reset() {
  resultCard.hidden = true;
  input.value = '';
  input.focus();
}

/* 支持 /pickup?code=xxxxxx 带参进入 */
const fromUrl = new URLSearchParams(location.search).get('code');
if (fromUrl && /^\d{1,6}$/.test(fromUrl)) {
  input.value = fromUrl.slice(0, 6);
  if (input.value.length === 6) submit();
}
