AONC.define('ui.studioTheme', function (A) {
  'use strict';

  function apply(config) {
    if (typeof document === 'undefined') return;
    var t = config.theme || {};
    var accent = t.accent && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(t.accent)) ? String(t.accent) : '#7C4DFF';
    var root = document.documentElement;

    root.style.setProperty('--accent', accent);
    root.style.setProperty('--accent2', A.color.transform.lighten(accent, 0.18));
    root.style.setProperty('--accent-glow', A.color.convert.rgba(accent, 0.22));
    root.classList.toggle('studio-light', t.mode === 'light');
  }

  return { apply: apply };
});
