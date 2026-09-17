const carregarEstilo=(href)=>{
 const existente=[...document.querySelectorAll('link[rel="stylesheet"]')].some(x=>x.getAttribute('href')===href);
 if(existente)return;
 const link=document.createElement('link');
 link.rel='stylesheet';
 link.href=href;
 document.head.append(link);
};

carregarEstilo('/css/experiencias.css?v=20260917x7');
carregarEstilo('/css/observatorio-politico.css?v=20260917p7');
carregarEstilo('/css/correcao-lateral.css?v=20260917l7');

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
 carregarModulo('./constelacao.js?v=20260917c7','Constelação de Livros'),
 carregarModulo('./lingua-viva.js?v=20260917v7','Ouça uma Língua Viva'),
 carregarModulo('./observatorio-politico.js?v=20260917p7','Observatório Político'),
 carregarModulo('./eleicoes-2026.js?v=20260917e4','Central Eleições 2026'),
 carregarModulo('./analise-juridica-2026-extra.js?v=20260917j3','Triagem jurídica complementar 2026'),
 carregarModulo('./dossie-eleitoral-2026.js?v=20260917d1','Dossiê eleitoral verificável 2026'),
 carregarModulo('./dossie-eleitoral-integracao.js?v=20260917di1','Integração do dossiê eleitoral'),
 carregarModulo('./presidencia.js?v=20260917pr4','Dossiê documental da Presidência')
]);
