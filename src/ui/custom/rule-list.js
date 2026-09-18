AONC.define('ui.custom.ruleList', function (A) {
  'use strict';

  var el = A.ui.controls.el;

  function rules() {
    return A.ui.state.get('elements.rules') || [];
  }

  function persist(list) {
    A.ui.state.set('elements.rules', list);
  }

  function render(def, ctx) {
    var list = rules();
    var wrap = el('div', { class: 'list' });

    if (!list.length) {
      wrap.appendChild(el('div', { class: 'empty', text: 'Правил пока нет. Включите пипетку и кликните по любому элементу сайта.' }));
      return wrap;
    }

    list.forEach(function (rule, index) {
      wrap.appendChild(card(rule, index, ctx));
    });

    return wrap;
  }

  function card(rule, index, ctx) {
    var expanded = ctx.expandedRule === rule.id;

    var head = el('div', { class: 'list-item-head' }, [
      el('label', { class: 'sw' }, [
        el('input', {
          type: 'checkbox', checked: !!rule.enabled,
          onchange: function (e) { update(index, { enabled: e.target.checked }, ctx); }
        })
      ]),
      el('button', {
        class: 'list-item-title', type: 'button',
        onclick: function () {
          ctx.expandedRule = expanded ? null : rule.id;
          ctx.refresh('elements');
        }
      }, [
        el('b', { text: rule.name || 'Без названия' }),
        el('code', { text: rule.selector || '—' })
      ]),
      el('span', { class: 'badge', text: rule.action === 'hide' ? 'скрыть' : 'стиль' }),
      el('span', { class: 'sp' }),
      el('button', {
        class: 'mini', type: 'button', title: 'Дублировать', text: '⧉',
        onclick: function () {
          var copy = A.lang.clone(rule);
          copy.id = A.lang.uid('rule');
          copy.name = (rule.name || 'Правило') + ' (копия)';
          copy.createdAt = Date.now();
          var list = rules().slice();
          list.splice(index + 1, 0, copy);
          persist(list);
          ctx.refresh('elements');
        }
      }),
      el('button', {
        class: 'mini danger', type: 'button', title: 'Удалить', text: '✕',
        onclick: function () {
          var list = rules().filter(function (_, i) { return i !== index; });
          persist(list);
          ctx.refresh('elements');
          A.ui.toast.ok('Правило удалено');
        }
      })
    ]);

    var item = el('div', { class: 'list-item' + (rule.enabled ? '' : ' off') }, [head]);

    if (expanded) item.appendChild(editor(rule, index, ctx));
    return item;
  }

  function editor(rule, index, ctx) {
    var body = el('div', { class: 'list-item-body' });

    var on = function (patch) { update(index, patch, ctx); };

    body.appendChild(field('Название', el('input', {
      type: 'text', value: rule.name || '',
      oninput: function (e) { on({ name: e.target.value }); }
    })));

    var selectorInput = el('textarea', {
      class: 'mono code sm', rows: '2', spellcheck: 'false', value: rule.selector || '',
      oninput: function (e) {
        on({ selector: e.target.value });
        validateSelector(hint, e.target.value);
      }
    });
    var hint = el('small', { class: 'field-hint' });
    validateSelector(hint, rule.selector);
    body.appendChild(field('Селектор', selectorInput, hint));

    body.appendChild(field('Действие', select([
      { value: 'hide', label: 'Скрыть' },
      { value: 'style', label: 'Изменить стиль' }
    ], rule.action, function (v) { on({ action: v }); ctx.refresh('elements'); })));

    if (rule.action === 'hide') {
      body.appendChild(field('Способ', select([
        { value: 'display', label: 'display: none' },
        { value: 'visibility', label: 'visibility: hidden' },
        { value: 'opacity', label: 'opacity: 0' },
        { value: 'collapse', label: 'Схлопнуть' },
        { value: 'offscreen', label: 'Увести за экран' }
      ], rule.hideStrategy || 'display', function (v) { on({ hideStrategy: v }); })));
    } else {
      body.appendChild(styleEditor(rule, on, ctx));
    }

    body.appendChild(field('Только на URL', el('input', {
      type: 'text', class: 'mono', placeholder: '/anime/*, /catalog',
      value: (rule.urlPatterns || []).join(', '),
      oninput: function (e) { on({ urlPatterns: A.css.pattern.normalizeList(e.target.value) }); }
    })));

    body.appendChild(field('Свой CSS для селектора', el('textarea', {
      class: 'mono code sm', rows: '3', spellcheck: 'false', value: rule.rawCss || '',
      oninput: function (e) { on({ rawCss: e.target.value }); }
    })));

    body.appendChild(el('label', { class: 'sw' }, [
      el('input', {
        type: 'checkbox', checked: rule.important !== false,
        onchange: function (e) { on({ important: e.target.checked }); }
      }),
      el('span', { text: 'Добавлять !important' })
    ]));

    return body;
  }

  function styleEditor(rule, on, ctx) {
    var wrap = el('div', { class: 'style-grid' });
    var style = rule.style || {};

    var sliders = [
      { key: 'dx', label: 'Сдвиг X px', min: -600, max: 600, step: 1 },
      { key: 'dy', label: 'Сдвиг Y px', min: -600, max: 600, step: 1 },
      { key: 'opacity', label: 'Прозрачность', min: 0, max: 1, step: 0.05 },
      { key: 'blur', label: 'Размытие', min: 0, max: 24, step: 0.5 },
      { key: 'scale', label: 'Масштаб', min: 0.2, max: 3, step: 0.05 },
      { key: 'grayscale', label: 'Обесцветить %', min: 0, max: 100, step: 5 },
      { key: 'brightness', label: 'Яркость', min: 0.2, max: 2, step: 0.05 },
      { key: 'fontSize', label: 'Кегль px', min: 8, max: 48, step: 1 },
      { key: 'radius', label: 'Скругление px', min: 0, max: 48, step: 1 }
    ];

    sliders.forEach(function (s) {
      var neutral = s.min < 0 ? 0 : s.min;
      var value = style[s.key] === '' || style[s.key] == null ? neutral : Number(style[s.key]);
      var out = el('output', { text: style[s.key] === '' || style[s.key] == null ? '—' : String(value) });
      var input = el('input', {
        type: 'range', min: String(s.min), max: String(s.max), step: String(s.step), value: String(value),
        oninput: function () {
          out.textContent = input.value;
          var patch = {};
          patch[s.key] = input.value === '' ? '' : Number(input.value);
          on({ style: Object.assign({}, style, patch) });
        }
      });
      wrap.appendChild(el('label', { class: 'mini-row' }, [
        el('span', { text: s.label }), input, out
      ]));
    });

    [['background', 'Фон'], ['color', 'Текст']].forEach(function (pair) {
      wrap.appendChild(el('label', { class: 'mini-row' }, [
        el('span', { text: pair[1] }),
        el('input', {
          type: 'color', value: A.ui.controls.normalizeColor(style[pair[0]] || '#7c4dff'),
          oninput: function (e) {
            var patch = {};
            patch[pair[0]] = e.target.value;
            on({ style: Object.assign({}, style, patch) });
          }
        }),
        el('button', {
          class: 'mini', type: 'button', text: '⌀', title: 'Сбросить',
          onclick: function () {
            var patch = {};
            patch[pair[0]] = '';
            on({ style: Object.assign({}, style, patch) });
            ctx.refresh('elements');
          }
        })
      ]));
    });

    [['border', 'Рамка'], ['width', 'Ширина'], ['height', 'Высота'], ['margin', 'Отступы'], ['padding', 'Поля'], ['zIndex', 'z-index'], ['pointerEvents', 'pointer-events'], ['position', 'position']].forEach(function (pair) {
      wrap.appendChild(el('label', { class: 'mini-row' }, [
        el('span', { text: pair[1] }),
        el('input', {
          type: 'text', class: 'mono sm', value: style[pair[0]] == null ? '' : String(style[pair[0]]),
          oninput: function (e) {
            var patch = {};
            patch[pair[0]] = e.target.value.trim();
            on({ style: Object.assign({}, style, patch) });
          }
        })
      ]));
    });

    return wrap;
  }

  function field(labelText, control, extra) {
    var wrap = el('label', { class: 'field' }, [el('span', { class: 'field-label', text: labelText }), control]);
    if (extra) wrap.appendChild(extra);
    return wrap;
  }

  function select(options, value, onChange) {
    var node = el('select', { onchange: function (e) { onChange(e.target.value); } });
    options.forEach(function (o) { node.appendChild(el('option', { value: o.value, text: o.label })); });
    node.value = value == null ? '' : String(value);
    return node;
  }

  function validateSelector(node, selector) {
    if (!selector || !String(selector).trim()) {
      node.textContent = 'Пустой селектор';
      node.className = 'field-hint bad';
      return;
    }
    try {
      document.querySelector(String(selector));
      node.textContent = 'Селектор корректный';
      node.className = 'field-hint ok';
    } catch (e) {
      node.textContent = 'Ошибка синтаксиса: ' + e.message;
      node.className = 'field-hint bad';
    }
  }

  function update(index, patch, ctx) {
    var list = rules().slice();
    list[index] = A.lang.deepMerge(list[index], patch);
    persist(list);
    if (ctx && ctx.silent !== true) A.ui.state.preview();
  }

  return { render: render, rules: rules, persist: persist };
});
