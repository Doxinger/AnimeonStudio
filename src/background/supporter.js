// Список ников, поддержавших разработку AnimeOn Studio (donate.txt).
// Кэш с TTL, как у кланов: фон держит список, контент только запрашивает.
AONC.define('background.supporter', function (A) {
  'use strict';

  var CACHE_KEY = 'aonc.supporterCache';
  var URL = 'https://raw.githubusercontent.com/Doxinger/clansraw/refs/heads/main/donate.txt';
  var TTL = 6 * 3600 * 1000;

  function readCache() {
    return A.api.store.get([CACHE_KEY]).then(function (data) {
      return (data && data[CACHE_KEY]) || null;
    });
  }

  function writeCache(entry) {
    var payload = {};
    payload[CACHE_KEY] = entry;
    return A.api.store.set(payload);
  }

  // Одна строка — один ник: голый ник или ссылка вида https://…/user/ник
  // (формат donate.txt); пустые строки и комментарии (#) игнорируются.
  function nickOfLine(line) {
    var m = /\/user\/([^/?#]+)/i.exec(line);
    if (m) return decodeURIComponent(m[1]).toLowerCase();
    if (/^https?:\/\//i.test(line)) {
      var u = /\/([^/?#]+)\/?$/i.exec(line.replace(/#.*$/, ''));
      if (u) return decodeURIComponent(u[1]).toLowerCase();
      return '';
    }
    return line.toLowerCase();
  }

  function parseNicks(text) {
    var seen = {};
    var out = [];
    String(text || '').split(/\r?\n/).forEach(function (line) {
      var raw = line.trim();
      if (!raw || raw.indexOf('#') === 0) return;
      var nick = nickOfLine(raw);
      if (!nick || seen[nick]) return;
      seen[nick] = true;
      out.push(nick);
    });
    return out;
  }

  var FETCH_TIMEOUT = 15000;

  function fetchText(url, timeoutMs) {
    return A.api.fetchWithTimeout(url, { cache: 'no-store' }, timeoutMs || FETCH_TIMEOUT).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    });
  }

  function get(force) {
    return readCache().then(function (cache) {
      var fresh = cache && (Date.now() - (cache.t || 0)) < TTL;
      if (fresh && !force && cache.nicks) return cache.nicks;
      return fetchText(URL).then(function (text) {
        var nicks = parseNicks(text);
        return writeCache({ t: Date.now(), nicks: nicks }).then(function () {
          return nicks;
        });
      }).catch(function () {
        // Есть свежий или любой кэш — отдаём его; нет —.reject, чтобы контент
        // отличил сбой (фон спит, сеть мигнула) от пустого списка и сделал ретрай.
        if (cache && cache.nicks) return cache.nicks;
        throw new Error('supporter fetch failed');
      });
    });
  }

  return { get: get, parseNicks: parseNicks, fetchText: fetchText, CACHE_KEY: CACHE_KEY, URL: URL, TTL: TTL, FETCH_TIMEOUT: FETCH_TIMEOUT };
});
