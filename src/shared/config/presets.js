AONC.define('config.presets', function (A) {
  'use strict';

  var tr = A.color.transform;

  function preset(id, name, group, values) {
    return Object.assign({ id: id, name: name, group: group }, values);
  }

  var LIST = [
    preset('original', 'Как на сайте', 'original', {
      mode: 'dark',
      overrideTokens: false,
      accent: '#7C4DFF',
      background: '#0A0A0B',
      radius: 12
    }),

    preset('midnight', 'Midnight', 'dark', {
      mode: 'dark', accent: '#6C8CFF', background: '#0B1020',
      surface: '#121A2E', surfaceAlt: '#1A2440', foreground: '#E8ECF8',
      mutedForeground: '#93A0C4', border: 'rgba(140,165,255,0.14)', radius: 14
    }),

    preset('amoled', 'AMOLED Black', 'dark', {
      mode: 'dark', accent: '#8B5CF6', background: '#000000',
      surface: '#0A0A0A', surfaceAlt: '#141414', foreground: '#F2F2F2',
      mutedForeground: '#8A8A8A', border: 'rgba(255,255,255,0.10)', radius: 10
    }),

    preset('graphite', 'Graphite', 'dark', {
      mode: 'dark', accent: '#E4E4E7', background: '#17181A',
      surface: '#1F2124', surfaceAlt: '#282B2F', foreground: '#EDEDEF',
      mutedForeground: '#9A9CA1', border: 'rgba(255,255,255,0.09)', radius: 8
    }),

    preset('nord', 'Nord', 'dark', {
      mode: 'dark', accent: '#88C0D0', background: '#2E3440',
      surface: '#3B4252', surfaceAlt: '#434C5E', foreground: '#ECEFF4',
      mutedForeground: '#A7B0C0', border: 'rgba(216,222,233,0.12)', radius: 12
    }),

    preset('dracula', 'Dracula', 'dark', {
      mode: 'dark', accent: '#BD93F9', background: '#282A36',
      surface: '#343746', surfaceAlt: '#3E4155', foreground: '#F8F8F2',
      mutedForeground: '#9AA0B4', border: 'rgba(248,248,242,0.12)', radius: 12
    }),

    preset('catppuccin', 'Catppuccin Mocha', 'dark', {
      mode: 'dark', accent: '#CBA6F7', background: '#1E1E2E',
      surface: '#28283A', surfaceAlt: '#313244', foreground: '#CDD6F4',
      mutedForeground: '#9399B2', border: 'rgba(205,214,244,0.12)', radius: 14
    }),

    preset('gruvbox', 'Gruvbox', 'dark', {
      mode: 'dark', accent: '#FABD2F', background: '#282828',
      surface: '#32302F', surfaceAlt: '#3C3836', foreground: '#EBDBB2',
      mutedForeground: '#A89984', border: 'rgba(235,219,178,0.14)', radius: 10
    }),

    preset('matrix', 'Matrix', 'dark', {
      mode: 'dark', accent: '#00E676', background: '#04120A',
      surface: '#08200F', surfaceAlt: '#0D2C16', foreground: '#C9FFD9',
      mutedForeground: '#5FA87A', border: 'rgba(0,230,118,0.18)', radius: 6
    }),

    preset('sakura', 'Sakura', 'dark', {
      mode: 'dark', accent: '#FF8FAB', background: '#1A1015',
      surface: '#251720', surfaceAlt: '#311E2A', foreground: '#FBEFF3',
      mutedForeground: '#B99AA7', border: 'rgba(255,143,171,0.16)', radius: 18
    }),

    preset('sunset', 'Sunset', 'dark', {
      mode: 'dark', accent: '#FF7A45', background: '#1B100C',
      surface: '#271712', surfaceAlt: '#341E17', foreground: '#FCEDE6',
      mutedForeground: '#BFA093', border: 'rgba(255,122,69,0.16)', radius: 14
    }),

    preset('ocean', 'Ocean', 'dark', {
      mode: 'dark', accent: '#22D3EE', background: '#071A1F',
      surface: '#0C262C', surfaceAlt: '#12333B', foreground: '#E4FBFF',
      mutedForeground: '#8FB6BF', border: 'rgba(34,211,238,0.16)', radius: 14
    }),

    preset('lavender', 'Lavender', 'dark', {
      mode: 'dark', accent: '#A78BFA', background: '#14111F',
      surface: '#1D1930', surfaceAlt: '#272140', foreground: '#F1EEFF',
      mutedForeground: '#A79FC6', border: 'rgba(167,139,250,0.16)', radius: 20
    }),

    preset('espresso', 'Espresso', 'dark', {
      mode: 'dark', accent: '#D4A373', background: '#191412',
      surface: '#231C19', surfaceAlt: '#2E2521', foreground: '#F3E9E1',
      mutedForeground: '#B49C8C', border: 'rgba(212,163,115,0.16)', radius: 12
    }),

    preset('paper', 'Paper (светлая)', 'light', {
      mode: 'light', accent: '#6D28D9', background: '#FAFAF8',
      surface: '#FFFFFF', surfaceAlt: '#F1F0EC', foreground: '#1A1A1C',
      mutedForeground: '#6B6B72', border: 'rgba(0,0,0,0.10)', radius: 12
    }),

    preset('sand', 'Sand (светлая)', 'light', {
      mode: 'light', accent: '#B45309', background: '#FBF7EF',
      surface: '#FFFFFF', surfaceAlt: '#F3EBDD', foreground: '#26201A',
      mutedForeground: '#7A6E5F', border: 'rgba(0,0,0,0.09)', radius: 14
    }),

    preset('mint', 'Mint (светлая)', 'light', {
      mode: 'light', accent: '#0D9488', background: '#F3FAF7',
      surface: '#FFFFFF', surfaceAlt: '#E6F2ED', foreground: '#12211D',
      mutedForeground: '#5F7A72', border: 'rgba(0,0,0,0.09)', radius: 16
    })
  ];

  var byId = {};
  LIST.forEach(function (p) { byId[p.id] = p; });

  var GROUPS = [
    { id: 'original', label: 'Оригинал' },
    { id: 'dark', label: 'Тёмные' },
    { id: 'light', label: 'Светлые' }
  ];

  function get(id) {
    return byId[id] || byId.original;
  }

  function themePatch(id) {
    var p = get(id);
    var out = {};
    ['mode', 'overrideTokens', 'accent', 'background', 'surface', 'surfaceAlt',
      'foreground', 'mutedForeground', 'border', 'destructive', 'radius', 'radiusCards',
      'saturation', 'autoContrast'].forEach(function (k) {
      if (p[k] !== undefined) out[k] = p[k];
    });
    return out;
  }

  function accentVariants(base) {
    var b = A.color.convert.sanitize(base, '#7C4DFF');
    return [
      { name: 'Оригинал', value: b },
      { name: 'Светлее', value: tr.lighten(b, 0.18) },
      { name: 'Темнее', value: tr.darken(b, 0.18) },
      { name: 'Насыщеннее', value: tr.saturate(b, 1.35) },
      { name: 'Мягче', value: tr.saturate(b, 0.6) },
      { name: '+40°', value: tr.rotate(b, 40) },
      { name: '−40°', value: tr.rotate(b, -40) },
      { name: '+180°', value: tr.rotate(b, 180) }
    ];
  }

  function groups() {
    return GROUPS.map(function (g) {
      return { id: g.id, label: g.label, presets: LIST.filter(function (p) { return p.group === g.id; }) };
    });
  }

  return {
    LIST: LIST,
    GROUPS: GROUPS,
    byId: byId,
    get: get,
    themePatch: themePatch,
    accentVariants: accentVariants,
    groups: groups
  };
});
