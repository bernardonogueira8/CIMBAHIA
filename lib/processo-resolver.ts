import { Processo, ProcessoItem } from "@/lib/types";

/**
 * Normaliza e traduz termos livres de parecer/desfecho para os status canônicos
 */
export function parseRegulatoryStatus(str?: string | null): ProcessoItem["status"] | null {
  if (!str) return null;
  const s = str.toLowerCase();
  if (s.includes("indeferid")) return "indeferido";
  if (
    s.includes("exigencia") ||
    s.includes("exigência") ||
    s.includes("diligencia") ||
    s.includes("diligência")
  ) {
    return "em_exigencia";
  }
  if (s.includes("parcial")) return "deferido_parcial";
  if (s.includes("deferid")) return "deferido";
  return null;
}

/**
 * Extrai e resolve cirurgicamente os itens e deliberações individuais de um processo,
 * garantindo compatibilidade total com o passivo histórico registrado e laudos consolidados.
 */
export function resolveProcessoItems(proc: Processo | any): ProcessoItem[] {
  if (!proc) return [];

  const activeParecer =
    proc.parecer?.active_version ||
    (proc.pareceres && proc.pareceres[0]?.versoes?.[0]) ||
    null;

  const rawProcessoStatus = (proc.status || "").toLowerCase();
  const fullText: string = (
    activeParecer?.technical_justification ||
    activeParecer?.clinical_foundation ||
    ""
  ).trim();

  const defaultStatus: ProcessoItem["status"] =
    (activeParecer?.regulatory_effect as any) ||
    parseRegulatoryStatus(rawProcessoStatus) ||
    (rawProcessoStatus.includes("concluido") || rawProcessoStatus === "homologado"
      ? "deferido"
      : undefined);

  // Helper para recortar status e fundamentação individual para um fármaco no texto do laudo
  const extractItemDetailsFromText = (farmacoName: string) => {
    if (!fullText) return { status: null, justification: null };

    const escaped = farmacoName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const blockRegex = new RegExp(
      `(?:Item\\s*\\d*[:\\s]*${escaped}[\\s\\S]*?)(?=(?:\\n\\s*Item\\s*\\d*[:\\s]|Diante do exame|Certos da|Atenciosamente|$))`,
      "i"
    );
    const blockMatch = fullText.match(blockRegex);
    const blockText = blockMatch ? blockMatch[0] : "";

    let itemStatus: ProcessoItem["status"] | null = null;
    let itemJustification: string | null = null;

    if (blockText) {
      // 1. Procura "Conclusão do Item: [INDEFERIDO]" etc.
      const conclusaoMatch = blockText.match(
        /Conclus[aã]o(?:\s*do\s*Item)?[:\s]*\[?([^\]\r\n]+)\]?/i
      );
      if (conclusaoMatch && conclusaoMatch[1]) {
        itemStatus = parseRegulatoryStatus(conclusaoMatch[1]);
      }

      // 2. Procura a Fundamentação Técnica exclusiva
      const fundMatch = blockText.match(
        /Fundamenta[çc][aã]o\s*T[eé]cnica[:\s]*([\s\S]*?)(?=(?:\n\s*Item\s*\d*|Diante do exame|Certos da|Atenciosamente|$))/i
      );
      if (fundMatch && fundMatch[1]?.trim()) {
        itemJustification = fundMatch[1].trim();
      }
    }

    return { status: itemStatus, justification: itemJustification };
  };

  // CASO 1: Se o processo já tem itens registrados na tabela
  if (proc.items && proc.items.length > 0) {
    return proc.items.map((item: ProcessoItem) => {
      const farmacoName = item.farmaco_substancia || item.medication_name || "";
      const { status: parsedStatus, justification: parsedJust } =
        extractItemDetailsFromText(farmacoName);

      const resolvedStatus =
        item.status && item.status !== "pendente"
          ? item.status
          : parsedStatus || defaultStatus || "deferido";

      const resolvedJustification =
        item.justification && item.justification.trim().length > 0
          ? item.justification
          : parsedJust || (proc.items.length === 1 ? fullText : null);

      return {
        ...item,
        status: resolvedStatus,
        justification: resolvedJustification || undefined,
        evaluated_by:
          item.evaluated_by ||
          activeParecer?.pharmacist_name ||
          proc.assigned_pharmacist?.full_name ||
          undefined,
        evaluated_at:
          item.evaluated_at ||
          activeParecer?.created_at ||
          proc.updated_at ||
          undefined,
      };
    });
  }

  // CASO 2: Processo do passivo registrado sem itens em cb_processo_items,
  // mas com laudo estruturado no parecer técnico
  if (fullText) {
    const itemBlockRegex =
      /Item\s*(\d+)[:\s]*([^\n\r]+)([\s\S]*?)(?=(?:\n\s*Item\s*\d+[:\s]|Diante do exame|Certos da|Atenciosamente|$))/gi;
    const itemBlocks: RegExpMatchArray[] = Array.from(fullText.matchAll(itemBlockRegex));

    if (itemBlocks.length > 0) {
      return itemBlocks.map((match: RegExpMatchArray, idx: number) => {
        const itemNumber = match[1];
        const rawName = match[2].trim().replace(/Diagn[oó]stico.*/i, "").trim();
        const content = match[3];

        // Extrai CID e descrição
        const diagMatch = content.match(
          /Diagn[oó]stico[:\s]*(?:CID-10)?\s*([^\n\r]+)/i
        );
        const diagStr = diagMatch ? diagMatch[1].trim() : "N/I";
        const cidCodeMatch = diagStr.match(/([A-Z]\d{2}(?:\.\d{1,2})?)/i);
        const cidCode = cidCodeMatch
          ? cidCodeMatch[1]
          : diagStr.split(" ")[0].replace(/[^a-zA-Z0-9.]/g, "") || "N/I";

        // Extrai status individual daquele item
        const conclusaoMatch = content.match(
          /Conclus[aã]o(?:\s*do\s*Item)?[:\s]*\[?([^\]\r\n]+)\]?/i
        );
        const itemStatus =
          conclusaoMatch && conclusaoMatch[1]
            ? parseRegulatoryStatus(conclusaoMatch[1])
            : defaultStatus || "deferido";

        // Extrai fundamentação exclusiva daquele item
        const fundMatch = content.match(
          /Fundamenta[çc][aã]o\s*T[eé]cnica[:\s]*([\s\S]*?)$/i
        );
        const itemJustification =
          fundMatch && fundMatch[1]?.trim()
            ? fundMatch[1].trim()
            : content.trim();

        return {
          id: `virtual-item-${proc.id}-${itemNumber || idx}`,
          processo_id: proc.id,
          medication_type: "ceaf",
          medication_name: rawName,
          farmaco_substancia: rawName,
          cid_code: cidCode,
          cid_description: diagStr,
          cid_nao_informado: cidCode === "N/I",
          status: itemStatus || "deferido",
          justification: itemJustification,
          evaluated_by:
            activeParecer?.pharmacist_name ||
            proc.assigned_pharmacist?.full_name ||
            "Farmacêutico Parecerista",
          evaluated_at: activeParecer?.created_at || proc.updated_at,
          created_at: proc.created_at,
        };
      });
    }

    // Se não há blocos "Item X:", tenta pela lista no cabeçalho "Medicamentos: A, B, C"
    const medHeaderMatch = fullText.match(/Medicamentos?:\s*([^\n\r]+)/i);
    const diagHeaderMatch = fullText.match(
      /Diagn[oó]stico[:\s]*(?:CID-10)?\s*([^\n\r]+)/i
    );
    const defaultCid = diagHeaderMatch ? diagHeaderMatch[1].trim() : "N/I";

    if (medHeaderMatch && medHeaderMatch[1]) {
      const names = medHeaderMatch[1]
        .split(/,|;/)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 2);

      if (names.length > 0) {
        return names.map((name: string, idx: number) => {
          const { status: parsedStatus, justification: parsedJust } =
            extractItemDetailsFromText(name);
          return {
            id: `virtual-item-${proc.id}-${idx}`,
            processo_id: proc.id,
            medication_type: "ceaf",
            medication_name: name,
            farmaco_substancia: name,
            cid_code:
              defaultCid.split(" ")[0].replace(/[^a-zA-Z0-9.]/g, "") || "N/I",
            cid_description: defaultCid,
            cid_nao_informado: defaultCid === "N/I",
            status: parsedStatus || defaultStatus || "deferido",
            justification: parsedJust || fullText,
            evaluated_by:
              activeParecer?.pharmacist_name || "Farmacêutico Parecerista",
            evaluated_at: activeParecer?.created_at || proc.updated_at,
            created_at: proc.created_at,
          };
        });
      }
    }
  }

  return [];
}
