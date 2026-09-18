AONC.define('ui.sections.privacy', function (A) {
  'use strict';

  return {
    id: 'privacy',
    label: 'Приватность',
    icon: '🛡',
    intro: 'На сайте работают Яндекс.Метрика (счётчик 98272913) и GA4. «Мягкая блокировка» глушит их прямо в странице и не требует разрешений. «Жёсткая» режет запросы на уровне сети через declarativeNetRequest и запросит доступ к доменам счётчиков.',
    groups: [
      {
        title: 'Блокировка счётчиков',
        controls: [
          { type: 'toggle', path: 'privacy.softBlock', label: 'Мягкая блокировка', hint: 'Подменяет ym/gtag/dataLayer и режет sendBeacon, fetch, XHR' },
          { type: 'toggle', path: 'privacy.hardBlock', label: 'Жёсткая блокировка сети', hint: 'Нужно разрешение на домены счётчиков' },
          { type: 'toggle', path: 'privacy.blockYandex', label: 'Яндекс.Метрика и AdFox' },
          { type: 'toggle', path: 'privacy.blockGoogle', label: 'Google Analytics и Tag Manager' },
          { type: 'toggle', path: 'privacy.blockAdNetworks', label: 'Прочие рекламные сети' },
          { type: 'toggle', path: 'privacy.blockBeacons', label: 'Блокировать все navigation beacons' },
          { type: 'toggle', path: 'privacy.spoofReferrer', label: 'Пустой document.referrer' }
        ]
      },
      {
        title: 'Ссылки и метки',
        controls: [
          { type: 'toggle', path: 'privacy.stripUrlParams', label: 'Срезать метки из адресов' },
          { type: 'text', path: 'privacy.stripParamsList', label: 'Параметры через запятую', mono: true, placeholder: 'utm_source,fbclid,gclid' },
          { type: 'toggle', path: 'privacy.hideConsentUi', label: 'Скрыть баннеры согласия' }
        ]
      },
      {
        title: 'Дашборд приватности',
        controls: [
          {
            type: 'privacyDash',
            id: 'privacyDash',
            label: 'Дашборд приватности',
            hint: 'Счётчики заблокированных запросов по типам и доменам'
          }
        ]
      },
      {
        title: 'Действия',
        controls: [
          { type: 'button', label: 'Запросить разрешение для жёсткой блокировки', actionId: 'privacy-request' },
          { type: 'button', label: 'Отозвать разрешение', variant: 'ghost', actionId: 'privacy-revoke' },
          { type: 'info', tone: 'muted', text: 'Жёсткая блокировка работает только после явного предоставления доступа к доменам счётчиков.' }
        ]
      }
    ]
  };
});
