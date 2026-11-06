// Model "Company": kop berlogo dengan dekorasi halaman (lihat dekor.js). Hanya mengatur tampilan; isi surat tidak berubah.
const G = (extra) => ({ f: 's', b: false, i: false, u: false, color: '#000000', kapital: false, jarak: 0, ...extra });
const TTD = { pengantar: '', susunan: 'tidak', instansi: false, rata: 'center', garisNama: false, gaya: { jabatan: { b: true, i: false, color: '#000000' }, nama: { b: true, i: false, color: '#000000' } } };

const buat = (nama, ket, dekor, w, { kopRata = 'kiri', atas = 18, bawah = 22, kiri = 25, kanan = 20, garis = 'ganda' } = {}) => ({
  nama, ket,
  format: {
    font: 's', ukuranFont: 11, spasi: 1.15, tanggalPosisi: 'atas', indentParagraf: false,
    margin: { atas, bawah, kiri, kanan },
    dekor: { model: dekor, warna1: w[0], warna2: w[1], tampil: 'semua' },
    bagian: { penerima: { tata: 'kiri', atas: 8, bawah: 10, tebalNama: false, tempat: 'Di' } },
    salam: { pakai: false, pembuka: '', penutup: '' },
    kop: { rata: kopRata, jarakBaris: 1.15, garis: { gaya: garis, warna: w[0], jarak: 3, tebal: 0 }, gaya: { induk: G({ size: 11, b: true, kapital: true, color: w[0] }), nama: G({ size: 15, b: true, kapital: true, color: w[0] }), alamat: G({ size: 8.5 }), kontak: G({ size: 8.5 }) } },
  },
  ttd: TTD,
});

export const MODEL_COMPANY = {
  'company-badan': buat('Company: kop kiri, faset sudut bawah', 'Logo kiri dengan teks rata kiri dan garis ganda; bidang bersudut di pojok kanan bawah (gaya badan pemerintah).', 'faset', ['#2f6f9f', '#6a5c9e'], { atas: 14, bawah: 24 }),
  'company-sudut': buat('Company: pita miring di sudut atas', 'Pita miring hitam-emas di kiri atas dan pita tebal di bawah. Cocok untuk perusahaan modern.', 'sudut', ['#1b1b1b', '#c99a14'], { kopRata: 'tengah', atas: 40, bawah: 22, garis: 'tipis' }),
  'company-editorial': buat('Company: segitiga oranye editorial', 'Segitiga di pojok kiri atas dan kanan bawah, kop rata kiri.', 'editorial', ['#e8761c', '#f4a64a'], { atas: 28, bawah: 30, garis: 'tebal' }),
  'company-gelombang': buat('Company: gelombang berwarna di bawah', 'Dua gelombang hijau-emas di dasar halaman, kop di tengah.', 'gelombang', ['#2d8c6e', '#e0b422'], { kopRata: 'tengah', atas: 16, bawah: 28, garis: 'tunggal' }),
  'company-bilah': buat('Company: bilah biru di sisi kiri', 'Bilah tegak biru-emas di tepi kiri dan garis miring di pojok kanan atas.', 'bilah', ['#14264a', '#c99a14'], { atas: 16, bawah: 20, kiri: 32, garis: 'tebal-tipis' }),
  'company-pita': buat('Company: pita warna di atas halaman', 'Pita biru selebar halaman di atas, kop tengah di bawahnya.', 'pita', ['#0b4f7a', '#e0b422'], { kopRata: 'tengah', atas: 20, bawah: 20, garis: 'tipis' }),
  'company-diagonal': buat('Company: pita diagonal merah', 'Pita gelap miring di atas dengan segitiga merah, kop tengah; sudut kecil di kanan bawah.', 'diagonal', ['#2a303b', '#e0302a'], { kopRata: 'tengah', atas: 36, bawah: 24, garis: 'tipis' }),
  'company-kipas': buat('Company: kipas oranye', 'Kipas oranye berlapis di pojok kanan atas dan kiri bawah, kop rata kiri.', 'kipas', ['#d9621a', '#f0a923'], { atas: 26, bawah: 30, garis: 'tebal' }),
  'company-lengkung': buat('Company: lengkung hijau dan biru', 'Kop kecil di kiri atas dan pita lengkung hijau-biru tua di dasar halaman.', 'lengkung', ['#1f3a4d', '#a9c820'], { atas: 16, bawah: 34, garis: 'tunggal' }),
  'company-blok': buat('Company: blok bertingkat', 'Kotak bertingkat di pojok kanan atas dan kiri bawah, kop rata kiri; kesan korporat tegas.', 'blok', ['#1d3557', '#e63946'], { atas: 24, bawah: 28, garis: 'tebal' }),
  'company-lingkaran': buat('Company: lingkaran sudut', 'Lingkaran berlapis di pojok kiri atas dan kanan bawah, kop di tengah.', 'lingkaran', ['#2b6cb0', '#f6ad55'], { kopRata: 'tengah', atas: 38, bawah: 38, garis: 'tipis' }),
  'company-bingkai': buat('Company: bingkai ganda resmi', 'Bingkai tipis ganda keemasan di tepi halaman; kop di tengah, cocok untuk surat penghargaan atau undangan resmi.', 'bingkai', ['#7a5c12', '#c99a14'], { kopRata: 'tengah', atas: 22, bawah: 22, kiri: 28, kanan: 24, garis: 'ganda' }),
  'company-gunung': buat('Company: siluet pegunungan', 'Siluet pegunungan hijau di dasar halaman dengan garis tipis di atas, kop rata kiri.', 'gunung', ['#1f5f4a', '#8fbf9f'], { atas: 16, bawah: 38, garis: 'tunggal' }),
  'company-chevron': buat('Company: chevron ungu dan oranye', 'Deretan panah ungu-oranye di atas dan pita di dasar halaman, kop rata kiri.', 'chevron', ['#7b2cbf', '#ff9e00'], { atas: 36, bawah: 22, garis: 'tipis' }),
  'company-tangga': buat('Company: tangga bertingkat', 'Bidang bertingkat seperti tangga di kiri atas dan kanan bawah, kop rata kiri.', 'tangga', ['#0f4c5c', '#e36414'], { atas: 34, bawah: 32, garis: 'tebal' }),
  'company-berlian': buat('Company: belah ketupat ungu-emas', 'Deretan belah ketupat di atas halaman dan pita di dasar, kop di tengah.', 'berlian', ['#4a1d6b', '#d4a017'], { kopRata: 'tengah', atas: 22, bawah: 24, garis: 'ganda' }),
  'company-ombak': buat('Company: ombak atas dan bawah', 'Gelombang tipis biru di atas dan bawah halaman, kop di tengah.', 'ombak', ['#0077b6', '#90e0ef'], { kopRata: 'tengah', atas: 22, bawah: 24, garis: 'tipis' }),
  'company-sayap': buat('Company: sayap miring', 'Bidang miring hijau-petrol dan emas di kiri atas dan kanan bawah, kop rata kiri.', 'sayap', ['#264653', '#e9c46a'], { atas: 36, bawah: 36, garis: 'tebal-tipis' }),
  'company-titik': buat('Company: matriks titik merah', 'Pola titik di kanan atas dan garis tebal di dasar, kop rata kiri.', 'titik', ['#c1121f', '#003049'], { atas: 22, bawah: 24, garis: 'tunggal' }),
};
