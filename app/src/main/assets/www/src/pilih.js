// Pilihan bergambar: kartu kecil dengan ikon halaman mini + judul + penjelasan singkat.
// Dipakai agar pengaturan tata letak mudah dipahami tanpa harus menebak arti istilahnya.
import { h } from './util.js';
import { modal } from './ui.js';
import { dekorMini } from './dekor.js';

const G = '#9aa3ad'; const D = '#33404d'; const A = '#0b6b3a';
const bar = (x, y, w, hh = 2.2, c = G) => `<rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="1" fill="${c}"/>`;
const page = (isi, w = 64, hh = 46) => `<svg viewBox="0 0 ${w} ${hh}" aria-hidden="true"><rect x=".75" y=".75" width="${w - 1.5}" height="${hh - 1.5}" rx="3" fill="#fff" stroke="#c9d0d7" stroke-width="1.5"/>${isi}</svg>`;
const baris = (n, x, y0, gap, lebar, c = G) => Array.from({ length: n }, (_, i) => bar(x, y0 + i * gap, Array.isArray(lebar) ? lebar[i % lebar.length] : lebar, 2.2, c)).join('');

export const IKON = {
  kiri: page(bar(8, 8, 18, 2.2, D) + baris(3, 8, 14, 5, [30, 24, 18]) + baris(2, 8, 32, 5, 48, '#d3d8de')),
  menjorok: page(bar(8, 8, 18, 2.2, D) + baris(3, 26, 14, 5, [28, 22, 16]) + baris(2, 8, 32, 5, 48, '#d3d8de')),
  justify: page(baris(6, 8, 8, 6, 48)),
  rataKiri: page(baris(6, 8, 8, 6, [48, 40, 46, 34, 44, 28])),
  parMenjorok: page(bar(16, 9, 40) + bar(8, 15, 48) + bar(8, 21, 30) + bar(16, 29, 40) + bar(8, 35, 48)),
  parRata: page(bar(8, 9, 48) + bar(8, 15, 48) + bar(8, 21, 30) + bar(8, 29, 48) + bar(8, 35, 36)),
  tglAtas: page(bar(38, 6, 18, 2.2, A) + baris(4, 8, 14, 6, [48, 40, 44, 30]) + bar(36, 40, 20, 2.2, D)),
  tglBawah: page(baris(3, 8, 7, 6, [48, 40, 30]) + bar(34, 26, 22, 2.2, D) + bar(36, 30, 16, 5, G) + bar(34, 37, 22, 2.2, D) + bar(34, 41, 22, 2.2, A)),
  tglTtd: page(baris(4, 8, 7, 6, [48, 40, 44, 30]) + bar(36, 33, 18, 2.2, A) + bar(36, 39, 20, 2.2, D)),
  a4: `<svg viewBox="0 0 64 46" aria-hidden="true"><rect x="20" y="3" width="24" height="34" rx="2" fill="#fff" stroke="${A}" stroke-width="2"/>${bar(24, 9, 16)}${bar(24, 15, 16)}${bar(24, 21, 10)}<text x="32" y="45" font-size="7" text-anchor="middle" fill="${D}">210×297</text></svg>`,
  f4: `<svg viewBox="0 0 64 46" aria-hidden="true"><rect x="20" y="1" width="24" height="38" rx="2" fill="#fff" stroke="${A}" stroke-width="2"/>${bar(24, 7, 16)}${bar(24, 13, 16)}${bar(24, 19, 10)}<text x="32" y="45" font-size="7" text-anchor="middle" fill="${D}">210×330</text></svg>`,
  tengah: page(bar(14, 9, 36, 2.6, D) + baris(4, 8, 18, 6, [48, 40, 44, 30])),
  tengahPendek: page(bar(18, 8, 28, 2.6, D) + bar(22, 16, 20) + bar(14, 24, 36) + bar(18, 32, 28)),
  kanan: page([30, 38, 26, 34, 22].map((w, i) => bar(56 - w, 8 + i * 6, w)).join('')),
  nomorLengkap: page(`<text x="6" y="12" font-size="6.5" fill="${D}">Nomor  : 001/…</text><text x="6" y="22" font-size="6.5" fill="${D}">Lampiran: -</text><text x="6" y="32" font-size="6.5" fill="${D}">Perihal : Undangan</text>`),
  nomorSingkat: page(`<text x="6" y="12" font-size="6.5" fill="${D}">No   : 001/…</text><text x="6" y="22" font-size="6.5" fill="${D}">Lamp : -</text><text x="6" y="32" font-size="6.5" fill="${D}">Hal  : Undangan</text>`),
  ttdKiri: page(baris(3, 8, 7, 6, [48, 40, 30]) + bar(8, 28, 16, 2.2, D) + bar(8, 33, 14, 5, G) + bar(8, 41, 16, 1.6, D)),
  ttdTengah: page(baris(3, 8, 7, 6, [48, 40, 30]) + bar(24, 28, 16, 2.2, D) + bar(26, 33, 12, 5, G) + bar(24, 41, 16, 1.6, D)),
  ttdKanan: page(baris(3, 8, 7, 6, [48, 40, 30]) + bar(40, 28, 16, 2.2, D) + bar(42, 33, 12, 5, G) + bar(40, 41, 16, 1.6, D)),
  ttdAuto: page(baris(3, 8, 7, 6, [48, 40, 30]) + bar(40, 28, 16, 2.2, D) + bar(40, 41, 16, 1.6, D) + `<text x="9" y="40" font-size="8" fill="${A}">A</text>`),
  ttdHO: page(baris(2, 8, 6, 6, [44, 40]) + bar(34, 22, 22, 2.2, A) + bar(36, 27, 18, 2.2, D) + bar(34, 33, 22, 2.2, G) + bar(36, 40, 18, 1.6, D) + `<text x="32" y="20" font-size="4.2" fill="${A}">Hormat kami</text>`),
  ttdO: page(baris(2, 8, 6, 6, [44, 40]) + `<text x="26" y="24" font-size="4.2" fill="${A}">NAMA ORGANISASI</text>` + bar(34, 29, 22, 2.2, D) + bar(36, 42, 18, 1.6, D)),
  ttdH: page(baris(2, 8, 6, 6, [44, 40]) + `<text x="32" y="24" font-size="4.2" fill="${A}">Hormat kami,</text>` + bar(34, 29, 22, 2.2, D) + bar(36, 42, 18, 1.6, D)),
  ttdN: page(baris(2, 8, 6, 6, [44, 40]) + bar(34, 26, 22, 2.2, D) + bar(36, 42, 18, 1.6, D)),
  jarakRapat: page(baris(5, 8, 10, 4.2, 48)),
  jarakNormal: page(baris(5, 8, 8, 6, 48)),
  jarakLonggar: page(baris(4, 8, 7, 8.5, 48)),
  jarakLebar: page(baris(3, 8, 8, 12, 48)),
  jarakGanda: page(baris(3, 8, 7, 14, 48)),
  jarakKolomRapat: page(bar(8, 12, 20, 2.2, D) + bar(30, 12, 20, 2.2, D) + bar(8, 30, 16, 1.6, D) + bar(30, 30, 16, 1.6, D)),
  jarakKolomNormal: page(bar(6, 12, 20, 2.2, D) + bar(38, 12, 20, 2.2, D) + bar(6, 30, 16, 1.6, D) + bar(38, 30, 16, 1.6, D)),
  jarakKolomLebar: page(bar(4, 12, 20, 2.2, D) + bar(40, 12, 20, 2.2, D) + bar(4, 30, 16, 1.6, D) + bar(40, 30, 16, 1.6, D)),
};
export const tek = (...l) => `<svg viewBox="0 0 64 36" aria-hidden="true"><rect x=".75" y=".75" width="62.5" height="34.5" rx="3" fill="#fff" stroke="#c9d0d7" stroke-width="1.5"/>${l.map(([t, x, y, b]) => `<text x="${x}" y="${y}" font-size="8" font-family="Times New Roman, serif" font-weight="${b ? 700 : 400}" fill="${D}">${t}</text>`).join('')}</svg>`;
export const IKON_TEMPAT = {
  di: tek(['di Tempat', 8, 21]), Di: tek(['Di Tempat', 8, 21]), DI: tek(['DI TEMPAT', 8, 21]), strip: tek(['- Ditempat', 8, 21]),
  vertikal: tek(['Di', 8, 14], ['TEMPAT', 18, 26, true]), vertikal2: tek(['Di', 8, 14], ['Tempat', 18, 26]), vertikal3: tek(['Di', 8, 14, true], ['Tempat', 18, 26, true]), asli: tek(['Sesuai isian', 8, 21]),
};
const ikonRata = { left: 'rataKiri', justify: 'justify', center: 'tengah', right: 'kanan', kiri: 'rataKiri', tengah: 'tengah', kanan: 'kanan' };
export const ikonRataTeks = (v) => IKON[ikonRata[v]] || IKON.rataKiri;

const svgNode = (s) => { const d = document.createElement('div'); d.className = 'pil-i'; d.innerHTML = s; return d; }; // string statis buatan aplikasi

let np = 0;
// opsi: [nilai, judul, penjelasan, ikonSvg]. onInput(nilai). Mengembalikan {el}.
export function pilih({ label, value, options, onInput, hint, cols }) {
  const nama = 'pil' + (++np);
  const grup = h('div', { class: 'pilih', role: 'radiogroup', 'aria-label': label, style: cols ? { '--pc': cols } : null },
    options.map(([v, t, ket, ikon]) => h('label', { class: 'pil', title: ket || t },
      h('input', { type: 'radio', name: nama, value: String(v), checked: String(v) === String(value), onchange: () => onInput && onInput(v) }),
      ikon ? svgNode(ikon) : null, h('b', null, t), ket ? h('span', null, ket) : null)));
  return { el: h('div', { class: 'fld pilih-wrap' }, h('div', { class: 'pilih-l' }, label), grup, hint ? h('div', { class: 'hint' }, hint) : null) };
}
// Kotak penjelasan singkat "Apa ini?" di awal bagian pengaturan.
export function petunjuk(teks, judul = 'Petunjuk') {
  return h('div', { class: 'petunjuk', role: 'note' }, h('span', { class: 'pet-i', 'aria-hidden': 'true' }, 'i'), h('div', null, h('b', null, judul + ': '), teks));
}

// ---------- Miniatur halaman untuk contoh format/model surat ----------
// Digambar dari pengaturan format itu sendiri, sehingga miniatur selalu sesuai dengan hasil yang akan diterapkan.
export function miniFormat(m = {}) {
  const f = m.format || {}; const B = f.bagian || {}; const T = m.ttd || {};
  const S = 70 / 210; // mm -> satuan gambar
  const ml = (f.margin && f.margin.kiri != null ? f.margin.kiri : 25) * S; const mr = (f.margin && f.margin.kanan != null ? f.margin.kanan : 20) * S;
  const kanan = 70 - mr; const badan = ((B.badan && B.badan.kiri) || 0) * S;
  const gap = 2.6 + (((f.spasi || 1.15) - 1) * 4);
  const tata = (B.penerima && B.penerima.tata) || 'kiri'; const geserP = tata === 'menjorok' ? Math.min(((B.penerima && B.penerima.indent) || 12) * S, 40) : 0;
  const tempat = (B.penerima && B.penerima.tempat) || 'di';
  let o = f.dekor && f.dekor.model && f.dekor.model !== 'none' ? dekorMini(f.dekor.model, f.dekor.warna1, f.dekor.warna2) : ''; let y = 7;
  const kopC = (f.kop && f.kop.rata) === 'kiri' ? 'kiri' : 'tengah';
  o += `<circle cx="${ml + 3}" cy="${y + 3.5}" r="3" fill="#c9d0d7"/><circle cx="${kanan - 3}" cy="${y + 3.5}" r="3" fill="#c9d0d7"/>` + bar(ml + 10, y, 70 - 2 * ml - 20, 2, D) + bar(ml + 6, y + 3.6, 70 - 2 * ml - 12, 1.4) + bar(ml + 6, y + 6, 70 - 2 * ml - 12, 1.4);
  y += 11; o += `<rect x="${ml}" y="${y}" width="${kanan - ml}" height="1.2" fill="${D}"/>`; y += 4;
  if (B.judul && B.judul.tampil) { o += bar(ml + 14, y, 70 - 2 * ml - 28, 2.4, D); y += 5; }
  o += bar(ml, y, 20, 1.6) + bar(ml, y + 2.8, 14, 1.6) + bar(ml, y + 5.6, 24, 1.6, D) + bar(kanan - 18, y, 18, 1.6, A); y += 11;
  const px = ml + badan + geserP;
  o += bar(px, y, 14, 1.6, D) + bar(px, y + 2.8, 24, 1.6); y += 5.6;
  if (tempat === 'vertikal' || tempat === 'vertikal2' || tempat === 'vertikal3') { o += bar(px, y, 4, 1.6) + bar(px + 8, y + 2.8, 12, 1.6, tempat === 'vertikal' ? D : G); y += 5.6; }
  else { o += bar(px, y, tempat === 'strip' ? 14 : 12, 1.6); y += 3; }
  y += gap * 0.8;
  const bx = ml + badan;
  o += bar(bx, y, 20, 1.8, A); y += gap + 1;
  const ind = f.indentParagraf === false ? 0 : 5;
  for (let p = 0; p < 2; p++) {
    for (let l = 0; l < 3; l++) { const x0 = bx + (l === 0 ? ind : 0); o += bar(x0, y, (l === 2 ? (kanan - bx) * 0.55 : kanan - x0), 1.5); y += gap; }
    y += 1;
  }
  y = Math.min(y + 1, 78);
  const rata = T.rata === 'left'; const tx = kanan - 22;
  o += bar(tx, y, 18, 1.5, A); o += rata ? bar(tx, y + 3, 20, 1.5) + bar(tx, y + 14, 18, 1.8, D) : bar(tx + 2, y + 3, 16, 1.5) + bar(tx + 1, y + 14, 18, 1.8, D);
  if (T.instansi) o += bar(tx, y + 5.5, 16, 1.5, A);
  return `<svg viewBox="0 0 70 99" aria-hidden="true"><rect x=".6" y=".6" width="68.8" height="97.8" rx="2" fill="#fff" stroke="#c9d0d7" stroke-width="1.2"/>${o}</svg>`;
}
const svgBesar = (s) => { const d = document.createElement('div'); d.className = 'pil-i pil-i-besar'; d.innerHTML = s; return d; };
// Galeri contoh: tiap kartu = miniatur halaman + nama + keterangan. items: [[kunci, objekFormat]]. aktif: kunci terpilih (opsional).
// Tombol "Lihat" membuka pratinjau besar dengan ringkasan pengaturan, lalu "Pakai format ini".
export function ringkasFormat(m = {}) {
  const f = m.format || {}; const B = f.bagian || {}; const T = m.ttd || {}; const r = [];
  if (f.font) r.push(['Huruf', { t: 'Times New Roman', s: 'Arial', m: 'Courier New' }[f.font] || f.font]);
  if (f.ukuranFont) r.push(['Ukuran huruf', f.ukuranFont + ' pt']);
  if (f.spasi) r.push(['Jarak antarbaris', String(f.spasi).replace('.', ',')]);
  if (f.margin) r.push(['Margin kiri/kanan', `${f.margin.kiri ?? 25} / ${f.margin.kanan ?? 20} mm`]);
  if (B.judul && B.judul.tampil) r.push(['Judul', 'Otomatis (SURAT …)']);
  if (B.badan && B.badan.kiri) r.push(['Isi digeser ke kanan', B.badan.kiri + ' mm']);
  if (B.penerima) { r.push(['Penerima', B.penerima.tata === 'menjorok' ? 'Menjorok ke kanan' : 'Rata kiri']); if (B.penerima.tempat && B.penerima.tempat !== 'di') r.push(['Penulisan "di Tempat"', ({ Di: 'Di Tempat', DI: 'DI TEMPAT', strip: '- Ditempat', vertikal: 'Di / TEMPAT', vertikal2: 'Di / Tempat', vertikal3: 'Di / Tempat (tebal)' })[B.penerima.tempat] || B.penerima.tempat]); }
  if (f.tanggalPosisi) r.push(['Tanggal', f.tanggalPosisi === 'ttd' ? 'Di atas tanda tangan' : 'Kanan atas']);
  if (T.rata === 'left') r.push(['Tanda tangan', 'Rata kiri']);
  if (T.instansi) r.push(['Organisasi', 'Tampil di atas jabatan']);
  return r;
}
export function galeri({ items, aktif = null, onPilih, label = 'Contoh format surat', tetap = true, gambar = miniFormat, ringkas = ringkasFormat, tombol = 'Pakai format ini', pratinjau = null }) {
  const kartu = new Map();
  const tanda = (k) => kartu.forEach((el, kk) => { el.setAttribute('aria-pressed', String(kk === k)); el.classList.toggle('on', kk === k); });
  const lihat = (k, m) => {
    const rincian = ringkas(m);
    modal({ title: m.nama, wide: true, body: h('div', { class: 'lihat-fmt' }, (pratinjau && pratinjau(k, m)) || svgBesarX(gambar(m)), h('div', null, m.ket ? h('p', null, m.ket) : null, rincian.length ? h('dl', { class: 'rincian' }, rincian.flatMap(([a, b]) => [h('dt', null, a), h('dd', null, b)])) : h('p', { class: 'hint' }, 'Memakai tata letak asli dari template yang dipilih.'))),
      actions: [{ label: 'Tutup' }, { label: tombol, kind: 'primary', onClick: () => { if (tetap) tanda(k); onPilih(k, m); } }] });
  };
  const el = h('div', { class: 'galeri', role: 'group', 'aria-label': label }, items.map(([k, m]) => {
    const b = h('button', { type: 'button', class: 'pil pil-besar' + (k === aktif ? ' on' : ''), 'aria-pressed': String(k === aktif), title: m.ket || m.nama, onclick: () => { if (tetap) tanda(k); onPilih(k, m); } }, svgBesar(gambar(m)), h('b', null, m.nama), m.ket ? h('span', null, m.ket) : null);
    const l = h('button', { type: 'button', class: 'btn sm pil-lihat', 'aria-label': 'Lihat besar: ' + m.nama, title: 'Lihat pratinjau besar', onclick: (e) => { e.stopPropagation(); lihat(k, m); } }, 'Lihat');
    kartu.set(k, b); return h('div', { class: 'pil-wrap' }, b, l);
  }));
  return { el, tanda };
}
const svgBesarX = (s) => { const d = document.createElement('div'); d.className = 'lihat-svg'; d.innerHTML = s; return d; };
