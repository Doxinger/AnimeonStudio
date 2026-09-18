AONC.define('ui.studioSections', function (A) {
  'use strict';

  // Раздел → ключи конфига, которые он редактирует.
  // Значение без точки = вся секция конфига, с точкой = конкретный путь
  // (нужно, когда один ключ делят несколько разделов, например meta).
  var KEYMAP = {
    theme: ['theme', 'wallpaper', 'customThemes'],
    typography: ['typography'],
    glass: ['glass'],
    layout: ['layout'],
    player: ['player'],
    chat: ['chat', 'identity'],
    visibility: ['visibility'],
    elements: ['elements'],
    custom: ['custom'],
    features: [],
    performance: ['performance'],
    privacy: ['privacy'],
    profiles: ['meta'],
    cosmetics: ['cosmetics'],
    favorites: ['meta.favorites'],
    help: ['offline']
  };

  var COLLAPSE_KEY = 'aonc.studio.collapsed.v1';

  function keysFor(sectionId) {
    return KEYMAP[sectionId] || [];
  }

  function same(a, b) {
    return JSON.stringify(a === undefined ? null : a) === JSON.stringify(b === undefined ? null : b);
  }

  function isKeyDirty(key, config) {
    return !same(A.ui.path.get(config, key), A.ui.path.get(A.config.DEFAULTS, key));
  }

  function dirtyKeys(sectionId, config) {
    return keysFor(sectionId).filter(function (k) { return isKeyDirty(k, config); });
  }

  function isDirty(sectionId, config) {
    return dirtyKeys(sectionId, config).length > 0;
  }

  function dirtyCount(sectionId, config) {
    return dirtyKeys(sectionId, config).length;
  }

  function resetKeys(sectionId, keys) {
    var list = keys && keys.length ? keys : keysFor(sectionId);
    var changes = {};
    list.forEach(function (k) {
      changes[k] = A.lang.clone(A.ui.path.get(A.config.DEFAULTS, k));
    });
    if (Object.keys(changes).length) A.ui.state.setMany(changes);
    return Object.keys(changes).length;
  }

  function resetChanges(sectionId) {
    return resetKeys(sectionId);
  }

  // Проверка для тестов: каждый зарегистрированный раздел обязан быть в KEYMAP,
  // иначе у него не будет маркера «изменено» и кнопки «Сброс раздела».
  function coverage() {
    var missing = [];
    A.ui.sections.all().forEach(function (sec) {
      if (!Object.prototype.hasOwnProperty.call(KEYMAP, sec.id)) missing.push(sec.id);
    });
    var unknown = Object.keys(KEYMAP).filter(function (id) { return !A.ui.sections.byId(id); });
    return { missing: missing, unknown: unknown, ok: !missing.length && !unknown.length };
  }

  function readCollapsed() {
    try {
      return JSON.parse(localStorage.getItem(COLLAPSE_KEY) || '{}') || {};
    } catch (e) {
      return {};
    }
  }

  function writeCollapsed(map) {
    try { localStorage.setItem(COLLAPSE_KEY, JSON.stringify(map)); } catch (e) {}
  }

  function isCollapsed(key) {
    return !!readCollapsed()[key];
  }

  function setCollapsed(key, value) {
    var map = readCollapsed();
    if (value) map[key] = true;
    else delete map[key];
    writeCollapsed(map);
  }

  function toggleCollapsed(key) {
    var next = !isCollapsed(key);
    setCollapsed(key, next);
    return next;
  }

  return {
    KEYMAP: KEYMAP,
    keysFor: keysFor,
    isKeyDirty: isKeyDirty,
    isDirty: isDirty,
    dirtyKeys: dirtyKeys,
    dirtyCount: dirtyCount,
    resetKeys: resetKeys,
    resetChanges: resetChanges,
    coverage: coverage,
    isCollapsed: isCollapsed,
    setCollapsed: setCollapsed,
    toggleCollapsed: toggleCollapsed
  };
});
