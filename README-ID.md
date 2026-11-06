# SURATKU Android (APK)

Proyek Android native WebView untuk membungkus website SURATKU yang diberikan. Berkas HTML/CSS/JavaScript, font, ikon, vendor, dan `dist/app.js` disertakan di `app/src/main/assets/www/`.

## Fitur wrapper
- Tampilan aplikasi fullscreen tanpa address bar browser.
- Penyimpanan IndexedDB dan DOM storage pada origin HTTPS lokal yang stabil.
- Tetap bisa digunakan offline karena seluruh aset web dibundel ke APK.
- Tombol Back Android untuk navigasi dalam aplikasi.
- Pemilih file untuk fitur unggah di web.
- Unduhan berkas Blob/Data (PDF/DOCX dan file hasil ekspor) diarahkan ke `Download/SURATKU`.
- Perintah cetak diarahkan ke layanan cetak Android / simpan PDF.
- Ikon launcher memakai ikon SURATKU dari proyek web.

## Membuat APK di Windows 10

1. Install **Android Studio** dan saat instalasi pastikan Android SDK, Android SDK Platform 35, Android SDK Build-Tools 35, dan Android SDK Command-line Tools ikut terpasang.
2. Buka Android Studio sekali, selesaikan setup SDK.
3. Ekstrak folder `SURATKU-Android` dari ZIP ini.
4. Pastikan JDK tersedia (Android Studio sudah menyertakan JBR). Jika SDK berada di lokasi standar `%LOCALAPPDATA%\Android\Sdk`, skrip akan mendeteksinya.
5. Klik dua kali `build-apk.bat`. Skrip akan mengunduh Gradle 8.9 (perlu internet) lalu membangun APK debug.
6. Hasil APK ada di:

   `app\build\outputs\apk\debug\app-debug.apk`

7. Pindahkan APK ke HP Android, buka file APK, lalu izinkan **Install unknown apps** jika diminta.

## Build melalui Android Studio

Buka folder proyek ini di Android Studio. Jika Android Studio meminta sinkronisasi Gradle, izinkan. Setelah SDK Platform 35 tersedia, pilih **Build > Build Bundle(s) / APK(s) > Build APK(s)**. Hasil debug APK ada pada path di atas.

## Identitas aplikasi
- Nama: SURATKU
- Application ID: `id.maulanoffice.suratku`
- Versi awal: `1.0.0` (versionCode 1)
- Minimum Android: Android 8.0 (API 26)

## Catatan
APK belum ditandatangani sebagai rilis Google Play; ini adalah APK debug untuk instalasi langsung dan pengujian. Untuk distribusi publik permanen, buat signed APK dari Android Studio. Data aplikasi tersimpan lokal di perangkat. Hapus data aplikasi/uninstall dapat menghapus data lokal; gunakan fitur cadangan di SURATKU secara berkala.
