AONC.define('config.store', function (A) {
  'use strict';

  var norm = A.config.normalize;
  var api = A.api;

  function load() {
    return api.store.get([A.STORAGE_KEY]).then(function (data) {
      return norm.normalizeConfig(data && data[A.STORAGE_KEY]);
    });
  }

  function save(config) {
    var normalized = norm.normalizeConfig(config);
    normalized.meta.lastEdited = Date.now();
    var payload = {};
    payload[A.STORAGE_KEY] = normalized;
    return api.store.set(payload).then(function () { return normalized; });
  }

  function patch(changes) {
    return load().then(function (config) {
      return save(A.lang.deepMerge(config, changes));
    });
  }

  function patchSection(section, changes) {
    var payload = {};
    payload[section] = changes;
    return patch(payload);
  }

  function reset() {
    return save(norm.createConfig());
  }

  function loadRaw() {
    return api.store.get([A.STORAGE_KEY]).then(function (d) { return (d && d[A.STORAGE_KEY]) || null; });
  }

  function replaceRaw(config) {
    var normalized = norm.normalizeConfig(config);
    var payload = {};
    payload[A.STORAGE_KEY] = normalized;
    return api.store.set(payload).then(function () { return normalized; });
  }

  function onConfigChanged(cb) {
    return api.onStorageChanged(function (changes, areaName) {
      if (areaName !== 'local') return;
      if (!changes || !changes[A.STORAGE_KEY]) return;
      cb(norm.normalizeConfig(changes[A.STORAGE_KEY].newValue));
    });
  }

  return {
    load: load,
    save: save,
    patch: patch,
    patchSection: patchSection,
    reset: reset,
    loadRaw: loadRaw,
    replaceRaw: replaceRaw,
    onConfigChanged: onConfigChanged
  };
});
