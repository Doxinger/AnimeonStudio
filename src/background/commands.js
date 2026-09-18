AONC.define('background.commands', function (A) {
  'use strict';

  var api = A.api.raw;

  function install() {
    if (!api || !api.commands || !api.commands.onCommand) return;
    api.commands.onCommand.addListener(function (command) {
      run(command);
    });
  }

  function run(command) {
    var T = A.messaging.TYPE;
    var msg = A.messaging.msg;

    switch (command) {
      case 'toggle-extension':
        A.background.state.toggle().then(function (config) {
          A.background.badge.update(config);
          broadcast(msg(T.APPLY, { config: config }));
        });
        break;
      case 'open-picker':
        activeTab().then(function (tab) {
          if (tab) A.api.tabs.sendMessage(tab.id, msg(T.PICKER_START));
        });
        break;
      case 'theater-mode':
        activeTab().then(function (tab) {
          if (tab) A.api.tabs.sendMessage(tab.id, msg(T.THEATER_TOGGLE));
        });
        break;
      case 'cinema-lights':
        activeTab().then(function (tab) {
          if (tab) A.api.tabs.sendMessage(tab.id, msg(T.CINEMA_TOGGLE));
        });
        break;
      case 'open-studio':
        A.background.menus.openStudio();
        break;
      default:
        break;
    }
  }

  function activeTab() {
    if (!A.api.tabs) return Promise.resolve(null);
    return A.api.tabs.query({ active: true, currentWindow: true }).then(function (tabs) {
      return (tabs && tabs[0]) || null;
    }).catch(function () { return null; });
  }

  function siteTabs() {
    if (!A.api.tabs || !A.api.tabs.query) return Promise.resolve([]);
    var patterns = [];
    A.HOSTS.forEach(function (h) {
      patterns.push('*://' + h + '/*');
      patterns.push('*://*.' + h + '/*');
    });
    return A.api.tabs.query({ url: patterns })
      .then(function (tabs) { return tabs || []; })
      .catch(function () { return []; });
  }

  function broadcast(message) {
    if (!A.api.tabs) return;
    A.api.tabs.query({}).then(function (tabs) {
      (tabs || []).forEach(function (tab) {
        if (tab.id == null) return;
        if (!A.isSiteUrl(tab.url || '')) return;
        A.api.tabs.sendMessage(tab.id, message);
      });
    }).catch(function () {});
  }

  return { install: install, run: run, activeTab: activeTab, broadcast: broadcast, siteTabs: siteTabs };
});
