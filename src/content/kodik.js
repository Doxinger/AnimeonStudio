AONC.define('content.kodik', function (A) {
  'use strict';

  var VOL_KEY = 'aonc.player.volume';
  var RATE_KEY = 'aonc.player.rate';
  var STYLE_ID = 'aonc-kodik-style';

  var state = { options: {}, video: null, observer: null, styleEl: null, ready: false };

  function readStored(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw == null ? fallback : Number(raw);
    } catch (e) { return fallback; }
  }

  function post(event, value) {
    try {
      parent.postMessage({ __aoncPlayer: true, event: event, value: value }, '*');
    } catch (e) {}
  }

  function ensureStyle() {
    if (state.styleEl && state.styleEl.isConnected) return state.styleEl;
    var el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = '';
    (document.head || document.documentElement).appendChild(el);
    state.styleEl = el;
    return el;
  }

  function cssFor(opts) {
    var out = [];
    if (opts.hideBranding) {
      out.push('[class*="logo"],[class*="brand"],[id*="logo"],[id*="brand"]{opacity:0!important;pointer-events:none!important}');
      out.push('a[href*="kodik"],a[target="_blank"][rel*="noopener"]{opacity:0!important;pointer-events:none!important}');
    }
    if (opts.squareControls) {
      out.push('[class*="controls"]{border-radius:0!important}');
    }
    if (opts.uiScale && opts.uiScale !== 100) {
      out.push('html{font-size:' + (16 * opts.uiScale / 100).toFixed(2) + 'px!important}');
    }
    return out.join('\n');
  }

  function applyOptions(opts) {
    state.options = Object.assign({}, state.options, opts || {});
    ensureStyle().textContent = cssFor(state.options);

    if (state.video) bindVideo(state.video);
  }

  function bindVideo(video) {
    if (!video) return;
    state.video = video;

    var vol = state.options.volume;
    if (vol == null || vol < 0) vol = readStored(VOL_KEY, -1);
    if (vol >= 0) {
      try {
        video.volume = A.lang.clamp(vol, 0, 1);
        video.muted = vol === 0;
      } catch (e) {}
    }

    var rate = state.options.rate;
    if (!rate || rate <= 0) rate = readStored(RATE_KEY, 0);
    if (rate > 0 && Math.abs(video.playbackRate - rate) > 0.01) {
      try { video.playbackRate = A.lang.clamp(rate, 0.25, 4); } catch (e) {}
    }

    if (video.__aoncBound) return;
    video.__aoncBound = true;

    video.addEventListener('play', function () { post('playing'); });
    video.addEventListener('pause', function () { post('paused'); });
    video.addEventListener('ended', function () { post('ended'); });
    video.addEventListener('volumechange', function () {
      var value = video.muted ? 0 : video.volume;
      try { localStorage.setItem(VOL_KEY, String(value)); } catch (e) {}
      post('volume', value);
    });
    video.addEventListener('ratechange', function () {
      try { localStorage.setItem(RATE_KEY, String(video.playbackRate)); } catch (e) {}
      post('rate', video.playbackRate);
    });
  }

  function selectQuality(preferred) {
    if (!preferred) return false;
    var nodes = document.querySelectorAll('[class*="quality"] *, button, [role="menuitem"], li');
    for (var i = 0; i < nodes.length; i++) {
      var text = (nodes[i].textContent || '').trim();
      if (text === preferred || text === preferred.replace('p', '') + 'p') {
        try { nodes[i].click(); return true; } catch (e) {}
      }
    }
    return false;
  }

  function scan() {
    var videos = document.querySelectorAll('video');
    for (var i = 0; i < videos.length; i++) bindVideo(videos[i]);
  }

  function watch() {
    if (state.observer) return;
    state.observer = new MutationObserver(A.lang.throttle(function () {
      scan();
    }, 400));
    state.observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  function onMessage(event) {
    var data = event.data;
    if (!data || data.__aoncPlayer !== true) return;
    if (data.command === 'init') applyOptions(data.options || {});
    if (data.command === 'quality') selectQuality(data.value);
    if (data.command === 'rate' && state.video) {
      try { state.video.playbackRate = A.lang.clamp(data.value, 0.25, 4); } catch (e) {}
    }
    if (data.command === 'volume' && state.video) {
      try {
        state.video.volume = A.lang.clamp(data.value, 0, 1);
        state.video.muted = data.value === 0;
      } catch (e) {}
    }
  }

  function start() {
    if (state.ready) return;
    state.ready = true;
    window.addEventListener('message', onMessage);
    watch();
    scan();
    post('ready');

    var tries = 0;
    var timer = setInterval(function () {
      tries++;
      scan();
      if (state.options.quality) selectQuality(state.options.quality);
      if (tries > 20) clearInterval(timer);
    }, 500);
  }

  return { start: start, applyOptions: applyOptions, scan: scan };
});

(function () {
  'use strict';
  if (typeof AONC === 'undefined' || !AONC.content || !AONC.content.kodik) return;
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  AONC.content.kodik.start();
})();
