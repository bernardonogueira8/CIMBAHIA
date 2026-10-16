export type Role = "admin" | "pharmacist" | "viewer";

export type PatientStatus = "em_acompanhamento" | "alta" | "inativo";

export type PRFCategory = "Adesão" | "Efetividade" | "Indicação" | "Segurança";

export type PRFStatus = "Resolvido" | "Em resolução" | "Não resolvido" | "Aguardando retorno";

export interface Unit {
  id: string;
  name: string;
  macroregion: string;
  cnes?: string | null;
  municipality?: string | null;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  crf?: string | null;
  unit_id?: string | null;
  role: Role;
  unit?: Unit | null;
  created_at?: string;
}

export interface CID {
  id: string;
  code: string;
  description: string;
  active: boolean;
  created_at?: string;
}

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

export interface Patient {
  id: string;
  unit_id: string;
  cpf: string;
  cns?: string | null;
  full_name: string;
  birth_date?: string | null;
  phone?: string | null;
  status: PatientStatus;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
  unit?: Unit;
}

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
