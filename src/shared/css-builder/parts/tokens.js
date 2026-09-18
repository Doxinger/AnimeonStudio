AONC.define('cssBuilder.tokens', function (A) {
  'use strict';

  var palette = A.color.palette;
  var conv = A.color.convert;
  var tr = A.color.transform;
  var ct = A.color.contrast;

  function tokenBlock(p, theme) {
    var radius = Math.max(0, A.lang.num(theme.radius, 12));
    var out = [];

    function v(name, value) {
      if (value != null && value !== '') out.push('  ' + name + ': ' + value + ';');
    }

    v('--background', p.background);
    v('--foreground', p.foreground);
    v('--card', p.card);
    v('--card-foreground', p.cardForeground);
    v('--popover', p.popover);
    v('--popover-foreground', p.popoverForeground);
    v('--primary', p.primary);
    v('--primary-foreground', p.primaryForeground);
    v('--secondary', p.secondary);
    v('--secondary-foreground', p.secondaryForeground);
    v('--muted', p.muted);
    v('--muted-foreground', p.mutedForeground);
    v('--accent', p.accent);
    v('--accent-foreground', p.accentForeground);
    v('--destructive', p.destructive);
    v('--destructive-foreground', p.destructiveForeground);
    v('--border', p.border);
    v('--input', p.input);
    v('--ring', p.ring);
    v('--radius', radius + 'px');

    v('--sidebar', p.sidebar);
    v('--sidebar-foreground', p.sidebarForeground);
    v('--sidebar-primary', p.sidebarPrimary);
    v('--sidebar-primary-foreground', p.sidebarPrimaryForeground);
    v('--sidebar-accent', p.sidebarAccent);
    v('--sidebar-accent-foreground', p.sidebarAccentForeground);
    v('--sidebar-border', p.sidebarBorder);
    v('--sidebar-ring', p.sidebarRing);

    p.charts.forEach(function (c, i) { v('--chart-' + (i + 1), c); });

    v('--aonc-bg', p.background);
    v('--aonc-surface', p.card);
    v('--aonc-elevated', p.elevated || p.card);
    v('--aonc-accent', p.primary);
    v('--aonc-accent-soft', p.accentRamp.soft);
    v('--aonc-accent-glow', p.accentRamp.glow);
    v('--aonc-border', p.border);
    v('--aonc-fg', p.foreground);
    v('--aonc-fg-dim', p.mutedForeground);
    v('--aonc-radius', radius + 'px');

    if (theme.radiusCards >= 0) {
      v('--aonc-radius-card', Math.max(0, theme.radiusCards) + 'px');
    } else {
      v('--aonc-radius-card', Math.max(0, radius) + 'px');
    }

    return out.join('\n');
  }

  function build(ctx) {
    var theme = ctx.config.theme;
    if (!theme.overrideTokens) return '';

    var p = palette.fromTheme(theme);

    if (theme.saturation !== 100) {
      var f = A.lang.clamp(theme.saturation, 0, 200) / 100;
      p.primary = tr.saturate(p.primary, f);
      p.accent = p.primary;
      p.accentRamp = palette.accentRamp(p.primary, p.background);
      p.charts = p.charts.map(function (c) { return tr.saturate(c, f); });
    }

    if (theme.autoContrast) {
      p.foreground = ct.ensureContrast(p.foreground, p.background, 12);
      p.mutedForeground = ct.ensureContrast(p.mutedForeground, p.background, 4.5);
      p.primary = ct.ensureContrast(p.primary, p.background, 3);
      p.primaryForeground = ct.readableOn(p.primary);
    }

    ctx.palette = p;

    var w = new A.css.writer.Writer();
    w.section('Theme tokens');

    if (theme.mode === 'auto') {
      var lightTheme = Object.assign({}, theme, {
        background: theme.lightBackground || '#F7F7F8',
        surface: theme.lightSurface || '#FFFFFF',
        surfaceAlt: theme.lightSurfaceAlt || '#EDEDF0',
        foreground: theme.lightForeground || '#161618',
        mutedForeground: theme.lightMuted || '#63636B',
        border: 'rgba(0,0,0,0.10)'
      });
      w.rule(':root', tokenBlock(palette.fromTheme(lightTheme), lightTheme));
      w.rule('html.dark', tokenBlock(p, theme));
    } else {
      w.rule(':root, html.dark', tokenBlock(p, theme));
    }

    var scheme = theme.mode === 'light' ? 'light' : theme.mode === 'auto' ? 'light dark' : 'dark';
    w.rule('html', '  color-scheme: ' + scheme + ' !important;');

    return w.toString();
  }

  return { build: build, tokenBlock: tokenBlock, conv: conv };
});
