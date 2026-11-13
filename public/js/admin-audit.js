import { $, api, el, fmtDate } from './common.js';
import { t, LANG, onLangChange } from './i18n.js';
import { pageSize, scrollToList } from './admin-preferences.js';

export function initAudit() {
  const view = $('#admin-audit-view');
  const body = $('#audit-body');
  const dialog = $('#audit-dialog');
  let category = 'all', offset = 0, total = 0, request = 0;
  let filters = {}, rows = [], available = false;
  let limit = pageSize('audit');
  const action = row => t(`audit.action.${row.action}`);
  const actor = row => t(`audit.actor.${row.actor}`);
  const ip = row => row.ip === 'unknown' ? t('ad.sourceUnknown') : row.ip;
  function place(row) {
    let country = row.country;
    if (/^[A-Z]{2}$/.test(country)) country = new Intl.DisplayNames([LANG === 'zh' ? 'zh-CN' : 'en'], { type: 'region' }).of(country);
    return [...new Set([country, row.region, row.city].filter(Boolean))].join(' · ') || t('ad.sourceUnknown');
  }
  function close() { dialog.close(); $('#audit-detail').replaceChildren(); }
  function details(row) {
    const fields = [
      [t('audit.time'), fmtDate(row.at)], [t('audit.action'), action(row)],
      [t('audit.result'), t(`audit.${row.result}`)], [t('audit.actor'), actor(row)],
      ['IP', ip(row)], [t('ad.sourceLocation'), place(row)],
      [t('audit.target'), row.target || '—'], [t('audit.http'), `${row.method} · ${row.status}`],
      [t('audit.duration'), `${row.durationMs} ms`], [t('audit.id'), row.id],
      [t('audit.agent'), row.agent || '—'],
    ];
    for (const [key, value] of Object.entries(row.detail)) {
      fields.push([t(`audit.detail.${key}`), key === 'bannedUntil' ? fmtDate(value)
        : typeof value === 'boolean' ? t(value ? 'audit.yes' : 'audit.no') : String(value)]);
    }
    if (row.action === 'download') fields.push([t('audit.description'), t('audit.downloadHint')]);
    $('#audit-detail').replaceChildren(...fields.map(([label, value]) => el('div', { class: 'file-field' }, el('small', { class: 'muted' }, label), el('span', {}, value))));
    dialog.showModal();
  }
  function render() {
    body.replaceChildren(...rows.map(row => el('tr', {},
      el('td', {}, fmtDate(row.at)),
      el('td', {}, el('span', {}, action(row)), el('small', { class: 'muted' }, t(`audit.${row.category}`))),
      el('td', {}, el('span', { class: `audit-result audit-${row.result}` }, t(`audit.${row.result}`))),
      el('td', { class: 'audit-actor' }, el('small', { class: 'audit-mobile-label muted' }, t('audit.actor')), actor(row)),
      el('td', { class: 'audit-source' }, el('span', { class: 'mono' }, ip(row)),
        row.country || row.region || row.city ? el('small', { class: 'muted' }, place(row)) : null),
      el('td', { class: 'audit-target' }, el('small', { class: 'audit-mobile-label muted' }, t('audit.target')), row.target || '—'),
      el('td', {}, el('button', { type: 'button', class: 'btn small ghost', onclick: () => details(row) }, t('audit.details'))),
    )));
    $('#audit-page').textContent = t('audit.page', Math.floor(offset / limit) + 1, Math.max(1, Math.ceil(total / limit)), total);
    $('#audit-prev').disabled = offset === 0;
    $('#audit-next').disabled = offset + limit >= total;
  }
  async function load() {
    const ticket = ++request;
    available = false;
    $('#audit-error').hidden = true;
    $('#audit-state').textContent = t('ad.loading');
    $('#audit-page').textContent = '';
    body.replaceChildren();
    for (const id of ['audit-prev', 'audit-next', 'audit-export', 'audit-refresh']) $('#' + id).disabled = true;
    try {
      const params = new URLSearchParams({ ...filters, category, offset, limit });
      const data = await api(`/api/admin/audit-logs?${params}`);
      if (ticket !== request || view.hidden) return;
      if (typeof data.enabled !== 'boolean' || !Array.isArray(data.rows) || !Number.isSafeInteger(data.total)) throw new Error(t('ad.loadFail'));
      available = data.enabled;
      rows = data.rows; total = data.total;
      if (available && offset > 0 && offset >= total) { offset = Math.max(0, Math.ceil(total / limit) - 1) * limit; return load(); }
      $('#audit-state').textContent = !available ? t('audit.disabled') : !total ? t('audit.empty') : '';
      render();
      $('#audit-export').disabled = !available || total === 0;
    } catch (e) {
      if (ticket !== request || view.hidden) return;
      $('#audit-state').textContent = '';
      $('#audit-error').textContent = e.message || t('ad.loadFail');
      $('#audit-error').hidden = false;
    } finally { if (ticket === request) $('#audit-refresh').disabled = false; }
  }
  function selectView(audit) {
    view.hidden = !audit;
    $('#admin-files-view').hidden = audit;
    for (const [id, active] of [['admin-files-tab', !audit], ['admin-audit-tab', audit]]) {
      $('#' + id).setAttribute('aria-pressed', String(active));
      $('#' + id).classList.toggle('ghost', !active);
    }
    if (audit) load(); else { request++; close(); }
  }
  $('#admin-files-tab').addEventListener('click', () => selectView(false));
  $('#admin-audit-tab').addEventListener('click', () => selectView(true));
  $('#audit-filter').addEventListener('submit', e => {
    e.preventDefault();
    const from = $('#audit-from').value, to = $('#audit-to').value;
    if (from && to && from > to) {
      $('#audit-error').textContent = t('audit.dateError'); $('#audit-error').hidden = false; return;
    }
    filters = { result: $('#audit-result').value, q: $('#audit-q').value.trim() };
    if (from) filters.from = new Date(`${from}T00:00:00`).getTime();
    if (to) { const end = new Date(`${to}T00:00:00`); end.setDate(end.getDate() + 1); filters.to = end.getTime() - 1; }
    offset = 0; load();
  });
  $('#audit-reset').addEventListener('click', () => { $('#audit-filter').reset(); filters = {}; offset = 0; load(); });
  for (const button of document.querySelectorAll('.audit-categories button')) button.addEventListener('click', () => {
    category = button.dataset.category; offset = 0;
    for (const item of document.querySelectorAll('.audit-categories button')) item.setAttribute('aria-pressed', String(item === button));
    load();
  });
  $('#audit-prev').addEventListener('click', async () => { offset = Math.max(0, offset - limit); await load(); if (!view.hidden) scrollToList('#admin-audit-view'); });
  $('#audit-next').addEventListener('click', async () => { offset += limit; await load(); if (!view.hidden) scrollToList('#admin-audit-view'); });
  $('#audit-refresh').addEventListener('click', load);
  window.addEventListener('admin-page-size', event => {
    if (event.detail.name !== 'audit') return;
    limit = event.detail.value; offset = 0;
    if (!view.hidden) load();
  });
  $('#audit-export').addEventListener('click', async () => {
    $('#audit-export').disabled = true;
    $('#audit-error').hidden = true;
    const exportFilters = { ...filters, category };
    try {
      const params = new URLSearchParams({ ...exportFilters, offset: 0, limit: 1000 });
      const data = await api(`/api/admin/audit-logs/export?${params}`);
      const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), filters: exportFilters, ...data }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = el('a', { href: url, download: `audit-${new Date().toISOString().slice(0, 10)}.json` });
      document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { $('#audit-error').textContent = e.message || t('ad.loadFail'); $('#audit-error').hidden = false; }
    finally { $('#audit-export').disabled = !available || total === 0; }
  });
  $('#audit-close').addEventListener('click', close);
  dialog.addEventListener('cancel', e => { e.preventDefault(); close(); });
  window.addEventListener('audit-write-failed', () => { $('#audit-write-warning').hidden = false; });
  onLangChange(() => { close(); if (!view.hidden) load(); });
}
