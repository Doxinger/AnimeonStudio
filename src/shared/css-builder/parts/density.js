AONC.define('cssBuilder.density', function (A) {
  'use strict';

  var units = A.css.units;

  function build(ctx) {
    var layout = ctx.config.layout;
    var out = [];

    var density = A.lang.clamp(layout.density, 50, 200) / 100;
    if (density !== 1) {
      out.push('/* Density */\n:root, html.dark {\n  --spacing: ' + (0.25 * density).toFixed(4) + 'rem;\n}');
    }

    if (layout.containerWidth > 0) {
      var w = Math.round(layout.containerWidth);
      out.push(
        '/* Container width */\n' +
        '.container, .container.mx-auto {\n  max-width: ' + w + 'px !important;\n}\n' +
        '@media (min-width: 1px) {\n  .container {\n    max-width: ' + w + 'px !important;\n  }\n}'
      );
    }

    if (layout.columns > 0) {
      var cols = Math.round(layout.columns);
      out.push(
        '/* Grid columns */\n' +
        'main [class*="grid-cols-"] {\n' +
        '  grid-template-columns: repeat(' + cols + ', minmax(0, 1fr)) !important;\n}\n' +
        '@media (max-width: 640px) {\n  main [class*="grid-cols-"] {\n' +
        '    grid-template-columns: repeat(' + Math.max(2, Math.min(cols, 3)) + ', minmax(0, 1fr)) !important;\n  }\n}'
      );
    }

    if (layout.fullWidthRows) {
      out.push(
        '/* Full-width rows */\n' +
        'main > section > .container,\nmain .container.mx-auto {\n' +
        '  max-width: none !important;\n  padding-left: ' + units.px(12) + ' !important;\n  padding-right: ' + units.px(12) + ' !important;\n}'
      );
    }

    return out.join('\n\n');
  }

  return { build: build };
});
