AONC.define('css.units', function (A) {
  'use strict';

  var num = A.lang.num;
  var clamp = A.lang.clamp;

  function px(v, fallback) { return num(v, fallback == null ? 0 : fallback) + 'px'; }
  function rem(v, fallback) { return num(v, fallback == null ? 0 : fallback) + 'rem'; }
  function em(v, fallback) { return num(v, fallback == null ? 0 : fallback) + 'em'; }
  function pct(v, fallback) { return num(v, fallback == null ? 100 : fallback) + '%'; }
  function sec(v, fallback) { return num(v, fallback == null ? 0 : fallback) + 's'; }
  function ms(v, fallback) { return Math.round(num(v, fallback == null ? 0 : fallback)) + 'ms'; }
  function deg(v, fallback) { return num(v, fallback == null ? 0 : fallback) + 'deg'; }

  function pxToRem(v, base) { return (num(v, 0) / num(base, 16)) + 'rem'; }

  function int(v, fallback) { return String(Math.round(num(v, fallback == null ? 0 : fallback))); }

  function ratioValue(v, fallback) {
    var n = clamp(num(v, fallback == null ? 1 : fallback), 0, 10);
    return String(Math.round(n * 1000) / 1000);
  }

  function blurPx(v) { return 'blur(' + px(v, 0) + ')'; }

  function size(v, unit) {
    var n = num(v, NaN);
    if (!isFinite(n)) return null;
    return n + (unit || 'px');
  }

  function cssEscapeIdent(s) {
    if (typeof CSS !== 'undefined' && CSS && typeof CSS.escape === 'function') return CSS.escape(s);
    return String(s).replace(/([^a-zA-Z0-9_-])/g, '\\$1');
  }

  function escapeString(s) {
    return String(s == null ? '' : s).replace(/(["\\])/g, '\\$1').replace(/\n/g, '\\n');
  }

  return {
    px: px, rem: rem, em: em, pct: pct, sec: sec, ms: ms, deg: deg,
    pxToRem: pxToRem, int: int, ratioValue: ratioValue, blurPx: blurPx,
    size: size, cssEscapeIdent: cssEscapeIdent, escapeString: escapeString
  };
});
