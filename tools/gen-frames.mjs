import { writeFileSync, readFileSync } from 'node:fs';

const CDN = 'https://ab18cf62-4b99-4613-a8c1-c801eda74545.selcdn.net';

function resolveMedia(path) {
  if (!path) return '';
  if (/^https?:/i.test(path)) return path;
  let p = String(path);
  if (p.startsWith('/media/')) p = p.slice(7);
  if (p.startsWith('cosmetic/frames/')) p = 'cosmetics/frames/' + p.slice(16);
  if (!p.startsWith('/')) p = '/' + p;
  return CDN + p;
}

function ring(id) {
  const rings = {
    purple: { color: '#7C4DFF' },
    teal: { color: '#00D3A7' },
    gold: { color: '#FBBF24' },
    red: { color: '#EF4444' }
  };
  return rings[id] || null;
}

async function main() {
  const source = process.argv[2] || '/tmp/catalog.json';
  const raw = JSON.parse(readFileSync(source, 'utf8'));
  const frames = (raw.frames || []).slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  const rows = frames.map((f) => {
    const scale = Number(f.frame_scale) > 0 ? Math.round(Number(f.frame_scale) * 100) / 100 : 1;
    const r = ring(f.id);
    const item = {
      id: f.id,
      name: String(f.name || f.id),
      rarity: f.rarity || 'common',
      source: f.source || '',
      label: f.source_label || '',
      unlocked: !!f.unlocked,
      order: f.sort_order || 0,
      scale: scale,
      ox: f.frame_offset_x || 0,
      oy: f.frame_offset_y || 0
    };
    if (r) {
      item.type = 'ring';
      item.color = r.color;
    } else if (f.id === 'rainbow') {
      item.type = 'rainbow';
    } else if (f.media_url) {
      item.type = 'image';
      item.url = resolveMedia(f.media_url);
      item.format = f.media_format || 'png';
      item.animated = !!(f.media_animated_url || f.media_format === 'gif' || f.media_kind === 'video');
      if (f.media_animated_url) item.animatedUrl = resolveMedia(f.media_animated_url);
      if (f.media_static_url) item.staticUrl = resolveMedia(f.media_static_url);
    } else {
      return null;
    }
    return item;
  }).filter(Boolean);

  const lines = rows.map((r) => '    ' + JSON.stringify(r).replace(/"([a-zA-Z_]+)":/g, '$1:'));
  const out = [
    "AONC.define('config.framesData', function () {",
    "  'use strict';",
    '',
    '  var CDN = ' + JSON.stringify(CDN) + ';',
    '',
    '  var FRAMES = [',
    lines.join(',\n'),
    '  ];',
    '',
    '  return { CDN: CDN, FRAMES: FRAMES };',
    '});',
    ''
  ].join('\n');

  writeFileSync('src/shared/config/frames-data.js', out);
  console.log('frames:', rows.length, '| image:', rows.filter((r) => r.type === 'image').length,
    '| ring:', rows.filter((r) => r.type === 'ring').length,
    '| rainbow:', rows.filter((r) => r.type === 'rainbow').length,
    '| bytes:', out.length);
}

main().catch((e) => { console.error(e); process.exit(1); });
