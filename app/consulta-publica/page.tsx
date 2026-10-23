"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Scale,
  ShieldCheck,
  Pill,
  BookOpen,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Building2,
  FileText,
  Download,
  Eye,
  Printer,
  Sparkles,
  HelpCircle,
  X,
  ChevronRight,
  Info,
  Calendar,
  Building,
  HeartHandshake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/lib/context/AppContext";
import { Processo, ProcessoItem } from "@/lib/types";
import { formatDate, matchNormalized, normalizeText, matchSubstance } from "@/lib/utils";
import { calculatePatientAgeAtEvaluation } from "@/lib/patient-age";

// ==============================================================================
// ALGORITMO DE DISTÂNCIA LEVENSHTEIN PARA TOLERÂNCIA A ERROS DE DIGITAÇÃO
// ==============================================================================
function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

// Catálogo de termos farmacêuticos e diagnósticos populares do SUS para sugestão
const VOCABULARIO_SUGESTOES = [
  "Adalimumabe",
  "Canabidiol",
  "Insulina",
  "Metformina",
  "Somatropina",
  "Rituximabe",
  "Infliximabe",
  "Secuquinumabe",
  "Levotiroxina",
  "Losartana",
  "Omeprazol",
  "Etoricoxibe",
  "Dapagliflozina",
  "Empagliflozina",
  "Tocilizumabe",
  "Dupilumabe",
  "Fentanila",
  "Morfina",
  "Pregabalina",
  "Gabapentina",
  "Metotrexato",
  "Leflunomida",
  "Hidroxicloroquina",
  "Diabetes",
  "Artrite",
  "Esclerose",
  "Psoriase",
  "Crohn",
  "Asma",
  "Epilepsia",
  "Lupus",
  "Hipertensao",
  "Colite",
  "Dor Cronica",
  "Fibromialgia",
];

// Estrutura plana para cada item/parecer consultável
interface ParecerConsultaItem {
  id: string;
  processoId: string;
  numeroSei: string;
  dataConclusao: string;
  dataAbertura: string;
  origemDemanda: string;
  baseRegional: string;
  macroregiao: string;
  municipioResidencia: string;
  // Paciente
  idadeFormatada: string;
  sexoFormatado: string;
  faixaEtariaLabel: string;
  // Tecnologia / Medicamento
  cidCodigo: string;
  cidDescricao: string;
  farmacoNome: string;
  substanciaAtiva: string;
  statusConclusao: "deferido" | "indeferido" | "em_exigencia" | "deferido_parcial" | "pendente";
  statusLabel: string;
  fundamentacao: string;
  recomendacoes?: string | null;
  farmaceuticoResponsavel?: string;
  crfResponsavel?: string;
  processoRef: Processo;
  itemRef: ProcessoItem;
}

export default function ConsultaPublicaPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const { processos: processosContext, farmacos, cids } = useApp();

  // O contexto inicializa `processos` a partir do localStorage no cliente, o que difere
  // do HTML do servidor. Só usamos os dados reais após a montagem para evitar hydration mismatch.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  const processos = useMemo(
    () => (isMounted ? processosContext : []),
    [isMounted, processosContext]
  );

  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedParecer, setSelectedParecer] = useState<ParecerConsultaItem | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [didYouMean, setDidYouMean] = useState<string | null>(null);

  useEffect(() => {
    if (initialQuery) {
      setSearchTerm(initialQuery);
    }
  }, [initialQuery]);

  // Monta o índice de pareceres concluídos ou emitidos
  const pareceresList: ParecerConsultaItem[] = useMemo(() => {
    const list: ParecerConsultaItem[] = [];

    processos.forEach((p) => {
      // Considera processos com parecer ativo ou concluídos
      const dataConclusao =
        p.parecer?.active_version?.created_at ||
        (p.status === "concluido" ? p.data_abertura : null);

      const items = p.items || [];
      const activeParecer = p.parecer?.active_version;

      // Idade e Sexo do Paciente
      const evalDate = dataConclusao || p.data_abertura || new Date().toISOString();
      const ageInfo = calculatePatientAgeAtEvaluation(p.paciente?.birth_date, evalDate);
      const sexo =
        p.paciente?.gender === "M"
          ? "Masculino"
          : p.paciente?.gender === "F"
          ? "Feminino"
          : "Não informado";

      const cidade = p.municipio?.name
        ? `${p.municipio.name} - BA`
        : "Município da Bahia";

      const base =
        p.unidade?.name ||
        p.municipio?.brs_name ||
        "Base Regional de Saúde (SESAB)";

      const macro =
        p.unidade?.macroregion ||
        p.municipio?.macroregion ||
        "Macrorregião de Saúde da Bahia";

      const origem =
        p.origem?.name ||
        (p.priority === "judicial" ? "Mandado Judicial" : "Demanda Administrativa SUS");

      items.forEach((item, index) => {
        const itemStatus = item.status || activeParecer?.regulatory_effect || "deferido";
        const farmaco = item.farmaco_substancia || item.medication_name || "Medicamento Especializado";
        const substancia = item.farmaco_substancia || item.medication_name || farmaco;

        let statusAmigavel = "Aprovado (Deferido)";
        if (itemStatus === "indeferido") statusAmigavel = "Não Aprovado (Indeferido)";
        else if (itemStatus === "em_exigencia") statusAmigavel = "Pendente de Documentação";
        else if (itemStatus === "deferido_parcial") statusAmigavel = "Aprovado Parcialmente";

        const fundamentacao =
          item.justification ||
          activeParecer?.technical_justification ||
          "Avaliação clínica e farmacológica realizada com base na RENAME, Protocolos Clínicos e Diretrizes Terapêuticas (PCDT) do Ministério da Saúde e pareceres da CONITEC.";

        list.push({
          id: `${p.id}-${item.id || index}`,
          processoId: p.id,
          numeroSei: p.numero_sei,
          dataConclusao: dataConclusao || p.data_abertura,
          dataAbertura: p.data_abertura,
          origemDemanda: origem,
          baseRegional: base,
          macroregiao: macro,
          municipioResidencia: cidade,
          idadeFormatada: ageInfo.idadeFormatada || "Não informada",
          sexoFormatado: sexo,
          faixaEtariaLabel: ageInfo.faixaEtariaLabel || "Adulto",
          cidCodigo: item.cid_code || "N/I",
          cidDescricao: item.cid_description || "Diagnóstico Clínico Especializado",
          farmacoNome: farmaco,
          substanciaAtiva: substancia,
          statusConclusao: itemStatus as any,
          statusLabel: statusAmigavel,
          fundamentacao: fundamentacao,
          recomendacoes: activeParecer?.recommendations || null,
          farmaceuticoResponsavel:
            item.evaluated_by ||
            activeParecer?.pharmacist_name ||
            "Comissão Farmacêutica CIMBAHIA",
          crfResponsavel: activeParecer?.crf || "CRF-BA",
          processoRef: p,
          itemRef: item,
        });
      });
    });

    return list;
  }, [processos]);

  // Vocabulário dinâmico expandido para sugestão de busca (inclui o que está no banco)
  const vocabularioDinamico = useMemo(() => {
    const setWords = new Set<string>(VOCABULARIO_SUGESTOES);
    farmacos.forEach((f) => {
      const parts = f.name.split(/[\s,/-]+/);
      parts.forEach((p) => {
        if (p.length > 3) setWords.add(p);
      });
    });
    cids.forEach((c) => {
      const parts = c.description.split(/[\s,/-]+/);
      parts.forEach((p) => {
        if (p.length > 3) setWords.add(p);
      });
    });
    pareceresList.forEach((it) => {
      setWords.add(it.farmacoNome);
      setWords.add(it.substanciaAtiva);
    });
    return Array.from(setWords);
  }, [farmacos, cids, pareceresList]);

  // Inteligência de Detecção de Typos / "Você quis dizer?"
  useEffect(() => {
    const raw = searchTerm.trim();
    if (!raw || raw.length < 3) {
      setDidYouMean(null);
      return;
    }

    const normInput = normalizeText(raw).toLowerCase();

    // Se já houver correspondência exata na lista, não sugere
    const hasExactMatch = pareceresList.some(
      (p) =>
        normalizeText(p.farmacoNome).toLowerCase().includes(normInput) ||
        normalizeText(p.substanciaAtiva).toLowerCase().includes(normInput) ||
        normalizeText(p.cidCodigo).toLowerCase().includes(normInput) ||
        normalizeText(p.cidDescricao).toLowerCase().includes(normInput)
    );

    if (hasExactMatch) {
      setDidYouMean(null);
      return;
    }

    // Procura a palavra mais próxima no vocabulário com distância <= 2
    let bestCandidate: string | null = null;
    let minDistance = 3; // aceita até 2 caracteres trocados/omitidos

    for (const word of vocabularioDinamico) {
      const normWord = normalizeText(word).toLowerCase();
      // Não compara se diferença de tamanho for muito grande
      if (Math.abs(normWord.length - normInput.length) > 2) continue;

      const dist = levenshteinDistance(normInput, normWord);
      if (dist < minDistance && dist > 0) {
        minDistance = dist;
        bestCandidate = word;
      }
    }

    setDidYouMean(bestCandidate);
  }, [searchTerm, pareceresList, vocabularioDinamico]);

  // Filtragem dos pareceres
  const filteredPareceres = useMemo(() => {
    const term = searchTerm.trim();

    return pareceresList.filter((p) => {
      if (statusFilter !== "all" && p.statusConclusao !== statusFilter) {
        return false;
      }

      if (!term) return true;

      return (
        matchSubstance(p.farmacoNome, term) ||
        matchSubstance(p.substanciaAtiva, term) ||
        matchNormalized(p.cidCodigo, term) ||
        matchNormalized(p.cidDescricao, term) ||
        matchNormalized(p.origemDemanda, term) ||
        matchNormalized(p.municipioResidencia, term)
      );
    });
  }, [pareceresList, searchTerm, statusFilter]);

  // Executa impressão limpa / download em PDF do parecer
  const handleBaixarParecer = (item: ParecerConsultaItem) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Por favor, permita pop-ups para gerar a via impressa do parecer.");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Parecer Técnico CIMBAHIA - Processo SEI ${item.numeroSei}</title>
        <style>
          @page { size: A4; margin: 15mm 20mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5; font-size: 12pt; margin: 0; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
          .header h1 { font-size: 15pt; margin: 0; font-weight: bold; text-transform: uppercase; color: #0f172a; }
          .header h2 { font-size: 11pt; margin: 4px 0 0 0; color: #475569; font-weight: 500; }
          .section { margin-bottom: 18px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; background: #fafafa; }
          .section-title { font-size: 11pt; font-weight: bold; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 10px; text-transform: uppercase; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 10.5pt; }
          .field-label { font-weight: bold; color: #475569; }
          .field-value { color: #0f172a; }
          .conclusao-box { padding: 12px; border-radius: 6px; font-weight: bold; margin-top: 10px; text-align: center; font-size: 12pt; }
          .conclusao-deferido { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
          .conclusao-indeferido { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
          .conclusao-exigencia { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }
          .text-justify { text-align: justify; white-space: pre-wrap; font-size: 10.5pt; line-height: 1.6; }
          .footer { margin-top: 30px; text-align: center; font-size: 9pt; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Secretaria da Saúde do Estado da Bahia — SESAB</h1>
          <h2>Superintendência de Assistência Farmacêutica (SAFTEC) • CIMBAHIA</h2>
          <p style="margin: 4px 0 0 0; font-size: 10pt; color: #334155;">Centro de Informação sobre Medicamentos da Bahia — Parecer Técnico Regulatório</p>
        </div>

        <div class="section">
          <div class="section-title">1. Dados do Paciente (Protegidos por Sigilo e LGPD)</div>
          <div class="grid">
            <div><span class="field-label">Idade na Avaliação:</span> <span class="field-value">${item.idadeFormatada} (${item.faixaEtariaLabel})</span></div>
            <div><span class="field-label">Sexo:</span> <span class="field-value">${item.sexoFormatado}</span></div>
            <div style="grid-column: span 2;"><span class="field-label">Cidade de Residência:</span> <span class="field-value">${item.municipioResidencia}</span></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">2. Dados do Processo Administrativo</div>
          <div class="grid">
            <div><span class="field-label">Nº do Processo SEI:</span> <span class="field-value">${item.numeroSei}</span></div>
            <div><span class="field-label">Origem da Demanda:</span> <span class="field-value">${item.origemDemanda}</span></div>
            <div><span class="field-label">Data de Conclusão:</span> <span class="field-value">${formatDate(item.dataConclusao)}</span></div>
            <div><span class="field-label">Base Regional Vinculada:</span> <span class="field-value">${item.baseRegional}</span></div>
            <div style="grid-column: span 2;"><span class="field-label">Macrorregião de Saúde:</span> <span class="field-value">${item.macroregiao}</span></div>
          </div>
        </div>

        <div class="section" style="background: #ffffff;">
          <div class="section-title">3. Dados da Tecnologia em Saúde & Avaliação Clínica</div>
          <div class="grid" style="margin-bottom: 12px;">
            <div><span class="field-label">Fármaco / Medicamento:</span> <span class="field-value">${item.farmacoNome}</span></div>
            <div><span class="field-label">Substância Ativa:</span> <span class="field-value">${item.substanciaAtiva}</span></div>
            <div style="grid-column: span 2;"><span class="field-label">Diagnóstico (CID-10):</span> <span class="field-value">${item.cidCodigo} — ${item.cidDescricao}</span></div>
          </div>

          <div style="margin-top: 10px;">
            <span class="field-label">Fundamentação Farmacêutica & Clínica:</span>
            <div class="text-justify" style="margin-top: 6px; padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">${item.fundamentacao}</div>
          </div>

          <div class="conclusao-box ${
            item.statusConclusao === "deferido" || item.statusConclusao === "deferido_parcial"
              ? "conclusao-deferido"
              : item.statusConclusao === "indeferido"
              ? "conclusao-indeferido"
              : "conclusao-exigencia"
          }">
            CONCLUSÃO TÉCNICA DO ITEM: ${item.statusLabel.toUpperCase()}
          </div>
        </div>

        <div class="footer">
          Documento emitido eletronicamente pelo Sistema Oficial CIMBAHIA da Secretaria da Saúde do Estado da Bahia.<br/>
          Responsável Técnico: ${item.farmaceuticoResponsavel} (${item.crfResponsavel}) • Emissão em ${new Date().toLocaleDateString("pt-BR")}.
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* ========================================================================= */}
      {/* CABEÇALHO PÚBLICO HUMANIZADO */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs group-hover:bg-emerald-700 transition-colors">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-slate-900">CIMBAHIA</span>
                <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  Transparência SUS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-none">
                Consulta Pública de Pareceres
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-xs text-slate-600 hover:text-slate-900">
                Página Inicial
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="text-xs h-8 px-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold">
                Área Restrita
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* CONTEÚDO PRINCIPAL */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Bloco de Boas-Vindas Humanizado */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs uppercase tracking-wide">
            <HeartHandshake className="w-4 h-4 text-emerald-600" />
            <span>Acesso Cidadão e Informação Clara</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Pesquisa de Pareceres Farmacêuticos
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
            Consulte de forma transparente as avaliações clínicas e farmacológicas emitidas pelo
            CIMBAHIA para medicamentos e tratamentos solicitados no âmbito do SUS da Bahia.
            Você pode pesquisar pelo <strong>nome do medicamento</strong>, <strong>princípio ativo</strong> ou pelo <strong>diagnóstico / código CID</strong>.
          </p>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowExplanation(!showExplanation)}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1.5 hover:underline"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showExplanation ? "Ocultar explicação dos termos" : "Como entender os resultados da consulta? (Clique aqui)"}</span>
            </button>

            {showExplanation && (
              <div className="mt-3 p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs text-slate-700 space-y-2 animate-in fade-in">
                <p>
                  <strong>• Aprovado (Deferido):</strong> Significa que a solicitação do medicamento cumpre os critérios técnicos de indicação, dosagem e protocolos clínicos oficiais do SUS.
                </p>
                <p>
                  <strong>• Não Aprovado (Indeferido):</strong> Significa que o pedido não possui evidência científica suficiente para a condição informada, já conta com alternativa terapêutica disponível na rede ou não apresentou laudos complementares necessários.
                </p>
                <p>
                  <strong>• Pendente de Documentação (Exigência):</strong> Significa que o farmacêutico solicitou exames ou relatório médico adicional para concluir a avaliação com segurança.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BARRA DE PESQUISA INTELIGENTE (COM TOLERÂNCIA A ERROS) */}
        {/* ========================================================================= */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Exemplo: Insulina, Adalimumabe, Metformina, Artrite, E11, Diabetes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 text-xs sm:text-sm bg-white border-slate-300 rounded-xl shadow-2xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                  title="Limpar busca"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-slate-700 font-medium shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">Todas as Conclusões</option>
              <option value="deferido">Aprovados (Deferidos)</option>
              <option value="indeferido">Não Aprovados (Indeferidos)</option>
              <option value="em_exigencia">Pendentes de Documentação</option>
              <option value="deferido_parcial">Aprovados Parcialmente</option>
            </select>
          </div>

          {/* SUGESTÃO INTELIGENTE: "Você quis dizer...?" */}
          {didYouMean && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900 shadow-2xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Você quis dizer:{" "}
                  <button
                    type="button"
                    onClick={() => setSearchTerm(didYouMean)}
                    className="font-bold underline text-amber-950 hover:text-amber-800"
                  >
                    {didYouMean}
                  </button>
                  ?
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSearchTerm(didYouMean)}
                className="px-2.5 py-1 bg-amber-200/70 hover:bg-amber-200 text-amber-900 rounded-md font-semibold text-[11px] transition-colors"
              >
                Aplicar sugestão
              </button>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* TABELA DE RESULTADOS */}
        {/* ========================================================================= */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-semibold text-slate-700">
              Pareceres Encontrados ({filteredPareceres.length})
            </span>
            <span className="text-[11px] text-slate-500">
              {searchTerm ? `Filtrando por "${searchTerm}"` : "Mostrando todos os pareceres disponíveis"}
            </span>
          </div>

          {filteredPareceres.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                Nenhum parecer encontrado
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Não encontramos nenhum parecer para o termo digitado. Tente pesquisar pelo nome genérico do fármaco ou pelo código da doença.
              </p>
              {searchTerm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                  className="text-xs h-8"
                >
                  Limpar pesquisa
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3 px-4">Data de Conclusão</th>
                    <th className="py-3 px-4">Diagnóstico (CID-10)</th>
                    <th className="py-3 px-4">Fármaco / Substância</th>
                    <th className="py-3 px-4">Origem da Demanda</th>
                    <th className="py-3 px-4 text-center">Conclusão</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPareceres.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Data de Conclusão */}
                      <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(item.dataConclusao)}</span>
                        </div>
                      </td>

                      {/* CID */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {item.cidCodigo}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1" title={item.cidDescricao}>
                          {item.cidDescricao}
                        </div>
                      </td>

                      {/* Fármaco / Substância */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {item.farmacoNome}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Substância: {item.substanciaAtiva}
                        </div>
                      </td>

                      {/* Origem da Demanda */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px] font-medium">
                          {item.origemDemanda}
                        </span>
                      </td>

                      {/* Conclusão */}
                      <td className="py-3.5 px-4 text-center">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold px-2 py-0.5 ${
                            item.statusConclusao === "deferido" || item.statusConclusao === "deferido_parcial"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : item.statusConclusao === "indeferido"
                              ? "bg-rose-50 text-rose-800 border-rose-300"
                              : "bg-amber-50 text-amber-800 border-amber-300"
                          }`}
                        >
                          {item.statusConclusao === "deferido"
                            ? "Aprovado"
                            : item.statusConclusao === "indeferido"
                            ? "Não Aprovado"
                            : item.statusConclusao === "deferido_parcial"
                            ? "Aprovado Parcial"
                            : "Pendente"}
                        </Badge>
                      </td>

                      {/* Dois Botões Obrigatórios: Abrir Parecer e Baixar Parecer */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedParecer(item)}
                            className="h-8 px-2.5 text-xs text-slate-700 hover:text-slate-900 border-slate-300 hover:bg-slate-100 gap-1 font-semibold"
                            title="Abrir parecer completo na tela"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Abrir parecer</span>
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleBaixarParecer(item)}
                            className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 font-semibold shadow-2xs"
                            title="Baixar via impressa oficial em PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Baixar parecer</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Dialog
        open={!!selectedParecer}
        onOpenChange={(open) => !open && setSelectedParecer(null)}
        title={selectedParecer ? `Parecer Técnico — ${selectedParecer.farmacoNome}` : "Parecer Técnico"}
        description={selectedParecer ? `Processo SEI: ${selectedParecer.numeroSei} • Concluído em ${formatDate(selectedParecer.dataConclusao)}` : undefined}
        maxWidth="xl"
      >
        {selectedParecer && (
          <div className="w-full space-y-5 max-h-[75vh] overflow-y-auto no-scrollbar pt-1">

            {/* =================================================================== */}
            {/* 1. BLOCO PACIENTE: Idade, Sexo, Cidade de Residência */}
            {/* =================================================================== */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                1. Paciente
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Idade na Avaliação:</span>
                  <strong className="text-slate-900 font-semibold">
                    {selectedParecer.idadeFormatada} ({selectedParecer.faixaEtariaLabel})
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Sexo:</span>
                  <strong className="text-slate-900 font-semibold">
                    {selectedParecer.sexoFormatado}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Cidade de Residência:</span>
                  <strong className="text-slate-900 font-semibold">
                    {selectedParecer.municipioResidencia}
                  </strong>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 pt-1">
                * Em cumprimento à Lei Geral de Proteção de Dados (LGPD), informações de identificação nominal e CPF são mantidas em sigilo público.
              </p>
            </div>

            {/* =================================================================== */}
            {/* 2. BLOCO DADOS DO PROCESSO: Origem, Conclusão, Base Regional, Macrorregião */}
            {/* =================================================================== */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                2. Dados do Processo
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Origem da Demanda:</span>
                  <strong className="text-slate-900 font-semibold">
                    {selectedParecer.origemDemanda}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Data de Conclusão:</span>
                  <strong className="text-slate-900 font-semibold">
                    {formatDate(selectedParecer.dataConclusao)}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Base Regional Vinculada:</span>
                  <strong className="text-slate-900 font-semibold">
                    {selectedParecer.baseRegional}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Macrorregião de Saúde:</span>
                  <strong className="text-slate-900 font-semibold">
                    {selectedParecer.macroregiao}
                  </strong>
                </div>
              </div>
            </div>

            {/* =================================================================== */}
            {/* 3. BLOCO DADOS DA TECNOLOGIA: CID, Diagnóstico, Fármaco, Substância, Fundamentação, Conclusão */}
            {/* =================================================================== */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                3. Dados da Tecnologia & Avaliação
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Código CID:</span>
                  <strong className="text-slate-900 font-mono font-semibold">
                    {selectedParecer.cidCodigo}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Diagnóstico (Descritivo):</span>
                  <strong className="text-slate-900 font-semibold">
                    {selectedParecer.cidDescricao}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Fármaco Solicitado:</span>
                  <strong className="text-slate-900 font-semibold">
                    {selectedParecer.farmacoNome}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Substância Ativa:</span>
                  <strong className="text-slate-900 font-semibold">
                    {selectedParecer.substanciaAtiva}
                  </strong>
                </div>
              </div>

              {/* Fundamentação Farmacêutica & Clínica */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-800 block">
                  Fundamentação Farmacêutica & Clínica:
                </span>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedParecer.fundamentacao}
                </div>
              </div>

              {/* Conclusão Técnica do Item */}
              <div className="pt-2 flex items-center justify-between p-3 rounded-lg bg-slate-100 border border-slate-200">
                <span className="text-xs font-semibold text-slate-700">
                  Conclusão Técnica do Item:
                </span>
                <Badge
                  className={`text-xs font-bold px-3 py-1 ${
                    selectedParecer.statusConclusao === "deferido" || selectedParecer.statusConclusao === "deferido_parcial"
                      ? "bg-emerald-600 text-white"
                      : selectedParecer.statusConclusao === "indeferido"
                      ? "bg-rose-600 text-white"
                      : "bg-amber-600 text-white"
                  }`}
                >
                  {selectedParecer.statusLabel}
                </Badge>
              </div>
            </div>

            {/* Ações do Rodapé do Modal */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedParecer(null)}
                className="text-xs h-9 px-4"
              >
                Fechar
              </Button>

              <Button
                type="button"
                onClick={() => handleBaixarParecer(selectedParecer)}
                className="text-xs h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-2 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Baixar Parecer em PDF</span>
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* ========================================================================= */}
      {/* RODAPÉ PÚBLICO */}
      {/* ========================================================================= */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>CIMBAHIA • Secretaria da Saúde do Estado da Bahia (SESAB)</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <a href="mailto:dasf.cimbahia@saude.ba.gov.br" className="hover:underline hover:text-emerald-700">
              dasf.cimbahia@saude.ba.gov.br
            </a>
            <span>•</span>
            <span>Tel: (71) 3115-4247</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
