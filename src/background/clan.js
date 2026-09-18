AONC.define('background.clan', function (A) {
  'use strict';

  var CACHE_KEY = 'aonc.clanCache';

  var PALETTE = [
    ['#EC4899', '#EC9B48'],
    ['#22D3EE', '#3DDC84'],
    ['#A78BFA', '#EC4899'],
    ['#FABD2F', '#FF7A45'],
    ['#3DDC84', '#22D3EE'],
    ['#60A5FA', '#A78BFA'],
    ['#FF7A45', '#EC4899'],
    ['#E4E4E7', '#A1A1AA']
  ];

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

  function parseLines(text) {
    return String(text || '')
      .split(/\r?\n/)
      .map(function (line) { return line.trim(); })
      .filter(function (line) { return line && line.indexOf('#') !== 0; });
  }

  function isUrl(line) {
    return /^https?:\/\//i.test(line);
  }

  function keyOfUrl(url) {
    var m = /\/([^/?#]+)$/.exec(url);
    var name = m ? m[1] : url;
    name = name.replace(/\.[a-z0-9]+$/i, '');
    return name.toUpperCase();
  }

  var FETCH_TIMEOUT = 15000;

  function fetchText(url, timeoutMs) {
    return A.api.fetchWithTimeout(url, { cache: 'no-store' }, timeoutMs || FETCH_TIMEOUT).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    });
  }

  function buildClans(indexText, config) {
    var clan = config.clan || {};
    var lines = parseLines(indexText);
    var urls = lines.filter(isUrl);

    if (!urls.length) {
      var singleKey = (clan.label && String(clan.label).trim()) || 'CLAN';
      return Promise.resolve([{
        key: singleKey,
        label: singleKey,
        url: clan.url || '',
        list: lines.map(function (l) { return l.toLowerCase(); })
      }]);
    }

    return Promise.all(urls.map(function (url) {
      return fetchText(url).then(function (text) {
        return {
          key: keyOfUrl(url),
          label: keyOfUrl(url),
          url: url,
          list: parseLines(text).map(function (l) { return l.toLowerCase(); })
        };
      }).catch(function () {
        return null;
      });
    })).then(function (clans) {
      return clans.filter(function (c) { return c && c.list.length; });
    });
  }

  function decorate(clans, config) {
    var clan = config.clan || {};
    var only = clans.length === 1 && clan.label && String(clan.label).trim();
    return clans.map(function (c, i) {
      var colors = (!clan.autoColors)
        ? [A.color.convert.sanitize(clan.color1, '#EC4899'), A.color.convert.sanitize(clan.color2, '#EC9B48')]
        : PALETTE[i % PALETTE.length];
      return {
        key: c.key,
        label: only ? String(clan.label).trim() : c.label,
        url: c.url,
        list: c.list,
        color1: colors[0],
        color2: colors[1]
      };
    });
  }

  function get(config, force) {
    var clan = config.clan || {};
    var url = clan.url || A.config.defaults.clan.url;
    var ttl = (clan.ttlHours == null ? 6 : clan.ttlHours) * 3600 * 1000;

    return readCache().then(function (cache) {
      var fresh = cache && cache.url === url && (Date.now() - (cache.t || 0)) < ttl;
      if (fresh && !force && cache.clans) return cache.clans;
      return fetchText(url).then(function (indexText) {
        return buildClans(indexText, config).then(function (clans) {
          var decorated = decorate(clans, config);
          return writeCache({ t: Date.now(), url: url, clans: decorated }).then(function () {
            return decorated;
          });
        });
      }).catch(function () {
        return (cache && cache.clans) || [];
      });
    });
  }

  return { get: get, parseLines: parseLines, keyOfUrl: keyOfUrl, PALETTE: PALETTE, CACHE_KEY: CACHE_KEY };
});
