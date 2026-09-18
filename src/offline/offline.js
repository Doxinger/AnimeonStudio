/*! AnimeOn Studio — страница-плашка «сайт не открывается» (offline/offline.html) */
(function () {
  'use strict';

  var A = window.AONC;
  if (!A || !A.config || !A.config.mirrors) return;

  var mirrors = A.config.mirrors;
  var store = A.config.store;

  var TONE_TEXT = {
    vpn: {
      title: 'Сайт не открывается',
      desc: 'Похоже, провайдер блокирует домен или сеть недоступна. Включите VPN или перейдите на другое зеркало — настройки и темы расширения работают на любом из них.'
    },
    net: {
      title: 'Нет соединения',
      desc: 'Браузер не смог выйти в сеть. Проверьте подключение к интернету и повторите попытку — или откройте зеркало, когда сеть появится.'
    },
    cert: {
      title: 'Проблема с сертификатом',
      desc: 'Браузер не доверяет сертификату сайта. Такое бывает при сбоях у провайдера или вмешательстве в трафик. Попробуйте зеркало или зайдите позже.'
    },
    server: {
      title: 'Сайт отвечает ошибкой',
      desc: 'Сервер принял запрос, но вернул ошибку. Обычно это проходит само — повторите попытку или откройте зеркало.'
    },
    other: {
      title: 'Сайт не открылся',
      desc: 'Включите VPN или перейдите на другое зеркало — расширение продолжит работать там же, где вы остановились.'
    }
  };

  var params = new URLSearchParams(location.search || '');
  var rawUrl = params.get('url') || '';
  var rawErr = params.get('err') || '';
  var rawKind = params.get('kind') || '';
  var rawSrc = params.get('src') || '';

  var original = (rawUrl && A.isSiteUrl(rawUrl)) ? rawUrl : '';
  var originalPath = original ? mirrors.pathOf ? mirrors.pathOf(original) : '/' : '/';
  var fromHost = original ? mirrors.hostOf(original) : '';

  var KIND_TO_TONE = {
    dns: 'vpn', timeout: 'vpn', blocked: 'vpn', offline: 'net',
    cert: 'cert', server: 'server', abort: 'other', unknown: 'other'
  };
  var described = mirrors.describe(rawErr);
  var tone = KIND_TO_TONE[rawKind] || described.tone || 'other';
  if (!TONE_TEXT[tone]) tone = 'other';

  var ui = {};
  ['src-note', 'err-chip', 'tone-ic', 'tone-title', 'tone-desc', 'orig-url', 'go-mirror', 'go-mirror-text',
    'retry', 'studio', 'reprobe', 'mirror-list', 'probe-note', 'opt-autopage', 'opt-probe', 'stale'].forEach(function (id) {
      ui[id] = document.getElementById(id);
    });

  var bestHost = mirrors.RECOMMENDED;

  // --- Разметка тона -------------------------------------------------------

  function applyTone() {
    var text = TONE_TEXT[tone] || TONE_TEXT.other;
    ui['tone-title'].textContent = text.title;
    ui['tone-desc'].textContent = text.desc;
    ui['tone-ic'].setAttribute('data-tone', tone);
    var svgs = ui['tone-ic'].querySelectorAll('svg[data-tone]');
    Array.prototype.forEach.call(svgs, function (svg) {
      svg.hidden = svg.getAttribute('data-tone') !== tone;
    });
    document.title = 'AnimeOn Studio — ' + text.title.toLowerCase();
  }

  function applyMeta() {
    if (rawSrc) ui['src-note'].textContent = 'источник: ' + rawSrc;
    if (rawErr) {
      ui['err-chip'].hidden = false;
      ui['err-chip'].textContent = rawErr;
      ui['err-chip'].title = rawErr;
    }
    if (original) {
      ui['orig-url'].hidden = false;
      ui['orig-url'].textContent = original;
      ui.retry.hidden = false;
    }
  }

  // --- Зеркала -------------------------------------------------------------

  function targetFor(host) {
    return mirrors.url(host, originalPath && originalPath !== '/' ? originalPath : '/');
  }

  function stateText(r) {
    if (!r) return 'проверяем…';
    if (r.state === 'ok') return 'отвечает' + (r.ms ? ' · ' + r.ms + ' мс' : '');
    if (r.state === 'warn') return 'отвечает с кодом ' + r.status + (r.ms ? ' · ' + r.ms + ' мс' : '');
    if (r.state === 'timeout') return 'таймаут';
    if (r.state === 'unreachable') return 'недоступно';
    if (r.state === 'down') return 'ошибка ' + (r.status || 'сервера');
    return 'проверяем…';
  }

  function renderList(results, pending) {
    var list = ui['mirror-list'];
    list.textContent = '';
    var byHost = {};
    (results || []).forEach(function (r) { byHost[r.host] = r; });

    mirrors.LIST.forEach(function (meta) {
      var r = byHost[meta.host];
      var row = document.createElement('div');
      row.className = 'mrow';
      row.setAttribute('role', 'listitem');

      var dot = document.createElement('span');
      dot.className = 'dot ' + (pending ? 'pending' : ((r && r.state) || 'unknown'));

      var host = document.createElement('span');
      host.className = 'mhost';
      host.textContent = meta.host;
      if (meta.recommended || meta.note) {
        var note = document.createElement('span');
        note.className = 'mnote';
        note.textContent = meta.recommended ? 'рекомендуем' : meta.note;
        host.appendChild(note);
      }

      var st = document.createElement('span');
      st.className = 'mst';
      st.textContent = pending ? 'проверяем…' : stateText(r);

      var go = document.createElement('a');
      go.className = 'mgo';
      go.href = targetFor(meta.host);
      go.textContent = 'открыть';

      row.appendChild(dot); row.appendChild(host); row.appendChild(st); row.appendChild(go);
      list.appendChild(row);
    });
  }

  function applyBest() {
    var label = 'Перейти на ' + bestHost;
    ui['go-mirror-text'].textContent = label;
    ui['go-mirror'].disabled = false;
  }

  function probe(refresh) {
    ui['probe-note'].textContent = 'Проверяем доступность зеркал…';
    renderList(null, true);
    return mirrors.probeAll({ refresh: refresh !== false, timeout: 7000 }).then(function (snap) {
      renderList(snap.results, false);
      var picked = mirrors.pick(snap.results, fromHost);
      if (picked) bestHost = picked;
      applyBest();
      var at = snap.at ? new Date(snap.at) : null;
      ui['probe-note'].textContent = snap.aliveCount
        ? 'Живых зеркал: ' + snap.aliveCount + ' из ' + mirrors.LIST.length + (at ? ' · проверено в ' + at.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '')
        : 'Ни одно зеркало не ответило — вероятно, нет сети или нужен VPN.';
      return snap;
    }).catch(function () {
      renderList(null, false);
      ui['probe-note'].textContent = 'Не удалось проверить зеркала в этом контексте.';
    });
  }

  // --- Настройки плашки ----------------------------------------------------

  function bindOptions() {
    store.load().then(function (config) {
      var off = config.offline || {};
      ui['opt-autopage'].checked = off.autoPage !== false;
      ui['opt-probe'].checked = off.probe !== false;

      ui['opt-autopage'].addEventListener('change', function () {
        store.patchSection('offline', { autoPage: ui['opt-autopage'].checked });
      });
      ui['opt-probe'].addEventListener('change', function () {
        store.patchSection('offline', { probe: ui['opt-probe'].checked });
      });

      if (off.probe === false) {
        renderList(null, false);
        ui['probe-note'].textContent = 'Проверка зеркал выключена в настройках ниже.';
        return null;
      }
      return probe(true);
    }).catch(function () {
      renderList(null, false);
    });
  }

  // --- Кнопки --------------------------------------------------------------

  function bindActions() {
    ui['go-mirror'].addEventListener('click', function () {
      location.assign(targetFor(bestHost));
    });
    ui.retry.addEventListener('click', function () {
      if (original) location.assign(original);
    });
    ui.studio.addEventListener('click', function () {
      try {
        if (A.api.raw && A.api.raw.runtime && A.api.raw.runtime.openOptionsPage) A.api.raw.runtime.openOptionsPage();
      } catch (e) {}
    });
    ui.reprobe.addEventListener('click', function () { probe(true); });
  }

  function checkContext() {
    if (A.api.isContextValid && !A.api.isContextValid()) {
      ui.stale.hidden = false;
      return false;
    }
    return true;
  }

  function boot() {
    applyTone();
    applyMeta();
    applyBest();
    bindActions();
    if (!checkContext()) {
      renderList(null, false);
      ui['probe-note'].textContent = '';
      return;
    }
    bindOptions();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
