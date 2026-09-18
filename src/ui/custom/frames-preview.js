AONC.define('ui.custom.framesPreview', function (A) {
  'use strict';

  var el = A.ui.controls.el;

  function initials(name) {
    var text = String(name || '').trim();
    if (!text) return 'GO';
    var letters = text.replace(/[^\p{L}\p{N}]/gu, '');
    if (!letters) return text.slice(0, 2).toUpperCase();
    return Array.from(letters).slice(0, 2).join('').toUpperCase();
  }

  function avatarNode(opts) {
    var o = opts || {};
    var size = Math.max(24, A.lang.num(o.size, 72));
    var inner = o.url
      ? el('img', { class: 'fps-img', src: o.url, alt: '' })
      : el('span', { class: 'fps-initials', text: initials(o.name) });
    return el('span', {
      class: 'fps-avatar',
      style: 'width:' + size + 'px;height:' + size + 'px;'
    }, [inner]);
  }

  function frameNode(frame, face) {
    var item = frame.frameId ? A.config.framesLib.byId(frame.frameId) : null;
    var plan = A.config.framesGeometry.plan(frame, item, face);
    var type = item ? item.type : (String(frame.url || '').trim() ? 'image' : frame.type);

    if (type !== 'image') {
      return el('span', {
        class: 'fps-ring' + (type === 'rainbow' ? ' rainbow' : ''),
        style: A.config.framesRings.styleFor(item || { type: type }, {
          size: plan.face,
          color: item ? item.color : '#7C4DFF',
          width: 10,
          offset: 2,
          glow: plan.glow,
          opacity: plan.opacity * 100,
          ox: plan.ox,
          oy: plan.oy
        })
      });
    }

    var src = String(frame.url || '').trim() || (item ? item.url : '');
    if (!src) return null;
    return el('img', {
      class: 'fps-frame',
      src: src,
      alt: '',
      style: 'width:' + plan.composite + 'px;height:' + plan.composite + 'px;' +
        '--aonc-fx:' + plan.ox + 'px;--aonc-fy:' + plan.oy + 'px;' +
        'opacity:' + plan.opacity.toFixed(2) + ';' +
        (plan.glow > 0 ? 'filter:drop-shadow(0 0 ' + plan.glow + 'px rgba(124,77,255,.5));' : '')
    });
  }

  function stage(opts) {
    var o = opts || {};
    var face = Math.max(28, A.lang.num(o.face, 72));
    var frames = (o.frames || []).map(function (f) {
      return A.lang.normalize(A.config.defaults.frame, f);
    }).filter(function (f) {
      return f.enabled !== false && (!!f.frameId || !!String(f.url || '').trim());
    });

    var maxScale = frames.reduce(function (acc, f) {
      var item = f.frameId ? A.config.framesLib.byId(f.frameId) : null;
      return Math.max(acc, A.config.framesGeometry.scaleOf(item, f.scale));
    }, 1);

    var box = Math.ceil(face * maxScale) + 12;
    var nodes = [avatarNode({ size: face, url: o.avatarUrl, name: o.nickname })];
    frames.forEach(function (f) {
      var node = frameNode(f, face);
      if (node) nodes.push(node);
    });

    return el('div', {
      class: 'frame-stage' + (frames.length ? '' : ' empty'),
      style: 'width:' + box + 'px;height:' + box + 'px;'
    }, nodes);
  }

  function mock(opts) {
    var o = opts || {};
    var frames = o.frames || [];
    return el('div', { class: 'frame-mock' }, [
      stage({ face: o.face || 72, frames: frames, avatarUrl: o.avatarUrl, nickname: o.nickname }),
      el('div', { class: 'frame-mock-meta' }, [
        el('b', { text: o.nickname || 'Гость' }),
        el('span', {
          text: frames.length
            ? frames.map(function (f) { return f.name || A.config.framesLib.byId(f.frameId) && A.config.framesLib.byId(f.frameId).name || 'Рамка'; }).join(' + ')
            : 'Без рамки'
        })
      ])
    ]);
  }

  return { stage: stage, mock: mock, avatarNode: avatarNode, frameNode: frameNode, initials: initials };
});
