// e2e панели расширения: рендер, живые записи в storage, состояние вкладки,
// режимы плеера, скрытие блоков, история, i18n, адаптивность и «тонкий» бандл.
import { JSDOM } from 'jsdom';
import { readFileSync, statSync } from 'node:fs';

const SHARED = readFileSync('dist/bundles/shared.js', 'utf8');
const POPUP_BUNDLE = readFileSync('dist/bundles/popup.js', 'utf8');
const POPUP_JS = readFileSync('dist/popup/popup.js', 'utf8');
const POPUP_HTML_RAW = readFileSync('dist/popup/popup.html', 'utf8');
const POPUP_CSS = readFileSync('dist/popup/popup.css', 'utf8');
const HTML = POPUP_HTML_RAW.replace(/<script[^>]*><\/script>/g, '');

const failures = [];
let passed = 0;

function check(name, ok, detail) {
  console.log((ok ? 'ok  ' : 'FAIL') + ' ' + name + (ok || !detail ? '' : ' → ' + detail));
  if (!ok) failures.push(name);
  else passed++;
}

function sleep(ms) {
  return new Promise(function (r) { setTimeout(r, ms); });
}

function makeArea(memory) {
  return {
    get: function (keys, cb) {
      const out = {};
      (Array.isArray(keys) ? keys : [keys]).forEach(function (k) {
        if (memory[k] !== undefined) out[k] = memory[k];
      });
      if (cb) cb(out);
      return Promise.resolve(out);
    },
    set: function (obj, cb) { Object.assign(memory, obj); if (cb) cb(); return Promise.resolve(); },
    remove: function (keys, cb) {
      (Array.isArray(keys) ? keys : [keys]).forEach(function (k) { delete memory[k]; });
      if (cb) cb();
      return Promise.resolve();
    },
    clear: function (cb) { Object.keys(memory).forEach(function (k) { delete memory[k]; }); if (cb) cb(); return Promise.resolve(); }
  };
}

// opts: { tabUrl, silent, stale, memory, profiles, config, ping, wait }
async function bootPopup(opts) {
  const o = opts || {};
  const memory = o.memory || {};
  if (o.config) memory['aonc.config.v1'] = o.config;
  if (o.profiles) memory['aonc.profiles.v1'] = o.profiles;

  const dom = new JSDOM(HTML, {
    url: 'https://animeon.cc/__popup__/popup.html',
    pretendToBeVisual: true,
    runScripts: 'outside-only'
  });
  const w = dom.window;
  const calls = { close: 0, created: [], reloaded: [], openOptions: 0, sent: [] };
  const storageListeners = [];

  w.close = function () { calls.close++; };

  const pingValue = o.ping === undefined
    ? { pong: true, url: o.tabUrl || 'https://v2.animeon.co/', picker: false, modes: { theater: true, cinema: false, maxplayer: true } }
    : o.ping;

  w.chrome = {
    runtime: {
      id: o.stale ? undefined : 'test-extension-id',
      lastError: null,
      getURL: function (p) { return 'chrome-extension://test/' + p; },
      getManifest: function () { return { version: '1.0.0' }; },
      openOptionsPage: function () { calls.openOptions++; },
      sendMessage: function (m, cb) { calls.sent.push(m && m.type); if (cb) cb({ ok: true }); return Promise.resolve({ ok: true }); },
      onMessage: { addListener: function () {}, removeListener: function () {} }
    },
    storage: {
      local: makeArea(memory),
      sync: makeArea({}),
      onChanged: {
        addListener: function (fn) { storageListeners.push(fn); },
        removeListener: function (fn) {
          const i = storageListeners.indexOf(fn);
          if (i >= 0) storageListeners.splice(i, 1);
        }
      }
    },
    tabs: {
      query: function (q, cb) {
        const tabs = o.tabUrl === null ? [] : [{ id: 42, url: o.tabUrl === undefined ? 'https://v2.animeon.co/catalog' : o.tabUrl }];
        if (cb) cb(tabs);
        return Promise.resolve(tabs);
      },
      sendMessage: function (id, m, cb) {
        calls.sent.push(m && m.type);
        let reply;
        if (o.silent) reply = undefined;
        else if (m && m.type === 'aonc/ping') reply = { ok: true, value: pingValue };
        else if (m && m.type === 'aonc/theater:toggle') reply = { ok: true, value: { on: false } };
        else if (m && m.type === 'aonc/cinema:toggle') reply = { ok: true, value: { on: true } };
        else if (m && m.type === 'aonc/state:set') reply = { ok: true, value: { ok: true, on: false } };
        else if (m && m.type === 'aonc/picker:start') reply = { ok: true, value: { active: true } };
        else if (m && m.type === 'aonc/picker:stop') reply = { ok: true, value: { active: false } };
        else reply = { ok: true, value: {} };
        if (cb) cb(reply);
        return Promise.resolve(reply);
      },
      reload: function (id) { calls.reloaded.push(id); return Promise.resolve(); },
      create: function (props) { calls.created.push(props && props.url); return Promise.resolve({ id: 99 }); },
      update: function () { return Promise.resolve(); }
    },
    action: { setIcon: function () {}, setBadgeText: function () {}, setBadgeBackgroundColor: function () {}, setTitle: function () {} },
    i18n: { getUILanguage: function () { return 'ru'; } }
  };

  const errors = [];
  w.addEventListener('error', function (e) { errors.push(String(e && e.message)); });

  w.eval(SHARED);
  if (o.customThemes) {
    const patch = Object.assign({}, o.config || {}, { customThemes: o.customThemes });
    memory['aonc.config.v1'] = w.AONC.config.normalize.createConfig(patch);
  }
  w.eval(POPUP_BUNDLE);
  w.eval(POPUP_JS);
  // Первый прогон в процессе включает разбор shared.js (~190 КБ), поэтому
  // ждём снятия booting, а не фиксированную паузу.
  await sleep(o.wait === undefined ? 60 : o.wait);
  for (let i = 0; i < 40 && w.document.body.classList.contains('booting'); i++) await sleep(50);
  await sleep(o.wait === undefined ? 200 : 0);

  return {
    dom: dom, w: w, doc: w.document, A: w.AONC, memory: memory, calls: calls, errors: errors,
    config: function () { return memory['aonc.config.v1'] || null; },
    fireStorage: function (config) {
      storageListeners.slice().forEach(function (fn) {
        fn({ 'aonc.config.v1': { newValue: config } }, 'local');
      });
    },
    fireProfiles: function (list) {
      storageListeners.slice().forEach(function (fn) {
        fn({ 'aonc.profiles.v1': { newValue: list } }, 'local');
      });
    }
  };
}

function click(node) {
  node.dispatchEvent(new node.ownerDocument.defaultView.MouseEvent('click', { bubbles: true, cancelable: true }));
}

function setRange(node, value, ev) {
  node.value = String(value);
  node.dispatchEvent(new node.ownerDocument.defaultView.Event(ev || 'input', { bubbles: true }));
}

const GLYPH = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/u;

async function main() {
  // --- 1. Обычный сценарий: вкладка сайта отвечает ------------------------
  const p = await bootPopup({});
  const doc = p.doc;
  const A = p.A;

  check('панель стартует без исключений', p.errors.length === 0, p.errors.join(' | '));
  check('класс booting снят после первого кадра', !doc.body.classList.contains('booting'));
  check('устаревший контекст не показан', doc.getElementById('stale').hidden);

  const icons = doc.querySelectorAll('svg.ic-svg');
  check('иконки — svg, а не символы: ' + icons.length + ' шт.', icons.length >= 10, String(icons.length));
  check('все data-icon раскрыты', doc.querySelectorAll('[data-icon]').length === 0);
  check('в разметке нет эмодзи и стрелок-символов', !GLYPH.test(doc.body.textContent || ''),
    (doc.body.textContent.match(GLYPH) || [''])[0]);

  // тема
  const presets = doc.querySelectorAll('#presets .pchip');
  const presetCount = A.config.presets.LIST.length;
  check('пресетов в рельсе: ' + (presets.length - 1) + ' + кнопка «Все темы»', presets.length === presetCount + 1,
    'ожидалось ' + (presetCount + 1));
  const active = doc.querySelector('#presets .pchip.on');
  check('активный пресет помечен (original)', !!active && active.__id === 'original', active ? active.__id : 'нет');
  check('у активного пресета aria-pressed=true', !!active && active.getAttribute('aria-pressed') === 'true');

  const swatches = doc.querySelectorAll('#accent-dots .swatch');
  check('свотчей акцента 8', swatches.length === 8, String(swatches.length));
  check('текущий акцент подсвечен', !!doc.querySelector('#accent-dots .swatch.on'));
  check('color-input отражает акцент', doc.getElementById('accent').value.toLowerCase() === '#7c4dff',
    doc.getElementById('accent').value);

  // слайдеры
  const sliders = doc.querySelectorAll('#sliders .sld');
  check('слайдеров 5', sliders.length === 5, String(sliders.length));
  const density = doc.getElementById('sld-density');
  check('слайдеры подписаны для скринридера', doc.querySelectorAll('#sliders input[aria-label]').length === 5);
  check('диапазон плотности 60..160', density.min === '60' && density.max === '160', density.min + '..' + density.max);
  check('значение плотности из конфига', doc.querySelector('[data-path="layout.density"] .sld-val').textContent === '100%',
    doc.querySelector('[data-path="layout.density"] .sld-val').textContent);
  check('заполнение трека --p посчитано', density.style.getPropertyValue('--p') === '0.4',
    density.style.getPropertyValue('--p'));
  check('у слайдеров есть output с for', doc.querySelectorAll('#sliders output[for]').length === 5);

  // режимы
  const modes = doc.querySelectorAll('#modes .mode');
  check('кнопок режимов 4', modes.length === 4, String(modes.length));
  check('режимы получили состояние из PING (театр вкл)',
    doc.querySelector('#modes .mode.on .mode-label').textContent === 'Театр');
  check('«Максимум» включён по ответу вкладки', modes[2].classList.contains('on'));
  check('на сайте режимы доступны', !modes[0].disabled);

  // скрытие блоков
  const hides = doc.querySelectorAll('#quick-hide .tg');
  check('плиток «скрыть блоки» 10', hides.length === 10, String(hides.length));
  check('подписи плиток из селекторов сайта', hides[0].querySelector('.tg-t').textContent === 'Рекламные блоки',
    hides[0].querySelector('.tg-t').textContent);

  // вкладка
  check('data-tab=on на вкладке сайта', doc.body.getAttribute('data-tab') === 'on', doc.body.getAttribute('data-tab'));
  check('пилюля показывает хост и подключение', /v2\.animeon\.co/.test(doc.getElementById('site-state-text').textContent),
    doc.getElementById('site-state-text').textContent);
  check('баннер на подключённой вкладке скрыт', doc.getElementById('banner').hidden);
  check('кнопка перезагрузки вкладки доступна', !doc.getElementById('btn-reload').disabled);

  // профиль-блок скрыт, когда профилей нет
  check('блок профилей скрыт без сохранённых профилей', doc.getElementById('blk-profiles').hidden);

  // --- 2. Живые записи ----------------------------------------------------
  const nordChip = Array.prototype.filter.call(presets, function (n) { return n.__id === 'nord'; })[0];
  const chipsBefore = Array.prototype.slice.call(doc.querySelectorAll('#presets .pchip'));
  click(nordChip);
  await sleep(160);
  const cfg1 = p.config();
  check('клик по пресету пишет тему в storage', cfg1 && cfg1.theme.preset === 'nord', cfg1 && cfg1.theme.preset);
  check('пресет подсвечен после клика', nordChip.classList.contains('on'));
  check('акцент подтянулся из пресета', doc.getElementById('accent').value.toLowerCase() === '#88c0d0',
    doc.getElementById('accent').value);
  check('--accent на корне обновлён', doc.documentElement.style.getPropertyValue('--accent').toLowerCase() === '#88c0d0',
    doc.documentElement.style.getPropertyValue('--accent'));
  check('узлы пресетов не пересоздаются (DOM стабилен)',
    Array.prototype.every.call(doc.querySelectorAll('#presets .pchip'), function (n, i) { return n === chipsBefore[i]; }));

  // слайдер: живой отклик + одна запись в истории на перетаскивание
  const undoBefore = A.ui.history.depth().undo;
  setRange(density, 84);
  check('output обновляется мгновенно, до записи', doc.querySelector('[data-path="layout.density"] .sld-val').textContent === '84%');
  check('--p пересчитан на лету', density.style.getPropertyValue('--p') === '0.24', density.style.getPropertyValue('--p'));
  await sleep(200);
  check('значение ушло в storage во время перетаскивания', p.config().layout.density === 84, String(p.config().layout.density));
  setRange(density, 78);
  density.dispatchEvent(new p.w.Event('change', { bubbles: true }));
  await sleep(160);
  check('финальное значение записано', p.config().layout.density === 78, String(p.config().layout.density));
  check('перетаскивание — один шаг истории', A.ui.history.depth().undo === undoBefore + 1,
    undoBefore + ' → ' + A.ui.history.depth().undo);
  check('строка помечена как изменённая', doc.querySelector('[data-path="layout.density"]').classList.contains('changed'));
  check('кнопка «Отменить» доступна', !doc.getElementById('btn-undo').disabled);

  // сброс значения
  click(doc.querySelector('[data-path="layout.density"] .sld-val'));
  await sleep(160);
  check('клик по значению сбрасывает к дефолту', p.config().layout.density === 100, String(p.config().layout.density));
  check('после сброса строка не помечена', !doc.querySelector('[data-path="layout.density"]').classList.contains('changed'));

  // плитка «скрыть»
  const adsBox = hides[0].querySelector('input');
  adsBox.checked = true;
  adsBox.dispatchEvent(new p.w.Event('change', { bubbles: true }));
  await sleep(160);
  check('плитка пишет visibility в storage', p.config().visibility.ads === true);
  check('плитка получила класс on', hides[0].classList.contains('on'));
  check('счётчик блоков обновлён', /1\/\d+/.test(doc.getElementById('all-hide-text').textContent),
    doc.getElementById('all-hide-text').textContent);

  // свотч акцента
  click(swatches[3]);
  await sleep(160);
  check('свотч меняет акцент', p.config().theme.accent === '#3DDC84', p.config().theme.accent);
  check('свотч подсвечен', swatches[3].classList.contains('on'));

  // undo
  const beforeUndo = p.config().theme.accent;
  click(doc.getElementById('btn-undo'));
  await sleep(180);
  check('«Отменить» откатывает изменение', p.config().theme.accent !== beforeUndo, p.config().theme.accent);
  check('после отката доступна кнопка «Повторить»', !doc.getElementById('btn-redo').disabled);
  click(doc.getElementById('btn-redo'));
  await sleep(180);
  check('«Повторить» возвращает изменение', p.config().theme.accent === beforeUndo, p.config().theme.accent);

  // статус сохранения
  check('статус сохранения показан', ['сохранено', 'готово', 'обновлено из студии'].indexOf(doc.getElementById('save-state').textContent) !== -1,
    doc.getElementById('save-state').textContent);

  // --- 3. Режимы и пипетка ------------------------------------------------
  click(modes[0]);
  await sleep(120);
  check('клик по «Театр» отправляет THEATER_TOGGLE', p.calls.sent.indexOf('aonc/theater:toggle') !== -1);
  check('состояние театра взято из ответа вкладки', !modes[0].classList.contains('on'));
  click(modes[3]);
  await sleep(120);
  check('«Пипетка» запускает picker и закрывает панель', p.calls.sent.indexOf('aonc/picker:start') !== -1 && p.calls.close === 1,
    'close=' + p.calls.close);

  // переход в студию с указанием раздела
  click(doc.getElementById('all-themes'));
  await sleep(60);
  check('«Все темы» открывают студию', p.calls.openOptions === 1, String(p.calls.openOptions));
  check('раздел-цель сохранён для студии', p.w.localStorage.getItem('aonc.studio.section') === 'theme',
    String(p.w.localStorage.getItem('aonc.studio.section')));

  // --- 4. Синхронизация с другим контекстом ------------------------------
  const outside = JSON.parse(JSON.stringify(p.config()));
  outside.layout.posterScale = 155;
  outside.typography.textScale = 128;
  outside.meta.lastEdited = Date.now() + 5000;
  p.fireStorage(outside);
  await sleep(120);
  check('изменения из студии подхватываются', A.ui.state.get('layout.posterScale') === 155,
    String(A.ui.state.get('layout.posterScale')));
  check('слайдер карточек обновился', doc.querySelector('[data-path="layout.posterScale"] .sld-val').textContent === '155%',
    doc.querySelector('[data-path="layout.posterScale"] .sld-val').textContent);
  check('статус сообщил об обновлении', doc.getElementById('save-state').textContent === 'обновлено из студии',
    doc.getElementById('save-state').textContent);

  // собственное сохранение не должно вызывать повторную перерисовку
  const stamp = p.config().meta.lastEdited;
  click(nordChip);
  await sleep(160);
  check('своя запись не затирается внешним конфигом', p.config().theme.preset === 'nord' && p.config().meta.lastEdited !== stamp);

  p.dom.window.close();

  // --- 5. Мастер-переключатель -------------------------------------------
  const p2 = await bootPopup({});
  const doc2 = p2.doc;
  const master = doc2.getElementById('master');
  master.checked = false;
  master.dispatchEvent(new p2.w.Event('change', { bubbles: true }));
  await sleep(160);
  check('выключение пишет meta.enabled=false', p2.config().meta.enabled === false);
  check('панель гаснет при выключенном расширении', doc2.body.classList.contains('off'));
  check('пилюля сообщает «выключено»', doc2.getElementById('site-state-text').textContent === 'выключено',
    doc2.getElementById('site-state-text').textContent);
  check('баннер предлагает включить', !doc2.getElementById('banner').hidden &&
    doc2.getElementById('banner-act').textContent === 'Включить');
  click(doc2.getElementById('banner-act'));
  await sleep(160);
  check('кнопка баннера включает расширение', p2.config().meta.enabled === true && doc2.getElementById('master').checked);
  check('после включения body.off снят', !doc2.body.classList.contains('off'));
  p2.dom.window.close();

  // --- 6. Вне сайта -------------------------------------------------------
  const p3 = await bootPopup({ tabUrl: 'https://example.com/' });
  const doc3 = p3.doc;
  check('вне сайта data-tab=off', doc3.body.getAttribute('data-tab') === 'off', doc3.body.getAttribute('data-tab'));
  check('вне сайта показан баннер', !doc3.getElementById('banner').hidden);
  check('баннер предлагает открыть сайт', doc3.getElementById('banner-act').textContent === 'Открыть сайт',
    doc3.getElementById('banner-act').textContent);
  check('режимы просмотра вне сайта выключены', doc3.querySelectorAll('#modes .mode:disabled').length === 4);
  check('подсказка о вкладке сайта показана', doc3.getElementById('modes-hint').textContent.length > 0);
  check('настройки всё равно можно менять', !doc3.getElementById('sld-density').disabled);
  check('кнопка перезагрузки вкладки выключена', doc3.getElementById('btn-reload').disabled);
  click(doc3.getElementById('banner-act'));
  await sleep(80);
  check('кнопка баннера открывает сайт', p3.calls.created.indexOf('https://animeon.cc/') !== -1,
    JSON.stringify(p3.calls.created));
  click(doc3.getElementById('site-state'));
  await sleep(80);
  check('клик по пилюле вне сайта тоже открывает сайт', p3.calls.created.length >= 2, String(p3.calls.created.length));
  p3.dom.window.close();

  // --- 7. Сайт есть, контент-скрипт молчит --------------------------------
  const p4 = await bootPopup({ silent: true });
  const doc4 = p4.doc;
  check('молчащая вкладка помечена как silent', doc4.body.getAttribute('data-tab') === 'silent',
    doc4.body.getAttribute('data-tab'));
  check('пилюля просит обновить вкладку', doc4.getElementById('site-state-text').textContent === 'обновите вкладку',
    doc4.getElementById('site-state-text').textContent);
  check('баннер предлагает обновить', doc4.getElementById('banner-act').textContent === 'Обновить',
    doc4.getElementById('banner-act').textContent);
  check('режимы недоступны, пока вкладка молчит', doc4.querySelectorAll('#modes .mode:disabled').length === 4);
  p4.dom.window.close();

  // --- 8. Устаревший контекст --------------------------------------------
  const p5 = await bootPopup({ stale: true, wait: 120 });
  check('устаревшая панель показывает заглушку', !p5.doc.getElementById('stale').hidden);
  check('устаревшая панель прячет интерфейс', p5.doc.getElementById('shell').hidden);
  p5.dom.window.close();

  // --- 9. Светлая тема и свой акцент -------------------------------------
  const light = JSON.parse(JSON.stringify(A.config.normalize.createConfig()));
  light.theme.mode = 'light';
  light.theme.accent = '#FABD2F';
  light.theme.preset = 'paper';
  light.glass.enabled = false;
  const p6 = await bootPopup({ config: light });
  const doc6 = p6.doc;
  check('светлая тема включает data-scheme=light', doc6.documentElement.getAttribute('data-scheme') === 'light',
    doc6.documentElement.getAttribute('data-scheme'));
  check('цвет текста на акценте читается', doc6.documentElement.style.getPropertyValue('--accent-fg') === '#0b0b0d',
    doc6.documentElement.style.getPropertyValue('--accent-fg'));
  check('пресет из конфига подсвечен', doc6.querySelector('#presets .pchip.on').__id === 'paper');
  check('слайдер стекла выключен вместе с glass.enabled', doc6.getElementById('sld-blur').disabled);
  check('строка стекла помечена как неактивная', doc6.querySelector('[data-path="glass.blur"]').classList.contains('muted'));
  check('подсказка объясняет, почему стекло неактивно',
    /Стекло выключено/.test(doc6.querySelector('[data-path="glass.blur"]').getAttribute('title')),
    doc6.querySelector('[data-path="glass.blur"]').getAttribute('title'));
  p6.A.ui.state.set('glass.enabled', true, { save: false, preview: false });
  await sleep(80);
  check('слайдер стекла оживает вместе с настройкой', !doc6.getElementById('sld-blur').disabled);
  check('подсказка стекла вернулась', /Размытие/.test(doc6.querySelector('[data-path="glass.blur"]').getAttribute('title')),
    doc6.querySelector('[data-path="glass.blur"]').getAttribute('title'));
  p6.dom.window.close();

  // --- 10. Профили --------------------------------------------------------
  const profileConfig = A.config.normalize.createConfig();
  profileConfig.theme.preset = 'dracula';
  profileConfig.layout.density = 88;
  const p7 = await bootPopup({
    profiles: [{ id: 'profile-1', name: 'Ночной', createdAt: 1, updatedAt: 1, config: profileConfig }]
  });
  const doc7 = p7.doc;
  check('блок профилей показан, когда профиль есть', !doc7.getElementById('blk-profiles').hidden);
  const profileChip = doc7.querySelector('#profiles .pchip');
  check('чип профиля подписан', profileChip && profileChip.querySelector('.chip-name').textContent === 'Ночной');
  click(profileChip);
  await sleep(220);
  check('профиль применён', p7.config().theme.preset === 'dracula' && p7.config().layout.density === 88,
    p7.config().theme.preset + '/' + p7.config().layout.density);
  check('слайдер плотности обновился из профиля', doc7.querySelector('[data-path="layout.density"] .sld-val').textContent === '88%',
    doc7.querySelector('[data-path="layout.density"] .sld-val').textContent);
  check('применение профиля попало в историю', p7.A.ui.history.canUndo());
  check('активный профиль отмечен в конфиге', p7.config().meta.activeProfile === 'profile-1',
    String(p7.config().meta.activeProfile));
  p7.dom.window.close();

  // --- 11. Английский интерфейс ------------------------------------------
  const en = A.config.normalize.createConfig();
  en.meta.locale = 'en';
  const p8 = await bootPopup({ config: en });
  const doc8 = p8.doc;
  check('заголовки разделов переведены', doc8.getElementById('t-theme').textContent === 'Theme' &&
    doc8.getElementById('t-tune').textContent === 'Quick tuning',
    doc8.getElementById('t-theme').textContent + '/' + doc8.getElementById('t-tune').textContent);
  check('подписи слайдеров переведены', doc8.querySelector('[data-path="layout.density"] .sld-name').textContent === 'Density');
  check('режимы переведены', doc8.querySelectorAll('#modes .mode-label')[0].textContent === 'Theater');
  check('плитки скрытия переведены', doc8.querySelector('#quick-hide .tg-t').textContent === 'Ad blocks',
    doc8.querySelector('#quick-hide .tg-t').textContent);
  check('lang переключён на en', doc8.documentElement.getAttribute('lang') === 'en');
  check('статус на английском', doc8.getElementById('save-state').textContent === 'ready',
    doc8.getElementById('save-state').textContent);
  p8.dom.window.close();

  // --- 11b. Свои темы подтягиваются из хранилища -------------------------
  const p10 = await bootPopup({
    customThemes: [{
      id: 'ct-neon', name: 'Neon Tokyo', createdAt: 1, updatedAt: 1, parts: ['theme'],
      theme: { preset: 'custom', mode: 'dark', accent: '#FF4D9D', background: '#12061A', radius: 18 },
      wallpaper: {}
    }]
  });
  const doc10 = p10.doc;
  const mineChip = doc10.querySelector('#presets .pchip.mine');
  check('своя тема появилась в рельсе после загрузки конфига', !!mineChip &&
    mineChip.querySelector('.chip-name').textContent === 'Neon Tokyo',
    mineChip ? mineChip.textContent : 'нет чипа');
  click(mineChip);
  await sleep(180);
  check('своя тема применяется вместе со своими разделами', p10.config().theme.accent === '#FF4D9D' &&
    p10.config().theme.radius === 18 && p10.config().meta.activeThemeId === 'ct-neon',
    p10.config().theme.accent + '/' + p10.config().theme.radius + '/' + p10.config().meta.activeThemeId);
  check('чип своей темы подсвечен, пресеты — нет', mineChip.classList.contains('on') &&
    doc10.querySelectorAll('#presets .pchip.on').length === 1);
  check('слайдер скругления обновился из темы', doc10.querySelector('[data-path="theme.radius"] .sld-val').textContent === '18px',
    doc10.querySelector('[data-path="theme.radius"] .sld-val').textContent);

  // профили подхватываются без перезапуска панели
  const lateProfile = A.config.normalize.createConfig({ theme: { preset: 'nord' } });
  const lateList = [{ id: 'pr-late', name: 'Поздний', createdAt: 1, updatedAt: 1, config: lateProfile }];
  p10.memory['aonc.profiles.v1'] = lateList;
  p10.fireProfiles(lateList);
  await sleep(200);
  check('блок профилей появился после события в хранилище', !doc10.getElementById('blk-profiles').hidden &&
    doc10.querySelector('#profiles .chip-name').textContent === 'Поздний',
    doc10.querySelector('#profiles .chip-name') ? doc10.querySelector('#profiles .chip-name').textContent : 'пусто');
  p10.dom.window.close();

  // --- 11c. Снимок темы хранит палитру и части (регрессия normalize) -----
  const snapshot = A.config.defaults.customTheme.normalize({
    id: 't1', name: 'Т', createdAt: 1, updatedAt: 2, parts: ['theme', 'cosmetics'],
    theme: { accent: '#22D3EE', radius: 20 },
    cosmetics: { framesOn: true, badges: [{ id: 'b1', text: 'Б' }] },
    typography: { textScale: 130 }
  });
  check('снимок темы сохраняет палитру', snapshot.theme.accent === '#22D3EE' && snapshot.theme.radius === 20,
    snapshot.theme.accent + '/' + snapshot.theme.radius);
  check('снимок темы сохраняет прочие части (cosmetics, typography)',
    !!snapshot.cosmetics && snapshot.cosmetics.framesOn === true && !!snapshot.typography,
    JSON.stringify(Object.keys(snapshot)));
  check('снимок темы дополняется дефолтами палитры', snapshot.theme.preset === 'custom' || typeof snapshot.theme.mode === 'string',
    String(snapshot.theme.mode));
  const roundTrip = A.config.normalize.createConfig({ customThemes: [snapshot] });
  check('после нормализации конфига палитра темы на месте',
    roundTrip.customThemes[0].theme.accent === '#22D3EE' && !!roundTrip.customThemes[0].cosmetics,
    JSON.stringify(roundTrip.customThemes[0]).slice(0, 120));
  check('форма customTheme не обросла перечислимыми ключами',
    Object.keys(A.config.defaults.customTheme).join(',') === 'id,name,createdAt,updatedAt,parts,theme,wallpaper',
    Object.keys(A.config.defaults.customTheme).join(','));

  // --- 12. Покрытие i18n-ключей панели -----------------------------------
  const usedKeys = new Set();
  const reJs = /['"](popup\.[a-zA-Z0-9_.]+)['"]/g;
  let mj;
  while ((mj = reJs.exec(POPUP_JS))) usedKeys.add(mj[1]);
  const reHtml = /data-i18n(?:-title|-aria)?="(popup\.[a-zA-Z0-9_.]+)"/g;
  let mh;
  while ((mh = reHtml.exec(POPUP_HTML_RAW))) usedKeys.add(mh[1]);
  ['ready', 'saving', 'saved', 'error', 'sync'].forEach(function (k) { usedKeys.add('popup.save.' + k); });
  const keys = Array.from(usedKeys).filter(function (k) { return k.charAt(k.length - 1) !== '.'; });
  const missing = keys.filter(function (k) { return !A.ui.i18n.EN[k]; });
  check('все ' + keys.length + ' ключей popup.* есть в английском словаре', missing.length === 0, missing.join(', '));

  // --- 13. Адаптивность, оформление, оптимизация -------------------------
  check('панель не тянет тяжёлый бандл студии', POPUP_HTML_RAW.indexOf('bundles/ui.js') === -1 &&
    POPUP_HTML_RAW.indexOf('bundles/popup.js') !== -1);
  const popupKb = statSync('dist/bundles/popup.js').size / 1024;
  const uiKb = statSync('dist/bundles/ui.js').size / 1024;
  check('бандл панели тоньше студийного в ' + (uiKb / popupKb).toFixed(1) + ' раза', popupKb < 80 && uiKb / popupKb > 3,
    popupKb.toFixed(1) + ' КБ против ' + uiKb.toFixed(0) + ' КБ');

  const cssChecks = [
    ['адаптация к узкому экрану', /@media \(max-width:22\.49rem\)/],
    ['адаптация к очень узкому экрану', /@media \(max-width:19\.99rem\)/],
    ['адаптация к низкому экрану', /@media \(max-height:33\.99rem\)/],
    ['режим открытой страницы (as-page)', /html\.as-page/],
    ['уважение prefers-reduced-motion', /prefers-reduced-motion/],
    ['поддержка prefers-contrast', /prefers-contrast/],
    ['поддержка forced-colors', /forced-colors/],
    ['светлая схема', /html\[data-scheme="light"\]/],
    ['color-scheme для нативных контролов', /color-scheme:light/],
    ['видимый фокус с клавиатуры', /:focus-visible/],
    ['скрытие через hidden не перебивается flex', /\[hidden\]\{display:none !important\}/],
    ['заглушка устаревания в потоке — задаёт размер окна', /\.stale\{[^}]*position:relative/]
  ];
  cssChecks.forEach(function (pair) {
    check('css: ' + pair[0], pair[1].test(POPUP_CSS));
  });
  // В попапе размеры НЕ могут зависеть от vw/vh: браузер подбирает окно по
  // содержимому, и вьюпорт-единицы схлопывают панель в минимум (баг 1.0.0:
  // Chrome показывал пустое мини-окно, Firefox не открывал панель вообще).
  const popupRules = POPUP_CSS.split('html.as-page')[0];
  check('css: ширина панели фиксированная в rem (без vw)', /\bbody\{[^}]*width:23rem/.test(popupRules) && !/width:min\([^)]*vw\)/.test(popupRules));
  check('css: высота каркаса фиксированная в rem (без vh/dvh)', /\.shell\{[^}]*max-height:37\.5rem/.test(popupRules) && !/max-height:[^;}]*d?vh/.test(popupRules));
  check('css: vw/vh остались только в режиме as-page', /html\.as-page[\s\S]*min\(70vh,44rem\)/.test(POPUP_CSS));
  check('css: слайдеры стилизованы и в Chrome, и в Firefox',
    /::-webkit-slider-thumb/.test(POPUP_CSS) && /::-moz-range-thumb/.test(POPUP_CSS));
  check('html: есть meta color-scheme и viewport', /name="color-scheme"/.test(POPUP_HTML_RAW) && /name="viewport"/.test(POPUP_HTML_RAW));
  check('html: статус сохранения — живая область', /aria-live="polite"/.test(POPUP_HTML_RAW));

  // широкий вьюпорт jsdom трактуется как открытие страницы, а не попапа
  const p9 = await bootPopup({ wait: 140 });
  check('широкое окно включает раскладку страницы', p9.doc.documentElement.classList.contains('as-page'),
    String(p9.w.innerWidth));
  Object.defineProperty(p9.w, 'innerWidth', { value: 360, configurable: true });
  p9.w.dispatchEvent(new p9.w.Event('resize'));
  await sleep(200);
  check('узкое окно возвращает раскладку панели', !p9.doc.documentElement.classList.contains('as-page'));
  p9.dom.window.close();

  if (failures.length) {
    console.log('TEST POPUP FAIL: ' + failures.join(', '));
    process.exit(1);
  }
  console.log('TEST POPUP: OK (' + passed + ' проверок)');
}

main().catch(function (e) {
  console.log('TEST POPUP CRASH: ' + (e && e.stack || e));
  process.exit(1);
});
