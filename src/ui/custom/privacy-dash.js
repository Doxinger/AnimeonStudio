AONC.define('ui.custom.privacyDash', function (A) {
  'use strict';

  var el = A.ui.controls.el;

  var KIND_LABELS = [
    ['tag', 'Скрипты, пиксели и теги', 'Tags & pixels'],
    ['fetch', 'Запросы fetch', 'fetch requests'],
    ['xhr', 'Запросы XHR', 'XHR requests'],
    ['beacon', 'sendBeacon', 'sendBeacon'],
    ['image', 'Изображения-трекеры', 'Tracking images']
  ];

  function t(key, fallback) {
    return A.ui.i18n.t(key, fallback);
  }

  function row(label, value) {
    return el('div', { class: 'pd-row' }, [
      el('span', { class: 'pd-num', text: String(value == null ? 0 : value) }),
      el('span', { class: 'pd-label', text: label })
    ]);
  }

  function hostsBlock(hosts) {
    var keys = Object.keys(hosts || {});
    if (!keys.length) {
      return el('span', { class: 'pd-label', text: t('pd.noHosts', 'Доменов пока не заблокировано') });
    }
    keys.sort(function (a, b) { return hosts[b] - hosts[a]; });
    return el('span', { class: 'pd-hosts' }, keys.slice(0, 12).map(function (k) {
      return el('span', { class: 'pd-host', text: k }, [el('b', { text: ' ' + hosts[k] })]);
    }));
  }

  function paint(body, stats) {
    body.innerHTML = '';
    if (!stats) {
      body.appendChild(el('div', {
        class: 'pd-label',
        text: t('pd.noTab', 'Нет открытой вкладки сайта — откройте animeon.cc и нажмите «Обновить»')
      }));
      return;
    }

    body.appendChild(row(t('pd.total', 'Всего заблокировано запросов'), stats.total));

    var kinds = stats.kinds || {};
    KIND_LABELS.forEach(function (pair) {
      if (!kinds[pair[0]]) return;
      body.appendChild(row(t('pd.kind.' + pair[0], pair[1]), kinds[pair[0]]));
    });

    body.appendChild(el('div', { class: 'pd-row pd-row--wide' }, [
      el('span', { class: 'pd-label', text: t('pd.hosts', 'Домены-счётчики') }),
      hostsBlock(stats.hosts)
    ]));

    if (stats.updated) {
      body.appendChild(el('div', {
        class: 'pd-label pd-updated',
        text: t('pd.updated', 'Обновлено') + ': ' + new Date(stats.updated).toLocaleString()
      }));
    }
  }

  function render(def, ctx) {
    var body = el('div', { class: 'pd-body' });
    var status = el('span', { class: 'pd-label pd-status', text: '' });

    function unwrap(response) {
      var v = response;
      for (var i = 0; i < 4 && v && typeof v === 'object' && v.value !== undefined; i++) v = v.value;
      return (v && typeof v === 'object') ? v : {};
    }

    function load() {
      status.textContent = t('pd.loading', 'загрузка…');
      A.api.sendMessage(A.messaging.msg(A.messaging.TYPE.PRIVACY_STATS, { action: 'get' })).then(function (response) {
        var data = unwrap(response);
        status.textContent = '';
        paint(body, data.noSiteTab ? null : data.stats);
      }).catch(function () {
        status.textContent = t('pd.error', 'не удалось получить данные');
      });
    }

    function reset() {
      A.api.sendMessage(A.messaging.msg(A.messaging.TYPE.PRIVACY_STATS, { action: 'reset' })).then(function (response) {
        paint(body, unwrap(response).stats || null);
        A.ui.toast.ok(t('pd.resetDone', 'Счётчики очищены'));
      }).catch(function () {
        A.ui.toast.error(t('pd.error', 'не удалось получить данные'));
      });
    }

    var wrap = el('div', { class: 'privacy-dash', id: (def && def.id) || 'privacy-dash' }, [
      el('div', { class: 'pd-actions' }, [
        el('button', { class: 'btn sm', type: 'button', text: t('pd.refresh', 'Обновить'), onclick: load }),
        el('button', { class: 'btn sm ghost', type: 'button', text: t('pd.reset', 'Сбросить счётчики'), onclick: reset }),
        status
      ]),
      body
    ]);

    load();
    return wrap;
  }

  return { render: render, paint: paint };
});
