AONC.define('ui.custom.favoritesList', function (A) {
  'use strict';

  var el = A.ui.controls.el;

  function findDef(path) {
    var entries = A.ui.studioSearch.entries();
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].control.path === path) return entries[i];
    }
    return null;
  }

  function render(def, ctx) {
    var paths = A.ui.favorites.list();
    var wrap = el('div', { class: 'fav-view' });

    if (!paths.length) {
      wrap.appendChild(el('div', {
        class: 'empty',
        text: 'В избранном пусто. Наведите курсор на любой контрол и нажмите звёздочку справа — он появится здесь.'
      }));
      return wrap;
    }

    paths.forEach(function (path) {
      var entry = findDef(path);
      if (!entry) {
        wrap.appendChild(el('div', { class: 'fav-missing' }, [
          el('code', { text: path }),
          el('span', { class: 'sp' }),
          el('button', {
            class: 'mini danger', type: 'button', text: '✕', title: 'Убрать из избранного',
            onclick: function () {
              A.ui.favorites.remove(path);
              ctx.refresh('favorites');
            }
          })
        ]));
        return;
      }

      var card = el('div', { class: 'fav-item' });
      var crumb = el('div', { class: 'search-crumb' });
      var ic = A.ui.icons.el(A.ui.icons.SECTION_MAP[entry.section.id] || '', 13, 'ic-crumb');
      if (ic) crumb.appendChild(ic);
      crumb.appendChild(el('span', { text: entry.section.label }));
      if (entry.group) crumb.appendChild(el('span', { class: 'dim', text: ' / ' + entry.group.title }));
      crumb.appendChild(el('span', { class: 'sp' }));
      crumb.appendChild(el('button', {
        class: 'mini', type: 'button', text: '→', title: 'Перейти в раздел',
        onclick: function () {
          if (ctx.jump) ctx.jump(entry.section.id);
        }
      }));
      crumb.appendChild(el('button', {
        class: 'mini danger', type: 'button', text: '✕', title: 'Убрать из избранного',
        onclick: function () {
          A.ui.favorites.remove(path);
          ctx.refresh('favorites');
        }
      }));
      card.appendChild(crumb);

      var node = A.ui.renderer.renderControl(entry.control, ctx);
      if (node) card.appendChild(node);
      wrap.appendChild(card);
    });

    return wrap;
  }

  return { render: render, findDef: findDef };
});
