AONC.define('content.bootstrap', function (A) {
  'use strict';

  var started = false;
  var unsubscribers = [];
  var pageShowHandler = null;

  function applyAll(config, options) {
    var opts = options || {};
    A.content.applier.apply(config, opts);

    if (!config.meta.enabled) {
      A.content.tweaks.visibility.stop();
      A.content.tweaks.wallpaper.reset();
      A.content.tweaks.siteCosmetics.reset();
      A.content.tweaks.perf.reset();
      A.content.tweaks.posters.stop();
      A.content.tweaks.header.disable();
      A.content.tweaks.privacy.reset();
      A.content.tweaks.player.stop();
      A.content.hotkeys.disable();
      A.content.ui.fab.reset();
      A.content.tweaks.badges.reset();
      A.content.tweaks.titles.reset();
      A.content.tweaks.profileFx.reset();
      A.content.tweaks.showcase.reset();
      A.content.tweaks.frames.reset();
      A.content.tweaks.chat.reset();
      A.content.tweaks.identity.reset();
      A.content.tweaks.collections.reset();
      A.content.tweaks.clan.reset();
      A.content.tweaks.supporter.reset();
      A.content.tweaks.unreachable.reset();
      return A.content.applier.stats();
    }

    A.content.tweaks.visibility.apply(config);
    A.content.tweaks.wallpaper.apply(config);
    A.content.tweaks.siteCosmetics.apply(config);
    A.content.tweaks.perf.apply(config);
    A.content.tweaks.posters.apply(config);
    A.content.tweaks.header.apply(config);
    A.content.tweaks.privacy.apply(config);
    A.content.tweaks.player.apply(config);
    A.content.hotkeys.apply(config);
    A.content.ui.fab.apply(config);
    A.content.tweaks.badges.apply(config);
    A.content.tweaks.titles.apply(config);
    A.content.tweaks.profileFx.apply(config);
    A.content.tweaks.showcase.apply(config);
    A.content.tweaks.frames.apply(config);
    A.content.tweaks.chat.apply(config);
    A.content.tweaks.identity.apply(config);
    A.content.tweaks.collections.apply(config);
    A.content.tweaks.clan.apply(config);
    A.content.tweaks.supporter.apply(config);
    A.content.tweaks.unreachable.apply(config);
    if (config.meta.enabled) A.content.userJs.apply(config, opts);
    return A.content.applier.stats();
  }

  function bootPaint() {
    var entry = A.content.config.bootFromCache();
    if (!entry) return false;
    return A.content.applier.applyBoot();
  }

  function start() {
    if (started) return;
    started = true;

    bootPaint();

    A.content.config.load().then(function (config) {
      A.content.config.set(config);
      applyAll(config, { force: true });
      A.api.sendMessage(A.messaging.msg(A.messaging.TYPE.PING));
      if ((config.cosmetics || {}).framesOn || (config.cosmetics || {}).titlesOn) {
        A.content.catalogSync.sync(false).then(function (value) {
          if (value && value.count) applyAll(A.content.config.current());
        });
      }
    });

    unsubscribers.push(
      A.content.config.watchStorage(),
      A.content.config.onChange(function (config) { applyAll(config); }),
      A.content.messaging.start(),
      A.content.router.onChange(function () {
        var config = A.content.config.current();
        A.content.tweaks.chat.forgetOwn();
        A.content.tweaks.identity.forgetOwn();
        A.content.applier.apply(config, { force: true });
        A.content.tweaks.visibility.run();
        A.content.tweaks.wallpaper.apply(config);
        A.content.tweaks.siteCosmetics.apply(config);
        A.content.tweaks.player.scan();
        A.content.tweaks.posters.scan(document);
        A.content.tweaks.profileFx.apply(config);
        if (config.meta.enabled) A.content.userJs.apply(config, { force: true });
      })
    );

    A.content.router.start();

    A.dom.ready.ready().then(function () {
      A.content.themeMode.reassert();
      var config = A.content.config.current();
      A.content.applier.apply(config, { force: true });
      A.content.tweaks.player.scan();
    });

    if (!pageShowHandler) {
      pageShowHandler = function () {
        A.content.themeMode.reassert();
      };
      window.addEventListener('pageshow', pageShowHandler);
    }
  }

  function shutdown() {
    unsubscribers.forEach(function (off) { try { off(); } catch (e) {} });
    unsubscribers = [];
    if (pageShowHandler) {
      window.removeEventListener('pageshow', pageShowHandler);
      pageShowHandler = null;
    }
    A.content.router.stop();
    A.content.picker.stop();
    A.content.tweaks.visibility.stop();
    A.content.tweaks.wallpaper.reset();
    A.content.tweaks.siteCosmetics.reset();
    A.content.tweaks.player.stop();
    A.content.tweaks.posters.stop();
    A.content.tweaks.header.disable();
    A.content.tweaks.privacy.reset();
    A.content.tweaks.perf.reset();
    A.content.hotkeys.disable();
    A.content.ui.fab.reset();
    A.content.tweaks.badges.reset();
    A.content.tweaks.titles.reset();
    A.content.tweaks.profileFx.reset();
    A.content.tweaks.showcase.reset();
    A.content.tweaks.frames.reset();
    A.content.tweaks.chat.reset();
    A.content.tweaks.identity.reset();
    A.content.tweaks.collections.reset();
    A.content.tweaks.clan.reset();
    A.content.tweaks.supporter.reset();
    A.content.tweaks.unreachable.reset();
    A.content.userJs.reset();
    A.content.themeMode.destroy();
    A.content.themeFx.stop();
    A.content.styleInjector.remove();
    A.content.classes.reset();
    started = false;
  }

  return { start: start, shutdown: shutdown, applyAll: applyAll };
});

(function () {
  'use strict';
  if (typeof AONC === 'undefined' || !AONC.content || !AONC.content.bootstrap) return;
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.top !== window.self) return;
  AONC.content.bootstrap.start();
})();
