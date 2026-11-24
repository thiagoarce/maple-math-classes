# Catálogo e roadmap

Este catálogo descreve componentes planejados, não instalações existentes. Uma entrada só passa a disponível após publicação revisada, testes aplicáveis e documentação de uso.

| Componente | Destino previsto | Estado | Critério de entrega |
|---|---|---|---|
| Fundação documental | `docs/` | Em revisão | Políticas, arquitetura, metodologia e roadmap coerentes |
| Figuras matemáticas | `tools/geometry/` | Planejado | Núcleo independente, exemplos e testes matemáticos |
| Handouts | `templates/handouts/` e `tools/generators/` | Planejado | Exemplo autoral, impressão e validação |
| Listas e paginação | `templates/worksheets/` e `tools/generators/` | Aquecimento, deduplicação e paginador de handouts em revisão | Gabaritos, progressão, impressão correta |
| Slides | `templates/slides/` | Planejado | Condução e notas do professor separadas |
| Modo Aula | `apps/classroom/` | Planejado | Lousa e recursos genéricos, sem acesso a dados privados |
| Jogos e simuladores | `apps/games/` e `apps/simulators/` | Protótipo de volumetria em revisão | Experiências independentes e testadas |
| Acervo de matemática | `materials/` | Planejado | Curadoria autoral por nível e tema |
| API e persistência privadas | Camada separada | Planejado | Schema sintético, autorização, testes e plano de migração |

## Ordem inicial — Maple 2027

A prioridade é reaproveitar e integrar ferramentas existentes, não reimplementá-las por padrão. Veja o [plano de curadoria](reuse-2027.md).

1. Aprovar a fundação documental e inventariar componentes existentes.
2. Preservar os motores maduros de materiais, tipografia matemática e figuras; avaliar o protótipo cartesiano em revisão antes de ampliar ou substituir APIs.
3. Selecionar manipulativos e o motor de aula por etapas; validar exemplos independentes e adaptação à aula presencial.
4. Integrar o Modo Aula com os recursos existentes, sem duplicar motores.
5. Adaptar treino, diagnóstico e evidências de aprendizagem; curar o acervo escolar.
6. Validar a arquitetura de dados privada antes de qualquer transição real.

O trabalho técnico e a curadoria podem avançar separadamente, desde que respeitem os limites de publicação. Mudanças de prioridade devem atualizar este documento.
