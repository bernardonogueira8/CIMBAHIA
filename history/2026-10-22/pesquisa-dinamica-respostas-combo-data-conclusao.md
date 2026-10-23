# feat: pesquisa dinamica de respostas anteriores do combo por data de conclusao

## Pergunta/Solicitação
Agora preciso que Dentro de um processo em análise, esteja dinamicamente pesquisando o hístorico de Respostas do combo, ou seja que pesquise no repositorico de pareceres, para aquele farmaco e cid, oque já foi dito no passado, as resposta rapidas serem as ultimas duas respostas mais recentes(usar data de conclusao).

## Planejamento
1. Aprimorar a função `getComboDecisionsHistory` em [app/atendimentos/[id]/page.tsx](file:///c:/Dev/Cimbahia/app/atendimentos/%5Bid%5D/page.tsx) para varrer dinamicamente todos os processos anteriores cadastrados no repositório oficial de pareceres.
2. Identificar e extrair estritamente as respostas e fundamentações técnicas específicas que já foram ditas no passado para a combinação exata de fármaco e diagnóstico (CID).
3. Capturar a data de conclusão precisa de cada parecer/avaliação (`p.parecer?.active_version?.created_at`, `it.evaluated_at` ou conclusão no histórico de tramitação).
4. Implementar a ordenação estritamente decrescente pela **data de conclusão** (`new Date(b.dataConclusao).getTime() - new Date(a.dataConclusao).getTime()`).
5. Configurar as **respostas rápidas** do card do item para exibir diretamente as duas decisões mais recentes do repositório, com badges indicativas ("1ª Mais Recente", "2ª Mais Recente"), data de conclusão formatada, identificação do parecerista e botão direto para "Reaproveitar Fundamentação".
6. Validar a compilação e tipagem com TypeScript (`npx tsc --noEmit`).

## Resumo da Execução
Implementada a busca dinâmica no repositório de pareceres em [app/atendimentos/[id]/page.tsx](file:///c:/Dev/Cimbahia/app/atendimentos/%5Bid%5D/page.tsx). Agora, para qualquer item avaliado, o sistema pesquisa no repositório todas as decisões passadas que compartilham o mesmo fármaco e CID, extraindo a fundamentação clínica e ordenando estritamente pela data de conclusão mais recente. As duas respostas mais recentes são apresentadas imediatamente como respostas rápidas com badges de destaque e botão para aplicação instantânea ao item em avaliação. A tipagem estrita com TypeScript foi validada com sucesso.
