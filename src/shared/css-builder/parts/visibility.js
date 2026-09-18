AONC.define('cssBuilder.visibility', function (A) {
  'use strict';

  var VIS = A.config.selectors.visibility;

  function resolve(def) {
    var selectors = [];
    (def.selectors || []).forEach(function (s) {
      if (!s) return;
      if (def.scope === 'section' && s.indexOf(':has(') === -1 && s.charAt(0) !== '[') {
        selectors.push('section:has(' + s + ')');
      }
      selectors.push(s);
    });
    return selectors;
  }

  function build(ctx) {
    var vis = ctx.config.visibility;
    var groups = [];
    var out = [];

    Object.keys(VIS).forEach(function (key) {
      if (!vis[key]) return;
      var def = VIS[key];
      resolve(def).forEach(function (s) { groups.push({ key: key, selector: s, label: def.label, extraCss: def.extraCss || null }); });
    });

    if (!groups.length) return '';

    out.push('/* Hidden sections */');

    var bySelector = {};
    groups.forEach(function (g) {
      (bySelector[g.selector] = bySelector[g.selector] || []).push(g);
    });

    Object.keys(bySelector).forEach(function (sel) {
      var list = bySelector[sel];
      var body = ['  display: none !important;'];
      var seen = {};
      list.forEach(function (g) {
        Object.keys(g.extraCss || {}).forEach(function (prop) {
          if (seen[prop]) return;
          seen[prop] = true;
          body.push('  ' + prop + ': ' + g.extraCss[prop] + ' !important;');
        });
      });
      out.push(sel + ' {\n' + body.join('\n') + '\n}');
    });

    ctx.hiddenCount = groups.length;
    return out.join('\n\n');
  }

  function listHidden(vis) {
    return Object.keys(VIS).filter(function (k) { return !!vis[k]; })
      .map(function (k) { return { key: k, label: VIS[k].label }; });
  }

  return { build: build, listHidden: listHidden, resolve: resolve, VIS: VIS };
});
