AONC.define('content.framesTargets', function (A) {
  'use strict';

  var HOST_MARK = 'data-aonc-frame-host';

  var AVATAR = '[data-slot="avatar"], [data-slot="avatar-image"]';

  var CIRCLE = '[class*="rounded-full"][style*="width"]';

  var SITE_FRAME = 'img[src*="cosmetics/frames/"]:not([data-aonc-frame]), img[src*="/media/cosmetic/frames/"]:not([data-aonc-frame])';

  var AVATAR_ROOT = '[data-slot="avatar"]:not([data-slot="avatar-image"])';

  var SKIP = '[data-aonc-ui], #aonc-toasts, script, style, template';

  var PROFILE_ROOTS = ['/user', '/profile', '/me'];

  var MAX_DEPTH = 8;

  // Границы маршрута: '/profile' и '/profile/' — одна и та же страница,
  // а '/me' не должно матчить '/menu'. Раньше матчинг требовал хвостовой
  // '/' и голый '/profile' (страница профиля!) оставался без рамок.
  function onProfilePage() {
    var path = '';
    try { path = (location.pathname || '').replace(/\/+$/, ''); } catch (e) { path = ''; }
    if (!path) return false;
    return PROFILE_ROOTS.some(function (root) {
      return path === root || path.indexOf(root + '/') === 0;
    });
  }

  function num(value) {
    var n = parseFloat(value);
    return isFinite(n) ? n : 0;
  }

  function inlineSize(el) {
    if (!el || !el.style) return 0;
    var w = num(el.style.width);
    var h = num(el.style.height);
    if (w > 0 && h > 0 && /px$/.test(String(el.style.width)) && /px$/.test(String(el.style.height))) {
      return Math.round(Math.min(w, h));
    }
    return 0;
  }

  function px(value) {
    return /px$/.test(String(value || '')) ? num(value) : 0;
  }

  function rectSize(el) {
    if (!el || !el.getBoundingClientRect) return 0;
    var r = el.getBoundingClientRect();
    var size = Math.min(r.width || 0, r.height || 0);
    if (size >= 8) return Math.round(size);
    var cs = getComputedStyle(el);
    var w = px(cs.width);
    var h = px(cs.height);
    if (w >= 8 && h >= 8) return Math.round(Math.min(w, h));
    return 0;
  }

  function circleOf(host) {
    var nodes = A.dom.ready.queryAll(CIRCLE, host);
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].hasAttribute('data-aonc-frame')) continue;
      var size = inlineSize(nodes[i]);
      if (size >= 8) return size;
    }
    return 0;
  }

  function sizeOf(el) {
    return inlineSize(el) || rectSize(el);
  }

  function isClipped(el) {
    var cs = getComputedStyle(el);
    var value = [cs.overflow, cs.overflowX, cs.overflowY]
      .map(function (v) { return v || 'visible'; })
      .join(' ');
    return /hidden|clip|auto|scroll/.test(value);
  }

  function isPositioned(el) {
    var cs = getComputedStyle(el);
    var p = cs.position || '';
    return p === 'relative' || p === 'absolute';
  }

  function hostFor(avatar) {
    if (!avatar || avatar.nodeType !== 1) return null;
    if (avatar.closest && avatar.closest(SKIP)) return null;

    var fallback = null;
    var node = avatar.parentElement;
    var depth = 0;

    while (node && node.nodeType === 1 && node !== document.body && depth < MAX_DEPTH) {
      depth++;
      if (isClipped(node)) {
        node = node.parentElement;
        continue;
      }
      if (!fallback) fallback = node;
      if (sizeOf(node) >= 16 && (isPositioned(node) || inlineSize(node) >= 16)) return node;
      node = node.parentElement;
    }

    return fallback || avatar;
  }

  function isRoot(avatar) {
    if (!avatar || avatar.nodeType !== 1) return false;
    if (avatar.getAttribute('data-slot') === 'avatar-image') return false;
    return !avatar.parentElement || !avatar.parentElement.closest(AVATAR_ROOT);
  }

  function avatars() {
    var roots = A.dom.ready.queryAll(AVATAR_ROOT).filter(isRoot);
    if (roots.length) return roots;
    return A.dom.ready.queryAll(AVATAR).filter(isRoot);
  }

  function collect(placement) {
    if (placement === 'profile' && !onProfilePage()) return [];
    var hosts = [];
    avatars().forEach(function (avatar) {
      var host = hostFor(avatar);
      if (!host || hosts.indexOf(host) !== -1) return;
      if (host.closest && host.closest(SKIP)) return;
      hosts.push(host);
    });
    return hosts;
  }

  function faceOf(host) {
    if (!host) return 0;
    var circle = circleOf(host);
    if (circle >= 8) return circle;
    var avatar = host.querySelector(AVATAR_ROOT);
    var face = rectSize(avatar);
    if (face >= 8) return face;
    var image = host.querySelector('[data-slot="avatar-image"], img[class*="rounded-full"]');
    face = rectSize(image);
    if (face >= 8) return face;
    return sizeOf(host);
  }

  function mark(host) {
    host.setAttribute(HOST_MARK, '1');
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
  }

  function siteFrames(host) {
    return A.dom.ready.queryAll(SITE_FRAME, host);
  }

  function unmarkAll(doc) {
    var hosts = (doc || document).querySelectorAll('[' + HOST_MARK + ']');
    for (var i = 0; i < hosts.length; i++) hosts[i].removeAttribute(HOST_MARK);
  }

  return {
    HOST_MARK: HOST_MARK,
    AVATAR: AVATAR,
    PROFILE_ROOTS: PROFILE_ROOTS,
    onProfilePage: onProfilePage,
    avatars: avatars,
    collect: collect,
    hostFor: hostFor,
    faceOf: faceOf,
    sizeOf: sizeOf,
    circleOf: circleOf,
    mark: mark,
    unmarkAll: unmarkAll,
    siteFrames: siteFrames,
    SITE_FRAME: SITE_FRAME
  };
});
