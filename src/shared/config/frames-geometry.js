AONC.define('config.framesGeometry', function (A) {
  'use strict';

  var MIN_FACE = 16;

  function normalizeScale(value) {
    var v = Number(value);
    if (!isFinite(v) || v <= 0) return 1;
    if (v < 1) return 1 / Math.max(0.1, v);
    return Math.max(0.5, Math.min(2.5, v));
  }

  function scaleOf(item, override) {
    var user = Number(override);
    if (isFinite(user) && user > 0) return Math.max(0.5, Math.min(3, user));
    var base = item && item.type === 'image' ? normalizeScale(item.scale) : 1;
    return Math.max(1, base);
  }

  function composite(face, scale) {
    return Math.max(1, Math.round(Math.max(0, face) * Math.max(1, Number(scale) || 1)));
  }

  function fromStage(stage, scale, fill) {
    var s = Math.max(1, Number(scale) || 1);
    var f = Math.max(MIN_FACE, Math.floor(Math.min(Infinity, Math.max(0, stage) * (fill == null ? 1 : fill) / s)));
    return { face: f, composite: Math.round(f * s), scale: s };
  }

  function measure(face, scale) {
    var s = Math.max(1, Number(scale) || 1);
    var f = Math.max(0, Math.round(face));
    return { face: f, composite: composite(f, s), scale: s };
  }

  function plan(frame, item, face) {
    var entry = frame || {};
    var scale = scaleOf(item, entry.scale);
    var geo = measure(face, scale);
    var ox = A.lang.num(entry.ox, 0) + (item ? A.lang.num(item.ox, 0) : 0);
    var oy = A.lang.num(entry.oy, 0) + (item ? A.lang.num(item.oy, 0) : 0);
    return {
      type: item ? item.type : (entry.type === 'ring' || entry.type === 'rainbow' ? entry.type : 'image'),
      url: String(entry.url || '').trim() || (item && item.type === 'image' ? item.url : ''),
      color: item && item.color ? item.color : A.color.convert.sanitize(entry.color, '#7C4DFF'),
      scale: geo.scale,
      face: geo.face,
      composite: geo.composite,
      ox: ox,
      oy: oy,
      opacity: A.lang.clamp(A.lang.num(entry.opacity, 100), 5, 100) / 100,
      glow: A.lang.clamp(A.lang.num(entry.glow, 0), 0, 40),
      anim: entry.anim || 'none'
    };
  }

  return {
    normalizeScale: normalizeScale,
    scaleOf: scaleOf,
    composite: composite,
    measure: measure,
    fromStage: fromStage,
    plan: plan,
    MIN_FACE: MIN_FACE
  };
});
