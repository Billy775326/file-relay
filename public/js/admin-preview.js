import { el } from './common.js';
import { t } from './i18n.js';

/** CSV excerpt, preserving quoted commas/newlines and omitting an incomplete last record. */
export function csvExcerpt(text, truncated) {
  const rows = []; let row = [], cell = '', quoted = false, afterQuote = false, clipped = truncated;
  const pushCell = () => { row.push(cell); cell = ''; afterQuote = false; };
  const pushRow = () => { pushCell(); rows.push(row.slice(0, 20)); if (row.length > 20) clipped = true; row = []; };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else { quoted = false; afterQuote = true; } }
      else cell += c;
    } else if (c === ',' || c === '\n' || c === '\r') {
      if (c === ',') pushCell();
      else { if (c === '\r' && text[i + 1] === '\n') i++; pushRow(); }
    } else if (c === '"' && !cell && !afterQuote) quoted = true;
    else { if (afterQuote || c === '"') return null; cell += c; }
    if (rows.length >= 50) { clipped ||= i < text.length - 1; return { rows, clipped }; }
  }
  if (!truncated) {
    if (quoted) return null;
    if (cell || row.length || afterQuote) pushRow();
  }
  return { rows, clipped };
}

export function createFilePreview(code, filename, index) {
  const scope = el('small', { class: 'muted' });
  const body = el('div', { class: 'file-preview-body' });
  const element = el('section', { class: 'file-preview file-wide', 'aria-label': t('preview.title') },
    el('div', { class: 'file-preview-heading' }, el('b', {}, t('preview.title')), scope), body);
  let controller, objectUrl, closed = false;
  function release() { if (objectUrl) URL.revokeObjectURL(objectUrl); objectUrl = null; }
  async function load() {
    controller?.abort(); release();
    const current = new AbortController(); controller = current;
    const timeout = setTimeout(() => current.abort(), 15000);
    body.textContent = t('ad.loading'); scope.textContent = '';
    try {
      const response = await fetch(`/api/admin/shares/${code}${index ? '/files/' + index : ''}/preview`, { signal: current.signal });
      if (response.headers.get('X-Audit-Status') === 'unavailable') window.dispatchEvent(new Event('audit-write-failed'));
      if (!response.ok) throw new Error(t(response.status === 410 || response.status === 404 ? 'ad.fileState.missing' : 'ad.loadFail'));
      if (response.headers.get('Content-Type')?.startsWith('image/')) {
        const blob = await response.blob();
        if (closed || controller !== current) return;
        if (blob.size > 2 * 1024 * 1024) throw new Error(t('preview.size'));
        objectUrl = URL.createObjectURL(blob);
        const img = el('img', { src: objectUrl, alt: filename, class: 'file-preview-image' });
        img.addEventListener('error', () => { if (!closed && controller === current) { release(); body.textContent = t('preview.image'); } });
        body.replaceChildren(img);
        scope.textContent = `${response.headers.get('X-Preview-Width')} × ${response.headers.get('X-Preview-Height')}`;
      } else {
        const data = await response.json();
        if (closed || controller !== current) return;
        if (data.kind === 'unsupported') {
          body.textContent = t(['type', 'size', 'encoding', 'image'].includes(data.reason) ? `preview.${data.reason}` : 'preview.type');
        } else {
          if (!['text', 'csv'].includes(data.kind) || typeof data.text !== 'string' || data.text.length > 65536) throw new Error(t('ad.loadFail'));
          const csv = data.kind === 'csv' ? csvExcerpt(data.text, data.truncated) : null;
          scope.textContent = t(data.truncated || csv?.clipped ? 'preview.partial' : 'preview.complete');
          if (csv?.rows.length) {
            const table = el('table', { class: 'file-preview-table', 'aria-label': t('preview.title') });
            table.append(el('tbody', {}, ...csv.rows.map(row => el('tr', {}, ...row.map(cell => el('td', {}, cell))))));
            body.replaceChildren(table);
          } else body.replaceChildren(el('pre', {}, data.text || t('preview.empty')));
        }
      }
    } catch (error) {
      if (!closed && controller === current) body.replaceChildren(
        el('span', { role: 'alert' }, current.signal.aborted ? t('preview.timeout') : error.message || t('ad.loadFail')),
        el('button', { type: 'button', class: 'btn small ghost', onclick: load }, t('ad.retry')));
    } finally { clearTimeout(timeout); }
  }
  load();
  return { element, dispose() { closed = true; controller?.abort(); release(); body.replaceChildren(); } };
}
