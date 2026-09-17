const $ = (s, r = document) => r.querySelector(s);
const A = v => Array.isArray(v) ? v : v == null ? [] : [v];
const semAcento = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const escapar = (v = '') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const linkSeguro = u => {
  if (typeof u !== 'string' || !u.trim()) return '';
  try {
    const x = new URL(u, location.origin);
    return ['http:', 'https:'].includes(x.protocol) ? x.href : '';
  } catch {
    return '';
  }
};

const estado = { catalogo: null, consulta: '', resultados: [], fontes: {}, buscando: false, token: 0 };

const traducoes = [
  ['matematica basica','basic mathematics'],['aritmetica','arithmetic'],['fracao','fractions'],
  ['porcentagem','percentages'],['razao e proporcao','ratios proportions'],['pre-algebra','prealgebra'],
  ['pre algebra','prealgebra'],['algebra linear','linear algebra'],['algebra abstrata','abstract algebra'],
  ['algebra','algebra'],['equacoes diferenciais','differential equations'],['equacao diferencial','differential equations'],
  ['equacoes','equations'],['geometria analitica','analytic geometry'],['geometria diferencial','differential geometry'],
  ['geometria','geometry'],['trigonometria','trigonometry'],['pre-calculo','precalculus'],
  ['pre calculo','precalculus'],['calculo iii','multivariable calculus'],['calculo 3','multivariable calculus'],
  ['calculo ii','integral calculus series'],['calculo 2','integral calculus series'],
  ['calculo i','differential integral calculus'],['calculo 1','differential integral calculus'],
  ['calculo','calculus'],['probabilidade','probability'],['estatistica','statistics'],
  ['matematica discreta','discrete mathematics'],['logica matematica','mathematical logic'],
  ['teoria dos conjuntos','set theory'],['demonstracoes','mathematical proofs'],['combinatoria','combinatorics'],
  ['teoria dos grafos','graph theory'],['teoria dos numeros','number theory'],['analise real','real analysis'],
  ['analise complexa','complex analysis'],['topologia','topology'],['metodos numericos','numerical analysis'],
  ['otimizacao','optimization'],['pesquisa operacional','operations research'],['sistemas dinamicos','dynamical systems'],
  ['matematica financeira','financial mathematics'],['teoria dos jogos','game theory'],['criptografia','cryptography'],
  ['matematica para computacao','discrete mathematics computer science'],['matematica aplicada','applied mathematics']
];

function termoApi(q) {
  const n = semAcento(q);
  for (const [a, b] of traducoes) if (n.includes(a)) return b;
  return q;
}

async function carregarCatalogo() {
  if (estado.catalogo) return estado.catalogo;
  const r = await fetch('/dados/matematica.json?v=20260917m1', { headers: { Accept: 'application/json' }, cache: 'no-store' });
  if (!r.ok) throw new Error('catalogo');
  estado.catalogo = await r.json();
  return estado.catalogo;
}

function fecharOutros() {
  for (const d of document.querySelectorAll('dialog[open]')) {
    if (d.id !== 'matematica') {
      try { d.close(); } catch {}
    }
  }
}

async function abrirMatematica() {
  const d = $('#matematica');
  if (!d) return;
  fecharOutros();
  try {
    if (!d.open) d.showModal();
  } catch {
    d.setAttribute('open', '');
  }
  try {
    await carregarCatalogo();
    renderTopicos();
  } catch {}
  render();
  setTimeout(() => $('#campo-matematica')?.focus(), 30);
}

function renderTopicos() {
  const area = $('#topicos-matematica');
  if (!area || !estado.catalogo) return;
  area.innerHTML = A(estado.catalogo.topicos).map(t =>
    `<button type="button" data-topico-mat="${escapar(t)}">${escapar(t)}</button>`
  ).join('');
}

function locais(q) {
  const itens = A(estado.catalogo?.materiais);
  const n = semAcento(q);
  const generico = !n || ['matematica','livro de matematica','apostila de matematica','curso de matematica'].includes(n);
  return itens.filter(x => {
    if (generico) return true;
    const texto = semAcento([x.titulo, x.descricao, x.nivel, ...A(x.topicos)].join(' '));
    const partes = n.split(/\s+/).filter(Boolean);
    return texto.includes(n) || partes.every(p => texto.includes(p));
  }).map(x => ({
    ...x,
    origem: 'curado',
    provedor: x.fonte || 'Acervo curado',
    url: linkSeguro(x.url),
    peso: 0
  }));
}

function mapearOpenTextbook(d) {
  const lista = Array.isArray(d) ? d : A(d?.data || d?.textbooks || d?.results);
  return lista.slice(0, 40).map(x => {
    const titulo = String(x?.title || x?.name || '').trim();
    if (!titulo) return null;
    const id = x?.id || titulo;
    const url = linkSeguro(x?.url || x?.web_url || x?.book_url || `https://open.umn.edu/opentextbooks/textbooks/${encodeURIComponent(id)}`);
    if (!url) return null;
    const descricao = String(x?.description || x?.abstract || x?.short_description || 'Livro-texto aberto disponível na Open Textbook Library.')
      .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 360);
    return { id:`otl:${id}`, titulo, descricao, tipo:'Livro-texto completo · OER', nivel:'Superior', topicos:[], origem:'opentextbook', provedor:'Open Textbook Library', url, peso:10 };
  }).filter(Boolean);
}

function mapearOpenStax(d, q) {
  const lista = [d?.items, d?.results, d?.books, d].find(Array.isArray) || [];
  const termos = semAcento(termoApi(q)).split(/\s+/).filter(x => x.length > 2);
  const saida = [];
  for (const x of lista) {
    const titulo = String(x?.title || x?.name || '').trim();
    const texto = semAcento(`${titulo} ${x?.description || ''} ${A(x?.subjects).join(' ')}`);
    if (!titulo) continue;
    if (!/(math|algebra|calculus|statistics|precalculus|geometry|probability)/.test(texto)) continue;
    if (termos.length && !termos.some(p => texto.includes(p)) && !['matematica','matemática'].includes(semAcento(q))) continue;
    const slug = x?.slug || x?.meta?.slug || '';
    const url = linkSeguro(x?.web_url || x?.url || (slug ? `https://openstax.org/details/books/${slug}` : 'https://openstax.org/subjects/math'));
    if (!url) continue;
    saida.push({
      id:`openstax:${x?.id || slug || titulo}`, titulo,
      descricao:String(x?.description || 'Livro-texto completo, gratuito e revisado por educadores.').replace(/<[^>]+>/g,' ').slice(0,340),
      tipo:'Livro completo · OpenStax', nivel:'Do médio ao superior', topicos:[],
      origem:'openstax', provedor:'OpenStax', url, peso:8
    });
  }
  return saida.slice(0, 30);
}

function mapearPressbooks(d) {
  const saida = [];
  for (const h of A(d?.hits?.hits)) {
    const x = h?._source || {};
    const titulo = String(x?.name || x?.headline || '').trim();
    if (!titulo) continue;
    const pagina = A(x?.mainEntityOfPage)[0] || x?.mainEntityOfPage || {};
    const url = linkSeguro(typeof pagina === 'string' ? pagina : pagina?.id || pagina?.url || x?.id);
    if (!url) continue;
    const criador = A(x?.creator).map(c => typeof c === 'string' ? c : c?.name).filter(Boolean).slice(0,3).join(' · ');
    const descricao = String(x?.description || 'Livro educacional aberto publicado em ecossistema Pressbooks.').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,340);
    saida.push({ id:`pressbooks:${h?._id || titulo}`, titulo, descricao:[criador, descricao].filter(Boolean).join(' — '), tipo:'Livro / curso aberto · Pressbooks', nivel:'Variável', topicos:[], origem:'pressbooks', provedor:'Pressbooks via OERSI', url, peso:20 });
  }
  return saida.slice(0, 30);
}

function pdfOpenAlex(x) {
  const locais = [x?.best_oa_location, x?.primary_location, ...A(x?.locations)].filter(Boolean);
  for (const l of locais) {
    const u = linkSeguro(l?.pdf_url);
    if (u && l?.is_oa !== false) return u;
  }
  const oa = linkSeguro(x?.open_access?.oa_url);
  return /\.pdf(?:$|[?#])/i.test(oa) ? oa : '';
}

function mapearOpenAlex(d) {
  const saida = [];
  for (const x of A(d?.results)) {
    const pdf = pdfOpenAlex(x);
    const titulo = String(x?.display_name || x?.title || '').trim();
    if (!pdf || !titulo) continue;
    const autores = A(x?.authorships).map(a => a?.author?.display_name).filter(Boolean).slice(0,4).join(' · ');
    saida.push({ id:`openalex:${String(x?.id || titulo).split('/').pop()}`, titulo, descricao:[autores,x?.publication_year,x?.type].filter(Boolean).join(' · '), tipo:'PDF acadêmico aberto', nivel:'Complementar / avançado', topicos:[], origem:'openalex', provedor:'OpenAlex', url:pdf, peso:80 });
  }
  return saida.slice(0, 20);
}

function normalizar(lista) {
  const vistos = new Set(), saida = [];
  for (const x of lista) {
    if (!x?.titulo || !x?.url) continue;
    const k = semAcento(x.titulo).replace(/[^a-z0-9]+/g, ' ').trim();
    if (vistos.has(k)) continue;
    vistos.add(k);
    saida.push(x);
  }
  return saida.sort((a,b) => (a.peso ?? 99) - (b.peso ?? 99) || (a.prioridade ?? 999) - (b.prioridade ?? 999));
}

function simbolo(x) {
  if (['curado','openstax','opentextbook'].includes(x.origem)) return '∑';
  if (x.origem === 'pressbooks') return 'PB';
  return 'PDF';
}

function render() {
  const area = $('#resultados-matematica');
  if (!area) return;
  const status = $('#status-matematica');
  const fontes = $('#fontes-matematica-status');
  const carga = $('#carregando-matematica');

  if (status) status.textContent = estado.consulta
    ? `${estado.resultados.length} ${estado.resultados.length === 1 ? 'material encontrado' : 'materiais encontrados'} · livros completos sempre priorizados`
    : 'Do primeiro cálculo às áreas avançadas da matemática.';

  if (fontes) {
    const defs = [['curado','Acervo curado'],['openstax','OpenStax'],['opentextbook','Open Textbook Library'],['pressbooks','Pressbooks / OERSI'],['openalex','OpenAlex']];
    fontes.hidden = !estado.consulta && !estado.buscando;
    fontes.innerHTML = defs.map(([id,n]) => `<span class="fonte-chip ${estado.fontes[id]?.erro ? 'erro' : estado.fontes[id] ? 'ok' : 'espera'}"><b>${escapar(n)}</b><i>${estado.fontes[id]?.erro ? '×' : estado.fontes[id]?.quantidade ?? '…'}</i></span>`).join('');
  }

  if (carga) {
    carga.hidden = !estado.buscando;
    carga.setAttribute('aria-hidden', String(!estado.buscando));
  }

  if (!estado.consulta && !estado.buscando) {
    area.innerHTML = '<div class="estado-vazio"><h3>Matemática do zero ao avançado.</h3><p>Escolha um assunto acima ou pesquise por aritmética, álgebra, geometria, cálculo, álgebra linear, equações diferenciais, probabilidade, estatística, análise real, topologia, teoria dos números e muito mais.</p></div>';
    return;
  }

  if (estado.buscando && !estado.resultados.length) {
    area.innerHTML = '<div class="estado-vazio"><h3>Procurando material completo…</h3><p>Os livros-texto e cursos completos recebem prioridade sobre artigos e PDFs isolados.</p></div>';
    return;
  }

  area.innerHTML = estado.resultados.length ? estado.resultados.map(x => `
    <article class="resultado resultado-matematica">
      <div class="sem-capa capa-matematica" aria-hidden="true">${escapar(simbolo(x))}</div>
      <div>
        <h3>${escapar(x.titulo)}</h3>
        <p>${escapar(x.descricao || 'Material de matemática.')}</p>
        <div class="meta-livro">
          <span>${escapar(x.tipo || 'Material completo')}</span>
          ${x.nivel ? `<span>${escapar(x.nivel)}</span>` : ''}
          <span>${escapar(x.provedor || 'Fonte aberta')}</span>
        </div>
        ${A(x.topicos).length ? `<div class="tags-matematica">${A(x.topicos).slice(0,6).map(t => `<span>${escapar(t)}</span>`).join('')}</div>` : ''}
        <div class="acoes-resultado"><a class="ler" href="${escapar(x.url)}" target="_blank" rel="noopener noreferrer">${/pdf/i.test(x.tipo || '') ? 'Abrir material / PDF' : 'Abrir livro'} ↗</a></div>
      </div>
    </article>`).join('') : '<div class="estado-vazio"><h3>Nenhum material apareceu nesta tentativa.</h3><p>Tente um assunto mais amplo, como “álgebra”, “cálculo”, “probabilidade” ou “análise”.</p></div>';
}

async function pesquisar(q) {
  q = String(q || '').trim();
  estado.consulta = q;
  estado.resultados = [];
  estado.fontes = {};
  const token = ++estado.token;
  if (!q) {
    estado.buscando = false;
    render();
    return;
  }
  estado.buscando = true;
  render();

  try {
    await carregarCatalogo();
    const base = locais(q);
    estado.resultados = normalizar(base);
    estado.fontes.curado = { quantidade: base.length };
    render();

    const c = new AbortController();
    const timer = setTimeout(() => c.abort(), 18000);
    const json = async rota => {
      try {
        const r = await fetch(rota, { signal:c.signal, headers:{Accept:'application/json'} });
        return r.ok ? await r.json() : null;
      } catch {
        return null;
      }
    };
    const t = encodeURIComponent(termoApi(q));
    const [os, otl, pb, oa] = await Promise.all([
      json(`/api/acervos-gratuitos?fonte=openstax&q=${t}`),
      json(`/api/acervos-gratuitos?fonte=opentextbook&q=${t}`),
      json(`/api/pressbooks?q=${t}`),
      json(`/api/acervos-gratuitos?fonte=openalex&q=${t}`)
    ]);
    clearTimeout(timer);
    if (token !== estado.token) return;

    const grupos = [mapearOpenStax(os, q), mapearOpenTextbook(otl), mapearPressbooks(pb), mapearOpenAlex(oa)];
    estado.fontes.openstax = { quantidade:grupos[0].length, erro:!os };
    estado.fontes.opentextbook = { quantidade:grupos[1].length, erro:!otl };
    estado.fontes.pressbooks = { quantidade:grupos[2].length, erro:!pb };
    estado.fontes.openalex = { quantidade:grupos[3].length, erro:!oa };
    estado.resultados = normalizar([...base, ...grupos.flat()]);
  } catch {
    estado.fontes.openstax = { quantidade:0, erro:true };
    estado.fontes.opentextbook = { quantidade:0, erro:true };
    estado.fontes.pressbooks = { quantidade:0, erro:true };
    estado.fontes.openalex = { quantidade:0, erro:true };
  }

  if (token !== estado.token) return;
  estado.buscando = false;
  render();
}

function ligar() {
  const botao = $('#abrir-matematica');
  if (botao) {
    botao.type = 'button';
    botao.onclick = e => {
      e.preventDefault();
      e.stopPropagation();
      abrirMatematica();
    };
  }

  $('#form-matematica')?.addEventListener('submit', e => {
    e.preventDefault();
    pesquisar($('#campo-matematica')?.value || '');
  });

  document.addEventListener('click', e => {
    const b = e.target.closest('#abrir-matematica,[data-matematica="abrir"]');
    if (b) {
      e.preventDefault();
      e.stopImmediatePropagation();
      abrirMatematica();
      return;
    }
    const top = e.target.closest('[data-topico-mat]');
    if (top) {
      e.preventDefault();
      const q = top.getAttribute('data-topico-mat') || '';
      const campo = $('#campo-matematica');
      if (campo) campo.value = q;
      pesquisar(q);
    }
  }, true);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ligar, { once:true });
} else {
  ligar();
}

window.BibliotecaMatematica = { abrir: abrirMatematica, pesquisar };
