import { api } from './common.js';
export function initSecurity() {
    /* Security workspace backed by authenticated, persistent server actions. */
    (() => {
        if (!document.querySelector('#admin-panel'))
            return;
        const $ = s => document.querySelector(s), nav = $('#admin-navigation');
        const t = (zh, en) => document.documentElement.lang === 'en' ? en : zh;
        const el = (tag, attrs = {}, ...children) => { const n = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) {
            if (k === 'class')
                n.className = v;
            else if (k === 'click')
                n.addEventListener('click', v);
            else
                n.setAttribute(k, v);
        } for (const c of children.flat())
            if (c != null)
                n.append(c instanceof Node ? c : document.createTextNode(String(c))); return n; };
        let pendingAction = false;
        const btn = (zh, en, fn, cls = 'btn small ghost') => el('button', { type: 'button', class: cls, click: async (event) => {
                const button = event.currentTarget;
                if (button.disabled)
                    return;
                let controls = [];
                try {
                    const result = fn();
                    if (result && typeof result.then === 'function') {
                        controls = [...dialog.querySelectorAll('button,input,select')].map(n => [n, n.disabled]);
                        for (const [n] of controls)
                            n.disabled = true;
                        button.disabled = true;
                        pendingAction = true;
                        await result;
                    }
                }
                catch (error) {
                    if (dialog.open)
                        fail($('#sec-form-error'), error.message);
                    else {
                        toast(error.message);
                        feedback.classList.add('sec-feedback-error');
                    }
                }
                finally {
                    pendingAction = false;
                    if (button.isConnected)
                        button.disabled = false;
                    for (const [n, disabled] of controls)
                        if (n.isConnected)
                            n.disabled = disabled;
                }
            } }, t(zh, en));
        const input = (id, value = '', attrs = {}) => el('input', { id, value, ...attrs });
        const field = (zh, en, node) => el('label', { class: 'sec-field', for: node.id }, el('span', {}, t(zh, en)), node.type === 'number' ? numberControl(node, t(zh, en)) : node);
        const numberControl = (node, label) => window.numberControl(node, label);
        const date = n => new Intl.DateTimeFormat(document.documentElement.lang === 'en' ? 'en-GB' : 'zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(n);
        const liveBans = () => store.bans.filter(b => b.until === null || b.until > Date.now());
        const scopes = [['login', '后台登录', 'Admin login'], ['upload', '上传', 'Upload'], ['pickup', '取件', 'Pickup']];
        const scopeName = key => { const s = scopes.find(s => s[0] === key); return t(s[1], s[2]); };
        const scopeText = list => list.map(scopeName).join(' / ');
        const scopeBadges = (list, sup = false) => el(sup ? 'sup' : 'div', { class: 'sec-scope-badges' + (sup ? ' sec-scope-sup' : '') }, ...list.map(s => el('span', { 'data-tone': { login: 'blue', upload: 'orange', pickup: 'teal' }[s] }, scopeName(s))));
        const ipLine = row => el('div', { class: 'sec-ip-line' }, el('b', { class: 'mono' }, row.ip), scopeBadges(row.scopes, true));
        function scopePicker(values = ['login'], prefix = 'sec-scope', disabled = []) {
            const checks = scopes.map(([key, zh, en]) => { const n = input(prefix + '-' + key, '', { type: 'checkbox' }); n.disabled = disabled.includes(key); n.checked = !n.disabled && values.includes(key); return { key, n, label: el('label', { class: 'sec-check' }, n, t(zh, en)) }; });
            return { node: el('fieldset', { class: 'sec-scope-picker' }, el('legend', {}, t('保护范围', 'Protected actions')), ...checks.map(c => c.label)), values: () => checks.filter(c => c.n.checked && !c.n.disabled && !disabled.includes(c.key)).map(c => c.key) };
        }
        const geography = { CN: { label: ['中国', 'China'], regions: { ZJ: ['浙江', 'Zhejiang'], GX: ['广西', 'Guangxi'], GD: ['广东', 'Guangdong'], SH: ['上海', 'Shanghai'], BJ: ['北京', 'Beijing'] } }, US: { label: ['美国', 'United States'], regions: { CA: ['加利福尼亚', 'California'], NY: ['纽约州', 'New York'] } }, SG: { label: ['新加坡', 'Singapore'], regions: {} }, JP: { label: ['日本', 'Japan'], regions: { '13': ['东京都', 'Tokyo'] } }, DE: { label: ['德国', 'Germany'], regions: {} } };
        const regionName = r => [geography[r.country] ? t(...geography[r.country].label) : r.country, r.region ? (geography[r.country]?.regions[r.region] ? t(...geography[r.country].regions[r.region]) : r.region) : t('全部地区', 'All regions')].join(' · ');
        const activeRegions = () => store.regions.filter(r => r.enabled && (r.until === null || r.until > Date.now()));
        const overlaps = (a, b) => a.some(s => b.includes(s));
        function geoPicker(country = 'CN', region = '', unknown = false) {
            const countryInput = input('sec-country', country, { list: 'sec-country-options', maxlength: 2, placeholder: unknown ? t('留空表示未知', 'Blank for unknown') : 'CN', autocomplete: 'off' });
            const countries = el('datalist', { id: 'sec-country-options' }, ...Object.entries(geography).map(([key, g]) => el('option', { value: key }, t(...g.label))));
            const regionInput = input('sec-region', region, { list: 'sec-region-options', maxlength: 10, placeholder: t('全部省州（可填代码）', 'All subdivisions (or enter code)'), autocomplete: 'off' }), regions = el('datalist', { id: 'sec-region-options' });
            const update = () => { countryInput.value = countryInput.value.toUpperCase(); regions.replaceChildren(...Object.entries(geography[countryInput.value]?.regions || {}).map(([key, label]) => el('option', { value: key }, t(...label)))); };
            countryInput.addEventListener('input', () => { regionInput.value = ''; update(); });
            regionInput.addEventListener('input', () => { regionInput.value = regionInput.value.toUpperCase(); });
            update();
            const node = el('div', { class: 'sec-form-grid' }, field('国家 / 地区代码', 'Country code', countryInput), field('省 / 州代码', 'Subdivision code', regionInput), countries, regions);
            window.attachHelp(node.querySelector('label > span'), el('span', {}, t('使用 Cloudflare 的国家与省州代码，如 CN / ZJ、US / TX。省州留空表示整个国家；可选择常用代码或自行输入。', 'Use Cloudflare country/subdivision codes, e.g. CN / ZJ or US / TX. A blank subdivision covers the country. Select a suggestion or enter a code.')));
            return { country: countryInput, region: regionInput, node };
        }
        const durationSelect = id => el('select', { id }, ...[['30', '30 分钟', '30 minutes'], ['60', '1 小时', '1 hour'], ['1440', '24 小时', '24 hours'], ['0', '永久', 'Permanent']].map(([v, zh, en]) => el('option', { value: v }, t(zh, en))));
        let store = { enabled: false, configRevision: '', rules: { login: { enabled: true, limit: 5, window: 10, duration: 30 }, upload: { enabled: true, limit: 20, window: 10, duration: 30 }, pickup: { enabled: true, limit: 10, window: 10, duration: 30 } }, bans: [], allow: [], regions: [] };
        const selected = new Set();
        let tab = 'bans', query = '', kind = 'all', scopeFilter = 'all', page = 1, open = false, failed = false, empty = false, lastFocus = null, loaded = false, loading = false;
        function validateState(data) {
            if (!data || typeof data.enabled !== 'boolean' || typeof data.configRevision !== 'string' || !scopes.every(([k]) => data.rules?.[k] && typeof data.rules[k].enabled === 'boolean' && ['limit', 'window', 'duration'].every(n => Number.isInteger(data.rules[k][n]) && data.rules[k][n] > 0)) || !['bans', 'allow', 'regions'].every(k => Array.isArray(data[k]) && data[k].every(r => r && Array.isArray(r.scopes) && r.scopes.every(v => scopes.some(([s]) => s === v)))))
                throw new Error(t('防护状态格式无效', 'Invalid protection response'));
            return data;
        }
        async function refresh() { if (loading)
            return; loading = true; render(); try {
            store = validateState(await api('/api/admin/security'));
            loaded = true;
            failed = false;
        }
        catch (error) {
            failed = true;
            throw error;
        }
        finally {
            loading = false;
            render();
        } }
        async function mutate(action, data = {}) { await api('/api/admin/security', { method: 'POST', body: { action, configRevision: store.configRevision, ...data } }); try {
            store = validateState(await api('/api/admin/security'));
            failed = false;
        }
        catch {
            failed = true;
            throw new Error(t('操作已保存，但状态刷新失败。请关闭弹窗并刷新，勿重复提交。', 'Saved, but refresh failed. Close and refresh without submitting again.'));
        } }
        const view = el('section', { id: 'security-view', hidden: '', 'aria-labelledby': 'security-title' });
        $('#admin-panel').insertBefore(view, $('.admin-footer'));
        const navButton = btn('安全防护', 'Security', () => show(), 'admin-nav-link');
        navButton.id = 'admin-security-tab';
        navButton.setAttribute('aria-controls', 'security-view');
        navButton.setAttribute('aria-pressed', 'false');
        nav.append(navButton);
        const dialog = el('dialog', { id: 'security-dialog', class: 'source-dialog sec-dialog', 'aria-labelledby': 'security-dialog-title' });
        document.body.append(dialog);
        const old = $('#login-protection');
        old.hidden = true;
        const shortcut = el('section', { class: 'settings-section sec-setting-entry' }, el('h4', {}, t('安全防护', 'Security')), btn('管理访问规则与封禁 →', 'Manage access rules and bans →', () => { $('#settings-dialog').close(); show(); }));
        old.before(shortcut);
        const auditEntry = $('.ui-guard-entry');
        if (auditEntry) {
            auditEntry.textContent = t('安全防护', 'Security');
            auditEntry.onclick = () => show();
        }
        function show() { open = true; $('#admin-files-view').hidden = true; $('#admin-audit-view').hidden = true; view.hidden = false; for (const n of nav.querySelectorAll('button'))
            n.setAttribute('aria-pressed', String(n === navButton)); render(); if (!loaded && !loading)
            refresh().catch(error => toast(error.message)); }
        for (const id of ['#admin-files-tab', '#admin-audit-tab'])
            $(id).addEventListener('click', () => { open = false; view.hidden = true; navButton.setAttribute('aria-pressed', 'false'); });
        const feedback = el('div', { id: 'sec-feedback', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' });
        document.body.append(feedback);
        let feedbackTimer;
        function clearFeedback() { clearTimeout(feedbackTimer); feedback.textContent = ''; feedback.classList.remove('sec-feedback-error'); }
        function toast(msg) { clearFeedback(); feedback.textContent = msg; feedbackTimer = setTimeout(clearFeedback, 4000); }
        for (const id of ['#admin-files-tab', '#admin-audit-tab'])
            $(id).addEventListener('click', clearFeedback);
        dialog.addEventListener('close', () => { if (!open)
            clearFeedback(); });
        const auditLabels = { manualBan: ['手动封禁 IP', 'Manually ban IP'], allowIP: ['添加允许 IP', 'Allow IP'], removeAllow: ['移除允许 IP', 'Remove allowed IP'], securityRules: ['修改防护规则', 'Change protection rules'], regionAdd: ['添加地区封禁', 'Add region ban'], regionEdit: ['修改地区封禁', 'Edit region ban'], regionToggle: ['切换地区规则状态', 'Toggle region rule'], regionRemove: ['移除地区封禁', 'Remove region ban'] };
        function translateAudit() { for (const host of [$('#audit-body'), $('#audit-detail')]) {
            const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
            let n;
            while (n = walker.nextNode()) {
                const label = auditLabels[n.textContent.replace('audit.action.', '')];
                if (label && n.textContent.startsWith('audit.action.'))
                    n.textContent = t(...label);
            }
        } }
        for (const host of [$('#audit-body'), $('#audit-detail')])
            new MutationObserver(translateAudit).observe(host, { childList: true, subtree: true });
        function close() { dialog.close(); if (lastFocus?.isConnected)
            lastFocus.focus(); }
        dialog.addEventListener('cancel', e => { e.preventDefault(); if (!pendingAction)
            close(); });
        dialog.addEventListener('keydown', e => { if (e.key !== 'Tab')
            return; const a = [...dialog.querySelectorAll('button,input,select,textarea')].filter(n => !n.disabled && n.getClientRects().length); if (!a.length)
            return; const first = a[0], last = a.at(-1); if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        }
        else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        } });
        function modal(zh, en) { clearFeedback(); lastFocus = document.activeElement; dialog.classList.remove('sec-rules-dialog'); dialog.replaceChildren(); const head = el('div', { class: 'source-heading' }, el('h3', { id: 'security-dialog-title' }, t(zh, en)), btn('关闭', 'Close', close)); const body = el('div', { class: 'source-body sec-dialog-body' }), error = el('p', { id: 'sec-form-error', class: 'error-box', hidden: '', role: 'alert' }), foot = el('div', { class: 'source-footer' }); body.append(error); dialog.append(head, body, foot); dialog.showModal(); return { body, foot, error }; }
        function fail(node, msg) { node.textContent = msg; node.hidden = false; }
        function canonical(value) { const s = value.trim(); if (/^\d{1,3}(\.\d{1,3}){3}$/.test(s) && s.split('.').every(x => Number(x) <= 255 && !/^0\d/.test(x)))
            return s; if (s.includes(':') && !/[\s/%\[\]]/.test(s)) {
            try {
                return new URL('http://[' + s + ']/').hostname.slice(1, -1).toLowerCase();
            }
            catch { }
        } return null; }
        function logLink(ip) { $('#admin-audit-tab').click(); $('#audit-reset').click(); $('#audit-q').value = ip; $('#audit-filter').requestSubmit(); }
        function confirmUnban(ips) { const current = liveBans().filter(b => ips.includes(b.ip)); if (!current.length)
            return; const m = modal('解除 IP 封禁', 'Unban IPs'); m.body.prepend(el('p', {}, t(`解除 ${current.length} 个 IP 的封禁？`, `Remove bans for ${current.length} IP addresses?`)), ...current.map(b => el('div', {}, el('b', { class: 'mono' }, b.ip), scopeBadges(b.scopes))), el('small', { class: 'muted' }, t('地区封禁及其他访问限制仍然生效。', 'Region bans and other access restrictions still apply.'))); m.foot.append(btn('取消', 'Cancel', close), btn('确认解封', 'Unban', async () => { await mutate('unban', { ips }); selected.clear(); close(); render(); toast(t('已解除封禁', 'Bans removed')); }, 'btn primary')); }
        function openAdd(allow = false) {
            const m = modal(allow ? '添加允许 IP' : '手动封禁 IP', allow ? 'Allow IP' : 'Ban IP');
            const ip = input('sec-ip', '', { placeholder: '203.0.113.20 / 2001:db8::1', autocomplete: 'off' }), note = input('sec-note', '', { maxlength: 120, placeholder: t('用途或原因', 'Purpose or reason') });
            const duration = durationSelect('sec-duration'), scope = scopePicker(allow ? ['login'] : ['login', 'upload', 'pickup']);
            m.body.prepend(field('IP 地址', 'IP address', ip), scope.node, ...(allow ? [] : [field('封禁时长', 'Ban duration', duration)]), field(allow ? '备注' : '封禁原因', allow ? 'Note' : 'Ban reason', note), el('small', { class: 'muted' }, t(allow ? '仅豁免所选范围的自动封禁，不绕过手动封禁、地区规则或身份校验。' : '在所选范围拦截后续请求；后台登录范围不撤销已登录会话。', allow ? 'Exempts automatic bans in selected scopes, never manual bans, region rules or authentication.' : 'Blocks subsequent requests in selected scopes; login bans do not revoke existing sessions.')));
            window.attachHelp($('#security-dialog-title'), m.body.querySelector(':scope > small'));
            m.foot.append(btn('取消', 'Cancel', close), btn(allow ? '添加允许 IP' : '确认封禁', allow ? 'Allow IP' : 'Ban IP', async () => {
                const value = canonical(ip.value), chosen = scope.values();
                if (!value)
                    return fail(m.error, t('请输入单个有效 IPv4 或 IPv6 地址。', 'Enter one valid IPv4 or IPv6 address.'));
                if (!chosen.length)
                    return fail(m.error, t('至少选择一个保护范围。', 'Select at least one protected action.'));
                if ((allow ? store.allow : liveBans()).some(b => b.ip === value))
                    return fail(m.error, t('该名单已有此 IP，请先移除原记录再调整范围。', 'This list already contains the IP. Remove the existing entry to change its scope.'));
                if (!note.value.trim())
                    return fail(m.error, t('请填写备注或原因，便于后续审计。', 'Enter a note or reason for the audit trail.'));
                await mutate(allow ? 'allow' : 'ban', { ip: value, scopes: chosen, note: note.value.trim(), minutes: Number(duration.value) });
                tab = allow ? 'allow' : 'bans';
                query = '';
                kind = 'all';
                scopeFilter = 'all';
                page = 1;
                empty = false;
                close();
                render();
                toast(t('记录已添加', 'Entry added'));
            }, 'btn primary'));
            ip.focus();
        }
        function removeAllow(row) { const m = modal('移除允许 IP', 'Remove allowed IP'); m.body.prepend(el('p', { class: 'mono' }, row.ip), scopeBadges(row.scopes), el('p', {}, t('移除后，该 IP 将重新适用所选范围的自动封禁规则。', 'Automatic ban rules will apply again in these scopes.'))); m.foot.append(btn('取消', 'Cancel', close), btn('移除', 'Remove', async () => { await mutate('removeAllow', { ip: row.ip }); close(); render(); toast(t('已移除允许 IP', 'Allow entry removed')); }, 'btn primary')); }
        function editRules() {
            const m = modal('自动防护规则', 'Automatic protection rules'), controls = [];
            dialog.classList.add('sec-rules-dialog');
            m.body.prepend(el('div', { class: 'sec-rules-columns', 'aria-hidden': 'true' },
                el('span', {}, t('保护范围', 'Protection')),
                el('span', {}, t('统计窗口 / 分钟', 'Window / min')),
                el('span', {}, t('触发次数', 'Threshold')),
                el('span', {}, t('封禁时长 / 分钟', 'Ban / min'))));
            for (const [key, zh, en] of scopes) {
                const rule = store.rules[key], suffix = key === 'login' ? '' : '-' + key;
                const enabled = input('sec-enabled' + suffix, '', { type: 'checkbox' });
                enabled.checked = rule.enabled;
                const limit = input('sec-threshold' + suffix, rule.limit, { type: 'number', min: 1, max: 10000, step: 1 }), minutes = input('sec-window' + suffix, rule.window, { type: 'number', min: 1, max: 1440, step: 1 }), duration = input('sec-ban-minutes' + suffix, rule.duration, { type: 'number', min: 1, max: 10080, step: 1 });
                const toggle = () => { for (const n of [limit, minutes, duration])
                    n.disabled = !enabled.checked; };
                enabled.onchange = toggle;
                toggle();
                const descriptions = { login: ['管理令牌校验失败次数', 'Failed admin-token checks'], upload: ['发起分享次数；文件和文本均计入，分片不重复计数', 'Share creation attempts; files and text count, chunks do not'], pickup: ['无效取件口令次数；成功取件不计入', 'Invalid pickup-code attempts; successful pickups do not count'] };
                m.body.append(el('section', { class: 'sec-rule-section', 'aria-labelledby': 'sec-rule-label-' + key }, el('label', { class: 'sec-check', id: 'sec-rule-label-' + key }, enabled, el('b', {}, t(zh, en))), el('small', { class: 'muted' }, t(...descriptions[key])), el('div', { class: 'sec-rule-fields' }, field('窗口（分钟）', 'Window (min)', minutes), field('触发次数', 'Threshold', limit), field('封禁（分钟）', 'Ban (min)', duration))));
                controls.push({ key, enabled, limit, minutes, duration });
                const section = m.body.lastElementChild;
                window.attachHelp(section.querySelector('.sec-check'), section.querySelector(':scope > small'));
            }
            m.body.append(el('small', { class: 'muted' }, t('按 IP 独立计数，仅封禁触发的范围。停用规则不会解除已有封禁。', 'Counters are per IP and scope. Pausing a rule does not remove existing bans.')));
            window.attachHelp($('#security-dialog-title'), m.body.lastElementChild);
            m.foot.append(btn('取消', 'Cancel', close), btn('保存规则', 'Save rules', async () => { if (controls.some(c => c.enabled.checked && [c.limit, c.minutes, c.duration].some(n => !n.value || !n.reportValidity())))
                return; const rules = structuredClone(store.rules); for (const c of controls)
                rules[c.key] = { ...rules[c.key], enabled: c.enabled.checked, ...(c.enabled.checked ? { limit: Number(c.limit.value), window: Number(c.minutes.value), duration: Number(c.duration.value) } : {}) }; await mutate('rules', { rules }); close(); render(); toast(t('规则已保存', 'Rules saved')); }, 'btn primary'));
        }
        function editRegion(row = null) {
            const m = modal(row ? '编辑地区封禁' : '添加地区封禁', row ? 'Edit region ban' : 'Add region ban');
            const geo = geoPicker(row?.country || 'CN', row?.region || ''), scope = scopePicker(row?.scopes || ['upload', 'pickup'], 'sec-scope', ['login']), reason = input('sec-region-reason', row?.reason || '', { maxlength: 120, placeholder: t('填写封禁原因', 'Reason for blocking') });
            const duration = durationSelect('sec-region-duration');
            duration.value = '0';
            if (row) {
                duration.prepend(el('option', { value: 'keep' }, t('保持原到期时间', 'Keep current expiry')));
                duration.value = 'keep';
            }
            const enabled = input('sec-region-enabled', '', { type: 'checkbox' });
            enabled.checked = row?.enabled ?? true;
            m.body.prepend(geo.node, scope.node, el('div', { class: 'sec-form-grid' }, field('封禁时长', 'Duration', duration), el('label', { class: 'sec-check' }, enabled, t('启用规则', 'Enable rule'))), field('原因', 'Reason', reason));
            m.foot.append(btn('取消', 'Cancel', close), btn('保存规则', 'Save rule', async () => {
                const chosen = scope.values();
                if (!chosen.length)
                    return fail(m.error, t('至少选择一个保护范围。', 'Select at least one protected action.'));
                if (!reason.value.trim())
                    return fail(m.error, t('请填写封禁原因。', 'Enter a reason.'));
                const until = duration.value === 'keep' ? row.until : Number(duration.value) ? Date.now() + Number(duration.value) * 60000 : null;
                if (enabled.checked && until !== null && until <= Date.now())
                    return fail(m.error, t('原规则已过期，请重新选择封禁时长。', 'This rule expired; choose a new duration.'));
                const candidate = { country: geo.country.value, region: geo.region.value, scopes: chosen, enabled: enabled.checked, reason: reason.value.trim(), until };
                if (store.regions.some(r => r !== row && r.country === candidate.country && r.region === candidate.region && overlaps(r.scopes, chosen)))
                    return fail(m.error, t('该地区已有重叠范围的规则，请编辑现有规则。', 'This region has an overlapping rule. Edit that rule instead.'));
                await mutate('region', { id: row?.id, rule: candidate });
                tab = 'regions';
                query = '';
                scopeFilter = 'all';
                page = 1;
                empty = false;
                close();
                render();
                toast(t('地区规则已保存', 'Region rule saved'));
            }, 'btn primary'));
        }
        function toggleRegion(row) {
            if (row.until !== null && row.until <= Date.now()) {
                editRegion(row);
                $('#sec-region-enabled').checked = true;
                return;
            }
            const m = modal(row.enabled ? '停用地区规则' : '启用地区规则', row.enabled ? 'Pause region rule' : 'Enable region rule');
            m.body.prepend(el('b', {}, regionName(row)), scopeBadges(row.scopes), el('p', {}, t(row.enabled ? '停用后，该地区不再受此规则限制。' : '启用后，将拦截此地区在所选范围的请求。', row.enabled ? 'This rule will stop blocking the region.' : 'Requests from this region will be blocked in selected scopes.')));
            m.foot.append(btn('取消', 'Cancel', close), btn('确认', 'Confirm', async () => { await mutate('region', { id: row.id, rule: { ...row, enabled: !row.enabled } }); close(); render(); toast(t('规则状态已更新', 'Rule status updated')); }, 'btn primary'));
        }
        function removeRegion(row) { const m = modal('移除地区规则', 'Remove region rule'); m.body.prepend(el('b', {}, regionName(row)), scopeBadges(row.scopes), el('p', {}, t('移除后不再按此规则拦截；其他规则仍生效。', 'This rule will be removed; other rules remain active.'))); m.foot.append(btn('取消', 'Cancel', close), btn('移除', 'Remove', async () => { await mutate('removeRegion', { id: row.id }); close(); render(); toast(t('地区规则已移除', 'Region rule removed')); }, 'btn primary')); }
        function testRules() {
            const m = modal('规则测试', 'Test rules'), ip = input('sec-test-ip', '203.0.113.20', { autocomplete: 'off' }), geo = geoPicker('US', '', true), scope = el('select', { id: 'sec-test-scope' }, ...scopes.map(([key, zh, en]) => el('option', { value: key }, t(zh, en))));
            const count = input('sec-test-count', '0', { type: 'number', min: 0, max: 100000, step: 1 }), hint = el('small', { class: 'muted' }), result = el('div', { id: 'sec-test-result', role: 'status', 'aria-live': 'polite', hidden: '' });
            const update = () => { const key = scope.value, r = store.rules[key]; hint.textContent = t(`填入该 IP 最近 ${r.window} 分钟的${key === 'upload' ? '发起分享' : '校验失败'}总次数（含本次）；测试不会写入封禁。`, `Enter ${key === 'upload' ? 'share attempts' : 'failed checks'} in the last ${r.window} min, including this request. Testing does not create a ban.`); result.hidden = true; };
            scope.onchange = update;
            update();
            m.body.prepend(el('div', { class: 'sec-form-grid' }, field('模拟请求 IP', 'Simulated request IP', ip), field('请求范围', 'Request scope', scope)), geo.node, field('窗口内次数（含本次）', 'Count in window (including this request)', count), hint, el('small', { class: 'muted' }, t('属地由你手动指定，不查询此 IP 的实际位置。放行仅代表通过防护，仍需满足登录、分享及取件校验。', 'Location is entered manually, not looked up. Passing protection does not bypass authentication or share permissions.')), result);
            window.attachHelp(m.body.querySelector('label[for="sec-test-count"] > span'), hint);
            window.attachHelp($('#security-dialog-title'), m.body.querySelector(':scope > small'));
            for (const n of [ip, geo.country, geo.region, count])
                n.addEventListener('input', () => { result.hidden = true; });
            m.foot.append(btn('关闭', 'Close', close), btn('测试规则', 'Test rules', async () => {
                result.hidden = true;
                const address = canonical(ip.value);
                if (!address)
                    return fail(m.error, t('请输入有效 IP 地址。', 'Enter a valid IP address.'));
                if (!count.value || !count.reportValidity())
                    return;
                m.error.hidden = true;
                const key = scope.value;
                const { blocked, reason } = await api('/api/admin/security/test', { method: 'POST', body: { ip: address, scope: key, country: geo.country.value, region: geo.region.value, count: Number(count.value) } });
                result.className = 'sec-test-result ' + (blocked ? 'sec-test-blocked' : 'sec-test-pass');
                result.replaceChildren(el('b', {}, t(blocked ? '拦截' : '防护放行', blocked ? 'Blocked' : 'Passes protection') + ' · ' + scopeName(key)), el('p', {}, reason), ...(!geo.country.value ? [el('small', { class: 'muted' }, t('属地未知，未匹配地区规则；IP 与自动防护仍参与判断。', 'Unknown location: region rules skipped; IP and automatic rules still apply.'))] : []));
                result.hidden = false;
            }, 'btn primary'));
        }
        function details(row) { const m = modal('封禁详情', 'Ban details'); const pairs = [[t('IP 地址', 'IP address'), row.ip], [t('保护范围', 'Scope'), scopeText(row.scopes)], [t('方式', 'Type'), row.kind === 'auto' ? t('自动封禁', 'Automatic') : t('手动封禁', 'Manual')], [t('原因', 'Reason'), row.reason], [t('触发次数', 'Trigger count'), row.kind === 'auto' ? row.failures : '—'], [t('封禁时间', 'Banned at'), date(row.at)], [t('解封时间', 'Expires'), row.until === null ? t('永久', 'Never') : date(row.until)]]; m.body.prepend(el('dl', { class: 'sec-details' }, ...pairs.map(([k, v]) => el('div', {}, el('dt', { class: 'muted' }, k), el('dd', {}, v))))); m.foot.append(btn('查看日志', 'View logs', () => { close(); logLink(row.ip); }), btn('关闭', 'Close', close), btn('解封', 'Unban', () => { close(); confirmUnban([row.ip]); }, 'btn primary')); }
        function rows() { if (empty)
            return []; return (tab === 'bans' ? liveBans() : tab === 'regions' ? store.regions : store.allow).filter(b => (tab !== 'bans' || kind === 'all' || b.kind === kind) && (scopeFilter === 'all' || b.scopes.includes(scopeFilter)) && (!query || [b.ip, b.note || b.reason, b.country ? regionName(b) : '', scopeText(b.scopes)].join(' ').toLowerCase().includes(query.toLowerCase()))); }
        function exportRows() { if (failed || loading || !store.enabled || filtersDirty())
            return; const items = rows(), data = tab === 'regions' ? [['Country', 'Subdivision', 'Scope', 'Enabled', 'Reason', 'Expires'], ...items.map(r => [r.country, r.region, r.scopes.join('|'), r.enabled, r.reason, r.until === null ? 'Never' : new Date(r.until).toISOString()])] : [['IP', 'Scope', tab === 'bans' ? 'Type' : 'Note', tab === 'bans' ? 'Reason' : 'Created', ...(tab === 'bans' ? ['Expires'] : [])], ...items.map(b => tab === 'bans' ? [b.ip, b.scopes.join('|'), b.kind, b.reason, b.until === null ? 'Never' : new Date(b.until).toISOString()] : [b.ip, b.scopes.join('|'), b.note, new Date(b.created).toISOString()])]; const csv = '\uFEFF' + data.map(r => r.map(v => '"' + String(v).replace(/^[=+\-@]/, "'$&").replaceAll('"', '""') + '"').join(',')).join('\r\n'); const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); const a = el('a', { href: url, download: 'security-' + tab + '.csv' }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); toast(t('已导出全部匹配记录', 'All matching records exported')); }
        function filtersDirty() { return $('#sec-search') && ($('#sec-search').value.trim() !== query || ($('#sec-kind')?.value || 'all') !== kind || $('#sec-scope-filter').value !== scopeFilter); }
        function syncExport() {
            const dirty = filtersDirty(), exportButton = $('#sec-export'), pending = $('#sec-filter-pending');
            if (exportButton)
                exportButton.disabled = failed || loading || !store.enabled || dirty || !rows().length;
            if (pending)
                pending.hidden = !dirty;
        }
        function render() {
            const focusId = view.contains(document.activeElement) ? document.activeElement.id : null;
            clearFeedback();
            const active = liveBans();
            for (const ip of selected)
                if (!active.some(b => b.ip === ip))
                    selected.delete(ip);
            navButton.textContent = t('安全防护', 'Security');
            view.replaceChildren();
            const actions = el('div', { class: 'sec-actions' }, btn('防护规则', 'Rules', editRules), btn('规则测试', 'Test rules', testRules));
            actions.children[0].id = 'sec-rules';
            actions.children[1].id = 'sec-test';
            if (failed || loading || !store.enabled)
                for (const n of actions.children)
                    n.disabled = true;
            const title = el('h2', { id: 'security-title' }, t('安全防护', 'Security'));
            view.append(el('div', { class: 'sec-heading' }, title, actions));
            window.attachHelp(title, el('span', {}, t('保护后台登录、上传和取件。地区封禁仅作用于上传和取件；允许名单只豁免自动封禁。', 'Protects admin login, uploads and pickups. Region bans apply only to uploads and pickups; allowed IPs bypass automatic bans only.')));
            const enabled = (!failed && !loading && store.enabled) ? Object.values(store.rules).filter(r => r.enabled).length : 0;
            const summary = el('div', { class: 'sec-summary' }, el('div', { class: 'sec-auto-summary' }, el('b', { class: failed ? 'sec-warning' : enabled ? 'sec-enabled' : 'muted' }, failed || loading || !store.enabled ? t(loading ? '正在读取' : failed ? '状态未知' : '未启用', loading ? 'Loading' : failed ? 'Status unknown' : 'Unavailable') : enabled ? t(`自动防护 ${enabled} / 3 已启用`, `${enabled} / 3 automatic rules enabled`) : t('自动防护已暂停', 'Automatic protection paused'))), el('div', { class: 'sec-metric' }, el('b', { id: 'sec-ip-total' }, failed || loading || !store.enabled ? '—' : empty ? 0 : active.length), el('small', { class: 'muted' }, t('当前封禁 IP', 'Active IP bans'))), el('div', { class: 'sec-metric' }, el('b', { id: 'sec-region-total' }, failed || loading || !store.enabled ? '—' : empty ? 0 : activeRegions().length), el('small', { class: 'muted' }, t('生效地区规则', 'Active region rules'))));
            const ruleGrid = el('div', { class: 'sec-rule-grid' }), triggers = { login: ['令牌校验失败', 'Failed token checks'], upload: ['发起文件或文本分享，分片不重复计数', 'File or text share attempts; chunks do not count'], pickup: ['无效口令，成功取件不计入', 'Invalid codes; successful pickups do not count'] };
            if (failed || loading || !store.enabled)
                summary.firstChild.append(el('small', { class: 'muted' }, t('无法读取防护状态，请刷新重试', 'Unable to read protection status; refresh to retry')));
            else {
                for (const [key] of scopes) {
                    const r = store.rules[key], name = el('b', {}, scopeName(key));
                    const rule = el('div', { class: 'sec-rule-summary' }, name, el('small', { class: 'muted' }, r.enabled ? t(`${r.window} 分钟 ${r.limit} 次`, `${r.limit} in ${r.window} min`) : t('已暂停', 'Paused')), el('small', { class: r.enabled ? 'muted' : 'sec-rule-inactive' }, r.enabled ? t(`封禁 ${r.duration} 分钟`, `${r.duration} min ban`) : t('不触发自动封禁', 'No automatic ban')));
                    ruleGrid.append(rule);
                    window.attachHelp(name, el('span', {}, t(...triggers[key])));
                }
                summary.firstChild.append(ruleGrid);
            }
            view.append(summary);
            const tabs = el('div', { class: 'sec-tabs', role: 'group', 'aria-label': t('防护名单', 'Protection lists') });
            for (const [key, zh, en] of [['bans', '封禁 IP', 'Banned IPs'], ['regions', '地区封禁', 'Region bans'], ['allow', '允许名单', 'Allowed IPs']]) {
                const b = btn(zh, en, () => { tab = key; page = 1; query = ''; kind = 'all'; scopeFilter = 'all'; selected.clear(); render(); });
                b.setAttribute('aria-pressed', String(tab === key));
                b.dataset.secTab = key;
                tabs.append(b);
            }
            const add = tab === 'bans' ? btn('手动封禁', 'Ban IP', () => openAdd(false), 'btn small primary') : tab === 'regions' ? btn('添加地区', 'Add region', () => editRegion(), 'btn small primary') : btn('添加允许 IP', 'Allow IP', () => openAdd(true), 'btn small primary');
            add.id = 'sec-add';
            add.disabled = failed || loading || !store.enabled;
            view.append(el('div', { class: 'sec-list-heading' }, tabs, add));
            const search = input('sec-search', query, { type: 'search', placeholder: t(tab === 'regions' ? '搜索地区 / 原因' : tab === 'allow' ? '搜索 IP / 备注' : '搜索 IP / 原因', tab === 'regions' ? 'Search region / reason' : tab === 'allow' ? 'Search IP / note' : 'Search IP / reason'), 'aria-label': t('搜索名单', 'Search list') });
            const filter = el('select', { id: 'sec-kind', 'aria-label': t('封禁方式', 'Ban type') }, el('option', { value: 'all' }, t('全部方式', 'All types')), el('option', { value: 'auto' }, t('自动封禁', 'Automatic')), el('option', { value: 'manual' }, t('手动封禁', 'Manual')));
            filter.value = kind;
            const scope = el('select', { id: 'sec-scope-filter', 'aria-label': t('保护范围', 'Protected action') }, el('option', { value: 'all' }, t('全部范围', 'All scopes')), ...scopes.filter(([key]) => tab !== 'regions' || key !== 'login').map(([key, zh, en]) => el('option', { value: key }, t(zh, en))));
            scope.value = scopeFilter;
            const apply = () => { query = search.value.trim(); kind = filter.value; scopeFilter = scope.value; page = 1; selected.clear(); draw(); };
            search.addEventListener('input', syncExport);
            filter.onchange = syncExport;
            scope.onchange = syncExport;
            const exportButton = btn('导出筛选结果', 'Export results', exportRows);
            exportButton.id = 'sec-export';
            exportButton.title = t('导出当前类别和筛选条件下的全部记录，包含所有分页。', 'Export all matching records in this category across pages.');
            const submit = btn('筛选', 'Filter', () => { });
            submit.type = 'submit';
            const form = el('form', { class: 'sec-toolbar', id: 'sec-filter' }, el('div', { class: 'sec-actions sec-filters' }, search, scope, ...(tab === 'bans' ? [filter] : [])), el('div', { class: 'sec-actions sec-filter-actions' }, submit, btn('重置', 'Reset', () => { query = ''; kind = 'all'; scopeFilter = 'all'; page = 1; selected.clear(); render(); }), exportButton));
            form.onsubmit = e => { e.preventDefault(); apply(); };
            view.append(form, el('small', { id: 'sec-filter-pending', class: 'sec-filter-pending', role: 'status', hidden: '' }, t('筛选条件已更改，请先点击“筛选”。', 'Filters changed. Apply them before exporting.')), el('div', { id: 'sec-list' }));
            draw();
            if (focusId)
                document.getElementById(focusId)?.focus();
        }
        function draw() {
            const host = $('#sec-list');
            if (!host)
                return;
            if (loading || (!store.enabled && !failed)) {
                host.replaceChildren(el('div', { class: 'sec-empty', role: 'status' }, loading ? t('正在读取防护状态…', 'Loading protection…') : t('安全防护未启用，需要绑定 R2 或 D1。', 'Protection unavailable. Bind R2 or D1.')));
                syncExport();
                return;
            }
            const focusId = document.activeElement?.id;
            host.replaceChildren();
            if (failed) {
                syncExport();
                host.append(el('div', { class: 'sec-empty', role: 'alert' }, t('防护数据加载失败', 'Failed to load protection data'), btn('重试', 'Retry', () => refresh())));
                return;
            }
            $('#sec-ip-total').textContent = empty ? 0 : liveBans().length;
            $('#sec-region-total').textContent = empty ? 0 : activeRegions().length;
            for (const ip of selected)
                if (!liveBans().some(b => b.ip === ip))
                    selected.delete(ip);
            const items = rows(), max = Math.max(1, Math.ceil(items.length / 5));
            page = Math.min(page, max);
            const visible = items.slice((page - 1) * 5, page * 5);
            const prev = btn('上一页', 'Previous', () => { page--; draw(); }), next = btn('下一页', 'Next', () => { page++; draw(); });
            prev.disabled = page <= 1;
            next.disabled = page >= max;
            const bulk = btn(t(`解封所选（${selected.size}）`, `Unban selected (${selected.size})`), `Unban selected (${selected.size})`, () => confirmUnban([...selected]));
            bulk.id = 'sec-bulk';
            bulk.disabled = !selected.size;
            host.append(el('div', { class: 'sec-pagination' }, el('div', { class: 'sec-actions' }, el('small', { class: 'muted' }, t(`共 ${items.length} 条 · 第 ${page} / ${max} 页`, `${items.length} entries · Page ${page} / ${max}`)), ...(tab === 'bans' && selected.size ? [el('span', { class: 'sec-selection-count' }, t(`已选 ${selected.size} 项`, `Selected ${selected.size}`)), bulk, btn('取消选择', 'Clear selection', () => { selected.clear(); draw(); })] : [])), el('div', { class: 'sec-actions' }, prev, next, btn('刷新', 'Refresh', async () => { await refresh(); toast(t('已刷新', 'Refreshed')); }))));
            syncExport();
            if (!items.length) {
                host.append(el('div', { class: 'sec-empty' }, query ? t('没有匹配的记录', 'No matching records') : tab === 'bans' ? t('当前没有封禁 IP', 'No active bans') : tab === 'regions' ? t('尚未添加地区规则', 'No region rules') : t('尚未添加允许 IP', 'No allowed IPs')));
                return;
            }
            if (tab === 'regions') {
                drawRegions(host, visible);
                return;
            }
            const table = el('table', { class: 'sec-table', 'aria-label': t(tab === 'bans' ? '封禁列表' : '允许名单', tab === 'bans' ? 'Banned IPs' : 'Allowed IPs') });
            const header = el('tr');
            if (tab === 'bans') {
                const all = input('sec-select-page', '', { type: 'checkbox', 'aria-label': t('选择本页', 'Select this page') });
                all.checked = visible.every(r => selected.has(r.ip));
                all.indeterminate = !all.checked && visible.some(r => selected.has(r.ip));
                all.onchange = () => { for (const r of visible)
                    all.checked ? selected.add(r.ip) : selected.delete(r.ip); draw(); };
                header.append(el('th', {}, all));
            }
            const cols = tab === 'bans' ? [["IP / 保护范围", "IP / scope"], ["原因", "Reason"], ["触发次数", "Count"], ["封禁时间", "Banned at"], ["自动解封", "Expires"], ["操作", "Actions"]] : [["IP / 豁免范围", "IP / exempt scope"], ["备注", "Note"], ["添加时间", "Added"], ["操作", "Actions"]];
            for (const [zh, en] of cols)
                header.append(el('th', {}, t(zh, en)));
            table.append(el('thead', {}, header));
            const body = el('tbody');
            for (const r of visible) {
                const row = el('tr');
                if (tab === 'bans') {
                    const check = input('sec-select-' + r.ip, '', { type: 'checkbox', 'aria-label': t('选择 ' + r.ip, 'Select ' + r.ip) });
                    check.checked = selected.has(r.ip);
                    check.onchange = () => { check.checked ? selected.add(r.ip) : selected.delete(r.ip); draw(); };
                    row.append(el('td', { class: 'sec-select' }, check));
                    const remaining = r.until === null ? t('永久', 'Permanent') : t(`剩余 ${Math.max(1, Math.ceil((r.until - Date.now()) / 60000))} 分钟`, `${Math.max(1, Math.ceil((r.until - Date.now()) / 60000))} min left`);
                    row.append(el('td', { 'data-label': 'IP', class: 'sec-address' }, ipLine(r)), el('td', { 'data-label': t('原因', 'Reason') }, el('div', { class: 'ui-record-line' }, el('span', {}, r.reason), el('sup', { class: 'ui-record-sup', 'data-tone': r.kind === 'auto' ? 'violet' : 'slate' }, r.kind === 'auto' ? t('自动封禁', 'Automatic') : t('手动封禁', 'Manual')))), el('td', { 'data-label': t('触发次数', 'Count') }, r.kind === 'auto' ? r.failures : '—'), el('td', { 'data-label': t('封禁时间', 'Banned at') }, date(r.at)), el('td', { 'data-label': t('自动解封', 'Expires') }, remaining, ...(r.until === null ? [] : [el('small', { class: 'muted' }, date(r.until))])), el('td', { class: 'sec-row-actions' }, btn('详情', 'Details', () => details(r)), btn('日志', 'Logs', () => logLink(r.ip)), btn('解封', 'Unban', () => confirmUnban([r.ip]))));
                }
                else
                    row.append(el('td', { 'data-label': 'IP', class: 'sec-address' }, ipLine(r)), el('td', { 'data-label': t('备注', 'Note') }, r.note), el('td', { 'data-label': t('添加时间', 'Added') }, date(r.created)), el('td', { class: 'sec-row-actions' }, btn('日志', 'Logs', () => logLink(r.ip)), btn('移除', 'Remove', () => removeAllow(r))));
                body.append(row);
            }
            table.append(body);
            host.append(el('div', { class: 'sec-table-wrap' }, table));
            if (focusId?.startsWith('sec-select'))
                document.getElementById(focusId)?.focus();
        }
        function drawRegions(host, items) {
            const table = el('table', { class: 'sec-table sec-region-table', 'aria-label': t('地区封禁规则', 'Region ban rules') }), head = el('tr');
            for (const [zh, en] of [['地区 / 范围', 'Region / scope'], ['原因', 'Reason'], ['状态', 'Status'], ['到期时间', 'Expires'], ['操作', 'Actions']])
                head.append(el('th', {}, t(zh, en)));
            table.append(el('thead', {}, head));
            const body = el('tbody');
            for (const r of items) {
                const expired = r.until !== null && r.until <= Date.now(), active = r.enabled && !expired;
                body.append(el('tr', {}, el('td', { class: 'sec-address' }, el('div', { class: 'sec-ip-line' }, el('b', {}, regionName(r)), scopeBadges(r.scopes, true))), el('td', { 'data-label': t('原因', 'Reason') }, r.reason), el('td', { 'data-label': t('状态', 'Status') }, el('span', { class: active ? 'sec-enabled' : 'muted' }, expired ? t('已过期', 'Expired') : r.enabled ? t('生效中', 'Active') : t('已停用', 'Paused'))), el('td', { 'data-label': t('到期时间', 'Expires') }, r.until === null ? t('永久', 'Never') : date(r.until)), el('td', { class: 'sec-row-actions' }, btn('编辑', 'Edit', () => editRegion(r)), btn(r.enabled && !expired ? '停用' : '启用', r.enabled && !expired ? 'Pause' : 'Enable', () => toggleRegion(r)), btn('日志', 'Logs', () => logLink(r.id)), btn('移除', 'Remove', () => removeRegion(r)))));
            }
            table.append(body);
            host.append(el('div', { class: 'sec-table-wrap' }, table));
        }
        $('#lang-btn').addEventListener('click', () => { navButton.textContent = t('安全防护', 'Security');
            shortcut.querySelector('h4').textContent = t('安全防护', 'Security');
            shortcut.querySelector('button').textContent = t('管理访问规则与封禁 →', 'Manage access rules and bans →'); if (open)
            render(); });
        setInterval(() => { if (open && !document.hidden && !dialog.open && !loading && $('#sec-list') && !filtersDirty())
            refresh().catch(error => toast(error.message)); }, 60000);
    })();
}
