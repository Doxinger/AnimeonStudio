// Лента изменений студии: что правили, когда, и откат в один клик.
// Данные берёт из ui.history (снапшоты переживают перезагрузку студии).
AONC.define('ui.custom.historyList', function (A) {
  'use strict';

  var el = A.ui.controls.el;
  var LIMIT = 12;

  function apply(index, ctx) {
    var before = A.ui.history.jump(index);
    if (!before) return;
    A.ui.state.replace(before);
    A.ui.state.save();
    if (ctx && ctx.refreshAll) ctx.refreshAll();
    else if (ctx && ctx.refresh) ctx.refresh(ctx.activeSection ? ctx.activeSection() : null);
    A.ui.toast.info('Откатились на ' + (index + 1) + ' шага(ов) назад');
  }

  function render(def, ctx) {
    var items = A.ui.history.entries().slice(0, LIMIT);
    var wrap = el('div', { class: 'hist' });

    wrap.appendChild(el('div', { class: 'list-head' }, [
      el('b', { text: 'Лента изменений' }),
      el('span', {
        class: 'badge' + (items.length ? ' on' : ''),
        text: String(A.ui.history.depth().undo)
      }),
      el('span', { class: 'sp' }),
      el('span', {
        class: 'hint-inline',
        text: A.ui.history.isPersistent()
          ? 'История сохраняется между перезагрузками студии · Ctrl+Z — шаг назад'
          : 'История доступна только в этой сессии'
      }),
      items.length ? el('button', {
        class: 'mini danger', type: 'button', text: '✕', title: 'Очистить историю',
        onclick: function () {
          A.ui.history.clear();
          if (ctx && ctx.refresh) ctx.refresh(ctx.activeSection ? ctx.activeSection() : 'help');
        }
      }) : null
    ]));

    if (!items.length) {
      wrap.appendChild(el('div', {
        class: 'empty',
        text: 'Правок ещё не было. Каждое изменение настройки попадает сюда вместе со временем — отсюда можно откатиться сразу на несколько шагов.'
      }));
      return wrap;
    }

    var list = el('div', { class: 'hist-list' });
    items.forEach(function (item) {
      list.appendChild(el('div', { class: 'hist-item' }, [
        el('span', { class: 'hist-time', text: item.time || '—' }),
        el('span', { class: 'hist-label', text: item.label, title: item.key || item.label }),
        el('span', { class: 'sp' }),
        el('button', {
          class: 'mini', type: 'button', text: '↩ сюда',
          title: 'Вернуть состояние до этого изменения',
          onclick: function () { apply(item.index, ctx); }
        })
      ]));
    });
    wrap.appendChild(list);

    if (A.ui.history.depth().undo > LIMIT) {
      wrap.appendChild(el('div', {
        class: 'hint-inline',
        text: 'Показаны последние ' + LIMIT + ' из ' + A.ui.history.depth().undo
      }));
    }

    return wrap;
  }

  return { render: render, apply: apply };
});
