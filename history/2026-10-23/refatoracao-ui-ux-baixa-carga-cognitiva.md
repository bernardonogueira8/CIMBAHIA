# refactor: simplificação visual e redução de carga cognitiva na triagem e análise

## Pergunta/Solicitação
"Estou achando a telas muito poluidads com diversas informações que atrapalham a usabilidade e desviam atenção. 
Diminuiu a carga cognitiva de informações na parte superior de da triagem, aquela parte com botão de volta e nome da etapa, Coloca botões clean e textos enxutos.
Na parte de analise e avaliação, mesma coisa, usa skill Frontend desing, para melhor UI e UX, diminuir as informações exemplo:
Etapa 1. Triagem
Etapa 2. Aguardando Parecer
Etapa 3. Em Análise
Etapa 4. Concluído
Deixa apenas assim, na parte do paciente, coloca apenas nome, idade, sexo e tag(adulto criança e talz, cria um melhor visualização"

## Planejamento
1. **Consultar e aplicar as diretrizes da skill `frontend-design`:**
   - Reduzir ruído visual e desordem, cortando decorações e labels desnecessários.
   - Textos concisos e linguagem orientada ao usuário sem parágrafos explicativos prolixos.
   - Preservar consistência estética, alto contraste e tipografia nítida.

2. **Refatorar o topo da tela de Triagem (`app/atendimentos/novo/page.tsx`):**
   - Substituir o botão prolixo de voltar por um botão clean "Voltar" com ícone discreto.
   - Definir título objetivo "Nova Triagem" sem subtítulos redundantes.
   - Transformar a identificação da etapa em um indicador limpo: `Etapa 1. Triagem`.
   - Simplificar o botão de limpar formulário para "Limpar".

3. **Refatorar a esteira e topo da tela de Análise (`app/atendimentos/[id]/page.tsx`):**
   - No cabeçalho: botão clean "Voltar", número SEI em destaque mono com badge elegante do status e botões de ação compactos.
   - Na linha do tempo / régua de etapas: eliminar subtítulos prolixos e animações chamativas, exibindo estritamente as 4 etapas solicitadas:
     - `Etapa 1. Triagem`
     - `Etapa 2. Aguardando Parecer`
     - `Etapa 3. Em Análise`
     - `Etapa 4. Concluído`
   - Banners de transição: remover blocos com gradientes pesados e parágrafos descritivos compridos, substituindo por faixas contextuais compactas focadas na ação.

4. **Refatorar o Card do Paciente (`app/atendimentos/[id]/page.tsx`):**
   - Remover as 4 colunas sobrecarregadas de labels e metadados que desviavam a atenção.
   - Destacar com clareza imediata apenas as informações solicitadas:
     - Nome do Paciente (tipografia forte)
     - Tag da faixa etária (Adulto, Criança, Idoso, Recém-nascido)
     - Idade formatada
     - Sexo (Masculino / Feminino / Não informado)
     - Ações de contatos e histórico de forma compacta e discreta.

5. **Validação Técnica:**
   - Rodar checagem de tipos estática `npx tsc --noEmit` garantindo ausência de erros.

## Resumo da Execução
- `app/atendimentos/novo/page.tsx`:
  - Cabeçalho reestruturado com divisor sutil, botão de voltar compacto, título direto "Nova Triagem", botão "Limpar" enxuto e indicador `Etapa 1. Triagem`.
- `app/atendimentos/[id]/page.tsx`:
  - Linha do tempo canônica redesenhada exibindo estritamente os 4 passos solicitados (`Etapa 1. Triagem`, `Etapa 2. Aguardando Parecer`, `Etapa 3. Em Análise`, `Etapa 4. Concluído`) com contraste neutro premium (`bg-slate-900 text-white` para ativo).
  - Card de paciente substituído por visual limpo e focado, exibindo avatar com inicial, nome em destaque, tag da faixa etária, idade e sexo em uma única linha harmoniosa.
  - Banners prolixos e redundantes substituídos por barras de ação compactas.
- Compilação validada com `npx tsc --noEmit` (exit code 0).
