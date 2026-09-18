AONC.define('content.router', function (A) {
  'use strict';

  var listeners = [];
  var lastUrl = '';
  var timer = null;
  var titleObserver = null;
  var winHandlers = null;

  function currentUrl() {
    try {
      return location.pathname + location.search + location.hash;
    } catch (e) {
      return lastUrl;
    }
  }

  function emit(reason) {
    var url = currentUrl();
    if (url === lastUrl) return false;
    var previous = lastUrl;
    lastUrl = url;
    listeners.slice().forEach(function (fn) {
      try { fn({ url: url, previous: previous, reason: reason }); } catch (e) {}
    });
    return true;
  }

  function start() {
    lastUrl = currentUrl();

    // Именованные обработчики: повторный start не должен плодить дубли,
    // а stop — оставлять их висеть на window до конца жизни страницы.
    if (!winHandlers) {
      winHandlers = {
        popstate: function () { emit('popstate'); },
        hashchange: function () { emit('hashchange'); }
      };
      window.addEventListener('popstate', winHandlers.popstate);
      window.addEventListener('hashchange', winHandlers.hashchange);
    }

    if (timer) clearInterval(timer);
    timer = setInterval(function () { emit('poll'); }, 400);

    if (!titleObserver && typeof MutationObserver !== 'undefined' && document.documentElement) {
      titleObserver = new MutationObserver(function () { emit('title'); });
      titleObserver.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    }
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    if (titleObserver) { try { titleObserver.disconnect(); } catch (e) {} titleObserver = null; }
    if (winHandlers) {
      window.removeEventListener('popstate', winHandlers.popstate);
      window.removeEventListener('hashchange', winHandlers.hashchange);
      winHandlers = null;
    }
  }

  function onChange(fn) {
    listeners.push(fn);
    return function () {
      listeners = listeners.filter(function (f) { return f !== fn; });
    };
  }

  function isWatchPage(url) {
    var u = url || currentUrl();
    return /^\/anime\//.test(u);
  }

  function isCatalogPage(url) {
    var u = url || currentUrl();
    return /^\/catalog/.test(u) || /^\/collections/.test(u);
  }

  function isHomePage(url) {
    var u = url || currentUrl();
    return u === '/' || u.indexOf('?') === 0;
  }

  return {
    start: start,
    stop: stop,
    onChange: onChange,
    emit: emit,
    currentUrl: currentUrl,
    isWatchPage: isWatchPage,
    isCatalogPage: isCatalogPage,
    isHomePage: isHomePage
  };
});
