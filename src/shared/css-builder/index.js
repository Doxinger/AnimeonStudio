AONC.define('cssBuilder', function (A) {
  'use strict';

  var partsApi = A.cssBuilder || {};

  var PARTS = [
    { id: 'tokens', fn: A.cssBuilder.tokens },
    { id: 'base', fn: A.cssBuilder.base },
    { id: 'wallpaper', fn: A.cssBuilder.wallpaper },
    { id: 'typography', fn: A.cssBuilder.typography },
    { id: 'density', fn: A.cssBuilder.density },
    { id: 'glass', fn: A.cssBuilder.glass },
    { id: 'layout', fn: A.cssBuilder.layout },
    { id: 'motion', fn: A.cssBuilder.motion },
    { id: 'media', fn: A.cssBuilder.media },
    { id: 'player', fn: A.cssBuilder.player },
    { id: 'chat', fn: A.cssBuilder.chat },
    { id: 'visibility', fn: A.cssBuilder.visibility },
    { id: 'elements', fn: A.cssBuilder.elements },
    { id: 'cosmetics', fn: A.cssBuilder.cosmetics },
    { id: 'polish', fn: A.cssBuilder.polish },
    { id: 'userCss', fn: A.cssBuilder.userCss }
  ];

  function header(config, url) {
    return [
      '/* ' + A.NAME + ' v' + A.VERSION + ' — generated, do not edit by hand */',
      '/* preset: ' + (config.theme.preset || 'custom') + ' | mode: ' + config.theme.mode + ' */',
      '/* url: ' + url + ' */'
    ].join('\n');
  }

  function makeContext(config, url) {
    return {
      config: config,
      url: url || '',
      palette: A.color.palette.fromTheme(config.theme || {}),
      hiddenCount: 0,
      activeRuleCount: 0,
      mediaHints: {},
      errors: []
    };
  }

  function buildParts(config, url) {
    var ctx = makeContext(config, url);
    var sections = [];

    PARTS.forEach(function (part) {
      try {
        var css = part.fn.build(ctx);
        sections.push({ id: part.id, css: css || '' });
      } catch (e) {
        ctx.errors.push({ part: part.id, message: String(e && e.message || e) });
        sections.push({ id: part.id, css: '', error: String(e && e.message || e) });
      }
    });

    return { ctx: ctx, sections: sections };
  }

  function hoistImports(css) {
    var imports = [];
    var rest = css.replace(/^[ \t]*@import[^\n]*;[ \t]*$/gm, function (m) {
      imports.push(m.trim());
      return '';
    });
    if (!imports.length) return css;
    return imports.join('\n') + '\n' + rest.replace(/^\n+/, '');
  }

  function build(config, url) {
    var normalized = A.config.normalize ? A.config.normalize.normalizeConfig(config) : config;
    if (!normalized.meta.enabled) return { css: '', ctx: makeContext(normalized, url), sections: [] };

    var result = buildParts(normalized, url);
    var body = result.sections.map(function (s) { return s.css; }).filter(Boolean).join('\n\n');
    var css = body ? hoistImports(header(normalized, url) + '\n' + body) + '\n' : '';

    return {
      css: css,
      ctx: result.ctx,
      sections: result.sections,
      palette: result.ctx.palette,
      stats: {
        bytes: css.length,
        hidden: result.ctx.hiddenCount,
        rules: result.ctx.activeRuleCount,
        errors: result.ctx.errors
      }
    };
  }

  function buildCssOnly(config, url) {
    return build(config, url).css;
  }

  function buildSection(config, url, partId) {
    var result = buildParts(config, url);
    var found = result.sections.filter(function (s) { return s.id === partId; })[0];
    return found ? found.css : '';
  }

  function previewPalette(config) {
    if (!config.theme.overrideTokens) return null;
    return A.color.palette.fromTheme(config.theme);
  }

  return Object.assign({}, partsApi, {
    PARTS: PARTS,
    build: build,
    buildCssOnly: buildCssOnly,
    buildSection: buildSection,
    previewPalette: previewPalette,
    makeContext: makeContext
  });
});
