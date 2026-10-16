"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Printer,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  Filter,
} from "lucide-react";
import { useApp } from "@/lib/context/AppContext";
import { calculateIndicators } from "@/lib/indicators";
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

const MONTHS = [
  { value: "0", label: "Ano Completo (Consolidado)" },
  { value: "1", label: "01 - Janeiro" },
  { value: "2", label: "02 - Fevereiro" },
  { value: "3", label: "03 - Março" },
  { value: "4", label: "04 - Abril" },
  { value: "5", label: "05 - Maio" },
  { value: "6", label: "06 - Junho" },
  { value: "7", label: "07 - Julho" },
  { value: "8", label: "08 - Agosto" },
  { value: "9", label: "09 - Setembro" },
  { value: "10", label: "10 - Outubro" },
  { value: "11", label: "11 - Novembro" },
  { value: "12", label: "12 - Dezembro" },
];

export default function IndicadoresPage() {
  const {
    units,
    patients,
    consultations,
    monthlyData,
    selectedUnitId,
    setSelectedUnitId,
  } = useApp();

  const [selectedMacroregion, setSelectedMacroregion] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(10); // Outubro 2026 default

  // Lista de macrorregionais únicas
  const macroregions = useMemo(() => {
    return Array.from(new Set(units.map((u) => u.macroregion)));
  }, [units]);

  // Unidades filtradas pela macrorregional
  const availableUnits = useMemo(() => {
    if (selectedMacroregion === "all") return units;
    return units.filter((u) => u.macroregion === selectedMacroregion);
  }, [units, selectedMacroregion]);

  // Cálculo dos 11 Indicadores com os filtros selecionados
  const indicators = useMemo(() => {
    return calculateIndicators(consultations, monthlyData, patients, {
      unitId: selectedUnitId === "all" ? undefined : selectedUnitId,
      macroregion: selectedMacroregion === "all" ? undefined : selectedMacroregion,
      year: selectedYear,
      month: selectedMonth === 0 ? undefined : selectedMonth,
    });
  }, [
    consultations,
    monthlyData,
    patients,
    selectedUnitId,
    selectedMacroregion,
    selectedYear,
    selectedMonth,
  ]);

  // Dados para gráficos Recharts
  const prfStatusData = useMemo(() => {
    const allPrfs = consultations.flatMap((c) => c.prfs || []);
    const counts: Record<string, number> = {
      Resolvido: 0,
      "Em resolução": 0,
      "Não resolvido": 0,
      "Aguardando retorno": 0,
    };
    allPrfs.forEach((p) => {
      if (counts[p.status] !== undefined) counts[p.status]++;
    });
    return [
      { name: "Resolvido", value: counts["Resolvido"], color: "#10B981" },
      { name: "Em resolução", value: counts["Em resolução"], color: "#F59E0B" },
      { name: "Não resolvido", value: counts["Não resolvido"], color: "#E82127" },
      { name: "Aguardando retorno", value: counts["Aguardando retorno"], color: "#6B7280" },
    ];
  }, [consultations]);

  const monthlyVolumeData = useMemo(() => {
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return months.map((mName, idx) => {
      const mNum = idx + 1;
      const mConsults = consultations.filter((c) => {
        const d = new Date(c.consultation_date);
        return d.getUTCFullYear() === selectedYear && d.getUTCMonth() + 1 === mNum;
      });
      const first = mConsults.filter((c) => c.is_new_patient).length;
      const follow = mConsults.filter((c) => !c.is_new_patient && !c.is_pharmaceutical_guidance_only).length;
      const guidance = mConsults.filter((c) => c.is_pharmaceutical_guidance_only).length;

      return {
        mes: mName,
        "1ª Consulta": first,
        Retorno: follow,
        "Orientação Apenas": guidance,
      };
    });
  }, [consultations, selectedYear]);

  // Exportar dados para CSV
  const handleExportCSV = () => {
    const header = "Nº;Código;Denominação do Indicador;Origem do Dado;Método de Cálculo;Numerador;Denominador;Resultado Oficial;Unidade;Periodicidade\n";
    const rows = indicators
      .map(
        (ind) =>
          `"${ind.number}";"${ind.code}";"${ind.title}";"${getIndicatorSource(ind.code).label}";"${ind.method}";"${ind.numerator ?? "-"}";"${ind.denominator ?? "-"}";"${ind.result}";"${ind.unit}";"${ind.periodicity}"`
      )
      .join("\n");
    const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `indicadores_farmaceuticos_${selectedYear}_${selectedMonth || "ano"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const currentUnitObj = units.find((u) => u.id === selectedUnitId);

  // Mapeamento explícito da origem de cada indicador
  function getIndicatorSource(code: string): { label: string; type: "clinico" | "mensal"; description: string } {
    if (["IND-02", "IND-03", "IND-04", "IND-05", "IND-06", "IND-07", "IND-08"].includes(code)) {
      return {
        label: "Prontuário Clínico",
        type: "clinico",
        description: "Calculado dinamicamente das consultas e atendimentos registrados no sistema pelos farmacêuticos.",
      };
    }
    return {
      label: "Fechamento AFSESAB",
      type: "mensal",
      description: "Alimentado mensalmente na tela Fechamento Mensal com os dados de dispensação e atividades coletivas.",
    };
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#171A20] tracking-tight">
              Indicadores do Cuidado Farmacêutico (CEAF)
            </h1>
            <Badge variant="outline" className="text-xs">
              Metodologia Oficial CEAF
            </Badge>
          </div>
          <p className="text-xs text-[#5C5E62] mt-1">
            Painel auditável e transparente dos 11 indicadores oficiais da Assistência Farmacêutica Especializada.
          </p>
        </div>

        <div className="flex items-center gap-2 no-print">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-emerald-700" />
            Exportar CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={handlePrint}>
            <Printer className="w-3.5 h-3.5 mr-1 text-[#171A20]" />
            Imprimir Relatório
          </Button>
        </div>
      </div>



      {/* Filter Toolbar */}
      <Card className="no-print border-[#E5E7EB] bg-white">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Macrorregional */}
            <div>
              <label className="block text-[11px] font-semibold uppercase text-[#5C5E62] mb-1">
                Macrorregional de Saúde
              </label>
              <select
                value={selectedMacroregion}
                onChange={(e) => {
                  setSelectedMacroregion(e.target.value);
                  setSelectedUnitId("all");
                }}
                className="w-full h-9 px-3 text-xs bg-[#F4F4F6] border border-[#D1D5DB] rounded text-[#171A20] focus:ring-1 focus:ring-[#171A20] focus:outline-none"
              >
                <option value="all">Todas as Macrorregionais</option>
                {macroregions.map((macro) => (
                  <option key={macro} value={macro}>
                    {macro}
                  </option>
                ))}
              </select>
            </div>

            {/* Unidade */}
            <div>
              <label className="block text-[11px] font-semibold uppercase text-[#5C5E62] mb-1">
                Unidade / BRS
              </label>
              <select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-[#F4F4F6] border border-[#D1D5DB] rounded text-[#171A20] focus:ring-1 focus:ring-[#171A20] focus:outline-none"
              >
                <option value="all">Todas as Unidades da Região</option>
                {availableUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.municipality})
                  </option>
                ))}
              </select>
            </div>

            {/* Ano */}
            <div>
              <label className="block text-[11px] font-semibold uppercase text-[#5C5E62] mb-1">
                Ano de Competência
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full h-9 px-3 text-xs bg-[#F4F4F6] border border-[#D1D5DB] rounded text-[#171A20] focus:ring-1 focus:ring-[#171A20] focus:outline-none"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
                <option value={2024}>2024</option>
              </select>
            </div>

            {/* Mês */}
            <div>
              <label className="block text-[11px] font-semibold uppercase text-[#5C5E62] mb-1">
                Mês
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full h-9 px-3 text-xs bg-[#F4F4F6] border border-[#D1D5DB] rounded text-[#171A20] focus:ring-1 focus:ring-[#171A20] focus:outline-none"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Headline Cards (Tesla High-Contrast Engineering Style) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Card 1: Pacientes em Acompanhamento */}
        <div className="bg-[#171A20] text-white p-4 rounded shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium tracking-wider text-[#A0A2A8] uppercase">
              Em Acompanhamento
            </span>
            <span className="text-[10px] font-semibold bg-[#282C34] text-[#E82127] px-1.5 py-0.5 rounded">
              IND-01
            </span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
            {indicators[0]?.result}
          </div>
          <p className="text-[11px] text-[#A0A2A8] mt-1 truncate">
            {currentUnitObj ? currentUnitObj.name : "Total Macrorregional"}
          </p>
        </div>

        {/* Card 2: Consultas Clínicas */}
        <div className="bg-white border border-[#E5E7EB] p-4 rounded shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium tracking-wider text-[#5C5E62] uppercase">
              Pacientes Atendidos
            </span>
            <span className="text-[10px] font-semibold bg-[#F4F4F6] text-[#171A20] px-1.5 py-0.5 rounded">
              IND-02
            </span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-[#171A20] tracking-tight">
            {indicators[1]?.result}
          </div>
          <p className="text-[11px] text-[#5C5E62] mt-1">
            Consultas no mês de competência
          </p>
        </div>

        {/* Card 3: Taxa de Resolução de PRFs */}
        <div className="bg-white border border-[#E5E7EB] p-4 rounded shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium tracking-wider text-[#5C5E62] uppercase">
              Resolução de PRFs
            </span>
            <span className="text-[10px] font-semibold bg-[#F4F4F6] text-[#171A20] px-1.5 py-0.5 rounded">
              IND-06
            </span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-[#10B981] tracking-tight flex items-baseline gap-1">
            {indicators[5]?.result}%
          </div>
          <p className="text-[11px] text-[#5C5E62] mt-1">
            {indicators[5]?.numerator} de {indicators[5]?.denominator} resolvidos
          </p>
        </div>

        {/* Card 4: Cobertura 1ª Dispensação */}
        <div className="bg-white border border-[#E5E7EB] p-4 rounded shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium tracking-wider text-[#5C5E62] uppercase">
              Cobertura 1ª Dispensação
            </span>
            <span className="text-[10px] font-semibold bg-[#F4F4F6] text-[#171A20] px-1.5 py-0.5 rounded">
              IND-11
            </span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-[#171A20] tracking-tight">
            {indicators[10]?.result}%
          </div>
          <p className="text-[11px] text-[#5C5E62] mt-1">
            {indicators[10]?.numerator} de {indicators[10]?.denominator} novos processos
          </p>
        </div>
      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 no-print">
        {/* Monthly Volume Bar Chart */}
        <Card className="lg:col-span-2 border-[#E5E7EB]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Volume Mensal de Consultas Farmacêuticas ({selectedYear})</span>
              <span className="text-xs font-normal text-[#5C5E62]">1ª Consulta vs Retorno</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyVolumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#5C5E62" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#5C5E62" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#171A20",
                      borderColor: "#282C34",
                      color: "#fff",
                      fontSize: "12px",
                      borderRadius: "4px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  <Bar dataKey="1ª Consulta" fill="#E82127" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Retorno" fill="#171A20" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Orientação Apenas" fill="#9CA3AF" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* PRFs Status Pie Chart */}
        <Card className="border-[#E5E7EB]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Status dos PRFs Detectados
            </CardTitle>
            <CardDescription>
              Resolução de problemas farmacoterapêuticos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={prfStatusData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {prfStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#171A20",
                      color: "#fff",
                      fontSize: "12px",
                      borderRadius: "4px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABELA OFICIAL DOS 11 INDICADORES DA ASSISTÊNCIA FARMACÊUTICA */}
      <Card className="border-[#E5E7EB] shadow-xs">
        <CardHeader className="border-b border-[#E5E7EB] bg-[#FAFAFB]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-[#171A20]">
                Tabela Oficial dos 11 Indicadores do Cuidado Farmacêutico (CEAF)
              </CardTitle>
              <CardDescription>
                Competência: {selectedMonth ? MONTHS.find((m) => m.value === String(selectedMonth))?.label : "Ano Consolidado"} / {selectedYear}
                {" — "} Unidade: {currentUnitObj ? currentUnitObj.name : "Consolidado Macrorregional"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-[#5C5E62]">
                Total de Linhas: 11
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#171A20] text-white border-b border-[#282C34]">
                  <th className="py-2.5 px-3 font-semibold w-12 text-center">Nº</th>
                  <th className="py-2.5 px-3 font-semibold w-20">Código</th>
                  <th className="py-2.5 px-4 font-semibold">Denominação do Indicador</th>
                  <th className="py-2.5 px-3 font-semibold text-center w-36">Origem do Dado</th>
                  <th className="py-2.5 px-3 font-semibold text-center w-24">
                    Numerador
                  </th>
                  <th className="py-2.5 px-3 font-semibold text-center w-24">
                    Denominador
                  </th>
                  <th className="py-2.5 px-4 font-bold text-right w-28 bg-[#282C34] text-white">
                    Resultado
                  </th>
                  <th className="py-2.5 px-3 font-semibold text-center w-20 hidden sm:table-cell">
                    Unidade
                  </th>
                  <th className="py-2.5 px-3 font-semibold text-center w-24 hidden lg:table-cell">
                    Periodicidade
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] bg-white">
                {indicators.map((ind) => {
                  const source = getIndicatorSource(ind.code);
                  return (
                    <tr
                      key={ind.number}
                      className="hover:bg-[#F9FAFB] transition-colors"
                    >
                      <td className="py-3 px-3 text-center font-bold text-[#5C5E62]">
                        {String(ind.number).padStart(2, "0")}
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-[#171A20]">
                        <span className="bg-[#F4F4F6] px-1.5 py-0.5 rounded text-[11px]">
                          {ind.code}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#171A20]">
                          {ind.title}
                        </div>
                        <div className="text-[11px] text-[#5C5E62] mt-0.5">
                          {ind.description}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${
                            source.type === "clinico"
                              ? "bg-blue-50 text-blue-800 border-blue-200"
                              : "bg-purple-50 text-purple-800 border-purple-200"
                          }`}
                          title={source.description}
                        >
                          {source.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-[#171A20] font-medium font-mono">
                        {ind.numerator !== null ? ind.numerator : "-"}
                      </td>
                      <td className="py-3 px-3 text-center text-[#171A20] font-medium font-mono">
                        {ind.denominator !== null ? ind.denominator : "-"}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-sm bg-[#FAFAFB] text-[#171A20]">
                        <span className="px-2 py-0.5 rounded bg-white border border-[#E5E7EB]">
                          {ind.result}
                          {ind.unit === "%" ? "%" : ""}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-[11px] text-[#5C5E62] hidden sm:table-cell">
                        {ind.unit}
                      </td>
                      <td className="py-3 px-3 text-center text-[11px] text-[#5C5E62] hidden lg:table-cell">
                        {ind.periodicity}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
