const CAMARA='https://dadosabertos.camara.leg.br/api/v2';
const DATAJUD='https://api-publica.datajud.cnj.jus.br';
const STF='https://portal.stf.jus.br';
const DIVULGA='https://divulgacandcontas.tse.jus.br/divulga/rest/v1';
const SENADO='https://www12.senado.leg.br/dados-abertos/legislativo/parlamentares';
const ELEICAO_2026='20322002026';
const PACOTES_TSE={
 candidatos:'https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2026.zip',
 propostas:'https://cdn.tse.jus.br/estatistica/sead/odsele/proposta_governo/proposta_governo_2026_BR.zip',
 certidoes:'https://cdn.tse.jus.br/estatistica/sead/odsele/certidao_criminal/certidao_criminal_2026_BR.zip'
};
const CANDIDATOS_2026=[
 {nome:'Augusto Cury',vice:'Júlio Delgado',partido:'Avante',aliases:['augusto jorge cury']},
 {nome:'Clariana Barão',vice:'Fabiana Torquato',partido:'DC',aliases:['clariana zacarkim barao','clariana barão']},
 {nome:'Edmilson Costa',vice:'Cleusa Santos',partido:'PCB',aliases:[]},
 {nome:'Flávio Bolsonaro',vice:'Alfredo Gaspar',partido:'PL',aliases:['flavio nantes bolsonaro']},
 {nome:'Hertz Dias',vice:'Vanessa Portugal',partido:'PSTU',aliases:['hertz da conceicao dias']},
 {nome:'Luiz Inácio Lula da Silva',vice:'Geraldo Alckmin',partido:'PT',aliases:['lula']},
 {nome:'Renan Santos',vice:'Aroldo Medina',partido:'Missão',aliases:['renan antonio ferreira dos santos','renan antônio ferreira dos santos']},
 {nome:'Ronaldo Caiado',vice:'Gilberto Kassab',partido:'PSD',aliases:[]},
 {nome:'Romeu Zema',vice:'Eduardo Girão',partido:'Novo',aliases:['romeu zema neto']},
 {nome:'Rui Costa Pimenta',vice:'Antônio Carlos',partido:'PCO',aliases:[]},
 {nome:'Samara Martins',vice:'Raquel Brício',partido:'UP',aliases:['samara martins da silva feitosa']},
 {nome:'Wilson Grassi',vice:'Suêd Haidar',partido:'Democrata',aliases:['wilson grassi junior']}
];
const DATAJUD_PUBLICA='cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==';
const tribunais=new Set(['stj','tse','tst','stm','trf1','trf2','trf3','trf4','trf5','trf6','tjac','tjal','tjam','tjap','tjba','tjce','tjdft','tjes','tjgo','tjma','tjmg','tjms','tjmt','tjpa','tjpb','tjpe','tjpi','tjpr','tjrj','tjrn','tjro','tjrr','tjrs','tjsc','tjse','tjsp','tjto']);
const limpar=v=>String(v||'').replace(/[<>\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim().slice(0,500);
const numero=v=>String(v||'').replace(/\D/g,'').slice(0,40);
const normalizar=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
async function json(url,opcoes={}){const r=await fetch(url,{...opcoes,headers:{Accept:'application/json',...(opcoes.headers||{})},signal:AbortSignal.timeout(10000)});if(!r.ok)throw new Error(String(r.status));return r.json()}
async function texto(url){const r=await fetch(url,{headers:{Accept:'text/html,application/xhtml+xml,application/xml,text/xml','User-Agent':'BibliotecaLivre/1.0 pesquisa-documental'},signal:AbortSignal.timeout(10000)});if(!r.ok)throw new Error(String(r.status));return r.text()}
function resposta(res,codigo,dados){res.setHeader('Cache-Control','s-maxage=180, stale-while-revalidate=600');return res.status(codigo).json(dados)}
function statusMovimentos(lista=[]){const nomes=lista.map(x=>String(x?.nome||'')).filter(Boolean);const ultimo=nomes.at(-1)||'';const encontrados=[];for(const n of nomes){if(/absolvi/i.test(n))encontrados.push({tipo:'absolvicao',texto:n});else if(/condena/i.test(n))encontrados.push({tipo:'condenacao',texto:n});else if(/arquiv/i.test(n))encontrados.push({tipo:'arquivamento',texto:n});else if(/anula|nulidade/i.test(n))encontrados.push({tipo:'anulacao',texto:n});else if(/transitado em julgado/i.test(n))encontrados.push({tipo:'transito',texto:n})}return{ultimo,encontrados:[...new Map(encontrados.map(x=>[x.tipo+'|'+x.texto,x])).values()].slice(-12)}}
function decodificar(v=''){return String(v).replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>')}
function semHtml(v=''){return decodificar(String(v).replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim())}
function urlStfParte(nome,tramite='sim'){return `${STF}/processos/listarPartes.asp?processosEmTramitacao=${tramite}&termo=${encodeURIComponent(nome)}&tipoPesquisa=PARTE`}
function extrairProcessosStf(html,tramite){const itens=[];const re=/<a\b[^>]*href=["']([^"']*listarProcessos\.asp\?[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;let m;while((m=re.exec(html))){try{const href=decodificar(m[1]);const u=new URL(href,STF);const classe=limpar(u.searchParams.get('classe')||'');const numeroProcesso=numero(u.searchParams.get('numeroProcesso')||'');if(!numeroProcesso)continue;const nome=semHtml(m[2])||`${classe} ${numeroProcesso}`.trim();itens.push({classe,numero:numeroProcesso,nome,tramite:tramite==='sim',url:u.href,inteiroTeor:`${STF}/jurisprudencia/pesquisarInteiroTeor.asp?numeroInteiroTeor=${numeroProcesso}`})}catch{}}return [...new Map(itens.map(x=>[`${x.classe}|${x.numero}`,x])).values()]}
function extrairPaginasStf(html,nome,tramite){const urls=[];const re=/href=["']([^"']*listarPartes\.asp\?[^"']+)["']/gi;let m;while((m=re.exec(html))&&urls.length<12){try{const u=new URL(decodificar(m[1]),STF);if((u.searchParams.get('tipoPesquisa')||'').toUpperCase()!=='PARTE')continue;const termo=(u.searchParams.get('termo')||'').toLocaleLowerCase('pt-BR');if(termo&&termo!==nome.toLocaleLowerCase('pt-BR'))continue;if((u.searchParams.get('processosEmTramitacao')||tramite)!==tramite)continue;if(!/[?&](pagina|page|pg|p)=/i.test(u.href))continue;urls.push(u.href)}catch{}}return [...new Set(urls)]}
async function consultarParteStf(nome){const conjuntos=[];for(const tramite of ['sim','nao']){const base=urlStfParte(nome,tramite);try{const h=await texto(base);let itens=extrairProcessosStf(h,tramite);const paginas=extrairPaginasStf(h,nome,tramite).slice(0,10);if(paginas.length){const extras=await Promise.allSettled(paginas.map(x=>texto(x)));for(const r of extras)if(r.status==='fulfilled')itens.push(...extrairProcessosStf(r.value,tramite))}conjuntos.push(...itens)}catch{}}
 const dados=[...new Map(conjuntos.map(x=>[`${x.classe}|${x.numero}`,x])).values()].sort((a,b)=>Number(b.numero)-Number(a.numero));
 return{dados,consultas:{emTramitacao:urlStfParte(nome,'sim'),encerrados:urlStfParte(nome,'nao')},aviso:'A lista automática depende do que a consulta pública do STF expõe pelo nome pesquisado. Processos sigilosos, homônimos e cadastros com grafias diferentes podem não aparecer.'}}
function tipoClasseStf(classe=''){const c=normalizar(classe);if(c==='inq'||c.includes('inquerito'))return'inquerito';if(c==='ap'||c.includes('acao penal'))return'acao-penal';if(c==='pet'||c.includes('peticao'))return'peticao';return'outro'}
function resumirJudicial(dados=[]){const tipos=dados.map(x=>tipoClasseStf(x.classe));return{processosPublicosLocalizados:dados.length,emTramitacao:dados.filter(x=>x.tramite).length,encerrados:dados.filter(x=>!x.tramite).length,inqueritos:tipos.filter(x=>x==='inquerito').length,acoesPenais:tipos.filter(x=>x==='acao-penal').length,condenacoesConfirmadas:null,absolvicoesConfirmadas:null,arquivamentosOuAnulacoesConfirmados:null,cobertura:'Contagem automática limitada à consulta pública por nome do STF. Condenação, absolvição, arquivamento ou anulação só são contabilizados quando uma decisão/movimentação oficial específica for lida; a classe do processo não prova culpa.'}}
async function consultarProcessoStf(classe,numeroProcesso){const url=`${STF}/processos/listarProcessos.asp?classe=${encodeURIComponent(classe)}&numeroProcesso=${encodeURIComponent(numeroProcesso)}`;const h=await texto(url);const puro=semHtml(h);const marcadores=[];for(const [tipo,re] of [['condenacao',/condena(?:do|ção|cao)/i],['absolvicao',/absolvi(?:do|ção|cao)/i],['arquivamento',/arquiv(?:ado|amento)/i],['anulacao',/anula(?:do|ção|cao)|nulidade/i],['transito',/tr[aâ]nsit(?:ou|ado) em julgado/i]]){const m=puro.match(re);if(m)marcadores.push({tipo,trecho:puro.slice(Math.max(0,m.index-180),Math.min(puro.length,m.index+360))})}return{url,marcadores,texto:puro.slice(0,12000)}}
function lerCampo(obj,chaves=[]){for(const k of chaves)if(obj&&obj[k]!=null&&String(obj[k]).trim())return obj[k];return''}
function mapearCandidatoTse(x={}){const partido=x.partido||{};const vice=x.vice||x.candidatoVice||x.vicePresidente||{};return{
 id:String(lerCampo(x,['id','idCandidato','sqCandidato','sequencial','sequencialCandidato'])||''),
 nome:limpar(lerCampo(x,['nomeUrna','nomeCompleto','nome','nomeCandidato'])||''),
 nomeCompleto:limpar(lerCampo(x,['nomeCompleto','nome','nomeUrna'])||''),
 numero:limpar(lerCampo(x,['numero','numeroCandidato','numeroUrna'])||''),
 partido:limpar(lerCampo(partido,['sigla','siglaPartido'])||lerCampo(x,['siglaPartido','partido'])||''),
 situacao:limpar(lerCampo(x,['descricaoSituacao','situacao','descricaoSituacaoCandidato','situacaoCandidato'])||''),
 vice:limpar(lerCampo(vice,['nomeUrna','nomeCompleto','nome'])||lerCampo(x,['nomeVice','vice'])||''),
 foto:limpar(lerCampo(x,['urlFoto','fotoUrl','foto'])||'')
}}
async function listarCandidatosTse2026(){const u=`${DIVULGA}/candidatura/listar/2026/BR/${ELEICAO_2026}/1/candidatos`;const d=await json(u);const lista=Array.isArray(d)?d:(d.candidatos||d.dados||[]);return lista.map(mapearCandidatoTse).filter(x=>x.nome)}
function aliasesDo(c){return [c.nome,...(c.aliases||[])].map(normalizar)}
function combinarCandidatos2026(live=[]){return CANDIDATOS_2026.map(base=>{const nomes=aliasesDo(base);const atual=live.find(x=>{const n1=normalizar(x.nome),n2=normalizar(x.nomeCompleto);return nomes.some(a=>a===n1||a===n2||n1.includes(a)||n2.includes(a)||a.includes(n1)||a.includes(n2))})||null;return{...base,id:atual?.id||'',nomeCompleto:atual?.nomeCompleto||base.nome,numero:atual?.numero||'',situacao:atual?.situacao||'Registro validado pelo TSE em 11/09/2026',foto:atual?.foto||'',fonteAtual:atual?'DivulgaCandContas/TSE em tempo real':'Lista oficial consolidada pelo TSE em 11/09/2026'}})}
function registrosExtras(live=[]){return live.filter(x=>!CANDIDATOS_2026.some(c=>aliasesDo(c).some(a=>{const n=normalizar(x.nome+' '+x.nomeCompleto);return n.includes(a)||a.includes(normalizar(x.nome))}))).map(x=>({...x,classificacao:/indefer|cancel|renunci|falec/i.test(x.situacao)?'fora-da-disputa':'em-analise'}))}
function coletarDocumentos(obj){const out=[];const vistos=new Set();function add(tipo,nome,url){if(!url||vistos.has(url))return;vistos.add(url);out.push({tipo,nome:limpar(nome||tipo||'Documento'),url})}function andar(v,chave='',pai=''){if(v==null)return;if(typeof v==='string'){const s=v.trim();if(/^https?:\/\//i.test(s)&&(/\.pdf(?:$|\?)/i.test(s)||/\/arquivo\//i.test(s))){const ctx=(chave+' '+pai).toLowerCase();add(/propost|plano|programa/.test(ctx)?'proposta':/certid/.test(ctx)?'certidao':'documento',chave||pai||'Documento',s)}return}if(Array.isArray(v)){v.forEach(x=>andar(x,chave,pai));return}if(typeof v==='object'){const chaves=Object.keys(v);const ctx=(chave+' '+pai+' '+chaves.join(' ')).toLowerCase();for(const k of chaves){const val=v[k];if(typeof val==='string'&&/^https?:\/\//i.test(val)&&(/\.pdf(?:$|\?)/i.test(val)||/\/arquivo\//i.test(val)))add(/propost|plano|programa/.test(ctx+' '+k)?'proposta':/certid/.test(ctx+' '+k)?'certidao':'documento',k,val);if(/^(id|codigo).*(arquivo|document)/i.test(k)&&/^\d{5,}$/.test(String(val))){const tipo=/propost|plano|programa/.test(ctx)?'proposta':/certid/.test(ctx)?'certidao':'documento';add(tipo,k,`https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/doc/${val}`)}andar(val,k,ctx)}}}andar(obj);return out.slice(0,100)}
async function detalheCandidatoTse(id){if(!id)return null;return json(`${DIVULGA}/candidatura/buscar/2026/BR/${ELEICAO_2026}/candidato/${encodeURIComponent(id)}`)}
async function prestacaoCandidatoTse(id){if(!id)return null;return json(`${DIVULGA}/prestador/consulta/${ELEICAO_2026}/2026/BR/1/90/90/${encodeURIComponent(id)}`)}
function valorNumero(v){if(typeof v==='number'&&Number.isFinite(v))return v;if(typeof v!=='string')return null;let s=v.trim();if(!/[0-9]/.test(s))return null;s=s.replace(/R\$\s*/gi,'').replace(/\s/g,'');if(/^[-+]?\d{1,3}(\.\d{3})+,\d+$/.test(s))s=s.replace(/\./g,'').replace(',','.');else if(/^[-+]?\d+,\d+$/.test(s))s=s.replace(',','.');else s=s.replace(/[^0-9.-]/g,'');const n=Number(s);return Number.isFinite(n)?n:null}
function extrairBens(detalhe){const lista=Array.isArray(detalhe?.bens)?detalhe.bens:[];return lista.map((x,i)=>({id:String(lerCampo(x,['id','sequencial','codigo'])||i+1),tipo:limpar(lerCampo(x,['descricaoDeTipoDeBem','descricaoTipoBem','tipoBem','tipo'])||'Bem declarado'),descricao:limpar(lerCampo(x,['descricao','descricaoBem','bem'])||''),valor:valorNumero(lerCampo(x,['valor','valorBem','valorDeclarado']))})).filter(x=>x.descricao||x.valor!=null)}
function achatarEscalares(obj,prefixo='',saida=[]){if(saida.length>500||obj==null)return saida;if(Array.isArray(obj)){obj.slice(0,50).forEach((v,i)=>achatarEscalares(v,`${prefixo}[${i}]`,saida));return saida}if(typeof obj==='object'){for(const [k,v] of Object.entries(obj)){if(saida.length>500)break;achatarEscalares(v,prefixo?`${prefixo}.${k}`:k,saida)}return saida}saida.push({caminho:prefixo,valor:obj});return saida}
function resumirPrestacao(obj){if(!obj)return{disponivel:false,valores:[]};const campos=achatarEscalares(obj).filter(x=>/(receit|despes|gasto|arrecad|recurso|fundo|fefc|doa)/i.test(x.caminho)).map(x=>({...x,numero:valorNumero(x.valor)})).filter(x=>x.numero!=null);const unicos=[...new Map(campos.map(x=>[normalizar(x.caminho),x])).values()].slice(0,40);const achar=re=>unicos.find(x=>re.test(normalizar(x.caminho)))?.numero??null;return{disponivel:true,totalReceitas:achar(/total.*receit|receit.*total|total.*arrecad|arrecad.*total/),totalDespesas:achar(/total.*despes|despes.*total|total.*gasto|gasto.*total/),fundoEleitoral:achar(/fefc|fundo.*eleitoral/),fundoPartidario:achar(/fundo.*partid/),recursosProprios:achar(/recurso.*propri/),valores:unicos}}
function eventosRegistro(detalhe){const campos=achatarEscalares(detalhe).filter(x=>/data/i.test(x.caminho)&&/(registro|situacao|julg|pedido|convenc|entrega|atualiz|defer)/i.test(x.caminho));return campos.slice(0,30).map(x=>({evento:limpar(x.caminho.split('.').at(-1)?.replace(/([a-z])([A-Z])/g,'$1 $2')||'Data'),data:limpar(x.valor)}))}
function nomesCompativeis(a,b){const na=normalizar(a),nb=normalizar(b);if(!na||!nb)return false;if(na===nb||na.includes(nb)||nb.includes(na))return true;const ta=na.split(' ').filter(x=>x.length>2),tb=nb.split(' ').filter(x=>x.length>2);return ta.length>=2&&tb.length>=2&&ta[0]===tb[0]&&ta.at(-1)===tb.at(-1)}
async function buscarTrajetoriaCamara(nome){const legislaturas=[57,56,55,54,53,52,51,50,49,48];const buscas=await Promise.allSettled(legislaturas.map(id=>json(`${CAMARA}/deputados?nome=${encodeURIComponent(nome)}&idLegislatura=${id}&itens=100`)));const candidatos=[];for(const r of buscas)if(r.status==='fulfilled')for(const d of r.value.dados||[])if(nomesCompativeis(nome,d.nome))candidatos.push(d);const unicos=[...new Map(candidatos.map(x=>[String(x.id),x])).values()].slice(0,4);const detalhes=[];for(const dep of unicos){const [perfil,proposicoes,discursos,historico]=await Promise.all([json(`${CAMARA}/deputados/${dep.id}`).catch(()=>({dados:null})),json(`${CAMARA}/proposicoes?idDeputadoAutor=${dep.id}&itens=30&ordem=DESC&ordenarPor=id`).catch(()=>({dados:[]})),json(`${CAMARA}/deputados/${dep.id}/discursos?itens=20&ordem=DESC&ordenarPor=dataHoraInicio`).catch(()=>({dados:[]})),json(`${CAMARA}/deputados/${dep.id}/historico`).catch(()=>({dados:[]}))]);detalhes.push({id:dep.id,nome:dep.nome,perfil:perfil.dados||dep,proposicoes:proposicoes.dados||[],discursos:discursos.dados||[],historico:historico.dados||[]})}return detalhes}
async function votosTemaCamara(idDeputado,q){const u=new URL(CAMARA+'/proposicoes');u.searchParams.set('keywords',q);u.searchParams.set('itens','6');u.searchParams.set('ordem','DESC');u.searchParams.set('ordenarPor','id');const props=(await json(u)).dados||[];const resultados=[];for(const p of props){const votacoes=(await json(`${CAMARA}/proposicoes/${p.id}/votacoes`).catch(()=>({dados:[]}))).dados||[];for(const v of votacoes.slice(-2)){const votos=(await json(`${CAMARA}/votacoes/${encodeURIComponent(v.id)}/votos`).catch(()=>({dados:[]}))).dados||[];const voto=votos.find(x=>String(x.deputado_?.id||x.deputado?.id||x.idDeputado||'')===String(idDeputado));if(voto)resultados.push({proposicao:{id:p.id,siglaTipo:p.siglaTipo,numero:p.numero,ano:p.ano,ementa:p.ementa,uri:p.uri},votacao:{id:v.id,data:v.data,hora:v.hora,descricao:v.descricao,resultado:v.ultimaAberturaVotacao?.descricao||v.aprovacao||''},voto:limpar(voto.tipoVoto||v.voto||voto.descricaoVoto||'')})}}return resultados.slice(0,12)}
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
   const [perfil,despesas,proposicoes]=await Promise.all([json(`${CAMARA}/deputados/${id}`),json(`${CAMARA}/deputados/${id}/despesas?ano=${ano}&itens=20&ordem=DESC&ordenarPor=mes`).catch(()=>({dados:[]})),json(`${CAMARA}/proposicoes?idDeputadoAutor=${id}&itens=20&ordem=DESC&ordenarPor=id`).catch(()=>({dados:[]}))]);
   return resposta(res,200,{ok:true,fonte:'Câmara dos Deputados · Dados Abertos',ano,perfil:perfil.dados||null,despesas:despesas.dados||[],proposicoes:proposicoes.dados||[]});
  }
  if(modo==='proposicoes'){
   const q=limpar(req.query.q);if(!q)return resposta(res,400,{erro:'Informe um tema, número ou termo.'});
   const u=new URL(CAMARA+'/proposicoes');u.searchParams.set('keywords',q);u.searchParams.set('itens','40');u.searchParams.set('ordem','DESC');u.searchParams.set('ordenarPor','id');
   const d=await json(u);return resposta(res,200,{ok:true,fonte:'Câmara dos Deputados · Dados Abertos',dados:d.dados||[]});
  }
  if(modo==='proposicao'){
   const id=numero(req.query.id);if(!id)return resposta(res,400,{erro:'ID inválido.'});
   const [detalhe,autores,tramites]=await Promise.all([json(`${CAMARA}/proposicoes/${id}`),json(`${CAMARA}/proposicoes/${id}/autores`).catch(()=>({dados:[]})),json(`${CAMARA}/proposicoes/${id}/tramitacoes`).catch(()=>({dados:[]}))]);
   return resposta(res,200,{ok:true,fonte:'Câmara dos Deputados · Dados Abertos',detalhe:detalhe.dados||null,autores:autores.dados||[],tramitacoes:tramites.dados||[]});
  }
  if(modo==='eleicoes2026'){
   let live=[];try{live=await listarCandidatosTse2026()}catch{}
   return resposta(res,200,{ok:true,fonte:'TSE · DivulgaCandContas e Dados Abertos',atualizadoEm:new Date().toISOString(),dados:combinarCandidatos2026(live).sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR')),outrosRegistros:registrosExtras(live),pacotes:PACOTES_TSE,divulga:'https://divulgacandcontas.tse.jus.br/?sck=direto',nota:'A lista principal contém as 12 chapas cujo registro foi validado pelo TSE até 11/09/2026. Registros adicionais retornados ao vivo pelo DivulgaCandContas aparecem separadamente, com a situação informada pela Justiça Eleitoral.'});
  }
  if(modo==='eleicoes2026-detalhe'){
   const nome=limpar(req.query.nome);if(!nome)return resposta(res,400,{erro:'Informe o nome do candidato.'});
   let live=[];try{live=await listarCandidatosTse2026()}catch{}
   const todos=combinarCandidatos2026(live);const base=todos.find(x=>normalizar(x.nome)===normalizar(nome)||normalizar(x.nome).includes(normalizar(nome))||normalizar(nome).includes(normalizar(x.nome)));
   if(!base)return resposta(res,404,{erro:'Candidatura não localizada na lista presidencial validada.'});
   let detalhe=null,documentos=[],prestacao=null;try{detalhe=await detalheCandidatoTse(base.id);documentos=coletarDocumentos(detalhe)}catch{}try{prestacao=await prestacaoCandidatoTse(base.id)}catch{}
   const propostas=documentos.filter(x=>x.tipo==='proposta');const certidoes=documentos.filter(x=>x.tipo==='certidao');const bens=extrairBens(detalhe);const totalBens=bens.reduce((s,x)=>s+(x.valor||0),0);
   return resposta(res,200,{ok:true,fonte:'TSE · DivulgaCandContas',candidato:{...base,nomeCompleto:limpar(lerCampo(detalhe,['nomeCompleto','nome'])||base.nomeCompleto||base.nome)},documentos,propostas,certidoes,bens,totalBens,financas:resumirPrestacao(prestacao),eventosRegistro:eventosRegistro(detalhe),pacotes:PACOTES_TSE,fichaApi:base.id?`${DIVULGA}/candidatura/buscar/2026/BR/${ELEICAO_2026}/candidato/${base.id}`:'',divulga:'https://divulgacandcontas.tse.jus.br/?sck=direto',aviso:'Bens, contas e documentos são exibidos conforme os dados públicos devolvidos pelo TSE. Ausência de um campo na resposta automática não significa ausência do dado na Justiça Eleitoral; a ficha oficial permanece como fonte de conferência.'});
  }
  if(modo==='historico-judicial'){
   const nome=limpar(req.query.nome);if(nome.length<4)return resposta(res,400,{erro:'Informe o nome completo da pessoa.'});
   const d=await consultarParteStf(nome);return resposta(res,200,{ok:true,fonte:'STF · Consulta Processual Pública',resumo:resumirJudicial(d.dados),...d,outrasFontes:[{nome:'CNJ · DataJud API Pública',url:'https://www.cnj.jus.br/sistemas/datajud/api-publica/',nota:'A API pública permite consulta por número processual e protege dados das partes; não é usada aqui para varrer pessoas físicas por nome.'},{nome:'TSE · DivulgaCandContas',url:'https://divulgacandcontas.tse.jus.br/?sck=direto',nota:'Certidões criminais apresentadas no registro eleitoral ficam na documentação da candidatura.'}]});
  }
  if(modo==='stf-parte'){
   const nome=limpar(req.query.nome);if(nome.length<4)return resposta(res,400,{erro:'Informe o nome completo da pessoa.'});
   const d=await consultarParteStf(nome);return resposta(res,200,{ok:true,fonte:'STF · Consulta Processual Pública',...d});
  }
  if(modo==='stf-processo-detalhe'){
   const classe=limpar(req.query.classe),n=numero(req.query.numero);if(!classe||!n)return resposta(res,400,{erro:'Informe classe e número do processo.'});
   const d=await consultarProcessoStf(classe,n);return resposta(res,200,{ok:true,fonte:'STF · Consulta Processual Pública',...d,aviso:'Marcadores textuais não substituem a leitura da decisão. Um termo como condenação ou anulação pode aparecer em contexto histórico ou em decisão de outra fase; confira o inteiro teor.'});
  }
  if(modo==='trajetoria-legislativa'){
   const nome=limpar(req.query.nome);if(nome.length<4)return resposta(res,400,{erro:'Informe o nome.'});
   const camara=await buscarTrajetoriaCamara(nome).catch(()=>[]);
   return resposta(res,200,{ok:true,fonte:'Câmara dos Deputados e Senado Federal · Dados Abertos',camara,senado:{catalogo:SENADO,votacoes:'https://www12.senado.leg.br/dados-abertos/legislativo/parlamentares/senadores-em-exercicio/info/webservice-de-votacoes-do-senador',nota:'O Senado possui webservices de histórico, autorias, relatorias e votações. Quando o código parlamentar não é resolvido automaticamente com segurança, a Biblioteca não vincula registros por simples semelhança de nome.'}});
  }
  if(modo==='votos-tema'){
   const id=numero(req.query.id),q=limpar(req.query.q);if(!id||q.length<3)return resposta(res,400,{erro:'Informe deputado e tema.'});
   const dados=await votosTemaCamara(id,q);return resposta(res,200,{ok:true,fonte:'Câmara dos Deputados · Dados Abertos',dados,aviso:'São votações de proposições localizadas pelo mesmo tema/palavra-chave. Isso não significa que a proposição votada seja idêntica à promessa eleitoral; os documentos são mostrados lado a lado para conferência.'});
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
