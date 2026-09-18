AONC.define('ui.sections.performance', function (A) {
  'use strict';

  return {
    id: 'performance',
    label: 'Скорость',
    icon: '⚡',
    intro: 'Сайт сам хранит режим производительности в <code>localStorage["aon-perf-lite"]</code>. Расширение может принудительно выставить его, а также снизить вес постеров, переписывая параметры CDN.',
    groups: [
      {
        title: 'Режим сайта',
        controls: [
          {
            type: 'select',
            path: 'performance.perfMode',
            label: 'Встроенный режим производительности',
            hint: 'lite отключает тяжёлые анимации фона и эффекты боевого пропуска',
            options: [
              { value: 'default', label: 'Не вмешиваться' },
              { value: 'lite', label: 'lite — облегчённый' },
              { value: 'full', label: 'full — все эффекты' }
            ]
          },
          { type: 'toggle', path: 'performance.reduceMotion', label: 'Убрать анимации перехода' },
          { type: 'toggle', path: 'performance.killAnimations', label: 'Полностью остановить анимации' },
          { type: 'toggle', path: 'performance.disableBlur', label: 'Отключить backdrop-filter' },
          { type: 'toggle', path: 'performance.disableShadows', label: 'Отключить тени' },
          { type: 'toggle', path: 'performance.pauseOffscreen', label: 'Пауза видео вне экрана' },
          { type: 'toggle', path: 'performance.disablePrefetch', label: 'Убрать prefetch-запросы Next.js' },
          { type: 'toggle', path: 'performance.lazyLoadImages', label: 'Подложка для ленивых изображений' }
        ]
      },
      {
        title: 'Картинки с CDN',
        description: 'Постеры идут через selcdn.net с трансформацией ioss(resize=…,quality=…)',
        controls: [
          { type: 'slider', path: 'performance.posterQuality', label: 'Качество постеров', min: 0, max: 100, step: 5, reset: 0, hint: '0 = как на сайте (70)' },
          { type: 'slider', path: 'performance.posterResizeWidth', label: 'Ширина постеров', min: 0, max: 1200, step: 10, suffix: 'px', reset: 0, hint: '0 = как на сайте' },
          { type: 'slider', path: 'performance.capDevicePixelRatio', label: 'Ограничить DPR', min: 0, max: 3, step: 0.25, reset: 0, hint: '0 = не ограничивать' }
        ]
      }
    ]
  };
});
