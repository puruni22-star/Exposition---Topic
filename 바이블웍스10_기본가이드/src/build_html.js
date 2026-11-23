// 바이블웍스 10 기본 가이드 — HTML(상단 내비게이션) 생성
// 사용: node build_html.js <출력경로.html>
const fs = require("fs");
const { meta, chapters, cheatsheet } = require("./content.js");

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// `백틱` → <code>
const inline = (s) => esc(s).replace(/`([^`]+)`/g, '<code class="k">$1</code>');

function block(b) {
  switch (b.t) {
    case "p": return `<p>${inline(b.text)}</p>`;
    case "h": return `<h3>${inline(b.text)}</h3>`;
    case "steps":
      return `<ol class="steps">${b.items.map((it) => `<li><span>${inline(it)}</span></li>`).join("")}</ol>`;
    case "list":
      return `<ul class="checks">${b.items.map((it) => `<li>${inline(it)}</li>`).join("")}</ul>`;
    case "table": {
      const cols = b.widths ? `<colgroup>${b.widths.map((w) => `<col style="width:${w}%">`).join("")}</colgroup>` : "";
      return `<div class="tbl"><table>${cols}<thead><tr>${b.head.map((h) => `<th>${inline(h)}</th>`).join("")}</tr></thead><tbody>${b.rows
        .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    }
    case "cmd":
      return `<div class="cmd">${b.rows
        .map(([c, d]) => `<div class="cmd-row"><code>${esc(c)}</code><span>${inline(d)}</span></div>`).join("")}</div>`;
    case "tip": case "warn": case "key": {
      const label = { tip: "도움말", warn: "주의", key: "핵심" }[b.t];
      return `<aside class="note ${b.t}"><div class="note-label">${label}</div><div><strong>${inline(b.title)}</strong><p>${inline(b.text)}</p></div></aside>`;
    }
    default: throw new Error("unknown block " + b.t);
  }
}

const navItems = [
  ...chapters.map((c) => ({ id: c.id, no: c.no, label: c.nav })),
  { id: cheatsheet.id, no: "+", label: cheatsheet.nav },
];

const sections = chapters.map((c) => `
<section id="${c.id}" class="chapter">
  <header class="ch-head">
    <span class="ch-no">${c.no}</span>
    <div><p class="ch-kicker">CHAPTER ${c.no}</p><h2>${esc(c.title)}</h2></div>
  </header>
  <p class="lead">${inline(c.lead)}</p>
  ${c.blocks.map(block).join("\n  ")}
</section>`).join("\n");

const appendix = `
<section id="${cheatsheet.id}" class="chapter appendix">
  <header class="ch-head">
    <span class="ch-no">+</span>
    <div><p class="ch-kicker">APPENDIX</p><h2>${esc(cheatsheet.title)}</h2></div>
  </header>
  <p class="lead">자주 쓰는 명령만 한 장에 모았습니다. 출력해 모니터 옆에 붙여 두고 활용하세요.</p>
  <div class="cheat">
    ${cheatsheet.groups.map((g) => `<div class="cheat-card"><h4>${esc(g.name)}</h4>${g.rows
      .map(([c, d]) => `<div class="cheat-row"><code>${esc(c)}</code><span>${esc(d)}</span></div>`).join("")}</div>`).join("\n    ")}
  </div>
</section>`;

const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>바이블웍스 10 기본 가이드</title>
<meta name="description" content="${esc(meta.subtitle)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;800&family=Noto+Serif+KR:wght@500;700;900&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#FBFAF7; --paper:#FFFFFF; --ink:#1E2430; --muted:#5D6675; --line:#E4E1D9;
  --navy:#1B3A6B; --navy-2:#2A5298; --navy-soft:#EEF3FA; --gold:#B8860B; --gold-soft:#FBF4E2;
  --green:#2E6B3A; --green-soft:#EDF5EC; --red:#A6402F; --red-soft:#FBEDEA;
  --code-bg:#F1EFE9; --code-ink:#1B3A6B; --nav-bg:rgba(251,250,247,.88); --on-navy:#FFFFFF; --shadow:0 1px 2px rgba(20,30,50,.05),0 8px 24px rgba(20,30,50,.06);
  color-scheme: light;
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    --bg:#12151B; --paper:#191D25; --ink:#E7E9EE; --muted:#A3ABB8; --line:#2C323D;
    --navy:#8FB2EA; --navy-2:#A9C4F0; --navy-soft:#1D2840; --gold:#E0B85A; --gold-soft:#2B2618;
    --green:#86C792; --green-soft:#18291C; --red:#EE9C8C; --red-soft:#33201C;
    --code-bg:#232935; --code-ink:#BCD1F5; --nav-bg:rgba(18,21,27,.86); --on-navy:#0E1420; --shadow:0 1px 2px rgba(0,0,0,.3),0 8px 24px rgba(0,0,0,.25);
    color-scheme: dark;
  }
}
:root[data-theme="dark"]{
  --bg:#12151B; --paper:#191D25; --ink:#E7E9EE; --muted:#A3ABB8; --line:#2C323D;
  --navy:#8FB2EA; --navy-2:#A9C4F0; --navy-soft:#1D2840; --gold:#E0B85A; --gold-soft:#2B2618;
  --green:#86C792; --green-soft:#18291C; --red:#EE9C8C; --red-soft:#33201C;
  --code-bg:#232935; --code-ink:#BCD1F5; --nav-bg:rgba(18,21,27,.86); --on-navy:#0E1420; --shadow:0 1px 2px rgba(0,0,0,.3),0 8px 24px rgba(0,0,0,.25);
  color-scheme: dark;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth;scroll-padding-top:76px}
body{margin:0;background:var(--bg);color:var(--ink);font-family:"Noto Sans KR",system-ui,sans-serif;font-size:17px;line-height:1.8;word-break:keep-all;overflow-wrap:break-word;-webkit-font-smoothing:antialiased}
a{color:inherit}

/* ── 상단 내비게이션 ── */
.topnav{position:sticky;top:0;z-index:50;background:var(--nav-bg);backdrop-filter:saturate(1.4) blur(12px);-webkit-backdrop-filter:saturate(1.4) blur(12px);border-bottom:1px solid var(--line)}
.topnav-inner{max-width:1180px;margin:0 auto;display:flex;align-items:center;gap:16px;height:60px;padding:0 20px}
.brand{display:flex;align-items:center;gap:10px;text-decoration:none;font-weight:800;font-size:15px;white-space:nowrap;color:var(--navy)}
.brand-mark{width:28px;height:28px;border-radius:8px;background:var(--navy);color:var(--on-navy);display:grid;place-items:center;font-family:"Noto Serif KR",serif;font-size:14px}
.navlinks{display:flex;gap:2px;overflow-x:auto;scrollbar-width:none;flex:1;min-width:0;mask-image:linear-gradient(90deg,#000 92%,transparent)}
.navlinks::-webkit-scrollbar{display:none}
.navlinks a{flex:none;text-decoration:none;font-size:14px;font-weight:500;color:var(--muted);padding:7px 11px;border-radius:999px;transition:background .2s,color .2s;white-space:nowrap}
.navlinks a small{font-family:"JetBrains Mono",monospace;font-size:11px;margin-right:5px;opacity:.7}
.navlinks a:hover{color:var(--ink);background:var(--navy-soft)}
.navlinks a.active{color:var(--on-navy);background:var(--navy)}
.theme-btn{flex:none;border:1px solid var(--line);background:var(--paper);color:var(--ink);width:36px;height:36px;border-radius:10px;cursor:pointer;display:grid;place-items:center;padding:0}
.progress{position:absolute;left:0;bottom:-1px;height:2px;background:var(--gold);width:0}

/* ── 표지 ── */
.hero{max-width:1180px;margin:0 auto;padding:88px 20px 56px}
.hero-card{position:relative;overflow:hidden;background:linear-gradient(135deg,#16305A 0%,#1B3A6B 55%,#2A5298 100%);color:#fff;border-radius:24px;padding:64px 56px;box-shadow:var(--shadow)}
.hero-card::after{content:"";position:absolute;right:-80px;top:-80px;width:340px;height:340px;border-radius:50%;border:1px solid rgba(255,255,255,.14);box-shadow:0 0 0 40px rgba(255,255,255,.03),0 0 0 90px rgba(255,255,255,.025)}
.eyebrow{display:inline-block;font-size:13px;letter-spacing:.14em;color:#F3D489;border:1px solid rgba(243,212,137,.45);padding:4px 12px;border-radius:999px;margin-bottom:24px}
.hero h1{font-family:"Noto Serif KR",serif;font-weight:900;font-size:clamp(32px,5.4vw,56px);line-height:1.25;margin:0 0 16px;letter-spacing:-.01em}
.hero .sub{font-size:clamp(16px,2.2vw,20px);opacity:.9;margin:0 0 36px;max-width:640px}
.hero-meta{display:flex;flex-wrap:wrap;gap:10px 24px;font-size:14px;opacity:.82}
.hero-meta a{color:#F3D489}
.intro{max-width:780px;margin:48px auto 0;padding:0 4px}
.intro p{margin:0 0 14px;font-size:18px}
.howto{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:28px}
.howto div{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:16px 18px;font-size:15px;line-height:1.65}
.howto b{display:block;color:var(--navy);margin-bottom:4px}
.toc{max-width:780px;margin:40px auto 0;background:var(--paper);border:1px solid var(--line);border-radius:18px;padding:26px 30px;box-shadow:var(--shadow)}
.toc h2{font-family:"Noto Serif KR",serif;font-size:20px;margin:0 0 12px}
.toc ol{list-style:none;margin:0;padding:0;columns:2;column-gap:32px}
.toc li{break-inside:avoid;padding:7px 0;border-bottom:1px dashed var(--line)}
.toc a{text-decoration:none;display:flex;gap:12px}
.toc a:hover span:last-child{color:var(--navy)}
.toc .n{font-family:"JetBrains Mono",monospace;color:var(--gold);font-weight:700;font-size:14px;padding-top:3px}

/* ── 본문 ── */
main{max-width:780px;margin:0 auto;padding:0 20px 80px}
.chapter{padding-top:72px}
.ch-head{display:flex;align-items:center;gap:18px;margin-bottom:18px;padding-bottom:18px;border-bottom:2px solid var(--navy)}
.ch-no{flex:none;width:58px;height:58px;border-radius:16px;background:var(--navy);color:var(--on-navy);display:grid;place-items:center;font-family:"Noto Serif KR",serif;font-weight:900;font-size:24px}
.ch-kicker{margin:0;font-family:"JetBrains Mono",monospace;font-size:12px;letter-spacing:.16em;color:var(--gold);font-weight:700}
.chapter h2{font-family:"Noto Serif KR",serif;font-size:clamp(24px,3.6vw,31px);line-height:1.35;margin:2px 0 0;letter-spacing:-.01em}
.lead{font-size:18.5px;color:var(--muted);margin:0 0 8px}
.chapter h3{font-size:19px;margin:38px 0 10px;padding-left:14px;border-left:4px solid var(--gold);line-height:1.5}
.chapter p{margin:0 0 14px}
code.k{font-family:"JetBrains Mono",monospace;font-size:.86em;background:var(--code-bg);color:var(--code-ink);padding:2px 7px;border-radius:6px;font-weight:700;white-space:nowrap}

.tbl{overflow-x:auto;margin:16px 0 20px;border:1px solid var(--line);border-radius:14px;background:var(--paper)}
table{width:100%;border-collapse:collapse;font-size:15.5px;line-height:1.65;min-width:460px}
th{background:var(--navy-soft);color:var(--navy);text-align:left;font-weight:700;padding:12px 16px;border-bottom:1px solid var(--line)}
td{padding:12px 16px;border-bottom:1px solid var(--line);vertical-align:top}
tr:last-child td{border-bottom:0}
td:first-child{font-weight:600}

.steps{list-style:none;counter-reset:s;margin:16px 0 22px;padding:0}
.steps li{counter-increment:s;position:relative;padding:0 0 16px 50px}
.steps li::before{content:counter(s);position:absolute;left:0;top:1px;width:32px;height:32px;border-radius:50%;background:var(--paper);border:2px solid var(--navy);color:var(--navy);font-weight:800;font-size:14px;display:grid;place-items:center}
.steps li:not(:last-child)::after{content:"";position:absolute;left:15px;top:36px;bottom:2px;width:2px;background:var(--line)}

.checks{list-style:none;padding:0;margin:14px 0 22px}
.checks li{position:relative;padding:10px 14px 10px 46px;background:var(--paper);border:1px solid var(--line);border-radius:12px;margin-bottom:8px}
.checks li::before{content:"✓";position:absolute;left:14px;top:10px;width:22px;height:22px;border-radius:6px;background:var(--green-soft);color:var(--green);font-weight:800;display:grid;place-items:center;font-size:13px;margin-top:3px}

.cmd{margin:16px 0 22px;border-radius:14px;overflow:hidden;border:1px solid var(--line);background:var(--paper)}
.cmd-row{display:grid;grid-template-columns:minmax(120px,190px) 1fr;align-items:center;border-bottom:1px solid var(--line)}
.cmd-row:last-child{border-bottom:0}
.cmd-row code{font-family:"JetBrains Mono",monospace;font-weight:700;font-size:15px;color:var(--code-ink);background:var(--code-bg);padding:12px 16px;height:100%;display:flex;align-items:center}
.cmd-row span{padding:12px 16px;font-size:15.5px}

.note{display:flex;gap:14px;border-radius:14px;padding:18px 20px;margin:20px 0 24px;border:1px solid transparent}
.note-label{flex:none;font-size:12px;font-weight:800;letter-spacing:.06em;padding:3px 10px;border-radius:999px;height:fit-content;margin-top:2px}
.note strong{display:block;margin-bottom:4px;font-size:16px}
.note p{margin:0;font-size:15.5px;line-height:1.75}
.note.tip{background:var(--green-soft);border-color:color-mix(in srgb,var(--green) 22%,transparent)}
.note.tip .note-label{background:var(--green);color:var(--paper)}
.note.warn{background:var(--red-soft);border-color:color-mix(in srgb,var(--red) 22%,transparent)}
.note.warn .note-label{background:var(--red);color:var(--paper)}
.note.key{background:var(--gold-soft);border-color:color-mix(in srgb,var(--gold) 30%,transparent)}
.note.key .note-label{background:var(--gold);color:var(--paper)}

.cheat{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:18px}
.cheat-card{background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:18px 18px 8px;box-shadow:var(--shadow)}
.cheat-card h4{margin:0 0 10px;font-size:15px;color:var(--navy)}
.cheat-row{display:flex;flex-direction:column;padding:8px 0;border-top:1px dashed var(--line)}
.cheat-row code{font-family:"JetBrains Mono",monospace;font-weight:700;color:var(--code-ink);font-size:14.5px}
.cheat-row span{font-size:14px;color:var(--muted)}

footer{border-top:1px solid var(--line);padding:36px 20px 56px;text-align:center;color:var(--muted);font-size:14px;line-height:1.8}
footer a{color:var(--navy)}
.totop{position:fixed;right:18px;bottom:18px;width:44px;height:44px;border-radius:50%;border:1px solid var(--line);background:var(--paper);color:var(--navy);box-shadow:var(--shadow);font-size:18px;cursor:pointer;opacity:0;pointer-events:none;transition:opacity .25s}
.totop.show{opacity:1;pointer-events:auto}

@media (max-width:720px){
  body{font-size:16px}
  .topnav-inner{padding:0 12px;gap:10px}
  .brand-text{display:none}
  .hero{padding:24px 16px 32px}
  .hero-card{padding:40px 24px;border-radius:18px}
  .howto{grid-template-columns:1fr}
  .toc{padding:20px}
  .toc ol{columns:1}
  main{padding:0 16px 64px}
  .chapter{padding-top:52px}
  .ch-no{width:46px;height:46px;font-size:19px;border-radius:12px}
  .lead{font-size:17px}
  .cmd-row{grid-template-columns:1fr}
  .cmd-row code{padding:10px 14px 4px;background:transparent}
  .cmd-row span{padding:0 14px 12px}
  .cheat{grid-template-columns:1fr}
  .note{flex-direction:column;gap:8px}
}
@media print{
  .topnav,.totop,.theme-btn{display:none}
  body{background:#fff;font-size:11pt}
  .hero{padding:0}
  .hero-card{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .chapter{break-before:page;padding-top:0}
  .note,.tbl,.cmd,.cheat-card,.steps li{break-inside:avoid}
}
</style>
</head>
<body>
<nav class="topnav" aria-label="목차">
  <div class="topnav-inner">
    <a class="brand" href="#top"><span class="brand-mark">B</span><span class="brand-text">바이블웍스 10 가이드</span></a>
    <div class="navlinks">
      ${navItems.map((n) => `<a href="#${n.id}" data-id="${n.id}"><small>${n.no}</small>${esc(n.label)}</a>`).join("\n      ")}
    </div>
    <button class="theme-btn" id="themeBtn" type="button" aria-label="밝기 모드 전환"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor"/></svg></button>
  </div>
  <div class="progress" id="progress"></div>
</nav>

<header class="hero" id="top">
  <div class="hero-card">
    <span class="eyebrow">${esc(meta.series)}</span>
    <h1>${esc(meta.title)}</h1>
    <p class="sub">${esc(meta.subtitle)}</p>
    <div class="hero-meta">
      <span>${esc(meta.editor)} 정리</span><span>${esc(meta.date)}</span>
      <a href="${meta.sourceUrl}" target="_blank" rel="noopener">원 강의 영상 보기 ↗</a>
    </div>
  </div>
  <div class="intro">
    ${meta.intro.map((p) => `<p>${inline(p)}</p>`).join("\n    ")}
    <div class="howto">
      ${meta.howto.map(([a, b]) => `<div><b>${esc(a)}</b>${inline(b)}</div>`).join("\n      ")}
    </div>
  </div>
  <div class="toc">
    <h2>차례</h2>
    <ol>
      ${navItems.map((n) => {
        const c = chapters.find((x) => x.id === n.id);
        return `<li><a href="#${n.id}"><span class="n">${n.no}</span><span>${esc(c ? c.title : cheatsheet.title)}</span></a></li>`;
      }).join("\n      ")}
    </ol>
  </div>
</header>

<main>
${sections}
${appendix}
</main>

<footer>
  ${esc(meta.source)}<br>
  <a href="${meta.sourceUrl}" target="_blank" rel="noopener">${meta.sourceUrl}</a><br>
  원 강의 내용을 바탕으로 누구나 따라 할 수 있도록 재구성·정리했습니다. 메뉴 이름은 프로그램 버전과 설정에 따라 조금 다를 수 있습니다.
</footer>
<button class="totop" id="totop" type="button" aria-label="맨 위로">↑</button>

<script>
(function(){
  var root=document.documentElement, KEY="bw10-theme";
  try{var saved=localStorage.getItem(KEY); if(saved) root.setAttribute("data-theme",saved);}catch(e){}
  document.getElementById("themeBtn").addEventListener("click",function(){
    var cur=root.getAttribute("data-theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");
    var next=cur==="dark"?"light":"dark"; root.setAttribute("data-theme",next);
    try{localStorage.setItem(KEY,next);}catch(e){}
  });
  var links=[].slice.call(document.querySelectorAll(".navlinks a"));
  var secs=links.map(function(a){return document.getElementById(a.dataset.id);});
  var bar=document.getElementById("progress"), top=document.getElementById("totop"), current=null;
  function onScroll(){
    var y=window.scrollY, h=document.documentElement.scrollHeight-innerHeight;
    bar.style.width=(h>0?y/h*100:0)+"%";
    top.classList.toggle("show",y>600);
    var id=null;
    secs.forEach(function(s){ if(s && s.getBoundingClientRect().top<140) id=s.id; });
    if(id!==current){
      current=id;
      links.forEach(function(a){
        var on=a.dataset.id===id; a.classList.toggle("active",on);
        if(on){ var nav=a.parentNode; nav.scrollTo({left:a.offsetLeft-nav.clientWidth/2+a.offsetWidth/2,behavior:"smooth"}); }
      });
    }
  }
  addEventListener("scroll",onScroll,{passive:true}); onScroll();
  top.addEventListener("click",function(){scrollTo({top:0,behavior:"smooth"});});
})();
</script>
</body>
</html>
`;

const outPath = process.argv[2] || "out.html";
fs.writeFileSync(outPath, html);
console.log("wrote", outPath);
