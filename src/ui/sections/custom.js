AONC.define('ui.sections.custom', function (A) {
  'use strict';

  return {
    id: 'custom',
    label: 'Свой код',
    icon: '{}',
    intro: 'CSS и JavaScript поверх всего остального. CSS выполняется последним, поэтому перебивает и сайт, и пресеты расширения. JS по умолчанию работает в изолированном мире контент-скрипта; переключатель ниже запускает его в контексте страницы — тогда доступны <code>window</code>, роутер Next.js и внутренние объекты сайта.',
    groups: [
      {
        title: 'CSS',
        controls: [
          {
            type: 'textarea',
            path: 'custom.css',
            label: 'Глобальный CSS',
            rows: 14,
            placeholder: 'header { border-bottom: 2px solid var(--primary) !important; }'
          },
          { type: 'snippetList', id: 'cssSnippets', kind: 'css' }
        ]
      },
      {
        title: 'JavaScript',
        controls: [
          { type: 'toggle', path: 'custom.jsPageContext', label: 'Выполнять в контексте страницы', hint: 'Нужно для доступа к window и внутренностям Next.js' },
          { type: 'toggle', path: 'custom.jsRunAtDocumentStart', label: 'Запускать до загрузки DOM' },
          {
            type: 'textarea',
            path: 'custom.js',
            label: 'Глобальный JS',
            rows: 12,
            placeholder: 'console.log("AnimeOn Studio", AONC);'
          },
          { type: 'snippetList', id: 'jsSnippets', kind: 'js' }
        ]
      },
      {
        title: 'Шрифты',
        controls: [
          {
            type: 'textarea',
            path: 'custom.fontsCss',
            label: '@font-face и @import',
            rows: 6,
            placeholder: "@import url('https://fonts.googleapis.com/css2?family=Unbounded&display=swap');"
          }
        ]
      },
      {
        title: 'Предпросмотр',
        controls: [
          { type: 'cssPreview', id: 'cssPreview' }
        ]
      }
    ]
  };
});
