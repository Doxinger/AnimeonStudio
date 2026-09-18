AONC.define('ui.renderer', function (A) {
  'use strict';

  var el = A.ui.controls.el;

  // Типы контролов, которые рисуются модулями ui.custom.* вместо controls.build.
  // Новый кастомный контрол = запись здесь + модуль в ui/custom/ + строка в ui/custom/index.js.
  var CUSTOM_TYPES = {
    presetGrid: 1, ruleList: 1, snippetList: 1, profileList: 1, contrast: 1,
    myThemes: 1, wallpaperInfo: 1, wallpaperGrid: 1, wallpaperRules: 1,
    cssPreview: 1, diagnostics: 1, privacyDash: 1, favoritesList: 1,
    featureCatalog: 1, badgeEditor: 1, framesList: 1, framesPicker: 1,
    framesEditor: 1, cosmeticsHub: 1, loadoutsEditor: 1, historyList: 1, mirrorStatus: 1,
    updatesBox: 1, profileFxEditor: 1
  };

  function renderControl(def, ctx) {
    var value = def.path ? A.ui.state.get(def.path) : def.value;

    var onChange = function (next) {
      if (!def.path) return;
      if (def.onBefore) def.onBefore(next, A.ui.state);
      A.ui.state.set(def.path, next);
      if (def.onChange) def.onChange(next, A.ui.state, ctx);
      if (def.affects) ctx.refresh(def.affects);
    };

    var custom = CUSTOM_TYPES[def.type] ? ctx.custom[def.type] : null;
    if (typeof custom === 'function') {
      var customNode = custom(def, ctx);
      // класс ctl-<type> нужен, чтобы студию можно было точечно перерисовать
      if (customNode && customNode.classList) {
        customNode.classList.add('ctl-custom', 'ctl-' + def.type);
        if (def.id) customNode.setAttribute('data-ctl', def.id);
      }
      return customNode;
    }

    if (def.visible === false) return null;
    if (typeof def.visible === 'function' && !def.visible(A.ui.state.current())) return null;

    var node = A.ui.controls.build(def, value, onChange, ctx);
    if (!node) return null;

    if (def.path && !def.noStar) node = withStar(def, node, ctx);

    if (def.dependsOn) {
      node.setAttribute('data-depends', def.dependsOn);
      applyDependency(node, def.dependsOn);
    }
    if (def.id) node.setAttribute('data-ctl', def.id);
    if (def.path) node.setAttribute('data-path', def.path);

    return node;
  }

  function withStar(def, node, ctx) {
    var wrap = A.ui.controls.el('div', { class: 'star-wrap', 'data-path': def.path });
    var mark = dirtyMark(def, ctx);
    if (mark) wrap.appendChild(mark);
    wrap.appendChild(el('button', {
      class: 'star' + (A.ui.favorites.has(def.path) ? ' on' : ''),
      type: 'button',
      text: '★',
      title: 'В избранное',
      onclick: function (e) {
        e.stopPropagation();
        var added = A.ui.favorites.toggle(def.path);
        e.currentTarget.classList.toggle('on', added);
        if (ctx && ctx.refresh) ctx.refresh('favorites');
      }
    }));
    wrap.appendChild(node);
    return wrap;
  }

  // Точка у контрола, значение которого отличается от исходного.
  // Клик — вернуть только это значение, не трогая остальной раздел.
  function dirtyMark(def, ctx) {
    if (!def.path || def.noReset) return null;
    if (!A.ui.studioSections.isKeyDirty(def.path, A.ui.state.current())) return null;
    var defValue = A.ui.path.get(A.config.DEFAULTS, def.path);
    var current = A.ui.studioSearch && typeof A.ui.studioSearch.valueText === 'function'
      ? A.ui.studioSearch.valueText(def)
      : '';
    return el('button', {
      class: 'dirty-mark',
      type: 'button',
      text: '↺',
      title: 'Значение изменено · вернуть исходное (' + (current || '…') + ' → ' + describeDefault(defValue) + ')',
      onclick: function (e) {
        e.stopPropagation();
        A.ui.state.set(def.path, A.lang.clone(A.ui.path.get(A.config.DEFAULTS, def.path)));
        var section = ctx && ctx.activeSection ? ctx.activeSection() : null;
        if (ctx && ctx.refresh) ctx.refresh(section);
      }
    });
  }

  function describeDefault(value) {
    if (value === undefined || value === null || value === '') return 'пусто';
    if (typeof value === 'boolean') return value ? 'вкл' : 'выкл';
    if (Array.isArray(value)) return value.length + ' элем.';
    if (typeof value === 'object') return 'настройки';
    return String(value);
  }

  function applyDependency(node, dep) {
    var parts = String(dep).split('=');
    var path = parts[0];
    var expected = parts.length > 1 ? parts[1] : 'true';
    var value = A.ui.state.get(path);
    var on = expected === 'true' ? !!value : String(value) === expected;
    node.classList.toggle('is-off', !on);
    node.setAttribute('aria-disabled', on ? 'false' : 'true');
  }

  function refreshDependencies(root) {
    var nodes = root.querySelectorAll('[data-depends]');
    for (var i = 0; i < nodes.length; i++) applyDependency(nodes[i], nodes[i].getAttribute('data-depends'));
  }

  function renderGroup(group, ctx, section) {
    var wrap = el('div', { class: 'group' });
    if (group.title) {
      wrap.appendChild(el('div', { class: 'group-title' }, [
        el('span', { text: section ? A.ui.i18n.groupTitle(section, group) : group.title }),
        group.description ? el('small', { text: group.description }) : null
      ]));
    }
    (group.controls || []).forEach(function (def) {
      var node = renderControl(def, ctx);
      if (node) wrap.appendChild(node);
    });
    return wrap;
  }

  function renderSection(section, ctx) {
    var body = el('div', { class: 'sec-body', id: 'sec-' + section.id });
    if (section.intro) {
      var translated = A.ui.i18n.t('intro.' + section.id, null);
      body.appendChild(translated
        ? el('div', { class: 'intro', text: translated })
        : el('div', { class: 'intro', html: section.intro }));
    }
    (section.groups || []).forEach(function (group) {
      body.appendChild(renderGroup(group, ctx, section));
    });
    (section.controls || []).forEach(function (def) {
      var node = renderControl(def, ctx);
      if (node) body.appendChild(node);
    });
    if (section.custom && ctx.custom[section.custom]) {
      var custom = ctx.custom[section.custom](section, ctx);
      if (custom) body.appendChild(custom);
    }
    return body;
  }

  function refreshSection(section, ctx) {
    var existing = document.getElementById('sec-' + section.id);
    if (!existing) return;
    var fresh = renderSection(section, ctx);
    existing.replaceWith(fresh);
    refreshDependencies(fresh);
  }

  function registerCustomType(type) {
    if (type) CUSTOM_TYPES[type] = 1;
    return CUSTOM_TYPES;
  }

  return {
    CUSTOM_TYPES: CUSTOM_TYPES,
    registerCustomType: registerCustomType,
    renderControl: renderControl,
    renderGroup: renderGroup,
    renderSection: renderSection,
    refreshSection: refreshSection,
    refreshDependencies: refreshDependencies,
    applyDependency: applyDependency
  };
});
