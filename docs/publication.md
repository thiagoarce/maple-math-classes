# Política de publicação

Toda publicação neste repositório é pública desde o primeiro objeto ou commit enviado ao GitHub. PRs em rascunho não são privados.

## Classificação

- Publicável: conteúdo autoral com autorização confirmada, código genérico revisado, documentação estável, dados sintéticos e dependências licenciadas.
- Requer adaptação: código ligado a infraestrutura privada, exemplos internos, materiais com identidade institucional, recursos com dependências ainda não revisadas.
- Não publicável: dados escolares reais, documentos individualizados, notas, frequência, diários, registros identificáveis, credenciais, exportações, backups, conteúdo comercial sem permissão e arquivos sem direitos comprovados.

Na dúvida, não publique. A revisão deve ocorrer em ambiente privado, antes do push.

## Portão de publicação

- [ ] Seleção explícita de arquivos; não importar histórico nem pastas inteiras automaticamente.
- [ ] Inspecionar texto, código, comentários, JSON, metadados, dependências transitivas, imagens, documentos incorporados e saídas de build.
- [ ] Verificar inexistência de dados reais, identificadores reidentificáveis, endpoints restritos, tokens e credenciais.
- [ ] Substituir fixtures por dados sintéticos independentes de casos reais.
- [ ] Verificar autoria, autorização, licença e avisos de copyright de cada dependência/asset.
- [ ] Executar testes funcionais, matemáticos e visuais aplicáveis.
- [ ] Registrar revisão e limitações no PR sem revelar detalhes privados.

Use ferramentas de busca e detecção de segredos como defesa adicional; elas não substituem inspeção humana. Um arquivo ignorado pelo Git ainda pode ser enviado por outros caminhos. Nunca publique primeiro para revisar depois.

## Direitos

Para cada recurso de terceiro, registrar origem pública, versão quando aplicável, licença, avisos exigidos e finalidade. Permissão para usar um material em aula não implica permissão para redistribuí-lo. Não copie questões de livros comerciais, identidade institucional ou fontes com atribuição incompleta sem resolver a autorização.

## Incidentes

Se ocorrer exposição, interromper publicação e deploy, restringir acesso quando possível, notificar os responsáveis autorizados, revogar credenciais comprometidas e avaliar remoção do histórico, artefatos, caches e cópias. Apagar um arquivo em um commit posterior não elimina versões anteriores.
