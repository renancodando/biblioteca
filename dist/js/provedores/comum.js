export async function obterJSON(url,limite=14000,tentativas=3){
 let ultimoErro=null,u;
 try{u=url instanceof URL?url:new URL(url,location.href)}catch{u=null}
 const mesmoServidor=Boolean(u&&u.origin===location.origin),prazo=Math.min(Number(limite)||6000,mesmoServidor?6200:5800),maxTentativas=mesmoServidor?1:Math.min(Math.max(1,tentativas||1),2);
 for(let tentativa=0;tentativa<maxTentativas;tentativa++){
  const c=new AbortController(),t=setTimeout(()=>c.abort(),prazo);
  try{
   const r=await fetch(url,{signal:c.signal,headers:{Accept:'application/json'}});
   let d=null;try{d=await r.json()}catch{}
   if(r.ok)return d??{};
   const e=new Error(d?.erro||d?.error?.message||`Fonte respondeu ${r.status}`);e.status=r.status;e.codigo=d?.codigo;ultimoErro=e;
   if(![408,425,429,500,502,503,504].includes(r.status))throw e;
  }catch(e){
   ultimoErro=e;
   if(e?.name==='AbortError'||e?.name==='TimeoutError')break;
   if(e?.status&&![408,425,429,500,502,503,504].includes(e.status))throw e;
  }finally{clearTimeout(t)}
  if(tentativa<maxTentativas-1)await new Promise(r=>setTimeout(r,240+Math.floor(Math.random()*160)));
 }
 throw ultimoErro||new Error('Fonte temporariamente indisponível');
}
export function endereco(u){if(typeof u!=='string'||!u)return null;try{const p=new URL(u);return ['https:','http:'].includes(p.protocol)?p.href:null}catch{return null}}
export const idiomas=(v=[])=>[...new Set((Array.isArray(v)?v:[v]).map(i=>({por:'pt',Portuguese:'pt',portuguese:'pt',eng:'en',English:'en',english:'en',spa:'es',Spanish:'es',fre:'fr',French:'fr'})[i]||i))];
export const normalizarTexto=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’‘`´]/g,"'").replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
export const termosBusca=s=>normalizarTexto(s).split(' ').filter(x=>x.length>1);
export function consultaLimpa(s){return String(s||'').replace(/[\u2010-\u2015]/g,'-').replace(/\s+/g,' ').trim().slice(0,180)}
export function variantesBusca(s){
 const original=consultaLimpa(s),simples=original.replace(/[“”"'()[\]{}:;,.!?/\\|]+/g,' ').replace(/[-–—]+/g,' ').replace(/\s+/g,' ').trim();
 const semAcento=simples.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 return [...new Set([original,simples,semAcento].filter(Boolean))];
}
export function pontuarCorrespondencia(consulta,titulo='',autores=[]){
 const q=normalizarTexto(consulta),t=normalizarTexto(titulo),a=normalizarTexto((autores||[]).join(' '));if(!q)return 0;
 if(t===q)return 10000;if(t.startsWith(q)||q.startsWith(t))return 9000;if(t.includes(q))return 8500;
 const tq=termosBusca(q),tt=new Set(termosBusca(t)),ta=new Set(termosBusca(a));if(!tq.length)return 0;
 const noTitulo=tq.filter(x=>tt.has(x)).length/tq.length,noAutor=tq.filter(x=>ta.has(x)).length/tq.length;
 return Math.round(noTitulo*7000+noAutor*2500);
}
