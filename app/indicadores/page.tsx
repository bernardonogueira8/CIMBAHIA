"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Filter,
  Printer,
  Pill,
  ShieldCheck,
  Building2,
  Users,
  Activity,
  ArrowUpRight,
  Sparkles,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";
import { useApp } from "@/lib/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { formatDate } from "@/lib/utils";
import { BAHIA_MACRORREGIOES } from "@/lib/territory-data";

const STATUS_COLORS: Record<string, string> = {
  "Aguardando Triagem": "#F59E0B",
  "Em Triagem": "#F97316",
  "Aguardando Parecer": "#3B82F6",
  "Em Análise Técnica": "#6366F1",
  "Em Exigência": "#A855F7",
  "Deferido": "#10B981",
  "Indeferido": "#EF4444",
  "Deferido Parcial": "#14B8A6",
};

export default function IndicadoresPage() {
  const {
    processos,
    units,
    origens,
    diresList,
    nucleos,
    profiles,
    cids,
    medications,
    otherMedications,
    selectedUnitId,
    setSelectedUnitId,
  } = useApp();

  const [activeTab, setActiveTab] = useState<"operacional" | "epidemiologico">("operacional");
  const [selectedMacroregion, setSelectedMacroregion] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<"30d" | "90d" | "2026">("2026");

  // Lista de macrorregionais oficiais da Bahia
  const macroregions = BAHIA_MACRORREGIOES;

  // Filtragem dos processos com base nos controles do cabeçalho
  const filteredProcessos = useMemo(() => {
    return processos.filter((p) => {
      if (selectedUnitId !== "all" && p.unidade_id !== selectedUnitId) {
        return false;
      }
      if (selectedMacroregion !== "all") {
        const u = units.find((unit) => unit.id === p.unidade_id);
        if (u && u.macroregion !== selectedMacroregion) return false;
      }
      return true;
    });
  }, [processos, selectedUnitId, selectedMacroregion]);

  // =========================================================================
  // MÉTRICAS OPERACIONAIS
  // =========================================================================
  const operationalMetrics = useMemo(() => {
    const total = filteredProcessos.length;
    const concluidos = filteredProcessos.filter((p) => p.status.startsWith("concluido_"));
    const deferidos = filteredProcessos.filter((p) => p.status === "concluido_deferido" || p.status === "concluido_parcial");
    const indeferidos = filteredProcessos.filter((p) => p.status === "concluido_indeferido");
    const emExigencia = filteredProcessos.filter((p) => p.status === "em_exigencia");

    // Taxa de Deferimento
    const deferralRate = concluidos.length > 0 ? Math.round((deferidos.length / concluidos.length) * 100) : 0;

    // SLAs e gargalos (> 5 dias sem conclusão)
    const delayedProcesses = filteredProcessos.filter((p) => (p.days_in_current_status || 0) >= 5 && !p.status.startsWith("concluido_"));
    const onTimeRate = total > 0 ? Math.round(((total - delayedProcesses.length) / total) * 100) : 100;

    // Tempo médio estimado na etapa (dias)
    const totalDays = filteredProcessos.reduce((acc, p) => acc + (p.days_in_current_status || 1), 0);
    const avgDays = total > 0 ? (totalDays / total).toFixed(1) : "0";

    return {
      total,
      concluidosCount: concluidos.length,
      deferralRate,
      delayedCount: delayedProcesses.length,
      onTimeRate,
      avgDays,
      delayedProcesses,
    };
  }, [filteredProcessos]);

  // Gráfico Donut de Status
  const statusDistributionData = useMemo(() => {
    const counts: Record<string, number> = {
      "Aguardando Triagem": 0,
      "Aguardando Parecer": 0,
      "Em Análise Técnica": 0,
      "Em Exigência": 0,
      "Deferido": 0,
      "Indeferido": 0,
    };

    filteredProcessos.forEach((p) => {
      switch (p.status) {
        case "aguardando_triagem":
        case "em_triagem":
          counts["Aguardando Triagem"] += 1;
          break;
        case "aguardando_parecer":
          counts["Aguardando Parecer"] += 1;
          break;
        case "em_analise_farmaceutica":
          counts["Em Análise Técnica"] += 1;
          break;
        case "em_exigencia":
          counts["Em Exigência"] += 1;
          break;
        case "concluido_deferido":
        case "concluido_parcial":
          counts["Deferido"] += 1;
          break;
        case "concluido_indeferido":
          counts["Indeferido"] += 1;
          break;
      }
    });

    return Object.entries(counts)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  }, [filteredProcessos]);

  // Carga de Trabalho por Parecerista
  const pharmacistWorkloadData = useMemo(() => {
    const map: Record<string, { name: string; emAnalise: number; concluidos: number }> = {};

    profiles
      .filter((prof) => prof.role === "farmaceutico" || prof.role === "admin")
      .forEach((prof) => {
        map[prof.id] = { name: prof.full_name.split(" ")[0] + " " + (prof.full_name.split(" ")[1] || ""), emAnalise: 0, concluidos: 0 };
      });

    filteredProcessos.forEach((p) => {
      if (p.assigned_pharmacist_id && map[p.assigned_pharmacist_id]) {
        if (p.status.startsWith("concluido_")) {
          map[p.assigned_pharmacist_id].concluidos += 1;
        } else {
          map[p.assigned_pharmacist_id].emAnalise += 1;
        }
      }
    });

    return Object.values(map);
  }, [profiles, filteredProcessos]);

  // Volume por Origem da Demanda
  const originVolumeData = useMemo(() => {
    const map: Record<string, number> = {};

    origens.forEach((o) => {
      map[o.sigla || o.name] = 0;
    });

    filteredProcessos.forEach((p) => {
      const orig = origens.find((o) => o.id === p.origem_id);
      const key = orig?.sigla || orig?.name || "Outros";
      map[key] = (map[key] || 0) + 1;
    });

    return Object.entries(map).map(([name, total]) => ({ name, total }));
  }, [origens, filteredProcessos]);

  // =========================================================================
  // MÉTRICAS FARMACÊUTICAS & EPIDEMIOLÓGICAS
  // =========================================================================
  const pharmaMetrics = useMemo(() => {
    const allItems = filteredProcessos.flatMap((p) => p.items || []);
    const totalItems = allItems.length;
    const ceafItems = allItems.filter((it) => it.medication_type === "ceaf");
    const otherItems = allItems.filter((it) => it.medication_type === "outro");

    const ceafPercentage = totalItems > 0 ? Math.round((ceafItems.length / totalItems) * 100) : 0;
    const otherPercentage = totalItems > 0 ? Math.round((otherItems.length / totalItems) * 100) : 0;

    // Top 8 Medicamentos Mais Demandados
    const medCountMap: Record<string, { name: string; type: "ceaf" | "outro" | "farmaco"; count: number }> = {};
    allItems.forEach((it) => {
      if (!medCountMap[it.medication_name]) {
        medCountMap[it.medication_name] = {
          name: it.medication_name,
          type: it.medication_type || "farmaco",
          count: 0,
        };
      }
      medCountMap[it.medication_name].count += 1;
    });

    const topMedications = Object.values(medCountMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Top 8 CIDs Mais Frequentes
    const cidCountMap: Record<string, { code: string; desc: string; count: number }> = {};
    allItems.forEach((it) => {
      if (!cidCountMap[it.cid_code]) {
        cidCountMap[it.cid_code] = {
          code: it.cid_code,
          desc: it.cid_description || "",
          count: 0,
        };
      }
      cidCountMap[it.cid_code].count += 1;
    });

    const topCids = Object.values(cidCountMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Deferimento por DIRES
    const diresMap: Record<string, { name: string; deferidos: number; indeferidos: number }> = {};
    diresList.forEach((d) => {
      diresMap[d.id] = { name: d.code, deferidos: 0, indeferidos: 0 };
    });

    filteredProcessos.forEach((p) => {
      const mun = p.municipio;
      if (mun?.dires_id && diresMap[mun.dires_id]) {
        if (p.status === "concluido_deferido" || p.status === "concluido_parcial") {
          diresMap[mun.dires_id].deferidos += 1;
        } else if (p.status === "concluido_indeferido") {
          diresMap[mun.dires_id].indeferidos += 1;
        }
      }
    });

    const diresPerformance = Object.values(diresMap).filter((d) => d.deferidos + d.indeferidos > 0);

    return {
      totalItems,
      ceafCount: ceafItems.length,
      ceafPercentage,
      otherCount: otherItems.length,
      otherPercentage,
      topMedications,
      topCids,
      diresPerformance,
    };
  }, [filteredProcessos, diresList]);

  return (
    <div className="space-y-6 pb-12">
      {/* Topo / Cabeçalho Executivo */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Painel de Inteligência & Indicadores CIMBAHIA
            </h1>
            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
              BI Oficial SESAB
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Monitoramento analítico de conformidade de SLA, produtividade de pareceres e perfil epidemiológico.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            className="text-xs border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
          >
            <Printer className="h-4 w-4" />
            Imprimir Relatório
          </Button>
        </div>
      </div>

      {/* Barra de Filtros Executivos */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            {/* Seletor de Abas Principais */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 w-full md:w-auto">
              <button
                onClick={() => setActiveTab("operacional")}
                className={`flex-1 md:flex-none px-4 py-2 rounded-md font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === "operacional"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                <Activity className="h-4 w-4 text-emerald-600" />
                Dashboard Operacional & Eficiência
              </button>
              <button
                onClick={() => setActiveTab("epidemiologico")}
                className={`flex-1 md:flex-none px-4 py-2 rounded-md font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === "epidemiologico"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                <Pill className="h-4 w-4 text-indigo-600" />
                Dashboard Farmacêutico
              </button>
            </div>

            {/* Controles de Filtros Territoriais e Período */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
              <select
                value={selectedMacroregion}
                onChange={(e) => setSelectedMacroregion(e.target.value)}
                className="h-9 text-xs rounded-md border border-slate-200 bg-white px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Todas as Macrorregionais</option>
                {macroregions.map((macro) => (
                  <option key={macro} value={macro}>
                    {macro}
                  </option>
                ))}
              </select>

              <select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="h-9 text-xs rounded-md border border-slate-200 bg-white px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Todas as Unidades / Bases</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as "30d" | "90d" | "2026")}
                className="h-9 text-xs rounded-md border border-slate-200 bg-white px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="30d">Últimos 30 Dias</option>
                <option value="90d">Últimos 90 Dias</option>
                <option value="2026">Ano de 2026 (Consolidado)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* ABA 1: DASHBOARD OPERACIONAL & EFICIÊNCIA */}
      {/* ========================================================================= */}
      {activeTab === "operacional" && (
        <div className="space-y-6">
          {/* Cards KPIs Operacionais */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="border-l-4 border-l-slate-700">
              <CardContent className="p-4">
                <span className="text-xs font-medium text-slate-500">Volume Total de Processos</span>
                <div className="text-2xl font-bold text-slate-900 mt-1">{operationalMetrics.total}</div>
                <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <FileText className="h-3 w-3 text-slate-400" />
                  {operationalMetrics.concluidosCount} finalizados
                </span>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-600">
              <CardContent className="p-4">
                <span className="text-xs font-medium text-blue-700">Tempo Médio na Etapa</span>
                <div className="text-2xl font-bold text-blue-900 mt-1">{operationalMetrics.avgDays} <span className="text-sm font-normal">dias</span></div>
                <span className="text-[11px] text-blue-600 flex items-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3" />
                  Meta SESAB: ≤ 5.0 dias
                </span>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-600">
              <CardContent className="p-4">
                <span className="text-xs font-medium text-emerald-700">Taxa de SLA Cumprido</span>
                <div className="text-2xl font-bold text-emerald-900 mt-1">{operationalMetrics.onTimeRate}%</div>
                <span className="text-[11px] text-emerald-600 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="h-3 w-3" />
                  Conformidade de prazo
                </span>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-600">
              <CardContent className="p-4">
                <span className="text-xs font-medium text-amber-700">Gargalos Críticos (&gt; 5d)</span>
                <div className="text-2xl font-bold text-amber-800 mt-1">{operationalMetrics.delayedCount}</div>
                <span className="text-[11px] text-amber-600 flex items-center gap-1 mt-0.5">
                  <AlertTriangle className="h-3 w-3" />
                  Requerem intervenção
                </span>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-indigo-600">
              <CardContent className="p-4">
                <span className="text-xs font-medium text-indigo-700">Taxa de Deferimento</span>
                <div className="text-2xl font-bold text-indigo-900 mt-1">{operationalMetrics.deferralRate}%</div>
                <span className="text-[11px] text-indigo-600 flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="h-3 w-3" />
                  Pareceres favoráveis
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos Operacionais */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribuição por Status */}
            <Card>
              <CardHeader className="p-4 border-b border-slate-100">
                <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-emerald-600" />
                  Distribuição de Processos por Status Operacional
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Visão em tempo real da carga nas etapas de triagem, fila de parecer e conclusão.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistributionData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        label={({ name, percent }: { name?: string; percent?: number }) => `${name || ""}: ${((percent || 0) * 100).toFixed(0)}%`}
                      >
                        {statusDistributionData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={STATUS_COLORS[entry.name] || "#94A3B8"}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Carga por Parecerista */}
            <Card>
              <CardHeader className="p-4 border-b border-slate-100">
                <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-600" />
                  Carga de Trabalho & Produtividade por Parecerista
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Comparativo entre processos em análise técnica e pareceres já finalizados.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pharmacistWorkloadData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="emAnalise" name="Em Análise" fill="#6366F1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="concluidos" name="Concluídos" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Volume por Origem e Tabela de Gargalos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader className="p-4 border-b border-slate-100">
                <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-600" />
                  Demandas por Origem
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={originVolumeData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={75} />
                      <Tooltip />
                      <Bar dataKey="total" fill="#0EA5E9" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Processos Críticos / Gargalos (&gt; 5 dias na etapa)
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Acompanhamento de processos com risco iminente de extravasamento do prazo legal da SESAB.
                  </CardDescription>
                </div>
                <Link href="/atendimentos">
                  <Button variant="ghost" size="sm" className="text-xs text-emerald-700">
                    Ver todos na Fila ➔
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                {operationalMetrics.delayedProcesses.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Nenhum gargalo operacional detectado. Todos os processos estão dentro do SLA de 5 dias.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b text-slate-600 uppercase font-semibold">
                        <tr>
                          <th className="py-2.5 px-4">Processo SEI</th>
                          <th className="py-2.5 px-4">Paciente</th>
                          <th className="py-2.5 px-4">Status Atual</th>
                          <th className="py-2.5 px-4 text-rose-600">Dias Parado</th>
                          <th className="py-2.5 px-4 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {operationalMetrics.delayedProcesses.slice(0, 4).map((proc) => (
                          <tr key={proc.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-4 font-mono font-medium text-slate-900">{proc.numero_sei}</td>
                            <td className="py-2.5 px-4">{proc.paciente?.full_name}</td>
                            <td className="py-2.5 px-4">
                              <Badge variant="outline" className="text-[10px]">
                                {proc.status}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-4 font-bold text-rose-600">{proc.days_in_current_status} dias</td>
                            <td className="py-2.5 px-4 text-right">
                              <Link href="/atendimentos">
                                <Button size="sm" variant="outline" className="h-7 text-xs border-amber-300 text-amber-800 hover:bg-amber-50">
                                  Priorizar
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: DASHBOARD FARMACÊUTICO & EPIDEMIOLÓGICO */}
      {/* ========================================================================= */}
      {activeTab === "epidemiologico" && (
        <div className="space-y-6">
          {/* Cards Farmacêuticos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-slate-700">
              <CardContent className="p-4">
                <span className="text-xs font-medium text-slate-500">Total de Medicamentos Analisados</span>
                <div className="text-2xl font-bold text-slate-900 mt-1">{pharmaMetrics.totalItems}</div>
                <span className="text-[11px] text-slate-500">Prescrições reguladas</span>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-600">
              <CardContent className="p-4">
                <span className="text-xs font-medium text-blue-700">Medicamentos do CEAF</span>
                <div className="text-2xl font-bold text-blue-900 mt-1">{pharmaMetrics.ceafPercentage}%</div>
                <span className="text-[11px] text-blue-600">{pharmaMetrics.ceafCount} itens padronizados (RENAME)</span>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-600">
              <CardContent className="p-4">
                <span className="text-xs font-medium text-purple-700">Não Padronizados / Judiciais</span>
                <div className="text-2xl font-bold text-purple-900 mt-1">{pharmaMetrics.otherPercentage}%</div>
                <span className="text-[11px] text-purple-600">{pharmaMetrics.otherCount} itens em avaliação especial</span>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-600">
              <CardContent className="p-4">
                <span className="text-xs font-medium text-emerald-700">Diagnósticos (CIDs) Cobertos</span>
                <div className="text-2xl font-bold text-emerald-900 mt-1">{pharmaMetrics.topCids.length}</div>
                <span className="text-[11px] text-emerald-600">Patologias distintas</span>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos Epidemiológicos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Medicamentos */}
            <Card>
              <CardHeader className="p-4 border-b border-slate-100">
                <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Pill className="h-4 w-4 text-emerald-600" />
                  Top Medicamentos Mais Solicitados
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Identificação das principais moléculas demandadas com distinção entre CEAF e Não Padronizados.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pharmaMetrics.topMedications} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top CIDs */}
            <Card>
              <CardHeader className="p-4 border-b border-slate-100">
                <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-600" />
                  Patologias / CIDs-10 Mais Frequentes
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Doenças de maior impacto regulatório na Assistência Farmacêutica estadual.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pharmaMetrics.topCids} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <XAxis dataKey="code" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Desempenho por DIRES / Macrorregião */}
          <Card>
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-700" />
                Desfecho dos Pareceres por Diretoria Regional de Saúde (DIRES)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Taxa comparativa de deferimentos e indeferimentos técnicos por polo regional da Bahia.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pharmaMetrics.diresPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="deferidos" name="Deferidos" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="indeferidos" name="Indeferidos" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
