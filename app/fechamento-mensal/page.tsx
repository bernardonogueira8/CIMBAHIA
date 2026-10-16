"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarCheck,
  Save,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Lock,
  Building2,
  Calendar,
} from "lucide-react";
import { useApp } from "@/lib/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MonthlyComplementaryData } from "@/lib/types";

const MONTHS = [
  { value: 1, label: "01 - Janeiro" },
  { value: 2, label: "02 - Fevereiro" },
  { value: 3, label: "03 - Março" },
  { value: 4, label: "04 - Abril" },
  { value: 5, label: "05 - Maio" },
  { value: 6, label: "06 - Junho" },
  { value: 7, label: "07 - Julho" },
  { value: 8, label: "08 - Agosto" },
  { value: 9, label: "09 - Setembro" },
  { value: 10, label: "10 - Outubro" },
  { value: 11, label: "11 - Novembro" },
  { value: 12, label: "12 - Dezembro" },
];

export default function FechamentoMensalPage() {
  const {
    monthlyData,
    units,
    selectedUnitId,
    currentUser,
    activeUnit,
    canEdit,
    updateMonthlyData,
  } = useApp();

  const [year, setYear] = useState<number>(2026);
  const [month, setMonth] = useState<number>(10);

  // Valores dos 5 campos agregados
  const [followupPatients, setFollowupPatients] = useState<number>(0);
  const [collectiveActivities, setCollectiveActivities] = useState<number>(0);
  const [afsesabPatients, setAfsesabPatients] = useState<number>(0);
  const [firstDispensing, setFirstDispensing] = useState<number>(0);
  const [totalNewPatients, setTotalNewPatients] = useState<number>(0);

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Unidade alvo da edição
  const targetUnitId =
    currentUser.role === "admin" && selectedUnitId !== "all"
      ? selectedUnitId
      : currentUser.unit_id || "11111111-1111-1111-1111-111111111111";

  const targetUnit = units.find((u) => u.id === targetUnitId);

  // Carregar dados existentes para a competência selecionada
  useEffect(() => {
    const existing = monthlyData.find(
      (m) => m.unit_id === targetUnitId && m.year === year && m.month === month
    );
    if (existing) {
      setFollowupPatients(existing.total_patients_in_followup);
      setCollectiveActivities(existing.collective_health_activities);
      setAfsesabPatients(existing.dispensing_administrative_patients);
      setFirstDispensing(existing.first_dispensing_by_pharmacist);
      setTotalNewPatients(existing.total_new_patients_month);
    } else {
      setFollowupPatients(0);
      setCollectiveActivities(0);
      setAfsesabPatients(0);
      setFirstDispensing(0);
      setTotalNewPatients(0);
    }
    setSavedSuccess(false);
  }, [targetUnitId, year, month, monthlyData]);

  // Cálculo prévio do Indicador 11
  const coverageRate =
    totalNewPatients > 0
      ? Number(((firstDispensing / totalNewPatients) * 100).toFixed(1))
      : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    updateMonthlyData({
      unit_id: targetUnitId,
      year,
      month,
      total_patients_in_followup: Number(followupPatients),
      collective_health_activities: Number(collectiveActivities),
      dispensing_administrative_patients: Number(afsesabPatients),
      first_dispensing_by_pharmacist: Number(firstDispensing),
      total_new_patients_month: Number(totalNewPatients),
      updated_by: currentUser.id,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-[#171A20] tracking-tight">
            Fechamento Mensal dos Indicadores
          </h1>
          <Badge variant="outline">Planilha Complementar Oficial</Badge>
        </div>
        <p className="text-xs text-[#5C5E62] mt-0.5">
          Alimentação mensal dos dados agregados de dispensação administrativa (AFSESAB), atividades coletivas e capacidade instalada da unidade.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Dados da competência <strong>{String(month).padStart(2, "0")}/{year}</strong> salvos com sucesso para a unidade <strong>{targetUnit?.name}</strong>!
          </span>
        </div>
      )}

      {/* Seleção de Competência e Unidade */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-[#5C5E62] mb-1">
                Unidade de Saúde
              </label>
              <div className="h-9 px-3 bg-[#F4F4F6] border border-[#E5E7EB] rounded flex items-center gap-2 text-xs font-semibold text-[#171A20]">
                <Building2 className="w-3.5 h-3.5 text-[#5C5E62]" />
                <span className="truncate">{targetUnit?.name}</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-[#5C5E62] mb-1">
                Ano
              </label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full h-9 px-3 text-xs bg-white border border-[#D1D5DB] rounded text-[#171A20] focus:ring-1 focus:ring-[#171A20] focus:outline-none"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
                <option value={2024}>2024</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-[#5C5E62] mb-1">
                Mês de Competência
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full h-9 px-3 text-xs bg-white border border-[#D1D5DB] rounded text-[#171A20] focus:ring-1 focus:ring-[#171A20] focus:outline-none"
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

      {/* Formulário dos 5 Indicadores Agregados */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader className="py-3 bg-[#FAFAFB]">
            <CardTitle className="text-sm">
              Indicadores Complementares da Competência ({String(month).padStart(2, "0")}/{year})
            </CardTitle>
            <CardDescription>
              Preencha os dados oficiais apurados no final do mês de referência.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {/* Campo 1 */}
            <div className="p-3 bg-[#FAFAFB] border border-[#E5E7EB] rounded space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#171A20]">
                  1. Pacientes em Acompanhamento Farmacoterapêutico Ativo na Unidade
                </label>
                <Badge variant="neutral">Alimenta IND-01</Badge>
              </div>
              <p className="text-[11px] text-[#5C5E62]">
                Número total acumulado de pacientes com plano de cuidado farmacêutico em andamento na unidade.
              </p>
              <div className="w-full sm:w-64 pt-1">
                <Input
                  type="number"
                  min={0}
                  value={followupPatients}
                  onChange={(e) => setFollowupPatients(Number(e.target.value))}
                  disabled={!canEdit}
                  required
                />
              </div>
            </div>

            {/* Campo 2 */}
            <div className="p-3 bg-[#FAFAFB] border border-[#E5E7EB] rounded space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#171A20]">
                  2. Atividades Coletivas / Grupos Educativos Realizados no Mês
                </label>
                <Badge variant="neutral">Alimenta IND-09</Badge>
              </div>
              <p className="text-[11px] text-[#5C5E62]">
                Total de ações educativas em saúde, rodas de conversa ou palestras comunitárias realizadas pela equipe farmacêutica no mês.
              </p>
              <div className="w-full sm:w-64 pt-1">
                <Input
                  type="number"
                  min={0}
                  value={collectiveActivities}
                  onChange={(e) => setCollectiveActivities(Number(e.target.value))}
                  disabled={!canEdit}
                  required
                />
              </div>
            </div>

            {/* Campo 3 */}
            <div className="p-3 bg-[#FAFAFB] border border-[#E5E7EB] rounded space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#171A20]">
                  3. Pacientes Atendidos Administrativamente na Dispensação (Fonte AFSESAB)
                </label>
                <Badge variant="neutral">Alimenta IND-10</Badge>
              </div>
              <p className="text-[11px] text-[#5C5E62]">
                Total de pacientes atendidos no balcão da farmácia para retirada regular de medicamentos CEAF (extraído do sistema AFSESAB).
              </p>
              <div className="w-full sm:w-64 pt-1">
                <Input
                  type="number"
                  min={0}
                  value={afsesabPatients}
                  onChange={(e) => setAfsesabPatients(Number(e.target.value))}
                  disabled={!canEdit}
                  required
                />
              </div>
            </div>

            {/* Campos 4 e 5: Indicador 11 */}
            <div className="p-3 bg-[#FAFAFB] border border-[#E5E7EB] rounded space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#171A20]">
                  4 & 5. Cobertura de Primeira Dispensação pelo Farmacêutico
                </label>
                <Badge variant="neutral">Alimenta IND-11</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-[#393C41] block mb-1">
                    Nº de Primeiras Dispensações Realizadas por Farmacêutico (Numerador) *
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={firstDispensing}
                    onChange={(e) => setFirstDispensing(Number(e.target.value))}
                    disabled={!canEdit}
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#393C41] block mb-1">
                    Total de Processos Novos / Pacientes Novos na Unidade (Denominador) *
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={totalNewPatients}
                    onChange={(e) => setTotalNewPatients(Number(e.target.value))}
                    disabled={!canEdit}
                    required
                  />
                </div>
              </div>

              {/* Prévia do Resultado do IND-11 */}
              <div className="flex items-center justify-between p-2.5 bg-white border border-[#E5E7EB] rounded text-xs">
                <span className="text-[#5C5E62]">
                  Cálculo Automático do Indicador 11:
                </span>
                <span className="font-bold text-sm text-[#171A20]">
                  {coverageRate}% de Cobertura
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botão de Salvar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {canEdit ? (
            <Button type="submit" variant="primary" size="md" className="min-w-[180px]">
              <Save className="w-4 h-4 mr-1.5" />
              Salvar Fechamento Mensal
            </Button>
          ) : (
            <Button variant="outline" size="md" disabled>
              <Lock className="w-3.5 h-3.5 mr-1.5" />
              Salvar Fechamento (Somente Leitura)
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
