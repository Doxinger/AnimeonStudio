AONC.define('config.defaults.cosmetics', function () {
  return {
    enabled: false,
    placement: 'badges',
    badges: [],
    titlesOn: false,
    titles: [],
    framesOn: false,
    framesPlacement: 'profile',
    framesMode: 'single',
    framesMinSize: 56,
    framesHideSite: true,
    frames: [],
    showcaseOn: false,
    showcaseOnlyMine: true,
    showcaseTitle: 'Витрина постеров',
    showcaseNames: true,
    showcaseWidth: 150,
    showcase: [],
    loadouts: []
  };
});

AONC.define('config.defaults.badge', function () {
  return {
    id: '',
    text: '',
    color: '#EC4899',
    icon: 'star',
    glow: true,
    gradient: true,
    num: '',
    enabled: true
  };
});
