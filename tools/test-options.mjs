import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

const html = readFileSync('dist/options/options.html', 'utf8').replace(/<script[^>]*><\/script>/g, '');
const dom = new JSDOM(html, {
  url: 'https://animeon.cc/studio',
  pretendToBeVisual: true,
  runScripts: 'outside-only'
});

const w = dom.window;
const failures = [];

function check(name, ok, detail) {
  console.log((ok ? 'ok  ' : 'FAIL') + ' ' + name + (ok || !detail ? '' : ' → ' + detail));
  if (!ok) failures.push(name);
}

const memory = {};

function area() {
  return {
    get: function (keys, cb) {
      const out = {};
      (Array.isArray(keys) ? keys : [keys]).forEach(function (k) {
        if (memory[k] !== undefined) out[k] = memory[k];
      });
      if (cb) cb(out);
      return Promise.resolve(out);
    },
    set: function (obj, cb) {
      Object.assign(memory, obj);
      if (cb) cb();
      return Promise.resolve();
    },
    remove: function (keys, cb) {
      (Array.isArray(keys) ? keys : [keys]).forEach(function (k) { delete memory[k]; });
      if (cb) cb();
      return Promise.resolve();
    },
    clear: function (cb) {
      Object.keys(memory).forEach(function (k) { delete memory[k]; });
      if (cb) cb();
      return Promise.resolve();
    }
  };
}

w.chrome = {
  runtime: {
    id: 'test-extension-id',
    lastError: null,
    getURL: function (p) { return 'chrome-extension://test/' + p; },
    getManifest: function () { return { version: '1.1.0' }; },
    sendMessage: function (msg, cb) { if (cb) cb({ ok: true }); return Promise.resolve({ ok: true }); },
    onMessage: { addListener: function () {}, removeListener: function () {} }
  },
  storage: {
    local: area(),
    sync: area(),
    onChanged: { addListener: function () {}, removeListener: function () {} }
  },
  tabs: {
    query: function (q, cb) { if (cb) cb([]); return Promise.resolve([]); },
    sendMessage: function (id, msg, cb) { if (cb) cb({}); return Promise.resolve({}); },
    reload: function () {}
  },
  action: {
    setIcon: function () {}, setBadgeText: function () {}, setBadgeBackgroundColor: function () {}, setTitle: function () {}
  },
  i18n: { getUILanguage: function () { return 'ru'; } }
};

w.eval(readFileSync('dist/bundles/shared.js', 'utf8'));
w.eval(readFileSync('dist/bundles/ui.js', 'utf8'));
w.eval(readFileSync('dist/options/options.js', 'utf8'));

function sleep(ms) {
  return new Promise(function (r) { setTimeout(r, ms); });
}

sleep(120).then(async function () {
  const doc = w.document;
  const nav = doc.getElementById('nav');
  const sections = w.AONC.ui.sections.all();

  check('студия загружается без исключений', !doc.getElementById('stale-banner') || doc.getElementById('stale-banner').hidden);
  check('навигация построена: ' + sections.length + ' разделов', nav.querySelectorAll('button').length === sections.length,
    'получено ' + nav.querySelectorAll('button').length);
  check('заголовок раздела заполнен', (doc.getElementById('section-title').textContent || '').trim().length > 0);
  check('кнопки панели имеют подписи', (doc.getElementById('btn-picker').textContent || '').trim().length > 0);
  check('поле поиска имеет placeholder', (doc.getElementById('search-input').placeholder || '').length > 0);
  check('статус сохранения установлен', (doc.getElementById('save-state').textContent || '').trim().length > 0);

  const controlCount = doc.querySelectorAll('#panel .ctl').length;
  check('контролы раздела отрисованы', controlCount > 3, 'count=' + controlCount);

  const groupTitles = Array.prototype.map.call(doc.querySelectorAll('#panel .group-title'), function (n) {
    return n.textContent.trim();
  });
  check('группы раздела имеют заголовки', groupTitles.length > 0 && groupTitles.every(function (t) { return t.length > 0; }));

  const vitrine = doc.querySelectorAll('#panel .preset-card');
  check('витрина пресетов видна в разделе «Тема»', vitrine.length > 10, 'count=' + vitrine.length);
  check('у карточек есть мини-превью', doc.querySelectorAll('#panel .preset-mini__card').length > 20);

  const localeCtl = doc.querySelector('[data-path="meta.locale"]');
  w.AONC.ui.state.set('meta.locale', 'ru');

  if (!localeCtl) {
    doc.querySelectorAll('#nav button')[sections.findIndex(function (s) { return s.id === 'profiles'; })].click();
  }
  await sleep(60);
  const select = doc.querySelector('[data-path="meta.locale"] select');
  check('переключатель языка найден', !!select);

  if (select) {
    select.value = 'en';
    select.dispatchEvent(new w.Event('change', { bubbles: true }));
    await sleep(80);

    check('en: навигация переведена', Array.prototype.some.call(doc.querySelectorAll('#nav .nav-label'), function (n) {
      return n.textContent.trim() === 'Theme';
    }), Array.prototype.map.call(doc.querySelectorAll('#nav .nav-label'), function (n) { return n.textContent; }).join('|'));
    check('en: заголовок раздела переведён', doc.getElementById('section-title').textContent.indexOf('Profiles') !== -1 ||
      doc.getElementById('section-title').textContent.indexOf('Theme') !== -1, doc.getElementById('section-title').textContent);
    check('en: кнопки панели переведены', doc.getElementById('btn-picker').textContent.indexOf('Picker') !== -1,
      doc.getElementById('btn-picker').textContent);
    check('en: placeholder поиска переведён', doc.getElementById('search-input').placeholder.indexOf('Search') === 0,
      doc.getElementById('search-input').placeholder);
    check('en: подписи контролов переведены', doc.querySelectorAll('#panel .ctl-label').length > 0 &&
      Array.prototype.some.call(doc.querySelectorAll('#panel .ctl-label span'), function (n) {
        return /^[A-Za-z]/.test(n.textContent.trim());
      }));

    select.value = 'ru';
    select.dispatchEvent(new w.Event('change', { bubbles: true }));
    await sleep(80);
    check('ru: возврат русского интерфейса', doc.getElementById('btn-picker').textContent.indexOf('Пипетка') !== -1,
      doc.getElementById('btn-picker').textContent);
  }

  const navButtons = doc.querySelectorAll('#nav button');
  navButtons[sections.findIndex(function (sec) { return sec.id === 'privacy'; })].click();
  await sleep(200);
  check('дашборд приватности рендерится в студии', !!doc.querySelector('#panel .privacy-dash'));
  check('дашборд приватности сообщает об отсутствии вкладки',
    (doc.querySelector('#panel .privacy-dash').textContent || '').indexOf('Нет открытой вкладки сайта') !== -1,
    doc.querySelector('#panel .privacy-dash').textContent.slice(0, 90));

  navButtons[sections.findIndex(function (sec) { return sec.id === 'theme'; })].click();
  await sleep(120);

  const search = doc.getElementById('search-input');
  search.value = 'blur';
  search.dispatchEvent(new w.Event('input', { bubbles: true }));
  await sleep(220);
  check('поиск по английскому слову находит настройки', doc.querySelectorAll('#panel .search-item').length > 0,
    'найдено ' + doc.querySelectorAll('#panel .search-item').length);

  // переход в раздел по запросу панели расширения (localStorage-метка)
  doc.getElementById('search-input').value = '';
  doc.getElementById('search-input').dispatchEvent(new w.Event('input', { bubbles: true }));
  await sleep(120);
  w.localStorage.setItem('aonc.studio.section', 'chat');
  w.dispatchEvent(Object.assign(new w.Event('storage'), { key: 'aonc.studio.section', newValue: 'chat' }));
  await sleep(150);
  check('студия переходит в раздел по метке из панели',
    (doc.getElementById('section-title').textContent || '').indexOf('Чат') !== -1,
    doc.getElementById('section-title').textContent);
  check('метка раздела очищена после перехода', w.localStorage.getItem('aonc.studio.section') === null,
    String(w.localStorage.getItem('aonc.studio.section')));

  w.close();
  if (failures.length) {
    console.log('TEST OPTIONS FAIL:', failures.join(', '));
    process.exit(1);
  }
  console.log('TEST OPTIONS: OK');
  process.exit(0);
}).catch(function (e) {
  console.log('TEST OPTIONS FAIL: ' + e.message);
  process.exit(1);
});
