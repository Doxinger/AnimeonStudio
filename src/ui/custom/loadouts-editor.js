AONC.define('ui.custom.loadoutsEditor', function (A) {
  'use strict';

  var el = A.ui.controls.el;

  function list() {
    return A.ui.state.get('cosmetics.loadouts') || [];
  }

  function persist(next) {
    A.ui.state.set('cosmetics.loadouts', next);
  }

  function render(def, ctx) {
    var wrap = el('div', { class: 'loadouts' });
    var items = list();
    var activeId = A.ui.state.get('meta.activeLoadout');

    wrap.appendChild(el('div', { class: 'list-head' }, [
      el('b', { text: 'Комплекты (бейджи + рамки)' }),
      el('span', { class: 'badge', text: String(items.length) }),
      el('span', { class: 'sp' }),
      el('button', {
        class: 'btn sm primary', type: 'button', text: '＋ Сохранить текущий',
        onclick: function () {
          var name = window.prompt('Название комплекта', 'Комплект ' + (items.length + 1));
          if (name == null) return;
          var entry = A.config.loadouts.make(A.ui.state.current(), String(name).trim() || 'Комплект');
          persist(list().concat([entry]));
          A.ui.state.set('meta.activeLoadout', entry.id);
          A.ui.toast.ok('Комплект «' + entry.name + '» сохранён');
          ctx.refresh('cosmetics');
        }
      })
    ]));

    if (!items.length) {
      wrap.appendChild(el('div', {
        class: 'empty',
        text: 'Комплект — это снимок бейджей и рамок. Настройте их, сохраните комплект и переключайтесь в один клик (или через шестерёнку на сайте).'
      }));
      return wrap;
    }

    items.forEach(function (loadout, index) {
      var isActive = loadout.id === activeId;
      var counts = (loadout.cosmetics.badges || []).length + ' бейджей / ' +
        (loadout.cosmetics.titles || []).length + ' титулов / ' +
        (loadout.cosmetics.frames || []).length + ' рамок';
      wrap.appendChild(el('div', { class: 'badge-card' + (isActive ? ' on' : '') }, [
        el('div', { class: 'badge-card-head' }, [
          el('span', { class: 'loadout-ico', text: '◆' }),
          el('div', { class: 'catalog-lb' }, [
            el('b', { text: loadout.name || 'Комплект' }),
            el('small', { text: counts })
          ]),
          el('span', { class: 'sp' }),
          isActive ? el('span', { class: 'badge on', text: 'активен' }) : null,
          el('button', {
            class: 'btn sm', type: 'button', text: 'Применить',
            onclick: function () { applyLoadout(loadout, ctx); }
          }),
          el('button', {
            class: 'mini danger', type: 'button', text: '✕', title: 'Удалить',
            onclick: function () {
              persist(list().filter(function (_, i) { return i !== index; }));
              if (A.ui.state.get('meta.activeLoadout') === loadout.id) A.ui.state.set('meta.activeLoadout', '');
              ctx.refresh('cosmetics');
            }
          })
        ])
      ]));
    });

    return wrap;
  }

  function applyLoadout(loadout, ctx) {
    var next = A.config.loadouts.applyTo(A.ui.state.current(), loadout);
    A.ui.state.setMany({
      cosmetics: next.cosmetics,
      'meta.activeLoadout': loadout.id
    });
    A.ui.toast.ok('Комплект «' + (loadout.name || '') + '» применён');
    ctx.refreshAll();
  }

  return { render: render, applyLoadout: applyLoadout };
});
