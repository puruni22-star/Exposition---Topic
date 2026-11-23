// 바이블웍스 10 기본 가이드 — Word 문서 생성 (docx-js)
// 사용: node build_docx.js <출력경로.docx>
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType,
  ShadingType, BorderStyle, Footer, Header, PageNumber, TableLayoutType, VerticalAlign, PageBreak,
  ExternalHyperlink,
} = require("docx");
const { meta, chapters, cheatsheet } = require("./content.js");

const FONT = "Malgun Gothic";
const MONO = "Consolas";
const C = {
  navy: "1B3A6B", navy2: "2A5298", navySoft: "EEF3FA", gold: "B8860B", goldSoft: "FBF4E2",
  green: "2E6B3A", greenSoft: "EDF5EC", red: "A6402F", redSoft: "FBEDEA",
  ink: "1E2430", muted: "5D6675", line: "D9DEE6", code: "F1EFE9", white: "FFFFFF",
};
const W = 9638; // A4 본문 폭(twip, 좌우 여백 2cm)
const f = (name) => ({ ascii: name, eastAsia: FONT, hAnsi: name, cs: name });

// `백틱` 구간을 고정폭 강조 run으로 나눈다
function rich(text, o = {}) {
  const parts = String(text).split(/`([^`]+)`/);
  return parts.map((s, i) => !s ? null : i % 2
    ? new TextRun({ text: ` ${s} `, font: f(MONO), size: (o.size || 21) - 1, bold: true, color: C.navy, shading: { type: ShadingType.CLEAR, color: "auto", fill: C.code } })
    : new TextRun({ text: s, font: f(FONT), size: o.size || 21, bold: o.bold, color: o.color || C.ink })).filter(Boolean);
}
const run = (text, o = {}) => new TextRun({ text, font: f(o.mono ? MONO : FONT), size: o.size || 21, bold: o.bold, color: o.color || C.ink, characterSpacing: o.spacing });
const para = (children, o = {}) => new Paragraph({
  children, alignment: o.align || AlignmentType.LEFT,
  spacing: { before: o.before ?? 0, after: o.after ?? 140, line: o.line || 340 },
  keepNext: o.keepNext, keepLines: true, indent: o.indent, border: o.border,
});
const gap = (after = 160) => new Paragraph({ children: [], spacing: { before: 0, after } });
const bd = (color, size = 4) => ({ style: BorderStyle.SINGLE, size, color });
const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const allNone = { top: none, bottom: none, left: none, right: none };

function cell(children, o = {}) {
  return new TableCell({
    children, width: { size: o.width, type: WidthType.DXA },
    shading: o.fill ? { type: ShadingType.CLEAR, color: "auto", fill: o.fill } : undefined,
    margins: { top: o.padY ?? 100, bottom: o.padY ?? 100, left: o.padX ?? 160, right: o.padX ?? 160 },
    borders: o.borders, verticalAlign: o.vAlign || VerticalAlign.TOP, columnSpan: o.span,
  });
}
const table = (rows, cols, o = {}) => new Table({
  width: { size: W, type: WidthType.DXA }, columnWidths: cols, layout: TableLayoutType.FIXED,
  borders: o.borders, rows,
});

// ── 블록 렌더러 ──
function dataTable(b) {
  const cols = b.widths.map((p) => Math.round((W * p) / 100));
  cols[cols.length - 1] = W - cols.slice(0, -1).reduce((a, x) => a + x, 0);
  const borders = { top: bd(C.line), bottom: bd(C.line), left: bd(C.line), right: bd(C.line) };
  const head = new TableRow({ tableHeader: true, cantSplit: true, children: b.head.map((h, i) => cell(
    [para(rich(h, { bold: true, color: C.navy, size: 20 }), { after: 0, line: 300 })], { width: cols[i], fill: C.navySoft, borders })) });
  const rows = b.rows.map((r) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(
    [para(rich(c, { size: 20, bold: i === 0 }), { after: 0, line: 300 })], { width: cols[i], borders })) }));
  return [table([head, ...rows], cols), gap(200)];
}

function cmdTable(b) {
  const cols = [2600, W - 2600];
  const rows = b.rows.map(([c, d]) => new TableRow({ cantSplit: true, children: [
    cell([para([run(c, { mono: true, bold: true, color: C.navy, size: 21 })], { after: 0, line: 300 })],
      { width: cols[0], fill: C.code, borders: { ...allNone, bottom: bd(C.white, 8) }, vAlign: VerticalAlign.CENTER }),
    cell([para(rich(d, { size: 20 }), { after: 0, line: 300 })],
      { width: cols[1], borders: { ...allNone, bottom: bd(C.line) }, vAlign: VerticalAlign.CENTER }),
  ] }));
  return [table(rows, cols, { borders: { top: bd(C.line), bottom: bd(C.line), left: none, right: none, insideHorizontal: none, insideVertical: none } }), gap(200)];
}

function noteBox(b) {
  const sty = { tip: [C.green, C.greenSoft, "도움말"], warn: [C.red, C.redSoft, "주의"], key: [C.gold, C.goldSoft, "핵심"] }[b.t];
  const [color, fill, label] = sty;
  return [table([new TableRow({ cantSplit: true, children: [cell([
    para([run(`${label}  `, { bold: true, color, size: 18, spacing: 20 }), run(b.title, { bold: true, size: 22, color: C.ink })], { after: 80, line: 320 }),
    para(rich(b.text, { size: 20, color: C.ink }), { after: 0, line: 330 }),
  ], { width: W, fill, padY: 180, padX: 260, borders: { top: none, bottom: none, right: none, left: bd(color, 24) } })] })], [W]), gap(220)];
}

function steps(b) {
  const cols = [620, W - 620];
  const rows = b.items.map((it, i) => new TableRow({ cantSplit: true, children: [
    cell([para([run(String(i + 1), { bold: true, color: C.white, size: 19 })], { align: AlignmentType.CENTER, after: 0, line: 280 })],
      { width: cols[0], fill: C.navy, padY: 70, padX: 60, borders: { ...allNone, bottom: bd(C.white, 12) }, vAlign: VerticalAlign.CENTER }),
    cell([para(rich(it, { size: 21 }), { after: 0, line: 320 })],
      { width: cols[1], padY: 90, padX: 220, borders: { ...allNone, bottom: bd(C.line) }, vAlign: VerticalAlign.CENTER }),
  ] }));
  return [table(rows, cols, { borders: { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none } }), gap(220)];
}

function block(b) {
  switch (b.t) {
    case "p": return [para(rich(b.text, { size: 21 }), { after: 160, line: 360 })];
    case "h": return [para([run("▍", { color: C.gold, size: 24, bold: true }), run(b.text, { bold: true, size: 24, color: C.navy })], { before: 260, after: 120, keepNext: true })];
    case "list": return b.items.map((it) => para([run("✓  ", { color: C.green, bold: true }), ...rich(it, { size: 21 })], { indent: { left: 360, hanging: 360 }, after: 100 }));
    case "table": return dataTable(b);
    case "cmd": return cmdTable(b);
    case "steps": return steps(b);
    case "tip": case "warn": case "key": return noteBox(b);
    default: throw new Error("unknown " + b.t);
  }
}

// ── 표지 ──
const cover = [
  gap(1500),
  para([run(meta.series, { color: C.gold, bold: true, size: 22, spacing: 40 })], { after: 240 }),
  para([run("바이블웍스 10", { bold: true, size: 64, color: C.navy })], { after: 80, line: 600 }),
  para([run("기본 사용 가이드", { bold: true, size: 64, color: C.navy })], { after: 360, line: 600,
    border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: C.gold, space: 18 } } }),
  para([run(meta.subtitle, { size: 26, color: C.muted })], { after: 2600 }),
  table([new TableRow({ children: [cell([
    para([run("이 안내서는", { bold: true, color: C.navy, size: 20 })], { after: 80 }),
    para([run("바이블웍스를 처음 쓰는 분도 순서대로 따라 하기만 하면 설교 준비와 원어 연구의 기본기를 갖출 수 있도록 구성했습니다.", { size: 20 })], { after: 0, line: 320 }),
  ], { width: W, fill: C.navySoft, padY: 220, padX: 300, borders: { ...allNone, left: bd(C.navy, 24) } })] })], [W]),
  gap(400),
  para([run(`${meta.editor} 정리  ·  ${meta.date}`, { size: 19, color: C.muted })], { after: 60 }),
  para([run(meta.source, { size: 17, color: C.muted })], { after: 0 }),
  new Paragraph({ children: [new PageBreak()] }),
];

// ── 들어가며 + 차례 ──
const front = [
  para([run("들어가며", { bold: true, size: 36, color: C.navy })], { after: 240 }),
  ...meta.intro.map((t) => para(rich(t, { size: 22 }), { after: 200, line: 380 })),
  gap(120),
  ...dataTable({ head: ["표시", "읽는 법"], widths: [24, 76], rows: meta.howto }),
  para([run("차례", { bold: true, size: 30, color: C.navy })], { before: 300, after: 160 }),
  table([...chapters.map((c) => ({ no: c.no, title: c.title })), { no: "+", title: cheatsheet.title }].map((c) => new TableRow({ children: [
    cell([para([run(c.no, { bold: true, color: C.gold, size: 22, mono: true })], { after: 0 })], { width: 900, borders: { ...allNone, bottom: bd(C.line) }, padY: 90 }),
    cell([para([run(c.title, { size: 22 })], { after: 0 })], { width: W - 900, borders: { ...allNone, bottom: bd(C.line) }, padY: 90 }),
  ] })), [900, W - 900], { borders: { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none } }),
];

const sourceBox = table([new TableRow({ cantSplit: true, children: [cell([
  para([run("출처 및 안내", { bold: true, size: 19, color: C.navy })], { after: 60 }),
  para([run(meta.source, { size: 18, color: C.muted })], { after: 40 }),
  para([new ExternalHyperlink({ link: meta.sourceUrl, children: [new TextRun({ text: meta.sourceUrl, font: f(FONT), size: 18, color: C.navy2, underline: {} })] })], { after: 60 }),
  para([run("원 강의 내용을 바탕으로 누구나 따라 할 수 있도록 재구성·정리했습니다. 메뉴 이름은 프로그램 버전과 설정에 따라 조금 다를 수 있습니다.", { size: 18, color: C.muted })], { after: 0, line: 300 }),
], { width: W, fill: "F7F7F5", padY: 200, padX: 260, borders: allNone })] })], [W]);


// ── 장 ──
function chapterHead(no, kicker, title) {
  return [
    new Paragraph({ children: [new PageBreak()] }),
    table([new TableRow({ children: [
      cell([para([run(no, { bold: true, size: 40, color: C.white })], { align: AlignmentType.CENTER, after: 0, line: 300 })],
        { width: 1100, fill: C.navy, vAlign: VerticalAlign.CENTER, padY: 160, borders: allNone }),
      cell([
        para([run(kicker, { bold: true, size: 17, color: C.gold, spacing: 30, mono: true })], { after: 40, line: 260 }),
        para([run(title, { bold: true, size: 34, color: C.navy })], { after: 0, line: 380 }),
      ], { width: W - 1100, padX: 300, vAlign: VerticalAlign.CENTER, borders: { ...allNone, bottom: bd(C.navy, 12) } }),
    ] })], [1100, W - 1100], { borders: { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none } }),
    gap(240),
  ];
}

const body = [];
for (const c of chapters) {
  body.push(...chapterHead(c.no, `CHAPTER ${c.no}`, c.title));
  body.push(para(rich(c.lead, { size: 23, color: C.muted }), { after: 220, line: 380 }));
  for (const b of c.blocks) body.push(...block(b));
  if (c.id === "closing") body.push(gap(200), sourceBox);
}

// ── 부록 ──
body.push(...chapterHead("+", "APPENDIX", cheatsheet.title));
body.push(para([run("자주 쓰는 명령만 한 장에 모았습니다. 출력해 모니터 옆에 붙여 두고 활용하세요.", { size: 22, color: C.muted })], { after: 220 }));
for (const g of cheatsheet.groups) {
  body.push(para([run("▍", { color: C.gold, bold: true, size: 22 }), run(g.name, { bold: true, size: 22, color: C.navy })], { before: 120, after: 100, keepNext: true }));
  body.push(...cmdTable({ rows: g.rows }).slice(0, 1), gap(120));
}
const header = new Header({ children: [para([run("바이블웍스 10 기본 사용 가이드", { size: 16, color: C.muted })],
  { align: AlignmentType.RIGHT, after: 0, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.line, space: 6 } } })] });
const footer = new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
  new TextRun({ children: [PageNumber.CURRENT], font: f(FONT), size: 17, color: C.muted }),
] })] });

const doc = new Document({
  creator: meta.editor, title: meta.title, description: meta.subtitle,
  styles: { default: { document: { run: { font: FONT, size: 21 } } } },
  sections: [
    { properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1400, bottom: 1300, left: 1134, right: 1134 } } }, children: cover },
    { properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1400, bottom: 1300, left: 1134, right: 1134, header: 600, footer: 600 } } },
      headers: { default: header }, footers: { default: footer }, children: [...front, ...body] },
  ],
});

const outPath = process.argv[2] || "out.docx";
Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(outPath, buf); console.log("wrote", outPath); });
