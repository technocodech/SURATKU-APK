// Dashboard dan katalog template (Buat Surat).
import { h, polos } from './util.js';
import { ikon, btn, toast, kosongPesan } from './ui.js';
import { galeri, petunjuk } from './pilih.js';
import { semuaSurat, aktivitas, semuaTemplate, toggleFavorit, STATUS, daftarFormatPreset } from './store.js';
import { FORMAT_SURAT, MODEL_GAYA, MODEL_COMPANY } from './models.js';
import * as Org from './org.js';
import { storageMode } from './db.js';
import { KATEGORI } from './compose.js';
import { relTime } from './util.js';
import { pergi } from './app.js';

const AKT = { buat: 'Dibuat', simpan: 'Disimpan', pdf: 'Diekspor PDF', docx: 'Diekspor Word', cetak: 'Dicetak', hapus: 'Dihapus', duplikat: 'Digandakan', status: 'Status diubah' };

export async function viewDashboard(root) {
  const [surat, akt] = await Promise.all([semuaSurat(), aktivitas()]);
  const now = new Date();
  const bulanIni = surat.filter((s) => { const d = new Date(s.createdAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length;
  const draf = surat.filter((s) => s.status === 'draf').sort((a, b) => b.updatedAt - a.updatedAt);
  const arsip = surat.filter((s) => s.status === 'diarsipkan').length;
  const org = Org.getOrg(); const logos = Org.getLogos();
  const kurang = [];
  if (!(org.nama || '').trim()) kurang.push('nama instansi/organisasi');
  if (!(org.pejabat || []).some((p) => (p.nama || '').trim())) kurang.push('nama pejabat penandatangan');
  if (!logos.muslimat && !logos.fatayat && !logos.alt) kurang.push('logo (opsional)');

  const sv = (tag, at = {}, ...kids) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [k, v] of Object.entries(at)) e.setAttribute(k, v); kids.forEach((c) => e.append(c)); return e; };
  const WARNA = { draf: '#e8a55a', siap: '#5db8a6', selesai: '#5db872', diarsipkan: '#8e8b82' };
  const hit = Object.keys(STATUS).map((k) => [k, surat.filter((s) => s.status === k).length]);
  const BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const enam = Array.from({ length: 6 }, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1); return { l: BLN[d.getMonth()], y: d.getFullYear(), m: d.getMonth(), n: 0 }; });
  for (const s of surat) { const d = new Date(s.createdAt); const x = enam.find((e) => e.m === d.getMonth() && e.y === d.getFullYear()); if (x) x.n++; }
  const donat = () => {
    const R = 52; const C = 2 * Math.PI * R; let off = 0; const total = surat.length;
    const g = sv('svg', { viewBox: '0 0 140 140', width: 150, height: 150, role: 'img', 'aria-label': `Ringkasan status: ${hit.map(([k, n]) => `${STATUS[k]} ${n}`).join(', ')}` },
      sv('circle', { cx: 70, cy: 70, r: R, fill: 'none', stroke: 'var(--line)', 'stroke-width': 16 }));
    if (total) for (const [k, n] of hit) { if (!n) continue; const len = (n / total) * C; g.append(sv('circle', { cx: 70, cy: 70, r: R, fill: 'none', stroke: WARNA[k], 'stroke-width': 16, 'stroke-dasharray': `${Math.max(0, len - 2)} ${C}`, 'stroke-dashoffset': -off, transform: 'rotate(-90 70 70)' })); off += len; }
    const t1 = sv('text', { x: 70, y: 74, 'text-anchor': 'middle', 'font-size': 26, 'font-weight': 600, fill: 'currentColor' }); t1.textContent = String(total);
    const t2 = sv('text', { x: 70, y: 92, 'text-anchor': 'middle', 'font-size': 10, fill: 'var(--muted)' }); t2.textContent = 'surat';
    g.append(t1, t2); return g;
  };
  const batang = () => {
    const mx = Math.max(1, ...enam.map((e) => e.n)); const W = 300; const H = 150; const bw = 26; const gap = (W - bw * 6) / 7;
    const g = sv('svg', { viewBox: `0 0 ${W} ${H + 22}`, width: '100%', role: 'img', 'aria-label': 'Jumlah surat dibuat per bulan, enam bulan terakhir' });
    for (let i = 0; i < 4; i++) g.append(sv('line', { x1: 0, x2: W, y1: 4 + (i * (H - 8)) / 3, y2: 4 + (i * (H - 8)) / 3, stroke: 'var(--line)', 'stroke-width': 1 }));
    enam.forEach((e, i) => {
      const x = gap + i * (bw + gap); const hh = Math.max(e.n ? 6 : 3, (e.n / mx) * (H - 14));
      g.append(sv('rect', { x, y: H - 4 - hh, width: bw, height: hh, rx: 7, fill: e.n ? 'var(--green)' : 'var(--line)' }));
      if (e.n) { const t = sv('text', { x: x + bw / 2, y: H - 8 - hh, 'text-anchor': 'middle', 'font-size': 10, fill: 'var(--muted)' }); t.textContent = String(e.n); g.append(t); }
      const l = sv('text', { x: x + bw / 2, y: H + 14, 'text-anchor': 'middle', 'font-size': 10, fill: 'var(--muted)' }); l.textContent = e.l; g.append(l);
    });
    return g;
  };
  const ikonBulat = (ik, warna) => h('span', { class: 'bulat', style: { background: warna } }, ikon(ik, 18));
  const terbaru = [...surat].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);
  const WIK = ['#5db8a6', '#cc785c', '#e8a55a', '#5db8a6', '#c64545'];

  root.append(...[
    h('div', { class: 'page-h' }, h('div', null, h('h1', null, 'Dashboard'), h('p', null, 'Buat, simpan, dan unduh surat resmi untuk instansi, organisasi, sekolah, perusahaan, maupun pribadi.')),
      btn('Buat Surat Baru', { icon: 'plus', kind: 'primary pilbtn', onClick: () => pergi('#/buat') })),
    storageMode === 'memori' ? h('div', { class: 'banner' }, ikon('alert'), h('div', { class: 'grow' }, 'Penyimpanan peramban tidak tersedia (mungkin mode privat). Surat tidak akan tersimpan setelah halaman ditutup. Gunakan fitur Ekspor Cadangan di Pengaturan.')) : null,
    kurang.length ? h('div', { class: 'banner info' }, ikon('building'), h('div', { class: 'grow' }, h('b', null, 'Lengkapi Data Organisasi. '), `Belum diisi: ${kurang.join(', ')}. Data ini dipakai pada kop dan tanda tangan surat.`), btn('Isi sekarang', { kind: 'sm', onClick: () => pergi('#/organisasi') })) : null,
    h('div', { class: 'card ringkas' }, ...[['file', '#5db8a6', 'Total surat', surat.length], ['clock', '#cc785c', 'Surat bulan ini', bulanIni], ['edit', '#e8a55a', 'Masih draf', draf.length], ['archive', '#5db8a6', 'Diarsipkan', arsip]]
      .map(([ik, w, l, n]) => h('div', { class: 'ringkas-i' }, ikonBulat(ik, w), h('div', null, h('div', { class: 'n' }, String(n)), h('div', { class: 'l' }, l))))),
    h('div', { class: 'dash-g dash-g1' },
      h('div', { class: 'card' }, h('div', { class: 'card-h' }, h('h3', null, 'Draf menunggu'), h('a', { href: '#/arsip', class: 'lihat' }, 'Lihat semua')),
        draf.length ? h('div', { class: 'scroll-x' }, h('table', { class: 'tbl tbl-lembut' }, h('thead', null, h('tr', null, ['Surat', 'Jenis', 'Diperbarui', ''].map((x) => h('th', null, x)))),
          h('tbody', null, draf.slice(0, 5).map((s) => h('tr', null, h('td', null, h('b', null, polos(s.fields.perihal) || s.tpl.nama)), h('td', null, s.tpl.nama), h('td', { class: 'muted' }, relTime(s.updatedAt)), h('td', { class: 'right' }, h('a', { class: 'tautan', href: '#/editor/' + s.id }, 'Lanjutkan'))))))) : kosongPesan('Tidak ada draf', 'Draf yang sedang dikerjakan akan muncul di sini.')),
      h('div', { class: 'card' }, h('div', { class: 'card-h' }, h('h3', null, 'Ringkasan status')),
        h('div', { class: 'donat' }, donat(), h('ul', { class: 'legenda' }, hit.map(([k, n]) => h('li', null, h('span', { class: 'tt', style: { background: WARNA[k] } }), h('span', null, STATUS[k]), h('b', null, String(n)))))))),
    h('div', { class: 'dash-g dash-g2' },
      h('div', { class: 'card' }, h('div', { class: 'card-h' }, h('h3', null, 'Surat terakhir')),
        terbaru.length ? h('div', { class: 'list' }, terbaru.map((s, i) => h('a', { class: 'li', href: '#/editor/' + s.id, style: { textDecoration: 'none', color: 'inherit' } }, h('span', { class: 'ik-dok', style: { color: WIK[i % WIK.length], background: WIK[i % WIK.length] + '1f' } }, ikon('file', 18)), h('div', { class: 'tt' }, h('b', null, polos(s.fields.perihal) || s.tpl.nama), h('span', null, `${s.tpl.nama} · ${relTime(s.updatedAt)}`))))) : kosongPesan('Belum ada surat', 'Surat yang Anda buat akan tampil di sini.')),
      h('div', { class: 'card' }, h('div', { class: 'card-h' }, h('h3', null, 'Aktivitas terbaru')),
        akt.length ? h('div', { class: 'garis-waktu' }, akt.slice(0, 5).map((a, i) => h('div', { class: 'gw-i' }, h('span', { class: 'gw-t', style: { background: ['#5db8a6', '#5db8a6', '#e8a55a', '#5db8a6', '#cc785c'][i % 5] } }, ikon(a.jenis === 'hapus' ? 'trash' : a.jenis === 'pdf' || a.jenis === 'docx' ? 'download' : a.jenis === 'cetak' ? 'printer' : 'check', 12)),
          h('div', null, h('b', null, a.nama || '—'), h('span', { class: 'muted' }, ` ${AKT[a.jenis] || a.jenis}`), h('div', { class: 'small muted' }, relTime(a.ts)))))) : kosongPesan('Belum ada aktivitas', 'Aktivitas pembuatan, penyimpanan, dan ekspor surat akan tercatat di sini.')),
      h('div', { class: 'card' }, h('div', { class: 'card-h' }, h('h3', null, 'Analisis'), h('span', { class: 'small muted' }, 'Surat dibuat, 6 bulan')), batang())),
  ].filter(Boolean));
}

export async function viewKatalog(root) {
  let tpls = await semuaTemplate();
  let q = ''; let kat = 'semua';
  const hasil = h('div');
  const chips = h('div', { class: 'chips', role: 'group', 'aria-label': 'Filter kategori' });
  const katList = [['semua', 'Semua'], ['favorit', '★ Favorit'], ...Object.entries(KATEGORI).filter(([k]) => k !== 'lainnya' || tpls.some((t) => t.kategori === 'lainnya')).map(([k, v]) => [k, v.nama])];
  const gambarChips = () => { chips.replaceChildren(...katList.map(([k, n]) => h('button', { class: 'chip', type: 'button', 'aria-pressed': String(kat === k), onclick: () => { kat = k; gambarChips(); gambar(); } }, n))); };
  const cocok = (t) => {
    if (kat === 'favorit' && !t.favorite) return false;
    if (kat !== 'semua' && kat !== 'favorit' && t.kategori !== kat) return false;
    if (!q) return true;
    const hay = `${t.nama} ${KATEGORI[t.kategori]?.nama || ''} ${t.kata || ''}`.toLowerCase();
    return q.toLowerCase().split(/\s+/).every((w) => hay.includes(w));
  };
  let formatPilih = '';
  const urlBaru = (t) => '#/editor/baru?t=' + encodeURIComponent(t.id) + (formatPilih ? '&f=' + encodeURIComponent(formatPilih) : '');
  const fmtSel = h('select', { class: 'inp', 'aria-label': 'Format tata letak surat', style: { width: 'auto', maxWidth: '100%' }, onchange: (e) => { formatPilih = e.target.value; } },
    h('option', { value: '' }, 'Format bawaan template'),
    h('optgroup', { label: 'Format surat resmi' }, Object.entries(FORMAT_SURAT).map(([k, m]) => h('option', { value: k }, m.nama))),
    h('optgroup', { label: 'Model gaya tampilan' }, Object.entries(MODEL_GAYA).map(([k, m]) => h('option', { value: k }, m.nama))),
    h('optgroup', { label: 'Model Company (dekorasi halaman)' }, Object.entries(MODEL_COMPANY).map(([k, m]) => h('option', { value: k }, m.nama))));
  const galBox = h('div');
  const gambarGaleri = (sv = []) => {
    const items = [['', { nama: 'Bawaan template', ket: 'Tata letak asli tiap template', format: {} }], ...Object.entries(FORMAT_SURAT), ...Object.entries(MODEL_GAYA), ...Object.entries(MODEL_COMPANY), ...sv.map((m) => ['s:' + m.id, m])];
    galBox.replaceChildren(galeri({ items, aktif: formatPilih, onPilih: (k) => { formatPilih = k; fmtSel.value = k; } }).el);
  };
  gambarGaleri();
  daftarFormatPreset().then((sv) => { if (sv.length) gambarGaleri(sv); }).catch(() => {});
  daftarFormatPreset().then((sv) => { if (sv.length) fmtSel.append(h('optgroup', { label: 'Format tersimpan saya' }, sv.map((m) => h('option', { value: 's:' + m.id }, m.nama)))); }).catch(() => {});
  const kartu = (t) => h('div', { class: 'tcard', role: 'button', tabindex: '0', onclick: () => pergi(urlBaru(t)), onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pergi(urlBaru(t)); } } },
    h('b', null, t.nama), h('small', null, t.kind === 'dokumen' ? 'Dokumen kegiatan' : 'Surat'), h('small', null, KATEGORI[t.kategori]?.nama || ''),
    h('button', { class: 'icon-btn fav' + (t.favorite ? ' fav-on' : ''), type: 'button', 'aria-label': t.favorite ? 'Hapus dari favorit' : 'Jadikan favorit', onclick: async (e) => { e.stopPropagation(); t.favorite = await toggleFavorit(t.id); gambar(); } }, ikon(t.favorite ? 'star-fill' : 'star', 18)));
  const gambar = () => {
    const list = tpls.filter(cocok);
    hasil.replaceChildren();
    if (!list.length) { hasil.append(kosongPesan('Template tidak ditemukan', 'Coba kata kunci atau kategori lain.')); return; }
    const urut = Object.keys(KATEGORI);
    for (const k of urut) {
      const g = list.filter((t) => t.kategori === k); if (!g.length) continue;
      hasil.append(h('h4', { class: 'cat-h' }, KATEGORI[k].nama), h('div', { class: 'tgrid' }, g.map(kartu)));
    }
  };
  root.append(
    h('div', { class: 'page-h' }, h('div', null, h('h1', null, 'Buat Surat'), h('p', null, 'Pilih jenis surat atau dokumen yang akan dibuat.'))),
    h('div', { class: 'fld', style: { maxWidth: '420px' } }, h('label', null, 'Format tata letak (opsional)'), fmtSel, h('div', { class: 'hint' }, 'Dipakai saat Anda memilih jenis surat di bawah. Semua pengaturan tetap bisa diubah di editor.')),
    h('details', { class: 'sub', open: true }, h('summary', null, 'Contoh tampilan format (klik untuk memilih)'), petunjuk('Setiap gambar adalah miniatur halaman: kop di atas, nomor-perihal, penerima, isi, lalu tanda tangan. Pilih salah satu, lalu klik jenis surat di bawah. Format berlaku untuk semua jenis surat.', 'Cara memilih'), galBox),
    h('div', { class: 'searchbox' }, ikon('search', 18), h('input', { class: 'inp', type: 'search', placeholder: 'Cari nama, kategori, atau kata kunci…', 'aria-label': 'Cari template', oninput: (e) => { q = e.target.value.trim(); gambar(); } })),
    chips, hasil);
  gambarChips(); gambar();
}
