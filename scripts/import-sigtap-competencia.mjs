#!/usr/bin/env node

/**
 * ==============================================================================
 * PHARMACARE - SCRIPT DE IMPORTAÇÃO DE COMPETÊNCIA SIGTAP / DATASUS (EXCLUSIVO CEAF)
 * ==============================================================================
 * 
 * Uso:
 *   node scripts/import-sigtap-competencia.mjs [--dir ./sigtap_files]
 * 
 * Arquivos Oficiais Necessários (extraídos do TabelaUnificada_AAAAMM.zip):
 *   1. tb_procedimento.txt
 *   2. rl_procedimento_cid.txt
 *   3. tb_cid.txt
 * 
 * O que este script faz:
 *   - Filtra estritamente o subgrupo 06.04 (Medicamentos do Componente Especializado)
 *   - Formata códigos CID-10 para o padrão clínico internacional (ex: M058 -> M05.8)
 *   - Cruza a tabela de relacionamento (rl_procedimento_cid) identificando patologias autorizadas
 *   - Gera o script de migração SQL idempotente para o Supabase: supabase/migrations/sigtap_competencia_AAAAMM.sql
 *   - Salva o catálogo consolidado em data/sigtap_ceaf_catalog.json
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// 1. Argumentos CLI
const args = process.argv.slice(2);
let targetDir = path.join(rootDir, "sigtap_files");

const dirIndex = args.indexOf("--dir");
if (dirIndex !== -1 && args[dirIndex + 1]) {
  targetDir = path.resolve(process.cwd(), args[dirIndex + 1]);
}

console.log("\n========================================================");
console.log("   PHARMACARE · INCORPORAÇÃO DE COMPETÊNCIA SIGTAP (CEAF)");
console.log("========================================================\n");

// 2. Localiza os arquivos necessários na pasta
function findFile(dir, pattern) {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  const found = files.find((f) => f.toLowerCase() === pattern.toLowerCase());
  return found ? path.join(dir, found) : null;
}

const fileProcedimento = findFile(targetDir, "tb_procedimento.txt");
const fileRlProcCid = findFile(targetDir, "rl_procedimento_cid.txt");
const fileCid = findFile(targetDir, "tb_cid.txt");

if (!fileProcedimento || !fileRlProcCid || !fileCid) {
  console.log(`[!] Pasta de arquivos da competência: ${targetDir}`);
  console.log("\n[AVISO] Não foi possível localizar os 3 arquivos oficiais do DataSUS.");
  console.log("Arquivos encontrados:");
  console.log(` - tb_procedimento.txt:      ${fileProcedimento ? "OK" : "AUSENTE"}`);
  console.log(` - rl_procedimento_cid.txt:   ${fileRlProcCid ? "OK" : "AUSENTE"}`);
  console.log(` - tb_cid.txt:                 ${fileCid ? "OK" : "AUSENTE"}`);

  console.log("\n--- COMO PROCEDER ---");
  console.log("1. Acesse o portal SIGTAP: http://sigtap.datasus.gov.br/");
  console.log("   ou FTP DataSUS: ftp://ftp.datasus.gov.br/dissemin/publicos/SIASUS/200801_/Tabelas/");
  console.log("2. Baixe o pacote da competência atual: TabelaUnificada_AAAAMM.zip");
  console.log("3. Extraia o conteúdo e coloque os arquivos na pasta:");
  console.log(`   ${targetDir}`);
  console.log("4. Execute novamente:");
  console.log("   node scripts/import-sigtap-competencia.mjs\n");

  // Garante que a pasta exista para conveniência
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log(`[+] Pasta criada para você colocar os arquivos: ${targetDir}\n`);
  }
  process.exit(0);
}

console.log(`[*] Processando arquivos em: ${targetDir}`);

// 3. Utilitários de Formatação
function formatCIDCode(raw) {
  if (!raw) return "";
  const clean = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length === 4) {
    return `${clean.slice(0, 3)}.${clean.slice(3)}`;
  }
  return clean;
}

function isCEAF(code) {
  return typeof code === "string" && code.trim().startsWith("0604");
}

function formatMedicationName(rawName) {
  if (!rawName) return "";
  const cleaned = rawName.trim().replace(/\s+/g, " ");

  let formatted = cleaned
    .toLowerCase()
    .replace(/(?:^|\s|-|\/)\S/g, (char) => char.toUpperCase());

  const acronyms = {
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

function extractPharmaceuticalForm(fullName) {
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
  if (lower.includes("liberação prolongada") || lower.includes("liberacao prolongada")) {
    return "Comprimido de Liberação Prolongada";
  }
  if (lower.includes("comprimido revestido")) return "Comprimido Revestido";
  if (lower.includes("comprimido")) return "Comprimido";
  if (lower.includes("cápsula") || lower.includes("capsula")) return "Cápsula";
  if (lower.includes("solução oral") || lower.includes("solucao oral")) return "Solução Oral";
  if (lower.includes("suspensão") || lower.includes("suspensao")) return "Suspensão";
  return "Forma farmacêutica padronizada CEAF";
}

// 4. Leitura e Processamento dos Arquivos

console.log("[1/3] Lendo e filtrando tb_procedimento.txt (Grupo 06, Subgrupo 04 - CEAF)...");
const rawProcText = fs.readFileSync(fileProcedimento, "latin1");
const procLines = rawProcText.split(/\r?\n/).filter((l) => l.trim().length > 0);

const ceafProcedures = [];
let detectedCompetency = "Competência Atual";

for (const line of procLines) {
  let code = "";
  let name = "";
  let comp = "";

  if (line.includes(";") || line.includes("\t") || line.includes("|")) {
    const sep = line.includes(";") ? ";" : line.includes("\t") ? "\t" : "|";
    const parts = line.split(sep).map((p) => p.trim().replace(/^["']|["']$/g, ""));
    code = parts[0] || "";
    name = parts[1] || "";
    comp = parts[parts.length - 1] || "";
  } else {
    if (line.length >= 20) {
      code = line.substring(0, 10).trim();
      name = line.substring(10, Math.min(line.length, 260)).trim();
      if (line.length >= 370) {
        comp = line.substring(364, 370).trim();
      }
    }
  }

  if (isCEAF(code)) {
    if (comp && detectedCompetency === "Competência Atual") {
      detectedCompetency = comp;
    }
    ceafProcedures.push({
      code,
      name: formatMedicationName(name),
      competency: comp || detectedCompetency,
      pharmaceutical_form: extractPharmaceuticalForm(name),
    });
  }
}
console.log(`      ✓ ${ceafProcedures.length} medicamentos/apresentações do CEAF identificados.`);

console.log("[2/3] Lendo rl_procedimento_cid.txt (Relação Procedimento x CIDs dos PCDTs)...");
const rawRlText = fs.readFileSync(fileRlProcCid, "latin1");
const rlLines = rawRlText.split(/\r?\n/).filter((l) => l.trim().length > 0);

const procCidMap = new Map();
const relevantCids = new Set();
let totalRelations = 0;

for (const line of rlLines) {
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
    if (line.length >= 14) {
      procCode = line.substring(0, 10).trim();
      cidRaw = line.substring(10, 14).trim();
      isPrimary = line.length > 14 && line.substring(14, 15).toUpperCase() === "S";
    }
  }

  if (isCEAF(procCode) && cidRaw) {
    const formattedCid = formatCIDCode(cidRaw);
    if (!procCidMap.has(procCode)) {
      procCidMap.set(procCode, new Set());
    }
    procCidMap.get(procCode).add(formattedCid);
    relevantCids.add(formattedCid);
    totalRelations++;
  }
}
console.log(`      ✓ ${totalRelations} vínculos PCDT encontrados para ${relevantCids.size} CIDs únicos.`);

console.log("[3/3] Lendo tb_cid.txt (Descrições oficiais CID-10)...");
const rawCidText = fs.readFileSync(fileCid, "latin1");
const cidLines = rawCidText.split(/\r?\n/).filter((l) => l.trim().length > 0);

const cidDescriptions = new Map();

for (const line of cidLines) {
  let rawCode = "";
  let desc = "";

  if (line.includes(";") || line.includes("\t") || line.includes("|")) {
    const sep = line.includes(";") ? ";" : line.includes("\t") ? "\t" : "|";
    const parts = line.split(sep).map((p) => p.trim().replace(/^["']|["']$/g, ""));
    rawCode = parts[0] || "";
    desc = parts[1] || "";
  } else {
    if (line.length >= 4) {
      rawCode = line.substring(0, 4).trim();
      desc = line.substring(4, Math.min(line.length, 104)).trim();
    }
  }

  if (rawCode && desc) {
    const formatted = formatCIDCode(rawCode);
    cidDescriptions.set(formatted, desc);
  }
}

// 5. Montagem do Catálogo
const finalCids = Array.from(relevantCids).sort().map((code) => ({
  code,
  description: cidDescriptions.get(code) || `Patologia Protocolo Clínico PCDT (${code})`,
}));

const finalMedications = ceafProcedures.map((p) => ({
  sigtap_code: p.code,
  name: p.name,
  pharmaceutical_form: p.pharmaceutical_form,
  component: "CEAF",
  active: true,
  compatible_cid_codes: Array.from(procCidMap.get(p.code) || []),
}));

// 6. Geração do Arquivo SQL de Migração para o Supabase
const migrationsDir = path.join(rootDir, "supabase", "migrations");
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

const safeComp = detectedCompetency.replace(/\D/g, "") || "atual";
const migrationFile = path.join(migrationsDir, `sigtap_competencia_${safeComp}.sql`);

let sql = `-- ==============================================================================
-- PHARMACARE - ATUALIZAÇÃO DE COMPETÊNCIA SIGTAP / CEAF (${detectedCompetency})
-- Gerado em: ${new Date().toISOString()}
-- Total Medicamentos CEAF: ${finalMedications.length}
-- Total Diagnósticos PCDT (CIDs): ${finalCids.length}
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
`;

const cidSqlRows = finalCids.map((c) => {
  const code = c.code.replace(/'/g, "''");
  const desc = c.description.replace(/'/g, "''");
  return `    ('${code}', '${desc}', true)`;
});

sql += cidSqlRows.join(",\n");
sql += `\nON CONFLICT (code) DO UPDATE 
SET description = EXCLUDED.description, active = true;\n\n`;

sql += `-- 4. Inserção / Atualização dos Medicamentos Especializados (CEAF)\n`;
finalMedications.forEach((m) => {
  const code = (m.sigtap_code || "").replace(/'/g, "''");
  const name = m.name.replace(/'/g, "''");
  const form = (m.pharmaceutical_form || "").replace(/'/g, "''");
  sql += `INSERT INTO public.medications (sigtap_code, name, pharmaceutical_form, component, active)
SELECT '${code}', '${name}', '${form}', 'CEAF', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.medications WHERE sigtap_code = '${code}' OR LOWER(name) = LOWER('${name}')
);\n`;
});

fs.writeFileSync(migrationFile, sql, "utf-8");

// 7. Salva cópia JSON em data/
const dataDir = path.join(rootDir, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const catalogJsonFile = path.join(dataDir, "sigtap_ceaf_catalog.json");
fs.writeFileSync(
  catalogJsonFile,
  JSON.stringify(
    {
      competency: detectedCompetency,
      generatedAt: new Date().toISOString(),
      totals: {
        ceafMedications: finalMedications.length,
        pcdtCids: finalCids.length,
        pcdtRelations: totalRelations,
      },
      medications: finalMedications,
      cids: finalCids,
    },
    null,
    2
  ),
  "utf-8"
);

console.log("\n========================================================");
console.log("   INCORPORAÇÃO CONCLUÍDA COM SUCESSO!");
console.log("========================================================");
console.log(`Competência:              ${detectedCompetency}`);
console.log(`Medicamentos CEAF:        ${finalMedications.length}`);
console.log(`Diagnósticos CID-10 PCDT: ${finalCids.length}`);
console.log(`Relacionamentos Mapeados: ${totalRelations}`);
console.log(`\nArquivos Gerados:`);
console.log(` [SQL Migration]  ${migrationFile}`);
console.log(` [JSON Catálogo]  ${catalogJsonFile}`);
console.log("========================================================\n");
