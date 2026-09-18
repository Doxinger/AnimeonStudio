AONC.define('ui.custom.cosmeticsHub', function (A) {
  'use strict';

  var el = A.ui.controls.el;

  function render(def, ctx) {
    var wrap = el('div', { class: 'cosmetics-hub' });
    wrap.appendChild(A.ui.custom.badgeEditor(def, ctx));
    wrap.appendChild(el('div', { class: 'hub-sep' }));
    wrap.appendChild(A.ui.custom.titlesEditor(def, ctx));
    wrap.appendChild(el('div', { class: 'hub-sep' }));
    wrap.appendChild(A.ui.custom.framesEditor(def, ctx));
    wrap.appendChild(el('div', { class: 'hub-sep' }));
    wrap.appendChild(A.ui.custom.profileFxEditor(def, ctx));
    wrap.appendChild(el('div', { class: 'hub-sep' }));
    wrap.appendChild(A.ui.custom.showcaseEditor(def, ctx));
    wrap.appendChild(el('div', { class: 'hub-sep' }));
    wrap.appendChild(A.ui.custom.loadoutsEditor(def, ctx));
    return wrap;
  }

  return { render: render };
});
