# Maple 2027 — curadoria e reaproveitamento

**Diretriz:** priorizar os melhores recursos existentes, preservando o que já funciona. Refatoração é exceção motivada por privacidade, portabilidade, correção ou integração; não é um objetivo em si. Não reproduzir conteúdo de produtos comerciais nem dados escolares privados.

## Matriz de prioridades

| Componente | Destino | Estratégia | Estado |
|---|---|---|---|
| Motor de handouts, listas e impressão | tools/generators, templates | Preservar implementações maduras, dependências e contratos; comparar versões antes de alterar | Primeiros módulos em revisão |
| Tipografia matemática offline | tools/rendering, assets | Um único motor para papel e projeção; conservar versões e avisos de terceiros | Helper idêntico nas duas origens; pacote ainda não importado |
| Figuras matemáticas | tools/geometry | Reaproveitar as APIs existentes; evitar duas bibliotecas concorrentes | A revisar |
| Modo Aula e projeção | apps/classroom | Preservar lousa, tinta, PDF, relógio e ferramentas; retirar conexões privadas | A revisar |
| Motor de aula em etapas | apps/lessons | Reaproveitar separação entre dados de aula, renderização e validação; ajustar à aula presencial sem impor a sequência de um curso autônomo | A revisar |
| Manipulativos | apps/simulators | Preservar gestos matemáticos, previsão, experimentação e transferência; primeiro exemplo independente de volumetria | Protótipo em revisão |
| Treino de cálculo | apps/practice | Reaproveitar geradores e conferência; retirar vínculos com produtos e revisar direitos de conteúdo | A revisar |
| Planejamento e percurso | materials, templates | Consolidar a prática docente existente | A revisar |
| Habilidades e pré-requisitos | docs, materials | Usar o método de mapeamento, não impor um currículo comercial a uma escola | A revisar |
| Diagnóstico, erros e feedback | API privada e materiais genéricos | Distinguir exposição, tentativa, resolução, transferência, retenção e autonomia; validar indicadores | A revisar |

## Método de adoção

1. Identificar a versão de origem e suas dependências; manter rastreio detalhado em ambiente privado.
2. Separar implementação em uso, protótipo e proposta. Mais recente não significa mais madura.
3. Reutilizar código autorizado e já validado quando possível. Alterar apenas o necessário; justificar diferenças.
4. Verificar direitos de cada material, dependência e identidade visual; não copiar recursos de terceiros com licença individual.
5. Testar com dados fictícios, matemática conferida e renderização em papel ou navegador conforme o caso.
6. Registrar o estado real no catálogo e evitar deploy ou migração de dados durante a curadoria.

## Princípios de integração

- Uma fonte de verdade para cada motor reutilizado.
- A aula presencial é o produto: a ferramenta digital complementa a explicação, o papel, a prática e a investigação.
- Conteúdo e layout independentes quando já existir um contrato funcional.
- A revisão de uma atividade inclui a primeira decisão matemática do estudante e a transferência para outro problema, não apenas acerto final.
- A API de dados privados e o fluxo documental seguem o ADR 001. A aplicação pública permanece sem acesso a registros reais.

## Primeiro exemplo

O [protótipo de volumetria](../apps/simulators/volume/index.html) reutiliza uma atividade independente existente, com ajuste apenas dos rótulos de identidade. Não é uma aplicação integrada nem um modelo visual aprovado. Ver o [README do exemplo](../apps/simulators/volume/README.md) para limitações e verificação.

## Incremento de produção de materiais

Veja [inventário e contratos do motor de materiais](materials-engine.md) para o estado de adoção, dependências e limitações dos primeiros módulos.
