-- ==============================================================================
-- CIMBAHIA - CENTRAL INTEGRADA DE REGULAÇÃO E PARECERES FARMACÊUTICOS DA BAHIA
-- Schema Oficial de Banco de Dados: Supabase / PostgreSQL 15+
-- Todas as tabelas operacionais e territoriais utilizam o prefixo 'cb_' para
-- total isolamento e coexistência pacífica com outros sistemas no mesmo banco.
-- ==============================================================================

-- 0. Extensões essenciais
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Função utilitária para atualização automática de updated_at
CREATE OR REPLACE FUNCTION public.cb_handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 1. ESTRUTURA TERRITORIAL & FEDERATIVA DA BAHIA (cb_*)
-- ==============================================================================

-- 1.1 Origens da Demanda (SMS, DPE-BA, TJ-BA, Ouvidoria, CIM, MP-BA)
CREATE TABLE IF NOT EXISTS public.cb_origens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sigla TEXT,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.2 Macrorregionais e Núcleos Regionais de Saúde (NRS)
CREATE TABLE IF NOT EXISTS public.cb_nucleos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    macroregion TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.3 Diretorias Regionais de Saúde (DIRES)
CREATE TABLE IF NOT EXISTS public.cb_dires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    region TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.4 Bases Regionais de Saúde (BRS)
CREATE TABLE IF NOT EXISTS public.cb_bases_regionais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    nucleo_id UUID REFERENCES public.cb_nucleos(id) ON DELETE SET NULL,
    dires_id UUID REFERENCES public.cb_dires(id) ON DELETE SET NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.5 Municípios da Bahia (417 Municípios)
CREATE TABLE IF NOT EXISTS public.cb_municipios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ibge_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    base_id UUID REFERENCES public.cb_bases_regionais(id) ON DELETE SET NULL,
    dires_id UUID REFERENCES public.cb_dires(id) ON DELETE SET NULL,
    nucleo_id UUID REFERENCES public.cb_nucleos(id) ON DELETE SET NULL,
    population INTEGER,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cb_municipios_ibge ON public.cb_municipios(ibge_code);
CREATE INDEX IF NOT EXISTS idx_cb_municipios_name ON public.cb_municipios(name);

-- 1.6 Unidades / Bases Regionais de Saúde (DASF / SESAB - 28 BRS/NRS)
CREATE TABLE IF NOT EXISTS public.cb_units (
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
CREATE TABLE IF NOT EXISTS public.cb_unit_served_municipalities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES public.cb_units(id) ON DELETE CASCADE,
    municipio_id UUID NOT NULL REFERENCES public.cb_municipios(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_cb_unit_municipio UNIQUE (unit_id, municipio_id)
);

-- 1.8 Farmacêuticos Responsáveis por Unidade
CREATE TABLE IF NOT EXISTS public.cb_unit_responsible_pharmacists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES public.cb_units(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS public.cb_profiles (
    id UUID PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    crf TEXT,
    phone TEXT,
    unit_id UUID REFERENCES public.cb_units(id) ON DELETE SET NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'farmaceutico', 'administrativo', 'gestor', 'pharmacist', 'viewer')) DEFAULT 'farmaceutico',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 3. CATÁLOGOS CLÍNICOS E TERAPÊUTICOS
-- ==============================================================================

-- 3.1 Catálogo de CIDs do CimBahia e catálogos terapêuticos
CREATE TABLE IF NOT EXISTS public.cb_cids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    chapter TEXT,
    group_name TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cb_cids_code ON public.cb_cids(code);
REVOKE ALL ON TABLE public.cb_cids FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cb_cids TO authenticated;

-- Wrapper imutável para a extensão unaccent visando indexação e buscas aceleradas
CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
  RETURNS text AS
$func$
SELECT public.unaccent('public.unaccent', $1)
$func$ LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT;

CREATE INDEX IF NOT EXISTS idx_cb_cids_unaccent_desc ON public.cb_cids(public.immutable_unaccent(description));

-- Função RPC para busca de CIDs insensível a acentuação e caixa
CREATE OR REPLACE FUNCTION public.cb_search_cids(
  search_term TEXT DEFAULT '',
  chapter_filter TEXT DEFAULT '',
  page_limit INT DEFAULT 50,
  page_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  code TEXT,
  description TEXT,
  chapter TEXT,
  group_name TEXT,
  active BOOLEAN,
  created_at TIMESTAMPTZ,
  total_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    c.id,
    c.code,
    c.description,
    c.chapter,
    c.group_name,
    c.active,
    c.created_at,
    COUNT(*) OVER() AS total_count
  FROM public.cb_cids c
  WHERE 
    (
      search_term = '' 
      OR c.code ILIKE ('%' || search_term || '%')
      OR public.immutable_unaccent(c.description) ILIKE ('%' || public.immutable_unaccent(search_term) || '%')
    )
    AND (chapter_filter = '' OR c.chapter = chapter_filter)
  ORDER BY c.code
  LIMIT page_limit
  OFFSET page_offset;
$$;

GRANT EXECUTE ON FUNCTION public.cb_search_cids TO authenticated, anon;

CREATE TABLE IF NOT EXISTS public.medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sigtap_code TEXT,
    name TEXT NOT NULL,
    pharmaceutical_form TEXT,
    component TEXT NOT NULL DEFAULT 'CEAF',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_medications_sigtap_code ON public.medications(sigtap_code);
CREATE INDEX IF NOT EXISTS idx_medications_name ON public.medications(name);

CREATE TABLE IF NOT EXISTS public.medication_authorized_cids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sigtap_code TEXT NOT NULL,
    cid_code TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_med_auth_cid UNIQUE (sigtap_code, cid_code)
);
CREATE INDEX IF NOT EXISTS idx_med_auth_cids_code ON public.medication_authorized_cids(sigtap_code);
CREATE INDEX IF NOT EXISTS idx_med_auth_cids_cid ON public.medication_authorized_cids(cid_code);

-- 3.2 Outros Medicamentos Específicos do CimBahia (Não Padronizados, Judiciais)
CREATE TABLE IF NOT EXISTS public.cb_other_medications (
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

-- 3.3 Tipos de Parecer Técnico Parametrizados
CREATE TABLE IF NOT EXISTS public.cb_tipos_parecer (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    regulatory_effect TEXT NOT NULL CHECK (regulatory_effect IN ('deferido', 'indeferido', 'exigencia', 'deferido_parcial')),
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 4. PACIENTES / REQUERENTES DO CIMBAHIA
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.cb_patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID REFERENCES public.cb_units(id) ON DELETE SET NULL,
    cpf TEXT,
    cpf_not_provided BOOLEAN NOT NULL DEFAULT false,
    cns TEXT,
    full_name TEXT NOT NULL,
    birth_date DATE,
    gender TEXT,
    phone TEXT,
    bairro TEXT,
    cep TEXT,
    municipality_id UUID REFERENCES public.cb_municipios(id) ON DELETE SET NULL,
    municipality_name TEXT,
    is_outside_bahia BOOLEAN NOT NULL DEFAULT false,
    outside_state_description TEXT,
    status TEXT NOT NULL CHECK (status IN ('em_acompanhamento', 'alta', 'inativo')) DEFAULT 'em_acompanhamento',
    status_externo TEXT,
    afsesab_status TEXT,
    afsesab_status_label TEXT,
    cadastrado_afsesab BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.cb_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cb_patients_cpf_unique ON public.cb_patients(cpf) WHERE cpf IS NOT NULL AND cpf != '' AND cpf_not_provided IS NOT TRUE;
CREATE INDEX IF NOT EXISTS idx_cb_patients_cpf ON public.cb_patients(cpf);
CREATE INDEX IF NOT EXISTS idx_cb_patients_cns ON public.cb_patients(cns);
CREATE INDEX IF NOT EXISTS idx_cb_patients_name ON public.cb_patients(full_name);

-- ==============================================================================
-- 5. PROCESSOS SEI, WORKFLOW E PARECERES TÉCNICOS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.cb_processos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_sei TEXT NOT NULL UNIQUE,
    data_abertura DATE NOT NULL DEFAULT CURRENT_DATE,
    assunto TEXT NOT NULL,
    paciente_id UUID NOT NULL REFERENCES public.cb_patients(id) ON DELETE CASCADE,
    origem_id UUID REFERENCES public.cb_origens(id) ON DELETE SET NULL,
    origem_nome TEXT,
    municipio_id UUID REFERENCES public.cb_municipios(id) ON DELETE SET NULL,
    municipio_nome TEXT,
    unidade_id UUID REFERENCES public.cb_units(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN (
        'triagem',
        'observacao',
        'em_observacao',
        'aguardando_parecer',
        'em_analise',
        'concluido',
        'aguardando_triagem',
        'em_triagem',
        'em_analise_farmaceutica',
        'em_exigencia',
        'concluido_deferido',
        'concluido_indeferido',
        'concluido_parcial'
    )) DEFAULT 'triagem',
    priority TEXT NOT NULL CHECK (priority IN ('normal', 'urgente', 'judicial')) DEFAULT 'normal',
    
    -- Contatos do Processo SEI
    email TEXT,
    telefone TEXT,
    contato_email TEXT,
    contato_telefone TEXT,
    
    -- Triagem Documental
    triagem_by_id UUID REFERENCES public.cb_profiles(id) ON DELETE SET NULL,
    triagem_by_name TEXT,
    triagem_completed_at TIMESTAMPTZ,
    triagem_notes TEXT,
    triagem_documents_ok BOOLEAN NOT NULL DEFAULT false,

    -- Atribuição Farmacêutica
    assigned_pharmacist_id UUID REFERENCES public.cb_profiles(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ,

    -- SLAs & Prazos
    sla_limit_date DATE NOT NULL,
    days_in_current_status INTEGER NOT NULL DEFAULT 1,
    is_sla_delayed BOOLEAN NOT NULL DEFAULT false,
    observations TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cb_processos_numero_sei ON public.cb_processos(numero_sei);
CREATE INDEX IF NOT EXISTS idx_cb_processos_status ON public.cb_processos(status);
CREATE INDEX IF NOT EXISTS idx_cb_processos_municipio ON public.cb_processos(municipio_id);
CREATE INDEX IF NOT EXISTS idx_cb_processos_paciente ON public.cb_processos(paciente_id);

-- 5.1 Itens Solicitados no Processo (Medicamentos CEAF, Outros ou Fármacos Específicos)
CREATE TABLE IF NOT EXISTS public.cb_processo_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    processo_id UUID NOT NULL REFERENCES public.cb_processos(id) ON DELETE CASCADE,
    medication_type TEXT NOT NULL CHECK (medication_type IN ('ceaf', 'outro', 'farmaco')) DEFAULT 'ceaf',
    medication_id TEXT,
    medication_name TEXT NOT NULL,
    farmaco_substancia TEXT,
    cid_id UUID REFERENCES public.cb_cids(id) ON DELETE SET NULL,
    cid_code TEXT NOT NULL,
    cid_description TEXT,
    cid_nao_informado BOOLEAN NOT NULL DEFAULT false,
    posology TEXT,
    monthly_quantity INTEGER DEFAULT 1,
    status TEXT CHECK (status IN ('deferido', 'indeferido', 'em_exigencia', 'deferido_parcial', 'pendente')) DEFAULT 'pendente',
    justification TEXT,
    evaluated_at TIMESTAMPTZ,
    evaluated_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cb_processo_items_processo ON public.cb_processo_items(processo_id);

-- 5.2 Pareceres Emitidos e Versionamento de Retificações
CREATE TABLE IF NOT EXISTS public.cb_pareceres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    processo_id UUID NOT NULL REFERENCES public.cb_processos(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cb_pareceres_processo ON public.cb_pareceres(processo_id);

CREATE TABLE IF NOT EXISTS public.cb_parecer_versoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parecer_id UUID NOT NULL REFERENCES public.cb_pareceres(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1,
    pharmacist_id UUID REFERENCES public.cb_profiles(id) ON DELETE SET NULL,
    pharmacist_name TEXT NOT NULL,
    crf TEXT NOT NULL,
    tipo_parecer_id UUID REFERENCES public.cb_tipos_parecer(id) ON DELETE SET NULL,
    tipo_parecer_title TEXT NOT NULL,
    regulatory_effect TEXT NOT NULL,
    technical_justification TEXT NOT NULL,
    clinical_foundation TEXT NOT NULL,
    recommendations TEXT,
    rectification_reason TEXT,
    signature_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_cb_parecer_version UNIQUE (parecer_id, version_number)
);
CREATE INDEX IF NOT EXISTS idx_cb_parecer_versoes_parecer ON public.cb_parecer_versoes(parecer_id);

-- 5.3 Trilha de Auditoria & Tramitação do Processo
CREATE TABLE IF NOT EXISTS public.cb_processo_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    processo_id UUID NOT NULL REFERENCES public.cb_processos(id) ON DELETE CASCADE,
    from_status TEXT,
    to_status TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    notes TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cb_processo_historico_processo ON public.cb_processo_historico(processo_id);

-- ==============================================================================
-- 6. TRIGGERS DE ATUALIZAÇÃO AUTOMÁTICA (cb_*)
-- ==============================================================================

DROP TRIGGER IF EXISTS trigger_cb_origens_updated_at ON public.cb_origens;
CREATE TRIGGER trigger_cb_origens_updated_at BEFORE UPDATE ON public.cb_origens FOR EACH ROW EXECUTE FUNCTION public.cb_handle_updated_at();

DROP TRIGGER IF EXISTS trigger_cb_units_updated_at ON public.cb_units;
CREATE TRIGGER trigger_cb_units_updated_at BEFORE UPDATE ON public.cb_units FOR EACH ROW EXECUTE FUNCTION public.cb_handle_updated_at();

DROP TRIGGER IF EXISTS trigger_cb_profiles_updated_at ON public.cb_profiles;
CREATE TRIGGER trigger_cb_profiles_updated_at BEFORE UPDATE ON public.cb_profiles FOR EACH ROW EXECUTE FUNCTION public.cb_handle_updated_at();

DROP TRIGGER IF EXISTS trigger_cb_other_medications_updated_at ON public.cb_other_medications;
CREATE TRIGGER trigger_cb_other_medications_updated_at BEFORE UPDATE ON public.cb_other_medications FOR EACH ROW EXECUTE FUNCTION public.cb_handle_updated_at();

DROP TRIGGER IF EXISTS trigger_cb_patients_updated_at ON public.cb_patients;
CREATE TRIGGER trigger_cb_patients_updated_at BEFORE UPDATE ON public.cb_patients FOR EACH ROW EXECUTE FUNCTION public.cb_handle_updated_at();

DROP TRIGGER IF EXISTS trigger_cb_processos_updated_at ON public.cb_processos;
CREATE TRIGGER trigger_cb_processos_updated_at BEFORE UPDATE ON public.cb_processos FOR EACH ROW EXECUTE FUNCTION public.cb_handle_updated_at();

-- ==============================================================================
-- 7. POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- ==============================================================================

ALTER TABLE public.cb_origens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_nucleos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_dires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_bases_regionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_municipios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_unit_served_municipalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_unit_responsible_pharmacists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_cids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_other_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_tipos_parecer ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_processo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_pareceres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_parecer_versoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cb_processo_historico ENABLE ROW LEVEL SECURITY;

-- Identifica a conta autenticada por UUID (novas contas) ou e-mail (perfis legados).
CREATE OR REPLACE FUNCTION public.cb_current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
    SELECT p.role
    FROM public.cb_profiles p
    WHERE p.active IS TRUE
      AND (
        p.id = auth.uid()
        OR lower(p.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
    ORDER BY (p.id = auth.uid()) DESC
    LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.cb_current_user_unit_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
    SELECT p.unit_id
    FROM public.cb_profiles p
    WHERE p.active IS TRUE
      AND (
        p.id = auth.uid()
        OR lower(p.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
    ORDER BY (p.id = auth.uid()) DESC
    LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.cb_is_active_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
    SELECT public.cb_current_user_role() IS NOT NULL
$$;

CREATE OR REPLACE FUNCTION public.cb_can_manage()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
    SELECT public.cb_current_user_role() IN ('admin', 'gestor')
$$;

CREATE OR REPLACE FUNCTION public.cb_can_access_unit(target_unit_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
    SELECT public.cb_is_active_user()
       AND (
         public.cb_current_user_role() IN ('admin', 'gestor')
         OR (
           target_unit_id IS NOT NULL
           AND target_unit_id = public.cb_current_user_unit_id()
         )
       )
$$;

REVOKE ALL ON FUNCTION public.cb_current_user_role() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cb_current_user_unit_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cb_is_active_user() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cb_can_manage() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cb_can_access_unit(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cb_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cb_current_user_unit_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cb_is_active_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cb_can_manage() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cb_can_access_unit(UUID) TO authenticated;

-- Leitura operacional só para contas ativas; perfis ficam visíveis ao próprio
-- usuário e à gestão.
DROP POLICY IF EXISTS "Permitir leitura cb_origens" ON public.cb_origens;
CREATE POLICY "Permitir leitura cb_origens" ON public.cb_origens FOR SELECT TO authenticated USING (public.cb_is_active_user());
DROP POLICY IF EXISTS "Permitir leitura cb_nucleos" ON public.cb_nucleos;
CREATE POLICY "Permitir leitura cb_nucleos" ON public.cb_nucleos FOR SELECT TO authenticated USING (public.cb_is_active_user());
DROP POLICY IF EXISTS "Permitir leitura cb_dires" ON public.cb_dires;
CREATE POLICY "Permitir leitura cb_dires" ON public.cb_dires FOR SELECT TO authenticated USING (public.cb_is_active_user());
DROP POLICY IF EXISTS "Permitir leitura cb_bases" ON public.cb_bases_regionais;
CREATE POLICY "Permitir leitura cb_bases" ON public.cb_bases_regionais FOR SELECT TO authenticated USING (public.cb_is_active_user());
DROP POLICY IF EXISTS "Permitir leitura cb_municipios" ON public.cb_municipios;
CREATE POLICY "Permitir leitura cb_municipios" ON public.cb_municipios FOR SELECT TO authenticated USING (public.cb_is_active_user());
DROP POLICY IF EXISTS "Permitir leitura cb_units" ON public.cb_units;
CREATE POLICY "Permitir leitura cb_units" ON public.cb_units FOR SELECT TO authenticated USING (public.cb_is_active_user());
DROP POLICY IF EXISTS "Permitir leitura cb_unit_served_municipalities" ON public.cb_unit_served_municipalities;
CREATE POLICY "Permitir leitura cb_unit_served_municipalities" ON public.cb_unit_served_municipalities FOR SELECT TO authenticated USING (public.cb_is_active_user());
DROP POLICY IF EXISTS "Permitir leitura cb_unit_responsible_pharmacists" ON public.cb_unit_responsible_pharmacists;
CREATE POLICY "Permitir leitura cb_unit_responsible_pharmacists" ON public.cb_unit_responsible_pharmacists FOR SELECT TO authenticated USING (public.cb_is_active_user());
DROP POLICY IF EXISTS "Permitir leitura cb_profiles" ON public.cb_profiles;
CREATE POLICY "Permitir leitura cb_profiles" ON public.cb_profiles FOR SELECT TO authenticated USING (
    id = auth.uid()
    OR lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    OR public.cb_can_manage()
);
DROP POLICY IF EXISTS "Permitir leitura cb_cids" ON public.cb_cids;
CREATE POLICY "Permitir leitura cb_cids" ON public.cb_cids FOR SELECT TO authenticated USING (public.cb_is_active_user());
DROP POLICY IF EXISTS "Permitir leitura cb_other_medications" ON public.cb_other_medications;
CREATE POLICY "Permitir leitura cb_other_medications" ON public.cb_other_medications FOR SELECT TO authenticated USING (public.cb_is_active_user());
DROP POLICY IF EXISTS "Permitir leitura cb_tipos_parecer" ON public.cb_tipos_parecer;
CREATE POLICY "Permitir leitura cb_tipos_parecer" ON public.cb_tipos_parecer FOR SELECT TO authenticated USING (public.cb_is_active_user());
DROP POLICY IF EXISTS "Permitir leitura cb_patients" ON public.cb_patients;
CREATE POLICY "Permitir leitura cb_patients" ON public.cb_patients FOR SELECT TO authenticated USING (public.cb_is_active_user());
DROP POLICY IF EXISTS "Permitir leitura cb_processos" ON public.cb_processos;
CREATE POLICY "Permitir leitura cb_processos" ON public.cb_processos FOR SELECT TO authenticated USING (public.cb_is_active_user());
DROP POLICY IF EXISTS "Permitir leitura cb_processo_items" ON public.cb_processo_items;
CREATE POLICY "Permitir leitura cb_processo_items" ON public.cb_processo_items FOR SELECT TO authenticated USING (public.cb_is_active_user());
DROP POLICY IF EXISTS "Permitir leitura cb_pareceres" ON public.cb_pareceres;
CREATE POLICY "Permitir leitura cb_pareceres" ON public.cb_pareceres FOR SELECT TO authenticated USING (public.cb_is_active_user());
DROP POLICY IF EXISTS "Permitir leitura cb_parecer_versoes" ON public.cb_parecer_versoes;
CREATE POLICY "Permitir leitura cb_parecer_versoes" ON public.cb_parecer_versoes FOR SELECT TO authenticated USING (public.cb_is_active_user());
DROP POLICY IF EXISTS "Permitir leitura cb_processo_historico" ON public.cb_processo_historico;
CREATE POLICY "Permitir leitura cb_processo_historico" ON public.cb_processo_historico FOR SELECT TO authenticated USING (public.cb_is_active_user());

-- Escrita de dados administrativos limitada à gestão.
DROP POLICY IF EXISTS "Permitir escrita cb_profiles" ON public.cb_profiles;
CREATE POLICY "Permitir escrita cb_profiles" ON public.cb_profiles FOR ALL TO authenticated USING (public.cb_can_manage()) WITH CHECK (public.cb_can_manage());
DROP POLICY IF EXISTS "Permitir escrita cb_cids" ON public.cb_cids;
CREATE POLICY "Permitir escrita cb_cids" ON public.cb_cids FOR ALL TO authenticated
    USING (public.cb_current_user_role() = 'admin')
    WITH CHECK (public.cb_current_user_role() = 'admin');
DROP POLICY IF EXISTS "Permitir escrita cb_other_medications" ON public.cb_other_medications;
CREATE POLICY "Permitir escrita cb_other_medications" ON public.cb_other_medications FOR ALL TO authenticated USING (public.cb_can_manage()) WITH CHECK (public.cb_can_manage());
DROP POLICY IF EXISTS "Permitir escrita cb_tipos_parecer" ON public.cb_tipos_parecer;
CREATE POLICY "Permitir escrita cb_tipos_parecer" ON public.cb_tipos_parecer FOR ALL TO authenticated USING (public.cb_can_manage()) WITH CHECK (public.cb_can_manage());
DROP POLICY IF EXISTS "Permitir escrita cb_units" ON public.cb_units;
CREATE POLICY "Permitir escrita cb_units" ON public.cb_units FOR ALL TO authenticated USING (public.cb_can_manage()) WITH CHECK (public.cb_can_manage());
DROP POLICY IF EXISTS "Permitir escrita cb_origens" ON public.cb_origens;
CREATE POLICY "Permitir escrita cb_origens" ON public.cb_origens FOR ALL TO authenticated USING (public.cb_can_manage()) WITH CHECK (public.cb_can_manage());

-- Pacientes e processos só podem ser alterados na unidade do usuário; gestão
-- mantém acesso transversal para administração do sistema.
DROP POLICY IF EXISTS "Permitir escrita cb_patients" ON public.cb_patients;
CREATE POLICY "Permitir escrita cb_patients" ON public.cb_patients FOR ALL TO authenticated
    USING (public.cb_can_access_unit(unit_id))
    WITH CHECK (public.cb_can_access_unit(unit_id));
DROP POLICY IF EXISTS "Permitir escrita cb_processos" ON public.cb_processos;
CREATE POLICY "Permitir escrita cb_processos" ON public.cb_processos FOR ALL TO authenticated
    USING (public.cb_can_access_unit(unidade_id))
    WITH CHECK (public.cb_can_access_unit(unidade_id));
DROP POLICY IF EXISTS "Permitir escrita cb_processo_items" ON public.cb_processo_items;
CREATE POLICY "Permitir escrita cb_processo_items" ON public.cb_processo_items FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.cb_processos p
        WHERE p.id = processo_id AND public.cb_can_access_unit(p.unidade_id)
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.cb_processos p
        WHERE p.id = processo_id AND public.cb_can_access_unit(p.unidade_id)
    ));
DROP POLICY IF EXISTS "Permitir escrita cb_pareceres" ON public.cb_pareceres;
CREATE POLICY "Permitir escrita cb_pareceres" ON public.cb_pareceres FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.cb_processos p
        WHERE p.id = processo_id AND public.cb_can_access_unit(p.unidade_id)
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.cb_processos p
        WHERE p.id = processo_id AND public.cb_can_access_unit(p.unidade_id)
    ));
DROP POLICY IF EXISTS "Permitir escrita cb_parecer_versoes" ON public.cb_parecer_versoes;
CREATE POLICY "Permitir escrita cb_parecer_versoes" ON public.cb_parecer_versoes FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1
        FROM public.cb_pareceres pa
        JOIN public.cb_processos p ON p.id = pa.processo_id
        WHERE pa.id = parecer_id AND public.cb_can_access_unit(p.unidade_id)
    ))
    WITH CHECK (EXISTS (
        SELECT 1
        FROM public.cb_pareceres pa
        JOIN public.cb_processos p ON p.id = pa.processo_id
        WHERE pa.id = parecer_id AND public.cb_can_access_unit(p.unidade_id)
    ));
DROP POLICY IF EXISTS "Permitir escrita cb_processo_historico" ON public.cb_processo_historico;
CREATE POLICY "Permitir escrita cb_processo_historico" ON public.cb_processo_historico FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.cb_processos p
        WHERE p.id = processo_id AND public.cb_can_access_unit(p.unidade_id)
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.cb_processos p
        WHERE p.id = processo_id AND public.cb_can_access_unit(p.unidade_id)
    ));

-- ==============================================================================
-- 8. CARGA DE DADOS INICIAIS (SEED INSTITUCIONAL SESAB / CIMBAHIA)
-- ==============================================================================

-- 8.1 Origens da Demanda
INSERT INTO public.cb_origens (id, name, sigla, description, active) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Secretaria Municipal de Saúde (SMS)', 'SMS', 'Demandas originadas pelas secretarias municipais de saúde da Bahia', true),
    ('00000000-0000-0000-0000-000000000002', 'Defensoria Pública do Estado da Bahia', 'DPE-BA', 'Atendimento pré-processual ou pedidos de conciliação de saúde', true),
    ('00000000-0000-0000-0000-000000000003', 'Tribunal de Justiça da Bahia / Mandado Judicial', 'TJ-BA', 'Determinações judiciais de fornecimento de medicamentos', true),
    ('00000000-0000-0000-0000-000000000004', 'Ouvidoria Geral do SUS / Bahia', 'OUV-SUS', 'Reclamações, solicitações e reavaliações protocoladas via Ouvidoria', true),
    ('00000000-0000-0000-0000-000000000005', 'Consórcio Interfederativo de Saúde (CIM)', 'CIM', 'Políticas e pareceres no âmbito dos consórcios interfederativos', true),
    ('00000000-0000-0000-0000-000000000006', 'Ministério Público do Estado da Bahia', 'MP-BA', 'Procedimentos preparatórios e termos de ajustamento de conduta', true)
ON CONFLICT (id) DO NOTHING;

-- 8.2 Núcleos Regionais de Saúde (NRS)
INSERT INTO public.cb_nucleos (id, code, name, macroregion, active) VALUES
    ('10000000-0000-0000-0000-000000000001', 'NRS-LESTE', 'NRS Leste / Salvador', 'Macrorregional Leste', true),
    ('10000000-0000-0000-0000-000000000002', 'NRS-CENTRO-LESTE', 'NRS Centro-Leste (Feira de Santana)', 'Macrorregional Centro-Leste', true),
    ('10000000-0000-0000-0000-000000000003', 'NRS-NORTE', 'NRS Norte (Juazeiro / Paulo Afonso)', 'Macrorregional Norte', true),
    ('10000000-0000-0000-0000-000000000004', 'NRS-SUDOESTE', 'NRS Sudoeste (Vitória da Conquista)', 'Macrorregional Sudoeste', true),
    ('10000000-0000-0000-0000-000000000005', 'NRS-SUL', 'NRS Sul (Ilhéus / Itabuna)', 'Macrorregional Sul', true),
    ('10000000-0000-0000-0000-000000000006', 'NRS-OESTE', 'NRS Oeste (Barreiras)', 'Macrorregional Oeste', true)
ON CONFLICT (code) DO NOTHING;

-- 8.3 DIRES
INSERT INTO public.cb_dires (id, code, name, region, active) VALUES
    ('20000000-0000-0000-0000-000000000001', '1ª DIRES', '1ª Diretoria Regional de Saúde - Salvador', 'Leste', true),
    ('20000000-0000-0000-0000-000000000002', '2ª DIRES', '2ª Diretoria Regional de Saúde - Feira de Santana', 'Centro-Leste', true),
    ('20000000-0000-0000-0000-000000000003', '3ª DIRES', '3ª Diretoria Regional de Saúde - Alagoinhas', 'Nordeste', true),
    ('20000000-0000-0000-0000-000000000004', '4ª DIRES', '4ª Diretoria Regional de Saúde - Santo Antônio de Jesus', 'Recôncavo', true),
    ('20000000-0000-0000-0000-000000000014', '14ª DIRES', '14ª Diretoria Regional de Saúde - Juazeiro', 'Norte', true),
    ('20000000-0000-0000-0000-000000000020', '20ª DIRES', '20ª Diretoria Regional de Saúde - Vitória da Conquista', 'Sudoeste', true)
ON CONFLICT (code) DO NOTHING;

-- 8.4 Tipos de Parecer Técnico
INSERT INTO public.cb_tipos_parecer (id, code, title, regulatory_effect, description, active) VALUES
    ('30000000-0000-0000-0000-000000000001', 'TP-DEF-INT', 'Deferido Integralmente', 'deferido', 'Atende a todos os critérios de inclusão clínicos e documentais do PCDT', true),
    ('30000000-0000-0000-0000-000000000002', 'TP-IND-CRIT', 'Indeferido por Não Preenchimento de Critérios', 'indeferido', 'Não atende aos critérios técnicos de inclusão ou apresenta contraindicação clínica', true),
    ('30000000-0000-0000-0000-000000000003', 'TP-EXIG-DOC', 'Em Exigência de Documentos / Laudos', 'exigencia', 'Necessária complementação de exames obrigatórios, laudos ou reavaliação médica', true),
    ('30000000-0000-0000-0000-000000000004', 'TP-DEF-PARC', 'Deferido Parcialmente', 'deferido_parcial', 'Autorizada parte da terapêutica ou com adequação de posologia recomendada', true),
    ('30000000-0000-0000-0000-000000000005', 'TP-IND-PADR', 'Indeferido - Medicamento Não Padronizado', 'indeferido', 'Existe alternativa terapêutica padronizada no SUS não esgotada previamente', true)
ON CONFLICT (code) DO NOTHING;

-- 8.5 Unidades Principais da Bahia
INSERT INTO public.cb_units (id, name, macroregion, cnes, municipality, email, phone, address, active) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Base Regional de Saúde Paulo Afonso', 'Macrorregional Norte', '2801452', 'Paulo Afonso', 'brs.pauloafonso@saude.ba.gov.br', '(75) 3281-4450', 'Rua das Laranjeiras, 140 - Centro, Paulo Afonso - BA', true),
    ('22222222-2222-2222-2222-222222222222', 'Base Regional de Saúde Juazeiro', 'Macrorregional Norte', '2801460', 'Juazeiro', 'brs.juazeiro@saude.ba.gov.br', '(74) 3611-8890', 'Av. Adolfo Viana, 520 - São Geraldo, Juazeiro - BA', true),
    ('33333333-3333-3333-3333-333333333333', 'Base Regional de Saúde Feira de Santana', 'Macrorregional Centro-Leste', '2801479', 'Feira de Santana', 'brs.feira@saude.ba.gov.br', '(75) 3602-5500', 'Av. Maria Quitéria, 1200 - Kalilândia, Feira de Santana - BA', true),
    ('44444444-4444-4444-4444-444444444444', 'Base Regional de Saúde Vitória da Conquista', 'Macrorregional Sudoeste', '2801487', 'Vitória da Conquista', 'brs.conquista@saude.ba.gov.br', '(77) 3424-8100', 'Rua Crescêncio Silveira, 80 - Centro, Vitória da Conquista - BA', true),
    ('55555555-5555-5555-5555-555555555555', 'Central Integrada CimBahia - SESAB Sede', 'Macrorregional Leste', '2801495', 'Salvador', 'cimbahia@saude.ba.gov.br', '(71) 3115-4200', '4ª Avenida, 400 - Centro Administrativo da Bahia (CAB), Salvador - BA', true)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 9. FUNÇÕES DE IDADE DO PACIENTE NO MOMENTO DA AVALIAÇÃO & FAIXA ETÁRIA
-- ==============================================================================

-- 9.1 Função para calcular idade em dias
CREATE OR REPLACE FUNCTION public.cb_calcular_idade_dias(
    p_birth_date DATE,
    p_eval_date DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    IF p_birth_date IS NULL THEN
        RETURN NULL;
    END IF;
    IF p_eval_date IS NULL THEN
        p_eval_date := CURRENT_DATE;
    END IF;
    RETURN (p_eval_date - p_birth_date);
END;
$$;

-- 9.2 Função para calcular idade em anos completos
CREATE OR REPLACE FUNCTION public.cb_calcular_idade_anos(
    p_birth_date DATE,
    p_eval_date DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    IF p_birth_date IS NULL THEN
        RETURN NULL;
    END IF;
    IF p_eval_date IS NULL THEN
        p_eval_date := CURRENT_DATE;
    END IF;
    RETURN DATE_PART('year', AGE(p_eval_date, p_birth_date))::INTEGER;
END;
$$;

-- 9.3 Função para calcular idade formatada amigável (dias, meses ou anos)
CREATE OR REPLACE FUNCTION public.cb_calcular_idade_formatada(
    p_birth_date DATE,
    p_eval_date DATE DEFAULT CURRENT_DATE
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_dias INTEGER;
    v_anos INTEGER;
    v_meses INTEGER;
BEGIN
    IF p_birth_date IS NULL THEN
        RETURN 'Não informada';
    END IF;
    IF p_eval_date IS NULL THEN
        p_eval_date := CURRENT_DATE;
    END IF;

    v_dias := p_eval_date - p_birth_date;
    IF v_dias < 0 THEN
        RETURN 'Data inválida';
    END IF;

    -- Recém-nascido: 0 a 28 dias
    IF v_dias <= 28 THEN
        IF v_dias = 1 THEN
            RETURN '1 dia';
        ELSE
            RETURN v_dias || ' dias';
        END IF;
    END IF;

    v_anos := DATE_PART('year', AGE(p_eval_date, p_birth_date))::INTEGER;
    v_meses := (DATE_PART('year', AGE(p_eval_date, p_birth_date))::INTEGER * 12) + DATE_PART('month', AGE(p_eval_date, p_birth_date))::INTEGER;

    -- Menor de 1 ano
    IF v_anos < 1 THEN
        IF v_meses <= 1 THEN
            RETURN '1 mês';
        ELSE
            RETURN v_meses || ' meses';
        END IF;
    END IF;

    -- 1 ano ou mais
    IF v_anos = 1 THEN
        RETURN '1 ano';
    ELSE
        RETURN v_anos || ' anos';
    END IF;
END;
$$;

-- 9.4 Função para classificar faixa etária (código interno):
-- Recém-nascido (0 a 28 dias), Criança (29 dias a 17 anos), Adulto (18 a 59 anos), Idoso (60+ anos)
CREATE OR REPLACE FUNCTION public.cb_classificar_faixa_etaria(
    p_birth_date DATE,
    p_eval_date DATE DEFAULT CURRENT_DATE
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_dias INTEGER;
    v_anos INTEGER;
BEGIN
    IF p_birth_date IS NULL THEN
        RETURN NULL;
    END IF;
    IF p_eval_date IS NULL THEN
        p_eval_date := CURRENT_DATE;
    END IF;

    v_dias := p_eval_date - p_birth_date;
    IF v_dias < 0 THEN
        RETURN NULL;
    END IF;

    -- Recém-nascido: 0 a 28 dias de vida (Neonato)
    IF v_dias <= 28 THEN
        RETURN 'recem_nascido';
    END IF;

    v_anos := DATE_PART('year', AGE(p_eval_date, p_birth_date))::INTEGER;

    -- Criança: 29 dias a 17 anos (< 18 anos)
    IF v_anos < 18 THEN
        RETURN 'crianca';
    END IF;

    -- Adulto: 18 a 59 anos
    IF v_anos < 60 THEN
        RETURN 'adulto';
    END IF;

    -- Idoso: 60 anos ou mais (Estatuto da Pessoa Idosa)
    RETURN 'idoso';
END;
$$;

-- 9.5 Função para rótulo legível da faixa etária
CREATE OR REPLACE FUNCTION public.cb_rotulo_faixa_etaria(
    p_birth_date DATE,
    p_eval_date DATE DEFAULT CURRENT_DATE
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_faixa TEXT;
BEGIN
    v_faixa := public.cb_classificar_faixa_etaria(p_birth_date, p_eval_date);
    IF v_faixa = 'recem_nascido' THEN
        RETURN 'Recém-nascido';
    ELSIF v_faixa = 'crianca' THEN
        RETURN 'Criança';
    ELSIF v_faixa = 'adulto' THEN
        RETURN 'Adulto';
    ELSIF v_faixa = 'idoso' THEN
        RETURN 'Idoso';
    ELSE
        RETURN 'Não informada';
    END IF;
END;
$$;

-- 9.6 Colunas de apoio em cb_processos
ALTER TABLE public.cb_processos ADD COLUMN IF NOT EXISTS paciente_idade_na_avaliacao INTEGER;
ALTER TABLE public.cb_processos ADD COLUMN IF NOT EXISTS paciente_idade_formatada TEXT;
ALTER TABLE public.cb_processos ADD COLUMN IF NOT EXISTS paciente_faixa_etaria TEXT;
ALTER TABLE public.cb_processos ADD COLUMN IF NOT EXISTS paciente_faixa_etaria_label TEXT;

-- 9.7 View de Processos com Idade na Avaliação e Faixa Etária
CREATE OR REPLACE VIEW public.cb_vw_processos_com_idade AS
SELECT
    proc.*,
    pat.full_name AS paciente_nome,
    pat.cpf AS paciente_cpf,
    pat.cns AS paciente_cns,
    pat.birth_date AS paciente_data_nascimento,
    pat.gender AS paciente_sexo,
    public.cb_calcular_idade_anos(pat.birth_date, COALESCE(proc.data_abertura, CURRENT_DATE)) AS idade_na_avaliacao_anos,
    public.cb_calcular_idade_dias(pat.birth_date, COALESCE(proc.data_abertura, CURRENT_DATE)) AS idade_na_avaliacao_dias,
    public.cb_calcular_idade_formatada(pat.birth_date, COALESCE(proc.data_abertura, CURRENT_DATE)) AS idade_na_avaliacao_formatada,
    public.cb_classificar_faixa_etaria(pat.birth_date, COALESCE(proc.data_abertura, CURRENT_DATE)) AS faixa_etaria_avaliacao,
    public.cb_rotulo_faixa_etaria(pat.birth_date, COALESCE(proc.data_abertura, CURRENT_DATE)) AS faixa_etaria_rotulo
FROM public.cb_processos proc
LEFT JOIN public.cb_patients pat ON proc.paciente_id = pat.id;
