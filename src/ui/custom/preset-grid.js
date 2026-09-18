AONC.define('ui.custom.presetGrid', function (A) {
  'use strict';

  var el = A.ui.controls.el;

  function paletteOf(preset) {
    return A.color.palette.fromTheme(Object.assign({}, A.config.DEFAULTS.theme, preset));
  }

  function swatchStyle(preset) {
    var palette = paletteOf(preset);
    return [
      'background:linear-gradient(135deg,' + palette.background + ' 0%,' + palette.card + ' 55%,' + palette.muted + ' 100%)',
      'border-color:' + palette.border
    ].join(';');
  }

  function bar(width, color, height) {
    return el('i', {
      style: 'display:block;height:' + (height || 5) + 'px;width:' + width +
        ';border-radius:99px;background:' + color
    });
  }

  function miniPreview(preset) {
    var p = paletteOf(preset);
    var radius = (preset.radius || 12) + 'px';
    var dim = A.color.transform.mix(p.foreground, p.background, 0.55);
    var faint = A.color.transform.mix(p.foreground, p.background, 0.78);
    var glass = A.color.convert.rgba(p.card, 0.72);

    return el('div', { class: 'preset-mini' }, [
      el('div', {
        class: 'preset-mini__header',
        style: 'background:' + glass + ';border-bottom:1px solid ' + p.border
      }, [
        el('i', { style: 'display:block;width:12px;height:12px;border-radius:50%;background:' + p.primary }),
        bar('30%', dim, 4),
        bar('16%', faint, 4),
        el('i', { style: 'margin-left:auto;display:block;width:20px;height:8px;border-radius:99px;background:' + p.primary })
      ]),
      el('div', { class: 'preset-mini__body', style: 'background:' + p.background }, [
        el('div', {
          class: 'preset-mini__hero',
          style: 'background:linear-gradient(120deg,' + p.primary + ',' +
            A.color.transform.rotate(p.primary, 42) + ');border-radius:' + radius
        }, [
          bar('62%', 'rgba(255,255,255,.92)', 6),
          bar('40%', 'rgba(255,255,255,.55)', 5)
        ]),
        el('div', { class: 'preset-mini__grid' }, [0, 1, 2].map(function () {
          return el('div', {
            class: 'preset-mini__card',
            style: 'background:' + p.card + ';border:1px solid ' + p.border + ';border-radius:' + radius
          }, [
            el('i', {
              style: 'display:block;height:24px;border-radius:' + radius + ';background:' +
                A.color.transform.mix(p.primary, p.background, 0.5)
            }),
            bar('82%', dim, 4),
            bar('54%', faint, 4)
          ]);
        }))
      ])
    ]);
  }

  function gradeOf(preset) {
    var p = paletteOf(preset);
    var value = A.color.contrast.ratio(p.foreground, p.background);
    var name = A.color.contrast.grade(value);
    return { name: name.replace(/\s+/g, '-').toLowerCase(), label: name, value: value };
  }

  function card(preset, ctx) {
    var active = A.ui.state.get('theme.preset') === preset.id;
    var grade = gradeOf(preset);

    return el('button', {
      class: 'preset-card' + (active ? ' is-current' : ''),
      type: 'button',
      'data-preset': preset.id,
      title: preset.name + ' · ' + grade.label + ' ' + grade.value.toFixed(1) + ':1',
      onclick: function () {
        var patch = A.config.presets.themePatch(preset.id);
        var changes = {};
        Object.keys(patch).forEach(function (k) { changes['theme.' + k] = patch[k]; });
        changes['theme.preset'] = preset.id;
        A.ui.state.setMany(changes);
        ctx.refresh('theme');
      }
    }, [
      miniPreview(preset),
      el('span', { class: 'preset-card__name', text: preset.name }),
      el('span', { class: 'preset-card__meta' }, [
        el('span', { class: 'preset-card__mode', text: preset.mode === 'light' ? 'light' : 'dark' }),
        el('span', {
          class: 'preset-card__grade g-' + grade.name,
          text: grade.label + ' · ' + grade.value.toFixed(1)
        })
      ])
    ]);
  }

  function render(def, ctx) {
    var wrap = el('div', { class: 'preset-grid' });

    A.config.presets.groups().forEach(function (group) {
      wrap.appendChild(el('div', { class: 'preset-group-title', text: group.label }));
      wrap.appendChild(el('div', { class: 'preset-row' },
        group.presets.map(function (preset) { return card(preset, ctx); })));
    });

    return wrap;
  }

  return { render: render, swatchStyle: swatchStyle, miniPreview: miniPreview };
});
