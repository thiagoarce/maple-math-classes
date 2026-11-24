# Murais e jogos — migração prioritária

## Murais
Fonte: guia_murais.md (c0fd14d), wall-architecture.md (4f12b90), mural_lib.py (bc0c195), svg_mural.py (17e4d44). Preservar seis eixos independentes: função, tier A/B/C/T, ciclo de vida, interação, papel espacial e autoria. A arquitetura original diferencia Mapa de Cabeça, objetivos, consulta, referência permanente, checklist, Unit Journey com trilhas e marcadores magnéticos, word wall e trabalhos de estudantes. Anchor charts, fluxos e linhas do tempo são formatos de co-construção, não handouts ampliados. Não importar calendários, turmas, trabalhos reais ou imagens sem direitos.

Primeiro núcleo recuperado: tools/rendering/svg_mural.py, quatro figuras determinísticas (polígonos inscritos, diagonais do paralelepípedo, Cavalieri e distributiva). Testes XML e raio dos polígonos na CI. Próximos: mural_lib.py, mural_grande.py, mural_consulta.py, mural_plano.py, checar_mural.py, checar_pilha_mural.py, fontes autorizadas e prova de impressão A3/A2. Nenhum mural completo homologado ainda.

## Jogos do Module
| Jogo | Experiência | Estado |
|---|---|---|
| Greenwashing | decisões, fact-check, fiscalização | inventariado |
| Impact Tank | social enterprise, pitch, investimento e impacto | inventariado |
| Launch Day | canal, tecnologia, financiamento, equipe, pesquisa, eventos e custos | núcleo recuperado |
| Town Hall | negociação, comunidade, empresa e votação | inventariado |

Launch Day, origem worker/launch_logica.js f6516aa: core em memória, cinco rodadas, escolhas secretas até revelação, custos recorrentes, eventos e fechamento. Teste de estados com equipes fictícias passou em JS isolado. Remove referência histórica escolar, sem worker/KV/roster. Não é jogo em rede nem fronteira de autorização; entradas não confiáveis, papéis e projeção de nomes precisam revisão. Host/controle, sincronização, autenticação e interface pendentes. Impact Tank tem casos locais que exigem revisão factual; demais bancos exigem curadoria e direitos. Escalada: Oficina já migrada; Decorei Essa Fórmula, manipulativos e desafios ainda candidatos. Prioridade: um mural A3 impresso e uma sessão de jogo fictícia completa.

## Main
Checkpoint c70bf00 integrado em 346a12a, exatamente a árvore aprovada no run 45465137735. Piloto posterior falhou em paginação apertada no run 45465539106: redistribuído em 3 páginas de aluno, 2 de gabarito, preservando seis questões. CI pendente; sem deploy.
