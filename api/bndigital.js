const limpar=v=>String(v||'').replace(/[<>\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim().slice(0,180);
const entidades=v=>String(v||'').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,'<').replace(/&gt;/gi,'>');
async function obter(url){
 const r=await fetch(url,{headers:{Accept:'text/html,application/xhtml+xml;q=0.9,*/*;q=0.1','User-Agent':'BibliotecaLivre/2.1 (acervo aberto; mailto:suporte@bibliotecalivre.org)'},signal:AbortSignal.timeout(7000)});
 const b=await r.arrayBuffer(),tipo=r.headers.get('content-type')||'',enc=/iso-8859-1|windows-1252/i.test(tipo)?'windows-1252':'utf-8',html=new TextDecoder(enc).decode(b);
 if(!r.ok)throw Object.assign(new Error(`BNDigital respondeu ${r.status}.`),{status:r.status});
 return html;
}
function temResultados(html){return /codigo_sophia=|codigo_obra=|content=detalhe/i.test(html)}
function proxima(html,base){
 const padroes=[/<a\b[^>]*href=["']([^"']+)["'][^>]*>\s*(?:Pr[oó]xima|Pr&oacute;xima)\b/i,/<a\b[^>]*href=["']([^"']+)["'][^>]*>\s*&gt;\s*<\/a>/i];
 for(const p of padroes){const m=html.match(p);if(m?.[1])try{return new URL(entidades(m[1]),base)}catch{}}
 return null;
}
function totalDe(html){const texto=String(html).replace(/<[^>]+>/g,' ').replace(/\s+/g,' '),m=texto.match(/([\d.]+)\s+registros?\s+encontrados?/i);return m?Number(m[1].replace(/\D/g,''))||0:0}
function urlBusca(q,campo='palavra_chave'){
 const u=new URL('https://acervobndigital.bn.gov.br/sophia/index.asp');u.searchParams.set('modo_busca','rapida');u.searchParams.set('campo1',campo);u.searchParams.set('valor1',q);return u;
}
export default async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({erro:'Método não permitido.'});
 const q=limpar(req.query.q);if(!q)return res.status(400).json({erro:'Consulta obrigatória.'});
 const pagina=Math.max(1,Math.min(Number.parseInt(req.query.pagina||'1',10)||1,20));
 try{
  let url=urlBusca(q),html=await obter(url);
  if(!temResultados(html)){url=urlBusca(q,'titulo');html=await obter(url)}
  if(!temResultados(html)){const tentativa=urlBusca(q,'palavra_chave');tentativa.searchParams.set('content','resultado');url=tentativa;html=await obter(url)}
  let atual=1;
  while(atual<pagina){const seguinte=proxima(html,url);if(!seguinte)break;url=seguinte;html=await obter(url);atual++}
  const seguinte=proxima(html,url),total=totalDe(html);
  res.setHeader('Cache-Control','s-maxage=900, stale-while-revalidate=3600');
  return res.status(200).json({html,pagina:atual,total,temMais:Boolean(seguinte)});
 }catch(e){
  if(e?.status===429)return res.status(200).json({html:'',pagina,total:0,temMais:false,taxaLimite:true});
  return res.status(502).json({erro:'Biblioteca Nacional Digital temporariamente indisponível.',codigo:['TimeoutError','AbortError'].includes(e?.name)?'FONTE_TIMEOUT':'FONTE_INDISPONIVEL'});
 }
}
