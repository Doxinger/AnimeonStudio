AONC.define('cssBuilder.glass', function (A) {
  'use strict';

  var conv = A.color.convert;
  var units = A.css.units;

  function build(ctx) {
    var g = ctx.config.glass;
    var p = ctx.palette;
    var out = [];

    if (!g.enabled && !g.killBackdropFilter) return '';

    out.push('/* Glass / header */');

    var tint = g.tint && conv.isValid(g.tint) ? g.tint : (p ? p.background : '#0a0a0a');
    var alpha = A.lang.clamp(g.alpha, 0, 100);
    var blur = Math.max(0, A.lang.num(g.blur, 8));
    var fallbackAlpha = A.lang.clamp(g.fallbackAlpha, 0, 100);

    var vars = [
      '  --aon-glass-tint: ' + tint + ' !important;',
      '  --aon-glass-alpha: ' + alpha + '% !important;',
      '  --aon-glass-alpha-flat: ' + fallbackAlpha + '% !important;',
      '  --aon-glass-filter: blur(' + blur + 'px) !important;',
      '  --aon-glass-fallback: ' + tint + ' !important;',
      '  --aon-glass-fallback-flat: ' + conv.rgba(tint, fallbackAlpha / 100) + ' !important;'
    ].join('\n');

    out.push('.aon-glass, .aon-glass-header {\n' + vars + '\n}');

    var navTint = p ? p.background : '#000000';
    out.push(
      '.aon-glass-nav {\n' +
      '  --aon-glass-tint: ' + navTint + ' !important;\n' +
      '  --aon-glass-alpha: ' + A.lang.clamp(g.navAlpha, 0, 100) + '% !important;\n' +
      '  --aon-glass-filter: blur(' + Math.max(0, g.navBlur) + 'px) !important;\n' +
      '  --aon-glass-fallback: ' + conv.rgba(navTint, 0.9) + ' !important;\n}'
    );

    if (g.headerOpaque && p) {
      out.push(
        'header.aon-glass-header {\n' +
        '  background-color: ' + p.background + ' !important;\n' +
        '  backdrop-filter: none !important;\n' +
        '  -webkit-backdrop-filter: none !important;\n}'
      );
    }

    if (g.headerHeight > 0) {
      var h = Math.round(g.headerHeight);
      out.push(
        'header .container,\nheader > div > .container {\n  height: ' + h + 'px !important;\n}\n' +
        ':root, html.dark {\n  --aonc-header-h: ' + h + 'px;\n}'
      );
      if (!g.headerCompact) {
        out.push('main > section:first-of-type[class*="-mt-"] {\n  margin-top: 0 !important;\n}');
      }
    }

    if (!g.headerSticky) {
      out.push('header {\n  position: relative !important;\n  top: auto !important;\n}');
    }

    if (!g.headerBorder) {
      out.push('header {\n  border-bottom-color: transparent !important;\n}');
    }

    if (g.headerCompact) {
      out.push(
        'header .container {\n  height: ' + Math.max(36, Math.round(g.headerHeight || 64) - 12) + 'px !important;\n}\n' +
        'header a[href="/"] img {\n  width: 24px !important;\n  height: 24px !important;\n}\n' +
        'header a[href="/"] span {\n  font-size: 1.05rem !important;\n}'
      );
    }

    if (g.killBackdropFilter) {
      out.push(
        '*, *::before, *::after {\n' +
        '  backdrop-filter: none !important;\n' +
        '  -webkit-backdrop-filter: none !important;\n}'
      );
    }

    return out.join('\n\n');
  }

  return { build: build, units: units };
});
