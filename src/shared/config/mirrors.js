// Зеркала сайта и проверка их доступности.
// Один источник правды для трёх мест: фон (страница-плашка вместо ошибки браузера),
// контент-скрипт (плашка на «пустой» странице) и студия (виджет статуса зеркал).
AONC.define('config.mirrors', function (A) {
  'use strict';

  // Куда отправляем пользователя в первую очередь.
  var RECOMMENDED = 'v2.animeon.co';
  var CACHE_TTL = 30000;

  // Порядок = приоритет предложения. Список обязан покрывать AONC.HOSTS
  // (это проверяет сборка и e2e-тест), иначе манифест и плашка разъедутся.
  var LIST = [
    { host: 'v2.animeon.co', kind: 'mirror', recommended: true, note: 'Зеркало v2 — рекомендуем' },
    { host: 'animeon.cc', kind: 'main', note: 'Основной домен' },
    { host: 'v1.animeon.co', kind: 'mirror', note: 'Зеркало v1' }
  ];

  // Состояния зеркала после опроса.
  var STATES = ['ok', 'warn', 'down', 'timeout', 'unreachable', 'unknown'];

  // Классы ошибок загрузки: у браузера свои коды, у Firefox — свои.
  var PATTERNS = [
    { id: 'abort', re: /ERR_ABORTED|ERR_CACHE_MISS|ERR_INVALID_URL|ERR_FILE_NOT_FOUND|ERR_UNKNOWN_URL_SCHEME|ERR_BLOCKED_BY_CLIENT|ERR_BLOCKED_BY_RESPONSE|NS_ERROR_ABORT|NS_ERROR_DOM_ABORT/i },
    { id: 'offline', re: /ERR_INTERNET_DISCONNECTED|ERR_NETWORK_CHANGED|ERR_NO_SUPPORTED_PROXIES|ERR_PROXY_CONNECTION_FAILED|ERR_SOCKS_CONNECTION_FAILED|ERR_TUNNEL_CONNECTION_FAILED|ERR_PROXY_|NS_ERROR_OFFLINE|NS_ERROR_UNKNOWN_PROXY_HOST|ERR_NO_NETWORK|NS_ERROR_NETWORK_DOWN/i },
    { id: 'dns', re: /ERR_NAME_NOT_RESOLVED|ERR_NAME_RESOLUTION_FAILED|ERR_DNS_|NS_ERROR_UNKNOWN_HOST|ERR_HOST_RESOLVER/i },
    { id: 'cert', re: /ERR_CERT|ERR_CERTIFICATE|ERR_SSL_PROTOCOL_ERROR|ERR_SSL_|SSL_ERROR|NS_ERROR_NET_INADEQUATE_SECURITY|NS_ERROR_BAD_CERT|ERR_CERT_AUTHORITY_INVALID/i },
    { id: 'blocked', re: /ERR_CONNECTION_REFUSED|ERR_ADDRESS_UNREACHABLE|ERR_UNSAFE_PORT|ERR_CONNECTION_BLOCKED|ERR_BLOCKED_BY_ADMINISTRATOR|ERR_ACCESS_DENIED|NS_ERROR_CONNECTION_REFUSED|NS_ERROR_ACCESS_DENIED/i },
    { id: 'timeout', re: /ERR_CONNECTION_TIMED_OUT|ERR_TIMED_OUT|ERR_CONNECTION_RESET|ERR_EMPTY_RESPONSE|ERR_CONNECTION_CLOSED|NS_ERROR_NET_TIMEOUT|NS_ERROR_NET_RESET|ERR_CONNECTION_FAILED/i },
    { id: 'server', re: /ERR_TOO_MANY_REDIRECTS|ERR_HTTP2|ERR_QUIC|ERR_HTTP_RESPONSE_CODE_FAILURE|ERR_CONTENT_DECODING_FAILED|ERR_UNEXPECTED|NS_ERROR_NET_HTTP2|NS_ERROR_NET_PARTIAL_TRANSFER/i }
  ];

  // Тон плашки: что советовать пользователю.
  var TONES = {
    dns: 'vpn',
    timeout: 'vpn',
    blocked: 'vpn',
    offline: 'net',
    cert: 'cert',
    server: 'server',
    abort: 'other',
    unknown: 'other'
  };

  function url(host, path) {
    return 'https://' + host + (path || '/');
  }

  function hosts() {
    return LIST.map(function (m) { return m.host; });
  }

  function hostOf(rawUrl) {
    try { return new URL(rawUrl).hostname.toLowerCase().replace(/\.$/, ''); } catch (e) { return ''; }
  }

  function pathOf(rawUrl) {
    try {
      var u = new URL(rawUrl);
      return (u.pathname || '/') + (u.search || '') + (u.hash || '');
    } catch (e) {
      return '/';
    }
  }

  function byHost(host) {
    var h = String(host || '').toLowerCase().replace(/\.$/, '');
    for (var i = 0; i < LIST.length; i++) if (LIST[i].host === h) return LIST[i];
    return null;
  }

  function normalizeHost(value) {
    var h = String(value || '').toLowerCase().replace(/\.$/, '');
    if (!h) return '';
    if (byHost(h)) return h;
    return hostOf(h);
  }

  // Зеркало «по умолчанию»: первое из списка, кроме текущего хоста.
  function mirrorHost(fromHost) {
    var current = normalizeHost(fromHost);
    for (var i = 0; i < LIST.length; i++) if (LIST[i].host !== current) return LIST[i].host;
    return LIST[0].host;
  }

  // Зеркало с сохранением пути: /catalog?q=1 → https://v2.animeon.co/catalog?q=1
  function mirrorUrl(fromHost, rawUrl) {
    var path = rawUrl ? pathOf(rawUrl) : '/';
    return url(mirrorHost(fromHost), path);
  }

  // Куда вести после опроса: живое рекомендуемое, иначе любое живое,
  // иначе рекомендуемое (сеть может врать, а кнопка обязана быть полезной).
  function pick(results, fromHost) {
    var current = normalizeHost(fromHost);
    var alive = {};
    (results || []).forEach(function (r) { if (isAlive(r)) alive[r.host] = true; });

    if (RECOMMENDED !== current && alive[RECOMMENDED]) return RECOMMENDED;
    for (var i = 0; i < LIST.length; i++) {
      if (LIST[i].host !== current && alive[LIST[i].host]) return LIST[i].host;
    }
    if (RECOMMENDED !== current) return RECOMMENDED;
    for (var j = 0; j < LIST.length; j++) if (LIST[j].host !== current) return LIST[j].host;
    return current || LIST[0].host;
  }

  function classify(error) {
    var text = String(error || '');
    if (!text) return 'unknown';
    for (var i = 0; i < PATTERNS.length; i++) if (PATTERNS[i].re.test(text)) return PATTERNS[i].id;
    return 'unknown';
  }

  function toneOf(error) {
    return TONES[classify(error)] || 'other';
  }

  function describe(error) {
    var id = classify(error);
    return {
      id: id,
      tone: TONES[id] || 'other',
      error: String(error || ''),
      // Отменённую навигацию (пользователь ушёл, мы подменили страницу) не показываем.
      ignored: id === 'abort'
    };
  }

  function isAlive(result) {
    return !!result && (result.state === 'ok' || result.state === 'warn');
  }

  function emptyResult(host, extra) {
    var out = {
      host: host,
      target: url(host, '/'),
      state: 'unknown',
      status: 0,
      ms: 0,
      error: '',
      at: 0
    };
    Object.keys(extra || {}).forEach(function (k) { out[k] = extra[k]; });
    return out;
  }

  function stateOf(status, error) {
    if (status) {
      if (status < 400) return 'ok';
      if (status < 500) return 'warn';
      return 'down';
    }
    var text = String(error || '');
    if (/timeout|abort/i.test(text)) return 'timeout';
    return 'unreachable';
  }

  function fetchWithTimeout(target, options, ms) {
    return new Promise(function (resolve, reject) {
      var done = false;
      var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
      var opts = Object.assign({}, options || {});
      if (ctrl) opts.signal = ctrl.signal;

      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        if (ctrl) { try { ctrl.abort(); } catch (e) {} }
        reject(new Error('timeout'));
      }, ms);

      function settle(fn, value) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        fn(value);
      }

      try {
        var ret = fetch(target, opts);
        if (!ret || typeof ret.then !== 'function') { settle(reject, new Error('no-fetch')); return; }
        ret.then(function (res) { settle(resolve, res); }, function (err) { settle(reject, err || new Error('fetch failed')); });
      } catch (e) {
        settle(reject, e);
      }
    });
  }

  function attempt(target, method, timeout) {
    return fetchWithTimeout(target, {
      method: method,
      cache: 'no-store',
      redirect: 'follow',
      credentials: 'omit',
      headers: { 'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8' }
    }, timeout);
  }

  // Опрос одного зеркала. Любой HTTP-ответ (даже 403/405) = хост достижим:
  // нам важно отличить «DNS/сеть не пускает» от «сервер жив».
  function probe(host, options) {
    var opts = options || {};
    var timeout = Math.max(1000, Number(opts.timeout) || 7000);
    var target = url(host, '/');
    var started = Date.now();

    if (typeof fetch !== 'function') {
      return Promise.resolve(emptyResult(host, { state: 'unreachable', error: 'no-fetch', at: Date.now() }));
    }

    function finish(res, error) {
      var status = res ? (res.status || 0) : 0;
      var msg = error ? String((error && error.message) || error) : '';
      return {
        host: host,
        target: target,
        status: status,
        state: status ? stateOf(status, msg) : stateOf(0, msg),
        ms: Math.max(0, Date.now() - started),
        error: msg || (status >= 400 ? 'http ' + status : ''),
        at: Date.now()
      };
    }

    return attempt(target, 'HEAD', timeout).then(function (res) {
      // Некоторые серверы не любят HEAD — пробуем GET, но один раз.
      if (res && (res.status === 405 || res.status === 501)) {
        return attempt(target, 'GET', timeout).then(
          function (res2) { return finish(res2 || res); },
          function () { return finish(res); }
        );
      }
      return finish(res);
    }, function (err) {
      if (/timeout/i.test(String((err && err.message) || err))) return finish(null, err);
      return attempt(target, 'GET', timeout).then(
        function (res) { return finish(res); },
        function (err2) { return finish(null, err2 || err); }
      );
    });
  }

  var cache = { at: 0, results: null };

  function snapshot(probed) {
    var results = (cache.results || []).slice();
    var alive = results.filter(isAlive);
    var best = null;
    for (var i = 0; i < LIST.length; i++) {
      var found = null;
      for (var j = 0; j < results.length; j++) if (results[j].host === LIST[i].host) found = results[j];
      if (isAlive(found)) { best = found.host; break; }
    }
    if (!best && alive.length) best = alive[0].host;
    return {
      at: cache.at,
      probed: !!probed,
      results: results.length ? results : LIST.map(function (m) { return emptyResult(m.host); }),
      aliveCount: alive.length,
      allDown: results.length > 0 && alive.length === 0,
      best: best,
      recommended: pick(results, ''),
      known: !!cache.results
    };
  }

  function cached() {
    return cache.results ? snapshot(false) : null;
  }

  function clearCache() {
    cache = { at: 0, results: null };
  }

  function fresh(ttl) {
    return !!cache.results && (Date.now() - cache.at) < (ttl == null ? CACHE_TTL : ttl);
  }

  function probeAll(options) {
    var opts = options || {};
    if (!opts.refresh && fresh(opts.ttl)) return Promise.resolve(snapshot(false));

    return Promise.all(LIST.map(function (m) {
      return probe(m.host, opts).catch(function (e) {
        return emptyResult(m.host, { state: 'unreachable', error: String((e && e.message) || e), at: Date.now() });
      });
    })).then(function (results) {
      cache = { at: Date.now(), results: results };
      return snapshot(true);
    });
  }

  return {
    LIST: LIST,
    STATES: STATES,
    RECOMMENDED: RECOMMENDED,
    CACHE_TTL: CACHE_TTL,
    url: url,
    hosts: hosts,
    hostOf: hostOf,
    pathOf: pathOf,
    byHost: byHost,
    normalizeHost: normalizeHost,
    mirrorHost: mirrorHost,
    mirrorUrl: mirrorUrl,
    pick: pick,
    classify: classify,
    tone: toneOf,
    describe: describe,
    isAlive: isAlive,
    probe: probe,
    probeAll: probeAll,
    cached: cached,
    clearCache: clearCache
  };
});
