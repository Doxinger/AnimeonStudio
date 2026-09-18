// e2e титулов: запечённый каталог, нормализация API-формата, маппинг иконок и
// анимаций, рендер пилюли в ряду бейджей профиля (цвета/градиент/иконка/FX),
// множественная экипировка, самовосстановление после сноса, снятие.
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

const html = `<!doctype html><html><body>
<div class="min-h-screen bg-background overflow-x-hidden">
  <div class="container mx-auto px-3 max-w-5xl">
    <div class="flex items-center justify-center md:justify-start gap-2 flex-wrap pt-1.5" id="badges">
      <span class="existing">2</span>
      <a href="/cosmetics" id="cosmetics-link">17/80</a>
      <span id="reg-chip">С август 2026 г.</span>
    </div>
  </div>
</div>
</body></html>`;

const dom = new JSDOM(html, {
  url: 'https://animeon.cc/profile',
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
const lib = A.config.titlesLib;
const MARK = 'data-aonc-title';

A.api.sendMessage = function () { return Promise.resolve({ ok: true }); };
await tick(150);

// ── Библиотека: каталог и нормализация ─────────────────────────
const HERO_ID = '6a004c894f0d5a83a75578c5';
check('запечённый каталог: 32 титула', lib.counts().total === 32, String(lib.counts().total));
const hero = lib.byId(HERO_ID);
check('byId находит «ГЕРОЙ НЕДЕЛИ»', !!hero && hero.name === 'ГЕРОЙ НЕДЕЛИ', hero && hero.name);
check('редкости из каталога', lib.counts().byRarity.legendary === 13 && lib.counts().byRarity.epic === 8,
  JSON.stringify(lib.counts().byRarity));
check('фильтр по редкости', lib.list({ rarity: 'legendary' }).length === 13);
check('фильтр по источнику', lib.list({ source: 'leaderboard' }).every((t) => t.source === 'leaderboard'));
check('поиск по названию', lib.list({ query: 'герой' }).length >= 1);
check('сортировка по порядку сайта', (function () {
  const l = lib.list({});
  return l.every((t, i) => i === 0 || l[i - 1].order <= t.order);
})());

check('иконки: lucide PascalCase', lib.iconKey('Crown') === 'crown' && lib.iconKey('EyeOff') === 'eye-off'
  && lib.iconKey('HeartCrack') === 'heart-crack' && lib.iconKey('PartyPopper') === 'party-popper',
  [lib.iconKey('Crown'), lib.iconKey('EyeOff'), lib.iconKey('HeartCrack'), lib.iconKey('PartyPopper')].join(','));
check('иконки: анимация через @ отсекается', lib.iconKey('Church@sparkle-pop') === 'church' && lib.iconKey('Ghost@jelly') === 'ghost');
check('иконки: iconify-префиксы', lib.iconKey('gi:mushrooms@bounce') === 'mushroom'
  && lib.iconKey('ph:microphone-fill') === 'mic' && lib.iconKey('gi:raven') === 'crow'
  && lib.iconKey('tb:north-star') === 'sparkles',
  [lib.iconKey('gi:mushrooms@bounce'), lib.iconKey('ph:microphone-fill'), lib.iconKey('gi:raven'), lib.iconKey('tb:north-star')].join(','));
check('иконки: все из каталога есть в icons-data', lib.all().every((t) => !!A.ui.iconsData[lib.iconKey(t.icon)]),
  lib.all().filter((t) => !A.ui.iconsData[lib.iconKey(t.icon)]).map((t) => t.icon).join(','));

const parsed = lib.parseAnim('glow:sz=1.35,border-glow');
check('анимации: первый тег побеждает', parsed.fx === 'glow');
check('анимации: параметр sz', parsed.params.sz === 1.35, String(parsed.params.sz));
check('анимации: экзотика маппится', lib.parseAnim(['constellation', 'glow']).fx === 'nebula'
  && lib.parseAnim('sakura-storm').fx === 'sparkle' && lib.parseAnim('glitch-storm').fx === 'electric'
  && lib.parseAnim('comet-burst:op=0.6').fx === 'sparkle' && lib.parseAnim('comet-burst:op=0.6').params.op === 0.6);
check('анимации: неизвестный тег — без fx', lib.parseAnim('unknown-fx').fx === '' && lib.parseAnim('').fx === '');

const migrated = lib.fromApi([{
  id: 'api1', name: 'API ТИТУЛ', rarity: 'mythic', source: 'event', source_label: 'За ивент',
  unlocked: true, sort_order: 5, badge_bg: 'rgba(1,2,3,.4)', badge_border: 'rgba(5,6,7,.8)',
  badge_color: '#fff', badge_glow: 'rgba(9,9,9,.5)', badge_gradient_from: '#111111',
  badge_gradient_to: '#222222', badge_icon: 'Skull', badge_animation: 'pulse,glow',
  description: 'из api'
}]);
check('миграция API-ответа', migrated.length === 1 && migrated[0].id === 'api1' && migrated[0].bg === 'rgba(1,2,3,.4)'
  && migrated[0].gradFrom === '#111111' && migrated[0].anims.length === 2 && migrated[0].unlocked === true);

lib.setRemote({ items: lib.fromApi([{ id: 'api1', name: 'СВЕЖИЙ', badge_animation: '', sort_order: 1 }]), at: 123 });
check('remote добавляет новый титул', lib.counts().total === 33 && !!lib.byId('api1'));
lib.setRemote({ items: [Object.assign({}, hero, { name: 'ГЕРОЙ НЕДЕЛИ v2', remote: true })], at: 456 });
check('remote обновляет существующий', lib.byId(HERO_ID).name === 'ГЕРОЙ НЕДЕЛИ v2' && lib.counts().total === 32);
lib.resetRuntime();
check('resetRuntime возвращает запечённый каталог', lib.byId(HERO_ID).name === 'ГЕРОЙ НЕДЕЛИ' && lib.counts().total === 32);

// ── Рантайм: рендер на странице профиля ────────────────────────
const box = w.document.getElementById('badges');
const config = A.content.config.current();
config.cosmetics.titlesOn = true;
config.cosmetics.titles = [lib.makeEntry(hero)];
A.content.config.set(config);
A.content.tweaks.titles.apply(A.content.config.current());
await tick(80);

let pill = box.querySelector('[' + MARK + ']');
check('пилюля титула отрисована в ряду бейджей', !!pill && pill.getAttribute(MARK) === HERO_ID);
check('текст титула', !!pill && pill.textContent.trim() === 'ГЕРОЙ НЕДЕЛИ', pill && pill.textContent);
check('родной фон и рамка из каталога', !!pill
  && /rgba\(124,77,255,0?\.1\)/.test(pill.style.background.replace(/\s+/g, ''))
  && pill.style.borderColor.replace(/\s+/g, '') === 'rgba(124,77,255,0.3)', pill && pill.style.cssText.slice(0, 120));
check('градиентный текст (background-clip)', !!pill && /background-clip:\s*text/.test(pill.querySelector('.at-name').style.cssText));
check('иконка-crown из каталога', !!pill && !!pill.querySelector('svg'));
check('FX-класс первого тега анимации (glow)', !!pill && pill.classList.contains('at-glow'), pill && pill.className);
check('CSS-переменные эффектов выставлены', !!pill && pill.style.getPropertyValue('--at-glow') === 'rgba(124, 77, 255, 0.45)',
  pill && pill.style.getPropertyValue('--at-glow'));
check('титул встал до счётчика косметики', !!pill
  && pill.compareDocumentPosition(w.document.getElementById('cosmetics-link')) === 4); // DOCUMENT_POSITION_FOLLOWING
const cssEl = w.document.getElementById('aonc-titles-css');
check('FX-стили внедрены', !!cssEl && /@keyframes aonc-t-glow/.test(cssEl.textContent) && /@keyframes aonc-t-shimmer/.test(cssEl.textContent));
check('сайтовая пауза и no-motion гасят анимации', !!cssEl && /aon-paused-offscreen\.aonc-title-pill/.test(cssEl.textContent)
  && /aonc-no-motion \.aonc-title-pill/.test(cssEl.textContent) && /prefers-reduced-motion/.test(cssEl.textContent));
check('title-атрибут с редкостью и пометкой невыдачи', !!pill && /Эпический/.test(pill.getAttribute('title')) && /не выдан/.test(pill.getAttribute('title')),
  pill && pill.getAttribute('title'));

// anim:'none' гасит FX-класс
const cfg2 = A.content.config.current();
cfg2.cosmetics.titles = [Object.assign({}, cfg2.cosmetics.titles[0], { anim: 'none' })];
A.content.config.set(cfg2);
A.content.tweaks.titles.render(A.content.config.current());
await tick(50);
pill = box.querySelector('[' + MARK + ']');
check('anim=none убирает FX-класс', !!pill && !pill.classList.contains('at-glow'), pill && pill.className);

// несколько титулов сразу
const dn = lib.list({ query: 'НА ДНО' })[0];
const cfg3 = A.content.config.current();
cfg3.cosmetics.titles = [lib.makeEntry(hero), lib.makeEntry(dn)];
A.content.config.set(cfg3);
A.content.tweaks.titles.apply(A.content.config.current());
await tick(80);
const pills = box.querySelectorAll('[' + MARK + ']');
check('несколько титулов рисуются вместе', pills.length === 2, String(pills.length));
check('без дубликатов', new Set(Array.prototype.map.call(pills, (p) => p.getAttribute(MARK))).size === 2);

// самовосстановление после сноса (React-ре-рендер)
pills.forEach((p) => p.parentNode.removeChild(p));
await tick(1400);
check('титулы восстанавливаются после сноса', box.querySelectorAll('[' + MARK + ']').length === 2,
  String(box.querySelectorAll('[' + MARK + ']').length));

// выключение снимает всё
const cfg4 = A.content.config.current();
cfg4.cosmetics.titlesOn = false;
A.content.config.set(cfg4);
A.content.tweaks.titles.apply(A.content.config.current());
await tick(50);
check('titlesOn=false снимает титулы', w.document.querySelectorAll('[' + MARK + ']').length === 0);

// reset
cfg4.cosmetics.titlesOn = true;
A.content.config.set(cfg4);
A.content.tweaks.titles.apply(A.content.config.current());
await tick(80);
check('повторное включение возвращает титулы', box.querySelectorAll('[' + MARK + ']').length === 2);
A.content.tweaks.titles.reset();
await tick(50);
check('reset снимает титулы', w.document.querySelectorAll('[' + MARK + ']').length === 0);

// Сторож catalog-sync: зависший ответ фона (открытый канал сообщения) не
// должен навсегда блокировать inflight — иначе «⟳ Обновить с сайта» мёртв до F5.
const origSend = A.api.sendMessage;
A.content.catalogSync.setWatchdogMs(200);
let hungOnce = false;
A.api.sendMessage = function (msg) {
  if (msg && msg.type === A.messaging.TYPE.CATALOG_GET && !hungOnce) {
    hungOnce = true;
    return new Promise(function () {}); // не отвечает никогда
  }
  return origSend(msg);
};
const hungSync = A.content.catalogSync.sync(false);
await tick(320);
const nextSync = A.content.catalogSync.sync(false);
check('сторож catalog-sync: повторное обновление не заблокировано', nextSync !== hungSync);
await nextSync;
A.api.sendMessage = origSend;

w.close();
if (failures.length) {
  console.log('TEST TITLES FAIL:', failures.join(', '));
  process.exit(1);
}
console.log('TEST TITLES: OK (' + lib.counts().total + ' титулов в каталоге)');
process.exit(0);
