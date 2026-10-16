"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  PlusCircle,
  Trash2,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  ArrowLeft,
  Stethoscope,
  Info,
  Calendar,
  Lock,
  Search,
  History,
  CheckCheck,
  ChevronDown,
  X,
  Building2,
  UserCheck,
  Clock,
  Pill,
  BookOpen,
  Eye,
} from "lucide-react";
import { useApp } from "@/lib/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { PRFCategory, PRFStatus, ConsultationPRF, Patient, CID, Medication, Consultation } from "@/lib/types";
import { formatCPF, formatDate } from "@/lib/utils";

export default function NovoAtendimentoPage() {
  const router = useRouter();
  const {
    patients,
    cids,
    medications,
    consultations,
    units,
    profiles,
    currentUser,
    activeUnit,
    canEdit,
    addConsultation,
    addPatient,
  } = useApp();

  // Estados do Formulário Principal
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearchTerm, setPatientSearchTerm] = useState("");
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);

  const [consultationDate, setConsultationDate] = useState("");
  useEffect(() => {
    setConsultationDate(new Date().toISOString().split("T")[0]);
  }, []);

  // Diagnóstico CID-10 Autocomplete
  const [primaryCidId, setPrimaryCidId] = useState("");
  const [cidSearchTerm, setCidSearchTerm] = useState("");
  const [isCidDropdownOpen, setIsCidDropdownOpen] = useState(false);

  // Medicamentos Autocomplete Multi-select
  const [selectedMedicationIds, setSelectedMedicationIds] = useState<string[]>([]);
  const [medSearchTerm, setMedSearchTerm] = useState("");
  const [isMedDropdownOpen, setIsMedDropdownOpen] = useState(false);

  // Classificação Clínica
  const [isGuidanceOnly, setIsGuidanceOnly] = useState(false);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [interventionsCount, setInterventionsCount] = useState(0);
  const [pharmaceuticalDischarge, setPharmaceuticalDischarge] = useState(false);
  const [clinicalNotes, setClinicalNotes] = useState("");

  // PRFs Ativos do Atendimento
  const [prfs, setPrfs] = useState<ConsultationPRF[]>([]);

  // Histórico de PRFs Resolvidos do Paciente (Armazenado para consulta)
  const [resolvedPrfsHistory, setResolvedPrfsHistory] = useState<
    Array<{
      prf: ConsultationPRF;
      consultationDate: string;
      unitName: string;
      pharmacistName: string;
    }>
  >([]);
  const [isResolvedPrfsModalOpen, setIsResolvedPrfsModalOpen] = useState(false);

  // Exibição do Prontuário Longitudinal
  const [showTimeline, setShowTimeline] = useState(false);

  // Feedback de erro / sucesso
  const [errorMsg, setErrorMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Modal de Cadastro Rápido de Paciente
  const [quickPatientOpen, setQuickPatientOpen] = useState(false);
  const [quickFullName, setQuickFullName] = useState("");
  const [quickCpf, setQuickCpf] = useState("");
  const [quickCns, setQuickCns] = useState("");
  const [quickBirthDate, setQuickBirthDate] = useState("");
  const [quickPhone, setQuickPhone] = useState("");

  // Refs para fechamento de dropdowns ao clicar fora
  const patientDropdownRef = useRef<HTMLDivElement>(null);
  const cidDropdownRef = useRef<HTMLDivElement>(null);
  const medDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(event.target as Node)) {
        setIsPatientDropdownOpen(false);
      }
      if (cidDropdownRef.current && !cidDropdownRef.current.contains(event.target as Node)) {
        setIsCidDropdownOpen(false);
      }
      if (medDropdownRef.current && !medDropdownRef.current.contains(event.target as Node)) {
        setIsMedDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 1. Pesquisa de Pacientes (USO COMUM ENTRE TODAS AS UNIDADES)
  const filteredPatients = useMemo(() => {
    if (!patientSearchTerm.trim()) {
      return patients.slice(0, 8);
    }
    const term = patientSearchTerm.toLowerCase().replace(/[.\-]/g, "");
    return patients.filter((p) => {
      const cleanCpf = p.cpf.replace(/[.\-]/g, "");
      const cleanName = p.full_name.toLowerCase();
      const cleanCns = (p.cns || "").replace(/\s/g, "");
      return cleanName.includes(term) || cleanCpf.includes(term) || cleanCns.includes(term);
    });
  }, [patients, patientSearchTerm]);

  // Consultas anteriores do paciente selecionado (Histórico Multi-Unidade)
  const patientPreviousConsultations = useMemo(() => {
    if (!selectedPatient) return [];
    return consultations
      .filter((c) => c.patient_id === selectedPatient.id)
      .sort((a, b) => new Date(b.consultation_date).getTime() - new Date(a.consultation_date).getTime());
  }, [selectedPatient, consultations]);

  // Quando um paciente é selecionado: preenchimento automático inteligente
  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsPatientDropdownOpen(false);
    setPatientSearchTerm("");

    // Buscar histórico de consultas prévias deste paciente
    const prevConsults = consultations
      .filter((c) => c.patient_id === patient.id)
      .sort((a, b) => new Date(b.consultation_date).getTime() - new Date(a.consultation_date).getTime());

    if (prevConsults.length > 0) {
      const lastConsult = prevConsults[0];

      // 1. Auto-completar CID da última consulta
      if (lastConsult.primary_cid_id) {
        setPrimaryCidId(lastConsult.primary_cid_id);
      }

      // 2. Auto-completar Medicamentos avaliados da última consulta
      if (lastConsult.medications && lastConsult.medications.length > 0) {
        setSelectedMedicationIds(lastConsult.medications.map((m) => m.id));
      }

      // 3. Classificação automática como RETORNO
      setIsNewPatient(false);

      // 4. Tratamento de PRFs:
      // Agrupar todos os PRFs de consultas anteriores
      const allHistoricPrfs: Array<{
        prf: ConsultationPRF;
        consultationDate: string;
        unitName: string;
        pharmacistName: string;
      }> = [];

      prevConsults.forEach((c) => {
        const uName = units.find((u) => u.id === c.unit_id)?.name || "Unidade de Saúde";
        const pName = profiles.find((p) => p.id === c.pharmacist_id)?.full_name || "Farmacêutico";
        (c.prfs || []).forEach((p) => {
          allHistoricPrfs.push({
            prf: p,
            consultationDate: c.consultation_date,
            unitName: uName,
            pharmacistName: pName,
          });
        });
      });

      // Separar resolvidos vs pendentes/em resolução
      const resolvedList = allHistoricPrfs.filter((item) => item.prf.status === "Resolvido");
      setResolvedPrfsHistory(resolvedList);

      // Resgatar PRFs que ainda não foram resolvidos (para acompanhamento contínuo nesta nova consulta)
      const lastActivePrfs = (lastConsult.prfs || []).filter((p) => p.status !== "Resolvido");
      if (lastActivePrfs.length > 0) {
        setPrfs(
          lastActivePrfs.map((p) => ({
            ...p,
            id: `prf-inherited-${Date.now()}-${p.id}`,
          }))
        );
      } else {
        setPrfs([]);
      }
    } else {
      // Paciente sem consultas prévias: 1ª consulta
      setIsNewPatient(true);
      setPrimaryCidId("");
      setSelectedMedicationIds([]);
      setPrfs([]);
      setResolvedPrfsHistory([]);
    }
  };

  const handleClearPatient = () => {
    setSelectedPatient(null);
    setPrimaryCidId("");
    setSelectedMedicationIds([]);
    setPrfs([]);
    setResolvedPrfsHistory([]);
    setIsNewPatient(false);
  };

  // 2. Autocomplete de CID-10
  const filteredCids = useMemo(() => {
    if (!cidSearchTerm.trim()) {
      return cids.slice(0, 10);
    }
    const term = cidSearchTerm.toLowerCase();
    return cids.filter(
      (c) => c.code.toLowerCase().includes(term) || c.description.toLowerCase().includes(term)
    );
  }, [cids, cidSearchTerm]);

  const selectedCidObj = useMemo(() => {
    return cids.find((c) => c.id === primaryCidId);
  }, [cids, primaryCidId]);

  // 3. Autocomplete de Medicamentos (CEAF com Validação PCDT via rl_procedimento_cid)
  const filteredMedications = useMemo(() => {
    const unselected = medications.filter((m) => !selectedMedicationIds.includes(m.id));
    const term = medSearchTerm.toLowerCase().trim();

    let list = unselected;
    if (term) {
      list = unselected.filter(
        (m) =>
          m.name.toLowerCase().includes(term) ||
          (m.sigtap_code && m.sigtap_code.includes(term)) ||
          (m.pharmaceutical_form && m.pharmaceutical_form.toLowerCase().includes(term))
      );
    }

    // Se temos um CID selecionado, prioriza medicamentos autorizados pelo PCDT no topo
    if (selectedCidObj) {
      return [...list].sort((a, b) => {
        const aMatches = a.compatible_cid_codes?.includes(selectedCidObj.code) ? 1 : 0;
        const bMatches = b.compatible_cid_codes?.includes(selectedCidObj.code) ? 1 : 0;
        return bMatches - aMatches;
      }).slice(0, 12);
    }

    return list.slice(0, 10);
  }, [medications, selectedMedicationIds, medSearchTerm, selectedCidObj]);

  const selectedMedicationsList = useMemo(() => {
    return medications.filter((m) => selectedMedicationIds.includes(m.id));
  }, [medications, selectedMedicationIds]);

  const handleAddMedication = (id: string) => {
    if (!selectedMedicationIds.includes(id)) {
      setSelectedMedicationIds([...selectedMedicationIds, id]);
    }
    setMedSearchTerm("");
    setIsMedDropdownOpen(false);
  };

  const handleRemoveMedication = (id: string) => {
    setSelectedMedicationIds(selectedMedicationIds.filter((mId) => mId !== id));
  };

  // Manipulação de PRFs dinâmicos
  const handleAddPrf = () => {
    const newPrf: ConsultationPRF = {
      id: `prf-temp-${Date.now()}`,
      category: "Adesão",
      status: "Em resolução",
      medication_id: selectedMedicationIds[0] || null,
      description: "",
    };
    setPrfs([...prfs, newPrf]);
  };

  const handleRemovePrf = (index: number) => {
    setPrfs(prfs.filter((_, i) => i !== index));
  };

  const handleUpdatePrf = (index: number, field: keyof ConsultationPRF, value: string) => {
    const updated = [...prfs];
    updated[index] = { ...updated[index], [field]: value };
    setPrfs(updated);
  };

  // Salvar cadastro rápido de paciente
  const handleSaveQuickPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickFullName.trim() || !quickCpf.trim()) {
      alert("Por favor, preencha pelo menos Nome Completo e CPF.");
      return;
    }
    if (!currentUser.unit_id) {
      alert("Usuário sem unidade vinculada.");
      return;
    }

    const created = addPatient({
      unit_id: currentUser.unit_id,
      full_name: quickFullName.trim(),
      cpf: quickCpf.trim(),
      cns: quickCns.trim() || undefined,
      birth_date: quickBirthDate || undefined,
      phone: quickPhone || undefined,
      status: "em_acompanhamento",
      created_by: currentUser.id,
    });

    handleSelectPatient(created);
    setQuickPatientOpen(false);
    setQuickFullName("");
    setQuickCpf("");
    setQuickCns("");
    setQuickBirthDate("");
    setQuickPhone("");
  };

  // Salvar Atendimento
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!canEdit) {
      setErrorMsg("Você está em modo de leitura e não pode criar atendimentos.");
      return;
    }

    if (!selectedPatient) {
      setErrorMsg("Selecione um paciente para o atendimento.");
      return;
    }
    if (!primaryCidId) {
      setErrorMsg("Selecione o Diagnóstico Principal (CID-10).");
      return;
    }
    if (!currentUser.unit_id) {
      setErrorMsg("Usuário não possui unidade vinculada.");
      return;
    }

    setIsSaving(true);

    const evaluatedMeds = medications.filter((m) =>
      selectedMedicationIds.includes(m.id)
    );

    addConsultation({
      unit_id: currentUser.unit_id,
      patient_id: selectedPatient.id,
      pharmacist_id: currentUser.id,
      consultation_date: consultationDate,
      primary_cid_id: primaryCidId,
      is_pharmaceutical_guidance_only: isGuidanceOnly,
      is_new_patient: isNewPatient,
      interventions_count: Number(interventionsCount),
      pharmaceutical_discharge: pharmaceuticalDischarge,
      clinical_notes: clinicalNotes.trim() || undefined,
      medications: evaluatedMeds,
      prfs: prfs,
    });

    setIsSaving(false);
    router.push("/atendimentos");
  };

  // Auxiliares de exibição de Unidade e Farmacêutico
  const getUnitName = (uId: string) => {
    return units.find((u) => u.id === uId)?.name || "Unidade Regional";
  };
  const getPharmacistName = (pId: string) => {
    return profiles.find((p) => p.id === pId)?.full_name || "Farmacêutico";
  };

  if (!canEdit) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-[#171A20]">Modo Somente Leitura</h2>
        <p className="text-sm text-[#5C5E62] mt-2">
          Você não possui permissão de escrita para registrar novos atendimentos enquanto visualiza outra unidade.
        </p>
        <div className="mt-6">
          <Button variant="primary" onClick={() => router.push("/atendimentos")}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Voltar para Atendimentos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/atendimentos")}
            title="Voltar"
          >
            <ArrowLeft className="w-4 h-4 text-[#171A20]" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-[#171A20] tracking-tight">
              Registro de Atendimento Farmacêutico
            </h1>
            <p className="text-xs text-[#5C5E62]">
              Unidade Ativa: <strong>{activeUnit?.name}</strong> · Farmacêutico Responsável:{" "}
              <strong>{currentUser.full_name}</strong>
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-[#FFF0F0] border border-[#FCD5D6] rounded text-xs text-[#E82127] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* BLOCO 1: IDENTIFICAÇÃO DO PACIENTE (AUTOCOMPLETE EM TODA A REDE) */}
        <Card className="border-[#E5E7EB] shadow-xs overflow-visible relative z-30">
          <CardHeader className="py-3 bg-[#FAFAFB] border-b border-[#E5E7EB]">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-[#171A20]">
                  1. Identificação do Paciente & Data da Consulta
                </CardTitle>
                <CardDescription className="text-xs">
                  Os pacientes são de uso compartilhado em todas as unidades de saúde da rede.
                </CardDescription>
              </div>
              <button
                type="button"
                onClick={() => setQuickPatientOpen(true)}
                className="text-xs text-[#E82127] hover:underline font-semibold inline-flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                + Cadastrar Novo Paciente
              </button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-4 overflow-visible">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Autocomplete de Paciente */}
              <div className="sm:col-span-2 space-y-1 relative z-50" ref={patientDropdownRef}>
                <label className="text-xs font-semibold text-[#393C41] block">
                  Buscar Paciente por Nome ou CPF *
                </label>

                {!selectedPatient ? (
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Digite o nome ou CPF (ex: Antônio ou 123.456)..."
                      value={patientSearchTerm}
                      onChange={(e) => {
                        setPatientSearchTerm(e.target.value);
                        setIsPatientDropdownOpen(true);
                      }}
                      onFocus={() => setIsPatientDropdownOpen(true)}
                      className="pl-9 text-xs"
                    />
                    <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-2.5 pointer-events-none" />

                    {/* Dropdown com os pacientes encontrados */}
                    {isPatientDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#D1D5DB] rounded-md shadow-2xl z-50 max-h-64 overflow-y-auto divide-y divide-[#F4F4F6] ring-1 ring-black/5">
                        {filteredPatients.length === 0 ? (
                          <div className="p-3 text-center text-xs text-[#5C5E62]">
                            Nenhum paciente localizado. Deseja cadastrar?
                            <button
                              type="button"
                              onClick={() => {
                                setIsPatientDropdownOpen(false);
                                setQuickPatientOpen(true);
                              }}
                              className="block mx-auto mt-1.5 text-xs text-[#E82127] font-semibold hover:underline"
                            >
                              + Cadastrar Rápido Agora
                            </button>
                          </div>
                        ) : (
                          filteredPatients.map((p) => {
                            const pConsults = consultations.filter((c) => c.patient_id === p.id);
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => handleSelectPatient(p)}
                                className="w-full text-left p-2.5 hover:bg-[#F9FAFB] transition-colors flex items-center justify-between text-xs"
                              >
                                <div>
                                  <span className="font-bold text-[#171A20] block">
                                    {p.full_name}
                                  </span>
                                  <span className="text-[11px] text-[#5C5E62]">
                                    CPF: {formatCPF(p.cpf)} · Cadastro: {getUnitName(p.unit_id)}
                                  </span>
                                </div>
                                <div className="text-right">
                                  {pConsults.length > 0 ? (
                                    <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                                      {pConsults.length} consultas
                                    </Badge>
                                  ) : (
                                    <Badge variant="neutral" className="text-[10px]">
                                      Sem consultas
                                    </Badge>
                                  )}
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Card do Paciente Selecionado */
                  <div className="p-3 bg-[#F4F4F6] border border-[#D1D5DB] rounded flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#171A20] text-white flex items-center justify-center font-bold text-xs">
                        {selectedPatient.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#171A20]">
                            {selectedPatient.full_name}
                          </span>
                          <Badge variant="default" className="text-[10px] py-0">
                            {selectedPatient.status === "em_acompanhamento" ? "Em Acompanhamento" : "Alta"}
                          </Badge>
                        </div>
                        <span className="text-[11px] text-[#5C5E62] block">
                          CPF: {formatCPF(selectedPatient.cpf)} · CNS: {selectedPatient.cns || "Não informado"} · Origem: {getUnitName(selectedPatient.unit_id)}
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleClearPatient}
                      className="text-xs h-7 px-2 border-[#D1D5DB] text-[#5C5E62] hover:text-[#E82127]"
                    >
                      Trocar Paciente
                    </Button>
                  </div>
                )}
              </div>

              {/* Data da Consulta */}
              <div>
                <Input
                  type="date"
                  label="Data do Atendimento *"
                  value={consultationDate}
                  onChange={(e) => setConsultationDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* ALERTA DE PACIENTE JÁ ATENDIDO & RESUMO DE HISTÓRICO */}
            {selectedPatient && (
              <div className="space-y-3 pt-2">
                {patientPreviousConsultations.length > 0 ? (
                  <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded text-xs text-blue-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-start gap-2.5">
                      <History className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-900">
                            Paciente com Histórico Clínico ({patientPreviousConsultations.length} atendimentos registrados na rede)
                          </span>
                          <span className="bg-blue-200/70 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            Retorno Automático
                          </span>
                        </div>
                        <span className="block text-blue-800 text-[11px] mt-0.5">
                          Último atendimento em <strong>{formatDate(patientPreviousConsultations[0].consultation_date)}</strong> na unidade <strong>{getUnitName(patientPreviousConsultations[0].unit_id)}</strong> por <strong>{getPharmacistName(patientPreviousConsultations[0].pharmacist_id)}</strong>.
                          CID-10 e medicamentos foram resgatados automaticamente.
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowTimeline(!showTimeline)}
                      className="text-xs font-bold text-blue-900 underline hover:text-blue-950 flex items-center gap-1 shrink-0 self-start sm:self-auto cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {showTimeline ? "Ocultar Prontuário" : "Ver Prontuário Multi-Unidade"}
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-950 flex items-center gap-2 shadow-xs">
                    <UserCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>
                      <strong>Primeira Consulta Farmacêutica:</strong> Este paciente ainda não possui atendimentos clínicos registrados no sistema. O registro atual será computado como <em>Novo Ingresso (IND-03)</em>.
                    </span>
                  </div>
                )}

                {/* PRONTUÁRIO LONGITUDINAL MULTI-UNIDADE (CONSULTAS POR UNIDADE) */}
                {showTimeline && patientPreviousConsultations.length > 0 && (
                  <div className="p-4 bg-white border border-[#D1D5DB] rounded-lg shadow-sm space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#171A20]" />
                        <span className="text-xs font-bold uppercase tracking-wide text-[#171A20]">
                          Linha do Tempo / Prontuário Longitudinal de {selectedPatient.full_name}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        Atendimentos Multi-Unidade
                      </Badge>
                    </div>

                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {patientPreviousConsultations.map((c, idx) => {
                        const cUnitName = getUnitName(c.unit_id);
                        const cPharmName = getPharmacistName(c.pharmacist_id);
                        const cCid = cids.find((cid) => cid.id === c.primary_cid_id);

                        return (
                          <div
                            key={c.id}
                            className="p-3 rounded border border-[#E5E7EB] bg-[#F9FAFB] text-xs space-y-1.5"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[#171A20]">
                                  {formatDate(c.consultation_date)}
                                </span>
                                <Badge variant="outline" className="bg-white text-[10px] border-[#D1D5DB]">
                                  <Building2 className="w-3 h-3 mr-1 text-[#5C5E62]" />
                                  {cUnitName}
                                </Badge>
                                <span className="text-[#5C5E62]">
                                  Farmacêutico: {cPharmName}
                                </span>
                              </div>
                              <span className="text-[10px] text-[#5C5E62]">
                                {c.is_new_patient ? "1ª Consulta" : c.is_pharmaceutical_guidance_only ? "Orientação" : "Retorno Clínico"}
                              </span>
                            </div>

                            <div className="text-[11px]">
                              <span className="font-semibold text-[#171A20]">CID Principal:</span>{" "}
                              {cCid ? `${cCid.code} - ${cCid.description}` : "Não informado"}
                            </div>

                            <div className="text-[11px]">
                              <span className="font-semibold text-[#171A20]">Medicamentos:</span>{" "}
                              {c.medications && c.medications.length > 0
                                ? c.medications.map((m) => m.name).join(", ")
                                : "Nenhum medicamento registrado"}
                            </div>

                            {c.prfs && c.prfs.length > 0 && (
                              <div className="pt-1 flex flex-wrap gap-1">
                                {c.prfs.map((p, pIdx) => (
                                  <span
                                    key={pIdx}
                                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${
                                      p.status === "Resolvido"
                                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                        : "bg-amber-50 text-amber-800 border-amber-200"
                                    }`}
                                  >
                                    PRF: {p.category} ({p.status})
                                  </span>
                                ))}
                              </div>
                            )}

                            {c.clinical_notes && (
                              <p className="text-[11px] text-[#5C5E62] italic pt-1 border-t border-[#E5E7EB]">
                                &ldquo;{c.clinical_notes}&rdquo;
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* BLOCO 2: DIAGNÓSTICO E MEDICAMENTOS (COM AUTOCOMPLETE POR ESCRITA) */}
        <Card className="border-[#E5E7EB] shadow-xs overflow-visible relative z-20">
          <CardHeader className="py-3 bg-[#FAFAFB] border-b border-[#E5E7EB]">
            <CardTitle className="text-sm font-bold text-[#171A20]">
              2. Diagnóstico Principal (CID-10) & Medicamentos em Uso (CEAF)
            </CardTitle>
            <CardDescription className="text-xs">
              Busque digitando o código ou nome da patologia e selecione os biológicos / especializados do paciente.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-4 overflow-visible">
            {/* Campo 1: Autocomplete CID-10 */}
            <div className="space-y-1 relative z-40" ref={cidDropdownRef}>
              <label className="text-xs font-semibold text-[#393C41] block">
                Diagnóstico Principal (CID-10) *
              </label>

              {!selectedCidObj ? (
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Digite o código CID (ex: M05, K50, G35) ou o nome da doença..."
                    value={cidSearchTerm}
                    onChange={(e) => {
                      setCidSearchTerm(e.target.value);
                      setIsCidDropdownOpen(true);
                    }}
                    onFocus={() => setIsCidDropdownOpen(true)}
                    className="pl-9 text-xs"
                    required={!primaryCidId}
                  />
                  <BookOpen className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-2.5 pointer-events-none" />

                  {isCidDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#D1D5DB] rounded-md shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-[#F4F4F6] ring-1 ring-black/5">
                      {filteredCids.length === 0 ? (
                        <div className="p-3 text-center text-xs text-[#5C5E62]">
                          Nenhum CID localizado com esse termo.
                        </div>
                      ) : (
                        filteredCids.map((cid) => (
                          <button
                            key={cid.id}
                            type="button"
                            onClick={() => {
                              setPrimaryCidId(cid.id);
                              setIsCidDropdownOpen(false);
                              setCidSearchTerm("");
                            }}
                            className="w-full text-left p-2.5 hover:bg-[#F9FAFB] transition-colors flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-mono font-bold bg-[#F4F4F6] px-1.5 py-0.5 rounded text-[11px] text-[#171A20] mr-2">
                                {cid.code}
                              </span>
                              <span className="text-[#171A20]">{cid.description}</span>
                            </div>
                            <Badge variant="outline" className="text-[10px]">
                              PCDT
                            </Badge>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Card do CID-10 Selecionado */
                <div className="p-2.5 bg-[#F4F4F6] border border-[#D1D5DB] rounded flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold bg-[#171A20] text-white px-2 py-0.5 rounded text-[11px]">
                      {selectedCidObj.code}
                    </span>
                    <span className="font-semibold text-[#171A20]">
                      {selectedCidObj.description}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPrimaryCidId("");
                      setCidSearchTerm("");
                      setIsCidDropdownOpen(true);
                    }}
                    className="text-[11px] h-6 px-2 border-[#D1D5DB] text-[#5C5E62] hover:text-[#171A20]"
                  >
                    Alterar CID
                  </Button>
                </div>
              )}
            </div>

            {/* Campo 2: Autocomplete Medicamentos do CEAF com Chips */}
            <div className="space-y-2 relative z-30" ref={medDropdownRef}>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#393C41]">
                  Medicamentos Avaliados (Catálogo Especializado CEAF)
                </label>
                <span className="text-[11px] text-[#5C5E62]">
                  {selectedMedicationIds.length} selecionado(s)
                </span>
              </div>

              {/* Caixa de Busca com Autocomplete */}
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Digite para buscar e adicionar medicamentos (ex: Adalimumabe, Infliximabe, 150mg)..."
                  value={medSearchTerm}
                  onChange={(e) => {
                    setMedSearchTerm(e.target.value);
                    setIsMedDropdownOpen(true);
                  }}
                  onFocus={() => setIsMedDropdownOpen(true)}
                  className="pl-9 text-xs"
                />
                <Pill className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-2.5 pointer-events-none" />

                {isMedDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#D1D5DB] rounded-md shadow-2xl z-50 max-h-64 overflow-y-auto divide-y divide-[#F4F4F6] ring-1 ring-black/5">
                    {filteredMedications.length === 0 ? (
                      <div className="p-3 text-center text-xs text-[#5C5E62]">
                        Nenhum outro medicamento CEAF correspondente.
                      </div>
                    ) : (
                      filteredMedications.map((med) => {
                        const isPCDTAuthorized =
                          selectedCidObj &&
                          med.compatible_cid_codes?.includes(selectedCidObj.code);

                        return (
                          <button
                            key={med.id}
                            type="button"
                            onClick={() => handleAddMedication(med.id)}
                            className={`w-full text-left p-2.5 hover:bg-[#F9FAFB] transition-colors flex items-center justify-between text-xs ${
                              isPCDTAuthorized ? "bg-emerald-50/50" : ""
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {med.sigtap_code && (
                                  <span className="font-mono text-[10px] bg-[#F4F4F6] text-[#171A20] px-1 py-0.2 rounded border border-[#E5E7EB]">
                                    {med.sigtap_code}
                                  </span>
                                )}
                                <span className="font-bold text-[#171A20]">
                                  {med.name}
                                </span>
                                {isPCDTAuthorized && (
                                  <span className="text-[9px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                    ✓ PCDT Autorizado ({selectedCidObj.code})
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-[#5C5E62] block">
                                {med.pharmaceutical_form || "Forma farmacêutica padronizada CEAF"}
                              </span>
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-[10px] shrink-0 ml-2 ${
                                isPCDTAuthorized
                                  ? "text-emerald-800 bg-emerald-100 border-emerald-300"
                                  : "text-[#171A20] bg-white border-[#D1D5DB]"
                              }`}
                            >
                              + Adicionar
                            </Badge>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Chips dos Medicamentos Selecionados */}
              {selectedMedicationsList.length === 0 ? (
                <p className="text-[11px] text-[#7A7D85] italic">
                  Nenhum medicamento vinculado a esta consulta ainda. Busque e adicione acima.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedMedicationsList.map((m) => {
                    const isPcdt =
                      selectedCidObj && m.compatible_cid_codes?.includes(selectedCidObj.code);

                    return (
                      <div
                        key={m.id}
                        className={`flex items-center gap-1.5 py-1 px-2.5 rounded bg-white text-xs shadow-xs border ${
                          isPcdt ? "border-emerald-300 bg-emerald-50/30" : "border-[#D1D5DB]"
                        }`}
                      >
                        <Pill
                          className={`w-3 h-3 ${isPcdt ? "text-emerald-600" : "text-[#E82127]"}`}
                        />
                        <span className="font-semibold text-[#171A20]">{m.name}</span>
                        {isPcdt && (
                          <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1 rounded">
                            PCDT ✓
                          </span>
                        )}
                        <span className="text-[10px] text-[#5C5E62] hidden sm:inline">
                          ({m.pharmaceutical_form || "CEAF"})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMedication(m.id)}
                          className="ml-1 text-[#9CA3AF] hover:text-[#E82127] p-0.5"
                          title="Remover medicamento"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* BLOCO 3: CLASSIFICAÇÃO DA CONSULTA */}
        <Card className="border-[#E5E7EB] shadow-xs relative z-10">
          <CardHeader className="py-3 bg-[#FAFAFB] border-b border-[#E5E7EB]">
            <CardTitle className="text-sm font-bold text-[#171A20]">
              3. Classificação Clínica da Consulta
            </CardTitle>
            <CardDescription className="text-xs">
              Gatilhos automatizados para apuração oficial dos indicadores mensais.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Orientação Farmacêutica vs Acompanhamento */}
              <div className="p-3 border border-[#E5E7EB] rounded bg-[#FAFAFB]">
                <label className="text-xs font-bold text-[#171A20] block mb-1">
                  Apenas Orientação Farmacêutica?
                </label>
                <p className="text-[11px] text-[#5C5E62] mb-2">
                  (Sim = orientação pontual; Não = consulta clínica de acompanhamento farmacoterapêutico completo).
                </p>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="isGuidanceOnly"
                      checked={!isGuidanceOnly}
                      onChange={() => setIsGuidanceOnly(false)}
                      className="text-[#171A20] focus:ring-0"
                    />
                    <span>Não (Acompanhamento Clínico)</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="isGuidanceOnly"
                      checked={isGuidanceOnly}
                      onChange={() => setIsGuidanceOnly(true)}
                      className="text-[#171A20] focus:ring-0"
                    />
                    <span>Sim (Apenas Orientação)</span>
                  </label>
                </div>
              </div>

              {/* Paciente Novo vs Retorno */}
              <div className="p-3 border border-[#E5E7EB] rounded bg-[#FAFAFB]">
                <label className="text-xs font-bold text-[#171A20] block mb-1">
                  Paciente Novo (1ª Consulta)?
                </label>
                <p className="text-[11px] text-[#5C5E62] mb-2">
                  {selectedPatient && patientPreviousConsultations.length > 0
                    ? "(Detectado histórico: Paciente de Retorno / Acompanhamento contínuo)"
                    : "(Primeiro ingresso do usuário no serviço de acompanhamento farmacêutico)"}
                </p>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="isNewPatient"
                      checked={!isNewPatient}
                      onChange={() => setIsNewPatient(false)}
                      className="text-[#171A20] focus:ring-0"
                    />
                    <span>Não (Retorno)</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="isNewPatient"
                      checked={isNewPatient}
                      onChange={() => setIsNewPatient(true)}
                      className="text-[#171A20] focus:ring-0"
                    />
                    <span>Sim (1ª Consulta)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Intervenções Realizadas */}
              <div>
                <label className="text-xs font-bold text-[#171A20] block mb-1">
                  Nº de Intervenções Farmacêuticas Realizadas *
                </label>
                <p className="text-[11px] text-[#5C5E62] mb-1.5">
                  Ações diretas (educação em saúde, conciliação, contato médico, ajuste de tomada).
                </p>
                <Input
                  type="number"
                  min={0}
                  max={20}
                  value={interventionsCount}
                  onChange={(e) => setInterventionsCount(Number(e.target.value))}
                  required
                />
              </div>

              {/* Alta Farmacêutica */}
              <div className="p-3 border border-[#E5E7EB] rounded bg-[#FAFAFB]">
                <label className="text-xs font-bold text-[#171A20] block mb-1">
                  Alta Farmacêutica?
                </label>
                <p className="text-[11px] text-[#5C5E62] mb-2">
                  (Paciente atingiu estabilidade clínica, autonomia e metas terapêuticas).
                </p>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="pharmaceuticalDischarge"
                      checked={!pharmaceuticalDischarge}
                      onChange={() => setPharmaceuticalDischarge(false)}
                      className="text-[#171A20] focus:ring-0"
                    />
                    <span>Não</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="pharmaceuticalDischarge"
                      checked={pharmaceuticalDischarge}
                      onChange={() => setPharmaceuticalDischarge(true)}
                      className="text-[#171A20] focus:ring-0"
                    />
                    <span>Sim (Conceder Alta)</span>
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BLOCO 4: PRFS (COM BOTÃO DE PRFS RESOLVIDOS AO LADO) */}
        <Card className="border-[#E5E7EB] shadow-xs relative z-0">
          <CardHeader className="py-3 bg-[#FAFAFB] border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold text-[#171A20]">
                4. Problemas Relacionados à Farmacoterapia (PRFs)
              </CardTitle>
              <CardDescription className="text-xs">
                Manejo e resolução de desvios de Adesão, Efetividade, Indicação e Segurança.
              </CardDescription>
            </div>

            {/* BOTÕES DE AÇÃO: ADICIONAR PRF + PRFS RESOLVIDOS AO LADO */}
            <div className="flex items-center gap-2">
              {/* Botão de Histórico de PRFs Resolvidos */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsResolvedPrfsModalOpen(true)}
                className="text-xs border-[#10B981] text-[#065F46] bg-emerald-50 hover:bg-emerald-100"
                title="Visualizar histórico de problemas farmacoterapêuticos que já foram solucionados"
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1 text-[#10B981]" />
                PRFs Resolvidos ({resolvedPrfsHistory.length})
              </Button>

              {/* Botão Adicionar PRF */}
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleAddPrf}
                className="text-xs bg-[#171A20] hover:bg-[#393C41] text-white"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1" />
                Adicionar PRF
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            {prfs.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-[#D1D5DB] rounded bg-[#F9FAFB]">
                <p className="text-xs text-[#5C5E62]">
                  Nenhum PRF pendente registrado para este atendimento.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddPrf}
                  className="mt-2 text-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1" />
                  + Registrar Novo PRF
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {prfs.map((prf, index) => (
                  <div
                    key={index}
                    className="p-3 border border-[#E5E7EB] rounded bg-[#FAFAFB] space-y-2 relative shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#171A20]">
                          PRF #{index + 1}
                        </span>
                        {prf.id.startsWith("prf-inherited-") && (
                          <Badge variant="warning" className="text-[10px] py-0">
                            Resgatado de consulta anterior
                          </Badge>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePrf(index)}
                        className="text-[#E82127] hover:text-[#C91A20] p-1 rounded"
                        title="Remover PRF"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {/* Categoria */}
                      <div>
                        <label className="text-[11px] font-semibold text-[#5C5E62] block mb-1">
                          Categoria *
                        </label>
                        <select
                          value={prf.category}
                          onChange={(e) =>
                            handleUpdatePrf(index, "category", e.target.value as PRFCategory)
                          }
                          className="w-full h-8 px-2 text-xs bg-white border border-[#D1D5DB] rounded focus:outline-none"
                        >
                          <option value="Adesão">Adesão</option>
                          <option value="Efetividade">Efetividade</option>
                          <option value="Indicação">Indicação</option>
                          <option value="Segurança">Segurança</option>
                        </select>
                      </div>

                      {/* Status */}
                      <div>
                        <label className="text-[11px] font-semibold text-[#5C5E62] block mb-1">
                          Status *
                        </label>
                        <select
                          value={prf.status}
                          onChange={(e) =>
                            handleUpdatePrf(index, "status", e.target.value as PRFStatus)
                          }
                          className="w-full h-8 px-2 text-xs bg-white border border-[#D1D5DB] rounded focus:outline-none font-semibold text-[#171A20]"
                        >
                          <option value="Resolvido">Resolvido</option>
                          <option value="Em resolução">Em resolução</option>
                          <option value="Não resolvido">Não resolvido</option>
                          <option value="Aguardando retorno">Aguardando retorno</option>
                        </select>
                      </div>

                      {/* Medicamento Relacionado */}
                      <div>
                        <label className="text-[11px] font-semibold text-[#5C5E62] block mb-1">
                          Medicamento Envolvido
                        </label>
                        <select
                          value={prf.medication_id || ""}
                          onChange={(e) =>
                            handleUpdatePrf(index, "medication_id", e.target.value)
                          }
                          className="w-full h-8 px-2 text-xs bg-white border border-[#D1D5DB] rounded focus:outline-none"
                        >
                          <option value="">Não especificado / Geral</option>
                          {selectedMedicationsList.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <Input
                        placeholder="Descreva detalhadamente o desvio farmacoterapêutico e a conduta..."
                        value={prf.description || ""}
                        onChange={(e) => handleUpdatePrf(index, "description", e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* BLOCO 5: EVOLUÇÃO CLÍNICA / NOTAS SOAP */}
        <Card className="border-[#E5E7EB] shadow-xs">
          <CardHeader className="py-3 bg-[#FAFAFB] border-b border-[#E5E7EB]">
            <CardTitle className="text-sm font-bold text-[#171A20]">
              5. Evolução Clínica Farmacêutica (Método SOAP)
            </CardTitle>
            <CardDescription className="text-xs">
              Registro longitudinal: Subjetivo, Objetivo, Avaliação e Plano de Cuidado.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Textarea
              rows={4}
              placeholder="S: Paciente relata melhora das dores...
O: Exames de rotina estáveis...
A: Boa resposta clínica ao esquema terapêutico...
P: Mantida posologia, agendado retorno para 60 dias..."
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="text-xs leading-relaxed"
            />
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-3 pt-2 pb-12 border-t border-[#E5E7EB]">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => router.push("/atendimentos")}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSaving}
            className="bg-[#E82127] hover:bg-[#C91A20] active:bg-[#A8151A] text-white font-semibold text-sm shadow-md"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            {isSaving ? "Gravando Atendimento..." : "Salvar Atendimento Clínico"}
          </Button>
        </div>
      </form>

      {/* MODAL: HISTÓRICO DE PRFS RESOLVIDOS DO PACIENTE */}
      <Dialog
        open={isResolvedPrfsModalOpen}
        onOpenChange={setIsResolvedPrfsModalOpen}
        title={`Histórico de PRFs Resolvidos — ${selectedPatient?.full_name || "Paciente"}`}
        description="Lista de problemas farmacoterapêuticos que foram solucionados com sucesso em consultas anteriores."
      >
        <div className="space-y-3 text-xs max-h-80 overflow-y-auto">
          {resolvedPrfsHistory.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-[#D1D5DB] rounded bg-[#F9FAFB] text-[#5C5E62]">
              <CheckCheck className="w-6 h-6 text-[#10B981] mx-auto mb-2 opacity-60" />
              Nenhum PRF resolvido anteriormente registrado para este paciente.
            </div>
          ) : (
            resolvedPrfsHistory.map((item, idx) => {
              const med = medications.find((m) => m.id === item.prf.medication_id);
              return (
                <div
                  key={idx}
                  className="p-3 rounded border border-emerald-200 bg-emerald-50/60 text-emerald-950 space-y-1"
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Categoria: {item.prf.category}
                    </span>
                    <Badge variant="success" className="text-[10px] py-0">
                      Resolvido
                    </Badge>
                  </div>

                  <p className="text-xs font-normal text-[#171A20] pt-1">
                    {item.prf.description || "Resolução concluída com sucesso."}
                  </p>

                  <div className="text-[10px] text-[#5C5E62] pt-1 border-t border-emerald-200/60 flex flex-wrap items-center justify-between gap-1">
                    <span>
                      Medicamento: <strong>{med?.name || "Geral / Não especificado"}</strong>
                    </span>
                    <span>
                      {formatDate(item.consultationDate)} · {item.unitName} ({item.pharmacistName})
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div className="flex justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsResolvedPrfsModalOpen(false)}
            >
              Fechar
            </Button>
          </div>
        </div>
      </Dialog>

      {/* MODAL: CADASTRO RÁPIDO DE PACIENTE */}
      <Dialog
        open={quickPatientOpen}
        onOpenChange={setQuickPatientOpen}
        title="Cadastro Rápido de Paciente"
        description="Cadastre um novo paciente para iniciar imediatamente o atendimento."
      >
        <form onSubmit={handleSaveQuickPatient} className="space-y-4">
          <Input
            label="Nome Completo *"
            placeholder="Ex: Maria das Graças Silva"
            value={quickFullName}
            onChange={(e) => setQuickFullName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="CPF *"
              placeholder="000.000.000-00"
              value={quickCpf}
              onChange={(e) => setQuickCpf(e.target.value)}
              required
            />
            <Input
              label="Cartão Nacional de Saúde (CNS)"
              placeholder="700000000000000"
              value={quickCns}
              onChange={(e) => setQuickCns(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              type="date"
              label="Data de Nascimento"
              value={quickBirthDate}
              onChange={(e) => setQuickBirthDate(e.target.value)}
            />
            <Input
              label="Telefone / WhatsApp"
              placeholder="(00) 00000-0000"
              value={quickPhone}
              onChange={(e) => setQuickPhone(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setQuickPatientOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm" className="bg-[#E82127] text-white">
              Salvar e Selecionar
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
