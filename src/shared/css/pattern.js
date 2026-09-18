AONC.define('css.pattern', function () {
  'use strict';

  function asRegExp(pattern) {
    var s = String(pattern == null ? '' : pattern).trim();
    if (!s) return null;

    var wrapped = /^\/(.+)\/([gimsuy]*)$/.exec(s);
    if (wrapped) {
      try { return new RegExp(wrapped[1], wrapped[2]); } catch (e) { return null; }
    }

    if (s.indexOf('*') !== -1 || s.indexOf('?') !== -1) {
      var body = s
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');
      try { return new RegExp('^' + body); } catch (e) { return null; }
    }

    return null;
  }

  function matches(url, pattern) {
    var s = String(pattern == null ? '' : pattern).trim();
    if (!s) return false;
    var rx = asRegExp(s);
    if (rx) return rx.test(url);
    return String(url).indexOf(s) !== -1;
  }

  function matchesAny(url, patterns) {
    var list = Array.isArray(patterns) ? patterns.filter(Boolean) : [];
    if (!list.length) return true;
    for (var i = 0; i < list.length; i++) {
      if (matches(url, list[i])) return true;
    }
    return false;
  }

  function splitList(value) {
    if (Array.isArray(value)) return value.map(function (v) { return String(v).trim(); }).filter(Boolean);
    return String(value == null ? '' : value)
      .split(/[\n,]+/)
      .map(function (v) { return v.trim(); })
      .filter(Boolean);
  }

  function normalizeList(value) {
    var seen = {};
    return splitList(value).filter(function (v) {
      var k = v.toLowerCase();
      if (seen[k]) return false;
      seen[k] = true;
      return true;
    });
  }

  return {
    asRegExp: asRegExp,
    matches: matches,
    matchesAny: matchesAny,
    splitList: splitList,
    normalizeList: normalizeList
  };
});
