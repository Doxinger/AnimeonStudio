import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

const html = `<!doctype html><html><body style="background-color:#0a0a0b">
<header>h</header>
<main>
  <section id="manga-sec"><h2>Манга начнётся с тебя</h2><p>Путь к манге</p></section>
  <section id="rate-sec">
    <div id="rate-badge"><svg class="lucide lucide-star h-4 w-4"></svg>8.4</div>
  </section>
</main>
<div class="min-h-screen"><div class="container"><div class="flex flex-wrap pt-1.5" id="badges"></div></div></div>
</body></html>`;

const dom = new JSDOM(html, {
  url: 'https://animeon.cc/',
  pretendToBeVisual: true,
  runScripts: 'outside-only'
});

const w = dom.window;
const failures = [];
const check = (name, ok) => {
  console.log((ok ? 'ok  ' : 'FAIL') + ' ' + name);
  if (!ok) failures.push(name);
};

w.document.elementFromPoint = () => w.document.body;
w.eval(readFileSync('dist/bundles/shared.js', 'utf8'));

const A0 = w.AONC;
const migrated = A0.config.normalize.normalizeConfig({ meta: { schemaVersion: 1 } });
check('миграции поднимают схему до 5', migrated.meta.schemaVersion === 5 && Array.isArray(migrated.meta.favorites));
check('миграция добавляет поля рамок', migrated.cosmetics.framesMinSize === 56 && migrated.cosmetics.framesHideSite === true);
check('шестерёнка-хаб по умолчанию скрыта', migrated.meta.fabEnabled === false);
const fabV4 = A0.config.normalize.normalizeConfig({ meta: { schemaVersion: 4, fabEnabled: true } });
check('миграция v5 гасит шестерёнку старого конфига', fabV4.meta.fabEnabled === false && fabV4.meta.schemaVersion === 5);
const fabV5 = A0.config.normalize.normalizeConfig({ meta: { schemaVersion: 5, fabEnabled: true } });
check('явно включённая шестерёнка после миграции сохраняется', fabV5.meta.fabEnabled === true);
const clanOff = A0.config.normalize.normalizeConfig({ meta: { schemaVersion: 3 }, clan: { enabled: false } });
check('миграция v4 включает клан-бейджи', clanOff.clan.enabled === true, String(clanOff.clan.enabled));

const legacy = A0.config.normalize.normalizeConfig({
  meta: { schemaVersion: 2 },
  cosmetics: {
    framesOn: true,
    frames: [
      { id: 'fr1', name: 'Кольцо', kind: 'ring', color: '#00D3A7', color2: '', scale: 112, opacity: 90, enabled: true },
      { id: 'fr2', name: 'Неон', kind: 'neon', color: '#7C4DFF', scale: 108, enabled: false }
    ]
  }
});
check('старые svg-рамки diventano кольцами сайта', legacy.cosmetics.frames.length === 2
  && legacy.cosmetics.frames[0].frameId === 'teal'
  && legacy.cosmetics.frames[0].scale === 1.12
  && legacy.cosmetics.frames[0].opacity === 90
  && legacy.cosmetics.frames[1].enabled === false);

const fc = A0.config.normalize.createConfig();
A0.config.features.apply(fc, A0.config.features.byId('f-ambient'), true);
check('адаптер ambient включает glow', fc.theme.ambient === 55 && A0.config.features.get(fc, A0.config.features.byId('f-ambient')) === true);
A0.config.features.apply(fc, A0.config.features.byId('f-listgrid'), true);
check('адаптер listMode grid', fc.layout.listMode === 'grid');
A0.config.features.apply(fc, A0.config.features.byId('f-perflite'), true);
check('адаптер perf lite', fc.performance.perfMode === 'lite');

w.eval(readFileSync('dist/bundles/content.js', 'utf8'));
const A = w.AONC;
const tick = (ms = 60) => new Promise((r) => setTimeout(r, ms));
await tick(120);

const config = A.content.config.current();
config.wallpaper.enabled = true;
config.wallpaper.source = 'url';
config.wallpaper.url = 'https://example.com/w.webp';
A.content.config.set(config);
A.content.tweaks.wallpaper.apply(A.content.config.current());
await tick(150);
const bodyBg = w.getComputedStyle(w.document.body).backgroundColor;
check('наш CSS делает body прозрачным под обои', bodyBg === 'rgba(0, 0, 0, 0)' || bodyBg === 'transparent');

w.document.body.style.backgroundColor = '#123456';
await tick(120);
const bodyBg2 = w.getComputedStyle(w.document.body).backgroundColor;
check('наш !important перебивает inline-фон body', bodyBg2 === 'rgba(0, 0, 0, 0)' || bodyBg2 === 'transparent');

const cfg2 = A.content.config.current();
cfg2.wallpaper.enabled = false;
A.content.config.set(cfg2);
A.content.tweaks.wallpaper.apply(A.content.config.current());
await tick(120);
const bodyBg3 = w.getComputedStyle(w.document.body).backgroundColor;
check('после выключения обоев фон body = фон темы', bodyBg3 === 'rgb(10, 10, 11)');
w.document.body.style.backgroundColor = '';

const cfg3 = A.content.config.current();
cfg3.visibility.mangaTeaser = true;
A.content.config.set(cfg3);
A.content.tweaks.visibility.apply(A.content.config.current());
await tick(200);
const mangaSec = w.document.getElementById('manga-sec');
check('текст-скрытие манги прячет секцию', mangaSec.style.display === 'none');

const cfg4 = A.content.config.current();
cfg4.visibility.mangaTeaser = false;
cfg4.layout.ratingColors = true;
A.content.config.set(cfg4);
A.content.tweaks.visibility.apply(A.content.config.current());
A.content.tweaks.siteCosmetics.apply(A.content.config.current());
await tick(200);
check('манга возвращена', mangaSec.style.display !== 'none');
const rateBadge = w.document.getElementById('rate-badge');
check('рейтинг 8.4 покрашен в зелёный', rateBadge.style.color === 'rgb(61, 220, 132)' || rateBadge.style.color === '#3ddc84');

const cfg5 = A.content.config.current();
cfg5.layout.ratingColors = false;
cfg5.meta.fabEnabled = true;
A.content.config.set(cfg5);
A.content.tweaks.siteCosmetics.apply(A.content.config.current());
A.content.ui.fab.apply(A.content.config.current());
await tick(80);
const fabHost = w.document.querySelector('[data-aonc-ui="fab"]');
check('FAB создан', !!fabHost);
const fabBtn = fabHost.shadowRoot.querySelector('.fab');
fabBtn.click();
await tick(30);
check('меню FAB открывается', fabHost.shadowRoot.querySelector('.menu').classList.contains('on'));
w.document.body.click();
await tick(30);
check('меню FAB закрывается кликом вне', !fabHost.shadowRoot.querySelector('.menu').classList.contains('on'));
A.content.ui.fab.reset();
await tick(20);
check('FAB удаляется при reset', !w.document.querySelector('[data-aonc-ui="fab"]'));

// Панель расширения читает состояние режимов из ответа aonc/ping
const ping = A.content.messaging.handlers['aonc/ping']();
check('ping отдаёт pong и url', ping.pong === true && typeof ping.url === 'string');
check('ping отдаёт состояние пипетки', typeof ping.picker === 'boolean');
check('ping отдаёт режимы просмотра', !!ping.modes &&
  typeof ping.modes.theater === 'boolean' &&
  typeof ping.modes.cinema === 'boolean' &&
  typeof ping.modes.maxplayer === 'boolean');

A.content.tweaks.player.toggleTheater();
A.content.tweaks.player.toggleMaxPlayer();
const ping2 = A.content.messaging.handlers['aonc/ping']();
check('ping отражает включённый театр и максимум', ping2.modes.theater === true && ping2.modes.maxplayer === true,
  JSON.stringify(ping2.modes));

const maxOff = A.content.messaging.handlers['aonc/state:set']({ key: 'maxplayer' });
check('state:set возвращает новое состояние', maxOff.ok === true && maxOff.on === false, JSON.stringify(maxOff));
check('state:set без ключа не врёт', A.content.messaging.handlers['aonc/state:set']({}).ok === false);
A.content.tweaks.player.toggleTheater();
A.content.classes.setRuntime('aonc-maxplayer', false);

// Роутер: stop() снимает обработчики window, повторный start() их не дублирует
let routerEvents = 0;
const offRouter = A.content.router.onChange(function () { routerEvents++; });
w.history.pushState({}, '', '/catalog');
w.dispatchEvent(new w.PopStateEvent('popstate'));
check('popstate запускает роутер', routerEvents === 1, String(routerEvents));
A.content.router.stop();
w.history.pushState({}, '', '/anime/x');
w.dispatchEvent(new w.PopStateEvent('popstate'));
check('после stop роутер молчит', routerEvents === 1, String(routerEvents));
A.content.router.start();
w.history.pushState({}, '', '/profile');
w.dispatchEvent(new w.PopStateEvent('popstate'));
check('start снова оживляет роутер', routerEvents === 2, String(routerEvents));
A.content.router.start();
w.history.pushState({}, '', '/me');
w.dispatchEvent(new w.PopStateEvent('popstate'));
check('двойной start не дублирует события', routerEvents === 3, String(routerEvents));
offRouter();
A.content.router.stop();

w.close();
if (failures.length) {
  console.log('TEST CONTENT FAIL:', failures.join(', '));
  process.exit(1);
}
console.log('TEST CONTENT: OK');
process.exit(0);
