import{obterJSON,endereco,consultaLimpa,pontuarCorrespondencia}from'./comum.js';
const limpar=v=>String(v||'').replace(/\s+/g,' ').trim(),BASE='https://books.scielo.org/';
function absoluto(v){try{return new URL(v,BASE).href}catch{return null}}
function ancestral(a){let n=a;for(let i=0;i<6&&n;i++,n=n.parentElement){const t=limpar(n.textContent);if(/eISBN\s*:|Editora\s*:|Autor\(es\)\s*:|Organizador\(es\)\s*:/i.test(t))return n}return a.parentElement}
function capturar(txt,re,fim){const m=txt.match(re);if(!m)return'';let v=m[1]||'';if(fim){const i=v.search(fim);if(i>=0)v=v.slice(0,i)}return limpar(v)}
function livrosDoHtml(html){
 const doc=new DOMParser().parseFromString(String(html||''),'text/html'),saida=[],vistos=new Set();
 for(const a of doc.querySelectorAll('h2 a,h3 a')){
  const titulo=limpar(a.textContent),href=absoluto(a.getAttribute('href'));if(!href||titulo.length<3||/^(home|pesquisa|busca avançada)$/i.test(titulo)||vistos.has(href))continue;
  const bloco=ancestral(a),txt=limpar(bloco?.textContent||''),isbn=capturar(txt,/eISBN\s*:\s*([0-9Xx-]+)/i),autoresTxt=capturar(txt,/(?:Autor\(es\)|Organizador\(es\))\s*:\s*(.+)/i,/(?:Editora|Idioma|Ano|Sinopse)\s*:/i),editora=capturar(txt,/Editora\s*:\s*(.+)/i,/(?:Idioma|Ano|Sinopse)\s*:/i),idioma=capturar(txt,/Idioma\(s\)\s*:\s*(.+)/i,/(?:Ano|Sinopse)\s*:/i),ano=capturar(txt,/Ano\s*:\s*(\d{4})/i),sinopse=capturar(txt,/Sinopse\s*:\s*(.+)/i),autores=autoresTxt?autoresTxt.split(';').map(limpar).filter(Boolean):[];
  const formatos=[];for(const l of bloco?.querySelectorAll?.('a[href]')||[]){const u=absoluto(l.getAttribute('href'));if(!u)continue;if(/\.pdf(?:$|[?#])/i.test(u))formatos.push({tipo:'PDF',url:u});else if(/\.epub(?:$|[?#])/i.test(u))formatos.push({tipo:'EPUB',url:u})}
  const capa=absoluto(bloco?.querySelector?.('img')?.getAttribute('src'));
  vistos.add(href);saida.push({id:`scielolivros:${isbn||href}`,fonte:'scielolivros',provedor:'SciELO Livros',titulo,autores,idiomas:idioma?[idioma]:[],capa,endereco:href,descricao:[sinopse,ano,editora].filter(Boolean).join(' · '),acessoLivre:true,dominioPublico:false,tipoAcesso:'Livro em acesso aberto',licenca:'CC BY 4.0 para eBooks em acesso aberto no SciELO Livros.',origem:href,ler:formatos[0]?.url||href,texto:null,formatos,isbn:isbn||null});
 }
 return saida;
}
export async function pesquisarScieloLivros(q,o={}){
 const termo=consultaLimpa(q);if(!termo)return{livros:[],total:0,temMais:false};
 const pagina=Math.max(1,o.pagina||1),u=new URL('/api/scielo-livros',location.origin);u.searchParams.set('q',termo);u.searchParams.set('pagina',String(pagina));
 try{const d=await obterJSON(u,15000,2);if(d?.taxaLimite)return{livros:[],total:0,temMais:false};const livros=livrosDoHtml(d?.html);for(const l of livros)l.relevancia=pontuarCorrespondencia(termo,l.titulo,l.autores);livros.sort((a,b)=>(b.relevancia||0)-(a.relevancia||0));return{livros,total:Number(d?.total)||livros.length,temMais:Boolean(d?.temMais)}}catch{return{livros:[],total:0,temMais:false}}
}
