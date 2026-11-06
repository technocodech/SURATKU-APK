// Menggambar halaman hasil tata letak menjadi SVG (pratinjau & cetak).
const NS = 'http://www.w3.org/2000/svg';
const el = (n, a = {}) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
import { KELUARGA, fam, width as lebarTeks } from './fonts.js';
// Jika font web (Liberation) belum/tidak termuat, browser memakai font cadangan yang lebih lebar sehingga kata saling menumpuk.
// Pada kondisi itu lebar teks dipaksa sama dengan hasil tata letak (sama dengan PDF) agar pratinjau tetap rapi.
const NAMA_WEB = { t: 'SuratSerif', s: 'SuratSans', m: 'SuratMono' };
function fontWebSiap(f, b, i) {
  try {
    const fk = NAMA_WEB[f]; if (!fk || !document.fonts) return true;
    let ada = false;
    for (const ff of document.fonts) {
      if (ff.family.replace(/["']/g, '') !== fk) continue;
      const tebal = parseInt(ff.weight, 10) >= 600; const miring = ff.style === 'italic';
      if (tebal !== !!b || miring !== !!i) continue;
      ada = true;
      if (ff.status === 'loaded') return true;
      if (ff.status === 'unloaded') ff.load().catch(() => {});
    }
    return !ada; // tidak ada deklarasi: biarkan apa adanya
  } catch (e) { return true; }
}
export const FONT_STACK = KELUARGA.t.css;

export function pageSvg(page, paper, { print = false } = {}) {
  const svg = el('svg', { viewBox: `0 0 ${paper.w} ${paper.h}`, width: `${paper.wmm}mm`, height: `${paper.hmm}mm`, class: 'pg-svg', role: 'img' });
  svg.append(el('rect', { x: 0, y: 0, width: paper.w, height: paper.h, fill: '#fff' }));
  for (const p of page.prims) {
    switch (p.t) {
      case 'text': {
        if (!p.text) break;
        const t = el('text', { x: p.x, y: p.y, 'font-size': p.size, 'font-family': KELUARGA[fam(p.f)].css, fill: p.c || '#000', 'xml:space': 'preserve' });
        if (p.b) t.setAttribute('font-weight', '700');
        if (p.i) t.setAttribute('font-style', 'italic');
        if (!fontWebSiap(fam(p.f), p.b, p.i)) {
          try { const w = lebarTeks(p.text, { f: p.f, b: p.b, i: p.i }, p.size); if (w > 0) { t.setAttribute('textLength', String(w)); t.setAttribute('lengthAdjust', 'spacingAndGlyphs'); } } catch (e) { /* abaikan */ }
        }
        t.textContent = p.text; svg.append(t); break;
      }
      case 'hl': if (!print) svg.append(el('rect', { x: p.x, y: p.y, width: p.w, height: p.h, fill: '#fff2a8', rx: 2, class: 'no-print' })); break;
      case 'line': svg.append(el('line', { x1: p.x1, y1: p.y1, x2: p.x2, y2: p.y2, stroke: p.c || '#000', 'stroke-width': p.w })); break;
      case 'rect': svg.append(el('rect', { x: p.x, y: p.y, width: p.w, height: p.h, fill: p.fill || 'none', stroke: '#000', 'stroke-width': p.stroke || 0.6 })); break;
      case 'img': svg.append(el('image', { x: p.x, y: p.y, width: p.w, height: p.h, href: p.dataUrl, preserveAspectRatio: 'xMidYMid meet' })); break;
      case 'ph':
        if (!print) {
          svg.append(el('rect', { x: p.x, y: p.y, width: p.w, height: p.h, fill: 'none', stroke: '#b9a34a', 'stroke-dasharray': '4 3', 'stroke-width': 1 }));
          const t = el('text', { x: p.x + p.w / 2, y: p.y + p.h / 2 + 3, 'text-anchor': 'middle', 'font-size': 8, fill: '#9a8530', 'font-family': 'Poppins, sans-serif' }); t.textContent = 'Logo'; svg.append(t);
        }
        break;
      default:
    }
  }
  return svg;
}
