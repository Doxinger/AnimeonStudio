AONC.define('ui.custom.framesPicker', function (A) {
  'use strict';

  var el = A.ui.controls.el;
  var lib = A.config.framesLib;

  var ui = { query: '', rarity: 'any', source: 'any', onlyFree: false, sort: 'order' };
  var grid = null;
  var counter = null;
  var busy = false;
  var ctxRef = null;

  function list() {
    return A.ui.state.get('cosmetics.frames') || [];
  }

  function persist(next, ctx) {
    A.ui.state.set('cosmetics.frames', next);
    if (ctx) ctx.refresh('cosmetics');
  }

  function isCustom(frame) {
    return !frame.frameId && !!String(frame.url || '').trim();
  }

  function selectedId() {
    var entry = list().filter(function (f) { return f.frameId; })[0];
    return entry ? entry.frameId : '';
  }

  function select(item, ctx) {
    var items = list();
    var current = selectedId();
    var stack = A.ui.state.get('cosmetics.framesMode') === 'stack';
    var next;

    if (stack) {
      var has = items.some(function (f) { return f.frameId === item.id; });
      if (has) {
        next = items.filter(function (f) { return f.frameId !== item.id; });
      } else {
        next = items.concat([lib.makeEntry(item)]);
      }
    } else if (current === item.id) {
      next = items.filter(function (f) { return f.frameId !== item.id; });
    } else {
      next = items.filter(isCustom).concat([lib.makeEntry(item)]);
    }

    A.ui.state.set('cosmetics.framesOn', next.length > 0);
    persist(next, ctx);
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

  function card(item, selected) {
    var r = lib.rarity(item.rarity);
    var preview = item.type === 'image'
      ? el('img', { class: 'fc-img', src: lib.thumb(item, 256), alt: '', loading: 'lazy' })
      : el('span', {
        class: 'fc-css',
        html: A.ui.custom.framesPreview.stage({
          face: 44,
          frames: [{ frameId: item.id, enabled: true }]
        }).outerHTML
      });

    return el('button', {
      class: 'fcard' + (selected ? ' on' : ''),
      type: 'button',
      title: item.name + ' · ' + r.label + (item.label ? ' · ' + item.label : '') + (item.unlocked ? '' : ' · на сайте не выдана'),
      onclick: function () { select(item, ctxRef); }
    }, [
      el('span', { class: 'fc-thumb r-' + item.rarity }, [
        preview,
        item.unlocked ? null : el('span', { class: 'fc-lock', text: '🔒' })
      ]),
      el('span', { class: 'fc-name', text: item.name }),
      el('span', { class: 'fc-meta' }, [
        el('i', { class: 'fc-dot', style: 'background:' + r.color }),
        el('span', { text: r.label }),
        item.label ? el('em', { text: item.label }) : null
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
    var current = selectedId();
    var stacked = list().filter(function (f) { return f.frameId; }).map(function (f) { return f.frameId; });

    grid.textContent = '';
    var stack = A.ui.state.get('cosmetics.framesMode') === 'stack';
    items.forEach(function (item) {
      grid.appendChild(card(item, stack ? stacked.indexOf(item.id) !== -1 : current === item.id));
    });
    if (!items.length) {
      grid.appendChild(el('div', { class: 'fc-empty', text: 'Ничего не найдено. Измените фильтр или запрос.' }));
    }
    if (counter) {
      var c = lib.counts();
      counter.textContent = items.length + ' из ' + c.total + ' рамок сайта';
    }
  }

  function refreshCatalog(ctx) {
    if (busy) return;
    busy = true;
    A.api.sendMessage(A.messaging.msg(A.messaging.TYPE.CATALOG_REFRESH)).then(function (res) {
      busy = false;
      var value = A.messaging.unwrap(res);
      if (value && value.count) {
        A.ui.toast.ok('Каталог обновлён: ' + value.count + ' рамок' +
          (value.titlesCount ? ', ' + value.titlesCount + ' титулов' : ''));
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
    var wrap = el('div', { class: 'frames-picker' });
    var c = lib.counts();

    wrap.appendChild(el('div', { class: 'fp-head' }, [
      el('div', { class: 'fp-title' }, [
        el('b', { text: 'Каталог рамок сайта' }),
        el('span', { class: 'fp-sub', text: c.total + ' шт. · ' + c.image + ' картинок · ' + c.css + ' колец' })
      ]),
      el('span', { class: 'sp' }),
      el('button', {
        class: 'btn sm ghost', type: 'button', text: '⟳ Обновить с сайта',
        title: 'Загрузить свежий список рамок из /api/cosmetics/catalog',
        onclick: function () { refreshCatalog(ctx); }
      })
    ]));

    var search = el('input', {
      type: 'search', class: 'fp-search', placeholder: 'Поиск: Хошино, сакура, gold…', value: ui.query,
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
    grid = el('div', { class: 'fgrid' });
    wrap.appendChild(counter);
    wrap.appendChild(grid);
    paint();

    return wrap;
  }

  return { render: render, paint: paint, select: select, state: ui };
});
