-- ==============================================================================
-- PHARMACARE - ATUALIZAÇÃO DE COMPETÊNCIA SIGTAP / CEAF (Competência Atual)
-- Gerado em: 2026-10-16T14:00:52.230Z
-- Total Medicamentos CEAF: 26
-- Total Diagnósticos PCDT (CIDs): 15
-- ==============================================================================

-- 1. Garante coluna sigtap_code na tabela medications
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'medications' AND column_name = 'sigtap_code'
    ) THEN
        ALTER TABLE public.medications ADD COLUMN sigtap_code TEXT;
        CREATE INDEX IF NOT EXISTS idx_medications_sigtap_code ON public.medications(sigtap_code);
    END IF;
END $$;

-- 2. Tabela de Relacionamento Procedimento-Medicamento x CIDs (PCDTs)
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

-- 3. Inserção / Atualização dos CIDs Oficiais dos PCDTs
INSERT INTO public.cids (code, description, active)
VALUES
    ('B18.2', 'Hepatite viral cronica C', true),
    ('E10.9', 'Diabetes mellitus insulino-dependente sem complicacoes', true),
    ('E23.0', 'Hipopituitarismo / Deficiencia do hormonio de crescimento (GH)', true),
    ('G35', 'Esclerose multipla', true),
    ('K50.0', 'Doenca de Crohn do intestino delgado', true),
    ('K50.1', 'Doenca de Crohn do intestino grosso (colon)', true),
    ('K51.0', 'Pancolite ulcerativa (Retocolite Ulcerativa)', true),
    ('L40.0', 'Psoriase vulgar', true),
    ('L40.5', 'Artropatia psoriasica', true),
    ('M05.8', 'Outras artrites reumatoides soropositivas', true),
    ('M06.0', 'Artrite reumatoide soronegativa', true),
    ('M32.1', 'Lupus eritematoso sistemico com comprometimento de orgaos', true),
    ('M45', 'Espondilite ancilosante', true),
    ('M81.0', 'Osteoporose pos-menopausa com alto risco de fratura', true),
    ('N18.0', 'Doenca renal cronica estagio terminal (DRC)', true)
ON CONFLICT (code) DO UPDATE 
SET description = EXCLUDED.description, active = true;

-- 4. Inserção / Atualização dos Medicamentos Especializados (CEAF)
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604380014', 'Adalimumabe 40 mg/0,8 mL (por Frasco-Ampola Ou Seringa Preenchida) 101', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604380014' OR LOWER(name) = LOWER('Adalimumabe 40 mg/0,8 mL (por Frasco-Ampola Ou Seringa Preenchida) 101')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604320011', 'Infliximabe 100 mg (por Frasco-Ampola) 101', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604320011' OR LOWER(name) = LOWER('Infliximabe 100 mg (por Frasco-Ampola) 101')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604380022', 'Etanercepte 50 mg (por Frasco-Ampola Ou Seringa Preenchida) 101', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604380022' OR LOWER(name) = LOWER('Etanercepte 50 mg (por Frasco-Ampola Ou Seringa Preenchida) 101')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604470013', 'Golimumabe 50 mg/0,5 mL (por Caneta Aplicadora Ou Seringa Preenchida) 101', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604470013' OR LOWER(name) = LOWER('Golimumabe 50 mg/0,5 mL (por Caneta Aplicadora Ou Seringa Preenchida) 101')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604530016', 'Ustequinumabe 45 mg/0,5 mL (por Frasco-Ampola) 101', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604530016' OR LOWER(name) = LOWER('Ustequinumabe 45 mg/0,5 mL (por Frasco-Ampola) 101')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604380049', 'Secuquinumabe 150 mg/mL (por Caneta Aplicadora Ou Seringa Preenchida) 101', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604380049' OR LOWER(name) = LOWER('Secuquinumabe 150 mg/mL (por Caneta Aplicadora Ou Seringa Preenchida) 101')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604720010', 'Tocilizumabe 20 mg/mL (por Frasco-Ampola De 4 mL/10 mL/20 mL) 101', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604720010' OR LOWER(name) = LOWER('Tocilizumabe 20 mg/mL (por Frasco-Ampola De 4 mL/10 mL/20 mL) 101')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604610010', 'Baricitinibe 2 mg (por Comprimido) 101', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604610010' OR LOWER(name) = LOWER('Baricitinibe 2 mg (por Comprimido) 101')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604610028', 'Baricitinibe 4 mg (por Comprimido) 101', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604610028' OR LOWER(name) = LOWER('Baricitinibe 4 mg (por Comprimido) 101')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604620015', 'Tofacitinibe 5 mg (por Comprimido) 101', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604620015' OR LOWER(name) = LOWER('Tofacitinibe 5 mg (por Comprimido) 101')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604410010', 'Fingolimode 0,5 mg (por Capsula) 101', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604410010' OR LOWER(name) = LOWER('Fingolimode 0,5 mg (por Capsula) 101')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604430011', 'Natalizumabe 300 mg/15 mL (por Frasco-Ampola) 101', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604430011' OR LOWER(name) = LOWER('Natalizumabe 300 mg/15 mL (por Frasco-Ampola) 101')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604750016', 'Ocrelizumabe 300 mg/10 mL (por Frasco-Ampola) 101', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604750016' OR LOWER(name) = LOWER('Ocrelizumabe 300 mg/10 mL (por Frasco-Ampola) 101')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604270014', 'Micofenolato De Mofetila 500 mg (por Comprimido) 101', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604270014' OR LOWER(name) = LOWER('Micofenolato De Mofetila 500 mg (por Comprimido) 101')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604290015', 'Tacrolimo 1 mg (por Capsula) 101', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604290015' OR LOWER(name) = LOWER('Tacrolimo 1 mg (por Capsula) 101')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604290023', 'Tacrolimo 5 mg (por Capsula) 101', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604290023' OR LOWER(name) = LOWER('Tacrolimo 5 mg (por Capsula) 101')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604010012', 'Ciclosporina 50 mg (por Capsula) 101', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604010012' OR LOWER(name) = LOWER('Ciclosporina 50 mg (por Capsula) 101')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604010020', 'Ciclosporina 100 mg (por Capsula) 101', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604010020' OR LOWER(name) = LOWER('Ciclosporina 100 mg (por Capsula) 101')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604350018', 'Somatropina 12 UI (por Frasco-Ampola) 101', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604350018' OR LOWER(name) = LOWER('Somatropina 12 UI (por Frasco-Ampola) 101')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604350026', 'Somatropina 30 UI (por Frasco-Ampola) 101', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604350026' OR LOWER(name) = LOWER('Somatropina 30 UI (por Frasco-Ampola) 101')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604040019', 'Alfaepoetina 4.000 UI (por Frasco-Ampola) 101', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604040019' OR LOWER(name) = LOWER('Alfaepoetina 4.000 UI (por Frasco-Ampola) 101')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604040027', 'Alfaepoetina 10.000 UI (por Frasco-Ampola) 101', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604040027' OR LOWER(name) = LOWER('Alfaepoetina 10.000 UI (por Frasco-Ampola) 101')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604810019', 'Denosumabe 60 mg/mL (por Seringa Preenchida) 101', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604810019' OR LOWER(name) = LOWER('Denosumabe 60 mg/mL (por Seringa Preenchida) 101')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604850010', 'Sofosbuvir 400 mg + Velpatasvir 100 mg (por Comprimido) 101', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604850010' OR LOWER(name) = LOWER('Sofosbuvir 400 mg + Velpatasvir 100 mg (por Comprimido) 101')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604100011', 'Insulina Glargina 100 UI/mL (por Refil Ou Caneta) 101', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604100011' OR LOWER(name) = LOWER('Insulina Glargina 100 UI/mL (por Refil Ou Caneta) 101')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604100020', 'Insulina Degludeca 100 UI/mL (por Caneta Aplicadora) 101', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604100020' OR LOWER(name) = LOWER('Insulina Degludeca 100 UI/mL (por Caneta Aplicadora) 101')
);
