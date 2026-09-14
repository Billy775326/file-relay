import { $, api, fmtBytes, fmtDate, toast, initTheme, el } from './common.js';
import { t, onLangChange, initI18n } from './i18n.js';

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

const LIMIT = 50;
let offset = 0;
let total = 0;

/* 语言切换:面板可见时按新语言重拉文案 */
onLangChange(() => {
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
async function loadStats() {
  try {
    const s = await api('/api/admin/stats');
    statsRow.replaceChildren(
      el('div', { class: 'stat-card' }, el('b', {}, String(s.total)), el('small', { class: 'muted' }, t('ad.total'))),
      el('div', { class: 'stat-card' }, el('b', {}, String(s.active)), el('small', { class: 'muted' }, t('ad.active'))),
      el('div', { class: 'stat-card' }, el('b', {}, String(s.files)), el('small', { class: 'muted' }, t('ad.files'))),
      el('div', { class: 'stat-card' }, el('b', {}, String(s.texts)), el('small', { class: 'muted' }, t('ad.texts'))),
      el('div', { class: 'stat-card' }, el('b', {}, fmtBytes(s.totalBytes)), el('small', { class: 'muted' }, t('ad.storage'))),
      el('div', { class: 'stat-card' }, el('b', {}, String(s.todayCreated)), el('small', { class: 'muted' }, t('ad.today'))),
    );
  } catch { /* 忽略,列表加载会再报 */ }
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
          el('td', {}, el('span', { class: `badge kind-${r.kind}` }, t(KIND_KEY[r.kind] || r.kind))),
          el('td', { class: 'wrap' }, content),
          el('td', {}, r.kind === 'text' ? t('ad.chars', r.size) : fmtBytes(r.size)),
          el('td', {}, `${r.pickup_count} / ${r.max_pickups ?? '∞'}`),
          el('td', {}, r.expire_at ? fmtDate(r.expire_at) : t('ad.forever')),
          el('td', {}, el('span', { class: `badge ${r.status}` }, STATUS_KEY[r.status] ? t(STATUS_KEY[r.status]) : r.status)),
          el('td', {}, fmtDate(r.created_at)),
          el('td', {}, el('button', { class: 'btn danger small', onclick: () => remove(r) }, t('ad.delete'))),
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
btnRefresh.addEventListener('click', () => { loadStats(); loadList(); });

/* ---------- 删除 ---------- */
async function remove(r) {
  const preview = r.kind === 'text'
    ? `${(r.text_preview || t('ad.textFallback')).slice(0, 20)}…`
    : (r.filename || t('ad.unnamed'));
  const msg = t(r.kind === 'text' ? 'ad.confirmText' : 'ad.confirmFile', preview, r.code);
  if (!confirm(msg)) return;
  try {
    await api(`/api/admin/shares/${r.code}`, { method: 'DELETE' });
    toast(t('ad.deleted'), 'ok');
    loadStats();
    loadList();
  } catch (e) {
    toast(e.message || t('ad.deleteFail'), 'error');
  }
}
