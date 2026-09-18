AONC.define('ui.custom.wallpaperRules', function (A) {
  'use strict';

  var el = A.ui.controls.el;
  var lib = A.config.wallpapers;

  function path() { return 'wallpaper.rules'; }
  function rules() { return A.ui.state.get(path()) || []; }
  function persist(next) { A.ui.state.set(path(), next); }

  function render(def, ctx) {
    var wrap = el('div', { class: 'list' });
    var items = rules();

    wrap.appendChild(el('div', { class: 'list-head' }, [
      el('b', { text: 'Правила фона по URL' }),
      el('span', { class: 'sp' }),
      el('button', {
        class: 'btn sm', type: 'button', text: '＋ Добавить',
        onclick: function () {
          var next = items.concat([A.lang.normalize(A.config.defaults.wallpaperRule, {
            id: A.lang.uid('wpr'),
            name: 'Новый фон',
            urlPatterns: ['/catalog']
          })]);
          persist(next);
          ctx.expandedWallpaperRule = next[next.length - 1].id;
          ctx.refresh('theme');
        }
      })
    ]));

    if (!items.length) {
      wrap.appendChild(el('div', {
        class: 'empty',
        text: 'Правил нет. Можно задать свой фон для каталога (/catalog*), страницы просмотра (/anime/*) или любой другой маски.'
      }));
      return wrap;
    }

    items.forEach(function (rule, index) { wrap.appendChild(card(rule, index, ctx)); });
    return wrap;
  }

  function card(rule, index, ctx) {
    var expanded = ctx.expandedWallpaperRule === rule.id;

    var head = el('div', { class: 'list-item-head' }, [
      el('input', {
        type: 'checkbox', checked: !!rule.enabled, title: 'Включено',
        onchange: function (e) { update(index, { enabled: e.target.checked }, ctx); }
      }),
      el('button', {
        class: 'list-item-title', type: 'button',
        onclick: function () {
          ctx.expandedWallpaperRule = expanded ? null : rule.id;
          ctx.refresh('theme');
        }
      }, [
        el('b', { text: rule.name || 'Без названия' }),
        el('code', { text: (rule.urlPatterns || []).join(', ') || 'все страницы' })
      ]),
      el('span', { class: 'badge', text: rule.source === 'preset' ? (lib.get(rule.preset) || {}).name || 'пресет' : rule.source }),
      el('span', { class: 'sp' }),
      el('button', {
        class: 'mini danger', type: 'button', title: 'Удалить', text: '✕',
        onclick: function () {
          persist(rules().filter(function (_, i) { return i !== index; }));
          ctx.refresh('theme');
        }
      })
    ]);

    var node = el('div', { class: 'list-item' + (rule.enabled ? '' : ' off') }, [head]);
    if (expanded) node.appendChild(editor(rule, index, ctx));
    return node;
  }

  function editor(rule, index, ctx) {
    var body = el('div', { class: 'list-item-body' });
    var on = function (patch) { update(index, patch, ctx); };

    body.appendChild(field('Название', el('input', {
      type: 'text', value: rule.name || '',
      oninput: function (e) { on({ name: e.target.value }); }
    })));

    body.appendChild(field('URL-шаблоны', el('input', {
      type: 'text', class: 'mono', placeholder: '/catalog, /anime/*, /^\\/user\\//',
      value: (rule.urlPatterns || []).join(', '),
      oninput: function (e) { on({ urlPatterns: A.css.pattern.normalizeList(e.target.value) }); }
    })));

    body.appendChild(field('Источник', select([
      { value: 'preset', label: 'Встроенный пресет / узор' },
      { value: 'url', label: 'По ссылке (URL)' }
    ], rule.source, function (v) { on({ source: v }); })));

    if (rule.source === 'preset') {
      body.appendChild(field('Пресет', select(
        lib.LIB.map(function (p) { return { value: p.id, label: p.name + ' · ' + p.group }; }),
        rule.preset, function (v) { on({ preset: v }); }
      )));
    } else {
      body.appendChild(field('URL картинки', el('input', {
        type: 'text', class: 'mono', value: rule.url || '', placeholder: 'https://…',
        oninput: function (e) { on({ url: e.target.value.trim() }); }
      })));
    }

    body.appendChild(field('Масштаб', select([
      { value: 'cover', label: 'Заполнить' },
      { value: 'contain', label: 'Вписать' },
      { value: 'auto', label: 'Исходный' }
    ], rule.size, function (v) { on({ size: v }); })));

    body.appendChild(field('Повтор', select([
      { value: 'no-repeat', label: 'Без повтора' },
      { value: 'repeat', label: 'Плиткой' },
      { value: 'repeat-x', label: 'По горизонтали' },
      { value: 'repeat-y', label: 'По вертикали' }
    ], rule.repeat, function (v) { on({ repeat: v }); })));

    body.appendChild(sliderRow('Затемнение', 0, 95, 1, rule.overlay, function (v) { on({ overlay: v }); }));
    body.appendChild(sliderRow('Размытие', 0, 30, 1, rule.blur, function (v) { on({ blur: v }); }));

    body.appendChild(el('label', { class: 'sw' }, [
      el('input', {
        type: 'checkbox', checked: rule.showThrough !== false,
        onchange: function (e) { on({ showThrough: e.target.checked }); }
      }),
      el('span', { text: 'Прозрачный фон контента' })
    ]));

    return body;
  }

  function sliderRow(labelText, min, max, step, value, onChange) {
    var out = el('output', { text: (value == null ? min : value) });
    var input = el('input', {
      type: 'range', min: String(min), max: String(max), step: String(step),
      value: String(value == null ? min : value),
      oninput: function () { out.textContent = input.value; onChange(Number(input.value)); }
    });
    return el('label', { class: 'mini-row' }, [el('span', { text: labelText }), input, out]);
  }

  function field(labelText, control) {
    return el('label', { class: 'field' }, [el('span', { class: 'field-label', text: labelText }), control]);
  }

  function select(options, value, onChange) {
    var node = el('select', { onchange: function (e) { onChange(e.target.value); } });
    options.forEach(function (o) { node.appendChild(el('option', { value: o.value, text: o.label })); });
    node.value = value == null ? '' : String(value);
    return node;
  }

  function update(index, patch, ctx) {
    var items = rules().slice();
    items[index] = Object.assign({}, items[index], patch);
    persist(items);
    if (ctx) ctx.debouncedRefresh();
  }

  return { render: render, rules: rules, persist: persist };
});
