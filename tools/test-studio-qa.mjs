// e2e «быстрых побед» студии: карта разделов, dirty-маркеры, персистентная
// история, поиск по значениям и транслиту, пакетный экспорт/импорт темы,
// метки NEW и реестр кастомных контролов.
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

// Каноническая версия проекта: манифест-шаблон и package.json должны совпадать
// с AONC.VERSION (src/shared/core/namespace.js) — проверяется в конце теста.
const MANIFEST_VERSION = JSON.parse(readFileSync('manifest.template.json', 'utf8')).version;
const PKG_VERSION = JSON.parse(readFileSync('package.json', 'utf8')).version;

const html = readFileSync('dist/options/options.html', 'utf8').replace(/<script[^>]*><\/script>/g, '');
const dom = new JSDOM(html, {
  url: 'https://animeon.cc/studio',
  pretendToBeVisual: true,
  runScripts: 'outside-only'
});

const w = dom.window;
const failures = [];
let passed = 0;

function check(name, ok, detail) {
  console.log((ok ? 'ok  ' : 'FAIL') + ' ' + name + (ok || !detail ? '' : ' → ' + detail));
  if (!ok) failures.push(name);
  else passed++;
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
    set: function (obj, cb) { Object.assign(memory, obj); if (cb) cb(); return Promise.resolve(); },
    remove: function (keys, cb) {
      (Array.isArray(keys) ? keys : [keys]).forEach(function (k) { delete memory[k]; });
      if (cb) cb();
      return Promise.resolve();
    },
    clear: function (cb) { Object.keys(memory).forEach(function (k) { delete memory[k]; }); if (cb) cb(); return Promise.resolve(); }
  };
}

w.chrome = {
  runtime: {
    id: 'test-extension-id',
    lastError: null,
    getURL: function (p) { return 'chrome-extension://test/' + p; },
    getManifest: function () { return { version: MANIFEST_VERSION }; },
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
  action: { setIcon: function () {}, setBadgeText: function () {}, setBadgeBackgroundColor: function () {}, setTitle: function () {} },
  i18n: { getUILanguage: function () { return 'ru'; } }
};

w.eval(readFileSync('dist/bundles/shared.js', 'utf8'));
w.eval(readFileSync('dist/bundles/ui.js', 'utf8'));
w.eval(readFileSync('dist/options/options.js', 'utf8'));

function sleep(ms) {
  return new Promise(function (r) { setTimeout(r, ms); });
}

sleep(150).then(async function () {
  const doc = w.document;
  const A = w.AONC;

  // --- 1. Карта разделов -----------------------------------------------------
  const cov = A.ui.studioSections.coverage();
  check('KEYMAP покрывает все разделы', cov.ok, 'missing=' + cov.missing.join(',') + ' unknown=' + cov.unknown.join(','));

  const clean = A.config.normalize.createConfig();
  A.ui.state.replace(clean);
  check('чистый конфиг не помечен как изменённый (cosmetics)', !A.ui.studioSections.isDirty('cosmetics', A.ui.state.current()));

  A.ui.state.set('chat.fontSize', 3, { save: false });
  A.ui.state.set('identity.name', 'Тест', { save: false });
  A.ui.state.set('cosmetics.framesOn', true, { save: false });
  A.ui.state.set('meta.favorites', ['theme.accent'], { save: false });

  const cfg = A.ui.state.current();
  check('chat помечен изменённым вместе с identity', A.ui.studioSections.isDirty('chat', cfg),
    'ключи: ' + A.ui.studioSections.dirtyKeys('chat', cfg).join(','));
  check('cosmetics помечен изменённым', A.ui.studioSections.isDirty('cosmetics', cfg));
  check('favorites помечен изменённым по пути meta.favorites', A.ui.studioSections.isDirty('favorites', cfg));
  check('разделы без настроек не врут про изменения', !A.ui.studioSections.isDirty('features', cfg) && !A.ui.studioSections.isDirty('help', cfg));

  const nav = doc.getElementById('nav');
  check('в меню есть точка «изменено» у chat', !!nav.querySelector('button:nth-child(6) .dot') || nav.innerHTML.indexOf('class="dot"') !== -1);

  // сброс только своего раздела
  A.ui.studioSections.resetChanges('favorites');
  check('сброс раздела favorites вернул meta.favorites', A.ui.state.get('meta.favorites').length === 0);
  check('сброс favorites не задел chat', A.ui.state.get('chat.fontSize') === 3);

  A.ui.state.replace(clean);

  // --- 2. Dirty-маркер у контрола -------------------------------------------
  const ctx = {
    custom: A.ui.custom,
    expandedRule: null,
    expandedSnippet: null,
    expandedWallpaperRule: null,
    debouncedRefresh: function () {},
    refresh: function () {},
    refreshAll: function () {},
    jump: function () {},
    activeSection: function () { return 'theme'; }
  };

  A.ui.state.set('theme.accent', '#ff0055', { save: false });
  let node = A.ui.renderer.renderControl({ type: 'color', path: 'theme.accent', label: 'Акцент' }, ctx);
  check('у изменённого контрола есть кнопка возврата', !!node.querySelector('.dirty-mark'));

  node.querySelector('.dirty-mark').click();
  await sleep(20);
  check('клик по точке вернул исходное значение', A.ui.state.get('theme.accent') === A.config.DEFAULTS.theme.accent,
    'получено ' + A.ui.state.get('theme.accent'));

  A.ui.state.replace(clean);
  node = A.ui.renderer.renderControl({ type: 'color', path: 'theme.accent', label: 'Акцент' }, ctx);
  check('у чистого контрола точки нет', !node.querySelector('.dirty-mark'));

  // --- 3. История: персистентность и откат на N шагов ------------------------
  A.ui.history.clear();
  A.ui.history.adopt(A.ui.state.current());
  check('история переведена в персистентный режим', A.ui.history.isPersistent());

  A.ui.state.set('theme.accent', '#111111', { save: false });
  await sleep(900);
  A.ui.state.set('theme.accent', '#222222', { save: false });
  await sleep(900);
  A.ui.state.set('theme.accent', '#333333', { save: false });
  await sleep(20);

  const entries = A.ui.history.entries();
  check('в истории три шага', entries.length === 3, 'получено ' + entries.length);
  check('записи истории имеют подпись и время', entries.every(function (e) { return e.label && e.label.indexOf('theme.accent') !== -1; }),
    entries.map(function (e) { return e.label; }).join(' | '));
  check('снапшоты истории легли в localStorage', !!w.localStorage.getItem('aonc.studio.history.v1'));

  // «перезагрузка» студии: новый набор модулей должен поднять историю из storage
  const saved = w.localStorage.getItem('aonc.studio.history.v1');
  const dom2 = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'https://animeon.cc/studio', pretendToBeVisual: true, runScripts: 'outside-only'
  });
  const w2 = dom2.window;
  w2.chrome = w.chrome;
  w2.localStorage.setItem('aonc.studio.history.v1', saved);
  w2.eval(readFileSync('dist/bundles/shared.js', 'utf8'));
  w2.eval(readFileSync('dist/bundles/ui.js', 'utf8'));
  const A2 = w2.AONC;
  A2.ui.state.replace(clean);
  const restored = A2.ui.history.adopt(clean);
  check('история восстановлена после перезагрузки студии', restored && A2.ui.history.depth().undo === 3,
    'depth=' + JSON.stringify(A2.ui.history.depth()));

  const rewound = A2.ui.history.jump(2);
  check('jump(2) отдаёт состояние до всех трёх шагов',
    !!rewound && A2.ui.path.get(rewound, 'theme.accent') === A.config.DEFAULTS.theme.accent,
    'получено ' + A2.ui.path.get(rewound || {}, 'theme.accent'));

  const other = A2.lang.clone(clean);
  other.theme.accent = '#00ff00';
  A2.ui.history.clear();
  A2.ui.state.set('theme.accent', '#123456', { save: false });
  const staleRestore = A2.ui.history.adopt(other);
  check('чужой конфиг сбрасывает историю (защита от устаревших снапшотов)', !staleRestore,
    'depth=' + JSON.stringify(A2.ui.history.depth()));
  dom2.window.close();

  // --- 4. Поиск: значения, транслит, нечёткий матч, подсветка ----------------
  A.ui.state.replace(clean);
  A.ui.state.set('layout.density', 128, { save: false });

  let found = A.ui.studioSearch.match('128');
  check('поиск находит настройку по текущему значению', found.some(function (e) { return e.control.path === 'layout.density'; }),
    'топ: ' + found.slice(0, 3).map(function (e) { return e.control.path; }).join(','));

  found = A.ui.studioSearch.match('fon');
  check('транслит: «fon» находит настройки фона', found.length > 0 && found.some(function (e) {
    return (e.control.path || '').indexOf('wallpaper') === 0 || /фон/i.test(e.control.label || '');
  }), 'топ: ' + found.slice(0, 3).map(function (e) { return e.control.label; }).join(','));

  found = A.ui.studioSearch.match('akcent');
  check('транслит: «akcent» находит акцент', found.length > 0 && found[0].control.path === 'theme.accent',
    'топ: ' + found.slice(0, 3).map(function (e) { return e.control.path; }).join(','));

  found = A.ui.studioSearch.match(A.config.DEFAULTS.theme.accent.toLowerCase());
  check('поиск по hex-значению цвета', found.some(function (e) { return e.control.path === 'theme.accent'; }),
    'топ: ' + found.slice(0, 3).map(function (e) { return e.control.path; }).join(','));

  const hl = A.ui.studioSearch.highlight('Акцентный цвет', 'akcent');
  check('подсветка совпадения ставит <mark> на нужные символы',
    hl.some(function (n) { return n.tagName === 'MARK' && n.textContent === 'Акцент'; }),
    hl.map(function (n) { return n.tagName + ':' + n.textContent; }).join(' | '));

  const searchView = A.ui.studioSearch.render('плотность', ctx, function () {});
  check('выдача поиска показывает текущее значение', searchView.querySelectorAll('.search-value').length > 0);
  check('выдача поиска показывает путь конфига', searchView.querySelectorAll('.search-path').length > 0);
  A.ui.state.replace(clean);

  // --- 5. Пакет темы: состав, экспорт, слияние при импорте -------------------
  A.ui.state.replace(clean);
  A.ui.state.set('theme.accent', '#00ff88', { save: false });
  A.ui.state.set('chat.fontSize', 4, { save: false });
  A.ui.state.set('cosmetics.framesOn', true, { save: false });

  const payload = A.ui.themePackage.build(A.ui.state.current(), ['theme', 'chat', 'cosmetics'], { name: 'Тест-пакет' });
  const json = JSON.stringify(payload);
  check('пакет содержит выбранные части', payload.kind === 'aonc-package' && !!payload.chat && !!payload.cosmetics && payload.parts.indexOf('chat') !== -1);
  check('палитра в пакете есть всегда', !!payload.theme && payload.theme.accent === '#00ff88');
  check('лишние части в пакет не попали', payload.layout === undefined && payload.glass === undefined);

  A.ui.state.replace(clean);
  const parsed = A.ui.themePackage.parse(json);
  check('разбор пакета: части определены', !parsed.error && parsed.parts.indexOf('cosmetics') !== -1, JSON.stringify(parsed.parts));
  const applied = A.ui.themePackage.apply(parsed);
  check('импорт пакета сливается с настройками', applied.applied.length === 3 &&
    A.ui.state.get('theme.accent') === '#00ff88' && A.ui.state.get('chat.fontSize') === 4 && A.ui.state.get('cosmetics.framesOn') === true,
    'applied=' + applied.applied.join(','));
  check('импорт пакета не затронул другие разделы', A.ui.state.get('layout.density') === A.config.DEFAULTS.layout.density);

  const legacy = JSON.stringify({ kind: 'aonc-theme', name: 'Старая тема', theme: { accent: '#abcdef' }, wallpaper: { enabled: true } });
  const legacyParsed = A.ui.themePackage.parse(legacy);
  check('старый формат темы распознаётся', !legacyParsed.error && legacyParsed.parts.join(',') === 'theme,wallpaper',
    JSON.stringify(legacyParsed.parts));

  A.ui.state.replace(clean);
  const entry = A.ui.themeIo.importTheme(legacy, ctx);
  check('импорт старой темы создаёт запись в «Мои темы»', !!entry && A.ui.state.get('customThemes').length === 1);
  check('у импортированной темы записан состав', entry.parts.join(',') === 'theme,wallpaper');

  const bundleParsed = A.ui.themePackage.parse(JSON.stringify({ kind: 'aonc-bundle', config: clean, profiles: [] }));
  check('бандл профиля не путается с пакетом темы', bundleParsed.kind === 'aonc-bundle');

  // диалог экспорта
  const dialog = A.ui.themeIo.openExportDialog(ctx);
  const overlay = doc.querySelector('.exp-overlay');
  check('диалог экспорта открывается', !!overlay && !!doc.querySelector('.exp-panel'));
  const themeBox = overlay.querySelector('input[data-part="theme"]');
  check('палитра в диалоге обязательна', !!themeBox && themeBox.checked && themeBox.disabled);
  check('в диалоге есть все части каталога', overlay.querySelectorAll('input[data-part]').length === A.ui.themePackage.PARTS.length);
  const allButton = Array.prototype.filter.call(overlay.querySelectorAll('button'), function (b) { return b.textContent === 'Всё'; })[0];
  allButton.click();
  check('кнопка «Всё» включает все части', overlay.querySelectorAll('input[data-part]:checked').length === A.ui.themePackage.PARTS.length);
  check('показан размер пакета', /КБ/.test((doc.getElementById('aonc-exp-size') || {}).textContent || ''));
  dialog.close();
  check('диалог закрывается', !doc.querySelector('.exp-overlay'));
  A.ui.state.replace(clean);

  // --- 6. Метки NEW в меню ---------------------------------------------------
  A.ui.newSections.reset();
  const unseen = A.ui.newSections.unseen();
  check('есть разделы с меткой NEW', unseen.length > 0, unseen.join(','));

  const btns = nav.querySelectorAll('button');
  const cosIndex = A.ui.sections.ORDER.indexOf('cosmetics');
  check('в меню стоит метка NEW', !!btns[cosIndex].querySelector('.nav-new'));
  btns[cosIndex].click();
  await sleep(30);
  check('метка NEW снимается после захода в раздел', !doc.getElementById('nav').querySelectorAll('button')[cosIndex].querySelector('.nav-new'));
  check('markSeen запоминает просмотр', A.ui.newSections.isUnseen('cosmetics') === false);
  A.ui.newSections.markAllSeen();
  check('«убрать все метки» очищает список', A.ui.newSections.unseen().length === 0);
  A.ui.newSections.reset();

  // --- 7. Лента изменений и реестр кастомных контролов -----------------------
  const histNode = A.ui.custom.historyList({ type: 'historyList', id: 'historyList' }, ctx);
  check('лента изменений рендерится', !!histNode && !!histNode.querySelector('.list-head'));

  const missing = Object.keys(A.ui.renderer.CUSTOM_TYPES).filter(function (type) {
    return typeof A.ui.custom[type] !== 'function';
  });
  check('все кастомные типы из реестра зарегистрированы', missing.length === 0, missing.join(','));

  const helpNode = A.ui.renderer.renderSection(A.ui.sections.byId('help'), ctx);
  check('в «Справке» появилась лента изменений', !!helpNode.querySelector('.ctl-historyList'));
  check('в «Справке» нет блока «Что нового»', !/Что нового/.test(helpNode.textContent) && !helpNode.querySelector('.cl-entry'));

  const customNode = A.ui.renderer.renderControl({ type: 'historyList', id: 'historyList' }, ctx);
  check('рендер помечает кастомный контрол классом', customNode.classList.contains('ctl-historyList'));

  check('версия совпадает в namespace, манифесте и package.json',
    A.VERSION === MANIFEST_VERSION && A.VERSION === PKG_VERSION,
    'A.VERSION=' + A.VERSION + ' manifest=' + MANIFEST_VERSION + ' package=' + PKG_VERSION);
  check('changelog содержит текущую версию', A.config.changelog.latest().version === A.VERSION,
    'latest=' + A.config.changelog.latest().version);

  dom.window.close();

  if (failures.length) {
    console.log('TEST STUDIO QA FAIL: ' + failures.join(', '));
    process.exit(1);
  }
  console.log('TEST STUDIO QA: OK (' + passed + ' проверок)');
}).catch(function (e) {
  console.log('TEST STUDIO QA CRASH: ' + (e && e.stack || e));
  process.exit(1);
});
