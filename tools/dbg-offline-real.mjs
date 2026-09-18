// Смоук: настоящая offline.html грузит ../bundles/shared.js и offline.js как в браузере.
import { JSDOM, VirtualConsole } from 'jsdom';
import { pathToFileURL } from 'node:url';
const vc = new VirtualConsole();
vc.on('jsdomError', (e) => console.log('[jsdomError]', e.message));
const url = pathToFileURL(new URL('../dist/offline/offline.html', import.meta.url).pathname).href
  + '?url=' + encodeURIComponent('https://animeon.cc/catalog?q=1') + '&err=' + encodeURIComponent('net::ERR_NAME_NOT_RESOLVED') + '&kind=dns&src=webNavigation';
const dom = await JSDOM.fromURL(url, {
  runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
  beforeParse(w) {
    w.chrome = {
      runtime: { id: 'real', lastError: null, getURL: (p) => 'chrome-extension://real/' + p, getManifest: () => ({ version: '1.0.0' }), sendMessage: (m, cb) => { const r = { ok: true }; if (cb) cb(r); return Promise.resolve(r); }, onMessage: { addListener() {}, removeListener() {} }, openOptionsPage: () => {} },
      storage: { local: { get: (k, cb) => { const r = {}; if (cb) cb(r); return Promise.resolve(r); }, set: (o, cb) => { if (cb) cb(); return Promise.resolve(); }, remove: (k, cb) => { if (cb) cb(); return Promise.resolve(); }, clear: (cb) => { if (cb) cb(); return Promise.resolve(); } }, sync: { get: (k, cb) => { const r = {}; if (cb) cb(r); return Promise.resolve(r); }, set: (o, cb) => { if (cb) cb(); return Promise.resolve(); } }, onChanged: { addListener() {}, removeListener() {} } },
      tabs: { query: (q, cb) => { if (cb) cb([]); return Promise.resolve([]); } }
    };
  }
});
await new Promise((r) => setTimeout(r, 900));
const d = dom.window.document;
console.log('title:', d.getElementById('tone-title').textContent);
console.log('go:', d.getElementById('go-mirror-text').textContent);
console.log('rows:', d.querySelectorAll('#mirror-list .mrow').length);
console.log('orig:', d.getElementById('orig-url').textContent);
process.exit(0);
