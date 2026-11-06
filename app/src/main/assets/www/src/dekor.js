// Dekorasi halaman untuk model surat "Company": bentuk datar (poligon) pada kertas 210 x 297 mm,
// digambar ke PNG latar yang sama untuk pratinjau, PDF, dan Word. warna c1 = utama, c2 = aksen.
const tri = (...p) => p;
const gel = (y0, amp, per, fase, c, tinggi = 297) => { // gelombang di bawah halaman
  const p = []; for (let x = 0; x <= 210; x += 5) p.push([x, y0 + amp * Math.sin((x / per) * Math.PI * 2 + fase)]);
  p.push([210, tinggi], [0, tinggi]); return { p, f: c };
};
const mangkuk = (a, b, c1, c2) => { // pita melengkung (cekung ke atas) di bawah halaman
  const xs = []; for (let x = 0; x <= 210; x += 5) xs.push(x);
  const f = (x, t, d) => t + d * (1 - ((x - 105) / 105) ** 2);
  const atas = xs.map((x) => [x, f(x, 267, 15)]); const bwh = xs.map((x) => [x, f(x, 277, 7)]);
  return [{ p: [...atas, ...bwh.slice().reverse()], f: c2 }, { p: [...bwh, [210, 297], [0, 297]], f: c1 }];
};
const bulat = (cx, cy, r, f, o = 1) => { const p = []; for (let i = 0; i < 48; i++) { const t = (i / 48) * Math.PI * 2; p.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); } return { p, f, o }; };
const kotak = (x0, y0, x1, y1, f, o = 1) => ({ p: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], f, o });
const pita = (pts, f, o = 1) => ({ p: pts, f, o });
export const DEKOR = {
  none: { nama: 'Tanpa dekorasi', ket: 'Halaman polos.', w: ['#000000', '#000000'], bentuk: () => [] },
  sudut: {
    nama: 'Sudut miring', ket: 'Pita miring di pojok kiri atas dan pita tebal di bawah.', w: ['#1b1b1b', '#e0b422'],
    bentuk: (a, b) => [{ p: tri([0, 0], [125, 0], [0, 26]), f: a }, { p: tri([125, 0], [175, 0], [0, 36], [0, 26]), f: b }, { p: [[0, 289], [210, 289], [210, 297], [0, 297]], f: a }, { p: [[150, 289], [185, 289], [178, 297], [143, 297]], f: b }],
  },
  editorial: {
    nama: 'Segitiga editorial', ket: 'Segitiga di pojok kiri atas dan kanan bawah.', w: ['#e8761c', '#f4a64a'],
    bentuk: (a, b) => [{ p: tri([0, 0], [62, 0], [0, 46]), f: a }, { p: tri([0, 0], [38, 0], [0, 28]), f: b }, { p: tri([210, 297], [148, 297], [210, 251]), f: a }, { p: tri([210, 297], [172, 297], [210, 269]), f: b }],
  },
  diagonal: {
    nama: 'Pita diagonal merah', ket: 'Pita gelap miring di atas dengan segitiga merah di kiri, dan sudut kecil di kanan bawah.', w: ['#2a303b', '#e0302a'],
    bentuk: (a, b) => [{ p: [[0, 0], [210, 0], [210, 7], [0, 24]], f: a }, { p: [[0, 0], [30, 19], [0, 50]], f: b }, { p: [[0, 50], [30, 19], [48, 15], [10, 38]], f: b, o: 0.65 },
      { p: [[210, 297], [80, 297], [210, 285]], f: a }, { p: [[210, 297], [194, 297], [210, 276]], f: b }],
  },
  kipas: {
    nama: 'Kipas oranye', ket: 'Bentuk kipas berlapis di pojok kanan atas dan kiri bawah.', w: ['#d9621a', '#f0a923'],
    bentuk: (a, b) => [{ p: [[70, 0], [210, 0], [210, 40]], f: a }, { p: [[110, 0], [210, 0], [210, 24]], f: b, o: 0.9 }, { p: [[150, 0], [210, 0], [210, 10]], f: a, o: 0.8 },
      { p: [[0, 297], [0, 257], [140, 297]], f: a }, { p: [[0, 297], [0, 273], [100, 297]], f: b, o: 0.9 }, { p: [[0, 297], [0, 287], [60, 297]], f: a, o: 0.8 }],
  },
  lengkung: {
    nama: 'Lengkung bawah', ket: 'Pita lengkung hijau limau dan biru tua di dasar halaman.', w: ['#1f3a4d', '#a9c820'],
    bentuk: (a, b) => mangkuk(0, 0, a, b),
  },
  blok: {
    nama: 'Blok bertingkat', ket: 'Kotak bertingkat di pojok kanan atas dan kotak di kiri bawah.', w: ['#1d3557', '#e63946'],
    bentuk: (a, b) => [kotak(180, 0, 210, 30, a), kotak(160, 0, 180, 15, b), kotak(195, 30, 210, 45, b, 0.6), kotak(0, 277, 40, 297, a), kotak(40, 287, 60, 297, b)],
  },
  lingkaran: {
    nama: 'Lingkaran sudut', ket: 'Lingkaran berlapis di pojok kiri atas dan kanan bawah.', w: ['#2b6cb0', '#f6ad55'],
    bentuk: (a, b) => [bulat(0, 0, 42, a, 0.92), bulat(0, 0, 26, b, 0.95), bulat(210, 297, 40, a, 0.88), bulat(210, 297, 24, b, 0.95)],
  },
  bingkai: {
    nama: 'Bingkai ganda', ket: 'Bingkai tipis ganda di tepi halaman dengan aksen sudut.', w: ['#7a5c12', '#c99a14'],
    bentuk: (a, b) => [kotak(6, 6, 204, 6.9, a), kotak(6, 290.1, 204, 291, a), kotak(6, 6, 6.9, 291, a), kotak(203.1, 6, 204, 291, a),
      kotak(8.2, 8.2, 201.8, 8.55, b), kotak(8.2, 288.45, 201.8, 288.8, b), kotak(8.2, 8.2, 8.55, 288.8, b), kotak(201.45, 8.2, 201.8, 288.8, b),
      kotak(4, 4, 9, 9, b), kotak(201, 4, 206, 9, b), kotak(4, 288, 9, 293, b), kotak(201, 288, 206, 293, b)],
  },
  gunung: {
    nama: 'Siluet pegunungan', ket: 'Siluet pegunungan dua lapis di dasar halaman dengan garis tipis di atas.', w: ['#1f5f4a', '#8fbf9f'],
    bentuk: (a, b) => [kotak(0, 0, 210, 4, a), { p: [[0, 297], [0, 282], [35, 266], [70, 284], [112, 263], [160, 285], [210, 270], [210, 297]], f: b, o: 0.9 }, { p: [[0, 297], [0, 291], [50, 279], [100, 292], [150, 281], [210, 293], [210, 297]], f: a }],
  },
  chevron: {
    nama: 'Chevron atas', ket: 'Deretan panah (chevron) di bagian atas dan pita di dasar halaman.', w: ['#7b2cbf', '#ff9e00'],
    bentuk: (a, b) => [{ p: [[0, 0], [70, 0], [85, 14], [70, 28], [0, 28]], f: a }, { p: [[74, 0], [90, 0], [105, 14], [90, 28], [74, 28]], f: b, o: 0.95 }, { p: [[94, 0], [102, 0], [117, 14], [102, 28], [94, 28]], f: a, o: 0.45 },
      kotak(0, 291, 210, 297, a), { p: [[0, 289], [60, 289], [56, 291], [0, 291]], f: b }],
  },
  tangga: {
    nama: 'Tangga bertingkat', ket: 'Bidang bertingkat seperti tangga di pojok kiri atas dan kanan bawah.', w: ['#0f4c5c', '#e36414'],
    bentuk: (a, b) => [pita([[0, 0], [70, 0], [70, 8], [50, 8], [50, 16], [30, 16], [30, 24], [0, 24]], a), pita([[0, 24], [30, 24], [30, 32], [0, 32]], b),
      pita([[210, 297], [140, 297], [140, 289], [160, 289], [160, 281], [180, 281], [180, 273], [210, 273]], a), pita([[210, 273], [180, 273], [180, 265], [210, 265]], b)],
  },
  berlian: {
    nama: 'Belah ketupat', ket: 'Deretan belah ketupat kecil di atas dan satu bidang besar di dasar halaman.', w: ['#4a1d6b', '#d4a017'],
    bentuk: (a, b) => { const r = []; for (let i = 0; i < 7; i++) r.push(pita([[12 + i * 26, 8], [22 + i * 26, 3], [32 + i * 26, 8], [22 + i * 26, 13]], i % 2 ? b : a)); r.push(pita([[0, 292], [210, 292], [210, 297], [0, 297]], a), pita([[90, 292], [105, 285], [120, 292]], b)); return r; },
  },
  ombak: {
    nama: 'Ombak atas dan bawah', ket: 'Gelombang tipis di atas dan di bawah halaman.', w: ['#0077b6', '#90e0ef'],
    bentuk: (a, b) => { const mk = (y0, amp, per, fase, yb, f, o) => { const p = []; for (let x = 0; x <= 210; x += 5) p.push([x, y0 + amp * Math.sin((x / per) * Math.PI * 2 + fase)]); p.push([210, yb], [0, yb]); return { p, f, o }; };
      return [mk(10, 3, 120, 0.4, 0, b, 0.9), mk(6, 2.5, 100, 2, 0, a, 1), mk(287, 3, 120, 1.2, 297, b, 0.9), mk(291, 2.5, 100, 3, 297, a, 1)]; },
  },
  sayap: {
    nama: 'Sayap miring', ket: 'Dua bidang miring panjang dari kiri bawah ke kanan atas, memberi kesan bergerak.', w: ['#264653', '#e9c46a'],
    bentuk: (a, b) => [pita([[0, 0], [60, 0], [0, 30]], a), pita([[0, 0], [30, 0], [0, 14]], b), pita([[210, 297], [150, 297], [210, 267]], a), pita([[210, 297], [180, 297], [210, 283]], b), pita([[0, 297], [0, 292], [210, 292], [210, 297]], a, 0.15)],
  },
  titik: {
    nama: 'Matriks titik', ket: 'Kumpulan titik membentuk pola di pojok kanan atas dan garis tebal di dasar.', w: ['#c1121f', '#003049'],
    bentuk: (a, b) => { const r = []; for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { if (j > i) continue; const cx = 204 - j * 7, cy = 6 + i * 7; r.push(bulat(cx, cy, 1.8, (i + j) % 2 ? a : b, 1)); } r.push(kotak(0, 290, 210, 297, b), kotak(0, 288, 70, 290, a)); return r; },
  },
  faset: {
    nama: 'Faset sudut bawah', ket: 'Bidang bersudut di pojok kanan bawah, seperti kop badan pemerintah.', w: ['#2aa387', '#6a5c9e'],
    bentuk: (a, b) => [{ p: tri([210, 297], [210, 205], [165, 297]), f: a, o: 0.85 }, { p: tri([210, 297], [135, 297], [210, 236]), f: b, o: 0.55 }, { p: tri([210, 297], [188, 297], [210, 270]), f: a, o: 1 }],
  },
  gelombang: {
    nama: 'Gelombang bawah', ket: 'Dua gelombang berwarna di bagian bawah halaman.', w: ['#2d8c6e', '#e0b422'],
    bentuk: (a, b) => [{ ...gel(283, 3, 130, 0.6, b), o: 0.9 }, { ...gel(288, 2.4, 110, 2.1, a) }],
  },
  bilah: {
    nama: 'Bilah samping', ket: 'Bilah tegak di sisi kiri dengan garis aksen dan garis miring di pojok kanan atas.', w: ['#14264a', '#e0b422'],
    bentuk: (a, b) => [{ p: [[0, 0], [7, 0], [7, 297], [0, 297]], f: a }, { p: [[8.6, 0], [10, 0], [10, 297], [8.6, 297]], f: b },
      { p: [[178, 0], [182, 0], [210, 28], [210, 32]], f: b, o: 0.7 }, { p: [[188, 0], [192, 0], [210, 18], [210, 22]], f: b, o: 0.5 }, { p: [[198, 0], [202, 0], [210, 8], [210, 12]], f: b, o: 0.35 }],
  },
  pita: {
    nama: 'Pita atas', ket: 'Pita warna selebar halaman di atas dan garis tipis di bawah.', w: ['#0b4f7a', '#e0b422'],
    bentuk: (a, b) => [{ p: [[0, 0], [210, 0], [210, 11], [0, 11]], f: a }, { p: [[0, 11], [210, 11], [210, 13], [0, 13]], f: b }, { p: [[12, 288], [198, 288], [198, 288.8], [12, 288.8]], f: a }],
  },
};

const cache = new Map();
// PNG latar (data URL) untuk model dan warna tertentu; null bila tanpa dekorasi.
export function dekorPng(model, c1, c2, { kertasH = 297 } = {}) {
  const D = DEKOR[model]; if (!D || model === 'none' || typeof document === 'undefined') return null;
  const a = /^#[0-9a-f]{6}$/i.test(c1 || '') ? c1 : D.w[0]; const b = /^#[0-9a-f]{6}$/i.test(c2 || '') ? c2 : D.w[1];
  const key = [model, a, b, kertasH].join('|'); if (cache.has(key)) return cache.get(key);
  const S = 6; // piksel per mm (~150 dpi)
  const cv = document.createElement('canvas'); cv.width = Math.round(210 * S); cv.height = Math.round(kertasH * S);
  const g = cv.getContext('2d'); const dy = kertasH - 297; // bentuk dasar dihitung untuk A4; dasar halaman ikut tinggi kertas
  for (const sh of D.bentuk(a, b)) {
    g.globalAlpha = sh.o ?? 1; g.fillStyle = sh.f; g.beginPath();
    sh.p.forEach(([x, y], i) => { const yy = (y > 200 ? y + dy : y) * S; if (i) g.lineTo(x * S, yy); else g.moveTo(x * S, yy); });
    g.closePath(); g.fill();
  }
  const url = cv.toDataURL('image/png'); cache.set(key, url); return url;
}
// Miniatur SVG untuk galeri (halaman 70 x 99).
export function dekorMini(model, c1, c2) {
  const D = DEKOR[model]; if (!D) return '';
  const a = c1 || D.w[0]; const b = c2 || D.w[1]; const k = 70 / 210;
  return D.bentuk(a, b).map((sh) => `<polygon points="${sh.p.map(([x, y]) => `${(x * k).toFixed(1)},${(y * k * 99 / (297 * k)).toFixed(1)}`).join(' ')}" fill="${sh.f}" opacity="${sh.o ?? 1}"/>`).join('');
}
