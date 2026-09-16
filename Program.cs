using System.Net.Http.Headers;

var arquivoAmbiente = Path.Combine(Directory.GetCurrentDirectory(), ".env");
if (File.Exists(arquivoAmbiente))
{
    foreach (var linha in File.ReadLines(arquivoAmbiente))
    {
        var texto = linha.Trim();
        if (string.IsNullOrWhiteSpace(texto) || texto.StartsWith('#')) continue;
        var separador = texto.IndexOf('=');
        if (separador <= 0) continue;
        var nome = texto[..separador].Trim();
        var valor = texto[(separador + 1)..].Trim().Trim('"', '\'');
        if (!string.IsNullOrWhiteSpace(nome) && string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(nome)))
            Environment.SetEnvironmentVariable(nome, valor);
    }
}

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddHttpClient("google-books", cliente =>
{
    cliente.BaseAddress = new Uri("https://www.googleapis.com/books/v1/");
    cliente.Timeout = TimeSpan.FromSeconds(6);
    cliente.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
});
builder.Services.AddHttpClient("acervos-abertos", cliente =>
{
    cliente.Timeout = TimeSpan.FromSeconds(5);
    cliente.DefaultRequestHeaders.UserAgent.ParseAdd("BibliotecaLivre/2.1");
});
builder.Services.AddHttpClient("openaire", cliente =>
{
    cliente.BaseAddress = new Uri("https://api.openaire.eu/graph/v3/");
    cliente.Timeout = TimeSpan.FromSeconds(7);
    cliente.DefaultRequestHeaders.UserAgent.ParseAdd("BibliotecaLivre/2.1");
    cliente.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
});

var app = builder.Build();
var raiz = Path.Combine(builder.Environment.ContentRootPath, "dist");

app.MapGet("/api/status", (IConfiguration configuracao) => Results.Json(new
{
    ok = true,
    fontes = 32,
    fontesPesquisaveis = 31,
    fontesAbertas = new[] { "Project Gutenberg", "Open Library", "Google Books", "Wikisource", "Internet Archive", "OAPEN", "DOAB", "Europe PMC", "ERIC", "NCBI Bookshelf", "arXiv", "DOAJ", "Wikibooks", "Wikiversidade", "Library of Congress", "Gallica · BnF", "DPLA", "Crossref", "CORE", "Semantic Scholar", "Europeana", "DigitalNZ", "Trove", "Open Textbook Library", "OpenStax", "Pressbooks Directory", "Zenodo", "HAL", "OpenAlex", "OpenAIRE", "Unpaywall", "Wikidata" },
    enriquecedores = new[] { "Unpaywall" },
    googleBooksKeyConfigured = !string.IsNullOrWhiteSpace(configuracao["GOOGLE_BOOKS_API_KEY"]),
    dplaKeyConfigured = !string.IsNullOrWhiteSpace(configuracao["DPLA_API_KEY"]),
    coreKeyConfigured = !string.IsNullOrWhiteSpace(configuracao["CORE_API_KEY"]),
    europeanaKeyConfigured = !string.IsNullOrWhiteSpace(configuracao["EUROPEANA_API_KEY"]),
    troveKeyConfigured = !string.IsNullOrWhiteSpace(configuracao["TROVE_API_KEY"]),
    digitalNzKeyConfigured = !string.IsNullOrWhiteSpace(configuracao["DIGITALNZ_API_KEY"]),
    semanticScholarKeyConfigured = !string.IsNullOrWhiteSpace(configuracao["SEMANTIC_SCHOLAR_API_KEY"])
}));

app.MapGet("/api/google-books", async (HttpContext contexto, IHttpClientFactory fabrica, IConfiguration configuracao) =>
{
    var chave = configuracao["GOOGLE_BOOKS_API_KEY"]?.Trim();

    var consulta = contexto.Request.Query["q"].ToString().Trim();
    var inicio = contexto.Request.Query["startIndex"].ToString();
    var idioma = contexto.Request.Query["langRestrict"].ToString();
    var maximoTexto = contexto.Request.Query["maxResults"].ToString();
    if (string.IsNullOrWhiteSpace(consulta))
        return Results.BadRequest(new { erro = "Consulta obrigatória." });
    if (!int.TryParse(inicio, out var indice) || indice < 0)
        indice = 0;
    idioma = idioma is "pt" or "en" or "es" or "fr" ? idioma : string.Empty;
    if (!int.TryParse(maximoTexto, out var maximo) || maximo < 1) maximo = 40;
    maximo = Math.Min(maximo, 40);

    var parametros = new Dictionary<string, string?>
    {
        ["q"] = consulta.Length > 180 ? consulta[..180] : consulta,
        ["printType"] = "books",
        ["projection"] = "full",
        ["maxResults"] = maximo.ToString(),
        ["startIndex"] = indice.ToString(),
        ["orderBy"] = "relevance"
    };
    if (!string.IsNullOrWhiteSpace(chave))
        parametros["key"] = chave;
    if (!string.IsNullOrEmpty(idioma))
        parametros["langRestrict"] = idioma;

    var query = string.Join('&', parametros.Where(p => !string.IsNullOrWhiteSpace(p.Value))
        .Select(p => $"{Uri.EscapeDataString(p.Key)}={Uri.EscapeDataString(p.Value!)}"));

    try
    {
        var cliente = fabrica.CreateClient("google-books");
        HttpResponseMessage? ultimaResposta = null;
        string ultimoCorpo = string.Empty;
        for (var tentativa = 0; tentativa < 2; tentativa++)
        {
            ultimaResposta?.Dispose();
            ultimaResposta = await cliente.GetAsync($"volumes?{query}", contexto.RequestAborted);
            ultimoCorpo = await ultimaResposta.Content.ReadAsStringAsync(contexto.RequestAborted);
            if (ultimaResposta.IsSuccessStatusCode)
            {
                contexto.Response.Headers.CacheControl = "public, max-age=300";
                var status = (int)ultimaResposta.StatusCode;
                ultimaResposta.Dispose();
                return Results.Content(ultimoCorpo, "application/json; charset=utf-8", statusCode: status);
            }
            var statusAtual = (int)ultimaResposta.StatusCode;
            if (statusAtual is not (408 or 429 or 500 or 502 or 503 or 504) || tentativa == 1)
                break;
            await Task.Delay(TimeSpan.FromMilliseconds(300 * (tentativa + 1)), contexto.RequestAborted);
        }
        var statusFinal = ultimaResposta is null ? 502 : (int)ultimaResposta.StatusCode;
        ultimaResposta?.Dispose();
        return Results.Content(ultimoCorpo, "application/json; charset=utf-8", statusCode: statusFinal);
    }
    catch (OperationCanceledException)
    {
        return Results.Json(new { erro = "Google Books excedeu o tempo de resposta.", codigo = "GOOGLE_BOOKS_TIMEOUT" }, statusCode: StatusCodes.Status504GatewayTimeout);
    }
    catch
    {
        return Results.Json(new { erro = "Google Books temporariamente indisponível.", codigo = "GOOGLE_BOOKS_UNAVAILABLE" }, statusCode: StatusCodes.Status502BadGateway);
    }
});

app.MapGet("/api/openaire", async (HttpContext contexto, IHttpClientFactory fabrica) =>
{
    var consulta = contexto.Request.Query["q"].ToString().Replace("<", " ").Replace(">", " ").Trim();
    if (consulta.Length > 180) consulta = consulta[..180];
    if (string.IsNullOrWhiteSpace(consulta)) return Results.BadRequest(new { erro = "Consulta obrigatória." });
    if (!int.TryParse(contexto.Request.Query["pagina"], out var pagina) || pagina < 1) pagina = 1;
    pagina = Math.Min(pagina, 500);

    var query = string.Join('&', new[]
    {
        $"search={Uri.EscapeDataString(consulta)}",
        $"accessRightLabel={Uri.EscapeDataString("Open Access")}",
        $"accessRightLabel={Uri.EscapeDataString("Open Source")}",
        $"page={pagina}",
        "pageSize=20",
        $"sortBy={Uri.EscapeDataString("relevance DESC")}" 
    });

    try
    {
        var cliente = fabrica.CreateClient("openaire");
        using var resposta = await cliente.GetAsync($"research-products?{query}", contexto.RequestAborted);
        var corpo = await resposta.Content.ReadAsStringAsync(contexto.RequestAborted);
        if (resposta.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
            return Results.Json(new { taxaLimite = true, header = new { numFound = 0, page = pagina, pageSize = 20 }, results = Array.Empty<object>() });
        if (!resposta.IsSuccessStatusCode)
            return Results.Content(corpo, "application/json; charset=utf-8", statusCode: (int)resposta.StatusCode);
        contexto.Response.Headers.CacheControl = "public, max-age=900";
        return Results.Content(corpo, "application/json; charset=utf-8");
    }
    catch (OperationCanceledException)
    {
        return Results.Json(new { erro = "OpenAIRE excedeu o tempo de resposta.", codigo = "FONTE_TIMEOUT" }, statusCode: StatusCodes.Status504GatewayTimeout);
    }
    catch
    {
        return Results.Json(new { erro = "OpenAIRE temporariamente indisponível.", codigo = "FONTE_INDISPONIVEL" }, statusCode: StatusCodes.Status502BadGateway);
    }
});

app.MapGet("/api/acervos-gratuitos", async (HttpContext contexto, IHttpClientFactory fabrica, IConfiguration configuracao) =>
{
    var fonte = contexto.Request.Query["fonte"].ToString().Trim().ToLowerInvariant();
    var consulta = contexto.Request.Query["q"].ToString().Replace("<", " ").Replace(">", " ").Trim();
    if (consulta.Length > 180) consulta = consulta[..180];
    if (string.IsNullOrWhiteSpace(consulta) && fonte != "openstax") return Results.BadRequest(new { erro = "Consulta obrigatória." });
    if (!int.TryParse(contexto.Request.Query["pagina"], out var pagina) || pagina < 1) pagina = 1;
    pagina = Math.Min(pagina, 500);
    const int limite = 20;
    Uri? alvo = null;
    var xml = false;
    string? bearerToken = null;
    string? apiKeyHeader = null;
    if (fonte == "archive")
    {
        var limpa = System.Text.RegularExpressions.Regex.Replace(consulta, @"[+\-!(){}\[\]^~*?:\\/]", " ");
        var campos = string.Join("&", new[] { "identifier", "title", "creator", "language", "year", "downloads" }.Select(x => "fl%5B%5D=" + Uri.EscapeDataString(x)));
        alvo = new Uri($"https://archive.org/advancedsearch.php?q={Uri.EscapeDataString($"({limpa}) AND mediatype:texts AND access-restricted-item:false")}&{campos}&rows={limite}&page={pagina}&sort%5B%5D=downloads%20desc&output=json");
    }
    else if (fonte == "loc")
        alvo = new Uri($"https://www.loc.gov/books/?q={Uri.EscapeDataString(consulta)}&fo=json&c={limite}&sp={pagina}&at=results%2Cpagination");
    else if (fonte is "oapen" or "doab")
    {
        var baseUrl = fonte == "oapen" ? "https://library.oapen.org/rest/search" : "https://directory.doabooks.org/rest/search";
        alvo = new Uri($"{baseUrl}?query={Uri.EscapeDataString(consulta)}&expand=metadata&limit={limite}&start={(pagina - 1) * limite}");
    }
    else if (fonte == "europepmc")
        alvo = new Uri($"https://www.ebi.ac.uk/europepmc/webservices/rest/search?query={Uri.EscapeDataString($"OPEN_ACCESS:Y AND ({consulta})")}&format=json&resultType=core&pageSize={limite}&page={pagina}");
    else if (fonte == "eric")
        alvo = new Uri($"https://api.ies.ed.gov/eric/?search={Uri.EscapeDataString(consulta)}&format=json&rows=40&start={(pagina - 1) * 40}&fields={Uri.EscapeDataString("id,title,author,description,language,publicationtype,publicationdateyear,efulltextauth,url")}");
    else if (fonte == "arxiv")
    {
        var segura = consulta.Replace("\"", " ").Replace("\\", " ");
        alvo = new Uri($"https://export.arxiv.org/api/query?search_query={Uri.EscapeDataString($"all:\"{segura}\"")}&start={(pagina - 1) * limite}&max_results={limite}&sortBy=relevance&sortOrder=descending");
        xml = true;
    }
    else if (fonte == "doaj")
        alvo = new Uri($"https://doaj.org/api/search/articles/{Uri.EscapeDataString(consulta)}?page={pagina}&pageSize={limite}");
    else if (fonte == "ncbi")
        alvo = new Uri($"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=books&term={Uri.EscapeDataString(consulta)}&retmode=json&retmax=15&retstart={(pagina - 1) * 15}&sort=relevance&tool=BibliotecaLivre");
    else if (fonte == "ncbi-resumo")
    {
        var ids = System.Text.RegularExpressions.Regex.Replace(consulta, @"\s+", string.Empty);
        if (!System.Text.RegularExpressions.Regex.IsMatch(ids, @"^\d+(,\d+)*$")) return Results.BadRequest(new { erro = "Identificadores inválidos." });
        alvo = new Uri($"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=books&id={Uri.EscapeDataString(ids)}&retmode=json&tool=BibliotecaLivre");
    }
    else if (fonte == "gallica")
    {
        var cql = $"(gallica all \"{consulta.Replace("\"", " ")}\") and (dc.type all \"monographie\") and (access all \"fayes\")";
        alvo = new Uri($"https://gallica.bnf.fr/SRU?version=1.2&operation=searchRetrieve&maximumRecords={limite}&startRecord={(pagina - 1) * limite + 1}&suggest=0&query={Uri.EscapeDataString(cql)}");
        xml = true;
    }
    else if (fonte == "dpla")
    {
        var chave = configuracao["DPLA_API_KEY"]?.Trim();
        if (string.IsNullOrWhiteSpace(chave)) return Results.Json(new { desativada = true, livros = Array.Empty<object>(), total = 0, temMais = false });
        alvo = new Uri($"https://api.dp.la/v2/items?q={Uri.EscapeDataString(consulta)}&page_size={limite}&page={pagina}&api_key={Uri.EscapeDataString(chave)}");
    }
    else if (fonte == "crossref")
        alvo = new Uri($"https://api.crossref.org/works?query={Uri.EscapeDataString(consulta)}&rows={limite}&offset={(pagina - 1) * limite}&sort=relevance&mailto=suporte@bibliotecalivre.org");
    else if (fonte == "core")
    {
        var chave = configuracao["CORE_API_KEY"]?.Trim();
        if (string.IsNullOrWhiteSpace(chave)) return Results.Json(new { desativada = true, livros = Array.Empty<object>(), total = 0, temMais = false });
        alvo = new Uri($"https://api.core.ac.uk/v3/search/works?q={Uri.EscapeDataString(consulta)}&limit={limite}&offset={(pagina - 1) * limite}");
        bearerToken = chave;
    }
    else if (fonte == "unpaywall")
    {
        var doi = System.Text.RegularExpressions.Regex.Replace(consulta, @"^https?://doi\.org/", string.Empty, System.Text.RegularExpressions.RegexOptions.IgnoreCase).Trim();
        if (string.IsNullOrWhiteSpace(doi)) return Results.BadRequest(new { erro = "DOI obrigatório." });
        alvo = new Uri($"https://api.unpaywall.org/v2/{Uri.EscapeDataString(doi)}?email=contato@bibliotecalivre.org");
    }
    else if (fonte == "semanticscholar")
    {
        alvo = new Uri($"https://api.semanticscholar.org/graph/v1/paper/search?query={Uri.EscapeDataString(consulta)}&offset={(pagina - 1) * limite}&limit={limite}&fields=title,authors,year,abstract,openAccessPdf,url,externalIds,isOpenAccess");
        var chave = configuracao["SEMANTIC_SCHOLAR_API_KEY"]?.Trim();
        if (!string.IsNullOrWhiteSpace(chave)) apiKeyHeader = chave;
    }
    else if (fonte == "europeana")
    {
        var chave = configuracao["EUROPEANA_API_KEY"]?.Trim();
        if (string.IsNullOrWhiteSpace(chave)) return Results.Json(new { desativada = true, livros = Array.Empty<object>(), total = 0, temMais = false });
        alvo = new Uri($"https://api.europeana.eu/record/v2/search.json?query={Uri.EscapeDataString(consulta)}&wskey={Uri.EscapeDataString(chave)}&rows={limite}&start={(pagina - 1) * limite + 1}&profile=standard");
    }
    else if (fonte == "digitalnz")
    {
        var chave = configuracao["DIGITALNZ_API_KEY"]?.Trim();
        var keyParam = !string.IsNullOrWhiteSpace(chave) ? $"&api_key={Uri.EscapeDataString(chave)}" : string.Empty;
        alvo = new Uri($"https://api.digitalnz.org/records.json?text={Uri.EscapeDataString(consulta)}&per_page={limite}&page={pagina}{keyParam}");
    }
    else if (fonte == "trove")
    {
        var chave = configuracao["TROVE_API_KEY"]?.Trim();
        if (string.IsNullOrWhiteSpace(chave)) return Results.Json(new { desativada = true, livros = Array.Empty<object>(), total = 0, temMais = false });
        alvo = new Uri($"https://api.trove.nla.gov.au/v3/result?q={Uri.EscapeDataString(consulta)}&category=book&encoding=json&n={limite}&s={(pagina - 1) * limite}&key={Uri.EscapeDataString(chave)}");
    }
    else if (fonte == "opentextbook")
        alvo = new Uri($"https://open.umn.edu/opentextbooks/textbooks.json?term={Uri.EscapeDataString(consulta)}");
    else if (fonte == "openstax")
        alvo = new Uri("https://openstax.org/apps/cms/api/books");
    else if (fonte == "pressbooks")
        alvo = new Uri($"https://oersi.org/resources/api/search/oer_data/_search?q={Uri.EscapeDataString($"({consulta}) AND (provider:Pressbooks OR mainEntityOfPage:*pressbooks*)")}&size={limite}&from={(pagina - 1) * limite}");
    else if (fonte == "zenodo")
        alvo = new Uri($"https://zenodo.org/api/records?q={Uri.EscapeDataString(consulta)}&size={limite}&page={pagina}&access_right=open&sort=bestmatch");
    else if (fonte == "hal")
        alvo = new Uri($"https://api.archives-ouvertes.fr/search/?q={Uri.EscapeDataString(consulta)}&rows={limite}&start={(pagina - 1) * limite}&wt=json&fl=docid,label_s,title_s,authFullName_s,producedDateY_i,uri_s,files_s,abstract_s,docType_s,language_s");
    else if (fonte == "openalex")
        alvo = new Uri($"https://api.openalex.org/works?search={Uri.EscapeDataString(consulta)}&per-page={limite}&page={pagina}&mailto=suporte@bibliotecalivre.org");
    else if (fonte == "wikidata")
    {
        var sparql = consulta.StartsWith("SELECT", StringComparison.OrdinalIgnoreCase) ? consulta : $"SELECT ?item ?itemLabel ?authorLabel ?date WHERE {{ ?item wdt:P31 wd:571 . ?item rdfs:label \"{consulta}\"@pt . SERVICE wikibase:label {{ bd:serviceParam wikibase:language \"pt,en\". }} }} LIMIT 5";
        alvo = new Uri($"https://query.wikidata.org/sparql?format=json&query={Uri.EscapeDataString(sparql)}");
    }
    if (alvo is null) return Results.BadRequest(new { erro = "Fonte não permitida." });
    try
    {
        var cliente = fabrica.CreateClient("acervos-abertos");
        HttpResponseMessage? resposta = null;
        string corpo = string.Empty;
        for (var tentativa = 0; tentativa < 2; tentativa++)
        {
            resposta?.Dispose();
            using var pedido = new HttpRequestMessage(HttpMethod.Get, alvo);
            pedido.Headers.Accept.Clear();
            pedido.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue(xml ? "application/xml" : "application/json"));
            if (!string.IsNullOrWhiteSpace(bearerToken))
                pedido.Headers.Authorization = new AuthenticationHeaderValue("Bearer", bearerToken);
            if (!string.IsNullOrWhiteSpace(apiKeyHeader))
                pedido.Headers.TryAddWithoutValidation("x-api-key", apiKeyHeader);
            resposta = await cliente.SendAsync(pedido, contexto.RequestAborted);
            corpo = await resposta.Content.ReadAsStringAsync(contexto.RequestAborted);
            if (resposta.IsSuccessStatusCode)
            {
                contexto.Response.Headers.CacheControl = "public, max-age=600";
                if (xml) { resposta.Dispose(); return Results.Json(new { xml = corpo }); }
                var status = (int)resposta.StatusCode; resposta.Dispose();
                return Results.Content(corpo, "application/json; charset=utf-8", statusCode: status);
            }
            if (resposta.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
            {
                resposta.Dispose();
                return Results.Json(new { taxaLimite = true, livros = Array.Empty<object>(), total = 0, temMais = false });
            }
            var statusAtual = (int)resposta.StatusCode;
            if (statusAtual is not (408 or 425 or 429 or 500 or 502 or 503 or 504) || tentativa == 1) break;
            await Task.Delay(TimeSpan.FromMilliseconds(240 * (tentativa + 1)), contexto.RequestAborted);
        }
        resposta?.Dispose();
        return Results.Json(new { erro = "Fonte aberta temporariamente indisponível.", fonte }, statusCode: StatusCodes.Status502BadGateway);
    }
    catch (OperationCanceledException)
    {
        return Results.Json(new { erro = "A fonte excedeu o tempo de resposta.", fonte }, statusCode: StatusCodes.Status504GatewayTimeout);
    }
    catch
    {
        return Results.Json(new { erro = "Fonte aberta temporariamente indisponível.", fonte }, statusCode: StatusCodes.Status502BadGateway);
    }
});

app.UseDefaultFiles(new DefaultFilesOptions { FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(raiz) });
app.UseStaticFiles(new StaticFileOptions { FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(raiz) });
app.MapFallback(async contexto =>
{
    contexto.Response.ContentType = "text/html; charset=utf-8";
    await contexto.Response.SendFileAsync(Path.Combine(raiz, "index.html"));
});

app.Run();
