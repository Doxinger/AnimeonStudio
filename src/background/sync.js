// Синхронизация настроек через storage.sync (между устройствами одного
// браузерного профиля).
//
// Ограничения платформы, из-за которых синк в 1.0.x молча умирал:
//  · QUOTA_BYTES_PER_ITEM ≈ 8192 байт на запись — обои, загруженные с диска,
//    хранятся как data-URL (мегабайты) и роняли каждый push; теперь dataUrl
//    в payload не попадает, файл остаётся локальным на устройстве;
//  · payload собирается с контролем размера: домены по приоритету
//    (тема — всегда), хвост отбрасывается, пока не влезем в квоту;
//  · метка последнего синка (aonc.syncT в storage.local) защищает от
//    применения устаревшего удалённого снимка (раньше lastSyncT никогда не
//    записывался и любой payload с t>0 перезаписывал локальные правки);
//  · штамп последнего отправленного контента гасит эхо: push → собственный
//    sync-событие → apply → save → push… больше не крутится.
AONC.define('background.sync', function (A) {
  'use strict';

  var KEY = 'aoncSync';
  var KEY_T = 'aonc.syncT';
  var MAX_ITEM_BYTES = 7800; // 8192 минус ключ и запас
  var DEBOUNCE = 600;

  // Домены в порядке приоритета: при превышении квоты хвост отбрасывается.
  // Тяжёлые и рискованные (elements.rules, custom-сниппеты, профили) не
  // синхронизируются сознательно.
  var PARTS = ['theme', 'wallpaper', 'typography', 'glass', 'layout', 'chat', 'identity', 'cosmetics', 'performance'];

  var pushTimer = null;
  var applyingRemote = false;
  var lastPushed = '';
  var lastSyncT = 0;

  function enabled(config) {
    return !!(config.meta && config.meta.syncEnabled);
  }

  function warn(err) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('[AnimeOn Studio] синхронизация: ' + ((err && (err.message || err.error)) || err || 'неизвестная ошибка'));
    }
  }

  function lightWallpaper(w) {
    var copy = A.lang.clone(w || {});
    copy.dataUrl = ''; // файл обоев остаётся на устройстве: в квоту sync он не влезает
    return copy;
  }

  function parts(config) {
    var out = {};
    PARTS.forEach(function (k) {
      out[k] = k === 'wallpaper' ? lightWallpaper(config[k]) : A.lang.clone(config[k] || {});
    });
    return out;
  }

  // Приблизительный UTF-8 размер: не-ASCII символы считаем за 2 байта.
  function byteSize(str) {
    return String(str).replace(/[^\x00-\x7F]/g, 'xx').length;
  }

  function stamp(config) {
    try { return JSON.stringify(parts(config)); } catch (e) { return ''; }
  }

  function subset(config) {
    var p = parts(config);
    var keys = PARTS.slice();
    while (keys.length > 1) {
      var payload = { v: 2, t: Date.now(), parts: keys.slice() };
      keys.forEach(function (k) { payload[k] = p[k]; });
      var size = Infinity;
      try { size = byteSize(JSON.stringify(payload)); } catch (e) {}
      if (size <= MAX_ITEM_BYTES) return payload;
      keys.pop();
    }
    return { v: 2, t: Date.now(), parts: ['theme'], theme: p.theme };
  }

  // Список доменов payload; понимаём и старый формат v1 (theme+wallpaper).
  function payloadParts(payload) {
    if (!payload || typeof payload !== 'object') return [];
    if (payload.v === 2 && Array.isArray(payload.parts)) {
      return payload.parts.filter(function (k) {
        return PARTS.indexOf(k) !== -1 && payload[k] && typeof payload[k] === 'object';
      });
    }
    if (!payload.v || payload.v === 1) {
      return ['theme', 'wallpaper'].filter(function (k) {
        return payload[k] && typeof payload[k] === 'object';
      });
    }
    return [];
  }

  function rememberSyncT(t) {
    lastSyncT = t || 0;
    var entry = {};
    entry[KEY_T] = lastSyncT;
    return A.api.store.set(entry);
  }

  function recallSyncT() {
    return A.api.store.get([KEY_T]).then(function (data) {
      lastSyncT = (data && data[KEY_T]) || 0;
      return lastSyncT;
    }).catch(function () { return 0; });
  }

  function push(config) {
    if (!enabled(config)) return Promise.resolve(false);
    if (applyingRemote) return Promise.resolve(false);
    if (pushTimer) clearTimeout(pushTimer);
    return new Promise(function (resolve) {
      pushTimer = setTimeout(function () {
        pushTimer = null;
        var content = stamp(config);
        if (content && content === lastPushed) { resolve(false); return; } // эхо: контент не менялся
        var payload = subset(config);
        var entry = {};
        entry[KEY] = payload;
        // Помечаем оптимистично ДО записи: Chrome дублирует storage.onChanged
        // в тот же контекст, и без метки собственный push запускал бы лишний
        // applyRemote. При ошибке откатываем.
        var prevPushed = lastPushed;
        var prevT = lastSyncT;
        lastPushed = content;
        lastSyncT = payload.t;
        A.api.sync.set(entry).then(function () {
          return rememberSyncT(payload.t);
        }).then(function () {
          resolve(true);
        }, function (err) {
          lastPushed = prevPushed;
          lastSyncT = prevT;
          warn(err);
          resolve(false);
        });
      }, DEBOUNCE);
    });
  }

  function pull() {
    return A.api.sync.get([KEY]).then(function (data) {
      return (data && data[KEY]) || null;
    }).catch(function (err) {
      warn(err);
      return null;
    });
  }

  function applyRemote(payload) {
    if (!payload) return Promise.resolve(false);
    var t = payload.t || 0;
    if (t && t <= lastSyncT) return Promise.resolve(false); // эхо собственного push или устаревший снимок
    var keys = payloadParts(payload);
    if (!keys.length) return Promise.resolve(false);
    applyingRemote = true;
    return A.background.state.load().then(function (config) {
      var next = A.lang.clone(config);
      keys.forEach(function (k) {
        var defaults = (A.config.defaults && A.config.defaults[k]) || {};
        var incoming = A.lang.normalize(defaults, payload[k]);
        if (k === 'wallpaper') {
          // Удалённый payload никогда не несёт dataUrl; если оба устройства
          // выбрали обои-файл — сохраняем локальный файл, а не гасим его.
          var local = config.wallpaper || {};
          if (incoming.source === 'file' && !incoming.dataUrl && local.dataUrl) {
            incoming.dataUrl = local.dataUrl;
          }
        }
        next[k] = incoming;
      });
      next.meta = next.meta || {};
      next.meta.syncEnabled = true;
      lastPushed = stamp(next); // только что применённое не пушим обратно
      return A.background.state.save(next).then(function () {
        applyingRemote = false;
        return rememberSyncT(t).then(function () { return true; }, function () { return true; });
      }, function (err) {
        applyingRemote = false;
        warn(err);
        return false;
      });
    }).catch(function (err) {
      applyingRemote = false;
      warn(err);
      return false;
    });
  }

  function start() {
    A.api.onStorageChanged(function (changes, areaName) {
      if (areaName === 'local' && changes[A.STORAGE_KEY]) {
        var config = A.config.normalize.normalizeConfig(changes[A.STORAGE_KEY].newValue);
        if (enabled(config)) push(config);
        return;
      }
      if (areaName === 'sync' && changes[KEY] && !applyingRemote) {
        var payload = changes[KEY].newValue;
        if (payload && (!payload.t || payload.t > lastSyncT)) applyRemote(payload);
      }
    });

    recallSyncT().then(function () {
      return A.background.state.load();
    }).then(function (config) {
      if (!enabled(config)) return null;
      return pull().then(function (payload) {
        if (!payload) {
          push(config); // первое устройство — наполняем sync
          return null;
        }
        if ((payload.t || 0) > lastSyncT) return applyRemote(payload);
        lastPushed = stamp(config); // локальный не старше удалённого — не эхуем
        return null;
      });
    }).catch(function (err) { warn(err); });
  }

  function state() {
    return { lastSyncT: lastSyncT, lastPushedBytes: lastPushed.length, applyingRemote: applyingRemote };
  }

  return {
    start: start, push: push, pull: pull, applyRemote: applyRemote,
    subset: subset, payloadParts: payloadParts, state: state,
    KEY: KEY, KEY_T: KEY_T, PARTS: PARTS, MAX_ITEM_BYTES: MAX_ITEM_BYTES
  };
});
