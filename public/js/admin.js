import { $, api, fmtBytes, fmtDate, fmtDuration, toast, initTheme, el } from './common.js';
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
  if ($('#file-dialog').open) closeFileDetails();
  if (!panel.hidden) {
    loadStats();
    loadList();
    loadLoginProtection();
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
  if (!token || $('#btn-login').disabled) return;
  $('#btn-login').disabled = true;
  loginError.hidden = true;
  try {
    await api('/api/admin/login', { method: 'POST', body: { token } });
    showPanel();
  } catch (e) {
    loginError.textContent = e.code === 'login_blocked' ? t('ad.loginBlocked')
      : e.code === 'login_protection_unavailable' ? t('ad.guardUnavailable') : e.message || t('ad.badToken');
    loginError.hidden = false;
  } finally { $('#btn-login').disabled = false; }
}
$('#btn-login').addEventListener('click', login);
tokenInput.addEventListener('keydown', (e) => e.key === 'Enter' && login());

function showPanel() {
  loginCard.hidden = true;
  panel.hidden = false;
  loadStats();
  loadList();
  loadSettings();
  loadGuestPolicy();
  loadLoginProtection();
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
              r.kind === 'file'
                ? el('button', { class: 'share-filename file-detail-link', type: 'button', title: content, onclick: () => openFileDetails(r.code) }, content)
                : el('span', { class: 'share-filename', title: content }, content),
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
  sourceSave.hidden = true;
  $('#source-context').textContent = `${t('ad.th.code')} ${row.code}`;
  $('#source-detail').textContent = t('ad.loading');
  sourceDialog.showModal();
  try {
    const { source } = await api(`/api/admin/shares/${row.code}/source`);
    if (request !== sourceRequest || !sourceDialog.open) return;
    if (!source) { $('#source-detail').textContent = t('ad.sourceUnrecorded'); return; }
    activeSource = { code: row.code, visitorId: source.visitorId };
    $('#source-detail').replaceChildren(...[
      [t('ad.sourceLocation'), locationLabel(source), 'source-field-wide'],
      ['IP', source.ip || t('ad.sourceUnknown'), 'mono'],
      [t('ad.sourceTime'), fmtDate(source.capturedAt), ''],
      [t('ad.visitorId'), source.visitorId, 'source-field-wide mono'],
    ].map(([label, value, className]) => el('div', { class: `source-field ${className}` }, el('small', { class: 'muted' }, label), el('span', {}, value))));
    sourceNote.value = noteOverrides.get(source.visitorId) ?? source.note ?? '';
    sourceForm.hidden = false;
    sourceSave.hidden = false;
  } catch (e) {
    if (request === sourceRequest) $('#source-detail').textContent = e.message || t('ad.loadFail');
  }
}
function closeSource() {
  sourceRequest++;
  activeSource = null;
  sourceNote.value = '';
  sourceForm.hidden = true;
  sourceSave.hidden = true;
  $('#source-context').textContent = '';
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

/* File details use their own request generation so closed dialogs stay empty. */
const fileDialog = $('#file-dialog');
const fileDetail = $('#file-detail');
const fileDownload = $('#file-download');
let fileRequest = 0;
function fileFormat(filename) {
  const ext = filename?.match(/\.([a-z0-9]{1,12})$/i)?.[1]?.toLowerCase();
  const groups = {
    archive: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'],
    program: ['exe', 'msi', 'apk', 'dmg', 'deb', 'rpm'],
    document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'epub'],
    image: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp', 'ico', 'heic', 'avif'],
    video: ['mp4', 'mkv', 'mov', 'avi', 'webm', 'm4v'],
    audio: ['mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac'],
    text: ['txt', 'md', 'csv', 'json', 'xml', 'html', 'js', 'ts', 'py', 'log'],
  };
  if (!ext) return t('ad.formatUnknown');
  const group = Object.entries(groups).find(([, extensions]) => extensions.includes(ext))?.[0] || 'file';
  const keys = { archive: 'ad.format.archive', program: 'ad.format.program', document: 'ad.format.document', image: 'ad.format.image', video: 'ad.format.video', audio: 'ad.format.audio', text: 'ad.format.text', file: 'ad.format.file' };
  return `${ext.toUpperCase()} · ${t(keys[group])}`;
}
function fileField(label, value, secondary) {
  return el('div', { class: 'file-field' }, el('small', { class: 'muted' }, label),
    el('div', { class: 'file-field-value' }, value), secondary ? el('small', { class: 'muted' }, secondary) : null);
}

async function openFileDetails(code) {
  const request = ++fileRequest;
  fileDownload.hidden = true;
  fileDownload.removeAttribute('href');
  fileDownload.removeAttribute('download');
  $('#file-context').textContent = `${t('ad.th.code')} ${code}`;
  fileDetail.textContent = t('ad.loading');
  fileDialog.showModal();
  try {
    const detail = await api(`/api/admin/shares/${code}`);
    if (request !== fileRequest || !fileDialog.open) return;
    const now = detail.evaluatedAt ?? Date.now();
    const state = detail.storage?.state || 'unknown';
    const storageLabels = { available: 'ad.fileState.available', missing: 'ad.fileState.missing', unknown: 'ad.fileState.unknown' };
    const source = detail.source;
    const sourceButton = source ? el('button', { type: 'button', class: 'source-link file-source-link',
      title: t('ad.source'), onclick: () => { closeFileDetails(); openSource({ code }); },
    }, sourceLabel(source)) : t('ad.sourceUnrecorded');
    if (source) sourceButton.dataset.visitor = source.visitorId;
    const lifetime = detail.expireAt === null ? null
      : t(detail.expireAt > now ? 'ad.timeLeft' : 'ad.timeExpired', fmtDuration(Math.abs(detail.expireAt - now) / 1000));
    const cleanupLabels = { permanent: 'ad.cleanupPermanent', active: 'ad.cleanupActive', retained: 'ad.cleanupRetained', pending: 'ad.cleanupPending' };
    const cleanupLabel = t(cleanupLabels[detail.cleanupStatus] || 'ad.sourceUnknown', detail.retentionDays);
    const technical = el('details', { class: 'file-technical file-wide' },
      el('summary', {}, t('ad.technical')),
      el('div', { class: 'file-technical-grid' },
        fileField('MIME', detail.mime || t('ad.sourceUnknown')),
        Number.isSafeInteger(detail.storage?.size) ? fileField(t('ad.storedSize'), t('ad.exactBytes', detail.storage.size.toLocaleString())) : null,
        detail.storage?.uploadedAt != null ? fileField(t('ad.storedAt'), fmtDate(detail.storage.uploadedAt)) : null,
      ), el('small', { class: 'muted' }, t('ad.formatHint')));
    fileDetail.replaceChildren(
      el('div', { class: 'file-identity file-wide' },
        el('strong', {}, detail.filename || t('ad.unnamed')), el('small', { class: 'muted' }, fileFormat(detail.filename))),
      fileField(t('ad.th.size'), fmtBytes(detail.size), t('ad.exactBytes', detail.size.toLocaleString())),
      fileField(t('ad.fileAvailability'), el('span', { class: `badge ${state === 'available' ? 'active' : state === 'missing' ? 'expired' : ''}` }, t(storageLabels[state]))),
      fileField(t('ad.uploader'), sourceButton, source ? locationLabel(source) : null),
      fileField(t('ad.shareState'), el('span', { class: `badge ${detail.status}` }, t(STATUS_KEY[detail.status]))),
      fileField(t('ad.th.pickups'), `${detail.pickupCount} / ${detail.maxPickups ?? '∞'}`),
      fileField(t('ad.th.created'), fmtDate(detail.createdAt)),
      fileField(t('ad.th.expire'), detail.expireAt === null ? t('ad.forever') : fmtDate(detail.expireAt), lifetime),
      fileField(t('ad.cleanupAfter'), detail.cleanupAfter === null ? t('ad.forever') : fmtDate(detail.cleanupAfter), cleanupLabel),
      technical,
    );
    fileDownload.href = `/api/admin/shares/${code}/download`;
    fileDownload.download = detail.filename || 'file';
    fileDownload.textContent = t(state === 'unknown' ? 'ad.tryDownload' : 'ad.download');
    fileDownload.hidden = state === 'missing';
  } catch (error) {
    if (request === fileRequest) fileDetail.textContent = error.message || t('ad.loadFail');
  }
}
function closeFileDetails() {
  fileRequest++;
  fileDetail.replaceChildren();
  $('#file-context').textContent = '';
  fileDownload.hidden = true;
  fileDownload.removeAttribute('href');
  fileDownload.removeAttribute('download');
  fileDialog.close();
}
$('#file-close').addEventListener('click', closeFileDetails);
fileDialog.addEventListener('cancel', e => { e.preventDefault(); closeFileDetails(); });

/* Keep unsaved input local; only a validated save changes retention. */
const retentionInput = $('#retention-days');
const retentionSave = $('#retention-save');
const retentionError = $('#retention-error');
async function loadSettings() {
  retentionInput.disabled = true;
  retentionSave.disabled = true;
  retentionError.hidden = true;
  $('#retention-retry').hidden = true;
  try {
    const settings = await api('/api/admin/settings');
    if (!Number.isInteger(settings.expiredRetentionDays) || settings.expiredRetentionDays < 0 || settings.expiredRetentionDays > 3650) throw new Error(t('ad.loadFail'));
    retentionInput.value = settings.expiredRetentionDays;
    retentionInput.disabled = false;
    retentionSave.disabled = false;
  } catch (error) {
    retentionError.textContent = error.message || t('ad.loadFail');
    retentionError.hidden = false;
    $('#retention-retry').hidden = false;
  }
}
$('#retention-retry').addEventListener('click', loadSettings);
$('#retention-form').addEventListener('submit', async e => {
  e.preventDefault();
  if (retentionSave.disabled || !retentionInput.reportValidity()) return;
  retentionSave.disabled = true;
  retentionInput.disabled = true;
  retentionError.hidden = true;
  try {
    const settings = await api('/api/admin/settings', { method: 'PUT', body: { expiredRetentionDays: Number(retentionInput.value) } });
    retentionInput.value = settings.expiredRetentionDays;
    toast(t('ad.settingsSaved'), 'ok');
  } catch (error) {
    retentionError.textContent = error.message || t('ad.loadFail');
    retentionError.hidden = false;
  } finally {
    retentionInput.disabled = false;
    retentionSave.disabled = false;
  }
});

const guestWeekly = $('#guest-weekly');
const guestSave = $('#guest-save');
const guestError = $('#guest-error');
function guestBusy(busy) {
  for (const control of [guestWeekly, guestSave]) control.disabled = busy;
}
async function loadGuestPolicy() {
  guestBusy(true);
  guestError.hidden = true;
  $('#guest-retry').hidden = true;
  try {
    const policy = await api('/api/admin/upload-policy');
    if (!Number.isInteger(policy.weeklyFileLimit) || policy.weeklyFileLimit < 0 || policy.weeklyFileLimit > 1000) throw new Error(t('ad.loadFail'));
    guestWeekly.value = policy.weeklyFileLimit;
    guestBusy(false);
  } catch (error) {
    guestError.textContent = error.message || t('ad.loadFail');
    guestError.hidden = false;
    $('#guest-retry').hidden = false;
  }
}
$('#guest-retry').addEventListener('click', loadGuestPolicy);
$('#guest-policy-form').addEventListener('submit', async e => {
  e.preventDefault();
  if (guestSave.disabled || !e.target.reportValidity()) return;
  const body = { weeklyFileLimit: Number(guestWeekly.value) };
  guestBusy(true);
  guestError.hidden = true;
  try {
    await api('/api/admin/upload-policy', { method: 'PUT', body });
    toast(t('ad.guestSaved'), 'ok');
  } catch (error) {
    guestError.textContent = error.message || t('ad.loadFail');
    guestError.hidden = false;
  } finally { guestBusy(false); }
});

let guardRequest = 0;
async function loadLoginProtection() {
  const request = ++guardRequest;
  const refresh = $('#login-guard-refresh');
  const error = $('#login-guard-error');
  refresh.disabled = true;
  error.hidden = true;
  $('#login-guard-bans').replaceChildren();
  $('#login-guard-status').textContent = '';
  try {
    const data = await api('/api/admin/login-protection');
    if (request !== guardRequest) return;
    if (typeof data.enabled !== 'boolean' || !Array.isArray(data.bans) ||
        ![data.maxFailures, data.windowSeconds, data.banSeconds].every(n => Number.isInteger(n) && n > 0)) throw new Error(t('ad.loadFail'));
    $('#login-guard-status').textContent = data.enabled
      ? t('ad.guardRule', data.windowSeconds / 60, data.maxFailures, data.banSeconds / 60) : t('ad.guardDisabled');
    if (!data.enabled) return;
    if (!data.bans.length) $('#login-guard-bans').append(el('small', { class: 'muted' }, t('ad.guardEmpty')));
    for (const ban of data.bans) {
      const button = el('button', { class: 'btn small ghost', type: 'button' }, t('ad.guardUnblock'));
      button.addEventListener('click', async () => {
        button.disabled = true;
        error.hidden = true;
        try {
          await api('/api/admin/login-protection/unblock', { method: 'POST', body: { ip: ban.ip } });
          toast(t('ad.guardUnblocked'), 'ok');
          await loadLoginProtection();
        } catch (e) {
          error.textContent = e.message || t('ad.loadFail');
          error.hidden = false;
          button.disabled = false;
        }
      });
      $('#login-guard-bans').append(el('div', { class: 'login-guard-row' },
        el('div', { class: 'login-guard-info' },
          el('b', {}, ban.ip === 'unknown' ? t('ad.guardUnknown') : ban.ip),
          el('small', { class: 'muted' }, t('ad.guardFailures', ban.failures) + ' · ' + t('ad.guardUntil', fmtDate(ban.bannedUntil))),
          el('small', { class: 'muted' }, t('ad.guardLast', fmtDate(ban.lastFailedAt)))), button));
    }
  } catch (e) {
    if (request !== guardRequest) return;
    error.textContent = e.message || t('ad.loadFail');
    error.hidden = false;
  } finally { if (request === guardRequest) refresh.disabled = false; }
}
$('#login-guard-refresh').addEventListener('click', loadLoginProtection);
