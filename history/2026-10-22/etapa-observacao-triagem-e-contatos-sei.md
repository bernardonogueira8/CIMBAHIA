# feat: adicionar etapa de observação na triagem e campos de e-mail e telefone no processo SEI

* **Pergunta/Solicitação:** Na parte de triagem criar uma nova etapa, chamada observação. Em "Identificação do Processo SEI", se faz necessario a seguinte condição adicionar dois campos: email e telefone

* **Planejamento:**
1. **Modelagem de Dados e Banco de Dados (Supabase):**
   - Adicionar colunas `email`, `telefone`, `contato_email` e `contato_telefone` na tabela `cb_processos`.
   - Atualizar a restrição de verificação `cb_processos_status_check` para contemplar os novos status da etapa de observação: `'observacao'` e `'em_observacao'`.
   - Executar DDL no Supabase e registrar no arquivo `supabase/schema.sql`.

2. **Tipagem e Contexto Global:**
   - Atualizar `ProcessoStatus` em `lib/types.ts` para incluir `"observacao" | "em_observacao"`.
   - Adicionar campos `email`, `telefone`, `contato_email` e `contato_telefone` à interface `Processo`.
   - Atualizar a função auxiliar `isProcessoInFirstStatus` para permitir exclusão segura caso o processo esteja em triagem ou observação inicial.
   - Atualizar `lib/context/AppContext.tsx` para mapear, inserir e atualizar `email` e `telefone` no Supabase nas operações `addProcesso` e `updateProcesso`.

3. **Formulário de Abertura de Atendimento (`app/atendimentos/novo/page.tsx`):**
   - Na seção "1. Identificação do Processo SEI", adicionar campos de entrada para `E-mail de Contato` e `Telefone / WhatsApp`.
   - Adicionar seletor da etapa inicial da Triagem documental: "Triagem Inicial (Padrão)" vs. "Etapa de Observação (Pendência Documental / Aguardando Retorno)", permitindo já iniciar o processo com o status `em_observacao` e nota explicativa.

4. **Detalhes do Atendimento e Fluxo de Triagem (`app/atendimentos/[id]/page.tsx`):**
   - Atualizar a barra de etapas/timeline de 4 para 5 etapas: `1. Triagem` -> `2. Observação` -> `3. Aguardando Parecer` -> `4. Em Análise` -> `5. Concluído`.
   - Na etapa de Triagem, adicionar botão "Colocar em Observação" que abre modal para registro de motivo/instruções.
   - Criar painel/banner de destaque de Observação quando o processo estiver com status `observacao` ou `em_observacao`, exibindo notas, botões de ação rápida para e-mail/telefone e botão de liberação para avanço de etapa.
   - Adicionar cartão "Contatos do Processo SEI" com atalhos `mailto:` e `tel:` e botão de edição para atualizar contatos sem sair da página.

5. **Fila de Atendimentos e Indicadores (`app/atendimentos/page.tsx` e `app/indicadores/page.tsx`):**
   - Incluir cartão de métrica "2. Observação" e opção de filtro na listagem de processos.
   - Exibir badge com estilo âmbar/alerta para processos em Observação e renderizar os contatos diretos (e-mail e telefone) na listagem.
   - Atualizar dashboard de indicadores para incluir status "Em Observação" nos gráficos de distribuição.

6. **Validação:**
   - Executar `npx tsc --noEmit` para garantir conformidade estrita de tipos TypeScript.
   - Executar `npm run build` para garantir integridade da compilação e SSR.

* **Resumo da Execução:**
- Executadas migrações SQL no banco de dados Supabase da aplicação (`uzjvycaygwtpaiwvkylt`), adicionando colunas `email`, `telefone`, `contato_email` e `contato_telefone` e liberando os status `'observacao'` e `'em_observacao'` na tabela `cb_processos`.
- Atualizado [supabase/schema.sql](file:///c:/Dev/Cimbahia/supabase/schema.sql) com a nova estrutura de colunas e restrição de status.
- Atualizado [lib/types.ts](file:///c:/Dev/Cimbahia/lib/types.ts) com os tipos `ProcessoStatus` e novos campos de contato no tipo `Processo`.
- Atualizado [lib/context/AppContext.tsx](file:///c:/Dev/Cimbahia/lib/context/AppContext.tsx) persistindo e carregando os campos `email` e `telefone`.
- Atualizado [app/atendimentos/novo/page.tsx](file:///c:/Dev/Cimbahia/app/atendimentos/novo/page.tsx) com os campos "E-mail de Contato" e "Telefone / WhatsApp" no passo 1 ("Identificação do Processo SEI"), além da opção de definir a etapa de triagem como "Observação" com anotação inicial.
- Atualizado [app/atendimentos/[id]/page.tsx](file:///c:/Dev/Cimbahia/app/atendimentos/[id]/page.tsx) com a régua de 5 etapas, botões e modais para colocar em observação, painel de observação ativa com liberação de etapa e card dedicado de contatos com edição instantânea.
- Atualizado [app/atendimentos/page.tsx](file:///c:/Dev/Cimbahia/app/atendimentos/page.tsx) com card métrico de observação, filtros de status, badges visuais e exibição de contatos.
- Atualizado [app/indicadores/page.tsx](file:///c:/Dev/Cimbahia/app/indicadores/page.tsx) com cores e distribuição para processos em observação.
- Validação bem-sucedida via `npx tsc --noEmit` e `npm run build` com status 0 (sucesso total).
