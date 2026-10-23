# fix: separação e especialização das telas de triagem, aguardando parecer e análise

## Pergunta/Solicitação:
Estou com problemas nas telas de edição dos status "Etapa 1. Triagem" fica igual a tela "Em análise" e Etapa 2. Aguardando Parecer

## Planejamento:
1. **Diagnóstico da Causa Raiz:**
   - Em `app/atendimentos/[id]/page.tsx`, a seção de deliberação técnica ("Decisões Individuais por Combo") e a seção de emissão do laudo ("Parecer Técnico Consolidado Unificado") eram renderizadas incondicionalmente em todas as etapas regulatórias.
   - Isso fazia com que usuários em "Etapa 1. Triagem" (conferência documental) e "Etapa 2. Aguardando Parecer" (fila de regulação) vissem botões de Deferido/Indeferido/Exigência, fundamentação clínica e formulário de emissão de parecer antes mesmo do início da análise farmacêutica.
2. **Arquitetura das 4 Telas Especializadas por `currentStage`:**
   - **Etapa 1. Triagem (`currentStage === "triagem"`):**
     - Banner informativo de conferência documental e cadastral.
     - Card "Fármacos da Demanda (Conferência de Triagem)": listagem limpa dos fármacos solicitados com opções de adicionar, editar e remover.
     - Card de rodapé com botão claro: "Concluir Triagem e Enviar para Parecer" (chama `handleConcluirTriagem`).
     - Ocultação completa de botões de parecer e deliberação clínica.
   - **Etapa 2. Aguardando Parecer (`currentStage === "aguardando_parecer"`):**
     - Banner da Fila de Regulação Farmacêutica com status, indicação do parecerista designado (ou pendente) e botões de ação: "Iniciar Análise Farmacêutica" (chama `handleAssumirParecer`) e "Devolver para Triagem" (chama `handleRetornarTriagemInicial`).
     - Lista prévia dos medicamentos solicitados com badge "Aguardando Início da Análise".
     - Ocultação de formulários de emissão de laudo até que o parecerista assuma a demanda.
   - **Etapa 3. Em Análise (`currentStage === "em_analise"`):**
     - Bancada de trabalho completa do parecerista: deliberações individuais por combo (Deferido, Indeferido, Em Exigência, Deferido Parcial), consulta ao Banco de Pareceres reais com ordenação cronológica e fundamentações individuais.
     - Card do Parecer Técnico Consolidado Unificado: gerador automático de laudo, recomendações de dispensação, assinatura digital e botão "Emitir e Concluir Parecer".
   - **Etapa 4. Concluído (`currentStage === "concluido"`):**
     - Modo oficial de visualização/leitura do parecer homologado e assinado digitalmente, com botões para "Imprimir Laudo Oficial" e "Retificar Parecer".
3. **Validação:**
   - Execução de `npx tsc --noEmit` para garantir conformidade total de tipos no TypeScript.

## Resumo da Execução:
- Refatorado `app/atendimentos/[id]/page.tsx` para condicionar o miolo da página às 4 etapas canônicas do fluxo regulatório.
- Eliminada a poluição visual e a sobrecarga cognitiva na Triagem e na Fila de Regulação.
- Compilação validada com sucesso com código de saída 0.
