// Komponen antarmuka bersama: ikon, toast, dialog, kolom formulir.
import { h } from './util.js';
import { barAlat } from './alat.js';

const P = {
  home: 'M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z',
  plus: 'M12 5v14M5 12h14',
  layers: 'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5',
  archive: 'M3 4h18v4H3zM5 8v12h14V8M10 12h4',
  building: 'M4 21V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v17M15 9h4a1 1 0 0 1 1 1v11M2 21h20M8 7h3M8 11h3M8 15h3',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  help: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4M12 17.5h.01',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  menu: 'M3 6h18M3 12h18M3 18h18',
  download: 'M12 3v12M7 10l5 5 5-5M4 21h16',
  upload: 'M12 15V3M7 8l5-5 5 5M4 21h16',
  printer: 'M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2M7 14h10v7H7z',
  save: 'M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM8 3v5h7M8 21v-7h8v7',
  trash: 'M4 7h16M10 11v6M14 11v6M5 7l1 13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1l1-13M9 7V4h6v3',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  edit: 'M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  star: 'M12 2l3 7 7 .6-5.3 4.7 1.6 7.2L12 17.8 5.7 21.5l1.6-7.2L2 9.6 9 9z',
  check: 'M5 12l5 5 9-10',
  alert: 'M12 3l10 18H2zM12 10v5M12 18h.01',
  chevron: 'M6 9l6 6 6-6',
  back: 'M15 18l-6-6 6-6',
  file: 'M6 2h8l6 6v14H6zM14 2v6h6M9 13h6M9 17h6',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  up: 'M12 19V5M6 11l6-6 6 6',
  down: 'M12 5v14M6 13l6 6 6-6',
  x: 'M6 6l12 12M18 6L6 18',
  refresh: 'M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5',
  zoomin: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3M11 8v6M8 11h6',
  zoomout: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3M8 11h6',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  word: 'M4 4h16v16H4zM8 9l1.5 6L12 10l2.5 5L16 9',
  undo: 'M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
  redo: 'M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3',
};
export function ikon(n, size = 18) {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('width', size); s.setAttribute('height', size);
  s.setAttribute('fill', n === 'star-fill' ? 'currentColor' : 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '1.8');
  s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('class', 'ik');
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', P[n === 'star-fill' ? 'star' : n] || ''); s.append(p);
  return s;
}

export function btn(label, { icon, kind = '', onClick, title, type = 'button', disabled, cls = '' } = {}) {
  return h('button', { class: `btn ${kind} ${cls}`.trim(), type, title, disabled, onclick: onClick }, icon ? ikon(icon, 16) : null, label ? h('span', null, label) : null);
}

// ---------- Toast ----------
export function toast(msg, kind = 'ok', ms = 3600) {
  let box = document.getElementById('toasts');
  if (!box) { box = h('div', { id: 'toasts', 'aria-live': 'polite' }); document.body.append(box); }
  const t = h('div', { class: `toast ${kind}`, role: kind === 'err' ? 'alert' : 'status' }, ikon(kind === 'err' ? 'alert' : 'check', 16), h('span', null, msg));
  box.append(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, ms);
}

// ---------- Dialog ----------
export function modal({ title, body, actions = [], wide = false, onClose }) {
  const prev = document.activeElement;
  const close = () => { ov.remove(); document.removeEventListener('keydown', key); if (prev && prev.focus) prev.focus(); if (onClose) onClose(); };
  const key = (e) => { if (e.key === 'Escape') close(); };
  const box = h('div', { class: 'modal' + (wide ? ' wide' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
    h('div', { class: 'modal-h' }, h('h3', null, title), h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Tutup', onclick: close }, ikon('x'))),
    h('div', { class: 'modal-b' }, body),
    actions.length ? h('div', { class: 'modal-f' }, actions.map((a) => btn(a.label, { kind: a.kind || '', icon: a.icon, onClick: async () => { if (a.onClick) { const r = await a.onClick(close); if (r === false) return; } if (!a.keep) close(); } }))) : null);
  const ov = h('div', { class: 'overlay', onmousedown: (e) => { if (e.target === ov) close(); } }, box);
  document.body.append(ov); document.addEventListener('keydown', key);
  const f = box.querySelector('input,select,textarea,.btn.primary,.btn'); if (f) f.focus();
  return close;
}

export function konfirmasi(pesan, { ok = 'Ya, lanjutkan', batal = 'Batal', bahaya = false, judul = 'Konfirmasi' } = {}) {
  return new Promise((res) => {
    let done = false;
    modal({ title: judul, body: h('p', { class: 'pre' }, pesan), onClose: () => { if (!done) res(false); }, actions: [
      { label: batal, onClick: () => { done = true; res(false); } },
      { label: ok, kind: bahaya ? 'danger' : 'primary', onClick: () => { done = true; res(true); } },
    ] });
  });
}

// ---------- Kolom formulir ----------
let idc = 0;
export function kolom({ label, type = 'text', value = '', options, ph, hint, required, onInput, rows = 3, min, max, step, tip, cls = '', alat = false }) {
  const id = 'f' + (++idc);
  let inp;
  if (type === 'select') {
    inp = h('select', { id, onchange: (e) => onInput && onInput(e.target.value) }, (options || []).map((o) => {
      const [v, t] = Array.isArray(o) ? o : [o, o === '' ? '— Tidak ada —' : o];
      return h('option', { value: v, selected: v === value }, t);
    }));
  } else if (type === 'textarea') {
    inp = h('textarea', { id, rows, placeholder: ph || '', oninput: (e) => onInput && onInput(e.target.value) }); inp.value = value ?? '';
  } else {
    inp = h('input', { id, type: type === 'money' ? 'text' : type === 'number' ? 'number' : type, inputmode: type === 'money' ? 'numeric' : undefined, placeholder: ph || '', min, max, step, oninput: (e) => onInput && onInput(e.target.value) }); inp.value = value ?? '';
  }
  const el = h('div', { class: `fld ${cls}` },
    h('label', { for: id }, label, required ? h('span', { class: 'req', title: 'Wajib diisi' }, ' *') : null, tip ? h('span', { class: 'tip', title: tip, tabindex: '0', 'aria-label': tip }, '?') : null),
    alat && (type === 'text' || type === 'textarea') ? barAlat(inp, label.replace(/\s*\(.*$/, '')) : null,
    inp, hint ? h('div', { class: 'hint' }, hint) : null);
  return { el, input: inp };
}

export function seksi(judul, isi, { open = true, nomor, id } = {}) {
  const d = h('details', { class: 'seksi', open, id }, h('summary', null, nomor ? h('span', { class: 'no' }, nomor) : null, h('span', null, judul), ikon('chevron', 16)), h('div', { class: 'seksi-b' }, isi));
  return d;
}

export function kosongPesan(judul, teks, aksi) {
  return h('div', { class: 'empty' }, h('div', { class: 'empty-ic' }, ikon('file', 28)), h('h4', null, judul), h('p', null, teks), aksi || null);
}

export function tanya(label, { judul = 'Isi data', nilai = '', ok = 'Simpan' } = {}) {
  return new Promise((res) => {
    let done = false;
    const k = kolom({ label, value: nilai });
    k.input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); done = true; res(k.input.value.trim() || null); document.querySelector('.overlay .modal-h .icon-btn').click(); } });
    modal({ title: judul, body: k.el, onClose: () => { if (!done) res(null); }, actions: [{ label: 'Batal', onClick: () => { done = true; res(null); } }, { label: ok, kind: 'primary', onClick: () => { done = true; res(k.input.value.trim() || null); } }] });
  });
}
