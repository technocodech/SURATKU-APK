// Template "Model": variasi susunan surat resmi (kop, penerima, salam, tanda tangan) yang terinspirasi dari ragam surat nyata.
// Semua bagiannya (font, kop, warna, indentasi, tanda tangan) dapat diubah di editor tanpa memengaruhi template lain.
import { MODEL_GAYA, MODEL_COMPANY } from './models.js';
import { TTD_MODEL } from './ttd-data.js';
const f = (key, label, type = 'text', extra = {}) => ({ key, label, type, ...extra });
const P = (text, extra = {}) => ({ type: 'p', text, align: 'justify', ...extra });
const OL = (items) => ({ type: 'ol', text: Array.isArray(items) ? items.join('\n') : items });
const KV = (ref = 'kegiatan') => ({ type: 'kv', ref });
const kegiatan = (labelNama, ph = '') => [
  f('nama_kegiatan', labelNama, 'text', { required: true, group: 'kegiatan', ph }),
  f('tanggal_kegiatan', 'Tanggal', 'date', { required: true, group: 'kegiatan' }),
  f('waktu_mulai', 'Waktu mulai', 'time', { required: true, group: 'kegiatan' }),
  f('waktu_selesai', 'Waktu selesai', 'time', { group: 'kegiatan', hint: 'Kosongkan bila tertulis "selesai".' }),
  f('tempat_kegiatan', 'Tempat', 'text', { required: true, group: 'kegiatan' }),
  f('alamat_tempat', 'Alamat tempat', 'text', { group: 'kegiatan' }),
  f('tujuan_kegiatan', 'Tujuan / tema kegiatan', 'textarea', { group: 'kegiatan' }),
];
const GRP = { identitas: true, penerima: true, kegiatan: true };
const M = (id, nama, kata, model, ext) => ({ id, nama, kategori: ext.kategori || 'undangan', kata: 'model variasi ' + kata, kind: 'surat', salam: true, groups: GRP, format: (MODEL_GAYA[model] || MODEL_COMPANY[model]).format, ttd: (MODEL_GAYA[model] || MODEL_COMPANY[model]).ttd, ...ext });

export const MODEL = [
  M('model-panitia', 'Undangan Kegiatan: Model Panitia dan Mengetahui', 'panitia ormas muhammadiyah nu pimpinan mengetahui diketahui dua logo penerima menjorok', 'panitia', {
    defaults: { perihal: 'Pemberitahuan Kegiatan' }, kop: 'logo',
    fields: [...kegiatan('Nama kegiatan'), f('jumlah_hadir', 'Perkiraan jumlah hadir (opsional)', 'text', { group: 'kegiatan' }), f('tamu', 'Tamu undangan (satu per baris, opsional)', 'textarea', { group: 'kegiatan' })],
    closings: ['Demikian surat permohonan ini kami buat atas perhatiannya kami ucapkan terima kasih.'],
    signer: [{ role: 'ketua', jabatan: 'Ketua', posisi: 'kiri', baris: 1, ket: 'NBM: ' }, { role: 'sekretaris', jabatan: 'Sekretaris', posisi: 'kanan', baris: 1, ket: 'NBM: ' }, { role: 'lain', jabatan: 'Ketua', posisi: 'tengah', baris: 2, pengantar: 'DIKETAHUI', org: 'Nama Organisasi / Pimpinan Induk' }],
    body: [P('Dalam rangka {{tujuan_kegiatan}}, kami akan mengadakan kegiatan {{nama_kegiatan}} yang akan dilaksanakan pada:', { optionalVars: ['tujuan_kegiatan'], alt: 'Kami akan mengadakan kegiatan {{nama_kegiatan}} yang akan dilaksanakan pada:' }), KV(),
      P('Berkaitan dengan kegiatan tersebut kami memberitahukan bahwa jumlah yang akan hadir pada acara tersebut kurang lebih {{jumlah_hadir}} orang, kami mohon untuk bisa membersamai kami sampai selesainya acara.', { optionalVars: ['jumlah_hadir'] }),
      P('Untuk tamu undangan yang direncanakan hadir adalah:', { optionalVars: ['tamu'], align: 'left' }), OL('{{tamu}}')],
  }),
  M('model-lazismu', 'Undangan Kegiatan: Model Lazismu (Panitia: Ketua dan Sekretaris)', 'lazismu muhammadiyah pdm pda panitia pelaksana santunan ramadhan ketua sekretaris nbm ditempat kades tamu undangan', 'lazismu', {
    defaults: { perihal: 'Pemberitahuan Kegiatan' }, kop: 'logo',
    fields: [...kegiatan('Nama kegiatan', 'mis. Santunan Ramadhan 1445 H'), f('jumlah_hadir', 'Perkiraan jumlah hadir (opsional)', 'text', { group: 'kegiatan', ph: 'mis. 800' }), f('tamu', 'Tamu undangan yang direncanakan hadir (satu per baris, opsional)', 'textarea', { group: 'kegiatan', ph: 'Ketua Pimpinan Wilayah\nBapak Camat\nBapak Kades' })],
    closings: ['Demikian surat pemberitahuan ini kami buat atas perhatiannya kami ucapkan terima kasih.'],
    signer: TTD_MODEL['panitia-2'].signers,
    body: [P('Puji syukur kehadirat Allah subhanahu wa ta\'ala yang telah memberikan kenikmatan dan karunia kepada kita semua. Sholawat dan salam semoga senantiasa tercurahkan kepada baginda Nabi Muhammad SAW, beserta keluarga dan sahabatnya.'),
      P('Dalam rangka {{tujuan_kegiatan}}, {{nama_organisasi}} akan mengadakan kegiatan {{nama_kegiatan}} yang akan dilaksanakan pada:', { optionalVars: ['tujuan_kegiatan'], alt: '{{nama_organisasi}} akan mengadakan kegiatan {{nama_kegiatan}} yang akan dilaksanakan pada:' }), KV(),
      P('Berkaitan dengan kegiatan tersebut kami memberitahukan bahwa jumlah yang akan hadir pada acara tersebut kurang lebih {{jumlah_hadir}} orang, kami mohon untuk bisa membersamai kami sampai selesainya acara.', { optionalVars: ['jumlah_hadir'] }),
      P('Untuk tamu undangan yang direncanakan hadir adalah:', { optionalVars: ['tamu'], align: 'left' }), OL('{{tamu}}')],
  }),
  M('model-company-undangan-rapat', 'Undangan Rapat Perusahaan / Badan (kop kiri, dekorasi sudut)', 'company perusahaan badan instansi rapat penyusunan zoom daring agenda kop kiri faset dekorasi', 'company-badan', {
    defaults: { perihal: 'Undangan Rapat', sapaan: 'Kepada Yth.' }, kop: 'logo',
    fields: [...kegiatan('Nama rapat', 'mis. Penyusunan Standar Prosedur Pelayanan'), f('media', 'Media pertemuan (opsional)', 'text', { group: 'kegiatan', ph: 'mis. Pertemuan daring / Ruang Rapat Lt. 2' }), f('tautan', 'Tautan atau ID rapat (opsional)', 'textarea', { group: 'kegiatan', ph: 'Link Meeting: ...\nMeeting ID: ...\nPasscode: ...' }), f('agenda', 'Agenda (opsional)', 'textarea', { group: 'kegiatan' })],
    closings: ['Demikian disampaikan, atas perhatian dan kerja sama yang baik kami ucapkan terima kasih.'],
    signer: [{ role: 'ketua', jabatan: 'Direktur', posisi: 'kanan', baris: 1 }],
    body: [P('Dengan hormat,', { align: 'left' }), P('Sehubungan dengan kegiatan {{nama_kegiatan}}, dengan ini kami mengundang Bapak/Ibu hadir dalam pertemuan yang akan diselenggarakan pada:', { align: 'justify' }),
      { type: 'kv', rows: [{ label: 'hari/tanggal', tpl: '{{hari_kegiatan}}, {{tanggal_kegiatan}}' }, { label: 'waktu', tpl: '{{waktu_kegiatan}}' }, { label: 'media', tpl: '{{media}}', opt: true }, { label: 'tempat', tpl: '{{tempat_kegiatan}}', opt: true }, { label: '', tpl: '{{tautan}}', opt: true }, { label: 'agenda', tpl: '{{agenda}}', opt: true }] }],
  }),
  M('model-himpunan', 'Undangan Kegiatan: Model Organisasi Kemahasiswaan', 'himpunan mahasiswa bem ukm kampus organisasi mahasiswa kop berwarna mengetahui ketua umum', 'himpunan', {
    defaults: { perihal: 'Surat Undangan' }, kop: 'logo',
    fields: [...kegiatan('Nama kegiatan'), f('via', 'Media / lokasi daring (opsional)', 'text', { group: 'kegiatan', ph: 'mis. Aplikasi Zoom' }), f('nb', 'Catatan di bagian bawah (opsional)', 'textarea', { group: 'kegiatan' })],
    closings: ['Kami selaku panitia pelaksana sangat mengharapkan kehadiran Bapak/Ibu untuk sedianya mampu berpartisipasi dalam acara yang kami laksanakan. Atas perhatiannya kami ucapkan terima kasih.'],
    signer: [{ role: 'ketua', jabatan: 'Ketua Pelaksana', posisi: 'kiri', baris: 1, ket: 'NIM. ' }, { role: 'sekretaris', jabatan: 'Sekretaris Acara', posisi: 'kanan', baris: 1, ket: 'NIM. ' }, { role: 'lain', jabatan: 'Ketua Umum', posisi: 'tengah', baris: 2, pengantar: 'Mengetahui,', org: '{{nama_organisasi}}', ket: 'NIM. ' }],
    body: [P('Dengan hormat,', { align: 'left' }), P('Sehubungan dengan akan dilaksanakannya {{nama_kegiatan}}, dengan tujuan {{tujuan_kegiatan}} yang akan dilaksanakan pada:', { optionalVars: ['tujuan_kegiatan'], alt: 'Sehubungan dengan akan dilaksanakannya {{nama_kegiatan}} yang akan dilaksanakan pada:' }),
      { type: 'kv', rows: [{ label: 'Hari', tpl: '{{hari_kegiatan}}' }, { label: 'Tanggal', tpl: '{{tanggal_kegiatan}}' }, { label: 'Waktu', tpl: '{{waktu_kegiatan}}' }, { label: 'Tempat', tpl: '{{tempat_kegiatan}}', opt: true }, { label: 'Via', tpl: '{{via}}', opt: true }] }, P('NB: {{nb}}', { optionalVars: ['nb'], align: 'left' })],
  }),
  M('model-sekolah', 'Undangan: Model Sekolah / Pesantren dengan Salam', 'sekolah pesantren smk madrasah salam islami spasi 1,5 guru karyawan milad', 'sekolah', {
    defaults: { perihal: 'Undangan' }, kop: 'logo',
    fields: [...kegiatan('Nama kegiatan', 'mis. Peringatan Hari Ulang Tahun Sekolah')],
    closings: ['Demikian undangan ini kami sampaikan, mengingat pentingnya acara ini maka kami berharap kehadiran Bapak/Ibu tepat waktu. Atas perhatiannya kami ucapkan terima kasih.'],
    signer: [{ role: 'ketua', jabatan: 'Kepala Sekolah', posisi: 'kanan', baris: 1 }],
    body: [P('Puji beserta syukur kita panjatkan kehadirat Allah SWT. Semoga rahmat-Nya selalu menyertai kita. Sholawat beserta salam kita curahkan kepada baginda Nabi Muhammad SAW.'), P('Selanjutnya, sehubungan dengan akan dilaksanakannya {{nama_kegiatan}}, maka kami selaku pengurus {{nama_organisasi}} mengundang Bapak/Ibu untuk menghadiri acara tersebut yang Insya Allah akan dilaksanakan pada:'), KV()],
  }),
  M('model-kementerian', 'Undangan Rapat: Model Instansi Pemerintah (huruf sans)', 'instansi pemerintah kementerian dinas badan rapat koordinasi sifat segera sosialisasi arial', 'kementerian', {
    defaults: { perihal: 'Undangan Rapat Koordinasi' }, kop: 'logo',
    fields: [...kegiatan('Nama rapat'), f('dasar', 'Latar belakang / dasar undangan', 'textarea', { group: 'kegiatan' }), f('konfirmasi', 'Cara konfirmasi kehadiran (opsional)', 'textarea', { group: 'kegiatan', ph: 'mis. melalui tautan ... atau menghubungi ... (HP ...)' }), f('perlu_dibawa', 'Catatan tambahan (opsional)', 'textarea', { group: 'kegiatan' })],
    closings: ['Demikian kami sampaikan, atas perhatian Saudara kami ucapkan terima kasih.'],
    signer: [{ role: 'ketua', jabatan: 'Kepala', posisi: 'kanan', baris: 1, ket: 'NIP ' }], ttd: { ...MODEL_GAYA.kementerian.ttd },
    body: [P('{{dasar}} kami akan menyelenggarakan {{nama_kegiatan}} dengan mengundang Saudara yang akan diselenggarakan pada:', { optionalVars: ['dasar'], alt: 'Kami akan menyelenggarakan {{nama_kegiatan}} dengan mengundang Saudara yang akan diselenggarakan pada:' }), KV(),
      P('{{konfirmasi}}', { optionalVars: ['konfirmasi'] }), P('{{perlu_dibawa}}', { optionalVars: ['perlu_dibawa'] })],
  }),
  M('model-permohonan-pembicara', 'Permohonan Pembicara / Narasumber: Model Lembaga Negara', 'permohonan pembicara narasumber kongres seminar lokakarya salam takzim lembaga badan', 'takzim', {
    kategori: 'permohonan', defaults: { perihal: 'Permohonan sebagai pembicara undangan' }, kop: 'logo',
    fields: [...kegiatan('Nama kegiatan'), f('topik', 'Topik yang diminta', 'textarea', { required: true, group: 'kegiatan' }), f('fasilitas', 'Fasilitas yang disediakan (opsional)', 'textarea', { group: 'kegiatan', ph: 'mis. biaya transportasi dan akomodasi ditanggung panitia' }), f('batas_balasan', 'Mohon konfirmasi paling lambat (tanggal)', 'date', { group: 'kegiatan' }), f('kontak_balasan', 'Kirim konfirmasi ke (email/kontak)', 'text', { group: 'kegiatan' })],
    closings: ['Atas perhatian dan kesediaan Saudara, kami ucapkan terima kasih.'],
    signer: [{ role: 'ketua', jabatan: 'Kepala', posisi: 'kanan', baris: 1, ket: 'NIP ' }],
    body: [P('Kami beritahukan kepada Saudara bahwa {{nama_organisasi}} akan menyelenggarakan {{nama_kegiatan}}. {{tujuan_kegiatan}}', { optionalVars: ['tujuan_kegiatan'], alt: 'Kami beritahukan kepada Saudara bahwa {{nama_organisasi}} akan menyelenggarakan {{nama_kegiatan}}.' }),
      P('Sehubungan dengan itu, kami bermaksud mengundang Saudara sebagai pembicara dengan topik "**{{topik}}**" pada:'), { type: 'kv', rows: [{ label: 'Hari, tanggal', tpl: '{{hari_kegiatan}}, {{tanggal_kegiatan}}' }, { label: 'Pukul', tpl: '{{waktu_kegiatan}}' }, { label: 'Tempat', tpl: '{{tempat_kegiatan}}{{alamat_tempat}}', fmt: { alamat_tempat: '\n{v}' } }] },
      P('Perlu kami sampaikan bahwa {{fasilitas}}.', { optionalVars: ['fasilitas'] }), P('Kami berharap Saudara dapat memberikan konfirmasi paling lambat {{batas_balasan}} melalui {{kontak_balasan}}.', { optionalVars: ['batas_balasan'] })],
  }),
];
