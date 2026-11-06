// Pita perintah bergaya aplikasi perkantoran: tab di atas, grup perintah dengan ikon di bawahnya.
import { h } from './util.js';
import { ikon } from './ui.js';

// tabs: [{ id, nama, grup: [{ nama, cmds: [{ ikon, label, judul, onClick }] }] }]
export function buatPita(tabs) {
  const el = h('div', { class: 'pita' });
  const mobil = () => window.matchMedia('(max-width: 1023px)').matches;
  el.dataset.buka = mobil() ? 'false' : 'true';
  const strip = h('div', { class: 'pita-tabs', role: 'tablist', 'aria-label': 'Pita perintah' });
  const panel = h('div', { class: 'pita-panel' });
  let aktif = 0;
  const gambar = () => {
    [...strip.children].forEach((b, i) => { b.setAttribute('aria-selected', String(i === aktif)); b.tabIndex = i === aktif ? 0 : -1; });
    panel.replaceChildren(...tabs[aktif].grup.map((g) => h('div', { class: 'pita-grup', role: 'group', 'aria-label': g.nama },
      h('div', { class: 'pita-cmds' }, ...g.cmds.map((c) => h('button', { type: 'button', class: 'pita-cmd', title: c.judul || c.label, onclick: c.onClick }, ikon(c.ikon, 22), h('span', null, c.label)))),
      h('div', { class: 'pita-grup-nama' }, g.nama))));
    panel.setAttribute('role', 'tabpanel');
  };
  tabs.forEach((t, i) => strip.append(h('button', { type: 'button', role: 'tab', class: 'pita-tab', onclick: () => {
    if (i === aktif && mobil()) el.dataset.buka = el.dataset.buka === 'true' ? 'false' : 'true';
    else { aktif = i; el.dataset.buka = 'true'; gambar(); }
  }, onkeydown: (e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { aktif = (aktif + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length; gambar(); strip.children[aktif].focus(); } } }, t.nama)));
  el.append(strip, panel); gambar();
  return { el };
}
