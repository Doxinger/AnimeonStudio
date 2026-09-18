// e2e фоновой синхронизации (background/sync.js) на vm-песочнице с честным
// стабом chrome.storage: квоты, lastError, onChanged.
// Проверяет: payload без dataUrl обоев, контроль размера под лимит ~8 КБ,
// подавление эхо-push, откат при ошибке квоты, защиту от устаревшего снимка
// (lastSyncT), сохранение локального файла обоев при применении удалённого
// снимка, совместимость с v1 и старт с удалённым payload.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const failures = [];
let passed = 0;
const check = (name, ok, detail) => {
  console.log((ok ? 'ok  ' : 'FAIL') + ' ' + name + (ok || detail === undefined ? '' : ' → ' + detail));
  if (ok) passed++;
  else failures.push(name);
};
const tick = (ms = 60) => new Promise((r) => setTimeout(r, ms));

const SHARED = readFileSync('dist/bundles/shared.js', 'utf8');
const STATE_SRC = readFileSync('src/background/state.js', 'utf8');
const SYNC_SRC = readFileSync('src/background/sync.js', 'utf8');

function makeSandbox() {
  const localStore = {};
  const syncStore = {};
  const listeners = [];
  const stats = { syncSetCalls: 0, failSyncSet: false };
  const warns = [];

  const sandbox = {
    console: {
      log() {}, info() {}, error() {},
      warn: (...a) => warns.push(a.join(' '))
    },
    setTimeout, clearTimeout,
    __warns: warns
  };

  sandbox.chrome = {
    runtime: {
      id: 'test-ext',
      lastError: null,
      getURL: (p) => 'chrome-extension://test/' + p,
      getManifest: () => ({ version: '1.1.1' }),
      sendMessage: (m, cb) => { const r = { ok: true }; if (cb) cb(r); },
      onMessage: { addListener() {}, removeListener() {} }
    },
    storage: {
      local: makeArea('local'),
      sync: makeArea('sync'),
      onChanged: {
        addListener: (fn) => listeners.push(fn),
        removeListener: (fn) => {
          const i = listeners.indexOf(fn);
          if (i !== -1) listeners.splice(i, 1);
        }
      }
    }
  };

  function fireChanges(store, name, obj) {
    const changes = {};
    Object.keys(obj).forEach((k) => { changes[k] = { newValue: obj[k], oldValue: store[k] }; });
    listeners.slice().forEach((fn) => fn(changes, name));
  }

  function makeArea(name) {
    const store = name === 'local' ? localStore : syncStore;
    return {
      get(keys, cb) {
        const fn = typeof keys === 'function' ? keys : cb;
        const list = keys == null || typeof keys === 'function'
          ? Object.keys(store)
          : (Array.isArray(keys) ? keys : [keys]);
        const out = {};
        list.forEach((k) => { if (k in store) out[k] = store[k]; });
        sandbox.chrome.runtime.lastError = null;
        if (fn) fn(out);
      },
      set(obj, cb) {
        if (name === 'sync') {
          stats.syncSetCalls++;
          if (stats.failSyncSet) {
            sandbox.chrome.runtime.lastError = { message: 'QUOTA_BYTES_PER_ITEM exceeded' };
            if (cb) cb();
            sandbox.chrome.runtime.lastError = null;
            return;
          }
        }
        Object.assign(store, obj);
        sandbox.chrome.runtime.lastError = null;
        fireChanges(store, name, obj);
        if (cb) cb();
      },
      remove(keys, cb) {
        (Array.isArray(keys) ? keys : [keys]).forEach((k) => { delete store[k]; });
        if (cb) cb();
      },
      clear(cb) {
        Object.keys(store).forEach((k) => { delete store[k]; });
        if (cb) cb();
      }
    };
  }

  const context = vm.createContext(sandbox);
  vm.runInContext(SHARED, context, { filename: 'shared.bg.js' });
  vm.runInContext(STATE_SRC, context, { filename: 'background.state.js' });
  vm.runInContext(SYNC_SRC, context, { filename: 'background.sync.js' });

  return { sandbox, A: sandbox.AONC, localStore, syncStore, stats, warns, listeners };
}

function byteSize(str) {
  return String(str).replace(/[^\x00-\x7F]/g, 'xx').length;
}

// ── 1. subset: dataUrl не уезжает в sync, остальные поля целы ──────
{
  const env = makeSandbox();
  const { A } = env;
  const cfg = A.config.normalize.createConfig({
    meta: { syncEnabled: true },
    wallpaper: { enabled: true, source: 'file', dataUrl: 'data:image/png;base64,' + 'A'.repeat(120000), overlay: 40 }
  });
  const sub = A.background.sync.subset(cfg);
  check('subset: dataUrl обоев вырезан', sub.wallpaper.dataUrl === '');
  check('subset: остальные поля обоев на месте', sub.wallpaper.source === 'file' && sub.wallpaper.overlay === 40);
  check('subset: формат v2 со списком parts', sub.v === 2 && Array.isArray(sub.parts) && sub.parts.indexOf('theme') !== -1);
  check('subset: лёгкие домены включены', ['typography', 'chat', 'identity', 'cosmetics'].every((k) => sub.parts.indexOf(k) !== -1));
  check('subset: влезает в квоту item', byteSize(JSON.stringify(sub)) <= A.background.sync.MAX_ITEM_BYTES,
    String(byteSize(JSON.stringify(sub))));
}

// ── 2. subset: тяжёлый конфиг урезается по приоритетам ─────────────
{
  const env = makeSandbox();
  const { A } = env;
  const rules = [];
  for (let i = 0; i < 220; i++) {
    rules.push({ id: 'r' + i, match: '/very/long/catalog/path/segment/' + i, enabled: true,
      url: 'https://cdn.example.com/wallpapers/2026/extremely-long-name-of-wallpaper-file-' + i + '.jpg' });
  }
  const cfg = A.config.normalize.createConfig({
    meta: { syncEnabled: true },
    wallpaper: { enabled: true, source: 'url', url: 'https://x/y.png', rules }
  });
  const sub = A.background.sync.subset(cfg);
  check('тяжёлый конфиг: payload влез в квоту', byteSize(JSON.stringify(sub)) <= A.background.sync.MAX_ITEM_BYTES,
    String(byteSize(JSON.stringify(sub))));
  check('тяжёлый конфиг: тема всегда остаётся', sub.parts.indexOf('theme') !== -1 && !!sub.theme);
  check('тяжёлый конфиг: хвост приоритетов отброшен', sub.parts.length < A.background.sync.PARTS.length,
    sub.parts.join(','));
  check('тяжёлый конфиг: parts совпадает с фактическими ключами',
    sub.parts.every((k) => !!sub[k]) && Object.keys(sub).filter((k) => ['v', 't', 'parts'].indexOf(k) === -1).length === sub.parts.length);
}

// ── 3. push: запись, эхо-подавление, откат при квоте ───────────────
{
  const env = makeSandbox();
  const { A, syncStore, stats, warns } = env;
  const cfg = A.config.normalize.createConfig({ meta: { syncEnabled: true }, theme: { accent: '#7C4DFF' } });
  await A.background.state.save(cfg);

  const pushed = await A.background.sync.push(cfg);
  await tick(750);
  check('push: payload записан в sync', pushed === true && !!syncStore[A.background.sync.KEY] && syncStore[A.background.sync.KEY].theme.accent === '#7C4DFF');
  check('push: один вызов set', stats.syncSetCalls === 1, String(stats.syncSetCalls));
  check('push: lastSyncT запомнен в local', env.localStore[A.background.sync.KEY_T] === syncStore[A.background.sync.KEY].t);

  await A.background.sync.push(cfg);
  await tick(750);
  check('эхо-push подавлен (контент не менялся)', stats.syncSetCalls === 1, String(stats.syncSetCalls));

  const cfg2 = A.config.normalize.createConfig({ meta: { syncEnabled: true }, theme: { accent: '#00FF00' } });
  await A.background.state.save(cfg2);
  stats.failSyncSet = true;
  const failed = await A.background.sync.push(cfg2);
  await tick(750);
  check('сбой квоты: push вернул false', failed === false);
  check('сбой квоты: предупреждение залогировано', warns.some((w) => /QUOTA/i.test(w)), warns.join('|'));
  check('сбой квоты: lastSyncT откачен', A.background.sync.state().lastSyncT === syncStore[A.background.sync.KEY].t,
    A.background.sync.state().lastSyncT + ' vs ' + syncStore[A.background.sync.KEY].t);
  stats.failSyncSet = false;
  const recovered = await A.background.sync.push(cfg2);
  await tick(750);
  check('после сбоя следующий push проходит', recovered === true && syncStore[A.background.sync.KEY].theme.accent === '#00FF00');
}

// ── 4. собственный sync-эвент не запускает applyRemote ─────────────
{
  const env = makeSandbox();
  const { A, syncStore, localStore } = env;
  const cfg = A.config.normalize.createConfig({ meta: { syncEnabled: true }, theme: { accent: '#123456' } });
  await A.background.state.save(cfg);
  const savedEdited = localStore[A.STORAGE_KEY].meta.lastEdited;
  A.background.sync.start();
  await tick(900);
  check('start: первый push наполнил sync', !!syncStore[A.background.sync.KEY]);
  await tick(200);
  check('start: собственный sync-эвент не пересохраняет конфиг',
    localStore[A.STORAGE_KEY].theme.accent === '#123456'
    && localStore[A.STORAGE_KEY].meta.lastEdited === savedEdited,
    'lastEdited: ' + localStore[A.STORAGE_KEY].meta.lastEdited + ' vs ' + savedEdited);
}

// ── 5. applyRemote: v2, устаревший снимок, файл обоев, v1 ──────────
{
  const env = makeSandbox();
  const { A, localStore } = env;
  const cfg = A.config.normalize.createConfig({
    meta: { syncEnabled: true },
    theme: { accent: '#7C4DFF' },
    wallpaper: { enabled: true, source: 'file', dataUrl: 'data:image/png;base64,LOCALFILE' }
  });
  await A.background.state.save(cfg);

  const stale = await A.background.sync.applyRemote({
    v: 2, t: 1000, parts: ['theme'], theme: { accent: '#FF0000' }
  });
  check('первый снимок применяется (lastSyncT=0)', stale === true && localStore[A.STORAGE_KEY].theme.accent === '#FF0000');
  const t1 = localStore[A.background.sync.KEY_T];
  check('lastSyncT записан в local после apply', t1 === 1000, String(t1));
  const stale2 = await A.background.sync.applyRemote({
    v: 2, t: t1 - 5000, parts: ['theme'], theme: { accent: '#000000' }
  });
  check('снимок старше lastSyncT отклонён', stale2 === false && localStore[A.STORAGE_KEY].theme.accent !== '#000000');

  const applied = await A.background.sync.applyRemote({
    v: 2, t: Date.now() + 5000, parts: ['theme', 'typography', 'chat'],
    theme: { accent: '#00FF88' },
    typography: { uiScale: 105 },
    chat: { fontSize: 15 }
  });
  check('v2: домены применены', applied === true
    && localStore[A.STORAGE_KEY].theme.accent === '#00FF88'
    && localStore[A.STORAGE_KEY].typography.uiScale === 105
    && localStore[A.STORAGE_KEY].chat.fontSize === 15);

  const kept = await A.background.sync.applyRemote({
    v: 2, t: Date.now() + 9000, parts: ['wallpaper'],
    wallpaper: { enabled: true, source: 'file', dataUrl: '', overlay: 55 }
  });
  check('файл обоев сохраняется при удалённом снимке', kept === true
    && localStore[A.STORAGE_KEY].wallpaper.dataUrl === 'data:image/png;base64,LOCALFILE'
    && localStore[A.STORAGE_KEY].wallpaper.overlay === 55);

  const v1 = await A.background.sync.applyRemote({
    v: 1, t: Date.now() + 12000,
    theme: { accent: '#00AAFF' },
    wallpaper: { enabled: true, source: 'preset', preset: 'nebula' }
  });
  check('v1-формат совместим', v1 === true
    && localStore[A.STORAGE_KEY].theme.accent === '#00AAFF'
    && localStore[A.STORAGE_KEY].wallpaper.preset === 'nebula');

  const junk = await A.background.sync.applyRemote({ v: 2, t: Date.now() + 15000, parts: ['hacker', 'theme'], theme: { accent: '#ABCDEF' }, hacker: { x: 1 } });
  check('чужие домены в parts игнорируются', junk === true && localStore[A.STORAGE_KEY].theme.accent === '#ABCDEF'
    && localStore[A.STORAGE_KEY].hacker === undefined);

  const bad = await A.background.sync.applyRemote(null);
  const bad2 = await A.background.sync.applyRemote({ v: 99, t: Date.now() + 20000 });
  check('пустой/неизвестный payload отклоняется', bad === false && bad2 === false);
}

// ── 6. start(): удалённый снимок новее локального — применяется ────
{
  const env = makeSandbox();
  const { A, syncStore, localStore } = env;
  const cfg = A.config.normalize.createConfig({ meta: { syncEnabled: true }, theme: { accent: '#7C4DFF' } });
  await A.background.state.save(cfg);
  syncStore[A.background.sync.KEY] = {
    v: 2, t: Date.now() + 60000, parts: ['theme'], theme: { accent: '#FF7700' }
  };
  A.background.sync.start();
  await tick(300);
  check('start: свежий удалённый снимок применён', localStore[A.STORAGE_KEY].theme.accent === '#FF7700',
    localStore[A.STORAGE_KEY].theme.accent);
  check('start: lastSyncT поднят до удалённого', localStore[A.background.sync.KEY_T] >= Date.now() + 59000);
}

if (failures.length) {
  console.log('TEST SYNC FAIL: ' + failures.join(', '));
  process.exit(1);
}
console.log('TEST SYNC: OK (' + passed + ' проверок)');
process.exit(0);
