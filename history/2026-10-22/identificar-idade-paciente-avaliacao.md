# feat: identificação da idade do paciente no momento da avaliação e classificação de ciclo de vida

* **Pergunta/Solicitação:**
Preciso que seja identificado a idade do paciente no momento da avaliação ou seja, crie um flag com idade dele, outro flag para paciente: Recem nascido, criança, adulto e idoso

* **Planejamento:**
1. **Definição das Regras e Faixas Etárias Clínicas:**
   - Estabelecer a data de avaliação como ponto de referência temporal (no processo SEI: data do parecer técnico emitido ou data de abertura do processo; em consultas: data do atendimento; fallback: data atual).
   - Flag 1 (Idade): Cálculo preciso da idade em dias (para neonatos), meses (para lactentes menores de 1 ano) e anos completos, com exibição amigável e valor numérico.
   - Flag 2 (Classificação Etária):
     - **Recém-nascido**: 0 a 28 dias de vida (período neonatal do Ministério da Saúde / OMS / Sociedade Brasileira de Pediatria).
     - **Criança**: 29 dias até 17 anos completos (faixa pediátrica < 18 anos).
     - **Adulto**: 18 a 59 anos completos.
     - **Idoso**: 60 anos ou mais (Estatuto da Pessoa Idosa - Lei Federal nº 10.741/2003 e SUS).
2. **Criação do Módulo Utilitário TypeScript (`lib/patient-age.ts`):**
   - Implementar cálculo seguro de datas imune a distorções de timezone/UTC.
   - Definir tipagens `FaixaEtariaPaciente`, `FaixaEtariaLabel` e `PatientAgeResult`.
   - Mapear estilos e cores de badges Tailwind institucionais para cada ciclo de vida.
3. **Atualização das Tipagens Globais (`lib/types.ts`):**
   - Enriquecer as interfaces `Patient` e `Processo` com os campos `paciente_idade_na_avaliacao`, `paciente_idade_formatada`, `paciente_faixa_etaria` e `paciente_faixa_etaria_label`.
4. **Integração no Contexto da Aplicação (`lib/context/AppContext.tsx`):**
   - Enriquecer os processos na hidratação dos dados vindos do Supabase e nas mutações locais (`addProcesso`).
5. **Integração Visual nas Interfaces:**
   - `app/atendimentos/[id]/page.tsx`: Exibir no card do paciente os flags de idade na avaliação e o badge do ciclo de vida; incluir no laudo oficial do parecer técnico para impressão/PDF.
   - `app/atendimentos/page.tsx`: Exibir na coluna do paciente da fila de atendimentos a idade e o badge de ciclo de vida, adicionando também filtro dinâmico por faixa etária na barra de filtros.
   - `app/atendimentos/novo/page.tsx`: Exibir a idade e classificação etária em tempo real ao selecionar um paciente na autuação de novo processo.
   - `app/pacientes/page.tsx`: Exibir a idade e o badge de ciclo de vida na lista de pacientes e no prontuário.
   - `app/indicadores/page.tsx`: Adicionar métricas de distribuição por faixa etária no painel epidemiológico.
6. **Banco de Dados Supabase (PostgreSQL & SQL):**
   - Criar funções SQL imutáveis no banco: `cb_calcular_idade_dias`, `cb_calcular_idade_anos`, `cb_calcular_idade_formatada`, `cb_classificar_faixa_etaria`, `cb_rotulo_faixa_etaria`.
   - Adicionar colunas de apoio em `cb_processos` e criar a view analítica `cb_vw_processos_com_idade`.
   - Executar no Supabase via MCP e sincronizar com `supabase/schema.sql`.
7. **Documentação para Power BI / DAX:**
   - Estruturar fórmulas prontas em DAX e Power Query M para integração em relatórios analíticos.
8. **Validação e Build:**
   - Rodar checagem estática `tsc --noEmit` e `npm run build` do Next.js.

* **Resumo da Execução:**
- Criado o módulo [lib/patient-age.ts](file:///c:/Dev/Cimbahia/lib/patient-age.ts) contendo as funções puras `calculatePatientAgeAtEvaluation` e `getProcessoPatientAge`, cobrindo as 4 faixas solicitadas (Recém-nascido de 0 a 28 dias, Criança de 29 dias a 17 anos, Adulto de 18 a 59 anos e Idoso a partir de 60 anos).
- Atualizado [lib/types.ts](file:///c:/Dev/Cimbahia/lib/types.ts) exportando o tipo `FaixaEtariaPaciente` e adicionando os campos aos modelos `Patient` e `Processo`.
- Atualizado [lib/context/AppContext.tsx](file:///c:/Dev/Cimbahia/lib/context/AppContext.tsx) para enriquecer os processos com os campos calculados tanto na inicialização quanto na autuação (`addProcesso`).
- Atualizado [app/atendimentos/[id]/page.tsx](file:///c:/Dev/Cimbahia/app/atendimentos/[id]/page.tsx) exibindo a idade no momento da avaliação e o badge do ciclo de vida no card de identificação e no laudo oficial de impressão.
- Atualizado [app/atendimentos/page.tsx](file:///c:/Dev/Cimbahia/app/atendimentos/page.tsx) com a tag colorida da faixa etária e a idade na tabela de processos, acompanhado de um novo seletor de filtro por Faixa Etária na barra superior.
- Atualizado [app/atendimentos/novo/page.tsx](file:///c:/Dev/Cimbahia/app/atendimentos/novo/page.tsx) para cálculo em tempo real no resumo do paciente.
- Atualizado [app/pacientes/page.tsx](file:///c:/Dev/Cimbahia/app/pacientes/page.tsx) exibindo idade e badge de ciclo de vida na listagem e no prontuário.
- Atualizado [app/indicadores/page.tsx](file:///c:/Dev/Cimbahia/app/indicadores/page.tsx) adicionando 4 novos cards epidemiológicos com a contagem de Recém-nascidos, Crianças, Adultos e Idosos avaliados.
- Atualizado [supabase/schema.sql](file:///c:/Dev/Cimbahia/supabase/schema.sql) e executado com sucesso no PostgreSQL do Supabase através do MCP `supabase/execute_sql`, criando as funções SQL e a view `cb_vw_processos_com_idade`.
- Validados todos os tipos com `npx tsc --noEmit` e gerado build de produção com sucesso via `npm run build`.
