AONC.define('content.ui.cheatsheet', function (A) {
  'use strict';

  var CSS = [
    '.wrap{position:fixed;inset:0;z-index:2147483640;display:none;align-items:center;justify-content:center;',
    'background:rgba(5,5,8,.62);backdrop-filter:blur(6px);}',
    '.wrap.on{display:flex;}',
    '.card{width:min(560px,92vw);max-height:80vh;overflow:auto;background:#14141b;border:1px solid rgba(255,255,255,.12);',
    'border-radius:16px;box-shadow:0 30px 80px rgba(0,0,0,.6);padding:18px 20px;color:#f1f1f4;',
    'font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;}',
    'h3{margin:0 0 4px;font-size:15px;font-weight:700;}',
    '.sub{font-size:11.5px;color:#9a9aa8;margin-bottom:14px;}',
    'table{width:100%;border-collapse:collapse;font-size:12.5px;}',
    'td{padding:7px 8px;border-bottom:1px solid rgba(255,255,255,.06);vertical-align:top;}',
    'td:first-child{white-space:nowrap;width:1%;}',
    '.kbd{display:inline-block;background:#22222c;border:1px solid rgba(255,255,255,.14);border-bottom-width:2px;',
    'border-radius:6px;padding:2px 7px;font-size:11px;font-family:ui-monospace,Menlo,monospace;}',
    '.foot{margin-top:12px;font-size:11px;color:#77778a;}',
    '.close{float:right;border:0;background:#22222c;color:#c9c9d4;border-radius:8px;padding:5px 10px;cursor:pointer;font-size:12px;}'
  ].join('\n');

  var host = null;
  var wrap = null;

  function ensure() {
    if (host && host.host.isConnected) return;
    host = A.content.ui.shadowHost.create({ name: 'cheatsheet', css: CSS, zIndex: 2147483640 });
    wrap = A.content.ui.shadowHost.el('div', { class: 'wrap' });
    host.container.appendChild(wrap);
    wrap.addEventListener('click', function (e) {
      if (e.target === wrap) hide();
    });
  }

  function rows() {
    var list = A.content.hotkeys.list().map(function (h) {
      return [h.keys, h.label];
    });
    list.push(['H', 'В пипетке: скрыть элемент под курсором']);
    list.push(['Esc', 'В пипетке: выход / закрыть панель']);
    list.push(['Ctrl+K', 'Студия: поиск по настройкам']);
    list.push(['Ctrl+P', 'Студия: командная палитра']);
    list.push(['Ctrl+Z / Ctrl+Shift+Z', 'Студия: отменить / повторить']);
    return list;
  }

  function show() {
    ensure();
    var el = A.content.ui.shadowHost.el;
    wrap.innerHTML = '';
    var card = el('div', { class: 'card' }, [
      el('button', { class: 'close', text: '✕ Закрыть', onclick: hide }),
      el('h3', { text: 'Горячие клавиши AnimeOn Studio' }),
      el('div', { class: 'sub', text: 'Работают на страницах animeon.cc и зеркал' })
    ]);
    var table = el('table');
    rows().forEach(function (r) {
      table.appendChild(el('tr', {}, [
        el('td', {}, [el('span', { class: 'kbd', text: r[0] })]),
        el('td', { text: r[1] })
      ]));
    });
    card.appendChild(table);
    card.appendChild(el('div', { class: 'foot', text: 'Полный список настроек — в студии: клик по значку расширения → «Открыть студию».' }));
    wrap.appendChild(card);
    wrap.classList.add('on');
  }

  function hide() {
    if (wrap) wrap.classList.remove('on');
  }

  function toggle() {
    ensure();
    if (wrap.classList.contains('on')) hide();
    else show();
  }

  function visible() {
    return !!(wrap && wrap.classList.contains('on'));
  }

  return { show: show, hide: hide, toggle: toggle, visible: visible };
});
