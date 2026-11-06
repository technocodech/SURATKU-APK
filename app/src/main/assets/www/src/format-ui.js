// Panel format dokumen: font, ukuran, spasi, paragraf, margin. Dipakai di Pengaturan, editor surat, dan editor template.
import { DEKOR, dekorMini } from './dekor.js';
import { alatGaya } from './ttd-ui.js';
import { h } from './util.js';
import { kolom } from './ui.js';
import { pilih, petunjuk, IKON, IKON_TEMPAT, ikonRataTeks } from './pilih.js';
import { DAFTAR_FONT } from './fonts.js';
import { cek, warna } from './kop-ui.js';
import { bagianCfg, bagianTetap } from './org.js';

// Kerapatan jarak antarbagian: ukuran dalam pt. Dipakai sebagai titik awal; setiap angka tetap bisa diubah manual.
export const JARAK_PRESET = {
  rapat: { nama: 'Rapat', ket: 'Hemat tempat', par: 5, header: { bawah: 6 }, penerima: { atas: 2, bawah: 8 }, salam: { atas: 0, bawah: 6 }, isi: { atas: 0, bawah: 0 }, penutup: { atas: 4, bawah: 6 }, ttd: { atas: 0 }, tembusan: { atas: 8 } },
  standar: { nama: 'Standar', ket: 'Seimbang', par: 7, header: { bawah: 9 }, penerima: { atas: 4, bawah: 10 }, salam: { atas: 0, bawah: 8 }, isi: { atas: 0, bawah: 2 }, penutup: { atas: 5, bawah: 9 }, ttd: { atas: 4 }, tembusan: { atas: 10 } },
  renggang: { nama: 'Renggang', ket: 'Lega, nyaman dibaca', par: 9, header: { bawah: 14 }, penerima: { atas: 6, bawah: 14 }, salam: { atas: 0, bawah: 10 }, isi: { atas: 2, bawah: 4 }, penutup: { atas: 8, bawah: 12 }, ttd: { atas: 8 }, tembusan: { atas: 14 } },
  lega: { nama: 'Sangat lega', ket: 'Jarak lebar antarbagian', par: 13, header: { bawah: 20 }, penerima: { atas: 10, bawah: 22 }, salam: { atas: 4, bawah: 16 }, isi: { atas: 6, bawah: 10 }, penutup: { atas: 12, bawah: 16 }, ttd: { atas: 14 }, tembusan: { atas: 18 } },
};
const IKON_JARAK = { rapat: IKON.jarakRapat, standar: IKON.jarakNormal, renggang: IKON.jarakLonggar, lega: IKON.jarakLebar };
const n = (v, min, max, dasar) => { const x = parseFloat(v); return Number.isFinite(x) ? Math.min(max, Math.max(min, x)) : dasar; };
const PT_CM = 72 / 2.54;

// set = objek pengaturan (font, ukuranFont, spasi, jarakParagraf, indentParagraf, indentUkuran, rataTeks, margin, tanggalPosisi).
export function panelFormat(set, { onChange = () => {}, kertas = null, tanggal = true, bagian = true } = {}) {
  const u = (fn) => (v) => { fn(v); onChange(); };
  set.margin = set.margin || { atas: 20, bawah: 20, kiri: 25, kanan: 20 };
  const manualBox = h('div');
  const gambarManual = () => manualBox.replaceChildren(h('details', { class: 'sub', open: true }, h('summary', null, 'Atur jarak manual per bagian (edit angka sendiri)'), panelBagian(set, { onChange: () => { gambarJarak(); onChange(); } })));
  const jarakPilih = h('div');
  const cocokPreset = () => Object.keys(JARAK_PRESET).find((k) => { const P = JARAK_PRESET[k]; const B = bagianTetap(set); return (set.jarakParagraf ?? 7) === P.par && B.header.bawah === P.header.bawah && B.penerima.bawah === P.penerima.bawah && B.penutup.bawah === P.penutup.bawah && B.ttd.atas === P.ttd.atas; }) || 'manual';
  const gambarJarak = () => jarakPilih.replaceChildren(pilih({ label: 'Jarak antarbagian surat (nomor, penerima, isi, penutup, tanda tangan)', value: cocokPreset(), cols: 5,
    onInput: (v) => { if (v === 'manual') return; const P = JARAK_PRESET[v]; set.jarakParagraf = P.par; const B = bagianTetap(set); for (const k of ['header', 'penerima', 'salam', 'isi', 'penutup', 'ttd', 'tembusan']) Object.assign(B[k], P[k]); gambarManual(); onChange(); },
    options: [...Object.entries(JARAK_PRESET).map(([k, P]) => [k, P.nama, P.ket, IKON_JARAK[k]]), ['manual', 'Manual', 'Ubah angka sendiri di bawah', IKON.jarakGanda]],
    hint: 'Pilih kerapatan awal, lalu sesuaikan angkanya per bagian di "Atur jarak manual". Berlaku di pratinjau, PDF, dan Word.' }).el);
  gambarJarak(); gambarManual();
  const indentBox = h('div');
  const gambarIndent = () => {
    indentBox.replaceChildren(set.indentParagraf !== false ? kolom({ label: 'Lebar menjorok baris pertama (cm)', type: 'number', min: 0.5, max: 3, step: 0.05, value: +((set.indentUkuran ?? 36) / PT_CM).toFixed(2), onInput: u((v) => { set.indentUkuran = Math.round(n(v, 0.5, 3, 1.27) * PT_CM); }) }).el : null);
  };
  gambarIndent();
  const mg = (label, k) => kolom({ label, type: 'number', min: 5, max: 60, value: set.margin[k], onInput: u((v) => { set.margin[k] = n(v, 5, 60, set.margin[k]); }) }).el;
  const dekorBox = h('div');
  const gambarDekor = () => {
    const D = set.dekor = { model: 'none', warna1: '', warna2: '', tampil: 'semua', ...(set.dekor || {}) };
    const ikonD = (k) => `<svg viewBox="0 0 70 99" aria-hidden="true"><rect x=".6" y=".6" width="68.8" height="97.8" rx="2" fill="#fff" stroke="#c9d0d7" stroke-width="1.2"/>${dekorMini(k, k === D.model ? D.warna1 : '', k === D.model ? D.warna2 : '')}</svg>`;
    const asli = DEKOR[D.model] || DEKOR.none;
    dekorBox.replaceChildren(
      pilih({ label: 'Dekorasi halaman (model Company)', value: D.model, cols: 4, onInput: (v) => { D.model = v; D.warna1 = DEKOR[v].w[0]; D.warna2 = DEKOR[v].w[1]; gambarDekor(); onChange(); },
        hint: 'Hiasan pada sudut/tepi halaman, tampil sama di pratinjau, PDF, dan Word. Atur margin atas/bawah/kiri bila isi surat perlu menjauh dari hiasan.',
        options: Object.entries(DEKOR).map(([k, d]) => [k, d.nama, d.ket, ikonD(k)]) }).el,
      D.model !== 'none' ? h('div', { class: 'two' },
        warna('Warna utama', D.warna1 || asli.w[0], u((v) => { D.warna1 = v; })), warna('Warna aksen', D.warna2 || asli.w[1], u((v) => { D.warna2 = v; })),
        pilih({ label: 'Tampil di', value: D.tampil || 'semua', onInput: u((v) => { D.tampil = v; }), options: [['semua', 'Semua halaman', '', IKON.kiri], ['pertama', 'Halaman pertama saja', '', IKON.kiri]] }).el) : null);
  };
  gambarDekor();
  const box = h('div', null,
    petunjuk('Klik gambar untuk memilih. Gambar kecil menunjukkan letak teks pada halaman; perubahan langsung terlihat di pratinjau dan ikut ke PDF/Word.', 'Cara memakai'),
    dekorBox,
    h('div', { class: 'two' },
      kolom({ label: 'Jenis huruf dokumen', type: 'select', value: set.font || 't', options: DAFTAR_FONT, tip: 'Times New Roman, Arial, dan Courier New. Tampil sama di pratinjau, PDF, dan Word.', onInput: u((v) => { set.font = v; }) }).el,
      kolom({ label: 'Ukuran huruf isi (pt)', type: 'number', min: 9, max: 16, step: 0.5, value: set.ukuranFont, onInput: u((v) => { set.ukuranFont = n(v, 9, 16, 12); }) }).el,
      kolom({ label: 'Jarak antarparagraf (pt)', type: 'number', min: 0, max: 30, value: set.jarakParagraf ?? 7, onInput: u((v) => { set.jarakParagraf = n(v, 0, 30, 7); }) }).el),
    jarakPilih,
    pilih({ label: 'Jarak antarbaris', value: String(set.spasi), onInput: u((v) => { set.spasi = +v; }), options: [['1', 'Rapat', '1,0', IKON.jarakRapat], ['1.15', 'Standar', '1,15', IKON.jarakNormal], ['1.3', 'Longgar', '1,3', IKON.jarakLonggar], ['1.5', 'Lebar', '1,5', IKON.jarakLebar], ['2', 'Ganda', '2,0', IKON.jarakGanda]] }).el,
    pilih({ label: 'Bentuk paragraf isi', value: set.indentParagraf !== false ? 'ya' : 'tidak', onInput: (v) => { set.indentParagraf = v === 'ya'; gambarIndent(); onChange(); }, options: [['ya', 'Menjorok', 'Baris pertama masuk ke dalam', IKON.parMenjorok], ['tidak', 'Rata kiri', 'Semua baris sejajar tepi kiri', IKON.parRata]] }).el,
    indentBox,
    pilih({ label: 'Perataan paragraf isi', value: set.rataTeks, onInput: u((v) => { set.rataTeks = v; }), options: [['justify', 'Kiri-kanan', 'Tepi kanan rapi (justify)', IKON.justify], ['left', 'Rata kiri', 'Tepi kanan bergerigi', IKON.rataKiri]] }).el,
    h('b', { class: 'small' }, 'Margin halaman (mm)'),
    h('div', { class: 'two', style: { marginTop: '8px' } }, mg('Atas', 'atas'), mg('Bawah', 'bawah'), mg('Kiri', 'kiri'), mg('Kanan', 'kanan')),
    kertas ? pilih({ label: 'Ukuran kertas', value: kertas.get(), onInput: (v) => { kertas.set(v); onChange(); }, options: [['A4', 'A4', '210 × 297 mm', IKON.a4], ['F4', 'F4 / Folio', '210 × 330 mm', IKON.f4]] }).el : null,
    tanggal ? pilih({ label: 'Letak tanggal surat', value: set.tanggalPosisi, onInput: u((v) => { set.tanggalPosisi = v; }), options: [['atas', 'Kanan atas surat', 'Di sudut atas, sejajar nomor', IKON.tglAtas], ['ttd', 'Atas tanda tangan', 'Pojok kanan bawah, sebelum jabatan', IKON.tglTtd], ['bawah', 'Bawah tanda tangan', 'Di bawah nama penandatangan', IKON.tglBawah]] }).el : null,
    tanggal && set.tanggalPosisi === 'atas' ? h('div', { class: 'two', style: { marginTop: '8px' } },
      pilih({ label: 'Perataan kota dan tanggal (kanan atas)', value: set.tglAtasRata || 'left', onInput: u((v) => { set.tglAtasRata = v; }), options: [['left', 'Rata kiri', 'Mulai dari awal kolom kanan'], ['center', 'Tengah', 'Di tengah kolom kanan'], ['right', 'Rata kanan', 'Ujung teks lurus dengan tepi margin kanan (sejajar ujung garis kop)']] }).el,
      kolom({ label: 'Lebar area tanggal (%)', type: 'number', value: set.tglAtasLebar ?? 38, hint: '20–60. Perkecil agar teks makin ke kanan (pada rata kiri); tidak berpengaruh besar pada rata kanan.', onInput: u((v) => { set.tglAtasLebar = Math.min(60, Math.max(20, +v || 38)); }) }).el) : null);
  box.append(kolom({ label: 'Nama font di file Word (opsional)', type: 'select', value: set.fontWord || '', options: [['', 'Sama dengan jenis huruf di atas'], ...FONT_WORD.map((x) => [x, x])],
    hint: 'Hanya memengaruhi file .docx. Pratinjau dan PDF tetap memakai font di atas, sehingga pemenggalan baris dapat sedikit berbeda.', onInput: u((v) => { set.fontWord = v; }) }).el);
  if (bagian) box.append(manualBox);
  return box;
}
const FONT_WORD = ['Calibri', 'Cambria', 'Bookman Old Style', 'Book Antiqua', 'Tahoma', 'Verdana', 'Garamond', 'Georgia', 'Century Gothic', 'Arial Narrow'];

// Pilihan penulisan "di Tempat" pada blok penerima (dipakai juga di editor surat).
export function pilihTempat(Pp, onChange = () => {}) {
  const P = new Proxy({}, { get: (_, k) => (typeof Pp === 'function' ? Pp() : Pp)[k], set: (_, k, v) => { (typeof Pp === 'function' ? Pp() : Pp)[k] = v; return true; } });
  const box = h('div');
  const gbr = () => box.replaceChildren(
    pilih({ label: 'Penulisan "di Tempat" (tujuan surat)', value: P.tempat || 'di', onInput: (v) => { P.tempat = v; gbr(); onChange(); },
      hint: 'Berlaku bila tujuan diawali "di" (mis. "di Tempat" atau "di Pemalang"). Isian lain ditampilkan apa adanya.',
      options: [['di', 'di Tempat', 'Huruf kecil', IKON_TEMPAT.di], ['Di', 'Di Tempat', 'Awal kapital', IKON_TEMPAT.Di], ['DI', 'DI TEMPAT', 'Semua kapital', IKON_TEMPAT.DI], ['strip', '- Ditempat', 'Pakai strip, tanpa spasi', IKON_TEMPAT.strip], ['vertikal', 'Di / TEMPAT', 'Dua baris, tebal, masuk ke kanan', IKON_TEMPAT.vertikal], ['vertikal2', 'Di / Tempat', 'Dua baris, tanpa tebal', IKON_TEMPAT.vertikal2], ['vertikal3', 'Di / Tempat (tebal)', 'Dua baris, keduanya tebal', IKON_TEMPAT.vertikal3], ['asli', 'Sesuai isian', 'Tidak diubah', IKON_TEMPAT.asli]] }).el,
    (P.tempat === 'vertikal' || P.tempat === 'vertikal2' || P.tempat === 'vertikal3') ? kolom({ label: 'Baris kedua masuk ke kanan (mm)', type: 'number', min: 0, max: 60, value: P.tempatGeser ?? 14, onInput: (v) => { P.tempatGeser = n(v, 0, 60, 14); onChange(); } }).el : null);
  gbr(); return box;
}
// Setiap bagian punya pengaturan sendiri sehingga mengubah satu bagian tidak menggeser bagian lain.
export function panelBagian(set, { onChange = () => {} } = {}) {
  const B = bagianTetap(set);
  set.salam = set.salam || {}; set.salam.gaya = { b: false, i: false, color: '#000000', size: 0, f: '', ...(set.salam.gaya || {}) }; const SG = set.salam.gaya;
  const u = (fn) => (v) => { fn(v); onChange(); };
  const num = (label, obj, k, min, max, step = 1) => kolom({ label, type: 'number', min, max, step, value: obj[k], onInput: u((v) => { obj[k] = n(v, min, max, obj[k]); }) }).el;
  const grup = (judul, ...isi) => h('div', { class: 'sig' }, h('b', { class: 'small' }, judul), h('div', { class: 'two', style: { marginTop: '8px' } }, ...isi));
  const indentEl = h('div');
  const gambarIndent = () => indentEl.replaceChildren(B.penerima.tata === 'menjorok' ? num('Jarak menjorok dari tepi kiri (mm)', B.penerima, 'indent', 0, 90) : null);
  gambarIndent();
  const judulBox = h('div');
  const gambarJudul = () => {
    const J = B.judul;
    judulBox.replaceChildren(h('div', { class: 'sig' }, h('b', { class: 'small' }, 'Judul surat (mis. SURAT UNDANGAN)'), petunjuk('Judul besar di atas nomor surat, misalnya SURAT UNDANGAN. Biarkan otomatis agar mengikuti jenis surat, atau tulis sendiri.'),
      cek('Tampilkan judul di atas nomor surat', () => J.tampil, (v) => { J.tampil = v; gambarJudul(); onChange(); }, 'Teks otomatis mengikuti jenis surat (undangan, pemberitahuan, permohonan, keterangan, tugas, pengantar, dst.).'),
      J.tampil ? h('div', null,
        cek('Pakai judul otomatis sesuai jenis surat', () => J.otomatis !== false, (v) => { J.otomatis = v; gambarJudul(); onChange(); }),
        J.otomatis === false ? kolom({ label: 'Teks judul sendiri', value: J.teks || '', ph: 'mis. SURAT UNDANGAN RAPAT', onInput: u((v) => { J.teks = v; }) }).el : null,
        h('div', { class: 'two', style: { marginTop: '8px' } },
          num('Ukuran huruf (pt, 0 = otomatis)', J, 'ukuran', 0, 30, 0.5),num('Jarak sebelum (pt)', J, 'atas', 0, 60), num('Jarak sesudah (pt)', J, 'bawah', 0, 60)),
        pilih({ label: 'Letak judul', value: J.rata || 'center', onInput: u((v) => { J.rata = v; }), options: [['center', 'Tengah', '', IKON.tengah], ['left', 'Kiri', '', IKON.rataKiri], ['right', 'Kanan', '', IKON.kanan]] }).el,
        h('div', { class: 'row', style: { gap: '4px 18px' } }, cek('Tebal', () => J.b !== false, u((v) => { J.b = v; })), cek('Garis bawah', () => J.u !== false, u((v) => { J.u = v; })))) : null));
  };
  gambarJudul();
  const badanBox = h('div');
  const gambarBadan = () => {
    const D = B.badan;
    const cocok = D.kiri === 0 && D.kanan === 0 ? 'nol' : (D.kiri === 12 && !D.kanan ? 'sedang' : (D.kiri === 22 && !D.kanan ? 'jauh' : 'manual'));
    const bt = (kiri) => `<svg viewBox="0 0 64 46" aria-hidden="true"><rect x=".75" y=".75" width="62.5" height="44.5" rx="3" fill="#fff" stroke="#c9d0d7" stroke-width="1.5"/><rect x="8" y="7" width="20" height="2.2" rx="1" fill="#33404d"/><rect x="${8 + kiri}" y="14" width="${48 - kiri}" height="2.2" rx="1" fill="#0b6b3a"/><rect x="${8 + kiri + 5}" y="20" width="${43 - kiri - 5}" height="2.2" rx="1" fill="#9aa3ad"/><rect x="${8 + kiri}" y="26" width="${48 - kiri}" height="2.2" rx="1" fill="#9aa3ad"/><rect x="${8 + kiri}" y="32" width="${30 - kiri / 2}" height="2.2" rx="1" fill="#9aa3ad"/></svg>`;
    badanBox.replaceChildren(h('div', { class: 'sig' }, h('b', { class: 'small' }, 'Geser seluruh isi surat ke kanan (badan surat)'),
      petunjuk('Menggeser penerima, salam, semua paragraf isi, dan kalimat penutup ke kanan sekaligus, sementara nomor-perihal tetap di tepi kiri. Seperti surat sekolah/dinas. Berlaku untuk semua jenis surat.'),
      pilih({ label: 'Seberapa jauh digeser', value: cocok, onInput: (v) => { if (v === 'manual') return; D.kiri = { nol: 0, sedang: 12, jauh: 22 }[v]; D.kanan = 0; gambarBadan(); onChange(); },
        options: [['nol', 'Tidak digeser', 'Sejajar margin kiri', bt(0)], ['sedang', 'Sedang', '12 mm dari margin', bt(8)], ['jauh', 'Jauh', '22 mm, seperti surat sekolah', bt(14)], ['manual', 'Atur sendiri', 'Isi angka di bawah', bt(10)]] }).el,
      h('div', { class: 'two' }, num('Geser dari kiri (mm)', D, 'kiri', 0, 80), num('Sempitkan dari kanan (mm)', D, 'kanan', 0, 60))));
  };
  gambarBadan();
  return h('div', { class: 'kopgaya' },
    badanBox,
    judulBox,
    h('div', { class: 'sig' }, h('b', { class: 'small' }, 'Nomor, lampiran, dan perihal'),
      petunjuk('Tiga baris di bawah kop: nomor surat, lampiran, dan perihal (pokok surat).'),
      h('div', { class: 'two', style: { marginTop: '8px' } },
        num('Jarak sebelum (pt)', B.header, 'atas', 0, 60), num('Jarak sesudah (pt)', B.header, 'bawah', 0, 60), num('Jarak antarbaris (pt)', B.header, 'antarBaris', 0, 20, 0.5)),
      pilih({ label: 'Penulisan label', value: B.header.label || 'lengkap', onInput: u((v) => { B.header.label = v; }), options: [['lengkap', 'Lengkap', 'Nomor / Lampiran / Perihal', IKON.nomorLengkap], ['singkat', 'Singkat', 'No / Lamp / Hal', IKON.nomorSingkat]] }).el,
      cek('Perihal dicetak tebal', () => B.header.perihalTebal !== false, u((v) => { B.header.perihalTebal = v; }))),
    h('div', { class: 'sig' }, h('b', { class: 'small' }, 'Penerima surat (Kepada Yth.)'),
      petunjuk('Blok "Kepada Yth." berisi nama dan alamat tujuan surat. Pilih apakah sejajar tepi kiri atau masuk ke kanan.'),
      pilih({ label: 'Tata letak', value: B.penerima.tata, onInput: (v) => { B.penerima.tata = v; gambarIndent(); onChange(); }, options: [['kiri', 'Rata kiri', 'Sejajar tepi kiri', IKON.kiri], ['menjorok', 'Menjorok ke kanan', 'Masuk dari tepi kiri', IKON.menjorok]] }).el,
      h('div', { class: 'two', style: { marginTop: '8px' } }, num('Jarak sebelum (pt)', B.penerima, 'atas', 0, 60), num('Jarak sesudah (pt)', B.penerima, 'bawah', 0, 60)),
      pilihTempat(B.penerima, onChange),
      indentEl, cek('Nama dan alamat penerima dicetak tebal', () => B.penerima.tebalNama, u((v) => { B.penerima.tebalNama = v; }), 'Baris "Kepada Yth." tetap normal.'),
      h('p', { class: 'hint' }, 'Pengaturan ini hanya memengaruhi blok penerima.')),
    h('div', { class: 'sig' }, h('b', { class: 'small' }, 'Salam pembuka dan penutup'),
      h('div', { class: 'two', style: { marginTop: '8px' } },
        num('Jarak sebelum (pt)', B.salam, 'atas', 0, 40), num('Jarak sesudah (pt)', B.salam, 'bawah', 0, 40)),
      pilih({ label: 'Perataan', value: B.salam.rata, onInput: u((v) => { B.salam.rata = v; }), options: [['left', 'Rata kiri', '', IKON.rataKiri], ['center', 'Tengah', '', IKON.tengahPendek]] }).el,
      h('p', { class: 'hint' }, 'Gaya huruf salam (juga bisa diatur langsung di bagian Isi surat). Ukuran 0 = ikut ukuran dokumen.'), alatGaya(SG, 'salam', u)),
    grup('Isi surat (seluruh blok isi)', num('Jarak sebelum isi (pt)', B.isi, 'atas', 0, 80), num('Jarak sesudah isi (pt)', B.isi, 'bawah', 0, 80)),
    grup('Kalimat penutup', pilih({ label: 'Perataan', value: B.penutup.rata, onInput: u((v) => { B.penutup.rata = v; }), options: [['justify', 'Kiri-kanan', '', IKON.justify], ['left', 'Rata kiri', '', IKON.rataKiri]] }).el,
      pilih({ label: 'Baris pertama', value: B.penutup.indent, onInput: u((v) => { B.penutup.indent = v; }), options: [['ikut', 'Ikut dokumen', 'Sama dengan isi', IKON.justify], ['ya', 'Menjorok', '', IKON.parMenjorok], ['tidak', 'Tanpa menjorok', '', IKON.parRata]] }).el,
      num('Jarak sebelum (pt)', B.penutup, 'atas', 0, 60), num('Jarak sesudah (pt)', B.penutup, 'bawah', 0, 60)),
    grup('Tanda tangan', num('Jarak tambahan dari kalimat penutup (pt)', B.ttd, 'atas', 0, 120)),
    grup('Tembusan', num('Jarak sebelum (pt)', B.tembusan, 'atas', 0, 60), num('Jarak antarbaris (pt)', B.tembusan, 'bawah', 0, 20, 0.5)),
    h('p', { class: 'hint' }, 'Jarak antarparagraf isi, margin halaman, dan spasi baris diatur di bagian atas panel ini; jarak kop diatur di bagian "Gaya kop". Perubahan langsung terlihat di pratinjau.'));
}
