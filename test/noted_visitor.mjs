// Local emulator fixture: existing regression suites exercise the noted visitor tier.
export async function notedVisitor(mf, metadata = 'kv') {
  const response = await mf.dispatchFetch('http://localhost/api/config');
  const cookie = response.headers.get('set-cookie').split(';')[0];
  const id = decodeURIComponent(cookie.slice(cookie.indexOf('=') + 1)).split('.')[0];
  if (metadata === 'kv') await (await mf.getKVNamespace('fileKV')).put('v:' + id, 'regression fixture');
  else await (await mf.getD1Database('DB')).prepare('INSERT INTO visitor_notes (visitor_id,note) VALUES (?,?)').bind(id, 'regression fixture').run();
  return cookie;
}
