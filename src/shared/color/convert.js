AONC.define('color.convert', function (A) {
  'use strict';

  var clamp = A.lang.clamp;

  function hexToRgb(input) {
    if (!input) return null;
    var s = String(input).trim();

    var fn = /rgba?\(\s*([\d.]+%?)[\s,]+([\d.]+%?)[\s,]+([\d.]+%?)(?:[\s,/]+([\d.]+%?))?\s*\)/i.exec(s);
    if (fn) {
      return {
        r: channel(fn[1]),
        g: channel(fn[2]),
        b: channel(fn[3]),
        a: fn[4] === undefined ? 1 : alpha(fn[4])
      };
    }

    s = s.replace(/^#/, '');
    if (/^[0-9a-f]{3}$/i.test(s)) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    if (/^[0-9a-f]{4}$/i.test(s)) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];

    var m = /^([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(s);
    if (!m) return null;

    var int = parseInt(m[1], 16);
    return {
      r: (int >> 16) & 255,
      g: (int >> 8) & 255,
      b: int & 255,
      a: m[2] ? parseInt(m[2], 16) / 255 : 1
    };
  }

  function channel(v) {
    if (/%$/.test(v)) return clamp(parseFloat(v) * 2.55, 0, 255);
    return clamp(parseFloat(v), 0, 255);
  }

  function alpha(v) {
    if (/%$/.test(v)) return clamp(parseFloat(v) / 100, 0, 1);
    return clamp(parseFloat(v), 0, 1);
  }

  function pad(n) {
    n = Math.round(clamp(n, 0, 255));
    return (n < 16 ? '0' : '') + n.toString(16);
  }

  function rgbToHex(c) {
    if (!c) return '#000000';
    return '#' + pad(c.r) + pad(c.g) + pad(c.b);
  }

  function toHex(input) {
    var c = hexToRgb(input);
    return c ? rgbToHex(c) : null;
  }

  function rgba(input, a) {
    var c = hexToRgb(input);
    if (!c) return String(input);
    var alpha = Math.round(clamp(a == null ? c.a : a, 0, 1) * 1000) / 1000;
    return 'rgba(' + Math.round(c.r) + ',' + Math.round(c.g) + ',' + Math.round(c.b) + ',' + alpha + ')';
  }

  function isValid(input) {
    if (input == null || input === '') return false;
    var s = String(input).trim();
    if (/^(transparent|currentColor|inherit|initial|unset)$/i.test(s)) return true;
    if (/^[a-z]{3,20}$/i.test(s)) return true;
    return !!hexToRgb(s);
  }

  function sanitize(input, fallback) {
    var hex = toHex(input);
    return hex || fallback || '#000000';
  }

  function rgbToHsl(c) {
    var r = c.r / 255, g = c.g / 255, b = c.b / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var l = (max + min) / 2;
    var d = max - min;
    if (d === 0) return { h: 0, s: 0, l: l };
    var s = d / (1 - Math.abs(2 * l - 1));
    var h;
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    return { h: ((h * 60) + 360) % 360, s: clamp(s, 0, 1), l: clamp(l, 0, 1) };
  }

  function hslToRgb(hsl) {
    var h = ((hsl.h % 360) + 360) % 360;
    var s = clamp(hsl.s, 0, 1), l = clamp(hsl.l, 0, 1);
    var c = (1 - Math.abs(2 * l - 1)) * s;
    var x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    var m = l - c / 2;
    var t;
    if (h < 60) t = [c, x, 0];
    else if (h < 120) t = [x, c, 0];
    else if (h < 180) t = [0, c, x];
    else if (h < 240) t = [0, x, c];
    else if (h < 300) t = [x, 0, c];
    else t = [c, 0, x];
    return { r: (t[0] + m) * 255, g: (t[1] + m) * 255, b: (t[2] + m) * 255, a: 1 };
  }

  return {
    hexToRgb: hexToRgb,
    rgbToHex: rgbToHex,
    toHex: toHex,
    rgba: rgba,
    isValid: isValid,
    sanitize: sanitize,
    rgbToHsl: rgbToHsl,
    hslToRgb: hslToRgb
  };
});
