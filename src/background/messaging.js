AONC.define('background.messaging', function (A) {
  'use strict';

  var T = A.messaging.TYPE;
  var handlers = {};

  function activeTab() {
    return A.background.commands.activeTab();
  }

  function broadcast(message) {
    A.background.commands.broadcast(message);
  }

  handlers[T.PING] = function (payload, sender) {
    if (sender && sender.tab && sender.tab.id != null) {
      var cached = A.background.state.cached;
      if (cached) {
        A.background.badge.update(cached);
      } else {
        A.background.state.load().then(function (config) {
          A.background.state.cached = config;
          A.background.badge.update(config);
        }).catch(function () {});
      }
    }
    return { pong: true, version: A.VERSION };
  };

  handlers[T.CONFIG_GET] = function () {
    return A.background.state.load();
  };

  handlers[T.CONFIG_SET] = function (payload) {
    return A.background.state.save(payload.config || payload).then(function (config) {
      broadcast(A.messaging.msg(T.APPLY, { config: config }));
      return config;
    });
  };

  handlers[T.CONFIG_PATCH] = function (payload) {
    return A.background.state.patch(payload.changes || payload).then(function (config) {
      broadcast(A.messaging.msg(T.APPLY, { config: config }));
      return config;
    });
  };

  handlers[T.CONFIG_RESET] = function () {
    return A.config.store.reset().then(function (config) {
      A.background.dnr.clear();
      broadcast(A.messaging.msg(T.APPLY, { config: config }));
      A.background.badge.update(config);
      return config;
    });
  };

  handlers[T.TOGGLE_ENABLED] = function () {
    return A.background.state.toggle().then(function (config) {
      broadcast(A.messaging.msg(T.APPLY, { config: config }));
      A.background.badge.update(config);
      A.background.badge.flash(config.meta.enabled ? 'ON' : 'OFF');
      return { enabled: config.meta.enabled };
    });
  };

  handlers[T.APPLY] = function (payload) {
    return activeTab().then(function (tab) {
      if (!tab || tab.id == null) return { delivered: false };
      return A.api.tabs.sendMessage(tab.id, A.messaging.msg(T.APPLY, payload || {}))
        .then(function (r) { return { delivered: !!r, result: r }; });
    });
  };

  handlers[T.REAPPLY_ALL] = function () {
    return A.background.state.load().then(function (config) {
      return A.background.commands.siteTabs().then(function (tabs) {
        var applied = 0;
        return Promise.all(tabs.map(function (tab) {
          if (tab.id == null) return Promise.resolve();
          return A.api.tabs.sendMessage(tab.id, A.messaging.msg(T.CACHE_CLEAR))
            .then(function () {
              return A.api.tabs.sendMessage(tab.id, A.messaging.msg(T.APPLY, { config: config }));
            })
            .then(function (r) { if (r) applied++; })
            .catch(function () {});
        })).then(function () {
          return { tabs: tabs.length, applied: applied };
        });
      });
    });
  };

  handlers[T.CLAN_LIST] = function () {
    return A.background.state.load().then(function (config) {
      return A.background.clan.get(config, false);
    });
  };

  handlers[T.CLAN_REFRESH] = function () {
    return A.background.state.load().then(function (config) {
      return A.background.clan.get(config, true);
    });
  };

  handlers[T.SUPPORTER_LIST] = function () {
    return A.background.supporter.get(false);
  };

  handlers[T.SUPPORTER_REFRESH] = function () {
    return A.background.supporter.get(true);
  };

  handlers[T.UPDATES_CHECK] = function () {
    return A.background.updates.check(true);
  };

  handlers[T.UPDATES_STATUS] = function () {
    return A.background.updates.statusNow();
  };

  handlers[T.CATALOG_GET] = function (payload) {
    return A.background.catalog.get(payload || {});
  };

  handlers[T.CATALOG_REFRESH] = function (payload) {
    return A.background.catalog.refresh(payload || {});
  };

  handlers[T.CATALOG_CLEAR] = function () {
    return A.background.catalog.clear();
  };

  handlers[T.MIRRORS_STATUS] = function (payload) {
    return A.background.availability.status(payload || {});
  };

  handlers[T.OPEN_OFFLINE] = function (payload, sender) {
    var data = payload || {};
    var senderTab = (sender && sender.tab) || null;
    var tabId = data.tabId != null ? data.tabId : (senderTab ? senderTab.id : null);
    var url = data.url || (senderTab && senderTab.url) || '';
    var error = data.error || '';

    return A.background.availability.open({
      tabId: data.newTab ? null : tabId,
      newTab: !!data.newTab,
      url: url,
      error: error,
      kind: data.kind || A.config.mirrors.classify(error),
      source: data.source || (senderTab ? 'content' : 'page')
    });
  };

  handlers[T.OPEN_STUDIO] = function () {
    A.background.menus.openStudio();
    return { opened: true };
  };

  handlers[T.RELOAD_TAB] = function () {
    return activeTab().then(function (tab) {
      if (tab && tab.id != null) return A.api.tabs.reload(tab.id).then(function () { return { reloaded: true }; });
      return { reloaded: false };
    });
  };

  handlers[T.PROFILES_LIST] = function () {
    return A.config.profiles.loadAll().then(function (list) {
      return list.map(function (p) {
        return { id: p.id, name: p.name, createdAt: p.createdAt, updatedAt: p.updatedAt, preset: p.config.theme.preset };
      });
    });
  };

  handlers[T.PROFILES_SAVE] = function (payload) {
    return A.config.profiles.save(payload.name, payload.config, payload.id);
  };

  handlers[T.PROFILES_DELETE] = function (payload) {
    return A.config.profiles.remove(payload.id);
  };

  handlers[T.PROFILE_ACTIVATE] = function (payload) {
    return A.config.profiles.activate(payload.id).then(function (config) {
      if (!config) return null;
      broadcast(A.messaging.msg(T.APPLY, { config: config }));
      A.background.badge.update(config);
      return config;
    });
  };

  handlers[T.PICKER_START] = function () {
    return activeTab().then(function (tab) {
      if (!tab || tab.id == null) return { started: false };
      return A.api.tabs.sendMessage(tab.id, A.messaging.msg(T.PICKER_START)).then(function (r) {
        return { started: true, result: r };
      });
    });
  };

  handlers[T.PICKER_STOP] = function () {
    return activeTab().then(function (tab) {
      if (!tab || tab.id == null) return { stopped: false };
      return A.api.tabs.sendMessage(tab.id, A.messaging.msg(T.PICKER_STOP));
    });
  };

  handlers[T.PICKER_STATE] = function () {
    return activeTab().then(function (tab) {
      if (!tab || tab.id == null) return { active: false };
      return A.api.tabs.sendMessage(tab.id, A.messaging.msg(T.PICKER_STATE))
        .then(function (r) { return (r && r.value) || { active: false }; });
    });
  };

  handlers[T.PERMISSION_STATE] = function () {
    return A.background.state.load().then(function (config) {
      return A.background.dnr.hasPermission(config).then(function (granted) {
        return { granted: granted, supported: A.background.dnr.supported() };
      });
    });
  };

  handlers[T.PERMISSION_REQUEST] = function () {
    return A.background.state.load().then(function (config) {
      return A.background.dnr.requestPermission(config).then(function (granted) {
        if (granted) return A.background.dnr.applyRules(config).then(function () { return { granted: granted }; });
        return { granted: granted };
      });
    });
  };

  handlers[T.PERMISSION_REVOKE] = function () {
    return A.background.state.load().then(function (config) {
      return A.background.dnr.clear().then(function () {
        return A.background.dnr.removePermission(config).then(function () {
          var next = A.lang.deepMerge(config, { privacy: { hardBlock: false } });
          return A.background.state.save(next).then(function () { return { revoked: true }; });
        });
      });
    });
  };

  handlers[T.SHOWCASE_GRAB] = function () {
    return activeTab().then(function (tab) {
      if (!tab || tab.id == null) return { grabbed: false, error: 'no-tab' };
      return A.api.tabs.sendMessage(tab.id, A.messaging.msg(T.SHOWCASE_GRAB))
        .then(function (r) { return r || { grabbed: false, error: 'no-response' }; });
    });
  };

  handlers[T.EXPORT] = function () {
    return A.background.state.load().then(function (config) {
      return A.config.profiles.exportBundle(config);
    });
  };

  handlers[T.IMPORT] = function (payload) {
    return A.config.profiles.importBundle(payload.text).then(function (config) {
      A.background.dnr.applyRules(config);
      broadcast(A.messaging.msg(T.APPLY, { config: config }));
      A.background.badge.update(config);
      return config;
    });
  };

  handlers[T.DIAGNOSTICS] = function (payload) {
    var wanted = payload && payload.tabId != null ? payload.tabId : null;

    var pick = wanted != null
      ? Promise.resolve([{ id: wanted }])
      : A.background.commands.siteTabs();

    return pick.then(function (tabs) {
      if (!tabs || !tabs.length) return { noSiteTab: true };
      var tab = tabs[0];
      return A.api.tabs.sendMessage(tab.id, A.messaging.msg(T.DIAGNOSTICS)).then(function (r) {
        return { tabUrl: tab.url || null, result: r };
      });
    });
  };

  handlers[T.PRIVACY_STATS] = function (payload) {
    return A.background.commands.siteTabs().then(function (tabs) {
      if (!tabs || !tabs.length) return { noSiteTab: true, stats: null };
      return A.api.tabs.sendMessage(tabs[0].id, A.messaging.msg(T.PRIVACY_STATS, payload)).then(function (r) {
        return r || { stats: null };
      });
    });
  };

  function start() {
    return A.api.onMessage(A.messaging.router(handlers));
  }

  return { start: start, handlers: handlers };
});
