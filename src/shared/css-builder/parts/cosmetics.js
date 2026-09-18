AONC.define('cssBuilder.cosmetics', function (A) {
  'use strict';

  var conv = A.color.convert;

  function build(ctx) {
    var theme = ctx.config.theme;
    var p = ctx.palette;
    if (!p) return '';

    var out = [];

    if (theme.styleScrollbars) {
      out.push(
        '/* Scrollbars */\n' +
        '* {\n  scrollbar-color: ' + conv.rgba(p.foreground, 0.22) + ' transparent;\n}\n' +
        '::-webkit-scrollbar {\n  width: 10px;\n  height: 10px;\n}\n' +
        '::-webkit-scrollbar-track {\n  background: transparent;\n}\n' +
        '::-webkit-scrollbar-thumb {\n' +
        '  background: ' + conv.rgba(p.foreground, 0.2) + ';\n' +
        '  border-radius: 99px;\n  border: 2px solid transparent;\n  background-clip: padding-box;\n}\n' +
        '::-webkit-scrollbar-thumb:hover {\n  background: ' + conv.rgba(p.primary, 0.55) + ';\n  background-clip: padding-box;\n}\n' +
        '::-webkit-scrollbar-corner {\n  background: transparent;\n}'
      );
    }

    if (theme.styleSelection) {
      out.push(
        '/* Selection */\n' +
        '::selection {\n  background: ' + conv.rgba(p.primary, 0.38) + ';\n  color: ' + p.foreground + ';\n}\n' +
        'img::selection, video::selection {\n  background: transparent;\n}'
      );
    }

    out.push(
      '/* Focus ring */\n' +
      ':focus-visible {\n' +
      '  outline: 2px solid ' + conv.rgba(p.primary, 0.75) + ' !important;\n' +
      '  outline-offset: 2px !important;\n' +
      '  border-radius: 6px;\n}'
    );

    out.push(
      '/* Links */\n' +
      'a[href]:hover:not([class*="no-underline"]) {\n  text-underline-offset: 3px;\n}\n' +
      'a[href^="/"] {\n  -webkit-tap-highlight-color: ' + conv.rgba(p.primary, 0.18) + ';\n}'
    );

    if (ctx.config.layout && ctx.config.layout.clipAvatars) {
      out.push(
        '/* Avatar square clipping */\n' +
        'img[class*="rounded-full"] {\n' +
        '  border-radius: 9999px !important;\n' +
        '  object-fit: cover !important;\n' +
        '  background-color: transparent !important;\n}\n' +
        'div[class*="rounded-full"]:has(img),\n' +
        'div[class*="rounded-full"]:has(> div img),\n' +
        '[class*="ring-zinc-950"],\n' +
        '[class*="rounded-full"][class*="ring-"] {\n' +
        '  overflow: hidden !important;\n' +
        '  border-radius: 9999px !important;\n}\n' +
        'div[class*="rounded-full"]:has(img) > *,\n' +
        '[class*="ring-zinc-950"] > * {\n' +
        '  border-radius: 9999px !important;\n}\n' +
        'img[src*="cosmetics/frames"]:not([data-aonc-frame]),\n' +
        'img[aria-hidden="true"][style*="object-fit: contain"]:not([data-aonc-frame]) {\n' +
        '  border-radius: 9999px !important;\n}'
      );
    }

    if (ctx.config.layout && ctx.config.layout.hideAvatarFrames) {
      out.push(
        '/* Hide cosmetic avatar frames */\n' +
        'img[src*="cosmetics/frames"]:not([data-aonc-frame]),\n' +
        'img[src*="/media/cosmetic/frames/"]:not([data-aonc-frame]) {\n  display: none !important;\n}'
      );
    }

    if (theme.mode === 'light') {
      out.push(
        '/* Light-mode corrections for hard-coded dark surfaces */\n' +
        '[class*="bg-zinc-9"], [class*="bg-neutral-9"], [class*="bg-black"] {\n' +
        '  background-color: ' + p.muted + ' !important;\n}\n' +
        '[class*="text-white"] {\n  color: ' + p.foreground + ' !important;\n}\n' +
        '[class*="text-zinc-1"], [class*="text-zinc-2"] {\n  color: ' + p.foreground + ' !important;\n}\n' +
        '[class*="from-black"], [class*="via-black"], [class*="to-black"] {\n' +
        '  background-image: linear-gradient(to bottom, transparent, ' + conv.rgba('#000000', 0.06) + ') !important;\n}'
      );
    }

    return out.join('\n\n');
  }

  return { build: build };
});
