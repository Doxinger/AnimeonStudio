AONC.define('ui.custom.badgeEditor', function (A) {
  'use strict';

  var el = A.ui.controls.el;

  var BADGE_ICONS = [
    'star', 'crown', 'flame', 'party-popper', 'trophy', 'gem', 'medal', 'badge-check',
    'rocket', 'swords', 'ghost', 'paw-print', 'castle', 'heart', 'zap', 'shield', 'sparkles', 'palette'
  ];

  var PRESETS = [
    { text: 'Мангака', color: '#7C4DFF', icon: 'palette', num: '№0655' },
    { text: 'Ветеран', color: '#22D3EE', icon: 'shield', num: '' },
    { text: 'Топ-100', color: '#FABD2F', icon: 'trophy', num: '' },
    { text: 'Коллекционер', color: '#3DDC84', icon: 'gem', num: '' },
    { text: 'Первый ключ', color: '#EC4899', icon: 'crown', num: '№064' },
    { text: 'Друзья', color: '#EC4899', icon: 'party-popper', num: '' },
    { text: 'Стрик 30', color: '#FF7A45', icon: 'flame', num: '30' },
    { text: 'Мифик', color: '#A78BFA', icon: 'sparkles', num: '' }
  ];

  function list() {
    return A.ui.state.get('cosmetics.badges') || [];
  }

  function persist(next) {
    A.ui.state.set('cosmetics.badges', next);
  }

  function render(def, ctx) {
    var wrap = el('div', { class: 'badge-editor' });
    var items = list();

    wrap.appendChild(el('div', { class: 'list-head' }, [
      el('b', { text: 'Бейджи профиля' }),
      el('span', { class: 'badge', text: String(items.length) }),
      el('span', { class: 'sp' }),
      el('label', { class: 'sw' }, [
        el('input', {
          type: 'checkbox', checked: !!A.ui.state.get('cosmetics.enabled'),
          onchange: function (e) { A.ui.state.set('cosmetics.enabled', e.target.checked); }
        }),
        el('span', { class: 'track' }),
        el('span', { class: 'sw-text', text: 'Показывать на профиле' })
      ])
    ]));

    var placementSelect = el('select', {
      onchange: function (e) { A.ui.state.set('cosmetics.placement', e.target.value); }
    });
    [
      { value: 'badges', label: 'В ряду бейджей (до счётчика косметики)' },
      { value: 'start', label: 'В начало строки' },
      { value: 'end', label: 'В конец строки' }
    ].forEach(function (o) {
      placementSelect.appendChild(el('option', { value: o.value, text: o.label }));
    });
    placementSelect.value = A.ui.state.get('cosmetics.placement') || 'badges';

    wrap.appendChild(el('label', { class: 'field placement-field' }, [
      el('span', { class: 'field-label', text: 'Куда вставлять на профиле' }),
      placementSelect
    ]));

    wrap.appendChild(el('div', {
      class: 'hint-inline',
      text: 'Бейджи рисуются расширением в строке бейджей профиля (/user/…) в стиле site-званий: пилюля, свечение, градиентный текст. Это визуальный слой: реальные разблокировки сайта не меняются.'
    }));

    var presetsRow = el('div', { class: 'preset-row wrap' });
    PRESETS.forEach(function (p) {
      presetsRow.appendChild(el('button', {
        class: 'badge-chip', type: 'button', title: 'Добавить бейдж «' + p.text + '»',
        onclick: function () {
          persist(list().concat([A.lang.normalize(A.config.defaults.badge, {
            id: A.lang.uid('badge'), text: p.text, color: p.color, icon: p.icon, num: p.num
          })]));
          ctx.refresh('cosmetics');
        }
      }, [
        el('span', { class: 'bc-dot', style: 'background:' + p.color }),
        el('span', { text: p.text })
      ]));
    });
    wrap.appendChild(el('div', { class: 'badge-presets' }, [
      el('div', { class: 'preset-group-title', text: 'Быстрые бейджи' }), presetsRow
    ]));

    if (!items.length) {
      wrap.appendChild(el('div', { class: 'empty', text: 'Своих бейджей нет. Добавьте быстрый сверху или создайте пустой кнопкой ниже.' }));
    }

    items.forEach(function (b, index) {
      wrap.appendChild(card(b, index, ctx));
    });

    wrap.appendChild(el('div', { class: 'ctl-row' }, [
      el('button', {
        class: 'btn sm', type: 'button', text: '＋ Пустой бейдж',
        onclick: function () {
          persist(list().concat([A.lang.normalize(A.config.defaults.badge, {
            id: A.lang.uid('badge'), text: 'Мой бейдж'
          })]));
          ctx.refresh('cosmetics');
        }
      })
    ]));

    return wrap;
  }

  function card(b, index, ctx) {
    var on = b.enabled !== false;
    var box = el('div', { class: 'badge-card' + (on ? '' : ' off') });

    box.appendChild(el('div', { class: 'badge-card-head' }, [
      el('span', {
        class: 'badge-preview',
        style: 'background:' + A.color.convert.rgba(b.color, 0.10) + ';border:1px solid ' + A.color.convert.rgba(b.color, 0.32) + ';'
      }, [
        el('span', {
          class: 'bp-text',
          style: b.gradient
            ? 'background-image:linear-gradient(90deg,' + b.color + ',' + A.color.transform.rotate(b.color, 60) + ');background-clip:text;-webkit-background-clip:text;-webkit-text-fill-color:transparent;'
            : 'color:' + b.color + ';'
        }, [document.createTextNode((b.text || 'Бейдж') + (b.num ? ' ' + b.num : ''))])
      ]),
      el('span', { class: 'sp' }),
      el('label', { class: 'sw' }, [
        el('input', {
          type: 'checkbox', checked: on,
          onchange: function (e) { update(index, { enabled: e.target.checked }, ctx); }
        }),
        el('span', { class: 'track' })
      ]),
      el('button', {
        class: 'mini danger', type: 'button', text: '✕', title: 'Удалить',
        onclick: function () {
          persist(list().filter(function (_, i) { return i !== index; }));
          ctx.refresh('cosmetics');
        }
      })
    ]));

    var grid = el('div', { class: 'badge-grid' });

    grid.appendChild(field('Текст', el('input', {
      type: 'text', value: b.text || '',
      oninput: function (e) { update(index, { text: e.target.value }, ctx); }
    })));

    grid.appendChild(field('Номер / приписка', el('input', {
      type: 'text', value: b.num || '', placeholder: '№064, 30, пусто…',
      oninput: function (e) { update(index, { num: e.target.value }, ctx); }
    })));

    var colorInput = el('input', {
      type: 'color', value: A.ui.controls.normalizeColor(b.color),
      oninput: function (e) { update(index, { color: e.target.value }, ctx); }
    });
    grid.appendChild(field('Цвет', colorInput));

    var iconSelect = el('select', {
      onchange: function (e) { update(index, { icon: e.target.value }, ctx); }
    });
    BADGE_ICONS.forEach(function (name) {
      iconSelect.appendChild(el('option', { value: name, text: name }));
    });
    iconSelect.value = b.icon || 'star';
    grid.appendChild(field('Иконка', iconSelect));

    grid.appendChild(el('label', { class: 'sw' }, [
      el('input', {
        type: 'checkbox', checked: b.glow !== false,
        onchange: function (e) { update(index, { glow: e.target.checked }, ctx); }
      }),
      el('span', { class: 'track' }),
      el('span', { class: 'sw-text', text: 'Свечение' })
    ]));

    grid.appendChild(el('label', { class: 'sw' }, [
      el('input', {
        type: 'checkbox', checked: b.gradient !== false,
        onchange: function (e) { update(index, { gradient: e.target.checked }, ctx); }
      }),
      el('span', { class: 'track' }),
      el('span', { class: 'sw-text', text: 'Градиент текста' })
    ]));

    box.appendChild(grid);
    return box;
  }

  function field(labelText, control) {
    return el('label', { class: 'field' }, [el('span', { class: 'field-label', text: labelText }), control]);
  }

  function update(index, patch, ctx) {
    var items = list().slice();
    items[index] = Object.assign({}, items[index], patch);
    persist(items);
    if (ctx) ctx.debouncedRefresh();
  }

  return { render: render, BADGE_ICONS: BADGE_ICONS, PRESETS: PRESETS };
});
