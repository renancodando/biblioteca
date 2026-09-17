const CAMARA='https://dadosabertos.camara.leg.br/api/v2';
const DATAJUD='https://api-publica.datajud.cnj.jus.br';
const STF='https://portal.stf.jus.br';
const DATAJUD_PUBLICA='cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==';
const tribunais=new Set(['stj','tse','tst','stm','trf1','trf2','trf3','trf4','trf5','trf6','tjac','tjal','tjam','tjap','tjba','tjce','tjdft','tjes','tjgo','tjma','tjmg','tjms','tjmt','tjpa','tjpb','tjpe','tjpi','tjpr','tjrj','tjrn','tjro','tjrr','tjrs','tjsc','tjse','tjsp','tjto']);
const limpar=v=>String(v||'').replace(/[<>\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim().slice(0,180);
const numero=v=>String(v||'').replace(/\D/g,'').slice(0,40);
async function json(url,opcoes={}){const r=await fetch(url,{...opcoes,headers:{Accept:'application/json',...(opcoes.headers||{})},signal:AbortSignal.timeout(9000)});if(!r.ok)throw new Error(String(r.status));return r.json()}
async function texto(url){const r=await fetch(url,{headers:{Accept:'text/html,application/xhtml+xml','User-Agent':'BibliotecaLivre/1.0 pesquisa-documental'},signal:AbortSignal.timeout(9000)});if(!r.ok)throw new Error(String(r.status));return r.text()}
function resposta(res,codigo,dados){res.setHeader('Cache-Control','s-maxage=180, stale-while-revalidate=600');return res.status(codigo).json(dados)}
function statusMovimentos(lista=[]){const nomes=lista.map(x=>String(x?.nome||'')).filter(Boolean);const ultimo=nomes.at(-1)||'';const encontrados=[];for(const n of nomes){if(/absolvi/i.test(n))encontrados.push({tipo:'absolvicao',texto:n});else if(/condena/i.test(n))encontrados.push({tipo:'condenacao',texto:n});else if(/arquiv/i.test(n))encontrados.push({tipo:'arquivamento',texto:n});else if(/transitado em julgado/i.test(n))encontrados.push({tipo:'transito',texto:n})}return{ultimo,encontrados:[...new Map(encontrados.map(x=>[x.tipo+'|'+x.texto,x])).values()].slice(-8)}}
function decodificar(v=''){return String(v).replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>')}
function semHtml(v=''){return decodificar(String(v).replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim())}
function urlStfParte(nome,tramite='sim'){return `${STF}/processos/listarPartes.asp?processosEmTramitacao=${tramite}&termo=${encodeURIComponent(nome)}&tipoPesquisa=PARTE`}
function extrairProcessosStf(html,tramite){const itens=[];const re=/<a\b[^>]*href=["']([^"']*listarProcessos\.asp\?[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;let m;while((m=re.exec(html))){try{const href=decodificar(m[1]);const u=new URL(href,STF);const classe=limpar(u.searchParams.get('classe')||'');const numeroProcesso=numero(u.searchParams.get('numeroProcesso')||'');if(!numeroProcesso)continue;const nome=semHtml(m[2])||`${classe} ${numeroProcesso}`.trim();itens.push({classe,numero:numeroProcesso,nome,tramite:tramite==='sim',url:u.href,inteiroTeor:`${STF}/jurisprudencia/pesquisarInteiroTeor.asp?numeroInteiroTeor=${numeroProcesso}`})}catch{}}return [...new Map(itens.map(x=>[`${x.classe}|${x.numero}`,x])).values()]}
function extrairPaginasStf(html,nome,tramite){const urls=[];const re=/href=["']([^"']*listarPartes\.asp\?[^"']+)["']/gi;let m;while((m=re.exec(html))&&urls.length<10){try{const u=new URL(decodificar(m[1]),STF);if((u.searchParams.get('tipoPesquisa')||'').toUpperCase()!=='PARTE')continue;const termo=(u.searchParams.get('termo')||'').toLocaleLowerCase('pt-BR');if(termo&&termo!==nome.toLocaleLowerCase('pt-BR'))continue;if((u.searchParams.get('processosEmTramitacao')||tramite)!==tramite)continue;if(!/[?&](pagina|page|pg|p)=/i.test(u.href))continue;urls.push(u.href)}catch{}}return [...new Set(urls)]}
async function consultarParteStf(nome){const conjuntos=[];for(const tramite of ['sim','nao']){const base=urlStfParte(nome,tramite);try{const h=await texto(base);let itens=extrairProcessosStf(h,tramite);const paginas=extrairPaginasStf(h,nome,tramite).slice(0,8);if(paginas.length){const extras=await Promise.allSettled(paginas.map(x=>texto(x)));for(const r of extras)if(r.status==='fulfilled')itens.push(...extrairProcessosStf(r.value,tramite))}conjuntos.push(...itens)}catch{}}
 const dados=[...new Map(conjuntos.map(x=>[`${x.classe}|${x.numero}`,x])).values()].sort((a,b)=>Number(b.numero)-Number(a.numero));
 return{dados,consultas:{emTramitacao:urlStfParte(nome,'sim'),encerrados:urlStfParte(nome,'nao')},aviso:'A lista automática depende do que a consulta pública do STF expõe pelo nome pesquisado. Processos sigilosos, homônimos e cadastros com grafias diferentes podem não aparecer.'}}
export default async function handler(req,res){
 if(req.method!=='GET')return resposta(res,405,{erro:'Método não permitido.'});
 const modo=limpar(req.query.modo);
 try{
  if(modo==='deputados'){
   const nome=limpar(req.query.nome);if(!nome)return resposta(res,400,{erro:'Informe um nome.'});
   const u=new URL(CAMARA+'/deputados');u.searchParams.set('nome',nome);u.searchParams.set('ordem','ASC');u.searchParams.set('ordenarPor','nome');u.searchParams.set('itens','30');
   const d=await json(u);return resposta(res,200,{ok:true,fonte:'Câmara dos Deputados · Dados Abertos',dados:d.dados||[]});
  }
  if(modo==='deputado'){
   const id=numero(req.query.id);if(!id)return resposta(res,400,{erro:'ID inválido.'});
   const ano=new Date().getFullYear();
   const [perfil,despesas,proposicoes]=await Promise.all([
    json(`${CAMARA}/deputados/${id}`),
    json(`${CAMARA}/deputados/${id}/despesas?ano=${ano}&itens=20&ordem=DESC&ordenarPor=mes`).catch(()=>({dados:[]})),
    json(`${CAMARA}/proposicoes?idDeputadoAutor=${id}&itens=20&ordem=DESC&ordenarPor=id`).catch(()=>({dados:[]}))
   ]);
   return resposta(res,200,{ok:true,fonte:'Câmara dos Deputados · Dados Abertos',ano,perfil:perfil.dados||null,despesas:despesas.dados||[],proposicoes:proposicoes.dados||[]});
  }
  if(modo==='proposicoes'){
   const q=limpar(req.query.q);if(!q)return resposta(res,400,{erro:'Informe um tema, número ou termo.'});
   const u=new URL(CAMARA+'/proposicoes');u.searchParams.set('keywords',q);u.searchParams.set('itens','40');u.searchParams.set('ordem','DESC');u.searchParams.set('ordenarPor','id');
   const d=await json(u);return resposta(res,200,{ok:true,fonte:'Câmara dos Deputados · Dados Abertos',dados:d.dados||[]});
  }
  if(modo==='proposicao'){
   const id=numero(req.query.id);if(!id)return resposta(res,400,{erro:'ID inválido.'});
   const [detalhe,autores,tramites]=await Promise.all([
    json(`${CAMARA}/proposicoes/${id}`),
    json(`${CAMARA}/proposicoes/${id}/autores`).catch(()=>({dados:[]})),
    json(`${CAMARA}/proposicoes/${id}/tramitacoes`).catch(()=>({dados:[]}))
   ]);
   return resposta(res,200,{ok:true,fonte:'Câmara dos Deputados · Dados Abertos',detalhe:detalhe.dados||null,autores:autores.dados||[],tramitacoes:tramites.dados||[]});
  }
  if(modo==='stf-parte'){
   const nome=limpar(req.query.nome);if(nome.length<4)return resposta(res,400,{erro:'Informe o nome completo da pessoa.'});
   const d=await consultarParteStf(nome);return resposta(res,200,{ok:true,fonte:'STF · Consulta Processual Pública',...d});
  }
  if(modo==='processo'){
   const t=limpar(req.query.tribunal).toLowerCase(),n=numero(req.query.numero);if(!tribunais.has(t)||!n)return resposta(res,400,{erro:'Informe tribunal e número CNJ válidos.'});
   const chave=process.env.DATAJUD_API_KEY||DATAJUD_PUBLICA;
   const d=await json(`${DATAJUD}/api_publica_${t}/_search`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`APIKey ${chave}`},body:JSON.stringify({size:10,query:{match:{numeroProcesso:n}}})});
   const itens=(d?.hits?.hits||[]).map(x=>{const s=x._source||{};return{tribunal:s.tribunal||t.toUpperCase(),numeroProcesso:s.numeroProcesso||n,dataAjuizamento:s.dataAjuizamento||null,grau:s.grau||'',classe:s.classe||null,assuntos:s.assuntos||[],orgaoJulgador:s.orgaoJulgador||null,movimentos:s.movimentos||[],indicadores:statusMovimentos(s.movimentos||[])}});
   return resposta(res,200,{ok:true,fonte:'CNJ · DataJud API Pública',dados:itens,aviso:'Os metadados processuais não provam, por si só, a prática de crime. A interpretação depende do processo e da situação jurídica registrada.'});
  }
  return resposta(res,400,{erro:'Modo inválido.'});
 }catch(e){return resposta(res,502,{erro:'A fonte oficial não respondeu nesta tentativa.',detalhe:String(e?.message||'')})}
}
