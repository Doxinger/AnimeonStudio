AONC.define('ui.icons', function (A) {
  'use strict';

  var DATA = A.ui.iconsData || {};

  var SECTION_MAP = {
    theme: 'palette',
    typography: 'type',
    glass: 'layers',
    layout: 'layout-grid',
    player: 'monitor-play',
    visibility: 'eye-off',
    elements: 'mouse-pointer-click',
    custom: 'code',
    performance: 'gauge',
    privacy: 'shield',
    profiles: 'folder-heart',
    favorites: 'star',
    help: 'book-open'
  };

  function has(name) {
    return !!DATA[name];
  }

  function svgMarkup(name, size, cls) {
    var inner = DATA[name];
    if (!inner) return '';
    var s = size || 16;
    return '<svg class="ic-svg ' + (cls || '') + '" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      inner + '</svg>';
  }

  function el(name, size, cls) {
    var markup = svgMarkup(name, size, cls);
    if (!markup) return null;
    var span = document.createElement('span');
    span.className = 'ic-wrap ' + (cls || '');
    span.innerHTML = markup;
    return span;
  }

  function sectionIcon(sectionId, fallbackChar, size) {
    var name = SECTION_MAP[sectionId];
    if (name && has(name)) return el(name, size || 16, 'ic-section');
    var span = document.createElement('span');
    span.className = 'ic-wrap ic-fallback';
    span.textContent = fallbackChar || '•';
    return span;
  }

  function buttonIcon(name, size) {
    return el(name, size || 14, 'ic-btn');
  }

  return {
    has: has,
    el: el,
    svgMarkup: svgMarkup,
    sectionIcon: sectionIcon,
    buttonIcon: buttonIcon,
    SECTION_MAP: SECTION_MAP,
    names: function () { return Object.keys(DATA); }
  };
});
