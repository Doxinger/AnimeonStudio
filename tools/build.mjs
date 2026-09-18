#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import { join, dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');

const bundles = JSON.parse(readFileSync(join(ROOT, 'tools/bundles.json'), 'utf8'));
const manifestTemplate = JSON.parse(readFileSync(join(ROOT, 'manifest.template.json'), 'utf8'));

const TARGETS = {
  chromium: { dir: 'dist', label: 'Chromium / Chrome / Edge' },
  gecko: { dir: 'dist-firefox', label: 'Firefox / LibreWolf / Waterfox' }
};

const PAGE_SCRIPTS = new Set(['src/options/options.js', 'src/popup/popup.js', 'src/offline/offline.js']);

const errors = [];
const warnings = [];

const rel = (p) => {
  const cut = p.startsWith(ROOT) ? p.slice(ROOT.length + 1) : p;
  return cut.split(sep).join('/');
};

function listAllSources() {
  const out = [];
  (function walk(dir) {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith('.js')) out.push(full);
    }
  })(SRC);
  return out;
}

function lintCheck() {
  try {
    execFileSync('npx', ['--no-install', 'eslint', 'src', 'tools'], { stdio: 'pipe', cwd: ROOT });
    process.stdout.write('  eslint: чисто\n');
    return true;
  } catch (e) {
    if (e && e.code === 'ENOENT') {
      process.stdout.write('  eslint: не установлен, пропуск\n');
      return true;
    }
    const out = String(e.stdout || '') + String(e.stderr || '');
    if (/\d+ error/.test(out)) {
      errors.push('ESLint:\n' + out.slice(0, 1500));
      return false;
    }
    process.stdout.write('  eslint: warnings только\n');
    return true;
  }
}

function syntaxCheck(files) {
  let checked = 0;
  for (const file of files) {
    try {
      execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
      checked++;
    } catch (e) {
      errors.push(`Синтаксис: ${rel(file)}\n${String(e.stderr || e.message).slice(0, 600)}`);
    }
  }
  return checked;
}

function concat(files, banner) {
  const parts = [banner];
  for (const f of files) {
    const full = join(ROOT, f);
    if (!existsSync(full)) { errors.push(`Нет файла из bundles.json: ${f}`); continue; }
    parts.push(`/* ==== ${f} ==== */`, readFileSync(full, 'utf8').replace(/\s+$/, ''));
  }
  return parts.join('\n') + '\n';
}

function ensureBundleFiles() {
  const declared = new Set();
  for (const name of Object.keys(bundles)) for (const f of bundles[name] || []) declared.add(f);
  const missing = listAllSources().filter(f => !declared.has(rel(f)) && !PAGE_SCRIPTS.has(rel(f)));
  for (const f of missing) warnings.push(`Файл не входит ни в один бандл: ${rel(f)}`);
}

function copyDir(from, to) {
  mkdirSync(to, { recursive: true });
  for (const entry of readdirSync(from)) {
    const s = join(from, entry);
    const d = join(to, entry);
    if (statSync(s).isDirectory()) copyDir(s, d);
    else writeFileSync(d, readFileSync(s));
  }
}

function manifestFor(target) {
  const manifest = JSON.parse(JSON.stringify(manifestTemplate));

  if (target === 'gecko') {
    manifest.background = { scripts: ['bundles/background.js'] };
    manifest.browser_specific_settings = manifest.browser_specific_settings || {
      gecko: { id: 'animeon-studio@local.extension', strict_min_version: '115.0' }
    };
  } else {
    manifest.background = { service_worker: 'bundles/background.js' };
    delete manifest.browser_specific_settings;
  }

  return manifest;
}

function validateManifest(manifest, target, distDir) {
  const need = ['manifest_version', 'name', 'version', 'description', 'background', 'action', 'content_scripts'];
  for (const k of need) if (!(k in manifest)) errors.push(`Манифест[${target}]: нет ключа ${k}`);
  if (manifest.manifest_version !== 3) errors.push(`Манифест[${target}]: ожидается manifest_version 3`);

  const bg = manifest.background || {};
  if (target === 'gecko' && !Array.isArray(bg.scripts)) errors.push(`Манифест[${target}]: нужен background.scripts`);
  if (target === 'chromium' && typeof bg.service_worker !== 'string') errors.push(`Манифест[${target}]: нужен background.service_worker`);
  if (target === 'chromium' && bg.scripts) errors.push(`Манифест[${target}]: background.scripts недопустим в Chromium MV3`);
  if (target === 'gecko' && bg.service_worker) warnings.push(`Манифест[${target}]: service_worker оставлен рядом со scripts`);

  const refs = [];
  if (bg.service_worker) refs.push(bg.service_worker);
  (bg.scripts || []).forEach(s => refs.push(s));
  if (manifest.action) {
    if (manifest.action.default_popup) refs.push(manifest.action.default_popup);
    Object.values(manifest.action.default_icon || {}).forEach(v => refs.push(v));
  }
  Object.values(manifest.icons || {}).forEach(v => refs.push(v));
  if (manifest.options_ui && manifest.options_ui.page) refs.push(manifest.options_ui.page);
  for (const cs of manifest.content_scripts || []) for (const js of cs.js || []) refs.push(js);
  for (const war of manifest.web_accessible_resources || []) for (const r of war.resources || []) refs.push(r);

  for (const r of refs) {
    if (r.includes('*')) continue;
    if (!existsSync(join(distDir, r))) errors.push(`Манифест[${target}] ссылается на отсутствующий файл: ${r}`);
  }

  for (const cs of manifest.content_scripts || []) {
    if (!cs.matches || !cs.matches.length) errors.push(`Манифест[${target}]: content_script без matches`);
  }

  const customCommands = Object.keys(manifest.commands || {}).filter(c => c !== '_execute_action');
  if (customCommands.length > 4) warnings.push(`Манифест[${target}]: Chrome допускает 4 команды + _execute_action (сейчас ${customCommands.length})`);
}

function smokeTest(distDir) {
  const code = readFileSync(join(distDir, 'bundles/shared.js'), 'utf8');

  let A;
  try {
    vm.runInThisContext(code, { filename: 'shared.bundle.js' });
    A = globalThis.AONC;
  } catch (e) {
    errors.push('Smoke: shared.js не выполняется — ' + e.message);
    return;
  }
  if (!A) { errors.push('Smoke: не найден globalThis.AONC'); return; }

  const required = [
    'lang', 'api', 'messaging', 'color.convert', 'color.transform', 'color.contrast',
    'color.palette', 'css.units', 'css.pattern', 'css.writer', 'config.DEFAULTS',
    'config.normalize', 'config.selectors', 'config.presets', 'config.fonts', 'cssBuilder'
  ];
  const registrationBroken = required.some((path) => !A.use(path));
  for (const path of required) if (!A.use(path)) errors.push(`Smoke: модуль не зарегистрирован — ${path}`);
  if (registrationBroken) return;

  ['tokens', 'base', 'wallpaper', 'typography', 'density', 'glass', 'layout', 'motion', 'media', 'player', 'visibility', 'elements', 'cosmetics', 'userCss'].forEach(function (p) {
    if (!A.cssBuilder[p] || typeof A.cssBuilder[p].build !== 'function') {
      errors.push('Smoke: cssBuilder.' + p + ' потерян при слиянии namespace');
    }
  });
  if (typeof A.cssBuilder.buildCssOnly !== 'function') errors.push('Smoke: cssBuilder.buildCssOnly отсутствует');

  const cfg = A.config.normalize.createConfig();
  const built = A.cssBuilder.build(cfg, '/');
  if (!built.css || built.css.length < 200) errors.push('Smoke: дефолтный CSS слишком короткий');
  if (built.stats.errors.length) errors.push('Smoke: ошибки частей — ' + JSON.stringify(built.stats.errors));

  for (const preset of A.config.presets.LIST) {
    const p = A.lang.deepMerge(cfg, { theme: Object.assign({ preset: preset.id }, A.config.presets.themePatch(preset.id)) });
    const r = A.cssBuilder.build(p, '/');
    if (!r.css) errors.push(`Smoke: пресет ${preset.id} не дал CSS`);
    if (r.stats.errors.length) errors.push(`Smoke: пресет ${preset.id} — ${JSON.stringify(r.stats.errors)}`);
  }

  const stress = A.lang.deepMerge(cfg, {
    theme: { preset: 'custom', mode: 'auto', accent: '#22D3EE', background: '#04121A', radius: 22, saturation: 140, autoContrast: true },
    typography: { uiScale: 118, textScale: 130, letterSpacing: 0.4, lineHeight: 1.7, headingScale: 112, headingWeight: 800, headingTransform: 'uppercase', loadGoogleFont: true, googleFont: 'Unbounded' },
    glass: { enabled: true, blur: 22, alpha: 34, headerHeight: 52, headerCompact: true, headerHideOnScroll: true },
    layout: { density: 78, containerWidth: 1600, columns: 7, posterScale: 145, posterGap: 22, posterRadius: 26, posterAspect: '3/4', posterShadow: 'glow', cardHover: 'lift', heroScale: 62, grayscalePosters: 25, dimPosters: 15, showRowScrollbars: true },
    player: { theaterMode: true, cinemaLights: true, cinemaDim: 88, playerRadius: 20, wideMode: true, playbackRate: 1.5 },
    wallpaper: { enabled: true, source: 'preset', preset: 'aurora', size: 'cover', repeat: 'no-repeat', overlay: 50, blur: 4, saturate: 130, vignette: 30, showThrough: true, parallax: true, parallaxStrength: 45, drift: false, rules: [A.lang.normalize(A.config.defaults.wallpaperRule, { id: 'wp-cat', name: 'Каталог', urlPatterns: ['/catalog'], source: 'preset', preset: 'grid', overlay: 20, size: 'auto', repeat: 'repeat' })] },
    performance: { perfMode: 'lite', reduceMotion: true, disableBlur: true, disableShadows: true, posterQuality: 95, posterResizeWidth: 400 },
    privacy: { softBlock: true, stripUrlParams: true },
    visibility: Object.fromEntries(Object.keys(A.config.selectors.visibility).map(k => [k, true])),
    elements: { rules: [A.lang.normalize(A.config.defaults.elementRule, { id: 'r1', name: 'Тест', selector: 'header .container', action: 'style', style: { opacity: 0.5, blur: 3, scale: 1.1, background: '#101014', color: '#fff', radius: 8 }, rawCss: 'outline: 1px solid red;' })] },
    custom: { css: 'body{cursor:crosshair}', cssSnippets: [{ id: 's1', name: 'Каталог', urlPatterns: ['/catalog'], enabled: true, body: 'main{opacity:.9}' }], js: 'console.log(1)', jsPageContext: true }
  });
  const stressBuilt = A.cssBuilder.build(stress, '/catalog?sort=votes');
  if (!stressBuilt.css) errors.push('Smoke: стресс-конфиг не дал CSS');
  if (stressBuilt.stats.errors.length) errors.push('Smoke: стресс-ошибки — ' + JSON.stringify(stressBuilt.stats.errors));
  if (!/grid-template-columns:repeat\(7/.test(stressBuilt.css.replace(/\s/g, ''))) warnings.push('Smoke: не найдено правило колонок');
  const flatStress = stressBuilt.css.replace(/\s/g, '');
  if (!/body::before\{[^}]*background-image:url\("data:image\/svg\+xml,/.test(flatStress)) errors.push('Smoke: per-URL правило обоев не применилось на /catalog');
  if (!/--aonc-parallax-y/.test(flatStress)) errors.push('Smoke: параллакс не добавил transform с переменной');
  const homeBuilt = A.cssBuilder.build(stress, '/');
  const flatHome = homeBuilt.css.replace(/\s/g, '');
  if (!/body::before\{[^}]*background-image:radial-gradient\(1100px700pxat15%8%/.test(flatHome)) errors.push('Smoke: глобальный пресет обоев не применился на /');
  if (/\(rulewp-cat\)/.test(homeBuilt.css)) errors.push('Smoke: правило каталога сработало на главной');
  if (!flatHome.includes('htmlbody[class*="bg-["]{background-color:transparent!important;')) errors.push('Smoke: обои не делают body прозрачным (специфичность bg-[…)');
  if (stressBuilt.css.indexOf('body{cursor:crosshair}') === -1) errors.push('Smoke: пользовательский CSS не попал в вывод');
  if (stressBuilt.css.indexOf('main{opacity:.9}') === -1) errors.push('Smoke: пер-URL сниппет не попал в вывод');

  const polished = A.lang.deepMerge(cfg, { theme: { ambient: 60, harmony: 'triad', softShadows: true, motion: 'lively', recolorGradients: true, borderAlpha: 12, themeTransitions: true } });
  const polishCss = A.cssBuilder.buildCssOnly(polished, '/');
  if (!polishCss.includes('html.aonc-theme-switch')) errors.push('Smoke: нет переходов смены темы');
  if (!polishCss.includes('html::after')) errors.push('Smoke: нет амбиентного слоя');
  if (!/rgba\(\d+,\d+,\d+,0\.\d{1,3}\)/.test(polishCss)) errors.push('Smoke: alpha в rgba не округлена');
  if (!polishCss.includes('bg-clip-text')) errors.push('Smoke: нет перекраски градиентов');

  const withThemes = A.lang.deepMerge(cfg, { customThemes: [{ id: 'x', name: 'T', theme: { accent: '#123456' }, wallpaper: { enabled: true } }] });
  const normThemes = A.config.normalize.normalizeConfig(withThemes);
  if (!normThemes.customThemes.length || normThemes.customThemes[0].theme.radius !== 12 || normThemes.customThemes[0].wallpaper.overlay !== 45) {
    errors.push('Smoke: пользовательские темы не нормализуются');
  }

  const broken = A.lang.deepMerge(cfg, {
    theme: { radius: NaN, saturation: undefined, accent: '', borderAlpha: NaN },
    wallpaper: { overlay: null, blur: NaN, vignette: undefined },
    layout: { posterScale: NaN, density: undefined, posterGap: NaN },
    glass: { blur: NaN, alpha: undefined }
  });
  const brokenCss = A.cssBuilder.buildCssOnly(broken, '/');
  if (/NaN|undefined|Infinity/.test(brokenCss)) {
    errors.push('Smoke: в CSS попали NaN/undefined/Infinity при битых значениях');
  }

  const fontCfg = A.lang.deepMerge(cfg, { typography: { loadGoogleFont: true, googleFont: 'Unbounded', fontFamily: '', uiScale: 110 } });
  const fontCss = A.cssBuilder.buildCssOnly(fontCfg, '/');
  if (!fontCss.trimStart().startsWith('@import')) errors.push('Smoke: @import шрифта не поднят в начало CSS (браузер его проигнорирует)');
  if (!/--font-sans:[^;]+!important;/.test(fontCss)) errors.push('Smoke: переменные шрифтов без !important (перебивает inline-стиль сайта)');
  if (!/--default-font-family:/.test(fontCss)) errors.push('Smoke: нет --default-font-family для Tailwind v4');

  const palette = A.color.palette.fromTheme({ background: '#04121A', accent: '#22D3EE' });
  if (A.color.contrast.ratio(palette.foreground, palette.background) < 7) warnings.push('Smoke: низкий контраст базовой пары');

  try {
    vm.runInThisContext(readFileSync(join(distDir, 'bundles/ui.js'), 'utf8'), { filename: 'ui.bundle.js' });
  } catch (e) {
    errors.push('Smoke: ui.js не выполняется — ' + e.message);
  }
  if (A.ui && A.ui.custom) {
    ['presetGrid', 'ruleList', 'snippetList', 'profileList', 'contrast', 'wallpaperInfo', 'wallpaperGrid', 'wallpaperRules', 'cssPreview', 'diagnostics'].forEach(function (name) {
      if (typeof A.ui.custom[name] !== 'function') errors.push(`Smoke: ui.custom.${name} не функция`);
      if (!A.ui.custom.parts || !A.ui.custom.parts[name] || typeof A.ui.custom.parts[name].render !== 'function') {
        errors.push(`Smoke: ui.custom.parts.${name}.render отсутствует (агрегатор затёр модуль)`);
      }
    });
    if (typeof A.ui.custom.cssPreview.refresh !== 'function') errors.push('Smoke: ui.custom.cssPreview.refresh отсутствует');
  if (!A.ui.sections || typeof A.ui.sections.byId !== 'function' || !A.ui.sections.byId('theme')) {
    errors.push('Smoke: ui.sections перезаписан или не зарегистрирован');
  }
  if (typeof A.dom.ready.queryAll !== 'function' || typeof A.dom.queryAll !== 'function') {
    errors.push('Smoke: dom.ready/dom.queryAll повреждены');
  }

    if (typeof A.ui.sections.byId('theme') !== 'object') errors.push('Smoke: секции не зарегистрированы');
  } else {
    errors.push('Smoke: не найден A.ui.custom');
  }

  writeFileSync(join(distDir, 'sample-generated.css'), stressBuilt.css);
  process.stdout.write(`  smoke: ${stressBuilt.css.length} байт CSS, ошибок частей: ${stressBuilt.stats.errors.length}\n`);
}

// Панель расширения грузит свой тонкий бандл: проверяем, что в нём есть всё
// нужное и что тяжёлые модули студии туда не просочились.
function popupBundleCheck(distDir) {
  const popupPath = join(distDir, 'bundles/popup.js');
  if (!existsSync(popupPath)) { errors.push('Smoke: bundles/popup.js не создан'); return; }

  const sandbox = vm.createContext({ console, setTimeout, clearTimeout });
  try {
    vm.runInContext(readFileSync(join(distDir, 'bundles/shared.js'), 'utf8'), sandbox, { filename: 'shared.popup.js' });
    vm.runInContext(readFileSync(popupPath, 'utf8'), sandbox, { filename: 'popup.bundle.js' });
  } catch (e) {
    errors.push('Smoke: bundles/popup.js не выполняется — ' + e.message);
    return;
  }

  const A = sandbox.AONC;
  if (!A) { errors.push('Smoke popup: не найден AONC'); return; }

  ['ui.path', 'ui.controls', 'ui.state', 'ui.history', 'ui.icons', 'ui.i18n', 'config.presets', 'config.profiles', 'config.selectors'].forEach(function (p) {
    if (!A.use(p)) errors.push(`Smoke popup: модуль не зарегистрирован — ${p}`);
  });
  ['ui.renderer', 'ui.sections', 'ui.custom', 'ui.palette'].forEach(function (p) {
    if (A.use(p)) errors.push(`Smoke popup: тяжёлый модуль студии попал в бандл панели — ${p}`);
  });
  if (typeof A.ui.state.get('theme.accent') !== 'string') errors.push('Smoke popup: ui.state не работает без ui.js');
  if (!A.ui.icons.has('maximize')) errors.push('Smoke popup: иконка maximize не найдена');

  const kb = statSync(popupPath).size / 1024;
  if (kb > 80) warnings.push(`bundles/popup.js = ${kb.toFixed(0)} КБ — панель должна оставаться тонкой`);
  process.stdout.write(`  popup-бандл: ${kb.toFixed(1)} КБ (ui.js ${(statSync(join(distDir, 'bundles/ui.js')).size / 1024).toFixed(0)} КБ)\n`);
}

function runJsdomTest(script, label) {
  try {
    const out = execFileSync(process.execPath, [script], { stdio: 'pipe', cwd: ROOT });
    const tail = String(out).trim().split('\n').pop();
    process.stdout.write('  ' + label + ': ' + tail + '\n');
  } catch (e) {
    const msg = String(e.stderr || '') + String(e.stdout || '');
    if (/Cannot find package 'jsdom'|ERR_MODULE_NOT_FOUND/.test(msg)) {
      process.stdout.write('  ' + label + ': jsdom не установлен, пропуск\n');
      return;
    }
    errors.push(label + ' e2e тест упал:\n' + msg.slice(0, 1200));
  }
}

function runPickerTest() {
  runJsdomTest('tools/test-picker.mjs', 'picker e2e');
}

function runBadgesTest() {
  runJsdomTest('tools/test-badges.mjs', 'badges e2e');
}

function runContentTest() {
  runJsdomTest('tools/test-content.mjs', 'content e2e');
}

function runFramesTest() {
  runJsdomTest('tools/test-frames.mjs', 'frames e2e');
  runJsdomTest('tools/test-frames-real.mjs', 'frames real-dom e2e');
  runFramesUiTest();
}

function runFramesUiTest() {
  runJsdomTest('tools/test-frames-ui.mjs', 'frames ui e2e');
}

function runTitlesTest() {
  runJsdomTest('tools/test-titles.mjs', 'titles e2e');
  runJsdomTest('tools/test-titles-ui.mjs', 'titles ui e2e');
}

function runChatTest() {
  runJsdomTest('tools/test-chat.mjs', 'chat e2e');
}

function runCollectionsTest() {
  runJsdomTest('tools/test-collections.mjs', 'collections e2e');
}

function runStudioTest() {
  runJsdomTest('tools/test-studio.mjs', 'studio e2e');
}

function runClanTest() {
  runJsdomTest('tools/test-clan.mjs', 'clan e2e');
}

function runSupporterTest() {
  runJsdomTest('tools/test-supporter.mjs', 'supporter e2e');
}

function runSyncTest() {
  runJsdomTest('tools/test-sync.mjs', 'sync e2e');
}

function runUpdatesTest() {
  runJsdomTest('tools/test-updates.mjs', 'updates e2e');
}

function runProfileFxTest() {
  runJsdomTest('tools/test-profile-fx.mjs', 'profile-fx e2e');
  runJsdomTest('tools/test-showcase.mjs', 'showcase e2e');
}

function runPolishTest() {
  runJsdomTest('tools/test-polish.mjs', 'polish e2e');
}

function runPrivacyTest() {
  runJsdomTest('tools/test-privacy.mjs', 'privacy e2e');
}

function runOptionsTest() {
  runJsdomTest('tools/test-options.mjs', 'options e2e');
}

function runStudioQaTest() {
  runJsdomTest('tools/test-studio-qa.mjs', 'studio qa e2e');
}

function runUnreachableTest() {
  runJsdomTest('tools/test-unreachable.mjs', 'e2e: плашка недоступности и зеркала');
}

function runPopupTest() {
  runJsdomTest('tools/test-popup.mjs', 'popup e2e');
}

function auditCallPaths() {
  const A = globalThis.AONC;
  if (!A) return;

  const groups = [
    { re: /src[\\/](content|background)[\\/]/, skip: ['content.', 'background.', 'ui.', 'api.tabs.'] },
    { re: /src[\\/]ui[\\/]/, skip: ['content.', 'background.', 'api.tabs.'] }
  ];

  const seen = new Map();
  for (const file of listAllSources()) {
    const group = groups.filter(g => g.re.test(file))[0];
    if (!group) continue;
    const src = readFileSync(file, 'utf8');
    for (const m of src.matchAll(/\bA\.([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\s*\(/g)) {
      const path = m[1];
      if (group.skip.some(s => path === s.slice(0, -1) || path.startsWith(s))) continue;
      if (!seen.has(path)) seen.set(path, rel(file));
    }
  }

  for (const [path, file] of seen) {
    const fn = path.split('.').reduce((n, k) => (n == null ? n : n[k]), A);
    if (typeof fn !== 'function') {
      errors.push(`Audit: A.${path}() не является функцией (используется в ${file})`);
    }
  }
  process.stdout.write(`  audit: проверено вызовов A.* — ${seen.size}\n`);
}

function validateHostCoverage() {
  const A = globalThis.AONC;
  if (!A || !A.HOSTS) { warnings.push('Проверка хостов пропущена: AONC.HOSTS недоступен'); return; }

  for (const target of Object.keys(TARGETS)) {
    const distDir = join(ROOT, TARGETS[target].dir);
    const manifestPath = join(distDir, 'manifest.json');
    if (!existsSync(manifestPath)) continue;
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const matches = (manifest.content_scripts && manifest.content_scripts[0] && manifest.content_scripts[0].matches) || [];
    const hosts = manifest.host_permissions || [];

    for (const host of A.HOSTS) {
      const pattern = `*://${host}/*`;
      if (!matches.includes(pattern)) errors.push(`Манифест[${target}]: content_scripts не покрывает хост ${host}`);
      if (!hosts.includes(pattern)) errors.push(`Манифест[${target}]: host_permissions не покрывает хост ${host}`);
    }
  }

  const cases = [
    ['animeon.cc', true], ['www.animeon.cc', true], ['v1.animeon.co', true], ['v2.animeon.co', true],
    ['cdn.v1.animeon.co', true], ['animeon.co', false], ['evil-animeon.cc', false], ['notanimeon.co', false], ['kodikplayer.com', false]
  ];
  for (const [host, expected] of cases) {
    const actual = A.isSiteHost(host);
    if (actual !== expected) errors.push(`isSiteHost(${host}) = ${actual}, ожидалось ${expected}`);
  }
  process.stdout.write(`  хосты: ${A.HOSTS.join(', ')} — покрытие манифестом и isSiteHost OK\n`);
}

function walkSize(dir) {
  let files = 0, bytes = 0;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) { const r = walkSize(full); files += r.files; bytes += r.bytes; }
    else { files++; bytes += statSync(full).size; }
  }
  return { files, bytes };
}

function buildTarget(target) {
  const dir = TARGETS[target].dir;
  const distDir = join(ROOT, dir);

  if (existsSync(distDir)) rmSync(distDir, { recursive: true, force: true });
  mkdirSync(join(distDir, 'bundles'), { recursive: true });

  const banner = (name) => `/*! AnimeOn Studio v${manifestTemplate.version} — bundle: ${name} (${target}) */`;
  const sharedFiles = bundles.shared;
  const outputs = {
    'bundles/shared.js': concat(sharedFiles, banner('shared')),
    'bundles/ui.js': concat(bundles.ui, banner('ui')),
    'bundles/popup.js': concat(bundles.popup || [], banner('popup')),
    'bundles/content.js': concat(bundles.content, banner('content')),
    'bundles/kodik.js': concat(bundles.kodik, banner('kodik')),
    'bundles/background.js': concat(sharedFiles.concat(bundles.background), banner('background'))
  };
  for (const [name, code] of Object.entries(outputs)) writeFileSync(join(distDir, name), code);

  copyDir(join(SRC, 'options'), join(distDir, 'options'));
  copyDir(join(SRC, 'popup'), join(distDir, 'popup'));
  copyDir(join(SRC, 'offline'), join(distDir, 'offline'));
  copyDir(join(ROOT, 'icons'), join(distDir, 'icons'));

  for (const f of ['options/options.js', 'popup/popup.js', 'offline/offline.js']) {
    const targetFile = join(distDir, f);
    const code = readFileSync(targetFile, 'utf8').replace(/^\/\*[\s\S]*?\*\/\n/, '');
    writeFileSync(targetFile, banner(f) + '\n' + code);
  }

  const manifest = manifestFor(target);
  writeFileSync(join(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  validateManifest(manifest, target, distDir);

  for (const f of ['README.md', 'LICENSE']) {
    const p = join(ROOT, f);
    if (existsSync(p)) writeFileSync(join(distDir, f), readFileSync(p));
  }

  const size = walkSize(distDir);
  process.stdout.write(`  ${dir}/ — ${TARGETS[target].label}: background=${Object.keys(manifest.background).join(',')} · ${size.files} файлов, ${(size.bytes / 1024).toFixed(0)} КБ\n`);
  return distDir;
}

function build() {
  process.stdout.write('AnimeOn Studio — сборка (dual target)\n\n');

  process.stdout.write('[1/5] проверка синтаксиса…\n');
  const sources = listAllSources();
  process.stdout.write(`  ok: ${syntaxCheck(sources)}/${sources.length}\n`);
  lintCheck();

  process.stdout.write('[2/5] бандлы и ресурсы…\n');
  ensureBundleFiles();
  const chromiumDir = buildTarget('chromium');
  const geckoDir = buildTarget('gecko');

  process.stdout.write('[3/5] smoke-тест генератора CSS…\n');
  smokeTest(chromiumDir);
  popupBundleCheck(chromiumDir);
  runPopupTest();
  runUnreachableTest();
  runPickerTest();
  runBadgesTest();
  runContentTest();
  runFramesTest();
  runTitlesTest();
  runChatTest();
  runCollectionsTest();
  runStudioTest();
  runClanTest();
  runSupporterTest();
  runSyncTest();
  runUpdatesTest();
  runProfileFxTest();
  runPolishTest();
  runPrivacyTest();
  runOptionsTest();
  runStudioQaTest();
  auditCallPaths();
  validateHostCoverage();

  process.stdout.write('[4/5] размеры…\n');
  process.stdout.write(`  shared.js ${(readFileSync(join(chromiumDir, 'bundles/shared.js')).length / 1024).toFixed(1)} КБ, background.js ${(readFileSync(join(chromiumDir, 'bundles/background.js')).length / 1024).toFixed(1)} КБ\n`);

  process.stdout.write('[5/5] готово\n\n');
  void geckoDir;

  if (warnings.length) {
    process.stdout.write(`Предупреждения (${warnings.length}):\n`);
    warnings.forEach(w => process.stdout.write('  ! ' + w + '\n'));
    process.stdout.write('\n');
  }
  if (errors.length) {
    process.stderr.write(`ОШИБКИ (${errors.length}):\n`);
    errors.forEach(e => process.stderr.write('  ✗ ' + e + '\n'));
    process.exit(1);
  }

  process.stdout.write('Chrome / Edge:  загружайте папку dist/\n');
  process.stdout.write('Firefox / LibreWolf: загружайте папку dist-firefox/ (manifest.json)\n');
}

build();
