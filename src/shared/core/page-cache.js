AONC.define('pageCache', function (A) {
  'use strict';

  var KEY = A.PAGE_CSS_KEY;

  function available() {
    try {
      return typeof localStorage !== 'undefined' && !!localStorage;
    } catch (e) {
      return false;
    }
  }

  function read() {
    if (!available()) return null;
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (e) {
      return null;
    }
  }

  function write(payload) {
    if (!available()) return false;
    try {
      localStorage.setItem(KEY, JSON.stringify({
        v: A.VERSION,
        t: Date.now(),
        css: payload.css || '',
        mode: payload.mode || 'dark',
        boot: payload.boot || null
      }));
      return true;
    } catch (e) {
      return false;
    }
  }

  function clear() {
    if (!available()) return;
    try { localStorage.removeItem(KEY); } catch (e) {}
  }

  function isFresh(entry) {
    return !!entry && entry.v === A.VERSION && typeof entry.css === 'string';
  }

  return { read: read, write: write, clear: clear, isFresh: isFresh, KEY: KEY };
});
