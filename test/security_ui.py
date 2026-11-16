import sys
from playwright.sync_api import sync_playwright, expect
base=sys.argv[1].rstrip('/')
with sync_playwright() as p:
 b=p.chromium.launch();context=b.new_context(viewport={'width':1440,'height':1000});context.add_init_script("localStorage.setItem('lang','zh')")
 page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 assert context.request.post(base+'/api/admin/login',data={'token':'security-test-only'}).status==200
 page.goto(base+'/admin');page.click('#admin-security-tab');expect(page.locator('#sec-add')).to_be_enabled()
 def action(name):return page.locator('#security-view').get_by_role('button',name=name,exact=True)
 def foot(name):return page.locator('#security-dialog .source-footer').get_by_role('button',name=name,exact=True)
 action('手动封禁').click();page.fill('#sec-ip','2001:db8::99');page.fill('#sec-note','UI fixture');foot('确认封禁').click()
 expect(page.locator('#security-dialog')).to_be_hidden();expect(page.locator('#sec-feedback')).to_have_text('记录已添加')
 assert any(r['ip']=='2001:db8::99' for r in context.request.get(base+'/api/admin/security').json()['bans'])
 page.fill('#sec-search','2001:db8::99');expect(page.locator('#sec-export')).to_be_disabled();action('筛选').click();expect(page.locator('.sec-table tbody tr')).to_have_count(1)
 page.locator('.sec-row-actions').get_by_role('button',name='解封',exact=True).click();foot('确认解封').click();expect(page.locator('#sec-list')).to_contain_text('没有匹配')
 action('重置').click();action('防护规则').click();page.fill('#sec-threshold','4');foot('保存规则').click();expect(page.locator('#security-dialog')).to_be_hidden();assert context.request.get(base+'/api/admin/security').json()['rules']['login']['limit']==4
 # A failed write leaves the rule dialog open and does not claim success.
 action('防护规则').click();page.route('**/api/admin/security',lambda r:r.fulfill(status=503,json={'message':'Storage unavailable'}) if r.request.method=='POST' else r.continue_())
 foot('保存规则').click();expect(page.locator('#sec-form-error')).to_have_text('Storage unavailable');expect(page.locator('#sec-feedback')).to_be_hidden();foot('取消').click();page.unroute('**/api/admin/security')
 for theme in ['dark','light']:
  page.evaluate('(v)=>document.documentElement.dataset.theme=v',theme)
  for width in [1440,1024,390,320]:
   page.set_viewport_size({'width':width,'height':1000});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
   action('地区封禁').click();action('添加地区').click();expect(page.locator('#sec-scope-login')).to_be_disabled();assert page.locator('#security-dialog').evaluate('(n)=>n.scrollWidth<=n.clientWidth+1');foot('取消').click()
 page.set_viewport_size({'width':1440,'height':1000});page.screenshot(path='.wrangler/security-production.png')
 with context.expect_page() as popup:page.locator('.topbar a[data-i18n="nav.send"]').click()
 send=popup.value;send.wait_for_load_state();expect(send.locator('.upload-context')).to_have_attribute('open','');expect(send.locator('.ui-footer-contact a')).to_have_text('联系站长');expect(send.locator('.ui-footer-contact a')).to_have_attribute('href','mailto:iblykk@gmail.com');send.close()
 assert not errors,errors;b.close()
print('PASS real security UI: persisted actions, write failures, scope controls, themes, mobile and public entry')
