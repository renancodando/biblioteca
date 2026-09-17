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
