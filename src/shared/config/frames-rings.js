AONC.define('config.framesRings', function (A) {
  'use strict';

  var RAINBOW = 'conic-gradient(from 0deg, #FF6B6B, #7C4DFF, #00D3A7, #FF6B6B)';
  var RAINBOW_MASK = 'radial-gradient(circle, transparent 60%, #000 62%)';

  function center(size) {
    return 'position:absolute;top:50%;left:50%;width:' + size + 'px;height:' + size + 'px;' +
      'margin:0;border-radius:50%;pointer-events:none;box-sizing:border-box;';
  }

  function transform(ox, oy) {
    return 'translate(calc(-50% + ' + ox + 'px), calc(-50% + ' + oy + 'px))';
  }

  function ringStyle(opts) {
    var o = opts || {};
    var size = Math.max(8, A.lang.num(o.size, 64));
    var color = A.color.convert.sanitize(o.color, '#7C4DFF');
    var width = Math.max(1, Math.round(size * A.lang.clamp(A.lang.num(o.width, 10), 2, 30) / 100));
    var offset = Math.max(0, A.lang.num(o.offset, 2));
    var glow = A.lang.clamp(A.lang.num(o.glow, 0), 0, 40);
    var shadow = '0 0 0 ' + offset + 'px #09090b, 0 0 0 ' + (offset + width) + 'px ' + color;
    if (glow > 0) shadow += ', 0 0 ' + (glow * 2) + 'px ' + A.lang.clamp(glow, 1, 20) + 'px ' + A.color.convert.rgba(color, 0.45);
    return center(size) +
      'transform:' + transform(A.lang.num(o.ox, 0), A.lang.num(o.oy, 0)) + ';' +
      'box-shadow:' + shadow + ';' +
      'opacity:' + A.lang.clamp(A.lang.num(o.opacity, 100), 5, 100) / 100 + ';';
  }

  function rainbowStyle(opts) {
    var o = opts || {};
    var size = Math.max(8, A.lang.num(o.size, 64));
    var pad = Math.max(2, Math.round(size * A.lang.clamp(A.lang.num(o.width, 10), 2, 30) / 200));
    var glow = A.lang.clamp(A.lang.num(o.glow, 0), 0, 40);
    return center(size) +
      'transform:' + transform(A.lang.num(o.ox, 0), A.lang.num(o.oy, 0)) + ';' +
      'background:' + RAINBOW + ';padding:' + pad + 'px;' +
      '-webkit-mask:' + RAINBOW_MASK + ';mask:' + RAINBOW_MASK + ';' +
      (glow > 0 ? 'filter:drop-shadow(0 0 ' + glow + 'px rgba(124,77,255,.55));' : '') +
      'opacity:' + A.lang.clamp(A.lang.num(o.opacity, 100), 5, 100) / 100 + ';';
  }

  function styleFor(item, opts) {
    if (item && item.type === 'rainbow') return rainbowStyle(opts);
    return ringStyle(opts);
  }

  return { RAINBOW: RAINBOW, RAINBOW_MASK: RAINBOW_MASK, ringStyle: ringStyle, rainbowStyle: rainbowStyle, styleFor: styleFor };
});
