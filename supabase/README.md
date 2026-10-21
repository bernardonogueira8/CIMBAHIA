# CimBahia — Estrutura de Banco de Dados Supabase (PostgreSQL 15+)

Este diretório contém os scripts SQL oficiais, funcionais e versionados para o provisionamento e manutenção da infraestrutura de banco de dados do **CimBahia** (Central Integrada de Regulação e Pareceres Farmacêuticos da Bahia - SESAB).

> [!IMPORTANT]
> **Isolamento Total (`cb_*`)**: Todas as tabelas operacionais, institucionais e territoriais do CimBahia possuem o prefixo **`cb_`** (ex: `cb_processos`, `cb_pareceres`, `cb_patients`, `cb_units`). Isso garante **coexistência segura e zero interferência** com quaisquer outros sistemas hospedados na mesma instância Supabase (como o PharmaCare legado).
>
> Apenas os catálogos públicos e universais da assistência farmacêutica (`public.cids`, `public.medications` e `public.medication_authorized_cids`) são compartilhados de forma transparente entre aplicações.

---

## 📁 Estrutura de Arquivos Funcionais

| Arquivo | Descrição | Status |
| :--- | :--- | :--- |
| [`schema.sql`](./schema.sql) | **Schema Oficial Consolidado**: Criação de todas as tabelas isoladas do ecossistema (`cb_origens`, `cb_nucleos`, `cb_dires`, `cb_bases_regionais`, `cb_municipios`, `cb_units`, `cb_profiles`, `cb_patients`, `cb_processos`, `cb_processo_items`, `cb_pareceres`, `cb_parecer_versoes`, `cb_processo_historico`, etc.), garantindo autonomia, triggers de auditoria e políticas de **RLS**. | **Principal / Obrigatório** |
| [`seed-28-units-bahia.sql`](./seed-28-units-bahia.sql) | **Bases Regionais (BRS/NRS)**: Carga das 28 Unidades / Bases Regionais de Saúde da Bahia na tabela `cb_units`. | **Carga Institucional** |
| [`seed-municipios-bahia.sql`](./seed-municipios-bahia.sql) | **Território da Bahia**: Carga de todos os 417 municípios baianos com seus respectivos códigos oficiais do IBGE na tabela `cb_municipios`. | **Carga Territorial** |
| [`migrations/sigtap_competencia_atual.sql`](./migrations/sigtap_competencia_atual.sql) | **Catálogo SIGTAP / CEAF**: Carga de 363 medicamentos especializados, 408 diagnósticos PCDT (CIDs) e 3.445 relações de compatibilidade autorizada. | **Catálogo Terapêutico** |

---

## 🚀 Ordem de Execução no Supabase SQL Editor

Para provisionar o ambiente no Supabase:

1. **Executar [`schema.sql`](./schema.sql)**:
   - Habilita extensões `uuid-ossp` e `pgcrypto`.
   - Cria as tabelas `cb_*` de regulação, pareceres e workflow SEI.
   - Aplica as políticas de segurança de linha (**Row Level Security - RLS**).
   - Insere os dados institucionais básicos (origens de demanda, núcleos regionais, DIRES, tipos de parecer regulatório).

2. **Executar [`seed-28-units-bahia.sql`](./seed-28-units-bahia.sql)**:
   - Registra as 28 BRS/NRS na tabela `public.cb_units`.

3. **Executar [`seed-municipios-bahia.sql`](./seed-municipios-bahia.sql)**:
   - Registra os 417 municípios baianos na tabela `public.cb_municipios`.

4. **Executar [`migrations/sigtap_competencia_atual.sql`](./migrations/sigtap_competencia_atual.sql)**:
   - Popula a tabela `medication_authorized_cids` e a lista completa de medicamentos e CIDs oficiais do CEAF (caso ainda não estejam populados no banco).
