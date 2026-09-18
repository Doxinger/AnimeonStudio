AONC.define('config.defaults.meta', function (A) {
  return {
    schemaVersion: 1,
    enabled: true,
    locale: 'ru',
    instantApply: true,
    showBadge: true,
    activeProfile: '',
    pickerHotkeyEnabled: true,
    activeThemeId: '',
    favorites: [],
    onboarded: false,
    fabEnabled: false,
    syncEnabled: false,
    updateCheck: true,
    updateUrl: '',
    seenVersion: '',
    lastEdited: 0,
    installedVersion: A.VERSION
  };
});
