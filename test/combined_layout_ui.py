"""Exercise the production modules against isolated Miniflare records, never live shares."""
import sys
from playwright.sync_api import sync_playwright, expect

base=sys.argv[1].rstrip('/')
with sync_playwright() as p:
    browser=p.chromium.launch()
    context=browser.new_context(viewport={'width':1600,'height':1000})
    context.add_init_script("if(!localStorage.getItem('lang'))localStorage.setItem('lang','zh')")
    assert context.request.post(base+'/api/admin/login',data={'token':'filter-test-only'}).status==200
    page=context.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(base+'/admin')
    expect(page.locator('#shares-body tr')).to_have_count(9)
    expect(page.locator('.kv-storage-card')).to_contain_text('—')
    assert page.locator('.storage-overview .storage-card').count()==2
    assert page.locator('#files-refresh-slot #btn-refresh').count()==1
    expect(page.locator('#admin-security-tab')).to_be_visible()
    page.fill('#files-q','REPORT');page.locator('#files-filter button[type=submit]').click()
    expect(page.locator('#shares-body tr')).to_have_count(1)
    expect(page.locator('#shares-body')).to_contain_text('700007')
    page.fill('#files-q','');page.locator('#files-status-tabs [data-status=expired]').click()
    expect(page.locator('#shares-body')).to_contain_text('700006')
    page.locator('#files-status-tabs [data-status=exhausted]').click()
    expect(page.locator('#shares-body')).to_contain_text('700005')
    page.locator('#files-status-tabs [data-status=all]').click()
    page.select_option('#files-kind','text');expect(page.locator('#shares-body tr')).to_have_count(1)
    page.select_option('#files-kind','all');expect(page.locator('#shares-body tr')).to_have_count(9)
    # The toolbar and settings edit the same persisted preference.
    page.select_option('#files-page-size-toolbar','10')
    expect(page.locator('#files-page-size')).to_have_value('10')
    page.click('#admin-settings-btn');page.select_option('#files-page-size','20')
    expect(page.locator('#files-page-size-toolbar')).to_have_value('20')
    page.keyboard.press('Escape')
    expect(page.locator('#shares-body tr').first.locator('.share-filename')).to_have_attribute('title',__import__('re').compile('布局测试'))
    page.locator('#shares-body .file-detail-link').first.click()
    expect(page.locator('#file-dialog')).to_be_visible();expect(page.locator('#file-edit')).to_be_visible()
    page.click('#file-close');page.locator('#shares-body .source-link').first.click()
    expect(page.locator('#source-dialog')).to_be_visible();expect(page.locator('#source-note')).to_be_visible()
    page.keyboard.press('Escape')
    for lang in ['zh','en']:
      if lang=='en':page.click('#lang-btn')
      for theme in ['dark','light']:
        page.evaluate('(v)=>document.documentElement.dataset.theme=v',theme)
        for width in [1600,1135,768,390,320]:
          page.set_viewport_size({'width':width,'height':1000})
          assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),(lang,theme,width)
          assert page.locator('#files-q').evaluate('(n)=>n.getBoundingClientRect().right<=innerWidth'),(lang,theme,width)
          if lang=='zh' and width in [1600,390]:page.screenshot(path=f'.wrangler/combined-{theme}-{width}.png',full_page=True)
    page.set_viewport_size({'width':1440,'height':1000})
    page.click('#admin-audit-tab');expect(page.locator('#admin-audit-view')).to_be_visible()
    expect(page.locator('#audit-page-size-toolbar')).to_be_visible()
    page.click('#admin-security-tab');expect(page.locator('#security-view')).to_be_visible()
    expect(page.locator('#sec-add')).to_be_enabled()
    page.click('#admin-files-tab');expect(page.locator('#admin-files-view')).to_be_visible()
    # Missing metrics must never look like zero; real numeric data gains a meter.
    def metrics(route):
      response=route.fetch();data=response.json();data['kv']={'bound':True,'state':'available','usedBytes':4096,'keyCount':9,'sampleDate':'2026-11-17','freeQuotaBytes':1000000000,'quotaScope':'account'}
      route.fulfill(response=response,json=data)
    page.route('**/api/admin/stats',metrics);page.click('#btn-refresh')
    expect(page.locator('.kv-storage-card .storage-value')).to_contain_text('4.1 KB')
    expect(page.locator('.kv-storage-card meter')).to_have_attribute('value','4096')
    assert not errors,errors
    browser.close()
print('PASS combined UI: real modules, filters, shared preferences, dialogs, audit/security navigation, KV states, themes, languages and 320–1600px layouts')
