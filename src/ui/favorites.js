AONC.define('ui.favorites', function (A) {
  'use strict';

  function list() {
    return A.ui.state.get('meta.favorites') || [];
  }

  function has(path) {
    return list().indexOf(path) !== -1;
  }

  function toggle(path) {
    if (!path) return false;
    var current = list().slice();
    var index = current.indexOf(path);
    if (index === -1) current.push(path);
    else current.splice(index, 1);
    A.ui.state.set('meta.favorites', current);
    return index === -1;
  }

  function remove(path) {
    if (!has(path)) return;
    toggle(path);
  }

  function count() {
    return list().length;
  }

  return { list: list, has: has, toggle: toggle, remove: remove, count: count };
});
