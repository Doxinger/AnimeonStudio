AONC.define('content.messaging', function (A) {
  'use strict';

  var T = A.messaging.TYPE;

  var handlers = {};

  handlers[T.PING] = function () {
    var root = document.documentElement;
    return {
      pong: true,
      version: A.VERSION,
      url: location.href,
      picker: A.content.picker.isActive(),
      modes: {
        theater: root.classList.contains('aonc-theater'),
        cinema: root.classList.contains('aonc-cinema'),
        maxplayer: A.content.classes.getRuntime('aonc-maxplayer')
      },
      stats: A.content.applier.stats()
    };
  };

  handlers[T.CONFIG_GET] = function () {
    return A.content.config.current();
  };

  handlers[T.CSS_PREVIEW] = function (payload) {
    var config = payload && payload.config
      ? A.config.normalize.normalizeConfig(payload.config)
      : A.content.config.current();
    var result = A.cssBuilder.build(config, location.pathname + location.search);
    return { css: result.css, stats: result.stats };
  };

  handlers[T.CACHE_CLEAR] = function () {
    A.pageCache.clear();
    A.content.applier.reapply();
    return { cleared: true, stats: A.content.applier.stats() };
  };

  handlers[T.APPLY] = function (payload) {
    var config = payload && payload.config
      ? A.content.config.set(payload.config)
      : A.content.config.current();
    A.content.bootstrap.applyAll(config, { force: true });
    return A.content.applier.stats();
  };

  handlers[T.TOGGLE_ENABLED] = function () {
    var config = A.content.config.current();
    var next = !config.meta.enabled;
    return A.content.config.patch({ meta: { enabled: next } }).then(function () {
      return { enabled: next };
    });
  };

  handlers[T.PICKER_START] = function () { A.content.picker.start(); return { active: true }; };
  handlers[T.PICKER_STOP] = function () { A.content.picker.stop(); return { active: false }; };
  handlers[T.PICKER_STATE] = function () { return { active: A.content.picker.isActive() }; };

  handlers[T.SHOWCASE_GRAB] = function () {
    return A.content.tweaks.showcase.grabFromPage();
  };

  handlers[T.ELEMENT_HIDE] = function (payload) {
    var selector = payload && payload.selector;
    if (!selector) return { hidden: false };
    A.content.picker.quickHide({ selector: selector });
    return { hidden: true };
  };

  handlers[T.THEATER_TOGGLE] = function () {
    return { on: A.content.tweaks.player.toggleTheater() };
  };

  handlers[T.CINEMA_TOGGLE] = function () {
    return { on: A.content.tweaks.player.toggleCinema() };
  };

  handlers[T.DIAGNOSTICS] = function () {
    var config = A.content.config.current();
    var styleEl = document.getElementById(A.STYLE_ID);
    var styleText = styleEl ? styleEl.textContent : '';
    var bodyCs = typeof getComputedStyle === 'function' ? getComputedStyle(document.body) : null;
    var beforeCs = typeof getComputedStyle === 'function' ? getComputedStyle(document.body, '::before') : null;
    var mainEl = document.querySelector('main');

    var wp = config.wallpaper || {};
    return {
      version: A.VERSION,
      url: location.href,
      enabled: config.meta.enabled,
      preset: config.theme.preset,
      mode: config.theme.mode,
      darkClass: document.documentElement.classList.contains('dark'),
      hiddenSections: A.cssBuilder.visibility.listHidden(config.visibility).map(function (x) { return x.label; }),
      elementRules: (config.elements.rules || []).filter(function (r) { return r.enabled; }).length,
      injector: A.content.styleInjector.stats(),
      builder: A.content.applier.stats(),
      modules: A.__modules.length,
      styleBytes: styleText.length,
      styleHasWallpaper: styleText.indexOf('Wallpaper') !== -1,
      wallpaper: {
        enabled: !!wp.enabled,
        source: wp.source,
        preset: wp.preset,
        hasUrl: !!wp.url,
        hasData: !!wp.dataUrl,
        dataLen: (wp.dataUrl || '').length,
        rules: (wp.rules || []).filter(function (r) { return r.enabled; }).length,
        overlay: wp.overlay,
        showThrough: wp.showThrough,
        pseudoBackgroundImage: beforeCs ? String(beforeCs.backgroundImage).slice(0, 140) : null,
        healLayerActive: A.content.tweaks.wallpaper.layerActive(),
        bodyBackground: bodyCs ? bodyCs.backgroundColor : null,
        mainBackground: mainEl && bodyCs ? getComputedStyle(mainEl).backgroundColor : null
      },
      blockedTrackers: A.content.tweaks.privacy.getCount(),
      privacyStats: A.content.tweaks.privacy.getStats(),
      perfMode: (function () {
        try { return localStorage.getItem(A.config.selectors.site.perfStorageKey); } catch (e) { return null; }
      })(),
      hotkeys: A.content.hotkeys.list()
    };
  };

  handlers[T.PRIVACY_STATS] = function (payload) {
    var action = payload && payload.action;
    if (action === 'reset') return { ok: true, stats: A.content.tweaks.privacy.resetStats() };
    return { ok: true, stats: A.content.tweaks.privacy.getStats() };
  };

  handlers[T.STATE_SET] = function (payload) {
    if (!payload || !payload.key) return { ok: false };
    var on = null;
    if (payload.key === 'theater') on = A.content.tweaks.player.toggleTheater();
    if (payload.key === 'cinema') on = A.content.tweaks.player.toggleCinema();
    if (payload.key === 'maxplayer') on = A.content.tweaks.player.toggleMaxPlayer();
    return { ok: on !== null, key: payload.key, on: !!on };
  };

  function start() {
    return A.api.onMessage(A.messaging.router(handlers));
  }

  return { start: start, handlers: handlers };
});
