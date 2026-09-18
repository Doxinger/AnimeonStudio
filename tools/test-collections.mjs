import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

const shared = readFileSync('dist/bundles/shared.js', 'utf8');
const content = readFileSync('dist/bundles/content.js', 'utf8');
const tick = (ms = 60) => new Promise((r) => setTimeout(r, ms));
const failures = [];
const check = (name, ok) => {
  console.log((ok ? 'ok  ' : 'FAIL') + ' ' + name);
  if (!ok) failures.push(name);
};

function makeDom(html, url) {
  const dom = new JSDOM(html, { url, pretendToBeVisual: true, runScripts: 'outside-only' });
  dom.window.document.elementFromPoint = () => dom.window.document.body;
  dom.window.eval(shared);
  dom.window.eval(content);
  return dom;
}

const profileHtml = `<!doctype html><html><body>
<header><a href="/user/me">av</a></header>
<main><div class="container">
  <div class="grid grid-cols-2 gap-3">
    <div class="group/col relative h-full"><a href="/collections/my-fav"><span>Моя подборка</span></a></div>
    <div class="group/col relative h-full"><a href="/collections/new"><span>Новая подборка</span></a></div>
  </div>
</div></main>
</body></html>`;

const dom1 = makeDom(profileHtml, 'https://animeon.cc/user/me');
await tick(150);
const A1 = dom1.window.AONC;
const cfg1 = A1.content.config.current();
cfg1.layout.collectionsQuickDelete = true;
A1.content.config.set(cfg1);
A1.content.tweaks.collections.apply(A1.content.config.current());
await tick(120);
const cards = dom1.window.document.querySelectorAll('div[class*="group/col"]');
check('кнопка удаления на своей карточке', cards[0].querySelector('[data-aonc-coll-del]') !== null);
check('на карточке «new» кнопки нет', cards[1].querySelector('[data-aonc-coll-del]') === null);

const dom1b = makeDom(profileHtml, 'https://animeon.cc/user/other');
await tick(150);
const A1b = dom1b.window.AONC;
A1b.content.tweaks.collections.apply(A1b.content.config.current());
await tick(120);
check('на чужом профиле кнопок нет', dom1b.window.document.querySelector('[data-aonc-coll-del]') === null);
dom1b.window.AONC.content.bootstrap.shutdown();
dom1b.window.close();

const collHtml = `<!doctype html><html><body>
<main>
  <button id="site-delete">Удалить</button>
</main>
</body></html>`;
const dom2 = makeDom(collHtml, 'https://animeon.cc/collections/my-fav#aonc-delete');
dom2.window.sessionStorage.setItem('aonc.autodelete', '/collections/my-fav');
dom2.window.sessionStorage.setItem('aonc.autodelete.back', '/user/me');
const siteBtn = dom2.window.document.getElementById('site-delete');
siteBtn.addEventListener('click', () => {
  const dialog = dom2.window.document.createElement('div');
  dialog.setAttribute('role', 'alertdialog');
  const confirmBtn = dom2.window.document.createElement('button');
  confirmBtn.textContent = 'Удалить';
  confirmBtn.addEventListener('click', () => { dom2.window.__done = true; });
  dialog.appendChild(confirmBtn);
  dom2.window.document.body.appendChild(dialog);
});
const A2 = dom2.window.AONC;
const cfg2 = A2.content.config.current();
cfg2.layout.collectionsQuickDelete = true;
A2.content.config.set(cfg2);
A2.content.tweaks.collections.apply(A2.content.config.current());
await tick(1600);
check('авто-удаление нажимает site-кнопку и подтверждение', dom2.window.__done === true);
check('флаг сброшен', dom2.window.sessionStorage.getItem('aonc.autodelete') === null);

dom1.window.AONC.content.bootstrap.shutdown();
dom2.window.AONC.content.bootstrap.shutdown();
dom1.window.close();
dom2.window.close();
if (failures.length) {
  console.log('TEST COLLECTIONS FAIL:', failures.join(', '));
  process.exit(1);
}
console.log('TEST COLLECTIONS: OK');
process.exit(0);
