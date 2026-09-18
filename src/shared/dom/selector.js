AONC.define('dom.selector', function (A) {
  'use strict';

  var esc = A.css.units.cssEscapeIdent;
  var escapeString = A.css.units.escapeString;

  var TAILWIND_UTILITY = /^(?:[a-z]+:)*(?:!?-)?(?:[a-z]+(?:-[a-z0-9.]+)*)(?:\/[\d.]+)?$/i;
  var SITE_PREFIX = /^(aon|bpp|hero|shiki|kinopoisk|swiper|embla|radix)/i;
  var STRUCTURAL = /^(container|group|lucide|prose|sr-only|antialiased)$/i;

  function isStableClass(name) {
    if (!name) return false;
    if (/[\/:[\]()#,!>%+~*@]/.test(name)) return false;
    if (/^\d/.test(name)) return false;
    if (SITE_PREFIX.test(name)) return true;
    if (STRUCTURAL.test(name)) return true;
    if (TAILWIND_UTILITY.test(name)) return false;
    return name.length > 4;
  }

  function isUnique(selector, root) {
    try {
      return (root || document).querySelectorAll(selector).length === 1;
    } catch (e) {
      return false;
    }
  }

  function isValid(selector) {
    try {
      document.querySelector(selector);
      return true;
    } catch (e) {
      return false;
    }
  }

  function describe(el, root) {
    var tag = el.tagName.toLowerCase();
    if (tag === 'html') return 'html';
    if (tag === 'body') return 'body';

    if (el.id && /^[A-Za-z][\w:-]*$/.test(el.id)) return tag + '#' + esc(el.id);

    var attrs = [];
    var aria = el.getAttribute('aria-label');
    if (aria && aria.length <= 60) attrs.push('[aria-label="' + escapeString(aria) + '"]');

    var testId = el.getAttribute('data-testid');
    if (testId) attrs.push('[data-testid="' + escapeString(testId) + '"]');

    if (tag === 'a') {
      var href = el.getAttribute('href');
      if (href && href.length <= 90 && href.charAt(0) !== '#') attrs.push('[href="' + escapeString(href) + '"]');
    }
    if (tag === 'img') {
      var alt = el.getAttribute('alt');
      if (alt && alt.length <= 40) attrs.push('[alt="' + escapeString(alt) + '"]');
    }
    if (tag === 'input' || tag === 'textarea' || tag === 'select') {
      var nm = el.getAttribute('name');
      if (nm) attrs.push('[name="' + escapeString(nm) + '"]');
      var ph = el.getAttribute('placeholder');
      if (ph && ph.length <= 40) attrs.push('[placeholder="' + escapeString(ph) + '"]');
    }

    var stable = [];
    if (el.classList) {
      for (var i = 0; i < el.classList.length && stable.length < 2; i++) {
        if (isStableClass(el.classList[i])) stable.push('.' + esc(el.classList[i]));
      }
    }

    var candidates = [
      tag + attrs.join('') + stable.join(''),
      tag + stable.join(''),
      tag + attrs.join('')
    ];

    for (var c = 0; c < candidates.length; c++) {
      if (candidates[c] !== tag && isUnique(candidates[c], root)) return candidates[c];
    }

    var parent = el.parentElement;
    if (!parent) return candidates[0] || tag;

    var siblings = Array.prototype.filter.call(parent.children, function (s) {
      return s.tagName === el.tagName;
    });
    if (siblings.length > 1) return tag + ':nth-of-type(' + (siblings.indexOf(el) + 1) + ')';

    return candidates[0] || tag;
  }

  function path(el, options) {
    var opts = options || {};
    var maxDepth = opts.maxDepth == null ? 10 : opts.maxDepth;
    if (!el || el.nodeType !== 1) return '';

    var doc = el.ownerDocument || document;
    if (el === doc.documentElement) return 'html';
    if (el === doc.body) return 'body';

    if (el.id && /^[A-Za-z][\w:-]*$/.test(el.id)) {
      var idSelector = '#' + esc(el.id);
      if (isUnique(idSelector, doc)) return idSelector;
    }

    var segments = [];
    var node = el;
    var depth = 0;

    while (node && node.nodeType === 1 && node !== doc.documentElement && depth++ < maxDepth) {
      segments.unshift(describe(node, doc));
      var candidate = segments.join(' > ');
      if (isUnique(candidate, doc)) return candidate;
      if (node.id || node === doc.body) break;
      node = node.parentElement;
    }

    return segments.join(' > ');
  }

  function shortPath(el) {
    return path(el, { maxDepth: 4 });
  }

  function countMatches(selector, root) {
    try {
      return (root || document).querySelectorAll(selector).length;
    } catch (e) {
      return 0;
    }
  }

  function describeForRule(el) {
    return {
      selector: path(el),
      shortSelector: shortPath(el),
      matches: countMatches(path(el))
    };
  }

  return {
    isStableClass: isStableClass,
    isUnique: isUnique,
    isValid: isValid,
    describe: describe,
    path: path,
    shortPath: shortPath,
    countMatches: countMatches,
    describeForRule: describeForRule
  };
});
