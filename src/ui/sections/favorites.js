AONC.define('ui.sections.favorites', function (A) {
  'use strict';

  return {
    id: 'favorites',
    label: 'Избранное',
    icon: '★',
    intro: 'Контролы, помеченные звёздочкой в других разделах, собраны здесь для быстрого доступа. Список хранится в конфиге и попадает в профили и экспорт.',
    groups: [],
    custom: 'favoritesList'
  };
});
