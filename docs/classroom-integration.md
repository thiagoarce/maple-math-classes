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

## Verificação inicial do avaliador

Sete casos executados diretamente em JavaScript passaram: precedência, potência associativa à direita, expoente negativo, unário antes de potência, seno em graus, raiz e porcentagem. Foi encontrado um defeito preexistente: `1.2.3` retorna `1.2` em vez de rejeitar a entrada. O parser permanece preservado neste incremento; corrigir e testar a validação antes de integrá-lo à interface. A suíte Node completa e os testes de navegador não foram executados.

## Demonstração local integrada

Abra apps/classroom/index.html por um servidor HTTP estático local na raiz do repositório (python -m http.server 8000; abra /apps/classroom/). Não é deploy nem painel autenticado. O manifesto fixo é inteiramente sintético e oferece questão de investigação e o protótipo de volumetria existente. Não lê manifestos reais ou recursos arbitrários. O iframe tem sandbox sem acesso à origem do hospedeiro; não use dados privados nesta demonstração.

Reaproveitados: casca original, menu Aula, lousas branca e preta, tinta vetorial, laser, borrachas, desfazer/refazer, relógio, cronômetro, temporizador, calculadora flutuante e prateleira. Mantidas as APIs existentes; retirados vínculos com o painel, canais de espelhamento e módulos administrativos. A interface da calculadora usa o núcleo único já extraído. A lousa utiliza IndexedDB local em namespace próprio; demais preferências ficam no armazenamento do navegador. Não há sincronização de dados nem deploy.

Validação: 44 casos de cálculo da suíte adaptada executados diretamente em JavaScript (todos passaram), incluindo regressões para números malformados, notação científica e nomes de funções inválidos. A suíte Node como arquivo não foi executada. Análise sintática dos módulos JS. Ainda não houve teste real de DOM/canvas, navegação, impressão, persistência, toque ou duas janelas; não tratar a demonstração como homologada. O parser ainda merece validação de domínio, gramática e casos extremos. PDF anotável, espelho e dock completo não estão integrados; não oferecer links avulsos ou conteúdo privado até existir fronteira adequada.

## Camada de objetos e instrumentos

Foram incorporados os módulos originais de formas, régua, esquadro, transferidor, seleção múltipla, imagens locais e armazenamento de objetos. A geometria já copiada permanece a fonte única. O carregamento segue a ordem das dependências, após a ponte e a lousa. A demonstração usa exclusivamente o escopo sintético e um banco IndexedDB de objetos separado. Imagens raster locais até 15 MiB; SVG e tipos não previstos são recusados. Inserção fica restrita à lousa ativa. Não carregar imagens ou registros reais em uma demonstração pública. Corrigido o salvamento adiado de instrumentos para capturar o escopo e estado correspondentes.

O código inclui 17 ferramentas de formas e os três instrumentos; a precisão visual dos instrumentos (especialmente após redimensionar, por causa da escala em ambos os eixos), a seleção, recorte, persistência, toque e conflitos de camadas exigem testes reais. Não afirmar que régua e transferidor estão calibrados para medição física. Apenas sintaxe JS e inspeção estática nesta etapa.

## PDF e projeção: inventário de bloqueios

O PDF original depende de dois arquivos locais do PDF.js (pdf.min.js e pdf.worker.min.js, cerca de 1,41 MB juntos), motor pdf_v3, zoom pdf_view_v3, núcleo de tinta e objetos; o carregador original também carrega adaptadores de livros, espelho e salvamento remoto. O motor lê manifesto em localStorage e busca PDF com credenciais same-origin; o módulo pdf_nuvem_v2 acessa /api/modo-aula. Não transportar o adaptador de nuvem ou manifesto administrativo. Definir fixture autorizada, versão/avisos do PDF.js e validação da origem, recurso e fingerprint antes de ativar o host anotável.

O espelho original tem um host próprio e uma ponte presenter; a lousa do projetor lê IndexedDB e recebe eventos de tinta/laser. A página original também usa canais de outras funções escolares. Não publicar esses canais indiscriminadamente. Necessário isolar sessão de demonstração, permitir apenas recursos projetáveis, validar mensagens e impedir que o projetor escreva sessões. A integração de PDF e espelho permanece pendente; nenhuma promessa de funcionamento ou deploy.

## PDF e segunda tela — incremento experimental

O host de PDF e seu motor de tinta/zoom originais foram adaptados para uma fixture local gerada por ReportLab, com chave por folha e fingerprint. Abre em aba separada da prateleira para não enfraquecer o sandbox dos manipulativos. Não há upload de PDF, manifesto administrativo, adaptação de livro comercial ou nuvem. O PDF.js 3.11.174 original tem CVE-2024-4367; escolhemos a versão estável 6.5.438, com importação ESM local, versão fixa e isEvalSupported=false. O runtime não foi instalado nem homologado; instruções em apps/classroom/pdf-runtime/README.md. A API de renderização foi adaptada, mas a compatibilidade precisa ser testada.

A segunda tela reaproveita a renderização read-only original da lousa e a leitura de IndexedDB; uma ponte pequena usa postMessage para enviar apenas estado branco/preto/blackout da janela que abriu o projetor. A tela fecha ou escurece quando o apresentador sai, perde heartbeat ou abre um recurso. O projetor não cria banco nem grava tinta. Sem BroadcastChannel, sem projeção de PDF, HTML, imagens locais, instrumentos, laser ou traço em andamento; espelha apenas os traços persistidos da lousa sintética. A leitura local não constitui autorização ou isolamento forte entre duas janelas da mesma origem: não usar dados reais. Abrir somente um editor por vez.

Aceite pendente: instalar o runtime, gerar fixture, executar o PDF e verificar página 1/2, zoom, escrita, undo/redo, reabertura, fingerprint e backup; abrir a segunda tela, escrever/apagar, alternar fundo e blackout, abrir recurso e fechar o professor. Testar diferenças de resolução e perda de heartbeat. Nenhum deploy, CI ou teste real de navegador realizado.

## Homologação reproduzível

O gate inclui `node tests/test_classroom_calculator.cjs`, `node tests/test_classroom_core.cjs` e `python tests/test_classroom_browser.py` com servidor HTTP local na raiz, fixture gerada e dependências instaladas. O teste de navegador usa Playwright/Chromium e só admite requisições locais. Executa escrita, undo/redo, persistência, segunda janela, blackout, troca de recurso, PDF e mudança de página. A CI proposta roda sem segredos, sem deploy, com token somente leitura. As dependências de homologação Playwright e ReportLab ainda não estão fixadas por lockfile. Não marcar como aprovado antes de um run bem-sucedido no SHA correspondente e verificação visual/toque. Corrigido o caminho de backup de fingerprint: aguardar a gravação antes de limpar a tinta. Falha na renderização inicial não é registrada como sucesso. As operações de histórico da lousa agora esperam estado inicializado.

## Linha de base verificada

O commit 430dfcf passou no Chromium e nos testes unitários em 24/11/2026. Evidência, limites e próximos critérios: [classroom-baseline.md](classroom-baseline.md). As declarações anteriores de ausência de teste refletem o estado histórico anterior a esse run. O gate ampliado deste incremento aguarda execução própria.
