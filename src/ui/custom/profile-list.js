AONC.define('ui.custom.profileList', function (A) {
  'use strict';

  var el = A.ui.controls.el;

  function render(def, ctx) {
    var wrap = el('div', { class: 'list' });
    wrap.appendChild(el('div', { class: 'empty', text: 'Загрузка профилей…' }));

    A.config.profiles.loadAll().then(function (profiles) {
      wrap.innerHTML = '';
      var activeId = A.ui.state.get('meta.activeProfile');

      if (!profiles.length) {
        wrap.appendChild(el('div', { class: 'empty', text: 'Профилей нет. Настройте внешний вид и сохраните его — снимок можно применить в один клик.' }));
        return;
      }

      profiles.forEach(function (profile) {
        var isActive = profile.id === activeId;
        var palette = A.color.palette.fromTheme(Object.assign({}, A.config.DEFAULTS.theme, profile.config.theme));

        var head = el('div', { class: 'list-item-head' }, [
          el('span', {
            class: 'dot-lg',
            style: 'background:linear-gradient(135deg,' + palette.background + ',' + palette.primary + ')'
          }),
          el('button', {
            class: 'list-item-title', type: 'button', title: 'Применить',
            onclick: function () {
              A.config.profiles.activate(profile.id).then(function (config) {
                A.ui.state.replace(config);
                A.ui.state.set('meta.activeProfile', profile.id);
                ctx.refreshAll();
                A.ui.toast.ok('Профиль «' + profile.name + '» применён');
              });
            }
          }, [
            el('b', { text: profile.name }),
            el('code', { text: fmtDate(profile.updatedAt || profile.createdAt) + ' · ' + (profile.config.theme.preset || 'custom') })
          ]),
          el('span', { class: 'sp' }),
          isActive ? el('span', { class: 'badge on', text: 'активен' }) : null,
          el('button', {
            class: 'mini', type: 'button', title: 'Применить', text: '→',
            onclick: function () {
              A.config.profiles.activate(profile.id).then(function (config) {
                A.ui.state.replace(config);
                A.ui.state.set('meta.activeProfile', profile.id);
                ctx.refreshAll();
                A.ui.toast.ok('Профиль применён');
              });
            }
          }),
          el('button', {
            class: 'mini danger', type: 'button', title: 'Удалить', text: '✕',
            onclick: function () {
              A.config.profiles.remove(profile.id).then(function () {
                ctx.refresh('profiles');
                A.ui.toast.ok('Профиль удалён');
              });
            }
          })
        ]);

        wrap.appendChild(el('div', { class: 'list-item' }, [head]));
      });
    });

    return wrap;
  }

  function fmtDate(ts) {
    if (!ts) return '';
    try {
      return new Date(ts).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  }

  return { render: render, fmtDate: fmtDate };
});
