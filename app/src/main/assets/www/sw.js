// Service worker sederhana: menyimpan berkas aplikasi agar dapat dipakai tanpa internet.
const VER = 'suratku-v40';
const ASET = ['./', 'index.html', 'css/app.css', 'dist/app.js', 'manifest.webmanifest', 'ikrom.svg', 'icon-192.png', 'icon-512.png',
  'fonts/Inter-Regular.woff', 'fonts/Inter-Medium.woff', 'fonts/Inter-SemiBold.woff', 'fonts/Poppins-Regular.woff', 'fonts/Poppins-Medium.woff', 'fonts/Poppins-Bold.woff',
  'fonts/LiberationSerif-Regular.woff', 'fonts/LiberationSerif-Bold.woff', 'fonts/LiberationSerif-Italic.woff', 'fonts/LiberationSerif-BoldItalic.woff',
  'fonts/LiberationSans-Regular.woff', 'fonts/LiberationSans-Bold.woff', 'fonts/LiberationSans-Italic.woff', 'fonts/LiberationSans-BoldItalic.woff',
  'fonts/LiberationMono-Regular.ttf', 'fonts/LiberationMono-Bold.ttf', 'fonts/LiberationMono-Italic.ttf', 'fonts/LiberationMono-BoldItalic.ttf', 'fonts/Arab-FreeSerif.woff', 'fonts/Arab-FreeSerifBold.woff'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VER).then((c) => c.addAll(ASET)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VER).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then((r) => { if (r.ok && new URL(e.request.url).origin === location.origin) { const cp = r.clone(); caches.open(VER).then((c) => c.put(e.request, cp)); } return r; }).catch(() => caches.match(e.request).then((m) => m || caches.match('index.html'))));
});
