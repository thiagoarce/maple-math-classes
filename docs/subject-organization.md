# Organização por disciplina — Maple 2027

O projeto atende três frentes de ensino: Matemática HS, Entrepreneurship e Olimpíadas. A disciplina é o ponto de entrada curricular; o nível é uma dimensão independente da turma concreta. Esta estrutura não define as atribuições de 2027.

## Estrutura

- subjects/hs-mathematics/ — matemática do Ensino Médio.
- subjects/entrepreneurship/ — empreendedorismo.
- subjects/olympiads/ — preparação olímpica.
- tools/, templates/, apps/, assets/ — infraestrutura e recursos compartilhados.
- materials/ — acervo transversal quando não houver uma frente responsável.

Cada frente possui um README e, à medida que os conteúdos forem revisados, pode ter curriculum/, levels/, assessments/ e projects/ quando pertinentes. A sequência curricular pode apontar para recursos em outra unidade ou para uma ferramenta compartilhada. Não criar subpastas vazias por obrigação.

## Nível, disciplina, oferta e turma

Disciplina é a frente pedagógica. Nível identifica um estágio curricular (por exemplo, um Year no HS ou uma categoria de treinamento olímpico). Uma unidade, tema ou família de problemas é conteúdo reutilizável. Ano letivo, turma, horários, grupos e ofertas concretas de disciplina são registros operacionais privados. A turma pode participar de várias disciplinas; uma disciplina pode ser ofertada a várias turmas e níveis.

Não codificar a distribuição de aulas de 2027 a partir de dados de anos anteriores. Os exemplos de níveis são ilustrativos, não atribuições confirmadas.

## Materiais e planejamento

A frente possui o currículo de referência e seus recursos revisados. O planejamento de uma turma e ano específicos usa referências a esses recursos, registra datas e adaptações no ambiente privado e não duplica a biblioteca inteira. Avaliações futuras, gabaritos restritos, nomes de estudantes, adaptações individualizadas e registros reais não entram no Git público.

## Regra de reaproveitamento

O núcleo de renderização, matemática, impressão, lousa, jogos e manipulativos permanece compartilhado. Antes de criar uma versão local à disciplina, verificar se a necessidade é de conteúdo, configuração ou uma capacidade reutilizável do motor. Cada disciplina conserva seus próprios métodos de ensino e avaliação.

## Próximo passo

Inventariar os recursos existentes das três frentes e confirmar as ofertas e níveis efetivos de 2027 antes de preencher o mapa curricular. Não implantar banco ou mover dados reais nesta etapa.

## Inventário candidato de 2027

A primeira curadoria, baseada nos nomes das pastas temáticas de Matemática HS e nos títulos das unidades e recursos de Entrepreneurship do acervo anterior, identifica 20 famílias de Matemática HS e 9 temas de Entrepreneurship. A sequência anterior de preparação olímpica documenta 5 famílias de treinamento: exemplos/generalização, paridade, contagem organizada, escrita para a banca e simulados. Não foi feita inspeção integral de cada material. Não se reproduzem horários, planos avaliativos, questões de livros, provas ou informações de participantes. Os nomes Y10/Y11/Y12 e N1/N2/N3 são categorias de referência históricas, não alocações 2027; as ligações históricas indicam presença do tema em pastas ou sequência, não aula efetivamente dada. Entrepreneurship não tem nível atribuído neste inventário. A lista de temas não afirma cobertura integral ou sequência oficial. Agrupamentos e IDs são decisões organizacionais novas.

A unidade possui ID estável, título, temas, níveis históricos, status e referências opcionais a recursos públicos existentes. A oferta futura usa o ID em registro privado, com nível, ordem, objetivos e datas autorizadas. `subjects/shared-resources.json` cataloga componentes transversais; sua associação a uma disciplina indica possibilidade de reaproveitamento, não aprovação curricular. Validar com `node tests/test_curriculum_catalog.mjs`. Os próximos lotes devem selecionar materiais autorais específicos, verificar conteúdo e direitos antes de publicar, e só então atualizar o estado. Não copiar pastas inteiras.
