# feat: integração dinâmica com o banco de pareceres e remoção de dados estáticos

## Pergunta/Solicitação
Em "Etapa 2. Aguardando Parecer" e "Etapa 3. Em Análise", não está puxando os pareceres automaticos, está puxando informações estatica em "Respostas Rápidas do Repositório (3):(2 decisões mais recentes por data de conclusão)". Preciso ver as informações do Banco de pareceres

## Planejamento
1. **Investigação da Causa Raiz:**
   - Inspecionar a função `getComboDecisionsHistory` e a renderização do bloco de decisões anteriores em `app/atendimentos/[id]/page.tsx`.
   - Constatar que a constante estática `CIMBAHIA_COMBO_PRECEDENTS` e fallbacks fixos estavam injetando 3 registros mockados (com datas "2026-01-15", pareceristas fictícios "Câmara Técnica CIMBAHIA / Protocolos SESAB" e textos estáticos pré-programados).
   - Identificar que processos reais do Supabase com versões ativas de pareceres não eram reconhecidos quando a tabela `cb_processo_items` não continha linhas explícitas ou quando a correspondência de CID exigia exatidão rígida.
2. **Integração Real com o Banco de Pareceres:**
   - Eliminar definitivamente a constante estática `CIMBAHIA_COMBO_PRECEDENTS` e os fallbacks fixos fictícios.
   - Refatorar a função `getComboDecisionsHistory` em `app/atendimentos/[id]/page.tsx` para varrer todos os processos do repositório/banco de dados, extraindo tanto os itens cadastrados em `p.items` quanto pareceres consolidados em `p.parecer?.active_version?.technical_justification`.
   - Implementar ordenação por relevância clínica (`mesmo_combo` para mesmo fármaco e CID, seguido de `mesmo_farmaco` para precedentes da mesma substância em outros diagnósticos) e estritamente pela data de conclusão mais recente (`dataConclusao`).
   - Atualizar a interface do card na Etapa 2 ("Aguardando Parecer") e Etapa 3 ("Em Análise"):
     - Exibir o bloco autêntico "Decisões Anteriores do Banco de Pareceres (N)".
     - Mostrar o Nº de Processo SEI real, parecerista responsável real (ex: "Bernardo Nogueira da Silva"), status real da decisão e a fundamentação técnica autêntica do parecer.
     - Disponibilizar botão "Reaproveitar Fundamentação" para preenchimento imediato da decisão do item.
     - Se não houver parecer anterior registrado para aquele fármaco no Banco de Pareceres, exibir card transparente e limpo com atalho para consultar o Banco Geral de Pareceres (`/pareceres`).
3. **Ajustes no endpoint `/api/pareceres/route.ts`:**
   - Suporte à extração de itens e pareceres a partir de `technical_justification` para processos sem itens explícitos.
   - Fallback de consulta no servidor diretamente ao Supabase para requisições que não enviem lista local de processos.
4. **Validação:**
   - Executar `npx tsc --noEmit` para garantir 0 erros de tipagem e compilação.
   - Executar Checklist de Segurança (OWASP Top 10, Gestão de Segredos, Validação, Dependências e Privilégio Mínimo).

## Resumo da Execução
- **Arquivo `app/atendimentos/[id]/page.tsx` modificado:**
  - Removidos completamente os arrays e objetos estáticos `CIMBAHIA_COMBO_PRECEDENTS` e `PrecedentTemplate`.
  - Atualizada a interface `ComboDecisionHistoryItem` para incorporar `matchType?: "mesmo_combo" | "mesmo_farmaco" | "mesmo_cid"` e tipagem de banco.
  - Reescreveu-se `getComboDecisionsHistory` para buscar dinamicamente em todos os processos reais carregados do Supabase com parecer ativo ou status de conclusão.
  - A UI das Etapas 2 e 3 agora exibe as decisões autênticas do Banco de Pareceres, com Nº SEI, data real de conclusão, parecerista responsável e botão de reaproveitamento da fundamentação clínica.
  - O modal de Histórico Completo foi atualizado para "Banco de Pareceres - Decisões e Pareceres Técnicos Registrados", com badges fiéis aos registros do banco.
- **Arquivo `app/api/pareceres/route.ts` aprimorado:**
  - Adicionado suporte para identificação de fármacos e diagnósticos consolidados no laudo técnico mesmo quando não houver itens isolados no banco de itens.
  - Integrado fallback direto com o cliente do Supabase no servidor.
- **Validação:**
  - O comando `npx tsc --noEmit` executou com sucesso (código de saída 0).
