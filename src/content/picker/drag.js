AONC.define('content.picker.drag', function (A) {
  'use strict';

  var armed = null;
  var dragging = false;
  var pointerId = null;
  var start = { x: 0, y: 0 };
  var base = { dx: 0, dy: 0 };
  var offs = [];
  var endedAt = 0;
  var cursorStyle = null;

  function ensureCursor() {
    if (cursorStyle && cursorStyle.parentNode) return;
    cursorStyle = document.createElement('style');
    cursorStyle.id = 'aonc-drag-cursor';
    cursorStyle.setAttribute('data-aonc', '1');
    cursorStyle.textContent =
      'html.aonc-dragging, html.aonc-dragging * { cursor: grabbing !important; }' +
      '[data-aonc-drag], [data-aonc-drag] * { cursor: grab !important; }';
    (document.head || document.documentElement).appendChild(cursorStyle);
  }

  function dropCursor() {
    document.documentElement.classList.remove('aonc-dragging');
    if (cursorStyle && cursorStyle.parentNode) cursorStyle.parentNode.removeChild(cursorStyle);
    cursorStyle = null;
  }

  function onPointerDown(event) {
    if (!armed || dragging) return;
    var el = armed.el;
    if (event.target !== el && !(el.contains && el.contains(event.target))) return;
    event.preventDefault();
    event.stopPropagation();
    dragging = true;
    pointerId = event.pointerId;
    start.x = event.clientX || 0;
    start.y = event.clientY || 0;
    base = armed.getBase() || { dx: 0, dy: 0 };
    document.documentElement.classList.add('aonc-dragging');
    ensureCursor();
    try { if (pointerId != null && el.setPointerCapture) el.setPointerCapture(pointerId); } catch (e) {}
  }

  function onPointerMove(event) {
    if (!dragging || !armed) return;
    event.preventDefault();
    event.stopPropagation();
    var dx = Math.round(base.dx + ((event.clientX || 0) - start.x));
    var dy = Math.round(base.dy + ((event.clientY || 0) - start.y));
    armed.onChange(dx, dy);
    A.content.picker.overlay.highlight(armed.el);
  }

  function onPointerUp(event) {
    if (!dragging) return;
    if (event) { event.preventDefault(); event.stopPropagation(); }
    finish(false);
  }

  function detach() {
    offs.forEach(function (off) { try { off(); } catch (e) {} });
    offs = [];
  }

  function attach() {
    offs = [
      A.dom.ready.onEvent(window, 'pointerdown', onPointerDown, true),
      A.dom.ready.onEvent(window, 'pointermove', onPointerMove, true),
      A.dom.ready.onEvent(window, 'pointerup', onPointerUp, true),
      A.dom.ready.onEvent(window, 'pointercancel', onPointerUp, true)
    ];
  }

  function finish(revert) {
    if (!armed) return;
    var el = armed.el;
    var done = armed.onEnd;
    if (revert) armed.onChange(base.dx, base.dy);
    dragging = false;
    armed = null;
    endedAt = Date.now();
    detach();
    try { if (pointerId != null && el.releasePointerCapture) el.releasePointerCapture(pointerId); } catch (e) {}
    pointerId = null;
    dropCursor();
    if (el) {
      el.removeAttribute('data-aonc-drag');
      if (el.style) el.style.cursor = '';
      A.content.picker.overlay.highlight(el);
    }
    if (done) done();
  }

  function begin(el, opts) {
    if (!el) return false;
    if (armed) finish(true);
    armed = {
      el: el,
      getBase: opts.getBase || function () { return { dx: 0, dy: 0 }; },
      onChange: opts.onChange || function () {},
      onEnd: opts.onEnd || null
    };
    base = armed.getBase() || { dx: 0, dy: 0 };
    el.setAttribute('data-aonc-drag', '1');
    ensureCursor();
    attach();
    return true;
  }

  function cancel() {
    if (armed) finish(true);
  }

  function active() {
    return !!armed;
  }

  function recent(ms) {
    return !!endedAt && (Date.now() - endedAt) < (ms == null ? 300 : ms);
  }

  function destroy() {
    if (armed) {
      var el = armed.el;
      armed = null;
      dragging = false;
      detach();
      dropCursor();
      if (el) {
        el.removeAttribute('data-aonc-drag');
        if (el.style) el.style.cursor = '';
      }
    }
  }

  return { begin: begin, cancel: cancel, active: active, recent: recent, destroy: destroy };
});
