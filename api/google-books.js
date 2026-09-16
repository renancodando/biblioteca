const esperar=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const temporarios=new Set([408,425,429,500,502,503,504]);
function atraso(resposta,tentativa){
  const valor=String(resposta?.headers?.get('retry-after')||'').trim();
  const segundos=Number(valor);
  if(Number.isFinite(segundos)&&segundos>0)return Math.min(segundos*1000,1800);
  const data=Date.parse(valor);
  if(Number.isFinite(data))return Math.min(Math.max(0,data-Date.now()),1800);
  return 450+tentativa*350;
}
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
  let ultimoStatus=0,ultimoErro=null;
  for(let tentativa=0;tentativa<3;tentativa++){
    try{
      const resposta=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(5000)});
      const texto=await resposta.text();
      ultimoStatus=resposta.status;
      if(resposta.ok){
        res.setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=600');
        res.setHeader('Content-Type','application/json; charset=utf-8');
        return res.status(200).send(texto);
      }
      if(!temporarios.has(resposta.status))break;
      if(tentativa<2)await esperar(atraso(resposta,tentativa));
    }catch(e){
      ultimoErro=e;
      if(tentativa<2){await esperar(450+tentativa*350);continue;}
    }
  }
  if(!ultimoStatus){
    const codigo=ultimoErro?.name==='TimeoutError'||ultimoErro?.name==='AbortError'?'GOOGLE_BOOKS_TIMEOUT':'GOOGLE_BOOKS_UNAVAILABLE';
    return res.status(502).json({erro:'Google Books temporariamente indisponível.',codigo,googleBooksKeyConfigured:Boolean(chave)});
  }
  if(ultimoStatus===429)return res.status(429).json({erro:'Limite de consultas do Google Books atingido. Tente novamente mais tarde.',codigo:'GOOGLE_BOOKS_QUOTA',googleBooksKeyConfigured:Boolean(chave)});
  if([400,401,403].includes(ultimoStatus))return res.status(502).json({erro:chave?'Google Books recusou a chave configurada ou a permissão/cota associada a ela.':'Google Books recusou a consulta sem uma chave de API configurada.',codigo:'GOOGLE_BOOKS_AUTH',googleBooksKeyConfigured:Boolean(chave),googleStatus:ultimoStatus});
  return res.status(502).json({erro:'Google Books respondeu com erro temporário.',codigo:'GOOGLE_BOOKS_UPSTREAM',googleBooksKeyConfigured:Boolean(chave),googleStatus:ultimoStatus});
}
