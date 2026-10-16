"use client";

import React, { useState, useMemo } from "react";
import {
  UserPlus,
  Search,
  Users,
  Phone,
  Calendar,
  History,
  FileText,
  Lock,
  CheckCircle2,
  AlertCircle,
  Activity,
  Building2,
} from "lucide-react";
import { useApp } from "@/lib/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { formatCPF, formatPhone, formatDate } from "@/lib/utils";
import { Patient, PatientStatus } from "@/lib/types";

export default function PacientesPage() {
  const {
    patients,
    consultations,
    cids,
    units,
    profiles,
    selectedUnitId,
    currentUser,
    activeUnit,
    canEdit,
    addPatient,
    updatePatient,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPatientForHistory, setSelectedPatientForHistory] = useState<Patient | null>(null);

  // Modal de Novo Paciente
  const [isNewPatientOpen, setIsNewPatientOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [cns, setCns] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<PatientStatus>("em_acompanhamento");

  // Filtragem de pacientes (Uso Comum entre Unidades)
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      // Se há termo de busca por nome ou CPF, busca em TODAS as unidades da rede
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().replace(/[.\-]/g, "");
        const cleanCpf = p.cpf.replace(/[.\-]/g, "");
        const matchName = p.full_name.toLowerCase().includes(term);
        const matchCpf = cleanCpf.includes(term);
        const matchCns = p.cns?.replace(/\s/g, "").includes(term);
        if (!matchName && !matchCpf && !matchCns) return false;
      } else if (selectedUnitId !== "all" && p.unit_id !== selectedUnitId) {
        return false;
      }

      if (statusFilter !== "all" && p.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [patients, selectedUnitId, statusFilter, searchTerm]);

  // Histórico de consultas do paciente selecionado (Todas as unidades ordenadas por data)
  const patientConsultations = useMemo(() => {
    if (!selectedPatientForHistory) return [];
    return consultations
      .filter((c) => c.patient_id === selectedPatientForHistory.id)
      .sort((a, b) => new Date(b.consultation_date).getTime() - new Date(a.consultation_date).getTime());
  }, [selectedPatientForHistory, consultations]);

  const handleSavePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!fullName.trim() || !cpf.trim()) {
      alert("Preencha Nome e CPF.");
      return;
    }
    const targetUnitId =
      currentUser?.unit_id || (selectedUnitId !== "all" ? selectedUnitId : null);
    if (!targetUnitId) {
      alert("Selecione uma unidade no cabeçalho para vincular o cadastro do paciente.");
      return;
    }

    addPatient({
      unit_id: targetUnitId,
      full_name: fullName.trim(),
      cpf: cpf.trim(),
      cns: cns.trim() || undefined,
      birth_date: birthDate || undefined,
      phone: phone.trim() || undefined,
      status: status,
      created_by: currentUser?.id,
    });

    setIsNewPatientOpen(false);
    setFullName("");
    setCpf("");
    setCns("");
    setBirthDate("");
    setPhone("");
    setStatus("em_acompanhamento");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-2xl font-bold text-[#171A20] tracking-tight">
            Cadastro e Acompanhamento de Pacientes
          </h1>
          <p className="text-xs text-[#5C5E62] mt-0.5">
            Gestão dos usuários vinculados ao Cuidado Farmacêutico nas macrorregionais de saúde.
          </p>
        </div>

        <div>
          {canEdit ? (
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsNewPatientOpen(true)}
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              Novo Paciente
            </Button>
          ) : (
            <Button
              variant="outline"
              size="md"
              disabled
              title="Ação desabilitada em modo Somente Leitura"
            >
              <Lock className="w-3.5 h-3.5 mr-1.5" />
              Novo Paciente (Bloqueado)
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
                placeholder="Buscar paciente por nome, CPF ou cartão SUS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
              <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-2.5 pointer-events-none" />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-[#F4F4F6] border border-[#D1D5DB] rounded text-[#171A20] focus:ring-1 focus:ring-[#171A20] focus:outline-none"
              >
                <option value="all">Todos os Status</option>
                <option value="em_acompanhamento">Em Acompanhamento Ativo</option>
                <option value="alta">Com Alta Farmacêutica</option>
                <option value="inativo">Inativo / Descontinuado</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Pacientes */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#171A20] text-white border-b border-[#282C34]">
                  <th className="py-2.5 px-3 font-semibold">Nome Completo</th>
                  <th className="py-2.5 px-3 font-semibold">CPF</th>
                  <th className="py-2.5 px-3 font-semibold hidden md:table-cell">Cartão SUS</th>
                  <th className="py-2.5 px-3 font-semibold">Unidade de Saúde</th>
                  <th className="py-2.5 px-3 font-semibold hidden sm:table-cell">Telefone</th>
                  <th className="py-2.5 px-3 font-semibold">Status Clínico</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Consultas</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] bg-white">
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs text-[#5C5E62]">
                      Nenhum paciente localizado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((patient) => {
                    const unit = units.find((u) => u.id === patient.unit_id);
                    const consultCount = consultations.filter(
                      (c) => c.patient_id === patient.id
                    ).length;

                    return (
                      <tr
                        key={patient.id}
                        className="hover:bg-[#F9FAFB] transition-colors"
                      >
                        <td className="py-3 px-3 font-semibold text-[#171A20]">
                          {patient.full_name}
                        </td>
                        <td className="py-3 px-3 font-mono text-[#393C41]">
                          {patient.cpf}
                        </td>
                        <td className="py-3 px-3 font-mono text-[#5C5E62] hidden md:table-cell">
                          {patient.cns || "—"}
                        </td>
                        <td className="py-3 px-3 text-[11px] text-[#5C5E62]">
                          {unit?.name || "-"}
                        </td>
                        <td className="py-3 px-3 text-[#5C5E62] hidden sm:table-cell">
                          {patient.phone ? formatPhone(patient.phone) : "—"}
                        </td>
                        <td className="py-3 px-3">
                          {patient.status === "em_acompanhamento" ? (
                            <Badge variant="success">Em Acompanhamento</Badge>
                          ) : patient.status === "alta" ? (
                            <Badge variant="outline">Alta Concedida</Badge>
                          ) : (
                            <Badge variant="neutral">Inativo</Badge>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-[#171A20]">
                          {consultCount}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedPatientForHistory(patient)}
                            className="text-xs"
                          >
                            <History className="w-3.5 h-3.5 mr-1" />
                            Histórico
                          </Button>
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

      {/* Modal Histórico do Paciente */}
      <Dialog
        open={Boolean(selectedPatientForHistory)}
        onOpenChange={(open) => !open && setSelectedPatientForHistory(null)}
        title={`Histórico Clínico — ${selectedPatientForHistory?.full_name}`}
        description={`CPF: ${selectedPatientForHistory?.cpf} · Cartão SUS: ${selectedPatientForHistory?.cns || "Não informado"}`}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          {patientConsultations.length === 0 ? (
            <div className="p-6 text-center text-[#5C5E62] border border-dashed rounded bg-[#FAFAFB]">
              Este paciente ainda não possui consultas ou atendimentos registrados.
            </div>
          ) : (
            <div className="space-y-3">
              {patientConsultations.map((c, idx) => {
                const cid = cids.find((cd) => cd.id === c.primary_cid_id);
                const uName = units.find((u) => u.id === c.unit_id)?.name || "Unidade de Saúde";
                const pName = profiles.find((p) => p.id === c.pharmacist_id)?.full_name || "Farmacêutico";
                return (
                  <div
                    key={c.id}
                    className="p-3 border border-[#E5E7EB] rounded bg-[#FAFAFB] space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-[#171A20] text-sm">
                          {formatDate(c.consultation_date)}
                        </span>
                        <Badge variant="outline" className="text-[10px] bg-white border-[#D1D5DB]">
                          <Building2 className="w-3 h-3 mr-1 text-[#5C5E62]" />
                          {uName}
                        </Badge>
                        {c.is_pharmaceutical_guidance_only ? (
                          <Badge variant="neutral">Orientação</Badge>
                        ) : c.is_new_patient ? (
                          <Badge variant="default">1ª Consulta</Badge>
                        ) : (
                          <Badge variant="outline">Retorno</Badge>
                        )}
                        {c.pharmaceutical_discharge && (
                          <Badge variant="success">Alta Farmacêutica</Badge>
                        )}
                      </div>
                      <span className="text-[11px] text-[#5C5E62]">
                        Farmacêutico: <strong>{pName}</strong> · {c.interventions_count} intervenções
                      </span>
                    </div>

                    <div className="text-[11px]">
                      <span className="text-[#5C5E62]">Diagnóstico:</span>{" "}
                      <strong>{cid?.code}</strong> — {cid?.description}
                    </div>

                    {c.medications && c.medications.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {c.medications.map((m) => (
                          <span
                            key={m.id}
                            className="bg-white border px-1.5 py-0.5 rounded text-[10px]"
                          >
                            {m.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {c.prfs && c.prfs.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-[#171A20] block">
                          PRFs identificados:
                        </span>
                        {c.prfs.map((prf, pIdx) => (
                          <div
                            key={pIdx}
                            className="text-[11px] p-1.5 bg-white border border-[#E5E7EB] rounded"
                          >
                            <span className="font-semibold text-[#171A20]">
                              {prf.category} ({prf.status}):
                            </span>{" "}
                            {prf.description || "Sem descrição"}
                          </div>
                        ))}
                      </div>
                    )}

                    {c.clinical_notes && (
                      <div className="p-2 bg-white rounded border border-[#E5E7EB] text-[11px] whitespace-pre-wrap">
                        {c.clinical_notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setSelectedPatientForHistory(null)}
            >
              Fechar
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Modal Cadastro de Novo Paciente */}
      <Dialog
        open={isNewPatientOpen}
        onOpenChange={setIsNewPatientOpen}
        title="Novo Cadastro de Paciente"
        description={`Unidade: ${activeUnit?.name}`}
      >
        <form onSubmit={handleSavePatient} className="space-y-4">
          <Input
            label="Nome Completo *"
            placeholder="Nome do usuário"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="CPF *"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => setCpf(formatCPF(e.target.value))}
              required
            />
            <Input
              label="Cartão SUS (CNS)"
              placeholder="700000000000000"
              value={cns}
              onChange={(e) => setCns(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              type="date"
              label="Data de Nascimento"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
            <Input
              label="Telefone / Contato"
              placeholder="(75) 99999-9999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#393C41] block mb-1">
              Status Inicial
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PatientStatus)}
              className="w-full h-9 px-3 text-xs bg-white border border-[#D1D5DB] rounded focus:outline-none"
            >
              <option value="em_acompanhamento">Em Acompanhamento Ativo</option>
              <option value="alta">Com Alta Farmacêutica</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNewPatientOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Salvar Paciente
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
