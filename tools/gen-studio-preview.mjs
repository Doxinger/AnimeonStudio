// Собирает офлайн-витрину новых элементов студии (без сети: CSS инлайном,
// иконки — инлайн-SVG из icons-data). Результат: /home/user/studio-preview.html
import { JSDOM } from 'jsdom';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// витрина кладётся рядом с папкой проекта (вне dist/, чтобы не попасть в zip)
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'studio-preview.html');

const html = readFileSync('dist/options/options.html', 'utf8').replace(/<script[^>]*><\/script>/g, '');
const dom = new JSDOM(html, { url: 'https://animeon.cc/studio', pretendToBeVisual: true, runScripts: 'outside-only' });
const w = dom.window;
const doc = w.document;

const memory = {};
const area = () => ({
  get: (keys, cb) => {
    const out = {};
    (Array.isArray(keys) ? keys : [keys]).forEach((k) => { if (memory[k] !== undefined) out[k] = memory[k]; });
    if (cb) cb(out);
    return Promise.resolve(out);
  },
  set: (obj, cb) => { Object.assign(memory, obj); if (cb) cb(); return Promise.resolve(); },
  remove: (keys, cb) => { (Array.isArray(keys) ? keys : [keys]).forEach((k) => { delete memory[k]; }); if (cb) cb(); return Promise.resolve(); },
  clear: (cb) => { Object.keys(memory).forEach((k) => { delete memory[k]; }); if (cb) cb(); return Promise.resolve(); }
});

w.chrome = {
  runtime: {
    id: 'preview', lastError: null,
    getURL: (p) => 'chrome-extension://preview/' + p,
    getManifest: () => ({ version: '1.0.0' }),
    sendMessage: (m, cb) => { if (cb) cb({ ok: true }); return Promise.resolve({ ok: true }); },
    onMessage: { addListener() {}, removeListener() {} }
  },
  storage: { local: area(), sync: area(), onChanged: { addListener() {}, removeListener() {} } },
  tabs: { query: (q, cb) => { if (cb) cb([]); return Promise.resolve([]); }, sendMessage: (i, m, cb) => { if (cb) cb({}); return Promise.resolve({}); }, reload() {} },
  action: { setIcon() {}, setBadgeText() {}, setBadgeBackgroundColor() {}, setTitle() {} },
  i18n: { getUILanguage: () => 'ru' }
};

w.eval(readFileSync('dist/bundles/shared.js', 'utf8'));
w.eval(readFileSync('dist/bundles/ui.js', 'utf8'));

const A = w.AONC;
const ctx = {
  custom: A.ui.custom,
  expandedRule: null, expandedSnippet: null, expandedWallpaperRule: null,
  debouncedRefresh() {}, refresh() {}, refreshAll() {}, jump() {},
  activeSection: () => 'theme'
};

const clean = A.config.normalize.createConfig();
A.ui.state.replace(clean);

// «грязные» значения, чтобы показать точку возврата
A.ui.state.set('theme.accent', '#FF3D81', { save: false });
A.ui.state.set('layout.density', 128, { save: false });
A.ui.state.set('chat.fontSize', 2, { save: false });

// 1. Меню с меткой NEW и точкой изменений
const nav = doc.createElement('div');
nav.className = 'nav';
A.ui.sections.all().forEach((sec) => {
  const btn = doc.createElement('button');
  btn.type = 'button';
  if (sec.id === 'theme') btn.className = 'on';
  const icon = A.ui.icons.sectionIcon(sec.id, sec.icon, 16);
  if (icon) btn.appendChild(icon);
  btn.appendChild(A.ui.controls.el('span', { class: 'nav-label', text: sec.label }));
  if (A.ui.studioSections.isDirty(sec.id, A.ui.state.current())) {
    btn.appendChild(A.ui.controls.el('span', { class: 'dot', title: 'Есть изменения' }));
  }
  if (A.ui.newSections.isUnseen(sec.id)) {
    btn.appendChild(A.ui.controls.el('span', { class: 'nav-new', text: 'NEW' }));
  }
  nav.appendChild(btn);
});

// 2. Контролы с точкой возврата
const controls = doc.createElement('div');
controls.className = 'sec-body';
[
  { type: 'color', path: 'theme.accent', label: 'Акцентный цвет', hint: 'Кнопки, ссылки, подсветка' },
  { type: 'slider', path: 'layout.density', label: 'Плотность интерфейса', min: 60, max: 160, step: 1, suffix: '%', format: 'percent', reset: 100 },
  { type: 'slider', path: 'chat.fontSize', label: 'Кегль текста сообщений', min: 0, max: 24, step: 0.5, suffix: 'px', reset: 0, hint: '0 = как на сайте (13.5px)' },
  { type: 'toggle', path: 'theme.autoContrast', label: 'Автоконтраст текста', hint: 'Подтягивает контраст до читаемого по WCAG' }
].forEach((def) => {
  const group = A.ui.controls.el('div', { class: 'group' });
  const node = A.ui.renderer.renderControl(def, ctx);
  if (node) group.appendChild(node);
  controls.appendChild(group);
});

// 3. Результаты поиска
const search = A.ui.studioSearch.render('плотность 128', ctx, () => {});
const searchTranslit = A.ui.studioSearch.render('akcent', ctx, () => {});

// 4. Лента изменений
A.ui.history.adopt(A.ui.state.current());
A.ui.state.set('theme.radius', 18, { save: false });
A.ui.state.set('glass.blur', 14, { save: false });
A.ui.state.set('theme.accent', '#22D3EE', { save: false });
const ribbon = A.ui.custom.historyList({ type: 'historyList', id: 'historyList' }, ctx);

// 5. Диалог экспорта настроек
A.ui.themeIo.openExportDialog(ctx);
const dialog = doc.querySelector('.exp-overlay');
if (dialog) { dialog.style.position = 'static'; dialog.style.padding = '0'; dialog.style.background = 'transparent'; dialog.style.backdropFilter = 'none'; }

const css = readFileSync('dist/options/options.css', 'utf8').replace(/<\/style>/gi, '<\\/style>');

function outer(node) { return node ? node.outerHTML : ''; }

const page = `<!doctype html>
<html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AnimeOn Studio — что добавилось в 1.0.0</title>
<style>${css}</style>
<style>
  body{background:var(--bg);padding:26px 22px 60px;display:block}
  .pv{max-width:1180px;margin:0 auto;display:flex;flex-direction:column;gap:26px}
  .pv-h1{font-size:24px;font-weight:800;letter-spacing:-.02em;margin:0 0 4px}
  .pv-sub{color:var(--dim);font-size:13.5px;margin:0 0 18px;line-height:1.55}
  .pv-card{background:var(--bg2);border:1px solid var(--line);border-radius:16px;padding:16px 18px;box-shadow:var(--shadow-1)}
  .pv-card > h2{font-size:15px;margin:0 0 4px;display:flex;align-items:center;gap:9px}
  .pv-card > h2 .n{width:22px;height:22px;border-radius:7px;display:grid;place-items:center;font-size:12px;
    background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;flex:0 0 auto}
  .pv-card > p{margin:0 0 14px;font-size:12.5px;color:var(--dim);line-height:1.55}
  .pv-nav{max-height:520px;overflow:auto;border:1px solid var(--line);border-radius:12px;padding:8px;background:var(--bg2)}
  .pv-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  @media (max-width:900px){.pv-grid{grid-template-columns:1fr}}
  .pv-note{font-size:11.5px;color:var(--faint);margin-top:10px;line-height:1.5}
  .exp-overlay{border:1px dashed color-mix(in oklab,var(--accent) 45%,transparent);border-radius:14px}
  mark{color:#fff}
</style>
</head><body>
<div class="pv">
  <div>
    <h1 class="pv-h1">AnimeOn Studio 1.0.0 — быстрые победы</h1>
    <p class="pv-sub">Пять изменений в самой студии: полная карта разделов, точка «изменено» у каждого контрола,
    история правок, которая переживает перезагрузку вкладки, поиск по значениям и транслиту,
    экспорт пакета с выбором состава. Ниже — живые куски интерфейса, собранные из тех же модулей, что и расширение.</p>
  </div>

  <div class="pv-grid">
    <div class="pv-card">
      <h2><span class="n">1</span> Меню: метки NEW и точки изменений</h2>
      <p>«Чат», «Косметика» и «Избранное» теперь тоже показывают, что раздел изменён, и сбрасываются своей кнопкой.
      Метка NEW снимается сама при первом заходе в раздел.</p>
      <div class="pv-nav">${outer(nav)}</div>
    </div>

    <div class="pv-card">
      <h2><span class="n">2</span> Точка возврата у контрола</h2>
      <p>Значок <b>↺</b> справа появляется только там, где значение отличается от исходного.
      Клик возвращает одну настройку, не трогая остальной раздел.</p>
      ${outer(controls)}
      <div class="pv-note">Подсказка при наведении показывает «текущее → исходное» значение.</div>
    </div>
  </div>

  <div class="pv-grid">
    <div class="pv-card">
      <h2><span class="n">3</span> Поиск по значениям и транслиту</h2>
      <p>Запрос «плотность 128» находит настройку по её текущему значению, «akcent» — по транслиту.
      В выдаче видно путь в конфиге (клик копирует) и текущее значение.</p>
      ${outer(search)}
      <div class="pv-note" style="margin:14px 0 8px">Тот же поиск латиницей:</div>
      ${outer(searchTranslit)}
    </div>

    <div class="pv-card">
      <h2><span class="n">4</span> Лента изменений</h2>
      <p>Раздел «Справка» → «История студии». Каждое действие с подписью и временем,
      откат сразу на несколько шагов. Снапшоты лежат в localStorage и переживают F5,
      но сбрасываются, если конфиг успели изменить в другой вкладке.</p>
      ${outer(ribbon)}
    </div>
  </div>

  <div class="pv-card">
    <h2><span class="n">5</span> Экспорт настроек с выбором состава</h2>
    <p>Раньше в файл темы попадали только палитра и обои. Теперь можно отметить любые части —
    косметику с рамками, чат, свой CSS — а импорт такого файла сливается с текущими настройками вместо полной замены.</p>
    ${outer(dialog)}
  </div>

  <div class="pv-note">Собрано tools/gen-studio-preview.mjs из dist/bundles/{shared,ui}.js · CSS из dist/options/options.css · шрифты не подключены (офлайн-режим).</div>
</div>
</body></html>`;

writeFileSync(OUT, page);
console.log('готово: ' + OUT + ' · ' + (page.length / 1024).toFixed(1) + ' КБ');
dom.window.close();
