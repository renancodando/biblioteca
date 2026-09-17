const estilo=document.createElement('link');
estilo.rel='stylesheet';
estilo.href='/css/presidencia.css?v=20260917pr1';
document.head.append(estilo);

const registros=[
 {nome:'Luiz Inácio Lula da Silva',apelido:'Lula',atual:true,aliases:['lula','luiz inacio lula da silva','presidente atual','atual'],periodos:['01/01/2003 a 31/12/2010','desde 01/01/2023'],vice:'Geraldo Alckmin no mandato atual',nota:'Presidente da República no mandato iniciado em 1º de janeiro de 2023.',fontes:[['Planalto','https://www.gov.br/planalto/pt-br'],['Acervo presidencial','https://www.gov.br/secretariageral/pt-br/centrais-de-conteudo/biblioteca-da-pr/galeria-dos-ex-presidentes/luiz-inacio-lula-da-silva']]},
 {nome:'Jair Messias Bolsonaro',apelido:'Jair Bolsonaro',aliases:['jair','bolsonaro','jair bolsonaro'],periodos:['01/01/2019 a 31/12/2022'],vice:'Hamilton Mourão',nota:'Ex-presidente da República.',fontes:[['Acervo presidencial','https://www.biblioteca.presidencia.gov.br/presidencia/ex-presidentes/bolsonaro/Bolsonaro']]},
 {nome:'Michel Miguel Elias Temer Lulia',apelido:'Michel Temer',aliases:['michel temer','temer'],periodos:['Presidente em exercício: 12/05/2016 a 31/08/2016','Presidente da República: 31/08/2016 a 31/12/2018'],vice:'Cargo de vice-presidente vago durante a Presidência definitiva',nota:'Ex-presidente da República.',fontes:[['Acervo presidencial','https://www.gov.br/secretariageral/pt-br/centrais-de-conteudo/biblioteca-da-pr/galeria-dos-ex-presidentes/capa-dados-ex-presidente']]},
 {nome:'Dilma Vana Rousseff',apelido:'Dilma Rousseff',aliases:['dilma','dilma rousseff'],periodos:['01/01/2011 a 31/12/2014','01/01/2015 a 31/08/2016'],vice:'Michel Temer',nota:'Ex-presidenta da República. O mandato foi encerrado em 31 de agosto de 2016 após julgamento do processo de impeachment pelo Senado.',fontes:[['Acervo presidencial','https://www.gov.br/secretariageral/pt-br/centrais-de-conteudo/biblioteca-da-pr/galeria-dos-ex-presidentes/dilma-vana-rousseff']]},
 {nome:'Fernando Henrique Cardoso',apelido:'Fernando Henrique Cardoso',aliases:['fhc','fernando henrique','fernando henrique cardoso'],periodos:['01/01/1995 a 31/12/1998','01/01/1999 a 31/12/2002'],vice:'Marco Maciel',nota:'Ex-presidente da República.',fontes:[['Acervo presidencial','https://www.gov.br/secretariageral/pt-br/centrais-de-conteudo/biblioteca-da-pr/galeria-dos-ex-presidentes/fernando-henrique-cardoso']]},
 {nome:'Itamar Augusto Cautiero Franco',apelido:'Itamar Franco',aliases:['itamar','itamar franco'],periodos:['Empossado na Presidência em 29/12/1992','Governo até 31/12/1994'],vice:'Cargo de vice-presidente vago após a sucessão',nota:'Ex-presidente da República.',fontes:[['Acervo presidencial','https://www.gov.br/secretariageral/pt-br/centrais-de-conteudo/biblioteca-da-pr/galeria-dos-ex-presidentes/itamar-augusto-cautiero-franco']]},
 {nome:'Fernando Affonso Collor de Mello',apelido:'Fernando Collor',aliases:['collor','fernando collor','fernando collor de mello'],periodos:['Posse em 15/03/1990','Afastado em 02/10/1992','Renúncia em 29/12/1992'],vice:'Itamar Franco',nota:'Ex-presidente da República.',fontes:[['Acervo presidencial','https://www.gov.br/secretariageral/pt-br/centrais-de-conteudo/biblioteca-da-pr/galeria-dos-ex-presidentes/collor']]},
 {nome:'José Sarney',apelido:'José Sarney',aliases:['sarney','jose sarney'],periodos:['15/03/1985 a 15/03/1990'],vice:'Cargo de vice-presidente vago após a sucessão',nota:'Ex-presidente da República.',fontes:[['Acervo presidencial','https://www.gov.br/secretariageral/pt-br/centrais-de-conteudo/biblioteca-da-pr/galeria-dos-ex-presidentes/jose_sarney']]}
];

const legislacao='https://www4.planalto.gov.br/legislacao/portal-legis/busca-avancada';
const normalizar=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const escapar=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function resultados(q){
 const n=normalizar(q);
 if(!n||n==='presidente'||n==='presidente atual'||n==='atual')return registros.filter(x=>x.atual);
 if(n==='ex presidente'||n==='ex presidentes'||n==='ex-presidente'||n==='ex-presidentes')return registros.filter(x=>!x.atual);
 return registros.filter(x=>normalizar([x.nome,x.apelido,...x.aliases].join(' ')).includes(n));
}

function cartao(p){
 return `<article class="presidencia-cartao ${p.atual?'atual':''}">
  <header><div><span class="rotulo">${p.atual?'PRESIDENTE DA REPÚBLICA · ATUAL':'REGISTRO DE EX-PRESIDENTE'}</span><h4>${escapar(p.nome)}</h4>${p.apelido!==p.nome?`<small>${escapar(p.apelido)}</small>`:''}</div>${p.atual?'<b class="presidencia-selo">MANDATO ATUAL</b>':''}</header>
  <div class="presidencia-dados"><div><small>Período(s)</small>${p.periodos.map(x=>`<span>${escapar(x)}</span>`).join('')}</div><div><small>Vice-Presidência</small><span>${escapar(p.vice)}</span></div></div>
  <p>${escapar(p.nota)}</p>
  <div class="presidencia-acoes">${p.fontes.map(([nome,url])=>`<a href="${url}" target="_blank" rel="noopener noreferrer">${escapar(nome)} ↗</a>`).join('')}<a href="${legislacao}" target="_blank" rel="noopener noreferrer">Atos e legislação ↗</a><button data-presidencia-justica>Justiça & processos</button></div>
 </article>`;
}

function renderizar(q='presidente atual'){
 const area=document.querySelector('#observatorio-conteudo');
 if(!area)return;
 const itens=resultados(q);
 area.innerHTML=`<div class="presidencia-area"><section class="presidencia-busca"><span class="rotulo">PRESIDÊNCIA DA REPÚBLICA</span><h3>Pesquise o presidente ou um ex-presidente.</h3><p>Consulta documental baseada em fontes oficiais. A Biblioteca mostra mandato, sucessão e links de origem, sem avaliar desempenho político.</p><form id="form-presidencia" class="obs-form"><input id="campo-presidencia" type="search" value="${escapar(q==='presidente atual'?'':q)}" placeholder="Ex.: Lula, Bolsonaro, Dilma, FHC, Sarney…"><button class="primario">Pesquisar</button></form><div class="presidencia-rapida"><button data-presidente-rapido="presidente atual">Atual</button><button data-presidente-rapido="Lula">Lula</button><button data-presidente-rapido="Bolsonaro">Bolsonaro</button><button data-presidente-rapido="Dilma">Dilma</button><button data-presidente-rapido="FHC">FHC</button><button data-presidente-rapido="ex-presidentes">Ex-presidentes</button></div></section><section id="resultado-presidencia" class="presidencia-resultados">${itens.length?itens.map(cartao).join(''):'<div class="obs-vazio">Nenhum presidente deste recorte foi encontrado. Esta versão cobre presidentes desde 1985.</div>'}</section><div class="presidencia-nota">Para atos assinados, decretos e legislação, use a Pesquisa de Legislação da Presidência. Para processos judiciais, a Biblioteca mantém a consulta separada por número processual para evitar associação indevida de homônimos.</div></div>`;
 const form=document.querySelector('#form-presidencia');
 form?.addEventListener('submit',e=>{e.preventDefault();renderizar(document.querySelector('#campo-presidencia')?.value||'')});
 document.querySelectorAll('[data-presidente-rapido]').forEach(b=>b.addEventListener('click',()=>renderizar(b.dataset.presidenteRapido)));
 document.querySelectorAll('[data-presidencia-justica]').forEach(b=>b.addEventListener('click',()=>window.BibliotecaObservatorioPolitico?.mostrar?.('justica')));
}

function instalar(){
 const dialogo=document.querySelector('#observatorio-politico');
 const abas=dialogo?.querySelector('.observatorio-abas');
 if(!abas||abas.querySelector('[data-obs-aba="presidencia"]'))return Boolean(abas);
 const botao=document.createElement('button');
 botao.dataset.obsAba='presidencia';
 botao.textContent='Presidência';
 const referencia=abas.querySelector('[data-obs-aba="parlamentares"]');
 referencia?.before(botao);
 botao.addEventListener('click',()=>{
  abas.querySelectorAll('[data-obs-aba]').forEach(x=>x.classList.toggle('ativo',x===botao));
  renderizar();
 });
 return true;
}

if(!instalar()){
 const observador=new MutationObserver(()=>{if(instalar())observador.disconnect()});
 observador.observe(document.body,{childList:true,subtree:true});
}
