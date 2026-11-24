# Ficha de piloto — produto de matrizes

Caso integralmente fictício, elaborado para demonstrar o fluxo de produção individualizada. Não é um pedido real, não possui estudante identificável nem foi enviado ao Drive.

- Unidade candidata: hs-matrices.
- Objetivo: distinguir produto matricial de produto elemento a elemento e justificar compatibilidade dimensional.
- Evidência sintética: reconhece dimensões, confunde operações.
- Tempo proposto: 25 minutos (5 de retomada, 7 de construção, 8 de contraste e transferência, 5 de saída).
- Experiência: prever dimensões antes de calcular, reconstruir o produto com quadrantes (biblioteca original macete_produto), comparar um contraexemplo de mesma ordem, interpretar um custo total e resolver um novo produto sem apoio.
- Critério de revisão: justificar o tamanho, identificar pares linha-coluna, explicar por que a operação elemento a elemento não representa o produto matricial e transferir a regra a contexto diferente.
- Evidência de saída: questão 6 sem apoio; pedir explicação se o número estiver certo mas a estratégia estiver errada. Não transformar seis acertos em diagnóstico de domínio.
- Fonte: problemas originais criados para a fixture; sem conteúdo comercial.
- Estado: rascunho técnico. Conferência numérica separada por algoritmo e resolução manual documentada abaixo, não revisão cega por outro agente. Aprovação pedagógica, revisão visual final e entrega não ocorreram.

## Resolução manual de referência

1. A tem ordem 2×3, B tem ordem 3×2. AB existe e tem ordem 2×2. BA existe e tem ordem 3×3. O produto elemento a elemento de A e B não está definido no sentido usual (ordens distintas).
2. AB: (1·2+2·0+0·3, 1·1+2·4+0·(-2)) = (2,9); (-1·2+3·0+2·3, -1·1+3·4+2·(-2)) = (4,7). Resultado [[2,9],[4,7]].
3. CD: primeira linha (1·2+2·3,1·0+2·1)=(8,2); segunda (0·2+1·3,0·0+1·1)=(3,1). Elemento a elemento: [[2,0],[0,1]]. Os valores diferem apesar de ambas as operações serem definidas.
4. Quantidades por kit (2,3) e (4,1); custos unitários 5 e 2. 2·5+3·2=16; 4·5+1·2=22. PV tem ordem 2×1; cada linha corresponde a um kit.
5. A afirmação “matrizes da mesma ordem sempre podem ser multiplicadas” é falsa: duas matrizes 2×3 têm 3 colunas na primeira e 2 linhas na segunda. A igualdade interna, não a igualdade das ordens, decide existência.
6. EF = 2·4+(-1)·2+3·(-1)=3, ordem 1×1. A operação elemento a elemento usual não está definida entre E e F.

O algoritmo de teste usa somas de produtos por índices, além de conferir contra o gabarito fixado acima. Não substitui revisão independente. Não há gabarito na folha do aluno. Os resultados da CI são sintéticos, não documentos privados.
