const limpar=v=>String(v||'').replace(/[<>\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim().slice(0,180);
const entidades=v=>String(v||'').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,'<').replace(/&gt;/gi,'>');
async function obter(url){
 const r=await fetch(url,{headers:{Accept:'text/html,application/xhtml+xml;q=0.9,*/*;q=0.1','User-Agent':'BibliotecaLivre/2.1 (acervo aberto; mailto:suporte@bibliotecalivre.org)'},signal:AbortSignal.timeout(7000)});
 const b=await r.arrayBuffer(),tipo=r.headers.get('content-type')||'',enc=/iso-8859-1|windows-1252/i.test(tipo)?'windows-1252':'utf-8',html=new TextDecoder(enc).decode(b);
 if(!r.ok)throw Object.assign(new Error(`SciELO Livros respondeu ${r.status}.`),{status:r.status});
 return html;
}
function proxima(html,base){
 const padroes=[/<a\b[^>]*href=["']([^"']+)["'][^>]*>\s*(?:Pr[oó]xima|Pr&oacute;xima)\b/i,/<a\b[^>]*rel=["']next["'][^>]*href=["']([^"']+)["']/i,/<a\b[^>]*href=["']([^"']+)["'][^>]*rel=["']next["']/i];
 for(const p of padroes){const m=html.match(p);if(m?.[1])try{return new URL(entidades(m[1]),base)}catch{}}
 return null;
}
function totalDe(html){const m=String(html).replace(/<[^>]+>/g,' ').match(/Resultados\s+\d+\s*-\s*\d+\s+de\s+([\d.,]+)/i);return m?Number(m[1].replace(/\D/g,''))||0:0}
export default async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({erro:'Método não permitido.'});
 const q=limpar(req.query.q);if(!q)return res.status(400).json({erro:'Consulta obrigatória.'});
 const pagina=Math.max(1,Math.min(Number.parseInt(req.query.pagina||'1',10)||1,20));
 try{
  let url=new URL('https://books.scielo.org/search/');
  url.searchParams.set('q',q);url.searchParams.set('index','tw');url.searchParams.set('where','BOOK');url.searchParams.set('lang','pt');url.searchParams.append('filter[is_comercial_filter][]','f');
  let html='',atual=1;
  while(atual<=pagina){html=await obter(url);if(atual===pagina)break;const seguinte=proxima(html,url);if(!seguinte)break;url=seguinte;atual++}
  const seguinte=proxima(html,url),total=totalDe(html);
  res.setHeader('Cache-Control','s-maxage=900, stale-while-revalidate=3600');
  return res.status(200).json({html,pagina:atual,total,temMais:Boolean(seguinte)});
 }catch(e){
  if(e?.status===429)return res.status(200).json({html:'',pagina,total:0,temMais:false,taxaLimite:true});
  return res.status(502).json({erro:'SciELO Livros temporariamente indisponível.',codigo:['TimeoutError','AbortError'].includes(e?.name)?'FONTE_TIMEOUT':'FONTE_INDISPONIVEL'});
 }
}
