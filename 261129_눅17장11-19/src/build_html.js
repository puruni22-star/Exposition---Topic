// 설교문 · 소그룹 묵상 자료를 상단 내비게이션이 있는 단일 HTML 문서로 생성
// 사용: node src/build_html.js <설교문.html> <소그룹묵상자료.html> <마인드맵 파일명>
const fs = require("fs");
const path = require("path");
const C = require("./content.js");
const { meta, summary, words, order, repPrayer, theology, sermon, decision, smallGroup: sg, closingNote, paraphrase } = C;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const rich = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
const ps = (arr, cls = "") => arr.map((t) => `<p${cls ? ` class="${cls}"` : ""}>${rich(t)}</p>`).join("\n");
const verses = (txt) => txt.split("\n").map((l) => {
  const m = l.match(/^((?:[가-힣]+ )?\d+:\d+|\d+)\s(.*)$/);
  return m ? `<p><span class="vn">${esc(m[1])}</span>${rich(m[2])}</p>` : `<p>${rich(l)}</p>`;
}).join("\n");

const [outSermon, outGroup, mindmapName, devotionName] = process.argv.slice(2);
const sermonName = path.basename(outSermon), groupName = path.basename(outGroup);

function page({ title, kind, current, navItems, body }) {
  const docs = [["설교문", sermonName], ["소그룹 묵상", groupName], ...(devotionName ? [["매일 묵상", devotionName]] : []), ["마인드맵", mindmapName]];
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;700;900&family=Noto+Sans+KR:wght@400;500;700&display=swap" rel="stylesheet">
<style>
:root{
  --paper:#FBF7EF; --sheet:#FFFDF8; --ink:#2A2823; --soft:#5E594F; --mute:#8A8377;
  --forest:#2F5B45; --forest-d:#21412F; --forest-t:#EAF1EA; --gold:#A9822F; --gold-l:#E6D3A3; --gold-t:#F8F0DC;
  --clay:#9A5A2A; --clay-t:#FBEFE2; --line:#E5DCCB; --shadow:0 1px 2px rgba(60,45,20,.05),0 8px 28px rgba(60,45,20,.07);
  --fs:18px; --serif:"Noto Serif KR","Nanum Myeongjo","AppleMyungjo",serif; --sans:"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth;scroll-padding-top:118px;-webkit-text-size-adjust:100%}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--sans);font-size:var(--fs);line-height:1.9;word-break:keep-all;overflow-wrap:break-word}
a{color:inherit}
strong{color:var(--forest-d);font-weight:700}
/* 상단 내비게이션 */
.topbar{position:sticky;top:0;z-index:50;background:rgba(251,247,239,.94);backdrop-filter:saturate(1.4) blur(10px);-webkit-backdrop-filter:saturate(1.4) blur(10px);border-bottom:1px solid var(--line)}
.bar1{max-width:1080px;margin:0 auto;padding:10px 16px 6px;display:flex;align-items:center;gap:12px}
.brand{font-family:var(--serif);font-weight:700;font-size:15px;color:var(--forest-d);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;flex:1}
.brand small{font-family:var(--sans);font-weight:500;color:var(--mute);font-size:12px;margin-left:8px}
.docs{display:flex;gap:4px;flex-shrink:0}
.docs a{font-size:13px;text-decoration:none;padding:5px 11px;border-radius:999px;color:var(--soft);border:1px solid transparent}
.docs a[aria-current="page"]{background:var(--forest);color:#fff}
.docs a:not([aria-current]):hover{border-color:var(--line);background:var(--sheet)}
.fsz{display:flex;gap:2px;flex-shrink:0}
.fsz button{font:600 13px var(--sans);white-space:nowrap;padding:0;width:40px;height:30px;border-radius:8px;border:1px solid var(--line);background:var(--sheet);color:var(--soft);cursor:pointer}
.bar2{max-width:1080px;margin:0 auto;padding:0 10px 8px;display:flex;gap:4px;overflow-x:auto;scrollbar-width:none}
.bar2::-webkit-scrollbar{display:none}
.bar2 a{flex-shrink:0;font-size:14px;text-decoration:none;color:var(--soft);padding:6px 12px;border-radius:8px;white-space:nowrap}
.bar2 a:hover{background:var(--forest-t)}
.bar2 a.on{color:var(--forest-d);background:var(--forest-t);font-weight:700;box-shadow:inset 0 -2px 0 var(--gold)}
a:focus-visible,button:focus-visible{outline:3px solid var(--gold);outline-offset:2px}
/* 표지 */
.hero{background:radial-gradient(1200px 400px at 50% -10%,#3C7258 0%,var(--forest) 45%,var(--forest-d) 100%);color:#fff;text-align:center;padding:72px 20px 64px;position:relative;overflow:hidden}
.hero:after{content:"";position:absolute;inset:auto 0 0 0;height:6px;background:linear-gradient(90deg,transparent,var(--gold-l),transparent)}
.hero .kicker{display:inline-block;font-size:13px;letter-spacing:.18em;color:var(--gold-l);border:1px solid rgba(230,211,163,.45);padding:4px 14px;border-radius:999px;margin-bottom:22px}
.hero h1{font-family:var(--serif);font-weight:900;font-size:clamp(34px,7vw,56px);line-height:1.25;margin:0 0 14px;letter-spacing:-.01em}
.hero .sub{font-family:var(--serif);font-size:clamp(17px,3.2vw,21px);color:#F4EBD4;margin:0 0 30px}
.hero .meta{display:flex;flex-wrap:wrap;justify-content:center;gap:8px 18px;font-size:14px;color:#D9E6DD}
.hero .meta span{white-space:nowrap}
/* 본문 레이아웃 */
main{max-width:820px;margin:0 auto;padding:12px 16px 80px}
section{margin-top:64px}
.eyebrow{font-size:13px;font-weight:700;letter-spacing:.16em;color:var(--gold);margin:0 0 6px}
h2{font-family:var(--serif);font-weight:700;font-size:clamp(25px,4.6vw,32px);line-height:1.35;margin:0 0 22px;color:var(--forest-d)}
h2:after{content:"";display:block;width:44px;height:3px;background:var(--gold);margin-top:14px;border-radius:2px}
h3{font-family:var(--serif);font-size:21px;margin:30px 0 10px;color:var(--forest-d)}
p{margin:0 0 1.05em}
.lead{font-size:1.06em;color:var(--soft)}
.card{background:var(--sheet);border:1px solid var(--line);border-radius:16px;padding:24px 24px;box-shadow:var(--shadow)}
.note{font-size:14px;color:var(--mute);margin-top:10px}
/* 요약 카드 */
.sumgrid{display:grid;gap:12px}
.sumrow{display:grid;grid-template-columns:150px 1fr;gap:16px;padding:16px 20px;background:var(--sheet);border:1px solid var(--line);border-radius:14px}
.sumrow dt{font-weight:700;color:var(--forest);font-size:15px;padding-top:2px}
.sumrow dd{margin:0;font-size:16px;line-height:1.8}
.sumrow.big{background:var(--forest);border-color:var(--forest)}
.sumrow.big dt{color:var(--gold-l)} .sumrow.big dd{color:#fff;font-family:var(--serif);font-size:18px} .sumrow.big strong{color:#FFF3D2}
.words{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin-top:8px}
.word{background:var(--gold-t);border:1px solid var(--gold-l);border-radius:14px;padding:16px 18px}
.word b{display:block;font-family:var(--serif);color:var(--clay);font-size:17px;margin-bottom:6px}
.word p{margin:0;font-size:15px;line-height:1.75;color:var(--ink)}
/* 본문 풀어 읽기 */
.para{font-family:var(--serif);font-size:1.04em;line-height:2.05;background:var(--sheet);border-radius:16px;padding:28px 28px 14px;border:1px solid var(--line);box-shadow:var(--shadow);position:relative}
.para:before{content:"“";position:absolute;top:-6px;left:16px;font-size:72px;color:var(--gold-l);font-family:Georgia,serif;line-height:1}
/* 예배 순서 */
.order{display:grid;gap:0;background:var(--sheet);border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:var(--shadow)}
.orow{display:grid;grid-template-columns:132px 1fr 96px;gap:12px;padding:13px 20px;border-top:1px solid var(--line);align-items:baseline;font-size:16px;line-height:1.65}
.orow:first-child{border-top:0}
.orow .k{font-weight:700;color:var(--forest)} .orow .w{text-align:right;color:var(--mute);font-size:14px}
.orow.hl{background:var(--forest-t)}
/* 기도 */
.prayer{background:linear-gradient(#FFFDF8,#FBF5E8);border:1px solid var(--gold-l);border-radius:18px;padding:32px 30px 18px;font-family:var(--serif);line-height:2.05;box-shadow:var(--shadow)}
/* 웨슬리 */
.wes{border-radius:16px;overflow:hidden;border:1px solid var(--gold-l);box-shadow:var(--shadow);background:var(--sheet)}
.wes .hd{background:var(--gold);color:#fff;padding:12px 22px;font-weight:700;font-size:15px}
.wes .hd small{font-weight:400;opacity:.9;margin-left:6px}
.wes .en{background:var(--gold-t);padding:18px 22px;font-family:Georgia,"Times New Roman",serif;font-style:italic;color:#5A4300;font-size:16px;line-height:1.75}
.wes .ko{padding:16px 22px 0;font-family:var(--serif);font-weight:700;color:var(--ink)}
.wes .lk{padding:4px 22px 6px;color:var(--soft);font-size:16px}
/* 설교 */
.sermon-head{text-align:center;padding:30px 0 6px}
.sermon-head .t{font-family:var(--serif);font-weight:900;font-size:clamp(30px,6vw,42px);color:var(--forest-d);margin:0}
.sermon-head .s{font-family:var(--serif);color:var(--gold);margin:6px 0 4px}
.sermon-head .r{color:var(--mute);font-size:14px}
.prose p{text-indent:0}
.point{margin-top:72px}
.phead{display:flex;gap:16px;align-items:flex-start;margin-bottom:18px}
.pnum{flex-shrink:0;width:58px;height:58px;border-radius:50%;background:var(--forest);color:#fff;display:grid;place-items:center;font-family:var(--serif);font-weight:700;font-size:15px;line-height:1.1;text-align:center;box-shadow:0 0 0 4px var(--gold-t),0 0 0 5px var(--gold-l)}
.phead h2{margin:4px 0 4px}
.phead h2:after{display:none}
.pref{font-size:14px;color:var(--gold);font-weight:700}
.key{font-family:var(--serif);font-size:1.08em;color:var(--forest-d);border-left:4px solid var(--gold);padding:6px 0 6px 18px;margin:8px 0 26px;line-height:1.85}
.scripture{background:var(--forest-t);border-radius:14px;padding:20px 22px 8px;border-left:5px solid var(--forest);font-size:16.5px;line-height:1.85}
.scripture .cap{font-size:13px;font-weight:700;color:var(--forest);letter-spacing:.06em;margin-bottom:8px}
.scripture .vn{display:inline-block;min-width:2.2em;font-size:12px;font-weight:700;color:var(--forest);margin-right:6px;vertical-align:1px}
.step{font-size:13px;font-weight:700;letter-spacing:.12em;color:var(--clay);margin:30px 0 10px;display:flex;align-items:center;gap:10px}
.step:after{content:"";flex:1;height:1px;background:var(--line)}
.ill{background:var(--clay-t);border-radius:16px;padding:22px 24px 8px;border:1px solid #EBCFB0}
.ill .tt{font-family:var(--serif);font-weight:700;color:var(--clay);font-size:18px;margin-bottom:8px}
.apply{background:var(--forest);color:#F3F7F2;border-radius:16px;padding:20px 24px 10px;margin-top:22px}
.apply .tt{font-weight:700;color:var(--gold-l);font-size:15px;letter-spacing:.06em;margin-bottom:8px}
.apply ul{list-style:none;margin:0;padding:0}
.apply li{position:relative;padding-left:30px;margin-bottom:12px;line-height:1.8}
.apply li:before{content:"✓";position:absolute;left:0;top:1px;width:21px;height:21px;border-radius:50%;background:var(--gold-l);color:var(--forest-d);font-size:13px;font-weight:900;display:grid;place-items:center}
.recap{display:grid;gap:10px;margin:8px 0 26px}
.recap div{display:grid;grid-template-columns:40px 1fr;gap:12px;align-items:start;background:var(--sheet);border:1px solid var(--line);border-radius:12px;padding:14px 16px;font-size:16.5px;line-height:1.8}
.recap b{width:34px;height:34px;border-radius:50%;background:var(--gold-t);color:var(--clay);display:grid;place-items:center;font-family:var(--serif)}
.proclaim{margin:34px 0;padding:38px 28px;text-align:center;border-radius:20px;background:radial-gradient(600px 200px at 50% 0%,#3C7258,var(--forest-d));color:#fff;font-family:var(--serif);font-weight:700;font-size:clamp(21px,3.8vw,27px);line-height:1.7;box-shadow:var(--shadow)}
.decision{text-align:center;font-family:var(--serif);line-height:2.1;font-size:1.05em}
.decision .h{color:var(--forest);font-weight:700;margin-top:18px}
.decision .amen{font-weight:700;color:var(--forest-d);margin-top:18px}
.comm{display:grid;gap:12px}
.comm div{background:var(--sheet);border:1px solid var(--line);border-left:4px solid var(--gold);border-radius:12px;padding:14px 18px;font-size:16.5px;line-height:1.8}
.notes li{margin-bottom:12px;font-size:16.5px;line-height:1.8}
.closing{margin-top:34px;text-align:center;font-size:14.5px;color:var(--soft);background:var(--sheet);border:1px dashed var(--gold-l);border-radius:12px;padding:18px 20px;line-height:1.8}
/* 소그룹 */
.qs{counter-reset:q;display:grid;gap:14px}
.q{background:var(--sheet);border:1px solid var(--line);border-radius:14px;padding:18px 20px 16px;box-shadow:var(--shadow)}
.q .qn{display:inline-block;font-weight:700;color:#fff;background:var(--gold);border-radius:8px;padding:1px 9px;font-size:13px;margin-right:8px;vertical-align:2px}
.q .write{margin-top:12px;height:78px;border-radius:10px;background:repeating-linear-gradient(transparent 0 25px,var(--line) 25px 26px)}
.practice{display:grid;gap:10px}
.practice div{display:flex;gap:12px;align-items:flex-start;background:var(--forest-t);border-radius:12px;padding:14px 18px;font-size:16.5px;line-height:1.75}
.practice span{flex-shrink:0;width:22px;height:22px;border:2px solid var(--forest);border-radius:6px;margin-top:4px}
.lines{background:var(--sheet);border:1px solid var(--line);border-radius:14px;height:170px;background-image:repeating-linear-gradient(transparent 0 33px,var(--line) 33px 34px);background-origin:content-box;padding:12px 20px}
.guide{display:grid;gap:10px}
.guide div{display:grid;grid-template-columns:110px 1fr;gap:14px;background:var(--sheet);border:1px solid var(--line);border-radius:12px;padding:14px 18px;font-size:16px;line-height:1.75}
.guide b{color:var(--forest)}
.timing{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
.timing div{background:var(--sheet);border:1px solid var(--line);border-radius:12px;padding:12px 14px;font-size:15px;line-height:1.5}
.timing b{display:block;font-family:var(--serif);font-size:22px;color:var(--forest)}
.leader{margin-top:80px;padding-top:40px;border-top:2px dashed var(--gold-l)}
/* 맨 위로 */
.totop{position:fixed;right:16px;bottom:18px;width:46px;height:46px;border-radius:50%;border:0;background:var(--forest);color:#fff;font-size:20px;cursor:pointer;box-shadow:var(--shadow);opacity:0;pointer-events:none;transition:opacity .25s}
.totop.show{opacity:1;pointer-events:auto}
footer{text-align:center;color:var(--mute);font-size:13px;padding:30px 16px 50px;border-top:1px solid var(--line)}
@media (max-width:640px){
  :root{--fs:17px}
  html{scroll-padding-top:110px}
  .brand small{display:none}
  .docs a{padding:5px 8px;font-size:12px}
  .fsz{display:none}
  .sumrow,.guide div{grid-template-columns:1fr;gap:4px}
  .orow{grid-template-columns:1fr auto;gap:2px 10px;padding:12px 16px}
  .orow .v{grid-column:1/-1;order:3;color:var(--soft);font-size:15px}
  .card,.para,.prayer{padding-left:18px;padding-right:18px}
  .hero{padding:56px 16px 48px}
  .pnum{width:50px;height:50px;font-size:13px}
}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}.totop{transition:none}}
@media print{
  .topbar,.totop{display:none}
  body{background:#fff;font-size:11.5pt}
  .hero{padding:40px 20px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  section,.point{break-inside:auto}
  .card,.wes,.ill,.apply,.scripture,.q,.proclaim{break-inside:avoid;box-shadow:none;-webkit-print-color-adjust:exact;print-color-adjust:exact}
}
</style>
</head>
<body>
<header class="topbar">
  <div class="bar1">
    <div class="brand">${esc(meta.title)}<small>${esc(meta.church.replace("기독교대한감리회 ", ""))} · ${esc(kind)}</small></div>
    <nav class="docs" aria-label="자료 바꾸기">${docs.map(([n, h]) => `<a href="${encodeURI(h)}"${n === current ? ' aria-current="page"' : ""}>${n}</a>`).join("")}</nav>
    <div class="fsz" role="group" aria-label="글자 크기"><button type="button" data-fs="-1" aria-label="글자 작게">가−</button><button type="button" data-fs="1" aria-label="글자 크게">가+</button></div>
  </div>
  <nav class="bar2" aria-label="문서 안 이동">${navItems.map(([id, label]) => `<a href="#${id}">${esc(label)}</a>`).join("")}</nav>
</header>
${body}
<footer>${esc(meta.church)} · ${esc(meta.pastor)} · ${esc(meta.date)}<br>${esc(meta.mainText)} · ${esc(meta.subTexts)}</footer>
<button class="totop" type="button" aria-label="맨 위로">↑</button>
<script>
(function(){
  var links=[].slice.call(document.querySelectorAll(".bar2 a"));
  var map={};links.forEach(function(a){map[a.getAttribute("href").slice(1)]=a});
  var current=null;
  function setOn(id){if(current===id)return;current=id;links.forEach(function(a){a.classList.remove("on");a.removeAttribute("aria-current")});
    var a=map[id];if(a){a.classList.add("on");a.setAttribute("aria-current","location");
      var bar=a.parentNode;var l=a.offsetLeft-bar.clientWidth/2+a.clientWidth/2;bar.scrollTo({left:l,behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"})}}
  var targets=Object.keys(map).map(function(id){return document.getElementById(id)}).filter(Boolean);
  function onScroll(){var y=window.scrollY+140,id=targets.length?targets[0].id:null;
    targets.forEach(function(t){if(t.getBoundingClientRect().top+window.scrollY<=y)id=t.id});
    if(window.innerHeight+window.scrollY>=document.body.scrollHeight-4&&targets.length)id=targets[targets.length-1].id;
    setOn(id);top.classList.toggle("show",window.scrollY>600)}
  var top=document.querySelector(".totop");
  top.addEventListener("click",function(){window.scrollTo({top:0,behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"})});
  window.addEventListener("scroll",onScroll,{passive:true});onScroll();
  var root=document.documentElement,base=18,step=0;
  try{step=parseInt(localStorage.getItem("jiseok-fs")||"0",10)||0}catch(e){}
  function applyFs(){if(innerWidth>640)root.style.setProperty("--fs",(base+step*1.5)+"px")}
  applyFs();
  [].forEach.call(document.querySelectorAll(".fsz button"),function(b){b.addEventListener("click",function(){
    step=Math.max(-2,Math.min(4,step+parseInt(b.dataset.fs,10)));applyFs();try{localStorage.setItem("jiseok-fs",String(step))}catch(e){}})});
})();
</script>
</body>
</html>
`;
}

const hero = (kind) => `<div class="hero">
  <div class="kicker">${esc(meta.season)}</div>
  <h1>${esc(meta.title)}</h1>
  <p class="sub">${esc(meta.subtitle)}</p>
  <div class="meta"><span>${esc(kind)}</span><span>${esc(meta.date)}</span><span>주 본문 ${esc(meta.mainText)}</span><span>${esc(meta.subTexts)}</span><span>${esc(meta.pastor)}</span></div>
</div>`;

// ───────── 설교문
const sec = (id, eyebrow, title, inner) => `<section id="${id}"><p class="eyebrow">${eyebrow}</p><h2>${esc(title)}</h2>${inner}</section>`;
const wesCard = (src, en, ko, link) => `<div class="wes"><div class="hd">웨슬리의 음성<small>${esc(src)}</small></div><div class="en">${esc(en)}</div><div class="ko">${rich(ko)}</div><div class="lk">${ps([link])}</div></div>`;

const sumHtml = `<dl class="sumgrid">${summary.map(([k, v]) => `<div class="sumrow${k === "핵심 메시지" ? " big" : ""}"><dt>${esc(k)}</dt><dd>${rich(v)}</dd></div>`).join("")}</dl>
<h3>원문 들여다보기 — 핵심 단어</h3>
<div class="words">${words.map(([w, d]) => `<div class="word"><b>${esc(w)}</b><p>${rich(d)}</p></div>`).join("")}</div>`;

const orderHtml = `<div class="order">${order.map(([a, b, c]) => `<div class="orow${a === "설교" ? " hl" : ""}"><span class="k">${esc(a)}</span><span class="v">${esc(b) || "—"}</span><span class="w">${esc(c)}</span></div>`).join("")}</div>
<p class="note">찬송가 장수는 새찬송가 기준입니다. 교회 형편에 맞게 바꾸어 쓰십시오.</p>`;

const pointsHtml = sermon.points.map((p, i) => `<article class="point" id="p${i + 1}">
  <div class="phead"><div class="pnum">${esc(p.no.replace("대지", ""))}<br>대지</div><div><h2>${esc(p.title)}</h2><div class="pref">${esc(p.ref)}</div></div></div>
  <p class="key">${rich(p.keyLine)}</p>
  <div class="scripture"><div class="cap">본문 · 새번역</div>${verses(p.scripture)}</div>
  <div class="step">그때 그곳, 그리고 오늘 여기</div>
  <div class="prose">${ps(p.context)}</div>
  <div class="step">삶의 이야기</div>
  <div class="ill"><div class="tt">${esc(p.illTitle.replace("예화 — ", ""))}</div>${ps([p.illustration])}</div>
  <div class="step">신학의 창</div>
  ${wesCard(p.wesley.src, p.wesley.en, p.wesley.ko, p.wesley.link)}
  <div class="apply"><div class="tt">이번 주 삶으로</div><ul>${p.apply.map((t) => `<li>${rich(t)}</li>`).join("")}</ul></div>
</article>`).join("\n");

const decisionHtml = `<div class="prayer decision">${decision.map((l) => !l ? "" : l.endsWith(",") ? `<p class="h">${esc(l)}</p>` : l.includes("아멘") ? `<p class="amen">${esc(l)}</p>` : `<p>${esc(l)}</p>`).join("")}</div>`;

const sermonBody = `${hero("주일 설교문")}
<main>
${sec("summary", "AT A GLANCE", "한눈에 보는 설교", sumHtml)}
${sec("text", "THE TEXT", "오늘의 말씀, 쉬운 말로 읽기", `<div class="para">${ps(paraphrase)}</div><p class="note">본문 이해를 돕기 위해 누가복음 17:11-19를 오늘의 말로 풀어 쓴 것입니다. 봉독은 교회 강단 성경으로 해 주십시오.</p>`)}
${sec("order", "ORDER OF WORSHIP", "예배 순서", orderHtml)}
${sec("prayer", "PRAYER", "대표기도", `<div class="prayer">${ps(repPrayer)}</div>`)}
${sec("wesley", "THEOLOGY", "신학적 배경", `<p class="lead">${esc(theology.heading)}</p>${wesCard("「이성과 신앙의 사람들에게 드리는 더 깊은 호소」(1745)", theology.en.replace(/ \(A Farther.*$/, ""), theology.ko, theology.apply)}`)}
<section id="sermon"><div class="sermon-head"><p class="eyebrow">SERMON</p><p class="t">${esc(meta.title)}</p><p class="s">${esc(meta.subtitle)}</p><p class="r">${esc(meta.mainText)} · ${esc(meta.subTexts)}</p></div>
  <div id="intro" class="point" style="margin-top:40px"><p class="eyebrow">서론</p><h2>${esc(sermon.introTitle)}</h2><div class="prose">${ps(sermon.intro)}</div></div>
  ${pointsHtml}
  <div id="conclusion" class="point"><p class="eyebrow">결론</p><h2>${esc(sermon.conclusionTitle)}</h2>
    <div class="recap">${sermon.conclusion.summary.map((t, i) => `<div><b>${i + 1}</b><span>${rich(t.replace(/^(첫째|둘째|셋째), /, ""))}</span></div>`).join("")}</div>
    <div class="prose">${ps([sermon.conclusion.body])}</div>
    <div class="proclaim">${rich(sermon.conclusion.proclaim)}</div>
    <div class="prose">${ps([sermon.conclusion.invite])}</div>
  </div>
</section>
${sec("decision", "RESPONSE", "결단 기도 · 다같이 소리 내어", decisionHtml + `<h3>지석교회가 함께 실천할 일</h3><div class="comm">${sermon.community.map((t) => `<div>${rich(t)}</div>`).join("")}</div>`)}
${sec("notes", "FOR THE PASTOR", "목회자를 위한 참고 노트", `<ul class="notes">${sermon.notes.map((t) => `<li>${rich(t)}</li>`).join("")}</ul><div class="closing">${esc(closingNote)}</div>`)}
</main>`;

const sermonNav = [["summary", "요약"], ["text", "본문"], ["order", "예배 순서"], ["prayer", "대표기도"], ["wesley", "신학 배경"], ["intro", "서론"], ["p1", "1대지"], ["p2", "2대지"], ["p3", "3대지"], ["conclusion", "결론"], ["decision", "결단 기도"], ["notes", "참고 노트"]];
fs.writeFileSync(outSermon, page({ title: meta.title, kind: "주일 설교문", current: "설교문", navItems: sermonNav, body: sermonBody }));

// ───────── 소그룹 묵상 자료
let qn = 0;
const qBlock = (arr) => `<div class="qs">${arr.map((q) => `<div class="q"><span class="qn">Q${++qn}</span>${rich(q)}<div class="write" aria-hidden="true"></div></div>`).join("")}</div>`;
const groupBody = `${hero("소그룹 묵상 자료")}
<main>
${sec("open", "STEP 1", "마음 열기", qBlock([sg.opening]))}
${sec("read", "STEP 2", "말씀 읽기", `<div class="scripture"><div class="cap">${esc(sg.reading)} · 돌아가며 한 절씩</div>${verses(sg.readingText)}</div><h3>쉬운 말로 다시 읽기</h3><div class="para">${ps(paraphrase)}</div><p class="note">함께 읽으면 좋은 본문: ${esc(meta.subTexts)}</p>`)}
${sec("observe", "STEP 3", "관찰 — 본문에 무엇이 쓰여 있나요?", qBlock(sg.observe))}
${sec("interpret", "STEP 4", "해석 — 무슨 뜻일까요?", qBlock(sg.interpret))}
${sec("apply", "STEP 5", "적용 — 내 삶에서는?", qBlock(sg.apply))}
${sec("practice", "STEP 6", "한 주간 실천", `<div class="practice">${sg.practice.map((t) => `<div><span aria-hidden="true"></span><p style="margin:0">${rich(t)}</p></div>`).join("")}</div>`)}
${sec("pray", "STEP 7", "함께 드리는 기도 제목", `<div class="lines" aria-label="기도 제목 적는 칸"></div>`)}
<div class="leader">
${sec("guide", "LEADER'S GUIDE", "인도자 가이드 — 질문의 의도", `<div class="guide">${sg.leader.map(([k, v]) => `<div><b>${esc(k)}</b><span>${rich(v)}</span></div>`).join("")}</div>`)}
${sec("time", "LEADER'S GUIDE", "시간 배분 (60분)", `<div class="timing">${sg.timing.map(([k, v]) => `<div><b>${esc(v)}</b>${esc(k)}</div>`).join("")}</div>`)}
${sec("caution", "LEADER'S GUIDE", "신학적으로 살필 점", `<ul class="notes">${sg.cautions.map((t) => `<li>${rich(t)}</li>`).join("")}</ul>`)}
</div>
</main>`;
const groupNav = [["open", "마음 열기"], ["read", "말씀 읽기"], ["observe", "관찰"], ["interpret", "해석"], ["apply", "적용"], ["practice", "실천"], ["pray", "기도 제목"], ["guide", "인도자 가이드"], ["time", "시간 배분"], ["caution", "살필 점"]];
fs.writeFileSync(outGroup, page({ title: `${meta.title} — 소그룹 묵상`, kind: "소그룹 묵상 자료", current: "소그룹 묵상", navItems: groupNav, body: groupBody }));
console.log("written", outSermon, outGroup);
