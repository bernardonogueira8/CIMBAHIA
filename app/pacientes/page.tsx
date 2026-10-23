"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
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
  Building,
  Building2,
  Globe,
  MapPin,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/lib/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { formatCPF, formatPhone, formatDate, matchNormalized, normalizeText } from "@/lib/utils";
import { calculatePatientAgeAtEvaluation } from "@/lib/patient-age";
import { Patient, PatientStatus, CpfLookupResult } from "@/lib/types";

export default function PacientesPage() {
  const {
    patients,
    processos,
    municipios,
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

  const selectedPatientHistoryAge = useMemo(() => {
    if (!selectedPatientForHistory?.birth_date) return null;
    return calculatePatientAgeAtEvaluation(selectedPatientForHistory.birth_date, new Date());
  }, [selectedPatientForHistory?.birth_date]);

  // Modal de Novo Paciente
  const [isNewPatientOpen, setIsNewPatientOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [cpfNotProvided, setCpfNotProvided] = useState(false);
  const [gender, setGender] = useState<"M" | "F" | "nao_informado">("nao_informado");
  const [cns, setCns] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [bairro, setBairro] = useState("");
  const [cep, setCep] = useState("");
  const [statusExterno, setStatusExterno] = useState<string | null>(null);
  const [afsesabStatus, setAfsesabStatus] = useState<string | null>(null);
  const [isSearchingCpf, setIsSearchingCpf] = useState(false);
  const [cpfSearchFeedback, setCpfSearchFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [isSavingPatient, setIsSavingPatient] = useState(false);

  const [municipalityId, setMunicipalityId] = useState("");
  const [municipioSearch, setMunicipioSearch] = useState("");
  const [isMunicipioDropdownOpen, setIsMunicipioDropdownOpen] = useState(false);
  const [isOutsideBahia, setIsOutsideBahia] = useState(false);
  const [outsideCity, setOutsideCity] = useState("");
  const municipioRef = useRef<HTMLDivElement>(null);

  // Click outside para fechar dropdown de município
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (municipioRef.current && !municipioRef.current.contains(target)) {
        setIsMunicipioDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Municípios filtrados (autocomplete com base nos 417 municípios da Bahia - insensível a acentuação)
  const filteredMunicipios = useMemo(() => {
    if (!municipioSearch.trim()) return municipios.slice(0, 10);
    return municipios
      .filter(
        (m) =>
          matchNormalized(m.name, municipioSearch) ||
          matchNormalized(m.brs_name, municipioSearch) ||
          matchNormalized(m.macroregion, municipioSearch)
      )
      .slice(0, 15);
  }, [municipios, municipioSearch]);

  // Município e Base deduzidos para o modal de cadastro de paciente
  const deducedMun = useMemo(() => {
    if (!municipalityId) return null;
    return municipios.find((m) => m.id === municipalityId) || null;
  }, [municipios, municipalityId]);

  const deducedUnit = useMemo(() => {
    if (!deducedMun) return null;
    if (deducedMun.base_id) {
      const byBase = units.find((u) => u.id === deducedMun.base_id);
      if (byBase) return byBase;
    }
    if (deducedMun.brs_name) {
      const cleanBrs = deducedMun.brs_name
        .replace(/^(BRS|NRS|Base Regional de Saúde|Núcleo Regional de Saúde)\s+/i, "")
        .trim();
      return units.find((u) => matchNormalized(u.name, cleanBrs)) || null;
    }
    return null;
  }, [deducedMun, units]);

  const resetPatientForm = () => {
    setFullName("");
    setCpf("");
    setCpfNotProvided(false);
    setGender("nao_informado");
    setCns("");
    setBirthDate("");
    setPhone("");
    setBairro("");
    setCep("");
    setStatusExterno(null);
    setAfsesabStatus(null);
    setCpfSearchFeedback(null);
    setMunicipalityId("");
    setMunicipioSearch("");
    setIsOutsideBahia(false);
    setOutsideCity("");
  };

  // Filtragem de pacientes (Uso Comum entre Unidades - insensível a acentuação)
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      // Se há termo de busca por nome ou CPF, busca em TODAS as unidades da rede
      if (searchTerm.trim()) {
        const cleanDigits = searchTerm.replace(/\D/g, "");
        const matchName = matchNormalized(p.full_name, searchTerm);
        const matchCpf = cleanDigits && p.cpf.replace(/\D/g, "").includes(cleanDigits);
        const matchCns = p.cns?.replace(/\s/g, "").includes(searchTerm.trim());
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

  // Processos SEI do paciente
  const patientProcessos = useMemo(() => {
    if (!selectedPatientForHistory) return [];
    return processos
      .filter((p) => p.paciente_id === selectedPatientForHistory.id)
      .sort((a, b) => new Date(b.data_abertura).getTime() - new Date(a.data_abertura).getTime());
  }, [selectedPatientForHistory, processos]);

  // Consulta automática de dados cadastrais na API externa de CPF
  const handleSearchCpf = async (cpfToSearch: string) => {
    const digits = cpfToSearch.replace(/\D/g, "");
    if (digits.length !== 11) {
      setCpfSearchFeedback({
        type: "error",
        message: "Informe um CPF com 11 dígitos para pesquisar.",
      });
      return;
    }

    setIsSearchingCpf(true);
    setCpfSearchFeedback(null);

    try {
      const res = await fetch(`/api/cpf?cpf=${digits}`);
      const data: CpfLookupResult = await res.json();

      if (data.found) {
        if (data.nome) setFullName(data.nome);
        if (data.cns) setCns(data.cns);
        if (data.nascimento) setBirthDate(data.nascimento);
        if (data.gender) setGender(data.gender);
        if (data.end_descricao_barrio || data.bairro) {
          setBairro(data.end_descricao_barrio || data.bairro || "");
        }
        if (data.end_numero_cep || data.cep) {
          setCep(data.end_numero_cep || data.cep || "");
        }
        if (data.status || data.afsesab_status) {
          const rawSt = data.afsesab_status || data.status || null;
          setStatusExterno(rawSt);
          setAfsesabStatus(rawSt);
        }

        // Vincula o município correspondente
        if (data.is_outside_bahia) {
          setIsOutsideBahia(true);
          setMunicipalityId("");
          setOutsideCity(data.municipio_name || "Outro Estado");
        } else if (data.municipio_id || data.municipio_ibge || data.municipio_name) {
          const cleanName = data.municipio_name
            ?.replace(/\s*-\s*ba$/i, "")
            .trim()
            .toLowerCase();

          const mun = municipios.find(
            (m) =>
              (data.municipio_id && m.id === data.municipio_id) ||
              (data.municipio_ibge && (m.ibge_code === data.municipio_ibge || m.ibge_code.startsWith(data.municipio_ibge) || data.municipio_ibge.startsWith(m.ibge_code))) ||
              (cleanName && m.name.toLowerCase() === cleanName)
          );
          if (mun) {
            setMunicipalityId(mun.id);
            setMunicipioSearch(`${mun.name} - BA`);
            setIsOutsideBahia(false);
          } else if (data.municipio_name) {
            setIsOutsideBahia(true);
            setOutsideCity(data.municipio_name);
          }
        }

        const afStatusMsg =
          data.afsesab_status === "paciente_existe"
            ? "Paciente já cadastrado no AFSESAB."
            : data.afsesab_status === "novo_paciente"
              ? "Novo paciente (sem cadastro prévio no AFSESAB)."
              : "";

        setCpfSearchFeedback({
          type: "success",
          message: `Dados localizados na base externa (${data.nome || "Paciente"}). ${afStatusMsg} Campos preenchidos automaticamente!`,
        });
      } else {
        const isTimeout = (data as any).timeout || data.message?.includes("tempo hábil") || data.message?.includes("manualmente");
        setCpfSearchFeedback({
          type: isTimeout ? "info" : "error",
          message: data.message || "CPF não localizado na base externa.",
        });
      }
    } catch (err) {
      console.error("Erro ao consultar CPF:", err);
      setCpfSearchFeedback({
        type: "info",
        message: "Não foi possível conectar à base externa no momento. Prossiga com o preenchimento manual.",
      });
    } finally {
      setIsSearchingCpf(false);
    }
  };

  const handleSavePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!fullName.trim() || (!cpfNotProvided && !cpf.trim())) {
      alert("Preencha o Nome Completo e CPF (ou marque a opção 'CPF não informado').");
      return;
    }
    setIsSavingPatient(true);
    try {
      const targetUnitId =
        deducedUnit?.id ||
        (deducedMun?.base_id ? deducedMun.base_id : null) ||
        currentUser?.unit_id ||
        (selectedUnitId !== "all" ? selectedUnitId : null) ||
        units[0]?.id ||
        "55555555-5555-5555-5555-555555555555";

      const finalMunName = isOutsideBahia
        ? outsideCity.trim()
          ? `${outsideCity.trim()} (Fora da Bahia)`
          : "Fora da Bahia / Outro Estado"
        : deducedMun
          ? `${deducedMun.name} - BA`
          : undefined;

      await addPatient({
        unit_id: targetUnitId,
        full_name: fullName.trim(),
        cpf: cpfNotProvided ? "Não informado" : cpf.trim(),
        cpf_not_provided: cpfNotProvided,
        gender: gender,
        cns: cns.trim() || undefined,
        birth_date: birthDate || undefined,
        phone: phone.trim() || undefined,
        bairro: bairro.trim() || undefined,
        cep: cep.trim() || undefined,
        municipality_id: isOutsideBahia ? "fora-da-bahia" : municipalityId || undefined,
        municipality_name: finalMunName,
        is_outside_bahia: isOutsideBahia,
        outside_state_description: isOutsideBahia ? outsideCity.trim() || "Fora da Bahia" : undefined,
        status: "em_acompanhamento",
        status_externo: statusExterno || undefined,
        afsesab_status: afsesabStatus || undefined,
        cadastrado_afsesab: afsesabStatus === "paciente_existe",
        created_by: currentUser?.id,
      });

      setIsNewPatientOpen(false);
      resetPatientForm();
    } catch (err) {
      console.error("Erro ao salvar paciente:", err);
      alert("Erro ao salvar paciente.");
    } finally {
      setIsSavingPatient(false);
    }
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
                  <th className="py-2.5 px-3 font-semibold">Município</th>
                  <th className="py-2.5 px-3 font-semibold hidden md:table-cell">Cartão SUS</th>
                  <th className="py-2.5 px-3 font-semibold">Base Regional</th>
                  <th className="py-2.5 px-3 font-semibold hidden sm:table-cell">Telefone</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Processos SEI</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] bg-white">
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-xs text-[#5C5E62]">
                      Nenhum paciente localizado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((patient) => {
                    const munOfPatient = !patient.is_outside_bahia
                      ? municipios.find(
                        (m) =>
                          (patient.municipality_id && m.id === patient.municipality_id) ||
                          (patient.municipality_id && m.ibge_code === patient.municipality_id) ||
                          (patient.municipality_name && m.name.toLowerCase() === patient.municipality_name.toLowerCase())
                      )
                      : null;

                    const unit =
                      units.find((u) => u.id === patient.unit_id) ||
                      (munOfPatient?.base_id ? units.find((u) => u.id === munOfPatient.base_id) : null) ||
                      (munOfPatient?.brs_name ? units.find((u) => u.name.toLowerCase().includes(munOfPatient.brs_name!.replace(/^BRS\s+/i, "").toLowerCase())) : null);

                    const procCount = processos.filter(
                      (p) => p.paciente_id === patient.id
                    ).length;

                    return (
                      <tr
                        key={patient.id}
                        className="hover:bg-[#F9FAFB] transition-colors"
                      >
                        <td className="py-3 px-3 font-semibold text-[#171A20]">
                          {(() => {
                            const ageCalc = calculatePatientAgeAtEvaluation(patient.birth_date, new Date());
                            return (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span>{patient.full_name}</span>
                                {patient.gender && patient.gender !== "nao_informado" && (
                                  <span className="text-[10px] bg-gray-100 text-gray-700 font-semibold px-1 py-0.2 rounded border border-gray-200">
                                    {patient.gender === "M" ? "Masc" : patient.gender === "F" ? "Fem" : patient.gender}
                                  </span>
                                )}
                                {ageCalc.faixaEtaria && (
                                  <Badge
                                    variant="outline"
                                    className={`text-[9px] font-bold px-1.5 py-0 border ${ageCalc.badgeStyles.fullBadgeClass}`}
                                  >
                                    {ageCalc.faixaEtariaLabel}
                                  </Badge>
                                )}
                                {ageCalc.idadeFormatada !== "Não informada" && (
                                  <span className="text-[11px] text-slate-500 font-normal">
                                    ({ageCalc.idadeFormatada})
                                  </span>
                                )}
                                {patient.afsesab_status === "paciente_existe" ? (
                                  <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-800 border-emerald-300 font-normal">
                                    Cadastrado no AFSESAB
                                  </Badge>
                                ) : patient.afsesab_status === "novo_paciente" ? (
                                  <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-800 border-amber-300 font-normal">
                                    Sem cadastro no AFSESAB
                                  </Badge>
                                ) : null}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="py-3 px-3 font-mono text-[#393C41]">
                          {patient.cpf_not_provided || patient.cpf === "Não informado" ? (
                            <span className="bg-amber-50 text-amber-800 text-[10px] font-sans px-1.5 py-0.5 rounded border border-amber-200">
                              Não informado
                            </span>
                          ) : (
                            patient.cpf
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-medium">
                          {patient.is_outside_bahia || patient.municipality_id === "fora-da-bahia" ? (
                            <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[11px] font-sans">
                              🌐 {patient.municipality_name || "Fora da Bahia"}
                            </span>
                          ) : (
                            <div>
                              <div>{patient.municipality_name || "Bahia"}</div>
                              {(patient.bairro || patient.cep) && (
                                <div className="text-[10px] text-slate-400 font-normal">
                                  {[patient.bairro, patient.cep].filter(Boolean).join(" • ")}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-[#5C5E62] hidden md:table-cell">
                          {patient.cns || "—"}
                        </td>
                        <td className="py-3 px-3 text-[11px]">
                          {patient.is_outside_bahia ? (
                            <span className="text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[10px]">
                              Central Salvador
                            </span>
                          ) : unit ? (
                            <span className="font-medium text-slate-800">
                              {unit.name}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-[#5C5E62] hidden sm:table-cell">
                          {patient.phone ? formatPhone(patient.phone) : "—"}
                        </td>
                        <td className="py-3 px-3">
                          {patient.status === "em_acompanhamento" ? (
                            <Badge variant="success">Ativo</Badge>
                          ) : patient.status === "alta" ? (
                            <Badge variant="outline">Alta</Badge>
                          ) : (
                            <Badge variant="neutral">Inativo</Badge>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-emerald-800">
                          {procCount}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedPatientForHistory(patient)}
                            className="text-xs"
                          >
                            <History className="w-3.5 h-3.5 mr-1" />
                            Prontuário
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
        title={`Prontuário & Processos — ${selectedPatientForHistory?.full_name}`}
        description={`CPF: ${selectedPatientForHistory?.cpf} · Idade: ${selectedPatientHistoryAge?.idadeFormatada || "N/I"} (${selectedPatientHistoryAge?.faixaEtariaLabel || "Faixa etária N/I"}) · Cartão SUS: ${selectedPatientForHistory?.cns || "Não informado"} · Município: ${selectedPatientForHistory?.municipality_name || "Bahia"}`}
        maxWidth="lg"
      >
        <div className="space-y-5 text-xs">
          {/* Seção 1: Processos SEI */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              Processos SEI / Regulação de Medicamentos ({patientProcessos.length})
            </h4>
            {patientProcessos.length === 0 ? (
              <p className="text-slate-400 italic text-[11px] p-2.5 bg-slate-50 rounded border border-slate-100">
                Nenhum processo SEI autuado para este paciente até o momento.
              </p>
            ) : (
              <div className="space-y-2">
                {patientProcessos.map((proc) => (
                  <div key={proc.id} className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-emerald-800">{proc.numero_sei}</span>
                      <Badge variant="outline" className="text-[10px]">{proc.status}</Badge>
                    </div>
                    <p className="text-slate-700 text-[11px] font-medium">{proc.assunto}</p>
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {proc.items.map((it) => (
                        <span key={it.id} className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px] text-slate-700">
                          {it.medication_name} ({it.cid_code})
                        </span>
                      ))}
                    </div>
                    {proc.parecer && (
                      <p className="text-[10px] text-emerald-700 font-semibold pt-1">
                        ✓ Parecer emitido: {proc.parecer.active_version.tipo_parecer_title} por {proc.parecer.active_version.pharmacist_name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Seção 2: Consultas Farmacêuticas */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
              Atendimentos Clínicos & Acompanhamento ({patientConsultations.length})
            </h4>
            {patientConsultations.length === 0 ? (
              <div className="p-4 text-center text-slate-400 border border-dashed rounded bg-slate-50 text-[11px]">
                Nenhuma consulta clínica presencial registrada.
              </div>
            ) : (
              <div className="space-y-3">
                {patientConsultations.map((c) => {
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
                        </div>
                        <span className="text-[11px] text-[#5C5E62]">
                          Farmacêutico: <strong>{pName}</strong>
                        </span>
                      </div>

                      <div className="text-[11px]">
                        <span className="text-[#5C5E62]">Diagnóstico:</span>{" "}
                        <strong>{cid?.code}</strong> — {cid?.description}
                      </div>

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
          </div>

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
        onOpenChange={(open) => {
          setIsNewPatientOpen(open);
          if (!open) resetPatientForm();
        }}
        title="Novo Cadastro de Paciente"
        description="Informe os dados básicos para cadastro imediato e acompanhamento no sistema."
        maxWidth="md"
      >
        <div className="space-y-4">
          <form onSubmit={handleSavePatient} className="space-y-3">
            {/* 1. CPF (Prioritário no topo para consulta e autopreenchimento com Enter) */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 pb-2">
                  <span>CPF {cpfNotProvided ? "(Dispensado)" : "*"}</span>
                  <span className="text-[10px] font-normal text-slate-500">(Pressione Enter para consultar)</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cpfNotProvided}
                    onChange={(e) => {
                      setCpfNotProvided(e.target.checked);
                      if (e.target.checked) setCpf("");
                      setCpfSearchFeedback(null);
                      setAfsesabStatus(null);
                    }}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-[11px] font-medium text-amber-800">
                    CPF não informado
                  </span>
                </label>
              </div>
              <div className="flex gap-2">
                <Input
                  value={cpf}
                  onChange={(e) => setCpf(formatCPF(e.target.value))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (!cpfNotProvided && cpf.replace(/\D/g, "").length === 11) {
                        handleSearchCpf(cpf);
                      }
                    }
                  }}
                  placeholder={cpfNotProvided ? "CPF não informado" : "000.000.000-00 (Enter para buscar)"}
                  disabled={cpfNotProvided}
                  required={!cpfNotProvided}
                  className={`text-xs font-mono flex-1 ${cpfNotProvided ? "bg-slate-100 text-slate-400" : ""
                    }`}
                />
                {!cpfNotProvided && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSearchingCpf || cpf.replace(/\D/g, "").length !== 11}
                    onClick={() => handleSearchCpf(cpf)}
                    className="text-xs border-emerald-400 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 px-3 flex items-center gap-1.5 flex-shrink-0 font-medium"
                    title="Pressione Enter ou clique para pesquisar na API da SESAB"
                  >
                    {isSearchingCpf ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                        <span>Buscando...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Consultar [Enter]</span>
                      </>
                    )}
                  </Button>
                )}
              </div>

              {cpfSearchFeedback && (
                <div
                  className={`p-2.5 rounded text-xs space-y-1.5 ${cpfSearchFeedback.type === "success"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-900 mt-2"
                    : cpfSearchFeedback.type === "info"
                      ? "bg-blue-50 border border-blue-200 text-blue-900 mt-2"
                      : "bg-rose-50 border border-rose-200 text-rose-800 mt-2"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    {cpfSearchFeedback.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : cpfSearchFeedback.type === "info" ? (
                      <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    )}
                    <span className="font-medium">{cpfSearchFeedback.message}</span>
                  </div>
                  {afsesabStatus && (
                    <div className="flex items-center gap-2 pt-1 border-t border-emerald-200/60 text-[11px]">
                      <span className="font-semibold text-slate-700">Situação no AFSESAB:</span>
                      {afsesabStatus === "paciente_existe" ? (
                        <Badge className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 font-medium">
                          ✅ Paciente já cadastrado no AFSESAB
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] px-2 py-0.5 font-medium">
                          ⚠️ Novo Paciente (Sem cadastro prévio no AFSESAB)
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Nome Completo */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome Completo *
              </label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nome completo do paciente"
                required
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Sexo Biológico */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sexo Biológico / Gênero
                </label>
                <select
                  value={gender}
                  onChange={(e) =>
                    setGender(
                      e.target.value as "M" | "F" | "nao_informado"
                    )
                  }
                  className="w-full text-xs p-2 rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="F">Feminino (F)</option>
                  <option value="M">Masculino (M)</option>
                  <option value="nao_informado">Não informado</option>
                </select>
              </div>

              {/* Cartão SUS */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cartão SUS (CNS)
                </label>
                <Input
                  value={cns}
                  onChange={(e) => setCns(e.target.value)}
                  placeholder="Número CNS"
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data de Nascimento
                </label>
                <Input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Telefone de Contato
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(71) 98888-0000"
                  className="text-xs"
                />
              </div>
            </div>

            {/* Bairro e CEP */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bairro
                </label>
                <Input
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  placeholder="Ex: Brotas, Pituba"
                  className="text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  CEP
                </label>
                <Input
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  placeholder="00000-000"
                  className="text-xs font-mono"
                />
              </div>
            </div>

            {/* Município de Residência com Autocomplete & Opção Fora da Bahia */}
            <div ref={municipioRef} className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Município de Residência
                </label>
                <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOutsideBahia}
                    onChange={(e) => {
                      setIsOutsideBahia(e.target.checked);
                      if (e.target.checked) {
                        setMunicipalityId("");
                        setMunicipioSearch("");
                        setIsMunicipioDropdownOpen(false);
                      }
                    }}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-medium text-amber-800">
                    Fora da Bahia / Outro Estado
                  </span>
                </label>
              </div>

              {isOutsideBahia ? (
                <div className="space-y-1.5">
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-amber-600" />
                      <span className="font-semibold">Residência Interestadual</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-white text-amber-800 border-amber-300">
                      Outro Estado / DF
                    </Badge>
                  </div>
                  <Input
                    placeholder="Informe a Cidade e UF (ex: Petrolina - PE, Aracaju - SE)"
                    value={outsideCity}
                    onChange={(e) => setOutsideCity(e.target.value)}
                    className="text-xs"
                  />
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Pesquise a cidade da Bahia..."
                    value={municipioSearch}
                    onChange={(e) => {
                      setMunicipioSearch(e.target.value);
                      setMunicipalityId("");
                      setIsMunicipioDropdownOpen(true);
                    }}
                    onFocus={() => setIsMunicipioDropdownOpen(true)}
                    className="pl-9 text-xs"
                  />
                  {municipioSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setMunicipalityId("");
                        setMunicipioSearch("");
                      }}
                      className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}

                  {isMunicipioDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-30 max-h-56 overflow-y-auto">
                      {/* Opção rápida Fora da Bahia */}
                      <div
                        onClick={() => {
                          setIsOutsideBahia(true);
                          setIsMunicipioDropdownOpen(false);
                        }}
                        className="p-2.5 hover:bg-amber-50 cursor-pointer border-b border-amber-100 text-xs bg-amber-50/40 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 text-amber-900 font-semibold">
                          <Globe className="w-3.5 h-3.5 text-amber-600" />
                          <span>🌐 Fora da Bahia (Outro Estado / DF)</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] text-amber-800 border-amber-300 bg-white">
                          Interestadual
                        </Badge>
                      </div>

                      {filteredMunicipios.length === 0 ? (
                        <div className="p-3 text-center text-slate-400 text-xs">
                          Nenhum município baiano encontrado.
                        </div>
                      ) : (
                        filteredMunicipios.map((mun) => (
                          <div
                            key={mun.id}
                            onClick={() => {
                              setMunicipalityId(mun.id);
                              setMunicipioSearch(`${mun.name} - BA`);
                              setIsMunicipioDropdownOpen(false);
                            }}
                            className={`p-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0 text-xs flex items-center justify-between ${municipalityId === mun.id ? "bg-emerald-50 text-emerald-900 font-semibold" : ""
                              }`}
                          >
                            <div className="flex items-center gap-2">
                              <span>{mun.name}</span>
                              <span className="text-[10px] text-slate-400">BA</span>
                            </div>
                            {mun.brs_name && (
                              <Badge variant="outline" className="text-[9px] text-slate-500 bg-slate-50">
                                BRS {mun.brs_name}
                              </Badge>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Relação Territorial Deduzida do Paciente */}
              {!isOutsideBahia && deducedMun && (
                <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2 text-slate-800">
                    <Building className="h-3.5 w-3.5 text-emerald-600" />
                    <span>
                      Base Regional: <strong>{deducedUnit?.name || `BRS ${deducedMun.brs_name || ""}`}</strong>
                    </span>
                  </div>
                  {deducedMun.responsible_pharmacist && (
                    <Badge variant="outline" className="text-[10px] bg-white text-emerald-800 border-emerald-300">
                      {deducedMun.responsible_pharmacist}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsNewPatientOpen(false);
                  resetPatientForm();
                }}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSavingPatient}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                {isSavingPatient ? "Salvando..." : "Salvar Paciente"}
              </Button>
            </div>
          </form>
        </div>
      </Dialog>
    </div>
  );
}
