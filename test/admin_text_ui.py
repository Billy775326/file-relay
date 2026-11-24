import sys
from playwright.sync_api import sync_playwright, expect

base, code = sys.argv[1].rstrip('/'), sys.argv[2]
with sync_playwright() as p:
    browser = p.chromium.launch()
    context = browser.new_context(viewport={'width': 1280, 'height': 900}, timezone_id='Asia/Shanghai')
    context.add_init_script("""localStorage.setItem('lang','zh');
      Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.copiedAdminText=text}}});""")
    assert context.request.post(base + '/api/admin/login', data={'token': 'admin-text-test-only'}).status == 200
    def detail():
        r = context.request.get(base + '/api/admin/shares/' + code)
        assert r.status == 200
        return r.json()
    original = detail()['text']
    page = context.new_page()
    errors, pickup_requests = [], []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('request', lambda r: pickup_requests.append(r.url) if '/api/pickup' in r.url else None)
    page.goto(base + '/admin')
    row = page.locator('#shares-body tr').filter(has=page.locator('td', has_text=code))
    row.locator('.file-detail-link').click()
    expect(page.locator('#file-title')).to_have_text('文本详情')
    expect(page.locator('.text-share-body')).to_have_text(original)
    assert page.locator('.text-share-body script').count() == 0
    assert page.evaluate('window.textInjected') is None
    expect(page.locator('#file-download')).to_be_hidden()
    expect(page.locator('#text-copy')).to_be_visible()
    expect(page.locator('#file-detail')).not_to_contain_text('暂时无法确认')
    page.locator('#text-copy').click()
    assert page.evaluate('window.copiedAdminText') == original
    assert detail()['pickupCount'] == 0
    # Source identity remains separate and navigation returns to the same text share.
    page.locator('#file-detail .file-source-link').click()
    expect(page.locator('#source-dialog')).to_be_visible()
    expect(page.locator('#file-dialog')).not_to_be_visible()
    expect(page.locator('#source-back')).to_have_text('返回文本')
    page.locator('#source-back').click()
    expect(page.locator('#file-title')).to_have_text('文本详情')
    for theme in ['dark', 'light']:
        page.evaluate('(v)=>document.documentElement.dataset.theme=v', theme)
        for width, height in [(1280, 900), (600, 800), (390, 844), (320, 640)]:
            page.set_viewport_size({'width': width, 'height': height})
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
            assert page.locator('#file-dialog').evaluate('(n)=>n.scrollWidth<=n.clientWidth+1')
            assert page.locator('.text-share-body').evaluate('(n)=>getComputedStyle(n).whiteSpace === "pre-wrap" && n.scrollHeight > n.clientHeight')
            if width in [1280, 390]:
                page.screenshot(path=f'.wrangler/admin-text-{theme}-{width}.png')
    page.locator('#file-edit').click()
    expect(page.locator('#share-edit-text')).to_have_value(original)
    assert page.locator('#share-edit-text').get_attribute('maxlength') == '65536'
    for theme in ['dark', 'light']:
        page.evaluate('(v)=>document.documentElement.dataset.theme=v', theme)
        for width in [1280, 600, 390, 320]:
            page.set_viewport_size({'width': width, 'height': 800})
            assert page.locator('#file-dialog').evaluate('(n)=>n.scrollWidth<=n.clientWidth+1')
            assert page.locator('#share-edit-text').evaluate('(n)=>n.getBoundingClientRect().right<=document.querySelector("#file-dialog").getBoundingClientRect().right')
        if theme == 'light':
            page.set_viewport_size({'width': 390, 'height': 844})
            page.screenshot(path='.wrangler/admin-text-edit-light-390.png')
    page.locator('#share-edit-text').fill(' \n ')
    page.get_by_role('button', name='保存修改', exact=True).click()
    expect(page.locator('#share-edit-error')).to_contain_text('正文不能为空')
    edited = '管理修改后的正文\n  保留缩进与换行\n<script>window.textInjected=true</script>'
    page.locator('#share-edit-text').fill(edited)
    expect(page.locator('#share-edit-text-count')).to_contain_text(str(len(edited)))
    page.locator('#share-edit-count').fill('2')
    page.check('#share-edit-unlimited')
    page.check('#share-edit-permanent')
    page.get_by_role('button', name='保存修改', exact=True).click()
    expect(page.locator('#file-editor')).to_be_hidden()
    expect(page.locator('.text-share-body')).to_have_text(edited)
    saved = detail()
    assert saved['text'] == edited and saved['size'] == len(edited)
    assert saved['pickupCount'] == 2 and saved['maxPickups'] is None and saved['expireAt'] is None
    expect(row.locator('.file-detail-link')).to_contain_text(edited[:10])
    page.locator('#file-edit').click()
    page.locator('#share-edit-text').fill('unsaved changes')
    page.get_by_role('button', name='取消', exact=True).click()
    expect(page.locator('.text-share-body')).to_have_text(edited)
    assert detail()['text'] == edited
    page.locator('#file-edit').click()
    page.route('**/api/admin/shares/' + code, lambda r: r.fulfill(status=503, json={'message': 'Write unavailable'}) if r.request.method == 'PUT' else r.continue_())
    page.locator('#share-edit-text').fill('keep this draft')
    page.get_by_role('button', name='保存修改', exact=True).click()
    expect(page.locator('#share-edit-error')).to_have_text('Write unavailable')
    expect(page.locator('#share-edit-text')).to_have_value('keep this draft')
    page.unroute('**/api/admin/shares/' + code)
    # A concurrent text edit alone must invalidate the admin's snapshot.
    concurrent = {key: saved[key] for key in ['id', 'pickupCount', 'maxPickups', 'expireAt', 'version']}
    response = context.request.put(base + '/api/admin/shares/' + code, data={
        'expected': concurrent, 'rules': {key: saved[key] for key in ['pickupCount', 'maxPickups', 'expireAt', 'status']},
        'text': 'Changed in another tab'})
    assert response.status == 200
    page.get_by_role('button', name='保存修改', exact=True).click()
    expect(page.locator('#share-edit-error')).to_contain_text('记录已被取件或修改')
    expect(page.locator('#share-edit-text')).to_have_value('keep this draft')
    page.get_by_role('button', name='放弃修改并重新加载', exact=True).click()
    expect(page.locator('.text-share-body')).to_have_text('Changed in another tab')
    page.locator('#file-close').click()
    # A late response cannot repopulate the closed dialog or expose a stale copy action.
    delayed = []
    page.route('**/api/admin/shares/' + code, lambda r: delayed.append(r))
    row.locator('.file-detail-link').click()
    expect(page.locator('#file-detail')).to_have_text('加载中…')
    page.locator('#file-close').click()
    assert delayed
    delayed.pop().fulfill(status=200, json=detail())
    page.unroute('**/api/admin/shares/' + code)
    expect(page.locator('#file-dialog')).not_to_be_visible()
    expect(page.locator('#file-detail')).to_be_empty()
    expect(page.locator('#text-copy')).to_be_hidden()
    page.locator('#lang-btn').click()
    row.locator('.file-detail-link').click()
    expect(page.locator('#file-title')).to_have_text('Text details')
    expect(page.locator('#text-copy')).to_have_text('Copy all text')
    page.locator('#file-edit').click()
    expect(page.locator('#share-edit-form')).to_contain_text('Content')
    assert not errors, errors
    assert not pickup_requests, pickup_requests
    browser.close()
print('PASS admin text UI: safe full text, copy, sources, inline editing, cancel, failed drafts, conflicts, stale responses, languages, themes and 320–1280px')
