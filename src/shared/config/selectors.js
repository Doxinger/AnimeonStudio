AONC.define('config.selectors', function () {
  'use strict';

  var structure = {
    html: 'html',
    body: 'body',
    header: ['header.aon-glass-header', 'header.aon-glass', 'body > div > header', 'header'],
    headerInner: ['header .container', 'header > div'],
    nav: ['nav[aria-label="Основная навигация"]', 'header nav'],
    logo: ['header a[href="/"]', 'a[href="/"] span'],
    logoText: ['header a[href="/"] span'],
    logoImage: ['header a[href="/"] img'],
    main: ['main'],
    mainWrap: ['body > div.flex'],
    footer: ['footer.aon-isolated-layer', 'footer'],
    hero: ['section .hero-slider-height', '.hero-slider-height', 'main section:first-of-type'],
    heroSection: ['main > section:first-of-type'],
    container: ['.container.mx-auto'],
    rows: ['main section'],
    rowScroller: ['div.overflow-x-auto'],
    posterCards: ['.group\\/card', '[class*="aspect-[2/3]"]'],
    posterFrame: ['[class*="aspect-[2/3]"]'],
    posterImage: ['[class*="aspect-[2/3]"] img'],
    cardTitle: ['.group\\/card ~ * , .group\\/card a + div'],
    sidebar: ['aside'],
    search: ['header input[type="search"]', 'header [role="combobox"]', 'header form'],
    mobileMenuButton: ['header button[aria-label="Открыть меню"]', 'header button.md\\:hidden'],
    dialogs: ['[role="dialog"]', '[data-radix-popper-content-wrapper]'],
    toasts: ['[data-sonner-toaster]', '[role="status"]'],
    videoHost: ['video'],
    iframeHost: ['iframe'],
    skeletons: ['[class*="animate-pulse"]', '[class*="skeleton"]']
  };

  var visibility = {
    battlepass: {
      label: 'Боевой пропуск',
      scope: 'section',
      runtime: true,
      selectors: ['section:has(a[href*="battlepass"])', 'a[href*="battlepass"]']
    },
    premium: {
      label: 'Premium-блоки',
      scope: 'section',
      runtime: true,
      selectors: ['section:has(a[href*="premium"])', 'a[href*="premium"]']
    },
    roadmap: {
      label: 'Roadmap',
      scope: 'section',
      selectors: ['section:has(a[href="/roadmap"])', 'a[href="/roadmap"]']
    },
    mangaTeaser: {
      label: 'Тизер манги',
      scope: 'section',
      runtime: true,
      selectors: [
        'section:has(a[href*="offer"])',
        'section:has(a[href*="/offer"])',
        '[class*="rounded-3xl"]:has(a[href*="offer"])',
        '[class*="rounded-2xl"]:has(a[href*="offer"]):not(:has(nav))'
      ],
      text: ['Манга начнётся', 'Путь к манге', 'именной бейдж', 'Собрано мест']
    },
    heroSlider: {
      label: 'Hero-слайдер',
      scope: 'self',
      runtime: true,
      extraCss: { 'margin-top': '0', 'min-height': '0', 'height': '0', 'padding-top': '0' },
      selectors: [
        'section:has(.hero-slider-height)',
        'section:has(> div.hero-slider-height)',
        '.hero-slider-height'
      ]
    },
    news: {
      label: 'Новости',
      scope: 'section',
      selectors: ['section:has(a[href="/news"])', 'a[href="/news"]']
    },
    schedule: {
      label: 'Расписание',
      scope: 'section',
      selectors: ['section:has(a[href="/schedule"])', 'a[href="/schedule"]']
    },
    collections: {
      label: 'Подборки',
      scope: 'section',
      selectors: ['section:has(a[href="/collections"])', 'a[href="/collections"]']
    },
    randomButton: {
      label: 'Кнопка «Случайное»',
      scope: 'self',
      selectors: ['a[href="/random"]', 'header a[href="/random"]']
    },
    footer: { label: 'Футер целиком', scope: 'self', selectors: ['footer'] },
    footerLinks: { label: 'Ссылки футера', scope: 'self', selectors: ['footer nav', 'footer ul'] },
    header: { label: 'Шапка', scope: 'self', selectors: ['header'] },
    headerSearch: { label: 'Поиск в шапке', scope: 'self', selectors: ['header input[type="search"]', 'header [role="combobox"]', 'header form'] },
    mobileMenuButton: { label: 'Кнопка меню (моб.)', scope: 'self', selectors: ['header button[aria-label="Открыть меню"]'] },
    comments: { label: 'Комментарии', scope: 'section', selectors: ['section:has(#comments)', '[id*="comment"]', '[class*="comment"]'] },
    recommendations: { label: 'Рекомендации', scope: 'section', selectors: ['section:has(a[href^="/catalog"])', '[class*="recommend"]'] },
    similarAnime: { label: 'Похожие аниме', scope: 'section', selectors: ['section:has(h2)', '[class*="similar"]'] },
    ratings: { label: 'Рейтинги и оценки', scope: 'self', selectors: ['[class*="rating"]', '[aria-label*="оценка"]'] },
    badges: { label: 'Бейджи и плашки', scope: 'self', selectors: ['[class*="badge"]', 'sup'] },
    shareButtons: { label: 'Кнопки «Поделиться»', scope: 'self', selectors: ['[aria-label*="Поделиться"]', '[class*="share"]'] },
    socialLinks: { label: 'Соцсети', scope: 'self', selectors: ['footer a[target="_blank"]', 'a[href*="t.me"]', 'a[href*="discord"]', 'a[href*="vk.com"]'] },
    cookieBanner: { label: 'Cookie-баннер', scope: 'self', selectors: ['[class*="cookie"]', '[id*="cookie"]'] },
    popups: { label: 'Всплывающие окна', scope: 'self', selectors: ['[role="dialog"][data-state="open"]'] },
    tooltips: { label: 'Тултипы', scope: 'self', selectors: ['[role="tooltip"]', '[data-radix-popper-content-wrapper]'] },
    scrollbars: { label: 'Полосы прокрутки', scope: 'self', selectors: ['::-webkit-scrollbar'] },
    mobileBottomNav: { label: 'Нижнее меню (моб.)', scope: 'self', selectors: ['nav[class*="fixed"][class*="bottom"]'] },
    skeletons: { label: 'Скелетоны загрузки', scope: 'self', selectors: ['[class*="animate-pulse"]'] },
    ads: { label: 'Рекламные блоки', scope: 'self', selectors: ['[id*="ad-"]', '[class*="advert"]', 'ins.adsbygoogle', '[id*="yandex_rtb"]'] },
    premiumBadges: {
      label: 'Premium-бейджи и пилюли',
      scope: 'self',
      runtime: true,
      selectors: [
        'header a[href*="premium"]',
        'section:has(a[href*="premium"])',
        'svg[class*="lucide-crown"]',
        '[class*="group/badge"]:has(svg[class*="lucide-crown"])'
      ],
      text: ['Premium активен']
    }
  };

  var trackers = {
    yandex: ['*://mc.yandex.ru/*', '*://mc.yandex.com/*', '*://an.yandex.ru/*', '*://yastatic.net/*', '*://ads.adfox.ru/*'],
    google: ['*://www.googletagmanager.com/*', '*://www.google-analytics.com/*', '*://analytics.google.com/*', '*://stats.g.doubleclick.net/*', '*://www.google.com/pagead/*', '*://googleads.g.doubleclick.net/*'],
    adNetworks: ['*://*.adriver.ru/*', '*://*.betweendigital.com/*', '*://*.adhigh.net/*']
  };

  var player = {
    kodikHosts: ['kodikplayer.com', 'kodik.info', 'kodikapi.com', 'kodik.biz', 'kodik.cc'],
    container: ['[class*="aspect-video"]', '[data-player]', 'iframe[src*="kodik"]', 'iframe[src*="player"]'],
    iframe: ['iframe[src*="kodik"]', 'iframe[src*="player"]'],
    video: ['video'],
    episodeButtons: ['button[aria-label*="эпизод"]', '[class*="episode"] button'],
    nextEpisode: ['button[aria-label*="Следующ"]', '[class*="next"]']
  };

  var site = {
    themeStorageKey: 'theme',
    forcedTheme: 'dark',
    darkClass: 'dark',
    lightClass: 'light',
    perfStorageKey: 'aon-perf-mode',
    perfClass: 'aon-perf-lite',
    perfValues: ['lite', 'full'],
    posterCdn: 'selcdn.net',
    posterTransformPattern: /ioss\(resize=(\d+),quality=(\d+)\)/,
    brandAccent: '#7C4DFF',
    brandBackground: '#0A0A0B',
    glassVars: ['--aon-glass-tint', '--aon-glass-alpha', '--aon-glass-filter', '--aon-glass-fallback', '--aon-glass-alpha-flat', '--aon-glass-fallback-flat']
  };

  return {
    structure: structure,
    visibility: visibility,
    trackers: trackers,
    player: player,
    site: site
  };
});
