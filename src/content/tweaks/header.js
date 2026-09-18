AONC.define('content.tweaks.header', function (A) {
  'use strict';

  var state = { enabled: false, handler: null, hidden: false, lastY: 0, threshold: 120 };

  function header() {
    return A.dom.ready.first(A.config.selectors.structure.header);
  }

  function setHidden(hidden) {
    if (state.hidden === hidden) return;
    state.hidden = hidden;
    var el = header();
    if (el) {
      el.style.transform = hidden ? 'translateY(-105%)' : '';
      el.style.transition = 'transform .22s ease';
    }
    document.documentElement.classList.toggle('aonc-header-away', hidden);
  }

  function onScroll() {
    var y = window.scrollY || window.pageYOffset || 0;
    var delta = y - state.lastY;
    state.lastY = y;

    if (y < state.threshold) { setHidden(false); return; }
    if (delta > 8) setHidden(true);
    else if (delta < -8) setHidden(false);
  }

  function enable() {
    if (state.enabled) return;
    state.enabled = true;
    state.handler = A.lang.throttle(onScroll, 60);
    window.addEventListener('scroll', state.handler, { passive: true });
    onScroll();
  }

  function disable() {
    if (!state.enabled) return;
    state.enabled = false;
    if (state.handler) window.removeEventListener('scroll', state.handler);
    state.handler = null;
    setHidden(false);
  }

  function apply(config) {
    if (config.glass && config.glass.headerHideOnScroll) enable();
    else disable();
  }

  return { apply: apply, enable: enable, disable: disable };
});
