AONC.define('content.toast', function (A) {
  'use strict';

  var CSS = [
    '.stack{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);',
    'display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none;z-index:1;}',
    '.t{pointer-events:auto;background:rgba(20,20,26,.94);border:1px solid var(--line);',
    'border-left:3px solid var(--accent);border-radius:10px;padding:9px 14px;',
    'color:var(--fg);font-size:13px;max-width:min(80vw,460px);',
    'box-shadow:0 12px 34px rgba(0,0,0,.5);backdrop-filter:blur(8px);',
    'opacity:0;transform:translateY(10px) scale(.97);transition:all .18s ease;}',
    '.t.on{opacity:1;transform:none;}',
    '.t.err{border-left-color:#ff5c5c;}',
    '.t.ok{border-left-color:#3ddc84;}'
  ].join('\n');

  var host = null;
  var stack = null;

  function ensure() {
    if (host && host.host.isConnected) return;
    host = A.content.ui.shadowHost.create({ name: 'toast', css: CSS, accent: '#7C4DFF' });
    stack = A.content.ui.shadowHost.el('div', { class: 'stack' });
    host.container.appendChild(stack);
  }

  function show(message, options) {
    var opts = options || {};
    ensure();

    var node = A.content.ui.shadowHost.el('div', {
      class: 't' + (opts.kind ? ' ' + opts.kind : ''),
      text: String(message == null ? '' : message)
    });

    stack.appendChild(node);
    requestAnimationFrame(function () { node.classList.add('on'); });

    var life = opts.duration || 2200;
    setTimeout(function () {
      node.classList.remove('on');
      setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 220);
    }, life);

    while (stack.children.length > 4) stack.removeChild(stack.firstChild);
  }

  function error(message) { show(message, { kind: 'err', duration: 4200 }); }
  function ok(message) { show(message, { kind: 'ok' }); }

  return { show: show, error: error, ok: ok };
});
