AONC.define('config.defaults.customTheme', function (A) {
  'use strict';

  var shape = {
    id: '',
    name: '',
    createdAt: 0,
    updatedAt: 0,
    parts: [],
    theme: {},
    wallpaper: {}
  };

  var META = { id: '', name: '', createdAt: 0, updatedAt: 0, parts: [] };

  // Тема-снимок состоит из произвольных «частей» конфига (theme, wallpaper,
  // cosmetics, typography, layout…), поэтому обычный A.lang.normalize здесь
  // неприменим: он оставляет только ключи формы и превращает theme/wallpaper
  // в пустые объекты. Мета-поля приводим к форме, части — сохраняем как есть,
  // а theme и wallpaper прогоняем через их собственные дефолты.
  function normalize(entry) {
    var raw = entry || {};
    var out = A.lang.clone(raw);
    var meta = A.lang.normalize(META, raw);
    out.id = meta.id;
    out.name = meta.name;
    out.createdAt = meta.createdAt;
    out.updatedAt = meta.updatedAt;
    out.parts = meta.parts;
    out.theme = A.lang.normalize(A.config.defaults.theme, raw.theme);
    out.wallpaper = A.lang.normalize(A.config.defaults.wallpaper, raw.wallpaper);
    return out;
  }

  // Не перечислимо: форма остаётся чистой для A.lang.normalize/JSON.
  Object.defineProperty(shape, 'normalize', { value: normalize, enumerable: false });

  return shape;
});
