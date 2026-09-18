// «Профиль как в Steam»: своя картинка на страницу профиля (фон позади
// контента + затемнение/виньетка/блюр), опционально та же картинка на обложку.
// Визуальный слой: слоты сайта не меняются, видит только ваш браузер.
// Работает на маршрутах профиля; по умолчанию — только на своём профиле.
AONC.define('content.tweaks.profileFx', function (A) {
  'use strict';

  var IMG_ID = 'aonc-pfx-img';
  var OV_ID = 'aonc-pfx-ov';
  var STYLE_ID = 'aonc-pfx-css';
  var COVER = 'div.min-h-screen > div.relative:first-child';

  function fxOf(config) {
    return A.lang.normalize(A.config.defaults.profileFx, config.profileFx || {});
  }

  function ownNick() {
    try {
      return String(A.content.tweaks.chat.detectOwn() || '').toLowerCase();
    } catch (e) {
      return '';
    }
  }

  function match(config) {
    var p = '';
    try { p = location.pathname; } catch (e) { return false; }
    if (p === '/profile' || p === '/profile/' || p === '/me' || p === '/me/') return true;
    var m = /^\/user\/([^/?#]+)/.exec(p);
    if (!m) return false;
    if (!fxOf(config).onlyMine) return true;
    var own = ownNick();
    if (!own) return false;
    try {
      return decodeURIComponent(m[1]).toLowerCase() === own;
    } catch (e) {
      return m[1].toLowerCase() === own;
    }
  }

  function bgValue(config) {
    var w = config.wallpaper || {};
    if (w.enabled === false) return '';
    try {
      return A.config.wallpapers.valueFor(w) || '';
    } catch (e) {
      return '';
    }
  }

  function alpha(v) {
    return (Math.max(0, Math.min(100, Number(v) || 0)) / 100).toFixed(2);
  }

  function ensure(fx, val) {
    var body = document.body || document.documentElement;
    if (!body) return;

    var img = document.getElementById(IMG_ID);
    if (!img) {
      img = document.createElement('div');
      img.id = IMG_ID;
      img.setAttribute('data-aonc', '1');
      body.appendChild(img);
    }
    img.style.cssText = 'position:fixed;inset:0;z-index:-2;pointer-events:none;' +
      (val ? 'background-image:' + val + ';' : '') +
      'background-size:cover;' +
      'background-position:center;' +
      'background-repeat:no-repeat;' +
      'background-attachment:fixed;' +
      ((fx.blur | 0) > 0 ? 'filter:blur(' + (fx.blur | 0) + 'px);' : '');

    var layers = [];
    if ((fx.vignette | 0) > 0) {
      layers.push('radial-gradient(120% 90% at 50% 40%, rgba(0,0,0,0) 55%, rgba(0,0,0,' + alpha(fx.vignette) + ') 100%)');
    }
    if ((fx.overlay | 0) > 0) {
      layers.push('linear-gradient(rgba(0,0,0,' + alpha(fx.overlay) + '), rgba(0,0,0,' + alpha(fx.overlay) + '))');
    }
    var ov = document.getElementById(OV_ID);
    if (!ov) {
      ov = document.createElement('div');
      ov.id = OV_ID;
      ov.setAttribute('data-aonc', '1');
      body.appendChild(ov);
    }
    ov.style.cssText = 'position:fixed;inset:0;z-index:-1;pointer-events:none;' +
      (layers.length ? 'background-image:' + layers.join(',') + ';' : '');

    var st = document.getElementById(STYLE_ID);
    if (!st) {
      st = document.createElement('style');
      st.id = STYLE_ID;
      st.setAttribute('data-aonc', '1');
      (document.head || document.documentElement).appendChild(st);
    }
    // Контент сайта красит main и обёртки инлайново — прозрачим их, иначе
    // фон не видно (та же техника, что у обоев с «прозрачным фоном контента»).
    st.textContent =
      'main, main[style], main > div[style*="background"] {\n' +
      '  background-color: transparent !important;\n  background-image: none !important;\n}\n' +
      'main [class*="bg-background"],\n' +
      'div[class*="min-h-screen"][class*="bg-background"],\n' +
      'div[class*="min-h-dvh"][class*="bg-background"],\n' +
      'div[class*="min-h-screen"][class*="bg-[#"] {\n' +
      '  background-color: transparent !important;\n}\n' +
      ((fx.coverMode === 'image' && val)
        ? COVER + ' {\n  background-image: ' + val + ' !important;\n  background-size: cover !important;\n  background-position: center !important;\n}\n'
        : '');
  }

  function remove() {
    [IMG_ID, OV_ID, STYLE_ID].forEach(function (id) {
      var n = document.getElementById(id);
      if (n && n.parentNode) n.parentNode.removeChild(n);
    });
  }

  function apply(config) {
    var fx = fxOf(config);
    if (!fx.enabled || !match(config)) {
      remove();
      return;
    }
    ensure(fx, bgValue(config));
  }

  function reset() {
    remove();
  }

  return { apply: apply, remove: remove, reset: reset, match: match, COVER: COVER };
});
