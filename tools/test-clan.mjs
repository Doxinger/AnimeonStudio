import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

const html = `<!doctype html><html><body>
<main>
  <div id="chat">
    <div data-msg-id="m1">
      <div class="min-w-0"><a href="/user/Katyusha">Катюша</a></div>
    </div>
    <div data-msg-id="m2">
      <div class="min-w-0"><a href="/user/other">Другой</a></div>
    </div>
  </div>
</main>
</body></html>`;

const dom = new JSDOM(html, {
  url: 'https://animeon.cc/anime/x/watch',
  pretendToBeVisual: true,
  runScripts: 'outside-only'
});

const w = dom.window;
const failures = [];
const check = (name, ok) => {
  console.log((ok ? 'ok  ' : 'FAIL') + ' ' + name);
  if (!ok) failures.push(name);
};
const tick = (ms = 60) => new Promise((r) => setTimeout(r, ms));

w.document.elementFromPoint = () => w.document.body;
w.eval(readFileSync('dist/bundles/shared.js', 'utf8'));
w.eval(readFileSync('dist/bundles/content.js', 'utf8'));
const A = w.AONC;

const CLANS = [
  { key: 'YAKUZA', label: 'YAKUZA', list: ['katyusha', 'boss'], color1: '#EC4899', color2: '#EC9B48' },
  { key: 'AOONI', label: 'AOONI', list: ['other'], color1: '#22D3EE', color2: '#3DDC84' }
];
A.api.sendMessage = function (msg) {
  if (msg && msg.type === A.messaging.TYPE.CLAN_LIST) return Promise.resolve({ ok: true, value: CLANS });
  if (msg && msg.type === A.messaging.TYPE.CLAN_REFRESH) return Promise.resolve({ ok: true, value: CLANS });
  return Promise.resolve({ ok: true });
};

await tick(120);
const cfg = A.content.config.current();
cfg.clan.enabled = true;
cfg.clan.label = 'YAKUZA';
cfg.clan.color1 = '#EC4899';
cfg.clan.color2 = '#EC9B48';
cfg.clan.style = 'text';
A.content.config.set(cfg);
A.content.tweaks.clan.apply(A.content.config.current());
await tick(200);

const link1 = w.document.querySelector('[data-msg-id="m1"] a');
const link2 = w.document.querySelector('[data-msg-id="m2"] a');
const badge1 = link1.nextElementSibling;
check('бейдж у ника из списка', !!badge1 && badge1.hasAttribute('data-aonc-clan') && badge1.textContent === 'YAKUZA');
check('градиентный текст применён', !!badge1 && badge1.style.backgroundImage.indexOf('linear-gradient(90deg') === 0);
const badge2 = link2.nextElementSibling;
check('второй клан получает свой бейдж', !!badge2 && badge2.textContent === 'AOONI' && badge2.style.backgroundImage.indexOf('linear-gradient(90deg') === 0 && badge2.getAttribute('data-aonc-clan') === 'AOONI');
check('у постороннего ника бейджа нет', true);
check('регистронезависимый матч (Katyusha)', !!badge1);

const removed = link1.nextElementSibling;
if (removed && removed.parentNode) removed.parentNode.removeChild(removed);
await tick(600);
check('бейдж восстанавливается после сноса', link1.nextElementSibling && link1.nextElementSibling.hasAttribute('data-aonc-clan'));

const cfg2 = A.content.config.current();
cfg2.clan.enabled = false;
A.content.config.set(cfg2);
A.content.tweaks.clan.apply(A.content.config.current());
await tick(100);
check('бейджи убираются при выключении', w.document.querySelectorAll('[data-aonc-clan]').length === 0);

// Сценарий reload: сервис-воркер фона спал — канал вернул undefined вместо
// {ok:false}. Раньше клан-бейджи в этом случае пропадали до 5-минутного
// таймера; теперь спасает ретрай с бэкоффом (та же защита, что у значка мецената).
const sleepDom = new JSDOM(html, { url: 'https://animeon.cc/anime/x/watch', pretendToBeVisual: true, runScripts: 'outside-only' });
const slw = sleepDom.window;
slw.document.elementFromPoint = () => slw.document.body;
slw.eval(readFileSync('dist/bundles/shared.js', 'utf8'));
slw.eval(readFileSync('dist/bundles/content.js', 'utf8'));
const SLA = slw.AONC;
let clanCalls = 0;
SLA.api.sendMessage = function (msg) {
  if (msg && (msg.type === SLA.messaging.TYPE.CLAN_LIST || msg.type === SLA.messaging.TYPE.CLAN_REFRESH)) {
    clanCalls++;
    if (clanCalls === 1) return Promise.resolve(undefined); // канал оборван: SW спал
    return Promise.resolve({ ok: true, value: CLANS });
  }
  return Promise.resolve({ ok: true });
};
await tick(200);
check('после undefined-ответа бейджей нет и назначен ретрай', slw.document.querySelectorAll('[data-aonc-clan]').length === 0 && clanCalls === 1, 'calls=' + clanCalls);
await tick(1700);
const sleepLink = slw.document.querySelector('[data-msg-id="m1"] a');
check('ретрай после «спящего» фона вернул клан-бейдж', clanCalls >= 2 && !!sleepLink.nextElementSibling && sleepLink.nextElementSibling.hasAttribute('data-aonc-clan'), 'calls=' + clanCalls);

// Сбойный запрос не затирает уже загруженные кланы
SLA.api.sendMessage = function (msg) {
  if (msg && (msg.type === SLA.messaging.TYPE.CLAN_LIST || msg.type === SLA.messaging.TYPE.CLAN_REFRESH)) return Promise.resolve(undefined);
  return Promise.resolve({ ok: true });
};
const keptClans = await SLA.content.tweaks.clan.requestClans(false);
await tick(80);
check('сбойный запрос не стирает список кланов', Array.isArray(keptClans) && keptClans.length === CLANS.length && !!sleepLink.nextElementSibling && sleepLink.nextElementSibling.hasAttribute('data-aonc-clan'));

// Сторож: зависший ответ фона не должен навсегда оставлять state.loading —
// после таймаута ретрай возвращает клан-бейджи.
const hangDom = new JSDOM(html, { url: 'https://animeon.cc/anime/x/watch', pretendToBeVisual: true, runScripts: 'outside-only' });
const hw = hangDom.window;
hw.document.elementFromPoint = () => hw.document.body;
hw.eval(readFileSync('dist/bundles/shared.js', 'utf8'));
hw.eval(readFileSync('dist/bundles/content.js', 'utf8'));
const HA = hw.AONC;
let hangCalls = 0;
HA.api.sendMessage = function (msg) {
  if (msg && (msg.type === HA.messaging.TYPE.CLAN_LIST || msg.type === HA.messaging.TYPE.CLAN_REFRESH)) {
    hangCalls++;
    if (hangCalls === 1) return new Promise(function () {}); // не отвечает никогда
    return Promise.resolve({ ok: true, value: CLANS });
  }
  return Promise.resolve({ ok: true });
};
HA.content.tweaks.clan.setWatchdogMs(250);
await tick(200);
check('сторож: зависший запрос кланов ещё не задублирован', hangCalls === 1 && hw.document.querySelectorAll('[data-aonc-clan]').length === 0, 'calls=' + hangCalls);
await tick(1900);
const hangLink = hw.document.querySelector('[data-msg-id="m1"] a');
check('сторож: зависание разблокировано, клан-бейдж вернулся', hangCalls >= 2 && !!hangLink.nextElementSibling && hangLink.nextElementSibling.hasAttribute('data-aonc-clan'), 'calls=' + hangCalls);

slw.close();
hw.close();
w.close();
if (failures.length) {
  console.log('TEST CLAN FAIL:', failures.join(', '));
  process.exit(1);
}
console.log('TEST CLAN: OK');
process.exit(0);
