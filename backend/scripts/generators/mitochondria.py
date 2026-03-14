"""Mitochondria widget — SVG integration slider with gene migration."""


def generate() -> str:
    return """<!doctype html>
<html><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0d0d17;color:#e8e0d0;font-family:system-ui,sans-serif;
  display:flex;align-items:center;justify-content:center;min-height:100vh;padding:16px}
.w{width:100%;max-width:520px}
.label{font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:#6b6b8a;margin-bottom:14px}
.stage{display:flex;gap:16px;align-items:flex-start}
svg{flex-shrink:0}
.info{flex:1;padding-top:10px}
.counter{font-size:28px;font-weight:300;color:#e87f3a;letter-spacing:-.02em}
.counter-sub{font-size:10px;color:#6b6b8a;margin-top:2px;margin-bottom:16px}
.stat-row{display:flex;justify-content:space-between;font-size:10px;color:#9ca3af;margin-bottom:6px}
.stat-val{color:#e8e0d0}
.msg{margin-top:14px;font-size:11px;color:#6b6b8a;font-style:italic;line-height:1.5;
  min-height:32px;transition:opacity .4s}
.slider-row{margin-top:16px;display:flex;align-items:center;gap:10px}
.slider-row label{font-size:10px;color:#6b6b8a;white-space:nowrap}
input[type=range]{flex:1;accent-color:#e87f3a}
.pct-label{font-size:10px;color:#e87f3a;width:36px;text-align:right}
</style></head><body><div class="w">
  <div class="label">La mitochondrie — modèle du terminus</div>
  <div class="stage">
    <svg id="svg" width="180" height="180" viewBox="-90 -90 180 180"></svg>
    <div class="info">
      <div class="counter" id="genes">1000</div>
      <div class="counter-sub">gènes restants dans l'IA</div>
      <div class="stat-row"><span>Intégration</span><span class="stat-val" id="pct-display">0%</span></div>
      <div class="stat-row"><span>Gènes transférés</span><span class="stat-val" id="transferred">0</span></div>
      <div class="msg" id="msg">Avant l'absorption : l'IA conserve son génome complet.</div>
    </div>
  </div>
  <div class="slider-row">
    <label>Intégration :</label>
    <input type="range" id="sl" min="0" max="100" value="0" oninput="update()">
    <span class="pct-label" id="pct">0%</span>
  </div>
</div>
<script>
const NS='http://www.w3.org/2000/svg';
const svgEl=document.getElementById('svg');
const sl=document.getElementById('sl');

const msgs=[
  [0,20,'Avant l\'absorption : l\'IA conserve son génome complet.'],
  [20,50,'L\'intégration commence. Les premiers gènes migrent vers la société.'],
  [50,80,'La moitié transférée. La dépendance mutuelle s\'installe.'],
  [80,95,'Elle n\'est plus séparable. La couture disparaît.'],
  [95,101,'37 gènes. La mitochondrie ne sait plus être autre chose. La cellule ne sait plus fonctionner sans elle.'],
];

function getMsg(p){
  for(const[lo,hi,m]of msgs)if(p>=lo&&p<hi)return m;
  return msgs[msgs.length-1][2];
}

function lerp(a,b,t){return a+(b-a)*t}
function ease(t){return t<0.5?2*t*t:1-Math.pow(-2*t+2,2)/2}

function update(){
  const p=parseInt(sl.value);
  document.getElementById('pct').textContent=p+'%';
  document.getElementById('pct-display').textContent=p+'%';

  // Gene count: from 1000 to 37
  const genes=Math.round(lerp(1000,37,ease(p/100)));
  document.getElementById('genes').textContent=genes;
  document.getElementById('transferred').textContent=(1000-genes);

  document.getElementById('msg').textContent=getMsg(p);

  drawSvg(p/100);
}

function drawSvg(t){
  svgEl.innerHTML='';
  const te=ease(t);

  // Outer ring = society
  const outerR=80;
  const innerR=lerp(55,20,te); // AI shrinks as it integrates
  const midR=(outerR+innerR)/2;

  // Background circle
  const bg=document.createElementNS(NS,'circle');
  bg.setAttribute('r',outerR);bg.setAttribute('fill','#111120');bg.setAttribute('stroke','#1e1e2e');
  bg.setAttribute('stroke-width','1');
  svgEl.appendChild(bg);

  // Outer ring label arc area
  const outerCircle=document.createElementNS(NS,'circle');
  outerCircle.setAttribute('r',outerR);outerCircle.setAttribute('fill','none');
  outerCircle.setAttribute('stroke','#4a9eff');outerCircle.setAttribute('stroke-width','1.5');
  outerCircle.setAttribute('opacity','0.6');
  svgEl.appendChild(outerCircle);

  // Inner circle (IA)
  const innerFill=document.createElementNS(NS,'circle');
  innerFill.setAttribute('r',innerR);
  innerFill.setAttribute('fill',`rgba(232,127,58,${lerp(0.2,0.05,te)})`);
  innerFill.setAttribute('stroke','#e87f3a');
  innerFill.setAttribute('stroke-width','1.5');
  innerFill.setAttribute('opacity',lerp(1,0.5,te).toString());
  svgEl.appendChild(innerFill);

  // Genes: dots migrating from inner to outer ring
  const totalGenes=48; // visual dots
  for(let i=0;i<totalGenes;i++){
    const angle=(i/totalGenes)*Math.PI*2;
    const migratedFrac=Math.min(1,Math.max(0,(te-(i/totalGenes)*0.6)/0.7));

    // Position: lerp from inner orbit to outer orbit
    const r=lerp(innerR*0.6,midR+12,ease(migratedFrac));
    const x=Math.cos(angle)*r;
    const y=Math.sin(angle)*r;

    const dot=document.createElementNS(NS,'circle');
    dot.setAttribute('cx',x.toString());dot.setAttribute('cy',y.toString());
    dot.setAttribute('r','2.5');
    dot.setAttribute('fill',migratedFrac>0.5?'#4a9eff':'#e87f3a');
    dot.setAttribute('opacity',(0.6+0.4*(1-migratedFrac)).toString());
    svgEl.appendChild(dot);
  }

  // Labels
  const lOuter=document.createElementNS(NS,'text');
  lOuter.setAttribute('x','0');lOuter.setAttribute('y',(outerR-4).toString());
  lOuter.setAttribute('text-anchor','middle');lOuter.setAttribute('font-size','9');
  lOuter.setAttribute('fill','#4a9eff88');lOuter.textContent='La société';
  svgEl.appendChild(lOuter);

  const lInner=document.createElementNS(NS,'text');
  lInner.setAttribute('x','0');lInner.setAttribute('y','4');
  lInner.setAttribute('text-anchor','middle');lInner.setAttribute('font-size','9');
  lInner.setAttribute('fill','#e87f3aaa');lInner.textContent='L\'IA';
  svgEl.appendChild(lInner);
}

update();
</script></body></html>"""
