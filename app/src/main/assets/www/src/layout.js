// Mesin tata letak: model dokumen -> halaman berisi primitif (teks, garis, kotak, gambar).
// Pratinjau (SVG), PDF, dan cetak memakai hasil yang sama, sehingga tampilannya identik.
import { width as tw, charW, styleKey, fam } from './fonts.js';

const MM = 72 / 25.4;
const ASC = 0.891; const DESC = 0.216;

function tokenize(runs) {
  const toks = [];
  for (const r of runs) {
    const parts = String(r.text).split('\n');
    parts.forEach((p, pi) => {
      if (pi > 0) toks.push({ k: 'nl' });
      const re = /( +)|([^ ]+)/g; let m;
      while ((m = re.exec(p))) {
        if (m[1]) toks.push({ k: 'sp', n: m[1].length, st: r });
        else toks.push({ k: 'w', text: m[2], st: r });
      }
    });
  }
  return toks;
}

function buildItems(runs, size, maxW) {
  const toks = tokenize(runs);
  const items = [];
  let word = null;
  const flush = () => { if (word) { items.push(word); word = null; } };
  for (const t of toks) {
    if (t.k === 'w') {
      const seg = { text: t.text, b: !!t.st.b, i: !!t.st.i, miss: !!t.st.miss, ul: !!t.st.ul, u: !!t.st.u, f: t.st.f, color: t.st.color };
      seg.w = tw(seg.text, seg, size);
      if (!word) word = { k: 'word', segs: [], w: 0 };
      word.segs.push(seg); word.w += seg.w;
    } else {
      flush();
      if (t.k === 'sp') items.push({ k: 'sp', w: charW(' ', styleKey(t.st)) * size * t.n, n: t.n });
      else items.push({ k: 'nl' });
    }
  }
  flush();
  // pecah kata yang lebih panjang dari lebar baris
  const out = [];
  for (const it of items) {
    if (it.k === 'word' && it.w > maxW && maxW > 10) {
      let cur = { k: 'word', segs: [], w: 0 };
      for (const seg of it.segs) {
        let buf = '';
        for (const ch of seg.text) {
          const cw = tw(ch, seg, size);
          if (cur.w + tw(buf, seg, size) + cw > maxW && (buf || cur.segs.length)) {
            if (buf) { const s = { ...seg, text: buf }; s.w = tw(buf, s, size); cur.segs.push(s); cur.w += s.w; buf = ''; }
            out.push(cur); cur = { k: 'word', segs: [], w: 0 };
          }
          buf += ch;
        }
        if (buf) { const s = { ...seg, text: buf }; s.w = tw(buf, s, size); cur.segs.push(s); cur.w += s.w; }
      }
      if (cur.segs.length) out.push(cur);
    } else out.push(it);
  }
  return out;
}

// -> [{segs:[{text,x,b,i,miss}], w, x0, forced}]
export function wrap(runs, { width, size, align = 'left', first = 0, rest = 0, fam: fm = 't' }) {
  const items = buildItems(runs.map((r) => (r.f ? r : { ...r, f: fm })), size, width - Math.max(first, rest));
  const lines = []; let cur = { it: [], w: 0, forced: false };
  const avail = (n) => width - (n === 0 ? first : rest);
  const push = (forced) => {
    while (cur.it.length && cur.it[cur.it.length - 1].k === 'sp') { cur.w -= cur.it.pop().w; }
    cur.forced = forced; lines.push(cur); cur = { it: [], w: 0, forced: false };
  };
  for (const it of items) {
    if (it.k === 'nl') { push(true); continue; }
    if (it.k === 'sp') { if (cur.it.length) { cur.it.push(it); cur.w += it.w; } continue; }
    if (cur.it.length && cur.w + it.w > avail(lines.length) + 0.01) push(false);
    cur.it.push(it); cur.w += it.w;
  }
  push(true);
  if (lines.length > 1 && !lines[lines.length - 1].it.length) lines.pop();
  return lines.map((ln, idx) => {
    const av = avail(idx); const off = idx === 0 ? first : rest;
    const spaces = ln.it.filter((x) => x.k === 'sp');
    let extra = 0; let x = off;
    if (align === 'center') x = off + (av - ln.w) / 2;
    else if (align === 'right') x = off + av - ln.w;
    else if (align === 'justify' && !ln.forced && idx < lines.length - 1 && spaces.length) extra = (av - ln.w) / spaces.length;
    const segs = [];
    for (const it of ln.it) {
      if (it.k === 'sp') { x += it.w + extra; continue; }
      for (const s of it.segs) { segs.push({ text: s.text, x, b: s.b, i: s.i, miss: s.miss, ul: s.ul, u: s.u, f: s.f, color: s.color, w: s.w }); x += s.w; }
    }
    return { segs, w: ln.w, x0: segs.length ? segs[0].x : off, x1: segs.length ? segs[segs.length - 1].x + segs[segs.length - 1].w : off };
  });
}

const baseline = (top, lh, size) => top + (lh - size * (ASC + DESC)) / 2 + size * ASC;
const textPrims = (line, x, top, lh, size, ul, warna) => {
  const prims = []; const by = baseline(top, lh, size);
  let gu = null;
  const tutup = () => { if (gu) { prims.push({ t: 'line', x1: x + gu.a, y1: by + size * 0.13, x2: x + gu.b, y2: by + size * 0.13, w: Math.max(0.5, size / 24), c: gu.c }); gu = null; } };
  for (const s of line.segs) {
    if (s.miss) prims.push({ t: 'hl', x: x + s.x - 1, y: top + 1, w: s.w + 2, h: lh - 2 });
    prims.push({ t: 'text', x: x + s.x, y: by, text: s.text, b: s.b, i: s.i, f: s.f, c: s.color || warna, size, miss: s.miss });
    const c = s.color || warna;
    if (s.u) { if (gu && gu.c === c) gu.b = s.x + s.w; else { tutup(); gu = { a: s.x, b: s.x + s.w, c }; } } else tutup();
  }
  tutup();
  if (ul && line.segs.length) prims.push({ t: 'line', x1: x + line.x0, y1: by + size * 0.13, x2: x + line.x1, y2: by + size * 0.13, w: Math.max(0.5, size / 24), c: warna });
  return prims;
};

export function layout(doc) {
  const { paper, margins, size: baseSize, spacing } = doc;
  const contentW = paper.w - margins.left - margins.right;
  const contentH = paper.h - margins.top - margins.bottom;
  const FAM = fam(doc.fam);
  const LH = (s, sp) => s * (sp || spacing);
  const W = (t, size, st = {}) => tw(t, { f: FAM, ...st }, size);

  // ---------- Per blok ----------
  function paraPieces(b, w, opt = {}) {
    const size = b.size || baseSize; const lh = LH(size, b.spasi);
    const ind = b.noIndent ? 0 : (b.indent || 0);
    const kiri = Math.min(w * 0.6, Math.max(0, b.kiri || 0)); // geser seluruh paragraf ke kanan
    const lines = wrap(b.runs, { width: w - kiri, size, align: b.align || 'left', first: ind + (opt.left || 0), rest: opt.left || 0, fam: FAM });
    return lines.map((ln, i) => ({
      h: lh, before: i === 0 ? (b.before || 0) : 0, after: i === lines.length - 1 ? (b.after ?? 0) : 0,
      keepNext: b.keepNext && i === lines.length - 1, line: { idx: i, n: lines.length },
      draw: (x, y) => textPrims(ln, x + kiri, y, lh, size, b.ul, b.color),
    }));
  }

  function listPieces(b, w) {
    const size = b.size || baseSize; const lh = LH(size, b.spasi);
    const ind = b.indent || 0; const hang = b.hang || 18;
    const out = [];
    b.items.forEach((runs, n) => {
      const lines = wrap(runs, { width: w, size, align: b.align === 'justify' ? 'justify' : (b.align === 'right' ? 'right' : b.align === 'center' ? 'center' : 'left'), first: ind + hang, rest: ind + hang, fam: FAM });
      const marker = b.ordered ? `${n + 1}.` : '•';
      lines.forEach((ln, i) => {
        out.push({
          h: lh, before: i === 0 && n === 0 ? (b.before || 0) : 0, after: i === lines.length - 1 ? (n === b.items.length - 1 ? (b.after ?? 7) : (b.jedaButir ?? 2)) : 0, line: { idx: i, n: lines.length },
          draw: (x, y) => {
            const pr = textPrims(ln, x, y, lh, size, false, b.color);
            if (i === 0) pr.push({ t: 'text', x: x + ind + hang - 4 - W(marker, size), y: baseline(y, lh, size), text: marker, size, f: FAM, c: b.color });
            return pr;
          },
        });
      });
    });
    return out;
  }

  function kvPieces(b, w) {
    const size = baseSize; const lh = LH(size);
    const ind = b.indent || 0;
    const labW = Math.max(b.labelMin || 60, ...b.rows.map((r) => W(r.label, size) + 4));
    const colonW = 10;
    const out = [];
    b.rows.forEach((r, ri) => {
      const lines = wrap(r.runs, { width: w - ind - labW - colonW, size, align: 'left', fam: FAM });
      const h = Math.max(1, lines.length) * lh;
      out.push({
        h, before: 0, after: ri === b.rows.length - 1 ? (b.after ?? 6) : (b.rowGap ?? 1), line: { idx: 0, n: 1 },
        draw: (x, y) => {
          const pr = [{ t: 'text', x: x + ind, y: baseline(y, lh, size), text: r.label, size, f: FAM }, { t: 'text', x: x + ind + labW, y: baseline(y, lh, size), text: ':', size, f: FAM }];
          lines.forEach((ln, i) => pr.push(...textPrims(ln, x + ind + labW + colonW, y + i * lh, lh, size, false)));
          return pr;
        },
      });
    });
    return out;
  }

  function tablePieces(b, w) {
    const size = baseSize - 1 > 10 ? baseSize - 1 : baseSize; const lh = LH(size);
    const tw0 = w * (b.width || 1); const ox = (w - tw0) / 2;
    const sumW = b.cols.reduce((a, c) => a + c.w, 0);
    const cw = b.cols.map((c) => (c.w / sumW) * tw0);
    const PADX = 4; const PADY = 3;
    const rowFor = (cells, { head = false, bold = false } = {}) => {
      const wr = cells.map((c, ci) => wrap([{ text: String(c ?? ''), b: head || bold }], { fam: FAM, width: cw[ci] - 2 * PADX, size, align: head ? 'center' : (b.cols[ci].align === 'right' ? 'right' : b.cols[ci].align === 'center' ? 'center' : 'left') }));
      const h = Math.max(b.minRowH || 17, Math.max(...wr.map((l) => l.length || 1)) * lh + 2 * PADY);
      return {
        h, before: 0, after: 0, keepNext: false, rowOf: true, head,
        draw: (x, y) => {
          const pr = []; let cx = x + ox;
          cells.forEach((c, ci) => {
            pr.push({ t: 'rect', x: cx, y, w: cw[ci], h, fill: head ? '#E6E6E6' : null, stroke: 0.6 });
            wr[ci].forEach((ln, li) => pr.push(...textPrims(ln, cx + PADX, y + PADY + li * lh - (PADY > 0 ? 0 : 0) + ((h - 2 * PADY - wr[ci].length * lh) > 0 && !head && cells.length && b.minRowH > 20 ? 0 : 0), lh, size, false)));
            cx += cw[ci];
          });
          return pr;
        },
      };
    };
    const id = Math.random();
    const rows = [];
    let headerPiece = null;
    if (b.header) { headerPiece = rowFor(b.header, { head: true }); headerPiece.keepNext = true; headerPiece.tbl = { id }; rows.push(headerPiece); }
    b.rows.forEach((r, i) => { const p = rowFor(r, { bold: (b.boldRows || []).includes(i) }); p.tbl = { id, header: headerPiece }; rows.push(p); });
    rows[rows.length - 1].after = b.after ?? 8;
    // Baris pertama setelah header harus sejalan; baris terakhir jangan sendirian
    return rows;
  }

  // Garis pemisah kop: daftar garis (posisi tengah garis, tebal) dan tinggi total.
  const GARIS = {
    tunggal: { ls: [{ dy: 0.6, w: 1.2 }], h: 1.2 }, tipis: { ls: [{ dy: 0.3, w: 0.6 }], h: 0.6 }, tebal: { ls: [{ dy: 1.5, w: 3 }], h: 3 },
    ganda: { ls: [{ dy: 0.4, w: 0.8 }, { dy: 3, w: 0.8 }], h: 3.4 },
    'tebal-tipis': { ls: [{ dy: 1.1, w: 2.2 }, { dy: 4.2, w: 0.6 }], h: 4.5 },
    'tipis-tebal': { ls: [{ dy: 0.3, w: 0.6 }, { dy: 3.4, w: 2.2 }], h: 4.5 },
  };

  function kopPiece(b, w) {
    const jb = b.jarakBaris || 1.2;
    const sizes = b.lines.map((l) => l.size || baseSize);
    const lhs = sizes.map((s) => s * jb);
    const jr = b.lines.map((l) => Math.max(0, +l.jarak || 0));
    const boxK = b.pakaiLogo && b.slotKiri ? b.boxKiri * MM : 0;
    const boxR = b.pakaiLogo && b.slotKanan ? b.boxKanan * MM : 0;
    const gap = b.gapLogo ?? 8;
    const rata = b.rata || 'tengah';
    let leftW = boxK ? boxK + gap : 0; let rightW = boxR ? boxR + gap : 0;
    if (rata === 'tengah') { const m = Math.max(leftW, rightW); leftW = m; rightW = m; }
    const textW = w - leftW - rightW;
    const boxMax = Math.max(boxK, boxR);
    const al = rata === 'tengah' ? 'center' : rata === 'kanan' ? 'right' : 'left';
    const wr = b.lines.map((l, i) => wrap([{ text: l.text, b: l.b, i: l.i, u: l.u, color: l.color, f: l.f }], { width: textW, size: sizes[i], align: al, fam: FAM }));
    const totalH = wr.reduce((a, l, i) => a + l.length * lhs[i] + jr[i], 0);
    const H = Math.max(totalH, boxMax); const pad = Math.max(0, b.padAtas || 0); const vert = b.logoVertikal || 'tengah';
    const G0 = b.garis && b.garis.gaya !== 'none' ? (GARIS[b.garis.gaya] || GARIS['tebal-tipis']) : null;
    const sk = G0 && b.garis.tebal > 0 ? Math.min(8, Math.max(0.25, b.garis.tebal)) / Math.max(...G0.ls.map((l) => l.w)) : 1;
    const G = G0 ? { h: G0.h * sk, ls: G0.ls.map((l) => ({ dy: l.dy * sk, w: l.w * sk })) } : null;
    const jg = b.garis?.jarak ?? 4;
    return {
      h: pad + H + (G ? jg + G.h : 0) + 2, before: 0, after: b.jarakBawah ?? 10, line: null, atomic: true,
      draw: (x, y) => {
        y += pad; const pr = []; let ty = y + (H - totalH) / 2;
        wr.forEach((lines, i) => { lines.forEach((ln) => {
          const by = baseline(ty, lhs[i], sizes[i]); const L = b.lines[i];
          const ug = [];
          for (const s of ln.segs) pr.push({ t: 'text', x: x + leftW + s.x, y: by, text: s.text, b: L.b, i: L.i, f: L.f, c: L.color, size: sizes[i] });
          if (L.u && ln.segs.length) ug.push({ t: 'line', x1: x + leftW + ln.x0, y1: by + sizes[i] * 0.13, x2: x + leftW + ln.x1, y2: by + sizes[i] * 0.13, w: Math.max(0.5, sizes[i] / 24), c: L.color });
          pr.push(...ug);
          ty += lhs[i];
        }); ty += jr[i]; });
        const vy = (hh) => (vert === 'atas' ? 0 : vert === 'bawah' ? H - hh : (H - hh) / 2);
        const place = (ref, slot, box, left) => {
          if (!b.pakaiLogo || !slot || !box) return;
          const bx = left ? x : x + w - box;
          if (ref) {
            const sc = Math.min(box / ref.w, box / ref.h); const iw = ref.w * sc; const ih = ref.h * sc;
            pr.push({ t: 'img', x: bx + (box - iw) / 2, y: y + vy(ih), w: iw, h: ih, dataUrl: ref.dataUrl, mime: ref.mime });
          } else pr.push({ t: 'ph', x: bx, y: y + vy(box), w: box, h: box, label: 'Logo' });
        };
        place(b.kiri, b.slotKiri, boxK, true); place(b.kanan, b.slotKanan, boxR, false);
        if (G) for (const l of G.ls) { const ly = y + H + jg + l.dy; pr.push({ t: 'line', x1: x, y1: ly, x2: x + w, y2: ly, w: l.w, c: b.garis.warna }); }
        return pr;
      },
    };
  }

  const joinPieces = (arr, w, opt = {}) => {
    if (!arr.length) return null;
    const offs = []; let y = 0;
    arr.forEach((p, i) => { const gap = i === 0 ? 0 : Math.max(arr[i - 1].after || 0, p.before || 0); y += gap; offs.push(y); y += p.h; });
    return {
      h: y, before: arr[0].before || 0, after: arr[arr.length - 1].after || 0, atomic: true,
      draw: (x, yy) => arr.flatMap((p, i) => p.draw(x, yy + offs[i])),
      pieces: arr, keepNext: opt.keepNext,
    };
  };

  function stack(blocks, w) {
    const all = [];
    for (const b of blocks) all.push(...blockPieces(b, w));
    return all;
  }

  function colsPiece(b, w) {
    const xs = []; const ws = []; let x = 0;
    b.widths.forEach((f) => { xs.push(x); ws.push(f * w); x += f * w; });
    const gutter = b.gap || 0;
    const cols = b.cols.map((blocks, i) => joinPieces(stack(blocks, ws[i] - gutter), ws[i] - gutter));
    const h = Math.max(0, ...cols.map((c) => (c ? c.h : 0)));
    return {
      h, before: 0, after: b.after ?? 6, atomic: true,
      draw: (x0, y) => cols.flatMap((c, i) => (c ? c.draw(x0 + xs[i], y) : [])),
    };
  }

  // Letak gambar tanda tangan dan stempel di dalam ruang tanda tangan (stempel digambar lebih dulu, di bawah tanda tangan).
  function ttdGambar(b, w) {
    const out = [];
    for (const g of [b.stempel, b.gambar]) {
      if (!g) continue;
      const pct = Math.min(250, Math.max(20, +g.ukuran || 100)) / 100;
      const sc = Math.min((w * 0.7) / g.w, (b.h * 0.92) / g.h) * pct; const iw = g.w * sc; const ih = g.h * sc;
      out.push({ g, x: (w - iw) / 2 + (+g.gx || 0) * MM, y: (b.h - ih) / 2 + (+g.gy || 0) * MM, w: iw, h: ih });
    }
    return out;
  }

  function blockPieces(b, w) {
    switch (b.type) {
      case 'p': return paraPieces(b, w);
      case 'list': return listPieces(b, w);
      case 'kv': return kvPieces(b, w);
      case 'table': return tablePieces(b, w);
      case 'kop': return [kopPiece(b, w)];
      case 'arab': {
        const g = b.gambar; const sc = Math.min(1, w / g.w); const iw = g.w * sc; const ih = g.h * sc;
        return [{ h: ih, before: b.before || 0, after: b.after ?? 6, atomic: true, draw: (x, y) => [{ t: 'img', x: x + (b.align === 'left' ? 0 : b.align === 'right' ? w - iw : (w - iw) / 2), y, w: iw, h: ih, dataUrl: g.dataUrl, mime: g.mime }] }];
      }
      case 'indent': { const ki = Math.max(0, b.kiri || 0); return stack(b.blocks, w - ki - Math.max(0, b.kanan || 0)).map((p) => ({ ...p, draw: (x, y) => p.draw(x + ki, y) })); }
      case 'spacer': return [{ h: b.h, before: 0, after: 0, draw: () => [] }];
      case 'pb': return [{ h: 0, before: 0, after: 0, pb: true, draw: () => [] }];
      case 'cols': return [colsPiece(b, w)];
      case 'ttdspace': return [{
        h: b.h, before: 0, after: 0, draw: (x, y) => ttdGambar(b, w).map((r) => ({ t: 'img', x: x + r.x, y: y + r.y, w: r.w, h: r.h, dataUrl: r.g.dataUrl, mime: r.g.mime })),
      }];
      case 'group': {
        const ps = stack(b.blocks, w);
        const j = joinPieces(ps, w);
        if (!j) return [];
        if (j.h > contentH * 0.92) return ps;
        // tidak boleh menggantung sendirian: tempel ke blok sebelumnya bila perlu (ditangani paginate via keepWithPrev)
        j.keepWithPrev = true;
        return [j];
      }
      default: return [];
    }
  }

  // ---------- Paginasi ----------
  const pieces = stack(doc.blocks, contentW);
  const bottom = paper.h - margins.bottom;
  const pages = [{ prims: [] }];
  let y = margins.top; let prevAfter = 0; let atTop = true; let lastTbl = null;
  const place = (p, gap) => {
    y += gap;
    const pr = p.draw(margins.left, y);
    pages[pages.length - 1].prims.push(...pr);
    y += p.h; prevAfter = p.after || 0; atTop = false; lastTbl = p.tbl ? p.tbl.id : null;
  };
  for (let i = 0; i < pieces.length; i++) {
    const p = pieces[i]; const nx = pieces[i + 1];
    if (p.pb) { if (!atTop) { pages.push({ prims: [] }); y = margins.top; prevAfter = 0; atTop = true; lastTbl = null; pages[pages.length - 1].__lastLine = null; } continue; }
    let gap = atTop ? 0 : Math.max(prevAfter, p.before || 0);
    let need = gap + p.h;
    if (p.keepNext && nx) need += Math.max(p.after || 0, nx.before || 0) + nx.h;
    if (p.line && p.line.n >= 3) {
      if (p.line.idx === 0 && nx) need += nx.h; // yatim: minimal 2 baris di bawah
      if (p.line.idx === p.line.n - 2 && nx) need += nx.h; // janda: minimal 2 baris di atas
    }
    if (p.keepWithPrev && !atTop && p.h < contentH * 0.8) { /* grup tanda tangan: sertakan 2 baris terakhir paragraf sebelumnya */
      const prev = pieces[i - 1];
      if (prev && prev.line && y + need > bottom + 0.01 && prev.line.idx >= 1) {
        // tarik baris terakhir paragraf ke halaman berikut agar tanda tangan tidak sendirian
        const last = pages[pages.length - 1];
        const cut = last.__lastLine;
        if (cut && cut.prims.length) { last.prims.splice(last.prims.length - cut.prims.length, cut.prims.length); y = cut.y; pages.push({ prims: [] }); const pg = pages[pages.length - 1]; y = margins.top; atTop = true; prevAfter = 0; pg.prims.push(...cut.draw(margins.left, y)); y += cut.h; prevAfter = cut.after || 0; atTop = false; gap = Math.max(prevAfter, p.before || 0); need = gap + p.h; }
      }
    }
    if (!atTop && y + need > bottom + 0.01) {
      pages.push({ prims: [] }); y = margins.top; prevAfter = 0; atTop = true; gap = 0;
      if (p.tbl && !p.head && p.tbl.header && lastTbl === p.tbl.id) { place(p.tbl.header, 0); }
      else if (p.tbl && !p.head && p.tbl.header && lastTbl !== p.tbl.id) { /* tabel baru: tanpa pengulangan */ }
    }
    const pgBefore = pages[pages.length - 1].prims.length;
    const yBefore = y;
    place(p, gap);
    if (p.line) pages[pages.length - 1].__lastLine = { prims: pages[pages.length - 1].prims.slice(pgBefore), y: yBefore, h: p.h, after: p.after, draw: p.draw };
    else pages[pages.length - 1].__lastLine = null;
  }
  // Buang halaman kosong di akhir
  while (pages.length > 1 && !pages[pages.length - 1].prims.length) pages.pop();
  pages.forEach((pg) => { delete pg.__lastLine; });
  // Nomor halaman (mulai halaman ke-2) di tengah margin bawah.
  if (pages.length > 1) {
    pages.forEach((pg, i) => {
      if (i === 0) return;
      const txt = `Halaman ${i + 1} dari ${pages.length}`; const sz = 10;
      const wd = W(txt, sz);
      pg.prims.push({ t: 'text', x: (paper.w - wd) / 2, y: paper.h - Math.min(margins.bottom / 2, 28) + sz / 3, text: txt, size: sz, f: FAM, nomorHal: true });
    });
  }
  if (doc.dekor) pages.forEach((pg, i) => { if (i === 0 || doc.dekor.semua) pg.prims.unshift({ t: 'img', x: 0, y: 0, w: paper.w, h: paper.h, dataUrl: doc.dekor.png, mime: 'image/png', bg: true }); });
  return { pages, paper, margins };
}
