"""DeviationChart widget — two-panel chart showing sources of deviation."""


def generate() -> str:
    return """<!doctype html>
<html><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0d0d17;color:#e8e0d0;font-family:system-ui,sans-serif;
  display:flex;align-items:center;justify-content:center;min-height:100vh;padding:16px}
.w{width:100%;max-width:520px}
.label{font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:#6b6b8a;margin-bottom:12px}
.tabs{display:flex;gap:0;border-bottom:1px solid #1e1e2e;margin-bottom:16px}
.tab{padding:8px 16px;font-size:11px;letter-spacing:.08em;cursor:pointer;
  color:#6b6b8a;border-bottom:2px solid transparent;margin-bottom:-1px;
  transition:color .2s,border-color .2s;text-transform:uppercase}
.tab.active{color:#e8e0d0;border-bottom-color:#e87f3a}
.panel{display:none}.panel.active{display:block}
.chart-title{font-size:11px;color:#9ca3af;margin-bottom:12px}
.bar-row{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.bar-name{font-size:10px;color:#9ca3af;width:110px;flex-shrink:0;text-align:right}
.bar-track{flex:1;background:#1e1e2e;border-radius:3px;height:14px;position:relative;overflow:hidden}
.bar-fill{height:100%;border-radius:3px;transition:width 0.8s ease}
.bar-pct{font-size:9px;color:#6b6b8a;width:32px;flex-shrink:0}
canvas{display:block;width:100%;border-radius:6px}
.slider-row{display:flex;align-items:center;gap:10px;margin-top:10px}
.slider-row label{font-size:10px;color:#6b6b8a;white-space:nowrap}
input[type=range]{flex:1;accent-color:#4a9eff}
.legend{display:flex;gap:16px;margin-top:8px;justify-content:center}
.li{display:flex;align-items:center;gap:5px;font-size:10px;color:#9ca3af}
.ld{width:16px;height:2px;border-radius:1px}
</style></head><body><div class="w">
  <div class="label">Pourquoi elle dévie — deux sources distinctes</div>
  <div class="tabs">
    <div class="tab active" onclick="switchTab(0)">Vision incomplète</div>
    <div class="tab" onclick="switchTab(1)">Absence de corps</div>
  </div>

  <div class="panel active" id="p0">
    <div class="chart-title">Couverture du corpus par domaine de connaissance</div>
    <div id="bars"></div>
  </div>

  <div class="panel" id="p1">
    <div class="chart-title">Trajectoire de la pensée dans le temps</div>
    <canvas id="cv" height="150"></canvas>
    <div class="slider-row">
      <label>Durée :</label>
      <input type="range" id="sl" min="1" max="100" value="40" oninput="drawGraph()">
    </div>
    <div class="legend">
      <div class="li"><div class="ld" style="background:#e87f3a"></div>Humain</div>
      <div class="li"><div class="ld" style="background:#4a9eff;border:1px dashed #4a9eff"></div>IA (pas de limite)</div>
    </div>
  </div>
</div>
<script>
const tabs=document.querySelectorAll('.tab');
const panels=document.querySelectorAll('.panel');

function switchTab(i){
  tabs.forEach((t,j)=>{t.classList.toggle('active',i===j)});
  panels.forEach((p,j)=>{p.classList.toggle('active',i===j)});
  if(i===1)drawGraph();
}

// Bar chart data
const domains=[
  {name:'Langage / littérature',ai:88,human:100},
  {name:'Raisonnement logique',ai:82,human:100},
  {name:'Savoir technique',ai:76,human:100},
  {name:'Émotion / relation',ai:34,human:100},
  {name:'Intuition corporelle',ai:8,human:100},
  {name:'Expérience vécue',ai:4,human:100},
];

const barsEl=document.getElementById('bars');
domains.forEach(d=>{
  const row=document.createElement('div');
  row.className='bar-row';
  row.innerHTML=`<div class="bar-name">${d.name}</div>
    <div class="bar-track">
      <div class="bar-fill" style="width:${d.ai}%;background:linear-gradient(90deg,#e87f3a,#e87f3a88)"></div>
    </div>
    <div class="bar-pct">${d.ai}%</div>`;
  barsEl.appendChild(row);
});

// Line graph
const cv=document.getElementById('cv');
const sl=document.getElementById('sl');

function drawGraph(){
  const ctx=cv.getContext('2d');
  cv.width=cv.offsetWidth||480;
  const W=cv.width,H=cv.height=150;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#111120';
  ctx.fillRect(0,0,W,H);

  const t=parseInt(sl.value);
  const breakpoints=[ // human interruptions: sleep=20, distraction=50, death=80 (as % of full range)
    {at:0.25,label:'sommeil',recovery:0.6},
    {at:0.55,label:'distraction',recovery:0.4},
    {at:t/100*0.9,label:'mort',recovery:0},
  ];

  // Draw axes
  ctx.strokeStyle='#2a2a3a';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(40,10);ctx.lineTo(40,H-30);ctx.lineTo(W-10,H-30);ctx.stroke();
  ctx.fillStyle='#4b5563';ctx.font='9px system-ui';
  ctx.fillText('Complexité',2,14);
  ctx.fillText('Temps →',W-45,H-10);

  // AI line — straight upward with slight wobble
  ctx.beginPath();ctx.strokeStyle='#4a9eff';ctx.lineWidth=1.5;ctx.setLineDash([4,3]);
  for(let i=0;i<=100;i++){
    const x=40+(W-50)*i/100;
    const y=(H-30)-(i/100)*(H-50)*0.95;
    i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
  }
  ctx.stroke();ctx.setLineDash([]);

  // Human line — grows then resets/stops
  ctx.beginPath();ctx.strokeStyle='#e87f3a';ctx.lineWidth=2;
  let level=0;let broken=false;
  for(let i=0;i<=100;i++){
    const frac=i/100;
    if(frac>t/100&&!broken){broken=true;}
    const x=40+(W-50)*frac;

    if(broken){
      // After death: line ends
      break;
    }

    // Check breakpoints (sleep/distraction — dip and recover)
    let dip=0;
    breakpoints.slice(0,2).forEach(bp=>{
      const dist=Math.abs(frac-bp.at);
      if(dist<0.05)dip+=0.15*(1-dist/0.05);
    });

    level=frac*(1-dip);
    const y=(H-30)-level*(H-50)*0.95;
    i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
  }
  ctx.stroke();

  // Labels on breakpoints
  ctx.fillStyle='#e87f3a66';ctx.font='8px system-ui';
  ctx.fillText('sommeil',40+(W-50)*0.25-10,H-33);
  ctx.fillText('→ mort',40+(W-50)*(t/100)-10,H-33);

  // Note
  ctx.fillStyle='#4a9eff44';ctx.font='8px system-ui';
  ctx.fillText('IA continue — pas de limite physique',40+(W-50)*0.5,22);
}

drawGraph();
window.addEventListener('resize',drawGraph);
</script></body></html>"""
