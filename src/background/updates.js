// Проверка обновлений БЕЗ автообновления: фон раз в 12 часов (и при старте)
// читает JSON с версией релиза, сравнивает с текущей и кладёт результат в
// storage.local. Установка — только вручную: студия показывает плашку
// «доступна версия vX» и ссылку на файл. Никаких загрузок/подмен кода.
//
// Формат JSON (можно хранить где угодно, хоть в gist):
//   { "version": "1.2.0", "xpi": "https://…/animeon-studio-1.2.0.xpi", "notes": "https://…" }
AONC.define('background.updates', function (A) {
  'use strict';

  var KEY = 'aonc.updateCheck';
  var ALARM = 'aonc-update-check';
  var DEFAULT_URL = A.DEFAULT_UPDATE_URL;
  var PERIOD_MIN = 12 * 60;
  var STARTUP_MIN_GAP = 6 * 60; // при старте SW не дёргаем сеть чаще раза в 6 часов
  var FETCH_TIMEOUT = 15000;

  function meta(config) {
    return (config && config.meta) || {};
  }

  function enabled(config) {
    return !!meta(config).updateCheck;
  }

  function urlOf(config) {
    return String(meta(config).updateUrl || '').trim() || DEFAULT_URL;
  }

  function read() {
    return A.api.store.get([KEY]).then(function (data) {
      return (data && data[KEY]) || null;
    }).catch(function () { return null; });
  }

  function write(entry) {
    var payload = {};
    payload[KEY] = entry;
    return A.api.store.set(payload).catch(function () { return false; });
  }

  function status(entry, config, extra) {
    var s = {
      enabled: enabled(config),
      current: A.VERSION,
      url: urlOf(config),
      latest: entry ? String(entry.latest || '') : '',
      available: !!(entry && entry.available),
      xpi: entry ? String(entry.xpi || '') : '',
      notes: entry ? String(entry.notes || '') : '',
      checkedAt: entry ? (entry.at || 0) : 0
    };
    if (extra && extra.error) s.error = String(extra.error);
    return s;
  }

  function statusNow() {
    return A.background.state.load().then(function (config) {
      return read().then(function (entry) { return status(entry, config); });
    });
  }

  // force=true — пользователь нажал «Проверить сейчас» (игнорируем тумблер
  // и любые промежутки); force=false — плановая проверка.
  function check(force) {
    return A.background.state.load().then(function (config) {
      if (!enabled(config) && !force) {
        return read().then(function (entry) { return status(entry, config); });
      }
      var target = urlOf(config);
      return A.api.fetchWithTimeout(target, {
        cache: 'no-store',
        headers: { accept: 'application/json' }
      }, FETCH_TIMEOUT).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      }).then(function (json) {
        var latest = String((json && json.version) || '').trim();
        if (!/^\d+\.\d+\.\d+$/.test(latest)) throw new Error('в JSON нет корректного поля version');
        var entry = {
          at: Date.now(),
          url: target,
          latest: latest,
          xpi: String(json.xpi || json.download || '').trim(),
          notes: String(json.notes || json.changelog || '').trim(),
          available: A.config.changelog.compare(latest, A.VERSION) > 0
        };
        return write(entry).then(function () { return status(entry, config); });
      }).catch(function (e) {
        // сеть/404/битый JSON не ломают ничего: показываем ошибку поверх
        // последнего известного состояния
        return read().then(function (entry) {
          return status(entry, config, { error: (e && e.message) || String(e) });
        });
      });
    });
  }

  function start() {
    var api = A.api.raw;
    if (api && api.alarms && api.alarms.onAlarm) {
      api.alarms.onAlarm.addListener(function (alarm) {
        if (alarm && alarm.name === ALARM) check(false);
      });
      try { api.alarms.create(ALARM, { periodInMinutes: PERIOD_MIN }); } catch (e) {}
    }
    A.background.state.load().then(function (config) {
      if (!enabled(config)) return null;
      return read().then(function (entry) {
        if (entry && entry.at && Date.now() - entry.at < STARTUP_MIN_GAP * 60 * 1000) return null;
        return check(false);
      });
    }).catch(function () {});
  }

  return {
    start: start,
    check: check,
    statusNow: statusNow,
    read: read,
    DEFAULT_URL: DEFAULT_URL,
    KEY: KEY
  };
});
