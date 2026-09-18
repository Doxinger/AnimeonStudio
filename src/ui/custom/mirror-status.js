// Виджет «Зеркала»: статус доступности доменов сайта прямо в студии.
// Данные берём у фона (MIRRORS_STATUS), а если фон недоступен — опрашиваем сами.
AONC.define('ui.custom.mirrorStatus', function (A) {
  'use strict';

  var el = A.ui.controls.el;
  var mirrors = A.config.mirrors;

  function stateText(r) {
    if (!r) return 'нет данных';
    if (r.state === 'ok') return 'отвечает' + (r.ms ? ' · ' + r.ms + ' мс' : '');
    if (r.state === 'warn') return 'HTTP ' + r.status + (r.ms ? ' · ' + r.ms + ' мс' : '');
    if (r.state === 'timeout') return 'таймаут';
    if (r.state === 'unreachable') return 'недоступно';
    if (r.state === 'down') return 'ошибка ' + (r.status || 'сервера');
    return 'не проверено';
  }

  function render() {
    var wrap = el('div', { class: 'mstat' });
    var list = el('div', { class: 'mstat-list' });
    var note = el('div', { class: 'mstat-note', text: 'Нажмите «Проверить», чтобы опросить зеркала.' });
    var busy = false;

    function rows(results, pending) {
      list.textContent = '';
      var byHost = {};
      (results || []).forEach(function (r) { byHost[r.host] = r; });

      mirrors.LIST.forEach(function (meta) {
        var r = byHost[meta.host];
        list.appendChild(el('div', { class: 'mstat-row' }, [
          el('span', { class: 'mstat-dot ' + (pending ? 'pending' : (r ? r.state : 'unknown')) }),
          el('span', { class: 'mstat-host' }, [
            el('b', { text: meta.host }),
            el('i', { text: meta.recommended ? 'рекомендуем' : (meta.note || '') })
          ]),
          el('span', { class: 'mstat-st', text: pending ? 'опрос…' : stateText(r) }),
          el('a', {
            class: 'mstat-go', href: mirrors.url(meta.host, '/'),
            target: '_blank', rel: 'noopener', text: 'открыть'
          })
        ]));
      });
    }

    function probe() {
      if (busy) return;
      busy = true;
      note.textContent = 'Опрашиваем зеркала…';
      rows(null, true);

      function finish(snap) {
        busy = false;
        rows(snap && snap.results, false);
        if (!snap) {
          note.textContent = 'Фон не ответил и прямой опрос не удался: нет сети или зеркала заблокированы.';
          return;
        }
        note.textContent = snap.aliveCount
          ? 'Живых зеркал: ' + snap.aliveCount + ' из ' + mirrors.LIST.length + '. Плашка предложит ' +
            (snap.best || mirrors.RECOMMENDED) + '.'
          : 'Ни одно зеркало не ответило. Включите VPN или проверьте сеть.';
      }

      A.api.sendMessage(A.messaging.msg(A.messaging.TYPE.MIRRORS_STATUS, { force: true, refresh: true }))
        .then(function (response) {
          var value = null;
          try { value = A.messaging.unwrap(response); } catch (e) { value = null; }
          if (value && value.results) { finish(value); return; }
          return mirrors.probeAll({ refresh: true }).then(finish, function () { finish(null); });
        }, function () {
          return mirrors.probeAll({ refresh: true }).then(finish, function () { finish(null); });
        });
    }

    wrap.appendChild(el('div', { class: 'mstat-head' }, [
      el('b', { text: 'Доступность зеркал' }),
      el('span', { class: 'sp' }),
      el('button', { class: 'btn sm', type: 'button', text: 'Проверить', onclick: probe })
    ]));
    wrap.appendChild(list);
    wrap.appendChild(note);

    var known = mirrors.cached();
    if (known) rows(known.results, false);
    else rows(null, false);

    return wrap;
  }

  return { render: render, stateText: stateText };
});
