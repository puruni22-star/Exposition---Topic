// 스트롱코드사전.html 생성: node src/build_dictionary.js
const fs = require("fs");
const path = require("path");

function load(file) {
  const s = fs.readFileSync(path.join(__dirname, "data", file), "utf8");
  const i = s.indexOf("{", s.indexOf("= "));
  const j = s.lastIndexOf("}");
  return JSON.parse(s.slice(i, j + 1));
}

const heb = load("strongs-hebrew-dictionary.js");
const grk = load("strongs-greek-dictionary.js");
const tpl = fs.readFileSync(path.join(__dirname, "template.html"), "utf8");
const safe = (o) => JSON.stringify(o).replace(/</g, "\\u003c");
const html = tpl
  .replace("/*__HEB__*/null", () => safe(heb))
  .replace("/*__GRK__*/null", () => safe(grk));
const out = path.join(__dirname, "..", "스트롱코드사전.html");
fs.writeFileSync(out, html);
console.log(`히브리어 ${Object.keys(heb).length}, 헬라어 ${Object.keys(grk).length} → ${out} (${(html.length / 1048576).toFixed(1)}MB)`);
