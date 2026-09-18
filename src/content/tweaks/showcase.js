AONC.define('content.tweaks.showcase', function (A) {
  'use strict';

  var MARK = 'data-aonc-showcase';
  var NODE_ID = 'aonc-showcase';
  var CSS_ID = 'aonc-showcase-css';
  var HOSTS = [
    'div.min-h-screen main .container',
    'div.min-h-screen main div[class*="container"]',
    'div.min-h-screen .container',
    'div.min-h-screen main',
    'div.min-h-screen'
  ];

  var state = { observer: null, timer: null, started: false, lastKey: '' };

  function cosOf(config) {
    return (config && config.cosmetics) || {};
  }

  function ownNick() {
    try {
      return String(A.content.tweaks.chat.detectOwn() || '').toLowerCase();
    } catch (e) {
      return '';
    }
  }

  function match(config) {
    var p = '';
    try { p = location.pathname; } catch (e) { return false; }
    if (p === '/profile' || p === '/profile/' || p === '/me' || p === '/me/') return true;
    var m = /^\/user\/([^/?#]+)/.exec(p);
    if (!m) return false;
    if (!cosOf(config).showcaseOnlyMine) return true;
    var own = ownNick();
    if (!own) return false;
    try {
      return decodeURIComponent(m[1]).toLowerCase() === own;
    } catch (e) {
      return m[1].toLowerCase() === own;
    }
  }

  function safeUrl(u) {
    u = String(u || '').trim();
    return /^https?:\/\//i.test(u) ? u : '';
  }

  function safeLink(u) {
    u = String(u || '').trim();
    if (!u) return '';
    if (u.charAt(0) === '/' && u.indexOf('//') !== 0) return u;
    return /^https?:\/\//i.test(u) ? u : '';
  }

  function itemsOf(config) {
    return (cosOf(config).showcase || [])
      .map(function (s) { return A.lang.normalize(A.config.defaults.showcaseItem, s); })
      .filter(function (s) { return s.enabled !== false && safeUrl(s.url); });
  }

  function widthOf(config) {
    return A.lang.clamp(A.lang.num(cosOf(config).showcaseWidth, 150), 90, 240);
  }

  function accentOf(config) {
    return A.color.convert.sanitize((config.theme && config.theme.accent) || '#7C4DFF', '#7C4DFF');
  }

  function signature(config) {
    var c = cosOf(config);
    return JSON.stringify([
      c.showcaseOn, c.showcaseTitle, c.showcaseNames, c.showcaseWidth,
      (c.showcase || []).map(function (s) { return [s.id, s.name, s.url, s.link, s.enabled]; }),
      accentOf(config)
    ]);
  }

  function iconSvg(color) {
    var inner = (A.ui.iconsData || {})['layout-grid'] || (A.ui.iconsData || {}).image || '';
    if (!inner) return null;
    var span = document.createElement('span');
    span.setAttribute('aria-hidden', 'true');
    span.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' +
      'style="color:' + color + ';display:block;flex-shrink:0;">' + inner + '</svg>';
    return span.firstChild;
  }

  function ensureCss() {
    var st = document.getElementById(CSS_ID);
    if (!st) {
      st = document.createElement('style');
      st.id = CSS_ID;
      st.setAttribute('data-aonc', '1');
      (document.head || document.documentElement).appendChild(st);
    }
    st.textContent =
      '#' + NODE_ID + ' .aonc-sh-cell{display:block;text-decoration:none;color:inherit;min-width:0;}\n' +
      '#' + NODE_ID + ' .aonc-sh-cell img{transition:transform 180ms ease,box-shadow 180ms ease;}\n' +
      '#' + NODE_ID + ' .aonc-sh-cell:hover img{transform:translateY(-4px) scale(1.025);' +
        'box-shadow:0 10px 26px -6px var(--aonc-sh-accent-soft),0 4px 14px rgba(0,0,0,.45);}\n' +
      '#' + NODE_ID + ' .aonc-sh-cell:hover .aonc-sh-name{color:var(--aonc-sh-accent);}\n' +
      '#' + NODE_ID + ' .aonc-sh-name{transition:color 180ms ease;}\n' +
      '@media (prefers-reduced-motion: reduce){\n' +
      '  #' + NODE_ID + ' .aonc-sh-cell img,#' + NODE_ID + ' .aonc-sh-name{transition:none;}\n' +
      '  #' + NODE_ID + ' .aonc-sh-cell:hover img{transform:none;}\n' +
      '}\n';
  }

  function buildCell(item, config) {
    var c = cosOf(config);
    var link = safeLink(item.link);
    var cell = document.createElement(link ? 'a' : 'div');
    cell.className = 'aonc-sh-cell';
    if (link) {
      cell.setAttribute('href', link);
      if (/^https?:/i.test(link)) {
        cell.setAttribute('target', '_blank');
        cell.setAttribute('rel', 'noopener noreferrer');
      }
    }
    var name = String(item.name || '').trim() || 'Постер';
    var img = document.createElement('img');
    img.setAttribute('src', safeUrl(item.url));
    img.setAttribute('alt', name);
    img.setAttribute('loading', 'lazy');
    img.setAttribute('decoding', 'async');
    img.setAttribute('referrerpolicy', 'no-referrer');
    img.style.cssText = 'width:100%;aspect-ratio:2/3;object-fit:cover;display:block;border-radius:8px;' +
      'border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.04);';
    img.addEventListener('error', function () {
      cell.style.display = 'none';
    });
    cell.appendChild(img);
    if (c.showcaseNames !== false) {
      var cap = document.createElement('span');
      cap.className = 'aonc-sh-name';
      cap.textContent = name;
      cap.setAttribute('title', name);
      cap.style.cssText = 'display:block;font-size:11.5px;line-height:1.3;margin-top:6px;color:#c9cdd9;' +
        'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
      cell.appendChild(cap);
    }
    return cell;
  }

  function buildPanel(config, items) {
    var c = cosOf(config);
    var accent = accentOf(config);
    var sec = document.createElement('section');
    sec.id = NODE_ID;
    sec.setAttribute(MARK, '1');
    sec.setAttribute('data-aonc', '1');
    var title = String(c.showcaseTitle || '').trim() || 'Витрина постеров';
    sec.setAttribute('aria-label', title);
    sec.style.cssText = 'margin:18px 0;padding:14px 16px 16px;border-radius:14px;' +
      'background:linear-gradient(180deg,rgba(17,21,30,.62),rgba(10,13,19,.78));' +
      'border:1px solid rgba(255,255,255,.09);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);' +
      'box-shadow:0 10px 30px -14px rgba(0,0,0,.6);';
    sec.style.setProperty('--aonc-sh-accent', accent);
    sec.style.setProperty('--aonc-sh-accent-soft', A.color.convert.rgba(accent, 0.5));

    var head = document.createElement('div');
    head.style.cssText = 'display:flex;align-items:center;gap:8px;margin:0 0 12px;';
    var svg = iconSvg('#9aa1b2');
    if (svg) head.appendChild(svg);
    var headTitle = document.createElement('b');
    headTitle.textContent = title;
    headTitle.style.cssText = 'font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#c6cad6;';
    head.appendChild(headTitle);
    var count = document.createElement('span');
    count.textContent = String(items.length);
    count.style.cssText = 'margin-left:auto;font-size:11px;color:#8b90a0;background:rgba(255,255,255,.07);' +
      'padding:2px 9px;border-radius:9999px;';
    head.appendChild(count);
    sec.appendChild(head);

    var grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(' + widthOf(config) + 'px,1fr));gap:12px;';
    items.forEach(function (item) {
      grid.appendChild(buildCell(item, config));
    });
    sec.appendChild(grid);
    return sec;
  }

  function hostBox() {
    for (var i = 0; i < HOSTS.length; i++) {
      try {
        var n = document.querySelector(HOSTS[i]);
        if (n) return n;
      } catch (e) {}
    }
    return null;
  }

  function anchorNext(host) {
    var box = null;
    try {
      box = host.querySelector(A.content.tweaks.badges.CONTAINERS.join(', '));
    } catch (e) {}
    if (!box) return null;
    var node = box;
    while (node && node.parentNode !== host) node = node.parentNode;
    return node ? node.nextSibling : null;
  }

  function removePanel() {
    var n = document.getElementById(NODE_ID);
    if (n && n.parentNode) n.parentNode.removeChild(n);
  }

  function removeCss() {
    var n = document.getElementById(CSS_ID);
    if (n && n.parentNode) n.parentNode.removeChild(n);
  }

  function render(config) {
    if (!state.started) return;
    var items = itemsOf(config);
    var host = cosOf(config).showcaseOn && items.length && match(config) ? hostBox() : null;
    var key = signature(config) + (host ? '@found' : '@none');
    if (key === state.lastKey && (!host || document.getElementById(NODE_ID))) return;
    state.lastKey = key;

    removePanel();
    if (!host) return;
    ensureCss();
    host.insertBefore(buildPanel(config, items), anchorNext(host));
  }

  function tickNow() {
    render(A.content.config.current());
  }

  var throttled = A.lang.throttle(function () {
    tickNow();
  }, 300);

  function start() {
    if (state.started) return;
    state.started = true;
    state.observer = A.dom.ready.observe(document.documentElement, function () { throttled(); });
    state.timer = setInterval(tickNow, 1200);
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
    removePanel();
    removeCss();
  }

  function apply(config) {
    var on = !!cosOf(config).showcaseOn && itemsOf(config).length > 0;
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

  function grabFromPage() {
    try {
      var og = document.querySelector('meta[property="og:image"]');
      var ogTitle = document.querySelector('meta[property="og:title"]');
      var url = og ? String(og.getAttribute('content') || '').trim() : '';
      if (!safeUrl(url)) {
        var img = A.dom.ready.first(A.config.selectors.structure.posterImage);
        url = img ? String(img.currentSrc || img.getAttribute('src') || '').trim() : '';
      }
      url = safeUrl(url);
      if (!url) return { grabbed: false, error: 'no-poster' };
      var name = ogTitle ? String(ogTitle.getAttribute('content') || '').trim() : '';
      if (!name) {
        var h1 = document.querySelector('h1');
        if (h1) name = String(h1.textContent || '').trim().slice(0, 80);
      }
      var link = '';
      try { link = location.pathname + location.search; } catch (e) {}
      return { grabbed: true, item: { name: name || 'Постер', url: url, link: link } };
    } catch (e) {
      return { grabbed: false, error: String((e && e.message) || e) };
    }
  }

  return {
    apply: apply,
    reset: reset,
    render: render,
    match: match,
    itemsOf: itemsOf,
    grabFromPage: grabFromPage,
    HOSTS: HOSTS
  };
});
