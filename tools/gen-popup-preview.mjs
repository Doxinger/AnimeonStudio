// Офлайн-витрина панели расширения: запускает настоящий popup.html/popup.js в
// jsdom и раскладывает живые снимки DOM по «экранам» разного формата.
// Результат — popup-preview.html рядом с папкой проекта (в dist/ не попадает).
import { JSDOM } from 'jsdom';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const OUT = resolve(ROOT, '..', 'popup-preview.html');

const POPUP_HTML = readFileSync(join(ROOT, 'dist/popup/popup.html'), 'utf8')
  .replace(/<script[^>]*><\/script>/g, '');
const POPUP_CSS = readFileSync(join(ROOT, 'dist/popup/popup.css'), 'utf8')
  .replace(/@font-face\{[\s\S]*?\n\}/g, '');
const SHARED = readFileSync(join(ROOT, 'dist/bundles/shared.js'), 'utf8');
const BUNDLE = readFileSync(join(ROOT, 'dist/bundles/popup.js'), 'utf8');
const POPUP_JS = readFileSync(join(ROOT, 'dist/popup/popup.js'), 'utf8');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function makeArea(memory) {
  return {
    get: (keys, cb) => {
      const out = {};
      (Array.isArray(keys) ? keys : [keys]).forEach((k) => { if (memory[k] !== undefined) out[k] = memory[k]; });
      if (cb) cb(out);
      return Promise.resolve(out);
    },
    set: (obj, cb) => { Object.assign(memory, obj); if (cb) cb(); return Promise.resolve(); },
    remove: (keys, cb) => {
      (Array.isArray(keys) ? keys : [keys]).forEach((k) => { delete memory[k]; });
      if (cb) cb();
      return Promise.resolve();
    },
    clear: (cb) => { Object.keys(memory).forEach((k) => delete memory[k]); if (cb) cb(); return Promise.resolve(); }
  };
}

async function snapshot(opts) {
  const memory = {};
  const dom = new JSDOM(POPUP_HTML, {
    url: 'chrome-extension://preview/popup/popup.html',
    pretendToBeVisual: true,
    runScripts: 'outside-only'
  });
  const w = dom.window;
  Object.defineProperty(w, 'innerWidth', { value: opts.innerWidth || 372, configurable: true });
  Object.defineProperty(w, 'innerHeight', { value: opts.innerHeight || 600, configurable: true });
  w.close = function () {};

  const pingValue = opts.silent ? undefined : {
    pong: true,
    url: opts.tabUrl || 'https://v2.animeon.co/catalog',
    picker: false,
    modes: opts.modes || { theater: true, cinema: false, maxplayer: false }
  };

  w.chrome = {
    runtime: {
      id: 'preview', lastError: null,
      getURL: (p) => 'chrome-extension://preview/' + p,
      getManifest: () => ({ version: '1.0.0' }),
      openOptionsPage: () => {},
      sendMessage: (m, cb) => { if (cb) cb({ ok: true }); return Promise.resolve({ ok: true }); },
      onMessage: { addListener() {}, removeListener() {} }
    },
    storage: { local: makeArea(memory), sync: makeArea({}), onChanged: { addListener() {}, removeListener() {} } },
    tabs: {
      query: (q, cb) => {
        const tabs = opts.tabUrl === null ? [] : [{ id: 7, url: opts.tabUrl === undefined ? 'https://v2.animeon.co/catalog' : opts.tabUrl }];
        if (cb) cb(tabs);
        return Promise.resolve(tabs);
      },
      sendMessage: (id, m, cb) => {
        const reply = pingValue ? { ok: true, value: pingValue } : undefined;
        if (cb) cb(reply);
        return Promise.resolve(reply);
      },
      reload: () => Promise.resolve(),
      create: () => Promise.resolve({ id: 8 })
    },
    action: { setIcon() {}, setBadgeText() {}, setBadgeBackgroundColor() {}, setTitle() {} },
    i18n: { getUILanguage: () => 'ru' }
  };

  w.eval(SHARED);
  const A = w.AONC;

  // Конфиг сценария кладём в «хранилище» до запуска панели.
  const patch = Object.assign({}, opts.config || {});
  if (opts.customThemes) patch.customThemes = opts.customThemes;
  memory[A.STORAGE_KEY] = A.config.normalize.createConfig(patch);
  if (opts.profiles) memory[A.PROFILES_KEY] = opts.profiles;

  w.eval(BUNDLE);
  w.eval(POPUP_JS);
  await sleep(opts.wait || 700);

  let html = w.document.documentElement.outerHTML;
  html = html.replace(/<link rel="stylesheet" href="popup\.css">/, '<style>' + POPUP_CSS + '</style>');
  html = html.replace(/ class="booting"/, '');
  w.close();
  return html;
}

function frame(title, note, width, height, html) {
  const srcdoc = html.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return `    <figure class="frame" style="--w:${width}px">
      <figcaption>
        <b>${title}</b>
        <span>${note}</span>
        <code>${width}×${height}</code>
      </figcaption>
      <div class="screen" style="width:${width}px;height:${height}px">
        <iframe srcdoc="${srcdoc}" width="${width}" height="${height}" title="${title}" loading="lazy"></iframe>
      </div>
    </figure>`;
}

async function main() {
  const tuned = {
    theme: { preset: 'midnight', accent: '#6C8CFF' },
    layout: { density: 92, posterScale: 112 },
    typography: { textScale: 106 },
    glass: { blur: 14 },
    visibility: { ads: true, premium: true, cookieBanner: true, heroSlider: true }
  };

  const customThemes = [{
    id: 'ct-neon',
    name: 'Neon Tokyo',
    createdAt: 1, updatedAt: 1,
    parts: ['theme'],
    theme: { preset: 'custom', mode: 'dark', accent: '#FF4D9D', background: '#12061A', radius: 18 },
    wallpaper: {}
  }];

  const profiles = [
    { id: 'pr-night', name: 'Ночной марафон', createdAt: 1, updatedAt: 1, config: A0(tuned) },
    { id: 'pr-day', name: 'Дневной', createdAt: 1, updatedAt: 1, config: A0({ theme: { preset: 'paper', mode: 'light' } }) }
  ];

  function A0(patch) {
    // Профили храним нормализованными и с реально применённым пресетом —
    // иначе свотч профиля показывал бы дефолтный фон вместо цвета темы.
    const tmp = new JSDOM('<!doctype html><title>t</title>', { url: 'https://animeon.cc/', runScripts: 'outside-only' });
    tmp.window.eval(SHARED);
    const A = tmp.window.AONC;
    const base = A.config.normalize.createConfig({});
    const presetId = (patch.theme || {}).preset;
    if (presetId && A.config.presets.byId[presetId]) {
      Object.assign(base.theme, A.config.presets.themePatch(presetId));
    }
    const cfg = A.config.normalize.normalizeConfig(A.lang.deepMerge(base, patch));
    tmp.window.close();
    return cfg;
  }

  const scenes = [
    {
      title: 'Chrome, обычное окно',
      note: 'вкладка сайта отвечает, театр включён',
      width: 372, height: 600,
      opts: { config: tuned, customThemes, profiles, innerWidth: 372, innerHeight: 600 }
    },
    {
      title: 'Узкий экран',
      note: 'те же данные, раскладка перестроилась',
      width: 320, height: 470,
      opts: { config: tuned, customThemes, profiles, innerWidth: 320, innerHeight: 470 }
    },
    {
      title: 'Светлая тема',
      note: 'панель повторяет тему сайта',
      width: 372, height: 600,
      opts: {
        innerWidth: 372, innerHeight: 600,
        config: { theme: { preset: 'paper', mode: 'light', accent: '#0D9488' }, layout: { density: 104 } }
      }
    },
    {
      title: 'Вкладка не с сайта',
      note: 'настройки доступны, режимы плеера выключены',
      width: 372, height: 600,
      opts: { config: tuned, tabUrl: 'https://example.com/', innerWidth: 372, innerHeight: 600 }
    },
    {
      title: 'Открыто как страница',
      note: 'широкий формат — две колонки',
      width: 780, height: 620,
      opts: { config: tuned, customThemes, profiles, innerWidth: 900, innerHeight: 700 }
    }
  ];

  const frames = [];
  for (const scene of scenes) {
    const html = await snapshot(scene.opts);
    frames.push(frame(scene.title, scene.note, scene.width, scene.height, html));
    process.stdout.write('  снимок: ' + scene.title + '\n');
  }

  const page = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AnimeOn Studio — панель расширения</title>
<style>
  *{box-sizing:border-box}
  body{
    margin:0;padding:32px 24px 56px;background:#08090d;color:#e9eaf0;
    font:14px/1.6 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
  }
  h1{margin:0 0 6px;font-size:24px;letter-spacing:-.01em}
  h1 b{background:linear-gradient(92deg,#fff,#a98bff);-webkit-background-clip:text;background-clip:text;color:transparent}
  .lead{margin:0 0 8px;color:#9aa0b4;max-width:80ch}
  .facts{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0 28px;padding:0;list-style:none}
  .facts li{
    border:1px solid rgba(255,255,255,.1);background:#12131a;border-radius:99px;
    padding:5px 12px;font-size:12.5px;color:#c3c7d6;
  }
  .facts b{color:#fff}
  .grid{display:flex;flex-wrap:wrap;gap:28px;align-items:flex-start}
  .frame{margin:0}
  figcaption{display:flex;flex-direction:column;gap:2px;margin-bottom:10px;max-width:var(--w)}
  figcaption b{font-size:14px}
  figcaption span{font-size:12.5px;color:#9aa0b4}
  figcaption code{font-size:11.5px;color:#6d7185}
  .screen{
    border:1px solid rgba(255,255,255,.14);border-radius:14px;overflow:hidden;
    box-shadow:0 24px 60px -28px rgba(0,0,0,.9);background:#0b0c11;
  }
  iframe{display:block;border:0}
  .note{margin-top:34px;padding:16px 18px;border:1px solid rgba(255,255,255,.09);border-radius:14px;background:#0f1017;max-width:90ch}
  .note h2{margin:0 0 8px;font-size:15px}
  .note ul{margin:0;padding-left:18px;color:#9aa0b4}
  .note li{margin:4px 0}
  .note code{color:#c4b5fd}
</style>
</head>
<body>
  <h1>Панель <b>AnimeOn Studio</b> — после переработки</h1>
  <p class="lead">Снимки собраны автоматически: настоящий <code>popup.html</code> прогнан в jsdom с боевым
  <code>popup.css</code> и <code>popup.js</code>, затем уложен в экраны разного формата. Всё, что вы видите, — реальная
  разметка панели, а не макет.</p>
  <ul class="facts">
    <li>бандл панели <b>64 КБ</b> вместо 300 КБ студийного <code>ui.js</code></li>
    <li>первый кадр рисуется <b>до</b> чтения storage</li>
    <li>перетаскивание слайдера — <b>один</b> шаг истории и живой отклик сайта</li>
    <li>светлая/тёмная схема — <b>из темы сайта</b></li>
    <li>раскладка: <b>372 / 320 / 780 px</b> и низкие экраны</li>
  </ul>

  <div class="grid">
${frames.join('\n')}
  </div>

  <div class="note">
    <h2>Что изменилось</h2>
    <ul>
      <li>Свой тонкий бандл <code>bundles/popup.js</code>: панель больше не грузит разделы студии, палитру команд и кастомные виджеты.</li>
      <li>Живая запись: слайдер обновляет сайт во время перетаскивания (троттлинг 130 мс), а не после паузы в 320 мс.</li>
      <li>DOM не перерисовывается целиком — состояние меняется классами, поэтому узлы не теряют фокус.</li>
      <li>Эмодзи заменены на SVG-иконки из общего набора студии.</li>
      <li>Добавлены: отмена/повтор, профили, счётчик скрытых блоков, сброс значения по клику, статус сохранения.</li>
      <li>Вне сайта настройки больше не прячутся — недоступны только режимы плеера и перезагрузка вкладки.</li>
      <li>Панель понимает состояние вкладки: «подключено», «обновите вкладку», «вне сайта», «выключено».</li>
      <li>Доступность: <code>aria-pressed</code>, <code>aria-valuetext</code>, живая область статуса, видимый фокус, Esc закрывает, Ctrl+Z отменяет.</li>
    </ul>
  </div>
</body>
</html>
`;

  writeFileSync(OUT, page);
  process.stdout.write('готово: ' + OUT + ' (' + (page.length / 1024).toFixed(0) + ' КБ)\n');
}

main().catch((e) => {
  console.error('СБОЙ ВИТРИНЫ: ' + (e && e.stack || e));
  process.exit(1);
});
