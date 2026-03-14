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
.bar-name{font-size:10px;color:#9ca3af;width:120px;flex-shrink:0;text-align:right}
.bar-track{flex:1;background:#1e1e2e;border-radius:3px;height:14px;position:relative;overflow:hidden}
.bar-fill{height:100%;border-radius:3px}
.bar-pct{font-size:9px;color:#6b6b8a;width:32px;flex-shrink:0}
canvas{display:block;width:100%;border-radius:6px;background:#111120}
.slider-row{display:flex;align-items:center;gap:10px;margin-top:10px}
.slider-row label{font-size:10px;color:#6b6b8a;white-space:nowrap}
input[type=range]{flex:1;accent-color:#4a9eff}
.legend{display:flex;gap:16px;margin-top:8px;justify-content:center}
.li{display:flex;align-items:center;gap:5px;font-size:10px;color:#9ca3af}
.ld{width:16px;height:2px;border-radius:1px}
.quote{margin-top:14px;font-size:10px;color:#4b5563;font-style:italic;
  border-top:1px solid #1e1e2e;padding-top:12px;text-align:center}
</style></head><body><div class="w">
  <div class="label">Pourquoi elle dévie — deux sources distinctes</div>
  <div class="tabs">
    <div class="tab active" onclick="switchTab(0)">Vision incomplète</div>
    <div class="tab" onclick="switchTab(1)">Absence de corps</div>
  </div>

  <div class="panel active" id="p0">
    <div class="chart-title">Couverture du corpus par domaine de connaissance humaine</div>
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
      <div class="li"><div class="ld" style="background:#e87f3a"></div>Humain (contraint)</div>
      <div class="li"><div class="ld" style="background:#4a9eff;border:none;border-top:1px dashed #4a9eff"></div>IA (sans limite)</div>
    </div>
    <div class="quote">« Une copie d'une danse faite par quelqu'un qui n'a jamais eu de jambes — techniquement correcte dans ses angles, étrange dans son rythme. »</div>
  </div>
</div>
<script>
const tabs=document.querySelectorAll('.tab');
const panels=document.querySelectorAll('.panel');

function switchTab(i){
  tabs.forEach((t,j)=>{t.classList.toggle('active',i===j)});
  panels.forEach((p,j)=>{p.classList.toggle('active',i===j)});
  if(i===1)setTimeout(drawGraph,10);
}

const domains=[
  {name:'Langage / littérature',ai:88,col:'#e87f3a'},
  {name:'Raisonnement logique',ai:82,col:'#e87f3a'},
  {name:'Savoir technique',ai:76,col:'#e87f3acc'},
  {name:'Émotion / relation',ai:34,col:'#e87f3a88'},
  {name:'Intuition corporelle',ai:8,col:'#4a9eff66'},
  {name:'Expérience vécue',ai:4,col:'#4a9eff44'},
];

const barsEl=document.getElementById('bars');
domains.forEach(d=>{
  const row=document.createElement('div');
  row.className='bar-row';
  row.innerHTML=`<div class="bar-name">${d.name}</div>
    <div class="bar-track">
      <div class="bar-fill" style="width:${d.ai}%;background:${d.col}"></div>
    </div>
    <div class="bar-pct">${d.ai}%</div>`;
  barsEl.appendChild(row);
});

const cv=document.getElementById('cv');
const sl=document.getElementById('sl');

function drawGraph(){
  const ctx=cv.getContext('2d');
  cv.width=cv.offsetWidth||480;
  const W=cv.width,H=150;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#111120';ctx.fillRect(0,0,W,H);

  const t=parseInt(sl.value)/100;

  // Grid
  ctx.strokeStyle='#1e1e2e';ctx.lineWidth=1;
  for(let i=1;i<4;i++){
    ctx.beginPath();ctx.moveTo(40,10+i*(H-40)/4);ctx.lineTo(W-10,10+i*(H-40)/4);ctx.stroke();
  }

  // Axes
  ctx.strokeStyle='#2a2a3a';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(40,10);ctx.lineTo(40,H-30);ctx.lineTo(W-10,H-30);ctx.stroke();

  ctx.fillStyle='#4b5563';ctx.font='9px system-ui';
  ctx.fillText('Complexité →',2,14);
  ctx.fillText('Temps →',W-45,H-10);

  // AI line — continuous upward
  ctx.beginPath();ctx.strokeStyle='#4a9eff88';ctx.lineWidth=1.5;ctx.setLineDash([4,3]);
  for(let i=0;i<=100;i++){
    const x=40+(W-50)*i/100;
    const y=(H-30)-(i/100)*(H-50)*0.92;
    i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
  }
  ctx.stroke();ctx.setLineDash([]);

  // Annotation: "Un texte sur la douleur n'est pas la douleur"
  ctx.fillStyle='#4a9eff33';ctx.font='8px system-ui';
  ctx.fillText('IA : pas de limite physique',40+(W-50)*0.52,20);

  // Human line — grows with biological interruptions, then ends
  ctx.beginPath();ctx.strokeStyle='#e87f3a';ctx.lineWidth=2;
  const deathX=t*(W-50)+40;
  for(let i=0;i<=100;i++){
    const frac=i/100;
    if(frac>t)break;
    const x=40+(W-50)*frac;
    let dip=0;
    [{at:0.22},{at:0.5}].forEach(bp=>{
      const dist=Math.abs(frac-bp.at);
      if(dist<0.04)dip+=0.18*(1-dist/0.04);
    });
    const level=frac*(1-dip);
    const y=(H-30)-level*(H-50)*0.92;
    i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
  }
  ctx.stroke();

  // Death marker
  if(deathX<W-10){
    ctx.strokeStyle='#e87f3a44';ctx.lineWidth=1;ctx.setLineDash([2,2]);
    ctx.beginPath();ctx.moveTo(deathX,H-30);ctx.lineTo(deathX,10);ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle='#e87f3a88';ctx.font='8px system-ui';
    ctx.fillText('mort',deathX-10,H-33);
  }

  // Sleep markers
  [{at:0.22,label:'sommeil'},{at:0.5,label:'douleur'}].forEach(bp=>{
    const bx=40+(W-50)*bp.at;
    ctx.fillStyle='#e87f3a44';ctx.font='7px system-ui';
    ctx.fillText(bp.label,bx-14,H-33);
  });
}

drawGraph();
window.addEventListener('resize',drawGraph);
</script></body></html>"""
