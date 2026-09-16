import{obterJSON,endereco,consultaLimpa,pontuarCorrespondencia,idiomas}from'./comum.js';
const lista=v=>Array.isArray(v)?v:v==null?[]:[v];
export function converterDpla(item){
 const id=String(item?.id||'').trim();if(!id)return null;
 const sr=item?.sourceResource||{};
 const titulo=lista(sr.title).find(Boolean)||'Sem título';
 const autores=lista(sr.creator).map(a=>typeof a==='string'?a:a?.name).filter(Boolean).map(String);
 const langs=lista(sr.language).map(l=>typeof l==='string'?l:l?.name||l?.iso_639_3).filter(Boolean);
 const capa=endereco(item?.object);
 const ler=endereco(item?.isShownAt);
 const descricao=[lista(sr.description)[0],sr.date?.displayDate,item?.dataProvider].filter(Boolean).join(' · ');
 return{id:`dpla:${id}`,fonte:'dpla',provedor:'DPLA · Acervos dos EUA',titulo:String(titulo),autores,idiomas:idiomas(langs),capa,descricao,acessoLivre:Boolean(ler),dominioPublico:false,tipoAcesso:'Acervo histórico digitalizado',licenca:item?.rights||'Item digitalizado fornecido pela Digital Public Library of America.',origem:ler||`https://dp.la/item/${id}`,ler,texto:null,formatos:[]};
}
export async function pesquisarDpla(q,o={}){
 const termo=consultaLimpa(q);if(!termo)return{livros:[],total:0,temMais:false};
 const pagina=Math.max(1,o.pagina||1),u=new URL('/api/acervos-gratuitos',location.origin);
 u.searchParams.set('fonte','dpla');u.searchParams.set('q',termo);u.searchParams.set('pagina',String(pagina));
 try{
  const d=await obterJSON(u,12000,2);
  if(d?.desativada||d?.taxaLimite)return{livros:[],total:0,temMais:false};
  const docs=Array.isArray(d?.docs)?d.docs:[],livros=docs.map(converterDpla).filter(Boolean);
  for(const l of livros)l.relevancia=pontuarCorrespondencia(termo,l.titulo,l.autores);
  livros.sort((a,b)=>(b.relevancia||0)-(a.relevancia||0));
  const total=Number(d?.count)||livros.length;
  return{livros,total,temMais:pagina*20<total&&docs.length>0};
 }catch{return{livros:[],total:0,temMais:false}}
}

