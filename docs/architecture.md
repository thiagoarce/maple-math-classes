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

## Contratos preliminares de dados

Entidades candidatas: turmas, estudantes, matrículas, avaliações, resultados, frequência e registros pedagógicos. Definir chaves, cardinalidade, escopo de acesso, retenção e fonte de verdade antes do schema definitivo. Identificadores e exemplos versionados serão fictícios; migrações SQL conterão apenas estrutura.

D1 e Drive não devem disputar a fonte de verdade de uma entidade. O banco guarda registros operacionais; o Drive guarda documentos. Referências a documentos privados ficam no ambiente autorizado, não no catálogo público.

## Produção de materiais

Templates e geradores aceitam entradas explicitamente fornecidas, não acessam cadastros por padrão. Uma execução genérica é reproduzível com dados fictícios. Uma execução individualizada ocorre separadamente, com acesso mínimo e saída privada. Conectores autorizados podem consultar e salvar documentos, sem transmitir automaticamente suas permissões para a aplicação.

## Estratégia de migração

Primeiro extraia componentes independentes e revise suas dependências; depois implemente a interface privada com dados sintéticos. A transição de dados exige inventário restrito, plano de importação, testes de autorização, reconciliação e rollback. Não altere a operação existente antes da validação.

## Decisões abertas

Schema definitivo, provedor de identidade e papéis, retenção, ambientes, licenciamento, autorização institucional e configuração de deploy. Nenhum endereço, identificador de banco ou credencial de produção deve constar desta documentação.
