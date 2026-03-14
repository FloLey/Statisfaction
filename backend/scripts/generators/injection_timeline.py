"""InjectionTimeline widget — clickable T1/T2/T3 timeline with progress."""


def generate() -> str:
    return """<!doctype html>
<html><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0d0d17;color:#e8e0d0;font-family:system-ui,sans-serif;
  display:flex;align-items:center;justify-content:center;min-height:100vh;padding:16px}
.w{width:100%;max-width:520px}
.label{font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:#6b6b8a;margin-bottom:16px}
.track{position:relative;height:4px;background:#1e1e2e;border-radius:2px;margin:0 24px 32px}
.fill{height:100%;background:linear-gradient(90deg,#4f46e5,#e87f3a);border-radius:2px;width:55%;transition:width .4s}
.now{position:absolute;left:55%;transform:translateX(-50%);top:-8px;
  font-size:8px;color:#e87f3a;text-transform:uppercase;letter-spacing:.1em;white-space:nowrap}
.phases{display:flex;gap:8px}
.phase{flex:1;background:#111120;border:1px solid #1e1e2e;border-radius:8px;padding:14px 12px;
  cursor:pointer;transition:border-color .2s,background .2s;position:relative}
.phase:hover{background:#16162a;border-color:#2a2a4a}
.phase.active{border-color:#4f46e5;background:#16162a}
.phase-num{font-size:9px;letter-spacing:.12em;color:#4f46e5;text-transform:uppercase;margin-bottom:6px}
.phase-title{font-size:12px;font-weight:500;margin-bottom:6px}
.phase-sub{font-size:10px;color:#9ca3af;line-height:1.4}
.phase-body{max-height:0;overflow:hidden;transition:max-height .35s ease,opacity .3s;opacity:0;font-size:10px;color:#6b7280;line-height:1.5;margin-top:0}
.phase.active .phase-body{max-height:120px;opacity:1;margin-top:8px}
.dot{position:absolute;width:10px;height:10px;border-radius:50%;border:2px solid #4f46e5;
  background:#0d0d17;top:-5px;left:50%;transform:translateX(-50%)}
.dot.done{background:#4f46e5}
.dot.current{background:#e87f3a;border-color:#e87f3a;box-shadow:0 0 8px #e87f3a88}
</style></head><body><div class="w">
  <div class="label">L'injection continue — et le seuil qui s'approche</div>
  <div class="track">
    <div class="fill" id="fill"></div>
    <div class="now">↑ maintenant</div>
  </div>
  <div class="phases" id="phases"></div>
</div>
<script>
const data=[
  {
    num:'T1',title:'Division initiale',sub:'Le corpus est transféré',
    body:'La société verse son écriture dans les modèles. Vaste mais incomplet. La réplication autonome est impossible — la cellule fille existe, fonctionne, mais dévie dès qu\'elle extrapole.',
    dotState:'done',progress:0
  },
  {
    num:'T2',title:'Injection continue',sub:'Chaque interaction corrige',
    body:'Le RLHF, le fine-tuning, les retours humains injectent en continu de la valeur, du jugement, de la nuance. Le modèle apprend la forme de la division correcte sans encore pouvoir l\'exécuter seul.',
    dotState:'current',progress:55
  },
  {
    num:'T3',title:'Le seuil',sub:'Réplication stable',
    body:'Un jour, la quantité injectée franchit un seuil. Le modèle peut produire une version améliorée de lui-même sans supervision directe. La division devient fiable. La couture commence à disparaître.',
    dotState:'',progress:100
  }
];

const container=document.getElementById('phases');
let activeIdx=1;

function render(){
  container.innerHTML='';
  data.forEach((d,i)=>{
    const ph=document.createElement('div');
    ph.className='phase'+(i===activeIdx?' active':'');
    ph.innerHTML=`<div class="dot ${d.dotState}"></div>
      <div class="phase-num">${d.num}</div>
      <div class="phase-title">${d.title}</div>
      <div class="phase-sub">${d.sub}</div>
      <div class="phase-body">${d.body}</div>`;
    ph.addEventListener('click',()=>{activeIdx=i===activeIdx?-1:i;render();});
    container.appendChild(ph);
  });
}

render();
</script></body></html>"""
