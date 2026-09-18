AONC.define('lang', function () {
  'use strict';

  function clamp(v, min, max) {
    v = Number(v);
    if (!isFinite(v)) v = min;
    return v < min ? min : v > max ? max : v;
  }

  function num(v, fallback) {
    var n = Number(v);
    return isFinite(n) ? n : fallback;
  }

  function bool(v, fallback) {
    return typeof v === 'boolean' ? v : !!fallback;
  }

  function uid(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  function debounce(fn, wait) {
    var t = null;
    return function () {
      var self = this, args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, wait == null ? 120 : wait);
    };
  }

  function throttle(fn, wait) {
    var last = 0, timer = null;
    return function () {
      var self = this, args = arguments, now = Date.now();
      var remain = (wait == null ? 100 : wait) - (now - last);
      if (remain <= 0) {
        last = now;
        fn.apply(self, args);
      } else if (!timer) {
        timer = setTimeout(function () {
          timer = null;
          last = Date.now();
          fn.apply(self, args);
        }, remain);
      }
    };
  }

  function isPlainObject(v) {
    return !!v && typeof v === 'object' && !Array.isArray(v);
  }

  function deepMerge(base, patch) {
    if (!isPlainObject(patch)) return base;
    var out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
    Object.keys(patch).forEach(function (k) {
      var pv = patch[k], bv = out[k];
      if (isPlainObject(pv) && isPlainObject(bv)) out[k] = deepMerge(bv, pv);
      else if (pv !== undefined) out[k] = pv;
    });
    return out;
  }

  function clone(v) {
    if (Array.isArray(v)) return v.map(clone);
    if (isPlainObject(v)) {
      var o = {};
      Object.keys(v).forEach(function (k) { o[k] = clone(v[k]); });
      return o;
    }
    return v;
  }

  function coerce(shape, value) {
    if (Array.isArray(shape)) {
      if (!Array.isArray(value)) return clone(shape);
      return value.map(function (v) {
        return isPlainObject(shape[0]) && isPlainObject(v) ? coerce(shape[0], v) : v;
      });
    }
    if (isPlainObject(shape)) {
      var out = {};
      Object.keys(shape).forEach(function (k) {
        out[k] = value && k in value ? coerce(shape[k], value[k]) : clone(shape[k]);
      });
      return out;
    }
    if (typeof shape === 'number') return num(value, shape);
    if (typeof shape === 'boolean') return bool(value, shape);
    if (typeof shape === 'string') return value == null ? shape : String(value);
    return value === undefined ? clone(shape) : value;
  }

  function normalize(defaults, patch) {
    return coerce(defaults, deepMerge(defaults, patch || {}));
  }

  function escapeRegExp(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function compact(arr) {
    return (arr || []).filter(function (x) { return x !== '' && x != null && x !== false; });
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function groupBy(list, keyFn) {
    return (list || []).reduce(function (acc, item) {
      var k = keyFn(item);
      (acc[k] = acc[k] || []).push(item);
      return acc;
    }, {});
  }

  return {
    clamp: clamp,
    num: num,
    bool: bool,
    uid: uid,
    debounce: debounce,
    throttle: throttle,
    isPlainObject: isPlainObject,
    deepMerge: deepMerge,
    clone: clone,
    coerce: coerce,
    normalize: normalize,
    escapeRegExp: escapeRegExp,
    compact: compact,
    escapeHtml: escapeHtml,
    groupBy: groupBy
  };
});
