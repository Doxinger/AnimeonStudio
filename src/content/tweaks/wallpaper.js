AONC.define('content.tweaks.wallpaper', function (A) {
  'use strict';

  var VAR = '--aonc-parallax-y';
  var LAYER_ID = 'aonc-wall';
  var conv = A.color.convert;
  var lib = A.config.wallpapers;

  var state = {
    enabled: false,
    strength: 30,
    ticking: false,
    handler: null,
    healTimer: null,
    watchdog: null,
    lastConfig: null
  };

  function paint() {
    state.ticking = false;
    var y = (window.scrollY || window.pageYOffset || 0) * (state.strength / 100);
    document.documentElement.style.setProperty(VAR, (-y).toFixed(1) + 'px');
  }

  function onScroll() {
    if (state.ticking) return;
    state.ticking = true;
    requestAnimationFrame(paint);
  }

  function startScroll() {
    if (state.handler) return;
    state.handler = onScroll;
    window.addEventListener('scroll', state.handler, { passive: true });
    onScroll();
  }

  function stopScroll() {
    if (state.handler) window.removeEventListener('scroll', state.handler);
    state.handler = null;
    try { document.documentElement.style.removeProperty(VAR); } catch (e) {}
  }

  function pseudoWorks() {
    try {
      var cs = getComputedStyle(document.body, '::before');
      return !!(cs && cs.backgroundImage && cs.backgroundImage !== 'none');
    } catch (e) {
      return true;
    }
  }

  function layerCss(w) {
    var image = lib.valueFor(w);
    if (!image) return '';

    var overlay = A.lang.clamp(w.overlay, 0, 95) / 100;
    var vignette = A.lang.clamp(w.vignette, 0, 90) / 100;
    var blur = Math.max(0, A.lang.num(w.blur, 0));
    var saturate = A.lang.clamp(w.saturate, 0, 300) / 100;

    var images = [];
    var sizes = [];
    var positions = [];
    var repeats = [];

    if (overlay > 0) {
      images.push('linear-gradient(' + conv.rgba('#000000', overlay) + ',' + conv.rgba('#000000', overlay) + ')');
      sizes.push('auto'); positions.push('center'); repeats.push('no-repeat');
    }
    if (vignette > 0) {
      images.push('radial-gradient(ellipse at center, transparent 35%, ' + conv.rgba('#000000', vignette) + ' 100%)');
      sizes.push('auto'); positions.push('center'); repeats.push('no-repeat');
    }
    images.push(image);
    sizes.push(w.size || 'cover');
    positions.push(w.position || 'center');
    repeats.push(w.repeat || 'no-repeat');

    var scale = 1;
    if (blur > 0) scale += 0.06;
    if (w.parallax) scale += 0.12;
    if (w.drift) scale += 0.10;
    scale = Math.round(scale * 1000) / 1000;

    var css = [
      'position:fixed',
      'inset:-60px',
      'z-index:-2',
      'pointer-events:none',
      'background-image:' + images.join(','),
      'background-size:' + sizes.join(','),
      'background-position:' + positions.join(','),
      'background-repeat:' + repeats.join(',')
    ];

    var filters = [];
    if (blur > 0) filters.push('blur(' + blur + 'px)');
    if (saturate !== 1) filters.push('saturate(' + saturate.toFixed(2) + ')');
    if (filters.length) css.push('filter:' + filters.join(' '));

    if (w.drift) {
      css.push('transform:scale(' + scale + ')');
      css.push('animation:aonc-wall-drift ' + Math.max(8, A.lang.num(w.driftSpeed, 60)) + 's ease-in-out infinite alternate');
    } else if (w.parallax) {
      css.push('transform:translate3d(0,var(' + VAR + ',0px),0) scale(' + scale + ')');
    } else if (scale !== 1) {
      css.push('transform:scale(' + scale + ')');
    }

    return css.join(';') + ';';
  }

  function ensureLayer(config) {
    var w = config.wallpaper || {};
    var enabled = !!(w.enabled && lib.valueFor(w));
    var existing = document.getElementById(LAYER_ID);

    if (!enabled || pseudoWorks()) {
      if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
      return false;
    }

    var div = existing || document.createElement('div');
    div.id = LAYER_ID;
    div.setAttribute('data-aonc', '1');
    div.style.cssText = layerCss(w);
    if (!existing) document.body.insertBefore(div, document.body.firstChild);
    return true;
  }

  function coversViewport(el) {
    var r = el.getBoundingClientRect();
    var vw = window.innerWidth || document.documentElement.clientWidth;
    var vh = window.innerHeight || document.documentElement.clientHeight;
    return r.width >= vw * 0.9 && r.height >= vh * 0.7;
  }

  var COVER_MARK = 'data-aonc-wp';

  function neutralizeCovers(config) {
    var w = config.wallpaper || {};
    var wanted = !!(w.enabled && w.showThrough && lib.valueFor(w));
    var marked = document.querySelectorAll('[' + COVER_MARK + ']');

    if (!wanted) {
      marked.forEach(function (el) {
        el.removeAttribute(COVER_MARK);
        el.style.removeProperty('background-color');
      });
      return;
    }

    var candidates = document.querySelectorAll(
      'main [class*="bg-background"], main [class*="min-h-"], main [style*="background"],' +
      ' body > div[class*="bg-background"], body > div[class*="min-h-"]'
    );

    candidates.forEach(function (el) {
      if (el.hasAttribute(COVER_MARK)) return;
      if (el.closest('header, footer, [role="dialog"], [data-aonc-ui], #' + LAYER_ID)) return;
      var cs = getComputedStyle(el);
      var bg = cs.backgroundColor;
      if (!bg || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') return;
      if (!coversViewport(el)) return;
      el.setAttribute(COVER_MARK, '1');
      el.style.setProperty('background-color', 'transparent', 'important');
    });
  }

  function reconcile(config) {
    var w = config.wallpaper || {};
    var enabled = !!(w.enabled && lib.valueFor(w));

    if (!enabled) {
      neutralizeCovers(config);
      ensureLayer(config);
      return;
    }

    neutralizeCovers(config);
    ensureLayer(config);
  }

  function startWatchdog(config) {
    state.lastConfig = config;
    if (state.watchdog) return;
    state.watchdog = setInterval(function () {
      if (state.lastConfig) reconcile(state.lastConfig);
    }, 900);
  }

  function stopWatchdog() {
    if (state.watchdog) clearInterval(state.watchdog);
    state.watchdog = null;
  }

  function apply(config) {
    var w = config.wallpaper || {};
    var on = !!(w.enabled && w.parallax);
    state.strength = A.lang.clamp(w.parallaxStrength == null ? 30 : w.parallaxStrength, 0, 200);

    if (on) startScroll();
    else stopScroll();

    if (state.healTimer) clearTimeout(state.healTimer);
    state.healTimer = setTimeout(function () {
      state.healTimer = null;
      reconcile(config);
    }, 80);

    if (w.enabled && lib.valueFor(w)) startWatchdog(config);
    else {
      stopWatchdog();
      reconcile(config);
    }
  }

  function reset() {
    stopScroll();
    stopWatchdog();
    if (state.healTimer) clearTimeout(state.healTimer);
    state.healTimer = null;
    state.lastConfig = null;
    document.querySelectorAll('[data-aonc-wp]').forEach(function (el) {
      el.removeAttribute('data-aonc-wp');
      el.style.removeProperty('background-color');
    });
    var existing = document.getElementById(LAYER_ID);
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    state.enabled = false;
  }

  function layerActive() {
    return !!document.getElementById(LAYER_ID);
  }

  return {
    apply: apply,
    reset: reset,
    reconcile: reconcile,
    ensureLayer: ensureLayer,
    neutralizeCovers: neutralizeCovers,
    layerActive: layerActive,
    pseudoWorks: pseudoWorks,
    layerCss: layerCss,
    VAR: VAR,
    LAYER_ID: LAYER_ID,
    debug: function () {
      return { watchdog: !!state.watchdog, hasLast: !!state.lastConfig, layer: layerActive() };
    }
  };
});
