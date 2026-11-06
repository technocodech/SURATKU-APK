// Editor surat: formulir + pratinjau A4 langsung, penyimpanan draf, ekspor.
import { h, debounce, clone, namaBerkas, download, parseISO, uid } from './util.js';
import { pilih, petunjuk, IKON, galeri, tek } from './pilih.js';
import { barAlat } from './alat.js';
import { panelQR } from './qr-ui.js';
import { ikon, btn, toast, modal, konfirmasi, kolom, seksi, tanya } from './ui.js';
import * as Org from './org.js';
import { allFields, buatSurat, periksa, ambilSnap, posisiDefault, peranTersedia, infoPeran, daftarPeran, susunDokumen, masalahTtd, PENGANTAR_TTD, KATEGORI } from './compose.js';
import { kopCfg, bagianCfg, bagianTetap, merge, DEFAULT_TTD } from './org.js';
import { panelGayaTtd, panelGambarTtd, alatGaya } from './ttd-ui.js';
import { MODEL_GAYA, MODEL_COMPANY, FORMAT_SURAT, SEMUA_FORMAT, terapkanFormat, ambilFormat } from './models.js';
import { panelKop, cek } from './kop-ui.js';
import { TTD_MODEL, terapkanTtdModel, miniTtd, ringkasTtd } from './ttd-model.js';
import { panelFormat, pilihTempat } from './format-ui.js';
import { layout } from './layout.js';
import { pageSvg } from './render.js';
import { buatPdf } from './pdf.js';
import { buatDocx } from './docx.js';
import { templatById, ambilSurat, simpanRecord, simpanPemulihan, ambilPemulihan, hapusPemulihan, catat, STATUS, simpanTemplate, daftarTtdPreset, simpanTtdPreset, hapusTtdPreset, daftarFormatPreset, simpanFormatPreset, hapusFormatPreset } from './store.js';
import { intip, ambil, periksaDuplikat } from './numbering.js';
import { editorBlok, baru as baruBlok, urai } from './blocks.js';
import { panelLogo } from './logo-ui.js';
import { pergi, muatUlang } from './app.js';
import { bukaMassal } from './massal.js';
import { buatPita } from './pita.js';
// Riwayat ubah/ulang per surat (di memori) dan keadaan yang akan dimuat ulang setelah undo/redo.
const HIST = new Map(); const PENDING = new Map();

const SLOT_NAMA = { ...Org.SLOT_LOGO, none: 'Tanpa logo' };
const KOP_SVG = {
  logo: '<svg viewBox="0 0 96 56"><circle cx="14" cy="14" r="9" fill="#0b6b3a"/><circle cx="82" cy="14" r="9" fill="#0b6b3a"/><rect x="28" y="7" width="40" height="4" fill="#888"/><rect x="24" y="14" width="48" height="3" fill="#bbb"/><rect x="4" y="27" width="88" height="2" fill="#333"/><rect x="4" y="33" width="60" height="3" fill="#ccc"/><rect x="4" y="40" width="70" height="3" fill="#ccc"/><rect x="4" y="47" width="50" height="3" fill="#ccc"/></svg>',
  nologo: '<svg viewBox="0 0 96 56"><rect x="22" y="7" width="52" height="4" fill="#888"/><rect x="16" y="14" width="64" height="3" fill="#bbb"/><rect x="4" y="27" width="88" height="2" fill="#333"/><rect x="4" y="33" width="60" height="3" fill="#ccc"/><rect x="4" y="40" width="70" height="3" fill="#ccc"/><rect x="4" y="47" width="50" height="3" fill="#ccc"/></svg>',
  none: '<svg viewBox="0 0 96 56"><rect x="26" y="6" width="44" height="4" fill="#888"/><rect x="4" y="18" width="60" height="3" fill="#ccc"/><rect x="4" y="25" width="70" height="3" fill="#ccc"/><rect x="4" y="32" width="50" height="3" fill="#ccc"/><rect x="4" y="39" width="66" height="3" fill="#ccc"/></svg>',
};
const svgNode = (s) => { const d = document.createElement('div'); d.innerHTML = s; return d.firstChild; }; // string statis, bukan data pengguna

export async function viewEditor(root, { seg, q, App }) {
  const idParam = seg[1];
  let L; let isNew = false;
  if (!idParam || idParam === 'baru') {
    const tpl = await templatById(q.t);
    if (!tpl) { root.append(h('div', { class: 'view' }, h('div', { class: 'card' }, h('h2', null, 'Template tidak ditemukan'), h('a', { class: 'btn', href: '#/buat' }, 'Pilih template')))); return; }
    L = buatSurat(tpl, Org.getOrg(), Org.getSettings(), Org.getLogos());
    const org = Org.getOrg();
    L.signers.forEach((s) => { s.nama = infoPeran(org, s.role).nama || ''; });
    if (q.f) { // format tata letak yang dipilih di halaman Buat Surat
      const m = q.f.startsWith('s:') ? (await daftarFormatPreset()).find((x) => x.id === q.f.slice(2)) : SEMUA_FORMAT[q.f];
      if (m) { L.snap.set.kop = kopCfg(L.snap.set); terapkanFormat(L, m); }
    }
    isNew = true;
  } else if (PENDING.has(idParam)) {
    L = PENDING.get(idParam); PENDING.delete(idParam);
  } else {
    L = await ambilSurat(idParam);
    if (!L) { root.append(h('div', { class: 'view' }, h('div', { class: 'card' }, h('h2', null, 'Surat tidak ditemukan'), h('p', null, 'Surat mungkin sudah dihapus.'), h('a', { class: 'btn', href: '#/arsip' }, 'Buka Arsip')))); return; }
    const pul = await ambilPemulihan(L.id);
    if (pul && pul.t > L.updatedAt) {
      await new Promise((res) => modal({ title: 'Perubahan belum disimpan ditemukan', body: h('p', null, 'Ada perubahan terakhir yang belum sempat disimpan pada surat ini. Pulihkan perubahan tersebut?'), onClose: res, actions: [
        { label: 'Buang perubahan', onClick: async () => { await hapusPemulihan(L.id); } }, { label: 'Pulihkan', kind: 'primary', onClick: () => { L = pul.l; } }] }));
    }
  }
  // pastikan struktur lama aman
  L.fields = L.fields || {}; L.body = L.body || []; L.signers = L.signers || [];
  L.snap.set.kop = kopCfg(L.snap.set); L.snap.set.bagian = bagianCfg(L.snap.set); L.ttd = { ...DEFAULT_TTD, ...(L.ttd || {}) };
  L.signers.forEach((s) => { s.baris = s.baris || 1; s.pengantar = s.pengantar || ''; s.ket = s.ket || ''; });
  const tpl = L.tpl;
  const FIELDS = allFields(tpl);
  const perluNomor = !!tpl.groups?.identitas && !tpl.tanpaNomor;
  let dirty = false; let proj = ''; let nomorDup = false; let zoom = 1; let tampilSemua = false; let sibuk = false;
  const touched = new Set(); const refs = {};
  // ---------- Riwayat (undo/redo) ----------
  const ser = () => JSON.stringify(L, (k, v) => (k === 'updatedAt' ? undefined : v));
  let H = HIST.get(L.id); if (!H) { H = { s: [ser()], i: 0 }; HIST.set(L.id, H); }
  let ubahBaru = false;
  const rekamSekarang = () => { if (!ubahBaru) return; ubahBaru = false; try { const j = ser(); if (j === H.s[H.i] || j.length > 6e6) return; H.s.length = H.i + 1; H.s.push(j); if (H.s.length > 40) H.s.shift(); H.i = H.s.length - 1; } catch (e) { /* abaikan */ } perbaruiUR(); };
  const rekam = debounce(rekamSekarang, 700);
  const btnUndo = h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Urungkan perubahan', title: 'Urungkan (undo)', onclick: () => loncat(-1) }, ikon('undo', 20));
  const btnRedo = h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Ulangi perubahan', title: 'Ulangi (redo)', onclick: () => loncat(1) }, ikon('redo', 20));
  function perbaruiUR() { btnUndo.disabled = isNew || H.i <= 0; btnRedo.disabled = isNew || H.i >= H.s.length - 1; }
  async function loncat(d) {
    if (isNew) { toast('Riwayat aktif setelah draf tersimpan otomatis.'); return; }
    rekam.cancel && rekam.cancel(); rekamSekarang();
    const ke = H.i + d; if (ke < 0 || ke >= H.s.length) return;
    H.i = ke; const obj = JSON.parse(H.s[ke]); PENDING.set(L.id, obj);
    try { if (obj.status === 'draf') { await simpanRecord(obj); await hapusPemulihan(obj.id); } else { await simpanPemulihan(obj.id, obj); } } catch (e) { /* abaikan */ }
    App.leave = null; dirty = false; muatUlang();
  }
  const el = h('div', { class: 'ed', dataset: { tab: 'form' } });
  App.dirty = () => dirty && L.status !== 'draf';

  // ---------- Pratinjau ----------
  const pagesBox = h('div', { class: 'pages', style: { '--zoom': 1 } });
  const infoHal = h('span', { class: 'small muted' });
  const infoMasalah = h('button', { class: 'btn sm', type: 'button', onclick: () => tampilCek(false) });
  const nomorTampil = () => L.nomor || (L.nomorMode === 'auto' ? proj : '');
  let lastLay = null;
  const gambarPratinjau = () => {
    const pre = periksa(L, nomorTampil(), { nomorDuplikat: nomorDup });
    const lay = layout(pre.doc); lastLay = lay;
    pagesBox.replaceChildren(...lay.pages.map((pg) => h('div', { class: 'pg-wrap', style: { width: `calc(100% * var(--zoom))`, maxWidth: `calc(${Math.round(lay.paper.wmm * 4.2)}px * var(--zoom))` } }, pageSvg(pg, lay.paper))));
    infoHal.textContent = `${lay.pages.length} halaman · ${lay.paper.name}`;
    const n = pre.wajib.length;
    infoMasalah.replaceChildren(ikon(n ? 'alert' : 'check', 15), h('span', null, n ? `${n} data perlu dilengkapi` : 'Data lengkap'));
    infoMasalah.style.color = n ? 'var(--warn)' : 'var(--ok)';
    for (const k of Object.keys(refs)) refs[k].classList.remove('bad');
    for (const w of pre.wajib) if (w.field && refs[w.field] && (tampilSemua || touched.has(w.field))) refs[w.field].classList.add('bad');
    return pre;
  };
  const jadwalPratinjau = debounce(gambarPratinjau, 140);

  // ---------- Simpan ----------
  const stateEl = h('span', { class: 'state', role: 'status' });
  const setState = (t) => { stateEl.textContent = t; };
  const jam = () => new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
  const autosave = debounce(async () => {
    if (!dirty) return;
    try {
      if (L.status === 'draf') { await simpanRecord(L); await hapusPemulihan(L.id); dirty = false; setState('Draf tersimpan otomatis ' + jam()); if (isNew) { isNew = false; await catat('buat', L); history.replaceState(null, '', '#/editor/' + L.id); perbaruiUR(); } }
      else { await simpanPemulihan(L.id, L); setState('Perubahan belum disimpan · cadangan sementara dibuat'); }
    } catch (e) { setState('Gagal menyimpan otomatis'); }
  }, 1400);
  perbaruiUR();
  const touch = () => { dirty = true; setState('Mengetik…'); jadwalPratinjau(); autosave(); ubahBaru = true; rekam(); };

  async function simpanPenuh({ tanpaNomor = false } = {}) {
    if (perluNomor && !tanpaNomor) {
      if (L.nomorMode === 'auto' && !L.nomor) { const r = await ambil(tpl.kategori, L.fields.tanggal_surat, L.id); L.nomor = r.full; }
      if (L.nomor && await periksaDuplikat(L.nomor, L.id)) { nomorDup = true; gambarPratinjau(); throw new Error('Nomor surat sudah dipakai pada surat lain. Ganti nomor sebelum menyimpan.'); }
    }
    const sudahAda = !!(await ambilSurat(L.id));
    await simpanRecord(L); await hapusPemulihan(L.id);
    await catat(sudahAda ? 'simpan' : 'buat', L);
    dirty = false; isNew = false; history.replaceState(null, '', '#/editor/' + L.id);
    setState('Tersimpan ' + jam()); renderNomor(); judulEl.textContent = tpl.nama;
    return L;
  }
  const aksiSimpan = async () => {
    if (sibuk) return; sibuk = true;
    try { await simpanPenuh(); toast(`Surat disimpan (${STATUS[L.status]}).`); } catch (e) { toast(e.message, 'err', 6000); } finally { sibuk = false; }
  };

  // ---------- Pemeriksaan & ekspor ----------
  function tampilCek(lanjut) {
    tampilSemua = true;
    const pre = gambarPratinjau();
    const daftar = (arr, kelas) => arr.length ? h('ul', { class: 'issues ' + kelas }, arr.map((x) => h('li', null, x.msg))) : null;
    const ok = !pre.wajib.length && !pre.saran.length;
    const body = h('div', null,
      ok ? h('p', null, 'Semua data penting sudah lengkap dan tidak ada masalah yang ditemukan.') : null,
      pre.wajib.length ? h('div', null, h('h4', { style: { color: 'var(--danger)' } }, 'Perlu dilengkapi'), daftar(pre.wajib, '')) : null,
      pre.saran.length ? h('div', { style: { marginTop: '10px' } }, h('h4', { style: { color: 'var(--warn)' } }, 'Perhatian'), daftar(pre.saran, '')) : null,
      pre.wajib.length && lanjut ? h('p', { class: 'hint', style: { marginTop: '10px' } }, 'Jika tetap dilanjutkan, data yang kosong dicetak sebagai titik-titik yang dapat diisi tangan.') : null);
    return new Promise((res) => {
      let sel = false;
      modal({ title: lanjut ? 'Periksa sebelum ekspor' : 'Pemeriksaan dokumen', body, wide: true, onClose: () => { if (!sel) res(false); }, actions: lanjut
        ? [{ label: 'Kembali memperbaiki', onClick: () => { sel = true; res(false); } }, { label: ok ? 'Lanjutkan' : 'Tetap ekspor', kind: 'primary', onClick: () => { sel = true; res(true); } }]
        : [{ label: 'Tutup', kind: 'primary', onClick: () => { sel = true; res(true); } }] });
    });
  }

  const namaFile = (ext) => {
    const jenis = tpl.nama.replace(/^Surat\s+/i, '');
    const no = (L.nomor || '').split('/')[0].trim();
    const th = (parseISO(L.fields.tanggal_surat) || new Date()).getFullYear();
    return namaBerkas([jenis, no, th], ext);
  };

  async function siapkanEkspor() {
    const pre = periksa(L, nomorTampil(), { nomorDuplikat: nomorDup });
    if (pre.wajib.length || pre.saran.length) { if (!(await tampilCek(true))) return null; }
    await simpanPenuh();
    const { doc } = susunDokumen(L, { nomorTampil: L.nomor });
    return { doc, lay: layout(doc) };
  }
  async function eksporPdf() {
    if (sibuk) return; sibuk = true; const b = toastBusy('Menyiapkan PDF…');
    try {
      const s = await siapkanEkspor(); if (!s) return;
      const bytes = await buatPdf(s.lay, { judul: tpl.nama });
      download(new Blob([bytes], { type: 'application/pdf' }), namaFile('pdf'));
      await catat('pdf', L); toast('PDF berhasil dibuat dan diunduh.');
    } catch (e) { console.error(e); toast('Ekspor PDF gagal: ' + e.message, 'err', 7000); } finally { b(); sibuk = false; }
  }
  async function eksporDocx() {
    if (sibuk) return; sibuk = true; const b = toastBusy('Menyiapkan dokumen Word…');
    try {
      const s = await siapkanEkspor(); if (!s) return;
      const blob = await buatDocx(s.doc, { judul: tpl.nama });
      download(blob, namaFile('docx'));
      await catat('docx', L); toast('Dokumen Word berhasil dibuat dan diunduh.');
    } catch (e) { console.error(e); toast('Ekspor Word gagal: ' + e.message, 'err', 7000); } finally { b(); sibuk = false; }
  }
  async function cetak() {
    if (sibuk) return; sibuk = true;
    try {
      const s = await siapkanEkspor(); if (!s) return;
      cetakHalaman(s.lay); await catat('cetak', L);
    } catch (e) { toast('Gagal menyiapkan cetak: ' + e.message, 'err', 7000); } finally { sibuk = false; }
  }
  function toastBusy(t) {
    const box = h('div', { class: 'toast', role: 'status' }, ikon('clock', 16), h('span', null, t));
    let c = document.getElementById('toasts'); if (!c) { c = h('div', { id: 'toasts' }); document.body.append(c); }
    c.append(box); return () => box.remove();
  }

  // ---------- Formulir ----------
  const judulEl = h('div', { class: 'ttl' }, tpl.nama);
  const form = h('div', { class: 'ed-form' });
  const bannerSnap = h('div');

  const snapBerbeda = () => {
    const o1 = JSON.stringify(L.snap.org); const o2 = JSON.stringify(Org.getOrg());
    const lg = (lo) => ['muslimat', 'fatayat', 'alt'].map((k) => (lo[k] ? lo[k].dataUrl.length + ':' + lo[k].dataUrl.slice(-40) : '-')).join('|');
    return (o1 !== o2 || lg(L.snap.logos) !== lg(Org.getLogos())) && L.snapAck !== o2 + lg(Org.getLogos());
  };
  const gambarBanner = () => {
    bannerSnap.replaceChildren();
    if (isNew || !snapBerbeda()) return;
    bannerSnap.append(h('div', { class: 'banner' }, ikon('alert'), h('div', { class: 'grow' }, h('b', null, 'Identitas organisasi telah berubah. '), 'Surat ini masih memakai identitas (nama, alamat, logo) saat dibuat. Pilih tampilan yang diinginkan.'),
      h('div', { class: 'row' }, btn('Perbarui', { kind: 'sm primary', onClick: () => { L.snap.org = clone(Org.getOrg()); L.snap.logos = clone({ muslimat: Org.getLogos().muslimat || null, fatayat: Org.getLogos().fatayat || null, alt: Org.getLogos().alt || null }); touch(); gambarBanner(); toast('Identitas surat diperbarui.'); } }),
        btn('Pertahankan', { kind: 'sm', onClick: () => { const lg = ['muslimat', 'fatayat', 'alt'].map((k) => (Org.getLogos()[k] ? Org.getLogos()[k].dataUrl.length + ':' + Org.getLogos()[k].dataUrl.slice(-40) : '-')).join('|'); L.snapAck = JSON.stringify(Org.getOrg()) + lg; touch(); gambarBanner(); } }))));
  };

  const markTouched = (key, input) => input.addEventListener('blur', () => { touched.add(key); gambarPratinjau(); });

  function fieldEl(f) {
    if (f.type === 'table') return tabelEditor(f);
    const k = kolom({ label: f.label, type: f.type === 'money' ? 'money' : f.type, value: L.fields[f.key] ?? '', options: f.options, ph: f.ph, hint: f.hint, required: f.required, alat: f.type === 'text' || f.type === 'textarea',
      onInput: (v) => { L.fields[f.key] = v; touch(); if (f.key === 'tanggal_surat') refreshProj(); } });
    refs[f.key] = k.el; markTouched(f.key, k.input);
    if (f.type === 'time' || f.type === 'date') k.input.addEventListener('change', () => { L.fields[f.key] = k.input.value; touch(); });
    return k.el;
  }

  function tabelEditor(f) {
    const wrap = h('div', { class: 'fld' });
    const arr = () => (L.fields[f.key] = Array.isArray(L.fields[f.key]) ? L.fields[f.key] : []);
    const gambar = () => {
      const rows = arr();
      const thead = h('tr', null, f.numbered || f.fillFrom ? h('th', null, 'No') : null, f.columns.map((c) => h('th', null, c.label)), h('th', null, ''));
      const tbody = rows.map((r, i) => h('tr', null, f.numbered || f.fillFrom ? h('td', null, String(i + 1)) : null,
        f.columns.map((c) => c.ttd ? h('td', { class: 'small muted' }, '(tanda tangan manual)') : h('td', null, h('input', { value: r[c.key] ?? '', inputmode: c.money ? 'numeric' : undefined, 'aria-label': `${c.label} baris ${i + 1}`, oninput: (e) => { r[c.key] = e.target.value; touch(); } }))),
        h('td', null, h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Hapus baris ${i + 1}`, onclick: () => { rows.splice(i, 1); gambar(); touch(); } }, ikon('trash', 16)))));
      wrap.replaceChildren(h('label', null, f.label, f.required ? h('span', { class: 'req' }, ' *') : null),
        f.fillFrom ? h('div', { class: 'hint' }, 'Baris kosong dibuat otomatis sesuai "Jumlah baris tabel". Isi nama hanya jika ingin dicetak.') : null,
        rows.length ? h('div', { class: 'scroll-x' }, h('table', { class: 'dtbl' }, h('thead', null, thead), h('tbody', null, tbody))) : h('div', { class: 'hint' }, 'Belum ada baris.'),
        h('div', { class: 'row', style: { marginTop: '8px' } }, btn('Tambah baris', { icon: 'plus', kind: 'sm', onClick: () => { rows.push({}); gambar(); touch(); } }), btn('Tambah 5 baris', { kind: 'sm', onClick: () => { for (let i = 0; i < 5; i++) rows.push({}); gambar(); touch(); } })));
    };
    gambar(); refs[f.key] = wrap; return wrap;
  }

  const grup = (g) => FIELDS.filter((f) => f.group === g && f.key !== 'tembusan').map(fieldEl);
  const dua = (nodes) => h('div', { class: 'two' }, nodes);

  // Nomor
  const nomorBox = h('div');
  function renderNomor() {
    if (!perluNomor) return;
    const info = [];
    const radio = (v, t) => h('label', null, h('input', { type: 'radio', name: 'nomorMode', value: v, checked: L.nomorMode === v, onchange: () => { if (v === 'auto') { L.nomor = ''; nomorDup = false; } L.nomorMode = v; touch(); renderNomor(); refreshProj(); } }), t);
    let isi;
    if (L.nomorMode === 'auto') {
      isi = L.nomor
        ? h('div', null, h('div', { class: 'row' }, h('b', null, L.nomor), btn('Lepas nomor', { kind: 'sm', onClick: async () => { if (await konfirmasi('Lepas nomor ini? Nomor baru akan diambil pada penyimpanan berikutnya. Nomor lama tidak dipakai ulang secara otomatis.', { ok: 'Lepas nomor' })) { L.nomor = ''; touch(); renderNomor(); refreshProj(); } } })), h('div', { class: 'hint' }, 'Nomor sudah diambil dan dikunci untuk surat ini.'))
        : h('div', null, h('div', null, 'Perkiraan nomor: ', h('b', null, proj || '…')), h('div', { class: 'hint' }, 'Nomor resmi diambil otomatis saat surat disimpan atau diekspor, sehingga tidak ada nomor ganda.'));
    } else {
      const k = kolom({ label: 'Nomor surat (manual)', value: L.nomor, ph: 'mis. 012/PAR-MFNU/XI/2026', required: true, onInput: async (v) => { L.nomor = v; touch(); nomorDup = v.trim() ? await periksaDuplikat(v, L.id) : false; dup.textContent = nomorDup ? 'Nomor ini sudah dipakai pada surat lain.' : ''; gambarPratinjau(); } });
      const dup = h('div', { class: 'hint', style: { color: 'var(--danger)' } });
      refs.nomor = k.el; markTouched('nomor', k.input);
      isi = h('div', null, k.el, dup);
    }
    nomorBox.replaceChildren(h('div', { class: 'seg', role: 'radiogroup', 'aria-label': 'Cara penomoran' }, radio('auto', 'Nomor otomatis'), radio('manual', 'Nomor manual')), isi, ...info);
  }
  const refreshProj = debounce(async () => {
    if (!perluNomor || L.nomorMode !== 'auto' || L.nomor) return;
    try { proj = (await intip(tpl.kategori, L.fields.tanggal_surat, L.id)).full; } catch (e) { proj = ''; }
    renderNomor(); gambarPratinjau();
  }, 200);

  // Penutup
  const penutupBox = () => {
    const ta = h('textarea', { rows: 3, oninput: (e) => { L.penutup = e.target.value; touch(); }, 'aria-label': 'Kalimat penutup' }); ta.value = L.penutup || '';
    return h('div', null,
      (tpl.closings || []).length ? h('div', { class: 'fld' }, h('label', null, 'Pilih kalimat penutup'), h('select', { onchange: (e) => { if (e.target.value !== '') { L.penutup = tpl.closings[+e.target.value]; ta.value = L.penutup; touch(); } e.target.value = ''; } }, h('option', { value: '' }, 'Pilih untuk mengganti…'), tpl.closings.map((c, i) => h('option', { value: String(i) }, c.length > 90 ? c.slice(0, 88) + '…' : c)))) : null,
      h('div', { class: 'fld' }, h('label', null, 'Kalimat penutup'), barAlat(ta, 'kalimat penutup'), ta, h('div', { class: 'hint' }, 'Boleh diubah sesuai kebutuhan. Kosongkan jika tidak diperlukan.')));
  };

  // Salam pembuka dan penutup: contoh siap pakai, bisa dihidupkan/dimatikan terpisah, dan teksnya dapat diubah.
  const SALAM_CONTOH = {
    lengkap: { nama: 'Islami lengkap', ket: "Assalamu'alaikum Warahmatullahi Wabarakatuh", pembuka: "Assalamu'alaikum Warahmatullahi Wabarakatuh", penutup: "Wassalamu'alaikum Warahmatullahi Wabarakatuh", ikon: [["Assalamu'alaikum", 7, 14], ['Warahmatullahi', 7, 24], ['Wabarakatuh', 7, 32]] },
    singkat: { nama: 'Islami singkat', ket: "Assalamu'alaikum Wr. Wb.", pembuka: "Assalamu'alaikum Wr. Wb.", penutup: "Wassalamu'alaikum Wr. Wb.", ikon: [["Assalamu'alaikum", 7, 18], ['Wr. Wb.', 7, 28]] },
    sejahtera: { nama: 'Salam sejahtera', ket: 'Salam umum lintas keyakinan', pembuka: 'Salam sejahtera bagi kita semua,', penutup: 'Salam sejahtera.', ikon: [['Salam sejahtera', 7, 18], ['bagi kita semua,', 7, 28]] },
  };
  function panelSalam() {
    const box = h('div', { class: 'fld' });
    const S = () => { const st = L.snap.set; st.salam = st.salam || {}; return st.salam; };
    const cocok = () => Object.keys(SALAM_CONTOH).find((k) => SALAM_CONTOH[k].pembuka === S().pembuka && SALAM_CONTOH[k].penutup === S().penutup) || 'sendiri';
    const gbr = () => {
      const s = S(); s.gaya = { b: false, i: false, color: '#000000', size: 0, f: '', ...(s.gaya || {}) }; if (s.gayaPenutup) s.gayaPenutup = { b: false, i: false, color: '#000000', size: 0, f: '', ...s.gayaPenutup };
      const kids = [h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: !!L.salamPakai, onchange: (e) => { L.salamPakai = e.target.checked; gbr(); touch(); } }), h('span', null, 'Pakai salam pembuka dan penutup', h('div', { class: 'hint' }, 'Salam dicetak di awal surat (sebelum isi) dan di akhir (setelah kalimat penutup). Matikan bila surat tidak memakai salam.')))];
      if (L.salamPakai) {
        kids.push(pilih({ label: 'Contoh salam', value: cocok(), onInput: (v) => { if (v === 'sendiri') return; s.pembuka = SALAM_CONTOH[v].pembuka; s.penutup = SALAM_CONTOH[v].penutup; s.pakaiPembuka = true; s.pakaiPenutup = true; gbr(); touch(); },
          options: [...Object.entries(SALAM_CONTOH).map(([k, c]) => [k, c.nama, c.ket, tek(...c.ikon)]), ['sendiri', 'Tulis sendiri', 'Ubah teks salam di bawah', tek(['Salam ...', 7, 18], ['(bebas)', 7, 28])]] }).el,
          h('div', { class: 'row', style: { gap: '2px 22px' } },
            cek('Salam pembuka dicetak', () => s.pakaiPembuka !== false, (v) => { s.pakaiPembuka = v; touch(); }),
            cek('Salam penutup dicetak', () => s.pakaiPenutup !== false, (v) => { s.pakaiPenutup = v; touch(); })),
          h('div', { class: 'two' },
            kolom({ label: 'Teks salam pembuka', alat: true, value: s.pembuka || '', onInput: (v) => { s.pembuka = v; touch(); } }).el,
            kolom({ label: 'Teks salam penutup', alat: true, value: s.penutup || '', onInput: (v) => { s.penutup = v; touch(); } }).el),
          h('b', { class: 'small' }, 'Gaya huruf salam pembuka'),
          alatGaya(s.gaya, 'salam pembuka', (fn) => (v) => { fn(v); touch(); }),
          h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: s.gayaSama !== false, onchange: (e) => { s.gayaSama = e.target.checked; if (!e.target.checked && !s.gayaPenutup) s.gayaPenutup = { ...s.gaya }; gbr(); touch(); } }), h('span', null, 'Salam penutup memakai gaya yang sama')),
          s.gayaSama === false ? h('div', null, h('b', { class: 'small' }, 'Gaya huruf salam penutup'), alatGaya(s.gayaPenutup, 'salam penutup', (fn) => (v) => { fn(v); touch(); })) : null,
          h('div', { class: 'hint' }, 'Ukuran 0 = ikut ukuran huruf dokumen. Jarak dan perataan salam diatur di Format dan tata letak, bagian "Salam pembuka dan penutup".'));
      }
      box.replaceChildren(...kids);
    };
    gbr(); return box;
  }
  // Isi surat
  const be = editorBlok({ blocks: L.body, tpl, onChange: touch });
  const isiSeksi = () => h('div', null,
    tpl.kind !== 'dokumen' && tpl.salam !== false ? panelSalam() : null,
    be.el,
    h('div', { class: 'row', style: { marginTop: '10px' } }, btn('Kembalikan isi ke template awal', { icon: 'refresh', kind: 'sm', onClick: async () => { if (await konfirmasi('Isi surat akan dikembalikan ke susunan awal template. Perubahan pada paragraf akan hilang (data formulir tetap).', { ok: 'Kembalikan', bahaya: true })) { L.body.splice(0, L.body.length, ...tpl.body.map((b) => ({ id: uid(), ...clone(b) }))); be.rerender(); touch(); toast('Isi dikembalikan ke template awal.'); } } })),
    (tpl.closings || []).length || tpl.kind !== 'dokumen' ? h('div', { style: { marginTop: '14px' } }, penutupBox()) : null,
    tpl.kind !== 'dokumen' ? FIELDS.filter((f) => f.key === 'tembusan').map(fieldEl) : null);

  // Penandatangan
  const sigBox = h('div');
  const org0 = () => Org.getOrg();
  const BARIS_OPSI = [['1', 'Baris 1 (utama)'], ['2', 'Baris 2 (di bawahnya)'], ['3', 'Baris 3'], ['4', 'Baris 4']];
  function tambahPenandatangan() {
    const sg = L.signers; const pakai = new Set(sg.map((s) => s.role));
    const r = peranTersedia(org0()).find((x) => !pakai.has(x) && x !== 'lain' && x !== 'pembuat') || 'lain';
    const info = infoPeran(org0(), r);
    let baris = 1; while (sg.filter((s) => (s.baris || 1) === baris).length >= 3 && baris < 4) baris++;
    const used = new Set(sg.filter((s) => (s.baris || 1) === baris).map((s) => s.posisi));
    sg.push({ role: r, jabatan: info.jabatan, nama: info.nama || '', org: '', gambar: null, posisi: ['kanan', 'kiri', 'tengah'].find((p) => !used.has(p)) || 'kanan', baris, pengantar: '', ket: '' });
  }
  async function renderSig() {
    sigBox.replaceChildren();
    const sg = L.signers; const T = L.ttd; const org = org0();
    const presets = await daftarTtdPreset();
    const peranOpsi = daftarPeran(org).map((p) => [p.id, p.id === 'lain' ? 'Isian bebas' : (p.jabatan || p.id)]);
    const ubahT = (fn) => (v) => { fn(v); touch(); };
    const modeTtd = () => T.susunan || ((T.pengantar || '').trim() ? (T.instansi ? 'hormat+org' : 'hormat') : (T.instansi ? 'org' : 'tidak'));
    const taPeng = h('textarea', { id: 'inp-pengantar', rows: 2, placeholder: 'mis. Hormat kami,', oninput: (e) => { T.pengantar = e.target.value; touch(); } }); taPeng.value = T.pengantar || '';
    const langkah = (n, judul, ket) => h('div', { class: 'langkah' }, h('b', null, `${n}. ${judul}`), ket ? h('span', { class: 'small muted' }, ket) : null);
    const headRow = h('div', { class: 'row between', style: { margin: '12px 0 10px' } }, h('b', null, `${sg.length} penandatangan`),
        h('div', { class: 'row' }, btn('Tambah', { icon: 'plus', kind: 'sm', disabled: sg.length >= 12, onClick: () => { tambahPenandatangan(); renderSig(); touch(); } }),
          btn('Atur posisi otomatis', { kind: 'sm', disabled: !sg.length, onClick: () => { posisiDefault(sg); renderSig(); touch(); } })));
    const modelPanel = h('details', { class: 'sub', open: true }, h('summary', null, `Pilih model tanda tangan (${Object.keys(TTD_MODEL).length} contoh)`),
      h('div', { class: 'hint' }, 'Klik salah satu contoh untuk memakai susunannya sekaligus. Nama dan gambar tanda tangan yang sudah diisi tetap dipertahankan; semua bagian masih bisa diatur satu per satu di bawahnya.'),
      galeri({ items: Object.entries(TTD_MODEL), tetap: false, label: 'Model tanda tangan', gambar: miniTtd, ringkas: ringkasTtd, tombol: 'Pakai model ini', onPilih: async (k, m) => { if (!(await konfirmasi(`Pakai model "${m.nama}"? Susunan, posisi, dan gaya tanda tangan akan diganti. Nama dan gambar penandatangan tetap.`, { ok: 'Pakai' }))) return; terapkanTtdModel(L, m, org); renderSig(); renderFormat(); touch(); toast('Model tanda tangan dipakai. Bisa dibatalkan dengan Undo.'); } }).el);
    sigBox.append(
      petunjuk('Bagian penutup surat: kota-tanggal, jabatan, ruang tanda tangan, dan nama terang. Tambahkan penandatangan lain bila surat ditandatangani lebih dari satu orang. Gambar tanda tangan/stempel bisa diunggah di tiap penandatangan.', 'Tanda tangan'),
      modelPanel,
      langkah(1, 'Siapa yang menandatangani', 'Tambah orang, atur peran, jabatan, nama, posisi, dan baris.'),
      headRow);
    const bentrok = masalahTtd(sg);
    if (bentrok.length) sigBox.append(h('div', { class: 'banner' }, ikon('alert'), h('div', { class: 'grow' }, bentrok.map((m) => h('div', null, m)))));
    sg.forEach((s, i) => {
      sigBox.append(h('div', { class: 'sig' }, h('div', { class: 'row between' }, h('b', { class: 'small' }, `Penandatangan ${i + 1}`), h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Hapus penandatangan ${i + 1}`, onclick: () => { sg.splice(i, 1); renderSig(); touch(); } }, ikon('trash', 16))),
        h('div', { class: 'two', style: { marginTop: '8px' } },
          kolom({ label: 'Peran', type: 'select', value: s.role, options: peranOpsi, onInput: (v) => { const lama = infoPeran(org, s.role); if (s.jabatan === lama.jabatan) s.jabatan = infoPeran(org, v).jabatan; if (!s.nama || s.nama === lama.nama) s.nama = infoPeran(org, v).nama || ''; s.role = v; renderSig(); touch(); } }).el,
          kolom({ label: 'Jabatan', alat: true, value: s.jabatan, onInput: (v) => { s.jabatan = v; touch(); } }).el,
          kolom({ label: 'Nama lengkap (termasuk gelar)', alat: true, value: s.nama, ph: infoPeran(org, s.role).nama || 'Nama lengkap', hint: 'Kosong = memakai nama pada Data Organisasi.', onInput: (v) => { s.nama = v; touch(); } }).el,
          kolom({ label: 'Keterangan di bawah nama (mis. NIP)', alat: true, value: s.ket || '', onInput: (v) => { s.ket = v; touch(); } }).el,
          pilih({ label: 'Posisi tanda tangan', value: s.posisi, onInput: (v) => { s.posisi = v; renderSig(); touch(); }, options: [['kiri', 'Kiri', '', IKON.ttdKiri], ['tengah', 'Tengah', '', IKON.ttdTengah], ['kanan', 'Kanan', '', IKON.ttdKanan]] }).el,
          kolom({ label: 'Baris', type: 'select', value: String(s.baris || 1), options: BARIS_OPSI, onInput: (v) => { s.baris = +v; renderSig(); touch(); } }).el,
          kolom({ label: 'Pengantar khusus orang ini', alat: true, value: s.pengantar || '', ph: 'mis. Mengetahui, / Menyetujui,', onInput: (v) => { s.pengantar = v; touch(); } }).el,
          kolom({ label: 'Nama organisasi di atas jabatan orang ini (opsional)', alat: true, hint: 'Kosong = memakai nama organisasi umum di atas.', value: s.org || '', onInput: (v) => { s.org = v; touch(); } }).el,
          kolom({ label: 'Teks tambahan di atas jabatan', alat: true, type: 'textarea', rows: 2, value: s.tambahAtas || '', ph: 'mis. a.n. Ketua Umum', onInput: (v) => { s.tambahAtas = v; touch(); } }).el,
          kolom({ label: 'Teks tambahan di bawah nama', alat: true, type: 'textarea', rows: 2, value: s.tambahBawah || '', ph: 'mis. NIM / NBM / NIP', onInput: (v) => { s.tambahBawah = v; touch(); } }).el),
        panelGambarTtd(s, T.ruang ?? set0().ruangTtd ?? 62, { onChange: touch, ulang: renderSig })));
    });
    sigBox.append(
      langkah(2, 'Teks di atas jabatan dan tampilan', 'Hormat kami, nama organisasi, jarak, perataan, dan huruf.'),
      pilih({ label: 'Susunan teks di atas jabatan', value: modeTtd(), onInput: (v) => { T.susunan = v; T.instansi = v.includes('org'); if (v.includes('hormat') && !(T.pengantar || '').trim()) T.pengantar = 'Hormat kami,'; renderSig(); touch(); },
        options: [['hormat+org', 'Hormat kami + organisasi', 'Hormat kami dahulu, lalu nama organisasi', IKON.ttdHO], ['org', 'Hanya organisasi', 'Tanpa Hormat kami', IKON.ttdO], ['hormat', 'Hanya Hormat kami', 'Tanpa nama organisasi', IKON.ttdH], ['tidak', 'Tidak ada', 'Langsung jabatan', IKON.ttdN]] }).el,
      modeTtd().includes('hormat') ? h('div', { class: 'fld' }, h('label', { for: 'inp-pengantar' }, 'Teks pengantar (Hormat kami, dst.)'), barAlat(taPeng, 'pengantar'), taPeng, h('div', { class: 'hint' }, 'Pilihan cepat: ', PENGANTAR_TTD.filter(Boolean).map((x) => h('button', { type: 'button', class: 'chip', onclick: () => { T.pengantar = x; renderSig(); touch(); } }, x.replace(/,$/, ''))), '. Boleh lebih dari satu baris.')) : null,
      modeTtd().includes('org') ? kolom({ label: 'Nama organisasi (di bawah Hormat kami)', alat: true, value: T.orgTeks || '', ph: Org.namaOrgSatuBaris(org) || 'Nama organisasi', hint: 'Kosong = memakai nama pada Data Organisasi. Berlaku untuk semua penandatangan, kecuali yang diisi khusus di bawah.', onInput: ubahT((v) => { T.orgTeks = v; }) }).el : null,
      h('div', { class: 'two' },
        pilih({ label: 'Posisi teks pengantar (Hormat kami, dst.)', value: T.pengantarPosisi || 'auto', onInput: ubahT((v) => { T.pengantarPosisi = v; }), options: [['auto', 'Otomatis', 'Ikut penandatangan', IKON.ttdAuto], ['kiri', 'Kiri', '', IKON.ttdKiri], ['tengah', 'Tengah', '', IKON.ttdTengah], ['kanan', 'Kanan', '', IKON.ttdKanan]] }).el,
        pilih({ label: 'Jarak antarkolom tanda tangan', value: T.jarak || 'normal', onInput: ubahT((v) => { T.jarak = v; }), options: [['rapat', 'Rapat', 'Kolom berdekatan', IKON.jarakKolomRapat], ['normal', 'Normal', '', IKON.jarakKolomNormal], ['lebar', 'Lebar', 'Kolom berjauhan', IKON.jarakKolomLebar]] }).el,
        kolom({ label: 'Jarak jabatan ke area tanda tangan (pt)', type: 'number', min: 0, max: 60, value: T.jarakJabatan ?? 0, onInput: ubahT((v) => { T.jarakJabatan = Math.min(60, Math.max(0, +v || 0)); }) }).el,
        kolom({ label: 'Jarak area tanda tangan ke nama terang (pt)', type: 'number', min: 0, max: 60, value: T.jarakNama ?? 0, onInput: ubahT((v) => { T.jarakNama = Math.min(60, Math.max(0, +v || 0)); }) }).el,
        kolom({ label: 'Ruang tanda tangan (mm)', type: 'number', min: 10, max: 60, value: Math.round((T.ruang ?? set0().ruangTtd ?? 62) * 25.4 / 72), onInput: ubahT((v) => { T.ruang = Math.round(Math.min(60, Math.max(10, +v || 22)) * 72 / 25.4); }) }).el),
      pilih({ label: 'Perataan teks tanda tangan', value: T.rata || 'center', onInput: ubahT((v) => { T.rata = v; }), options: [['center', 'Tengah', 'Jabatan dan nama di tengah kolom', IKON.ttdTengah], ['left', 'Rata kiri', 'Jabatan dan nama sejajar kiri, seperti surat dinas', IKON.ttdKiri]] }).el,
      h('div', { class: 'row', style: { gap: '2px 22px' } },
        cek('Tampilkan jabatan', () => T.jabatan !== false, ubahT((v) => { T.jabatan = v; })),
        cek('Garis bawah pada nama', () => T.garisNama !== false, ubahT((v) => { T.garisNama = v; }))),
      h('details', { class: 'sub', open: true }, h('summary', null, 'Atur huruf tiap bagian (tebal, miring, ukuran, jenis huruf, warna)'), panelGayaTtd(T, { onChange: touch })),
      langkah(3, 'Kota dan tanggal penandatanganan', 'Pilih letaknya di surat.'),
      pilih({ label: 'Letak kota dan tanggal (mis. Pemalang, 10 Desember 2026)', value: ['ttd', 'bawah'].includes(set0().tanggalPosisi) ? set0().tanggalPosisi : 'atas', onInput: (v) => { set0().tanggalPosisi = v; renderSig(); renderFormat(); touch(); },
        options: [['atas', 'Kanan atas surat', 'Di pojok kanan atas, sejajar nomor surat', IKON.tglAtas], ['ttd', 'Atas tanda tangan', 'Pojok kanan bawah, tepat di atas jabatan', IKON.tglTtd], ['bawah', 'Bawah tanda tangan', 'Di bawah nama penandatangan', IKON.tglBawah]] }).el,
      ['ttd', 'bawah'].includes(set0().tanggalPosisi) ? h('div', null,
        sg.length > 1 ? kolom({ label: 'Dicantumkan pada penandatangan', type: 'select', value: T.tglSigner === undefined || T.tglSigner === '' ? 'auto' : String(T.tglSigner), options: [['auto', 'Otomatis (yang paling kanan)'], ...sg.map((s, i) => [String(i), `Penandatangan ${i + 1}: ${s.jabatan || s.role}`])], hint: 'Kota dan tanggal hanya dicantumkan satu kali.', onInput: ubahT((v) => { T.tglSigner = v; }) }).el : null,
        pilih({ label: 'Perataan kota dan tanggal', value: T.tglRata || 'left', onInput: ubahT((v) => { T.tglRata = v; }), options: [['left', 'Rata kiri', 'Sejajar tepi kiri kolom', IKON.rataKiri], ['center', 'Tengah', 'Di tengah kolom', IKON.tengahPendek], ['right', 'Rata kanan', 'Rapat tepi kanan', IKON.kanan]] }).el) : null,
      h('div', { class: 'two', style: { marginTop: '10px' } },
        kolom({ label: 'Kota penandatanganan', alat: true, value: L.kotaTtd || '', onInput: (v) => { L.kotaTtd = v; touch(); } }).el,
        kolom({ label: 'Tanggal penandatanganan', type: 'date', value: L.tanggalTtd || '', hint: 'Kosong = sama dengan tanggal surat.', onInput: (v) => { L.tanggalTtd = v; touch(); } }).el),
      langkah(4, 'Gambar tanda tangan, stempel, dan kode QR', 'Opsional.'),
      sg.length ? h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: !!L.ttdGambar, onchange: (e) => { L.ttdGambar = e.target.checked; touch(); } }), h('span', null, 'Cetak dengan gambar tanda tangan yang diunggah', h('div', { class: 'hint' }, 'Gambar hanyalah tampilan visual. Ini bukan tanda tangan elektronik tersertifikasi dan tidak otomatis memiliki kekuatan hukum tertentu. Matikan untuk mencetak ruang kosong.'))) : null,
      sg.length ? panelQR(L, { touch, org }) : null,
      h('div', { class: 'sig' }, h('b', { class: 'small' }, 'Susunan tanda tangan tersimpan'),
        h('div', { class: 'row', style: { marginTop: '8px' } },
          presets.length ? h('select', { class: 'inp', style: { width: 'auto', maxWidth: '240px' }, 'aria-label': 'Pakai susunan tersimpan', onchange: (e) => { const p = presets.find((x) => x.id === e.target.value); e.target.value = ''; if (!p) return; L.ttd = { ...DEFAULT_TTD, ...clone(p.ttd), gaya: merge(DEFAULT_TTD.gaya, p.ttd && p.ttd.gaya) }; L.signers = p.signers.map((x) => ({ ...clone(x), nama: infoPeran(org, x.role).nama || '', gambar: null })); renderSig(); touch(); toast('Susunan tanda tangan dipakai.'); } }, h('option', { value: '' }, 'Pakai susunan tersimpan…'), presets.map((p) => h('option', { value: p.id }, p.nama))) : h('span', { class: 'small muted' }, 'Belum ada susunan tersimpan.'),
          btn('Simpan susunan ini', { icon: 'save', kind: 'sm', onClick: async () => { const nm = await tanya('Nama susunan tanda tangan (mis. Ketua dan Sekretaris)', { judul: 'Simpan susunan tanda tangan' }); if (!nm) return; await simpanTtdPreset({ id: uid(), nama: nm, ttd: clone(L.ttd), signers: L.signers.map(({ role, jabatan, posisi, baris, pengantar, org: o, ket, tambahAtas, tambahBawah }) => ({ role, jabatan, posisi, baris, pengantar, org: o, ket, tambahAtas, tambahBawah })) }); toast('Susunan tersimpan. Dapat dipakai di surat lain.'); renderSig(); } }),
          presets.length ? h('select', { class: 'inp', style: { width: 'auto', maxWidth: '200px' }, 'aria-label': 'Hapus susunan tersimpan', onchange: async (e) => { const id = e.target.value; e.target.value = ''; if (id && await konfirmasi('Hapus susunan tanda tangan tersimpan ini?', { ok: 'Hapus', bahaya: true })) { await hapusTtdPreset(id); renderSig(); } } }, h('option', { value: '' }, 'Hapus susunan…'), presets.map((p) => h('option', { value: p.id }, p.nama))) : null)));
  }
  const set0 = () => L.snap.set;

  // Kop
  const kopBox = h('div');
  function renderKop() {
    const set = L.snap.set;
    const radio = (v, t) => h('label', { class: 'kopopt' }, h('input', { type: 'radio', name: 'kop', value: v, checked: L.kop === v, onchange: () => { L.kop = v; touch(); renderKop(); } }), svgNode(KOP_SVG[v]), h('div', null, t));
    const slotSel = (label, key) => kolom({ label, type: 'select', value: L[key] || 'none', options: ['muslimat', 'fatayat', 'alt', 'none'].map((s) => [s, SLOT_NAMA[s] + (s !== 'none' && !L.snap.logos[s] ? ' (belum diunggah)' : '')]), onInput: (v) => { L[key] = v; touch(); renderKop(); } }).el;
    const sinkron = (slot) => { L.snap.logos[slot] = Org.getLogos()[slot] ? clone(Org.getLogos()[slot]) : null; touch(); renderKop(); };
    kopBox.replaceChildren(...[
      petunjuk('Kop adalah kepala surat berisi nama lembaga, alamat, dan logo. Pilih salah satu model di bawah; isinya diatur di menu Pengaturan lembaga.', 'Apa itu kop?'),
      h('div', { class: 'kopsel', role: 'radiogroup', 'aria-label': 'Pilihan kop surat' }, radio('logo', 'Kop dengan logo'), radio('nologo', 'Kop tanpa logo'), radio('none', 'Tanpa kop')),
      L.kop === 'logo' ? h('div', null,
        h('div', { class: 'two' }, slotSel('Logo sisi kiri (pilih "Tanpa logo" bila tidak dipakai)', 'logoKiri'), slotSel('Logo sisi kanan', 'logoKanan')),
        ['muslimat', 'fatayat', 'alt'].map((s) => panelLogo(s, { onChange: () => sinkron(s) })),
        h('div', { class: 'two' },
          kolom({ label: 'Ukuran logo kiri (mm)', type: 'number', min: 10, max: 40, value: set.logoUkuran[L.logoKiri] || 22, onInput: (v) => { set.logoUkuran[L.logoKiri] = Math.min(40, Math.max(10, +v || 22)); touch(); } }).el,
          kolom({ label: 'Ukuran logo kanan (mm)', type: 'number', min: 10, max: 40, value: set.logoUkuran[L.logoKanan] || 22, onInput: (v) => { set.logoUkuran[L.logoKanan] = Math.min(40, Math.max(10, +v || 22)); touch(); } }).el),
        h('p', { class: 'hint' }, 'Logo mempertahankan rasio aslinya dan tidak diregangkan. Bila logo belum diunggah, hanya muncul kotak penanda di pratinjau, tidak ikut tercetak.')) : null,
      L.kop !== 'none' ? seksi('Gaya kop: huruf, warna, garis pemisah, jarak', panelKop(set.kop, { onChange: touch }), { open: false }) : null].filter(Boolean));
  }
  const formatBox = h('div');
  async function renderFormat() {
    const saved = await daftarFormatPreset();
    const terapkan = async (m, nama) => {
      if (!(await konfirmasi(`Terapkan "${nama}"? Pengaturan tata letak, font, kop, dan gaya tanda tangan surat ini akan diganti. Isi dan kalimat surat tidak berubah.`, { ok: 'Terapkan' }))) return;
      terapkanFormat(L, m); delete L.ttd.ruang; renderFormat(); renderKop(); renderSig(); touch(); toast('Format diterapkan.');
    };
    // Pratinjau besar memakai isi surat ini sendiri dengan format contoh terpilih (surat asli tidak diubah).
    const pratinjauFormat = (m) => {
      try {
        const salin = clone(L); terapkanFormat(salin, m); delete salin.ttd.ruang;
        const lay = layout(periksa(salin, nomorTampil(), { nomorDuplikat: false }).doc);
        return h('div', { class: 'lihat-hal' }, lay.pages.slice(0, 3).map((pg) => h('div', { class: 'pg-wrap' }, pageSvg(pg, lay.paper))));
      } catch (e) { return null; }
    };
    const opt = (k, m) => h('option', { value: k }, m.nama);
    const semua = [...Object.entries(FORMAT_SURAT), ...Object.entries(MODEL_GAYA), ...Object.entries(MODEL_COMPANY), ...saved.map((m) => ['s:' + m.id, m])];
    const modelSel = h('div', { class: 'fld' }, h('label', null, 'Format dan model surat'),
      petunjuk('Klik salah satu contoh untuk memakai tata letaknya. Gambar menunjukkan letak kop, nomor, penerima, isi, dan tanda tangan. Isi surat tidak berubah dan semua bagian tetap bisa diatur.', 'Contoh format'),
      h('details', { class: 'sub', open: true }, h('summary', null, `Lihat ${semua.length} contoh format`),
        galeri({ items: semua, tetap: false, pratinjau: (k, m) => pratinjauFormat(m), onPilih: async (k, m) => { await terapkan(m, m.nama); } }).el),
      h('div', { class: 'hint' }, 'Mengganti tata letak sekaligus; setiap elemen tetap bisa diatur satu per satu setelahnya. Isi surat tidak diubah.'),
      h('div', { class: 'row', style: { marginTop: '8px' } },
        btn('Simpan format ini', { icon: 'save', kind: 'sm', onClick: async () => { const nm = await tanya('Nama format (mis. Undangan Kampus)', { judul: 'Simpan format surat' }); if (!nm) return; await simpanFormatPreset({ id: uid(), nama: nm, ket: 'Format buatan sendiri', ...ambilFormat(L) }); toast('Format tersimpan dan tersedia di daftar format.'); renderFormat(); } }),
        saved.length ? h('select', { class: 'inp', style: { width: 'auto', maxWidth: '200px' }, 'aria-label': 'Hapus format tersimpan', onchange: async (e) => { const id = e.target.value; e.target.value = ''; if (id && await konfirmasi('Hapus format tersimpan ini?', { ok: 'Hapus', bahaya: true })) { await hapusFormatPreset(id); renderFormat(); } } }, h('option', { value: '' }, 'Hapus format tersimpan…'), saved.map((m) => h('option', { value: m.id }, m.nama))) : null));
    formatBox.replaceChildren(modelSel, panelFormat(L.snap.set, { onChange: touch, kertas: { get: () => L.kertas, set: (v) => { L.kertas = v; } } }),
      h('p', { class: 'hint' }, 'Pengaturan ini hanya berlaku untuk surat ini. Pengaturan bawaan untuk semua surat baru ada di menu Pengaturan. Format tiap paragraf diatur lewat tombol "Format blok…" pada isi surat.'));
  }

  const statusBox = () => kolom({ label: 'Status dokumen', type: 'select', value: L.status, options: Object.entries(STATUS), hint: 'Draf disimpan otomatis. Status lain disimpan lewat tombol Simpan.', onInput: (v) => { L.status = v; touch(); if (v !== 'draf') setState('Tekan Simpan untuk menerapkan status.'); } }).el;

  async function jadikanTemplate() {
    let nama = ''; let isian = false; let format = true;
    const k = kolom({ label: 'Nama template baru', value: `${tpl.nama} (milik saya)`, onInput: (v) => { nama = v; } }); nama = k.input.value;
    const body = h('div', null, k.el,
      cek('Sertakan format surat ini (font, margin, gaya kop, spasi)', () => format, (v) => { format = v; }),
      cek('Sertakan isian formulir saat ini sebagai nilai awal', () => isian, (v) => { isian = v; }, 'Tanggal, nomor, dan data penerima tidak ikut disalin.'),
      h('p', { class: 'hint' }, 'Isi surat, susunan tanda tangan, dan kalimat penutup selalu ikut tersimpan.'));
    modal({ title: 'Simpan sebagai template', body, actions: [{ label: 'Batal' }, { label: 'Simpan template', kind: 'primary', onClick: async () => {
      if (!nama.trim()) { toast('Nama template wajib diisi.', 'err'); return false; }
      const T = clone(L.tpl); delete T.override; delete T.baseId; T.builtin = false; T.id = uid(); T.nama = nama.trim(); T.favorite = false;
      T.body = L.body.map(({ id, ...b }) => clone(b));
      T.signer = L.signers.map(({ role, jabatan, posisi, baris, pengantar, org: o, ket, tambahAtas, tambahBawah }) => ({ role, jabatan, posisi, baris, pengantar, org: o, ket, tambahAtas, tambahBawah }));
      T.ttd = clone(L.ttd); T.salam = L.salamPakai; T.kop = L.kop;
      T.closings = [L.penutup, ...(T.closings || []).filter((c) => c !== L.penutup)].filter(Boolean);
      if (format) { const s2 = L.snap.set; T.format = clone({ font: s2.font, ukuranFont: s2.ukuranFont, spasi: s2.spasi, jarakParagraf: s2.jarakParagraf, indentParagraf: s2.indentParagraf, indentUkuran: s2.indentUkuran, rataTeks: s2.rataTeks, margin: s2.margin, tanggalPosisi: s2.tanggalPosisi, kop: s2.kop, kertas: L.kertas }); }
      if (isian) { const d = { ...(T.defaults || {}) }; for (const f of allFields(tpl)) { const v = L.fields[f.key]; if (f.type !== 'table' && v && !['tanggal_surat', 'nama_penerima', 'jabatan_penerima', 'instansi_penerima', 'alamat_penerima', 'tembusan'].includes(f.key)) d[f.key] = v; } T.defaults = d; }
      await simpanTemplate(T); toast('Template tersimpan. Lihat di menu Template Surat.');
    } }] });
  }

  // ---------- Rakit ----------
  const identitas = [];
  if (perluNomor) identitas.push(nomorBox);
  if (tpl.judul) identitas.push(kolom({ label: 'Judul dokumen', value: tpl.judul, onInput: (v) => { L.tpl.judul = v; touch(); } }).el);
  identitas.push(petunjuk('Klik sebuah kolom isian, lalu tombol Tebal, Miring, Garis bawah, Warna dan Tx (hapus format) muncul di atasnya. Blok teks dulu untuk memformat sebagian kata.', 'Format teks'));
  identitas.push(dua(grup('identitas')));
  const sections = [];
  let no = 0;
  const S = (judul, isi, open = true) => sections.push(seksi(judul, isi, { open, nomor: ++no }));
  if (tpl.groups?.identitas) S('Identitas surat', identitas);
  const tataPenerima = () => {
    const B = () => bagianTetap(L.snap.set).penerima; // selalu ambil yang terbaru (panel Format dapat menggantinya)
    const box = h('div', { class: 'sig' });
    const gbr = () => box.replaceChildren(h('b', { class: 'small' }, 'Tata letak blok penerima'),
      h('div', { class: 'two', style: { marginTop: '8px' } },
        pilih({ label: 'Posisi blok "Kepada Yth."', value: B().tata, onInput: (v) => { B().tata = v; gbr(); touch(); }, options: [['kiri', 'Rata kiri', 'Sejajar tepi kiri', IKON.kiri], ['menjorok', 'Menjorok ke kanan', 'Masuk dari tepi kiri', IKON.menjorok]] }).el,
        B().tata === 'menjorok' ? kolom({ label: 'Jarak menjorok dari tepi kiri (mm)', type: 'number', min: 0, max: 90, value: B().indent, hint: 'Contoh: 12 mm (sedikit), 40 mm, 95 mm (sisi kanan)', onInput: (v) => { B().indent = Math.min(90, Math.max(0, +v || 0)); touch(); } }).el : null),
      pilihTempat(B, touch),
      cek('Cetak nama dan alamat penerima dengan huruf tebal', () => B().tebalNama, (v) => { B().tebalNama = v; touch(); }),
      h('p', { class: 'hint' }, 'Hanya memengaruhi blok penerima; nomor, perihal, dan isi surat tidak bergeser.'));
    gbr(); return box;
  };
  if (tpl.groups?.penerima) S('Penerima surat', [dua(grup('penerima')), tataPenerima()]);
  if (tpl.groups?.kegiatan) S('Informasi kegiatan', [dua(grup('kegiatan'))]);
  const khusus = grup('khusus'); if (khusus.length) S(tpl.kind === 'dokumen' ? 'Data dokumen' : 'Data tambahan', khusus);
  S('Isi surat dan penutup', isiSeksi());
  // Lampiran: halaman tambahan setelah surat (daftar hadir, susunan acara, dll.), kop dapat diulang.
  const panelLampiran = () => {
    const LP = () => (L.lampiran = L.lampiran || { pakai: false, judul: 'LAMPIRAN', kop: true, rujukan: true, blok: [] });
    const box = h('div');
    const gbr = () => {
      const P = LP();
      const isi = (judul, kolomTeks, barisTeks, ekstra) => async () => {
        if (P.blok.length && !(await konfirmasi('Isi lampiran saat ini akan diganti dengan contoh ini. Lanjutkan?', { ok: 'Ganti', bahaya: true }))) return;
        P.pakai = true; P.judul = judul; P.blok.splice(0, P.blok.length, Object.assign(baruBlok('tabelbebas', tpl), { kolomTeks, barisTeks, ...urai(kolomTeks, barisTeks), ...ekstra }));
        gbr(); touch();
      };
      box.replaceChildren(
        petunjuk('Lampiran adalah halaman tambahan setelah surat, misalnya daftar hadir atau susunan acara. Kop surat bisa diulang di halaman lampiran, dan nomor, tanggal, serta perihal surat dicantumkan sebagai rujukan.', 'Lampiran'),
        h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: !!P.pakai, onchange: (e) => { P.pakai = e.target.checked; gbr(); touch(); } }), h('span', null, 'Sertakan halaman lampiran')),
        P.pakai ? h('div', null,
          h('div', { class: 'row', style: { gap: '8px', margin: '8px 0' } }, h('b', { class: 'small' }, 'Isi cepat:'),
            btn('Daftar hadir', { kind: 'sm', onClick: isi('DAFTAR HADIR', 'Nama|3\nJabatan / Instansi|2.5\nTanda tangan|2', '', { jmlBaris: 15, tinggiBaris: 26, nomor: true }) }),
            btn('Susunan acara', { kind: 'sm', onClick: isi('SUSUNAN ACARA', 'Waktu|1.4\nAcara|3.5\nPenanggung jawab|2', '08.00 - 08.15|Pembukaan|Pembawa acara\n08.15 - 09.00|Acara inti|Panitia\n09.00 - selesai|Penutup dan doa|Pembawa acara', { jmlBaris: 0, tinggiBaris: 22, nomor: false }) })),
          kolom({ label: 'Judul lampiran (tengah, tebal)', alat: true, value: P.judul || '', onInput: (v) => { P.judul = v; touch(); } }).el,
          kolom({ label: 'Keterangan lampiran pada rujukan', value: P.judulSingkat || '', ph: 'mis. Daftar hadir peserta', onInput: (v) => { P.judulSingkat = v; touch(); } }).el,
          h('div', { class: 'row', style: { gap: '2px 22px' } },
            cek('Ulangi kop surat di halaman lampiran', () => P.kop !== false, (v) => { P.kop = v; touch(); }),
            cek('Cantumkan rujukan (Lampiran, Nomor, Tanggal, Hal)', () => P.rujukan !== false, (v) => { P.rujukan = v; touch(); })),
          editorBlok({ blocks: P.blok, tpl, onChange: touch, bebas: true }).el) : null);
    };
    gbr(); return box;
  };
  S('Penandatangan', sigBox, true);
  if (tpl.kind !== 'dokumen') S('Lampiran (halaman tambahan)', panelLampiran(), false);
  S('Kop surat', kopBox, true);
  S('Format dan tata letak', formatBox, false);
  S('Status', statusBox(), false);
  form.append(bannerSnap, ...sections);

  renderNomor(); renderSig(); renderKop(); renderFormat(); gambarBanner();

  // ---------- Bilah atas ----------
  const menuEks = h('div', { class: 'menu', hidden: true, role: 'menu' },
    h('button', { type: 'button', role: 'menuitem', onclick: () => { menuEks.hidden = true; eksporPdf(); } }, ikon('file', 18), 'Unduh PDF'),
    tpl.kind !== 'dokumen' ? h('button', { type: 'button', role: 'menuitem', onclick: () => { menuEks.hidden = true; bukaMassal(L, { susun: susunDokumen, layout, buatPdf, nomorTampil }); } }, ikon('layers', 18), 'Surat massal (dari daftar)…') : null,
    h('button', { type: 'button', role: 'menuitem', onclick: () => { menuEks.hidden = true; eksporDocx(); } }, ikon('word', 18), 'Unduh Word (.docx)'),
    h('button', { type: 'button', role: 'menuitem', onclick: () => { menuEks.hidden = true; cetak(); } }, ikon('printer', 18), 'Cetak'),
    h('button', { type: 'button', role: 'menuitem', onclick: () => { menuEks.hidden = true; tampilCek(false); } }, ikon('check', 18), 'Periksa dokumen'));
  const docClick = (e) => { if (!menuEks.contains(e.target) && !e.target.closest('.eks-btn')) menuEks.hidden = true; };
  document.addEventListener('click', docClick);

  const bar = h('div', { class: 'ed-bar' },
    h('a', { class: 'icon-btn', href: '#/buat', 'aria-label': 'Kembali', title: 'Kembali' }, ikon('back', 20)),
    judulEl, stateEl, btnUndo, btnRedo,
    btn('Jadikan template', { icon: 'copy', cls: 'hide-sm', onClick: jadikanTemplate }),
    btn('Simpan', { icon: 'save', onClick: aksiSimpan }),
    h('div', { class: 'rel' }, btn('Ekspor', { icon: 'download', kind: 'primary eks-btn', onClick: () => { menuEks.hidden = !menuEks.hidden; } }), menuEks));

  const zoomSet = (z) => { zoom = Math.min(2.2, Math.max(0.5, z)); pagesBox.style.setProperty('--zoom', zoom); zl.textContent = Math.round(zoom * 100) + '%'; };
  const zl = h('span', { class: 'small', style: { minWidth: '38px', textAlign: 'center' } }, '100%');
  const tools = h('div', { class: 'prev-tools' }, infoHal, h('span', { class: 'grow' }), infoMasalah,
    h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Perkecil', onclick: () => zoomSet(zoom - 0.15) }, ikon('zoomout')), zl,
    h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Perbesar', onclick: () => zoomSet(zoom + 0.15) }, ikon('zoomin')),
    btn('Pas', { kind: 'sm', onClick: () => zoomSet(1) }));
  const prev = h('div', { class: 'ed-prev' }, pagesBox, tools);
  // ---------- Pita perintah ----------
  const adaSeksi = (k) => sections.some((x) => x.querySelector('summary') && x.querySelector('summary').textContent.includes(k));
  const keSeksi = (k) => () => { const d = sections.find((x) => x.querySelector('summary') && x.querySelector('summary').textContent.includes(k)); if (!d) return; d.open = true; if (el.dataset.tab) setTab('form'); d.scrollIntoView({ block: 'start', behavior: 'smooth' }); };
  const loncatCmd = (ik, label, k, judul) => (adaSeksi(k) ? { ikon: ik, label, judul: judul || label, onClick: keSeksi(k) } : null);
  const ada = (a) => a.filter(Boolean);
  const massalCmd = tpl.kind !== 'dokumen' ? { ikon: 'layers', label: 'Surat massal', judul: 'Buat satu surat untuk banyak penerima dari daftar', onClick: () => bukaMassal(L, { susun: susunDokumen, layout, buatPdf, nomorTampil }) } : null;
  const pita = buatPita([
    { id: 'beranda', nama: 'Beranda', grup: [
      { nama: 'Berkas', cmds: ada([{ ikon: 'save', label: 'Simpan', onClick: aksiSimpan }, { ikon: 'copy', label: 'Jadikan template', onClick: jadikanTemplate }]) },
      { nama: 'Isian surat', cmds: ada([loncatCmd('edit', 'Identitas', 'Identitas', 'Nomor, tanggal, perihal'), loncatCmd('file', 'Penerima', 'Penerima'), loncatCmd('edit', 'Isi surat', 'Isi surat dan penutup', 'Isi surat, salam, dan penutup')]) }] },
    { id: 'sisipkan', nama: 'Sisipkan', grup: [
      { nama: 'Bagian surat', cmds: ada([loncatCmd('edit', 'Tanda tangan', 'Penandatangan'), loncatCmd('file', 'Lampiran', 'Lampiran'), loncatCmd('building', 'Kop surat', 'Kop surat')]) },
      ...(massalCmd ? [{ nama: 'Banyak surat', cmds: [massalCmd] }] : [])] },
    { id: 'tata', nama: 'Tata letak', grup: [
      { nama: 'Halaman', cmds: ada([loncatCmd('settings', 'Format dan margin', 'Format dan tata letak', 'Galeri format, margin, ukuran kertas, dan dekorasi')]) },
      { nama: 'Tampilan', cmds: [{ ikon: 'zoomout', label: 'Perkecil', onClick: () => zoomSet(zoom - 0.15) }, { ikon: 'zoomin', label: 'Perbesar', onClick: () => zoomSet(zoom + 0.15) }, { ikon: 'eye', label: 'Pas halaman', onClick: () => zoomSet(1) }] }] },
    { id: 'tinjau', nama: 'Tinjau', grup: [
      { nama: 'Pemeriksaan', cmds: [{ ikon: 'check', label: 'Periksa dokumen', onClick: () => tampilCek(false) }] },
      { nama: 'Status', cmds: ada([loncatCmd('clock', 'Status surat', 'Status')]) }] },
    { id: 'berkas', nama: 'Ekspor', grup: [
      { nama: 'Unduh', cmds: [{ ikon: 'file', label: 'PDF', judul: 'Unduh PDF', onClick: eksporPdf }, { ikon: 'word', label: 'Word', judul: 'Unduh Word (.docx)', onClick: eksporDocx }, { ikon: 'printer', label: 'Cetak', onClick: cetak }] },
      ...(massalCmd ? [{ nama: 'Banyak surat', cmds: [massalCmd] }] : [])] },
  ]);
  const tabs = h('div', { class: 'tabs-m', role: 'tablist' },
    h('button', { type: 'button', role: 'tab', 'aria-selected': 'true', onclick: (e) => setTab('form') }, ikon('edit', 18), 'Formulir'),
    h('button', { type: 'button', role: 'tab', 'aria-selected': 'false', onclick: (e) => setTab('prev') }, ikon('eye', 18), 'Pratinjau'));
  const setTab = (t) => { el.dataset.tab = t; tabs.children[0].setAttribute('aria-selected', String(t === 'form')); tabs.children[1].setAttribute('aria-selected', String(t === 'prev')); if (t === 'prev') gambarPratinjau(); window.scrollTo(0, 0); };
  el.append(h('div', { class: 'ed-head' }, bar, pita.el), h('div', { class: 'ed-body' }, form, prev), tabs);
  root.append(el);

  // keluar halaman: simpan draf / tanya untuk status lain
  App.leave = async () => {
    autosave.cancel();
    if (!dirty) return true;
    if (L.status === 'draf') { try { await simpanRecord(L); await hapusPemulihan(L.id); if (isNew) await catat('buat', L); } catch (e) { /* abaikan */ } dirty = false; return true; }
    return new Promise((res) => {
      let sel = false;
      modal({ title: 'Simpan perubahan?', body: h('p', null, 'Ada perubahan yang belum disimpan pada surat ini.'), onClose: () => { if (!sel) res(false); }, actions: [
        { label: 'Buang', kind: 'danger-o', onClick: async () => { sel = true; await hapusPemulihan(L.id); dirty = false; res(true); } },
        { label: 'Tetap di sini', onClick: () => { sel = true; res(false); } },
        { label: 'Simpan', kind: 'primary', onClick: async () => { sel = true; try { await simpanPenuh(); res(true); } catch (e) { toast(e.message, 'err'); res(false); } } }] });
    });
  };

  refreshProj(); gambarPratinjau();
  if (isNew) setState('Surat baru · belum disimpan');
  return () => { document.removeEventListener('click', docClick); App.dirty = null; autosave.cancel(); jadwalPratinjau.cancel(); };
}

// ---------- Cetak ----------
export function cetakHalaman(lay) {
  const root = document.getElementById('printRoot'); root.replaceChildren();
  let st = document.getElementById('pageStyle'); if (!st) { st = document.createElement('style'); st.id = 'pageStyle'; document.head.append(st); }
  st.textContent = `@page{size:${lay.paper.wmm}mm ${lay.paper.hmm}mm;margin:0}`;
  lay.pages.forEach((pg) => root.append(h('div', { class: 'pp' }, pageSvg(pg, lay.paper, { print: true }))));
  const selesai = () => { document.body.classList.remove('printing'); root.replaceChildren(); window.removeEventListener('afterprint', selesai); };
  window.addEventListener('afterprint', selesai);
  document.body.classList.add('printing');
  setTimeout(() => window.print(), 80);
}

// dipakai juga oleh arsip & template (unduh ulang)
export async function bangunBerkas(L, jenis, { nomor } = {}) {
  const { doc } = susunDokumen(L, { nomorTampil: nomor ?? L.nomor });
  const lay = layout(doc);
  if (jenis === 'pdf') return { blob: new Blob([await buatPdf(lay, { judul: L.tpl.nama })], { type: 'application/pdf' }), lay };
  if (jenis === 'docx') return { blob: await buatDocx(doc, { judul: L.tpl.nama }), lay };
  return { lay };
}
export function nama_berkas_surat(L, ext) {
  const jenis = L.tpl.nama.replace(/^Surat\s+/i, '');
  const no = (L.nomor || '').split('/')[0].trim();
  const th = (parseISO(L.fields.tanggal_surat) || new Date()).getFullYear();
  return namaBerkas([jenis, no, th], ext);
}
