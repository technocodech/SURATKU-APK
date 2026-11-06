// Panel pengaturan gaya kop surat: font, ukuran, warna, ketebalan, perataan, garis pemisah, dan jarak.
// Dipakai di Data Organisasi (bawaan), editor surat (per surat), dan editor template.
import { h } from './util.js';
import { pilih, IKON } from './pilih.js';
import { kolom } from './ui.js';
import { DAFTAR_FONT } from './fonts.js';

export const GAYA_GARIS = [
  ['tebal-tipis', 'Ganda: tebal di atas, tipis di bawah (resmi)'], ['tipis-tebal', 'Ganda: tipis di atas, tebal di bawah'], ['ganda', 'Ganda sama tipis'],
  ['tunggal', 'Tunggal'], ['tebal', 'Tebal'], ['tipis', 'Tipis'], ['none', 'Tanpa garis'],
];
const BARIS = [
  ['induk', 'Instansi induk / atasan (opsional)'], ['nama', 'Nama instansi atau organisasi'], ['alamat', 'Alamat'],
  ['kontak', 'Telepon, email, dan website'], ['tambahan', 'Baris tambahan (mis. akreditasi, motto)'],
];

export const cek = (label, get, set, hint) => h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: !!get(), onchange: (e) => set(e.target.checked) }), h('span', null, label, hint ? h('div', { class: 'hint' }, hint) : null));
export const warna = (label, nilai, onInput) => {
  const inp = h('input', { type: 'color', value: /^#[0-9a-fA-F]{6}$/.test(nilai || '') ? nilai : '#000000', 'aria-label': label, class: 'clr', oninput: (e) => onInput(e.target.value) });
  return h('div', { class: 'fld' }, h('label', null, label), inp);
};
const angka = (v, min, max, dasar) => { const n = parseFloat(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : dasar; };

// K = objek kop lengkap (dapat diubah langsung). onChange dipanggil setiap ada perubahan.
export function panelKop(K, { onChange = () => {} } = {}) {
  const u = (fn) => (v) => { fn(v); onChange(); };
  const box = h('div', { class: 'kopgaya' });
  box.append(
    h('div', { class: 'two' },
      pilih({ label: 'Perataan teks kop', value: K.rata, onInput: u((v) => { K.rata = v; }), options: [['tengah', 'Tengah', 'Baku', IKON.tengahPendek], ['kiri', 'Rata kiri', '', IKON.rataKiri], ['kanan', 'Rata kanan', '', IKON.kanan]] }).el,
      kolom({ label: 'Jarak antarbaris kop', type: 'select', value: String(K.jarakBaris), options: [['1', 'Rapat (1,0)'], ['1.1', 'Sedikit rapat (1,1)'], ['1.2', 'Standar (1,2)'], ['1.35', 'Longgar (1,35)'], ['1.5', 'Lebar (1,5)']], onInput: u((v) => { K.jarakBaris = +v; }) }).el));
  for (const [kunci, nama] of BARIS) {
    const g = K.gaya[kunci];
    box.append(h('div', { class: 'sig' }, h('b', { class: 'small' }, nama),
      h('div', { class: 'gaya-grid' },
        kolom({ label: 'Jenis huruf', type: 'select', value: g.f, options: DAFTAR_FONT, onInput: u((v) => { g.f = v; }) }).el,
        kolom({ label: 'Ukuran (pt)', type: 'number', min: 6, max: 28, step: 0.5, value: g.size, onInput: u((v) => { g.size = angka(v, 6, 28, g.size); }) }).el,
        warna('Warna', g.color, u((v) => { g.color = v; })),
        kolom({ label: 'Jarak ke baris berikutnya (pt)', type: 'number', min: 0, max: 30, step: 0.5, value: g.jarak ?? 0, onInput: u((v) => { g.jarak = angka(v, 0, 30, 0); }) }).el),
      h('div', { class: 'row', style: { gap: '4px 18px' } },
        cek('Tebal', () => g.b, u((v) => { g.b = v; })), cek('Miring', () => g.i, u((v) => { g.i = v; })),
        cek('Garis bawah', () => g.u, u((v) => { g.u = v; })), cek('HURUF KAPITAL', () => g.kapital, u((v) => { g.kapital = v; })))));
  }
  box.append(h('div', { class: 'sig' }, h('b', { class: 'small' }, 'Garis pemisah di bawah kop'),
    h('div', { class: 'gaya-grid' },
      kolom({ label: 'Jenis garis', type: 'select', value: K.garis.gaya, options: GAYA_GARIS, onInput: u((v) => { K.garis.gaya = v; }) }).el,
      warna('Warna garis', K.garis.warna, u((v) => { K.garis.warna = v; })),
      kolom({ label: 'Jarak dari teks (pt)', type: 'number', min: 0, max: 24, value: K.garis.jarak, onInput: u((v) => { K.garis.jarak = angka(v, 0, 24, 4); }) }).el,
      kolom({ label: 'Ketebalan garis (pt, 0 = bawaan gaya)', type: 'number', min: 0, max: 8, step: 0.1, value: K.garis.tebal ?? 0, onInput: u((v) => { K.garis.tebal = angka(v, 0, 8, 0); }) }).el)),
    h('div', { class: 'two' },
      kolom({ label: 'Jarak setelah kop sebelum isi (pt)', type: 'number', min: 0, max: 60, value: K.jarakBawah, onInput: u((v) => { K.jarakBawah = angka(v, 0, 60, 10); }) }).el,
      kolom({ label: 'Jarak logo ke teks (pt)', type: 'number', min: 0, max: 40, value: K.gapLogo, onInput: u((v) => { K.gapLogo = angka(v, 0, 40, 8); }) }).el,
      kolom({ label: 'Jarak di atas kop (pt)', type: 'number', min: 0, max: 60, value: K.padAtas ?? 0, onInput: u((v) => { K.padAtas = angka(v, 0, 60, 0); }) }).el,
      kolom({ label: 'Posisi logo terhadap teks kop', type: 'select', value: K.logoVertikal || 'tengah', options: [['tengah', 'Tengah'], ['atas', 'Sejajar atas'], ['bawah', 'Sejajar bawah']], onInput: u((v) => { K.logoVertikal = v; }) }).el));
  return box;
}
