const limpar=v=>String(v||'').replace(/[<>\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim().slice(0,180);
export default async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({erro:'Método não permitido.'});
 const q=limpar(req.query.q);if(!q)return res.status(400).json({erro:'Consulta obrigatória.'});
 const pagina=Math.max(1,Math.min(Number.parseInt(req.query.pagina||'1',10)||1,50)),limite=20,continueAt=(pagina-1)*limite;
 const u=new URL('https://www.wikidata.org/w/api.php');u.searchParams.set('action','wbsearchentities');u.searchParams.set('search',q);u.searchParams.set('language','pt');u.searchParams.set('uselang','pt');u.searchParams.set('type','item');u.searchParams.set('limit',String(limite));u.searchParams.set('continue',String(continueAt));u.searchParams.set('format','json');u.searchParams.set('origin','*');
 try{const r=await fetch(u,{headers:{Accept:'application/json','User-Agent':'BibliotecaLivre/2.1 (mailto:suporte@bibliotecalivre.org)'},signal:AbortSignal.timeout(4500)});const texto=await r.text();if(!r.ok)return res.status(r.status).send(texto);res.setHeader('Cache-Control','s-maxage=900, stale-while-revalidate=3600');return res.status(200).send(texto)}catch(e){return res.status(502).json({erro:'Wikidata temporariamente indisponível.',codigo:['TimeoutError','AbortError'].includes(e?.name)?'FONTE_TIMEOUT':'FONTE_INDISPONIVEL'})}
}
