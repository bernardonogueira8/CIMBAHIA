-- ==============================================================================
-- CIMBAHIA - CENTRAL INTEGRADA DE REGULAÇÃO E PARECERES FARMACÊUTICOS DA BAHIA
-- Schema Oficial de Banco de Dados: Supabase / PostgreSQL 15+
-- ==============================================================================

-- 0. Extensões essenciais
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. ESTRUTURA TERRITORIAL & FEDERATIVA DA BAHIA
-- ==============================================================================

-- 1.1 Origens da Demanda (SMS, DPE-BA, TJ-BA, Ouvidoria, CIM, MP-BA)
CREATE TABLE IF NOT EXISTS public.origens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sigla TEXT,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.2 Macrorregionais e Núcleos Regionais de Saúde (NRS)
CREATE TABLE IF NOT EXISTS public.nucleos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    macroregion TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.3 Diretorias Regionais de Saúde (DIRES)
CREATE TABLE IF NOT EXISTS public.dires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    region TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.4 Bases Regionais de Saúde (BRS)
CREATE TABLE IF NOT EXISTS public.bases_regionais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    nucleo_id UUID REFERENCES public.nucleos(id) ON DELETE SET NULL,
    dires_id UUID REFERENCES public.dires(id) ON DELETE SET NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.5 Municípios da Bahia
CREATE TABLE IF NOT EXISTS public.municipios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ibge_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    base_id UUID REFERENCES public.bases_regionais(id) ON DELETE SET NULL,
    dires_id UUID REFERENCES public.dires(id) ON DELETE SET NULL,
    nucleo_id UUID REFERENCES public.nucleos(id) ON DELETE SET NULL,
    population INTEGER,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.6 Unidades / Bases Regionais de Saúde (DASF / SESAB)
CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    macroregion TEXT NOT NULL,
    cnes TEXT,
    municipality TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.7 Municípios Atendidos por Unidade (N:N)
CREATE TABLE IF NOT EXISTS public.unit_served_municipalities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    municipio_id UUID NOT NULL REFERENCES public.municipios(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_unit_municipio UNIQUE (unit_id, municipio_id)
);

-- 1.8 Farmacêuticos Responsáveis por Unidade
CREATE TABLE IF NOT EXISTS public.unit_responsible_pharmacists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    pharmacist_id UUID,
    full_name TEXT NOT NULL,
    crf TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    is_technical_lead BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 2. CONTROLE DE ACESSO & PERFIS DE OPERADORES (RBAC)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    crf TEXT,
    phone TEXT,
    unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'farmaceutico', 'administrativo', 'gestor', 'pharmacist', 'viewer')) DEFAULT 'farmaceutico',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 3. CATÁLOGOS CLÍNICOS E TERAPÊUTICOS
-- ==============================================================================

-- 3.1 Catálogo de CIDs-10
CREATE TABLE IF NOT EXISTS public.cids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    chapter TEXT,
    group_name TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.2 Medicamentos do CEAF (SIGTAP / RENAME)
CREATE TABLE IF NOT EXISTS public.medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sigtap_code TEXT,
    name TEXT NOT NULL,
    pharmaceutical_form TEXT,
    component TEXT NOT NULL DEFAULT 'CEAF',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.3 Outros Medicamentos (Não Padronizados, Judiciais, Fórmulas Especiais)
CREATE TABLE IF NOT EXISTS public.other_medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    active_ingredient TEXT NOT NULL,
    dosage TEXT,
    pharmaceutical_form TEXT,
    anvisa_registry TEXT,
    category TEXT NOT NULL CHECK (category IN (
        'Judicial',
        'Não Padronizado no SUS',
        'Fórmula Nutricional',
        'Insumo Especial',
        'Atenção Básica/Estratégico',
        'Outros'
    )) DEFAULT 'Não Padronizado no SUS',
    notes TEXT,
    estimated_unit_cost NUMERIC(12, 2),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.4 Tipos de Parecer Técnico Parametrizados
CREATE TABLE IF NOT EXISTS public.tipos_parecer (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    regulatory_effect TEXT NOT NULL CHECK (regulatory_effect IN ('deferido', 'indeferido', 'exigencia', 'deferido_parcial')),
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 4. PACIENTES / REQUERENTES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE RESTRICT,
    cpf TEXT NOT NULL,
    cns TEXT,
    full_name TEXT NOT NULL,
    birth_date DATE,
    phone TEXT,
    municipality_id UUID REFERENCES public.municipios(id) ON DELETE SET NULL,
    municipality_name TEXT,
    status TEXT NOT NULL CHECK (status IN ('em_acompanhamento', 'alta', 'inativo')) DEFAULT 'em_acompanhamento',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_patients_cpf UNIQUE (cpf)
);

-- ==============================================================================
-- 5. PROCESSOS SEI, WORKFLOW E PARECERES TÉCNICOS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.processos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_sei TEXT NOT NULL UNIQUE,
    data_abertura DATE NOT NULL DEFAULT CURRENT_DATE,
    assunto TEXT NOT NULL,
    paciente_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
    origem_id UUID NOT NULL REFERENCES public.origens(id) ON DELETE RESTRICT,
    municipio_id UUID NOT NULL REFERENCES public.municipios(id) ON DELETE RESTRICT,
    unidade_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN (
        'aguardando_triagem',
        'em_triagem',
        'aguardando_parecer',
        'em_analise_farmaceutica',
        'em_exigencia',
        'concluido_deferido',
        'concluido_indeferido',
        'concluido_parcial'
    )) DEFAULT 'aguardando_triagem',
    priority TEXT NOT NULL CHECK (priority IN ('normal', 'urgente', 'judicial')) DEFAULT 'normal',
    
    -- Triagem Documental
    triagem_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    triagem_by_name TEXT,
    triagem_completed_at TIMESTAMPTZ,
    triagem_notes TEXT,
    triagem_documents_ok BOOLEAN NOT NULL DEFAULT false,

    -- Atribuição Farmacêutica
    assigned_pharmacist_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ,

    -- SLAs & Prazos
    sla_limit_date DATE NOT NULL,
    days_in_current_status INTEGER NOT NULL DEFAULT 1,
    is_sla_delayed BOOLEAN NOT NULL DEFAULT false,
    observations TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5.1 Itens Solicitados no Processo (Medicamentos CEAF ou Não Padronizados)
CREATE TABLE IF NOT EXISTS public.processo_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    processo_id UUID NOT NULL REFERENCES public.processos(id) ON DELETE CASCADE,
    medication_type TEXT NOT NULL CHECK (medication_type IN ('ceaf', 'outro')),
    medication_id TEXT NOT NULL,
    medication_name TEXT NOT NULL,
    cid_id UUID NOT NULL REFERENCES public.cids(id) ON DELETE RESTRICT,
    cid_code TEXT NOT NULL,
    cid_description TEXT,
    posology TEXT,
    monthly_quantity INTEGER DEFAULT 1,
    status TEXT CHECK (status IN ('deferido', 'indeferido', 'em_exigencia', 'pendente')) DEFAULT 'pendente',
    justification TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5.2 Pareceres Emitidos e Versionamento de Retificações
CREATE TABLE IF NOT EXISTS public.pareceres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    processo_id UUID NOT NULL REFERENCES public.processos(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.parecer_versoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parecer_id UUID NOT NULL REFERENCES public.pareceres(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1,
    pharmacist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    pharmacist_name TEXT NOT NULL,
    crf TEXT NOT NULL,
    tipo_parecer_id UUID NOT NULL REFERENCES public.tipos_parecer(id) ON DELETE RESTRICT,
    tipo_parecer_title TEXT NOT NULL,
    regulatory_effect TEXT NOT NULL,
    technical_justification TEXT NOT NULL,
    clinical_foundation TEXT NOT NULL,
    recommendations TEXT,
    rectification_reason TEXT,
    signature_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_parecer_version UNIQUE (parecer_id, version_number)
);

-- 5.3 Trilha de Auditoria & Tramitação do Processo
CREATE TABLE IF NOT EXISTS public.processo_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    processo_id UUID NOT NULL REFERENCES public.processos(id) ON DELETE CASCADE,
    from_status TEXT,
    to_status TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    notes TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 6. POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- ==============================================================================

ALTER TABLE public.origens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nucleos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bases_regionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.municipios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_served_municipalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_responsible_pharmacists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.other_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_parecer ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pareceres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parecer_versoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processo_historico ENABLE ROW LEVEL SECURITY;

-- Políticas de Leitura para Usuários Autenticados
CREATE POLICY "Permitir leitura para usuarios autenticados em origens" ON public.origens FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir leitura para usuarios autenticados em nucleos" ON public.nucleos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir leitura para usuarios autenticados em dires" ON public.dires FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir leitura para usuarios autenticados em bases" ON public.bases_regionais FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir leitura para usuarios autenticados em municipios" ON public.municipios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir leitura para usuarios autenticados em units" ON public.units FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir leitura para usuarios autenticados em cids" ON public.cids FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir leitura para usuarios autenticados em medications" ON public.medications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir leitura para usuarios autenticados em other_medications" ON public.other_medications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir leitura para usuarios autenticados em tipos_parecer" ON public.tipos_parecer FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir leitura para usuarios autenticados em patients" ON public.patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir leitura para usuarios autenticados em processos" ON public.processos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir leitura para usuarios autenticados em processo_items" ON public.processo_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir leitura para usuarios autenticados em pareceres" ON public.pareceres FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir leitura para usuarios autenticados em parecer_versoes" ON public.parecer_versoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir leitura para usuarios autenticados em processo_historico" ON public.processo_historico FOR SELECT TO authenticated USING (true);

-- Políticas de Escrita para Usuários Autenticados
CREATE POLICY "Permitir escrita para usuarios autenticados em patients" ON public.patients FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir escrita para usuarios autenticados em processos" ON public.processos FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir escrita para usuarios autenticados em processo_items" ON public.processo_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir escrita para usuarios autenticados em pareceres" ON public.pareceres FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir escrita para usuarios autenticados em parecer_versoes" ON public.parecer_versoes FOR ALL TO authenticated USING (true);
CREATE POLICY "Permitir escrita para usuarios autenticados em processo_historico" ON public.processo_historico FOR ALL TO authenticated USING (true);

-- ==============================================================================
-- 7. CARGA DE DADOS INICIAIS (SEED INSTITUCIONAL SESAB / CIMBAHIA)
-- ==============================================================================

-- 7.1 Origens
INSERT INTO public.origens (id, name, sigla, description, active) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Secretaria Municipal de Saúde (SMS)', 'SMS', 'Demandas originadas pelas secretarias municipais de saúde da Bahia', true),
    ('00000000-0000-0000-0000-000000000002', 'Defensoria Pública do Estado da Bahia', 'DPE-BA', 'Atendimento pré-processual ou pedidos de conciliação de saúde', true),
    ('00000000-0000-0000-0000-000000000003', 'Tribunal de Justiça da Bahia / Mandado Judicial', 'TJ-BA', 'Determinações judiciais de fornecimento de medicamentos', true),
    ('00000000-0000-0000-0000-000000000004', 'Ouvidoria Geral do SUS / Bahia', 'OUV-SUS', 'Reclamações, solicitações e reavaliações protocoladas via Ouvidoria', true),
    ('00000000-0000-0000-0000-000000000005', 'Consórcio Interfederativo de Saúde (CIM)', 'CIM', 'Políticas e pareceres no âmbito dos consórcios interfederativos', true),
    ('00000000-0000-0000-0000-000000000006', 'Ministério Público do Estado da Bahia', 'MP-BA', 'Procedimentos preparatórios e termos de ajustamento de conduta', true)
ON CONFLICT (id) DO NOTHING;

-- 7.2 Núcleos Regionais de Saúde (NRS)
INSERT INTO public.nucleos (id, code, name, macroregion, active) VALUES
    ('10000000-0000-0000-0000-000000000001', 'NRS-LESTE', 'NRS Leste / Salvador', 'Macrorregional Leste', true),
    ('10000000-0000-0000-0000-000000000002', 'NRS-CENTRO-LESTE', 'NRS Centro-Leste (Feira de Santana)', 'Macrorregional Centro-Leste', true),
    ('10000000-0000-0000-0000-000000000003', 'NRS-NORTE', 'NRS Norte (Juazeiro / Paulo Afonso)', 'Macrorregional Norte', true),
    ('10000000-0000-0000-0000-000000000004', 'NRS-SUDOESTE', 'NRS Sudoeste (Vitória da Conquista)', 'Macrorregional Sudoeste', true),
    ('10000000-0000-0000-0000-000000000005', 'NRS-SUL', 'NRS Sul (Ilhéus / Itabuna)', 'Macrorregional Sul', true),
    ('10000000-0000-0000-0000-000000000006', 'NRS-OESTE', 'NRS Oeste (Barreiras)', 'Macrorregional Oeste', true)
ON CONFLICT (code) DO NOTHING;

-- 7.3 DIRES
INSERT INTO public.dires (id, code, name, region, active) VALUES
    ('20000000-0000-0000-0000-000000000001', '1ª DIRES', '1ª Diretoria Regional de Saúde - Salvador', 'Leste', true),
    ('20000000-0000-0000-0000-000000000002', '2ª DIRES', '2ª Diretoria Regional de Saúde - Feira de Santana', 'Centro-Leste', true),
    ('20000000-0000-0000-0000-000000000003', '3ª DIRES', '3ª Diretoria Regional de Saúde - Alagoinhas', 'Nordeste', true),
    ('20000000-0000-0000-0000-000000000004', '4ª DIRES', '4ª Diretoria Regional de Saúde - Santo Antônio de Jesus', 'Recôncavo', true),
    ('20000000-0000-0000-0000-000000000014', '14ª DIRES', '14ª Diretoria Regional de Saúde - Juazeiro', 'Norte', true),
    ('20000000-0000-0000-0000-000000000020', '20ª DIRES', '20ª Diretoria Regional de Saúde - Vitória da Conquista', 'Sudoeste', true)
ON CONFLICT (code) DO NOTHING;

-- 7.4 Tipos de Parecer Técnico
INSERT INTO public.tipos_parecer (id, code, title, regulatory_effect, description, active) VALUES
    ('30000000-0000-0000-0000-000000000001', 'TP-DEF-INT', 'Deferido Integralmente', 'deferido', 'Atende a todos os critérios de inclusão clínicos e documentais do PCDT', true),
    ('30000000-0000-0000-0000-000000000002', 'TP-IND-CRIT', 'Indeferido por Não Preenchimento de Critérios', 'indeferido', 'Não atende aos critérios técnicos de inclusão ou apresenta contraindicação clínica', true),
    ('30000000-0000-0000-0000-000000000003', 'TP-EXIG-DOC', 'Em Exigência de Documentos / Laudos', 'exigencia', 'Necessária complementação de exames obrigatórios, laudos ou reavaliação médica', true),
    ('30000000-0000-0000-0000-000000000004', 'TP-DEF-PARC', 'Deferido Parcialmente', 'deferido_parcial', 'Autorizada parte da terapêutica ou com adequação de posologia recomendada', true),
    ('30000000-0000-0000-0000-000000000005', 'TP-IND-PADR', 'Indeferido - Medicamento Não Padronizado', 'indeferido', 'Existe alternativa terapêutica padronizada no SUS não esgotada previamente', true)
ON CONFLICT (code) DO NOTHING;

-- 7.5 Unidades Principais
INSERT INTO public.units (id, name, macroregion, cnes, municipality, email, phone, address, active) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Base Regional de Saúde Paulo Afonso', 'Macrorregional Norte', '2801452', 'Paulo Afonso', 'brs.pauloafonso@saude.ba.gov.br', '(75) 3281-4450', 'Rua das Laranjeiras, 140 - Centro, Paulo Afonso - BA', true),
    ('22222222-2222-2222-2222-222222222222', 'Base Regional de Saúde Juazeiro', 'Macrorregional Norte', '2801460', 'Juazeiro', 'brs.juazeiro@saude.ba.gov.br', '(74) 3611-8890', 'Av. Adolfo Viana, 520 - São Geraldo, Juazeiro - BA', true),
    ('33333333-3333-3333-3333-333333333333', 'Base Regional de Saúde Feira de Santana', 'Macrorregional Centro-Leste', '2801479', 'Feira de Santana', 'brs.feira@saude.ba.gov.br', '(75) 3602-5500', 'Av. Maria Quitéria, 1200 - Kalilândia, Feira de Santana - BA', true),
    ('44444444-4444-4444-4444-444444444444', 'Base Regional de Saúde Vitória da Conquista', 'Macrorregional Sudoeste', '2801487', 'Vitória da Conquista', 'brs.conquista@saude.ba.gov.br', '(77) 3424-8100', 'Rua Crescêncio Silveira, 80 - Centro, Vitória da Conquista - BA', true),
    ('55555555-5555-5555-5555-555555555555', 'Central Integrada CimBahia - SESAB Sede', 'Macrorregional Leste', '2801495', 'Salvador', 'cimbahia@saude.ba.gov.br', '(71) 3115-4200', '4ª Avenida, 400 - Centro Administrativo da Bahia (CAB), Salvador - BA', true)
ON CONFLICT (id) DO NOTHING;
