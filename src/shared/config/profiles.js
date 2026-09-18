AONC.define('config.profiles', function (A) {
  'use strict';

  var norm = A.config.normalize;
  var api = A.api;

  function loadAll() {
    return api.store.get([A.PROFILES_KEY]).then(function (data) {
      var list = (data && data[A.PROFILES_KEY]) || [];
      return Array.isArray(list) ? list : [];
    });
  }

  function persist(list) {
    var payload = {};
    payload[A.PROFILES_KEY] = list;
    return api.store.set(payload).then(function () { return list; });
  }

  function save(name, config, id) {
    return loadAll().then(function (list) {
      var existing = id ? list.filter(function (p) { return p.id === id; })[0] : null;
      var entry = {
        id: existing ? existing.id : A.lang.uid('profile'),
        name: String(name || 'Профиль').slice(0, 60),
        createdAt: existing ? existing.createdAt : Date.now(),
        updatedAt: Date.now(),
        config: norm.normalizeConfig(config)
      };
      var next = existing
        ? list.map(function (p) { return p.id === entry.id ? entry : p; })
        : list.concat([entry]);
      return persist(next).then(function () { return entry; });
    });
  }

  function remove(id) {
    return loadAll().then(function (list) {
      return persist(list.filter(function (p) { return p.id !== id; }));
    });
  }

  function get(id) {
    return loadAll().then(function (list) {
      return list.filter(function (p) { return p.id === id; })[0] || null;
    });
  }

  function activate(id) {
    return get(id).then(function (profile) {
      if (!profile) return null;
      // Сначала кладём конфиг профиля, потом помечаем активный профиль:
      // в обратном порядке replaceRaw затирал бы метку.
      return A.config.store.replaceRaw(profile.config).then(function () {
        return A.config.store.patchSection('meta', { activeProfile: profile.id });
      });
    });
  }

  function exportBundle(config) {
    return loadAll().then(function (profiles) {
      return JSON.stringify({
        kind: 'aonc-bundle',
        version: A.VERSION,
        exportedAt: new Date().toISOString(),
        config: norm.normalizeConfig(config),
        profiles: profiles.map(function (p) {
          return { id: p.id, name: p.name, createdAt: p.createdAt, config: p.config };
        })
      }, null, 2);
    });
  }

  function importBundle(text) {
    var parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      return Promise.reject(new Error('Файл не является корректным JSON'));
    }

    if (!parsed || typeof parsed !== 'object') return Promise.reject(new Error('Пустой файл'));

    var isBundle = parsed.kind === 'aonc-bundle';
    var config = isBundle ? parsed.config : parsed;
    if (!norm.isConfig(config) && !config.theme) {
      return Promise.reject(new Error('В файле нет конфигурации AnimeOn Studio'));
    }

    var normalized = norm.normalizeConfig(config);
    var work = A.config.store.replaceRaw(normalized);

    if (isBundle && Array.isArray(parsed.profiles) && parsed.profiles.length) {
      work = work.then(function () {
        return persist(parsed.profiles.map(function (p) {
          return {
            id: p.id || A.lang.uid('profile'),
            name: p.name || 'Профиль',
            createdAt: p.createdAt || Date.now(),
            updatedAt: Date.now(),
            config: norm.normalizeConfig(p.config)
          };
        }));
      });
    }

    return work.then(function () { return normalized; });
  }

  return {
    loadAll: loadAll,
    save: save,
    remove: remove,
    get: get,
    activate: activate,
    exportBundle: exportBundle,
    importBundle: importBundle
  };
});
