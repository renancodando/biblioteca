const limpar=v=>String(v||'').replace(/[<>\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim().slice(0,180);
export default async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({erro:'Método não permitido.'});
 const q=limpar(req.query.q);if(!q)return res.status(400).json({erro:'Consulta obrigatória.'});
 const pagina=Math.max(1,Math.min(Number.parseInt(req.query.pagina||'1',10)||1,500));
 const u=new URL('https://api.openaire.eu/graph/v3/research-products');
 u.searchParams.set('search',q);
 u.searchParams.append('accessRightLabel','Open Access');
 u.searchParams.append('accessRightLabel','Open Source');
 u.searchParams.set('page',String(pagina));
 u.searchParams.set('pageSize','20');
 u.searchParams.set('sortBy','relevance DESC');
 try{
  const r=await fetch(u,{headers:{Accept:'application/json','User-Agent':'BibliotecaLivre/2.1 (mailto:suporte@bibliotecalivre.org)'},signal:AbortSignal.timeout(6500)});
  const texto=await r.text();
  if(r.status===429)return res.status(200).json({taxaLimite:true,header:{numFound:0,page:pagina,pageSize:20},results:[]});
  if(!r.ok)return res.status(r.status).send(texto);
  res.setHeader('Cache-Control','s-maxage=900, stale-while-revalidate=3600');
  return res.status(200).send(texto);
 }catch(e){
  return res.status(502).json({erro:'OpenAIRE temporariamente indisponível.',codigo:['TimeoutError','AbortError'].includes(e?.name)?'FONTE_TIMEOUT':'FONTE_INDISPONIVEL'});
 }
}
