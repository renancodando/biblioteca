const carregarEstilo=(href)=>{
 const existente=[...document.querySelectorAll('link[rel="stylesheet"]')].some(x=>x.getAttribute('href')===href);
 if(existente)return;
 const link=document.createElement('link');
 link.rel='stylesheet';
 link.href=href;
 document.head.append(link);
};

carregarEstilo('/css/experiencias.css?v=20260917x15');
carregarEstilo('/css/observatorio-politico.css?v=20260917p15');
carregarEstilo('/css/correcao-lateral.css?v=20260917l15');

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
 carregarModulo('./mobile-dialog-fix.js?v=20260917mob3','Correção de navegação mobile'),
 carregarModulo('./constelacao.js?v=20260917c15','Constelação de Livros'),
 carregarModulo('./lingua-viva.js?v=20260917v15','Ouça uma Língua Viva'),
 carregarModulo('./observatorio-politico.js?v=20260917p15','Observatório Político'),
 carregarModulo('./eleicoes-2026.js?v=20260917e12','Central Eleições 2026'),
 carregarModulo('./analise-juridica-2026-regras.js?v=20260917j11','Regras jurídicas documentais 2026'),
 carregarModulo('./dossie-eleitoral-2026.js?v=20260917d9','Dossiê eleitoral verificável 2026'),
 carregarModulo('./dossie-eleitoral-integracao.js?v=20260917di9','Integração do dossiê eleitoral'),
 carregarModulo('./presidencia.js?v=20260917pr12','Dossiê documental da Presidência'),
 carregarModulo('./presidencia-judicial-integracao.js?v=20260917pj7','Histórico judicial público da Presidência')
]).then(async()=>{
 await carregarModulo('./finalizacao-biblioteca.js?v=20260917f6','Revisão final da Biblioteca Livre');
 await carregarModulo('./manifesto-final-completo.js?v=20260917mf7','Manifesto integral da Biblioteca Livre');
 await carregarModulo('./manifesto-fecho.js?v=20260917mf8','Fecho definitivo do manifesto');
});
