// 제50주 설교문 Word 문서 생성 (docx-js)
// 사용: node build_docx.js <출력경로.docx>
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType,
  AlignmentType, ShadingType, BorderStyle, Footer, Header, PageNumber, TableLayoutType,
} = require("docx");
const { meta, part1, part2 } = require("./sermon50.js");

const FONT = "Malgun Gothic";
const C = {
  navy: "1B3A6B", navyTint: "EAF0F8", softNavy: "F4F7FA", gold: "B8960C", goldDeep: "9C6500",
  cream: "FFF7EC", green: "2E6B3A", greenTint: "EFF5EA", ink: "222222", gray: "666666",
  prayer: "FAF6EE", line: "C9D3E0",
};
const W = 9638; // A4 본문 폭(twip, 좌우 여백 2cm)

const run = (text, o = {}) => new TextRun({
  text, font: { ascii: FONT, eastAsia: FONT, hAnsi: FONT, cs: FONT },
  size: o.size || 22, bold: o.bold, italics: o.italics, color: o.color || C.ink,
});
// 줄바꿈(\n)을 살려 여러 run으로 만든다
const runs = (text, o = {}) => text.split("\n").map((line, i) => new TextRun({
  text: line, break: i ? 1 : 0, font: { ascii: FONT, eastAsia: FONT, hAnsi: FONT, cs: FONT },
  size: o.size || 22, bold: o.bold, italics: o.italics, color: o.color || C.ink,
}));
const para = (children, o = {}) => new Paragraph({
  children, alignment: o.align || AlignmentType.LEFT,
  spacing: { before: o.before ?? 0, after: o.after ?? 160, line: o.line || 360 },
  keepNext: o.keepNext, indent: o.indent, border: o.border,
});

const border = (color, size = 6) => ({ style: BorderStyle.SINGLE, size, color });
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };

function cell(children, o = {}) {
  return new TableCell({
    children,
    width: { size: o.width || W, type: WidthType.DXA },
    shading: o.fill ? { type: ShadingType.CLEAR, color: "auto", fill: o.fill } : undefined,
    margins: { top: o.pad ?? 140, bottom: o.pad ?? 140, left: 220, right: 220 },
    borders: o.borders,
    columnSpan: o.span,
  });
}
function box(rowsCells, o = {}) {
  return new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: o.cols || [W],
    layout: TableLayoutType.FIXED,
    rows: rowsCells.map((cells) => new TableRow({ children: cells, cantSplit: true })),
  });
}
const gap = (after = 200) => new Paragraph({ children: [], spacing: { before: 0, after } });

function sideBorders(color, leftSize = 24) {
  return { top: border(color, 4), bottom: border(color, 4), right: border(color, 4), left: border(color, leftSize) };
}

const out = [];

// ── 표지
out.push(box([[cell([
  para([run(meta.series.toUpperCase() + "  ·  제" + meta.week + "주", { size: 20, color: "E9D9A6", bold: true })], { align: AlignmentType.CENTER, after: 120 }),
  para([run(meta.title, { size: 40, bold: true, color: "FFFFFF" })], { align: AlignmentType.CENTER, after: 120, line: 420 }),
  para([run(meta.theme, { size: 24, color: "FFFFFF" })], { align: AlignmentType.CENTER, after: 200 }),
  para([run(`주 본문 ${meta.mainText}   |   보조 본문 ${meta.subTexts}`, { size: 19, color: "DDE6F2" })], { align: AlignmentType.CENTER, after: 60 }),
  para([run(`${meta.date}   |   ${meta.church}   |   ${meta.pastor}`, { size: 19, color: "DDE6F2" })], { align: AlignmentType.CENTER, after: 0 }),
], { fill: C.navy, pad: 420, borders: { top: border(C.gold, 18), bottom: border(C.gold, 18), left: noBorder, right: noBorder } })]]));
out.push(gap(320));

// ── PART 1
out.push(para([run("PART 1", { size: 20, bold: true, color: C.gold })], { after: 40 }));
out.push(para([run("설교 정보 요약", { size: 32, bold: true, color: C.navy })], { after: 200, border: { bottom: border(C.gold, 12) } }));
const LW = 2300;
out.push(box(part1.map(([k, v]) => [
  cell([para([run(k, { bold: true, color: C.navy, size: 20 })], { after: 0, line: 300 })],
    { width: LW, fill: C.navyTint, pad: 110, borders: { top: border(C.line), bottom: border(C.line), left: border(C.line), right: border(C.line) } }),
  cell(v.split("\n").map((l, i, a) => para([run(l, { size: 20 })], { after: i === a.length - 1 ? 0 : 60, line: 300 })),
    { width: W - LW, pad: 110, borders: { top: border(C.line), bottom: border(C.line), left: border(C.line), right: border(C.line) } }),
]), { cols: [LW, W - LW] }));

// ── PART 2
out.push(new Paragraph({ children: [], pageBreakBefore: true, spacing: { after: 0 } }));
out.push(para([run("PART 2", { size: 20, bold: true, color: C.gold })], { after: 40 }));
out.push(para([run("설교문 전체", { size: 32, bold: true, color: C.navy })], { after: 280, border: { bottom: border(C.gold, 12) } }));

for (const b of part2) {
  switch (b.t) {
    case "h1":
      out.push(para([run(b.text, { size: 38, bold: true, color: C.navy })], { align: AlignmentType.CENTER, after: 80, line: 440 }));
      break;
    case "sub":
      out.push(para([run(b.text, { size: 22, color: C.goldDeep })], { align: AlignmentType.CENTER, after: 320 }));
      break;
    case "h2": {
      const children = [];
      if (b.num) children.push(run(b.num + "  ", { size: 30, bold: true, color: C.gold }));
      children.push(run(b.text, { size: b.num ? 28 : 26, bold: true, color: C.navy }));
      out.push(para(children, { before: 360, after: 200, keepNext: true, line: 380, border: { bottom: border(b.num ? C.gold : C.line, b.num ? 12 : 6) } }));
      break;
    }
    case "label":
      out.push(box(b.items.map(([k, v]) => [
        cell([para([run(k, { bold: true, color: "FFFFFF", size: 21 })], { after: 0 })], { width: 2000, fill: C.navy, pad: 110, borders: sideBorders(C.navy, 4) }),
        cell([para([run(v, { bold: true, color: C.navy, size: 22 })], { after: 0 })], { width: W - 2000, fill: C.navyTint, pad: 110, borders: sideBorders(C.navy, 4) }),
      ]), { cols: [2000, W - 2000] }));
      out.push(gap());
      break;
    case "scripture":
      out.push(box([[cell([
        para([run("✦ " + b.ref, { bold: true, color: C.navy, size: 21 })], { after: 100, keepNext: true }),
        ...b.text.split("\n").map((l) => para([run(l, { color: C.navy, size: 21 })], { after: 80, line: 340 })),
      ], { fill: C.navyTint, borders: sideBorders(C.navy) })]]));
      out.push(gap());
      break;
    case "note":
      out.push(para([run("※ " + b.text, { italics: true, color: C.gray, size: 19 })], { after: 200 }));
      break;
    case "p":
      out.push(para([run(b.text)], { after: 180, line: 380 }));
      break;
    case "insight":
      out.push(box([[cell([
        para([run("🔍 " + b.title, { bold: true, color: C.navy, size: 20 })], { after: 80, keepNext: true }),
        para([run(b.text, { size: 20, color: "2A3B55" })], { after: 0, line: 340 }),
      ], { fill: C.softNavy, borders: { top: border(C.line), bottom: border(C.line), left: border("6F8BB3", 18), right: border(C.line) } })]]));
      out.push(gap());
      break;
    case "wesley": {
      const gb = { top: border(C.gold, 8), bottom: border(C.gold, 8), left: border(C.gold, 8), right: border(C.gold, 8) };
      const lab = (t) => run(t, { bold: true, size: 18, color: C.goldDeep });
      out.push(box([
        [cell([para([run("📖 웨슬리의 음성", { bold: true, color: "FFFFFF", size: 22 }), run(`   표준설교 ${b.no}편 「${b.title}」 ${b.sec}`, { color: "FFFFFF", size: 19 })], { after: 0, keepNext: true })], { fill: C.gold, pad: 120, borders: gb })],
        [cell([para([lab("원문")], { after: 40, keepNext: true }), para([run(b.en, { italics: true, size: 20, color: "5A4300" })], { after: 0, line: 330, keepNext: true })], { fill: C.cream, borders: gb })],
        [cell([para([lab("우리말 번역")], { after: 40, keepNext: true }), para([run(b.ko, { size: 21, color: C.ink })], { after: 0, line: 350, keepNext: true })], { fill: "FFFFFF", borders: gb })],
        [cell([para([lab("오늘 본문과의 연결")], { after: 40, keepNext: true }), para([run(b.link, { size: 21, color: C.ink, bold: false })], { after: 0, line: 350 })], { fill: C.cream, borders: gb })],
      ]));
      out.push(gap(240));
      break;
    }
    case "apply": {
      const gr = { top: border(C.green, 6), bottom: border(C.green, 6), left: border(C.green, 6), right: border(C.green, 6) };
      out.push(box([
        [cell([para([run("✔ " + b.title, { bold: true, color: "FFFFFF", size: 22 })], { after: 0, keepNext: true })], { fill: C.green, pad: 120, borders: gr })],
        ...b.items.map((it) => [cell([para([run(it, { color: "1F4A28", size: 21 })], { after: 0, line: 340 })], { fill: C.greenTint, pad: 120, borders: gr })]),
      ]));
      out.push(gap(240));
      break;
    }
    case "key":
      out.push(box([[cell([para([run(b.text, { bold: true, color: "FFFFFF", size: 25 })], { align: AlignmentType.CENTER, after: 0, line: 380 })],
        { fill: C.navy, pad: 260, borders: { top: border(C.gold, 18), bottom: border(C.gold, 18), left: noBorder, right: noBorder } })]]));
      out.push(gap(260));
      break;
    case "prayer":
      out.push(box([[cell([
        para([run("🙏 마침 기도", { bold: true, color: C.goldDeep, size: 22 })], { after: 140 }),
        ...b.text.split("\n").map((l) => para([run(l, { size: 21 })], { after: 100, line: 360 })),
      ], { fill: C.prayer, pad: 260, borders: { top: border("D9CBB0"), bottom: border("D9CBB0"), left: border("D9CBB0"), right: border("D9CBB0") } })]]));
      out.push(gap(300));
      break;
    case "closing":
      out.push(para([run(b.text, { italics: true, color: C.gray, size: 19 })], { before: 200, after: 0, border: { top: border(C.line, 6) } }));
      break;
  }
}

const doc = new Document({
  creator: "지석교회 김태희 목사",
  title: `${meta.series}(${meta.week}) 제${meta.week}주 설교문 — ${meta.title}`,
  styles: { default: { document: { run: { font: FONT, size: 22 } } } },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
    headers: { default: new Header({ children: [para([run(`${meta.series}(${meta.week}) · 제${meta.week}주 · ${meta.theme}`, { size: 16, color: C.gray })], { align: AlignmentType.RIGHT, after: 0 })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
      new TextRun({ children: ["— ", PageNumber.CURRENT, " —"], size: 18, color: C.gray, font: FONT }),
    ] })] }) },
    children: out,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(process.argv[2], buf);
  console.log("written", process.argv[2], buf.length);
});
