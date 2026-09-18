AONC.define('config.migrations', function (A) {
  'use strict';

  var CURRENT = 5;

  var LEGACY_KINDS = ['ring', 'neon', 'double', 'dashed', 'rays', 'laurel'];

  var LEGACY_RINGS = [
    { id: 'purple', color: '#7C4DFF' },
    { id: 'teal', color: '#00D3A7' },
    { id: 'gold', color: '#FBBF24' },
    { id: 'red', color: '#EF4444' }
  ];

  function hueOf(hex) {
    var rgb = A.color.convert.hexToRgb(hex);
    if (!rgb) return 0;
    var hsl = A.color.convert.rgbToHsl(rgb);
    return hsl ? hsl.h : 0;
  }

  function closestRing(color) {
    var hex = A.color.convert.sanitize(color, '');
    if (!hex) return 'purple';
    var target = hueOf(hex);
    var best = LEGACY_RINGS[0].id;
    var bestDiff = Infinity;
    LEGACY_RINGS.forEach(function (ring) {
      var diff = Math.abs(hueOf(ring.color) - target);
      if (diff > 180) diff = 360 - diff;
      if (diff < bestDiff) {
        bestDiff = diff;
        best = ring.id;
      }
    });
    return best;
  }

  function upgradeFrame(frame) {
    if (!frame || typeof frame !== 'object') return null;
    var url = String(frame.url || '').trim();
    var legacy = LEGACY_KINDS.indexOf(frame.kind) !== -1;
    if (!url && !legacy && !frame.frameId) return null;

    var next = {
      id: frame.id || A.lang.uid('frame'),
      frameId: '',
      name: frame.name || '',
      url: url,
      type: 'image',
      scale: 0,
      ox: A.lang.num(frame.ox, 0),
      oy: A.lang.num(frame.oy, 0),
      opacity: A.lang.num(frame.opacity, 100),
      anim: frame.anim === 'rotate' || frame.anim === 'pulse' || frame.anim === 'shine' ? frame.anim : 'none',
      glow: 0,
      enabled: frame.enabled !== false
    };

    if (!url && legacy) {
      var ringId = frame.kind === 'ring' || !frame.color ? closestRing(frame.color) : closestRing(frame.color);
      next.frameId = ringId;
      next.type = ringId === 'rainbow' ? 'rainbow' : 'ring';
      next.name = next.name || 'Кольцо';
    } else if (url) {
      next.name = next.name || 'Своя рамка';
    }

    var legacyScale = A.lang.num(frame.scale, 0);
    if (legacyScale >= 50 && legacyScale <= 400) next.scale = Math.round(legacyScale) / 100;
    if (next.scale > 0) next.scale = A.lang.clamp(next.scale, 0.5, 3);

    return next;
  }

  function upgradeLegacyFrames(config) {
    if (!config || !config.cosmetics || !Array.isArray(config.cosmetics.frames)) return config;
    var frames = config.cosmetics.frames;
    var needs = frames.some(function (f) {
      return !!f && (LEGACY_KINDS.indexOf(f.kind) !== -1 || f.color2 != null || (!f.frameId && f.color != null && !String(f.url || '').trim()));
    });
    if (!needs) return config;

    var next = [];
    var seen = {};
    frames.forEach(function (f) {
      var upgraded = upgradeFrame(f);
      if (!upgraded) return;
      var key = upgraded.frameId || upgraded.url || upgraded.id;
      if (seen[key]) return;
      seen[key] = true;
      next.push(upgraded);
    });
    config.cosmetics.frames = next;

    var loadouts = config.cosmetics.loadouts;
    if (Array.isArray(loadouts)) {
      loadouts.forEach(function (l) {
        if (!l || !l.cosmetics || !Array.isArray(l.cosmetics.frames)) return;
        l.cosmetics.frames = l.cosmetics.frames.map(upgradeFrame).filter(Boolean);
      });
    }
    return config;
  }

  var STEPS = [
    {
      to: 2,
      up: function (config) {
        if (!config.meta) config.meta = {};
        if (config.meta.favorites == null) config.meta.favorites = [];
        if (config.meta.onboarded == null) config.meta.onboarded = false;
        if (config.meta.fabEnabled == null) config.meta.fabEnabled = true;
        if (config.meta.seenVersion == null) config.meta.seenVersion = '';
        if (!config.wallpaper) config.wallpaper = {};
        if (config.wallpaper.rules == null) config.wallpaper.rules = [];
        if (!Array.isArray(config.customThemes)) config.customThemes = [];
        return config;
      }
    },
    {
      to: 3,
      up: function (config) {
        if (!config.cosmetics) config.cosmetics = {};
        if (config.cosmetics.framesMinSize == null) config.cosmetics.framesMinSize = 56;
        if (config.cosmetics.framesHideSite == null) config.cosmetics.framesHideSite = true;
        if (!Array.isArray(config.cosmetics.frames)) config.cosmetics.frames = [];
        return config;
      }
    },
    {
      // Клан-бейджи больше не отключаются из студии: плашка убрана,
      // функция всегда включена по умолчанию.
      to: 4,
      up: function (config) {
        if (!config.clan || typeof config.clan !== 'object') config.clan = {};
        config.clan.enabled = true;
        return config;
      }
    },
    {
      // Шестерёнка-хаб (FAB) по умолчанию больше не показывается: видно
      // только если явно включить в студии («Профили и данные» → «Общее»
      // или каталог фич). В старых конфигах true было дефолтом, а не выбором
      // пользователя, поэтому гасим; включение уже после миграции сохраняется
      // (шаг применяется только к схемам старше 5).
      to: 5,
      up: function (config) {
        if (!config.meta) config.meta = {};
        config.meta.fabEnabled = false;
        return config;
      }
    }
  ];

  function needed(config) {
    var v = (config.meta && config.meta.schemaVersion) || 1;
    return STEPS.filter(function (s) { return s.to > v; });
  }

  function run(config) {
    config = upgradeLegacyFrames(config);
    var steps = needed(config);
    if (!steps.length) return { config: config, applied: [] };
    var applied = [];
    steps.forEach(function (step) {
      config = step.up(config) || config;
      applied.push(step.to);
    });
    if (!config.meta) config.meta = {};
    config.meta.schemaVersion = CURRENT;
    return { config: config, applied: applied };
  }

  return {
    CURRENT: CURRENT,
    STEPS: STEPS,
    run: run,
    needed: needed,
    upgradeLegacyFrames: upgradeLegacyFrames,
    upgradeFrame: upgradeFrame,
    closestRing: closestRing
  };
});
