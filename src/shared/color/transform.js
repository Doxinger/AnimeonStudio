AONC.define('color.transform', function (A) {
  'use strict';

  var conv = A.color.convert;
  var clamp = A.lang.clamp;

  function mix(a, b, t) {
    var ca = conv.hexToRgb(a), cb = conv.hexToRgb(b);
    if (!ca || !cb) return conv.toHex(a) || '#000000';
    t = clamp(t, 0, 1);
    return conv.rgbToHex({
      r: ca.r + (cb.r - ca.r) * t,
      g: ca.g + (cb.g - ca.g) * t,
      b: ca.b + (cb.b - ca.b) * t
    });
  }

  function lighten(hex, t) { return mix(hex, '#ffffff', t); }
  function darken(hex, t) { return mix(hex, '#000000', t); }

  function saturate(hex, factor) {
    var c = conv.hexToRgb(hex);
    if (!c) return conv.toHex(hex) || '#000000';
    var hsl = conv.rgbToHsl(c);
    if (hsl.s === 0) return conv.rgbToHex(c);
    hsl.s = clamp(hsl.s * clamp(factor, 0, 4), 0, 1);
    return conv.rgbToHex(conv.hslToRgb(hsl));
  }

  function rotate(hex, deg) {
    var c = conv.hexToRgb(hex);
    if (!c) return conv.toHex(hex) || '#000000';
    var hsl = conv.rgbToHsl(c);
    hsl.h = (hsl.h + deg) % 360;
    return conv.rgbToHex(conv.hslToRgb(hsl));
  }

  function adjust(hex, opts) {
    opts = opts || {};
    var out = conv.sanitize(hex, '#000000');
    if (opts.saturate != null && opts.saturate !== 1) out = saturate(out, opts.saturate);
    if (opts.rotate) out = rotate(out, opts.rotate);
    if (opts.lighten) out = lighten(out, opts.lighten);
    if (opts.darken) out = darken(out, opts.darken);
    return out;
  }

  function withAlpha(hex, a) { return conv.rgba(hex, a); }

  function scale(hex, amount, darkBase) {
    return darkBase ? lighten(hex, amount) : darken(hex, amount);
  }

  return {
    mix: mix,
    lighten: lighten,
    darken: darken,
    saturate: saturate,
    rotate: rotate,
    adjust: adjust,
    withAlpha: withAlpha,
    scale: scale
  };
});
