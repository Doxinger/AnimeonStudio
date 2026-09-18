(function (root) {
  'use strict';

  var AONC = (root.AONC = root.AONC || {});

  AONC.NAME = 'AnimeOn Studio';
  AONC.VERSION = '1.1.1';
  AONC.HOST = 'animeon.cc';

  // JSON с версией релиза для проверки обновлений (без автоустановки).
  // Переопределяется настройкой meta.updateUrl.
  AONC.DEFAULT_UPDATE_URL = 'https://raw.githubusercontent.com/Doxinger/AnimeonStudio/main/update-check.json';

  AONC.HOSTS = ['animeon.cc', 'v1.animeon.co', 'v2.animeon.co'];
  AONC.PRIMARY_HOST = 'animeon.cc';

  AONC.isSiteHost = function (hostname) {
    var h = String(hostname || '').toLowerCase().replace(/\.$/, '');
    if (!h) return false;
    for (var i = 0; i < AONC.HOSTS.length; i++) {
      var site = AONC.HOSTS[i];
      if (h === site || h.slice(-(site.length + 1)) === '.' + site) return true;
    }
    return false;
  };

  AONC.isSiteUrl = function (url) {
    try {
      return AONC.isSiteHost(new URL(url).hostname);
    } catch (e) {
      return false;
    }
  };

  AONC.siteUrl = function (path) {
    return 'https://' + AONC.PRIMARY_HOST + (path || '/');
  };

  AONC.STORAGE_KEY = 'aonc.config.v1';
  AONC.PROFILES_KEY = 'aonc.profiles.v1';
  AONC.STATE_KEY = 'aonc.state.v1';
  AONC.PAGE_CSS_KEY = '__aonc_css';

  AONC.STYLE_ID = 'aonc-style';
  AONC.BOOT_STYLE_ID = 'aonc-style-boot';

  AONC.__modules = AONC.__modules || [];

  AONC.define = function (path, factory) {
    var parts = String(path).split('.');
    var node = AONC;
    for (var i = 0; i < parts.length - 1; i++) {
      node[parts[i]] = node[parts[i]] || {};
      node = node[parts[i]];
    }
    var leaf = parts[parts.length - 1];
    node[leaf] = typeof factory === 'function' ? factory(AONC) : factory;
    AONC.__modules.push(path);
    return node[leaf];
  };

  AONC.use = function (path) {
    return String(path).split('.').reduce(function (n, k) {
      return n == null ? n : n[k];
    }, AONC);
  };

  AONC.isServiceWorker =
    typeof root.document === 'undefined' && typeof root.importScripts === 'function';

  AONC.isDocument = typeof root.document !== 'undefined';
})(typeof globalThis !== 'undefined' ? globalThis : this);
