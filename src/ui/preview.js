AONC.define('ui.preview', function (A) {
  'use strict';

  var MOCK_CSS = [
    '*{box-sizing:border-box}',
    'html,body{margin:0;padding:0}',
    'body{font-family:var(--font-sans,system-ui,sans-serif);background:#0a0a0a;color:#fff;min-height:100%}',
    '.wrap{display:flex;flex-direction:column;min-height:100vh}',
    'header.aon-glass{position:sticky;top:0;z-index:50;width:100%;border-bottom:1px solid rgba(255,255,255,.08)}',
    'header .container{max-width:1280px;margin:0 auto;padding:0 16px;height:64px;display:flex;align-items:center;gap:12px}',
    '.logo{display:flex;align-items:center;gap:10px;text-decoration:none;color:inherit}',
    '.logo-mark{width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,#7C4DFF,#FF4D9D);display:grid;place-items:center;font-weight:800;font-size:13px;color:#fff}',
    '.logo-text{font-size:21px;font-weight:800;font-family:var(--font-accent,var(--font-sans,sans-serif));',
    'background:linear-gradient(90deg,#fff,#c4b5fd,#e879f9);-webkit-background-clip:text;background-clip:text;color:transparent}',
    'nav.main{display:flex;gap:4px;margin-left:8px}',
    'nav.main a{display:flex;align-items:center;height:36px;padding:0 12px;border-radius:12px;color:#a1a1aa;',
    'text-decoration:none;font-size:13.5px;font-weight:500}',
    'nav.main a.on{color:#fff;background:rgba(255,255,255,.07)}',
    '.search{margin-left:auto;display:flex;align-items:center;gap:8px;height:36px;padding:0 12px;border-radius:12px;',
    'background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);color:#71717a;font-size:13px;min-width:150px}',
    '.btn-primary{height:36px;padding:0 14px;border-radius:12px;background:#7C4DFF;color:#fff;border:0;',
    'font-size:13px;font-weight:600}',
    'main{flex:1;padding-bottom:24px;background:#0A0A0B;position:relative}',
    '.container{max-width:1280px;margin:0 auto;padding:0 16px}',
    '.hero{position:relative;height:230px;border-radius:16px;overflow:hidden;margin:18px 0;',
    'background:linear-gradient(120deg,#1a1030 0%,#2a1450 45%,#0e0e14 100%);display:flex;align-items:flex-end;padding:20px}',
    '.hero .meta{display:flex;gap:8px;align-items:center;margin-bottom:8px}',
    '.pill{font-size:11px;padding:3px 9px;border-radius:99px;background:rgba(255,255,255,.10);color:#e4e4e7}',
    '.pill.rate{background:rgba(124,77,255,.22);color:#c4b5fd;font-weight:700}',
    '.hero h1{margin:0 0 6px;font-size:26px;font-weight:800;line-height:1.15}',
    '.hero p{margin:0;font-size:13px;color:#a1a1aa;max-width:60ch}',
    '.hero .actions{display:flex;gap:8px;margin-top:12px}',
    'section.row{margin:22px 0}',
    'section.row h2{font-size:18px;font-weight:700;margin:0 0 12px;display:flex;align-items:center;gap:10px}',
    'section.row h2 a{margin-left:auto;font-size:12px;color:#a78bfa;text-decoration:none;font-weight:500}',
    '.scroller{display:flex;gap:16px;overflow-x:auto;padding-bottom:10px}',
    '.cell{flex:0 0 auto;width:150px}',
    '.group\\/card{position:relative;width:100%}',
    '.group\\/card a{display:block;text-decoration:none;color:inherit}',
    '[class*="aspect-[2/3]"]{position:relative;aspect-ratio:2/3;width:100%;overflow:hidden;border-radius:12px;',
    'background:#1c1c22;box-shadow:0 4px 14px rgba(0,0,0,.4)}',
    '[class*="aspect-[2/3]"] .ph{position:absolute;inset:0;display:grid;place-items:center;font-size:30px;opacity:.5}',
    '.p1{background:linear-gradient(150deg,#3b1d5e,#0f1020)}',
    '.p2{background:linear-gradient(150deg,#123c4a,#0d1420)}',
    '.p3{background:linear-gradient(150deg,#5a2233,#160d14)}',
    '.p4{background:linear-gradient(150deg,#20412c,#0d1512)}',
    '.p5{background:linear-gradient(150deg,#4a3418,#14110c)}',
    '.p6{background:linear-gradient(150deg,#2b2f55,#10111c)}',
    '.ttl{margin:8px 0 3px;font-size:12.5px;font-weight:600;line-height:1.3;',
    'display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
    '.sub{font-size:11px;color:#71717a;display:flex;gap:6px;align-items:center}',
    '.rate{color:#a78bfa;font-weight:700}',
    '.badge{position:absolute;top:8px;left:8px;font-size:10px;padding:2px 7px;border-radius:99px;',
    'background:rgba(0,0,0,.65);backdrop-filter:blur(4px);color:#fff;z-index:2}',
    'footer.aon-isolated-layer{margin-top:32px;border-top:1px solid rgba(255,255,255,.05);',
    'background:rgba(255,255,255,.03);padding:22px 0;font-size:12px;color:#71717a}',
    'footer .cols{display:flex;gap:28px;flex-wrap:wrap}',
    'footer b{color:#d4d4d8;font-size:12px;display:block;margin-bottom:8px}',
    'footer a{display:block;color:#71717a;text-decoration:none;margin-bottom:5px}',
    '.promo{border:1px solid rgba(124,77,255,.28);background:linear-gradient(120deg,rgba(124,77,255,.16),rgba(0,0,0,0));',
    'border-radius:16px;padding:18px;display:flex;gap:14px;align-items:center;margin:20px 0}',
    '.promo .ic{width:42px;height:42px;border-radius:12px;background:#7C4DFF;display:grid;place-items:center;font-size:20px;flex:0 0 auto}',
    '.promo h3{margin:0 0 4px;font-size:15px}',
    '.promo p{margin:0;font-size:12px;color:#a1a1aa}',
    '.promo .btn-primary{margin-left:auto;flex:0 0 auto}'
  ].join('\n');

  function card(cls, emoji, title, year, kind, rating, votes, badge) {
    return [
      '<div class="cell"><div class="group/card"><a href="#">',
      '<div class="relative aspect-[2/3] w-full overflow-hidden rounded-xl ' + cls + '">',
      badge ? '<span class="badge">' + badge + '</span>' : '',
      '<div class="ph">' + emoji + '</div>',
      '</div></a>',
      '<div class="ttl">' + title + '</div>',
      '<div class="sub"><span class="rate">★ ' + rating + '</span><span>' + votes + '</span><span>' + year + '</span><span>' + kind + '</span></div>',
      '</div></div>'
    ].join('');
  }

  function mockBody() {
    return [
      '<div class="wrap">',
      '<header class="aon-glass aon-glass-header aon-isolated-layer">',
      '<div class="container">',
      '<a class="logo" href="#"><span class="logo-mark">A</span><span class="logo-text">AnimeOn</span></a>',
      '<nav class="main" aria-label="Основная навигация">',
      '<a href="#" class="on">Каталог</a><a href="#">Онгоинги</a><a href="#">Расписание</a><a href="#">Случайное</a>',
      '</nav>',
      '<div class="search">🔍 Поиск аниме…</div>',
      '<button class="btn-primary">Войти</button>',
      '</div></header>',

      '<main>',
      '<div class="container">',

      '<section class="hero-block"><div class="hero"><div>',
      '<div class="meta"><span class="pill rate">★ 9.1</span><span class="pill">ТВ Сериал</span><span class="pill">2026</span><span class="pill">Исэкай</span></div>',
      '<h1>Реинкарнация безработного: История о приключениях в другом мире 3</h1>',
      '<p>Продолжение истории Рудеуса Грейрата — вызовы отцовства, семьи и глобальных политических интриг в мире магии.</p>',
      '<div class="actions"><button class="btn-primary">▶ Смотреть</button><button class="btn-primary" style="background:rgba(255,255,255,.10)">Подробнее</button></div>',
      '</div></div></section>',

      '<section class="row"><h2>Онгоинги<a href="#">Смотреть все →</a></h2><div class="scroller">',
      card('p1', '⚔', 'Невероятное приключение ДжоДжо: Гонка «Стальной шар»', '2026', 'ONA', '9.1', '732', '12 эп.'),
      card('p2', '🌊', 'История о перекуре за супермаркетом', '2026', 'ТВ', '8.3', '5 627', ''),
      card('p3', '🔥', 'Блич: Тысячелетняя кровавая война — Бедствие', '2026', 'ТВ', '9.1', '1 141', 'ONGOING'),
      card('p4', '🐉', 'О моём перерождении в слизь 4', '2026', 'ТВ', '8.2', '618', ''),
      card('p5', '🍜', 'Табакошка', '2026', 'ТВ', '7.1', '520', '3 эп.'),
      card('p6', '🌙', 'Цугаи загробного мира', '2026', 'ТВ', '7.8', '498', ''),
      '</div></section>',

      '<div class="promo"><div class="ic">🎫</div><div>',
      '<h3>Боевой пропуск — сезон 0</h3><p>100 уровней, 55 предметов, титулы и рамки. Мифик на сотом уровне.</p>',
      '</div><button class="btn-primary">Открыть пропуск</button></div>',

      '<section class="row"><h2>Рекомендации для вас<a href="#">Ещё →</a></h2><div class="scroller">',
      card('p3', '🗡', 'Изгнанный реинкарнированный тяжёлый рыцарь', '2026', 'ТВ', '6.7', '977', ''),
      card('p1', '📖', 'Власть книжного червя: Приёмная дочь лорда', '2026', 'ТВ', '7.8', '886', ''),
      card('p5', '🎭', 'Игра лжецов', '2026', 'ТВ', '6.4', '772', ''),
      card('p2', '🌸', 'Ты и я — полные противоположности 2', '2026', 'ТВ', '8.5', '694', '1 эп.'),
      card('p6', '🎮', 'Мир отомэ-игр — это тяжёлый мир для мобов 2', '2026', 'ТВ', '6.7', '732', ''),
      card('p4', '⚡', 'Адский режим: геймер-спидраннер 2', '2026', 'ТВ', '7.2', '696', ''),
      '</div></section>',

      '<section class="row"><h2>Новости<a href="#">Все новости →</a></h2><div class="scroller">',
      card('p2', '📰', 'Анонс второго сезона «Цугаи загробного мира»', '2026', 'Новость', '', '', ''),
      card('p4', '📰', 'Шестой эпизод «Табакошки» вышел раньше срока', '2026', 'Новость', '', '', ''),
      card('p1', '📰', 'Премиум-манга: собрано 654 места из 2 000', '2026', 'Новость', '', '', ''),
      '</div></section>',

      '</div></main>',

      '<footer class="aon-isolated-layer"><div class="container"><div class="cols">',
      '<div><b>AnimeOn</b><a href="#">О проекте</a><a href="#">Roadmap</a><a href="#">Premium</a></div>',
      '<div><b>Разделы</b><a href="#">Каталог</a><a href="#">Расписание</a><a href="#">Подборки</a></div>',
      '<div><b>Правовое</b><a href="#">Условия</a><a href="#">Конфиденциальность</a><a href="#">Правообладателям</a></div>',
      '<div><b>Мы в сети</b><a href="#">Telegram</a><a href="#">Discord</a><a href="#">ВКонтакте</a></div>',
      '</div></div></footer>',
      '</div>'
    ].join('\n');
  }

  function srcdoc(css, scale) {
    var zoom = scale ? ('html{zoom:' + (A.lang.clamp(scale, 30, 150) / 100) + '}') : '';
    return [
      '<!doctype html><html class="dark" lang="ru"><head><meta charset="utf-8">',
      '<style>' + MOCK_CSS + '</style>',
      '<style>' + zoom + '</style>',
      '<style>' + String(css || '').replace(/<\/style/gi, '<\\/style') + '</style>',
      '</head><body>',
      mockBody(),
      '</body></html>'
    ].join('\n');
  }

  return { srcdoc: srcdoc, mockBody: mockBody, MOCK_CSS: MOCK_CSS };
});
