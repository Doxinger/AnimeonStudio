AONC.define('ui.custom.framesList', function (A) {
  'use strict';

  var el = A.ui.controls.el;
  var lib = A.config.framesLib;

  var ANIMS = [
    { value: 'none', label: 'Без анимации' },
    { value: 'rotate', label: 'Вращение' },
    { value: 'pulse', label: 'Пульс' },
    { value: 'float', label: 'Парение' },
    { value: 'hue', label: 'Перелив цвета' },
    { value: 'shine', label: 'Блеск' }
  ];

  function list() {
    return A.ui.state.get('cosmetics.frames') || [];
  }

  function persist(next, ctx) {
    A.ui.state.set('cosmetics.frames', next);
    A.ui.state.set('cosmetics.framesOn', next.length > 0);
    if (ctx) ctx.refresh('cosmetics');
  }

  function update(index, patch, ctx) {
    var items = list().slice();
    items[index] = A.lang.normalize(A.config.defaults.frame, Object.assign({}, items[index], patch));
    A.ui.state.set('cosmetics.frames', items);
    if (ctx) ctx.debouncedRefresh();
  }

  function field(labelText, control) {
    return el('label', { class: 'field' }, [el('span', { class: 'field-label', text: labelText }), control]);
  }

  function sliderRow(labelText, min, max, step, value, suffix, onChange) {
    var out = el('output', { text: value + suffix });
    var input = el('input', {
      type: 'range', min: String(min), max: String(max), step: String(step), value: String(value),
      oninput: function () {
        out.textContent = input.value + suffix;
        onChange(Number(input.value));
      }
    });
    return el('label', { class: 'mini-row' }, [el('span', { text: labelText }), input, out]);
  }

  function selectRow(labelText, options, value, onChange) {
    var select = el('select', { onchange: function (e) { onChange(e.target.value); } });
    options.forEach(function (o) { select.appendChild(el('option', { value: o.value, text: o.label })); });
    select.value = value;
    return field(labelText, select);
  }

  function describe(frame) {
    var item = frame.frameId ? lib.byId(frame.frameId) : null;
    if (item) {
      var r = lib.rarity(item.rarity);
      return {
        title: item.name,
        meta: r.label + (item.label ? ' · ' + item.label : ''),
        rarity: item.rarity,
        scale: A.config.framesGeometry.scaleOf(item, frame.scale),
        unlocked: item.unlocked,
        type: item.type
      };
    }
    return {
      title: frame.name || 'Своя рамка',
      meta: 'по ссылке',
      rarity: 'custom',
      scale: A.config.framesGeometry.scaleOf(null, frame.scale),
      unlocked: true,
      type: 'image'
    };
  }

  function card(frame, index, ctx) {
    var info = describe(frame);
    var on = frame.enabled !== false;
    var box = el('div', { class: 'fitem' + (on ? '' : ' off') });

    box.appendChild(el('div', { class: 'fitem-head' }, [
      el('span', { class: 'fitem-prev r-' + info.rarity }, [
        A.ui.custom.framesPreview.stage({ face: 46, frames: [frame] })
      ]),
      el('span', { class: 'fitem-label' }, [
        el('b', { text: info.title }),
        el('small', { text: info.meta + (info.unlocked ? '' : ' · на сайте не выдана — носим всё равно') }),
        el('small', { class: 'mono', text: info.type === 'image' ? 'масштаб ' + info.scale.toFixed(2) + '× как на сайте' : 'CSS-кольцо сайта' })
      ]),
      el('span', { class: 'sp' }),
      el('label', { class: 'sw', title: 'Показывать эту рамку' }, [
        el('input', {
          type: 'checkbox', checked: on,
          onchange: function (e) { update(index, { enabled: e.target.checked }, ctx); }
        }),
        el('span', { class: 'track' })
      ]),
      el('button', {
        class: 'mini', type: 'button', text: '↺', title: 'Сбросить к настройкам сайта',
        onclick: function () {
          update(index, { scale: 0, ox: 0, oy: 0, opacity: 100, anim: 'none', glow: 0 }, ctx);
          ctx.refresh('cosmetics');
        }
      }),
      el('button', {
        class: 'mini danger', type: 'button', text: '✕', title: 'Снять рамку',
        onclick: function () {
          persist(list().filter(function (_, i) { return i !== index; }), ctx);
        }
      })
    ]));

    var grid = el('div', { class: 'fitem-grid' });

    if (!frame.frameId) {
      grid.appendChild(field('Ссылка на картинку', el('input', {
        type: 'text', class: 'mono', value: frame.url || '', placeholder: 'https://…/frame.png',
        oninput: function (e) { update(index, { url: e.target.value }, ctx); }
      })));
      grid.appendChild(field('Подпись', el('input', {
        type: 'text', value: frame.name || '', placeholder: 'Своя рамка',
        oninput: function (e) { update(index, { name: e.target.value }, ctx); }
      })));
    }

    grid.appendChild(sliderRow('Размер', 50, 300, 1, Math.round(info.scale * 100), '%', function (v) {
      update(index, { scale: Math.round(v) / 100 }, ctx);
    }));
    grid.appendChild(sliderRow('Сдвиг X', -60, 60, 1, A.lang.num(frame.ox, 0), 'px', function (v) {
      update(index, { ox: v }, ctx);
    }));
    grid.appendChild(sliderRow('Сдвиг Y', -60, 60, 1, A.lang.num(frame.oy, 0), 'px', function (v) {
      update(index, { oy: v }, ctx);
    }));
    grid.appendChild(sliderRow('Прозрачность', 10, 100, 5, A.lang.num(frame.opacity, 100), '%', function (v) {
      update(index, { opacity: v }, ctx);
    }));
    grid.appendChild(sliderRow('Свечение', 0, 30, 1, A.lang.num(frame.glow, 0), 'px', function (v) {
      update(index, { glow: v }, ctx);
    }));
    grid.appendChild(selectRow('Анимация', ANIMS, frame.anim || 'none', function (v) {
      update(index, { anim: v }, ctx);
    }));

    box.appendChild(grid);
    return box;
  }

  function render(def, ctx) {
    var items = list();
    var wrap = el('div', { class: 'frames-list' });

    wrap.appendChild(el('div', { class: 'fl-head' }, [
      el('b', { text: 'Надето' }),
      el('span', { class: 'badge', text: String(items.length) }),
      el('span', { class: 'sp' }),
      el('button', {
        class: 'btn sm ghost', type: 'button', text: '＋ Рамка по ссылке',
        onclick: function () {
          persist(items.concat([lib.customEntry('', 'Своя рамка')]), ctx);
        }
      }),
      items.length ? el('button', {
        class: 'btn sm ghost', type: 'button', text: 'Снять всё',
        onclick: function () { persist([], ctx); }
      }) : null
    ]));

    if (!items.length) {
      wrap.appendChild(el('div', {
        class: 'empty',
        text: 'Рамка не выбрана. Кликните карточку в каталоге выше — она встанет ровно так, как рисует сайт.'
      }));
      return wrap;
    }

    items.forEach(function (frame, index) {
      wrap.appendChild(card(A.lang.normalize(A.config.defaults.frame, frame), index, ctx));
    });

    return wrap;
  }

  return { render: render, list: list, persist: persist, describe: describe };
});
