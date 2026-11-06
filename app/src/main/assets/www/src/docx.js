// Ekspor Word (.docx) asli dari model dokumen yang sama dengan pratinjau.
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, ImageRun,
  ShadingType, Footer, Header, PageNumber, HeightRule, VerticalAlign, TableLayoutType, PageBreak,
  HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom, TextWrappingType,
} from 'docx';
import { width as tw, KELUARGA, fam as famOk } from './fonts.js';
import { dataUrlToBytes } from './util.js';

const MM = 72 / 25.4;
const tw20 = (pt) => Math.round(pt * 20);
const px = (pt) => Math.round(pt * 96 / 72);
const NOB = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const NOBORDERS = { top: NOB, bottom: NOB, left: NOB, right: NOB, insideHorizontal: NOB, insideVertical: NOB };
const CELLNOB = { top: NOB, bottom: NOB, left: NOB, right: NOB };
const AL = { left: AlignmentType.LEFT, center: AlignmentType.CENTER, right: AlignmentType.RIGHT, justify: AlignmentType.JUSTIFIED };

export async function buatDocx(doc, { judul = 'Dokumen' } = {}) {
  const contentW = doc.paper.w - doc.margins.left - doc.margins.right;
  const sz = doc.size;
  const FAM = famOk(doc.fam);
  const lineRel = Math.round((doc.spacing / 1.15) * 240);
  const lineDari = (sp) => Math.round(((sp || doc.spacing) / 1.15) * 240);
  const fontDocx = (f) => { const k = famOk(f || FAM); return doc.fontWord && k !== 'm' ? doc.fontWord : KELUARGA[k].docx; };
  const warna = (c) => (/^#[0-9a-fA-F]{6}$/.test(c || '') ? c.slice(1).toUpperCase() : undefined);

  const runsToDocx = (runs, size, extra = {}) => {
    const out = [];
    for (const r of runs) {
      const parts = String(r.text).split('\n');
      parts.forEach((p, i) => out.push(new TextRun({ text: p, bold: !!(r.b || extra.b), italics: !!r.i, underline: (r.u || r.ul || extra.ul) ? {} : undefined, color: warna(r.color || extra.color), font: fontDocx(r.f || extra.f), size: Math.round(size * 2), break: i > 0 ? 1 : undefined })));
    }
    return out;
  };

  const para = (b, o = {}) => new Paragraph({
    alignment: AL[b.align || 'left'],
    keepNext: !!(b.keepNext || o.keepNext),
    keepLines: true,
    indent: { firstLine: b.noIndent ? 0 : tw20(b.indent || 0), left: (o.left || b.kiri || o.geser) ? tw20((o.left || 0) + (b.kiri || 0) + (o.geser || 0)) : undefined, right: o.geserR ? tw20(o.geserR) : undefined },
    spacing: { before: tw20(b.before || 0), after: tw20(b.after || 0), line: lineDari(b.spasi), lineRule: 'auto' },
    children: runsToDocx(b.runs, b.size || sz, { ul: b.ul, color: b.color }),
  });

  const imageRun = (img, wPt, hPt) => new ImageRun({ type: img.mime === 'image/jpeg' ? 'jpg' : 'png', data: dataUrlToBytes(img.dataUrl), transformation: { width: px(wPt), height: px(hPt) }, altText: { title: 'gambar', description: 'gambar', name: 'gambar' } });

  const spacerPara = (h) => new Paragraph({ spacing: { before: 0, after: 0, line: Math.max(20, tw20(h)), lineRule: HeightRule.EXACT }, children: [] });
  const afterPara = (h) => new Paragraph({ spacing: { before: 0, after: tw20(h), line: 20, lineRule: HeightRule.EXACT }, children: [new TextRun({ text: '', size: 2 })] });

  function convert(b, w, ctx = {}) {
    switch (b.type) {
      case 'p': return [para(b, ctx)];
      case 'spacer': return [spacerPara(b.h)];
      case 'pb': return [new Paragraph({ spacing: { before: 0, after: 0, line: 20, lineRule: HeightRule.EXACT }, children: [new PageBreak()] })];
      case 'ttdspace': {
        // Gambar mengambang agar ukuran dan posisinya sama dengan pratinjau; paragraf menjaga tinggi ruang tanda tangan.
        const imgs = [];
        for (const g of [b.stempel, b.gambar]) {
          if (!g) continue;
          const pct = Math.min(250, Math.max(20, +g.ukuran || 100)) / 100;
          const sc = Math.min((w * 0.7) / g.w, (b.h * 0.92) / g.h) * pct; const iw = g.w * sc; const ih = g.h * sc;
          const x = (w - iw) / 2 + (+g.gx || 0) * MM; const y = (b.h - ih) / 2 + (+g.gy || 0) * MM;
          imgs.push(new ImageRun({ type: g.mime === 'image/jpeg' ? 'jpg' : 'png', data: dataUrlToBytes(g.dataUrl), transformation: { width: px(iw), height: px(ih) }, altText: { title: 'gambar', description: 'gambar', name: 'gambar' },
            floating: { horizontalPosition: { relative: HorizontalPositionRelativeFrom.COLUMN, offset: Math.round(x * 12700) }, verticalPosition: { relative: VerticalPositionRelativeFrom.PARAGRAPH, offset: Math.round(y * 12700) }, behindDocument: g === b.stempel, allowOverlap: true, wrap: { type: TextWrappingType.NONE } } }));
        }
        return [new Paragraph({ keepNext: true, spacing: { before: 0, after: 0, line: tw20(b.h), lineRule: HeightRule.EXACT }, children: imgs })];
      }
      case 'list': {
        const ind = b.indent || 0; const hang = b.hang || 18;
        return b.items.map((runs, n) => new Paragraph({
          alignment: AL[b.align || 'left'],
          indent: { left: tw20(ind + hang + (ctx.geser || 0)), right: ctx.geserR ? tw20(ctx.geserR) : undefined, hanging: tw20(hang) },
          tabStops: [{ type: 'left', position: tw20(ind + hang) }],
          spacing: { before: n === 0 ? tw20(b.before || 0) : 0, after: tw20(n === b.items.length - 1 ? (b.after ?? 7) : 2), line: lineDari(b.spasi), lineRule: 'auto' },
          children: [new TextRun({ text: (b.ordered ? `${n + 1}.` : '•') + '\t', size: Math.round((b.size || sz) * 2), color: warna(b.color), font: fontDocx() }), ...runsToDocx(runs, b.size || sz, { color: b.color })],
        }));
      }
      case 'kv': {
        const ind = b.indent || 0;
        const labW = Math.max(b.labelMin || 60, ...b.rows.map((r) => tw(r.label, { f: FAM }, sz) + 4));
        const colonW = 10; const restW = w - ind - labW - colonW;
        const cell = (width, children) => new TableCell({ width: { size: tw20(width), type: WidthType.DXA }, borders: CELLNOB, margins: { top: 0, bottom: 0, left: 0, right: 0 }, children });
        const rows = b.rows.map((r, i) => {
          const after = i === b.rows.length - 1 ? 0 : (b.rowGap ?? 1);
          const mk = (runs, al = 'left') => new Paragraph({ alignment: AL[al], spacing: { before: 0, after: tw20(after), line: lineRel, lineRule: 'auto' }, keepNext: i < b.rows.length - 1, children: runsToDocx(runs, sz) });
          return new TableRow({ cantSplit: true, children: [cell(labW, [mk([{ text: r.label }])]), cell(colonW, [mk([{ text: ':' }])]), cell(restW, [mk(r.runs)])] });
        });
        return [new Table({ rows, width: { size: tw20(w - ind), type: WidthType.DXA }, columnWidths: [tw20(labW), tw20(colonW), tw20(restW)], indent: { size: tw20(ind + (ctx.geser || 0)), type: WidthType.DXA }, borders: NOBORDERS, layout: TableLayoutType.FIXED }), afterPara(b.after ?? 6)];
      }
      case 'table': {
        const size = sz - 1 > 10 ? sz - 1 : sz;
        const tw0 = w * (b.width || 1);
        const sum = b.cols.reduce((a, c) => a + c.w, 0);
        const cw = b.cols.map((c) => (c.w / sum) * tw0);
        const bd = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
        const borders = { top: bd, bottom: bd, left: bd, right: bd };
        const mkRow = (cells, { head = false, bold = false } = {}) => new TableRow({
          cantSplit: true, tableHeader: head, height: { value: tw20(b.minRowH || 17), rule: HeightRule.ATLEAST },
          children: cells.map((c, ci) => new TableCell({
            width: { size: tw20(cw[ci]), type: WidthType.DXA }, borders, verticalAlign: VerticalAlign.CENTER,
            margins: { top: 40, bottom: 40, left: 80, right: 80 },
            shading: head ? { type: ShadingType.CLEAR, fill: 'E6E6E6', color: 'auto' } : undefined,
            children: [new Paragraph({ alignment: head ? AlignmentType.CENTER : AL[b.cols[ci].align === 'right' ? 'right' : b.cols[ci].align === 'center' ? 'center' : 'left'], spacing: { before: 0, after: 0, line: lineRel, lineRule: 'auto' }, children: runsToDocx([{ text: String(c ?? '') }], size, { b: head || bold }) })],
          })),
        });
        const rows = [];
        if (b.header) rows.push(mkRow(b.header, { head: true }));
        b.rows.forEach((r, i) => rows.push(mkRow(r, { bold: (b.boldRows || []).includes(i) })));
        return [new Table({ rows, width: { size: tw20(tw0), type: WidthType.DXA }, columnWidths: cw.map(tw20), ...(ctx.geser ? { indent: { size: tw20(ctx.geser + (w - tw0) / 2), type: WidthType.DXA } } : { alignment: AlignmentType.CENTER }), layout: TableLayoutType.FIXED }), afterPara(b.after ?? 8)];
      }
      case 'cols': {
        const cws = b.widths.map((f) => f * w);
        const cells = b.cols.map((blocks, i) => new TableCell({
          width: { size: tw20(cws[i]), type: WidthType.DXA }, borders: CELLNOB, margins: { top: 0, bottom: 0, left: 0, right: 0 },
          children: (() => { const ch = blocks.flatMap((x) => convert(x, cws[i], { keepNext: !!b.keepTogether })); return ch.length ? ch : [new Paragraph({ children: [] })]; })(),
        }));
        return [new Table({ rows: [new TableRow({ cantSplit: true, children: cells })], width: { size: tw20(w), type: WidthType.DXA }, columnWidths: cws.map(tw20), borders: NOBORDERS, layout: TableLayoutType.FIXED }), afterPara(b.after ?? 6)];
      }
      case 'indent': return b.blocks.flatMap((x) => convert(x, w - (b.kiri || 0) - (b.kanan || 0), { ...ctx, geser: (ctx.geser || 0) + (b.kiri || 0), geserR: (ctx.geserR || 0) + (b.kanan || 0) }));
      case 'group': {
        const out = [];
        b.blocks.forEach((x, i) => out.push(...convert(x, w, { keepNext: i < b.blocks.length - 1 || true })));
        return out;
      }
      case 'arab': {
        const g = b.gambar; const sc = Math.min(1, w / g.w);
        return [new Paragraph({ alignment: b.align === 'left' ? AlignmentType.LEFT : b.align === 'right' ? AlignmentType.RIGHT : AlignmentType.CENTER, keepNext: !!ctx.keepNext, indent: ctx.geser || ctx.geserR ? { left: tw20(ctx.geser || 0), right: tw20(ctx.geserR || 0) } : undefined, spacing: { before: tw20(b.before || 0), after: tw20(b.after ?? 6) }, children: [imageRun(g, g.w * sc, g.h * sc)] })];
      }
      case 'kop': return kop(b, w);
      default: return [];
    }
  }

  const GARIS = {
    tunggal: { style: BorderStyle.SINGLE, size: 10 }, tipis: { style: BorderStyle.SINGLE, size: 4 }, tebal: { style: BorderStyle.SINGLE, size: 24 },
    ganda: { style: BorderStyle.DOUBLE, size: 6 }, 'tebal-tipis': { style: BorderStyle.THICK_THIN_SMALL_GAP, size: 12 }, 'tipis-tebal': { style: BorderStyle.THIN_THICK_SMALL_GAP, size: 12 },
  };
  function kop(b, w) {
    const boxK = b.pakaiLogo && b.slotKiri ? b.boxKiri * MM : 0; const boxR = b.pakaiLogo && b.slotKanan ? b.boxKanan * MM : 0;
    const gap = b.gapLogo ?? 8; const rata = b.rata || 'tengah';
    let leftW = boxK ? boxK + gap : 0; let rightW = boxR ? boxR + gap : 0;
    if (rata === 'tengah') { const m = Math.max(leftW, rightW); leftW = m; rightW = m; }
    const mid = w - leftW - rightW;
    const imgPara = (ref, box, al) => {
      if (!ref) return new Paragraph({ children: [] });
      const sc = Math.min(box / ref.w, box / ref.h);
      return new Paragraph({ alignment: al, children: [imageRun(ref, ref.w * sc, ref.h * sc)] });
    };
    const jb = b.jarakBaris || 1.2;
    const al = rata === 'kanan' ? AlignmentType.RIGHT : rata === 'kiri' ? AlignmentType.LEFT : AlignmentType.CENTER;
    const textParas = b.lines.map((l) => new Paragraph({ alignment: al, spacing: { before: 0, after: tw20(l.jarak || 0), line: tw20((l.size || sz) * jb), lineRule: HeightRule.EXACT }, children: [new TextRun({ text: l.text, bold: !!l.b, italics: !!l.i, underline: l.u ? {} : undefined, color: warna(l.color), font: fontDocx(l.f), size: Math.round((l.size || sz) * 2) })] }));
    if (!textParas.length) textParas.push(new Paragraph({ children: [] }));
    const vaLogo = b.logoVertikal === 'atas' ? VerticalAlign.TOP : b.logoVertikal === 'bawah' ? VerticalAlign.BOTTOM : VerticalAlign.CENTER;
    const cell = (width, children, va) => new TableCell({ width: { size: tw20(width), type: WidthType.DXA }, borders: CELLNOB, verticalAlign: va || VerticalAlign.CENTER, margins: { top: 0, bottom: 0, left: 0, right: 0 }, children });
    const cells = []; const cws = [];
    if (leftW) { cells.push(cell(leftW, [imgPara(b.kiri, boxK, AlignmentType.LEFT)], vaLogo)); cws.push(leftW); }
    cells.push(cell(mid, textParas)); cws.push(mid);
    if (rightW) { cells.push(cell(rightW, [imgPara(b.kanan, boxR, AlignmentType.RIGHT)], vaLogo)); cws.push(rightW); }
    const t = new Table({ rows: [new TableRow({ cantSplit: true, children: cells })], width: { size: tw20(w), type: WidthType.DXA }, columnWidths: cws.map(tw20), borders: NOBORDERS, layout: TableLayoutType.FIXED });
    const G0 = b.garis && b.garis.gaya !== 'none' ? (GARIS[b.garis.gaya] || GARIS['tebal-tipis']) : null;
    const MAXW = { tunggal: 1.2, tipis: 0.6, tebal: 3, ganda: 0.8, 'tebal-tipis': 2.2, 'tipis-tebal': 2.2 };
    const sk = G0 && b.garis.tebal > 0 ? Math.min(8, Math.max(0.25, b.garis.tebal)) / (MAXW[b.garis.gaya] || 2.2) : 1;
    const G = G0 ? { ...G0, size: Math.min(96, Math.max(2, Math.round(G0.size * sk))) } : null;
    const line = new Paragraph({
      spacing: { before: tw20(G ? (b.garis.jarak ?? 4) : 0), after: tw20(b.jarakBawah ?? 10), line: 20, lineRule: HeightRule.EXACT },
      border: G ? { bottom: { ...G, space: 0, color: (warna(b.garis.warna) || '000000') } } : undefined,
      children: [new TextRun({ text: '', size: 2 })],
    });
    const padP = b.padAtas > 0 ? [new Paragraph({ spacing: { before: 0, after: 0, line: Math.max(20, tw20(b.padAtas)), lineRule: HeightRule.EXACT }, children: [] })] : [];
    return [...padP, t, line];
  }

  const children = [];
  for (const b of doc.blocks) children.push(...convert(b, contentW));
  // Dokumen Word tidak boleh berakhir dengan tabel.
  // Paragraf penutup setelah tabel tidak diberi jarak bawah agar tidak mendorong halaman kosong.
  if (children.length > 1 && children[children.length - 2] instanceof Table && children[children.length - 1] instanceof Paragraph) children[children.length - 1] = afterPara(0);
  const footer = new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Halaman ', size: 20, font: fontDocx() }), new TextRun({ children: [PageNumber.CURRENT], size: 20, font: fontDocx() }), new TextRun({ text: ' dari ', size: 20, font: fontDocx() }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 20, font: fontDocx() })] })] });
  const empty = new Footer({ children: [new Paragraph({ children: [] })] });
  // Dekorasi halaman: gambar latar (di belakang teks) yang ditempel pada halaman melalui header.
  const kecil = () => new Paragraph({ spacing: { before: 0, after: 0, line: 20, lineRule: HeightRule.EXACT }, children: [] });
  const latar = () => new Paragraph({ spacing: { before: 0, after: 0, line: 20, lineRule: HeightRule.EXACT }, children: [new ImageRun({ type: 'png', data: dataUrlToBytes(doc.dekor.png), transformation: { width: px(doc.paper.w), height: px(doc.paper.h) }, altText: { title: 'dekorasi', description: 'dekorasi halaman', name: 'dekorasi' },
    floating: { horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: 0 }, verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: 0 }, behindDocument: true, allowOverlap: true, wrap: { type: TextWrappingType.NONE } } })] });
  const headers = doc.dekor ? { default: new Header({ children: [doc.dekor.semua ? latar() : kecil()] }), first: new Header({ children: [latar()] }) } : undefined;
  const d = new Document({
    creator: 'SURATKU', title: judul, description: 'Dibuat dengan SURATKU',
    styles: { default: { document: { run: { font: fontDocx(), size: Math.round(sz * 2) } } } },
    sections: [{
      properties: {
        titlePage: true,
        page: { size: { width: tw20(doc.paper.w), height: tw20(doc.paper.h) }, margin: { top: tw20(doc.margins.top), bottom: tw20(doc.margins.bottom), left: tw20(doc.margins.left), right: tw20(doc.margins.right), footer: tw20(Math.min(doc.margins.bottom / 2, 28)) } },
      },
      ...(headers ? { headers } : {}),
      footers: { default: footer, first: empty },
      children,
    }],
  });
  return Packer.toBlob(d);
}
