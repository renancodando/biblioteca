export default function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({erro:'Método não permitido.'});
  res.setHeader('Cache-Control','no-store');
  return res.status(200).json({
    ok:true,
    fontes:35,
    fontesAbertas:['Project Gutenberg','Open Library','Google Books','Wikisource','Internet Archive','OAPEN','DOAB','SciELO Livros','Europe PMC','ERIC','NCBI Bookshelf','arXiv','DOAJ','Wikibooks','Wikiversidade','Library of Congress','Gallica · BnF','Biblioteca Nacional Digital','DPLA','Crossref','CORE','Semantic Scholar','Europeana','DigitalNZ','Trove','Open Textbook Library','OpenStax','Pressbooks Directory','Zenodo','HAL','OpenAlex','OpenAIRE','DataCite','Unpaywall','Wikidata'],
    fontesPesquisaveis:34,
    enriquecedores:['Unpaywall'],
    googleBooksKeyConfigured:Boolean(process.env.GOOGLE_BOOKS_API_KEY),
    dplaKeyConfigured:Boolean(process.env.DPLA_API_KEY),
    coreKeyConfigured:Boolean(process.env.CORE_API_KEY),
    europeanaKeyConfigured:Boolean(process.env.EUROPEANA_API_KEY),
    troveKeyConfigured:Boolean(process.env.TROVE_API_KEY),
    digitalNzKeyConfigured:Boolean(process.env.DIGITALNZ_API_KEY),
    semanticScholarKeyConfigured:Boolean(process.env.SEMANTIC_SCHOLAR_API_KEY)
  });
}
