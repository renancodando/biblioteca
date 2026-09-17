const carregarEstilo=(href)=>{
 const existente=[...document.querySelectorAll('link[rel="stylesheet"]')].some(x=>x.getAttribute('href')===href);
 if(existente)return;
 const link=document.createElement('link');
 link.rel='stylesheet';
 link.href=href;
 document.head.append(link);
};

carregarEstilo('/css/experiencias.css?v=20260917x4');
carregarEstilo('/css/observatorio-politico.css?v=20260917p4');
carregarEstilo('/css/correcao-lateral.css?v=20260917l4');

async function carregarModulo(caminho,nome){
 try{
  await import(caminho);
  return true;
 }catch(erro){
  console.error(`Falha ao carregar ${nome}:`,erro);
  return false;
 }
}

function marcarConstelacaoEmTestes(){
 const botao=document.querySelector('#abrir-constelacao');
 if(botao&&!botao.querySelector('.fase-testes')){
  const selo=document.createElement('small');
  selo.className='fase-testes';
  selo.textContent='FASE DE TESTES';
  selo.style.cssText='margin-left:.5rem;font-size:.58rem;letter-spacing:.08em;opacity:.72;white-space:nowrap';
  botao.append(selo);
 }
 const rotulo=document.querySelector('#constelacao .constelacao-topo .rotulo');
 if(rotulo&&!rotulo.dataset.testes){
  rotulo.dataset.testes='1';
  rotulo.textContent='MAPA NAVEGÁVEL DE RELAÇÕES ENTRE OBRAS · FASE DE TESTES';
 }
}

marcarConstelacaoEmTestes();
new MutationObserver(marcarConstelacaoEmTestes).observe(document.body,{childList:true,subtree:true});

Promise.allSettled([
 carregarModulo('./constelacao.js?v=20260917c4','Constelação de Livros'),
 carregarModulo('./lingua-viva.js?v=20260917v4','Ouça uma Língua Viva'),
 carregarModulo('./observatorio-politico.js?v=20260917p4','Observatório Político'),
 carregarModulo('./eleicoes-2026.js?v=20260917e1','Central Eleições 2026'),
 carregarModulo('./presidencia.js?v=20260917pr2','Dossiê documental da Presidência')
]);
