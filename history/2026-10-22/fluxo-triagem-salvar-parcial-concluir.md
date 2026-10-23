# feat: fluxo de triagem administrativa com salvar parcial e conclusao

## Pergunta/Solicitação:
Na tela de Triagem, como seria salvar parcial, aparece as mesmas coisas para poder ainda editar, então ao click em concluir triagem e enviar para parecer, realmente iniciar avaliação de um farmaceutico. Pq essa parte de triagem é dever do admistrativo. Aproveita e remove essa opção de Assumir Direto.

## Planejamento:
1. **Distinção entre Salvar Parcial e Concluir Triagem:**
   - Implementar na tela de novo atendimento (`/atendimentos/novo`) dois botões claros na barra de ações:
     * **Salvar Parcialmente (Ficar em Triagem):** grava todos os dados autuados (SEI, paciente, contatos e-mail/telefone, medicamentos, CIDs e observações documentais) com status `triagem` (ou `em_observacao`) e `triagem_documents_ok: false`. O processo fica preservado para edições posteriores sem entrar na fila dos pareceristas.
     * **Concluir Triagem e Enviar para Parecer:** grava os dados, valida a triagem documental, marca `triagem_documents_ok: true`, registra o carimbo temporal e o autor no histórico, e define o status como `aguardando_parecer`, transferindo a demanda oficialmente para a fila dos farmacêuticos.
2. **Remoção de 'Assumir Direto' na Triagem:**
   - Remover definitivamente o botão 'Assumir Direto' dos banners de triagem e observação em `app/atendimentos/[id]/page.tsx`, garantindo a separação de papéis entre a triagem administrativa e a emissão do parecer farmacêutico.
3. **Permissão de Edição durante a Triagem:**
   - Liberar a adição, alteração e exclusão de fármacos e CIDs (`canManageItems`) tanto para os farmacêuticos quanto para a equipe administrativa enquanto o processo estiver em `triagem` ou `observacao`.
4. **Reorganização do Stepper em 4 Etapas Canônicas:**
   - Consolidar a linha do tempo em 4 etapas lineares (`1. Triagem` [com badge integrado caso esteja em observação], `2. Aguardando Parecer`, `3. Em Análise`, `4. Concluído`).
5. **Gatilhos Visuais e Banner para 'Em Análise':**
   - Inserir gatilhos rápidos no cabeçalho de cada etapa para avançar no fluxo.
   - Criar um banner de destaque para a etapa `em_analise` com atalho de rolagem suave para `#secao-parecer-consolidado`.
6. **Validação:**
   - Executar `npx tsc --noEmit` e `npm run build` para garantir zero regressões.

## Resumo da Execução:
- **`app/atendimentos/novo/page.tsx`**:
  - Implementada a função `handleSaveProcessoWithStatus(targetMode: 'parcial_triagem' | 'enviar_parecer')`.
  - Criados dois botões no rodapé: `"Salvar Parcialmente (Ficar em Triagem)"` (ícone `Save`) e `"Concluir Triagem e Enviar para Parecer"` (ícone `Send`).
  - Importado o tipo `ProcessoStatus` para integridade de tipagem.
- **`app/atendimentos/[id]/page.tsx`**:
  - Botão `"Assumir Direto"` removido completamente da interface.
  - Variável `canManageItems` criada para autorizar triadores administrativos a editar, adicionar e remover medicamentos e diagnósticos durante a triagem.
  - Função `handleConcluirTriagem` atualizada para salvar `triagem_documents_ok: true` e transicionar para `aguardando_parecer`.
  - Stepper reorganizado para 4 etapas limpas e equilibradas (`1. Triagem`, `2. Aguardando Parecer`, `3. Em Análise`, `4. Concluído`).
  - Inserido banner visual de aviso para `em_analise` e adicionado `id="secao-parecer-consolidado"` com `scroll-mt-6` para fácil navegação e conclusão do processo.
  - Inseridos botões de ação primária rápida no cabeçalho superior.
- **Compilação e Build:**
  - `npx tsc --noEmit` executado com código 0.
  - `npm run build` concluído com sucesso em todas as 20 rotas da aplicação.
