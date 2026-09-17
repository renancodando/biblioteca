const estilo=document.createElement('link');
estilo.rel='stylesheet';
estilo.href='/css/eleicoes-2026.css?v=20260917e1';
document.head.append(estilo);

const $=(s,r=document)=>r.querySelector(s);
const escapar=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let cache=null;

async function dados(){
 if(cache)return cache;
 const r=await fetch('/api/observatorio-politico?modo=eleicoes2026');
 const d=await r.json();
 if(!r.ok)throw new Error(d.erro||'Falha na consulta');
 cache=d;
 return d;
}

function arquivo(nome,url,descricao){return `<a class="eleicao-arquivo" href="${escapar(url)}" target="_blank" rel="noopener noreferrer"><span>PDF / ZIP OFICIAL</span><strong>${escapar(nome)}</strong><small>${escapar(descricao)}</small><b>Baixar ↗</b></a>`}
function cartao(c){return `<article class="eleicao-candidato"><div class="eleicao-candidato-topo"><div><span class="rotulo">${escapar(c.partido||'PARTIDO NÃO INFORMADO')}</span><h4>${escapar(c.nome)}</h4><p>Vice: ${escapar(c.vice||'Não informado')}</p></div>${c.numero?`<strong class="eleicao-numero">${escapar(c.numero)}</strong>`:''}</div><div class="eleicao-situacao"><span>REGISTRO</span><b>${escapar(c.situacao||'Validado pelo TSE')}</b></div><div class="eleicao-acoes"><button data-candidato-eleicao="${escapar(c.nome)}">Documentos oficiais</button></div></article>`}

async function abrirDetalhe(nome){
 const painel=$('#eleicao-detalhe');
 if(!painel)return;
 painel.innerHTML='<div class="eleicao-carregando">Consultando a ficha oficial e os documentos protocolados no TSE…</div>';
 painel.scrollIntoView({behavior:'smooth',block:'nearest'});
 try{
  const r=await fetch(`/api/observatorio-politico?modo=eleicoes2026-detalhe&nome=${encodeURIComponent(nome)}`);
  const d=await r.json();
  if(!r.ok)throw new Error(d.erro||'Falha');
  const c=d.candidato||{};
  const propostas=d.propostas||[];
  const certidoes=d.certidoes||[];
  const docs=(d.documentos||[]).filter(x=>x.tipo!=='proposta'&&x.tipo!=='certidao');
  painel.innerHTML=`<section class="eleicao-detalhe-card"><header><div><span class="rotulo">DOCUMENTAÇÃO ELEITORAL · TSE</span><h3>${escapar(c.nome)}</h3><p>${escapar(c.partido)} · Vice: ${escapar(c.vice||'Não informado')}</p></div><button data-fechar-eleicao aria-label="Fechar">×</button></header><div class="eleicao-doc-blocos"><div><h4>Plano / proposta de governo</h4>${propostas.length?propostas.map(x=>arquivo(x.nome||'Plano de governo',x.url,'Arquivo individual identificado na ficha oficial do TSE.')).join(''):`<div class="eleicao-sem-individual"><b>PDF individual não identificado automaticamente.</b><p>O documento continua disponível no pacote oficial nacional do TSE e na ficha da candidatura no DivulgaCandContas.</p>${arquivo('Pacote oficial · propostas de governo 2026',d.pacotes.propostas,'Contém os PDFs oficiais das candidaturas à Presidência.')}</div>`}</div><div><h4>Certidões criminais apresentadas ao TSE</h4>${certidoes.length?certidoes.map(x=>arquivo(x.nome||'Certidão criminal',x.url,'Documento público identificado na ficha oficial.')).join(''):`<div class="eleicao-sem-individual"><b>Certidões individuais não identificadas automaticamente.</b><p>Use o pacote oficial do TSE, que reúne os PDFs disponibilizados para Presidência.</p>${arquivo('Pacote oficial · certidões criminais 2026',d.pacotes.certidoes,'Documentos protocolados no registro eleitoral.')}</div>`}</div>${docs.length?`<div><h4>Outros documentos públicos</h4>${docs.map(x=>arquivo(x.nome||'Documento',x.url,'Documento exposto pela ficha oficial.')).join('')}</div>`:''}</div><div class="eleicao-fonte-acoes">${d.fichaApi?`<a href="${escapar(d.fichaApi)}" target="_blank" rel="noopener noreferrer">Dados oficiais da candidatura ↗</a>`:''}<a href="${escapar(d.divulga)}" target="_blank" rel="noopener noreferrer">Abrir DivulgaCandContas ↗</a></div><p class="eleicao-nota">${escapar(d.aviso||'')}</p></section>`;
  painel.querySelector('[data-fechar-eleicao]')?.addEventListener('click',()=>{painel.innerHTML=''});
 }catch{
  painel.innerHTML='<div class="obs-vazio">A ficha individual do TSE não respondeu nesta tentativa. Os pacotes nacionais oficiais continuam disponíveis acima.</div>';
 }
}

async function renderizar(){
 const area=$('#observatorio-conteudo');
 if(!area)return;
 area.innerHTML='<div class="eleicao-carregando">Consultando as candidaturas presidenciais registradas no TSE…</div>';
 try{
  const d=await dados();
  const candidatos=d.dados||[];
  const extras=d.outrosRegistros||[];
  area.innerHTML=`<div class="eleicoes-2026"><header class="eleicao-abertura"><span class="rotulo">ELEIÇÕES GERAIS · 2026 · PRESIDÊNCIA DA REPÚBLICA</span><h3>Candidaturas e documentos <em>oficiais.</em></h3><p>Lista documental em ordem alfabética. Sem notas, rankings ou recomendação de voto. Os planos abaixo são os documentos protocolados pelas candidaturas perante a Justiça Eleitoral.</p><div class="eleicao-resumo"><div><strong>${candidatos.length}</strong><span>chapas validadas na lista consolidada</span></div><div><strong>04/10</strong><span>1º turno de 2026</span></div><div><strong>TSE</strong><span>fonte primária</span></div></div></header><section class="eleicao-pacotes"><h4>Baixar a documentação oficial completa</h4><div class="eleicao-pacotes-grid">${arquivo('Todos os planos de governo · Presidência',d.pacotes.propostas,'Pacote oficial do TSE com as propostas de governo em PDF.')}${arquivo('Todas as certidões criminais · Presidência',d.pacotes.certidoes,'Pacote oficial do TSE com certidões disponibilizadas no registro.')}${arquivo('Base completa de candidaturas 2026',d.pacotes.candidatos,'Dados cadastrais oficiais em CSV compactado.')}</div></section><section class="eleicao-lista"><div class="eleicao-lista-cabecalho"><div><span class="rotulo">CHAPAS PRESIDENCIAIS</span><h4>Registro validado pelo TSE</h4></div><a href="${escapar(d.divulga)}" target="_blank" rel="noopener noreferrer">Conferir no DivulgaCandContas ↗</a></div><div class="eleicao-grade">${candidatos.map(cartao).join('')}</div></section>${extras.length?`<section class="eleicao-atualizacoes"><span class="rotulo">REGISTROS ADICIONAIS RETORNADOS PELO TSE</span><h4>Situações em atualização</h4><p>Estes registros não são misturados à lista principal enquanto a situação oficial não estiver consolidada.</p>${extras.map(x=>`<article><strong>${escapar(x.nome||'Registro')}</strong><span>${escapar(x.partido||'')}</span><b>${escapar(x.situacao||'Situação não informada')}</b></article>`).join('')}</section>`:''}<section id="eleicao-detalhe"></section><footer class="eleicao-rodape"><p>${escapar(d.nota||'')}</p><p>Fonte oficial: Tribunal Superior Eleitoral · DivulgaCandContas · Portal de Dados Abertos.</p></footer></div>`;
  area.querySelectorAll('[data-candidato-eleicao]').forEach(b=>b.addEventListener('click',()=>abrirDetalhe(b.dataset.candidatoEleicao)));
 }catch{
  area.innerHTML='<div class="obs-vazio">O TSE não respondeu nesta tentativa. Tente novamente ou abra o DivulgaCandContas pela área de fontes.</div>';
 }
}

function instalar(){
 const dialogo=$('#observatorio-politico');
 const abas=dialogo?.querySelector('.observatorio-abas');
 if(!abas||abas.querySelector('[data-obs-aba="eleicoes2026"]'))return Boolean(abas);
 const botao=document.createElement('button');
 botao.dataset.obsAba='eleicoes2026';
 botao.textContent='Eleições 2026';
 const ref=abas.querySelector('[data-obs-aba="parlamentares"]');
 ref?.before(botao);
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
window.BibliotecaEleicoes2026={abrir:renderizar};
