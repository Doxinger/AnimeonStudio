AONC.define('ui.custom.contrast', function (A) {
  'use strict';

  var el = A.ui.controls.el;

  function render() {
    var wrap = el('div', { class: 'contrast-card' });
    paint(wrap);
    return wrap;
  }

  function paint(wrap) {
    var theme = A.ui.state.current().theme;
    if (!theme.overrideTokens) {
      wrap.innerHTML = '';
      wrap.appendChild(el('div', { class: 'empty', text: 'Переопределение цветов выключено — используется палитра сайта.' }));
      return;
    }

    var p = A.color.palette.fromTheme(theme);
    var pairs = [
      { label: 'Текст / фон', fg: p.foreground, bg: p.background, need: 7 },
      { label: 'Приглушённый / фон', fg: p.mutedForeground, bg: p.background, need: 4.5 },
      { label: 'Текст / карточка', fg: p.cardForeground, bg: p.card, need: 7 },
      { label: 'Акцент / фон', fg: p.primary, bg: p.background, need: 3 },
      { label: 'Кнопка / акцент', fg: p.primaryForeground, bg: p.primary, need: 4.5 }
    ];

    wrap.innerHTML = '';
    wrap.appendChild(el('div', { class: 'contrast-head' }, [
      el('b', { text: 'Контрастность (WCAG 2.1)' }),
      el('span', { class: 'sp' }),
      el('button', {
        class: 'mini', type: 'button', text: '↻', title: 'Пересчитать',
        onclick: function () { paint(wrap); }
      })
    ]));

    var table = el('div', { class: 'contrast-rows' });
    pairs.forEach(function (pair) {
      var ratio = A.color.contrast.ratio(pair.fg, pair.bg);
      var pass = ratio >= pair.need;
      var row = el('div', { class: 'contrast-row' }, [
        el('span', { class: 'chip', style: 'background:' + pair.bg + ';color:' + pair.fg, text: 'Aa' }),
        el('span', { class: 'cr-label', text: pair.label }),
        el('span', { class: 'sp' }),
        el('span', { class: 'cr-value', text: ratio.toFixed(2) + ':1' }),
        el('span', { class: 'cr-badge ' + (pass ? 'pass' : 'fail'), text: pass ? 'OK ' + A.color.contrast.grade(ratio) : 'низкий' })
      ]);
      table.appendChild(row);
    });
    wrap.appendChild(table);

    var worst = pairs.reduce(function (acc, pair) {
      var r = A.color.contrast.ratio(pair.fg, pair.bg);
      return r < acc.value ? { value: r, label: pair.label } : acc;
    }, { value: 99, label: '' });

    wrap.appendChild(el('div', { class: 'contrast-foot' }, [
      el('span', { text: 'Слабое место: ' + worst.label + ' — ' + worst.value.toFixed(2) + ':1' }),
      A.ui.state.get('theme.autoContrast')
        ? el('span', { class: 'cr-badge pass', text: 'автоконтраст включён' })
        : el('button', {
          class: 'mini', type: 'button', text: 'Исправить автоматически',
          onclick: function () {
            A.ui.state.set('theme.autoContrast', true);
            paint(wrap);
          }
        })
    ]));
  }

  return { render: render, paint: paint };
});
