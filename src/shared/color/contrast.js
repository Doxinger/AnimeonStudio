AONC.define('color.contrast', function (A) {
  'use strict';

  var conv = A.color.convert;

  function luminance(input) {
    var c = conv.hexToRgb(input);
    if (!c) return 0.5;
    function f(v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    }
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  }

  function isDark(input) {
    return luminance(input) < 0.4;
  }

  function ratio(a, b) {
    var la = luminance(a), lb = luminance(b);
    var hi = Math.max(la, lb), lo = Math.min(la, lb);
    return (hi + 0.05) / (lo + 0.05);
  }

  function readableOn(bg) {
    return luminance(bg) > 0.5 ? '#0b0b0d' : '#ffffff';
  }

  function ensureContrast(fg, bg, target) {
    var tr = target || 4.5;
    var out = conv.sanitize(fg, '#ffffff');
    var guard = 0;
    while (ratio(out, bg) < tr && guard++ < 24) {
      out = isDark(bg)
        ? A.color.transform.lighten(out, 0.06)
        : A.color.transform.darken(out, 0.06);
    }
    return out;
  }

  function grade(value) {
    if (value >= 7) return 'AAA';
    if (value >= 4.5) return 'AA';
    if (value >= 3) return 'AA Large';
    return 'low';
  }

  return {
    luminance: luminance,
    isDark: isDark,
    ratio: ratio,
    readableOn: readableOn,
    ensureContrast: ensureContrast,
    grade: grade
  };
});
