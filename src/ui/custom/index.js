AONC.define('ui.custom', function (A) {
  'use strict';

  var parts = A.ui.custom || {};

  function wrap(name) {
    return function (def, ctx) {
      var mod = parts[name];
      if (!mod || typeof mod.render !== 'function') {
        throw new Error('ui.custom.' + name + ' не зарегистрирован');
      }
      return mod.render(def, ctx);
    };
  }

  var agg = {
    presetGrid: wrap('presetGrid'),
    ruleList: wrap('ruleList'),
    snippetList: wrap('snippetList'),
    profileList: wrap('profileList'),
    contrast: wrap('contrast'),
    wallpaperInfo: wrap('wallpaperInfo'),
    myThemes: wrap('myThemes'),
    favoritesList: wrap('favoritesList'),
    featureCatalog: wrap('featureCatalog'),
    badgeEditor: wrap('badgeEditor'),
    framesPreview: parts.framesPreview,
    framesList: wrap('framesList'),
    framesPicker: wrap('framesPicker'),
    framesEditor: wrap('framesEditor'),
    titlesPicker: wrap('titlesPicker'),
    titlesEditor: wrap('titlesEditor'),
    cosmeticsHub: wrap('cosmeticsHub'),
    updatesBox: wrap('updatesBox'),
    profileFxEditor: wrap('profileFxEditor'),
    showcaseEditor: wrap('showcaseEditor'),
    loadoutsEditor: wrap('loadoutsEditor'),
    wallpaperGrid: wrap('wallpaperGrid'),
    wallpaperRules: wrap('wallpaperRules'),
    cssPreview: wrap('cssPreview'),
    diagnostics: wrap('diagnostics'),
    privacyDash: wrap('privacyDash'),
    historyList: wrap('historyList'),
    mirrorStatus: wrap('mirrorStatus')
  };

  function delegate(target, methods) {
    methods.forEach(function (m) {
      if (parts[target] && typeof parts[target][m] === 'function') {
        agg[target][m] = function () {
          return parts[target][m].apply(parts[target], arguments);
        };
      }
    });
  }

  delegate('cssPreview', ['refresh', 'currentCss']);
  delegate('contrast', ['paint']);
  delegate('ruleList', ['rules', 'persist']);
  delegate('snippetList', ['list', 'persist', 'pathFor']);
  delegate('profileList', ['fmtDate']);
  delegate('presetGrid', ['swatchStyle', 'miniPreview']);
  delegate('privacyDash', ['paint']);
  delegate('wallpaperInfo', ['fmtBytes', 'currentSource']);
  delegate('myThemes', ['list', 'persist', 'snapshot', 'swatchStyle']);
  delegate('wallpaperRules', ['rules', 'persist']);
  delegate('framesList', ['list', 'persist', 'describe']);
  delegate('framesPicker', ['paint', 'select']);
  delegate('historyList', ['apply']);

  agg.parts = parts;

  return agg;
});
