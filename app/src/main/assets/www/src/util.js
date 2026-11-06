// Utilitas umum: tanggal Indonesia, uang, DOM builder, sanitasi teks.

export const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
export const HARI = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const ROMAWI = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];

export const uid = () => 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export const clone = (o) => JSON.parse(JSON.stringify(o));
export const romawi = (m) => ROMAWI[m - 1] || '';
export const pad = (n, d) => String(n).padStart(d, '0');

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}-${pad(d.getDate(), 2)}`;
}

export function parseISO(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  if (d.getFullYear() !== +m[1] || d.getMonth() !== +m[2] - 1 || d.getDate() !== +m[3]) return null;
  return d;
}

export function fmtTanggal(iso, style = 'long') {
  const d = parseISO(iso);
  if (!d) return '';
  if (style === 'short') return `${pad(d.getDate(), 2)}/${pad(d.getMonth() + 1, 2)}/${d.getFullYear()}`;
  const base = `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
  return style === 'longday' ? `${HARI[d.getDay()]}, ${base}` : base;
}

export const hariDari = (iso) => { const d = parseISO(iso); return d ? HARI[d.getDay()] : ''; };

// "09:30" -> "09.30"
export const fmtJam = (t) => (/^\d{1,2}:\d{2}$/.test(t || '') ? t.replace(':', '.') : '');

export function digitsOnly(s) { return String(s ?? '').replace(/[^\d]/g, ''); }
export function parseMoney(s) { const d = digitsOnly(s); return d ? parseInt(d, 10) : 0; }
export function fmtRupiah(n) { return 'Rp ' + Math.round(n).toLocaleString('id-ID'); }
export function fmtAngka(n) { return Math.round(n).toLocaleString('id-ID'); }

export function slug(s, sep = '_') {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, sep).replace(new RegExp('^' + sep + '+|' + sep + '+$', 'g'), '');
}

// Nama berkas aman: karakter tidak valid dibersihkan.
// Teks tanpa penanda format sebaris (**tebal**, *miring*, ++garis bawah++, {w:#warna}…{/w}).
export function polos(t) {
  return String(t ?? '').replace(/\{w:#[0-9a-fA-F]{6}\}|\{\/w\}/g, '').replace(/\*\*|\+\+/g, '').replace(/(^|[^\w*])\*(?=\S)|(?<=\S)\*(?=[^\w*]|$)/g, '$1').trim();
}
export function namaBerkas(parts, ext) {
  const base = parts.filter(Boolean).map((p) =>
    polos(p).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[\\/:*?"<>|\x00-\x1f]/g, ' ')
      .replace(/[^A-Za-z0-9 _.-]/g, '').trim().replace(/\s+/g, '_')
  ).filter(Boolean).join('_').replace(/_+/g, '_').slice(0, 120) || 'Surat';
  return `${base}.${ext}`;
}

// Hapus karakter kontrol; pertahankan baris baru dan tab.
export function bersihkan(s) {
  return String(s ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').replace(/\r\n?/g, '\n');
}

// Penampung DOM aman (tanpa innerHTML untuk data pengguna).
export function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'value') el.value = v;
    else if (k === 'checked' || k === 'disabled' || k === 'selected' || k === 'readOnly') el[k] = !!v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

export function debounce(fn, ms) {
  let t;
  const d = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  d.flush = (...a) => { clearTimeout(t); fn(...a); };
  d.cancel = () => clearTimeout(t);
  return d;
}

export function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: filename });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function dataUrlToBytes(dataUrl) {
  const b64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// Terbilang bahasa Indonesia (bilangan bulat tak negatif).
const SAT = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
function tb(n) {
  if (n < 12) return SAT[n];
  if (n < 20) return tb(n - 10) + ' belas';
  if (n < 100) return tb(Math.floor(n / 10)) + ' puluh' + (n % 10 ? ' ' + tb(n % 10) : '');
  if (n < 200) return 'seratus' + (n % 100 ? ' ' + tb(n % 100) : '');
  if (n < 1000) return tb(Math.floor(n / 100)) + ' ratus' + (n % 100 ? ' ' + tb(n % 100) : '');
  if (n < 2000) return 'seribu' + (n % 1000 ? ' ' + tb(n % 1000) : '');
  if (n < 1e6) return tb(Math.floor(n / 1e3)) + ' ribu' + (n % 1e3 ? ' ' + tb(n % 1e3) : '');
  if (n < 1e9) return tb(Math.floor(n / 1e6)) + ' juta' + (n % 1e6 ? ' ' + tb(n % 1e6) : '');
  if (n < 1e12) return tb(Math.floor(n / 1e9)) + ' miliar' + (n % 1e9 ? ' ' + tb(n % 1e9) : '');
  return tb(Math.floor(n / 1e12)) + ' triliun' + (n % 1e12 ? ' ' + tb(n % 1e12) : '');
}
export function terbilang(n) {
  n = Math.floor(Math.abs(+n || 0));
  if (n === 0) return 'nol';
  if (n >= 1e15) return '';
  return tb(n);
}

export function relTime(ts) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'baru saja';
  if (m < 60) return `${m} menit lalu`;
  const j = Math.floor(m / 60); if (j < 24) return `${j} jam lalu`;
  const d = Math.floor(j / 24); if (d < 7) return `${d} hari lalu`;
  const t = new Date(ts); return `${t.getDate()} ${BULAN[t.getMonth()].slice(0, 3)} ${t.getFullYear()}`;
}
