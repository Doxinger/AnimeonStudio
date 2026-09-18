(function () {
  'use strict';

  var A = window.AONC;
  if (!A) { document.body.textContent = 'Не удалось загрузить модули расширения.'; return; }

  var state = A.ui.state;
  var i18n = A.ui.i18n;
  var sections = A.ui.sections.all();
  var activeId = sections[0].id;
  var lastLocale = null;

  // Панель расширения просит открыть конкретный раздел: кладёт его id в
  // localStorage перед runtime.openOptionsPage() (в openOptionsPage нельзя
  // передать hash), студия забирает и очищает метку.
  var SECTION_KEY = 'aonc.studio.section';

  function takePendingSection() {
    try {
      var id = window.localStorage.getItem(SECTION_KEY);
      if (!id) return '';
      window.localStorage.removeItem(SECTION_KEY);
      return id;
    } catch (e) {
      return '';
    }
  }

  function applyPendingSection() {
    var id = takePendingSection();
    if (!id) return false;
    if (id === 'search' && dom['search-input']) { dom['search-input'].focus(); return true; }
    var known = sections.filter(function (s) { return s.id === id; })[0];
    if (!known) return false;
    select(known.id);
    return true;
  }

  // Прямая ссылка вида options.html#theme — на случай открытия из закладок.
  function applyHashSection() {
    var hash = String(window.location.hash || '').replace(/^#/, '');
    if (!hash) return false;
    var known = sections.filter(function (s) { return s.id === hash; })[0];
    if (!known) return false;
    select(known.id);
    return true;
  }

  function watchSectionRequests() {
    window.addEventListener('storage', function (e) {
      if (!e || (e.key && e.key !== SECTION_KEY)) return;
      if (!e.newValue) return;
      if (applyPendingSection()) A.ui.toast.info(i18n.t('chrome.jump', 'Перешли по ссылке из панели'));
    });
  }

  var ctx = {
    custom: A.ui.custom,
    expandedRule: null,
    expandedSnippet: null,
    expandedWallpaperRule: null,
    debouncedRefresh: A.lang.debounce(function () { refresh(activeId); }, 400),
    refresh: refresh,
    refreshAll: renderAll,
    jump: function (sectionId) { select(sectionId); },
    activeSection: function () { return activeId; }
  };

  var dom = {};

  function cacheDom() {
    ['nav', 'panel', 'section-title', 'section-intro', 'save-state', 'preview',
      'preview-badge', 'preview-zoom', 'master-toggle', 'version',
      'btn-picker', 'btn-reload', 'btn-open-site', 'btn-reapply',
      'stale-banner', 'btn-stale-reload',
      'search-input', 'btn-reset-section', 'preview-side',
      'btn-undo', 'btn-redo',
      'btn-preview-hide', 'btn-preview-show',
      'pv-w-desktop', 'pv-w-tablet', 'pv-w-mobile'].forEach(function (id) {
      dom[id] = document.getElementById(id);
    });
  }

  function renderNav() {
    dom['nav'].innerHTML = '';
    var config = state.current();
    sections.forEach(function (sec) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = sec.id === activeId ? 'on' : '';
      btn.appendChild(A.ui.icons.sectionIcon(sec.id, sec.icon, 16));
      btn.appendChild(A.ui.controls.el('span', { class: 'nav-label', text: i18n.sectionTitle(sec) }));
      if (A.ui.studioSections.isDirty(sec.id, config)) {
        btn.appendChild(A.ui.controls.el('span', { class: 'dot', title: i18n.t('nav.dirty', 'Есть изменения') }));
      }
      if (A.ui.newSections.isUnseen(sec.id)) {
        btn.appendChild(A.ui.controls.el('span', { class: 'nav-new', text: i18n.t('nav.new', 'NEW') }));
      }
      btn.addEventListener('click', function () { select(sec.id); });
      dom['nav'].appendChild(btn);
    });
  }

  function select(id) {
    activeId = id;
    if (A.ui.newSections.markSeen(id)) renderNavLater();
    clearSearch();
    renderNav();
    renderActive();
    dom.panel.scrollTop = 0;
  }

  // Метка NEW снимается после текущей отрисовки меню, чтобы не дёргать DOM в цикле.
  var navTimer = null;
  function renderNavLater() {
    if (navTimer) clearTimeout(navTimer);
    navTimer = setTimeout(function () { navTimer = null; renderNav(); }, 0);
  }

  function renderActive() {
    var sec = A.ui.sections.byId(activeId);
    if (!sec) return;
    dom['section-title'].innerHTML = '';
    var titleIcon = A.ui.icons.sectionIcon(sec.id, sec.icon, 20);
    if (titleIcon) dom['section-title'].appendChild(titleIcon);
    dom['section-title'].appendChild(document.createTextNode(i18n.sectionTitle(sec)));
    var introEn = i18n.t('intro.' + sec.id, null);
    if (introEn) dom['section-intro'].textContent = introEn;
    else dom['section-intro'].innerHTML = sec.intro || '';
    dom.panel.innerHTML = '';

    var onboard = A.ui.onboarding.render(ctx);
    if (onboard) dom.panel.appendChild(onboard);

    dom.panel.appendChild(A.ui.renderer.renderSection(sec, ctx));
    A.ui.renderer.refreshDependencies(dom.panel);
    decorateGroups(sec);
    updateResetButton();
    updateHistoryButtons();
  }

  function decorateGroups(sec) {
    var groups = dom.panel.querySelectorAll('.group');
    for (var i = 0; i < groups.length; i++) {
      (function (group, index) {
        var title = group.querySelector('.group-title');
        if (!title) return;
        var key = sec.id + ':' + index + ':' + (title.textContent || '').trim().slice(0, 40);
        var caret = A.ui.controls.el('span', { class: 'caret', text: '▼' });
        title.appendChild(caret);
        if (A.ui.studioSections.isCollapsed(key)) group.classList.add('collapsed');
        title.addEventListener('click', function () {
          var collapsed = A.ui.studioSections.toggleCollapsed(key);
          group.classList.toggle('collapsed', collapsed);
        });
      })(groups[i], i);
    }
  }

  function updateResetButton() {
    var dirty = A.ui.studioSections.isDirty(activeId, state.current());
    dom['btn-reset-section'].hidden = !dirty;
  }

  function updateHistoryButtons() {
    dom['btn-undo'].disabled = !A.ui.history.canUndo();
    dom['btn-redo'].disabled = !A.ui.history.canRedo();
    var next = A.ui.history.entries()[0];
    dom['btn-undo'].title = next
      ? 'Отменить (Ctrl+Z): ' + next.label
      : 'Отменить изменение (Ctrl+Z)';
    dom['btn-redo'].title = A.ui.history.canRedo() ? 'Повторить (Ctrl+Shift+Z)' : 'Повторить (Ctrl+Shift+Z)';
    // лента изменений в «Справке» должна отражать каждый шаг;
    // перерисовываем только её, чтобы не терять обработчики сворачивания групп
    refreshHistoryRibbon();
  }

  function refreshHistoryRibbon() {
    var host = document.querySelector('.ctl-historyList');
    if (!host) return;
    var fresh = A.ui.custom.historyList({ type: 'historyList', id: 'historyList' }, ctx);
    if (fresh) host.replaceWith(fresh);
  }

  function doUndo() {
    var prev = A.ui.history.undo();
    if (!prev) return;
    state.replace(prev);
    state.save();
    renderNav();
    renderActive();
    updatePreview();
    A.ui.toast.info('Изменение отменено');
  }

  function doRedo() {
    var next = A.ui.history.redo();
    if (!next) return;
    state.replace(next);
    state.save();
    renderNav();
    renderActive();
    updatePreview();
    A.ui.toast.info('Изменение повторено');
  }

  var searchMode = false;

  function showSearch(query) {
    searchMode = true;
    dom['section-title'].textContent = i18n.t('search.title', 'Поиск');
    dom['section-intro'].innerHTML = '';
    dom.panel.innerHTML = '';
    dom.panel.appendChild(A.ui.studioSearch.render(query, ctx, function (sectionId) {
      clearSearch();
      select(sectionId);
    }));
    A.ui.renderer.refreshDependencies(dom.panel);
  }

  function clearSearch() {
    if (!searchMode && !dom['search-input'].value) return;
    searchMode = false;
    dom['search-input'].value = '';
    renderActive();
  }

  function onSearchInput() {
    var q = dom['search-input'].value.trim();
    if (!q) {
      if (searchMode) clearSearch();
      return;
    }
    showSearch(q);
  }

  function syncLocale() {
    var current = i18n.locale();
    if (current === lastLocale) return;
    lastLocale = current;
    dom['search-input'].placeholder = i18n.t('search.placeholder', 'Поиск: тема, блюр, шапка…');
    decorateButtons();
    renderNav();
    renderActive();
  }

  function refresh(id) {
    var target = id || activeId;
    var sec = A.ui.sections.byId(target);
    if (!sec) return;
    syncLocale();
    if (target === activeId) {
      renderActive();
    }
    updatePreview();
    syncMaster();
  }

  function renderAll() {
    renderNav();
    renderActive();
    syncMaster();
    updatePreview();
  }

  function syncMaster() {
    dom['master-toggle'].checked = !!state.get('meta.enabled');
    document.body.classList.toggle('disabled-ext', !state.get('meta.enabled'));
  }

  function setStatus(kind) {
    var node = dom['save-state'];
    node.className = 'save-state ' + kind;
    node.textContent = i18n.t('status.' + kind, kind === 'dirty' ? 'изменяем…'
      : kind === 'saved' ? 'сохранено'
      : kind === 'error' ? 'ошибка'
      : kind === 'preview' ? 'применяем…'
      : 'готово');
    if (kind === 'error') showStale();
  }

  function showStale() {
    if (dom['stale-banner']) dom['stale-banner'].hidden = false;
  }

  function hideStale() {
    if (dom['stale-banner']) dom['stale-banner'].hidden = true;
  }

  var previewTimer = null;

  function updatePreview() {
    if (previewTimer) clearTimeout(previewTimer);
    previewTimer = setTimeout(function () {
      var result = A.cssBuilder.build(state.current(), '/');
      var zoom = Number(dom['preview-zoom'].value || 70);
      dom.preview.srcdoc = A.ui.preview.srcdoc(result.css, zoom);

      var kb = (result.css.length / 1024).toFixed(1);
      dom['preview-badge'].textContent = kb + ' ' + i18n.t('preview.kb', 'КБ') +
        (result.stats.errors && result.stats.errors.length ? ' · ' + i18n.t('preview.errors', 'ошибки') : '');
      dom['preview-badge'].className = 'badge' + (result.stats.errors && result.stats.errors.length ? '' : ' on');

      if (A.ui.custom.cssPreview && document.getElementById('sec-custom')) {
        A.ui.custom.cssPreview.refresh();
      }
    }, 140);
  }

  var BUTTON_ICONS = {
    'btn-picker': ['crosshair', 'btn.picker', 'Пипетка'],
    'btn-reapply': ['refresh-cw', 'btn.reapply', 'Переприменить'],
    'btn-reload': ['rotate-ccw', 'btn.reload', 'Обновить'],
    'btn-undo': ['undo-2', '', ''],
    'btn-redo': ['redo-2', '', ''],
    'btn-reset-section': ['rotate-ccw', 'btn.resetSection', 'Сброс раздела'],
    'btn-open-site': ['external-link', 'btn.openSite', 'Открыть сайт'],
    'btn-stale-reload': ['refresh-cw', 'btn.staleReload', 'Перезагрузить студию'],
    'btn-preview-hide': ['panel-right', '', ''],
    'btn-preview-show': ['panel-right', '', '']
  };

  function decorateButtons() {
    Object.keys(BUTTON_ICONS).forEach(function (id) {
      var node = dom[id];
      if (!node) return;
      var pair = BUTTON_ICONS[id];
      var icon = A.ui.icons.el(pair[0], 14, 'ic-btn');
      var label = pair[1] ? i18n.t(pair[1], pair[2]) : pair[2];
      node.innerHTML = '';
      if (icon) node.appendChild(icon);
      if (label) node.appendChild(document.createTextNode(label));
      node.title = label || node.title || '';
      node.classList.add('has-icon');
    });
  }

  function bindTop() {
    dom['master-toggle'].addEventListener('change', function (e) {
      state.set('meta.enabled', e.target.checked);
      document.body.classList.toggle('disabled-ext', !e.target.checked);
      A.ui.toast.info(e.target.checked ? 'Расширение включено' : 'Расширение выключено');
    });

    dom['preview-zoom'].addEventListener('input', updatePreview);

    dom['search-input'].addEventListener('input', A.lang.debounce(onSearchInput, 120));
    dom['search-input'].addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        clearSearch();
        dom['search-input'].blur();
      }
    });

    dom['btn-reset-section'].addEventListener('click', function () {
      var n = A.ui.studioSections.resetChanges(activeId);
      if (n) {
        A.ui.toast.ok('Раздел «' + (A.ui.sections.byId(activeId) || {}).label + '» сброшен к исходному');
        renderNav();
        renderActive();
        updatePreview();
      }
    });

    dom['btn-undo'].addEventListener('click', doUndo);
    dom['btn-redo'].addEventListener('click', doRedo);

    ['desktop', 'tablet', 'mobile'].forEach(function (mode) {
      dom['pv-w-' + mode].addEventListener('click', function () {
        ['desktop', 'tablet', 'mobile'].forEach(function (m) {
          dom['pv-w-' + m].classList.toggle('on', m === mode);
        });
        dom.preview.classList.remove('w-tablet', 'w-mobile');
        if (mode !== 'desktop') dom.preview.classList.add('w-' + mode);
      });
    });

    dom['btn-preview-hide'].addEventListener('click', function () {
      dom['preview-side'].classList.add('hidden');
      dom['btn-preview-show'].hidden = false;
    });
    dom['btn-preview-show'].addEventListener('click', function () {
      dom['preview-side'].classList.remove('hidden');
      dom['btn-preview-show'].hidden = true;
    });

    dom['btn-picker'].addEventListener('click', function () {
      A.ui.actions.run('picker-start', ctx);
    });

    dom['btn-reload'].addEventListener('click', function () {
      A.api.sendMessage(A.messaging.msg(A.messaging.TYPE.RELOAD_TAB)).then(function () {
        A.ui.toast.ok('Вкладка перезагружена');
      });
    });

    dom['btn-reapply'].addEventListener('click', function () {
      dom['btn-reapply'].disabled = true;
      A.api.sendMessage(A.messaging.msg(A.messaging.TYPE.REAPPLY_ALL)).then(function (response) {
        dom['btn-reapply'].disabled = false;
        var data = (response && (response.value || response)) || {};
        if (!data || data.tabs == null) {
          A.ui.toast.error('Нет ответа от фона: перезагрузите студию (F5)');
          showStale();
          return;
        }
        if (data.tabs === 0) {
          A.ui.toast.info('Открытых вкладок сайта нет — откройте animeon.cc и нажмите снова');
        } else if (data.applied === 0) {
          A.ui.toast.error('Вкладки сайта не ответили: обновите их (F5) — контент-скрипт умер после перезагрузки расширения');
        } else {
          A.ui.toast.ok('Применено на вкладках: ' + data.applied + ' из ' + data.tabs);
        }
      });
    });

    dom['btn-stale-reload'].addEventListener('click', function () {
      window.location.reload();
    });

    dom['btn-open-site'].addEventListener('click', function () {
      window.open(A.siteUrl('/'), '_blank', 'noopener');
    });

    dom.version.textContent = A.NAME + ' v' + A.VERSION +
      (A.api.isFirefox ? ' · Firefox' : A.api.isChrome ? ' · Chromium' : '');
  }

  function bindStateEvents() {
    state.state.onPreview = function () {
      updatePreview();
    };
    state.state.onStatus = function (kind) {
      if (kind === 'saved') setStatus('saved');
      else if (kind === 'error') setStatus('err');
      else if (kind === 'preview') setStatus('preview');
    };
    state.onChange(function (config, path) {
      setStatus('dirty');
      A.ui.studioTheme.apply(config);
      if (path === 'meta.locale' || path === '*') syncLocale();
      renderNav();
      updateResetButton();
      updateHistoryButtons();
      if (path === '*' || path === 'meta.enabled') syncMaster();
    });
  }

  function bindKeys() {
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (A.ui.palette.isOpen()) A.ui.palette.close();
        else A.ui.palette.open(ctx);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        dom['search-input'].focus();
        dom['search-input'].select();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        doUndo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        doRedo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        state.save().then(function (saved) { if (saved) setStatus('saved'); });
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f' && e.shiftKey) {
        e.preventDefault();
        select('elements');
        A.ui.actions.run('picker-start', ctx);
      }
    });
  }

  function watchStorage() {
    A.api.onStorageChanged(function (changes, areaName) {
      if (areaName !== 'local' || !changes[A.STORAGE_KEY]) return;
      var next = A.config.normalize.normalizeConfig(changes[A.STORAGE_KEY].newValue);
      if (JSON.stringify(next) === JSON.stringify(state.current())) return;
      state.replace(next);
      renderAll();
      setStatus('saved');
    });
  }

  function boot() {
    cacheDom();
    decorateButtons();
    lastLocale = null;
    syncLocale();

    if (!A.api.isContextValid()) {
      showStale();
      document.getElementById('app').classList.remove('booting');
      return;
    }

    bindTop();
    bindStateEvents();
    bindKeys();
    watchStorage();
    watchSectionRequests();

    state.load().then(function (config) {
      A.ui.studioTheme.apply(config);
      var restored = A.ui.history.adopt(config);
      renderAll();
      if (!applyPendingSection()) applyHashSection();
      setStatus('saved');
      hideStale();
      document.getElementById('app').classList.remove('booting');
      if (restored && A.ui.history.canUndo()) {
        var last = A.ui.history.entries()[0];
        A.ui.toast.info('История правок восстановлена · Ctrl+Z — ' + (last ? last.label : 'шаг назад'));
      }
    }).catch(function (e) {
      document.getElementById('app').classList.remove('booting');
      showStale();
      A.ui.toast.error('Не удалось загрузить настройки: ' + e.message);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
