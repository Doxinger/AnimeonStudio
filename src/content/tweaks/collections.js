AONC.define('content.tweaks.collections', function (A) {
  'use strict';

  var FLAG = 'aonc.autodelete';
  var BACK = 'aonc.autodelete.back';
  var HASH = 'aonc-delete';
  var BTN_MARK = 'data-aonc-coll-del';

  var state = { observer: null, timer: null, started: false, poll: null };

  function ownName() {
    return A.content.tweaks.chat.detectOwn() || '';
  }

  function profileName() {
    var m = /\/user\/([^/?#]+)/.exec(location.pathname);
    return m ? decodeURIComponent(m[1]) : '';
  }

  function isOwnProfile() {
    var own = ownName();
    return !!own && own === profileName();
  }

  function cards() {
    return A.dom.ready.queryAll('div[class*="group/col"], div[class*="group\\/col"]');
  }

  function cardInfo(card) {
    var link = card.querySelector('a[href^="/collections/"]');
    if (!link) return null;
    var href = link.getAttribute('href') || '';
    if (href === '/collections/new' || href.indexOf('/collections/new') === 0) return null;
    var title = (card.textContent || '').trim().slice(0, 60);
    return { href: href, title: title };
  }

  function addButton(card, info) {
    if (card.querySelector('[' + BTN_MARK + ']')) return;
    var btn = document.createElement('button');
    btn.setAttribute(BTN_MARK, '1');
    btn.type = 'button';
    btn.title = 'Удалить подборку в один клик';
    btn.textContent = '✕';
    btn.style.cssText = 'position:absolute;top:8px;right:8px;z-index:5;width:26px;height:26px;' +
      'border-radius:8px;border:1px solid rgba(255,255,255,.18);background:rgba(20,10,14,.82);' +
      'color:#ff9b9b;cursor:pointer;font-size:12px;line-height:1;opacity:0;transition:opacity .15s ease;';
    card.addEventListener('mouseenter', function () { btn.style.opacity = '1'; });
    card.addEventListener('mouseleave', function () { btn.style.opacity = '0'; });
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      requestDelete(info);
    });
    card.appendChild(btn);
  }

  function requestDelete(info) {
    var ok = false;
    try {
      ok = window.confirm('Удалить подборку «' + info.title + '» без открытия страницы?');
    } catch (e) {
      ok = true;
    }
    if (!ok) return;
    try {
      sessionStorage.setItem(FLAG, info.href);
      sessionStorage.setItem(BACK, location.pathname + location.search);
    } catch (e) {}
    try {
      location.assign(info.href + '#' + HASH);
    } catch (e) {}
  }

  function scan() {
    if (!isOwnProfile()) return;
    cards().forEach(function (card) {
      var info = cardInfo(card);
      if (info) addButton(card, info);
    });
  }

  function findDeleteButton() {
    var buttons = A.dom.ready.queryAll('button, [role="menuitem"]');
    for (var i = 0; i < buttons.length; i++) {
      var text = (buttons[i].textContent || '').trim();
      if (/^Удалить( подборку)?$/i.test(text)) return buttons[i];
    }
    return null;
  }

  function findDialogConfirm() {
    var dialogs = A.dom.ready.queryAll('[role="alertdialog"], [role="dialog"]');
    for (var d = 0; d < dialogs.length; d++) {
      var buttons = dialogs[d].querySelectorAll('button');
      for (var i = 0; i < buttons.length; i++) {
        var text = (buttons[i].textContent || '').trim();
        if (/^Удалить/i.test(text)) return buttons[i];
      }
    }
    return null;
  }

  function goBack() {
    var back = '/';
    try {
      back = sessionStorage.getItem(BACK) || '/';
      sessionStorage.removeItem(BACK);
    } catch (e) {}
    setTimeout(function () {
      try { location.assign(back); } catch (e) {}
    }, 900);
  }

  function runAutoDelete() {
    if (location.hash.indexOf(HASH) === -1) return;
    var target = null;
    try {
      target = sessionStorage.getItem(FLAG);
      sessionStorage.removeItem(FLAG);
    } catch (e) {}
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    if (!target || target !== location.pathname) return;

    var tries = 0;
    state.poll = setInterval(function () {
      tries++;
      var btn = findDeleteButton();
      if (btn) {
        clearInterval(state.poll);
        state.poll = null;
        btn.click();
        setTimeout(function () {
          var confirmBtn = findDialogConfirm();
          if (confirmBtn) confirmBtn.click();
          A.content.toast.show('Подборка удаляется…');
          goBack();
        }, 700);
        return;
      }
      if (tries > 16) {
        clearInterval(state.poll);
        state.poll = null;
        A.content.toast.error('Не нашёл кнопку удаления на странице подборки');
        goBack();
      }
    }, 500);
  }

  var throttled = A.lang.throttle(function () {
    if (state.started) scan();
  }, 400);

  function start() {
    if (state.started) return;
    state.started = true;
    state.observer = A.dom.ready.observe(document.documentElement, function () { throttled(); });
    state.timer = setInterval(throttled, 1500);
  }

  function stop() {
    if (state.observer) {
      try { state.observer.disconnect(); } catch (e) {}
      state.observer = null;
    }
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    if (state.poll) { clearInterval(state.poll); state.poll = null; }
    state.started = false;
    A.dom.ready.queryAll('[' + BTN_MARK + ']').forEach(function (b) {
      if (b.parentNode) b.parentNode.removeChild(b);
    });
  }

  function apply(config) {
    var on = !!(config.layout && config.layout.collectionsQuickDelete);
    runAutoDelete();
    if (!on) {
      stop();
      return;
    }
    start();
    scan();
  }

  function reset() {
    stop();
  }

  return {
    apply: apply,
    reset: reset,
    scan: scan,
    runAutoDelete: runAutoDelete,
    isOwnProfile: isOwnProfile,
    FLAG: FLAG,
    BTN_MARK: BTN_MARK
  };
});
