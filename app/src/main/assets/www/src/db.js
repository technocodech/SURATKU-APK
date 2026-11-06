// Penyimpanan lokal (IndexedDB) dengan cadangan memori bila IndexedDB tidak tersedia.
const DB_NAME = 'suratku';
const DB_VER = 1;
const KEYS = { kv: 'key', letters: 'id', templates: 'id', logos: 'slot' };
export const STORES = Object.keys(KEYS);

let idb = null;
export let storageMode = 'indexeddb'; // 'indexeddb' | 'memori'
const mem = Object.fromEntries(STORES.map((s) => [s, new Map()]));

const req = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

export async function openDB() {
  if (idb || storageMode === 'memori') return;
  try {
    if (!('indexedDB' in window) || !window.indexedDB) throw new Error('no idb');
    idb = await new Promise((res, rej) => {
      const r = indexedDB.open(DB_NAME, DB_VER);
      r.onupgradeneeded = () => {
        const d = r.result;
        for (const s of STORES) if (!d.objectStoreNames.contains(s)) d.createObjectStore(s, { keyPath: KEYS[s] });
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
      r.onblocked = () => rej(new Error('blocked'));
    });
  } catch (e) {
    storageMode = 'memori';
  }
}

function view(tx) {
  // tx bisa null (mode memori)
  return {
    get: async (s, k) => (tx ? req(tx.objectStore(s).get(k)) : mem[s].get(k)),
    put: async (s, v) => { if (tx) await req(tx.objectStore(s).put(v)); else mem[s].set(v[KEYS[s]], structuredClone(v)); return v; },
    del: async (s, k) => { if (tx) await req(tx.objectStore(s).delete(k)); else mem[s].delete(k); },
    all: async (s) => (tx ? req(tx.objectStore(s).getAll()) : [...mem[s].values()].map((v) => structuredClone(v))),
    clear: async (s) => { if (tx) await req(tx.objectStore(s).clear()); else mem[s].clear(); },
  };
}

// Jalankan fn dalam satu transaksi (atomik). Dipakai untuk penomoran.
export async function atomic(stores, fn, write = true) {
  await openDB();
  if (storageMode === 'memori') return fn(view(null));
  const tx = idb.transaction(stores, write ? 'readwrite' : 'readonly');
  const done = new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error || new Error('abort')); });
  let out;
  try { out = await fn(view(tx)); } catch (e) { try { tx.abort(); } catch (_) {} throw e; }
  await done;
  return out;
}

const one = (fnName) => async (...a) => { await openDB(); return view(storageMode === 'memori' ? null : idb.transaction(STORES, 'readwrite'))[fnName](...a); };
export const dbGet = one('get');
export const dbPut = one('put');
export const dbDel = one('del');
export const dbAll = one('all');

export async function kvGet(key, fallback = null) {
  const r = await dbGet('kv', key);
  return r ? r.value : fallback;
}
export const kvSet = (key, value) => dbPut('kv', { key, value });

export async function exportAll() {
  const out = { app: 'SURATKU', versi: 1, diekspor: new Date().toISOString(), data: {} };
  for (const s of STORES) out.data[s] = await dbAll(s);
  return out;
}

// Validasi ketat sebelum menimpa data.
export function validateBackup(obj) {
  const err = [];
  if (!obj || typeof obj !== 'object') return ['Berkas bukan cadangan SURATKU yang valid.'];
  if (obj.app !== 'SURATKU') err.push('Berkas ini bukan cadangan SURATKU.');
  if (!obj.data || typeof obj.data !== 'object') err.push('Isi cadangan tidak ditemukan.');
  else for (const s of STORES) {
    if (!Array.isArray(obj.data[s])) { err.push(`Bagian "${s}" tidak lengkap.`); continue; }
    for (const rec of obj.data[s]) {
      if (!rec || typeof rec !== 'object' || rec[KEYS[s]] == null || typeof rec[KEYS[s]] !== 'string') { err.push(`Ada data rusak pada bagian "${s}".`); break; }
    }
  }
  return err;
}

export async function importAll(obj) {
  const err = validateBackup(obj);
  if (err.length) throw new Error(err.join(' '));
  await atomic(STORES, async (t) => {
    for (const s of STORES) {
      await t.clear(s);
      for (const rec of obj.data[s]) await t.put(s, rec);
    }
  });
}

export async function resetAll() {
  await atomic(STORES, async (t) => { for (const s of STORES) await t.clear(s); });
}
