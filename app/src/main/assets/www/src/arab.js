// Teks Arab: dirender ke gambar PNG (bentuk huruf bersambung dan arah kanan-ke-kiri ditangani peramban)
// lalu dipakai sama persis oleh pratinjau, PDF, dan Word. Font: FreeSerif (GNU FreeFont, bebas dipakai dalam dokumen).
export const FRASA_ARAB = [
  ['Bismillah', 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ'],
  ['Assalamu’alaikum warahmatullahi wabarakatuh', 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ'],
  ['Alhamdulillahi rabbil ’alamin', 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ'],
  ['Shalawat', 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ'],
  ['Wassalamu’alaikum warahmatullahi wabarakatuh', 'وَالسَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ'],
  ['Jazakumullahu khairan', 'جَزَاكُمُ اللَّهُ خَيْرًا'],
];
const SKALA = 6; // piksel per pt
const cache = new Map();
let siap = false;
export async function muatFontArab() {
  try { await Promise.all([document.fonts.load('400 24px SuratArab', 'ب'), document.fonts.load('700 24px SuratArab', 'ب')]); siap = true; } catch { siap = false; }
}
export const adaArab = (t) => /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/.test(t || '');
// Mengembalikan {dataUrl,mime,w,h} dalam satuan pt, atau null bila kosong.
export function arabGambar(teks, ukuranPt = 20, { warna = '#000000', tebal = false, lebarMaks = 400 } = {}) {
  const t = String(teks || '').replace(/\r/g, '').split('\n').map((s) => s.trim()).filter(Boolean);
  if (!t.length) return null;
  const kunci = [t.join('\n'), ukuranPt, warna, tebal, Math.round(lebarMaks)].join('|');
  if (cache.has(kunci)) return cache.get(kunci);
  const px = ukuranPt * SKALA; const font = `${tebal ? 700 : 400} ${px}px SuratArab, FreeSerif, 'Traditional Arabic', serif`;
  const c = document.createElement('canvas'); const x = c.getContext('2d');
  x.direction = 'rtl'; x.font = font;
  // bungkus baris agar tidak melebihi lebar
  const maks = lebarMaks * SKALA; const baris = [];
  for (const ln of t) {
    const kata = ln.split(/\s+/); let cur = '';
    for (const k of kata) { const uji = cur ? cur + ' ' + k : k; if (cur && x.measureText(uji).width > maks) { baris.push(cur); cur = k; } else cur = uji; }
    if (cur) baris.push(cur);
  }
  const lh = px * 1.75; const w = Math.ceil(Math.min(maks, Math.max(...baris.map((b) => x.measureText(b).width))) + 8); const h = Math.ceil(lh * baris.length);
  c.width = w; c.height = h; const g = c.getContext('2d');
  g.direction = 'rtl'; g.font = font; g.fillStyle = warna; g.textAlign = 'center'; g.textBaseline = 'middle';
  baris.forEach((b, i) => g.fillText(b, w / 2, lh * i + lh / 2));
  const hasil = { dataUrl: c.toDataURL('image/png'), mime: 'image/png', w: w / SKALA, h: h / SKALA };
  if (siap) cache.set(kunci, hasil); // jangan simpan hasil bila font belum siap
  return hasil;
}
