AONC.define('ui.state', function (A) {
  'use strict';

  var state = {
    config: A.config.normalize.createConfig(),
    dirty: false,
    saving: false,
    listeners: [],
    saveTimer: null,
    previewTimer: null
  };

  function get(path, fallback) {
    return A.ui.path.get(state.config, path, fallback);
  }

  function set(path, value, options) {
    var prev = A.lang.clone(state.config);
    A.ui.path.set(state.config, path, value);
    state.dirty = true;
    A.ui.history.record(prev, path);
    emit(path, value);
    if (!options || options.save !== false) scheduleSave();
    if (!options || options.preview !== false) schedulePreview();
  }

  function setMany(changes, options) {
    var prev = A.lang.clone(state.config);
    Object.keys(changes || {}).forEach(function (k) {
      A.ui.path.set(state.config, k, changes[k]);
    });
    state.dirty = true;
    A.ui.history.record(prev, '*' + Object.keys(changes || {}).join(','));
    emit('*', changes);
    if (!options || options.save !== false) scheduleSave();
    if (!options || options.preview !== false) schedulePreview();
  }

  function replace(config) {
    state.config = A.config.normalize.normalizeConfig(config);
    state.dirty = false;
    emit('*', null);
    return state.config;
  }

  function current() {
    return state.config;
  }

  function load() {
    return A.config.store.load().then(function (config) {
      state.config = config;
      state.dirty = false;
      emit('*', null);
      return config;
    });
  }

  function scheduleSave() {
    if (state.saveTimer) clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(save, 320);
  }

  function schedulePreview() {
    if (state.previewTimer) clearTimeout(state.previewTimer);
    state.previewTimer = setTimeout(preview, 90);
  }

  function save() {
    if (state.saving) return scheduleSave();
    state.saving = true;
    var snapshot = A.lang.clone(state.config);
    return A.config.store.save(snapshot)
      .then(function (saved) {
        state.config = A.config.normalize.normalizeConfig(saved);
        state.dirty = false;
        state.saving = false;
        emitStatus('saved');
        return saved;
      })
      .catch(function (e) {
        state.saving = false;
        emitStatus('error', e);
      });
  }

  function preview() {
    var css = A.cssBuilder.buildCssOnly(state.config, currentPreviewUrl());
    emitStatus('preview', { bytes: css.length });
    if (typeof state.onPreview === 'function') state.onPreview(css, state.config);
    return css;
  }

  function currentPreviewUrl() {
    return state.targetUrl || '/';
  }

  function onChange(fn) {
    state.listeners.push(fn);
    return function () {
      state.listeners = state.listeners.filter(function (f) { return f !== fn; });
    };
  }

  function emit(path, value) {
    state.listeners.slice().forEach(function (fn) {
      try { fn(state.config, path, value); } catch (e) {}
    });
  }

  function emitStatus(kind, payload) {
    if (typeof state.onStatus === 'function') {
      try { state.onStatus(kind, payload); } catch (e) {}
    }
  }

  function reset() {
    return A.config.store.reset().then(function (config) {
      state.config = config;
      state.dirty = false;
      emit('*', null);
      return config;
    });
  }

  return {
    get: get,
    set: set,
    setMany: setMany,
    replace: replace,
    current: current,
    load: load,
    save: save,
    preview: preview,
    onChange: onChange,
    reset: reset,
    state: state
  };
});
