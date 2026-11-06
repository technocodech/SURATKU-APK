// Pembuat kode QR sederhana (mode byte UTF-8, tingkat koreksi L/M/Q/H, versi 1-40), tanpa pustaka luar.
// Algoritma mengikuti spesifikasi ISO/IEC 18004; hasilnya diuji dengan pembaca QR.
const ECC_PER_BLOCK = {
  L: [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  M: [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  Q: [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  H: [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
};
const NUM_BLOCKS = {
  L: [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  M: [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  Q: [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  H: [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
};
const FMT = { L: 1, M: 0, Q: 3, H: 2 };

const rawModules = (v) => {
  let r = (16 * v + 128) * v + 64;
  if (v >= 2) { const n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; if (v >= 7) r -= 36; }
  return r;
};
const dataCodewords = (v, e) => Math.floor(rawModules(v) / 8) - ECC_PER_BLOCK[e][v] * NUM_BLOCKS[e][v];

// Aritmatika medan Galois GF(256) untuk Reed-Solomon.
const rsMul = (x, y) => { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z; };
const rsDivisor = (deg) => {
  const r = new Array(deg).fill(0); r[deg - 1] = 1; let root = 1;
  for (let i = 0; i < deg; i++) { for (let j = 0; j < r.length; j++) { r[j] = rsMul(r[j], root); if (j + 1 < r.length) r[j] ^= r[j + 1]; } root = rsMul(root, 0x02); }
  return r;
};
const rsRemainder = (data, div) => {
  const r = new Array(div.length).fill(0);
  for (const b of data) { const f = b ^ r.shift(); r.push(0); div.forEach((c, i) => { r[i] ^= rsMul(c, f); }); }
  return r;
};

export function buatQR(teks, ecc = 'M', minVer = 1) {
  const bytes = [...new TextEncoder().encode(String(teks))];
  let ver = Math.max(1, minVer); let used = 0;
  for (; ; ver++) {
    if (ver > 40) throw new Error('Teks terlalu panjang untuk kode QR.');
    const cap = dataCodewords(ver, ecc) * 8; used = 4 + (ver < 10 ? 8 : 16) + bytes.length * 8;
    if (used <= cap) break;
  }
  // bit data
  const bits = []; const put = (v, n) => { for (let i = n - 1; i >= 0; i--) bits.push((v >>> i) & 1); };
  put(0b0100, 4); put(bytes.length, ver < 10 ? 8 : 16); bytes.forEach((b) => put(b, 8));
  const capBits = dataCodewords(ver, ecc) * 8;
  put(0, Math.min(4, capBits - bits.length)); while (bits.length % 8) bits.push(0);
  for (let pad = 0xEC; bits.length < capBits; pad ^= 0xEC ^ 0x11) put(pad, 8);
  const data = []; for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2));
  // blok + koreksi galat
  const nb = NUM_BLOCKS[ecc][ver]; const eb = ECC_PER_BLOCK[ecc][ver]; const raw = Math.floor(rawModules(ver) / 8);
  const nShort = nb - raw % nb; const shortLen = Math.floor(raw / nb);
  const div = rsDivisor(eb); const blocks = []; let k = 0;
  for (let i = 0; i < nb; i++) {
    const d = data.slice(k, k + shortLen - eb + (i < nShort ? 0 : 1)); k += d.length;
    const e = rsRemainder(d, div); if (i < nShort) d.push(0); blocks.push(d.concat(e));
  }
  const all = [];
  for (let i = 0; i < blocks[0].length; i++) blocks.forEach((b, j) => { if (i !== shortLen - eb || j >= nShort) all.push(b[i]); });
  // matriks
  const size = ver * 4 + 17;
  const mod = Array.from({ length: size }, () => new Array(size).fill(false)); const fn = Array.from({ length: size }, () => new Array(size).fill(false));
  const setF = (x, y, d) => { mod[y][x] = d; fn[y][x] = true; };
  for (let i = 0; i < size; i++) { setF(6, i, i % 2 === 0); setF(i, 6, i % 2 === 0); }
  const finder = (cx, cy) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const d = Math.max(Math.abs(dx), Math.abs(dy)); const x = cx + dx; const y = cy + dy; if (x >= 0 && x < size && y >= 0 && y < size) setF(x, y, d !== 2 && d !== 4); } };
  finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
  const pos = (() => { if (ver === 1) return []; const n = Math.floor(ver / 7) + 2; const step = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2; const r = [6]; for (let p = size - 7; r.length < n; p -= step) r.splice(1, 0, p); return r; })();
  pos.forEach((px, i) => pos.forEach((py, j) => { if ((i === 0 && j === 0) || (i === 0 && j === pos.length - 1) || (i === pos.length - 1 && j === 0)) return; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) setF(px + dx, py + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1); }));
  const bit = (x, i) => ((x >>> i) & 1) !== 0;
  const drawFormat = (mask) => {
    const d = (FMT[ecc] << 3) | mask; let r = d; for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
    const bitsF = ((d << 10) | r) ^ 0x5412;
    for (let i = 0; i <= 5; i++) setF(8, i, bit(bitsF, i)); setF(8, 7, bit(bitsF, 6)); setF(8, 8, bit(bitsF, 7)); setF(7, 8, bit(bitsF, 8));
    for (let i = 9; i < 15; i++) setF(14 - i, 8, bit(bitsF, i));
    for (let i = 0; i < 8; i++) setF(size - 1 - i, 8, bit(bitsF, i)); for (let i = 8; i < 15; i++) setF(8, size - 15 + i, bit(bitsF, i));
    setF(8, size - 8, true);
  };
  drawFormat(0);
  if (ver >= 7) {
    let r = ver; for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1F25);
    const bitsV = (ver << 12) | r;
    for (let i = 0; i < 18; i++) { const a = size - 11 + (i % 3); const b = Math.floor(i / 3); setF(a, b, bit(bitsV, i)); setF(b, a, bit(bitsV, i)); }
  }
  // tempatkan data
  let i = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) {
      const x = right - j; const upward = ((right + 1) & 2) === 0; const y = upward ? size - 1 - vert : vert;
      if (!fn[y][x] && i < all.length * 8) { mod[y][x] = bit(all[i >>> 3], 7 - (i & 7)); i++; }
    }
  }
  const mascara = (m) => { for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { let inv; switch (m) { case 0: inv = (x + y) % 2 === 0; break; case 1: inv = y % 2 === 0; break; case 2: inv = x % 3 === 0; break; case 3: inv = (x + y) % 3 === 0; break; case 4: inv = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break; case 5: inv = (x * y) % 2 + (x * y) % 3 === 0; break; case 6: inv = ((x * y) % 2 + (x * y) % 3) % 2 === 0; break; default: inv = ((x + y) % 2 + (x * y) % 3) % 2 === 0; } if (!fn[y][x] && inv) mod[y][x] = !mod[y][x]; } };
  const penalti = () => {
    let p = 0;
    const garis = (get) => { for (let a = 0; a < size; a++) { let run = 1; for (let b = 1; b < size; b++) { if (get(a, b) === get(a, b - 1)) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1; } } };
    garis((a, b) => mod[a][b]); garis((a, b) => mod[b][a]);
    for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) { const c = mod[y][x]; if (c === mod[y][x + 1] && c === mod[y + 1][x] && c === mod[y + 1][x + 1]) p += 3; }
    const pola = [true, false, true, true, true, false, true, false, false, false, false];
    const cari = (get) => { for (let a = 0; a < size; a++) for (let b = 0; b + 11 <= size; b++) { let k1 = true; let k2 = true; for (let t = 0; t < 11; t++) { if (get(a, b + t) !== pola[t]) k1 = false; if (get(a, b + t) !== pola[10 - t]) k2 = false; } if (k1) p += 40; if (k2) p += 40; } };
    cari((a, b) => mod[a][b]); cari((a, b) => mod[b][a]);
    let gelap = 0; mod.forEach((r) => r.forEach((c) => { if (c) gelap++; }));
    p += (Math.ceil(Math.abs(gelap * 20 - size * size * 10) / (size * size)) - 1) * 10;
    return p;
  };
  let best = 0; let bestP = Infinity;
  for (let m = 0; m < 8; m++) { mascara(m); drawFormat(m); const pp = penalti(); if (pp < bestP) { bestP = pp; best = m; } mascara(m); }
  mascara(best); drawFormat(best);
  return { size, modul: mod, versi: ver };
}

// Gambar QR ke PNG (data URL) dengan zona tenang 4 modul; piksel tajam tanpa pemulusan.
export function qrKePng(teks, { ecc = 'M', skala = 8, warna = '#000000' } = {}) {
  const q = buatQR(teks, ecc); const tot = q.size + 8;
  const c = document.createElement('canvas'); c.width = c.height = tot * skala;
  const g = c.getContext('2d'); g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = warna;
  for (let y = 0; y < q.size; y++) for (let x = 0; x < q.size; x++) if (q.modul[y][x]) g.fillRect((x + 4) * skala, (y + 4) * skala, skala, skala);
  return { dataUrl: c.toDataURL('image/png'), mime: 'image/png', w: c.width, h: c.height };
}
