# ADR 001 — Separação entre código público e dados privados

**Status:** proposta arquitetural inicial; implementação e migração ainda não realizadas.

## Decisão

O repositório público contém somente código, documentação, modelos e materiais cuja publicação tenha sido revisada. Dados reais de usuários não integram o repositório, inclusive branches, testes, logs, artefatos, arquivos gerados e histórico Git.

- Aplicação pública: recursos estáticos e ferramentas pedagógicas, sem binding de banco privado.
- API administrativa: Worker separado, autenticado e autorizado por operação e usuário; acesso restrito aos recursos necessários.
- Cloudflare D1: opção preferencial de armazenamento relacional para registros operacionais privados. SQL parametrizado, migrações versionadas sem dados reais e restrições de integridade.
- Workers KV: opcional para cache e configurações não sensíveis; não é a fonte de verdade dos registros relacionais.
- Google Drive: documentos privados e produção individualizada mediante acesso autorizado, preferencialmente com permissões restritas à pasta ou ao documento necessário. Conectores de agentes são um fluxo de trabalho separado da aplicação: não concedem automaticamente acesso ao Worker.
- R2: opcional para arquivos volumosos, com armazenamento público e privado separados.

## Fronteira de segurança

D1 não é intrinsecamente mais privado que KV. O isolamento depende de autenticação, autorização no servidor, privilégio mínimo, bindings separados, políticas de retenção e configuração segura. Cloudflare Access pode proteger o Worker administrativo, inclusive seus endpoints alternativos e previews; a API deve validar a identidade e verificar permissões sobre cada recurso. Respostas privadas não devem entrar em cache compartilhado ou logs de conteúdo.

Identificadores reais, nomes, resultados, observações individuais, tokens, exportações, backups, URLs restritas e documentos personalizados permanecem fora do GitHub. Exemplos e testes usam dados inteiramente fictícios. Configurações versionadas usam placeholders; credenciais ficam nos mecanismos de secrets apropriados. Dados de produção nunca são usados em previews públicos.

## Produção individualizada

1. Selecionar um template genérico e objetivos pedagógicos.
2. Consultar somente os dados indispensáveis, por um canal privado autorizado.
3. Produzir e revisar o documento em ambiente privado.
4. Salvar o resultado em pasta restrita, verificar destinatário e permissões e evitar cópias desnecessárias.
5. Publicar, quando pertinente, apenas o template genérico, nunca o documento personalizado.

Dados de menores exigem cuidados adicionais, autorização institucional e avaliação da finalidade, necessidade, retenção e tratamento por terceiros. Dados pseudonimizados continuam protegidos quando houver possibilidade de reidentificação.

## Implementação incremental

1. Documentar os limites e contratos de dados; identificar os consumidores e fontes de verdade.
2. Definir schema e migrações SQL com registros fictícios e testar em ambiente isolado.
3. Implementar API privada e testar acesso negado, autorização por recurso, integridade e recuperação.
4. Validar importação em ambiente restrito, reconciliar quantidades e registros, estabelecer rollback e transição gradual. Não remover a fonte anterior antes da validação.
5. Separar ferramentas públicas de integrações privadas; validar o processo documental e o controle de compartilhamento.
6. Rever retenção e cópias históricas conforme política institucional. Não confundir remover um arquivo do estado atual de um repositório com apagar seu histórico.

## Referências

- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Cloudflare Access para Workers](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)
- [Opções de armazenamento](https://developers.cloudflare.com/workers/platform/storage-options/)
- [Recuperação D1](https://developers.cloudflare.com/d1/reference/time-travel/)

## Decisões pendentes

Modelo de identidade, papéis e permissões, esquema definitivo, fonte de verdade de cada entidade, política de retenção, autorização institucional para tratamento por terceiros e estratégia de migração. Nenhum serviço de produção é criado por este ADR.
