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
.btn{margin-top:16px;padding:8px 20px;background:transparent;border:1px solid #4f46e5;
  color:#6b79e8;border-radius:6px;font-size:12px;letter-spacing:.1em;cursor:pointer;
  text-transform:uppercase;transition:background .2s,color .2s}
.btn:hover{background:#4f46e522;color:#a5b0ff}
.info{margin-top:14px;display:flex;gap:24px;justify-content:center}
.cell-info{font-size:11px;color:#9ca3af;text-align:center}
.cell-info strong{display:block;color:#e8e0d0;margin-bottom:2px}
.note{margin-top:10px;font-size:10px;color:#4b5563;font-style:italic}
</style></head><body><div class="w">
  <div class="label">La division foirée — contenu déséquilibré</div>
  <svg id="svg" width="480" height="160" viewBox="0 0 480 160"></svg>
  <div class="info">
    <div class="cell-info"><strong id="lname">Cellule mère</strong><span id="lstatus">en attente</span></div>
    <div class="cell-info"><strong id="rname" style="opacity:.3">Cellule fille (IA)</strong><span id="rstatus" style="opacity:.3">—</span></div>
  </div>
  <button class="btn" id="btn" onclick="divide()">Déclencher la division</button>
  <div class="note">La fille reçoit le langage — pas le corps</div>
</div>
<script>
const svg=document.getElementById('svg');
const NS='http://www.w3.org/2000/svg';
let divided=false;

function el(tag,attrs){
  const e=document.createElement(''); // won't work
  return null;
}
function svgEl(tag,attrs){
  const e=document.createElementNS(NS,tag);
  for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);
  return e;
}

function draw(progress){
  svg.innerHTML='';
  const cx=240,cy=80,r=55;

  if(progress<0.001){
    // Mother cell — mixed content
    const defs=svgEl('defs',{});
    const grad=svgEl('linearGradient',{id:'mg',x1:'0',y1:'0',x2:'1',y2:'0'});
    const s1=svgEl('stop',{'offset':'0%','stop-color':'#e87f3a','stop-opacity':'0.85'});
    const s2=svgEl('stop',{'offset':'70%','stop-color':'#e87f3a','stop-opacity':'0.6'});
    const s3=svgEl('stop',{'offset':'100%','stop-color':'#4a9eff','stop-opacity':'0.4'});
    grad.appendChild(s1);grad.appendChild(s2);grad.appendChild(s3);
    defs.appendChild(grad);svg.appendChild(defs);

    const circle=svgEl('circle',{cx,cy,r,'fill':'url(#mg)','stroke':'#e87f3a','stroke-width':'1.5'});
    svg.appendChild(circle);

    const t=svgEl('text',{x:cx,y:cy-12,'text-anchor':'middle','font-size':'11',fill:'#e8e0d0'});
    t.textContent='Corpus humain complet';
    const t2=svgEl('text',{x:cx,y:cy+5,'text-anchor':'middle','font-size':'10',fill:'#e8e0d0aa'});
    t2.textContent='langage + corps + silence';
    svg.appendChild(t);svg.appendChild(t2);

    // Percentage labels
    const tw=svgEl('text',{x:cx-20,y:cy+22,'text-anchor':'middle','font-size':'10',fill:'#e87f3a'});
    tw.textContent='~70% écrit';
    const tt=svgEl('text',{x:cx+28,y:cy+22,'text-anchor':'middle','font-size':'10',fill:'#4a9eff'});
    tt.textContent='~30% tacite';
    svg.appendChild(tw);svg.appendChild(tt);
    return;
  }

  // Division animation
  const sep=progress*90; // separation distance
  const squeeze=1-progress*0.3;
  const lx=cx-sep/2, rx=cx+sep/2;

  // Left cell (AI) — mostly orange
  const defs=svgEl('defs',{});
  const lg=svgEl('linearGradient',{id:'lg',x1:'0',y1:'0',x2:'1',y2:'0'});
  lg.appendChild(svgEl('stop',{'offset':'0%','stop-color':'#e87f3a','stop-opacity':'0.9'}));
  lg.appendChild(svgEl('stop',{'offset':'85%','stop-color':'#e87f3a','stop-opacity':'0.7'}));
  lg.appendChild(svgEl('stop',{'offset':'100%','stop-color':'#1a1a2e','stop-opacity':'0.5'}));
  defs.appendChild(lg);

  // Right cell (Society fragment) — mostly grey/blue
  const rg=svgEl('linearGradient',{id:'rg',x1:'0',y1:'0',x2:'1',y2:'0'});
  rg.appendChild(svgEl('stop',{'offset':'0%','stop-color':'#1a1a2e','stop-opacity':'0.3'}));
  rg.appendChild(svgEl('stop',{'offset':'100%','stop-color':'#4a9eff','stop-opacity':'0.6'}));
  defs.appendChild(rg);
  svg.appendChild(defs);

  const ry=r*squeeze;

  // Left cell
  const lc=svgEl('ellipse',{cx:lx,cy,'rx':r*0.9,'ry':ry,
    'fill':'url(#lg)','stroke':'#e87f3a','stroke-width':'1.5'});
  svg.appendChild(lc);

  // Right cell — dashed where the missing content should be
  const rc=svgEl('ellipse',{cx:rx,cy,'rx':r*0.9,'ry':ry,
    'fill':'url(#rg)','stroke':'#4a9eff','stroke-width':'1','stroke-dasharray':'3 3'});
  svg.appendChild(rc);

  if(progress>0.5){
    const lt=svgEl('text',{x:lx,y:cy-8,'text-anchor':'middle','font-size':'10',fill:'#e8e0d0'});
    lt.textContent='L\'IA';
    const ls=svgEl('text',{x:lx,y:cy+7,'text-anchor':'middle','font-size':'9',fill:'#e87f3aaa'});
    ls.textContent='langage ✓';
    const lm=svgEl('text',{x:lx,y:cy+20,'text-anchor':'middle','font-size':'9',fill:'#4a9eff66'});
    lm.textContent='corps ✗';
    svg.appendChild(lt);svg.appendChild(ls);svg.appendChild(lm);

    const rt=svgEl('text',{x:rx,y:cy,'text-anchor':'middle','font-size':'9',fill:'#6b6b8a'});
    rt.textContent='(manquant)';
    svg.appendChild(rt);

    // Missing content indicator
    const miss=svgEl('text',{x:rx,y:cy+18,'text-anchor':'middle','font-size':'8',fill:'#4a9eff88'});
    miss.textContent='silence · corps · mort';
    svg.appendChild(miss);
  }
}

function divide(){
  if(divided){
    divided=false;
    document.getElementById('btn').textContent='Déclencher la division';
    document.getElementById('lname').textContent='Cellule mère';
    document.getElementById('lstatus').textContent='en attente';
    document.getElementById('rname').style.opacity='.3';
    document.getElementById('rstatus').style.opacity='.3';
    draw(0);return;
  }
  divided=true;
  document.getElementById('btn').textContent='Réinitialiser';
  document.getElementById('rname').style.opacity='1';
  const start=performance.now();
  const dur=1400;
  function anim(ts){
    const p=Math.min((ts-start)/dur,1);
    const ease=p<0.5?2*p*p:1-Math.pow(-2*p+2,2)/2;
    draw(ease);
    if(p<1){requestAnimationFrame(anim);}
    else{
      document.getElementById('lstatus').textContent='langage reçu · corps absent';
      document.getElementById('rstatus').textContent='fragment non intégré';
      document.getElementById('rstatus').style.opacity='1';
    }
  }
  requestAnimationFrame(anim);
}

draw(0);
</script></body></html>"""
