import{pesquisarGutendex}from'./gutendex.js';
import{pesquisarGoogleBooks}from'./google-books.js';
import{pesquisarWikisource}from'./wikisource.js';
import{pesquisarOpenLibrary}from'./open-library.js';
import{pesquisarInternetArchive}from'./internet-archive.js';
import{pesquisarLibraryCongress}from'./library-congress.js';
import{pesquisarOapen,pesquisarDoab}from'./oapen-doab.js';
import{pesquisarEuropePmc}from'./europe-pmc.js';
import{pesquisarEric}from'./eric.js';
import{pesquisarNcbiBookshelf}from'./ncbi-bookshelf.js';
import{pesquisarArxiv}from'./arxiv.js';
import{pesquisarDoaj}from'./doaj.js';
import{pesquisarGallica}from'./gallica.js';
import{pesquisarWikibooks,pesquisarWikiversity}from'./wikimedia-educacao.js';
import{pesquisarDpla}from'./dpla.js';
import{pesquisarCrossref}from'./crossref.js';
import{pesquisarCore}from'./core.js';
import{pesquisarSemanticScholar}from'./semantic-scholar.js';
import{pesquisarEuropeana}from'./europeana.js';
import{pesquisarDigitalNz,pesquisarTrove,pesquisarOpenTextbook,pesquisarOpenStax,pesquisarZenodo,pesquisarHal,pesquisarOpenAlex,pesquisarWikidata}from'./fontes-novas.js';
import{pesquisarPressbooks}from'./pressbooks.js';
import{pesquisarOpenAire}from'./openaire.js';
import{pesquisarDataCite}from'./datacite.js';
import{pesquisarBnDigital}from'./bndigital.js';
import{pesquisarScieloLivros}from'./scielo-livros.js';
import{normalizarTexto,pontuarCorrespondencia}from'./comum.js';
export const normalizar=normalizarTexto;
export const fontesCatalogo=[
 {id:'gutenberg',nome:'Project Gutenberg',pesquisar:pesquisarGutendex,prazo:5800,atraso:0},
 {id:'openlibrary',nome:'Open Library',pesquisar:pesquisarOpenLibrary,prazo:5800,atraso:0},
 {id:'google',nome:'Google Books',pesquisar:pesquisarGoogleBooks,prazo:6200,atraso:0},
 {id:'wikisource',nome:'Wikisource',pesquisar:pesquisarWikisource,prazo:6200,atraso:0},
 {id:'archive',nome:'Internet Archive',pesquisar:pesquisarInternetArchive,prazo:6500,atraso:80},
 {id:'europepmc',nome:'Europe PMC',pesquisar:pesquisarEuropePmc,prazo:6500,atraso:80},
 {id:'eric',nome:'ERIC · Educação',pesquisar:pesquisarEric,prazo:6500,atraso:100},
 {id:'doaj',nome:'DOAJ',pesquisar:pesquisarDoaj,prazo:6500,atraso:100},
 {id:'wikibooks',nome:'Wikibooks',pesquisar:pesquisarWikibooks,prazo:6500,atraso:150},
 {id:'wikiversity',nome:'Wikiversidade',pesquisar:pesquisarWikiversity,prazo:6500,atraso:150},
 {id:'oapen',nome:'OAPEN',pesquisar:pesquisarOapen,prazo:6800,atraso:220},
 {id:'doab',nome:'DOAB',pesquisar:pesquisarDoab,prazo:6800,atraso:220},
 {id:'scielolivros',nome:'SciELO Livros',pesquisar:pesquisarScieloLivros,prazo:15000,atraso:230},
 {id:'ncbi',nome:'NCBI Bookshelf',pesquisar:pesquisarNcbiBookshelf,prazo:7000,atraso:260},
 {id:'arxiv',nome:'arXiv',pesquisar:pesquisarArxiv,prazo:6800,atraso:260},
 {id:'loc',nome:'Library of Congress',pesquisar:pesquisarLibraryCongress,prazo:7000,atraso:320},
 {id:'gallica',nome:'Gallica · BnF',pesquisar:pesquisarGallica,prazo:7000,atraso:320},
 {id:'bndigital',nome:'Biblioteca Nacional Digital',pesquisar:pesquisarBnDigital,prazo:15000,atraso:340},
 {id:'dpla',nome:'DPLA',pesquisar:pesquisarDpla,prazo:7200,atraso:360},
 {id:'crossref',nome:'Crossref',pesquisar:pesquisarCrossref,prazo:15000,atraso:380},
 {id:'core',nome:'CORE',pesquisar:pesquisarCore,prazo:14500,atraso:400},
 {id:'semanticscholar',nome:'Semantic Scholar',pesquisar:pesquisarSemanticScholar,prazo:12500,atraso:420},
 {id:'europeana',nome:'Europeana',pesquisar:pesquisarEuropeana,prazo:12500,atraso:440},
 {id:'digitalnz',nome:'DigitalNZ',pesquisar:pesquisarDigitalNz,prazo:12500,atraso:460},
 {id:'trove',nome:'Trove',pesquisar:pesquisarTrove,prazo:12500,atraso:480},
 {id:'opentextbook',nome:'Open Textbook Library',pesquisar:pesquisarOpenTextbook,prazo:12500,atraso:500},
 {id:'openstax',nome:'OpenStax',pesquisar:pesquisarOpenStax,prazo:12500,atraso:520},
 {id:'pressbooks',nome:'Pressbooks Directory',pesquisar:pesquisarPressbooks,prazo:12500,atraso:540},
 {id:'zenodo',nome:'Zenodo',pesquisar:pesquisarZenodo,prazo:14500,atraso:560},
 {id:'hal',nome:'HAL',pesquisar:pesquisarHal,prazo:12500,atraso:580},
 {id:'openalex',nome:'OpenAlex',pesquisar:pesquisarOpenAlex,prazo:12500,atraso:600},
 {id:'openaire',nome:'OpenAIRE',pesquisar:pesquisarOpenAire,prazo:15500,atraso:610},
 {id:'datacite',nome:'DataCite',pesquisar:pesquisarDataCite,prazo:15500,atraso:615},
 {id:'wikidata',nome:'Wikidata',pesquisar:pesquisarWikidata,prazo:10500,atraso:620}
];
const esperar=ms=>ms?new Promise(r=>setTimeout(r,ms)):Promise.resolve();
function comPrazo(promessa,ms,nome){let timer;return Promise.race([promessa,new Promise((_,rejeitar)=>{timer=setTimeout(()=>{const e=new Error(`${nome} demorou além do limite e foi liberada para não travar a pesquisa.`);e.codigo='FONTE_LENTA';rejeitar(e)},ms)})]).finally(()=>clearTimeout(timer))}
function incorporar(saida,id,dados,q){const itens=Array.isArray(dados?.livros)?dados.livros:[];for(const l of itens){if(!Number.isFinite(l.relevancia))l.relevancia=pontuarCorrespondencia(q,l.titulo,l.autores);if(l?.id&&!saida.mapa.has(l.id))saida.mapa.set(l.id,l)}const anterior=saida.porFonte[id];saida.porFonte[id]={carregados:(anterior?.carregados||0)+itens.length,total:Number.isFinite(dados?.total)?Math.max(anterior?.total||0,dados.total):(anterior?.total??null),temMais:Boolean(anterior?.temMais||dados?.temMais),erro:false,mensagem:''};saida.erros.delete(id);return itens}
function falhar(saida,id,erro){if(!saida.porFonte[id]?.carregados){saida.erros.add(id);saida.porFonte[id]={carregados:0,total:null,temMais:false,erro:true,mensagem:erro?.message||''}}}
export async function pesquisarAcervo(q,o={}){
 const ativos=fontesCatalogo.filter(f=>!Array.isArray(o.fontesAtivas)||o.fontesAtivas.includes(f.id)),saida={mapa:new Map(),erros:new Set(),porFonte:{}};
 let concluidas=0;const totalFontes=ativos.length;
 await Promise.all(ativos.map(async fonte=>{
  await esperar(fonte.atraso||0);
  try{
   const dados=await comPrazo(Promise.resolve().then(()=>fonte.pesquisar(q,o)),fonte.prazo||6500,fonte.nome),itens=incorporar(saida,fonte.id,dados,q);concluidas++;
   o.aoFonte?.({id:fonte.id,nome:fonte.nome,ok:true,quantidade:itens.length,concluidas,total:totalFontes,livros:itens,dados:{...saida.porFonte[fonte.id]}});
  }catch(e){
   falhar(saida,fonte.id,e);concluidas++;
   o.aoFonte?.({id:fonte.id,nome:fonte.nome,ok:false,quantidade:0,concluidas,total:totalFontes,mensagem:e?.message||'',livros:[],dados:{...saida.porFonte[fonte.id]}});
  }
 }));
 const livros=[...saida.mapa.values()].sort((a,b)=>(b.relevancia||0)-(a.relevancia||0));
 return{livros,erros:[...saida.erros],porFonte:saida.porFonte,temMais:Object.values(saida.porFonte).some(v=>v.temMais)};
}
