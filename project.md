# PharmaCare — SaaS de Monitoramento e Gestão do Cuidado Farmacêutico

Sistema completo para gestão de consultas farmacêuticas, acompanhamento farmacoterapêutico (CEAF / Macrorregionais de Saúde) e apuração automatizada dos **11 Indicadores Oficiais da Assistência Farmacêutica**.

---

## 1. Stack Tecnológica
- **Framework:** Next.js 16 (App Router, Turbopack, TypeScript)
- **UI & Design System:** Tesla Design System (TDS) + Tailwind CSS + Lucide Icons + Recharts
- **Backend & Banco de Dados:** Supabase (PostgreSQL 15+, Supabase Auth, Row Level Security - RLS)
- **Hospedagem:** Vercel

---

## 2. Identidade Visual (Tesla Design System - TDS)
- **Brand Red (`#E82127`):** Destaque visual, acentos de botões de perigo, identificadores de status e marca institucional.
- **Midnight Core (`#171A20`):** Elementos estruturais escuros de alto contraste, barra de navegação, cabeçalhos de tabela e botões primários.
- **Graphite (`#393C41`):** Subtítulos, bordas ativas e ícones secundários.
- **Muted Slate (`#5C5E62`):** Textos auxiliares, legendas técnicas e notas de rodapé.
- **Surface Light Gray (`#F4F4F6` / `#EEEEEE`):** Superfícies sutis de cards e inputs.
- **Pure White (`#FFFFFF`):** Fundo de cartões de dados e tabelas clínicas.

---

## 3. Regra de Ouro de Permissão e Multi-Tenancy (RLS)
1. **Visibilidade Global (Leitura):** Qualquer usuário autenticado de uma unidade visualiza atendimentos, pacientes e indicadores de todas as outras bases regionais para acompanhamento e benchmark macrorregional.
2. **Isolamento de Escrita:** O usuário só pode criar, editar ou excluir registros vinculados à sua própria unidade (`unit_id = profiles.unit_id`). Usuários com `role = 'admin'` possuem permissão irrestrita.
3. **Banner de Aviso Somente Leitura:** Ao inspecionar outra unidade, a interface exibe o alerta:
   > *"Modo Visualização (Somente Leitura) — Você está visualizando os dados da unidade [Nome]"*
   e desabilita ações de criação e edição.
4. **Catálogos Globais Compartilhados:** Medicamentos (RENAME/CEAF) e CIDs-10 são unificados: qualquer profissional autenticado pode cadastrar novos itens.

---

## 4. Os 11 Indicadores Oficiais

| Nº | Código | Denominação | Fórmula / Método |
| :---: | :---: | :--- | :--- |
| **1** | `IND-01` | Pacientes em Acompanhamento Farmacoterapêutico | Contagem de pacientes ativos na competência (`monthly_data.total_patients_in_followup`) |
| **2** | `IND-02` | Pacientes Atendidos no Acompanhamento no Mês | `COUNT(DISTINCT patient_id)` onde `is_guidance_only = false` |
| **3** | `IND-03` | Primeiras Consultas Farmacêuticas no Mês | `COUNT(DISTINCT patient_id)` onde `is_new_patient = true` |
| **4** | `IND-04` | Consultas de Retorno Realizadas no Mês | `COUNT(DISTINCT patient_id)` onde `is_new_patient = false` |
| **5** | `IND-05` | Problemas Relacionados à Farmacoterapia (PRF) | `COUNT(*)` de registros em `consultation_prfs` no período |
| **6** | `IND-06` | Taxa de Resolução de PRFs | `(PRFs Resolvidos / Total de PRFs) * 100` (%) |
| **7** | `IND-07` | Média de Intervenções por Paciente | `Total de Intervenções / Pacientes Atendidos no Acompanhamento` |
| **8** | `IND-08` | Pacientes com Alta Farmacêutica no Mês | `COUNT(DISTINCT patient_id)` onde `pharmaceutical_discharge = true` |
| **9** | `IND-09` | Atividades Coletivas / Grupos Educativos | `monthly_data.collective_health_activities` |
| **10** | `IND-10` | Pacientes Atendidos Administrativamente (AFSESAB) | `monthly_data.dispensing_administrative_patients` |
| **11** | `IND-11` | Cobertura de 1ª Dispensação por Farmacêutico | `(1ªs Dispensações por Farmacêutico / Novos Processos da Unidade) * 100` (%) |

---

## 5. Estrutura de Arquivos Criada
- `supabase/schema.sql`: Script SQL completo com tabelas, índices, triggers, RLS e stored procedure.
- `lib/types.ts`: Tipos TypeScript estritos de todo o domínio.
- `lib/indicators.ts`: Motor de cálculo dos 11 indicadores oficiais.
- `lib/mock-data.ts`: Base de dados de alta fidelidade para homologação e desenvolvimento.
- `lib/context/AppContext.tsx`: Gerenciador de estado, auditoria de permissões e multi-tenancy.
- `components/ui/`: Botões, cards, badges, inputs, selects e modais no padrão Tesla Design System.
- `components/layout/`: Header com seletor de unidade, identificação do farmacêutico e navigation bar.
- `app/indicadores/page.tsx`: Painel com KPIs, gráficos Recharts e tabela oficial dos 11 indicadores.
- `app/atendimentos/`: Listagem e formulário de consulta com PRFs dinâmicos e SOAP.
- `app/pacientes/page.tsx`: Gestão de pacientes e modal de histórico de consultas.
- `app/fechamento-mensal/page.tsx`: Tela de consolidação mensal dos dados complementares.
- `app/cadastros/page.tsx`: Catálogos de Medicamentos e CID-10.
- `app/unidades/page.tsx`: Gestão de Unidades e Lotação de Usuários.
