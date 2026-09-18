AONC.define('messaging', function () {
  'use strict';

  var TYPE = {
    CONFIG_GET: 'aonc/config:get',
    CONFIG_SET: 'aonc/config:set',
    CONFIG_PATCH: 'aonc/config:patch',
    CONFIG_RESET: 'aonc/config:reset',
    CSS_PREVIEW: 'aonc/css:preview',
    APPLY: 'aonc/apply',
    REAPPLY_ALL: 'aonc/reapply-all',
    CACHE_CLEAR: 'aonc/cache:clear',
    RELOAD_TAB: 'aonc/reload',
    OPEN_STUDIO: 'aonc/open-studio',
    CLAN_LIST: 'aonc/clan:list',
    CATALOG_GET: 'aonc/catalog:get',
    CATALOG_REFRESH: 'aonc/catalog:refresh',
    CATALOG_CLEAR: 'aonc/catalog:clear',
    CLAN_REFRESH: 'aonc/clan:refresh',
    SUPPORTER_LIST: 'aonc/supporter:list',
    SUPPORTER_REFRESH: 'aonc/supporter:refresh',
    STATE_SET: 'aonc/state:set',
    TOGGLE_ENABLED: 'aonc/toggle-enabled',
    PROFILES_LIST: 'aonc/profiles:list',
    PROFILES_SAVE: 'aonc/profiles:save',
    PROFILES_DELETE: 'aonc/profiles:delete',
    PROFILE_ACTIVATE: 'aonc/profile:activate',
    PICKER_START: 'aonc/picker:start',
    PICKER_STOP: 'aonc/picker:stop',
    PICKER_STATE: 'aonc/picker:state',
    ELEMENT_HIDE: 'aonc/element:hide',
    THEATER_TOGGLE: 'aonc/theater:toggle',
    CINEMA_TOGGLE: 'aonc/cinema:toggle',
    PERMISSION_REQUEST: 'aonc/permission:request',
    PERMISSION_REVOKE: 'aonc/permission:revoke',
    PERMISSION_STATE: 'aonc/permission:state',
    SHOWCASE_GRAB: 'aonc/showcase:grab',
    EXPORT: 'aonc/export',
    IMPORT: 'aonc/import',
    PING: 'aonc/ping',
    DIAGNOSTICS: 'aonc/diagnostics',
    PRIVACY_STATS: 'aonc/privacy:stats',
    MIRRORS_STATUS: 'aonc/mirrors:status',
    OPEN_OFFLINE: 'aonc/open-offline',
    UPDATES_CHECK: 'aonc/updates:check',
    UPDATES_STATUS: 'aonc/updates:status'
  };

  function msg(type, payload) {
    return { __aonc: true, type: type, payload: payload || {} };
  }

  function isOurs(message) {
    return !!message && message.__aonc === true && typeof message.type === 'string';
  }

  function router(handlers) {
    return function (message, sender, sendResponse) {
      if (!isOurs(message)) return false;
      var handler = handlers[message.type];
      if (!handler) {
        sendResponse({ ok: false, error: 'unknown type: ' + message.type });
        return false;
      }
      var result;
      try {
        result = handler(message.payload || {}, sender, sendResponse);
      } catch (e) {
        sendResponse({ ok: false, error: String(e && e.message || e) });
        return false;
      }
      if (result && typeof result.then === 'function') {
        result.then(
          function (value) { sendResponse({ ok: true, value: value }); },
          function (err) { sendResponse({ ok: false, error: String(err && err.message || err) }); }
        );
        return true;
      }
      if (result !== undefined) sendResponse({ ok: true, value: result });
      return false;
    };
  }

  function unwrap(response) {
    if (!response) return undefined;
    if (response.ok === false) throw new Error(response.error || 'request failed');
    return response.value !== undefined ? response.value : response;
  }

  return { TYPE: TYPE, msg: msg, isOurs: isOurs, router: router, unwrap: unwrap };
});
