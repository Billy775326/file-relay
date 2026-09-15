/**
 * 轻量 i18n:HTML 静态文案用 data-i18n / data-i18n-ph / data-i18n-title 标记,
 * JS 动态字符串用 t('key', …args);{n} 占位。
 * 语言优先级:localStorage('lang') > 浏览器语言(en 开头→英文)> 中文。
 * 切换后调用已注册的重渲染钩子(各页面 setLang 时登记)。
 */

const DICT = {
  zh: {
    'doc.send': '文件中转站 - 发送',
    'doc.pickup': '文件中转站 - 取件',
    'doc.admin': '文件中转站 - 管理',
    'doc.404': '404 - 文件中转站',

    'brand.name': '文件中转站',
    'brand.tagline': '像取快递一样取文件',
    'brand.pickup': '取件',
    'brand.admin': '管理后台',
    'nav.pickup': '取件',
    'nav.send': '发送',
    'nav.theme': '切换主题',
    'nav.lang': '切换语言',
    'foot': '你像个纪念品',

    'tab.file': '发文件',
    'tab.text': '发文本',
    'dz.click': '点击选择文件',
    'dz.drop': ',或拖拽 / 粘贴到此处',
    'dz.aria': '选择文件',
    'dz.hint': '上传后生成 6 位取件口令',
    'dz.hintMax': '单个文件最大 {0} · 支持多选,上传后生成取件口令',
    'remove': '移除',
    'text.placeholder': '粘贴或输入要分享的文本…',
    'opt.expiry': '有效期',
    'opt.pickups': '可取次数',
    'seg.1d': '1 天', 'seg.7d': '7 天', 'seg.30d': '30 天', 'seg.forever': '永久',
    'seg.p1': '1 次', 'seg.p5': '5 次', 'seg.punlimited': '不限',
    'btn.upload': '开始上传',
    'btn.genCode': '生成口令',
    'btn.cancel': '取消',
    'btn.copyCode': '复制口令',
    'btn.copyLink': '复制链接',
    'btn.copyAll': '复制全部口令',
    'btn.again': '再来一个',

    'prog.preparing': '准备中…',
    'prog.uploading': '上传中…',
    'prog.init': '初始化…',
    'prog.merging': '正在合并分片…',
    'prog.file': '第 {0}/{1} 个',
    'prog.part': '第 {0}/{1} 片',
    'prog.eta': '剩余 {0}',
    'prog.retry': '上传失败,重试 {0}/3…',

    'result.ok': '✅ 分享成功,把口令发给对方',
    'result.okBatch': '✅ {0} 个文件分享成功',
    'ticket.title': '取件凭证',
    'ticket.no': '№ {0}',
    'send.cap': '寄件单',
    'receipt.cap': '回执',
    'ph.title': '待出票',
    'ph.sub': '上传完成后,取件凭证会出现在这里',
    'qr.hint': '扫码直接取件',
    'label.code': '口令',
    'label.link': '链接',
    'copied': '{0}已复制',
    'copy.fail': '复制失败,请手动复制',
    'copied.btn': '✓ 已复制',

    'meta.after': '{0}后过期({1})',
    'meta.forever': '永久有效',
    'meta.pickups': '可取 {0} 次',
    'meta.unlimited': '取件次数不限',
    'files.count': '{0} 个文件 · 共 {1}',
    'unknown.type': '未知类型',
    'text.counter': '{0} / {1}',

    'err.oversize': '文件超过 {0} 上限({1})',
    'err.empty': '空文件不能分享',
    'err.tooMany': '一次最多分享 {0} 个文件',
    'err.upload': '上传失败,请重试',
    'err.submit': '提交失败',
    'req.fail': '请求失败 ({0})',
    'toast.cancelled': '已取消上传',

    'dur.s': '{0} 秒',
    'dur.ms': '<1 秒',
    'dur.hm': '{0} 分 {1} 秒',
    'dur.h': '{0} 分',
    'dur.hH': '{0} 时 {1} 分',
    'dur.hH2': '{0} 时',
    'dur.d': '{0} 天',

    'pk.title': '输入取件口令',
    'pk.sub': '输入 6 位数字口令,取出分享的文件或文本',
    'pk.aria': '6 位取件口令',
    'pk.fail': '取件失败',
    'pk.textChars': '文本 · {0} 字符',
    'pk.copyAllText': '一键复制全文',
    'pk.download': '⬇ 下载文件',
    'pk.again': '重新输入',
    'pk.expireAt': '{0} 过期',
    'pk.left': '剩余可取 {0} 次',
    'pk.unnamed': '未命名文件',
    'copied.text': '已复制全文',

    'ad.loginTitle': '管理登录',
    'ad.loginSub': '输入部署时设置的管理令牌(ADMIN_TOKEN)',
    'ad.tokenPh': '管理令牌',
    'ad.login': '登录',
    'ad.badToken': '令牌无效',
    'ad.total': '分享总数',
    'ad.active': '当前有效',
    'ad.files': '文件',
    'ad.texts': '文本',
    'ad.storage': '占用存储',
    'ad.today': '今日新增',
    'ad.th.code': '口令', 'ad.th.kind': '类型', 'ad.th.content': '内容',
    'ad.th.size': '大小', 'ad.th.pickups': '已取/上限', 'ad.th.expire': '过期时间',
    'ad.th.status': '状态', 'ad.th.created': '创建时间',
    'ad.kind.file': '文件', 'ad.kind.text': '文本',
    'ad.st.active': '有效', 'ad.st.expired': '已过期', 'ad.st.exhausted': '已取完',
    'ad.loading': '加载中…',
    'ad.empty': '暂无分享',
    'ad.loadFail': '加载失败',
    'ad.page': '第 {0} / {1} 页 · 共 {2} 条',
    'ad.prev': '上一页', 'ad.next': '下一页',
    'ad.refresh': '↻ 刷新',
    'ad.logout': '退出登录',
    'ad.delete': '删除',
    'ad.deleted': '已删除',
    'ad.deleteFail': '删除失败',
    'ad.confirmFile': '确定删除文件「{0}」?文件将从存储中移除,口令 {1} 将立即失效。',
    'ad.confirmText': '确定删除文本「{0}」?文本将从存储中移除,口令 {1} 将立即失效。',
    'ad.textFallback': '(文本)',
    'ad.unnamed': '(未命名)',
    'ad.chars': '{0} 字',
    'ad.forever': '永久',

    'nf.title': '页面不存在',
    'nf.body': '你要找的页面不在中转站里',
    'nf.send': '去发送',
    'nf.pickup': '去取件',
  },

  en: {
    'doc.send': 'file-relay - Send',
    'doc.pickup': 'file-relay - Pickup',
    'doc.admin': 'file-relay - Admin',
    'doc.404': '404 - file-relay',

    'brand.name': 'file-relay',
    'brand.tagline': 'Files, picked up like parcels',
    'brand.pickup': 'Pickup',
    'brand.admin': 'Admin',
    'nav.pickup': 'Pick up',
    'nav.send': 'Send',
    'nav.theme': 'Toggle theme',
    'nav.lang': 'Switch language',
    'foot': "You're like a keepsake",

    'tab.file': 'Send file',
    'tab.text': 'Send text',
    'dz.click': 'Click to choose files',
    'dz.drop': ', or drag & drop / paste here',
    'dz.aria': 'Choose files',
    'dz.hint': 'A 6-digit pickup code is generated after upload',
    'dz.hintMax': 'Up to {0} per file · multiple selection supported',
    'remove': 'Remove',
    'text.placeholder': 'Paste or type the text to share…',
    'opt.expiry': 'Expires',
    'opt.pickups': 'Pickup limit',
    'seg.1d': '1 day', 'seg.7d': '7 days', 'seg.30d': '30 days', 'seg.forever': 'Forever',
    'seg.p1': '1×', 'seg.p5': '5×', 'seg.punlimited': 'Unlimited',
    'btn.upload': 'Start upload',
    'btn.genCode': 'Generate code',
    'btn.cancel': 'Cancel',
    'btn.copyCode': 'Copy code',
    'btn.copyLink': 'Copy link',
    'btn.copyAll': 'Copy all codes',
    'btn.again': 'New share',

    'prog.preparing': 'Preparing…',
    'prog.uploading': 'Uploading…',
    'prog.init': 'Initializing…',
    'prog.merging': 'Merging parts…',
    'prog.file': 'file {0}/{1}',
    'prog.part': 'part {0}/{1}',
    'prog.eta': 'ETA {0}',
    'prog.retry': 'Upload failed, retrying {0}/3…',

    'result.ok': '✅ Shared! Send the code to the recipient',
    'result.okBatch': '✅ {0} files shared successfully',
    'ticket.title': 'PICKUP TICKET',
    'ticket.no': '№ {0}',
    'send.cap': 'PARCEL FORM',
    'receipt.cap': 'RECEIPT',
    'ph.title': 'PENDING',
    'ph.sub': 'Your pickup ticket will appear here after upload',
    'qr.hint': 'Scan to pick up',
    'label.code': 'code',
    'label.link': 'link',
    'copied': '{0} copied',
    'copy.fail': 'Copy failed, please copy manually',
    'copied.btn': '✓ Copied',

    'meta.after': 'Expires in {0} ({1})',
    'meta.forever': 'Never expires',
    'meta.pickups': '{0} pickups allowed',
    'meta.unlimited': 'Unlimited pickups',
    'files.count': '{0} files · {1} total',
    'unknown.type': 'unknown type',
    'text.counter': '{0} / {1}',

    'err.oversize': 'File exceeds the {0} limit ({1})',
    'err.empty': 'Empty files cannot be shared',
    'err.tooMany': 'Up to {0} files per batch',
    'err.upload': 'Upload failed, please retry',
    'err.submit': 'Submission failed',
    'req.fail': 'Request failed ({0})',
    'toast.cancelled': 'Upload cancelled',

    'dur.s': '{0}s',
    'dur.ms': '<1s',
    'dur.hm': '{0}m {1}s',
    'dur.h': '{0}m',
    'dur.hH': '{0}h {1}m',
    'dur.hH2': '{0}h',
    'dur.d': '{0}d',

    'pk.title': 'Enter pickup code',
    'pk.sub': 'Enter the 6-digit code to retrieve the shared file or text',
    'pk.aria': '6-digit pickup code',
    'pk.fail': 'Pickup failed',
    'pk.textChars': 'Text · {0} chars',
    'pk.copyAllText': 'Copy all text',
    'pk.download': '⬇ Download file',
    'pk.again': 'Try another code',
    'pk.expireAt': 'Expires {0}',
    'pk.left': '{0} pickups left',
    'pk.unnamed': 'Untitled file',
    'copied.text': 'Full text copied',

    'ad.loginTitle': 'Admin login',
    'ad.loginSub': 'Enter the admin token (ADMIN_TOKEN) set at deployment',
    'ad.tokenPh': 'Admin token',
    'ad.login': 'Log in',
    'ad.badToken': 'Invalid token',
    'ad.total': 'Total shares',
    'ad.active': 'Active',
    'ad.files': 'Files',
    'ad.texts': 'Texts',
    'ad.storage': 'Storage used',
    'ad.today': 'New today',
    'ad.th.code': 'Code', 'ad.th.kind': 'Type', 'ad.th.content': 'Content',
    'ad.th.size': 'Size', 'ad.th.pickups': 'Picked/Limit', 'ad.th.expire': 'Expires',
    'ad.th.status': 'Status', 'ad.th.created': 'Created',
    'ad.kind.file': 'File', 'ad.kind.text': 'Text',
    'ad.st.active': 'Active', 'ad.st.expired': 'Expired', 'ad.st.exhausted': 'Exhausted',
    'ad.loading': 'Loading…',
    'ad.empty': 'No shares yet',
    'ad.loadFail': 'Failed to load',
    'ad.page': 'Page {0} / {1} · {2} total',
    'ad.prev': 'Prev', 'ad.next': 'Next',
    'ad.refresh': '↻ Refresh',
    'ad.logout': 'Log out',
    'ad.delete': 'Delete',
    'ad.deleted': 'Deleted',
    'ad.deleteFail': 'Delete failed',
    'ad.confirmFile': 'Delete file "{0}"? It will be removed from storage and code {1} will stop working immediately.',
    'ad.confirmText': 'Delete text "{0}"? It will be removed from storage and code {1} will stop working immediately.',
    'ad.textFallback': '(text)',
    'ad.unnamed': '(unnamed)',
    'ad.chars': '{0} chars',
    'ad.forever': 'Forever',

    'nf.title': 'Page not found',
    'nf.body': "The page you're looking for isn't in this relay",
    'nf.send': 'Send files',
    'nf.pickup': 'Pick up',
  },
};

export let LANG =
  localStorage.getItem('lang') ||
  ((navigator.language || '').toLowerCase().startsWith('en') ? 'en' : 'zh');

/** 取词:当前语言 → 中文兜底 → key 本身;{0}{1}… 依次替换 */
export function t(key, ...args) {
  let s = (DICT[LANG] && DICT[LANG][key]) ?? DICT.zh[key] ?? key;
  args.forEach((v, i) => { s = s.replaceAll(`{${i}}`, String(v)); });
  return s;
}

const rerenders = [];
/** 各页面登记:语言切换后重算动态文案 */
export function onLangChange(fn) { rerenders.push(fn); }

function applyLang() {
  document.documentElement.lang = LANG === 'en' ? 'en' : 'zh-CN';
  document.querySelectorAll('[data-i18n]').forEach((n) => { n.textContent = t(n.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach((n) => { n.placeholder = t(n.dataset.i18nPh); });
  document.querySelectorAll('[data-i18n-title]').forEach((n) => { n.title = t(n.dataset.i18nTitle); });
  document.querySelectorAll('[data-i18n-aria]').forEach((n) => { n.setAttribute('aria-label', t(n.dataset.i18nAria)); });
  const btn = document.getElementById('lang-btn');
  if (btn) btn.textContent = LANG === 'en' ? '中' : 'EN';
}

export function initI18n() {
  applyLang();
  document.getElementById('lang-btn')?.addEventListener('click', () => {
    LANG = LANG === 'en' ? 'zh' : 'en';
    localStorage.setItem('lang', LANG);
    applyLang();
    rerenders.forEach((fn) => fn());
  });
}
