AONC.define('api', function () {
  'use strict';

  var raw =
    (typeof browser !== 'undefined' && browser && browser.runtime) ? browser :
    (typeof chrome !== 'undefined' && chrome) ? chrome : null;

  function lastError() {
    try {
      return raw && raw.runtime ? raw.runtime.lastError : null;
    } catch (e) {
      return null;
    }
  }

  function promisify(obj, method) {
    return function () {
      var args = Array.prototype.slice.call(arguments);
      return new Promise(function (resolve, reject) {
        try {
          if (!obj || typeof obj[method] !== 'function') return resolve(undefined);
          var ret = obj[method].apply(obj, args.concat([function (res) {
            var err = lastError();
            if (err) reject(new Error(err.message || String(err)));
            else resolve(res);
          }]));
          if (ret && typeof ret.then === 'function') ret.then(resolve, reject);
        } catch (e) {
          reject(e);
        }
      });
    };
  }

  function area(name) {
    var store = raw && raw.storage ? raw.storage[name] : null;
    return {
      get: promisify(store, 'get'),
      set: promisify(store, 'set'),
      remove: promisify(store, 'remove'),
      clear: promisify(store, 'clear')
    };
  }

  var local = area('local');
  var sync = area('sync');

  var store = {
    get: function (keys) {
      return local.get(keys)
        .catch(function () { return {}; })
        .then(function (r) { return r || {}; });
    },
    set: function (obj) {
      return local.set(obj).catch(function () { return false; });
    },
    remove: function (keys) {
      return local.remove(keys).catch(function () { return false; });
    }
  };

  // fetch с таймаутом: сетевая «чёрная дыра» не должна вечно держать промис —
  // фоновые обработчики оставляют открытым канал сообщения, а клиентские
  // защиты (state.loading / inflight) застревают до перезагрузки страницы.
  function fetchWithTimeout(url, opts, ms) {
    var timeout = ms > 0 ? ms : 15000;
    var o = {};
    if (opts) {
      Object.keys(opts).forEach(function (k) { o[k] = opts[k]; });
    }
    if (typeof AbortController === 'function' && !o.signal) {
      var ctrl = new AbortController();
      o.signal = ctrl.signal;
      var timer = setTimeout(function () {
        try { ctrl.abort(); } catch (e) {}
      }, timeout);
      return fetch(url, o).then(function (res) {
        clearTimeout(timer);
        return res;
      }, function (err) {
        clearTimeout(timer);
        throw err;
      });
    }
    return fetch(url, o);
  }

  function onStorageChanged(cb) {
    if (!raw || !raw.storage || !raw.storage.onChanged) return function () {};
    var handler = function (changes, areaName) { cb(changes, areaName); };
    raw.storage.onChanged.addListener(handler);
    return function () {
      try { raw.storage.onChanged.removeListener(handler); } catch (e) {}
    };
  }

  function sendMessage(msg) {
    return new Promise(function (resolve) {
      try {
        if (!raw || !raw.runtime || !raw.runtime.sendMessage) return resolve(undefined);
        var ret = raw.runtime.sendMessage(msg, function (res) {
          lastError();
          resolve(res);
        });
        if (ret && typeof ret.then === 'function') ret.then(resolve, function () { resolve(undefined); });
      } catch (e) {
        resolve(undefined);
      }
    });
  }

  function onMessage(cb) {
    if (!raw || !raw.runtime || !raw.runtime.onMessage) return function () {};
    var handler = function (msg, sender, sendResponse) {
      var out = cb(msg, sender, sendResponse);
      if (out && typeof out.then === 'function') {
        out.then(function (v) { sendResponse(v); }, function () { sendResponse(undefined); });
        return true;
      }
      return out;
    };
    raw.runtime.onMessage.addListener(handler);
    return function () {
      try { raw.runtime.onMessage.removeListener(handler); } catch (e) {}
    };
  }

  var tabs = null;
  if (raw && raw.tabs) {
    tabs = {
      query: promisify(raw.tabs, 'query'),
      reload: promisify(raw.tabs, 'reload'),
      update: promisify(raw.tabs, 'update'),
      sendMessage: function (tabId, msg) {
        return new Promise(function (resolve) {
          try {
            raw.tabs.sendMessage(tabId, msg, function (res) {
              lastError();
              resolve(res);
            });
          } catch (e) {
            resolve(undefined);
          }
        });
      }
    };
  }

  var ua = typeof navigator !== 'undefined' ? (navigator.userAgent || '') : '';

  function isContextValid() {
    try {
      return !!(raw && raw.runtime && raw.runtime.id);
    } catch (e) {
      return false;
    }
  }

  return {
    raw: raw,
    store: store,
    local: local,
    sync: sync,
    tabs: tabs,
    onStorageChanged: onStorageChanged,
    sendMessage: sendMessage,
    fetchWithTimeout: fetchWithTimeout,
    onMessage: onMessage,
    isContextValid: isContextValid,
    isFirefox: /firefox/i.test(ua),
    isChrome: /chrome|chromium/i.test(ua),
    extensionId: raw && raw.runtime ? raw.runtime.id : null,
    getURL: function (p) { return raw && raw.runtime ? raw.runtime.getURL(p) : p; }
  };
});
