import{obterJSON,endereco,consultaLimpa,pontuarCorrespondencia,idiomas}from'./comum.js';
import{consultarUnpaywall}from'./unpaywall.js';
const lista=v=>Array.isArray(v)?v:v==null?[]:[v];
export function converterCrossref(item,oa=null){
 const doi=String(item?.DOI||'').trim();if(!doi)return null;
 const titulo=lista(item.title).find(Boolean)||'Sem título';
 const autores=lista(item.author).map(a=>[a?.given,a?.family].filter(Boolean).join(' ').trim()||a?.name).filter(Boolean).map(String);
 const ano=item?.published?.['date-parts']?.[0]?.[0]||item?.created?.['date-parts']?.[0]?.[0]||'';
 const container=lista(item['container-title'])[0]||'';
 const descricao=[container,ano,doi].filter(Boolean).join(' · ');
 const origem=endereco(item.URL)||`https://doi.org/${encodeURIComponent(doi)}`;
 const lic=lista(item.license).map(l=>l?.URL).filter(Boolean);
 const licAberta=lic.some(u=>/creativecommons\.org\/(?:licenses|publicdomain)/i.test(u));
 const confirmadoAberto=Boolean(oa?.is_oa||licAberta);
 const ler=confirmadoAberto?(oa?.oa_url||origem):null;
 const pdf=confirmadoAberto?(oa?.pdf_url||null):null;
 return{id:`crossref:${doi}`,fonte:'crossref',provedor:'Crossref',titulo:String(titulo),autores,idiomas:idiomas(item.language||[]),capa:null,descricao,acessoLivre:confirmadoAberto,dominioPublico:false,tipoAcesso:confirmadoAberto?'Artigo acadêmico · acesso aberto':'Registro acadêmico · metadados',licenca:oa?.licenca||(licAberta?'Licença aberta confirmada':'Consulte as condições da publicação na fonte.'),origem,ler,texto:null,formatos:pdf?[{tipo:'PDF',url:pdf}]:[],doi};
}
export async function pesquisarCrossref(q,o={}){
 const termo=consultaLimpa(q);if(!termo)return{livros:[],total:0,temMais:false};
 const pagina=Math.max(1,o.pagina||1),u=new URL('/api/acervos-gratuitos',location.origin);
 u.searchParams.set('fonte','crossref');u.searchParams.set('q',termo);u.searchParams.set('pagina',String(pagina));
 try{
  const d=await obterJSON(u,14000,2);
  const itens=Array.isArray(d?.message?.items)?d.message.items:[];
  const oas=await Promise.allSettled(itens.map(it=>it?.DOI?consultarUnpaywall(it.DOI):Promise.resolve(null)));
  const livros=itens.map((it,i)=>converterCrossref(it,oas[i]?.status==='fulfilled'?oas[i].value:null)).filter(Boolean);
  for(const l of livros)l.relevancia=pontuarCorrespondencia(termo,l.titulo,l.autores);
  livros.sort((a,b)=>(b.relevancia||0)-(a.relevancia||0));
  const total=Number(d?.message?.['total-results'])||livros.length;
  return{livros,total,temMais:pagina*20<total&&itens.length>0};
 }catch{return{livros:[],total:0,temMais:false}}
}

