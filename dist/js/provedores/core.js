import{obterJSON,endereco,consultaLimpa,pontuarCorrespondencia,idiomas}from'./comum.js';
const lista=v=>Array.isArray(v)?v:v==null?[]:[v];
export function converterCore(item){
 const id=String(item?.id||'').trim();if(!id)return null;
 const titulo=String(item?.title||'Sem título');
 const autores=lista(item?.authors).map(a=>typeof a==='string'?a:a?.name).filter(Boolean).map(String);
 const ano=item?.yearPublished||'';
 const downloadUrl=endereco(item?.downloadUrl);
 const linkAlternativo=lista(item?.links).map(l=>endereco(typeof l==='string'?l:l?.url)).find(Boolean);
 const ler=downloadUrl||linkAlternativo||endereco(`https://core.ac.uk/works/${id}`);
 const pdf=downloadUrl||(linkAlternativo&&/\.pdf(?:$|\?)/i.test(linkAlternativo)?linkAlternativo:null);
 const descricao=[item?.abstract,ano?`Publicado em ${ano}`:''].filter(Boolean).join(' · ');
 const lang=item?.language?.code||item?.language?.name||[];
 return{id:`core:${id}`,fonte:'core',provedor:'CORE · Artigos Abertos',titulo,autores,idiomas:idiomas(lang),capa:null,descricao,acessoLivre:Boolean(downloadUrl||linkAlternativo),dominioPublico:false,tipoAcesso:'Artigo científico · acesso aberto',licenca:'Indexado pelo repositório aberto CORE. O acesso integral ao texto está disponível para download.',origem:`https://core.ac.uk/works/${id}`,ler,texto:null,formatos:pdf?[{tipo:'PDF',url:pdf}]:[],doi:item?.doi||null};
}
export async function pesquisarCore(q,o={}){
 const termo=consultaLimpa(q);if(!termo)return{livros:[],total:0,temMais:false};
 const pagina=Math.max(1,o.pagina||1),u=new URL('/api/acervos-gratuitos',location.origin);
 u.searchParams.set('fonte','core');u.searchParams.set('q',termo);u.searchParams.set('pagina',String(pagina));
 try{
  const d=await obterJSON(u,14000,2);
  if(d?.desativada||d?.taxaLimite)return{livros:[],total:0,temMais:false};
  const itens=Array.isArray(d?.results)?d.results:[];
  const livros=itens.map(converterCore).filter(Boolean);
  for(const l of livros)l.relevancia=pontuarCorrespondencia(termo,l.titulo,l.autores);
  livros.sort((a,b)=>(b.relevancia||0)-(a.relevancia||0));
  const total=Number(d?.totalHits)||livros.length;
  return{livros,total,temMais:pagina*20<total&&itens.length>0};
 }catch{return{livros:[],total:0,temMais:false}}
}

