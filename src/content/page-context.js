AONC.define('content.pageContext', function (A) {
  'use strict';

  var counter = 0;
  var executed = [];

  function nonce() {
    return A.content.styleInjector.readNonce();
  }

  function run(code, options) {
    var opts = options || {};
    if (!code || !String(code).trim()) return null;

    var id = 'aonc-pc-' + (++counter);
    var el = document.createElement('script');
    el.id = id;
    el.setAttribute('data-aonc', '1');

    var n = nonce();
    if (n) el.setAttribute('nonce', n);

    var wrapped = opts.bare
      ? String(code)
      : '(function(){try{\n' + String(code) + '\n}catch(e){console.error("[AnimeOn Studio]",e);}})();';

    el.textContent = wrapped;

    var parent = opts.parent || document.head || document.documentElement;
    if (!parent) return null;

    parent.appendChild(el);
    if (el.parentNode) el.parentNode.removeChild(el);

    executed.push(id);
    if (executed.length > 200) executed.shift();
    return id;
  }

  function runDeferred(code, options) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { run(code, options); }, { once: true });
      return null;
    }
    return run(code, options);
  }

  function count() { return executed.length; }

  return { run: run, runDeferred: runDeferred, count: count, nonce: nonce };
});
