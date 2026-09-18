AONC.define('background.index', function (A) {
  'use strict';

  function boot() {
    A.background.menus.install();
    A.background.commands.install();
    A.background.messaging.start();
    A.background.sync.start();
    A.background.updates.start();
    A.background.availability.install();

    A.background.state.load().then(function (config) {
      A.background.state.cached = config;
      A.background.badge.update(config);
      if (config.privacy && config.privacy.hardBlock) {
        A.background.dnr.hasPermission(config).then(function (granted) {
          if (granted) A.background.dnr.applyRules(config);
        });
      }
    });

    A.config.store.onConfigChanged(function (config) {
      A.background.state.cached = config;
      A.background.badge.update(config);
    });

    var api = A.api.raw;
    if (api && api.runtime && api.runtime.onInstalled) {
      api.runtime.onInstalled.addListener(function (details) {
        A.background.menus.install();
        var reason = details && details.reason;
        var prepare = reason === 'update' || reason === 'install'
          ? A.background.state.patch({ meta: { seenVersion: '', installedVersion: A.VERSION } })
          : A.background.state.load();

        prepare.then(function (config) {
          A.background.state.cached = config;
          A.background.badge.update(config);
        }).catch(function () {
          A.background.state.load().then(function (config) {
            A.background.badge.update(config);
          });
        });
      });
    }

    if (api && api.runtime && api.runtime.onStartup) {
      api.runtime.onStartup.addListener(function () {
        A.background.menus.install();
      });
    }

    if (api && api.tabs && api.tabs.onActivated) {
      api.tabs.onActivated.addListener(function () {
        A.background.state.load().then(function (config) {
          A.background.state.cached = config;
          A.background.badge.update(config);
        });
      });
    }
  }

  return { boot: boot };
});

(function () {
  'use strict';
  if (typeof AONC === 'undefined' || !AONC.background || !AONC.background.index) return;
  try {
    AONC.background.index.boot();
  } catch (e) {
    if (typeof console !== 'undefined') console.error('[AnimeOn Studio] background boot failed', e);
  }
})();
