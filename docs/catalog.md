# Catálogo e roadmap

Este catálogo descreve componentes planejados, não instalações existentes. Uma entrada só passa a disponível após publicação revisada, testes aplicáveis e documentação de uso.

| Componente | Destino previsto | Estado | Critério de entrega |
|---|---|---|---|
| Fundação documental | `docs/` | Em revisão | Políticas, arquitetura, metodologia e roadmap coerentes |
| Figuras matemáticas | `tools/geometry/` | Plano cartesiano inicial em revisão | Núcleo independente, exemplos e testes matemáticos |
| Handouts | `templates/handouts/` e `tools/generators/` | Planejado | Exemplo autoral, impressão e validação |
| Listas e paginação | `templates/worksheets/` e `tools/generators/` | Planejado | Gabaritos, progressão, impressão correta |
| Slides | `templates/slides/` | Planejado | Condução e notas do professor separadas |
| Modo Aula | `apps/classroom/` | Planejado | Lousa e recursos genéricos, sem acesso a dados privados |
| Jogos e simuladores | `apps/games/` e `apps/simulators/` | Planejado | Experiências independentes e testadas |
| Acervo de matemática | `materials/` | Planejado | Curadoria autoral por nível e tema |
| API e persistência privadas | Camada separada | Planejado | Schema sintético, autorização, testes e plano de migração |

## Ordem inicial

1. Aprovar a fundação documental.
2. Extrair um pequeno componente de figuras matemáticas e validar todo o processo de publicação.
3. Ampliar a biblioteca de representações e construir o primeiro handout autoral de referência.
4. Evoluir os geradores e validações por incrementos.
5. Separar o Modo Aula de integrações administrativas; publicar uma versão genérica.
6. Curar o acervo, jogos e simuladores.
7. Desenvolver e validar a arquitetura de dados privada antes de qualquer transição real.

O trabalho técnico e a curadoria podem avançar separadamente, desde que respeitem os limites de publicação. Mudanças de prioridade devem atualizar este documento.
