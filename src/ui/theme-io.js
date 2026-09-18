AONC.define('ui.themeIo', function (A) {
  'use strict';

  var el = A.ui.controls.el;

  function slug(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9а-яё]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'theme';
  }

  function download(payload, name) {
    var text = JSON.stringify(payload, null, 2);
    var blob = new Blob([text], { type: 'application/json;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = el('a', { href: url, download: 'animeon-' + slug(name || 'theme') + '.json' });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    return true;
  }

  function copyText(text, okMessage) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        A.ui.toast.ok(okMessage || 'Скопировано');
      }, function () {
        // Firefox регулярно отклоняет writeText без фокуса/разрешения —
        // без обработчика это необработанный реджект и молчаливый провал.
        A.ui.toast.error('Браузер не дал доступ к буферу обмена');
      });
      return true;
    }
    A.ui.toast.error('Буфер обмена недоступен');
    return false;
  }

  // --- Совместимость со старым форматом «только палитра + обои» --------------

  function exportTheme(entry) {
    if (!entry) return false;
    var payload = {
      kind: 'aonc-theme',
      version: A.VERSION,
      exportedAt: new Date().toISOString(),
      name: entry.name || 'Тема',
      parts: (entry.parts && entry.parts.length ? entry.parts : ['theme', 'wallpaper']),
      theme: entry.theme || {},
      wallpaper: entry.wallpaper || {}
    };
    // Полный состав темы: части, сохранённые вместе с ней, кладём рядом.
    (entry.parts || []).forEach(function (id) {
      if (id === 'theme' || id === 'wallpaper') return;
      if (entry[id] !== undefined) payload[id] = entry[id];
    });
    return download(payload, entry.name || 'theme');
  }

  function copyCode(entry) {
    if (!entry) return false;
    var payload = {
      kind: 'aonc-theme',
      name: entry.name || 'Тема',
      parts: (entry.parts && entry.parts.length ? entry.parts : ['theme', 'wallpaper']),
      theme: entry.theme || {},
      wallpaper: entry.wallpaper || {}
    };
    (entry.parts || []).forEach(function (id) {
      if (id === 'theme' || id === 'wallpaper') return;
      if (entry[id] !== undefined) payload[id] = entry[id];
    });
    return copyText(JSON.stringify(payload), 'Код темы скопирован');
  }

  // Сохранённая тема = снимок выбранных частей конфига.
  function snapshotParts(config, parts) {
    var entry = { parts: A.ui.themePackage.normalizeParts(parts) };
    entry.theme = A.lang.clone(config.theme || {});
    entry.parts.forEach(function (id) {
      if (id === 'theme') return;
      if (config[id] !== undefined) entry[id] = A.lang.clone(config[id]);
    });
    if (!entry.wallpaper) entry.wallpaper = {};
    return entry;
  }

  // --- Импорт ---------------------------------------------------------------

  function parse(text) {
    var parsed = A.ui.themePackage.parse(text);
    if (parsed.error) return { error: parsed.error };
    return { data: parsed.data, parts: parsed.parts, name: parsed.name, kind: parsed.kind };
  }

  // Пакет применяется к текущим настройкам (слияние, а не замена всего конфига).
  function importPackage(text, ctx) {
    var parsed = A.ui.themePackage.parse(text);
    if (parsed.error) {
      A.ui.toast.error(parsed.error);
      return null;
    }
    var result = A.ui.themePackage.apply(parsed);
    if (!result.applied.length) {
      A.ui.toast.error('В файле нет ни одной знакомой части');
      return null;
    }
    var changed = A.ui.themePackage.diff(parsed).filter(function (d) { return d.changed; });
    A.ui.toast.ok('Импортировано: ' + A.ui.themePackage.labels(result.applied).join(', ') +
      (changed.length ? '' : ' (значения уже были такими)'));
    if (ctx && ctx.refreshAll) ctx.refreshAll();
    else if (ctx && ctx.refresh) ctx.refresh('theme');
    return result;
  }

  // Сохраняет содержимое файла как новую тему в «Мои темы».
  function importTheme(text, ctx) {
    var parsed = A.ui.themePackage.parse(text);
    if (parsed.error) {
      A.ui.toast.error(parsed.error);
      return null;
    }

    var parts = A.ui.themePackage.normalizeParts(parsed.parts);
    var entry = A.config.defaults.customTheme.normalize(Object.assign(
      snapshotParts(parsed.data, parts),
      {
        id: A.lang.uid('theme'),
        name: (parsed.name ? String(parsed.name) : 'Импортированная тема') + ' (импорт)',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ));

    var next = (A.ui.state.get('customThemes') || []).concat([entry]);
    A.ui.state.set('customThemes', next);
    A.ui.toast.ok('Тема «' + entry.name + '» импортирована · ' + parts.length + ' ч.');
    if (ctx) ctx.refresh('theme');
    return entry;
  }

  function pickFile(onText) {
    var input = el('input', { type: 'file', accept: '.json,application/json' });
    input.style.display = 'none';
    document.body.appendChild(input);
    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (!file) { if (input.parentNode) document.body.removeChild(input); return; }
      var reader = new FileReader();
      reader.onload = function () { onText(String(reader.result)); };
      reader.onerror = function () { A.ui.toast.error('Не удалось прочитать файл'); };
      reader.readAsText(file);
      if (input.parentNode) document.body.removeChild(input);
    });
    input.click();
  }

  // --- Диалог экспорта: что именно положить в файл --------------------------

  function openExportDialog(ctx) {
    var config = A.ui.state.current();
    var selected = A.ui.themePackage.defaultParts().slice();
    var nameInput = null;
    var host = null;

    function close() {
      if (host && host.parentNode) host.parentNode.removeChild(host);
      document.removeEventListener('keydown', onKey, true);
    }

    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
    }

    function payload() {
      return A.ui.themePackage.build(config, selected, { name: (nameInput && nameInput.value) || 'AnimeOn Studio' });
    }

    function setSelection(ids) {
      selected = A.ui.themePackage.normalizeParts(ids);
      var boxes = host.querySelectorAll('input[type="checkbox"][data-part]');
      for (var i = 0; i < boxes.length; i++) {
        boxes[i].checked = selected.indexOf(boxes[i].getAttribute('data-part')) !== -1;
      }
      updateSize();
    }

    function sizeNode() { return host.querySelector('#aonc-exp-size'); }

    function updateSize() {
      var node = sizeNode();
      if (!node) return;
      var bytes = JSON.stringify(payload()).length;
      node.textContent = '≈ ' + (bytes / 1024).toFixed(1) + ' КБ · частей: ' + selected.length;
    }

    var rows = A.ui.themePackage.PARTS.map(function (part) {
      var box = el('input', {
        type: 'checkbox',
        'data-part': part.id,
        checked: selected.indexOf(part.id) !== -1,
        disabled: !!part.always,
        onchange: function () {
          if (part.always) { box.checked = true; return; }
          var next = selected.slice();
          var at = next.indexOf(part.id);
          if (at === -1) next.push(part.id);
          else next.splice(at, 1);
          selected = A.ui.themePackage.normalizeParts(next);
          updateSize();
        }
      });
      return el('label', { class: 'exp-part' + (part.always ? ' locked' : '') }, [
        box,
        el('span', { class: 'exp-ic', text: part.icon }),
        el('span', { class: 'exp-txt' }, [
          el('b', { text: part.label }),
          el('small', { text: part.hint })
        ])
      ]);
    });

    nameInput = el('input', {
      type: 'text', class: 'exp-name', value: 'Моя тема ' + new Date().toLocaleDateString('ru-RU'),
      placeholder: 'Название пакета'
    });

    var panel = el('div', { class: 'exp-panel', role: 'dialog', 'aria-label': 'Экспорт настроек' }, [
      el('div', { class: 'exp-head' }, [
        el('b', { text: 'Экспорт настроек' }),
        el('span', { class: 'sp' }),
        el('button', { class: 'mini', type: 'button', text: '✕', title: 'Закрыть (Esc)', onclick: close })
      ]),
      el('p', { class: 'exp-note', text: 'Отметьте, что положить в файл. Палитра добавляется всегда. Импорт такого файла сливается с текущими настройками, а не затирает их.' }),
      nameInput,
      el('div', { class: 'exp-parts' }, rows),
      el('div', { class: 'exp-foot' }, [
        el('span', { class: 'hint-inline', id: 'aonc-exp-size', text: '' }),
        el('span', { class: 'sp' }),
        el('button', { class: 'btn sm ghost', type: 'button', text: 'Только палитра', onclick: function () { setSelection(['theme']); } }),
        el('button', { class: 'btn sm ghost', type: 'button', text: 'Всё', onclick: function () { setSelection(A.ui.themePackage.allParts()); } }),
        el('button', { class: 'btn sm ghost', type: 'button', text: '⎘ Код', onclick: function () { copyText(JSON.stringify(payload()), 'Код настроек скопирован'); } }),
        el('button', {
          class: 'btn sm primary', type: 'button', text: '⇩ Скачать JSON',
          onclick: function () {
            download(payload(), (nameInput && nameInput.value) || 'theme');
            A.ui.toast.ok('Файл сохранён');
            close();
          }
        }),
        el('button', {
          class: 'btn sm', type: 'button', text: '＋ В мои темы',
          onclick: function () {
            var name = (nameInput && nameInput.value || '').trim() || 'Моя тема';
            var entry = A.config.defaults.customTheme.normalize(Object.assign(
              snapshotParts(config, selected),
              { id: A.lang.uid('theme'), name: name, createdAt: Date.now(), updatedAt: Date.now() }
            ));
            A.ui.state.set('customThemes', (A.ui.state.get('customThemes') || []).concat([entry]));
            A.ui.toast.ok('Тема «' + name + '» сохранена (' + entry.parts.length + ' ч.)');
            if (ctx && ctx.refresh) ctx.refresh('theme');
            close();
          }
        })
      ])
    ]);

    host = el('div', { class: 'exp-overlay', onclick: function (e) { if (e.target === host) close(); } }, [panel]);
    document.body.appendChild(host);
    document.addEventListener('keydown', onKey, true);
    updateSize();
    if (nameInput.focus) nameInput.focus();
    return { close: close, payload: payload };
  }

  return {
    exportTheme: exportTheme,
    importTheme: importTheme,
    importPackage: importPackage,
    pickFile: pickFile,
    copyCode: copyCode,
    parse: parse,
    slug: slug,
    download: download,
    snapshotParts: snapshotParts,
    openExportDialog: openExportDialog
  };
});
