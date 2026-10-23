# fix: correção de importação de rotas de servidor em componentes cliente

## Pergunta/Solicitação:
```
Build Error
You're importing a module that depends on "next/headers". This API is only available in Server Components in the App Router, but you are using it in the Pages Router.
## Error Type
Build Error
## Error Message
You're importing a module that depends on "next/headers". This API is only available in Server Components in the App Router, but you are using it in the Pages Router.
## Build Output
./lib/supabase/server.ts:2:1
Error: You're importing a module that depends on "next/headers". This API is only available in Server Components in the App Router, but you are using it in the Pages Router.
Import traces:
  Client Component Browser:
    ./lib/supabase/server.ts [Client Component Browser]
    ./app/api/pareceres/route.ts [Client Component Browser]
    ./app/atendimentos/page.tsx [Client Component Browser]
    ./app/atendimentos/page.tsx [Server Component]
```

## Planejamento:
1. **Identificação da Causa Raiz:**
   - O erro ocorreu porque componentes do lado do cliente (`app/atendimentos/page.tsx`, `app/pareceres/page.tsx` e `app/consulta-publica/page.tsx`) estavam importando a função utilitária `matchSubstance` e interfaces TypeScript diretamente de `app/api/pareceres/route.ts`.
   - O arquivo `app/api/pareceres/route.ts` é uma rota de API do App Router que importa `createClient` de `lib/supabase/server.ts`, o qual por sua vez utiliza `cookies` de `next/headers`.
   - Ao importar `route.ts` dentro de um componente com `"use client"`, o empacotador (Turbopack/Webpack) tenta incluir `next/headers` no bundle do cliente do navegador, disparando o erro de compilação.
2. **Refatoração e Separação de Responsabilidades:**
   - Mover a função clínica pura `matchSubstance` para `lib/utils.ts`.
   - Mover as interfaces de busca (`ParecerSearchResultItem` e `ParecerSearchResponse`) para `lib/types.ts`.
   - Atualizar todos os componentes clientes (`app/atendimentos/page.tsx`, `app/pareceres/page.tsx`, `app/consulta-publica/page.tsx`) para importarem exclusivamente de `@/lib/utils` e `@/lib/types`.
   - Garantir que `lib/supabase/server.ts` seja importado apenas em Route Handlers de servidor.
3. **Validação:**
   - Testar rotas via `curl` verificando status HTTP 200.
   - Executar compilação completa de produção com `npm run build` e checagem de tipos com `npx tsc --noEmit`.

## Resumo da Execução:
- **`lib/utils.ts`:** Adicionada e exportada a função utilitária `matchSubstance`, responsável pela correspondência flexível e insensível a acentos de nomes de fármacos.
- **`lib/types.ts`:** Adicionadas as interfaces `ParecerSearchResultItem` e `ParecerSearchResponse`.
- **`app/atendimentos/page.tsx`:** Removida a dependência de `@/app/api/pareceres/route` e substituída pela importação de `@/lib/utils`.
- **`app/pareceres/page.tsx`:** Removida a dependência de `@/app/api/pareceres/route` e substituída por `@/lib/types` e `@/lib/utils`.
- **`app/consulta-publica/page.tsx`:** Removida a dependência de `@/app/api/pareceres/route` e substituída por `@/lib/utils`.
- **Validação de Build:** O build do Next.js 16.4.0 com Turbopack compilou com sucesso 100% das 21 rotas estáticas e dinâmicas (`/atendimentos`, `/atendimentos/[id]`, `/pareceres`, `/consulta-publica`, etc.).
