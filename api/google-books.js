const esperar=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export default async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({erro:'Método não permitido.'});
  const chave=String(process.env.GOOGLE_BOOKS_API_KEY||'').trim();
  const q=String(req.query.q||'').replace(/\s+/g,' ').trim().slice(0,180);
  if(!q)return res.status(400).json({erro:'Consulta obrigatória.'});
  const inicio=Math.max(0,Number.parseInt(req.query.startIndex||'0',10)||0);
  const maximo=Math.max(1,Math.min(Number.parseInt(req.query.maxResults||'40',10)||40,40));
  const url=new URL('https://www.googleapis.com/books/v1/volumes');
  url.searchParams.set('q',q);
  url.searchParams.set('printType','books');
  url.searchParams.set('projection','full');
  url.searchParams.set('orderBy','relevance');
  url.searchParams.set('maxResults',String(maximo));
  url.searchParams.set('startIndex',String(inicio));
  if(chave)url.searchParams.set('key',chave);
  let ultimaResposta=null,ultimoTexto='';
  try{
    for(let tentativa=0;tentativa<1;tentativa++){
      const resposta=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(4200)});
      const texto=await resposta.text();ultimaResposta=resposta;ultimoTexto=texto;
      if(resposta.ok){
        res.setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=600');
        res.setHeader('Content-Type','application/json; charset=utf-8');
        return res.status(200).send(texto);
      }
      if(![408,429,500,502,503,504].includes(resposta.status)||tentativa===2)break;
      const esperaCabecalho=Number(resposta.headers.get('retry-after'));
      await esperar(Number.isFinite(esperaCabecalho)&&esperaCabecalho>0?Math.min(esperaCabecalho*1000,5000):500*(tentativa+1));
    }
    const detalhe=ultimaResposta?.status===429?'Limite de consultas do Google Books atingido. Tente novamente mais tarde.':'Google Books respondeu com erro.';
    const status=ultimaResposta?.status||502;
    const codigo=status===429?'GOOGLE_BOOKS_QUOTA':'GOOGLE_BOOKS_UPSTREAM';
    return res.status(status).json({erro:detalhe,codigo,googleBooksKeyConfigured:Boolean(chave)});
  }catch(e){
    const codigo=e?.name==='TimeoutError'?'GOOGLE_BOOKS_TIMEOUT':'GOOGLE_BOOKS_UNAVAILABLE';
    return res.status(502).json({erro:'Google Books temporariamente indisponível.',codigo,googleBooksKeyConfigured:Boolean(chave)});
  }
}
