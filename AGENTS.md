# Instruções para agentes e colaboradores

## Antes de trabalhar

Leia o README, o [padrão pedagógico](docs/pedagogy.md), a [política de publicação](docs/publication.md), a [arquitetura](docs/architecture.md) e o [catálogo](docs/catalog.md). Consulte os ADRs antes de mudar decisões estruturais. Para trabalho curricular, leia também [organização por disciplina](docs/subject-organization.md) e o README da frente correspondente.

## Regras não negociáveis

- Este repositório é público em todas as branches, inclusive PRs em rascunho. Nunca use uma branch pública como área de triagem de dados privados.
- Não espelhe repositórios, históricos, painéis ou bancos de origem. Trabalhe com seleção explícita de arquivos, revisão prévia e commits novos.
- Não grave dados reais, identificadores, observações, notas, frequências, documentos personalizados, credenciais ou links privados em código, comentários, fixtures, logs, exemplos ou artefatos.
- Exemplos e testes devem usar dados totalmente fictícios e não derivados de casos reais.
- Quando precisar de contexto individual, consulte somente o necessário no canal privado autorizado; produza e salve o resultado em ambiente privado. O conector não é autorização institucional por si só.
- Não introduza conteúdo de terceiros, marcas, livros, fontes ou imagens sem verificar direitos e registrar a licença aplicável.
- Não faça deploy, configure credenciais ou migre dados reais implicitamente durante uma tarefa de documentação ou desenvolvimento.

## Processo de trabalho

1. Identifique o objetivo pedagógico ou técnico, o escopo e os critérios de conclusão.
2. Inspecione conteúdo, dependências transitivas e arquivos gerados antes de qualquer publicação.
3. Separe núcleo genérico de adaptadores e infraestrutura privada.
4. Implemente a menor mudança coerente; acrescente exemplos fictícios e testes adequados.
5. Verifique matemática, comportamento, renderização e privacidade conforme o componente.
6. Atualize documentação e catálogo. Declare limitações e testes não executados; não marque como pronto algo apenas planejado.

## Organização curricular

- Identifique primeiro a disciplina, depois nível curricular e unidade ou família de problemas. Não confunda nível com turma real.
- Mantenha material autoral reutilizável na disciplina; ferramentas genéricas em tools, templates e apps. Referencie recursos compartilhados em vez de duplicá-los.
- Não suponha distribuição de turmas, calendário, programa oficial ou pesos avaliativos de um novo ano. Consulte fontes autorizadas e registre decisões operacionais no ambiente privado.
- Preserve os métodos particulares de cada frente. Não force o padrão de handout de Matemática HS em Entrepreneurship ou olimpíadas.

## Critérios pedagógicos

A aula é o produto; materiais são meios. Preserve a construção matemática, a autonomia do professor e o tempo de resolução dos estudantes. Handouts de acompanhamento não devem virar roteiro de fala. Não invente regras curriculares, prazos ou critérios de avaliação.

## Revisão e rastreabilidade

Use branches e PRs pequenos, com descrição de escopo, proveniência publicável, validação, pendências e riscos. Registros de auditoria que contenham detalhes restritos devem ficar fora do repositório. Nunca publique uma amostra privada para depois apagá-la.

## Produção assistida por IA

Leia [processo de produção e revisão](docs/production-workflow.md) antes de criar aulas, handouts, avaliações ou atividades. Mantenha ficha, conteúdo, motor e evidências distintos. Não confunda CI verde com aprovação pedagógica; a mudança de estado exige os critérios do fluxo. Não recrie recurso existente por conveniência. As normas de disciplina prevalecem sobre preferências genéricas de formato.
