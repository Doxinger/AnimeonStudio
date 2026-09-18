AONC.define('cssBuilder.layout', function (A) {
  'use strict';

  var units = A.css.units;
  var conv = A.color.convert;

  var CARD = '.group\\/card';
  var FRAME = '[class*="aspect-[2/3]"]';
  var ROW_ITEM = 'div[class*="min-w-[160px]"], div[class*="w-[160px]"], div[class*="min-w-[200px]"], div[class*="w-[200px]"]';

  function build(ctx) {
    var l = ctx.config.layout;
    var p = ctx.palette;
    var out = [];

    out.push('/* Layout */');

    if (l.posterScale !== 100) {
      var s = A.lang.clamp(l.posterScale, 40, 250) / 100;
      var base = 160 * s;
      var baseMd = 200 * s;
      out.push(
        ROW_ITEM + ' {\n' +
        '  min-width: ' + base.toFixed(0) + 'px !important;\n' +
        '  width: ' + base.toFixed(0) + 'px !important;\n}\n' +
        '@media (min-width: 768px) {\n  ' + ROW_ITEM + ' {\n' +
        '    min-width: ' + baseMd.toFixed(0) + 'px !important;\n' +
        '    width: ' + baseMd.toFixed(0) + 'px !important;\n  }\n}'
      );
    }

    if (l.posterRadius >= 0) {
      out.push(
        FRAME + ', ' + CARD + ' img, ' + CARD + ' a > div {\n' +
        '  border-radius: ' + units.px(l.posterRadius) + ' !important;\n}'
      );
    } else if (p) {
      out.push(
        FRAME + ' {\n  border-radius: var(--aonc-radius-card, 12px) !important;\n}'
      );
    }

    if (l.posterGap > 0) {
      out.push(
        'main .overflow-x-auto,\nmain [class*="grid-cols-"] {\n  gap: ' + units.px(l.posterGap) + ' !important;\n}'
      );
    }

    if (l.posterAspect) {
      out.push(
        FRAME + ' {\n  aspect-ratio: ' + l.posterAspect + ' !important;\n}'
      );
    }

    if (l.posterShadow === 'none') {
      out.push(FRAME + ' {\n  box-shadow: none !important;\n}');
    } else if (l.posterShadow === 'soft' && p) {
      out.push(FRAME + ' {\n  box-shadow: 0 2px 10px ' + conv.rgba('#000000', 0.25) + ' !important;\n}');
    } else if (l.posterShadow === 'strong' && p) {
      out.push(FRAME + ' {\n  box-shadow: 0 10px 34px ' + conv.rgba('#000000', 0.5) + ' !important;\n}');
    } else if (l.posterShadow === 'glow' && p) {
      out.push(
        FRAME + ' {\n  box-shadow: 0 0 0 1px ' + conv.rgba(p.primary, 0.3) + ', 0 8px 30px ' + conv.rgba(p.primary, 0.22) + ' !important;\n}'
      );
    }

    if (l.cardBorder && p) {
      out.push(
        FRAME + ' {\n  outline: 1px solid ' + p.border + ' !important;\n  outline-offset: -1px;\n}'
      );
    }

    if (l.cardHover === 'none') {
      out.push(
        CARD + ' * {\n  transform: none !important;\n}\n' +
        CARD + ':hover img {\n  transform: none !important;\n}\n' +
        FRAME + ':hover {\n  box-shadow: none !important;\n}'
      );
    } else if (l.cardHover === 'lift') {
      out.push(
        CARD + ' {\n  transition: transform .22s ease, box-shadow .22s ease !important;\n}\n' +
        CARD + ':hover {\n  transform: translateY(-6px) !important;\n}\n' +
        CARD + ':hover ' + FRAME + ' {\n  box-shadow: 0 18px 40px ' + conv.rgba('#000000', 0.45) + ' !important;\n}'
      );
    } else if (l.cardHover === 'glow' && p) {
      out.push(
        CARD + ':hover ' + FRAME + ' {\n' +
        '  box-shadow: 0 0 0 2px ' + conv.rgba(p.primary, 0.55) + ', 0 12px 34px ' + conv.rgba(p.primary, 0.3) + ' !important;\n}'
      );
    } else if (l.cardHover === 'bright') {
      out.push(
        CARD + ':hover img {\n  filter: brightness(1.14) saturate(1.1) !important;\n}\n' +
        CARD + ':hover ' + FRAME + ' {\n  transform: none !important;\n}'
      );
    }

    if (l.heroScale !== 100) {
      var hs = A.lang.clamp(l.heroScale, 20, 200) / 100;
      out.push(
        '.hero-slider-height {\n  height: calc(var(--aonc-hero-h, 62vh) * ' + hs.toFixed(3) + ') !important;\n}\n' +
        ':root { --aonc-hero-h: 62vh; }'
      );
    }

    if (!l.showRowScrollbars) {
      out.push(
        'main .overflow-x-auto {\n  scrollbar-width: none !important;\n  -ms-overflow-style: none !important;\n}\n' +
        'main .overflow-x-auto::-webkit-scrollbar {\n  display: none !important;\n  height: 0 !important;\n}'
      );
    } else {
      out.push(
        'main .overflow-x-auto {\n  scrollbar-width: thin !important;\n}\n' +
        'main .overflow-x-auto::-webkit-scrollbar {\n  height: 8px !important;\n  display: block !important;\n}\n' +
        'main .overflow-x-auto::-webkit-scrollbar-thumb {\n  background: ' + (p ? conv.rgba(p.foreground, 0.2) : 'rgba(255,255,255,.2)') + ' !important;\n  border-radius: 99px;\n}'
      );
    }

    if (l.grayscalePosters > 0) {
      out.push(
        CARD + ' img {\n  filter: grayscale(' + A.lang.clamp(l.grayscalePosters, 0, 100) + '%) !important;\n}'
      );
    }

    if (l.dimPosters > 0) {
      out.push(
        CARD + ' img {\n  opacity: ' + (1 - A.lang.clamp(l.dimPosters, 0, 90) / 100).toFixed(3) + ' !important;\n}'
      );
    }

    var CELL = 'main .overflow-x-auto > div[class*="min-w-"]';

    if (l.listMode === 'grid') {
      out.push(
        '/* List mode: grid */\n' +
        'main .overflow-x-auto {\n' +
        '  display: grid !important;\n' +
        '  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)) !important;\n' +
        '  gap: 18px !important;\n  overflow: visible !important;\n' +
        '  padding-bottom: 4px !important;\n}\n' +
        CELL + ' {\n  width: auto !important; min-width: 0 !important;\n}'
      );
    } else if (l.listMode === 'rows') {
      out.push(
        '/* List mode: rows */\n' +
        'main .overflow-x-auto {\n' +
        '  display: flex !important; flex-direction: column !important;\n' +
        '  gap: 12px !important; overflow: visible !important; padding-bottom: 4px !important;\n}\n' +
        CELL + ' {\n  width: 100% !important; min-width: 0 !important; max-width: none !important;\n}\n' +
        CARD + ' {\n' +
        '  display: grid !important; grid-template-columns: 96px 1fr !important;\n' +
        '  grid-template-rows: auto auto !important; column-gap: 16px !important; align-items: start !important;\n}\n' +
        CARD + ' > a {\n  grid-column: 1 !important; grid-row: 1 / span 2 !important;\n}\n' +
        CARD + ' > a + * {\n  grid-column: 2 !important; grid-row: 1 !important; margin-top: 2px !important;\n}\n' +
        CARD + ' > a + * + * {\n  grid-column: 2 !important; grid-row: 2 !important;\n}\n' +
        CARD + ' [class*="aspect-[2/3]"] {\n  width: 96px !important;\n}'
      );
    } else if (l.listMode === 'compact') {
      out.push(
        '/* List mode: compact */\n' +
        CELL + ' {\n  width: 118px !important; min-width: 118px !important;\n}\n' +
        'main .overflow-x-auto {\n  gap: 10px !important;\n}\n' +
        CARD + ' > a + * + * {\n  display: none !important;\n}'
      );
    }

    if (l.promoLast) {
      out.push(
        '/* Promo sections to the bottom */\n' +
        'main .container {\n  display: flex !important; flex-direction: column !important;\n}\n' +
        'main section:has(a[href*="battlepass"]),\n' +
        'main section:has(a[href*="offer"]),\n' +
        'main section:has(a[href*="premium"]) {\n  order: 90 !important;\n}'
      );
    }

    var COVER = 'div.min-h-screen > div.relative:first-child';
    if (l.pfHideCover) {
      out.push(
        '/* Profile: hide cover */\n' +
        COVER + ' {\n  display: none !important;\n}\n' +
        'div[class*="-mt-20"], div[class*="-mt-24"], div[class*="-mt-30"] {\n  margin-top: 0 !important;\n}'
      );
    }
    if (l.pfBlurCover > 0) {
      out.push(
        '/* Profile: blur cover */\n' +
        COVER + ' {\n  filter: blur(' + Math.max(0, l.pfBlurCover) + 'px) !important;\n  transform: scale(1.06);\n}\n' +
        // transform тянет обложку в слой выше непозиционированного контента героя
        // (ник, строка бейджей) — поднимаем героя над обложкой.
        'div[class*="-mt-20"], div[class*="-mt-24"], div[class*="-mt-30"] {\n  z-index: 1;\n}'
      );
    }
    if (l.pfHideEdit) {
      out.push(
        '/* Profile: hide edit buttons */\n' +
        'div.min-h-screen div.relative button[aria-haspopup="dialog"] {\n  display: none !important;\n}'
      );
    }
    if (l.pfHideNoise) {
      out.push(
        '/* Profile: hide noise overlay */\n' +
        'div[style*="fractalNoise"], div[class*="opacity-[0.03]"] {\n  display: none !important;\n}'
      );
    }
    if (l.pfCoverAccent && ctx.palette) {
      var p2 = ctx.palette;
      var g1 = A.color.transform.darken(p2.primary, 0.55);
      var g2 = A.color.transform.darken(A.color.transform.rotate(p2.primary, 40), 0.5);
      var g3 = A.color.transform.darken(p2.primary, 0.35);
      out.push(
        '/* Profile: accent cover */\n' +
        'div.min-h-screen div.relative > div[style*="linear-gradient"] {\n' +
        '  background-image: linear-gradient(135deg, ' + g1 + ' 0%, ' + g2 + ' 50%, ' + g3 + ' 100%) !important;\n}'
      );
    }

    return out.join('\n\n');
  }

  return { build: build, CARD: CARD, FRAME: FRAME, ROW_ITEM: ROW_ITEM };
});
