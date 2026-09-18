AONC.define('ui.custom.snippetList', function (A) {
  'use strict';

  var el = A.ui.controls.el;

  function pathFor(kind) {
    return kind === 'js' ? 'custom.jsSnippets' : 'custom.cssSnippets';
  }

  function list(kind) {
    return A.ui.state.get(pathFor(kind)) || [];
  }

  function persist(kind, next) {
    A.ui.state.set(pathFor(kind), next);
  }

  function render(def, ctx) {
    var kind = def.kind || 'css';
    var items = list(kind);
    var wrap = el('div', { class: 'list' });

    var head = el('div', { class: 'list-head' }, [
      el('b', { text: kind === 'js' ? 'JS-сниппеты по URL' : 'CSS-сниппеты по URL' }),
      el('span', { class: 'sp' }),
      el('button', {
        class: 'btn sm', type: 'button', text: '＋ Добавить',
        onclick: function () {
          var next = items.concat([A.lang.normalize(A.config.defaults.snippet, {
            id: A.lang.uid(kind),
            name: kind === 'js' ? 'Новый скрипт' : 'Новый стиль',
            urlPatterns: [],
            body: ''
          })]);
          persist(kind, next);
          ctx.expandedSnippet = next[next.length - 1].id;
          ctx.refresh('custom');
        }
      })
    ]);
    wrap.appendChild(head);

    if (!items.length) {
      wrap.appendChild(el('div', {
        class: 'empty',
        text: kind === 'js'
          ? 'Сниппетов нет. Они позволяют запускать код только на определённых страницах, например /anime/*.'
          : 'Сниппетов нет. Так можно оформить отдельный раздел сайта, не трогая остальные.'
      }));
      return wrap;
    }

    items.forEach(function (item, index) {
      wrap.appendChild(card(kind, item, index, ctx));
    });

    return wrap;
  }

  function card(kind, item, index, ctx) {
    var expanded = ctx.expandedSnippet === item.id;

    var head = el('div', { class: 'list-item-head' }, [
      el('input', {
        type: 'checkbox', checked: !!item.enabled, title: 'Включено',
        onchange: function (e) { update(kind, index, { enabled: e.target.checked }, ctx); }
      }),
      el('button', {
        class: 'list-item-title', type: 'button',
        onclick: function () {
          ctx.expandedSnippet = expanded ? null : item.id;
          ctx.refresh('custom');
        }
      }, [
        el('b', { text: item.name || 'Без названия' }),
        el('code', { text: (item.urlPatterns || []).join(', ') || 'все страницы' })
      ]),
      el('span', { class: 'badge', text: (item.body || '').length + ' симв.' }),
      el('span', { class: 'sp' }),
      el('button', {
        class: 'mini danger', type: 'button', title: 'Удалить', text: '✕',
        onclick: function () {
          persist(kind, list(kind).filter(function (_, i) { return i !== index; }));
          ctx.refresh('custom');
        }
      })
    ]);

    var node = el('div', { class: 'list-item' + (item.enabled ? '' : ' off') }, [head]);
    if (expanded) node.appendChild(editor(kind, item, index, ctx));
    return node;
  }

  function editor(kind, item, index, ctx) {
    var body = el('div', { class: 'list-item-body' });

    body.appendChild(field('Название', el('input', {
      type: 'text', value: item.name || '',
      oninput: function (e) { update(kind, index, { name: e.target.value }, ctx); }
    })));

    body.appendChild(field('URL-шаблоны', el('input', {
      type: 'text', class: 'mono', placeholder: '/anime/*, /catalog, /^\\/(news|schedule)/',
      value: (item.urlPatterns || []).join(', '),
      oninput: function (e) { update(kind, index, { urlPatterns: A.css.pattern.normalizeList(e.target.value) }, ctx); }
    })));

    body.appendChild(field(kind === 'js' ? 'Код' : 'Стили', el('textarea', {
      class: 'mono code', rows: '10', spellcheck: 'false', value: item.body || '',
      oninput: function (e) { update(kind, index, { body: e.target.value }, ctx); }
    })));

    return body;
  }

  function field(labelText, control) {
    return el('label', { class: 'field' }, [el('span', { class: 'field-label', text: labelText }), control]);
  }

  function update(kind, index, patch, ctx) {
    var items = list(kind).slice();
    items[index] = Object.assign({}, items[index], patch);
    persist(kind, items);
    if (ctx) ctx.debouncedRefresh();
  }

  return { render: render, list: list, persist: persist, pathFor: pathFor };
});
