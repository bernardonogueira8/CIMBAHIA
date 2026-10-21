// ==============================================================================
// CIMBAHIA - REPOSITÓRIO DE PRECEDENTES E BANCO DE PARECERES TÉCNICOS
// Base de conhecimento para consulta de pareceres emitidos, fundamentação clínica
// e decisões regulatórias (Deferido, Indeferido, Exigência).
// ==============================================================================

export interface PrecedentAnswer {
  status: "deferido" | "indeferido" | "em_exigencia" | "deferido_parcial";
  title: string;
  fundamentacao: string;
  recomendacoes?: string;
  criterios_chave?: string[];
}

export interface SubstancePrecedent {
  id: string;
  substance: string;
  synonyms: string[];
  component: string; // CEAF Grupo 1A, 1B, Grupo 2, Judicial / Extra-SUS
  pcdt_reference: string;
  applicable_cids: { code: string; description: string }[];
  approval_rate_estimate: number;
  avg_analysis_days: number;
  answers: {
    deferido: PrecedentAnswer;
    indeferido: PrecedentAnswer;
    em_exigencia: PrecedentAnswer;
    deferido_parcial?: PrecedentAnswer;
  };
}

// Inicialmente vazio para ser populado com dados e pareceres reais da equipe técnica
export const OFFICIAL_SUBSTANCE_PRECEDENTS: SubstancePrecedent[] = [];
