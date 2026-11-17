export function initEntry() {
    /* Shared send, pickup and login interactions; templates own the initial layout. */
    const root = document.documentElement, q = s => document.querySelector(s);
    const en = () => document.documentElement.lang === 'en';
    const words = [];
    const label = (node, zh, english) => { words.push([node, zh, english]); node.textContent = en() ? english : zh; return node; };
    const button = (id, zh, english, cls = 'btn ghost') => { const n = document.createElement('button'); n.type = 'button'; n.id = id; n.className = cls; return label(n, zh, english); };
    // Stable layout lives in HTML. This module only attaches interactions.
    if (q('#dropzone') || q('#otp-row')) {
        const help = q('#ui-send-help');
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
        const card = q('#pickup-input-card'), result = q('#pickup-result'), boxes = [...document.querySelectorAll('.otp-box')], error = q('#pickup-error');
        const submit = q('#ui-query'), clear = q('#ui-clear');
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
    }
    const login = q('#admin-login');
    if (login) {
        const sync = () => root.classList.toggle('ui-login', !login.hidden);
        new MutationObserver(sync).observe(login, { attributes: true, attributeFilter: ['hidden'] });
        sync();
        const token = q('#admin-token'), toggle = q('#ui-token-toggle');
        function toggleLabel() {
            const shown = token.type === 'text';
            toggle.textContent = en() ? (shown ? 'Hide' : 'Show') : (shown ? '隐藏' : '显示');
            toggle.setAttribute('aria-label', en() ? (shown ? 'Hide admin token' : 'Show admin token') : (shown ? '隐藏管理令牌' : '显示管理令牌'));
        }
        q('#lang-btn')?.addEventListener('click', toggleLabel);
        toggle.onclick = () => { const show = token.type === 'password'; token.type = show ? 'text' : 'password'; toggle.setAttribute('aria-pressed', String(show)); toggleLabel(); };
        token.required = true;
        q('#btn-login').addEventListener('click', e => { if (!token.reportValidity()) {
            e.preventDefault();
            e.stopImmediatePropagation();
        } }, true);
    }
    q('#lang-btn')?.addEventListener('click', () => { for (const [node, zh, english] of words)
        node.textContent = en() ? english : zh; });
}
