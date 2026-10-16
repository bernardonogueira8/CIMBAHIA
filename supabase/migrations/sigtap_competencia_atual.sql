-- ==============================================================================
-- PHARMACARE - ATUALIZAÇÃO DE COMPETÊNCIA SIGTAP / CEAF (Competência Atual)
-- Gerado em: 2026-10-16T16:11:03.063Z
-- Total Medicamentos CEAF: 363
-- Total Diagnósticos PCDT (CIDs): 408
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
    ('B17.1', 'Hepatite aguda C', true),
    ('B18.2', 'Hepatite viral crônica C', true),
    ('B20.0', 'Doença pelo HIV resultando em infecções micobacterianas', true),
    ('B20.1', 'Doença pelo HIV resultando em outras infecções bacterianas', true),
    ('B20.2', 'Doença pelo HIV resultando em doença citomegálica', true),
    ('B20.3', 'Doença pelo HIV resultando em outras infecções virais', true),
    ('B20.4', 'Doença pelo HIV resultando em candidíase', true),
    ('B20.5', 'Doença pelo HIV resultando em outras micoses', true),
    ('B20.6', 'Doença pelo HIV resultando em pneumonia por Pneumocystis jirovecii', true),
    ('B20.7', 'Doença pelo HIV resultando em infecções múltiplas', true),
    ('B20.8', 'Doença pelo HIV resultando em outras doenças infecciosas e parasitárias', true),
    ('B20.9', 'Doença pelo HIV resultando em doença infecciosa ou parasitária não especificada', true),
    ('B22.0', 'Doença pelo HIV resultando em encefalopatia', true),
    ('B22.1', 'Doença pelo HIV resultando em pneumonite intersticial linfática', true),
    ('B22.2', 'Doença pelo HIV resultando em síndrome de emaciação', true),
    ('B22.7', 'Doença pelo HIV resultando em doenças múltiplas classificadas em outra parte', true),
    ('B23.0', 'Síndrome de infecção aguda pelo hiv', true),
    ('B23.1', 'Doença pelo HIV resultando em linfadenopatias generalizadas (persistentes)', true),
    ('B23.2', 'Doença pelo HIV resultando em anomalias hematológicas e imunológicas não classificada em out. parte', true),
    ('B23.8', 'Doença pelo HIV resultando em outra afecções especificadas', true),
    ('B24', 'Doença pelo vírus da imunodeficiência humana [HIV] não especificada', true),
    ('B34.2', 'Infecção por coronavírus de localização não especificada', true),
    ('D18.0', 'Hemangioma de qualquer localização', true),
    ('D25.0', 'Leiomioma submucoso do útero', true),
    ('D25.1', 'Leiomioma intramural do útero', true),
    ('D25.2', 'Leiomioma subseroso do útero', true),
    ('D46.0', 'Anemia refratária sem sideroblastos', true),
    ('D46.1', 'Anemia refratária com sideroblastos', true),
    ('D46.4', 'Anemia refratária, não especificada', true),
    ('D46.7', 'Outras síndromes mielodisplásicas', true),
    ('D57.0', 'Anemia falciforme com crise', true),
    ('D57.1', 'Anemia falciforme sem crise', true),
    ('D57.2', 'Transtornos falciformes heterozigóticos duplos', true),
    ('D59.0', 'Anemia hemolítica auto-imune induzida por droga', true),
    ('D59.1', 'Outras anemias hemolíticas auto-imunes', true),
    ('D59.5', 'Hemoglobinúria paroxística noturna [marchiafava-micheli]', true),
    ('D60.0', 'Aplasia pura adquirida crônica da série vermelha', true),
    ('D60.1', 'Aplasia pura adquirida transitória da série vermelha', true),
    ('D60.8', 'Outras aplasias puras adquiridas da série vermelha', true),
    ('D61.0', 'Anemia aplástica constitucional', true),
    ('D61.1', 'Anemia aplástica induzida por drogas', true),
    ('D61.2', 'Anemia aplástica devida a outros agentes externos', true),
    ('D61.3', 'Anemia aplástica idiopática', true),
    ('D61.8', 'Outras anemias aplásticas especificadas', true),
    ('D68.8', 'Outros defeitos especificados da coagulação', true),
    ('D69.3', 'Púrpura trombocitopênica idiopática', true),
    ('D70', 'Agranulocitose', true),
    ('D80.0', 'Hipogamaglobulinemia hereditária', true),
    ('D80.1', 'Hipogamaglobulinemia não familiar', true),
    ('D80.3', 'Deficiência seletiva de subclasses de imunoglobulina G [IGG]', true),
    ('D80.5', 'Imunodeficiência com aumento de imunoglobulina M [IGM]', true),
    ('D80.6', 'Deficiência de anticorpos com imunoglobulinas próximas do normal ou com hiperimunoglobulinemia', true),
    ('D80.7', 'Hipogamaglobulinemia transitória da infância', true),
    ('D80.8', 'Outras imunodeficiências com predominância de defeitos de anticorpos', true),
    ('D81.0', 'Imunodeficiência combinada grave [SCID] com disgenesia reticular', true),
    ('D81.1', 'Imunodeficiência combinada grave [SCID] com números baixos de células T e B', true),
    ('D81.2', 'Imunodeficiência combinada grave [SCID] com números baixos ou normais de células B', true),
    ('D81.3', 'Deficiência de adenosina-deaminase [ADA]', true),
    ('D81.4', 'Síndrome de nezelof', true),
    ('D81.5', 'Deficiência de purina-nucleosídeo fosforilase [pnp]', true),
    ('D81.6', 'Deficiência major classe I do complexo de histocompatibilidade', true),
    ('D81.7', 'Deficiência major classe II do complexo de histocompatibilidade', true),
    ('D81.8', 'Outras deficiências imunitárias combinadas', true),
    ('D82.0', 'Síndrome de Wiskott-Aldrich', true),
    ('D82.1', 'Síndrome de di George', true),
    ('D83.0', 'Imunodeficiência comum variável com predominância de anormal. do número e da função das células B', true),
    ('D83.2', 'Imunodeficiência comum variável com auto-anticorpos às células B ou T', true),
    ('D83.8', 'Outras imunodeficiências comuns variáveis', true),
    ('D84.1', 'Defeitos no sistema complemento', true),
    ('E10.0', 'Diabetes Mellitus insulino-dependente - com coma', true),
    ('E10.1', 'Diabetes Mellitus insulino-dependente - com cetoacidose', true),
    ('E10.2', 'Diabetes Mellitus insulino-dependente - com complicações renais', true),
    ('E10.3', 'Diabetes Mellitus insulino-dependente - com complicações oftálmicas', true),
    ('E10.4', 'Diabetes Mellitus insulino-dependente - com complicações neurológicas', true),
    ('E10.5', 'Diabetes Mellitus insulino-dependente - com complicações circulatórias periféricas', true),
    ('E10.6', 'Diabetes Mellitus insulino-dependente - com outras complicações especificadas', true),
    ('E10.7', 'Diabetes Mellitus insulino-dependente - com complicações múltiplas', true),
    ('E10.8', 'Diabetes Mellitus insulino-dependente - com complicações não especificadas', true),
    ('E10.9', 'Diabetes Mellitus insulino-dependente - sem complicações', true),
    ('E11.2', 'Diabetes Mellitus não-insulino-dependente - com complicações renais', true),
    ('E11.3', 'Diabetes Mellitus não-insulino-dependente - com complicações oftálmicas', true),
    ('E11.4', 'Diabetes Mellitus não-insulino-dependente - com complicações neurológicas', true),
    ('E11.5', 'Diabetes Mellitus não-insulino-dependente - com complicações circulatórias periféricas', true),
    ('E11.6', 'Diabetes Mellitus não-insulino-dependente - com outras complicações especificadas', true),
    ('E11.7', 'Diabetes Mellitus não-insulino-dependente - com complicações múltiplas', true),
    ('E11.8', 'Diabetes Mellitus não-insulino-dependente - com complicações não especificadas', true),
    ('E11.9', 'Diabetes Mellitus não-insulino-dependente - sem complicações', true),
    ('E20.0', 'Hipoparatireoidismo idiopático', true),
    ('E20.1', 'Pseudohipoparatireoidismo', true),
    ('E20.8', 'Outro hipoparatireoidismo', true),
    ('E22.0', 'Acromegalia e gigantismo hipofisário', true),
    ('E22.1', 'Hiperprolactinemia', true),
    ('E22.8', 'Outras hiperfunções da hipófise', true),
    ('E23.0', 'Hipopituitarismo', true),
    ('E23.2', 'Diabetes insípido', true),
    ('E25.0', 'Transtornos adrenogenitais congênitos associados à deficiência enzimática', true),
    ('E27.1', 'Insuficiência adrenocortical primária', true),
    ('E27.4', 'Outras insuficiências adrenocorticais e as não especificadas', true),
    ('E28.0', 'Excesso de estrógeno', true),
    ('E28.2', 'Síndrome do ovário policístico', true),
    ('E55.0', 'Raquitismo ativo', true),
    ('E55.9', 'Deficiência não especificada de vitamina D', true),
    ('E64.3', 'Seqüelas do raquitismo', true),
    ('E70.0', 'Fenilcetonúria clássica', true),
    ('E70.1', 'Outras hiperfenilalaninemias', true),
    ('E74.0', 'Doença de depósito de glicogênio', true),
    ('E75.2', 'Outras esfingolipidoses', true),
    ('E76.0', 'Mucopolissacaridose do tipo I', true),
    ('E76.1', 'Mucopolissacaridose do tipo II', true),
    ('E76.2', 'Outras mucopolissacaridoses', true),
    ('E78.0', 'Hipercolesterolemia pura', true),
    ('E78.1', 'Hipergliceridemia pura', true),
    ('E78.2', 'Hiperlipidemia mista', true),
    ('E78.3', 'Hiperquilomicronemia', true),
    ('E78.4', 'Outras hiperlipidemias', true),
    ('E78.5', 'Hiperlipidemia não especificada', true),
    ('E78.6', 'Deficiências de lipoproteínas', true),
    ('E78.8', 'Outros distúrbios do metabolismo de lipoproteínas', true),
    ('E83.0', 'Distúrbios do metabolismo do cobre', true),
    ('E83.1', 'Doença do metabolismo do ferro', true),
    ('E83.3', 'Distúrbios do metabolismo do fósforo', true),
    ('E84.0', 'Fibrose cística com manifestações pulmonares', true),
    ('E84.1', 'Fibrose cística com manifestações intestinais', true),
    ('E84.8', 'Fibrose cística com outras manifestações', true),
    ('E85.0', 'Amiloidose heredofamiliar não-neuropática', true),
    ('E85.1', 'Amiloidose heredofamiliar neuropática', true),
    ('E85.8', 'Outras amiloidoses', true),
    ('E88.9', 'Distúrbio metabólico não especificado', true),
    ('E89.2', 'Hipoparatireoidismo pós-procedimento', true),
    ('F00.0', 'Demência na doença de Alzheimer de início precoce', true),
    ('F00.1', 'Demência na doença de Alzheimer de início tardio', true),
    ('F00.2', 'Demência na doença de Alzheimer, forma atípica ou mista', true),
    ('F20.0', 'Esquizofrenia paranóide', true),
    ('F20.1', 'Esquizofrenia hebefrênica', true),
    ('F20.2', 'Esquizofrenia catatônica', true),
    ('F20.3', 'Esquizofrenia indiferenciada', true),
    ('F20.4', 'Depressão pós-esquizofrênica', true),
    ('F20.5', 'Esquizofrenia residual', true),
    ('F20.6', 'Esquizofrenia simples', true),
    ('F20.8', 'Outras esquizofrenias', true),
    ('F25.0', 'Transtorno esquizoafetivo do tipo maníaco', true),
    ('F25.1', 'Transtorno esquizoafetivo do tipo depressivo', true),
    ('F25.2', 'Transtorno esquizoafetivo do tipo misto', true),
    ('F31.1', 'Transtorno afetivo bipolar, episódio atual maníaco sem sintomas psicóticos', true),
    ('F31.2', 'Transtorno afetivo bipolar, episódio atual maníaco com sintomas psicóticos', true),
    ('F31.3', 'Transtorno afetivo bipolar, episódio atual depressivo leve ou moderado', true),
    ('F31.4', 'Transtorno afetivo bipolar, episódio atual depressivo grave sem sintomas psicóticos', true),
    ('F31.5', 'Transtorno afetivo bipolar, episódio atual depressivo grave com sintomas psicóticos', true),
    ('F31.6', 'Transtorno afetivo bipolar, episódio atual misto', true),
    ('F31.7', 'Transtorno afetivo bipolar, atualmente em remissão', true),
    ('F84.0', 'Autismo infantil', true),
    ('F84.1', 'Autismo atípico', true),
    ('F84.3', 'Outro transtorno desintegrativo da infância', true),
    ('F84.5', 'Síndrome de asperger', true),
    ('F84.8', 'Outros transtornos globais do desenvolvimento', true),
    ('G04.1', 'Paraplegia espástica tropical', true),
    ('G12.0', 'Atrofia muscular espinal infantil tipo I [Werdnig-Hoffman]', true),
    ('G12.1', 'Outras atrofias musculares espinais hereditárias', true),
    ('G12.2', 'Doença do neurônio motor', true),
    ('G20', 'Doença de Parkinson', true),
    ('G24.3', 'Torcicolo espasmódico', true),
    ('G24.4', 'Distonia orofacial idiopática', true),
    ('G24.5', 'Blefaroespasmo', true),
    ('G24.8', 'Outras distonias', true),
    ('G30.0', 'Doença de alzheimer de início precoce', true),
    ('G30.1', 'Doença de alzheimer de início tardio', true),
    ('G30.8', 'Outras formas de doença de Alzheimer', true),
    ('G35', 'Esclerose múltipla', true),
    ('G40.0', 'Epilepsia e síndr. epilépt. idiop. def. por sua local. (focal - parcial)c/ crises de iníc. focal', true),
    ('G40.1', 'Epilepsia e síndr. epilépt. sintom. def. por sua local. (focal - parcial) c/ crises parciais simples', true),
    ('G40.2', 'Epilepsia e síndr. epilépt. sintom. def. por sua local. (focal - parcial) c/ crises parc. complexas', true),
    ('G40.3', 'Epilepsia e síndrome epiléptica generalizadas idiopáticas', true),
    ('G40.4', 'Outras epilepsias e síndromes epilépticas generalizadas', true),
    ('G40.5', 'Síndromes epilépticas especiais', true),
    ('G40.6', 'Crise de grande mal, não especificada (com ou sem pequeno mal)', true),
    ('G40.7', 'Pequeno mal não especificado, sem crises de grande mal', true),
    ('G40.8', 'Outras epilepsias', true),
    ('G51.3', 'Espasmo hemifacial clônico', true),
    ('G51.8', 'Outros transtornos do nervo facial', true),
    ('G61.0', 'Síndrome de guillain-barré', true),
    ('G70.0', 'Miastenia gravis', true),
    ('G70.2', 'Miastenia congênita e do desenvolvimento', true),
    ('G80.0', 'Paralisia cerebral quadriplágica espástica', true),
    ('G80.1', 'Paralisia cerebral diplégica espástica', true),
    ('G80.2', 'Paralisia cerebral hemiplégica espástica', true),
    ('G81.1', 'Hemiplegia espástica', true),
    ('G82.1', 'Paraplegia espástica', true),
    ('G82.4', 'Tetraplegia espástica', true),
    ('H15.0', 'Esclerite', true),
    ('H20.1', 'Iridociclite crônica', true),
    ('H30.1', 'Inflamação corrorretiniana disseminada', true),
    ('H30.2', 'Ciclite posterior', true),
    ('H30.8', 'Outras inflamações coriorretinianas', true),
    ('H40.1', 'Glaucoma primário de ângulo aberto', true),
    ('H40.2', 'Glaucoma primário de ângulo fechado', true),
    ('H40.3', 'Glaucoma secundário a traumatismo ocular', true),
    ('H40.4', 'Glaucoma secundário a inflamação ocular', true),
    ('H40.5', 'Glaucoma secundário a outros transtornos do olho', true),
    ('H40.6', 'Glaucoma secundário a drogas', true),
    ('H40.8', 'Outro glaucoma', true),
    ('I20.0', 'Angina instável', true),
    ('I20.1', 'Angina pectoris com espasmo documentado', true),
    ('I21.0', 'Infarto agudo transmural da parede anterior do miocárdio', true),
    ('I21.1', 'Infarto agudo transmural da parede inferior do miocárdio', true),
    ('I21.2', 'Infarto agudo transmural do miocárdio de outras localizações', true),
    ('I21.3', 'Infarto agudo transmural do miocárdio, de localização não especificada', true),
    ('I21.4', 'Infarto agudo subendocárdico do miocárdio', true),
    ('I21.9', 'Infarto agudo do miocárdio não especificado', true),
    ('I22.0', 'Infarto do miocárdio recorrente da parede anterior', true),
    ('I22.1', 'Infarto do miocárdio recorrente da parede inferior', true),
    ('I22.8', 'Infarto do miocárdio recorrente de outras localizações', true),
    ('I22.9', 'Infarto do miocárdio recorrente de localização não especificada', true),
    ('I23.0', 'Hemopericárdio como complicação atual subseqüente ao infarto agudo do miocárdio', true),
    ('I23.1', 'Comunicação interatrial como complicação atual subseqüente ao infarto agudo do miocárdio', true),
    ('I23.2', 'Comunicação interventricular como complicação atual subseqüente ao infarto agudo do miocárdio', true),
    ('I23.3', 'Ruptura parede coração sem ocorr. hemopericárdio como complic. atual subseq. infarto agudo miocárdio', true),
    ('I23.4', 'Ruptura de cordoalhas tendíneas como complicação atual subseqüente ao infarto agudo do miocárdio', true),
    ('I23.5', 'Ruptura de músculos papilares como complicação atual subseqüente ao infarto agudo do miocárdio', true),
    ('I23.6', 'Trombose de átrio, aurícula e ventrículo como complicação atual subseq. infarto agudo do miocárdio', true),
    ('I23.8', 'Outras complicações atuais subseqüentes ao infarto agudo do miocárdio', true),
    ('I24.0', 'Trombose coronária que não resulta em infarto do miocárdio', true),
    ('I24.8', 'Outras formas de doença isquêmica aguda do coração', true),
    ('I24.9', 'Doença isquêmica aguda do coração não especificada', true),
    ('I27.0', 'Hipertensão pulmonar primária', true),
    ('I27.2', 'Outra hipertensão pulmonar secundária', true),
    ('I27.8', 'Outras doenças pulmonares do coração especificadas', true),
    ('I50.0', 'Insuficiência cardíaca congestiva', true),
    ('I50.1', 'Insuficiência ventricular esquerda', true),
    ('I50.9', 'Insuficiência cardíaca não especificada', true),
    ('I69.0', 'Seqüelas de hemorragia subaracnoídea', true),
    ('I69.1', 'Seqüelas de hemorragia intracerebral', true),
    ('I69.2', 'Seqüelas de outras hemorragias intracranianas não traumáticas', true),
    ('I69.3', 'Seqüelas de infarto cerebral', true),
    ('I69.4', 'Seqüelas de acidente vascular cerebral não especificado como hemorrágico ou isquêmico', true),
    ('I69.8', 'Seqüelas de outras doenças cerebrovasculares e das não especificadas', true),
    ('I82.0', 'Síndrome de bUdd-Chiari', true),
    ('I82.1', 'Tromboflebite migratória', true),
    ('I82.2', 'Embolia e trombose de veia cava', true),
    ('I82.3', 'Embolia e trombose de veia renal', true),
    ('I82.8', 'Embolia e trombose de outras veias especificadas', true),
    ('J44.0', 'Doença pulmonar obstrutiva crônica com infecção respiratória aguda do trato respiratório inferior', true),
    ('J44.1', 'Doença pulmonar obstrutiva crônica com exacerbação aguda não especificada', true),
    ('J44.8', 'Outras formas especificadas de doença pulmonar obstrutiva crônica', true),
    ('J45.0', 'Asma predominantemente alérgica', true),
    ('J45.1', 'Asma não-alérgica', true),
    ('J45.8', 'Asma mista', true),
    ('J84.8', 'Outras doenças pulmonares intersticiais especificadas', true),
    ('K50.0', 'Doença de crohn do intestino delgado', true),
    ('K50.1', 'Doença de crohn do intestino grosso', true),
    ('K50.8', 'Outra forma de doença de crohn', true),
    ('K51.0', 'Enterocolite ulcerativa (crônica)', true),
    ('K51.1', 'Ileocolite ulcerativa (crônica)', true),
    ('K51.2', 'Proctite ulcerativa (crônica)', true),
    ('K51.3', 'Retossigmoidite ulcerativa (crônica)', true),
    ('K51.4', 'Pseudopolipose do cólon', true),
    ('K51.5', 'Proctocolite mucosa', true),
    ('K51.8', 'Outras colites ulcerativas', true),
    ('K52.2', 'Gastroenterite e colite alérgicas ou ligadas à dieta', true),
    ('K74.3', 'Cirrose biliar primária', true),
    ('K75.4', 'Hepatite autoimune', true),
    ('K86.0', 'Pancreatite crônica induzida por álcool', true),
    ('K86.1', 'Outras pancreatites crônicas', true),
    ('K90.3', 'Esteatorréia pancreática', true),
    ('L20.0', 'Prurigo de besnier', true),
    ('L20.8', 'Outras dermatites atópicas', true),
    ('L40.0', 'Psoríase vulgar', true),
    ('L40.1', 'Psoríase pustulosa generalizada', true),
    ('L40.4', 'Psoríase gutata', true),
    ('L40.8', 'Outras formas de psoríase', true),
    ('L44.0', 'Pitiríase rubra pilar', true),
    ('L68.0', 'Hirsutismo', true),
    ('L70.0', 'Acne vulgar', true),
    ('L70.1', 'Acne conglobata', true),
    ('L70.8', 'Outras formas de acne', true),
    ('L73.2', 'Hidradenite supurativa', true),
    ('L93.0', 'Lúpus eritematoso discóide', true),
    ('L93.1', 'Lúpus eritematoso cutâneo subagudo', true),
    ('M02.1', 'Artropatia pós-desintérica', true),
    ('M02.3', 'Doença de Reiter', true),
    ('M03.2', 'Outras artropatias pós-infecciosas em doenças classificadas em outra parte', true),
    ('M03.6', 'Artropatia reacional em outras doenças classificadas em outra parte', true),
    ('M05.0', 'Síndrome de Felty', true),
    ('M05.1', 'Doença reumatóide do pulmão', true),
    ('M05.2', 'Vasculite reumatóide', true),
    ('M05.3', 'Artrite reumatóide com comprometimento de outros órgãos e sistemas', true),
    ('M05.8', 'Outras artrites reumatóides soro-positivas', true),
    ('M06.0', 'Artrite reumatóide soro-negativa', true),
    ('M06.8', 'Outras artrites reumatóides especificadas', true),
    ('M07.0', 'Artropatia psoriásica interfalangiana distal', true),
    ('M07.2', 'Espondilite psoriásica', true),
    ('M07.3', 'Outras artropatias psoriásicas', true),
    ('M07.4', 'Artropatia na doença de Crohn [enterite regional]', true),
    ('M07.5', 'Artropatia na colite ulcerativa', true),
    ('M07.6', 'Outras artropatias enteropáticas', true),
    ('M08.0', 'Artrite reumatóide juvenil', true),
    ('M08.1', 'Espondilite ancilosante juvenil', true),
    ('M08.2', 'Artrite juvenil com início sistêmico', true),
    ('M08.3', 'Poliartrite juvenil (soro-negativa)', true),
    ('M08.4', 'Artrite juvenil pauciarticular', true),
    ('M08.8', 'Outras artrites juvenis', true),
    ('M08.9', 'Artrite juvenil não especificada', true),
    ('M16.0', 'Coxartrose primária bilateral', true),
    ('M16.1', 'Outras coxartroses primárias', true),
    ('M16.4', 'Coxartrose bilateral pós-traumática', true),
    ('M16.5', 'Outras coxartroses pós-traumáticas', true),
    ('M16.6', 'Outras coxartroses secundárias bilaterais', true),
    ('M16.7', 'Outras coxartroses secundárias', true),
    ('M16.9', 'Coxartrose não especificada', true),
    ('M17.0', 'Gonartrose primária bilateral', true),
    ('M17.1', 'Outras gonartroses primárias', true),
    ('M17.2', 'Gonartrose pós-traumática bilateral', true),
    ('M17.3', 'Outras gonartroses pós-traumática', true),
    ('M17.4', 'Outras gonartroses secundárias bilaterais', true),
    ('M17.5', 'Outras gonartroses secundárias', true),
    ('M17.9', 'Gonartrose não especificada', true),
    ('M31.3', 'Granulomatose de Wegener', true),
    ('M31.7', 'Poliangeíte microscópica', true),
    ('M32.1', 'Lúpus eritematoso disseminado [sistêmico] com comprometimento de outros órgãos e sistemas', true),
    ('M32.8', 'Outras formas de lúpus eritematoso disseminado [sistêmico]', true),
    ('M33.0', 'Dermatomiosite juvenil', true),
    ('M33.1', 'Outras dermatomiosites', true),
    ('M33.2', 'Polimiosite', true),
    ('M34.0', 'Esclerose sistêmica progressiva', true),
    ('M34.1', 'Síndrome cr(e)st', true),
    ('M34.8', 'Outras formas de esclerose sistêmica', true),
    ('M45', 'Espondilite ancilosante', true),
    ('M46.8', 'Outras espondilopatias inflamatórias especificadas', true),
    ('M80.0', 'Osteoporose pós-menopáusica com fratura patológica', true),
    ('M80.1', 'Osteoporose pós-ooforectomia com fratura patológica', true),
    ('M80.2', 'Osteoporose de desuso com fratura patológica', true),
    ('M80.3', 'Osteoporose por má-absorção pós-cirúrgica com fratura patológica', true),
    ('M80.4', 'Osteoporose induzida por drogas com fratura patológica', true),
    ('M80.5', 'Osteoporose idiopática com fratura patológica', true),
    ('M80.8', 'Outras osteoporoses com fratura patológica', true),
    ('M81.0', 'Osteoporose pós-menopáusica', true),
    ('M81.1', 'Osteoporose pós-ooforectomia', true),
    ('M81.2', 'Osteoporose de desuso', true),
    ('M81.3', 'Osteoporose devida à má-absorção pós-cirúrgica', true),
    ('M81.4', 'Osteoporose induzida por drogas', true),
    ('M81.5', 'Osteoporose idiopática', true),
    ('M81.6', 'Osteoporose localizada [Lequesne]', true),
    ('M81.8', 'Outras osteoporoses', true),
    ('M82.0', 'Osteoporose na mielomatose múltipla', true),
    ('M82.1', 'Osteoporose em distúrbios endócrinos', true),
    ('M82.8', 'Osteoporose em outras doenças classificadas em outra parte', true),
    ('M83.0', 'Osteomalácia puerperal', true),
    ('M83.1', 'Osteomalácia senil', true),
    ('M83.2', 'Osteomalácia do adulto devida a má-absorção', true),
    ('M83.3', 'Osteomalácia do adulto devido à desnutrição', true),
    ('M83.8', 'Outra osteomalácia do adulto', true),
    ('M85.8', 'Outros transtornos especificados da densidade e da estrutura ósseas', true),
    ('M88.0', 'Doença de paget do crânio', true),
    ('M88.8', 'Doença de paget de outros ossos', true),
    ('N04.0', 'Síndrome nefrótica - anormalidade glomerular minor', true),
    ('N04.1', 'Síndrome nefrótica - lesões glomerulares focais e segmentares', true),
    ('N04.2', 'Síndrome nefrótica - glomerulonefrite membranosa difusa', true),
    ('N04.3', 'Síndrome nefrótica - glomerulonefrite proliferativa mesangial difusa', true),
    ('N04.4', 'Síndrome nefrótica - glomerulonefrite proliferativa endocapilar difusa', true),
    ('N04.5', 'Síndrome nefrótica - glomerulonefrite mesangiocapilar difusa', true),
    ('N04.6', 'Síndrome nefrótica - doença de depósito denso', true),
    ('N04.7', 'Síndrome nefrótica - glomerulonefrite difusa em crescente', true),
    ('N04.8', 'Síndrome nefrótica - outras', true),
    ('N04.9', 'Síndrome nefrótica - não especificada', true),
    ('N18.0', 'Doença renal em estádio final', true),
    ('N18.2', 'Doença renal crônica, estádio 2', true),
    ('N18.3', 'Doença renal crônica, estádio 3', true),
    ('N18.4', 'Doença renal crônica, estádio 4', true),
    ('N18.5', 'Doença renal crônica, estádio 5', true),
    ('N18.8', 'Outra insuficiência renal crônica', true),
    ('N25.0', 'Osteodistrofia renal', true),
    ('N25.8', 'Outros transtornos resultantes de função renal tubular alterada', true),
    ('N80.0', 'Endometriose do útero', true),
    ('N80.1', 'Endometriose do ovário', true),
    ('N80.2', 'Endometriose da trompa de falópio', true),
    ('N80.3', 'Endometriose do peritônio pélvico', true),
    ('N80.4', 'Endometriose do septo retovaginal e da vagina', true),
    ('N80.5', 'Endometriose do intestino', true),
    ('N80.8', 'Outra endometriose', true),
    ('O22.3', 'Flebotrombose profunda na gravidez', true),
    ('O22.5', 'Trombose venosa cerebral na gravidez', true),
    ('Q15.0', 'Glaucoma congênito', true),
    ('Q80.0', 'Ictiose vulgar', true),
    ('Q80.1', 'Ictiose ligada ao cromossomo x', true),
    ('Q80.2', 'Ictiose lamelar', true),
    ('Q80.3', 'Eritrodermia ictiosiforme bulhosa congênita', true),
    ('Q80.8', 'Outras ictioses congênitas', true),
    ('Q80.9', 'Ictiose congênita não especificada', true),
    ('Q82.8', 'Outras malformações congênitas especificadas da pele', true),
    ('Q96.0', 'Cariótipo 45, X', true),
    ('Q96.1', 'Cariótipo 46, X ISO (XQ)', true),
    ('Q96.2', 'Cariótipo 46, X com cromossomo sexual anormal, salvo ISO (XQ)', true),
    ('Q96.3', 'Mosaicismo cromossômico, 45, X/46, XX ou XY', true),
    ('Q96.4', 'Mosaicismo cromossômico, 45, X/outra(s) linhagens celular(es) com cromossomo sexual anormal', true),
    ('Q96.8', 'Outras variantes da síndrome de turner', true),
    ('R52.1', 'Dor crônica intratável', true),
    ('R52.2', 'Outra dor crônica', true),
    ('T45.4', 'Intoxicação por ferro e seus compostos', true),
    ('T86.1', 'Falência ou rejeição de transplante de rim', true),
    ('T86.2', 'Falência ou rejeição de transplante de coração', true),
    ('T86.4', 'Falência ou rejeição de transplante de fígado', true),
    ('T90.5', 'Seqüelas de traumatismo intracraniano', true),
    ('T90.8', 'Seqüelas de outros traumatismos especificados da cabeça', true),
    ('Z94.0', 'Rim transplantado', true),
    ('Z94.1', 'Coração transplantado', true),
    ('Z94.2', 'Pulmão transplantado', true),
    ('Z94.3', 'Coração e pulmões transplantados', true),
    ('Z94.4', 'Fígado transplantado', true),
    ('Z94.8', 'Outros órgãos e tecidos transplantados', true)
ON CONFLICT (code) DO UPDATE 
SET description = EXCLUDED.description, active = true;

-- 4. Inserção / Atualização dos Medicamentos Especializados (CEAF)
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604010010', 'Mesalazina 400 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604010010' OR LOWER(name) = LOWER('Mesalazina 400 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604010028', 'Mesalazina 500 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604010028' OR LOWER(name) = LOWER('Mesalazina 500 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604010036', 'Mesalazina 800 mg - Por Comprimido', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604010036' OR LOWER(name) = LOWER('Mesalazina 800 mg - Por Comprimido')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604010044', 'Mesalazina 250 mg (por Supositorio)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604010044' OR LOWER(name) = LOWER('Mesalazina 250 mg (por Supositorio)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604010052', 'Mesalazina 500 mg (por Supositorio)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604010052' OR LOWER(name) = LOWER('Mesalazina 500 mg (por Supositorio)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604010060', 'Mesalazina 1000 mg (por Supositorio)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604010060' OR LOWER(name) = LOWER('Mesalazina 1000 mg (por Supositorio)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604010079', 'Mesalazina 1 g + Diluente 100 mL (enema) - Por Dose', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604010079' OR LOWER(name) = LOWER('Mesalazina 1 g + Diluente 100 mL (enema) - Por Dose')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604010087', 'Mesalazina 3 g + Diluente 100 mL (enema) - Por Dose', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604010087' OR LOWER(name) = LOWER('Mesalazina 3 g + Diluente 100 mL (enema) - Por Dose')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604010095', 'Sulfassalazina 500 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604010095' OR LOWER(name) = LOWER('Sulfassalazina 500 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604010109', 'Mesalazina 2 g Grânulos De Liberação Prolongada (por Sachê)', 'Comprimido de Liberação Prolongada', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604010109' OR LOWER(name) = LOWER('Mesalazina 2 g Grânulos De Liberação Prolongada (por Sachê)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604020015', 'Deferasirox 125 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604020015' OR LOWER(name) = LOWER('Deferasirox 125 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604020023', 'Deferasirox 250 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604020023' OR LOWER(name) = LOWER('Deferasirox 250 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604020031', 'Deferasirox 500 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604020031' OR LOWER(name) = LOWER('Deferasirox 500 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604020040', 'Deferiprona 500 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604020040' OR LOWER(name) = LOWER('Deferiprona 500 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604020058', 'Desferroxamina 500 mg Injetavel (por Frasco-Ampola)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604020058' OR LOWER(name) = LOWER('Desferroxamina 500 mg Injetavel (por Frasco-Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604020066', 'Deferiprona 1000 mg Liberação Modificada (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604020066' OR LOWER(name) = LOWER('Deferiprona 1000 mg Liberação Modificada (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604030010', 'Bromocriptina 2,5 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604030010' OR LOWER(name) = LOWER('Bromocriptina 2,5 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604030037', 'Cabergolina 0,5 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604030037' OR LOWER(name) = LOWER('Cabergolina 0,5 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604030045', 'Pramipexol 0,125 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604030045' OR LOWER(name) = LOWER('Pramipexol 0,125 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604030053', 'Pramipexol 0,25 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604030053' OR LOWER(name) = LOWER('Pramipexol 0,25 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604030061', 'Pramipexol 1 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604030061' OR LOWER(name) = LOWER('Pramipexol 1 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604040016', 'Fenoterol 100 mcg Aerossol (por Frasco De 200 Doses)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604040016' OR LOWER(name) = LOWER('Fenoterol 100 mcg Aerossol (por Frasco De 200 Doses)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604040024', 'Formoterol 12 mcg (por Capsula Inalante)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604040024' OR LOWER(name) = LOWER('Formoterol 12 mcg (por Capsula Inalante)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604040032', 'Formoterol 12 mcg Po Inalante (por Frasco De 60 Doses)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604040032' OR LOWER(name) = LOWER('Formoterol 12 mcg Po Inalante (por Frasco De 60 Doses)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604040040', 'Formoterol 12 mcg + Budesonida 400 mcg (por Capsula Inalante)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604040040' OR LOWER(name) = LOWER('Formoterol 12 mcg + Budesonida 400 mcg (por Capsula Inalante)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604040059', 'Formoterol 12 mcg + Budesonida 400 mcg Po Inalante (por Frasco De 60 Doses)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604040059' OR LOWER(name) = LOWER('Formoterol 12 mcg + Budesonida 400 mcg Po Inalante (por Frasco De 60 Doses)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604040067', 'Formoterol 6 mcg + Budesonida 200 mcg Po Inalante (por Frasco De 60 Doses)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604040067' OR LOWER(name) = LOWER('Formoterol 6 mcg + Budesonida 200 mcg Po Inalante (por Frasco De 60 Doses)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604040075', 'Formoterol 6mcg + Budesonida 200 mcg (por Capsula Inalante)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604040075' OR LOWER(name) = LOWER('Formoterol 6mcg + Budesonida 200 mcg (por Capsula Inalante)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604040091', 'Salmeterol 50 mcg Po Inalante Ou Aerossol Bucal (por Frasco De 60 Doses)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604040091' OR LOWER(name) = LOWER('Salmeterol 50 mcg Po Inalante Ou Aerossol Bucal (por Frasco De 60 Doses)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604050011', 'Codeina 3 mg/mL Solucao Oral (por Frasco De 120 mL)', 'Solução Oral', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604050011' OR LOWER(name) = LOWER('Codeina 3 mg/mL Solucao Oral (por Frasco De 120 mL)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604050020', 'Codeina 30 mg/mL (por Ampola De 2 mL)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604050020' OR LOWER(name) = LOWER('Codeina 30 mg/mL (por Ampola De 2 mL)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604050038', 'Codeina 30 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604050038' OR LOWER(name) = LOWER('Codeina 30 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604050046', 'Codeina 60 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604050046' OR LOWER(name) = LOWER('Codeina 60 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604050054', 'Morfina 10 mg/mL (por Ampola De 1 mL)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604050054' OR LOWER(name) = LOWER('Morfina 10 mg/mL (por Ampola De 1 mL)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604050062', 'Morfina 10 mg/mL Solucao Oral (por Frasco De 60 mL)', 'Solução Oral', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604050062' OR LOWER(name) = LOWER('Morfina 10 mg/mL Solucao Oral (por Frasco De 60 mL)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604050070', 'Morfina 10 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604050070' OR LOWER(name) = LOWER('Morfina 10 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604050089', 'Morfina 30 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604050089' OR LOWER(name) = LOWER('Morfina 30 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604050097', 'Morfina De Liberacao Controlada 30 mg (por Capsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604050097' OR LOWER(name) = LOWER('Morfina De Liberacao Controlada 30 mg (por Capsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604050100', 'Morfina De Liberacao Controlada 60 mg (por Capsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604050100' OR LOWER(name) = LOWER('Morfina De Liberacao Controlada 60 mg (por Capsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604050119', 'Morfina De Liberacao Controlada 100 mg (por Capsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604050119' OR LOWER(name) = LOWER('Morfina De Liberacao Controlada 100 mg (por Capsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604060017', 'Complemento Alimentar P/ Paciente Fenilcetonurico Menor De 1 Ano - Formula De Aminoácidos Isenta De Fenilalanina (por Grama)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604060017' OR LOWER(name) = LOWER('Complemento Alimentar P/ Paciente Fenilcetonurico Menor De 1 Ano - Formula De Aminoácidos Isenta De Fenilalanina (por Grama)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604060025', 'Complemento Alimentar P/ Paciente Fenilcetonurico Maior De 1 Ano - Formula De Aminoácidos Isenta De Fenilalanina (por Grama)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604060025' OR LOWER(name) = LOWER('Complemento Alimentar P/ Paciente Fenilcetonurico Maior De 1 Ano - Formula De Aminoácidos Isenta De Fenilalanina (por Grama)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604070012', 'Triexifenidil 5 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604070012' OR LOWER(name) = LOWER('Triexifenidil 5 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604080018', 'Cloroquina 150 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604080018' OR LOWER(name) = LOWER('Cloroquina 150 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604080026', 'Hidroxicloroquina 400 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604080026' OR LOWER(name) = LOWER('Hidroxicloroquina 400 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604080034', 'Hidroxicloroquina 200 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604080034' OR LOWER(name) = LOWER('Hidroxicloroquina 200 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604090013', 'Ciclofosfamida 50 mg (por Dragea)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604090013' OR LOWER(name) = LOWER('Ciclofosfamida 50 mg (por Dragea)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604100019', 'Desmopressina 0,1 mg/mL Aplicacao Nasal (por Frasco De 2,5 mL', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604100019' OR LOWER(name) = LOWER('Desmopressina 0,1 mg/mL Aplicacao Nasal (por Frasco De 2,5 mL')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604100027', 'Desmopressina 0,1 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604100027' OR LOWER(name) = LOWER('Desmopressina 0,1 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604100035', 'Desmopressina 0,2 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604100035' OR LOWER(name) = LOWER('Desmopressina 0,2 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604110014', 'Gosserrelina 3,60 mg Injetavel (por Seringa Preenchida)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604110014' OR LOWER(name) = LOWER('Gosserrelina 3,60 mg Injetavel (por Seringa Preenchida)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604110022', 'Gosserrelina 10,80 mg Injetavel (por Seringa Preenchida)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604110022' OR LOWER(name) = LOWER('Gosserrelina 10,80 mg Injetavel (por Seringa Preenchida)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604110030', 'Leuprorrelina 3,75 mg Injetavel (por Frasco-Ampola)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604110030' OR LOWER(name) = LOWER('Leuprorrelina 3,75 mg Injetavel (por Frasco-Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604110049', 'Leuprorrelina 11,25 mg Injetavel (por Frasco-Ampola)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604110049' OR LOWER(name) = LOWER('Leuprorrelina 11,25 mg Injetavel (por Frasco-Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604110057', 'Triptorrelina 3,75 mg Injetavel (por Frasco-Ampola)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604110057' OR LOWER(name) = LOWER('Triptorrelina 3,75 mg Injetavel (por Frasco-Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604110065', 'Triptorrelina 11,25 mg Injetavel (por Frasco-Ampola)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604110065' OR LOWER(name) = LOWER('Triptorrelina 11,25 mg Injetavel (por Frasco-Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604110073', 'Triptorrelina 22,5 mg Injetável (por Frasco-Ampola)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604110073' OR LOWER(name) = LOWER('Triptorrelina 22,5 mg Injetável (por Frasco-Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604110081', 'Leuprorrelina 45 mg Injetável (seringa Preenchida)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604110081' OR LOWER(name) = LOWER('Leuprorrelina 45 mg Injetável (seringa Preenchida)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604120010', 'Ciproterona 50 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604120010' OR LOWER(name) = LOWER('Ciproterona 50 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604130015', 'Cloridrato De Donepezila 5 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604130015' OR LOWER(name) = LOWER('Cloridrato De Donepezila 5 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604130023', 'Cloridrato De Donepezila 10 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604130023' OR LOWER(name) = LOWER('Cloridrato De Donepezila 10 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604130031', 'Galantamina 8 mg (por Capsula De Liberação Prolongada)', 'Comprimido de Liberação Prolongada', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604130031' OR LOWER(name) = LOWER('Galantamina 8 mg (por Capsula De Liberação Prolongada)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604130040', 'Galantamina 16 mg (por Capsula De Liberação Prolongada)', 'Comprimido de Liberação Prolongada', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604130040' OR LOWER(name) = LOWER('Galantamina 16 mg (por Capsula De Liberação Prolongada)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604130058', 'Galantamina 24 mg (por Capsula De Liberação Prolongada)', 'Comprimido de Liberação Prolongada', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604130058' OR LOWER(name) = LOWER('Galantamina 24 mg (por Capsula De Liberação Prolongada)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604130066', 'Rivastigmina 1,5 mg (por Capsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604130066' OR LOWER(name) = LOWER('Rivastigmina 1,5 mg (por Capsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604130074', 'Rivastigmina 2,0 mg/mL Solução Oral (por Frasco De 120 mL)', 'Solução Oral', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604130074' OR LOWER(name) = LOWER('Rivastigmina 2,0 mg/mL Solução Oral (por Frasco De 120 mL)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604130082', 'Rivastigmina 3 mg (por Capsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604130082' OR LOWER(name) = LOWER('Rivastigmina 3 mg (por Capsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604130090', 'Rivastigmina 4,5 mg (por Capsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604130090' OR LOWER(name) = LOWER('Rivastigmina 4,5 mg (por Capsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604130104', 'Rivastigmina 6 mg (por Capsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604130104' OR LOWER(name) = LOWER('Rivastigmina 6 mg (por Capsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604130112', 'Piridostigmina 60 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604130112' OR LOWER(name) = LOWER('Piridostigmina 60 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604130120', 'Rivastigmina 9 mg Adesivo Transdérmico', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604130120' OR LOWER(name) = LOWER('Rivastigmina 9 mg Adesivo Transdérmico')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604130139', 'Rivastigmina 18 mg Adesivo Transdérmico', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604130139' OR LOWER(name) = LOWER('Rivastigmina 18 mg Adesivo Transdérmico')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604140029', 'Danazol 100 mg (por Capsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604140029' OR LOWER(name) = LOWER('Danazol 100 mg (por Capsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604140037', 'Danazol 200 mg (por Capsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604140037' OR LOWER(name) = LOWER('Danazol 200 mg (por Capsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604150016', 'Primidona 100 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604150016' OR LOWER(name) = LOWER('Primidona 100 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604150024', 'Primidona 250 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604150024' OR LOWER(name) = LOWER('Primidona 250 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604160011', 'Pamidronato 30 mg Injetavel (por Frasco-Ampola)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604160011' OR LOWER(name) = LOWER('Pamidronato 30 mg Injetavel (por Frasco-Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604160020', 'Pamidronato 60 mg Injetavel (por Frasco-Ampola)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604160020' OR LOWER(name) = LOWER('Pamidronato 60 mg Injetavel (por Frasco-Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604160046', 'Risedronato 5 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604160046' OR LOWER(name) = LOWER('Risedronato 5 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604160054', 'Risedronato 35 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604160054' OR LOWER(name) = LOWER('Risedronato 35 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604160062', 'Ácido Zoledrônico 0,05 mg/mL(embalagem 100 mL)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604160062' OR LOWER(name) = LOWER('Ácido Zoledrônico 0,05 mg/mL(embalagem 100 mL)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604170017', 'Hidróxido De Alumínio 230 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604170017' OR LOWER(name) = LOWER('Hidróxido De Alumínio 230 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604170025', 'Hidróxido De Alumínio 300 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604170025' OR LOWER(name) = LOWER('Hidróxido De Alumínio 300 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604170033', 'Hidróxido De Alumínio 61,5 mg/mL (suspensão Por Frasco De 100 mL)', 'Suspensão', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604170033' OR LOWER(name) = LOWER('Hidróxido De Alumínio 61,5 mg/mL (suspensão Por Frasco De 100 mL)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604170041', 'Hidróxido De Alumínio 61,5 mg/mL (suspensão Por Frasco De 150 mL)', 'Suspensão', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604170041' OR LOWER(name) = LOWER('Hidróxido De Alumínio 61,5 mg/mL (suspensão Por Frasco De 150 mL)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604170050', 'Hidróxido De Alumínio 61,5 mg/mL (suspensão Por Frasco De 240', 'Suspensão', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604170050' OR LOWER(name) = LOWER('Hidróxido De Alumínio 61,5 mg/mL (suspensão Por Frasco De 240')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604180012', 'Clobazam 10 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604180012' OR LOWER(name) = LOWER('Clobazam 10 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604180020', 'Clobazam 20 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604180020' OR LOWER(name) = LOWER('Clobazam 20 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604190018', 'Vigabatrina 500 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604190018' OR LOWER(name) = LOWER('Vigabatrina 500 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604200013', 'Amantadina 100 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604200013' OR LOWER(name) = LOWER('Amantadina 100 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604210019', 'Ziprasidona 40 mg (por Capsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604210019' OR LOWER(name) = LOWER('Ziprasidona 40 mg (por Capsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604210027', 'Ziprasidona 80 mg (por Capsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604210027' OR LOWER(name) = LOWER('Ziprasidona 80 mg (por Capsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604220014', 'Etossuximida 50 mg/mL (frasco De 120 mL)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604220014' OR LOWER(name) = LOWER('Etossuximida 50 mg/mL (frasco De 120 mL)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604230010', 'Olanzapina 5 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604230010' OR LOWER(name) = LOWER('Olanzapina 5 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604230028', 'Olanzapina 10 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604230028' OR LOWER(name) = LOWER('Olanzapina 10 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604230036', 'Quetiapina 25 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604230036' OR LOWER(name) = LOWER('Quetiapina 25 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604230044', 'Quetiapina 100 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604230044' OR LOWER(name) = LOWER('Quetiapina 100 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604230052', 'Quetiapina 200 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604230052' OR LOWER(name) = LOWER('Quetiapina 200 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604230060', 'Quetiapina 300 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604230060' OR LOWER(name) = LOWER('Quetiapina 300 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604230079', 'Clozapina 25 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604230079' OR LOWER(name) = LOWER('Clozapina 25 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604230087', 'Clozapina 100 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604230087' OR LOWER(name) = LOWER('Clozapina 100 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604240023', 'Alfataliglicerase 200 U Injetável (por Frasco Ampola)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604240023' OR LOWER(name) = LOWER('Alfataliglicerase 200 U Injetável (por Frasco Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604240031', 'Imiglucerase 400 U Injetável (por Frasco-Ampola)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604240031' OR LOWER(name) = LOWER('Imiglucerase 400 U Injetável (por Frasco-Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604240058', 'Alfavelaglicerase 400 U Injetavel (por Frasco Ampola)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604240058' OR LOWER(name) = LOWER('Alfavelaglicerase 400 U Injetavel (por Frasco Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604240066', 'Laronidase 0,58 mg/mL Solução Injetável (frasco De 5 mL)', 'Solução Injetável em frasco-ampola', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604240066' OR LOWER(name) = LOWER('Laronidase 0,58 mg/mL Solução Injetável (frasco De 5 mL)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604240074', 'Idursulfase Alfa 2 mg/mL Solução Injetável (frasco De 3 mL)', 'Solução Injetável em frasco-ampola', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604240074' OR LOWER(name) = LOWER('Idursulfase Alfa 2 mg/mL Solução Injetável (frasco De 3 mL)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604240082', 'Galsulfase 1 mg/mL Solução Injetável (por Frasco Ampola De 5 mL)', 'Solução Injetável em frasco-ampola', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604240082' OR LOWER(name) = LOWER('Galsulfase 1 mg/mL Solução Injetável (por Frasco Ampola De 5 mL)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604240090', 'Alfaelosulfase 1 mg/mL Solução Injetável (por Frasco Ampola De 5 mL)', 'Solução Injetável em frasco-ampola', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604240090' OR LOWER(name) = LOWER('Alfaelosulfase 1 mg/mL Solução Injetável (por Frasco Ampola De 5 mL)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604240104', 'Alfa-Alglicosidase 50 mg Pó Liofilizado Para Solução Injetável', 'Solução Injetável', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604240104' OR LOWER(name) = LOWER('Alfa-Alglicosidase 50 mg Pó Liofilizado Para Solução Injetável')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604240112', 'Alfavestronidase 10 mg Solução Injetável (frascocom 5ml)', 'Solução Injetável em frasco-ampola', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604240112' OR LOWER(name) = LOWER('Alfavestronidase 10 mg Solução Injetável (frascocom 5ml)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604240120', 'Alfagalsidase 1mg/mL (frasco Ampola De 3,5 mL)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604240120' OR LOWER(name) = LOWER('Alfagalsidase 1mg/mL (frasco Ampola De 3,5 mL)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604250010', 'Filgrastim 300 mcg Injetavel (por Frasco Ampola Ou Seringa Preenchida)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604250010' OR LOWER(name) = LOWER('Filgrastim 300 mcg Injetavel (por Frasco Ampola Ou Seringa Preenchida)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604250037', 'Eltrombopague Olamina 25 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604250037' OR LOWER(name) = LOWER('Eltrombopague Olamina 25 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604250045', 'Eltrombopague Olamina 50 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604250045' OR LOWER(name) = LOWER('Eltrombopague Olamina 50 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604260016', 'Sacarato De Hidroxido Ferrico 100 mg Injetavel (por Frasco De 5 mL)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604260016' OR LOWER(name) = LOWER('Sacarato De Hidroxido Ferrico 100 mg Injetavel (por Frasco De 5 mL)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604270011', 'Bezafibrato 200 mg (por Drágea Ou Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604270011' OR LOWER(name) = LOWER('Bezafibrato 200 mg (por Drágea Ou Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604270020', 'Bezafibrato 400 mg (por Comprimido De Desintegração Lenta)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604270020' OR LOWER(name) = LOWER('Bezafibrato 400 mg (por Comprimido De Desintegração Lenta)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604270038', 'Ciprofibrato 100 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604270038' OR LOWER(name) = LOWER('Ciprofibrato 100 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604270046', 'Etofibrato 500 mg (por Capsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604270046' OR LOWER(name) = LOWER('Etofibrato 500 mg (por Capsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604270054', 'Fenofibrato 200 mg (por Capsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604270054' OR LOWER(name) = LOWER('Fenofibrato 200 mg (por Capsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604270062', 'Fenofibrato 250 mg (por Capsula De Liberacao Retardada)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604270062' OR LOWER(name) = LOWER('Fenofibrato 250 mg (por Capsula De Liberacao Retardada)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604270070', 'Genfibrozila 600 mg (comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604270070' OR LOWER(name) = LOWER('Genfibrozila 600 mg (comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604270089', 'Genfibrozila 900 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604270089' OR LOWER(name) = LOWER('Genfibrozila 900 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604270097', 'Ácido Nicotínico 250mg (por Comprimido De Liberação Prolongada)', 'Comprimido de Liberação Prolongada', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604270097' OR LOWER(name) = LOWER('Ácido Nicotínico 250mg (por Comprimido De Liberação Prolongada)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604270100', 'Ácido Nicotínico 500mg (por Comprimido De Liberação Prolongada)', 'Comprimido de Liberação Prolongada', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604270100' OR LOWER(name) = LOWER('Ácido Nicotínico 500mg (por Comprimido De Liberação Prolongada)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604270119', 'Ácido Nicotínico 750 mg (por Comprimido De Liberação Prolongada)', 'Comprimido de Liberação Prolongada', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604270119' OR LOWER(name) = LOWER('Ácido Nicotínico 750 mg (por Comprimido De Liberação Prolongada)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604280068', 'Budesonida 200 mcg (por Capsula Inalante)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604280068' OR LOWER(name) = LOWER('Budesonida 200 mcg (por Capsula Inalante)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604280076', 'Budesonida 400 mcg (por Capsula Inalante)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604280076' OR LOWER(name) = LOWER('Budesonida 400 mcg (por Capsula Inalante)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604280084', 'Budesonida 200 mcg Po Inalante Ou Aerossol Bucal (por Frasco C/ 100 Doses)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604280084' OR LOWER(name) = LOWER('Budesonida 200 mcg Po Inalante Ou Aerossol Bucal (por Frasco C/ 100 Doses)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604280092', 'Budesonida 200 mcg Po Inalante Ou Aerossol Bucal (por Frasco C/ 200 Doses)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604280092' OR LOWER(name) = LOWER('Budesonida 200 mcg Po Inalante Ou Aerossol Bucal (por Frasco C/ 200 Doses)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604280106', 'Metilprednisolona 500 mg Injetavel (por Ampola)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604280106' OR LOWER(name) = LOWER('Metilprednisolona 500 mg Injetavel (por Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604290012', 'Octreotida Lar 10 mg Injetavel (por Frasco-Ampola)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604290012' OR LOWER(name) = LOWER('Octreotida Lar 10 mg Injetavel (por Frasco-Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604290020', 'Octreotida Lar 20 mg Injetavel (por Frasco-Ampola)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604290020' OR LOWER(name) = LOWER('Octreotida Lar 20 mg Injetavel (por Frasco-Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604290039', 'Octreotida Lar 30 mg Injetavel (por Frasco-Ampola)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604290039' OR LOWER(name) = LOWER('Octreotida Lar 30 mg Injetavel (por Frasco-Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604290047', 'Octreotida 0,1 mg/mL Injetavel (por Ampola)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604290047' OR LOWER(name) = LOWER('Octreotida 0,1 mg/mL Injetavel (por Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604290063', 'Lanreotida 60 mg Injetável (por Seringa Preenchida)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604290063' OR LOWER(name) = LOWER('Lanreotida 60 mg Injetável (por Seringa Preenchida)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604290071', 'Lanreotida 90 mg Injetável (por Seringa Preenchida)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604290071' OR LOWER(name) = LOWER('Lanreotida 90 mg Injetável (por Seringa Preenchida)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604290080', 'Lanreotida 120 mg Injetável (por Seringa Preenchida)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604290080' OR LOWER(name) = LOWER('Lanreotida 120 mg Injetável (por Seringa Preenchida)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604310013', 'Imunoglobulina Humana 0,5 g Injetavel (por Frasco)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604310013' OR LOWER(name) = LOWER('Imunoglobulina Humana 0,5 g Injetavel (por Frasco)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604310021', 'Imunoglobulina Humana 1,0 g Injetavel (por Frasco)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604310021' OR LOWER(name) = LOWER('Imunoglobulina Humana 1,0 g Injetavel (por Frasco)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604310030', 'Imunoglobulina Humana 2,5 g Injetavel (por Frasco)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604310030' OR LOWER(name) = LOWER('Imunoglobulina Humana 2,5 g Injetavel (por Frasco)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604310048', 'Imunoglobulina Humana 3,0 g Injetavel (por Frasco)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604310048' OR LOWER(name) = LOWER('Imunoglobulina Humana 3,0 g Injetavel (por Frasco)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604310056', 'Imunoglobulina Humana 5,0 g Injetavel (por Frasco)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604310056' OR LOWER(name) = LOWER('Imunoglobulina Humana 5,0 g Injetavel (por Frasco)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604310064', 'Imunoglobulina Humana 6,0 g Injetavel (por Frasco)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604310064' OR LOWER(name) = LOWER('Imunoglobulina Humana 6,0 g Injetavel (por Frasco)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604320019', 'Everolimo 0,5 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604320019' OR LOWER(name) = LOWER('Everolimo 0,5 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604320027', 'Everolimo 0,75 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604320027' OR LOWER(name) = LOWER('Everolimo 0,75 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604320035', 'Everolimo 1 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604320035' OR LOWER(name) = LOWER('Everolimo 1 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604320043', 'Leflunomida 20 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604320043' OR LOWER(name) = LOWER('Leflunomida 20 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604320051', 'Micofenolato De Mofetila 500 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604320051' OR LOWER(name) = LOWER('Micofenolato De Mofetila 500 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604320060', 'Micofenolato De Sodio 180 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604320060' OR LOWER(name) = LOWER('Micofenolato De Sodio 180 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604320078', 'Micofenolato De Sodio 360 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604320078' OR LOWER(name) = LOWER('Micofenolato De Sodio 360 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604320086', 'Sirolimo 1 mg (por Dragea)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604320086' OR LOWER(name) = LOWER('Sirolimo 1 mg (por Dragea)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604320094', 'Sirolimo 2 mg (por Dragea)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604320094' OR LOWER(name) = LOWER('Sirolimo 2 mg (por Dragea)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604320116', 'Natalizumabe 300mg (por Frasco-Ampola)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604320116' OR LOWER(name) = LOWER('Natalizumabe 300mg (por Frasco-Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604320124', 'Abatacepte 250 mg Injetável (por Frasco Ampola).', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604320124' OR LOWER(name) = LOWER('Abatacepte 250 mg Injetável (por Frasco Ampola).')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604320132', 'Fingolimode 0,5 mg (por Cápsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604320132' OR LOWER(name) = LOWER('Fingolimode 0,5 mg (por Cápsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604320140', 'Abatacepte 125 mg Injetável (por Seringa Preenchida)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604320140' OR LOWER(name) = LOWER('Abatacepte 125 mg Injetável (por Seringa Preenchida)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604320159', 'Tofacitinibe 5 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604320159' OR LOWER(name) = LOWER('Tofacitinibe 5 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604320167', 'Vedolizumabe 300 mg Pó Liofilizado Para Solução Injetável', 'Solução Injetável', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604320167' OR LOWER(name) = LOWER('Vedolizumabe 300 mg Pó Liofilizado Para Solução Injetável')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604320175', 'Baricitinibe 2mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604320175' OR LOWER(name) = LOWER('Baricitinibe 2mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604320183', 'Baricitinibe 4mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604320183' OR LOWER(name) = LOWER('Baricitinibe 4mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604320191', 'Upadacitinibe 15 mg (por Comprimido Revestido De Liberação Prolongada)', 'Comprimido de Liberação Prolongada', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604320191' OR LOWER(name) = LOWER('Upadacitinibe 15 mg (por Comprimido Revestido De Liberação Prolongada)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604320205', 'Alentuzumabe 10 mg/mL Solução Injetável (frasco-Ampola Contendo 1,2 mL)', 'Solução Injetável em frasco-ampola', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604320205' OR LOWER(name) = LOWER('Alentuzumabe 10 mg/mL Solução Injetável (frasco-Ampola Contendo 1,2 mL)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604320213', 'Eculizumabe 10 mg/mL Solução Injetável (frasco Com 30 mL)', 'Solução Injetável em frasco-ampola', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604320213' OR LOWER(name) = LOWER('Eculizumabe 10 mg/mL Solução Injetável (frasco Com 30 mL)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604320221', 'Cladribina 10 mg (comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604320221' OR LOWER(name) = LOWER('Cladribina 10 mg (comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604330014', 'Iloprosta 10 mcg/mL Solução Para Nebulização (ampola De 1 mL)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604330014' OR LOWER(name) = LOWER('Iloprosta 10 mcg/mL Solução Para Nebulização (ampola De 1 mL)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604330022', 'Clopidogrel 75 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604330022' OR LOWER(name) = LOWER('Clopidogrel 75 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604330030', 'Selexipague 200 mcg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604330030' OR LOWER(name) = LOWER('Selexipague 200 mcg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604330049', 'Selexipague 400 mcg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604330049' OR LOWER(name) = LOWER('Selexipague 400 mcg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604330057', 'Selexipague 600 mcg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604330057' OR LOWER(name) = LOWER('Selexipague 600 mcg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604330065', 'Selexipague 800 mcg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604330065' OR LOWER(name) = LOWER('Selexipague 800 mcg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604330073', 'Selexipague 1000 mcg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604330073' OR LOWER(name) = LOWER('Selexipague 1000 mcg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604330081', 'Selexipague 1200 mcg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604330081' OR LOWER(name) = LOWER('Selexipague 1200 mcg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604330090', 'Selexipague 1400 mcg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604330090' OR LOWER(name) = LOWER('Selexipague 1400 mcg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604330103', 'Selexipague 1600 mcg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604330103' OR LOWER(name) = LOWER('Selexipague 1600 mcg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604330111', 'Selexipague 200 mcg(titulação De Dose) (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604330111' OR LOWER(name) = LOWER('Selexipague 200 mcg(titulação De Dose) (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604330120', 'Selexipague 800 mcg (titulação De Dose) ( Por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604330120' OR LOWER(name) = LOWER('Selexipague 800 mcg (titulação De Dose) ( Por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604340010', 'Ciclosporina 10 mg (por Capsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604340010' OR LOWER(name) = LOWER('Ciclosporina 10 mg (por Capsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604340028', 'Ciclosporina 25 mg (por Capsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604340028' OR LOWER(name) = LOWER('Ciclosporina 25 mg (por Capsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604340036', 'Ciclosporina 50 mg (por Capsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604340036' OR LOWER(name) = LOWER('Ciclosporina 50 mg (por Capsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604340044', 'Ciclosporina 100 mg (por Capsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604340044' OR LOWER(name) = LOWER('Ciclosporina 100 mg (por Capsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604340052', 'Ciclosporina 100 mg/mL Solucao Oral (por Frasco De 50 mL)', 'Solução Oral', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604340052' OR LOWER(name) = LOWER('Ciclosporina 100 mg/mL Solucao Oral (por Frasco De 50 mL)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604340060', 'Tacrolimo 1 mg (por Capsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604340060' OR LOWER(name) = LOWER('Tacrolimo 1 mg (por Capsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604340079', 'Tacrolimo 5 mg (por Capsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604340079' OR LOWER(name) = LOWER('Tacrolimo 5 mg (por Capsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604340087', 'Tacrolimo 0,3 mg/g Pomada Dermatológica (10 g)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604340087' OR LOWER(name) = LOWER('Tacrolimo 0,3 mg/g Pomada Dermatológica (10 g)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604340095', 'Tacrolimo 0,3 mg/g Pomada Dermatológica (30 g)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604340095' OR LOWER(name) = LOWER('Tacrolimo 0,3 mg/g Pomada Dermatológica (30 g)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604340109', 'Tacrolimo 1 mg/g Pomada Dermatológica (10 g)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604340109' OR LOWER(name) = LOWER('Tacrolimo 1 mg/g Pomada Dermatológica (10 g)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604340117', 'Tacrolimo 1 mg/g Pomada Dermatológica (30 g)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604340117' OR LOWER(name) = LOWER('Tacrolimo 1 mg/g Pomada Dermatológica (30 g)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604350015', 'Sildenafila 20 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604350015' OR LOWER(name) = LOWER('Sildenafila 20 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604350023', 'Sildenafila 25 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604350023' OR LOWER(name) = LOWER('Sildenafila 25 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604350031', 'Sildenafila 50 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604350031' OR LOWER(name) = LOWER('Sildenafila 50 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604360010', 'Atorvastatina 10 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604360010' OR LOWER(name) = LOWER('Atorvastatina 10 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604360029', 'Atorvastatina 20 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604360029' OR LOWER(name) = LOWER('Atorvastatina 20 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604360037', 'Atorvastatina 40 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604360037' OR LOWER(name) = LOWER('Atorvastatina 40 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604360045', 'Atorvastatina 80 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604360045' OR LOWER(name) = LOWER('Atorvastatina 80 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604360053', 'Fluvastatina 20 mg (por Capsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604360053' OR LOWER(name) = LOWER('Fluvastatina 20 mg (por Capsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604360061', 'Fluvastatina 40 mg (por Capsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604360061' OR LOWER(name) = LOWER('Fluvastatina 40 mg (por Capsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604360070', 'Lovastatina 10 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604360070' OR LOWER(name) = LOWER('Lovastatina 10 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604360088', 'Lovastatina 20 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604360088' OR LOWER(name) = LOWER('Lovastatina 20 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604360096', 'Lovastatina 40 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604360096' OR LOWER(name) = LOWER('Lovastatina 40 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604360100', 'Pravastatina 10 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604360100' OR LOWER(name) = LOWER('Pravastatina 10 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604360118', 'Pravastatina 20mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604360118' OR LOWER(name) = LOWER('Pravastatina 20mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604360126', 'Pravastatina 40 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604360126' OR LOWER(name) = LOWER('Pravastatina 40 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604370016', 'Selegilina 5 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604370016' OR LOWER(name) = LOWER('Selegilina 5 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604370024', 'Selegilina 10 mg (por Dragea Ou Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604370024' OR LOWER(name) = LOWER('Selegilina 10 mg (por Dragea Ou Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604370032', 'Rasagilina 1 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604370032' OR LOWER(name) = LOWER('Rasagilina 1 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604380011', 'Adalimumabe 40 mg Injetavel (por Seringa Preenchida)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604380011' OR LOWER(name) = LOWER('Adalimumabe 40 mg Injetavel (por Seringa Preenchida)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604380020', 'Etanercepte 25 mg Injetável (por Frasco-Ampola Ou Seringa Preenchida)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604380020' OR LOWER(name) = LOWER('Etanercepte 25 mg Injetável (por Frasco-Ampola Ou Seringa Preenchida)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604380038', 'Etanercepte 50mg Injetavel (por Frasco-Ampola Ou Seringa Preenchida)(originador)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604380038' OR LOWER(name) = LOWER('Etanercepte 50mg Injetavel (por Frasco-Ampola Ou Seringa Preenchida)(originador)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604380046', 'Infliximabe 10 mg/mL Injetavel (por Frasco-Ampola Com 10 mL)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604380046' OR LOWER(name) = LOWER('Infliximabe 10 mg/mL Injetavel (por Frasco-Ampola Com 10 mL)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604380054', 'Infliximabe 10 mg/mL Injetavel (por Frasco-Ampola Com 10 mL)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604380054' OR LOWER(name) = LOWER('Infliximabe 10 mg/mL Injetavel (por Frasco-Ampola Com 10 mL)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604380062', 'Adalimumabe 40 mg Injetável (por Seringa Preenchida)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604380062' OR LOWER(name) = LOWER('Adalimumabe 40 mg Injetável (por Seringa Preenchida)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604380070', 'Certolizumabe Pegol 200 mg/mL Injetável (por Seringa Preenchida)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604380070' OR LOWER(name) = LOWER('Certolizumabe Pegol 200 mg/mL Injetável (por Seringa Preenchida)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604380089', 'Golimumabe 50 mg Injetável (por Seringa Preenchida', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604380089' OR LOWER(name) = LOWER('Golimumabe 50 mg Injetável (por Seringa Preenchida')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604380097', 'Adalimumabe 40 mg Injetável (frasco Ampola)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604380097' OR LOWER(name) = LOWER('Adalimumabe 40 mg Injetável (frasco Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604380100', 'Etanercepte 50 mg Injetável (por Frasco-Ampola Ou Seringa Preenchida)(biossimilar A)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604380100' OR LOWER(name) = LOWER('Etanercepte 50 mg Injetável (por Frasco-Ampola Ou Seringa Preenchida)(biossimilar A)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604380119', 'Infliximabe 10 mg /ml Injetável (por Frasco-Ampola Com 10 mL) (biossimilar A)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604380119' OR LOWER(name) = LOWER('Infliximabe 10 mg /ml Injetável (por Frasco-Ampola Com 10 mL) (biossimilar A)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604380127', 'Adalimumabe 40 mg Injetável ( Por Seringa Preenchida)( Biossimilar A)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604380127' OR LOWER(name) = LOWER('Adalimumabe 40 mg Injetável ( Por Seringa Preenchida)( Biossimilar A)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604380135', 'Adalimumabe 40 mg Injetável (por Seringa Preenchida) (biossimilar B)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604380135' OR LOWER(name) = LOWER('Adalimumabe 40 mg Injetável (por Seringa Preenchida) (biossimilar B)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604380143', 'Adalimumabe 40 mg Injetável (por Seringa Preenchida) (biossimilar C)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604380143' OR LOWER(name) = LOWER('Adalimumabe 40 mg Injetável (por Seringa Preenchida) (biossimilar C)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604390017', 'Alfainterferona 2b 3.000.000 UI Injetavel (por Frasco-Ampola)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604390017' OR LOWER(name) = LOWER('Alfainterferona 2b 3.000.000 UI Injetavel (por Frasco-Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604390025', 'Alfainterferona 2b 5.000.000 UI Injetavel (por Frasco-Ampola)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604390025' OR LOWER(name) = LOWER('Alfainterferona 2b 5.000.000 UI Injetavel (por Frasco-Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604390033', 'Alfainterferona 2b 10.000.000 UI Injetavel (por Frasco-Ampola)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604390033' OR LOWER(name) = LOWER('Alfainterferona 2b 10.000.000 UI Injetavel (por Frasco-Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604390084', 'Betainterferona 1a 6.000.000 UI (22 mcg) Injetavel (por Seringa Preenchida)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604390084' OR LOWER(name) = LOWER('Betainterferona 1a 6.000.000 UI (22 mcg) Injetavel (por Seringa Preenchida)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604390092', 'Betainterferona 1a 6.000.000 UI (30 mcg) Injetavel (por Frasco-Ampola, Seringa Preenchida Ou Caneta Preenchida)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604390092' OR LOWER(name) = LOWER('Betainterferona 1a 6.000.000 UI (30 mcg) Injetavel (por Frasco-Ampola, Seringa Preenchida Ou Caneta Preenchida)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604390106', 'Betainterferona 1a 12.000.000 UI (44 mcg) Injetavel (por Seringa Preenchida)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604390106' OR LOWER(name) = LOWER('Betainterferona 1a 12.000.000 UI (44 mcg) Injetavel (por Seringa Preenchida)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604390114', 'Betainterferona 1b 9.600.000 UI (300mcg) Injetavel (por Frasco-Ampola)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604390114' OR LOWER(name) = LOWER('Betainterferona 1b 9.600.000 UI (300mcg) Injetavel (por Frasco-Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604400012', 'Sevelamer 800 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604400012' OR LOWER(name) = LOWER('Sevelamer 800 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604410018', 'Metadona 5 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604410018' OR LOWER(name) = LOWER('Metadona 5 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604410026', 'Metadona 10 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604410026' OR LOWER(name) = LOWER('Metadona 10 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604410034', 'Metadona 10 mg/mL Injetavel (por Ampola De 1 mL)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604410034' OR LOWER(name) = LOWER('Metadona 10 mg/mL Injetavel (por Ampola De 1 mL)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604420013', 'Fludrocortisona 0,1 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604420013' OR LOWER(name) = LOWER('Fludrocortisona 0,1 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604430019', 'Raloxifeno 60 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604430019' OR LOWER(name) = LOWER('Raloxifeno 60 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604440014', 'Alfadornase 2,5 mg (por Ampola)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604440014' OR LOWER(name) = LOWER('Alfadornase 2,5 mg (por Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604470010', 'Alfaepoetina 1.000 UI Injetavel (por Frasco-Ampola)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604470010' OR LOWER(name) = LOWER('Alfaepoetina 1.000 UI Injetavel (por Frasco-Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604470029', 'Alfaepoetina 2.000 UI Injetavel (por Frasco-Ampola)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604470029' OR LOWER(name) = LOWER('Alfaepoetina 2.000 UI Injetavel (por Frasco-Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604470037', 'Alfaepoetina 3.000 UI Injetavel (por Frasco-Ampola)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604470037' OR LOWER(name) = LOWER('Alfaepoetina 3.000 UI Injetavel (por Frasco-Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604470045', 'Alfaepoetina 4.000 UI Injetavel (por Frasco-Ampola)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604470045' OR LOWER(name) = LOWER('Alfaepoetina 4.000 UI Injetavel (por Frasco-Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604470053', 'Alfaepoetina 10.000 UI Injetavel (por Frasco-Ampola)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604470053' OR LOWER(name) = LOWER('Alfaepoetina 10.000 UI Injetavel (por Frasco-Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604480016', 'Hidroxiureia 500 mg (por Capsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604480016' OR LOWER(name) = LOWER('Hidroxiureia 500 mg (por Capsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604480024', 'Hidroxiureia 100 mg (por Comprimido Revestido)', 'Comprimido Revestido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604480024' OR LOWER(name) = LOWER('Hidroxiureia 100 mg (por Comprimido Revestido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604490011', 'Entacapona 200 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604490011' OR LOWER(name) = LOWER('Entacapona 200 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604490020', 'Tolcapona 100 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604490020' OR LOWER(name) = LOWER('Tolcapona 100 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604500017', 'Gabapentina 300 mg (por Capsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604500017' OR LOWER(name) = LOWER('Gabapentina 300 mg (por Capsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604500025', 'Gabapentina 400 mg (por Capsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604500025' OR LOWER(name) = LOWER('Gabapentina 400 mg (por Capsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604500033', 'Lamotrigina 25 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604500033' OR LOWER(name) = LOWER('Lamotrigina 25 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604500041', 'Lamotrigina 50 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604500041' OR LOWER(name) = LOWER('Lamotrigina 50 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604500050', 'Lamotrigina 100 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604500050' OR LOWER(name) = LOWER('Lamotrigina 100 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604500068', 'Topiramato 25 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604500068' OR LOWER(name) = LOWER('Topiramato 25 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604500076', 'Topiramato 50 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604500076' OR LOWER(name) = LOWER('Topiramato 50 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604500084', 'Topiramato 100 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604500084' OR LOWER(name) = LOWER('Topiramato 100 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604500092', 'Levetiracetam 100 mg /ml Solução Oral (por Frasco De 150 mL)', 'Solução Oral', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604500092' OR LOWER(name) = LOWER('Levetiracetam 100 mg /ml Solução Oral (por Frasco De 150 mL)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604500106', 'Levetiracetam 250 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604500106' OR LOWER(name) = LOWER('Levetiracetam 250 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604500114', 'Levetiracetam 750 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604500114' OR LOWER(name) = LOWER('Levetiracetam 750 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604500122', 'Levetiracetam 100 mg/mL Solução Oral (por Frasco De 100 mL)', 'Solução Oral', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604500122' OR LOWER(name) = LOWER('Levetiracetam 100 mg/mL Solução Oral (por Frasco De 100 mL)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604500130', 'Levetiracetam 500 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604500130' OR LOWER(name) = LOWER('Levetiracetam 500 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604500149', 'Levetiracetam 1000 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604500149' OR LOWER(name) = LOWER('Levetiracetam 1000 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604510012', 'Risperidona 1 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604510012' OR LOWER(name) = LOWER('Risperidona 1 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604510020', 'Risperidona 2 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604510020' OR LOWER(name) = LOWER('Risperidona 2 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604510039', 'Risperidona 3 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604510039' OR LOWER(name) = LOWER('Risperidona 3 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604510047', 'Risperidona 1,0 mg/mL Solução Oral (por Frasco De 30 mL)', 'Solução Oral', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604510047' OR LOWER(name) = LOWER('Risperidona 1,0 mg/mL Solução Oral (por Frasco De 30 mL)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604520018', 'Glatiramer 20 mg Injetavel (por Seringa Preenchida )', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604520018' OR LOWER(name) = LOWER('Glatiramer 20 mg Injetavel (por Seringa Preenchida )')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604520026', 'Glatirâmer 40 mg Injetável (por Seringa Preenchida)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604520026' OR LOWER(name) = LOWER('Glatirâmer 40 mg Injetável (por Seringa Preenchida)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604530013', 'Azatioprina 50 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604530013' OR LOWER(name) = LOWER('Azatioprina 50 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604530021', 'Metotrexato 2,5 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604530021' OR LOWER(name) = LOWER('Metotrexato 2,5 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604530030', 'Metotrexato 25 mg/mL Injetavel (por Ampola De 2 mL)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604530030' OR LOWER(name) = LOWER('Metotrexato 25 mg/mL Injetavel (por Ampola De 2 mL)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604540019', 'Riluzol 50 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604540019' OR LOWER(name) = LOWER('Riluzol 50 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604540027', 'Fumarato De Dimetila 120 mg (por Cápsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604540027' OR LOWER(name) = LOWER('Fumarato De Dimetila 120 mg (por Cápsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604540035', 'Fumarato De Dimetila 240 mg (por Cápsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604540035' OR LOWER(name) = LOWER('Fumarato De Dimetila 240 mg (por Cápsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604540043', 'Teriflunomida 14 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604540043' OR LOWER(name) = LOWER('Teriflunomida 14 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604540060', 'Tafamidis 20 mg Cápsula', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604540060' OR LOWER(name) = LOWER('Tafamidis 20 mg Cápsula')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604540078', 'Memantina 10 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604540078' OR LOWER(name) = LOWER('Memantina 10 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604540086', 'Tafamidis 61 mg (por Cápsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604540086' OR LOWER(name) = LOWER('Tafamidis 61 mg (por Cápsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604550014', 'Toxina Botulinica Tipo A 100 U Injetavel (por Frasco-Ampola)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604550014' OR LOWER(name) = LOWER('Toxina Botulinica Tipo A 100 U Injetavel (por Frasco-Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604550022', 'Toxina Botulinica Tipo A 500 U Injetavel (por Frasco-Ampola)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604550022' OR LOWER(name) = LOWER('Toxina Botulinica Tipo A 500 U Injetavel (por Frasco-Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604560010', 'Penicilamina 250 mg (por Capsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604560010' OR LOWER(name) = LOWER('Penicilamina 250 mg (por Capsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604570015', 'Calcitonina 50 UI Injetavel (por Ampola)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604570015' OR LOWER(name) = LOWER('Calcitonina 50 UI Injetavel (por Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604570023', 'Calcitonina 100 UI Injetavel (por Ampola)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604570023' OR LOWER(name) = LOWER('Calcitonina 100 UI Injetavel (por Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604570031', 'Calcitonina 200 UI/Dose Spray Nasal (por Frasco)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604570031' OR LOWER(name) = LOWER('Calcitonina 200 UI/Dose Spray Nasal (por Frasco)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604580010', 'Pancreatina 10.000 UI (por Capsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604580010' OR LOWER(name) = LOWER('Pancreatina 10.000 UI (por Capsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604580029', 'Pancreatina 25000 UI (por Capsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604580029' OR LOWER(name) = LOWER('Pancreatina 25000 UI (por Capsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604590016', 'Isotretinoina 10 mg (por Capsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604590016' OR LOWER(name) = LOWER('Isotretinoina 10 mg (por Capsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604590024', 'Isotretinoina 20 mg (por Capsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604590024' OR LOWER(name) = LOWER('Isotretinoina 20 mg (por Capsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604600011', 'Acitretina 10 mg (por Capsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604600011' OR LOWER(name) = LOWER('Acitretina 10 mg (por Capsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604600020', 'Acitretina 25 mg (por Capsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604600020' OR LOWER(name) = LOWER('Acitretina 25 mg (por Capsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604610017', 'Somatropina 4 UI Injetável (por Frasco-Ampola)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604610017' OR LOWER(name) = LOWER('Somatropina 4 UI Injetável (por Frasco-Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604610025', 'Somatropina 12 UI Injetavel (por Frasco-Ampola)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604610025' OR LOWER(name) = LOWER('Somatropina 12 UI Injetavel (por Frasco-Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604610033', 'Somatropina 16ui Injetàvel (por Frasco Ampola)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604610033' OR LOWER(name) = LOWER('Somatropina 16ui Injetàvel (por Frasco Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604620012', 'Alfacalcidol 0,25 mcg (por Capsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604620012' OR LOWER(name) = LOWER('Alfacalcidol 0,25 mcg (por Capsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604620020', 'Alfacalcidol 1,0 mcg (por Capsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604620020' OR LOWER(name) = LOWER('Alfacalcidol 1,0 mcg (por Capsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604620039', 'Calcitriol 0,25 mcg (por Capsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604620039' OR LOWER(name) = LOWER('Calcitriol 0,25 mcg (por Capsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604620047', 'Calcitriol 1,0 mcg Injetavel (por Ampola)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604620047' OR LOWER(name) = LOWER('Calcitriol 1,0 mcg Injetavel (por Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604630018', 'Miglustate 100 mg (por Capsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604630018' OR LOWER(name) = LOWER('Miglustate 100 mg (por Capsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604630026', 'Biotina 2,5 mg Cápsula', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604630026' OR LOWER(name) = LOWER('Biotina 2,5 mg Cápsula')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604630034', 'Ácido Ursodesoxicólico 50 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604630034' OR LOWER(name) = LOWER('Ácido Ursodesoxicólico 50 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604630042', 'Ácido Ursodesoxicólico 150 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604630042' OR LOWER(name) = LOWER('Ácido Ursodesoxicólico 150 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604630050', 'Ácido Ursodesoxicólico 300 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604630050' OR LOWER(name) = LOWER('Ácido Ursodesoxicólico 300 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604630069', 'Sapropterina 100 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604630069' OR LOWER(name) = LOWER('Sapropterina 100 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604630077', 'Trientina 250 mg (por Cápsula)', 'Cápsula', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604630077' OR LOWER(name) = LOWER('Trientina 250 mg (por Cápsula)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604650019', 'Bimatoprosta 0,3 mg/mL Solução Oftálmica (por Frasco De 3 mL)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604650019' OR LOWER(name) = LOWER('Bimatoprosta 0,3 mg/mL Solução Oftálmica (por Frasco De 3 mL)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604650027', 'Latanoprosta 0,05 mg/mL Solução Oftálmica (por Frasco De 2,5 mL)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604650027' OR LOWER(name) = LOWER('Latanoprosta 0,05 mg/mL Solução Oftálmica (por Frasco De 2,5 mL)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604650035', 'Travoprosta 0,04 mg/mL Solução Oftálmica (por Frasco De 2,5 mL)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604650035' OR LOWER(name) = LOWER('Travoprosta 0,04 mg/mL Solução Oftálmica (por Frasco De 2,5 mL)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604660014', 'Brinzolamida 10 mg/mL Suspensão Oftálmica (por Frasco De 5 mL)', 'Suspensão', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604660014' OR LOWER(name) = LOWER('Brinzolamida 10 mg/mL Suspensão Oftálmica (por Frasco De 5 mL)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604660022', 'Dorzolamida 20 mg/mL Solução Oftálmica (por Frasco De 5 mL)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604660022' OR LOWER(name) = LOWER('Dorzolamida 20 mg/mL Solução Oftálmica (por Frasco De 5 mL)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604660030', 'Acetazolamida 250 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604660030' OR LOWER(name) = LOWER('Acetazolamida 250 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604670010', 'Brimonidina 2,0 mg/mL Solução Oftálmica (por Frasco De 5 mL)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604670010' OR LOWER(name) = LOWER('Brimonidina 2,0 mg/mL Solução Oftálmica (por Frasco De 5 mL)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604680023', 'Rituximabe 500 mg Injetável (por Frasco-Ampola De 50 mL) (originador)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604680023' OR LOWER(name) = LOWER('Rituximabe 500 mg Injetável (por Frasco-Ampola De 50 mL) (originador)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604680031', 'Rituximabe 500 mg Injetável (por Frasco- Ampola De 5o mL ) (biossimilar A)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604680031' OR LOWER(name) = LOWER('Rituximabe 500 mg Injetável (por Frasco- Ampola De 5o mL ) (biossimilar A)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604680040', 'Rituximabe 500 mg Injetável (por Frasco Ampola De 50 mL(biossimilar B)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604680040' OR LOWER(name) = LOWER('Rituximabe 500 mg Injetável (por Frasco Ampola De 50 mL(biossimilar B)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604680058', 'Rituximabe 100 mg Injetável (por Frasco-Ampola De 10 mL (originador)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604680058' OR LOWER(name) = LOWER('Rituximabe 100 mg Injetável (por Frasco-Ampola De 10 mL (originador)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604680066', 'Rituximabe 100 mg Injetável (por Frasco-Ampola De 10 mL (biosimilar A)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604680066' OR LOWER(name) = LOWER('Rituximabe 100 mg Injetável (por Frasco-Ampola De 10 mL (biosimilar A)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604680074', 'Rituximabe 100 mg Injetável (por Frasco-Ampola De 10 mL) (biossimilar B)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604680074' OR LOWER(name) = LOWER('Rituximabe 100 mg Injetável (por Frasco-Ampola De 10 mL) (biossimilar B)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604690010', 'Tocilizumabe 20 mg/mL Injetavel (por Frasco-Ampola De 4 mL)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604690010' OR LOWER(name) = LOWER('Tocilizumabe 20 mg/mL Injetavel (por Frasco-Ampola De 4 mL)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604690029', 'Secuquinumabe 150 mg/mL Solução Injetável (por Seringa Preenchida)', 'Solução Injetável em seringa preenchida', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604690029' OR LOWER(name) = LOWER('Secuquinumabe 150 mg/mL Solução Injetável (por Seringa Preenchida)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604690037', 'Ustequinumabe 45 mg/0,5ml Soluçâo Injetàvel (por Seringa Preenchida)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604690037' OR LOWER(name) = LOWER('Ustequinumabe 45 mg/0,5ml Soluçâo Injetàvel (por Seringa Preenchida)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604690053', 'Risanquizumabe 150 mg/mL Caneta Aplicadora Com 1 mL', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604690053' OR LOWER(name) = LOWER('Risanquizumabe 150 mg/mL Caneta Aplicadora Com 1 mL')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604690061', 'Ustequinumabe 45 mg/0,5ml Solução Injetável (por Seringa Preenchida) (biossimilar A)', 'Solução Injetável em seringa preenchida', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604690061' OR LOWER(name) = LOWER('Ustequinumabe 45 mg/0,5ml Solução Injetável (por Seringa Preenchida) (biossimilar A)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604700016', 'Calcipotriol 50 mcg/g Pomada (por Bisnaga De 30 g)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604700016' OR LOWER(name) = LOWER('Calcipotriol 50 mcg/g Pomada (por Bisnaga De 30 g)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604710011', 'Clobetasol 0,5 mg/g Creme (por Bisnaga De 30 g)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604710011' OR LOWER(name) = LOWER('Clobetasol 0,5 mg/g Creme (por Bisnaga De 30 g)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604710020', 'Clobetasol 0,5 mg/g Solução Capilar (por Frasco De 50 g)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604710020' OR LOWER(name) = LOWER('Clobetasol 0,5 mg/g Solução Capilar (por Frasco De 50 g)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604710038', 'Furoato De Mometasona Creme Ou Pomada Dermatológica De 1 mg/g', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604710038' OR LOWER(name) = LOWER('Furoato De Mometasona Creme Ou Pomada Dermatológica De 1 mg/g')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604720017', 'Naproxeno 250 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604720017' OR LOWER(name) = LOWER('Naproxeno 250 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604720025', 'Naproxeno 500 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604720025' OR LOWER(name) = LOWER('Naproxeno 500 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604730012', 'Pilocarpina 20 mg/mL Solução Oftálmica (por Frasco De 10 mL)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604730012' OR LOWER(name) = LOWER('Pilocarpina 20 mg/mL Solução Oftálmica (por Frasco De 10 mL)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604740018', 'Timolol 5,0 mg/mL Solução Oftálmica (por Frasco De 5 mL)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604740018' OR LOWER(name) = LOWER('Timolol 5,0 mg/mL Solução Oftálmica (por Frasco De 5 mL)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604750013', 'Ambrisentana 5mg (por Comprimido Revestido)', 'Comprimido Revestido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604750013' OR LOWER(name) = LOWER('Ambrisentana 5mg (por Comprimido Revestido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604750021', 'Ambrisentana 10mg (por Comprimido Revestido)', 'Comprimido Revestido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604750021' OR LOWER(name) = LOWER('Ambrisentana 10mg (por Comprimido Revestido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604750030', 'Bosentana 62,5mg (por Comprimido Revestido)', 'Comprimido Revestido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604750030' OR LOWER(name) = LOWER('Bosentana 62,5mg (por Comprimido Revestido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604750048', 'Bosentana 125mg (por Comrimido Revestido)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604750048' OR LOWER(name) = LOWER('Bosentana 125mg (por Comrimido Revestido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604770014', 'Cinacalcete 30 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604770014' OR LOWER(name) = LOWER('Cinacalcete 30 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604770022', 'Cinacalcete 60 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604770022' OR LOWER(name) = LOWER('Cinacalcete 60 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604770030', 'Paricalcitol 5,0 mcg/mL Solução Injetável (ampola Com 1 mL)', 'Solução Injetável', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604770030' OR LOWER(name) = LOWER('Paricalcitol 5,0 mcg/mL Solução Injetável (ampola Com 1 mL)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604780010', 'Insulina Análoga De Ação Rápida 100 UI/mL (tubetes Com Sistemas De Aplicação Reutilizável)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604780010' OR LOWER(name) = LOWER('Insulina Análoga De Ação Rápida 100 UI/mL (tubetes Com Sistemas De Aplicação Reutilizável)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604780036', 'Insulina Análoga De Ação Rápida 100 UI/mL (1b)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604780036' OR LOWER(name) = LOWER('Insulina Análoga De Ação Rápida 100 UI/mL (1b)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604780044', 'Insulina Análoga De Ação Rápida 100 UI/mL (sistema De Aplicação Descartavél)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604780044' OR LOWER(name) = LOWER('Insulina Análoga De Ação Rápida 100 UI/mL (sistema De Aplicação Descartavél)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604780052', 'Insulina Análoga De Ação Prolongada De 100 UI/mL', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604780052' OR LOWER(name) = LOWER('Insulina Análoga De Ação Prolongada De 100 UI/mL')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604780060', 'Insulina Análoga De Ação Prolongada 100 UI/mL (1b)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604780060' OR LOWER(name) = LOWER('Insulina Análoga De Ação Prolongada 100 UI/mL (1b)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604790015', 'Nusinersena 2,4mg/mL Solução Injetável (por Frasco Ampola De 5 mL)', 'Solução Injetável em frasco-ampola', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604790015' OR LOWER(name) = LOWER('Nusinersena 2,4mg/mL Solução Injetável (por Frasco Ampola De 5 mL)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604790023', 'Risdiplam 0,75 mg/mL Pó Para Soluçâo Oral (frasco 80 mL)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604790023' OR LOWER(name) = LOWER('Risdiplam 0,75 mg/mL Pó Para Soluçâo Oral (frasco 80 mL)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604800010', 'Enoxaparina Sódica 40 mg/0,4 mL Solução Injetável (por Seringa Preenchida)', 'Solução Injetável em seringa preenchida', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604800010' OR LOWER(name) = LOWER('Enoxaparina Sódica 40 mg/0,4 mL Solução Injetável (por Seringa Preenchida)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604800029', 'Enoxaparina Sódica 60 mg/0,6 mL Solução Injetável (por Seringa Preenchida)', 'Solução Injetável em seringa preenchida', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604800029' OR LOWER(name) = LOWER('Enoxaparina Sódica 60 mg/0,6 mL Solução Injetável (por Seringa Preenchida)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604810016', 'Tobramicina 300mg/5 mL Solução Inalatória (por Ampola)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604810016' OR LOWER(name) = LOWER('Tobramicina 300mg/5 mL Solução Inalatória (por Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604820011', 'Dapagliflozina 10 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604820011' OR LOWER(name) = LOWER('Dapagliflozina 10 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604830017', 'Sacubitril Valsartana Sódica Hidratada 50 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604830017' OR LOWER(name) = LOWER('Sacubitril Valsartana Sódica Hidratada 50 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604830025', 'Sacubitril Valsartana Sódica Hidratada 100 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604830025' OR LOWER(name) = LOWER('Sacubitril Valsartana Sódica Hidratada 100 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604830033', 'Sacubitril Valsartana Sódica Hidratada 200 mg (por Comprimido)', 'Comprimido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604830033' OR LOWER(name) = LOWER('Sacubitril Valsartana Sódica Hidratada 200 mg (por Comprimido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604840012', 'Omalizumabe 150mg Solução Injetável', 'Solução Injetável', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604840012' OR LOWER(name) = LOWER('Omalizumabe 150mg Solução Injetável')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604840020', 'Mepolizumabe 100 mg/mL Solução Injetável', 'Solução Injetável', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604840020' OR LOWER(name) = LOWER('Mepolizumabe 100 mg/mL Solução Injetável')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604840063', 'Benralizumabe 30 mg/mL Solução Injetável (por Seringa Preenchida)', 'Solução Injetável em seringa preenchida', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604840063' OR LOWER(name) = LOWER('Benralizumabe 30 mg/mL Solução Injetável (por Seringa Preenchida)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604840071', 'Omalizumabe 75 mg Solução Injetável', 'Solução Injetável', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604840071' OR LOWER(name) = LOWER('Omalizumabe 75 mg Solução Injetável')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604840098', 'Mepolizumabe 40 mg/0,4 mL Solução Injetável', 'Solução Injetável', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604840098' OR LOWER(name) = LOWER('Mepolizumabe 40 mg/0,4 mL Solução Injetável')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604850018', 'Brometo De Umeclidínio 62,5 mcg + Trifenatato De Vilanterol 25 mcg (pó Inalante)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604850018' OR LOWER(name) = LOWER('Brometo De Umeclidínio 62,5 mcg + Trifenatato De Vilanterol 25 mcg (pó Inalante)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604850026', 'Brometo De Tiotrópio Monoidratado 2,5 mcg + Cloridrato De Olodaterol 2,5 mcg (solução Para Inalação Oral))', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604850026' OR LOWER(name) = LOWER('Brometo De Tiotrópio Monoidratado 2,5 mcg + Cloridrato De Olodaterol 2,5 mcg (solução Para Inalação Oral))')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604850034', 'Dipropionato De Beclometasona + Fumarato De Formoterol Di-Hidratado + Brometo De Glicopirrônio (solução Aerossol Contendo 120 Doses Para Inalação Oral De 100 mcg+6mcg+12,5mcg)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604850034' OR LOWER(name) = LOWER('Dipropionato De Beclometasona + Fumarato De Formoterol Di-Hidratado + Brometo De Glicopirrônio (solução Aerossol Contendo 120 Doses Para Inalação Oral De 100 mcg+6mcg+12,5mcg)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604850042', 'Furoato De Fluticasona + Brometo De Umeclidínio + Trifenatato De Vilanterol (pó Para Inalação Oral Contendo 30 Doses Para Inalação Oral De 100 mcg + 62,5 mcg + 25 mcg)', 'Forma farmacêutica padronizada CEAF', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604850042' OR LOWER(name) = LOWER('Furoato De Fluticasona + Brometo De Umeclidínio + Trifenatato De Vilanterol (pó Para Inalação Oral Contendo 30 Doses Para Inalação Oral De 100 mcg + 62,5 mcg + 25 mcg)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604860013', 'Ivacaftor 150 mg (por Comprimido Revestido)', 'Comprimido Revestido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604860013' OR LOWER(name) = LOWER('Ivacaftor 150 mg (por Comprimido Revestido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604860021', 'Elexacaftor 100 mg/Tezacaftor 50 mg/Ivacaftor 75 mg + Ivacaftor 150 mg (por Comprimido Revestido)', 'Comprimido Revestido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604860021' OR LOWER(name) = LOWER('Elexacaftor 100 mg/Tezacaftor 50 mg/Ivacaftor 75 mg + Ivacaftor 150 mg (por Comprimido Revestido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604860030', 'Elexacaftor 50 mg/Tezacaftor 25mg/Ivacaftor 37,5 mg+ivacaftor 75 mg (por Comprimido Revestido)', 'Comprimido Revestido', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604860030' OR LOWER(name) = LOWER('Elexacaftor 50 mg/Tezacaftor 25mg/Ivacaftor 37,5 mg+ivacaftor 75 mg (por Comprimido Revestido)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604870019', 'Burosumabe 10 mg/Mlsolução Injetável (frasco-Ampola)', 'Solução Injetável em frasco-ampola', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604870019' OR LOWER(name) = LOWER('Burosumabe 10 mg/Mlsolução Injetável (frasco-Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604870027', 'Burosumabe 20 mg /ml Solução Injetável (frasco- Ampola)', 'Solução Injetável em frasco-ampola', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604870027' OR LOWER(name) = LOWER('Burosumabe 20 mg /ml Solução Injetável (frasco- Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604870035', 'Burosumabe 30 mg /ml Solução Injetável (frasco- Ampola)', 'Solução Injetável em frasco-ampola', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604870035' OR LOWER(name) = LOWER('Burosumabe 30 mg /ml Solução Injetável (frasco- Ampola)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604870043', 'Romosozumabe 90 mg/mL Solução Injetável (por Seringa Preenchida De 1,17 mL)', 'Solução Injetável em seringa preenchida', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604870043' OR LOWER(name) = LOWER('Romosozumabe 90 mg/mL Solução Injetável (por Seringa Preenchida De 1,17 mL)')
);
INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '0604880014', 'Romiplostim 250 mcg Pó Para Solução Injetável (por Frasco)', 'Solução Injetável em frasco-ampola', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '0604880014' OR LOWER(name) = LOWER('Romiplostim 250 mcg Pó Para Solução Injetável (por Frasco)')
);
