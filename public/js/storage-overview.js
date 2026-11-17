import { el, fmtBytes } from './common.js';
import { t } from './i18n.js';

/** Compact help shared by both storage headings; works with pointer, keyboard and touch. */
export function storageHelp(label, text) {
  const anchor = el('span', { class: 'storage-help-anchor' }, label);
  const content = el('span', {}, text);
  // Reuse the shared help controller for focus, Escape and lifecycle cleanup.
  queueMicrotask(() => { if (anchor.isConnected) window.attachHelp(anchor, content); });
  return anchor;
}
export function kvUsageCard(kv) {
  if (!kv?.bound) return null;
  const ready = kv.state === 'available' && Number.isSafeInteger(kv.usedBytes) && kv.usedBytes >= 0;
  const quota = Number.isSafeInteger(kv.freeQuotaBytes) && kv.freeQuotaBytes > 0 ? kv.freeQuotaBytes : 1_000_000_000;
  const info = [t('storage.sharedQuota'), t('storage.dailyPeak'), ready ? t('storage.keys', kv.keyCount) + ' · ' + t('storage.sample', kv.sampleDate) : t('storage.analyticsRequired')].join('。');
  return el('div', { class: 'stat-card storage-card kv-storage-card' },
    el('div', { class: 'storage-heading' }, el('small', {}, 'KV'), storageHelp('KV', info)),
    el('div', { class: 'storage-value' }, el('b', {}, ready ? fmtBytes(kv.usedBytes) : '—'), el('span', { class: 'storage-total' }, ' / ' + fmtBytes(quota))),
    ready ? el('meter', { class: 'storage-meter', min: 0, max: quota, value: Math.min(kv.usedBytes, quota), ariaLabel: t('storage.quotaReference') }) : el('small', { class: 'storage-state' }, t(kv.state === 'unconfigured' ? 'storage.notConfigured' : 'ad.storageUnavailable')));
}
