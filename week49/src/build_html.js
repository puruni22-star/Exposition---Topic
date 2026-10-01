// 제49주 설교문 HTML 생성 (단일 파일, CSS 인라인)
// 사용: node build_html.js <출력경로.html>
const fs = require("fs");
const { meta, part1, part2, wesleySources } = require("./sermon49.js");

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const nl = (s) => esc(s).split("\n").join("<br>");

let toc = [];
let body = "";
let h2i = 0;
for (const b of part2) {
  switch (b.t) {
    case "h1": body += `<h1 class="s-title">${esc(b.text)}</h1>`; break;
    case "sub": body += `<p class="s-sub">${esc(b.text)}</p>`; break;
    case "h2": {
      const id = "sec" + ++h2i;
      toc.push([id, b.text.split(" — ")[0]]);
      body += `<h2 id="${id}" class="${b.num ? "point" : ""}">${b.num ? `<span class="badge">${b.num}</span>` : ""}${esc(b.text)}</h2>`;
      break;
    }
    case "label":
      body += `<table class="label">${b.items.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join("")}</table>`;
      break;
    case "scripture":
      body += `<table class="box scripture"><tr><td><div class="ref">✦ ${esc(b.ref)}</div>${b.text.split("\n").map((l) => `<p>${esc(l)}</p>`).join("")}</td></tr></table>`;
      break;
    case "note": body += `<p class="note">※ ${esc(b.text)}</p>`; break;
    case "p": body += `<p>${esc(b.text)}</p>`; break;
    case "insight":
      body += `<table class="box insight"><tr><td><div class="ttl">🔍 ${esc(b.title)}</div><p>${esc(b.text)}</p></td></tr></table>`;
      break;
    case "wesley":
      body += `<table class="wesley"><thead><tr><th><span class="wl">📖 웨슬리의 음성</span> <span class="ws">표준설교 ${b.no}편 「${esc(b.title)}」 ${esc(b.sec)}</span></th></tr></thead>
<tbody><tr class="en"><td><div class="lab">원문</div><p lang="en"><em>${esc(b.en)}</em></p></td></tr>
<tr><td><div class="lab">우리말 번역</div><p>${esc(b.ko)}</p></td></tr>
<tr class="en"><td><div class="lab">오늘 본문과의 연결</div><p>${esc(b.link)}</p></td></tr></tbody></table>`;
      break;
    case "apply":
      body += `<table class="apply"><thead><tr><th>✔ ${esc(b.title)}</th></tr></thead><tbody>${b.items.map((it) => `<tr><td>${esc(it)}</td></tr>`).join("")}</tbody></table>`;
      break;
    case "key": body += `<div class="key" role="note">${esc(b.text)}</div>`; break;
    case "prayer": body += `<div class="prayer"><div class="ttl">🙏 마침 기도</div>${b.text.split("\n").map((l) => `<p>${esc(l)}</p>`).join("")}</div>`; break;
    case "closing": body += `<p class="closing">${esc(b.text)}</p>`; break;
  }
}

const p1 = `<table class="summary">${part1.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${nl(v)}</td></tr>`).join("")}</table>`;
const src = wesleySources.map((w) => `<li>표준설교 ${w.no}편 「${esc(w.title)}」 ${esc(w.sec)} — <a href="${w.url}" target="_blank" rel="noopener">Wesley Center Online</a></li>`).join("");

const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${meta.series}(${meta.week}) 제${meta.week}주 설교문 — ${esc(meta.title)}</title>
<style>
:root{--navy:#1B3A6B;--navy-t:#EAF0F8;--soft:#F4F7FA;--gold:#B8960C;--gold-d:#9C6500;--cream:#FFF7EC;--green:#2E6B3A;--green-t:#EFF5EA;--ink:#222;--gray:#666;--paper:#FBFAF6;--line:#C9D3E0}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
body{margin:0;background:var(--paper);color:var(--ink);font-family:"Pretendard","Noto Sans KR","Malgun Gothic","Apple SD Gothic Neo",sans-serif;font-size:17px;line-height:1.85;word-break:keep-all;overflow-wrap:break-word}
nav.toc{position:sticky;top:0;z-index:10;background:rgba(27,58,107,.97);box-shadow:0 2px 8px rgba(0,0,0,.15)}
nav.toc ul{list-style:none;margin:0 auto;padding:0 12px;max-width:980px;display:flex;gap:4px;overflow-x:auto;scrollbar-width:thin}
nav.toc a{display:block;white-space:nowrap;color:#E8EEF7;text-decoration:none;padding:11px 10px;font-size:14px;border-bottom:3px solid transparent}
nav.toc a:hover,nav.toc a:focus-visible,nav.toc a.on{color:#fff;border-bottom-color:var(--gold);outline:none}
.wrap{max-width:820px;margin:0 auto;padding:0 18px 80px}
header.cover{background:var(--navy);color:#fff;text-align:center;padding:56px 22px 46px;border-bottom:6px solid var(--gold)}
header.cover .kicker{color:#E9D9A6;letter-spacing:.12em;font-size:14px;font-weight:700}
header.cover h1{font-family:"Noto Serif KR","Nanum Myeongjo",serif;font-size:clamp(26px,5vw,40px);line-height:1.35;margin:14px 0 8px}
header.cover .theme{font-size:18px;margin:0 0 18px}
header.cover .meta{font-size:14px;color:#DDE6F2;margin:4px 0}
.part{margin:44px 0 18px;border-bottom:3px solid var(--gold);padding-bottom:6px}
.part small{display:block;color:var(--gold);font-weight:700;letter-spacing:.08em}
.part b{font-size:26px;color:var(--navy);font-family:"Noto Serif KR",serif}
table{border-collapse:collapse;width:100%}
table.summary th,table.summary td{border:1px solid var(--line);padding:10px 12px;vertical-align:top;font-size:15px;line-height:1.7;text-align:left}
table.summary th{background:var(--navy-t);color:var(--navy);width:28%}
.s-title{font-family:"Noto Serif KR",serif;color:var(--navy);text-align:center;font-size:clamp(24px,4.4vw,34px);margin:30px 0 4px;line-height:1.4}
.s-sub{text-align:center;color:var(--gold-d);margin:0 0 26px}
h2{color:var(--navy);font-size:21px;margin:42px 0 16px;padding-bottom:6px;border-bottom:1px solid var(--line);scroll-margin-top:60px;line-height:1.5}
h2.point{font-size:23px;border-bottom:3px solid var(--gold)}
.badge{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:var(--gold);color:#fff;font-size:18px;margin-right:10px;vertical-align:middle}
p{margin:0 0 16px}
table.label th{background:var(--navy);color:#fff;padding:9px 12px;width:28%;text-align:left}
table.label td{background:var(--navy-t);color:var(--navy);font-weight:700;padding:9px 12px}
table.label th,table.label td{border:1px solid var(--navy)}
table.box{margin:18px 0 22px}
table.box td{padding:16px 20px}
.scripture td{background:var(--navy-t);color:var(--navy);border:1px solid var(--navy);border-left:7px solid var(--navy)}
.scripture .ref{font-weight:700;margin-bottom:6px}
.scripture p{margin:0 0 8px;font-size:16px}
.insight td{background:var(--soft);border:1px solid var(--line);border-left:6px solid #6F8BB3;color:#2A3B55;font-size:15.5px}
.insight .ttl{font-weight:700;color:var(--navy);margin-bottom:4px}
.insight p{margin:0}
.note{color:var(--gray);font-style:italic;font-size:14.5px}
table.wesley{margin:24px 0 28px;border:2px solid var(--gold);box-shadow:0 3px 10px rgba(184,150,12,.15)}
table.wesley th{background:var(--gold);color:#fff;text-align:left;padding:12px 18px;font-weight:400}
.wl{font-weight:700;font-size:17px;margin-right:6px}.ws{font-size:14.5px}
table.wesley td{padding:12px 18px;border-top:1px solid var(--gold);background:#fff}
table.wesley tr.en td{background:var(--cream)}
table.wesley .lab{font-size:13px;font-weight:700;color:var(--gold-d)}
table.wesley p{margin:2px 0 0}
table.wesley em{color:#5A4300}
table.apply{margin:22px 0 26px;border:1px solid var(--green)}
table.apply th{background:var(--green);color:#fff;text-align:left;padding:11px 18px}
table.apply td{background:var(--green-t);color:#1F4A28;padding:11px 18px;border-top:1px solid #C7DBBE}
.key{background:var(--navy);color:#fff;font-weight:700;font-size:19px;text-align:center;padding:24px 22px;margin:26px 0 30px;border-top:4px solid var(--gold);border-bottom:4px solid var(--gold);line-height:1.6}
.prayer{background:#FAF6EE;border:1px solid #D9CBB0;border-radius:6px;padding:24px 26px;margin:10px 0 26px}
.prayer .ttl{color:var(--gold-d);font-weight:700;margin-bottom:10px}
.prayer p{margin:0 0 8px}
.closing{color:var(--gray);font-style:italic;font-size:14.5px;border-top:1px solid var(--line);padding-top:12px;margin-top:28px}
.sources{font-size:13.5px;color:var(--gray);margin-top:22px}
.sources a{color:var(--navy)}
#top{position:fixed;right:16px;bottom:18px;width:46px;height:46px;border-radius:50%;border:none;background:var(--gold);color:#fff;font-size:20px;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.2);opacity:0;pointer-events:none;transition:opacity .2s}
#top.show{opacity:1;pointer-events:auto}
#top:focus-visible{outline:3px solid var(--navy);outline-offset:2px}
@media (max-width:600px){body{font-size:16px}table.summary th{width:34%}table.summary th,table.summary td{padding:8px;font-size:14px}h2.point{font-size:20px}.key{font-size:17px}}
@media print{nav.toc,#top{display:none}body{background:#fff}}
</style>
</head>
<body>
<nav class="toc" aria-label="설교 목차"><ul>
<li><a href="#summary">정보 요약</a></li>
${toc.map(([id, t]) => `<li><a href="#${id}">${esc(t)}</a></li>`).join("\n")}
</ul></nav>
<header class="cover">
<div class="kicker">${meta.series.toUpperCase()} · 제${meta.week}주</div>
<h1>${esc(meta.title)}</h1>
<p class="theme">${esc(meta.theme)}</p>
<p class="meta">주 본문 ${esc(meta.mainText)} | 보조 본문 ${esc(meta.subTexts)}</p>
<p class="meta">${esc(meta.date)} | ${esc(meta.church)} | ${esc(meta.pastor)}</p>
</header>
<main class="wrap">
<div class="part" id="summary"><small>PART 1</small><b>설교 정보 요약</b></div>
${p1}
<div class="part"><small>PART 2</small><b>설교문 전체</b></div>
${body}
<div class="sources"><b>웨슬리 인용 출처</b><ul>${src}</ul></div>
</main>
<button id="top" type="button" aria-label="맨 위로 이동">↑</button>
<script>
(function(){
  var links=[].slice.call(document.querySelectorAll('nav.toc a'));
  var secs=links.map(function(a){return document.querySelector(a.getAttribute('href'));});
  var topBtn=document.getElementById('top');
  function spy(){
    var y=window.scrollY+90,cur=0;
    secs.forEach(function(s,i){if(s&&s.offsetTop<=y)cur=i;});
    links.forEach(function(a,i){a.classList.toggle('on',i===cur);if(i===cur)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');});
    topBtn.classList.toggle('show',window.scrollY>500);
  }
  window.addEventListener('scroll',spy,{passive:true});spy();
  topBtn.addEventListener('click',function(){window.scrollTo({top:0});document.querySelector('nav.toc a').focus({preventScroll:true});});
})();
</script>
</body>
</html>`;
fs.writeFileSync(process.argv[2], html);
console.log("written", process.argv[2], html.length);
