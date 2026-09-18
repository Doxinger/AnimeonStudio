import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

const html = `<!doctype html><html><body>
<header><a href="/user/Katyusha" class="avatar">Катюша</a></header>
<main>
  <div id="chat">
    <div data-msg-id="m1">
      <div class="min-w-0"><a href="/user/Katyusha">Катюша</a></div>
    </div>
    <div data-msg-id="m2">
      <div class="min-w-0"><a href="/user/other">Другой</a></div>
    </div>
    <div data-msg-id="m3">
      <div class="min-w-0"><a href="/user/BOSS">Босс</a></div>
    </div>
  </div>
</main>
</body></html>`;

const dom = new JSDOM(html, {
  url: 'https://animeon.cc/anime/x/watch',
  pretendToBeVisual: true,
  runScripts: 'outside-only'
});

const w = dom.window;
const failures = [];
const check = (name, ok, extra) => {
  console.log((ok ? 'ok  ' : 'FAIL') + ' ' + name + (ok || extra === undefined ? '' : ' → ' + extra));
  if (!ok) failures.push(name);
};
const tick = (ms = 60) => new Promise((r) => setTimeout(r, ms));

w.document.elementFromPoint = () => w.document.body;
w.eval(readFileSync('dist/bundles/shared.js', 'utf8'));
w.eval(readFileSync('dist/bundles/content.js', 'utf8'));
const A = w.AONC;

const SUPPORTERS = ['katyusha', 'boss'];
let requests = 0;
A.api.sendMessage = function (msg) {
  if (msg && msg.type === A.messaging.TYPE.SUPPORTER_LIST) {
    requests++;
    return Promise.resolve({ ok: true, value: SUPPORTERS });
  }
  if (msg && msg.type === A.messaging.TYPE.SUPPORTER_REFRESH) {
    return Promise.resolve({ ok: true, value: SUPPORTERS });
  }
  return Promise.resolve({ ok: true });
};

await tick(120);
A.content.tweaks.supporter.apply(A.content.config.current());
await tick(250);

const MARK = 'data-aonc-supporter';
const link1 = w.document.querySelector('[data-msg-id="m1"] a');
const link2 = w.document.querySelector('[data-msg-id="m2"] a');
const link3 = w.document.querySelector('[data-msg-id="m3"] a');

const badge1 = link1.nextElementSibling;
check('значок у ника-мецената в чате', !!badge1 && badge1.hasAttribute(MARK));
check('значок — иконка расширения', !!badge1 && !!badge1.querySelector('img') && /icon-32\.png$/.test(badge1.querySelector('img').getAttribute('src') || ''),
  badge1 && badge1.querySelector('img') ? badge1.querySelector('img').getAttribute('src') : 'no img');
badge1.dispatchEvent(new w.MouseEvent('mouseover', { bubbles: true }));
const tipNode = w.document.getElementById('aonc-supporter-tip');
check('тултип-пилюля появляется при наведении', !!tipNode && tipNode.style.display === 'flex' && tipNode.getAttribute('data-show') === '1');
check('тултип: ник + текст поддержки', !!tipNode && tipNode.textContent === 'Катюша поддержал(а) разработку AnimeonStudio и получил уникальный значок', tipNode && tipNode.textContent);
check('тултип поверх всех слоёв сайта', /z-index:2147483647/.test((w.document.getElementById('aonc-supporter-css') || { textContent: '' }).textContent));
badge1.dispatchEvent(new w.MouseEvent('mouseout', { bubbles: true, relatedTarget: w.document.body }));
check('тултип скрывается по mouseout', !!tipNode && tipNode.style.display === 'none');
check('бейдж выше абсолютных оверлеев сайта', /\.aonc-supporter-badge\{position:relative;z-index:5/.test((w.document.getElementById('aonc-supporter-css') || { textContent: '' }).textContent));
check('у постороннего ника значка нет', link2.nextElementSibling === null || !link2.nextElementSibling.hasAttribute(MARK));
check('регистронезависимый матч (BOSS)', !!link3.nextElementSibling && link3.nextElementSibling.hasAttribute(MARK));
check('имя бейджа регистронезависимо (как отображается)', !!link3.nextElementSibling && link3.nextElementSibling.getAttribute('data-aonc-sup-name') === 'Босс',
  link3.nextElementSibling && link3.nextElementSibling.getAttribute('data-aonc-sup-name'));

check('стили анимации внедрены', !!w.document.getElementById('aonc-supporter-css'));
const supCss = (w.document.getElementById('aonc-supporter-css') || { textContent: '' }).textContent;
check('кейфреймы pop/glow/shine на месте', /aonc-sup-pop/.test(supCss) && /aonc-sup-glow/.test(supCss) && /aonc-sup-shine/.test(supCss));
check('бейдж участвует в сайтовой паузе offscreen', !!badge1 && badge1.className.indexOf('aon-pause-offscreen') !== -1, badge1 && badge1.className);
check('у бейджа своя фаза блика', !!badge1 && /^-\d+\.\d{2}s$/.test(badge1.style.getPropertyValue('--aonc-sup-d')), badge1 && badge1.style.getPropertyValue('--aonc-sup-d'));
check('no-motion и prefers-reduced-motion гасят анимацию', /aonc-no-motion .aonc-supporter-badge/.test(supCss) && /prefers-reduced-motion/.test(supCss));

const removed = link1.nextElementSibling;
if (removed && removed.parentNode) removed.parentNode.removeChild(removed);
await tick(600);
check('значок восстанавливается после сноса', !!link1.nextElementSibling && link1.nextElementSibling.hasAttribute(MARK));
check('дубликат не ставится', w.document.querySelectorAll('[data-msg-id="m1"] [' + MARK + ']').length === 1);

// Страница чужого профиля: h1 + хендл @ник
const profDom = new JSDOM(`<!doctype html><html><body><div class="min-h-screen">
  <div class="container"><h1>Katyusha</h1><p>@katyusha</p></div>
  <a href="/user/katyusha" id="ctl"><button data-slot="button"><span class="truncate">Как видят другие</span></button></a>
  <div data-msg-id="p1"><div class="min-w-0"><a href="/user/katyusha">Katyusha</a></div></div>
</div></body></html>`, { url: 'https://animeon.cc/user/katyusha', pretendToBeVisual: true, runScripts: 'outside-only' });
const pw = profDom.window;
pw.document.elementFromPoint = () => pw.document.body;
pw.eval(readFileSync('dist/bundles/shared.js', 'utf8'));
pw.eval(readFileSync('dist/bundles/content.js', 'utf8'));
const PA = pw.AONC;
PA.api.sendMessage = function (msg) {
  if (msg && msg.type === PA.messaging.TYPE.SUPPORTER_LIST) return Promise.resolve({ ok: true, value: SUPPORTERS });
  return Promise.resolve({ ok: true });
};
await tick(120);
PA.content.tweaks.supporter.apply(PA.content.config.current());
await tick(250);
const h1 = pw.document.querySelector('.min-h-screen h1');
check('значок у заголовка чужого профиля', !!h1.querySelector('[' + MARK + ']'));
check('имя бейджа на профиле из заголовка', !!h1.querySelector('[' + MARK + ']') && h1.querySelector('[' + MARK + ']').getAttribute('data-aonc-sup-name') === 'Katyusha',
  h1.querySelector('[' + MARK + ']') && h1.querySelector('[' + MARK + ']').getAttribute('data-aonc-sup-name'));
const ctlLink = pw.document.querySelector('#ctl');
check('ссылка-обёртка кнопки значок не получает', !(ctlLink.nextElementSibling && ctlLink.nextElementSibling.hasAttribute(MARK))
  && !ctlLink.querySelector('[' + MARK + ']'));
check('значок у ссылок в main на профиле', !!pw.document.querySelector('[data-msg-id="p1"] a').nextElementSibling
  && pw.document.querySelector('[data-msg-id="p1"] a').nextElementSibling.hasAttribute(MARK));

// Свой профиль /profile: ник берётся из шапки (detectOwn)
const ownDom = new JSDOM(`<!doctype html><html><body>
<header><a href="/user/Katyusha" class="avatar">Катюша</a></header>
<div class="min-h-screen"><div class="container"><h1>Катюша</h1><p>@katyusha</p></div></div>
</body></html>`, { url: 'https://animeon.cc/profile', pretendToBeVisual: true, runScripts: 'outside-only' });
const ow = ownDom.window;
ow.document.elementFromPoint = () => ow.document.body;
ow.eval(readFileSync('dist/bundles/shared.js', 'utf8'));
ow.eval(readFileSync('dist/bundles/content.js', 'utf8'));
const OA = ow.AONC;
OA.api.sendMessage = function (msg) {
  if (msg && msg.type === OA.messaging.TYPE.SUPPORTER_LIST) return Promise.resolve({ ok: true, value: SUPPORTERS });
  return Promise.resolve({ ok: true });
};
await tick(120);
OA.content.tweaks.supporter.apply(OA.content.config.current());
await tick(250);
const ownH1 = ow.document.querySelector('.min-h-screen h1');
check('значок на своём профиле /profile', !!ownH1.querySelector('[' + MARK + ']'));
check('шапка сайта значок не получает', ow.document.querySelectorAll('header [' + MARK + ']').length === 0);

// Не-меценат на странице профиля: значка нет
const strangerDom = new JSDOM(`<!doctype html><html><body><div class="min-h-screen">
  <div class="container"><h1>Stranger</h1><p>@stranger</p></div>
</div></body></html>`, { url: 'https://animeon.cc/user/stranger', pretendToBeVisual: true, runScripts: 'outside-only' });
const sw = strangerDom.window;
sw.document.elementFromPoint = () => sw.document.body;
sw.eval(readFileSync('dist/bundles/shared.js', 'utf8'));
sw.eval(readFileSync('dist/bundles/content.js', 'utf8'));
const SA = sw.AONC;
SA.api.sendMessage = function (msg) {
  if (msg && msg.type === SA.messaging.TYPE.SUPPORTER_LIST) return Promise.resolve({ ok: true, value: SUPPORTERS });
  return Promise.resolve({ ok: true });
};
await tick(120);
SA.content.tweaks.supporter.apply(SA.content.config.current());
await tick(250);
check('у постороннего профиля значка нет', sw.document.querySelectorAll('[' + MARK + ']').length === 0);

// reset снимает всё
A.content.tweaks.supporter.reset();
await tick(80);
check('reset снимает значки', w.document.querySelectorAll('[' + MARK + ']').length === 0);

// Сценарий reload: фон «спал» на первом запросе — ретрай с бэкоффом возвращает значок
const retryDom = new JSDOM(html, { url: 'https://animeon.cc/anime/x/watch', pretendToBeVisual: true, runScripts: 'outside-only' });
const rw = retryDom.window;
rw.document.elementFromPoint = () => rw.document.body;
rw.eval(readFileSync('dist/bundles/shared.js', 'utf8'));
rw.eval(readFileSync('dist/bundles/content.js', 'utf8'));
const RA = rw.AONC;
let listCalls = 0;
RA.api.sendMessage = function (msg) {
  if (msg && msg.type === RA.messaging.TYPE.SUPPORTER_LIST) {
    listCalls++;
    if (listCalls === 1) return Promise.resolve({ ok: false, error: 'background asleep' });
    return Promise.resolve({ ok: true, value: SUPPORTERS });
  }
  return Promise.resolve({ ok: true });
};
// авто-старт контента сам вызовет apply при eval бандла — как на реальном reload
await tick(200);
check('после сбоя запроса значков нет (1 запрос)', rw.document.querySelectorAll('[' + MARK + ']').length === 0 && listCalls === 1, 'calls=' + listCalls + ' badges=' + rw.document.querySelectorAll('[' + MARK + ']').length);
await tick(1700);
const retryLink = rw.document.querySelector('[data-msg-id="m1"] a');
check('ретрай с бэкоффом вернул значок', listCalls >= 2 && !!retryLink.nextElementSibling && retryLink.nextElementSibling.hasAttribute(MARK), 'calls=' + listCalls);

// Сценарий reload 2: сервис-воркер фона спал — канал сообщения вернул undefined
// (runtime.lastError «Receiving end does not exist»), а не {ok:false}. Раньше
// это трактовалось как «пустой список», ретрай не назначался, и значок пропадал
// до перезахода на страницу (баг «при обновлении /profile иногда нет значка»).
const sleepDom = new JSDOM(html, { url: 'https://animeon.cc/anime/x/watch', pretendToBeVisual: true, runScripts: 'outside-only' });
const slw = sleepDom.window;
slw.document.elementFromPoint = () => slw.document.body;
slw.eval(readFileSync('dist/bundles/shared.js', 'utf8'));
slw.eval(readFileSync('dist/bundles/content.js', 'utf8'));
const SLA = slw.AONC;
let sleepCalls = 0;
SLA.api.sendMessage = function (msg) {
  if (msg && msg.type === SLA.messaging.TYPE.SUPPORTER_LIST) {
    sleepCalls++;
    if (sleepCalls === 1) return Promise.resolve(undefined); // канал оборван: SW спал
    return Promise.resolve({ ok: true, value: SUPPORTERS });
  }
  if (msg && msg.type === SLA.messaging.TYPE.SUPPORTER_REFRESH) {
    return Promise.resolve({ ok: true, value: SUPPORTERS });
  }
  return Promise.resolve({ ok: true });
};
await tick(200);
check('undefined-ответ не считается пустым списком: назначен ретрай', slw.document.querySelectorAll('[' + MARK + ']').length === 0 && sleepCalls === 1, 'calls=' + sleepCalls + ' badges=' + slw.document.querySelectorAll('[' + MARK + ']').length);
await tick(1700);
const sleepLink = slw.document.querySelector('[data-msg-id="m1"] a');
check('ретрай после «спящего» фона (undefined) вернул значок', sleepCalls >= 2 && !!sleepLink.nextElementSibling && sleepLink.nextElementSibling.hasAttribute(MARK), 'calls=' + sleepCalls);

// Сбойный запрос не должен затирать уже загруженный список ников
SLA.api.sendMessage = function (msg) {
  if (msg && (msg.type === SLA.messaging.TYPE.SUPPORTER_LIST || msg.type === SLA.messaging.TYPE.SUPPORTER_REFRESH)) return Promise.resolve(undefined);
  return Promise.resolve({ ok: true });
};
const kept = await SLA.content.tweaks.supporter.requestSupporters(false);
await tick(80);
check('сбойный запрос не стирает загруженный список', Array.isArray(kept) && kept.length === SUPPORTERS.length && !!sleepLink.nextElementSibling && sleepLink.nextElementSibling.hasAttribute(MARK));

// Сторож: фон завис и не отвечает вовсе (сетевая «чёрная дыра» до таймаута
// fetch). state.loading не должен застревать — после сторожа ретрай возвращает значок.
const hangDom = new JSDOM(html, { url: 'https://animeon.cc/anime/x/watch', pretendToBeVisual: true, runScripts: 'outside-only' });
const hw = hangDom.window;
hw.document.elementFromPoint = () => hw.document.body;
hw.eval(readFileSync('dist/bundles/shared.js', 'utf8'));
hw.eval(readFileSync('dist/bundles/content.js', 'utf8'));
const HA = hw.AONC;
let hangCalls = 0;
HA.api.sendMessage = function (msg) {
  if (msg && msg.type === HA.messaging.TYPE.SUPPORTER_LIST) {
    hangCalls++;
    if (hangCalls === 1) return new Promise(function () {}); // не отвечает никогда
    return Promise.resolve({ ok: true, value: SUPPORTERS });
  }
  return Promise.resolve({ ok: true });
};
HA.content.tweaks.supporter.setWatchdogMs(250);
await tick(200);
check('сторож: зависший запрос ещё не задублирован', hangCalls === 1 && hw.document.querySelectorAll('[' + MARK + ']').length === 0, 'calls=' + hangCalls);
await tick(1900); // сторож 250мс → ретрай через 1200мс
const hangLink = hw.document.querySelector('[data-msg-id="m1"] a');
check('сторож: зависание разблокировано, значок вернулся', hangCalls >= 2 && !!hangLink.nextElementSibling && hangLink.nextElementSibling.hasAttribute(MARK), 'calls=' + hangCalls);

// Парсер donate.txt: ссылки /user/ник, голые ники, комментарии, дубли
const vm = (await import('node:vm')).default;
const bgSandbox = vm.createContext({ console, setTimeout, clearTimeout, AbortController: globalThis.AbortController });
vm.runInContext(readFileSync('dist/bundles/shared.js', 'utf8'), bgSandbox, { filename: 'shared.bg.js' });
vm.runInContext(readFileSync('src/background/supporter.js', 'utf8'), bgSandbox, { filename: 'background.supporter.js' });
const parsed = bgSandbox.AONC.background.supporter.parseNicks(
  'https://animeon.cc/user/ErrorNetwork\n# комментарий\nboss\n\nBOSS\nkatyusha'
);
check('парсер donate.txt: URL, ники, комментарии, дубли',
  JSON.stringify(parsed) === JSON.stringify(['errornetwork', 'boss', 'katyusha']), JSON.stringify(parsed));

// Фоновый fetchText: висящий fetch прерывается по таймауту (AbortController),
// иначе обработчик SUPPORTER_LIST вечно держит канал сообщения открытым.
bgSandbox.fetch = function (url, opts) {
  return new Promise(function (resolve, reject) {
    if (opts && opts.signal) opts.signal.addEventListener('abort', function () { reject(new Error('aborted')); });
  });
};
const t0 = Date.now();
let abortSeen = false;
try {
  await bgSandbox.AONC.background.supporter.fetchText('https://example.invalid/donate.txt', 60);
} catch (e) {
  abortSeen = /abort/i.test(String((e && e.message) || e));
}
check('фоновый fetchText прерывается по таймауту', abortSeen && Date.now() - t0 < 2000, (Date.now() - t0) + 'ms');

w.close(); pw.close(); ow.close(); sw.close(); rw.close(); slw.close(); hw.close();
if (failures.length) {
  console.log('TEST SUPPORTER FAIL:', failures.join(', '));
  process.exit(1);
}
console.log('TEST SUPPORTER: OK (' + requests + ' запросов списка)');
process.exit(0);
