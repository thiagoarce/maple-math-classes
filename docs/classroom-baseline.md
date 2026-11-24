# Modo Aula 2027 — primeira linha de base verificada

Data: 24/11/2026. Commit testado: 430dfcf5b4f4070d88f618eec504be9056970d87.
[GitHub Actions 45424461503](https://github.com/thiagoarce/maple-math-classes/actions/runs/45424461503), job 138552522113: success.

## Evidência
- 44 casos do avaliador aprovados.
- 47 verificações do núcleo aprovadas: 20 scripts, 3 páginas com referências locais, 17 tipos de forma (dois sentidos de arraste por tipo), 7 verificações do receptor.
- Runtime PDF.js 6.5.438 instalado no runner, Playwright 1.65.2, ReportLab 5.1.0 e Chromium 159.0.8154.6.
- Chromium: escrita, desfazer/refazer, recarga da lousa; duas janelas reais, tinta persistida, fundo e blackout; troca para recurso HTML e ocultação do projetor; PDF, zoom, escrita e mudança de página. Sem erros JS não tratados ou requisições externas registrados pelo teste.

## Escopo de estabilidade
Linha de base técnica para demonstração sintética local, não uma versão de produção nem certificação de segurança. Não houve revisão visual por pessoa, toque, tablet/mesa digitalizadora, perda de energia, desempenho prolongado, exportação PDF consolidada ou autorização para uso de dados reais. A projeção continua limitada à lousa persistida; não espelha PDF, HTML, laser, instrumentos, imagens ou traço vivo. O motor de handouts tem dependências próprias ainda pendentes.

## Próxima cobertura
A ampliação do gate inclui interação da calculadora, desenho de forma, abertura/fechamento da régua, persistência e isolamento de páginas PDF após reload, além de screenshots sintéticos para revisão. Os testes novos não são cobertos pelo resultado acima; exigem nova execução bem-sucedida. Fixadas versões Python observadas no runner; lockfile npm e ambiente integral ainda não são reproduzíveis bit a bit. Ações ainda têm aviso de runtime Node 20 legado.

Não iniciar migração de funcionalidades adicionais nesta frente até verificar o gate expandido. Preservar o commit aprovado como referência; nenhuma alteração em main, deploy ou dado escolar.
