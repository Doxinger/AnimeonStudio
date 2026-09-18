// e2e проверки обновлений (background/updates.js): сравнение версий, битый и
// недоступный JSON, тумблер и force-режим. Автоустановки нет — только статус.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const failures = [];
let passed = 0;
const check = (name, ok, detail) => {
  console.log((ok ? 'ok  ' : 'FAIL') + ' ' + name + (ok || detail === undefined ? '' : ' → ' + detail));
  if (ok) passed++;
  else failures.push(name);
};

function makeSandbox(fetchImpl) {
  const localStore = {};
  const sandbox = {
    console: { log() {}, warn() {}, error() {}, info() {} },
    setTimeout, clearTimeout,
    AbortController: globalThis.AbortController,
    fetch: fetchImpl
  };
  sandbox.chrome = {
    runtime: { id: 'test', lastError: null, getURL: (p) => 'chrome-extension://test/' + p, getManifest: () => ({ version: '1.1.1' }) },
    storage: {
      local: {
        get(keys, cb) {
          const list = Array.isArray(keys) ? keys : [keys];
          const out = {};
          list.forEach((k) => { if (k in localStore) out[k] = localStore[k]; });
          sandbox.chrome.runtime.lastError = null;
          cb && cb(out);
        },
        set(obj, cb) {
          Object.assign(localStore, obj);
          sandbox.chrome.runtime.lastError = null;
          cb && cb();
        },
        remove(keys, cb) { (Array.isArray(keys) ? keys : [keys]).forEach((k) => delete localStore[k]); cb && cb(); },
        clear(cb) { Object.keys(localStore).forEach((k) => delete localStore[k]); cb && cb(); }
      },
      sync: { get(k, cb) { cb && cb({}); }, set(o, cb) { cb && cb(); }, remove(k, cb) { cb && cb(); }, clear(cb) { cb && cb(); } },
      onChanged: { addListener() {}, removeListener() {} }
    },
    alarms: { create() {}, onAlarm: { addListener() {} } }
  };
  const ctx = vm.createContext(sandbox);
  vm.runInContext(readFileSync('dist/bundles/shared.js', 'utf8'), ctx, { filename: 'shared.bg.js' });
  vm.runInContext(readFileSync('src/background/state.js', 'utf8'), ctx, { filename: 'background.state.js' });
  vm.runInContext(readFileSync('src/background/updates.js', 'utf8'), ctx, { filename: 'background.updates.js' });
  return { sandbox, A: sandbox.AONC, localStore };
}

function jsonFetch(payload, status) {
  return function () {
    if (status && status !== 200) {
      return Promise.resolve({ ok: false, status: status, json: () => Promise.reject(new Error('no')) });
    }
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(payload) });
  };
}

async function boot(cfgPatch, fetchImpl) {
  const env = makeSandbox(fetchImpl);
  const cfg = env.A.config.normalize.createConfig(Object.assign({ meta: { updateCheck: true } }, cfgPatch || {}));
  await env.A.background.state.save(cfg);
  return env;
}

// 1. доступна новая версия
{
  const env = await boot(null, jsonFetch({ version: '9.9.9', xpi: 'https://x/y.xpi', notes: 'https://x/n' }));
  const st = await env.A.background.updates.check(true);
  check('новая версия: available=true и ссылка на файл', st.available === true && st.latest === '9.9.9' && st.xpi === 'https://x/y.xpi', JSON.stringify(st));
  check('текущая версия в статусе', st.current === env.A.VERSION);
  const st2 = await env.A.background.updates.statusNow();
  check('статус переживает перезапрос (хранится в local)', st2.available === true && st2.latest === '9.9.9');
}

// 2. та же версия и старая версия
{
  const env = await boot(null, jsonFetch({ version: '1.1.1' }));
  const st = await env.A.background.updates.check(true);
  check('та же версия: available=false', st.available === false && st.latest === '1.1.1');
  const env2 = await boot(null, jsonFetch({ version: '0.0.1' }));
  const st2 = await env2.A.background.updates.check(true);
  check('старая версия: available=false', st2.available === false);
}

// 3. битый JSON и сетевой сбой не ломают статус
{
  const env = await boot(null, jsonFetch({ version: 'абв' }));
  const st = await env.A.background.updates.check(true);
  check('битый version: ошибка в статусе, available=false', st.available === false && !!st.error, st.error);
  const env2 = await boot(null, function () { return Promise.reject(new Error('network down')); });
  const st2 = await env2.A.background.updates.check(true);
  check('сеть лежит: ошибка в статусе, без падения', st2.available === false && /network down/.test(st2.error || ''), st2.error);
  const env3 = await boot(null, jsonFetch(null, 404));
  const st3 = await env3.A.background.updates.check(true);
  check('HTTP 404: ошибка в статусе', st3.available === false && /404/.test(st3.error || ''), st3.error);
}

// 4. тумблер выключен: плановая проверка не ходит в сеть, force ходит
{
  let calls = 0;
  const env = await boot({ meta: { updateCheck: false } }, function () {
    calls++;
    return jsonFetch({ version: '9.9.9' })();
  });
  const st = await env.A.background.updates.check(false);
  check('тумблер выключен: плановая проверка без сети', calls === 0 && st.enabled === false, 'calls=' + calls);
  await env.A.background.updates.check(true);
  check('force-проверка игнорирует тумблер', calls === 1, 'calls=' + calls);
}

// 5. свой URL из конфига
{
  const seen = [];
  const env = makeSandbox(function (url) {
    seen.push(url);
    return jsonFetch({ version: '2.0.0' })();
  });
  const cfg = env.A.config.normalize.createConfig({ meta: { updateCheck: true, updateUrl: 'https://gist.example/u.json' } });
  await env.A.background.state.save(cfg);
  await env.A.background.updates.check(true);
  check('свой updateUrl используется', seen.length === 1 && seen[0] === 'https://gist.example/u.json', seen.join(','));
}

if (failures.length) {
  console.log('TEST UPDATES FAIL: ' + failures.join(', '));
  process.exit(1);
}
console.log('TEST UPDATES: OK (' + passed + ' проверок)');
process.exit(0);
