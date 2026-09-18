AONC.define('background.menus', function (A) {
  'use strict';

  var api = A.api.raw;
  if (!api || !api.contextMenus) return { install: function () {} };

  var ITEMS = [
    { id: 'aonc-root', title: 'AnimeOn Studio', contexts: ['all'] },
    { id: 'aonc-sep1', type: 'separator', parentId: 'aonc-root' },
    { id: 'aonc-picker', title: 'Пипетка элементов', parentId: 'aonc-root', contexts: ['all'] },
    { id: 'aonc-hide', title: 'Скрыть этот элемент', parentId: 'aonc-root', contexts: ['all'] },
    { id: 'aonc-sep2', type: 'separator', parentId: 'aonc-root' },
    { id: 'aonc-toggle', title: 'Включить / выключить', parentId: 'aonc-root', contexts: ['all'] },
    { id: 'aonc-theater', title: 'Театральный режим', parentId: 'aonc-root', contexts: ['all'] },
    { id: 'aonc-cinema', title: 'Киносвет', parentId: 'aonc-root', contexts: ['all'] },
    { id: 'aonc-sep3', type: 'separator', parentId: 'aonc-root' },
    { id: 'aonc-studio', title: 'Открыть студию…', parentId: 'aonc-root', contexts: ['all'] },
    { id: 'aonc-reload', title: 'Перезагрузить страницу', parentId: 'aonc-root', contexts: ['all'] }
  ];

  function install() {
    try { api.contextMenus.removeAll(); } catch (e) {}

    ITEMS.forEach(function (item) {
      try {
        api.contextMenus.create(Object.assign({}, item));
      } catch (e) {}
    });

    if (!install.bound) {
      install.bound = true;
      api.contextMenus.onClicked.addListener(function (info, tab) {
        handle(info, tab);
      });
    }
  }

  function selectorFromInfo(info) {
    if (!info) return null;
    if (info.targetElement && info.targetElement.selector) return info.targetElement.selector;
    return null;
  }

  function handle(info, tab) {
    var T = A.messaging.TYPE;
    var msg = A.messaging.msg;

    switch (info.menuItemId) {
      case 'aonc-picker':
        send(tab, msg(T.PICKER_START));
        break;
      case 'aonc-hide':
        // Chrome не отдаёт targetElement в контекстном меню, а Firefox отдаёт
        // элемент без селектора — надёжнее включить пипетку (клик + H), чем
        // открывать студию. Селекторный путь сохранён на будущее.
        var selector = selectorFromInfo(info);
        if (selector) send(tab, msg(T.ELEMENT_HIDE, { selector: selector }));
        else send(tab, msg(T.PICKER_START));
        break;
      case 'aonc-toggle':
        A.background.state.toggle().then(function (config) {
          send(tab, msg(T.APPLY, { config: config }));
          A.background.badge.update(config);
        });
        break;
      case 'aonc-theater':
        send(tab, msg(T.THEATER_TOGGLE));
        break;
      case 'aonc-cinema':
        send(tab, msg(T.CINEMA_TOGGLE));
        break;
      case 'aonc-studio':
        openStudio();
        break;
      case 'aonc-reload':
        if (tab && tab.id != null && api.tabs) api.tabs.reload(tab.id, swallowError(api));
        break;
      default:
        break;
    }
  }

  function send(tab, message) {
    if (!tab || tab.id == null || !A.api.tabs) return Promise.resolve(undefined);
    return A.api.tabs.sendMessage(tab.id, message);
  }

  // Callback-заглушка: без неё Chrome пишет «Unchecked runtime.lastError»
  // на каждый вызов, а у вкладок-однодневок reload/create падают регулярно.
  function swallowError(target) {
    return function () {
      try { void (target && target.runtime && target.runtime.lastError); } catch (e) {}
    };
  }

  function openStudio() {
    if (api.runtime && api.runtime.openOptionsPage) {
      try { api.runtime.openOptionsPage(swallowError(api)); return; } catch (e) {}
    }
    if (api.tabs && api.tabs.create) {
      api.tabs.create({ url: api.runtime.getURL('options/options.html') }, swallowError(api));
    }
  }

  return { install: install, ITEMS: ITEMS, openStudio: openStudio };
});
