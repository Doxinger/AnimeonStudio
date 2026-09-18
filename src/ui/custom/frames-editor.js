AONC.define('ui.custom.framesEditor', function (A) {
  'use strict';

  var el = A.ui.controls.el;

  function list() {
    return A.ui.state.get('cosmetics.frames') || [];
  }

  function toggleRow(path, labelText, hint, ctx) {
    var input = el('input', {
      type: 'checkbox',
      checked: !!A.ui.state.get(path),
      onchange: function (e) {
        A.ui.state.set(path, e.target.checked);
        if (ctx) ctx.debouncedRefresh();
      }
    });
    return el('label', { class: 'sw' }, [
      input,
      el('span', { class: 'track' }),
      el('span', { class: 'sw-text', text: labelText, title: hint || '' })
    ]);
  }

  function selectRow(path, options, label, ctx) {
    var select = el('select', {
      onchange: function (e) {
        A.ui.state.set(path, e.target.value);
        if (ctx) ctx.debouncedRefresh();
      }
    });
    options.forEach(function (o) { select.appendChild(el('option', { value: o.value, text: o.label })); });
    select.value = A.ui.state.get(path) || options[0].value;
    return el('label', { class: 'field fe-field' }, [el('span', { class: 'field-label', text: label }), select]);
  }

  function rangeRow(path, min, max, step, label, suffix, ctx) {
    var value = A.lang.num(A.ui.state.get(path), min);
    var out = el('output', { text: value + suffix });
    var input = el('input', {
      type: 'range', min: String(min), max: String(max), step: String(step), value: String(value),
      oninput: function () {
        out.textContent = input.value + suffix;
        A.ui.state.set(path, Number(input.value));
        if (ctx) ctx.debouncedRefresh();
      }
    });
    return el('label', { class: 'mini-row fe-field' }, [el('span', { text: label }), input, out]);
  }

  function preview(ctx) {
    var items = list().map(function (f) {
      return A.lang.normalize(A.config.defaults.frame, f);
    }).filter(function (f) { return f.enabled !== false; });
    var on = !!A.ui.state.get('cosmetics.framesOn');

    return el('div', { class: 'fe-preview' }, [
      A.ui.custom.framesPreview.mock({
        frames: on ? items : [],
        face: 84,
        nickname: A.ui.state.get('identity.name') || 'Гость'
      }),
      el('div', { class: 'fe-preview-note' }, [
        el('span', {
          text: on && items.length
            ? 'Так это выглядит на сайте: картинка рамки центрируется поверх аватара и масштабируется коэффициентом самой рамки.'
            : 'Включите «Показывать рамки» и выберите рамку в каталоге — превью обновится сразу.'
        })
      ])
    ]);
  }

  function render(def, ctx) {
    var items = list();
    var wrap = el('div', { class: 'frames-editor' });

    wrap.appendChild(el('div', { class: 'list-head' }, [
      el('b', { text: 'Рамки аватарки' }),
      el('span', { class: 'badge', text: String(items.length) }),
      el('span', { class: 'sp' }),
      toggleRow('cosmetics.framesOn', 'Показывать рамки', 'Рисовать выбранную рамку поверх аватара', ctx)
    ]));

    wrap.appendChild(el('div', { class: 'fe-row' }, [
      selectRow('cosmetics.framesPlacement', [
        { value: 'profile', label: 'Только большой аватар в профиле' },
        { value: 'all', label: 'Все аватарки на сайте' }
      ], 'Где рисовать', ctx),
      selectRow('cosmetics.framesMode', [
        { value: 'single', label: 'Одна рамка (как на сайте)' },
        { value: 'stack', label: 'Несколько рамок слоями' }
      ], 'Режим', ctx),
      rangeRow('cosmetics.framesMinSize', 0, 200, 4, 'Мин. размер аватара', 'px', ctx)
    ]));

    wrap.appendChild(el('div', { class: 'fe-row' }, [
      toggleRow('cosmetics.framesHideSite', 'Спрятать рамку сайта на моём аватаре', 'Убрать родную рамку только там, где рисуем свою — у остальных пользователей рамки останутся', ctx)
    ]));

    wrap.appendChild(preview(ctx));
    wrap.appendChild(A.ui.custom.framesList(def, ctx));
    wrap.appendChild(el('div', { class: 'hub-sep' }));
    wrap.appendChild(A.ui.custom.framesPicker(def, ctx));

    return wrap;
  }

  return { render: render };
});
