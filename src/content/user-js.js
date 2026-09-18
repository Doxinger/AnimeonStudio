AONC.define('content.userJs', function (A) {
  'use strict';

  var pattern = A.css.pattern;
  var state = { ranIsolated: new Set(), ranPage: new Set(), signature: '' };

  function activeSnippets(list, url) {
    return (list || [])
      .filter(function (s) { return s && s.enabled && String(s.body || '').trim(); })
      .filter(function (s) { return pattern.matchesAny(url, s.urlPatterns); });
  }

  function signatureOf(config, url) {
    var c = config.custom || {};
    return [
      c.js || '',
      c.jsPageContext ? 1 : 0,
      activeSnippets(c.jsSnippets, url).map(function (s) { return s.id + ':' + s.body; }).join('|')
    ].join('#');
  }

  function runIsolated(code, label) {
    var key = 'i:' + label;
    if (state.ranIsolated.has(key)) return false;
    state.ranIsolated.add(key);
    try {
      var fn = new Function('AONC', 'config', '"use strict";\n' + code);
      fn(A, A.content.config.current());
    } catch (e) {
      console.error('[AnimeOn Studio] custom JS error (' + label + '):', e);
      A.content.toast.error('Ошибка в вашем JS (' + label + '): ' + e.message);
    }
    return true;
  }

  function runPage(code, label) {
    var key = 'p:' + label;
    if (state.ranPage.has(key)) return false;
    state.ranPage.add(key);
    A.content.pageContext.run(code, { bare: false });
    return true;
  }

  function apply(config, options) {
    var opts = options || {};
    var custom = config.custom || {};
    var url = location.pathname + location.search;
    var sig = signatureOf(config, url);

    if (!opts.force && sig === state.signature) return { ran: 0 };
    var firstRun = state.signature === '';
    state.signature = sig;

    if (!firstRun && !opts.force) return { ran: 0 };

    var usePage = !!custom.jsPageContext;
    var ran = 0;
    var snippets = activeSnippets(custom.jsSnippets, url);

    if (custom.js && String(custom.js).trim()) {
      if (usePage) { if (runPage(custom.js, 'main')) ran++; }
      else if (runIsolated(custom.js, 'main')) ran++;
    }

    snippets.forEach(function (s) {
      var label = s.name || s.id;
      if (usePage) { if (runPage(s.body, label)) ran++; }
      else if (runIsolated(s.body, label)) ran++;
    });

    return { ran: ran, snippets: snippets.length, pageContext: usePage };
  }

  function reset() {
    state.ranIsolated.clear();
    state.ranPage.clear();
    state.signature = '';
  }

  return { apply: apply, reset: reset, activeSnippets: activeSnippets };
});
