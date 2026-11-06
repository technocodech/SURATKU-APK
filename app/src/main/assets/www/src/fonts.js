// Metrik font standar PDF untuk tata letak. Padanan metrik font Office:
//   t = Times (Times New Roman), s = Helvetica (Arial), m = Courier (Courier New).
import { PDFDocument, StandardFonts } from 'pdf-lib';

let F = null; let allowed = null;
export const flags = { tidakDidukung: false };
const cache = new Map();

export const KELUARGA = {
  t: { nama: 'Times New Roman', css: "SuratSerif, 'Times New Roman', 'Liberation Serif', Times, serif", docx: 'Times New Roman' },
  s: { nama: 'Arial', css: "SuratSans, Arial, 'Liberation Sans', Helvetica, sans-serif", docx: 'Arial' },
  m: { nama: 'Courier New', css: "SuratMono, 'Courier New', 'Liberation Mono', Courier, monospace", docx: 'Courier New' },
};
export const DAFTAR_FONT = Object.entries(KELUARGA).map(([k, v]) => [k, v.nama]);
export const fam = (f) => (KELUARGA[f] ? f : 't');

export async function initFonts() {
  if (F) return;
  const d = await PDFDocument.create();
  const S = StandardFonts;
  const peta = {
    tr: S.TimesRoman, tb: S.TimesRomanBold, ti: S.TimesRomanItalic, tbi: S.TimesRomanBoldItalic,
    sr: S.Helvetica, sb: S.HelveticaBold, si: S.HelveticaOblique, sbi: S.HelveticaBoldOblique,
    mr: S.Courier, mb: S.CourierBold, mi: S.CourierOblique, mbi: S.CourierBoldOblique,
  };
  F = {};
  for (const [k, v] of Object.entries(peta)) F[k] = await d.embedFont(v);
  allowed = new Set(F.tr.getCharacterSet());
}
export const styleKey = (st) => fam(st && st.f) + ((st && st.b ? 'b' : '') + (st && st.i ? 'i' : '') || 'r');

// Lebar per karakter (tanpa kerning) agar sama dengan hasil gambar PDF.
export function charW(ch, key) {
  const k = key + ch;
  let w = cache.get(k);
  if (w === undefined) { w = F[key].widthOfTextAtSize(ch, 1000) / 1000; cache.set(k, w); }
  return w;
}
export function width(text, st, size) {
  const key = styleKey(st); let w = 0;
  for (const ch of text) w += charW(ch, key);
  return w * size;
}

const MAP = { '\u00A0': ' ', '\u202F': ' ', '\u2009': ' ', '\u200B': '', '\u2212': '-', '\u2010': '-', '\u2011': '-', '\u2043': '-', '\u2022': '\u2022', '\t': '    ' };
// Ganti karakter yang tidak ada di font standar (mis. huruf Arab) dengan "?".
export function safe(text) {
  let out = '';
  for (const ch of String(text)) {
    if (ch === '\n') { out += ch; continue; }
    if (MAP[ch] !== undefined) { out += MAP[ch]; continue; }
    if (allowed.has(ch.codePointAt(0))) out += ch;
    else { out += '?'; flags.tidakDidukung = true; }
  }
  return out;
}
export const fontObj = (st) => F[styleKey(st)];
export const ready = () => !!F;
