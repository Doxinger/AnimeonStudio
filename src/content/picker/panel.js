AONC.define('content.picker.panel', function (A) {
  'use strict';

  var h = null;
  var refs = {};
  var draft = null;
  var tab = 'hide';
  var onSave = null;
  var onClose = null;
  var previewStyle = null;
  var lockedEl = null;

  var STRATEGIES = [
    { id: 'display', label: 'display: none' },
    { id: 'visibility', label: 'visibility: hidden' },
    { id: 'opacity', label: 'opacity: 0' },
    { id: 'collapse', label: 'Схлопнуть (height: 0)' },
    { id: 'offscreen', label: 'Увести за экран' }
  ];

  var SLIDERS = [
    { key: 'opacity', label: 'Прозрачность', min: 0, max: 1, step: 0.05, fmt: function (v) { return v.toFixed(2); } },
    { key: 'blur', label: 'Размытие', min: 0, max: 24, step: 0.5, fmt: function (v) { return v + 'px'; } },
    { key: 'scale', label: 'Масштаб', min: 0.2, max: 3, step: 0.05, fmt: function (v) { return v.toFixed(2) + '×'; } },
    { key: 'grayscale', label: 'Обесцветить', min: 0, max: 100, step: 5, fmt: function (v) { return v + '%'; } },
    { key: 'brightness', label: 'Яркость', min: 0.2, max: 2, step: 0.05, fmt: function (v) { return v.toFixed(2) + '×'; } },
    { key: 'fontSize', label: 'Кегль', min: 8, max: 48, step: 1, fmt: function (v) { return v + 'px'; } },
    { key: 'radius', label: 'Скругление', min: 0, max: 48, step: 1, fmt: function (v) { return v + 'px'; } }
  ];

  var COLORS = [
    { key: 'background', label: 'Фон' },
    { key: 'color', label: 'Текст' }
  ];

  var AXES = [
    { key: 'dx', label: 'Сдвиг по X' },
    { key: 'dy', label: 'Сдвиг по Y' }
  ];

  var TEXTS = [
    { key: 'border', label: 'Рамка', placeholder: '1px solid #7C4DFF' },
    { key: 'width', label: 'Ширина', placeholder: 'auto / 320px / 50%' },
    { key: 'height', label: 'Высота', placeholder: 'auto / 48px' },
    { key: 'margin', label: 'Отступы', placeholder: '0 / 8px 0' },
    { key: 'padding', label: 'Поля', placeholder: '0 / 8px 12px' },
    { key: 'zIndex', label: 'z-index', placeholder: '10' },
    { key: 'position', label: 'position', placeholder: 'static / fixed' },
    { key: 'pointerEvents', label: 'pointer-events', placeholder: 'auto / none' }
  ];

  function ensure() {
    if (h && h.host.isConnected) return;
    var cssText = A.content.picker.panelCssText;
    h = A.content.ui.shadowHost.create({ name: 'picker-panel', css: typeof cssText === 'function' ? cssText() : cssText });
    build();
  }

  function build() {
    var el = A.content.ui.shadowHost.el;
    h.container.innerHTML = '';

    var panel = el('div', { class: 'panel' });

    var hd = el('div', { class: 'hd' }, [
      el('b', { text: 'Пипетка' }),
      el('span', { class: 'badge', text: 'Esc — выход' }),
      el('span', { class: 'sp' }),
      el('button', { class: 'ic', title: 'Скопировать селектор', text: '⧉', onclick: function () { copySelector(); } }),
      el('button', { class: 'ic danger', title: 'Закрыть', text: '✕', onclick: function () { close(); } })
    ]);

    var bd = el('div', { class: 'bd' });

    refs.crumb = el('div', { class: 'crumb', text: '—' });
    bd.appendChild(refs.crumb);

    var selRow = el('div', { class: 'sel' });
    refs.selector = el('textarea', {
      spellcheck: 'false',
      oninput: function () { draft.selector = refs.selector.value; preview(); }
    });
    selRow.appendChild(refs.selector);
    bd.appendChild(selRow);

    refs.matches = el('div', { class: 'hint', text: '' });
    bd.appendChild(refs.matches);

    var tabs = el('div', { class: 'tabs' }, [
      el('button', { text: 'Скрыть', 'data-tab': 'hide', onclick: function () { setTab('hide'); } }),
      el('button', { text: 'Стиль', 'data-tab': 'style', onclick: function () { setTab('style'); } }),
      el('button', { text: 'Двигать', 'data-tab': 'move', onclick: function () { setTab('move'); } }),
      el('button', { text: 'CSS', 'data-tab': 'css', onclick: function () { setTab('css'); } })
    ]);
    refs.tabs = tabs;
    bd.appendChild(tabs);

    var secHide = el('div', { class: 'sec', 'data-sec': 'hide' });
    secHide.appendChild(el('div', { class: 'ttl', text: 'Способ скрытия' }));
    refs.strategy = el('select', {
      onchange: function () { draft.hideStrategy = refs.strategy.value; draft.action = 'hide'; preview(); }
    });
    STRATEGIES.forEach(function (s) {
      refs.strategy.appendChild(el('option', { value: s.id, text: s.label }));
    });
    secHide.appendChild(rowOf('Селектор', refs.strategy));
    secHide.appendChild(el('div', { class: 'hint', text: 'Элемент убирается со страницы. «Схлопнуть» и «Увести за экран» сохраняют его в DOM — полезно, если сайт падает без узла.' }));
    bd.appendChild(secHide);

    var secStyle = el('div', { class: 'sec', 'data-sec': 'style' });
    secStyle.appendChild(el('div', { class: 'ttl', text: 'Свойства' }));
    draft = draft || {};
    refs.sliders = {};
    SLIDERS.forEach(function (s) {
      var input = el('input', {
        type: 'range', min: String(s.min), max: String(s.max), step: String(s.step),
        oninput: function () {
          draft.style[s.key] = input.value === '' ? '' : Number(input.value);
          refs.sliders[s.key].out.textContent = s.fmt(Number(input.value));
          draft.action = 'style';
          preview();
        }
      });
      var out = el('output', { text: '—' });
      refs.sliders[s.key] = { input: input, out: out };
      secStyle.appendChild(rowOf(s.label, input, out));
    });

    refs.colors = {};
    COLORS.forEach(function (c) {
      var input = el('input', {
        type: 'color',
        oninput: function () {
          draft.style[c.key] = refs.swatches[c.key].checked ? input.value : '';
          draft.action = 'style';
          preview();
        }
      });
      var sw = el('input', {
        type: 'checkbox',
        onchange: function () {
          draft.style[c.key] = sw.checked ? input.value : '';
          draft.action = 'style';
          preview();
        }
      });
      refs.colors[c.key] = input;
      refs.swatches = refs.swatches || {};
      refs.swatches[c.key] = sw;
      secStyle.appendChild(el('label', { class: 'sw' }, [sw, el('span', { text: c.label }), input]));
    });

    refs.texts = {};
    TEXTS.forEach(function (t) {
      var input = el('input', {
        type: 'text', placeholder: t.placeholder,
        oninput: function () { draft.style[t.key] = input.value.trim(); draft.action = 'style'; preview(); }
      });
      refs.texts[t.key] = input;
      secStyle.appendChild(rowOf(t.label, input));
    });
    bd.appendChild(secStyle);

    var secMove = el('div', { class: 'sec', 'data-sec': 'move' });
    secMove.appendChild(el('div', { class: 'ttl', text: 'Перемещение' }));
    refs.move = {};
    AXES.forEach(function (axis) {
      var num = el('input', {
        type: 'number', class: 'num', step: '1', placeholder: '0',
        oninput: function () { setMove(axis.key, num.value === '' ? '' : Math.round(Number(num.value) || 0)); }
      });
      var range = el('input', {
        type: 'range', min: '-600', max: '600', step: '1',
        oninput: function () { setMove(axis.key, Number(range.value)); }
      });
      refs.move[axis.key] = { range: range, num: num };
      secMove.appendChild(rowOf(axis.label, range, num));
    });
    refs.dragBtn = el('button', { class: 'btn', text: '✥ Тянуть мышью', onclick: function () { startDrag(); } });
    secMove.appendChild(el('div', { class: 'btns' }, [
      refs.dragBtn,
      el('button', { class: 'btn', text: 'Вернуть на место', onclick: function () { resetPos(); } })
    ]));
    secMove.appendChild(el('div', { class: 'hint', text: 'Сдвиг идёт через transform — соседние элементы не разъезжаются. «Тянуть мышью»: панель спрячется, зажмите элемент на странице и перетащите; Esc — отмена.' }));
    bd.appendChild(secMove);

    var secCss = el('div', { class: 'sec', 'data-sec': 'css' });
    secCss.appendChild(el('div', { class: 'ttl', text: 'Свой CSS для этого селектора' }));
    refs.rawCss = el('textarea', {
      spellcheck: 'false',
      style: 'width:100%;min-height:110px;background:#101014;color:#c9f2c9;border:1px solid var(--line);border-radius:8px;padding:8px;font-family:ui-monospace,Menlo,monospace;font-size:11px;line-height:1.5;resize:vertical;',
      oninput: function () { draft.rawCss = refs.rawCss.value; preview(); }
    });
    secCss.appendChild(refs.rawCss);
    secCss.appendChild(el('div', { class: 'hint', text: 'Пишите только объявления, без селектора и скобок. Например: border: 2px solid red;' }));
    bd.appendChild(secCss);

    refs.name = el('input', { type: 'text', placeholder: 'Название правила (необязательно)' });
    bd.appendChild(rowOf('Название', refs.name));

    refs.urlPatterns = el('input', { type: 'text', placeholder: 'например /anime/* (пусто = везде)' });
    bd.appendChild(rowOf('Только на URL', refs.urlPatterns));

    refs.important = el('input', { type: 'checkbox' });
    refs.important.checked = true;
    bd.appendChild(el('label', { class: 'sw' }, [refs.important, el('span', { text: '!important' })]));

    var ft = el('div', { class: 'ft' }, [
      el('button', { class: 'btn', text: 'Сброс', onclick: function () { resetDraft(); } }),
      el('span', { class: 'sp', style: 'flex:1' }),
      el('button', { class: 'btn primary', text: 'Сохранить', onclick: function () { save(); } })
    ]);

    panel.appendChild(hd);
    panel.appendChild(bd);
    panel.appendChild(ft);
    h.container.appendChild(panel);
    refs.panel = panel;

    setTab('hide');
  }

  function rowOf(label, control, output) {
    var el = A.content.ui.shadowHost.el;
    var children = [el('label', { text: label }), control];
    if (output) children.push(output);
    return el('div', { class: 'row' }, children);
  }

  function setTab(next) {
    tab = next;
    var buttons = refs.tabs.querySelectorAll('button');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].classList.toggle('on', buttons[i].getAttribute('data-tab') === next);
    }
    var secs = refs.panel.querySelectorAll('[data-sec]');
    for (var j = 0; j < secs.length; j++) {
      secs[j].hidden = secs[j].getAttribute('data-sec') !== next;
    }
  }

  function syncControls() {
    refs.selector.value = draft.selector || '';
    refs.strategy.value = draft.hideStrategy || 'display';
    refs.rawCss.value = draft.rawCss || '';
    refs.name.value = draft.name || '';
    refs.urlPatterns.value = (draft.urlPatterns || []).join(', ');
    refs.important.checked = draft.important !== false;

    SLIDERS.forEach(function (s) {
      var v = draft.style[s.key];
      var has = v !== '' && v != null && !isNaN(Number(v));
      refs.sliders[s.key].input.value = has ? String(v) : String(s.min);
      refs.sliders[s.key].out.textContent = has ? s.fmt(Number(v)) : '—';
    });

    COLORS.forEach(function (c) {
      var v = draft.style[c.key];
      var on = !!v && /^#/.test(String(v));
      refs.swatches[c.key].checked = on;
      refs.colors[c.key].value = on ? String(v).slice(0, 7) : '#7c4dff';
    });

    TEXTS.forEach(function (t) {
      refs.texts[t.key].value = draft.style[t.key] == null ? '' : String(draft.style[t.key]);
    });

    AXES.forEach(function (axis) {
      var v = draft.style[axis.key];
      var n = Number(v);
      var has = v !== '' && v != null && isFinite(n);
      refs.move[axis.key].range.value = has ? String(A.lang.clamp(Math.round(n), -600, 600)) : '0';
      refs.move[axis.key].num.value = has ? String(Math.round(n)) : '';
    });

    updateMatches();
  }

  function setMove(key, value) {
    draft.style[key] = value;
    draft.action = 'style';
    var m = refs.move[key];
    if (m) {
      var n = Number(value);
      var has = value !== '' && isFinite(n);
      m.range.value = has ? String(A.lang.clamp(n, -600, 600)) : '0';
      m.num.value = has ? String(n) : '';
    }
    preview();
  }

  function updateMatches() {
    var n = A.dom.selector.countMatches(draft.selector || '');
    refs.matches.textContent = A.dom.selector.isValid(draft.selector || '')
      ? 'Найдено элементов: ' + n
      : '⚠ Некорректный селектор';
    refs.matches.style.color = n > 0 ? '' : '#ff9b9b';
  }

  function draftRule() {
    return {
      id: draft.id,
      name: (refs.name.value || draft.name || '').trim(),
      selector: (refs.selector.value || draft.selector || '').trim(),
      urlPatterns: A.css.pattern.normalizeList(refs.urlPatterns.value),
      enabled: true,
      action: tab === 'hide' ? 'hide' : (draft.action || 'style'),
      important: refs.important.checked,
      hideStrategy: draft.hideStrategy || 'display',
      style: draft.style || {},
      rawCss: (refs.rawCss.value || '').trim(),
      createdAt: draft.createdAt || Date.now()
    };
  }

  function preview() {
    var rule = draftRule();
    var css = A.cssBuilder.elements.buildRule(rule, location.pathname + location.search);
    if (!previewStyle) {
      previewStyle = document.createElement('style');
      previewStyle.id = 'aonc-picker-preview';
      previewStyle.setAttribute('data-aonc', '1');
    }
    previewStyle.textContent = css || '';
    var host = document.head || document.documentElement;
    if (previewStyle.parentNode !== host) host.appendChild(previewStyle);
    updateMatches();
  }

  function clearPreview() {
    if (previewStyle && previewStyle.parentNode) previewStyle.parentNode.removeChild(previewStyle);
  }

  function resetDraft() {
    draft = A.lang.clone(A.config.defaults.elementRule);
    draft.id = A.lang.uid('rule');
    draft.selector = refs.selector.value || '';
    syncControls();
    clearPreview();
  }

  function resetPos() {
    draft.style.dx = '';
    draft.style.dy = '';
    draft.action = 'style';
    syncControls();
    preview();
  }

  function startDrag() {
    var drag = A.content.picker.drag;
    if (drag.active()) { drag.cancel(); return; }
    if (!lockedEl || !lockedEl.isConnected) { A.content.toast.error('Элемент не найден на странице'); return; }
    A.content.picker.overlay.setDim(false);
    if (h) h.host.style.display = 'none';
    drag.begin(lockedEl, {
      getBase: function () {
        return { dx: Number(draft.style.dx) || 0, dy: Number(draft.style.dy) || 0 };
      },
      onChange: function (dx, dy) {
        draft.style.dx = dx;
        draft.style.dy = dy;
        draft.action = 'style';
        preview();
      },
      onEnd: function () {
        syncControls();
        setTab('move');
        if (h) h.host.style.display = '';
        A.content.picker.overlay.setDim(true);
      }
    });
    A.content.toast.show('Зажмите элемент и тяните · Esc — отмена', { duration: 3200 });
  }

  function copySelector() {
    var text = refs.selector.value || '';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        A.content.toast.ok('Селектор скопирован');
      }, function () { fallbackCopy(text); });
    } else fallbackCopy(text);
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); A.content.toast.ok('Селектор скопирован'); }
    catch (e) { A.content.toast.error('Не удалось скопировать'); }
    if (ta.parentNode) ta.parentNode.removeChild(ta);
  }

  function save() {
    var rule = draftRule();
    if (!rule.selector) { A.content.toast.error('Пустой селектор'); return; }
    clearPreview();
    if (typeof onSave === 'function') onSave(rule);
  }

  function close() {
    clearPreview();
    if (typeof onClose === 'function') onClose();
  }

  function open(summary, options) {
    ensure();
    var opts = options || {};
    onSave = opts.onSave || null;
    onClose = opts.onClose || null;
    lockedEl = opts.element && opts.element.isConnected ? opts.element : null;

    draft = opts.rule
      ? A.lang.normalize(A.config.defaults.elementRule, opts.rule)
      : A.lang.normalize(A.config.defaults.elementRule, {});

    if (!opts.rule) {
      draft.id = A.lang.uid('rule');
      // Дефолт схемы — 'hide'; для нового черновика ставим 'style', иначе
      // сохранение с вкладки «Стиль»/«CSS» (где action не переопределялся
      // контролами) спрячет элемент вместе со стилями. Вкладка «Скрыть»
      // в draftRule всё равно форсирует 'hide'.
      draft.action = 'style';
      draft.selector = summary.selector || '';
      draft.name = summary.text ? summary.text.slice(0, 30) : summary.tag;
    }

    refs.crumb.textContent = summary.crumb || summary.selector || '—';
    syncControls();
    h.host.style.display = '';
  }

  function hide() {
    if (h) h.host.style.display = 'none';
    clearPreview();
  }

  function isVisible() {
    return !!(h && h.host.style.display !== 'none' && h.host.isConnected);
  }

  function destroy() {
    clearPreview();
    lockedEl = null;
    if (h) { h.remove(); h = null; refs = {}; }
  }

  return { open: open, hide: hide, destroy: destroy, isVisible: isVisible, setTab: setTab, preview: preview, draftRule: draftRule };
});
