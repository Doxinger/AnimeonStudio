AONC.define('ui.studioSearch', function (A) {
  'use strict';

  var el = A.ui.controls.el;

  // Транслит: «fon» находит «фон», «steklo» — «стекло», «blur» — «блюр».
  var CYR_LAT = [
    ['щ', 'sch'], ['ш', 'sh'], ['ч', 'ch'], ['ю', 'yu'], ['я', 'ya'], ['ё', 'e'], ['ж', 'zh'],
    ['а', 'a'], ['б', 'b'], ['в', 'v'], ['г', 'g'], ['д', 'd'], ['е', 'e'], ['з', 'z'],
    ['и', 'i'], ['й', 'y'], ['к', 'k'], ['л', 'l'], ['м', 'm'], ['н', 'n'], ['о', 'o'],
    ['п', 'p'], ['р', 'r'], ['с', 's'], ['т', 't'], ['у', 'u'], ['ф', 'f'], ['х', 'h'],
    ['ц', 'c'], ['ъ', ''], ['ь', '']
  ];

  // Сворачивает кириллицу в латиницу и сохраняет карту «позиция в результате →
  // позиция в исходной строке», чтобы подсветка совпадения не съезжала.
  function foldWithMap(text) {
    var src = String(text == null ? '' : text).toLowerCase();
    var out = '';
    var map = [];
    for (var i = 0; i < src.length; i++) {
      var ch = src.charAt(i);
      var pair = null;
      for (var j = 0; j < CYR_LAT.length; j++) {
        if (CYR_LAT[j][0] === ch) { pair = CYR_LAT[j]; break; }
      }
      var repl = pair ? pair[1] : ch;
      if (!repl) continue;
      if (/[^a-z0-9%#\-.]/.test(repl)) repl = ' ';
      if (repl === ' ' && out.charAt(out.length - 1) === ' ') continue;
      for (var k = 0; k < repl.length; k++) {
        out += repl.charAt(k);
        map.push(i);
      }
    }
    while (out.charAt(out.length - 1) === ' ') { out = out.slice(0, -1); map.pop(); }
    while (out.charAt(0) === ' ') { out = out.slice(1); map.shift(); }
    return { text: out, map: map };
  }

  function fold(text) {
    return foldWithMap(text).text;
  }

  function subsequence(needle, hay) {
    var i = 0;
    for (var j = 0; j < hay.length && i < needle.length; j++) {
      if (hay.charAt(j) === needle.charAt(i)) i++;
    }
    return i === needle.length && needle.length > 2;
  }

  function scoreWord(word, hay, hayFolded) {
    if (hay.indexOf(word) === 0 || hayFolded.indexOf(word) === 0) return 100;
    var at = hay.indexOf(word);
    if (at === -1) at = hayFolded.indexOf(word);
    if (at !== -1) return 70 - Math.min(at, 40);
    if (subsequence(word, hayFolded)) return 12;
    return 0;
  }

  function entries() {
    var out = [];
    A.ui.sections.all().forEach(function (sec) {
      (sec.groups || []).forEach(function (group) {
        (group.controls || []).forEach(function (control) {
          out.push({ section: sec, group: group, control: control });
        });
      });
      (sec.controls || []).forEach(function (control) {
        out.push({ section: sec, group: null, control: control });
      });
    });
    return out;
  }

  // Человекочитаемое текущее значение — показывается чипом в выдаче поиска.
  function valueText(control) {
    if (!control || !control.path) return '';
    var value = A.ui.state.get(control.path);
    if (value === undefined || value === null || value === '') return '';
    if (control.type === 'toggle') return value ? 'включено' : 'выключено';
    if (control.type === 'select') {
      var opt = (control.options || []).filter(function (o) { return o && o.value === value; })[0];
      return String(opt ? opt.label : value);
    }
    if (typeof value === 'number') return A.ui.controls.format(control, value);
    if (typeof value === 'string') return value.length > 40 ? value.slice(0, 40) + '…' : value;
    if (Array.isArray(value)) return value.length + ' элем.';
    return '';
  }

  // То же значение, но вариантами для поиска: «128%» находится и по «128»,
  // «включено» — и по «on».
  function valueAliases(control) {
    if (!control || !control.path) return [];
    var value = A.ui.state.get(control.path);
    if (value === undefined || value === null || value === '') return [];
    var out = [valueText(control)];
    if (control.type === 'toggle') out.push(value ? 'on вкл true' : 'off выкл false');
    if (control.type === 'select') out.push(String(value));
    if (typeof value === 'number') out.push(String(value));
    if (Array.isArray(value)) out.push('элементов ' + value.length);
    return out.filter(Boolean);
  }

  function haystack(control) {
    var parts = [
      control.label, control.hint, control.path, control.type, control.id,
      A.ui.i18n.controlLabel(control),
      A.ui.i18n.EN['ctl.' + (control.path || '')],
      (control.options || []).map(function (o) { return o && o.label; }).join(' '),
      valueAliases(control).join(' ')
    ];
    return parts.filter(Boolean).join(' ');
  }

  function match(query) {
    var q = String(query || '').toLowerCase().trim();
    if (!q) return [];
    var words = q.split(/\s+/).filter(Boolean);
    var foldedWords = words.map(fold).filter(Boolean);
    var out = [];

    entries().forEach(function (e) {
      var raw = haystack(e.control).toLowerCase();
      var folded = fold(raw);
      var total = 0;
      for (var i = 0; i < words.length; i++) {
        var score = scoreWord(words[i], raw, folded);
        if (foldedWords[i] && foldedWords[i] !== words[i]) {
          score = Math.max(score, scoreWord(foldedWords[i], raw, folded));
        }
        if (!score) return;
        total += score;
      }
      if (!total) return;
      out.push(Object.assign({}, e, {
        score: total,
        value: valueText(e.control),
        label: A.ui.i18n.controlLabel(e.control)
      }));
    });

    out.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return String(a.label).localeCompare(String(b.label));
    });
    return out;
  }

  // Подсветка первого совпадения в подписи (учитывая транслит).
  function highlight(text, query) {
    var label = String(text || '');
    var words = String(query || '').toLowerCase().trim().split(/\s+/).filter(Boolean);
    var folded = foldWithMap(label);
    var bestStart = -1;
    var bestEnd = -1;
    var bestLen = 0;

    words.forEach(function (w) {
      [w, fold(w)].forEach(function (variant) {
        if (!variant || variant.length < 2) return;
        var at = folded.text.indexOf(variant);
        if (at === -1 || variant.length <= bestLen) return;
        var startIdx = folded.map[at];
        var endIdx = (folded.map[at + variant.length - 1] || startIdx) + 1;
        if (startIdx == null) return;
        bestStart = startIdx;
        bestEnd = endIdx;
        bestLen = variant.length;
      });
    });

    if (bestStart === -1) return [el('span', { text: label })];
    return [
      bestStart > 0 ? el('span', { text: label.slice(0, bestStart) }) : null,
      el('mark', { text: label.slice(bestStart, bestEnd) }),
      bestEnd < label.length ? el('span', { text: label.slice(bestEnd) }) : null
    ].filter(Boolean);
  }

  function crumb(e, onJump) {
    var node = el('div', { class: 'search-crumb' });
    var ic = A.ui.icons.el(A.ui.icons.SECTION_MAP[e.section.id] || '', 13, 'ic-crumb');
    if (ic) node.appendChild(ic);
    node.appendChild(el('span', { text: A.ui.i18n.sectionTitle(e.section) }));
    if (e.group) {
      node.appendChild(el('span', { class: 'dim', text: ' / ' + A.ui.i18n.groupTitle(e.section, e.group) }));
    }
    if (e.control.path) {
      node.appendChild(el('code', { class: 'search-path', text: e.control.path, title: 'Путь в конфиге — клик, чтобы скопировать', onclick: function () { copyPath(e.control.path); } }));
    }
    if (e.value) node.appendChild(el('span', { class: 'search-value', text: e.value }));
    node.appendChild(el('span', { class: 'sp' }));
    node.appendChild(el('button', {
      class: 'mini', type: 'button', text: '→', title: 'Перейти в раздел',
      onclick: function () { if (onJump) onJump(e.section.id); }
    }));
    return node;
  }

  function copyPath(path) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(path).then(function () { A.ui.toast.ok('Путь скопирован: ' + path); });
    }
  }

  function render(query, ctx, onJump) {
    var results = match(query);
    var wrap = el('div', { class: 'search-view' });

    wrap.appendChild(el('div', { class: 'search-head' }, [
      el('b', { text: 'Результаты: ' + results.length }),
      el('span', { class: 'sp' }),
      el('span', { class: 'hint-inline', text: 'Поиск по названию, подсказке и текущему значению · транслит работает · Esc — сбросить' })
    ]));

    if (!results.length) {
      wrap.appendChild(el('div', {
        class: 'empty',
        text: 'Ничего не найдено по запросу «' + query + '». Попробуйте короче: «фон», «кегль», «шапка», «плеер», или ищите значение — «120», «#7c4dff».'
      }));
      return wrap;
    }

    results.slice(0, 60).forEach(function (e) {
      var card = el('div', { class: 'search-item' });
      card.appendChild(crumb(e, onJump));
      card.appendChild(el('div', { class: 'search-label' }, highlight(e.label, query)));
      var node = A.ui.renderer.renderControl(e.control, ctx);
      if (node) card.appendChild(node);
      wrap.appendChild(card);
    });

    if (results.length > 60) {
      wrap.appendChild(el('div', { class: 'hint-inline', text: 'Показаны первые 60 из ' + results.length + ' — уточните запрос.' }));
    }

    return wrap;
  }

  return {
    entries: entries, match: match, render: render, fold: fold,
    valueText: valueText, valueAliases: valueAliases, highlight: highlight
  };
});
