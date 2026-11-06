// Kelola template: pakai, ubah, gandakan, hapus, favorit, pulihkan bawaan, unduh dokumen kosong.
import { h, uid, clone, slug, download } from './util.js';
import { ikon, btn, toast, konfirmasi, kolom, seksi, kosongPesan, modal, tanya } from './ui.js';
import { semuaTemplate, simpanTemplate, hapusTemplateKustom, toggleFavorit, sembunyikanBawaan, pulihkanBawaan, templatBawaan, templatById, templatKustom } from './store.js';
import { KATEGORI, buatSurat, daftarPeran, masalahTtd, PENGANTAR_TTD, posisiDefault } from './compose.js';
import { panelKop, cek } from './kop-ui.js';
import { panelFormat } from './format-ui.js';
import { editorBlok } from './blocks.js';
import * as Org from './org.js';
import { bangunBerkas, nama_berkas_surat } from './v-editor.js';
import { kvGet } from './db.js';
import { pergi } from './app.js';

const bersih = (t) => { const c = clone({ ...t }); delete c.builtin; delete c.favorite; delete c.override; return c; };

export async function viewTemplat(root) {
  let tpls = await semuaTemplate();
  const sembunyi = (await kvGet('tplSembunyi', [])) || [];
  let q = ''; let kat = '';
  const hasil = h('div');
  const lolos = (t) => (!kat || t.kategori === kat) && (!q || `${t.nama} ${t.kata || ''} ${KATEGORI[t.kategori]?.nama || ''}`.toLowerCase().includes(q.toLowerCase()));

  async function muat() { tpls = await semuaTemplate(); gambar(); }
  async function kosongkan(t, jenis) {
    try {
      const org = Org.getOrg();
      const L = buatSurat(t, org, Org.getSettings(), Org.getLogos());
      L.signers.forEach((s) => { s.nama = org[s.role] || ''; });
      const { blob } = await bangunBerkas(L, jenis, { nomor: '' });
      download(blob, `Template_${slug(t.nama, '_')}.${jenis}`);
      toast('Dokumen kosong diunduh.');
    } catch (e) { console.error(e); toast('Gagal membuat dokumen kosong: ' + e.message, 'err'); }
  }
  function menuUnduh(t) {
    modal({ title: 'Unduh dokumen kosong', body: h('p', null, `Dokumen kosong berdasarkan "${t.nama}". Bagian yang belum terisi tampil sebagai titik-titik.`), actions: [
      { label: 'PDF', icon: 'file', onClick: () => kosongkan(t, 'pdf') }, { label: 'Word (.docx)', icon: 'word', kind: 'primary', onClick: () => kosongkan(t, 'docx') }] });
  }
  async function hapus(t) {
    if (t.builtin) {
      if (t.override) { if (await konfirmasi(`Kembalikan "${t.nama}" ke versi bawaan? Perubahan Anda pada template ini akan hilang. Surat yang sudah dibuat tidak berubah.`, { ok: 'Pulihkan bawaan' })) { await pulihkanBawaan(t.id); toast('Template dikembalikan ke versi bawaan.'); muat(); } }
      else if (await konfirmasi(`Sembunyikan template bawaan "${t.nama}" dari daftar? Anda dapat memulihkannya kapan saja dari bagian "Template bawaan tersembunyi".`, { ok: 'Sembunyikan', bahaya: true, judul: 'Template bawaan' })) { await sembunyikanBawaan(t.id, true); toast('Template disembunyikan.'); muat(); }
    } else if (await konfirmasi(`Hapus template "${t.nama}" secara permanen? Surat yang sudah dibuat dari template ini tidak terpengaruh.`, { ok: 'Hapus template', bahaya: true })) { await hapusTemplateKustom(t.id); toast('Template dihapus.'); muat(); }
  }
  async function gandakan(t) {
    const c = bersih(t); c.id = uid(); c.nama = t.nama + ' (salinan)'; delete c.baseId; c.builtin = false;
    await simpanTemplate(c); toast('Template digandakan.'); pergi('#/template/edit/' + c.id);
  }

  function gambar() {
    const list = tpls.filter(lolos);
    hasil.replaceChildren();
    const tersembunyi = sembunyi.length ? templatBawaanTersembunyi() : null;
    if (!list.length) hasil.append(kosongPesan('Template tidak ditemukan', 'Coba kata kunci lain.'));
    else hasil.append(h('div', { class: 'card', style: { padding: '6px' } }, h('div', { class: 'scroll-x' }, h('table', { class: 'tbl resp' },
      h('thead', null, h('tr', null, ['', 'Nama template', 'Kategori', 'Jenis', ''].map((x) => h('th', null, x)))),
      h('tbody', null, list.map((t) => h('tr', null,
        h('td', { style: { width: '44px' } }, h('button', { class: 'icon-btn' + (t.favorite ? ' fav-on' : ''), type: 'button', 'aria-label': t.favorite ? 'Hapus favorit' : 'Jadikan favorit', onclick: async () => { t.favorite = await toggleFavorit(t.id); gambar(); } }, ikon(t.favorite ? 'star-fill' : 'star', 18))),
        h('td', { 'data-l': 'Nama' }, h('b', { style: { fontWeight: 500 } }, t.nama), t.override ? h('span', { class: 'badge', style: { marginLeft: '8px' } }, 'diubah') : null, !t.builtin ? h('span', { class: 'badge selesai', style: { marginLeft: '8px' } }, 'buatan sendiri') : null),
        h('td', { 'data-l': 'Kategori' }, KATEGORI[t.kategori]?.nama || ''), h('td', { 'data-l': 'Jenis' }, t.kind === 'dokumen' ? 'Dokumen' : 'Surat'),
        h('td', null, h('div', { class: 'row', style: { gap: '4px', flexWrap: 'wrap' } },
          btn('Pakai', { kind: 'sm primary', onClick: () => pergi('#/editor/baru?t=' + encodeURIComponent(t.id)) }),
          h('button', { class: 'icon-btn', type: 'button', title: 'Ubah template', 'aria-label': 'Ubah template', onclick: () => pergi('#/template/edit/' + encodeURIComponent(t.id)) }, ikon('edit', 17)),
          h('button', { class: 'icon-btn', type: 'button', title: 'Gandakan', 'aria-label': 'Gandakan', onclick: () => gandakan(t) }, ikon('copy', 17)),
          h('button', { class: 'icon-btn', type: 'button', title: 'Unduh dokumen kosong', 'aria-label': 'Unduh dokumen kosong', onclick: () => menuUnduh(t) }, ikon('download', 17)),
          h('button', { class: 'icon-btn', type: 'button', title: t.builtin ? (t.override ? 'Pulihkan bawaan' : 'Sembunyikan') : 'Hapus', 'aria-label': t.builtin ? (t.override ? 'Pulihkan bawaan' : 'Sembunyikan') : 'Hapus', onclick: () => hapus(t) }, ikon(t.override ? 'refresh' : 'trash', 17)))))))))));
    if (tersembunyi) hasil.append(tersembunyi);
  }
  function templatBawaanTersembunyi() {
    const items = sembunyi.map((id) => templatBawaan(id)).filter(Boolean);
    if (!items.length) return null;
    return h('div', { class: 'card', style: { marginTop: '14px' } }, h('h4', null, 'Template bawaan tersembunyi'), h('div', { class: 'list' }, items.map((t) => h('div', { class: 'li' }, h('div', { class: 'tt' }, h('b', null, t.nama)), btn('Tampilkan lagi', { kind: 'sm', onClick: async () => { await sembunyikanBawaan(t.id, false); sembunyi.splice(sembunyi.indexOf(t.id), 1); toast('Template ditampilkan kembali.'); muat(); } })))));
  }

  root.append(
    h('div', { class: 'page-h' }, h('div', null, h('h1', null, 'Template Surat'), h('p', null, 'Kelola, ubah, atau buat template sendiri. Perubahan template tidak merusak surat yang sudah dibuat.')),
      btn('Template Baru', { icon: 'plus', kind: 'primary', onClick: () => pergi('#/template/edit/baru') })),
    h('div', { class: 'row', style: { marginBottom: '14px' } },
      h('div', { class: 'searchbox grow' }, ikon('search', 18), h('input', { class: 'inp', type: 'search', placeholder: 'Cari template…', 'aria-label': 'Cari template', oninput: (e) => { q = e.target.value.trim(); gambar(); } })),
      h('select', { class: 'inp', style: { width: 'auto' }, 'aria-label': 'Filter kategori', onchange: (e) => { kat = e.target.value; gambar(); } }, h('option', { value: '' }, 'Semua kategori'), Object.entries(KATEGORI).map(([k, v]) => h('option', { value: k }, v.nama)))),
    hasil);
  gambar();
}

// ---------- Editor template ----------
const TIPE_FIELD = [['text', 'Teks singkat'], ['textarea', 'Teks panjang'], ['date', 'Tanggal'], ['time', 'Jam'], ['number', 'Angka'], ['money', 'Uang (Rp)']];

export async function viewTemplatEdit(root, { seg, App }) {
  const idParam = seg[2];
  let T; let baseBuiltin = false;
  if (idParam === 'baru') {
    T = { id: uid(), nama: '', kategori: 'administrasi', kata: '', kind: 'surat', salam: true, header: 'standar', kop: 'logo', signer: [{ role: 'ketua', posisi: 'kiri' }, { role: 'sekretaris', posisi: 'kanan' }], closings: ['Demikian surat ini kami sampaikan untuk dapat dipergunakan sebagaimana mestinya.'], groups: { identitas: true, penerima: true, kegiatan: false }, defaults: { perihal: '' }, fields: [], body: [{ type: 'p', text: 'Dengan hormat,', align: 'justify' }, { type: 'p', text: '', align: 'justify' }] };
  } else {
    const t = await templatById(idParam);
    if (!t) { root.append(h('div', { class: 'card' }, h('h2', null, 'Template tidak ditemukan'), h('a', { class: 'btn', href: '#/template' }, 'Kembali'))); return; }
    T = bersih(t); baseBuiltin = !!t.builtin;
    if (baseBuiltin) { T.baseId = t.baseId || t.id; T.id = T.baseId; }
  }
  T.body = (T.body || []).map((b) => ({ id: uid(), ...b }));
  T.fields = T.fields || []; T.groups = T.groups || { identitas: true, penerima: false, kegiatan: false };
  T.signer = (T.signer || []).map((r, i, a) => (typeof r === 'string' ? { role: r } : { ...r })); T.closings = T.closings || []; T.ttd = T.ttd || {};
  if (T.signer.some((x) => !x.posisi)) posisiDefault(T.signer);
  let dirty = false;
  App.dirty = () => dirty;
  const ubah = () => { dirty = true; };
  const form = h('div', { style: { maxWidth: '860px' } });
  const fieldsBox = h('div');

  const gambarFields = () => {
    fieldsBox.replaceChildren();
    const tbl = T.fields.map((f, i) => f.type === 'table' ? h('tr', null, h('td', { colspan: 4 }, h('span', { class: 'small muted' }, `Tabel "${f.label}" (bagian dari template bawaan)`))) : h('tr', null,
      h('td', null, h('input', { class: 'inp', value: f.label, 'aria-label': 'Label kolom', oninput: (e) => { f.label = e.target.value; ubah(); } })),
      h('td', null, h('code', { class: 'small' }, f.key)),
      h('td', null, h('select', { class: 'inp', 'aria-label': 'Jenis isian', onchange: (e) => { f.type = e.target.value; ubah(); } }, f.type === 'select' ? h('option', { value: 'select', selected: true }, 'Pilihan') : null, TIPE_FIELD.map(([v, t]) => h('option', { value: v, selected: f.type === v }, t)))),
      h('td', null, h('label', { class: 'row small', style: { gap: '6px' } }, h('input', { type: 'checkbox', checked: !!f.required, onchange: (e) => { f.required = e.target.checked; ubah(); } }), 'Wajib')),
      h('td', null, h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Hapus kolom isian', onclick: async () => { if (await konfirmasi(`Hapus kolom isian "${f.label}"? Pastikan variabel {{${f.key}}} tidak lagi dipakai pada isi template.`, { ok: 'Hapus', bahaya: true })) { T.fields.splice(i, 1); gambarFields(); ubah(); } } }, ikon('trash', 16)))));
    fieldsBox.append(
      T.fields.length ? h('div', { class: 'scroll-x' }, h('table', { class: 'dtbl' }, h('thead', null, h('tr', null, ['Label', 'Variabel', 'Jenis', '', ''].map((x) => h('th', null, x)))), h('tbody', null, tbl))) : h('p', { class: 'hint' }, 'Belum ada kolom isian tambahan.'),
      h('div', { class: 'row', style: { marginTop: '10px' } }, btn('Tambah kolom isian', { icon: 'plus', kind: 'sm', onClick: async () => {
        const label = await tanya('Nama kolom isian (mis. Nama penceramah)', { judul: 'Kolom isian baru', ok: 'Tambah' }); if (!label) return;
        let key = slug(label.trim(), '_') || 'isian'; const ada = new Set(T.fields.map((f) => f.key)); let n = key; let i = 2; while (ada.has(n) || ['perihal', 'lampiran', 'sifat'].includes(n)) n = key + '_' + (i++);
        T.fields.push({ key: n, label: label.trim(), type: 'text', group: 'khusus' }); gambarFields(); ubah(); } })),
      h('p', { class: 'hint' }, 'Pakai variabel di isi template dengan menulis {{variabel}} atau tombol "Sisipkan data" pada blok.'));
  };

  const signerBox = h('div');
  const gambarSigner = () => {
    const peran = daftarPeran(Org.getOrg()).map((p) => [p.id, p.id === 'lain' ? 'Isian bebas' : (p.jabatan || p.id)]);
    const bentrok = masalahTtd(T.signer);
    signerBox.replaceChildren(
      h('div', { class: 'two' },
        h('div', { class: 'fld' }, h('label', { for: 'tpl-peng' }, 'Teks pengantar'), h('input', { id: 'tpl-peng', list: 'dl-tpeng', value: T.ttd.pengantar || '', placeholder: 'mis. Hormat kami, (kosong = tanpa)', oninput: (e) => { T.ttd.pengantar = e.target.value; ubah(); } }), h('datalist', { id: 'dl-tpeng' }, PENGANTAR_TTD.filter(Boolean).map((x) => h('option', { value: x })))),
        kolom({ label: 'Jarak antarkolom', type: 'select', value: T.ttd.jarak || 'normal', options: [['rapat', 'Rapat'], ['normal', 'Normal'], ['lebar', 'Lebar']], onInput: (v) => { T.ttd.jarak = v; ubah(); } }).el),
      h('div', { class: 'row', style: { gap: '2px 22px' } }, cek('Tampilkan jabatan', () => T.ttd.jabatan !== false, (v) => { T.ttd.jabatan = v; ubah(); }), cek('Nama instansi di atas jabatan', () => !!T.ttd.instansi, (v) => { T.ttd.instansi = v; ubah(); })),
      bentrok.length ? h('div', { class: 'banner' }, ikon('alert'), h('div', { class: 'grow' }, bentrok.map((m) => h('div', null, m)))) : null,
      T.signer.map((sg, i) => h('div', { class: 'sig' }, h('div', { class: 'row between' }, h('b', { class: 'small' }, `Penandatangan ${i + 1}`), h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Hapus penandatangan ${i + 1}`, onclick: () => { T.signer.splice(i, 1); gambarSigner(); ubah(); } }, ikon('trash', 16))),
        h('div', { class: 'two', style: { marginTop: '8px' } },
          kolom({ label: 'Peran', type: 'select', value: sg.role, options: peran, onInput: (v) => { sg.role = v; ubah(); } }).el,
          kolom({ label: 'Jabatan tertulis (kosong = ikut peran)', value: sg.jabatan || '', onInput: (v) => { sg.jabatan = v || undefined; ubah(); } }).el,
          kolom({ label: 'Posisi', type: 'select', value: sg.posisi || 'kanan', options: [['kiri', 'Kiri'], ['tengah', 'Tengah'], ['kanan', 'Kanan']], onInput: (v) => { sg.posisi = v; gambarSigner(); ubah(); } }).el,
          kolom({ label: 'Baris', type: 'select', value: String(sg.baris || 1), options: [['1', 'Baris 1'], ['2', 'Baris 2'], ['3', 'Baris 3']], onInput: (v) => { sg.baris = +v; gambarSigner(); ubah(); } }).el,
          kolom({ label: 'Pengantar khusus (mis. Mengetahui,)', value: sg.pengantar || '', onInput: (v) => { sg.pengantar = v; ubah(); } }).el))),
      h('div', { class: 'row', style: { marginTop: '8px' } }, btn('Tambah penandatangan', { kind: 'sm', icon: 'plus', disabled: T.signer.length >= 9, onClick: () => { const used = new Set(T.signer.filter((x) => (x.baris || 1) === 1).map((x) => x.posisi)); T.signer.push({ role: 'ketua', posisi: ['kanan', 'kiri', 'tengah'].find((p) => !used.has(p)) || 'kanan', baris: used.size >= 3 ? 2 : 1 }); gambarSigner(); ubah(); } }), btn('Atur posisi otomatis', { kind: 'sm', disabled: !T.signer.length, onClick: () => { posisiDefault(T.signer); gambarSigner(); ubah(); } })));
  };

  const formatBox = h('div');
  const gambarFormat = () => {
    formatBox.replaceChildren(
      cek('Pakai format khusus untuk template ini', () => !!T.format, (v) => {
        if (v) { const s0 = clone(Org.getSettings()); T.format = { font: s0.font, ukuranFont: s0.ukuranFont, spasi: s0.spasi, jarakParagraf: s0.jarakParagraf, indentParagraf: s0.indentParagraf, indentUkuran: s0.indentUkuran, rataTeks: s0.rataTeks, margin: s0.margin, tanggalPosisi: s0.tanggalPosisi, kop: Org.kopCfg(s0), kertas: s0.kertas }; } else delete T.format;
        gambarFormat(); ubah();
      }, 'Bila dimatikan, template mengikuti Pengaturan.'),
      T.format ? h('div', null, panelFormat(T.format, { onChange: ubah, kertas: { get: () => T.format.kertas || 'A4', set: (v) => { T.format.kertas = v; } } }), seksi('Gaya kop khusus template', panelKop(T.format.kop, { onChange: ubah }), { open: false })) : null);
  };

  const be = editorBlok({ blocks: T.body, tpl: T, onChange: ubah });
  const cek = (label, get, set) => h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: !!get(), onchange: (e) => { set(e.target.checked); ubah(); } }), h('span', null, label));

  const closingTa = h('textarea', { rows: 4, 'aria-label': 'Pilihan kalimat penutup', oninput: (e) => { T.closings = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean); ubah(); } }); closingTa.value = T.closings.join('\n');
  gambarFields(); gambarSigner(); gambarFormat();

  form.append(
    seksi('Informasi umum', [
      h('div', { class: 'two' },
        kolom({ label: 'Nama template', value: T.nama, required: true, onInput: (v) => { T.nama = v; ubah(); } }).el,
        kolom({ label: 'Kategori', type: 'select', value: T.kategori, options: Object.entries(KATEGORI).map(([k, v]) => [k, v.nama]), onInput: (v) => { T.kategori = v; ubah(); } }).el),
      kolom({ label: 'Kata kunci pencarian', value: T.kata || '', ph: 'dipisah spasi', onInput: (v) => { T.kata = v; ubah(); } }).el,
      h('div', { class: 'two' },
        kolom({ label: 'Jenis dokumen', type: 'select', value: T.kind, options: [['surat', 'Surat (dengan salam)'], ['dokumen', 'Dokumen kegiatan']], onInput: (v) => { T.kind = v; ubah(); } }).el,
        kolom({ label: 'Kop surat bawaan', type: 'select', value: T.kop || 'logo', options: [['logo', 'Kop dengan logo'], ['nologo', 'Kop tanpa logo'], ['none', 'Tanpa kop']], onInput: (v) => { T.kop = v; ubah(); } }).el),
      h('div', { class: 'two' },
        kolom({ label: 'Kepala surat', type: 'select', value: T.header || (T.kind === 'dokumen' ? 'none' : 'standar'), options: [['standar', 'Standar (Nomor, Lampiran, Perihal)'], ['judul', 'Judul di tengah (mis. SURAT KETERANGAN)'], ['none', 'Tanpa kepala surat']], onInput: (v) => { T.header = v; ubah(); } }).el,
        kolom({ label: 'Judul dokumen (jika memakai judul)', value: T.judul || '', onInput: (v) => { T.judul = v; ubah(); } }).el),
      cek('Pakai salam pembuka dan penutup', () => T.salam !== false, (v) => { T.salam = v; }),
      h('b', { class: 'small' }, 'Bagian formulir yang ditampilkan'),
      cek('Identitas surat (nomor, tanggal, perihal)', () => T.groups.identitas, (v) => { T.groups.identitas = v; }),
      cek('Penerima surat', () => T.groups.penerima, (v) => { T.groups.penerima = v; }),
      cek('Informasi kegiatan', () => T.groups.kegiatan, (v) => { T.groups.kegiatan = v; }),
      h('p', { class: 'hint' }, 'Bagian "Informasi kegiatan" hanya berisi kolom bila template memiliki kolom kegiatan. Kolom tambahan dapat dibuat di bawah.')], { nomor: 1 }),
    seksi('Kolom isian tambahan', fieldsBox, { nomor: 2, open: false }),
    seksi('Susunan isi (paragraf, daftar, tabel)', [be.el, h('p', { class: 'hint' }, 'Gunakan {{nama_variabel}} untuk data otomatis. Variabel yang belum diisi tidak akan tampil sebagai kode, melainkan titik-titik.')], { nomor: 3 }),
    seksi('Penutup dan penandatangan', [h('div', { class: 'fld' }, h('label', null, 'Pilihan kalimat penutup (satu per baris)'), closingTa), h('b', { class: 'small' }, 'Susunan tanda tangan bawaan'), signerBox], { nomor: 4, open: false }),
    seksi('Format dokumen khusus (opsional)', formatBox, { nomor: 5, open: false }));

  const simpan = async () => {
    if (!T.nama.trim()) { toast('Nama template wajib diisi.', 'err'); return; }
    const out = clone(T); out.nama = out.nama.trim(); out.builtin = false;
    out.body = T.body.map(({ id, ...b }) => b);
    if (!baseBuiltin) delete out.baseId;
    await simpanTemplate(out); dirty = false; toast('Template tersimpan.'); pergi('#/template');
  };
  root.append(
    h('div', { class: 'page-h' }, h('div', null, h('h1', null, idParam === 'baru' ? 'Template Baru' : 'Ubah Template'), h('p', null, baseBuiltin ? 'Anda mengubah salinan dari template bawaan. Versi asli dapat dipulihkan kapan saja.' : 'Template buatan sendiri.')),
      h('div', { class: 'row' }, btn('Batal', { onClick: async () => { if (!dirty || await konfirmasi('Perubahan template belum disimpan. Tinggalkan halaman ini?', { ok: 'Tinggalkan' })) { dirty = false; pergi('#/template'); } } }), btn('Simpan Template', { icon: 'save', kind: 'primary', onClick: simpan }))),
    form);
  return () => { App.dirty = null; };
}
