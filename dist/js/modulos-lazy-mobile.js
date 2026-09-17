const mobile=()=>matchMedia('(max-width:900px)').matches;
const carregados=new Map();
const esperar=ms=>new Promise(r=>setTimeout(r,ms));
const raf2=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));

function estilo(href){
 if([...document.querySelectorAll('link[rel="stylesheet"]')].some(x=>x.getAttribute('href')===href))return;
 const l=document.createElement('link');l.rel='stylesheet';l.href=href;document.head.append(l);
}

async function importar(chave,caminho){
 if(carregados.has(chave))return carregados.get(chave);
 const p=import(caminho).catch(e=>{carregados.delete(chave);throw e});
 carregados.set(chave,p);
 return p;
}

async function fecharPainelAntes(){
 const painel=document.querySelector('#painel');
 if(painel?.open){
  try{painel.close()}catch{}
  await raf2();
  await esperar(55);
 }
}

async function garantir(tipo){
 if(tipo==='constelacao')return importar('constelacao','./constelacao.js?v=20260917c16');
 if(tipo==='observatorio'){
  estilo('/css/observatorio-politico.css?v=20260917p16');
  return importar('observatorio','./observatorio-politico.js?v=20260917p16');
 }
 if(tipo==='eleicoes'){
  estilo('/css/observatorio-politico.css?v=20260917p16');
  await importar('observatorio','./observatorio-politico.js?v=20260917p16');
  await Promise.all([
   importar('eleicoes','./eleicoes-2026.js?v=20260917e13'),
   importar('juridico','./analise-juridica-2026-regras.js?v=20260917j12')
  ]);
  await importar('dossie','./dossie-eleitoral-2026.js?v=20260917d10');
  await importar('dossie-integracao','./dossie-eleitoral-integracao.js?v=20260917di10');
  return;
 }
 if(tipo==='presidencia'){
  estilo('/css/observatorio-politico.css?v=20260917p16');
  await importar('observatorio','./observatorio-politico.js?v=20260917p16');
  await importar('presidencia','./presidencia.js?v=20260917pr13');
  await importar('presidencia-judicial','./presidencia-judicial-integracao.js?v=20260917pj8');
 }
}

async function abrir(tipo,botao){
 const original=botao?.innerHTML;
 try{
  if(botao){botao.disabled=true;botao.setAttribute('aria-busy','true');}
  await fecharPainelAntes();
  if(tipo==='idiomas'){
   document.querySelector('#abrir-idiomas')?.click();
   setTimeout(()=>importar('lingua-viva','./lingua-viva.js?v=20260917v16'),50);
   return;
  }
  if(tipo==='matematica'){
   document.querySelector('#abrir-matematica')?.click();
   return;
  }
  await garantir(tipo);
  if(tipo==='constelacao'){
   document.querySelector('#abrir-constelacao')?.click();
   return;
  }
  const obs=document.querySelector('#abrir-observatorio-politico');
  if(!obs)return;
  obs.click();
  if(tipo==='eleicoes'||tipo==='presidencia'){
   await esperar(100);
   document.querySelector(`[data-obs-aba="${tipo==='eleicoes'?'eleicoes2026':'presidencia'}"]`)?.click();
  }
 }catch(e){
  console.error('Falha ao abrir módulo:',tipo,e);
 }finally{
  if(botao){botao.disabled=false;botao.removeAttribute('aria-busy');if(original!=null)botao.innerHTML=original;}
 }
}

async function abrirManifestoDireto(botao){
 const original=botao?.innerHTML;
 try{
  if(botao){botao.disabled=true;botao.setAttribute('aria-busy','true');}
  await importar('manifesto-completo','./manifesto-final-completo.js?v=20260917mf10');
  await importar('manifesto-fecho','./manifesto-fecho.js?v=20260917mf11');
  const painel=document.querySelector('#painel');
  const alvo=document.querySelector('#conteudo-painel');
  if(!painel||!alvo)throw new Error('Painel do manifesto não encontrado');
  window.BibliotecaManifestoCompleto?.renderizar?.();
  window.BibliotecaManifestoFecho?.aplicar?.();
  painel.scrollTop=0;
  if(!painel.open){
   try{painel.showModal()}catch{painel.setAttribute('open','')}
  }
  await raf2();
  window.BibliotecaManifestoFecho?.aplicar?.();
 }catch(e){
  console.error('Falha ao abrir Manifesto:',e);
  const painel=document.querySelector('#painel');
  const alvo=document.querySelector('#conteudo-painel');
  if(alvo)alvo.innerHTML='<div class="estado-vazio"><h3>Não foi possível abrir o Manifesto.</h3><p>Recarregue a página e tente novamente.</p></div>';
  if(painel&&!painel.open){try{painel.showModal()}catch{}}
 }finally{
  if(botao){botao.disabled=false;botao.removeAttribute('aria-busy');if(original!=null)botao.innerHTML=original;}
 }
}

document.addEventListener('click',e=>{
 const manifesto=e.target.closest?.('[data-painel="manifesto"]');
 if(manifesto){
  e.preventDefault();
  e.stopImmediatePropagation();
  abrirManifestoDireto(manifesto);
  return;
 }
 const modulo=e.target.closest?.('[data-modulo-final]');
 if(modulo){
  e.preventDefault();
  e.stopImmediatePropagation();
  abrir(modulo.dataset.moduloFinal,modulo);
 }
},true);

function carregarDesktopOcioso(){
 if(mobile())return;

 const prepararPolitica=async()=>{
  estilo('/css/observatorio-politico.css?v=20260917p17');
  await importar('observatorio','./observatorio-politico.js?v=20260917p17');
  await Promise.allSettled([
   importar('eleicoes','./eleicoes-2026.js?v=20260917e14'),
   importar('presidencia','./presidencia.js?v=20260917pr14')
  ]);
 };

 const completar=async()=>{
  await Promise.allSettled([
   importar('constelacao','./constelacao.js?v=20260917c17'),
   importar('manifesto-completo','./manifesto-final-completo.js?v=20260917mf10'),
   importar('manifesto-fecho','./manifesto-fecho.js?v=20260917mf11'),
   importar('juridico','./analise-juridica-2026-regras.js?v=20260917j13'),
   importar('dossie','./dossie-eleitoral-2026.js?v=20260917d11'),
   importar('dossie-integracao','./dossie-eleitoral-integracao.js?v=20260917di11'),
   importar('presidencia-judicial','./presidencia-judicial-integracao.js?v=20260917pj9')
  ]);
 };

 requestAnimationFrame(()=>prepararPolitica().catch(e=>console.error('Falha ao preparar módulos políticos no desktop:',e)));
 if('requestIdleCallback'in window)requestIdleCallback(completar,{timeout:3000});else setTimeout(completar,900);
}

carregarDesktopOcioso();
window.BibliotecaLazyModules={garantir,abrir,abrirManifestoDireto};
