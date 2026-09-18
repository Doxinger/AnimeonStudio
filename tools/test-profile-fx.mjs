// e2e «Профиль как в Steam» (content/tweaks/profile-fx.js): маршруты,
// onlyMine, слои фона, прозрачный контент, обложка своей картинкой, снятие.
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

const html = `<!doctype html><html><body>
<header><a href="/user/me">avatar</a></header>
<div class="min-h-screen bg-background">
  <div class="relative"><div class="cover">обложка</div></div>
  <main style="background-color: rgb(10,10,11);"><div class="container">профиль</div></main>
</div>
</body></html>`;

function boot(url) {
  const dom = new JSDOM(html, { url, pretendToBeVisual: true, runScripts: 'outside-only' });
  const w = dom.window;
  w.document.elementFromPoint = () => w.document.body;
  w.eval(readFileSync('dist/bundles/shared.js', 'utf8'));
  w.eval(readFileSync('dist/bundles/content.js', 'utf8'));
  return { dom, w, A: w.AONC };
}

const failures = [];
let passed = 0;
const check = (name, ok, detail) => {
  console.log((ok ? 'ok  ' : 'FAIL') + ' ' + name + (ok || detail === undefined ? '' : ' → ' + detail));
  if (ok) passed++;
  else failures.push(name);
};
const tick = (ms = 40) => new Promise((r) => setTimeout(r, ms));

// ── свой профиль: слой появляется, контент прозрачится ────────────
{
  const { w, A } = boot('https://animeon.cc/profile');
  await tick(120);
  const cfg = A.content.config.current();
  cfg.profileFx.enabled = true;
  cfg.wallpaper = { enabled: true, source: 'url', url: 'https://cdn.example/bg.png' };
  A.content.config.set(cfg);
  A.content.tweaks.profileFx.apply(A.content.config.current());
  await tick(30);
  const img = w.document.getElementById('aonc-pfx-img');
  check('на /profile слой фона создан', !!img);
  check('background-image берётся из обоев темы', !!img && img.style.backgroundImage.indexOf('https://cdn.example/bg.png') !== -1, img && img.style.backgroundImage);
  check('оверлей-виньетка вторым слоем', !!w.document.getElementById('aonc-pfx-ov'));
  const css = (w.document.getElementById('aonc-pfx-css') || { textContent: '' }).textContent;
  check('контент сайта прозрачится (main + обёртки)', /main, main\[style\]/.test(css) && /bg-background/.test(css));
  check('обложка сайта не тронута по умолчанию', css.indexOf('div.min-h-screen > div.relative:first-child {') === -1 || !/background-image/.test(css.split('min-h-screen > div.relative')[1] || ''));

  // обложка своей картинкой
  const cfg2 = A.content.config.current();
  cfg2.profileFx.coverMode = 'image';
  A.content.config.set(cfg2);
  A.content.tweaks.profileFx.apply(A.content.config.current());
  const css2 = (w.document.getElementById('aonc-pfx-css') || { textContent: '' }).textContent;
  check('coverMode=image: обложка красится той же картинкой', /div\.min-h-screen > div\.relative:first-child \{[^}]*background-image: url\("?https:\/\/cdn\.example\/bg\.png/.test(css2), css2.slice(-220));

  // пресет-узор вместо url
  const cfg3 = A.content.config.current();
  cfg3.wallpaper = { enabled: true, source: 'preset', preset: 'aurora' };
  A.content.config.set(cfg3);
  A.content.tweaks.profileFx.apply(A.content.config.current());
  const img3 = w.document.getElementById('aonc-pfx-img');
  check('пресет обоев темы даёт background-image', !!img3 && img3.style.backgroundImage.length > 10, img3 && img3.style.backgroundImage.slice(0, 40));

  const cfgW = A.content.config.current();
  cfgW.wallpaper.enabled = false;
  A.content.config.set(cfgW);
  A.content.tweaks.profileFx.apply(A.content.config.current());
  const imgW = w.document.getElementById('aonc-pfx-img');
  check('обои темы выключены — слой без картинки, затемнение остаётся', !!imgW && imgW.style.backgroundImage === '' && !!w.document.getElementById('aonc-pfx-ov'));

  // выключение снимает всё
  const cfg4 = A.content.config.current();
  cfg4.profileFx.enabled = false;
  A.content.config.set(cfg4);
  A.content.tweaks.profileFx.apply(A.content.config.current());
  check('выключено — слои сняты', !w.document.getElementById('aonc-pfx-img') && !w.document.getElementById('aonc-pfx-ov') && !w.document.getElementById('aonc-pfx-css'));
  w.close();
}

// ── onlyMine: чужой профиль без фона, свой /user/ник — с фоном ────
{
  const { w, A } = boot('https://animeon.cc/user/stranger');
  await tick(120);
  const cfg = A.content.config.current();
  cfg.profileFx.enabled = true;
  cfg.profileFx.onlyMine = true;
  A.content.config.set(cfg);
  A.content.tweaks.profileFx.apply(A.content.config.current());
  await tick(30);
  check('чужой /user/… при onlyMine без фона', !w.document.getElementById('aonc-pfx-img'));

  const cfg2 = A.content.config.current();
  cfg2.profileFx.onlyMine = false;
  A.content.config.set(cfg2);
  A.content.tweaks.profileFx.apply(A.content.config.current());
  check('onlyMine=false: чужой профиль тоже оформляется', !!w.document.getElementById('aonc-pfx-img'));

  // переход на свой /user/ник при onlyMine=true
  const cfg3 = A.content.config.current();
  cfg3.profileFx.onlyMine = true;
  A.content.config.set(cfg3);
  A.content.tweaks.profileFx.apply(A.content.config.current());
  check('снова onlyMine: чужой профиль очищен', !w.document.getElementById('aonc-pfx-img'));
  w.history.pushState({}, '', '/user/me');
  A.content.tweaks.profileFx.apply(A.content.config.current());
  check('свой /user/me оформляется при onlyMine', !!w.document.getElementById('aonc-pfx-img'));
  w.history.pushState({}, '', '/catalog');
  A.content.tweaks.profileFx.apply(A.content.config.current());
  check('вне профиля слои сняты (SPA-переход)', !w.document.getElementById('aonc-pfx-img'));
  w.close();
}

// ── дефолт: выключено, normalize добавляет раздел ─────────────────
{
  const { w, A } = boot('https://animeon.cc/profile');
  await tick(120);
  const cfg = A.content.config.current();
  check('profileFx в схеме конфига по умолчанию', !!cfg.profileFx && cfg.profileFx.enabled === false && cfg.profileFx.onlyMine === true);
  check('без включения слоёв нет', !w.document.getElementById('aonc-pfx-img'));
  w.close();
}

if (failures.length) {
  console.log('TEST PROFILE FX FAIL: ' + failures.join(', '));
  process.exit(1);
}
console.log('TEST PROFILE FX: OK (' + passed + ' проверок)');
process.exit(0);
