AONC.define('content.tweaks.badges', function (A) {
  'use strict';

  var MARK = 'data-aonc-badge';
  var CONTAINERS = [
    'div.min-h-screen div[class*="pt-1.5"][class*="flex-wrap"]',
    'div.min-h-screen div[class*="flex-wrap"][class*="gap-2"]',
    'div.min-h-screen .container div.flex.flex-wrap'
  ];

  var state = { observer: null, timer: null, started: false, lastKey: '' };

  function container() {
    return A.dom.ready.first(CONTAINERS);
  }

  function rgba(hex, a) {
    return A.color.convert.rgba(hex, a);
  }

  function iconSvg(name, color) {
    var inner = (A.ui.iconsData || {})[name] || (A.ui.iconsData || {}).star || '';
    if (!inner) return null;
    var span = document.createElement('span');
    span.setAttribute('aria-hidden', 'true');
    span.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" ' +
      'style="color:' + color + ';position:relative;z-index:1;flex-shrink:0;">' + inner + '</svg>';
    return span.firstChild;
  }

  function buildBadge(badge) {
    var color = A.color.convert.sanitize(badge.color, '#EC4899');
    var pill = document.createElement('span');
    pill.className = 'aon-pause-offscreen';
    pill.setAttribute(MARK, badge.id);
    pill.setAttribute('title', badge.num ? badge.text + ' ' + badge.num : badge.text);
    pill.style.cssText = 'position:relative;display:inline-flex;align-items:center;gap:6px;padding:6px 12px;' +
      'border-radius:9999px;background:' + rgba(color, 0.10) + ';border:1px solid ' + rgba(color, 0.32) + ';' +
      'user-select:none;isolation:isolate;transition:background-color 200ms,border-color 200ms;max-width:100%;min-width:0;';

    if (badge.glow) {
      var glow = document.createElement('span');
      glow.setAttribute('aria-hidden', 'true');
      glow.style.cssText = 'position:absolute;inset:0;border-radius:9999px;pointer-events:none;z-index:-1;' +
        'box-shadow:0 0 16px ' + rgba(color, 0.48) + ',0 0 6px ' + rgba(color, 0.48) + ';';
      pill.appendChild(glow);
    }

    var svg = iconSvg(badge.icon, color);
    if (svg) pill.appendChild(svg);

    var label = document.createElement('span');
    var text = badge.text || 'Бейдж';
    if (badge.num) text += ' ' + badge.num;
    label.textContent = text;
    var labelCss = 'font-weight:600;font-size:12px;line-height:1.1;white-space:nowrap;position:relative;z-index:1;' +
      'display:inline-block;overflow:hidden;text-overflow:ellipsis;min-width:0;';
    if (badge.gradient) {
      var second = A.color.transform.rotate(color, 60);
      labelCss += 'background-image:linear-gradient(90deg,' + color + ' 0%,' + second + ' 100%);' +
        'background-clip:text;-webkit-background-clip:text;-webkit-text-fill-color:transparent;color:transparent;';
    } else {
      labelCss += 'color:' + color + ';';
    }
    label.style.cssText = labelCss;
    pill.appendChild(label);

    return pill;
  }

  function signature(config) {
    var c = config.cosmetics || {};
    return JSON.stringify([c.enabled, c.placement, (c.badges || []).map(function (b) {
      return [b.id, b.text, b.color, b.icon, b.glow, b.gradient, b.num, b.enabled];
    })]);
  }

  function clear(host) {
    var nodes = (host || document).querySelectorAll('[' + MARK + ']');
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].parentNode) nodes[i].parentNode.removeChild(nodes[i]);
    }
  }

  function anchorFor(box, placement) {
    if (placement === 'start') return box.firstElementChild;
    if (placement === 'end') return null;
    return box.querySelector('a[href="/cosmetics"], a[href*="cosmetics"], span[class*="text-[11px]"]');
  }

  function render(config) {
    if (!state.started) return;
    var box = container();
    var c = config.cosmetics || {};
    var key = signature(config) + (box ? '@found' : '@none');

    if (key === state.lastKey) return;
    state.lastKey = key;

    clear(document);
    if (!box || !c.enabled) return;

    var anchor = anchorFor(box, c.placement || 'badges');
    var built = [];

    (c.badges || []).forEach(function (badge) {
      if (!badge || !badge.enabled) return;
      var node = buildBadge(A.lang.normalize(A.config.defaults.badge, badge));
      built.push(node);
    });

    built.forEach(function (node) {
      if (anchor && anchor.parentNode === box) box.insertBefore(node, anchor);
      else box.appendChild(node);
    });
  }

  function wantCount(config) {
    var c = config.cosmetics || {};
    if (!c.enabled) return 0;
    return (c.badges || []).filter(function (b) { return b && b.enabled !== false; }).length;
  }

  function haveCount() {
    return document.querySelectorAll('[data-aonc-badge]').length;
  }

  function tickNow() {
    var config = A.content.config.current();
    if (wantCount(config) > 0 && haveCount() === 0 && container()) {
      state.lastKey = '';
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
      try { state.observer.disconnect(); } catch (e) {}
      state.observer = null;
    }
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    state.started = false;
    state.lastKey = '';
    clear(document);
  }

  function apply(config) {
    var on = !!(config.cosmetics && config.cosmetics.enabled && (config.cosmetics.badges || []).length);
    if (!on) {
      stop();
      return;
    }
    start();
    render(config);
  }

  function reset() {
    stop();
  }

  return { apply: apply, reset: reset, render: render, buildBadge: buildBadge, CONTAINERS: CONTAINERS };
});
