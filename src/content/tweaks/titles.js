// Настоящие титулы из каталога сайта: пилюли в ряду бейджей профиля
// (/user/…, /profile) один в один как рисует сайт — фон, рамка, свечение,
// градиентный текст, lucide-иконка и анимация из badge_animation. Работает
// визуально: реальные разблокировки сайта не меняются, экипировать можно
// даже не выданный титул. Присутствие охраняется так же, как у бейджей:
// observer + интервал перерисовывают снесённое React-ре-рендером.
AONC.define('content.tweaks.titles', function (A) {
  'use strict';

  var MARK = 'data-aonc-title';
  var STYLE_ID = 'aonc-titles-css';
  var CONTAINERS = [
    'div.min-h-screen div[class*="pt-1.5"][class*="flex-wrap"]',
    'div.min-h-screen div[class*="flex-wrap"][class*="gap-2"]',
    'div.min-h-screen .container div.flex.flex-wrap'
  ];

  var state = { observer: null, timer: null, started: false, lastKey: '' };

  function container() {
    return A.dom.ready.first(CONTAINERS);
  }

  function ensureCss() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.setAttribute('data-aonc', '1');
    style.textContent = A.config.titlesLib.css();
    (document.head || document.documentElement).appendChild(style);
  }

  function activeEntries(config) {
    var c = config.cosmetics || {};
    if (!c.titlesOn) return [];
    return (c.titles || [])
      .map(function (t) { return A.lang.normalize(A.config.defaults.title, t); })
      .filter(function (t) { return t.enabled !== false && !!t.titleId; });
  }

  function signature(config) {
    var c = config.cosmetics || {};
    return JSON.stringify([!!c.titlesOn, (c.titles || []).map(function (t) {
      return [t.titleId, t.anim, t.enabled];
    })]);
  }

  function clear(host) {
    var nodes = (host || document).querySelectorAll('[' + MARK + ']');
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].parentNode) nodes[i].parentNode.removeChild(nodes[i]);
    }
  }

  function anchorFor(box) {
    return box.querySelector('a[href="/cosmetics"], a[href*="cosmetics"], span[class*="text-[11px]"]');
  }

  function render(config) {
    if (!state.started) return;
    var box = container();
    var key = signature(config) + (box ? '@found' : '@none') + '@' + A.config.titlesLib.counts().total;

    if (key === state.lastKey) return;
    state.lastKey = key;

    clear(document);
    if (!box) return;

    var entries = activeEntries(config);
    if (!entries.length) return;
    ensureCss();

    var anchor = anchorFor(box);
    entries.forEach(function (entry) {
      var item = A.config.titlesLib.byId(entry.titleId);
      if (!item) return;
      var pill = A.config.titlesLib.buildPill(A.config.titlesLib.pillSpec(item, entry), document);
      if (!pill) return;
      if (anchor && anchor.parentNode === box) box.insertBefore(pill, anchor);
      else box.appendChild(pill);
    });
  }

  function wantCount(config) {
    return activeEntries(config).length;
  }

  function haveCount() {
    return document.querySelectorAll('[' + MARK + ']').length;
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

  return { apply: apply, reset: reset, render: render, MARK: MARK, STYLE_ID: STYLE_ID, CONTAINERS: CONTAINERS };
});
