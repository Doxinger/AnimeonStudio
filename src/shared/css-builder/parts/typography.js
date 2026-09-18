AONC.define('cssBuilder.typography', function (A) {
  'use strict';

  var fonts = A.config.fonts;
  var units = A.css.units;

  var TEXT_STEPS = [
    ['xs', 0.75], ['sm', 0.875], ['base', 1], ['lg', 1.125],
    ['xl', 1.25], ['2xl', 1.5], ['3xl', 1.875], ['4xl', 2.25],
    ['5xl', 3], ['6xl', 3.75], ['7xl', 4.5], ['8xl', 6], ['9xl', 8]
  ];

  var LEADING = {
    xs: 1, sm: 1.25, base: 1.5, lg: 1.75, xl: 1.75, '2xl': 2,
    '3xl': 2.25, '4xl': 2.5, '5xl': 1, '6xl': 1, '7xl': 1, '8xl': 1, '9xl': 1
  };

  function build(ctx) {
    var t = ctx.config.typography;
    var w = new A.css.writer.Writer();
    var out = [];

    w.section('Typography');

    if (t.loadGoogleFont && t.googleFont) {
      out.push('@import url(' + JSON.stringify(fonts.importUrl(t.googleFont)) + ');');
    }

    var rootVars = [];
    if (t.fontFamily) rootVars.push('  --font-sans: ' + t.fontFamily + ' !important;');
    if (t.fontAccent) rootVars.push('  --font-accent: ' + t.fontAccent + ' !important;');
    if (t.fontFamily) rootVars.push('  --font-mono: ' + t.fontFamily + ' !important;');

    if (t.loadGoogleFont && t.googleFont) {
      var stack = fonts.stackFor(t.googleFont);
      rootVars.push('  --font-sans: ' + stack + ' !important;');
      rootVars.push('  --default-font-family: ' + stack + ' !important;');
      if (!t.fontAccent) rootVars.push('  --font-accent: ' + stack + ' !important;');
    }

    var textScale = A.lang.clamp(t.textScale, 50, 250) / 100;
    if (textScale !== 1) {
      TEXT_STEPS.forEach(function (step) {
        var name = step[0];
        var size = step[1] * textScale;
        var lh = LEADING[name] || 1.5;
        if (lh > 1.4) lh = lh * (1 + (textScale - 1) * 0.35);
        rootVars.push('  --text-' + name + ': ' + size.toFixed(4) + 'rem;');
        rootVars.push('  --text-' + name + '--line-height: ' + lh.toFixed(3) + ';');
      });
    }

    var uiScale = A.lang.clamp(t.uiScale, 50, 200) / 100;
    if (uiScale !== 1) {
      out.push('html {\n  font-size: ' + (16 * uiScale).toFixed(2) + 'px !important;\n}');
    }

    if (rootVars.length) out.push(':root, html.dark {\n' + rootVars.join('\n') + '\n}');

    var bodyRule = [];
    if (t.fontFamily || (t.loadGoogleFont && t.googleFont)) {
      var fam = t.loadGoogleFont && t.googleFont && !t.fontFamily
        ? fonts.stackFor(t.googleFont)
        : t.fontFamily;
      bodyRule.push('  font-family: ' + fam + ' !important;');
    }
    if (t.letterSpacing) bodyRule.push('  letter-spacing: ' + units.px(t.letterSpacing) + ' !important;');
    if (t.lineHeight > 0) bodyRule.push('  line-height: ' + units.ratioValue(t.lineHeight, 1.5) + ' !important;');
    if (t.fontSmoothing) {
      bodyRule.push('  -webkit-font-smoothing: antialiased !important;');
      bodyRule.push('  -moz-osx-font-smoothing: grayscale !important;');
      bodyRule.push('  text-rendering: optimizeLegibility !important;');
    }
    if (bodyRule.length) out.push('html, body {\n' + bodyRule.join('\n') + '\n}');

    var headingRule = [];
    var headingScale = A.lang.clamp(t.headingScale, 50, 250) / 100;
    if (headingScale !== 1) headingRule.push('  font-size: ' + (headingScale * 100).toFixed(1) + '% !important;');
    if (t.headingWeight > 0) headingRule.push('  font-weight: ' + Math.round(t.headingWeight) + ' !important;');
    if (t.headingTransform !== 'none') headingRule.push('  text-transform: ' + t.headingTransform + ' !important;');
    if (t.headingLetterSpacing) headingRule.push('  letter-spacing: ' + units.px(t.headingLetterSpacing) + ' !important;');
    if (t.fontAccent) headingRule.push('  font-family: ' + t.fontAccent + ' !important;');
    if (headingRule.length) out.push('h1, h2, h3, h4, h5, h6 {\n' + headingRule.join('\n') + '\n}');

    if (t.uppercaseTitles) {
      out.push('h1, h2, h3, [class*="font-accent"] {\n  text-transform: uppercase !important;\n  letter-spacing: 0.04em !important;\n}');
    }

    return out.join('\n\n');
  }

  return { build: build, TEXT_STEPS: TEXT_STEPS };
});
