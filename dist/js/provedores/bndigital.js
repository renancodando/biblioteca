import{obterJSON,consultaLimpa,pontuarCorrespondencia}from'./comum.js';
const limpar=v=>String(v||'').replace(/\s+/g,' ').trim(),BASE='https://acervobndigital.bn.gov.br/sophia/';
function absoluto(v){try{return new URL(v,BASE).href}catch{return null}}
function livrosDoHtml(html){
 const doc=new DOMParser().parseFromString(String(html||''),'text/html'),saida=[],vistos=new Set();
 const seletores='a[href*="codigo_sophia="],a[href*="codigo_obra="],a[href*="content=detalhe"]';
 for(const a of doc.querySelectorAll(seletores)){
  const href=absoluto(a.getAttribute('href')),titulo=limpar(a.textContent);if(!href||vistos.has(href)||titulo.length<3||/^(detalhes?|selecionar|refer[eê]ncia|marc|dublin core|jpg|htm|html)$/i.test(titulo))continue;
  let bloco=a;for(let i=0;i<5&&bloco?.parentElement;i++){bloco=bloco.parentElement;const t=limpar(bloco.textContent);if(t.length>titulo.length+20)break}
  const txt=limpar(bloco?.textContent||''),id=(href.match(/codigo_sophia=(\d+)/i)||href.match(/codigo_obra=(\d+)/i))?.[1]||href,autor=(txt.match(/(?:Autor(?:\/Criador)?|Autoria)\s*:?\s*([^|]{3,180})/i)?.[1]||'').replace(/\s{2,}/g,' ').trim(),ano=txt.match(/\b(1[5-9]\d{2}|20\d{2})\b/)?.[1]||'';
  vistos.add(href);saida.push({id:`bndigital:${id}`,fonte:'bndigital',provedor:'Biblioteca Nacional Digital',titulo,autores:autor?[autor]:[],idiomas:[],capa:null,descricao:[txt.slice(0,420),ano].filter(Boolean).join(' · '),acessoLivre:true,dominioPublico:false,tipoAcesso:'Acervo digital brasileiro de livre acesso',licenca:'Domínio público ou publicação autorizada pela Fundação Biblioteca Nacional.',origem:href,ler:href,texto:null,formatos:[]});
  if(saida.length>=20)break;
 }
 return saida;
}
export async function pesquisarBnDigital(q,o={}){
 const termo=consultaLimpa(q);if(!termo)return{livros:[],total:0,temMais:false};
 const pagina=Math.max(1,o.pagina||1),u=new URL('/api/bndigital',location.origin);u.searchParams.set('q',termo);u.searchParams.set('pagina',String(pagina));
 try{const d=await obterJSON(u,15000,2);if(d?.taxaLimite)return{livros:[],total:0,temMais:false};const livros=livrosDoHtml(d?.html);for(const l of livros)l.relevancia=pontuarCorrespondencia(termo,l.titulo,l.autores);livros.sort((a,b)=>(b.relevancia||0)-(a.relevancia||0));return{livros,total:Number(d?.total)||livros.length,temMais:Boolean(d?.temMais)}}catch{return{livros:[],total:0,temMais:false}}
}
