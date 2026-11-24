# Oficina da Conta — treino local

Reaproveitamento do gerador e do ciclo de treino da Escalada: tentativa, resposta, caminho curto e revisão. 25 famílias em 8 grupos. Sem identificação, armazenamento persistente ou API. A fila e os totais pertencem somente à sessão atual; não são medidas de domínio curricular. As três disciplinas poderão selecionar famílias pertinentes; não se presume currículo de 2027.

Abra apps/oficina/ por servidor HTTP local. O host e o CSS mínimos são novos; o gerador e o fluxo foram preservados, retirando códigos de produto, provas, links para desafios comerciais e avatar. A versão completa de “Os meus jeitos” não foi importada. A entrada aceita fração, vírgula decimal e agrupamentos de milhares; ponto seguido de três dígitos tem interpretação brasileira de milhar. Percentuais são valores em pontos percentuais quando a pergunta pede %. Não é ferramenta de avaliação somativa.

Ajustes matemáticos pontuais: feedback de porcentagem genérico usa 1%; equação com denominador mantém o segundo membro exato em fração. Conferência de 75000 amostras: campos finitos e resposta exibida compatível com o gabarito. Essa conferência não resolve independentemente os enunciados nem prova todas as variantes; revisão matemática e teste de navegador são necessários.

## Testes reproduzíveis

`node tests/test_oficina.mjs` usa o conferidor original adaptado ao parser novo. O teste `tests/test_oficina_browser.py` verifica tentativa inválida, erro, feedback, fila de revisão, acerto na revisão, desistência e reinicialização anônima em viewport móvel. A CI existente inclui esses testes; seu resultado deverá ser consultado por commit. Não se registram respostas em armazenamento persistente.
