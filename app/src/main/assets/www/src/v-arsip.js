// Arsip surat: cari, filter, buka, gandakan, unduh ulang, hapus.
import { h, download, fmtTanggal, BULAN, parseISO, polos } from './util.js';
import { ikon, btn, toast, konfirmasi, kosongPesan, modal } from './ui.js';
import { semuaSurat, hapusSurat, gandakanSurat, simpanRecord, catat, STATUS } from './store.js';
import { bangunBerkas, nama_berkas_surat } from './v-editor.js';
import { cetakHalaman } from './v-editor.js';
import { KATEGORI } from './compose.js';
import { pergi } from './app.js';

const perihalDari = (s) => polos(s.fields.perihal) || s.tpl.judul || s.tpl.nama;
const penerimaDari = (s) => polos(s.fields.nama_penerima) || polos(s.fields.jabatan_penerima) || '';
const tglSurat = (s) => parseISO(s.fields.tanggal_surat);

export async function viewArsip(root) {
  let semua = await semuaSurat();
  const F = { q: '', tahun: '', bulan: '', jenis: '', status: '', urut: 'baru' };
  const hasil = h('div');
  const sel = (key, label, opts) => h('select', { class: 'inp', 'aria-label': label, onchange: (e) => { F[key] = e.target.value; gambar(); } }, h('option', { value: '' }, label), opts.map(([v, t]) => h('option', { value: v }, t)));
  const tahunList = () => [...new Set(semua.map((s) => (tglSurat(s) || new Date(s.createdAt)).getFullYear()))].sort((a, b) => b - a).map((y) => [String(y), String(y)]);

  const lolos = (s) => {
    const d = tglSurat(s) || new Date(s.createdAt);
    if (F.tahun && String(d.getFullYear()) !== F.tahun) return false;
    if (F.bulan && String(d.getMonth() + 1) !== F.bulan) return false;
    if (F.jenis && s.tpl.kategori !== F.jenis) return false;
    if (F.status && s.status !== F.status) return false;
    if (F.q) {
      const hay = `${s.nomor} ${s.tpl.nama} ${perihalDari(s)} ${penerimaDari(s)} ${s.fields.nama_kegiatan || ''} ${STATUS[s.status]}`.toLowerCase();
      if (!F.q.toLowerCase().split(/\s+/).every((w) => hay.includes(w))) return false;
    }
    return true;
  };

  async function aksi(s, a) {
    try {
      if (a === 'pdf' || a === 'docx') {
        const { blob } = await bangunBerkas(s, a);
        download(blob, nama_berkas_surat(s, a)); await catat(a, s); toast(a === 'pdf' ? 'PDF diunduh.' : 'Dokumen Word diunduh.');
      } else if (a === 'cetak') { const { lay } = await bangunBerkas(s, 'x'); cetakHalaman(lay); await catat('cetak', s); }
      else if (a === 'dup') { const c = gandakanSurat(s); await simpanRecord(c); await catat('duplikat', c); toast('Surat digandakan sebagai draf baru.'); pergi('#/editor/' + c.id); }
      else if (a === 'arsip') { s.status = s.status === 'diarsipkan' ? 'selesai' : 'diarsipkan'; await simpanRecord(s); await catat('status', s, STATUS[s.status]); toast('Status diubah menjadi ' + STATUS[s.status] + '.'); gambar(); }
      else if (a === 'hapus') {
        if (await konfirmasi(`Hapus surat "${perihalDari(s)}"${s.nomor ? ' (' + s.nomor + ')' : ''} dari arsip?\nSurat yang dihapus tidak dapat dikembalikan.`, { ok: 'Hapus surat', bahaya: true, judul: 'Hapus surat' })) {
          await catat('hapus', s); await hapusSurat(s.id); semua = semua.filter((x) => x.id !== s.id); toast('Surat dihapus.'); gambar();
        }
      }
    } catch (e) { console.error(e); toast('Gagal: ' + e.message, 'err', 6000); }
  }

  function gambar() {
    let list = semua.filter(lolos);
    list.sort((a, b) => F.urut === 'lama' ? a.createdAt - b.createdAt : F.urut === 'tglsurat' ? String(b.fields.tanggal_surat).localeCompare(String(a.fields.tanggal_surat)) : b.updatedAt - a.updatedAt);
    hasil.replaceChildren();
    if (!semua.length) { hasil.append(h('div', { class: 'card' }, kosongPesan('Arsip masih kosong', 'Surat yang Anda simpan akan muncul di sini.', btn('Buat surat pertama', { kind: 'primary', onClick: () => pergi('#/buat') })))); return; }
    if (!list.length) { hasil.append(h('div', { class: 'card' }, kosongPesan('Tidak ada surat yang cocok', 'Ubah kata kunci atau filter pencarian.'))); return; }
    const tgl = (ts) => { const d = new Date(ts); return `${d.getDate()} ${BULAN[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`; };
    hasil.append(h('div', { class: 'card', style: { padding: '6px' } }, h('div', { class: 'scroll-x' }, h('table', { class: 'tbl resp' },
      h('thead', null, h('tr', null, ['Nomor', 'Jenis', 'Perihal', 'Tanggal surat', 'Penerima', 'Kegiatan', 'Status', 'Diperbarui', ''].map((t) => h('th', null, t)))),
      h('tbody', null, list.map((s) => h('tr', null,
        h('td', { 'data-l': 'Nomor' }, s.nomor || h('span', { class: 'muted' }, '—')),
        h('td', { 'data-l': 'Jenis' }, s.tpl.nama), h('td', { 'data-l': 'Perihal' }, h('a', { href: '#/editor/' + s.id }, perihalDari(s))),
        h('td', { 'data-l': 'Tanggal surat' }, fmtTanggal(s.fields.tanggal_surat) || '—'), h('td', { 'data-l': 'Penerima' }, penerimaDari(s) || '—'), h('td', { 'data-l': 'Kegiatan' }, s.fields.nama_kegiatan || '—'),
        h('td', { 'data-l': 'Status' }, h('span', { class: 'badge ' + s.status }, STATUS[s.status])), h('td', { 'data-l': 'Diperbarui', class: 'small' }, tgl(s.updatedAt)),
        h('td', null, h('div', { class: 'row', style: { gap: '2px', flexWrap: 'nowrap' } },
          h('a', { class: 'icon-btn', href: '#/editor/' + s.id, title: 'Buka dan edit', 'aria-label': 'Buka dan edit' }, ikon('edit', 17)),
          h('button', { class: 'icon-btn', type: 'button', title: 'Gandakan', 'aria-label': 'Gandakan', onclick: () => aksi(s, 'dup') }, ikon('copy', 17)),
          h('button', { class: 'icon-btn', type: 'button', title: 'Unduh PDF', 'aria-label': 'Unduh PDF', onclick: () => aksi(s, 'pdf') }, ikon('file', 17)),
          h('button', { class: 'icon-btn', type: 'button', title: 'Unduh Word', 'aria-label': 'Unduh Word', onclick: () => aksi(s, 'docx') }, ikon('word', 17)),
          h('button', { class: 'icon-btn', type: 'button', title: 'Cetak', 'aria-label': 'Cetak', onclick: () => aksi(s, 'cetak') }, ikon('printer', 17)),
          h('button', { class: 'icon-btn', type: 'button', title: s.status === 'diarsipkan' ? 'Keluarkan dari arsip' : 'Tandai diarsipkan', 'aria-label': 'Arsipkan', onclick: () => aksi(s, 'arsip') }, ikon('archive', 17)),
          h('button', { class: 'icon-btn', type: 'button', title: 'Hapus', 'aria-label': 'Hapus', onclick: () => aksi(s, 'hapus') }, ikon('trash', 17))))))))),
      h('div', { class: 'small muted', style: { padding: '8px 12px' } }, `${list.length} dari ${semua.length} surat`)));
  }

  root.append(
    h('div', { class: 'page-h' }, h('div', null, h('h1', null, 'Arsip Surat'), h('p', null, 'Semua surat yang tersimpan di perangkat ini.')), btn('Buat Surat Baru', { icon: 'plus', kind: 'primary', onClick: () => pergi('#/buat') })),
    h('div', { class: 'filters' },
      h('div', { class: 'searchbox sb' }, ikon('search', 18), h('input', { class: 'inp', type: 'search', placeholder: 'Cari nomor, perihal, penerima, kegiatan…', 'aria-label': 'Cari surat', oninput: (e) => { F.q = e.target.value.trim(); gambar(); } })),
      sel('tahun', 'Semua tahun', tahunList()), sel('bulan', 'Semua bulan', BULAN.map((b, i) => [String(i + 1), b])),
      sel('jenis', 'Semua jenis', Object.entries(KATEGORI).map(([k, v]) => [k, v.nama])), sel('status', 'Semua status', Object.entries(STATUS))),
    h('div', { class: 'row', style: { marginBottom: '10px' } }, h('label', { class: 'small muted', for: 'urut' }, 'Urutkan:'),
      h('select', { class: 'inp', id: 'urut', style: { width: 'auto' }, onchange: (e) => { F.urut = e.target.value; gambar(); } }, [['baru', 'Terakhir diperbarui'], ['tglsurat', 'Tanggal surat terbaru'], ['lama', 'Paling lama dibuat']].map(([v, t]) => h('option', { value: v }, t)))),
    hasil);
  gambar();
}
