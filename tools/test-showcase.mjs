import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

const failures = [];
let passed = 0;
const check = (name, ok, detail) => {
  console.log((ok ? 'ok  ' : 'FAIL') + ' ' + name + (ok || detail === undefined ? '' : ' → ' + detail));
  if (ok) passed++;
  else failures.push(name);
};
const tick = (ms = 60) => new Promise((r) => setTimeout(r, ms));

const profileHtml = `<!doctype html><html><body>
<div class="min-h-screen bg-background overflow-x-hidden">
  <div class="relative"><div class="cover">обложка</div></div>
  <main><div class="container mx-auto px-3 max-w-5xl">
    <div class="flex items-center justify-center gap-2 flex-wrap pt-1.5" id="badges"><span class="existing">2</span></div>
    <div id="rest">контент</div>
  </div></main>
</div>
</body></html>`;

function bootContent(url, html) {
  const dom = new JSDOM(html || profileHtml, { url, pretendToBeVisual: true, runScripts: 'outside-only' });
  const w = dom.window;
  w.document.elementFromPoint = () => w.document.body;
  w.eval(readFileSync('dist/bundles/shared.js', 'utf8'));
  w.eval(readFileSync('dist/bundles/content.js', 'utf8'));
  return { dom, w, A: w.AONC };
}

const ITEMS = [
  { id: 's1', name: 'Фрирен', url: 'https://cdn.example/p1.jpg', link: '/anime/frieren', enabled: true },
  { id: 's2', name: 'Внешний', url: 'https://cdn.example/p2.jpg', link: 'https://other.site/x', enabled: true },
  { id: 's3', name: 'Выключен', url: 'https://cdn.example/p3.jpg', link: '/anime/off', enabled: false },
  { id: 's4', name: 'Ломающий', url: 'javascript:alert(1)', link: '/anime/x', enabled: true }
];

{
  const { w, A } = bootContent('https://animeon.cc/profile');
  await tick(120);
  const cfg = A.content.config.current();
  cfg.cosmetics.showcaseOn = true;
  cfg.cosmetics.showcase = ITEMS;
  A.content.config.set(cfg);
  A.content.tweaks.showcase.apply(A.content.config.current());
  await tick(30);

  const panel = w.document.getElementById('aonc-showcase');
  check('на /profile витрина создана', !!panel && panel.getAttribute('data-aonc-showcase') === '1');
  const cells = panel ? panel.querySelectorAll('.aonc-sh-cell') : [];
  check('рендерятся только включённые постеры с безопасным url (2 из 4)', cells.length === 2, 'cells=' + cells.length);
  check('javascript: URL не попадает в разметку', !!panel && panel.innerHTML.indexOf('javascript:') === -1);
  const a1 = cells[0];
  check('внутренняя ссылка: <a href="/anime/frieren"> без target', a1 && a1.tagName === 'A' && a1.getAttribute('href') === '/anime/frieren' && !a1.getAttribute('target'));
  const a2 = cells[1];
  check('внешняя ссылка: target=_blank + rel noopener', a2 && a2.getAttribute('target') === '_blank' && /noopener/.test(a2.getAttribute('rel') || ''));
  check('подпись из name', a1 && a1.textContent.indexOf('Фрирен') !== -1);
  check('постер: img с lazy и no-referrer', !!a1 && !!a1.querySelector('img[loading="lazy"][referrerpolicy="no-referrer"]'));
  check('счётчик в шапке = 2', !!panel && panel.querySelector('div > span') && panel.textContent.indexOf('2') !== -1);
  check('вставлена в контейнер профиля рядом с бейджами', !!panel && panel.parentNode && panel.parentNode.classList.contains('container') && panel.previousSibling && panel.previousSibling.id === 'badges');
  const css = w.document.getElementById('aonc-showcase-css');
  check('hover-CSS с акцентом создан', !!css && /aonc-sh-cell:hover img/.test(css.textContent) && /prefers-reduced-motion/.test(css.textContent));
  check('акцент темы попал в переменные панели', !!panel && panel.style.getPropertyValue('--aonc-sh-accent') !== '');

  const cfg2 = A.content.config.current();
  cfg2.cosmetics.showcaseTitle = 'Моя полка';
  cfg2.cosmetics.showcaseWidth = 180;
  A.content.config.set(cfg2);
  A.content.tweaks.showcase.apply(A.content.config.current());
  const panel2 = w.document.getElementById('aonc-showcase');
  check('свой заголовок витрины', !!panel2 && panel2.textContent.indexOf('Моя полка') !== -1);
  check('ширина постера влияет на сетку', !!panel2 && /minmax\(180px/.test(panel2.innerHTML + Array.prototype.map.call(panel2.querySelectorAll('div'), (d) => d.style.cssText).join('')));

  const node = w.document.getElementById('aonc-showcase');
  if (node && node.parentNode) node.parentNode.removeChild(node);
  await tick(500);
  check('самовосстановление после сноса React-ом', !!w.document.getElementById('aonc-showcase'));

  const cfg3 = A.content.config.current();
  cfg3.cosmetics.showcaseOn = false;
  A.content.config.set(cfg3);
  A.content.tweaks.showcase.apply(A.content.config.current());
  check('выключено — панель и CSS сняты', !w.document.getElementById('aonc-showcase') && !w.document.getElementById('aonc-showcase-css'));

  const cfg4 = A.content.config.current();
  cfg4.cosmetics.showcaseOn = true;
  A.content.config.set(cfg4);
  A.content.tweaks.showcase.apply(A.content.config.current());
  check('повторное включение возвращает витрину', !!w.document.getElementById('aonc-showcase'));

  const cfg5 = A.content.config.current();
  cfg5.meta.enabled = false;
  A.content.config.set(cfg5);
  let threw = null;
  try { A.content.bootstrap.applyAll(A.content.config.current()); } catch (e) { threw = e; }
  check('выключение расширения снимает витрину без ошибок', !threw && !w.document.getElementById('aonc-showcase'), threw && threw.message);
  A.content.bootstrap.shutdown();
  w.close();
}

{
  const strangerHtml = `<!doctype html><html><body>
<header><a href="/user/meown">avatar</a></header>
<div class="min-h-screen bg-background overflow-x-hidden">
  <main><div class="container mx-auto px-3 max-w-5xl">
    <div class="flex items-center justify-center gap-2 flex-wrap pt-1.5" id="badges"><span class="existing">2</span></div>
  </div></main>
</div>
</body></html>`;
  const { w, A } = bootContent('https://animeon.cc/user/stranger', strangerHtml);
  await tick(120);
  const cfg = A.content.config.current();
  cfg.cosmetics.showcaseOn = true;
  cfg.cosmetics.showcase = ITEMS;
  A.content.config.set(cfg);
  A.content.tweaks.showcase.apply(A.content.config.current());
  await tick(20);
  check('onlyMine: чужой профиль без витрины', !w.document.getElementById('aonc-showcase'));
  const cfg2 = A.content.config.current();
  cfg2.cosmetics.showcaseOnlyMine = false;
  A.content.config.set(cfg2);
  A.content.tweaks.showcase.apply(A.content.config.current());
  check('onlyMine выключен: витрина на чужом профиле есть', !!w.document.getElementById('aonc-showcase'));
  A.content.bootstrap.shutdown();
  w.close();
}

{
  const grabHtml = `<!doctype html><html><head>
<meta property="og:image" content="https://cdn.example/og.jpg">
<meta property="og:title" content="Магическая битва">
</head><body><h1>Магическая битва 2</h1></body></html>`;
  const { w, A } = bootContent('https://animeon.cc/anime/jujutsu', grabHtml);
  await tick(60);
  const r = A.content.tweaks.showcase.grabFromPage();
  check('grab: og:image + og:title + ссылка страницы', r.grabbed === true && r.item.url === 'https://cdn.example/og.jpg' && r.item.name === 'Магическая битва' && r.item.link === '/anime/jujutsu', JSON.stringify(r));
  A.content.bootstrap.shutdown();
  w.close();
}

{
  const fallbackHtml = `<!doctype html><html><body><h1>Тайтл из h1</h1>
<div class="aspect-[2/3]"><img src="https://cdn.example/card.jpg"></div>
</body></html>`;
  const { w, A } = bootContent('https://animeon.cc/anime/x', fallbackHtml);
  await tick(60);
  const r = A.content.tweaks.showcase.grabFromPage();
  check('grab без og-тегов: постер из карточки, имя из h1', r.grabbed === true && r.item.url === 'https://cdn.example/card.jpg' && r.item.name === 'Тайтл из h1', JSON.stringify(r));
  A.content.bootstrap.shutdown();
  w.close();
}

{
  const { w, A } = bootContent('https://animeon.cc/catalog', '<!doctype html><html><body><p>каталог</p></body></html>');
  await tick(60);
  const r = A.content.tweaks.showcase.grabFromPage();
  check('grab на странице без постера: понятная ошибка', r.grabbed === false && r.error === 'no-poster', JSON.stringify(r));
  A.content.bootstrap.shutdown();
  w.close();
}

{
  const realHtml = readFileSync('tools/fixtures/profile-real.html', 'utf8');
  const { w, A } = bootContent('https://animeon.cc/user/errornetwork', realHtml);
  await tick(120);
  const cfg = A.content.config.current();
  cfg.cosmetics.showcaseOn = true;
  cfg.cosmetics.showcase = [{ id: 'r1', name: 'Сакура', url: 'https://cdn.example/sakura.jpg', link: '/anime/sakura', enabled: true }];
  cfg.cosmetics.framesOn = true;
  cfg.cosmetics.framesHideSite = true;
  cfg.cosmetics.frames = [{ id: 'f1', frameId: '', url: 'https://cdn.example/frame.png', type: 'image', enabled: true, scale: 0, ox: 0, oy: 0, opacity: 100, anim: 'none', glow: 0 }];
  A.content.config.set(cfg);
  A.content.bootstrap.applyAll(A.content.config.current(), { force: true });
  await tick(60);
  const panel = w.document.getElementById('aonc-showcase');
  check('реальная разметка: витрина встала в main после шапки профиля (без .container)', !!panel && panel.parentNode && panel.parentNode.tagName === 'MAIN');
  const siteFrames = w.document.querySelectorAll('img[src*="cosmetics/frames/"]:not([data-aonc-frame])');
  check('реальная разметка: обе родные рамки под правилом скрытия', siteFrames.length === 2 && Array.prototype.every.call(siteFrames, function (img) {
    return img.matches('[data-aonc-frame-host] img[src*="cosmetics/frames/"]:not([data-aonc-frame])');
  }));
  check('реальная разметка: наши рамки на обоих адаптивных аватарах', w.document.querySelectorAll('img[data-aonc-frame]').length === 2);
  A.content.bootstrap.shutdown();
  w.close();
}

{
  const dom = new JSDOM('<!doctype html><html><body><div id="panel"></div></body></html>', {
    url: 'https://animeon.cc/', pretendToBeVisual: true, runScripts: 'outside-only'
  });
  const w = dom.window;
  w.eval(readFileSync('dist/bundles/shared.js', 'utf8'));
  w.eval(readFileSync('dist/bundles/ui.js', 'utf8'));
  const A = w.AONC;
  const panel = w.document.getElementById('panel');
  A.ui.state.replace(A.config.normalize.createConfig());

  const ctx = {
    custom: A.ui.custom,
    debouncedRefresh: () => mount(),
    refresh: () => mount(),
    refreshAll: () => mount(),
    jump: () => {},
    activeSection: () => 'cosmetics'
  };
  function mount() {
    panel.textContent = '';
    panel.appendChild(A.ui.custom.showcaseEditor({}, ctx));
    return panel;
  }
  const fire = (node, type) => node.dispatchEvent(new w.Event(type, { bubbles: true }));

  mount();
  check('студия: редактор витрины рендерится', panel.textContent.indexOf('Витрина постеров') !== -1);
  check('студия: есть кнопка «Забрать со страницы»', panel.textContent.indexOf('Забрать со страницы') !== -1);

  const addBtn = Array.prototype.filter.call(panel.querySelectorAll('button'), (b) => b.textContent.indexOf('＋ Постер') !== -1)[0];
  fire(addBtn, 'click');
  check('студия: «＋ Постер» добавляет пункт и включает витрину', (A.ui.state.get('cosmetics.showcase') || []).length === 1 && A.ui.state.get('cosmetics.showcaseOn') === true);

  A.ui.state.set('cosmetics.showcase', [
    { id: 'x1', name: 'Первый', url: 'https://cdn.example/a.jpg', link: '/anime/a', enabled: true },
    { id: 'x2', name: 'Второй', url: 'https://cdn.example/b.jpg', link: '/anime/b', enabled: true }
  ]);
  mount();
  const cards = panel.querySelectorAll('.fitem');
  check('студия: карточки по числу постеров', cards.length === 2, 'cards=' + cards.length);

  const downBtn = Array.prototype.filter.call(cards[0].querySelectorAll('button'), (b) => b.textContent === '↓')[0];
  fire(downBtn, 'click');
  const after = A.ui.state.get('cosmetics.showcase') || [];
  check('студия: кнопка «Ниже» меняет порядок', after.length === 2 && after[0].name === 'Второй' && after[1].name === 'Первый');

  const delBtn = Array.prototype.filter.call(panel.querySelectorAll('.fitem .mini.danger'), (b) => b.textContent === '✕')[0];
  fire(delBtn, 'click');
  check('студия: «✕» удаляет постер', (A.ui.state.get('cosmetics.showcase') || []).length === 1);

  const onToggle = panel.querySelector('.list-head .sw input[type="checkbox"]');
  onToggle.checked = false;
  fire(onToggle, 'change');
  check('студия: тумблер выключает витрину', A.ui.state.get('cosmetics.showcaseOn') === false);

  const widthInput = Array.prototype.filter.call(panel.querySelectorAll('input[type="range"]'), (i) => i.min === '90')[0];
  widthInput.value = '200';
  fire(widthInput, 'input');
  check('студия: слайдер ширины пишет в конфиг', A.ui.state.get('cosmetics.showcaseWidth') === 200);
  w.close();
}

if (failures.length) {
  console.log('TEST SHOWCASE FAIL: ' + failures.join(', '));
  process.exit(1);
}
console.log('TEST SHOWCASE: OK (' + passed + ' проверок)');
process.exit(0);
