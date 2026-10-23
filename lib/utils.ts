import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCPF(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
}

/**
 * Converte data para formato legível brasileiro (DD/MM/AAAA).
 * Lida com 'YYYY-MM-DD', ISO strings ('2026-10-22T15:34:15.189Z') e timestamps.
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";

  // Se já estiver no formato brasileiro DD/MM/AAAA
  if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) {
    return dateStr.split(" ")[0];
  }

  // Se contiver 'T' ou espaço, extrai a parte da data
  const rawDate = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr.split(" ")[0];
  const parts = rawDate.split("-");
  if (parts.length === 3 && parts[0].length === 4) {
    const year = parts[0];
    const month = parts[1].padStart(2, "0");
    const day = parts[2].padStart(2, "0");
    return `${day}/${month}/${year}`;
  }

  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("pt-BR", { timeZone: "America/Bahia" });
    }
  } catch {
    // fallback
  }

  return dateStr;
}

/**
 * Converte data e hora para formato legível brasileiro (DD/MM/AAAA às HH:mm).
 * Ideal para logs de auditoria e timestamps de ações.
 */
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";

  // Se for apenas uma data sem horário (YYYY-MM-DD)
  if (!dateStr.includes("T") && !dateStr.includes(":") && !dateStr.includes(" ")) {
    return formatDate(dateStr);
  }

  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const datePart = d.toLocaleDateString("pt-BR", { timeZone: "America/Bahia" });
      const timePart = d.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Bahia",
      });
      return `${datePart} às ${timePart}`;
    }
  } catch {
    // fallback
  }

  return formatDate(dateStr);
}

/**
 * Traduz o status do processo para um rótulo legível em português sem sublinhados (_).
 * Exemplo: "em_analise_farmaceutica" -> "Em Análise Farmacêutica"
 */
export function formatStatusLabel(status: string | null | undefined): string {
  if (!status) return "Não Informado";

  const statusMap: Record<string, string> = {
    triagem: "Triagem",
    aguardando_triagem: "Triagem",
    em_triagem: "Em Triagem",
    observacao: "Em Observação",
    em_observacao: "Em Observação",
    aguardando_parecer: "Aguardando Parecer",
    em_analise: "Em Análise Farmacêutica",
    em_analise_farmaceutica: "Em Análise Farmacêutica",
    em_exigencia: "Em Exigência",
    concluido: "Concluído",
    concluido_deferido: "Concluído (Deferido)",
    concluido_indeferido: "Concluído (Indeferido)",
    concluido_parcial: "Concluído (Parcial)",
    deferido: "Deferido",
    indeferido: "Indeferido",
    deferido_parcial: "Deferido Parcial",
  };

  const normalized = status.toLowerCase().trim();
  if (statusMap[normalized]) {
    return statusMap[normalized];
  }

  // Fallback genérico: substitui underscores por espaços e capitaliza palavras
  return normalized
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Normaliza um texto para busca desconsiderando acentuação, diacríticos e caixa alta/baixa.
 * Exemplo: "Ácido Valpróico" -> "acido valproico"
 * Exemplo: "Vitória da Conquista" -> "vitoria da conquista"
 */
export function normalizeText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Verifica se um texto alvo contém a consulta (query), ignorando acentos e maiúsculas/minúsculas.
 * Suporta busca por termos individuais ou múltiplos termos em qualquer ordem.
 */
export function matchNormalized(
  target: string | null | undefined,
  query: string | null | undefined
): boolean {
  if (!query || !query.trim()) return true;
  if (!target) return false;
  const normTarget = normalizeText(target);
  const normQuery = normalizeText(query);
  if (normTarget.includes(normQuery)) return true;
  const tokens = normQuery.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    return tokens.every((tok) => normTarget.includes(tok));
  }
  return false;
}

const PHARMA_STOPWORDS = new Set([
  "de", "do", "da", "dos", "das", "e", "em", "para", "com", "sem",
  "mg", "ml", "g", "mcg", "ui", "comprimido", "comprimidos",
  "capsula", "capsulas", "frasco", "ampola", "solucao", "injetavel",
  "gotas", "xarope", "suspensao", "creme", "pomada", "gel", "po"
]);

/**
 * Realiza correspondência clínica flexível e precisa para nomes de substâncias / fármacos
 */
export function matchSubstance(target: string | null | undefined, query: string | null | undefined): boolean {
  if (!query || !query.trim()) return true;
  if (!target) return false;

  const normTarget = normalizeText(target);
  const normQuery = normalizeText(query);

  if (!normQuery) return true;
  if (!normTarget) return false;

  if (normTarget.includes(normQuery)) return true;
  if (normQuery.includes(normTarget) && normTarget.length >= 3 && !normTarget.includes("medicamento avaliado")) {
    return true;
  }

  const queryTokens = normQuery
    .split(/[\s,/-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !PHARMA_STOPWORDS.has(t) && !/^\d+$/.test(t));

  if (queryTokens.length === 0) {
    return normTarget.includes(normQuery);
  }

  return queryTokens.every((tok) => normTarget.includes(tok));
}



