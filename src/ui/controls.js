AONC.define('ui.controls', function (A) {
  'use strict';

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v == null) return;
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k === 'value') node.value = v;
      else if (k === 'checked') node.checked = !!v;
      else if (k === 'disabled') node.disabled = !!v;
      else if (k.indexOf('on') === 0 && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
      else node.setAttribute(k, v);
    });
    (children || []).forEach(function (c) {
      if (c == null) return;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }

  function label(text, hint) {
    var wrap = el('span', { class: 'ctl-label' }, [el('span', { text: text })]);
    if (hint) wrap.appendChild(el('small', { class: 'ctl-hint', text: hint }));
    return wrap;
  }

  function toggle(def, value, onChange) {
    var input = el('input', {
      type: 'checkbox',
      checked: !!value,
      onchange: function () { onChange(!!input.checked); }
    });
    return el('label', { class: 'ctl ctl-toggle' }, [
      el('span', { class: 'switch' }, [input, el('span', { class: 'track' })]),
      label(def.label, def.hint)
    ]);
  }

  function slider(def, value, onChange) {
    var out = el('output', { text: format(def, value) });
    var input = el('input', {
      type: 'range',
      min: String(def.min),
      max: String(def.max),
      step: String(def.step || 1),
      value: String(value == null ? def.min : value),
      oninput: function () {
        var v = Number(input.value);
        out.textContent = format(def, v);
        onChange(v);
      }
    });
    var reset = def.reset != null
      ? el('button', {
        class: 'mini', type: 'button', title: 'Сбросить', text: '↺',
        onclick: function () {
          input.value = String(def.reset);
          out.textContent = format(def, def.reset);
          onChange(def.reset);
        }
      })
      : null;

    return el('div', { class: 'ctl ctl-slider' }, [
      label(def.label, def.hint),
      el('div', { class: 'ctl-row' }, [input, out, reset])
    ]);
  }

  function format(def, v) {
    var n = Number(v);
    if (!isFinite(n)) return String(v);
    var digits = def.step && def.step < 1 ? String(def.step).split('.')[1].length : 0;
    var text = n.toFixed(digits);
    if (def.suffix) text += def.suffix;
    if (def.format === 'percent' || def.suffix === '%') text = Math.round(n) + '%';
    return text;
  }

  function color(def, value, onChange) {
    var normalized = normalizeColor(value);
    var input = el('input', {
      type: 'color',
      value: normalized,
      oninput: function () {
        text.value = input.value;
        onChange(input.value);
      }
    });
    var text = el('input', {
      type: 'text',
      class: 'mono',
      value: value == null ? '' : String(value),
      placeholder: def.placeholder || '#000000',
      spellcheck: 'false',
      oninput: function () {
        var v = text.value.trim();
        if (/^#[0-9a-f]{6}$/i.test(v)) input.value = v;
        onChange(v);
      }
    });
    var allowEmpty = def.allowEmpty !== false;
    var clear = allowEmpty
      ? el('button', {
        class: 'mini', type: 'button', title: 'Авто', text: '⌀',
        onclick: function () {
          text.value = '';
          onChange('');
        }
      })
      : null;

    return el('div', { class: 'ctl ctl-color' }, [
      label(def.label, def.hint),
      el('div', { class: 'ctl-row' }, [input, text, clear])
    ]);
  }

  function normalizeColor(value) {
    var v = String(value || '').trim();
    if (/^#[0-9a-f]{6}$/i.test(v)) return v;
    if (/^#[0-9a-f]{3}$/i.test(v)) return '#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3];
    return '#7c4dff';
  }

  function select(def, value, onChange) {
    var input = el('select', {
      onchange: function () { onChange(input.value); }
    });
    (def.options || []).forEach(function (opt) {
      var o = typeof opt === 'string' ? { value: opt, label: opt } : opt;
      var node = el('option', { value: o.value, text: o.label });
      if (o.group) node.setAttribute('data-group', o.group);
      input.appendChild(node);
    });
    input.value = value == null ? '' : String(value);
    if (input.value !== String(value)) input.value = '';

    return el('div', { class: 'ctl ctl-select' }, [
      label(def.label, def.hint),
      el('div', { class: 'ctl-row' }, [input])
    ]);
  }

  function text(def, value, onChange) {
    var input = el('input', {
      type: 'text',
      class: def.mono ? 'mono' : null,
      value: value == null ? '' : String(value),
      placeholder: def.placeholder || '',
      spellcheck: 'false',
      oninput: function () { onChange(input.value); }
    });
    return el('div', { class: 'ctl ctl-text' }, [
      label(def.label, def.hint),
      el('div', { class: 'ctl-row' }, [input])
    ]);
  }

  function textarea(def, value, onChange) {
    var input = el('textarea', {
      class: def.mono === false ? '' : 'mono code',
      rows: String(def.rows || 8),
      spellcheck: 'false',
      placeholder: def.placeholder || '',
      oninput: function () { onChange(input.value); }
    });
    input.value = value == null ? '' : String(value);

    var meta = el('div', { class: 'ctl-meta' });
    var updateMeta = function () {
      var v = input.value;
      meta.textContent = v.trim() ? (v.length + ' симв. · ' + v.split('\n').length + ' строк') : 'пусто';
    };
    input.addEventListener('input', updateMeta);
    updateMeta();

    var actions = el('div', { class: 'ctl-row' });
    if (def.onFormat) {
      actions.appendChild(el('button', {
        class: 'mini', type: 'button', text: 'Формат',
        onclick: function () {
          input.value = def.onFormat(input.value);
          onChange(input.value);
          updateMeta();
        }
      }));
    }
    actions.appendChild(el('button', {
      class: 'mini', type: 'button', text: 'Очистить',
      onclick: function () { input.value = ''; onChange(''); updateMeta(); }
    }));

    return el('div', { class: 'ctl ctl-textarea' }, [
      label(def.label, def.hint),
      input,
      el('div', { class: 'ctl-row between' }, [meta, actions])
    ]);
  }

  function button(def, value, onChange, ctx) {
    return el('div', { class: 'ctl ctl-button' }, [
      el('button', {
        class: 'btn ' + (def.variant || ''),
        type: 'button',
        text: def.label,
        title: def.hint || '',
        onclick: function () {
          if (def.actionId) A.ui.actions.run(def.actionId, ctx);
          else if (def.action) def.action(ctx);
        }
      })
    ]);
  }

  function info(def) {
    return el('div', { class: 'ctl ctl-info ' + (def.tone || '') }, [
      def.label ? el('b', { text: def.label }) : null,
      el('span', { html: def.html || A.lang.escapeHtml(def.text || '') })
    ]);
  }

  function heading(def) {
    return el('div', { class: 'ctl-heading' }, [el('span', { text: def.label })]);
  }

  var BUILDERS = {
    toggle: toggle,
    slider: slider,
    color: color,
    select: select,
    text: text,
    textarea: textarea,
    button: button,
    info: info,
    heading: heading
  };

  function localize(def) {
    var i18n = A.ui.i18n;
    if (!i18n || i18n.locale() !== 'en') return def;

    var out = Object.assign({}, def);
    out.label = i18n.controlLabel(def);
    if (def.path) out.hint = i18n.t('hint.' + def.path, def.hint);
    if (def.options) {
      out.options = def.options.map(function (opt) {
        if (typeof opt === 'string') return opt;
        return Object.assign({}, opt, {
          label: i18n.optionLabel(def.path, opt.value, opt.label)
        });
      });
    }
    return out;
  }

  function build(def, value, onChange, ctx) {
    var local = localize(def);
    var fn = BUILDERS[local.type] || BUILDERS[local.custom] || info;
    return fn(local, value, onChange, ctx);
  }

  return {
    el: el, label: label, build: build, localize: localize, BUILDERS: BUILDERS,
    toggle: toggle, slider: slider, color: color, select: select,
    text: text, textarea: textarea, button: button, info: info, heading: heading,
    format: format, normalizeColor: normalizeColor
  };
});
