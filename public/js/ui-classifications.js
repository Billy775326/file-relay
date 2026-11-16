export function initClassifications() {
    /* Attach record categories to their subject; navigation and outcome badges stay intact. */
    (() => {
        const body = document.querySelector('#audit-body');
        if (!body)
            return;
        function enhance() {
            for (const cell of body.querySelectorAll('tr>td:nth-child(2)')) {
                const category = cell.querySelector(':scope > small'), action = cell.querySelector(':scope > span');
                if (!category || !action)
                    continue;
                const line = document.createElement('div');
                line.className = 'ui-record-line';
                const tag = document.createElement('sup');
                tag.className = 'ui-record-sup';
                tag.textContent = category.textContent;
                const key = [...document.querySelectorAll('.audit-categories button[data-category]')].find(button => button.textContent.trim() === category.textContent.trim())?.dataset.category;
                tag.dataset.tone = { login: 'blue', operation: 'teal', security: 'amber' }[key] || 'slate';
                line.append(action, tag);
                cell.replaceChildren(line);
            }
        }
        enhance();
        new MutationObserver(enhance).observe(body, { childList: true, subtree: true });
    })();
}
