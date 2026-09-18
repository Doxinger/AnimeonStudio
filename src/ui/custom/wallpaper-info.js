AONC.define('ui.custom.wallpaperInfo', function (A) {
  'use strict';

  var el = A.ui.controls.el;
  var lib = A.config.wallpapers;

  function fmtBytes(n) {
    if (n < 1024) return n + ' Б';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' КБ';
    return (n / 1024 / 1024).toFixed(2) + ' МБ';
  }

  function currentWallpaper() {
    return A.ui.state.current().wallpaper || {};
  }

  function describe(w) {
    if (w.source === 'preset') {
      var p = lib.get(w.preset);
      return p ? { label: p.name + ' · ' + p.group, kind: p.kind } : { label: 'пресет не найден', kind: '' };
    }
    if (w.source === 'data') {
      var len = String(w.dataUrl || '').length;
      return { label: len ? 'файл, ' + fmtBytes(len) : 'файл не загружен', kind: 'data' };
    }
    return { label: w.url ? String(w.url) : 'ссылка не указана', kind: 'url' };
  }

  function render(def, ctx) {
    var wrap = el('div', { class: 'wp-info' });
    paint(wrap, ctx);
    return wrap;
  }

  function paint(wrap) {
    var w = currentWallpaper();
    var image = lib.valueFor(w);
    var info = describe(w);

    wrap.innerHTML = '';

    if (!image) {
      wrap.appendChild(el('div', {
        class: 'empty',
        text: w.source === 'data'
          ? 'Файл не загружен. Нажмите «Загрузить файл с диска».'
          : w.source === 'url'
            ? 'Ссылка не указана. Вставьте URL или загрузите файл.'
            : 'Пресет не выбран. Кликните по одному из образцов выше.'
      }));
      return;
    }

    var preview = el('div', {
      class: 'wp-thumb',
      style: 'background-color:#0a0a10;background-image:' + image + ';' +
        'background-size:' + (w.source === 'preset' && (lib.get(w.preset) || {}).kind === 'svg' ? 'auto' : w.size || 'cover') + ';' +
        'background-repeat:' + (w.repeat || 'no-repeat') + ';' +
        'background-position:' + (w.position || 'center') + ';'
    });

    var meta = el('div', { class: 'wp-meta' });
    var lines = [
      'Источник: ' + info.label,
      'Режим: ' + (w.size || 'cover') + ' · ' + (w.position || 'center') + ' · ' + (w.repeat || 'no-repeat'),
      'Затемнение ' + (w.overlay == null ? 45 : w.overlay) + '%' +
        (w.blur ? ' · блюр ' + w.blur + 'px' : '') +
        (w.parallax ? ' · параллакс' : '') +
        (w.drift ? ' · дрейф' : '')
    ];
    meta.innerHTML = lines.map(function (l) { return '<span>' + A.lang.escapeHtml(l) + '</span>'; }).join('');

    var actions = el('div', { class: 'ctl-row' });
    if (w.source === 'url' && w.url) {
      actions.appendChild(el('button', {
        class: 'mini', type: 'button', text: '↗', title: 'Открыть оригинал',
        onclick: function () { window.open(w.url, '_blank', 'noopener'); }
      }));
    }
    actions.appendChild(el('button', {
      class: 'mini', type: 'button', text: '↻', title: 'Обновить превью',
      onclick: function () { paint(wrap); }
    }));

    wrap.appendChild(el('div', { class: 'wp-row' }, [preview, el('div', { class: 'wp-side' }, [meta, actions])]));
  }

  return { render: render, paint: paint, fmtBytes: fmtBytes, describe: describe };
});
