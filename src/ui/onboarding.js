AONC.define('ui.onboarding', function (A) {
  'use strict';

  var el = A.ui.controls.el;

  function shouldShow() {
    return !A.ui.state.get('meta.onboarded');
  }

  function render(ctx) {
    if (!shouldShow()) return null;

    var wrap = el('div', { class: 'onboard' }, [
      el('div', { class: 'onboard-head' }, [
        el('b', { text: 'Добро пожаловать в AnimeOn Studio' }),
        el('span', { class: 'sp' }),
        el('button', {
          class: 'mini', type: 'button', text: '✕', title: 'Больше не показывать',
          onclick: function () { dismiss(ctx); }
        })
      ]),
      el('ol', { class: 'onboard-steps' }, [
        el('li', { html: 'Выберите пресет или соберите палитру в разделе <b>Тема</b>; понравившееся сохраните кнопкой «＋ Сохранить текущую».' }),
        el('li', { html: 'Поставьте фон: группа <b>Фоновое изображение</b> — пресет-узор, ссылка или свой файл.' }),
        el('li', { html: 'Уберите лишнее: <b>Скрыть блоки</b> или пипетка <span class="kbd">Alt+Shift+P</span> прямо на сайте.' }),
        el('li', { html: 'Любой контрол можно добавить в <b>Избранное</b> звёздочкой, а изменения отменить через <span class="kbd">Ctrl+Z</span>.' })
      ]),
      el('div', { class: 'onboard-actions' }, [
        el('button', {
          class: 'btn sm primary', type: 'button', text: '⬚ Открыть пипетку на сайте',
          onclick: function () { A.ui.actions.run('picker-start', ctx); }
        }),
        el('button', {
          class: 'btn sm', type: 'button', text: 'Открыть animeon.cc',
          onclick: function () { window.open(A.siteUrl('/'), '_blank', 'noopener'); }
        }),
        el('span', { class: 'sp' }),
        el('button', {
          class: 'btn sm ghost', type: 'button', text: 'Понятно',
          onclick: function () { dismiss(ctx); }
        })
      ])
    ]);

    return wrap;
  }

  function dismiss(ctx) {
    A.ui.state.set('meta.onboarded', true);
    if (ctx && ctx.refresh) ctx.refresh(activeSectionId(ctx));
  }

  function activeSectionId(ctx) {
    return (ctx && ctx.activeSection) ? ctx.activeSection() : 'theme';
  }

  return { render: render, shouldShow: shouldShow, dismiss: dismiss };
});
