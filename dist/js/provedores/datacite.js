import{obterJSON,endereco,consultaLimpa,pontuarCorrespondencia,idiomas}from'./comum.js';
const lista=v=>Array.isArray(v)?v:v==null?[]:[v],texto=v=>String(v??'').trim();
const aberta=r=>/creative\s*commons|\bcc[- ]?[a-z0-9.]+\b|public\s*domain|\bopen\b|\bmit\b|apache|\bgpl\b|\bbsd\b|unlicense|odc|pddl/i.test([r?.rights,r?.rightsUri,r?.rightsIdentifier].filter(Boolean).join(' '));
const urlsConteudo=a=>lista(a?.contentUrl).map(v=>endereco(typeof v==='string'?v:v?.url)).filter(Boolean);
function tipoRotulo(a){const t=texto(a?.types?.resourceTypeGeneral||a?.types?.resourceType||a?.types?.schemaOrg).toLowerCase();if(/dataset|data/.test(t))return'Dataset aberto';if(/software|code|computational/.test(t))return'Software aberto';if(/dissertation|thesis/.test(t))return'Tese ou dissertação aberta';if(/journal|article|text|report|preprint/.test(t))return'Publicação acadêmica aberta';return'Produto de pesquisa aberto'}
export function converterDataCite(item){
 const a=item?.attributes||{},doi=texto(a.doi||item?.id);if(!doi)return null;
 const direitos=lista(a.rightsList),conteudos=urlsConteudo(a),temLicencaAberta=direitos.some(aberta);if(!temLicencaAberta&&!conteudos.length)return null;
 const titulo=texto(lista(a.titles).map(t=>typeof t==='string'?t:t?.title).find(Boolean))||'Sem título';
 const autores=lista(a.creators).map(c=>texto(typeof c==='string'?c:c?.name||[c?.givenName,c?.familyName].filter(Boolean).join(' '))).filter(Boolean);
 const origem=endereco(a.url)||`https://doi.org/${encodeURIComponent(doi)}`;
 const formatos=conteudos.filter(u=>/\.(pdf|epub)(?:$|[?#])/i.test(u)).slice(0,2).map(url=>({tipo:/\.pdf(?:$|[?#])/i.test(url)?'PDF':'EPUB',url}));
 const descricao=lista(a.descriptions).map(d=>texto(typeof d==='string'?d:d?.description)).find(Boolean)||'';
 const licenca=direitos.map(r=>texto(r?.rights||r?.rightsIdentifier||r?.rightsUri)).find(Boolean)||(conteudos.length?'Arquivo aberto informado pelo registro DataCite.':'Acesso aberto indicado pelo DataCite.');
 return{id:`datacite:${doi.toLowerCase()}`,fonte:'datacite',provedor:'DataCite',titulo,autores,idiomas:idiomas(a.language||[]),capa:null,descricao:[descricao,a.publicationYear,a.publisher].filter(Boolean).join(' · '),acessoLivre:true,dominioPublico:/public\s*domain|cc0|pddl/i.test(licenca),tipoAcesso:tipoRotulo(a),licenca,origem,ler:formatos[0]?.url||conteudos[0]||origem,texto:null,formatos,doi};
}
export async function pesquisarDataCite(q,o={}){
 const termo=consultaLimpa(q);if(!termo)return{livros:[],total:0,temMais:false};
 const pagina=Math.max(1,o.pagina||1),u=new URL('/api/datacite',location.origin);u.searchParams.set('q',termo);u.searchParams.set('pagina',String(pagina));
 try{
  const d=await obterJSON(u,15000,2);if(d?.taxaLimite)return{livros:[],total:0,temMais:false};
  const itens=lista(d?.data),livros=itens.map(converterDataCite).filter(Boolean);
  for(const l of livros)l.relevancia=pontuarCorrespondencia(termo,l.titulo,l.autores);
  livros.sort((a,b)=>(b.relevancia||0)-(a.relevancia||0));
  const total=Number(d?.meta?.total)||livros.length,totalPaginas=Number(d?.meta?.totalPages)||Math.ceil(total/20);
  return{livros,total,temMais:pagina<totalPaginas&&itens.length>0};
 }catch{return{livros:[],total:0,temMais:false}}
}
