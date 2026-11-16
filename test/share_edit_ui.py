import sys
from datetime import datetime, timezone
from playwright.sync_api import sync_playwright, expect

base=sys.argv[1].rstrip('/')
with sync_playwright() as p:
    browser=p.chromium.launch()
    context=browser.new_context(viewport={'width':1280,'height':900},timezone_id='Asia/Shanghai')
    context.add_init_script("localStorage.setItem('lang','zh')")
    assert context.request.post(base+'/api/admin/login',data={'token':'edit-test-only'}).status==200
    page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(base+'/admin')
    row=page.locator('#shares-body tr').filter(has=page.locator('td',has_text='500010'))
    row.locator('.file-detail-link').click()
    edit=page.locator('#file-edit');expect(edit).to_be_visible()
    def begin():
        edit.click();expect(page.locator('#share-edit-form')).to_be_visible()
    def save():
        page.locator('#share-edit-form').get_by_role('button',name='保存修改',exact=True).click()
        expect(page.locator('#file-editor')).to_be_hidden()
        expect(edit).to_be_visible()
    def detail():return context.request.get(base+'/api/admin/shares/500010').json()
    begin();page.select_option('#share-edit-status','expired');save()
    assert detail()['status']=='expired'
    assert context.request.get(base+'/api/pickup/500010/download').status==410
    begin();page.select_option('#share-edit-status','exhausted')
    expect(page.locator('#share-edit-count')).to_have_value('5')
    expect(page.locator('.share-edit-linked')).to_contain_text('过期时间')
    page.select_option('#share-edit-status','active')
    assert page.input_value('#share-edit-expiry')
    page.fill('#share-edit-count','4');page.fill('#share-edit-limit','4')
    expect(page.locator('#share-edit-status')).to_have_value('exhausted')
    save();assert detail()['status']=='exhausted'
    begin();page.select_option('#share-edit-status','active')
    expect(page.locator('#share-edit-limit')).to_have_value('5')
    page.check('#share-edit-unlimited');page.check('#share-edit-permanent');save()
    current=detail();assert current['maxPickups'] is None and current['expireAt'] is None and current['pickupCount']==4
    begin();page.fill('#share-edit-count','0');page.select_option('#share-edit-status','exhausted')
    expect(page.locator('#share-edit-count')).to_have_value('1')
    expect(page.locator('#share-edit-limit')).to_have_value('1')
    expect(page.locator('#share-edit-unlimited')).not_to_be_checked()
    page.locator('#share-edit-form').get_by_role('button',name='取消',exact=True).click();expect(edit).to_be_visible()
    # Stored UTC instant follows the local-time control, not a UTC reinterpretation.
    begin();page.uncheck('#share-edit-permanent');page.fill('#share-edit-expiry','2035-06-10T14:30');save()
    assert detail()['expireAt']==int(datetime(2035,6,10,6,30,tzinfo=timezone.utc).timestamp()*1000)
    begin()
    for theme in ['dark','light']:
        page.evaluate('(v)=>document.documentElement.dataset.theme=v',theme)
        for width in [1280,600,390,320]:
            page.set_viewport_size({'width':width,'height':900})
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
            assert page.locator('#file-dialog').evaluate('(n)=>n.scrollWidth<=n.clientWidth+1')
            assert page.locator('#share-edit-expiry').evaluate('(n)=>n.getBoundingClientRect().right<=document.querySelector("#file-dialog").getBoundingClientRect().right')
            if width in [1280,390]:page.screenshot(path=f'.wrangler/share-edit-{theme}-{width}.png')
    page.route('**/api/admin/shares/500010',lambda r:r.fulfill(status=503,json={'message':'Write unavailable'}) if r.request.method=='PUT' else r.continue_())
    page.fill('#share-edit-count','9');page.locator('#share-edit-form').get_by_role('button',name='保存修改',exact=True).click()
    expect(page.locator('#share-edit-error')).to_have_text('Write unavailable');expect(page.locator('#share-edit-count')).to_have_value('9')
    page.unroute('**/api/admin/shares/500010')
    page.locator('#share-edit-form').get_by_role('button',name='取消',exact=True).click();expect(edit).to_be_visible()
    begin();assert context.request.get(base+'/api/pickup/500010/download').status==200
    page.locator('#share-edit-form').get_by_role('button',name='保存修改',exact=True).click()
    expect(page.locator('#share-edit-error')).to_contain_text('记录已被取件或修改')
    page.locator('#share-edit-form').get_by_role('button',name='放弃修改并重新加载',exact=True).click();expect(edit).to_be_visible()
    begin();expect(page.locator('#share-edit-count')).to_have_value('5')
    page.locator('#share-edit-form').get_by_role('button',name='取消',exact=True).click();expect(edit).to_be_visible()
    page.click('#file-close');page.click('#lang-btn');row.locator('.file-detail-link').click();expect(edit).to_have_text('Edit share')
    edit.click();expect(page.locator('#share-edit-form')).to_contain_text('Pickup limit')
    assert not errors,errors
    browser.close()
print('PASS share edit UI: linked states, exact local time, persistence, cancel, conflicts, failed writes, languages, themes and narrow layouts')
