"""CellDivision widget — interactive SVG cell that splits on click."""


def generate() -> str:
    return """<!doctype html>
<html><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0d0d17;color:#e8e0d0;font-family:system-ui,sans-serif;
  display:flex;align-items:center;justify-content:center;min-height:100vh;padding:16px}
.w{width:100%;max-width:520px;text-align:center}
.label{font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:#6b6b8a;margin-bottom:14px;text-align:left}
svg{display:block;margin:0 auto;overflow:visible}
.btn{margin-top:14px;padding:8px 20px;background:transparent;border:1px solid #4f46e5;
  color:#8892f8;border-radius:6px;font-size:12px;letter-spacing:.1em;cursor:pointer;
  text-transform:uppercase;transition:background .2s,color .2s}
.btn:hover{background:#4f46e522;color:#a5b0ff}
.info{margin-top:12px;display:flex;gap:24px;justify-content:center}
.cell-info{font-size:11px;color:#9ca3af;text-align:center}
.cell-info strong{display:block;color:#e8e0d0;margin-bottom:2px}
.verdict{margin-top:12px;font-size:12px;color:#e87f3a66;font-style:italic;
  min-height:18px;transition:opacity .4s}
.quote{margin-top:14px;font-size:10px;color:#4b5563;border-top:1px solid #1e1e2e;
  padding-top:12px;font-style:italic}
</style></head><body><div class="w">
  <div class="label">La division foirée — contenu déséquilibré</div>
  <svg id="svg" width="480" height="160" viewBox="0 0 480 160"></svg>
  <div class="info">
    <div class="cell-info"><strong id="lname">Cellule mère</strong><span id="lstatus">en attente</span></div>
    <div class="cell-info"><strong id="rname" style="opacity:.3">Cellule fille (IA)</strong><span id="rstatus" style="opacity:.3">—</span></div>
  </div>
  <div class="verdict" id="verdict"></div>
  <button class="btn" id="btn" onclick="divide()">Déclencher la division</button>
  <div class="quote">« L'évolution n'a jamais commencé par un succès — elle a commencé par des milliards d'essais dont quelques-uns ont tenu. »</div>
</div>
<script>
const NS='http://www.w3.org/2000/svg';
const svg=document.getElementById('svg');
let divided=false,animId=null;

function svgEl(tag,attrs){
  const e=document.createElementNS(NS,tag);
  for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);
  return e;
}
function set(el,attrs){for(const[k,v]of Object.entries(attrs))el.setAttribute(k,v);}

// ── Build the full SVG DOM once ──────────────────────────────
const defs=svgEl('defs',{});

// Mother cell gradient
const mg=svgEl('linearGradient',{id:'mg',x1:'0',y1:'0',x2:'1',y2:'0'});
mg.appendChild(svgEl('stop',{'offset':'0%','stop-color':'#e87f3a','stop-opacity':'0.85'}));
mg.appendChild(svgEl('stop',{'offset':'70%','stop-color':'#e87f3a','stop-opacity':'0.6'}));
mg.appendChild(svgEl('stop',{'offset':'100%','stop-color':'#4a9eff','stop-opacity':'0.4'}));

// Left daughter gradient
const lg=svgEl('linearGradient',{id:'lg',x1:'0',y1:'0',x2:'1',y2:'0'});
lg.appendChild(svgEl('stop',{'offset':'0%','stop-color':'#e87f3a','stop-opacity':'0.9'}));
lg.appendChild(svgEl('stop',{'offset':'85%','stop-color':'#e87f3a','stop-opacity':'0.7'}));
lg.appendChild(svgEl('stop',{'offset':'100%','stop-color':'#1a1a2e','stop-opacity':'0.5'}));

// Right daughter gradient
const rg=svgEl('linearGradient',{id:'rg',x1:'0',y1:'0',x2:'1',y2:'0'});
rg.appendChild(svgEl('stop',{'offset':'0%','stop-color':'#1a1a2e','stop-opacity':'0.2'}));
rg.appendChild(svgEl('stop',{'offset':'100%','stop-color':'#4a9eff','stop-opacity':'0.35'}));

defs.appendChild(mg);defs.appendChild(lg);defs.appendChild(rg);
svg.appendChild(defs);

const CX=240,CY=80,R=55;

// Mother cell group
const motherG=svgEl('g',{});
const motherCircle=svgEl('circle',{cx:CX,cy:CY,r:R,fill:'url(#mg)',stroke:'#e87f3a','stroke-width':'1.5'});
const mLabel1=svgEl('text',{x:CX,y:CY-12,'text-anchor':'middle','font-size':'11',fill:'#e8e0d0'});
mLabel1.textContent='Corpus humain complet';
const mLabel2=svgEl('text',{x:CX,y:CY+5,'text-anchor':'middle','font-size':'10',fill:'#e8e0d0aa'});
mLabel2.textContent='langage + corps + silence';
const mPct1=svgEl('text',{x:CX-22,y:CY+22,'text-anchor':'middle','font-size':'9',fill:'#e87f3a'});
mPct1.textContent='~70% écrit';
const mPct2=svgEl('text',{x:CX+30,y:CY+22,'text-anchor':'middle','font-size':'9',fill:'#4a9eff'});
mPct2.textContent='~30% tacite';
motherG.appendChild(motherCircle);motherG.appendChild(mLabel1);motherG.appendChild(mLabel2);
motherG.appendChild(mPct1);motherG.appendChild(mPct2);

// Division group (hidden initially)
const divG=svgEl('g',{opacity:'0'});
const leftCell=svgEl('ellipse',{cx:CX,cy:CY,rx:R*0.9,ry:R,fill:'url(#lg)',stroke:'#e87f3a','stroke-width':'1.5'});
const rightCell=svgEl('ellipse',{cx:CX,cy:CY,rx:R*0.9,ry:R,fill:'url(#rg)',stroke:'#4a9eff44','stroke-width':'1','stroke-dasharray':'4 4'});
const lLabel=svgEl('text',{'text-anchor':'middle','font-size':'10',fill:'#e8e0d0',opacity:'0'});
lLabel.textContent="L'IA";
const lSub1=svgEl('text',{'text-anchor':'middle','font-size':'9',fill:'#e87f3acc',opacity:'0'});
lSub1.textContent='langage ✓';
const lSub2=svgEl('text',{'text-anchor':'middle','font-size':'9',fill:'#4a9eff55',opacity:'0'});
lSub2.textContent='corps ✗';
const rLabel=svgEl('text',{'text-anchor':'middle','font-size':'9',fill:'#4b5563',opacity:'0'});
rLabel.textContent="ce qui ne s'écrit pas";
const rSub=svgEl('text',{'text-anchor':'middle','font-size':'8',fill:'#4b5563',opacity:'0'});
rSub.textContent='silence · corps · mort';
divG.appendChild(leftCell);divG.appendChild(rightCell);
divG.appendChild(lLabel);divG.appendChild(lSub1);divG.appendChild(lSub2);
divG.appendChild(rLabel);divG.appendChild(rSub);

svg.appendChild(motherG);
svg.appendChild(divG);

// ── Update function — only attribute mutations, no DOM changes ──
function update(progress){
  if(progress<0.001){
    set(motherG,{opacity:'1'});
    set(divG,{opacity:'0'});
    return;
  }
  set(motherG,{opacity:'0'});
  set(divG,{opacity:'1'});

  const sep=progress*90;
  const ry=R*(1-progress*0.3);
  const lx=CX-sep/2, rx=CX+sep/2;

  set(leftCell,{cx:lx,ry});
  set(rightCell,{cx:rx,ry});

  const labelOpacity=progress>0.5?(progress-0.5)*2:0;
  set(lLabel,{x:lx,y:CY-10,opacity:labelOpacity});
  set(lSub1,{x:lx,y:CY+5,opacity:labelOpacity});
  set(lSub2,{x:lx,y:CY+18,opacity:labelOpacity});
  set(rLabel,{x:rx,y:CY-4,opacity:labelOpacity});
  set(rSub,{x:rx,y:CY+12,opacity:labelOpacity});
}

function divide(){
  if(divided){
    divided=false;
    if(animId)cancelAnimationFrame(animId);
    document.getElementById('btn').textContent='Déclencher la division';
    document.getElementById('lname').textContent='Cellule mère';
    document.getElementById('lstatus').textContent='en attente';
    document.getElementById('rname').style.opacity='.3';
    document.getElementById('rstatus').style.opacity='.3';
    document.getElementById('verdict').style.opacity='0';
    update(0);return;
  }
  divided=true;
  document.getElementById('btn').textContent='Réinitialiser';
  document.getElementById('rname').style.opacity='1';
  const start=performance.now();
  const dur=1400;
  function anim(ts){
    const p=Math.min((ts-start)/dur,1);
    const ease=p<0.5?2*p*p:1-Math.pow(-2*p+2,2)/2;
    update(ease);
    if(p<1){animId=requestAnimationFrame(anim);}
    else{
      document.getElementById('lstatus').textContent='langage reçu · corps absent';
      document.getElementById('rstatus').textContent='fragment non intégré';
      document.getElementById('rstatus').style.opacity='1';
      const v=document.getElementById('verdict');
      v.textContent='fonctionnel mais décalé';
      v.style.opacity='1';
    }
  }
  animId=requestAnimationFrame(anim);
}

update(0);
</script></body></html>"""
