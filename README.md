# CimBahia

Sistema da Secretaria da Saúde do Estado da Bahia para apoiar a regulação de processos e a análise e emissão de pareceres farmacêuticos. O CimBahia reúne o fluxo dos processos, os dados dos pacientes, as decisões técnicas e a organização das unidades regionais em uma única aplicação.

## Funcionalidades

- Acompanhamento de processos de regulação e de suas etapas de análise.
- Cadastro e consulta de pacientes e dos itens vinculados aos processos.
- Elaboração de pareceres farmacêuticos, com histórico de versões e decisões.
- Consulta de indicadores operacionais.
- Administração de unidades regionais, municípios atendidos, origens de demanda e usuários.
- Consulta e manutenção de catálogos de medicamentos, diagnósticos e tipos de parecer.
- API para pesquisa de pareceres e decisões farmacêuticas.

## Tecnologias

- Next.js 16 com App Router, React 19 e TypeScript.
- Tailwind CSS 4 e componentes Lucide.
- Supabase: PostgreSQL e autenticação.
- Recharts para visualização de indicadores.

## Requisitos

- Node.js e npm.
- Projeto Supabase com acesso ao SQL Editor.

## Configuração local

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie `.env.example` para `.env.local` e informe as configurações:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica
   SESAB_BASE_URL=
   SESAB_API_EMAIL=
   SESAB_API_PASSWORD=
   ```

   Preencha `SESAB_BASE_URL` com o endpoint oficial confirmado e HTTPS, além do e-mail e senha institucionais. O cliente Supabase não usa credenciais de fallback: sem URL ou anon key válidas, a configuração é registrada no log e a integração não é inicializada. A anon key é pública por definição; nunca coloque uma chave `service_role` em variáveis `NEXT_PUBLIC_*`. A busca no AFSESAB só envia credenciais a endpoints configurados por ambiente e validados para HTTPS.

3. No SQL Editor do Supabase, execute os arquivos nesta ordem:

   1. `supabase/schema.sql`
   2. `supabase/migrations/20261022_cb_cids.sql`
   3. `supabase/seed-28-units-bahia.sql`
   4. `supabase/seed-municipios-bahia.sql`
   5. `supabase/migrations/sigtap_competencia_atual.sql`

   O schema cria as tabelas e políticas do CimBahia, incluindo `cb_cids`. A migração de CIDs transfere os registros e vínculos existentes da tabela antiga, quando ela existe, e atualiza a chave estrangeira dos itens de processo. Os arquivos seguintes carregam as unidades regionais, os municípios baianos e os dados de medicamentos e diagnósticos SIGTAP/CEAF.

4. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

   Acesse [http://localhost:3000](http://localhost:3000).

## Comandos

```bash
npm run dev    # servidor de desenvolvimento
npm run lint   # análise estática com ESLint
npm run build  # build de produção
npm run start  # servidor de produção (após o build)
```

## Organização do projeto

- `app/`: páginas da aplicação e rotas da API.
- `components/`: componentes de interface e layout.
- `lib/`: tipos, estado da aplicação, integrações com Supabase e utilitários.
- `data/`: dados de apoio usados pela aplicação.
- `supabase/`: schema, cargas iniciais e migrações do banco.

## Implantação

O projeto pode ser implantado na Vercel. Configure no ambiente de implantação as mesmas variáveis do Supabase usadas localmente. A configuração do projeto define a região `gru1`.
