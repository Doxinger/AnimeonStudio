AONC.define('config.loadouts', function (A) {
  'use strict';

  function snapshotCosmetics(config) {
    var c = config.cosmetics || {};
    return {
      enabled: !!c.enabled,
      titlesOn: !!c.titlesOn,
      framesOn: !!c.framesOn,
      badges: A.lang.clone(c.badges || []),
      titles: A.lang.clone(c.titles || []),
      frames: A.lang.clone(c.frames || [])
    };
  }

  function make(config, name) {
    return A.lang.normalize(A.config.defaults.loadout, {
      id: A.lang.uid('loadout'),
      name: name || 'Комплект',
      createdAt: Date.now(),
      cosmetics: snapshotCosmetics(config)
    });
  }

  function applyTo(config, loadout) {
    var next = A.lang.clone(config);
    var c = loadout.cosmetics || {};
    next.cosmetics = next.cosmetics || {};
    next.cosmetics.enabled = !!c.enabled;
    next.cosmetics.titlesOn = !!c.titlesOn;
    next.cosmetics.framesOn = !!c.framesOn;
    next.cosmetics.badges = A.lang.clone(c.badges || []);
    next.cosmetics.titles = A.lang.clone(c.titles || []);
    next.cosmetics.frames = A.lang.clone(c.frames || []);
    next.meta = next.meta || {};
    next.meta.activeLoadout = loadout.id;
    return next;
  }

  function nextOf(config) {
    var list = (config.cosmetics && config.cosmetics.loadouts) || [];
    if (!list.length) return null;
    var current = config.meta && config.meta.activeLoadout;
    var idx = list.map(function (l) { return l.id; }).indexOf(current);
    return list[(idx + 1) % list.length];
  }

  return { snapshotCosmetics: snapshotCosmetics, make: make, applyTo: applyTo, nextOf: nextOf };
});
