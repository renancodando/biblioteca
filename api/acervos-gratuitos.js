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
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ erro: 'Método não permitido.' });
  const fonte = String(req.query.fonte || '').toLowerCase().trim();
  const q = texto(req.query.q);
  const pagina = Math.max(1, Math.min(Number.parseInt(req.query.pagina || '1', 10) || 1, 500));
  if (!q) return res.status(400).json({ erro: 'Consulta obrigatória.' });
  const alvo = construir(fonte, q, pagina);
  if (!alvo) return res.status(400).json({ erro: 'Fonte não permitida.' });
  let ultimoErro = null;
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    try {
      const resposta = await fetch(alvo.url, {
        headers: { Accept: alvo.tipo === 'xml' ? 'application/xml,text/xml;q=0.9,*/*;q=0.1' : 'application/json', 'User-Agent': 'BibliotecaLivre/2.1 (acervo aberto)' },
        signal: AbortSignal.timeout(4200)
      });
      const corpo = await resposta.text();
      if (resposta.ok) {
        res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600');
        if (alvo.tipo === 'xml') return res.status(200).json({ xml: corpo });
        try { return res.status(200).json(JSON.parse(corpo)); }
        catch { return res.status(502).json({ erro: 'A fonte devolveu uma resposta inválida.' }); }
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
