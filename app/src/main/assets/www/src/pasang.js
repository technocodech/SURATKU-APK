// Ajakan memasang aplikasi (PWA): muncul setiap kali halaman dibuka, kecuali sudah terpasang atau baru ditunda.
import { h } from './util.js';

const KUNCI = 'suratku.pasang.tunda';
const TUNDA_MS = 24 * 3600 * 1000; // "Nanti" menyembunyikan ajakan selama 1 hari
let tunda = null;

const terpasang = () => matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: window-controls-overlay)').matches || navigator.standalone === true;
const baruDitunda = () => { try { return Date.now() - Number(localStorage.getItem(KUNCI) || 0) < TUNDA_MS; } catch (e) { return false; } };
const catatTunda = () => { try { localStorage.setItem(KUNCI, String(Date.now())); } catch (e) { /* abaikan */ } };
const iOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

function tampil({ ios }) {
  if (document.getElementById('pasangBar')) return;
  const tutup = () => bar.remove();
  const nanti = h('button', { class: 'btn sm', type: 'button', onclick: () => { catatTunda(); tutup(); } }, 'Nanti');
  const aksi = ios
    ? h('div', { class: 'small' }, 'Di Safari: ketuk ', h('b', null, 'Bagikan'), ', lalu ', h('b', null, 'Tambah ke Layar Utama'), '.')
    : h('button', { class: 'btn sm primary', type: 'button', onclick: async () => {
        if (!tunda) return tutup();
        tunda.prompt();
        try { await tunda.userChoice; } catch (e) { /* abaikan */ }
        tunda = null; tutup();
      } }, 'Pasang');
  const bar = h('div', { id: 'pasangBar', class: 'pasang', role: 'dialog', 'aria-label': 'Pasang aplikasi SURATKU' },
    h('img', { src: 'ikrom.svg', alt: '', width: 40, height: 40 }),
    h('div', { class: 'pasang-t' }, h('b', null, 'Pasang SURATKU di perangkat Anda'), h('span', null, 'Buka lebih cepat dari layar utama dan bisa dipakai tanpa internet.'), ios ? aksi : null),
    h('div', { class: 'pasang-a' }, ios ? null : aksi, nanti));
  document.body.append(bar);
}

export function mulaiPasang() {
  if (terpasang()) return;
  window.addEventListener('appinstalled', () => { const b = document.getElementById('pasangBar'); if (b) b.remove(); });
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); tunda = e;
    if (!baruDitunda()) tampil({ ios: false });
  });
  if (iOS() && !baruDitunda()) setTimeout(() => { if (!terpasang()) tampil({ ios: true }); }, 1500);
}
