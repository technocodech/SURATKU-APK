// Potong dan luruskan foto tanda tangan/stempel di dalam aplikasi. Mengembalikan {dataUrl,mime,w,h} PNG hasil potongan, atau null.
import { h } from './util.js';
import { modal, btn } from './ui.js';

const muat = (url) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Gambar tidak dapat dibaca.')); i.src = url; });

export async function bukaPotong(src) {
  const img = await muat(src.dataUrl);
  let sudut = 0; let rc = null; let rect = { x: 0, y: 0, w: 1, h: 1 }; // rect dalam pecahan (0..1) dari gambar yang sudah diputar
  const TAMPIL = 520;
  const cv = h('canvas', { class: 'potong-cv', 'aria-label': 'Area potong: seret kotak untuk memilih bagian yang dipertahankan' });
  const g = cv.getContext('2d');
  const putar = () => {
    const r = sudut * Math.PI / 180; const cos = Math.abs(Math.cos(r)); const sin = Math.abs(Math.sin(r));
    const W = Math.max(1, Math.round(img.naturalWidth * cos + img.naturalHeight * sin)); const H = Math.max(1, Math.round(img.naturalWidth * sin + img.naturalHeight * cos));
    rc = document.createElement('canvas'); rc.width = W; rc.height = H;
    const c = rc.getContext('2d'); c.translate(W / 2, H / 2); c.rotate(r); c.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    const k = Math.min(1, TAMPIL / W, 420 / H); cv.width = Math.round(W * k); cv.height = Math.round(H * k);
    rect = { x: 0, y: 0, w: 1, h: 1 }; gambar();
  };
  const gambar = () => {
    const W = cv.width; const H = cv.height;
    g.clearRect(0, 0, W, H); g.fillStyle = '#ddd'; g.fillRect(0, 0, W, H); g.drawImage(rc, 0, 0, W, H);
    const x = rect.x * W; const y = rect.y * H; const w = rect.w * W; const hh = rect.h * H;
    g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, 0, W, y); g.fillRect(0, y + hh, W, H - y - hh); g.fillRect(0, y, x, hh); g.fillRect(x + w, y, W - x - w, hh);
    g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.strokeRect(x, y, w, hh);
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1; g.beginPath();
    for (let i = 1; i < 3; i++) { g.moveTo(x + w * i / 3, y); g.lineTo(x + w * i / 3, y + hh); g.moveTo(x, y + hh * i / 3); g.lineTo(x + w, y + hh * i / 3); }
    g.stroke();
    g.fillStyle = '#fff'; g.strokeStyle = '#0b6b3a'; g.lineWidth = 2;
    for (const [px, py] of [[x, y], [x + w, y], [x, y + hh], [x + w, y + hh]]) { g.beginPath(); g.rect(px - 6, py - 6, 12, 12); g.fill(); g.stroke(); }
  };
  // Seret: sudut = ubah ukuran, dalam kotak = geser, di luar = kotak baru.
  let aksi = null;
  const titik = (e) => { const b = cv.getBoundingClientRect(); return { x: Math.min(1, Math.max(0, (e.clientX - b.left) / b.width)), y: Math.min(1, Math.max(0, (e.clientY - b.top) / b.height)), px: (e.clientX - b.left) * cv.width / b.width, py: (e.clientY - b.top) * cv.height / b.height }; };
  cv.addEventListener('pointerdown', (e) => {
    const p = titik(e); cv.setPointerCapture(e.pointerId);
    const sx = [rect.x, rect.x + rect.w]; const sy = [rect.y, rect.y + rect.h];
    const sudutDekat = [0, 1].flatMap((i) => [0, 1].map((j) => ({ i, j }))).find(({ i, j }) => Math.abs(p.px - sx[i] * cv.width) < 14 && Math.abs(p.py - sy[j] * cv.height) < 14);
    if (sudutDekat) aksi = { t: 'ukur', tetapX: sx[1 - sudutDekat.i], tetapY: sy[1 - sudutDekat.j] };
    else if (p.x >= rect.x && p.x <= rect.x + rect.w && p.y >= rect.y && p.y <= rect.y + rect.h) aksi = { t: 'geser', dx: p.x - rect.x, dy: p.y - rect.y };
    else aksi = { t: 'baru', x0: p.x, y0: p.y };
  });
  cv.addEventListener('pointermove', (e) => {
    if (!aksi) return; const p = titik(e);
    if (aksi.t === 'geser') rect = { ...rect, x: Math.min(1 - rect.w, Math.max(0, p.x - aksi.dx)), y: Math.min(1 - rect.h, Math.max(0, p.y - aksi.dy)) };
    else { const [ax, ay] = aksi.t === 'ukur' ? [aksi.tetapX, aksi.tetapY] : [aksi.x0, aksi.y0]; rect = { x: Math.min(ax, p.x), y: Math.min(ay, p.y), w: Math.max(0.03, Math.abs(p.x - ax)), h: Math.max(0.03, Math.abs(p.y - ay)) }; }
    gambar();
  });
  const lepas = () => { aksi = null; };
  cv.addEventListener('pointerup', lepas); cv.addEventListener('pointercancel', lepas);

  const slider = h('input', { type: 'range', min: -20, max: 20, step: 0.5, value: 0, 'aria-label': 'Luruskan foto (derajat)', oninput: (e) => { sudut = +e.target.value + dasar; lbl.textContent = (+e.target.value).toFixed(1) + '°'; putar(); } });
  const lbl = h('span', { class: 'small' }, '0.0°');
  let dasar = 0; // putaran kelipatan 90 derajat
  const kali90 = (d) => { dasar = (dasar + d + 360) % 360; sudut = +slider.value + dasar; putar(); };
  putar();
  return new Promise((selesai) => {
    let hasil = null;
    modal({ title: 'Potong dan luruskan foto', wide: true,
      body: h('div', { class: 'potong' },
        h('p', { class: 'hint' }, 'Seret sudut kotak untuk memotong, atau seret di dalam kotak untuk menggesernya. Garis bantu membantu meluruskan tulisan yang miring.'),
        h('div', { class: 'potong-wrap' }, cv),
        h('div', { class: 'row', style: { gap: '10px', alignItems: 'center', marginTop: '8px' } }, h('label', { class: 'small' }, 'Luruskan'), slider, lbl,
          btn('Putar 90° kiri', { kind: 'sm', onClick: () => kali90(-90) }), btn('Putar 90° kanan', { kind: 'sm', onClick: () => kali90(90) }))),
      actions: [{ label: 'Batal' }, { label: 'Terapkan', kind: 'primary', onClick: () => {
        const sx = Math.round(rect.x * rc.width); const sy = Math.round(rect.y * rc.height); const sw = Math.max(1, Math.round(rect.w * rc.width)); const sh = Math.max(1, Math.round(rect.h * rc.height));
        const c = document.createElement('canvas'); c.width = sw; c.height = sh; c.getContext('2d').drawImage(rc, sx, sy, sw, sh, 0, 0, sw, sh);
        hasil = { dataUrl: c.toDataURL('image/png'), mime: 'image/png', w: sw, h: sh };
      } }],
      onClose: () => selesai(hasil) });
  });
}
