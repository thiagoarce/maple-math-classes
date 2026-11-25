# Direção visual de murais — Mapa de Cabeça e goldens

Decisão editorial confirmada pelo professor: Andaime Aberto é legado para parede; não é base para novos murais. A Escalada desenvolveu a linguagem que já havia substituído o Andaime no Module. Não tratar essa evolução como adição de skins ao motor antigo.

## Fontes de referência recuperadas

- Module: materials/_mural/guia_murais.md (c0fd14d), seção “Qual filosofia governa a parede (a partir de 18/08)”.
- materials/_mural/mapa_de_cabeca.md (478d2ea): filosofia de memória, chamada larga, miolo econômico, hierarquia semântica, física da leitura e liberdade de composição.
- materials/_mural/golden-samples.md (7950052), GS-01: frozen visual-language sample.
- materials/_mural/pyramids-golden-sample-v1/gerar.tex (733b78e), PDF original (9edee37). Inspecionado o código TikZ, não a imagem do PDF.
- materials/_mural/consultation-golden-sample/README.md (63d8a12): consulta próxima, decisão, não hero monumental.
- materials/_padrao/mural_consulta.py (4c1d2ea): implementação HTML do vocabulário do golden.
- Escalada: impulso.css dc2afa2, quadro-leve.css 7294cab, mapa-visual.html 13e8bdc; GEO b9c8850 já recuperado na Maple. Usar como repertório complementar, não marca ou template.

## Norma para novas peças

A escolha começa pela função: referência permanente lembra uma relação; consulta resolve uma dúvida de procedimento; trajetória mostra progresso; trabalhos registram autoria. Goldens congelam linguagem e função, não coordenadas. GS-01 caracteriza título-papel levemente inclinado, sombra sólida deslocada, retícula discreta, uma figura matemática dominante, fórmula-hero, cores de função, anotações externas conectadas a âncoras semânticas e diagramas de apoio subordinados. Usar assimetria controlada e respiro; evitar grade de caixas equivalentes e faixas chapadas dominando o miolo. Não forçar hero monumental em consultation. A cor da disciplina identifica; a cor interna explica. Matemática Euler via MathJax local, com precisão e leitura física. Verificar fit depois de renderização, incluindo caixas e sombras. Reflow antes de shrink. Nenhuma decoração que imite notação. Critério pedagógico de memória: reconstrução pelo aluno; não declarado aprovado sem uso real.

mural_lib.py e mural_grande.py permanecem para compatibilidade e funções específicas, não são autoridade estética. A3 antigo não deve ser adotado como padrão de produção nova. Mural_consulta.py já é a base HTML da gramática GS-01; ampliar primitivas somente quando uma função exigir. Não reescrever golden histórico nem transferir fonte proprietária ou PDF privado sem direitos.

## Checkpoint

PR anterior a210ffb tentou enriquecer o Andaime via repertorio=True. Run 45531815913 falhou no teste de caixas do novo A3; essa direção foi abandonada, não considerada homologada. Este commit parte da árvore main 2e6f1ef preservando o histórico de commits, descarta as novas skins e cópias de assets e conserva GEO (sem duplicação). Nova peça sintética GS-01 de inclinação 891×630 mm usa título, figura GEO, fórmula Euler, anotação e alerta. Teste de dimensão física, limites, MathJax, sombra e inclinação preparado; CI e inspeção visual pendentes. Não é reconstrução exata de GS-01 nem aprovação do docente. Outros goldens por função ainda devem ser recuperados.
