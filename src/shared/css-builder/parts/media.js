AONC.define('cssBuilder.media', function (A) {
  'use strict';

  var units = A.css.units;

  function build(ctx) {
    var perf = ctx.config.performance;
    var out = [];

    if (perf.capDevicePixelRatio > 0) {
      var dpr = A.lang.clamp(perf.capDevicePixelRatio, 0.5, 3);
      out.push(
        '/* Cap effective resolution for raster media */\n' +
        'img {\n  image-rendering: auto;\n}'
      );
      ctx.mediaHints = ctx.mediaHints || {};
      ctx.mediaHints.dpr = dpr;
    }

    if (perf.lazyLoadImages) {
      out.push('img[loading="lazy"] {\n  background-color: rgba(127,127,127,.06);\n}');
    }

    return out.join('\n\n');
  }

  return { build: build, units: units };
});
