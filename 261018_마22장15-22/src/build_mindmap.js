// 설교 구조 마인드맵(D) HTML 생성 — 순수 SVG, 드래그·확대/축소·클릭 팝업
// 사용: node src/build_mindmap.js <출력.html>
const fs = require("fs");
const { meta, sermon } = require("./content.js");

const strip = (s) => s.replace(/\*\*/g, "");
const colors = ["#6B4FA0", "#1F8A8A", "#D9771E"]; // 보라 / 청록 / 주황
const nodes = [{ id: "c", label: meta.title, sub: meta.mainText, x: 0, y: 0, r: 0, color: "#1B3A6B",
  detail: `<p><b>${meta.subtitle}</b></p><p>${meta.date} · ${meta.season}</p><p>${meta.mainText}<br>${meta.subTexts}</p><p><b>마지막 선포</b><br>${sermon.conclusion.proclaim}</p>` }];
const edges = [];
sermon.points.forEach((p, i) => {
  const a = (-90 + i * 120) * Math.PI / 180;
  const px = Math.cos(a) * 260, py = Math.sin(a) * 230;
  const id = "p" + i;
  nodes.push({ id, label: `${p.no} ${p.title}`, sub: p.ref, x: px, y: py, color: colors[i], level: 1,
    detail: `<p><b>${p.ref}</b></p><p>${sermon.conclusion.summary[i]}</p>` });
  edges.push(["c", id]);
  const kids = [
    ["본문", p.ref, `<p>${strip(p.scripture).replace(/\n/g, "<br>")}</p>`],
    ["예화", p.illTitle.replace("예화 — ", ""), `<p>${p.illustration}</p>`],
    ["웨슬리", p.wesley.src.replace(/\(.*\)/, "").trim(), `<p><i>${p.wesley.en}</i></p><p>${p.wesley.ko}</p><p>${p.wesley.link}</p>`],
    ["적용", "이번 주 실천", `<ul>${p.apply.map((t) => `<li>${t}</li>`).join("")}</ul>`],
  ];
  kids.forEach(([tag, label, detail], k) => {
    // 부모 바깥쪽으로 160, 접선 방향으로 나란히 배치해 겹치지 않게 한다
    const off = (k - 1.5) * 190;
    const kx = px + Math.cos(a) * 240 - Math.sin(a) * off, ky = py + Math.sin(a) * 190 + Math.cos(a) * off * 0.55;
    const kid = `${id}k${k}`;
    nodes.push({ id: kid, label, sub: tag, x: kx, y: ky, color: colors[i], level: 2, detail });
    edges.push([id, kid]);
  });
});

const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>하나님의 것은 하나님께</title>
<style>
:root{--bg:#F7F5F0;--ink:#222;--muted:#666;--card:#fff;--line:#C9D3E0}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#15181E;--ink:#EEE;--muted:#AAA;--card:#22262E;--line:#3A4250}}
:root[data-theme="dark"]{--bg:#15181E;--ink:#EEE;--muted:#AAA;--card:#22262E;--line:#3A4250}
*{box-sizing:border-box}html,body{margin:0;height:100%;background:var(--bg);color:var(--ink);font-family:"Malgun Gothic","Apple SD Gothic Neo",sans-serif}
header{padding:12px 16px;border-bottom:1px solid var(--line)}header h1{margin:0;font-size:18px}header p{margin:2px 0 0;font-size:13px;color:var(--muted)}
#wrap{position:absolute;top:64px;left:0;right:0;bottom:0;overflow:hidden;touch-action:none;cursor:grab}
svg{width:100%;height:100%}
.node rect{stroke-width:2}.node text{font-size:14px;fill:#fff;pointer-events:none}.node .sub{font-size:11px;opacity:.85}
.node{cursor:pointer}.node.l2 rect{fill:var(--card)}.node.l2 text{fill:var(--ink)}
.node.dim{opacity:.25}
#pop{position:absolute;right:16px;bottom:16px;max-width:min(440px,calc(100% - 32px));max-height:60%;overflow:auto;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px 16px;font-size:14px;line-height:1.7;box-shadow:0 6px 24px rgba(0,0,0,.18);display:none}
#pop h2{margin:0 0 6px;font-size:16px}#pop .x{float:right;border:0;background:none;font-size:18px;cursor:pointer;color:var(--muted)}
.hint{position:absolute;left:16px;bottom:12px;font-size:12px;color:var(--muted)}
</style></head><body>
<header><h1>${meta.title}</h1><p>${meta.date} · ${meta.church} · ${meta.mainText}</p></header>
<div id="wrap"><svg id="svg"><g id="vp"></g></svg>
<div id="pop"><button class="x" aria-label="닫기">×</button><h2></h2><div class="body"></div></div>
<div class="hint">노드 클릭: 내용 보기 · 끌기: 이동 · 휠/두 손가락: 확대·축소</div></div>
<script>
const nodes=${JSON.stringify(nodes)};const edges=${JSON.stringify(edges)};
const NS="http://www.w3.org/2000/svg",vp=document.getElementById("vp"),svg=document.getElementById("svg");
const byId=Object.fromEntries(nodes.map(n=>[n.id,n]));
let view={x:0,y:0,k:1};
function fit(){const r=svg.getBoundingClientRect();const k=Math.min(r.width/1400,r.height/1100,1.2);view={x:r.width/2,y:r.height/2,k};apply()}
function apply(){vp.setAttribute("transform","translate("+view.x+","+view.y+") scale("+view.k+")")}
const el=(t,a)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);return e};
edges.forEach(([a,b])=>{const A=byId[a],B=byId[b];vp.appendChild(el("line",{x1:A.x,y1:A.y,x2:B.x,y2:B.y,stroke:B.color,"stroke-width":B.level===1?3:1.5,"stroke-opacity":.6}))});
nodes.forEach(n=>{const g=el("g",{class:"node l"+(n.level||0),"data-id":n.id});
 const w=n.level===2?176:n.level===1?250:230,h=n.level===2?46:n.level===1?56:66;
 const lab=n.label.length>(n.level===2?11:16)&&n.level!==0?n.label.slice(0,n.level===2?11:16)+"…":n.label;
 g.appendChild(el("rect",{x:n.x-w/2,y:n.y-h/2,width:w,height:h,rx:12,fill:n.color,stroke:n.color}));
 const t=el("text",{x:n.x,y:n.y-3,"text-anchor":"middle","font-weight":n.level===2?400:700});t.textContent=lab;g.appendChild(t);
 const s=el("text",{x:n.x,y:n.y+15,"text-anchor":"middle",class:"sub"});s.textContent=n.sub;g.appendChild(s);
 g.addEventListener("click",e=>{e.stopPropagation();show(n)});vp.appendChild(g)});
const pop=document.getElementById("pop");
function show(n){pop.querySelector("h2").textContent=n.label;pop.querySelector(".body").innerHTML=n.detail;pop.style.display="block";
 const root=n.id==="c"?null:n.id.slice(0,2);document.querySelectorAll(".node").forEach(g=>{const id=g.dataset.id;g.classList.toggle("dim",!!root&&id!=="c"&&!id.startsWith(root))})}
pop.querySelector(".x").onclick=()=>{pop.style.display="none";document.querySelectorAll(".node").forEach(g=>g.classList.remove("dim"))};
let drag=null;const pts=new Map();
svg.addEventListener("pointerdown",e=>{pts.set(e.pointerId,e);if(pts.size===1)drag={x:e.clientX-view.x,y:e.clientY-view.y};svg.setPointerCapture(e.pointerId)});
svg.addEventListener("pointermove",e=>{if(!pts.has(e.pointerId))return;
 if(pts.size===2){const [a,b]=[...pts.values()];const d0=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);pts.set(e.pointerId,e);const [c,d]=[...pts.values()];const d1=Math.hypot(c.clientX-d.clientX,c.clientY-d.clientY);if(d0)zoom(d1/d0,(c.clientX+d.clientX)/2,(c.clientY+d.clientY)/2);return}
 pts.set(e.pointerId,e);if(drag){view.x=e.clientX-drag.x;view.y=e.clientY-drag.y;apply()}});
const up=e=>{pts.delete(e.pointerId);drag=null;if(pts.size===1){const p=[...pts.values()][0];drag={x:p.clientX-view.x,y:p.clientY-view.y}}};
svg.addEventListener("pointerup",up);svg.addEventListener("pointercancel",up);
function zoom(f,cx,cy){const r=svg.getBoundingClientRect();cx-=r.left;cy-=r.top;const k=Math.max(.3,Math.min(3,view.k*f));f=k/view.k;view.x=cx-(cx-view.x)*f;view.y=cy-(cy-view.y)*f;view.k=k;apply()}
svg.addEventListener("wheel",e=>{e.preventDefault();zoom(e.deltaY<0?1.1:1/1.1,e.clientX,e.clientY)},{passive:false});
addEventListener("resize",fit);fit();
</script></body></html>`;
fs.writeFileSync(process.argv[2], html);
console.log("written", process.argv[2]);
