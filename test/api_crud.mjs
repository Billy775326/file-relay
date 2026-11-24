import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as miniflare from 'miniflare';
const schema=(await readFile('schema/schema.sql','utf8')).replace(/--[^\n]*/g,'').split(';').map(v=>v.trim()).filter(Boolean);
const KEY='external-script-test-only-key',ADMIN='local-admin-test-only';
for(const mode of ['kv-only','kv-r2','kv-d1','d1-r2','d1-only']){
 const hasKV=mode.startsWith('kv'),hasR2=mode.endsWith('r2'),hasD1=mode.includes('d1');
 const options={cf:{},modules:true,scriptPath:'dist/worker.js',compatibilityDate:'2025-06-01',kvNamespaces:hasKV?['fileKV']:[],r2Buckets:hasR2?['BUCKET']:[],d1Databases:hasD1?['DB']:[],bindings:{ADMIN_TOKEN:ADMIN,API_TOKEN:KEY,PART_SIZE:'5242880'}};
 const mf=new miniflare.Miniflare(miniflare.convertV4MiniflareOptions?.(options)??options);
 try{
  const db=hasD1?await mf.getD1Database('DB'):null;
  if(db)for(const sql of schema)await db.prepare(sql).run();
  const call=(path,{token=KEY,ip='203.0.113.10',json,cf={country:'CN',region:'Zhejiang',regionCode:'ZJ',city:'Hangzhou'},...rest}={})=>mf.dispatchFetch('http://localhost'+path,{cf,...rest,headers:{'CF-Connecting-IP':ip,...(token!==null?{Authorization:'Bearer '+token}:{}),...(json!==undefined?{'Content-Type':'application/json'}:{}),...rest.headers},...(json!==undefined?{body:JSON.stringify(json)}:{})});
  const post=(path,json,extra={})=>call(path,{method:'POST',json,...extra});
  const auth=await post('/api/admin/login',{token:ADMIN},{token:null});assert.equal(auth.status,200);
  const cookie=auth.headers.get('set-cookie').split(';')[0];
  const admin=(path,extra={})=>call('/api/admin'+path,{token:null,...extra,headers:{Cookie:cookie,...extra.headers}});
  const security=async()=>{const r=await admin('/security');assert.equal(r.status,200);return r.json();};
  const change=async(action,data={})=>{const before=await security();const r=await admin('/security',{method:'POST',json:{action,configRevision:before.configRevision,...data}});assert.equal(r.status,200,await r.clone().text());};
  if(hasD1||hasR2){const rules=(await security()).rules;rules.upload.enabled=false;await change('rules',{rules});}
  let failedClient=100;
  for(const [token,headers] of [[null,{}],[ADMIN,{}],[null,{Cookie:cookie}],[null,{Authorization:'Basic '+KEY}],[null,{Authorization:'Bearer '+KEY+' extra'}]]){
   assert.equal((await call('/api/v1/shares',{token,ip:'192.0.2.'+(failedClient++),headers})).status,401);
  }
  assert.equal((await call('/api/v1/shares?token='+KEY,{token:null,ip:'192.0.2.240'})).status,401);
  assert.equal((await call('/api/admin/shares')).status,401,'API key does not grant admin-cookie endpoints');
  assert.equal((await call('/api/v1/shares',{headers:{Origin:'https://other.example'}})).status,403);
  const config=await (await call('/api/v1/config')).json();
  assert.equal(config.allowPermanent,true);assert.equal(config.allowUnlimited,true);assert.equal(config.weeklyFileLimit,null);
  assert.equal((await post('/api/v1/shares',{text:'wrong fields',expiry:'1d',maxPickups:5,source:{ip:'1.1.1.1'}})).status,400);
  const original='private-api-text-do-not-audit';
  const create=await post('/api/v1/shares',{text:original,expiry:'forever',maxPickups:null,description:'private-api-description'});
  assert.equal(create.status,201,await create.clone().text());assert.equal(create.headers.get('Set-Cookie'),null,'script identity needs no browser cookie');
  const code=(await create.json()).code;
  const get=()=>call('/api/v1/shares/'+code);
  let detail=await get();assert.equal(detail.status,200);const initial=await detail.json();let etag=detail.headers.get('ETag');
  assert.equal(initial.kind,'text');assert.equal(initial.text,original);assert.equal(initial.pickupCount,0);
  for(const field of ['source','r2Key','ip','userAgent'])assert.ok(!(field in initial));
  assert.equal((await get()).status,200);assert.equal((await (await get()).json()).pickupCount,0);
  const head=await call('/api/v1/shares/'+code,{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');
  assert.equal((await call('/api/v1/shares/'+code,{headers:{'If-None-Match':etag}})).status,304);
  const patch=(json,extra={})=>call('/api/v1/shares/'+code,{method:'PATCH',json,headers:{'If-Match':etag},...extra});
  assert.equal((await patch({text:'replacement'},{headers:{}})).status,428);
  assert.equal((await patch({text:'replacement'},{headers:{'If-Match':'"stale"'}})).status,412);
  for(const body of [{},{id:'tampered'},{source:{}},{filename:'wrong-kind'},{text:''},{text:'a'.repeat(65537)},{maxPickups:0},{pickupCount:-1},{expireAt:'tomorrow'}])assert.equal((await patch(body)).status,400,JSON.stringify(body).slice(0,100));
  assert.equal((await call('/api/v1/shares/'+code,{method:'PATCH',body:'{}',headers:{'If-Match':etag,'Content-Type':'text/plain'}})).status,415);
  assert.equal((await patch({text:'a'.repeat(1_048_576)})).status,413);
  const updated=await patch({text:'edited private text',pickupCount:2,maxPickups:8,expireAt:null});assert.equal(updated.status,200,await updated.clone().text());
  const changed=await updated.json();assert.equal(changed.text,'edited private text');assert.equal(changed.size,19);assert.equal(changed.id,initial.id);assert.equal(changed.createdAt,initial.createdAt);
  const changedEtag=updated.headers.get('ETag');assert.notEqual(changedEtag,etag);
  assert.equal((await patch({pickupCount:0})).status,412);
  const publicPick=await post('/api/pickup',{code},{token:null});assert.equal(publicPick.status,200);
  etag=changedEtag;assert.equal((await patch({pickupCount:0})).status,412,'public pickups invalidate a stale edit');
  etag=(await get()).headers.get('ETag');
  assert.equal((await patch({maxPickups:9})).status,200);
  if(hasD1&&!hasKV){
   const base=(await get()).headers.get('ETag');
   const edits=await Promise.all(['parallel-a','parallel-b'].map(text=>call('/api/v1/shares/'+code,{method:'PATCH',headers:{'If-Match':base},json:{text}})));
   assert.equal(edits.filter(r=>r.status===200).length,1,'D1 concurrent patches must not overwrite each other');
   assert.ok(edits.every(r=>[200,409,412].includes(r.status)));
  }
  const listed=await call('/api/v1/shares?kind=text&status=active&q='+code+'&limit=1&offset=0');assert.equal(listed.status,200);
  const list=await listed.json();assert.equal(list.total,1);assert.equal(list.rows.length,1);assert.equal(list.rows[0].code,code);assert.ok(!('source' in list.rows[0]));
  for(const query of ['limit=101','limit=0','limit=1.2','offset=-1','kind=bad','status=bad','q='+'a'.repeat(81)])assert.equal((await call('/api/v1/shares?'+query)).status,400,query);
  for(const path of ['/api/v1/shares/bad','/api/v1/shares/999999'])assert.equal((await call(path)).status,path.endsWith('bad')?400:404);
  let fileCode,session;
  if(hasR2){
   const init=await post('/api/v1/uploads/init',{filename:'api-fixture.txt',size:3,expiry:'forever',maxPickups:null});assert.equal(init.status,200,await init.clone().text());session=(await init.json()).uploadId;
   const part=await call('/api/v1/uploads/'+session+'/parts/1',{method:'PUT',body:'abc',ip:'203.0.113.11'});assert.equal(part.status,200,await part.clone().text());
   assert.equal((await call('/api/uploads/'+session+'/parts/1',{token:KEY,method:'PUT',body:'abc',ip:'203.0.113.11'})).status,403,'raw public routes do not trust API Token without API authentication');
   const complete=await post('/api/v1/uploads/'+session+'/complete',{parts:[await part.json()]},{ip:'203.0.113.12'});assert.equal(complete.status,200,await complete.clone().text());fileCode=(await complete.json()).code;
   const cancel=(await (await post('/api/v1/uploads/init',{filename:'cancel.txt',size:3,expiry:'1d',maxPickups:1})).json()).uploadId;
   assert.equal((await post('/api/v1/uploads/'+cancel+'/abort',{})).status,200);assert.equal((await post('/api/v1/uploads/'+cancel+'/abort',{})).status,200);
   const large=await post('/api/v1/uploads/init',{filename:'reserved',size:9_900_000_000,expiry:'1d',maxPickups:1});assert.equal(large.status,200);
   const largeSession=(await large.json()).uploadId;
   assert.equal((await post('/api/v1/uploads/init',{filename:'exceeds-capacity',size:100_000_000,expiry:'1d',maxPickups:1})).status,507,'API privileges do not bypass the bucket cap');
   assert.equal((await post('/api/v1/uploads/'+largeSession+'/abort',{})).status,200);
   const huge=await post('/api/v1/uploads/init',{filename:'oversize',size:9_900_000_001,expiry:'1d',maxPickups:1});assert.equal(huge.status,413);
  }else if(hasKV){
   const file=await call('/api/v1/shares/file?filename=api-fixture.txt&expiry=forever',{method:'POST',body:'abc'});assert.equal(file.status,201,await file.clone().text());fileCode=(await file.json()).code;
   const large=await call('/api/v1/shares/file?filename=bigger-than-json.bin&expiry=1d&maxPickups=5',{method:'POST',body:new Uint8Array(2*1024*1024)});assert.equal(large.status,201,'binary direct upload is not limited by the JSON cap');
   const largeCode=(await large.json()).code;assert.equal((await call('/api/v1/shares/'+largeCode,{method:'DELETE'})).status,200);
  }
  if(fileCode){
   let file=await call('/api/v1/shares/'+fileCode);const fileEtag=file.headers.get('ETag');
   const rename=await call('/api/v1/shares/'+fileCode,{method:'PATCH',headers:{'If-Match':fileEtag},json:{filename:'renamed-api-file.txt',expireAt:Date.now()-1000}});assert.equal(rename.status,200,await rename.clone().text());
   const download=await call('/api/v1/shares/'+fileCode+'/download');assert.equal(download.status,200);assert.equal(await download.text(),'abc');assert.match(download.headers.get('Content-Disposition'),/renamed-api-file/);
   const afterFile=await (await call('/api/v1/shares/'+fileCode)).json();assert.equal(afterFile.pickupCount,0);assert.equal(afterFile.status,'expired');
   assert.equal((await post('/api/pickup',{code:fileCode},{token:null})).status,410);
   const beforeDelete=await admin('/shares/'+fileCode);assert.equal(beforeDelete.status,200);assert.equal((await beforeDelete.json()).filename,'renamed-api-file.txt');
   assert.equal((await call('/api/v1/shares/'+fileCode,{method:'DELETE'})).status,200);assert.equal((await call('/api/v1/shares/'+fileCode)).status,404);
   assert.deepEqual(await (await call('/api/v1/shares/'+fileCode,{method:'DELETE'})).json(),{ok:true,already:true});
   if(hasR2){const ledger=await (await (await mf.getR2Bucket('BUCKET')).get('__file-relay/quota-v1.json')).json();assert.deepEqual(ledger.files,{});}
  }
  if(hasR2||hasD1){
   const logs=await admin('/audit-logs?limit=1000');assert.equal(logs.status,200);const rows=(await logs.json()).rows;
   assert.ok(rows.some(e=>e.category==='upload'&&e.actor==='token'&&e.target===code));
   for(const action of ['apiAuth','apiList','apiRead','apiEdit'])assert.ok(rows.some(e=>e.action===action),action);
   const saved=JSON.stringify(rows);for(const secret of [KEY,ADMIN,original,'edited private text','private-api-description',session].filter(Boolean))assert.ok(!saved.includes(secret),'private values never appear in audit');
   await change('ban',{ip:'192.0.2.55',scopes:['upload'],minutes:60,note:'fixture'});
   assert.equal((await post('/api/v1/shares',{text:'blocked',expiry:'1d',maxPickups:5},{ip:'192.0.2.55'})).status,403);
   assert.equal((await call('/api/v1/shares',{ip:'192.0.2.55'})).status,200,'upload scope does not block private management');
   await change('region',{rule:{country:'US',region:'',scopes:['upload'],enabled:true,reason:'fixture',until:null}});
   assert.equal((await post('/api/v1/shares',{text:'geo blocked',expiry:'1d',maxPickups:5},{ip:'192.0.2.56',cf:{country:'US'}})).status,403);
   const rules=(await security()).rules;rules.login.limit=2;await change('rules',{rules});
   assert.equal((await call('/api/v1/shares',{token:'wrong',ip:'192.0.2.90'})).status,401);
   assert.equal((await call('/api/v1/shares',{token:'wrong',ip:'192.0.2.90'})).status,429);
   assert.equal((await call('/api/v1/shares',{ip:'192.0.2.90'})).status,429,'known API key does not bypass an active login-scope ban');
  }
  if(hasR2||hasD1){
   const key='__file-relay/audit-v1.json',bucket=hasR2?await mf.getR2Bucket('BUCKET'):null;
   const saved=bucket?await (await bucket.get(key)).text():(await db.prepare('SELECT value FROM app_settings WHERE key=?').bind(key).first()).value;
   if(bucket)await bucket.put(key,'{"invalid":true}');else await db.prepare('UPDATE app_settings SET value=? WHERE key=?').bind('{"invalid":true}',key).run();
   const read=await get();assert.equal(read.status,200);assert.equal(read.headers.get('X-Audit-Status'),'unavailable');
   const write=await call('/api/v1/shares/'+code,{method:'PATCH',headers:{'If-Match':read.headers.get('ETag')},json:{maxPickups:10}});
   assert.equal(write.status,200);assert.equal(write.headers.get('X-Audit-Status'),'unavailable');assert.equal((await write.json()).maxPickups,10);
   if(bucket)await bucket.put(key,saved);else await db.prepare('UPDATE app_settings SET value=? WHERE key=?').bind(saved,key).run();
  }
  assert.equal((await call('/api/v1/shares/'+code,{method:'DELETE'})).status,200);assert.equal((await get()).status,404);
  const rotated={...options,bindings:{...options.bindings,API_TOKEN:'rotated-script-test-only-key'}};
  await mf.setOptions(miniflare.convertV4MiniflareOptions?.(rotated)??rotated);
  assert.equal((await call('/api/v1/shares',{ip:'203.0.113.200'})).status,401);
  assert.equal((await call('/api/v1/shares',{ip:'203.0.113.201',token:'rotated-script-test-only-key'})).status,200);
  const disabled={...options,bindings:{...options.bindings,API_TOKEN:''}};
  await mf.setOptions(miniflare.convertV4MiniflareOptions?.(disabled)??disabled);
  assert.equal((await call('/api/v1/shares')).status,503,'unset token explicitly disables API');
  assert.equal((await call('/api/admin/stats',{token:null,headers:{Cookie:cookie}})).status,200,'browser admin remains available');
  console.log('PASS script CRUD '+mode+': independent auth, create/read/patch/delete, optimistic edits, binary upload/download, private metadata, protection and audit');
 }finally{await mf.dispose();}
}
