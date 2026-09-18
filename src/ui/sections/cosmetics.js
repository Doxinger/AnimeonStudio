AONC.define('ui.sections.cosmetics', function (A) {
  'use strict';

  var LABEL = 'Косметика и бейджи';

  function introText() {
    var c = A.config.framesLib.counts();
    var t = A.config.titlesLib.counts();
    return 'Визуальная экипировка профиля: любые бейджи и звания, ' + t.total +
      ' настоящих титулов и все ' + c.total + ' рамок аватара из каталога сайта (' + c.image +
      ' картинок с CDN и ' + c.css + ' CSS-колец) — включая невыданные. Титулы и рамки рисуются так же, как на сайте: те же цвета, свечение, анимации и геометрия.';
  }

  var section = {
    id: 'cosmetics',
    label: LABEL,
    icon: '🎖',
    groups: [],
    custom: 'cosmeticsHub'
  };

  Object.defineProperty(section, 'intro', {
    enumerable: true,
    get: introText
  });

  return section;
});
