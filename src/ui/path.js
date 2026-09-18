AONC.define('ui.path', function () {
  'use strict';

  function parts(path) {
    return String(path || '').split('.').filter(Boolean);
  }

  function get(obj, path, fallback) {
    var keys = parts(path);
    var node = obj;
    for (var i = 0; i < keys.length; i++) {
      if (node == null) return fallback;
      node = node[keys[i]];
    }
    return node === undefined ? fallback : node;
  }

  function set(obj, path, value) {
    var keys = parts(path);
    if (!keys.length) return obj;
    var node = obj;
    for (var i = 0; i < keys.length - 1; i++) {
      if (node[keys[i]] == null || typeof node[keys[i]] !== 'object') node[keys[i]] = {};
      node = node[keys[i]];
    }
    node[keys[keys.length - 1]] = value;
    return obj;
  }

  function has(obj, path) {
    var keys = parts(path);
    var node = obj;
    for (var i = 0; i < keys.length; i++) {
      if (node == null || !(keys[i] in node)) return false;
      node = node[keys[i]];
    }
    return true;
  }

  function unset(obj, path) {
    var keys = parts(path);
    if (!keys.length) return obj;
    var node = obj;
    for (var i = 0; i < keys.length - 1; i++) {
      if (node == null) return obj;
      node = node[keys[i]];
    }
    if (node) delete node[keys[keys.length - 1]];
    return obj;
  }

  return { get: get, set: set, has: has, unset: unset, parts: parts };
});
