import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

const html = `<!doctype html><html><head></head><body>
<header class="aon-glass aon-glass-header">header</header>
<main><div class="container"><section id="sec"><div class="card" id="card">card text</div></section></div></main>
</body></html>`;

const dom = new JSDOM(html, {
  url: 'https://animeon.cc/',
  pretendToBeVisual: true,
  runScripts: 'outside-only'
});

const w = dom.window;
w.addEventListener('error', (e) => console.log('PAGE ERROR:', e.message));

const card = w.document.getElementById('card');
let panelOpened = false;
w.document.elementFromPoint = () => {
  if (panelOpened) {
    const hostEl = w.document.querySelector('[data-aonc-ui="picker-panel"]');
    if (hostEl) return hostEl.shadowRoot.querySelector('.panel') || card;
  }
  return card;
};

w.eval(readFileSync('dist/bundles/shared.js', 'utf8'));
w.eval(readFileSync('dist/bundles/content.js', 'utf8'));

const tick = (ms = 60) => new Promise((r) => setTimeout(r, ms));
const A = w.AONC;

await tick(120);
console.log('1. bootstrap запущен, стиль впрыснут:', !!w.document.getElementById('aonc-style'));

A.content.picker.start();
console.log('2. пипетка активна:', A.content.picker.isActive());

card.dispatchEvent(new w.MouseEvent('click', { bubbles: true, clientX: 12, clientY: 34 }));
await tick(40);

const host = w.document.querySelector('[data-aonc-ui="picker-panel"]');
panelOpened = !!host;
console.log('3. панель создана:', !!host);
const panel = host && host.shadowRoot.querySelector('.panel');
console.log('4. панель видима:', !!panel && host.style.display !== 'none');
console.log('5. селектор в панели:', host && host.shadowRoot.querySelector('textarea').value);

const slider = host.shadowRoot.querySelectorAll('input[type=range]')[0];
slider.value = '0.5';
slider.dispatchEvent(new w.Event('input', { bubbles: true }));
await tick(20);
const preview = w.document.getElementById('aonc-picker-preview');
console.log('6. live-превью есть:', !!preview && preview.textContent.length > 0);

host.shadowRoot.querySelector('.btn.primary').click();
await tick(120);
const rules = A.content.config.current().elements.rules;
console.log('7. правило сохранено:', rules.length === 1, rules[0] && rules[0].selector);
console.log('8. CSS содержит правило:', A.content.applier.stats().bytes > 0 &&
  w.document.getElementById('aonc-style').textContent.includes(rules[0] ? rules[0].selector.split(' ')[0] : 'xxx'));
console.log('9. элемент скрыт после apply:', card.style.display === 'none' ||
  w.document.getElementById('aonc-style').textContent.includes('display: none'));

const cssMove = A.cssBuilder.elements.buildRule({
  selector: '#card', enabled: true, action: 'style', important: true,
  style: { dx: 40, dy: -15, scale: 1.2 }
}, '/');
const cssOk = cssMove.includes('transform: translateX(40px) translateY(-15px) scale(1.2)');
console.log('10. CSS: translate+scale в одном transform:', cssOk);

let savedMove = null;
A.content.picker.panel.open(
  { selector: '#card', tag: 'div', crumb: 'div#card' },
  { element: card, onSave: (r) => { savedMove = r; }, onClose: () => {} }
);
A.content.picker.panel.setTab('move');
const moveSec = host.shadowRoot.querySelector('.sec[data-sec="move"]');
const dragBtn = moveSec.querySelector('.btns .btn');

dragBtn.click();
const armedOk = A.content.picker.drag.active();
card.dispatchEvent(new w.MouseEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 100 }));
w.dispatchEvent(new w.MouseEvent('pointermove', { bubbles: true, clientX: 140, clientY: 70 }));
await tick(10);
const pv = w.document.getElementById('aonc-picker-preview');
const movedOk = !!pv && pv.textContent.includes('translateX(40px)') && pv.textContent.includes('translateY(-30px)');
w.dispatchEvent(new w.MouseEvent('pointerup', { bubbles: true, clientX: 140, clientY: 70 }));
await tick(10);
const numX = moveSec.querySelector('input[type=number]');
const backOk = !A.content.picker.drag.active() && host.style.display !== 'none' && numX.value === '40';
console.log('11. drag: вооружение/перенос/возврат панели:', armedOk, movedOk, backOk);

host.shadowRoot.querySelector('.ft .btn.primary').click();
await tick(30);
const saveOk = !!savedMove && Number(savedMove.style.dx) === 40 && Number(savedMove.style.dy) === -30 &&
  savedMove.action === 'style';
console.log('13. сохранение правила со сдвигом:', saveOk);

A.content.picker.panel.open(
  { selector: '#card', tag: 'div', crumb: 'div#card' },
  { element: card, onSave: () => {}, onClose: () => {} }
);
A.content.picker.panel.setTab('move');
const moveSec2 = host.shadowRoot.querySelector('.sec[data-sec="move"]');
moveSec2.querySelector('.btns .btn').click();
card.dispatchEvent(new w.MouseEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 100 }));
w.dispatchEvent(new w.MouseEvent('pointermove', { bubbles: true, clientX: 240, clientY: 170 }));
await tick(10);
const pv2 = w.document.getElementById('aonc-picker-preview');
const dragMoved = !!pv2 && pv2.textContent.includes('translateX(140px)') && pv2.textContent.includes('translateY(70px)');
w.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
await tick(10);
const cancelOk = !A.content.picker.drag.active() && host.style.display !== 'none' &&
  !pv2.textContent.includes('translate');
console.log('14. Esc отменяет перетаскивание, значение откатилось:', dragMoved, cancelOk);

const dragOk = armedOk && movedOk && backOk && saveOk && dragMoved;

// 15. ELEMENT_HIDE по селектору (контекстное меню): пипетка не активна —
// правило сохраняется, overlay-хост впустую не создаётся, без TypeError.
A.content.picker.stop();
await tick(30);
const rulesBefore = A.content.config.current().elements.rules.length;
const hideResp = A.content.messaging.handlers['aonc/element:hide']({ selector: '#sec' });
await tick(160);
const rulesAfterHide = A.content.config.current().elements.rules;
const elementHideOk = hideResp && hideResp.hidden === true &&
  rulesAfterHide.length === rulesBefore + 1 &&
  rulesAfterHide[rulesAfterHide.length - 1].selector === '#sec' &&
  !w.document.querySelector('[data-aonc-ui="picker-overlay"]') &&
  !w.document.querySelector('[data-aonc-ui="picker-panel"]');
console.log('15. ELEMENT_HIDE по селектору без активной пипетки:', elementHideOk);

// 16. Enter блокирует именно подсвеченный элемент, а не то, что оказалось
// под устаревшими координатами mousemove (прокрутка страницы).
A.content.picker.start();
card.dispatchEvent(new w.MouseEvent('mousemove', { bubbles: true, clientX: 12, clientY: 34 }));
await tick(20);
const headerEl = w.document.querySelector('header');
w.document.elementFromPoint = () => headerEl; // «страница уехала» — под курсором теперь шапка
w.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
await tick(60);
const host2 = w.document.querySelector('[data-aonc-ui="picker-panel"]');
const selAfterEnter = host2 && host2.shadowRoot.querySelector('textarea').value;
const enterOk = !!host2 && /card/.test(selAfterEnter || '');
console.log('16. Enter выбирает подсвеченный элемент (не stale-координаты):', enterOk, selAfterEnter);

// 17. H из поля ввода сайта не прячет элемент; из обычного места — прячет.
w.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); // снять блокировку панели
await tick(20);
const siteInput = w.document.createElement('input');
w.document.body.appendChild(siteInput);
const rulesBeforeH = A.content.config.current().elements.rules.length;
siteInput.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'h', bubbles: true, composed: true }));
await tick(80);
const guardOk = A.content.config.current().elements.rules.length === rulesBeforeH;
// наводимся на шапку (elementFromPoint уже возвращает header) и жмём h из body
w.dispatchEvent(new w.MouseEvent('mousemove', { bubbles: true, clientX: 5, clientY: 5 }));
await tick(20);
w.document.body.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'h', bubbles: true }));
await tick(160);
const rulesAfterH = A.content.config.current().elements.rules;
const quickHideOk = guardOk && rulesAfterH.length === rulesBeforeH + 1 &&
  /header/.test(rulesAfterH[rulesAfterH.length - 1].selector);
console.log('17. H: editable-гард + быстрое скрытие hover:', quickHideOk);

// 18. Новый черновик: вкладка «CSS» без скрытия (action=style), «Скрыть» — hide.
A.content.picker.panel.open(
  { selector: '#card', tag: 'div', crumb: 'div#card' },
  { element: card, onSave: function () {}, onClose: () => {} }
);
A.content.picker.panel.setTab('css');
const rawCss = host2.shadowRoot.querySelector('.sec[data-sec="css"] textarea');
rawCss.value = 'color: red;';
rawCss.dispatchEvent(new w.Event('input', { bubbles: true }));
const draftCss = A.content.picker.panel.draftRule();
A.content.picker.panel.setTab('hide');
const draftHide = A.content.picker.panel.draftRule();
const cssTabOk = draftCss.action === 'style' && draftCss.rawCss === 'color: red;' && draftHide.action === 'hide';
console.log('18. вкладка CSS не прячет элемент, «Скрыть» прячет:', cssTabOk, draftCss.action, draftHide.action);

const failures = [];
if (!w.document.getElementById('aonc-style')) failures.push('style');
if (!A.content.picker.isActive()) failures.push('picker-active');
if (!host || !panel) failures.push('panel');
if (!(rules.length === 1)) failures.push('rule-saved');
if (!cssOk) failures.push('move-css');
if (!dragOk) failures.push('drag');
if (!cancelOk) failures.push('drag-cancel');
if (!elementHideOk) failures.push('element-hide-by-selector');
if (!enterOk) failures.push('enter-hovered');
if (!quickHideOk) failures.push('h-guard-quickhide');
if (!cssTabOk) failures.push('css-tab-action');
w.close();
if (failures.length) {
  console.log('TEST FAIL:', failures.join(', '));
  process.exit(1);
}
console.log('TEST PICKER: OK');
process.exit(0);
