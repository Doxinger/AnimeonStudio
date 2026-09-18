AONC.define('dom.inspect', function (A) {
  'use strict';

  var selector = A.dom.selector;

  function breadcrumb(el, depth) {
    var max = depth == null ? 5 : depth;
    var out = [];
    var node = el;
    var guard = 0;

    while (node && node.nodeType === 1 && guard++ < max) {
      var label = node.tagName.toLowerCase();
      if (node.id) {
        label += '#' + node.id;
      } else {
        var stable = null;
        if (node.classList) {
          for (var i = 0; i < node.classList.length; i++) {
            if (selector.isStableClass(node.classList[i])) { stable = node.classList[i]; break; }
          }
        }
        if (stable) label += '.' + stable;
        else {
          var aria = node.getAttribute('aria-label');
          if (aria) label += '[' + aria.slice(0, 16) + ']';
        }
      }
      out.unshift(label);
      node = node.parentElement;
    }
    return out.join(' › ');
  }

  function textOf(el, limit) {
    var t = (el.textContent || '').replace(/\s+/g, ' ').trim();
    return t.length > (limit || 60) ? t.slice(0, limit || 60) + '…' : t;
  }

  function box(el) {
    var r = el.getBoundingClientRect();
    return {
      x: Math.round(r.x), y: Math.round(r.y),
      w: Math.round(r.width), h: Math.round(r.height)
    };
  }

  function summary(el) {
    if (!el || el.nodeType !== 1) return null;
    var b = box(el);
    var classes = typeof el.className === 'string'
      ? el.className.split(/\s+/).filter(Boolean)
      : [];

    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      stableClasses: classes.filter(selector.isStableClass).slice(0, 4),
      totalClasses: classes.length,
      text: textOf(el),
      width: b.w,
      height: b.h,
      selector: selector.path(el),
      crumb: breadcrumb(el),
      href: el.getAttribute ? (el.getAttribute('href') || '') : '',
      role: el.getAttribute ? (el.getAttribute('role') || '') : '',
      computed: computedSnapshot(el)
    };
  }

  function computedSnapshot(el) {
    if (typeof getComputedStyle !== 'function') return {};
    var cs = getComputedStyle(el);
    return {
      display: cs.display,
      visibility: cs.visibility,
      opacity: cs.opacity,
      color: cs.color,
      background: cs.backgroundColor,
      fontSize: cs.fontSize,
      fontFamily: (cs.fontFamily || '').split(',')[0].replace(/["']/g, ''),
      borderRadius: cs.borderRadius,
      zIndex: cs.zIndex,
      filter: cs.filter === 'none' ? '' : cs.filter
    };
  }

  function nearestLandmark(el) {
    var node = el;
    var guard = 0;
    while (node && node.nodeType === 1 && guard++ < 20) {
      var tag = node.tagName.toLowerCase();
      if (tag === 'header' || tag === 'footer' || tag === 'main' || tag === 'nav' || tag === 'aside') {
        return tag + (node.getAttribute('aria-label') ? '[' + node.getAttribute('aria-label') + ']' : '');
      }
      node = node.parentElement;
    }
    return '';
  }

  function isInsidePlayer(el) {
    return !!(el.closest && el.closest('video, iframe, [class*="player"], [data-player]'));
  }

  return {
    breadcrumb: breadcrumb,
    textOf: textOf,
    box: box,
    summary: summary,
    computedSnapshot: computedSnapshot,
    nearestLandmark: nearestLandmark,
    isInsidePlayer: isInsidePlayer
  };
});
