AONC.define('content.ui.nextOverlay', function (A) {
  'use strict';

  var CSS = [
    '.wrap{position:fixed;right:22px;bottom:22px;z-index:2147483634;display:none;',
    'background:rgba(16,16,22,.94);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.14);',
    'border-radius:16px;box-shadow:0 24px 60px rgba(0,0,0,.6);padding:14px 16px;width:280px;',
    'font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#f1f1f4;pointer-events:auto;}',
    '.wrap.on{display:block;}',
    '.t{font-size:13px;font-weight:700;margin-bottom:4px;}',
    '.s{font-size:11.5px;color:#9a9aa8;margin-bottom:10px;}',
    '.bar{height:4px;border-radius:99px;background:rgba(255,255,255,.12);overflow:hidden;margin-bottom:11px;}',
    '.bar i{display:block;height:100%;background:linear-gradient(90deg,#7C4DFF,#ff4d9d);width:100%;',
    'transition:width 1s linear;}',
    '.row{display:flex;gap:8px;}',
    '.b{flex:1;border:1px solid rgba(255,255,255,.14);background:#22222c;color:#e6e6ee;border-radius:10px;',
    'padding:8px 10px;font:inherit;font-size:12px;font-weight:600;cursor:pointer;}',
    '.b.primary{background:linear-gradient(135deg,#7C4DFF,#ff4d9d);border-color:transparent;color:#fff;}'
  ].join('\n');

  var host = null;
  var wrap = null;
  var barFill = null;
  var timer = null;
  var seconds = 10;

  function ensure() {
    if (host && host.host.isConnected) return;
    host = A.content.ui.shadowHost.create({ name: 'next-overlay', css: CSS, zIndex: 2147483634 });
    var el = A.content.ui.shadowHost.el;
    wrap = el('div', { class: 'wrap' });
    wrap.appendChild(el('div', { class: 't', text: 'Серия закончилась' }));
    wrap.appendChild(el('div', { class: 's', text: 'Следующая серия начнётся автоматически' }));
    var bar = el('div', { class: 'bar' });
    barFill = el('i');
    bar.appendChild(barFill);
    wrap.appendChild(bar);
    wrap.appendChild(el('div', { class: 'row' }, [
      el('button', { class: 'b', text: 'Отмена', onclick: function () { hide(); } }),
      el('button', { class: 'b primary', text: 'Следующая сейчас', onclick: function () {
        hide();
        if (typeof currentNext === 'function') currentNext();
      } })
    ]));
    host.container.appendChild(wrap);
  }

  var currentNext = null;

  function show(options) {
    var opts = options || {};
    seconds = opts.seconds == null ? 10 : opts.seconds;
    currentNext = opts.onNext || null;
    ensure();
    wrap.classList.add('on');
    barFill.style.width = '100%';
    setTimeout(function () { barFill.style.width = '0%'; }, 60);

    if (timer) clearInterval(timer);
    var left = seconds;
    timer = setInterval(function () {
      left--;
      if (left <= 0) {
        hide();
        if (typeof currentNext === 'function') currentNext();
      }
    }, 1000);
  }

  function hide() {
    if (timer) clearInterval(timer);
    timer = null;
    if (wrap) wrap.classList.remove('on');
  }

  function visible() {
    return !!(wrap && wrap.classList.contains('on'));
  }

  return { show: show, hide: hide, visible: visible };
});
