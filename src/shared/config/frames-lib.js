AONC.define('config.framesLib', function (A) {
  'use strict';

  var data = A.config.framesData;

  var custom = [];
  var remote = { items: [], at: 0, count: 0 };

  var RARITIES = [
    { id: 'common', label: 'Обычный', color: '#B4B4C0' },
    { id: 'rare', label: 'Редкий', color: '#38BDF8' },
    { id: 'epic', label: 'Эпический', color: '#E879F9' },
    { id: 'legendary', label: 'Легендарный', color: '#FBBF24' },
    { id: 'mythic', label: 'Мифический', color: '#FF4FB8' }
  ];

  var SOURCES = [
    { id: 'free', label: 'Доступно всем' },
    { id: 'premium', label: 'Premium' },
    { id: 'achievement', label: 'Достижение' },
    { id: 'referral', label: 'Рефералка' },
    { id: 'event', label: 'Ивент' },
    { id: 'grant', label: 'Особая выдача' },
    { id: 'archive', label: 'Архив' },
    { id: 'shop', label: 'Магазин' }
  ];

  var RARITY_ORDER = { common: 0, rare: 1, epic: 2, legendary: 3, mythic: 4 };

  function normalizeItem(raw) {
    if (!raw || typeof raw !== 'object' || !raw.id) return null;
    var type = raw.type === 'ring' || raw.type === 'rainbow' ? raw.type : 'image';
    var url = String(raw.url || raw.media_url || '').trim();
    if (type === 'image') {
      if (!url) return null;
      if (!/^https?:\/\//i.test(url)) url = resolveMedia(url);
    }
    return {
      id: String(raw.id),
      name: String(raw.name || raw.id),
      rarity: RARITY_ORDER[raw.rarity] == null ? 'common' : raw.rarity,
      source: String(raw.source || ''),
      label: String(raw.label || raw.source_label || ''),
      unlocked: !!raw.unlocked,
      order: A.lang.num(raw.order != null ? raw.order : raw.sort_order, 0),
      scale: A.lang.clamp(A.lang.num(raw.scale != null ? raw.scale : raw.frame_scale, 1), 0.5, 2.5),
      ox: A.lang.num(raw.ox != null ? raw.ox : raw.frame_offset_x, 0),
      oy: A.lang.num(raw.oy != null ? raw.oy : raw.frame_offset_y, 0),
      type: type,
      color: A.color.convert.sanitize(raw.color, '#7C4DFF'),
      url: url,
      format: String(raw.format || raw.media_format || ''),
      animated: !!(raw.animated || raw.media_animated_url),
      remote: !!raw.remote
    };
  }

  function resolveMedia(path) {
    var p = String(path || '').trim();
    if (!p) return '';
    if (/^https?:\/\//i.test(p)) return p;
    if (p.indexOf('/media/') === 0) p = p.slice(7);
    if (p.indexOf('cosmetic/frames/') === 0) p = 'cosmetics/frames/' + p.slice(16);
    if (p.indexOf('cosmetics/frames/') !== 0 && p.indexOf('cosmetics/') !== 0) p = 'cosmetics/' + p.replace(/^\/+/, '');
    if (p.charAt(0) !== '/') p = '/' + p;
    return data.CDN + p;
  }

  function thumb(item, size) {
    if (!item || item.type !== 'image' || !item.url) return '';
    var px = Math.max(64, Math.min(512, A.lang.num(size, 256)));
    if (data.CDN && item.url.indexOf(data.CDN + '/') === 0 && /\.(png|jpe?g)$/i.test(item.url)) {
      return data.CDN + '/ioss(resize=' + px + ')' + item.url.slice(data.CDN.length);
    }
    return item.url;
  }

  function all() {
    var out = data.FRAMES.slice();
    if (remote.items && remote.items.length) out = out.concat(remote.items);
    if (custom.length) out = out.concat(custom);
    return out.map(function (item) {
      return normalizeItem(item) || item;
    }).filter(Boolean);
  }

  function byId(id) {
    var key = String(id || '');
    if (!key) return null;
    var list = all();
    for (var i = 0; i < list.length; i++) if (list[i].id === key) return list[i];
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
    var out = all().filter(function (f) {
      if (o.rarity && o.rarity !== 'any' && f.rarity !== o.rarity) return false;
      if (o.source && o.source !== 'any' && f.source !== o.source) return false;
      if (o.type && o.type !== 'any' && f.type !== o.type) return false;
      if (o.unlockedOnly && !f.unlocked) return false;
      if (q) {
        var hay = (f.name + ' ' + f.id + ' ' + f.label).toLowerCase();
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
    for (var i = 0; i < RARITIES.length; i++) if (RARITIES[i].id === id) return RARITIES[i];
    return RARITIES[0];
  }

  function sourceLabel(id) {
    for (var i = 0; i < SOURCES.length; i++) if (SOURCES[i].id === id) return SOURCES[i].label;
    return id ? String(id) : '';
  }

  function counts() {
    var list0 = all();
    var byRarity = {};
    RARITIES.forEach(function (r) { byRarity[r.id] = 0; });
    list0.forEach(function (f) { byRarity[f.rarity] = (byRarity[f.rarity] || 0) + 1; });
    return {
      total: list0.length,
      image: list0.filter(function (f) { return f.type === 'image'; }).length,
      css: list0.filter(function (f) { return f.type !== 'image'; }).length,
      unlocked: list0.filter(function (f) { return f.unlocked; }).length,
      remote: (remote.items || []).length,
      at: remote.at || 0,
      byRarity: byRarity
    };
  }

  function makeEntry(item, opts) {
    var o = opts || {};
    var base = item || {};
    return A.lang.normalize(A.config.defaults.frame, {
      id: A.lang.uid('frame'),
      frameId: base.id || '',
      name: o.name || base.name || 'Рамка',
      url: o.url || (base.type === 'image' ? base.url : ''),
      type: o.type || base.type || (o.url ? 'image' : 'ring'),
      scale: o.scale != null ? o.scale : 0,
      ox: 0,
      oy: 0,
      opacity: 100,
      anim: 'none',
      glow: 0,
      enabled: true
    });
  }

  function customEntry(url, name) {
    return makeEntry({ type: 'image', url: String(url || '').trim(), name: name || 'Своя рамка' }, { url: String(url || '').trim() });
  }

  function setCustom(items) {
    custom = (items || []).map(normalizeItem).filter(Boolean);
    return custom.length;
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
    custom = [];
    remote = { items: [], at: 0, count: 0 };
  }

  function fromApi(rawList) {
    return (rawList || []).map(function (f) {
      if (!f || !f.id) return null;
      var isRing = f.id === 'purple' || f.id === 'teal' || f.id === 'gold' || f.id === 'red';
      var item = {
        id: f.id,
        name: f.name,
        rarity: f.rarity,
        source: f.source,
        label: f.source_label,
        unlocked: !!f.unlocked,
        order: f.sort_order,
        scale: f.frame_scale,
        ox: f.frame_offset_x,
        oy: f.frame_offset_y
      };
      if (isRing) {
        item.type = 'ring';
        item.color = { purple: '#7C4DFF', teal: '#00D3A7', gold: '#FBBF24', red: '#EF4444' }[f.id];
      } else if (f.id === 'rainbow') {
        item.type = 'rainbow';
      } else if (f.media_url) {
        item.type = 'image';
        item.url = resolveMedia(f.media_url);
        item.format = f.media_format;
        item.animated = !!(f.media_animated_url || f.media_format === 'gif' || f.media_kind === 'video');
      } else {
        return null;
      }
      return normalizeItem(item);
    }).filter(Boolean);
  }

  return {
    CDN: data.CDN,
    RARITIES: RARITIES,
    SOURCES: SOURCES,
    all: all,
    list: list,
    byId: byId,
    rarity: rarity,
    sourceLabel: sourceLabel,
    counts: counts,
    resolveMedia: resolveMedia,
    thumb: thumb,
    makeEntry: makeEntry,
    customEntry: customEntry,
    setCustom: setCustom,
    setRemote: setRemote,
    getRemote: getRemote,
    resetRuntime: resetRuntime,
    fromApi: fromApi,
    normalizeItem: normalizeItem
  };
});
