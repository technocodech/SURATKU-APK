// Perpustakaan contoh kalimat surat formal berbahasa Indonesia. Semuanya dapat diubah bebas setelah disisipkan.
// Titik-titik (…) menandai bagian yang perlu Anda isi sendiri. Pastikan isi sesuai fakta sebelum surat dikirim.
export const FRASA_KAT = {
  pembuka: 'Kalimat pembuka', undangan: 'Undangan', permohonan: 'Permohonan', pemberitahuan: 'Pemberitahuan',
  tugas: 'Tugas dan keputusan', keterangan: 'Keterangan dan rekomendasi', balasan: 'Balasan dan teguran',
  apresiasi: 'Terima kasih dan permohonan maaf', perorangan: 'Surat perorangan', penutup: 'Kalimat penutup',
};

const F = (kat, teks, butuh = []) => ({ kat, teks, butuh });
export const FRASA = [
  F('pembuka', 'Dengan hormat,'),
  F('pembuka', 'Bersama surat ini, kami {{nama_organisasi}} bermaksud menyampaikan bahwa ….'),
  F('pembuka', 'Sehubungan dengan …, dengan ini kami sampaikan bahwa ….'),
  F('pembuka', 'Menindaklanjuti surat Saudara Nomor … tanggal … perihal …, dengan ini kami sampaikan hal-hal sebagai berikut.'),
  F('pembuka', 'Berdasarkan hasil pembahasan bersama, kami memutuskan bahwa ….'),
  F('pembuka', 'Dalam rangka meningkatkan kelancaran kegiatan …, kami perlu menyampaikan hal berikut.'),

  F('undangan', 'Sehubungan dengan akan dilaksanakannya {{nama_kegiatan}}, kami mengundang Bapak/Ibu/Saudara/i untuk berkenan hadir pada:', ['nama_kegiatan']),
  F('undangan', 'Kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri … yang akan diselenggarakan pada:'),
  F('undangan', 'Mengingat pentingnya acara tersebut, kami mengharapkan kehadiran Bapak/Ibu/Saudara/i tepat pada waktunya.'),
  F('undangan', 'Apabila berhalangan hadir, kami mohon Bapak/Ibu/Saudara/i dapat menunjuk perwakilan dan memberitahukannya kepada kami.'),
  F('undangan', 'Mohon membawa kelengkapan berikut pada saat acara: ….'),
  F('undangan', 'Demikian undangan ini kami sampaikan. Atas kehadiran Bapak/Ibu/Saudara/i, kami mengucapkan terima kasih.'),

  F('permohonan', 'Sehubungan dengan rencana …, dengan hormat kami mengajukan permohonan … kepada Bapak/Ibu.'),
  F('permohonan', 'Berkenaan dengan hal tersebut, kami mohon kesediaan Bapak/Ibu untuk memberikan ….'),
  F('permohonan', 'Sebagai bahan pertimbangan, bersama surat ini kami lampirkan ….'),
  F('permohonan', 'Besar harapan kami agar permohonan ini dapat dikabulkan.'),
  F('permohonan', 'Demikian permohonan ini kami ajukan. Atas perhatian dan perkenan Bapak/Ibu, kami mengucapkan terima kasih.'),

  F('pemberitahuan', 'Dengan ini kami memberitahukan bahwa ….'),
  F('pemberitahuan', 'Sehubungan dengan …, kami informasikan bahwa … akan dilaksanakan pada hari … tanggal … bertempat di ….'),
  F('pemberitahuan', 'Diharapkan seluruh pihak yang bersangkutan dapat memperhatikan dan melaksanakan hal tersebut sebagaimana mestinya.'),
  F('pemberitahuan', 'Demikian pemberitahuan ini kami sampaikan untuk diketahui dan dilaksanakan sebagaimana mestinya.'),
  F('pemberitahuan', 'Atas perhatian dan kerja sama Bapak/Ibu/Saudara/i, kami mengucapkan terima kasih.'),

  F('tugas', 'Yang bertanda tangan di bawah ini memberikan tugas kepada:'),
  F('tugas', 'Untuk melaksanakan tugas … pada hari … tanggal … bertempat di ….'),
  F('tugas', 'Surat tugas ini berlaku sejak tanggal … sampai dengan ….'),
  F('tugas', 'Yang bersangkutan agar melaksanakan tugas dengan penuh tanggung jawab dan melaporkan hasilnya kepada pemberi tugas.'),
  F('tugas', 'Keputusan ini mulai berlaku pada tanggal ditetapkan. Apabila di kemudian hari terdapat kekeliruan, akan dilakukan perbaikan sebagaimana mestinya.'),

  F('keterangan', 'Yang bertanda tangan di bawah ini menerangkan bahwa:'),
  F('keterangan', 'Nama tersebut di atas benar merupakan … pada {{nama_organisasi}}.'),
  F('keterangan', 'Demikian surat keterangan ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.'),
  F('keterangan', 'Berdasarkan pengetahuan kami, yang bersangkutan telah … dan dapat kami rekomendasikan untuk ….'),
  F('keterangan', 'Demikian rekomendasi ini kami berikan agar dapat dipergunakan sebagaimana mestinya.'),

  F('balasan', 'Menjawab surat Saudara Nomor … tanggal … perihal …, dengan ini kami sampaikan bahwa ….'),
  F('balasan', 'Terima kasih atas surat Bapak/Ibu. Sehubungan dengan hal tersebut, kami dapat menyetujui/belum dapat menyetujui … dengan pertimbangan ….'),
  F('balasan', 'Sehubungan dengan belum terpenuhinya …, dengan ini kami mengingatkan agar … paling lambat tanggal ….'),
  F('balasan', 'Apabila telah dipenuhi, mohon surat ini diabaikan.'),

  F('apresiasi', 'Kami mengucapkan terima kasih yang sebesar-besarnya atas bantuan dan dukungan Bapak/Ibu pada ….'),
  F('apresiasi', 'Kehadiran dan peran serta Bapak/Ibu sangat berarti bagi kelancaran kegiatan tersebut.'),
  F('apresiasi', 'Kami memohon maaf atas ketidaknyamanan yang timbul akibat ….'),

  F('perorangan', 'Saya yang bertanda tangan di bawah ini mengajukan permohonan ….'),
  F('perorangan', 'Besar harapan saya untuk dapat diterima dan diberi kesempatan ….'),
  F('perorangan', 'Sebagai bahan pertimbangan, bersama surat ini saya lampirkan ….'),
  F('perorangan', 'Demikian surat ini saya buat dengan sebenarnya. Atas perhatian Bapak/Ibu, saya mengucapkan terima kasih.'),

  F('penutup', 'Demikian surat ini kami sampaikan. Atas perhatian dan kerja sama Bapak/Ibu, kami mengucapkan terima kasih.'),
  F('penutup', 'Demikian surat ini kami buat agar dapat dipergunakan sebagaimana mestinya.'),
  F('penutup', 'Atas perkenan dan bantuan Bapak/Ibu, kami mengucapkan terima kasih.'),
  F('penutup', 'Kami mohon maaf apabila terdapat kekurangan atau kekeliruan dalam surat ini.'),
];

// Hanya frasa yang variabelnya tersedia pada template ini.
export const frasaTersedia = (adaVar) => FRASA.filter((f) => f.butuh.every(adaVar));
