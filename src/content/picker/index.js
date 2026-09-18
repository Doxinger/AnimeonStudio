AONC.define('content.picker', function (A) {
  'use strict';

  var existing = A.content.picker || {};

  var state = {
    active: false,
    hovered: null,
    locked: null,
    lastLabel: '',
    handlers: []
  };

  function isOwnUi(el) {
    var node = el;
    while (node) {
      if (node.nodeType === 1 && node.getAttribute && node.getAttribute('data-aonc-ui')) return true;
      var root = node.getRootNode ? node.getRootNode() : null;
      if (root && root !== node.ownerDocument && root.host) {
        node = root.host;
        continue;
      }
      node = node.parentElement;
    }
    return false;
  }

  function isOwnEvent(event) {
    if (!event || typeof event.composedPath !== 'function') return false;
    var path = event.composedPath();
    for (var i = 0; i < path.length; i++) {
      var n = path[i];
      if (n && n.nodeType === 1 && n.getAttribute && n.getAttribute('data-aonc-ui')) return true;
    }
    return false;
  }

  function dragBusy() {
    var drag = A.content.picker.drag;
    return !!drag && (drag.active() || drag.recent());
  }

  function onMove(event) {
    if (!state.active || state.locked) return;
    if (isOwnEvent(event)) return;
    var el = document.elementFromPoint(event.clientX, event.clientY);
    if (!el || isOwnUi(el)) return;
    if (el === state.hovered) return;
    state.hovered = el;
    var summary = A.dom.inspect.summary(el);
    state.lastLabel = describe(summary);
    A.content.picker.overlay.highlight(el, state.lastLabel);
  }

  // Подсветка position:fixed — при прокрутке рамка обязана следовать за
  // элементом (и за hover, и за locked); снесённый React-ре-рендером узел
  // подсветку снимает.
  function onScroll() {
    if (!state.active) return;
    var el = state.locked || state.hovered;
    if (el && el.isConnected) {
      A.content.picker.overlay.highlight(el, state.lastLabel);
    } else if (el) {
      state.hovered = null;
      A.content.picker.overlay.clear();
    }
  }

  function describe(summary) {
    var tag = summary.tag;
    var id = summary.id ? '#' + summary.id : '';
    var cls = summary.stableClasses.length ? '.' + summary.stableClasses[0] : '';
    var size = summary.width + '×' + summary.height;
    return tag + id + cls + '  ' + size;
  }

  function lockElement(el) {
    if (!el || !el.isConnected) return;
    state.locked = el;
    state.hovered = el;
    var summary = A.dom.inspect.summary(el);
    state.lastLabel = describe(summary);
    A.content.picker.overlay.highlight(el, state.lastLabel);
    A.content.picker.overlay.setDim(true);

    A.content.picker.panel.open(summary, {
      element: el,
      onSave: saveRule,
      onClose: function () { unlock(); }
    });
  }

  function onClick(event) {
    if (!state.active) return;
    if (isOwnEvent(event)) return;
    if (dragBusy()) { event.preventDefault(); event.stopPropagation(); return; }
    var el = document.elementFromPoint(event.clientX, event.clientY);
    if (!el || isOwnUi(el)) return;

    event.preventDefault();
    event.stopPropagation();
    lockElement(el);
  }

  function unlock() {
    if (A.content.picker.drag.active()) A.content.picker.drag.cancel();
    state.locked = null;
    A.content.picker.overlay.setDim(false);
    A.content.picker.overlay.clear();
    A.content.picker.panel.hide();
  }

  function saveRule(rule) {
    var config = A.content.config.current();
    var rules = (config.elements.rules || []).slice();
    var index = -1;
    for (var i = 0; i < rules.length; i++) {
      if (rules[i].id === rule.id || (rule.selector && rules[i].selector === rule.selector)) index = i;
    }
    if (index >= 0) rules[index] = rule;
    else rules.push(rule);

    A.content.config.patch({ elements: { rules: rules } }).then(function () {
      A.content.toast.ok(index >= 0 ? 'Правило обновлено' : 'Правило добавлено');
      if (state.active || state.locked) unlock();
      A.content.applier.reapply();
    }, function (e) {
      A.content.toast.error('Не удалось сохранить: ' + e.message);
    });
  }

  function onKeydown(event) {
    if (!state.active) return;

    if (A.content.picker.drag.active()) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        A.content.picker.drag.cancel();
      }
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      if (state.locked) unlock();
      else stop();
      return;
    }

    // Печать в полях сайта не должна прятать элементы и открывать панель
    if (targetEditable(event)) return;

    if (event.key === 'Enter' && state.hovered && !state.locked) {
      event.preventDefault();
      // Берём именно подсвеченный элемент: координаты последнего mousemove
      // после прокрутки указывают уже на другой узел.
      lockElement(state.hovered);
      return;
    }

    if ((event.key === 'h' || event.key === 'H' || event.key === 'р' || event.key === 'Р') && state.hovered && !state.locked) {
      event.preventDefault();
      quickHide(state.hovered);
    }
  }

  function targetEditable(event) {
    var path = event && typeof event.composedPath === 'function' ? event.composedPath() : [];
    var node = path[0] || (event && event.target) || null;
    if (!node || node.nodeType !== 1) return false;
    var tag = String(node.tagName || '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    return !!node.isContentEditable;
  }

  // target — DOM-элемент (клик/хоткей) либо {selector} / строка (сообщение
  // ELEMENT_hide из контекстного меню, где элемента под рукой нет).
  function quickHide(target) {
    var el = target && target.nodeType === 1 ? target : null;
    var selector = el ? '' : String((target && target.selector) || (typeof target === 'string' ? target : '')).trim();
    if (!el && !selector) return;

    var summary = el ? A.dom.inspect.summary(el) : null;
    var rule = A.lang.normalize(A.config.defaults.elementRule, {
      id: A.lang.uid('rule'),
      name: el
        ? (summary.text ? summary.text.slice(0, 30) : summary.tag)
        : selector.slice(0, 30),
      selector: el ? summary.selector : selector,
      action: 'hide',
      hideStrategy: 'display',
      createdAt: Date.now()
    });
    saveRule(rule);
    A.content.toast.ok('Скрыто: ' + (rule.name || rule.selector));
  }

  function onContextMenu(event) {
    if (!state.active) return;
    if (isOwnEvent(event)) return;
    if (dragBusy()) { event.preventDefault(); event.stopPropagation(); return; }
    var el = document.elementFromPoint(event.clientX, event.clientY);
    if (!el || isOwnUi(el)) return;
    event.preventDefault();
    event.stopPropagation();
    lockElement(el);
  }

  function start() {
    if (state.active) return true;
    state.active = true;
    state.locked = null;
    document.documentElement.classList.add('aonc-picker');

    A.content.ui.shadowHost.create; // ensure module present
    var style = document.createElement('style');
    style.id = 'aonc-picker-cursor';
    style.setAttribute('data-aonc', '1');
    style.textContent = 'html.aonc-picker, html.aonc-picker * { cursor: crosshair !important; }';
    (document.head || document.documentElement).appendChild(style);
    state.cursorStyle = style;

    state.handlers = [
      A.dom.ready.onEvent(window, 'mousemove', onMove, true),
      A.dom.ready.onEvent(window, 'click', onClick, true),
      A.dom.ready.onEvent(window, 'contextmenu', onContextMenu, true),
      A.dom.ready.onEvent(window, 'keydown', onKeydown, true),
      A.dom.ready.onEvent(window, 'scroll', onScroll, { passive: true })
    ];

    A.content.toast.show('Пипетка: клик — выбрать, H — скрыть, ПКМ — панель, Esc — выход', { duration: 4200 });
    A.content.classes.setRuntime('aonc-picker', true);
    notify(true);
    return true;
  }

  function stop() {
    if (!state.active) return false;
    if (A.content.picker.drag.active()) A.content.picker.drag.cancel();
    state.active = false;
    state.hovered = null;
    state.locked = null;
    state.lastLabel = '';
    state.handlers.forEach(function (off) { try { off(); } catch (e) {} });
    state.handlers = [];
    document.documentElement.classList.remove('aonc-picker');
    A.content.classes.setRuntime('aonc-picker', false);
    if (state.cursorStyle && state.cursorStyle.parentNode) state.cursorStyle.parentNode.removeChild(state.cursorStyle);
    A.content.picker.overlay.destroy();
    A.content.picker.panel.destroy();
    notify(false);
    return true;
  }

  function toggle() {
    return state.active ? (stop(), false) : (start(), true);
  }

  function notify(active) {
    A.api.sendMessage(A.messaging.msg(A.messaging.TYPE.PICKER_STATE, { active: active }));
  }

  function isActive() { return state.active; }

  function hideAt(selector) {
    var el = A.dom.ready.first([selector]);
    if (el) quickHide(el);
  }

  return Object.assign({}, existing, {
    start: start,
    stop: stop,
    toggle: toggle,
    isActive: isActive,
    quickHide: quickHide,
    hideAt: hideAt
  });
});
