# Produção pedagógica assistida por agentes

A aula é o produto. O agente escolhe a experiência antes de escolher o arquivo. A regra de reaproveitamento vem antes da produção nova.

## Fluxo de produção e revisão

1. Entrada: disciplina, nível, unidade, objetivo, pré-requisitos, tempo e evidência esperada. Consultar o plano autorizado, sem inferir turmas ou calendário.
2. Ficha curta: registrar pergunta/erro provável, decisão que o estudante toma, recurso existente, exemplo/contraexemplo quando pertinente, prática e fechamento. Aprovação explícita do professor para mudança curricular, nova mecânica ou lote de atividades; não parar para pedir aprovação de rotina já autorizada.
3. Produção: conteúdo separado do motor. Selecionar material existente e conferir direitos. O handout presencial não é roteiro nem texto autoinstrucional.
4. Conferência automática: estrutura, opções, operações numéricas, referências, consistência do artefato. Não confundir ausência de erros com gabarito certo.
5. Revisão matemática independente: entregar enunciados sem gabarito/comentário a outro revisor; registrar resolução e divergências. Resolver discordância pela matemática, não por votação.
6. Revisão pedagógica: a decisão é genuína? O erro é plausível? A transferência exige a habilidade? O recurso antecipa a resposta? Há tempo de tentativa? A evidência permite decidir o próximo passo?
7. Validação visual e funcional: abrir PDF/HTML no ambiente final, conferir desktop/celular/projeção/impressão conforme uso. Guardar screenshots sintéticos quando apropriado.
8. Aprovação e publicação: professor revisa o conteúdo; publicação somente autorizada, sem dados reais nem conteúdo restrito. Nenhum agente promove estado por conta própria.

## Particularidades

| Frente | Padrão de referência | Evidência |
|---|---|---|
| Matemática HS | Handout forte e listão graduado por conteúdo quando adequado; papel como quadro parcialmente construído, aplicação antes de teoria extra | Resolução, argumento, comparação de estratégias, caderno de percurso conforme plano |
| Entrepreneurship | Caso ou decisão antes do conceito; deck de condução quando útil; modelo legível e workshop com produto concreto; transferir ao venture quando previsto | Decisão justificada, artefato de equipe, rubrica conforme plano |
| Olimpíadas | Proposta inicial: famílias de problemas e estratégias, tentativa sem dica prematura, comparação de soluções e generalização | Solução fundamentada, condição de validade, revisão de erros e problema de transferência |

As regras de olimpíadas são proposta, não currículo aprovado. Idioma, categoria, programa e avaliação são definidos pelo plano autorizado. Não impor múltipla escolha a toda investigação, nem slides a toda aula HS.

## Atividades digitais em etapas

Preservar via → ponto → tela → item. O perfil técnico inicial usa Mexer, Quadro, Praticar, Topo; Ver é opcional pedagogicamente, mas vídeo ainda não homologado. Palpite sem correção imediata, retomada explícita, gesto que exige decisão, contraexemplo respondido quando pertinente, feedback específico ao erro, exemplo linha a linha, prática de transferência, verificação sem dicas. O estudante pode avançar sem ser bloqueado, salvo entrega final do Topo. Os tamanhos fixos das aulas comerciais não se tornam regra geral. Neste perfil técnico, 4–12 pontos e Topo de 1–6 questões são limites de compatibilidade, não padrão para qualquer aula.

Estados: rascunho (produzido), conferida (checagem automática + revisão independente), revisada (aprovação pedagógica do professor), no ar (publicação efetiva). O estado não é inferido de CI verde. Ficha técnica demo não é aula homologada.

## Ferramentas

- Modo Aula, Oficina da Conta e atividades interativas: reutilizar hosts e motores existentes; evitar cópias por disciplina.
- `node apps/activities/conferir.mjs apps/activities/lessons/demo-proporcao.json`: conferência do perfil local adaptada do verificador existente.
- `node apps/activities/revisao.mjs prova apps/activities/lessons/demo-proporcao.json`: extrai questões sem gabarito; modo comparar recebe respostas. Não é revisor independente.
- `node apps/activities/build-demo.mjs`: gera a fixture JS de uma fonte JSON única. `--check` detecta divergência.
- O validador inicial restringe tipos e assets; não habilitar conteúdo arbitrário, fórmulas, links ou dados reais. Revisar tipos adicionais separadamente.
- Motor de handouts e dependências de impressão continuam pendentes de homologação. Não declarar PDF pronto por existir HTML.

## Ficha mínima

Disciplina / nível / unidade / objetivo / pré-requisitos / pergunta inicial / erro provável / gesto e decisão / recurso / contraexemplo quando pertinente / prática de transferência / evidência / fonte e direitos / logística / revisão.

Registros privados do plano, estudante ou equipe pertencem ao ambiente privado autorizado; o repositório público contém somente os modelos genéricos e materiais explicitamente publicáveis.
