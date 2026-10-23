/**
 * UTILITÁRIO DE IDENTIFICAÇÃO DE IDADE E FAIXA ETÁRIA NO MOMENTO DA AVALIAÇÃO
 * 
 * Regras clínicas do SUS / Ministério da Saúde / Sociedade Brasileira de Pediatria / Estatuto da Pessoa Idosa:
 * 1. Recém-nascido (Período Neonatal): 0 a 28 dias de vida
 * 2. Criança: 29 dias de vida a 17 anos (faixa pediátrica < 18 anos)
 * 3. Adulto: 18 a 59 anos
 * 4. Idoso: 60 anos ou mais (Estatuto da Pessoa Idosa - Lei 10.741/2003)
 */

export type FaixaEtariaPaciente = "recem_nascido" | "crianca" | "adulto" | "idoso";

export type FaixaEtariaLabel = "Recém-nascido" | "Criança" | "Adulto" | "Idoso";

export interface PatientAgeResult {
  idadeAnos: number | null;
  idadeMeses: number | null;
  idadeDias: number | null;
  idadeFormatada: string;
  faixaEtaria: FaixaEtariaPaciente | null;
  faixaEtariaLabel: FaixaEtariaLabel | "Não informada";
  badgeStyles: {
    bg: string;
    text: string;
    border: string;
    fullBadgeClass: string;
  };
}

const DEFAULT_BADGE_STYLES = {
  bg: "bg-slate-100",
  text: "text-slate-600",
  border: "border-slate-200",
  fullBadgeClass: "bg-slate-100 text-slate-600 border-slate-200",
};

export const FAIXA_ETARIA_CONFIG: Record<
  FaixaEtariaPaciente,
  {
    label: FaixaEtariaLabel;
    bg: string;
    text: string;
    border: string;
    fullBadgeClass: string;
    description: string;
  }
> = {
  recem_nascido: {
    label: "Recém-nascido",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    fullBadgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    description: "0 a 28 dias de vida (Neonato)",
  },
  crianca: {
    label: "Criança",
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    fullBadgeClass: "bg-sky-50 text-sky-700 border-sky-200",
    description: "29 dias a 17 anos (Pediatria)",
  },
  adulto: {
    label: "Adulto",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    fullBadgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    description: "18 a 59 anos",
  },
  idoso: {
    label: "Idoso",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-300",
    fullBadgeClass: "bg-amber-50 text-amber-800 border-amber-300",
    description: "60 anos ou mais (Estatuto da Pessoa Idosa)",
  },
};

/**
 * Normaliza e converte strings de data (ex: '1985-04-12', '12/04/1985', '1985-04-12T10:00:00Z') para Date local
 * seguro contra bugs de fuso horário.
 */
function parseDateSafe(dateInput: string | Date | null | undefined): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }

  const str = String(dateInput).trim();
  if (!str) return null;

  // 1. Se estiver no formato YYYY-MM-DD ou YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    return new Date(year, month, day, 12, 0, 0); // Meio-dia para imunidade a fuso horário
  }

  // 2. Se estiver no formato brasileiro DD/MM/YYYY ou DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    return new Date(year, month, day, 12, 0, 0); // Meio-dia para imunidade a fuso horário
  }

  const parsed = new Date(str);
  if (isNaN(parsed.getTime())) return null;

  // Garante meio-dia local para datas genéricas
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 12, 0, 0);
}

/**
 * Calcula a idade do paciente no exato momento da avaliação e classifica em:
 * - Recém-nascido (0 a 28 dias)
 * - Criança (29 dias até 17 anos)
 * - Adulto (18 a 59 anos)
 * - Idoso (>= 60 anos)
 * 
 * @param birthDate Data de nascimento do paciente
 * @param evaluationDate Data da avaliação ou do parecer (padrão: data atual)
 */
export function calculatePatientAgeAtEvaluation(
  birthDate: string | Date | null | undefined,
  evaluationDate?: string | Date | null | undefined
): PatientAgeResult {
  const birth = parseDateSafe(birthDate);

  if (!birth) {
    return {
      idadeAnos: null,
      idadeMeses: null,
      idadeDias: null,
      idadeFormatada: "Não informada",
      faixaEtaria: null,
      faixaEtariaLabel: "Não informada",
      badgeStyles: DEFAULT_BADGE_STYLES,
    };
  }

  const today = new Date();
  const todaySafe = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0);

  // Se a data de nascimento estiver estritamente no futuro em relação ao dia de hoje
  if (birth.getTime() > todaySafe.getTime()) {
    return {
      idadeAnos: null,
      idadeMeses: null,
      idadeDias: null,
      idadeFormatada: "Data não informada",
      faixaEtaria: null,
      faixaEtariaLabel: "Não informada",
      badgeStyles: DEFAULT_BADGE_STYLES,
    };
  }

  let evalDate = parseDateSafe(evaluationDate) || todaySafe;

  // Se a data do processo/avaliação fornecida for anterior ao nascimento do paciente,
  // utiliza a data de hoje para calcular a idade real atual do paciente sem exibir erro
  if (evalDate.getTime() < birth.getTime()) {
    evalDate = todaySafe;
  }

  // Diferença total em dias com arredondamento seguro
  const diffTime = evalDate.getTime() - birth.getTime();
  const diffDays = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));

  // Cálculo de anos completos
  let years = evalDate.getFullYear() - birth.getFullYear();
  const monthDiff = evalDate.getMonth() - birth.getMonth();
  const dayDiff = evalDate.getDate() - birth.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    years--;
  }
  if (years < 0) years = 0;

  // Cálculo de meses completos
  let months = (evalDate.getFullYear() - birth.getFullYear()) * 12 + (evalDate.getMonth() - birth.getMonth());
  if (dayDiff < 0) {
    months--;
  }
  if (months < 0) months = 0;

  // 1. Recém-nascido: 0 a 28 dias de vida
  if (diffDays <= 28) {
    const formatted = diffDays === 1 ? "1 dia" : `${diffDays} dias`;
    return {
      idadeAnos: 0,
      idadeMeses: 0,
      idadeDias: diffDays,
      idadeFormatada: formatted,
      faixaEtaria: "recem_nascido",
      faixaEtariaLabel: "Recém-nascido",
      badgeStyles: FAIXA_ETARIA_CONFIG.recem_nascido,
    };
  }

  // 2. Criança menor de 1 ano (29 dias até < 1 ano)
  if (years < 1) {
    const formatted = months <= 1 ? "1 mês" : `${months} meses`;
    return {
      idadeAnos: 0,
      idadeMeses: months,
      idadeDias: diffDays,
      idadeFormatada: formatted,
      faixaEtaria: "crianca",
      faixaEtariaLabel: "Criança",
      badgeStyles: FAIXA_ETARIA_CONFIG.crianca,
    };
  }

  // 3. Criança (1 ano até 17 anos)
  if (years < 18) {
    const formatted = years === 1 ? "1 ano" : `${years} anos`;
    return {
      idadeAnos: years,
      idadeMeses: months,
      idadeDias: diffDays,
      idadeFormatada: formatted,
      faixaEtaria: "crianca",
      faixaEtariaLabel: "Criança",
      badgeStyles: FAIXA_ETARIA_CONFIG.crianca,
    };
  }

  // 4. Adulto (18 a 59 anos)
  if (years < 60) {
    return {
      idadeAnos: years,
      idadeMeses: months,
      idadeDias: diffDays,
      idadeFormatada: `${years} anos`,
      faixaEtaria: "adulto",
      faixaEtariaLabel: "Adulto",
      badgeStyles: FAIXA_ETARIA_CONFIG.adulto,
    };
  }

  // 5. Idoso (60 anos ou mais)
  return {
    idadeAnos: years,
    idadeMeses: months,
    idadeDias: diffDays,
    idadeFormatada: `${years} anos`,
    faixaEtaria: "idoso",
    faixaEtariaLabel: "Idoso",
    badgeStyles: FAIXA_ETARIA_CONFIG.idoso,
  };
}

/**
 * Obtém a idade no momento da avaliação para um Processo SEI
 */
export function getProcessoPatientAge(processo: {
  data_abertura?: string | null;
  created_at?: string | null;
  paciente?: {
    birth_date?: string | null;
  } | null;
  parecer?: {
    active_version?: {
      created_at?: string | null;
    } | null;
  } | null;
}): PatientAgeResult {
  const birthDate = processo.paciente?.birth_date;
  // Momento da avaliação: data do parecer técnico emitido ou data de abertura do processo
  const evalDate =
    processo.parecer?.active_version?.created_at ||
    processo.data_abertura ||
    processo.created_at ||
    new Date();

  return calculatePatientAgeAtEvaluation(birthDate, evalDate);
}
