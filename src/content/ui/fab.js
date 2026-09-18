AONC.define('content.ui.fab', function (A) {
  'use strict';

  var CSS = [
    '.fab{position:fixed;right:18px;bottom:18px;z-index:2147483630;width:46px;height:46px;border-radius:14px;',
    'border:1px solid rgba(255,255,255,.16);cursor:pointer;display:grid;place-items:center;',
    'background:linear-gradient(135deg,#7C4DFF,#ff4d9d);color:#fff;pointer-events:auto;',
    'box-shadow:0 10px 30px -8px rgba(124,77,255,.55),inset 0 1px 0 rgba(255,255,255,.3);',
    'transition:transform .15s ease,box-shadow .15s ease;}',
    '.fab:hover{transform:translateY(-2px) scale(1.04);}',
    '.fab svg{width:21px;height:21px;}',
    '.menu{position:fixed;right:18px;bottom:74px;z-index:2147483630;width:288px;max-height:min(62vh,540px);',
    'overflow:auto;background:rgba(18,18,25,.94);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.12);',
    'border-radius:16px;box-shadow:0 24px 60px rgba(0,0,0,.6);padding:10px;display:none;pointer-events:auto;',
    'font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#f1f1f4;}',
    '.menu.on{display:block;}',
    '.head{display:flex;align-items:center;gap:8px;padding:4px 8px 10px;font-size:12.5px;font-weight:700;}',
    '.head .sp{flex:1;}',
    '.head .tag{font-size:9.5px;font-weight:600;color:#9a9aa8;border:1px solid rgba(255,255,255,.14);',
    'border-radius:99px;padding:1px 7px;}',
    '.item{display:flex;align-items:center;gap:10px;width:100%;border:0;background:transparent;color:#e6e6ee;',
    'padding:9px 10px;border-radius:10px;cursor:pointer;font:inherit;font-size:12.5px;text-align:left;',
    'transition:background .13s ease;}',
    '.item:hover{background:rgba(255,255,255,.07);}',
    '.item .ic{width:26px;height:26px;flex:0 0 auto;border-radius:8px;display:grid;place-items:center;',
    'background:rgba(124,77,255,.16);color:#c4b5fd;font-size:13px;}',
    '.item .lb{flex:1;min-width:0;}',
    '.item .lb small{display:block;font-size:10.5px;color:#8a8a9a;margin-top:1px;}',
    '.item .st{font-size:10px;color:#8a8a9a;border:1px solid rgba(255,255,255,.12);border-radius:99px;padding:1px 7px;}',
    '.item .st.on{color:#8ce8b4;border-color:rgba(61,220,132,.35);background:rgba(61,220,132,.1);}',
    '.sep{height:1px;background:rgba(255,255,255,.08);margin:7px 4px;}'
  ].join('\n');

  var GEAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>';

  var host = null;
  var fab = null;
  var menu = null;
  var open = false;
  var docListener = null;

  function ensure() {
    if (host && host.host.isConnected) return;
    host = A.content.ui.shadowHost.create({ name: 'fab', css: CSS, zIndex: 2147483630 });
    var el = A.content.ui.shadowHost.el;

    fab = el('button', { class: 'fab', title: 'AnimeOn Studio — быстрое меню', html: GEAR });
    fab.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleMenu();
    });

    menu = el('div', { class: 'menu' });
    menu.addEventListener('click', function (e) { e.stopPropagation(); });

    host.container.appendChild(menu);
    host.container.appendChild(fab);

    if (!docListener) {
      docListener = function () {
        if (open) closeMenu();
      };
      document.addEventListener('click', docListener, true);
    }
  }

  function toggleMenu() {
    if (open) closeMenu();
    else openMenu();
  }

  function closeMenu() {
    open = false;
    if (menu) menu.classList.remove('on');
  }

  function openMenu() {
    ensure();
    renderMenu();
    open = true;
    menu.classList.add('on');
  }

  function patch(changes) {
    return A.content.config.patch(changes).then(function () {
      renderMenu();
    });
  }

  function cyclePreset() {
    var config = A.content.config.current();
    var list = A.config.presets.LIST;
    var idx = list.map(function (p) { return p.id; }).indexOf(config.theme.preset);
    var next = list[(idx + 1) % list.length];
    var theme = Object.assign({}, A.config.presets.themePatch(next.id), { preset: next.id });
    patch({ theme: theme }).then(function () {
      A.content.toast.show('Тема: ' + next.name);
    });
  }

  function cycleWallpaper() {
    var config = A.content.config.current();
    var lib = A.config.wallpapers.LIB;
    var idx = lib.map(function (p) { return p.id; }).indexOf(config.wallpaper.preset);
    var next = lib[(idx + 1) % lib.length];
    patch({
      wallpaper: Object.assign({}, config.wallpaper, {
        enabled: true, source: 'preset', preset: next.id,
        size: next.kind === 'svg' ? 'auto' : 'cover',
        repeat: next.kind === 'svg' ? 'repeat' : 'no-repeat'
      })
    }).then(function () {
      A.content.toast.show('Фон: ' + next.name);
    });
  }

  function toggleBatch(on) {
    return patch({
      visibility: {
        battlepass: on, premium: on, premiumBadges: on, mangaTeaser: on
      }
    });
  }

  function cycleLoadout() {
    var config = A.content.config.current();
    var next = A.config.loadouts.nextOf(config);
    if (!next) {
      A.content.toast.show('Комплектов нет: сохраните первый в студии → «Косметика и бейджи»');
      return;
    }
    var patched = A.config.loadouts.applyTo(config, next);
    A.content.config.patch({ cosmetics: patched.cosmetics, meta: { activeLoadout: next.id } }).then(function () {
      A.content.toast.show('Комплект: ' + next.name);
      renderMenu();
    });
  }

  function cycleFrame() {
    var config = A.content.config.current();
    var c = config.cosmetics || {};
    var catalog = A.config.framesLib.list({});
    if (!catalog.length) {
      A.content.toast.show('Каталог рамок пуст');
      return;
    }
    var current = (c.frames || []).filter(function (f) { return f && f.frameId; })[0];
    var idx = current ? catalog.map(function (f) { return f.id; }).indexOf(current.frameId) : -1;
    var next = catalog[(idx + 1) % catalog.length];
    var cosmetics = Object.assign({}, c, {
      framesOn: true,
      framesMode: 'single',
      frames: (c.frames || []).filter(function (f) { return f && !f.frameId; }).concat([A.config.framesLib.makeEntry(next)])
    });
    patch({ cosmetics: cosmetics }).then(function () {
      A.content.toast.show('Рамка: ' + next.name);
    });
  }

  function copyPage() {
    var text = document.title + ' — ' + location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        A.content.toast.ok('Скопировано: название + ссылка');
      });
    } else {
      A.content.toast.error('Буфер обмена недоступен');
    }
  }

  function renderMenu() {
    var el = A.content.ui.shadowHost.el;
    var config = A.content.config.current();
    var v = config.visibility;
    var promoOn = !!(v.battlepass && v.premium && v.mangaTeaser);

    menu.innerHTML = '';
    menu.appendChild(el('div', { class: 'head' }, [
      el('span', { text: 'AnimeOn Studio' }),
      el('span', { class: 'tag', text: config.theme.preset }),
      el('span', { class: 'sp' })
    ]));

    menu.appendChild(item('◐', 'Следующая тема', 'Цикл встроенных пресетов', '', cyclePreset));
    menu.appendChild(item('🖼', 'Следующий фон', 'Цикл пресетов обоев', '', cycleWallpaper));
    menu.appendChild(el('div', { class: 'sep' }));

    menu.appendChild(item('🎭', 'Театральный режим', 'Плеер на всю ширину',
      document.documentElement.classList.contains('aonc-theater') ? 'вкл' : '',
      function () { A.content.tweaks.player.toggleTheater(); renderMenu(); }));
    menu.appendChild(item('🌑', 'Киносвет', 'Затемнение вокруг видео',
      document.documentElement.classList.contains('aonc-cinema') ? 'вкл' : '',
      function () { A.content.tweaks.player.toggleCinema(); renderMenu(); }));
    menu.appendChild(item('⛶', 'Плеер на всё окно', 'Поверх всего',
      A.content.classes.getRuntime('aonc-maxplayer') ? 'вкл' : '',
      function () { A.content.tweaks.player.toggleMaxPlayer(); renderMenu(); }));
    menu.appendChild(el('div', { class: 'sep' }));

    menu.appendChild(item('🚫', 'Скрыть промо', 'Боевой пропуск, Premium, манга',
      promoOn ? 'вкл' : '', function () { toggleBatch(!promoOn); }));
    menu.appendChild(item('⬚', 'Пипетка', 'Клик по элементу → правило',
      A.content.picker.isActive() ? 'вкл' : '',
      function () { A.content.picker.toggle(); closeMenu(); }));
    menu.appendChild(item('⌨', 'Шпаргалка клавиш', 'Все хоткеи оверлеем', '',
      function () { A.content.ui.cheatsheet.toggle(); closeMenu(); }));
    menu.appendChild(el('div', { class: 'sep' }));

    menu.appendChild(item('⧉', 'Скопировать страницу', 'Название + ссылка', '', copyPage));
    menu.appendChild(item('⬆', 'В начало страницы', 'Плавный скролл', '',
      function () { window.scrollTo({ top: 0, behavior: 'smooth' }); closeMenu(); }));
    var blocked = A.content.tweaks.privacy.getCount();
    menu.appendChild(item('🛡', 'Заблокировано трекеров', 'Мягкая блокировка Метрики/GA4',
      blocked > 0 ? String(blocked) : '', function () {
        A.content.toast.show('Заблокировано трекеров за всё время: ' + blocked);
      }));
    menu.appendChild(item('◆', 'Следующий комплект', 'Цикл сохранённых комплектов', '',
      function () { cycleLoadout(); }));
    var cos = config.cosmetics || {};
    menu.appendChild(item('🎴', 'Следующая рамка', 'Цикл рамок из каталога сайта',
      cos.framesOn && (cos.frames || []).length ? 'вкл' : '',
      function () { cycleFrame(); }));
    menu.appendChild(item('⚙', 'Открыть студию', 'Все настройки', '',
      function () {
        A.api.sendMessage(A.messaging.msg(A.messaging.TYPE.OPEN_STUDIO));
        closeMenu();
      }));
  }

  function item(icon, label, sub, state, onclick) {
    var el = A.content.ui.shadowHost.el;
    return el('button', { class: 'item', onclick: onclick }, [
      el('span', { class: 'ic', text: icon }),
      el('span', { class: 'lb' }, [
        document.createTextNode(label),
        el('small', { text: sub })
      ]),
      state ? el('span', { class: 'st on', text: state }) : null
    ]);
  }

  function apply(config) {
    var on = !!(config.meta && config.meta.fabEnabled);
    if (!on) {
      if (host) { host.remove(); host = null; fab = null; menu = null; open = false; }
      return;
    }
    ensure();
    if (open) renderMenu();
  }

  function reset() {
    if (docListener) {
      document.removeEventListener('click', docListener, true);
      docListener = null;
    }
    if (host) { host.remove(); host = null; fab = null; menu = null; open = false; }
  }

  return {
    apply: apply,
    reset: reset,
    openMenu: openMenu,
    closeMenu: closeMenu,
    isOpen: function () { return open; }
  };
});
