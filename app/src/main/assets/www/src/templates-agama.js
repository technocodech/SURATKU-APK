// Template surat untuk organisasi keagamaan (masjid, musala, majelis taklim, TPQ, pesantren, yayasan dakwah, jamaah, dll.).
// Bacaan Arab memakai blok "Teks Arab" yang bisa diubah atau dihapus. Isi disesuaikan lewat formulir; periksa kembali sebelum dikirim.
import { FRASA_ARAB } from './arab.js';
const f = (key, label, type = 'text', extra = {}) => ({ key, label, type, ...extra });
const P = (text, extra = {}) => ({ type: 'p', text, align: 'justify', ...extra });
const OL = (items) => ({ type: 'ol', text: Array.isArray(items) ? items.join('\n') : items });
const AR = (i, extra = {}) => ({ type: 'ar', text: FRASA_ARAB[i][1], size: 22, align: 'center', ...extra });
const KV = (ref = 'kegiatan') => ({ type: 'kv', ref });
const kegiatan = (labelNama, ph = '') => [
  f('nama_kegiatan', labelNama, 'text', { required: true, group: 'kegiatan', ph }),
  f('tanggal_kegiatan', 'Tanggal', 'date', { required: true, group: 'kegiatan' }),
  f('waktu_mulai', 'Waktu mulai', 'time', { required: true, group: 'kegiatan' }),
  f('waktu_selesai', 'Waktu selesai', 'time', { group: 'kegiatan', hint: 'Kosongkan bila tertulis "selesai".' }),
  f('tempat_kegiatan', 'Tempat', 'text', { required: true, group: 'kegiatan' }),
  f('alamat_tempat', 'Alamat tempat', 'text', { group: 'kegiatan' }),
];
const K = (id, nama, kata, ext) => ({ id, nama, kategori: 'keagamaan', kata: 'keagamaan islam masjid ' + kata, kind: 'surat', salam: true, groups: { identitas: true, penerima: true, kegiatan: false }, ...ext });
const GK = { identitas: true, penerima: true, kegiatan: true };
const HADIR = 'Demikian undangan ini kami sampaikan. Atas kehadiran dan partisipasi Bapak/Ibu/Saudara/i, kami ucapkan terima kasih. Jazakumullahu khairan.';
const KHUSUS = (key, label, type = 'text', extra = {}) => f(key, label, type, { group: 'khusus', ...extra });
const UND_AWAL = 'Dengan hormat, semoga Bapak/Ibu/Saudara/i senantiasa dalam lindungan dan limpahan rahmat Allah SWT. Aamiin.';

export const AGAMA = [
  K('agama-undangan-pengajian', 'Undangan Pengajian / Majelis Taklim', 'pengajian majelis taklim kajian ceramah', {
    groups: GK, defaults: { perihal: 'Undangan Pengajian' },
    fields: [...kegiatan('Nama pengajian', 'mis. Pengajian Rutin Bulanan'), KHUSUS('penceramah', 'Penceramah'), KHUSUS('tema', 'Tema pengajian')],
    closings: [HADIR],
    body: [AR(0), P(UND_AWAL, { align: 'left' }), P('Dalam rangka menambah keilmuan, mempererat ukhuwah islamiyah, dan meningkatkan ketakwaan, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri {{nama_kegiatan}} yang akan dilaksanakan pada:'), KV(), P('Pengajian ini diisi oleh {{penceramah}} dengan tema "{{tema}}".', { optionalVars: ['penceramah'], alt: 'Pengajian ini terbuka untuk umum.' }), P('Kami berharap kehadiran Bapak/Ibu/Saudara/i tepat pada waktunya.')],
  }),
  K('agama-undangan-tabligh', 'Undangan Tabligh Akbar / Pengajian Umum', 'tabligh akbar pengajian umum dakwah', {
    groups: GK, defaults: { perihal: 'Undangan Tabligh Akbar' },
    fields: [...kegiatan('Nama acara', 'mis. Tabligh Akbar Peringatan 1 Muharam'), KHUSUS('penceramah', 'Penceramah utama'), KHUSUS('tema', 'Tema'), KHUSUS('susunan_acara', 'Susunan acara (satu per baris)', 'textarea', { ph: 'Pembukaan\nPembacaan ayat suci Al-Qur\'an\nSambutan\nTausiyah\nDoa penutup' })],
    closings: [HADIR],
    body: [AR(0), P(UND_AWAL, { align: 'left' }), P('Sehubungan dengan akan diselenggarakannya {{nama_kegiatan}}, kami mengundang Bapak/Ibu/Saudara/i untuk berkenan hadir pada:'), KV(), P('Acara ini menghadirkan {{penceramah}} dengan tema "{{tema}}".', { optionalVars: ['penceramah'] }), P('Adapun susunan acara sebagai berikut:', { optionalVars: ['susunan_acara'], align: 'left' }), OL('{{susunan_acara}}'), P('Besar harapan kami atas kehadiran dan dukungan Bapak/Ibu/Saudara/i demi kelancaran acara tersebut.')],
  }),
  K('agama-undangan-tahlil', 'Undangan Tahlil dan Yasinan', 'tahlil yasin yasinan doa arwah almarhum hari ketiga tujuh',
    { groups: GK, defaults: { perihal: 'Undangan Tahlil dan Yasinan' },
      fields: [...kegiatan('Nama acara', 'mis. Tahlil dan Doa Bersama'), KHUSUS('nama_almarhum', 'Nama almarhum/almarhumah', 'text', { required: true }), KHUSUS('peringatan', 'Peringatan', 'text', { ph: 'mis. hari ke-7, ke-40, ke-100, atau haul pertama' })],
      closings: ['Demikian undangan ini kami sampaikan. Atas kehadiran dan doa Bapak/Ibu/Saudara/i, kami ucapkan terima kasih. Jazakumullahu khairan.'],
      body: [AR(0), P(UND_AWAL, { align: 'left' }), P('Sehubungan dengan peringatan {{peringatan}} wafatnya {{nama_almarhum}}, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri {{nama_kegiatan}} yang akan dilaksanakan pada:', { optionalVars: ['peringatan'], alt: 'Untuk mendoakan {{nama_almarhum}}, kami mengundang Bapak/Ibu/Saudara/i menghadiri {{nama_kegiatan}} yang akan dilaksanakan pada:' }), KV(), P('Semoga amal ibadah beliau diterima di sisi Allah SWT dan keluarga yang ditinggalkan diberi ketabahan.')] }),
  K('agama-undangan-maulid', 'Undangan Peringatan Maulid Nabi Muhammad SAW', 'maulid nabi muhammad saw rabiul awal shalawat', {
    groups: GK, defaults: { perihal: 'Undangan Peringatan Maulid Nabi Muhammad SAW' },
    fields: [...kegiatan('Nama acara', 'mis. Peringatan Maulid Nabi Muhammad SAW 1448 H'), KHUSUS('penceramah', 'Penceramah / pembaca maulid'), KHUSUS('tema', 'Tema')],
    closings: [HADIR],
    body: [AR(0), P(UND_AWAL, { align: 'left' }), P('Dalam rangka memperingati kelahiran Nabi Besar Muhammad SAW, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri {{nama_kegiatan}} yang akan dilaksanakan pada:'), KV(), P('Acara ini diisi oleh {{penceramah}} dengan tema "{{tema}}".', { optionalVars: ['penceramah'] }), AR(3, { size: 20 }), P('Semoga kita semua mendapatkan syafaat beliau di hari kiamat. Kehadiran Bapak/Ibu/Saudara/i sangat kami harapkan.')],
  }),
  K('agama-undangan-isra-miraj', "Undangan Peringatan Isra' Mi'raj", 'isra miraj rajab peringatan hari besar islam', {
    groups: GK, defaults: { perihal: "Undangan Peringatan Isra' Mi'raj" },
    fields: [...kegiatan('Nama acara', "mis. Peringatan Isra' Mi'raj Nabi Muhammad SAW"), KHUSUS('penceramah', 'Penceramah'), KHUSUS('tema', 'Tema')],
    closings: [HADIR],
    body: [AR(0), P(UND_AWAL, { align: 'left' }), P("Dalam rangka memperingati Isra' Mi'raj Nabi Muhammad SAW, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri {{nama_kegiatan}} yang akan dilaksanakan pada:"), KV(), P('Acara ini diisi oleh {{penceramah}} dengan tema "{{tema}}".', { optionalVars: ['penceramah'] }), P('Kami berharap kehadiran Bapak/Ibu/Saudara/i demi kelancaran dan keberkahan acara tersebut.')],
  }),
  K('agama-undangan-haul', 'Undangan Haul', 'haul wafat ulama kiai tokoh peringatan', {
    groups: GK, defaults: { perihal: 'Undangan Haul' },
    fields: [...kegiatan('Nama acara', 'mis. Haul ke-10 KH. ...'), KHUSUS('nama_tokoh', 'Nama yang dihauli', 'text', { required: true }), KHUSUS('penceramah', 'Penceramah')],
    closings: ['Demikian undangan ini kami sampaikan. Atas kehadiran dan doa Bapak/Ibu/Saudara/i, kami ucapkan terima kasih. Jazakumullahu khairan.'],
    body: [AR(0), P(UND_AWAL, { align: 'left' }), P('Dalam rangka memperingati wafatnya {{nama_tokoh}}, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri {{nama_kegiatan}} yang akan dilaksanakan pada:'), KV(), P('Acara diisi dengan pembacaan tahlil, doa bersama, dan tausiyah oleh {{penceramah}}.', { optionalVars: ['penceramah'], alt: 'Acara diisi dengan pembacaan tahlil, doa bersama, dan tausiyah.' }), P('Semoga amal ibadah beliau diterima Allah SWT dan kita dapat meneladani perjuangan beliau.')],
  }),
  K('agama-undangan-bukber', 'Undangan Buka Puasa Bersama / Kegiatan Ramadan', 'ramadan buka puasa bersama bukber tarawih sahur', {
    groups: GK, defaults: { perihal: 'Undangan Buka Puasa Bersama' },
    fields: [...kegiatan('Nama acara', 'mis. Buka Puasa Bersama dan Santunan Anak Yatim'), KHUSUS('rangkaian', 'Rangkaian acara (satu per baris)', 'textarea', { ph: 'Tausiyah\nBuka puasa bersama\nShalat Maghrib berjamaah' })],
    closings: [HADIR],
    body: [AR(0), P(UND_AWAL, { align: 'left' }), P('Dalam rangka mengisi bulan suci Ramadan dengan kebaikan dan mempererat silaturahmi, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri {{nama_kegiatan}} yang akan dilaksanakan pada:'), KV(), P('Adapun rangkaian acara sebagai berikut:', { optionalVars: ['rangkaian'], align: 'left' }), OL('{{rangkaian}}'), P('Semoga Allah SWT menerima amal ibadah kita semua di bulan yang penuh berkah ini.')],
  }),
  K('agama-undangan-halal-bihalal', 'Undangan Halal Bihalal', 'halal bihalal syawal idul fitri silaturahmi lebaran', {
    groups: GK, defaults: { perihal: 'Undangan Halal Bihalal' },
    fields: [...kegiatan('Nama acara', 'mis. Halal Bihalal Keluarga Besar ...'), KHUSUS('tema', 'Tema (opsional)'), KHUSUS('penceramah', 'Penceramah (opsional)')],
    closings: [HADIR],
    body: [AR(0), P('Dengan hormat, taqabbalallahu minna wa minkum. Mohon maaf lahir dan batin.', { align: 'left' }), P('Dalam rangka mempererat tali silaturahmi pada bulan Syawal, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri {{nama_kegiatan}} yang akan dilaksanakan pada:'), KV(), P('Acara ini mengangkat tema "{{tema}}".', { optionalVars: ['tema'] }), P('Tausiyah disampaikan oleh {{penceramah}}.', { optionalVars: ['penceramah'] }), P('Kehadiran Bapak/Ibu/Saudara/i sangat kami harapkan.')],
  }),
  K('agama-undangan-walimah', "Undangan Walimatul 'Ursy (Pernikahan)", 'walimah walimatul ursy pernikahan resepsi mempelai akad nikah', {
    groups: { identitas: false, penerima: false, kegiatan: false }, header: 'none', kop: 'none', defaults: { perihal: 'Undangan Pernikahan' },
    fields: [KHUSUS('mempelai_pria', 'Mempelai pria (nama lengkap)', 'text', { required: true }), KHUSUS('orang_tua_pria', 'Putra dari (orang tua pria)'), KHUSUS('mempelai_wanita', 'Mempelai wanita (nama lengkap)', 'text', { required: true }), KHUSUS('orang_tua_wanita', 'Putri dari (orang tua wanita)'),
      KHUSUS('akad_hari', 'Akad nikah: tanggal', 'date'), KHUSUS('akad_waktu', 'Akad nikah: waktu'), KHUSUS('resepsi_tanggal', 'Resepsi: tanggal', 'date', { required: true }), KHUSUS('resepsi_waktu', 'Resepsi: waktu', 'text', { required: true }), KHUSUS('lokasi', 'Tempat', 'text', { required: true }), KHUSUS('alamat_lokasi', 'Alamat tempat')],
    closings: ['Atas kehadiran dan doa restu Bapak/Ibu/Saudara/i, kami mengucapkan terima kasih. Jazakumullahu khairan.'],
    ttd: { pengantar: 'Hormat kami,' }, signer: [{ role: 'lain', jabatan: 'Keluarga Mempelai', posisi: 'kanan' }],
    body: [AR(0), AR(1, { size: 18 }), P('Dengan memohon rahmat dan ridha Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri pernikahan putra-putri kami:', { align: 'center' }),
      { type: 'h', text: '{{mempelai_pria}}', align: 'center', bold: true }, P('Putra dari {{orang_tua_pria}}', { align: 'center', optionalVars: ['orang_tua_pria'] }), P('dengan', { align: 'center' }), { type: 'h', text: '{{mempelai_wanita}}', align: 'center', bold: true }, P('Putri dari {{orang_tua_wanita}}', { align: 'center', optionalVars: ['orang_tua_wanita'] }),
      { type: 'kv', rows: [{ label: 'Akad nikah', tpl: '{{akad_hari}}, pukul {{akad_waktu}}', opt: true }, { label: 'Resepsi', tpl: '{{resepsi_tanggal}}, pukul {{resepsi_waktu}}', opt: false }, { label: 'Tempat', tpl: '{{lokasi}}{{alamat_lokasi}}', opt: false, fmt: { alamat_lokasi: '\n{v}' } }] },
      P('Merupakan kebahagiaan dan kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.')],
  }),
  K('agama-undangan-rapat-takmir', 'Undangan Rapat Takmir / Pengurus Masjid', 'rapat takmir dkm pengurus masjid musala musyawarah', {
    groups: GK, defaults: { perihal: 'Undangan Rapat' },
    fields: [...kegiatan('Nama rapat', 'mis. Rapat Pengurus Takmir Bulanan'), KHUSUS('agenda', 'Agenda (satu per baris)', 'textarea', { required: true, ph: 'Laporan keuangan\nPersiapan hari besar Islam\nLain-lain' })],
    closings: ['Demikian undangan ini kami sampaikan. Atas kehadiran Bapak/Ibu/Saudara/i, kami ucapkan terima kasih. Jazakumullahu khairan.'],
    body: [P('Dengan hormat,', { align: 'left' }), P('Sehubungan dengan perlunya pembahasan bersama demi kemakmuran masjid dan kelancaran program, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri {{nama_kegiatan}} yang akan dilaksanakan pada:'), KV(), P('Adapun agenda yang akan dibahas:', { align: 'left' }), OL('{{agenda}}'), P('Mengingat pentingnya pembahasan tersebut, kami mengharapkan kehadiran Bapak/Ibu/Saudara/i tepat waktu.')],
  }),
  K('agama-undangan-khataman', 'Undangan Khataman / Wisuda TPQ', 'khataman wisuda tpq tpa madrasah diniyah santri quran haflah akhirussanah', {
    groups: GK, defaults: { perihal: 'Undangan Khataman dan Wisuda Santri' },
    fields: [...kegiatan('Nama acara', "mis. Khataman Al-Qur'an dan Wisuda Santri TPQ"), KHUSUS('jumlah_wisudawan', 'Jumlah santri yang diwisuda'), KHUSUS('susunan_acara', 'Susunan acara (satu per baris)', 'textarea')],
    closings: [HADIR],
    body: [AR(0), P(UND_AWAL, { align: 'left' }), P("Dalam rangka khataman Al-Qur'an dan wisuda santri, kami mengundang Bapak/Ibu/Saudara/i, khususnya orang tua/wali santri, untuk menghadiri {{nama_kegiatan}} yang akan dilaksanakan pada:"), KV(), P('Pada acara ini sebanyak {{jumlah_wisudawan}} santri akan diwisuda.', { optionalVars: ['jumlah_wisudawan'] }), P('Susunan acara:', { optionalVars: ['susunan_acara'], align: 'left' }), OL('{{susunan_acara}}'), P('Kehadiran Bapak/Ibu/Saudara/i merupakan dukungan dan motivasi bagi putra-putri kita.')],
  }),
  K('agama-pemberitahuan-idul', 'Pemberitahuan Pelaksanaan Shalat Idul Fitri / Idul Adha', 'shalat id idul fitri idul adha takbiran khatib imam lebaran', {
    groups: GK, defaults: { perihal: 'Pemberitahuan Pelaksanaan Shalat Id' },
    fields: [...kegiatan('Nama kegiatan', 'mis. Shalat Idul Fitri 1448 H'), KHUSUS('imam', 'Imam'), KHUSUS('khatib', 'Khatib'), KHUSUS('catatan', 'Catatan untuk jamaah (satu per baris)', 'textarea', { ph: 'Membawa sajadah masing-masing\nMenjaga kebersihan lingkungan' })],
    closings: ['Demikian pemberitahuan ini kami sampaikan untuk diketahui dan diumumkan kepada jamaah. Jazakumullahu khairan.'],
    body: [AR(0), P('Dengan hormat,', { align: 'left' }), P('Diberitahukan kepada seluruh jamaah bahwa {{nama_kegiatan}} akan dilaksanakan pada:'), KV(), P('Bertindak sebagai imam {{imam}} dan khatib {{khatib}}.', { optionalVars: ['imam'] }), P('Hal-hal yang perlu diperhatikan jamaah:', { optionalVars: ['catatan'], align: 'left' }), OL('{{catatan}}'), P('Mari kita meramaikan hari raya dengan ibadah dan kebersamaan.')],
  }),
  K('agama-pemberitahuan-zis', 'Pemberitahuan Penerimaan dan Penyaluran Zakat/Infak/Sedekah', 'zakat fitrah infak sedekah zis amil baznas penyaluran mustahik', {
    groups: { identitas: true, penerima: true, kegiatan: false }, defaults: { perihal: 'Penerimaan dan Penyaluran Zakat, Infak, dan Sedekah' },
    fields: [KHUSUS('jenis', 'Jenis (zakat fitrah/zakat mal/infak/sedekah)', 'text', { required: true }), KHUSUS('periode', 'Periode penerimaan'), KHUSUS('lokasi_penerimaan', 'Tempat penerimaan', 'text', { required: true }), KHUSUS('waktu_penerimaan', 'Waktu penerimaan'), KHUSUS('ketentuan', 'Ketentuan/informasi (satu per baris)', 'textarea'), KHUSUS('penyaluran', 'Rencana penyaluran', 'textarea')],
    closings: ['Demikian pemberitahuan ini kami sampaikan. Semoga Allah SWT menerima amal ibadah kita dan melipatgandakan pahalanya. Jazakumullahu khairan.'],
    body: [AR(0), P('Dengan hormat,', { align: 'left' }), P('Kami memberitahukan bahwa panitia/amil {{nama_organisasi}} membuka penerimaan {{jenis}} pada {{periode}} bertempat di {{lokasi_penerimaan}}, setiap {{waktu_penerimaan}}.', { optionalVars: ['periode'], alt: 'Kami memberitahukan bahwa panitia/amil {{nama_organisasi}} membuka penerimaan {{jenis}} bertempat di {{lokasi_penerimaan}}.' }), P('Ketentuan dan informasi:', { optionalVars: ['ketentuan'], align: 'left' }), OL('{{ketentuan}}'), P('Rencana penyaluran: {{penyaluran}}', { optionalVars: ['penyaluran'] })],
  }),
  K('agama-pemberitahuan-kurban', 'Pemberitahuan Panitia Kurban', 'kurban idul adha hewan qurban panitia penyembelihan daging pembagian', {
    groups: GK, defaults: { perihal: 'Pemberitahuan Pelaksanaan Kurban' },
    fields: [...kegiatan('Nama kegiatan', 'mis. Penyembelihan dan Pembagian Daging Kurban'), KHUSUS('pendaftaran', 'Pendaftaran/penyerahan hewan kurban sampai tanggal', 'date'), KHUSUS('lokasi_daftar', 'Tempat pendaftaran'), KHUSUS('informasi', 'Informasi lain (satu per baris)', 'textarea', { ph: 'Pembagian daging dilakukan setelah penyembelihan\nPenerima mengambil kupon di panitia' })],
    closings: ['Demikian pemberitahuan ini kami sampaikan. Semoga ibadah kurban kita diterima Allah SWT. Jazakumullahu khairan.'],
    body: [AR(0), P('Dengan hormat,', { align: 'left' }), P('Sehubungan dengan Hari Raya Idul Adha, panitia kurban {{nama_organisasi}} memberitahukan pelaksanaan {{nama_kegiatan}} pada:'), KV(), P('Pendaftaran dan penyerahan hewan kurban dibuka sampai tanggal {{pendaftaran}} bertempat di {{lokasi_daftar}}.', { optionalVars: ['pendaftaran'] }), OL('{{informasi}}')],
  }),
  K('agama-permohonan-penceramah', 'Permohonan Penceramah / Khatib / Imam', 'permohonan penceramah ustadz kiai khatib imam undangan mengisi pengajian', {
    groups: GK, defaults: { perihal: 'Permohonan Kesediaan Mengisi Acara' },
    fields: [...kegiatan('Nama acara'), KHUSUS('tema', 'Tema/materi yang diharapkan'), KHUSUS('peserta', 'Perkiraan jumlah jamaah')],
    closings: ['Demikian permohonan ini kami sampaikan. Atas kesediaan dan perkenan Bapak/Ibu, kami ucapkan terima kasih. Jazakumullahu khairan.'],
    body: [AR(0), P('Dengan hormat,', { align: 'left' }), P('Sehubungan dengan akan diselenggarakannya {{nama_kegiatan}}, kami memohon kesediaan Bapak/Ibu untuk berkenan mengisi acara tersebut yang akan dilaksanakan pada:'), KV(), P('Adapun materi yang kami harapkan adalah {{tema}}.', { optionalVars: ['tema'] }), P('Acara ini diperkirakan dihadiri sekitar {{peserta}} jamaah.', { optionalVars: ['peserta'] }), P('Besar harapan kami atas kesediaan Bapak/Ibu demi kelancaran acara tersebut.')],
  }),
  K('agama-permohonan-bantuan', 'Permohonan Bantuan Dana (Masjid/Musala/TPQ/Kegiatan)', 'permohonan bantuan dana sumbangan infak pembangunan renovasi masjid musala tpq proposal donatur', {
    groups: { identitas: true, penerima: true, kegiatan: false }, defaults: { perihal: 'Permohonan Bantuan Dana' },
    fields: [KHUSUS('tujuan', 'Keperluan bantuan', 'text', { required: true, ph: 'mis. renovasi atap masjid' }), KHUSUS('latar', 'Latar belakang singkat', 'textarea'), KHUSUS('kebutuhan', 'Perkiraan kebutuhan dana', 'money'), KHUSUS('rekening', 'Rekening penerima (opsional)'), KHUSUS('lampiran_proposal', 'Lampiran (mis. proposal, RAB)')],
    closings: ['Demikian permohonan ini kami sampaikan. Semoga kebaikan Bapak/Ibu dibalas berlipat ganda oleh Allah SWT. Jazakumullahu khairan.'],
    body: [AR(0), P('Dengan hormat,', { align: 'left' }), P('Kami {{nama_organisasi}} bermaksud melaksanakan {{tujuan}}. {{latar}}', { optionalVars: ['latar'], alt: 'Kami {{nama_organisasi}} bermaksud melaksanakan {{tujuan}}.' }), P('Untuk itu kami memerlukan dana sekitar {{kebutuhan}}. Dengan segala kerendahan hati, kami memohon bantuan dan partisipasi Bapak/Ibu sesuai kemampuan.', { optionalVars: ['kebutuhan'], alt: 'Dengan segala kerendahan hati, kami memohon bantuan dan partisipasi Bapak/Ibu sesuai kemampuan.' }), P('Bantuan dapat disalurkan melalui rekening {{rekening}} atau diserahkan langsung kepada pengurus.', { optionalVars: ['rekening'] }), P('Rincian kebutuhan terlampir pada {{lampiran_proposal}}.', { optionalVars: ['lampiran_proposal'] })],
  }),
  K('agama-takziah', 'Surat Takziah / Belasungkawa', 'takziah belasungkawa duka wafat meninggal innalillahi', {
    signer: ['ketua'],
    groups: { identitas: true, penerima: true, kegiatan: false }, defaults: { perihal: 'Ucapan Belasungkawa' }, header: 'standar',
    fields: [KHUSUS('nama_almarhum', 'Nama almarhum/almarhumah', 'text', { required: true }), KHUSUS('hubungan', 'Hubungan dengan penerima (mis. ayahanda, ibunda)'), KHUSUS('tanggal_wafat', 'Tanggal wafat', 'date'), KHUSUS('pesan', 'Pesan tambahan (opsional)', 'textarea')],
    closings: ['Semoga almarhum diampuni segala dosanya, diterima amal ibadahnya, dan ditempatkan di tempat terbaik di sisi-Nya.'],
    body: [{ type: 'ar', text: 'إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ', size: 22, align: 'center' }, P('Dengan hormat,', { align: 'left' }), P('Kami {{nama_organisasi}} mengucapkan turut berduka cita yang sedalam-dalamnya atas wafatnya {{hubungan}} Bapak/Ibu, {{nama_almarhum}}, pada tanggal {{tanggal_wafat}}.', { optionalVars: ['tanggal_wafat'], alt: 'Kami {{nama_organisasi}} mengucapkan turut berduka cita yang sedalam-dalamnya atas wafatnya {{nama_almarhum}}.' }), P('{{pesan}}', { optionalVars: ['pesan'] }), P('Semoga keluarga yang ditinggalkan diberi kesabaran, ketabahan, dan keikhlasan dalam menghadapi ujian ini.')],
  }),
  K('agama-tugas-khatib', 'Surat Tugas Khatib / Imam / Penceramah', 'surat tugas khatib imam penceramah dai mubalig jumat', {
    signer: ['ketua'], groups: { identitas: true, penerima: false, kegiatan: true }, kind: 'surat', defaults: { perihal: 'Surat Tugas' }, header: 'standar',
    fields: [KHUSUS('nama_petugas', 'Nama yang ditugaskan', 'text', { required: true }), KHUSUS('jabatan_petugas', 'Jabatan/keterangan'), KHUSUS('jenis_tugas', 'Jenis tugas', 'text', { required: true, ph: 'mis. khatib shalat Jumat' }), ...kegiatan('Nama kegiatan')],
    closings: ['Demikian surat tugas ini dibuat untuk dilaksanakan dengan penuh amanah dan tanggung jawab.'],
    ttd: { pengantar: '' },
    body: [AR(0), P('Yang bertanda tangan di bawah ini, pengurus {{nama_organisasi}}, memberikan tugas kepada:', { align: 'left' }), { type: 'kv', rows: [{ label: 'Nama', tpl: '{{nama_petugas}}' }, { label: 'Jabatan', tpl: '{{jabatan_petugas}}', opt: true }] }, P('Untuk bertugas sebagai {{jenis_tugas}} pada kegiatan {{nama_kegiatan}} yang dilaksanakan pada:'), KV(), P('Semoga Allah SWT memberikan kemudahan dan keberkahan atas tugas ini.')],
  }),
  K('agama-keterangan-mengajar', 'Surat Keterangan Mengajar / Pengurus (TPQ, Madin, Majelis)', 'keterangan mengajar guru ngaji ustadz ustadzah pengurus aktif tpq madin majelis', {
    signer: ['ketua'],
    groups: { identitas: true, penerima: false, kegiatan: false }, kategori: 'keagamaan', defaults: { perihal: 'Surat Keterangan' }, header: 'judul', judul: 'SURAT KETERANGAN',
    fields: [KHUSUS('nama_pemohon', 'Nama', 'text', { required: true }), KHUSUS('ttl', 'Tempat, tanggal lahir'), KHUSUS('alamat', 'Alamat'), KHUSUS('peran', 'Peran', 'text', { required: true, ph: 'mis. pengajar Al-Qur\'an / pengurus' }), KHUSUS('sejak', 'Sejak (tahun/tanggal)'), KHUSUS('keperluan', 'Untuk keperluan')],
    closings: ['Demikian surat keterangan ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.'],
    ttd: { pengantar: '' }, salam: false,
    body: [P('Yang bertanda tangan di bawah ini menerangkan bahwa:', { align: 'left' }), { type: 'kv', rows: [{ label: 'Nama', tpl: '{{nama_pemohon}}' }, { label: 'Tempat/Tgl. Lahir', tpl: '{{ttl}}', opt: true }, { label: 'Alamat', tpl: '{{alamat}}', opt: true }] }, P('Benar yang bersangkutan adalah {{peran}} pada {{nama_organisasi}} sejak {{sejak}}, dan sampai surat ini dibuat masih aktif menjalankan tugasnya dengan baik.', { optionalVars: ['sejak'], alt: 'Benar yang bersangkutan adalah {{peran}} pada {{nama_organisasi}} dan masih aktif menjalankan tugasnya dengan baik.' }), P('Surat keterangan ini dibuat untuk keperluan {{keperluan}}.', { optionalVars: ['keperluan'] })],
  }),
  K('agama-rekomendasi', 'Surat Rekomendasi Ustadz / Santri / Pengurus', 'rekomendasi ustadz santri pengurus beasiswa pesantren da\'i', {
    signer: ['ketua'],
    groups: { identitas: true, penerima: true, kegiatan: false }, defaults: { perihal: 'Surat Rekomendasi' },
    fields: [KHUSUS('nama_pemohon', 'Nama yang direkomendasikan', 'text', { required: true }), KHUSUS('keperluan', 'Direkomendasikan untuk', 'text', { required: true }), KHUSUS('alasan', 'Dasar rekomendasi (kiprah/akhlak/prestasi)', 'textarea', { required: true })],
    closings: ['Demikian rekomendasi ini kami berikan agar dapat dipergunakan sebagaimana mestinya.'],
    ttd: { pengantar: '' },
    body: [AR(0), P('Dengan hormat,', { align: 'left' }), P('Yang bertanda tangan di bawah ini, pengurus {{nama_organisasi}}, merekomendasikan {{nama_pemohon}} untuk {{keperluan}}.'), P('Berdasarkan pengetahuan kami, {{alasan}}'), P('Semoga rekomendasi ini bermanfaat dan menjadi amanah bagi yang bersangkutan.')],
  }),
];
