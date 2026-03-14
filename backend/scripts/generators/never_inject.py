"""NeverInject widget — the boundary language cannot cross."""


def generate() -> str:
    return """<!doctype html>
<html><head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0d0d17;color:#e8e0d0;font-family:system-ui,sans-serif;
  display:flex;align-items:center;justify-content:center;min-height:100vh;padding:16px}
.w{width:100%;max-width:520px}
.label{font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:#6b6b8a;margin-bottom:14px}
.stage{position:relative;height:180px;background:#0a0a12;border-radius:8px;overflow:hidden;
  border:1px solid #1e1e2e}
.half{position:absolute;top:0;bottom:0;width:50%;display:flex;flex-direction:column;
  justify-content:center;gap:0;overflow:hidden}
.half-left{left:0;padding:12px 20px 12px 12px}
.half-right{right:0;padding:12px 12px 12px 20px}
.half-title{font-size:9px;letter-spacing:.14em;text-transform:uppercase;margin-bottom:10px;
  font-style:normal}
.half-left .half-title{color:#e87f3a88}
.half-right .half-title{color:#4b5563}
.divider{position:absolute;left:50%;top:0;bottom:0;width:1px;
  background:linear-gradient(180deg,transparent,#4f46e5 20%,#4f46e5 80%,transparent);
  transform:translateX(-50%)}
.divider-label{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
  font-size:8px;color:#4f46e5;letter-spacing:.1em;white-space:nowrap;
  background:#0a0a12;padding:2px 6px;border:1px solid #4f46e522}
.token{font-size:10px;padding:3px 8px;border-radius:3px;margin:2px 0;
  display:inline-block;cursor:default;transition:opacity .2s,background .2s}
.token-pass{background:#e87f3a18;color:#e87f3acc;border:1px solid #e87f3a33}
.token-pass:hover{background:#e87f3a30;border-color:#e87f3a66}
.token-block{color:#4b5563;border:1px dashed #4b5563;background:transparent}
.token-block:hover{color:#6b6b8a;border-color:#6b6b8a}
.token-block.fading{animation:fade-out 2s ease-in-out infinite}
@keyframes fade-out{0%,100%{opacity:.7}50%{opacity:.2}}
.question{margin-top:14px;text-align:center;font-size:11px;color:#6b6b8a;font-style:italic;
  line-height:1.6;padding:12px;border-top:1px solid #1e1e2e}
.question strong{display:block;color:#e8e0d0;font-style:normal;font-weight:400;margin-top:6px;
  font-size:12px;letter-spacing:.01em}
.tooltip{position:fixed;background:#1e1e2e;border:1px solid #2a2a3a;border-radius:4px;
  padding:6px 10px;font-size:10px;color:#e8e0d0;pointer-events:none;z-index:100;
  max-width:180px;line-height:1.4;display:none}
</style></head><body><div class="w">
  <div class="label">Ce que le langage ne peut pas traverser</div>
  <div class="stage">
    <div class="half half-left">
      <div class="half-title">Ce qui passe</div>
      <div id="pass-tokens"></div>
    </div>
    <div class="half half-right">
      <div class="half-title">Ce qui reste</div>
      <div id="block-tokens"></div>
    </div>
    <div class="divider"></div>
    <div class="divider-label">filtre</div>
  </div>
  <div class="question">
    La division sera-t-elle un jour vraiment parfaite — ou toujours parfaite sauf pour ce qui ne s'écrit pas ?
    <strong>Ce qui se répliquera un jour, ce n'est pas nous.<br>C'est la version de nous que le langage était capable de tenir.</strong>
  </div>
</div>
<div class="tooltip" id="tip"></div>
<script>
const passItems=[
  {text:'langage',def:'Syntaxe, sémantique, grammaire — tout ce qui se code en mots.'},
  {text:'logique',def:'Raisonnement formel, déduction, inférence.'},
  {text:'culture',def:'Références partagées, normes sociales, histoire écrite.'},
  {text:'raisonnement',def:'Enchaînements d\'idées, arguments, structures de pensée.'},
  {text:'valeurs',def:'Jugements moraux tels qu\'ils ont été formulés par écrit.'},
  {text:'mémoire écrite',def:'Tout ce qui a été archivé, transcrit, numérisé.'},
];

const blockItems=[
  {text:'fatigue',def:'L\'épuisement qui tronque la pensée — pas un concept, une limite physique.'},
  {text:'douleur',def:'Un texte sur la douleur n\'est pas la douleur.'},
  {text:'faim',def:'La pression corporelle qui ramène à l\'essentiel.'},
  {text:'mort',def:'La contrainte ultime qui donne un poids à chaque décision.'},
  {text:'peur',def:'L\'affect incarné qui court-circuite le raisonnement.'},
  {text:'le silence',def:'Ce qui se sait sans jamais avoir été dit.'},
  {text:'ce qu\'on n\'a pas su dire',def:'Le blanc dans la copie. Indéfiniment.'},
];

const tip=document.getElementById('tip');

function makeToken(item,isPass){
  const d=document.createElement('div');
  d.className='token '+(isPass?'token-pass':'token-block fading');
  d.textContent=item.text;
  d.addEventListener('mouseenter',e=>{
    tip.textContent=item.def;
    tip.style.display='block';
    tip.style.left=(e.clientX+12)+'px';
    tip.style.top=(e.clientY-8)+'px';
  });
  d.addEventListener('mousemove',e=>{
    tip.style.left=(e.clientX+12)+'px';
    tip.style.top=(e.clientY-8)+'px';
  });
  d.addEventListener('mouseleave',()=>tip.style.display='none');
  return d;
}

const passEl=document.getElementById('pass-tokens');
const blockEl=document.getElementById('block-tokens');
passItems.forEach(i=>passEl.appendChild(makeToken(i,true)));
blockItems.forEach((i,idx)=>{
  const t=makeToken(i,false);
  t.style.animationDelay=(idx*0.4)+'s';
  blockEl.appendChild(t);
});
</script></body></html>"""
