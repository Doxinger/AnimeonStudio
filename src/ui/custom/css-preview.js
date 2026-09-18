AONC.define('ui.custom.cssPreview', function (A) {
  'use strict';

  var el = A.ui.controls.el;
  var node = null;
  var area = null;

  function render() {
    node = el('div', { class: 'css-preview' });

    var head = el('div', { class: 'css-head' }, [
      el('b', { text: 'Сгенерированный CSS' }),
      el('span', { class: 'sp' }),
      el('span', { class: 'badge', id: 'css-size' }),
      el('button', { class: 'mini', type: 'button', text: '↻', title: 'Пересобрать', onclick: refresh }),
      el('button', { class: 'mini', type: 'button', text: '⧉', title: 'Скопировать', onclick: copy }),
      el('button', { class: 'mini', type: 'button', text: '⇩', title: 'Скачать .css', onclick: download })
    ]);

    area = el('textarea', {
      class: 'mono code css-area', rows: '18', spellcheck: 'false', readonly: 'readonly'
    });

    node.appendChild(head);
    node.appendChild(area);
    refresh();
    return node;
  }

  function currentCss() {
    var result = A.cssBuilder.build(A.ui.state.current(), '/');
    return result;
  }

  function refresh() {
    if (!area) return;
    var result = currentCss();
    area.value = result.css || '/* Расширение выключено */';
    var size = document.getElementById('css-size');
    if (size) {
      var kb = (result.css.length / 1024).toFixed(1);
      size.textContent = kb + ' КБ · частей: ' + result.sections.filter(function (s) { return s.css; }).length;
    }
    if (result.stats && result.stats.errors && result.stats.errors.length) {
      A.ui.toast.error('Ошибка сборки CSS: ' + result.stats.errors.map(function (e) { return e.part; }).join(', '));
    }
  }

  function copy() {
    var text = area ? area.value : '';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { A.ui.toast.ok('CSS скопирован'); }, fallback);
    } else fallback();

    function fallback() {
      if (!area) return;
      area.removeAttribute('readonly');
      area.select();
      try { document.execCommand('copy'); A.ui.toast.ok('CSS скопирован'); }
      catch (e) { A.ui.toast.error('Не удалось скопировать'); }
      area.setAttribute('readonly', 'readonly');
    }
  }

  function download() {
    var text = area ? area.value : '';
    var blob = new Blob([text], { type: 'text/css;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = el('a', { href: url, download: 'animeon-studio.css' });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  return { render: render, refresh: refresh, currentCss: currentCss };
});
