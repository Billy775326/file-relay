"""Delay every interaction module: final, visible layout must precede script execution."""
import sys,re
from playwright.sync_api import sync_playwright,expect

base=sys.argv[1].rstrip('/')
with sync_playwright() as p:
 browser=p.chromium.launch()
 for path,kind in [('/', 'ui-send'),('/pickup','ui-pickup'),('/admin','ui-combined')]:
  for width in [1440,390,320]:
   context=browser.new_context(viewport={'width':width,'height':1000})
   context.add_init_script("localStorage.setItem('lang','zh');localStorage.setItem('theme','dark')")
   page=context.new_page();errors=[];requests=[];pending=[];gate={'hold':True}
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.on('request',lambda r:requests.append(r.url))
   def hold(route):
    if gate['hold']:pending.append(route)
    else:route.continue_()
   page.route('**/js/**',hold)
   try:
    page.goto(base+path,wait_until='commit')
    page.wait_for_function("document.querySelector('footer') && [...document.querySelectorAll('link[rel=stylesheet]')].every(n=>n.sheet)")
    expect(page.locator('html')).to_have_class(re.compile(kind))
    assert page.locator('.ui-header-band>.topbar').count()==1
    assert page.locator('.topbar').is_visible()
    assert page.evaluate('getComputedStyle(document.body).visibility==="visible" && getComputedStyle(document.body).opacity!=="0"')
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
    selectors=['.topbar']
    if path!='/admin':
     expect(page.locator('.ui-public-nav')).to_be_visible()
     expect(page.locator('.ui-footer-contact a')).to_have_attribute('href','mailto:iblykk@gmail.com')
     selectors+=['.ui-footer-inner']
    if path=='/':
     assert page.locator('.flow-strip,.feat-band').count()==0
     expect(page.locator('.upload-context')).to_have_attribute('open','')
     expect(page.locator('#upload-name')).to_be_visible()
     selectors+=['.form-card','.options']
    if path=='/pickup':
     expect(page.locator('#ui-query')).to_be_visible()
     expect(page.locator('#ui-clear')).to_be_visible()
     selectors+=['#pickup-input-card','.ui-pickup-actions']
    page.evaluate('window.scrollTo(0,0)')
    before={s:page.locator(s).bounding_box() for s in selectors}
    assert pending,'JS requests must still be blocked during the first-paint assertions'
    gate['hold']=False
    for route in pending:route.continue_()
    if path=='/admin':
     expect(page.locator('#admin-login')).to_be_visible()
     assert page.locator('main').bounding_box()['width']<=440
     page.click('#ui-token-toggle');expect(page.locator('#admin-token')).to_have_attribute('type','text')
     page.click('#lang-btn');expect(page.locator('#ui-token-toggle')).to_have_text('Hide')
    else:
     page.wait_for_selector('#ui-send-help-dialog',state='attached')
     if path=='/':page.wait_for_function("document.querySelector('#dz-hint').textContent.includes('9.9 GB')")
     for resource in requests:
      assert not any('/js/'+part in resource for part in ['admin','ui-audit-layout','ui-classifications']),resource
     # Compare layout before opening a dialog, which intentionally locks scrolling.
    page.evaluate('window.scrollTo(0,0)')
    for selector,old in before.items():
     new=page.locator(selector).bounding_box()
     for axis in ['x','y','width','height']:
      assert abs(old[axis]-new[axis])<=1,(path,width,selector,axis,old,new)
    assert not errors,errors
   except Exception:
    print('STARTUP FAILURE',path,width,errors,requests,flush=True)
    raise
   finally:
    gate['hold']=False
    context.close()
 # The QR library is a module now; sharing still renders an actual SVG and pickup still works.
 context=browser.new_context(viewport={'width':1280,'height':1000})
 context.add_init_script("localStorage.setItem('lang','zh')")
 page=context.new_page();page.goto(base+'/');page.wait_for_selector('#ui-send-help-dialog',state='attached')
 page.locator('[data-tab=text]').click();page.fill('#text-input','First-paint regression fixture')
 page.click('#btn-text');expect(page.locator('.qr-wrap svg')).to_be_visible()
 code=page.locator('.code').inner_text().replace('\n','').replace(' ','')
 page.goto(base+'/pickup?code='+code);expect(page.locator('#pickup-result')).to_contain_text('First-paint regression fixture')
 context.close();browser.close()
print('PASS first paint: delayed modules, visible final templates, stable geometry at 320–1440px, public dependency isolation, login, QR sharing and pickup')
