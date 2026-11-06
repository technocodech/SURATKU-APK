// Identitas organisasi, pengaturan dokumen, dan logo.
import { kvGet, kvSet, dbGet, dbPut, dbDel, dbAll } from './db.js';
import { clone, bersihkan } from './util.js';

export const KATEGORI = {
  undangan: { nama: 'Undangan', kode: 'UND' },
  pemberitahuan: { nama: 'Pemberitahuan', kode: 'PBR' },
  permohonan: { nama: 'Permohonan', kode: 'PMH' },
  tugas: { nama: 'Tugas', kode: 'ST' },
  keterangan: { nama: 'Keterangan', kode: 'KET' },
  keputusan: { nama: 'Keputusan', kode: 'SK' },
  rekomendasi: { nama: 'Rekomendasi', kode: 'REK' },
  keagamaan: { nama: 'Keagamaan', kode: 'AGM' },
  administrasi: { nama: 'Administrasi', kode: 'ADM' },
  kegiatan: { nama: 'Dokumen Kegiatan', kode: 'DOK' },
  lainnya: { nama: 'Lainnya', kode: 'LNY' },
};

// Jabatan bawaan (dapat diubah, ditambah, atau dihapus di Data Organisasi).
export const PEJABAT_BAWAAN = [
  { id: 'ketua', jabatan: 'Ketua', nama: '' },
  { id: 'sekretaris', jabatan: 'Sekretaris', nama: '' },
  { id: 'bendahara', jabatan: 'Bendahara', nama: '' },
];

export const DEFAULT_ORG = {
  jenis: 'organisasi',
  induk: '', nama: '',
  pejabat: PEJABAT_BAWAAN,
  alamat: '', alamatBebas: '', desaJenis: 'Desa', desa: '',
  kecamatan: '', kabJenis: 'Kabupaten', kabupaten: '', provinsi: '',
  telepon: '', email: '', website: '', kopTambahan: '',
  kotaTtd: '', kode: '',
};

// Gaya baku tiap baris kop. Semua dapat diubah di editor kop.
const G0 = { f: 't', size: 12, b: false, i: false, u: false, color: '#000000', kapital: false, jarak: 0 };
export const DEFAULT_KOP = {
  rata: 'tengah', jarakBaris: 1.2, jarakBawah: 10, gapLogo: 8, padAtas: 0, logoVertikal: 'tengah',
  garis: { gaya: 'tebal-tipis', warna: '#000000', jarak: 4, tebal: 0 }, // tebal 0 = bawaan gaya (pt)
  gaya: {
    induk: { ...G0, size: 12, b: true, kapital: true },
    nama: { ...G0, size: 13, b: true, kapital: true },
    alamat: { ...G0, size: 9 },
    kontak: { ...G0, size: 9 },
    tambahan: { ...G0, size: 9, i: true },
  },
};
const GT = { b: false, i: false, color: '#000000' };
export const DEFAULT_TTD = {
  pengantar: '', pengantarPosisi: 'auto', pengantarRata: 'center', pengantarJarak: 2, jabatan: true, instansi: false, ruang: null, jarak: 'normal', garisNama: true, jarakJabatan: 0, jarakNama: 0, rata: 'center',
  gaya: { tanggal: { ...GT, size: 0, f: '' }, pengantar: { ...GT, size: 0, f: '' }, instansi: { ...GT, size: 0, f: '' }, jabatan: { ...GT, size: 0, f: '' }, nama: { ...GT, b: true, size: 0, f: '' }, ket: { ...GT, size: 0, f: '' } },
};
// Tata letak per bagian surat. Setiap bagian berdiri sendiri; nilai jarak dalam pt, indentasi dalam mm.
export const DEFAULT_BAGIAN = {
  judul: { tampil: false, otomatis: true, teks: '', ukuran: 0, b: true, u: true, rata: 'center', atas: 0, bawah: 8, nomorDiBawah: true },
  header: { atas: 0, bawah: 14, antarBaris: 1, label: 'lengkap', perihalTebal: true },
  penerima: { tata: 'kiri', indent: 12, atas: 6, bawah: 14, tebalNama: false, tempat: 'di', tempatGeser: 14 },
  badan: { kiri: 0, kanan: 0 },
  salam: { atas: 0, bawah: 10, rata: 'left' },
  penutup: { atas: 8, bawah: 12, rata: 'justify', indent: 'ikut' },
  isi: { atas: 2, bawah: 4 },
  ttd: { atas: 8 },
  tembusan: { atas: 14, bawah: 1 },
};
export const bagianCfg = (set) => merge(DEFAULT_BAGIAN, set && set.bagian);
// Melengkapi set.bagian di tempat (identitas objek tetap), agar panel yang memegang rujukan tidak menjadi basi.
export function bagianTetap(set) {
  const isi = (d, s) => { for (const k of Object.keys(s)) { if (d[k] === undefined) d[k] = JSON.parse(JSON.stringify(s[k])); else if (s[k] && typeof s[k] === 'object' && !Array.isArray(s[k]) && d[k] && typeof d[k] === 'object') isi(d[k], s[k]); } };
  if (!set.bagian || typeof set.bagian !== 'object') set.bagian = {};
  isi(set.bagian, DEFAULT_BAGIAN); return set.bagian;
}

export const DEFAULT_SETTINGS = {
  tema: 'auto',
  kertas: 'A4', font: 't',
  margin: { atas: 20, bawah: 20, kiri: 25, kanan: 20 },
  ukuranFont: 12, spasi: 1.15, jarakParagraf: 9, indentUkuran: 36,
  formatTanggal: 'long', zona: 'WIB',
  rataTeks: 'justify', indentParagraf: true,
  kopDefault: 'nologo', kopGaris: true, kop: DEFAULT_KOP,
  logoUkuran: { muslimat: 22, fatayat: 22, alt: 22 }, // mm (kotak maksimum)
  salam: { pakai: false, pembuka: '', penutup: '', pakaiPembuka: true, pakaiPenutup: true, gaya: { b: false, i: false, color: '#000000' } },
  bagian: DEFAULT_BAGIAN, fontWord: '',
  dekor: { model: 'none', warna1: '', warna2: '', tampil: 'semua' }, // dekorasi halaman (lihat dekor.js)
  tanggalPosisi: 'atas', // 'atas' | 'ttd'
  tglAtasRata: 'left', // perataan teks kota/tanggal di kanan atas: 'left' | 'center' | 'right'
  tglAtasLebar: 38, // lebar area kota/tanggal (% lebar teks)
  ruangTtd: 62, // pt
  ttd: { ...DEFAULT_TTD, pengantar: 'Hormat kami,' }, // bawaan untuk surat baru
  pakaiOrgTtd: false,
  penomoran: {
    format: '{no}/{kode}/{bulan_romawi}/{tahun}',
    digit: 3, lingkup: 'semua', reset: 'tahunan',
    kodeJenis: Object.fromEntries(Object.entries(KATEGORI).map(([k, v]) => [k, v.kode])),
    formatJenis: {},
  },
};

// Contoh jenis pengguna: hanya mengisi nilai awal, semuanya tetap dapat diubah.
export const JENIS_PENGGUNA = {
  organisasi: { nama: 'Organisasi / lembaga', pejabat: ['Ketua', 'Sekretaris', 'Bendahara'], kode: 'ORG', salam: null },
  keagamaan: { nama: 'Organisasi keagamaan / majelis', pejabat: ['Ketua', 'Sekretaris', 'Bendahara'], kode: 'ORG', salam: { pakai: true, pembuka: "Assalamu'alaikum Warahmatullahi Wabarakatuh", penutup: "Wassalamu'alaikum Warahmatullahi Wabarakatuh" } },
  sekolah: { nama: 'Sekolah / lembaga pendidikan', pejabat: ['Kepala Sekolah', 'Wakil Kepala Sekolah', 'Sekretaris', 'Bendahara'], kode: 'SEK', salam: null },
  perusahaan: { nama: 'Perusahaan / usaha', pejabat: ['Direktur', 'Manajer', 'Sekretaris'], kode: 'PT', salam: null },
  pemerintahan: { nama: 'Instansi pemerintah / desa', pejabat: ['Kepala', 'Sekretaris', 'Kepala Seksi'], kode: 'PEM', salam: null },
  perorangan: { nama: 'Perorangan', pejabat: [], kode: '', salam: null },
};

export const daftarPejabat = (org) => (Array.isArray(org.pejabat) ? org.pejabat : PEJABAT_BAWAAN.map((p) => ({ ...p, nama: org[p.id] || '' })));

export const merge = (base, over) => {
  const out = clone(base);
  if (!over || typeof over !== 'object') return out;
  for (const k of Object.keys(out)) {
    if (over[k] === undefined) continue;
    if (out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) {
      if (!Object.keys(out[k]).length && over[k] && typeof over[k] === 'object') out[k] = clone(over[k]); // peta terbuka (mis. formatJenis)
      else out[k] = merge(out[k], over[k]);
    } else out[k] = over[k];
  }
  return out;
};

let _org = null; let _set = null; let _logos = null;

export async function loadAll() {
  const simpan = await kvGet('org');
  _org = merge(DEFAULT_ORG, simpan);
  if (simpan && !Array.isArray(simpan.pejabat)) _org.pejabat = daftarPejabat(simpan); // migrasi data lama
  _set = merge(DEFAULT_SETTINGS, await kvGet('settings'));
  const ls = await dbAll('logos');
  _logos = Object.fromEntries(ls.map((l) => [l.slot, l]));
}
export const getOrg = () => _org;
export const getSettings = () => _set;
export const getLogos = () => _logos;
export const orgDiisi = async () => !!(await kvGet('org'));

export async function saveOrg(o) { _org = merge(DEFAULT_ORG, o); await kvSet('org', _org); return _org; }
export async function saveSettings(s) { _set = merge(DEFAULT_SETTINGS, s); await kvSet('settings', _set); return _set; }
export async function resetOrg() { _org = clone(DEFAULT_ORG); await kvSet('org', _org); }
export async function resetSettings() { _set = clone(DEFAULT_SETTINGS); await kvSet('settings', _set); }

// Gaya kop lengkap (menambal data lama yang belum punya pengaturan kop).
export function kopCfg(set) {
  const k = merge(DEFAULT_KOP, set && set.kop);
  if (set && set.kopGaris === false && !(set.kop && set.kop.garis)) k.garis.gaya = 'none';
  return k;
}
export const ttdCfg = (set, letter) => ({ ...DEFAULT_TTD, ...((letter && letter.ttd) || {}) });
export const namaOrgSatuBaris = (o) => bersihkan(o.nama).split('\n').map((s) => s.trim()).filter(Boolean).join(' ');
export function alamatLengkap(o) {
  if (o.alamatBebas && o.alamatBebas.trim()) return o.alamatBebas.trim().replace(/\s*\n+\s*/g, ', ');
  const p = [];
  if (o.alamat) p.push(o.alamat.trim());
  if (o.desa) p.push(`${o.desaJenis || 'Desa'} ${o.desa.trim()}`);
  if (o.kecamatan) p.push(`Kecamatan ${o.kecamatan.trim()}`);
  if (o.kabupaten) p.push(`${o.kabJenis || 'Kabupaten'} ${o.kabupaten.trim()}`);
  if (o.provinsi) p.push(o.provinsi.trim());
  return p.join(', ');
}

export const kontakBaris = (o) => [o.telepon && `Telp. ${o.telepon}`, o.email && `Email: ${o.email}`, o.website].filter(Boolean).join('  |  ');

// ---------- Logo ----------
export const SLOT_LOGO = { muslimat: 'Logo utama', fatayat: 'Logo kedua', alt: 'Logo tambahan' };
const MAX_BYTES = 2 * 1024 * 1024;

export async function simpanLogo(slot, file) {
  if (!SLOT_LOGO[slot]) throw new Error('Slot logo tidak dikenal.');
  const mime = file.type;
  const nm = (file.name || '').toLowerCase();
  const okExt = /\.(png|jpe?g|svg)$/.test(nm);
  if (!okExt || !['image/png', 'image/jpeg', 'image/svg+xml'].includes(mime)) throw new Error('Format logo harus PNG, JPG, JPEG, atau SVG.');
  if (file.size > MAX_BYTES) throw new Error('Ukuran logo terlalu besar. Maksimal 2 MB.');
  if (file.size < 20) throw new Error('Berkas logo kosong atau rusak.');
  let src;
  if (mime === 'image/svg+xml') {
    const txt = await file.text();
    if (!/<svg[\s>]/i.test(txt)) throw new Error('Berkas SVG tidak valid.');
    if (/<script|<foreignObject|\son[a-z]+\s*=|javascript:/i.test(txt)) throw new Error('SVG ini memuat elemen yang tidak aman dan ditolak.');
    src = URL.createObjectURL(new Blob([txt], { type: 'image/svg+xml' }));
  } else src = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Gambar tidak dapat dibaca. Pastikan berkas tidak rusak.')); i.src = src; });
    let w = img.naturalWidth || 300; let hh = img.naturalHeight || 300;
    if (!w || !hh) { w = 300; hh = 300; }
    const sc = Math.min(1, 700 / Math.max(w, hh)) * (mime === 'image/svg+xml' ? Math.max(1, 700 / Math.max(w, hh)) : 1);
    const cw = Math.max(1, Math.round(w * sc)); const ch = Math.max(1, Math.round(hh * sc));
    const c = document.createElement('canvas'); c.width = cw; c.height = ch;
    const ctx = c.getContext('2d');
    const jpeg = mime === 'image/jpeg';
    if (jpeg) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cw, ch); }
    ctx.drawImage(img, 0, 0, cw, ch);
    const dataUrl = c.toDataURL(jpeg ? 'image/jpeg' : 'image/png', 0.92);
    const rec = { slot, name: file.name.slice(0, 80), mime: jpeg ? 'image/jpeg' : 'image/png', dataUrl, w: cw, h: ch };
    await dbPut('logos', rec);
    _logos[slot] = rec;
    return rec;
  } finally { URL.revokeObjectURL(src); }
}

export async function hapusLogo(slot) { await dbDel('logos', slot); delete _logos[slot]; }

// Gambar tanda tangan (opsional) memakai pipa yang sama namun tidak disimpan global.
export async function bacaGambarTtd(file) {
  if (!/\.(png|jpe?g)$/i.test(file.name || '') || !['image/png', 'image/jpeg'].includes(file.type)) throw new Error('Gambar tanda tangan harus PNG atau JPG.');
  if (file.size > 1024 * 1024) throw new Error('Ukuran gambar tanda tangan maksimal 1 MB.');
  const src = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Gambar tidak dapat dibaca.')); i.src = src; });
    const sc = Math.min(1, 800 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * sc); c.height = Math.round(img.naturalHeight * sc);
    const ctx = c.getContext('2d'); if (file.type === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return { dataUrl: c.toDataURL(file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png', 0.9), mime: file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png', w: c.width, h: c.height };
  } finally { URL.revokeObjectURL(src); }
}
