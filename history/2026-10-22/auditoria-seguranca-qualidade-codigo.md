# sec: auditoria completa de seguranca qualidade e bugs

## Pergunta/Solicitação
Atue como um Engenheiro de Software Sênior e Especialista em Segurança (SecOps/AppSec). Sua missão é realizar uma auditoria completa, linha por linha, no código fornecido, focando em identificar falhas de segurança, bugs lógicos e problemas de qualidade.

Por favor, analise o código com base nos seguintes pilares:
1. Auditoria de Segurança (Security by Design): OWASP Top 10, vazamento de dados, autenticação/autorização (BOLA/IDOR), validação de inputs.
2. Avaliação de Funcionalidade e Bugs: Fluxos de exceção, falhas silenciosas, regras de negócio, condições de corrida, edge cases.
3. Qualidade de Código e Performance: SOLID, DRY, Clean Code, gargalos de performance, complexidade ciclomática.

Formato de Saída Exigido:
- Resumo Executivo
- Tabela de Ameaças (CRÍTICA, ALTA, MÉDIA, BAIXA)
- Detalhamento e Correções (O Problema, Trecho Vulnerável, Solução em Código Corrigido)

## Planejamento
1. Realizar varredura detalhada e estática nas camadas críticas da aplicação:
   - Rotas de API (`/api/pareceres`, `/api/cids`, `/api/cpf`, `/api/municipios`).
   - Esquema de Banco de Dados e Políticas RLS (`supabase/schema.sql`).
   - Camada de Estado Global e Sincronização (`lib/context/AppContext.tsx`).
   - Módulos de Autenticação e Perfis (`app/login/page.tsx`, `app/usuarios/page.tsx`).
   - Módulo de Atendimento e Pareceres (`app/atendimentos/[id]/page.tsx`).
2. Classificar as vulnerabilidades e fragilidades em matriz de risco (Severidade: CRÍTICA, ALTA, MÉDIA, BAIXA).
3. Elaborar correções de código concretas e defensivas em TypeScript e SQL (PostgreSQL/Supabase RLS).
4. Estruturar a resposta final no formato rigoroso solicitado, incluindo a Análise de Segurança com os 5 pilares exigidos pelas diretrizes institucionais do `AGENTS.md`.

## Resumo da Execução
Auditoria concluída com sucesso. Foram catalogadas ameaças críticas e de alta gravidade, incluindo exposição pública de dados sensíveis de saúde em rota sem autenticação (`/api/pareceres`), políticas permissivas de RLS permitindo exclusão e mutação indevida de pareceres regulatórios imutáveis, injeção de filtros PostgREST, bypass de autenticação no modo offline, falhas silenciosas e descompasso de estado com o banco (desincronização otimista), além de gigantismo de arquivos violando o princípio da responsabilidade única (SRP). Foram fornecidas soluções completas com código refatorado e scripts SQL para endurecimento de segurança.
