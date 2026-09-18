AONC.define('background.catalog', function (A) {
  'use strict';

  var CACHE_KEY = 'aonc.framesCatalog';
  var API_PATH = '/api/cosmetics/catalog';
  var FALLBACK_HOST = 'https://v2.animeon.co';
  var TTL = 12 * 60 * 60 * 1000;

  function cacheKey(host) {
    return CACHE_KEY + ':' + (host || 'default');
  }

  function readCache(host) {
    var key = cacheKey(host);
    return A.api.store.get([key]).then(function (data) {
      return (data && data[key]) || null;
    });
  }

  function writeCache(host, entry) {
    var payload = {};
    payload[cacheKey(host)] = entry;
    return A.api.store.set(payload).then(function () { return entry; });
  }

  function hostFromUrl(url) {
    var m = /^https?:\/\/([^/]+)/i.exec(String(url || ''));
    return m ? m[0] : '';
  }

  function siteHost() {
    return A.background.commands.siteTabs().then(function (tabs) {
      for (var i = 0; i < (tabs || []).length; i++) {
        var host = hostFromUrl(tabs[i].url);
        if (host) return host;
      }
      return FALLBACK_HOST;
    }).catch(function () {
      return FALLBACK_HOST;
    });
  }

  var FETCH_TIMEOUT = 20000;

  function fetchCatalog(host) {
    return A.api.fetchWithTimeout(host + API_PATH, {
      credentials: 'include',
      cache: 'no-store',
      headers: { accept: 'application/json' }
    }, FETCH_TIMEOUT).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function pack(host, json) {
    var frames = A.config.framesLib.fromApi((json && json.frames) || []);
    var titles = A.config.titlesLib.fromApi((json && json.titles) || []);
    return {
      host: host,
      at: Date.now(),
      count: frames.length,
      items: frames.map(function (f) {
        return {
          id: f.id,
          name: f.name,
          rarity: f.rarity,
          source: f.source,
          label: f.label,
          unlocked: f.unlocked,
          order: f.order,
          scale: f.scale,
          ox: f.ox,
          oy: f.oy,
          type: f.type,
          color: f.color,
          url: f.url,
          format: f.format,
          animated: f.animated,
          remote: true
        };
      }),
      titlesCount: titles.length,
      titles: titles.map(function (t) {
        t.remote = true;
        return t;
      })
    };
  }

  function toLib(entry) {
    return { items: (entry && entry.items) || [], at: (entry && entry.at) || 0, count: (entry && entry.count) || 0 };
  }

  function toTitlesLib(entry) {
    return { items: (entry && entry.titles) || [], at: (entry && entry.at) || 0, count: (entry && entry.titlesCount) || 0 };
  }

  function setBothLibs(entry) {
    if (!entry) return;
    if (entry.items && entry.items.length) A.config.framesLib.setRemote(toLib(entry));
    if (entry.titles && entry.titles.length) A.config.titlesLib.setRemote(toTitlesLib(entry));
  }

  function loadIntoLib(host) {
    return readCache(host).then(function (entry) {
      setBothLibs(entry);
      return entry;
    });
  }

  function refresh(payload) {
    var wantHost = hostFromUrl(payload && payload.host);
    return (wantHost ? Promise.resolve(wantHost) : siteHost()).then(function (host) {
      return fetchCatalog(host).then(function (json) {
        var entry = pack(host, json);
        if (!entry.count) throw new Error('каталог пуст');
        return writeCache(host, entry).then(function () {
          setBothLibs(entry);
          return {
            host: host, count: entry.count, at: entry.at,
            titlesCount: entry.titlesCount || 0,
            items: entry.items, titles: entry.titles
          };
        });
      });
    });
  }

  function get(payload) {
    var wantHost = hostFromUrl(payload && payload.host);
    return (wantHost ? Promise.resolve(wantHost) : siteHost()).then(function (host) {
      return readCache(host).then(function (entry) {
        var fresh = entry && entry.at && (Date.now() - entry.at) < TTL && entry.titles;
        if (fresh || (entry && payload && payload.force === false)) {
          setBothLibs(entry);
          return {
            host: host, count: entry ? entry.count : 0, at: entry ? entry.at : 0, cached: !!entry,
            titlesCount: entry ? (entry.titlesCount || 0) : 0,
            items: entry ? entry.items : [], titles: entry ? (entry.titles || []) : []
          };
        }
        return refresh({ host: host }).then(function (res) {
          res.cached = false;
          return res;
        }).catch(function () {
          return loadIntoLib(host).then(function (cachedEntry) {
            return {
              host: host,
              count: cachedEntry ? cachedEntry.count : 0,
              at: cachedEntry ? cachedEntry.at : 0,
              cached: !!cachedEntry,
              titlesCount: cachedEntry ? (cachedEntry.titlesCount || 0) : 0,
              items: cachedEntry ? (cachedEntry.items || []) : [],
              titles: cachedEntry ? (cachedEntry.titles || []) : [],
              offline: true
            };
          });
        });
      });
    });
  }

  function clear() {
    return siteHost().then(function (host) {
      return A.api.store.remove([cacheKey(host)]).then(function () {
        A.config.framesLib.setRemote({ items: [], at: 0 });
        A.config.titlesLib.setRemote({ items: [], at: 0 });
        return { cleared: host };
      });
    });
  }

  return {
    CACHE_KEY: CACHE_KEY,
    API_PATH: API_PATH,
    TTL: TTL,
    get: get,
    refresh: refresh,
    clear: clear,
    pack: pack,
    siteHost: siteHost
  };
});
