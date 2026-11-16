export function initEntry() {
    /* Shared send, pickup and login controls. */
    if (true) {
        const root = document.documentElement, q = s => document.querySelector(s);
        const en = () => document.documentElement.lang === 'en';
        const words = [];
        const label = (node, zh, english) => { words.push([node, zh, english]); node.textContent = en() ? english : zh; return node; };
        const button = (id, zh, english, cls = 'btn ghost') => { const n = document.createElement('button'); n.type = 'button'; n.id = id; n.className = cls; return label(n, zh, english); };
        if (q('#dropzone') || q('#otp-row')) {
            const header = q('.topbar'), nav = document.createElement('nav');
            nav.className = 'ui-public-nav';
            nav.setAttribute('aria-label', '发送与取件');
            for (const [url, zh, english, active] of [['/', '发送', 'Send', !!q('#dropzone')], ['/pickup', '取件', 'Pick up', !!q('#otp-row')]]) {
                const a = document.createElement('a');
                a.href = url;
                a.className = 'admin-nav-link';
                label(a, zh, english);
                a.setAttribute('aria-current', active ? 'page' : 'false');
                nav.append(a);
            }
            q('.brand').after(nav);
            header.classList.add('ui-public-header');
            q('.actions a')?.remove();
        }
        if (q('#dropzone')) {
            root.classList.add('ui-send');
            q('#upload-name').setAttribute('autocomplete', 'nickname');
            q('#upload-description').rows = 2;
            const context = q('.upload-context'), summary = context.querySelector('summary'), caption = document.createElement('span');
            context.open = true;
            caption.dataset.i18n = summary.dataset.i18n;
            caption.textContent = summary.textContent;
            summary.removeAttribute('data-i18n');
            summary.replaceChildren(caption);
            summary.append(q('[data-i18n="context.visibility"]'));
        }
        if (q('#dropzone') || q('#otp-row')) {
            const isPickup = !!q('#otp-row');
            const footer = q('.foot');
            footer.removeAttribute('data-i18n');
            footer.classList.add('ui-send-footer');
            footer.replaceChildren();
            const about = document.createElement('div'), description = document.createElement('small');
            about.className = 'ui-footer-about';
            label(description, '见字如面，让分享简单一点。', 'A simpler way to share files and words.');
            about.append(description);
            const contact = document.createElement('div');
            contact.className = 'ui-footer-contact';
            const mail = document.createElement('a');
            mail.href = 'mailto:iblykk@gmail.com';
            label(mail, '联系站长', 'Contact');
            contact.append(mail);
            const links = document.createElement('nav');
            links.className = 'ui-footer-links';
            links.setAttribute('aria-label', '页尾导航');
            const help = button('ui-send-help', '使用帮助', 'Help', 'ui-footer-link'), pickup = document.createElement('a');
            pickup.href = isPickup ? '/' : '/pickup';
            pickup.className = 'ui-footer-link';
            label(pickup, isPickup ? '前往发送' : '前往取件', isPickup ? 'Send a share' : 'Pick up a share');
            links.append(help, pickup);
            const footerInner = document.createElement('div');
            footerInner.className = 'ui-footer-inner';
            footerInner.append(about, links, contact);
            footer.append(footerInner);
            const helpDialog = document.createElement('dialog');
            helpDialog.id = 'ui-send-help-dialog';
            helpDialog.className = 'source-dialog ui-send-help-dialog';
            helpDialog.setAttribute('aria-labelledby', 'ui-send-help-title');
            const helpHead = document.createElement('div');
            helpHead.className = 'source-heading';
            const helpTitle = document.createElement('h3');
            helpTitle.id = 'ui-send-help-title';
            label(helpTitle, '使用帮助', 'Sharing help');
            helpHead.append(helpTitle);
            const helpBody = document.createElement('div');
            helpBody.className = 'source-body ui-send-help-body';
            for (const [zhTitle, enTitle, zhText, enText] of [
                ['如何发送？', 'How do I send?', '选择文件或输入文本，设置有效期与可取次数，提交后将生成的口令或链接发给对方。', 'Choose files or enter text, set expiry and pickup limits, then send the generated code or link to your recipient.'],
                ['对方如何取件？', 'How does the recipient collect it?', '在取件页输入 6 位口令，也可以直接打开分享链接或扫描二维码。', 'Enter the six-digit code on the pickup page, open the share link, or scan its QR code.'],
                ['口令无法使用怎么办？', 'Why is a code unavailable?', '先检查口令是否正确；分享过期、达到取件次数上限或被删除后，将无法继续取件。可联系发送者重新分享。', 'Check the code first. Expired, deleted or fully collected shares are unavailable. Ask the sender to share again.']
            ]) {
                const section = document.createElement('section'), heading = document.createElement('h4'), text = document.createElement('p');
                label(heading, zhTitle, enTitle);
                label(text, zhText, enText);
                section.append(heading, text);
                helpBody.append(section);
            }
            const helpFoot = document.createElement('div');
            helpFoot.className = 'source-footer';
            const closeHelp = button('ui-send-help-close', '知道了', 'Got it', 'btn primary');
            helpFoot.append(closeHelp);
            helpDialog.append(helpHead, helpBody, helpFoot);
            document.body.append(helpDialog);
            help.onclick = () => helpDialog.showModal();
            closeHelp.onclick = () => helpDialog.close();
            helpDialog.addEventListener('close', () => help.focus());
        }
        if (q('#otp-row')) {
            root.classList.add('ui-pickup');
            const card = q('#pickup-input-card'), result = q('#pickup-result'), boxes = [...document.querySelectorAll('.otp-box')], error = q('#pickup-error');
            const actions = document.createElement('div');
            actions.className = 'ui-pickup-actions';
            const submit = button('ui-query', '查看分享', 'View share', 'btn primary');
            const clear = button('ui-clear', '清空', 'Clear');
            actions.append(submit, clear);
            error.before(actions);
            boxes.forEach((box, i) => box.setAttribute('aria-label', en() ? `Digit ${i + 1}` : `第 ${i + 1} 位口令`));
            submit.onclick = () => {
                const value = boxes.map(n => n.value).join('');
                if (!/^\d{6}$/.test(value)) {
                    error.textContent = en() ? 'Enter all 6 digits.' : '请输入完整的 6 位数字口令。';
                    error.hidden = false;
                    boxes.find(n => !n.value)?.focus();
                    return;
                }
                boxes[5].dispatchEvent(new Event('input', { bubbles: true }));
            };
            clear.onclick = () => { boxes.forEach(n => n.value = ''); error.hidden = true; result.hidden = true; boxes[0].focus(); };
            const sync = () => { card.hidden = !result.hidden; root.classList.toggle('ui-pickup-found', !result.hidden); };
            new MutationObserver(sync).observe(result, { attributes: true, attributeFilter: ['hidden'] });
            sync();
            const ready = document.createElement('div');
            ready.className = 'ui-pickup-caption';
            label(ready, '取件成功', 'Share found');
            result.before(ready);
        }
        const login = q('#admin-login');
        if (login) {
            const sync = () => root.classList.toggle('ui-login', !login.hidden);
            new MutationObserver(sync).observe(login, { attributes: true, attributeFilter: ['hidden'] });
            sync();
            const token = q('#admin-token'), field = document.createElement('div');
            field.className = 'ui-token-field';
            token.before(field);
            field.append(token);
            const toggle = button('ui-token-toggle', '显示', 'Show', 'btn small ghost');
            toggle.setAttribute('aria-pressed', 'false');
            toggle.setAttribute('aria-label', '显示管理令牌');
            field.append(toggle);
            toggle.onclick = () => { const show = token.type === 'password'; token.type = show ? 'text' : 'password'; toggle.textContent = en() ? (show ? 'Hide' : 'Show') : (show ? '隐藏' : '显示'); toggle.setAttribute('aria-pressed', String(show)); toggle.setAttribute('aria-label', en() ? (show ? 'Hide admin token' : 'Show admin token') : (show ? '隐藏管理令牌' : '显示管理令牌')); };
            token.required = true;
            q('#btn-login').addEventListener('click', e => { if (!token.reportValidity()) {
                e.preventDefault();
                e.stopImmediatePropagation();
            } }, true);
            const back = document.createElement('a');
            back.href = '/';
            back.className = 'ui-entry-back';
            label(back, '返回发送页', 'Back to send');
            login.append(back);
            const error = q('#login-error');
            q('#btn-login').before(error);
            error.setAttribute('role', 'alert');
        }
        q('#lang-btn')?.addEventListener('click', () => { for (const [node, zh, english] of words)
            node.textContent = en() ? english : zh; });
    }
}
