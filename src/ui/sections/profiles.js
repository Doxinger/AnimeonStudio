AONC.define('ui.sections.profiles', function (A) {
  'use strict';

  return {
    id: 'profiles',
    label: 'Профили и данные',
    icon: '⧉',
    intro: 'Профиль — снимок всей конфигурации. Удобно держать несколько вариантов: «ночь», «чтение», «минимализм» и переключаться в один клик.',
    groups: [
      {
        title: 'Профили',
        controls: [
          { type: 'profileList', id: 'profileList' },
          { type: 'button', label: '＋ Сохранить текущее как профиль', variant: 'primary', actionId: 'profile-save' }
        ]
      },
      {
        title: 'Перенос',
        controls: [
          {
            type: 'info', tone: 'muted',
            text: 'Бандл — всё сразу: настройки и профили, файл загружается заменой. Пакет темы — только отмеченные части (палитра, фон, косметика, чат…), он сливается с текущими настройками.'
          },
          { type: 'button', label: 'Скачать JSON', actionId: 'export' },
          { type: 'button', label: 'Загрузить JSON', variant: 'ghost', actionId: 'import' },
          { type: 'button', label: 'Скопировать в буфер', variant: 'ghost', actionId: 'copy-json' },
          {
            type: 'button', id: 'export-package', label: '⇩ Экспорт настроек…', variant: 'primary', actionId: 'export-package',
            hint: 'Выбрать состав пакета и скачать или сохранить темой'
          }
        ]
      },
      {
        title: 'Язык и синхронизация',
        controls: [
          {
            type: 'select',
            path: 'meta.locale',
            label: 'Язык интерфейса',
            hint: 'English покрывает каркас студии, разделы и основные настройки; остальные подписи остаются русскими',
            options: [{ value: 'ru', label: 'Русский' }, { value: 'en', label: 'English' }]
          },
          { type: 'toggle', path: 'meta.syncEnabled', label: 'Синхронизировать настройки', hint: 'Через storage.sync между профилями браузера: тема, обои, типографика, стекло, сетка, чат, ник, косметика, скорость. Обои-файл с диска остаются на устройстве (лимит записи sync ~8 КБ)' }
        ]
      },
      {
        title: 'Обновления',
        controls: [
          { type: 'toggle', path: 'meta.updateCheck', label: 'Проверять обновления', hint: 'Раз в 12 часов и при старте читается JSON с номером релиза; установка всегда ручная — расширение только сообщает о новой версии' },
          { type: 'updatesBox', id: 'updatesBox' }
        ]
      },
      {
        title: 'Общее',
        controls: [
          { type: 'toggle', path: 'meta.enabled', label: 'Расширение включено' },
          { type: 'toggle', path: 'meta.instantApply', label: 'Применять мгновенно', hint: 'Кэширует CSS в localStorage сайта, чтобы тема появлялась до первой отрисовки' },
          { type: 'toggle', path: 'meta.showBadge', label: 'Показывать текст на иконке' },
          { type: 'toggle', path: 'meta.fabEnabled', label: 'Кнопка-хаб на сайте', hint: 'Плавающая шестерёнка с быстрым меню на animeon.cc; по умолчанию скрыта' },
          { type: 'button', label: 'Сбросить всё к исходному', variant: 'danger', actionId: 'reset-all' },
          { type: 'diagnostics', id: 'diagnostics' }
        ]
      }
    ]
  };
});
