const carregarEstilo=(href)=>{
 const existente=[...document.querySelectorAll('link[rel="stylesheet"]')].some(x=>x.getAttribute('href')===href);
 if(existente)return;
 const link=document.createElement('link');
 link.rel='stylesheet';
 link.href=href;
 document.head.append(link);
};

carregarEstilo('/css/experiencias.css?v=20260917x18');
carregarEstilo('/css/correcao-lateral.css?v=20260917l18');

async function carregarModulo(caminho,nome){
 try{
  await import(caminho);
  return true;
 }catch(erro){
  console.error(`Falha ao carregar ${nome}:`,erro);
  return false;
 }
}

async function iniciar(){
 const mobile=matchMedia('(max-width:900px)').matches;
 await carregarModulo('./modulos-lazy-mobile.js?v=20260917lazy3','Carregamento sob demanda');
 await carregarModulo('./mobile-dialog-fix.js?v=20260917mob5','Correção de navegação mobile');
 if(mobile){
  await carregarModulo('./interface-mobile-leve.js?v=20260917ml1','Interface mobile leve');
 }else{
  await carregarModulo('./finalizacao-biblioteca.js?v=20260917f8','Interface final da Biblioteca Livre');
 }
}

iniciar();
