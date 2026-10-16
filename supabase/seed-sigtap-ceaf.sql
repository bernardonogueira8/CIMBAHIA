-- ==============================================================================
-- PHARMACARE - CARGA OFICIAL DE CIDS E MEDICAMENTOS CEAF / SIGTAP (PCDTs)
-- Componente Especializado da Assistência Farmacêutica (Subgrupo SIGTAP 06.04)
-- ==============================================================================

-- 1. Inserção / Atualização de CIDs Oficiais dos Protocolos Clínicos (PCDTs)
INSERT INTO public.cids (code, description, active)
VALUES
    ('M05.8', 'Outras artrites reumatoides soropositivas', true),
    ('M06.0', 'Artrite reumatoide soronegativa', true),
    ('M45', 'Espondilite ancilosante', true),
    ('M32.1', 'Lúpus eritematoso sistêmico com comprometimento de órgãos', true),
    ('L40.0', 'Psoríase vulgar', true),
    ('L40.5', 'Artropatia psoriásica', true),
    ('K50.0', 'Doença de Crohn do intestino delgado', true),
    ('K50.1', 'Doença de Crohn do intestino grosso (cólon)', true),
    ('K51.0', 'Pancolite ulcerativa (Retocolite Ulcerativa)', true),
    ('G35', 'Esclerose múltipla', true),
    ('G20', 'Doença de Parkinson', true),
    ('G31.8', 'Doença de Alzheimer (Outras degenerações especificadas)', true),
    ('E10.9', 'Diabetes mellitus insulino-dependente sem complicações', true),
    ('E23.0', 'Hipopituitarismo / Deficiência do hormônio de crescimento (GH)', true),
    ('B18.1', 'Hepatite crônica viral B sem agente Delta', true),
    ('B18.2', 'Hepatite viral crônica C', true),
    ('N18.0', 'Doença renal crônica estágio terminal (DRC)', true),
    ('D59.5', 'Hemoglobinúria paroxística noturna (HPN)', true),
    ('D61.9', 'Aplasia medular não especificada', true),
    ('M81.0', 'Osteoporose pós-menopausa com alto risco de fratura', true),
    ('E84.0', 'Fibrose cística com manifestações pulmonares', true),
    ('I27.0', 'Hipertensão pulmonar primária', true)
ON CONFLICT (code) DO UPDATE 
SET description = EXCLUDED.description, active = true;

-- 2. Inserção / Atualização de Medicamentos de Alto Custo / Biológicos (CEAF)
INSERT INTO public.medications (name, pharmaceutical_form, component, active)
VALUES
    ('Adalimumabe 40mg/0,8mL', 'Solução Injetável em seringa preenchida', 'CEAF', true),
    ('Infliximabe 100mg', 'Pó liofilizado para solução injetável', 'CEAF', true),
    ('Etanercepte 50mg', 'Solução Injetável em caneta aplicadora', 'CEAF', true),
    ('Golimumabe 50mg/0,5mL', 'Solução Injetável em caneta aplicadora', 'CEAF', true),
    ('Certolizumabe Pegol 200mg', 'Solução Injetável em seringa preenchida', 'CEAF', true),
    ('Secuquinumabe 150mg', 'Solução Injetável em caneta preenchida', 'CEAF', true),
    ('Ustequinumabe 45mg/0,5mL', 'Solução Injetável em frasco-ampola', 'CEAF', true),
    ('Rituximabe 500mg/50mL', 'Solução para diluição para infusão', 'CEAF', true),
    ('Tocilizumabe 20mg/mL', 'Solução para infusão (frasco 4mL/10mL/20mL)', 'CEAF', true),
    ('Baricitinibe 2mg / 4mg', 'Comprimido Revestido', 'CEAF', true),
    ('Tofacitinibe 5mg', 'Comprimido Revestido', 'CEAF', true),
    ('Upadacitinibe 15mg', 'Comprimido de Liberação Prolongada', 'CEAF', true),
    ('Fingolimode 0,5mg', 'Cápsula gelatinosa', 'CEAF', true),
    ('Natalizumabe 300mg/15mL', 'Solução concentrada para infusão', 'CEAF', true),
    ('Ocrelizumabe 300mg/10mL', 'Solução concentrada para infusão', 'CEAF', true),
    ('Acetato de Glatirâmer 40mg/mL', 'Solução Injetável em seringa preenchida', 'CEAF', true),
    ('Betainterferona 1a 44mcg (12 MUI)', 'Solução Injetável em seringa preenchida', 'CEAF', true),
    ('Micofenolato de Mofetila 500mg', 'Comprimido Revestido', 'CEAF', true),
    ('Tacrolimo 1mg / 5mg', 'Cápsula dura', 'CEAF', true),
    ('Ciclosporina 50mg / 100mg', 'Cápsula gelatinosa mole', 'CEAF', true),
    ('Azatioprina 50mg', 'Comprimido Revestido', 'CEAF', true),
    ('Metotrexato 2,5mg', 'Comprimido', 'CEAF', true),
    ('Metotrexato 25mg/mL', 'Solução Injetável em frasco-ampola', 'CEAF', true),
    ('Leflunomida 20mg', 'Comprimido Revestido', 'CEAF', true),
    ('Somatropina 12 UI / 30 UI', 'Pó liofilizado para solução injetável', 'CEAF', true),
    ('Alfaepoetina 4.000 UI / 10.000 UI', 'Solução Injetável em frasco-ampola', 'CEAF', true),
    ('Denosumabe 60mg/mL', 'Solução Injetável em seringa preenchida', 'CEAF', true),
    ('Teriparatida 20mcg/dose', 'Solução Injetável em caneta aplicadora descartável', 'CEAF', true),
    ('Sofosbuvir 400mg + Velpatasvir 100mg', 'Comprimido Revestido', 'CEAF', true),
    ('Tenofovir Desoproxila 300mg', 'Comprimido Revestido', 'CEAF', true),
    ('Insulina Glargina 100 UI/mL', 'Solução Injetável em refil/caneta', 'CEAF', true),
    ('Insulina Degludeca 100 UI/mL', 'Solução Injetável em caneta aplicadora', 'CEAF', true),
    ('Rivaroxabana 20mg', 'Comprimido Revestido', 'CEAF', true),
    ('Hidroxicloroquina 400mg', 'Comprimido Revestido', 'CEAF', true);
