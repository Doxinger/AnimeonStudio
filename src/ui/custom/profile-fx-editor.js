// Редактор оформления профиля «как в Steam»: свой фон (узор/ссылка/файл),
// затемнение, виньетка, блюр и картинка на обложку. Живое мини-превью.
AONC.define('ui.custom.profileFxEditor', function (A) {
  'use strict';

  var el = A.ui.controls.el;
  var lib = A.config.wallpapers;

  function fx() {
    return A.lang.normalize(A.config.defaults.profileFx, A.ui.state.get('profileFx') || {});
  }

  function set(path, value, ctx, immediate) {
    A.ui.state.set('profileFx.' + path, value);
    if (ctx) {
      if (immediate) ctx.refresh('cosmetics');
      else ctx.debouncedRefresh();
    }
  }

  function toggleRow(path, labelText, hint, ctx) {
    var input = el('input', {
      type: 'checkbox',
      checked: !!A.ui.state.get('profileFx.' + path),
      onchange: function (e) { set(path, e.target.checked, ctx, true); }
    });
    return el('label', { class: 'sw' }, [
      input,
      el('span', { class: 'track' }),
      el('span', { class: 'sw-text', text: labelText, title: hint || '' })
    ]);
  }

  function selectRow(labelText, options, value, onChange) {
    var select = el('select', { onchange: function (e) { onChange(e.target.value); } });
    options.forEach(function (o) { select.appendChild(el('option', { value: o.value, text: o.label })); });
    select.value = value;
    return el('label', { class: 'field fe-field' }, [el('span', { class: 'field-label', text: labelText }), select]);
  }

  function rangeRow(labelText, min, max, step, value, suffix, onChange) {
    var out = el('output', { text: value + suffix });
    var input = el('input', {
      type: 'range', min: String(min), max: String(max), step: String(step), value: String(value),
      oninput: function () {
        out.textContent = input.value + suffix;
        onChange(Number(input.value));
      }
    });
    return el('label', { class: 'mini-row fe-field' }, [el('span', { text: labelText }), input, out]);
  }

  function preview(f) {
    var w = A.ui.state.get('wallpaper') || {};
    var val = '';
    if (w.enabled !== false) {
      try { val = lib.valueFor(w) || ''; } catch (e) {}
    }
    var layers = [];
    if ((f.vignette | 0) > 0) {
      layers.push('radial-gradient(120% 90% at 50% 40%, rgba(0,0,0,0) 55%, rgba(0,0,0,' + (f.vignette / 100) + ') 100%)');
    }
    if ((f.overlay | 0) > 0) {
      layers.push('linear-gradient(rgba(0,0,0,' + (f.overlay / 100) + '), rgba(0,0,0,' + (f.overlay / 100) + '))');
    }
    var box = el('div', {
      class: 'pfx-preview',
      style: 'position:relative;height:120px;border-radius:12px;overflow:hidden;border:1px solid var(--line);' +
        'background-color:#0b0a11;' +
        (val ? 'background-image:' + layers.join(',') + (layers.length ? ',' : '') + val + ';' : '') +
        'background-size:cover;background-position:center;' +
        (f.blur ? 'filter:blur(' + (f.blur | 0) + 'px);' : '')
    }, [
      el('span', {
        style: 'position:absolute;left:12px;bottom:10px;font-size:11px;color:#fff;text-shadow:0 1px 6px #000;',
        text: val
          ? (f.enabled ? 'Так обои темы выглядят на странице профиля' : 'Включите тумблер, чтобы обои темы легли на профиль')
          : 'В теме не выбраны обои — профиль получит только затемнение и виньетку'
      })
    ]);
    return box;
  }

  function render(def, ctx) {
    var f = fx();
    var wrap = el('div', { class: 'profile-fx-editor frames-editor' });

    wrap.appendChild(el('div', { class: 'list-head' }, [
      el('b', { text: 'Профиль как в Steam' }),
      el('span', { class: 'sp' }),
      toggleRow('enabled', 'Свой фон профиля', 'Картинка или узор позади контента на странице профиля', ctx)
    ]));

    wrap.appendChild(el('div', {
      class: 'hint-inline',
      text: 'Фон берётся из текущих обоев темы (раздел «Фоновое изображение»): на странице профиля он ложится позади контента с затемнением, виньеткой и размытием. Визуальный слой — слоты косметики сайта не меняются, видит только ваш браузер. По умолчанию оформляется только свой профиль.'
    }));

    wrap.appendChild(el('div', { class: 'fe-row' }, [
      toggleRow('onlyMine', 'Только мой профиль', 'Выключите, чтобы фон применялся и к чужим страницам /user/…', ctx),
      selectRow('Обложка', [
        { value: 'site', label: 'Оставить обложку сайта' },
        { value: 'image', label: 'Та же картинка на обложку' }
      ], f.coverMode, function (v) { set('coverMode', v, ctx, true); })
    ]));

    wrap.appendChild(preview(f));

    wrap.appendChild(el('div', { class: 'fe-row' }, [
      rangeRow('Затемнение', 0, 90, 5, f.overlay | 0, '%', function (v) { set('overlay', v, ctx); }),
      rangeRow('Виньетка', 0, 90, 5, f.vignette | 0, '%', function (v) { set('vignette', v, ctx); }),
      rangeRow('Размытие', 0, 24, 1, f.blur | 0, 'px', function (v) { set('blur', v, ctx); })
    ]));

    return wrap;
  }

  return { render: render };
});
