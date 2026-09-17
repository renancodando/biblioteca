const limpar=v=>String(v||'').replace(/[<>\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim().slice(0,180);
export default async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({erro:'Método não permitido.'});
 const q=limpar(req.query.q);if(!q)return res.status(400).json({erro:'Consulta obrigatória.'});
 const pagina=Math.max(1,Math.min(Number.parseInt(req.query.pagina||'1',10)||1,500));
 const u=new URL('https://api.openalex.org/works');
 u.searchParams.set('search',q);
 u.searchParams.set('filter','has_content.pdf:true,open_access.is_oa:true');
 u.searchParams.set('per-page','40');
 u.searchParams.set('page',String(pagina));
 u.searchParams.set('select','id,doi,display_name,authorships,language,publication_year,type,cited_by_count,open_access,best_oa_location,primary_location,locations');
 u.searchParams.set('mailto','suporte@bibliotecalivre.org');
 try{
  const r=await fetch(u,{headers:{Accept:'application/json','User-Agent':'BibliotecaLivre/2.5 (mailto:suporte@bibliotecalivre.org)'},signal:AbortSignal.timeout(7000)});
  if(r.status===429)return res.status(200).json({taxaLimite:true,results:[],meta:{count:0}});
  const texto=await r.text();
  if(!r.ok)return res.status(r.status).send(texto);
  res.setHeader('Cache-Control','s-maxage=900, stale-while-revalidate=3600');
  return res.status(200).send(texto);
 }catch(e){return res.status(502).json({erro:'OpenAlex temporariamente indisponível.',codigo:['TimeoutError','AbortError'].includes(e?.name)?'FONTE_TIMEOUT':'FONTE_INDISPONIVEL'})}
}
