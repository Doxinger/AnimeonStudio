AONC.define('ui.custom.wallpaperGrid', function (A) {
  'use strict';

  var el = A.ui.controls.el;
  var lib = A.config.wallpapers;

  function render(def, ctx) {
    var wrap = el('div', { class: 'wp-grid' });
    var current = A.ui.state.get('wallpaper.preset');
    var source = A.ui.state.get('wallpaper.source');

    lib.groups().forEach(function (group) {
      wrap.appendChild(el('div', { class: 'preset-group-title', text: group.label }));
      var row = el('div', { class: 'preset-row' });

      group.items.forEach(function (p) {
        var active = source === 'preset' && current === p.id;
        var btn = el('button', {
          class: 'wp-swatch' + (active ? ' on' : ''),
          type: 'button',
          title: p.name,
          onclick: function () {
            var d = lib.defaultsFor(p.id);
            A.ui.state.setMany({
              'wallpaper.enabled': true,
              'wallpaper.source': 'preset',
              'wallpaper.preset': p.id,
              'wallpaper.size': d.size,
              'wallpaper.repeat': d.repeat
            });
            ctx.refresh('theme');
          }
        }, [
          el('span', { class: 'wp-prev', style: 'background-color:#0a0a10;background-image:' + lib.cssValue(p) + ';background-size:' + (p.kind === 'svg' ? 'auto' : 'cover') + ';background-repeat:' + (p.kind === 'svg' ? 'repeat' : 'no-repeat') + ';' }),
          el('span', { class: 'preset-name', text: p.name })
        ]);
        row.appendChild(btn);
      });

      wrap.appendChild(row);
    });

    return wrap;
  }

  return { render: render };
});
