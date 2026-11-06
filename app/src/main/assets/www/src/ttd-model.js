// Model tanda tangan: susunan siap pakai (pengantar, jabatan, posisi, baris, gaya huruf) yang terinspirasi dari ragam surat nyata.
// Memilih model hanya mengganti SUSUNAN tanda tangan; nama, gambar tanda tangan, dan stempel penandatangan yang sama tetap dipertahankan.
import { DEFAULT_TTD, merge, namaOrgSatuBaris } from './org.js';
import { infoPeran } from './compose.js';

import { TTD_MODEL } from './ttd-data.js';
export { TTD_MODEL };

// Menerapkan model ke surat L. Nama, gambar, dan stempel penandatangan dengan peran yang sama dipertahankan.
export function terapkanTtdModel(L, m, org) {
  const T0 = JSON.parse(JSON.stringify(m.ttd || {}));
  const ruang = L.ttd && L.ttd.ruang;
  L.ttd = { ...DEFAULT_TTD, ...T0, gaya: merge(DEFAULT_TTD.gaya, T0.gaya), tglSigner: 'auto' };
  if (T0.tglRata === undefined) L.ttd.tglRata = (L.ttd.tglRata || 'left');
  if (ruang) L.ttd.ruang = ruang; else delete L.ttd.ruang;
  const lama = (L.signers || []).slice();
  L.signers = (m.signers || []).map((r) => {
    const i = lama.findIndex((s) => s.role === r.role && r.role !== 'lain');
    const pakai = i >= 0 ? lama.splice(i, 1)[0] : null;
    const info = infoPeran(org, r.role);
    let jab = r.jabatan ?? info.jabatan ?? '';
    if (r.kapital && jab) jab = String(jab).toUpperCase() + ',';
    const s = { role: r.role, jabatan: jab, nama: '', org: String(r.org || '').replaceAll('{{nama_organisasi}}', namaOrgSatuBaris(org)), gambar: null, posisi: r.posisi, baris: r.baris || 1, pengantar: r.pengantar || '', ket: r.ket || '', tambahAtas: '', tambahBawah: '' };
    if (pakai) for (const k of ['nama', 'gambar', 'stempel', 'gUkuran', 'gX', 'gY', 'sUkuran', 'sX', 'sY']) if (pakai[k] !== undefined) s[k] = pakai[k];
    return s;
  });
  if (m.tgl && L.snap && L.snap.set) L.snap.set.tanggalPosisi = m.tgl;
  else if (L.snap && L.snap.set && ['ttd', 'bawah'].includes(L.snap.set.tanggalPosisi)) L.snap.set.tanggalPosisi = 'atas';
}

// ---------- Miniatur ----------
const D = '#33404d'; const G = '#9aa3ad'; const A = '#0b6b3a'; const F = '#dfe3e8';
const bar = (x, y, w, hh = 1.6, c = G) => `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${hh}" rx=".8" fill="${c}"/>`;
export function miniTtd(m) {
  const T = m.ttd || {}; const sg = m.signers || [];
  let o = '';
  const rapat = T.rata === 'left';
  o += bar(6, 6, 50, 1.5, F) + bar(6, 9.5, 54, 1.5, F) + bar(6, 13, 40, 1.5, F);
  const tgl = m.tgl === 'ttd' ? 'ttd' : 'atas';
  if (tgl === 'atas') o += bar(44, 2.4, 20, 1.5, A);
  const px = { kiri: 6, tengah: 24, kanan: 42 }; const W = 22;
  const garisX = (pos, w) => (rapat ? px[pos] + 1 : px[pos] + (W - w) / 2);
  let y = 22;
  const peng = (T.susunan === 'hormat' || T.susunan === 'hormat+org') ? String(T.pengantar || '').split('\n').filter(Boolean) : [];
  const baris = [...new Set(sg.map((s) => s.baris || 1))].sort();
  const posAll = (b) => sg.filter((s) => (s.baris || 1) === b).map((s) => s.posisi);
  if (tgl === 'ttd') { o += bar(44, y, 20, 1.5, A); y += 3.6; }
  baris.forEach((b, bi) => {
    const row = sg.filter((s) => (s.baris || 1) === b);
    if (bi === 0 && peng.length) {
      const sama = new Set(posAll(b)).size === 1;
      const pos = sama ? posAll(b)[0] : 'tengah';
      peng.forEach((t, i) => { const w = i === 0 ? 16 : 22; o += bar(garisX(pos, w) + (sama && !rapat ? 0 : 0), y, w, 1.6, T.gaya && T.gaya.pengantar && T.gaya.pengantar.b ? D : G); y += 3; });
    }
    let yMaks = y;
    row.forEach((s) => {
      let yy = y;
      if (s.pengantar) { o += bar(garisX(s.posisi, 14), yy, 14, 1.6, D); yy += 3; }
      if (s.org) { o += bar(garisX(s.posisi, 18), yy, 18, 1.6, G); yy += 3; }
      if (T.jabatan !== false && s.jabatan !== '') { o += bar(garisX(s.posisi, 15), yy, 15, 1.6, T.gaya && T.gaya.jabatan && T.gaya.jabatan.b ? D : G); yy += 3; }
      const cx = garisX(s.posisi, 16) + (rapat ? 3 : 8);
      o += `<path d="M${(cx - 5).toFixed(1)} ${(yy + 6).toFixed(1)} q3 -7 5 -2 t5 -1" fill="none" stroke="#6a7886" stroke-width=".9" stroke-linecap="round"/>`; yy += 8;
      o += bar(garisX(s.posisi, 17), yy, 17, 1.8, D); if (T.garisNama !== false) o += bar(garisX(s.posisi, 17), yy + 2.1, 17, .5, D); yy += 3.6;
      if (s.ket) { o += bar(garisX(s.posisi, 12), yy, 12, 1.4, G); yy += 2.8; }
      yMaks = Math.max(yMaks, yy);
    });
    y = yMaks + 3;
  });
  return `<svg viewBox="0 0 70 78" aria-hidden="true"><rect x=".6" y=".6" width="68.8" height="76.8" rx="2" fill="#fff" stroke="#c9d0d7" stroke-width="1.2"/>${o}</svg>`;
}
export const ringkasTtd = (m) => {
  const T = m.ttd || {}; const r = [];
  r.push(['Penandatangan', `${(m.signers || []).length} orang`]);
  if (T.pengantar) r.push(['Teks pengantar', String(T.pengantar).split('\n')[0].replace(/\*\*|\{w:#[0-9a-f]{6}\}|\{\/w\}/gi, '')]);
  r.push(['Perataan teks', T.rata === 'left' ? 'Rata kiri' : 'Tengah']);
  if (T.jabatan === false) r.push(['Jabatan', 'Tidak dicetak']);
  r.push(['Nama', T.garisNama === false ? 'Tanpa garis bawah' : 'Bergaris bawah']);
  if (m.tgl === 'ttd') r.push(['Kota dan tanggal', 'Di atas jabatan']);
  return r;
};
