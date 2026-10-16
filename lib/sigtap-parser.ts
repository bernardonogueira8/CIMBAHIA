import {
  CID,
  Medication,
  SigtapCompetencyResult,
  SigtapParsedCID,
  SigtapParsedProcedure,
  SigtapParsedRelation,
} from "./types";

/**
 * Formata um código de CID do formato DataSUS (ex: M058, K500, G35)
 * para o padrão clínico internacional com ponto (ex: M05.8, K50.0, G35).
 */
export function formatCIDCode(raw: string): string {
  if (!raw) return "";
  const clean = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length === 4) {
    return `${clean.slice(0, 3)}.${clean.slice(3)}`;
  }
  return clean;
}

/**
 * Normaliza o nome do medicamento para caixa alta/baixa legível (Title Case refinado),
 * mantendo unidades como MG, ML, UI, MCG em maiúsculas.
 */
export function formatMedicationName(rawName: string): string {
  if (!rawName) return "";
  const cleaned = rawName.trim().replace(/\s+/g, " ");

  // Converte para Title Case
  let formatted = cleaned
    .toLowerCase()
    .replace(/(?:^|\s|-|\/)\S/g, (char) => char.toUpperCase());

  // Preserva abreviações farmacêuticas oficiais
  const acronyms: Record<string, string> = {
    Mg: "mg",
    Ml: "mL",
    Ui: "UI",
    Mui: "MUI",
    Mcg: "mcg",
    G: "g",
    Dcb: "DCB",
    Gh: "GH",
    Sus: "SUS",
    Ceaf: "CEAF",
    Fa: "FA",
    Amp: "AMP",
    Fr: "FR",
    Cp: "CP",
    Cap: "CAP",
  };

  Object.entries(acronyms).forEach(([find, replace]) => {
    const reg = new RegExp(`\\b${find}\\b`, "g");
    formatted = formatted.replace(reg, replace);
  });

  return formatted;
}

/**
 * Verifica se um procedimento pertence ao Componente Especializado da Assistência Farmacêutica (CEAF).
 * No SIGTAP do SUS:
 * - Grupo 06 = Medicamentos
 * - Subgrupo 04 = Componente Especializado da Assistência Farmacêutica
 */
export function isCEAFProcedure(procedureCode: string): boolean {
  if (!procedureCode) return false;
  const clean = procedureCode.trim().replace(/\D/g, "");
  return clean.startsWith("0604");
}

/**
 * Parser de tb_procedimento.txt da SIGTAP
 * Suporta layout posicional padrão DataSUS (largura fixa) ou delimitado (tab, ponto e vírgula, pipe).
 */
export function parseTbProcedimento(content: string): SigtapParsedProcedure[] {
  if (!content) return [];
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const results: SigtapParsedProcedure[] = [];

  for (const line of lines) {
    // Pula possíveis cabeçalhos
    if (line.toLowerCase().includes("co_procedimento") || line.toLowerCase().includes("procedimento;")) {
      continue;
    }

    let code = "";
    let name = "";
    let competency = "";

    // Verifica se a linha tem delimitador
    if (line.includes(";") || line.includes("\t") || line.includes("|")) {
      const sep = line.includes(";") ? ";" : line.includes("\t") ? "\t" : "|";
      const parts = line.split(sep).map((p) => p.trim().replace(/^["']|["']$/g, ""));
      code = parts[0] || "";
      name = parts[1] || "";
      competency = parts[parts.length - 1] || "";
    } else {
      // Layout Posicional Oficial DataSUS:
      // CO_PROCEDIMENTO: 0 a 10 (10 chars)
      // NO_PROCEDIMENTO: 10 a 260 (250 chars)
      // DT_COMPETENCIA: 364 a 370 (6 chars)
      if (line.length >= 20) {
        code = line.substring(0, 10).trim();
        name = line.substring(10, Math.min(line.length, 260)).trim();
        if (line.length >= 370) {
          competency = line.substring(364, 370).trim();
        }
      }
    }

    // Filtra estritamente CEAF (0604)
    if (isCEAFProcedure(code)) {
      results.push({
        code,
        name: formatMedicationName(name),
        competency: competency || "Atual",
      });
    }
  }

  return results;
}

/**
 * Parser de rl_procedimento_cid.txt da SIGTAP
 * Extrai os relacionamentos entre procedimentos do CEAF e CIDs dos PCDTs.
 */
export function parseRlProcedimentoCid(content: string): SigtapParsedRelation[] {
  if (!content) return [];
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const relations: SigtapParsedRelation[] = [];

  for (const line of lines) {
    if (line.toLowerCase().includes("co_procedimento") || line.toLowerCase().includes("co_cid")) {
      continue;
    }

    let procCode = "";
    let cidRaw = "";
    let isPrimary = false;

    if (line.includes(";") || line.includes("\t") || line.includes("|")) {
      const sep = line.includes(";") ? ";" : line.includes("\t") ? "\t" : "|";
      const parts = line.split(sep).map((p) => p.trim().replace(/^["']|["']$/g, ""));
      procCode = parts[0] || "";
      cidRaw = parts[1] || "";
      isPrimary = (parts[2] || "").toUpperCase() === "S";
    } else {
      // Layout Posicional Oficial DataSUS:
      // CO_PROCEDIMENTO: 0 a 10 (10 chars)
      // CO_CID: 10 a 14 (4 chars)
      // ST_PRINCIPAL: 14 a 15 (1 char: 'S' ou 'N')
      if (line.length >= 14) {
        procCode = line.substring(0, 10).trim();
        cidRaw = line.substring(10, 14).trim();
        isPrimary = line.length > 14 && line.substring(14, 15).toUpperCase() === "S";
      }
    }

    // Filtra exclusivamente CEAF
    if (isCEAFProcedure(procCode) && cidRaw) {
      relations.push({
        procedure_code: procCode,
        cid_code: formatCIDCode(cidRaw),
        is_primary: isPrimary,
      });
    }
  }

  return relations;
}

/**
 * Parser de tb_cid.txt da SIGTAP
 * Extrai a tabela de CIDs e suas descrições oficiais.
 */
export function parseTbCid(content: string): Map<string, string> {
  const cidMap = new Map<string, string>();
  if (!content) return cidMap;

  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);

  for (const line of lines) {
    if (line.toLowerCase().includes("co_cid") || line.toLowerCase().includes("no_cid")) {
      continue;
    }

    let rawCode = "";
    let description = "";

    if (line.includes(";") || line.includes("\t") || line.includes("|")) {
      const sep = line.includes(";") ? ";" : line.includes("\t") ? "\t" : "|";
      const parts = line.split(sep).map((p) => p.trim().replace(/^["']|["']$/g, ""));
      rawCode = parts[0] || "";
      description = parts[1] || "";
    } else {
      // Layout Posicional Oficial DataSUS:
      // CO_CID: 0 a 4 (4 chars)
      // NO_CID: 4 a 104 (100 chars)
      if (line.length >= 4) {
        rawCode = line.substring(0, 4).trim();
        description = line.substring(4, Math.min(line.length, 104)).trim();
      }
    }

    if (rawCode && description) {
      const formattedCode = formatCIDCode(rawCode);
      cidMap.set(formattedCode, description);
    }
  }

  return cidMap;
}

/**
 * Extrai uma forma farmacêutica resumida a partir da descrição do medicamento
 */
function extractPharmaceuticalForm(fullName: string): string {
  const lower = fullName.toLowerCase();
  if (lower.includes("solução injetável") || lower.includes("solucao injetavel")) {
    if (lower.includes("seringa")) return "Solução Injetável em seringa preenchida";
    if (lower.includes("caneta")) return "Solução Injetável em caneta aplicadora";
    if (lower.includes("frasco")) return "Solução Injetável em frasco-ampola";
    return "Solução Injetável";
  }
  if (lower.includes("pó liofilizado") || lower.includes("po liofilizado")) {
    return "Pó liofilizado para solução injetável";
  }
  if (lower.includes("comprimido de liberação prolongada") || lower.includes("liberacao prolongada")) {
    return "Comprimido de Liberação Prolongada";
  }
  if (lower.includes("comprimido revestido")) return "Comprimido Revestido";
  if (lower.includes("comprimido")) return "Comprimido";
  if (lower.includes("cápsula gelatinosa") || lower.includes("capsula gelatinosa")) {
    return "Cápsula gelatinosa";
  }
  if (lower.includes("cápsula") || lower.includes("capsula")) return "Cápsula";
  if (lower.includes("solução oral") || lower.includes("solucao oral")) return "Solução Oral";
  if (lower.includes("suspensão") || lower.includes("suspensao")) return "Suspensão";
  if (lower.includes("pomada") || lower.includes("creme")) return "Pomada / Creme tópico";

  return "Forma farmacêutica padronizada CEAF";
}

/**
 * Processador Geral de Competência da SIGTAP:
 * Combina tb_procedimento, rl_procedimento_cid e tb_cid,
 * filtrando estritamente o CEAF (0604) e gerando catálogo estruturado.
 */
export function processSigtapCompetency(
  tbProcedimentoContent: string,
  rlProcedimentoCidContent: string,
  tbCidContent: string
): SigtapCompetencyResult {
  // 1. Processa procedimentos
  const procedures = parseTbProcedimento(tbProcedimentoContent);

  // 2. Processa relacionamentos
  const relations = parseRlProcedimentoCid(rlProcedimentoCidContent);

  // 3. Processa dicionário de CIDs
  const cidDescriptions = parseTbCid(tbCidContent);

  // Agrupa os CIDs autorizados por código de procedimento
  const procCidMap = new Map<string, Set<string>>();
  const relevantCidCodes = new Set<string>();

  relations.forEach((rel) => {
    if (!procCidMap.has(rel.procedure_code)) {
      procCidMap.set(rel.procedure_code, new Set<string>());
    }
    procCidMap.get(rel.procedure_code)!.add(rel.cid_code);
    relevantCidCodes.add(rel.cid_code);
  });

  // Determina competência predominante
  const competency = procedures[0]?.competency || "Competência Atual";

  // Gera lista final de Medicamentos para o PharmaCare
  const medications: Omit<Medication, "id">[] = procedures.map((p) => {
    const compatibleCids = Array.from(procCidMap.get(p.code) || []);
    return {
      sigtap_code: p.code,
      name: p.name,
      pharmaceutical_form: extractPharmaceuticalForm(p.name),
      component: "CEAF",
      active: true,
      compatible_cid_codes: compatibleCids,
    };
  });

  // Gera lista final de CIDs pertinentes ao CEAF
  const cids: SigtapParsedCID[] = Array.from(relevantCidCodes)
    .sort()
    .map((code) => {
      const desc = cidDescriptions.get(code) || `Patologia Protocolo Clínico PCDT (${code})`;
      return {
        code,
        description: desc,
      };
    });

  return {
    competency,
    procedures,
    cids,
    relations,
    medications,
    totalRawProcedures: tbProcedimentoContent.split(/\r?\n/).length,
    totalCeafProcedures: procedures.length,
    totalCids: cids.length,
    totalRelations: relations.length,
  };
}

/**
 * Gera script SQL de migração oficial para ser executado no PostgreSQL / Supabase,
 * atualizando as tabelas cids, medications e o relacionamento com idempotência (ON CONFLICT).
 */
export function generateSupabaseSigtapMigrationSQL(result: SigtapCompetencyResult): string {
  const timestamp = new Date().toISOString();
  const escapedComp = result.competency.replace(/'/g, "''");

  let sql = `-- ==============================================================================
-- PHARMACARE - ATUALIZAÇÃO DE COMPETÊNCIA SIGTAP / CEAF (${escapedComp})
-- Gerado em: ${timestamp}
-- Total Medicamentos CEAF: ${result.medications.length}
-- Total Diagnósticos PCDT (CIDs): ${result.cids.length}
-- ==============================================================================

-- 1. Garante colunas de código SIGTAP na tabela de medicamentos (caso não existam)
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

-- 3. Inserção / Atualização de CIDs Oficiais dos PCDTs do CEAF
INSERT INTO public.cids (code, description, active)
VALUES
`;

  // Linhas de CIDs
  const cidRows = result.cids.map((c) => {
    const code = c.code.replace(/'/g, "''");
    const desc = c.description.replace(/'/g, "''");
    return `    ('${code}', '${desc}', true)`;
  });

  sql += cidRows.join(",\n");
  sql += `\nON CONFLICT (code) DO UPDATE 
SET description = EXCLUDED.description, active = true;\n\n`;

  // Linhas de Medicamentos
  sql += `-- 4. Inserção / Atualização dos Medicamentos Especializados (CEAF)
`;

  result.medications.forEach((m) => {
    const sigtapCode = (m.sigtap_code || "").replace(/'/g, "''");
    const name = m.name.replace(/'/g, "''");
    const form = (m.pharmaceutical_form || "").replace(/'/g, "''");

    sql += `INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '${sigtapCode}', '${name}', '${form}', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '${sigtapCode}' OR LOWER(name) = LOWER('${name}')
);\n`;
  });

  // Linhas de Relacionamentos (rl_procedimento_cid)
  if (result.relations.length > 0) {
    sql += `\n-- 5. Relacionamento Oficial PCDT (rl_procedimento_cid)
INSERT INTO public.medication_authorized_cids (sigtap_code, cid_code, is_primary)
VALUES
`;
    // Pega amostra ou todos (deduplicando)
    const seen = new Set<string>();
    const relRows: string[] = [];

    for (const r of result.relations) {
      const key = `${r.procedure_code}_${r.cid_code}`;
      if (!seen.has(key)) {
        seen.add(key);
        relRows.push(`    ('${r.procedure_code}', '${r.cid_code}', ${r.is_primary ? "true" : "false"})`);
      }
    }

    sql += relRows.join(",\n");
    sql += `\nON CONFLICT (sigtap_code, cid_code) DO NOTHING;\n`;
  }

  return sql;
}
