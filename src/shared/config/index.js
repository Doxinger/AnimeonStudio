AONC.define('config.DEFAULTS', function (A) {
  'use strict';

  var d = A.config.defaults;

  return {
    meta: d.meta,
    theme: d.theme,
    wallpaper: d.wallpaper,
    customThemes: d.customThemes,
    cosmetics: d.cosmetics,
    profileFx: d.profileFx,
    chat: d.chat,
    identity: d.identity,
    clan: d.clan,
    typography: d.typography,
    glass: d.glass,
    layout: d.layout,
    player: d.player,
    privacy: d.privacy,
    performance: d.performance,
    offline: d.offline,
    visibility: d.visibility,
    elements: d.elements,
    custom: d.custom
  };
});

AONC.define('config.normalize', function (A) {
  'use strict';

  function normalizeConfig(raw) {
    var prepared = A.config.migrations.upgradeLegacyFrames(A.lang.clone(raw || {}));
    var merged = A.lang.normalize(A.config.DEFAULTS, prepared);
    var migrated = A.config.migrations.run(merged);
    merged = A.lang.normalize(A.config.DEFAULTS, migrated.config);
    merged.meta.lastEdited = merged.meta.lastEdited || Date.now();
    merged.elements.rules = (merged.elements.rules || []).map(function (rule) {
      return A.lang.normalize(A.config.defaults.elementRule, rule);
    });
    merged.custom.cssSnippets = (merged.custom.cssSnippets || []).map(function (s) {
      return A.lang.normalize(A.config.defaults.snippet, s);
    });
    merged.custom.jsSnippets = (merged.custom.jsSnippets || []).map(function (s) {
      return A.lang.normalize(A.config.defaults.snippet, s);
    });
    merged.wallpaper.rules = (merged.wallpaper.rules || []).map(function (r) {
      return A.lang.normalize(A.config.defaults.wallpaperRule, r);
    });
    merged.cosmetics.badges = (merged.cosmetics.badges || []).map(function (b) {
      return A.lang.normalize(A.config.defaults.badge, b);
    });
    merged.cosmetics.titles = (merged.cosmetics.titles || []).map(function (t) {
      return A.lang.normalize(A.config.defaults.title, t);
    });
    merged.cosmetics.frames = (merged.cosmetics.frames || []).map(function (f) {
      return A.lang.normalize(A.config.defaults.frame, f);
    });
    merged.cosmetics.showcase = (merged.cosmetics.showcase || []).map(function (s) {
      return A.lang.normalize(A.config.defaults.showcaseItem, s);
    });
    merged.cosmetics.loadouts = (merged.cosmetics.loadouts || []).map(function (l) {
      var norm = A.lang.normalize(A.config.defaults.loadout, l);
      norm.cosmetics.badges = (norm.cosmetics.badges || []).map(function (b) {
        return A.lang.normalize(A.config.defaults.badge, b);
      });
      norm.cosmetics.titles = (norm.cosmetics.titles || []).map(function (t) {
        return A.lang.normalize(A.config.defaults.title, t);
      });
      norm.cosmetics.frames = (norm.cosmetics.frames || []).map(function (f) {
        return A.lang.normalize(A.config.defaults.frame, f);
      });
      return norm;
    });
    merged.customThemes = (merged.customThemes || []).map(function (t) {
      return A.config.defaults.customTheme.normalize(t);
    });
    return merged;
  }

  function createConfig(patch) {
    return normalizeConfig(patch || {});
  }

  function isConfig(value) {
    return !!value && typeof value === 'object' && !!value.theme && !!value.meta;
  }

  return { normalizeConfig: normalizeConfig, createConfig: createConfig, isConfig: isConfig };
});
