// Surat massal: satu surat dibuat berkali-kali dari daftar (CSV / tempel dari Excel). Tiap baris mengganti isian yang namanya cocok.
import { PDFDocument } from 'pdf-lib';
import { h, download, namaBerkas } from './util.js';
import { allFields } from './compose.js';
import { btn, modal, toast } from './ui.js';

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const ALIAS = { nama: 'nama_penerima', penerima: 'nama_penerima', namapenerima: 'nama_penerima', jabatan: 'jabatan_penerima', instansi: 'instansi_penerima', alamat: 'alamat_penerima', kota: 'kota_tujuan', tempat: 'kota_tujuan', nomorsurat: 'nomor', no: 'nomor' };
export const MAKS = 300;

// Pisahkan teks menjadi baris dan kolom; pemisah (tab, titik koma, atau koma) dikenali otomatis; tanda kutip ganda didukung.
export function uraiTabel(teks) {
  const t = String(teks || '').replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const baris1 = t.split('\n').find((x) => x.trim()) || '';
  const sep = [['\t', 0], [';', 0], [',', 0]].map(([c]) => [c, baris1.split(c).length]).sort((a, b) => b[1] - a[1])[0][0];
  const rows = []; let row = []; let cur = ''; let q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === sep) { row.push(cur); cur = ''; }
    else if (c === '\n') { row.push(cur); cur = ''; if (row.some((x) => x.trim())) rows.push(row.map((x) => x.trim())); row = []; }
    else cur += c;
  }
  row.push(cur); if (row.some((x) => x.trim())) rows.push(row.map((x) => x.trim()));
  return rows;
}

// Cocokkan judul kolom dengan isian surat (nama kunci, label, atau singkatan umum).
export function petaKolom(tpl, header) {
  const fields = allFields(tpl).filter((f) => f.type !== 'table');
  const idx = new Map(); for (const f of fields) { idx.set(norm(f.key), f.key); idx.set(norm(f.label), f.key); }
  const hasil = header.map((hd) => {
    const n = norm(hd); if (!n) return null;
    if (n === 'nomor' || n === 'nomorsurat' || n === 'no') return 'nomor';
    const k = idx.get(n) || (ALIAS[n] && (ALIAS[n] === 'nomor' ? 'nomor' : (fields.some((f) => f.key === ALIAS[n]) ? ALIAS[n] : null)));
    return k || null;
  });
  return hasil;
}

export function buatDaftar(tpl, rows) {
  if (rows.length < 2) return { peta: [], data: [], header: rows[0] || [] };
  const header = rows[0]; const peta = petaKolom(tpl, header);
  const data = rows.slice(1).map((r) => { const o = {}; peta.forEach((k, i) => { if (k && r[i] != null && r[i] !== '') o[k] = r[i]; }); return o; });
  return { header, peta, data };
}

export function suratBaris(L, o) {
  const { nomor, ...isi } = o;
  return { ...L, fields: { ...L.fields, ...isi }, nomor: nomor || L.nomor };
}

async function gabungPdf(daftarBytes) {
  const out = await PDFDocument.create(); out.setCreator('SURATKU'); out.setProducer('SURATKU');
  for (const b of daftarBytes) { const d = await PDFDocument.load(b); const ps = await out.copyPages(d, d.getPageIndices()); ps.forEach((p) => out.addPage(p)); }
  return out.save();
}

export function bukaMassal(L, { susun, layout, buatPdf, nomorTampil }) {
  const tpl = L.tpl; let info = { header: [], peta: [], data: [] };
  const ta = h('textarea', { class: 'inp', rows: 7, placeholder: 'nama_penerima\tjabatan_penerima\talamat_penerima\nBapak H. Ahmad\tKetua RW 03\tDk. Ringin\nIbu Siti\tKetua RT 01\tDk. Ringin', 'aria-label': 'Daftar penerima', style: { fontFamily: 'monospace', fontSize: '.8rem', width: '100%' } });
  const ringkas = h('div', { class: 'small', style: { margin: '10px 0' } });
  const tombol = h('div', { class: 'row' });
  const proses = h('div', { class: 'small muted', 'aria-live': 'polite' });
  const kolomOk = () => info.peta.some(Boolean);
  const segarkan = () => {
    info = buatDaftar(tpl, uraiTabel(ta.value));
    ringkas.replaceChildren();
    if (!info.header.length) { ringkas.append(h('span', { class: 'muted' }, 'Tempel daftar dari Excel/Sheets atau pilih berkas CSV. Baris pertama = judul kolom.')); tombol.replaceChildren(); return; }
    const ok = info.header.filter((_, i) => info.peta[i]); const tak = info.header.filter((hd, i) => hd && !info.peta[i]);
    ringkas.append(h('div', null, h('b', null, `${info.data.length} surat`), ` — kolom dipakai: ${ok.length ? ok.map((x) => `"${x}"`).join(', ') : 'tidak ada'}.`));
    if (tak.length) ringkas.append(h('div', { class: 'muted' }, `Kolom tidak dikenali dan diabaikan: ${tak.map((x) => `"${x}"`).join(', ')}.`));
    if (info.data.length > MAKS) ringkas.append(h('div', { style: { color: 'var(--danger)' } }, `Maksimal ${MAKS} surat sekali proses.`));
    if (!kolomOk()) ringkas.append(h('div', { style: { color: 'var(--danger)' } }, 'Tidak ada judul kolom yang cocok dengan isian surat. Pakai nama seperti: nama_penerima, jabatan_penerima, alamat_penerima, kota_tujuan, atau nomor.'));
    tombol.replaceChildren(btn(`Unduh ${info.data.length} surat dalam satu PDF`, { icon: 'download', kind: 'primary', onClick: unduh }));
  };
  ta.addEventListener('input', segarkan);
  const berkas = h('input', { type: 'file', accept: '.csv,.tsv,.txt,text/csv,text/plain', class: 'sr', 'aria-label': 'Pilih berkas daftar', onchange: async (e) => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; if (f.size > 2 * 1024 * 1024) { toast('Berkas terlalu besar.', 'err'); return; } ta.value = await f.text(); segarkan(); } });
  let sibuk = false;
  async function unduh() {
    if (sibuk || !kolomOk() || !info.data.length || info.data.length > MAKS) return; sibuk = true;
    try {
      const bytes = [];
      for (let i = 0; i < info.data.length; i++) {
        proses.textContent = `Menyusun surat ${i + 1} dari ${info.data.length}…`; await new Promise((r) => setTimeout(r));
        const Li = suratBaris(L, info.data[i]); const { doc } = susun(Li, { nomorTampil: Li.nomor || nomorTampil() });
        bytes.push(await buatPdf(layout(doc), { judul: tpl.nama }));
      }
      proses.textContent = 'Menggabungkan PDF…'; const gab = await gabungPdf(bytes);
      download(new Blob([gab], { type: 'application/pdf' }), namaBerkas([tpl.nama.replace(/^Surat\s+/i, ''), 'massal', info.data.length + ' surat'], 'pdf'));
      proses.textContent = ''; toast(`${info.data.length} surat dalam satu PDF diunduh.`);
    } catch (e) { console.error(e); proses.textContent = ''; toast('Surat massal gagal: ' + e.message, 'err', 7000); } finally { sibuk = false; }
  }
  const kunci = allFields(tpl).filter((f) => f.type !== 'table' && f.group !== 'identitas').slice(0, 10).map((f) => f.key);
  const body = h('div', null,
    h('p', { class: 'hint' }, 'Buat satu surat untuk banyak penerima. Isi surat, kop, dan tanda tangan diambil dari surat yang sedang dibuka. Tiap baris daftar mengganti isian yang judul kolomnya cocok, lalu semuanya digabung dalam satu PDF (tiap surat mulai di halaman baru).'),
    h('p', { class: 'hint' }, 'Judul kolom yang dikenali pada surat ini: ', h('code', null, [...new Set(['nama_penerima', 'jabatan_penerima', 'alamat_penerima', 'kota_tujuan', ...kunci, 'nomor'])].join(', ')), '. Kolom "nomor" opsional; bila tidak ada, semua surat memakai nomor yang sama dengan surat ini.'),
    h('div', { class: 'row', style: { marginBottom: '8px' } }, btn('Pilih berkas CSV…', { icon: 'upload', kind: 'sm', onClick: () => berkas.click() }), berkas),
    ta, ringkas, tombol, proses);
  modal({ title: 'Surat massal dari daftar', body, wide: true, actions: [{ label: 'Tutup', kind: 'primary' }] });
}
