import{obterJSON,endereco,idiomas,consultaLimpa,variantesBusca,pontuarCorrespondencia}from'./comum.js';
const chaveEdicao=v=>typeof v==='string'?(v.match(/OL\d+M/)?.[0]||null):null;
export function converterOpenLibrary(l){
 const edicao=chaveEdicao(l.lending_edition_s)||chaveEdicao(l.cover_edition_key)||(l.edition_key||[]).map(chaveEdicao).find(Boolean),ia=(Array.isArray(l.ia)?l.ia:[]).find(v=>typeof v==='string'&&v.length<100);
 const pagina=endereco(l.key?`https://openlibrary.org${l.key}`:'');const paginaEdicao=edicao?endereco(`https://openlibrary.org/books/${edicao}`):null;
 const acesso=String(l.ebook_access||'unclassified'),acessoLivre=acesso==='public';
 const ler=acessoLivre&&ia?endereco(`https://archive.org/details/${encodeURIComponent(ia)}`):(paginaEdicao||pagina);if(!ler)return null;
 const codigos=idiomas(Array.isArray(l.language)?l.language:[]),capa=Number.isFinite(l.cover_i)?`https://covers.openlibrary.org/b/id/${l.cover_i}-M.jpg`:null;
 const tipoAcesso=acessoLivre?'Leitura integral':acesso==='borrowable'?'Empréstimo':'Catálogo';
 return{id:`openlibrary:${l.key||edicao||ia}`,fonte:'openlibrary',provedor:'Open Library',titulo:l.title||'Sem título',autores:Array.isArray(l.author_name)?l.author_name:[],idiomas:codigos,capa,descricao:'',acessoLivre,dominioPublico:l.public_scan_b===true,tipoAcesso,licenca:acessoLivre?'A Open Library marcou esta obra com acesso público e leitura online.':acesso==='borrowable'?'A obra pode ter opção de empréstimo conforme a fonte.':'A obra foi encontrada no catálogo da Open Library.',origem:paginaEdicao||pagina,ler,texto:null,formatos:[],isbn:Array.isArray(l.isbn)?l.isbn.slice(0,10):[]};
}
const campos='key,title,author_name,language,ebook_access,lending_edition_s,cover_edition_key,edition_key,cover_i,ia,public_scan_b,isbn';
function urlGeral(consulta,pagina,limite){const u=new URL('https://openlibrary.org/search.json');u.searchParams.set('q',consulta);u.searchParams.set('fields',campos);u.searchParams.set('limit',String(limite));u.searchParams.set('page',String(pagina));return u}
function urlTitulo(consulta,limite){const u=new URL('https://openlibrary.org/search.json');u.searchParams.set('title',consulta);u.searchParams.set('fields',campos);u.searchParams.set('limit',String(limite));return u}
function incorporar(mapa,docs,termo){for(const l of (Array.isArray(docs)?docs:[]).map(converterOpenLibrary).filter(Boolean)){l.relevancia=pontuarCorrespondencia(termo,l.titulo,l.autores);if(!mapa.has(l.id))mapa.set(l.id,l)}}
export async function pesquisarOpenLibrary(q,o={}){
 const termo=consultaLimpa(q);if(!termo)return{livros:[],total:0,temMais:false};
 const pagina=Math.max(1,o.pagina||1),limite=40,variantes=variantesBusca(termo),mapa=new Map();let totalPrincipal=0,temMais=false,sucessos=0,ultimoErro=null;
 if(pagina===1){
  for(const v of variantes){
   try{const d=await obterJSON(urlTitulo(v,25),12000,3);sucessos++;incorporar(mapa,d.docs,termo);if([...mapa.values()].some(l=>(l.relevancia||0)>=7000))break}catch(e){ultimoErro=e}
  }
 }
 try{const d=await obterJSON(urlGeral(variantes[0],pagina,limite),14000,3),docs=Array.isArray(d.docs)?d.docs:[];sucessos++;totalPrincipal=Number.isFinite(d.numFound)?d.numFound:docs.length;temMais=pagina*limite<totalPrincipal&&docs.length>0;incorporar(mapa,docs,termo)}catch(e){ultimoErro=e}
 if(!sucessos)throw ultimoErro||new Error('Open Library indisponível');
 const livros=[...mapa.values()].sort((a,b)=>(b.relevancia||0)-(a.relevancia||0));return{livros,total:totalPrincipal||livros.length,temMais};
}
