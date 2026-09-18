import { readFile, writeFile } from 'node:fs/promises';

const RARITY = {
  common: { label: 'Обычный', color: '#B4B4C0' },
  rare: { label: 'Редкий', color: '#38BDF8' },
  epic: { label: 'Эпический', color: '#E879F9' },
  legendary: { label: 'Легендарный', color: '#FBBF24' },
  mythic: { label: 'Мифический', color: '#FF4FB8' }
};

const RINGS = {
  purple: '#7C4DFF',
  teal: '#00D3A7',
  gold: '#FBBF24',
  red: '#EF4444'
};

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function normalizeScale(v) {
  const n = Number(v);
  if (!isFinite(n) || n <= 0) return 1;
  if (n < 1) return 1 / Math.max(0.1, n);
  return Math.max(0.5, Math.min(2.5, n));
}

function stage(frame, face) {
  const scale = frame.media_url ? Math.max(1, normalizeScale(frame.frame_scale)) : 1;
  const composite = Math.round(face * scale);
  let overlay = '';
  if (frame.media_url) {
    const file = frame.media_url.split('/').pop();
    overlay = `<img class="fr" src="frame-assets/${esc(file)}" alt="" style="width:${composite}px;height:${composite}px">`;
  } else if (RINGS[frame.id]) {
    const w = Math.round(face * 0.1);
    overlay = `<span class="ring" style="width:${face}px;height:${face}px;box-shadow:0 0 0 2px #09090b, 0 0 0 ${2 + w}px ${RINGS[frame.id]}"></span>`;
  } else if (frame.id === 'rainbow') {
    overlay = `<span class="ring rainbow" style="width:${face}px;height:${face}px;padding:${Math.round(face * 0.05)}px"></span>`;
  }
  return `<span class="stage" style="width:${composite + 8}px;height:${composite + 8}px">
    <span class="face" style="width:${face}px;height:${face}px"><img src="uploads/1_изображение.png" alt=""></span>${overlay}</span>`;
}

function card(frame) {
  const r = RARITY[frame.rarity] || RARITY.common;
  const scale = frame.media_url ? normalizeScale(frame.frame_scale) : 1;
  return `<figure class="card r-${frame.rarity}" style="--rc:${r.color}">
  ${stage(frame, 62)}
  <figcaption>
    <b>${esc(frame.name)}</b>
    <span><i style="background:${r.color}"></i>${r.label} · ${esc(frame.source_label || frame.source)}${frame.unlocked ? '' : ' · 🔒 не выдана'}</span>
    <code>${scale.toFixed(2)}×${frame.media_url ? ' · png ' + (frame.frame_scale >= 1.45 ? 'крупная' : '') : ' · css'}</code>
  </figcaption>
</figure>`;
}

async function main() {
  const raw = JSON.parse(await readFile(process.argv[2] || 'tools/catalog.sample.json', 'utf8'));
  const frames = (raw.frames || []).slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const hero = frames.find((f) => f.id === '6a831a0568e8f931f0972a06') || frames[5];

  const html = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Рамки AnimeOn — как рисует расширение</title>
<style>
*{box-sizing:border-box}
body{
  margin:0;padding:28px 24px 60px;background:
    radial-gradient(120% 100% at 12% -10%,rgba(124,77,255,.22),transparent 60%),
    linear-gradient(160deg,#100f18 0%,#0a0910 60%,#0b0a12 100%);
  color:#f9f4fc;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
}
h1{font-size:21px;margin:0 0 6px;letter-spacing:-.01em}
p.lead{margin:0 0 22px;color:#a9a3bd;font-size:13px;line-height:1.6;max-width:900px}
p.lead b{color:#e7e0f5}
.hero{
  display:flex;gap:26px;align-items:center;flex-wrap:wrap;padding:20px 22px;margin-bottom:26px;
  border:1px solid rgba(255,255,255,.09);border-radius:20px;
  background:radial-gradient(90% 140% at 10% 0%,rgba(124,77,255,.18),transparent 65%),rgba(255,255,255,.03);
}
.hero .side{display:flex;flex-direction:column;gap:5px;max-width:520px}
.hero .side b{font-size:15px}
.hero .side span{font-size:12px;color:#a9a3bd;line-height:1.6}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(158px,1fr));gap:14px}
.card{
  margin:0;padding:14px 12px 12px;border-radius:16px;border:1px solid rgba(255,255,255,.08);
  background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.015));
  display:flex;flex-direction:column;align-items:center;gap:10px;
}
.card:hover{border-color:color-mix(in oklab,var(--rc) 55%,transparent)}
.stage{position:relative;display:grid;place-items:center;flex:0 0 auto}
.face{
  position:relative;display:grid;place-items:center;border-radius:50%;overflow:hidden;
  background:linear-gradient(135deg,#4a3f6d,#241f33);color:#ded5f2;font-weight:750;font-size:15px;
  box-shadow:0 0 0 1px rgba(255,255,255,.12) inset;
}
.face img{width:100%;height:100%;object-fit:cover;display:block}
.fr{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);object-fit:contain;pointer-events:none}
.ring{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);border-radius:50%}
.ring.rainbow{
  background:conic-gradient(from 0deg,#FF6B6B,#7C4DFF,#00D3A7,#FF6B6B);
  -webkit-mask:radial-gradient(circle,transparent 60%,#000 62%);mask:radial-gradient(circle,transparent 60%,#000 62%);
}
figcaption{display:flex;flex-direction:column;gap:3px;text-align:center;min-width:0}
figcaption b{font-size:12px;font-weight:620;line-height:1.3}
figcaption span{display:flex;align-items:center;justify-content:center;gap:5px;font-size:10px;color:#9d96b3}
figcaption span i{width:7px;height:7px;border-radius:50%;box-shadow:0 0 7px currentColor}
figcaption code{font-size:9.5px;color:#7d7691;font-family:ui-monospace,Menlo,Consolas,monospace}
h2{font-size:14px;margin:34px 0 12px;color:#cfc8e4;letter-spacing:.02em}
.note{font-size:11.5px;color:#8b84a0;margin-top:26px;line-height:1.7;border-top:1px solid rgba(255,255,255,.08);padding-top:16px}
</style>
</head>
<body>
<h1>Рамки аватарки — ${frames.length} шт. из каталога animeon</h1>
<p class="lead">Это не «самодельные SVG-кольца», а <b>настоящие рамки сайта</b>: те же PNG с CDN <b>selcdn.net/cosmetics/frames</b>, тот же коэффициент <b>frame_scale</b> из <b>/api/cosmetics/catalog</b> и то же центрирование поверх аватара. Расширение умеет надевать любую из них — включая невыданные (🔒).</p>

<div class="hero">
  ${stage(hero, 150)}
  <div class="side">
    <b>${esc(hero.name)} · ${(RARITY[hero.rarity] || RARITY.common).label}</b>
    <span>Аватар 150px, коэффициент рамки ${normalizeScale(hero.frame_scale).toFixed(2)}× → картинка рамки ${Math.round(150 * normalizeScale(hero.frame_scale))}px, центрируется поверх аватара, <code>object-fit: contain</code>.</span>
    <span>Рядом остаётся родная рамка сайта — расширение может спрятать её одним переключателем, чтобы не было двойной.</span>
  </div>
</div>

<h2>Все рамки каталога</h2>
<div class="grid">
${frames.map(card).join('\n')}
</div>

<p class="note">Картинки в этой витрине уменьшены до 320px через CDN-ресайз <code>/ioss(resize=320)/</code> — ровно так же расширение грузит миниатюры в студии, чтобы не тянуть по мегабайту на карточку. В самом расширении на аватар надевается полноразмерный оригинал.</p>
</body>
</html>
`;

  await writeFile(process.argv[3] || 'frames-preview.html', html);
  console.log('written', process.argv[3] || 'frames-preview.html', frames.length, 'frames');
}

main().catch((e) => { console.error(e); process.exit(1); });
