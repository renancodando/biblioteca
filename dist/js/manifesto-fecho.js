const FRASE_FINAL='BIBLIOTECA LIVRE · NENHUMA IDEIA É SAGRADA. NENHUMA PERGUNTA É PROIBIDA. O CONHECIMENTO PERTENCE A TODOS.';
function aplicarFecho(){const alvo=document.querySelector('.manifesto-completo .fecho');if(alvo)alvo.textContent=FRASE_FINAL}
aplicarFecho();
window.BibliotecaManifestoFecho={aplicar:aplicarFecho};
