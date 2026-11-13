"""UI-only fixtures: pagination, local preferences and modal access; no live data."""
import sys
import time
from urllib.parse import urlparse, parse_qs
from playwright.sync_api import sync_playwright, expect

sys.stdout.reconfigure(encoding='utf-8')
base = sys.argv[1]
now = int(time.time() * 1000)
files = [dict(id=str(i), code=str(100000+i), kind='file', filename=f'布局测试文件_{i}.txt', size=2048,
              pickup_count=0, max_pickups=5, expire_at=now+86400000, created_at=now-i*1000,
              status='active', source=None) for i in range(53)]
logs = [dict(id=str(i), at=now-i*1000, action='download', category='operation', result='success',
             actor='admin', ip='203.0.113.42', country='CN', region='Zhejiang', city='Hangzhou',
             target='100001', method='GET', status=200, durationMs=12, agent='Fixture browser', detail={}) for i in range(123)]
state = {'total': 53, 'failed': False, 'hold': False}
pending, writes, errors = [], [], []
with sync_playwright() as p:
    browser = p.chromium.launch()
    context = browser.new_context(viewport={'width': 1135, 'height': 900})
    context.add_init_script("if (!localStorage.getItem('lang')) localStorage.setItem('lang','zh')")
    page = context.new_page()
    page.on('pageerror', lambda e: errors.append(str(e)))

    def route_api(route):
        url = urlparse(route.request.url)
        query = parse_qs(url.query)
        path = url.path.removeprefix('/api/admin/')
        if route.request.method != 'GET': writes.append(path)
        if path == 'stats':
            return route.fulfill(json=dict(total=53, active=53, files=53, texts=0, todayCreated=3, totalBytes=108544))
        if path == 'shares':
            if state['hold']:
                state['hold'] = False
                pending.append(route)
                return
            if state['failed']: return route.fulfill(status=503, json={'message': 'List unavailable'})
            limit, offset = int(query['limit'][0]), int(query['offset'][0])
            return route.fulfill(json={'total': state['total'], 'rows': files[:state['total']][offset:offset+limit]})
        if path == 'audit-logs':
            limit, offset = int(query['limit'][0]), int(query['offset'][0])
            return route.fulfill(json={'enabled': True, 'total': len(logs), 'rows': logs[offset:offset+limit]})
        if path == 'settings': return route.fulfill(json={'expiredRetentionDays': 30})
        if path == 'upload-policy': return route.fulfill(json={'weeklyFileLimit': 5})
        if path == 'login-protection': return route.fulfill(json={'enabled': True, 'maxFailures': 5, 'windowSeconds': 600, 'banSeconds': 1800, 'bans': []})
        return route.fulfill(status=404, json={'message': 'Fixture route missing'})

    page.route('**/api/admin/**', route_api)
    page.goto(base + '/admin')
    # Corrupt or obsolete preferences never request unbounded page sizes.
    page.evaluate("localStorage.setItem('admin-page-size-files', '999'); localStorage.setItem('admin-page-size-audit','oops')")
    page.reload()
    expect(page.locator('#shares-body tr')).to_have_count(20)
    expect(page.locator('#settings-dialog')).to_be_hidden()
    assert page.locator('.admin-settings').count() == 1
    assert page.locator('#admin-panel .admin-settings').count() == 0
    page.click('#admin-settings-btn')
    expect(page.locator('#settings-title')).to_be_focused()
    page.select_option('#files-page-size', '40')
    expect(page.locator('#shares-body tr')).to_have_count(40)
    page.select_option('#audit-page-size', '50')
    page.keyboard.press('Escape')
    expect(page.locator('#admin-settings-btn')).to_be_focused()
    page.reload()
    expect(page.locator('#shares-body tr')).to_have_count(40)
    page.click('#btn-next')
    expect(page.locator('#shares-body tr')).to_have_count(13)
    expect(page.locator('#page-info')).to_contain_text('第 2 / 2 页')
    expect(page.locator('#btn-next')).to_be_disabled()
    # Deletion/cleanup on another client can remove the current final page.
    state['total'] = 7
    page.click('#btn-refresh')
    expect(page.locator('#shares-body tr')).to_have_count(7)
    expect(page.locator('#page-info')).to_contain_text('第 1 / 1 页')
    state['total'] = 53
    page.click('#btn-refresh')
    expect(page.locator('#shares-body tr')).to_have_count(40)
    state['failed'] = True
    page.click('#btn-refresh')
    expect(page.locator('#shares-body')).to_contain_text('List unavailable')
    expect(page.locator('#btn-prev')).to_be_disabled()
    expect(page.locator('#btn-next')).to_be_disabled()
    state['failed'] = False
    page.click('#btn-refresh')
    expect(page.locator('#shares-body tr')).to_have_count(40)
    # A slower response from an earlier page-size choice cannot overwrite the latest one.
    page.click('#admin-settings-btn')
    state['hold'] = True
    page.select_option('#files-page-size', '10')
    expect(page.locator('#shares-body')).to_contain_text('加载')
    page.select_option('#files-page-size', '20')
    expect(page.locator('#shares-body tr')).to_have_count(20)
    assert pending
    pending.pop().fulfill(json={'total': 53, 'rows': files[:10]})
    page.wait_for_timeout(100)
    expect(page.locator('#shares-body tr')).to_have_count(20)
    # A blocked preference write is visible inside the dialog, while the current choice still works.
    page.evaluate("()=>{window.originalStorageSet=Storage.prototype.setItem; Storage.prototype.setItem=function(){throw new Error('blocked')}}")
    page.select_option('#files-page-size', '10')
    expect(page.locator('#preferences-error')).to_be_visible()
    expect(page.locator('#shares-body tr')).to_have_count(10)
    page.evaluate('()=>{Storage.prototype.setItem=window.originalStorageSet}')
    page.select_option('#files-page-size', '20')
    expect(page.locator('#preferences-error')).to_be_hidden()
    page.click('#settings-close')
    page.click('#admin-audit-tab')
    expect(page.locator('#audit-body tr')).to_have_count(50)
    page.click('#audit-next')
    expect(page.locator('#audit-page')).to_contain_text('第 2 / 3 页')
    page.click('#admin-settings-btn')
    page.select_option('#audit-page-size', '100')
    expect(page.locator('#audit-body tr')).to_have_count(100)
    page.click('#settings-close')
    expect(page.locator('#audit-page')).to_contain_text('第 1 / 2 页')
    page.click('#audit-next')
    expect(page.locator('#audit-body tr')).to_have_count(23)
    page.click('#audit-prev')
    assert not writes, writes  # Display preferences do not change server settings.

    for lang in ['zh', 'en']:
        if lang == 'en': page.click('#lang-btn')
        for theme in ['light', 'dark']:
            page.evaluate('(t)=>document.documentElement.dataset.theme=t', theme)
            for width in [320, 390, 1135]:
                page.set_viewport_size({'width': width, 'height': 844})
                for tab, pager, table in [('admin-files-tab', 'files-pager', 'shares-body'), ('admin-audit-tab', 'audit-pager', 'audit-body')]:
                    page.click('#' + tab)
                    page.locator('#' + table + ' tr').first.wait_for()
                    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
                    bar = page.locator('#' + pager)
                    assert bar.bounding_box()['y'] < page.locator('#' + table).bounding_box()['y']
                    # Scroll deep into a long list: the toolbar remains above rows and clickable.
                    bar.evaluate('(e)=>window.scrollTo(0, scrollY+e.getBoundingClientRect().top+400)')
                    page.wait_for_function('(selector)=>{const y=document.querySelector(selector).getBoundingClientRect().top;return y>=0 && y<=10}', arg='#' + pager)
                    assert 0 <= bar.bounding_box()['y'] <= 10, bar.bounding_box()
                    assert bar.evaluate('(e)=>{const b=e.getBoundingClientRect();return e.contains(document.elementFromPoint(b.x+b.width/2,b.y+4))}')
                    if lang == 'zh' and theme == 'dark' and width in [390, 1135]:
                        page.screenshot(path=f'.wrangler/layout-{pager}-{width}.png', animations='disabled')
                page.click('#admin-settings-btn')
                assert page.locator('#settings-dialog').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
                page.locator('#settings-close').focus()
                page.keyboard.press('Tab')
                assert page.evaluate("document.activeElement.closest('dialog')?.id==='settings-dialog'")
                if lang == 'zh' and theme == 'dark' and width in [390, 1135]:
                    page.screenshot(path=f'.wrangler/layout-settings-{width}.png', animations='disabled')
                page.keyboard.press('Escape')
                expect(page.locator('#admin-settings-btn')).to_be_focused()
    assert not errors, errors
    browser.close()
print('PASS admin layout: settings, persisted/invalid/unavailable preferences, both pagers, stale/failing/shrinking lists, sticky controls, focus, languages/themes and mobile widths')
