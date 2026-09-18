AONC.define('ui.sections', function (A) {
  'use strict';

  var existing = A.ui.sections || {};
  var s = existing;

  var ORDER = ['theme', 'typography', 'glass', 'layout', 'player', 'chat', 'visibility', 'elements', 'custom', 'features', 'performance', 'privacy', 'profiles', 'cosmetics', 'favorites', 'help'];

  function all() {
    return ORDER.map(function (id) { return s[id]; }).filter(Boolean);
  }

  function byId(id) {
    return s[id] || null;
  }

  function nav() {
    return all().map(function (sec) {
      return { id: sec.id, label: sec.label, icon: sec.icon };
    });
  }

  return Object.assign({}, existing, { ORDER: ORDER, all: all, byId: byId, nav: nav });
});
