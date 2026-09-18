// e2e: плашка недоступности (контент) + страница-плашка + классификация зеркал.
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

const SHARED = readFileSync('dist/bundles/shared.js', 'utf8');
const CONTENT = readFileSync('dist/bundles/content.js', 'utf8');
const OFFLINE_JS = readFileSync('dist/offline/offline.js', 'utf8');
const OFFLINE_HTML_RAW = readFileSync('dist/offline/offline.html', 'utf8');
const OFFLINE_HTML = OFFLINE_HTML_RAW.replace(/<script[^>]*><\/script>/g, '');

const failures = [];
let passed = 0;

function check(name, ok, detail) {
  console.log((ok ? 'ok  ' : 'FAIL') + ' ' + name + (ok || !detail ? '' : ' → ' + detail));
  if (!ok) failures.push(name);
  else passed++;
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function baseWindow(dom, memory) {
  const w = dom.window;
  const mem = memory || {};
  w.chrome = {
    runtime: {
      id: 'test', lastError: null,
      getURL: (p) => 'chrome-extension://test/' + p,
      getManifest: () => ({ version: '1.0.0' }),
      sendMessage: (m, cb) => { const r = { ok: true, value: null }; if (cb) cb(r); return Promise.resolve(r); },
      onMessage: { addListener() {}, removeListener() {} }
    },
    storage: {
      local: {
        get: (k, cb) => {
          const keys = Array.isArray(k) ? k : (typeof k === 'string' ? [k] : (k && typeof k === 'object' ? Object.keys(k) : []));
          const r = {};
          keys.forEach((key) => { if (mem[key] !== undefined) r[key] = mem[key]; });
          if (cb) cb(r);
          return Promise.resolve(r);
        },
        set: (o, cb) => { Object.assign(mem, o); if (cb) cb(); return Promise.resolve(); },
        remove: (k, cb) => { (Array.isArray(k) ? k : [k]).forEach((key) => { delete mem[key]; }); if (cb) cb(); return Promise.resolve(); },
        clear: (cb) => { Object.keys(mem).forEach((key) => { delete mem[key]; }); if (cb) cb(); return Promise.resolve(); }
      },
      sync: { get: (k, cb) => { const r = {}; if (cb) cb(r); return Promise.resolve(r); }, set: (o, cb) => { if (cb) cb(); return Promise.resolve(); } },
      onChanged: { addListener() {}, removeListener() {} }
    },
    tabs: { query: (q, cb) => { if (cb) cb([]); return Promise.resolve([]); }, sendMessage: (i, m, cb) => { if (cb) cb(null); return Promise.resolve(null); } }
  };
  return w;
}

// --- 1. Классификация ошибок и тон плашки ----------------------------------
{
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://animeon.cc/', runScripts: 'outside-only' });
  const w = baseWindow(dom);
  w.eval(SHARED);
  const M = w.AONC.config.mirrors;

  check('dns → vpn', M.describe('net::ERR_NAME_NOT_RESOLVED').tone === 'vpn');
  check('firefox dns → vpn', M.describe('NS_ERROR_UNKNOWN_HOST').tone === 'vpn');
  check('offline → net', M.describe('net::ERR_INTERNET_DISCONNECTED').tone === 'net');
  check('cert → cert', M.describe('net::ERR_CERT_AUTHORITY_INVALID').tone === 'cert');
  check('server → server', M.describe('net::ERR_HTTP_RESPONSE_CODE_FAILURE').tone === 'server');
  check('abort игнорируется', M.describe('net::ERR_ABORTED').ignored === true);
  check('пусто → other', M.describe('').tone === 'other');

  check('mirrorUrl сохраняет путь', M.mirrorUrl('animeon.cc', 'https://animeon.cc/catalog?q=1#x') === 'https://v2.animeon.co/catalog?q=1#x',
    M.mirrorUrl('animeon.cc', 'https://animeon.cc/catalog?q=1#x'));
  check('mirrorUrl с v2 ведёт на v1', M.mirrorHost('v2.animeon.co') === 'animeon.cc');
  check('pick предпочитает живое рекомендуемое', M.pick([
    { host: 'v2.animeon.co', state: 'ok' }, { host: 'animeon.cc', state: 'down' }
  ], 'animeon.cc') === 'v2.animeon.co');
  check('pick при мёртвом v2 берёт живое', M.pick([
    { host: 'v2.animeon.co', state: 'down' }, { host: 'v1.animeon.co', state: 'ok' }
  ], 'animeon.cc') === 'v1.animeon.co');
  check('список покрывает HOSTS', w.AONC.HOSTS.every((h) => M.LIST.some((m) => m.host === h)));
}

// --- 2. Контент: эвристика пустой/заглушки + плашка -------------------------
async function contentCase(opts) {
  const o = opts || {};
  const dom = new JSDOM(o.html || '<!doctype html><html><head><title></title></head><body></body></html>', {
    url: o.url || 'https://animeon.cc/profile',
    runScripts: 'outside-only',
    pretendToBeVisual: true
  });
  const memory = {};
  if (o.config) memory['aonc.config.v1'] = o.config;
  const w = baseWindow(dom, memory);
  w.eval(SHARED);
  w.eval(CONTENT);
  return w;
}

const FAST_BANNER = { siteBanner: true, emptyPageMs: 15, minTextLength: 40, probe: false };
const CONF_BANNER = { meta: { enabled: true }, offline: FAST_BANNER };
const CONF_NO_BANNER = { meta: { enabled: true }, offline: { siteBanner: false, emptyPageMs: 15, minTextLength: 40, probe: false } };

{
  const stub = '<!doctype html><html><head><title>503 Service Unavailable</title></head><body>' +
    '<div>nginx: service temporarily unavailable. Cloudflare error 503. Request blocked.</div></body></html>';
  const w = await contentCase({ html: stub });
  const U = w.AONC.content.tweaks.unreachable;
  check('заглушка nginx+cloudflare ловится', U.looksBroken(40) === true);

  const normal = '<!doctype html><html><head><title>AnimeOn — профиль</title></head><body>' +
    '<nav><a href="/catalog">Каталог</a><a href="/teams">Команды</a></nav>' +
    '<main><img src="/a.png" alt=""><p>' + ('текст страницы '.repeat(20)) + '</p></main></body></html>';
  const w2 = await contentCase({ html: normal });
  check('нормальная страница не ловится', w2.AONC.content.tweaks.unreachable.looksBroken(40) === false);

  const empty = '<!doctype html><html><head><title>AnimeOn</title></head><body><div id="__next"></div></body></html>';
  const w3 = await contentCase({ html: empty });
  check('пустой корень SPA ловится', w3.AONC.content.tweaks.unreachable.looksBroken(40) === true);

  // apply() с выключенной плашкой не создаёт узлов
  const w4 = await contentCase({ html: stub, config: CONF_NO_BANNER });
  const U4 = w4.AONC.content.tweaks.unreachable;
  U4.apply(CONF_NO_BANNER);
  await sleep(450);
  check('siteBanner=false — плашки нет', w4.document.querySelectorAll('[data-aonc-unreachable]').length === 0);
  U4.reset();

  // apply() с включённой плашкой на заглушке — плашка появляется
  const w5 = await contentCase({ html: stub, config: CONF_BANNER });
  const U5 = w5.AONC.content.tweaks.unreachable;
  U5.apply(CONF_BANNER);
  await sleep(450);
  const host = w5.document.querySelector('[data-aonc-unreachable]');
  check('плашка появилась', !!host);
  const shadow = host && host.shadowRoot;
  const btns = shadow ? shadow.querySelectorAll('button') : [];
  check('кнопки: зеркало/зеркала/обновить/скрыть', btns.length >= 4, 'кнопок: ' + btns.length);
  const text = shadow ? shadow.textContent : '';
  check('текст советует VPN и зеркало', /VPN/.test(text) && /v2\.animeon\.co|зеркал/i.test(text));
  U5.reset();
  check('reset убирает плашку', w5.document.querySelectorAll('[data-aonc-unreachable]').length === 0);

  // dismiss через sessionStorage
  const w6 = await contentCase({ html: stub, config: CONF_BANNER });
  const U6 = w6.AONC.content.tweaks.unreachable;
  w6.sessionStorage.setItem('aonc.unreachable.dismissed', w6.location.href);
  U6.apply(CONF_BANNER);
  await sleep(450);
  check('dismissed — плашки нет', w6.document.querySelectorAll('[data-aonc-unreachable]').length === 0);
  U6.reset();
}

// --- 3. Рамки: маршрут /profile без хвостового слэша ------------------------
{
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://animeon.cc/profile', runScripts: 'outside-only' });
  const w = baseWindow(dom);
  w.eval(SHARED);
  w.eval(CONTENT);
  const T = w.AONC.content.framesTargets;
  check('/profile считается страницей профиля', T.onProfilePage() === true);

  const dom2 = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://animeon.cc/profile/6a84/edit', runScripts: 'outside-only' });
  const w2 = baseWindow(dom2); w2.eval(SHARED); w2.eval(CONTENT);
  check('/profile/… тоже', w2.AONC.content.framesTargets.onProfilePage() === true);

  const dom3 = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://animeon.cc/catalog', runScripts: 'outside-only' });
  const w3 = baseWindow(dom3); w3.eval(SHARED); w3.eval(CONTENT);
  check('/catalog — не профиль', w3.AONC.content.framesTargets.onProfilePage() === false);

  const dom4 = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://animeon.cc/user/errornetwork', runScripts: 'outside-only' });
  const w4 = baseWindow(dom4); w4.eval(SHARED); w4.eval(CONTENT);
  check('/user/errornetwork — профильная зона', w4.AONC.content.framesTargets.onProfilePage() === true);

  const css = w.AONC.content.framesCss.css();
  check('рамки не сжимаются preflight-ом', /img\[data-aonc-frame\][^}]*max-width:none !important/.test(css));
}

// --- 4. Страница-плашка offline.html ----------------------------------------
async function offlinePage(query) {
  const dom = new JSDOM(OFFLINE_HTML, {
    url: 'chrome-extension://test/offline/offline.html' + (query || ''),
    runScripts: 'outside-only',
    pretendToBeVisual: true
  });
  const w = baseWindow(dom);
  w.eval(SHARED);
  w.eval(OFFLINE_JS);
  await sleep(30);
  return w;
}

{
  const w = await offlinePage('?url=' + encodeURIComponent('https://animeon.cc/catalog?q=1') + '&err=' + encodeURIComponent('net::ERR_NAME_NOT_RESOLVED') + '&kind=dns&src=webNavigation');
  const d = w.document;
  check('тон vpn: заголовок', /не открывается/i.test(d.getElementById('tone-title').textContent));
  check('иконка тона', d.getElementById('tone-ic').getAttribute('data-tone') === 'vpn');
  check('ошибка показана чипом', d.getElementById('err-chip').textContent.indexOf('ERR_NAME_NOT_RESOLVED') >= 0);
  check('исходный адрес показан', d.getElementById('orig-url').textContent === 'https://animeon.cc/catalog?q=1');
  check('кнопка перехода на зеркало', /v2\.animeon\.co/.test(d.getElementById('go-mirror-text').textContent), d.getElementById('go-mirror-text').textContent);
  const rows = d.querySelectorAll('#mirror-list .mrow');
  check('список зеркал из трёх', rows.length === 3, 'строк: ' + rows.length);
  const firstGo = rows[0] && rows[0].querySelector('.mgo');
  check('ссылки зеркал сохраняют путь', firstGo && firstGo.getAttribute('href') === 'https://v2.animeon.co/catalog?q=1', firstGo && firstGo.getAttribute('href'));
  check('тумблеры на месте', !!d.getElementById('opt-autopage') && !!d.getElementById('opt-probe'));
}

{
  const w = await offlinePage('?url=' + encodeURIComponent('https://evil.example.com/phishing') + '&kind=server');
  const d = w.document;
  check('чужой url отброшен', d.getElementById('orig-url').hidden === true && d.getElementById('retry').hidden === true);
  check('тон server', d.getElementById('tone-ic').getAttribute('data-tone') === 'server');
}

console.log('\n' + (failures.length ? 'FAILURES: ' + failures.join(', ') : 'unreachable/mirrors/offline: ' + passed + ' checks ok'));
process.exit(failures.length ? 1 : 0);
