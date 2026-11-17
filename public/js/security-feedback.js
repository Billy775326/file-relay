import { el, copyText } from './common.js';
import { onLangChange } from './i18n.js';

const EMAIL = 'iblykk@gmail.com';
export const isSecurityError = error => ['security_blocked', 'security_unavailable'].includes(error?.code);

/** One persistent notice per surface. No requests run on countdown expiry. */
export function createSecurityFeedback(host, operation, retry) {
  let current = null, timer = null, deadline = 0, pending = false;
  const card = el('section', { class: 'security-feedback', hidden: true, tabIndex: -1, ariaLabel: '访问提示' });
  host.append(card);
  const text = (zh, en) => document.documentElement.lang === 'en' ? en : zh;
  const action = () => ({ upload: text('上传', 'upload'), pickup: text('取件', 'pick up'), download: text('下载', 'download') })[operation];
  function clear() {
    current = null;
    clearInterval(timer);
    timer = null;
    card.hidden = true;
    card.replaceChildren();
  }
  function ready() { return !pending && (!current || performance.now() >= deadline); }
  function draw() {
    if (!current) return;
    const error = current;
    const unavailable = error.code === 'security_unavailable';
    const reason = unavailable ? 'service_unavailable' : error.reason;
    const title = unavailable ? text('服务暂时不可用', 'Service temporarily unavailable') : text('暂时无法' + action(), 'Unable to ' + action());
    const descriptions = {
      rate_limit: text('操作较频繁，请稍后再试。如有疑问，可联系站长。', 'Too many attempts. Please try again later or contact the site owner.'),
      region: text('当前访问地区不在本站开放范围内。如有疑问，可联系站长。', 'Access is unavailable from your current region. Contact the site owner for help.'),
      service_unavailable: text('暂时无法处理请求，请稍后重试。', 'Your request cannot be processed right now. Please try again later.'),
    };
    const description = descriptions[reason] || text('当前网络的请求受到限制。如需协助，请联系站长。', 'Requests from your current network are restricted. Contact the site owner for help.');
    const heading = el('h3', {}, title);
    const content = el('div', {}, heading, el('p', {}, description));
    const head = el('div', { class: 'security-feedback-head' }, el('span', { class: 'security-feedback-icon', 'aria-hidden': 'true' }, '!'), content);
    const status = el('p', { class: 'security-feedback-status', role: 'status' });
    const copy = async value => {
      if (await copyText(value)) { status.textContent = text('已复制', 'Copied'); return; }
      const dialog = el('dialog', { class: 'security-copy-dialog', 'aria-label': text('手动复制', 'Copy manually') });
      const field = el('textarea', { readonly: '', 'aria-label': text('待复制内容', 'Text to copy') });
      field.value = value;
      const close = el('button', { type: 'button', class: 'btn ghost', onclick: () => dialog.close() }, text('关闭', 'Close'));
      dialog.append(field, close); document.body.append(dialog);
      dialog.addEventListener('close', () => dialog.remove(), { once: true });
      dialog.showModal(); field.focus(); field.select();
    };
    const id = typeof error.requestId === 'string' && /^[a-zA-Z0-9-]{1,80}$/.test(error.requestId) ? error.requestId : '';
    const feedback = [text('文件中转站访问反馈', 'File relay access feedback'),
      text('操作：', 'Action: ') + action(), text('提示：', 'Notice: ') + description,
      text('发生时间：', 'Time: ') + new Date(error.serverTime || error.receivedAt).toISOString(),
      ...(id ? [text('请求编号：', 'Request ID: ') + id] : []), '', text('补充说明：', 'Additional details: ')].join('\n');
    const contact = el('a', { class: 'btn ghost', href: `mailto:${EMAIL}?subject=${encodeURIComponent(text('文件中转站 · 访问反馈', 'File relay · Access feedback'))}&body=${encodeURIComponent(feedback)}` }, text('联系站长', 'Contact site owner'));
    const retryButton = el('button', { type: 'button', class: 'btn primary', onclick: async () => {
      if (!ready()) return;
      pending = true; tick();
      try { await retry(); }
      finally { pending = false; if (current) draw(); }
    } }, text('重新尝试', 'Try again'));
    const contactFirst = !unavailable && reason !== 'rate_limit';
    if (contactFirst) { contact.className = 'btn primary'; retryButton.className = 'btn ghost'; }
    const actions = el('div', { class: 'security-feedback-actions' }, ...(contactFirst ? [contact, retryButton] : [retryButton, contact]));
    const time = el('div', { class: 'security-feedback-time' });
    const remaining = el('span', {});
    const hasExpiry = Number.isFinite(error.retryAt) && error.retryAt > 0;
    time.hidden = !hasExpiry;
    if (hasExpiry) time.append(el('span', {}, text('预计可重试：', 'Try after: ') + new Date(error.retryAt).toLocaleString(document.documentElement.lang, { hour12: false })), remaining);
    const tip = text('调用邮件应用并预填反馈信息，不会自动发送。未配置邮件应用时，可复制邮箱后自行写信。', 'Opens your mail app with a draft; nothing is sent automatically. You can also copy the email address.');
    const help = el('button', { type: 'button', class: 'security-help', 'aria-label': tip, title: tip, 'aria-expanded': 'false' }, '?');
    const helpText = el('span', { class: 'security-help-text', role: 'tooltip' }, tip);
    help.onclick = () => help.setAttribute('aria-expanded', String(help.getAttribute('aria-expanded') !== 'true'));
    help.onkeydown = event => { if (event.key === 'Escape') help.setAttribute('aria-expanded', 'false'); };
    const fallback = el('div', { class: 'security-feedback-fallback' },
      el('button', { type: 'button', class: 'security-text-button', onclick: () => copy(EMAIL) }, text('复制邮箱', 'Copy email')),
      el('span', { class: 'security-help-wrap' }, help, helpText));
    const reference = el('div', { class: 'security-feedback-reference' },
      el('span', {}, id ? text('请求编号 ', 'Request ID ') + id : ''),
      el('button', { type: 'button', class: 'security-text-button', onclick: () => copy(feedback) }, text('复制反馈信息', 'Copy feedback')));
    card.replaceChildren(head, time, actions, fallback, reference, status);
    function tick() {
      const seconds = Math.max(0, Math.ceil((deadline - performance.now()) / 1000));
      retryButton.disabled = pending || seconds > 0;
      remaining.textContent = seconds ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : text('可重新检查', 'Ready to retry');
    }
    clearInterval(timer); tick(); timer = setInterval(tick, 1000);
  }
  onLangChange(draw);
  window.addEventListener('pagehide', () => clearInterval(timer));
  window.addEventListener('pageshow', () => { if (current) draw(); });
  return {
    clear,
    canRetry: () => !current || performance.now() >= deadline,
    show(error) {
      if (!isSecurityError(error)) return false;
      const receivedAt = Date.now();
      current = { ...error, receivedAt };
      const serverTime = Number.isFinite(error.serverTime) ? error.serverTime : receivedAt;
      deadline = performance.now() + (Number.isFinite(error.retryAt) ? Math.max(0, error.retryAt - serverTime) : 0);
      draw(); card.hidden = false; card.focus({ preventScroll: true });
      card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      return true;
    },
  };
}
