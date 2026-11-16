export function initControls() {
    /* Shared accessible controls. Native inputs and their original events are retained. */
    (() => {
        const en = () => document.documentElement.lang === 'en';
        window.numberControl = (node, label) => {
            if (node.closest('.sec-number'))
                return node.closest('.sec-number');
            const wrap = document.createElement('span');
            wrap.className = 'sec-number';
            const down = document.createElement('button'), up = document.createElement('button');
            for (const button of [down, up]) {
                button.type = 'button';
                button.className = 'sec-step';
            }
            down.textContent = '−';
            up.textContent = '+';
            node.inputMode = 'numeric';
            const labelText = () => typeof label === 'function' ? label() : label;
            const sync = () => {
                node.setAttribute('aria-label', labelText());
                down.setAttribute('aria-label', (en() ? 'Decrease ' : '减少') + labelText());
                up.setAttribute('aria-label', (en() ? 'Increase ' : '增加') + labelText());
                down.disabled = node.disabled || (node.value !== '' && node.min !== '' && node.valueAsNumber <= Number(node.min));
                up.disabled = node.disabled || (node.value !== '' && node.max !== '' && node.valueAsNumber >= Number(node.max));
            };
            down.onclick = () => { node.stepDown(); node.dispatchEvent(new Event('input', { bubbles: true })); node.dispatchEvent(new Event('change', { bubbles: true })); };
            up.onclick = () => { node.stepUp(); node.dispatchEvent(new Event('input', { bubbles: true })); node.dispatchEvent(new Event('change', { bubbles: true })); };
            node.addEventListener('input', sync);
            node.addEventListener('change', sync);
            wrap.addEventListener('focusin', sync);
            wrap.addEventListener('pointerenter', sync);
            new MutationObserver(sync).observe(node, { attributes: true, attributeFilter: ['disabled', 'min', 'max'] });
            wrap.append(down, node, up);
            node.uiSyncNumber = sync;
            sync();
            return wrap;
        };
        let active = null, sequence = 0;
        function hideHelp() { if (!active)
            return; clearTimeout(active.timer); if (active.tip.isConnected && active.tip.matches(':popover-open'))
            active.tip.hidePopover(); active.button.setAttribute('aria-expanded', 'false'); active = null; }
        function help(anchor, content) {
            const row = document.createElement(anchor.closest('summary,label') ? 'span' : 'div');
            row.className = 'ui-help-anchor';
            anchor.before(row);
            row.append(anchor);
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'ui-help-button';
            button.textContent = '?';
            button.setAttribute('aria-expanded', 'false');
            const tip = document.createElement('div');
            tip.id = 'ui-help-' + (++sequence);
            tip.className = 'ui-help-popover';
            tip.setAttribute('popover', 'manual');
            tip.setAttribute('role', 'tooltip');
            tip.append(content);
            button.setAttribute('aria-describedby', tip.id);
            button.setAttribute('aria-controls', tip.id);
            tip.uiHelpButton = button;
            row.append(button);
            (anchor.closest('dialog') || document.body).append(tip);
            const sync = () => button.setAttribute('aria-label', anchor.textContent.trim() + (en() ? ' help' : '说明'));
            sync();
            new MutationObserver(sync).observe(anchor, { childList: true, subtree: true, characterData: true });
            function show() {
                if (active?.button === button) {
                    clearTimeout(active.timer);
                    return;
                }
                hideHelp();
                active = { tip, button, pinned: false, timer: null };
                tip.showPopover();
                button.setAttribute('aria-expanded', 'true');
                const r = button.getBoundingClientRect(), width = Math.min(300, innerWidth - 24);
                tip.style.width = width + 'px';
                tip.style.maxHeight = Math.max(80, innerHeight - 24) + 'px';
                const h = tip.getBoundingClientRect().height;
                tip.style.left = Math.max(12, Math.min(r.left, innerWidth - width - 12)) + 'px';
                tip.style.top = Math.max(12, Math.min(r.bottom + 7 + h <= innerHeight - 12 ? r.bottom + 7 : r.top - h - 7, innerHeight - h - 12)) + 'px';
            }
            const leave = () => { if (active?.button === button && !active.pinned)
                active.timer = setTimeout(hideHelp, 180); };
            button.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch')
                show(); });
            button.addEventListener('pointerleave', leave);
            button.addEventListener('focus', show);
            button.addEventListener('blur', leave);
            button.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); if (active?.button === button && active.pinned)
                hideHelp();
            else {
                show();
                active.pinned = true;
            } });
            tip.addEventListener('pointerenter', () => { if (active)
                clearTimeout(active.timer); });
            tip.addEventListener('pointerleave', leave);
        }
        window.attachHelp = help;
        document.addEventListener('close', e => { if (active && e.target.contains(active.tip))
            hideHelp(); }, true);
        document.addEventListener('pointerdown', e => { if (active && !active.tip.contains(e.target) && !active.button.contains(e.target))
            hideHelp(); }, true);
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && active) {
            e.preventDefault();
            e.stopImmediatePropagation();
            hideHelp();
        } }, true);
        window.addEventListener('resize', hideHelp);
        document.addEventListener('scroll', e => { if (active && !active.tip.contains(e.target))
            hideHelp(); }, true);
        function upgrade() {
            if (active && (!active.button.isConnected || !active.tip.isConnected))
                hideHelp();
            for (const tip of document.querySelectorAll('.ui-help-popover'))
                if (!tip.uiHelpButton?.isConnected)
                    tip.remove();
            for (const node of document.querySelectorAll('input[type=number]')) {
                if (node.closest('.sec-number')) {
                    node.uiSyncNumber?.();
                    continue;
                }
                const label = () => document.querySelector('label[for="' + node.id + '"]')?.textContent.trim() || node.id;
                const marker = document.createTextNode('');
                node.before(marker);
                marker.replaceWith(window.numberControl(node, label));
            }
            for (const [key, selector] of [['ad.browserSettings', '#display-title'], ['ad.guestRules', 'label[for="guest-weekly"]'], ['audit.retention', '#audit-title'], ['ad.historyScope', '#source-history h4'], ['context.visibility', '.upload-context summary>[data-i18n="context.add"]']]) {
                const content = document.querySelector('[data-i18n="' + key + '"]'), anchor = document.querySelector(selector);
                if (content && anchor && !content.closest('.ui-help-popover'))
                    help(anchor, content);
            }
            for (const anchor of document.querySelectorAll('#source-detail .source-field>small[title]')) {
                const content = document.createElement('span');
                content.textContent = anchor.title;
                anchor.removeAttribute('title');
                help(anchor, content);
            }
        }
        upgrade();
        new MutationObserver(upgrade).observe(document.body, { childList: true, subtree: true });
    })();
}
