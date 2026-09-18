AONC.define('cssBuilder.player', function (A) {
  'use strict';

  var units = A.css.units;

  var HOST = A.config.selectors.player.container.join(', ');
  var IFRAME = A.config.selectors.player.iframe.join(', ');

  function build(ctx) {
    var pl = ctx.config.player;
    var p = ctx.palette;
    var out = [];

    if (pl.playerRadius >= 0) {
      out.push(
        '/* Player radius */\n' +
        HOST + ', ' + IFRAME + ', video {\n' +
        '  border-radius: ' + units.px(pl.playerRadius) + ' !important;\n' +
        '  overflow: hidden !important;\n}'
      );
    }

    if (pl.playerMaxWidth > 0) {
      out.push(
        '/* Player max width */\n' +
        HOST + ' {\n  max-width: ' + Math.round(pl.playerMaxWidth) + 'px !important;\n  margin-inline: auto !important;\n}'
      );
    }

    if (pl.wideMode) {
      out.push(
        '/* Wide player */\n' +
        'main > div > .container:has(' + IFRAME + '),\n' +
        'main .container:has(video),\n' +
        'main .container:has(' + IFRAME + ') {\n' +
        '  max-width: min(1800px, 96vw) !important;\n}\n' +
        HOST + ' {\n  width: 100% !important;\n}'
      );
    }

    if (pl.theaterMode) {
      out.push(
        '/* Theater mode */\n' +
        'html.aonc-theater main .container:has(' + IFRAME + '),\n' +
        'html.aonc-theater main .container:has(video) {\n' +
        '  max-width: none !important;\n  padding-inline: 0 !important;\n}\n' +
        'html.aonc-theater ' + HOST + ' {\n' +
        '  width: 100vw !important;\n  max-width: 100vw !important;\n' +
        '  aspect-ratio: 16 / 9 !important;\n  border-radius: 0 !important;\n}\n' +
        'html.aonc-theater header {\n  opacity: .35;\n  transition: opacity .2s ease;\n}\n' +
        'html.aonc-theater header:hover {\n  opacity: 1;\n}'
      );
    }

    if (pl.cinemaLights) {
      var dim = A.lang.clamp(pl.cinemaDim, 0, 98) / 100;
      out.push(
        '/* Cinema lights */\n' +
        'html.aonc-cinema body::after {\n' +
        '  content: "";\n  position: fixed;\n  inset: 0;\n  z-index: 40;\n' +
        '  pointer-events: none;\n  background: rgba(0,0,0,' + dim.toFixed(2) + ');\n' +
        '  opacity: 0;\n  transition: opacity .25s ease;\n}\n' +
        'html.aonc-cinema.aonc-playing body::after {\n  opacity: 1;\n}\n' +
        'html.aonc-cinema.aonc-playing ' + HOST + ',\n' +
        'html.aonc-cinema.aonc-playing video {\n' +
        '  position: relative;\n  z-index: 41;\n}'
      );
    }

    if (pl.hideKodikBranding) {
      out.push(
        '/* Hide third-party player branding (inside the embed) */\n' +
        'html.aonc-clean-player ' + HOST + ' {\n  background: ' + (p ? p.background : '#000') + ' !important;\n}'
      );
    }

    if (pl.expandPlayerToViewport) {
      out.push(
        'html.aonc-maxplayer ' + HOST + ' {\n' +
        '  position: fixed !important;\n  inset: 0 !important;\n  z-index: 2147483000 !important;\n' +
        '  width: 100vw !important;\n  height: 100vh !important;\n' +
        '  max-width: none !important;\n  aspect-ratio: auto !important;\n  border-radius: 0 !important;\n}'
      );
    }

    if (pl.hideComments) {
      out.push(
        '#comments, [id*="comment"], section:has(#comments) {\n  display: none !important;\n}'
      );
    }

    if (pl.hideEpisodeSuggestions) {
      out.push(
        'section:has(h2):not(:has(' + IFRAME + ')) ~ section:has([class*="aspect-[2/3]"]) {\n  display: none !important;\n}'
      );
    }

    return out.join('\n\n');
  }

  return { build: build, HOST: HOST, IFRAME: IFRAME };
});
