export function initAuditLayout() {
    /* Keep category selection, applied filters and export in the same workspace. */
    (() => {
        const form = document.querySelector('#audit-filter'), exportButton = document.querySelector('#audit-export');
        if (!form || !exportButton)
            return;
        const oldActions = exportButton.parentElement;
        form.querySelector('.audit-actions').append(exportButton);
        oldActions.remove();
        const notice = document.createElement('small');
        notice.id = 'ui-audit-pending';
        notice.className = 'ui-audit-pending';
        notice.setAttribute('role', 'status');
        notice.hidden = true;
        form.append(notice);
        const fields = ['audit-result', 'audit-from', 'audit-to', 'audit-q'].map(id => document.getElementById(id));
        const snapshot = () => JSON.stringify(fields.map(n => n.value.trim()));
        let applied = snapshot();
        function sync() {
            const dirty = snapshot() !== applied, en = document.documentElement.lang === 'en';
            notice.hidden = !dirty;
            notice.textContent = en ? 'Filters changed. Apply them before exporting.' : '筛选条件已更改，请先点击“筛选”。';
            exportButton.setAttribute('aria-disabled', String(dirty));
            exportButton.title = en ? 'Export all matching records across pages' : '导出当前类别及筛选条件下的全部匹配记录，包含所有分页';
            if (dirty)
                exportButton.setAttribute('aria-describedby', notice.id);
            else
                exportButton.removeAttribute('aria-describedby');
        }
        for (const n of fields) {
            n.addEventListener('input', sync);
            n.addEventListener('change', sync);
        }
        form.addEventListener('submit', () => { const from = fields[1].value, to = fields[2].value; if (from && to && from > to) {
            sync();
            return;
        } applied = snapshot(); sync(); });
        document.querySelector('#audit-reset').addEventListener('click', () => { applied = snapshot(); sync(); });
        exportButton.addEventListener('click', e => { if (snapshot() !== applied) {
            e.preventDefault();
            e.stopImmediatePropagation();
            sync();
        } }, true);
        document.querySelector('#lang-btn').addEventListener('click', sync);
        sync();
    })();
}
