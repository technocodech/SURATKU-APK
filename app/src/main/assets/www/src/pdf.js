// Ekspor PDF: menggambar hasil tata letak yang sama dengan pratinjau (teks vektor, font standar Times).
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { dataUrlToBytes } from './util.js';
import { styleKey } from './fonts.js';

const hex = (c) => { const m = /^#?([0-9a-f]{6})$/i.exec(c || ''); if (!m) return null; const n = parseInt(m[1], 16); return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255); };

export async function buatPdf(layoutRes, { judul = 'Dokumen', pembuat = 'SURATKU' } = {}) {
  const { pages, paper } = layoutRes;
  const doc = await PDFDocument.create();
  doc.setTitle(judul); doc.setCreator('SURATKU'); doc.setProducer('SURATKU'); doc.setAuthor(pembuat);
  const S = StandardFonts;
  const peta = { tr: S.TimesRoman, tb: S.TimesRomanBold, ti: S.TimesRomanItalic, tbi: S.TimesRomanBoldItalic, sr: S.Helvetica, sb: S.HelveticaBold, si: S.HelveticaOblique, sbi: S.HelveticaBoldOblique, mr: S.Courier, mb: S.CourierBold, mi: S.CourierOblique, mbi: S.CourierBoldOblique };
  const F = {}; const dipakai = new Set(pages.flatMap((pg) => pg.prims.filter((p) => p.t === 'text').map((p) => styleKey(p))));
  for (const k of dipakai) F[k] = await doc.embedFont(peta[k]);
  const imgCache = new Map();
  const black = rgb(0, 0, 0);
  for (const pg of pages) {
    const page = doc.addPage([paper.w, paper.h]);
    const Y = (y) => paper.h - y;
    for (const p of pg.prims) {
      if (p.t === 'text' && p.text) {
        page.drawText(p.text, { x: p.x, y: Y(p.y), size: p.size, font: F[styleKey(p)], color: hex(p.c) || black });
      } else if (p.t === 'line') {
        page.drawLine({ start: { x: p.x1, y: Y(p.y1) }, end: { x: p.x2, y: Y(p.y2) }, thickness: p.w, color: hex(p.c) || black });
      } else if (p.t === 'rect') {
        page.drawRectangle({ x: p.x, y: Y(p.y + p.h), width: p.w, height: p.h, borderWidth: p.stroke || 0.6, borderColor: black, color: hex(p.fill) || undefined, opacity: p.fill ? 1 : 0, borderOpacity: 1 });
      } else if (p.t === 'img') {
        let im = imgCache.get(p.dataUrl);
        if (!im) { const bytes = dataUrlToBytes(p.dataUrl); im = p.mime === 'image/jpeg' ? await doc.embedJpg(bytes) : await doc.embedPng(bytes); imgCache.set(p.dataUrl, im); }
        page.drawImage(im, { x: p.x, y: Y(p.y + p.h), width: p.w, height: p.h });
      }
    }
  }
  return doc.save();
}
