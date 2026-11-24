# Motor de atividades em etapas

Reaproveitamento do motor de aulas existente: via → ponto → tela → item. Renderizador, estilo de quadro e GEO vieram da origem; a casca HTML local é nova. O exemplo técnico recorta seis itens autorais de proporcionalidade, não importa a aula integral nem o catálogo de cursos. Não se atribui nível/turma real em 2027.

A sequência de demonstração tem Mexer, Quadro, Praticar e Topo. Ver é opcional quando houver vídeo aprovado, não um requisito de toda aula presencial. Outras disciplinas podem usar apenas os gestos pertinentes, com objetivos e evidências próprios. O resultado do Topo é apenas da tentativa, não prova domínio.

## Execução

Servidor HTTP local na raiz: `python -m http.server 8000 --bind 127.0.0.1`; abra http://localhost:8000/apps/activities/. Nenhum vídeo, catálogo comercial, avatar, fonte externa, login, API ou armazenamento persistente. A CSP impede conexões de rede na página; os scripts e estilos são locais. Ganchos comerciais desativados, marketing removido da interface, som começa desligado. Anotações e dúvidas só existem na memória da página. As fontes usam fallbacks locais. Não usar dados reais.

## Fronteira

Somente dados autorais fixos e revisados. O motor original contém caminhos para HTML de fórmulas, SVG gerado e links de recursos; não é sanitizador de conteúdo arbitrário. Não habilitar upload de JSON/HTML, links externos, avaliação somativa ou integração com D1 antes de validação própria. O molde e conferidor completos ainda não foram migrados; tipos além dos seis itens desta fixture não estão homologados aqui. A biblioteca GEO é preservada para os próximos testes. Revisão matemática independente, teste de navegador e adequação curricular ainda necessários.

A produção continua separando conteúdo do motor, ficha pedagógica da execução e verificação automatizada da revisão matemática. Não duplicar o motor por disciplina.
