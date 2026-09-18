AONC.define('config.defaults.wallpaperRule', function () {
  return {
    id: '',
    name: '',
    urlPatterns: [],
    enabled: true,
    source: 'preset',
    preset: 'grid',
    url: '',
    size: 'auto',
    position: 'center',
    repeat: 'repeat',
    attachment: 'fixed',
    overlay: 30,
    blur: 0,
    saturate: 100,
    vignette: 0,
    showThrough: true
  };
});
