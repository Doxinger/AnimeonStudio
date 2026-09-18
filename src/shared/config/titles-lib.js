AONC.define('config.titlesLib', function (A) {
  'use strict';

  var data = A.config.titlesData;

  var remote = { items: [], at: 0, count: 0 };

  // Редкости — те же, что у рамок (общие подписи и цвета).
  function RARITIES() {
    return A.config.framesLib.RARITIES;
  }

  var SOURCES = [
    { id: 'leaderboard', label: 'За место в топе' },
    { id: 'event', label: 'За ивент' },
    { id: 'promo', label: 'За акцию' },
    { id: 'grant', label: 'Особая выдача' },
    { id: 'referral', label: 'Рефералка' },
    { id: 'secret', label: 'Особое условие' },
    { id: 'achievement', label: 'Достижение' },
    { id: 'premium', label: 'Premium' },
    { id: 'shop', label: 'Магазин' },
    { id: 'free', label: 'Доступно всем' }
  ];

  var RARITY_ORDER = { common: 0, rare: 1, epic: 2, legendary: 3, mythic: 4 };

  // Иконки титулов приходят в разных нотациях: lucide PascalCase (Crown),
  // iconify с префиксом (gi:mushrooms, ph:microphone-fill, tb:north-star)
  // и с анимацией через @ (Church@sparkle-pop). Приводим к ключам icons-data.
  var ICON_ALIAS = {
    anchor: 'anchor', banana: 'banana', beer: 'beer', brush: 'brush', church: 'church',
    crosshair: 'crosshair', crown: 'crown', egg: 'egg', eye: 'eye', eyeoff: 'eye-off',
    'eye-off': 'eye-off', feather: 'feather', ghost: 'ghost', heart: 'heart',
    heartcrack: 'heart-crack', 'heart-crack': 'heart-crack', key: 'key', moon: 'moon',
    partypopper: 'party-popper', 'party-popper': 'party-popper', skull: 'skull',
    star: 'star', sword: 'sword', swords: 'swords', mushrooms: 'mushroom',
    mushroom: 'mushroom', raven: 'crow', crow: 'crow', bird: 'crow',
    microphone: 'mic', 'microphone-fill': 'mic', mic: 'mic',
    'north-star': 'sparkles', asterisk: 'sparkles', sparkle: 'sparkles', sparkles: 'sparkles'
  };

  function iconKey(raw) {
    var s = String(raw || '').trim();
    if (!s) return 'star';
    s = s.split('@')[0];                       // анимация иконки
    s = s.replace(/^[a-z0-9_-]+:/i, '');       // iconify-префикс gi:/ph:/tb:
    var kebab = s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    var alias = ICON_ALIAS[kebab.replace(/-/g, '')] || ICON_ALIAS[kebab];
    return alias || kebab || 'star';
  }

  // Анимации сайта → наш набор FX-классов. Сайт отдаёт список тегов с
  // параметрами («glow:sz=1.35», «comet-burst:op=0.6»); берём первый
  // поддерживаемый тег — он у сайта главный. Экзотика маппится на ближайший
  // аналог, неизвестное — без анимации.
  var FX = {
    'glow': 'glow',
    'border-glow': 'border-glow',
    'border-circuit': 'border-glow',
    'pulse': 'pulse',
    'sound-equalizer': 'pulse',
    'shimmer': 'shimmer',
    'foil-stamp': 'shimmer',
    'neon-trace': 'neon-trace',
    'bubbles': 'bubbles',
    'bokeh-field': 'bubbles',
    'pixel-rain': 'pixel-rain',
    'rain-on-glass': 'pixel-rain',
    'corner-brackets': 'corner-brackets',
    'electric': 'electric',
    'glitch-storm': 'electric',
    'chromatic-aberration': 'electric',
    'ember-trail': 'ember',
    'spirit-flame': 'ember',
    'comet-burst': 'sparkle',
    'confetti-burst': 'sparkle',
    'sakura-storm': 'sparkle',
    'sparkle': 'sparkle',
    'float-up': 'float',
    'constellation': 'nebula',
    'nebula': 'nebula',
    'hologram-scan': 'scan',
    'frosted-glass': 'frost',
    'hyperspace-warp': 'warp',
    'crystal-grow': 'warp'
  };

  function parseAnim(raw) {
    var list = Array.isArray(raw) ? raw : String(raw || '').split(',');
    for (var i = 0; i < list.length; i++) {
      var tag = String(list[i] || '').trim();
      if (!tag) continue;
      var parts = tag.split(':');
      var base = parts[0].split('@')[0].trim();
      var fx = FX[base];
      if (!fx) continue;
      var params = { sz: 1, sp: 1, op: 1 };
      for (var j = 1; j < parts.length; j++) {
        var kv = parts[j].split('=');
        if (kv.length !== 2) continue;
        var key = kv[0].trim();
        var num = parseFloat(kv[1]);
        if (key === 'sz' || key === 'sp' || key === 'op') {
          if (!isNaN(num) && num > 0) params[key] = A.lang.clamp(num, 0.25, 3);
        }
      }
      return { fx: fx, params: params, tag: base };
    }
    return { fx: '', params: { sz: 1, sp: 1, op: 1 }, tag: '' };
  }

  function rgbaOr(fallback) {
    return function (value, def) {
      var v = String(value || '').trim();
      return v || def || fallback;
    };
  }

  var colorOr = rgbaOr('');

  function normalizeItem(raw) {
    if (!raw || typeof raw !== 'object' || !raw.id) return null;
    var rarity = RARITY_ORDER[raw.rarity] == null ? 'common' : raw.rarity;
    return {
      id: String(raw.id),
      name: String(raw.name || raw.id),
      rarity: rarity,
      source: String(raw.source || ''),
      label: String(raw.label || raw.source_label || ''),
      unlocked: !!raw.unlocked,
      order: A.lang.num(raw.order != null ? raw.order : raw.sort_order, 0),
      bg: colorOr(raw.bg, 'rgba(124, 77, 255, 0.10)'),
      border: colorOr(raw.border, 'rgba(124, 77, 255, 0.32)'),
      color: colorOr(raw.color, '#ffffff'),
      glow: colorOr(raw.glow, 'rgba(124, 77, 255, 0.45)'),
      gradFrom: String(raw.gradFrom || raw.badge_gradient_from || '').trim(),
      gradTo: String(raw.gradTo || raw.badge_gradient_to || '').trim(),
      icon: String(raw.icon || raw.badge_icon || '').trim(),
      anims: Array.isArray(raw.anims)
        ? raw.anims.slice()
        : String(raw.anims != null ? raw.anims : (raw.badge_animation || '')).split(',').map(function (s) { return s.trim(); }).filter(Boolean),
      desc: String(raw.desc || raw.description || '').trim(),
      remote: !!raw.remote
    };
  }

  function all() {
    var out = data.TITLES.slice();
    if (remote.items && remote.items.length) {
      var seen = {};
      out.forEach(function (t) { seen[t.id] = true; });
      // удалённый каталог свежее запечённого: тот же id заменяем, новый добавляем
      out = out.map(function (t) {
        var fresh = remote.items.filter(function (r) { return r && r.id === t.id; })[0];
        return fresh || t;
      });
      remote.items.forEach(function (t) {
        if (t && t.id && !seen[t.id]) out.push(t);
      });
    }
    return out.map(function (item) {
      return normalizeItem(item) || item;
    }).filter(Boolean);
  }

  function byId(id) {
    var key = String(id || '');
    if (!key) return null;
    var list0 = all();
    for (var i = 0; i < list0.length; i++) if (list0[i].id === key) return list0[i];
    return null;
  }

  function sortItems(list) {
    return list.slice().sort(function (a, b) {
      if (a.order !== b.order) return a.order - b.order;
      return String(a.name).localeCompare(String(b.name), 'ru');
    });
  }

  function list(opts) {
    var o = opts || {};
    var q = String(o.query || '').trim().toLowerCase();
    var out = all().filter(function (t) {
      if (o.rarity && o.rarity !== 'any' && t.rarity !== o.rarity) return false;
      if (o.source && o.source !== 'any' && t.source !== o.source) return false;
      if (o.unlockedOnly && !t.unlocked) return false;
      if (q) {
        var hay = (t.name + ' ' + t.id + ' ' + t.label + ' ' + t.desc).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    if (o.sort === 'rarity') {
      out.sort(function (a, b) {
        var d = (RARITY_ORDER[b.rarity] || 0) - (RARITY_ORDER[a.rarity] || 0);
        return d !== 0 ? d : a.order - b.order;
      });
    } else if (o.sort === 'name') {
      out.sort(function (a, b) { return String(a.name).localeCompare(String(b.name), 'ru'); });
    } else {
      out = sortItems(out);
    }
    return out;
  }

  function rarity(id) {
    return A.config.framesLib.rarity(id);
  }

  function sourceLabel(id) {
    for (var i = 0; i < SOURCES.length; i++) if (SOURCES[i].id === id) return SOURCES[i].label;
    return id ? String(id) : '';
  }

  function counts() {
    var list0 = all();
    var byRarity = {};
    RARITIES().forEach(function (r) { byRarity[r.id] = 0; });
    list0.forEach(function (t) { byRarity[t.rarity] = (byRarity[t.rarity] || 0) + 1; });
    return {
      total: list0.length,
      unlocked: list0.filter(function (t) { return t.unlocked; }).length,
      remote: (remote.items || []).length,
      at: remote.at || 0,
      byRarity: byRarity
    };
  }

  function makeEntry(item) {
    var base = item || {};
    return A.lang.normalize(A.config.defaults.title, {
      id: A.lang.uid('title'),
      titleId: base.id || '',
      anim: 'site',
      enabled: true
    });
  }

  function setRemote(payload) {
    var items = ((payload && payload.items) || []).map(function (raw) {
      var item = normalizeItem(raw);
      if (item) item.remote = true;
      return item;
    }).filter(Boolean);
    remote = { items: items, at: (payload && payload.at) || Date.now(), count: items.length };
    return remote.count;
  }

  function getRemote() {
    return { items: remote.items.slice(), at: remote.at, count: remote.count };
  }

  function resetRuntime() {
    remote = { items: [], at: 0, count: 0 };
  }

  function fromApi(rawList) {
    return (rawList || []).map(function (t) {
      if (!t || !t.id) return null;
      return normalizeItem({
        id: t.id,
        name: t.name,
        rarity: t.rarity,
        source: t.source,
        label: t.source_label,
        unlocked: !!t.unlocked,
        order: t.sort_order,
        bg: t.badge_bg,
        border: t.badge_border,
        color: t.badge_color,
        glow: t.badge_glow,
        gradFrom: t.badge_gradient_from,
        gradTo: t.badge_gradient_to,
        icon: t.badge_icon,
        anims: t.badge_animation,
        desc: t.description || t.source_hint
      });
    }).filter(Boolean);
  }

  // Спец пилюли: всё, что нужно рантайму и студийному превью, чтобы собрать
  // узел один в один (сайт: пилюля с полупрозрачным фоном, рамкой цвета,
  // свечением, градиентным текстом, иконкой и анимацией).
  function pillSpec(item, entry) {
    var t = normalizeItem(item) || {};
    var e = entry || {};
    var anim = parseAnim(t.anims);
    var fx = e.anim === 'none' ? '' : anim.fx;
    var gradient = t.gradFrom && t.gradTo;
    var titleAttr = t.name + ' · ' + rarity(t.rarity).label +
      (t.label ? ' · ' + t.label : '') + (t.unlocked ? '' : ' · на сайте не выдан');
    return {
      id: t.id,
      text: t.name,
      bg: t.bg,
      border: t.border,
      color: t.color,
      glow: t.glow,
      gradient: gradient ? 'linear-gradient(90deg,' + t.gradFrom + ' 0%,' + t.gradTo + ' 100%)' : '',
      icon: iconKey(t.icon),
      fx: fx,
      params: anim.params,
      titleAttr: titleAttr
    };
  }

  function iconSvg(spec, doc) {
    var d = doc || (typeof document !== 'undefined' ? document : null);
    if (!d) return null;
    var icons = (A.ui && A.ui.iconsData) || {};
    var inner = icons[spec.icon] || icons.star || '';
    if (!inner) return null;
    var span = d.createElement('span');
    span.setAttribute('aria-hidden', 'true');
    span.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" ' +
      'style="position:relative;z-index:1;flex-shrink:0;">' + inner + '</svg>';
    return span.firstChild;
  }

  function buildPill(spec, doc) {
    var d = doc || (typeof document !== 'undefined' ? document : null);
    if (!d || !spec) return null;
    var pill = d.createElement('span');
    pill.className = 'aonc-title-pill aon-pause-offscreen' + (spec.fx ? ' at-' + spec.fx : '');
    pill.setAttribute('data-aonc-title', spec.id || '');
    pill.setAttribute('title', spec.titleAttr || spec.text || '');
    pill.style.cssText = 'background:' + spec.bg + ';border-color:' + spec.border + ';color:' + spec.color + ';';
    var p = spec.params || { sz: 1, sp: 1, op: 1 };
    pill.style.setProperty('--at-glow', spec.glow || 'rgba(124,77,255,.45)');
    pill.style.setProperty('--at-border', spec.border || 'rgba(124,77,255,.32)');
    pill.style.setProperty('--at-sz', String(p.sz));
    pill.style.setProperty('--at-sp', String(p.sp));
    pill.style.setProperty('--at-op', String(p.op));

    var svg = iconSvg(spec, d);
    if (svg) pill.appendChild(svg);

    var label = d.createElement('span');
    label.className = 'at-name';
    label.textContent = spec.text || '';
    if (spec.gradient) {
      label.style.cssText = 'background-image:' + spec.gradient + ';background-clip:text;-webkit-background-clip:text;-webkit-text-fill-color:transparent;color:transparent;';
    }
    pill.appendChild(label);
    return pill;
  }

  // Единый стиль пилюли и все FX-анимации — один текст для контент-скрипта
  // и студийного превью. Сайтовая aon-paused-offscreen, html.aonc-no-motion и
  // prefers-reduced-motion гасят движение (как у значка мецената).
  function css() {
    return [
      '.aonc-title-pill{position:relative;display:inline-flex;align-items:center;gap:6px;padding:6px 12px;',
      'border-radius:9999px;border:1px solid transparent;font-size:12px;font-weight:600;line-height:1.1;',
      'user-select:none;isolation:isolate;max-width:100%;min-width:0;overflow:hidden;white-space:nowrap;',
      'vertical-align:middle;transition:transform .15s ease;}',
      '.aonc-title-pill:hover{transform:translateY(-1px);}',
      '.aonc-title-pill .at-name{position:relative;z-index:1;display:inline-block;overflow:hidden;',
      'text-overflow:ellipsis;min-width:0;}',
      '.aonc-title-pill::before,.aonc-title-pill::after{pointer-events:none;}',
      '@keyframes aonc-t-glow{0%,100%{box-shadow:0 0 calc(5px*var(--at-sz,1)) var(--at-glow)}',
      '50%{box-shadow:0 0 calc(15px*var(--at-sz,1)) var(--at-glow),0 0 calc(4px*var(--at-sz,1)) var(--at-glow)}}',
      '.at-glow{animation:aonc-t-glow calc(2.6s/var(--at-sp,1)) ease-in-out infinite}',
      '@keyframes aonc-t-border{0%,100%{border-color:var(--at-border);filter:brightness(1)}',
      '50%{border-color:var(--at-glow);filter:brightness(1.22)}}',
      '.at-border-glow{animation:aonc-t-border calc(2.2s/var(--at-sp,1)) ease-in-out infinite}',
      '@keyframes aonc-t-pulse{0%,100%{transform:scale(1)}50%{transform:scale(calc(1 + .05*var(--at-sz,1)))}}',
      '.at-pulse{animation:aonc-t-pulse calc(1.8s/var(--at-sp,1)) ease-in-out infinite}',
      '@keyframes aonc-t-shimmer{0%,55%{transform:translateX(-140%) skewX(-18deg)}85%,100%{transform:translateX(320%) skewX(-18deg)}}',
      '.at-shimmer::after{content:"";position:absolute;top:-20%;bottom:-20%;left:0;width:38%;',
      'background:linear-gradient(105deg,transparent 0,rgba(255,255,255,.5) 50%,transparent 100%);',
      'transform:translateX(-140%) skewX(-18deg);animation:aonc-t-shimmer calc(4.2s/var(--at-sp,1)) linear infinite}',
      '@keyframes aonc-t-neon{0%,100%{box-shadow:0 0 4px var(--at-glow),0 0 10px var(--at-glow);filter:hue-rotate(0)}',
      '50%{box-shadow:0 0 9px var(--at-glow),0 0 24px var(--at-glow);filter:hue-rotate(28deg)}}',
      '.at-neon-trace{animation:aonc-t-neon calc(2.8s/var(--at-sp,1)) linear infinite}',
      '@keyframes aonc-t-bub{from{background-position-y:100%}to{background-position-y:-100%}}',
      '.at-bubbles::before{content:"";position:absolute;inset:0;border-radius:inherit;',
      'opacity:calc(.6*var(--at-op,1));background-size:100% 200%;',
      'background-image:radial-gradient(circle 1.6px at 20% 30%,rgba(255,255,255,.85) 45%,transparent 50%),',
      'radial-gradient(circle 1.2px at 55% 60%,rgba(255,255,255,.7) 45%,transparent 50%),',
      'radial-gradient(circle 2px at 80% 25%,rgba(255,255,255,.6) 45%,transparent 50%);',
      'animation:aonc-t-bub calc(3.2s/var(--at-sp,1)) linear infinite}',
      '@keyframes aonc-t-rain{from{background-position-y:-100%}to{background-position-y:100%}}',
      '.at-pixel-rain::before{content:"";position:absolute;inset:0;border-radius:inherit;',
      'opacity:calc(.5*var(--at-op,1));background-repeat:repeat-y;background-size:7px 200%,11px 200%;',
      'background-position-x:20%,65%;',
      'background-image:linear-gradient(transparent 40%,rgba(255,255,255,.7) 40%,rgba(255,255,255,.7) 55%,transparent 55%),',
      'linear-gradient(transparent 20%,rgba(255,255,255,.5) 20%,rgba(255,255,255,.5) 30%,transparent 30%);',
      'animation:aonc-t-rain calc(1.6s/var(--at-sp,1)) linear infinite}',
      '@keyframes aonc-t-cb{0%,100%{opacity:calc(.35*var(--at-op,1))}50%{opacity:var(--at-op,1)}}',
      '.at-corner-brackets::after{content:"";position:absolute;inset:0;border-radius:inherit;',
      'background:linear-gradient(var(--at-glow),var(--at-glow)) 0 0/9px 2px no-repeat,',
      'linear-gradient(var(--at-glow),var(--at-glow)) 0 0/2px 9px no-repeat,',
      'linear-gradient(var(--at-glow),var(--at-glow)) 100% 0/9px 2px no-repeat,',
      'linear-gradient(var(--at-glow),var(--at-glow)) 100% 0/2px 9px no-repeat,',
      'linear-gradient(var(--at-glow),var(--at-glow)) 0 100%/9px 2px no-repeat,',
      'linear-gradient(var(--at-glow),var(--at-glow)) 0 100%/2px 9px no-repeat,',
      'linear-gradient(var(--at-glow),var(--at-glow)) 100% 100%/9px 2px no-repeat,',
      'linear-gradient(var(--at-glow),var(--at-glow)) 100% 100%/2px 9px no-repeat;',
      'animation:aonc-t-cb calc(2.4s/var(--at-sp,1)) ease-in-out infinite}',
      '@keyframes aonc-t-elec{0%,72%,100%{transform:translate(0,0);filter:brightness(1)}',
      '74%{transform:translate(-1px,1px);filter:brightness(1.6) hue-rotate(-15deg)}',
      '76%{transform:translate(1px,-1px);filter:brightness(1.1)}78%{transform:translate(-1px,0)}}',
      '.at-electric{animation:aonc-t-elec calc(1.4s/var(--at-sp,1)) steps(1,end) infinite}',
      '@keyframes aonc-t-ember{0%,100%{box-shadow:0 0 5px var(--at-glow);filter:brightness(1)}',
      '30%{box-shadow:0 -3px 10px var(--at-glow);filter:brightness(1.14)}',
      '60%{box-shadow:0 -6px 15px var(--at-glow);filter:brightness(1)}}',
      '.at-ember{animation:aonc-t-ember calc(2.2s/var(--at-sp,1)) ease-in-out infinite}',
      '@keyframes aonc-t-spark{0%,100%{filter:brightness(1) drop-shadow(0 0 0 transparent)}',
      '50%{filter:brightness(1.3) drop-shadow(0 0 6px var(--at-glow))}}',
      '.at-sparkle{animation:aonc-t-spark calc(1.6s/var(--at-sp,1)) ease-in-out infinite}',
      '@keyframes aonc-t-float{0%,100%{transform:translateY(0)}50%{transform:translateY(calc(-2.5px*var(--at-sz,1)))}}',
      '.at-float{animation:aonc-t-float calc(3s/var(--at-sp,1)) ease-in-out infinite}',
      '@keyframes aonc-t-neb{0%,100%{filter:hue-rotate(0) brightness(1)}50%{filter:hue-rotate(40deg) brightness(1.14)}}',
      '.at-nebula{animation:aonc-t-neb calc(5s/var(--at-sp,1)) ease-in-out infinite}',
      '@keyframes aonc-t-scan{from{transform:translateY(-120%)}to{transform:translateY(320%)}}',
      '.at-scan::before{content:"";position:absolute;left:0;right:0;top:0;height:35%;border-radius:inherit;',
      'background:linear-gradient(180deg,transparent,rgba(255,255,255,.28),transparent);',
      'animation:aonc-t-scan calc(2.6s/var(--at-sp,1)) linear infinite}',
      '.at-frost{backdrop-filter:blur(2px) saturate(1.2);-webkit-backdrop-filter:blur(2px) saturate(1.2);',
      'box-shadow:inset 0 0 12px rgba(255,255,255,.12)}',
      '@keyframes aonc-t-warp{0%,86%,100%{transform:scale(1);filter:blur(0)}',
      '90%{transform:scale(calc(1.02 + .03*var(--at-sz,1)));filter:blur(.6px)}94%{transform:scale(1)}}',
      '.at-warp{animation:aonc-t-warp calc(3.4s/var(--at-sp,1)) ease-in-out infinite}',
      '.aon-paused-offscreen.aonc-title-pill,.aon-paused-offscreen.aonc-title-pill::before,',
      '.aon-paused-offscreen.aonc-title-pill::after{animation-play-state:paused!important}',
      'html.aonc-no-motion .aonc-title-pill,html.aonc-no-motion .aonc-title-pill::before,',
      'html.aonc-no-motion .aonc-title-pill::after{animation:none!important}',
      '@media (prefers-reduced-motion:reduce){.aonc-title-pill,.aonc-title-pill::before,',
      '.aonc-title-pill::after{animation:none!important}}'
    ].join('');
  }

  return {
    RARITIES: RARITIES(),
    SOURCES: SOURCES,
    FX: FX,
    all: all,
    list: list,
    byId: byId,
    rarity: rarity,
    sourceLabel: sourceLabel,
    counts: counts,
    iconKey: iconKey,
    parseAnim: parseAnim,
    makeEntry: makeEntry,
    setRemote: setRemote,
    getRemote: getRemote,
    resetRuntime: resetRuntime,
    fromApi: fromApi,
    normalizeItem: normalizeItem,
    pillSpec: pillSpec,
    buildPill: buildPill,
    css: css
  };
});
