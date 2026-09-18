AONC.define('background.badge', function (A) {
  'use strict';

  var api = A.api.raw;

  function supported() {
    return !!(api && api.action && api.action.setBadgeText);
  }

  function update(config) {
    if (!supported()) return;
    var enabled = !!(config && config.meta && config.meta.enabled);
    var show = !!(config && config.meta && config.meta.showBadge);

    var text = '';
    if (show && enabled) {
      var preset = config.theme && config.theme.preset ? config.theme.preset : 'custom';
      text = preset === 'original' ? 'ON' : preset.slice(0, 2).toUpperCase();
    }

    try {
      api.action.setBadgeText({ text: text });
      api.action.setBadgeBackgroundColor({
        color: enabled && config.theme ? config.theme.accent || '#7C4DFF' : '#3a3a44'
      });
      api.action.setTitle({
        title: A.NAME + (enabled ? ' — включено (' + (config.theme.preset || 'custom') + ')' : ' — выключено')
      });
    } catch (e) {}
  }

  function flash(text) {
    if (!supported()) return;
    try {
      api.action.setBadgeText({ text: text });
      setTimeout(function () {
        A.config.store.load().then(update);
      }, 900);
    } catch (e) {}
  }

  return { update: update, flash: flash, supported: supported };
});
