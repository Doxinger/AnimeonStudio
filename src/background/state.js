AONC.define('background.state', function (A) {
  'use strict';

  var listeners = [];

  function load() {
    return A.config.store.load();
  }

  function save(config) {
    return A.config.store.save(config).then(function (saved) {
      notify(saved);
      return saved;
    });
  }

  function patch(changes) {
    return load().then(function (config) {
      return save(A.lang.deepMerge(config, changes));
    });
  }

  function toggle() {
    return load().then(function (config) {
      return patch({ meta: { enabled: !config.meta.enabled } });
    });
  }

  function notify(config) {
    listeners.slice().forEach(function (fn) {
      try { fn(config); } catch (e) {}
    });
  }

  function onChange(fn) {
    listeners.push(fn);
    return function () {
      listeners = listeners.filter(function (f) { return f !== fn; });
    };
  }

  return { load: load, save: save, patch: patch, toggle: toggle, onChange: onChange, notify: notify };
});
