AONC.define('content.picker.overlay', function (A) {
  'use strict';

  var CSS = [
    '.box{position:fixed;pointer-events:none;border:2px solid var(--accent);',
    'background:rgba(124,77,255,.10);border-radius:4px;transition:all .06s linear;',
    'box-shadow:0 0 0 1px rgba(0,0,0,.5),0 0 22px rgba(124,77,255,.35);display:none;}',
    '.box.on{display:block;}',
    '.tag{position:fixed;pointer-events:none;display:none;background:var(--accent);color:#fff;',
    'font-size:11px;font-weight:600;padding:3px 7px;border-radius:5px;white-space:nowrap;',
    'max-width:70vw;overflow:hidden;text-overflow:ellipsis;box-shadow:0 4px 14px rgba(0,0,0,.5);',
    'font-family:ui-monospace,SFMono-Regular,Menlo,monospace;}',
    '.tag.on{display:block;}',
    '.dim{position:fixed;inset:0;pointer-events:none;background:rgba(0,0,0,.42);display:none;}',
    '.dim.on{display:block;}'
  ].join('\n');

  var host = null;
  var box = null;
  var tag = null;
  var dim = null;

  function ensure() {
    if (host && host.host.isConnected) return;
    host = A.content.ui.shadowHost.create({ name: 'picker-overlay', css: CSS });
    var h = A.content.ui.shadowHost.el;
    dim = h('div', { class: 'dim' });
    box = h('div', { class: 'box' });
    tag = h('div', { class: 'tag' });
    host.container.appendChild(dim);
    host.container.appendChild(box);
    host.container.appendChild(tag);
  }

  function highlight(el, label) {
    ensure();
    if (!el || el === document.documentElement || el === document.body) {
      clear();
      return;
    }
    var r = el.getBoundingClientRect();
    if (!r.width && !r.height) { clear(); return; }

    box.classList.add('on');
    box.style.top = r.top + 'px';
    box.style.left = r.left + 'px';
    box.style.width = r.width + 'px';
    box.style.height = r.height + 'px';

    tag.classList.add('on');
    tag.textContent = label || el.tagName.toLowerCase();
    var tagTop = r.top - 26;
    if (tagTop < 4) tagTop = r.top + 4;
    tag.style.top = tagTop + 'px';
    tag.style.left = Math.max(4, r.left) + 'px';
  }

  function clear() {
    if (!box) return;
    box.classList.remove('on');
    tag.classList.remove('on');
  }

  function setDim(on) {
    if (!on && !dim) return; // гасить нечего — не создаём хост впустую
    ensure();
    dim.classList.toggle('on', !!on);
  }

  function destroy() {
    clear();
    if (host) { host.remove(); host = null; }
    box = tag = dim = null;
  }

  return { highlight: highlight, clear: clear, setDim: setDim, destroy: destroy, ensure: ensure };
});
