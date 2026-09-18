AONC.define('content.config', function (A) {
  'use strict';

  var norm = A.config.normalize;

  var state = {
    config: null,
    bootEntry: null,
    loaded: false,
    listeners: []
  };

  function bootFromCache() {
    var entry = A.pageCache.read();
    if (!A.pageCache.isFresh(entry)) {
      A.pageCache.clear();
      return null;
    }
    state.bootEntry = entry;
    return entry;
  }

  function current() {
    return state.config || norm.createConfig();
  }

  function set(config) {
    state.config = norm.normalizeConfig(config);
    state.loaded = true;
    emit();
    return state.config;
  }

  function emit() {
    var snapshot = state.config;
    state.listeners.slice().forEach(function (fn) {
      try { fn(snapshot); } catch (e) {}
    });
  }

  function onChange(fn) {
    state.listeners.push(fn);
    return function () {
      state.listeners = state.listeners.filter(function (f) { return f !== fn; });
    };
  }

  function load() {
    return A.config.store.load().then(function (config) {
      state.config = config;
      state.loaded = true;
      return config;
    });
  }

  function save(config) {
    return A.config.store.save(config).then(function (saved) {
      state.config = saved;
      return saved;
    });
  }

  function patch(changes) {
    return A.config.store.patch(changes).then(function (saved) {
      state.config = saved;
      emit();
      return saved;
    });
  }

  function watchStorage() {
    return A.config.store.onConfigChanged(function (config) {
      state.config = config;
      emit();
    });
  }

  function isLoaded() { return state.loaded; }
  function bootEntry() { return state.bootEntry; }

  return {
    bootFromCache: bootFromCache,
    current: current,
    set: set,
    load: load,
    save: save,
    patch: patch,
    onChange: onChange,
    watchStorage: watchStorage,
    isLoaded: isLoaded,
    bootEntry: bootEntry
  };
});
