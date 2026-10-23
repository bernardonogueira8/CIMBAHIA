# fix: hydration mismatch na contagem de pareceres da consulta pública

## Pergunta/Solicitação:
Recoverable Error: "Hydration failed because the server rendered text didn't match the client" em `app/consulta-publica/page.tsx:591` (`Pareceres Encontrados ({filteredPareceres.length})`: servidor renderizou `0`, cliente `3`).

## Planejamento:
1. Localizar a origem da divergência: `processos` vem do `AppContext`, cujo `useState` inicializa lendo `localStorage` quando `window` existe. No servidor usa `INITIAL_PROCESSOS`; no cliente, o conteúdo salvo, gerando contagens diferentes no primeiro render.
2. Corrigir de forma localizada na página: usar lista vazia no primeiro render (igual ao servidor) e só usar os processos reais após a montagem (`useEffect`).
3. Validar tipos com `npx tsc --noEmit`.

## Resumo da Execução:
- `app/consulta-publica/page.tsx`: adicionado flag `isMounted`; `processos` agora é `[]` até a montagem e passa a refletir o contexto depois. Servidor e primeiro render do cliente ficam idênticos, eliminando o erro.
- Observação: a causa raiz está no inicializador do `AppContext` (leitura de `localStorage` no `useState`), que pode afetar outras telas que renderizem dados de `processos` já no SSR; avaliar mover essa leitura para um `useEffect` no futuro.
