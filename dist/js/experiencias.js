const carregarEstilo=(href)=>{
 const existente=[...document.querySelectorAll('link[rel="stylesheet"]')].some(x=>x.getAttribute('href')===href);
 if(existente)return;
 const link=document.createElement('link');
 link.rel='stylesheet';
 link.href=href;
 document.head.append(link);
};

carregarEstilo('/css/experiencias.css?v=20260917x16');
carregarEstilo('/css/correcao-lateral.css?v=20260917l16');

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
 await carregarModulo('./modulos-lazy-mobile.js?v=20260917lazy1','Carregamento sob demanda');
 await carregarModulo('./mobile-dialog-fix.js?v=20260917mob4','Correção de navegação mobile');
 await carregarModulo('./finalizacao-biblioteca.js?v=20260917f7','Interface final da Biblioteca Livre');
}

iniciar();
