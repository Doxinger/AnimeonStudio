AONC.define('content.tweaks.perf', function (A) {
  'use strict';

  var SITE = A.config.selectors.site;
  var state = { observer: null, mode: 'default', prefetchObserver: null };

  function writePerfStorage(mode) {
    try {
      if (mode === 'default') localStorage.removeItem(SITE.perfStorageKey);
      else localStorage.setItem(SITE.perfStorageKey, mode);
    } catch (e) {}
  }

  function applyPerfClass(mode) {
    var el = document.documentElement;
    if (!el) return;
    if (mode === 'lite') el.classList.add(SITE.perfClass);
    else el.classList.remove(SITE.perfClass);
  }

  function watchPrefetch(enabled) {
    if (!enabled) {
      if (state.prefetchObserver) {
        try { state.prefetchObserver.disconnect(); } catch (e) {}
        state.prefetchObserver = null;
      }
      return;
    }
    if (state.prefetchObserver) return;

    var strip = function () {
      var links = document.querySelectorAll('link[rel="prefetch"], link[rel="preload"][as="document"]');
      for (var i = 0; i < links.length; i++) {
        if (!links[i].hasAttribute('data-aonc-kept')) {
          links[i].setAttribute('data-aonc-removed', '1');
          if (links[i].parentNode) links[i].parentNode.removeChild(links[i]);
        }
      }
    };

    strip();
    state.prefetchObserver = new MutationObserver(A.lang.throttle(strip, 500));
    state.prefetchObserver.observe(document.documentElement, { childList: true, subtree: true });
  }

  function apply(config) {
    var perf = config.performance || {};
    var mode = perf.perfMode === 'lite' || perf.perfMode === 'full' ? perf.perfMode : 'default';

    if (mode !== state.mode) {
      writePerfStorage(mode);
      state.mode = mode;
    }
    applyPerfClass(mode);
    watchPrefetch(!!perf.disablePrefetch);
  }

  function reset() {
    writePerfStorage('default');
    applyPerfClass('default');
    state.mode = 'default';
    watchPrefetch(false);
  }

  return { apply: apply, reset: reset, writePerfStorage: writePerfStorage, applyPerfClass: applyPerfClass };
});
