// Alat format teks sebaris (tebal, miring, garis bawah, warna, bersihkan) untuk kolom isian dan blok isi.
import { h } from './util.js';

export const WARNA_CEPAT = [['#c00000', 'Merah'], ['#1f4e9e', 'Biru'], ['#0b6b3a', 'Hijau'], ['#7f6000', 'Emas tua'], ['#595959', 'Abu-abu']];

export function sisipTeks(el, teks) {
  const s = el.selectionStart ?? el.value.length; const e = el.selectionEnd ?? s;
  el.value = el.value.slice(0, s) + teks + el.value.slice(e);
  el.selectionStart = el.selectionEnd = s + teks.length; el.focus();
  el.dispatchEvent(new Event('input', { bubbles: true }));
}
export function bungkus(el, buka, tutup = buka, contoh = 'teks') {
  const s = el.selectionStart ?? el.value.length; const e = el.selectionEnd ?? s;
  if (s === e) { sisipTeks(el, buka + contoh + tutup); el.selectionStart = s + buka.length; el.selectionEnd = s + buka.length + contoh.length; return; }
  el.value = el.value.slice(0, s) + buka + el.value.slice(s, e) + tutup + el.value.slice(e);
  el.selectionStart = s; el.selectionEnd = e + buka.length + tutup.length; el.focus();
  el.dispatchEvent(new Event('input', { bubbles: true }));
}
export function bersihFormat(el) {
  const s = el.selectionStart ?? 0; const e = el.selectionEnd ?? 0;
  const potong = s === e ? [0, el.value.length] : [s, e];
  const bagian = el.value.slice(potong[0], potong[1]).replace(/\*\*|\+\+|\{w:#[0-9a-fA-F]{6}\}|\{\/w\}/g, '').replace(/\*/g, '');
  el.value = el.value.slice(0, potong[0]) + bagian + el.value.slice(potong[1]);
  el.dispatchEvent(new Event('input', { bubbles: true })); el.focus();
}
// Baris tombol kecil untuk satu kolom isian (input teks atau textarea).
export function barAlat(el, nama = 'kolom') {
  const t = (cls, ttl, label, fn, isi) => h('button', { class: 'btn sm ' + cls, type: 'button', title: ttl, 'aria-label': `${label} (${nama})`, onmousedown: (e) => e.preventDefault(), onclick: fn }, isi);
  return h('div', { class: 'tb tb-mini', role: 'toolbar', 'aria-label': 'Format teks ' + nama },
    t('', 'Tebalkan teks terpilih', 'Tebal', () => bungkus(el, '**'), h('b', null, 'B')),
    t('', 'Miringkan teks terpilih', 'Miring', () => bungkus(el, '*'), h('i', null, 'I')),
    t('', 'Garis bawahi teks terpilih', 'Garis bawah', () => bungkus(el, '++'), h('u', null, 'U')),
    h('select', { 'aria-label': `Warnai teks terpilih (${nama})`, title: 'Warnai teks terpilih', onchange: (e) => { if (e.target.value) bungkus(el, `{w:${e.target.value}}`, '{/w}'); e.target.value = ''; } }, h('option', { value: '' }, 'Warna…'), WARNA_CEPAT.map(([v, x]) => h('option', { value: v }, x))),
    t('', 'Hapus format pada teks terpilih (atau seluruh teks)', 'Bersihkan format', () => bersihFormat(el), 'Tx'));
}
