import assert from 'node:assert/strict';
import { versionAssets } from '../tools/asset-version.mjs';
const source={
 'index.html':'<link href="/style.css"><script type="module" src="/js/index.js"></script><a href="/pickup">Pick up</a>',
 'style.css':'body{color:black}',
 'js/index.js':"import { value } from './common.js';\nimport './vendor.js';\nconsole.log(value);",
 'js/common.js':'export const value=1;',
 'js/vendor.js':'export default 1;'
};
const a=versionAssets(source),b=versionAssets(Object.fromEntries(Object.entries(source).reverse()));
assert.deepEqual(a,b,'filesystem enumeration order must not change the build');
assert.match(a.revision,/^[a-f0-9]{16}$/);
assert.ok(a.files['index.html'].includes('/style.css?v='+a.revision));
assert.ok(a.files['index.html'].includes('/js/index.js?v='+a.revision));
assert.ok(a.files['index.html'].includes('href="/pickup"'));
assert.ok(a.files['js/index.js'].includes("from './common.js?v="+a.revision+"'"));
assert.ok(a.files['js/index.js'].includes("import './vendor.js?v="+a.revision+"'"));
const next=versionAssets({...source,'js/common.js':'export const value=2;'});
assert.notEqual(next.revision,a.revision,'a dependency change must invalidate the complete graph');
assert.ok(next.files['index.html'].includes('/style.css?v='+next.revision));
assert.equal(source['js/common.js'],'export const value=1;','source assets are not mutated');
console.log('PASS asset versions: stable build identity, HTML links, entry and dependency invalidation, side-effect imports and unchanged routes');
