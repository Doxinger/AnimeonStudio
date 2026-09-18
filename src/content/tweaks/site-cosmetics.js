AONC.define('content.tweaks.siteCosmetics', function (A) {
  'use strict';

  var RATE_MARK = 'data-aonc-rate';
  var PREM_MARK = 'data-aonc-prem';

  var state = {
    ratings: false,
    hidePremium: false,
    observer: null,
    timer: null,
    started: false
  };

  function gradeColor(value) {
    if (value >= 8) return '#3ddc84';
    if (value >= 7) return '#a3e635';
    if (value >= 6) return '#ffb84d';
    if (value >= 5) return '#ff9b6b';
    return '#ff6b6b';
  }

  function paintRatings() {
    var stars = document.querySelectorAll('svg[class*="lucide-star"]');
    for (var i = 0; i < stars.length; i++) {
      var svg = stars[i];
      var badge = svg.closest('div');
      if (!badge || badge.hasAttribute(RATE_MARK)) continue;
      var match = (badge.textContent || '').match(/\d\.\d{1,2}/);
      badge.setAttribute(RATE_MARK, '1');
      if (!match) continue;
      var color = gradeColor(parseFloat(match[0]));
      svg.style.color = color;
      svg.style.fill = color;
      badge.style.color = color;
      badge.title = 'Оценка ' + match[0] + ' (цвет по градации AnimeOn Studio)';
    }
  }

  function clearRatings() {
    var marked = document.querySelectorAll('[' + RATE_MARK + ']');
    for (var i = 0; i < marked.length; i++) {
      var el = marked[i];
      el.removeAttribute(RATE_MARK);
      el.style.removeProperty('color');
      el.style.removeProperty('fill');
      el.removeAttribute('title');
      var star = el.querySelector('svg[class*="lucide-star"]');
      if (star) {
        star.style.removeProperty('color');
        star.style.removeProperty('fill');
      }
    }
  }

  function hidePremiumBanner() {
    if (location.pathname.indexOf('/user/') !== 0) return;
    var candidates = document.querySelectorAll('div.min-h-screen div');
    for (var i = 0; i < candidates.length; i++) {
      var el = candidates[i];
      if (el.hasAttribute(PREM_MARK)) continue;
      var text = (el.textContent || '').trim();
      if (!text || text.length > 90) continue;
      if (text.toLowerCase().indexOf('premium активен') === -1) continue;
      if (el.closest('header, footer, nav, [data-aonc-ui]')) continue;
      var panel = el;
      var guard = 0;
      while (panel && panel.parentElement && guard++ < 5) {
        if (panel.parentElement.matches('.container, .container.mx-auto, main, body')) break;
        panel = panel.parentElement;
      }
      panel.setAttribute(PREM_MARK, '1');
      panel.style.setProperty('display', 'none', 'important');
    }
  }

  function clearPremium() {
    var marked = document.querySelectorAll('[' + PREM_MARK + ']');
    for (var i = 0; i < marked.length; i++) {
      marked[i].removeAttribute(PREM_MARK);
      marked[i].style.removeProperty('display');
    }
  }

  var throttled = A.lang.throttle(function () {
    if (state.ratings) paintRatings();
    if (state.hidePremium) hidePremiumBanner();
  }, 400);

  function start() {
    if (state.started) return;
    state.started = true;
    state.observer = A.dom.ready.observe(document.documentElement, function () { throttled(); });
    state.timer = setInterval(throttled, 1500);
  }

  function stop() {
    if (state.observer) {
      try { state.observer.disconnect(); } catch (e) {}
      state.observer = null;
    }
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    state.started = false;
  }

  function apply(config) {
    var l = config.layout || {};
    state.ratings = !!l.ratingColors;
    state.hidePremium = !!l.pfHidePremium;

    if (!state.ratings) clearRatings();
    if (!state.hidePremium) clearPremium();

    if (!state.ratings && !state.hidePremium) {
      stop();
      return;
    }
    start();
    throttled();
  }

  function reset() {
    stop();
    clearRatings();
    clearPremium();
    state.ratings = false;
    state.hidePremium = false;
  }

  return { apply: apply, reset: reset, gradeColor: gradeColor };
});
