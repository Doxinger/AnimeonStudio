AONC.define('ui.sections.elements', function (A) {
  'use strict';

  return {
    id: 'elements',
    label: 'Элементы',
    icon: '✥',
    intro: 'Любой узел страницы можно скрыть или переоформить. Нажмите «Пипетка», кликните по элементу на сайте — появится панель с живым предпросмотром. Правила сохраняются и применяются автоматически, в том числе после SPA-переходов.',
    groups: [
      {
        title: 'Инструменты',
        controls: [
          { type: 'button', label: '⬚ Включить пипетку', variant: 'primary', actionId: 'picker-start' },
          { type: 'button', label: 'Остановить пипетку', variant: 'ghost', actionId: 'picker-stop' },
          { type: 'button', label: '＋ Правило вручную', actionId: 'rule-add' },
          { type: 'info', tone: 'muted', text: 'Горячие клавиши на странице: <span class="kbd">Alt+Shift+P</span> пипетка, <span class="kbd">H</span> при наведении — мгновенно скрыть элемент.' }
        ]
      },
      {
        title: 'Сохранённые правила',
        controls: [{ type: 'ruleList', id: 'ruleList' }]
      }
    ]
  };
});
