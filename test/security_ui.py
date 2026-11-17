import sys,time
from playwright.sync_api import sync_playwright, expect
base=sys.argv[1].rstrip('/')
with sync_playwright() as p:
 b=p.chromium.launch();context=b.new_context(viewport={'width':1440,'height':1000});context.add_init_script("localStorage.setItem('lang','zh')")
 page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 assert context.request.post(base+'/api/admin/login',data={'token':'security-test-only'}).status==200
 page.goto(base+'/admin');page.click('#admin-security-tab');expect(page.locator('#sec-add')).to_be_enabled()
 def action(name):return page.locator('#security-view').get_by_role('button',name=name,exact=True)
 def foot(name):return page.locator('#security-dialog .source-footer').get_by_role('button',name=name,exact=True)
 action('手动封禁').click();expect(page.locator('#sec-duration')).to_have_value('60');page.select_option('#sec-duration','10080');page.fill('#sec-ip','2001:db8::99');page.fill('#sec-note','UI fixture');foot('确认封禁').click()
 expect(page.locator('#security-dialog')).to_be_hidden();expect(page.locator('#sec-feedback')).to_have_text('记录已添加')
 saved=next(r for r in context.request.get(base+'/api/admin/security').json()['bans'] if r['ip']=='2001:db8::99');assert saved['until']-saved['at']==10080*60000
 page.fill('#sec-search','2001:db8::99');expect(page.locator('#sec-export')).to_be_disabled();action('筛选').click();expect(page.locator('.sec-table tbody tr')).to_have_count(1)
 page.locator('.sec-row-actions').get_by_role('button',name='解封',exact=True).click();foot('确认解封').click();expect(page.locator('#sec-list')).to_contain_text('没有匹配')
 action('重置').click();action('防护规则').click();page.fill('#sec-threshold','4');foot('保存规则').click();expect(page.locator('#security-dialog')).to_be_hidden();assert context.request.get(base+'/api/admin/security').json()['rules']['login']['limit']==4
 # A failed write leaves the rule dialog open and does not claim success.
 action('防护规则').click();page.route('**/api/admin/security',lambda r:r.fulfill(status=503,json={'message':'Storage unavailable'}) if r.request.method=='POST' else r.continue_())
 foot('保存规则').click();expect(page.locator('#sec-form-error')).to_have_text('Storage unavailable');expect(page.locator('#sec-feedback')).to_be_hidden();foot('取消').click();page.unroute('**/api/admin/security')
 # IP and region dialogs expose the same four choices; old region expiry remains unchanged.
 action('地区封禁').click();action('添加地区').click();expect(page.locator('#sec-region-duration')).to_have_value('0')
 page.fill('#sec-country','JP');page.fill('#sec-region','13');page.fill('#sec-region-reason','Region duration fixture')
 assert page.locator('#sec-region-duration option').evaluate_all('(nodes)=>nodes.map(n=>n.value)')==['60','1440','10080','0']
 page.select_option('#sec-region-duration','1440')
 started=int(time.time()*1000);foot('保存规则').click();expect(page.locator('#security-dialog')).to_be_hidden()
 saved=next(r for r in context.request.get(base+'/api/admin/security').json()['regions'] if r['reason']=='Region duration fixture')
 assert started+1440*60000<=saved['until']<=int(time.time()*1000)+1440*60000
 region_row=page.locator('.sec-table tbody tr').filter(has_text='Region duration fixture')
 region_row.get_by_role('button',name='编辑',exact=True).click();expect(page.locator('#sec-region-duration')).to_have_value('keep')
 page.fill('#sec-region-reason','Region duration edited');foot('保存规则').click();expect(page.locator('#security-dialog')).to_be_hidden()
 edited=next(r for r in context.request.get(base+'/api/admin/security').json()['regions'] if r['id']==saved['id']);assert edited['until']==saved['until']
 region_row=page.locator('.sec-table tbody tr').filter(has_text='Region duration edited')
 region_row.get_by_role('button',name='编辑',exact=True).click();page.select_option('#sec-region-duration','0');foot('保存规则').click();expect(page.locator('#security-dialog')).to_be_hidden()
 assert next(r for r in context.request.get(base+'/api/admin/security').json()['regions'] if r['id']==saved['id'])['until'] is None
 region_row.get_by_role('button',name='移除',exact=True).click();foot('移除').click();expect(page.locator('#security-dialog')).to_be_hidden()
 action('封禁 IP').click()
 for theme in ['dark','light']:
  page.evaluate('(v)=>document.documentElement.dataset.theme=v',theme)
  for width in [1440,1024,390,320]:
   page.set_viewport_size({'width':width,'height':1000});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
   action('封禁 IP').click();action('手动封禁').click()
   assert page.locator('#sec-duration option').evaluate_all('(nodes)=>nodes.map(n=>n.value)')==['60','1440','10080','0']
   assert page.locator('.sec-duration-custom,input[id*=duration-amount],select[id*=duration-unit]').count()==0
   assert page.locator('#security-dialog').evaluate('(n)=>n.scrollWidth<=n.clientWidth+1')
   if width in [1440,320]:page.locator('#security-dialog').screenshot(path=f'.wrangler/security-duration-simple-{theme}-{width}.png')
   foot('取消').click()
   action('防护规则').click()
   rules_dialog=page.locator('#security-dialog')
   assert rules_dialog.evaluate('(n)=>n.scrollWidth<=n.clientWidth+1')
   if width>600:
    boxes=[page.locator(selector).bounding_box() for selector in ['#sec-enabled','#sec-window','#sec-threshold','#sec-ban-minutes']]
    centers=[box['y']+box['height']/2 for box in boxes]
    assert max(centers)-min(centers)<3,centers
    assert rules_dialog.bounding_box()['height']<380
   page.locator('#sec-enabled-upload').uncheck()
   expect(page.locator('#sec-window-upload')).to_be_disabled()
   expect(page.locator('#sec-window-upload').locator('..').get_by_role('button').first).to_be_disabled()
   page.locator('#sec-enabled-upload').check()
   expect(page.locator('#sec-window-upload')).to_be_enabled()
   if width in [1440,390]:page.screenshot(path=f'.wrangler/security-rules-{theme}-{width}.png')
   foot('取消').click()
   action('地区封禁').click();action('添加地区').click();expect(page.locator('#sec-scope-login')).to_be_disabled();assert page.locator('#security-dialog').evaluate('(n)=>n.scrollWidth<=n.clientWidth+1');foot('取消').click()
 page.click('#lang-btn');action('Banned IPs').click();action('Ban IP').click()
 expect(page.locator('#sec-duration option[value="10080"]')).to_have_text('7 days')
 for width in [1440,320]:
  page.set_viewport_size({'width':width,'height':1000});assert page.locator('#security-dialog').evaluate('(n)=>n.scrollWidth<=n.clientWidth+1')
 foot('Cancel').click();page.click('#lang-btn')
 page.set_viewport_size({'width':1440,'height':1000});page.screenshot(path='.wrangler/security-production.png')
 with context.expect_page() as popup:page.locator('.topbar a[data-i18n="nav.send"]').click()
 send=popup.value;send.wait_for_load_state();expect(send.locator('.upload-context')).to_have_attribute('open','');expect(send.locator('.ui-footer-contact a')).to_have_text('联系站长');expect(send.locator('.ui-footer-contact a')).to_have_attribute('href','mailto:iblykk@gmail.com');send.close()
 assert not errors,errors;b.close()
print('PASS real security UI: four duration choices, no custom controls, finite and permanent bans, region expiry preservation, write failures, scope controls, themes, mobile and public entry')
