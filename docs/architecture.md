# Arquitetura

Estado: arquitetura proposta; ainda não implementada. Decisão de referência: [ADR 001](adr/001-separacao-dados-privados.md).

## Separação de responsabilidades

| Camada | Responsabilidade | Dados |
|---|---|---|
| Núcleo de ferramentas | Matemática, renderização, geração e validação | Entradas genéricas |
| Aplicações públicas | Recursos estáticos e interações sem dependência de cadastros | Conteúdo publicável |
| API privada | Autenticação, autorização, regras de negócio e acesso ao armazenamento | Dados operacionais privados |
| D1 | Persistência relacional preferencial | Registros operacionais |
| Google Drive | Fluxo documental e produção personalizada autorizada | Documentos privados |
| KV | Cache e configurações não sensíveis, quando útil | Não é fonte de verdade de registros relacionais |

O Worker público não recebe binding do D1 privado nem tokens da área administrativa. O Worker privado valida identidade e autorização por recurso, além de autenticação de entrada. Não há acesso público ao banco, incluindo previews e domínios alternativos.

## Organização por disciplina

A navegação curricular parte de Matemática HS, Entrepreneurship e Olimpíadas. Cada frente contém níveis curriculares e unidades ou tópicos reutilizáveis; a mesma ferramenta compartilhada pode servir a todas. Ver [organização por disciplina](subject-organization.md).

Uma turma concreta de determinado ano letivo, sua vinculação a uma disciplina/nível e suas matrículas são informações operacionais do ambiente privado. Os conteúdos públicos usam identificadores curriculares genéricos. Um vínculo privado pode apontar para recursos públicos sem publicar os dados da turma.

## Contratos preliminares de dados

Entidades candidatas: disciplinas, níveis curriculares, anos letivos, ofertas de disciplina por turma, estudantes, matrículas, avaliações, resultados, frequência e registros pedagógicos. A relação entre turmas e disciplinas pode ser muitos-para-muitos; não presumir que uma turma pertence exclusivamente a uma frente. Definir chaves, cardinalidade, escopo de acesso, retenção e fonte de verdade antes do schema definitivo. Identificadores e exemplos versionados serão fictícios; migrações SQL conterão apenas estrutura.

D1 e Drive não devem disputar a fonte de verdade de uma entidade. O banco guarda registros operacionais; o Drive guarda documentos. Referências a documentos privados ficam no ambiente autorizado, não no catálogo público.

## Produção de materiais

Templates e geradores aceitam entradas explicitamente fornecidas, não acessam cadastros por padrão. Uma execução genérica é reproduzível com dados fictícios. Uma execução individualizada ocorre separadamente, com acesso mínimo e saída privada. Conectores autorizados podem consultar e salvar documentos, sem transmitir automaticamente suas permissões para a aplicação.

## Estratégia de migração

Primeiro extraia componentes independentes e revise suas dependências; depois implemente a interface privada com dados sintéticos. A transição de dados exige inventário restrito, plano de importação, testes de autorização, reconciliação e rollback. Não altere a operação existente antes da validação.

## Decisões abertas

Schema definitivo, provedor de identidade e papéis, retenção, ambientes, licenciamento, autorização institucional e configuração de deploy. Nenhum endereço, identificador de banco ou credencial de produção deve constar desta documentação.

## Schema privado candidato

Veja [contrato de dados privados](private-data-contract.md). Migração estrutural e testes SQLite em memória, sem binding ou serviço real. O modelo permanece candidato até aprovação do escopo, segurança e fontes oficiais.
