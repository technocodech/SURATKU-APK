// Menyusun surat (data + template) menjadi model dokumen (IR) yang dipakai pratinjau, PDF, dan Word.
import { dekorPng, DEKOR } from './dekor.js';
import { layout as tataLetak } from './layout.js';
import { BUILTIN } from './templates.js';
import { qrKePng } from './qr.js';
import { arabGambar } from './arab.js';
import { KATEGORI, namaOrgSatuBaris, alamatLengkap, kontakBaris, daftarPejabat, kopCfg, bagianCfg, DEFAULT_TTD, merge } from './org.js';
import { wrap } from './layout.js';
import { fmtTanggal, fmtJam, hariDari, fmtRupiah, fmtAngka, parseMoney, parseISO, todayISO, bersihkan, terbilang, uid, clone } from './util.js';
import { safe, flags, width as tw } from './fonts.js';

const MISS_A = '\uE000'; const MISS_B = '\uE001'; const STAR = '\uE002'; const PLUS = '\uE003';
export const TITIK = '………………';

// Peran penandatangan: jabatan pada Data Organisasi + "Yang menyatakan" + isian bebas.
const LABEL_BAWAAN = { ketua: 'Ketua', sekretaris: 'Sekretaris', bendahara: 'Bendahara', pembuat: 'Yang menyatakan', lain: '' };
export function daftarPeran(org) {
  return [...daftarPejabat(org).map((p) => ({ id: p.id, jabatan: p.jabatan || LABEL_BAWAAN[p.id] || p.id, nama: p.nama || '' })),
    { id: 'pembuat', jabatan: 'Yang menyatakan', nama: '' }, { id: 'lain', jabatan: '', nama: '' }];
}
export const peranTersedia = (org) => daftarPeran(org).map((p) => p.id);
export const infoPeran = (org, r) => daftarPeran(org).find((p) => p.id === r) || { id: r, jabatan: LABEL_BAWAAN[r] ?? '', nama: '' };
const namaOtomatis = (org, role, vars, sg) => (sg && sg.namaVar ? (vars[sg.namaVar] || '') : role === 'pembuat' ? vars.nama_pembuat : (infoPeran(org, role).nama || ''));
export const SAPAAN = ['Kepada Yth.', 'Kepada :', 'Kepada', 'Yth.', 'Kepada Yth. Bapak/Ibu', 'Kepada Yth. Bapak', 'Kepada Yth. Ibu'];
export const SIFAT = ['', 'Biasa', 'Penting', 'Segera', 'Rahasia'];

// ---------- Kolom isian ----------
export function allFields(tpl) {
  const g = tpl.groups || {};
  const out = [];
  const surat = tpl.kind !== 'dokumen';
  if (g.identitas) {
    out.push({ key: 'tanggal_surat', label: 'Tanggal surat', type: 'date', required: true, group: 'identitas' });
    out.push({ key: 'lampiran', label: 'Lampiran', type: 'text', group: 'identitas', ph: 'mis. 1 (satu) berkas, atau tanda "-"' });
    if (!(tpl.header === 'none' || tpl.judul)) out.push({ key: 'perihal', label: 'Perihal', type: 'text', required: true, group: 'identitas' });
    else out.push({ key: 'perihal', label: 'Perihal / judul arsip', type: 'text', group: 'identitas' });
    out.push({ key: 'sifat', label: 'Sifat surat', type: 'select', options: SIFAT, group: 'identitas' });
  }
  if (g.penerima) {
    out.push({ key: 'sapaan', label: 'Sapaan formal', type: 'select', options: SAPAAN, group: 'penerima' });
    out.push({ key: 'nama_penerima', label: 'Nama penerima', type: 'text', group: 'penerima', ph: 'mis. Bapak H. Ahmad' });
    out.push({ key: 'jabatan_penerima', label: 'Jabatan penerima', type: 'text', group: 'penerima', ph: 'mis. Kepala Dinas Pendidikan' });
    out.push({ key: 'instansi_penerima', label: 'Nama instansi', type: 'text', group: 'penerima' });
    out.push({ key: 'alamat_penerima', label: 'Alamat penerima', type: 'text', group: 'penerima' });
    out.push({ key: 'kota_tujuan', label: 'Kota / wilayah tujuan', type: 'text', group: 'penerima', ph: 'di Tempat' });
  }
  for (const f of tpl.fields || []) out.push({ group: 'khusus', ...f });
  if (surat) out.push({ key: 'tembusan', label: 'Tembusan (satu per baris, opsional)', type: 'textarea', group: 'penutup' });
  return out;
}
export const fieldMap = (tpl) => Object.fromEntries(allFields(tpl).map((f) => [f.key, f]));

// ---------- Judul surat otomatis ----------
const JUDUL_JENIS = [
  [/undangan/i, 'SURAT UNDANGAN'], [/pemberitahuan|pengumuman/i, 'SURAT PEMBERITAHUAN'], [/permohonan|permintaan/i, 'SURAT PERMOHONAN'],
  [/keterangan/i, 'SURAT KETERANGAN'], [/tugas/i, 'SURAT TUGAS'], [/keputusan|penetapan/i, 'SURAT KEPUTUSAN'], [/pengantar/i, 'SURAT PENGANTAR'],
  [/rekomendasi/i, 'SURAT REKOMENDASI'], [/pernyataan/i, 'SURAT PERNYATAAN'], [/edaran/i, 'SURAT EDARAN'], [/balasan|jawaban/i, 'SURAT BALASAN'],
  [/takziah|belasungkawa|duka/i, 'SURAT TAKZIAH'], [/teguran|peringatan/i, 'SURAT TEGURAN'], [/kuasa/i, 'SURAT KUASA'], [/izin|ijin/i, 'SURAT IZIN'],
];
export function judulOtomatis(tpl) {
  const nama = String((tpl && tpl.nama) || '');
  for (const [re, j] of JUDUL_JENIS) if (re.test(nama)) return j;
  const kat = { undangan: 'SURAT UNDANGAN', pemberitahuan: 'SURAT PEMBERITAHUAN', permohonan: 'SURAT PERMOHONAN', keterangan: 'SURAT KETERANGAN', tugas: 'SURAT TUGAS', keputusan: 'SURAT KEPUTUSAN', rekomendasi: 'SURAT REKOMENDASI' };
  if (tpl && kat[tpl.kategori]) return kat[tpl.kategori];
  return /^surat\s/i.test(nama) ? nama.toUpperCase() : '';
}

// ---------- Surat baru ----------
export function buatSurat(tpl, org, set, logos) {
  const fields = {};
  for (const f of allFields(tpl)) fields[f.key] = f.type === 'table' ? Array.from({ length: f.fillFrom ? 0 : Math.min(f.minRows || 0, 4) }, () => ({})) : (f.default ?? '');
  Object.assign(fields, { tanggal_surat: todayISO(), lampiran: '-', kota_tujuan: 'di Tempat', sapaan: 'Kepada Yth.' }, tpl.defaults || {});
  const spec = (tpl.signer && tpl.signer.length ? tpl.signer : []).map((r) => (typeof r === 'string' ? { role: r } : r));
  const now = Date.now();
  if (tpl.format) set = merge(set, tpl.format); // format khusus template (font, margin, gaya kop, dst.)
  const ttd = { ...DEFAULT_TTD, ...(set.ttd || {}), ...(tpl.ttd || {}) };
  if (tpl.kind === 'dokumen' && !(tpl.ttd && tpl.ttd.pengantar !== undefined)) ttd.pengantar = '';
  const signers = spec.map((r) => {
    const info = infoPeran(org, r.role);
    return { role: r.role, jabatan: r.jabatan ?? info.jabatan, nama: '', org: String(r.org || '').replaceAll('{{nama_organisasi}}', namaOrgSatuBaris(org)), gambar: null, posisi: r.posisi, baris: r.baris || 1, pengantar: r.pengantar || '', ket: r.ket || '', tambahAtas: r.tambahAtas || '', tambahBawah: r.tambahBawah || '', ...(r.namaVar ? { namaVar: r.namaVar } : {}) };
  });
  if (signers.some((x) => !x.posisi)) posisiDefault(signers);
  return {
    id: uid(), tplId: tpl.id, tpl: clone(tpl), status: 'draf', createdAt: now, updatedAt: now,
    kop: tpl.kop && tpl.kop !== 'logo' ? tpl.kop : (set.kopDefault || 'nologo'), logoKiri: 'muslimat', logoKanan: logos.fatayat ? 'fatayat' : 'none',
    kertas: (tpl.format && tpl.format.kertas) || set.kertas, nomorMode: tpl.kind === 'dokumen' ? 'manual' : 'auto', nomor: '',
    fields, salamPakai: tpl.salam !== false && set.salam.pakai, penutup: (tpl.closings && tpl.closings[0]) || '',
    body: (tpl.body || []).map((b) => ({ id: uid(), ...clone(b) })),
    signers, ttd,
    ttdGambar: false, kotaTtd: org.kotaTtd, tanggalTtd: '',
    snap: ambilSnap(org, set, logos),
  };
}

export function ambilSnap(org, set, logos) {
  return clone({ org, set, logos: { muslimat: logos.muslimat || null, fatayat: logos.fatayat || null, alt: logos.alt || null } });
}

// Posisi bawaan: per baris, 1 orang di kanan, 2 orang kiri-kanan, 3 orang kiri-tengah-kanan.
export function posisiDefault(signers) {
  const barisMap = new Map();
  for (const s of signers) { const b = s.baris || 1; if (!barisMap.has(b)) barisMap.set(b, []); barisMap.get(b).push(s); }
  for (const arr of barisMap.values()) {
    const n = arr.length;
    const p = n === 1 ? ['kanan'] : n === 2 ? ['kiri', 'kanan'] : ['kiri', 'tengah', 'kanan'];
    arr.forEach((s, i) => { s.posisi = p[i] || 'kanan'; });
  }
  return signers;
}

// ---------- Variabel ----------
function nilaiField(f, v, set) {
  if (v == null) return '';
  switch (f.type) {
    case 'date': return fmtTanggal(v, set.formatTanggal);
    case 'time': return fmtJam(v);
    case 'money': return parseMoney(v) ? fmtRupiah(parseMoney(v)) : '';
    case 'table': return '';
    default: return bersihkan(String(v)).trim();
  }
}

export function buatVars(letter, nomorTampil) {
  const { org, set } = letter.snap; const tpl = letter.tpl; const F = letter.fields;
  const v = {};
  for (const f of allFields(tpl)) {
    v[f.key] = nilaiField(f, F[f.key], set);
    if (f.type === 'money') v['terbilang_' + f.key] = parseMoney(F[f.key]) ? terbilang(parseMoney(F[f.key])) + ' rupiah' : '';
  }
  v.nama_organisasi = namaOrgSatuBaris(org);
  v.alamat_organisasi = alamatLengkap(org);
  v.nama_ketua = ''; v.nama_sekretaris = ''; v.nama_bendahara = '';
  for (const p of daftarPejabat(org)) { v['nama_' + p.id] = p.nama || ''; v['jabatan_' + p.id] = p.jabatan || ''; }
  v.kota_surat = letter.kotaTtd || org.kotaTtd || '';
  v.nomor_surat = nomorTampil || letter.nomor || '';
  v.tanggal_surat = fmtTanggal(F.tanggal_surat, set.formatTanggal);
  v.hari_kegiatan = hariDari(F.tanggal_kegiatan);
  v.waktu_kegiatan = F.waktu_mulai ? `${fmtJam(F.waktu_mulai)}${F.waktu_selesai ? ' - ' + fmtJam(F.waktu_selesai) : ' s.d. selesai'} ${set.zona || 'WIB'}`.trim() : '';
  v.judul = tpl.judul || '';
  v.telepon_organisasi = org.telepon || ''; v.email_organisasi = org.email || '';
  for (const k of Object.keys(v)) if (!k.endsWith('_upper')) v[k + '_upper'] = v[k].toUpperCase();
  return v;
}

export function labelVar(tpl, key) {
  const base = key.replace(/_upper$/, '');
  const f = fieldMap(tpl)[base];
  const L = { nama_organisasi: 'Nama organisasi', nama_ketua: 'Nama ketua (Data Organisasi)', nama_sekretaris: 'Nama sekretaris (Data Organisasi)', nama_bendahara: 'Nama bendahara (Data Organisasi)', nomor_surat: 'Nomor surat', tanggal_surat: 'Tanggal surat', hari_kegiatan: 'Tanggal kegiatan', waktu_kegiatan: 'Waktu mulai kegiatan', alamat_organisasi: 'Alamat organisasi', kota_surat: 'Kota surat' };
  return (f && f.label) || L[base] || key;
}

// ---------- Teks ----------
function sub(str, ctx, fmt, soft, inline) {
  return String(str).replace(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi, (m, k) => {
    k = k.toLowerCase();
    let val = ctx.vars[k];
    if (inline && typeof val === 'string') val = val.replace(/\s*\n+\s*/g, '; ');
    if (fmt && Object.prototype.hasOwnProperty.call(fmt, k)) return val ? fmt[k].replace('{v}', val) : '';
    if (val === undefined) { ctx.tidakDikenal.add(k); return MISS_A + TITIK + MISS_B; }
    if (val === '') { if (!soft) ctx.hilang.add(k); return MISS_A + TITIK + MISS_B; }
    return val;
  });
}
const varsDi = (str) => [...String(str).matchAll(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi)].map((m) => m[1].toLowerCase());
const kosong = (ctx, k) => !ctx.vars[k];

// Teks bertanda -> runs [{text,b,i,u,color,miss}].
// Penanda: **tebal**, *miring*, ++garis bawah++, {w:#rrggbb}teks berwarna{/w}. Penanda tanpa pasangan dianggap huruf biasa.
const WARNA = /^\{w:(#[0-9a-fA-F]{6})\}/;
export function jadiRuns(src, base = {}) {
  src = String(src);
  const out = []; const st = { b: false, i: false, u: false, color: null };
  let buf = '';
  const gaya = () => ({ ...base, ...(st.b ? { b: true } : {}), ...(st.i ? { i: true } : {}), ...(st.u ? { u: true } : {}), ...(st.color ? { color: st.color } : {}) });
  const flush = () => { if (buf) { out.push({ ...gaya(), text: buf }); buf = ''; } };
  // Penanda dianggap pembuka bila diikuti huruf dan ada penutup (didahului huruf) di belakangnya.
  const adaPasangan = (k, tok) => {
    const n = src[k + tok.length]; if (n === undefined || /\s/.test(n)) return false;
    let j = k + tok.length;
    while ((j = src.indexOf(tok, j)) !== -1) { if (j > k + tok.length && !/\s/.test(src[j - 1])) return true; j += tok.length; }
    return false;
  };
  for (let k = 0; k < src.length;) {
    const c = src[k];
    if (c === MISS_A) {
      flush(); const e = src.indexOf(MISS_B, k); const akhir = e < 0 ? src.length : e;
      out.push({ ...gaya(), text: src.slice(k + 1, akhir), miss: true }); k = e < 0 ? src.length : e + 1; continue;
    }
    if (src.startsWith('**', k) && (st.b || adaPasangan(k, '**'))) { flush(); st.b = !st.b; k += 2; continue; }
    if (src.startsWith('++', k) && (st.u || adaPasangan(k, '++'))) { flush(); st.u = !st.u; k += 2; continue; }
    if (c === '*' && !src.startsWith('**', k) && (st.i || adaPasangan(k, '*'))) { flush(); st.i = !st.i; k += 1; continue; }
    if (c === '{') {
      const m = WARNA.exec(src.slice(k, k + 12));
      if (m && src.indexOf('{/w}', k) !== -1) { flush(); st.color = m[1]; k += m[0].length; continue; }
      if (src.startsWith('{/w}', k) && st.color) { flush(); st.color = null; k += 4; continue; }
    }
    buf += c; k++;
  }
  flush();
  for (const r of out) r.text = safe(r.text.replaceAll(STAR, '*').replaceAll(PLUS, '+'));
  return out.filter((r) => r.text !== '');
}
const runsOf = (s, ctx, extra) => jadiRuns(sub(s, ctx, null, false), extra);

// ---------- Definisi blok informasi ----------
const R = (label, tpl, opt, fmt) => ({ label, tpl, opt: !!opt, fmt });
export function kvRows(ref, tpl) {
  const dok = tpl.kind === 'dokumen';
  switch (ref) {
    case 'kegiatan': return [
      ...(dok ? [R('Kegiatan', '{{nama_kegiatan}}')] : []),
      R('Hari/Tanggal', '{{hari_kegiatan}}, {{tanggal_kegiatan}}'),
      R('Waktu', '{{waktu_kegiatan}}', dok),
      R('Tempat', '{{tempat_kegiatan}}{{alamat_tempat}}', dok, { alamat_tempat: '\n{v}' }),
      ...(dok ? [] : [R('Acara', '{{nama_kegiatan}}', true)]),
      R('Penanggung jawab', '{{penanggung_jawab}}', true),
      R('Keterangan', '{{info_tambahan}}', true),
    ];
    case 'rapat': return [R('Hari/Tanggal', '{{hari_kegiatan}}, {{tanggal_kegiatan}}'), R('Waktu', '{{waktu_kegiatan}}', true), R('Tempat', '{{tempat_kegiatan}}'), R('Pimpinan rapat', '{{pimpinan_rapat}}', true), R('Notulis', '{{notulis}}', true), R('Peserta hadir', '{{jumlah_hadir}}', true, null)];
    case 'wakil': return [R('Nama', '{{nama_wakil}}'), R('Jabatan', '{{jabatan_wakil}}', true), R('Alamat', '{{alamat_wakil}}', true)];
    case 'ket': return [R('Nama', '{{nama_ket}}'), R('Tempat/Tgl. Lahir', '{{ttl}}', true), R('Alamat', '{{alamat_ket}}', true), R('Jabatan', '{{jabatan_ket}}', true)];
    case 'rek': return [R('Nama', '{{nama_rek}}'), R('Alamat', '{{alamat_rek}}', true), R('Status', '{{status_rek}}', true)];
    case 'pembuat': return [R('Nama', '{{nama_pembuat}}'), R('Tempat/Tgl. Lahir', '{{ttl_pembuat}}', true), R('Alamat', '{{alamat_pembuat}}', true), R('Jabatan', '{{jabatan_pembuat}}', true)];
    default: return [];
  }
}

// ---------- Tabel ----------
function barisTerisi(rows, cols) { return (rows || []).filter((r) => cols.some((c) => (r[c.key] ?? '').toString().trim() !== '')); }

function buatTabel(field, ctx) {
  const rowsIn = (ctx.letter.fields[field.key] || []);
  const cols = field.columns;
  let rows = barisTerisi(rowsIn, cols);
  const terisi = rows.length;
  let target = terisi;
  if (field.fillFrom) target = Math.max(terisi, Math.min(200, parseInt(ctx.vars[field.fillFrom] || '0', 10) || 0));
  const tampilKosong = terisi === 0 && !field.fillFrom && (field.required || field.minRows);
  if (tampilKosong && field.required) { rows = Array.from({ length: Math.max(field.minRows || 3, 3) }, () => ({})); target = rows.length; ctx.hilangTabel.add(field.key); }
  else if (terisi === 0 && !field.fillFrom) return null;
  const hasNo = !!field.numbered || !!field.fillFrom;
  const tcols = [];
  if (hasNo) tcols.push({ w: 0.55, align: 'center', label: 'No' });
  for (const c of cols) tcols.push({ w: c.w || 2, align: c.align || 'left', label: c.label, ttd: !!c.ttd });
  const body = [];
  let total = 0;
  for (let i = 0; i < target; i++) {
    const r = rows[i] || {};
    const cells = [];
    if (hasNo) cells.push(String(i + 1));
    for (const c of cols) {
      let val = bersihkan(String(r[c.key] ?? '')).trim();
      if (c.money && val) { val = fmtAngka(parseMoney(val)); }
      cells.push(safe(val));
    }
    if (field.sum) total += parseMoney(r[field.sum]);
    body.push(cells);
  }
  const ttdRows = cols.some((c) => c.ttd);
  const tbl = { type: 'table', cols: tcols, header: tcols.map((c) => c.label), rows: body, minRowH: ttdRows ? 26 : 17, boldRows: [], blankMiss: tampilKosong && !!field.required };
  if (field.sum) {
    const lab = new Array(tcols.length).fill('');
    lab[hasNo ? 1 : 0] = 'Jumlah'; lab[tcols.length - 1] = fmtAngka(total);
    tbl.rows.push(lab); tbl.boldRows.push(tbl.rows.length - 1); tbl.total = total;
  }
  ctx.totals[field.key] = total;
  return tbl;
}

// ---------- Penyusunan dokumen ----------
const norm = (line) => line.replace(/^\s*(\d+[.)]|[-•*])\s+/, '').trim();
const pecahBaris = (s) => bersihkan(s).split('\n').map(norm).filter(Boolean);

function logoRef(snap, slot) {
  const l = snap.logos[slot];
  return l ? { dataUrl: l.dataUrl, mime: l.mime, w: l.w, h: l.h, slot } : null;
}

export function susunDokumen(letter, { nomorTampil } = {}) {
  const { org, set } = letter.snap; const tpl = letter.tpl; const fm = fieldMap(tpl);
  const ctx = { letter, vars: buatVars(letter, nomorTampil), hilang: new Set(), tidakDikenal: new Set(), hilangTabel: new Set(), totals: {} };
  flags.tidakDidukung = false;
  const dok = tpl.kind === 'dokumen';
  const blocks = [];
  const align = (a) => (a === 'justify' ? (set.rataTeks === 'left' ? 'left' : 'justify') : (a || 'left'));
  const sz = set.ukuranFont;
  const fam = set.font || 't';

  // --- Kop ---
  let kopBlok = null;
  if (letter.kop !== 'none') {
    const K = kopCfg(set); const lines = [];
    const baris = (teks, g) => ({ text: safe(g.kapital ? teks.toUpperCase() : teks), size: g.size, b: g.b, i: g.i, u: g.u, color: g.color, f: g.f, jarak: g.jarak || 0 });
    const pecah = (t) => bersihkan(t || '').split('\n').map((x) => x.trim()).filter(Boolean);
    for (const ln of pecah(org.induk)) lines.push(baris(ln, K.gaya.induk));
    for (const ln of pecah(org.nama)) lines.push(baris(ln, K.gaya.nama));
    const al = alamatLengkap(org); if (al) lines.push(baris(al, K.gaya.alamat));
    const ko = kontakBaris(org); if (ko) lines.push(baris(ko, K.gaya.kontak));
    for (const ln of pecah(org.kopTambahan)) lines.push(baris(ln, K.gaya.tambahan));
    const pakaiLogo = letter.kop === 'logo';
    const kiriAda = pakaiLogo && letter.logoKiri && letter.logoKiri !== 'none'; const kananAda = pakaiLogo && letter.logoKanan && letter.logoKanan !== 'none';
    blocks.push({
      type: 'kop', lines, garis: K.garis, rata: K.rata, jarakBaris: K.jarakBaris, jarakBawah: K.jarakBawah, gapLogo: K.gapLogo, padAtas: K.padAtas || 0, logoVertikal: K.logoVertikal || 'tengah',
      kiri: kiriAda ? logoRef(letter.snap, letter.logoKiri) : null,
      kanan: kananAda ? logoRef(letter.snap, letter.logoKanan) : null,
      slotKiri: kiriAda ? letter.logoKiri : null,
      slotKanan: kananAda ? letter.logoKanan : null,
      boxKiri: set.logoUkuran?.[letter.logoKiri] || 22, boxKanan: set.logoUkuran?.[letter.logoKanan] || 22,
      pakaiLogo,
    });
    kopBlok = blocks[blocks.length - 1];
  }

  // --- Tanggal & penandatangan ---
  const kotaTtd = letter.kotaTtd || org.kotaTtd || '';
  const tglTtd = fmtTanggal(letter.tanggalTtd || letter.fields.tanggal_surat, set.formatTanggal);
  const barisTanggal = tpl.penetapan ? [`Ditetapkan di : ${kotaTtd}`, `pada tanggal : ${tglTtd}`] : [`${kotaTtd}${kotaTtd ? ', ' : ''}${tglTtd}`];
  const tanggalAtas = !dok && !tpl.penetapan && !['ttd', 'bawah'].includes(set.tanggalPosisi) && (tpl.header || (tpl.judul ? 'judul' : 'standar')) === 'standar' && !!tpl.groups?.identitas;

  // --- Kepala surat ---
  const BG = bagianCfg(set);
  const header = tpl.header || (tpl.judul ? 'judul' : (dok ? 'none' : 'standar'));
  const F = letter.fields;
  const nomor = ctx.vars.nomor_surat;
  if (header === 'standar' && tpl.groups?.identitas) {
    const sing = BG.header.label === 'singkat';
    const rows = [
      ...(tpl.tanpaNomor ? [] : [{ label: sing ? 'No' : 'Nomor', runs: nomor ? jadiRuns(safe(nomor)) : jadiRuns(MISS_A + TITIK + MISS_B) }]),
      { label: sing ? 'Lamp' : 'Lampiran', runs: jadiRuns(safe(ctx.vars.lampiran || '-')) },
    ];
    if (ctx.vars.sifat) rows.push({ label: 'Sifat', runs: jadiRuns(safe(ctx.vars.sifat)) });
    rows.push({ label: sing ? 'Hal' : 'Perihal', runs: jadiRuns(sub('{{perihal}}', ctx), BG.header.perihalTebal === false ? {} : { b: true }) });
    const JD = BG.judul;
    if (JD.tampil) {
      const teks = (JD.otomatis === false && String(JD.teks || '').trim()) ? JD.teks : judulOtomatis(tpl);
      if (teks) blocks.push({ type: 'p', runs: jadiRuns(safe(teks), { b: JD.b !== false, ...(JD.u !== false ? { u: true } : {}) }), align: JD.rata || 'center', size: JD.ukuran > 0 ? JD.ukuran : sz + 2, ul: JD.u !== false, before: JD.atas, after: JD.bawah, keepNext: true });
    }
    if (!nomor && !tpl.tanpaNomor) ctx.hilangNomor = true;
    const kv = { type: 'kv', rows, indent: 0, labelMin: sing ? 40 : 58, after: BG.header.bawah, rowGap: BG.header.antarBaris };
    if (BG.header.atas > 0) blocks.push({ type: 'spacer', h: BG.header.atas });
    const tglW = Math.min(0.6, Math.max(0.2, (+set.tglAtasLebar || 38) / 100));
    if (tanggalAtas) blocks.push({ type: 'cols', widths: [1 - tglW, tglW], gap: 6, after: Math.max(0, BG.header.bawah - 2), cols: [[kv], [{ type: 'p', runs: jadiRuns(safe(barisTanggal.join('\n'))), align: ['left', 'center', 'right'].includes(set.tglAtasRata) ? set.tglAtasRata : 'left', after: 0 }]] });
    else blocks.push(kv);
  } else if (header === 'judul') {
    blocks.push({ type: 'p', runs: jadiRuns(safe(tpl.judul), { b: true }), align: 'center', size: sz + 2, ul: true, after: 2, keepNext: true });
    if (tpl.groups?.identitas) {
      if (tpl.tanpaNomor) blocks[blocks.length - 1].after = 12;
      else {
        blocks.push({ type: 'p', runs: nomor ? jadiRuns('Nomor: ' + safe(nomor)) : jadiRuns('Nomor: ' + MISS_A + TITIK + MISS_B), align: 'center', after: 12 });
        if (!nomor) ctx.hilangNomor = true;
      }
    }
  }

  const awalBadan = blocks.length;
  // --- Penerima ---
  const adaPenerima = tpl.groups?.penerima && (header === 'standar' || header === 'judul') && (header === 'standar' || ctx.vars.nama_penerima || ctx.vars.jabatan_penerima);
  if (adaPenerima) {
    const L = [];
    L.push(safe(ctx.vars.sapaan || 'Kepada Yth.'));
    for (const k of ['nama_penerima', 'jabatan_penerima', 'instansi_penerima', 'alamat_penerima']) if (ctx.vars[k]) L.push(safe(ctx.vars[k]));
    if (!ctx.vars.nama_penerima && !ctx.vars.jabatan_penerima) { L.push(MISS_A + TITIK + MISS_B); ctx.hilang.add('jabatan_penerima'); }
    const pn = BG.penerima;
    const tp = tulisTempat(safe(ctx.vars.kota_tujuan || ''), pn.tempat);
    if (tp.baris) L.push(tp.baris);
    const kiriP = pn.tata === 'menjorok' ? Math.min(90, Math.max(0, pn.indent)) * 72 / 25.4 : 0;
    const runsP = L.length > 1 && pn.tebalNama ? [...jadiRuns(L[0]), ...jadiRuns('\n' + L.slice(1).join('\n'), { b: true })]
      : (tp.diTebal && L.length > 1 ? [...jadiRuns(L.slice(0, -1).join('\n') + '\n'), ...jadiRuns(L[L.length - 1], { b: true })] : (tp.diTebal ? jadiRuns(L[0], { b: true }) : jadiRuns(L.join('\n'))));
    blocks.push({ type: 'p', runs: runsP, align: 'left', before: pn.atas, after: tp.bawahTempat ? 0 : pn.bawah, kiri: kiriP });
    if (tp.bawahTempat) blocks.push({ type: 'p', runs: jadiRuns(tp.bawahTempat, tp.tebal ? { b: true } : {}), align: 'left', before: 0, after: pn.bawah, kiri: kiriP + Math.min(60, Math.max(0, +pn.tempatGeser || 0)) * 72 / 25.4 });
  }

  // --- Salam pembuka ---
  const pakaiSalam = !dok && letter.salamPakai && tpl.salam !== false;
  const gayaSalam = (gs) => ({ run: { ...(gs.b ? { b: true } : {}), ...(gs.i ? { i: true } : {}), ...(warnaOk(gs.color) ? { color: gs.color } : {}), ...(['t', 's', 'm'].includes(gs.f) ? { f: gs.f } : {}) }, blok: (gs.size > 0 ? { size: Math.min(24, Math.max(7, +gs.size)) } : {}) });
  const GSb = gayaSalam((set.salam && set.salam.gaya) || {}); const GSp = (set.salam && set.salam.gayaSama === false && set.salam.gayaPenutup) ? gayaSalam(set.salam.gayaPenutup) : GSb;
  if (pakaiSalam && set.salam.pembuka && set.salam.pakaiPembuka !== false) blocks.push({ type: 'p', runs: jadiRuns(safe(set.salam.pembuka), GSb.run), align: BG.salam.rata, before: BG.salam.atas, after: BG.salam.bawah, noIndent: true, ...GSb.blok });

  // --- Isi ---
  if (BG.isi.atas > 0) blocks.push({ type: 'spacer', h: BG.isi.atas });
  const bodyBlocks = letter.body || [];
  for (const b of bodyBlocks) {
    if (header === 'judul' && b.type === 'h' && /^\{\{\s*judul\s*\}\}$/.test(b.text || '')) continue; // judul sudah tampil di kepala
    const out = bangunBlok(b, ctx, { align, dok, set, tpl, fm });
    if (out) blocks.push(...[].concat(out));
  }

  if (BG.isi.bawah > 0) blocks.push({ type: 'spacer', h: BG.isi.bawah });
  { const BD = BG.badan || {}; const rt = blocks.splice(awalBadan); blocks.push(...bungkusBadan(rt, BD)); }
  // --- Penutup + tanda tangan (satu grup) ---
  const grup = [];
  const pt = BG.penutup; const indPt = pt.indent === 'ya' ? (set.indentUkuran ?? 36) : pt.indent === 'tidak' ? 0 : (dok || set.indentParagraf === false ? 0 : (set.indentUkuran ?? 36));
  const penutupBl = [];
  if (letter.penutup && letter.penutup.trim()) penutupBl.push({ type: 'p', runs: runsOf(letter.penutup, ctx), align: align(pt.rata || 'justify'), before: pt.atas, after: pt.bawah, indent: indPt });
  if (pakaiSalam && set.salam.penutup && set.salam.pakaiPenutup !== false) penutupBl.push({ type: 'p', runs: jadiRuns(safe(set.salam.penutup), GSp.run), align: BG.salam.rata, after: 6, ...GSp.blok });
  grup.push(...bungkusBadan(penutupBl, BG.badan || {}));
  if (BG.ttd.atas > 0) grup.push({ type: 'spacer', h: BG.ttd.atas });
  const bagianTtd = buatTandaTangan(letter, ctx, barisTanggal, tanggalAtas ? '' : (set.tanggalPosisi === 'bawah' ? 'bawah' : 'ttd'));
  if (bagianTtd) grup.push(...bagianTtd);
  const qrB = bangunQR(letter, ctx, org, barisTanggal); if (qrB) grup.push(...qrB);
  if (grup.length) blocks.push({ type: 'group', blocks: grup });

  // --- Tembusan ---
  const tembusan = pecahBaris(F.tembusan || '');
  if (tembusan.length && !dok) {
    blocks.push({ type: 'p', runs: jadiRuns('Tembusan:'), align: 'left', before: BG.tembusan.atas, after: BG.tembusan.bawah, size: sz - 1, keepNext: true });
    blocks.push({ type: 'list', ordered: true, items: tembusan.map((t) => jadiRuns(safe(t))), size: sz - 1, indent: 0, hang: 16 });
  }

  // --- Lampiran (halaman tambahan, kop diulang bila dipilih) ---
  const LP = letter.lampiran;
  if (LP && LP.pakai && !dok) {
    blocks.push({ type: 'pb' });
    if (kopBlok && LP.kop !== false) blocks.push({ ...kopBlok });
    if (LP.rujukan !== false) {
      const rj = [['Lampiran', LP.judulSingkat || 'Lampiran surat'], ['Nomor', ctx.vars.nomor_surat], ['Tanggal', ctx.vars.tanggal_surat || ''], ['Hal', ctx.vars.perihal || '']].filter((r) => r[1]);
      blocks.push({ type: 'kv', rows: rj.map(([label, v]) => ({ label, runs: jadiRuns(safe(v)) })), indent: 0, labelMin: 60, after: 10 });
    }
    if ((LP.judul || '').trim()) blocks.push({ type: 'p', runs: jadiRuns(safe(LP.judul.trim()), { b: true }), align: 'center', after: 10 });
    for (const b of LP.blok || []) {
      const out = bangunBlok(b, ctx, { align, dok, set, tpl, fm });
      if (out) blocks.push(...[].concat(out));
    }
  }

  const m = set.margin;
  const mm = (x) => x * 72 / 25.4;
  const kertas = letter.kertas === 'F4' ? { w: 210, h: 330 } : { w: 210, h: 297 };
  const doc = {
    paper: { name: letter.kertas === 'F4' ? 'F4' : 'A4', w: mm(kertas.w), h: mm(kertas.h), wmm: kertas.w, hmm: kertas.h },
    margins: { top: mm(m.atas), bottom: mm(m.bawah), left: mm(m.kiri), right: mm(m.kanan), mm: m },
    size: sz, spacing: set.spasi, fam, blocks, ruangTtd: set.ruangTtd, fontWord: set.fontWord || '',
    judulBerkas: tpl.nama, tidakDidukung: flags.tidakDidukung,
  };
  const dk = set.dekor;
  if (dk && dk.model && dk.model !== 'none') { const png = dekorPng(dk.model, dk.warna1, dk.warna2, { kertasH: kertas.h }); if (png) doc.dekor = { png, semua: dk.tampil !== 'pertama', model: dk.model }; }
  return { doc, ctx };
}

// Kode QR verifikasi: berisi ringkasan surat (atau teks/tautan sendiri). Dibuat lokal, tanpa server.
const qrCache = new Map();
const polos = (t) => String(t || '').replace(/\*\*|\+\+|\{w:#[0-9a-fA-F]{6}\}|\{\/w\}/g, '').replace(/[\u2018\u2019]/g, "'").trim();
export function isiQR(letter, ctx, org, barisTanggal) {
  const q = letter.qr || {};
  if (q.isi === 'khusus' && String(q.teks || '').trim()) return String(q.teks).trim().slice(0, 300);
  const s0 = (letter.signers || [])[0]; const nm = s0 ? ((s0.nama || '').trim() || namaOtomatis(org, s0.role, ctx.vars, s0) || '') : '';
  const baris = [
    ctx.vars.nomor_surat ? 'Surat No. ' + polos(ctx.vars.nomor_surat) : 'Surat ' + polos(letter.tpl && letter.tpl.nama),
    ctx.vars.perihal ? 'Perihal: ' + polos(ctx.vars.perihal) : '', 'Tanggal: ' + polos((barisTanggal && barisTanggal[0]) || ''),
    org && org.nama ? 'Penerbit: ' + polos(namaOrgSatuBaris(org)) : '', nm ? 'Penandatangan: ' + polos(nm) + (s0.jabatan ? ' (' + polos(s0.jabatan) + ')' : '') : '',
  ];
  return baris.filter(Boolean).join('\n').slice(0, 300);
}
function bangunQR(letter, ctx, org, barisTanggal) {
  const q = letter.qr; if (!q || !q.pakai) return null;
  const teks = isiQR(letter, ctx, org, barisTanggal); if (!teks) return null;
  let png = qrCache.get(teks);
  if (!png) { try { png = qrKePng(teks, { ecc: 'M', skala: 8 }); } catch (e) { return null; } qrCache.set(teks, png); if (qrCache.size > 30) qrCache.delete(qrCache.keys().next().value); }
  const mmPt = (x) => x * 72 / 25.4; const wPt = mmPt(Math.min(45, Math.max(12, +q.ukuran || 22)));
  const align = ['left', 'center', 'right'].includes(q.posisi) ? q.posisi : 'left';
  const out = [{ type: 'arab', gambar: { dataUrl: png.dataUrl, mime: 'image/png', w: wPt, h: wPt }, align, before: 8, after: String(q.keterangan || '').trim() ? 1 : 4 }];
  if (String(q.keterangan || '').trim()) out.push({ type: 'p', runs: jadiRuns(safe(q.keterangan.trim())), align, size: Math.max(7, (letter.snap.set.ukuranFont || 12) - 4), after: 4, noIndent: true });
  return out;
}
// Geser seluruh badan surat (penerima, salam, isi, penutup) ke kanan, seperti surat sekolah/instansi bergaya menjorok.
function bungkusBadan(arr, BD) {
  const ki = Math.min(80, Math.max(0, +BD.kiri || 0)); const ka = Math.min(60, Math.max(0, +BD.kanan || 0));
  if (!arr.length || (!ki && !ka)) return arr;
  return [{ type: 'indent', kiri: ki * 72 / 25.4, kanan: ka * 72 / 25.4, blocks: arr }];
}
// Penulisan "di Tempat": kecil, Di Tempat, DI TEMPAT, - Ditempat, atau dua baris (Di / TEMPAT) seperti surat dinas.
export const TEMPAT_GAYA = { di: 'di Tempat', Di: 'Di Tempat', DI: 'DI TEMPAT', strip: '- Ditempat', vertikal: 'Di / TEMPAT', vertikal2: 'Di / Tempat', vertikal3: 'Di / Tempat (tebal semua)', asli: 'Sesuai isian' };
export function tulisTempat(txt, gaya = 'di') {
  txt = String(txt || '').trim();
  if (!txt) return { baris: '' };
  const m = /^[-\u2013\s]*di\s*(.*)$/i.exec(txt);
  if (!m || gaya === 'asli') return { baris: txt };
  const t = m[1].trim(); const cap = t ? t[0].toUpperCase() + t.slice(1).toLowerCase() : t;
  switch (gaya) {
    case 'Di': return { baris: ('Di ' + (t === t.toLowerCase() || t === t.toUpperCase() ? cap : t)).trim() };
    case 'DI': return { baris: ('DI ' + t.toUpperCase()).trim() };
    case 'strip': return { baris: t.toLowerCase() === 'tempat' ? '- Ditempat' : ('- Di ' + t) };
    case 'vertikal': return t ? { baris: 'Di', bawahTempat: t.toUpperCase(), tebal: true } : { baris: txt };
    case 'vertikal3': return t ? { baris: 'Di', bawahTempat: (t === t.toLowerCase() || t === t.toUpperCase() ? cap : t), tebal: true, diTebal: true } : { baris: txt };
    case 'vertikal2': return t ? { baris: 'Di', bawahTempat: (t === t.toLowerCase() || t === t.toUpperCase() ? cap : t), tebal: false } : { baris: txt };
    default: return { baris: ('di ' + t).trim() };
  }
}
// Gaya per blok (ukuran, warna, spasi, font) yang dapat diatur pengguna.
const JARAK = { tanpa: 0, rapat: 3, lebar: 14, sangat_lebar: 22 };
const warnaOk = (c) => (/^#[0-9a-fA-F]{6}$/.test(c || '') && c.toLowerCase() !== '#000000' ? c : undefined);
function gayaBlok(b, set, bawaanAfter = null) {
  const sz = b.size ? Math.min(30, Math.max(7, +b.size || 0)) || undefined : undefined;
  const dasar = bawaanAfter ?? (set.jarakParagraf ?? 7);
  const after = b.jarak && JARAK[b.jarak] !== undefined ? JARAK[b.jarak] : dasar;
  return { size: sz, after, before: Math.min(60, Math.max(0, +b.jarakAtas || 0)), color: warnaOk(b.color), spasi: b.spasi ? Math.min(3, Math.max(1, +b.spasi)) : undefined, f: b.f && ['t', 's', 'm'].includes(b.f) ? b.f : undefined };
}
const dasarRun = (b, g) => ({ ...(b.bold ? { b: true } : {}), ...(g.f ? { f: g.f } : {}) });

function bangunBlok(b, ctx, o) {
  const { align, dok, set } = o;
  const soft = b.optionalVars || [];
  if (soft.length && soft.some((k) => kosong(ctx, k))) {
    if (!b.alt) return null;
  }
  const useAlt = soft.length && soft.some((k) => kosong(ctx, k)) && b.alt;
  const ukIndent = set.indentUkuran ?? 36;
  switch (b.type) {
    case 'pb': return { type: 'pb' };
    case 'p': {
      const txt = useAlt ? b.alt : b.text;
      if (!String(txt || '').trim()) return null;
      const g = gayaBlok(b, set);
      const runs = jadiRuns(sub(txt, ctx, b.fmt, false, true), dasarRun(b, g));
      const pendek = runs.map((r) => r.text).join('').length < 45;
      const al = align(b.align || 'justify');
      const mode = b.indentMode || 'auto';
      const indent = mode === 'ya' ? ukIndent : (mode === 'auto' && !dok && (al === 'justify' || al === 'left') && !pendek && set.indentParagraf !== false && !b.bold && !b.noIndent ? ukIndent : 0);
      return { type: 'p', runs, align: al, after: g.after, before: g.before, size: g.size, color: g.color, spasi: g.spasi, noIndent: mode === 'tidak' || !!b.noIndent, indent };
    }
    case 'h': {
      const t = b.optionalTable ? (barisTerisi(ctx.letter.fields[b.optionalTable], (ctx.letter.tpl.fields.find((f) => f.key === b.optionalTable) || { columns: [] }).columns).length ? b.text : null) : b.text;
      if (!t) return null;
      const g = gayaBlok(b, set, 5);
      return { type: 'p', runs: jadiRuns(sub(t, ctx, b.fmt, true), { b: b.bold !== false, ...(g.f ? { f: g.f } : {}) }), align: b.align || 'left', before: g.before || 4, after: g.after, size: g.size, color: g.color, spasi: g.spasi, keepNext: true };
    }
    case 'ol': case 'ul': {
      const g = gayaBlok(b, set);
      const items = pecahBaris(sub(b.text, ctx, null, true).replaceAll(MISS_A, '').replaceAll(MISS_B, '')).map((t) => jadiRuns(safe(t.replaceAll(STAR, '*').replaceAll(PLUS, '+')), g.f ? { f: g.f } : {}));
      if (!items.length) return null;
      const mode = b.indentMode || 'auto';
      return { type: 'list', ordered: b.type === 'ol', items, indent: mode === 'tidak' ? 0 : (mode === 'ya' ? ukIndent : (dok ? 0 : ukIndent)), hang: 18, after: g.after, before: g.before, size: g.size, color: g.color, spasi: g.spasi, align: align(b.align || 'justify') };
    }
    case 'ar': {
      const m = set.margin || {}; const lebar = (210 - (m.kiri ?? 25) - (m.kanan ?? 20)) * 72 / 25.4;
      const g = arabGambar(b.text, Math.min(48, Math.max(10, +b.size || 20)), { warna: b.color || '#000000', tebal: !!b.bold, lebarMaks: lebar });
      if (!g) return null;
      return { type: 'arab', gambar: g, align: b.align || 'center', before: b.jarakAtas !== undefined && b.jarakAtas !== '' ? +b.jarakAtas || 0 : 6, after: b.jarak === 'tanpa' ? 0 : 8 };
    }
    case 'sp': return { type: 'spacer', h: Math.min(120, Math.max(2, +b.tinggi || 8)) };
    case 'kv': {
      const rows = [];
      const defs = Array.isArray(b.rows) && b.rows.length ? b.rows.map((r) => R(r.label || '', r.tpl || '', !!r.opt, r.fmt)) : kvRows(b.ref, ctx.letter.tpl);
      for (const r of defs) {
        const vs = varsDi(r.tpl);
        if (r.opt && vs.length && kosong(ctx, vs[0])) continue;
        rows.push({ label: r.label, runs: jadiRuns(sub(r.tpl, ctx, r.fmt || null)) });
      }
      if (!rows.length) return null;
      return { type: 'kv', rows, indent: b.indentMode === 'tidak' ? 0 : (dok ? 0 : ukIndent), labelMin: 90, after: b.jarak && JARAK[b.jarak] !== undefined ? JARAK[b.jarak] : 8 };
    }
    case 'table': {
      const fld = ctx.letter.tpl.fields.find((f) => f.key === b.ref);
      if (!fld) return null;
      const t = buatTabel(fld, ctx);
      if (!t) return null;
      return [...(b.title ? [{ type: 'p', runs: jadiRuns(safe(b.title)), align: 'left', bold: true, after: 3 }] : []), { ...t, after: 9 }];
    }
    case 'tabelbebas': {
      const kol = (b.kolom || []).filter((k) => k && k.label);
      if (!kol.length) return null;
      const ada = b.nomor !== false; const tcols = [];
      if (ada) tcols.push({ w: 0.55, align: 'center', label: 'No' });
      for (const k of kol) tcols.push({ w: +k.w || 2, align: 'left', label: safe(k.label) });
      const data = b.baris || []; const n = Math.min(200, Math.max(data.length, +b.jmlBaris || 0));
      const rows = Array.from({ length: n }, (_, i) => [...(ada ? [String(i + 1)] : []), ...kol.map((_k, j) => safe((data[i] || [])[j] || ''))]);
      return [...(b.judul ? [{ type: 'p', runs: jadiRuns(safe(b.judul)), align: 'left', bold: true, after: 3 }] : []),
        { type: 'table', cols: tcols, header: tcols.map((c) => c.label), rows, minRowH: Math.min(80, Math.max(14, +b.tinggiBaris || 24)), boldRows: [], after: 9 }];
    }
    case 'saldo': {
      const masuk = ctx.totals.pemasukan || 0; const keluar = ctx.totals.pengeluaran || 0;
      const awal = b.awal ? parseMoney(ctx.letter.fields.saldo_awal) : 0;
      const rows = [];
      if (b.awal) rows.push(['Saldo awal', fmtAngka(awal)]);
      rows.push(['Total pemasukan', fmtAngka(masuk)], ['Total pengeluaran', fmtAngka(keluar)], [b.awal ? 'Saldo akhir' : 'Saldo (sisa dana)', fmtAngka(awal + masuk - keluar)]);
      return { type: 'table', cols: [{ w: 5.55, align: 'left' }, { w: 2.2, align: 'right' }], header: null, rows, boldRows: [rows.length - 1], minRowH: 17, after: 9, width: 0.75 };
    }
    case 'jadwal': {
      const F = ctx.letter.fields;
      const f1 = (iso) => (iso ? `${hariDari(iso)}, ${fmtTanggal(iso, ctx.letter.snap.set.formatTanggal)}` : '');
      const rowsAll = [['Hari/Tanggal', f1(F.tgl_lama), f1(F.tgl_baru)], ['Waktu', F.jam_lama ? `${fmtJam(F.jam_lama)} ${ctx.letter.snap.set.zona}` : '', F.jam_baru ? `${fmtJam(F.jam_baru)} ${ctx.letter.snap.set.zona}` : ''], ['Tempat', F.tempat_lama || '', F.tempat_baru || '']];
      const rows = rowsAll.filter((r) => r[1] || r[2]).map((r) => r.map((c) => safe(c || '-')));
      if (!rows.length) return null;
      return { type: 'table', cols: [{ w: 1.8, align: 'left' }, { w: 3, align: 'left' }, { w: 3, align: 'left' }], header: ['', 'Semula', 'Perubahan'], rows, minRowH: 17, after: 9 };
    }
    default: return null;
  }
}

export const PENGANTAR_TTD = ['', 'Hormat kami,', 'Hormat saya,', 'Mengetahui,', 'Menyetujui,', 'Atas nama', 'Yang membuat pernyataan,', 'Yang menerangkan,'];
export const POSISI = { kiri: 0, tengah: 1, kanan: 2 };
// Pesan bila dua penandatangan menempati posisi yang sama pada satu baris.
export function masalahTtd(signers) {
  const out = []; const dipakai = new Map();
  for (const s of signers || []) {
    const k = `${Math.max(1, Math.min(4, +s.baris || 1))}|${s.posisi || 'kanan'}`;
    if (dipakai.has(k)) out.push(`Penandatangan "${s.jabatan || s.role}" dan "${dipakai.get(k)}" menempati posisi yang sama (baris ${k.split('|')[0]}, ${k.split('|')[1]}). Ubah posisi atau baris.`);
    else dipakai.set(k, s.jabatan || s.role);
  }
  return out;
}

// Lebar kolom (pecahan lebar teks) menurut jumlah orang dan pengaturan jarak.
function lebarSlot(posisiAda, jarak) {
  const n = posisiAda.length;
  const j = { rapat: 0, normal: 1, lebar: 2 }[jarak] ?? 1;
  if (n === 1) return [0.46, 0.42, 0.38][j];
  if (n === 2) return posisiAda.includes(0) && posisiAda.includes(2) ? [0.44, 0.4, 0.34][j] : [0.34, 0.3, 0.27][j];
  return [0.32, 0.3, 0.27][j];
}
// Baris kolom pada grid tiga posisi (kiri/tengah/kanan): -> { widths, cols }.
function gridKolom(items, s) {
  const xs = (p) => (p === 0 ? 0 : p === 1 ? (1 - s) / 2 : 1 - s);
  const urut = [...items].sort((a, b) => a.pos - b.pos);
  const widths = []; const cols = []; let kursor = 0;
  for (const it of urut) {
    const x = xs(it.pos);
    if (x - kursor > 0.001) { widths.push(x - kursor); cols.push([]); }
    widths.push(s); cols.push(it.blocks); kursor = x + s;
  }
  if (1 - kursor > 0.001) { widths.push(1 - kursor); cols.push([]); }
  return { widths, cols };
}

function buatTandaTangan(letter, ctx, barisTanggal, modeTgl) {
  const sg = letter.signers || [];
  if (!sg.length) return null;
  const set = letter.snap.set; const org = letter.snap.org;
  const T = { ...DEFAULT_TTD, ...(letter.ttd || {}) };
  const GY = merge(DEFAULT_TTD.gaya, (letter.ttd || {}).gaya);
  const dasar = (k) => ({ ...(GY[k].b ? { b: true } : {}), ...(GY[k].i ? { i: true } : {}), ...(warnaOk(GY[k].color) ? { color: GY[k].color } : {}), ...(['t', 's', 'm'].includes(GY[k].f) ? { f: GY[k].f } : {}) });
  const ukr = (k) => (GY[k].size > 0 ? { size: Math.min(24, Math.max(7, +GY[k].size)) } : {});
  const modeT = T.susunan || null;
  const pengEf = modeT ? (modeT.includes('hormat') ? T.pengantar : '') : T.pengantar;
  const instEf = modeT ? modeT.includes('org') : !!T.instansi;
  const orgUmum = String(T.orgTeks || '').trim().replaceAll('{{nama_organisasi}}', namaOrgSatuBaris(org));
  const fam = set.font || 't'; const sz = set.ukuranFont;
  const mm = (x) => x * 72 / 25.4;
  const contentW = mm(210) - mm(set.margin.kiri) - mm(set.margin.kanan);
  const ruang = T.ruang ?? set.ruangTtd ?? 62;
  const namaOrgBaris = org.nama ? bersihkan(org.nama).split('\n').map((x) => x.trim()).filter(Boolean).join(' ') : '';
  const jmlBaris = (txt, lebar, bold, k) => String(txt || '').split('\n').reduce((a, t) => a + (t.trim() ? Math.max(1, wrap([{ text: t, b: bold, f: (GY[k] && ['t', 's', 'm'].includes(GY[k].f)) ? GY[k].f : fam }], { width: lebar, size: (GY[k] && GY[k].size > 0) ? Math.min(24, Math.max(7, +GY[k].size)) : sz, align: 'center', fam }).length) : 1), 0);

  // kelompokkan per baris
  const barisMap = new Map();
  sg.forEach((s) => { const k = Math.max(1, Math.min(4, +s.baris || 1)); if (!barisMap.has(k)) barisMap.set(k, []); barisMap.get(k).push(s); });
  const keBaris = [...barisMap.keys()].sort((a, b) => a - b).map((k) => barisMap.get(k));
  const pusat = (runs, extra = {}) => ({ type: 'p', runs, align: T.rata === 'left' ? 'left' : 'center', after: 0, ttdLine: true, ...extra });
  const kosongP = () => ({ type: 'p', runs: [{ text: ' ' }], align: 'center', after: 0, ttdLine: true });

  // Kota dan tanggal penandatanganan: satu kali saja, di atas atau di bawah penandatangan yang dipilih (bawaan: paling kanan).
  const idxT = T.tglSigner !== undefined && T.tglSigner !== '' && T.tglSigner !== 'auto' && +T.tglSigner >= 0 && +T.tglSigner < sg.length ? +T.tglSigner : -1;
  let tglBaris = modeTgl === 'bawah' ? keBaris.length - 1 : 0; let tglPos = null;
  if (idxT >= 0) { const st = sg[idxT]; tglBaris = Math.max(0, keBaris.findIndex((r) => r.includes(st))); tglPos = POSISI[st.posisi] ?? 2; }
  else tglPos = Math.max(...keBaris[tglBaris].map((st) => POSISI[st.posisi] ?? 2));
  const blokTanggal = (after, before = 0) => {
    const rt = ['left', 'center', 'right'].includes(T.tglRata) ? T.tglRata : 'left';
    const g = gridKolom([{ pos: tglPos, blocks: barisTanggal.map((t) => ({ type: 'p', runs: jadiRuns(safe(t), dasar('tanggal')), align: rt, after: 0, before: 0, ttdLine: true, ...ukr('tanggal') })) }], lebarSlot([tglPos], T.jarak));
    return { type: 'cols', widths: g.widths, gap: 0, cols: g.cols, keepTogether: true, after, before };
  };
  const out = [];
  keBaris.forEach((row, ri) => {
    const posAda = row.map((s) => POSISI[s.posisi] ?? 2);
    const slot = lebarSlot(posAda, T.jarak);
    const lebar = slot * contentW;
    // baris-baris di atas nama untuk setiap penandatangan
    const atas = row.map((s) => {
      const L = [];
      const peng = (s.pengantar || '').trim();
      if (peng) L.push({ txt: peng, k: 'pengantar' });
      const adaOrgAda = row.some((x) => (x.org || '').trim());
      if (instEf || adaOrgAda) { const o = (s.org || '').trim() || (instEf ? (orgUmum || namaOrgSatuBaris(org)) : ''); if (o) L.push({ txt: o, k: 'instansi' }); else if (adaOrgAda || instEf) L.push({ txt: '', k: 'instansi' }); }
      if ((s.tambahAtas || '').trim()) L.push({ txt: s.tambahAtas.trim(), k: 'ket' });
      if (T.jabatan !== false && (s.jabatan || '').trim()) L.push({ txt: s.jabatan.trim(), k: 'jabatan' });
      return L;
    });
    const hitung = (L) => L.reduce((a, l) => a + (l.txt ? jmlBaris(l.txt, lebar, GY[l.k].b, l.k) : 1), 0);
    const maks = Math.max(...atas.map(hitung), 0);
    const ketTeks = (s) => [(s.ket || '').trim(), (s.tambahBawah || '').trim()].filter(Boolean).join('\n');
    const adaKet = row.some((s) => ketTeks(s));
    const ketBaris = Math.max(0, ...row.map((s) => (ketTeks(s) ? jmlBaris(ketTeks(s), lebar, GY.ket.b, 'ket') : 0)));
    const items = row.map((s, i) => {
      const ar = [];
      for (const l of atas[i]) ar.push(l.txt ? pusat(jadiRuns(safe(l.txt), dasar(l.k)), ukr(l.k)) : kosongP());
      for (let n = hitung(atas[i]); n < maks; n++) ar.push(kosongP());
      const nm = (s.nama || '').trim() || namaOtomatis(org, s.role, ctx.vars, s) || '';
      if (!nm) ctx.hilangTtd = (ctx.hilangTtd || []).concat(s.jabatan || s.role);
      const gam = (o, u, x, y) => (o ? { dataUrl: o.dataUrl, mime: o.mime, w: o.w, h: o.h, ukuran: +u || 100, gx: +x || 0, gy: +y || 0 } : null);
      const gambar = letter.ttdGambar ? gam(s.gambar, s.gUkuran, s.gX, s.gY) : null;
      const stempel = letter.ttdGambar ? gam(s.stempel, s.sUkuran, s.sX, s.sY) : null;
      if (T.jarakJabatan > 0) ar.push({ type: 'spacer', h: T.jarakJabatan });
      ar.push({ type: 'ttdspace', h: ruang, gambar, stempel });
      if (T.jarakNama > 0) ar.push({ type: 'spacer', h: T.jarakNama });
      ar.push(pusat(nm ? jadiRuns(safe(nm), { ...dasar('nama'), ...(T.garisNama !== false ? { u: true } : {}) }) : jadiRuns(MISS_A + '(' + TITIK + ')' + MISS_B), { nama: true, ...ukr('nama') }));
      if (adaKet) { const k = ketTeks(s); if (k) ar.push(pusat(jadiRuns(safe(k), dasar('ket')), ukr('ket'))); for (let n = k ? jmlBaris(k, lebar, GY.ket.b, 'ket') : 0; n < ketBaris; n++) ar.push(kosongP()); }
      return { pos: POSISI[s.posisi] ?? 2, blocks: ar };
    });
    const { widths, cols } = gridKolom(items, slot);
    if (modeTgl === 'ttd' && ri === tglBaris) out.push(blokTanggal(2));
    if (ri === 0) {
      const peng = (pengEf || '').trim();
      if (peng) {
        const pos = T.pengantarPosisi && T.pengantarPosisi !== 'auto' ? POSISI[T.pengantarPosisi] : (new Set(posAda).size === 1 ? posAda[0] : 1);
        const g = gridKolom([{ pos, blocks: [pusat(runsOf(peng, ctx, dasar('pengantar')), { align: ['left', 'right', 'center'].includes(T.pengantarRata) ? T.pengantarRata : 'center', ...ukr('pengantar') })] }], lebarSlot([pos], T.jarak));
        out.push({ type: 'cols', widths: g.widths, gap: 0, cols: g.cols, keepTogether: true, after: Math.max(0, +T.pengantarJarak || 0) });
      }
    }
    out.push({ type: 'cols', widths, gap: 0, cols, keepTogether: true, after: ri < keBaris.length - 1 ? 10 : 6, align: 'top' });
    if (modeTgl === 'bawah' && ri === tglBaris) out.push(blokTanggal(ri < keBaris.length - 1 ? 8 : 4));
  });
  return out;
}

// ---------- Pemeriksaan ----------
export function periksa(letter, nomorTampil, { nomorDuplikat = false } = {}) {
  const tpl = letter.tpl; const set = letter.snap.set;
  const { doc, ctx } = susunDokumen(letter, { nomorTampil });
  const wajib = []; const saran = [];
  const F = letter.fields;
  const kosongF = (f) => (f.type === 'table' ? barisTerisi(F[f.key], f.columns).length === 0 : !String(F[f.key] ?? '').trim());
  for (const f of allFields(tpl)) {
    if (f.required && kosongF(f)) wajib.push({ msg: `${f.label} belum diisi.`, field: f.key });
    if (f.type === 'date' && F[f.key] && !parseISO(F[f.key])) wajib.push({ msg: `${f.label} tidak valid.`, field: f.key });
  }
  if (tpl.groups?.penerima && (tpl.header || 'standar') === 'standar' && !String(F.nama_penerima || '').trim() && !String(F.jabatan_penerima || '').trim()) wajib.push({ msg: 'Nama atau jabatan penerima surat belum diisi.', field: 'jabatan_penerima' });
  if (tpl.groups?.identitas && tpl.kind !== 'dokumen' && letter.nomorMode === 'manual' && !tpl.tanpaNomor && !(letter.nomor || '').trim()) wajib.push({ msg: 'Nomor surat manual belum diisi.', field: 'nomor' });
  if (nomorDuplikat) wajib.push({ msg: 'Nomor surat ini sudah pernah dipakai pada surat lain.', field: 'nomor' });
  for (const m of masalahTtd(letter.signers)) wajib.push({ msg: m, field: 'signers' });
  for (const n of ctx.hilangTtd || []) wajib.push({ msg: `Nama penandatangan "${n}" belum diisi.`, field: 'signers' });
  for (const k of ctx.hilang) {
    const base = k.replace(/_upper$/, '');
    if (['nomor_surat', 'jabatan_penerima'].includes(base)) continue;
    const lab = labelVar(tpl, k);
    if (!wajib.some((w) => w.msg.startsWith(lab + ' '))) wajib.push({ msg: `Data "${lab}" dipakai di isi surat tetapi belum diisi.`, field: base });
  }
  for (const k of ctx.tidakDikenal) saran.push({ msg: `Variabel {{${k}}} tidak dikenal dan ditampilkan sebagai titik-titik.` });
  if (letter.kop === 'logo') {
    const hilangKiri = letter.logoKiri && letter.logoKiri !== 'none' && !letter.snap.logos[letter.logoKiri];
    const hilangKanan = letter.logoKanan && letter.logoKanan !== 'none' && !letter.snap.logos[letter.logoKanan];
    if (hilangKiri || hilangKanan) saran.push({ msg: 'Logo belum diunggah (Data Organisasi). Kop akan dicetak tanpa gambar logo pada sisi yang kosong. Pilih "Kop tanpa logo" bila memang tidak memakai logo.' });
  }
  if (letter.kop !== 'none' && !String(letter.snap.org.nama || '').trim()) saran.push({ msg: 'Nama instansi/organisasi belum diisi pada Data Organisasi, sehingga kop surat kosong.' });
  if (letter.ttdGambar && letter.signers.some((s) => !s.gambar)) saran.push({ msg: 'Opsi gambar tanda tangan aktif, tetapi sebagian penandatangan belum punya gambar. Ruang tanda tangan manual tetap disediakan.' });
  if (doc.tidakDidukung) saran.push({ msg: 'Ada huruf yang tidak didukung font PDF (misalnya huruf Arab di dalam paragraf). Huruf tersebut diganti tanda "?". Untuk teks Arab, pakai blok "Teks Arab" pada isi surat.' });
  if (doc.dekor?.model && DEKOR[doc.dekor.model]) {
    try {
      const hal = tabrakDekor(doc);
      if (hal.length) saran.push({ msg: `Teks isi surat bersinggungan dengan dekorasi halaman (halaman ${hal.join(', ')}). Perbesar margin pada bagian yang tertutup, ganti model dekorasi, atau pilih dekorasi hanya di halaman pertama.` });
    } catch (e) { /* pemeriksaan tambahan; abaikan bila font belum siap */ }
  }
  const salam = set.salam;
  return { wajib, saran, doc, ctx, salam };
}

export function daftarTemplate(custom, tersembunyi) {
  const sembunyi = new Set(tersembunyi || []);
  const overrides = new Map((custom || []).filter((t) => t.baseId).map((t) => [t.baseId, t]));
  const hasil = [];
  for (const b of BUILTIN) {
    if (sembunyi.has(b.id)) continue;
    hasil.push(overrides.has(b.id) ? { ...overrides.get(b.id), builtin: true, override: true } : b);
  }
  for (const t of custom || []) if (!t.baseId) hasil.push({ ...t, builtin: false });
  return hasil;
}
export { KATEGORI };

// Halaman yang teksnya menyentuh bentuk dekorasi (poligon dalam mm; teks dalam pt).
function tabrakDekor(doc) {
  const D = DEKOR[doc.dekor.model]; const bentuk = D.bentuk('#000', '#000');
  const k = 25.4 / 72; const dy = (doc.paper.hmm || 297) - 297;
  const polys = bentuk.map((b) => b.p.map(([x, y]) => [x, y > 200 ? y + dy : y]));
  const di = (px, py) => polys.some((p) => { let in_ = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, yi] = p[i], [xj, yj] = p[j]; if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) in_ = !in_; } return in_; });
  const { pages } = tataLetak(doc); const kena = [];
  pages.forEach((pg, i) => {
    if (i > 0 && !doc.dekor.semua) return;
    const ada = pg.prims.some((p) => {
      if (p.t !== 'text' || p.bg || p.nomorHal || !String(p.text || '').trim()) return false;
      const w = tw(p.text, { f: p.f, b: p.b, i: p.i }, p.size);
      const x0 = p.x * k, x1 = (p.x + w) * k, y0 = (p.y - p.size * 0.75) * k, y1 = (p.y + p.size * 0.2) * k;
      for (let x = x0; x <= x1 + 0.01; x += Math.max(1, (x1 - x0) / 6)) for (const y of [y0, (y0 + y1) / 2, y1]) if (di(x, y)) return true;
      return false;
    });
    if (ada) kena.push(i + 1);
  });
  return kena;
}
