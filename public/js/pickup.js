import { $, $$, api, fmtBytes, fmtDate, copyText, toast, initTheme, el, iconFor } from './common.js';

initTheme();

const boxes = $$('.otp-box');
const row = $('#otp-row');
const errorBox = $('#pickup-error');
const resultCard = $('#pickup-result');
let querying = false;

function value() {
  return boxes.map((b) => b.value).join('');
}

/* 填入 1-6 位数字:够 6 位自动提交,否则聚焦到下一个空格 */
function fill(digits) {
  boxes.forEach((b, i) => { b.value = digits[i] || ''; });
  hideError();
  if (digits.length === 6) {
    boxes[5].focus();
    if (!querying) submit();
  } else {
    boxes[Math.min(digits.length, 5)].focus();
  }
}

boxes.forEach((box, i) => {
  box.addEventListener('input', () => {
    box.value = box.value.replace(/\D/g, '').slice(0, 1);
    hideError();
    if (box.value && i < boxes.length - 1) boxes[i + 1].focus();
    if (value().length === 6 && !querying) submit();
  });
  box.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !box.value && i > 0) {
      e.preventDefault();
      boxes[i - 1].value = '';
      boxes[i - 1].focus();
    } else if (e.key === 'ArrowLeft' && i > 0) {
      boxes[i - 1].focus();
    } else if (e.key === 'ArrowRight' && i < boxes.length - 1) {
      boxes[i + 1].focus();
    } else if (e.key === 'Enter' && value().length === 6 && !querying) {
      submit();
    }
  });
  box.addEventListener('paste', (e) => {
    e.preventDefault();
    const digits = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
    if (digits) fill(digits);
  });
  box.addEventListener('focus', () => box.select());
});

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.hidden = false;
  row.classList.remove('shake');
  void row.offsetWidth; /* 强制 reflow,重启动画 */
  row.classList.add('shake');
}
function hideError() {
  errorBox.hidden = true;
}

async function submit() {
  const code = value();
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
        el('span', { class: 'sc-icon' }, iconFor(res.filename, res.mime)),
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
  boxes.forEach((b) => { b.value = ''; });
  hideError();
  boxes[0].focus();
}

/* 支持 /pickup?code=xxxxxx 带参进入 */
const fromUrl = new URLSearchParams(location.search).get('code');
if (fromUrl && /^\d{1,6}$/.test(fromUrl)) {
  fill(fromUrl.slice(0, 6));
} else {
  boxes[0].focus();
}
