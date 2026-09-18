AONC.define('ui.history', function (A) {
  'use strict';

  var STORE_KEY = 'aonc.studio.history.v1';
  var MAX = 40;
  var MAX_PERSIST = 24;
  var MAX_SNAPSHOT_BYTES = 400 * 1024;
  var COALESCE_MS = 700;

  var undoStack = [];
  var redoStack = [];
  var lastKey = '';
  var lastTime = 0;
  var baseId = '';
  var persisted = false;

  function snapshot() {
    return A.lang.clone(A.ui.state.current());
  }

  function encode(config) {
    try { return JSON.stringify(config); } catch (e) { return ''; }
  }

  function short(value) {
    if (value === undefined || value === null) return '—';
    if (typeof value === 'boolean') return value ? 'вкл' : 'выкл';
    if (typeof value === 'number') return String(Math.round(value * 100) / 100);
    if (typeof value === 'string') return value.length > 24 ? value.slice(0, 24) + '…' : (value || '—');
    if (Array.isArray(value)) return '[' + value.length + ']';
    return '{…}';
  }

  function describe(key, before, after) {
    if (!key || key.charAt(0) === '*') return 'группа изменений';
    var prev = A.ui.path.get(before, key);
    var next = A.ui.path.get(after, key);
    return key + ': ' + short(prev) + ' → ' + short(next);
  }

  function stampOf(ms) {
    try {
      return new Date(ms).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return ''; }
  }

  function record(before, key) {
    var after = A.ui.state.current();
    var now = Date.now();
    var label = describe(key, before, key && key.charAt(0) === '*' ? null : after);
    if (key && key === lastKey && now - lastTime < COALESCE_MS && undoStack.length) {
      var top = undoStack[undoStack.length - 1];
      top.before = before;
      top.label = label;
      top.at = now;
    } else {
      undoStack.push({ before: before, key: key || '', at: now, label: label });
      if (undoStack.length > MAX) undoStack.shift();
      redoStack.length = 0;
    }
    lastKey = key || '';
    lastTime = now;
    persist();
  }

  function canUndo() { return undoStack.length > 0; }
  function canRedo() { return redoStack.length > 0; }

  function undo() {
    var entry = undoStack.pop();
    if (!entry) return null;
    redoStack.push({ before: snapshot(), key: entry.key, at: Date.now(), label: entry.label });
    lastKey = '';
    persist();
    return entry.before;
  }

  function redo() {
    var entry = redoStack.pop();
    if (!entry) return null;
    undoStack.push({ before: snapshot(), key: entry.key, at: Date.now(), label: entry.label });
    lastKey = '';
    persist();
    return entry.before;
  }

  function clear() {
    undoStack.length = 0;
    redoStack.length = 0;
    lastKey = '';
    lastTime = 0;
    persist();
  }

  function depth() {
    return { undo: undoStack.length, redo: redoStack.length };
  }

  function entries() {
    return undoStack.slice().reverse().map(function (e, i) {
      return {
        index: i,
        key: e.key,
        label: e.label || e.key || 'изменение',
        at: e.at || 0,
        time: e.at ? stampOf(e.at) : ''
      };
    });
  }

  // Откат сразу на несколько шагов: index — позиция в списке entries().
  function jump(index) {
    var pos = undoStack.length - 1 - index;
    if (pos < 0 || pos >= undoStack.length) return null;
    var target = undoStack[pos];
    undoStack.splice(pos);
    redoStack.push({ before: snapshot(), key: '', at: Date.now(), label: 'до «' + (target.label || '') + '»' });
    lastKey = '';
    persist();
    return target.before;
  }

  // --- Персистентность: история переживает перезагрузку студии ---------------

  function storage() {
    try { return window.localStorage; } catch (e) { return null; }
  }

  function serializable(entry) {
    var raw = encode(entry.before);
    if (!raw || raw.length > MAX_SNAPSHOT_BYTES) return null;
    return { raw: raw, key: entry.key || '', at: entry.at || 0, label: entry.label || '' };
  }

  function revive(entry) {
    if (!entry || !entry.raw) return null;
    try {
      return { before: JSON.parse(entry.raw), key: entry.key || '', at: entry.at || 0, label: entry.label || '' };
    } catch (e) { return null; }
  }

  function persist() {
    if (!persisted) return;
    var store = storage();
    if (!store) return;
    var undo = undoStack.slice(-MAX_PERSIST).map(serializable).filter(Boolean);
    var redo = redoStack.slice(-MAX_PERSIST).map(serializable).filter(Boolean);
    try {
      store.setItem(STORE_KEY, JSON.stringify({ base: baseId, savedAt: Date.now(), undo: undo, redo: redo }));
    } catch (e) {
      // квота переполнена или приватный режим — работаем без сохранения
    }
  }

  // Привязываем историю к сохранённому конфигу: если настройки успели поменять
  // в другой вкладке, снапшоты из прошлого сеанса применять нельзя.
  function adopt(config) {
    baseId = encode(A.lang.clone(config || A.ui.state.current()));
    var store = storage();
    var restored = false;
    if (store) {
      try {
        var saved = JSON.parse(store.getItem(STORE_KEY) || 'null');
        if (saved && saved.base === baseId) {
          var undo = (saved.undo || []).map(revive).filter(Boolean);
          var redo = (saved.redo || []).map(revive).filter(Boolean);
          if (undo.length || redo.length) {
            undoStack = undo.slice(-MAX);
            redoStack = redo.slice(-MAX);
            restored = true;
          }
        }
      } catch (e) {
        undoStack = [];
        redoStack = [];
      }
    }
    persisted = true;
    persist();
    return restored;
  }

  function isPersistent() { return persisted; }
  function base() { return baseId; }

  return {
    record: record,
    canUndo: canUndo,
    canRedo: canRedo,
    undo: undo,
    redo: redo,
    clear: clear,
    depth: depth,
    entries: entries,
    jump: jump,
    snapshot: snapshot,
    adopt: adopt,
    isPersistent: isPersistent,
    base: base,
    describe: describe
  };
});
