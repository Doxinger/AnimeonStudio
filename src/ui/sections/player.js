AONC.define('ui.sections.player', function (A) {
  'use strict';

  return {
    id: 'player',
    label: 'Плеер',
    icon: '▶',
    intro: 'Видео на сайте отдаётся через iframe Kodik. Всё, что касается разметки вокруг плеера, правится здесь; громкость, скорость и оформление внутри кадра — отдельным скриптом, который внедряется в домен плеера.',
    groups: [
      {
        title: 'Режимы просмотра',
        controls: [
          { type: 'toggle', path: 'player.theaterMode', label: 'Театральный режим', hint: 'Плеер на всю ширину, шапка тускнеет. Alt+Shift+T' },
          { type: 'toggle', path: 'player.wideMode', label: 'Широкий плеер', hint: 'Контейнер расширяется до 1800px' },
          { type: 'toggle', path: 'player.cinemaLights', label: 'Киносвет', hint: 'Затемняет страницу вокруг видео во время воспроизведения. Alt+Shift+C' },
          { type: 'slider', path: 'player.cinemaDim', label: 'Сила затемнения', min: 0, max: 98, step: 2, format: 'percent', reset: 80, dependsOn: 'player.cinemaLights=true' },
          { type: 'toggle', path: 'player.expandPlayerToViewport', label: 'Плеер на весь экран окна', hint: 'Alt+Shift+M' },
          { type: 'slider', path: 'player.playerMaxWidth', label: 'Ограничить ширину плеера', min: 0, max: 2400, step: 20, suffix: 'px', reset: 0, hint: '0 = без ограничения' },
          { type: 'slider', path: 'player.playerRadius', label: 'Скругление плеера', min: -1, max: 40, step: 1, suffix: 'px', reset: -1 }
        ]
      },
      {
        title: 'Воспроизведение',
        controls: [
          { type: 'toggle', path: 'player.rememberVolume', label: 'Запоминать громкость', hint: 'Общая для сайта и плеера Kodik' },
          { type: 'slider', path: 'player.defaultVolume', label: 'Громкость по умолчанию', min: -1, max: 100, step: 5, format: 'percent', reset: -1, hint: '-1 = не трогать' },
          { type: 'toggle', path: 'player.rememberRate', label: 'Запоминать скорость' },
          {
            type: 'select',
            path: 'player.playbackRate',
            label: 'Скорость по умолчанию',
            options: [
              { value: 0.5, label: '0.5×' }, { value: 0.75, label: '0.75×' },
              { value: 1, label: '1× — обычно' }, { value: 1.25, label: '1.25×' },
              { value: 1.5, label: '1.5×' }, { value: 1.75, label: '1.75×' },
              { value: 2, label: '2×' }, { value: 2.5, label: '2.5×' }, { value: 3, label: '3×' }
            ]
          },
          {
            type: 'select',
            path: 'player.defaultQuality',
            label: 'Предпочитаемое качество',
            hint: 'Плеер сам решает, есть ли такой поток',
            options: [
              { value: '', label: 'Не вмешиваться' },
              { value: '480p', label: '480p' },
              { value: '720p', label: '720p' },
              { value: '1080p', label: '1080p' }
            ]
          },
          { type: 'toggle', path: 'player.autoplayNext', label: 'Автопереход к следующей серии' },
          { type: 'toggle', path: 'player.autoFullscreenLandscape', label: 'Полный экран при повороте телефона' }
        ]
      },
      {
        title: 'Оформление плеера и окружения',
        controls: [
          { type: 'toggle', path: 'player.hideKodikBranding', label: 'Скрыть логотипы внутри плеера' },
          { type: 'toggle', path: 'player.hideComments', label: 'Скрыть комментарии под плеером' },
          { type: 'toggle', path: 'player.hideEpisodeSuggestions', label: 'Скрыть блоки «Смотрите также»' },
          { type: 'toggle', path: 'player.hotkeys', label: 'Горячие клавиши', hint: 'Alt+Shift+P/T/C/M/E/R/H' },
          { type: 'toggle', path: 'player.keepPlayingOnNavigate', label: 'Не останавливать плеер при переходах' }
        ]
      }
    ]
  };
});
