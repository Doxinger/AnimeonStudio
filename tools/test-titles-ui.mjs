// e2e студии: редактор титулов — каталог-сетка, живое превью, поиск и
// фильтры, экипировка кликом, чипы с анимацией и снятием, FX-стили в студии.
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

const dom = new JSDOM('<!doctype html><html><body><div id="panel"></div></body></html>', {
  url: 'https://animeon.cc/',
  pretendToBeVisual: true,
  runScripts: 'outside-only'
});

const w = dom.window;
const failures = [];
const check = (name, ok, extra) => {
  console.log((ok ? 'ok  ' : 'FAIL') + ' ' + name + (ok || extra === undefined ? '' : ' → ' + extra));
  if (!ok) failures.push(name);
};

w.eval(readFileSync('dist/bundles/shared.js', 'utf8'));
w.eval(readFileSync('dist/bundles/ui.js', 'utf8'));

const A = w.AONC;
const lib = A.config.titlesLib;
const panel = w.document.getElementById('panel');

let refreshCalls = 0;
A.api.sendMessage = function (msg) {
  if (msg && msg.type === A.messaging.TYPE.CATALOG_REFRESH) {
    refreshCalls++;
    return Promise.resolve({ ok: true, value: { count: 37, titlesCount: 32 } });
  }
  return Promise.resolve({ ok: true });
};

const ctx = {
  custom: A.ui.custom,
  debouncedRefresh: function () { mount(); },
  refresh: function () { mount(); },
  refreshAll: function () { mount(); },
  jump: function () {},
  activeSection: function () { return 'cosmetics'; }
};

function mount() {
  panel.textContent = '';
  panel.appendChild(A.ui.custom.titlesEditor({}, ctx));
  return panel;
}

function fire(node, type) {
  node.dispatchEvent(new w.Event(type, { bubbles: true }));
}

function cards() {
  return Array.prototype.slice.call(panel.querySelectorAll('.tgrid .tcard'));
}

function cardByName(name) {
  return cards().filter((c) => c.querySelector('.fc-name').textContent === name)[0] || null;
}

A.ui.state.replace(A.config.normalize.createConfig());
mount();

check('редактор титулов собирается', !!panel.querySelector('.titles-editor') && !!panel.querySelector('.titles-picker'));
check('в каталоге 32 карточки титулов', cards().length === lib.counts().total && cards().length === 32, String(cards().length));
check('карточка показывает живую пилюлю', panel.querySelectorAll('.tgrid .aonc-title-pill').length === 32);
check('превью пилюли без рантайм-маркера', panel.querySelectorAll('.tgrid .aonc-title-pill[data-aonc-title]').length === 0);
check('пилюля несёт имя и иконку', (function () {
  const pill = panel.querySelector('.tgrid .aonc-title-pill');
  return !!pill && !!pill.querySelector('svg') && pill.textContent.trim().length > 0;
})());
check('невыданные титулы помечены замком', panel.querySelectorAll('.tgrid .fc-lock').length === 32);
check('подпись редкости и анимации видна', cardByName('ГЕРОЙ НЕДЕЛИ').querySelector('.fc-meta').textContent.indexOf('Эпический') > -1
  && /✦/.test(cardByName('ГЕРОЙ НЕДЕЛИ').querySelector('.fc-meta').textContent));
check('FX-стили внедрены в студию', !!w.document.getElementById('aonc-titles-css'));

// поиск
const search = panel.querySelector('.fp-search');
search.value = 'кошкожена';
fire(search, 'input');
check('поиск сужает каталог', cards().length === 2 && cards().every((c) => c.querySelector('.fc-name').textContent === 'КОШКОЖЕНА'),
  String(cards().length));
search.value = '';
fire(search, 'input');
check('пустой поиск возвращает всё', cards().length === 32);

// фильтр по редкости
const rarityRow = panel.querySelectorAll('.fchips')[0];
const legendaryChip = Array.prototype.filter.call(rarityRow.children, (c) => c.textContent === 'Легендарный')[0];
fire(legendaryChip, 'click');
check('фильтр «Легендарный»', cards().length === 13, String(cards().length));
fire(Array.prototype.filter.call(rarityRow.children, (c) => c.textContent === 'Любая')[0], 'click');
check('сброс фильтра редкости', cards().length === 32);

// фильтр по источнику
const sourceRow = panel.querySelectorAll('.fchips')[1];
const secretChip = Array.prototype.filter.call(sourceRow.children, (c) => c.textContent === 'Особое условие')[0];
fire(secretChip, 'click');
check('фильтр по источнику работает', cards().length > 0 && cards().length < 32, String(cards().length));
fire(Array.prototype.filter.call(sourceRow.children, (c) => c.textContent === 'Все источники')[0], 'click');

// экипировка кликом
fire(cardByName('ГЕРОЙ НЕДЕЛИ'), 'click');
check('клик экипирует титул', A.ui.state.get('cosmetics.titlesOn') === true
  && A.ui.state.get('cosmetics.titles').length === 1
  && A.ui.state.get('cosmetics.titles')[0].titleId === '6a004c894f0d5a83a75578c5',
  JSON.stringify(A.ui.state.get('cosmetics.titles')));
check('карточка помечена «надето»', cardByName('ГЕРОЙ НЕДЕЛИ').classList.contains('on'));
check('превью показывает экипированную пилюлю', panel.querySelectorAll('.tp-preview-row .aonc-title-pill').length === 1);
check('в превью есть сайтовый чип-счётчик', !!panel.querySelector('.tp-site-chip'));
check('чип экипировки с регуляторами', !!panel.querySelector('.tp-chip') && !!panel.querySelector('.tp-chip select'));

// второй титул — множественная экипировка
fire(cardByName('НА ДНО'), 'click');
check('второй титул добавляется', A.ui.state.get('cosmetics.titles').length === 2
  && panel.querySelectorAll('.tp-preview-row .aonc-title-pill').length === 2);

// anim=none через чип
const animSelect = panel.querySelector('.tp-chip select');
animSelect.value = 'none';
fire(animSelect, 'change');
check('переключение «без анимации» пишется в конфиг', A.ui.state.get('cosmetics.titles')[0].anim === 'none',
  A.ui.state.get('cosmetics.titles')[0].anim);
check('превью без FX-класса', !(panel.querySelector('.tp-preview-row .aonc-title-pill') || { classList: { contains: () => true } }).classList.contains('at-glow'));

// снятие крестиком
const removeBtn = Array.prototype.filter.call(panel.querySelectorAll('.tp-chip button'), (b) => b.textContent === '✕')[0];
fire(removeBtn, 'click');
check('крестик снимает титул', A.ui.state.get('cosmetics.titles').length === 1);

// «Снять все» гасит titlesOn
const clearBtn = Array.prototype.filter.call(panel.querySelectorAll('.btn'), (b) => b.textContent === 'Снять все')[0];
fire(clearBtn, 'click');
check('«Снять все» очищает и выключает', A.ui.state.get('cosmetics.titles').length === 0
  && A.ui.state.get('cosmetics.titlesOn') === false);

// кнопка обновления каталога
mount();
const refreshBtn = Array.prototype.filter.call(panel.querySelectorAll('.fp-head button'), (b) => /Обновить/.test(b.textContent))[0];
fire(refreshBtn, 'click');
await new Promise((r) => setTimeout(r, 50));
check('кнопка «Обновить с сайта» шлёт CATALOG_REFRESH', refreshCalls === 1, String(refreshCalls));

// хаб косметики включает редактор титулов между бейджами и рамками
const hub = A.ui.custom.cosmeticsHub({}, ctx);
const order = Array.prototype.map.call(hub.children, (c) => c.className).join('|');
check('титулы в хабе между бейджами и рамками', /badge-editor.*titles-editor.*frames-editor/.test(order), order);

w.close();
if (failures.length) {
  console.log('TEST TITLES UI FAIL:', failures.join(', '));
  process.exit(1);
}
console.log('TEST TITLES UI: OK');
process.exit(0);
