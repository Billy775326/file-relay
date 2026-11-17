import { $, el, copyText, toast } from './common.js';
import { t, onLangChange } from './i18n.js';

/** The approved counter/seal layout; existing APIs and security controllers remain authoritative. */
export function initCombinedAdmin() {
  document.documentElement.classList.add('ui-combined');
  const trash = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></svg>';
  $('#files-refresh-slot').append($('#btn-refresh'));
  const footer = el('footer', { class: 'admin-footer' }, el('span', {}, ''),
    el('a', { href: 'mailto:iblykk@gmail.com' }, ''));
  $('#admin-panel').append(footer);
  const selects = [];
  for (const [name, selector] of [['files', '#files-pager'], ['audit', '#audit-pager']]) {
    const source = $(`#${name}-page-size`), copy = source.cloneNode(true);
    copy.id = `${name}-page-size-toolbar`;
    copy.removeAttribute('data-i18n');
    copy.value = source.value;
    copy.addEventListener('change', () => { source.value = copy.value; source.dispatchEvent(new Event('change', { bubbles: true })); });
    source.addEventListener('change', () => { copy.value = source.value; });
    $(selector).insertBefore(copy, $(selector).querySelector('.pager-btns'));
    selects.push(copy);
  }
  let syncRows;
  function enhanceRows() {
    for (const row of $('#shares-body').rows) {
      if (row.cells.length !== 9) continue;
      const code = row.cells[0];
      if (!code.querySelector('button')) {
        const value = code.textContent;
        const button = el('button', { type: 'button', class: 'admin-code', onclick: async () => toast(t(await copyText(value) ? 'ad.codeCopied' : 'ad.copyFailed')) }, value);
        code.replaceChildren(button);
        code.append(el('small', { class: 'admin-mobile-size' }, row.cells[3].textContent));
      }
      const remove = row.cells[8].querySelector('button');
      if (remove) {
        remove.classList.add('admin-remove');
        remove.setAttribute('aria-label', t('ad.delete') + ' ' + row.cells[1].textContent);
        remove.title = t('ad.delete');
        if (!remove.querySelector('svg')) remove.innerHTML = trash;
      }
    }
  }
  syncRows = new MutationObserver(enhanceRows);
  syncRows.observe($('#shares-body'), { childList: true, subtree: true });
  function labels() {
    footer.firstElementChild.textContent = t('ad.adminFooter');
    footer.lastElementChild.textContent = t('ad.contact');
    for (const select of selects) select.setAttribute('aria-label', t('ad.currentPageSize'));
    $('#stats-row').setAttribute('aria-label', t('ad.overview'));
    enhanceRows();
  }
  // File-search details use the same compact help component as all other explanations.
  const searchHint = el('span', {}, t('ad.searchHint'));
  window.attachHelp($('#files-filter button[type=submit]'), searchHint);
  onLangChange(() => { searchHint.textContent = t('ad.searchHint'); });
  onLangChange(labels);
  labels();
}
