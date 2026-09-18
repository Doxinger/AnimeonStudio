AONC.define('content.hotkeys', function (A) {
  'use strict';

  var ACTIONS = {
    picker: { label: 'Пипетка элементов', keys: 'Alt+Shift+P' },
    theater: { label: 'Театральный режим', keys: 'Alt+Shift+T' },
    cinema: { label: 'Киносвет', keys: 'Alt+Shift+C' },
    maxplayer: { label: 'Плеер на весь экран', keys: 'Alt+Shift+M' },
    toggle: { label: 'Вкл/выкл расширение', keys: 'Alt+Shift+E' },
    reload: { label: 'Перезагрузить страницу', keys: 'Alt+Shift+R' },
    top: { label: 'В начало страницы', keys: 'Alt+Shift+Home' },
    hideHeader: { label: 'Скрыть шапку', keys: 'Alt+Shift+H' },
    cheatsheet: { label: 'Шпаргалка клавиш', keys: 'Alt+Shift+K' }
  };

  var state = { handler: null, enabled: true, headerHidden: false };

  function describe(event) {
    var parts = [];
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    if (event.ctrlKey) parts.push('Ctrl');
    if (event.metaKey) parts.push('Meta');
    var key = event.key === ' ' ? 'Space' : event.key;
    if (key && key.length === 1) key = key.toUpperCase();
    parts.push(key);
    return parts.join('+');
  }

  function isEditable(target) {
    if (!target) return false;
    var tag = target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (target.isContentEditable) return true;
    return false;
  }

  function run(action) {
    switch (action) {
      case 'picker':
        A.content.picker.toggle();
        return true;
      case 'theater':
        A.content.tweaks.player.toggleTheater();
        return true;
      case 'cinema':
        A.content.tweaks.player.toggleCinema();
        return true;
      case 'maxplayer':
        A.content.tweaks.player.toggleMaxPlayer();
        return true;
      case 'toggle':
        A.api.sendMessage(A.messaging.msg(A.messaging.TYPE.TOGGLE_ENABLED));
        return true;
      case 'reload':
        A.content.applier.reapply();
        location.reload();
        return true;
      case 'top':
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return true;
      case 'cheatsheet':
        A.content.ui.cheatsheet.toggle();
        return true;
      case 'hideHeader':
        state.headerHidden = !state.headerHidden;
        var header = A.dom.ready.first(A.config.selectors.structure.header);
        if (header) header.style.display = state.headerHidden ? 'none' : '';
        return true;
      default:
        return false;
    }
  }

  function findAction(combo) {
    var keys = Object.keys(ACTIONS);
    for (var i = 0; i < keys.length; i++) {
      if (ACTIONS[keys[i]].keys === combo) return keys[i];
    }
    return null;
  }

  function onKeydown(event) {
    if (!state.enabled) return;
    if (!event.altKey || !event.shiftKey) return;
    if (event.ctrlKey || event.metaKey) return;

    var combo = describe(event);
    var action = findAction(combo);
    if (!action) return;
    if (action !== 'picker' && isEditable(event.target)) return;

    if (run(action)) {
      event.preventDefault();
      event.stopPropagation();
      A.content.toast.show(ACTIONS[action].label + ' — ' + combo);
    }
  }

  function enable() {
    if (state.handler) return;
    state.handler = onKeydown;
    window.addEventListener('keydown', state.handler, true);
    state.enabled = true;
  }

  function disable() {
    if (state.handler) window.removeEventListener('keydown', state.handler, true);
    state.handler = null;
  }

  function apply(config) {
    if (config.player && config.player.hotkeys) enable();
    else disable();
  }

  function list() {
    return Object.keys(ACTIONS).map(function (k) {
      return { id: k, label: ACTIONS[k].label, keys: ACTIONS[k].keys };
    });
  }

  return { apply: apply, enable: enable, disable: disable, run: run, list: list, ACTIONS: ACTIONS };
});
