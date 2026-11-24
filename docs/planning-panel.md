# Painel docente — perfil demonstrativo

Reaproveita o contrato dos cards do Module: objetivo, roteiro, recursos, tarefa e rotina, complementados por critérios de sucesso e evidência. A função de formatação de blocos vem de painel_formatacao.js (blob 25d5014); o host e o contrato JSON são novos por necessidade de separar o antigo DOM acoplado a turmas, diário, reservas e armazenamento. A página original painel_semanal.html estava vazia no acervo consultado; o gerador build_painel_semanal.py contém regras datadas e integrações privadas, não foi copiado. O painel pedagógico de alunos também não foi importado.

Três encontros fictícios, filtro por disciplina e nível, validação da unidade e da soma exata dos tempos, modal de planejamento, rotina, recursos e preparação de texto para Toddle. Não escreve no clipboard automaticamente nem publica no Toddle. O texto mantém as cinco seções principais do exportador anterior e acrescenta rotina, sem inventar QD, passaporte ou política de avaliação vigente. O link Modo Aula abre somente a demonstração atual; não transmite plano/slot/contexto. Nenhum cadastro, horário real, notas, tokens, persistência ou API. O painel não é um editor nem agenda operacional. O JSON não é formato de importação de dados reais. Os catálogos são inventários candidatos, não currículo confirmado.

Execução: servidor HTTP local na raiz, abrir apps/planning/. Validação: node tests/test_planning.mjs e python tests/test_planning_browser.py. Ainda pendentes a execução no novo commit, revisão visual, integração segura de manifesto, autorização, D1 e Drive.

## Próxima fronteira

O painel privado deverá resolver ofertas e encontros de um calendário autorizado, associar unidades por ID, usar referências Drive privadas e separar planejamento de evidência individual. A API deve validar autorização por oferta/escopo antes de qualquer leitura ou escrita. A aplicação pública não recebe binding D1 privado. Não usar localStorage ou cópia de DOM com HTML para transportar plano privado. O contrato real de manifestação e integração Toddle precisa de revisão própria; exportação manual não equivale a integração.
