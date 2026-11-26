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

## Composição A3 recuperada

mural_lib.py (bc0c195) agora usa imports relativos e identidade/topdf existentes, preserva Andaime Aberto, anchor_chart, painel_unidade, cartões, fluxo, linha_do_tempo e moldura/faixa de trabalho. Busca de imagens externas desabilitada até revisão de direitos; SEM_PDF permite impressão somente após gate. Dois espécimes fictícios: Cavalieri com SVG determinístico e área de co-construção, painel de objetivos Customer discovery. Teste de limites DOM, rodapé, A3 e PDF, com raster. Fontes fallback (binários originais não importados), revisão visual e execução CI pendentes. Não inclui ainda mural_grande, mural_consulta, mural_plano ou cinco goldens LaTeX históricos. DEPENDENCIAS.md (32ec9ae) registra decisão de HTML para peças novas e preservação dos cinco geradores históricos LaTeX; não reescrever goldens.

Run 45467703757: Launch Day, SVG e folha do aluno (3 páginas) aprovados nas etapas correspondentes; gabarito foi compactado pelo paginador para 1 página sem alerta e o teste exigia 2. Gate ajustado para aceitar 1–2 páginas no gabarito, sempre com contagem real DOM/PDF, 6 itens e ausência de overflow. Ainda requer inspeção visual. CI global não aprovada nesse run.

## Mural grande, consulta e plano

Fontes: mural_grande.py b7bb30b, mural_consulta.py 4c1d2ea, mural_plano.py b2870b6. Recuperados os dois motores com imports relativos, caminho explícito local de ma_math, impressão bloqueada se medição falhar, e modo SEM_PDF para a CI. Mapa radial e composição de consulta em 700×830 mm, uma página inteira, sem recortar. Plano extrai a lógica histórica de validade, contagem de folhas distintas, cópias e indicação de impressão, recebe registro externo; nenhuma agenda ou turma real. Não reintroduz o portão de ocupação da parede removido em setembro. O run 45469182103 aprovou folha de aluno e gabarito, mas reprovou título A3; tamanho/entrelinha ajustados para fonte fallback ausente. Fontes originais não incluídas. Novos testes e revisão visual pendentes. Checadores legados da pilha ainda não portados; gates novos são específicos das amostras. Não publicar peças ou dados de turma reais.

## Direção visual corrigida

Ver [Mapa de Cabeça e goldens](mural-visual-direction.md). Andaime Aberto é legado para parede; golden GS-01 e mural_consulta são referência de produção nova. O experimento A3 híbrido foi abandonado. A geometria GEO já existente é reutilizada em novo espécime GS-01. A base homologada está na main; novos testes pendentes.
