import { $, api, fmtBytes, fmtDate, toast, initTheme, el } from './common.js';

initTheme();

const loginCard = $('#admin-login');
const panel = $('#admin-panel');
const loginError = $('#login-error');
const tokenInput = $('#admin-token');
const statsRow = $('#stats-row');
const tbody = $('#shares-body');
const btnPrev = $('#btn-prev');
const btnNext = $('#btn-next');
const pageInfo = $('#page-info');

const LIMIT = 50;
let offset = 0;
let total = 0;

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
    loginError.textContent = e.message || '令牌无效';
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
      el('div', { class: 'stat-card' }, el('b', {}, String(s.total)), el('small', { class: 'muted' }, '分享总数')),
      el('div', { class: 'stat-card' }, el('b', {}, String(s.active)), el('small', { class: 'muted' }, '当前有效')),
      el('div', { class: 'stat-card' }, el('b', {}, String(s.files)), el('small', { class: 'muted' }, '文件')),
      el('div', { class: 'stat-card' }, el('b', {}, String(s.texts)), el('small', { class: 'muted' }, '文本')),
      el('div', { class: 'stat-card' }, el('b', {}, fmtBytes(s.totalBytes)), el('small', { class: 'muted' }, '占用存储')),
      el('div', { class: 'stat-card' }, el('b', {}, String(s.todayCreated)), el('small', { class: 'muted' }, '今日新增')),
    );
  } catch { /* 忽略,列表加载会再报 */ }
}

/* ---------- 列表 ---------- */
const STATUS_LABEL = { active: '有效', expired: '已过期', exhausted: '已取完' };

async function loadList() {
  tbody.replaceChildren(el('tr', {}, el('td', { class: 'muted' }, '加载中…')));
  try {
    const data = await api(`/api/admin/shares?limit=${LIMIT}&offset=${offset}`);
    total = data.total;
    const rows = data.rows ?? [];
    tbody.replaceChildren();
    for (const r of rows) {
      const content = r.kind === 'text' ? (r.text_preview || '(文本)') : (r.filename || '(未命名)');
      tbody.append(
        el('tr', {},
          el('td', {}, r.code),
          el('td', {}, el('span', { class: `badge kind-${r.kind}` }, r.kind === 'file' ? '文件' : '文本')),
          el('td', { class: 'wrap' }, content),
          el('td', {}, r.kind === 'text' ? `${r.size} 字` : fmtBytes(r.size)),
          el('td', {}, `${r.pickup_count} / ${r.max_pickups ?? '∞'}`),
          el('td', {}, r.expire_at ? fmtDate(r.expire_at) : '永久'),
          el('td', {}, el('span', { class: `badge ${r.status}` }, STATUS_LABEL[r.status] || r.status)),
          el('td', {}, fmtDate(r.created_at)),
          el('td', {}, el('button', { class: 'btn danger small', onclick: () => remove(r) }, '删除')),
        ),
      );
    }
    if (rows.length === 0) {
      tbody.replaceChildren(el('tr', {}, el('td', { class: 'muted' }, '暂无分享')));
    }
    updatePager();
  } catch (e) {
    tbody.replaceChildren(el('tr', {}, el('td', { class: 'muted' }, e.message || '加载失败')));
  }
}

function updatePager() {
  const page = Math.floor(offset / LIMIT) + 1;
  const pages = Math.max(1, Math.ceil(total / LIMIT));
  pageInfo.textContent = `第 ${page} / ${pages} 页 · 共 ${total} 条`;
  btnPrev.disabled = offset <= 0;
  btnNext.disabled = offset + LIMIT >= total;
}
btnPrev.addEventListener('click', () => { offset = Math.max(0, offset - LIMIT); loadList(); });
btnNext.addEventListener('click', () => { offset += LIMIT; loadList(); });

/* ---------- 删除 ---------- */
async function remove(r) {
  const label = r.kind === 'text' ? `文本「${(r.text_preview || '').slice(0, 20)}…` : `文件「${r.filename || r.code}`;
  if (!confirm(`确定删除${label}」?文件将从存储中移除,口令 ${r.code} 将立即失效。`)) return;
  try {
    await api(`/api/admin/shares/${r.id}`, { method: 'DELETE' });
    toast('已删除', 'ok');
    loadStats();
    loadList();
  } catch (e) {
    toast(e.message || '删除失败', 'error');
  }
}
