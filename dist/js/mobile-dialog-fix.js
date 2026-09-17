const mobile=()=>matchMedia('(max-width:900px)').matches;
const esperar=ms=>new Promise(r=>setTimeout(r,ms));
const raf=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));

const estilo=document.createElement('style');
estilo.textContent=`@media(max-width:900px){#painel{overscroll-behavior:contain;-webkit-overflow-scrolling:touch}#painel>.fechar{position:fixed!important;z-index:2147483646!important;right:max(14px,env(safe-area-inset-right))!important;top:max(12px,env(safe-area-inset-top))!important;background:#0d1512f2!important;box-shadow:0 8px 28px #0008!important}dialog[open]{pointer-events:auto!important}}`;
document.head.append(estilo);

function limparBloqueio(){
 document.documentElement.classList.remove('mobile-dialog-transicao');
 document.body.classList.remove('mobile-dialog-transicao');
 if(!document.querySelector('dialog[open]')){
  document.body.style.removeProperty('overflow');
  document.documentElement.style.removeProperty('overflow');
 }
}

function fecharDialog(d){
 if(!d?.open)return;
 try{d.close()}catch{}
}

function fecharTodos(exceto=null){
 for(const d of document.querySelectorAll('dialog[open]'))if(d!==exceto)fecharDialog(d);
}

async function transicao(acao){
 document.documentElement.classList.add('mobile-dialog-transicao');
 document.body.classList.add('mobile-dialog-transicao');
 fecharTodos();
 await raf();
 await esperar(90);
 limparBloqueio();
 await acao();
}

function clicarExterno(seletor){
 const alvo=[...document.querySelectorAll(seletor)].find(x=>!x.closest('#painel'));
 if(!alvo)return false;
 alvo.dataset.mobileBypass='1';
 alvo.click();
 setTimeout(()=>delete alvo.dataset.mobileBypass,0);
 return true;
}

async function abrirModulo(tipo){
 const ids={constelacao:'#abrir-constelacao',idiomas:'#abrir-idiomas',matematica:'#abrir-matematica',observatorio:'#abrir-observatorio-politico'};
 if(ids[tipo]){
  const alvo=document.querySelector(ids[tipo]);
  if(alvo)alvo.click();
  return;
 }
 if(tipo==='eleicoes'||tipo==='presidencia'){
  const obs=document.querySelector('#abrir-observatorio-politico');
  if(!obs)return;
  obs.click();
  await esperar(180);
  document.querySelector(`[data-obs-aba="${tipo==='eleicoes'?'eleicoes2026':'presidencia'}"]`)?.click();
 }
}

async function irAcao(tipo){
 clicarExterno(`[data-acao="${CSS.escape(tipo)}"]`);
}

document.addEventListener('click',e=>{
 if(!mobile())return;
 const botao=e.target.closest('button,a[data-fechar]');
 if(!botao||botao.dataset.mobileBypass==='1')return;
 const dentroPainel=Boolean(botao.closest('#painel'));
 if(botao.dataset.fechar==='painel'){
  e.preventDefault();
  e.stopImmediatePropagation();
  fecharDialog(document.querySelector('#painel'));
  requestAnimationFrame(limparBloqueio);
  return;
 }
 if(!dentroPainel)return;
 if(botao.dataset.painel){
  return;
 }
 if(botao.dataset.moduloFinal){
  e.preventDefault();
  e.stopImmediatePropagation();
  const tipo=botao.dataset.moduloFinal;
  transicao(()=>abrirModulo(tipo));
  return;
 }
 if(botao.dataset.acao){
  e.preventDefault();
  e.stopImmediatePropagation();
  const tipo=botao.dataset.acao;
  transicao(()=>irAcao(tipo));
 }
},true);

for(const d of document.querySelectorAll('dialog')){
 d.addEventListener('close',()=>requestAnimationFrame(limparBloqueio));
 d.addEventListener('cancel',()=>requestAnimationFrame(limparBloqueio));
}

addEventListener('pageshow',()=>{if(!document.querySelector('dialog[open]'))limparBloqueio()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!document.querySelector('dialog[open]'))limparBloqueio()});

window.BibliotecaMobileDialogFix={fecharTodos,limparBloqueio};
