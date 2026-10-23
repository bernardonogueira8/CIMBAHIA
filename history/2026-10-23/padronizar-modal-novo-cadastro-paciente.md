# feat: unificação e padronização do modal de novo cadastro de paciente com layout do cadastro rápido

* **Pergunta/Solicitação:**
Eu gostei do layout que esta no castro Rápido de paciente, aplica para tela de Novo Cadastro do paciente, utiliza mesma coisa

* **Planejamento:**
1. **Mapeamento do Layout de Referência:**
   - Analisar a estrutura visual e os componentes do modal "Cadastro Rápido de Paciente" em `app/atendimentos/novo/page.tsx`.
   - Elementos de destaque do layout:
     - Bloco prioritário de CPF com busca por Enter e botão dedicado com ícone e estado de carregamento;
     - Card de feedback integrado exibindo status no AFSESAB (`✅ Paciente já cadastrado` ou `⚠️ Novo Paciente`);
     - Nome Completo em linha única e destacada;
     - Grids balanceadas de 2 colunas para (Sexo Biológico / CNS), (Data de Nascimento / Telefone) e (Bairro / CEP);
     - Seletor de Município de Residência com suporte a residência interestadual / Outro Estado e busca em tempo real com badges BRS;
     - Card deduzido automático de Base Regional e Farmacêutico Responsável territorial;
     - Botões de rodapé modernos com Cancelar em estilo `ghost` e ação principal em verde esmeralda com indicador de carregamento.
2. **Implementação em `app/pacientes/page.tsx`:**
   - Importar o ícone `Building` de `lucide-react`.
   - Adicionar cálculos deduzidos de `deducedMun` e `deducedUnit` com `useMemo`.
   - Adicionar estado `isSavingPatient` para feedback ao salvar e função unificada `resetPatientForm`.
   - Refatorar o `<Dialog>` de "Novo Cadastro de Paciente" adotando rigorosamente a mesma hierarquia de tags, classes Tailwind e espaçamentos do Cadastro Rápido.
3. **Verificação de Tipagem e Qualidade:**
   - Executar `npx tsc --noEmit` para garantir 100% de conformidade com o TypeScript.
4. **Análise de Segurança:**
   - Executar checklist de segurança (OWASP Top 10, sanitização, segredos, dependências e privilégio mínimo).

* **Resumo da Execução:**
- Atualizado [app/pacientes/page.tsx](file:///c:/Dev/Cimbahia/app/pacientes/page.tsx) com o design system do modal de Cadastro Rápido:
  - Header de CPF com consulta interativa via Enter ou botão, e checkbox de "CPF não informado";
  - Alerta dinâmico de localização do cadastro com badge de situação prévia no AFSESAB;
  - Campo de Nome Completo em largura total;
  - Grids simétricas de 2 colunas para dados demográficos e de contato;
  - Autocomplete de municípios com suporte a fora da Bahia e dedução em tempo real da Base Regional de Saúde vinculada;
  - Botões de ação alinhados com loading state `isSavingPatient`.
- Compilação do TypeScript validada com sucesso (`npx tsc --noEmit` - código 0).
