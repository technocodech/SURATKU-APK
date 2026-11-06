// Editor blok isi surat (dipakai pada editor surat dan editor template).
import { h, uid, clone } from './util.js';
import { ikon, btn, konfirmasi, modal } from './ui.js';
import { allFields, kvRows } from './compose.js';
import { FRASA, FRASA_KAT, frasaTersedia } from './frasa.js';
import { DAFTAR_FONT } from './fonts.js';
import { FRASA_ARAB } from './arab.js';
import { WARNA_CEPAT, sisipTeks, bungkus, bersihFormat } from './alat.js';

export const NAMA_BLOK = { p: 'Paragraf', h: 'Subjudul', ol: 'Daftar bernomor', ul: 'Daftar poin', kv: 'Informasi (label : isi)', table: 'Tabel', sp: 'Jarak kosong', pb: 'Pindah halaman', ar: 'Teks Arab', saldo: 'Ringkasan saldo', jadwal: 'Tabel perubahan jadwal', tabelbebas: 'Tabel bebas' };
export const NAMA_KV = { kegiatan: 'Informasi kegiatan (hari, waktu, tempat, dst.)', rapat: 'Data rapat', wakil: 'Data perwakilan', ket: 'Data orang yang diterangkan', rek: 'Data yang direkomendasikan', pembuat: 'Data pembuat pernyataan' };
const STD = [['nama_organisasi', 'Nama organisasi'], ['alamat_organisasi', 'Alamat organisasi'], ['nomor_surat', 'Nomor surat'], ['tanggal_surat', 'Tanggal surat'], ['kota_surat', 'Kota surat'], ['nama_ketua', 'Nama pejabat 1 (Ketua)'], ['nama_sekretaris', 'Nama pejabat 2 (Sekretaris)'], ['nama_bendahara', 'Nama pejabat 3 (Bendahara)'], ['hari_kegiatan', 'Hari kegiatan'], ['waktu_kegiatan', 'Waktu kegiatan']];

export function daftarVariabel(tpl) {
  const dari = allFields(tpl).filter((f) => f.type !== 'table').map((f) => [f.key, f.label]);
  const seen = new Set(dari.map((x) => x[0]));
  return [...dari, ...STD.filter(([k]) => !seen.has(k))];
}

// Tabel bebas (untuk lampiran): kolom = satu per baris "Nama|lebar", baris = satu per baris, sel dipisah "|".
export const urai = (kolomTeks, barisTeks) => ({
  kolom: String(kolomTeks || '').split('\n').map((x) => x.trim()).filter(Boolean).map((x) => { const [label, w] = x.split('|'); return { label: label.trim(), w: Math.min(8, Math.max(0.5, parseFloat(w) || 2)) }; }),
  baris: String(barisTeks || '').split('\n').filter((x) => x.trim()).map((x) => x.split('|').map((c) => c.trim())),
});
export function baru(type, tpl) {
  const b = { id: uid(), type };
  if (type === 'p') Object.assign(b, { text: '', align: 'justify' });
  else if (type === 'h') Object.assign(b, { text: '', align: 'left', bold: true });
  else if (type === 'ol' || type === 'ul') b.text = '';
  else if (type === 'kv') b.ref = 'kegiatan';
  else if (type === 'table') { const t = (tpl.fields || []).find((f) => f.type === 'table'); b.ref = t ? t.key : ''; b.title = ''; }
  else if (type === 'tabelbebas') Object.assign(b, { kolomTeks: 'Nama\nJabatan\nTanda tangan', barisTeks: '', jmlBaris: 10, nomor: true, tinggiBaris: 24, judul: '' }, urai('Nama\nJabatan\nTanda tangan', ''));
  else if (type === 'sp') b.tinggi = 12;
  else if (type === 'ar') Object.assign(b, { text: FRASA_ARAB[0][1], size: 22, align: 'center' });
  return b;
}

const tinggi = (t) => { t.style.height = 'auto'; t.style.height = Math.min(520, Math.max(70, t.scrollHeight + 2)) + 'px'; };

// Dialog pustaka contoh kalimat.
export function bukaFrasa(tpl, onPilih) {
  const ada = new Set(daftarVariabel(tpl).map((v) => v[0]));
  const tersedia = frasaTersedia((k) => ada.has(k));
  let kat = 'pembuka';
  const daftar = h('div', { class: 'frasa-list' });
  const tab = h('div', { class: 'frasa-tab', role: 'tablist' });
  let tutup;
  const gambar = () => {
    tab.replaceChildren(...Object.entries(FRASA_KAT).map(([k, nm]) => h('button', { type: 'button', role: 'tab', class: 'chip' + (k === kat ? ' on' : ''), 'aria-selected': String(k === kat), onclick: () => { kat = k; gambar(); } }, nm)));
    daftar.replaceChildren(...tersedia.filter((f) => f.kat === kat).map((f) => h('button', { type: 'button', class: 'frasa', onclick: () => { onPilih(f.teks); tutup(); } }, h('span', null, f.teks), h('span', { class: 'small muted' }, 'Klik untuk menyisipkan'))));
  };
  gambar();
  tutup = modal({ title: 'Contoh kalimat formal', wide: true, body: h('div', null, h('p', { class: 'hint' }, 'Pilih contoh kalimat lalu ubah sesuai kebutuhan. Titik-titik (…) adalah bagian yang perlu Anda isi. Pastikan isinya sesuai fakta.'), tab, daftar), actions: [{ label: 'Tutup', kind: 'primary' }] });
}

export function editorBlok({ blocks, tpl, onChange, tombolTambah = true, bebas = false }) {
  const el = h('div', { class: 'bed' });
  const vars = daftarVariabel(tpl);
  const tabel = (tpl.fields || []).filter((f) => f.type === 'table');
  const ubah = () => onChange && onChange();
  const terbuka = new Set(); // blok yang panel formatnya dibuka
  const gerak = (i, d) => { const j = i + d; if (j < 0 || j >= blocks.length) return; [blocks[i], blocks[j]] = [blocks[j], blocks[i]]; gambar(); ubah(); };
  const kunci = (b) => b.id || (b.id = uid());

  const bar = (b, i) => h('div', { class: 'blk-h' }, h('span', { class: 'nm' }, NAMA_BLOK[b.type] || b.type),
    h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Naikkan blok', disabled: i === 0, onclick: () => gerak(i, -1) }, ikon('up', 16)),
    h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Turunkan blok', disabled: i === blocks.length - 1, onclick: () => gerak(i, 1) }, ikon('down', 16)),
    h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Gandakan blok', onclick: () => { blocks.splice(i + 1, 0, { ...clone(b), id: uid() }); gambar(); ubah(); } }, ikon('copy', 16)),
    h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Hapus blok', onclick: async () => { if (await konfirmasi('Hapus blok ini dari isi surat?', { ok: 'Hapus', bahaya: true })) { blocks.splice(i, 1); gambar(); ubah(); } } }, ikon('trash', 16)));

  const sel = (label, nilai, opsi, set) => h('label', { class: 'mini' }, h('span', null, label), h('select', { 'aria-label': label, onchange: (e) => { set(e.target.value); ubah(); } }, opsi.map(([v, t]) => h('option', { value: v, selected: String(nilai ?? '') === v }, t))));

  // Panel format per blok: hanya memengaruhi blok ini.
  const panelFormat = (b) => {
    const teks = b.type === 'p' || b.type === 'h' || b.type === 'ol' || b.type === 'ul';
    const jarakSet = [['', 'Ikuti pengaturan'], ['tanpa', 'Tanpa jarak'], ['rapat', 'Rapat'], ['lebar', 'Lebar'], ['sangat_lebar', 'Sangat lebar']];
    const kids = [];
    if (teks) {
      kids.push(sel('Ukuran huruf', b.size, [['', 'Ikuti pengaturan'], ...[9, 10, 11, 12, 13, 14, 16, 18, 20, 24].map((n) => [String(n), n + ' pt'])], (v) => { b.size = v ? +v : undefined; }),
        sel('Jenis huruf', b.f, [['', 'Ikuti pengaturan'], ...DAFTAR_FONT], (v) => { b.f = v || undefined; }),
        sel('Spasi baris', b.spasi, [['', 'Ikuti pengaturan'], ['1', '1,0'], ['1.15', '1,15'], ['1.5', '1,5'], ['2', '2,0']], (v) => { b.spasi = v ? +v : undefined; }),
        h('label', { class: 'mini' }, h('span', null, 'Warna seluruh teks'), h('span', { class: 'row', style: { gap: '6px' } }, h('input', { type: 'color', class: 'clr', value: b.color || '#000000', 'aria-label': 'Warna teks blok', oninput: (e) => { b.color = e.target.value; ubah(); } }), h('button', { class: 'btn sm', type: 'button', onclick: () => { delete b.color; gambar(); ubah(); } }, 'Bawaan'))));
    }
    if (teks || b.type === 'kv') {
      kids.push(sel('Jarak sebelum', b.jarakAtas, [['', 'Ikuti pengaturan'], ['6', '6 pt'], ['12', '12 pt'], ['18', '18 pt'], ['24', '24 pt']], (v) => { b.jarakAtas = v ? +v : undefined; }),
        sel('Jarak sesudah', b.jarak, jarakSet, (v) => { b.jarak = v || undefined; }));
    }
    if (b.type === 'p' || b.type === 'ol' || b.type === 'ul' || b.type === 'kv') {
      kids.push(sel('Awal paragraf', b.indentMode, [['', 'Otomatis (ikuti pengaturan)'], ['ya', 'Menjorok'], ['tidak', 'Tanpa menjorok']], (v) => { b.indentMode = v || undefined; }));
    }
    return h('div', { class: 'fmtbar' }, kids);
  };

  const alat = (ta, b) => {
    const adaFormat = true;
    return h('div', null, h('div', { class: 'tb' },
      h('button', { class: 'btn sm', type: 'button', title: 'Tebalkan teks terpilih', 'aria-label': 'Tebal', onclick: () => bungkus(ta, '**') }, h('b', null, 'B')),
      h('button', { class: 'btn sm', type: 'button', title: 'Miringkan teks terpilih', 'aria-label': 'Miring', onclick: () => bungkus(ta, '*') }, h('i', null, 'I')),
      h('button', { class: 'btn sm', type: 'button', title: 'Garis bawahi teks terpilih', 'aria-label': 'Garis bawah', onclick: () => bungkus(ta, '++') }, h('u', null, 'U')),
      h('select', { 'aria-label': 'Warnai teks terpilih', title: 'Warnai teks terpilih', onchange: (e) => { if (e.target.value) bungkus(ta, `{w:${e.target.value}}`, '{/w}'); e.target.value = ''; } }, h('option', { value: '' }, 'Warna…'), WARNA_CEPAT.map(([v, t]) => h('option', { value: v }, t))),
      h('button', { class: 'btn sm', type: 'button', title: 'Hapus format tebal/miring/garis bawah/warna pada teks terpilih (atau seluruh teks)', 'aria-label': 'Bersihkan format', onclick: () => bersihFormat(ta) }, 'Tx'),
      b.type === 'p' || b.type === 'h' ? h('select', { 'aria-label': 'Perataan teks', onchange: (e) => { b.align = e.target.value; ubah(); } }, [['justify', 'Rata kiri-kanan'], ['left', 'Rata kiri'], ['center', 'Tengah'], ['right', 'Rata kanan']].map(([v, t]) => h('option', { value: v, selected: (b.align || (b.type === 'h' ? 'left' : 'justify')) === v }, t))) : null,
      b.type === 'p' || b.type === 'h' ? h('label', { class: 'row small', style: { gap: '6px' } }, h('input', { type: 'checkbox', checked: !!b.bold, onchange: (e) => { b.bold = e.target.checked; ubah(); } }), 'Tebal semua') : null,
      h('select', { 'aria-label': 'Sisipkan data otomatis', onchange: (e) => { if (e.target.value) { sisipTeks(ta, `{{${e.target.value}}}`); e.target.value = ''; } } }, h('option', { value: '' }, '+ Sisipkan data…'), vars.map(([k, l]) => h('option', { value: k }, l))),
      b.type === 'p' ? h('button', { class: 'btn sm', type: 'button', onclick: () => bukaFrasa(tpl, (t) => sisipTeks(ta, t)) }, ikon('edit', 14), h('span', null, 'Contoh kalimat')) : null,
      adaFormat ? h('button', { class: 'btn sm', type: 'button', 'aria-expanded': String(terbuka.has(kunci(b))), onclick: () => { if (terbuka.has(b.id)) terbuka.delete(b.id); else terbuka.add(b.id); gambar(); } }, 'Format blok…') : null),
    terbuka.has(b.id) ? panelFormat(b) : null);
  };

  const editBaris = (b) => {
    if (!Array.isArray(b.rows)) b.rows = kvRows(b.ref, tpl).map((r) => ({ label: r.label, tpl: r.tpl, opt: !!r.opt, ...(r.fmt ? { fmt: r.fmt } : {}) }));
    const box = h('div');
    const gbr = () => {
      box.replaceChildren(h('div', { class: 'scroll-x' }, h('table', { class: 'dtbl' }, h('thead', null, h('tr', null, ['Label', 'Isi (boleh memakai {{data}})', 'Opsional', ''].map((x) => h('th', null, x)))),
        h('tbody', null, b.rows.map((r, i) => h('tr', null,
          h('td', null, h('input', { class: 'inp', value: r.label, 'aria-label': `Label baris ${i + 1}`, oninput: (e) => { r.label = e.target.value; ubah(); } })),
          h('td', null, h('div', { class: 'row', style: { gap: '4px', flexWrap: 'nowrap' } }, h('input', { class: 'inp', value: r.tpl, 'aria-label': `Isi baris ${i + 1}`, oninput: (e) => { r.tpl = e.target.value; ubah(); } }),
            h('select', { 'aria-label': 'Sisipkan data', style: { maxWidth: '44px' }, title: 'Sisipkan data', onchange: (e) => { if (e.target.value) { r.tpl = (r.tpl || '') + `{{${e.target.value}}}`; e.target.value = ''; gbr(); ubah(); } } }, h('option', { value: '' }, '+'), vars.map(([k, l]) => h('option', { value: k }, l))))),
          h('td', null, h('input', { type: 'checkbox', checked: !!r.opt, title: 'Lewati baris bila datanya kosong', 'aria-label': 'Opsional', onchange: (e) => { r.opt = e.target.checked; ubah(); } })),
          h('td', null, h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Hapus baris', onclick: () => { b.rows.splice(i, 1); gbr(); ubah(); } }, ikon('trash', 16))))))),
        h('div', { class: 'row', style: { marginTop: '8px' } }, btn('Tambah baris', { icon: 'plus', kind: 'sm', onClick: () => { b.rows.push({ label: '', tpl: '', opt: false }); gbr(); ubah(); } }))));
    };
    gbr(); return box;
  };

  const isi = (b) => {
    switch (b.type) {
      case 'p': case 'h': case 'ol': case 'ul': {
        const ta = h('textarea', { rows: b.type === 'h' ? 1 : 3, placeholder: b.type === 'ol' || b.type === 'ul' ? 'Satu butir per baris…' : 'Tulis teks di sini. Data otomatis ditulis seperti {{nama_kegiatan}}.', 'aria-label': NAMA_BLOK[b.type], oninput: () => { b.text = ta.value; tinggi(ta); ubah(); } });
        ta.value = b.text || ''; setTimeout(() => tinggi(ta), 0);
        return [alat(ta, b), ta];
      }
      case 'kv': return h('div', null,
        Array.isArray(b.rows) ? h('div', null, h('p', { class: 'hint' }, 'Setiap baris tampil sebagai "Label : isi". Baris opsional dilewati bila datanya kosong.'), editBaris(b), panelFormat(b))
          : h('div', null, h('div', { class: 'fld', style: { margin: 0 } }, h('label', null, 'Jenis informasi'), h('select', { onchange: (e) => { b.ref = e.target.value; ubah(); } }, Object.entries(NAMA_KV).map(([v, t]) => h('option', { value: v, selected: b.ref === v }, t)))),
            h('div', { class: 'hint' }, 'Baris yang datanya kosong dan tidak wajib akan otomatis dilewati.'),
            h('div', { class: 'row', style: { marginTop: '6px' } }, btn('Ubah baris sendiri…', { kind: 'sm', onClick: () => { editBaris(b); gambar(); ubah(); } }))));
      case 'table': return h('div', null,
        h('div', { class: 'fld' }, h('label', null, 'Tabel yang ditampilkan'), tabel.length ? h('select', { onchange: (e) => { b.ref = e.target.value; ubah(); } }, tabel.map((f) => h('option', { value: f.key, selected: b.ref === f.key }, f.label))) : h('div', { class: 'hint' }, 'Template ini tidak memiliki kolom tabel.')),
        h('div', { class: 'fld', style: { margin: 0 } }, h('label', null, 'Judul tabel (opsional)'), h('input', { value: b.title || '', oninput: (e) => { b.title = e.target.value; ubah(); } })));
      case 'tabelbebas': return h('div', null,
        h('div', { class: 'fld' }, h('label', null, 'Judul tabel (opsional)'), h('input', { value: b.judul || '', oninput: (e) => { b.judul = e.target.value; ubah(); } })),
        h('div', { class: 'two' },
          h('div', { class: 'fld' }, h('label', null, 'Kolom (satu per baris, boleh "Nama|lebar")'), h('textarea', { rows: 4, value: b.kolomTeks || '', oninput: (e) => { b.kolomTeks = e.target.value; Object.assign(b, urai(b.kolomTeks, b.barisTeks)); ubah(); } })),
          h('div', { class: 'fld' }, h('label', null, 'Isi baris (satu baris per entri, sel dipisah "|")'), h('textarea', { rows: 4, value: b.barisTeks || '', placeholder: '08.00|Pembukaan|Pembawa acara', oninput: (e) => { b.barisTeks = e.target.value; Object.assign(b, urai(b.kolomTeks, b.barisTeks)); ubah(); } }))),
        h('div', { class: 'two' },
          h('div', { class: 'fld' }, h('label', null, 'Jumlah baris minimal (baris kosong ditambahkan)'), h('input', { type: 'number', min: 0, max: 200, value: b.jmlBaris ?? 10, oninput: (e) => { b.jmlBaris = Math.min(200, Math.max(0, +e.target.value || 0)); ubah(); } })),
          h('div', { class: 'fld' }, h('label', null, 'Tinggi tiap baris (pt)'), h('input', { type: 'number', min: 14, max: 80, value: b.tinggiBaris ?? 24, oninput: (e) => { b.tinggiBaris = Math.min(80, Math.max(14, +e.target.value || 24)); ubah(); } }))),
        h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: b.nomor !== false, onchange: (e) => { b.nomor = e.target.checked; ubah(); } }), h('span', null, 'Tambah kolom nomor urut')));
      case 'saldo': return h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: !!b.awal, onchange: (e) => { b.awal = e.target.checked; ubah(); } }), h('span', null, 'Sertakan saldo awal'));
      case 'jadwal': return h('p', { class: 'hint' }, 'Tabel perbandingan jadwal lama dan baru, diisi dari kolom data tambahan.');
      case 'sp': return h('div', { class: 'fld', style: { margin: 0, maxWidth: '240px' } }, h('label', null, 'Tinggi jarak kosong (pt)'), h('input', { type: 'number', min: 2, max: 120, value: b.tinggi || 8, oninput: (e) => { b.tinggi = Math.min(120, Math.max(2, +e.target.value || 8)); ubah(); } }));
      case 'ar': {
        const ta = h('textarea', { rows: 2, class: 'arab-in', dir: 'rtl', 'aria-label': 'Teks Arab', placeholder: 'Ketik atau tempel teks Arab di sini', oninput: () => { b.text = ta.value; ubah(); } }); ta.value = b.text || '';
        return h('div', null, ta,
          h('div', { class: 'row', style: { gap: '8px', marginTop: '8px' } },
            h('label', { class: 'mini' }, h('span', null, 'Contoh bacaan'), h('select', { 'aria-label': 'Contoh bacaan Arab', onchange: (e) => { if (e.target.value !== '') { ta.value = FRASA_ARAB[+e.target.value][1]; b.text = ta.value; e.target.value = ''; ubah(); } } }, h('option', { value: '' }, 'Pilih…'), FRASA_ARAB.map((f, i) => h('option', { value: String(i) }, f[0])))),
            sel('Ukuran (pt)', b.size, [14, 16, 18, 20, 22, 24, 28, 32].map((n) => [String(n), String(n)]), (v) => { b.size = +v; }),
            sel('Rata', b.align, [['center', 'Tengah'], ['right', 'Kanan'], ['left', 'Kiri']], (v) => { b.align = v; }),
            h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: !!b.bold, onchange: (e) => { b.bold = e.target.checked; ubah(); } }), h('span', null, 'Tebal')),
            h('label', { class: 'mini' }, h('span', null, 'Warna'), h('input', { type: 'color', class: 'clr', value: b.color || '#000000', 'aria-label': 'Warna teks Arab', oninput: (e) => { b.color = e.target.value; ubah(); } }))),
          h('p', { class: 'hint' }, 'Teks Arab diubah menjadi gambar agar huruf bersambung dan arah kanan-ke-kiri tampil benar di pratinjau, PDF, dan Word. Di Word, bagian ini berupa gambar (tidak bisa disunting sebagai teks). Harakat ikut tampil bila diketik.'));
      }
      case 'pb': return h('p', { class: 'hint' }, 'Konten setelah blok ini dimulai di halaman baru. Tidak muncul di hasil cetak.');
      default: return null;
    }
  };

  const gambar = () => {
    el.replaceChildren();
    blocks.forEach((b, i) => { kunci(b); el.append(h('div', { class: 'blk' }, bar(b, i), h('div', { class: 'blk-b' }, isi(b, i)))); });
    if (!blocks.length) el.append(h('p', { class: 'hint' }, 'Isi surat masih kosong. Tambahkan blok di bawah.'));
    if (tombolTambah) {
      const tambah = (t, extra) => () => { const b = baru(t, tpl); Object.assign(b, extra || {}); blocks.push(b); gambar(); ubah(); };
      el.append(h('div', { class: 'addbar' },
        btn('Paragraf', { icon: 'plus', kind: 'sm', onClick: tambah('p') }), btn('Subjudul', { icon: 'plus', kind: 'sm', onClick: tambah('h') }),
        btn('Daftar bernomor', { icon: 'plus', kind: 'sm', onClick: tambah('ol') }), btn('Daftar poin', { icon: 'plus', kind: 'sm', onClick: tambah('ul') }),
        btn('Informasi (label : isi)', { icon: 'plus', kind: 'sm', onClick: tambah('kv', { ref: undefined, rows: [{ label: 'Nama', tpl: '', opt: false }, { label: 'Keterangan', tpl: '', opt: false }] }) }),
        (tpl.fields || []).some((f) => f.key === 'nama_kegiatan') ? btn('Info kegiatan otomatis', { icon: 'plus', kind: 'sm', onClick: tambah('kv', { ref: 'kegiatan' }) }) : null,
        tabel.length ? btn('Tabel', { icon: 'plus', kind: 'sm', onClick: tambah('table') }) : null,
        bebas ? btn('Tabel bebas', { icon: 'plus', kind: 'sm', onClick: tambah('tabelbebas') }) : null,
        btn('Jarak', { icon: 'plus', kind: 'sm', onClick: tambah('sp') }), btn('Pindah halaman', { icon: 'plus', kind: 'sm', onClick: tambah('pb') }), btn('Teks Arab', { icon: 'plus', kind: 'sm', onClick: tambah('ar') }),
        btn('Dari contoh kalimat', { icon: 'edit', kind: 'sm', onClick: () => bukaFrasa(tpl, (t) => { const b = baru('p', tpl); b.text = t; blocks.push(b); gambar(); ubah(); }) })));
    }
  };
  gambar();
  return { el, rerender: gambar };
}
