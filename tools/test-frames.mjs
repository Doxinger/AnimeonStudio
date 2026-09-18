import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

const html = `<!doctype html><html><body>
<div class="min-h-screen bg-background">
  <div class="container">
    <div id="avatar-box" class="relative shrink-0" style="width:214px;height:214px;position:relative">
      <div id="avatar-glow" aria-hidden="true" style="position:absolute;left:50%;top:50%;width:214px;height:214px;background:rgba(124,77,255,.4)"></div>
      <div id="avatar-circle" class="absolute overflow-hidden rounded-full ring-1 ring-white/10" style="position:absolute;left:50%;top:50%;overflow:hidden;width:160px;height:160px">
        <span data-slot="avatar" id="avatar-face" class="size-8 h-full w-full rounded-full relative flex shrink-0" style="width:160px;height:160px">
          <img data-slot="avatar-image" class="absolute inset-0 h-full w-full rounded-full object-cover" src="https://ab18cf62-4b99-4613-a8c1-c801eda74545.selcdn.net/cosmetics/avatars/me.gif">
        </span>
      </div>
      <img id="site-frame" alt="" aria-hidden="true" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:214px;height:214px;object-fit:contain;pointer-events:none" src="https://ab18cf62-4b99-4613-a8c1-c801eda74545.selcdn.net/cosmetics/frames/6a831a0568e8f931f0972a06_1786986290.png">
    </div>
    <div id="small-box" class="relative shrink-0" style="width:32px;height:32px;position:relative">
      <span data-slot="avatar" style="width:32px;height:32px;display:block"><img data-slot="avatar-image" src="y.png"></span>
    </div>
  </div>
</div>
</body></html>`;

const dom = new JSDOM(html, {
  url: 'https://animeon.cc/user/errornetwork',
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
w.eval(readFileSync('dist/bundles/content.js', 'utf8'));

const A = w.AONC;
const lib = A.config.framesLib;
const geo = A.config.framesGeometry;
const rings = A.config.framesRings;
const tick = (ms = 60) => new Promise((r) => setTimeout(r, ms));
await tick(80);

const counts = lib.counts();
check('каталог сайта загружен: 37 рамок', counts.total === 37);
check('в каталоге 32 картинки и 5 css-колец', counts.image === 32 && counts.css === 5);
check('первая рамка каталога — Фиолетовая', lib.all()[0].id === 'purple' && lib.all()[0].name === 'Фиолетовая');

const ruby = lib.byId('6a83521e2a8db0afd720d2ea');
check('рамка «Руби Хошино» найдена', !!ruby && ruby.name === 'Руби Хошино' && ruby.rarity === 'legendary');
check('url картинки ведёт на cdn selcdn', !!ruby && ruby.url.indexOf('https://ab18cf62-4b99-4613-a8c1-c801eda74545.selcdn.net/cosmetics/frames/6a83521e2a8db0afd720d2ea_1786991139.png') === 0);
check('коэффициент рамки из api сохранён', !!ruby && ruby.scale === 1.13);
check('поиск по названию работает', lib.list({ query: 'хошино' }).length >= 3);
check('фильтр по редкости работает', lib.list({ rarity: 'legendary' }).every((f) => f.rarity === 'legendary'));
check('миниатюра использует ioss resize', lib.thumb(ruby, 256).indexOf('/ioss(resize=256)/cosmetics/frames/') > 0);
check('медиа-путь сайта разрешается в cdn', lib.resolveMedia('/media/cosmetic/frames/abc_1.png') === lib.CDN + '/cosmetics/frames/abc_1.png');
check('подписи редкости на русском', lib.rarity('legendary').label === 'Легендарный' && lib.rarity('epic').color === '#E879F9');

check('нормализация масштаба как на сайте: 0.5 → 2', geo.normalizeScale(0.5) === 2);
check('нормализация масштаба как на сайте: 5 → 2.5', geo.normalizeScale(5) === 2.5);
check('нормализация масштаба как на сайте: 0 → 1', geo.normalizeScale(0) === 1);
const fromStage = geo.fromStage(214, 1.13);
check('пересчёт обёртки сайта: face 189 → композит 214', fromStage.composite === 214 && fromStage.face === 189);
check('композит от лица аватара: 160 × 1.13 = 181', geo.measure(160, 1.13).composite === 181);

const plan = geo.plan({ frameId: ruby.id, scale: 0, opacity: 80, ox: 3, oy: -2, glow: 6 }, ruby, 160);
check('план картинки: масштаб и композит сайта', plan.scale === 1.13 && plan.composite === 181 && plan.url === ruby.url);
check('план переносит прозрачность и свечение', plan.opacity === 0.8 && plan.glow === 6);
const planCustom = geo.plan({ frameId: ruby.id, scale: 1.5 }, ruby, 160);
check('свой масштаб перебивает коэффициент сайта', planCustom.scale === 1.5 && planCustom.composite === 240);
const planOffsets = geo.plan({ frameId: ruby.id, ox: 4, oy: 5 }, { id: 'x', type: 'image', url: 'u', ox: 2, oy: 1, scale: 1 }, 100);
check('офсеты суммируются с офсетами рамки', planOffsets.ox === 6 && planOffsets.oy === 6);

const teal = lib.byId('teal');
const ringCss = rings.ringStyle({ size: 160, color: teal.color, width: 10, offset: 2 });
check('css-кольцо собирается в box-shadow', ringCss.indexOf('box-shadow:0 0 0 2px #09090b, 0 0 0 18px #00d3a7') > 0 && ringCss.indexOf('border-radius:50%') > 0);
const rainbowCss = rings.rainbowStyle({ size: 160 });
check('радуга — conic-gradient с маской', rainbowCss.indexOf('conic-gradient(from 0deg, #FF6B6B, #7C4DFF, #00D3A7, #FF6B6B)') > 0 && rainbowCss.indexOf('mask:radial-gradient(circle, transparent 60%, #000 62%)') > 0);

const config = A.content.config.current();
config.cosmetics.framesOn = true;
config.cosmetics.framesPlacement = 'profile';
config.cosmetics.framesMinSize = 56;
config.cosmetics.framesHideSite = true;
config.cosmetics.frames = [lib.makeEntry(ruby)];
A.content.config.set(config);
A.content.tweaks.frames.apply(A.content.config.current());
await tick(80);

const box = w.document.getElementById('avatar-box');
const circle = w.document.getElementById('avatar-circle');
const targets = A.content.framesTargets;
check('хост — внешняя обёртка, а не обрезанный круг', targets.hostFor(w.document.getElementById('avatar-face')) === box);
check('лицо аватара измеряется как 160px', targets.faceOf(box) === 160);
check('обёртка помечена как хост рамки', box.getAttribute('data-aonc-frame-host') === '1' && !circle.hasAttribute('data-aonc-frame-host'));
const imgs = box.querySelectorAll('img[data-aonc-frame]');
check('рамка из каталога отрисована в обёртке аватара', imgs.length === 1);
check('наша рамка — сосед родной рамки сайта', imgs[0].parentNode === box && !!w.document.getElementById('site-frame'));
check('src рамки — картинка с cdn сайта', imgs[0] && imgs[0].getAttribute('src') === ruby.url);
check('размер рамки = 181px (коэффициент 1.13)', imgs[0] && imgs[0].style.width === '181px' && imgs[0].style.height === '181px');
check('базовый стиль центрирования внедрён', !!w.document.getElementById('aonc-frames-css') && w.document.getElementById('aonc-frames-css').textContent.indexOf('--aonc-fx') > 0);
check('родная рамка сайта прячется CSS-правилом по помеченному хосту', !!w.document.getElementById('aonc-frames-hide-site') && w.document.getElementById('site-frame').matches('[data-aonc-frame-host] img[src*="cosmetics/frames/"]:not([data-aonc-frame])'));
check('правило скрытия ограничено помеченными хостами', (w.document.getElementById('aonc-frames-hide-site') || { textContent: '' }).textContent.indexOf('[data-aonc-frame-host] ') === 0);
check('мелкий аватар в комментариях пропущен', w.document.getElementById('small-box').querySelectorAll('[data-aonc-frame]').length === 0);

const cfgAnim = A.content.config.current();
cfgAnim.cosmetics.frames[0].anim = 'rotate';
A.content.config.set(cfgAnim);
A.content.tweaks.frames.render(A.content.config.current());
await tick(50);
const animated = box.querySelector('img[data-aonc-frame]');
check('анимация вращения применяется', !!animated && animated.style.animation.indexOf('aonc-frame-spin') === 0 && animated.getAttribute('data-aonc-anim') === 'rotate');

const cfgRing = A.content.config.current();
cfgRing.cosmetics.frames = [lib.makeEntry(teal)];
A.content.config.set(cfgRing);
A.content.tweaks.frames.render(A.content.config.current());
await tick(50);
const ringNode = box.querySelector('div[data-aonc-frame="teal"]');
check('css-кольцо сайта рисуется div-ом', !!ringNode && ringNode.style.boxShadow.toLowerCase().indexOf('#00d3a7') > 0);
check('картинка прежней рамки снята', box.querySelectorAll('img[data-aonc-frame]').length === 0);

const cfgRainbow = A.content.config.current();
cfgRainbow.cosmetics.frames = [lib.makeEntry(lib.byId('rainbow'))];
A.content.config.set(cfgRainbow);
A.content.tweaks.frames.render(A.content.config.current());
await tick(50);
const rainbowNode = box.querySelector('div[data-aonc-frame="rainbow"]');
check('радужная рамка — conic-gradient', !!rainbowNode && rainbowNode.style.background.indexOf('conic-gradient') === 0 && rainbowNode.style.mask.indexOf('radial-gradient') === 0);

const cfgCustom = A.content.config.current();
cfgCustom.cosmetics.frames = [lib.customEntry('https://example.com/my-frame.png', 'Моя рамка')];
A.content.config.set(cfgCustom);
A.content.tweaks.frames.render(A.content.config.current());
await tick(50);
const customImg = box.querySelector('img[data-aonc-frame="custom"]');
check('рамка по своей ссылке рисуется', !!customImg && customImg.getAttribute('src') === 'https://example.com/my-frame.png');

const cfgStack = A.content.config.current();
cfgStack.cosmetics.frames = [
  lib.makeEntry(ruby),
  Object.assign(lib.makeEntry(teal), { enabled: false }),
  lib.customEntry('https://example.com/second.png', 'Вторая')
];
A.content.config.set(cfgStack);
A.content.tweaks.frames.render(A.content.config.current());
await tick(50);
check('несколько рамок слоями, выключенная не рисуется', box.querySelectorAll('[data-aonc-frame]').length === 2);

const cfgAll = A.content.config.current();
cfgAll.cosmetics.framesPlacement = 'all';
cfgAll.cosmetics.framesMinSize = 0;
cfgAll.cosmetics.frames = [lib.makeEntry(ruby)];
A.content.config.set(cfgAll);
A.content.tweaks.frames.render(A.content.config.current());
await tick(50);
check('режим «все аватарки» рисует и на мелком аватаре', w.document.getElementById('small-box').querySelectorAll('[data-aonc-frame]').length === 1);

const cfgProfile = A.content.config.current();
cfgProfile.cosmetics.framesPlacement = 'profile';
cfgProfile.cosmetics.framesMinSize = 56;
A.content.config.set(cfgProfile);
A.content.tweaks.frames.render(A.content.config.current());
await tick(50);
check('в режиме «профиль» мелкий аватар снова пуст', w.document.getElementById('small-box').querySelectorAll('[data-aonc-frame]').length === 0);

const live = box.querySelector('img[data-aonc-frame]');
if (live && live.parentNode) live.parentNode.removeChild(live);
A.content.tweaks.frames.apply(A.content.config.current());
await tick(700);
check('рамка восстанавливается после сноса', box.querySelectorAll('[data-aonc-frame]').length === 1);

const siteBefore = w.document.getElementById('site-frame');
if (siteBefore && siteBefore.parentNode) {
  const fresh = siteBefore.cloneNode(false);
  fresh.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:214px;height:214px;object-fit:contain;pointer-events:none';
  siteBefore.parentNode.replaceChild(fresh, siteBefore);
}
const siteAfter = w.document.getElementById('site-frame');
check('подменённая React-ом рамка сайта остаётся под CSS-правилом (без наложения)',
  !!siteAfter && !!w.document.getElementById('aonc-frames-hide-site') &&
  siteAfter.matches('[data-aonc-frame-host] img[src*="cosmetics/frames/"]:not([data-aonc-frame])') &&
  box.querySelectorAll('[data-aonc-frame]').length === 1);

const hideEl = w.document.getElementById('aonc-frames-hide-site');
if (hideEl && hideEl.parentNode) hideEl.parentNode.removeChild(hideEl);
await tick(1500);
check('стиль скрытия восстанавливается, если сайт снёс его из head', !!w.document.getElementById('aonc-frames-hide-site'));

const cfgRemote = A.content.config.current();
lib.setRemote({ items: [{ id: 'newframe', name: 'Новая рамка', rarity: 'mythic', type: 'image', url: 'https://example.com/new.png', scale: 1.2, order: 999 }], at: 123 });
A.content.config.set(cfgRemote);
A.content.tweaks.frames.apply(A.content.config.current());
await tick(60);
check('рамка из обновлённого каталога доступна', !!lib.byId('newframe') && lib.counts().total === 38);
const cfgUseRemote = A.content.config.current();
cfgUseRemote.cosmetics.frames = [lib.makeEntry(lib.byId('newframe'))];
A.content.config.set(cfgUseRemote);
A.content.tweaks.frames.render(A.content.config.current());
await tick(50);
check('свежая рамка из каталога рисуется', !!box.querySelector('img[data-aonc-frame="newframe"]'));
lib.resetRuntime();

const cfgOff = A.content.config.current();
cfgOff.cosmetics.framesOn = false;
A.content.config.set(cfgOff);
A.content.tweaks.frames.apply(A.content.config.current());
await tick(50);
check('при выключении рамки сняты', w.document.querySelectorAll('[data-aonc-frame]').length === 0);
check('чужая рамка снова видна после выключения', !w.document.getElementById('aonc-frames-hide-site') && !w.document.querySelectorAll('[data-aonc-frame-host]').length);

A.content.tweaks.frames.apply(A.content.config.current());
const cfgOn = A.content.config.current();
cfgOn.cosmetics.framesOn = true;
A.content.config.set(cfgOn);
A.content.tweaks.frames.apply(A.content.config.current());
await tick(60);
check('после повторного включения рамки снова на месте', box.querySelectorAll('[data-aonc-frame]').length === 1);

A.content.tweaks.frames.reset();
await tick(40);
check('reset очищает всё', w.document.querySelectorAll('[data-aonc-frame]').length === 0 && w.document.querySelectorAll('[data-aonc-frame-host]').length === 0);

const baseCfg = A.content.config.current();
baseCfg.cosmetics.frames = [lib.makeEntry(ruby)];
baseCfg.cosmetics.badges = [{ id: 'b1', text: 'Тест', color: '#fff', icon: 'star', enabled: true }];
const loadout = A.config.loadouts.make(baseCfg, 'Мой комплект');
check('комплект снимает бейджи и рамки', loadout.cosmetics.badges.length === 1 && loadout.cosmetics.frames.length === 1);
const applied = A.config.loadouts.applyTo(A.config.normalize.createConfig(), loadout);
check('применение комплекта переносит рамку каталога', applied.cosmetics.frames[0].frameId === ruby.id && applied.meta.activeLoadout === loadout.id);

check('тип сообщения каталога объявлен', A.messaging.TYPE.CATALOG_GET === 'aonc/catalog:get' && A.messaging.TYPE.CATALOG_REFRESH === 'aonc/catalog:refresh');
check('unwrap достаёт ответ background', A.messaging.unwrap({ ok: true, value: { count: 37 } }).count === 37);

const fromApi = lib.fromApi([{
  id: 'apiframe', name: 'Из API', rarity: 'epic', source: 'achievement', source_label: 'За достижение',
  unlocked: false, sort_order: 5, frame_scale: 1.4, frame_offset_x: 1, frame_offset_y: -1,
  media_url: '/media/cosmetic/frames/apiframe_9.png', media_format: 'png'
}]);
check('fromApi превращает ответ сайта в рамку', fromApi.length === 1 && fromApi[0].url === lib.CDN + '/cosmetics/frames/apiframe_9.png' && fromApi[0].scale === 1.4 && fromApi[0].oy === -1);

w.close();
if (failures.length) {
  console.log('TEST FRAMES FAIL:', failures.join(', '));
  process.exit(1);
}
console.log('TEST FRAMES: OK');
process.exit(0);
