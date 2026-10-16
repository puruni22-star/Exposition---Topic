// 설교 전문 원고(A, 예배 순서·기도문 C 통합)와 소그룹 묵상 자료(B) Word 문서 생성 (docx-js)
// 사용: node src/build_docx.js <설교원고.docx> <소그룹자료.docx>
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType,
  AlignmentType, ShadingType, BorderStyle, Footer, Header, PageNumber, TableLayoutType,
} = require("docx");
const { meta, order, repPrayer, theology, sermon, decision, smallGroup: sg } = require("./content.js");

const FONT = "Malgun Gothic";
const C = {
  navy: "1B3A6B", navyTint: "EAF0F8", gold: "B8960C", goldDeep: "9C6500", cream: "FFF7EC",
  green: "2E6B3A", greenTint: "EFF5EA", ink: "222222", gray: "666666", line: "C9D3E0",
  ill: "FDF3E7", illLine: "D9A35F", prayer: "FAF6EE",
};
const W = 9638; // A4 본문 폭(twip, 좌우 여백 2cm)

const tr = (text, o = {}) => new TextRun({
  text, font: { ascii: FONT, eastAsia: FONT, hAnsi: FONT, cs: FONT },
  size: o.size || 22, bold: o.bold, italics: o.italics, color: o.color || C.ink,
});
// **굵게** 표시를 살려 run 배열로 만든다
const rich = (text, o = {}) => text.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((s) =>
  s.startsWith("**") ? tr(s.slice(2, -2), { ...o, bold: true }) : tr(s, o));
const para = (children, o = {}) => new Paragraph({
  children, alignment: o.align || AlignmentType.LEFT,
  spacing: { before: o.before ?? 0, after: o.after ?? 160, line: o.line || 360 },
  keepNext: o.keepNext, border: o.border, pageBreakBefore: o.pageBreak,
});
const border = (color, size = 6) => ({ style: BorderStyle.SINGLE, size, color });
const allB = (color, size = 6) => ({ top: border(color, size), bottom: border(color, size), left: border(color, size), right: border(color, size) });
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const cell = (children, o = {}) => new TableCell({
  children, width: { size: o.width || W, type: WidthType.DXA },
  shading: o.fill ? { type: ShadingType.CLEAR, color: "auto", fill: o.fill } : undefined,
  margins: { top: o.pad ?? 140, bottom: o.pad ?? 140, left: 220, right: 220 }, borders: o.borders,
});
const box = (rows, cols = [W]) => new Table({
  width: { size: W, type: WidthType.DXA }, columnWidths: cols, layout: TableLayoutType.FIXED,
  rows: rows.map((cells) => new TableRow({ children: cells, cantSplit: true })),
});
const gap = (after = 200) => new Paragraph({ children: [], spacing: { before: 0, after } });

function partHead(out, no, title, pageBreak = true) {
  out.push(para([tr(no, { size: 20, bold: true, color: C.gold })], { after: 40, pageBreak }));
  out.push(para([tr(title, { size: 32, bold: true, color: C.navy })], { after: 240, border: { bottom: border(C.gold, 12) } }));
}
function titledBox(out, title, lines, o) {
  out.push(box([
    [cell([para([tr(title, { bold: true, color: "FFFFFF", size: 21 })], { after: 0 })], { fill: o.dark, pad: 110, borders: allB(o.dark) })],
    [cell(lines.map((l, i) => para(rich(l, { size: 21, color: o.ink || C.ink, italics: o.italics }), { after: i === lines.length - 1 ? 0 : 100, line: 350 })), { fill: o.tint, borders: allB(o.dark) })],
  ]));
  out.push(gap(240));
}
function cover(out, kind) {
  out.push(box([[cell([
    para([tr(`${meta.church}  ·  ${kind}`, { size: 20, color: "E9D9A6", bold: true })], { align: AlignmentType.CENTER, after: 120 }),
    para([tr(meta.title, { size: 42, bold: true, color: "FFFFFF" })], { align: AlignmentType.CENTER, after: 100, line: 440 }),
    para([tr(meta.subtitle, { size: 23, color: "FFFFFF" })], { align: AlignmentType.CENTER, after: 220 }),
    para([tr(`주 본문 ${meta.mainText}   |   함께 읽는 본문 ${meta.subTexts}`, { size: 18, color: "DDE6F2" })], { align: AlignmentType.CENTER, after: 60 }),
    para([tr(meta.season, { size: 18, color: "DDE6F2" })], { align: AlignmentType.CENTER, after: 60 }),
    para([tr(`${meta.date}   |   ${meta.pastor}`, { size: 18, color: "DDE6F2" })], { align: AlignmentType.CENTER, after: 0 }),
  ], { fill: C.navy, pad: 420, borders: { top: border(C.gold, 18), bottom: border(C.gold, 18), left: noBorder, right: noBorder } })]]));
  out.push(gap(240));
}
function makeDoc(children, headerText) {
  return new Document({
    creator: `${meta.church} ${meta.pastor}`, title: `${meta.date} ${meta.title}`,
    styles: { default: { document: { run: { font: FONT, size: 22 } } } },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
      headers: { default: new Header({ children: [para([tr(headerText, { size: 16, color: C.gray })], { align: AlignmentType.RIGHT, after: 0 })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ children: ["— ", PageNumber.CURRENT, " —"], size: 18, color: C.gray, font: FONT })] })] }) },
      children,
    }],
  });
}
const draftNote = "※ 이 원고는 초안입니다. 본문을 직접 묵상하신 뒤, 성경 인용(새번역)·웨슬리 원문·찬송가 장수를 확인하시고 목사님의 언어로 다듬어 선포해 주십시오.";

// ───────────── A. 설교 전문 원고
const A = [];
cover(A, "주일 설교 전문 원고");
A.push(para([tr(draftNote, { italics: true, color: C.gray, size: 18 })], { after: 0 }));

partHead(A, "PART 1", "예배 순서표");
const cw = [2000, 5838, 1800];
const hdr = (t, w) => cell([para([tr(t, { bold: true, color: "FFFFFF", size: 20 })], { align: AlignmentType.CENTER, after: 0 })], { width: w, fill: C.navy, pad: 100, borders: allB(C.navy) });
const td = (t, w, o = {}) => cell([para([tr(t, { size: 20, bold: o.bold, color: o.bold ? C.navy : C.ink })], { align: o.center ? AlignmentType.CENTER : AlignmentType.LEFT, after: 0, line: 300 })], { width: w, fill: o.fill, pad: 90, borders: allB(C.line) });
A.push(box([
  [hdr("순서", cw[0]), hdr("내용", cw[1]), hdr("담당", cw[2])],
  ...order.map(([a, b, c], i) => [td(a, cw[0], { bold: true, fill: C.navyTint }), td(b, cw[1], { fill: i % 2 ? "F8FAFC" : undefined }), td(c, cw[2], { center: true })]),
], cw));
A.push(para([tr("※ 찬송가 장수는 새찬송가 기준입니다. 교회 사정에 맞게 바꾸어 사용하십시오.", { italics: true, color: C.gray, size: 18 })], { before: 120 }));

partHead(A, "PART 2", "대표기도문");
A.push(box([[cell(repPrayer.map((p, i) => para([tr(p, { size: 21 })], { after: i === repPrayer.length - 1 ? 0 : 180, line: 370 })),
  { fill: C.prayer, pad: 280, borders: allB("D9CBB0") })]]));

partHead(A, "PART 3", "신학적 배경 — 웨슬리의 음성");
A.push(box([
  [cell([para([tr("📖 " + theology.heading, { bold: true, color: "FFFFFF", size: 21 })], { after: 0 })], { fill: C.gold, pad: 120, borders: allB(C.gold, 8) })],
  [cell([para([tr("원문", { bold: true, size: 18, color: C.goldDeep })], { after: 40 }), para([tr(theology.en, { italics: true, size: 21, color: "5A4300" })], { after: 0, line: 340 })], { fill: C.cream, borders: allB(C.gold, 8) })],
  [cell([para([tr("우리말", { bold: true, size: 18, color: C.goldDeep })], { after: 40 }), para([tr(theology.ko, { size: 21 })], { after: 0, line: 350 })], { fill: "FFFFFF", borders: allB(C.gold, 8) })],
  [cell([para([tr("회중 언어로 적용", { bold: true, size: 18, color: C.goldDeep })], { after: 40 }), para([tr(theology.apply, { size: 21 })], { after: 0, line: 360 })], { fill: C.cream, borders: allB(C.gold, 8) })],
]));

partHead(A, "PART 4", "설교 전문");
A.push(para([tr(meta.title, { size: 40, bold: true, color: C.navy })], { align: AlignmentType.CENTER, after: 80, line: 460 }));
A.push(para([tr(meta.subtitle, { size: 22, color: C.goldDeep })], { align: AlignmentType.CENTER, after: 80 }));
A.push(para([tr(`${meta.mainText} · ${meta.subTexts}`, { size: 19, color: C.gray })], { align: AlignmentType.CENTER, after: 320 }));
const h2 = (num, text) => para([tr(num + "  ", { size: 28, bold: true, color: C.gold }), tr(text, { size: 27, bold: true, color: C.navy })],
  { before: 360, after: 200, keepNext: true, line: 380, border: { bottom: border(C.gold, 12) } });
const body = (t) => para(rich(t, { size: 22 }), { after: 180, line: 390 });

A.push(h2("서론", "이 얼굴은 누구의 것입니까"));
sermon.intro.forEach((t) => A.push(body(t)));

for (const p of sermon.points) {
  A.push(h2(p.no, `${p.title}`));
  A.push(para([tr(p.ref, { size: 20, color: C.goldDeep, bold: true })], { after: 160 }));
  // ① 본문 인용
  A.push(box([[cell([
    para([tr("① 본문 — " + p.ref + " (새번역)", { bold: true, color: C.navy, size: 20 })], { after: 100, keepNext: true }),
    ...p.scripture.split("\n").map((l) => para(rich(l, { size: 21, color: C.navy }), { after: 80, line: 340 })),
  ], { fill: C.navyTint, borders: { top: border(C.navy, 4), bottom: border(C.navy, 4), right: border(C.navy, 4), left: border(C.navy, 24) } })]]));
  A.push(gap());
  // ② 상황 분석
  A.push(para([tr("② 그때 그곳, 그리고 오늘 여기", { bold: true, color: C.navy, size: 21 })], { after: 120, keepNext: true }));
  p.context.forEach((t) => A.push(body(t)));
  // ③ 예화
  A.push(box([[cell([
    para([tr("③ " + p.illTitle, { bold: true, color: "8A4B08", size: 21 })], { after: 100, keepNext: true }),
    para(rich(p.illustration, { size: 21 }), { after: 0, line: 370 }),
  ], { fill: C.ill, borders: { top: border(C.illLine, 4), bottom: border(C.illLine, 4), right: border(C.illLine, 4), left: border(C.illLine, 24) } })]]));
  A.push(gap(240));
  // ④ 신학 통찰
  const gb = allB(C.gold, 8);
  A.push(box([
    [cell([para([tr("④ 웨슬리의 통찰", { bold: true, color: "FFFFFF", size: 21 }), tr("   " + p.wesley.src, { color: "FFFFFF", size: 18 })], { after: 0 })], { fill: C.gold, pad: 110, borders: gb })],
    [cell([para([tr(p.wesley.en, { italics: true, size: 21, color: "5A4300" })], { after: 80, line: 340 }), para([tr("→ " + p.wesley.ko, { size: 21, bold: true })], { after: 0, line: 350 })], { fill: C.cream, borders: gb })],
    [cell([para([tr(p.wesley.link, { size: 21 })], { after: 0, line: 360 })], { fill: "FFFFFF", borders: gb })],
  ]));
  A.push(gap(240));
  // ⑤ 삶의 적용
  titledBox(A, "⑤ 이번 주 삶의 적용", p.apply.map((t) => "✔ " + t), { dark: C.green, tint: C.greenTint, ink: "1F4A28" });
}

A.push(h2("결론", "하나님의 것은 하나님께"));
sermon.conclusion.summary.forEach((t) => A.push(body(t)));
A.push(body(sermon.conclusion.body));
A.push(box([[cell([para([tr(sermon.conclusion.proclaim, { bold: true, color: "FFFFFF", size: 26 })], { align: AlignmentType.CENTER, after: 0, line: 400 })],
  { fill: C.navy, pad: 280, borders: { top: border(C.gold, 18), bottom: border(C.gold, 18), left: noBorder, right: noBorder } })]]));
A.push(gap(240));
A.push(body(sermon.conclusion.invite));

partHead(A, "PART 5", "결단 기도문 (다같이 소리 내어)");
A.push(box([[cell(decision.map((l) => para([tr(l, { size: 23, bold: l.endsWith(",") || l.includes("아멘") , color: l.endsWith(",") ? C.navy : C.ink })], { after: l ? 80 : 160, line: 380, align: AlignmentType.CENTER })),
  { fill: C.prayer, pad: 320, borders: allB("D9CBB0") })]]));

// ───────────── B. 소그룹 묵상 자료
const B = [];
cover(B, "소그룹 묵상 자료");
const sec = (t) => para([tr(t, { size: 25, bold: true, color: C.navy })], { before: 280, after: 140, keepNext: true, border: { bottom: border(C.gold, 8) } });
const qList = (arr, start) => arr.forEach((q, i) => {
  B.push(para([tr(`Q${start + i}. `, { bold: true, color: C.gold }), tr(q)], { after: 80, line: 360 }));
  B.push(box([[cell([para([tr(" ", { size: 20 })], { after: 0, line: 900 })], { borders: allB(C.line, 4) })]]));
  B.push(gap(160));
});
B.push(sec("🌱 마음 열기"));
qList([sg.opening], 1);
B.push(sec("📖 본문 읽기 — " + sg.reading));
B.push(box([[cell(sg.readingText.split("\n").map((l) => para([tr(l, { size: 20, color: C.navy })], { after: 60, line: 330 })),
  { fill: C.navyTint, borders: { top: border(C.navy, 4), bottom: border(C.navy, 4), right: border(C.navy, 4), left: border(C.navy, 24) } })]]));
B.push(para([tr("함께 읽을 본문: 출애굽기 33:12-23, 데살로니가전서 1:1-10", { italics: true, color: C.gray, size: 18 })], { before: 100 }));
B.push(sec("🔎 관찰 — 본문에 무엇이 쓰여 있나요?"));
qList(sg.observe, 2);
B.push(sec("💡 해석 — 무슨 뜻일까요?"));
qList(sg.interpret, 4);
B.push(sec("🙌 적용 — 내 삶에서는?"));
qList(sg.apply, 6);
B.push(sec("✔ 한 주간 실천"));
sg.practice.forEach((t) => B.push(para([tr("☐  " + t, { size: 22 })], { after: 100 })));
B.push(sec("🙏 기도 제목"));
B.push(box([1, 2, 3, 4].map(() => [cell([para([tr(" ")], { after: 0, line: 420 })], { borders: { top: noBorder, left: noBorder, right: noBorder, bottom: border(C.line, 6) } })])));

B.push(para([tr("리더 가이드", { size: 32, bold: true, color: C.navy })], { pageBreak: true, after: 240, border: { bottom: border(C.gold, 12) } }));
B.push(sec("질문별 의도와 예상 답변"));
const lw = 1900;
B.push(box(sg.leader.map(([k, v]) => [
  cell([para([tr(k, { bold: true, color: C.navy, size: 20 })], { after: 0 })], { width: lw, fill: C.navyTint, pad: 100, borders: allB(C.line) }),
  cell([para([tr(v, { size: 20 })], { after: 0, line: 330 })], { width: W - lw, pad: 100, borders: allB(C.line) }),
]), [lw, W - lw]));
B.push(sec("시간 배분 (60분 기준)"));
B.push(box(sg.timing.map(([k, v]) => [
  cell([para([tr(k, { size: 20 })], { after: 0 })], { width: W - 1600, pad: 90, borders: allB(C.line) }),
  cell([para([tr(v, { size: 20, bold: true, color: C.navy })], { align: AlignmentType.CENTER, after: 0 })], { width: 1600, fill: C.navyTint, pad: 90, borders: allB(C.line) }),
]), [W - 1600, 1600]));
B.push(sec("신학적으로 주의할 점"));
sg.cautions.forEach((t) => B.push(para([tr("• " + t, { size: 21 })], { after: 120, line: 360 })));

const [outA, outB] = process.argv.slice(2);
const hdrText = `${meta.church} · ${meta.date} · ${meta.mainText}`;
Promise.all([
  Packer.toBuffer(makeDoc(A, hdrText)).then((b) => fs.writeFileSync(outA, b)),
  Packer.toBuffer(makeDoc(B, hdrText + " · 소그룹")).then((b) => fs.writeFileSync(outB, b)),
]).then(() => console.log("written", outA, outB));
