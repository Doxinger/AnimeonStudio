AONC.define('content.themeMode', function (A) {
  'use strict';

  var SITE = A.config.selectors.site;
  var state = {
    mode: 'dark',
    observer: null,
    mql: null,
    mqlHandler: null,
    applying: false
  };

  function systemPrefersDark() {
    try {
      return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    } catch (e) {
      return true;
    }
  }

  function desiredClass() {
    if (state.mode === 'light') return SITE.lightClass;
    if (state.mode === 'auto') return systemPrefersDark() ? SITE.darkClass : SITE.lightClass;
    return SITE.darkClass;
  }

  function apply() {
    var el = document.documentElement;
    if (!el) return;
    var want = desiredClass();
    var other = want === SITE.darkClass ? SITE.lightClass : SITE.darkClass;

    state.applying = true;
    if (el.classList.contains(other)) el.classList.remove(other);
    if (!el.classList.contains(want)) el.classList.add(want);
    el.setAttribute('data-aonc-mode', state.mode);
    state.applying = false;
  }

  function watch() {
    if (state.observer || typeof MutationObserver === 'undefined') return;
    var pending = false;
    state.observer = new MutationObserver(function (records) {
      if (state.applying) return;
      for (var i = 0; i < records.length; i++) {
        if (records[i].attributeName === 'class' || records[i].attributeName === 'style') {
          pending = true;
          break;
        }
      }
      if (!pending) return;
      pending = false;
      var el = document.documentElement;
      var want = desiredClass();
      var other = want === SITE.darkClass ? SITE.lightClass : SITE.darkClass;
      if (el.classList.contains(other) || !el.classList.contains(want)) apply();
    });
    state.observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style']
    });
  }

  function watchSystem() {
    if (!window.matchMedia) return;
    if (state.mql) return;
    state.mql = window.matchMedia('(prefers-color-scheme: dark)');
    state.mqlHandler = function () {
      if (state.mode === 'auto') apply();
    };
    if (state.mql.addEventListener) state.mql.addEventListener('change', state.mqlHandler);
    else if (state.mql.addListener) state.mql.addListener(state.mqlHandler);
  }

  function setMode(mode) {
    state.mode = mode === 'light' || mode === 'auto' ? mode : 'dark';
    apply();
    watch();
    watchSystem();
  }

  function reassert() {
    apply();
  }

  function destroy() {
    if (state.observer) {
      try { state.observer.disconnect(); } catch (e) {}
      state.observer = null;
    }
    if (state.mql && state.mqlHandler) {
      try {
        if (state.mql.removeEventListener) state.mql.removeEventListener('change', state.mqlHandler);
        else if (state.mql.removeListener) state.mql.removeListener(state.mqlHandler);
      } catch (e) {}
    }
    state.mql = null;
    state.mqlHandler = null;
  }

  function boot(mode) {
    setMode(mode || 'dark');
    var el = document.documentElement;
    if (!el) return;
    var tries = 0;
    var timer = setInterval(function () {
      tries++;
      reassert();
      if (tries > 20) clearInterval(timer);
    }, 100);
  }

  return {
    boot: boot,
    setMode: setMode,
    reassert: reassert,
    apply: apply,
    destroy: destroy,
    desiredClass: desiredClass
  };
});
