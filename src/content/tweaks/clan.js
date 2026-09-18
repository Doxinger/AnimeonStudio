AONC.define('content.tweaks.clan', function (A) {
  'use strict';

  var MARK = 'data-aonc-clan';

  var state = {
    clans: [],
    observer: null,
    timer: null,
    refreshTimer: null,
    started: false,
    loading: false
  };

  function normalize(response, config) {
    var c = config.clan || {};
    var value = null;
    if (response && response.ok !== false) value = response.value !== undefined ? response.value : response;
    if (!Array.isArray(value)) return [];

    if (value.length && typeof value[0] === 'string') {
      var label = (c.label && String(c.label).trim()) || 'CLAN';
      return [{
        key: label,
        label: label,
        list: value.map(function (x) { return String(x).toLowerCase(); }),
        color1: A.color.convert.sanitize(c.color1, '#EC4899'),
        color2: A.color.convert.sanitize(c.color2, '#EC9B48')
      }];
    }

    return value
      .filter(function (cl) { return cl && Array.isArray(cl.list); })
      .map(function (cl) {
        return {
          key: cl.key || cl.label || 'CLAN',
          label: cl.label || cl.key || 'CLAN',
          list: cl.list.map(function (x) { return String(x).toLowerCase(); }),
          color1: A.color.convert.sanitize(cl.color1, '#EC4899'),
          color2: A.color.convert.sanitize(cl.color2, '#EC9B48')
        };
      });
  }

  // На reload страницы фон (service worker) может ещё спать: канал сообщения
  // рвётся и ответ приходит undefined. Без ретрая клан-бейджи пропали бы до
  // 5-минутного таймера — та же болезнь, что была у значка мецената.
  // Ретраи с бэкоффом: 1.2s, 2.4s, 4.8s, 9.6s, 19.2s.
  var retryTimer = null;

  function scheduleRetry(attempt) {
    var a = attempt || 0;
    if (a >= 5 || !state.started) return;
    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = setTimeout(function () {
      retryTimer = null;
      if (!state.started) return;
      requestClans(false, a + 1).then(function () { throttled(); });
    }, 1200 * Math.pow(2, a));
  }

  // Сторож: зависший ответ фона не должен навсегда оставлять state.loading —
  // иначе клан-бейджи не перезапросятся до перезагрузки страницы.
  var watchdogMs = 20000;

  function setWatchdogMs(ms) {
    watchdogMs = ms > 0 ? ms : 20000;
  }

  function requestClans(force, attempt) {
    if (state.loading) return Promise.resolve(state.clans);
    state.loading = true;
    var settled = false;
    var watchdog = setTimeout(function () {
      if (settled || !state.started) return;
      settled = true;
      state.loading = false;
      scheduleRetry(attempt);
      throttled();
    }, watchdogMs);
    return A.api.sendMessage(A.messaging.msg(force ? A.messaging.TYPE.CLAN_REFRESH : A.messaging.TYPE.CLAN_LIST))
      .then(function (response) {
        if (settled) return state.clans;
        settled = true;
        clearTimeout(watchdog);
        state.loading = false;
        // undefined / {ok:false} — сбой канала или фона: прежний список
        // сохраняем и уходим в ретрай.
        if (!response || response.ok === false) {
          scheduleRetry(attempt);
          return state.clans;
        }
        state.clans = normalize(response, A.content.config.current());
        return state.clans;
      })
      .catch(function () {
        if (settled) return state.clans;
        settled = true;
        clearTimeout(watchdog);
        state.loading = false;
        scheduleRetry(attempt);
        return state.clans;
      });
  }

  function badgeStyle(c, clan) {
    var c1 = clan.color1;
    var c2 = clan.color2;
    var grad = 'background-image:linear-gradient(90deg,' + c1 + ',' + c2 + ');' +
      'background-clip:text;-webkit-background-clip:text;-webkit-text-fill-color:transparent;color:transparent;';
    var base = 'font-size:10px;font-weight:800;letter-spacing:.06em;margin-left:6px;' +
      'line-height:1;user-select:none;vertical-align:middle;';
    if (c.style === 'pill') {
      return base + 'padding:2px 7px;border-radius:999px;border:1px solid ' + A.color.convert.rgba(c1, 0.4) + ';' +
        'background-color:' + A.color.convert.rgba(c1, 0.10) + ';' + grad;
    }
    return base + grad;
  }

  function makeBadge(c, clan) {
    var span = document.createElement('span');
    span.setAttribute(MARK, clan.key);
    span.className = 'aonc-clan-badge';
    span.textContent = clan.label;
    span.title = 'Клан: ' + clan.label;
    span.style.cssText = badgeStyle(c, clan);
    return span;
  }

  function nameLinks(config) {
    var c = config.clan || {};
    var list = [];
    if (c.inChat !== false) {
      list = list.concat(A.dom.ready.queryAll('div[data-msg-id] a[href^="/user/"]'));
    }
    if (c.inProfile !== false && location.pathname.indexOf('/user/') === 0) {
      list = list.concat(A.dom.ready.queryAll('main a[href^="/user/"]'));
    }
    var uniq = [];
    list.forEach(function (el) {
      if (uniq.indexOf(el) === -1) uniq.push(el);
    });
    return uniq;
  }

  function userOf(link) {
    var m = /\/user\/([^/?#]+)/.exec(link.getAttribute('href') || '');
    return m ? decodeURIComponent(m[1]).toLowerCase() : '';
  }

  function clanOf(user) {
    for (var i = 0; i < state.clans.length; i++) {
      if (state.clans[i].list.indexOf(user) !== -1) return state.clans[i];
    }
    return null;
  }

  function scan(config) {
    if (!state.clans.length) return;
    var c = config.clan || {};

    nameLinks(config).forEach(function (link) {
      var next = link.nextElementSibling;
      if (next && next.hasAttribute && next.hasAttribute(MARK)) return;
      if (link.querySelector('[' + MARK + ']')) return;
      var user = userOf(link);
      if (!user) return;
      var clan = clanOf(user);
      if (!clan) return;
      link.insertAdjacentElement('afterend', makeBadge(c, clan));
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
    state.refreshTimer = setInterval(function () {
      requestClans(false).then(function () { throttled(); });
    }, 5 * 60 * 1000);
  }

  function stop() {
    if (state.observer) {
      try { state.observer.disconnect(); } catch (e) {}
      state.observer = null;
    }
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    if (state.refreshTimer) { clearInterval(state.refreshTimer); state.refreshTimer = null; }
    if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
    state.started = false;
    state.loading = false;
    A.dom.ready.queryAll('[' + MARK + ']').forEach(function (b) {
      if (b.parentNode) b.parentNode.removeChild(b);
    });
  }

  function apply(config) {
    var c = config.clan || {};
    if (!c.enabled) {
      stop();
      return;
    }
    start();
    requestClans(false).then(function () {
      scan(A.content.config.current());
    });
  }

  function reset() {
    stop();
    state.clans = [];
  }

  function count() {
    return A.dom.ready.queryAll('[' + MARK + ']').length;
  }

  function clansInfo() {
    return state.clans.map(function (cl) { return { key: cl.key, members: cl.list.length }; });
  }

  return {
    apply: apply, reset: reset, scan: scan, requestClans: requestClans,
    count: count, clansInfo: clansInfo, MARK: MARK, setWatchdogMs: setWatchdogMs
  };
});
