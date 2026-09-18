AONC.define('content.ui.shadowHost', function (A) {
  'use strict';

  var Z = 2147483646;

  function baseCss(accent) {
    return [
      ':host{all:initial;}',
      '*{box-sizing:border-box;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;}',
      '.root{',
      '  --accent:' + (accent || '#7C4DFF') + ';',
      '  --bg:#15151a;--bg2:#1d1d24;--bg3:#26262f;',
      '  --fg:#f2f2f5;--dim:#9b9ba8;--line:rgba(255,255,255,.10);',
      '  color:var(--fg);font-size:13px;line-height:1.45;',
      '}'
    ].join('\n');
  }

  function create(options) {
    var opts = options || {};
    var host = document.createElement('div');
    host.setAttribute('data-aonc-ui', opts.name || 'panel');
    host.style.cssText = [
      'all:initial',
      'position:' + (opts.position || 'fixed'),
      'z-index:' + (opts.zIndex || Z),
      'top:0', 'left:0',
      'width:0', 'height:0',
      'overflow:visible',
      'pointer-events:none',
      'contain:none'
    ].join(';');

    var root = host.shadowRoot || host.attachShadow({ mode: 'open' });

    var style = document.createElement('style');
    style.textContent = baseCss(opts.accent) + '\n' + (opts.css || '');
    root.appendChild(style);

    var container = document.createElement('div');
    container.className = 'root';
    if (opts.containerCss) container.style.cssText = opts.containerCss;
    root.appendChild(container);

    document.documentElement.appendChild(host);

    return {
      host: host,
      root: root,
      container: container,
      style: style,
      setCss: function (extra) { style.textContent = baseCss(opts.accent) + '\n' + extra; },
      remove: function () { if (host.parentNode) host.parentNode.removeChild(host); }
    };
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'class') node.className = attrs[k];
      else if (k === 'text') node.textContent = attrs[k];
      else if (k === 'html') node.innerHTML = attrs[k];
      else if (k.indexOf('on') === 0) node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
      else if (attrs[k] != null) node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  return { create: create, el: el, Z: Z, baseCss: baseCss };
});
