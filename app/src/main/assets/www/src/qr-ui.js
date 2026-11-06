// Panel kode QR verifikasi di bagian tanda tangan.
import { h } from './util.js';
import { cek } from './kop-ui.js';
import { kolom } from './ui.js';
import { pilih, petunjuk, IKON } from './pilih.js';
import { isiQR } from './compose.js';
import { qrKePng } from './qr.js';

export function panelQR(L, { touch, org }) {
  const box = h('div', { class: 'sig' });
  const Q = () => (L.qr = L.qr || { pakai: false, isi: 'otomatis', teks: '', ukuran: 22, posisi: 'left', keterangan: 'Pindai untuk memeriksa keaslian surat' });
  const gbr = () => {
    const q = Q();
    const kids = [h('b', { class: 'small' }, 'Kode QR verifikasi (opsional)'),
      cek('Tampilkan kode QR di bawah tanda tangan', () => q.pakai, (v) => { q.pakai = v; gbr(); touch(); }, 'Dibuat langsung di perangkat ini, tanpa internet atau server.')];
    if (q.pakai) {
      const teks = isiQR(L, { vars: { ...(L.fields || {}), nomor_surat: L.nomor || '' } }, org, [L.fields && L.fields.tanggal_surat || '']);
      let img = null; try { const p = qrKePng(teks, { ecc: 'M', skala: 4 }); img = h('img', { src: p.dataUrl, alt: 'Pratinjau kode QR', style: { width: '96px', height: '96px', border: '1px solid var(--line)', borderRadius: '6px', imageRendering: 'pixelated' } }); } catch (e) { img = h('span', { class: 'small muted' }, 'Teks terlalu panjang untuk QR.'); }
      kids.push(
        petunjuk('QR berisi ringkasan surat (nomor, perihal, tanggal, penerbit, penandatangan) atau teks/tautan yang Anda isi sendiri. Cocok untuk memeriksa keaslian surat cetak. QR bukan tanda tangan elektronik bersertifikat.', 'Fungsi'),
        pilih({ label: 'Letak kode QR', value: q.posisi || 'left', onInput: (v) => { q.posisi = v; touch(); }, options: [['left', 'Kiri', '', IKON.ttdKiri], ['center', 'Tengah', '', IKON.ttdTengah], ['right', 'Kanan', '', IKON.ttdKanan]] }).el,
        pilih({ label: 'Isi kode QR', value: q.isi || 'otomatis', onInput: (v) => { q.isi = v; gbr(); touch(); }, options: [['otomatis', 'Otomatis', 'Ringkasan surat', IKON.nomorLengkap], ['khusus', 'Teks / tautan sendiri', 'Mis. alamat web verifikasi', IKON.nomorSingkat]] }).el,
        q.isi === 'khusus' ? kolom({ label: 'Teks atau tautan di dalam QR', type: 'textarea', rows: 3, value: q.teks || '', ph: 'mis. https://contoh.id/verifikasi/001', hint: 'Maksimal sekitar 300 karakter.', onInput: (v) => { q.teks = v; touch(); } }).el : null,
        h('div', { class: 'two' },
          kolom({ label: 'Ukuran QR (mm)', type: 'number', min: 12, max: 45, value: q.ukuran || 22, onInput: (v) => { q.ukuran = Math.min(45, Math.max(12, +v || 22)); touch(); } }).el,
          kolom({ label: 'Keterangan di bawah QR', value: q.keterangan ?? '', alat: true, ph: 'kosongkan bila tidak perlu', onInput: (v) => { q.keterangan = v; touch(); } }).el),
        h('div', { class: 'row', style: { gap: '10px', alignItems: 'flex-start' } }, img, h('pre', { class: 'small muted', style: { margin: 0, whiteSpace: 'pre-wrap', flex: 1 } }, 'Isi QR:\n' + teks)));
    }
    box.replaceChildren(...kids);
  };
  gbr(); return box;
}
