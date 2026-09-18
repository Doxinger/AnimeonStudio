AONC.define('ui.actions', function (A) {
  'use strict';

  var el = A.ui.controls.el;
  var T = A.messaging.TYPE;

  var handlers = {};

  handlers['picker-start'] = function (ctx) {
    A.api.sendMessage(A.messaging.msg(T.PICKER_START)).then(function (response) {
      if (response) A.ui.toast.ok('Пипетка включена — переключитесь на вкладку с сайтом');
      else A.ui.toast.error('Нет активной вкладки с animeon.cc');
      ctx.refresh('elements');
    }).catch(function () {
      A.ui.toast.error('Фон не отвечает — переоткройте студию');
    });
  };

  handlers['picker-stop'] = function () {
    A.api.sendMessage(A.messaging.msg(T.PICKER_STOP));
    A.ui.toast.info('Пипетка выключена');
  };

  handlers['rule-add'] = function (ctx) {
    var rules = (A.ui.state.get('elements.rules') || []).slice();
    var rule = A.lang.normalize(A.config.defaults.elementRule, {
      id: A.lang.uid('rule'),
      name: 'Новое правило',
      selector: 'header',
      action: 'style',
      createdAt: Date.now()
    });
    rules.push(rule);
    A.ui.state.set('elements.rules', rules);
    ctx.expandedRule = rule.id;
    ctx.refresh('elements');
  };

  handlers['vis-hide-promo'] = function (ctx) {
    A.ui.state.setMany({
      'visibility.battlepass': true,
      'visibility.premium': true,
      'visibility.roadmap': true,
      'visibility.mangaTeaser': true
    });
    ctx.refresh('visibility');
    A.ui.toast.ok('Промо-блоки скрыты');
  };

  handlers['vis-show-all'] = function (ctx) {
    var changes = {};
    A.ui.sections.visibility.allKeys().forEach(function (k) { changes['visibility.' + k] = false; });
    A.ui.state.setMany(changes);
    ctx.refresh('visibility');
    A.ui.toast.ok('Все блоки снова видны');
  };

  handlers['privacy-request'] = function (ctx) {
    A.api.sendMessage(A.messaging.msg(T.PERMISSION_REQUEST)).then(function (response) {
      var data = A.messaging.unwrap(response || {}) || {};
      if (data.granted) {
        A.ui.state.set('privacy.hardBlock', true);
        A.ui.toast.ok('Доступ выдан, запросы счётчиков блокируются');
      } else {
        A.ui.toast.error('Разрешение не выдано');
      }
      ctx.refresh('privacy');
    }).catch(function () {
      A.ui.toast.error('Не удалось запросить разрешение — обновите студию (F5)');
      ctx.refresh('privacy');
    });
  };

  handlers['privacy-revoke'] = function (ctx) {
    A.api.sendMessage(A.messaging.msg(T.PERMISSION_REVOKE)).then(function () {
      A.ui.state.set('privacy.hardBlock', false);
      A.ui.toast.info('Доступ к доменам счётчиков отозван');
      ctx.refresh('privacy');
    });
  };

  handlers['profile-save'] = function (ctx) {
    promptName('Сохранить профиль', suggestName(), function (name) {
      if (!name) return;
      A.config.profiles.save(name, A.ui.state.current()).then(function (profile) {
        if (!profile) throw new Error('пустой ответ хранилища');
        A.ui.state.set('meta.activeProfile', profile.id);
        ctx.refresh('profiles');
        A.ui.toast.ok('Профиль «' + profile.name + '» сохранён');
      }).catch(function (e) {
        A.ui.toast.error('Профиль не сохранён: ' + ((e && e.message) || e));
      });
    });
  };

  handlers['export'] = function () {
    A.config.profiles.exportBundle(A.ui.state.current()).then(function (text) {
      download(text, 'animeon-studio-' + stamp() + '.json', 'application/json');
      A.ui.toast.ok('Файл выгружен');
    }).catch(function (e) {
      A.ui.toast.error('Экспорт не удался: ' + ((e && e.message) || e));
    });
  };

  handlers['copy-json'] = function () {
    A.config.profiles.exportBundle(A.ui.state.current()).then(function (text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          A.ui.toast.ok('JSON в буфере обмена');
        }, function () {
          A.ui.toast.error('Браузер не дал доступ к буферу обмена');
        });
      } else {
        A.ui.toast.error('Буфер обмена недоступен');
      }
    }).catch(function (e) {
      A.ui.toast.error('Копирование не удалось: ' + ((e && e.message) || e));
    });
  };

  // Читает выбранный JSON-файл и отдаёт текст.
  function readJsonFile(onText) {
    var input = el('input', { type: 'file', accept: '.json,application/json' });
    input.style.display = 'none';
    document.body.appendChild(input);
    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (!file) { if (input.parentNode) document.body.removeChild(input); return; }
      var reader = new FileReader();
      reader.onload = function () {
        onText(String(reader.result));
        if (input.parentNode) document.body.removeChild(input);
      };
      reader.onerror = function () {
        A.ui.toast.error('Не удалось прочитать файл');
        if (input.parentNode) document.body.removeChild(input);
      };
      reader.readAsText(file);
    });
    input.click();
  }

  // Файл темы/пакета сливается с текущими настройками, бандл профиля — заменяет.
  handlers['import'] = function (ctx) {
    readJsonFile(function (text) {
      var parsed = A.ui.themePackage.parse(text);
      if (!parsed.error && parsed.kind !== 'aonc-bundle') {
        A.ui.themeIo.importPackage(text, ctx);
        return;
      }
      A.config.profiles.importBundle(text).then(function (config) {
        A.ui.state.replace(config);
        A.ui.history.adopt(config);
        ctx.refreshAll();
        A.ui.toast.ok('Конфигурация загружена');
      }).catch(function (e) {
        A.ui.toast.error(e.message);
      });
    });
  };

  handlers['export-package'] = function (ctx) {
    A.ui.themeIo.openExportDialog(ctx);
  };

  handlers['history-clear'] = function (ctx) {
    A.ui.history.clear();
    A.ui.toast.info('История изменений очищена');
    if (ctx && ctx.refresh) ctx.refresh(ctx.activeSection ? ctx.activeSection() : 'profiles');
  };

  handlers['wallpaper-upload'] = function (ctx) {
    var input = el('input', { type: 'file', accept: 'image/*' });
    input.style.display = 'none';
    document.body.appendChild(input);

    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (!file) { if (input.parentNode) document.body.removeChild(input); return; }

      if (!/^image\//.test(file.type)) {
        A.ui.toast.error('Нужен файл изображения');
        if (input.parentNode) document.body.removeChild(input);
        return;
      }
      if (file.size > 12 * 1024 * 1024) {
        A.ui.toast.error('Файл больше 12 МБ — возьмите картинку поменьше');
        if (input.parentNode) document.body.removeChild(input);
        return;
      }

      var reader = new FileReader();
      reader.onload = function () {
        var dataUrl = String(reader.result);
        A.ui.state.setMany({
          'wallpaper.enabled': true,
          'wallpaper.source': 'data',
          'wallpaper.dataUrl': dataUrl
        });
        A.ui.toast.ok('Фон установлен: ' + file.name + ' (' + Math.round(file.size / 1024) + ' КБ)');
        ctx.refresh('theme');
        if (input.parentNode) document.body.removeChild(input);
      };
      reader.onerror = function () {
        A.ui.toast.error('Не удалось прочитать файл');
        if (input.parentNode) document.body.removeChild(input);
      };
      reader.readAsDataURL(file);
    });

    input.click();
  };

  handlers['wallpaper-clear'] = function (ctx) {
    A.ui.state.setMany({
      'wallpaper.enabled': false,
      'wallpaper.url': '',
      'wallpaper.dataUrl': ''
    });
    A.ui.toast.info('Фоновое изображение убрано');
    ctx.refresh('theme');
  };

  handlers['reset-all'] = function (ctx) {
    confirmDanger('Сбросить все настройки?', 'Будут удалены тема, правила элементов, свой CSS и JS. Профили останутся.', function () {
      A.ui.state.reset().then(function (config) {
        A.ui.state.replace(config);
        ctx.refreshAll();
        A.ui.toast.ok('Настройки сброшены');
      }).catch(function (e) {
        A.ui.toast.error('Сброс не удался: ' + ((e && e.message) || e));
      });
    });
  };

  function run(actionId, ctx) {
    var fn = handlers[actionId];
    if (!fn) { A.ui.toast.error('Неизвестное действие: ' + actionId); return; }
    fn(ctx);
  }

  function suggestName() {
    var preset = A.ui.state.get('theme.preset');
    return 'Профиль ' + (preset === 'custom' ? '' : preset + ' ') + new Date().toLocaleDateString('ru-RU');
  }

  function stamp() {
    var d = new Date();
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes());
  }

  function download(text, filename, mime) {
    var blob = new Blob([text], { type: (mime || 'text/plain') + ';charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = el('a', { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  function promptName(title, initial, onDone) {
    var name = window.prompt(title, initial || '');
    onDone(name == null ? null : String(name).trim());
  }

  function confirmDanger(title, message, onYes) {
    if (window.confirm(title + '\n\n' + message)) onYes();
  }

  return { run: run, handlers: handlers, download: download, stamp: stamp };
});
