# feat: permitir edição, acréscimo e remoção de fármacos e cids pelo farmacêutico

* **Pergunta/Solicitação:** Editar medicamentos da triagem, o farmaceutico ele deve poder conseguir editar: removendo editando ou acrescentando mais farmacos e cids, para uma avaliação. As vezes a triagem pode errar neste processo.

* **Planejamento:**
1. **Compreensão da Regra de Negócio:**
   - Durante a triagem documental, servidores administrativos podem cometer erros na inclusão de fármacos, digitação de nomes, dosagens, quantidades ou vinculação incorreta de códigos CID-10.
   - O farmacêutico avaliador precisa de autonomia completa para corrigir a demanda técnica antes ou durante a elaboração do parecer:
     a) **Acrescentar novos fármacos e CIDs** que tenham sido omitidos pela triagem;
     b) **Editar fármacos e CIDs existentes**, corrigindo princípios ativos, patologias, posologias ou quantidades mensais;
     c) **Remover fármacos incorretos**, evitando emissão de pareceres para medicamentos lançados indevidamente ou em duplicidade.

2. **Sincronização no Contexto e Banco de Dados (Supabase):**
   - Atualizar `updateProcesso` em `lib/context/AppContext.tsx` para assegurar que exclusões de itens da demanda reflitam no Supabase (`cb_processo_items`), utilizando exclusão seletiva (`delete().eq("processo_id", id).not("id", "in", ...)`) e inserção/upsert com UUIDs válidos.
   - Exportar helper `generateUUID` em `lib/utils.ts` para geração consistente de identificadores únicos no cliente e no servidor.

3. **Interface e Experiência do Usuário (UI/UX) em `app/atendimentos/[id]/page.tsx`:**
   - Integrar botão de ação rápida "Ajustar Fármacos" diretamente nos banners das etapas de Triagem e de Observação.
   - Na seção "Decisões Individuais por Combo (Fármaco + CID)", adicionar o botão de destaque "+ Acrescentar Fármaco / CID" no cabeçalho do card.
   - Adicionar estado vazio descritivo com ação direta de adição quando não houver fármacos cadastrados.
   - Em cada card individual de fármaco, adicionar botões com ícones para "Editar" (azul) e "Remover" (vermelho).
   - Implementar modal de Adição/Edição com:
     - Autocomplete de fármacos com base em mais de 4.000 substâncias oficiais da Anvisa/SUS (`INITIAL_FARMACOS`) ou digitação livre;
     - Busca debounced e autocomplete de CIDs com integração à API `/api/cids` e opção de "CID Não Informado / Investigação";
     - Campos para posologia prescrita e quantidade mensal estimada;
     - Validação de preenchimento e mensagens de erro informativas.
   - Implementar modal de confirmação para exclusão de fármaco com detalhes do item selecionado.
   - Atualizar a compilação do laudo consolidado e indicadores para refletirem dinamicamente os fármacos e CIDs atualizados.

4. **Validação de Qualidade e Segurança:**
   - Executar análise de segurança silenciosa (OWASP, injeções, validação de inputs e privilégio mínimo).
   - Validar com `npx tsc --noEmit` e `npm run build` garantindo zero erros de tipagem e geração estática de rotas limpa.

* **Resumo da Execução:**
- Adicionada a função utilitária `generateUUID` em [lib/utils.ts](file:///c:/Dev/Cimbahia/lib/utils.ts).
- Refatorada a função `updateProcesso` em [lib/context/AppContext.tsx](file:///c:/Dev/Cimbahia/lib/context/AppContext.tsx) para sincronizar perfeitamente inclusões, edições e exclusões de itens na tabela `cb_processo_items` do Supabase.
- Atualizado [app/atendimentos/[id]/page.tsx](file:///c:/Dev/Cimbahia/app/atendimentos/[id]/page.tsx):
  - Integrado botão "Ajustar Fármacos" nos banners de Triagem e de Observação;
  - Adicionado botão "+ Acrescentar Fármaco / CID" no cabeçalho da seção de decisões individuais;
  - Adicionados botões "Editar" e "Remover" em cada combo fármaco + CID;
  - Criado o modal `<Dialog>` com autocomplete de fármacos e de CIDs via API `/api/cids`, além de campos de posologia e quantidade mensal;
  - Criado o modal `<Dialog>` de confirmação segura de remoção de itens com detalhes informativos;
  - Corrigido o recálculo imediato de pareceres, textos consolidados e indicadores com a nova lista de itens.
- Compilação TypeScript (`npx tsc --noEmit`) e build de produção (`npm run build`) concluídos com sucesso (código 0).
