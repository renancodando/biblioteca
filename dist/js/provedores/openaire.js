import{obterJSON,endereco,consultaLimpa,pontuarCorrespondencia,idiomas}from'./comum.js';
const lista=v=>Array.isArray(v)?v:v==null?[]:[v],texto=v=>String(v??'').trim();
const aberto=i=>/OPEN/i.test(texto(i?.accessRight?.label||i?.accessright?.label));
const urls=i=>lista(i?.urls||i?.url).map(endereco).filter(Boolean);
const pidsDe=i=>lista(i?.pids||i?.pid).map(p=>({scheme:texto(p?.scheme).toLowerCase(),value:texto(p?.value)})).filter(p=>p.value);
export function converterOpenAire(item){
 const id=texto(item?.id);if(!id)return null;
 const instancias=lista(item?.instances||item?.instance),abertoProduto=/OPEN/i.test(texto(item?.bestAccessRight?.label||item?.bestaccessright?.label)),abertas=instancias.filter(aberto),candidatas=abertas.length?abertas:(abertoProduto?instancias:[]),instancia=candidatas.find(i=>urls(i).length)||candidatas[0];
 const links=instancia?urls(instancia):[];if(!links.length)return null;
 const pids=[...pidsDe(item),...instancias.flatMap(pidsDe)],doi=pids.find(p=>p.scheme==='doi')?.value||null;
 const titulo=texto(item?.mainTitle||item?.maintitle||item?.title)||'Sem título';
 const autores=lista(item?.authors||item?.author).map(a=>texto(typeof a==='string'?a:a?.fullName||a?.fullname||[a?.name,a?.surname].filter(Boolean).join(' '))).filter(Boolean);
 const lang=item?.language?.code||item?.language?.label||item?.language||[];
 const descricao=lista(item?.descriptions||item?.description).map(d=>texto(typeof d==='string'?d:d?.value||d?.description)).find(Boolean)||'';
 const origem=links[0],licenca=texto(instancia?.license||item?.license)||'Acesso aberto indicado pelo OpenAIRE.';
 const formatos=links.filter(u=>/\.(pdf|epub)(?:$|[?#])/i.test(u)).slice(0,2).map(url=>({tipo:/\.pdf(?:$|[?#])/i.test(url)?'PDF':'EPUB',url}));
 const tipo=texto(item?.type).toLowerCase(),rotulo=(tipo==='dataset'||tipo==='data')?'Dataset aberto':tipo==='software'?'Software aberto':tipo==='publication'?'Publicação científica aberta':'Produto de pesquisa aberto';
 return{id:`openaire:${doi||id}`,fonte:'openaire',provedor:'OpenAIRE Graph',titulo,autores,idiomas:idiomas(lang),capa:null,descricao:[descricao,item?.publicationDate||item?.publicationdate,item?.publisher].filter(Boolean).join(' · '),acessoLivre:true,dominioPublico:false,tipoAcesso:rotulo,licenca,origem,ler:formatos[0]?.url||origem,texto:null,formatos,doi};
}
export async function pesquisarOpenAire(q,o={}){
 const termo=consultaLimpa(q);if(!termo)return{livros:[],total:0,temMais:false};
 const pagina=Math.max(1,o.pagina||1),u=new URL('/api/openaire',location.origin);u.searchParams.set('q',termo);u.searchParams.set('pagina',String(pagina));
 try{
  const d=await obterJSON(u,15000,2);if(d?.taxaLimite)return{livros:[],total:0,temMais:false};
  const itens=lista(d?.results),livros=itens.map(converterOpenAire).filter(Boolean);
  for(const l of livros)l.relevancia=pontuarCorrespondencia(termo,l.titulo,l.autores);
  livros.sort((a,b)=>(b.relevancia||0)-(a.relevancia||0));
  const total=Number(d?.header?.numFound)||livros.length;
  return{livros,total,temMais:pagina*20<total&&itens.length>0};
 }catch{return{livros:[],total:0,temMais:false}}
}
