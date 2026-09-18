AONC.define('config.defaults.wallpaper', function () {
  return {
    enabled: false,
    source: 'preset',
    preset: 'aurora',
    url: '',
    dataUrl: '',
    size: 'cover',
    position: 'center',
    repeat: 'no-repeat',
    attachment: 'fixed',
    overlay: 45,
    blur: 0,
    saturate: 100,
    vignette: 0,
    showThrough: true,
    parallax: false,
    parallaxStrength: 30,
    drift: false,
    driftSpeed: 60,
    rules: []
  };
});
