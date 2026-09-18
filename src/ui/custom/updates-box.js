// Плашка проверки обновлений в «Профили и данные»: текущая версия, результат
// последней проверки, ссылка на файл релиза и кнопка «Проверить сейчас».
// Автоустановки нет и не будет: только информация + ссылка.
AONC.define('ui.custom.updatesBox', function (A) {
  'use strict';

  var el = A.ui.controls.el;

  function fmtTime(ts) {
    if (!ts) return '—';
    try {
      var d = new Date(ts);
      return d.toLocaleString();
    } catch (e) {
      return String(ts);
    }
  }

  function render(def, ctx) {
    var wrap = el('div', { class: 'updates-box', style: 'display:flex;flex-direction:column;gap:10px' });

    var statusNode = el('div', {
      class: 'hint',
      style: 'line-height:1.6',
      text: 'Запрашиваем статус обновлений…'
    });
    wrap.appendChild(statusNode);

    var row = el('div', { class: 'ctl-row', style: 'display:flex;gap:8px;align-items:center;flex-wrap:wrap' });

    var urlInput = el('input', {
      type: 'text',
      class: 'fp-search',
      style: 'flex:1 1 260px;max-width:420px',
      placeholder: A.DEFAULT_UPDATE_URL,
      value: A.ui.state.get('meta.updateUrl') || '',
      oninput: function (e) {
        A.ui.state.set('meta.updateUrl', e.target.value.trim());
      }
    });

    var busy = false;
    var checkBtn = el('button', {
      class: 'btn sm', type: 'button', text: '⟳ Проверить сейчас',
      onclick: function () {
        if (busy) return;
        busy = true;
        checkBtn.disabled = true;
        A.api.sendMessage(A.messaging.msg(A.messaging.TYPE.UPDATES_CHECK)).then(function (res) {
          busy = false;
          checkBtn.disabled = false;
          var st = null;
          try { st = A.messaging.unwrap(res); } catch (e) { st = null; }
          if (!st) {
            A.ui.toast.error('Фон не ответил — переоткройте студию (F5)');
            return;
          }
          paint(st);
          if (st.available) A.ui.toast.ok('Доступна новая версия: v' + st.latest);
          else if (st.error) A.ui.toast.error('Проверка не удалась: ' + st.error);
          else A.ui.toast.ok('Обновлений нет');
        }, function () {
          busy = false;
          checkBtn.disabled = false;
          A.ui.toast.error('Проверка не удалась');
        });
      }
    });

    row.appendChild(urlInput);
    row.appendChild(checkBtn);
    wrap.appendChild(row);
    wrap.appendChild(el('div', {
      class: 'hint',
      text: 'Адрес JSON-файла с версией релиза (пусто — адрес по умолчанию). Расширение только сообщает о новой версии и даёт ссылку на файл — установка всегда вручную.'
    }));

    function paint(st) {
      statusNode.textContent = '';
      if (!st) {
        statusNode.textContent = 'Данных пока нет — нажмите «Проверить сейчас».';
        return;
      }
      var lines = ['Установлена версия: <b>v' + A.lang.escapeHtml(st.current) + '</b>'];
      if (st.available) {
        lines.push('Доступна новая версия: <b>v' + A.lang.escapeHtml(st.latest) + '</b> — автоустановка не выполняется');
        if (st.xpi) {
          lines.push('<a href="' + A.lang.escapeHtml(st.xpi) + '" target="_blank" rel="noreferrer">Скачать файл обновления</a>');
        }
        if (st.notes) {
          lines.push('<a href="' + A.lang.escapeHtml(st.notes) + '" target="_blank" rel="noreferrer">Что нового в релизе</a>');
        }
      } else if (st.latest) {
        lines.push('Вы на актуальной версии (последняя известная: v' + A.lang.escapeHtml(st.latest) + ')');
      } else {
        lines.push('Проверок ещё не было');
      }
      lines.push('Последняя проверка: ' + A.lang.escapeHtml(fmtTime(st.checkedAt)));
      if (st.error) lines.push('⚠ Ошибка последней проверки: ' + A.lang.escapeHtml(st.error));
      statusNode.innerHTML = lines.join('<br>');
    }

    A.api.sendMessage(A.messaging.msg(A.messaging.TYPE.UPDATES_STATUS)).then(function (res) {
      var st = null;
      try { st = A.messaging.unwrap(res); } catch (e) { st = null; }
      paint(st);
    }, function () {
      paint(null);
    });

    return wrap;
  }

  return { render: render };
});
