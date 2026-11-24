# Infraestrutura privada — contrato candidato

O ADR 001 passa à etapa de schema. A Escalada já usa migrações SQL versionadas, chaves relacionais e consultas preparadas com bind; os schemas 0001, 0009 e 0011 foram consultados. Reutilizamos essas decisões de engenharia, não a autenticação de consumidores, produtos comerciais, telemetria de vídeo ou cadastro de alunos da Escalada. Nenhum registro foi lido do banco real.

## Entidades e fonte de verdade proposta

| Entidade | Fonte candidata | Regra |
|---|---|---|
| Ano, turma, oferta | Sistema escolar autorizado; D1 como espelho ou fonte operacional após decisão | Turma não equivale a disciplina |
| Identidade docente | Provedor institucional autenticado | par emissor + subject verificado; sem senha local |
| Matrícula | Fonte escolar autorizada | vínculo aluno–oferta, inclusive olímpica |
| Currículo | Catálogo genérico do Git | unidade por ID estável; validar disciplina/nível na API |
| Aula e roteiro | D1 privado, se autorizado | objetivo, etapas, critérios, recursos, estado e revisão |
| Frequência e notas | Sistema oficial a confirmar | D1 não substitui automaticamente diário oficial |
| Evidência individual | D1 privado, minimizada | observação pedagógica factual, não diagnóstico |
| Documentos | Drive privado | D1 guarda só referência, não ACL, token ou URL pública |

As 17 tabelas são candidatas. O modelo permite ofertas com várias turmas e turmas com várias ofertas. Frequência, resultados e evidências têm FKs compostas que impedem misturar aluno, oferta e aula/avaliação. Pontuação em centésimos de ponto evita erro binário; não define pesos, média ou regra de recuperação. Nota ausente não é zero.

## Autorização

A autenticação futura deve validar assinatura, emissor, audiência, expiração e identidade do token do provedor, inclusive em endpoints alternativos. Nenhuma identidade de cabeçalho ou corpo vindo do cliente é confiável sem essa validação. A autorização precisa ser por oferta e operação. Perfis mínimos candidatos: teacher (leitura e alterações pedagógicas autorizadas) e viewer (leitura). Não existe administrador global implícito. Gestão dos vínculos de acesso ficará fora da API comum. A API deve usar prepared statements e escopo no próprio SQL, inclusive em mutações; responder sem revelar existência de recursos não autorizados. Não cachear conteúdo privado, não registrar payloads ou nomes nos logs, e impedir CSRF quando houver cookies. O teste de queries demonstra apenas dois padrões, não uma API autenticada.

## Integridade e limites

SQL em migrations/0001_core.sql, sem seed. Testes de SQLite em memória usam nomes fictícios e foreign_keys=ON. D1 local/remoto ainda não exercitado. A compatibilidade com D1, transações/batch, migração e recuperação deve ser testada em instância isolada antes de deploy. O schema não impede conflito de horários parcialmente sobrepostos, datas impossíveis, edição de etapas após publicação nem soma de etapas diferente da duração: validação da API e operação atômica são necessárias. Rotina, tarefa, datas de entrega, trilha de auditoria, histórico de revisões, matrícula por turma, períodos avaliativos, exclusão/retensão, autorização por documento e regras de notas ainda precisam de refinamento. Não importar dados reais com este schema. A FK de documento não prova autorização no Drive.

## Google Drive e agentes

O agente autorizado consulta somente o necessário para a tarefa individualizada, salva a saída na pasta privada autorizada e confirma a ACL e o destinatário. Acesso pelo conector Google Drive não se transfere ao Worker; não copiar credenciais para o repositório, não publicar links restritos no catálogo ou em logs. Não armazenar exportações reais no Git. O serviço precisa de aprovação institucional e política de retenção e descarte, considerando dados de menores.

## Teste e próximo passo

python tests/test_private_data.py. O teste é uma verificação relacional local e de escopo SQL, não homologação Cloudflare, LGPD ou operação real. Próxima etapa: especificar contrato API, autorização, validação transacional, trilha de auditoria sem payload, e testar D1 local com dados sintéticos. Só então revisar setup de ambiente privado.
