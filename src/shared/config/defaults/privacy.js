AONC.define('config.defaults.privacy', function () {
  return {
    softBlock: false,
    hardBlock: false,
    blockYandex: true,
    blockGoogle: true,
    blockAdNetworks: true,
    stripUrlParams: false,
    stripParamsList: 'utm_source,utm_medium,utm_campaign,utm_term,utm_content,fbclid,gclid,ymclid',
    spoofReferrer: false,
    blockBeacons: false,
    hideConsentUi: false
  };
});
