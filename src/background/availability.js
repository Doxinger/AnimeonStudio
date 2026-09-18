// Недоступность сайта: ловим ошибку загрузки основного кадра на наших доменах
// и показываем вместо браузерной страницы ошибки свою плашку
// «включите VPN или перейдите на другое зеркало» (offline/offline.html).
// Контент-скрипт на страницу ошибки внедрить нельзя — поэтому живём в фоне.
AONC.define('background.availability', function (A) {
  'use strict';

  var api = A.api.raw;

  var PAGE = 'offline/offline.html';
  var LOOP_WINDOW = 60000;  // окно анти-лупа
  var LOOP_MAX = 3;         // сколько подмен страницы допускается в этом окне

  var installed = false;
  var seen = {};

  function supported() {
    return !!(api && api.webNavigation && api.webNavigation.onErrorOccurred);
  }

  function config() {
    var cached = A.background.state.cached;
    return cached && cached.offline ? Promise.resolve(cached) : A.background.state.load();
  }

  function pageUrl(info) {
    var data = info || {};
    var parts = [];
    if (data.url) parts.push('url=' + encodeURIComponent(data.url));
    if (data.error) parts.push('err=' + encodeURIComponent(data.error));
    if (data.kind) parts.push('kind=' + encodeURIComponent(data.kind));
    if (data.source) parts.push('src=' + encodeURIComponent(data.source));
    parts.push('t=' + Date.now());
    return A.api.getURL(PAGE) + '?' + parts.join('&');
  }

  function createTab(target) {
    return new Promise(function (resolve) {
      try {
        if (!api || !api.tabs || !api.tabs.create) { resolve(null); return; }
        var ret = api.tabs.create({ url: target });
        if (ret && typeof ret.then === 'function') {
          ret.then(function (tab) { resolve(tab || null); }, function () { resolve(null); });
          return;
        }
        resolve(null);
      } catch (e) { resolve(null); }
    });
  }

  function open(info) {
    var data = info || {};
    var target = pageUrl(data);

    if (!api || !api.tabs) return Promise.resolve({ opened: false, url: target, reason: 'no-tabs' });

    if (data.newTab || data.tabId == null) {
      return createTab(target).then(function (tab) {
        return { opened: !!tab || !!(api.tabs && api.tabs.create), url: target, tabId: tab ? tab.id : null };
      });
    }

    if (!A.api.tabs || !A.api.tabs.update) return createTab(target).then(function () { return { opened: true, url: target }; });

    return A.api.tabs.update(data.tabId, { url: target }).then(function () {
      return { opened: true, url: target, tabId: data.tabId };
    }).catch(function () {
      return createTab(target).then(function (tab) {
        return { opened: !!tab, url: target, tabId: tab ? tab.id : null, fallback: true };
      });
    });
  }

  function prune(now) {
    Object.keys(seen).forEach(function (key) {
      if (now - seen[key].at > LOOP_WINDOW * 2) delete seen[key];
    });
  }

  // Защита от петли: одно и то же событие (одинаковый timeStamp) не считаем,
  // а больше LOOP_MAX подмен за окно — не делаем.
  function guard(key, stamp) {
    var now = Date.now();
    prune(now);
    var rec = seen[key];
    var inside = rec && now - rec.at < LOOP_WINDOW;

    if (inside && stamp != null && rec.stamp === stamp) return 'duplicate';
    if (inside && rec.count >= LOOP_MAX) return 'loop';

    seen[key] = {
      at: inside ? rec.at : now,
      count: inside ? rec.count + 1 : 1,
      stamp: stamp == null ? null : stamp
    };
    return '';
  }

  function warmProbes(settings) {
    var off = settings || {};
    if (!off.probe) return Promise.resolve(null);
    return A.config.mirrors.probeAll({ refresh: true, timeout: off.probeTimeoutMs }).catch(function () { return null; });
  }

  // info: { tabId, url, error, timeStamp, source, newTab }
  function onFailure(info) {
    var data = info || {};
    var target = data.url || '';

    if (!target) return Promise.resolve({ shown: false, reason: 'no-url' });
    if (!/^https?:/i.test(target)) return Promise.resolve({ shown: false, reason: 'scheme' });
    if (!A.isSiteUrl(target)) return Promise.resolve({ shown: false, reason: 'off-site' });

    var described = A.config.mirrors.describe(data.error || '');
    if (described.ignored) return Promise.resolve({ shown: false, reason: 'abort' });

    var key = (data.tabId == null ? '-' : data.tabId) + '|' + target;
    var blocked = guard(key, data.timeStamp);
    if (blocked) return Promise.resolve({ shown: false, reason: blocked });

    return config().then(function (cfg) {
      var off = (cfg && cfg.offline) || {};
      if (!off.autoPage) return { shown: false, reason: 'disabled', kind: described.id };

      warmProbes(off);

      return open({
        tabId: data.tabId,
        newTab: !!data.newTab,
        url: target,
        error: described.error,
        kind: described.id,
        tone: described.tone,
        source: data.source || 'background'
      }).then(function (result) {
        return {
          shown: !!(result && result.opened),
          page: result && result.url,
          kind: described.id,
          tone: described.tone,
          url: target,
          reason: result && result.reason
        };
      });
    }).catch(function (e) {
      return { shown: false, reason: 'error: ' + String((e && e.message) || e), kind: described.id };
    });
  }

  function onNavError(details) {
    if (!details || details.frameId !== 0) return;
    onFailure({
      tabId: details.tabId,
      url: details.url,
      error: details.error,
      timeStamp: details.timeStamp,
      source: 'webNavigation'
    });
  }

  function install() {
    if (installed) return true;
    if (!supported()) return false;
    installed = true;
    try {
      api.webNavigation.onErrorOccurred.addListener(onNavError);
    } catch (e) {
      installed = false;
      return false;
    }
    return true;
  }

  // Статус зеркал для плашки, панели и студии.
  function status(payload) {
    var opts = payload || {};
    return config().then(function (cfg) {
      var off = (cfg && cfg.offline) || {};
      var known = A.config.mirrors.cached();

      if (!off.probe && !opts.force) {
        return {
          enabled: false,
          probed: false,
          at: known ? known.at : 0,
          results: known ? known.results : A.config.mirrors.LIST.map(function (m) {
            return { host: m.host, target: A.config.mirrors.url(m.host, '/'), state: 'unknown', status: 0, ms: 0, error: '', at: 0 };
          }),
          aliveCount: known ? known.aliveCount : 0,
          allDown: known ? known.allDown : false,
          best: known ? known.best : null,
          recommended: A.config.mirrors.RECOMMENDED
        };
      }

      return A.config.mirrors.probeAll({
        refresh: !!opts.refresh,
        timeout: off.probeTimeoutMs,
        ttl: opts.ttl
      }).then(function (snap) {
        return {
          enabled: true,
          probed: snap.probed,
          at: snap.at,
          results: snap.results,
          aliveCount: snap.aliveCount,
          allDown: snap.allDown,
          best: snap.best,
          recommended: A.config.mirrors.pick(snap.results, ''),
          mirrors: A.config.mirrors.LIST
        };
      });
    });
  }

  function reset() {
    seen = {};
    A.config.mirrors.clearCache();
  }

  return {
    install: install,
    supported: supported,
    onFailure: onFailure,
    onNavError: onNavError,
    open: open,
    pageUrl: pageUrl,
    status: status,
    guard: guard,
    reset: reset,
    PAGE: PAGE
  };
});
