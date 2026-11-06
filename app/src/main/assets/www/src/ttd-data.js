// Data model tanda tangan (tanpa impor agar bisa dipakai template tanpa siklus).
const g = (o = {}) => ({ b: false, i: false, color: '#000000', size: 0, f: '', ...o });
const B = { b: true };
const NAMA_TEBAL = { nama: g(B) };

export const TTD_MODEL = {
  'panitia-2': {
    nama: 'Panitia: Ketua dan Sekretaris', ket: 'PANITIA PELAKSANA di tengah atas, Ketua kiri, Sekretaris kanan, nama tebal bergaris bawah dan NBM. Tanpa "Diketahui".',
    kelompok: 'Organisasi / ormas',
    ttd: { pengantar: 'PANITIA PELAKSANA', susunan: 'hormat', instansi: false, rata: 'center', garisNama: true, gaya: { pengantar: g(B), jabatan: g(B), nama: g(B), ket: g(B) } },
    signers: [{ role: 'ketua', jabatan: 'KETUA', posisi: 'kiri', baris: 1, ket: 'NBM: ' }, { role: 'sekretaris', jabatan: 'SEKRETARIS', posisi: 'kanan', baris: 1, ket: 'NBM: ' }],
  },
  'panitia-3': {
    nama: 'Panitia + Diketahui pimpinan', ket: 'Seperti model di atas, ditambah blok "DIKETAHUI" di tengah bawah (pimpinan induk).',
    kelompok: 'Organisasi / ormas',
    ttd: { pengantar: 'PANITIA PELAKSANA', susunan: 'hormat', instansi: false, rata: 'center', garisNama: true, gaya: { pengantar: g(B), jabatan: g(B), nama: g(B), ket: g(B), instansi: g(B) } },
    signers: [{ role: 'ketua', jabatan: 'KETUA', posisi: 'kiri', baris: 1, ket: 'NBM: ' }, { role: 'sekretaris', jabatan: 'SEKRETARIS', posisi: 'kanan', baris: 1, ket: 'NBM: ' },
      { role: 'lain', jabatan: 'KETUA', posisi: 'tengah', baris: 2, pengantar: 'DIKETAHUI', org: 'Nama Pimpinan Induk', ket: 'NBM: ' }],
  },
  'org-atas': {
    nama: 'Organisasi di atas, Ketua dan Sekretaris', ket: 'Nama organisasi di tengah atas tanpa "Hormat kami"; jabatan huruf kapital; nama tanpa garis bawah.',
    kelompok: 'Organisasi / ormas',
    ttd: { pengantar: '{{nama_organisasi}}', susunan: 'hormat', instansi: false, rata: 'center', garisNama: false, gaya: { nama: g({ b: false }) } },
    signers: [{ role: 'ketua', jabatan: 'KETUA', posisi: 'kiri', baris: 1 }, { role: 'sekretaris', jabatan: 'SEKRETARIS', posisi: 'kanan', baris: 1 }],
  },
  'org-tanpa-jabatan': {
    nama: 'Organisasi tebal di atas, dua tanda tangan', ket: 'Nama organisasi tebal di tengah atas, dua tanda tangan kiri-kanan, tanpa tulisan jabatan di atas tanda tangan.',
    kelompok: 'Organisasi / ormas',
    ttd: { pengantar: '{{nama_organisasi}}', susunan: 'hormat', instansi: false, jabatan: false, rata: 'center', garisNama: false, gaya: { pengantar: g(B), nama: g(B) } },
    signers: [{ role: 'ketua', jabatan: 'Ketua', posisi: 'kiri', baris: 1 }, { role: 'sekretaris', jabatan: 'Sekretaris', posisi: 'kanan', baris: 1 }],
  },
  'kemahasiswaan': {
    nama: 'Organisasi kemahasiswaan + Mengetahui', ket: '"Hormat Kami," dan nama organisasi berwarna di tengah, Ketua Pelaksana dan Sekretaris Acara, lalu "Mengetahui" Ketua Umum.',
    kelompok: 'Organisasi / ormas',
    ttd: { pengantar: 'Hormat Kami,\n**{w:#4472c4}{{nama_organisasi}}{/w}**', susunan: 'hormat', instansi: false, rata: 'center', garisNama: true, gaya: { nama: g(B), ket: g(B) } },
    signers: [{ role: 'ketua', jabatan: 'Ketua Pelaksana', posisi: 'kiri', baris: 1, ket: 'NIM. ' }, { role: 'sekretaris', jabatan: 'Sekretaris Acara', posisi: 'kanan', baris: 1, ket: 'NIM. ' },
      { role: 'lain', jabatan: 'Ketua Umum', posisi: 'tengah', baris: 2, pengantar: 'Mengetahui,', org: '{{nama_organisasi}}', ket: 'NIM. ' }],
  },
  'hormat-2': {
    nama: 'Hormat kami, dua penandatangan', ket: '"Hormat kami," di tengah, lalu jabatan, tanda tangan, dan nama dua orang kiri-kanan.',
    kelompok: 'Umum',
    ttd: { pengantar: 'Hormat kami,', susunan: 'hormat', instansi: false, rata: 'center', garisNama: true, gaya: NAMA_TEBAL },
    signers: [{ role: 'ketua', posisi: 'kiri', baris: 1 }, { role: 'sekretaris', posisi: 'kanan', baris: 1 }],
  },
  'hormat-3': {
    nama: 'Hormat kami, tiga penandatangan', ket: 'Tiga orang sejajar kiri-tengah-kanan di bawah "Hormat kami,".',
    kelompok: 'Umum',
    ttd: { pengantar: 'Hormat kami,', susunan: 'hormat', instansi: false, rata: 'center', garisNama: true, gaya: NAMA_TEBAL },
    signers: [{ role: 'ketua', posisi: 'kiri', baris: 1 }, { role: 'sekretaris', posisi: 'tengah', baris: 1 }, { role: 'bendahara', posisi: 'kanan', baris: 1 }],
  },
  'hormat-1': {
    nama: 'Hormat kami, satu penandatangan', ket: '"Hormat kami," lalu jabatan, tanda tangan, dan nama di pojok kanan bawah.',
    kelompok: 'Umum',
    ttd: { pengantar: 'Hormat kami,', susunan: 'hormat', instansi: false, rata: 'center', garisNama: true, gaya: NAMA_TEBAL },
    signers: [{ role: 'ketua', posisi: 'kanan', baris: 1 }],
  },
  'jabatan-saja': {
    nama: 'Langsung jabatan (tanpa pengantar)', ket: 'Tanpa "Hormat kami" dan tanpa nama organisasi: langsung jabatan, tanda tangan, nama. Satu orang di kanan.',
    kelompok: 'Umum',
    ttd: { pengantar: '', susunan: 'tidak', instansi: false, rata: 'center', garisNama: true, gaya: NAMA_TEBAL },
    signers: [{ role: 'ketua', posisi: 'kanan', baris: 1 }],
  },
  'dinas-kiri': {
    nama: 'Surat dinas: rata kiri dengan NIP', ket: 'Satu pejabat di sisi kanan; jabatan, nama tebal, dan NIP sejajar kiri. Cocok dengan cap/stempel.',
    kelompok: 'Instansi / sekolah',
    ttd: { pengantar: '', susunan: 'tidak', instansi: false, rata: 'left', garisNama: false, gaya: NAMA_TEBAL },
    signers: [{ role: 'ketua', posisi: 'kanan', baris: 1, ket: 'NIP ' }],
  },
  'takzim': {
    nama: 'Salam takzim + jabatan + NIP', ket: '"Salam takzim," sejajar kiri, jabatan, nama tebal, dan NIP (gaya lembaga negara).',
    kelompok: 'Instansi / sekolah',
    ttd: { pengantar: 'Salam takzim,', pengantarRata: 'left', susunan: 'hormat', instansi: false, rata: 'left', garisNama: false, gaya: NAMA_TEBAL },
    signers: [{ role: 'ketua', posisi: 'kanan', baris: 1, ket: 'NIP ' }],
  },
  'tanggal-jabatan': {
    nama: 'Tanggal di atas jabatan (pengumuman)', ket: 'Kota-tanggal tepat di atas jabatan kapital; nama tebal bergaris bawah dan NIP. Satu orang di kanan.',
    kelompok: 'Instansi / sekolah', tgl: 'ttd',
    ttd: { pengantar: '', susunan: 'tidak', instansi: false, rata: 'left', tglRata: 'left', garisNama: true, gaya: { jabatan: g(B), nama: g(B) } },
    signers: [{ role: 'ketua', posisi: 'kanan', baris: 1, ket: 'Nip. ', kapital: true }],
  },
};

