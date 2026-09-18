// Значок мецената: иконка расширения справа от ника у тех, кто поддержал
// разработку AnimeOn Studio (список ников приходит из фона). Всегда включён,
// настроек не имеет. При наведении — подсказка «<ник> поддержал(а) разработку…».
AONC.define('content.tweaks.supporter', function (A) {
  'use strict';

  var MARK = 'data-aonc-supporter';

  var STYLE_ID = 'aonc-supporter-css';

  // Анимации в духе сайтовых бейджей: попап при появлении, пульс свечения,
  // пробегающий блик. Класс aon-pause-offscreen отдаёт значок сайтовой
  // паузе вне экрана, html.aonc-no-motion и prefers-reduced-motion гасят всё.
  var CSS = [
    '@keyframes aonc-sup-pop{0%{opacity:0;transform:scale(.3) rotate(-30deg)}60%{opacity:1;transform:scale(1.18) rotate(6deg)}100%{opacity:1;transform:scale(1)}}',
    '@keyframes aonc-sup-glow{0%,100%{filter:drop-shadow(0 0 .12em rgba(167,139,250,.45))}50%{filter:drop-shadow(0 0 .45em rgba(167,139,250,.9)) drop-shadow(0 0 .18em rgba(236,72,153,.5))}}',
    '@keyframes aonc-sup-shine{0%,55%{transform:translateX(-140%) skewX(-18deg)}85%,100%{transform:translateX(320%) skewX(-18deg)}}',
    '.aonc-supporter-badge{position:relative;z-index:5;overflow:hidden;border-radius:.3em;cursor:help;',
    'transition:transform .18s ease;animation:aonc-sup-pop .45s cubic-bezier(.34,1.56,.64,1) backwards;}',
    '.aonc-supporter-badge:hover{transform:scale(1.15);}',
    '.aonc-supporter-badge img{filter:drop-shadow(0 0 .25em rgba(167,139,250,.55));',
    'animation:aonc-sup-glow 3.2s ease-in-out infinite;}',
    '.aonc-supporter-badge::after{content:"";position:absolute;top:-20%;bottom:-20%;left:0;width:38%;pointer-events:none;',
    'background:linear-gradient(105deg,transparent 0%,rgba(255,255,255,.5) 50%,transparent 100%);',
    'transform:translateX(-140%) skewX(-18deg);',
    'animation:aonc-sup-shine 4.8s ease-in-out infinite;animation-delay:var(--aonc-sup-d,0s);}',
    '.aon-paused-offscreen.aonc-supporter-badge,.aon-paused-offscreen.aonc-supporter-badge::after,',
    '.aon-paused-offscreen.aonc-supporter-badge img{animation-play-state:paused!important;}',
    'html.aonc-no-motion .aonc-supporter-badge,html.aonc-no-motion .aonc-supporter-badge::after,',
    'html.aonc-no-motion .aonc-supporter-badge img{animation:none!important;}',
    '@media (prefers-reduced-motion:reduce){.aonc-supporter-badge,.aonc-supporter-badge::after,',
    '.aonc-supporter-badge img{animation:none!important;}}',
    // Тултип-пилюля в духе сайтовых бейджей: тёмное стекло, контур, свечение,
    // ник градиентом. Поверх всего сайта, вне зависимости от слоёв профиля.
    '.aonc-supporter-tip{position:fixed;z-index:2147483647;display:flex;align-items:center;gap:8px;max-width:340px;',
    'padding:8px 12px;border-radius:12px;background:rgba(10,10,14,.92);border:1px solid rgba(167,139,250,.35);',
    'box-shadow:0 10px 30px rgba(0,0,0,.55),0 0 14px rgba(167,139,250,.18);',
    'backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);',
    'font-size:12px;line-height:1.35;color:#e4e4e7;pointer-events:none;transform:translateX(-50%);',
    'opacity:0;transition:opacity .16s ease;}',
    '.aonc-supporter-tip[data-show="1"]{opacity:1;}',
    '.aonc-supporter-tip b{font-weight:600;background-image:linear-gradient(90deg,#A78BFA,#EC4899);',
    'background-clip:text;-webkit-background-clip:text;-webkit-text-fill-color:transparent;color:transparent;}'
  ].join('');

  function ensureCss() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.setAttribute('data-aonc', '1');
    style.textContent = CSS;
    (document.head || document.documentElement).appendChild(style);
    bindTip();
  }

  var tip = { el: null, bound: false, for: null };

  function tipEl() {
    if (tip.el && tip.el.isConnected) return tip.el;
    var el = document.createElement('div');
    el.id = 'aonc-supporter-tip';
    el.className = 'aonc-supporter-tip';
    el.setAttribute('role', 'tooltip');
    var img = document.createElement('img');
    img.src = A.api.getURL('icons/icon-32.png');
    img.alt = '';
    img.style.cssText = 'width:18px;height:18px;border-radius:5px;flex-shrink:0;';
    var text = document.createElement('span');
    el.appendChild(img);
    el.appendChild(text);
    el.style.display = 'none';
    (document.body || document.documentElement).appendChild(el);
    tip.el = el;
    return el;
  }

  function hideTip() {
    if (tip.el) {
      tip.el.style.display = 'none';
      tip.el.removeAttribute('data-show');
    }
    tip.for = null;
  }

  function showTip(badge) {
    var name = badge.getAttribute('data-aonc-sup-name') || badge.getAttribute(MARK) || '';
    var el = tipEl();
    var text = el.lastChild;
    text.textContent = '';
    var b = document.createElement('b');
    b.textContent = name;
    text.appendChild(b);
    text.appendChild(document.createTextNode(TIP_SUFFIX));
    el.style.display = 'flex';
    el.removeAttribute('data-show');
    var r = badge.getBoundingClientRect();
    var vw = window.innerWidth || document.documentElement.clientWidth || 0;
    var w = el.offsetWidth;
    var h = el.offsetHeight;
    var x = r.left + r.width / 2;
    if (vw) x = Math.min(Math.max(x, w / 2 + 8), vw - w / 2 - 8);
    var below = r.top < h + 16;
    el.style.left = x + 'px';
    el.style.top = (below ? r.bottom + 10 : r.top - h - 10) + 'px';
    void el.offsetWidth;
    el.setAttribute('data-show', '1');
    tip.for = badge;
  }

  function badgeOf(node) {
    return node && node.closest ? node.closest('.aonc-supporter-badge') : null;
  }

  function bindTip() {
    if (tip.bound) return;
    tip.bound = true;
    document.addEventListener('mouseover', function (e) {
      var b = badgeOf(e.target);
      if (b) showTip(b);
    });
    document.addEventListener('mouseout', function (e) {
      if (badgeOf(e.target) && !badgeOf(e.relatedTarget)) hideTip();
    });
    window.addEventListener('scroll', hideTip, { passive: true });
    window.addEventListener('resize', hideTip);
  }

  var state = {
    nicks: [],
    observer: null,
    timer: null,
    refreshTimer: null,
    started: false,
    loading: false
  };

  function normalize(response) {
    var value = null;
    if (response && response.ok !== false) value = response.value !== undefined ? response.value : response;
    if (!Array.isArray(value)) return [];
    var seen = {};
    var out = [];
    value.forEach(function (x) {
      var nick = String(x).trim().toLowerCase();
      if (!nick || seen[nick]) return;
      seen[nick] = true;
      out.push(nick);
    });
    return out;
  }

  // На reload страницы фон (service worker) может ещё спать, а сеть — мигнуть:
  // один неудачный запрос не должен оставлять страницу без значков до
  // 5-минутного таймера. Ретраи с бэкоффом: 1.2s, 2.4s, 4.8s, 9.6s, 19.2s.
  var retryTimer = null;

  function scheduleRetry(attempt) {
    var a = attempt || 0;
    if (a >= 5 || !state.started) return;
    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = setTimeout(function () {
      retryTimer = null;
      if (!state.started) return;
      requestSupporters(false, a + 1).then(function () { throttled(); });
    }, 1200 * Math.pow(2, a));
  }

  // Ответ фона может не прийти вовсе (зависший fetch до таймаута, мёртвый SW):
  // без сторожа state.loading застрял бы навсегда и значки не перезапрашивались
  // до перезагрузки страницы.
  var watchdogMs = 20000;

  function setWatchdogMs(ms) {
    watchdogMs = ms > 0 ? ms : 20000;
  }

  function requestSupporters(force, attempt) {
    if (state.loading) return Promise.resolve(state.nicks);
    state.loading = true;
    var settled = false;
    var watchdog = setTimeout(function () {
      if (settled || !state.started) return;
      settled = true;
      state.loading = false;
      scheduleRetry(attempt);
      throttled();
    }, watchdogMs);
    return A.api.sendMessage(A.messaging.msg(force ? A.messaging.TYPE.SUPPORTER_REFRESH : A.messaging.TYPE.SUPPORTER_LIST))
      .then(function (response) {
        if (settled) return state.nicks;
        settled = true;
        clearTimeout(watchdog);
        state.loading = false;
        // На reload сервис-воркер фона может ещё спать: канал сообщения рвётся
        // и api.sendMessage резолвит undefined (runtime.lastError «Receiving end
        // does not exist»). Это сбой, а не «пустой список» — без ретрая значок
        // не появится до 5-минутного таймера (баг «пропал значок, лечится
        // перезаходом»). Уже загруженный список при сбое не затираем.
        if (!response || response.ok === false) {
          scheduleRetry(attempt);
          return state.nicks;
        }
        var nicks = normalize(response);
        // Пустой ответ в первых попытках тоже подозрителен (фон только
        // проснулся, CDN мигнул пустым 200): ограниченно ретраим, но не
        // устраиваем бесконечный цикл, если donate.txt правда пуст.
        if (!nicks.length && (attempt || 0) < 2) scheduleRetry(attempt);
        state.nicks = nicks;
        return state.nicks;
      })
      .catch(function () {
        if (settled) return state.nicks;
        settled = true;
        clearTimeout(watchdog);
        state.loading = false;
        scheduleRetry(attempt);
        return state.nicks;
      });
  }

  var TIP_SUFFIX = ' поддержал(а) разработку AnimeonStudio и получил уникальный значок';

  function titleFor(nick) {
    return nick + TIP_SUFFIX;
  }

  function makeBadge(nick) {
    ensureCss();
    var span = document.createElement('span');
    span.setAttribute(MARK, String(nick).toLowerCase());
    // aon-pause-offscreen — сайтовый наблюдатель ставит анимацию на паузу вне экрана
    span.className = 'aonc-supporter-badge aon-pause-offscreen';
    span.setAttribute('data-aonc-sup-name', nick);
    span.style.cssText = 'display:inline-flex;align-items:center;margin-left:0.35em;line-height:0;';
    span.style.setProperty('--aonc-sup-d', (-Math.random() * 4.8).toFixed(2) + 's');
    var img = document.createElement('img');
    img.src = A.api.getURL('icons/icon-32.png');
    img.alt = '';
    img.style.cssText = 'width:1em;height:1em;border-radius:0.25em;display:inline-block;';
    span.appendChild(img);
    return span;
  }

  function isSupporter(user) {
    return !!user && state.nicks.indexOf(user) !== -1;
  }

  function userOf(link) {
    var m = /\/user\/([^/?#]+)/.exec(link.getAttribute('href') || '');
    return m ? decodeURIComponent(m[1]).toLowerCase() : '';
  }

  function isProfilePage() {
    var p = location.pathname;
    return p.indexOf('/user/') === 0 || p === '/profile' || p === '/profile/' || p === '/me' || p === '/me/';
  }

  // Ник страницы профиля: из URL (/user/ник) или свой (/profile, /me).
  function pageNick() {
    var p = location.pathname;
    if (p.indexOf('/user/') === 0) {
      var seg = p.slice('/user/'.length).split('/')[0];
      return seg ? decodeURIComponent(seg).toLowerCase() : '';
    }
    if (p === '/profile' || p === '/profile/' || p === '/me' || p === '/me/') {
      return (A.content.tweaks.chat.detectOwn() || '').toLowerCase();
    }
    return '';
  }

  // Обёртка страницы: сайт живёт в div.min-h-screen (на нём же ключатся
  // рамки и бейджи), main может не быть совсем. Фолбэк — body.
  function scope() {
    return A.dom.ready.first(['div.min-h-screen', 'main']) || document.body;
  }

  function linkTargets() {
    var list = A.dom.ready.queryAll('div[data-msg-id] a[href^="/user/"]');
    if (isProfilePage()) {
      var root = scope();
      A.dom.ready.queryAll('a[href^="/user/"]', root).forEach(function (el) {
        if (el.closest && el.closest('header')) return;
        if (list.indexOf(el) === -1) list.push(el);
      });
    }
    return list;
  }

  // Заголовок профиля: ищем строку-хендл «@ник» и берём соседний сверху
  // заголовок (h1 с ником); если заголовка нет — саму строку хендла.
  // Фолбэк: листовой h1, текст которого совпадает с ником.
  function headingTarget(nick) {
    var root = scope();
    var leaves = A.dom.ready.queryAll('h1, h2, p, span, div', root);
    var handle = null;
    for (var i = 0; i < leaves.length; i++) {
      var el = leaves[i];
      if (el.children.length) continue;
      if ((el.textContent || '').trim() === '@' + nick) { handle = el; break; }
    }
    if (handle) {
      var prev = handle.previousElementSibling;
      if (prev && (prev.textContent || '').trim()) {
        return prev.querySelector('[' + MARK + ']') ? null : prev;
      }
      return handle.querySelector('[' + MARK + ']') ? null : handle;
    }
    var heads = A.dom.ready.queryAll('h1', root);
    for (var j = 0; j < heads.length; j++) {
      var h = heads[j];
      if (h.querySelector('[' + MARK + ']')) continue;
      if (h.children.length) continue;
      if ((h.textContent || '').trim().toLowerCase() === nick) return h;
    }
    return null;
  }

  function displayNick(el) {
    return (el.textContent || '').trim();
  }

  function scan() {
    if (!state.nicks.length) return;

    linkTargets().forEach(function (link) {
      var user = userOf(link);
      if (!isSupporter(user)) return;
      // Ссылки-обёртки вокруг кнопок («Как видят другие») и плиток с аватарками
      // не являются никами — значок там не нужен.
      if (link.querySelector('button, [data-slot="button"], img, svg')) return;
      var next = link.nextElementSibling;
      if (next && next.hasAttribute && next.hasAttribute(MARK)) return;
      if (link.querySelector('[' + MARK + ']')) return;
      link.insertAdjacentElement('afterend', makeBadge(displayNick(link)));
    });

    var nick = pageNick();
    if (nick && isSupporter(nick)) {
      var head = headingTarget(nick);
      if (head && !head.hasAttribute(MARK) && !head.querySelector('[' + MARK + ']')) {
        head.appendChild(makeBadge(displayNick(head) || nick));
      }
    }
  }

  var throttled = A.lang.throttle(function () {
    if (state.started) scan();
  }, 400);

  function start() {
    if (state.started) return;
    state.started = true;
    state.observer = A.dom.ready.observe(document.documentElement, function () { throttled(); });
    state.timer = setInterval(throttled, 1500);
    state.refreshTimer = setInterval(function () {
      requestSupporters(false).then(function () { throttled(); });
    }, 5 * 60 * 1000);
  }

  function stop() {
    if (state.observer) {
      try { state.observer.disconnect(); } catch (e) {}
      state.observer = null;
    }
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    if (state.refreshTimer) { clearInterval(state.refreshTimer); state.refreshTimer = null; }
    if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
    state.started = false;
    state.loading = false;
    hideTip();
    A.dom.ready.queryAll('[' + MARK + ']').forEach(function (b) {
      if (b.parentNode) b.parentNode.removeChild(b);
    });
  }

  function apply() {
    start();
    requestSupporters(false).then(function () {
      scan();
    });
  }

  function reset() {
    stop();
    state.nicks = [];
  }

  function count() {
    return A.dom.ready.queryAll('[' + MARK + ']').length;
  }

  return {
    apply: apply, reset: reset, scan: scan, requestSupporters: requestSupporters,
    count: count, MARK: MARK, titleFor: titleFor, setWatchdogMs: setWatchdogMs
  };
});
