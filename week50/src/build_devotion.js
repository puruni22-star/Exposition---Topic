// 제50주간 매일 묵상집 HTML 생성 (단일 파일, CSS·JS 인라인, 외부 리소스 없음)
// 사용: node build_devotion.js <출력경로.html>
const fs = require("fs");
const { meta, intro, week, days, closing } = require("./devotion50.js");

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const paras = (arr) => arr.map((p) => `<p>${esc(p)}</p>`).join("");

const nav = [["guide", "안내"], ...days.map((d) => [d.id, d.nav]), ["end", "마침"]];

const dayHtml = (d, i) => `
<section class="day" id="${d.id}" aria-labelledby="${d.id}-t">
  <div class="day-head">
    <div class="date">${esc(d.date)}</div>
    <h2 id="${d.id}-t"><span class="dno">DAY ${i + 1}</span>${esc(d.title)}</h2>
    <p class="theme">${esc(d.theme)}</p>
  </div>

  <div class="blk scripture">
    <h3>📖 오늘 읽을 성경 본문</h3>
    <p class="refs"><b>${esc(d.text)}</b> <span>함께 읽기 · ${esc(d.sub)}</span></p>
    ${d.passage.split("\n").map((l) => `<p class="verse">${esc(l)}</p>`).join("")}
    <p class="small">본문은 묵상을 돕기 위해 원문의 뜻을 현대 한국어로 풀어 쓴 표현입니다.</p>
  </div>

  <div class="blk hymn">
    <h3>🎵 오늘의 찬송 · 새찬송가 ${d.hymn.no}장 「${esc(d.hymn.title)}」</h3>
    <p><b>찬송 선택 이유</b> — ${esc(d.hymn.why)}</p>
  </div>

  <div class="blk bg">
    <h3>🏛 본문 배경</h3>
    ${paras(d.background)}
  </div>

  <div class="blk word">
    <h3>📜 원문 들여다보기</h3>
    ${d.words.map((w) => `
    <div class="wcard">
      <p class="wtitle"><b>${esc(w.tr)}</b> <span class="orig" lang="${/[\u0590-\u05FF]/.test(w.orig) ? "he" : "el"}">${esc(w.orig)}</span> — ${esc(w.basic)}</p>
      <table class="wtab">
        <tr><th scope="row">한글 음역</th><td>${esc(w.tr)}</td></tr>
        <tr><th scope="row">원어 표기</th><td class="orig">${esc(w.orig)}</td></tr>
        <tr><th scope="row">기본 의미</th><td>${esc(w.basic)}</td></tr>
        <tr><th scope="row">본문에서의 의미</th><td>${esc(w.inText)}</td></tr>
        <tr><th scope="row">오늘의 주제와 연결</th><td>${esc(w.today)}</td></tr>
      </table>
    </div>`).join("")}
    <p class="wnote">${esc(d.wordNote)}</p>
  </div>

  <div class="blk med">
    <h3>🌿 오늘의 묵상</h3>
    ${paras(d.meditation)}
  </div>

  <div class="blk wesley">
    <h3>✝ 웨슬리 신학 코너 — ${esc(d.wesleyTitle)}</h3>
    ${paras(d.wesley)}
  </div>

  <div class="blk qs">
    <h3>💬 묵상 질문</h3>
    <ol>${d.questions.map((q) => `<li>${esc(q)}</li>`).join("")}</ol>
  </div>

  <div class="blk act">
    <h3>✔ 오늘의 실천</h3>
    <ul>${d.practice.map((q) => `<li>${esc(q)}</li>`).join("")}</ul>
  </div>

  <div class="blk prayer">
    <h3>🙏 오늘의 기도</h3>
    <p>${esc(d.prayer)}</p>
  </div>
  ${d.bridgeNext ? `<p class="bridge">→ ${esc(d.bridgeNext)}</p>` : ""}
</section>`;

const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(meta.title)}</title>
<style>
:root{--forest:#2F5D46;--forest-d:#1F4232;--forest-t:#EAF2EC;--gold:#B8892B;--gold-d:#8A6412;--cream:#FBF7EE;--paper:#F4EFE3;--ink:#2A2A27;--muted:#5E5A50;--line:#DCD3BF}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}*{transition:none!important}}
body{margin:0;background:var(--paper);color:var(--ink);font-family:"Pretendard","Noto Sans KR","Noto Sans CJK KR","Malgun Gothic","Apple SD Gothic Neo",sans-serif;font-size:17px;line-height:1.85;word-break:keep-all;overflow-wrap:anywhere}
h1,h2,h3,.serif{font-family:"Noto Serif KR","Noto Serif CJK KR","Nanum Myeongjo","Batang",serif}
a{color:var(--forest)}
.skip{position:absolute;left:-999px;top:0;background:#fff;padding:8px 12px;z-index:100}
.skip:focus{left:8px}
nav.top{position:sticky;top:0;z-index:20;background:var(--forest-d);box-shadow:0 2px 10px rgba(0,0,0,.18)}
nav.top ul{list-style:none;margin:0 auto;padding:0 10px;max-width:1000px;display:flex;gap:2px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:thin}
nav.top a{display:block;white-space:nowrap;padding:12px 13px;color:#E6EFE8;text-decoration:none;font-size:15px;border-bottom:3px solid transparent}
nav.top a:hover{color:#fff;background:rgba(255,255,255,.06)}
nav.top a:focus-visible{outline:2px solid #F3D99A;outline-offset:-2px}
nav.top a.on{color:#fff;font-weight:700;border-bottom-color:#E2B85A;background:rgba(255,255,255,.08)}
header.cover{background:linear-gradient(160deg,var(--forest) 0%,var(--forest-d) 100%);color:#fff;text-align:center;padding:64px 20px 54px;border-bottom:6px solid var(--gold)}
.cover .kicker{color:#F0D798;font-size:14px;letter-spacing:.14em;font-weight:700}
.cover h1{font-size:clamp(26px,5.2vw,42px);line-height:1.35;margin:14px 0 10px}
.cover .sub{font-size:18px;color:#F6EBCF;margin:0 0 20px}
.cover .meta{font-size:14.5px;color:#DCE8E0;margin:3px 0}
main{max-width:860px;margin:0 auto;padding:0 16px 90px}
section{scroll-margin-top:64px}
.card{background:var(--cream);border:1px solid var(--line);border-radius:14px;padding:30px clamp(18px,4vw,40px);margin:34px 0;box-shadow:0 2px 10px rgba(60,50,20,.05)}
.card h2{color:var(--forest-d);font-size:clamp(22px,4vw,28px);margin:0 0 14px;line-height:1.4}
table{border-collapse:collapse;width:100%}
.weektab{font-size:15px;margin:16px 0 6px}
.weektab th,.weektab td{border:1px solid var(--line);padding:9px 10px;text-align:left;vertical-align:top}
.weektab thead th{background:var(--forest);color:#fff;font-weight:700}
.weektab tbody th{background:var(--forest-t);color:var(--forest-d);white-space:nowrap}
.weektab a{font-weight:700;text-decoration:none}
.tablewrap{overflow-x:auto}
.day{background:var(--cream);border:1px solid var(--line);border-radius:14px;margin:40px 0;overflow:hidden;box-shadow:0 2px 12px rgba(60,50,20,.06)}
.day-head{background:var(--forest);color:#fff;padding:26px clamp(18px,4vw,40px) 22px;border-bottom:4px solid var(--gold)}
.day-head .date{display:inline-block;background:var(--gold);color:#fff;font-weight:700;font-size:14px;padding:3px 12px;border-radius:20px}
.day-head h2{font-size:clamp(23px,4.4vw,31px);margin:12px 0 6px;line-height:1.38}
.dno{display:block;font-family:"Pretendard","Noto Sans KR",sans-serif;font-size:13px;letter-spacing:.18em;color:#F0D798;margin-bottom:2px}
.day-head .theme{margin:0;color:#E9F1EB;font-size:16px}
.blk{padding:22px clamp(18px,4vw,40px);border-top:1px solid var(--line)}
.blk:first-of-type{border-top:none}
.blk h3{font-size:19px;color:var(--forest-d);margin:0 0 12px}
.blk p{margin:0 0 14px}
.blk p:last-child{margin-bottom:0}
.scripture{background:#F1F5EF}
.scripture .refs b{color:var(--forest-d);font-size:18px}
.scripture .refs span{color:var(--muted);font-size:14.5px;margin-left:6px}
.verse{border-left:4px solid var(--forest);padding:4px 0 4px 14px;color:#24382D}
.small{font-size:13.5px;color:var(--muted);font-style:italic}
.hymn{background:#FFF9EA}
.hymn h3{color:var(--gold-d)}
.word{background:#FAF5E8}
.wcard{background:#fff;border:1px solid #E6D9B5;border-radius:10px;padding:16px 18px;margin:0 0 14px}
.wtitle{font-size:17.5px}
.wtitle b{color:var(--gold-d)}
.orig{font-family:"SBL Hebrew","Ezra SIL","Noto Serif Hebrew","Times New Roman",serif;font-size:1.12em}
.wtab th,.wtab td{border-top:1px solid #EFE6CF;padding:8px 8px;text-align:left;vertical-align:top;font-size:15.5px}
.wtab th{width:9.5em;color:var(--gold-d);white-space:nowrap}
.wnote{background:#fff;border-left:4px solid var(--gold);padding:10px 14px;border-radius:0 8px 8px 0}
.med p{text-indent:.6em}
.wesley{background:#F8F2E4;border-left:6px solid var(--gold)}
.wesley h3{color:var(--gold-d)}
.qs ol,.act ul{margin:0;padding-left:1.4em}
.qs li,.act li{margin:0 0 8px}
.act{background:var(--forest-t)}
.prayer{background:#FFFDF7}
.prayer p{font-family:"Noto Serif KR","Noto Serif CJK KR",serif;line-height:2}
.bridge{margin:0;padding:16px clamp(18px,4vw,40px);background:var(--forest-t);color:var(--forest-d);font-weight:600;border-top:1px dashed var(--line)}
.sumtab th,.sumtab td{border:1px solid var(--line);padding:9px 10px;text-align:left;font-size:15px}
.sumtab thead th{background:var(--gold);color:#fff}
footer{text-align:center;color:var(--muted);font-size:13.5px;padding:10px 16px 40px}
#toTop{position:fixed;right:16px;bottom:18px;width:48px;height:48px;border-radius:50%;border:none;background:var(--gold);color:#fff;font-size:22px;cursor:pointer;box-shadow:0 3px 12px rgba(0,0,0,.22);opacity:0;visibility:hidden;transition:opacity .2s}
#toTop.show{opacity:1;visibility:visible}
#toTop:focus-visible{outline:3px solid var(--forest-d);outline-offset:3px}
@media (max-width:600px){
  body{font-size:16px}
  nav.top a{padding:11px 10px;font-size:14px}
  .wtab th,.wtab td{display:block;width:auto;border-top:none;padding:3px 0}
  .wtab tr{display:block;border-top:1px solid #EFE6CF;padding:6px 0}
  .weektab,.sumtab{font-size:14px}
}
@media print{nav.top,#toTop{display:none}body{background:#fff}.day,.card{box-shadow:none;break-inside:auto}}
</style>
</head>
<body>
<a class="skip" href="#guide">본문으로 건너뛰기</a>
<nav class="top" aria-label="날짜별 묵상 이동"><ul>
${nav.map(([id, t]) => `<li><a href="#${id}">${esc(t)}</a></li>`).join("\n")}
</ul></nav>
<header class="cover">
  <div class="kicker">52주 기도의 삶 · 제50주간</div>
  <h1>${esc(meta.title)}</h1>
  <p class="sub">${esc(meta.theme)} — 「${esc(meta.sermonTitle)}」</p>
  <p class="meta">${esc(meta.period)}</p>
  <p class="meta">${esc(meta.church)} · ${esc(meta.pastor)}</p>
</header>
<main>
<section class="card" id="guide">
  <h2>주간 안내</h2>
  <table class="weektab" aria-label="설교 정보">
    <tbody>
      <tr><th scope="row">주간 주제</th><td>${esc(meta.theme)}</td></tr>
      <tr><th scope="row">주일 설교</th><td>「${esc(meta.sermonTitle)}」 · ${esc(meta.sermonDate)}</td></tr>
      <tr><th scope="row">설교 본문</th><td>${esc(meta.sermonTexts)}</td></tr>
      <tr><th scope="row">대상</th><td>어린이·청년·장년·어르신이 함께 사용하는 혼합 세대 교회 공동체</td></tr>
    </tbody>
  </table>
  ${intro.map((p) => `<p>${esc(p)}</p>`).join("")}
  <h3 class="serif" style="color:var(--forest-d);margin:24px 0 4px">한 주간 본문 안내</h3>
  <div class="tablewrap"><table class="weektab">
    <thead><tr><th scope="col">날짜</th><th scope="col">오늘 본문</th><th scope="col">함께 읽기</th><th scope="col">묵상의 초점</th></tr></thead>
    <tbody>${week.map((w, i) => `<tr><th scope="row"><a href="#${days[i].id}">${esc(w.day)}</a></th><td>${esc(w.text)}</td><td>${esc(w.sub)}</td><td>${esc(w.focus)}</td></tr>`).join("")}</tbody>
  </table></div>
</section>
${days.map(dayHtml).join("\n")}
<section class="card" id="end">
  <h2>${esc(closing.title)}</h2>
  ${closing.paras.map((p) => `<p>${esc(p)}</p>`).join("")}
  <div class="tablewrap"><table class="sumtab">
    <thead><tr><th scope="col">요일 · 동작</th><th scope="col">핵심</th><th scope="col">이어 갈 습관</th></tr></thead>
    <tbody>${closing.summary.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody>
  </table></div>
</section>
</main>
<footer>${esc(meta.church)} · ${esc(meta.pastor)} · ${esc(meta.title)}</footer>
<button id="toTop" type="button" aria-label="맨 위로 이동">↑</button>
<script>
(function(){
  var links=[].slice.call(document.querySelectorAll('nav.top a'));
  var secs=links.map(function(a){return document.getElementById(a.getAttribute('href').slice(1));});
  var btn=document.getElementById('toTop');
  var ticking=false;
  function update(){
    ticking=false;
    var y=window.scrollY+80,cur=-1;
    for(var i=0;i<secs.length;i++){if(secs[i]&&secs[i].offsetTop<=y)cur=i;}
    if(window.innerHeight+window.scrollY>=document.documentElement.scrollHeight-2)cur=secs.length-1;
    links.forEach(function(a,i){
      var on=i===cur;
      a.classList.toggle('on',on);
      if(on){a.setAttribute('aria-current','location');
        var ul=a.parentNode.parentNode, l=a.offsetLeft, r=l+a.offsetWidth;
        if(l<ul.scrollLeft||r>ul.scrollLeft+ul.clientWidth){ul.scrollLeft=l-16;}
      } else a.removeAttribute('aria-current');
    });
    btn.classList.toggle('show',window.scrollY>600);
  }
  window.addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(update);}},{passive:true});
  window.addEventListener('resize',update);
  links.forEach(function(a){a.addEventListener('click',function(){var t=document.getElementById(a.getAttribute('href').slice(1));if(t){t.setAttribute('tabindex','-1');setTimeout(function(){t.focus({preventScroll:true});},0);}});});
  btn.addEventListener('click',function(){window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});links[0].focus({preventScroll:true});});
  update();
})();
</script>
</body>
</html>`;
fs.writeFileSync(process.argv[2], html);
console.log("written", process.argv[2], html.length);
