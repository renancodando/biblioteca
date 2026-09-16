import{obterJSON,endereco}from'./comum.js';
const cacheUnpaywall=new Map();
export async function consultarUnpaywall(doi){
 const limpo=String(doi||'').replace(/^https?:\/\/doi\.org\//i,'').trim();
 if(!limpo)return null;
 if(cacheUnpaywall.has(limpo))return cacheUnpaywall.get(limpo);
 const u=new URL('/api/acervos-gratuitos',location.origin);
 u.searchParams.set('fonte','unpaywall');u.searchParams.set('q',limpo);
 try{
  const d=await obterJSON(u,3500,1);
  if(!d||typeof d.is_oa!=='boolean'){cacheUnpaywall.set(limpo,null);return null}
  const loc=d.best_oa_location||{};
  const oaUrl=endereco(loc.url_for_pdf)||endereco(loc.url)||endereco(loc.url_for_landing_page);
  const pdfUrl=endereco(loc.url_for_pdf);
  const res=d.is_oa&&oaUrl?{is_oa:true,oa_url:oaUrl,pdf_url:pdfUrl,licenca:loc.license||d.oa_status||'Acesso aberto verificado'}:{is_oa:false,oa_url:null,pdf_url:null,licenca:null};
  cacheUnpaywall.set(limpo,res);
  return res;
 }catch{
  cacheUnpaywall.set(limpo,null);
  return null;
 }
}

