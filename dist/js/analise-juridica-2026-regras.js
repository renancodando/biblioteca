const normalizar=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const escapar=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const constituicao='https://www4.planalto.gov.br/legislacao/legis-federal/constituicao';
const stf60='https://portal.stf.jus.br/constituicao-supremo/artigo.asp?abrirArtigo=60&abrirBase=CF';
const terrorismo='https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2016/lei/l13260.htm';
const forca='https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l13060.htm';
const lrf='https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp101.htm';
const regras=[
 {id:'maioridade',re:/maioridade penal|crime do menor nao e menor|reduzir.{0,80}maioridade|menor.{0,80}responder como adulto/,rotulo:'EXIGE ALTERAÇÃO CONSTITUCIONAL',base:'Constituição, art. 228',texto:'A Constituição fixa a inimputabilidade penal dos menores de 18 anos. Alterar esse marco exige mudança constitucional.',url:constituicao},
 {id:'sindical',re:/unicidade sindical|fim da unicidade sindical|acabar com a unicidade sindical/,rotulo:'EXIGE ALTERAÇÃO CONSTITUCIONAL',base:'Constituição, art. 8º, II',texto:'A unicidade sindical está prevista expressamente na Constituição. Mudar essa regra exige PEC.',url:constituicao},
 {id:'stf',re:/stf como corte constitucional|reforma do judiciario.{0,100}stf|mandato.{0,80}(ministro|stf)|reduzir.{0,80}ministros.{0,50}stf|supremo tribunal federal.{0,100}(composicao|competencia|mandato)/,rotulo:'PODE EXIGIR PEC',base:'Constituição, arts. 101 e 102',texto:'Composição e competências constitucionais do STF estão definidas na Constituição. Alterá-las exige emenda constitucional.',url:constituicao},
 {id:'narcoterror',re:/narcoterror|pcc.{0,100}terrorist|comando vermelho.{0,100}terrorist|facco.{0,100}terrorist|faccoes.{0,100}terrorist/,rotulo:'DEPENDE DE ALTERAÇÃO LEGAL',base:'Lei 13.260/2016 e Lei 12.850/2013',texto:'A definição de terrorismo é legal. Uma nova classificação geral de facções precisa respeitar a lei vigente ou ser aprovada pelo Congresso.',url:terrorismo},
 {id:'castracao',re:/castracao quimica/,rotulo:'EXIGE LEI E CONTROLE CONSTITUCIONAL',base:'Constituição, art. 5º, III, XXXIX e XLIX',texto:'Uma sanção penal dessa natureza dependeria de lei federal e de compatibilidade com legalidade penal, integridade física e direitos fundamentais.',url:constituicao},
 {id:'forca-letal',re:/bandido.{0,90}abatido|traficante.{0,90}virar po|virar po.{0,90}traficante|abatido pelas forcas de seguranca/,rotulo:'EXECUÇÃO LIMITADA PELA LEI',base:'Lei 13.060/2014 e Decreto 12.341/2024',texto:'O uso da força não pode ser automático. A legislação exige legalidade, necessidade, razoabilidade e proporcionalidade.',url:forca},
 {id:'penas-proibidas',re:/pena de morte|prisao perpetua|pena.{0,50}carater perpetuo/,rotulo:'LIMITE CONSTITUCIONAL EXPRESSO',base:'Constituição, art. 5º, XLVII; art. 60, §4º, IV',texto:'A Constituição proíbe penas de caráter perpétuo e, salvo guerra declarada, pena de morte. Direitos e garantias individuais integram o núcleo protegido do art. 60, §4º.',url:stf60},
 {id:'propriedade',re:/expropriacao.{0,100}sem indeniz|estatizacao.{0,100}sem indeniz|confiscar.{0,100}(empresa|terra|propriedade)|tomada do controle.{0,100}empresa/,rotulo:'EXIGE DESENHO JURÍDICO ESPECÍFICO',base:'Constituição, art. 5º, XXII e XXIV; arts. 184 e 243',texto:'A Constituição protege a propriedade e disciplina desapropriação e hipóteses excepcionais de expropriação.',url:constituicao},
 {id:'imposto-unico',re:/imposto unico|substituir.{0,100}(tributos|impostos)|extincao.{0,80}(tributos|impostos)/,rotulo:'REFORMA TRIBUTÁRIA ESTRUTURAL',base:'Constituição, Título VI',texto:'Substituir tributos e competências tributárias definidas constitucionalmente pode exigir PEC e leis de regulamentação.',url:constituicao},
 {id:'policias',re:/fim da policia militar|extincao.{0,80}policia militar|desmilitarizacao.{0,80}policia/,rotulo:'EXIGE ALTERAÇÃO CONSTITUCIONAL',base:'Constituição, art. 144',texto:'A estrutura dos órgãos de segurança pública está prevista na Constituição. Alterações estruturais exigem PEC.',url:constituicao},
 {id:'distrital',re:/voto distrital puro|sistema distrital puro/,rotulo:'EXIGE ANÁLISE CONSTITUCIONAL',base:'Constituição, art. 45',texto:'A Câmara dos Deputados é eleita pelo sistema proporcional previsto na Constituição. Um sistema distrital puro para a Câmara exige mudança constitucional.',url:constituicao},
 {id:'reeleicao',re:/fim da reeleicao|proibir.{0,50}reeleicao/,rotulo:'EXIGE ALTERAÇÃO CONSTITUCIONAL',base:'Constituição, art. 14, §5º',texto:'A possibilidade de reeleição está disciplinada constitucionalmente. Sua retirada exige PEC.',url:constituicao},
 {id:'reforma-previdencia',re:/revogar.{0,100}reforma da previdencia|cancelar.{0,100}reforma da previdencia/,rotulo:'EXIGE ALTERAÇÃO CONSTITUCIONAL',base:'Constituição e EC 103/2019',texto:'Revogar pontos previdenciários inseridos na Constituição exige nova emenda constitucional.',url:constituicao},
 {id:'dividas-privadas',re:/anulacao de todas as dividas|cancelamento de todas as dividas.{0,100}(trabalhador|familia|sistema financeiro)/,rotulo:'DEPENDE DE LEI E SALVAGUARDAS CONSTITUCIONAIS',base:'Constituição, art. 5º, XXII e XXXVI',texto:'Uma anulação geral de obrigações privadas dependeria de lei e teria de respeitar propriedade, segurança jurídica e atos jurídicos perfeitos.',url:constituicao},
 {id:'demissoes',re:/proibicao das demissoes|proibir demissoes/,rotulo:'DEPENDE DE LEGISLAÇÃO',base:'Constituição, art. 7º, I; art. 170',texto:'Uma proibição geral de demissões exige desenho legislativo compatível com proteção do emprego e livre iniciativa.',url:constituicao},
 {id:'renuncia-fiscal',re:/isencao.{0,80}(imposto|tribut)|reduzir.{0,60}(imposto|tribut)|reducao.{0,60}(imposto|tribut)|desoneracao tributaria/,rotulo:'EXIGE IMPACTO FISCAL',base:'Lei de Responsabilidade Fiscal, art. 14',texto:'Benefício ou redução tributária com renúncia de receita deve observar estimativa de impacto e as condições da LRF.',url:lrf},
 {id:'constituinte',re:/assembleia constituinte|constituinte de novo tipo|nova constituicao/,rotulo:'ALTERAÇÃO DA ORDEM CONSTITUCIONAL',base:'Constituição, art. 60 e estrutura constitucional vigente',texto:'Uma nova Constituinte ou modelo constituinte fora do processo de emenda não é medida executável por ato presidencial ou lei ordinária.',url:stf60},
 {id:'senado',re:/senado sera extinto|extincao do senado|parlamento unicameral/,rotulo:'EXIGE REESTRUTURAÇÃO CONSTITUCIONAL',base:'Constituição, arts. 44 a 46; art. 60',texto:'O Congresso Nacional é bicameral e o Senado representa os Estados e o Distrito Federal. Sua extinção ou substituição exige alteração constitucional e exame dos limites constitucionais.',url:constituicao},
 {id:'recall',re:/mandatos poderao ser revogados|mandato revogavel|mandatos revogaveis|revogacao de mandato.{0,80}referendo/,rotulo:'EXIGE ALTERAÇÃO CONSTITUCIONAL',base:'Constituição, regras sobre mandatos eletivos',texto:'Criar revogação popular geral de mandatos altera o regime constitucional de duração e perda dos cargos e exige mudança constitucional.',url:constituicao},
 {id:'fim-stf',re:/fim do supremo tribunal federal|fim do stf|extincao do supremo tribunal federal/,rotulo:'REESTRUTURAÇÃO CONSTITUCIONAL PROFUNDA',base:'Constituição, arts. 92, 101 e 102; art. 60, §4º, III',texto:'O STF integra a estrutura constitucional do Judiciário e exerce a guarda da Constituição. Sua extinção envolve também os limites da separação dos Poderes.',url:stf60},
 {id:'juizes-eleitos',re:/eleicao de todos os juizes|juizes.{0,80}voto popular|tribunais.{0,100}mandatos por tempo definido|mandatos por tempo definido.{0,80}tribunais/,rotulo:'EXIGE ALTERAÇÃO CONSTITUCIONAL',base:'Constituição, arts. 92 a 126',texto:'Forma de ingresso, garantias e organização da magistratura são disciplinadas constitucionalmente. Eleição popular de juízes ou mandatos nos tribunais exige alteração da Constituição.',url:constituicao},
 {id:'policia-dissolucao',re:/dissolucao da policia militar|dissolucao.{0,80}policia|desmilitarizacao da seguranca publica|unificacao das policias/,rotulo:'EXIGE ALTERAÇÃO CONSTITUCIONAL',base:'Constituição, art. 144',texto:'Dissolução, unificação ou mudança estrutural do modelo de polícias previsto na Constituição exige alteração constitucional.',url:constituicao},
 {id:'desapropriacao-sem-indenizacao',re:/desapropriad.{0,100}sem indeniz|desapropriacao.{0,100}sem indeniz/,rotulo:'LIMITES CONSTITUCIONAIS À EXPROPRIAÇÃO',base:'Constituição, art. 5º, XXIV; arts. 184 e 243',texto:'A Constituição prevê indenização como regra para desapropriação e estabelece exceções específicas de expropriação.',url:constituicao},
 {id:'orcamento-deliberativo',re:/orcamento popular 100.? deliberativo|trabalhadores decidirao onde o governo aplicara os recursos/,rotulo:'EXIGE ADEQUAÇÃO AO PROCESSO ORÇAMENTÁRIO',base:'Constituição, arts. 165 e 166',texto:'PPA, LDO e orçamento anual seguem processo constitucional entre Executivo e Legislativo. Participação popular pode existir, mas substituir integralmente esse processo exige mudança constitucional.',url:constituicao},
 {id:'competencia-stf',re:/restringir as competencias do stf|retirando da corte materias tributarias e penais|reduzir as materias que podem ser levadas ao stf|aumentar os requisitos para indicacao de ministros do stf/,rotulo:'EXIGE ALTERAÇÃO CONSTITUCIONAL',base:'Constituição, arts. 101 e 102',texto:'Requisitos para ministros e competências do STF estão definidos na Constituição. Alterá-los exige PEC.',url:constituicao},
 {id:'concessao-imprensa',re:/cancelamento da concessao.{0,120}(rede globo|meios de comunicacao)|estatizacao das empresas.{0,100}comunicacao/,rotulo:'EXIGE PROCESSO LEGAL E RESPEITO À LIBERDADE DE COMUNICAÇÃO',base:'Constituição, arts. 5º, IX; 220 a 223',texto:'Radiodifusão envolve regime constitucional de concessões e proteção à liberdade de comunicação. Cancelamentos dependem do procedimento jurídico cabível e não podem funcionar como censura.',url:constituicao}
];

function analisar(texto){
 const linhas=String(texto||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean),out=[],vistos=new Set();
 for(let i=0;i<linhas.length;i++){
  const trecho=[linhas[i],linhas[i+1]||'',linhas[i+2]||''].join(' ').replace(/\s+/g,' ').trim();
  const alvo=normalizar(trecho);
  for(const regra of regras){
   regra.re.lastIndex=0;
   if(!regra.re.test(alvo))continue;
   const chave=regra.id+'|'+alvo.slice(0,160);
   if(vistos.has(chave))continue;
   vistos.add(chave);
   out.push({...regra,trecho:trecho.slice(0,520)});
  }
 }
 return out;
}

function html(a){return `<article class="analise-item analise-extra"><span>${escapar(a.rotulo)}</span><blockquote>${escapar(a.trecho)}</blockquote><div><b>${escapar(a.base)}</b><p>${escapar(a.texto)}</p><a href="${a.url}" target="_blank" rel="noopener noreferrer">Conferir fonte oficial ↗</a></div></article>`}

async function injetar(nome){
 try{
  const ir=await fetch('/dados/planos-governo-2026/index.json?v=20260917j4',{cache:'no-store'});
  if(!ir.ok)return;
  const idx=await ir.json();
  const doc=(idx.documentos||[]).find(x=>x.candidato===nome);
  if(!doc)return;
  const tr=await fetch(doc.texto+'?v='+encodeURIComponent(idx.geradoEm||''),{cache:'no-store'});
  if(!tr.ok)return;
  const extras=analisar(await tr.text());
  if(!extras.length)return;
  setTimeout(()=>{
   const painel=document.querySelector('.analise-juridica');
   const lista=painel?.querySelector('.analise-lista');
   if(!painel)return;
   if(lista){
    const existentes=new Set([...lista.querySelectorAll('.analise-item blockquote')].map(x=>normalizar(x.textContent).slice(0,160)));
    for(const a of extras)if(!existentes.has(normalizar(a.trecho).slice(0,160)))lista.insertAdjacentHTML('beforeend',html(a));
   }else{
    painel.querySelector('.analise-sem-alerta')?.remove();
    painel.querySelector('.analise-fontes')?.insertAdjacentHTML('beforebegin',`<div class="analise-lista">${extras.map(html).join('')}</div>`);
   }
  },250);
 }catch{}
}

document.addEventListener('click',e=>{
 const b=e.target.closest?.('[data-analise-juridica]');
 if(b?.dataset.analiseJuridica)injetar(b.dataset.analiseJuridica);
});
window.BibliotecaAnaliseJuridicaExtra={analisar,regras};
