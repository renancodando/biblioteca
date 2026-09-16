import{obterJSON,endereco,consultaLimpa,pontuarCorrespondencia,idiomas}from'./comum.js';
const lista=v=>Array.isArray(v)?v:v==null?[]:[v];
export function converterEuropeana(item){
 const id=String(item?.id||'').trim();if(!id)return null;
 const titulo=lista(item?.title).find(Boolean)||lista(item?.dcTitleLangAware?.def||item?.dcTitleLangAware?.en||item?.dcTitleLangAware?.pt).find(Boolean)||'Sem título';
 const autores=lista(item?.dcCreator||item?.dcCreatorLangAware?.def||item?.dcCreatorLangAware?.en).filter(Boolean).map(String);
 const capa=endereco(lista(item?.edmPreview)[0]);
 const ler=endereco(item?.edmIsShownAt?.[0]||item?.guid);
 const descricao=[lista(item?.dataProvider)[0],lista(item?.year)[0],lista(item?.type)[0]].filter(Boolean).join(' · ');
 const lang=lista(item?.language).filter(Boolean);
 return{id:`europeana:${id}`,fonte:'europeana',provedor:'Europeana · Acervos Europeus',titulo:String(titulo),autores,idiomas:idiomas(lang),capa,descricao,acessoLivre:Boolean(ler),dominioPublico:false,tipoAcesso:'Acervo cultural europeu digitalizado',licenca:item?.rights?.[0]||'Disponibilizado pela Europeana. Consulte os direitos na fonte.',origem:ler||`https://www.europeana.eu/item${id}`,ler,texto:null,formatos:[]};
}
export async function pesquisarEuropeana(q,o={}){
 const termo=consultaLimpa(q);if(!termo)return{livros:[],total:0,temMais:false};
 const pagina=Math.max(1,o.pagina||1),u=new URL('/api/acervos-gratuitos',location.origin);
 u.searchParams.set('fonte','europeana');u.searchParams.set('q',termo);u.searchParams.set('pagina',String(pagina));
 try{
  const d=await obterJSON(u,12000,2);
  if(d?.desativada||d?.taxaLimite)return{livros:[],total:0,temMais:false};
  const itens=Array.isArray(d?.items)?d.items:[];
  const livros=itens.map(converterEuropeana).filter(Boolean);
  for(const l of livros)l.relevancia=pontuarCorrespondencia(termo,l.titulo,l.autores);
  livros.sort((a,b)=>(b.relevancia||0)-(a.relevancia||0));
  const total=Number(d?.totalResults)||livros.length;
  return{livros,total,temMais:pagina*20<total&&itens.length>0};
 }catch{return{livros:[],total:0,temMais:false}}
}

