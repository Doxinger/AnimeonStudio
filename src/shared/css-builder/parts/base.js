AONC.define('cssBuilder.base', function (A) {
  'use strict';

  var conv = A.color.convert;

  function build(ctx) {
    var theme = ctx.config.theme;
    var p = ctx.palette;
    var w = new A.css.writer.Writer();
    var out = [];

    if (!theme.forceBodyBackground || !p) return '';

    w.section('Base surfaces');

    var bg = p.background;
    var bgRule = [
      '  background-color: ' + bg + ' !important;',
      '  background-image: none !important;'
    ].join('\n');

    out.push('html, body {\n' + bgRule + '\n}');

    out.push('body[class*="bg-["] {\n  background-color: ' + bg + ' !important;\n}');

    out.push('main, main[style] {\n  background: ' + bg + ' !important;\n}');

    out.push('main > div[style*="background"] {\n  background-color: ' + bg + ' !important;\n}');

    if (theme.mode === 'light') {
      out.push('body {\n  color: ' + p.foreground + ' !important;\n}');
      out.push('[class*="text-white"] {\n  color: ' + p.foreground + ' !important;\n}');
      out.push('[class*="bg-black\\/60"], [class*="bg-black\\/40"], [class*="bg-black\\/80"] {\n' +
        '  background-color: ' + conv.rgba('#000000', 0.06) + ' !important;\n}');
      out.push('[class*="from-zinc-950"], [class*="via-zinc-900"], [class*="to-zinc-950"] {\n' +
        '  background-image: linear-gradient(135deg, ' + p.card + ', ' + p.muted + ') !important;\n}');
      out.push('[class*="border-white\\/5"], [class*="border-white\\/10"] {\n' +
        '  border-color: ' + conv.rgba('#000000', 0.08) + ' !important;\n}');
      out.push('[class*="bg-white\\/"], [class*="hover\\:bg-white\\/"] {\n' +
        '  background-color: ' + conv.rgba('#000000', 0.045) + ' !important;\n}');
      out.push('[class*="text-zinc-3"], [class*="text-zinc-4"] {\n  color: ' + p.mutedForeground + ' !important;\n}');
    }

    out.push('#__next, [data-radix-portal] {\n  color: inherit;\n}');

    return out.join('\n\n');
  }

  return { build: build };
});
