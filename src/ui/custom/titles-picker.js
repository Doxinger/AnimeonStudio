AONC.define('ui.custom.titlesPicker', function (A) {
  'use strict';

  var el = A.ui.controls.el;
  var lib = A.config.titlesLib;

  var ui = { query: '', rarity: 'any', source: 'any', onlyFree: false, sort: 'order' };
  var grid = null;
  var counter = null;
  var busy = false;
  var ctxRef = null;

  function list() {
    return A.ui.state.get('cosmetics.titles') || [];
  }

  function equippedIds() {
    return list()
      .map(function (t) { return A.lang.normalize(A.config.defaults.title, t); })
      .filter(function (t) { return t.enabled !== false && t.titleId; })
      .map(function (t) { return t.titleId; });
  }

  function select(item, ctx) {
    var items = list();
    var has = items.some(function (t) { return t.titleId === item.id; });
    var next = has
      ? items.filter(function (t) { return t.titleId !== item.id; })
      : items.concat([lib.makeEntry(item)]);
    A.ui.state.setMany({
      'cosmetics.titles': next,
      'cosmetics.titlesOn': next.length > 0
    });
    if (ctx) ctx.refresh('cosmetics');
  }

  function chip(value, label, group) {
    var on = ui[group] === value;
    return el('button', {
      class: 'fchip' + (on ? ' on' : ''),
      type: 'button',
      text: label,
      onclick: function (e) {
        ui[group] = value;
        var row = e.target.closest('.fchips');
        if (row) {
          Array.prototype.forEach.call(row.children, function (c) { c.classList.remove('on'); });
          e.target.classList.add('on');
        }
        paint();
      }
    });
  }

  // Статичная пилюля-превью (без анимации — 32 живых карточки было бы тяжело),
  // анимация показывается в превью экипировки.
  function previewPill(item) {
    var pill = lib.buildPill(lib.pillSpec(item, { anim: 'none' }));
    if (pill) pill.removeAttribute('data-aonc-title');
    return pill || el('span', { class: 'tp-fallback', text: item.name });
  }

  function card(item, selected) {
    var r = lib.rarity(item.rarity);
    var anim = lib.parseAnim(item.anims);
    return el('button', {
      class: 'fcard tcard' + (selected ? ' on' : ''),
      type: 'button',
      title: item.name + ' · ' + r.label + (item.label ? ' · ' + item.label : '') +
        (item.unlocked ? '' : ' · на сайте не выдан') + (item.desc ? '\n' + item.desc : ''),
      onclick: function () { select(item, ctxRef); }
    }, [
      el('span', { class: 'fc-thumb tp-thumb r-' + item.rarity }, [
        previewPill(item),
        item.unlocked ? null : el('span', { class: 'fc-lock', text: '🔒' })
      ]),
      el('span', { class: 'fc-name', text: item.name }),
      el('span', { class: 'fc-meta' }, [
        el('i', { class: 'fc-dot', style: 'background:' + r.color }),
        el('span', { text: r.label }),
        anim.fx ? el('em', { text: '✦ ' + anim.tag }) : null
      ])
    ]);
  }

  function paint() {
    if (!grid) return;
    var items = lib.list({
      query: ui.query,
      rarity: ui.rarity,
      source: ui.source,
      unlockedOnly: ui.onlyFree,
      sort: ui.sort
    });
    var equipped = equippedIds();

    grid.textContent = '';
    items.forEach(function (item) {
      grid.appendChild(card(item, equipped.indexOf(item.id) !== -1));
    });
    if (!items.length) {
      grid.appendChild(el('div', { class: 'fc-empty', text: 'Ничего не найдено. Измените фильтр или запрос.' }));
    }
    if (counter) {
      counter.textContent = items.length + ' из ' + lib.counts().total + ' титулов сайта';
    }
  }

  function refreshCatalog(ctx) {
    if (busy) return;
    busy = true;
    A.api.sendMessage(A.messaging.msg(A.messaging.TYPE.CATALOG_REFRESH)).then(function (res) {
      busy = false;
      var value = A.messaging.unwrap(res);
      if (value && value.count) {
        A.ui.toast.ok('Каталог обновлён: ' + value.count + ' рамок, ' + (value.titlesCount || 0) + ' титулов');
      } else {
        A.ui.toast.info('Каталог уже актуален');
      }
      if (ctx) ctx.refresh('cosmetics');
    }).catch(function (e) {
      busy = false;
      A.ui.toast.error('Не удалось обновить каталог: ' + (e && e.message || e));
    });
  }

  function render(def, ctx) {
    ctxRef = ctx;
    var wrap = el('div', { class: 'frames-picker titles-picker' });
    var c = lib.counts();

    wrap.appendChild(el('div', { class: 'fp-head' }, [
      el('div', { class: 'fp-title' }, [
        el('b', { text: 'Каталог титулов сайта' }),
        el('span', { class: 'fp-sub', text: c.total + ' шт. · выдано вам: ' + c.unlocked })
      ]),
      el('span', { class: 'sp' }),
      el('button', {
        class: 'btn sm ghost', type: 'button', text: '⟳ Обновить с сайта',
        title: 'Загрузить свежий список титулов из /api/cosmetics/catalog',
        onclick: function () { refreshCatalog(ctx); }
      })
    ]));

    var search = el('input', {
      type: 'search', class: 'fp-search', placeholder: 'Поиск: герой, сакура, legendary…', value: ui.query,
      oninput: function (e) { ui.query = e.target.value; paint(); }
    });

    var rarityRow = el('div', { class: 'fchips' }, [chip('any', 'Любая', 'rarity')].concat(
      lib.RARITIES.map(function (r) { return chip(r.id, r.label, 'rarity'); })
    ));
    var sourceRow = el('div', { class: 'fchips' }, [chip('any', 'Все источники', 'source')].concat(
      lib.SOURCES.map(function (s) { return chip(s.id, s.label, 'source'); })
    ));

    var freeToggle = el('label', { class: 'fp-free' }, [
      el('input', {
        type: 'checkbox', checked: ui.onlyFree,
        onchange: function (e) { ui.onlyFree = e.target.checked; paint(); }
      }),
      el('span', { text: 'Только выданные мне' })
    ]);

    var sortSelect = el('select', {
      onchange: function (e) { ui.sort = e.target.value; paint(); }
    });
    [
      { value: 'order', label: 'По порядку сайта' },
      { value: 'rarity', label: 'По редкости' },
      { value: 'name', label: 'По алфавиту' }
    ].forEach(function (o) { sortSelect.appendChild(el('option', { value: o.value, text: o.label })); });
    sortSelect.value = ui.sort;

    wrap.appendChild(el('div', { class: 'fp-controls' }, [search, freeToggle, sortSelect]));
    wrap.appendChild(rarityRow);
    wrap.appendChild(sourceRow);

    counter = el('div', { class: 'fp-count', text: '' });
    grid = el('div', { class: 'fgrid tgrid' });
    wrap.appendChild(counter);
    wrap.appendChild(grid);
    paint();

    return wrap;
  }

  return { render: render, paint: paint, select: select, state: ui };
});
