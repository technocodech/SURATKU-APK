// Data Organisasi, Pengaturan, dan Bantuan.
import { h, clone, download } from './util.js';
import { ikon, btn, toast, konfirmasi, kolom, seksi, modal } from './ui.js';
import * as Org from './org.js';
import { KATEGORI, buatSurat, susunDokumen, PENGANTAR_TTD } from './compose.js';
import { panelKop, cek } from './kop-ui.js';
import { panelFormat } from './format-ui.js';
import { kopCfg } from './org.js';
import { layout } from './layout.js';
import { pageSvg } from './render.js';
import { panelLogo } from './logo-ui.js';
import { exportAll, importAll, resetAll, storageMode, validateBackup, kvGet, kvSet } from './db.js';
import { formatNomor, intip, periksaDuplikat, aturUrutan, urutanSaatIni } from './numbering.js';
import { semuaSurat } from './store.js';
import { terapkanTema, pergi } from './app.js';

// ---------- Data Organisasi ----------
export async function viewOrganisasi(root, { App }) {
  const O = clone(Org.getOrg()); const S = clone(Org.getSettings());
  S.kop = kopCfg(S);
  let dirty = false; App.dirty = () => dirty;
  const u = (fn) => (v) => { fn(v); dirty = true; };
  const K = (label, key, extra = {}) => kolom({ label, value: O[key] || '', onInput: u((v) => { O[key] = v; }), ...extra }).el;

  async function simpan() {
    if (!O.nama.trim() && !(O.induk || '').trim()) { toast('Nama instansi/organisasi wajib diisi.', 'err'); return; }
    O.pejabat = O.pejabat.filter((p) => (p.jabatan || '').trim() || (p.nama || '').trim());
    await Org.saveOrg(O);
    await Org.saveSettings({ ...Org.getSettings(), kopDefault: S.kopDefault, kop: S.kop, kopGaris: true, logoUkuran: S.logoUkuran, salam: S.salam, penomoran: { ...Org.getSettings().penomoran } });
    dirty = false; toast('Pengaturan organisasi disimpan. Surat baru akan memakai identitas ini.');
  }
  function pratinjauKop() {
    const tplPv = { id: 'pv', nama: 'Pratinjau Kop', kind: 'dokumen', header: 'none', groups: {}, fields: [], body: [], signer: [], salam: false };
    const set = { ...Org.getSettings(), kopDefault: S.kopDefault, kop: S.kop, logoUkuran: S.logoUkuran };
    const L = buatSurat(tplPv, O, set, Org.getLogos()); L.kop = S.kopDefault;
    const { doc } = susunDokumen(L, { nomorTampil: '' });
    const lay = layout(doc);
    const svg = pageSvg(lay.pages[0], lay.paper);
    const ys = lay.pages[0].prims.map((p) => p.y2 ?? ((p.y ?? 0) + (p.h ?? 0))); const bawah = Math.min(lay.paper.h, Math.max(120, ...ys) + 24);
    svg.setAttribute('viewBox', `0 0 ${lay.paper.w} ${bawah}`); svg.removeAttribute('height'); svg.style.width = '100%'; svg.style.height = 'auto';
    modal({ title: 'Pratinjau kop surat', wide: true, body: h('div', { style: { background: '#fff', border: '1px solid var(--line)', lineHeight: 0 } }, svg), actions: [{ label: 'Tutup', kind: 'primary' }] });
  }

  // Penandatangan / pejabat
  const pejBox = h('div');
  const gambarPej = () => {
    pejBox.replaceChildren(
      O.pejabat.length ? h('div', { class: 'scroll-x' }, h('table', { class: 'dtbl' }, h('thead', null, h('tr', null, ['Jabatan', 'Nama lengkap (dengan gelar)', ''].map((x) => h('th', null, x)))),
        h('tbody', null, O.pejabat.map((p, i) => h('tr', null,
          h('td', null, h('input', { class: 'inp', value: p.jabatan, 'aria-label': `Jabatan ${i + 1}`, oninput: (e) => { p.jabatan = e.target.value; dirty = true; } })),
          h('td', null, h('input', { class: 'inp', value: p.nama, 'aria-label': `Nama ${i + 1}`, oninput: (e) => { p.nama = e.target.value; dirty = true; } })),
          h('td', null, h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Hapus jabatan ${i + 1}`, onclick: () => { O.pejabat.splice(i, 1); dirty = true; gambarPej(); } }, ikon('trash', 16)))))))) : h('p', { class: 'hint' }, 'Belum ada jabatan. Tambahkan bila instansi memiliki pejabat penandatangan tetap.'),
      h('div', { class: 'row', style: { marginTop: '8px' } }, btn('Tambah jabatan', { icon: 'plus', kind: 'sm', onClick: () => { O.pejabat.push({ id: 'p' + Math.random().toString(36).slice(2, 7), jabatan: '', nama: '' }); dirty = true; gambarPej(); } })));
  };
  gambarPej();
  const jenisBox = h('div');
  const gambarJenis = () => {
    jenisBox.replaceChildren(h('div', { class: 'row', style: { alignItems: 'flex-end' } },
      h('div', { class: 'grow' }, kolom({ label: 'Jenis pengguna (contoh isian awal)', type: 'select', value: O.jenis || 'organisasi', options: Object.entries(Org.JENIS_PENGGUNA).map(([k, v]) => [k, v.nama]), onInput: u((v) => { O.jenis = v; }) }).el),
      btn('Terapkan contoh jabatan dan salam', { kind: 'sm', onClick: async () => {
        const j = Org.JENIS_PENGGUNA[O.jenis || 'organisasi'];
        if (!(await konfirmasi(`Isi daftar jabatan penandatangan dengan contoh "${j.nama}"? Nama pejabat yang sudah Anda isi dipertahankan menurut urutan.`, { ok: 'Terapkan' }))) return;
        O.pejabat = j.pejabat.map((jab, i) => ({ id: (O.pejabat[i] && O.pejabat[i].id) || ['ketua', 'sekretaris', 'bendahara'][i] || 'p' + Math.random().toString(36).slice(2, 7), jabatan: jab, nama: (O.pejabat[i] && O.pejabat[i].nama) || '' }));
        if (!O.kode && j.kode) O.kode = j.kode;
        S.salam = j.salam ? { ...j.salam } : { pakai: false, pembuka: '', penutup: '' };
        if (j.nama.startsWith('Perorangan')) S.kopDefault = 'none';
        dirty = true; gambarPej(); toast('Contoh diterapkan. Ubah sesuai kebutuhan lalu simpan.');
      } })));
  };
  gambarJenis();

  root.append(
    h('div', { class: 'page-h' }, h('div', null, h('h1', null, 'Data Organisasi'), h('p', null, 'Identitas instansi, organisasi, sekolah, perusahaan, atau perorangan. Dipakai pada kop, tanda tangan, dan isi semua surat baru.')),
      h('div', { class: 'row' }, btn('Pratinjau Kop', { icon: 'eye', onClick: pratinjauKop }), btn('Simpan Pengaturan', { icon: 'save', kind: 'primary', onClick: simpan }))),
    h('div', { style: { maxWidth: '900px' } },
      seksi('Identitas', [
        jenisBox,
        kolom({ label: 'Instansi induk / atasan (opsional, baris kop paling atas)', type: 'textarea', rows: 2, value: O.induk || '', ph: 'mis. PEMERINTAH KABUPATEN …', onInput: u((v) => { O.induk = v; }) }).el,
        kolom({ label: 'Nama instansi atau organisasi (satu baris kop per baris)', type: 'textarea', rows: 2, value: O.nama, required: true, tip: 'Tiap baris menjadi satu baris pada kop surat. Huruf kapital dan gaya lain diatur di bagian Kop surat.', onInput: u((v) => { O.nama = v; }) }).el,
        h('div', { class: 'two' }, K('Kota/tempat penandatanganan', 'kotaTtd', { hint: 'Ditulis sebelum tanggal, mis. "Bandung, 27 Oktober 2026".' }), K('Kode untuk nomor surat', 'kode', { hint: 'Menggantikan {kode} pada format penomoran, mis. YYS atau 421.', ph: 'mis. ORG' })),
      ], { nomor: 1 }),
      seksi('Penandatangan dan jabatan', [h('p', { class: 'hint' }, 'Daftar ini muncul sebagai pilihan penandatangan pada surat. Jabatan dan nama dapat diubah per surat.'), pejBox], { nomor: 2 }),
      seksi('Alamat dan kontak', [
        kolom({ label: 'Alamat lengkap (ditulis bebas)', type: 'textarea', rows: 2, value: O.alamatBebas || '', hint: 'Bila diisi, ini dipakai pada kop dan mengabaikan rincian wilayah di bawah.', ph: 'mis. Jl. Merdeka No. 10, Kota …, Provinsi …', onInput: u((v) => { O.alamatBebas = v; }) }).el,
        seksi('Atau isi rincian wilayah (gaya alamat Indonesia)', h('div', { class: 'two' }, K('Alamat / dukuh / jalan', 'alamat'),
          kolom({ label: 'Jenis wilayah', type: 'select', value: O.desaJenis, options: ['Desa', 'Kelurahan'], onInput: u((v) => { O.desaJenis = v; }) }).el, K('Nama desa/kelurahan', 'desa'), K('Kecamatan', 'kecamatan'),
          kolom({ label: 'Kabupaten/kota', type: 'select', value: O.kabJenis, options: ['Kabupaten', 'Kota'], onInput: u((v) => { O.kabJenis = v; }) }).el, K('Nama kabupaten/kota', 'kabupaten'), K('Provinsi', 'provinsi')), { open: false }),
        h('div', { class: 'two' }, K('Nomor telepon', 'telepon'), K('Email', 'email', { type: 'email' }), K('Website', 'website')),
        kolom({ label: 'Baris tambahan kop (opsional, satu per baris)', type: 'textarea', rows: 2, value: O.kopTambahan || '', onInput: u((v) => { O.kopTambahan = v; }) }).el,
      ], { nomor: 3 }),
      seksi('Logo', [
        h('p', { class: 'hint' }, 'Logo disimpan di perangkat ini dan dipakai ulang. Format PNG, JPG, atau SVG (maks. 2 MB). Gunakan berkas logo asli milik Anda; aplikasi tidak membuat logo.'),
        ['muslimat', 'fatayat', 'alt'].map((sl) => h('div', null, panelLogo(sl, { onChange: () => { if (Org.getLogos()[sl] && S.kopDefault === 'nologo') { S.kopDefault = 'logo'; dirty = true; toast('Kop bawaan diubah menjadi "dengan logo".'); } } }), kolom({ label: `Ukuran maksimum ${Org.SLOT_LOGO[sl]} (mm)`, type: 'number', min: 10, max: 40, value: S.logoUkuran[sl], onInput: u((v) => { S.logoUkuran[sl] = Math.min(40, Math.max(10, +v || 22)); }) }).el)),
      ], { nomor: 4 }),
      seksi('Kop surat', [
        kolom({ label: 'Kop bawaan untuk surat baru', type: 'select', value: S.kopDefault, options: [['logo', 'Kop dengan logo (logo utama di kiri, logo kedua di kanan bila ada)'], ['nologo', 'Kop tanpa logo'], ['none', 'Tanpa kop']], onInput: u((v) => { S.kopDefault = v; }) }).el,
        h('p', { class: 'hint' }, 'Di editor surat, sisi logo dapat diganti kiri/kanan atau dikosongkan per surat. Gaya huruf, warna, dan garis di bawah berlaku sebagai bawaan; tiap surat bisa menyesuaikan sendiri.'),
        panelKop(S.kop, { onChange: () => { dirty = true; } }),
        h('p', { class: 'hint' }, 'Perubahan identitas berlaku untuk surat baru. Surat lama menyimpan identitasnya sendiri; Anda dapat memperbaruinya secara sengaja dari editor surat.')], { nomor: 5 }),
      h('div', { class: 'row', style: { marginTop: '16px' } },
        btn('Pulihkan Pengaturan', { icon: 'refresh', onClick: async () => { if (await konfirmasi('Kosongkan identitas organisasi (nama, alamat, jabatan, nama pejabat)? Logo tidak dihapus.', { ok: 'Pulihkan', bahaya: true })) { await Org.resetOrg(); dirty = false; toast('Pengaturan dipulihkan.'); pergi('#/dashboard'); setTimeout(() => pergi('#/organisasi'), 30); } } }),
        btn('Ekspor Data Organisasi', { icon: 'download', onClick: () => { const o = { app: 'SURATKU', jenis: 'organisasi', org: Org.getOrg(), logos: Object.values(Org.getLogos()), pengaturan: { kopDefault: S.kopDefault, kop: S.kop, logoUkuran: S.logoUkuran } }; download(new Blob([JSON.stringify(o, null, 1)], { type: 'application/json' }), 'Data_Organisasi_SURATKU.json'); toast('Data organisasi diekspor.'); } }))));
  return () => { App.dirty = null; };
}

// ---------- Pengaturan ----------
export async function viewPengaturan(root, { App }) {
  const S = clone(Org.getSettings()); const O = clone(Org.getOrg());
  let dirty = false; App.dirty = () => dirty;
  const u = (fn) => (v) => { fn(v); dirty = true; };
  const mmToPt = (mm) => Math.round(mm * 72 / 25.4);

  async function simpan() {
    const m = S.margin; for (const k of Object.keys(m)) m[k] = Math.min(50, Math.max(5, +m[k] || 20));
    S.ukuranFont = Math.min(16, Math.max(9, +S.ukuranFont || 12)); S.ttd = S.ttd || {};
    S.penomoran.digit = Math.min(6, Math.max(1, +S.penomoran.digit || 3));
    await Org.saveSettings(S); await Org.saveOrg({ ...Org.getOrg(), kode: O.kode });
    terapkanTema(S.tema === 'auto' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : S.tema);
    dirty = false; toast('Pengaturan disimpan.');
  }
  const N = (label, get, set, extra = {}) => kolom({ label, type: 'number', value: get(), onInput: u(set), ...extra }).el;

  // penomoran
  const pvBox = h('div', { class: 'small' });
  const hitungPv = async () => {
    const tmp = Org.getSettings(); const asli = clone(tmp);
    Object.assign(tmp.penomoran, clone(S.penomoran)); const orgKode = Org.getOrg().kode; Org.getOrg().kode = O.kode;
    try {
      const now = new Date(); const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const rows = []; for (const k of Object.keys(KATEGORI)) rows.push(h('div', null, KATEGORI[k].nama + ': ', h('b', null, formatNomor(1, k, iso))));
      pvBox.replaceChildren(h('div', { class: 'muted' }, 'Contoh hasil format (nomor urut 1, bulan ini):'), ...rows);
    } finally { Object.assign(tmp.penomoran, asli.penomoran); Org.getOrg().kode = orgKode; }
  };
  const cekBox = h('div', { class: 'hint' });
  const urutBox = h('div');
  let katUrut = 'undangan';
  const gambarUrut = async () => {
    const now = new Date(); const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const sekarang = await urutanSaatIni(katUrut, iso);
    const inp = h('input', { class: 'inp', type: 'number', min: 0, value: sekarang, 'aria-label': 'Nomor urut terakhir', style: { maxWidth: '140px' } });
    urutBox.replaceChildren(
      h('div', { class: 'row' }, h('select', { class: 'inp', style: { width: 'auto' }, 'aria-label': 'Kategori', onchange: (e) => { katUrut = e.target.value; gambarUrut(); } }, Object.entries(KATEGORI).map(([k, v]) => h('option', { value: k, selected: k === katUrut }, v.nama))), h('span', { class: 'small muted' }, 'Nomor urut terakhir periode ini:'), inp,
        btn('Terapkan', { kind: 'sm', onClick: async () => { if (await konfirmasi(`Atur nomor urut terakhir menjadi ${inp.value}? Nomor berikutnya akan dimulai dari ${(+inp.value || 0) + 1}. Nomor yang sudah dipakai tetap dilewati otomatis.`, { ok: 'Terapkan' })) { await aturUrutan(katUrut, iso, inp.value); toast('Nomor urut diatur.'); gambarUrut(); } } })),
      h('div', { class: 'hint' }, `Lingkup: ${S.penomoran.lingkup === 'kategori' ? 'terpisah per kategori' : 'satu urutan untuk semua surat'}; reset: ${S.penomoran.reset}. Simpan pengaturan lebih dulu bila baru mengubah lingkup atau reset.`));
  };

  const lastBox = h('div', { class: 'small muted', style: { marginTop: '4px' } });
  const tampilLast = async () => { const t = await kvGet('cadangan_terakhir'); lastBox.textContent = t ? `Cadangan terakhir diunduh: ${new Date(t).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}.` : 'Belum pernah mengunduh cadangan pada perangkat ini.'; };
  tampilLast();
  const backup = async () => {
    const data = await exportAll();
    download(new Blob([JSON.stringify(data)], { type: 'application/json' }), `Cadangan_SURATKU_${new Date().toISOString().slice(0, 10)}.json`);
    await kvSet('cadangan_terakhir', new Date().toISOString()); tampilLast();
    toast('Cadangan data diunduh. Simpan berkasnya di tempat aman.');
  };
  const file = h('input', { type: 'file', accept: '.json,application/json', class: 'sr', 'aria-label': 'Pilih berkas cadangan', onchange: async (e) => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try {
      if (f.size > 60 * 1024 * 1024) throw new Error('Berkas cadangan terlalu besar.');
      const obj = JSON.parse(await f.text());
      const bad = validateBackup(obj); if (bad.length) throw new Error(bad.join(' '));
      const jumlah = Array.isArray(obj?.data?.letters) ? obj.data.letters.length : 0;
      if (!(await konfirmasi(`Impor cadangan ini?\nBerisi ${jumlah} surat. Semua data saat ini di perangkat akan DIGANTI dengan isi cadangan.`, { ok: 'Ganti dengan cadangan', bahaya: true, judul: 'Impor cadangan' }))) return;
      await importAll(obj); toast('Cadangan berhasil diimpor. Memuat ulang…'); setTimeout(() => { location.hash = '#/dashboard'; location.reload(); }, 900);
    } catch (err) { toast(err instanceof SyntaxError ? 'Berkas bukan JSON yang valid.' : err.message, 'err', 7000); }
  } });
  const storBox = h('div', { class: 'small muted' });
  if (navigator.storage && navigator.storage.estimate) navigator.storage.estimate().then((e) => { storBox.textContent = `Penyimpanan terpakai: ${(e.usage / 1048576).toFixed(1)} MB dari sekitar ${(e.quota / 1048576).toFixed(0)} MB tersedia.`; }).catch(() => {});

  root.append(
    h('div', { class: 'page-h' }, h('div', null, h('h1', null, 'Pengaturan'), h('p', null, 'Tampilan aplikasi, format dokumen, penomoran, dan cadangan data.')), btn('Simpan Pengaturan', { icon: 'save', kind: 'primary', onClick: simpan })),
    h('div', { style: { maxWidth: '900px' } },
      seksi('Tampilan aplikasi', [kolom({ label: 'Mode warna', type: 'select', value: S.tema, options: [['auto', 'Ikuti perangkat'], ['light', 'Terang'], ['dark', 'Gelap']], onInput: u((v) => { S.tema = v; }) }).el], { nomor: 1 }),
      seksi('Format dokumen bawaan', [
        h('p', { class: 'hint' }, 'Berlaku untuk surat baru. Setiap surat tetap dapat diubah sendiri di editor (bagian Format dan tata letak).'),
        panelFormat(S, { onChange: () => { dirty = true; }, kertas: { get: () => S.kertas, set: (v) => { S.kertas = v; } } }),
        h('div', { class: 'two' },
          kolom({ label: 'Format tanggal', type: 'select', value: S.formatTanggal, options: [['long', '27 Oktober 2026'], ['short', '27/10/2026']], onInput: u((v) => { S.formatTanggal = v; }) }).el,
          kolom({ label: 'Zona waktu', type: 'select', value: S.zona, options: ['WIB', 'WITA', 'WIT'], onInput: u((v) => { S.zona = v; }) }).el,
          N('Ruang tanda tangan (mm)', () => Math.round(S.ruangTtd * 25.4 / 72), (v) => { S.ruangTtd = mmToPt(Math.min(60, Math.max(10, +v || 22))); }, { min: 10, max: 60 })),
        h('b', { class: 'small' }, 'Tanda tangan bawaan surat baru'),
        h('div', { class: 'two', style: { marginTop: '8px' } },
          h('div', { class: 'fld' }, h('label', { for: 'dflPeng' }, 'Teks pengantar bawaan'), h('input', { id: 'dflPeng', list: 'dl-peng', value: S.ttd.pengantar || '', placeholder: 'mis. Hormat kami,', oninput: u((e) => { S.ttd.pengantar = e.target.value; }) }), h('datalist', { id: 'dl-peng' }, PENGANTAR_TTD.filter(Boolean).map((x) => h('option', { value: x })))),
          kolom({ label: 'Jarak antarkolom tanda tangan', type: 'select', value: S.ttd.jarak || 'normal', options: [['rapat', 'Rapat'], ['normal', 'Normal'], ['lebar', 'Lebar']], onInput: u((v) => { S.ttd.jarak = v; }) }).el),
        cek('Tampilkan nama instansi di atas jabatan', () => !!S.ttd.instansi, u((v) => { S.ttd.instansi = v; })),
        h('b', { class: 'small' }, 'Salam pembuka dan penutup (opsional)'),
        h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: !!S.salam.pakai, onchange: u((e) => { S.salam.pakai = e.target.checked; }) }), h('span', null, 'Pakai salam pada surat (mis. "Assalamu\'alaikum Wr. Wb." atau "Salam sejahtera")')),
        h('div', { class: 'two' }, kolom({ label: 'Salam pembuka', value: S.salam.pembuka, ph: 'mis. Salam sejahtera', onInput: u((v) => { S.salam.pembuka = v; }) }).el, kolom({ label: 'Salam penutup', value: S.salam.penutup, ph: 'mis. Salam hormat', onInput: u((v) => { S.salam.penutup = v; }) }).el),
      ], { nomor: 2, open: false }),
      seksi('Penomoran surat', [
        h('p', { class: 'hint' }, 'Format dapat diubah sesuai aturan organisasi. Kode yang tersedia: {no} nomor urut, {kode} kode organisasi, {jenis} kode jenis surat, {bulan}, {bulan_romawi}, {tahun}.'),
        h('div', { class: 'two' },
          kolom({ label: 'Format nomor surat', value: S.penomoran.format, onInput: u((v) => { S.penomoran.format = v; hitungPv(); }) }).el,
          kolom({ label: 'Kode organisasi', value: O.kode || '', hint: 'Menggantikan {kode}.', onInput: u((v) => { O.kode = v; hitungPv(); }) }).el,
          N('Jumlah digit nomor urut', () => S.penomoran.digit, (v) => { S.penomoran.digit = v; hitungPv(); }, { min: 1, max: 6 }),
          kolom({ label: 'Reset nomor urut', type: 'select', value: S.penomoran.reset, options: [['tahunan', 'Setiap tahun'], ['bulanan', 'Setiap bulan'], ['tidak', 'Tidak pernah']], onInput: u((v) => { S.penomoran.reset = v; }) }).el,
          kolom({ label: 'Urutan nomor', type: 'select', value: S.penomoran.lingkup, options: [['semua', 'Satu urutan untuk semua surat'], ['kategori', 'Terpisah per kategori']], onInput: u((v) => { S.penomoran.lingkup = v; }) }).el),
        h('b', { class: 'small' }, 'Kode jenis surat dan format per kategori (opsional)'),
        Object.entries(KATEGORI).map(([k, v]) => h('div', { class: 'two', style: { marginTop: '8px' } }, kolom({ label: `Kode ${v.nama}`, value: S.penomoran.kodeJenis[k] || '', onInput: u((x) => { S.penomoran.kodeJenis[k] = x; hitungPv(); }) }).el, kolom({ label: 'Format khusus (kosong = format umum)', value: (S.penomoran.formatJenis || {})[k] || '', onInput: u((x) => { S.penomoran.formatJenis = S.penomoran.formatJenis || {}; if (x.trim()) S.penomoran.formatJenis[k] = x; else delete S.penomoran.formatJenis[k]; hitungPv(); }) }).el)),
        pvBox,
        h('h4', { style: { marginTop: '16px' } }, 'Nomor urut'), urutBox,
        h('h4', { style: { marginTop: '16px' } }, 'Periksa nomor surat'),
        h('div', { class: 'row' }, h('input', { class: 'inp', id: 'cekNo', placeholder: 'Ketik nomor surat…', style: { maxWidth: '320px' }, 'aria-label': 'Nomor yang diperiksa' }), btn('Periksa', { kind: 'sm', onClick: async () => { const v = document.getElementById('cekNo').value; if (!v.trim()) return; const pakai = (await semuaSurat()).find((s) => s.nomor && s.nomor.trim().toLowerCase() === v.trim().toLowerCase()); cekBox.textContent = pakai ? `Nomor sudah dipakai: ${pakai.tpl.nama} — ${pakai.fields.perihal || ''}` : 'Nomor belum pernah dipakai.'; cekBox.style.color = pakai ? 'var(--danger)' : 'var(--ok)'; } })), cekBox,
      ], { nomor: 3, open: false }),
      seksi('Data, cadangan, dan penyimpanan', [
        h('p', { class: 'hint' }, storageMode === 'memori' ? 'Penyimpanan peramban tidak tersedia; data hanya sementara.' : 'Semua data tersimpan di peramban perangkat ini (IndexedDB). Data tidak otomatis tersinkron antarperangkat atau antarpengguna, dan dapat hilang bila data situs dihapus. Buat cadangan secara berkala.'),
        storBox, lastBox,
        h('div', { class: 'row', style: { marginTop: '10px' } }, btn('Ekspor cadangan data', { icon: 'download', onClick: backup }), btn('Impor cadangan…', { icon: 'upload', onClick: () => file.click() }), file),
        h('hr', { style: { border: 0, borderTop: '1px solid var(--line)', margin: '16px 0' } }),
        btn('Hapus semua data', { icon: 'trash', kind: 'danger-o', onClick: async () => { if (!(await konfirmasi('Seluruh surat, template buatan sendiri, logo, dan pengaturan di perangkat ini akan dihapus permanen. Disarankan membuat cadangan dahulu.', { ok: 'Lanjut', bahaya: true, judul: 'Hapus semua data' }))) return; const t = prompt('Ketik HAPUS untuk memastikan:'); if (t !== 'HAPUS') { toast('Dibatalkan.', 'err'); return; } await resetAll(); toast('Semua data dihapus. Memuat ulang…'); setTimeout(() => { location.hash = '#/dashboard'; location.reload(); }, 900); } }),
      ], { nomor: 4, open: false })));
  hitungPv(); gambarUrut();
  return () => { App.dirty = null; };
}

// ---------- Bantuan ----------
export async function viewBantuan(root) {
  const F = (q, a) => h('details', { class: 'faq' }, h('summary', null, q), h('div', { class: 'muted', style: { paddingTop: '6px' } }, a));
  root.append(
    h('div', { class: 'page-h' }, h('div', null, h('h1', null, 'Bantuan'), h('p', null, 'Panduan singkat membuat, mengunduh, dan mengelola surat.'))),
    h('div', { class: 'card help', style: { maxWidth: '860px' } },
      h('h3', null, 'Cara membuat surat'),
      h('ol', null, h('li', null, 'Buka ', h('b', null, 'Data Organisasi'), ', isi nama instansi, daftar jabatan penandatangan, alamat, dan unggah logo (sekali saja).'), h('li', null, 'Klik ', h('b', null, 'Buat Surat'), ' lalu pilih jenis surat atau templat kosong. Gunakan kotak pencarian bila perlu.'), h('li', null, 'Isi formulir di sebelah kiri. Pratinjau A4 di sebelah kanan berubah langsung. Di HP, pindah antara tab ', h('b', null, 'Formulir'), ' dan ', h('b', null, 'Pratinjau'), '.'), h('li', null, 'Pada bagian ', h('b', null, 'Kop surat'), ' pilih kop dengan logo, tanpa logo, atau tanpa kop, lalu atur gaya huruf dan garisnya.'), h('li', null, 'Perbaiki isi surat pada bagian ', h('b', null, 'Isi surat dan penutup'), ' bila diperlukan, lalu atur penandatangan.'), h('li', null, 'Klik ', h('b', null, 'Simpan'), ' atau biarkan draf tersimpan otomatis.'), h('li', null, 'Klik ', h('b', null, 'Ekspor'), ' lalu pilih PDF, Word, atau Cetak. Aplikasi memeriksa data yang belum lengkap sebelum ekspor.')),
      h('h3', null, 'Penomoran'),
      h('p', null, 'Nomor otomatis diambil saat surat disimpan atau diekspor, dengan format yang dapat diatur di Pengaturan. Nomor yang sama tidak akan diberikan dua kali. Pada nomor manual, aplikasi menolak nomor yang sudah dipakai.'),
      h('h3', null, 'Menyimpan data'),
      h('p', null, 'Semua data tersimpan di peramban pada perangkat ini. Data ', h('b', null, 'tidak'), ' tersinkron otomatis ke perangkat atau pengguna lain, dan dapat hilang jika data situs dihapus. Gunakan ', h('b', null, 'Pengaturan → Ekspor cadangan data'), ' secara berkala, lalu impor di perangkat lain bila ingin berpindah.'),
      h('h3', null, 'Tanya jawab'),
      F('Mengapa tanda "………" muncul di surat?', 'Titik-titik menandakan data yang belum diisi. Pada pratinjau diberi sorotan kuning (tidak ikut tercetak). Lengkapi isian atau biarkan jika akan diisi tangan.'),
      F('Apakah file Word dapat diedit?', 'Ya. Berkas .docx dibuat sebagai dokumen Word asli (tabel, kop, tanda tangan, nomor halaman) dan dapat dibuka di Microsoft Word atau LibreOffice.'),
      F('Font apa yang tersedia?', 'Times New Roman, Arial, dan Courier New. Ketiganya tampil sama di pratinjau, PDF, dan Word. Teks Arab (bismillah, salam, doa) ditambahkan lewat blok "Teks Arab" pada isi surat dan tampil sama di pratinjau, PDF, dan Word.'),
      F('Bagaimana mengatur format satu paragraf saja?', 'Pada blok isi surat, pilih tombol "Format blok…" untuk ukuran, jenis huruf, warna, jarak, dan menjorok. Untuk tebal, miring, garis bawah, atau warna pada kata tertentu, blok teksnya lalu klik B, I, U, atau Warna.'),
      F('Bagaimana menyimpan susunan sendiri?', 'Di editor surat, klik "Jadikan template" untuk menyimpan isi, tanda tangan, dan format. Susunan tanda tangan saja dapat disimpan di bagian Penandatangan.'),
      F('Logo tidak muncul?', 'Pastikan logo sudah diunggah di Data Organisasi dan kop yang dipilih adalah "Kop dengan logo". Jika memilih "Kop tanpa logo" atau "Tanpa kop", logo tidak ditampilkan.'),
      F('Bagaimana jika identitas organisasi berubah?', 'Surat baru memakai identitas terbaru. Surat lama tetap memakai identitas saat dibuat; saat dibuka, aplikasi menawarkan memperbarui atau mempertahankannya.'),
      F('Apakah tanda tangan gambar sah secara hukum?', 'Gambar tanda tangan hanya tampilan visual, bukan tanda tangan elektronik tersertifikasi. Pengesahan tetap mengikuti ketentuan organisasi.'),
      F('Bisa dipakai tanpa internet?', 'Bisa. Setelah dibuka sekali, aplikasi tersimpan dan dapat dipakai luring pada peramban yang mendukung.')));
}
