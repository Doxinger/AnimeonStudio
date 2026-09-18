AONC.define('ui.sections.typography', function (A) {
  'use strict';

  var fonts = A.config.fonts;

  function stackOptions() {
    return fonts.STACKS.map(function (f) { return { value: f.value, label: f.name }; });
  }

  function googleOptions() {
    return [{ value: '', label: 'Не подключать' }].concat(
      fonts.GOOGLE_FONTS.map(function (f) { return { value: f, label: f }; })
    );
  }

  return {
    id: 'typography',
    label: 'Шрифты и текст',
    icon: 'Aa',
    intro: 'Два независимых масштаба: «Масштаб интерфейса» меняет корневой font-size и растягивает всю вёрстку, «Кегль текста» меняет только шкалу размеров Tailwind, не трогая отступы.',
    groups: [
      {
        title: 'Гарнитура',
        controls: [
          { type: 'select', path: 'typography.fontFamily', label: 'Основной шрифт', options: stackOptions() },
          { type: 'select', path: 'typography.fontAccent', label: 'Акцентный шрифт (заголовки, логотип)', options: stackOptions() },
          {
            type: 'toggle',
            path: 'typography.loadGoogleFont',
            label: 'Загрузить шрифт с Google Fonts',
            hint: 'Добавляет @import в стили страницы'
          },
          {
            type: 'select',
            path: 'typography.googleFont',
            label: 'Шрифт Google',
            options: googleOptions(),
            dependsOn: 'typography.loadGoogleFont=true'
          }
        ]
      },
      {
        title: 'Размеры',
        controls: [
          { type: 'slider', path: 'typography.uiScale', label: 'Масштаб интерфейса', min: 60, max: 180, step: 1, format: 'percent', reset: 100 },
          { type: 'slider', path: 'typography.textScale', label: 'Кегль текста', min: 60, max: 220, step: 1, format: 'percent', reset: 100 },
          { type: 'slider', path: 'typography.headingScale', label: 'Размер заголовков', min: 60, max: 200, step: 1, format: 'percent', reset: 100 },
          { type: 'slider', path: 'typography.letterSpacing', label: 'Межбуквенный интервал', min: -2, max: 6, step: 0.1, suffix: 'px', reset: 0 },
          { type: 'slider', path: 'typography.lineHeight', label: 'Межстрочный интервал', min: 0, max: 2.4, step: 0.05, reset: 0, hint: '0 = как на сайте' },
          {
            type: 'select',
            path: 'typography.headingWeight',
            label: 'Жирность заголовков',
            options: [
              { value: 0, label: 'Как на сайте' },
              { value: 400, label: '400 Normal' },
              { value: 500, label: '500 Medium' },
              { value: 600, label: '600 Semibold' },
              { value: 700, label: '700 Bold' },
              { value: 800, label: '800 Extrabold' },
              { value: 900, label: '900 Black' }
            ]
          },
          {
            type: 'select',
            path: 'typography.headingTransform',
            label: 'Регистр заголовков',
            options: [
              { value: 'none', label: 'Без изменений' },
              { value: 'uppercase', label: 'ВЕРХНИЙ' },
              { value: 'lowercase', label: 'нижний' },
              { value: 'capitalize', label: 'Каждое Слово' }
            ]
          },
          { type: 'slider', path: 'typography.headingLetterSpacing', label: 'Интервал заголовков', min: -3, max: 12, step: 0.1, suffix: 'px', reset: 0 },
          { type: 'toggle', path: 'typography.uppercaseTitles', label: 'Капс для всех заголовков и логотипа' },
          { type: 'toggle', path: 'typography.fontSmoothing', label: 'Сглаживание шрифтов' }
        ]
      }
    ]
  };
});
