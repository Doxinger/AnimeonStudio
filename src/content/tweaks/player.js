AONC.define('content.tweaks.player', function (A) {
  'use strict';

  var SEL = A.config.selectors.player;
  var VOL_KEY = 'aonc.player.volume';
  var RATE_KEY = 'aonc.player.rate';

  var state = {
    config: null,
    observer: null,
    boundVideos: new WeakSet(),
    boundFrames: new WeakSet(),
    messageHandler: null
  };

  function container() {
    return A.dom.ready.first(SEL.container);
  }

  function iframe() {
    return A.dom.ready.first(SEL.iframe);
  }

  function videos() {
    return A.dom.ready.queryAll('video');
  }

  function readStored(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw == null ? fallback : Number(raw);
    } catch (e) { return fallback; }
  }

  function storeValue(key, value) {
    try { localStorage.setItem(key, String(value)); } catch (e) {}
  }

  function applyToVideo(video) {
    var cfg = state.config;
    if (!cfg) return;

    if (cfg.rememberVolume) {
      var saved = readStored(VOL_KEY, -1);
      if (saved >= 0) {
        video.volume = A.lang.clamp(saved, 0, 1);
        video.muted = saved === 0;
      }
      if (!state.boundVideos.has(video)) {
        state.boundVideos.add(video);
        video.addEventListener('volumechange', function () {
          storeValue(VOL_KEY, video.muted ? 0 : video.volume);
        });
      }
    } else if (cfg.defaultVolume >= 0) {
      video.volume = A.lang.clamp(cfg.defaultVolume, 0, 100) / 100;
    }

    var rate = cfg.rememberRate ? readStored(RATE_KEY, cfg.playbackRate) : cfg.playbackRate;
    if (rate && rate > 0 && Math.abs(video.playbackRate - rate) > 0.01) {
      try { video.playbackRate = A.lang.clamp(rate, 0.25, 4); } catch (e) {}
    }

    if (!state.boundVideos.has(video)) {
      state.boundVideos.add(video);
      video.addEventListener('play', function () { A.content.classes.setRuntime('aonc-playing', true); });
      video.addEventListener('pause', function () { A.content.classes.setRuntime('aonc-playing', false); });
      video.addEventListener('ended', function () {
        A.content.classes.setRuntime('aonc-playing', false);
        if (state.config && state.config.autoplayNext) selectNextEpisode();
      });
      video.addEventListener('ratechange', function () {
        if (state.config && state.config.rememberRate) storeValue(RATE_KEY, video.playbackRate);
      });
    }
  }

  function bindFrame(frame) {
    if (!frame || state.boundFrames.has(frame)) return;
    state.boundFrames.add(frame);

    frame.addEventListener('load', function () {
      try {
        frame.contentWindow.postMessage({ __aoncPlayer: true, command: 'init', options: playerOptions() }, '*');
      } catch (e) {}
    });

    try {
      frame.contentWindow.postMessage({ __aoncPlayer: true, command: 'init', options: playerOptions() }, '*');
    } catch (e) {}
  }

  function playerOptions() {
    var cfg = state.config || {};
    return {
      volume: cfg.rememberVolume ? readStored(VOL_KEY, -1) : (cfg.defaultVolume >= 0 ? cfg.defaultVolume / 100 : -1),
      rate: cfg.rememberRate ? readStored(RATE_KEY, cfg.playbackRate) : cfg.playbackRate,
      quality: cfg.defaultQuality || '',
      hideBranding: !!cfg.hideKodikBranding,
      autoplayNext: !!cfg.autoplayNext,
      autoFullscreenLandscape: !!cfg.autoFullscreenLandscape
    };
  }

  function selectNextEpisode() {
    var buttons = A.dom.ready.queryAll(SEL.nextEpisode.join(', '));
    for (var i = 0; i < buttons.length; i++) {
      if (buttons[i].offsetParent !== null) { buttons[i].click(); return true; }
    }
    return false;
  }

  function onMessage(event) {
    var data = event.data;
    if (!data || data.__aoncPlayer !== true) return;

    if (data.event === 'ready' && event.source) {
      try {
        event.source.postMessage({ __aoncPlayer: true, command: 'init', options: playerOptions() }, '*');
      } catch (e) {}
    }
    if (data.event === 'playing') A.content.classes.setRuntime('aonc-playing', true);
    if (data.event === 'paused' || data.event === 'ended') A.content.classes.setRuntime('aonc-playing', false);
    if (data.event === 'ended' && state.config && state.config.autoplayNext) {
      A.content.ui.nextOverlay.show({ seconds: 10, onNext: selectNextEpisode });
    }
    if (data.event === 'volume' && typeof data.value === 'number') storeValue(VOL_KEY, data.value);
    if (data.event === 'rate' && typeof data.value === 'number') storeValue(RATE_KEY, data.value);
  }

  function scan() {
    videos().forEach(applyToVideo);
    var frames = A.dom.ready.queryAll(SEL.iframe.join(', '));
    frames.forEach(bindFrame);
  }

  function watch() {
    if (state.observer) return;
    state.observer = new MutationObserver(A.lang.throttle(scan, 400));
    state.observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  function apply(config) {
    state.config = config.player || {};
    if (!state.messageHandler) {
      state.messageHandler = onMessage;
      window.addEventListener('message', state.messageHandler);
    }
    watch();
    scan();
  }

  function toggleTheater() {
    var on = !document.documentElement.classList.contains('aonc-theater');
    document.documentElement.classList.toggle('aonc-theater', on);
    return on;
  }

  function toggleCinema() {
    var on = !document.documentElement.classList.contains('aonc-cinema');
    document.documentElement.classList.toggle('aonc-cinema', on);
    return on;
  }

  function toggleMaxPlayer() {
    var on = !A.content.classes.getRuntime('aonc-maxplayer');
    A.content.classes.setRuntime('aonc-maxplayer', on);
    return on;
  }

  function stop() {
    if (state.observer) { try { state.observer.disconnect(); } catch (e) {} state.observer = null; }
    if (state.messageHandler) window.removeEventListener('message', state.messageHandler);
    state.messageHandler = null;
    A.content.classes.setRuntime('aonc-playing', false);
  }

  return {
    apply: apply,
    stop: stop,
    scan: scan,
    container: container,
    iframe: iframe,
    toggleTheater: toggleTheater,
    toggleCinema: toggleCinema,
    toggleMaxPlayer: toggleMaxPlayer,
    selectNextEpisode: selectNextEpisode
  };
});
