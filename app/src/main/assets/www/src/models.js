// Model gaya siap pakai (kop, format, tata letak penerima, dan tanda tangan) yang terinspirasi dari ragam surat resmi
// di Indonesia. Dipakai oleh template "Model ..." dan tombol "Terapkan model gaya" di editor. Warna dan isi bebas diubah.
const G = (extra) => ({ f: 't', b: false, i: false, u: false, color: '#000000', kapital: false, jarak: 0, ...extra });
import { TTD_MODEL } from './ttd-data.js';
import { MODEL_COMPANY } from './models-company.js';
export { MODEL_COMPANY };
const GT = (extra) => ({ b: false, i: false, color: '#000000', ...extra });
const SALAM_ISLAMI = { pakai: true, pembuka: "Assalamu'alaikum Warahmatullahi Wabarakatuh", penutup: "Wassalamu'alaikum Warahmatullahi Wabarakatuh" };

export const MODEL_GAYA = {
  sekolahMenjorok: {
    nama: 'Sekolah / dinas: seluruh isi menjorok ke kanan, penerima "Di / TEMPAT"', ket: 'Nomor di tepi kiri; penerima, salam, paragraf, dan penutup masuk ke kanan, rata kiri-kanan, spasi 1,5, tanda tangan rata kiri.',
    format: {
      font: 't', ukuranFont: 12, spasi: 1.5, jarakParagraf: 6, tanggalPosisi: 'ttd', indentParagraf: true, indentUkuran: 40, rataTeks: 'justify', margin: { atas: 15, bawah: 15, kiri: 15, kanan: 12 },
      bagian: { header: { label: 'lengkap', antarBaris: 1, bawah: 12, perihalTebal: true }, penerima: { tata: 'kiri', tebalNama: false, atas: 4, bawah: 10, tempat: 'vertikal', tempatGeser: 14 }, badan: { kiri: 22, kanan: 0 }, salam: { atas: 0, bawah: 8, rata: 'left' }, penutup: { rata: 'justify', indent: 'ikut' } },
      salam: { pakai: true, pembuka: "Assalamu'alaikum Wr. Wb.", penutup: "Wassalamu'alaikum Wr. Wb.", gaya: { b: true, i: true, color: '#000000' } },
      kop: { rata: 'tengah', jarakBaris: 1.1, garis: { gaya: 'tebal-tipis', warna: '#000000', jarak: 3, tebal: 0 }, gaya: { induk: G({ size: 12, b: true, kapital: true }), nama: G({ size: 17, b: true, kapital: true }), alamat: G({ size: 9, b: true }), kontak: G({ size: 9 }) } },
    },
    ttd: { pengantar: '', rata: 'left', garisNama: true, gaya: { jabatan: GT({}), nama: GT({ b: true }) } },
  },
  menjorokSedang: {
    nama: 'Isi menjorok sedang (12 mm)', ket: 'Penerima, salam, paragraf, dan penutup masuk 12 mm dari margin; penerima "di Tempat".',
    format: { spasi: 1.3, indentParagraf: true, rataTeks: 'justify', bagian: { badan: { kiri: 12, kanan: 0 }, penerima: { tata: 'kiri', tempat: 'di' } } },
    ttd: { rata: 'center' },
  },
  panitia: {
    nama: 'Panitia / ormas: penerima menjorok, "Mengetahui" di bawah', ket: 'Kop dua logo, penerima di sisi kanan, salam, tanda tangan panitia lalu pihak yang mengetahui.',
    format: {
      font: 't', ukuranFont: 12, spasi: 1.15, tanggalPosisi: 'atas', indentParagraf: true,
      bagian: { penerima: { tata: 'menjorok', indent: 95, atas: 6, bawah: 10, tebalNama: false } },
      salam: SALAM_ISLAMI,
      kop: { rata: 'tengah', jarakBaris: 1.15, garis: { gaya: 'tebal', warna: '#000000', jarak: 3, tebal: 2.2 }, gaya: { induk: G({ size: 13, b: true, kapital: true }), nama: G({ size: 13, b: true, kapital: true }), alamat: G({ size: 9.5 }), kontak: G({ size: 9.5 }) } },
    },
    ttd: { pengantar: 'PANITIA PELAKSANA', garisNama: true, gaya: { pengantar: GT({ b: true }), jabatan: GT({ b: true }), nama: GT({ b: true }), ket: GT({ b: true }), instansi: GT({ b: true }) } },
  },
  lazismu: {
    nama: 'Lazismu / Muhammadiyah: penerima "- Ditempat", panitia dua tanda tangan', ket: 'Kop dua logo, penerima menjorok dengan "- Ditempat", salam, lalu PANITIA PELAKSANA: Ketua dan Sekretaris saja.',
    format: {
      font: 't', ukuranFont: 12, spasi: 1.15, tanggalPosisi: 'atas', indentParagraf: true,
      bagian: { penerima: { tata: 'menjorok', indent: 95, atas: 6, bawah: 10, tebalNama: false, tempat: 'strip' } },
      salam: SALAM_ISLAMI,
      kop: { rata: 'tengah', jarakBaris: 1.15, garis: { gaya: 'tebal', warna: '#000000', jarak: 3, tebal: 2.2 }, gaya: { induk: G({ size: 13, b: true, kapital: true }), nama: G({ size: 13, b: true, kapital: true }), alamat: G({ size: 9.5 }), kontak: G({ size: 9.5 }) } },
    },
    ttd: TTD_MODEL['panitia-2'].ttd,
  },
  himpunan: {
    nama: 'Organisasi kemahasiswaan: kop berwarna, nama organisasi di tanda tangan', ket: 'Kop sans-serif berwarna, penerima tebal, "Hormat kami" dengan nama organisasi, lalu "Mengetahui".',
    format: {
      font: 't', ukuranFont: 12, spasi: 1.15, tanggalPosisi: 'atas', indentParagraf: true,
      bagian: { penerima: { tata: 'kiri', atas: 8, bawah: 10, tebalNama: true } },
      salam: { pakai: false, pembuka: '', penutup: '' },
      kop: { rata: 'tengah', jarakBaris: 1.15, garis: { gaya: 'tipis', warna: '#333333', jarak: 3, tebal: 0.8 }, gaya: { induk: G({ f: 's', size: 14, b: true, color: '#4a8fc7', kapital: true }), nama: G({ f: 's', size: 15, b: true, kapital: true }), alamat: G({ f: 's', size: 8, i: true }), kontak: G({ f: 's', size: 8 }) } },
    },
    ttd: { pengantar: 'Hormat kami,\n**{{nama_organisasi}}**', garisNama: true, gaya: { pengantar: GT({ color: '#3f78b5' }), jabatan: GT({}), nama: GT({ b: true }), ket: GT({ b: true }) } },
  },
  sekolah: {
    nama: 'Sekolah / pesantren: salam tebal miring, spasi 1,5', ket: 'Kop tegas dua garis, salam pembuka dan penutup miring tebal, tanggal di atas tanda tangan.',
    format: {
      font: 't', ukuranFont: 12, spasi: 1.5, tanggalPosisi: 'ttd', indentParagraf: true,
      bagian: { header: { atas: 0, bawah: 10 }, penerima: { tata: 'menjorok', indent: 12, atas: 4, bawah: 12, tebalNama: false }, salam: { atas: 4, bawah: 6, rata: 'left' } },
      salam: { pakai: true, pembuka: "Assalamu'alaikum Wr. Wb.", penutup: "Wassalamu'alaikum Wr. Wb.", gaya: { b: true, i: true, color: '#000000' } },
      kop: { rata: 'tengah', jarakBaris: 1.1, garis: { gaya: 'tebal-tipis', warna: '#000000', jarak: 3, tebal: 0 }, gaya: { induk: G({ size: 12, b: true, kapital: true }), nama: G({ size: 17, b: true, kapital: true }), alamat: G({ size: 9, b: true }), kontak: G({ size: 9 }) } },
    },
    ttd: { pengantar: '', garisNama: false, gaya: { jabatan: GT({}), nama: GT({ b: true }) } },
  },
  kementerian: {
    nama: 'Instansi pemerintah: huruf sans, kop dengan garis tunggal', ket: 'Arial 11 pt, penerima dengan nama tebal, tanda tangan tanpa garis bawah dengan NIP.',
    format: {
      font: 's', ukuranFont: 11, spasi: 1.15, tanggalPosisi: 'atas', indentParagraf: true,
      bagian: { penerima: { tata: 'kiri', atas: 8, bawah: 10, tebalNama: true } },
      salam: { pakai: false, pembuka: '', penutup: '' },
      kop: { rata: 'tengah', jarakBaris: 1.15, garis: { gaya: 'tunggal', warna: '#000000', jarak: 5, tebal: 1.2 }, gaya: { induk: G({ f: 's', size: 14, b: true, kapital: true }), nama: G({ f: 's', size: 14, b: true, kapital: true }), alamat: G({ f: 's', size: 8.5 }), kontak: G({ f: 's', size: 8.5 }) } },
    },
    ttd: { pengantar: '', garisNama: false, gaya: { jabatan: GT({ b: true }), nama: GT({ b: true }), ket: GT({}) } },
  },
  takzim: {
    nama: 'Lembaga negara / balai: huruf serif, penutup "Salam takzim"', ket: 'Times 12 pt, nama dan alamat penerima tebal, penutup "Salam takzim," di atas jabatan.',
    format: {
      font: 't', ukuranFont: 12, spasi: 1.15, tanggalPosisi: 'atas', indentParagraf: true,
      bagian: { penerima: { tata: 'kiri', atas: 8, bawah: 10, tebalNama: true } },
      salam: { pakai: false, pembuka: '', penutup: '' },
      kop: { rata: 'tengah', jarakBaris: 1.15, garis: { gaya: 'tunggal', warna: '#000000', jarak: 4, tebal: 0.8 }, gaya: { induk: G({ size: 14, kapital: true }), nama: G({ size: 14, b: true, kapital: true }), alamat: G({ size: 9 }), kontak: G({ size: 9, i: true }) } },
    },
    ttd: { pengantar: 'Salam takzim,', pengantarPosisi: 'kanan', garisNama: false, gaya: { jabatan: GT({}), nama: GT({ b: true }), ket: GT({}) } },
  },
};

// ---------- Format surat: hanya tata letak, tidak memaksakan isi atau kalimat ----------
import { kopCfg, bagianCfg, merge, DEFAULT_TTD } from './org.js';
const J = (extra = {}) => ({ tampil: true, otomatis: true, b: true, u: true, rata: 'center', atas: 0, bawah: 10, ...extra });
export const FORMAT_SURAT = {
  resmi: { nama: 'Format Surat Resmi Standar', ket: 'Times 12 pt, nomor-lampiran-perihal, penerima rata kiri, tanda tangan di kanan.',
    format: { font: 't', ukuranFont: 12, spasi: 1.15, jarakParagraf: 7, tanggalPosisi: 'atas', indentParagraf: true, bagian: { judul: { tampil: false }, header: { label: 'lengkap', antarBaris: 1, bawah: 8 }, penerima: { tata: 'kiri', tebalNama: false, atas: 6, bawah: 10 }, penutup: { rata: 'justify' } } },
    ttd: { pengantarRata: 'center', garisNama: true } },
  organisasi: { nama: 'Format Surat Organisasi', ket: 'Ketua dan sekretaris berdampingan, nama organisasi di atas jabatan, jarak lega.',
    format: { font: 't', ukuranFont: 12, spasi: 1.15, jarakParagraf: 8, tanggalPosisi: 'atas', indentParagraf: true, bagian: { judul: { tampil: false }, header: { label: 'lengkap', antarBaris: 1.5, bawah: 10 }, penerima: { tata: 'kiri', tebalNama: false, atas: 6, bawah: 12 }, penutup: { rata: 'justify' } } },
    ttd: { instansi: true, garisNama: true, jarak: 'normal' } },
  undangan: { nama: 'Format Surat Undangan', ket: 'Judul SURAT UNDANGAN, penerima rata kiri dengan nama tebal, rincian acara menjorok.',
    format: { font: 't', ukuranFont: 12, spasi: 1.15, jarakParagraf: 8, tanggalPosisi: 'atas', indentParagraf: true, bagian: { judul: J(), header: { label: 'lengkap', antarBaris: 1, bawah: 8 }, penerima: { tata: 'kiri', tebalNama: true, atas: 6, bawah: 10 }, penutup: { rata: 'justify' } } },
    ttd: { garisNama: true } },
  pemberitahuan: { nama: 'Format Surat Pemberitahuan', ket: 'Judul SURAT PEMBERITAHUAN, penerima menjorok ke kanan, spasi isi sedikit longgar.',
    format: { font: 't', ukuranFont: 12, spasi: 1.3, jarakParagraf: 8, tanggalPosisi: 'atas', indentParagraf: true, bagian: { judul: J(), header: { label: 'lengkap', antarBaris: 1, bawah: 8 }, penerima: { tata: 'menjorok', indent: 90, tebalNama: false, atas: 6, bawah: 10 }, penutup: { rata: 'justify' } } },
    ttd: { garisNama: true } },
  permohonan: { nama: 'Format Surat Permohonan', ket: 'Judul SURAT PERMOHONAN, penerima menjorok sedikit, paragraf menjorok, tanda tangan kanan.',
    format: { font: 't', ukuranFont: 12, spasi: 1.15, jarakParagraf: 8, tanggalPosisi: 'atas', indentParagraf: true, bagian: { judul: J(), header: { label: 'lengkap', antarBaris: 1, bawah: 8 }, penerima: { tata: 'menjorok', indent: 12, tebalNama: false, atas: 6, bawah: 12 }, penutup: { rata: 'justify' } } },
    ttd: { garisNama: true } },
  keterangan: { nama: 'Format Surat Keterangan', ket: 'Judul besar di tengah, spasi 1,5, tanggal di atas tanda tangan, satu penandatangan.',
    format: { font: 't', ukuranFont: 12, spasi: 1.5, jarakParagraf: 8, tanggalPosisi: 'ttd', indentParagraf: true, bagian: { judul: J({ ukuran: 14, bawah: 12 }), header: { label: 'lengkap', antarBaris: 1, bawah: 12 }, penerima: { tata: 'kiri', tebalNama: false }, penutup: { rata: 'justify' } } },
    ttd: { garisNama: true } },
  tugas: { nama: 'Format Surat Tugas', ket: 'Judul SURAT TUGAS, spasi 1,5, tanggal di atas tanda tangan, tanpa garis bawah nama.',
    format: { font: 't', ukuranFont: 12, spasi: 1.5, jarakParagraf: 8, tanggalPosisi: 'ttd', indentParagraf: true, bagian: { judul: J({ ukuran: 14, bawah: 12 }), header: { label: 'lengkap', antarBaris: 1, bawah: 12 }, penerima: { tata: 'kiri' }, penutup: { rata: 'justify' } } },
    ttd: { garisNama: false } },
  keputusan: { nama: 'Format Surat Keputusan', ket: 'Judul SURAT KEPUTUSAN, spasi lega, paragraf rata kiri-kanan, tanggal di atas tanda tangan.',
    format: { font: 't', ukuranFont: 12, spasi: 1.3, jarakParagraf: 10, tanggalPosisi: 'ttd', indentParagraf: false, bagian: { judul: J({ ukuran: 14, bawah: 12 }), header: { label: 'lengkap', antarBaris: 1, bawah: 12 }, penerima: { tata: 'kiri' }, penutup: { rata: 'justify' } } },
    ttd: { garisNama: false } },
  pengantar: { nama: 'Format Surat Pengantar', ket: 'Judul SURAT PENGANTAR, label ringkas No/Lamp/Hal, penerima menjorok dengan nama tebal.',
    format: { font: 't', ukuranFont: 12, spasi: 1.15, jarakParagraf: 8, tanggalPosisi: 'atas', indentParagraf: true, bagian: { judul: J(), header: { label: 'singkat', antarBaris: 1, bawah: 8 }, penerima: { tata: 'menjorok', indent: 12, tebalNama: true, atas: 6, bawah: 10 }, penutup: { rata: 'justify' } } },
    ttd: { garisNama: true } },
};
export const SEMUA_FORMAT = { ...FORMAT_SURAT, ...MODEL_GAYA, ...MODEL_COMPANY };

// Menerapkan format ke surat (hanya tata letak/gaya; isi surat tidak disentuh).
export function terapkanFormat(L, m) {
  const set = L.snap.set;
  Object.assign(set, merge(set, m.format || {}));
  set.dekor = { model: 'none', warna1: '', warna2: '', tampil: 'semua', ...((m.format && m.format.dekor) || {}) };
  set.kop = kopCfg(set); set.bagian = bagianCfg(set);
  if (m.format && m.format.kertas) L.kertas = m.format.kertas;
  const t = m.ttd || {};
  L.ttd = { ...DEFAULT_TTD, ...(L.ttd || {}), ...t, gaya: merge(merge(DEFAULT_TTD.gaya, (L.ttd || {}).gaya), t.gaya) };
}
// Ambil format dari surat yang sedang dibuka agar bisa disimpan dan dipakai ulang.
export function ambilFormat(L) {
  const s = L.snap.set;
  const format = JSON.parse(JSON.stringify({ font: s.font, ukuranFont: s.ukuranFont, spasi: s.spasi, jarakParagraf: s.jarakParagraf, indentParagraf: s.indentParagraf, indentUkuran: s.indentUkuran, rataTeks: s.rataTeks, dekor: s.dekor, margin: s.margin, tanggalPosisi: s.tanggalPosisi, kop: s.kop, bagian: s.bagian, salam: s.salam, fontWord: s.fontWord || '', kertas: L.kertas }));
  const ttd = JSON.parse(JSON.stringify({ ...L.ttd, pengantar: undefined }));
  return { format, ttd };
}
