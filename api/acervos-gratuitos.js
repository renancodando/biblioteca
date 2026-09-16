const texto = v => String(v || '').replace(/[<>\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180);
const lucene = v => texto(v).replace(/[+\-!(){}\[\]^~*?:\\/]/g, ' ').replace(/\s+/g, ' ').trim();
const esperar = ms => new Promise(r => setTimeout(r, ms));

function construir(fonte, q, pagina) {
  const limite = 20;
  if (fonte === 'archive') {
    const u = new URL('https://archive.org/advancedsearch.php');
    u.searchParams.set('q', `(${lucene(q)}) AND mediatype:texts AND access-restricted-item:false`);
    for (const f of ['identifier', 'title', 'creator', 'language', 'year', 'downloads']) u.searchParams.append('fl[]', f);
    u.searchParams.set('rows', String(limite));
    u.searchParams.set('page', String(pagina));
    u.searchParams.set('sort[]', 'downloads desc');
    u.searchParams.set('output', 'json');
    return { url: u, tipo: 'json' };
  }
  if (fonte === 'loc') {
    const u = new URL('https://www.loc.gov/books/');
    u.searchParams.set('q', q);
    u.searchParams.set('fo', 'json');
    u.searchParams.set('c', String(limite));
    u.searchParams.set('sp', String(pagina));
    u.searchParams.set('at', 'results,pagination');
    return { url: u, tipo: 'json' };
  }
  if (fonte === 'oapen' || fonte === 'doab') {
    const base = fonte === 'oapen' ? 'https://library.oapen.org/rest/search' : 'https://directory.doabooks.org/rest/search';
    const u = new URL(base);
    u.searchParams.set('query', q);
    u.searchParams.set('expand', 'metadata');
    u.searchParams.set('limit', String(limite));
    u.searchParams.set('start', String((pagina - 1) * limite));
    return { url: u, tipo: 'json' };
  }
  if (fonte === 'europepmc') {
    const u = new URL('https://www.ebi.ac.uk/europepmc/webservices/rest/search');
    u.searchParams.set('query', `OPEN_ACCESS:Y AND (${q})`);
    u.searchParams.set('format', 'json');
    u.searchParams.set('resultType', 'core');
    u.searchParams.set('pageSize', String(limite));
    u.searchParams.set('page', String(pagina));
    return { url: u, tipo: 'json' };
  }
  if (fonte === 'eric') {
    const u = new URL('https://api.ies.ed.gov/eric/');
    u.searchParams.set('search', q);
    u.searchParams.set('format', 'json');
    u.searchParams.set('rows', '40');
    u.searchParams.set('start', String((pagina - 1) * 40));
    u.searchParams.set('fields', 'id,title,author,description,language,publicationtype,publicationdateyear,efulltextauth,url');
    return { url: u, tipo: 'json' };
  }
  if (fonte === 'arxiv') {
    const u = new URL('https://export.arxiv.org/api/query');
    const segura = q.replace(/["\\]/g, ' ').replace(/\s+/g, ' ').trim();
    u.searchParams.set('search_query', `all:"${segura}"`);
    u.searchParams.set('start', String((pagina - 1) * limite));
    u.searchParams.set('max_results', String(limite));
    u.searchParams.set('sortBy', 'relevance');
    u.searchParams.set('sortOrder', 'descending');
    return { url: u, tipo: 'xml' };
  }
  if (fonte === 'doaj') {
    const u = new URL(`https://doaj.org/api/search/articles/${encodeURIComponent(q)}`);
    u.searchParams.set('page', String(pagina));
    u.searchParams.set('pageSize', String(limite));
    return { url: u, tipo: 'json' };
  }
  if (fonte === 'ncbi') {
    const u = new URL('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi');
    u.searchParams.set('db', 'books');
    u.searchParams.set('term', q);
    u.searchParams.set('retmode', 'json');
    u.searchParams.set('retmax', '15');
    u.searchParams.set('retstart', String((pagina - 1) * 15));
    u.searchParams.set('sort', 'relevance');
    u.searchParams.set('tool', 'BibliotecaLivre');
    return { url: u, tipo: 'json' };
  }
  if (fonte === 'ncbi-resumo') {
    const ids = q.replace(/\s+/g, '');
    if (!/^\d+(,\d+)*$/.test(ids)) return null;
    const u = new URL('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi');
    u.searchParams.set('db', 'books');
    u.searchParams.set('id', ids);
    u.searchParams.set('retmode', 'json');
    u.searchParams.set('tool', 'BibliotecaLivre');
    return { url: u, tipo: 'json' };
  }
  if (fonte === 'gallica') {
    const u = new URL('https://gallica.bnf.fr/SRU');
    u.searchParams.set('version', '1.2');
    u.searchParams.set('operation', 'searchRetrieve');
    u.searchParams.set('maximumRecords', String(limite));
    u.searchParams.set('startRecord', String((pagina - 1) * limite + 1));
    u.searchParams.set('suggest', '0');
    u.searchParams.set('query', `(gallica all "${q.replace(/"/g, ' ')}") and (dc.type all "monographie") and (access all "fayes")`);
    return { url: u, tipo: 'xml' };
  }
  if (fonte === 'dpla') {
    const chave = (process.env.DPLA_API_KEY || '').trim();
    if (!chave) return { desativada: true };
    const u = new URL('https://api.dp.la/v2/items');
    u.searchParams.set('q', q);
    u.searchParams.set('page_size', String(limite));
    u.searchParams.set('page', String(pagina));
    u.searchParams.set('api_key', chave);
    return { url: u, tipo: 'json' };
  }
  if (fonte === 'crossref') {
    const u = new URL('https://api.crossref.org/works');
    u.searchParams.set('query', q);
    u.searchParams.set('rows', String(limite));
    u.searchParams.set('offset', String((pagina - 1) * limite));
    u.searchParams.set('sort', 'relevance');
    u.searchParams.set('mailto', 'suporte@bibliotecalivre.org');
    return { url: u, tipo: 'json' };
  }
  if (fonte === 'core') {
    const chave = (process.env.CORE_API_KEY || '').trim();
    if (!chave) return { desativada: true };
    const u = new URL('https://api.core.ac.uk/v3/search/works');
    u.searchParams.set('q', q);
    u.searchParams.set('limit', String(limite));
    u.searchParams.set('offset', String((pagina - 1) * limite));
    return { url: u, tipo: 'json', headers: { Authorization: `Bearer ${chave}` } };
  }
  if (fonte === 'unpaywall') {
    const doi = String(q || '').replace(/^https?:\/\/doi\.org\//i, '').trim();
    if (!doi) return null;
    const u = new URL(`https://api.unpaywall.org/v2/${encodeURIComponent(doi)}`);
    u.searchParams.set('email', 'contato@bibliotecalivre.org');
    return { url: u, tipo: 'json' };
  }
  if (fonte === 'semanticscholar') {
    const u = new URL('https://api.semanticscholar.org/graph/v1/paper/search');
    u.searchParams.set('query', q);
    u.searchParams.set('offset', String((pagina - 1) * limite));
    u.searchParams.set('limit', String(limite));
    u.searchParams.set('fields', 'title,authors,year,abstract,openAccessPdf,url,externalIds,isOpenAccess');
    const chave = (process.env.SEMANTIC_SCHOLAR_API_KEY || '').trim();
    return { url: u, tipo: 'json', headers: chave ? { 'x-api-key': chave } : {} };
  }
  if (fonte === 'europeana') {
    const chave = (process.env.EUROPEANA_API_KEY || '').trim();
    if (!chave) return { desativada: true };
    const u = new URL('https://api.europeana.eu/record/v2/search.json');
    u.searchParams.set('query', q);
    u.searchParams.set('wskey', chave);
    u.searchParams.set('rows', String(limite));
    u.searchParams.set('start', String((pagina - 1) * limite + 1));
    u.searchParams.set('profile', 'standard');
    return { url: u, tipo: 'json' };
  }
  if (fonte === 'digitalnz') {
    const u = new URL('https://api.digitalnz.org/records.json');
    u.searchParams.set('text', q);
    u.searchParams.set('per_page', String(limite));
    u.searchParams.set('page', String(pagina));
    const chave = (process.env.DIGITALNZ_API_KEY || '').trim();
    if (chave) u.searchParams.set('api_key', chave);
    return { url: u, tipo: 'json' };
  }
  if (fonte === 'trove') {
    const chave = (process.env.TROVE_API_KEY || '').trim();
    if (!chave) return { desativada: true };
    const u = new URL('https://api.trove.nla.gov.au/v3/result');
    u.searchParams.set('q', q);
    u.searchParams.set('category', 'book');
    u.searchParams.set('encoding', 'json');
    u.searchParams.set('n', String(limite));
    u.searchParams.set('s', String((pagina - 1) * limite));
    u.searchParams.set('key', chave);
    return { url: u, tipo: 'json' };
  }
  if (fonte === 'opentextbook') {
    const u = new URL('https://open.umn.edu/opentextbooks/textbooks.json');
    u.searchParams.set('term', q);
    return { url: u, tipo: 'json' };
  }
  if (fonte === 'openstax') {
    const u = new URL('https://openstax.org/apps/cms/api/books');
    return { url: u, tipo: 'json' };
  }
  if (fonte === 'pressbooks') {
    const u = new URL('https://oersi.org/resources/api/search/oer_data/_search');
    u.searchParams.set('q', `${q} AND (provider:Pressbooks OR mainEntityOfPage:*pressbooks*)`);
    u.searchParams.set('size', String(limite));
    u.searchParams.set('from', String((pagina - 1) * limite));
    return { url: u, tipo: 'json' };
  }
  if (fonte === 'zenodo') {
    const u = new URL('https://zenodo.org/api/records');
    u.searchParams.set('q', q);
    u.searchParams.set('size', String(limite));
    u.searchParams.set('page', String(pagina));
    u.searchParams.set('access_right', 'open');
    u.searchParams.set('sort', 'bestmatch');
    return { url: u, tipo: 'json', timeout: 5500 };
  }
  if (fonte === 'hal') {
    const u = new URL('https://api.archives-ouvertes.fr/search/');
    u.searchParams.set('q', q);
    u.searchParams.set('rows', String(limite));
    u.searchParams.set('start', String((pagina - 1) * limite));
    u.searchParams.set('wt', 'json');
    u.searchParams.set('fl', 'docid,label_s,title_s,authFullName_s,producedDateY_i,uri_s,files_s,abstract_s,docType_s,language_s');
    return { url: u, tipo: 'json' };
  }
  if (fonte === 'openalex') {
    const u = new URL('https://api.openalex.org/works');
    u.searchParams.set('search', q);
    u.searchParams.set('per-page', String(limite));
    u.searchParams.set('page', String(pagina));
    u.searchParams.set('mailto', 'suporte@bibliotecalivre.org');
    return { url: u, tipo: 'json' };
  }
  if (fonte === 'wikidata') {
    const sparql = String(q || '').trim();
    const u = new URL('https://query.wikidata.org/sparql');
    u.searchParams.set('format', 'json');
    u.searchParams.set('query', sparql.startsWith('SELECT') ? sparql : `SELECT ?item ?itemLabel ?authorLabel ?date WHERE { ?item wdt:P31 wd:571 . ?item rdfs:label "${sparql}"@pt . SERVICE wikibase:label { bd:serviceParam wikibase:language "pt,en". } } LIMIT 5`);
    return { url: u, tipo: 'json' };
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ erro: 'Método não permitido.' });
  const fonte = String(req.query.fonte || '').toLowerCase().trim();
  const q = texto(req.query.doi || req.query.sparql || req.query.q);
  const pagina = Math.max(1, Math.min(Number.parseInt(req.query.pagina || '1', 10) || 1, 500));
  if (!q && fonte !== 'openstax') return res.status(400).json({ erro: 'Consulta obrigatória.' });
  const alvo = construir(fonte, q, pagina);
  if (!alvo) return res.status(400).json({ erro: 'Fonte não permitida.' });
  if (alvo.desativada) return res.status(200).json({ desativada: true, livros: [], total: 0, temMais: false });
  let ultimoErro = null;
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    try {
      const resposta = await fetch(alvo.url, {
        headers: {
          Accept: alvo.tipo === 'xml' ? 'application/xml,text/xml;q=0.9,*/*;q=0.1' : 'application/json',
          'User-Agent': 'BibliotecaLivre/2.1 (acervo aberto; mailto:suporte@bibliotecalivre.org)',
          ...(alvo.headers || {})
        },
        signal: AbortSignal.timeout(alvo.timeout || 4800)
      });
      const corpo = await resposta.text();
      if (resposta.ok) {
        res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600');
        if (alvo.tipo === 'xml') return res.status(200).json({ xml: corpo });
        try { return res.status(200).json(JSON.parse(corpo)); }
        catch { return res.status(502).json({ erro: 'A fonte devolveu uma resposta inválida.' }); }
      }
      if (resposta.status === 429) {
        return res.status(200).json({ taxaLimite: true, livros: [], total: 0, temMais: false });
      }
      ultimoErro = new Error(`Fonte respondeu ${resposta.status}`);
      ultimoErro.status = resposta.status;
      if (![408, 425, 429, 500, 502, 503, 504].includes(resposta.status) || tentativa > 0) break;
      await esperar(240);
    } catch (e) {
      ultimoErro = e;
      if (e?.name === 'TimeoutError' || e?.name === 'AbortError' || tentativa > 0) break;
      await esperar(240);
    }
  }
  const codigo = ['TimeoutError','AbortError'].includes(ultimoErro?.name) ? 'FONTE_TIMEOUT' : 'FONTE_INDISPONIVEL';
  return res.status(502).json({ erro: 'Fonte aberta temporariamente indisponível.', codigo, fonte });
}
