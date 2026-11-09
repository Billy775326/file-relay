import { $, api, fmtBytes, fmtDate, toast, initTheme, el } from './common.js';
import { LANG, t, onLangChange, initI18n } from './i18n.js';

initTheme();
initI18n();

const loginCard = $('#admin-login');
const panel = $('#admin-panel');
const loginError = $('#login-error');
const tokenInput = $('#admin-token');
const statsRow = $('#stats-row');
const tbody = $('#shares-body');
const btnPrev = $('#btn-prev');
const btnNext = $('#btn-next');
const btnRefresh = $('#btn-refresh');
const pageInfo = $('#page-info');

const LIMIT = 20; // 每页行数:后端列表会逐行验活(读 KV),页小一点省 subrequest
let offset = 0;
let total = 0;

/* 语言切换:面板可见时按新语言重拉文案 */
onLangChange(() => {
  if ($('#source-dialog').open) closeSource();
  if (!panel.hidden) {
    loadStats();
    loadList();
  }
});

/* ---------- 登录态探测:stats 通则视为已登录 ---------- */
(async () => {
  try {
    await api('/api/admin/stats');
    showPanel();
  } catch {
    loginCard.hidden = false;
    tokenInput.focus();
  }
})();

async function login() {
  const token = tokenInput.value.trim();
  if (!token) return;
  loginError.hidden = true;
  try {
    await api('/api/admin/login', { method: 'POST', body: { token } });
    showPanel();
  } catch (e) {
    loginError.textContent = e.message || t('ad.badToken');
    loginError.hidden = false;
  }
}
$('#btn-login').addEventListener('click', login);
tokenInput.addEventListener('keydown', (e) => e.key === 'Enter' && login());

function showPanel() {
  loginCard.hidden = true;
  panel.hidden = false;
  loadStats();
  loadList();
}

$('#btn-logout').addEventListener('click', async () => {
  try { await api('/api/admin/logout', { method: 'POST', body: {} }); } catch { /* ignore */ }
  location.reload();
});

/* ---------- 统计 ---------- */
let lastStats = null; // 删除后本地递减用,避免立即重拉撞上 KV 最终一致窗口

function renderStats(s) {
  const counts = [
    [s.total, 'ad.total'], [s.active, 'ad.active'], [s.files, 'ad.files'],
    [s.texts, 'ad.texts'], [s.todayCreated, 'ad.today'],
  ];
  const capacity = s.fileBackend === 'r2' ? s.storage : null;
  const storageCard = el('div', { class: 'stat-card storage-card' },
    el('small', {}, t(s.fileBackend === 'r2' ? 'ad.storage' : 'ad.shareBytes')),
    capacity
      ? el('div', { class: 'storage-value' },
          el('b', {}, fmtBytes(capacity.usedBytes)),
          el('span', { class: 'storage-total' }, ` / ${fmtBytes(capacity.capacityBytes)}`))
      : el('div', { class: 'storage-value' }, el('b', {}, s.fileBackend === 'r2'
          ? t('ad.storageUnavailable') : fmtBytes(s.totalBytes))),
  );
  if (capacity) {
    const ratio = Math.min(1, Math.max(0, capacity.usedBytes / capacity.capacityBytes));
    storageCard.append(
      el('meter', { class: 'storage-meter', min: 0, max: capacity.capacityBytes,
        value: capacity.usedBytes, ariaLabel: t('ad.storage') }),
      el('div', { class: 'storage-caption' },
        el('small', {}, t('ad.storageReserved')), el('small', {}, `${Math.round(ratio * 100)}%`)),
    );
  }
  statsRow.replaceChildren(
    el('div', { class: 'stats-counts' }, ...counts.map(([value, label]) =>
      el('div', { class: 'stat-card' }, el('b', {}, String(value)), el('small', {}, t(label))))),
    storageCard,
  );
}

async function loadStats() {
  try {
    lastStats = await api('/api/admin/stats');
    renderStats(lastStats);
  } catch { /* 忽略,列表加载会再报 */ }
}

/** 删除成功后本地同步统计(服务端 KV 索引最长 60s 才反映删除,重拉会看到旧数) */
async function statsAfterDelete(r) {
  if (!lastStats) return;
  const s = { ...lastStats };
  s.total = Math.max(0, s.total - 1);
  if (r.kind === 'file') s.files = Math.max(0, s.files - 1);
  else s.texts = Math.max(0, s.texts - 1);
  s.totalBytes = Math.max(0, s.totalBytes - r.size);
  if (r.status === 'active') s.active = Math.max(0, s.active - 1);
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  if (r.created_at >= todayStart.getTime()) s.todayCreated = Math.max(0, s.todayCreated - 1);
  lastStats = s;
  renderStats(s);
  if (s.fileBackend === 'r2') {
    try { s.storage = (await api('/api/admin/stats')).storage; }
    catch { s.storage = null; } // Do not present stale capacity as current after deletion.
    if (lastStats === s) renderStats(s);
  }
}

/* ---------- 列表 ---------- */
const STATUS_KEY = { active: 'ad.st.active', expired: 'ad.st.expired', exhausted: 'ad.st.exhausted' };
const KIND_KEY = { file: 'ad.kind.file', text: 'ad.kind.text' };

async function loadList() {
  tbody.replaceChildren(el('tr', {}, el('td', { class: 'muted', colspan: 9 }, t('ad.loading'))));
  try {
    const data = await api(`/api/admin/shares?limit=${LIMIT}&offset=${offset}`);
    total = data.total;
    const rows = data.rows ?? [];
    tbody.replaceChildren();
    for (const r of rows) {
      const content = r.kind === 'text' ? (r.text_preview || t('ad.textFallback')) : (r.filename || t('ad.unnamed'));
      tbody.append(
        el('tr', {},
          el('td', { class: 'mono' }, r.code),
          el('td', { class: 'share-content-cell' },
            el('div', { class: 'share-filename-line' },
              el('span', { class: 'share-filename', title: content }, content),
              el('sup', { class: `badge share-kind kind-${r.kind}` }, t(KIND_KEY[r.kind] || r.kind)))),
          sourceCell(r),
          el('td', {}, r.kind === 'text' ? t('ad.chars', r.size) : fmtBytes(r.size)),
          el('td', {}, `${r.pickup_count} / ${r.max_pickups ?? '∞'}`),
          el('td', {}, r.expire_at ? fmtDate(r.expire_at) : t('ad.forever')),
          el('td', {}, el('span', { class: `badge ${r.status}` }, STATUS_KEY[r.status] ? t(STATUS_KEY[r.status]) : r.status)),
          el('td', {}, fmtDate(r.created_at)),
          el('td', {}, el('button', { class: 'btn danger small', onclick: (e) => remove(r, e.target.closest('tr')) }, t('ad.delete'))),
        ),
      );
    }
    if (rows.length === 0) {
      tbody.replaceChildren(el('tr', {}, el('td', { class: 'muted', colspan: 9 }, t('ad.empty'))));
    }
    updatePager();
  } catch (e) {
    tbody.replaceChildren(el('tr', {}, el('td', { class: 'muted', colspan: 9 }, e.message || t('ad.loadFail'))));
  }
}

function updatePager() {
  const page = Math.floor(offset / LIMIT) + 1;
  const pages = Math.max(1, Math.ceil(total / LIMIT));
  pageInfo.textContent = t('ad.page', page, pages, total);
  btnPrev.disabled = offset <= 0;
  btnNext.disabled = offset + LIMIT >= total;
}
btnPrev.addEventListener('click', () => { offset = Math.max(0, offset - LIMIT); loadList(); });
btnNext.addEventListener('click', () => { offset += LIMIT; loadList(); });
btnRefresh.addEventListener('click', () => { noteOverrides.clear(); loadStats(); loadList(); });

/* ---------- 删除:票据风确认弹窗 + 本地同步(KV 最终一致,删除后立即重拉会看到残留索引) ---------- */
const delMask = $('#del-mask');
const delTarget = $('#del-target');
let delResolve = null;

function confirmDelete(r) {
  const content = r.kind === 'text' ? (r.text_preview || t('ad.textFallback')) : (r.filename || t('ad.unnamed'));
  delTarget.replaceChildren(
    el('div', { class: 'del-line' }, el('span', { class: 'muted' }, t('ad.th.code')), el('b', { class: 'mono' }, r.code)),
    el('div', { class: 'del-line' }, el('span', { class: 'muted' }, t('ad.th.content')), el('span', {}, content)),
    el('div', { class: 'del-line' }, el('span', { class: 'muted' }, t('ad.th.size')),
      el('span', {}, r.kind === 'text' ? t('ad.chars', r.size) : fmtBytes(r.size))),
  );
  delMask.hidden = false;
  $('#del-cancel').focus();
  return new Promise((resolve) => { delResolve = resolve; });
}

function closeDelModal(v) {
  if (!delResolve) return;
  delMask.hidden = true;
  const resolve = delResolve;
  delResolve = null;
  resolve(v);
}
$('#del-cancel').addEventListener('click', () => closeDelModal(false));
$('#del-ok').addEventListener('click', () => closeDelModal(true));
delMask.addEventListener('click', (e) => e.target === delMask && closeDelModal(false));
document.addEventListener('keydown', (e) => e.key === 'Escape' && closeDelModal(false));

async function remove(r, tr) {
  if (!(await confirmDelete(r))) return;
  try {
    await api(`/api/admin/shares/${r.code}`, { method: 'DELETE' });
    toast(t('ad.deleted'), 'ok');
    statsAfterDelete(r);
    total = Math.max(0, total - 1);
    tr?.remove();
    // 当前页删空且不在第一页:退回上一页重拉,避免停在空页
    if (tbody.rows.length === 0 && offset > 0) {
      offset = Math.max(0, offset - LIMIT);
      loadList();
    } else {
      updatePager();
    }
  } catch (e) {
    toast(e.message || t('ad.deleteFail'), 'error');
  }
}

/* Upload source details: source labels are text nodes, never interpolated HTML. */
const sourceDialog = $('#source-dialog');
const sourceForm = $('#source-form');
const sourceNote = $('#source-note');
const sourceSave = $('#source-save');
const sourceError = $('#source-error');
const noteOverrides = new Map(); // Read-your-write while KV propagation completes.
let sourceRequest = 0;
let activeSource = null;

function visitorLabel(id) { return t('ad.visitor', id.slice(0, 8).toUpperCase()); }
function sourceLabel(source) {
  const override = noteOverrides.get(source.visitorId);
  return (override !== undefined ? override : source.note) || visitorLabel(source.visitorId);
}
function locationLabel(source) {
  let country = source.country;
  if (country && /^[A-Z]{2}$/.test(country)) {
    country = new Intl.DisplayNames([LANG === 'zh' ? 'zh-CN' : 'en'], { type: 'region' }).of(country);
  }
  return [...new Set([country, source.region, source.city].filter(Boolean))].join(' · ') || t('ad.sourceUnknown');
}
function sourceCell(row) {
  if (!row.source) return el('td', { class: 'source-cell muted' }, t('ad.sourceUnrecorded'));
  const button = el('button', { class: 'source-link', type: 'button', onclick: () => openSource(row) }, sourceLabel(row.source));
  button.dataset.visitor = row.source.visitorId;
  button.title = t('ad.source');
  return el('td', { class: 'source-cell' }, button, el('small', { class: 'muted' }, locationLabel(row.source)));
}
async function openSource(row) {
  const request = ++sourceRequest;
  activeSource = null;
  sourceForm.hidden = true;
  sourceError.hidden = true;
  sourceSave.disabled = false;
  $('#source-detail').textContent = t('ad.loading');
  sourceDialog.showModal();
  try {
    const { source } = await api(`/api/admin/shares/${row.code}/source`);
    if (request !== sourceRequest || !sourceDialog.open) return;
    if (!source) { $('#source-detail').textContent = t('ad.sourceUnrecorded'); return; }
    activeSource = { code: row.code, visitorId: source.visitorId };
    $('#source-detail').replaceChildren(...[
      [t('ad.visitorId'), source.visitorId], [t('ad.sourceLocation'), locationLabel(source)],
      ['IP', source.ip || t('ad.sourceUnknown')], [t('ad.sourceTime'), fmtDate(source.capturedAt)],
    ].map(([label, value]) => el('div', { class: 'source-field' }, el('small', { class: 'muted' }, label), el('span', {}, value))));
    sourceNote.value = noteOverrides.get(source.visitorId) ?? source.note ?? '';
    sourceForm.hidden = false;
    sourceNote.focus();
  } catch (e) {
    if (request === sourceRequest) $('#source-detail').textContent = e.message || t('ad.loadFail');
  }
}
function closeSource() {
  sourceRequest++;
  activeSource = null;
  sourceNote.value = '';
  $('#source-detail').replaceChildren();
  sourceDialog.close();
}
sourceDialog.addEventListener('cancel', (e) => { e.preventDefault(); closeSource(); });
$('#source-close').addEventListener('click', closeSource);
sourceForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!activeSource || sourceSave.disabled) return;
  const { code } = activeSource;
  const request = sourceRequest;
  sourceSave.disabled = true;
  sourceError.hidden = true;
  try {
    const result = await api(`/api/admin/shares/${code}/source`, { method: 'PUT', body: { note: sourceNote.value } });
    noteOverrides.set(result.visitorId, result.note);
    document.querySelectorAll('[data-visitor]').forEach((button) => {
      if (button.dataset.visitor === result.visitorId) button.textContent = result.note || visitorLabel(result.visitorId);
    });
    if (request === sourceRequest) closeSource();
    toast(t('ad.sourceSaved'));
  } catch (error) {
    if (request === sourceRequest) {
      sourceError.textContent = error.message || t('ad.loadFail');
      sourceError.hidden = false;
    }
  } finally {
    if (request === sourceRequest) sourceSave.disabled = false;
  }
});
