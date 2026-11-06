// Penomoran surat otomatis (atomik) dan pemeriksaan duplikasi.
import { atomic, dbAll, kvGet } from './db.js';
import { getOrg, getSettings, KATEGORI } from './org.js';
import { romawi, pad, parseISO, todayISO } from './util.js';

function ctx(kategori, iso) {
  const s = getSettings().penomoran;
  const d = parseISO(iso) || parseISO(todayISO());
  const y = d.getFullYear(); const m = d.getMonth() + 1;
  const scope = s.lingkup === 'kategori' ? (kategori || 'lainnya') : 'semua';
  const period = s.reset === 'bulanan' ? `${y}-${pad(m, 2)}` : s.reset === 'tidak' ? 'selamanya' : String(y);
  return { s, y, m, key: `cnt|${scope}|${period}`, kategori };
}

export function formatNomor(no, kategori, iso) {
  const c = ctx(kategori, iso);
  const kode = c.s.kodeJenis?.[kategori] || KATEGORI[kategori]?.kode || '';
  const fmt = c.s.formatJenis?.[kategori] || c.s.format || '{no}/{tahun}';
  return fmt
    .replaceAll('{no}', pad(no, c.s.digit || 3))
    .replaceAll('{kode}', getOrg().kode || '')
    .replaceAll('{jenis}', kode)
    .replaceAll('{bulan}', String(c.m))
    .replaceAll('{bulan_romawi}', romawi(c.m))
    .replaceAll('{tahun}', String(c.y));
}

const dipakai = (letters, full, exceptId) => letters.some((l) => l.id !== exceptId && l.nomor && l.nomor.trim().toLowerCase() === full.trim().toLowerCase());

// Perkiraan nomor berikutnya (tidak mengubah apa pun).
export async function intip(kategori, iso, exceptId) {
  const c = ctx(kategori, iso);
  const letters = await dbAll('letters');
  const last = (await kvGet(c.key, 0)) || 0;
  let n = Math.max(last, 0) + 1;
  while (dipakai(letters, formatNomor(n, kategori, iso), exceptId) && n < 100000) n++;
  return { no: n, full: formatNomor(n, kategori, iso) };
}

// Ambil nomor secara atomik: dua pengguna/tab tidak akan mendapat nomor sama.
export async function ambil(kategori, iso, exceptId) {
  const c = ctx(kategori, iso);
  return atomic(['kv', 'letters'], async (t) => {
    const rec = await t.get('kv', c.key);
    const letters = await t.all('letters');
    let n = Math.max((rec && rec.value) || 0, 0) + 1;
    while (dipakai(letters, formatNomor(n, kategori, iso), exceptId) && n < 100000) n++;
    await t.put('kv', { key: c.key, value: n });
    return { no: n, full: formatNomor(n, kategori, iso) };
  });
}

export async function periksaDuplikat(full, exceptId) {
  if (!full || !full.trim()) return false;
  return dipakai(await dbAll('letters'), full, exceptId);
}

export async function aturUrutan(kategori, iso, nilai) {
  const c = ctx(kategori, iso);
  const v = Math.max(0, Math.floor(+nilai || 0));
  await atomic(['kv'], async (t) => { await t.put('kv', { key: c.key, value: v }); });
  return v;
}

export async function urutanSaatIni(kategori, iso) {
  return (await kvGet(ctx(kategori, iso).key, 0)) || 0;
}
