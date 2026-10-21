"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Pill,
  Trash2,
  UserPlus,
  Send,
  Plus,
  History,
  Info,
  Building,
  UserCheck,
  FileCheck2,
  Calendar,
  Eye,
  CheckSquare,
  Globe,
  MapPin,
  Stethoscope,
  Compass,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { useApp } from "@/lib/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Patient, ProcessoItem, Processo, Municipio, CpfLookupResult } from "@/lib/types";

const formatCPF = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    .slice(0, 14);
};

export default function NovoProcessoPage() {
  const router = useRouter();
  const {
    patients,
    origens,
    units,
    municipios,
    cids,
    farmacos,
    processos,
    currentUser,
    addProcesso,
    addPatient,
    updatePatient,
  } = useApp();

  // 1. Identificação do Processo
  const [numeroSei, setNumeroSei] = useState("");
  const [dataAbertura, setDataAbertura] = useState(() => new Date().toISOString().split("T")[0]);
  const [assunto, setAssunto] = useState("");
  const [origemId, setOrigemId] = useState("");
  const [priority, setPriority] = useState<"normal" | "urgente" | "judicial">("normal");

  // 2. Paciente & Município Herdado
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [patientSearch, setPatientSearch] = useState("");
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [municipioId, setMunicipioId] = useState("");
  const [municipioSearchInput, setMunicipioSearchInput] = useState("");
  const [isMunicipioSearchDropdownOpen, setIsMunicipioSearchDropdownOpen] = useState(false);
  const [isProcessoOutsideBahia, setIsProcessoOutsideBahia] = useState(false);
  const [processoOutsideCity, setProcessoOutsideCity] = useState("");
  const processoMunicipioRef = useRef<HTMLDivElement>(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Modal de Cadastro Rápido de Paciente
  const [isQuickPatientModalOpen, setIsQuickPatientModalOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientCpf, setNewPatientCpf] = useState("");
  const [newPatientCpfNotProvided, setNewPatientCpfNotProvided] = useState(false);
  const [newPatientGender, setNewPatientGender] = useState<"M" | "F" | "nao_informado">("nao_informado");
  const [newPatientCns, setNewPatientCns] = useState("");
  const [newPatientBirthDate, setNewPatientBirthDate] = useState("");
  const [newPatientPhone, setNewPatientPhone] = useState("");
  const [newPatientBairro, setNewPatientBairro] = useState("");
  const [newPatientCep, setNewPatientCep] = useState("");
  const [newPatientStatusExterno, setNewPatientStatusExterno] = useState<string | null>(null);
  const [newPatientAfsesabStatus, setNewPatientAfsesabStatus] = useState<string | null>(null);
  const [isSearchingQuickCpf, setIsSearchingQuickCpf] = useState(false);
  const [quickCpfFeedback, setQuickCpfFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [newPatientMunicipioId, setNewPatientMunicipioId] = useState("");
  const [newPatientMunicipioSearch, setNewPatientMunicipioSearch] = useState("");
  const [isNewPatientMunicipioDropdownOpen, setIsNewPatientMunicipioDropdownOpen] = useState(false);
  const [newPatientIsOutsideBahia, setNewPatientIsOutsideBahia] = useState(false);
  const [newPatientOutsideCity, setNewPatientOutsideCity] = useState("");
  const quickPatientMunicipioRef = useRef<HTMLDivElement>(null);
  const [isSavingPatient, setIsSavingPatient] = useState(false);

  // 3. Fármaco/Substância & CID Solicitados
  const [items, setItems] = useState<ProcessoItem[]>([]);
  const [farmacoInput, setFarmacoInput] = useState("");
  const [isFarmacoDropdownOpen, setIsFarmacoDropdownOpen] = useState(false);
  const [cidInput, setCidInput] = useState("");
  const [isCidDropdownOpen, setIsCidDropdownOpen] = useState(false);
  const [cidNaoInformado, setCidNaoInformado] = useState(false);
  const [selectedCidId, setSelectedCidId] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Limpa completamente os campos do formulário do Processo SEI
  const resetProcessoForm = useCallback(() => {
    setNumeroSei("");
    setDataAbertura(new Date().toISOString().split("T")[0]);
    setAssunto("");
    setOrigemId("");
    setPriority("normal");
    setSelectedPatientId("");
    setPatientSearch("");
    setIsPatientDropdownOpen(false);
    setMunicipioId("");
    setMunicipioSearchInput("");
    setIsMunicipioSearchDropdownOpen(false);
    setIsProcessoOutsideBahia(false);
    setProcessoOutsideCity("");
    setItems([]);
    setFarmacoInput("");
    setIsFarmacoDropdownOpen(false);
    setCidInput("");
    setIsCidDropdownOpen(false);
    setSelectedCidId("");
    setCidNaoInformado(false);
    setErrorMessage("");
  }, []);

  // Limpa completamente os campos do modal de Cadastro Rápido de Paciente
  const resetQuickPatientForm = useCallback((initialCpf = "", initialName = "") => {
    setNewPatientName(initialName);
    setNewPatientCpf(initialCpf);
    setNewPatientCpfNotProvided(false);
    setNewPatientGender("nao_informado");
    setNewPatientCns("");
    setNewPatientBirthDate("");
    setNewPatientPhone("");
    setNewPatientBairro("");
    setNewPatientCep("");
    setNewPatientStatusExterno(null);
    setNewPatientAfsesabStatus(null);
    setIsSearchingQuickCpf(false);
    setQuickCpfFeedback(null);
    setNewPatientMunicipioId("");
    setNewPatientMunicipioSearch("");
    setIsNewPatientMunicipioDropdownOpen(false);
    setNewPatientIsOutsideBahia(false);
    setNewPatientOutsideCity("");
  }, []);

  // Garante que, ao iniciar ou acessar a tela de novo processo, os dados sempre comecem limpos
  useEffect(() => {
    resetProcessoForm();
    resetQuickPatientForm();
  }, [resetProcessoForm, resetQuickPatientForm]);

  // Refs para controle de clique fora dos dropdowns
  const patientRef = useRef<HTMLDivElement>(null);
  const farmacoRef = useRef<HTMLDivElement>(null);
  const cidRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (patientRef.current && !patientRef.current.contains(target)) {
        setIsPatientDropdownOpen(false);
      }
      if (farmacoRef.current && !farmacoRef.current.contains(target)) {
        setIsFarmacoDropdownOpen(false);
      }
      if (cidRef.current && !cidRef.current.contains(target)) {
        setIsCidDropdownOpen(false);
      }
      if (quickPatientMunicipioRef.current && !quickPatientMunicipioRef.current.contains(target)) {
        setIsNewPatientMunicipioDropdownOpen(false);
      }
      if (processoMunicipioRef.current && !processoMunicipioRef.current.contains(target)) {
        setIsMunicipioSearchDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Pacientes filtrados
  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients.slice(0, 8);
    const term = patientSearch.toLowerCase();
    return patients.filter((p) => {
      const matchName = p.full_name.toLowerCase().includes(term);
      const matchCpf = p.cpf && p.cpf.includes(term);
      const matchCns = p.cns && p.cns.includes(term);
      return matchName || matchCpf || matchCns;
    });
  }, [patients, patientSearch]);

  const selectedPatient = useMemo(() => {
    return patients.find((p) => p.id === selectedPatientId) || null;
  }, [patients, selectedPatientId]);

  // Histórico prévio de processos do paciente selecionado
  const patientPastProcessos = useMemo(() => {
    if (!selectedPatient) return [];
    return processos.filter(
      (p) =>
        p.paciente_id === selectedPatient.id ||
        (selectedPatient.cpf && p.paciente?.cpf && p.paciente.cpf === selectedPatient.cpf)
    );
  }, [selectedPatient, processos]);

  // Quando seleciona um paciente, herda seu município ou status interestadual
  const handleSelectPatient = (p: Patient) => {
    setSelectedPatientId(p.id);
    if (p.is_outside_bahia || p.municipality_id === "fora-da-bahia") {
      setIsProcessoOutsideBahia(true);
      setMunicipioId("fora-da-bahia");
      const desc = p.outside_state_description || p.municipality_name || "Fora da Bahia";
      setProcessoOutsideCity(desc);
      setMunicipioSearchInput(desc);
    } else {
      const cleanPatientMun = p.municipality_name
        ?.replace(/\s*-\s*ba$/i, "")
        .trim()
        .toLowerCase();

      // Localiza o município correspondente na base de 417 municípios
      const mun = municipios.find(
        (m) =>
          (p.municipality_id && m.id === p.municipality_id) ||
          (p.municipality_id && m.ibge_code === p.municipality_id) ||
          (p.municipality_id && m.ibge_code.startsWith(p.municipality_id)) ||
          (p.municipality_id && p.municipality_id === "7733" && m.ibge_code === "2927408") ||
          (cleanPatientMun && m.name.toLowerCase() === cleanPatientMun)
      );

      if (mun) {
        setIsProcessoOutsideBahia(false);
        setProcessoOutsideCity("");
        setMunicipioId(mun.id);
        setMunicipioSearchInput(`${mun.name} - BA`);
      } else if (p.municipality_name) {
        if (p.municipality_name.toLowerCase().includes("fora da bahia")) {
          setIsProcessoOutsideBahia(true);
          setMunicipioId("fora-da-bahia");
          setProcessoOutsideCity(p.municipality_name);
          setMunicipioSearchInput(p.municipality_name);
        } else {
          const munByName = municipios.find(
            (m) => cleanPatientMun && m.name.toLowerCase() === cleanPatientMun
          );
          if (munByName) {
            setIsProcessoOutsideBahia(false);
            setProcessoOutsideCity("");
            setMunicipioId(munByName.id);
            setMunicipioSearchInput(`${munByName.name} - BA`);
          } else {
            setIsProcessoOutsideBahia(false);
            setProcessoOutsideCity("");
            setMunicipioId(p.municipality_id || "");
            setMunicipioSearchInput(p.municipality_name);
          }
        }
      } else {
        setIsProcessoOutsideBahia(false);
        setProcessoOutsideCity("");
        setMunicipioId("");
        setMunicipioSearchInput("");
      }
    }
    setIsPatientDropdownOpen(false);
    setPatientSearch("");
  };

  // Município selecionado e dedução da Base Regional (BRS)
  const selectedMunicipio = useMemo(() => {
    if (isProcessoOutsideBahia || municipioId === "fora-da-bahia") {
      return {
        id: "fora-da-bahia",
        ibge_code: "0000000",
        name: processoOutsideCity.trim() ? `${processoOutsideCity.trim()} (Fora da Bahia)` : "Fora da Bahia / Outro Estado",
        brs_name: "Interestadual",
        nrs_name: "Interestadual",
        macroregion: "Fora da Bahia",
        active: true,
      } as Municipio;
    }
    if (!municipioId && !municipioSearchInput.trim()) return null;

    const cleanInput = municipioSearchInput
      .replace(/\s*-\s*BA$/i, "")
      .trim()
      .toLowerCase();

    return (
      municipios.find((m) => m.id === municipioId) ||
      municipios.find((m) => m.ibge_code === municipioId) ||
      municipios.find((m) => m.ibge_code.startsWith(municipioId)) ||
      municipios.find((m) => municipioId === "7733" && m.ibge_code === "2927408") ||
      municipios.find((m) => cleanInput && m.name.toLowerCase() === cleanInput) ||
      null
    );
  }, [municipios, municipioId, isProcessoOutsideBahia, processoOutsideCity, municipioSearchInput]);

  const deducedUnit = useMemo(() => {
    if (isProcessoOutsideBahia || municipioId === "fora-da-bahia") {
      return units.find((u) => u.name.toLowerCase().includes("salvador")) || units[0] || null;
    }
    if (!selectedMunicipio) return null;

    // 1. Vínculo direto por base_id (ex: "unit-brs-paulo-afonso" ou UUID)
    if (selectedMunicipio.base_id) {
      const byBaseId = units.find((u) => u.id === selectedMunicipio.base_id);
      if (byBaseId) return byBaseId;
    }

    // 2. Vínculo por brs_name normalizado (ex: "BRS Paulo Afonso" -> "Paulo Afonso")
    if (selectedMunicipio.brs_name) {
      const cleanBrs = selectedMunicipio.brs_name
        .replace(/^(BRS|NRS|Base Regional de Saúde|Núcleo Regional de Saúde)\s+/i, "")
        .trim()
        .toLowerCase();
      const byBrs = units.find((u) => {
        const cleanUnit = u.name
          .replace(/^(BRS|NRS|Base Regional de Saúde|Núcleo Regional de Saúde)\s+/i, "")
          .trim()
          .toLowerCase();
        return cleanUnit === cleanBrs || u.name.toLowerCase().includes(cleanBrs);
      });
      if (byBrs) return byBrs;
    }

    // 3. Vínculo pelos municípios explicitamente atendidos
    const byServed = units.find((u) =>
      u.served_municipalities?.some(
        (sm) =>
          sm.id === selectedMunicipio.id ||
          sm.ibge_code === selectedMunicipio.ibge_code ||
          sm.name.toLowerCase() === selectedMunicipio.name.toLowerCase()
      )
    );
    if (byServed) return byServed;

    return null;
  }, [selectedMunicipio, units, isProcessoOutsideBahia, municipioId]);

  // Municípios filtrados para o modal de cadastro rápido de paciente
  const filteredNewPatientMunicipios = useMemo(() => {
    if (!newPatientMunicipioSearch.trim()) return municipios.slice(0, 10);
    const term = newPatientMunicipioSearch.toLowerCase().trim();
    return municipios
      .filter((m) => m.name.toLowerCase().includes(term) || (m.brs_name && m.brs_name.toLowerCase().includes(term)))
      .slice(0, 15);
  }, [municipios, newPatientMunicipioSearch]);

  // Município e Base deduzidos para o modal de cadastro rápido de paciente
  const newPatientDeducedMun = useMemo(() => {
    if (!newPatientMunicipioId) return null;
    return municipios.find((m) => m.id === newPatientMunicipioId) || null;
  }, [municipios, newPatientMunicipioId]);

  const newPatientDeducedUnit = useMemo(() => {
    if (!newPatientDeducedMun) return null;
    if (newPatientDeducedMun.base_id) {
      const byBase = units.find((u) => u.id === newPatientDeducedMun.base_id);
      if (byBase) return byBase;
    }
    if (newPatientDeducedMun.brs_name) {
      const cleanBrs = newPatientDeducedMun.brs_name
        .replace(/^(BRS|NRS|Base Regional de Saúde|Núcleo Regional de Saúde)\s+/i, "")
        .trim()
        .toLowerCase();
      return units.find((u) => u.name.toLowerCase().includes(cleanBrs)) || null;
    }
    return null;
  }, [newPatientDeducedMun, units]);

  // Municípios filtrados para a Seção 2 do processo
  const filteredProcessoMunicipios = useMemo(() => {
    if (!municipioSearchInput.trim()) return municipios.slice(0, 10);
    const term = municipioSearchInput.toLowerCase().trim();
    return municipios
      .filter((m) => m.name.toLowerCase().includes(term) || (m.brs_name && m.brs_name.toLowerCase().includes(term)))
      .slice(0, 15);
  }, [municipios, municipioSearchInput]);

  // CIDs filtrados (busca rápida na base oficial de 4.000+ CIDs)
  const filteredCids = useMemo(() => {
    if (!cidInput.trim()) return cids.slice(0, 10);
    const term = cidInput.toLowerCase().trim();
    return cids
      .filter((c) => c.code.toLowerCase().includes(term) || c.description.toLowerCase().includes(term))
      .slice(0, 15);
  }, [cids, cidInput]);

  // Fármacos filtrados com autocomplete (Base Oficial 4.086 Fármacos.xlsx)
  const filteredFarmacos = useMemo(() => {
    if (!farmacoInput.trim()) return farmacos.slice(0, 10);
    const term = farmacoInput.toLowerCase().trim();
    return farmacos
      .filter((f) => f.name.toLowerCase().includes(term) || (f.component && f.component.toLowerCase().includes(term)))
      .slice(0, 15);
  }, [farmacoInput, farmacos]);

  // Adicionar Combo Fármaco + CID à Demanda
  const handleAddItem = () => {
    const farmaco = farmacoInput.trim();
    if (!farmaco) {
      alert("Informe a substância ativa ou fármaco solicitado.");
      return;
    }

    let cidCode = "N/I";
    let cidDesc = "CID Não Informado / Investigação Clínica";
    let cidId = undefined;

    if (!cidNaoInformado) {
      if (!selectedCidId && !cidInput.trim()) {
        alert("Selecione um CID-10 ou marque a opção 'CID não informado'.");
        return;
      }
      const cleanInput = cidInput.trim().toLowerCase();
      const foundCid = cids.find(
        (c) =>
          c.id === selectedCidId ||
          c.code.toLowerCase() === cleanInput ||
          `${c.code.toLowerCase()} - ${c.description.toLowerCase()}` === cleanInput
      );
      if (foundCid) {
        cidCode = foundCid.code;
        cidDesc = foundCid.description;
        cidId = foundCid.id;
      } else if (cidInput.trim()) {
        const parts = cidInput.split("-");
        if (parts.length > 1 && parts[0].trim().length <= 6) {
          cidCode = parts[0].trim().toUpperCase();
          cidDesc = parts.slice(1).join("-").trim();
        } else {
          cidCode = cidInput.trim().toUpperCase();
          cidDesc = "Diagnóstico clínico especificado";
        }
      }
    }

    const newItem: ProcessoItem = {
      id: `pitem-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      medication_type: "farmaco",
      medication_name: farmaco,
      farmaco_substancia: farmaco,
      cid_id: cidId,
      cid_code: cidCode,
      cid_description: cidDesc,
      cid_nao_informado: cidNaoInformado,
      status: "pendente",
    };

    setItems([...items, newItem]);
    setFarmacoInput("");
    setIsFarmacoDropdownOpen(false);
    setCidInput("");
    setIsCidDropdownOpen(false);
    setSelectedCidId("");
    setCidNaoInformado(false);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  // Consulta automática de dados cadastrais na API externa de CPF
  const handleSearchQuickCpf = async (cpfToSearch: string) => {
    const digits = cpfToSearch.replace(/\D/g, "");
    if (digits.length !== 11) {
      setQuickCpfFeedback({
        type: "error",
        message: "Informe um CPF com 11 dígitos para pesquisar.",
      });
      return;
    }

    setIsSearchingQuickCpf(true);
    setQuickCpfFeedback(null);

    try {
      const res = await fetch(`/api/cpf?cpf=${digits}`);
      const data: CpfLookupResult = await res.json();

      if (data.found) {
        if (data.nome) setNewPatientName(data.nome);
        if (data.cns) setNewPatientCns(data.cns);
        if (data.nascimento) setNewPatientBirthDate(data.nascimento);
        if (data.gender) setNewPatientGender(data.gender);
        if (data.end_descricao_barrio || data.bairro) {
          setNewPatientBairro(data.end_descricao_barrio || data.bairro || "");
        }
        if (data.end_numero_cep || data.cep) {
          setNewPatientCep(data.end_numero_cep || data.cep || "");
        }
        if (data.status || data.afsesab_status) {
          const rawSt = data.afsesab_status || data.status || null;
          setNewPatientStatusExterno(rawSt);
          setNewPatientAfsesabStatus(rawSt);
        }

        // Vincula o município correspondente da Bahia
        if (data.is_outside_bahia) {
          setNewPatientIsOutsideBahia(true);
          setNewPatientMunicipioId("");
          setNewPatientOutsideCity(data.municipio_name || "Outro Estado");
        } else if (data.municipio_id || data.municipio_ibge || data.municipio_name) {
          const cleanName = data.municipio_name
            ?.replace(/\s*-\s*ba$/i, "")
            .trim()
            .toLowerCase();

          const mun = municipios.find(
            (m) =>
              (data.municipio_id && (m.id === data.municipio_id || m.id.toLowerCase() === data.municipio_id.toLowerCase())) ||
              (data.municipio_ibge && (m.ibge_code === data.municipio_ibge || m.ibge_code.startsWith(data.municipio_ibge) || data.municipio_ibge.startsWith(m.ibge_code))) ||
              (data.municipio_id && data.municipio_id === "7733" && m.ibge_code === "2927408") ||
              (cleanName && m.name.toLowerCase() === cleanName)
          );
          if (mun) {
            setNewPatientMunicipioId(mun.id);
            setNewPatientMunicipioSearch(`${mun.name} - BA`);
            setNewPatientIsOutsideBahia(false);
          } else if (data.municipio_name) {
            setNewPatientIsOutsideBahia(true);
            setNewPatientOutsideCity(data.municipio_name);
          }
        }

        const afStatusMsg =
          data.afsesab_status === "paciente_existe"
            ? "Paciente já cadastrado no AFSESAB."
            : data.afsesab_status === "novo_paciente"
              ? "Novo paciente (sem cadastro prévio no AFSESAB)."
              : "";

        setQuickCpfFeedback({
          type: "success",
          message: `Dados localizados na base externa (${data.nome || "Paciente"}). ${afStatusMsg} Preenchidos automaticamente!`,
        });
      } else {
        const isTimeout = (data as any).timeout || data.message?.includes("tempo hábil") || data.message?.includes("manualmente");
        setQuickCpfFeedback({
          type: isTimeout ? "info" : "error",
          message: data.message || "CPF não localizado na base externa.",
        });
      }
    } catch (err) {
      console.error("Erro ao consultar CPF:", err);
      setQuickCpfFeedback({
        type: "info",
        message: "Não foi possível conectar à base externa no momento. Prossiga com o preenchimento manual.",
      });
    } finally {
      setIsSearchingQuickCpf(false);
    }
  };

  // Salvar novo paciente inline
  const handleSaveQuickPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim()) {
      alert("O nome completo é obrigatório.");
      return;
    }
    if (!newPatientCpfNotProvided && !newPatientCpf.trim()) {
      alert("Informe o CPF ou marque 'CPF não informado'.");
      return;
    }

    setIsSavingPatient(true);
    try {
      const mun = !newPatientIsOutsideBahia ? municipios.find((m) => m.id === newPatientMunicipioId) : null;
      const finalMunName = newPatientIsOutsideBahia
        ? newPatientOutsideCity.trim()
          ? `${newPatientOutsideCity.trim()} (Fora da Bahia)`
          : "Fora da Bahia / Outro Estado"
        : mun
          ? `${mun.name} - BA`
          : null;

      const created = await addPatient({
        unit_id: newPatientDeducedUnit?.id || (mun?.base_id ? mun.base_id : deducedUnit?.id || units[0]?.id || ""),
        cpf: newPatientCpfNotProvided ? "" : newPatientCpf.replace(/\D/g, ""),
        cpf_not_provided: newPatientCpfNotProvided,
        gender: newPatientGender,
        cns: newPatientCns.trim() || null,
        full_name: newPatientName.trim(),
        birth_date: newPatientBirthDate || null,
        phone: newPatientPhone.trim() || null,
        bairro: newPatientBairro.trim() || null,
        cep: newPatientCep.trim() || null,
        status_externo: newPatientStatusExterno || null,
        afsesab_status: newPatientAfsesabStatus || null,
        cadastrado_afsesab: newPatientAfsesabStatus === "paciente_existe",
        municipality_id: newPatientIsOutsideBahia ? "fora-da-bahia" : newPatientMunicipioId || null,
        municipality_name: finalMunName,
        is_outside_bahia: newPatientIsOutsideBahia,
        outside_state_description: newPatientIsOutsideBahia ? newPatientOutsideCity.trim() || "Fora da Bahia" : null,
        status: "em_acompanhamento",
      });

      setSelectedPatientId(created.id);
      if (newPatientIsOutsideBahia) {
        setIsProcessoOutsideBahia(true);
        setProcessoOutsideCity(newPatientOutsideCity.trim() || "Fora da Bahia");
        setMunicipioId("fora-da-bahia");
        setMunicipioSearchInput(finalMunName || "Fora da Bahia");
      } else {
        const targetMunId = newPatientMunicipioId || mun?.id || created.municipality_id || "";
        const targetMunName = mun ? `${mun.name} - BA` : finalMunName || "";
        if (targetMunId) {
          setIsProcessoOutsideBahia(false);
          setProcessoOutsideCity("");
          setMunicipioId(targetMunId);
          setMunicipioSearchInput(targetMunName);
        }
      }
      setIsQuickPatientModalOpen(false);

      // Limpar formulário
      setNewPatientName("");
      setNewPatientCpf("");
      setNewPatientCpfNotProvided(false);
      setNewPatientGender("nao_informado");
      setNewPatientCns("");
      setNewPatientBirthDate("");
      setNewPatientPhone("");
      setNewPatientBairro("");
      setNewPatientCep("");
      setNewPatientStatusExterno(null);
      setNewPatientAfsesabStatus(null);
      setQuickCpfFeedback(null);
      setNewPatientMunicipioId("");
      setNewPatientMunicipioSearch("");
      setNewPatientIsOutsideBahia(false);
      setNewPatientOutsideCity("");
    } catch (err) {
      console.error(err);
      alert("Erro ao cadastrar paciente.");
    } finally {
      setIsSavingPatient(false);
    }
  };

  // Submissão do Processo SEI
  const handleSubmitProcesso = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!numeroSei.trim()) {
      setErrorMessage("Por favor, informe o Número do Processo SEI.");
      return;
    }
    if (!selectedPatientId) {
      setErrorMessage("Selecione ou cadastre o paciente requerente.");
      return;
    }
    if (!origemId) {
      setErrorMessage("Selecione a origem da demanda administrativa/judicial.");
      return;
    }
    if (!municipioId) {
      setErrorMessage("Informe o município de residência do paciente.");
      return;
    }
    if (items.length === 0) {
      setErrorMessage("Adicione pelo menos um fármaco/substância com o respectivo CID.");
      return;
    }

    setIsSaving(true);
    try {
      const orig = origens.find((o) => o.id === origemId);
      const mun = isProcessoOutsideBahia || municipioId === "fora-da-bahia"
        ? ({
          id: "fora-da-bahia",
          ibge_code: "0000000",
          name: processoOutsideCity.trim() ? `${processoOutsideCity.trim()} (Fora da Bahia)` : "Fora da Bahia / Outro Estado",
          brs_name: "Interestadual",
          nrs_name: "Interestadual",
          macroregion: "Fora da Bahia",
          active: true,
        } as Municipio)
        : municipios.find((m) => m.id === municipioId);

      // Se o paciente selecionado não tinha município ou mudou de residência, atualiza o cadastro dele
      if (selectedPatient && mun) {
        if (!selectedPatient.municipality_id || isProcessoOutsideBahia) {
          updatePatient(selectedPatient.id, {
            municipality_id: mun.id,
            municipality_name: mun.name,
            is_outside_bahia: isProcessoOutsideBahia,
            outside_state_description: isProcessoOutsideBahia ? processoOutsideCity.trim() || "Fora da Bahia" : undefined,
          });
        }
      }

      // Primeiro status oficial do fluxo: 1. Triagem (Abertura do processo)
      const initialStatus = "triagem";

      // SLA limite (10 dias padrão)
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() + 10);

      const subjectText =
        assunto.trim() ||
        `Solicitação de ${items[0]?.farmaco_substancia || items[0]?.medication_name} (CID: ${items[0]?.cid_code})`;

      await addProcesso({
        numero_sei: numeroSei.trim().toUpperCase(),
        data_abertura: dataAbertura,
        assunto: subjectText,
        paciente_id: selectedPatientId,
        paciente: selectedPatient,
        origem_id: origemId,
        origem: orig,
        municipio_id: municipioId,
        municipio: mun,
        unidade_id: deducedUnit?.id || "",
        unidade: deducedUnit,
        status: initialStatus,
        priority: priority,
        triagem_documents_ok: true,
        triagem_notes: "Processo autuado no CimBahia com base no SEI e cadastrado na triagem inicial.",
        triagem_by_id: currentUser?.id,
        triagem_by_name: currentUser?.full_name,
        triagem_completed_at: new Date().toISOString(),
        items: items,
        sla_limit_date: limitDate.toISOString().split("T")[0],
        days_in_current_status: 1,
        is_sla_delayed: false,
        historico: [
          {
            id: `h-init-${Date.now()}`,
            processo_id: "",
            from_status: null,
            to_status: initialStatus,
            user_id: currentUser?.id || "sistema",
            user_name: currentUser?.full_name || "Triagem Inicial",
            notes: "Processo autuado no CimBahia e registrado na triagem inicial.",
            timestamp: new Date().toISOString(),
          },
        ],
      });

      // Limpa todo o estado do formulário antes de voltar
      resetProcessoForm();
      resetQuickPatientForm();

      router.push("/atendimentos");
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage((err as Error).message || "Erro ao autuar processo.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Topo / Voltar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/atendimentos">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-slate-600">
              <ArrowLeft className="h-4 w-4" />
              Voltar à Fila de Atendimentos
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Autuação de Processo SEI
            </h1>
            <p className="text-xs text-slate-500">
              Criação e triagem rápida de solicitação de medicamentos e fármacos especializados.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm("Deseja realmente limpar todos os campos do formulário para iniciar um novo processo do zero?")) {
                resetProcessoForm();
                resetQuickPatientForm();
              }
            }}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5"
            title="Limpar todos os campos e recomeçar"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpar Formulário</span>
          </Button>
          <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300">
            Etapa: Criar Processo (Triagem)
          </Badge>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmitProcesso} className="space-y-6">
        {/* ========================================================================= */}
        {/* SEÇÃO 1: IDENTIFICAÇÃO DO PROCESSO */}
        {/* ========================================================================= */}
        <Card>
          <CardHeader className="p-4 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600" />
              1. Identificação do Processo SEI
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Dados de protocolo e classificação de entrada no Sistema Eletrônico de Informações.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Número do Processo SEI *
                </label>
                <Input
                  placeholder="019.0091.2026.0006720-95"
                  value={numeroSei}
                  onChange={(e) => setNumeroSei(e.target.value)}
                  className="font-mono text-xs uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data de Entrada *
                </label>
                <Input
                  type="date"
                  value={dataAbertura}
                  onChange={(e) => setDataAbertura(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Prioridade *
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as "normal" | "urgente" | "judicial")}
                  className="w-full text-xs p-2 rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="normal">Normal</option>
                  <option value="urgente">Urgente (Risco Clínico)</option>
                  <option value="judicial">Mandado Judicial / Liminar</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Origem da Demanda *
                </label>
                <select
                  value={origemId}
                  onChange={(e) => setOrigemId(e.target.value)}
                  className="w-full text-xs p-2 rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">Selecione a origem...</option>
                  {origens.map((orig) => (
                    <option key={orig.id} value={orig.id}>
                      {orig.sigla ? `${orig.sigla} - ${orig.name}` : orig.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assunto / Resumo da Demanda
                </label>
                <Input
                  placeholder="Ex: Concessão inicial de Fármaco Biológico para Artrite..."
                  value={assunto}
                  onChange={(e) => setAssunto(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ========================================================================= */}
        {/* SEÇÃO 2: REQUERENTE / PACIENTE & CONEXÕES REAPROVEITADAS */}
        {/* ========================================================================= */}
        <Card>
          <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-emerald-600" />
                2. Requerente / Paciente
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                O município e a base regional são deduzidos automaticamente do paciente.
              </CardDescription>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                resetQuickPatientForm();
                setIsQuickPatientModalOpen(true);
              }}
              className="text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 flex items-center gap-1.5"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Novo Paciente
            </Button>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {selectedPatient ? (
              <div className="space-y-3">
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                      <span>{selectedPatient.full_name}</span>
                      <Badge variant="outline" className="text-[10px] bg-emerald-100 text-emerald-800 border-emerald-300">
                        {selectedPatient.gender === "M"
                          ? "Masc"
                          : selectedPatient.gender === "F"
                            ? "Fem"
                            : selectedPatient.gender === "outro"
                              ? "Outro"
                              : "Sexo N/I"}
                      </Badge>
                      {selectedPatient.cpf_not_provided ? (
                        <Badge variant="neutral" className="text-[10px] text-amber-700 bg-amber-50">
                          CPF Não Informado
                        </Badge>
                      ) : (
                        <span className="font-mono text-xs text-slate-600">CPF: {selectedPatient.cpf}</span>
                      )}
                      {selectedPatient.afsesab_status === "paciente_existe" ? (
                        <Badge variant="outline" className="text-[10px] bg-emerald-100 text-emerald-900 border-emerald-300 font-medium">
                          Cadastrado no AFSESAB
                        </Badge>
                      ) : selectedPatient.afsesab_status === "novo_paciente" ? (
                        <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-900 border-amber-300 font-medium">
                          Novo no AFSESAB
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-slate-600">
                      <strong>CNS:</strong> {selectedPatient.cns || "Não informado"} •{" "}
                      <strong>Nascimento:</strong> {selectedPatient.birth_date || "N/I"} •{" "}
                      <strong>Telefone:</strong> {selectedPatient.phone || "N/I"}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-700">
                      <span className="flex items-center gap-1 font-semibold text-slate-900">
                        <MapPin className="h-3.5 w-3.5 text-indigo-600 flex-shrink-0" />
                        Residência:
                      </span>
                      <span>
                        {isProcessoOutsideBahia
                          ? `Fora da Bahia (${processoOutsideCity || "Outro Estado"})`
                          : selectedMunicipio
                            ? `${selectedMunicipio.name} - BA`
                            : selectedPatient.municipality_name || "Município a definir"}
                      </span>
                      {deducedUnit && (
                        <Badge variant="outline" className="text-[10px] bg-white text-emerald-800 border-emerald-300 flex items-center gap-1 font-medium">
                          <Building className="h-3 w-3 text-emerald-600" />
                          Base: {deducedUnit.name}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {patientPastProcessos.length > 0 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setIsHistoryModalOpen(true)}
                        className="text-xs bg-white text-indigo-700 border-indigo-300 hover:bg-indigo-50 flex items-center gap-1.5"
                      >
                        <History className="h-3.5 w-3.5 text-indigo-600" />
                        Histórico ({patientPastProcessos.length})
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedPatientId("");
                        setMunicipioId("");
                        setMunicipioSearchInput("");
                        setIsProcessoOutsideBahia(false);
                        setProcessoOutsideCity("");
                        setPatientSearch("");
                      }}
                      className="text-xs text-slate-500 hover:text-slate-800"
                    >
                      Trocar Paciente
                    </Button>
                  </div>
                </div>

                {/* Banner de alerta se o paciente possui histórico anterior */}
                {patientPastProcessos.length > 0 && (
                  <div className="bg-indigo-50/80 border border-indigo-200 rounded-lg p-3 text-xs text-indigo-900 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                      <div>
                        <span className="font-semibold">Atenção:</span> Este paciente já possui{" "}
                        <strong>{patientPastProcessos.length} processo(s) anterior(es)</strong> registrado(s) no sistema.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsHistoryModalOpen(true)}
                      className="text-xs font-semibold underline text-indigo-700 hover:text-indigo-900 ml-2"
                    >
                      Consultar Decisões Anteriores
                    </button>
                  </div>
                )}

                {/* Município de Residência & Dedução de Base */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div ref={processoMunicipioRef} className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Município de Residência do Paciente *
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isProcessoOutsideBahia}
                          onChange={(e) => {
                            setIsProcessoOutsideBahia(e.target.checked);
                            if (e.target.checked) {
                              setMunicipioId("fora-da-bahia");
                              setMunicipioSearchInput("Fora da Bahia");
                              setIsMunicipioSearchDropdownOpen(false);
                            } else {
                              setMunicipioId("");
                              setMunicipioSearchInput("");
                              setProcessoOutsideCity("");
                            }
                          }}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-[11px] font-medium text-amber-800">
                          Fora da Bahia / Outro Estado
                        </span>
                      </label>
                    </div>

                    {isProcessoOutsideBahia ? (
                      <div className="space-y-1.5">
                        <div className="p-2 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Globe className="h-3.5 w-3.5 text-amber-600" />
                            <span className="font-semibold">Demanda Interestadual (Fora da Bahia)</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] bg-white text-amber-800 border-amber-300">
                            Outro Estado / DF
                          </Badge>
                        </div>
                        <Input
                          placeholder="Informe a Cidade e UF (ex: Petrolina - PE, Aracaju - SE)"
                          value={processoOutsideCity}
                          onChange={(e) => {
                            setProcessoOutsideCity(e.target.value);
                            setMunicipioSearchInput(e.target.value ? `${e.target.value} (Fora da Bahia)` : "Fora da Bahia");
                          }}
                          className="text-xs"
                        />
                      </div>
                    ) : (
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="Pesquise o município da Bahia..."
                          value={municipioSearchInput}
                          onChange={(e) => {
                            setMunicipioSearchInput(e.target.value);
                            setMunicipioId("");
                            setIsMunicipioSearchDropdownOpen(true);
                          }}
                          onFocus={() => setIsMunicipioSearchDropdownOpen(true)}
                          className="pl-9 text-xs"
                          required={!isProcessoOutsideBahia}
                        />
                        {municipioSearchInput && (
                          <button
                            type="button"
                            onClick={() => {
                              setMunicipioId("");
                              setMunicipioSearchInput("");
                            }}
                            className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                          >
                            ✕
                          </button>
                        )}

                        {isMunicipioSearchDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-30 max-h-56 overflow-y-auto">
                            {/* Opção rápida Fora da Bahia */}
                            <div
                              onClick={() => {
                                setIsProcessoOutsideBahia(true);
                                setMunicipioId("fora-da-bahia");
                                setMunicipioSearchInput("Fora da Bahia");
                                setIsMunicipioSearchDropdownOpen(false);
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

                            {filteredProcessoMunicipios.length === 0 ? (
                              <div className="p-3 text-center text-slate-400 text-xs">
                                Nenhum município baiano encontrado.
                              </div>
                            ) : (
                              filteredProcessoMunicipios.map((mun) => (
                                <div
                                  key={mun.id}
                                  onClick={() => {
                                    setMunicipioId(mun.id);
                                    setMunicipioSearchInput(`${mun.name} - BA`);
                                    setIsMunicipioSearchDropdownOpen(false);
                                  }}
                                  className={`p-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0 text-xs flex items-center justify-between ${municipioId === mun.id ? "bg-emerald-50 text-emerald-900 font-semibold" : ""
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
                    <p className="text-[10px] text-slate-500 mt-1">
                      {isProcessoOutsideBahia ? "Paciente interestadual não vinculado a município baiano." : "Herdado do cadastro do paciente. Digite para alterar a cidade."}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Base Regional Vinculada & Equipe de Pareceres
                      </label>
                      {deducedUnit && !isProcessoOutsideBahia && (
                        <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          Vínculo Territorial Oficial
                        </span>
                      )}
                    </div>

                    {isProcessoOutsideBahia || municipioId === "fora-da-bahia" ? (
                      <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-semibold text-amber-900">
                            <Building className="h-4 w-4 text-amber-600" />
                            <span>Central de Pareceres - Salvador (Regulação Interestadual)</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] bg-white text-amber-800 border-amber-300">
                            Interestadual
                          </Badge>
                        </div>
                        <p className="text-[11px] text-amber-800 mt-1">
                          Processos de residentes fora da Bahia são regulados diretamente pela Central Estadual.
                        </p>
                      </div>
                    ) : deducedUnit ? (
                      <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200/90 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-bold text-slate-900">
                            <Building className="h-4 w-4 text-emerald-600" />
                            <span>{deducedUnit.name}</span>
                            <span className="text-slate-400 font-normal">•</span>
                            <span className="text-[11px] font-normal text-slate-600">
                              {selectedMunicipio?.macroregion || deducedUnit.macroregion}
                            </span>
                          </div>
                          <Badge className="bg-emerald-600 text-white text-[10px]">
                            Vinculada ao Município
                          </Badge>
                        </div>

                        {/* Relação Territorial e Equipe Responsável */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-emerald-100 text-[11px]">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Stethoscope className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                            <span className="font-medium">
                              RT: {selectedMunicipio?.responsible_pharmacist || deducedUnit.responsible_pharmacists?.[0]?.full_name || "Equipe Farmacêutica Regional"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600 sm:justify-end">
                            <Compass className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                            <span>{selectedMunicipio?.nrs_name || `Núcleo Regional`}</span>
                          </div>
                        </div>

                        {(deducedUnit.phone || deducedUnit.email) && (
                          <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-0.5 border-t border-emerald-50">
                            {deducedUnit.phone && <span>📞 {deducedUnit.phone}</span>}
                            {deducedUnit.email && <span className="truncate">✉️ {deducedUnit.email}</span>}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                        <Building className="h-4 w-4 text-slate-400" />
                        <span>Selecione o município de residência para vincular a Base Regional e Equipe responsável.</span>
                      </div>
                    )}
                    <p className="text-[10px] text-slate-500 mt-1">
                      {isProcessoOutsideBahia
                        ? "Processos fora da Bahia são regulados pela equipe central de pareceres."
                        : "Vínculo gerado automaticamente a partir do mapa territorial e equipes farmacêuticas da Bahia."}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Localizar Paciente por Nome, CPF ou Cartão SUS *
                </label>
                <div ref={patientRef} className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Digite o nome, CPF ou CNS do paciente para pesquisar... (Pressione Enter para consultar)"
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      setIsPatientDropdownOpen(true);
                    }}
                    onFocus={() => setIsPatientDropdownOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const cpfDigits = patientSearch.replace(/\D/g, "");
                        if (cpfDigits.length === 11) {
                          resetQuickPatientForm(formatCPF(patientSearch), "");
                          setIsQuickPatientModalOpen(true);
                          setIsPatientDropdownOpen(false);
                          handleSearchQuickCpf(cpfDigits);
                        } else if (filteredPatients.length === 1) {
                          handleSelectPatient(filteredPatients[0]);
                        }
                      }
                    }}
                    className="pl-9 text-xs"
                  />

                  {isPatientDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-30 max-h-60 overflow-y-auto">
                      {filteredPatients.length > 0 ? (
                        filteredPatients.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => handleSelectPatient(p)}
                            className="p-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0 text-xs"
                          >
                            <div className="font-medium text-slate-900 flex items-center justify-between">
                              <span>{p.full_name}</span>
                              <Badge variant="outline" className="text-[10px]">
                                {p.gender === "M" ? "M" : p.gender === "F" ? "F" : "N/I"}
                              </Badge>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {p.cpf_not_provided ? "CPF Não Informado" : `CPF: ${p.cpf}`} • Município: {p.municipality_name || "Bahia"}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-center space-y-2">
                          <p className="text-xs text-slate-500">
                            Nenhum paciente localizado na base local com este termo.
                          </p>
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            {patientSearch.replace(/\D/g, "").length === 11 ? (
                              <Button
                                type="button"
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center gap-1.5"
                                onClick={() => {
                                  const cpfDigits = patientSearch.replace(/\D/g, "");
                                  resetQuickPatientForm(formatCPF(patientSearch), "");
                                  setIsQuickPatientModalOpen(true);
                                  setIsPatientDropdownOpen(false);
                                  handleSearchQuickCpf(cpfDigits);
                                }}
                              >
                                <Search className="w-3.5 h-3.5" />
                                Consultar CPF na API Externa
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                onClick={() => {
                                  resetQuickPatientForm("", patientSearch);
                                  setIsQuickPatientModalOpen(true);
                                  setIsPatientDropdownOpen(false);
                                }}
                              >
                                <UserPlus className="w-3.5 h-3.5 mr-1" />
                                Cadastrar Novo Paciente
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ========================================================================= */}
        {/* SEÇÃO 3: FÁRMACO/SUBSTÂNCIA & DIAGNÓSTICO (CID-10) */}
        {/* ========================================================================= */}
        <Card>
          <CardHeader className="p-4 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Pill className="h-4 w-4 text-emerald-600" />
              3. Fármaco / Substância & Diagnóstico Clínico
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Cada par de fármaco e CID terá sua conclusão e fundamentação técnica individual na análise.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fármaco / Apresentação com Autocomplete idêntico ao de pacientes */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fármaco / Apresentação (Substância Ativa) *
                  </label>
                  <div ref={farmacoRef} className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Pesquise por fármaco ou substância ativa (4.000+ na base)..."
                      value={farmacoInput}
                      onChange={(e) => {
                        setFarmacoInput(e.target.value);
                        setIsFarmacoDropdownOpen(true);
                      }}
                      onFocus={() => setIsFarmacoDropdownOpen(true)}
                      className="pl-9 text-xs"
                    />

                    {isFarmacoDropdownOpen && filteredFarmacos.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-30 max-h-56 overflow-y-auto">
                        {filteredFarmacos.map((f) => (
                          <div
                            key={f.id}
                            onClick={() => {
                              setFarmacoInput(f.name);
                              setIsFarmacoDropdownOpen(false);
                            }}
                            className="p-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0 text-xs"
                          >
                            <div className="font-semibold text-slate-900 flex items-center justify-between gap-2">
                              <span>{f.name}</span>
                              {f.component && (
                                <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600 border-slate-200 shrink-0">
                                  {f.component}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Selecione no catálogo de 4.086 fármacos oficiais ou digite livremente.
                  </p>
                </div>

                {/* Diagnóstico Clínico (CID-10) com Autocomplete idêntico ao de pacientes */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Diagnóstico Clínico (CID-10) *
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cidNaoInformado}
                        onChange={(e) => {
                          setCidNaoInformado(e.target.checked);
                          if (e.target.checked) {
                            setCidInput("");
                            setSelectedCidId("");
                            setIsCidDropdownOpen(false);
                          }
                        }}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-[11px] font-medium text-amber-800">
                        CID Não Informado / Investigação
                      </span>
                    </label>
                  </div>

                  {cidNaoInformado ? (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800 font-mono flex items-center gap-2">
                      <Info className="h-3.5 w-3.5 text-amber-600" />
                      <span>N/I - Investigação clínica em andamento</span>
                    </div>
                  ) : (
                    <div ref={cidRef} className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Pesquise por código (ex: M05, G35) ou patologia..."
                        value={cidInput}
                        onChange={(e) => {
                          setCidInput(e.target.value);
                          setSelectedCidId("");
                          setIsCidDropdownOpen(true);
                        }}
                        onFocus={() => setIsCidDropdownOpen(true)}
                        className="pl-9 text-xs"
                      />

                      {isCidDropdownOpen && filteredCids.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-30 max-h-56 overflow-y-auto">
                          {filteredCids.map((c) => (
                            <div
                              key={c.id}
                              onClick={() => {
                                setSelectedCidId(c.id);
                                setCidInput(`${c.code} - ${c.description}`);
                                setIsCidDropdownOpen(false);
                              }}
                              className="p-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0 text-xs"
                            >
                              <div className="font-medium text-slate-900 flex items-center gap-2">
                                <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 font-mono text-[10px] shrink-0">
                                  {c.code}
                                </Badge>
                                <span className="truncate">{c.description}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">
                    {cidNaoInformado ? "Opção selecionada para demandas sem CID definitivo." : "Selecione pelo código internacional da doença ou digite a patologia."}
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddItem}
                  className="bg-slate-800 hover:bg-slate-900 text-white text-xs flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar Fármaco + CID à Demanda
                </Button>
              </div>
            </div>

            {/* Lista de Itens Adicionados */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Itens Solicitados na Demanda ({items.length})
              </label>

              {items.length === 0 ? (
                <div className="p-4 text-center border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs">
                  Nenhum fármaco adicionado ainda. Preencha os campos acima para incluir na autuação.
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((it) => (
                    <div
                      key={it.id}
                      className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-emerald-700 text-white text-[9px]">
                            Fármaco
                          </Badge>
                          <span className="font-semibold text-slate-900">
                            {it.farmaco_substancia || it.medication_name}
                          </span>
                          <span className="font-mono text-slate-600">
                            • CID: {it.cid_code} - {it.cid_description}
                          </span>
                          {it.cid_nao_informado && (
                            <Badge variant="outline" className="text-[9px] text-amber-700 bg-amber-50">
                              Investigação
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveItem(it.id)}
                        className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Rodapé / Ações */}
        <div className="flex items-center justify-between pt-2">
          <Link href="/atendimentos">
            <Button type="button" variant="ghost" size="sm" className="text-xs text-slate-600">
              Cancelar
            </Button>
          </Link>

          <Button
            type="submit"
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-6 flex items-center gap-2 shadow-sm"
          >
            <Send className="h-4 w-4" />
            {isSaving ? "Autuando Processo..." : "Criar Processo e Enviar para Parecer"}
          </Button>
        </div>
      </form>

      {/* ========================================================================= */}
      {/* MODAL: HISTÓRICO DE PROCESSOS ANTERIORES DO PACIENTE */}
      {/* ========================================================================= */}
      {isHistoryModalOpen && selectedPatient && (
        <Dialog
          open={true}
          onOpenChange={() => setIsHistoryModalOpen(false)}
          title={`Histórico Clínico: ${selectedPatient.full_name}`}
          description={`Processos e decisões já tomadas para o paciente (${patientPastProcessos.length} registros).`}
          maxWidth="lg"
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {patientPastProcessos.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                Nenhum processo anterior registrado para este paciente.
              </p>
            ) : (
              patientPastProcessos.map((proc) => (
                <div
                  key={proc.id}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{proc.numero_sei}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${proc.status === "concluido" || proc.status.startsWith("concluido_")
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : "bg-blue-100 text-blue-800 border-blue-300"
                          }`}
                      >
                        {proc.status}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Entrada: {proc.data_abertura}
                    </span>
                  </div>

                  <p className="text-slate-700 font-medium">{proc.assunto}</p>

                  {/* Itens do processo anterior */}
                  <div className="bg-white p-2.5 rounded border border-slate-200 space-y-1.5">
                    <span className="font-semibold text-[11px] text-slate-600 uppercase tracking-wider block">
                      Fármacos & Decisões Anteriores:
                    </span>
                    {proc.items.map((item, idx) => (
                      <div key={idx} className="flex items-start justify-between border-b border-slate-100 pb-1.5 last:border-b-0 last:pb-0">
                        <div>
                          <span className="font-medium text-slate-900">
                            {item.farmaco_substancia || item.medication_name}
                          </span>
                          <span className="text-slate-500 font-mono ml-1">
                            (CID: {item.cid_code} - {item.cid_description})
                          </span>
                          {item.justification && (
                            <p className="text-[11px] text-slate-600 italic mt-0.5">
                              Fundamentação: {item.justification}
                            </p>
                          )}
                        </div>
                        <Badge
                          className={`text-[9px] ${item.status === "deferido"
                            ? "bg-emerald-600 text-white"
                            : item.status === "indeferido"
                              ? "bg-rose-600 text-white"
                              : item.status === "em_exigencia"
                                ? "bg-amber-600 text-white"
                                : "bg-slate-500 text-white"
                            }`}
                        >
                          {item.status || "pendente"}
                        </Badge>
                      </div>
                    ))}
                  </div>

                  {proc.parecer?.active_version && (
                    <div className="p-2 bg-emerald-50/60 rounded border border-emerald-100 text-[11px] text-emerald-900">
                      <strong>Parecer Final:</strong> {proc.parecer.active_version.tipo_parecer_title} ({proc.parecer.active_version.regulatory_effect})
                    </div>
                  )}
                </div>
              ))
            )}

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-xs"
              >
                Fechar Consulta
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CADASTRO RÁPIDO DE PACIENTE INLINE */}
      {/* ========================================================================= */}
      {isQuickPatientModalOpen && (
        <Dialog
          open={true}
          onOpenChange={() => {
            setIsQuickPatientModalOpen(false);
            resetQuickPatientForm();
          }}
          title="Cadastro Rápido de Paciente"
          description="Informe os dados básicos para cadastro imediato e vinculação ao processo."
          maxWidth="md"
        >
          <div className="space-y-4">
            <form onSubmit={handleSaveQuickPatient} className="space-y-3">
              {/* 1. CPF (Prioritário no topo para consulta e autopreenchimento com Enter) */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 pb-2">
                    <span>CPF {newPatientCpfNotProvided ? "(Dispensado)" : "*"}</span>
                    <span className="text-[10px] font-normal text-slate-500">(Pressione Enter para consultar)</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPatientCpfNotProvided}
                      onChange={(e) => {
                        setNewPatientCpfNotProvided(e.target.checked);
                        if (e.target.checked) setNewPatientCpf("");
                        setQuickCpfFeedback(null);
                        setNewPatientAfsesabStatus(null);
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
                    value={newPatientCpf}
                    onChange={(e) => setNewPatientCpf(formatCPF(e.target.value))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (!newPatientCpfNotProvided && newPatientCpf.replace(/\D/g, "").length === 11) {
                          handleSearchQuickCpf(newPatientCpf);
                        }
                      }
                    }}
                    placeholder={newPatientCpfNotProvided ? "CPF não informado" : "000.000.000-00 (Enter para buscar)"}
                    disabled={newPatientCpfNotProvided}
                    required={!newPatientCpfNotProvided}
                    className={`text-xs font-mono flex-1 ${newPatientCpfNotProvided ? "bg-slate-100 text-slate-400" : ""
                      }`}
                  />
                  {!newPatientCpfNotProvided && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isSearchingQuickCpf || newPatientCpf.replace(/\D/g, "").length !== 11}
                      onClick={() => handleSearchQuickCpf(newPatientCpf)}
                      className="text-xs border-emerald-400 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 px-3 flex items-center gap-1.5 flex-shrink-0 font-medium"
                      title="Pressione Enter ou clique para pesquisar na API da SESAB"
                    >
                      {isSearchingQuickCpf ? (
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

                {quickCpfFeedback && (
                  <div
                    className={`p-2.5 rounded text-xs space-y-1.5 ${quickCpfFeedback.type === "success"
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-900 mt-2"
                      : quickCpfFeedback.type === "info"
                        ? "bg-blue-50 border border-blue-200 text-blue-900 mt-2"
                        : "bg-rose-50 border border-rose-200 text-rose-800 mt-2"
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      {quickCpfFeedback.type === "success" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : quickCpfFeedback.type === "info" ? (
                        <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      )}
                      <span className="font-medium">{quickCpfFeedback.message}</span>
                    </div>
                    {newPatientAfsesabStatus && (
                      <div className="flex items-center gap-2 pt-1 border-t border-emerald-200/60 text-[11px]">
                        <span className="font-semibold text-slate-700">Situação no AFSESAB:</span>
                        {newPatientAfsesabStatus === "paciente_existe" ? (
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
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
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
                    value={newPatientGender}
                    onChange={(e) =>
                      setNewPatientGender(
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
                    value={newPatientCns}
                    onChange={(e) => setNewPatientCns(e.target.value)}
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
                    value={newPatientBirthDate}
                    onChange={(e) => setNewPatientBirthDate(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone de Contato
                  </label>
                  <Input
                    value={newPatientPhone}
                    onChange={(e) => setNewPatientPhone(e.target.value)}
                    placeholder="(71) 98888-0000"
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Bairro e CEP da API */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bairro (end_descricao_barrio)
                  </label>
                  <Input
                    value={newPatientBairro}
                    onChange={(e) => setNewPatientBairro(e.target.value)}
                    placeholder="Ex: Brotas, Pituba"
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CEP (end_numero_cep)
                  </label>
                  <Input
                    value={newPatientCep}
                    onChange={(e) => setNewPatientCep(e.target.value)}
                    placeholder="00000-000"
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              {/* Município de Residência com Autocomplete & Opção Fora da Bahia */}
              <div ref={quickPatientMunicipioRef} className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Município de Residência
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPatientIsOutsideBahia}
                      onChange={(e) => {
                        setNewPatientIsOutsideBahia(e.target.checked);
                        if (e.target.checked) {
                          setNewPatientMunicipioId("");
                          setNewPatientMunicipioSearch("");
                          setIsNewPatientMunicipioDropdownOpen(false);
                        }
                      }}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-medium text-amber-800">
                      Fora da Bahia / Outro Estado
                    </span>
                  </label>
                </div>

                {newPatientIsOutsideBahia ? (
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
                      value={newPatientOutsideCity}
                      onChange={(e) => setNewPatientOutsideCity(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Pesquise a cidade da Bahia..."
                      value={newPatientMunicipioSearch}
                      onChange={(e) => {
                        setNewPatientMunicipioSearch(e.target.value);
                        setNewPatientMunicipioId("");
                        setIsNewPatientMunicipioDropdownOpen(true);
                      }}
                      onFocus={() => setIsNewPatientMunicipioDropdownOpen(true)}
                      className="pl-9 text-xs"
                    />
                    {newPatientMunicipioSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewPatientMunicipioId("");
                          setNewPatientMunicipioSearch("");
                        }}
                        className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                      >
                        ✕
                      </button>
                    )}

                    {isNewPatientMunicipioDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-30 max-h-56 overflow-y-auto">
                        {/* Opção rápida Fora da Bahia */}
                        <div
                          onClick={() => {
                            setNewPatientIsOutsideBahia(true);
                            setIsNewPatientMunicipioDropdownOpen(false);
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

                        {filteredNewPatientMunicipios.length === 0 ? (
                          <div className="p-3 text-center text-slate-400 text-xs">
                            Nenhum município baiano encontrado.
                          </div>
                        ) : (
                          filteredNewPatientMunicipios.map((mun) => (
                            <div
                              key={mun.id}
                              onClick={() => {
                                setNewPatientMunicipioId(mun.id);
                                setNewPatientMunicipioSearch(`${mun.name} - BA`);
                                setIsNewPatientMunicipioDropdownOpen(false);
                              }}
                              className={`p-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0 text-xs flex items-center justify-between ${newPatientMunicipioId === mun.id ? "bg-emerald-50 text-emerald-900 font-semibold" : ""
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
                {!newPatientIsOutsideBahia && newPatientDeducedMun && (
                  <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-800">
                      <Building className="h-3.5 w-3.5 text-emerald-600" />
                      <span>
                        Base Regional: <strong>{newPatientDeducedUnit?.name || `BRS ${newPatientDeducedMun.brs_name || ""}`}</strong>
                      </span>
                    </div>
                    {newPatientDeducedMun.responsible_pharmacist && (
                      <Badge variant="outline" className="text-[10px] bg-white text-emerald-800 border-emerald-300">
                        {newPatientDeducedMun.responsible_pharmacist}
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
                    setIsQuickPatientModalOpen(false);
                    resetQuickPatientForm();
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
                  {isSavingPatient ? "Salvando..." : "Salvar e Vincular"}
                </Button>
              </div>
            </form>
          </div>
        </Dialog>
      )}
    </div>
  );
}
