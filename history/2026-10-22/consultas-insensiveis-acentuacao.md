# feat: busca textual insensível a acentuação em todo o sistema

* **Pergunta/Solicitação:** Nas consultas em todo o sistema, preciso que acentos sejam desconsiderados, ou seja, ao realizar consulta deve achar mesmo com ou sem acento, isso deverá ser aplicado em todos os buscadores de texto, que usuario interage.

* **Planejamento:**
1. **Compreensão do Requisito:**
   - Em todo o sistema (listagem de atendimentos, criação de novo processo, detalhes do atendimento e avaliação farmacêutica, cadastro de pacientes, catálogo de fármacos e CIDs, gestão de unidades e municípios da Bahia, gestão de usuários, busca de pareceres e endpoints de API), qualquer termo digitado pelo usuário deve localizar o registro correspondente independentemente de ter sido digitado com ou sem acento/diacrítico (ex: "acido" encontra "Ácido", "vitória" encontra "Vitória da Conquista" ou "Vitoria", "lesao" encontra "Lesão", "câncer" ou "cancer", "joão" ou "joao").
2. **Camada Utilitária Central (`lib/utils.ts`):**
   - Implementar `normalizeText(text)` que decompõe caracteres Unicode via NFD (`normalize("NFD")`), remove diacríticos através da regex `/[\u0300-\u036f]/g`, converte para minúsculas e aplica trim.
   - Implementar `matchNormalized(target, query)` que avalia a correspondência direta e por tokens de palavras em ordem arbitrária, tratando valores nulos e vazios com segurança.
3. **Camada de Banco de Dados e API:**
   - **PostgreSQL / Supabase:** Habilitar extensão `unaccent`, criar wrapper determinístico `immutable_unaccent(text)` para possibilitar criação de índice funcional `idx_cb_cids_unaccent_desc` na tabela `cb_cids` (12.455 registros de CIDs-10).
   - Criar RPC `cb_search_cids` em PL/pgSQL permitindo busca acelerada e sem acentos por código e descrição.
   - Atualizar [app/api/cids/route.ts](file:///c:/Dev/Cimbahia/app/api/cids/route.ts) para usar a RPC com fallback seguro.
   - Atualizar [app/api/municipios/route.ts](file:///c:/Dev/Cimbahia/app/api/municipios/route.ts) para filtrar municípios, macrorregiões e BRS com `matchNormalized`.
   - Atualizar [app/api/pareceres/route.ts](file:///c:/Dev/Cimbahia/app/api/pareceres/route.ts) para buscar substâncias, diagnósticos, fundamentações e números SEI sem diferenciação de acentos.
4. **Camada de Interface com o Usuário (UI/UX):**
   - [app/atendimentos/page.tsx](file:///c:/Dev/Cimbahia/app/atendimentos/page.tsx): Atualizar o filtro de busca (`searchTerm`) para buscar com `matchNormalized` em número SEI, nome do paciente, CPF, CNS, município, assunto, e-mails, telefones, substâncias e CIDs.
   - [app/atendimentos/novo/page.tsx](file:///c:/Dev/Cimbahia/app/atendimentos/novo/page.tsx): Atualizar busca de pacientes (`filteredPatients`), autocompletes de municípios (`filteredNewPatientMunicipios` e `filteredProcessoMunicipios`) e autocomplete do catálogo de fármacos (`filteredFarmacos`).
   - [app/atendimentos/[id]/page.tsx](file:///c:/Dev/Cimbahia/app/atendimentos/[id]/page.tsx): Atualizar autocomplete de fármacos no modal do farmacêutico (`filteredFarmacos`) e busca histórica/precedentes clínicos com `normalizeText`.
   - [app/pacientes/page.tsx](file:///c:/Dev/Cimbahia/app/pacientes/page.tsx): Atualizar busca de pacientes (`filteredPatients`) e autocomplete de municípios (`filteredMunicipios`).
   - [app/cadastros/page.tsx](file:///c:/Dev/Cimbahia/app/cadastros/page.tsx): Atualizar busca de fármacos (`filteredFarmacos`) e busca debounced de CIDs conectada à RPC com `unaccent`.
   - [app/unidades/page.tsx](file:///c:/Dev/Cimbahia/app/unidades/page.tsx): Atualizar busca de bases/unidades (`filteredUnits`), farmacêuticos responsáveis e tabela de 417 municípios (`filteredMunicipios`).
   - [app/usuarios/page.tsx](file:///c:/Dev/Cimbahia/app/usuarios/page.tsx): Atualizar busca de servidores e farmacêuticos (`filteredProfiles`) por nome, e-mail e CRF.
   - [app/pareceres/page.tsx](file:///c:/Dev/Cimbahia/app/pareceres/page.tsx): Atualizar seleção de substâncias frequentes com `normalizeText`.
5. **Validação e Homologação:**
   - Validar com `npx tsc --noEmit` (0 erros).
   - Validar com `npm run build` (20 rotas estáticas e dinâmicas geradas com sucesso).
   - Executar checklist de segurança silencioso.

* **Resumo da Execução:**
- Criadas as funções `normalizeText` e `matchNormalized` em [lib/utils.ts](file:///c:/Dev/Cimbahia/lib/utils.ts), fornecendo normalização de diacríticos e busca flexível por tokens.
- Habilitada a extensão `unaccent` no PostgreSQL do Supabase, criada a função `public.immutable_unaccent`, o índice `idx_cb_cids_unaccent_desc` e a função RPC `public.cb_search_cids` documentadas em [supabase/schema.sql](file:///c:/Dev/Cimbahia/supabase/schema.sql).
- Atualizadas as rotas de API:
  - [app/api/cids/route.ts](file:///c:/Dev/Cimbahia/app/api/cids/route.ts)
  - [app/api/municipios/route.ts](file:///c:/Dev/Cimbahia/app/api/municipios/route.ts)
  - [app/api/pareceres/route.ts](file:///c:/Dev/Cimbahia/app/api/pareceres/route.ts)
- Atualizados todos os componentes de busca do frontend:
  - [app/atendimentos/page.tsx](file:///c:/Dev/Cimbahia/app/atendimentos/page.tsx)
  - [app/atendimentos/novo/page.tsx](file:///c:/Dev/Cimbahia/app/atendimentos/novo/page.tsx)
  - [app/atendimentos/[id]/page.tsx](file:///c:/Dev/Cimbahia/app/atendimentos/[id]/page.tsx)
  - [app/pacientes/page.tsx](file:///c:/Dev/Cimbahia/app/pacientes/page.tsx)
  - [app/cadastros/page.tsx](file:///c:/Dev/Cimbahia/app/cadastros/page.tsx)
  - [app/unidades/page.tsx](file:///c:/Dev/Cimbahia/app/unidades/page.tsx)
  - [app/usuarios/page.tsx](file:///c:/Dev/Cimbahia/app/usuarios/page.tsx)
  - [app/pareceres/page.tsx](file:///c:/Dev/Cimbahia/app/pareceres/page.tsx)
- Compilação e build testados com sucesso total (código de saída 0).
