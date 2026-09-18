AONC.define('cssBuilder.polish', function (A) {
  'use strict';

  var conv = A.color.convert;
  var tr = A.color.transform;

  function harmonyAngles(harmony) {
    switch (harmony) {
      case 'mono': return [0, 0];
      case 'triad': return [120, 240];
      case 'complement': return [180, 180];
      default: return [32, -28];
    }
  }

  function build(ctx) {
    var t = ctx.config.theme;
    var p = ctx.palette;
    var out = [];

    out.push('/* Polish */');

    if (t.themeTransitions) {
      out.push(
        'html.aonc-theme-switch,\nhtml.aonc-theme-switch *,\nhtml.aonc-theme-switch *::before,\nhtml.aonc-theme-switch *::after {\n' +
        '  transition: background-color .38s ease, color .38s ease, border-color .38s ease,\n' +
        '    box-shadow .38s ease, fill .38s ease, stroke .38s ease, opacity .38s ease !important;\n}'
      );
    }

    if (p && t.ambient > 0) {
      var k = A.lang.clamp(t.ambient, 0, 100) / 100;
      var angles = harmonyAngles(t.harmony);
      var c1 = conv.rgba(p.primary, 0.05 + 0.16 * k);
      var c2 = conv.rgba(tr.rotate(p.primary, angles[0]), 0.04 + 0.12 * k);
      var c3 = conv.rgba(tr.rotate(p.primary, angles[1]), 0.03 + 0.10 * k);

      out.push(
        'body,\nbody[class],\nbody[class*="bg-["] {\n  background-color: transparent !important;\n}'
      );
      out.push(
        'html::after {\n' +
        '  content: "";\n  position: fixed;\n  inset: 0;\n  z-index: -1;\n  pointer-events: none;\n' +
        '  background-image:\n' +
        '    radial-gradient(1200px 700px at 12% -8%, ' + c1 + ' 0%, transparent 60%),\n' +
        '    radial-gradient(1000px 640px at 88% 10%, ' + c2 + ' 0%, transparent 58%),\n' +
        '    radial-gradient(1400px 900px at 50% 108%, ' + c3 + ' 0%, transparent 62%);\n}'
      );
    }

    if (p && t.softShadows) {
      var dark = p.dark;
      var mid = dark
        ? '0 1px 2px ' + conv.rgba('#000000', 0.5) + ', 0 10px 26px -14px ' + conv.rgba('#000000', 0.66)
        : '0 1px 2px ' + conv.rgba('#000000', 0.07) + ', 0 12px 30px -16px ' + conv.rgba('#000000', 0.2);
      var big = dark
        ? '0 2px 6px ' + conv.rgba('#000000', 0.55) + ', 0 22px 48px -18px ' + conv.rgba('#000000', 0.72) + ', 0 0 0 1px ' + conv.rgba(p.primary, 0.05)
        : '0 2px 6px ' + conv.rgba('#000000', 0.08) + ', 0 26px 54px -20px ' + conv.rgba('#000000', 0.26) + ', 0 0 0 1px ' + conv.rgba(p.primary, 0.06);

      out.push(
        '[class*="shadow-md"],\n[class*="shadow-lg"] {\n  box-shadow: ' + mid + ' !important;\n}'
      );
      out.push(
        '[class*="shadow-xl"],\n[class*="shadow-2xl"] {\n  box-shadow: ' + big + ' !important;\n}'
      );
      out.push(
        '[class*="shadow-"] {\n  transition: box-shadow .26s ease, background-color .2s ease, color .2s ease, border-color .2s ease !important;\n}'
      );
    }

    var motion = t.motion || 'default';
    if (motion === 'calm') {
      out.push(
        '*,\n*::before,\n*::after {\n  transition-duration: .12s !important;\n  animation-duration: .12s !important;\n}'
      );
    } else if (motion === 'lively') {
      out.push(
        'button,\na,\n[role="button"] {\n' +
        '  transition: transform .16s ease, box-shadow .2s ease, background-color .2s ease, color .2s ease, border-color .2s ease !important;\n}'
      );
      out.push(
        'button:hover,\na:hover,\n[role="button"]:hover {\n  transform: translateY(-1px);\n}'
      );
      out.push(
        'button:active,\na:active,\n[role="button"]:active {\n  transform: translateY(0) scale(.985);\n}'
      );
    }

    if (p && t.recolorGradients) {
      var second = tr.rotate(p.primary, harmonyAngles(t.harmony)[1]);
      var grad = 'linear-gradient(92deg, ' + p.foreground + ' 0%, ' + conv.rgba(second, 0.95) + ' 46%, ' + p.primary + ' 100%)';
      out.push(
        'header a[href="/"] span,\n[class*="bg-clip-text"][class*="bg-gradient"] {\n' +
        '  background-image: ' + grad + ' !important;\n' +
        '  -webkit-background-clip: text;\n  background-clip: text;\n  color: transparent !important;\n}'
      );
    }

    if (p && t.borderAlpha > 0) {
      var alpha = A.lang.clamp(t.borderAlpha, 1, 40) / 100;
      var border = p.dark ? conv.rgba('#ffffff', alpha) : conv.rgba('#000000', alpha);
      out.push(
        ':root, html.dark {\n  --border: ' + border + ' !important;\n  --input: ' + border + ' !important;\n  --aonc-border: ' + border + ' !important;\n}'
      );
    }

    if (p) {
      out.push(
        ':focus-visible {\n' +
        '  outline: 2px solid ' + conv.rgba(p.primary, 0.7) + ' !important;\n' +
        '  box-shadow: 0 0 0 4px ' + conv.rgba(p.primary, 0.16) + ' !important;\n' +
        '  transition: box-shadow .2s ease, outline-color .2s ease !important;\n}'
      );
      out.push(
        '::selection {\n  transition: background-color .25s ease, color .25s ease !important;\n}'
      );
    }

    return out.join('\n\n');
  }

  return { build: build, harmonyAngles: harmonyAngles };
});
