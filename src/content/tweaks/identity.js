AONC.define('content.tweaks.identity', function (A) {
  'use strict';

  var MARK = 'data-aonc-nick';
  var ORIG = 'data-aonc-nick-original';
  var ORIG_STYLE = 'data-aonc-nick-style';

  var state = { observer: null, timer: null, started: false, own: '' };

  function ownName() {
    state.own = A.content.tweaks.chat.detectOwn() || '';
    return state.own;
  }

  function active(config) {
    var c = config.identity || {};
    return !!((c.name && String(c.name).trim()) ||
      (c.prefix && String(c.prefix).trim()) ||
      (c.suffix && String(c.suffix).trim()));
  }

  function compose(c, original) {
    var base = (c.name && String(c.name).trim()) ? String(c.name).trim() : original;
    var pre = (c.prefix && String(c.prefix).trim()) ? String(c.prefix) : '';
    var suf = (c.suffix && String(c.suffix).trim()) ? String(c.suffix) : '';
    return pre + base + suf;
  }

  function styleFor(c) {
    var css = '';
    var color = c.color && String(c.color).trim() ? String(c.color).trim() : '';
    if (color && c.gradient) {
      var second = A.color.transform.rotate(color, 60);
      css += 'background-image:linear-gradient(92deg,' + color + ',' + second + ');' +
        'background-clip:text;-webkit-background-clip:text;-webkit-text-fill-color:transparent;color:transparent;';
    } else if (color) {
      css += 'color:' + color + ';';
    }
    if (c.bold) css += 'font-weight:700;';
    return css;
  }

  function linksFor(selector, own) {
    var nick = A.content.tweaks.chat.nickFromHref;
    var key = String(own).toLowerCase();
    return A.dom.ready.queryAll(selector).filter(function (a) {
      return nick(a.getAttribute('href')).toLowerCase() === key;
    });
  }

  function targets(config) {
    var own = ownName();
    if (!own) return [];
    var c = config.identity || {};
    var list = [];

    if (c.inChat !== false) {
      list = list.concat(linksFor('div[data-msg-id] a[href*="/user/"]', own));
    }
    if (c.inHeader !== false) {
      list = list.concat(linksFor('header a[href*="/user/"]', own));
    }
    if (c.inProfile !== false) {
      list = list.concat(linksFor('main a[href*="/user/"]', own));
      var at = ('@' + own).toLowerCase();
      A.dom.ready.queryAll('main span, main h1, main div').forEach(function (el) {
        if (el.children.length) return;
        var text = (el.textContent || '').trim();
        if (text.toLowerCase() === at) list.push(el);
      });
    }

    var uniq = [];
    list.forEach(function (el) {
      if (uniq.indexOf(el) !== -1) return;
      if (el.querySelector && el.querySelector('img, svg, [data-slot="avatar"]')) return;
      if (!(el.textContent || '').trim()) return;
      uniq.push(el);
    });
    return uniq;
  }

  function applyTo(el, config) {
    var c = config.identity || {};
    if (!el.hasAttribute(ORIG)) {
      el.setAttribute(ORIG, el.textContent || '');
    }
    if (!el.hasAttribute(ORIG_STYLE)) {
      el.setAttribute(ORIG_STYLE, el.getAttribute('style') || '');
    }
    var text = compose(c, el.getAttribute(ORIG) || '');
    var base = el.getAttribute(ORIG_STYLE) || '';
    var css = styleFor(c);
    var nextStyle = css ? (base ? base + ';' + css : css) : base;
    var currentStyle = el.getAttribute('style') || '';
    if (el.getAttribute(MARK) === '1' && el.textContent === text && currentStyle === nextStyle) return;
    if (el.textContent !== text) el.textContent = text;
    if (currentStyle !== nextStyle) {
      if (nextStyle) el.setAttribute('style', nextStyle);
      else el.removeAttribute('style');
    }
    if (el.getAttribute(MARK) !== '1') el.setAttribute(MARK, '1');
  }

  function restore(el) {
    var orig = el.getAttribute(ORIG);
    if (orig != null && el.textContent !== orig) el.textContent = orig;
    var base = el.getAttribute(ORIG_STYLE);
    if (base != null) {
      if (base) el.setAttribute('style', base);
      else el.removeAttribute('style');
    }
    el.removeAttribute(ORIG);
    el.removeAttribute(ORIG_STYLE);
    el.removeAttribute(MARK);
  }

  function marked() {
    return A.dom.ready.queryAll('[' + MARK + ']');
  }

  function scan(config) {
    if (!active(config)) {
      marked().forEach(restore);
      return;
    }
    targets(config).forEach(function (el) {
      applyTo(el, config);
    });
  }

  var throttled = A.lang.throttle(function () {
    if (state.started) scan(A.content.config.current());
  }, 400);

  function start() {
    if (state.started) return;
    state.started = true;
    state.observer = A.dom.ready.observe(document.documentElement, function () { throttled(); });
    state.timer = setInterval(throttled, 1500);
  }

  function stop() {
    if (state.observer) {
      try { state.observer.disconnect(); } catch (e) {}
      state.observer = null;
    }
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    state.started = false;
    marked().forEach(restore);
  }

  function apply(config) {
    if (!active(config)) {
      stop();
      return;
    }
    start();
    scan(config);
  }

  function reset() {
    stop();
    state.own = '';
  }

  // Сброс кэша своего ника на SPA-переходах (вход/выход из аккаунта без
  // перезагрузки): иначе подстановка имени украшает чужие ссылки.
  function forgetOwn() {
    state.own = '';
  }

  return { apply: apply, reset: reset, scan: scan, ownName: ownName, MARK: MARK, forgetOwn: forgetOwn };
});
