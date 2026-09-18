// Запекание каталога титулов сайта в src/shared/config/titles-data.js.
// Источник — ответ GET /api/cosmetics/catalog (поле titles[]), снимок лежит в
// tools/catalog.sample.json. Запуск:
//   node tools/gen-titles.mjs tools/catalog.sample.json
import { writeFileSync, readFileSync } from 'node:fs';

function compact(t) {
  const anims = String(t.badge_animation || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    id: t.id,
    name: String(t.name || t.id),
    rarity: t.rarity || 'common',
    source: t.source || '',
    label: t.source_label || '',
    unlocked: !!t.unlocked,
    order: t.sort_order || 0,
    bg: t.badge_bg || '',
    border: t.badge_border || '',
    color: t.badge_color || '',
    glow: t.badge_glow || '',
    gradFrom: t.badge_gradient_from || '',
    gradTo: t.badge_gradient_to || '',
    icon: t.badge_icon || '',
    anims: anims,
    desc: String(t.description || t.source_hint || '')
  };
}

const source = process.argv[2] || 'tools/catalog.sample.json';
const raw = JSON.parse(readFileSync(source, 'utf8'));
const titles = (raw.titles || [])
  .slice()
  .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  .map(compact)
  .filter((t) => t.id && t.name);

const sources = [...new Set(titles.map((t) => t.source).filter(Boolean))].sort();
const rarities = [...new Set(titles.map((t) => t.rarity))].sort();
const icons = [...new Set(titles.map((t) => t.icon).filter(Boolean))].sort();

const lines = titles.map((t) => '    ' + JSON.stringify(t).replace(/"([a-zA-Z_]+)":/g, '$1:'));
const out = [
  "// Сгенерировано tools/gen-titles.mjs из снимка /api/cosmetics/catalog — не править руками.",
  "AONC.define('config.titlesData', function () {",
  "  'use strict';",
  '',
  '  var TITLES = [',
  lines.join(',\n'),
  '  ];',
  '',
  '  return { TITLES: TITLES };',
  '});',
  ''
].join('\n');

writeFileSync('src/shared/config/titles-data.js', out);
console.log('titles:', titles.length);
console.log('sources:', sources.join(', '));
console.log('rarities:', rarities.join(', '));
console.log('icons:', icons.join(', '));
