AONC.define('content.tweaks.visibility', function (A) {
  'use strict';

  var MARK = 'data-aonc-hide';
  var VIS = A.config.selectors.visibility;

  var state = {
    enabled: {},
    observer: null,
    timer: null,
    started: false
  };

  function queryAll(sel) {
    try {
      return Array.prototype.slice.call(document.querySelectorAll(sel));
    } catch (e) {
      return [];
    }
  }

  function isProtected(el) {
    return !!(el && el.closest && el.closest('header, footer, nav, [data-aonc-ui]'));
  }

  function hide(el, key) {
    if (!el || el.nodeType !== 1) return false;
    if (isProtected(el)) return false;
    if (el.getAttribute(MARK) === key) return false;
    el.setAttribute(MARK, key);
    el.style.setProperty('display', 'none', 'important');
    el.style.setProperty('visibility', 'hidden', 'important');
    el.style.setProperty('height', '0', 'important');
    el.style.setProperty('min-height', '0', 'important');
    el.style.setProperty('margin-top', '0', 'important');
    el.style.setProperty('overflow', 'hidden', 'important');
    return true;
  }

  function unhideKey(key) {
    var nodes = queryAll('[' + MARK + '="' + key + '"]');
    nodes.forEach(function (el) {
      el.removeAttribute(MARK);
      ['display', 'visibility', 'height', 'min-height', 'margin-top', 'overflow'].forEach(function (p) {
        el.style.removeProperty(p);
      });
    });
    return nodes.length;
  }

  function unhideAll() {
    Object.keys(VIS).forEach(unhideKey);
  }

  function panelAncestor(el) {
    var node = el;
    var guard = 0;
    while (node && node.nodeType === 1 && guard++ < 7) {
      if (node.tagName === 'SECTION') return node;
      var parent = node.parentElement;
      if (!parent) return node;
      if (parent.matches('.container, .container.mx-auto, main, body')) return node;
      node = parent;
    }
    return node;
  }

  function textTargets(def) {
    var needles = (def.text || []).map(function (t) { return t.toLowerCase(); });
    if (!needles.length) return [];

    var candidates = queryAll('main h1, main h2, main h3, main h4, section h1, section h2, section h3, section h4, main button, section button, main p, section p');
    var hits = [];

    candidates.forEach(function (el) {
      if (isProtected(el)) return;
      var text = (el.textContent || '').trim().toLowerCase();
      if (!text || text.length > 120) return;
      for (var i = 0; i < needles.length; i++) {
        if (text.indexOf(needles[i]) !== -1) { hits.push(el); return; }
      }
    });

    return hits;
  }

  function applyKey(key) {
    var def = VIS[key];
    if (!def) return 0;
    var count = 0;

    (def.selectors || []).forEach(function (sel) {
      queryAll(sel).forEach(function (el) {
        if (hide(el, key)) count++;
      });
    });

    if (def.text) {
      textTargets(def).forEach(function (el) {
        var panel = panelAncestor(el);
        if (hide(panel, key)) count++;
      });
    }

    return count;
  }

  function run() {
    if (!document.body) return;

    Object.keys(VIS).forEach(function (key) {
      if (state.enabled[key]) applyKey(key);
      else unhideKey(key);
    });
  }

  var throttledRun = A.lang.throttle(run, 350);

  function start() {
    if (state.started) return;
    state.started = true;

    state.observer = A.dom.ready.observe(document.documentElement, function () { throttledRun(); });
    state.timer = setInterval(run, 1500);

    A.dom.ready.ready().then(run);
  }

  function stop() {
    if (state.observer) {
      try { state.observer.disconnect(); } catch (e) {}
      state.observer = null;
    }
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    state.started = false;
    unhideAll();
  }

  function apply(config) {
    var next = {};
    var any = false;
    Object.keys(VIS).forEach(function (key) {
      next[key] = !!(config.visibility && config.visibility[key]);
      if (next[key]) any = true;
    });
    state.enabled = next;

    if (!any) {
      stop();
      return;
    }

    start();
    run();
  }

  function hiddenCount() {
    return queryAll('[' + MARK + ']').length;
  }

  return {
    apply: apply,
    stop: stop,
    run: run,
    hiddenCount: hiddenCount,
    MARK: MARK
  };
});
