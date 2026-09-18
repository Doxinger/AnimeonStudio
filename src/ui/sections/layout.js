AONC.define('ui.sections.layout', function (A) {
  'use strict';

  return {
    id: 'layout',
    label: 'Сетка и карточки',
    icon: '▦',
    intro: 'Плотность меняет базовую переменную Tailwind <code>--spacing</code> (по умолчанию 0.25rem), поэтому масштабируются все отступы, промежутки и размеры утилит разом.',
    groups: [
      {
        title: 'Плотность и ширина',
        controls: [
          { type: 'slider', path: 'layout.density', label: 'Плотность интерфейса', min: 60, max: 160, step: 1, format: 'percent', reset: 100, hint: 'Меньше = компактнее всё сразу' },
          { type: 'slider', path: 'layout.containerWidth', label: 'Ширина контента', min: 0, max: 2400, step: 20, suffix: 'px', reset: 0, hint: '0 = как на сайте' },
          { type: 'slider', path: 'layout.columns', label: 'Картинок в ряду', min: 0, max: 14, step: 1, reset: 0, hint: '0 = адаптив сайта' },
          { type: 'toggle', path: 'layout.fullWidthRows', label: 'Ряды на всю ширину окна' }
        ]
      },
      {
        title: 'Постеры',
        controls: [
          { type: 'slider', path: 'layout.posterScale', label: 'Размер карточек', min: 50, max: 220, step: 5, format: 'percent', reset: 100 },
          { type: 'slider', path: 'layout.posterGap', label: 'Зазор между карточками', min: 0, max: 48, step: 1, suffix: 'px', reset: 0, hint: '0 = как на сайте' },
          { type: 'slider', path: 'layout.posterRadius', label: 'Скругление постеров', min: -1, max: 40, step: 1, suffix: 'px', reset: -1, hint: '-1 = из темы' },
          {
            type: 'select',
            path: 'layout.posterAspect',
            label: 'Пропорции постера',
            options: [
              { value: '', label: 'Как на сайте (2:3)' },
              { value: '2/3', label: '2:3 — стандарт' },
              { value: '3/4', label: '3:4 — ниже' },
              { value: '1/1', label: '1:1 — квадрат' },
              { value: '9/16', label: '9:16 — вытянутый' }
            ]
          },
          {
            type: 'select',
            path: 'layout.posterShadow',
            label: 'Тень постеров',
            options: [
              { value: 'default', label: 'Как на сайте' },
              { value: 'none', label: 'Без тени' },
              { value: 'soft', label: 'Мягкая' },
              { value: 'strong', label: 'Выраженная' },
              { value: 'glow', label: 'Свечение акцентом' }
            ]
          },
          { type: 'toggle', path: 'layout.cardBorder', label: 'Обводка постеров' },
          { type: 'slider', path: 'layout.grayscalePosters', label: 'Обесцветить постеры', min: 0, max: 100, step: 5, format: 'percent', reset: 0 },
          { type: 'slider', path: 'layout.dimPosters', label: 'Затемнить постеры', min: 0, max: 80, step: 5, format: 'percent', reset: 0 }
        ]
      },
      {
        title: 'Списки: режимы отображения',
        description: 'Как выглядят ряды карточек на главной, в каталоге и подборках',
        controls: [
          {
            type: 'select',
            path: 'layout.listMode',
            label: 'Режим списков',
            options: [
              { value: 'default', label: 'Как на сайте (горизонтальная лента)' },
              { value: 'grid', label: 'Сетка (все карточки видно сразу)' },
              { value: 'rows', label: 'Строки (постер слева, описание справа)' },
              { value: 'compact', label: 'Компакт (мельче, без мета-строки)' }
            ]
          },
          { type: 'toggle', path: 'layout.promoLast', label: 'Промо-секции в конец страницы', hint: 'Боевой пропуск, манга и Premium опускаются ниже контента' },
          { type: 'toggle', path: 'layout.ratingColors', label: 'Цвета рейтингов по оценке', hint: '8+ зелёный, 7+ салатовый, 6+ янтарный, ниже — красный' }
        ]
      },
      {
        title: 'Страница профиля',
        description: 'Косметика чужих и своих профилей /user/…',
        controls: [
          { type: 'toggle', path: 'layout.pfHideCover', label: 'Скрыть обложку профиля' },
          { type: 'slider', path: 'layout.pfBlurCover', label: 'Размытие обложки', min: 0, max: 30, step: 1, suffix: 'px', reset: 0 },
          { type: 'toggle', path: 'layout.pfCoverAccent', label: 'Обложка в цвет акцента', hint: 'Заменяет градиент обложки на производный от вашей палитры' },
          { type: 'toggle', path: 'layout.pfHideNoise', label: 'Убрать шумовой оверлей' },
          { type: 'toggle', path: 'layout.pfHideEdit', label: 'Скрыть кнопки редактирования', hint: '«Изменить фон» и подобные на чужих профилях тоже скроются' },
          { type: 'toggle', path: 'layout.pfHidePremium', label: 'Скрыть баннер «Premium активен»' },
          { type: 'toggle', path: 'layout.collectionsQuickDelete', label: 'Кнопка удаления подборок на карточках', hint: 'Крестик на карточке своей подборки: подтверждение → сайт сам удаляет и возвращает назад' }
        ]
      },
      {
        title: 'Анимация карточек и ряды',
        controls: [
          {
            type: 'select',
            path: 'layout.cardHover',
            label: 'Эффект при наведении',
            options: [
              { value: 'default', label: 'Как на сайте (зум постера)' },
              { value: 'none', label: 'Отключить' },
              { value: 'lift', label: 'Приподнять карточку' },
              { value: 'glow', label: 'Свечение по контуру' },
              { value: 'bright', label: 'Ярче без зума' }
            ]
          },
          { type: 'slider', path: 'layout.heroScale', label: 'Высота hero-слайдера', min: 20, max: 200, step: 5, format: 'percent', reset: 100 },
          { type: 'toggle', path: 'layout.showRowScrollbars', label: 'Показать полосы прокрутки в рядах' },
          {
            type: 'toggle',
            path: 'layout.clipAvatars',
            label: 'Обрезать квадрат у аватарок',
            hint: 'Скругляет выступающие углы квадратного кадра и декоративной рамки вокруг круглой аватарки'
          },
          {
            type: 'toggle',
            path: 'layout.hideAvatarFrames',
            label: 'Полностью скрыть рамки аватарок',
            hint: 'Убирает декоративные рамки из cosmetics/frames у всех пользователей; ваши собственные рамки из раздела «Косметика» остаются'
          }
        ]
      }
    ]
  };
});
