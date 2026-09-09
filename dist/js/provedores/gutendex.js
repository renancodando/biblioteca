import{obterJSON,endereco,consultaLimpa,variantesBusca,pontuarCorrespondencia}from'./comum.js';
export function converterGutendex(l){
 const formatos=l?.formats||{},pegar=m=>endereco(Object.entries(formatos).find(([k])=>k.startsWith(m))?.[1]);
 const html=pegar('text/html'),txt=pegar('text/plain'),epub=pegar('application/epub+zip'),pdf=pegar('application/pdf');if(!html&&!txt&&!epub&&!pdf)return null;
 const dominioPublico=l.copyright===false;
 return{id:`gutendex:${l.id}`,fonte:'gutenberg',provedor:'Project Gutenberg',titulo:l.title||'Sem título',autores:(l.authors||[]).map(a=>a.name).filter(Boolean),idiomas:l.languages||[],assuntos:l.subjects||[],capa:pegar('image/jpeg')||pegar('image/png'),descricao:Array.isArray(l.summaries)?l.summaries[0]||'':'',dominioPublico,acessoLivre:true,tipoAcesso:'Leitura integral',licenca:dominioPublico?'O catálogo Gutendex indica esta obra como domínio público nos EUA.':'A obra é disponibilizada gratuitamente pelo Project Gutenberg; consulte a página da edição para as condições de direitos na sua região.',origem:`https://www.gutenberg.org/ebooks/${l.id}`,ler:html||txt||`https://www.gutenberg.org/ebooks/${l.id}`,texto:txt,formatos:[pdf&&{tipo:'PDF',url:pdf},epub&&{tipo:'EPUB',url:epub},txt&&{tipo:'TXT',url:txt}].filter(Boolean),downloads:l.download_count||0};
}
async function consulta(v,pagina){const u=new URL('https://gutendex.com/books/');u.searchParams.set('search',v);if(pagina>1)u.searchParams.set('page',String(pagina));return obterJSON(u,15000,3)}
function incorporar(mapa,itens,termo){for(const l of (Array.isArray(itens)?itens:[]).map(converterGutendex).filter(Boolean)){l.relevancia=pontuarCorrespondencia(termo,l.titulo,l.autores);if(!mapa.has(l.id))mapa.set(l.id,l)}}
export async function pesquisarGutendex(q,o={}){
 const termo=consultaLimpa(q);if(!termo)return{livros:[],total:0,temMais:false};
 const pagina=Math.max(1,o.pagina||1),vars=variantesBusca(termo),mapa=new Map();let totalPrincipal=0,temMais=false,sucessos=0,ultimoErro=null;
 for(let i=0;i<(pagina===1?vars.length:1);i++){
  try{const d=await consulta(vars[i],pagina),itens=Array.isArray(d.results)?d.results:[];sucessos++;if(i===0||!totalPrincipal){totalPrincipal=Number.isFinite(d.count)?d.count:itens.length;temMais=Boolean(d.next)}incorporar(mapa,itens,termo);if(i>0&&[...mapa.values()].some(l=>(l.relevancia||0)>=7000))break}catch(e){ultimoErro=e}
  if(i===0&&[...mapa.values()].some(l=>(l.relevancia||0)>=7000))break;
 }
 if(!sucessos)throw ultimoErro||new Error('Project Gutenberg indisponível');
 const livros=[...mapa.values()].sort((a,b)=>(b.relevancia||0)-(a.relevancia||0));return{livros,total:totalPrincipal||livros.length,temMais};
}
