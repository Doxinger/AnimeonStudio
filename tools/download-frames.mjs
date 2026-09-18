import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const CDN = 'https://ab18cf62-4b99-4613-a8c1-c801eda74545.selcdn.net';

async function main() {
  const raw = JSON.parse(await readFile(process.argv[2] || 'tools/catalog.sample.json', 'utf8'));
  await mkdir('tools/frame-assets', { recursive: true });
  let done = 0;
  for (const f of raw.frames || []) {
    if (!f.media_url) continue;
    let p = f.media_url;
    if (p.startsWith('/media/')) p = p.slice(7);
    if (p.startsWith('cosmetic/frames/')) p = 'cosmetics/frames/' + p.slice(16);
    const small = CDN + '/ioss(resize=320)' + (p.startsWith('/') ? p : '/' + p);
    const name = p.split('/').pop();
    const out = 'tools/frame-assets/' + name;
    if (existsSync(out)) { done++; continue; }
    const r = await fetch(small, { headers: { 'user-agent': 'Mozilla/5.0' } });
    if (!r.ok) { console.log('skip', name, r.status); continue; }
    await writeFile(out, Buffer.from(await r.arrayBuffer()));
    done++;
  }
  console.log('downloaded', done);
}

main().catch((e) => { console.error(e); process.exit(1); });
