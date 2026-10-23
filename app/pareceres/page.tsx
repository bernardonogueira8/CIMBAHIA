"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  BookOpen,
  Pill,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
  Building,
  Sparkles,
  Filter,
  Code2,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Clock,
  ShieldAlert,
  Info,
  Scale,
  PlusCircle,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { useApp } from "@/lib/context/AppContext";
import { ParecerSearchResponse, ParecerSearchResultItem } from "@/app/api/pareceres/route";
import { formatDate, normalizeText } from "@/lib/utils";

export default function BancoPareceresPage() {
  const { processos } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [cidFilter, setCidFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ParecerSearchResponse | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);

  // Extrai substâncias cadastradas nos processos reais para atalhos rápidos
  const frequentSubstances = useMemo(() => {
    const subs = new Set<string>();
    processos.forEach((p) => {
      p.items?.forEach((it) => {
        const name = it.farmaco_substancia || it.medication_name;
        if (name && name.trim()) subs.add(name.trim());
      });
    });
    return Array.from(subs).slice(0, 8);
  }, [processos]);

  // Executa busca na API /api/pareceres sincronizada com os processos reais
  const fetchPareceres = async (substancia: string, cid: string, status: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/pareceres`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          substancia: substancia.trim() || undefined,
          cid: cid.trim() || undefined,
          status: status !== "all" ? status : undefined,
          processos: processos,
        }),
      });
      if (res.ok) {
        const json: ParecerSearchResponse = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Erro ao buscar pareceres:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPareceres(searchTerm, cidFilter, statusFilter);
  }, [searchTerm, cidFilter, statusFilter, processos]);

  // Função para copiar texto da fundamentação com feedback
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const respostasFiltradas = useMemo(() => {
    if (!data) return [];
    if (statusFilter === "all") return data.respostas;
    return data.respostas.filter((r) => r.status === statusFilter);
  }, [data, statusFilter]);

  return (
    <div className="space-y-6 pb-12">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Scale className="h-6 w-6 text-emerald-600" />
              Banco de Pareceres & Decisões Farmacêuticas
            </h1>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs">
              Módulo de Inteligência Clínica
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Repositório unificado de pareceres técnicos, fundamentações e precedentes regulatórios da equipe do CIMBAHIA.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsApiModalOpen(true)}
            className="text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 flex items-center gap-1.5"
          >
            <Code2 className="h-4 w-4 text-indigo-600" />
            <span>Documentação da API</span>
          </Button>
          <Link href="/atendimentos/novo">
            <Button
              type="button"
              size="sm"
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Novo Processo SEI</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* PAINEL DE BUSCA */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Input de Substância */}
            <div className="md:col-span-6 relative">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Substância Ativa / Fármaco / Medicamento
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Pesquise por substância ou fármaco avaliado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-xs"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Filtro de CID-10 */}
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Código CID-10
              </label>
              <Input
                placeholder="Ex: M05, K50, G35..."
                value={cidFilter}
                onChange={(e) => setCidFilter(e.target.value.toUpperCase())}
                className="text-xs font-mono"
              />
            </div>

            {/* Filtro de Desfecho */}
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Desfecho do Parecer
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full text-xs p-2 rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="all">Todos os Desfechos</option>
                <option value="deferido">✅ Apenas Deferidos</option>
                <option value="indeferido">❌ Apenas Indeferidos</option>
                <option value="em_exigencia">⚠️ Apenas em Exigência</option>
              </select>
            </div>
          </div>

          {/* Atalhos rápidos para substâncias cadastradas em processos reais */}
          {frequentSubstances.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-500" />
                Substâncias nos Processos:
              </span>
              {frequentSubstances.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSearchTerm(sub)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all flex items-center gap-1.5 ${
                    normalizeText(searchTerm) === normalizeText(sub)
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  <span>💊</span>
                  <span>{sub}</span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* METRICAS REAIS DAS AVALIAÇÕES */}
      {data?.estatisticas && data.estatisticas.total_avaliacoes_base > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card className="border-slate-200 bg-emerald-50/40">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">
                  Taxa de Deferimento
                </p>
                <p className="text-2xl font-bold text-emerald-700 mt-0.5">
                  {data.estatisticas.taxa_deferimento_estimada}
                </p>
                <p className="text-[10px] text-emerald-600">Baseado em pareceres reais emitidos</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500 opacity-80" />
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-rose-50/40">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-rose-800 uppercase tracking-wide">
                  Taxa de Indeferimento
                </p>
                <p className="text-2xl font-bold text-rose-700 mt-0.5">
                  {data.estatisticas.taxa_indeferimento_estimada}
                </p>
                <p className="text-[10px] text-rose-600">Decisões técnicas desfavoráveis</p>
              </div>
              <XCircle className="h-8 w-8 text-rose-500 opacity-80" />
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-amber-50/40">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-amber-800 uppercase tracking-wide">
                  Taxa de Exigência
                </p>
                <p className="text-2xl font-bold text-amber-700 mt-0.5">
                  {data.estatisticas.taxa_exigencia_estimada}
                </p>
                <p className="text-[10px] text-amber-600">Diligências e complementações</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500 opacity-80" />
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-slate-50">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                  Total de Pareceres
                </p>
                <p className="text-2xl font-bold text-slate-800 mt-0.5">
                  {data.estatisticas.total_avaliacoes_base}
                </p>
                <p className="text-[10px] text-slate-500">Pareceres homologados no sistema</p>
              </div>
              <Clock className="h-8 w-8 text-slate-400 opacity-80" />
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* LISTA DE RESPOSTAS E PARECERES ENCONTRADOS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Pill className="h-4 w-4 text-emerald-600" />
            <span>Pareceres Técnicos & Fundamentações Cadastradas ({respostasFiltradas.length})</span>
          </h2>
          {respostasFiltradas.length > 0 && (
            <span className="text-xs text-slate-500">
              Dica: Clique em "Copiar Fundamentação" para reaproveitar em novos pareceres no SEI.
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Buscando pareceres no acervo...
          </div>
        ) : respostasFiltradas.length === 0 ? (
          <Card className="p-10 text-center border-dashed border-slate-300 bg-slate-50/50">
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
                <Scale className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Banco de Pareceres Limpo & Pronto para Dados Reais
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Nenhum processo ou parecer anterior encontrado. Conforme novos processos SEI forem autuados na triagem e avaliados pelos farmacêuticos na fila de atendimentos, os pareceres homologados alimentarão automaticamente este banco de consulta.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <Link href="/atendimentos/novo">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center gap-1.5">
                    <PlusCircle className="w-3.5 h-3.5" />
                    Autuar Novo Processo SEI
                  </Button>
                </Link>
                <Link href="/atendimentos">
                  <Button size="sm" variant="outline" className="text-xs text-slate-700 border-slate-300 hover:bg-slate-100 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Fila de Atendimentos
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {respostasFiltradas.map((item) => (
              <Card
                key={item.id}
                className={`border transition-all ${
                  item.status === "deferido"
                    ? "border-emerald-200 hover:border-emerald-300 bg-gradient-to-r from-emerald-50/20 to-white"
                    : item.status === "indeferido"
                    ? "border-rose-200 hover:border-rose-300 bg-gradient-to-r from-rose-50/20 to-white"
                    : "border-amber-200 hover:border-amber-300 bg-gradient-to-r from-amber-50/20 to-white"
                }`}
              >
                <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      className={`text-xs font-semibold ${
                        item.status === "deferido"
                          ? "bg-emerald-600 text-white"
                          : item.status === "indeferido"
                          ? "bg-rose-600 text-white"
                          : "bg-amber-600 text-white"
                      }`}
                    >
                      {item.status === "deferido"
                        ? "✅ Deferido"
                        : item.status === "indeferido"
                        ? "❌ Indeferido"
                        : "⚠️ Em Exigência"}
                    </Badge>

                    <h3 className="text-sm font-bold text-slate-900">{item.titulo}</h3>

                    <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600">
                      Processo: {item.processo_sei}
                    </Badge>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(item.id, item.fundamentacao_tecnica)}
                    className="text-xs flex items-center gap-1.5 border-slate-200 hover:bg-slate-50 flex-shrink-0"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-semibold">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-slate-500" />
                        <span>Copiar Fundamentação</span>
                      </>
                    )}
                  </Button>
                </CardHeader>

                <CardContent className="p-4 space-y-3">
                  {/* METADADOS DO PARECER */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-md border border-slate-200/60">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Paciente Requerente
                      </span>
                      <strong className="text-slate-900 truncate block" title={item.paciente_nome || "Precedente Geral"}>
                        {item.paciente_nome || "Precedente Geral"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Fármaco / Substância
                      </span>
                      <strong className="text-slate-800">{item.substancia}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        CID-10 Avaliado
                      </span>
                      <strong className="text-slate-800">
                        {item.cid_code} {item.cid_description ? `• ${item.cid_description}` : ""}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Farmacêutico Parecerista
                      </span>
                      <strong className="text-slate-800">{item.farmaceutico}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Data da Avaliação
                      </span>
                      <strong className="text-slate-800">{formatDate(item.data)}</strong>
                    </div>
                  </div>

                  {/* TEXTO DA FUNDAMENTAÇÃO TÉCNICA ESPECÍFICA DO ITEM */}
                  <div>
                    <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Pill className="h-3.5 w-3.5 text-emerald-600" />
                        Fundamentação Técnica e Justificativa Clínica do Fármaco:
                      </span>
                      {item.posologia && (
                        <span className="text-[11px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          Posologia: {item.posologia}
                        </span>
                      )}
                    </div>
                    <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-wrap shadow-xs">
                      {item.fundamentacao_tecnica}
                    </div>
                  </div>

                  {/* PARECER CONSOLIDADO GERAL (OPCIONAL/COLAPSÁVEL) */}
                  {item.parecer_consolidado && item.parecer_consolidado !== item.fundamentacao_tecnica && (
                    <details className="text-xs text-slate-600 border border-slate-200 rounded-lg p-2.5 bg-slate-50/60">
                      <summary className="font-semibold text-slate-700 cursor-pointer hover:text-slate-900 select-none flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-slate-500" />
                        Ver Parecer Técnico Consolidado Geral do Processo SEI
                      </summary>
                      <div className="mt-2 p-2.5 bg-white border border-slate-200 rounded text-[11px] font-mono leading-relaxed whitespace-pre-wrap text-slate-700">
                        {item.parecer_consolidado}
                      </div>
                    </details>
                  )}

                  {/* RECOMENDAÇÕES */}
                  {item.recomendacoes && (
                    <div className="text-xs bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-md text-emerald-900">
                      <strong>Recomendações e Monitoramento:</strong> {item.recomendacoes}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE DOCUMENTAÇÃO DA API */}
      {isApiModalOpen && (
        <Dialog
          open={true}
          onOpenChange={() => setIsApiModalOpen(false)}
          title="API de Pesquisa de Pareceres & Decisões Farmacêuticas"
          description="Integre outros sistemas ou consulte fundamentações de pareceres via endpoint REST."
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs text-slate-700">
            <div>
              <p className="font-semibold text-slate-800 mb-1">Endpoint REST:</p>
              <code className="block p-2 bg-slate-900 text-emerald-400 rounded font-mono text-[11px]">
                GET /api/pareceres?substancia=Adalimumabe&amp;cid=M05&amp;status=deferido
              </code>
            </div>

            <div>
              <p className="font-semibold text-slate-800 mb-1">Parâmetros de Consulta (Query Params ou JSON Body):</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li><code className="font-mono text-emerald-700 font-semibold">substancia</code> ou <code className="font-mono text-emerald-700 font-semibold">farmaco</code>: Nome da substância ativa.</li>
                <li><code className="font-mono text-emerald-700 font-semibold">cid</code>: Código CID-10 (ex: M05, K50, G35).</li>
                <li><code className="font-mono text-emerald-700 font-semibold">status</code>: deferido, indeferido, em_exigencia.</li>
                <li><code className="font-mono text-emerald-700 font-semibold">limit</code>: Quantidade máxima de resultados (padrão: 50).</li>
              </ul>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsApiModalOpen(false)}
                className="text-xs"
              >
                Fechar
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
