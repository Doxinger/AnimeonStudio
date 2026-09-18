// Отладка: грузим НАСТОЯЩИЙ dist/popup/popup.html как в браузере
// (file://, runScripts dangerously, resources usable) со строгим стабом chrome.
import { JSDOM, VirtualConsole } from 'jsdom';
import { pathToFileURL } from 'node:url';

const htmlUrl = pathToFileURL(new URL('../dist/popup/popup.html', import.meta.url).pathname).href;

const vc = new VirtualConsole();
vc.on('jsdomError', (e) => console.log('[jsdomError]', e.message, '\n', (e.stack || '').split('\n').slice(0, 6).join('\n')));
vc.on('error', (...a) => console.log('[console.error]', ...a));
vc.on('warn', (...a) => console.log('[console.warn]', ...a));
vc.on('log', (...a) => console.log('[console.log]', ...a));
vc.on('info', (...a) => console.log('[console.info]', ...a));

function makeArea(memory) {
  return {
    get(keys, cb) {
      const out = {};
      const list = Array.isArray(keys) ? keys : (typeof keys === 'string' ? [keys] : (keys && typeof keys === 'object' ? Object.keys(keys) : []));
      list.forEach((k) => { if (memory[k] !== undefined) out[k] = memory[k]; });
      if (cb) cb(out);
      return Promise.resolve(out);
    },
    set(obj, cb) { Object.assign(memory, obj); if (cb) cb(); return Promise.resolve(); },
    remove(keys, cb) {
      (Array.isArray(keys) ? keys : [keys]).forEach((k) => { delete memory[k]; });
      if (cb) cb();
      return Promise.resolve();
    },
    clear(cb) { Object.keys(memory).forEach((k) => { delete memory[k]; }); if (cb) cb(); return Promise.resolve(); }
  };
}

const memory = {};
const dom = await JSDOM.fromURL(htmlUrl, {
  runScripts: 'dangerously',
  resources: 'usable',
  pretendToBeVisual: true,
  virtualConsole: vc,
  beforeParse(w) {
    const storageListeners = [];
    // СТРОГИЙ стаб: только то, что реально есть на extension-странице
    w.chrome = {
      runtime: {
        id: 'real-extension-id',
        lastError: null,
        getURL: (p) => 'chrome-extension://real/' + p,
        getManifest: () => ({ version: '1.0.0' }),
        sendMessage: (m, cb) => { const r = { ok: true }; if (cb) cb(r); return Promise.resolve(r); },
        onMessage: { addListener() {}, removeListener() {} },
        connect: () => ({ postMessage() {}, onMessage: { addListener() {} }, onDisconnect: { addListener() {} } }),
        openOptionsPage: (cb) => { if (cb) cb(); return Promise.resolve(); }
      },
      storage: {
        local: makeArea(memory),
        sync: makeArea({}),
        onChanged: { addListener: (fn) => storageListeners.push(fn), removeListener() {} }
      },
      tabs: {
        query: (q, cb) => { const r = [{ id: 1, url: 'https://animeon.cc/', title: 'AnimeOn' }]; if (cb) cb(r); return Promise.resolve(r); },
        sendMessage: (id, m, cb) => { const r = { pong: true, url: 'https://animeon.cc/', picker: false, modes: {} }; if (cb) cb(r); return Promise.resolve(r); },
        reload: () => {}, create: () => {}, update: () => {}
      },
      i18n: { getUILanguage: () => 'ru' },
      action: { setBadgeText() {}, setBadgeBackgroundColor() {} },
      windows: { create: () => {} }
    };
  }
});

await new Promise((r) => setTimeout(r, 1200));
const w = dom.window;
const d = w.document;
console.log('---');
console.log('body class:', d.body && d.body.className);
console.log('readyState:', d.readyState);
console.log('AONC?', !!w.AONC, w.AONC && Object.keys(w.AONC).slice(0, 12).join(','));
console.log('A.ui?', !!(w.AONC && w.AONC.ui), 'state?', !!(w.AONC && w.AONC.ui && w.AONC.ui.state));
const presets = d.getElementById('presets');
console.log('presets children:', presets && presets.children.length);
const sliders = d.getElementById('sliders');
console.log('sliders children:', sliders && sliders.children.length);
console.log('save-state text:', d.getElementById('save-state') && d.getElementById('save-state').textContent);
console.log('site-state text:', d.getElementById('site-state-text') && d.getElementById('site-state-text').textContent);
console.log('stylesheet loaded:', d.styleSheets.length, [...d.querySelectorAll('link[rel=stylesheet]')].map((l) => l.href + ' -> ' + (l.sheet ? 'OK' : 'FAIL')).join(' | '));
w.close();
