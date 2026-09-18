AONC.define('color.palette', function (A) {
  'use strict';

  var conv = A.color.convert;
  var tr = A.color.transform;
  var ct = A.color.contrast;

  function surfaces(bg) {
    var dark = ct.isDark(bg);
    var step = dark ? 0.055 : 0.05;
    return {
      bg: bg,
      card: dark ? tr.lighten(bg, step) : tr.darken(bg, step * 0.7),
      elevated: dark ? tr.lighten(bg, step * 2) : tr.darken(bg, step * 1.6),
      muted: dark ? tr.lighten(bg, step * 1.4) : tr.darken(bg, step * 1.1),
      border: dark ? conv.rgba('#ffffff', 0.09) : conv.rgba('#000000', 0.11),
      borderSoft: dark ? conv.rgba('#ffffff', 0.055) : conv.rgba('#000000', 0.07),
      borderStrong: dark ? conv.rgba('#ffffff', 0.16) : conv.rgba('#000000', 0.2),
      fg: dark ? '#f6f6f8' : '#131317',
      fgDim: dark ? '#a2a2ad' : '#5d5d68',
      fgFaint: dark ? '#6f6f7a' : '#8b8b95'
    };
  }

  function accentRamp(accent, bg) {
    var dark = ct.isDark(bg);
    var base = conv.sanitize(accent, '#7C4DFF');
    var usable = dark
      ? ct.ratio(base, bg) < 3 ? tr.lighten(base, 0.16) : base
      : ct.ratio(base, bg) < 3 ? tr.darken(base, 0.16) : base;
    return {
      base: base,
      usable: usable,
      hover: dark ? tr.lighten(usable, 0.1) : tr.darken(usable, 0.1),
      active: dark ? tr.darken(usable, 0.08) : tr.lighten(usable, 0.08),
      foreground: ct.readableOn(usable),
      soft: conv.rgba(usable, dark ? 0.16 : 0.12),
      softer: conv.rgba(usable, dark ? 0.09 : 0.07),
      glow: conv.rgba(usable, 0.35),
      ring: conv.rgba(usable, 0.6)
    };
  }

  function chartRamp(accent) {
    var base = conv.sanitize(accent, '#7C4DFF');
    return [
      base,
      tr.rotate(base, 40),
      tr.rotate(base, 90),
      tr.rotate(base, 180),
      tr.rotate(base, 270)
    ].map(function (c) { return tr.saturate(c, 0.9); });
  }

  function fromTheme(theme) {
    var bg = conv.sanitize(theme.background, '#0A0A0B');
    var s = surfaces(bg);
    var a = accentRamp(theme.accent, bg);
    var surface = theme.surface ? conv.sanitize(theme.surface, s.card) : s.card;
    var dark = ct.isDark(bg);

    return {
      dark: dark,
      background: bg,
      foreground: conv.sanitize(theme.foreground || s.fg, s.fg),
      card: surface,
      cardForeground: conv.sanitize(theme.foreground || s.fg, s.fg),
      popover: surface,
      popoverForeground: conv.sanitize(theme.foreground || s.fg, s.fg),
      primary: a.usable,
      primaryForeground: a.foreground,
      secondary: conv.sanitize(theme.surfaceAlt || s.muted, s.muted),
      secondaryForeground: s.fg,
      muted: conv.sanitize(theme.surfaceAlt || s.muted, s.muted),
      mutedForeground: conv.sanitize(theme.mutedForeground || s.fgDim, s.fgDim),
      accent: a.usable,
      accentForeground: a.foreground,
      destructive: conv.sanitize(theme.destructive || (dark ? '#f0524f' : '#d4383a'), '#f0524f'),
      destructiveForeground: '#ffffff',
      border: conv.isValid(theme.border) && /rgba?\(/.test(theme.border) ? theme.border : s.border,
      input: s.border,
      ring: a.ring,
      sidebar: dark ? tr.lighten(bg, 0.035) : tr.darken(bg, 0.02),
      sidebarForeground: s.fg,
      sidebarPrimary: a.usable,
      sidebarPrimaryForeground: a.foreground,
      sidebarAccent: a.usable,
      sidebarAccentForeground: a.foreground,
      sidebarBorder: s.border,
      sidebarRing: a.ring,
      charts: chartRamp(theme.accent),
      accentRamp: a,
      surfaceRamp: s
    };
  }

  return {
    surfaces: surfaces,
    accentRamp: accentRamp,
    chartRamp: chartRamp,
    fromTheme: fromTheme
  };
});
