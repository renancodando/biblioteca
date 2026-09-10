import{obterJSON,endereco,consultaLimpa,variantesBusca,pontuarCorrespondencia,termosBusca}from'./comum.js';
export function converterGoogle(item){
 const v=item?.volumeInfo||{},a=item?.accessInfo||{},s=item?.saleInfo||{};
 const pdf=a.pdf?.isAvailable?endereco(a.pdf.downloadLink):null,epub=a.epub?.isAvailable?endereco(a.epub.downloadLink):null;
 const integral=a.publicDomain===true||a.accessViewStatus==='FULL_PUBLIC_DOMAIN'||a.viewability==='ALL_PAGES';
 const previa=!integral&&(a.viewability==='PARTIAL'||a.accessViewStatus==='SAMPLE'||Boolean(v.previewLink)||Boolean(a.webReaderLink));
 const ler=endereco(a.webReaderLink)||endereco(v.previewLink)||endereco(v.infoLink)||endereco(v.canonicalVolumeLink)||endereco(s.buyLink);
 if(!ler&&!pdf&&!epub)return null;
 const tipoAcesso=integral?'Leitura integral':previa?'Prévia':'Catálogo';
 return{id:`google:${item.id}`,fonte:'google',provedor:'Google Books',titulo:v.title||'Sem título',subtitulo:v.subtitle||'',autores:Array.isArray(v.authors)?v.authors:[],idiomas:v.language?[v.language]:[],capa:endereco(v.imageLinks?.thumbnail?.replace(/^http:/,'https:'))||endereco(v.imageLinks?.smallThumbnail?.replace(/^http:/,'https:')),descricao:v.description||'',dominioPublico:a.publicDomain===true||a.accessViewStatus==='FULL_PUBLIC_DOMAIN',acessoLivre:integral,tipoAcesso,licenca:integral?'O Google Books indica visualização integral para esta edição. A disponibilidade pode variar por país.':previa?'O Google Books oferece uma prévia desta edição.':'Esta edição foi encontrada no catálogo do Google Books.',origem:endereco(v.infoLink)||endereco(v.canonicalVolumeLink)||ler,ler,texto:null,formatos:[pdf&&{tipo:'PDF',url:pdf},epub&&{tipo:'EPUB',url:epub}].filter(Boolean),isbn:(v.industryIdentifiers||[]).map(x=>x.identifier).filter(Boolean)};
}
async function consultar(consulta,inicio,tamanho){const u=new URL('/api/google-books',location.origin);u.searchParams.set('q',consulta);u.searchParams.set('startIndex',String(inicio));u.searchParams.set('maxResults',String(tamanho));return obterJSON(u,16000,3)}
function consultaTitulo(q){const ts=termosBusca(q).filter(x=>x.length>1).slice(0,12);return ts.length?ts.map(x=>`intitle:${x}`).join(' '):''}
function incorporar(mapa,itens,termo){for(const l of (Array.isArray(itens)?itens:[]).map(converterGoogle).filter(Boolean)){l.relevancia=pontuarCorrespondencia(termo,l.titulo,l.autores);if(!mapa.has(l.id))mapa.set(l.id,l)}}
export async function pesquisarGoogleBooks(q,o={}){
 const termo=consultaLimpa(q);if(!termo)return{livros:[],total:0,temMais:false};
 const pagina=Math.max(1,o.pagina||1),tamanho=40,inicio=(pagina-1)*tamanho,variantes=variantesBusca(termo),mapa=new Map();let totalPrincipal=0,temMais=false,sucessos=0,ultimoErro=null;
 try{const d=await consultar(variantes[0],inicio,tamanho),itens=Array.isArray(d.items)?d.items:[];sucessos++;totalPrincipal=Number.isFinite(d.totalItems)?d.totalItems:itens.length;temMais=inicio+itens.length<totalPrincipal&&itens.length>0;incorporar(mapa,itens,termo)}catch(e){ultimoErro=e}
 if(pagina===1&&!([...mapa.values()].some(l=>(l.relevancia||0)>=7000))){
  const alternativas=[consultaTitulo(termo),...variantes.slice(1)].filter(Boolean);
  for(const consulta of [...new Set(alternativas)]){try{const d=await consultar(consulta,0,tamanho);sucessos++;incorporar(mapa,d.items,termo);if([...mapa.values()].some(l=>(l.relevancia||0)>=7000))break}catch(e){ultimoErro=e}}
 }
 if(!sucessos)throw ultimoErro||new Error('Google Books indisponível');
 const livros=[...mapa.values()].sort((a,b)=>(b.relevancia||0)-(a.relevancia||0));return{livros,total:totalPrincipal||livros.length,temMais};
}
