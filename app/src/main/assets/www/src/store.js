// Penyimpanan surat, template buatan pengguna, favorit, dan riwayat aktivitas.
import { dbAll, dbGet, dbPut, dbDel, kvGet, kvSet } from './db.js';
import { uid, clone } from './util.js';
import { daftarTemplate } from './compose.js';
import { BUILTIN } from './templates.js';

export const STATUS = { draf: 'Draf', siap: 'Siap dicetak', selesai: 'Selesai', diarsipkan: 'Diarsipkan' };

// ---------- Surat ----------
export const semuaSurat = () => dbAll('letters');
export const ambilSurat = (id) => dbGet('letters', id);
export async function simpanRecord(l) { l.updatedAt = Date.now(); await dbPut('letters', l); return l; }
export async function hapusSurat(id) { await dbDel('letters', id); }

export function gandakanSurat(l) {
  const c = clone(l);
  c.id = uid(); c.status = 'draf'; c.createdAt = c.updatedAt = Date.now();
  c.nomor = ''; c.nomorMode = l.tpl.kind === 'dokumen' ? 'manual' : 'auto';
  c.fields = c.fields || {};
  return c;
}

// ---------- Aktivitas ----------
export async function catat(jenis, l, ket = '') {
  const arr = (await kvGet('aktivitas', [])) || [];
  arr.unshift({ ts: Date.now(), jenis, id: l && l.id, nama: l ? (l.tpl.nama + (l.nomor ? ' · ' + l.nomor : '')) : '', ket });
  await kvSet('aktivitas', arr.slice(0, 60));
}
export const aktivitas = async () => (await kvGet('aktivitas', [])) || [];

// ---------- Pemulihan perubahan ----------
export const simpanPemulihan = (id, l) => kvSet('pulih|' + id, { t: Date.now(), l });
export const ambilPemulihan = (id) => kvGet('pulih|' + id, null);
export async function hapusPemulihan(id) { await dbDel('kv', 'pulih|' + id); }

// ---------- Template ----------
export const templatKustom = () => dbAll('templates');
export async function semuaTemplate() {
  const [custom, sembunyi, fav] = await Promise.all([templatKustom(), kvGet('tplSembunyi', []), kvGet('tplFavorit', [])]);
  const favSet = new Set(fav || []);
  return daftarTemplate(custom, sembunyi).map((t) => ({ ...t, favorite: favSet.has(t.id) }));
}
export async function simpanTemplate(t) { await dbPut('templates', t); return t; }
export async function hapusTemplateKustom(id) { await dbDel('templates', id); }
export async function toggleFavorit(id) {
  const fav = new Set((await kvGet('tplFavorit', [])) || []);
  if (fav.has(id)) fav.delete(id); else fav.add(id);
  await kvSet('tplFavorit', [...fav]);
  return fav.has(id);
}
export async function sembunyikanBawaan(id, sembunyi = true) {
  const s = new Set((await kvGet('tplSembunyi', [])) || []);
  if (sembunyi) s.add(id); else s.delete(id);
  await kvSet('tplSembunyi', [...s]);
}
// Pulihkan template bawaan: hapus override dan tampilkan lagi.
export async function pulihkanBawaan(baseId) {
  for (const t of await templatKustom()) if (t.baseId === baseId) await dbDel('templates', t.id);
  await sembunyikanBawaan(baseId, false);
}
export const templatBawaan = (id) => BUILTIN.find((t) => t.id === id);
export async function templatById(id) { return (await semuaTemplate()).find((t) => t.id === id); }

// ---------- Susunan tanda tangan tersimpan ----------
export const daftarTtdPreset = async () => (await kvGet('ttdPreset', [])) || [];
export async function simpanTtdPreset(p) {
  const arr = await daftarTtdPreset();
  const i = arr.findIndex((x) => x.id === p.id);
  if (i >= 0) arr[i] = p; else arr.push(p);
  await kvSet('ttdPreset', arr); return p;
}
export async function hapusTtdPreset(id) { await kvSet('ttdPreset', (await daftarTtdPreset()).filter((x) => x.id !== id)); }

// Format surat tersimpan (tata letak yang dapat dipakai ulang)
export const daftarFormatPreset = async () => (await kvGet('formatPreset', [])) || [];
export async function simpanFormatPreset(p) {
  const arr = await daftarFormatPreset(); const i = arr.findIndex((x) => x.id === p.id);
  if (i >= 0) arr[i] = p; else arr.push(p);
  await kvSet('formatPreset', arr); return p;
}
export async function hapusFormatPreset(id) { await kvSet('formatPreset', (await daftarFormatPreset()).filter((x) => x.id !== id)); }
