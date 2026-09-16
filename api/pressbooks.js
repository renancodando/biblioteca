const limpar=v=>String(v||'').replace(/[<>\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim().slice(0,180);
export default async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({erro:'Método não permitido.'});
 const q=limpar(req.query.q);if(!q)return res.status(400).json({erro:'Consulta obrigatória.'});
 const pagina=Math.max(1,Math.min(Number.parseInt(req.query.pagina||'1',10)||1,500)),limite=20;
 const corpo={size:limite,from:(pagina-1)*limite,track_total_hits:true,query:{bool:{must:[{multi_match:{query:q,fields:['name^4','description^2','keywords','about.name','creator.name']}}],should:[{match_phrase:{'mainEntityOfPage.provider.name':'Pressbooks'}},{query_string:{query:'mainEntityOfPage.id:*pressbooks* OR mainEntityOfPage.url:*pressbooks*',analyze_wildcard:true}}],minimum_should_match:1}}};
 try{const r=await fetch('https://oersi.org/api/search/oer_data/_search',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json','User-Agent':'BibliotecaLivre/2.1 (mailto:suporte@bibliotecalivre.org)'},body:JSON.stringify(corpo),signal:AbortSignal.timeout(5500)});const texto=await r.text();if(r.status===429)return res.status(200).json({taxaLimite:true,hits:{hits:[],total:{value:0}}});if(!r.ok)return res.status(r.status).send(texto);res.setHeader('Cache-Control','s-maxage=900, stale-while-revalidate=3600');return res.status(200).send(texto)}catch(e){return res.status(502).json({erro:'Pressbooks temporariamente indisponível.',codigo:['TimeoutError','AbortError'].includes(e?.name)?'FONTE_TIMEOUT':'FONTE_INDISPONIVEL'})}
}
