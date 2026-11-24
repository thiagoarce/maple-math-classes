# Motor de materiais — adoção incremental

A prioridade é conservar o código funcional e os contratos já usados em aulas, com ajustes mínimos de publicação. Nenhum arquivo de exercícios comerciais, timbrado, cadastro ou configuração de produção é incluído neste incremento.

## Componentes selecionados

| Componente | Estado | Contrato e dependências |
|---|---|---|
| [aquecimento.py](../tools/generators/aquecimento.py) | Copiado, revisão pendente | Biblioteca padrão Python; para_slug, html e linhas_gabarito |
| [dedup.py](../tools/validation/dedup.py) | Copiado, revisão pendente | Biblioteca padrão Python; assinaturas por texto, fórmulas e imagens |
| [paginador_handout.js](../tools/rendering/paginador_handout.js) | Copiado, integração pendente | DOM e CSS do handout; aguarda MathJax quando presente |
| [handout_lib.py](../tools/rendering/handout_lib.py) | Código em revisão; runtime pendente | Identidade, paginação e composição compartilhadas; timbrado opcional explícito |
| gerar_lista_exercicios.py | Não copiado | handout_lib, aquecimento, dedup, padrões de questões e acervo; separar fontes de questões autorizadas |
| lista_layout.py e paginador.js | Não copiados | lista_fluxo, CSS de impressão e contrato de duas colunas; transportar em conjunto |
| [ma_math.js](../tools/rendering/ma_math.js) | Helper copiado; runtime pendente | Mesmo blob original nas duas origens; pacote local 4.1.3 necessário |
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

## Integração do núcleo de handouts

Os quatro módulos de renderização agora ficam junto de paginador_handout.js. As funções originais de blocos, tabelas, matrizes, exemplos, páginas e CSS foram mantidas. O argumento opcional letterhead_path de build() permite fornecer imagem local autorizada; sem ele, o fundo é branco. As margens originais continuam por compatibilidade, não como novo padrão visual aprovado. Use apenas HTML e imagens locais confiáveis; o motor não sanitiza entradas e o timbrado fornecido é incorporado ao resultado. Nunca publique resultados privados.

O conversor topdf preserva o fluxo HTML/PDF, mas usa arquivo temporário para não reportar PDF antigo como novo e não desabilita o sandbox do navegador. A contagem de páginas original é heurística; não substitui um parser PDF.

### Dependências ainda não instaladas

- MathJax 4.1.3: mathjax@4.1.3, @mathjax/mathjax-fira-font@4.1.3 e @mathjax/mathjax-euler-font-extension@4.1.3. O manifesto tools/rendering/mathjax-runtime.json registra os 70 arquivos JS esperados e seus hashes Git. Não é um instalador nem comprovação de licenciamento. Obter pacotes oficiais, conferir avisos Apache/OFL e a correspondência dos arquivos antes da publicação. Os paths esperados são mathjax/v4.1.3/{fira,euler,tex-extensions}. O build falha antes de gerar se faltar algum arquivo requerido. A checagem atual é de presença, não de integridade; validar hashes na instalação.
- Instrument Sans Regular/Bold e demais faces declaradas em identidade.py: obter de fontes oficiais e incluir avisos individuais. Nenhum arquivo de fonte foi copiado. A ausência das faces editoriais implica fallback e exige nova validação de paginação.
- Chrome ou Chromium instalado localmente e autorizado para execução. A geração PDF pode retornar None; a execução e os gates de impressão ainda não foram homologados. O helper matemático mantém a desativação de attachSpeech do original; acessibilidade precisa de validação própria.

Neste incremento: comparação de código, inspeção estática, adaptações pontuais e conferência de arquivos publicados. Sem teste executado de Python, JavaScript, PDF ou navegador. Não usar como pipeline de produção até completar dependências e testes offline.

## Homologação inicial do papel

Recuperados os módulos de composição e paginação de listas (perfil local sem CLI legado). Os dois paginadores agora aguardam MAMath e fontes, sem medir TeX cru após falha. Instalador local dos três pacotes npm 4.1.3 verifica os 70 blobs originais antes de montar a árvore e recolhe avisos de licença diretamente dos pacotes; runtime e fontes não são commitados. Licenças recolhidas ainda exigem revisão antes de redistribuir. A fixture autoral usa handout com duas construções e lista de 12 itens, gabarito separado e identidade sintética. A CI gera PDF A4 somente depois de prontidão matemática e paginação, confere tamanho, contagem, itens e erros, e guarda rasters. O teste usa fontes fallback, não prova fidelidade tipográfica nem Safari. Ainda não executado no novo commit. O gerador completo de listas e conversor topdf CLI ainda não homologados.

Comandos: npm --prefix tools/rendering/math-runtime install --ignore-scripts; python tools/rendering/install_math_runtime.py; PYTHONPATH=. python tests/generate_materials_demo.py; iniciar servidor local na raiz e executar python tests/test_materials_browser.py com Playwright/Chromium e PyMuPDF instalados.
