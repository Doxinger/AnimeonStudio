AONC.define('config.features', function (A) {
  'use strict';

  var FEATURES = [
    { id: 'f-theme', path: 'theme.overrideTokens', section: 'theme', label: 'Своя палитра сайта', desc: 'Переопределяет дизайн-токены Tailwind/shadcn: фон, карточки, акцент, границы, радиусы.' },
    { id: 'f-autocontrast', path: 'theme.autoContrast', section: 'theme', label: 'Автоконтраст текста', desc: 'Подтягивает контраст до читаемого по WCAG (текст/фон/акцент).' },
    { id: 'f-transitions', path: 'theme.themeTransitions', section: 'theme', label: 'Плавная смена темы', desc: 'Кросс-фейд цветов ~0.4с при любом изменении настроек вместо скачка.' },
    { id: 'f-ambient', path: 'theme.ambientOn', section: 'theme', label: 'Амбиентный свет', desc: 'Мягкие цветные ореолы по углам экрана вместо плоского фона.' },
    { id: 'f-softshadows', path: 'theme.softShadows', section: 'theme', label: 'Мягкие тени', desc: 'Многослойные рассеянные тени с оттенком акцента вместо жёстких.' },
    { id: 'f-gradients', path: 'theme.recolorGradients', section: 'theme', label: 'Перекраска градиентов', desc: 'Логотип и градиентный текст сайта следуют вашему акценту.' },
    { id: 'f-wallpaper', path: 'wallpaper.enabled', section: 'theme', label: 'Фоновое изображение', desc: 'Пресет-узор, ссылка или свой файл на фон; затемнение и виньетка поверх.' },
    { id: 'f-parallax', path: 'wallpaper.parallax', section: 'theme', label: 'Параллакс фона', desc: 'Фон смещается медленнее страницы при прокрутке.' },
    { id: 'f-drift', path: 'wallpaper.drift', section: 'theme', label: 'Дрейф фона', desc: 'Медленная анимация фона даже без прокрутки.' },
    { id: 'f-font', path: 'typography.loadGoogleFont', section: 'typography', label: 'Шрифт с Google Fonts', desc: 'Подключает выбранную гарнитуру (Inter, Manrope, Unbounded и др.).' },
    { id: 'f-smoothing', path: 'typography.fontSmoothing', section: 'typography', label: 'Сглаживание шрифтов', desc: 'Antialiased + optimizeLegibility для чёткого текста.' },
    { id: 'f-glass', path: 'glass.enabled', section: 'glass', label: 'Управление стеклом шапки', desc: 'Размытие, прозрачность и оттенок через переменные --aon-glass-*.' },
    { id: 'f-headerhide', path: 'glass.headerHideOnScroll', section: 'glass', label: 'Шапка прячется при скролле', desc: 'Уезжает вверх при прокрутке вниз, возвращается при прокрутке вверх.' },
    { id: 'f-headercompact', path: 'glass.headerCompact', section: 'glass', label: 'Компактная шапка', desc: 'Меньше логотип и плотнее элементы шапки.' },
    { id: 'f-noblur', path: 'glass.killBackdropFilter', section: 'glass', label: 'Отключить backdrop-filter', desc: 'Заметно ускоряет прокрутку на слабых машинах.' },
    { id: 'f-clipavatars', path: 'layout.clipAvatars', section: 'layout', label: 'Обрезка квадрата аватарок', desc: 'Убирает выступающие углы квадратного кадра/рамки вокруг аватарки.' },
    { id: 'f-hideframes', path: 'layout.hideAvatarFrames', section: 'layout', label: 'Скрыть рамки аватарок', desc: 'Полностью убирает декоративные рамки из cosmetics/frames; свои рамки из «Косметики» не трогает.' },
    { id: 'f-listgrid', path: 'layout.listModeGrid', section: 'layout', label: 'Списки сеткой', desc: 'Горизонтальные ленты становятся адаптивной сеткой.' },
    { id: 'f-listrows', path: 'layout.listModeRows', section: 'layout', label: 'Списки строками', desc: 'Постер слева, название и мета справа — удобно читать.' },
    { id: 'f-promolast', path: 'layout.promoLast', section: 'layout', label: 'Промо в конец страницы', desc: 'Боевой пропуск, манга и Premium опускаются ниже контента.' },
    { id: 'f-ratingcolors', path: 'layout.ratingColors', section: 'layout', label: 'Цвета рейтингов', desc: 'Оценка красит звезду и число по градации от красного к зелёному.' },
    { id: 'f-pfcover', path: 'layout.pfHideCover', section: 'layout', label: 'Скрыть обложку профиля', desc: 'Убирает верхнюю обложку на страницах /user/…' },
    { id: 'f-pfaccent', path: 'layout.pfCoverAccent', section: 'layout', label: 'Обложка в цвет акцента', desc: 'Градиент обложки профиля выводится из вашей палитры.' },
    { id: 'f-theater', path: 'player.theaterMode', section: 'player', label: 'Театральный режим', desc: 'Плеер на всю ширину, шапка тускнеет. Alt+Shift+T.' },
    { id: 'f-cinema', path: 'player.cinemaLights', section: 'player', label: 'Киносвет', desc: 'Затемняет страницу вокруг видео во время воспроизведения. Alt+Shift+C.' },
    { id: 'f-wide', path: 'player.wideMode', section: 'player', label: 'Широкий плеер', desc: 'Контейнер плеера расширяется до 1800px.' },
    { id: 'f-autonext', path: 'player.autoplayNext', section: 'player', label: 'Автопереход к следующей серии', desc: 'После окончания серии сам открывает следующую.' },
    { id: 'f-remvolume', path: 'player.rememberVolume', section: 'player', label: 'Запоминать громкость', desc: 'Общая громкость для сайта и плеера Kodik.' },
    { id: 'f-remrate', path: 'player.rememberRate', section: 'player', label: 'Запоминать скорость', desc: 'Скорость воспроизведения сохраняется между сериями.' },
    { id: 'f-hotkeys', path: 'player.hotkeys', section: 'player', label: 'Горячие клавиши', desc: 'Alt+Shift+P/T/C/M/E/R/H и другие прямо на сайте.' },
    { id: 'f-battlepass', path: 'visibility.battlepass', section: 'visibility', label: 'Скрыть боевой пропуск', desc: 'Убирает секцию боевого пропуска с главной.' },
    { id: 'f-premium', path: 'visibility.premium', section: 'visibility', label: 'Скрыть Premium-блоки', desc: 'Убирает промо Premium и баннеры.' },
    { id: 'f-prembadges', path: 'visibility.premiumBadges', section: 'visibility', label: 'Скрыть Premium-бейджи', desc: 'Пилюля в шапке, короны и баннер «Premium активен».' },
    { id: 'f-manga', path: 'visibility.mangaTeaser', section: 'visibility', label: 'Скрыть тизер манги', desc: 'Докрывает клиентский баннер манги по тексту и селекторам.' },
    { id: 'f-hero', path: 'visibility.heroSlider', section: 'visibility', label: 'Скрыть hero-слайдер', desc: 'Убирает большой слайдер сверху (и его отрицательный отступ).' },
    { id: 'f-footer', path: 'visibility.footer', section: 'visibility', label: 'Скрыть футер', desc: 'Полностью убирает подвал сайта.' },
    { id: 'f-comments', path: 'visibility.comments', section: 'visibility', label: 'Скрыть комментарии', desc: 'Убирает блок комментариев под плеером.' },
    { id: 'f-softblock', path: 'privacy.softBlock', section: 'privacy', label: 'Мягкая блокировка трекеров', desc: 'Глушит Метрику и GA4 в контексте страницы без разрешений.' },
    { id: 'f-hardblock', path: 'privacy.hardBlock', section: 'privacy', label: 'Жёсткая блокировка трекеров', desc: 'Режет запросы счётчиков на уровне сети (declarativeNetRequest).' },
    { id: 'f-strip', path: 'privacy.stripUrlParams', section: 'privacy', label: 'Срезание UTM-меток', desc: 'Чистит utm_*, fbclid, gclid из адресов и ссылок.' },
    { id: 'f-offline-page', path: 'offline.autoPage', section: 'help', label: 'Плашка вместо ошибки сети', desc: 'Подменяет страницу ошибки браузера на свою: VPN, зеркала, статус доменов.' },
    { id: 'f-offline-banner', path: 'offline.siteBanner', section: 'help', label: 'Плашка на пустой странице', desc: 'Ловит заглушки провайдера и пустые ответы сайта прямо в контент-скрипте.' },
    { id: 'f-offline-probe', path: 'offline.probe', section: 'help', label: 'Проверка зеркал', desc: 'Опрос зеркал animeon.cc/v1/v2 и выбор живого для кнопки перехода.' },
    { id: 'f-perflite', path: 'performance.perfLite', section: 'performance', label: 'Режим производительности lite', desc: 'Принудительно включает встроенный облегчённый режим сайта.' },
    { id: 'f-nomotion', path: 'performance.killAnimations', section: 'performance', label: 'Остановить анимации', desc: 'Полностью выключает анимации сайта и фоновые эффекты.' },
    { id: 'f-posterq', path: 'performance.posterQualityOn', section: 'performance', label: 'Качество постеров с CDN', desc: 'Переписывает ioss(resize,quality) у постеров selcdn.net.' },
    { id: 'f-fab', path: 'meta.fabEnabled', section: 'profiles', label: 'Кнопка-хаб на сайте', desc: 'Плавающая шестерёнка с быстрым меню прямо на animeon.cc.' },
    { id: 'f-instant', path: 'meta.instantApply', section: 'profiles', label: 'Мгновенное применение', desc: 'Кэш CSS в localStorage сайта: тема видна до первой отрисовки.' },
    { id: 'f-badges', path: 'cosmetics.enabled', section: 'cosmetics', label: 'Свои бейджи профиля', desc: 'Визуально экипирует любые бейджи/звания, даже не открытые на сайте.' },
    { id: 'f-titles', path: 'cosmetics.titlesOn', section: 'cosmetics', label: 'Настоящие титулы сайта', desc: 'Титулы из каталога сайта в ряду бейджей профиля — с родными цветами, свечением и анимацией, включая невыданные.' },
    { id: 'f-showcase', path: 'cosmetics.showcaseOn', section: 'cosmetics', label: 'Витрина постеров в профиле', desc: 'Блок постеров на странице профиля как витрина в Steam: сетка любимых тайтлов с подписями и ссылками.' },
    { id: 'f-chatown', path: 'chat.highlightOwn', section: 'chat', label: 'Подсветка своих сообщений', desc: 'Свои строки чата получают цветную подложку и боковую полоску.' },
    { id: 'f-chatclean', path: 'chat.hideLevels', section: 'chat', label: 'Чистый чат', desc: 'Убирает уровни и бейджи из строк чата для читаемости.' },
    { id: 'f-nick', path: 'identity.name', section: 'chat', label: 'Кастомный ник', desc: 'Локально заменяет отображаемое имя на своё с цветом/градиентом.' },
    { id: 'f-colldel', path: 'layout.collectionsQuickDelete', section: 'layout', label: 'Удаление подборок с карточки', desc: 'Крестик на карточке своей подборки удаляет её в один клик, без открытия страницы.' }
  ];

  var ADAPTERS = {
    'theme.ambientOn': {
      get: function (c) { return (c.theme.ambient || 0) > 0; },
      set: function (c, v) { c.theme.ambient = v ? 55 : 0; }
    },
    'layout.listModeGrid': {
      get: function (c) { return c.layout.listMode === 'grid'; },
      set: function (c, v) { c.layout.listMode = v ? 'grid' : 'default'; }
    },
    'layout.listModeRows': {
      get: function (c) { return c.layout.listMode === 'rows'; },
      set: function (c, v) { c.layout.listMode = v ? 'rows' : 'default'; }
    },
    'performance.perfLite': {
      get: function (c) { return c.performance.perfMode === 'lite'; },
      set: function (c, v) { c.performance.perfMode = v ? 'lite' : 'default'; }
    },
    'performance.posterQualityOn': {
      get: function (c) { return (c.performance.posterQuality || 0) > 0; },
      set: function (c, v) { c.performance.posterQuality = v ? 90 : 0; }
    }
  };

  function pathGet(obj, path) {
    return String(path).split('.').reduce(function (n, k) { return n == null ? n : n[k]; }, obj);
  }

  function pathSet(obj, path, value) {
    var keys = String(path).split('.');
    var node = obj;
    for (var i = 0; i < keys.length - 1; i++) {
      if (node[keys[i]] == null || typeof node[keys[i]] !== 'object') node[keys[i]] = {};
      node = node[keys[i]];
    }
    node[keys[keys.length - 1]] = value;
    return obj;
  }

  function get(config, feature) {
    var adapter = ADAPTERS[feature.path];
    if (adapter) return !!adapter.get(config);
    return !!pathGet(config, feature.path);
  }

  function apply(config, feature, value) {
    var adapter = ADAPTERS[feature.path];
    if (adapter) {
      adapter.set(config, value);
      return config;
    }
    return pathSet(config, feature.path, !!value);
  }

  function byId(id) {
    for (var i = 0; i < FEATURES.length; i++) if (FEATURES[i].id === id) return FEATURES[i];
    return null;
  }

  function groupBySection() {
    var out = {};
    FEATURES.forEach(function (f) {
      (out[f.section] = out[f.section] || []).push(f);
    });
    return out;
  }

  return { FEATURES: FEATURES, ADAPTERS: ADAPTERS, get: get, apply: apply, byId: byId, groupBySection: groupBySection, pathGet: pathGet, pathSet: pathSet };
});
