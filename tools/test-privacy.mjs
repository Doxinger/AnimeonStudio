import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

const dom = new JSDOM('<!doctype html><html><body><main></main></body></html>', {
  url: 'https://animeon.cc/',
  pretendToBeVisual: true,
  runScripts: 'outside-only'
});

const w = dom.window;
const failures = [];

function check(name, ok, detail) {
  console.log((ok ? 'ok  ' : 'FAIL') + ' ' + name + (ok || !detail ? '' : ' → ' + detail));
  if (!ok) failures.push(name);
}

w.eval(readFileSync('dist/bundles/shared.js', 'utf8'));
w.eval(readFileSync('dist/bundles/content.js', 'utf8'));
const A = w.AONC;

const code = A.content.tweaks.privacy.pageContextCode({});
check('код page-context собирается', typeof code === 'string' && code.indexOf('aoncCount') !== -1);
check('в коде есть сбор статистики', code.indexOf('aonc.blocked.stats') !== -1);
check('в коде есть обработчик сброса', code.indexOf('aonc-privacy-reset') !== -1);

w.eval(code);

const events = [];
w.addEventListener('aonc-tracker-blocked', function (e) { events.push(e.detail); });

const xhr = new w.XMLHttpRequest();
xhr.open('GET', 'https://mc.yandex.ru/watch/98272913');
xhr.send();

const xhr2 = new w.XMLHttpRequest();
xhr2.open('GET', 'https://www.google-analytics.com/collect?v=1');
xhr2.send();

const xhr3 = new w.XMLHttpRequest();
xhr3.open('GET', 'https://animeon.cc/api/catalog');
xhr3.send();

const stats = A.content.tweaks.privacy.getStats();
check('счётчик заблокированных = 2', stats.total === 2, 'получено ' + stats.total);
check('статистика по типам: xhr = 2', stats.kinds.xhr === 2, JSON.stringify(stats.kinds));
check('статистика по доменам: mc.yandex.ru = 1', stats.hosts['mc.yandex.ru'] === 1, JSON.stringify(stats.hosts));
check('статистика по доменам: www обрезан', stats.hosts['google-analytics.com'] === 1 && !stats.hosts['www.google-analytics.com'],
  JSON.stringify(stats.hosts));
check('служебный запрос сайта не заблокирован', events.every(function (e) { return String(e.url).indexOf('animeon.cc/api') === -1; }));
check('событие несёт снапшот статистики', !!events[0] && !!events[0].stats && events[0].stats.kinds.xhr >= 1);

const img = w.document.createElement('img');
img.src = 'https://stats.g.doubleclick.net/pixel.gif';
w.document.body.appendChild(img);

setTimeout(function () {
  const after = A.content.tweaks.privacy.getStats();
  check('тег-трекер заблокирован', after.total >= 3, 'total=' + after.total);
  check('домен doubleclick учтён', (after.hosts['stats.g.doubleclick.net'] || 0) >= 1, JSON.stringify(after.hosts));
  check('тип tag учтён', (after.kinds.tag || 0) >= 1, JSON.stringify(after.kinds));

  const reset = A.content.tweaks.privacy.resetStats();
  check('сброс обнуляет счётчик', reset.total === 0, 'total=' + reset.total);
  check('сброс обнуляет домены', Object.keys(reset.hosts).length === 0);
  check('сброс пишет в localStorage', w.localStorage.getItem('aonc.blocked.total') === '0');

  w.close();
  if (failures.length) {
    console.log('TEST PRIVACY FAIL:', failures.join(', '));
    process.exit(1);
  }
  console.log('TEST PRIVACY: OK');
  process.exit(0);
}, 120);
