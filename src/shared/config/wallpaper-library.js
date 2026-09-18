AONC.define('config.wallpapers', function (A) {
  'use strict';

  function svg(body, w, h) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + (w || 80) + '" height="' + (h || 80) + '" viewBox="0 0 ' + (w || 80) + ' ' + (h || 80) + '">' + body + '</svg>';
  }

  var LIB = [
    {
      id: 'aurora', name: 'Aurora', group: 'Градиенты', kind: 'gradient',
      value: 'radial-gradient(1100px 700px at 15% 8%, rgba(124,77,255,0.42) 0%, transparent 60%),' +
        'radial-gradient(900px 620px at 85% 22%, rgba(34,211,238,0.30) 0%, transparent 58%),' +
        'radial-gradient(1200px 800px at 50% 100%, rgba(255,77,157,0.18) 0%, transparent 62%),' +
        'linear-gradient(180deg, #07070d 0%, #0a0a12 100%)'
    },
    {
      id: 'sunset', name: 'Sunset', group: 'Градиенты', kind: 'gradient',
      value: 'radial-gradient(1000px 640px at 78% 6%, rgba(255,122,69,0.40) 0%, transparent 60%),' +
        'radial-gradient(820px 560px at 18% 30%, rgba(255,77,157,0.26) 0%, transparent 58%),' +
        'linear-gradient(180deg, #120a0c 0%, #0b0709 100%)'
    },
    {
      id: 'nebula', name: 'Nebula', group: 'Градиенты', kind: 'gradient',
      value: 'radial-gradient(760px 520px at 30% 20%, rgba(167,139,250,0.34) 0%, transparent 55%),' +
        'radial-gradient(640px 460px at 70% 60%, rgba(96,165,250,0.26) 0%, transparent 55%),' +
        'radial-gradient(520px 420px at 50% 90%, rgba(244,114,182,0.20) 0%, transparent 60%),' +
        'linear-gradient(180deg, #08080f 0%, #05050a 100%)'
    },
    {
      id: 'ocean', name: 'Ocean', group: 'Градиенты', kind: 'gradient',
      value: 'radial-gradient(1000px 700px at 50% 110%, rgba(13,148,136,0.36) 0%, transparent 62%),' +
        'radial-gradient(700px 480px at 12% 12%, rgba(34,211,238,0.20) 0%, transparent 55%),' +
        'linear-gradient(180deg, #04121a 0%, #030a10 100%)'
    },
    {
      id: 'forest', name: 'Forest', group: 'Градиенты', kind: 'gradient',
      value: 'radial-gradient(900px 620px at 22% 88%, rgba(16,185,129,0.28) 0%, transparent 60%),' +
        'radial-gradient(700px 500px at 82% 16%, rgba(132,204,22,0.16) 0%, transparent 55%),' +
        'linear-gradient(180deg, #06110c 0%, #040a07 100%)'
    },
    {
      id: 'ember', name: 'Ember', group: 'Градиенты', kind: 'gradient',
      value: 'radial-gradient(860px 600px at 50% 108%, rgba(250,189,47,0.26) 0%, transparent 60%),' +
        'radial-gradient(640px 460px at 84% 40%, rgba(240,82,79,0.22) 0%, transparent 55%),' +
        'linear-gradient(180deg, #120b06 0%, #0a0704 100%)'
    },
    {
      id: 'mono', name: 'Mono', group: 'Градиенты', kind: 'gradient',
      value: 'radial-gradient(900px 640px at 50% 0%, rgba(255,255,255,0.10) 0%, transparent 60%),' +
        'linear-gradient(180deg, #101014 0%, #08080a 100%)'
    },
    {
      id: 'grid', name: 'Сетка', group: 'Узоры', kind: 'svg',
      value: svg('<path d="M80 0H0V80" fill="none" stroke="#ffffff" stroke-opacity="0.07" stroke-width="1"/>', 80, 80)
    },
    {
      id: 'dots', name: 'Точки', group: 'Узоры', kind: 'svg',
      value: svg('<circle cx="12" cy="12" r="1.6" fill="#ffffff" fill-opacity="0.10"/>', 24, 24)
    },
    {
      id: 'diagonal', name: 'Диагональ', group: 'Узоры', kind: 'svg',
      value: svg('<path d="M-8 8 L8 -8 M0 24 L24 0 M16 32 L32 16" stroke="#ffffff" stroke-opacity="0.06" stroke-width="1.4"/>', 32, 32)
    },
    {
      id: 'waves', name: 'Волны', group: 'Узоры', kind: 'svg',
      value: svg('<path d="M0 40 Q 20 24 40 40 T 80 40" fill="none" stroke="#8b5cf6" stroke-opacity="0.16" stroke-width="1.6"/>', 80, 80)
    },
    {
      id: 'hex', name: 'Соты', group: 'Узоры', kind: 'svg',
      value: svg('<path d="M40 6 L68 22 V54 L40 70 L12 54 V22 Z" fill="none" stroke="#22d3ee" stroke-opacity="0.12" stroke-width="1.4"/>', 80, 76)
    },
    {
      id: 'stars', name: 'Звёзды', group: 'Узоры', kind: 'svg',
      value: svg(
        '<circle cx="14" cy="22" r="1.1" fill="#fff" fill-opacity="0.5"/>' +
        '<circle cx="52" cy="10" r="0.8" fill="#fff" fill-opacity="0.35"/>' +
        '<circle cx="86" cy="44" r="1.3" fill="#fff" fill-opacity="0.45"/>' +
        '<circle cx="34" cy="70" r="0.9" fill="#fff" fill-opacity="0.3"/>' +
        '<circle cx="104" cy="86" r="1.1" fill="#fff" fill-opacity="0.4"/>' +
        '<circle cx="70" cy="104" r="0.7" fill="#fff" fill-opacity="0.3"/>',
        120, 120)
    },
    {
      id: 'topo', name: 'Топография', group: 'Узоры', kind: 'svg',
      value: svg(
        '<g fill="none" stroke="#a78bfa" stroke-opacity="0.10" stroke-width="1.2">' +
        '<circle cx="60" cy="60" r="14"/><circle cx="60" cy="60" r="26"/>' +
        '<circle cx="60" cy="60" r="38"/><circle cx="60" cy="60" r="50"/></g>',
        120, 120)
    }
  ];

  var byId = {};
  LIB.forEach(function (p) { byId[p.id] = p; });

  function get(id) {
    return byId[id] || null;
  }

  function svgDataUri(markup) {
    return 'url("data:image/svg+xml,' + encodeURIComponent(markup) + '")';
  }

  function cssValue(preset) {
    if (!preset) return '';
    return preset.kind === 'gradient' ? preset.value : svgDataUri(preset.value);
  }

  function valueFor(wallpaper) {
    if (!wallpaper) return '';
    if (wallpaper.source === 'preset') {
      var p = get(wallpaper.preset);
      return p ? cssValue(p) : '';
    }
    var src = wallpaper.source === 'data' ? String(wallpaper.dataUrl || '').trim() : String(wallpaper.url || '').trim();
    if (!src) return '';
    return 'url("' + src.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '")';
  }

  function groups() {
    var out = [];
    LIB.forEach(function (p) {
      var g = out.filter(function (x) { return x.label === p.group; })[0];
      if (!g) { g = { label: p.group, items: [] }; out.push(g); }
      g.items.push(p);
    });
    return out;
  }

  function defaultsFor(presetId) {
    var p = get(presetId);
    if (!p) return {};
    if (p.kind === 'svg') {
      return { size: 'auto', repeat: 'repeat', overlay: 30, blur: 0 };
    }
    return { size: 'cover', repeat: 'no-repeat', overlay: 35, blur: 0 };
  }

  return {
    LIB: LIB,
    byId: byId,
    get: get,
    groups: groups,
    cssValue: cssValue,
    svgDataUri: svgDataUri,
    valueFor: valueFor,
    defaultsFor: defaultsFor
  };
});
