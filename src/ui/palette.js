AONC.define('ui.palette', function (A) {
  'use strict';

  var el = A.ui.controls.el;
  var host = null;
  var input = null;
  var list = null;
  var items = [];
  var cursor = 0;

  function buildItems(ctx) {
    var out = [];
    var t = A.ui.i18n.t;

    A.ui.sections.all().forEach(function (sec) {
      out.push({
        kind: t('palette.section', 'Раздел'),
        label: A.ui.i18n.sectionTitle(sec),
        hint: t('palette.goto', 'Перейти в раздел'),
        icon: '→',
        run: function () { ctx.jump(sec.id); }
      });
    });

    A.config.presets.LIST.forEach(function (p) {
      out.push({
        kind: t('palette.theme', 'Тема'),
        label: t('palette.preset', 'Пресет') + ': ' + p.name,
        hint: t('palette.applyPalette', 'Применить палитру'),
        icon: '◐',
        run: function () {
          var changes = {};
          var patch = A.config.presets.themePatch(p.id);
          Object.keys(patch).forEach(function (k) { changes['theme.' + k] = patch[k]; });
          changes['theme.preset'] = p.id;
          A.ui.state.setMany(changes);
          ctx.refresh('theme');
        }
      });
    });

    A.config.wallpapers.LIB.forEach(function (p) {
      out.push({
        kind: t('palette.wallpaper', 'Фон'),
        label: t('palette.wallpaperItem', 'Обои') + ': ' + p.name,
        hint: t('palette.applyWall', 'Применить пресет фона'),
        icon: '🖼',
        run: function () {
          A.ui.state.setMany({
            'wallpaper.enabled': true,
            'wallpaper.source': 'preset',
            'wallpaper.preset': p.id,
            'wallpaper.size': p.kind === 'svg' ? 'auto' : 'cover',
            'wallpaper.repeat': p.kind === 'svg' ? 'repeat' : 'no-repeat'
          });
          ctx.refresh('theme');
        }
      });
    });

    A.config.framesLib.list({}).forEach(function (frame) {
      var rarity = A.config.framesLib.rarity(frame.rarity);
      out.push({
        kind: t('palette.frame', 'Рамка'),
        label: t('palette.frameItem', 'Рамка') + ': ' + frame.name,
        hint: rarity.label + (frame.unlocked ? '' : t('palette.frameLocked', ' · на сайте не выдана')),
        icon: '🎴',
        run: function () {
          var current = A.ui.state.get('cosmetics.frames') || [];
          var custom = current.filter(function (f) { return !f.frameId; });
          var same = current.some(function (f) { return f.frameId === frame.id; });
          var stack = A.ui.state.get('cosmetics.framesMode') === 'stack';
          var next;
          if (same && stack) next = current.filter(function (f) { return f.frameId !== frame.id; });
          else if (stack) next = current.concat([A.config.framesLib.makeEntry(frame)]);
          else next = custom.concat([A.config.framesLib.makeEntry(frame)]);
          A.ui.state.setMany({ 'cosmetics.frames': next, 'cosmetics.framesOn': next.length > 0 });
          ctx.refresh('cosmetics');
        }
      });
    });

    A.config.titlesLib.list({}).forEach(function (title) {
      var rarity = A.config.titlesLib.rarity(title.rarity);
      out.push({
        kind: t('palette.title', 'Титул'),
        label: t('palette.titleItem', 'Титул') + ': ' + title.name,
        hint: rarity.label + (title.unlocked ? '' : t('palette.titleLocked', ' · на сайте не выдан')),
        icon: '🎖',
        run: function () {
          var current = A.ui.state.get('cosmetics.titles') || [];
          var same = current.some(function (x) { return x.titleId === title.id; });
          var next = same
            ? current.filter(function (x) { return x.titleId !== title.id; })
            : current.concat([A.config.titlesLib.makeEntry(title)]);
          A.ui.state.setMany({ 'cosmetics.titles': next, 'cosmetics.titlesOn': next.length > 0 });
          ctx.refresh('cosmetics');
        }
      });
    });

    A.config.features.FEATURES.forEach(function (f) {
      out.push({
        kind: t('palette.feature', 'Фича'),
        label: f.label,
        hint: f.desc,
        icon: '⚡',
        run: function () {
          var config = A.ui.state.current();
          var next = !A.config.features.get(config, f);
          var clone = A.lang.clone(config);
          A.config.features.apply(clone, f, next);
          var changes = {};
          ['theme', 'wallpaper', 'typography', 'glass', 'layout', 'player', 'visibility', 'privacy', 'performance', 'meta'].forEach(function (k) {
            if (JSON.stringify(clone[k]) !== JSON.stringify(config[k])) changes[k] = clone[k];
          });
          A.ui.state.setMany(changes);
          ctx.refreshAll();
        }
      });
    });

    [
      ['Отменить', 'Ctrl+Z', '⎌', function () { document.getElementById('btn-undo').click(); }],
      ['Повторить', 'Ctrl+Shift+Z', '⎌', function () { document.getElementById('btn-redo').click(); }],
      ['Сбросить текущий раздел', 'к дефолту', '↺', function () { document.getElementById('btn-reset-section').click(); }],
      ['Переприменить на вкладках сайта', 'очистить кэш страницы', '⟲', function () { document.getElementById('btn-reapply').click(); }],
      ['Открыть пипетку', 'на сайте', '⬚', function () { A.ui.actions.run('picker-start', ctx); }],
      ['Открыть сайт', 'animeon.cc', '↗', function () { window.open(A.siteUrl('/'), '_blank', 'noopener'); }],
      ['Экспорт конфигурации', 'JSON-файл', '⇩', function () { A.ui.actions.run('export', ctx); }],
      ['Импорт конфигурации', 'из JSON-файла', '⇪', function () { A.ui.actions.run('import', ctx); }],
      ['Сохранить текущую тему', 'в «Мои темы»', '＋', function () { ctx.jump('theme'); }]
    ].forEach(function (row) {
      out.push({ kind: t('palette.action', 'Действие'), label: row[0], hint: row[1], icon: row[2], run: row[3] });
    });

    A.ui.studioSearch.entries().forEach(function (e) {
      out.push({
        kind: t('palette.setting', 'Настройка'),
        label: A.ui.i18n.controlLabel(e.control) || e.control.path,
        hint: A.ui.i18n.sectionTitle(e.section) +
          (e.group ? ' / ' + A.ui.i18n.groupTitle(e.section, e.group) : ''),
        icon: '•',
        run: function () {
          ctx.jump(e.section.id);
          setTimeout(function () {
            var node = document.querySelector('[data-path="' + (e.control.path || '') + '"]');
            if (node) {
              node.classList.add('flash');
              node.scrollIntoView({ block: 'center', behavior: 'smooth' });
              setTimeout(function () { node.classList.remove('flash'); }, 1600);
            }
          }, 60);
        }
      });
    });

    return out;
  }

  function ensure(ctx) {
    if (host && host.isConnected) return;
    host = el('div', { class: 'palette' });
    input = el('input', {
      type: 'text', placeholder: 'Команда, тема, фича или настройка…', autocomplete: 'off', spellcheck: 'false'
    });
    list = el('div', { class: 'palette-list' });
    host.appendChild(el('div', { class: 'palette-head' }, [
      el('span', { class: 'p-ic', text: '⌘' }), input,
      el('span', { class: 's-kbd', text: 'Esc' })
    ]));
    host.appendChild(list);
    host.addEventListener('click', function (e) {
      if (e.target === host) close();
    });
    input.addEventListener('input', function () { renderList(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter') { e.preventDefault(); execute(cursor); }
      else if (e.key === 'Escape') { e.preventDefault(); close(); }
    });
    document.body.appendChild(host);
  }

  function filtered() {
    var q = (input.value || '').toLowerCase().trim();
    var all = items;
    if (!q) return all.slice(0, 60);
    var words = q.split(/\s+/);
    return all.filter(function (it) {
      var hay = (it.kind + ' ' + it.label + ' ' + (it.hint || '')).toLowerCase();
      return words.every(function (w) { return hay.indexOf(w) !== -1; });
    }).slice(0, 60);
  }

  function renderList() {
    var rows = filtered();
    cursor = 0;
    list.innerHTML = '';
    if (!rows.length) {
      list.appendChild(el('div', { class: 'palette-empty', text: 'Ничего не найдено. Попробуйте «тема», «фон», «скрыть», «экспорт».' }));
      return;
    }
    rows.forEach(function (it, i) {
      var row = el('button', {
        class: 'palette-item' + (i === cursor ? ' on' : ''),
        onclick: function () { execute(i); }
      }, [
        el('span', { class: 'p-ic', text: it.icon }),
        el('span', { class: 'p-lb' }, [
          document.createTextNode(it.label),
          el('small', { text: (it.hint || '') })
        ]),
        el('span', { class: 'p-kind', text: it.kind })
      ]);
      row.addEventListener('mouseenter', function () { setCursor(i); });
      list.appendChild(row);
    });
  }

  function setCursor(i) {
    cursor = i;
    var nodes = list.children;
    for (var k = 0; k < nodes.length; k++) nodes[k].classList.toggle('on', k === i);
  }

  function move(delta) {
    var count = list.children.length;
    if (!count) return;
    setCursor((cursor + delta + count) % count);
    list.children[cursor].scrollIntoView({ block: 'nearest' });
  }

  function execute(i) {
    var rows = filtered();
    var it = rows[i];
    if (!it) return;
    close();
    try { it.run(); } catch (e) { A.ui.toast.error('Команда не выполнена: ' + e.message); }
  }

  function open(ctx) {
    ensure(ctx);
    items = buildItems(ctx);
    input.value = '';
    renderList();
    host.classList.add('on');
    setTimeout(function () { input.focus(); }, 30);
  }

  function close() {
    if (host) host.classList.remove('on');
  }

  function isOpen() {
    return !!(host && host.classList.contains('on'));
  }

  return { open: open, close: close, isOpen: isOpen };
});
