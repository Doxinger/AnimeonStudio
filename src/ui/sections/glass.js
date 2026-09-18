AONC.define('ui.sections.glass', function (A) {
  'use strict';

  return {
    id: 'glass',
    label: 'Шапка и стекло',
    icon: '▤',
    intro: 'Стеклянная шапка сайта управляется переменными <code>--aon-glass-tint</code>, <code>--aon-glass-alpha</code> и <code>--aon-glass-filter</code>. Здесь они переопределяются напрямую.',
    groups: [
      {
        title: 'Эффект стекла',
        controls: [
          { type: 'toggle', path: 'glass.enabled', label: 'Управлять эффектом стекла' },
          { type: 'slider', path: 'glass.blur', label: 'Размытие', min: 0, max: 40, step: 1, suffix: 'px', reset: 8, dependsOn: 'glass.enabled=true' },
          { type: 'slider', path: 'glass.alpha', label: 'Непрозрачность подложки', min: 0, max: 100, step: 1, format: 'percent', reset: 60, dependsOn: 'glass.enabled=true' },
          { type: 'slider', path: 'glass.fallbackAlpha', label: 'Плотность без backdrop-filter', min: 0, max: 100, step: 1, format: 'percent', reset: 95, dependsOn: 'glass.enabled=true' },
          { type: 'color', path: 'glass.tint', label: 'Оттенок стекла', hint: 'Пусто = цвет фона темы', dependsOn: 'glass.enabled=true' },
          { type: 'slider', path: 'glass.navBlur', label: 'Размытие выпадающего меню', min: 0, max: 40, step: 1, suffix: 'px', reset: 6, dependsOn: 'glass.enabled=true' },
          { type: 'slider', path: 'glass.navAlpha', label: 'Непрозрачность меню', min: 0, max: 100, step: 1, format: 'percent', reset: 75, dependsOn: 'glass.enabled=true' },
          { type: 'toggle', path: 'glass.killBackdropFilter', label: 'Отключить blur везде', hint: 'Заметно ускоряет прокрутку на слабых машинах' }
        ]
      },
      {
        title: 'Поведение шапки',
        controls: [
          { type: 'toggle', path: 'glass.headerSticky', label: 'Закреплённая шапка' },
          { type: 'toggle', path: 'glass.headerHideOnScroll', label: 'Прятать при прокрутке вниз' },
          { type: 'slider', path: 'glass.headerHeight', label: 'Высота шапки', min: 36, max: 120, step: 1, suffix: 'px', reset: 64 },
          { type: 'toggle', path: 'glass.headerCompact', label: 'Компактная шапка', hint: 'Меньше логотип и плотнее элементы' },
          { type: 'toggle', path: 'glass.headerOpaque', label: 'Непрозрачная шапка', hint: 'Убирает стекло полностью' },
          { type: 'toggle', path: 'glass.headerBorder', label: 'Нижняя граница шапки' }
        ]
      }
    ]
  };
});
