// ==============================================================================
// CIMBAHIA - CENTRAL INTEGRADA DE REGULAÇÃO E PARECERES FARMACÊUTICOS DA BAHIA
// Definições de Tipos e Interfaces de Domínio
// ==============================================================================

export type Role = "admin" | "pharmacist" | "viewer" | "gestor" | "farmaceutico" | "administrativo";

export type PatientStatus = "em_acompanhamento" | "alta" | "inativo";

export type PRFCategory = "Adesão" | "Efetividade" | "Indicação" | "Segurança";

export type PRFStatus = "Resolvido" | "Em resolução" | "Não resolvido" | "Aguardando retorno";

// ------------------------------------------------------------------------------
// 1. ESTRUTURA ORGANIZACIONAL & TERRITORIAL DA BAHIA
// ------------------------------------------------------------------------------

export interface Origem {
  id: string;
  name: string;
  sigla?: string | null;
  description?: string | null;
  active: boolean;
  created_at?: string;
}

export interface Dires {
  id: string;
  code: string;
  name: string;
  region?: string | null;
  active: boolean;
  created_at?: string;
}

export interface Nucleo {
  id: string;
  code: string;
  name: string;
  macroregion: string;
  active: boolean;
  created_at?: string;
}

export interface BaseRegional {
  id: string;
  name: string;
  nucleo_id?: string | null;
  dires_id?: string | null;
  active: boolean;
  created_at?: string;
}

export interface Municipio {
  id: string;
  ibge_code: string;
  name: string;
  base_id?: string | null;
  dires_id?: string | null;
  nucleo_id?: string | null;
  population?: number | null;
  distancia_brs?: number | null;
  brs_name?: string | null;
  nrs_name?: string | null;
  macroregion?: string | null;
  responsible_pharmacist?: string | null;
  active: boolean;
  created_at?: string;
}

export interface UnidadeFarmaceutico {
  id: string;
  unit_id: string;
  pharmacist_id: string;
  full_name: string;
  crf: string;
  phone?: string | null;
  email?: string | null;
  is_technical_lead: boolean;
  created_at?: string;
}

export interface Unit {
  id: string;
  name: string;
  macroregion: string;
  cnes?: string | null;
  municipality?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  active: boolean;
  served_municipalities?: Municipio[];
  responsible_pharmacists?: UnidadeFarmaceutico[];
  created_at?: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  crf?: string | null;
  phone?: string | null;
  unit_id?: string | null;
  role: Role;
  active?: boolean;
  unit?: Unit | null;
  created_at?: string;
}

// ------------------------------------------------------------------------------
// 2. CATÁLOGOS CLÍNICOS E DOMÍNIOS
// ------------------------------------------------------------------------------

export interface CID {
  id: string;
  code: string;
  description: string;
  chapter?: string | null;
  group_name?: string | null;
  active: boolean;
  created_at?: string;
}

// Fármacos / Apresentações & Componente (Catálogo Oficial Anvisa / SUS)
export interface Farmaco {
  id: string;
  name: string; // Fármaco / Apresentação / Substância Ativa
  component?: string | null; // Componente Especializado, Básico, Estratégico, etc.
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Medicamentos Oficiais do CEAF / SIGTAP / RENAME (retrocompatibilidade)
export interface Medication {
  id: string;
  sigtap_code?: string | null;
  name: string;
  pharmaceutical_form?: string | null;
  component: string;
  active: boolean;
  compatible_cid_codes?: string[];
  created_at?: string;
}

// Outros Medicamentos (Não Padronizados, Judiciais, Fórmulas Especiais, Insumos)
export interface OtherMedication {
  id: string;
  name: string;
  active_ingredient: string;
  dosage?: string | null;
  pharmaceutical_form?: string | null;
  anvisa_registry?: string | null;
  category: "Judicial" | "Não Padronizado no SUS" | "Fórmula Nutricional" | "Insumo Especial" | "Atenção Básica/Estratégico" | "Outros";
  notes?: string | null;
  estimated_unit_cost?: number | null;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type TipoParecerEfeito = "deferido" | "indeferido" | "exigencia" | "deferido_parcial";

export interface TipoParecer {
  id: string;
  code: string;
  title: string;
  regulatory_effect: TipoParecerEfeito;
  description?: string | null;
  active: boolean;
  created_at?: string;
}

// ------------------------------------------------------------------------------
// 3. PACIENTES / REQUERENTES
// ------------------------------------------------------------------------------

export type FaixaEtariaPaciente = "recem_nascido" | "crianca" | "adulto" | "idoso";

export interface Patient {
  id: string;
  unit_id: string;
  cpf: string;
  cpf_not_provided?: boolean;
  gender?: "M" | "F" | "outro" | "nao_informado" | null;
  cns?: string | null;
  full_name: string;
  birth_date?: string | null;
  phone?: string | null;
  bairro?: string | null;
  cep?: string | null;
  municipality_id?: string | null;
  municipality_name?: string | null;
  is_outside_bahia?: boolean;
  outside_state_description?: string | null;
  status: PatientStatus;
  status_externo?: string | null;
  afsesab_status?: "novo_paciente" | "paciente_existe" | string | null;
  afsesab_status_label?: string | null;
  cadastrado_afsesab?: boolean;
  idade_atual?: number | null;
  faixa_etaria?: FaixaEtariaPaciente | null;
  faixa_etaria_label?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
  unit?: Unit;
}

export interface CpfLookupResult {
  found: boolean;
  status?: string | null;
  status_externo?: string | null;
  afsesab_status?: "novo_paciente" | "paciente_existe" | string | null;
  afsesab_status_label?: string | null;
  cadastrado_afsesab?: boolean;
  cns?: string | null;
  nome?: string | null;
  nascimento?: string | null;
  cpf?: string | null;
  cpf_formatted?: string | null;
  cod_sexo?: string | null;
  gender?: "M" | "F" | "nao_informado";
  end_descricao_barrio?: string | null;
  bairro?: string | null;
  end_numero_cep?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  rg?: string | null;
  nome_mae?: string | null;
  email?: string | null;
  municipio_id?: string | null;
  municipio_ibge?: string | null;
  municipio_name?: string | null;
  brs_name?: string | null;
  macroregion?: string | null;
  base_id?: string | null;
  is_outside_bahia?: boolean;
  source?: "external_api" | "local_database" | "simulation";
  message?: string;
  instructions?: Record<string, string>;
}

// ------------------------------------------------------------------------------
// 4. PROCESSOS SEI, WORKFLOW E PARECERES TÉCNICOS
// ------------------------------------------------------------------------------

// Sequência oficial de 4 etapas:
// 1. Criar processo (triagem) -> 2. Aguardando Parecer (assumir) -> 3. Em análise -> 4. Concluído
export type ProcessoStatus =
  | "triagem"
  | "observacao"
  | "em_observacao"
  | "aguardando_parecer"
  | "em_analise"
  | "concluido"
  // Aliases legados para retrocompatibilidade:
  | "aguardando_triagem"
  | "em_triagem"
  | "em_analise_farmaceutica"
  | "em_exigencia"
  | "concluido_deferido"
  | "concluido_indeferido"
  | "concluido_parcial";

export interface ProcessoItem {
  id: string;
  processo_id?: string;
  farmaco_substancia?: string; // Substância / Fármaco ativo (ex: Adalimumabe, Canabidiol, etc.)
  medication_type?: "ceaf" | "outro" | "farmaco";
  medication_id?: string;
  medication_name: string;
  cid_id?: string;
  cid_code: string;
  cid_description?: string;
  cid_nao_informado?: boolean;
  posology?: string | null;
  monthly_quantity?: number | null;
  
  // Resposta/Decisão individual para cada combo Fármaco + CID:
  status?: "deferido" | "indeferido" | "em_exigencia" | "deferido_parcial" | "pendente";
  justification?: string | null; // Fundamentação técnica específica deste combo
  evaluated_at?: string | null;
  evaluated_by?: string | null;
}

export interface ParecerVersao {
  id: string;
  parecer_id: string;
  version_number: number;
  pharmacist_id: string;
  pharmacist_name: string;
  crf: string;
  tipo_parecer_id: string;
  tipo_parecer_title: string;
  regulatory_effect: TipoParecerEfeito;
  technical_justification: string;
  clinical_foundation: string;
  recommendations?: string | null;
  rectification_reason?: string | null;
  signature_hash: string;
  created_at: string;
}

export interface Parecer {
  id: string;
  processo_id: string;
  active_version: ParecerVersao;
  versions_history: ParecerVersao[];
}

export interface ProcessoHistorico {
  id: string;
  processo_id: string;
  from_status: ProcessoStatus | null;
  to_status: ProcessoStatus;
  user_id: string;
  user_name: string;
  notes?: string | null;
  timestamp: string;
}

export interface Processo {
  id: string;
  numero_sei: string;
  data_abertura: string;
  assunto: string;
  paciente_id: string;
  paciente?: Patient | null;
  paciente_idade_na_avaliacao?: number | null;
  paciente_idade_formatada?: string | null;
  paciente_faixa_etaria?: FaixaEtariaPaciente | null;
  paciente_faixa_etaria_label?: string | null;
  origem_id: string;
  origem?: Origem | null;
  municipio_id: string;
  municipio?: Municipio | null;
  unidade_id: string;
  unidade?: Unit | null;
  status: ProcessoStatus;
  priority?: "normal" | "urgente" | "judicial";
  
  // Identificação e Contato do Processo SEI
  email?: string | null;
  telefone?: string | null;
  contato_email?: string | null;
  contato_telefone?: string | null;
  
  // Triagem
  triagem_by_id?: string | null;
  triagem_by_name?: string | null;
  triagem_completed_at?: string | null;
  triagem_notes?: string | null;
  triagem_documents_ok?: boolean;

  // Atribuição Farmacêutica
  assigned_pharmacist_id?: string | null;
  assigned_pharmacist?: Profile | null;
  assigned_at?: string | null;

  // Itens & Parecer
  items: ProcessoItem[];
  parecer?: Parecer | null;
  historico?: ProcessoHistorico[];

  // SLA & Datas
  sla_limit_date: string;
  is_sla_delayed?: boolean;
  days_in_current_status?: number;

  observations?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Determina se o processo SEI está no primeiro status do fluxo.
 * Apenas processos no primeiro status podem ser excluídos/cancelados pelo usuário.
 */
export function isProcessoInFirstStatus(proc: Processo): boolean {
  if (!proc) return false;

  // Primeiro status oficial: triagem / observacao / em_observacao / aguardando_triagem / em_triagem
  if (
    proc.status === "triagem" ||
    proc.status === "observacao" ||
    proc.status === "em_observacao" ||
    proc.status === "aguardando_triagem" ||
    proc.status === "em_triagem"
  ) {
    return true;
  }

  // Se o processo estiver na fila inicial (aguardando parecer) sem ter sido assumido por nenhum parecerista
  // e sem histórico de análise técnica ou parecer emitido
  if (
    proc.status === "aguardando_parecer" &&
    !proc.assigned_pharmacist_id &&
    !proc.parecer?.active_version &&
    (!proc.items || proc.items.every((it) => !it.status || it.status === "pendente"))
  ) {
    return true;
  }

  return false;
}

// ------------------------------------------------------------------------------
// 5. AUDITORIA E NOTIFICAÇÕES
// ------------------------------------------------------------------------------

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "STATUS_CHANGE" | "OPINION_ISSUED" | "OPINION_RECTIFIED" | "ASSIGNMENT";
  entity_name: string;
  entity_id: string;
  details?: Record<string, any>;
  ip_address?: string;
  timestamp: string;
}

export interface Notificacao {
  id: string;
  processo_id?: string | null;
  channel: "email" | "whatsapp" | "in_app";
  recipient: string;
  title: string;
  message: string;
  status: "pendente" | "enviado" | "falha";
  sent_at?: string | null;
  created_at: string;
}

// ------------------------------------------------------------------------------
// 6. ANALYTICS & COMPATIBILIDADE LEGADA (CONSULTAS & INDICADORES)
// ------------------------------------------------------------------------------

export interface ConsultationPRF {
  id: string;
  consultation_id?: string;
  medication_id?: string | null;
  category: PRFCategory;
  status: PRFStatus;
  description?: string | null;
  medication?: Medication | null;
}

export interface Consultation {
  id: string;
  unit_id: string;
  patient_id: string;
  pharmacist_id: string;
  consultation_date: string;
  primary_cid_id: string;
  is_pharmaceutical_guidance_only: boolean;
  is_new_patient: boolean;
  interventions_count: number;
  pharmaceutical_discharge: boolean;
  clinical_notes?: string | null;
  created_at?: string;
  updated_at?: string;
  patient?: Patient;
  pharmacist?: Profile;
  cid?: CID;
  medications?: Medication[];
  prfs?: ConsultationPRF[];
}

export interface MonthlyComplementaryData {
  id: string;
  unit_id: string;
  year: number;
  month: number;
  total_patients_in_followup: number;
  collective_health_activities: number;
  dispensing_administrative_patients: number;
  first_dispensing_by_pharmacist: number;
  total_new_patients_month: number;
  updated_by?: string | null;
  updated_at?: string;
}

export interface IndicatorRow {
  number: number;
  code: string;
  title: string;
  description: string;
  method: string;
  numerator: number | null;
  denominator: number | null;
  result: number;
  unit: string;
  periodicity: string;
  interpretation: string;
  meta?: string;
}

export interface SigtapParsedProcedure {
  code: string;
  name: string;
  competency: string;
  pharmaceutical_form?: string;
}

export interface SigtapParsedCID {
  code: string;
  description: string;
}

export interface SigtapParsedRelation {
  procedure_code: string;
  cid_code: string;
  is_primary: boolean;
}

export interface SigtapCompetencyResult {
  competency: string;
  procedures: SigtapParsedProcedure[];
  cids: SigtapParsedCID[];
  relations: SigtapParsedRelation[];
  medications: Omit<Medication, "id">[];
  totalRawProcedures: number;
  totalCeafProcedures: number;
  totalCids: number;
  totalRelations: number;
}

export interface ParecerSearchResultItem {
  id: string;
  origem: "processo_real" | "precedente_oficial";
  processo_sei?: string;
  paciente_nome?: string;
  data: string;
  farmaceutico: string;
  crf?: string;
  substancia: string;
  posologia?: string;
  componente?: string;
  cid_code: string;
  cid_description?: string;
  status: "deferido" | "indeferido" | "em_exigencia" | "deferido_parcial";
  titulo: string;
  pcdt_referencia: string;
  fundamentacao_tecnica: string;
  parecer_consolidado?: string;
  recomendacoes?: string;
  criterios_chave?: string[];
}

export interface ParecerSearchResponse {
  query: {
    termo?: string;
    substancia?: string;
    cid?: string;
    status?: string;
  };
  total: number;
  estatisticas: {
    substancia_identificada: string | null;
    pcdt_referencia: string | null;
    taxa_deferimento_estimada: string;
    taxa_indeferimento_estimada: string;
    taxa_exigencia_estimada: string;
    total_avaliacoes_base: number;
    principais_cids: string[];
    tempo_medio_analise_dias: number;
  };
  precedente_oficial: any | null;
  respostas: ParecerSearchResultItem[];
}

