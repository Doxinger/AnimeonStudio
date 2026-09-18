// Метки NEW в меню студии: подсвечиваем разделы, которых пользователь
// ещё не видел. Метка снимается сама при первом заходе в раздел.
AONC.define('ui.newSections', function (A) {
  'use strict';

  var STORE_KEY = 'aonc.studio.newseen.v1';

  // Разделы, добавленные после первого релиза 1.0.0.
  var NEW_SECTIONS = ['cosmetics', 'chat'];

  function storage() {
    try { return window.localStorage; } catch (e) { return null; }
  }

  function readSeen() {
    var store = storage();
    if (!store) return {};
    try {
      return JSON.parse(store.getItem(STORE_KEY) || '{}') || {};
    } catch (e) { return {}; }
  }

  function writeSeen(map) {
    var store = storage();
    if (!store) return;
    try { store.setItem(STORE_KEY, JSON.stringify(map)); } catch (e) {}
  }

  function isNew(sectionId) {
    return NEW_SECTIONS.indexOf(sectionId) !== -1;
  }

  function isUnseen(sectionId) {
    return isNew(sectionId) && !readSeen()[sectionId];
  }

  function unseen() {
    return NEW_SECTIONS.filter(isUnseen);
  }

  function markSeen(sectionId) {
    if (!sectionId || !isNew(sectionId)) return false;
    var map = readSeen();
    if (map[sectionId]) return false;
    map[sectionId] = Date.now();
    writeSeen(map);
    return true;
  }

  function markAllSeen() {
    var map = readSeen();
    var changed = false;
    NEW_SECTIONS.forEach(function (id) {
      if (!map[id]) { map[id] = Date.now(); changed = true; }
    });
    if (changed) writeSeen(map);
    return changed;
  }

  function reset() {
    var store = storage();
    if (store) store.removeItem(STORE_KEY);
  }

  return {
    NEW_SECTIONS: NEW_SECTIONS,
    isNew: isNew,
    isUnseen: isUnseen,
    unseen: unseen,
    markSeen: markSeen,
    markAllSeen: markAllSeen,
    reset: reset
  };
});
