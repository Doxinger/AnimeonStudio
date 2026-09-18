// Плашка «сайт не открылся» прямо на странице: сайт может формально
// загрузиться (DPI-заглушка, ошибка прокси/CDN, пустой ответ), но не показать
// контент. Контент-скрипт видит такое состояние, в отличие от страницы ошибки
// браузера — её перехватывает фон (background/availability.js).
AONC.define('content.tweaks.unreachable', function (A) {
  'use strict';

  var HIDE_KEY = 'aonc.unreachable.dismissed';
  var MARK = 'data-aonc-unreachable';

  // Заголовки и тела типовых заглушек: прокси, CDN, блокировки, ошибки сервера.
  var TITLE_RE = /(403|404|407|408|429|500|502|503|504|520|521|522|523|524|525|526)\s|error|problem|unavailable|unreachable|blocked|attention|required|недоступ|не откр|не найд|заблокир|ошибк|проверк|внимани/i;
  var BODY_RE = /ERR_[A-Z_]+|NS_ERROR_[A-Z_]+|cloudflare|ddos-guard|nginx|apache is functioning|bad gateway|gateway time-?out|service unavailable|temporarily unavailable|connection (refused|reset|timed out)|access denied|request blocked|недоступен|не удалось|не отвечает|проверьте подключение|включите vpn|блокировк|роботы|check your browser/i;

  var state = {
    ui: null,
    timer: 0,
    loadTimer: 0,
    checked: false,
    shown: false,
    config: null,
    mirrors: []
  };

  function settings(config) {
    var c = config || state.config || {};
    var off = c.offline || A.config.defaults.offline;
    return {
      on: !!off.siteBanner,
      delay: A.lang.clamp(A.lang.num(off.emptyPageMs, 4500), 150, 30000),
      minText: A.lang.clamp(A.lang.num(off.minTextLength, 40), 0, 4000)
    };
  }

  function visibleText() {
    var body = document.body;
    if (!body) return '';
    var text = '';
    try { text = body.innerText || ''; } catch (e) { text = ''; }
    if (!text) text = body.textContent || '';
    return String(text).replace(/\s+/g, ' ').trim();
  }

  function mediaCount() {
    try {
      return document.querySelectorAll('a[href], img[src], video, canvas, [data-slot="avatar"]').length;
    } catch (e) { return 99; }
  }

  // Страница «не открылась»: либо пустая, либо похожа на заглушку ошибки.
  function looksBroken(minText) {
    if (!document.body) return false;
    var text = visibleText();
    var head = text.slice(0, 600);
    var title = document.title || '';
    var empty = text.length < minText && mediaCount() < 6;
    var stub = BODY_RE.test(head) || (TITLE_RE.test(title) && BODY_RE.test(text.slice(0, 2000)));
    var appRoot = document.getElementById('__next') || document.getElementById('__nuxt') || document.getElementById('root') || document.getElementById('app');
    var hollowApp = !!appRoot && !(appRoot.textContent || '').trim() && !appRoot.querySelector('img,video,a[href]');
    return empty || stub || hollowApp;
  }

  function dismissed() {
    try { return sessionStorage.getItem(HIDE_KEY) === location.href; } catch (e) { return false; }
  }

  function dismiss() {
    try { sessionStorage.setItem(HIDE_KEY, location.href); } catch (e) {}
  }

  function iconSvg(name, size) {
    var raw = A.ui && A.ui.iconsData ? A.ui.iconsData[name] : '';
    if (!raw) return null;
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('width', String(size || 18));
    svg.setAttribute('height', String(size || 18));
    svg.setAttribute('aria-hidden', 'true');
    var wrap = document.createElementNS(ns, 'svg');
    wrap.innerHTML = raw; // разбираем во временном svg: там допустимы только svg-узлы
    while (wrap.firstChild) svg.appendChild(wrap.firstChild);
    return svg;
  }

  var CSS = [
    '.root{position:fixed;top:14px;left:50%;transform:translateX(-50%);',
    'width:min(94vw,26.5rem);pointer-events:auto;}',
    '.card{display:flex;gap:.75rem;align-items:flex-start;padding:.875rem .875rem .75rem;',
    'background:rgba(18,18,24,.94);border:1px solid rgba(255,255,255,.12);border-radius:14px;',
    'box-shadow:0 18px 44px -18px rgba(0,0,0,.85),0 2px 8px rgba(0,0,0,.4);',
    'backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);}',
    '.ic{flex:0 0 auto;width:2.25rem;height:2.25rem;border-radius:.75rem;display:grid;place-items:center;',
    'color:#ffb84d;background:rgba(255,184,77,.14);border:1px solid rgba(255,184,77,.28);}',
    '.tx{flex:1 1 auto;min-width:0;}',
    '.ttl{margin:0 0 .25rem;font-size:.8125rem;font-weight:700;color:var(--fg);}',
    '.msg{margin:0;font-size:.75rem;line-height:1.5;color:var(--dim);}',
    '.msg b{color:var(--fg);font-weight:600;}',
    '.row{display:flex;flex-wrap:wrap;gap:.375rem;margin-top:.625rem;}',
    '.btn{appearance:none;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);',
    'color:var(--fg);font:inherit;font-size:.75rem;font-weight:600;padding:.375rem .625rem;',
    'border-radius:.5rem;cursor:pointer;transition:background .14s,border-color .14s;}',
    '.btn:hover{background:rgba(255,255,255,.12);}',
    '.btn.pri{background:var(--accent);border-color:transparent;color:#fff;}',
    '.btn.pri:hover{filter:brightness(1.1);}',
    '.x{flex:0 0 auto;appearance:none;border:0;background:transparent;color:var(--dim);',
    'cursor:pointer;padding:.25rem;border-radius:.375rem;line-height:0;}',
    '.x:hover{color:var(--fg);background:rgba(255,255,255,.08);}',
    '.mirrors{margin:.625rem 0 0;padding:.5rem;border:1px solid rgba(255,255,255,.10);',
    'border-radius:.625rem;background:rgba(255,255,255,.04);display:none;}',
    '.mirrors.open{display:block;}',
    '.mrow{display:flex;align-items:center;gap:.5rem;padding:.3125rem .25rem;font-size:.75rem;color:var(--dim);}',
    '.mrow + .mrow{border-top:1px solid rgba(255,255,255,.06);}',
    '.dot{flex:0 0 auto;width:.5rem;height:.5rem;border-radius:50%;background:#6d7185;}',
    '.dot.ok{background:#3ddc84;}.dot.warn{background:#ffb84d;}.dot.down,.dot.timeout,.dot.unreachable{background:#ff6b6b;}',
    '.mhost{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--fg);}',
    '.mst{flex:0 0 auto;font-size:.6875rem;color:var(--dim);}',
    '.mgo{flex:0 0 auto;color:var(--accent);text-decoration:none;font-weight:600;font-size:.75rem;}',
    '.mgo:hover{text-decoration:underline;}'
  ].join('');

  function mirrorTarget() {
    var host = '';
    try { host = location.hostname; } catch (e) { host = ''; }
    return A.config.mirrors.mirrorUrl(host, location.href);
  }

  function mirrorLabel() {
    try { return new URL(mirrorTarget()).hostname; } catch (e) { return A.config.mirrors.RECOMMENDED; }
  }

  function stateLabel(r) {
    if (!r) return '';
    if (r.state === 'ok') return r.ms ? r.ms + ' мс' : 'отвечает';
    if (r.state === 'warn') return 'медленно' + (r.ms ? ', ' + r.ms + ' мс' : '');
    if (r.state === 'timeout') return 'таймаут';
    if (r.state === 'unreachable') return 'недоступно';
    if (r.state === 'down') return r.status ? 'HTTP ' + r.status : 'ошибка';
    return '…';
  }

  function renderMirrors(list) {
    if (!state.ui || !state.mirrorsBox) return;
    var box = state.mirrorsBox;
    box.textContent = '';
    (list || []).forEach(function (r) {
      var meta = A.config.mirrors.byHost(r.host) || {};
      var row = A.content.ui.shadowHost.el('div', { class: 'mrow' }, [
        A.content.ui.shadowHost.el('span', { class: 'dot ' + (r.state || 'unknown') }),
        A.content.ui.shadowHost.el('span', { class: 'mhost', text: r.host + (meta.recommended ? ' · рекомендуем' : '') }),
        A.content.ui.shadowHost.el('span', { class: 'mst', text: stateLabel(r) }),
        A.content.ui.shadowHost.el('a', { class: 'mgo', href: A.config.mirrors.url(r.host, '/'), text: 'открыть' })
      ]);
      box.appendChild(row);
    });
    if (!list || !list.length) {
      box.appendChild(A.content.ui.shadowHost.el('div', { class: 'mrow', text: 'нет данных' }));
    }
  }

  function probe() {
    if (!A.api || !A.api.sendMessage) return;
    A.api.sendMessage(A.messaging.msg(A.messaging.TYPE.MIRRORS_STATUS, { force: true }))
      .then(function (res) {
        var value = null;
        try { value = A.messaging.unwrap(res); } catch (e) { value = null; }
        renderMirrors(value && value.results ? value.results : null);
      })
      .catch(function () {
        renderMirrors(A.config.mirrors.LIST.map(function (m) {
          return { host: m.host, state: 'unknown', ms: 0, status: 0 };
        }));
      });
  }

  function show() {
    if (state.shown || dismissed()) return;
    state.shown = true;

    var sh = A.content.ui.shadowHost;
    var target = mirrorTarget();
    var label = mirrorLabel();

    state.ui = sh.create({ name: MARK, css: CSS });
    state.ui.host.setAttribute(MARK, '1');
    var el = sh.el;

    var mirrorsBox = el('div', { class: 'mirrors' });
    state.mirrorsBox = mirrorsBox;

    var btnGo = el('button', {
      class: 'btn pri', type: 'button', text: 'Перейти на ' + label,
      onclick: function () { location.assign(target); }
    });
    var btnMirrors = el('button', {
      class: 'btn', type: 'button', text: 'Все зеркала',
      onclick: function () {
        var open = !mirrorsBox.classList.contains('open');
        mirrorsBox.classList.toggle('open', open);
        if (open) probe();
      }
    });
    var btnRetry = el('button', {
      class: 'btn', type: 'button', text: 'Обновить',
      onclick: function () { location.reload(); }
    });
    var btnX = el('button', {
      class: 'x', type: 'button', title: 'Скрыть', 'aria-label': 'Скрыть плашку',
      onclick: function () { dismiss(); reset(); }
    });
    var ic = iconSvg('wifi-off', 18);

    state.ui.container.appendChild(el('div', { class: 'card' }, [
      el('div', { class: 'ic' }, ic ? [ic] : []),
      el('div', { class: 'tx' }, [
        el('p', { class: 'ttl', text: 'Похоже, сайт не открылся' }),
        el('p', {
          class: 'msg',
          html: 'Страница пустая или заблокирована провайдером. Включите VPN или перейдите на другое зеркало — <b>' +
            label + '</b>.'
        }),
        el('div', { class: 'row' }, [btnGo, btnMirrors, btnRetry]),
        mirrorsBox
      ]),
      btnX
    ]));
  }

  function check() {
    if (state.checked) return;
    var s = settings(state.config);
    if (!s.on) return;
    if (!A.isSiteHost(location.hostname)) return;
    state.checked = true;
    if (looksBroken(s.minText)) show();
  }

  function schedule(config) {
    state.config = config || state.config;
    var s = settings(state.config);
    if (!s.on) { reset(); return; }
    if (!A.isSiteHost(location.hostname)) return;
    if (state.timer) clearTimeout(state.timer);
    state.timer = setTimeout(function () { state.timer = 0; check(); }, s.delay);
    if (!state.loadTimer && document.readyState !== 'complete') {
      state.loadTimer = 1;
      window.addEventListener('load', function () {
        setTimeout(function () { check(); }, Math.min(s.delay, 1500));
      }, { once: true });
    }
  }

  function reset() {
    if (state.timer) { clearTimeout(state.timer); state.timer = 0; }
    if (state.ui) { state.ui.remove(); state.ui = null; }
    state.mirrorsBox = null;
    state.shown = false;
    state.checked = false;
  }

  function apply(config) {
    schedule(config);
  }

  return { apply: apply, reset: reset, check: check, show: show, looksBroken: looksBroken, MARK: MARK };
});
