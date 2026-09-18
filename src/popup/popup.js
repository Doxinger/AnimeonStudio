/*! AnimeOn Studio — панель расширения (popup) */
(function () {
  'use strict';

  var A = window.AONC;
  if (!A || !A.ui || !A.ui.state) return;

  var state = A.ui.state;
  var store = A.config.store;
  var pathUtil = A.ui.path;
  var history = A.ui.history;
  var icons = A.ui.icons;
  var i18n = A.ui.i18n;
  var el = A.ui.controls.el;
  var convert = A.color.convert;
  var transform = A.color.transform;
  var contrast = A.color.contrast;
  var T = A.messaging.TYPE;
  var msg = A.messaging.msg;

  // --- Константы панели ---------------------------------------------------

  var SECTION_KEY = 'aonc.studio.section';
  var LIVE_MS = 130;      // как часто пишем в storage во время перетаскивания
  var SAVE_MS = 70;       // склейка быстрых дискретных изменений
  var PING_MS = 1200;     // ждём ответа вкладки
  var SAVED_MS = 1800;    // сколько показываем «сохранено»

  var ACCENTS = ['#7C4DFF', '#6C8CFF', '#22D3EE', '#3DDC84', '#FABD2F', '#FF7A45', '#FF6B9D', '#E4E4E7'];

  var SLIDERS = [
    {
      id: 'density', path: 'layout.density', min: 60, max: 160, step: 1, suffix: '%',
      key: 'popup.slider.density', ru: 'Плотность',
      hintKey: 'popup.slider.density.hint', hintRu: 'Отступы и размеры элементов по всему сайту'
    },
    {
      id: 'text', path: 'typography.textScale', min: 60, max: 220, step: 1, suffix: '%',
      key: 'popup.slider.text', ru: 'Кегль текста',
      hintKey: 'popup.slider.text.hint', hintRu: 'Размер текста на сайте'
    },
    {
      id: 'poster', path: 'layout.posterScale', min: 50, max: 220, step: 5, suffix: '%',
      key: 'popup.slider.poster', ru: 'Размер карточек',
      hintKey: 'popup.slider.poster.hint', hintRu: 'Постеры в каталоге и на главной'
    },
    {
      id: 'radius', path: 'theme.radius', min: 0, max: 32, step: 1, suffix: 'px',
      key: 'popup.slider.radius', ru: 'Скругление',
      hintKey: 'popup.slider.radius.hint', hintRu: 'Радиус углов карточек и кнопок'
    },
    {
      id: 'blur', path: 'glass.blur', min: 0, max: 40, step: 1, suffix: 'px',
      key: 'popup.slider.blur', ru: 'Стекло шапки',
      hintKey: 'popup.slider.blur.hint', hintRu: 'Размытие прозрачной шапки',
      needs: 'glass.enabled', needsKey: 'popup.slider.blur.off', needsRu: 'Стекло выключено — включите в студии'
    }
  ];

  var MODES = [
    { id: 'theater', icon: 'panel-right', key: 'popup.mode.theater', ru: 'Театр', type: T.THEATER_TOGGLE },
    { id: 'cinema', icon: 'moon', key: 'popup.mode.cinema', ru: 'Киносвет', type: T.CINEMA_TOGGLE },
    { id: 'max', icon: 'maximize', key: 'popup.mode.max', ru: 'Максимум', type: T.STATE_SET, payload: { key: 'maxplayer' } },
    { id: 'picker', icon: 'crosshair', key: 'popup.mode.picker', ru: 'Пипетка', type: T.PICKER_START }
  ];

  var QUICK_HIDE = [
    'ads', 'premium', 'battlepass', 'roadmap', 'mangaTeaser',
    'heroSlider', 'news', 'cookieBanner', 'popups', 'footer'
  ];

  var SAVE_TEXT = {
    ready: 'готово', saving: 'сохранение…', saved: 'сохранено',
    error: 'ошибка записи', sync: 'обновлено из студии'
  };

  // --- Состояние панели ---------------------------------------------------

  var IDS = [
    'shell', 'site-state', 'site-state-text', 'master', 'savebar', 'banner', 'banner-ic',
    'banner-text', 'banner-act', 'banner-act2', 'body', 'presets', 'accent-dots', 'accent', 'sliders',
    'modes', 'modes-hint', 'blk-profiles', 'profiles', 'quick-hide', 'all-hide-text',
    'save-state', 'btn-undo', 'btn-redo', 'btn-reload', 'btn-studio', 'stale', 'stale-act',
    'all-themes', 'all-profiles', 'all-hide', 'tune-hint'
  ];

  var ui = {};
  var nodes = { presets: [], swatches: [], sliders: {}, modes: {}, hides: {}, profiles: [] };
  var ruText = {};
  var ruTitle = {};
  var ruAria = {};

  var tab = { id: null, url: '', host: '', onSite: false, alive: false, modes: {}, checking: true };
  var saveStamp = 0;
  var saveTimer = 0;
  var flushTimer = 0;
  var savedTimer = 0;
  var drag = { active: false, key: '', before: null };
  var lastLocale = '';
  var renderedPresets = '\u0000';
  var bannerSig = '\u0000';
  var presetRevealed = false;

  // --- Мелкие помощники ---------------------------------------------------

  function t(key, fallback) {
    return i18n.t(key, fallback);
  }

  function clear(node) {
    if (node) node.textContent = '';
  }

  function icon(name, size) {
    return icons.el(name, size || 14, '');
  }

  function injectIcons(root) {
    var list = (root || document).querySelectorAll('[data-icon]');
    Array.prototype.forEach.call(list, function (node) {
      var name = node.getAttribute('data-icon');
      var size = Number(node.getAttribute('data-icon-size') || 14);
      var markup = icons.svgMarkup(name, size, '');
      node.removeAttribute('data-icon');
      if (!markup) return;
      node.classList.add('ic-wrap');
      node.innerHTML = markup;
    });
  }

  function withTimeout(promise, ms) {
    return new Promise(function (resolve) {
      var done = false;
      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        resolve(null);
      }, ms);
      promise.then(function (value) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(value);
      }, function () {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(null);
      });
    });
  }

  function unwrap(response) {
    if (!response) return null;
    if (response.ok === false) return null;
    return response.value !== undefined ? response.value : response;
  }

  function send(type, payload) {
    return A.api.sendMessage(msg(type, payload || {})).then(unwrap).catch(function () { return null; });
  }

  function sendToTab(type, payload) {
    if (tab.id == null || !A.api.tabs) return Promise.resolve(null);
    return withTimeout(A.api.tabs.sendMessage(tab.id, msg(type, payload || {})), PING_MS)
      .then(unwrap)
      .catch(function () { return null; });
  }

  function hostOf(url) {
    try { return new URL(url).hostname; } catch (e) { return ''; }
  }

  // --- Текст и локализация ------------------------------------------------

  function collectTexts() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n]'), function (node) {
      var key = node.getAttribute('data-i18n');
      if (!(key in ruText)) ruText[key] = (node.textContent || '').trim();
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n-title]'), function (node) {
      var key = node.getAttribute('data-i18n-title');
      if (!(key in ruTitle)) ruTitle[key] = node.getAttribute('title') || '';
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n-aria]'), function (node) {
      var key = node.getAttribute('data-i18n-aria');
      if (!(key in ruAria)) ruAria[key] = node.getAttribute('aria-label') || '';
    });
  }

  function applyTexts() {
    var en = i18n.locale() === 'en';
    lastLocale = i18n.locale();
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n]'), function (node) {
      var key = node.getAttribute('data-i18n');
      node.textContent = en ? (i18n.EN[key] || ruText[key] || node.textContent) : (ruText[key] || node.textContent);
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n-title]'), function (node) {
      var key = node.getAttribute('data-i18n-title');
      node.setAttribute('title', en ? (i18n.EN[key] || ruTitle[key]) : ruTitle[key]);
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n-aria]'), function (node) {
      var key = node.getAttribute('data-i18n-aria');
      node.setAttribute('aria-label', en ? (i18n.EN[key] || ruAria[key]) : ruAria[key]);
    });
    ui.master.setAttribute('aria-label', t('popup.master', 'Включить или выключить расширение'));
    ui.accent.setAttribute('aria-label', t('popup.accentCustom', 'Свой цвет акцента'));
    document.documentElement.setAttribute('lang', en ? 'en' : 'ru');
  }

  // --- Оформление под текущую тему ---------------------------------------

  function prefersLight() {
    try {
      return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches);
    } catch (e) { return false; }
  }

  function applyChrome(config) {
    var theme = config.theme || {};
    var accent = convert.sanitize(theme.accent, '#7C4DFF');
    var root = document.documentElement;
    var scheme = theme.mode === 'light' ? 'light' : (theme.mode === 'auto' ? (prefersLight() ? 'light' : 'dark') : 'dark');

    root.style.setProperty('--accent', accent);
    root.style.setProperty('--accent-2', transform.lighten(accent, 0.18));
    root.style.setProperty('--accent-glow', convert.rgba(accent, scheme === 'light' ? 0.18 : 0.24));
    root.style.setProperty('--accent-fg', contrast.readableOn(accent));
    root.setAttribute('data-scheme', scheme);
    document.body.classList.toggle('off', !config.meta || !config.meta.enabled);
    if (ui.body) ui.body.inert = !(config.meta && config.meta.enabled);
  }

  function applyFormFactor() {
    var wide = false;
    try { wide = window.innerWidth >= 620 && window.innerHeight >= 460; } catch (e) { wide = false; }
    document.documentElement.classList.toggle('as-page', wide);
  }

  // --- Запись конфигурации ------------------------------------------------

  function setStatus(kind, text) {
    if (!ui['save-state']) return;
    ui['save-state'].setAttribute('data-k', kind);
    ui['save-state'].textContent = text || t('popup.save.' + kind, SAVE_TEXT[kind] || '');
    if (ui.savebar) ui.savebar.classList.toggle('busy', kind === 'saving');
    if (savedTimer) { clearTimeout(savedTimer); savedTimer = 0; }
    if (kind === 'saved' || kind === 'sync') {
      savedTimer = setTimeout(function () {
        savedTimer = 0;
        setStatus('ready');
      }, SAVED_MS);
    }
  }

  function doSave() {
    setStatus('saving');
    return store.save(state.current()).then(function (saved) {
      saveStamp = (saved && saved.meta && saved.meta.lastEdited) || 0;
      if (!drag.active) state.replace(saved);
      setStatus('saved');
      updateHistory();
      return saved;
    }).catch(function () {
      setStatus('error');
    });
  }

  function save(immediate) {
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = 0; }
    if (immediate) return doSave();
    setStatus('saving');
    saveTimer = setTimeout(function () {
      saveTimer = 0;
      doSave();
    }, SAVE_MS);
    return Promise.resolve();
  }

  function write(changes) {
    state.setMany(changes, { save: false, preview: false });
    save();
  }

  function writeOne(p, value) {
    var changes = {};
    changes[p] = value;
    write(changes);
  }

  // Живое перетаскивание: значение сразу в конфиге в памяти, запись в storage —
  // не чаще LIVE_MS, история — один шаг на всё перетаскивание.
  function liveBegin(key) {
    if (drag.active) return;
    drag.active = true;
    drag.key = key;
    drag.before = A.lang.clone(state.current());
    setStatus('saving');
  }

  function liveSet(p, value) {
    pathUtil.set(state.current(), p, value);
    state.state.dirty = true;
    if (flushTimer) return;
    flushTimer = setTimeout(function () {
      flushTimer = 0;
      if (!drag.active) return;
      doSave();
    }, LIVE_MS);
  }

  function liveEnd(p, value) {
    pathUtil.set(state.current(), p, value);
    if (flushTimer) { clearTimeout(flushTimer); flushTimer = 0; }
    if (drag.active && drag.before) history.record(drag.before, drag.key || p);
    drag.active = false;
    drag.before = null;
    drag.key = '';
    save(true);
  }

  function updateHistory() {
    if (!ui['btn-undo']) return;
    var depth = history.depth();
    var entries = depth.undo ? history.entries() : [];
    ui['btn-undo'].disabled = !depth.undo;
    ui['btn-redo'].disabled = !depth.redo;
    ui['btn-undo'].setAttribute('title', depth.undo && entries[0]
      ? t('popup.undo', 'Отменить') + ': ' + entries[0].label + ' (Ctrl+Z)'
      : t('popup.undoEmpty', 'Отменять нечего'));
    ui['btn-redo'].setAttribute('title', t('popup.redo', 'Повторить') + ' (Ctrl+Shift+Z)');
  }

  function doUndo() {
    var prev = history.undo();
    if (!prev) return;
    state.replace(prev);
    save(true);
  }

  function doRedo() {
    var next = history.redo();
    if (!next) return;
    state.replace(next);
    save(true);
  }

  // --- Тема: пресеты и акцент --------------------------------------------

  function paletteOf(themePatch) {
    return A.color.palette.fromTheme(Object.assign({}, A.config.DEFAULTS.theme, themePatch || {}));
  }

  function presetName(preset) {
    var name = preset.id === 'original' ? t('popup.preset.original', preset.name) : preset.name;
    return String(name).replace(/\s*\(светлая\)\s*$/, '').replace(/\s*\(light\)\s*$/i, '');
  }

  function applyPreset(id) {
    var changes = {};
    var patch = A.config.presets.themePatch(id);
    Object.keys(patch).forEach(function (k) { changes['theme.' + k] = patch[k]; });
    changes['theme.preset'] = id;
    changes['meta.activeThemeId'] = '';
    write(changes);
  }

  function applyMyTheme(entry) {
    var changes = {};
    var parts = Array.isArray(entry.parts) && entry.parts.length ? entry.parts : ['theme', 'wallpaper'];
    parts.forEach(function (id) {
      if (entry[id] === undefined || entry[id] === null) return;
      if (!A.config.DEFAULTS[id]) return;
      changes[id] = A.lang.normalize(A.config.DEFAULTS[id], A.lang.clone(entry[id]));
    });
    if (!changes.theme) changes.theme = A.lang.normalize(A.config.defaults.theme, entry.theme);
    if (!changes.theme.preset) changes.theme.preset = 'custom';
    changes['meta.activeThemeId'] = entry.id;
    write(changes);
  }

  function makeChip(opts) {
    var node = el('button', {
      class: 'pchip' + (opts.mine ? ' mine' : ''),
      type: 'button',
      title: opts.title || opts.name,
      'aria-pressed': 'false',
      onclick: opts.onclick
    }, [
      el('i', { class: 'sw-dot', style: 'background:' + opts.swatch }),
      el('span', { class: 'chip-name', text: opts.name })
    ]);
    node.__id = opts.id;
    node.__kind = opts.mine ? 'mine' : 'preset';
    node.__on = false;
    return node;
  }

  // Подпись списка своих тем: перерисовываем рельсу, только когда он реально
  // изменился (загрузка конфига, правка темы в студии, смена языка).
  function presetsSignature() {
    return (state.get('customThemes') || []).map(function (entry) {
      return [entry.id, entry.name || '', entry.updatedAt || 0].join(':');
    }).join('|') + '|' + i18n.locale();
  }

  function refreshPresets() {
    var signature = presetsSignature();
    if (signature === renderedPresets) { updatePresets(); return; }
    renderPresets();
  }

  function renderPresets() {
    clear(ui.presets);
    nodes.presets = [];
    renderedPresets = presetsSignature();

    A.config.presets.LIST.forEach(function (preset) {
      var palette = paletteOf(preset);
      var node = makeChip({
        id: preset.id,
        name: presetName(preset),
        title: preset.name,
        swatch: 'linear-gradient(135deg,' + palette.background + ' 12%,' + palette.primary + ')',
        onclick: function () { applyPreset(preset.id); }
      });
      ui.presets.appendChild(node);
      nodes.presets.push(node);
    });

    (state.get('customThemes') || []).forEach(function (entry) {
      var palette = paletteOf(entry.theme || {});
      var name = entry.name || t('popup.myThemeUnnamed', 'Без имени');
      var node = makeChip({
        id: entry.id,
        mine: true,
        name: name,
        title: t('popup.myTheme', 'Моя тема') + ': ' + name,
        swatch: 'linear-gradient(135deg,' + palette.background + ' 12%,' + palette.primary + ')',
        onclick: function () { applyMyTheme(entry); }
      });
      ui.presets.appendChild(node);
      nodes.presets.push(node);
    });

    ui.presets.appendChild(el('button', {
      class: 'pchip more', type: 'button',
      title: t('popup.allThemesTitle', 'Все темы, обои и свои палитры — в студии'),
      onclick: function () { openStudio('theme'); }
    }, [icon('sparkles', 12), el('span', { class: 'chip-name', text: t('popup.allThemes', 'Все темы') })]));

    updatePresets();
  }

  // Рельса длинная: при первом открытии подводим активный пресет в середину,
  // дальше скролл не трогаем — он принадлежит пользователю.
  function revealActivePreset() {
    if (presetRevealed) return;
    var active = ui.presets.querySelector('.pchip.on');
    if (!active) return;
    presetRevealed = true;
    var left = (active.offsetLeft || 0) - (ui.presets.clientWidth - (active.offsetWidth || 0)) / 2;
    if (left > 0) ui.presets.scrollLeft = left;
  }

  function updatePresets() {
    var activeId = state.get('meta.activeThemeId') || '';
    var preset = state.get('theme.preset');
    nodes.presets.forEach(function (node) {
      var on = node.__kind === 'mine' ? (!!activeId && activeId === node.__id) : (!activeId && preset === node.__id);
      if (on === node.__on) return;
      node.__on = on;
      node.classList.toggle('on', on);
      node.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function renderSwatches() {
    clear(ui['accent-dots']);
    nodes.swatches = [];
    ACCENTS.forEach(function (color) {
      var node = el('button', {
        class: 'swatch', type: 'button', title: color,
        style: 'background:' + color,
        'aria-pressed': 'false',
        onclick: function () { writeOne('theme.accent', color); }
      });
      node.__color = color.toLowerCase();
      ui['accent-dots'].appendChild(node);
      nodes.swatches.push(node);
    });
    updateSwatches();
  }

  function updateSwatches() {
    var current = String(convert.sanitize(state.get('theme.accent'), '#7C4DFF')).toLowerCase();
    if (ui.accent.value.toLowerCase() !== current) ui.accent.value = current;
    nodes.swatches.forEach(function (node) {
      var on = node.__color === current;
      if (on === node.__on) return;
      node.__on = on;
      node.classList.toggle('on', on);
      node.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  // --- Слайдеры -----------------------------------------------------------

  function defaultOf(def) {
    var v = pathUtil.get(A.config.DEFAULTS, def.path);
    return typeof v === 'number' ? v : def.min;
  }

  function formatOf(def, value) {
    return Math.round(Number(value)) + (def.suffix || '');
  }

  function paintSlider(def, value) {
    var n = nodes.sliders[def.id];
    if (!n) return;
    var v = Number(value);
    var ratio = (v - def.min) / Math.max(1, def.max - def.min);
    n.input.style.setProperty('--p', String(Math.max(0, Math.min(1, ratio))));
    n.out.textContent = formatOf(def, v);
    n.input.setAttribute('aria-valuetext', formatOf(def, v));
    n.row.classList.toggle('changed', Math.round(v) !== Math.round(defaultOf(def)));
  }

  function syncSlider(def) {
    if (!def) return;
    var n = nodes.sliders[def.id];
    if (!n) return;
    var value = Number(state.get(def.path, defaultOf(def)));
    if (String(n.input.value) !== String(value)) n.input.value = String(value);
    paintSlider(def, value);
    if (def.needs) {
      var ok = !!state.get(def.needs);
      n.row.classList.toggle('muted', !ok);
      n.input.disabled = !ok;
      n.row.setAttribute('title', ok ? t(def.hintKey, def.hintRu) : t(def.needsKey, def.needsRu));
    }
  }

  function syncSliders() {
    SLIDERS.forEach(syncSlider);
  }

  function renderSliders() {
    clear(ui.sliders);
    nodes.sliders = {};

    SLIDERS.forEach(function (def) {
      var inputId = 'sld-' + def.id;
      var input = el('input', {
        type: 'range', id: inputId,
        min: String(def.min), max: String(def.max), step: String(def.step),
        'aria-label': t(def.key, def.ru)
      });
      var out = el('output', { class: 'sld-val', for: inputId, title: t('popup.resetValue', 'Сбросить значение') });
      var name = el('label', { class: 'sld-name', for: inputId, text: t(def.key, def.ru), title: t(def.hintKey, def.hintRu) });
      var rst = el('button', {
        class: 'rst', type: 'button',
        title: t('popup.reset', 'Сбросить'),
        'aria-label': t('popup.reset', 'Сбросить') + ': ' + t(def.key, def.ru),
        onclick: function () { resetSlider(def); }
      });
      rst.innerHTML = icons.svgMarkup('rotate-ccw', 12, '');
      rst.classList.add('ic-wrap');

      input.addEventListener('input', function () {
        var v = Number(input.value);
        liveBegin(def.path);
        paintSlider(def, v);
        liveSet(def.path, v);
        applyChrome(state.current());
      });
      input.addEventListener('change', function () {
        liveEnd(def.path, Number(input.value));
      });
      input.addEventListener('dblclick', function () { resetSlider(def); });
      out.addEventListener('click', function () { resetSlider(def); });

      var row = el('div', { class: 'sld', 'data-path': def.path }, [name, out, el('div', { class: 'sld-row' }, [input, rst])]);
      ui.sliders.appendChild(row);
      nodes.sliders[def.id] = { row: row, input: input, out: out, rst: rst, def: def };
      syncSlider(def);
    });
  }

  function resetSlider(def) {
    var value = defaultOf(def);
    writeOne(def.path, value);
  }

  // --- Режимы просмотра ---------------------------------------------------

  function renderModes() {
    clear(ui.modes);
    nodes.modes = {};
    MODES.forEach(function (def) {
      var node = el('button', {
        class: 'mode', type: 'button', 'aria-pressed': 'false',
        title: t(def.key, def.ru),
        onclick: function () { onMode(def); }
      }, [
        icon(def.icon, 16),
        el('span', { class: 'mode-label', text: t(def.key, def.ru) })
      ]);
      ui.modes.appendChild(node);
      nodes.modes[def.id] = node;
    });
    updateModes();
  }

  function updateModes() {
    MODES.forEach(function (def) {
      var node = nodes.modes[def.id];
      if (!node) return;
      var on = !!tab.modes[def.id];
      node.classList.toggle('on', on);
      node.setAttribute('aria-pressed', on ? 'true' : 'false');
      node.disabled = !tab.alive;
      node.setAttribute('title', tab.alive
        ? t(def.key, def.ru)
        : t('popup.modesNeedTab', 'Нужна открытая вкладка сайта'));
    });
    if (ui['modes-hint']) {
      ui['modes-hint'].textContent = tab.alive ? '' : t('popup.modesNeedTab', 'Нужна открытая вкладка сайта');
    }
  }

  function onMode(def) {
    if (!tab.alive) return;

    if (def.id === 'picker') {
      var stopping = !!tab.modes.picker;
      sendToTab(stopping ? T.PICKER_STOP : T.PICKER_START).then(function () {
        if (stopping) {
          tab.modes.picker = false;
          updateModes();
          return;
        }
        window.close();
      });
      return;
    }

    var optimistic = !tab.modes[def.id];
    tab.modes[def.id] = optimistic;
    updateModes();

    sendToTab(def.type, def.payload).then(function (data) {
      if (data && typeof data.on === 'boolean') tab.modes[def.id] = data.on;
      updateModes();
    });
  }

  // --- Скрытие блоков -----------------------------------------------------

  function renderHides() {
    clear(ui['quick-hide']);
    nodes.hides = {};
    QUICK_HIDE.forEach(function (key) {
      var def = A.config.selectors.visibility[key];
      if (!def) return;
      var text = i18n.t('ctl.visibility.' + key, def.label);
      var input = el('input', { type: 'checkbox', 'aria-label': text });
      var row = el('label', { class: 'tg', title: def.hint || text }, [input, el('span', { class: 'tg-t', text: text })]);
      input.addEventListener('change', function () {
        row.classList.toggle('on', input.checked);
        writeOne('visibility.' + key, input.checked);
      });
      ui['quick-hide'].appendChild(row);
      nodes.hides[key] = { row: row, input: input };
    });
    updateHides();
    updateHideCounter();
  }

  function updateHides() {
    QUICK_HIDE.forEach(function (key) {
      var n = nodes.hides[key];
      if (!n) return;
      var on = !!state.get('visibility.' + key);
      if (n.input.checked !== on) n.input.checked = on;
      n.row.classList.toggle('on', on);
    });
    updateHideCounter();
  }

  function updateHideCounter() {
    if (!ui['all-hide-text']) return;
    var visibility = state.get('visibility') || {};
    var total = Object.keys(A.config.selectors.visibility).length;
    var on = Object.keys(visibility).filter(function (k) { return !!visibility[k]; }).length;
    ui['all-hide-text'].textContent = on
      ? t('popup.allBlocksOn', 'Все блоки') + ' · ' + on + '/' + total
      : t('popup.allBlocks', 'Все блоки');
  }

  // --- Профили ------------------------------------------------------------

  function renderProfiles(list) {
    if (!list || !list.length) {
      ui['blk-profiles'].hidden = true;
      clear(ui.profiles);
      nodes.profiles = [];
      return;
    }
    ui['blk-profiles'].hidden = false;
    clear(ui.profiles);
    nodes.profiles = [];
    var active = state.get('meta.activeProfile') || '';

    list.forEach(function (profile) {
      var palette = paletteOf((profile.config && profile.config.theme) || {});
      var node = makeChip({
        id: profile.id,
        name: profile.name || t('popup.profileUnnamed', 'Профиль'),
        title: t('popup.profileApply', 'Применить профиль') + ': ' + (profile.name || ''),
        swatch: 'linear-gradient(135deg,' + palette.background + ' 12%,' + palette.primary + ')'
      });
      node.onclick = function () { activateProfile(profile); };
      node.__on = active === profile.id;
      node.classList.toggle('on', node.__on);
      node.setAttribute('aria-pressed', node.__on ? 'true' : 'false');
      ui.profiles.appendChild(node);
      nodes.profiles.push(node);
    });
  }

  function activateProfile(profile) {
    var before = A.lang.clone(state.current());
    setStatus('saving');
    A.config.profiles.activate(profile.id).then(function () {
      return store.load();
    }).then(function (config) {
      saveStamp = (config.meta && config.meta.lastEdited) || 0;
      state.replace(config);
      history.record(before, '*profile:' + profile.id);
      updateHistory();
      setStatus('saved');
      nodes.profiles.forEach(function (node) {
        var on = node.__id === profile.id;
        node.__on = on;
        node.classList.toggle('on', on);
        node.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }).catch(function () {
      setStatus('error');
    });
  }

  function loadProfiles() {
    if (!A.config.profiles || !A.config.profiles.loadAll) return Promise.resolve();
    return A.config.profiles.loadAll().then(renderProfiles).catch(function () {});
  }

  // --- Вкладка сайта ------------------------------------------------------

  function pillText() {
    if (!state.get('meta.enabled')) return t('popup.state.disabled', 'выключено');
    if (tab.checking) return t('popup.state.checking', 'проверка вкладки…');
    if (!tab.onSite) return tab.host ? tab.host : t('popup.state.off', 'вне сайта');
    if (!tab.alive) return t('popup.state.silent', 'обновите вкладку');
    return tab.host + ' · ' + t('popup.state.connected', 'подключено');
  }

  function applyTabState() {
    var kind = !tab.onSite ? 'off' : (tab.alive ? 'on' : (tab.checking ? 'checking' : 'silent'));
    document.body.setAttribute('data-tab', kind);
    ui['site-state-text'].textContent = pillText();
    ui['site-state'].setAttribute('title', tab.onSite
      ? t('popup.stateRecheck', 'Проверить вкладку')
      : t('popup.openSite', 'Открыть animeon.cc'));
    ui['btn-reload'].disabled = tab.id == null || !tab.onSite;
    ui['btn-reload'].setAttribute('title', tab.onSite
      ? t('popup.reload', 'Перезагрузить вкладку сайта')
      : t('popup.modesNeedTab', 'Нужна открытая вкладка сайта'));
    updateModes();
    updateBanner();
  }

  function openMirror(target) {
    var url = target || A.siteUrl('/');
    var api = A.api.raw;
    if (api && api.tabs && api.tabs.create) {
      try { api.tabs.create({ url: url }); window.close(); return; } catch (e) { /* ниже */ }
    }
    try { window.open(url, '_blank'); } catch (e) {}
  }

  function mirrorTarget() {
    if (!A.config || !A.config.mirrors) return A.siteUrl('/');
    return A.config.mirrors.mirrorUrl(tab.host || '', tab.onSite ? tab.url : '');
  }

  function updateBanner() {
    var text = '';
    var action = '';
    var action2 = '';
    var mirror = '';
    var tone = 'warn';

    if (!state.get('meta.enabled')) {
      tone = 'info';
      text = t('popup.banner.disabled', 'Расширение выключено — настройки сохраняются, но не применяются.');
      action = t('popup.banner.enable', 'Включить');
    } else if (tab.onSite && !tab.alive && !tab.checking) {
      text = t('popup.banner.silent', 'Вкладка не отвечает: обновите её, чтобы изменения применялись на лету.');
      action = t('popup.banner.reload', 'Обновить');
      action2 = t('popup.banner.mirrors', 'Открыть зеркало');
      mirror = mirrorTarget();
    } else if (!tab.onSite && !tab.checking) {
      text = t('popup.banner.offSite', 'Настройки сохраняются для animeon.cc и зеркал v1/v2.animeon.co. Откройте сайт, чтобы увидеть результат.');
      action = t('popup.banner.openSite', 'Открыть сайт');
    }

    var signature = [text, action, action2, tone].join('|');
    if (signature === bannerSig) return;
    bannerSig = signature;

    if (!text) {
      ui.banner.hidden = true;
      return;
    }

    ui.banner.hidden = false;
    ui.banner.setAttribute('data-tone', tone);
    ui['banner-text'].textContent = text;
    ui['banner-ic'].innerHTML = icons.svgMarkup(tone === 'info' ? 'info' : 'alert-triangle', 14, '');
    ui['banner-ic'].classList.add('ic-wrap');
    ui['banner-act'].hidden = !action;
    ui['banner-act'].textContent = action;
    ui['banner-act2'].hidden = !action2;
    ui['banner-act2'].textContent = action2;
    ui['banner-act2'].onclick = function () { openMirror(mirror); };
    ui['banner-act'].onclick = function () {
      if (!state.get('meta.enabled')) {
        writeOne('meta.enabled', true);
        ui.master.checked = true;
        return;
      }
      if (tab.onSite) reloadTab();
      else openSite();
    };
  }

  function detectTab() {
    if (!A.api.tabs) return Promise.resolve(null);
    return A.api.tabs.query({ active: true, currentWindow: true })
      .then(function (tabs) { return (tabs && tabs[0]) || null; })
      .catch(function () { return null; });
  }

  function afterTab(found) {
    tab.id = found && typeof found.id === 'number' ? found.id : null;
    tab.url = (found && found.url) || '';
    tab.host = hostOf(tab.url);
    tab.onSite = !!tab.url && A.isSiteUrl(tab.url);
    tab.checking = false;
    applyTabState();
    if (!tab.onSite || tab.id == null) {
      tab.alive = false;
      applyTabState();
      return null;
    }
    return ping();
  }

  function ping() {
    tab.checking = true;
    applyTabState();
    return sendToTab(T.PING).then(function (data) {
      tab.checking = false;
      tab.alive = !!(data && (data.pong || data.url));
      if (data && data.modes) {
        tab.modes.theater = !!data.modes.theater;
        tab.modes.cinema = !!data.modes.cinema;
        tab.modes.max = !!data.modes.maxplayer;
      }
      if (data) tab.modes.picker = !!data.picker;
      applyTabState();
      return data;
    });
  }

  function onPillClick() {
    if (!tab.onSite) { openSite(); return; }
    ping();
  }

  // --- Действия -----------------------------------------------------------

  function openStudio(section) {
    try {
      if (section && window.localStorage) window.localStorage.setItem(SECTION_KEY, section);
    } catch (e) { /* приватный режим — откроем без перехода */ }

    var api = A.api.raw;
    if (api && api.runtime && api.runtime.openOptionsPage) {
      try { api.runtime.openOptionsPage(); return; } catch (e) { /* упадём ниже */ }
    }
    var url = A.api.getURL('options/options.html');
    if (api && api.tabs && api.tabs.create) {
      try { api.tabs.create({ url: url }); return; } catch (e) { /* и дальше */ }
    }
    try { window.open(url, '_blank'); } catch (e) {}
  }

  function reloadTab() {
    if (tab.id != null && A.api.tabs && A.api.tabs.reload) {
      A.api.tabs.reload(tab.id).catch(function () { send(T.RELOAD_TAB); });
    } else {
      send(T.RELOAD_TAB);
    }
    window.close();
  }

  function openSite() {
    var url = A.siteUrl('/');
    var api = A.api.raw;
    if (api && api.tabs && api.tabs.create) {
      try { api.tabs.create({ url: url }); window.close(); return; } catch (e) { /* ниже */ }
    }
    try { window.open(url, '_blank'); } catch (e) {}
  }

  function showStale() {
    ui.stale.hidden = false;
    ui.shell.hidden = true;
    ui['stale-act'].addEventListener('click', function () {
      try { window.location.reload(); } catch (e) { window.close(); }
    });
  }

  // --- Синхронизация UI с конфигом ---------------------------------------

  function syncAll() {
    var config = state.current();
    if (i18n.locale() !== lastLocale) {
      applyTexts();
      renderDynamic();
    }
    applyChrome(config);
    ui.master.checked = !!(config.meta && config.meta.enabled);
    refreshPresets();
    updateSwatches();
    syncSliders();
    updateHides();
    updateHistory();
    applyTabState();
  }

  function syncPath(p) {
    var config = state.current();
    if (!p || p === '*') { syncAll(); return; }

    if (p === 'meta.enabled') {
      applyChrome(config);
      updateBanner();
      applyTabState();
      return;
    }
    if (p.indexOf('customThemes') === 0) { renderPresets(); return; }
    if (p.indexOf('theme.') === 0 || p === 'meta.activeThemeId') {
      applyChrome(config);
      updatePresets();
      updateSwatches();
    }
    if (p.indexOf('glass.') === 0) syncSliders();
    if (p.indexOf('visibility.') === 0) updateHides();

    for (var i = 0; i < SLIDERS.length; i++) {
      if (SLIDERS[i].path === p) { syncSlider(SLIDERS[i]); break; }
    }
  }

  function renderDynamic() {
    renderPresets();
    renderSliders();
    renderModes();
    renderHides();
    updateHistory();
  }

  function renderAll() {
    renderDynamic();
    renderSwatches();
    syncAll();
  }

  // --- Привязка событий ---------------------------------------------------

  function bindEvents() {
    ui.master.addEventListener('change', function () {
      writeOne('meta.enabled', !!ui.master.checked);
    });

    ui.accent.addEventListener('input', function () {
      var color = ui.accent.value;
      liveBegin('theme.accent');
      liveSet('theme.accent', color);
      applyChrome(state.current());
      updateSwatches();
    });
    ui.accent.addEventListener('change', function () {
      liveEnd('theme.accent', ui.accent.value);
    });

    ui['site-state'].addEventListener('click', onPillClick);
    ui['btn-studio'].addEventListener('click', function () { openStudio(''); });
    ui['all-themes'].addEventListener('click', function () { openStudio('theme'); });
    ui['all-profiles'].addEventListener('click', function () { openStudio('profiles'); });
    ui['all-hide'].addEventListener('click', function () { openStudio('visibility'); });
    ui['btn-reload'].addEventListener('click', reloadTab);
    ui['btn-undo'].addEventListener('click', doUndo);
    ui['btn-redo'].addEventListener('click', doRedo);

    state.onChange(function (config, p) { syncPath(p); });
    state.state.onPreview = function () {};

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { window.close(); return; }
      var key = String(e.key || '').toLowerCase();
      if ((e.ctrlKey || e.metaKey) && key === 'z') {
        e.preventDefault();
        if (e.shiftKey) doRedo(); else doUndo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && key === 's') {
        e.preventDefault();
        save(true);
      }
    });

    var resizeTimer = 0;
    window.addEventListener('resize', function () {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { resizeTimer = 0; applyFormFactor(); }, 120);
    });

    try {
      if (window.matchMedia) {
        var mq = window.matchMedia('(prefers-color-scheme: light)');
        var onScheme = function () { applyChrome(state.current()); };
        if (mq.addEventListener) mq.addEventListener('change', onScheme);
        else if (mq.addListener) mq.addListener(onScheme);
      }
    } catch (e) { /* matchMedia может не быть */ }
  }

  function watchStorage() {
    A.api.onStorageChanged(function (changes, areaName) {
      if (areaName !== 'local' || !changes) return;
      if (changes[A.PROFILES_KEY]) loadProfiles();
      if (!changes[A.STORAGE_KEY]) return;

      var config = A.config.normalize.normalizeConfig(changes[A.STORAGE_KEY].newValue);
      var stamp = (config.meta && config.meta.lastEdited) || 0;
      if (stamp && stamp === saveStamp) return;
      saveStamp = stamp;
      state.replace(config);
      history.adopt(config);
      updateHistory();
      setStatus('sync');
    });
  }

  // --- Запуск -------------------------------------------------------------

  function cacheDom() {
    IDS.forEach(function (id) { ui[id] = document.getElementById(id); });
  }

  function reveal() {
    var done = function () { document.body.classList.remove('booting'); };
    // rAF в невидимом/замороженном окне может не прийти — страховка таймером,
    // иначе панель останется прозрачной.
    if (window.requestAnimationFrame) window.requestAnimationFrame(done);
    setTimeout(done, 60);
  }

  function boot() {
    cacheDom();
    injectIcons(document);
    collectTexts();
    applyTexts();
    applyFormFactor();

    if (!A.api.isContextValid()) {
      showStale();
      reveal();
      return;
    }

    // Первый кадр рисуем сразу на дефолтах — панель не мигает пустой.
    renderAll();
    bindEvents();
    applyTabState();
    reveal();

    watchStorage();

    state.load().then(function (config) {
      saveStamp = (config.meta && config.meta.lastEdited) || 0;
      history.adopt(config);
      syncAll();
      revealActivePreset();
      setStatus('ready');
      return detectTab().then(afterTab);
    }).then(function () {
      return loadProfiles();
    }).catch(function () {
      setStatus('error', t('popup.loadError', 'не удалось прочитать настройки'));
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
