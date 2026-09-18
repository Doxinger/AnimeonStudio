AONC.define('content.applier', function (A) {
  'use strict';

  var injector = A.content.styleInjector;
  var themeMode = A.content.themeMode;

  var last = { css: '', hash: '', stats: null, enabled: false };

  function hashOf(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) {
      h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    }
    return 'h' + (h >>> 0).toString(36);
  }

  function url() {
    return location.pathname + location.search;
  }

  function applyBoot() {
    var entry = A.content.config.bootEntry();
    if (!entry || !entry.css) return false;
    injector.writeBoot(entry.css);
    themeMode.boot(entry.mode || 'dark');
    last.css = entry.css;
    last.hash = hashOf(entry.css);
    last.enabled = true;
    return true;
  }

  function apply(config, options) {
    var opts = options || {};
    var enabled = !!(config && config.meta && config.meta.enabled);

    themeMode.setMode(enabled && config.theme ? config.theme.mode : 'dark');

    if (!enabled) {
      injector.remove();
      A.pageCache.clear();
      A.content.classes.reset();
      last = { css: '', hash: '', stats: null, enabled: false };
      return { applied: false, bytes: 0 };
    }

    var result = A.cssBuilder.build(config, url());
    var css = result.css;
    var hash = hashOf(css);

    if (!opts.force && hash === last.hash) {
      A.content.classes.sync(config);
      return { applied: false, bytes: css.length, unchanged: true, stats: result.stats };
    }

    injector.write(css);
    A.content.classes.sync(config);

    if (config.theme && config.theme.themeTransitions) A.content.themeFx.flash();

    last = { css: css, hash: hash, stats: result.stats, enabled: true };

    if (config.meta.instantApply !== false && css.length < 1500000) {
      A.pageCache.write({ css: css, mode: config.theme.mode });
    } else if (css.length >= 1500000) {
      A.pageCache.clear();
    }

    return { applied: true, bytes: css.length, stats: result.stats, palette: result.palette };
  }

  function reapply() {
    return apply(A.content.config.current(), { force: true });
  }

  function stats() {
    return {
      bytes: last.bytes || (last.css ? last.css.length : 0),
      hash: last.hash,
      enabled: last.enabled,
      injector: injector.stats(),
      builder: last.stats
    };
  }

  return { apply: apply, applyBoot: applyBoot, reapply: reapply, stats: stats, hashOf: hashOf };
});
