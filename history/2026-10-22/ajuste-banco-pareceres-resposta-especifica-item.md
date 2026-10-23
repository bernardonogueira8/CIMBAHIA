# fix: exibicao da fundamentacao especifica do item no banco de pareceres

## Pergunta/Solicitação:
Em "Banco de Pareceres & Decisões Farmacêuticas", em Fundamentação Farmacêutica & Clínica, está vindo a resposta de "Parecer Técnico Consolidado Unificado", eu queria a resposta especifica daquele item que foi feito no processo, ou seja, Resposta de "Fundamentação Técnica e Justificativa Clínica do Fármaco:" daquele farmaco, para aquela pessoa e CID.

## Planejamento:
1. **Identificar a causa raiz no endpoint e na interface:**
   - Em `app/api/pareceres/route.ts`, ao mapear os itens do processo real para `ParecerSearchResultItem`, a propriedade `fundamentacao_tecnica` priorizava `parecerVersion?.technical_justification || item.justification`. Como o parecer consolidado sempre existia nos processos finalizados, ele sobrescrevia a justificativa técnica individual do combo (Fármaco + CID).
2. **Priorizar a Fundamentação Específica do Item:**
   - Inverter a prioridade em `app/api/pareceres/route.ts` para que `item.justification` seja o valor primário.
   - Adicionar mecanismo inteligente de fallback com Regex: caso `item.justification` esteja vazio, extrair especificamente o trecho `Fundamentação Técnica:` daquele fármaco específico de dentro do texto consolidado.
   - Adicionar os campos `paciente_nome`, `posologia` e `parecer_consolidado` no tipo `ParecerSearchResultItem`.
3. **Garantir a Persistência de `itemsState` ao Emitir Parecer:**
   - Em `app/atendimentos/[id]/page.tsx`, na função `handleEmitirParecer`, assegurar a chamada explícita `await updateProcesso(processo.id, { items: itemsState })` antes de emitir o parecer, garantindo que todas as justificativas individuais digitadas pelo farmacêutico estejam salvas no processo.
4. **Atualizar a Visualização no Banco de Pareceres (`app/pareceres/page.tsx`):**
   - No card de resultado, exibir o **Paciente Requerente**, **Fármaco / Substância**, **CID-10 Avaliado**, **Farmacêutico Parecerista** e **Data da Avaliação**.
   - Atualizar o título da seção para **"Fundamentação Técnica e Justificativa Clínica do Fármaco:"**, exatamente como redigido na avaliação.
   - Disponibilizar um bloco colapsável opcional (`details/summary`) para visualização do **"Parecer Técnico Consolidado Geral do Processo SEI"**, caso o usuário deseje consultar o contexto completo do processo.
5. **Validação:**
   - Validar com `npx tsc --noEmit` e `npm run build`.

## Resumo da Execução:
- **`app/api/pareceres/route.ts`**:
  - `ParecerSearchResultItem` enriquecido com `paciente_nome`, `posologia` e `parecer_consolidado`.
  - `executePareceresSearch`: `fundamentacao_tecnica` agora prioriza estritamente `item.justification`, com extração cirúrgica por Regex do item específico caso esteja embutido no parecer consolidado.
- **`app/atendimentos/[id]/page.tsx`**:
  - `handleEmitirParecer` atualizado para persistir `itemsState` com `updateProcesso`, garantindo a integridade de todas as justificativas por combo.
- **`app/pareceres/page.tsx`**:
  - Card reestruturado para exibir o nome do paciente requerente na grade de metadados.
  - Título padronizado para "Fundamentação Técnica e Justificativa Clínica do Fármaco:".
  - Adicionado componente colapsável para consultar o parecer consolidado sem poluir a visualização da resposta individual.
- **Build e Tipagem:**
  - `npx tsc --noEmit` executado com código 0.
  - `npm run build` gerou todas as 20 rotas com código 0.
