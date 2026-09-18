AONC.define('content.themeFx', function (A) {
  'use strict';

  var CLASS = 'aonc-theme-switch';
  var HOLD_MS = 480;
  var timer = null;

  function flash() {
    var el = document.documentElement;
    if (!el) return;
    el.classList.add(CLASS);
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () {
      el.classList.remove(CLASS);
      timer = null;
    }, HOLD_MS);
  }

  function stop() {
    if (timer) clearTimeout(timer);
    timer = null;
    var el = document.documentElement;
    if (el) el.classList.remove(CLASS);
  }

  return { flash: flash, stop: stop, CLASS: CLASS };
});
