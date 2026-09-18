AONC.define('ui.sections.help', function (A) {
  'use strict';

  var KEYS = [
    ['Alt+Shift+P', 'Пипетка элементов'],
    ['Alt+Shift+T', 'Театральный режим'],
    ['Alt+Shift+C', 'Киносвет'],
    ['Alt+Shift+M', 'Плеер на весь экран окна'],
    ['Alt+Shift+E', 'Включить / выключить расширение'],
    ['Alt+Shift+R', 'Пересобрать стили и перезагрузить'],
    ['Alt+Shift+H', 'Скрыть / показать шапку'],
    ['Alt+Shift+Home', 'В начало страницы'],
    ['H (в пипетке)', 'Мгновенно скрыть элемент под курсором'],
    ['Esc (в пипетке)', 'Выйти из пипетки']
  ];

  var FACTS = [
    ['Стек сайта', 'Next.js App Router + React, Tailwind CSS v4, токены shadcn/ui в oklch'],
    ['Тема сайта', 'Принудительно тёмная через next-themes (forcedTheme = dark)'],
    ['Плеер', 'iframe Kodik (kodikplayer.com)'],
    ['Постеры', 'CDN selcdn.net с трансформацией ioss(resize=…,quality=…)'],
    ['Стекло шапки', 'Классы aon-glass / aon-glass-header и переменные --aon-glass-*'],
    ['Режим производительности', 'localStorage["aon-perf-mode"] = lite | full, класс aon-perf-lite'],
    ['Счётчики', 'Яндекс.Метрика 98272913 и GA4']
  ];

  function keyRows() {
    return KEYS.map(function (k) {
      return '<tr><td><span class="kbd">' + A.lang.escapeHtml(k[0]) + '</span></td><td>' + A.lang.escapeHtml(k[1]) + '</td></tr>';
    }).join('');
  }

  function factRows() {
    return FACTS.map(function (f) {
      return '<tr><td>' + A.lang.escapeHtml(f[0]) + '</td><td>' + A.lang.escapeHtml(f[1]) + '</td></tr>';
    }).join('');
  }


  return {
    id: 'help',
    label: 'Справка',
    icon: '?',
    intro: 'Расширение собрано под конкретную разметку animeon.cc: селекторы опираются на landmark-теги, aria-label и собственные классы сайта, а цвета — на CSS-переменные темы. Поэтому обновления вёрстки ломают минимум настроек.',
    groups: [
      {
        title: 'История студии',
        controls: [
          { type: 'historyList', id: 'historyList' }
        ]
      },
      {
        title: 'Доступность и зеркала',
        controls: [
          { type: 'toggle', path: 'offline.autoPage', label: 'Плашка вместо ошибки браузера', hint: 'Если сайт не открылся (DNS, блокировка, таймаут), вкладка покажет страницу расширения с советом и зеркалами' },
          { type: 'toggle', path: 'offline.siteBanner', label: 'Плашка внутри страницы', hint: 'Если сайт загрузился пустым или заглушкой провайдера — предложим включить VPN или перейти на зеркало' },
          { type: 'toggle', path: 'offline.probe', label: 'Проверка зеркал', hint: 'Опрашиваем зеркала и предлагаем то, которое реально отвечает' },
          { type: 'mirrorStatus', id: 'mirrorStatus' }
        ]
      },
      {
        title: 'Горячие клавиши',
        controls: [
          { type: 'info', tone: 'plain', html: '<table class="facts">' + keyRows() + '</table>' },
          { type: 'info', tone: 'muted', text: 'Клавиши обрабатываются на самой странице, поэтому работают независимо от фокуса браузерного интерфейса. Если комбинация конфликтует с другой — отключите «Горячие клавиши» в разделе «Плеер».' }
        ]
      },
      {
        title: 'Что известно о сайте',
        controls: [
          { type: 'info', tone: 'plain', html: '<table class="facts">' + factRows() + '</table>' }
        ]
      },
      {
        title: 'Как это работает',
        controls: [
          { type: 'info', tone: 'plain', html: [
            '<ol class="steps">',
            '<li>Конфигурация лежит в <code>storage.local</code> и шарится между popup, студией и всеми вкладками.</li>',
            '<li>Модуль <code>cssBuilder</code> превращает конфигурацию в один текст CSS из независимых частей: токены, типографика, плотность, стекло, сетка, плеер, скрытие, ваши правила.</li>',
            '<li>Контент-скрипт стартует на <code>document_start</code>, сначала красит страницу из синхронного кэша в <code>localStorage</code>, потом перечитывает хранилище и обновляет стиль.</li>',
            '<li>Класс темы удерживается MutationObserver-ом, потому что next-themes принудительно выставляет <code>dark</code> при каждой загрузке.</li>',
            '<li>SPA-переходы ловит опрос <code>location</code> — пер-URL правила пересобираются без перезагрузки.</li>',
            '</ol>'
          ].join('') }
        ]
      },
      {
        title: 'Ограничения',
        controls: [
          { type: 'info', tone: 'warn', html: [
            '<ul class="steps">',
            '<li>Светлый режим экспериментальный: часть блоков сайта покрашена жёстко в тёмные цвета, поэтому правки применяются через переопределение утилит.</li>',
            '<li>Внутренность плеера Kodik — это другой домен. Она настраивается отдельным контент-скриптом, которому нужен доступ к <code>kodikplayer.com</code>.</li>',
            '<li>Жёсткая блокировка счётчиков требует разрешения на домены аналитики; до его выдачи работает только мягкая блокировка.</li>',
            '</ul>'
          ].join('') }
        ]
      }
    ]
  };
});
