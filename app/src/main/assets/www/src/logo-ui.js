// Panel unggah logo (dipakai di Data Organisasi dan editor surat).
import { h } from './util.js';
import { btn, toast, konfirmasi, ikon } from './ui.js';
import * as Org from './org.js';

export function panelLogo(slot, { onChange, tampilUkuran = false } = {}) {
  const box = h('div', { class: 'logo-slot' });
  const file = h('input', { type: 'file', accept: '.png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml', class: 'sr', 'aria-label': 'Pilih berkas ' + Org.SLOT_LOGO[slot],
    onchange: async (e) => {
      const f = e.target.files[0]; e.target.value = ''; if (!f) return;
      try { await Org.simpanLogo(slot, f); toast(Org.SLOT_LOGO[slot] + ' tersimpan dan siap dipakai ulang.'); gambar(); onChange && onChange(slot); } catch (err) { toast(err.message, 'err', 6000); }
    } });
  const gambar = () => {
    const l = Org.getLogos()[slot];
    const prev = h('div', { class: 'logo-box' }, l ? h('img', { src: l.dataUrl, alt: 'Pratinjau ' + Org.SLOT_LOGO[slot] }) : h('span', { class: 'small muted', style: { textAlign: 'center' } }, 'Belum ada'));
    box.replaceChildren(prev,
      h('div', { class: 'grow' }, h('b', null, Org.SLOT_LOGO[slot]), h('div', { class: 'small muted' }, l ? `${l.name} · ${l.w}×${l.h} px` : 'PNG, JPG, atau SVG · maks. 2 MB'),
        h('div', { class: 'row', style: { marginTop: '8px' } },
          btn(l ? 'Ganti' : 'Unggah', { icon: 'upload', kind: 'sm', onClick: () => file.click() }),
          l ? btn('Hapus', { icon: 'trash', kind: 'sm danger-o', onClick: async () => { if (await konfirmasi(`Hapus ${Org.SLOT_LOGO[slot]}? Surat baru tidak lagi memakai logo ini.`, { ok: 'Hapus logo', bahaya: true })) { await Org.hapusLogo(slot); gambar(); onChange && onChange(slot); toast('Logo dihapus.'); } } }) : null)),
      file);
  };
  gambar();
  return box;
}
