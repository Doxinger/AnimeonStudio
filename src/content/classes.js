AONC.define('content.classes', function (A) {
  'use strict';

  var FLAGS = [
    { key: 'aonc-theater', test: function (c) { return c.player.theaterMode; } },
    { key: 'aonc-cinema', test: function (c) { return c.player.cinemaLights; } },
    { key: 'aonc-wide', test: function (c) { return c.player.wideMode; } },
    { key: 'aonc-playing', test: function () { return false; } },
    { key: 'aonc-header-hidden', test: function (c) { return c.glass.headerHideOnScroll; } },
    { key: 'aonc-compact', test: function (c) { return c.glass.headerCompact; } },
    { key: 'aonc-clean-player', test: function (c) { return c.player.hideKodikBranding; } },
    { key: 'aonc-no-motion', test: function (c) { return c.performance.reduceMotion || c.performance.killAnimations; } },
    { key: 'aonc-perf', test: function (c) { return c.performance.perfMode === 'lite'; } },
    { key: 'aonc-maxplayer', test: function () { return false; } }
  ];

  var runtime = {
    'aonc-playing': false,
    'aonc-maxplayer': false,
    'aonc-header-away': false,
    'aonc-picker': false
  };

  function sync(config) {
    var el = document.documentElement;
    if (!el) return;
    FLAGS.forEach(function (flag) {
      var on = false;
      try { on = !!flag.test(config); } catch (e) { on = false; }
      if (runtime[flag.key] !== undefined) on = on || runtime[flag.key];
      el.classList.toggle(flag.key, on);
    });
  }

  function setRuntime(key, value) {
    if (!(key in runtime)) return;
    runtime[key] = !!value;
    document.documentElement.classList.toggle(key, !!value);
  }

  function getRuntime(key) {
    return !!runtime[key];
  }

  function reset() {
    var el = document.documentElement;
    if (!el) return;
    FLAGS.forEach(function (f) { el.classList.remove(f.key); });
    Object.keys(runtime).forEach(function (k) {
      if (k === 'aonc-picker') return;
      runtime[k] = false;
      el.classList.remove(k);
    });
  }

  return { FLAGS: FLAGS, sync: sync, setRuntime: setRuntime, getRuntime: getRuntime, reset: reset };
});
