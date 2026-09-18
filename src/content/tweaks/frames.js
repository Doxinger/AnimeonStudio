AONC.define('content.tweaks.frames', function (A) {
  'use strict';

  var MARK = 'data-aonc-frame';

  var state = { observer: null, timer: null, started: false, lastKey: '' };

  function activeFrames(config) {
    var c = config.cosmetics || {};
    return (c.frames || [])
      .map(function (f) { return A.lang.normalize(A.config.defaults.frame, f); })
      .filter(function (f) { return f.enabled !== false && (!!f.frameId || !!String(f.url || '').trim()); });
  }

  function srcOf(frame, item) {
    var url = String(frame.url || '').trim();
    if (url) return url;
    if (item && item.type === 'image') return item.url;
    return '';
  }

  function buildImage(frame, item, plan) {
    var img = document.createElement('img');
    img.setAttribute(MARK, frame.frameId || 'custom');
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.decoding = 'async';
    img.loading = 'lazy';
    img.src = srcOf(frame, item);
    img.style.cssText = 'width:' + plan.composite + 'px;height:' + plan.composite + 'px;' +
      'max-width:none;max-height:none;z-index:3;' +
      '--aonc-fx:' + plan.ox + 'px;--aonc-fy:' + plan.oy + 'px;' +
      'opacity:' + plan.opacity.toFixed(2) + ';' +
      (plan.glow > 0 ? 'filter:drop-shadow(0 0 ' + plan.glow + 'px rgba(124,77,255,.5));' : '');
    img.addEventListener('error', function () { img.setAttribute(MARK, 'broken'); });
    A.content.framesCss.applyAnim(img, plan.anim);
    return img;
  }

  function buildRing(frame, item, plan) {
    var node = document.createElement('div');
    node.setAttribute(MARK, frame.frameId || (item && item.type === 'rainbow' ? 'rainbow' : 'ring'));
    node.setAttribute('aria-hidden', 'true');
    node.style.cssText = A.config.framesRings.styleFor(item, {
      size: plan.face,
      color: item ? item.color : frame.color,
      width: 10,
      offset: 2,
      glow: plan.glow,
      opacity: plan.opacity * 100,
      ox: plan.ox,
      oy: plan.oy
    }) + 'z-index:3;';
    A.content.framesCss.applyAnim(node, plan.anim);
    return node;
  }

  function buildFrame(frame, face) {
    var item = frame.frameId ? A.config.framesLib.byId(frame.frameId) : null;
    var plan = A.config.framesGeometry.plan(frame, item, face);
    var type = item ? item.type : (String(frame.url || '').trim() ? 'image' : frame.type);
    if (type !== 'image') return buildRing(frame, item || { type: type, color: '#7C4DFF' }, plan);
    if (!srcOf(frame, item)) return null;
    return buildImage(frame, item, plan);
  }

  function signature(config) {
    var c = config.cosmetics || {};
    var remote = A.config.framesLib.getRemote();
    return JSON.stringify([
      c.framesOn, c.framesPlacement, c.framesMinSize, c.framesHideSite, remote.at, remote.count,
      (c.frames || []).map(function (f) {
        return [f.frameId, f.url, f.type, f.scale, f.ox, f.oy, f.opacity, f.anim, f.glow, f.enabled];
      })
    ]);
  }

  function clear() {
    var nodes = document.querySelectorAll('[' + MARK + ']');
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].parentNode) nodes[i].parentNode.removeChild(nodes[i]);
    }
    A.content.framesTargets.unmarkAll(document);
  }

  function setSiteHide(on) {
    A.content.framesCss.ensureHide(document, on);
  }

  function render(config) {
    if (!state.started) return;
    var c = config.cosmetics || {};
    var key = signature(config);
    if (key === state.lastKey) return;
    state.lastKey = key;

    clear();
    var frames = activeFrames(config);
    var hideSite = !!c.framesHideSite && !!c.framesOn && frames.length > 0;
    setSiteHide(hideSite);
    if (!c.framesOn || !frames.length) return;

    A.content.framesCss.ensure(document);

    var minSize = A.lang.clamp(A.lang.num(c.framesMinSize, 56), 0, 400);
    A.content.framesTargets.collect(c.framesPlacement || 'profile').forEach(function (host) {
      var face = A.content.framesTargets.faceOf(host);
      if (minSize && face && face < minSize) return;
      A.content.framesTargets.mark(host);
      frames.forEach(function (frame) {
        var node = buildFrame(frame, face || 96);
        if (node) host.appendChild(node);
      });
    });
  }

  function wantCount(config) {
    if (!((config.cosmetics || {}).framesOn)) return 0;
    return activeFrames(config).length;
  }

  function haveCount() {
    return document.querySelectorAll('[' + MARK + ']:not([' + MARK + '="broken"])').length;
  }

  function tickNow() {
    var config = A.content.config.current();
    var placement = (config.cosmetics || {}).framesPlacement || 'profile';
    if (wantCount(config) > 0 && A.content.framesTargets.collect(placement).length) {
      A.content.framesCss.ensure(document);
      A.content.framesCss.ensureHide(document, !!(config.cosmetics || {}).framesHideSite);
      if (haveCount() === 0) state.lastKey = '';
    }
    render(config);
  }

  var throttled = A.lang.throttle(function () {
    tickNow();
  }, 300);

  function start() {
    if (state.started) return;
    state.started = true;
    state.observer = A.dom.ready.observe(document.documentElement, function () { throttled(); });
    state.timer = setInterval(throttled, 1200);
    throttled();
  }

  function stop() {
    if (state.observer) {
      try {
        if (typeof state.observer === 'function') state.observer();
        else state.observer.disconnect();
      } catch (e) {}
      state.observer = null;
    }
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    state.started = false;
    state.lastKey = '';
    clear();
    setSiteHide(false);
  }

  function apply(config) {
    if (!wantCount(config)) {
      stop();
      return;
    }
    start();
    render(config);
  }

  function reset() {
    stop();
  }

  return {
    apply: apply,
    reset: reset,
    render: render,
    buildFrame: buildFrame,
    activeFrames: activeFrames,
    MARK: MARK
  };
});
