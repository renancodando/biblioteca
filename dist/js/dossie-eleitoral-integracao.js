const estiloIntegracao=document.createElement('style');
estiloIntegracao.textContent='.eleicao-acoes .botao-dossie-completo{grid-column:1/-1;border-color:#d5b58370;color:#ead7b4}.judicial-resumo-card{display:grid;gap:3px;border-top:1px solid var(--linha);padding-top:10px}.judicial-resumo-card span{font:9px var(--ui);letter-spacing:.11em;color:#a9987d}.judicial-resumo-card b{font:16px var(--serif);font-weight:400;color:#e4d5bd}.judicial-resumo-card small{font:10px/1.35 var(--ui);color:#91887c}';
document.head.append(estiloIntegracao);

function integrarCartoes(){
 const cartoes=[...document.querySelectorAll('.eleicao-candidato')];
 let mudou=false;
 for(const cartao of cartoes){
  const base=cartao.querySelector('[data-candidato-eleicao]');
  if(!base)continue;
  const nome=base.dataset.candidatoEleicao||'';
  if(!nome)continue;
  const acoes=cartao.querySelector('.eleicao-acoes');
  if(acoes&&!acoes.querySelector('[data-dossie-completo]')){
   const botao=document.createElement('button');
   botao.dataset.dossieCompleto=nome;
   botao.className='botao-dossie-completo';
   botao.textContent='Dossiê completo';
   acoes.append(botao);
   mudou=true;
  }
  if(!cartao.querySelector('[data-judicial-resumo]')){
   const resumo=document.createElement('div');
   resumo.className='judicial-resumo-card';
   resumo.dataset.judicialResumo=nome;
   resumo.dataset.nomeCompleto=nome;
   resumo.innerHTML='<span>STF · HISTÓRICO PÚBLICO</span><small>Quantidade será consultada na fonte oficial</small>';
   const situacao=cartao.querySelector('.eleicao-situacao');
   situacao?.after(resumo);
   mudou=true;
  }
 }
 if(mudou||cartoes.length){
  let tentativas=0;
  const ligar=()=>{
   tentativas++;
   if(window.BibliotecaDossieEleitoral2026?.prepararCartoes){window.BibliotecaDossieEleitoral2026.prepararCartoes();return}
   if(tentativas<30)setTimeout(ligar,150);
  };
  ligar();
 }
}

document.addEventListener('click',e=>{
 const b=e.target.closest?.('[data-dossie-completo]');
 if(!b)return;
 const nome=b.dataset.dossieCompleto;
 if(window.BibliotecaDossieEleitoral2026?.abrir)window.BibliotecaDossieEleitoral2026.abrir(nome);
});

integrarCartoes();
new MutationObserver(integrarCartoes).observe(document.body,{childList:true,subtree:true});
