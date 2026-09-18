AONC.define('ui.custom.myThemes', function (A) {
  'use strict';

  var el = A.ui.controls.el;

  function list() {
    return A.ui.state.get('customThemes') || [];
  }

  function persist(next) {
    A.ui.state.set('customThemes', next);
  }

  function swatchStyle(theme) {
    var palette = A.color.palette.fromTheme(Object.assign({}, A.config.DEFAULTS.theme, theme || {}));
    return 'background:linear-gradient(135deg,' + palette.background + ' 0%,' + palette.card + ' 52%,' + palette.muted + ' 100%);border-color:' + palette.border;
  }

  function render(def, ctx) {
    var wrap = el('div', { class: 'mythemes' });
    var items = list();
    var activeId = A.ui.state.get('meta.activeThemeId');

    var head = el('div', { class: 'list-head' }, [
      el('b', { text: 'Мои темы' }),
      el('span', { class: 'badge', text: String(items.length) }),
      el('span', { class: 'sp' }),
      el('button', {
        class: 'btn sm', type: 'button', text: '⇪ Импорт темы', title: 'Файл темы сохраняется в «Мои темы»',
        onclick: function () {
          A.ui.themeIo.pickFile(function (text) { A.ui.themeIo.importTheme(text, ctx); });
        }
      }),
      el('button', {
        class: 'btn sm', type: 'button', text: '⇩ Экспорт настроек', title: 'Выбрать состав и скачать пакет (палитра, фон, косметика, чат…)',
        onclick: function () { A.ui.themeIo.openExportDialog(ctx); }
      }),
      el('button', {
        class: 'btn sm primary', type: 'button', text: '＋ Сохранить текущую',
        onclick: function () { saveCurrent(ctx); }
      })
    ]);
    wrap.appendChild(head);

    if (!items.length) {
      wrap.appendChild(el('div', {
        class: 'empty',
        text: 'Своих тем пока нет. Настройте палитру и обои, затем нажмите «Сохранить текущую» — тема появится здесь и будет доступна в один клик.'
      }));
      return wrap;
    }

    var row = el('div', { class: 'preset-row wrap' });
    items.forEach(function (t, index) {
      row.appendChild(card(t, index, activeId, ctx));
    });
    wrap.appendChild(row);

    return wrap;
  }

  function card(t, index, activeId, ctx) {
    var isActive = t.id === activeId;
    var palette = A.color.palette.fromTheme(Object.assign({}, A.config.DEFAULTS.theme, t.theme || {}));

    var cardNode = el('div', { class: 'mytheme' + (isActive ? ' on' : '') }, [
      el('button', {
        class: 'mytheme-swatch', type: 'button', title: 'Применить тему «' + (t.name || 'без имени') + '»',
        style: swatchStyle(t.theme),
        onclick: function () { applyTheme(t, ctx); }
      }, [
        el('i', { class: 'dot accent', style: 'background:' + palette.primary }),
        el('i', { class: 'dot fg', style: 'background:' + palette.foreground }),
        el('i', { class: 'bar', style: 'background:' + palette.primary })
      ]),
      el('div', { class: 'mytheme-meta' }, [
        el('b', { class: 'mytheme-name', text: t.name || 'Без имени' }),
        el('small', {
          class: 'mytheme-sub',
          text: (t.theme && t.theme.mode ? t.theme.mode : 'dark') +
            ' · ' + partsOf(t).length + ' ч.' +
            (t.wallpaper && t.wallpaper.enabled ? ' · с фоном' : '')
        })
      ]),
      el('div', { class: 'mytheme-actions' }, [
        el('button', {
          class: 'mini', type: 'button', text: '→', title: 'Применить',
          onclick: function () { applyTheme(t, ctx); }
        }),
        el('button', {
          class: 'mini', type: 'button', text: '✎', title: 'Переименовать',
          onclick: function () { rename(t, index, ctx); }
        }),
        el('button', {
          class: 'mini', type: 'button', text: '⧉', title: 'Дублировать',
          onclick: function () { duplicate(t, ctx); }
        }),
        el('button', {
          class: 'mini', type: 'button', text: '⇪', title: 'Обновить снимком текущих настроек',
          onclick: function () { overwrite(t, index, ctx); }
        }),
        el('button', {
          class: 'mini', type: 'button', text: '⇩', title: 'Скачать тему файлом',
          onclick: function () { A.ui.themeIo.exportTheme(t); }
        }),
        el('button', {
          class: 'mini', type: 'button', text: '⎘', title: 'Скопировать код темы',
          onclick: function () { A.ui.themeIo.copyCode(t); }
        }),
        el('button', {
          class: 'mini danger', type: 'button', text: '✕', title: 'Удалить',
          onclick: function () { remove(t, index, ctx); }
        })
      ])
    ]);

    return cardNode;
  }

  function snapshot(name, parts) {
    var config = A.ui.state.current();
    var ids = A.ui.themePackage.normalizeParts(parts || []);
    return A.config.defaults.customTheme.normalize(Object.assign(
      A.ui.themeIo.snapshotParts(config, ids),
      {
        id: A.lang.uid('theme'),
        name: name,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        parts: ids,
        theme: Object.assign({}, A.lang.clone(config.theme), { preset: 'custom' })
      }
    ));
  }

  function saveCurrent(ctx) {
    var suggested = 'Моя тема ' + new Date().toLocaleDateString('ru-RU');
    var name = window.prompt('Название темы (сохранится палитра, фон и косметика)', suggested);
    if (name == null) return;
    name = String(name).trim() || suggested;

    var entry = snapshot(name, ['theme', 'wallpaper', 'cosmetics']);
    var next = list().concat([entry]);
    persist(next);
    A.ui.state.set('meta.activeThemeId', entry.id);
    A.ui.toast.ok('Тема «' + name + '» сохранена (' + entry.parts.length + ' ч.)');
    ctx.refresh('theme');
  }

  // Темы, сохранённые до появления частей, содержат только theme + wallpaper.
  function partsOf(t) {
    return A.ui.themePackage.normalizeParts(
      (t.parts && t.parts.length) ? t.parts : ['theme', 'wallpaper']
    );
  }

  function applyTheme(t, ctx) {
    var changes = {};
    partsOf(t).forEach(function (id) {
      if (t[id] === undefined || t[id] === null) return;
      changes[id] = A.lang.normalize(A.config.DEFAULTS[id], A.lang.clone(t[id]));
    });
    if (!changes.theme) changes.theme = A.lang.normalize(A.config.defaults.theme, t.theme);
    if (!changes.theme.preset) changes.theme.preset = 'custom';
    changes['meta.activeThemeId'] = t.id;
    A.ui.state.setMany(changes);
    A.ui.toast.ok('Тема «' + (t.name || 'без имени') + '» применена');
    ctx.refresh('theme');
  }

  function rename(t, index, ctx) {
    var name = window.prompt('Новое название темы', t.name || '');
    if (name == null) return;
    var next = list().slice();
    next[index] = Object.assign({}, next[index], { name: String(name).trim() || t.name, updatedAt: Date.now() });
    persist(next);
    ctx.refresh('theme');
  }

  function duplicate(t, ctx) {
    var copy = A.lang.clone(t);
    copy.id = A.lang.uid('theme');
    copy.name = (t.name || 'Тема') + ' (копия)';
    copy.createdAt = Date.now();
    copy.updatedAt = Date.now();
    persist(list().concat([copy]));
    ctx.refresh('theme');
  }

  function overwrite(t, index, ctx) {
    if (!window.confirm('Заменить снимок темы «' + (t.name || '') + '» текущими настройками?')) return;
    var fresh = snapshot(t.name, partsOf(t));
    var next = list().slice();
    next[index] = Object.assign({}, next[index], {
      theme: fresh.theme,
      wallpaper: fresh.wallpaper,
      updatedAt: Date.now()
    });
    persist(next);
    A.ui.toast.ok('Тема обновлена текущими настройками');
    ctx.refresh('theme');
  }

  function remove(t, index, ctx) {
    if (!window.confirm('Удалить тему «' + (t.name || '') + '»?')) return;
    persist(list().filter(function (_, i) { return i !== index; }));
    if (A.ui.state.get('meta.activeThemeId') === t.id) A.ui.state.set('meta.activeThemeId', '');
    A.ui.toast.info('Тема удалена');
    ctx.refresh('theme');
  }

  return { render: render, list: list, persist: persist, snapshot: snapshot, swatchStyle: swatchStyle };
});
