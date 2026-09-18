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

const refreshed = [];
const ctx = {
  custom: A.ui.custom,
  expandedRule: null,
  expandedSnippet: null,
  expandedWallpaperRule: null,
  debouncedRefresh: function () {},
  refresh: function (id) { refreshed.push(id); },
  refreshAll: function () {},
  jump: function () {},
  activeSection: function () { return 'theme'; }
};

function check(label, condition, detail) {
  if (condition) console.log('ok   ' + label);
  else {
    console.log('FAIL ' + label + (detail ? ': ' + detail : ''));
    failures.push(label);
  }
}

A.ui.state.replace(A.config.normalize.createConfig());

const totalPresets = A.config.presets.groups().reduce(function (n, g) { return n + g.presets.length; }, 0);
const grid = A.ui.custom.presetGrid({}, ctx);
const cards = grid.querySelectorAll('[data-preset]');
check('витрина тем: карточек = ' + totalPresets, cards.length === totalPresets, 'получено ' + cards.length);
check('витрина тем: живое мини-превью', grid.querySelectorAll('.preset-mini__card').length === totalPresets * 3);
check('витрина тем: оценка контраста у каждой', grid.querySelectorAll('.preset-card__grade').length === totalPresets);

const before = A.ui.state.get('theme.preset');
const other = Array.prototype.find.call(cards, function (c) { return c.getAttribute('data-preset') !== before; });
other.dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
check('витрина тем: клик применяет пресет', A.ui.state.get('theme.preset') !== before,
  before + ' → ' + A.ui.state.get('theme.preset'));
check('витрина тем: раздел перерисован', refreshed.indexOf('theme') !== -1);

const themeSection = A.ui.sections.byId('theme');
A.ui.state.set('meta.locale', 'ru');
check('i18n: ru — заголовок раздела', A.ui.i18n.sectionTitle(themeSection) === themeSection.label);
A.ui.state.set('meta.locale', 'en');
check('i18n: en — заголовок раздела', A.ui.i18n.sectionTitle(themeSection) === 'Theme',
  A.ui.i18n.sectionTitle(themeSection));
check('i18n: en — заголовок группы', A.ui.i18n.groupTitle(A.ui.sections.byId('chat'), { title: 'Мой ник' }) === 'My nickname',
  A.ui.i18n.groupTitle(A.ui.sections.byId('chat'), { title: 'Мой ник' }));
check('i18n: en — подпись настройки',
  A.ui.i18n.controlLabel({ path: 'chat.highlightOwn', label: 'Подсвечивать мои сообщения' }) === 'Highlight my messages');
check('i18n: en — неизвестный ключ отдаёт русский',
  A.ui.i18n.t('ctl.no.such.key', 'Русский текст') === 'Русский текст');
A.ui.state.set('meta.locale', 'ru');
check('i18n: ru — подпись настройки без перевода',
  A.ui.i18n.controlLabel({ path: 'chat.highlightOwn', label: 'Подсвечивать мои сообщения' }) === 'Подсвечивать мои сообщения');

const dashBody = w.document.createElement('div');
A.ui.custom.privacyDash.paint(dashBody, {
  total: 42,
  kinds: { tag: 30, fetch: 8, beacon: 4 },
  hosts: { 'mc.yandex.ru': 20, 'www.google-analytics.com': 12, 'stats.g.doubleclick.net': 10 },
  updated: Date.now()
});
check('дашборд приватности: итоговый счётчик', dashBody.textContent.indexOf('42') !== -1);
check('дашборд приватности: разбивка по типам', dashBody.textContent.indexOf('Скрипты, пиксели и теги') !== -1);
check('дашборд приватности: домены', dashBody.querySelectorAll('.pd-host').length === 3);
A.ui.custom.privacyDash.paint(dashBody, null);
check('дашборд приватности: нет вкладки сайта', dashBody.textContent.indexOf('Нет открытой вкладки сайта') !== -1);

check('changelog: since(0.9.0) отдаёт только новые', (function () {
  const list = A.config.changelog.since('0.9.0');
  return list.length >= 1 && list.every(function (e) { return A.config.changelog.compare(e.version, '0.9.0') > 0; });
})());
check('changelog: since(текущая) пусто', A.config.changelog.since(A.VERSION).length === 0);
check('changelog: isNewerThan работает', A.config.changelog.isNewerThan('0.9.0') && !A.config.changelog.isNewerThan(A.VERSION));
check('changelog: compare по semver', A.config.changelog.compare('1.10.0', '1.9.9') === 1);

const CYR = /[а-яА-ЯёЁ]/;
const untranslated = [];
let labelTotal = 0;
let optionTotal = 0;
let groupTotal = 0;

A.ui.state.set('meta.locale', 'en');
A.ui.sections.all().forEach(function (sec) {
  if (!A.ui.i18n.EN['section.' + sec.id]) untranslated.push('section:' + sec.id);
  if (!A.ui.i18n.EN['intro.' + sec.id]) untranslated.push('intro:' + sec.id);

  var lists = (sec.groups || []).map(function (g) { return g.controls || []; });
  if (sec.controls) lists.push(sec.controls);

  (sec.groups || []).forEach(function (g) {
    groupTotal++;
    if (CYR.test(g.title) && A.ui.i18n.groupTitle(sec, g) === g.title) {
      untranslated.push('group:' + sec.id + '/' + g.title);
    }
  });

  lists.forEach(function (list) {
    list.forEach(function (c) {
      if (c.label) {
        labelTotal++;
        if (CYR.test(c.label) && A.ui.i18n.controlLabel(c) === c.label) {
          untranslated.push('label:' + (c.path || c.id || c.label));
        }
      }
      (c.options || []).forEach(function (o) {
        if (typeof o === 'string') return;
        optionTotal++;
        if (CYR.test(o.label) && A.ui.i18n.optionLabel(c.path, o.value, o.label) === o.label) {
          untranslated.push('option:' + c.path + '=' + o.value);
        }
      });
    });
  });
});
A.ui.state.set('meta.locale', 'ru');

function only(prefix) {
  return untranslated.filter(function (x) { return x.indexOf(prefix) === 0; }).join(', ');
}

check('i18n-покрытие: разделы и описания', only('section:') === '' && only('intro:') === '', only('section:') + only('intro:'));
check('i18n-покрытие: группы (' + groupTotal + ')', only('group:') === '', only('group:'));
check('i18n-покрытие: подписи настроек (' + labelTotal + ')', only('label:') === '', only('label:'));
check('i18n-покрытие: пункты списков (' + optionTotal + ')', only('option:') === '', only('option:'));

const rendered = A.ui.renderer.renderSection(A.ui.sections.byId('theme'), ctx);
check('рендер раздела не падает после i18n-правок', !!rendered && rendered.querySelectorAll('.group').length > 0);

const privacySection = A.ui.sections.byId('privacy');
const hasDash = privacySection.groups.some(function (g) {
  return g.controls.some(function (c) { return c.type === 'privacyDash'; });
});
check('раздел «Приватность» содержит дашборд', hasDash);

const profilesSection = A.ui.sections.byId('profiles');
const hasLocale = profilesSection.groups.some(function (g) {
  return g.controls.some(function (c) { return c.path === 'meta.locale'; });
});
check('раздел «Профили» содержит выбор языка', hasLocale);

w.close();
if (failures.length) {
  console.log('TEST POLISH FAIL:', failures.join(', '));
  process.exit(1);
}
console.log('TEST POLISH: OK');
process.exit(0);
