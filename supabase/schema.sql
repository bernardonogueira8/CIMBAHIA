-- ==============================================================================
-- PHARMA-CARE: SISTEMA DE MONITORAMENTO E GESTÃO DO CUIDADO FARMACÊUTICO
-- CEAF / Macrorregionais de Saúde
-- Banco de Dados: Supabase (PostgreSQL 15+)
-- ==============================================================================

-- 0. Extensões essenciais
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. ESTRUTURA DE TABELAS
-- ==============================================================================

-- 1.1 Unidades de Saúde / Núcleos / Bases Regionais de Saúde (BRS)
CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    macroregion TEXT NOT NULL,
    cnes TEXT,
    municipality TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.2 Perfis de Usuário (Vínculo 1:1 com auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    crf TEXT,
    unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'pharmacist', 'viewer')) DEFAULT 'pharmacist',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.3 Catálogo de Diagnósticos (CID-10) - Catálogo Global Compartilhado
CREATE TABLE IF NOT EXISTS public.cids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.4 Catálogo de Medicamentos (CEAF / RENAME) - Catálogo Global Compartilhado
CREATE TABLE IF NOT EXISTS public.medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    pharmaceutical_form TEXT,
    component TEXT NOT NULL DEFAULT 'CEAF',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.5 Cadastro de Pacientes por Unidade
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE RESTRICT,
    cpf TEXT NOT NULL,
    cns TEXT,
    full_name TEXT NOT NULL,
    birth_date DATE,
    phone TEXT,
    status TEXT NOT NULL CHECK (status IN ('em_acompanhamento', 'alta', 'inativo')) DEFAULT 'em_acompanhamento',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_patients_unit_cpf UNIQUE (unit_id, cpf)
);

-- 1.6 Registro de Atendimento / Cuidado Farmacêutico (Consultas)
CREATE TABLE IF NOT EXISTS public.consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    pharmacist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    consultation_date DATE NOT NULL,
    primary_cid_id UUID NOT NULL REFERENCES public.cids(id) ON DELETE RESTRICT,
    is_pharmaceutical_guidance_only BOOLEAN NOT NULL DEFAULT false,
    is_new_patient BOOLEAN NOT NULL DEFAULT false,
    interventions_count INTEGER NOT NULL DEFAULT 0 CHECK (interventions_count >= 0),
    pharmaceutical_discharge BOOLEAN NOT NULL DEFAULT false,
    clinical_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.7 Medicamentos avaliados no Atendimento (N:N)
CREATE TABLE IF NOT EXISTS public.consultation_medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
    medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_consultation_medication UNIQUE (consultation_id, medication_id)
);

-- 1.8 Problemas Relacionados à Farmacoterapia (PRFs) no Atendimento
CREATE TABLE IF NOT EXISTS public.consultation_prfs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
    medication_id UUID REFERENCES public.medications(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (category IN ('Adesão', 'Efetividade', 'Indicação', 'Segurança')),
    status TEXT NOT NULL CHECK (status IN ('Resolvido', 'Em resolução', 'Não resolvido', 'Aguardando retorno')),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.9 Dados Complementares Mensais da Unidade (Fechamento Mensal para Indicadores)
CREATE TABLE IF NOT EXISTS public.monthly_complementary_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE RESTRICT,
    year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    total_patients_in_followup INTEGER NOT NULL DEFAULT 0 CHECK (total_patients_in_followup >= 0),
    collective_health_activities INTEGER NOT NULL DEFAULT 0 CHECK (collective_health_activities >= 0),
    dispensing_administrative_patients INTEGER NOT NULL DEFAULT 0 CHECK (dispensing_administrative_patients >= 0),
    first_dispensing_by_pharmacist INTEGER NOT NULL DEFAULT 0 CHECK (first_dispensing_by_pharmacist >= 0),
    total_new_patients_month INTEGER NOT NULL DEFAULT 0 CHECK (total_new_patients_month >= 0),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_unit_year_month UNIQUE (unit_id, year, month)
);

-- ==============================================================================
-- 2. ÍNDICES DE PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_units_macroregion ON public.units(macroregion);
CREATE INDEX IF NOT EXISTS idx_profiles_unit ON public.profiles(unit_id);
CREATE INDEX IF NOT EXISTS idx_patients_unit ON public.patients(unit_id);
CREATE INDEX IF NOT EXISTS idx_patients_cpf ON public.patients(cpf);
CREATE INDEX IF NOT EXISTS idx_patients_status ON public.patients(status);
CREATE INDEX IF NOT EXISTS idx_consultations_unit_date ON public.consultations(unit_id, consultation_date);
CREATE INDEX IF NOT EXISTS idx_consultations_patient ON public.consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_pharmacist ON public.consultations(pharmacist_id);
CREATE INDEX IF NOT EXISTS idx_consultation_meds_consultation ON public.consultation_medications(consultation_id);
CREATE INDEX IF NOT EXISTS idx_consultation_prfs_consultation ON public.consultation_prfs(consultation_id);
CREATE INDEX IF NOT EXISTS idx_consultation_prfs_status ON public.consultation_prfs(status);
CREATE INDEX IF NOT EXISTS idx_monthly_data_unit_ym ON public.monthly_complementary_data(unit_id, year, month);

-- ==============================================================================
-- 3. FUNÇÕES AUXILIARES E TRIGGERS DE UPDATED_AT
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_units_updated_at ON public.units;
CREATE TRIGGER trigger_units_updated_at
    BEFORE UPDATE ON public.units
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_patients_updated_at ON public.patients;
CREATE TRIGGER trigger_patients_updated_at
    BEFORE UPDATE ON public.patients
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_consultations_updated_at ON public.consultations;
CREATE TRIGGER trigger_consultations_updated_at
    BEFORE UPDATE ON public.consultations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_monthly_data_updated_at ON public.monthly_complementary_data;
CREATE TRIGGER trigger_monthly_data_updated_at
    BEFORE UPDATE ON public.monthly_complementary_data
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Criação automática do registro em profiles ao cadastrar usuário no auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        'pharmacist'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 4. FUNÇÕES DE SEGURANÇA E CONTEXTO RLS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.current_user_unit_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT unit_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    );
$$;

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Habilita RLS em todas as tabelas
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_prfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_complementary_data ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 5.1 UNIDADES (units)
-- Regra: Leitura global autenticada; Escrita somente Admin Geral
-- ------------------------------------------------------------------------------
CREATE POLICY "units_select_policy" ON public.units
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "units_insert_policy" ON public.units
    FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "units_update_policy" ON public.units
    FOR UPDATE TO authenticated USING (public.is_admin());

CREATE POLICY "units_delete_policy" ON public.units
    FOR DELETE TO authenticated USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 5.2 PERFIS (profiles)
-- Regra: Leitura global autenticada; Edição pelo próprio usuário ou Admin
-- ------------------------------------------------------------------------------
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE TO authenticated USING (id = auth.uid() OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 5.3 CATÁLOGOS GLOBAIS: CIDs e MEDICAMENTOS
-- Regra: Leitura global; Qualquer usuário autenticado pode cadastrar novos itens;
-- Somente Admin pode atualizar/excluir/inativar
-- ------------------------------------------------------------------------------
CREATE POLICY "cids_select_policy" ON public.cids
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "cids_insert_policy" ON public.cids
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "cids_update_policy" ON public.cids
    FOR UPDATE TO authenticated USING (public.is_admin());

CREATE POLICY "cids_delete_policy" ON public.cids
    FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY "medications_select_policy" ON public.medications
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "medications_insert_policy" ON public.medications
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "medications_update_policy" ON public.medications
    FOR UPDATE TO authenticated USING (public.is_admin());

CREATE POLICY "medications_delete_policy" ON public.medications
    FOR DELETE TO authenticated USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 5.4 PACIENTES (patients)
-- Regra: Leitura global; Escrita (Insert/Update/Delete) apenas para a própria unidade ou Admin
-- ------------------------------------------------------------------------------
CREATE POLICY "patients_select_policy" ON public.patients
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "patients_insert_policy" ON public.patients
    FOR INSERT TO authenticated WITH CHECK (
        unit_id = public.current_user_unit_id() OR public.is_admin()
    );

CREATE POLICY "patients_update_policy" ON public.patients
    FOR UPDATE TO authenticated USING (
        unit_id = public.current_user_unit_id() OR public.is_admin()
    );

CREATE POLICY "patients_delete_policy" ON public.patients
    FOR DELETE TO authenticated USING (
        unit_id = public.current_user_unit_id() OR public.is_admin()
    );

-- ------------------------------------------------------------------------------
-- 5.5 CONSULTAS / ATENDIMENTOS (consultations)
-- Regra: Leitura global; Escrita apenas para a própria unidade ou Admin
-- ------------------------------------------------------------------------------
CREATE POLICY "consultations_select_policy" ON public.consultations
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "consultations_insert_policy" ON public.consultations
    FOR INSERT TO authenticated WITH CHECK (
        unit_id = public.current_user_unit_id() OR public.is_admin()
    );

CREATE POLICY "consultations_update_policy" ON public.consultations
    FOR UPDATE TO authenticated USING (
        unit_id = public.current_user_unit_id() OR public.is_admin()
    );

CREATE POLICY "consultations_delete_policy" ON public.consultations
    FOR DELETE TO authenticated USING (
        unit_id = public.current_user_unit_id() OR public.is_admin()
    );

-- ------------------------------------------------------------------------------
-- 5.6 MEDICAMENTOS DA CONSULTA (consultation_medications)
-- Regra: Leitura global; Escrita vinculada à unidade dona da consulta
-- ------------------------------------------------------------------------------
CREATE POLICY "consultation_medications_select_policy" ON public.consultation_medications
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "consultation_medications_insert_policy" ON public.consultation_medications
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.consultations c
            WHERE c.id = consultation_id
              AND (c.unit_id = public.current_user_unit_id() OR public.is_admin())
        )
    );

CREATE POLICY "consultation_medications_update_policy" ON public.consultation_medications
    FOR UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.consultations c
            WHERE c.id = consultation_id
              AND (c.unit_id = public.current_user_unit_id() OR public.is_admin())
        )
    );

CREATE POLICY "consultation_medications_delete_policy" ON public.consultation_medications
    FOR DELETE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.consultations c
            WHERE c.id = consultation_id
              AND (c.unit_id = public.current_user_unit_id() OR public.is_admin())
        )
    );

-- ------------------------------------------------------------------------------
-- 5.7 PRFs DA CONSULTA (consultation_prfs)
-- Regra: Leitura global; Escrita vinculada à unidade dona da consulta
-- ------------------------------------------------------------------------------
CREATE POLICY "consultation_prfs_select_policy" ON public.consultation_prfs
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "consultation_prfs_insert_policy" ON public.consultation_prfs
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.consultations c
            WHERE c.id = consultation_id
              AND (c.unit_id = public.current_user_unit_id() OR public.is_admin())
        )
    );

CREATE POLICY "consultation_prfs_update_policy" ON public.consultation_prfs
    FOR UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.consultations c
            WHERE c.id = consultation_id
              AND (c.unit_id = public.current_user_unit_id() OR public.is_admin())
        )
    );

CREATE POLICY "consultation_prfs_delete_policy" ON public.consultation_prfs
    FOR DELETE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.consultations c
            WHERE c.id = consultation_id
              AND (c.unit_id = public.current_user_unit_id() OR public.is_admin())
        )
    );

-- ------------------------------------------------------------------------------
-- 5.8 DADOS COMPLEMENTARES MENSAIS (monthly_complementary_data)
-- Regra: Leitura global; Escrita apenas para a própria unidade ou Admin
-- ------------------------------------------------------------------------------
CREATE POLICY "monthly_data_select_policy" ON public.monthly_complementary_data
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "monthly_data_insert_policy" ON public.monthly_complementary_data
    FOR INSERT TO authenticated WITH CHECK (
        unit_id = public.current_user_unit_id() OR public.is_admin()
    );

CREATE POLICY "monthly_data_update_policy" ON public.monthly_complementary_data
    FOR UPDATE TO authenticated USING (
        unit_id = public.current_user_unit_id() OR public.is_admin()
    );

CREATE POLICY "monthly_data_delete_policy" ON public.monthly_complementary_data
    FOR DELETE TO authenticated USING (
        unit_id = public.current_user_unit_id() OR public.is_admin()
    );

-- ==============================================================================
-- 6. FUNÇÃO SQL PARA OS 11 INDICADORES OFICIAIS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_pharmaceutical_indicators(
    p_unit_id UUID DEFAULT NULL,
    p_macroregion TEXT DEFAULT NULL,
    p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
    p_month INTEGER DEFAULT NULL -- NULL indica ano completo
)
RETURNS TABLE (
    indicator_number INTEGER,
    code TEXT,
    title TEXT,
    calculation_method TEXT,
    numerator NUMERIC,
    denominator NUMERIC,
    result NUMERIC,
    unit_type TEXT,
    periodicity TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ind1 NUMERIC := 0;
    v_ind2 NUMERIC := 0;
    v_ind3 NUMERIC := 0;
    v_ind4 NUMERIC := 0;
    v_ind5 NUMERIC := 0;
    v_ind6_num NUMERIC := 0;
    v_ind6_den NUMERIC := 0;
    v_ind6_res NUMERIC := 0;
    v_ind7_num NUMERIC := 0;
    v_ind7_den NUMERIC := 0;
    v_ind7_res NUMERIC := 0;
    v_ind8 NUMERIC := 0;
    v_ind9 NUMERIC := 0;
    v_ind10 NUMERIC := 0;
    v_ind11_num NUMERIC := 0;
    v_ind11_den NUMERIC := 0;
    v_ind11_res NUMERIC := 0;
BEGIN
    -- 1. Indicador 1: Pacientes em Acompanhamento Farmacoterapêutico ativo
    SELECT COALESCE(SUM(m.total_patients_in_followup), 0)
    INTO v_ind1
    FROM public.monthly_complementary_data m
    JOIN public.units u ON u.id = m.unit_id
    WHERE (p_unit_id IS NULL OR m.unit_id = p_unit_id)
      AND (p_macroregion IS NULL OR u.macroregion = p_macroregion)
      AND m.year = p_year
      AND (p_month IS NULL OR m.month = p_month);

    -- Caso não haja dados na planilha complementar, busca a contagem de pacientes ativos cadastrados
    IF v_ind1 = 0 THEN
        SELECT COUNT(p.id)
        INTO v_ind1
        FROM public.patients p
        JOIN public.units u ON u.id = p.unit_id
        WHERE (p_unit_id IS NULL OR p.unit_id = p_unit_id)
          AND (p_macroregion IS NULL OR u.macroregion = p_macroregion)
          AND p.status = 'em_acompanhamento';
    END IF;

    -- 2. Indicador 2: Pacientes atendidos no Acompanhamento Farmacoterapêutico no mês
    SELECT COUNT(DISTINCT c.patient_id)
    INTO v_ind2
    FROM public.consultations c
    JOIN public.units u ON u.id = c.unit_id
    WHERE (p_unit_id IS NULL OR c.unit_id = p_unit_id)
      AND (p_macroregion IS NULL OR u.macroregion = p_macroregion)
      AND EXTRACT(YEAR FROM c.consultation_date) = p_year
      AND (p_month IS NULL OR EXTRACT(MONTH FROM c.consultation_date) = p_month)
      AND c.is_pharmaceutical_guidance_only = false;

    -- 3. Indicador 3: Primeiras Consultas Farmacêuticas do Acompanhamento realizadas no mês
    SELECT COUNT(DISTINCT c.patient_id)
    INTO v_ind3
    FROM public.consultations c
    JOIN public.units u ON u.id = c.unit_id
    WHERE (p_unit_id IS NULL OR c.unit_id = p_unit_id)
      AND (p_macroregion IS NULL OR u.macroregion = p_macroregion)
      AND EXTRACT(YEAR FROM c.consultation_date) = p_year
      AND (p_month IS NULL OR EXTRACT(MONTH FROM c.consultation_date) = p_month)
      AND c.is_new_patient = true;

    -- 4. Indicador 4: Consultas Farmacêuticas de retorno do Acompanhamento realizadas no mês
    SELECT COUNT(DISTINCT c.patient_id)
    INTO v_ind4
    FROM public.consultations c
    JOIN public.units u ON u.id = c.unit_id
    WHERE (p_unit_id IS NULL OR c.unit_id = p_unit_id)
      AND (p_macroregion IS NULL OR u.macroregion = p_macroregion)
      AND EXTRACT(YEAR FROM c.consultation_date) = p_year
      AND (p_month IS NULL OR EXTRACT(MONTH FROM c.consultation_date) = p_month)
      AND c.is_new_patient = false;

    -- 5. Indicador 5: Número de PRFs identificados no mês
    SELECT COUNT(pr.id)
    INTO v_ind5
    FROM public.consultation_prfs pr
    JOIN public.consultations c ON c.id = pr.consultation_id
    JOIN public.units u ON u.id = c.unit_id
    WHERE (p_unit_id IS NULL OR c.unit_id = p_unit_id)
      AND (p_macroregion IS NULL OR u.macroregion = p_macroregion)
      AND EXTRACT(YEAR FROM c.consultation_date) = p_year
      AND (p_month IS NULL OR EXTRACT(MONTH FROM c.consultation_date) = p_month);

    -- 6. Indicador 6: Porcentagem de PRFs resolvidos por paciente em acompanhamento
    SELECT 
        COUNT(pr.id) FILTER (WHERE pr.status = 'Resolvido'),
        COUNT(pr.id)
    INTO v_ind6_num, v_ind6_den
    FROM public.consultation_prfs pr
    JOIN public.consultations c ON c.id = pr.consultation_id
    JOIN public.units u ON u.id = c.unit_id
    WHERE (p_unit_id IS NULL OR c.unit_id = p_unit_id)
      AND (p_macroregion IS NULL OR u.macroregion = p_macroregion)
      AND EXTRACT(YEAR FROM c.consultation_date) = p_year
      AND (p_month IS NULL OR EXTRACT(MONTH FROM c.consultation_date) = p_month);

    IF v_ind6_den > 0 THEN
        v_ind6_res := ROUND((v_ind6_num / v_ind6_den) * 100, 2);
    ELSE
        v_ind6_res := 0;
    END IF;

    -- 7. Indicador 7: Número médio de intervenções farmacêuticas realizadas por paciente atendido
    SELECT 
        COALESCE(SUM(c.interventions_count), 0),
        COUNT(DISTINCT c.patient_id)
    INTO v_ind7_num, v_ind7_den
    FROM public.consultations c
    JOIN public.units u ON u.id = c.unit_id
    WHERE (p_unit_id IS NULL OR c.unit_id = p_unit_id)
      AND (p_macroregion IS NULL OR u.macroregion = p_macroregion)
      AND EXTRACT(YEAR FROM c.consultation_date) = p_year
      AND (p_month IS NULL OR EXTRACT(MONTH FROM c.consultation_date) = p_month)
      AND c.is_pharmaceutical_guidance_only = false;

    IF v_ind7_den > 0 THEN
        v_ind7_res := ROUND((v_ind7_num / v_ind7_den), 2);
    ELSE
        v_ind7_res := 0;
    END IF;

    -- 8. Indicador 8: Pacientes com Alta do Acompanhamento Farmacoterapêutico no mês
    SELECT COUNT(DISTINCT c.patient_id)
    INTO v_ind8
    FROM public.consultations c
    JOIN public.units u ON u.id = c.unit_id
    WHERE (p_unit_id IS NULL OR c.unit_id = p_unit_id)
      AND (p_macroregion IS NULL OR u.macroregion = p_macroregion)
      AND EXTRACT(YEAR FROM c.consultation_date) = p_year
      AND (p_month IS NULL OR EXTRACT(MONTH FROM c.consultation_date) = p_month)
      AND c.pharmaceutical_discharge = true;

    -- 9. Indicador 9: Número de atividades coletivas/grupos educativos realizados no mês
    SELECT COALESCE(SUM(m.collective_health_activities), 0)
    INTO v_ind9
    FROM public.monthly_complementary_data m
    JOIN public.units u ON u.id = m.unit_id
    WHERE (p_unit_id IS NULL OR m.unit_id = p_unit_id)
      AND (p_macroregion IS NULL OR u.macroregion = p_macroregion)
      AND m.year = p_year
      AND (p_month IS NULL OR m.month = p_month);

    -- 10. Indicador 10: Pacientes atendidos administrativamente (dispensação) no mês (Fonte AFSESAB)
    SELECT COALESCE(SUM(m.dispensing_administrative_patients), 0)
    INTO v_ind10
    FROM public.monthly_complementary_data m
    JOIN public.units u ON u.id = m.unit_id
    WHERE (p_unit_id IS NULL OR m.unit_id = p_unit_id)
      AND (p_macroregion IS NULL OR u.macroregion = p_macroregion)
      AND m.year = p_year
      AND (p_month IS NULL OR m.month = p_month);

    -- 11. Indicador 11: Cobertura de primeira dispensação realizada pelo farmacêutico no mês
    SELECT 
        COALESCE(SUM(m.first_dispensing_by_pharmacist), 0),
        COALESCE(SUM(m.total_new_patients_month), 0)
    INTO v_ind11_num, v_ind11_den
    FROM public.monthly_complementary_data m
    JOIN public.units u ON u.id = m.unit_id
    WHERE (p_unit_id IS NULL OR m.unit_id = p_unit_id)
      AND (p_macroregion IS NULL OR u.macroregion = p_macroregion)
      AND m.year = p_year
      AND (p_month IS NULL OR m.month = p_month);

    IF v_ind11_den > 0 THEN
        v_ind11_res := ROUND((v_ind11_num / v_ind11_den) * 100, 2);
    ELSE
        v_ind11_res := 0;
    END IF;

    -- RETORNO DOS 11 REGISTROS TABULARES
    RETURN QUERY VALUES
    (1, 'IND-01', 'Pacientes em Acompanhamento Farmacoterapêutico', 'Contagem de pacientes ativos em acompanhamento na competência', v_ind1, NULL::NUMERIC, v_ind1, 'Pacientes', 'Mensal'),
    (2, 'IND-02', 'Pacientes atendidos no Acompanhamento no mês', 'COUNT(DISTINCT patient_id) onde is_guidance_only = false', v_ind2, NULL::NUMERIC, v_ind2, 'Pacientes', 'Mensal'),
    (3, 'IND-03', 'Primeiras Consultas Farmacêuticas realizadas no mês', 'COUNT(DISTINCT patient_id) onde is_new_patient = true', v_ind3, NULL::NUMERIC, v_ind3, 'Consultas', 'Mensal'),
    (4, 'IND-04', 'Consultas Farmacêuticas de retorno realizadas no mês', 'COUNT(DISTINCT patient_id) onde is_new_patient = false', v_ind4, NULL::NUMERIC, v_ind4, 'Consultas', 'Mensal'),
    (5, 'IND-05', 'Problemas Relacionados à Farmacoterapia (PRF) identificados', 'COUNT(*) de PRFs registrados nas consultas do período', v_ind5, NULL::NUMERIC, v_ind5, 'PRFs', 'Mensal'),
    (6, 'IND-06', 'Porcentagem de PRFs resolvidos', '(PRFs com status "Resolvido" / Total de PRFs identificados) * 100', v_ind6_num, v_ind6_den, v_ind6_res, '%', 'Mensal'),
    (7, 'IND-07', 'Média de intervenções farmacêuticas por paciente atendido', 'Total de Intervenções / Pacientes Atendidos no Acompanhamento', v_ind7_num, v_ind7_den, v_ind7_res, 'Média', 'Mensal'),
    (8, 'IND-08', 'Pacientes com Alta do Acompanhamento Farmacoterapêutico', 'COUNT(DISTINCT patient_id) onde pharmaceutical_discharge = true', v_ind8, NULL::NUMERIC, v_ind8, 'Pacientes', 'Mensal'),
    (9, 'IND-09', 'Atividades coletivas / Grupos educativos realizados', 'Soma das atividades coletivas da unidade na competência', v_ind9, NULL::NUMERIC, v_ind9, 'Atividades', 'Mensal'),
    (10, 'IND-10', 'Pacientes atendidos administrativamente na dispensação', 'Dispensação administrativa (AFSESAB)', v_ind10, NULL::NUMERIC, v_ind10, 'Pacientes', 'Mensal'),
    (11, 'IND-11', 'Cobertura de 1ª dispensação realizada por farmacêutico', '(1ªs Dispensações por Farmacêutico / Novos Processos da Unidade) * 100', v_ind11_num, v_ind11_den, v_ind11_res, '%', 'Mensal');
END;
$$;

-- ==============================================================================
-- 7. SEED DATA INICIAL (CARGA INICIAL DE DEMONSTRAÇÃO E PRODUÇÃO)
-- ==============================================================================

-- 7.1 Unidades Regionais de Saúde (Exemplo Bahia / CEAF)
INSERT INTO public.units (id, name, macroregion, cnes, municipality, active)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'BRS Paulo Afonso', 'Macrorregional Norte', '2801452', 'Paulo Afonso', true),
    ('22222222-2222-2222-2222-222222222222', 'BRS Juazeiro', 'Macrorregional Norte', '2801460', 'Juazeiro', true),
    ('33333333-3333-3333-3333-333333333333', 'BRS Feira de Santana', 'Macrorregional Centro-Leste', '2801479', 'Feira de Santana', true),
    ('44444444-4444-4444-4444-444444444444', 'BRS Vitória da Conquista', 'Macrorregional Sudoeste', '2801487', 'Vitória da Conquista', true),
    ('55555555-5555-5555-5555-555555555555', 'Farmácia Central CEAF Salvador', 'Macrorregional Leste', '2801495', 'Salvador', true)
ON CONFLICT (id) DO NOTHING;

-- 7.2 Diagnósticos Frequentes do CEAF (CID-10)
INSERT INTO public.cids (code, description)
VALUES 
    ('M05.8', 'Outras artrites reumatoides soropositivas'),
    ('G35', 'Esclerose múltipla'),
    ('L40.0', 'Psoríase vulgar'),
    ('K50.0', 'Doença de Crohn do intestino delgado'),
    ('K51.0', 'Pancolite ulcerativa'),
    ('E10', 'Diabetes mellitus insulino-dependente'),
    ('M45', 'Espondilite ancilosante'),
    ('G20', 'Doença de Parkinson'),
    ('D59.3', 'Síndrome hemolítico-urêmica'),
    ('E84.0', 'Fibrose cística com manifestações pulmonares')
ON CONFLICT (code) DO NOTHING;

-- 7.3 Medicamentos Frequentes do CEAF / RENAME
INSERT INTO public.medications (name, pharmaceutical_form, component)
VALUES 
    ('Adalimumabe 40mg/0,8mL', 'Solução Injetável em seringa preenchida', 'CEAF'),
    ('Infliximabe 100mg', 'Pó para solução injetável', 'CEAF'),
    ('Etanercepte 50mg', 'Solução Injetável em seringa preenchida', 'CEAF'),
    ('Secuquinumabe 150mg', 'Solução Injetável em caneta aplicadora', 'CEAF'),
    ('Insulina Glargina 100 UI/mL', 'Solução Injetável em refil/caneta', 'CEAF'),
    ('Fingolimode 0,5mg', 'Cápsula', 'CEAF'),
    ('Natalizumabe 20mg/mL', 'Concentrado para solução para infusão', 'CEAF'),
    ('Rivaroxabana 20mg', 'Comprimido Revestido', 'CEAF'),
    ('Metformina 850mg', 'Comprimido', 'Básico'),
    ('Levotiroxina Sódica 50mcg', 'Comprimido', 'Básico'),
    ('Pregabalina 75mg', 'Cápsula Dura', 'Estratégico'),
    ('Azatioprina 50mg', 'Comprimido Revestido', 'CEAF'),
    ('Metotrexato 2,5mg', 'Comprimido', 'CEAF')
ON CONFLICT DO NOTHING;
