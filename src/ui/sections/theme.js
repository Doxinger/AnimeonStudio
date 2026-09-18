AONC.define('ui.sections.theme', function (A) {
  'use strict';

  var presets = A.config.presets;
  var WALLPAPER_OPTIONS = A.config.wallpapers.LIB.map(function (p) { return { value: p.id, label: p.name + ' · ' + p.group }; });

  function presetOptions() {
    return presets.LIST.map(function (p) {
      return { value: p.id, label: p.name, group: p.group };
    }).concat([{ value: 'custom', label: 'Свой (вручную)' }]);
  }

  return {
    id: 'theme',
    label: 'Тема',
    icon: '◐',
    intro: 'Сайт собран на дизайн-токенах Tailwind v4 / shadcn. Расширение переопределяет эти переменные, поэтому перекраска касается всего интерфейса сразу — от шапки до карточек.',
    groups: [
      {
        title: 'Пресет',
        controls: [
          {
            type: 'select',
            path: 'theme.preset',
            label: 'Готовая тема',
            options: presetOptions(),
            onChange: function (value, state) {
              if (value === 'custom') return;
              var patch = presets.themePatch(value);
              var changes = {};
              Object.keys(patch).forEach(function (k) { changes['theme.' + k] = patch[k]; });
              state.setMany(changes);
            }
          },
          { type: 'presetGrid', id: 'presetGrid' },
          {
            type: 'toggle',
            path: 'theme.overrideTokens',
            label: 'Переопределять цвета сайта',
            hint: 'Выключите, чтобы оставить оригинальную палитру и править только остальное'
          }
        ]
      },
      {
        title: 'Палитра',
        description: 'Пустое значение = подобрать автоматически',
        controls: [
          { type: 'color', path: 'theme.accent', label: 'Акцент', hint: 'Кнопки, ссылки, подсветка, рейтинг' },
          { type: 'color', path: 'theme.background', label: 'Фон страницы' },
          { type: 'color', path: 'theme.surface', label: 'Карточки и панели' },
          { type: 'color', path: 'theme.surfaceAlt', label: 'Вторичные поверхности' },
          { type: 'color', path: 'theme.foreground', label: 'Основной текст' },
          { type: 'color', path: 'theme.mutedForeground', label: 'Приглушённый текст' },
          { type: 'color', path: 'theme.border', label: 'Границы', hint: 'Можно rgba(255,255,255,0.1)' },
          { type: 'color', path: 'theme.destructive', label: 'Опасные действия' },
          { type: 'contrast', id: 'contrast' }
        ]
      },
      {
        title: 'Мои темы',
        description: 'Личные темы: снимок палитры и обоев, применяется в один клик',
        controls: [
          { type: 'myThemes', id: 'myThemes' }
        ]
      },
      {
        title: 'Фоновое изображение',
        description: 'Любая картинка, встроенный пресет или узор на фон страницы поверх выбранной палитры',
        controls: [
          { type: 'toggle', path: 'wallpaper.enabled', label: 'Включить фоновое изображение' },
          { type: 'wallpaperGrid', id: 'wallpaperGrid', dependsOn: 'wallpaper.enabled=true' },
          {
            type: 'select',
            path: 'wallpaper.source',
            label: 'Источник',
            options: [
              { value: 'preset', label: 'Встроенный пресет / узор' },
              { value: 'url', label: 'По ссылке (URL)' },
              { value: 'data', label: 'Загруженный файл' }
            ],
            dependsOn: 'wallpaper.enabled=true'
          },
          {
            type: 'select',
            path: 'wallpaper.preset',
            label: 'Пресет',
            options: WALLPAPER_OPTIONS,
            dependsOn: 'wallpaper.enabled=true'
          },
          {
            type: 'text',
            path: 'wallpaper.url',
            label: 'URL картинки',
            mono: true,
            placeholder: 'https://example.com/wallpaper.jpg',
            dependsOn: 'wallpaper.enabled=true'
          },
          { type: 'button', label: '⬆ Загрузить файл с диска', actionId: 'wallpaper-upload', dependsOn: 'wallpaper.enabled=true' },
          { type: 'button', label: 'Убрать изображение', variant: 'ghost', actionId: 'wallpaper-clear', dependsOn: 'wallpaper.enabled=true' },
          { type: 'wallpaperInfo', id: 'wallpaperInfo', dependsOn: 'wallpaper.enabled=true' },
          {
            type: 'select',
            path: 'wallpaper.size',
            label: 'Масштаб',
            options: [
              { value: 'cover', label: 'Заполнить (cover)' },
              { value: 'contain', label: 'Вписать целиком (contain)' },
              { value: '100% 100%', label: 'Растянуть по осям' },
              { value: 'auto', label: 'Исходный размер' }
            ],
            dependsOn: 'wallpaper.enabled=true'
          },
          {
            type: 'select',
            path: 'wallpaper.position',
            label: 'Позиция',
            options: [
              { value: 'center', label: 'По центру' },
              { value: 'top center', label: 'Сверху по центру' },
              { value: 'bottom center', label: 'Снизу по центру' },
              { value: 'left center', label: 'Слева' },
              { value: 'right center', label: 'Справа' }
            ],
            dependsOn: 'wallpaper.enabled=true'
          },
          {
            type: 'select',
            path: 'wallpaper.repeat',
            label: 'Повтор',
            options: [
              { value: 'no-repeat', label: 'Без повтора' },
              { value: 'repeat', label: 'Плиткой' },
              { value: 'repeat-x', label: 'По горизонтали' },
              { value: 'repeat-y', label: 'По вертикали' }
            ],
            dependsOn: 'wallpaper.enabled=true'
          },
          {
            type: 'select',
            path: 'wallpaper.attachment',
            label: 'Прокрутка',
            options: [
              { value: 'fixed', label: 'Неподвижно (fixed)' },
              { value: 'scroll', label: 'Вместе со страницей' }
            ],
            dependsOn: 'wallpaper.enabled=true'
          },
          { type: 'slider', path: 'wallpaper.overlay', label: 'Затемнение поверх', min: 0, max: 95, step: 1, format: 'percent', reset: 45, dependsOn: 'wallpaper.enabled=true', hint: 'Чтобы текст оставался читаемым' },
          { type: 'slider', path: 'wallpaper.vignette', label: 'Виньетка по краям', min: 0, max: 90, step: 1, format: 'percent', reset: 0, dependsOn: 'wallpaper.enabled=true' },
          { type: 'slider', path: 'wallpaper.blur', label: 'Размытие', min: 0, max: 30, step: 1, suffix: 'px', reset: 0, dependsOn: 'wallpaper.enabled=true' },
          { type: 'slider', path: 'wallpaper.saturate', label: 'Насыщенность', min: 0, max: 300, step: 5, format: 'percent', reset: 100, dependsOn: 'wallpaper.enabled=true' },
          { type: 'toggle', path: 'wallpaper.showThrough', label: 'Прозрачный фон контента', hint: 'Позволяет картинке просвечивать сквозь основную область страницы', dependsOn: 'wallpaper.enabled=true' },
          { type: 'toggle', path: 'wallpaper.parallax', label: 'Параллакс при прокрутке', hint: 'Фон смещается медленнее страницы', dependsOn: 'wallpaper.enabled=true' },
          { type: 'slider', path: 'wallpaper.parallaxStrength', label: 'Сила параллакса', min: 0, max: 200, step: 5, format: 'percent', reset: 30, dependsOn: 'wallpaper.parallax=true' },
          { type: 'toggle', path: 'wallpaper.drift', label: 'Медленный дрейф', hint: 'Плавная анимация фона даже без прокрутки', dependsOn: 'wallpaper.enabled=true' },
          { type: 'slider', path: 'wallpaper.driftSpeed', label: 'Период дрейфа', min: 8, max: 240, step: 4, suffix: 's', reset: 60, dependsOn: 'wallpaper.drift=true' }
        ]
      },
      {
        title: 'Фоны по разделам',
        description: 'Отдельный фон для каталога, плеера или любой маски URL; первое совпавшее правило побеждает',
        controls: [
          { type: 'wallpaperRules', id: 'wallpaperRules' }
        ]
      },
      {
        title: 'Финиш и движение',
        description: 'Мягкость переходов, амбиентный свет, тени и гармония оттенков',
        controls: [
          { type: 'toggle', path: 'theme.themeTransitions', label: 'Плавная смена темы', hint: 'Короткий кросс-фейд цветов при любом изменении настроек, вместо мгновенного скачка' },
          { type: 'slider', path: 'theme.ambient', label: 'Амбиентный свет', min: 0, max: 100, step: 5, format: 'percent', reset: 0, hint: 'Мягкие цветные ореолы по углам экрана вместо плоского фона' },
          {
            type: 'select',
            path: 'theme.harmony',
            label: 'Гармония оттенков',
            hint: 'Как подбираются дополнительные цвета для ореолов и градиентов',
            options: [
              { value: 'analog', label: 'Аналоговая (соседние тона)' },
              { value: 'mono', label: 'Моно (один тон)' },
              { value: 'triad', label: 'Триада (три тона)' },
              { value: 'complement', label: 'Комплементарная (контраст)' }
            ]
          },
          { type: 'toggle', path: 'theme.softShadows', label: 'Мягкие тени', hint: 'Многослойные рассеянные тени с лёгким оттенком акцента вместо жёстких' },
          {
            type: 'select',
            path: 'theme.motion',
            label: 'Характер движения',
            options: [
              { value: 'default', label: 'Как на сайте' },
              { value: 'calm', label: 'Спокойный (короткие переходы)' },
              { value: 'lively', label: 'Живой (микро-подъём кнопок)' }
            ]
          },
          { type: 'toggle', path: 'theme.recolorGradients', label: 'Перекрасить градиенты сайта', hint: 'Логотип и градиентный текст следуют вашему акценту' },
          { type: 'slider', path: 'theme.borderAlpha', label: 'Прозрачность границ', min: 0, max: 40, step: 1, format: 'percent', reset: 0, hint: '0 = подобрать автоматически; меньше — воздушнее' }
        ]
      },
      {
        title: 'Режим и форма',
        controls: [
          {
            type: 'select',
            path: 'theme.mode',
            label: 'Режим',
            hint: 'Сайт принудительно тёмный (next-themes forcedTheme) — расширение перехватывает класс темы',
            options: [
              { value: 'dark', label: 'Тёмный' },
              { value: 'light', label: 'Светлый (экспериментально)' },
              { value: 'auto', label: 'Как в системе' }
            ]
          },
          { type: 'slider', path: 'theme.radius', label: 'Скругление углов', min: 0, max: 32, step: 1, suffix: 'px', reset: 12 },
          { type: 'slider', path: 'theme.radiusCards', label: 'Скругление постеров', min: -1, max: 40, step: 1, suffix: 'px', reset: -1, hint: '-1 = как общее' },
          { type: 'slider', path: 'theme.saturation', label: 'Насыщенность палитры', min: 0, max: 200, step: 5, format: 'percent', reset: 100 },
          { type: 'toggle', path: 'theme.autoContrast', label: 'Автоконтраст текста', hint: 'Поднимает контраст до читаемого по WCAG' },
          { type: 'toggle', path: 'theme.forceBodyBackground', label: 'Перекрашивать фон body и main', hint: 'У сайта фон задан инлайном — без этого он останется чёрным' },
          { type: 'toggle', path: 'theme.styleScrollbars', label: 'Свои полосы прокрутки' },
          { type: 'toggle', path: 'theme.styleSelection', label: 'Свой цвет выделения текста' }
        ]
      }
    ]
  };
});
