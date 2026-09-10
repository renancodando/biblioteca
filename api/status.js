export default function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({erro:'Método não permitido.'});
  res.setHeader('Cache-Control','no-store');
  return res.status(200).json({
    ok:true,
    fontes:16,
    fontesAbertas:['Project Gutenberg','Open Library','Google Books','Wikisource','Internet Archive','OAPEN','DOAB','Europe PMC','ERIC','NCBI Bookshelf','arXiv','DOAJ','Wikibooks','Wikiversidade','Library of Congress','Gallica · BnF'],
    googleBooksKeyConfigured:Boolean(process.env.GOOGLE_BOOKS_API_KEY)
  });
}
