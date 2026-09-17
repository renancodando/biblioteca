const estilo=document.createElement('link');
estilo.rel='stylesheet';
estilo.href='/css/experiencias.css?v=20260917x1';
document.head.append(estilo);
const estiloObservatorio=document.createElement('link');
estiloObservatorio.rel='stylesheet';
estiloObservatorio.href='/css/observatorio-politico.css?v=20260917p1';
document.head.append(estiloObservatorio);
import './constelacao.js';
import './lingua-viva.js';
import './observatorio-politico.js';

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
