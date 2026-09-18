AONC.define('content.tweaks.privacy', function (A) {
  'use strict';

  var TRACKER_HOSTS = [
    'mc.yandex.ru', 'mc.yandex.com', 'an.yandex.ru', 'yastatic.net', 'ads.adfox.ru',
    'googletagmanager.com', 'google-analytics.com', 'analytics.google.com',
    'doubleclick.net', 'googleadservices.com', 'facebook.net', 'hotjar.com'
  ];

  var state = { injected: false, linkObserver: null, stripped: 0, config: null };

  function pageContextCode(cfg) {
    var hosts = TRACKER_HOSTS.filter(function (h) {
      if (cfg.blockYandex === false && /yandex|adfox|yastatic/.test(h)) return false;
      if (cfg.blockGoogle === false && /google|doubleclick/.test(h)) return false;
      if (cfg.blockAdNetworks === false && /facebook|hotjar/.test(h)) return false;
      return true;
    });

    return [
      '(function(){',
      '  var HOSTS = ' + JSON.stringify(hosts) + ';',
      '  function blocked(url){',
      '    try{ var u = String(url||""); if(!u) return false;',
      '      if(u.indexOf("data:")===0||u.indexOf("blob:")===0) return false;',
      '      for(var i=0;i<HOSTS.length;i++){ if(u.indexOf(HOSTS[i])!==-1) return true; }',
      '      return false;',
      '    }catch(e){ return false; }',
      '  }',
      '  var __aoncBlocked = 0;',
      '  var __aoncStats = { kinds: {}, hosts: {}, updated: 0 };',
      '  function aoncHost(u){ try{ return new URL(String(u), location.href).hostname.replace(/^www\\./, ""); }catch(e){ return "unknown"; } }',
      '  function aoncPrune(stats){',
      '    var keys = Object.keys(stats.hosts);',
      '    if(keys.length <= 24) return stats;',
      '    keys.sort(function(a, b){ return stats.hosts[b] - stats.hosts[a]; });',
      '    var next = {};',
      '    keys.slice(0, 18).forEach(function(k){ next[k] = stats.hosts[k]; });',
      '    stats.hosts = next;',
      '    return stats;',
      '  }',
      '  function aoncCount(kind, url){',
      '    __aoncBlocked++;',
      '    __aoncStats.kinds[kind] = (__aoncStats.kinds[kind] || 0) + 1;',
      '    var h = aoncHost(url);',
      '    __aoncStats.hosts[h] = (__aoncStats.hosts[h] || 0) + 1;',
      '    __aoncStats.updated = Date.now();',
      '    aoncPrune(__aoncStats);',
      '    try{',
      '      localStorage.setItem("aonc.blocked.total", String(__aoncBlocked));',
      '      localStorage.setItem("aonc.blocked.stats", JSON.stringify(__aoncStats));',
      '      window.dispatchEvent(new CustomEvent("aonc-tracker-blocked", { detail: { kind: kind, url: String(url || "").slice(0, 140), total: __aoncBlocked, stats: __aoncStats } }));',
      '    }catch(e){}',
      '  }',
      '  try{',
      '    __aoncBlocked = parseInt(localStorage.getItem("aonc.blocked.total") || "0", 10) || 0;',
      '    var stored = JSON.parse(localStorage.getItem("aonc.blocked.stats") || "null");',
      '    if(stored && stored.kinds && stored.hosts) __aoncStats = stored;',
      '  }catch(e){}',
      '  window.addEventListener("aonc-privacy-reset", function(){',
      '    __aoncBlocked = 0;',
      '    __aoncStats = { kinds: {}, hosts: {}, updated: Date.now() };',
      '    try{',
      '      localStorage.setItem("aonc.blocked.total", "0");',
      '      localStorage.setItem("aonc.blocked.stats", JSON.stringify(__aoncStats));',
      '    }catch(e){}',
      '  });',
      '  var noop = function(){};',
      '  try{ Object.defineProperty(window, "ym", { value: noop, writable: false, configurable: false }); }catch(e){ window.ym = noop; }',
      '  try{ Object.defineProperty(window, "gtag", { value: noop, writable: false, configurable: false }); }catch(e){ window.gtag = noop; }',
      '  try{',
      '    var dl = []; dl.push = noop;',
      '    Object.defineProperty(window, "dataLayer", { value: dl, writable: false, configurable: false });',
      '  }catch(e){}',
      '  try{',
      '    var beacon = navigator.sendBeacon ? navigator.sendBeacon.bind(navigator) : null;',
      '    if(beacon) navigator.sendBeacon = function(url, data){ if(blocked(url)){ aoncCount("beacon", url); return true; } return beacon(url, data); };',
      '  }catch(e){}',
      '  try{',
      '    var open = XMLHttpRequest.prototype.open;',
      '    XMLHttpRequest.prototype.open = function(method, url){',
      '      if(blocked(url)){ this.__aoncDrop = true; aoncCount("xhr", url); return; }',
      '      return open.apply(this, arguments);',
      '    };',
      '    var send = XMLHttpRequest.prototype.send;',
      '    XMLHttpRequest.prototype.send = function(){ if(this.__aoncDrop) return; return send.apply(this, arguments); };',
      '  }catch(e){}',
      '  try{',
      '    var fetchImpl = window.fetch;',
      '    if(fetchImpl) window.fetch = function(input, init){',
      '      var url = typeof input === "string" ? input : (input && input.url) || "";',
      '      if(blocked(url)){ aoncCount("fetch", url); return Promise.resolve(new Response(null, { status: 204 })); }',
      '      return fetchImpl.apply(this, arguments);',
      '    };',
      '  }catch(e){}',
      '  function sweep(){',
      '    var nodes = document.querySelectorAll("script[src], img[src], iframe[src], link[href]");',
      '    for(var i=0;i<nodes.length;i++){',
      '      var n = nodes[i];',
      '      var u = n.getAttribute("src") || n.getAttribute("href") || "";',
      '      if(blocked(u) && !n.hasAttribute("data-aonc-blocked")){',
      '        n.setAttribute("data-aonc-blocked","1"); aoncCount("tag", u);',
      '        if(n.tagName === "SCRIPT" || n.tagName === "IFRAME"){ if(n.parentNode) n.parentNode.removeChild(n); }',
      '        else { try{ n.removeAttribute("src"); n.removeAttribute("href"); }catch(e){} }',
      '      }',
      '    }',
      '  }',
      '  sweep();',
      '  try{ new MutationObserver(sweep).observe(document.documentElement, { childList: true, subtree: true }); }catch(e){}',
      '})();'
    ].join('\n');
  }

  function stripParams(list) {
    var names = A.css.pattern.splitList(list);
    if (!names.length) return 0;

    var count = 0;
    try {
      var url = new URL(location.href);
      var changed = false;
      names.forEach(function (name) {
        if (url.searchParams.has(name)) { url.searchParams.delete(name); changed = true; count++; }
      });
      if (changed) window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
    } catch (e) {}

    return count;
  }

  function cleanLinks(list) {
    var names = A.css.pattern.splitList(list);
    if (!names.length) return;

    var clean = function () {
      var links = document.querySelectorAll('a[href*="?"]');
      for (var i = 0; i < links.length; i++) {
        var link = links[i];
        if (link.getAttribute('data-aonc-clean')) continue;
        try {
          var url = new URL(link.href, location.href);
          var changed = false;
          names.forEach(function (name) {
            if (url.searchParams.has(name)) { url.searchParams.delete(name); changed = true; }
          });
          if (changed) {
            link.setAttribute('href', url.pathname + url.search + url.hash);
            state.stripped++;
          }
          link.setAttribute('data-aonc-clean', '1');
        } catch (e) {}
      }
    };

    clean();
    if (!state.linkObserver) {
      state.linkObserver = new MutationObserver(A.lang.throttle(clean, 800));
      state.linkObserver.observe(document.documentElement, { childList: true, subtree: true });
    }
  }

  var state2 = { count: 0, listener: null, stats: null };

  function readStoredCount() {
    try {
      return parseInt(localStorage.getItem('aonc.blocked.total') || '0', 10) || 0;
    } catch (e) {
      return 0;
    }
  }

  function readStoredStats() {
    try {
      var raw = JSON.parse(localStorage.getItem('aonc.blocked.stats') || 'null');
      if (raw && raw.kinds && raw.hosts) return raw;
    } catch (e) {}
    return { kinds: {}, hosts: {}, updated: 0 };
  }

  function startCounter() {
    if (state2.listener) return;
    state2.count = readStoredCount();
    state2.stats = readStoredStats();
    state2.listener = function (e) {
      var d = e.detail || {};
      state2.count = d.total || state2.count + 1;
      if (d.stats) state2.stats = d.stats;
    };
    window.addEventListener('aonc-tracker-blocked', state2.listener);
  }

  function stopCounter() {
    if (state2.listener) window.removeEventListener('aonc-tracker-blocked', state2.listener);
    state2.listener = null;
  }

  function getCount() {
    return state2.listener ? state2.count : readStoredCount();
  }

  function getStats() {
    var stats = state2.listener && state2.stats ? state2.stats : readStoredStats();
    return {
      total: getCount(),
      kinds: stats.kinds || {},
      hosts: stats.hosts || {},
      updated: stats.updated || 0
    };
  }

  function resetStats() {
    state2.count = 0;
    state2.stats = { kinds: {}, hosts: {}, updated: Date.now() };
    try {
      localStorage.setItem('aonc.blocked.total', '0');
      localStorage.setItem('aonc.blocked.stats', JSON.stringify(state2.stats));
    } catch (e) {}
    window.dispatchEvent(new CustomEvent('aonc-privacy-reset'));
    return getStats();
  }

  function apply(config) {
    var cfg = config.privacy || {};
    if (cfg.softBlock) startCounter();
    else stopCounter();
    state.config = cfg;

    if (cfg.softBlock) {
      if (!state.injected) {
        A.content.pageContext.run(pageContextCode(cfg), { bare: true });
        state.injected = true;
      }
    }

    if (cfg.stripUrlParams) {
      stripParams(cfg.stripParamsList);
      cleanLinks(cfg.stripParamsList);
    } else if (state.linkObserver) {
      try { state.linkObserver.disconnect(); } catch (e) {}
      state.linkObserver = null;
    }

    if (cfg.spoofReferrer) {
      A.content.pageContext.run(
        'try{Object.defineProperty(document,"referrer",{get:function(){return "";},configurable:true});}catch(e){}',
        { bare: true }
      );
    }
  }

  function reset() {
    if (state.linkObserver) { try { state.linkObserver.disconnect(); } catch (e) {} }
    state.linkObserver = null;
    state.injected = false;
    stopCounter();
  }

  return {
    apply: apply,
    reset: reset,
    getCount: getCount,
    getStats: getStats,
    resetStats: resetStats,
    TRACKER_HOSTS: TRACKER_HOSTS,
    pageContextCode: pageContextCode
  };
});
