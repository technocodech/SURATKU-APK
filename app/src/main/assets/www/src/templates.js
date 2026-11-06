import { UMUM } from './templates-umum.js';
import { AGAMA } from './templates-agama.js';
import { MODEL } from './templates-model.js';
// Katalog template bawaan. Setiap template punya struktur, kolom isian, dan isi sendiri.
// Isi memakai variabel {{nama_variabel}}. Blok: p, ol, ul, h, kv, table, sp, saldo, jadwal.

const f = (key, label, type = 'text', extra = {}) => ({ key, label, type, ...extra });
const P = (text, extra = {}) => ({ type: 'p', text, align: 'justify', ...extra });
const OL = (items) => ({ type: 'ol', text: Array.isArray(items) ? items.join('\n') : items });
const UL = (items) => ({ type: 'ul', text: Array.isArray(items) ? items.join('\n') : items });
const H = (text, extra = {}) => ({ type: 'h', text, align: 'left', ...extra });
const KV = (ref = 'kegiatan') => ({ type: 'kv', ref });
const TBL = (ref, title) => ({ type: 'table', ref, title });
const SP = () => ({ type: 'sp' });

// Kolom isian bersama
export const G = {
  perihal: (def) => f('perihal', 'Perihal', 'text', { required: true, group: 'identitas', default: def }),
};
const kegiatanOpsi = (labelNama = 'Nama kegiatan') => [
  f('nama_kegiatan', labelNama, 'text', { required: true, group: 'kegiatan', ph: 'mis. Pengajian Rutin Bulanan' }),
  f('tanggal_kegiatan', 'Tanggal', 'date', { required: true, group: 'kegiatan' }),
  f('waktu_mulai', 'Waktu mulai', 'time', { required: true, group: 'kegiatan' }),
  f('waktu_selesai', 'Waktu selesai', 'time', { group: 'kegiatan', hint: 'Kosongkan bila tertulis "selesai".' }),
  f('tempat_kegiatan', 'Tempat', 'text', { required: true, group: 'kegiatan' }),
  f('alamat_tempat', 'Alamat tempat', 'text', { group: 'kegiatan' }),
  f('tujuan_kegiatan', 'Tujuan kegiatan', 'textarea', { group: 'kegiatan' }),
  f('penanggung_jawab', 'Penanggung jawab', 'text', { group: 'kegiatan' }),
  f('info_tambahan', 'Informasi tambahan', 'textarea', { group: 'kegiatan' }),
];

const TUTUP = {
  terimaKasih: 'Atas perhatian dan kerja samanya, kami mengucapkan terima kasih.',
  demikian: 'Demikian surat ini kami sampaikan untuk dapat dipergunakan sebagaimana mestinya.',
  izin: 'Atas izin dan bantuan yang diberikan, kami mengucapkan terima kasih.',
  hadir: 'Demikian undangan ini kami sampaikan. Atas kehadiran Bapak/Ibu/Saudara/i, kami mengucapkan terima kasih.',
  info: 'Demikian pemberitahuan ini kami sampaikan. Atas perhatian dan partisipasinya, kami mengucapkan terima kasih.',
  mohon: 'Demikian permohonan ini kami ajukan. Atas perkenan dan bantuan Bapak/Ibu, kami mengucapkan terima kasih.',
  maaf: 'Demikian surat ini kami sampaikan. Atas pengertian dan perhatian Bapak/Ibu, kami mengucapkan terima kasih.',
  laporan: 'Demikian laporan ini kami susun sebagai bahan pertanggungjawaban dan evaluasi kegiatan.',
};
const tt = (...k) => k.map((x) => TUTUP[x]);

const GRP = { identitas: true, penerima: true, kegiatan: true };
const SURAT = { kind: 'surat', salam: true, groups: { identitas: true, penerima: true, kegiatan: false } };

// ---------- Susunan template ----------
export const BUILTIN = [];
const add = (t) => BUILTIN.push({ builtin: true, favorite: false, kop: 'logo', signer: ['ketua', 'sekretaris'], closings: [], ...t });

// ===== A. UNDANGAN & PEMBERITAHUAN =====
add({
  id: 'undangan-resmi', nama: 'Surat Undangan Resmi', kategori: 'undangan', kata: 'undangan acara hadir resmi', ...SURAT,
  groups: { ...GRP }, defaults: { perihal: 'Undangan' },
  fields: [...kegiatanOpsi('Nama acara'), f('acara', 'Susunan acara singkat', 'textarea', { hint: 'Boleh dikosongkan.' })],
  closings: tt('hadir', 'terimaKasih'),
  body: [
    P('Dengan hormat,'),
    P('Sehubungan dengan akan dilaksanakannya {{nama_kegiatan}}, kami {{nama_organisasi}} mengundang Bapak/Ibu/Saudara/i untuk berkenan hadir pada:'),
    KV(),
    P('Mengingat pentingnya acara tersebut, kami mengharapkan kehadiran Bapak/Ibu/Saudara/i tepat pada waktunya.'),
  ],
});
add({
  id: 'undangan-rapat', nama: 'Surat Undangan Rapat', kategori: 'undangan', kata: 'rapat musyawarah pertemuan agenda', ...SURAT,
  groups: { ...GRP }, defaults: { perihal: 'Undangan Rapat' },
  fields: [...kegiatanOpsi('Nama rapat'), f('agenda', 'Agenda rapat (satu per baris)', 'textarea', { required: true, ph: 'Evaluasi kegiatan bulan lalu\nPersiapan kegiatan berikutnya' }), f('bawa', 'Hal yang perlu dibawa', 'textarea')],
  closings: tt('hadir', 'terimaKasih'),
  body: [
    P('Dengan hormat,'),
    P('Dalam rangka {{tujuan_kegiatan}}, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri {{nama_kegiatan}} yang akan dilaksanakan pada:', { optionalVars: ['tujuan_kegiatan'], alt: 'Kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri {{nama_kegiatan}} yang akan dilaksanakan pada:' }),
    KV(),
    P('Adapun agenda rapat adalah sebagai berikut:'),
    OL('{{agenda}}'),
    P('Mengingat pentingnya pembahasan dalam rapat tersebut, kami mengharapkan kehadiran Bapak/Ibu/Saudara/i tepat pada waktunya.'),
  ],
});
add({
  id: 'undangan-pengajian', nama: 'Surat Undangan Pengajian', kategori: 'undangan', kata: 'pengajian majelis taklim istighosah tahlil yasinan', ...SURAT,
  groups: { ...GRP }, defaults: { perihal: 'Undangan Pengajian' },
  fields: [...kegiatanOpsi('Nama pengajian'), f('penceramah', 'Penceramah', 'text'), f('tema', 'Tema pengajian', 'text')],
  closings: tt('hadir', 'terimaKasih'),
  body: [
    P('Dengan hormat,'),
    P('Dalam rangka mempererat ukhuwah dan meningkatkan keimanan serta ketakwaan, kami {{nama_organisasi}} mengundang Bapak/Ibu/Saudara/i untuk menghadiri {{nama_kegiatan}} yang akan dilaksanakan pada:'),
    KV(),
    P('Pengajian ini diisi oleh {{penceramah}} dengan tema "{{tema}}".', { optionalVars: ['penceramah'] }),
    P('Kami mengharapkan kehadiran Bapak/Ibu/Saudara/i tepat pada waktunya.'),
  ],
});
add({
  id: 'undangan-kegiatan', nama: 'Surat Undangan Kegiatan Organisasi', kategori: 'undangan', kata: 'kegiatan organisasi peringatan hari besar milad harlah', ...SURAT,
  groups: { ...GRP }, defaults: { perihal: 'Undangan Kegiatan' },
  fields: [...kegiatanOpsi('Nama kegiatan'), f('acara', 'Rangkaian acara (satu per baris)', 'textarea')],
  closings: tt('hadir', 'terimaKasih'),
  body: [
    P('Dengan hormat,'),
    P('Sehubungan dengan pelaksanaan kegiatan {{nama_kegiatan}} yang diselenggarakan oleh {{nama_organisasi}}, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan berpartisipasi pada:'),
    KV(),
    P('Adapun rangkaian acara sebagai berikut:', { optionalVars: ['acara'] }),
    OL('{{acara}}'),
    P('Kehadiran serta dukungan Bapak/Ibu/Saudara/i sangat kami harapkan demi kelancaran kegiatan tersebut.'),
  ],
});
add({
  id: 'pemberitahuan-kegiatan', nama: 'Surat Pemberitahuan Kegiatan', kategori: 'undangan', kata: 'pemberitahuan informasi kegiatan', ...SURAT,
  groups: { ...GRP }, defaults: { perihal: 'Pemberitahuan Kegiatan' },
  fields: [...kegiatanOpsi('Nama kegiatan'), f('catatan', 'Hal yang perlu diperhatikan (satu per baris)', 'textarea')],
  closings: tt('info', 'terimaKasih'),
  body: [
    P('Dengan hormat,'),
    P('Bersama surat ini kami {{nama_organisasi}} memberitahukan bahwa akan dilaksanakan {{nama_kegiatan}} dengan rincian sebagai berikut:'),
    KV(),
    P('Adapun hal-hal yang perlu diperhatikan:', { optionalVars: ['catatan'] }),
    OL('{{catatan}}'),
    P('Kami berharap Bapak/Ibu/Saudara/i dapat menyesuaikan waktu dan berpartisipasi dalam kegiatan tersebut.'),
  ],
});
add({
  id: 'pemberitahuan-gotong-royong', nama: 'Surat Pemberitahuan Gotong Royong', kategori: 'undangan', kata: 'gotong royong kerja bakti bersih', ...SURAT,
  groups: { ...GRP }, defaults: { perihal: 'Pemberitahuan Gotong Royong', kota_tujuan: 'di Tempat' },
  fields: [...kegiatanOpsi('Nama kegiatan gotong royong'), f('pekerjaan', 'Daftar pekerjaan (satu per baris)', 'textarea', { required: true, ph: 'Membersihkan halaman\nMenata tempat duduk' }), f('dibawa', 'Perlengkapan yang dibawa warga (satu per baris)', 'textarea')],
  closings: tt('info', 'terimaKasih'),
  body: [
    P('Dengan hormat,'),
    P('Dalam rangka persiapan {{nama_kegiatan}}, kami {{nama_organisasi}} mengajak Bapak/Ibu/Saudara/i untuk bergotong royong pada:'),
    KV(),
    P('Adapun pekerjaan yang akan dilakukan adalah:'),
    OL('{{pekerjaan}}'),
    P('Bagi yang berkenan, mohon membawa perlengkapan berikut:', { optionalVars: ['dibawa'] }),
    UL('{{dibawa}}'),
    P('Kami mengajak seluruh warga untuk berpartisipasi demi kelancaran kegiatan ini.'),
  ],
});
add({
  id: 'pemberitahuan-persiapan', nama: 'Surat Pemberitahuan Persiapan Acara', kategori: 'undangan', kata: 'persiapan panitia acara koordinasi', ...SURAT,
  groups: { ...GRP }, defaults: { perihal: 'Pemberitahuan Persiapan Acara' },
  fields: [...kegiatanOpsi('Nama acara yang disiapkan'), f('tugas', 'Hal yang perlu dipersiapkan (satu per baris)', 'textarea', { required: true })],
  closings: tt('info', 'terimaKasih'),
  body: [
    P('Dengan hormat,'),
    P('Sehubungan dengan akan dilaksanakannya {{nama_kegiatan}}, kami memberitahukan bahwa akan diadakan pertemuan persiapan pada:'),
    KV(),
    P('Adapun hal-hal yang perlu dipersiapkan adalah:'),
    OL('{{tugas}}'),
    P('Mohon Bapak/Ibu/Saudara/i dapat hadir dan membantu kelancaran persiapan acara tersebut.'),
  ],
});
add({
  id: 'undangan-tokoh', nama: 'Surat Undangan kepada Tokoh Masyarakat', kategori: 'undangan', kata: 'tokoh masyarakat kyai ustadz sesepuh undangan', ...SURAT,
  groups: { ...GRP }, defaults: { perihal: 'Undangan', jabatan_penerima: 'Tokoh Masyarakat' },
  fields: [...kegiatanOpsi('Nama kegiatan'), f('peran', 'Mohon kehadiran sebagai (opsional)', 'text', { ph: 'mis. pemberi nasihat / tamu kehormatan' })],
  closings: tt('hadir', 'terimaKasih'),
  body: [
    P('Dengan hormat,'),
    P('Dengan memohon rahmat dan ridha Allah SWT, kami {{nama_organisasi}} bermaksud menyelenggarakan {{nama_kegiatan}}. Untuk itu, kami mengundang Bapak/Ibu untuk berkenan hadir{{peran}} pada:', { fmt: { peran: ' sebagai {v}' } }),
    KV(),
    P('Kehadiran dan doa restu Bapak/Ibu merupakan kehormatan bagi kami serta sangat berarti bagi kelancaran acara tersebut.'),
  ],
});
add({
  id: 'undangan-pemdes', nama: 'Surat Undangan kepada Pemerintah Desa', kategori: 'undangan', kata: 'pemerintah desa kepala desa perangkat desa undangan', ...SURAT,
  groups: { ...GRP }, defaults: { perihal: 'Undangan', jabatan_penerima: 'Kepala Desa Gunungjaya', kota_tujuan: 'di Tempat' },
  fields: [...kegiatanOpsi('Nama kegiatan')],
  closings: tt('hadir', 'terimaKasih'),
  body: [
    P('Dengan hormat,'),
    P('Sehubungan dengan akan dilaksanakannya {{nama_kegiatan}} oleh {{nama_organisasi}}, kami mengundang Bapak/Ibu beserta jajaran Pemerintah Desa untuk berkenan hadir pada:'),
    KV(),
    P('Kehadiran Bapak/Ibu merupakan bentuk dukungan yang sangat berarti bagi kelancaran kegiatan kami.'),
  ],
});
add({
  id: 'pemberitahuan-pemuda-warga', nama: 'Surat Pemberitahuan kepada Pemuda dan Warga', kategori: 'undangan', kata: 'pemuda warga karang taruna pemberitahuan', ...SURAT,
  groups: { ...GRP }, defaults: { perihal: 'Pemberitahuan', jabatan_penerima: 'Seluruh Pemuda dan Warga', kota_tujuan: 'di Tempat' },
  fields: [...kegiatanOpsi('Nama kegiatan'), f('permohonan', 'Harapan/permohonan kepada warga', 'textarea')],
  closings: tt('info', 'terimaKasih'),
  body: [
    P('Dengan hormat,'),
    P('Bersama ini kami {{nama_organisasi}} memberitahukan kepada seluruh pemuda dan warga bahwa akan dilaksanakan {{nama_kegiatan}} pada:'),
    KV(),
    P('{{permohonan}}', { optionalVars: ['permohonan'] }),
  ],
});

// ===== B. PERMOHONAN =====
const mohon = { ...SURAT, groups: { ...GRP }, closings: tt('mohon', 'izin', 'terimaKasih') };
add({
  id: 'mohon-tempat', nama: 'Surat Permohonan Izin Penggunaan Tempat', kategori: 'permohonan', kata: 'izin tempat gedung balai musala masjid lapangan pinjam tempat', ...mohon,
  defaults: { perihal: 'Permohonan Izin Penggunaan Tempat' },
  fields: [...kegiatanOpsi('Nama kegiatan'), f('jumlah_peserta', 'Perkiraan jumlah peserta', 'text')],
  body: [
    P('Dengan hormat,'),
    P('Sehubungan dengan akan dilaksanakannya {{nama_kegiatan}} oleh {{nama_organisasi}}, dengan ini kami memohon izin untuk menggunakan {{tempat_kegiatan}} pada:'),
    KV(),
    P('Kegiatan tersebut diperkirakan diikuti oleh {{jumlah_peserta}} peserta.', { optionalVars: ['jumlah_peserta'] }),
    P('Kami berkomitmen menjaga kebersihan, ketertiban, dan keutuhan tempat selama kegiatan berlangsung.'),
  ],
});
add({
  id: 'mohon-pinjam', nama: 'Surat Permohonan Peminjaman Perlengkapan', kategori: 'permohonan', kata: 'pinjam peminjaman perlengkapan tenda kursi sound system alat', ...mohon,
  defaults: { perihal: 'Permohonan Peminjaman Perlengkapan' },
  fields: [...kegiatanOpsi('Nama kegiatan'), f('tanggal_kembali', 'Tanggal pengembalian', 'date'), f('barang', 'Daftar barang yang dipinjam', 'table', { required: true, numbered: true, minRows: 3, columns: [{ key: 'nama', label: 'Nama Barang', w: 4 }, { key: 'jumlah', label: 'Jumlah', w: 1.2, align: 'center' }, { key: 'satuan', label: 'Satuan', w: 1.2, align: 'center' }, { key: 'ket', label: 'Keterangan', w: 2.4 }] })],
  body: [
    P('Dengan hormat,'),
    P('Sehubungan dengan akan dilaksanakannya {{nama_kegiatan}} oleh {{nama_organisasi}}, dengan ini kami memohon untuk dapat meminjam perlengkapan yang diperlukan pada:'),
    KV(),
    P('Adapun daftar perlengkapan yang kami butuhkan adalah sebagai berikut:'),
    TBL('barang'),
    P('Kami menyatakan bersedia menjaga perlengkapan tersebut dengan baik dan mengembalikannya dalam keadaan utuh{{tanggal_kembali}}.', { fmt: { tanggal_kembali: ' paling lambat pada tanggal {v}' } }),
  ],
});
add({
  id: 'mohon-dana', nama: 'Surat Permohonan Bantuan Dana', kategori: 'permohonan', kata: 'bantuan dana donasi proposal sumbangan infak', ...mohon,
  defaults: { perihal: 'Permohonan Bantuan Dana' },
  fields: [...kegiatanOpsi('Nama kegiatan'), f('total_dana', 'Dana yang dimohonkan (Rp)', 'money', { required: true }), f('rincian', 'Rincian kebutuhan dana', 'table', { numbered: true, minRows: 3, sum: 'nominal', columns: [{ key: 'uraian', label: 'Uraian', w: 5 }, { key: 'nominal', label: 'Jumlah (Rp)', w: 2, align: 'right', money: true }] }), f('penyaluran', 'Keterangan penyaluran bantuan (opsional)', 'textarea', { hint: 'Tulis sendiri bila perlu; aplikasi tidak menyimpan nomor rekening secara khusus.' })],
  body: [
    P('Dengan hormat,'),
    P('Dalam rangka pelaksanaan {{nama_kegiatan}} oleh {{nama_organisasi}} yang akan dilaksanakan pada hari {{hari_kegiatan}}, tanggal {{tanggal_kegiatan}}, bertempat di {{tempat_kegiatan}}, kami memerlukan dukungan dana.'),
    P('Sehubungan dengan hal tersebut, kami memohon bantuan dana sebesar {{total_dana}} ({{terbilang_total_dana}}) dengan rincian kebutuhan sebagai berikut:'),
    TBL('rincian'),
    P('{{penyaluran}}', { optionalVars: ['penyaluran'] }),
    P('Kami berjanji akan menggunakan bantuan tersebut sesuai peruntukannya dan mempertanggungjawabkannya secara transparan.'),
  ],
});
add({
  id: 'mohon-barang', nama: 'Surat Permohonan Bantuan Barang', kategori: 'permohonan', kata: 'bantuan barang sumbangan perlengkapan hibah', ...mohon,
  defaults: { perihal: 'Permohonan Bantuan Barang' },
  fields: [...kegiatanOpsi('Nama kegiatan'), f('barang', 'Daftar barang yang dimohon', 'table', { required: true, numbered: true, minRows: 3, columns: [{ key: 'nama', label: 'Nama Barang', w: 4 }, { key: 'jumlah', label: 'Jumlah', w: 1.2, align: 'center' }, { key: 'satuan', label: 'Satuan', w: 1.2, align: 'center' }, { key: 'ket', label: 'Keterangan', w: 2.4 }] })],
  body: [
    P('Dengan hormat,'),
    P('Sehubungan dengan akan dilaksanakannya {{nama_kegiatan}} oleh {{nama_organisasi}} pada hari {{hari_kegiatan}}, tanggal {{tanggal_kegiatan}}, bertempat di {{tempat_kegiatan}}, kami memohon bantuan barang sebagai berikut:'),
    TBL('barang'),
    P('Bantuan tersebut akan kami gunakan sebaik-baiknya untuk menunjang kelancaran kegiatan.'),
  ],
});
add({
  id: 'mohon-kerjasama', nama: 'Surat Permohonan Kerja Sama', kategori: 'permohonan', kata: 'kerja sama kemitraan kolaborasi', ...mohon,
  defaults: { perihal: 'Permohonan Kerja Sama' },
  fields: [f('bentuk', 'Bentuk kerja sama yang diajukan', 'textarea', { required: true, group: 'khusus' }), f('manfaat', 'Manfaat/tujuan kerja sama', 'textarea', { group: 'khusus' }), f('rencana', 'Rencana tindak lanjut (opsional)', 'textarea', { group: 'khusus' })],
  body: [
    P('Dengan hormat,'),
    P('{{nama_organisasi}} merupakan organisasi yang bergerak dalam bidang kemasyarakatan dan keagamaan di {{alamat_organisasi}}.'),
    P('Sehubungan dengan hal tersebut, kami bermaksud mengajukan kerja sama dengan {{instansi_penerima}} dalam bentuk sebagai berikut:', { optionalVars: ['instansi_penerima'], alt: 'Sehubungan dengan hal tersebut, kami bermaksud mengajukan kerja sama dalam bentuk sebagai berikut:' }),
    P('{{bentuk}}'),
    P('Adapun manfaat yang kami harapkan dari kerja sama ini adalah {{manfaat}}', { optionalVars: ['manfaat'] }),
    P('{{rencana}}', { optionalVars: ['rencana'] }),
  ],
});
add({
  id: 'mohon-narasumber', nama: 'Surat Permohonan Narasumber atau Penceramah', kategori: 'permohonan', kata: 'narasumber penceramah ustadz kyai pemateri', ...mohon,
  defaults: { perihal: 'Permohonan Narasumber' },
  fields: [...kegiatanOpsi('Nama kegiatan'), f('tema', 'Tema/materi', 'text', { required: true }), f('durasi', 'Durasi materi (opsional)', 'text', { ph: 'mis. 45 menit' }), f('peserta', 'Peserta kegiatan', 'text', { ph: 'mis. jamaah Muslimat dan Fatayat' })],
  body: [
    P('Dengan hormat,'),
    P('Sehubungan dengan akan dilaksanakannya {{nama_kegiatan}} oleh {{nama_organisasi}}, kami memohon kesediaan Bapak/Ibu untuk menjadi narasumber/penceramah pada:'),
    KV(),
    P('Adapun tema yang kami harapkan adalah "{{tema}}"{{durasi}}.', { fmt: { durasi: ' dengan durasi {v}' } }),
    P('Peserta kegiatan terdiri atas {{peserta}}.', { optionalVars: ['peserta'] }),
    P('Besar harapan kami agar Bapak/Ibu berkenan memenuhi permohonan ini.'),
  ],
});
add({
  id: 'mohon-izin-kegiatan', nama: 'Surat Permohonan Izin Kegiatan', kategori: 'permohonan', kata: 'izin kegiatan perizinan keramaian', ...mohon,
  defaults: { perihal: 'Permohonan Izin Kegiatan' },
  fields: [...kegiatanOpsi('Nama kegiatan'), f('jumlah_peserta', 'Perkiraan jumlah peserta', 'text'), f('rangkaian', 'Rangkaian kegiatan (satu per baris)', 'textarea')],
  body: [
    P('Dengan hormat,'),
    P('Sehubungan dengan rencana pelaksanaan {{nama_kegiatan}} oleh {{nama_organisasi}}, dengan ini kami memohon izin untuk menyelenggarakan kegiatan tersebut pada:'),
    KV(),
    P('Kegiatan ini diperkirakan diikuti oleh {{jumlah_peserta}} peserta dengan rangkaian acara sebagai berikut:', { optionalVars: ['jumlah_peserta'], alt: 'Adapun rangkaian acara sebagai berikut:' }),
    OL('{{rangkaian}}'),
    P('Kami berkomitmen menjaga ketertiban, keamanan, dan kebersihan selama kegiatan berlangsung.'),
  ],
});
add({
  id: 'mohon-dukungan', nama: 'Surat Permohonan Dukungan Kegiatan', kategori: 'permohonan', kata: 'dukungan kegiatan partisipasi sponsor', ...mohon,
  defaults: { perihal: 'Permohonan Dukungan Kegiatan' },
  fields: [...kegiatanOpsi('Nama kegiatan'), f('bentuk_dukungan', 'Bentuk dukungan yang diharapkan', 'textarea', { required: true })],
  body: [
    P('Dengan hormat,'),
    P('Kami {{nama_organisasi}} akan menyelenggarakan {{nama_kegiatan}} dengan tujuan {{tujuan_kegiatan}}. Kegiatan tersebut direncanakan pada:', { optionalVars: ['tujuan_kegiatan'], alt: 'Kami {{nama_organisasi}} akan menyelenggarakan {{nama_kegiatan}}. Kegiatan tersebut direncanakan pada:' }),
    KV(),
    P('Untuk menunjang kelancaran kegiatan tersebut, kami mengharapkan dukungan Bapak/Ibu berupa:'),
    P('{{bentuk_dukungan}}'),
  ],
});

// ===== C. TUGAS & KEPUTUSAN =====
const susunan = [{ key: 'jabatan', label: 'Jabatan dalam Panitia', w: 3 }, { key: 'nama', label: 'Nama', w: 4 }];
add({
  id: 'surat-tugas-panitia', nama: 'Surat Tugas Panitia', kategori: 'tugas', kata: 'surat tugas panitia penugasan', ...SURAT,
  groups: { identitas: true, penerima: false, kegiatan: true }, defaults: { perihal: 'Surat Tugas' }, judul: 'SURAT TUGAS',
  fields: [...kegiatanOpsi('Nama kegiatan'), f('petugas', 'Daftar yang ditugaskan', 'table', { required: true, numbered: true, minRows: 3, columns: [{ key: 'nama', label: 'Nama', w: 3.5 }, { key: 'jabatan', label: 'Jabatan dalam Panitia', w: 3 }, { key: 'tugas', label: 'Tugas', w: 3 }] }), f('dasar', 'Dasar penugasan (opsional)', 'textarea', { hint: 'Isi hanya bila ada dasar resmi. Jangan diisi dengan nomor yang tidak ada.' })],
  closings: tt('demikian'),
  body: [
    P('Yang bertanda tangan di bawah ini, pengurus {{nama_organisasi}}, dengan ini memberikan tugas kepada:'),
    TBL('petugas'),
    P('Untuk melaksanakan tugas dalam kegiatan {{nama_kegiatan}} yang dilaksanakan pada:'),
    KV(),
    P('{{dasar}}', { optionalVars: ['dasar'] }),
    P('Yang bersangkutan agar melaksanakan tugas dengan penuh tanggung jawab dan melaporkan hasilnya kepada pimpinan.'),
  ],
});
add({
  id: 'surat-tugas-perwakilan', nama: 'Surat Tugas Perwakilan Organisasi', kategori: 'tugas', kata: 'perwakilan delegasi utusan surat tugas', ...SURAT,
  groups: { identitas: true, penerima: false, kegiatan: true }, defaults: { perihal: 'Surat Tugas' }, judul: 'SURAT TUGAS',
  fields: [...kegiatanOpsi('Nama kegiatan yang dihadiri'), f('nama_wakil', 'Nama yang ditugaskan', 'text', { required: true, group: 'khusus' }), f('jabatan_wakil', 'Jabatan', 'text', { group: 'khusus' }), f('alamat_wakil', 'Alamat (opsional)', 'text', { group: 'khusus' }), f('penyelenggara', 'Penyelenggara kegiatan', 'text', { group: 'khusus' })],
  closings: tt('demikian'),
  body: [
    P('Yang bertanda tangan di bawah ini, pengurus {{nama_organisasi}}, dengan ini menugaskan:'),
    { type: 'kv', ref: 'wakil' },
    P('Untuk mewakili {{nama_organisasi}} dalam kegiatan {{nama_kegiatan}} yang diselenggarakan oleh {{penyelenggara}} pada:', { alt: 'Untuk mewakili {{nama_organisasi}} dalam kegiatan {{nama_kegiatan}} pada:' }),
    KV(),
    P('Yang bersangkutan agar melaksanakan tugas dengan penuh tanggung jawab dan melaporkan hasilnya kepada pimpinan organisasi.'),
  ],
});
add({
  id: 'sk-panitia', nama: 'Surat Keputusan Pembentukan Panitia', kategori: 'tugas', kata: 'sk keputusan pembentukan panitia', ...SURAT,
  groups: { identitas: true, penerima: false, kegiatan: true }, defaults: { perihal: 'Pembentukan Panitia' }, header: 'none',
  fields: [...kegiatanOpsi('Nama kegiatan'), f('menimbang', 'Menimbang (satu per baris)', 'textarea', { required: true, group: 'khusus', ph: 'bahwa untuk kelancaran kegiatan perlu dibentuk panitia pelaksana' }), f('mengingat', 'Mengingat (satu per baris, opsional)', 'textarea', { group: 'khusus', hint: 'Isi dasar aturan hanya yang benar-benar ada. Kosongkan bila tidak ada.' }), f('panitia', 'Susunan panitia', 'table', { required: true, numbered: true, minRows: 4, columns: susunan }), f('tugas_panitia', 'Tugas panitia (satu per baris)', 'textarea', { group: 'khusus' }), f('biaya', 'Ketentuan pembiayaan', 'textarea', { group: 'khusus', default: 'Segala biaya yang timbul akibat keputusan ini dibebankan pada dana kegiatan yang sah.' })],
  closings: [],
  body: [
    H('KEPUTUSAN {{nama_organisasi_upper}}', { align: 'center', bold: true }),
    H('NOMOR: {{nomor_surat}}', { align: 'center', bold: true }),
    H('TENTANG', { align: 'center', bold: true }),
    H('PEMBENTUKAN PANITIA {{nama_kegiatan_upper}}', { align: 'center', bold: true }),
    P('Menimbang:', { bold: true, align: 'left' }),
    OL('{{menimbang}}'),
    P('Mengingat:', { bold: true, align: 'left', optionalVars: ['mengingat'] }),
    OL('{{mengingat}}'),
    P('MEMUTUSKAN', { bold: true, align: 'center' }),
    P('Menetapkan:', { bold: true, align: 'left' }),
    P('KESATU : Membentuk panitia {{nama_kegiatan}} yang akan dilaksanakan pada hari {{hari_kegiatan}}, tanggal {{tanggal_kegiatan}}, bertempat di {{tempat_kegiatan}}, dengan susunan sebagaimana tercantum di bawah ini:'),
    TBL('panitia'),
    P('KEDUA : Panitia bertugas:', { optionalVars: ['tugas_panitia'] }),
    OL('{{tugas_panitia}}'),
    P('KETIGA : {{biaya}}', { optionalVars: ['biaya'] }),
    P('KEEMPAT : Keputusan ini mulai berlaku pada tanggal ditetapkan, dengan ketentuan apabila di kemudian hari terdapat kekeliruan dalam keputusan ini, akan diadakan perbaikan sebagaimana mestinya.'),
  ],
  penetapan: true,
});
add({
  id: 'penetapan-kepanitiaan', nama: 'Surat Penetapan Susunan Kepanitiaan', kategori: 'tugas', kata: 'susunan kepanitiaan struktur panitia penetapan', ...SURAT,
  groups: { identitas: true, penerima: false, kegiatan: true }, defaults: { perihal: 'Penetapan Susunan Kepanitiaan' }, header: 'none',
  fields: [...kegiatanOpsi('Nama kegiatan'), f('panitia', 'Susunan panitia', 'table', { required: true, numbered: true, minRows: 6, columns: susunan })],
  closings: tt('demikian'),
  body: [
    H('SUSUNAN KEPANITIAAN', { align: 'center', bold: true }),
    H('{{nama_kegiatan_upper}}', { align: 'center', bold: true }),
    H('NOMOR: {{nomor_surat}}', { align: 'center' }),
    P('Berdasarkan hasil musyawarah {{nama_organisasi}}, ditetapkan susunan kepanitiaan {{nama_kegiatan}} yang akan dilaksanakan pada hari {{hari_kegiatan}}, tanggal {{tanggal_kegiatan}}, bertempat di {{tempat_kegiatan}}, sebagai berikut:'),
    TBL('panitia'),
    P('Seluruh panitia diharapkan melaksanakan tugas dengan penuh tanggung jawab dan koordinasi yang baik.'),
  ],
});

// ===== D. ADMINISTRASI =====
add({
  id: 'surat-keterangan', nama: 'Surat Keterangan', kategori: 'administrasi', kata: 'keterangan menerangkan anggota', ...SURAT, salam: false,
  groups: { identitas: true, penerima: false, kegiatan: false }, defaults: { perihal: 'Surat Keterangan' }, judul: 'SURAT KETERANGAN',
  fields: [f('nama_ket', 'Nama', 'text', { required: true, group: 'khusus' }), f('ttl', 'Tempat, tanggal lahir', 'text', { group: 'khusus' }), f('alamat_ket', 'Alamat', 'text', { group: 'khusus' }), f('jabatan_ket', 'Jabatan/status dalam organisasi', 'text', { group: 'khusus' }), f('isi_ket', 'Isi keterangan', 'textarea', { required: true, group: 'khusus', ph: 'mis. benar-benar tercatat sebagai anggota aktif organisasi kami.' }), f('keperluan', 'Keperluan', 'text', { group: 'khusus' })],
  closings: tt('demikian'),
  body: [
    P('Yang bertanda tangan di bawah ini, pengurus {{nama_organisasi}}, menerangkan bahwa:'),
    { type: 'kv', ref: 'ket' },
    P('Yang bersangkutan {{isi_ket}}'),
    P('Surat keterangan ini dibuat untuk keperluan {{keperluan}}.', { optionalVars: ['keperluan'] }),
  ],
});
add({
  id: 'surat-pengantar', nama: 'Surat Pengantar', kategori: 'administrasi', kata: 'pengantar menyampaikan dokumen berkas', ...SURAT, groups: { identitas: true, penerima: true, kegiatan: false }, defaults: { perihal: 'Pengantar' },
  fields: [f('keterangan_dok', 'Keperluan pengiriman', 'text', { group: 'khusus', ph: 'mis. proses pengajuan kegiatan' }), f('dokumen', 'Dokumen yang dikirim', 'table', { required: true, numbered: true, minRows: 3, columns: [{ key: 'nama', label: 'Nama Dokumen', w: 5 }, { key: 'jumlah', label: 'Jumlah', w: 1.5, align: 'center' }, { key: 'ket', label: 'Keterangan', w: 2.5 }] })],
  closings: ['Demikian surat pengantar ini kami sampaikan. Atas perhatian dan kerja samanya, kami mengucapkan terima kasih.', TUTUP.demikian],
  body: [
    P('Dengan hormat,'),
    P('Bersama surat ini kami {{nama_organisasi}} menyampaikan dokumen {{keterangan_dok}} dengan rincian sebagai berikut:', { alt: 'Bersama surat ini kami {{nama_organisasi}} menyampaikan dokumen dengan rincian sebagai berikut:' }),
    TBL('dokumen'),
    P('Mohon dokumen tersebut dapat diterima dan diproses sebagaimana mestinya.'),
  ],
});
add({
  id: 'surat-rekomendasi', nama: 'Surat Rekomendasi', kategori: 'administrasi', kata: 'rekomendasi referensi dukungan', ...SURAT, salam: false,
  groups: { identitas: true, penerima: true, kegiatan: false }, defaults: { perihal: 'Rekomendasi' }, judul: 'SURAT REKOMENDASI',
  fields: [f('nama_rek', 'Nama yang direkomendasikan', 'text', { required: true, group: 'khusus' }), f('alamat_rek', 'Alamat', 'text', { group: 'khusus' }), f('status_rek', 'Status dalam organisasi', 'text', { group: 'khusus', ph: 'mis. anggota / pengurus' }), f('isi_rek', 'Isi rekomendasi', 'textarea', { required: true, group: 'khusus', ph: 'Tulis alasan/keterangan rekomendasi sesuai kenyataan.' }), f('tujuan_rek', 'Tujuan rekomendasi', 'text', { group: 'khusus' })],
  closings: tt('demikian'),
  body: [
    P('Yang bertanda tangan di bawah ini, pengurus {{nama_organisasi}}, dengan ini memberikan rekomendasi kepada:'),
    { type: 'kv', ref: 'rek' },
    P('{{isi_rek}}'),
    P('Rekomendasi ini diberikan untuk keperluan {{tujuan_rek}}.', { optionalVars: ['tujuan_rek'] }),
  ],
});
add({
  id: 'surat-pernyataan', nama: 'Surat Pernyataan', kategori: 'administrasi', kata: 'pernyataan kesanggupan bermaterai', ...SURAT, salam: false,
  groups: { identitas: true, penerima: false, kegiatan: false }, defaults: { perihal: 'Surat Pernyataan' }, judul: 'SURAT PERNYATAAN', signer: ['pembuat'],
  fields: [f('nama_pembuat', 'Nama yang menyatakan', 'text', { required: true, group: 'khusus' }), f('ttl_pembuat', 'Tempat, tanggal lahir', 'text', { group: 'khusus' }), f('alamat_pembuat', 'Alamat', 'text', { group: 'khusus' }), f('jabatan_pembuat', 'Jabatan/status', 'text', { group: 'khusus' }), f('isi_pernyataan', 'Isi pernyataan (satu poin per baris)', 'textarea', { required: true, group: 'khusus' })],
  closings: ['Demikian surat pernyataan ini dibuat dengan sebenarnya, tanpa paksaan dari pihak mana pun, untuk dipergunakan sebagaimana mestinya.'],
  body: [
    P('Yang bertanda tangan di bawah ini:'),
    { type: 'kv', ref: 'pembuat' },
    P('Dengan ini menyatakan dengan sebenar-benarnya bahwa:'),
    OL('{{isi_pernyataan}}'),
  ],
});
add({
  id: 'surat-berita-acara', nama: 'Surat Berita Acara', kategori: 'administrasi', kata: 'berita acara serah terima kejadian', ...SURAT, salam: false,
  groups: { identitas: true, penerima: false, kegiatan: true }, defaults: { perihal: 'Berita Acara' }, judul: 'BERITA ACARA',
  fields: [...kegiatanOpsi('Pokok peristiwa/kegiatan'), f('uraian', 'Uraian peristiwa (satu poin per baris)', 'textarea', { required: true, group: 'khusus' }), f('yang_hadir', 'Pihak yang hadir (satu per baris)', 'textarea', { group: 'khusus' })],
  closings: ['Demikian berita acara ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.'],
  body: [
    P('Pada hari ini {{hari_kegiatan}}, tanggal {{tanggal_kegiatan}}, bertempat di {{tempat_kegiatan}}, telah dilaksanakan {{nama_kegiatan}} dengan uraian sebagai berikut:'),
    OL('{{uraian}}'),
    P('Pihak yang hadir:', { optionalVars: ['yang_hadir'], align: 'left' }),
    OL('{{yang_hadir}}'),
  ],
});
add({
  id: 'perubahan-jadwal', nama: 'Surat Pemberitahuan Perubahan Jadwal', kategori: 'administrasi', kata: 'perubahan jadwal pengunduran reschedule', ...SURAT,
  groups: { ...GRP, kegiatan: false }, defaults: { perihal: 'Pemberitahuan Perubahan Jadwal' },
  fields: [f('nama_kegiatan', 'Nama kegiatan', 'text', { required: true, group: 'khusus' }), f('tgl_lama', 'Tanggal semula', 'date', { group: 'khusus', required: true }), f('jam_lama', 'Waktu semula', 'time', { group: 'khusus' }), f('tempat_lama', 'Tempat semula', 'text', { group: 'khusus' }), f('tgl_baru', 'Tanggal baru', 'date', { group: 'khusus', required: true }), f('jam_baru', 'Waktu baru', 'time', { group: 'khusus' }), f('tempat_baru', 'Tempat baru', 'text', { group: 'khusus' }), f('alasan', 'Alasan perubahan', 'textarea', { group: 'khusus' })],
  closings: tt('maaf', 'terimaKasih'),
  body: [
    P('Dengan hormat,'),
    P('Sehubungan dengan rencana pelaksanaan {{nama_kegiatan}}, bersama ini kami memberitahukan adanya perubahan jadwal pelaksanaan kegiatan tersebut{{alasan}}.', { fmt: { alasan: ' karena {v}' } }),
    P('Adapun perubahan yang dimaksud adalah sebagai berikut:'),
    { type: 'jadwal' },
    P('Hal-hal lain yang telah disampaikan sebelumnya tidak mengalami perubahan.'),
  ],
});
add({
  id: 'ucapan-terima-kasih', nama: 'Surat Ucapan Terima Kasih Resmi', kategori: 'administrasi', kata: 'terima kasih apresiasi penghargaan', ...SURAT, groups: { ...GRP, kegiatan: false }, defaults: { perihal: 'Ucapan Terima Kasih' },
  fields: [f('nama_kegiatan', 'Kegiatan yang dibantu', 'text', { required: true, group: 'khusus' }), f('bentuk_bantuan', 'Bantuan/dukungan yang diterima', 'textarea', { required: true, group: 'khusus' }), f('hasil', 'Hasil/dampak kegiatan (opsional)', 'textarea', { group: 'khusus' })],
  closings: ['Semoga segala kebaikan Bapak/Ibu mendapat balasan yang berlipat dari Allah SWT. Atas perhatian dan dukungannya, kami mengucapkan terima kasih.', ...tt('terimaKasih')],
  body: [
    P('Dengan hormat,'),
    P('Atas nama {{nama_organisasi}}, kami mengucapkan terima kasih yang sebesar-besarnya atas dukungan Bapak/Ibu dalam pelaksanaan {{nama_kegiatan}}, berupa:'),
    P('{{bentuk_bantuan}}'),
    P('{{hasil}}', { optionalVars: ['hasil'] }),
  ],
});
add({
  id: 'permohonan-maaf', nama: 'Surat Permohonan Maaf Resmi', kategori: 'administrasi', kata: 'maaf permohonan maaf ketidakhadiran kekeliruan', ...SURAT, groups: { ...GRP, kegiatan: false }, defaults: { perihal: 'Permohonan Maaf' },
  fields: [f('hal_maaf', 'Hal yang dimintakan maaf', 'textarea', { required: true, group: 'khusus' }), f('penjelasan', 'Penjelasan singkat (opsional)', 'textarea', { group: 'khusus' }), f('tindak_lanjut', 'Langkah perbaikan (opsional)', 'textarea', { group: 'khusus' })],
  closings: tt('maaf', 'terimaKasih'),
  body: [
    P('Dengan hormat,'),
    P('Bersama surat ini, kami {{nama_organisasi}} menyampaikan permohonan maaf atas:'),
    P('{{hal_maaf}}'),
    P('{{penjelasan}}', { optionalVars: ['penjelasan'] }),
    P('{{tindak_lanjut}}', { optionalVars: ['tindak_lanjut'] }),
    P('Kami berharap Bapak/Ibu berkenan memaafkan dan memaklumi hal tersebut.'),
  ],
});

// ===== E. DOKUMEN KEGIATAN =====
const DOC = { kind: 'dokumen', salam: false, kop: 'none', signer: ['sekretaris'], groups: { identitas: false, penerima: false, kegiatan: true } };
const kegIdentitas = (opsi = {}) => [
  f('nama_kegiatan', 'Nama kegiatan', 'text', { required: true, group: 'kegiatan' }),
  f('tanggal_kegiatan', 'Tanggal', 'date', { required: true, group: 'kegiatan' }),
  f('waktu_mulai', 'Waktu mulai', 'time', { group: 'kegiatan' }),
  f('waktu_selesai', 'Waktu selesai', 'time', { group: 'kegiatan' }),
  f('tempat_kegiatan', 'Tempat', 'text', { required: !opsi.optTempat, group: 'kegiatan' }),
];
const kolHadir = [{ key: 'nama', label: 'Nama', w: 4 }, { key: 'jabatan', label: 'Jabatan / Alamat', w: 3 }, { key: 'ttd', label: 'Tanda Tangan', w: 2.5, ttd: true }];
add({
  id: 'daftar-hadir-peserta', nama: 'Daftar Hadir Peserta', kategori: 'kegiatan', kata: 'daftar hadir absensi peserta presensi', ...DOC, judul: 'DAFTAR HADIR PESERTA', defaults: { jumlah_baris: '25' }, signer: [],
  fields: [...kegIdentitas(), f('jumlah_baris', 'Jumlah baris tabel', 'number', { group: 'khusus' }), f('peserta', 'Nama peserta (boleh dikosongkan agar diisi tangan)', 'table', { numbered: true, minRows: 0, fillFrom: 'jumlah_baris', columns: kolHadir })],
  body: [H('{{judul}}', { align: 'center', bold: true }), KV(), SP(), TBL('peserta')],
});
add({
  id: 'daftar-hadir-tamu', nama: 'Daftar Hadir Tamu Undangan', kategori: 'kegiatan', kata: 'daftar hadir tamu undangan', ...DOC, judul: 'DAFTAR HADIR TAMU UNDANGAN', defaults: { jumlah_baris: '20' }, signer: [],
  fields: [...kegIdentitas(), f('jumlah_baris', 'Jumlah baris tabel', 'number', { group: 'khusus' }), f('peserta', 'Nama tamu (boleh dikosongkan)', 'table', { numbered: true, minRows: 0, fillFrom: 'jumlah_baris', columns: [{ key: 'nama', label: 'Nama', w: 3.2 }, { key: 'instansi', label: 'Jabatan / Instansi', w: 3 }, { key: 'ttd', label: 'Tanda Tangan', w: 2.4, ttd: true }] })],
  body: [H('{{judul}}', { align: 'center', bold: true }), KV(), SP(), TBL('peserta')],
});
add({
  id: 'susunan-acara', nama: 'Susunan Acara', kategori: 'kegiatan', kata: 'susunan acara rundown agenda jadwal', ...DOC, judul: 'SUSUNAN ACARA', signer: ['sekretaris'],
  fields: [...kegIdentitas(), f('acara', 'Rangkaian acara', 'table', { required: true, numbered: true, minRows: 6, columns: [{ key: 'waktu', label: 'Waktu', w: 2 }, { key: 'acara', label: 'Acara', w: 4.5 }, { key: 'petugas', label: 'Petugas', w: 2.5 }] })],
  body: [H('{{judul}}', { align: 'center', bold: true }), H('{{nama_kegiatan_upper}}', { align: 'center', bold: true }), KV(), SP(), TBL('acara')],
});
add({
  id: 'daftar-kebutuhan', nama: 'Daftar Kebutuhan Perlengkapan', kategori: 'kegiatan', kata: 'kebutuhan perlengkapan logistik barang', ...DOC, judul: 'DAFTAR KEBUTUHAN PERLENGKAPAN', signer: ['sekretaris'],
  fields: [...kegIdentitas({ optTempat: true }), f('barang', 'Daftar kebutuhan', 'table', { required: true, numbered: true, minRows: 8, columns: [{ key: 'nama', label: 'Nama Perlengkapan', w: 3.4 }, { key: 'jumlah', label: 'Jumlah', w: 1.2, align: 'center' }, { key: 'satuan', label: 'Satuan', w: 1.2, align: 'center' }, { key: 'pj', label: 'Penanggung Jawab', w: 2.2 }, { key: 'ket', label: 'Keterangan', w: 2 }] })],
  body: [H('{{judul}}', { align: 'center', bold: true }), H('{{nama_kegiatan_upper}}', { align: 'center', bold: true }), KV(), SP(), TBL('barang')],
});
add({
  id: 'notulen-rapat', nama: 'Notulen Rapat', kategori: 'kegiatan', kata: 'notulen risalah rapat catatan rapat', ...DOC, judul: 'NOTULEN RAPAT', signer: ['ketua', 'sekretaris'],
  fields: [...kegIdentitas(), f('pimpinan_rapat', 'Pemimpin rapat', 'text', { group: 'khusus' }), f('notulis', 'Notulis', 'text', { group: 'khusus' }), f('jumlah_hadir', 'Jumlah peserta hadir', 'text', { group: 'khusus' }), f('agenda', 'Agenda (satu per baris)', 'textarea', { required: true, group: 'khusus' }), f('pembahasan', 'Pokok pembahasan (satu per baris)', 'textarea', { group: 'khusus' }), f('keputusan', 'Keputusan rapat (satu per baris)', 'textarea', { required: true, group: 'khusus' }), f('tindak_lanjut', 'Tindak lanjut', 'table', { numbered: true, minRows: 0, columns: [{ key: 'kegiatan', label: 'Tindak Lanjut', w: 4.5 }, { key: 'pj', label: 'Penanggung Jawab', w: 2.5 }, { key: 'tenggat', label: 'Batas Waktu', w: 2 }] })],
  body: [
    H('{{judul}}', { align: 'center', bold: true }), KV('rapat'), SP(),
    H('A. Agenda Rapat', { bold: true }), OL('{{agenda}}'),
    H('B. Pokok Pembahasan', { bold: true, optionalVars: ['pembahasan'] }), OL('{{pembahasan}}'),
    H('C. Keputusan Rapat', { bold: true }), OL('{{keputusan}}'),
    H('D. Tindak Lanjut', { bold: true, optionalTable: 'tindak_lanjut' }), TBL('tindak_lanjut'),
    P('Demikian notulen rapat ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.'),
  ],
});
add({
  id: 'berita-acara-kegiatan', nama: 'Berita Acara Pelaksanaan Kegiatan', kategori: 'kegiatan', kata: 'berita acara pelaksanaan kegiatan laporan singkat', ...DOC, judul: 'BERITA ACARA PELAKSANAAN KEGIATAN', signer: ['ketua', 'sekretaris'],
  fields: [...kegIdentitas(), f('jumlah_peserta', 'Jumlah peserta', 'text', { group: 'khusus' }), f('pelaksanaan', 'Uraian pelaksanaan (satu poin per baris)', 'textarea', { required: true, group: 'khusus' }), f('hasil', 'Hasil kegiatan (satu poin per baris)', 'textarea', { group: 'khusus' }), f('catatan', 'Catatan/kendala (opsional)', 'textarea', { group: 'khusus' })],
  body: [
    H('{{judul}}', { align: 'center', bold: true }),
    P('Pada hari ini {{hari_kegiatan}}, tanggal {{tanggal_kegiatan}}, bertempat di {{tempat_kegiatan}}, telah dilaksanakan {{nama_kegiatan}}{{jumlah_peserta}}.', { fmt: { jumlah_peserta: ' yang diikuti oleh {v} peserta' } }),
    P('Pelaksanaan kegiatan:', { align: 'left', bold: true }), OL('{{pelaksanaan}}'),
    P('Hasil kegiatan:', { align: 'left', bold: true, optionalVars: ['hasil'] }), OL('{{hasil}}'),
    P('Catatan: {{catatan}}', { optionalVars: ['catatan'] }),
    P('Demikian berita acara ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.'),
  ],
});
add({
  id: 'laporan-kegiatan', nama: 'Laporan Kegiatan', kategori: 'kegiatan', kata: 'laporan kegiatan pelaksanaan hasil evaluasi', ...DOC, judul: 'LAPORAN KEGIATAN', signer: ['ketua', 'sekretaris'],
  fields: [...kegIdentitas(), f('latar', 'Latar belakang', 'textarea', { required: true, group: 'khusus' }), f('tujuan_kegiatan', 'Tujuan kegiatan (satu per baris)', 'textarea', { group: 'khusus' }), f('peserta', 'Peserta kegiatan', 'text', { group: 'khusus' }), f('jalannya', 'Jalannya kegiatan', 'textarea', { required: true, group: 'khusus' }), f('hasil', 'Hasil yang dicapai (satu per baris)', 'textarea', { group: 'khusus' }), f('kendala', 'Kendala (satu per baris)', 'textarea', { group: 'khusus' }), f('saran', 'Saran/rekomendasi (satu per baris)', 'textarea', { group: 'khusus' })],
  closings: tt('laporan'),
  body: [
    H('{{judul}}', { align: 'center', bold: true }), H('{{nama_kegiatan_upper}}', { align: 'center', bold: true }), SP(),
    H('A. Latar Belakang', { bold: true }), P('{{latar}}'),
    H('B. Tujuan', { bold: true, optionalVars: ['tujuan_kegiatan'] }), OL('{{tujuan_kegiatan}}'),
    H('C. Waktu dan Tempat', { bold: true }), KV(),
    H('D. Peserta', { bold: true, optionalVars: ['peserta'] }), P('{{peserta}}', { optionalVars: ['peserta'] }),
    H('E. Jalannya Kegiatan', { bold: true }), P('{{jalannya}}'),
    H('F. Hasil Kegiatan', { bold: true, optionalVars: ['hasil'] }), OL('{{hasil}}'),
    H('G. Kendala', { bold: true, optionalVars: ['kendala'] }), OL('{{kendala}}'),
    H('H. Saran', { bold: true, optionalVars: ['saran'] }), OL('{{saran}}'),
  ],
});
const keuTbl = (label) => ({ numbered: true, sum: 'nominal', minRows: 3, columns: [{ key: 'uraian', label: 'Uraian', w: 5 }, { key: 'nominal', label: 'Jumlah (Rp)', w: 2.2, align: 'right', money: true }], label });
add({
  id: 'lpj', nama: 'Laporan Pertanggungjawaban', kategori: 'kegiatan', kata: 'lpj pertanggungjawaban laporan keuangan kegiatan', ...DOC, judul: 'LAPORAN PERTANGGUNGJAWABAN', signer: ['ketua', 'bendahara', 'sekretaris'],
  fields: [...kegIdentitas(), f('latar', 'Latar belakang dan tujuan', 'textarea', { required: true, group: 'khusus' }), f('ringkasan', 'Ringkasan pelaksanaan', 'textarea', { required: true, group: 'khusus' }), f('hasil', 'Hasil kegiatan (satu per baris)', 'textarea', { group: 'khusus' }), f('pemasukan', 'Pemasukan', 'table', keuTbl('Pemasukan')), f('pengeluaran', 'Pengeluaran', 'table', keuTbl('Pengeluaran')), f('evaluasi', 'Evaluasi (satu per baris)', 'textarea', { group: 'khusus' })],
  closings: ['Demikian laporan pertanggungjawaban ini kami susun dengan sebenarnya sebagai bentuk akuntabilitas kepada seluruh pihak yang berkepentingan.'],
  body: [
    H('{{judul}}', { align: 'center', bold: true }), H('{{nama_kegiatan_upper}}', { align: 'center', bold: true }), SP(),
    H('A. Identitas Kegiatan', { bold: true }), KV(),
    H('B. Latar Belakang dan Tujuan', { bold: true }), P('{{latar}}'),
    H('C. Ringkasan Pelaksanaan', { bold: true }), P('{{ringkasan}}'),
    H('D. Hasil Kegiatan', { bold: true, optionalVars: ['hasil'] }), OL('{{hasil}}'),
    H('E. Laporan Keuangan', { bold: true }), P('1. Pemasukan', { align: 'left' }), TBL('pemasukan'), P('2. Pengeluaran', { align: 'left' }), TBL('pengeluaran'), { type: 'saldo' },
    H('F. Evaluasi', { bold: true, optionalVars: ['evaluasi'] }), OL('{{evaluasi}}'),
  ],
  pengesahan: true,
});
add({
  id: 'laporan-keuangan', nama: 'Laporan Pemasukan dan Pengeluaran', kategori: 'kegiatan', kata: 'keuangan kas pemasukan pengeluaran saldo bendahara', ...DOC, judul: 'LAPORAN PEMASUKAN DAN PENGELUARAN', signer: ['bendahara', 'ketua'],
  groups: { identitas: false, penerima: false, kegiatan: false },
  fields: [f('periode', 'Periode/kegiatan', 'text', { required: true, group: 'khusus', ph: 'mis. Bulan Oktober 2026' }), f('saldo_awal', 'Saldo awal (Rp)', 'money', { group: 'khusus' }), f('pemasukan', 'Pemasukan', 'table', keuTbl('Pemasukan')), f('pengeluaran', 'Pengeluaran', 'table', keuTbl('Pengeluaran')), f('catatan', 'Catatan (opsional)', 'textarea', { group: 'khusus' })],
  body: [H('{{judul}}', { align: 'center', bold: true }), H('{{nama_organisasi_upper}}', { align: 'center', bold: true }), H('Periode: {{periode}}', { align: 'center' }), SP(), P('A. Pemasukan', { align: 'left', bold: true }), TBL('pemasukan'), P('B. Pengeluaran', { align: 'left', bold: true }), TBL('pengeluaran'), { type: 'saldo', awal: true }, P('Catatan: {{catatan}}', { optionalVars: ['catatan'] })],
});
add({
  id: 'inventaris', nama: 'Daftar Inventaris Perlengkapan', kategori: 'kegiatan', kata: 'inventaris aset barang perlengkapan organisasi', ...DOC, judul: 'DAFTAR INVENTARIS PERLENGKAPAN', signer: ['sekretaris', 'ketua'],
  groups: { identitas: false, penerima: false, kegiatan: false },
  fields: [f('per_tanggal', 'Keadaan per tanggal', 'date', { group: 'khusus', required: true }), f('barang', 'Daftar inventaris', 'table', { required: true, numbered: true, minRows: 10, columns: [{ key: 'nama', label: 'Nama Barang', w: 3 }, { key: 'jumlah', label: 'Jumlah', w: 1.1, align: 'center' }, { key: 'kondisi', label: 'Kondisi', w: 1.5, align: 'center' }, { key: 'lokasi', label: 'Lokasi/Penyimpan', w: 2.2 }, { key: 'ket', label: 'Keterangan', w: 1.8 }] })],
  body: [H('{{judul}}', { align: 'center', bold: true }), H('{{nama_organisasi_upper}}', { align: 'center', bold: true }), H('Keadaan per {{per_tanggal}}', { align: 'center' }), SP(), TBL('barang')],
});

export const BAWAAN_ID = new Set(BUILTIN.map((t) => t.id));

// ===== Penyesuaian kategori dan tanda tangan template lama =====
const KAT = { 'pemberitahuan-kegiatan': 'pemberitahuan', 'pemberitahuan-gotong-royong': 'pemberitahuan', 'pemberitahuan-persiapan': 'pemberitahuan', 'pemberitahuan-pemuda-warga': 'pemberitahuan', 'perubahan-jadwal': 'pemberitahuan',
  'surat-keterangan': 'keterangan', 'surat-rekomendasi': 'rekomendasi', 'sk-panitia': 'keputusan', 'penetapan-kepanitiaan': 'keputusan' };
const TTD0 = ['surat-keterangan', 'surat-rekomendasi', 'surat-pernyataan', 'sk-panitia', 'penetapan-kepanitiaan', 'surat-tugas-panitia', 'surat-tugas-perwakilan', 'surat-berita-acara'];
for (const t of BUILTIN) {
  if (KAT[t.id]) t.kategori = KAT[t.id];
  if (TTD0.includes(t.id)) t.ttd = { pengantar: '' };
}
// Template serbaguna ditaruh paling depan agar mudah ditemukan.
BUILTIN.unshift(...UMUM.map((t) => ({ builtin: true, favorite: false, kop: 'logo', signer: [{ role: 'ketua' }], closings: [], ...t })));
// Template keagamaan ditaruh setelah template serbaguna.
BUILTIN.splice(UMUM.length, 0, ...AGAMA.map((t) => ({ builtin: true, favorite: false, kop: 'logo', signer: ['ketua', 'sekretaris'], closings: [], ...t })));
BUILTIN.splice(UMUM.length + AGAMA.length, 0, ...MODEL.map((t) => ({ builtin: true, favorite: false, signer: ['ketua'], closings: [], ...t })));
