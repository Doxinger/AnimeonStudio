import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

const dom = new JSDOM('<!doctype html><html><body><div id="panel"></div></body></html>', {
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

w.eval(readFileSync('dist/bundles/shared.js', 'utf8'));
w.eval(readFileSync('dist/bundles/ui.js', 'utf8'));

const A = w.AONC;
const lib = A.config.framesLib;
const panel = w.document.getElementById('panel');
const state = A.ui.state;

let refreshes = 0;
const ctx = {
  custom: A.ui.custom,
  debouncedRefresh: function () { mount(); },
  refresh: function () { mount(); refreshes++; },
  refreshAll: function () { mount(); },
  jump: function () {},
  activeSection: function () { return 'cosmetics'; }
};

function mount() {
  panel.textContent = '';
  panel.appendChild(A.ui.custom.framesEditor({}, ctx));
  return panel;
}

function fire(node, type) {
  node.dispatchEvent(new w.Event(type, { bubbles: true }));
}

function cards() {
  return Array.prototype.slice.call(panel.querySelectorAll('.fgrid .fcard'));
}

function cardByTitle(prefix) {
  return cards().filter((c) => c.title.indexOf(prefix) === 0)[0] || null;
}

function pick(prefix) {
  const card = cardByTitle(prefix);
  if (!card) throw new Error('карточка не найдена: ' + prefix);
  fire(card, 'click');
  return card;
}

A.ui.state.replace(A.config.normalize.createConfig());
mount();

check('редактор рамок собирается', !!panel.querySelector('.frames-picker') && !!panel.querySelector('.frames-list'));
check('в каталоге 37 карточек рамок', cards().length === 37);
check('карточки показывают настоящие картинки cdn', panel.querySelectorAll('.fgrid img.fc-img').length === 32);
check('миниатюры облегчены через ioss resize', Array.prototype.every.call(panel.querySelectorAll('.fgrid img.fc-img'), (i) => i.src.indexOf('/ioss(resize=256)/') > 0));
check('css-кольца рисуются превью-сценой', panel.querySelectorAll('.fc-css .fps-ring').length === 5 && panel.querySelectorAll('.fc-css .fps-ring.rainbow').length === 1);
check('невыданные рамки помечены замком', panel.querySelectorAll('.fc-lock').length > 0);
check('подпись редкости и источника видна', cardByTitle('Руби Хошино').querySelector('.fc-meta').textContent.indexOf('Легендарный') > -1);

const search = panel.querySelector('.fp-search');
search.value = 'хошино';
fire(search, 'input');
check('поиск сужает каталог', cards().length === 3 && cards().every((c) => c.title.toLowerCase().indexOf('хошино') > -1));
search.value = '';
fire(search, 'input');
check('пустой поиск возвращает всё', cards().length === 37);

const rarityRow = panel.querySelectorAll('.fchips')[0];
const legendaryChip = Array.prototype.filter.call(rarityRow.children, (c) => c.textContent === 'Легендарный')[0];
fire(legendaryChip, 'click');
check('фильтр редкости оставляет только легендарные', cards().length === lib.list({ rarity: 'legendary' }).length && cards().length > 0);
fire(rarityRow.children[0], 'click');
check('сброс фильтра возвращает все рамки', cards().length === 37);

const sourceRow = panel.querySelectorAll('.fchips')[1];
const achieveChip = Array.prototype.filter.call(sourceRow.children, (c) => c.textContent === 'Достижение')[0];
fire(achieveChip, 'click');
check('фильтр источника работает', cards().length === lib.list({ source: 'achievement' }).length && cards().length > 10);
fire(sourceRow.children[0], 'click');

const freeToggle = panel.querySelector('.fp-free input');
freeToggle.checked = true;
fire(freeToggle, 'change');
check('фильтр «только выданные мне» оставляет свободные рамки', cards().length === lib.list({ unlockedOnly: true }).length && cards().length === 4);
freeToggle.checked = false;
fire(freeToggle, 'change');

pick('Руби Хошино');
let frames = state.get('cosmetics.frames');
check('клик по карточке надевает рамку', frames.length === 1 && frames[0].frameId === '6a83521e2a8db0afd720d2ea');
check('вместе с рамкой включается показ', state.get('cosmetics.framesOn') === true);
check('ссылка картинки сохраняется в конфиге', frames[0].url.indexOf('cosmetics/frames/6a83521e2a8db0afd720d2ea_1786991139.png') > 0);
check('название и тип подтянуты из каталога', frames[0].name === 'Руби Хошино' && frames[0].type === 'image');
check('панель перерисована после выбора', refreshes > 0);
check('карточка помечена как надетая', !!cardByTitle('Руби Хошино').classList.contains('on'));

pick('Сакура');
frames = state.get('cosmetics.frames');
check('в одиночном режиме новая рамка заменяет старую', frames.length === 1 && frames[0].frameId === '6a304e91ea5255d41367b3f3');

state.set('cosmetics.framesMode', 'stack');
mount();
pick('Телекошечка');
frames = state.get('cosmetics.frames');
check('в режиме слоёв рамки складываются', frames.length === 2 && frames[1].frameId === '6a7713d2c10dfc268e00b42a');
pick('Телекошечка');
check('повторный клик убирает рамку со слоя', state.get('cosmetics.frames').length === 1);

state.set('cosmetics.framesMode', 'single');
state.set('cosmetics.frames', [lib.makeEntry(lib.byId('6a83521e2a8db0afd720d2ea'))]);
mount();

const itemCard = panel.querySelector('.fitem');
check('выбранная рамка показана в блоке «Надето»', !!itemCard && itemCard.querySelector('.fitem-label b').textContent === 'Руби Хошино');
check('у карточки есть живое превью с аватаром', !!itemCard.querySelector('.fps-avatar') && !!itemCard.querySelector('.fps-frame'));
check('превью рисует рамку размером 1.13×', itemCard.querySelector('.fps-frame').style.width === Math.round(46 * 1.13) + 'px');
check('подпись про редкость на месте', itemCard.querySelector('.fitem-label small').textContent.indexOf('Легендарный') === 0);
check('отметка о невыданной рамке честная', itemCard.querySelector('.fitem-label small').textContent.indexOf('не выдана') > 0);
check('превью профиля показывает ту же рамку', !!panel.querySelector('.fe-preview .fps-frame'));

const sliders = itemCard.querySelectorAll('.fitem-grid input[type="range"]');
check('у рамки пять регуляторов', sliders.length === 5);
sliders[0].value = '180';
fire(sliders[0], 'input');
check('свой размер перебивает коэффициент сайта', state.get('cosmetics.frames')[0].scale === 1.8);
check('превью реагирует на свой размер', panel.querySelector('.fitem .fps-frame').style.width === Math.round(46 * 1.8) + 'px');

const itemSliders = panel.querySelectorAll('.fitem .fitem-grid input[type="range"]');
itemSliders[1].value = '-12';
fire(itemSliders[1], 'input');
check('сдвиг по X сохраняется', state.get('cosmetics.frames')[0].ox === -12);
check('сдвиг уходит в css-переменные превью', panel.querySelector('.fitem .fps-frame').style.cssText.indexOf('--aonc-fx: -12px') > 0);

const animSelect = panel.querySelector('.fitem .fitem-grid select');
animSelect.value = 'rotate';
fire(animSelect, 'change');
check('анимация сохраняется в конфиге', state.get('cosmetics.frames')[0].anim === 'rotate');

const enableToggle = panel.querySelector('.fitem .sw input');
enableToggle.checked = false;
fire(enableToggle, 'change');
check('рамку можно выключить, не снимая', state.get('cosmetics.frames')[0].enabled === false);
check('выключенная рамка не рисуется в превью', !panel.querySelector('.fitem .fps-frame'));
const enableBack = panel.querySelector('.fitem .sw input');
enableBack.checked = true;
fire(enableBack, 'change');
check('рамку можно включить обратно', state.get('cosmetics.frames')[0].enabled === true);

const resetBtn = Array.prototype.filter.call(panel.querySelectorAll('.fitem .mini'), (b) => b.textContent === '↺')[0];
fire(resetBtn, 'click');
const afterReset = state.get('cosmetics.frames')[0];
check('сброс возвращает настройки сайта', afterReset.scale === 0 && afterReset.ox === 0 && afterReset.anim === 'none' && afterReset.opacity === 100);

const rowSelects = panel.querySelectorAll('.fe-row select');
rowSelects[0].value = 'all';
fire(rowSelects[0], 'change');
check('переключатель «где рисовать» сохраняется', state.get('cosmetics.framesPlacement') === 'all');
panel.querySelectorAll('.fe-row select')[1].value = 'stack';
fire(panel.querySelectorAll('.fe-row select')[1], 'change');
check('переключатель режима слоёв сохраняется', state.get('cosmetics.framesMode') === 'stack');
const sizeSlider = panel.querySelector('.fe-row input[type="range"]');
sizeSlider.value = '96';
fire(sizeSlider, 'input');
check('порог размера аватара сохраняется', state.get('cosmetics.framesMinSize') === 96);
panel.querySelectorAll('.fe-row select')[0].value = 'profile';
fire(panel.querySelectorAll('.fe-row select')[0], 'change');
state.set('cosmetics.framesMinSize', 56);
state.set('cosmetics.framesMode', 'single');
mount();

const hideToggle = Array.prototype.filter.call(panel.querySelectorAll('.fe-row .sw input'), (i) => i.checked)[0];
check('скрытие чужой рамки включено по умолчанию', state.get('cosmetics.framesHideSite') === true && !!hideToggle);

pick('Бирюзовая');
check('css-кольцо сайта надевается как рамка', state.get('cosmetics.frames')[0].frameId === 'teal');
check('превью кольца рисуется без картинки', !!panel.querySelector('.fitem .fps-ring') && !panel.querySelector('.fitem .fps-frame'));
check('цвет кольца берётся из каталога сайта', panel.querySelector('.fitem .fps-ring').style.boxShadow.toLowerCase().indexOf('#00d3a7') > 0);

pick('Радуга');
check('радужная рамка выбирается', state.get('cosmetics.frames')[0].frameId === 'rainbow');
check('радуга рисуется коническим градиентом', panel.querySelector('.fitem .fps-ring.rainbow').style.background.indexOf('conic-gradient') === 0);

const customBtn = Array.prototype.filter.call(panel.querySelectorAll('.fl-head .btn'), (b) => b.textContent.indexOf('Рамка по ссылке') > 0)[0];
fire(customBtn, 'click');
const withCustom = state.get('cosmetics.frames');
check('рамка по ссылке добавляется', withCustom.length === 2 && withCustom[1].url === '' && withCustom[1].name === 'Своя рамка');
const urlInput = panel.querySelectorAll('.fitem input[type="text"]')[0];
urlInput.value = 'https://example.com/frame.png';
fire(urlInput, 'input');
check('своя ссылка сохраняется', state.get('cosmetics.frames')[1].url === 'https://example.com/frame.png');
check('своя рамка показывается в превью', panel.querySelectorAll('.fe-preview .fps-frame').length === 1);

const removeBtns = panel.querySelectorAll('.fitem .mini.danger');
fire(removeBtns[removeBtns.length - 1], 'click');
check('рамку можно снять крестиком', state.get('cosmetics.frames').length === 1);

const clearBtn = Array.prototype.filter.call(panel.querySelectorAll('.fl-head .btn'), (b) => b.textContent === 'Снять всё')[0];
fire(clearBtn, 'click');
check('«Снять всё» очищает список', state.get('cosmetics.frames').length === 0 && state.get('cosmetics.framesOn') === false);
check('пустое превью подсказывает что делать', panel.querySelector('.fe-preview-note span').textContent.indexOf('Включите') === 0);
check('пустой список рамок показывает подсказку', panel.querySelector('.frames-list .empty').textContent.indexOf('Кликните карточку') > 0);

const stage = A.ui.custom.framesPreview.stage({ face: 72, frames: [lib.makeEntry(lib.byId('6a831a0568e8f931f0972a06'))] });
check('сцена превью масштабируется под коэффициент рамки', stage.style.width === (Math.ceil(72 * 1.21) + 12) + 'px');

const mock = A.ui.custom.framesPreview.mock({ face: 60, frames: [], nickname: 'Гость' });
check('инициалы аватара в превью', mock.querySelector('.fps-initials').textContent === 'ГО');

const saved = A.config.normalize.normalizeConfig({ cosmetics: { frames: state.get('cosmetics.frames') } });
check('конфиг с рамками проходит нормализацию', Array.isArray(saved.cosmetics.frames) && saved.cosmetics.frames.every((f) => typeof f.frameId === 'string'));

w.close();
if (failures.length) {
  console.log('TEST FRAMES UI FAIL:', failures.join(', '));
  process.exit(1);
}
console.log('TEST FRAMES UI: OK');
process.exit(0);
