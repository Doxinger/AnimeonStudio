AONC.define('config.fonts', function () {
  'use strict';

  var STACKS = [
    { id: '', name: 'Шрифт сайта (по умолчанию)', value: '' },
    { id: 'system', name: 'Системный', value: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
    { id: 'inter', name: 'Inter', value: '"Inter", system-ui, sans-serif' },
    { id: 'roboto', name: 'Roboto', value: 'Roboto, "Helvetica Neue", Arial, sans-serif' },
    { id: 'manrope', name: 'Manrope', value: 'Manrope, system-ui, sans-serif' },
    { id: 'montserrat', name: 'Montserrat', value: 'Montserrat, system-ui, sans-serif' },
    { id: 'ubuntu', name: 'Ubuntu', value: 'Ubuntu, system-ui, sans-serif' },
    { id: 'ptsans', name: 'PT Sans', value: '"PT Sans", system-ui, sans-serif' },
    { id: 'georgia', name: 'Georgia (засечки)', value: 'Georgia, "Times New Roman", serif' },
    { id: 'merriweather', name: 'Merriweather', value: 'Merriweather, Georgia, serif' },
    { id: 'mono', name: 'Моноширинный', value: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace' },
    { id: 'jetbrains', name: 'JetBrains Mono', value: '"JetBrains Mono", ui-monospace, monospace' },
    { id: 'comic', name: 'Comic Sans MS', value: '"Comic Sans MS", "Comic Neue", cursive' },
    { id: 'impact', name: 'Impact', value: 'Impact, Haettenschweiler, "Arial Black", sans-serif' }
  ];

  var GOOGLE_FONTS = [
    'Inter', 'Roboto', 'Manrope', 'Montserrat', 'Open Sans', 'PT Sans', 'Rubik',
    'Nunito', 'Ubuntu', 'IBM Plex Sans', 'JetBrains Mono', 'Fira Code', 'Merriweather',
    'Playfair Display', 'Oswald', 'Raleway', 'Source Sans 3', 'Space Grotesk', 'Unbounded', 'Golos Text'
  ];

  function importUrl(family) {
    if (!family) return '';
    var clean = String(family).trim().replace(/\s+/g, '+');
    return 'https://fonts.googleapis.com/css2?family=' + clean + ':wght@300;400;500;600;700;800;900&display=swap';
  }

  function quote(family) {
    var f = String(family || '').trim();
    if (!f) return '';
    return /\s/.test(f) ? '"' + f + '"' : f;
  }

  function stackFor(family) {
    var q = quote(family);
    if (!q) return '';
    return q + ', system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  }

  return {
    STACKS: STACKS,
    GOOGLE_FONTS: GOOGLE_FONTS,
    importUrl: importUrl,
    quote: quote,
    stackFor: stackFor
  };
});
