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
  url: 'https://animeon.cc/user/errornetwork',
  pretendToBeVisual: true,
  runScripts: 'outside-only'
});

const w = dom.window;
w.addEventListener('error', (e) => console.log('PAGE ERROR:', e.message));
w.document.elementFromPoint = () => w.document.body;

w.eval(readFileSync('dist/bundles/shared.js', 'utf8'));
w.eval(readFileSync('dist/bundles/content.js', 'utf8'));

const tick = (ms = 60) => new Promise((r) => setTimeout(r, ms));
const A = w.AONC;

await tick(120);

const config = A.content.config.current();
config.cosmetics.enabled = true;
config.cosmetics.badges = [
  { id: 'b1', text: 'Мангака', num: '№0655', color: '#7C4DFF', icon: 'palette', glow: true, gradient: true, enabled: true },
  { id: 'b2', text: 'Скрытый', color: '#22D3EE', icon: 'ghost', glow: false, gradient: false, enabled: false }
];
A.content.config.set(config);
A.content.tweaks.badges.apply(A.content.config.current());
await tick(80);

const box = w.document.getElementById('badges');
const rendered = box.querySelectorAll('[data-aonc-badge]');
console.log('1. контейнер найден:', !!box);
console.log('2. бейдж отрисован:', rendered.length === 1, rendered[0] && rendered[0].getAttribute('data-aonc-badge'));
console.log('3. текст бейджа:', rendered[0] && rendered[0].textContent.trim());
const hadIcon = !!(rendered[0] && rendered[0].querySelector('svg'));
const hadGlow = !!(rendered[0] && rendered[0].querySelector('span[aria-hidden]'));
console.log('4. svg-иконка есть:', hadIcon);
console.log('5. свечение есть:', hadGlow);
console.log('6. выключенный не отрисован:', rendered.length === 1);

config.cosmetics.badges[0].text = 'Ветеран';
A.content.config.set(config);
A.content.tweaks.badges.render(A.content.config.current());
await tick(40);
console.log('7. обновление текста:', box.querySelector('[data-aonc-badge]').textContent.includes('Ветеран'));

const kids = Array.from(box.children);
const ourIndex = kids.findIndex((k) => k.hasAttribute('data-aonc-badge'));
const cosmIndex = kids.findIndex((k) => k.id === 'cosmetics-link');
console.log('9. вставлен до счётчика косметики:', ourIndex !== -1 && cosmIndex !== -1 && ourIndex < cosmIndex);

const firstBadge = box.querySelector('[data-aonc-badge]');
if (firstBadge && firstBadge.parentNode) firstBadge.parentNode.removeChild(firstBadge);
await tick(500);
console.log('9. восстанавливается после сноса React-ом:', box.querySelectorAll('[data-aonc-badge]').length === 1);
if (box.querySelectorAll('[data-aonc-badge]').length !== 1) failures.push('recovery');
A.content.tweaks.badges.reset();
await tick(20);
console.log('8. очистка после reset:', box.querySelectorAll('[data-aonc-badge]').length === 0);

const failures = [];
if (!(ourIndex !== -1 && cosmIndex !== -1 && ourIndex < cosmIndex)) failures.push('placement');
if (rendered.length !== 1) failures.push('render');
if (!hadIcon) failures.push('icon');
if (!hadGlow) failures.push('glow');
w.close();
if (failures.length) {
  console.log('TEST FAIL:', failures.join(', '));
  process.exit(1);
}
console.log('TEST BADGES: OK');
process.exit(0);
