import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

const dom = new JSDOM('<!doctype html><html><body><div id="panel"></div></body></html>', {
  url: 'https://animeon.cc/',
  pretendToBeVisual: true,
  runScripts: 'outside-only'
});

const w = dom.window;
const failures = [];
w.eval(readFileSync('dist/bundles/shared.js', 'utf8'));
w.eval(readFileSync('dist/bundles/ui.js', 'utf8'));
const A = w.AONC;

const ctx = {
  custom: A.ui.custom,
  expandedRule: null,
  expandedSnippet: null,
  expandedWallpaperRule: null,
  debouncedRefresh: function () {},
  refresh: function () {},
  refreshAll: function () {},
  jump: function () {},
  activeSection: function () { return 'theme'; }
};

A.ui.state.replace(A.config.normalize.createConfig());

A.ui.sections.all().forEach(function (sec) {
  try {
    const node = A.ui.renderer.renderSection(sec, ctx);
    if (!node) failures.push('section-empty:' + sec.id);
    else w.document.getElementById('panel').appendChild(node);
    console.log('ok   секция рендерится: ' + sec.id);
  } catch (e) {
    console.log('FAIL секция ' + sec.id + ': ' + e.message);
    failures.push('section:' + sec.id);
  }
});

try {
  A.ui.palette.open(ctx);
  console.log('ok   командная палитра открывается');
  A.ui.palette.close();
} catch (e) {
  console.log('FAIL палитра: ' + e.message);
  failures.push('palette');
}

try {
  const ob = A.ui.onboarding.render(ctx);
  console.log('ok   onboarding: ' + (ob ? 'показывается' : 'скрыт'));
  console.log('ok   whatsnew удалён: ' + (A.ui.whatsnew === undefined));
} catch (e) {
  console.log('fail onboarding: ' + e.message);
  failures.push('whatsnew');
}

try {
  const cfg = A.ui.state.current();
  cfg.customThemes = [A.lang.normalize(A.config.defaults.customTheme, { id: 't1', name: 'Т', theme: { accent: '#22d3ee' } })];
  cfg.cosmetics.loadouts = [A.config.loadouts.make(cfg, 'Комплект 1')];
  cfg.cosmetics.badges = [{ id: 'b1', text: 'Б', color: '#fff', icon: 'star' }];
  cfg.cosmetics.frames = [{ id: 'f1', kind: 'neon', color: '#22d3ee' }];
  cfg.elements.rules = [{ id: 'r1', selector: 'header', action: 'hide' }];
  A.ui.state.replace(cfg);
  ['theme', 'cosmetics', 'elements', 'profiles', 'favorites', 'features'].forEach(function (id) {
    const sec = A.ui.sections.byId(id);
    const node = A.ui.renderer.renderSection(sec, ctx);
    w.document.getElementById('panel').appendChild(node);
    console.log('ok   секция с данными рендерится: ' + id);
  });
} catch (e) {
  console.log('FAIL секции с данными: ' + e.message);
  failures.push('sections-data');
}

w.close();
if (failures.length) {
  console.log('TEST STUDIO FAIL:', failures.join(', '));
  process.exit(1);
}
console.log('TEST STUDIO: OK');
process.exit(0);
