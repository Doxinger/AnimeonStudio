AONC.define('ui.custom.diagnostics', function (A) {
  'use strict';

  var el = A.ui.controls.el;

  function render() {
    var wrap = el('div', { class: 'diag' });
    var out = el('pre', { class: 'mono diag-out', text: 'Нажмите «Собрать», чтобы опросить активную вкладку.' });
    var status = el('div', { class: 'diag-status' });

    function collect() {
      out.textContent = 'Опрос…';
      A.api.sendMessage(A.messaging.msg(A.messaging.TYPE.DIAGNOSTICS)).then(function (response) {
        var outer = A.messaging.unwrap(response || {}) || {};

        if (outer.noSiteTab) {
          out.textContent = 'Нет открытых вкладок animeon.cc (или зеркал). Откройте сайт и нажмите «Собрать» снова.';
          status.textContent = '';
          return;
        }

        var inner = outer.result || {};
        var value = inner.value || inner;

        if (!value || value.modules == null) {
          out.textContent = 'Вкладка сайта не ответила: контент-скрипт не внедрён или умер после перезагрузки расширения. Обновите вкладку сайта (F5).' +
            (outer.tabUrl ? '\nПроверенная вкладка: ' + outer.tabUrl : '');
          status.textContent = '';
          return;
        }

        out.textContent = JSON.stringify(value, null, 2);

        var wp = value.wallpaper || {};
        var layer = !wp.enabled ? 'выкл'
          : (wp.pseudoBackgroundImage && wp.pseudoBackgroundImage !== 'none') ? 'слой есть'
          : (wp.healLayerActive ? 'слой (fallback)' : 'НЕТ СЛОЯ');
        status.textContent = 'Модулей: ' + (value.modules || '?') +
          ' · CSS: ' + (value.styleBytes || 0) + ' байт' +
          ' · обои: ' + layer;
      }).catch(function (e) {
        out.textContent = 'Ошибка опроса: ' + ((e && e.message) || e) +
          '. Обновите вкладку сайта (F5) и нажмите «Собрать» снова.';
        status.textContent = '';
      });
    }

    wrap.appendChild(el('div', { class: 'diag-head' }, [
      el('b', { text: 'Диагностика' }),
      el('span', { class: 'sp' }),
      el('button', { class: 'btn sm', type: 'button', text: 'Собрать', onclick: collect }),
      el('button', {
        class: 'mini', type: 'button', text: '⧉', title: 'Скопировать',
        onclick: function () {
          if (navigator.clipboard) navigator.clipboard.writeText(out.textContent).catch(function () {});
        }
      })
    ]));
    wrap.appendChild(status);
    wrap.appendChild(out);
    return wrap;
  }

  return { render: render };
});
