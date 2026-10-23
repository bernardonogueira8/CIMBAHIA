import { NextResponse } from "next/server";
import { OFFICIAL_SUBSTANCE_PRECEDENTS, SubstancePrecedent } from "@/lib/precedents-data";
import { INITIAL_PROCESSOS } from "@/lib/mock-data";
import { Processo } from "@/lib/types";

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
  precedente_oficial: SubstancePrecedent | null;
  respostas: ParecerSearchResultItem[];
}

// Normalizador de texto para busca fonética/case-insensitive
function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Motor central de busca de pareceres e fundamentações por substância/CID/status
 */
export function executePareceresSearch(params: {
  substancia?: string | null;
  q?: string | null;
  cid?: string | null;
  status?: string | null;
  limit?: number;
  processos?: Processo[];
}): ParecerSearchResponse {
  const searchTerm = (params.q || params.substancia || "").trim();
  const searchCid = (params.cid || "").trim().toUpperCase();
  const filterStatus = (params.status || "").trim().toLowerCase();
  const limit = params.limit || 50;

  const normalizedTerm = normalize(searchTerm);

  // 1. Localiza Precedente Oficial se houver algum cadastrado
  let matchedPrecedent: SubstancePrecedent | null = null;
  if (normalizedTerm && OFFICIAL_SUBSTANCE_PRECEDENTS.length > 0) {
    matchedPrecedent =
      OFFICIAL_SUBSTANCE_PRECEDENTS.find((p) => {
        if (normalize(p.substance).includes(normalizedTerm)) return true;
        if (p.synonyms?.some((s) => normalize(s).includes(normalizedTerm))) return true;
        return false;
      }) || null;
  }

  // 2. Coleta pareceres dos processos reais
  const sourceProcessos = params.processos || INITIAL_PROCESSOS;
  const realProcessosResults: ParecerSearchResultItem[] = [];

  for (const proc of sourceProcessos) {
    if (!proc.items || proc.items.length === 0) continue;

    for (const item of proc.items) {
      const itemSubstance =
        item.farmaco_substancia ||
        item.medication_name ||
        "";
      const itemNormalized = normalize(itemSubstance);

      const parecerVersion = proc.parecer?.active_version;

      // Verificação por substância / termo (desconsiderando acentos e caixa)
      let matchesTerm = true;
      if (normalizedTerm) {
        const descNormalized = normalize(item.cid_description || "");
        const seiNormalized = normalize(proc.numero_sei || "");
        const justNormalized = normalize(
          parecerVersion?.technical_justification || item.justification || ""
        );
        matchesTerm =
          itemNormalized.includes(normalizedTerm) ||
          normalizedTerm.includes(itemNormalized) ||
          descNormalized.includes(normalizedTerm) ||
          seiNormalized.includes(normalizedTerm) ||
          justNormalized.includes(normalizedTerm);
      }

      // Verificação por CID
      let matchesCid = true;
      if (searchCid) {
        matchesCid = item.cid_code.toUpperCase().startsWith(searchCid);
      }

      const rawStatus = (item.status || parecerVersion?.regulatory_effect || proc.status || "pendente").toLowerCase();
      
      // Mapeia para os 4 status técnicos
      let itemStatus: "deferido" | "indeferido" | "em_exigencia" | "deferido_parcial" = "deferido";
      if (rawStatus.includes("indeferid")) {
        itemStatus = "indeferido";
      } else if (rawStatus.includes("exigencia") || rawStatus.includes("diligencia")) {
        itemStatus = "em_exigencia";
      } else if (rawStatus.includes("parcial")) {
        itemStatus = "deferido_parcial";
      } else if (rawStatus.includes("deferid") || rawStatus === "concluido_deferido") {
        itemStatus = "deferido";
      }

      // Verificação por Status
      let matchesStatus = true;
      if (filterStatus && filterStatus !== "all") {
        matchesStatus = itemStatus === filterStatus;
      }

      // Inclui apenas se houver parecer emitido ou desfecho definido
      const hasParecerOuDecisao = Boolean(parecerVersion) || rawStatus !== "pendente";

      if (matchesTerm && matchesCid && matchesStatus && hasParecerOuDecisao) {
        // 1. Extrai a fundamentação técnica específica do fármaco + CID para este paciente
        let specificJustification = (item.justification || "").trim();

        // Se item.justification estiver vazio, tenta extrair a seção específica do item dentro do parecer consolidado
        if (!specificJustification && parecerVersion?.technical_justification) {
          const fullText = parecerVersion.technical_justification;
          const farmacoEscaped = itemSubstance.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const regex = new RegExp(
            `(?:Item\\s*\\d*[:\\s]*${farmacoEscaped}[\\s\\S]*?Fundamenta[çc][aã]o\\s*T[eé]cnica[:\\s]*)([\\s\\S]*?)(?=(?:\\nItem\\s*\\d*|Diante do exame|Certos da|Atenciosamente|$))`,
            "i"
          );
          const match = fullText.match(regex);
          if (match && match[1] && match[1].trim()) {
            specificJustification = match[1].trim();
          }
        }

        // Se ainda não encontrado, usa o parecer geral como último recurso
        if (!specificJustification) {
          specificJustification =
            parecerVersion?.technical_justification ||
            "Avaliação farmacêutica e clínica baseada no protocolo vigente e documentação médica apresentada.";
        }

        realProcessosResults.push({
          id: `real-${proc.id}-${item.id}`,
          origem: "processo_real",
          processo_sei: proc.numero_sei,
          paciente_nome: proc.paciente?.full_name || "Não informado",
          data: (parecerVersion?.created_at ? parecerVersion.created_at.split("T")[0] : proc.data_abertura),
          farmaceutico:
            parecerVersion?.pharmacist_name ||
            proc.assigned_pharmacist?.full_name ||
            "Farmacêutico Parecerista CimBahia",
          crf: parecerVersion?.crf || "CRF-BA",
          substancia: itemSubstance,
          posologia: item.posology || undefined,
          componente: item.medication_type === "ceaf" ? "CEAF / Especializado" : "Demanda Administrativa / Outro",
          cid_code: item.cid_code,
          cid_description: item.cid_description,
          status: itemStatus,
          titulo:
            parecerVersion?.tipo_parecer_title ||
            (itemStatus === "deferido"
              ? "Parecer Técnico Favorável (Deferido)"
              : itemStatus === "indeferido"
              ? "Parecer Técnico Desfavorável (Indeferido)"
              : "Diligência Documental Emitida"),
          pcdt_referencia:
            matchedPrecedent?.pcdt_reference ||
            "Protocolo Clínico e Diretrizes Terapêuticas (SAS/MS - SESAB)",
          fundamentacao_tecnica: specificJustification,
          parecer_consolidado: parecerVersion?.technical_justification || undefined,
          recomendacoes: parecerVersion?.recommendations || undefined,
        });
      }
    }
  }

  // 3. Precedentes homologados (se houver)
  const precedentResults: ParecerSearchResultItem[] = [];
  if (OFFICIAL_SUBSTANCE_PRECEDENTS.length > 0) {
    const precedentsToScan = matchedPrecedent
      ? [matchedPrecedent]
      : normalizedTerm
      ? OFFICIAL_SUBSTANCE_PRECEDENTS.filter((p) =>
          normalize(p.substance).includes(normalizedTerm) ||
          p.synonyms?.some((s) => normalize(s).includes(normalizedTerm))
        )
      : OFFICIAL_SUBSTANCE_PRECEDENTS;

    for (const prec of precedentsToScan) {
      const statusesToInclude: ("deferido" | "indeferido" | "em_exigencia")[] = [
        "deferido",
        "indeferido",
        "em_exigencia",
      ];

      for (const st of statusesToInclude) {
        if (filterStatus && filterStatus !== "all" && filterStatus !== st) continue;
        const ans = prec.answers?.[st];
        if (!ans) continue;

        let repCid = prec.applicable_cids[0] || { code: "N/I", description: "Diagnóstico Clínico" };
        if (searchCid) {
          const foundCid = prec.applicable_cids.find((c) =>
            c.code.toUpperCase().startsWith(searchCid)
          );
          if (foundCid) repCid = foundCid;
        }

        precedentResults.push({
          id: `prec-${prec.id}-${st}`,
          origem: "precedente_oficial",
          processo_sei: "Precedente Oficial Homologado (CimBahia / SESAB)",
          data: "2026-10-01",
          farmaceutico: "Câmara Técnica de Farmacologia Clínica CimBahia",
          crf: "Comissão Permanente de Pareceres",
          substancia: prec.substance,
          componente: prec.component,
          cid_code: repCid.code,
          cid_description: repCid.description,
          status: st,
          titulo: ans.title,
          pcdt_referencia: prec.pcdt_reference,
          fundamentacao_tecnica: ans.fundamentacao,
          recomendacoes: ans.recomendacoes,
          criterios_chave: ans.criterios_chave,
        });
      }
    }
  }

  const allResults = [...realProcessosResults, ...precedentResults].slice(0, limit);

  // Calcula estatísticas reais com base nas decisões encontradas
  const totalReal = allResults.length;
  const deferidosCount = allResults.filter((r) => r.status === "deferido" || r.status === "deferido_parcial").length;
  const indeferidosCount = allResults.filter((r) => r.status === "indeferido").length;
  const exigenciasCount = allResults.filter((r) => r.status === "em_exigencia").length;

  const approvalRate = totalReal > 0 ? Math.round((deferidosCount / totalReal) * 100) : 0;
  const indeferimentoRate = totalReal > 0 ? Math.round((indeferidosCount / totalReal) * 100) : 0;
  const exigenciaRate = totalReal > 0 ? Math.round((exigenciasCount / totalReal) * 100) : 0;

  const uniqueCids = Array.from(new Set(allResults.map((r) => r.cid_code))).slice(0, 5);

  return {
    query: {
      termo: searchTerm || undefined,
      substancia: params.substancia || undefined,
      cid: searchCid || undefined,
      status: filterStatus || undefined,
    },
    total: allResults.length,
    estatisticas: {
      substancia_identificada: matchedPrecedent?.substance || (searchTerm ? searchTerm : null),
      pcdt_referencia: matchedPrecedent?.pcdt_reference || null,
      taxa_deferimento_estimada: `${approvalRate}%`,
      taxa_indeferimento_estimada: `${indeferimentoRate}%`,
      taxa_exigencia_estimada: `${exigenciaRate}%`,
      total_avaliacoes_base: allResults.length,
      principais_cids: uniqueCids,
      tempo_medio_analise_dias: totalReal > 0 ? 3 : 0,
    },
    precedente_oficial: matchedPrecedent,
    respostas: allResults,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const substancia = searchParams.get("substancia") || searchParams.get("farmaco");
  const q = searchParams.get("q");
  const cid = searchParams.get("cid");
  const status = searchParams.get("status");
  const limitParam = searchParams.get("limit");

  const limit = limitParam ? parseInt(limitParam, 10) : 50;

  const result = executePareceresSearch({
    substancia,
    q,
    cid,
    status,
    limit,
  });

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const substancia = body.substancia || body.farmaco || body.q;
    const q = body.q;
    const cid = body.cid;
    const status = body.status;
    const limit = body.limit ? parseInt(body.limit, 10) : 50;
    const processos: Processo[] | undefined = Array.isArray(body.processos) ? body.processos : undefined;

    const result = executePareceresSearch({
      substancia,
      q,
      cid,
      status,
      limit,
      processos,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Erro ao processar busca de pareceres", message: err.message },
      { status: 400 }
    );
  }
}
