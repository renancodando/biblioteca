const checks=[
  ['ERIC','https://api.ies.ed.gov/eric/?search=reading&format=json&rows=1'],
  ['arXiv','https://export.arxiv.org/api/query?search_query=all:%22quantum%22&start=0&max_results=1'],
  ['DOAJ','https://doaj.org/api/search/articles/education?page=1&pageSize=1']
];
const wait=ms=>new Promise(r=>setTimeout(r,ms));
for(const [name,url] of checks){
  let ok=false,last='';
  for(let i=0;i<4;i++){
    try{
      const r=await fetch(url,{headers:{Accept:name==='arXiv'?'application/atom+xml,application/xml;q=0.9,*/*;q=0.1':'application/json','User-Agent':'BibliotecaLivre-QA/1.0'},signal:AbortSignal.timeout(15000)});
      const text=await r.text();
      last=`${r.status} ${text.slice(0,120).replace(/\s+/g,' ')}`;
      if(r.ok&&text.length>20){ok=true;break}
      if(![408,425,429,500,502,503,504].includes(r.status))break;
    }catch(e){last=e?.message||String(e)}
    await wait(1200*(i+1));
  }
  console.log(`${ok?'PASS':'FAIL'} ${name} — ${last}`);
  if(!ok)process.exitCode=1;
  await wait(name==='arXiv'?3200:700);
}
