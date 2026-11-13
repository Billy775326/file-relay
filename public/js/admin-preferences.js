import { $ } from './common.js';
import { t } from './i18n.js';

const options = { files: [10, 20, 40], audit: [20, 50, 100] };
const values = { files: 20, audit: 20 };
for (const name of Object.keys(values)) {
  try {
    const saved = Number(localStorage.getItem(`admin-page-size-${name}`));
    if (options[name].includes(saved)) values[name] = saved;
  } catch { /* Browser preferences are optional when persistent storage is blocked. */ }
}
export function pageSize(name) { return values[name]; }

export function scrollToList(selector) {
  const top = $(selector).getBoundingClientRect().top + window.scrollY
    - $('.admin-topbar').getBoundingClientRect().height - 12;
  window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
}

export function initAdminPreferences() {
  const dialog = $('#settings-dialog');
  $('#admin-settings-btn').addEventListener('click', () => dialog.showModal());
  $('#settings-close').addEventListener('click', () => dialog.close());
  for (const name of Object.keys(values)) {
    const select = $(`#${name}-page-size`);
    select.value = String(values[name]);
    select.addEventListener('change', () => {
      const value = Number(select.value);
      if (!options[name].includes(value)) return;
      values[name] = value;
      $('#preferences-error').hidden = true;
      try { localStorage.setItem(`admin-page-size-${name}`, String(value)); }
      catch {
        $('#preferences-error').textContent = t('ad.preferenceNotSaved');
        $('#preferences-error').hidden = false;
      }
      window.dispatchEvent(new CustomEvent('admin-page-size', { detail: { name, value } }));
    });
  }
  window.addEventListener('audit-write-failed', () => { $('#settings-audit-warning').hidden = false; });
}
