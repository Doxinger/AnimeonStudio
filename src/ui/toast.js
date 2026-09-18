AONC.define('ui.toast', function (A) {
  'use strict';

  var host = null;

  function ensure() {
    if (host && host.isConnected) return host;
    host = document.createElement('div');
    host.id = 'aonc-toasts';
    document.body.appendChild(host);
    return host;
  }

  function show(message, kind, duration) {
    var root = ensure();
    var node = document.createElement('div');
    node.className = 'toast ' + (kind || '');
    node.textContent = message;
    root.appendChild(node);
    requestAnimationFrame(function () { node.classList.add('on'); });

    setTimeout(function () {
      node.classList.remove('on');
      setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 240);
    }, duration || 2400);

    while (root.children.length > 4) root.removeChild(root.firstChild);
  }

  function ok(m) { show(m, 'ok'); }
  function error(m) { show(m, 'err', 4600); }
  function info(m) { show(m, '', 2600); }

  return { show: show, ok: ok, error: error, info: info };
});
