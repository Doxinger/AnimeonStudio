AONC.define('dom.ready', function () {
  'use strict';

  function ready() {
    return new Promise(function (resolve) {
      if (typeof document === 'undefined') return resolve();
      if (document.readyState !== 'loading') return resolve();
      document.addEventListener('DOMContentLoaded', function () { resolve(); }, { once: true });
    });
  }

  function waitFor(selector, opts) {
    var o = opts || {};
    var timeout = o.timeout == null ? 15000 : o.timeout;
    var root = o.root || (typeof document !== 'undefined' ? document : null);
    if (!root) return Promise.resolve(null);

    return new Promise(function (resolve) {
      var found = root.querySelector(selector);
      if (found) return resolve(found);
      if (timeout <= 0) return resolve(null);

      var done = false;
      var finish = function (el) {
        if (done) return;
        done = true;
        try { mo.disconnect(); } catch (e) {}
        clearTimeout(timer);
        resolve(el || null);
      };

      var mo = new MutationObserver(function () {
        var el = root.querySelector(selector);
        if (el) finish(el);
      });
      mo.observe(root.documentElement || root, { childList: true, subtree: true });

      var timer = setTimeout(function () { finish(root.querySelector(selector)); }, timeout);
    });
  }

  function observe(target, callback, options) {
    if (!target || typeof MutationObserver === 'undefined') return function () {};
    var mo = new MutationObserver(callback);
    mo.observe(target, options || { childList: true, subtree: true });
    return function () {
      try { mo.disconnect(); } catch (e) {}
    };
  }

  function onEvent(target, type, handler, options) {
    if (!target || !target.addEventListener) return function () {};
    target.addEventListener(type, handler, options);
    return function () {
      try { target.removeEventListener(type, handler, options); } catch (e) {}
    };
  }

  function queryAll(selector, rootEl) {
    try {
      return Array.prototype.slice.call((rootEl || document).querySelectorAll(selector));
    } catch (e) {
      return [];
    }
  }

  function first(selectors, rootEl) {
    var list = Array.isArray(selectors) ? selectors : [selectors];
    for (var i = 0; i < list.length; i++) {
      try {
        var el = (rootEl || document).querySelector(list[i]);
        if (el) return el;
      } catch (e) {}
    }
    return null;
  }

  return {
    ready: ready,
    waitFor: waitFor,
    observe: observe,
    onEvent: onEvent,
    queryAll: queryAll,
    first: first
  };
});

AONC.define('dom.queryAll', function (A) { return A.dom.ready.queryAll; });
AONC.define('dom.first', function (A) { return A.dom.ready.first; });
AONC.define('dom.observe', function (A) { return A.dom.ready.observe; });
AONC.define('dom.onEvent', function (A) { return A.dom.ready.onEvent; });
AONC.define('dom.waitFor', function (A) { return A.dom.ready.waitFor; });
