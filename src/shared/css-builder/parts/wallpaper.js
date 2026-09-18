AONC.define('cssBuilder.wallpaper', function (A) {
  'use strict';

  var conv = A.color.convert;
  var lib = A.config.wallpapers;

  function effective(config, url) {
    var w = config.wallpaper;
    if (!w || !w.enabled) return null;

    var rules = (w.rules || []).filter(function (r) {
      return r && r.enabled && A.css.pattern.matchesAny(url, r.urlPatterns);
    });

    if (rules.length) {
      return Object.assign({}, w, rules[0], { enabled: true, __rule: rules[0].id });
    }
    return w;
  }

  function scaleFor(w) {
    var s = 1;
    if (w.blur > 0) s += 0.06;
    if (w.parallax) s += 0.12;
    if (w.drift) s += 0.10;
    return Math.round(s * 1000) / 1000;
  }

  function build(ctx) {
    var w = effective(ctx.config, ctx.url);
    if (!w) return '';

    var image = lib.valueFor(w);
    if (!image) return '';

    var overlay = A.lang.clamp(w.overlay, 0, 95) / 100;
    var vignette = A.lang.clamp(w.vignette, 0, 90) / 100;
    var blur = Math.max(0, A.lang.num(w.blur, 0));
    var saturate = A.lang.clamp(w.saturate, 0, 300) / 100;

    var filters = [];
    if (blur > 0) filters.push('blur(' + blur + 'px)');
    if (saturate !== 1) filters.push('saturate(' + saturate.toFixed(2) + ')');

    var out = [];
    out.push('/* Wallpaper' + (w.__rule ? ' (rule ' + w.__rule + ')' : '') + ' */');

    out.push(
      'body,\nbody[class],\nbody[class*="bg-["],\nhtml body,\nhtml body[class],\nhtml body[class*="bg-["] {\n' +
      '  background-color: transparent !important;\n' +
      '  background-image: none !important;\n}'
    );


    if (w.showThrough) {
      out.push(
        'main, main[style], main > div[style*="background"] {\n' +
        '  background-color: transparent !important;\n' +
        '  background-image: none !important;\n}'
      );
      out.push(
        'main [class*="bg-background"],\n' +
        'div[class*="min-h-screen"][class*="bg-background"],\n' +
        'div[class*="min-h-dvh"][class*="bg-background"],\n' +
        'div[class*="min-h-screen"][class*="bg-[#"] {\n' +
        '  background-color: transparent !important;\n}'
      );
    }

    var decls = [
      'content: "";',
      'position: fixed;',
      'inset: -60px;',
      'z-index: -2;',
      'pointer-events: none;',
      'background-image: ' + image + ' !important;',
      'background-size: ' + w.size + ' !important;',
      'background-position: ' + w.position + ' !important;',
      'background-repeat: ' + w.repeat + ' !important;',
      'background-attachment: ' + w.attachment + ' !important;'
    ];
    if (filters.length) decls.push('filter: ' + filters.join(' ') + ' !important;');

    var scale = scaleFor(w);
    if (w.parallax && !w.drift) {
      decls.push('transform: translate3d(0, var(--aonc-parallax-y, 0px), 0) scale(' + scale + ');');
    } else if (w.drift) {
      decls.push('transform: scale(' + scale + ');');
      decls.push('animation: aonc-wall-drift ' + Math.max(8, A.lang.num(w.driftSpeed, 60)) + 's ease-in-out infinite alternate !important;');
    } else if (scale !== 1) {
      decls.push('transform: scale(' + scale + ');');
    }

    out.push('body::before {\n  ' + decls.join('\n  ') + '\n}');

    if (w.drift) {
      out.push(
        '@keyframes aonc-wall-drift {\n' +
        '  from { transform: translate3d(-1.6%, -1.2%, 0) scale(' + scale + '); }\n' +
        '  to { transform: translate3d(1.6%, 1.2%, 0) scale(' + (scale + 0.03).toFixed(3) + '); }\n' +
        '}'
      );
    }

    var layers = [];
    if (overlay > 0) layers.push('linear-gradient(' + conv.rgba('#000000', overlay) + ',' + conv.rgba('#000000', overlay) + ')');
    if (vignette > 0) layers.push('radial-gradient(ellipse at center, transparent 35%, ' + conv.rgba('#000000', vignette) + ' 100%)');
    if (layers.length) {
      out.push(
        'html::before {\n' +
        '  content: "";\n  position: fixed;\n  inset: 0;\n  z-index: -1;\n  pointer-events: none;\n' +
        '  background-image: ' + layers.join(', ') + ' !important;\n}'
      );
    }

    return out.join('\n\n');
  }

  return { build: build, effective: effective, scaleFor: scaleFor };
});
