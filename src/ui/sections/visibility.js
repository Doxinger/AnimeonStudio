AONC.define('ui.sections.visibility', function (A) {
  'use strict';

  var VIS = A.config.selectors.visibility;

  var ORDER = [
    'battlepass', 'premium', 'roadmap', 'mangaTeaser',
    'heroSlider', 'news', 'schedule', 'collections', 'randomButton',
    'header', 'headerSearch', 'mobileMenuButton', 'mobileBottomNav',
    'footer', 'footerLinks', 'socialLinks',
    'comments', 'recommendations', 'similarAnime',
    'ratings', 'badges', 'shareButtons',
    'cookieBanner', 'popups', 'tooltips', 'skeletons', 'scrollbars', 'ads'
  ];

  var GROUPS = {
    'Промо-блоки': ['battlepass', 'premium', 'premiumBadges', 'roadmap', 'mangaTeaser'],
    'Разделы главной': ['heroSlider', 'news', 'schedule', 'collections', 'randomButton'],
    'Каркас страницы': ['header', 'headerSearch', 'mobileMenuButton', 'mobileBottomNav', 'footer', 'footerLinks', 'socialLinks'],
    'Контент тайтла': ['comments', 'recommendations', 'similarAnime', 'ratings', 'badges', 'shareButtons'],
    'Мелочи': ['cookieBanner', 'popups', 'tooltips', 'skeletons', 'scrollbars', 'ads']
  };

  function controlFor(key) {
    var def = VIS[key];
    return {
      type: 'toggle',
      path: 'visibility.' + key,
      label: def.label,
      hint: def.selectors[0]
    };
  }

  function groups() {
    return Object.keys(GROUPS).map(function (title) {
      return {
        title: title,
        controls: GROUPS[title].filter(function (k) { return VIS[k]; }).map(controlFor)
      };
    });
  }

  function allKeys() {
    return ORDER.filter(function (k) { return VIS[k]; });
  }

  return {
    id: 'visibility',
    label: 'Скрыть блоки',
    icon: '◌',
    intro: 'Готовые переключатели для известных разделов сайта. Селекторы строятся от семантических якорей — landmark-тегов, <code>aria-label</code> и ссылок, а не от Tailwind-классов, которые меняются при каждом деплое.',
    groups: [
      {
        title: 'Массовые действия',
        controls: [
          { type: 'button', label: 'Скрыть всё промо', actionId: 'vis-hide-promo' },
          { type: 'button', label: 'Показать всё', variant: 'ghost', actionId: 'vis-show-all' },
          { type: 'info', tone: 'muted', text: 'Если нужного блока нет в списке — возьмите его пипеткой (Alt+Shift+P) во вкладке «Элементы».' }
        ]
      }
    ].concat(groups()),
    allKeys: allKeys
  };
});
