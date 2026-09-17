const estilo=document.createElement('link');
estilo.rel='stylesheet';
estilo.href='/css/eleicoes-2026.css?v=20260917e3';
document.head.append(estilo);

const $=(s,r=document)=>r.querySelector(s);
const escapar=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalizar=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
let cache=null,indiceCache=null;

const FONTES_JURIDICAS={
 constituicao:'https://www4.planalto.gov.br/legislacao/legis-federal/constituicao',
 terrorismo:'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2016/lei/l13260.htm',
 organizacoes:'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/lei/l12850.htm',
 forca:'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l13060.htm',
 forcaDecreto:'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/decreto/d12341.htm',
 lrf:'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp101.htm',
 stf60:'https://portal.stf.jus.br/constituicao-supremo/artigo.asp?abrirArtigo=60&abrirBase=CF',
 stfControle:'https://portal.stf.jus.br/publicacaotematica/vertema.asp?lei=5235'
};

const REGRAS_JURIDICAS=[
 {id:'maioridade',re:/maioridade penal|crime do menor nao e menor|reduzir.{0,80}maioridade|menor.{0,80}responder como adulto/,rotulo:'EXIGE ALTERAÇÃO CONSTITUCIONAL',base:'Constituição, art. 228',texto:'A Constituição fixa a inimputabilidade penal dos menores de 18 anos. Alterar esse marco não pode ser feito por decreto ou lei ordinária; exige mudança constitucional.',url:FONTES_JURIDICAS.constituicao},
 {id:'sindical',re:/unicidade sindical|fim da unicidade sindical|acabar com a unicidade sindical/,rotulo:'EXIGE ALTERAÇÃO CONSTITUCIONAL',base:'Constituição, art. 8º, II',texto:'A unicidade sindical está prevista expressamente na Constituição. Mudar essa regra exige PEC.',url:FONTES_JURIDICAS.constituicao},
 {id:'stf',re:/stf como corte constitucional|reforma do judiciario.{0,100}stf|mandato.{0,80}(ministro|stf)|reduzir.{0,80}ministros.{0,50}stf|supremo tribunal federal.{0,100}(composicao|competencia|mandato)/,rotulo:'PODE EXIGIR PEC',base:'Constituição, arts. 101 e 102',texto:'Composição e competências constitucionais do STF estão definidas na Constituição. Se a proposta alterar esses elementos, a via é emenda constitucional.',url:FONTES_JURIDICAS.constituicao},
 {id:'narcoterror',re:/narcoterror|pcc.{0,100}terrorist|comando vermelho.{0,100}terrorist|facco.{0,100}terrorist|faccoes.{0,100}terrorist/,rotulo:'DEPENDE DE ALTERAÇÃO LEGAL',base:'Lei 13.260/2016 e Lei 12.850/2013',texto:'O conceito de terrorismo e de organização terrorista é definido em lei. Uma nova classificação geral de facções precisa respeitar essa definição ou ser aprovada pelo Congresso.',url:FONTES_JURIDICAS.terrorismo},
 {id:'castracao',re:/castracao quimica/,rotulo:'EXIGE LEI E CONTROLE CONSTITUCIONAL',base:'Constituição, art. 5º, III, XXXIX e XLIX',texto:'Uma sanção penal dessa natureza dependeria de lei federal e teria de ser examinada à luz da legalidade penal, integridade física e vedação a tratamento desumano ou degradante.',url:FONTES_JURIDICAS.constituicao},
 {id:'forca-letal',re:/bandido.{0,90}abatido|traficante.{0,90}virar po|virar po.{0,90}traficante|abatido pelas forcas de seguranca/,rotulo:'EXECUÇÃO LIMITADA PELA LEI',base:'Lei 13.060/2014 e Decreto 12.341/2024',texto:'O uso da força não pode ser automático. A legislação vigente exige legalidade, necessidade, razoabilidade e proporcionalidade e restringe o emprego de arma de fogo.',url:FONTES_JURIDICAS.forca},
 {id:'penas-proibidas',re:/pena de morte|prisao perpetua|pena.{0,50}carater perpetuo/,rotulo:'LIMITE CONSTITUCIONAL EXPRESSO',base:'Constituição, art. 5º, XLVII; art. 60, §4º, IV',texto:'O texto constitucional vigente proíbe penas de caráter perpétuo e, salvo guerra declarada, pena de morte. Direitos e garantias individuais também integram o núcleo protegido do art. 60, §4º.',url:FONTES_JURIDICAS.stf60},
 {id:'propriedade',re:/expropriacao.{0,100}sem indeniz|estatizacao.{0,100}sem indeniz|confiscar.{0,100}(empresa|terra|propriedade)|tomada do controle.{0,100}empresa/,rotulo:'EXIGE DESENHO JURÍDICO ESPECÍFICO',base:'Constituição, art. 5º, XXII e XXIV; arts. 184 e 243',texto:'A Constituição protege a propriedade e disciplina desapropriação e hipóteses excepcionais de expropriação. Medidas sem indenização só cabem nas exceções constitucionais expressas.',url:FONTES_JURIDICAS.constituicao},
 {id:'imposto-unico',re:/imposto unico|substituir.{0,100}(tributos|impostos)|extincao.{0,80}(tributos|impostos)/,rotulo:'REFORMA TRIBUTÁRIA ESTRUTURAL',base:'Constituição, Título VI',texto:'Substituir tributos e competências tributárias definidas constitucionalmente pode exigir PEC, além das leis de regulamentação.',url:FONTES_JURIDICAS.constituicao},
 {id:'policias',re:/fim da policia militar|extincao.{0,80}policia militar|desmilitarizacao.{0,80}policia/,rotulo:'EXIGE ALTERAÇÃO CONSTITUCIONAL',base:'Constituição, art. 144',texto:'A estrutura dos órgãos de segurança pública está prevista na Constituição. Alterações estruturais dessa arquitetura exigem PEC.',url:FONTES_JURIDICAS.constituicao},
 {id:'distrital',re:/voto distrital puro|sistema distrital puro/,rotulo:'EXIGE ANÁLISE CONSTITUCIONAL',base:'Constituição, art. 45',texto:'A Câmara dos Deputados é eleita pelo sistema proporcional previsto na Constituição. Um sistema distrital puro para a Câmara exigiria mudança constitucional.',url:FONTES_JURIDICAS.constituicao},
 {id:'reeleicao',re:/fim da reeleicao|proibir.{0,50}reeleicao/,rotulo:'EXIGE ALTERAÇÃO CONSTITUCIONAL',base:'Constituição, art. 14, §5º',texto:'A possibilidade de reeleição está disciplinada constitucionalmente. Sua retirada exige PEC.',url:FONTES_JURIDICAS.constituicao},
 {id:'reforma-previdencia',re:/revogar.{0,100}reforma da previdencia|cancelar.{0,100}reforma da previdencia/,rotulo:'EXIGE ALTERAÇÃO CONSTITUCIONAL',base:'Constituição e EC 103/2019',texto:'A reforma previdenciária alterou dispositivos constitucionais. Revogar os pontos inseridos na Constituição exige nova emenda constitucional.',url:FONTES_JURIDICAS.constituicao},
 {id:'dividas-privadas',re:/anulacao de todas as dividas|cancelamento de todas as dividas.{0,100}(trabalhador|familia|sistema financeiro)/,rotulo:'DEPENDE DE LEI E SALVAGUARDAS CONSTITUCIONAIS',base:'Constituição, art. 5º, XXII e XXXVI',texto:'Uma anulação geral de obrigações privadas dependeria de lei e teria de respeitar propriedade, segurança jurídica e atos jurídicos perfeitos.',url:FONTES_JURIDICAS.constituicao},
 {id:'demissoes',re:/proibicao das demissoes|proibir demissoes/,rotulo:'DEPENDE DE LEGISLAÇÃO',base:'Constituição, art. 7º, I; art. 170',texto:'A Constituição protege a relação de emprego contra despedida arbitrária nos termos de legislação complementar e também protege a livre iniciativa. Uma proibição geral exigiria desenho legislativo compatível com esses dispositivos.',url:FONTES_JURIDICAS.constituicao},
 {id:'renuncia-fiscal',re:/isencao.{0,80}(imposto|tribut)|reduzir.{0,60}(imposto|tribut)|reducao.{0,60}(imposto|tribut)|desoneracao tributaria/,rotulo:'EXIGE IMPACTO FISCAL',base:'Lei de Responsabilidade Fiscal, art. 14',texto:'Benefício ou redução tributária com renúncia de receita deve observar estimativa de impacto e as condições da Lei de Responsabilidade Fiscal.',url:FONTES_JURIDICAS.lrf}
];

async function dados(){
 if(cache)return cache;
 const r=await fetch('/api/observatorio-politico?modo=eleicoes2026');
 const d=await r.json();
 if(!r.ok)throw new Error(d.erro||'Falha na consulta');
 cache=d;
 return d;
}
async function indicePlanos(){
 if(indiceCache)return indiceCache;
 const r=await fetch('/dados/planos-governo-2026/index.json?v=20260917j1',{cache:'no-store'});
 if(!r.ok)throw new Error('Índice dos planos indisponível');
 indiceCache=await r.json();
 return indiceCache;
}

function arquivo(nome,url,descricao,{tipo='oficial',download=false}={}){
 const atributos=download?' download':' target="_blank" rel="noopener noreferrer"';
 return `<a class="eleicao-arquivo" href="${escapar(url)}"${atributos}><span>${escapar(tipo)}</span><strong>${escapar(nome)}</strong><small>${escapar(descricao)}</small><b>${download?'Baixar ↓':'Abrir ↗'}</b></a>`
}
function cartao(c){return `<article class="eleicao-candidato"><div class="eleicao-candidato-topo"><div><span class="rotulo">${escapar(c.partido||'PARTIDO NÃO INFORMADO')}</span><h4>${escapar(c.nome)}</h4><p>Vice: ${escapar(c.vice||'Não informado')}</p></div>${c.numero?`<strong class="eleicao-numero">${escapar(c.numero)}</strong>`:''}</div><div class="eleicao-situacao"><span>REGISTRO</span><b>${escapar(c.situacao||'Validado pelo TSE')}</b></div><div class="eleicao-acoes"><button data-candidato-eleicao="${escapar(c.nome)}">Documentos oficiais</button><button data-analise-juridica="${escapar(c.nome)}">Análise jurídica do plano</button></div></article>`}

function analisarTexto(texto){
 const linhas=String(texto||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 const achados=[];
 const vistos=new Set();
 for(let i=0;i<linhas.length;i++){
  const original=[linhas[i],linhas[i+1]||'',linhas[i+2]||''].join(' ').replace(/\s+/g,' ').trim();
  const alvo=normalizar(original);
  for(const regra of REGRAS_JURIDICAS){
   if(!regra.re.test(alvo))continue;
   regra.re.lastIndex=0;
   const chave=regra.id+'|'+alvo.slice(0,160);
   if(vistos.has(chave))continue;
   vistos.add(chave);
   achados.push({...regra,trecho:original.slice(0,520)});
  }
 }
 return achados;
}

async function abrirAnalise(nome){
 const painel=$('#eleicao-detalhe');
 if(!painel)return;
 painel.innerHTML='<div class="eleicao-carregando">Lendo o plano oficial completo e cruzando os trechos com a legislação…</div>';
 painel.scrollIntoView({behavior:'smooth',block:'nearest'});
 try{
  const indice=await indicePlanos();
  const doc=(indice.documentos||[]).find(x=>x.candidato===nome);
  if(!doc)throw new Error('Plano não localizado');
  const r=await fetch(doc.texto+'?v='+encodeURIComponent(indice.geradoEm||''),{cache:'no-store'});
  if(!r.ok)throw new Error('Texto indisponível');
  const texto=await r.text();
  const achados=analisarTexto(texto);
  painel.innerHTML=`<section class="eleicao-detalhe-card analise-juridica"><header><div><span class="rotulo">ANÁLISE DOCUMENTAL · PLANO OFICIAL DO TSE</span><h3>${escapar(nome)}</h3><p>Leitura jurídica do texto protocolado, sem ranking e sem juízo eleitoral.</p></div><button data-fechar-eleicao aria-label="Fechar">×</button></header><div class="analise-metodo"><b>Como interpretar</b><p>“Exige PEC” ou “depende de lei” descreve o caminho jurídico necessário. A Biblioteca não declara uma proposta inconstitucional antes de existir norma e decisão competente. O STF registra que o sistema brasileiro, em regra, não faz controle abstrato preventivo da constitucionalidade material de meros projetos de lei.</p><a href="${FONTES_JURIDICAS.stfControle}" target="_blank" rel="noopener noreferrer">Entendimento do STF sobre controle preventivo ↗</a></div>${achados.length?`<div class="analise-lista">${achados.map(a=>`<article class="analise-item"><span>${escapar(a.rotulo)}</span><blockquote>${escapar(a.trecho)}</blockquote><div><b>${escapar(a.base)}</b><p>${escapar(a.texto)}</p><a href="${a.url}" target="_blank" rel="noopener noreferrer">Conferir fonte oficial ↗</a></div></article>`).join('')}</div>`:`<div class="analise-sem-alerta"><b>Nenhum dos gatilhos jurídicos estruturais cadastrados foi localizado automaticamente neste plano.</b><p>Isso não significa “plano constitucional” nem dispensa análise jurídica de medidas futuras. Significa apenas que esta varredura não encontrou, no texto, as situações específicas cobertas pelas regras documentais atuais.</p></div>`}<footer class="analise-fontes"><a href="${escapar(indice.pdfUnico)}" target="_blank" rel="noopener noreferrer">PDF único com os 12 planos ↗</a><a href="${FONTES_JURIDICAS.constituicao}" target="_blank" rel="noopener noreferrer">Constituição Federal ↗</a><a href="${FONTES_JURIDICAS.stf60}" target="_blank" rel="noopener noreferrer">Constituição e o Supremo ↗</a></footer></section>`;
  painel.querySelector('[data-fechar-eleicao]')?.addEventListener('click',()=>{painel.innerHTML=''});
 }catch{
  painel.innerHTML='<div class="obs-vazio">Não foi possível concluir a leitura jurídica automática deste plano nesta tentativa.</div>';
 }
}

async function abrirDetalhe(nome){
 const painel=$('#eleicao-detalhe');
 if(!painel)return;
 painel.innerHTML='<div class="eleicao-carregando">Consultando a ficha oficial e os documentos protocolados no TSE…</div>';
 painel.scrollIntoView({behavior:'smooth',block:'nearest'});
 try{
  const [r,indice]=await Promise.all([fetch(`/api/observatorio-politico?modo=eleicoes2026-detalhe&nome=${encodeURIComponent(nome)}`),indicePlanos()]);
  const d=await r.json();
  if(!r.ok)throw new Error(d.erro||'Falha');
  const c=d.candidato||{};
  const propostas=d.propostas||[];
  const certidoes=d.certidoes||[];
  const docs=(d.documentos||[]).filter(x=>x.tipo!=='proposta'&&x.tipo!=='certidao');
  painel.innerHTML=`<section class="eleicao-detalhe-card"><header><div><span class="rotulo">DOCUMENTAÇÃO ELEITORAL · TSE</span><h3>${escapar(c.nome)}</h3><p>${escapar(c.partido)} · Vice: ${escapar(c.vice||'Não informado')}</p></div><button data-fechar-eleicao aria-label="Fechar">×</button></header><div class="eleicao-doc-blocos"><div><h4>Plano / proposta de governo</h4>${propostas.length?propostas.map(x=>arquivo(x.nome||'Plano de governo',x.url,'Arquivo individual identificado na ficha oficial do TSE.')).join(''):arquivo('PDF único · 12 planos presidenciais',indice.pdfUnico,'Documento consolidado automaticamente a partir dos PDFs oficiais do TSE.',{tipo:'PDF ÚNICO',download:true})}</div><div><h4>Certidões criminais apresentadas ao TSE</h4>${certidoes.length?certidoes.map(x=>arquivo(x.nome||'Certidão criminal',x.url,'Documento público identificado na ficha oficial.')).join(''):`<div class="eleicao-sem-individual"><b>Certidões individuais não identificadas automaticamente.</b><p>Use a ficha oficial do DivulgaCandContas para consultar os documentos públicos apresentados.</p></div>`}</div>${docs.length?`<div><h4>Outros documentos públicos</h4>${docs.map(x=>arquivo(x.nome||'Documento',x.url,'Documento exposto pela ficha oficial.')).join('')}</div>`:''}</div><div class="eleicao-fonte-acoes"><button data-analise-detalhe>Análise jurídica do plano</button>${d.fichaApi?`<a href="${escapar(d.fichaApi)}" target="_blank" rel="noopener noreferrer">Dados oficiais da candidatura ↗</a>`:''}<a href="${escapar(d.divulga)}" target="_blank" rel="noopener noreferrer">Abrir DivulgaCandContas ↗</a></div><p class="eleicao-nota">${escapar(d.aviso||'')}</p></section>`;
  painel.querySelector('[data-fechar-eleicao]')?.addEventListener('click',()=>{painel.innerHTML=''});
  painel.querySelector('[data-analise-detalhe]')?.addEventListener('click',()=>abrirAnalise(nome));
 }catch{
  painel.innerHTML='<div class="obs-vazio">A ficha individual do TSE não respondeu nesta tentativa.</div>';
 }
}

async function renderizar(){
 const area=$('#observatorio-conteudo');
 if(!area)return;
 area.innerHTML='<div class="eleicao-carregando">Consultando as candidaturas presidenciais registradas no TSE…</div>';
 try{
  const [d,indice]=await Promise.all([dados(),indicePlanos()]);
  const candidatos=d.dados||[];
  const extras=d.outrosRegistros||[];
  area.innerHTML=`<div class="eleicoes-2026"><header class="eleicao-abertura"><span class="rotulo">ELEIÇÕES GERAIS · 2026 · PRESIDÊNCIA DA REPÚBLICA</span><h3>Candidaturas e documentos <em>oficiais.</em></h3><p>Lista documental em ordem alfabética. Sem notas, rankings ou recomendação de voto. Os planos são os documentos protocolados perante a Justiça Eleitoral.</p><div class="eleicao-resumo"><div><strong>${candidatos.length}</strong><span>chapas na lista consolidada</span></div><div><strong>04/10</strong><span>1º turno de 2026</span></div><div><strong>TSE</strong><span>fonte primária</span></div></div></header><section class="eleicao-pacotes pdf-unico"><h4>Todos os planos em um único arquivo</h4><div class="eleicao-pacotes-grid">${arquivo('Planos de governo · Presidência · 2026',indice.pdfUnico,'PDF único montado a partir dos 12 PDFs oficiais do TSE. Atualizado automaticamente quando a base oficial mudar.',{tipo:'PDF ÚNICO · TSE',download:true})}</div><small>Gerado em ${escapar(new Date(indice.geradoEm).toLocaleString('pt-BR'))}. O arquivo não inclui registros adicionais fora da lista consolidada.</small></section><section class="eleicao-lista"><div class="eleicao-lista-cabecalho"><div><span class="rotulo">CHAPAS PRESIDENCIAIS</span><h4>Documentos e análise jurídica</h4></div><a href="${escapar(d.divulga)}" target="_blank" rel="noopener noreferrer">Conferir no DivulgaCandContas ↗</a></div><div class="eleicao-grade">${candidatos.map(cartao).join('')}</div></section>${extras.length?`<section class="eleicao-atualizacoes"><span class="rotulo">REGISTROS ADICIONAIS RETORNADOS PELO TSE</span><h4>Situações em atualização</h4><p>Estes registros não são misturados à lista principal enquanto a situação oficial não estiver consolidada.</p>${extras.map(x=>`<article><strong>${escapar(x.nome||'Registro')}</strong><span>${escapar(x.partido||'')}</span><b>${escapar(x.situacao||'Situação não informada')}</b></article>`).join('')}</section>`:''}<section id="eleicao-detalhe"></section><footer class="eleicao-rodape"><p>${escapar(d.nota||'')}</p><p>Fontes: Tribunal Superior Eleitoral, Constituição Federal, legislação federal e Supremo Tribunal Federal.</p></footer></div>`;
  area.querySelectorAll('[data-candidato-eleicao]').forEach(b=>b.addEventListener('click',()=>abrirDetalhe(b.dataset.candidatoEleicao)));
  area.querySelectorAll('[data-analise-juridica]').forEach(b=>b.addEventListener('click',()=>abrirAnalise(b.dataset.analiseJuridica)));
 }catch{
  area.innerHTML='<div class="obs-vazio">As fontes oficiais não responderam nesta tentativa.</div>';
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
window.BibliotecaEleicoes2026={abrir:renderizar,analisar:abrirAnalise};
