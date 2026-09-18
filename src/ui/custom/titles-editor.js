AONC.define('ui.custom.titlesEditor', function (A) {
  'use strict';

  var el = A.ui.controls.el;
  var lib = A.config.titlesLib;
  var STYLE_ID = 'aonc-titles-css';

  // FX-стили пилюль нужны и в студии (живое превью) — те же, что инжектит
  // контент-скрипт на сайте.
  function ensureCss() {
    if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = lib.css();
    (document.head || document.documentElement).appendChild(style);
  }

  function list() {
    return (A.ui.state.get('cosmetics.titles') || [])
      .map(function (t) { return A.lang.normalize(A.config.defaults.title, t); })
      .filter(function (t) { return !!t.titleId; });
  }

  function persist(next, ctx) {
    A.ui.state.setMany({
      'cosmetics.titles': next,
      'cosmetics.titlesOn': next.length > 0 ? !!A.ui.state.get('cosmetics.titlesOn') : false
    });
    if (ctx) ctx.refresh('cosmetics');
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

  function preview(ctx) {
    ensureCss();
    var on = !!A.ui.state.get('cosmetics.titlesOn');
    var items = list().filter(function (t) { return t.enabled !== false; });

    var row = el('div', { class: 'tp-preview-row' }, [
      el('span', { class: 'tp-site-chip', text: '17/80' })
    ]);
    if (on) {
      items.forEach(function (entry) {
        var item = lib.byId(entry.titleId);
        if (!item) return;
        var pill = lib.buildPill(lib.pillSpec(item, entry));
        if (pill) {
          pill.removeAttribute('data-aonc-title');
          row.appendChild(pill);
        }
      });
    }

    return el('div', { class: 'fe-preview tp-preview' }, [
      row,
      el('div', { class: 'fe-preview-note' }, [
        el('span', {
          text: on && items.length
            ? 'Так это выглядит на сайте: титулы встают в ряд бейджей профиля с родными цветами, свечением и анимацией.'
            : 'Включите «Показывать титулы» и выберите титул в каталоге — превью обновится сразу.'
        })
      ])
    ]);
  }

  function equippedChip(entry, index, ctx) {
    ensureCss();
    var item = lib.byId(entry.titleId);
    if (!item) return null;
    var r = lib.rarity(item.rarity);

    var animSelect = el('select', {
      onchange: function (e) {
        var items = list().slice();
        items[index] = A.lang.normalize(A.config.defaults.title, Object.assign({}, items[index], { anim: e.target.value }));
        A.ui.state.set('cosmetics.titles', items);
        if (ctx) ctx.debouncedRefresh();
      }
    });
    [
      { value: 'site', label: 'Анимация как на сайте' },
      { value: 'none', label: 'Без анимации' }
    ].forEach(function (o) { animSelect.appendChild(el('option', { value: o.value, text: o.label })); });
    animSelect.value = entry.anim || 'site';

    var pill = lib.buildPill(lib.pillSpec(item, entry));
    if (pill) pill.removeAttribute('data-aonc-title');

    return el('div', { class: 'tp-chip' + (entry.enabled === false ? ' off' : '') }, [
      pill || el('span', { class: 'tp-fallback', text: item.name }),
      el('span', { class: 'tp-chip-meta' }, [
        el('b', { text: item.name }),
        el('small', { text: r.label + (item.label ? ' · ' + item.label : '') + (item.unlocked ? '' : ' · на сайте не выдан') })
      ]),
      el('span', { class: 'sp' }),
      animSelect,
      el('button', {
        class: 'mini', type: 'button', text: entry.enabled === false ? '👁' : '🚫',
        title: entry.enabled === false ? 'Включить титул' : 'Не показывать титул',
        onclick: function () {
          var items = list().slice();
          items[index] = A.lang.normalize(A.config.defaults.title, Object.assign({}, items[index], { enabled: entry.enabled === false }));
          A.ui.state.set('cosmetics.titles', items);
          if (ctx) ctx.refresh('cosmetics');
        }
      }),
      el('button', {
        class: 'mini', type: 'button', text: '✕', title: 'Снять титул',
        onclick: function () {
          persist(list().filter(function (t, i) { return i !== index; }), ctx);
        }
      })
    ]);
  }

  function render(def, ctx) {
    var items = list();
    var wrap = el('div', { class: 'titles-editor' });

    wrap.appendChild(el('div', { class: 'list-head' }, [
      el('b', { text: 'Титулы сайта' }),
      el('span', { class: 'badge', text: String(items.length) }),
      el('span', { class: 'sp' }),
      toggleRow('cosmetics.titlesOn', 'Показывать титулы', 'Рисовать экипированные титулы в ряду бейджей профиля', ctx)
    ]));

    wrap.appendChild(el('div', {
      class: 'hint-inline',
      text: 'Настоящие титулы из каталога сайта (' + lib.counts().total + ' шт., включая невыданные): пилюля с родными цветами, градиентом, свечением, иконкой и анимацией — один в один как на сайте. Это визуальный слой: реальные разблокировки не меняются.'
    }));

    wrap.appendChild(preview(ctx));

    if (!items.length) {
      wrap.appendChild(el('div', { class: 'empty', text: 'Титулы не экипированы. Выберите любой в каталоге ниже — даже тот, что на сайте не выдан.' }));
    }
    items.forEach(function (entry, index) {
      var chip = equippedChip(entry, index, ctx);
      if (chip) wrap.appendChild(chip);
    });
    if (items.length) {
      wrap.appendChild(el('div', { class: 'ctl-row' }, [
        el('button', {
          class: 'btn sm ghost', type: 'button', text: 'Снять все',
          onclick: function () { persist([], ctx); }
        })
      ]));
    }

    wrap.appendChild(el('div', { class: 'hub-sep' }));
    wrap.appendChild(A.ui.custom.titlesPicker(def, ctx));

    return wrap;
  }

  return { render: render };
});
