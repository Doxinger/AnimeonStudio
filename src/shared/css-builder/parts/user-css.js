AONC.define('cssBuilder.userCss', function (A) {
  'use strict';

  var pattern = A.css.pattern;

  function sanitizeCss(text) {
    var s = String(text == null ? '' : text);
    if (!s.trim()) return '';
    var cleaned = s.replace(/<\/\s*style/gi, '<\\/style');
    return cleaned;
  }

  function wrapSnippets(snippets, url) {
    return (snippets || [])
      .filter(function (s) { return s && s.enabled && String(s.body || '').trim(); })
      .filter(function (s) { return pattern.matchesAny(url, s.urlPatterns); })
      .map(function (s) {
        return '/* snippet: ' + (s.name || s.id || 'untitled') + ' */\n' + sanitizeCss(s.body);
      });
  }

  function build(ctx) {
    var custom = ctx.config.custom || {};
    var out = [];

    if (custom.fontsCss && String(custom.fontsCss).trim()) {
      out.push('/* Font faces */\n' + sanitizeCss(custom.fontsCss));
    }

    var scoped = wrapSnippets(custom.cssSnippets, ctx.url);
    if (scoped.length) out.push('/* Per-URL CSS */\n' + scoped.join('\n\n'));

    if (custom.css && String(custom.css).trim()) {
      out.push('/* Custom CSS */\n' + sanitizeCss(custom.css));
    }

    return out.join('\n\n');
  }

  return { build: build, sanitizeCss: sanitizeCss, wrapSnippets: wrapSnippets };
});
