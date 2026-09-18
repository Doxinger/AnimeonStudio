AONC.define('content.catalogSync', function (A) {
  'use strict';

  var inflight = null;
  // Сторож: если фон не отвечает (завис fetch, мёртвый контекст), inflight
  // не должен навсегда блокировать повторные попытки обновления каталога.
  var watchdogMs = 25000;

  function setWatchdogMs(ms) {
    watchdogMs = ms > 0 ? ms : 25000;
  }

  function host() {
    try {
      return location.protocol + '//' + location.host;
    } catch (e) {
      return '';
    }
  }

  function sync(force) {
    if (inflight) return inflight;
    var settled = false;
    var watchdog = setTimeout(function () {
      if (settled) return;
      settled = true;
      if (inflight === promise) inflight = null;
    }, watchdogMs);
    var promise = A.api.sendMessage(A.messaging.msg(A.messaging.TYPE.CATALOG_GET, { host: host(), force: !!force }))
      .then(function (res) {
        if (settled) return null;
        var value = A.messaging.unwrap(res);
        if (value && value.count) A.config.framesLib.setRemote(value);
        if (value && value.titles && value.titles.length) {
          A.config.titlesLib.setRemote({ items: value.titles, at: value.at });
        }
        return value || null;
      })
      .catch(function () { return null; })
      .then(function (value) {
        if (!settled) {
          settled = true;
          clearTimeout(watchdog);
        }
        if (inflight === promise) inflight = null;
        return value;
      });
    inflight = promise;
    return promise;
  }

  return { sync: sync, host: host, setWatchdogMs: setWatchdogMs };
});
