import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import * as miniflare from 'miniflare';
const schema=(await readFile('schema/schema.sql','utf8')).replace(/--[^\n]*/g,'').split(';').map(s=>s.trim()).filter(Boolean);
for(const mode of ['kv-r2','d1','kv-only']){
 const opts={cf:{},modules:true,scriptPath:'dist/worker.js',compatibilityDate:'2025-06-01',kvNamespaces:mode.startsWith('kv')?['fileKV']:[],d1Databases:mode==='d1'?['DB']:[],r2Buckets:mode==='kv-r2'?['BUCKET']:[],bindings:{ADMIN_TOKEN:'security-test-only'}};
 const mf=new miniflare.Miniflare(miniflare.convertV4MiniflareOptions?.(opts)??opts);
 try{
  if(mode==='d1'){const db=await mf.getD1Database('DB');for(const sql of schema)await db.prepare(sql).run();}
  const call=(path,{ip='203.0.113.1',cookie,json,cf={country:'CN',regionCode:'ZJ'},...rest}={})=>mf.dispatchFetch('http://localhost'+path,{cf,...rest,headers:{'CF-Connecting-IP':ip,...(cookie?{Cookie:cookie}:{}),...(json!==undefined?{'Content-Type':'application/json'}:{}),...rest.headers},...(json!==undefined?{body:JSON.stringify(json)}:{})});
  const auth=await call('/api/admin/login',{method:'POST',json:{token:'security-test-only'}});assert.equal(auth.status,200);const cookie=auth.headers.get('set-cookie').split(';')[0];
  const state=async()=>{const r=await call('/api/admin/security',{cookie});assert.equal(r.status,200,await r.clone().text());return r.json();};
  const change=async(action,data={},extra={})=>call('/api/admin/security',{cookie,method:'POST',json:{action,configRevision:(await state()).configRevision,...data},...extra});
  assert.equal((await call('/api/admin/security')).status,401);
  assert.equal((await change('rules',{rules:(await state()).rules},{headers:{Origin:'https://other.test'}})).status,403);
  if(mode==='kv-only'){assert.equal((await state()).enabled,false);assert.equal((await change('ban',{ip:'192.0.2.2',scopes:['login'],note:'fixture',minutes:30})).status,503);continue;}
  assert.equal((await state()).enabled,true);
  for(const minutes of [-1,1.5,43201,'30'])assert.equal((await change('ban',{ip:'198.51.100.200',scopes:['upload'],note:'duration boundary fixture',minutes})).status,400);
  for(const minutes of [1,43200,0]){
   assert.equal((await change('ban',{ip:'198.51.100.200',scopes:['upload'],note:'duration boundary fixture',minutes})).status,200);
   const ban=(await state()).bans.find(b=>b.ip==='198.51.100.200');
   if(minutes)assert.equal(ban.until-ban.at,minutes*60000);else assert.equal(ban.until,null);
   assert.equal((await change('unban',{ips:['198.51.100.200']})).status,200);
  }
  const rules=(await state()).rules;rules.upload.limit=3;rules.pickup.limit=2;rules.login.limit=2;
  assert.equal((await change('rules',{rules})).status,200);
  assert.equal((await call('/api/admin/security',{cookie,method:'POST',json:{action:'rules',configRevision:'stale',rules}})).status,409);
  assert.equal((await change('ban',{ip:'010.0.0.1',scopes:['upload'],note:'fixture',minutes:30})).status,400);
  assert.equal((await change('ban',{ip:'192.0.2.2',scopes:['upload'],note:'fixture',minutes:30})).status,200);
  const blocked=await call('/api/shares/text',{ip:'192.0.2.2',method:'POST',json:{}});
  assert.equal(blocked.status,403);
  const blockedData=await blocked.json();
  assert.equal(blockedData.reason,'access_rule');assert.ok(blockedData.retryAt>blockedData.serverTime);
  assert.equal(blocked.headers.get('X-Request-ID'),blockedData.requestId);
  assert.match(blocked.headers.get('Retry-After'),/^\d+$/);assert.equal(blocked.headers.get('Cache-Control'),'no-store');
  assert.ok(!JSON.stringify(blockedData).includes('fixture'),'private admin notes never returned');
  assert.equal((await call('/api/pickup',{ip:'192.0.2.2',method:'POST',json:{code:'bad'}})).status,400);
  assert.equal((await change('allow',{ip:'192.0.2.2',scopes:['upload'],note:'fixture'})).status,200);
  assert.equal((await call('/api/shares/text',{ip:'192.0.2.2',method:'POST',json:{}})).status,403,'allow does not bypass manual ban');
  assert.equal((await change('unban',{ips:['192.0.2.2']})).status,200);
  for(let i=0;i<5;i++)assert.equal((await call('/api/shares/text',{ip:'192.0.2.2',method:'POST',json:{}})).status,400,'allow exempts only automatic limiter');
  const rule={country:'US',region:'',scopes:['upload','pickup'],enabled:true,reason:'fixture',until:null};
  assert.equal((await change('region',{rule:{...rule,scopes:['login']}})).status,400,'server rejects geographic login blocks');
  assert.equal((await change('region',{rule})).status,200);
  assert.equal((await call('/api/shares/text',{ip:'192.0.2.2',cf:{country:'US'},method:'POST',json:{}})).status,403,'allow does not bypass geography');
  const beforeTest=await state();
  const simulated=await call('/api/admin/security/test',{cookie,method:'POST',json:{ip:'192.0.2.2',scope:'pickup',country:'US',region:'',count:0}});
  assert.equal(simulated.status,200);assert.equal((await simulated.json()).blocked,true);
  assert.deepEqual(await state(),beforeTest,'rule testing does not change bans or configuration');
  assert.equal((await call('/api/admin/login',{cf:{country:'US'},method:'POST',json:{token:'security-test-only'}})).status,200);
  assert.equal((await call('/api/pickup/123456/download',{cf:{country:'US'}})).status,403,'direct download cannot bypass geography');
  const geo=await call('/api/pickup/123456/download',{cf:{country:'US'},headers:{Accept:'application/json'}});
  const geoData=await geo.json();assert.equal(geoData.reason,'region');assert.equal(geoData.retryAt,undefined);
  const html=await call('/api/pickup/123456/download',{cf:{country:'US'},headers:{Accept:'text/html'}});
  assert.equal(html.status,403);assert.match(html.headers.get('Content-Type'),/text\/html/);
  assert.equal(html.headers.get('Cache-Control'),'no-store');assert.ok(html.headers.get('Content-Security-Policy').includes("script-src 'self'"));
  const htmlBody=await html.text();assert.ok(htmlBody.includes('/js/security-download.js'));assert.ok(!htmlBody.includes('fixture'));
  const head=await call('/api/pickup/123456/download',{method:'HEAD',cf:{country:'US'},headers:{Accept:'text/html'}});
  assert.equal(head.status,403);assert.equal(await head.text(),'');
  assert.equal((await call('/api/shares/text',{ip:'192.0.2.2',cf:{country:'',regionCode:''},method:'POST',json:{}})).status,400,'unknown geo never guessed');
  for(let i=0;i<2;i++)assert.equal((await call('/api/shares/text',{ip:'192.0.2.3',method:'POST',json:{}})).status,400);
  const concurrent=await Promise.all(Array.from({length:4},()=>call('/api/shares/text',{ip:'192.0.2.3',method:'POST',json:{}})));
  assert.ok(concurrent.every(r=>r.status===429),await Promise.all(concurrent.map(r=>r.clone().text())));
  const limited=await concurrent[0].json();assert.equal(limited.reason,'rate_limit');assert.ok(limited.retryAt>limited.serverTime);
  assert.equal((await state()).bans.find(b=>b.ip==='192.0.2.3').failures,3);
  assert.equal((await call('/api/pickup',{ip:'192.0.2.4',method:'POST',json:{code:'wrong'}})).status,400);
  assert.equal((await call('/api/pickup/123456/download',{ip:'192.0.2.4'})).status,429,'invalid direct download shares pickup counter');
  assert.equal((await call('/api/admin/login',{ip:'192.0.2.5',method:'POST',json:{token:'bad'}})).status,401);
  assert.equal((await call('/api/admin/login',{ip:'192.0.2.5',method:'POST',json:{token:'bad'}})).status,429,'configured legacy login threshold');
  assert.equal((await state()).bans.find(b=>b.ip==='192.0.2.5').scopes[0],'login');
  assert.equal((await change('unban',{ips:['192.0.2.5']})).status,200);
  assert.equal((await call('/api/admin/login',{ip:'192.0.2.5',method:'POST',json:{token:'security-test-only'}})).status,200);
  // Batch unblocking must preserve unrelated failures in a configured longer window.
  const longer=(await state()).rules;longer.login.window=60;
  assert.equal((await change('rules',{rules:longer})).status,200);
  const at=Date.now()-20*60000;
  const entries=['192.0.2.60','192.0.2.61','192.0.2.62'].map(ip=>({ip,failures:1,failedAt:[at],firstFailedAt:at,lastFailedAt:at,bannedUntil:ip.endsWith('.62')?0:Date.now()+60000}));
  const legacyValue=JSON.stringify({version:1,revision:'batch-fixture',entries});
  if(mode==='kv-r2')await (await mf.getR2Bucket('BUCKET')).put('__file-relay/login-guard-v1.json',legacyValue);
  else await (await mf.getD1Database('DB')).prepare('UPDATE app_settings SET value=? WHERE key=?').bind(legacyValue,'__file-relay/login-guard-v1.json').run();
  assert.equal((await change('unban',{ips:['192.0.2.60','192.0.2.61']})).status,200);
  assert.equal((await call('/api/admin/login',{ip:'192.0.2.60',method:'POST',json:{token:'security-test-only'}})).status,200);
  assert.equal((await call('/api/admin/login',{ip:'192.0.2.61',method:'POST',json:{token:'security-test-only'}})).status,200);
  assert.equal((await call('/api/admin/login',{ip:'192.0.2.62',method:'POST',json:{token:'bad'}})).status,429,'batch unban retains unrelated long-window failures');
  const logs=await (await call('/api/admin/audit-logs?category=security&limit=1000',{cookie})).json();assert.ok(logs.rows.some(r=>r.action==='securityRules'));assert.ok(logs.rows.some(r=>r.action==='ban'&&r.detail.scope==='upload'));
  if(mode==='kv-r2'){
   const url=String(await mf.ready);
   await new Promise((resolve,reject)=>{const child=spawn('python',['test/security_ui.py',url],{stdio:'inherit'});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error('Security UI '+code)));});
   await new Promise((resolve,reject)=>{const child=spawn('python',['test/security_feedback_ui.py',url],{stdio:'inherit'});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error('Security feedback UI '+code)));});
  }
  const bucket=mode==='kv-r2'?await mf.getR2Bucket('BUCKET'):null,db=mode==='d1'?await mf.getD1Database('DB'):null;
  if(bucket)await bucket.put('__file-relay/security-v1.json','{}');else await db.prepare('UPDATE app_settings SET value=? WHERE key=?').bind('{}','__file-relay/security-v1.json').run();
  const unavailable=await call('/api/shares/text',{method:'POST',json:{}});
  assert.equal(unavailable.status,503,'corruption fails closed');assert.equal((await unavailable.json()).reason,'service_unavailable');
  console.log('PASS security '+mode+': persistence, scope, region, allow precedence, concurrency, auth, CSRF, revision, login compatibility, fail-closed');
 }finally{await mf.dispose();}
}
