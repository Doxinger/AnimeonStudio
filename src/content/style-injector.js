AONC.define('content.styleInjector', function (A) {
  'use strict';

  var state = {
    el: null,
    bootEl: null,
    css: '',
    pinned: false,
    unpin: null
  };

  function host() {
    return document.head || document.documentElement;
  }

  function create(id) {
    var el = document.getElementById(id);
    if (el && el.tagName === 'STYLE') return el;
    el = document.createElement('style');
    el.id = id;
    el.type = 'text/css';
    el.setAttribute('data-aonc', '1');
    var nonce = readNonce();
    if (nonce) el.setAttribute('nonce', nonce);
    return el;
  }

  function readNonce() {
    try {
      var s = document.querySelector('script[nonce], link[nonce], style[nonce]');
      return s ? s.getAttribute('nonce') : null;
    } catch (e) {
      return null;
    }
  }

  function ensureLast(el) {
    var parent = host();
    if (!parent) return;
    if (el.parentNode !== parent) parent.appendChild(el);
    else if (parent.lastElementChild !== el) parent.appendChild(el);
  }

  function writeBoot(css) {
    if (!css) return null;
    state.bootEl = create(A.BOOT_STYLE_ID);
    state.bootEl.textContent = css;
    ensureLast(state.bootEl);
    return state.bootEl;
  }

  function write(css) {
    state.css = css || '';
    state.el = create(A.STYLE_ID);
    state.el.textContent = state.css;
    ensureLast(state.el);
    dropBoot();
    pin();
    return state.css.length;
  }

  function dropBoot() {
    if (state.bootEl && state.bootEl.parentNode) state.bootEl.parentNode.removeChild(state.bootEl);
    state.bootEl = null;
  }

  function clear() {
    state.css = '';
    if (state.el) state.el.textContent = '';
    dropBoot();
    unpin();
  }

  function remove() {
    if (state.el && state.el.parentNode) state.el.parentNode.removeChild(state.el);
    state.el = null;
    dropBoot();
    unpin();
  }

  function pin() {
    if (state.pinned || typeof MutationObserver === 'undefined') return;
    state.pinned = true;
    var scheduled = false;
    var mo = new MutationObserver(function () {
      if (scheduled) return;
      scheduled = true;
      setTimeout(function () {
        scheduled = false;
        if (!state.el) return;
        var h = host();
        if (!h) return;
        if (state.el.parentNode !== h) h.appendChild(state.el);
        else if (h.lastElementChild !== state.el && state.css) h.appendChild(state.el);
      }, 0);
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
    state.unpin = function () {
      try { mo.disconnect(); } catch (e) {}
      state.pinned = false;
      state.unpin = null;
    };
  }

  function unpin() {
    if (typeof state.unpin === 'function') state.unpin();
    state.pinned = false;
  }

  function stats() {
    return { attached: !!state.el, bytes: state.css.length, pinned: state.pinned };
  }

  return {
    writeBoot: writeBoot,
    write: write,
    clear: clear,
    remove: remove,
    stats: stats,
    readNonce: readNonce,
    ensureLast: ensureLast
  };
});
