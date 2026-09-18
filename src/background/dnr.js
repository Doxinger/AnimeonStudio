AONC.define('background.dnr', function (A) {
  'use strict';

  var api = A.api.raw;
  var RULE_BASE = 9000;

  function supported() {
    return !!(api && api.declarativeNetRequest && api.declarativeNetRequest.updateDynamicRules);
  }

  function trackerUrls(config) {
    var privacy = config.privacy || {};
    var groups = A.config.selectors.trackers;
    var urls = [];
    if (privacy.blockYandex !== false) urls = urls.concat(groups.yandex);
    if (privacy.blockGoogle !== false) urls = urls.concat(groups.google);
    if (privacy.blockAdNetworks !== false) urls = urls.concat(groups.adNetworks);
    return urls;
  }

  function toUrlFilter(pattern) {
    var m = /^\*:\/\/([^/]+)\/\*$/.exec(pattern);
    if (m) {
      var host = m[1].replace(/^\*\./, '');
      return '||' + host + '/';
    }
    return pattern;
  }

  function buildRules(config) {
    var urls = trackerUrls(config);
    return urls.map(function (pattern, i) {
      return {
        id: RULE_BASE + i,
        priority: 1,
        action: { type: 'block' },
        condition: {
          urlFilter: toUrlFilter(pattern),
          resourceTypes: ['script', 'image', 'xmlhttprequest', 'ping', 'sub_frame', 'other']
        }
      };
    });
  }

  function applyRules(config) {
    if (!supported()) return Promise.resolve({ ok: false, reason: 'unsupported' });
    if (!config.privacy || !config.privacy.hardBlock) return clear();

    return listDynamic().then(function (existing) {
      var removeRuleIds = existing.map(function (r) { return r.id; });
      var addRules = buildRules(config);
      return new Promise(function (resolve) {
        try {
          api.declarativeNetRequest.updateDynamicRules({ removeRuleIds: removeRuleIds, addRules: addRules }, function () {
            var err = A.api.raw.runtime && A.api.raw.runtime.lastError;
            resolve({ ok: !err, count: addRules.length, error: err ? err.message : null });
          });
        } catch (e) {
          resolve({ ok: false, error: String(e && e.message || e) });
        }
      });
    });
  }

  function clear() {
    if (!supported()) return Promise.resolve({ ok: true, count: 0 });
    return listDynamic().then(function (existing) {
      var removeRuleIds = existing.map(function (r) { return r.id; });
      if (!removeRuleIds.length) return { ok: true, count: 0 };
      return new Promise(function (resolve) {
        try {
          api.declarativeNetRequest.updateDynamicRules({ removeRuleIds: removeRuleIds }, function () {
            resolve({ ok: true, count: removeRuleIds.length });
          });
        } catch (e) {
          resolve({ ok: false, error: String(e && e.message || e) });
        }
      });
    });
  }

  function listDynamic() {
    if (!supported()) return Promise.resolve([]);
    return new Promise(function (resolve) {
      try {
        var ret = api.declarativeNetRequest.getDynamicRules(function (rules) {
          resolve(rules || []);
        });
        if (ret && typeof ret.then === 'function') ret.then(function (r) { resolve(r || []); }, function () { resolve([]); });
      } catch (e) {
        resolve([]);
      }
    });
  }

  var ORIGINS = null;

  function requiredOrigins(config) {
    if (!ORIGINS) {
      var groups = A.config.selectors.trackers;
      ORIGINS = groups.yandex.concat(groups.google).concat(groups.adNetworks);
    }
    return config && config.privacy
      ? ORIGINS.filter(function (o) {
        if (/yandex|adfox|yastatic/.test(o)) return config.privacy.blockYandex !== false;
        if (/google|doubleclick/.test(o)) return config.privacy.blockGoogle !== false;
        return config.privacy.blockAdNetworks !== false;
      })
      : ORIGINS;
  }

  function hasPermission(config) {
    if (!api || !api.permissions || !api.permissions.contains) return Promise.resolve(false);
    var origins = requiredOrigins(config);
    return new Promise(function (resolve) {
      try {
        api.permissions.contains({ origins: origins }, function (granted) {
          void (api.runtime && api.runtime.lastError);
          resolve(!!granted);
        });
      } catch (e) { resolve(false); }
    });
  }

  function requestPermission(config) {
    if (!api || !api.permissions || !api.permissions.request) return Promise.resolve(false);
    var origins = requiredOrigins(config);
    return new Promise(function (resolve) {
      try {
        api.permissions.request({ origins: origins }, function (granted) {
          void (api.runtime && api.runtime.lastError);
          resolve(!!granted);
        });
      } catch (e) { resolve(false); }
    });
  }

  function removePermission(config) {
    if (!api || !api.permissions || !api.permissions.remove) return Promise.resolve(true);
    return new Promise(function (resolve) {
      try {
        api.permissions.remove({ origins: requiredOrigins(config) }, function () { resolve(true); });
      } catch (e) { resolve(false); }
    });
  }

  return {
    supported: supported,
    toUrlFilter: toUrlFilter,
    applyRules: applyRules,
    clear: clear,
    buildRules: buildRules,
    requiredOrigins: requiredOrigins,
    hasPermission: hasPermission,
    requestPermission: requestPermission,
    removePermission: removePermission,
    listDynamic: listDynamic
  };
});
