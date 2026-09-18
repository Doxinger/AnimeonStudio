AONC.define('content.framesCss', function () {
  'use strict';

  var STYLE_ID = 'aonc-frames-css';
  var HIDE_ID = 'aonc-frames-hide-site';

  var HIDE_RULE = '[data-aonc-frame-host] img[src*="cosmetics/frames/"]:not([data-aonc-frame]),' +
    '[data-aonc-frame-host] img[src*="/media/cosmetic/frames/"]:not([data-aonc-frame])' +
    '{display:none !important;}';

  var BASE = [
    '[data-aonc-frame]{position:absolute;top:50%;left:50%;pointer-events:none;',
    'transform:translate(calc(-50% + var(--aonc-fx,0px)),calc(-50% + var(--aonc-fy,0px)));',
    'transform-origin:50% 50%;will-change:transform;}',
    'img[data-aonc-frame]{object-fit:contain;border-radius:0 !important;background:transparent;',
    // Tailwind-preflight сайта ставит img{max-width:100%;height:auto} — без этого
    // рамка сжималась до ширины хоста (меньше аватара) и «садилась» на него.
    'max-width:none !important;max-height:none !important;}',
    '[data-aonc-frame="broken"]{display:none !important;}'
  ].join('');

  var KEYFRAMES = [
    '@keyframes aonc-frame-spin{from{transform:translate(calc(-50% + var(--aonc-fx,0px)),calc(-50% + var(--aonc-fy,0px))) rotate(0deg)}',
    'to{transform:translate(calc(-50% + var(--aonc-fx,0px)),calc(-50% + var(--aonc-fy,0px))) rotate(360deg)}}',
    '@keyframes aonc-frame-breathe{0%,100%{transform:translate(calc(-50% + var(--aonc-fx,0px)),calc(-50% + var(--aonc-fy,0px))) scale(1)}',
    '50%{transform:translate(calc(-50% + var(--aonc-fx,0px)),calc(-50% + var(--aonc-fy,0px))) scale(1.05)}}',
    '@keyframes aonc-frame-float{0%,100%{transform:translate(calc(-50% + var(--aonc-fx,0px)),calc(-50% + var(--aonc-fy,0px) - 2px))}',
    '50%{transform:translate(calc(-50% + var(--aonc-fx,0px)),calc(-50% + var(--aonc-fy,0px) + 2px))}}',
    '@keyframes aonc-frame-hue{from{filter:hue-rotate(0deg)}to{filter:hue-rotate(360deg)}}',
    '@keyframes aonc-frame-shine{0%,100%{filter:brightness(1) saturate(1)}50%{filter:brightness(1.3) saturate(1.2)}}'
  ].join('');

  var ANIMS = {
    rotate: 'aonc-frame-spin var(--aonc-fdur,9s) linear infinite',
    pulse: 'aonc-frame-breathe var(--aonc-fdur,2.8s) ease-in-out infinite',
    float: 'aonc-frame-float var(--aonc-fdur,3.6s) ease-in-out infinite',
    hue: 'aonc-frame-hue var(--aonc-fdur,7s) linear infinite',
    shine: 'aonc-frame-shine var(--aonc-fdur,3.2s) ease-in-out infinite'
  };

  var SPEEDS = { rotate: 9, pulse: 2.8, float: 3.6, hue: 7, shine: 3.2 };

  function css() {
    return BASE + KEYFRAMES;
  }

  function nonce() {
    try {
      var s = document.querySelector('script[nonce], link[nonce], style[nonce]');
      return s ? s.getAttribute('nonce') : null;
    } catch (e) {
      return null;
    }
  }

  function ensure(doc) {
    var d = doc || document;
    var el = d.getElementById(STYLE_ID);
    if (!el) {
      el = d.createElement('style');
      el.id = STYLE_ID;
      el.setAttribute('data-aonc', '1');
      var n = nonce();
      if (n) el.setAttribute('nonce', n);
      el.textContent = css();
      (d.head || d.documentElement).appendChild(el);
    }
    return true;
  }

  function ensureHide(doc, on) {
    var d = doc || document;
    var el = d.getElementById(HIDE_ID);
    if (!on) {
      if (el && el.parentNode) el.parentNode.removeChild(el);
      return false;
    }
    if (!el) {
      el = d.createElement('style');
      el.id = HIDE_ID;
      el.setAttribute('data-aonc', '1');
      var n = nonce();
      if (n) el.setAttribute('nonce', n);
      el.textContent = HIDE_RULE;
      (d.head || d.documentElement).appendChild(el);
    }
    return true;
  }

  function applyAnim(node, anim) {
    var value = ANIMS[anim];
    if (!value) {
      node.style.animation = '';
      node.removeAttribute('data-aonc-anim');
      return '';
    }
    node.style.setProperty('--aonc-fdur', SPEEDS[anim] + 's');
    node.style.animation = value;
    node.setAttribute('data-aonc-anim', anim);
    return anim;
  }

  return { STYLE_ID: STYLE_ID, HIDE_ID: HIDE_ID, HIDE_RULE: HIDE_RULE, ANIMS: ANIMS, SPEEDS: SPEEDS, css: css, ensure: ensure, ensureHide: ensureHide, applyAnim: applyAnim };
});
