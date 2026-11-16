import { api, el, fmtDate } from './common.js';
import { t } from './i18n.js';

const MAX_COUNT = 2147483647;
const WEEK = 7 * 86400000;
export function ruleStatus(rules, now = Date.now()) {
  if (rules.expireAt !== null && rules.expireAt <= now) return 'expired';
  if (rules.maxPickups !== null && rules.pickupCount >= rules.maxPickups) return 'exhausted';
  return 'active';
}
/** Selecting a status changes visible values; the server still derives the saved status. */
export function linkStatus(rules, status, now = Date.now()) {
  const next = { ...rules };
  if (status === 'expired') next.expireAt = now;
  else {
    if (next.expireAt !== null && next.expireAt <= now) next.expireAt = now + WEEK;
    if (status === 'active' && next.maxPickups !== null && next.pickupCount >= next.maxPickups)
      next.maxPickups = next.pickupCount < MAX_COUNT ? next.pickupCount + 1 : null;
    if (status === 'exhausted') {
      next.maxPickups ??= Math.max(1, next.pickupCount);
      next.pickupCount = Math.max(next.pickupCount, next.maxPickups);
    }
  }
  return next;
}
function localDateTime(value) {
  const date = new Date(value);
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function createShareEditor(detail, { onSaved, onCancel, onBusy }) {
  const form = el('form', { id: 'share-edit-form', class: 'share-edit-form' });
  const number = (id, value, min) => el('input', { id, type: 'number', value, min, max: MAX_COUNT, step: 1, required: true });
  const count = number('share-edit-count', detail.pickupCount, 0);
  const limit = number('share-edit-limit', detail.maxPickups ?? Math.max(1, detail.pickupCount+1), 1);
  const unlimited = el('input', { id: 'share-edit-unlimited', type: 'checkbox' });
  unlimited.checked = detail.maxPickups === null;
  const permanent = el('input', { id: 'share-edit-permanent', type: 'checkbox' });
  permanent.checked = detail.expireAt === null;
  const expiry = el('input', { id: 'share-edit-expiry', type: 'datetime-local', step: 60, min: '1970-01-01T00:00', max: '9999-12-31T23:59', required: true });
  let exactExpiry = detail.expireAt;
  let displayedExpiry = localDateTime(exactExpiry ?? Date.now()+WEEK);
  expiry.value = displayedExpiry;
  const status = el('select', { id: 'share-edit-status' }, ...['active','expired','exhausted'].map(value => el('option', { value }, t('ad.st.'+value))));
  status.value = detail.status;
  const field = (label, control) => el('div', { class: 'share-edit-field' }, el('label', { htmlFor: control.id }, label), control);
  const check = (label, control) => el('label', { class: 'share-edit-check' }, control, label);
  const limitField = field(t('ad.editLimit'), limit);
  limitField.append(check(t('ad.editUnlimited'), unlimited));
  const expiryField = field(t('ad.th.expire'), expiry);
  expiryField.classList.add('share-edit-expiry');
  expiryField.append(check(t('ad.forever'), permanent));
  const linked = el('p', { class: 'share-edit-linked muted', role: 'status', hidden: true });
  const error = el('p', { id: 'share-edit-error', class: 'error-box', role: 'alert', hidden: true });
  const reload = el('button', { type: 'button', class: 'btn small ghost', hidden: true, onclick: onCancel }, t('ad.editReload'));
  const save = el('button', { type: 'submit', class: 'btn primary' }, t('ad.editSave'));
  const cancel = el('button', { type: 'button', class: 'btn ghost', onclick: onCancel }, t('ad.editCancel'));
  form.append(el('strong', { class: 'share-edit-filename', title: detail.filename || '' }, detail.filename || t('ad.unnamed')),
    el('div', { class: 'share-edit-grid' }, field(t('ad.editCount'), count), limitField, field(t('ad.th.status'), status), expiryField),
    linked, error, reload, el('div', { class: 'share-edit-actions' }, cancel, save));
  function values() {
    return { pickupCount: count.valueAsNumber, maxPickups: unlimited.checked ? null : limit.valueAsNumber,
      expireAt: permanent.checked ? null : expiry.value === displayedExpiry && exactExpiry !== null ? exactExpiry : new Date(expiry.value).getTime() };
  }
  function sync() { limit.disabled = unlimited.checked; expiry.disabled = permanent.checked; }
  const valid = rules => Number.isSafeInteger(rules.pickupCount) && rules.pickupCount >= 0 && rules.pickupCount <= MAX_COUNT &&
    (rules.maxPickups === null || (Number.isSafeInteger(rules.maxPickups) && rules.maxPickups >= 1 && rules.maxPickups <= MAX_COUNT)) &&
    (rules.expireAt === null || Number.isFinite(rules.expireAt));
  for (const control of [count, limit, unlimited, expiry, permanent]) {
    control.addEventListener('input', () => { sync(); linked.hidden = true; const rules = values(); if (valid(rules)) status.value = ruleStatus(rules); });
  }
  status.addEventListener('change', () => {
    const before = values();
    if (!valid(before)) { error.textContent = t('ad.editInvalid'); error.hidden = false; return; }
    const next = linkStatus(before, status.value), changes = [];
    if (before.pickupCount !== next.pickupCount) changes.push(`${t('ad.editCount')} → ${next.pickupCount}`);
    if (before.maxPickups !== next.maxPickups) changes.push(`${t('ad.editLimit')} → ${next.maxPickups ?? '∞'}`);
    if (before.expireAt !== next.expireAt) changes.push(`${t('ad.th.expire')} → ${fmtDate(next.expireAt)}`);
    count.value = next.pickupCount; unlimited.checked = next.maxPickups === null;
    if (next.maxPickups !== null) limit.value = next.maxPickups;
    permanent.checked = next.expireAt === null;
    exactExpiry = next.expireAt;
    displayedExpiry = localDateTime(next.expireAt ?? Date.now()+WEEK); expiry.value = displayedExpiry;
    sync(); linked.textContent = changes.join('；'); linked.hidden = !changes.length;
  });
  let busy = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !form.reportValidity()) return;
    const rules = values();
    if (!valid(rules)) { error.textContent = t('ad.editInvalid'); error.hidden = false; return; }
    if (status.value !== ruleStatus(rules)) { status.value = ruleStatus(rules); error.textContent = t('ad.editTimeChanged'); error.hidden = false; return; }
    busy = true; onBusy(true); error.hidden = reload.hidden = true;
    const controls = [...form.querySelectorAll('input,button,select')].map(node => [node,node.disabled]);
    for (const [node] of controls) node.disabled = true;
    let saved = false;
    try {
      await api(`/api/admin/shares/${detail.code}`, { method: 'PUT', body: { expected: {
        id: detail.id, pickupCount: detail.pickupCount, maxPickups: detail.maxPickups, expireAt: detail.expireAt,
      }, rules: { ...rules, status: status.value } } });
      saved = true;
    } catch (e) {
      error.textContent = e.message; error.hidden = false; reload.hidden = e.code !== 'share_conflict';
    } finally {
      busy = false; onBusy(false);
      for (const [node,disabled] of controls) node.disabled = disabled;
    }
    if (saved) onSaved();
  });
  sync();
  return { element: form, enhance() {
    const help = el('span', {}, t('ad.editHint', Intl.DateTimeFormat().resolvedOptions().timeZone));
    window.attachHelp(expiryField.querySelector('label'), help);
    window.attachHelp(form.querySelector('label[for="share-edit-status"]'), el('span', {}, t('ad.editStatusHint')));
    count.focus();
  } };
}
