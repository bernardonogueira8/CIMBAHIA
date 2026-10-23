import { NextResponse } from "next/server";
import { OFFICIAL_SUBSTANCE_PRECEDENTS, SubstancePrecedent } from "@/lib/precedents-data";
import { INITIAL_PROCESSOS } from "@/lib/mock-data";
import { Processo } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

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

// Stopwords farmacêuticas comuns para normalização inteligente de buscas
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

  const normTarget = normalize(target);
  const normQuery = normalize(query);

  if (!normQuery) return true;
  if (!normTarget) return false;

  // 1. Contém diretamente substring completa
  if (normTarget.includes(normQuery)) return true;
  if (normQuery.includes(normTarget) && normTarget.length >= 3 && !normTarget.includes("medicamento avaliado")) {
    return true;
  }

  // 2. Extrai tokens clínicos significativos do termo pesquisado
  const queryTokens = normQuery
    .split(/[\s,/-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !PHARMA_STOPWORDS.has(t) && !/^\d+$/.test(t));

  if (queryTokens.length === 0) {
    return normTarget.includes(normQuery);
  }

  // Todos os termos clínicos da busca devem estar presentes no nome da substância
  const allTokensMatch = queryTokens.every((tok) => normTarget.includes(tok));
  if (allTokensMatch) return true;

  // Se o usuário digitou nome composto/dosagem maior que o alvo cadastrado
  const targetTokens = normTarget
    .split(/[\s,/-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !PHARMA_STOPWORDS.has(t) && !/^\d+$/.test(t));

  if (targetTokens.length > 0 && targetTokens.every((tok) => normQuery.includes(tok))) {
    return true;
  }

  return false;
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
  const searchSubstancia = (params.substancia || "").trim();
  const searchQ = (params.q || "").trim();
  const searchCid = (params.cid || "").trim().toUpperCase();
  const filterStatus = (params.status || "").trim().toLowerCase();
  const limit = params.limit || 50;

  const effectiveTerm = searchSubstancia || searchQ;
  const normalizedEffectiveTerm = normalize(effectiveTerm);

  // 1. Localiza Precedente Oficial se houver algum cadastrado
  let matchedPrecedent: SubstancePrecedent | null = null;
  if (normalizedEffectiveTerm && OFFICIAL_SUBSTANCE_PRECEDENTS.length > 0) {
    matchedPrecedent =
      OFFICIAL_SUBSTANCE_PRECEDENTS.find((p) => {
        if (matchSubstance(p.substance, effectiveTerm)) return true;
        if (p.synonyms?.some((s) => matchSubstance(s, effectiveTerm))) return true;
        return false;
      }) || null;
  }

  // 2. Coleta pareceres dos processos reais
  const sourceProcessos = params.processos || INITIAL_PROCESSOS;
  const realProcessosResults: ParecerSearchResultItem[] = [];

  for (const proc of sourceProcessos) {
    const parecerVersion = proc.parecer?.active_version;
    const rawStatus = (parecerVersion?.regulatory_effect || proc.status || "pendente").toLowerCase();
    const hasParecerOuDecisao = Boolean(parecerVersion) || rawStatus !== "pendente";

    if (!hasParecerOuDecisao) continue;

    // Constrói lista de itens avaliados do processo
    type EvalItem = {
      id: string;
      substance: string;
      cid_code: string;
      cid_description?: string;
      status?: string;
      justification?: string;
      posology?: string;
      componente?: string;
    };

    const evaluatedItems: EvalItem[] = [];

    if (proc.items && proc.items.length > 0) {
      proc.items.forEach((item) => {
        const itemSubstance = item.farmaco_substancia || item.medication_name || "";
        if (itemSubstance.trim()) {
          evaluatedItems.push({
            id: item.id,
            substance: itemSubstance.trim(),
            cid_code: item.cid_code || "N/I",
            cid_description: item.cid_description,
            status: item.status,
            justification: item.justification || undefined,
            posology: item.posology || undefined,
            componente: item.medication_type === "ceaf" ? "CEAF / Especializado" : "Demanda Administrativa / Outro",
          });
        }
      });
    }

    // Se proc.items estiver vazio mas existir parecer emitido com texto consolidado
    if (evaluatedItems.length === 0 && parecerVersion?.technical_justification) {
      const fullText = parecerVersion.technical_justification;
      const medHeaderMatch = fullText.match(/Medicamentos?:\s*([^\n\r]+)/i);
      const itemMatches = Array.from(fullText.matchAll(/Item\s*\d*[:\s]*([^\n\r]+)/gi));
      const diagMatch = fullText.match(/Diagnóstico:\s*CID-10\s*([^\n\r]+)/i);
      const cidStr = diagMatch ? diagMatch[1].trim() : "N/I";
      const cidCode = cidStr.split(" ")[0].replace(/[^a-zA-Z0-9.]/g, "") || "N/I";

      const foundNames = new Set<string>();
      if (medHeaderMatch && medHeaderMatch[1]) {
        medHeaderMatch[1].split(/,|;/).forEach((s) => {
          const cleaned = s.trim();
          if (cleaned.length > 2) foundNames.add(cleaned);
        });
      }
      itemMatches.forEach((m) => {
        if (m[1]) {
          const cleaned = m[1].replace(/Diagnóstico.*/i, "").trim();
          if (cleaned.length > 2) foundNames.add(cleaned);
        }
      });

      if (foundNames.size > 0) {
        let idx = 0;
        foundNames.forEach((name) => {
          evaluatedItems.push({
            id: `proc-ext-${proc.id}-${idx++}`,
            substance: name,
            cid_code: cidCode,
            cid_description: cidStr,
            status: parecerVersion.regulatory_effect || "deferido",
            justification: fullText,
            componente: "Parecer Técnico Concluído",
          });
        });
      } else {
        // Fallback para o processo com parecer
        evaluatedItems.push({
          id: `proc-ext-${proc.id}-0`,
          substance: "Medicamento Avaliado em Parecer",
          cid_code: cidCode,
          cid_description: cidStr,
          status: parecerVersion.regulatory_effect || "deferido",
          justification: fullText,
          componente: "Parecer Técnico Concluído",
        });
      }
    }

    for (const item of evaluatedItems) {
      const itemSubstance = item.substance;

      // 1. Verificação por Substância Ativa / Fármaco / Medicamento (Estrita ao nome do medicamento)
      let matchesSubstancia = true;
      if (searchSubstancia) {
        matchesSubstancia = matchSubstance(itemSubstance, searchSubstancia);
      }

      // 2. Verificação por termo amplo Q (se fornecido expressamente para busca global)
      let matchesQ = true;
      if (searchQ) {
        const itemNormalized = normalize(itemSubstance);
        const descNormalized = normalize(item.cid_description || "");
        const seiNormalized = normalize(proc.numero_sei || "");
        const justNormalized = normalize(
          parecerVersion?.technical_justification || item.justification || ""
        );
        const normQ = normalize(searchQ);
        matchesQ =
          itemNormalized.includes(normQ) ||
          descNormalized.includes(normQ) ||
          seiNormalized.includes(normQ) ||
          justNormalized.includes(normQ);
      }

      // 3. Verificação por CID
      let matchesCid = true;
      if (searchCid) {
        const itemCidCode = (item.cid_code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
        const cleanSearchCid = searchCid.replace(/[^A-Z0-9]/g, "");
        const itemCidDesc = normalize(item.cid_description || "");
        matchesCid =
          itemCidCode.startsWith(cleanSearchCid) ||
          itemCidDesc.includes(normalize(searchCid));
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

      if (matchesSubstancia && matchesQ && matchesCid && matchesStatus && hasParecerOuDecisao) {
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
            "Farmacêutico Parecerista CIMBAHIA",
          crf: parecerVersion?.crf || "CRF-BA",
          substancia: itemSubstance,
          posologia: item.posology || undefined,
          componente: item.componente || "CEAF / Especializado",
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
      : searchSubstancia
        ? OFFICIAL_SUBSTANCE_PRECEDENTS.filter((p) =>
            matchSubstance(p.substance, searchSubstancia) ||
            p.synonyms?.some((s) => matchSubstance(s, searchSubstancia))
          )
        : searchQ
          ? OFFICIAL_SUBSTANCE_PRECEDENTS.filter((p) =>
              normalize(p.substance).includes(normalize(searchQ)) ||
              p.synonyms?.some((s) => normalize(s).includes(normalize(searchQ)))
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
          processo_sei: "Precedente Oficial Homologado (CIMBAHIA / SESAB)",
          data: "2026-10-01",
          farmaceutico: "Câmara Técnica de Farmacologia Clínica CIMBAHIA",
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
      termo: searchQ || undefined,
      substancia: searchSubstancia || undefined,
      cid: searchCid || undefined,
      status: filterStatus || undefined,
    },
    total: allResults.length,
    estatisticas: {
      substancia_identificada: matchedPrecedent?.substance || (searchSubstancia || searchQ || null),
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

async function fetchProcessosFromSupabase(): Promise<Processo[]> {
  try {
    const supabase = await createClient();
    const { data: procsData } = await supabase
      .from("cb_processos")
      .select(`
        *,
        items:cb_processo_items (*),
        pareceres:cb_pareceres (
          *,
          versoes:cb_parecer_versoes (*)
        )
      `)
      .order("created_at", { ascending: false });

    if (procsData && procsData.length > 0) {
      return procsData.map((row: any) => {
        let activeParecer = undefined;
        if (row.pareceres && row.pareceres.length > 0) {
          const p = row.pareceres[0];
          const sortedVersoes = (p.versoes || []).sort(
            (a: any, b: any) => b.version_number - a.version_number
          );
          if (sortedVersoes.length > 0) {
            activeParecer = {
              id: p.id,
              processo_id: row.id,
              active_version: sortedVersoes[0],
              versions_history: sortedVersoes.slice(1),
            };
          }
        }
        return {
          ...row,
          items: row.items || [],
          parecer: activeParecer,
        };
      });
    }
  } catch (err) {
    console.warn("API Pareceres: falha ao buscar do Supabase:", err);
  }
  return [];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const substancia = searchParams.get("substancia") || searchParams.get("farmaco");
  const q = searchParams.get("q");
  const cid = searchParams.get("cid");
  const status = searchParams.get("status");
  const limitParam = searchParams.get("limit");

  const limit = limitParam ? parseInt(limitParam, 10) : 50;

  const processos = await fetchProcessosFromSupabase();

  const result = executePareceresSearch({
    substancia,
    q,
    cid,
    status,
    limit,
    processos,
  });

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const substancia = body.substancia || body.farmaco;
    const q = body.q;
    const cid = body.cid;
    const status = body.status;
    const limit = body.limit ? parseInt(body.limit, 10) : 50;

    let processos: Processo[] | undefined =
      Array.isArray(body.processos) && body.processos.length > 0
        ? body.processos
        : undefined;

    if (!processos || processos.length === 0) {
      processos = await fetchProcessosFromSupabase();
    }

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
