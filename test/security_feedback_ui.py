"""Isolated browser responses exercise public notices without production traffic."""
import sys, time, os
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from playwright.sync_api import sync_playwright, expect

base=sys.argv[1].rstrip('/')
with sync_playwright() as p:
    browser=p.chromium.launch()
    context=browser.new_context(viewport={'width':1280,'height':900})
    context.add_init_script("localStorage.setItem('lang','zh')")
    page=context.new_page(); errors=[]; calls=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    config={'fileBackend':'kv','maxFileSize':25000000,'fileUploadAvailable':True,'uploadsRemaining':5,'weeklyFileLimit':5,'uploadsResetAt':1800000000000,'allowPermanent':False,'allowUnlimited':False}
    state={'reason':'access_rule','status':403,'retry':None,'part':False,'batch':False,'allow':False}
    def rejection():
        now=int(time.time()*1000)+86400000 # client/server skew must not extend the wait
        return {'error':'security_unavailable' if state['status']==503 else 'security_blocked','message':'测试拦截','reason':state['reason'],'requestId':'test-request-001','serverTime':now,'retryAt':now+state['retry'] if state['retry'] else None}
    def api(route):
        path=urlparse(route.request.url).path
        if path=='/api/config':route.fulfill(json=config);return
        calls.append(path)
        if path.endswith('/abort'):route.fulfill(json={'ok':True});return
        if state['part'] and path=='/api/uploads/init':route.fulfill(json={'uploadId':'fixture','partSize':3,'parts':1});return
        if state['batch']:
            if path == '/api/batches/init':
                route.fulfill(status=201,json={'draft':'123456','id':'fixture-batch','slots':[],'draftUntil':int(time.time()*1000)+60000});return
            if path.endswith('/files/1') or path.endswith('/files/2') and state['allow']:
                route.fulfill(json={'staged':True});return
            if path.endswith('/complete') and state['allow']:
                route.fulfill(status=201,json={'code':'123456','kind':'file','fileCount':2,'size':6,'expireAt':None,'maxPickups':5});return
        route.fulfill(status=state['status'],json=rejection())
    page.route('**/api/**',api)
    page.goto(base+'/pickup')
    for box,char in zip(page.locator('.otp-box').all(),'123456'):box.fill(char)
    notice=page.locator('.security-feedback')
    expect(notice).to_be_visible();expect(notice).to_contain_text('当前网络')
    assert ''.join(page.locator('.otp-box').evaluate_all('(nodes)=>nodes.map(n=>n.value)'))=='123456'
    for reason in ('access_rule','region','rate_limit','service_unavailable'):
        state.update(reason=reason,status=503 if reason=='service_unavailable' else 429 if reason=='rate_limit' else 403)
        notice.get_by_role('button',name='重新尝试',exact=True).click()
        expect(notice).to_contain_text({'region':'当前访问地区','rate_limit':'操作较频繁','service_unavailable':'服务暂时不可用','access_rule':'当前网络'}[reason])
        for width in (1280,390,320):
            page.set_viewport_size({'width':width,'height':900})
            for theme in ('light','dark'):
                page.evaluate('(v)=>document.documentElement.dataset.theme=v',theme)
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
                if os.environ.get('UI_ARTIFACT_DIR') and reason=='access_rule' and width in (1280,390):
                    folder=Path(os.environ['UI_ARTIFACT_DIR']);folder.mkdir(parents=True,exist_ok=True)
                    page.screenshot(path=str(folder/f'security-pickup-{width}-{theme}.png'),full_page=True,animations='disabled')
        link=notice.locator('a[href^="mailto:"]');href=link.get_attribute('href')
        assert not link.get_attribute('target')
        body=parse_qs(urlparse(href).query)['body'][0]
        assert 'test-request-001' in body and '123456' not in body
    state.update(reason='rate_limit',status=429,retry=1600)
    notice.get_by_role('button',name='重新尝试',exact=True).click()
    expect(notice.locator('.security-feedback-actions button')).to_be_disabled()
    before=len(calls)
    page.wait_for_timeout(2100)
    expect(notice.locator('.security-feedback-actions button')).to_be_enabled()
    assert len(calls)==before,'countdown must not issue requests'
    page.click('#lang-btn');expect(notice).to_contain_text('Unable to pick up')
    page.click('#lang-btn');expect(notice).to_contain_text('暂时无法取件')
    page.evaluate("Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(new Error('denied'))},configurable:true});document.execCommand=()=>false")
    notice.get_by_role('button',name='复制邮箱',exact=True).click()
    expect(page.locator('.security-copy-dialog')).to_be_visible()
    expect(page.locator('.security-copy-dialog textarea')).to_have_value('iblykk@gmail.com')
    page.keyboard.press('Escape');expect(page.locator('.security-copy-dialog')).to_have_count(0)
    # XHR file upload must preserve security data; retry skips accepted batch items.
    state.update(reason='access_rule',status=403,retry=None,batch=True)
    calls.clear();page.goto(base+'/')
    page.set_input_files('#file-input',[{'name':'first.txt','mimeType':'text/plain','buffer':b'abc'},{'name':'second.txt','mimeType':'text/plain','buffer':b'abc'}])
    page.click('#btn-upload');expect(notice).to_be_visible()
    expect(page.locator('#results .result')).to_have_count(0)
    assert calls.count('/api/batches/123456/files/1')==1
    assert calls.count('/api/batches/123456/files/2')==1
    state['allow']=True
    notice.get_by_role('button',name='重新尝试',exact=True).click()
    expect(notice).to_be_hidden()
    expect(page.locator('#results .result')).to_have_count(1)
    expect(page.locator('#results')).to_contain_text('123456')
    assert calls.count('/api/batches/init')==1
    assert calls.count('/api/batches/123456/files/1')==1,'staged file must not be uploaded twice'
    assert calls.count('/api/batches/123456/files/2')==2
    # A multipart 503 stops immediately and releases the owned session.
    state.update(batch=False,part=True,status=503,reason='service_unavailable')
    config['fileBackend']='r2';calls.clear();page.reload()
    page.set_input_files('#file-input',{'name':'part.txt','mimeType':'text/plain','buffer':b'abc'})
    page.click('#btn-upload');expect(notice).to_contain_text('服务暂时不可用')
    page.wait_for_timeout(1200)
    assert calls.count('/api/uploads/fixture/parts/1')==1
    assert calls.count('/api/uploads/fixture/abort')==1
    assert '/api/uploads/fixture/complete' not in calls
    # Text remains in its input after a rejected submit.
    page.locator('.tab[data-tab="text"]').click();page.fill('#text-input','private text stays here')
    page.click('#btn-text');expect(notice).to_be_visible()
    expect(page.locator('#text-input')).to_have_value('private text stays here')
    # Real download negotiation and CSP: no mocked HTML or browser-side bypass.
    assert context.request.post(base+'/api/admin/login',data={'token':'security-test-only'}).status==200
    current=context.request.get(base+'/api/admin/security').json()
    assert context.request.post(base+'/api/admin/security',data={'action':'ban','configRevision':current['configRevision'],'ip':'192.0.2.90','scopes':['pickup'],'note':'private-download-fixture','minutes':0}).status==200
    download=context.new_page()
    download.on('pageerror',lambda e:errors.append(str(e)))
    download.set_extra_http_headers({'CF-Connecting-IP':'192.0.2.90'})
    response=download.goto(base+'/api/pickup/123456/download')
    assert response.status==403
    expect(download.locator('.security-feedback')).to_be_visible()
    expect(download.locator('.security-feedback')).to_contain_text('暂时无法下载')
    assert 'private-download-fixture' not in download.content()
    assert '123456' not in parse_qs(urlparse(download.locator('.security-feedback a').get_attribute('href')).query)['body'][0]
    expect(download.locator('.security-feedback-time')).to_be_hidden()
    download.click('#lang-btn');expect(download.locator('.security-feedback')).to_contain_text('Unable to download')
    if os.environ.get('UI_ARTIFACT_DIR'):
        download.screenshot(path=str(Path(os.environ['UI_ARTIFACT_DIR'])/'security-download.png'),full_page=True,animations='disabled')
    assert not errors,errors
    browser.close()
    print('PASS security feedback UI: reasons, themes, mobile, retry/skew, contact/copy, input preservation, multipart stop and batch deduplication')
