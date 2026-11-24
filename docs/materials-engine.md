# Motor de materiais — adoção incremental

A prioridade é conservar o código funcional e os contratos já usados em aulas, com ajustes mínimos de publicação. Nenhum arquivo de exercícios comerciais, timbrado, cadastro ou configuração de produção é incluído neste incremento.

## Componentes selecionados

| Componente | Estado | Contrato e dependências |
|---|---|---|
| [aquecimento.py](../tools/generators/aquecimento.py) | Copiado, revisão pendente | Biblioteca padrão Python; para_slug, html e linhas_gabarito |
| [dedup.py](../tools/validation/dedup.py) | Copiado, revisão pendente | Biblioteca padrão Python; assinaturas por texto, fórmulas e imagens |
| [paginador_handout.js](../tools/rendering/paginador_handout.js) | Copiado, integração pendente | DOM e CSS do handout; aguarda MathJax quando presente |
| handout_lib.py | Não copiado | identidade.py, CSS, timbrado, assets, helper de matemática e outros componentes; separar identidade institucional sem alterar os contratos de produção |
| gerar_lista_exercicios.py | Não copiado | handout_lib, aquecimento, dedup, padrões de questões e acervo; separar fontes de questões autorizadas |
| lista_layout.py e paginador.js | Não copiados | lista_fluxo, CSS de impressão e contrato de duas colunas; transportar em conjunto |
| ma_math.js | Não copiado | Mesmo blob Git nas duas origens; requer pacote local de MathJax 4.1.3 e revisão de fontes, licenças, avisos e layout de caminhos |
| checar_pdf_sobreposicao.py | Não copiado | Requer PyMuPDF e revisão do contrato de exceções; não detecta toda sobreposição |

## Uso dos módulos Python

A partir da raiz, com Python 3:

```python
from tools.generators.aquecimento import para_slug, html, linhas_gabarito
from tools.validation.dedup import assinatura_texto, iguais

itens = para_slug("prismas")
folha = html(itens)
gabarito = linhas_gabarito(itens)
a = assinatura_texto("Calcule a área total de um prisma retangular com dimensões dadas.")
b = assinatura_texto("Calcule a área total de um prisma retangular com dimensões dadas.")
candidato, motivo = iguais(a, b)
```

O aquecimento usa seis itens parametrizados e sorteio reproduzível. O HTML é um fragmento que depende das classes de estilo da lista (bex, tag, lay); o gabarito é separado. Para tópicos sem template, não inserir aquecimento. Revisar adequação dos pré-requisitos ao currículo efetivamente ensinado.

A deduplicação é heurística: imagem compartilhada, fórmula semelhante ou tokens próximos não demonstram equivalência de questões. Revisar falsos positivos e negativos; não usar MD5 como mecanismo de segurança. Usar somente documentos e caminhos locais confiáveis, em ambiente autorizado; a função de leitura de HTML não é sanitizador nem sandbox.

## Contrato de paginação

O paginador de handout trabalha com páginas .a4, cabeçalhos hd-title/hd-sub/hd-meta, número pgnum, títulos sec, caixas wb e fm-fill. Mede o DOM renderizado, mantém a ordem de conteúdo, escolhe cortes e distribui sobra nas caixas de escrita. Se precisar de mais páginas do que as originais, tenta restaurar a distribuição e sinaliza apertado. Atributos data-paginado, data-paginas, data-sobra, data-estouro e data-gigantes auxiliam inspeção. Sua calibração depende do CSS original; a cópia isolada não é um motor de impressão completo.

## Verificação e pendências

Os três componentes foram inspecionados e transportados com os corpos funcionais preservados; foram resumidos comentários históricos de contexto. Ainda não foram executados testes de Python, navegador ou impressão nesta etapa. O pacote de tipografia será tratado como unidade, sem duplicar versões. O catálogo não marca nenhum componente como homologado.
