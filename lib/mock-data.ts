// ==============================================================================
// CIMBAHIA - CENTRAL INTEGRADA DE REGULAÇÃO E PARECERES FARMACÊUTICOS DA BAHIA
// Dados Iniciais e Estrutura Institucional
// ==============================================================================

import {
  Unit,
  Profile,
  CID,
  Medication,
  OtherMedication,
  TipoParecer,
  Patient,
  Consultation,
  MonthlyComplementaryData,
  Origem,
  Dires,
  Nucleo,
  BaseRegional,
  Municipio,
  Processo,
} from "./types";

// ------------------------------------------------------------------------------
// 1. ESTRUTURA TERRITORIAL & FEDERATIVA DA BAHIA
// ------------------------------------------------------------------------------

export const INITIAL_ORIGENS: Origem[] = [
  { id: "orig-1", name: "Secretaria Municipal de Saúde (SMS)", sigla: "SMS", description: "Demandas originadas pelas secretarias municipais de saúde da Bahia", active: true },
  { id: "orig-2", name: "Defensoria Pública do Estado da Bahia", sigla: "DPE-BA", description: "Atendimento pré-processual ou pedidos de conciliação de saúde", active: true },
  { id: "orig-3", name: "Tribunal de Justiça da Bahia / Mandado Judicial", sigla: "TJ-BA", description: "Determinações judiciais de fornecimento de medicamentos", active: true },
  { id: "orig-4", name: "Ouvidoria Geral do SUS / Bahia", sigla: "OUV-SUS", description: "Reclamações, solicitações e reavaliações protocoladas via Ouvidoria", active: true },
  { id: "orig-5", name: "Consórcio Interfederativo de Saúde (CIM)", sigla: "CIM", description: "Políticas e pareceres no âmbito dos consórcios interfederativos", active: true },
  { id: "orig-6", name: "Ministério Público do Estado da Bahia", sigla: "MP-BA", description: "Procedimentos preparatórios e termos de ajustamento de conduta", active: true },
];

import {
  INITIAL_BAHIA_MUNICIPIOS,
  OFFICIAL_BAHIA_UNITS,
  BAHIA_NRS,
  BAHIA_BRS,
} from "./territory-data";

export const INITIAL_NUCLEOS: Nucleo[] = BAHIA_NRS.map((n) => ({
  id: n.id,
  code: n.code,
  name: n.name,
  macroregion: n.macroregion,
  active: true,
}));

export const INITIAL_DIRES: Dires[] = [
  { id: "dires-1", code: "1ª DIRES", name: "1ª Diretoria Regional de Saúde - Salvador", region: "Leste", active: true },
  { id: "dires-2", code: "2ª DIRES", name: "2ª Diretoria Regional de Saúde - Feira de Santana", region: "Centro-Leste", active: true },
  { id: "dires-3", code: "3ª DIRES", name: "3ª Diretoria Regional de Saúde - Alagoinhas", region: "Nordeste", active: true },
  { id: "dires-4", code: "4ª DIRES", name: "4ª Diretoria Regional de Saúde - Santo Antônio de Jesus", region: "Recôncavo", active: true },
  { id: "dires-14", code: "14ª DIRES", name: "14ª Diretoria Regional de Saúde - Juazeiro", region: "Norte", active: true },
  { id: "dires-20", code: "20ª DIRES", name: "20ª Diretoria Regional de Saúde - Vitória da Conquista", region: "Sudoeste", active: true },
];

export const INITIAL_BASES: BaseRegional[] = BAHIA_BRS.map((b) => {
  const nrsItem = BAHIA_NRS.find((n) => n.name === b.nrs);
  return {
    id: b.id,
    name: b.name,
    nucleo_id: nrsItem?.id || "nrs-1",
    active: true,
  };
});

export const INITIAL_MUNICIPIOS: Municipio[] = INITIAL_BAHIA_MUNICIPIOS;

export const INITIAL_UNITS: Unit[] = OFFICIAL_BAHIA_UNITS;

export const INITIAL_PROFILES: Profile[] = [
  {
    id: "22222222-0000-0000-0000-000000000002",
    full_name: "Dr. Rodrigo Sampaio",
    email: "rodrigo.sampaio@saude.ba.gov.br",
    crf: "CRF-BA 6120",
    phone: "(71) 99988-1122",
    unit_id: null,
    role: "admin", // gestor geral
    active: true,
  },
  {
    id: "11111111-0000-0000-0000-000000000001",
    full_name: "Dra. Juliana Mendes",
    email: "juliana.mendes@saude.ba.gov.br",
    crf: "CRF-BA 8421",
    phone: "(75) 98822-1010",
    unit_id: "11111111-1111-1111-1111-111111111111",
    role: "pharmacist", // parecerista
    active: true,
  },
  {
    id: "33333333-0000-0000-0000-000000000003",
    full_name: "Dra. Mariana Costa",
    email: "mariana.costa@saude.ba.gov.br",
    crf: "CRF-BA 9540",
    phone: "(74) 99122-3344",
    unit_id: "22222222-2222-2222-2222-222222222222",
    role: "pharmacist", // parecerista
    active: true,
  },
  {
    id: "44444444-0000-0000-0000-000000000004",
    full_name: "Carlos Eduardo Brandão",
    email: "carlos.brandao@saude.ba.gov.br",
    crf: null,
    phone: "(71) 3115-4220",
    unit_id: "55555555-5555-5555-5555-555555555555",
    role: "viewer", // administrativo / triagem
    active: true,
  },
];

// ------------------------------------------------------------------------------
// 2. CATÁLOGOS CLÍNICOS E DOMÍNIOS (CIDS, CEAF, OUTROS MEDICAMENTOS, PARECERES)
// ------------------------------------------------------------------------------

export const INITIAL_CIDS: CID[] = [
  { id: "cid-1", code: "M05.8", description: "Outras artrites reumatoides soropositivas", chapter: "Doenças do sistema osteomuscular", group_name: "Artroplastias e artropatias", active: true },
  { id: "cid-2", code: "M06.0", description: "Artrite reumatoide soronegativa", chapter: "Doenças do sistema osteomuscular", group_name: "Artrites reumatoides", active: true },
  { id: "cid-3", code: "M45", description: "Espondilite ancilosante", chapter: "Doenças do sistema osteomuscular", group_name: "Espondilopatias", active: true },
  { id: "cid-4", code: "M32.1", description: "Lúpus eritematoso sistêmico com comprometimento de órgãos", chapter: "Doenças do sistema osteomuscular", group_name: "Doenças sistêmicas do tecido conjuntivo", active: true },
  { id: "cid-5", code: "L40.0", description: "Psoríase vulgar", chapter: "Doenças da pele", group_name: "Psoríase", active: true },
  { id: "cid-6", code: "L40.5", description: "Artropatia psoriásica", chapter: "Doenças da pele", group_name: "Psoríase", active: true },
  { id: "cid-7", code: "K50.0", description: "Doença de Crohn do intestino delgado", chapter: "Doenças do aparelho digestivo", group_name: "Enterite e colite não infecciosas", active: true },
  { id: "cid-8", code: "K50.1", description: "Doença de Crohn do intestino grosso (cólon)", chapter: "Doenças do aparelho digestivo", group_name: "Enterite e colite não infecciosas", active: true },
  { id: "cid-9", code: "K51.0", description: "Pancolite ulcerativa (Retocolite Ulcerativa)", chapter: "Doenças do aparelho digestivo", group_name: "Colite ulcerativa", active: true },
  { id: "cid-10", code: "G35", description: "Esclerose múltipla", chapter: "Doenças do sistema nervoso", group_name: "Doenças desmielinizantes", active: true },
  { id: "cid-11", code: "G20", description: "Doença de Parkinson", chapter: "Doenças do sistema nervoso", group_name: "Transtornos extrapiramidais", active: true },
  { id: "cid-12", code: "G31.8", description: "Doença de Alzheimer (Outras degenerações especificadas)", chapter: "Doenças do sistema nervoso", group_name: "Degenerações do sistema nervoso", active: true },
  { id: "cid-13", code: "E10.9", description: "Diabetes mellitus insulino-dependente sem complicações", chapter: "Doenças endócrinas", group_name: "Diabetes mellitus", active: true },
  { id: "cid-14", code: "E23.0", description: "Hipopituitarismo / Deficiência do hormônio de crescimento (GH)", chapter: "Doenças endócrinas", group_name: "Transtornos da hipófise", active: true },
  { id: "cid-15", code: "B18.1", description: "Hepatite crônica viral B sem agente Delta", chapter: "Doenças infecciosas", group_name: "Hepatites virais", active: true },
  { id: "cid-16", code: "B18.2", description: "Hepatite viral crônica C", chapter: "Doenças infecciosas", group_name: "Hepatites virais", active: true },
  { id: "cid-17", code: "N18.0", description: "Doença renal crônica estágio terminal (DRC)", chapter: "Doenças do aparelho geniturinário", group_name: "Insuficiência renal", active: true },
  { id: "cid-18", code: "D59.5", description: "Hemoglobinúria paroxística noturna (HPN)", chapter: "Doenças do sangue", group_name: "Anemias hemolíticas", active: true },
  { id: "cid-19", code: "D61.9", description: "Aplasia medular não especificada", chapter: "Doenças do sangue", group_name: "Outras anemias aplásticas", active: true },
  { id: "cid-20", code: "M81.0", description: "Osteoporose pós-menopausa com alto risco de fratura", chapter: "Doenças do sistema osteomuscular", group_name: "Transtornos da densidade óssea", active: true },
  { id: "cid-21", code: "E84.0", description: "Fibrose cística com manifestações pulmonares", chapter: "Doenças endócrinas e metabólicas", group_name: "Fibrose cística", active: true },
  { id: "cid-22", code: "I27.0", description: "Hipertensão pulmonar primária", chapter: "Doenças do aparelho circulatório", group_name: "Outras formas de doença cardíaca pulmonar", active: true },
];

export const INITIAL_MEDICATIONS: Medication[] = [
  { id: "med-1", sigtap_code: "0604380014", name: "Adalimumabe 40mg/0,8mL", pharmaceutical_form: "Solução Injetável em seringa preenchida", component: "CEAF Grupo 1A", active: true, compatible_cid_codes: ["M05.8", "M06.0", "M45", "L40.0", "L40.5", "K50.0", "K50.1", "K51.0"] },
  { id: "med-2", sigtap_code: "0604320011", name: "Infliximabe 100mg", pharmaceutical_form: "Pó liofilizado para solução injetável", component: "CEAF Grupo 1A", active: true, compatible_cid_codes: ["K50.0", "K50.1", "K51.0", "M05.8", "L40.0"] },
  { id: "med-3", sigtap_code: "0604380022", name: "Etanercepte 50mg", pharmaceutical_form: "Solução Injetável em caneta aplicadora", component: "CEAF Grupo 1A", active: true, compatible_cid_codes: ["M05.8", "M45", "L40.0", "L40.5"] },
  { id: "med-4", sigtap_code: "0604470013", name: "Golimumabe 50mg/0,5mL", pharmaceutical_form: "Solução Injetável em caneta aplicadora", component: "CEAF Grupo 1A", active: true, compatible_cid_codes: ["M05.8", "M45", "K51.0"] },
  { id: "med-5", sigtap_code: "0604380030", name: "Certolizumabe Pegol 200mg", pharmaceutical_form: "Solução Injetável em seringa preenchida", component: "CEAF Grupo 1A", active: true, compatible_cid_codes: ["M05.8", "M45", "L40.5"] },
  { id: "med-6", sigtap_code: "0604380049", name: "Secuquinumabe 150mg", pharmaceutical_form: "Solução Injetável em caneta preenchida", component: "CEAF Grupo 1A", active: true, compatible_cid_codes: ["L40.0", "L40.5", "M45"] },
  { id: "med-7", sigtap_code: "0604530016", name: "Ustequinumabe 45mg/0,5mL", pharmaceutical_form: "Solução Injetável em frasco-ampola", component: "CEAF Grupo 1A", active: true, compatible_cid_codes: ["L40.0", "K50.0", "K50.1"] },
  { id: "med-8", sigtap_code: "0604720029", name: "Rituximabe 500mg/50mL", pharmaceutical_form: "Solução para diluição para infusão", component: "CEAF Grupo 1A", active: true, compatible_cid_codes: ["M05.8", "M32.1"] },
  { id: "med-9", sigtap_code: "0604720010", name: "Tocilizumabe 20mg/mL", pharmaceutical_form: "Solução para infusão (frasco 4mL/10mL/20mL)", component: "CEAF Grupo 1A", active: true, compatible_cid_codes: ["M05.8"] },
  { id: "med-10", sigtap_code: "0604610010", name: "Baricitinibe 2mg / 4mg", pharmaceutical_form: "Comprimido Revestido", component: "CEAF Grupo 1A", active: true, compatible_cid_codes: ["M05.8"] },
  { id: "med-11", sigtap_code: "0604620015", name: "Tofacitinibe 5mg", pharmaceutical_form: "Comprimido Revestido", component: "CEAF Grupo 1A", active: true, compatible_cid_codes: ["M05.8", "L40.5", "K51.0"] },
  { id: "med-12", sigtap_code: "0604620023", name: "Upadacitinibe 15mg", pharmaceutical_form: "Comprimido de Liberação Prolongada", component: "CEAF Grupo 1A", active: true, compatible_cid_codes: ["M05.8", "M45", "L40.0"] },
  { id: "med-13", sigtap_code: "0604410010", name: "Fingolimode 0,5mg", pharmaceutical_form: "Cápsula gelatinosa", component: "CEAF Grupo 1B", active: true, compatible_cid_codes: ["G35"] },
  { id: "med-14", sigtap_code: "0604430011", name: "Natalizumabe 300mg/15mL", pharmaceutical_form: "Solução concentrada para infusão", component: "CEAF Grupo 1A", active: true, compatible_cid_codes: ["G35"] },
  { id: "med-15", sigtap_code: "0604750016", name: "Ocrelizumabe 300mg/10mL", pharmaceutical_form: "Solução concentrada para infusão", component: "CEAF Grupo 1A", active: true, compatible_cid_codes: ["G35"] },
  { id: "med-16", sigtap_code: "0604420016", name: "Acetato de Glatirâmer 40mg/mL", pharmaceutical_form: "Solução Injetável em seringa preenchida", component: "CEAF Grupo 1B", active: true, compatible_cid_codes: ["G35"] },
  { id: "med-17", sigtap_code: "0604420024", name: "Betainterferona 1a 44mcg (12 MUI)", pharmaceutical_form: "Solução Injetável em seringa preenchida", component: "CEAF Grupo 1B", active: true, compatible_cid_codes: ["G35"] },
  { id: "med-18", sigtap_code: "0604270014", name: "Micofenolato de Mofetila 500mg", pharmaceutical_form: "Comprimido Revestido", component: "CEAF Grupo 1B", active: true, compatible_cid_codes: ["M32.1", "N18.0"] },
  { id: "med-19", sigtap_code: "0604290015", name: "Tacrolimo 1mg / 5mg", pharmaceutical_form: "Cápsula dura", component: "CEAF Grupo 1B", active: true, compatible_cid_codes: ["M32.1", "N18.0"] },
  { id: "med-20", sigtap_code: "0604010012", name: "Ciclosporina 50mg / 100mg", pharmaceutical_form: "Cápsula gelatinosa mole", component: "CEAF Grupo 1B", active: true, compatible_cid_codes: ["M32.1", "L40.0", "D61.9"] },
  { id: "med-21", sigtap_code: "0604020018", name: "Azatioprina 50mg", pharmaceutical_form: "Comprimido Revestido", component: "CEAF Grupo 2", active: true, compatible_cid_codes: ["M05.8", "M32.1", "K50.0", "K51.0"] },
  { id: "med-22", sigtap_code: "0604030013", name: "Metotrexato 2,5mg", pharmaceutical_form: "Comprimido", component: "CEAF Grupo 2", active: true, compatible_cid_codes: ["M05.8", "L40.0", "K50.0"] },
  { id: "med-23", sigtap_code: "0604030021", name: "Metotrexato 25mg/mL", pharmaceutical_form: "Solução Injetável em frasco-ampola", component: "CEAF Grupo 2", active: true, compatible_cid_codes: ["M05.8", "L40.0"] },
  { id: "med-24", sigtap_code: "0604050014", name: "Leflunomida 20mg", pharmaceutical_form: "Comprimido Revestido", component: "CEAF Grupo 2", active: true, compatible_cid_codes: ["M05.8", "L40.5"] },
  { id: "med-25", sigtap_code: "0604350018", name: "Somatropina 12 UI / 30 UI", pharmaceutical_form: "Pó liofilizado para solução injetável", component: "CEAF Grupo 1A", active: true, compatible_cid_codes: ["E23.0"] },
  { id: "med-26", sigtap_code: "0604040019", name: "Alfaepoetina 4.000 UI / 10.000 UI", pharmaceutical_form: "Solução Injetável em frasco-ampola", component: "CEAF Grupo 1A", active: true, compatible_cid_codes: ["N18.0", "D61.9"] },
  { id: "med-27", sigtap_code: "0604810019", name: "Denosumabe 60mg/mL", pharmaceutical_form: "Solução Injetável em seringa preenchida", component: "CEAF Grupo 1A", active: true, compatible_cid_codes: ["M81.0"] },
  { id: "med-28", sigtap_code: "0604810027", name: "Teriparatida 20mcg/dose", pharmaceutical_form: "Solução Injetável em caneta aplicadora descartável", component: "CEAF Grupo 1A", active: true, compatible_cid_codes: ["M81.0"] },
  { id: "med-29", sigtap_code: "0604850010", name: "Sofosbuvir 400mg + Velpatasvir 100mg", pharmaceutical_form: "Comprimido Revestido", component: "CEAF Grupo 1A", active: true, compatible_cid_codes: ["B18.2"] },
  { id: "med-30", sigtap_code: "0604850029", name: "Tenofovir Desoproxila 300mg", pharmaceutical_form: "Comprimido Revestido", component: "CEAF Grupo 1A", active: true, compatible_cid_codes: ["B18.1"] },
  { id: "med-31", sigtap_code: "0604100011", name: "Insulina Glargina 100 UI/mL", pharmaceutical_form: "Solução Injetável em refil/caneta", component: "CEAF Grupo 1A", active: true, compatible_cid_codes: ["E10.9"] },
  { id: "med-32", sigtap_code: "0604100020", name: "Insulina Degludeca 100 UI/mL", pharmaceutical_form: "Solução Injetável em caneta aplicadora", component: "CEAF Grupo 1A", active: true, compatible_cid_codes: ["E10.9"] },
  { id: "med-33", sigtap_code: "0604860016", name: "Rivaroxabana 20mg", pharmaceutical_form: "Comprimido Revestido", component: "CEAF Grupo 1B", active: true, compatible_cid_codes: ["I27.0"] },
  { id: "med-34", sigtap_code: "0604080015", name: "Hidroxicloroquina 400mg", pharmaceutical_form: "Comprimido Revestido", component: "CEAF Grupo 2", active: true, compatible_cid_codes: ["M05.8", "M32.1"] },
];

export const INITIAL_OTHER_MEDICATIONS: OtherMedication[] = [
  {
    id: "omed-1",
    name: "Canabidiol 200mg/mL (Solução Oral)",
    active_ingredient: "Canabidiol isolado",
    dosage: "200mg/mL (frasco 30mL)",
    pharmaceutical_form: "Solução Oral com seringa dosadora",
    anvisa_registry: "1.5568.0001.001-9",
    category: "Judicial",
    notes: "Indicação comum para encefalopatias epilépticas e Síndrome de Dravet/Lennox-Gastaut refratárias.",
    estimated_unit_cost: 2150.00,
    active: true,
  },
  {
    id: "omed-2",
    name: "Dupilumabe 300mg/2mL",
    active_ingredient: "Dupilumabe",
    dosage: "300mg/2mL (caneta preenchida)",
    pharmaceutical_form: "Solução Injetável",
    anvisa_registry: "1.0183.0165.001-2",
    category: "Não Padronizado no SUS",
    notes: "Dermatite atópica grave em pacientes com falha a imunossupressores tópicos e sistêmicos.",
    estimated_unit_cost: 4900.00,
    active: true,
  },
  {
    id: "omed-3",
    name: "Fórmula de Aminoácidos Livres (Pó 400g)",
    active_ingredient: "Aminoácidos livres isentos de proteína láctea",
    dosage: "Lata 400g",
    pharmaceutical_form: "Pó para reconstituição oral/enteral",
    anvisa_registry: "Dispensado de registro / RDC 240/2018",
    category: "Fórmula Nutricional",
    notes: "Alergia severa à proteína do leite de vaca (APLV) com anafilaxia ou falha a fórmulas extensamente hidrolisadas.",
    estimated_unit_cost: 280.00,
    active: true,
  },
  {
    id: "omed-4",
    name: "Nintedanibe 150mg",
    active_ingredient: "Ebesilato de Nintedanibe",
    dosage: "150mg",
    pharmaceutical_form: "Cápsula mole",
    anvisa_registry: "1.0367.0171.002-1",
    category: "Judicial",
    notes: "Fibrose Pulmonar Idiopática com declínio progressivo da capacidade vital forçada.",
    estimated_unit_cost: 8200.00,
    active: true,
  },
  {
    id: "omed-5",
    name: "Omalizumabe 150mg",
    active_ingredient: "Omalizumabe",
    dosage: "150mg frasco-ampola",
    pharmaceutical_form: "Pó liofilizado para solução injetável",
    anvisa_registry: "1.0068.1065.001-4",
    category: "Não Padronizado no SUS",
    notes: "Asma alérgica grave persistente ou Urticária Crônica Espontânea refratária a anti-histamínicos H1.",
    estimated_unit_cost: 2350.00,
    active: true,
  },
  {
    id: "omed-6",
    name: "Curativo com Prata Nanocristalina 10x10cm",
    active_ingredient: "Prata nanocristalina antimicrobiana",
    dosage: "10cm x 10cm",
    pharmaceutical_form: "Cobertura de barreira estéril",
    anvisa_registry: "8.0691.0001",
    category: "Insumo Especial",
    notes: "Tratamento de feridas complexas, úlceras venosas e lesões por pressão infectadas.",
    estimated_unit_cost: 95.00,
    active: true,
  },
];

export const INITIAL_TIPOS_PARECER: TipoParecer[] = [
  { id: "tp-1", code: "DEF-01", title: "Deferido Integralmente", regulatory_effect: "deferido", description: "Atende integralmente aos critérios clínicos, diagnósticos e documentais previstos no PCDT ou diretrizes técnicas vigentes.", active: true },
  { id: "tp-2", code: "DEF-02", title: "Deferido com Concessão Temporária / Reavaliação", regulatory_effect: "deferido", description: "Concessão técnica válida por período determinado (ex: 3 a 6 meses), condicionada à apresentação de novos exames de monitoramento de resposta.", active: true },
  { id: "tp-3", code: "PAR-01", title: "Deferido Parcialmente", regulatory_effect: "deferido_parcial", description: "Deferimento concedido apenas para parte dos fármacos solicitados ou com adequação da posologia recomendada.", active: true },
  { id: "tp-4", code: "EXI-01", title: "Em Exigência / Diligência Documental", regulatory_effect: "exigencia", description: "Necessidade de complementação de laudos, exames laboratoriais complementares ou relatório médico circunstanciado.", active: true },
  { id: "tp-5", code: "EXI-02", title: "Em Exigência / Justificativa de Alternativa Terapêutica", regulatory_effect: "exigencia", description: "Necessidade de justificativa médica formal quanto à falha, contraindicação ou refratariedade aos medicamentos padronizados no SUS.", active: true },
  { id: "tp-6", code: "IND-01", title: "Indeferido por Não Atendimento aos Critérios do PCDT", regulatory_effect: "indeferido", description: "Quadro clínico ou estadiamento da patologia não preenche os critérios de inclusão preconizados no protocolo do SUS.", active: true },
  { id: "tp-7", code: "IND-02", title: "Indeferido por Existência de Alternativa no SUS", regulatory_effect: "indeferido", description: "Existem alternativas terapêuticas disponíveis e eficazes na RENAME/CEAF sem demonstração prévia de falha documentada.", active: true },
  { id: "tp-8", code: "IND-03", title: "Indeferido por Falta de Evidência Científica / Registro", regulatory_effect: "indeferido", description: "Item sem registro sanitário válido na ANVISA ou sem evidência clínica robusta para a indicação solicitada.", active: true },
];

// ------------------------------------------------------------------------------
// 3. PACIENTES / REQUERENTES
// ------------------------------------------------------------------------------

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: "pat-1",
    unit_id: "11111111-1111-1111-1111-111111111111",
    cpf: "123.456.789-01",
    cns: "700123456789012",
    full_name: "Antônio Carlos dos Santos",
    birth_date: "1968-04-12",
    phone: "(75) 98822-1010",
    municipality_id: "mun-2924009",
    municipality_name: "Paulo Afonso",
    status: "em_acompanhamento",
    created_by: "11111111-0000-0000-0000-000000000001",
    created_at: "2026-01-15T09:00:00Z",
  },
  {
    id: "pat-2",
    unit_id: "11111111-1111-1111-1111-111111111111",
    cpf: "234.567.890-12",
    cns: "700987654321098",
    full_name: "Maria Helena de Oliveira",
    birth_date: "1975-09-23",
    phone: "(75) 99134-4455",
    municipality_id: "mun-2924009",
    municipality_name: "Paulo Afonso",
    status: "em_acompanhamento",
    created_by: "11111111-0000-0000-0000-000000000001",
    created_at: "2026-02-10T14:30:00Z",
  },
  {
    id: "pat-3",
    unit_id: "11111111-1111-1111-1111-111111111111",
    cpf: "345.678.901-23",
    cns: "700543210987654",
    full_name: "Sebastião Ferreira Ramos",
    birth_date: "1954-11-05",
    phone: "(75) 98112-9900",
    municipality_id: "mun-2924009",
    municipality_name: "Paulo Afonso",
    status: "alta",
    created_by: "11111111-0000-0000-0000-000000000001",
    created_at: "2026-01-20T11:00:00Z",
  },
  {
    id: "pat-4",
    unit_id: "11111111-1111-1111-1111-111111111111",
    cpf: "456.789.012-34",
    cns: "700112233445566",
    full_name: "Clara Beatriz Meireles",
    birth_date: "1982-01-30",
    phone: "(75) 99876-5432",
    municipality_id: "mun-2924009",
    municipality_name: "Paulo Afonso",
    status: "em_acompanhamento",
    created_by: "11111111-0000-0000-0000-000000000001",
    created_at: "2026-03-01T08:15:00Z",
  },
  {
    id: "pat-5",
    unit_id: "55555555-5555-5555-5555-555555555555",
    cpf: "567.890.123-45",
    cns: "700998877665544",
    full_name: "Raimundo Nonato da Silva",
    birth_date: "1960-07-18",
    phone: "(71) 98765-4321",
    municipality_id: "mun-2927408",
    municipality_name: "Salvador",
    status: "em_acompanhamento",
    created_by: "22222222-0000-0000-0000-000000000002",
    created_at: "2026-02-15T10:00:00Z",
  },
];

// ------------------------------------------------------------------------------
// 4. PROCESSOS SEI E WORKFLOW DE REGULAÇÃO (INICIALMENTE VAZIO PARA DADOS REAIS)
// ------------------------------------------------------------------------------

export const INITIAL_PROCESSOS: Processo[] = [];

// ------------------------------------------------------------------------------
// 5. COMPATIBILIDADE LEGADA (CONSULTAS CLÍNICAS E DADOS MENSAIS)
// ------------------------------------------------------------------------------

export const INITIAL_CONSULTATIONS: Consultation[] = [];

export const INITIAL_MONTHLY_DATA: MonthlyComplementaryData[] = [];
