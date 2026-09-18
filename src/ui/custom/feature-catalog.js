AONC.define('ui.custom.featureCatalog', function (A) {
  'use strict';

  var el = A.ui.controls.el;

  function render(def, ctx) {
    var wrap = el('div', { class: 'catalog' });
    var config = A.ui.state.current();
    var groups = A.config.features.groupBySection();
    var query = (def && def.query) || '';

    wrap.appendChild(el('div', { class: 'list-head' }, [
      el('b', { text: 'Каталог фич' }),
      el('span', { class: 'badge', text: String(A.config.features.FEATURES.length) }),
      el('span', { class: 'sp' }),
      el('input', {
        type: 'text', class: 'catalog-search', placeholder: 'Фильтр по названию…', value: query,
        oninput: function (e) {
          def.query = e.target.value;
          ctx.debouncedRefresh();
        }
      })
    ]));

    var q = String(query || '').toLowerCase().trim();

    A.ui.sections.ORDER.forEach(function (sectionId) {
      var list = groups[sectionId] || [];
      if (!list.length) return;
      var filtered = list.filter(function (f) {
        if (!q) return true;
        return (f.label + ' ' + f.desc).toLowerCase().indexOf(q) !== -1;
      });
      if (!filtered.length) return;

      var section = A.ui.sections.byId(sectionId);
      var block = el('div', { class: 'catalog-group' }, [
        el('div', { class: 'catalog-group-title' }, [
          A.ui.icons.sectionIcon(sectionId, section ? section.icon : '•', 14),
          el('span', { text: section ? section.label : sectionId })
        ])
      ]);

      filtered.forEach(function (f) {
        var on = A.config.features.get(config, f);
        var row = el('div', { class: 'catalog-item' + (on ? ' on' : '') }, [
          el('label', { class: 'sw' }, [
            el('input', {
              type: 'checkbox', checked: on,
              onchange: function (e) { toggleFeature(f, e.target.checked, ctx); }
            }),
            el('span', { class: 'track' })
          ]),
          el('div', { class: 'catalog-lb' }, [
            el('b', { text: f.label }),
            el('small', { text: f.desc })
          ]),
          el('button', {
            class: 'mini', type: 'button', text: '→', title: 'Открыть раздел',
            onclick: function () { if (ctx.jump) ctx.jump(sectionId); }
          })
        ]);
        block.appendChild(row);
      });

      wrap.appendChild(block);
    });

    return wrap;
  }

  function toggleFeature(f, value, ctx) {
    var config = A.ui.state.current();
    var clone = A.lang.clone(config);
    A.config.features.apply(clone, f, value);
    var changes = {};
    ['theme', 'wallpaper', 'typography', 'glass', 'layout', 'player', 'visibility', 'privacy', 'performance', 'meta'].forEach(function (k) {
      if (JSON.stringify(clone[k]) !== JSON.stringify(config[k])) changes[k] = clone[k];
    });
    A.ui.state.setMany(changes);
    A.ui.toast.info((value ? 'Включено: ' : 'Выключено: ') + f.label);
    ctx.refreshAll();
  }

  return { render: render, toggleFeature: toggleFeature };
});
