"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  PlusCircle,
  Search,
  Filter,
  Stethoscope,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle,
  Eye,
  Lock,
  RefreshCw,
  Pencil,
  Building2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useApp } from "@/lib/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { Consultation } from "@/lib/types";

export default function AtendimentosPage() {
  const {
    consultations,
    patients,
    cids,
    units,
    profiles,
    currentUser,
    updateConsultation,
    selectedUnitId,
    canEdit,
    activeUnit,
    isSupabaseOnline,
    isSyncing,
    refreshFromSupabase,
  } = useApp();

  const isAdmin = currentUser?.role === "admin";

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);

  // Estados do Modal de Edição (Admin)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingConsultation, setEditingConsultation] = useState<Consultation | null>(null);
  const [editUnitId, setEditUnitId] = useState("");
  const [editConsultationDate, setEditConsultationDate] = useState("");
  const [editPharmacistId, setEditPharmacistId] = useState("");
  const [editPrimaryCidId, setEditPrimaryCidId] = useState("");
  const [editIsNewPatient, setEditIsNewPatient] = useState(false);
  const [editIsGuidanceOnly, setEditIsGuidanceOnly] = useState(false);
  const [editPharmaceuticalDischarge, setEditPharmaceuticalDischarge] = useState(false);
  const [editInterventionsCount, setEditInterventionsCount] = useState<number>(0);
  const [editClinicalNotes, setEditClinicalNotes] = useState("");

  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);

  const handleOpenEditModal = (c: Consultation) => {
    setEditingConsultation(c);
    setEditUnitId(c.unit_id || "");
    setEditConsultationDate(c.consultation_date ? c.consultation_date.substring(0, 10) : "");
    setEditPharmacistId(c.pharmacist_id || "");
    setEditPrimaryCidId(c.primary_cid_id || "");
    setEditIsNewPatient(c.is_new_patient ?? false);
    setEditIsGuidanceOnly(c.is_pharmaceutical_guidance_only ?? false);
    setEditPharmaceuticalDischarge(c.pharmaceutical_discharge ?? false);
    setEditInterventionsCount(c.interventions_count ?? 0);
    setEditClinicalNotes(c.clinical_notes || "");
    setEditError(null);
    setEditSuccess(false);
    setIsEditModalOpen(true);
  };

  const handleSaveEditConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConsultation) return;

    if (!editUnitId) {
      setEditError("Por favor, selecione a Unidade de Atendimento.");
      return;
    }

    setEditLoading(true);
    setEditError(null);

    const res = await updateConsultation(editingConsultation.id, {
      unit_id: editUnitId,
      consultation_date: editConsultationDate,
      pharmacist_id: editPharmacistId,
      primary_cid_id: editPrimaryCidId,
      is_new_patient: editIsNewPatient,
      is_pharmaceutical_guidance_only: editIsGuidanceOnly,
      pharmaceutical_discharge: editPharmaceuticalDischarge,
      interventions_count: Number(editInterventionsCount) || 0,
      clinical_notes: editClinicalNotes,
    });

    setEditLoading(false);

    if (!res.success) {
      setEditError(res.error || "Erro ao atualizar atendimento.");
    } else {
      setEditSuccess(true);
      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditingConsultation(null);
        setEditSuccess(false);
      }, 1000);
    }
  };

  // Filtragem
  const filteredConsultations = useMemo(() => {
    return consultations.filter((c) => {
      // Filtro de unidade
      if (selectedUnitId !== "all" && c.unit_id !== selectedUnitId) {
        return false;
      }

      // Tipo de consulta
      if (filterType === "new" && !c.is_new_patient) return false;
      if (filterType === "return" && c.is_new_patient) return false;
      if (filterType === "guidance" && !c.is_pharmaceutical_guidance_only) return false;
      if (filterType === "discharge" && !c.pharmaceutical_discharge) return false;

      // Busca textual
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const pat = patients.find((p) => p.id === c.patient_id);
        const cid = cids.find((cd) => cd.id === c.primary_cid_id);
        const matchName = pat?.full_name.toLowerCase().includes(term);
        const matchCpf = pat?.cpf.includes(term);
        const matchCid = cid?.code.toLowerCase().includes(term) || cid?.description.toLowerCase().includes(term);
        if (!matchName && !matchCpf && !matchCid) return false;
      }

      return true;
    });
  }, [consultations, selectedUnitId, filterType, searchTerm, patients, cids]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-2xl font-bold text-[#171A20] tracking-tight">
            Consultas & Atendimentos Farmacêuticos
          </h1>
          <p className="text-xs text-[#5C5E62] mt-0.5">
            Registro clínico de consultas, avaliação da farmacoterapia e evolução farmacêutica.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isSupabaseOnline && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshFromSupabase()}
              disabled={isSyncing}
              className="text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Sincronizando..." : "Sincronizar Supabase"}
            </Button>
          )}
          {canEdit ? (
            <Link href="/atendimentos/novo">
              <Button variant="primary" size="md">
                <PlusCircle className="w-4 h-4 mr-1.5" />
                Novo Atendimento
              </Button>
            </Link>
          ) : (
            <Button
              variant="outline"
              size="md"
              disabled
              title="Ação desabilitada em modo Somente Leitura"
            >
              <Lock className="w-3.5 h-3.5 mr-1.5" />
              Novo Atendimento (Bloqueado)
            </Button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 relative">
              <Input
                placeholder="Buscar por nome do paciente, CPF ou código CID-10..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
              <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-2.5 pointer-events-none" />
            </div>

            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-[#F4F4F6] border border-[#D1D5DB] rounded text-[#171A20] focus:ring-1 focus:ring-[#171A20] focus:outline-none"
              >
                <option value="all">Todos os tipos de atendimento</option>
                <option value="new">1ª Consulta (Paciente Novo)</option>
                <option value="return">Consulta de Retorno</option>
                <option value="guidance">Apenas Orientação</option>
                <option value="discharge">Com Alta Farmacêutica</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Atendimentos */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#171A20] text-white border-b border-[#282C34]">
                  <th className="py-2.5 px-3 font-semibold">Data</th>
                  <th className="py-2.5 px-3 font-semibold">Paciente</th>
                  <th className="py-2.5 px-3 font-semibold">Unidade</th>
                  <th className="py-2.5 px-3 font-semibold">Tipo</th>
                  <th className="py-2.5 px-3 font-semibold">Diagnóstico (CID-10)</th>
                  <th className="py-2.5 px-3 font-semibold">PRFs Identificados</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Intervenções</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] bg-white">
                {filteredConsultations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs text-[#5C5E62]">
                      Nenhum atendimento farmacêutico localizado com os filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredConsultations.map((c) => {
                    const pat = patients.find((p) => p.id === c.patient_id);
                    const cid = cids.find((cd) => cd.id === c.primary_cid_id);
                    const unit = units.find((u) => u.id === c.unit_id);

                    return (
                      <tr key={c.id} className="hover:bg-[#F9FAFB] transition-colors">
                        <td className="py-3 px-3 font-medium text-[#171A20] whitespace-nowrap">
                          {formatDate(c.consultation_date)}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-[#171A20]">
                            {pat?.full_name || "Paciente não localizado"}
                          </div>
                          <div className="text-[11px] text-[#5C5E62] font-mono">
                            {pat?.cpf}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-[11px] text-[#5C5E62]">
                          {unit?.name || "-"}
                        </td>
                        <td className="py-3 px-3">
                          {c.is_pharmaceutical_guidance_only ? (
                            <Badge variant="neutral">Orientação</Badge>
                          ) : c.is_new_patient ? (
                            <Badge variant="default">1ª Consulta</Badge>
                          ) : (
                            <Badge variant="outline">Retorno</Badge>
                          )}
                          {c.pharmaceutical_discharge && (
                            <Badge variant="success" className="ml-1">
                              Alta
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-mono font-medium text-[#171A20]">
                            {cid?.code}
                          </div>
                          <div className="text-[11px] text-[#5C5E62] truncate max-w-[200px]">
                            {cid?.description}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {c.prfs && c.prfs.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {c.prfs.map((prf, pIdx) => (
                                <Badge
                                  key={pIdx}
                                  variant={prf.status === "Resolvido" ? "success" : "warning"}
                                  className="text-[10px]"
                                >
                                  {prf.category}: {prf.status}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[#9CA3AF] text-[11px]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-[#171A20]">
                          {c.interventions_count}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setSelectedConsultation(c)}
                              className="text-xs"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Ver SOAP
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenEditModal(c)}
                                className="text-xs text-[#0F533A] border-[#0F533A]/30 hover:bg-[#0F533A]/10 font-medium"
                                title="Editar dados e unidade do atendimento (Admin)"
                              >
                                <Pencil className="w-3 h-3 mr-1" />
                                Editar
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Detalhes da Consulta / SOAP */}
      <Dialog
        open={Boolean(selectedConsultation)}
        onOpenChange={(open) => !open && setSelectedConsultation(null)}
        title="Detalhes do Atendimento Farmacêutico"
        description={`Registro clínico de ${formatDate(selectedConsultation?.consultation_date || "")}`}
        maxWidth="lg"
      >
        {selectedConsultation && (
          <div className="space-y-4 text-xs">
            {/* Informações Gerais */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-[#F9FAFB] rounded border border-[#E5E7EB]">
              <div>
                <span className="text-[#5C5E62] block">Paciente:</span>
                <span className="font-semibold text-sm text-[#171A20]">
                  {patients.find((p) => p.id === selectedConsultation.patient_id)?.full_name}
                </span>
                <span className="text-[#5C5E62] block font-mono">
                  CPF: {patients.find((p) => p.id === selectedConsultation.patient_id)?.cpf}
                </span>
              </div>
              <div>
                <span className="text-[#5C5E62] block">Diagnóstico Principal:</span>
                <span className="font-semibold text-[#171A20]">
                  {cids.find((c) => c.id === selectedConsultation.primary_cid_id)?.code} —{" "}
                  {cids.find((c) => c.id === selectedConsultation.primary_cid_id)?.description}
                </span>
              </div>
            </div>

            {/* Unidade do Atendimento */}
            <div className="p-2.5 bg-white rounded border border-[#E5E7EB] flex items-center justify-between">
              <div>
                <span className="text-[#5C5E62] block text-[11px]">Unidade de Atendimento:</span>
                <span className="font-medium text-[#171A20]">
                  {units.find((u) => u.id === selectedConsultation.unit_id)?.name || "Unidade não localizada"}
                </span>
              </div>
              {isAdmin && (
                <Badge variant="outline" className="text-[10px] text-[#0F533A] border-[#0F533A]/30">
                  Editável por Admin
                </Badge>
              )}
            </div>

            {/* Medicamentos */}
            <div>
              <span className="font-bold text-[#171A20] block mb-1">
                Medicamentos Avaliados no Atendimento:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedConsultation.medications?.map((m) => (
                  <Badge key={m.id} variant="neutral">
                    {m.name} ({m.component})
                  </Badge>
                )) || <span className="text-[#9CA3AF]">Nenhum medicamento especificado</span>}
              </div>
            </div>

            {/* PRFs */}
            <div>
              <span className="font-bold text-[#171A20] block mb-1">
                Problemas Relacionados à Farmacoterapia (PRFs):
              </span>
              {selectedConsultation.prfs && selectedConsultation.prfs.length > 0 ? (
                <div className="space-y-2">
                  {selectedConsultation.prfs.map((prf, idx) => (
                    <div key={idx} className="p-2 border border-[#E5E7EB] rounded bg-white">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#171A20]">
                          PRF #{idx + 1}: {prf.category}
                        </span>
                        <Badge variant={prf.status === "Resolvido" ? "success" : "warning"}>
                          {prf.status}
                        </Badge>
                      </div>
                      {prf.description && (
                        <p className="text-[#5C5E62] mt-1">{prf.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-[#9CA3AF]">Nenhum PRF registrado nesta consulta.</span>
              )}
            </div>

            {/* Evolução Clínica SOAP */}
            <div>
              <span className="font-bold text-[#171A20] block mb-1">
                Evolução Farmacêutica / Registro Clínico (SOAP):
              </span>
              <div className="p-3 bg-[#F4F4F6] rounded border border-[#E5E7EB] whitespace-pre-wrap font-sans text-[#171A20] leading-relaxed">
                {selectedConsultation.clinical_notes || "Sem anotações clínicas registradas."}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
              {isAdmin ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const c = selectedConsultation;
                    setSelectedConsultation(null);
                    handleOpenEditModal(c);
                  }}
                  className="text-xs text-[#0F533A] border-[#0F533A]/30 hover:bg-[#0F533A]/10 font-medium"
                >
                  <Pencil className="w-3 h-3 mr-1.5" />
                  Editar Atendimento (Admin)
                </Button>
              ) : (
                <div />
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedConsultation(null)}
              >
                Fechar
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Modal de Edição de Atendimento Farmacêutico (Exclusivo Administrador) */}
      <Dialog
        open={isEditModalOpen}
        onOpenChange={(open) => {
          if (!editLoading) {
            setIsEditModalOpen(open);
            if (!open) {
              setEditingConsultation(null);
              setEditError(null);
              setEditSuccess(false);
            }
          }
        }}
        title="Editar Atendimento Farmacêutico"
        description="Acesso restrito para Administradores: alteração da Unidade de Saúde (BRS), dados da consulta e evolução clínica."
        maxWidth="xl"
      >
        {editingConsultation && (
          <form onSubmit={handleSaveEditConsultation} className="space-y-4 text-xs">
            {/* Mensagem de Erro / Sucesso */}
            {editError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2 text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="text-xs font-medium">{editError}</div>
              </div>
            )}

            {editSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <div className="text-xs font-medium">Atendimento atualizado com sucesso no Supabase!</div>
              </div>
            )}

            {/* Informações Fixas do Paciente */}
            <div className="p-3 bg-[#F9FAFB] rounded border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] text-[#5C5E62] block">Paciente:</span>
                <span className="font-semibold text-sm text-[#171A20]">
                  {patients.find((p) => p.id === editingConsultation.patient_id)?.full_name || "Paciente"}
                </span>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[11px] text-[#5C5E62] block">CPF:</span>
                <span className="font-mono text-xs font-medium text-[#171A20]">
                  {patients.find((p) => p.id === editingConsultation.patient_id)?.cpf || "-"}
                </span>
              </div>
            </div>

            {/* DESTAQUE PRINCIPAL: Unidade de Atendimento */}
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-300 rounded-md">
              <label className="block text-xs font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-700" />
                Unidade de Atendimento (BRS) *
              </label>
              <p className="text-[11px] text-emerald-800 mb-2">
                Como administrador, você pode transferir ou corrigir a unidade onde este atendimento foi realizado. Isso impactará os relatórios e indicadores da unidade.
              </p>
              <select
                value={editUnitId}
                onChange={(e) => setEditUnitId(e.target.value)}
                required
                className="w-full h-9 px-3 text-xs bg-white border border-emerald-400 rounded text-[#171A20] font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              >
                <option value="">Selecione uma unidade...</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.macroregion}) {!u.active ? "— [Inativa]" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Grid: Data e Farmacêutico Responsável */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#171A20] mb-1">
                  Data do Atendimento *
                </label>
                <Input
                  type="date"
                  value={editConsultationDate}
                  onChange={(e) => setEditConsultationDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#171A20] mb-1">
                  Farmacêutico Responsável *
                </label>
                <select
                  value={editPharmacistId}
                  onChange={(e) => setEditPharmacistId(e.target.value)}
                  required
                  className="w-full h-9 px-3 text-xs bg-[#F4F4F6] border border-[#D1D5DB] rounded text-[#171A20] focus:ring-1 focus:ring-[#171A20] focus:outline-none"
                >
                  <option value="">Selecione o farmacêutico...</option>
                  {profiles.map((prof) => (
                    <option key={prof.id} value={prof.id}>
                      {prof.full_name} {prof.crf ? `(CRF: ${prof.crf})` : ""} {prof.role === "admin" ? "[Admin]" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Diagnóstico Principal CID-10 */}
            <div>
              <label className="block text-xs font-medium text-[#171A20] mb-1">
                Diagnóstico Principal (CID-10) *
              </label>
              <select
                value={editPrimaryCidId}
                onChange={(e) => setEditPrimaryCidId(e.target.value)}
                required
                className="w-full h-9 px-3 text-xs bg-[#F4F4F6] border border-[#D1D5DB] rounded text-[#171A20] focus:ring-1 focus:ring-[#171A20] focus:outline-none"
              >
                <option value="">Selecione o CID-10...</option>
                {cids
                  .filter((c) => c.active !== false || c.id === editPrimaryCidId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.description}
                    </option>
                  ))}
              </select>
            </div>

            {/* Tipo de Atendimento & Flags */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[#F9FAFB] rounded border border-[#E5E7EB]">
              <div>
                <label className="block text-xs font-medium text-[#171A20] mb-1">
                  Tipo de Consulta
                </label>
                <select
                  value={editIsNewPatient ? "new" : "return"}
                  onChange={(e) => setEditIsNewPatient(e.target.value === "new")}
                  className="w-full h-8 px-2 text-xs bg-white border border-[#D1D5DB] rounded text-[#171A20]"
                >
                  <option value="new">1ª Consulta (Paciente Novo)</option>
                  <option value="return">Consulta de Retorno</option>
                </select>
              </div>

              <div className="flex flex-col justify-center space-y-1.5 pt-1 sm:pt-0">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#171A20]">
                  <input
                    type="checkbox"
                    checked={editIsGuidanceOnly}
                    onChange={(e) => setEditIsGuidanceOnly(e.target.checked)}
                    className="rounded border-[#D1D5DB] text-[#0F533A] focus:ring-[#0F533A]"
                  />
                  Apenas Orientação
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#171A20]">
                  <input
                    type="checkbox"
                    checked={editPharmaceuticalDischarge}
                    onChange={(e) => setEditPharmaceuticalDischarge(e.target.checked)}
                    className="rounded border-[#D1D5DB] text-[#0F533A] focus:ring-[#0F533A]"
                  />
                  Alta Farmacêutica
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#171A20] mb-1">
                  Intervenções Realizadas
                </label>
                <Input
                  type="number"
                  min="0"
                  value={editInterventionsCount}
                  onChange={(e) => setEditInterventionsCount(parseInt(e.target.value, 10) || 0)}
                  className="h-8"
                />
              </div>
            </div>

            {/* Anotações Clínicas / SOAP */}
            <div>
              <label className="block text-xs font-medium text-[#171A20] mb-1">
                Evolução Farmacêutica / Registro Clínico (SOAP)
              </label>
              <textarea
                rows={5}
                value={editClinicalNotes}
                onChange={(e) => setEditClinicalNotes(e.target.value)}
                placeholder="S (Subjetivo), O (Objetivo), A (Avaliação), P (Plano)..."
                className="w-full p-2.5 text-xs bg-white border border-[#D1D5DB] rounded text-[#171A20] focus:ring-1 focus:ring-[#171A20] focus:outline-none font-sans"
              />
            </div>

            {/* Ações / Footer */}
            <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingConsultation(null);
                }}
                disabled={editLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={editLoading}
              >
                {editLoading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
