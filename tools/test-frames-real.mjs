import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

const fixture = readFileSync('tools/fixtures/profile-avatar.html', 'utf8');

const html = `<!doctype html><html class="dark"><body>
<div class="min-h-screen bg-background">
  <div class="container mx-auto px-3 max-w-5xl">
    <div class="relative -mt-20 pb-2">
      <div class="flex flex-col items-center md:flex-row gap-6">
        <div class="relative shrink-0 group flex items-center justify-center w-36 h-36 md:w-60 md:h-60">
          <div class="relative">
            <div class="relative shrink-0 sm:hidden" style="width: 96px; height: 96px;">
              <div class="absolute inset-0 grid place-items-center">
                ${fixture}
              </div>
            </div>
          </div>
        </div>
      </div>
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
const targets = A.content.framesTargets;
const tick = (ms = 60) => new Promise((r) => setTimeout(r, ms));
await tick(80);

const siteFrame = w.document.querySelector('img[src*="cosmetics/frames"]');
const siteWrapper = siteFrame.parentElement;
const circle = siteWrapper.querySelector('div[class*="rounded-full"][style*="width"]');
const avatar = siteWrapper.querySelector('span[data-slot="avatar"]');

check('фикстура — настоящая разметка профиля сайта', !!siteFrame && siteFrame.style.objectFit === 'contain');
check('сайт рисует рамку 99.84px при аватаре 96px', siteFrame.style.width === '99.84px' && circle.style.width === '96px');

check('хостом выбрана обёртка сайта, а не круг', targets.hostFor(avatar) === siteWrapper);
check('лицо аватара определено как 96px', targets.faceOf(siteWrapper) === 96);
check('найден ровно один аватар-хост', targets.collect('profile').length === 1);

const team = lib.byId('6a440d3f97c9fa9cfe04eb31');
check('рамка «AnimeOn Team» есть в каталоге', !!team && team.name === 'AnimeOn Team' && team.scale === 1.04);

const config = A.content.config.current();
config.cosmetics.framesOn = true;
config.cosmetics.framesPlacement = 'profile';
config.cosmetics.framesHideSite = true;
config.cosmetics.frames = [lib.makeEntry(team)];
A.content.config.set(config);
A.content.tweaks.frames.apply(A.content.config.current());
await tick(100);

const ours = siteWrapper.querySelector('img[data-aonc-frame]');
check('наша рамка встала в обёртку сайта', !!ours && ours !== siteFrame);
check('наш размер совпал с сайтом (96 × 1.04 = 100px)', !!ours && ours.style.width === '100px' && ours.style.height === '100px');
check('наш src — оригинал рамки с cdn', !!ours && ours.getAttribute('src') === team.url);
check('позиционирование через css-переменные и transform', !!ours && w.document.getElementById('aonc-frames-css').textContent.indexOf('translate(calc(-50% + var(--aonc-fx,0px))') > 0);
check('родная рамка сайта прячется CSS-правилом по помеченному хосту', !!w.document.getElementById('aonc-frames-hide-site') && siteFrame.matches('[data-aonc-frame-host] img[src*="cosmetics/frames/"]:not([data-aonc-frame])'));

const big = lib.byId('6a7713d2c10dfc268e00b42a');
const cfg2 = A.content.config.current();
cfg2.cosmetics.frames = [lib.makeEntry(big)];
A.content.config.set(cfg2);
A.content.tweaks.frames.render(A.content.config.current());
await tick(60);
const bigNode = siteWrapper.querySelector('img[data-aonc-frame]');
check('крупная рамка 1.6× рисуется 154px', !!bigNode && bigNode.style.width === Math.round(96 * 1.6) + 'px' && big.url === bigNode.getAttribute('src'));

const cfg3 = A.content.config.current();
cfg3.cosmetics.frames = [lib.makeEntry(lib.byId('purple'))];
A.content.config.set(cfg3);
A.content.tweaks.frames.render(A.content.config.current());
await tick(60);
const ring = siteWrapper.querySelector('div[data-aonc-frame="purple"]');
check('css-кольцо сайта рисуется по размеру аватара', !!ring && ring.style.width === '96px' && ring.style.boxShadow.indexOf('0 0 0 12px #7c4dff') > 0);

const cfg4 = A.content.config.current();
cfg4.cosmetics.framesOn = false;
A.content.config.set(cfg4);
A.content.tweaks.frames.apply(A.content.config.current());
await tick(60);
check('после выключения наша рамка снята, родная снова видна', !siteWrapper.querySelector('[data-aonc-frame]') && !!siteFrame && siteFrame.style.display === '' && !w.document.getElementById('aonc-frames-hide-site'));

w.close();
if (failures.length) {
  console.log('TEST FRAMES REAL FAIL:', failures.join(', '));
  process.exit(1);
}
console.log('TEST FRAMES REAL: OK');
process.exit(0);
