// Panel gaya teks tanda tangan: tebal/tipis, miring, dan warna untuk tiap bagian.
import { h } from './util.js';
import { cek, warna } from './kop-ui.js';
import { DEFAULT_TTD, merge, bacaGambarTtd } from './org.js';
import { kolom, toast, btn, modal } from './ui.js';
import { bungkusGambar, olahUlang, bukaCoret, OPSI_AWAL } from './gambar-olah.js';
import { bukaPotong } from './potong-ui.js';
import { pilih, IKON } from './pilih.js';
import { DAFTAR_FONT } from './fonts.js';

const BAGIAN = [
  ['tanggal', 'Kota dan tanggal'], ['pengantar', 'Teks pengantar (Hormat kami, dst.)'], ['instansi', 'Nama instansi'],
  ['jabatan', 'Jabatan'], ['nama', 'Nama penandatangan'], ['ket', 'Keterangan dan teks tambahan'],
];
// T = objek tanda tangan (L.ttd atau pengaturan bawaan). Nilai gaya dibuat bila belum ada.
// Setiap bagian (kota-tanggal, pengantar, organisasi, jabatan, nama, keterangan) punya toolbar sendiri: tebal, miring, ukuran, jenis huruf, warna.
const tgl = (label, simbol, get, set) => h('label', { class: 'tgl', title: label }, h('input', { type: 'checkbox', 'aria-label': label, checked: !!get(), onchange: (e) => set(e.target.checked) }), h('span', { 'aria-hidden': 'true' }, simbol));
// Baris tombol gaya huruf: Tebal, Miring, Ukuran, Jenis huruf, Warna. g = {b,i,size,f,color}; u(fn) membungkus perubahan.
export function alatGaya(g, nama, u) {
  return h('div', { class: 'tb tb-gaya', role: 'toolbar', 'aria-label': 'Format ' + nama },
        tgl('Tebal', h('b', null, 'B'), () => g.b, u((v) => { g.b = v; })), tgl('Miring', h('i', null, 'I'), () => g.i, u((v) => { g.i = v; })),
        h('label', { class: 'mini' }, h('span', null, 'Ukuran'), h('input', { type: 'number', min: 0, max: 24, step: 0.5, class: 'num-s', 'aria-label': 'Ukuran huruf ' + nama, value: g.size || 0, oninput: (e) => u((v) => { g.size = Math.min(24, Math.max(0, +v || 0)); })(e.target.value) })),
        h('label', { class: 'mini' }, h('span', null, 'Huruf'), h('select', { 'aria-label': 'Jenis huruf ' + nama, onchange: (e) => u((v) => { g.f = v; })(e.target.value) }, [['', 'Ikut dokumen'], ...DAFTAR_FONT].map(([v, t]) => h('option', { value: v, selected: v === (g.f || '') }, t)))),
        warna('Warna', g.color, u((v) => { g.color = v; })));
}

export function panelGayaTtd(T, { onChange = () => {} } = {}) {
  T.gaya = merge(DEFAULT_TTD.gaya, T.gaya);
  const u = (fn) => (v) => { fn(v); onChange(); };
  return h('div', { class: 'kopgaya' }, h('p', { class: 'hint' }, 'Tiap bagian diatur sendiri-sendiri. Ukuran 0 = ikut ukuran huruf dokumen; jenis huruf "Ikut dokumen" = sama dengan isi surat.'), BAGIAN.map(([k, nama]) => {
    const g = T.gaya[k];
    return h('div', { class: 'sig' }, h('b', { class: 'small' }, nama),
      alatGaya(g, nama, u),
      k === 'pengantar' ? h('div', null,
        pilih({ label: 'Perataan teks', value: T.pengantarRata || 'center', onInput: u((v) => { T.pengantarRata = v; }), options: [['center', 'Tengah', '', IKON.tengahPendek], ['left', 'Rata kiri', '', IKON.rataKiri], ['right', 'Rata kanan', '', IKON.kanan]] }).el,
        kolom({ label: 'Jarak ke elemen tanda tangan (pt)', type: 'number', min: 0, max: 60, value: T.pengantarJarak ?? 2, onInput: u((v) => { T.pengantarJarak = Math.min(60, Math.max(0, +v || 0)); }) }).el) : null);
  }));
}

// Pengelolaan gambar tanda tangan dan stempel per penandatangan: unggah atau coret langsung, hapus latar, transparansi, putar,
// ukuran, dan posisi (angka atau seret di kotak pratinjau). Semua hasil dibakar ke PNG sehingga PDF/Word sama dengan pratinjau.
export function panelGambarTtd(s, ruangPt, { onChange = () => {}, ulang = () => {} } = {}) {
  const box = h('div', { class: 'sig', style: { background: 'transparent' } });
  const MMPT = 72 / 25.4; const K = 1.5; const W = 150;
  const bagian = (judul, kunci, k) => {
    const g = s[kunci];
    const pasang = async (hasil, jpg = false) => { s[kunci] = await bungkusGambar(hasil, { jpg, kunci }); ulang(); onChange(); toast(judul + ' dipasang.'); };
    const file = h('input', { type: 'file', accept: '.png,.jpg,.jpeg,image/png,image/jpeg', class: 'sr', 'aria-label': 'Pilih gambar ' + judul, onchange: async (e) => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; try { await pasang(await bacaGambarTtd(f), f.type === 'image/jpeg'); } catch (err) { toast(err.message, 'err', 6000); } } });
    const num = (label, prop, min, max, step, dasar) => kolom({ label, type: 'number', min, max, step, value: s[prop] ?? dasar, onInput: (v) => { s[prop] = Math.min(max, Math.max(min, +v || (dasar ?? 0))); onChange(); drawPrev(); } }).el;
    // olah ulang bertahap (debounce) agar slider tetap halus
    let tunda = null;
    const ubahOpsi = (p) => { g.opsi = { ...(g.opsi || {}), ...p }; clearTimeout(tunda); tunda = setTimeout(async () => { try { const baru = await olahUlang(g, p); Object.assign(g, baru); onChange(); drawPrev(); const im = box.querySelector(`img[data-thumb="${kunci}"]`); if (im) im.src = g.dataUrl; } catch (err) { toast(err.message, 'err'); } }, 120); };
    const opsi = (g && g.opsi) || { ...OPSI_AWAL };
    const olah = g ? h('div', { class: 'olah' },
      btn('Potong dan luruskan…', { kind: 'sm', onClick: async () => { try { const r = await bukaPotong(g.asli || g); if (!r) return; g.asli = r; Object.assign(g, await olahUlang(g, {})); onChange(); ulang(); toast('Foto dipotong.'); } catch (err) { toast(err.message, 'err'); } } }),
      h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: !!opsi.hapusLatar, 'aria-label': 'Hapus latar ' + judul, onchange: (e) => { ubahOpsi({ hapusLatar: e.target.checked }); } }), h('span', null, 'Hapus latar putih/abu-abu', h('div', { class: 'hint' }, 'Berguna untuk foto atau scan tanda tangan agar tidak menutupi tulisan di bawahnya.'))),
      h('div', { class: 'three' },
        kolom({ label: 'Kepekaan hapus latar (%)', type: 'number', min: 0, max: 100, step: 5, value: opsi.ambang ?? 40, hint: 'Naikkan bila latar abu-abu belum hilang.', onInput: (v) => ubahOpsi({ ambang: Math.min(100, Math.max(0, +v || 0)) }) }).el,
        kolom({ label: 'Transparansi / opasitas (%)', type: 'number', min: 10, max: 100, step: 5, value: opsi.opasitas ?? 100, hint: 'Turunkan agar stempel tembus pandang.', onInput: (v) => ubahOpsi({ opasitas: Math.min(100, Math.max(10, +v || 100)) }) }).el,
        kolom({ label: 'Putar (derajat)', type: 'number', min: -180, max: 180, step: 5, value: opsi.rotasi ?? 0, hint: 'Mis. 15 untuk stempel miring.', onInput: (v) => ubahOpsi({ rotasi: Math.min(180, Math.max(-180, +v || 0)) }) }).el)) : null;
    return h('div', { style: { marginBottom: '10px' } },
      h('div', { class: 'row', style: { gap: '8px', alignItems: 'center', flexWrap: 'wrap' } }, h('b', { class: 'small' }, judul),
        g ? h('img', { src: g.dataUrl, alt: judul, 'data-thumb': kunci, class: 'thumb-ttd' }) : h('span', { class: 'small muted' }, 'Belum ada gambar.'),
        btn(g ? 'Ganti' : 'Unggah PNG/JPG', { icon: 'upload', kind: 'sm', onClick: () => file.click() }),
        kunci === 'gambar' ? btn('Coret langsung', { icon: 'edit', kind: 'sm', onClick: async () => { const r = await bukaCoret({ h, modal, toast }); if (r) await pasang(r); } }) : null,
        g ? btn('Hapus', { kind: 'sm danger-o', onClick: () => { s[kunci] = null; ulang(); onChange(); } }) : null, file),
      olah,
      g ? h('div', { class: 'three' }, num('Ukuran (%)', k + 'Ukuran', 20, 250, 5, 100), num('Geser kanan (+) / kiri (−), mm', k + 'X', -60, 60, 1, 0), num('Geser bawah (+) / atas (−), mm', k + 'Y', -40, 40, 1, 0)) : null);
  };
  const prev = h('div', { class: 'ttd-prev', 'aria-label': 'Pratinjau ukuran dan posisi gambar tanda tangan' });
  function drawPrev() {
    prev.replaceChildren(); prev.style.width = W * K + 'px'; prev.style.height = ruangPt * K + 'px';
    [['stempel', 's'], ['gambar', 'g']].forEach(([kunci, k]) => {
      const g = s[kunci]; if (!g) return; const pct = Math.min(250, Math.max(20, +s[k + 'Ukuran'] || 100)) / 100;
      const sc = Math.min((W * 0.7) / g.w, (ruangPt * 0.92) / g.h) * pct; const iw = g.w * sc; const ih = g.h * sc;
      const im = h('img', { src: g.dataUrl, alt: 'Seret untuk memindahkan ' + (kunci === 'gambar' ? 'tanda tangan' : 'stempel'), draggable: 'false', class: 'ttd-seret', title: 'Seret untuk memindahkan', style: { position: 'absolute', width: iw * K + 'px', height: ih * K + 'px', left: ((W - iw) / 2 + (+s[k + 'X'] || 0) * MMPT) * K + 'px', top: ((ruangPt - ih) / 2 + (+s[k + 'Y'] || 0) * MMPT) * K + 'px', touchAction: 'none' } });
      im.addEventListener('pointerdown', (e) => {
        e.preventDefault(); im.setPointerCapture(e.pointerId); const x0 = e.clientX; const y0 = e.clientY; const gx = +s[k + 'X'] || 0; const gy = +s[k + 'Y'] || 0; let geser = false;
        const gerak = (ev) => { geser = true; const nx = Math.min(60, Math.max(-60, Math.round(gx + (ev.clientX - x0) / K / MMPT))); const ny = Math.min(40, Math.max(-40, Math.round(gy + (ev.clientY - y0) / K / MMPT))); s[k + 'X'] = nx; s[k + 'Y'] = ny; im.style.left = ((W - iw) / 2 + nx * MMPT) * K + 'px'; im.style.top = ((ruangPt - ih) / 2 + ny * MMPT) * K + 'px'; onChange(); };
        const selesai = () => { im.removeEventListener('pointermove', gerak); im.removeEventListener('pointerup', selesai); im.removeEventListener('pointercancel', selesai); if (geser) ulang(); };
        im.addEventListener('pointermove', gerak); im.addEventListener('pointerup', selesai); im.addEventListener('pointercancel', selesai);
      });
      prev.append(im);
    });
    if (!s.gambar && !s.stempel) prev.append(h('span', { class: 'small muted', style: { position: 'absolute', inset: '0', display: 'grid', placeItems: 'center' } }, 'Ruang tanda tangan basah'));
  }
  box.append(h('b', { class: 'small' }, 'Gambar tanda tangan dan stempel (opsional)'), h('div', { style: { height: '8px' } }), bagian('Tanda tangan', 'gambar', 'g'), bagian('Stempel / cap', 'stempel', 's'),
    h('div', { class: 'small muted', style: { margin: '2px 0 6px' } }, 'Pratinjau letak di ruang tanda tangan. Seret gambar dengan jari atau mouse untuk memindahkannya:'), prev,
    h('p', { class: 'hint' }, 'Gambar hanya dicetak bila opsi "Cetak dengan gambar tanda tangan yang diunggah" aktif. PNG transparan memberi hasil terbaik; gambar tidak diregangkan.'));
  drawPrev(); return box;
}
