"""CorpusFlow widget — animated particle flow showing knowledge compression."""


def generate() -> str:
    return """<!doctype html>
<html><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0d0d17;color:#e8e0d0;font-family:system-ui,sans-serif;
  display:flex;align-items:center;justify-content:center;min-height:100vh;padding:16px}
.w{width:100%;max-width:520px}
.label{font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:#6b6b8a;margin-bottom:14px}
.stage{position:relative;height:96px;background:#111120;border-radius:8px;overflow:hidden;
  display:flex;align-items:stretch}
.side{display:flex;align-items:center;padding:0 14px;z-index:2;flex-shrink:0}
.side span{font-size:10px;color:#6b6b8a;text-transform:uppercase;letter-spacing:.08em;
  line-height:1.4;text-align:center}
.stream{position:relative;flex:1;overflow:hidden}
.filter{position:absolute;left:50%;top:0;width:2px;height:100%;
  background:linear-gradient(180deg,transparent,#4f46e5 25%,#4f46e5 75%,transparent);
  transform:translateX(-50%);z-index:1}
.flabel{position:absolute;left:50%;transform:translateX(-50%);top:6px;
  font-size:9px;color:#8892f8;letter-spacing:.1em;white-space:nowrap;z-index:2;
  background:#111120;padding:0 4px}
.dot{position:absolute;width:7px;height:7px;border-radius:50%}
.counters{display:flex;gap:0;margin-top:10px;background:#111120;border-radius:6px;overflow:hidden}
.counter{flex:1;padding:8px 12px;text-align:center;border-right:1px solid #1e1e2e}
.counter:last-child{border-right:none}
.counter-val{font-size:18px;font-weight:300;letter-spacing:-.02em;margin-bottom:2px}
.counter-label{font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:#6b6b8a}
.legend{display:flex;gap:20px;margin-top:10px;justify-content:center}
.li{display:flex;align-items:center;gap:7px;font-size:11px;color:#9ca3af}
.ld{width:7px;height:7px;border-radius:50%}
.quote{margin-top:14px;text-align:center;font-size:11px;color:#4b5563;font-style:italic;
  border-top:1px solid #1e1e2e;padding-top:12px}
.quote strong{color:#6b6b8a;font-style:normal}
</style></head><body><div class="w">
  <div class="label">La société éjecte — compression du corpus humain</div>
  <div class="stage">
    <div class="side"><span>Corpus<br>humain</span></div>
    <div class="stream" id="s">
      <div class="filter"></div>
      <div class="flabel">filtre linguistique</div>
    </div>
    <div class="side"><span>Modèle<br>IA</span></div>
  </div>
  <div class="counters">
    <div class="counter">
      <div class="counter-val" id="cnt-pass" style="color:#e87f3a">0</div>
      <div class="counter-label">fragments passés</div>
    </div>
    <div class="counter">
      <div class="counter-val" id="cnt-block" style="color:#4a9eff">0</div>
      <div class="counter-label">bloqués</div>
    </div>
    <div class="counter">
      <div class="counter-val" id="cnt-pct" style="color:#6b6b8a">0%</div>
      <div class="counter-label">taux de perte</div>
    </div>
  </div>
  <div class="legend">
    <div class="li"><div class="ld" style="background:#e87f3a"></div>Savoir écrit (passe)</div>
    <div class="li"><div class="ld" style="background:#4a9eff"></div>Savoir incarné (bloqué)</div>
  </div>
  <div class="quote"><strong>« L'IA n'est pas née. Elle a été extraite. »</strong></div>
</div>
<script>
const stream=document.getElementById('s');
let passed=0,blocked=0;

function updateCounters(){
  document.getElementById('cnt-pass').textContent=passed;
  document.getElementById('cnt-block').textContent=blocked;
  const total=passed+blocked;
  const pct=total>0?Math.round(blocked/total*100):0;
  document.getElementById('cnt-pct').textContent=pct+'%';
}

function particle(isWritten,yRatio,delay){
  const d=document.createElement('div');
  d.className='dot';
  const y=8+yRatio*72;
  const col=isWritten?'#e87f3a':'#4a9eff';
  d.style.cssText=`top:${y}px;background:${col};box-shadow:0 0 5px ${col}88`;
  stream.appendChild(d);
  const dur=2600+Math.random()*600;
  let t0=null;let counted=false;
  function frame(ts){
    if(!t0)t0=ts+delay;
    const el=ts-t0;
    if(el<0){requestAnimationFrame(frame);return;}
    const p=(el%(dur+delay))/dur;
    if(p<0||p>1){requestAnimationFrame(frame);return;}
    const W=stream.clientWidth;
    const x=p*W;
    const mid=W/2;
    if(!isWritten&&x>mid*0.75){
      const fade=(x-mid*0.75)/(mid*0.35);
      d.style.opacity=Math.max(0,1-fade).toString();
      if(!counted&&fade>0.5){counted=true;blocked++;updateCounters();}
      if(fade>=1){d.style.left='-20px';t0=null;counted=false;requestAnimationFrame(frame);return;}
    }else{
      if(isWritten&&!counted&&p>0.9){counted=true;passed++;updateCounters();}
      if(p<0.001)counted=false;
      d.style.opacity=(p<0.06?p/0.06:p>0.94?(1-p)/0.06:1).toString();
    }
    d.style.left=x+'px';
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
for(let i=0;i<9;i++)particle(true,Math.random(),i*300+Math.random()*150);
for(let i=0;i<6;i++)particle(false,Math.random(),i*480+Math.random()*200);
</script></body></html>"""
