const FRASE_FINAL='BIBLIOTECA LIVRE · NENHUMA IDEIA É SAGRADA. NENHUMA PERGUNTA É PROIBIDA. O CONHECIMENTO PERTENCE A TODOS.';
function aplicarFecho(){const alvo=document.querySelector('.manifesto-completo .fecho');if(alvo)alvo.textContent=FRASE_FINAL}
document.addEventListener('click',e=>{if(e.target.closest?.('[data-painel="manifesto"]'))setTimeout(aplicarFecho,0)});
new MutationObserver(aplicarFecho).observe(document.body,{childList:true,subtree:true});
aplicarFecho();
