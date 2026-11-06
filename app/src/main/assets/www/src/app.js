import * as Numbering from './numbering.js';
import * as Models from './models.js';
import * as TtdModel from './ttd-model.js';
// SURATKU — titik masuk aplikasi: kerangka, navigasi, tema, dan router.
import { openDB, storageMode } from './db.js';
import * as Org from './org.js';
import { initFonts } from './fonts.js';
import { muatFontArab } from './arab.js';
import { h } from './util.js';
import { mulaiPasang } from './pasang.js';
import { ikon, toast } from './ui.js';
import { viewDashboard, viewKatalog } from './v-dashboard.js';
import { viewEditor } from './v-editor.js';
import { viewArsip } from './v-arsip.js';
import { viewTemplat, viewTemplatEdit } from './v-templat.js';
import { viewOrganisasi, viewPengaturan, viewBantuan } from './v-pengaturan.js';

const MENU = [
  ['dashboard', 'Dashboard', 'home'], ['buat', 'Buat Surat', 'plus'], ['template', 'Template Surat', 'layers'],
  ['arsip', 'Arsip Surat', 'archive'], ['organisasi', 'Data Organisasi', 'building'], ['pengaturan', 'Pengaturan', 'settings'], ['bantuan', 'Bantuan', 'help'],
];
const JUDUL = { dashboard: 'Dashboard', buat: 'Buat Surat', editor: 'Editor Surat', template: 'Template Surat', arsip: 'Arsip Surat', organisasi: 'Data Organisasi', pengaturan: 'Pengaturan', bantuan: 'Bantuan' };

export const App = { cleanup: null, leave: null };

function setTema(t, simpan = true) {
  const gelap = t === 'dark';
  document.documentElement.setAttribute('data-theme', gelap ? 'dark' : 'light');
  const b = document.getElementById('themeBtn'); b.replaceChildren(ikon(gelap ? 'sun' : 'moon', 20));
  b.title = gelap ? 'Beralih ke mode terang' : 'Beralih ke mode gelap';
  if (simpan) { try { localStorage.setItem('suratku-tema', t); } catch (e) { /* abaikan */ } }
}
export const terapkanTema = (t) => setTema(t);

function bangunNav() {
  const nav = document.getElementById('nav'); nav.replaceChildren();
  for (const [id, nm, ic] of MENU) nav.append(h('a', { href: '#/' + id, dataset: { id } }, ikon(ic, 20), h('span', null, nm)));
}
function tandaiNav(id) {
  const aktif = id === 'editor' ? 'buat' : id === 'templatedit' ? 'template' : id;
  document.querySelectorAll('#nav a').forEach((a) => { if (a.dataset.id === aktif) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  document.getElementById('topTitle').textContent = JUDUL[id] || 'SURATKU';
  document.body.classList.remove('nav-open');
}

export function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, qs] = raw.split('?');
  const seg = path.split('/').filter(Boolean).map(decodeURIComponent);
  const q = Object.fromEntries(new URLSearchParams(qs || '').entries());
  return { seg, q };
}
export const pergi = (hash) => { location.hash = hash; };
export const muatUlang = () => route();

let navToken = 0;
async function route() {
  const token = ++navToken;
  const { seg, q } = parseHash();
  const root = document.getElementById('view');
  if (App.leave) { const ok = await App.leave(); if (ok === false) { return; } }
  if (App.cleanup) { try { await App.cleanup(); } catch (e) { /* abaikan */ } App.cleanup = null; }
  App.leave = null;
  const id = seg[0] || 'dashboard';
  root.className = 'view'; root.replaceChildren();
  let fn; let key = id;
  switch (id) {
    case 'dashboard': fn = viewDashboard; break;
    case 'buat': fn = viewKatalog; break;
    case 'editor': fn = viewEditor; root.classList.add('full'); break;
    case 'template': if (seg[1] === 'edit') { fn = viewTemplatEdit; key = 'templatedit'; } else fn = viewTemplat; break;
    case 'arsip': fn = viewArsip; break;
    case 'organisasi': fn = viewOrganisasi; break;
    case 'pengaturan': fn = viewPengaturan; break;
    case 'bantuan': fn = viewBantuan; break;
    default: fn = viewDashboard; key = 'dashboard';
  }
  tandaiNav(key);
  document.title = (JUDUL[key] || 'SURATKU') + ' — SURATKU';
  try {
    const res = await fn(root, { seg, q, App });
    if (token !== navToken) { if (typeof res === 'function') res(); return; }
    if (typeof res === 'function') App.cleanup = res;
  } catch (e) {
    console.error(e);
    root.replaceChildren(h('div', { class: 'card' }, h('h2', null, 'Terjadi kesalahan'), h('p', null, 'Halaman tidak dapat dimuat: ' + (e && e.message ? e.message : e)), h('a', { class: 'btn', href: '#/dashboard' }, 'Kembali ke Dashboard')));
  }
  if (!root.classList.contains('full')) window.scrollTo(0, 0);
  const orgEl = document.getElementById('orgName'); orgEl.textContent = (Org.getOrg().nama || '').split('\n').pop();
  isiProfil();
}
function isiProfil() {
  const o = Org.getOrg(); const lg = Org.getLogos(); const nama = (o.nama || '').split('\n').pop().trim();
  const logo = ['muslimat', 'fatayat', 'alt'].map((k) => lg[k]).find((x) => x && x.dataUrl);
  const av = document.getElementById('profilAv');
  if (logo) av.replaceChildren(h('img', { src: logo.dataUrl, alt: '' })); else av.textContent = (nama || 'S').charAt(0).toUpperCase();
  document.getElementById('profilNama').textContent = nama || 'Organisasi Anda';
  document.getElementById('profilSub').textContent = nama ? (o.induk || '').split('\n').pop().trim() || 'Pengelola surat' : 'Lengkapi Data Organisasi';
}

async function boot() {
  bangunNav();
  document.getElementById('menuBtn').replaceChildren(ikon('menu', 22));
  document.getElementById('menuBtn').onclick = () => document.body.classList.toggle('nav-open');
  document.getElementById('scrim').onclick = () => document.body.classList.remove('nav-open');
  setTema(document.documentElement.getAttribute('data-theme') || 'light', false);
  await openDB();
  await Org.loadAll();
  const tema = Org.getSettings().tema;
  try { if (localStorage.getItem('suratku-tema') == null && tema !== 'auto') setTema(tema, false); } catch (e) { /* abaikan */ }
  document.getElementById('themeBtn').onclick = async () => {
    const gelap = document.documentElement.getAttribute('data-theme') === 'dark';
    const t = gelap ? 'light' : 'dark'; setTema(t);
    await Org.saveSettings({ ...Org.getSettings(), tema: t });
  };
  await muatFontArab();
  try { await initFonts(); } catch (e) { toast('Font dokumen gagal dimuat: ' + e.message, 'err'); }
  if (storageMode === 'memori') toast('Penyimpanan peramban tidak tersedia. Data hanya tersimpan sementara selama halaman terbuka.', 'err', 9000);
  window.addEventListener('hashchange', route);
  window.addEventListener('beforeunload', (e) => { if (App.dirty && App.dirty()) { e.preventDefault(); e.returnValue = ''; } });
  if (!location.hash) location.hash = '#/dashboard'; else route();
  mulaiPasang();
  try { if (document.fonts) for (const f of document.fonts) if (/^Surat/.test(f.family.replace(/["']/g, '')) && f.status === 'unloaded') f.load().catch(() => {}); } catch (e) { /* abaikan */ }
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    const adaPengendali = !!navigator.serviceWorker.controller; // false pada kunjungan pertama: tidak perlu ajakan muat ulang
    navigator.serviceWorker.register('sw.js').then((reg) => {
      const cek = () => reg.update().catch(() => {});
      setInterval(cek, 30 * 60 * 1000); document.addEventListener('visibilitychange', () => { if (!document.hidden) cek(); });
    }).catch(() => {});
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (adaPengendali) tampilPembaruan(); });
  }
}
function tampilPembaruan() {
  if (document.querySelector('.pembaruan')) return;
  const bar = h('div', { class: 'pembaruan', role: 'status' }, h('span', null, 'Versi baru SURATKU tersedia.'),
    h('button', { type: 'button', class: 'btn sm primary', onclick: () => location.reload() }, 'Muat ulang'),
    h('button', { type: 'button', class: 'btn sm', onclick: () => bar.remove() }, 'Nanti'));
  document.body.append(bar);
}
boot();

// Pengait uji (tidak dipakai aplikasi).
import * as Compose from './compose.js';
import { layout } from './layout.js';
import { buatPdf } from './pdf.js';
import { buatDocx } from './docx.js';
import { BUILTIN } from './templates.js';
window.SKDEV = { openDB, Org, initFonts, Compose, layout, buatPdf, buatDocx, BUILTIN, TtdModel, Models, Numbering };
