# Modo Aula — reaproveitamento e integração

O Modo Aula é uma ferramenta transversal de condução presencial para Matemática HS, Entrepreneurship e Olimpíadas. O painel prepara a aula; a superfície de projeção recebe apenas conteúdo explicitamente projetável. Não transportar o painel administrativo inteiro.

## Núcleos iniciais

- apps/classroom/core/object_geometry.js: geometria de seleção e transformação de tinta vetorial, preservada integralmente.
- apps/classroom/core/calculator.js: avaliador aritmético extraído do módulo existente, sem interface, persistência, rede ou comunicação entre janelas.
- tests/test_classroom_calculator.cjs: suíte original adaptada ao caminho novo. Executar com Node. O parser mantém suas limitações de validação de entradas; não é homologado para uso avaliativo.

## Componentes a recuperar em conjunto

| Grupo | Função | Dependência e fronteira |
|---|---|---|
| Casca e manifesto | Abrir a aula pronta, prateleira e guia | Adaptar contrato de recursos; excluir descoberta administrativa |
| Lousa, tinta, seleção e objetos | Escrita, transformação e ferramentas | Preservar modelo vetorial e fingerprints; revisar IndexedDB |
| PDF e slides | Renderização, navegação, anotações | PDF.js local, sincronização e dependências; não importar documentos privados |
| Espelho | Tela do professor separada da projeção | Mensagens validadas, estado projetável mínimo, testes com duas janelas |
| Temporizadores e calculadora | Apoio durante a aula | Estado local, sem cadastro; projeção deliberada |
| HTML e links | Manipulativos, atividades e recursos remotos | Iframes com política de origem e protocolos; não projetar tokens, links privados ou dados de estudantes |
| Salvamento e exportação | Sessões de escrita e arquivos | Local primeiro; armazenamento privado opcional e explícito |

Não copiar módulos de roster, diário, faltas, notas ou integrações escolares existentes. Não publicar manifestos reais nem exemplos que reproduzam turmas. O sanitizador de recursos da origem não é uma barreira de autorização.

## Integração com motor de aulas em etapas

O motor existente de aulas recebe JSON em window.AULA e utiliza ganchos opcionais de plataforma em window.AULA_PLATAFORMA. O modo sem esses ganchos mantém o protótipo sem envio de respostas. Há dependências de DOM, CSS, figuras e GEO, além de textos e lógica de produtos comerciais. Portanto, não é um arquivo autossuficiente nem pode ser importado indiscriminadamente.

Primeiro reutilizar manipulativos como recursos HTML independentes no Modo Aula. Depois auditar o molde, o motor de renderização e as dependências para criar uma integração de apresentação presencial sem pagamentos, captação de contatos ou registro de estudantes. Não duplicar o motor ou exigir a sequência de estudo autônomo em todas as disciplinas.

## Aceite

Abrir uma aula sintética, trocar lousa/PDF/HTML, testar escrita e espelho, alternar interação/anotação, verificar offline e confirmar que nenhum dado administrativo chega à projeção. A calculadora precisa de testes de precedência, entradas malformadas, domínio e interface. O teste do motor original foi transportado, mas a suíte Node e testes de navegador permanecem pendentes.
