// Pengolahan gambar tanda tangan/stempel: hapus latar putih/abu, transparansi, putar. Hasil dibakar ke PNG
// sehingga pratinjau, PDF, dan Word memakai gambar yang sama persis.
export const OPSI_AWAL = { hapusLatar: false, ambang: 40, opasitas: 100, rotasi: 0 };

const muat = (url) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Gambar tidak dapat dibaca.')); i.src = url; });

export async function olahGambar(asli, opsi = {}) {
  const o = { ...OPSI_AWAL, ...opsi };
  const img = await muat(asli.dataUrl);
  const rad = ((+o.rotasi || 0) % 360) * Math.PI / 180;
  const w0 = img.naturalWidth; const h0 = img.naturalHeight;
  const c0 = document.createElement('canvas'); c0.width = w0; c0.height = h0;
  const g0 = c0.getContext('2d', { willReadFrequently: true }); g0.drawImage(img, 0, 0);
  if (o.hapusLatar) {
    const d = g0.getImageData(0, 0, w0, h0); const px = d.data;
    const hi = 255 - Math.min(100, Math.max(0, +o.ambang)) * 0.5; const lo = hi - 45;
    for (let i = 0; i < px.length; i += 4) {
      const lum = (px[i] + px[i + 1] + px[i + 2]) / 3; if (px[i + 3] === 0) continue;
      const a = lum >= hi ? 0 : lum <= lo ? 1 : (hi - lum) / (hi - lo);
      px[i + 3] = Math.round(px[i + 3] * a);
    }
    g0.putImageData(d, 0, 0);
  }
  const cos = Math.abs(Math.cos(rad)); const sin = Math.abs(Math.sin(rad));
  const W = Math.max(1, Math.round(w0 * cos + h0 * sin)); const H = Math.max(1, Math.round(w0 * sin + h0 * cos));
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'); g.globalAlpha = Math.min(1, Math.max(0.1, (+o.opasitas || 100) / 100));
  g.translate(W / 2, H / 2); g.rotate(rad); g.drawImage(c0, -w0 / 2, -h0 / 2);
  return { dataUrl: c.toDataURL('image/png'), mime: 'image/png', w: W, h: H };
}

// Objek gambar tersimpan: hasil olahan di bagian atas, sumber asli + opsi disimpan agar bisa diolah ulang.
export async function bungkusGambar(g, { jpg = false, kunci = 'gambar' } = {}) {
  const asli = { dataUrl: g.dataUrl, mime: g.mime, w: g.w, h: g.h };
  const opsi = { ...OPSI_AWAL, hapusLatar: jpg && kunci === 'gambar' };
  const hasil = opsi.hapusLatar ? await olahGambar(asli, opsi) : g;
  return { ...hasil, asli, opsi };
}
export async function olahUlang(g, opsiBaru) {
  const asli = g.asli || { dataUrl: g.dataUrl, mime: g.mime, w: g.w, h: g.h };
  const opsi = { ...OPSI_AWAL, ...(g.opsi || {}), ...opsiBaru };
  const hasil = await olahGambar(asli, opsi);
  return { ...hasil, asli, opsi };
}

// Dialog coret tanda tangan langsung (mouse, jari, atau pena). Mengembalikan {dataUrl,mime,w,h} PNG transparan atau null.
export function bukaCoret({ h, modal, toast }) {
  return new Promise((selesai) => {
    const W = 640; const H = 280; const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cv = h('canvas', { width: W * dpr, height: H * dpr, class: 'coret-cv', 'aria-label': 'Area coret tanda tangan', style: { touchAction: 'none' } });
    const g = cv.getContext('2d'); g.scale(dpr, dpr); g.lineCap = 'round'; g.lineJoin = 'round';
    let warna = '#0b2a6b'; let tebal = 2.6; let ada = false; let gambar = false; let last = null; let kotak = { x0: W, y0: H, x1: 0, y1: 0 };
    const titik = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height, p: e.pressure && e.pressure > 0 ? e.pressure : 0.5 }; };
    const tandai = (p) => { kotak = { x0: Math.min(kotak.x0, p.x), y0: Math.min(kotak.y0, p.y), x1: Math.max(kotak.x1, p.x), y1: Math.max(kotak.y1, p.y) }; };
    cv.addEventListener('pointerdown', (e) => { e.preventDefault(); cv.setPointerCapture(e.pointerId); gambar = true; ada = true; last = titik(e); tandai(last); g.fillStyle = warna; g.beginPath(); g.arc(last.x, last.y, tebal / 2, 0, 7); g.fill(); });
    cv.addEventListener('pointermove', (e) => { if (!gambar) return; const p = titik(e); g.strokeStyle = warna; g.lineWidth = tebal * (0.6 + p.p * 0.8); g.beginPath(); g.moveTo(last.x, last.y); g.lineTo(p.x, p.y); g.stroke(); last = p; tandai(p); });
    const lepas = () => { gambar = false; };
    cv.addEventListener('pointerup', lepas); cv.addEventListener('pointercancel', lepas);
    const bersih = () => { g.clearRect(0, 0, W, H); ada = false; kotak = { x0: W, y0: H, x1: 0, y1: 0 }; };
    const warnaBtn = [['#0b2a6b', 'Biru tua'], ['#000000', 'Hitam'], ['#1f4e9e', 'Biru']].map(([v, t]) => h('button', { type: 'button', class: 'btn sm', title: t, 'aria-label': 'Warna ' + t, style: { background: v, minWidth: '34px', minHeight: '34px' }, onclick: () => { warna = v; } }, ''));
    const body = h('div', null,
      h('p', { class: 'hint' }, 'Coret tanda tangan di kotak di bawah dengan jari, pena, atau mouse. Hasilnya berlatar transparan dan dipotong otomatis.'),
      h('div', { class: 'coret-wrap' }, cv),
      h('div', { class: 'row', style: { gap: '8px', marginTop: '8px', alignItems: 'center' } }, h('span', { class: 'small' }, 'Warna:'), ...warnaBtn,
        h('label', { class: 'mini row', style: { gap: '6px' } }, h('span', null, 'Tebal'), h('select', { 'aria-label': 'Ketebalan coretan', onchange: (e) => { tebal = +e.target.value; } }, [[1.8, 'Tipis'], [2.6, 'Sedang'], [4, 'Tebal']].map(([v, t]) => h('option', { value: v, selected: v === 2.6 }, t))),
        h('button', { type: 'button', class: 'btn sm', onclick: bersih }, 'Hapus coretan'))));
    modal({ title: 'Coret tanda tangan', body, wide: true, onClose: () => selesai(null), actions: [
      { label: 'Batal', onClick: () => { selesai(null); } },
      { label: 'Pakai coretan ini', kind: 'primary', onClick: () => {
        if (!ada) { toast('Belum ada coretan.', 'err'); return false; }
        const pad = 6; const x0 = Math.max(0, kotak.x0 - pad); const y0 = Math.max(0, kotak.y0 - pad); const x1 = Math.min(W, kotak.x1 + pad); const y1 = Math.min(H, kotak.y1 + pad);
        const w = Math.max(8, Math.round((x1 - x0) * dpr)); const hh = Math.max(8, Math.round((y1 - y0) * dpr));
        const out = document.createElement('canvas'); out.width = w; out.height = hh; out.getContext('2d').drawImage(cv, Math.round(x0 * dpr), Math.round(y0 * dpr), w, hh, 0, 0, w, hh);
        selesai({ dataUrl: out.toDataURL('image/png'), mime: 'image/png', w, h: hh });
      } }] });
  });
}
