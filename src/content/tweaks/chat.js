AONC.define('content.tweaks.chat', function (A) {
  'use strict';

  var state = { observer: null, timer: null, started: false, own: '' };

  function nickFromHref(href) {
    var m = /\/user\/([^/?#]+)/.exec(String(href || ''));
    if (!m) return '';
    try { return decodeURIComponent(m[1]); } catch (e) { return m[1]; }
  }

  function detectOwn() {
    if (state.own) return state.own;

    var link = A.dom.ready.first('header a[href*="/user/"]');
    var nick = link ? nickFromHref(link.getAttribute('href')) : '';

    if (!nick) {
      var path = '';
      try { path = location.pathname || ''; } catch (e) { path = ''; }
      nick = nickFromHref(path);
    }

    if (nick) {
      state.own = nick;
      return nick;
    }

    var candidates = A.dom.ready.queryAll('a[href*="/user/"][class*="avatar"]');
    for (var i = 0; i < candidates.length; i++) {
      var a = candidates[i];
      if (a.closest && a.closest('div[data-msg-id], main, [data-aonc-ui], #aonc-toasts')) continue;
      var guess = nickFromHref(a.getAttribute('href'));
      if (guess) return guess;
    }
    return '';
  }

  function rows() {
    return A.dom.ready.queryAll('div[data-msg-id]');
  }

  function mark(row) {
    if (row.hasAttribute('data-aonc-chat')) return;
    row.setAttribute('data-aonc-chat', '1');
    var config = A.content.config.current().chat || {};
    if (!config.highlightOwn && !config.mentionHighlight) return;

    var own = detectOwn();
    if (!own) return;

    var nameLink = row.querySelector('a[href*="/user/"]');
    if (config.highlightOwn && nameLink) {
      if (nickFromHref(nameLink.getAttribute('href')).toLowerCase() === own.toLowerCase()) {
        row.classList.add('aonc-own');
      }
    }

    if (config.mentionHighlight) {
      var bubble = row.querySelector('div[class*="px-3"][class*="py-2"]');
      var text = bubble ? bubble.textContent || '' : '';
      if (text.indexOf('@' + own) !== -1) row.classList.add('aonc-mention');
    }
  }

  function scan() {
    rows().forEach(mark);
  }

  var throttled = A.lang.throttle(function () {
    if (state.started) scan();
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
    A.dom.ready.queryAll('div[data-msg-id]').forEach(function (row) {
      row.removeAttribute('data-aonc-chat');
      row.classList.remove('aonc-own', 'aonc-mention');
    });
  }

  function apply(config) {
    var c = config.chat || {};
    var on = !!c.highlightOwn || !!c.mentionHighlight;
    if (!on) {
      stop();
      return;
    }
    start();
    scan();
  }

  function reset() {
    stop();
    state.own = '';
  }

  // Кэш своего ника сбрасывается на SPA-переходах: вход/выход из аккаунта
  // не перезагружает страницу, и устаревший ник подсвечивал бы чужие строки.
  function forgetOwn() {
    state.own = '';
  }

  return { apply: apply, reset: reset, scan: scan, detectOwn: detectOwn, forgetOwn: forgetOwn, nickFromHref: nickFromHref };
});
