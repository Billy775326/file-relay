import { initEntry } from './ui-entry.js';
import { initControls } from './ui-controls.js';
import { initClassifications } from './ui-classifications.js';
import { initAuditLayout } from './ui-audit-layout.js';
import { initSecurity } from './admin-security.js';
export function initUi(surface) {
    const root = document.documentElement;
    root.classList.add('ui-enhanced', 'ui-soft');
    root.dataset.uiSurface = surface;
    const header = document.querySelector('.topbar'), band = document.createElement('div');
    band.className = 'ui-header-band';
    header.before(band);
    band.append(header);
    initEntry();
    initControls();
    initClassifications();
    initAuditLayout();
    if (surface === 'admin')
        initSecurity();
    const send = document.querySelector('.topbar a[data-i18n="nav.send"]');
    if (send?.target === '_blank') {
        send.classList.add('ui-new-tab');
        const title = () => send.title = document.documentElement.lang === 'en' ? 'Send (opens in a new tab)' : '发送（新标签页打开）';
        document.querySelector('#lang-btn')?.addEventListener('click', title);
        title();
    }
    for (const link of document.querySelectorAll('.ui-public-nav a[aria-current="page"]'))
        link.addEventListener('click', event => { if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey)
            event.preventDefault(); });
}
