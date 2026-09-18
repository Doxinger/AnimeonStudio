AONC.define('dom.style', function (A) {
  'use strict';

  function setVar(el, name, value) {
    if (!el || !el.style) return;
    if (value == null || value === '') el.style.removeProperty(name);
    else el.style.setProperty(name, String(value));
  }

  function setVars(el, map) {
    Object.keys(map || {}).forEach(function (k) { setVar(el, k, map[k]); });
  }

  function getVar(el, name) {
    if (!el || typeof getComputedStyle !== 'function') return '';
    return getComputedStyle(el).getPropertyValue(name).trim();
  }

  function setStyle(el, prop, value, important) {
    if (!el || !el.style) return;
    if (value == null || value === '') el.style.removeProperty(prop);
    else el.style.setProperty(prop, String(value), important ? 'important' : '');
  }

  function toggleClass(el, name, on) {
    if (!el || !el.classList) return;
    if (on) el.classList.add(name);
    else el.classList.remove(name);
  }

  function toggleClasses(el, names, on) {
    (names || []).forEach(function (n) { toggleClass(el, n, on); });
  }

  function setAttr(el, name, value) {
    if (!el) return;
    if (value == null || value === false) el.removeAttribute(name);
    else el.setAttribute(name, String(value));
  }

  function ensureStyleElement(doc, id) {
    var existing = doc.getElementById(id);
    if (existing && existing.tagName === 'STYLE') return existing;
    var el = doc.createElement('style');
    el.id = id;
    el.setAttribute('data-aonc', '1');
    var host = doc.head || doc.documentElement;
    if (host) host.appendChild(el);
    return el;
  }

  function writeStyle(el, css) {
    if (!el) return;
    if (el.textContent === css) return;
    el.textContent = css;
  }

  function removeElement(el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  return {
    setVar: setVar,
    setVars: setVars,
    getVar: getVar,
    setStyle: setStyle,
    toggleClass: toggleClass,
    toggleClasses: toggleClasses,
    setAttr: setAttr,
    ensureStyleElement: ensureStyleElement,
    writeStyle: writeStyle,
    removeElement: removeElement
  };
});
