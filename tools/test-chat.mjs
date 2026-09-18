import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

const html = `<!doctype html><html><body>
<header><a href="/user/me">avatar</a></header>
<main>
  <div id="chat">
    <div data-msg-id="m1" class="group relative flex gap-3 px-3.5 py-0.5 rounded-xl mt-3">
      <div class="w-10 shrink-0 flex flex-col items-center">
        <a href="/user/me"><div style="width: 40px; height: 40px;"><div style="width: 58px; height: 58px;"></div></div></a>
        <button aria-label="Уровень 12"><span>12</span></button>
      </div>
      <div class="min-w-0 flex-1 max-w-[460px]">
        <div class="flex items-center gap-2 mb-1 flex-wrap">
          <a href="/user/me">Я</a>
          <span data-level="unknown" class="s0-host">S0</span>
          <span class="text-[10.5px] font-mono tabular-nums text-zinc-600">11:09</span>
        </div>
        <div class="relative w-fit max-w-full rounded-md px-3 py-2 text-[13.5px] bg-white/[0.045]">
          <span>привет всем</span>
        </div>
      </div>
      <div class="absolute -top-2.5 right-3">actions</div>
    </div>
    <div data-msg-id="m2" class="group relative flex gap-3 px-3.5 py-0.5 rounded-xl mt-3">
      <div class="w-10 shrink-0 flex flex-col items-center">
        <a href="/user/other"><div style="width: 40px; height: 40px;"></div></a>
      </div>
      <div class="min-w-0 flex-1 max-w-[460px]">
        <div class="flex items-center gap-2 mb-1 flex-wrap">
          <a href="/user/other">Другой</a>
          <span class="text-[10.5px] font-mono tabular-nums text-zinc-600">11:10</span>
        </div>
        <div class="relative w-fit max-w-full rounded-md px-3 py-2 text-[13.5px] bg-white/[0.045]">
          <span>@me, глянь</span>
        </div>
      </div>
    </div>
  </div>
</main>
</body></html>`;

const dom = new JSDOM(html, {
  url: 'https://animeon.cc/anime/some-1/watch',
  pretendToBeVisual: true,
  runScripts: 'outside-only'
});

const w = dom.window;
const failures = [];
const check = (name, ok) => {
  console.log((ok ? 'ok  ' : 'FAIL') + ' ' + name);
  if (!ok) failures.push(name);
};

w.document.elementFromPoint = () => w.document.body;
w.eval(readFileSync('dist/bundles/shared.js', 'utf8'));

const A0 = w.AONC;
const chatCss = A0.cssBuilder.buildCssOnly(
  Object.assign(A0.config.normalize.createConfig(), {
    chat: {
      fontSize: 15, spacing: 8, avatarSize: 48, maxWidth: 640, radius: 10,
      bubbles: 'outline', altRows: true, hideLevels: true, hideBadges: true,
      hideTime: true, hideActions: true, highlightOwn: true, mentionHighlight: true, ownColor: '#22D3EE'
    }
  }),
  '/anime/some-1/watch'
);
check('css: кегль пузырей', chatCss.includes('font-size: 15px !important'));
check('css: отступ строк', chatCss.includes('margin-top: 8px !important'));
check('css: размер аватарок', chatCss.includes('width: 48px !important'));
check('css: ширина колонки', chatCss.includes('max-width: 640px !important'));
check('css: пузыри контуром', chatCss.includes('border: 1px solid var(--aonc-border'));
check('css: зебра', chatCss.includes(':nth-child(even)'));
check('css: скрытие уровней/бейджей/времени/действий',
  chatCss.includes('button[aria-label^="Уровень"]') && chatCss.includes('span[data-level]') &&
  chatCss.includes('span[class*="font-mono"]') && chatCss.includes('div[data-msg-id] > div.absolute'));
check('css: подсветка своих и упоминаний', chatCss.includes('.aonc-own') && chatCss.includes('.aonc-mention'));

w.eval(readFileSync('dist/bundles/content.js', 'utf8'));
const A = w.AONC;
const tick = (ms = 60) => new Promise((r) => setTimeout(r, ms));
await tick(120);

check('рантайм: свой ник определён', A.content.tweaks.chat.detectOwn() === 'me');

const cfg = A.content.config.current();
cfg.chat.highlightOwn = true;
cfg.chat.mentionHighlight = true;
A.content.config.set(cfg);
A.content.tweaks.chat.apply(A.content.config.current());
await tick(100);

const row1 = w.document.querySelector('[data-msg-id="m1"]');
const row2 = w.document.querySelector('[data-msg-id="m2"]');
check('своё сообщение помечено', row1.classList.contains('aonc-own'));
check('упоминание помечено', row2.classList.contains('aonc-mention'));
check('чужое без own-метки', !row2.classList.contains('aonc-own'));

const cfg2 = A.content.config.current();
cfg2.chat.highlightOwn = false;
cfg2.chat.mentionHighlight = false;
A.content.config.set(cfg2);
A.content.tweaks.chat.apply(A.content.config.current());
await tick(80);
check('метки снимаются при выключении', !row1.classList.contains('aonc-own') && !row2.classList.contains('aonc-mention'));

const cfg3 = A.content.config.current();
cfg3.identity = { name: 'Катюша-тян', color: '#22D3EE', gradient: true, bold: true, inChat: true, inHeader: true, inProfile: true };
A.content.config.set(cfg3);
A.content.tweaks.identity.apply(A.content.config.current());
await tick(100);
const ownLink = row1.querySelector('div.min-w-0 a[href="/user/me"]');
const otherLink = row2.querySelector('div.min-w-0 a[href="/user/other"]');
check('ник заменён на кастомный', ownLink.textContent === 'Катюша-тян');
check('градиент и жирность применены', ownLink.style.backgroundImage.indexOf('linear-gradient') === 0 && ownLink.style.fontWeight === '700');
check('чужой ник не тронут', otherLink.textContent === 'Другой');

A.content.config.set(Object.assign(A.content.config.current(), { identity: { name: '', color: '', gradient: true, bold: true, inChat: true, inHeader: true, inProfile: true } }));
A.content.tweaks.identity.apply(A.content.config.current());
await tick(80);
check('ник восстановлен при сбросе', ownLink.textContent === 'Я');

const cfg4 = A.content.config.current();
cfg4.identity = { name: '', prefix: '★ ', suffix: ' ✦', color: '#FABD2F', gradient: false, bold: false, inChat: true, inHeader: true, inProfile: true };
A.content.config.set(cfg4);
A.content.tweaks.identity.apply(A.content.config.current());
await tick(100);
check('префикс и суффикс вокруг оригинала', ownLink.textContent === '★ Я ✦');
check('чужой ник без префиксов', otherLink.textContent === 'Другой');

A.content.tweaks.identity.reset();
await tick(60);
check('префиксы снимаются при сбросе', ownLink.textContent === 'Я');

// SPA-смена аккаунта: кэш своего ника должен сбрасываться (forgetOwn),
// иначе подсветка чата и подстановка ника украшают чужие строки до F5.
const headerLink = w.document.querySelector('header a[href^="/user/"]');
headerLink.setAttribute('href', '/user/me2');
check('свой ник кэшируется (до сброса)', A.content.tweaks.chat.detectOwn() === 'me');
A.content.tweaks.chat.forgetOwn();
check('forgetOwn: чат заново определил ник', A.content.tweaks.chat.detectOwn() === 'me2');
A.content.tweaks.identity.forgetOwn();
check('forgetOwn: identity подхватил новый ник', A.content.tweaks.identity.ownName() === 'me2');
headerLink.setAttribute('href', '/user/me');
A.content.tweaks.chat.forgetOwn();
A.content.tweaks.identity.forgetOwn();
check('после возврата ссылки ник снова свой', A.content.tweaks.chat.detectOwn() === 'me' && A.content.tweaks.identity.ownName() === 'me');

w.close();

const raceHtml = `<!doctype html><html><body>
<header></header>
<main><div id="chat">
  <div data-msg-id="r1">
    <a class="avatar-link" href="/user/stranger"><img src="s.png" alt=""></a>
    <a href="/user/stranger">Чужой</a>
  </div>
  <div data-msg-id="r2">
    <a class="avatar-link" href="/user/%D0%9C%D0%B5"><img src="m.png" alt=""></a>
    <a href="/user/%D0%9C%D0%B5">Ме</a>
  </div>
  <div data-msg-id="r3">
    <a href="https://animeon.cc/user/ме">Абсолютный</a>
  </div>
</div></main>
</body></html>`;

const dom2 = new JSDOM(raceHtml, { url: 'https://animeon.cc/anime/x', pretendToBeVisual: true, runScripts: 'outside-only' });
const w2 = dom2.window;
w2.document.elementFromPoint = () => w2.document.body;
w2.eval(readFileSync('dist/bundles/shared.js', 'utf8'));
w2.eval(readFileSync('dist/bundles/content.js', 'utf8'));
const A2 = w2.AONC;
await tick(120);

check('шапка ещё не готова: свой ник не определён и чужой аватар не подменяет его', A2.content.tweaks.chat.detectOwn() === '');

const cfgR = A2.content.config.current();
cfgR.identity = { name: 'Катюша-тян', color: '#22D3EE', gradient: false, bold: true, inChat: true, inHeader: true, inProfile: false };
A2.content.config.set(cfgR);
A2.content.tweaks.identity.apply(A2.content.config.current());
await tick(500);
check('ник неизвестен — подстановок нет, чужие строки не украшены', w2.document.querySelectorAll('[data-aonc-nick]').length === 0);

const hl = w2.document.createElement('a');
hl.setAttribute('href', '/user/ме');
hl.textContent = 'avatar';
w2.document.querySelector('header').appendChild(hl);
A2.content.tweaks.chat.forgetOwn();
A2.content.tweaks.identity.forgetOwn();
await tick(700);

const r1name = w2.document.querySelector('[data-msg-id="r1"] a:not([class])');
const r2name = w2.document.querySelector('[data-msg-id="r2"] a:not([class])');
const r3name = w2.document.querySelector('[data-msg-id="r3"] a');
check('шапка появилась: процентно-закодированный href сматчился (декод + регистр)', !!r2name && r2name.textContent === 'Катюша-тян');
check('абсолютный href в чате тоже матчится', !!r3name && r3name.textContent === 'Катюша-тян');
check('чужой ник не тронут', !!r1name && r1name.textContent === 'Чужой');

const styleBefore = r2name.getAttribute('style');
for (let i = 0; i < 5; i++) A2.content.tweaks.identity.scan(A2.content.config.current());
check('повторные сканы не раздувают инлайн-стиль', r2name.getAttribute('style') === styleBefore && r2name.textContent === 'Катюша-тян');

r2name.textContent = 'Ме';
await tick(700);
check('после сброса текста React-ом ник подставляется снова', r2name.textContent === 'Катюша-тян');

A2.content.tweaks.identity.reset();
await tick(60);
check('reset возвращает исходный текст и пустой стиль', r2name.textContent === 'Ме' && !r2name.getAttribute('style') && !r2name.hasAttribute('data-aonc-nick'));
w2.close();

if (failures.length) {
  console.log('TEST CHAT FAIL:', failures.join(', '));
  process.exit(1);
}
console.log('TEST CHAT: OK');
process.exit(0);
