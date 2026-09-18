AONC.define('ui.custom.showcaseEditor', function (A) {
  'use strict';

  var el = A.ui.controls.el;
  var T = A.messaging.TYPE;

  function list() {
    return A.ui.state.get('cosmetics.showcase') || [];
  }

  function persist(next, ctx) {
    A.ui.state.set('cosmetics.showcase', next);
    if (next.length) A.ui.state.set('cosmetics.showcaseOn', true);
    if (ctx) ctx.refresh('cosmetics');
  }

  function update(index, patch, ctx) {
    var items = list().slice();
    items[index] = A.lang.normalize(A.config.defaults.showcaseItem, Object.assign({}, items[index], patch));
    A.ui.state.set('cosmetics.showcase', items);
    if (ctx) ctx.debouncedRefresh();
  }

  function move(index, dir, ctx) {
    var items = list().slice();
    var j = index + dir;
    if (j < 0 || j >= items.length) return;
    var t = items[index];
    items[index] = items[j];
    items[j] = t;
    persist(items, ctx);
  }

  function set(path, value, ctx, immediate) {
    A.ui.state.set('cosmetics.' + path, value);
    if (ctx) {
      if (immediate) ctx.refresh('cosmetics');
      else ctx.debouncedRefresh();
    }
  }

  function toggleRow(path, labelText, hint, ctx) {
    var input = el('input', {
      type: 'checkbox',
      checked: !!A.ui.state.get('cosmetics.' + path),
      onchange: function (e) { set(path, e.target.checked, ctx, true); }
    });
    return el('label', { class: 'sw' }, [
      input,
      el('span', { class: 'track' }),
      el('span', { class: 'sw-text', text: labelText, title: hint || '' })
    ]);
  }

  function field(labelText, control) {
    return el('label', { class: 'field' }, [el('span', { class: 'field-label', text: labelText }), control]);
  }

  function deepUnwrap(response) {
    var v = response;
    for (var i = 0; i < 4 && v && typeof v === 'object' && v.value !== undefined; i++) v = v.value;
    return (v && typeof v === 'object') ? v : {};
  }

  function newItem(patch) {
    return A.lang.normalize(A.config.defaults.showcaseItem, Object.assign({ id: A.lang.uid('sh') }, patch || {}));
  }

  function grab(ctx) {
    A.api.sendMessage(A.messaging.msg(T.SHOWCASE_GRAB)).then(function (response) {
      var data = deepUnwrap(response);
      if (data && data.grabbed && data.item) {
        persist(list().concat([newItem(data.item)]), ctx);
        A.ui.toast.ok('Постер добавлен в витрину');
        return;
      }
      var err = String((data && data.error) || '');
      if (err === 'no-tab' || err === 'no-response') A.ui.toast.error('Откройте страницу аниме на animeon.cc и повторите');
      else if (err === 'no-poster') A.ui.toast.error('На текущей странице сайта нет постера');
      else A.ui.toast.error('Не удалось забрать постер со страницы');
    }).catch(function () {
      A.ui.toast.error('Фон не отвечает — переоткройте студию');
    });
  }

  function thumb(item) {
    if (item.url && /^https?:\/\//i.test(String(item.url).trim())) {
      return el('img', {
        src: String(item.url).trim(), alt: '', referrerpolicy: 'no-referrer', loading: 'lazy',
        style: 'width:100%;height:100%;object-fit:cover;display:block;'
      });
    }
    return el('span', {
      style: 'margin:auto;opacity:.55;display:flex;',
      html: A.ui.icons.svgMarkup('image', 18)
    });
  }

  function card(item, index, total, ctx) {
    var on = item.enabled !== false;
    var box = el('div', { class: 'fitem' + (on ? '' : ' off') });

    box.appendChild(el('div', { class: 'fitem-head' }, [
      el('span', {
        class: 'fitem-prev',
        style: 'width:40px;height:56px;border-radius:7px;overflow:hidden;background:rgba(255,255,255,.05);' +
          'border:1px solid var(--line);display:flex;flex-shrink:0;'
      }, [thumb(item)]),
      el('span', { class: 'fitem-label' }, [
        el('b', { text: item.name || 'Без подписи' }),
        el('small', { class: 'mono', text: item.link || 'без ссылки' })
      ]),
      el('span', { class: 'sp' }),
      el('label', { class: 'sw', title: 'Показывать этот постер' }, [
        el('input', {
          type: 'checkbox', checked: on,
          onchange: function (e) { update(index, { enabled: e.target.checked }, ctx); }
        }),
        el('span', { class: 'track' })
      ]),
      el('button', {
        class: 'mini', type: 'button', text: '↑', title: 'Выше', disabled: index === 0,
        onclick: function () { move(index, -1, ctx); }
      }),
      el('button', {
        class: 'mini', type: 'button', text: '↓', title: 'Ниже', disabled: index === total - 1,
        onclick: function () { move(index, 1, ctx); }
      }),
      el('button', {
        class: 'mini danger', type: 'button', text: '✕', title: 'Убрать постер',
        onclick: function () {
          persist(list().filter(function (_, i) { return i !== index; }), ctx);
        }
      })
    ]));

    var grid = el('div', { class: 'fitem-grid' });
    grid.appendChild(field('Подпись', el('input', {
      type: 'text', value: item.name || '', placeholder: 'Название тайтла',
      oninput: function (e) { update(index, { name: e.target.value }, ctx); }
    })));
    grid.appendChild(field('Ссылка на постер', el('input', {
      type: 'text', class: 'mono', value: item.url || '', placeholder: 'https://…/poster.jpg',
      oninput: function (e) { update(index, { url: e.target.value }, ctx); }
    })));
    grid.appendChild(field('Ссылка на страницу', el('input', {
      type: 'text', class: 'mono', value: item.link || '', placeholder: '/anime/… или https://…',
      oninput: function (e) { update(index, { link: e.target.value }, ctx); }
    })));
    box.appendChild(grid);
    return box;
  }

  function render(def, ctx) {
    var items = list();
    var wrap = el('div', { class: 'showcase-editor frames-editor' });

    wrap.appendChild(el('div', { class: 'list-head' }, [
      el('b', { text: 'Витрина постеров' }),
      el('span', { class: 'badge', text: String(items.length) }),
      el('span', { class: 'sp' }),
      toggleRow('showcaseOn', 'Показывать в профиле', 'Блок постеров на странице профиля как витрина в Steam', ctx)
    ]));

    wrap.appendChild(el('div', {
      class: 'hint-inline',
      text: 'Сетка любимых постеров на странице профиля: тёмная панель, подписи и ссылки на тайтлы. ' +
        'Откройте страницу аниме на сайте и нажмите «Забрать со страницы» — постер, название и ссылка подставятся сами. ' +
        'Видите блок только вы; по умолчанию он показывается лишь в вашем профиле.'
    }));

    wrap.appendChild(el('div', { class: 'fe-row' }, [
      toggleRow('showcaseOnlyMine', 'Только мой профиль', 'Выключите, чтобы витрина появлялась и на чужих страницах /user/…', ctx),
      toggleRow('showcaseNames', 'Подписи под постерами', 'Название тайтла под каждой картинкой', ctx),
      field('Заголовок', el('input', {
        type: 'text', value: A.ui.state.get('cosmetics.showcaseTitle') || '', placeholder: 'Витрина постеров',
        oninput: function (e) { set('showcaseTitle', e.target.value, ctx); }
      })),
      (function () {
        var w = A.lang.num(A.ui.state.get('cosmetics.showcaseWidth'), 150);
        var out = el('output', { text: w + 'px' });
        var input = el('input', {
          type: 'range', min: '90', max: '240', step: '5', value: String(w),
          oninput: function () {
            out.textContent = input.value + 'px';
            set('showcaseWidth', Number(input.value), ctx);
          }
        });
        return el('label', { class: 'mini-row fe-field' }, [el('span', { text: 'Ширина постера' }), input, out]);
      })()
    ]));

    wrap.appendChild(el('div', { class: 'fl-head' }, [
      el('b', { text: 'Постеры' }),
      el('span', { class: 'sp' }),
      el('button', {
        class: 'btn sm', type: 'button', text: '⤓ Забрать со страницы',
        onclick: function () { grab(ctx); }
      }),
      el('button', {
        class: 'btn sm ghost', type: 'button', text: '＋ Постер',
        onclick: function () { persist(items.concat([newItem()]), ctx); }
      }),
      items.length ? el('button', {
        class: 'btn sm ghost', type: 'button', text: 'Очистить',
        onclick: function () {
          A.ui.state.set('cosmetics.showcase', []);
          if (ctx) ctx.refresh('cosmetics');
        }
      }) : null
    ]));

    if (!items.length) {
      wrap.appendChild(el('div', {
        class: 'empty',
        text: 'Постеров пока нет. Добавьте первый вручную или заберите со страницы аниме на сайте.'
      }));
      return wrap;
    }

    items.forEach(function (item, index) {
      wrap.appendChild(card(A.lang.normalize(A.config.defaults.showcaseItem, item), index, items.length, ctx));
    });

    return wrap;
  }

  return { render: render, list: list, persist: persist };
});
