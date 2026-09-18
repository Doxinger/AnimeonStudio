AONC.define('ui.sections.chat', function (A) {
  'use strict';

  return {
    id: 'chat',
    label: 'Чат',
    icon: '💬',
    intro: 'Кастомизация чата на страницах с плеером и в клубных чатах: размеры, пузыри, скрытие декора и подсветка своих сообщений и упоминаний. Селекторы опираются на устойчивые маркеры строк сообщений.',
    groups: [
      {
        title: 'Геометрия и текст',
        controls: [
          { type: 'slider', path: 'chat.fontSize', label: 'Кегль текста сообщений', min: 0, max: 24, step: 0.5, suffix: 'px', reset: 0, hint: '0 = как на сайте (13.5px)' },
          { type: 'slider', path: 'chat.spacing', label: 'Отступ между сообщениями', min: 0, max: 24, step: 1, suffix: 'px', reset: 0, hint: '0 = как на сайте' },
          { type: 'slider', path: 'chat.avatarSize', label: 'Размер аватарок', min: 0, max: 72, step: 2, suffix: 'px', reset: 0, hint: '0 = как на сайте (40px)' },
          { type: 'slider', path: 'chat.maxWidth', label: 'Ширина колонки сообщения', min: 0, max: 1200, step: 20, suffix: 'px', reset: 0, hint: '0 = как на сайте (460px)' },
          { type: 'slider', path: 'chat.radius', label: 'Скругление пузырей', min: -1, max: 24, step: 1, suffix: 'px', reset: -1 }
        ]
      },
      {
        title: 'Пузыри и ряды',
        controls: [
          {
            type: 'select',
            path: 'chat.bubbles',
            label: 'Стиль пузырей',
            options: [
              { value: 'default', label: 'Как на сайте' },
              { value: 'solid', label: 'Плотная подложка' },
              { value: 'outline', label: 'Только контур' },
              { value: 'none', label: 'Без пузыря (текст)' }
            ]
          },
          { type: 'toggle', path: 'chat.altRows', label: 'Зебра через сообщение', hint: 'Лёгкая подложка на чётных строках для читаемости' }
        ]
      },
      {
        title: 'Скрыть декор',
        controls: [
          { type: 'toggle', path: 'chat.hideLevels', label: 'Уровни под аватарками' },
          { type: 'toggle', path: 'chat.hideBadges', label: 'Бейджи и звания в шапке сообщения' },
          { type: 'toggle', path: 'chat.hideTime', label: 'Время отправки' },
          { type: 'toggle', path: 'chat.hideActions', label: 'Ховер-панель действий над сообщением' }
        ]
      },
      {
        title: 'Мой ник',
        description: 'Локальная замена отображаемого имени: видно только вам, сервер не затрагивается',
        controls: [
          { type: 'text', path: 'identity.name', label: 'Кастомный ник', placeholder: 'Пусто = оставить оригинальный ник' },
          { type: 'text', path: 'identity.prefix', label: 'Префикс', placeholder: 'Например: ★ , [ADMIN] , ♛ ' },
          { type: 'text', path: 'identity.suffix', label: 'Суффикс', placeholder: 'Например: ✦ , -сан , ♪' },
          { type: 'color', path: 'identity.color', label: 'Цвет ника', hint: 'Пусто = цвет сайта' },
          { type: 'toggle', path: 'identity.gradient', label: 'Градиент из цвета', dependsOn: 'identity.name' },
          { type: 'toggle', path: 'identity.bold', label: 'Жирное начертание' },
          { type: 'toggle', path: 'identity.inChat', label: 'В чате' },
          { type: 'toggle', path: 'identity.inHeader', label: 'В шапке' },
          { type: 'toggle', path: 'identity.inProfile', label: 'На страницах профиля' }
        ]
      },
      {
        title: 'Подсветка',
        controls: [
          { type: 'toggle', path: 'chat.highlightOwn', label: 'Подсвечивать свои сообщения' },
          { type: 'color', path: 'chat.ownColor', label: 'Цвет подсветки своих', dependsOn: 'chat.highlightOwn=true' },
          { type: 'toggle', path: 'chat.mentionHighlight', label: 'Подсвечивать упоминания меня', hint: 'Строки, где в тексте есть @ваш_ник' }
        ]
      }
    ]
  };
});
