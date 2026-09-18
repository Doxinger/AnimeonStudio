AONC.define('content.tweaks.posters', function (A) {
  'use strict';

  var SITE = A.config.selectors.site;
  var MARK = 'data-aonc-poster';

  var state = { observer: null, quality: 0, width: 0 };

  function rewriteUrl(url, quality, width) {
    if (!url || url.indexOf(SITE.posterCdn) === -1) return null;
    var pattern = SITE.posterTransformPattern;
    if (!pattern.test(url)) return null;

    return url.replace(pattern, function (match, resize, q) {
      var nextResize = width > 0 ? String(width) : resize;
      var nextQuality = quality > 0 ? String(quality) : q;
      if (nextResize === resize && nextQuality === q) return match;
      return 'ioss(resize=' + nextResize + ',quality=' + nextQuality + ')';
    });
  }

  function rewriteAttribute(img, attr, quality, width) {
    var value = img.getAttribute(attr);
    if (!value) return false;

    if (attr === 'srcset') {
      var changed = false;
      var next = value.split(',').map(function (part) {
        var trimmed = part.trim();
        var spaceIdx = trimmed.search(/\s+\d+w$/);
        var url = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx);
        var descriptor = spaceIdx === -1 ? '' : trimmed.slice(spaceIdx);
        var replaced = rewriteUrl(url, quality, width);
        if (replaced && replaced !== url) { changed = true; return replaced + descriptor; }
        return trimmed;
      }).join(', ');
      if (changed) img.setAttribute(attr, next);
      return changed;
    }

    var replacedSingle = rewriteUrl(value, quality, width);
    if (replacedSingle && replacedSingle !== value) {
      img.setAttribute(attr, replacedSingle);
      return true;
    }
    return false;
  }

  function processImage(img) {
    if (img.getAttribute(MARK) === state.quality + ':' + state.width) return false;
    var changed = false;
    changed = rewriteAttribute(img, 'srcset', state.quality, state.width) || changed;
    changed = rewriteAttribute(img, 'src', state.quality, state.width) || changed;
    if (changed || state.quality || state.width) img.setAttribute(MARK, state.quality + ':' + state.width);
    return changed;
  }

  function scan(root) {
    if (!state.quality && !state.width) return;
    var images = (root || document).querySelectorAll('img');
    for (var i = 0; i < images.length; i++) processImage(images[i]);
  }

  function watch() {
    if (state.observer) return;
    state.observer = new MutationObserver(function (records) {
      if (!state.quality && !state.width) return;
      for (var i = 0; i < records.length; i++) {
        var record = records[i];
        if (record.type === 'childList') {
          record.addedNodes.forEach(function (node) {
            if (node.nodeType !== 1) return;
            if (node.tagName === 'IMG') processImage(node);
            scan(node);
          });
        } else if (record.type === 'attributes' && record.target.tagName === 'IMG') {
          if (record.target.getAttribute(MARK)) return;
          processImage(record.target);
        }
      }
    });
    state.observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'srcset']
    });
  }

  function apply(config) {
    var perf = config.performance || {};
    state.quality = Math.round(A.lang.clamp(perf.posterQuality || 0, 0, 100));
    state.width = Math.round(A.lang.clamp(perf.posterResizeWidth || 0, 0, 2000));

    if (!state.quality && !state.width) {
      stop();
      return;
    }
    watch();
    scan(document);
  }

  function stop() {
    if (state.observer) {
      try { state.observer.disconnect(); } catch (e) {}
      state.observer = null;
    }
    var marked = document.querySelectorAll('img[' + MARK + ']');
    for (var i = 0; i < marked.length; i++) marked[i].removeAttribute(MARK);
    state.quality = 0;
    state.width = 0;
  }

  return { apply: apply, stop: stop, rewriteUrl: rewriteUrl, scan: scan };
});
