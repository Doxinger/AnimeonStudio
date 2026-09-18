// Пакет темы: состав (части конфига), сборка payload, разбор и применение.
// Отдельный модуль, чтобы theme-io отвечал только за файлы и буфер обмена.
AONC.define('ui.themePackage', function (A) {
  'use strict';

  var KIND = 'aonc-package';

  var PARTS = [
    { id: 'theme', label: 'Палитра и отделка', icon: '◐', always: true, hint: 'Акцент, фон, карточки, радиусы, тени, анимации темы' },
    { id: 'wallpaper', label: 'Фоновое изображение', icon: '🖼', hint: 'Обои, затемнение, виньетка, параллакс, правила по страницам' },
    { id: 'typography', label: 'Типографика', icon: 'Aa', hint: 'Шрифт, кегль, интервалы' },
    { id: 'layout', label: 'Сетка и карточки', icon: '▦', hint: 'Плотность, размер постеров, режимы списков, страница профиля' },
    { id: 'glass', label: 'Шапка и стекло', icon: '◇', hint: 'Блюр, прозрачность, поведение шапки' },
    { id: 'player', label: 'Плеер', icon: '▶', hint: 'Театральный режим, киносвет, автопереход, громкость' },
    { id: 'chat', label: 'Чат', icon: '💬', hint: 'Геометрия, пузыри, скрытие декора' },
    { id: 'cosmetics', label: 'Косметика: бейджи и рамки', icon: '🎖', hint: 'Свои бейджи, звания, рамки аватара и комплекты' },
    { id: 'identity', label: 'Свой ник', icon: '👤', hint: 'Замена ника, префикс, цвет' },
    { id: 'clan', label: 'Клан-бейджи', icon: '🛡', hint: 'Значки кланов в чате и профиле' },
    { id: 'custom', label: 'Свой CSS и JS', icon: '{}', hint: 'Глобальные сниппеты и шрифты' }
  ];

  var BY_ID = PARTS.reduce(function (acc, p) { acc[p.id] = p; return acc; }, {});

  function defaultParts() {
    return ['theme', 'wallpaper'];
  }

  function allParts() {
    return PARTS.map(function (p) { return p.id; });
  }

  function label(id) {
    return BY_ID[id] ? BY_ID[id].label : id;
  }

  function labels(ids) {
    return (ids || []).map(label);
  }

  function normalizeParts(ids) {
    var out = [];
    (ids || []).forEach(function (id) {
      if (BY_ID[id] && out.indexOf(id) === -1) out.push(id);
    });
    if (out.indexOf('theme') === -1) out.unshift('theme');
    return out;
  }

  function build(config, parts, meta) {
    var ids = normalizeParts(parts);
    var payload = {
      kind: KIND,
      version: A.VERSION,
      exportedAt: new Date().toISOString(),
      name: (meta && meta.name) || 'AnimeOn Studio',
      parts: ids,
      theme: A.lang.clone(config.theme || {})
    };
    ids.forEach(function (id) {
      if (id === 'theme') return;
      if (config[id] === undefined) return;
      payload[id] = A.lang.clone(config[id]);
    });
    return payload;
  }

  // Понимает три формата: пакет студии, старую тему {kind:'aonc-theme', theme}
  // и голый конфиг (как в aonc-bundle из профилей).
  function parse(text) {
    var data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return { error: 'Файл не является корректным JSON' };
    }
    if (!data || typeof data !== 'object') return { error: 'Пустой файл' };

    var inner = data;
    if (data.kind === 'aonc-bundle' && data.config) inner = data.config;

    var kind = data.kind === 'aonc-bundle' ? 'aonc-bundle'
      : (data.kind === KIND ? KIND
        : (inner.theme && typeof inner.theme === 'object' ? 'aonc-theme' : ''));
    if (!kind && !inner.theme) {
      return { error: 'В файле нет поля theme — это не тема AnimeOn Studio' };
    }

    var parts;
    if (Array.isArray(data.parts) && data.parts.length) {
      parts = normalizeParts(data.parts);
    } else {
      parts = PARTS.map(function (p) { return p.id; }).filter(function (id) {
        return inner[id] && typeof inner[id] === 'object';
      });
      if (parts.indexOf('theme') === -1) parts.unshift('theme');
    }

    return { kind: kind, data: inner, parts: parts, name: data.name || '' };
  }

  function changesFor(parsed) {
    var changes = {};
    parsed.parts.forEach(function (id) {
      var value = parsed.data[id];
      if (value === undefined || value === null) return;
      changes[id] = A.lang.normalize(A.config.DEFAULTS[id], A.lang.clone(value));
    });
    return changes;
  }

  function apply(parsed) {
    var changes = changesFor(parsed);
    var keys = Object.keys(changes);
    if (!keys.length) return { applied: [] };
    A.ui.state.setMany(changes);
    return { applied: keys };
  }

  // Что именно поменяется — для предупреждения перед импортом.
  function diff(parsed) {
    var changes = changesFor(parsed);
    var out = [];
    Object.keys(changes).forEach(function (key) {
      var current = A.ui.state.get(key);
      var same = JSON.stringify(current) === JSON.stringify(changes[key]);
      out.push({ key: key, label: label(key), changed: !same });
    });
    return out;
  }

  return {
    KIND: KIND,
    PARTS: PARTS,
    BY_ID: BY_ID,
    defaultParts: defaultParts,
    allParts: allParts,
    normalizeParts: normalizeParts,
    label: label,
    labels: labels,
    build: build,
    parse: parse,
    changesFor: changesFor,
    apply: apply,
    diff: diff
  };
});
