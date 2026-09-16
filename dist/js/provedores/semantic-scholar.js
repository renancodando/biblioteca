import{obterJSON,endereco,consultaLimpa,pontuarCorrespondencia}from'./comum.js';
const lista=v=>Array.isArray(v)?v:v==null?[]:[v];
export function converterSemanticScholar(item){
 const id=String(item?.paperId||'').trim();if(!id)return null;
 const titulo=String(item?.title||'Sem título');
 const autores=lista(item?.authors).map(a=>typeof a==='string'?a:a?.name).filter(Boolean).map(String);
 const pdfUrl=endereco(item?.openAccessPdf?.url);
 const pagina=endereco(item?.url)||`https://www.semanticscholar.org/paper/${id}`;
 const ler=pdfUrl||pagina;
 const aberto=Boolean(item?.isOpenAccess&&pdfUrl);
 const doi=item?.externalIds?.DOI||null;
 const citacoes=Number.isFinite(item?.citationCount)?`${item.citationCount} citação${item.citationCount===1?'':'ões'}`:'';
 const descricao=[item?.abstract,item?.year?`Ano: ${item.year}`:'',citacoes].filter(Boolean).join(' · ');
 return{id:`semanticscholar:${id}`,fonte:'semanticscholar',provedor:'Semantic Scholar',titulo,autores,idiomas:[],capa:null,descricao,acessoLivre:aberto,dominioPublico:false,tipoAcesso:aberto?'Artigo científico · PDF aberto':'Artigo acadêmico · metadados',licenca:aberto?'Versão em acesso aberto disponibilizada pelo Semantic Scholar.':'Metadados e citações indexados pelo Semantic Scholar.',origem:pagina,ler,texto:null,formatos:pdfUrl?[{tipo:'PDF',url:pdfUrl}]:[],doi};
}
export async function pesquisarSemanticScholar(q,o={}){
 const termo=consultaLimpa(q);if(!termo)return{livros:[],total:0,temMais:false};
 const pagina=Math.max(1,o.pagina||1),u=new URL('/api/acervos-gratuitos',location.origin);
 u.searchParams.set('fonte','semanticscholar');u.searchParams.set('q',termo);u.searchParams.set('pagina',String(pagina));
 try{
  const d=await obterJSON(u,12000,2);
  if(d?.taxaLimite||d?.desativada)return{livros:[],total:0,temMais:false};
  const itens=Array.isArray(d?.data)?d.data:[];
  const livros=itens.map(converterSemanticScholar).filter(Boolean);
  for(const l of livros)l.relevancia=pontuarCorrespondencia(termo,l.titulo,l.autores);
  livros.sort((a,b)=>(b.relevancia||0)-(a.relevancia||0));
  const total=Number(d?.total)||livros.length;
  return{livros,total,temMais:pagina*20<total&&itens.length>0};
 }catch{return{livros:[],total:0,temMais:false}}
}

