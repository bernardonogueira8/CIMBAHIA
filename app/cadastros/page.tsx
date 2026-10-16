"use client";

import React, { useState, useMemo } from "react";
import {
  FolderOpen,
  PlusCircle,
  Search,
  Pill,
  BookOpen,
  CheckCircle,
  Globe,
  Lock,
  UploadCloud,
  FileSpreadsheet,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Download,
  AlertCircle,
  FileText,
  Database,
  ArrowRight,
  ExternalLink,
  Layers,
  Sparkles,
  Pencil,
  EyeOff,
  Eye,
  RotateCcw,
  Check,
  AlertTriangle,
} from "lucide-react";
import { useApp } from "@/lib/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { CID, Medication, SigtapCompetencyResult } from "@/lib/types";
import {
  processSigtapCompetency,
  generateSupabaseSigtapMigrationSQL,
} from "@/lib/sigtap-parser";

export default function CadastrosPage() {
  const {
    cids,
    medications,
    currentUser,
    canManageCatalogs,
    addCID,
    updateCID,
    toggleCIDActive,
    addMedication,
    updateMedication,
    toggleMedicationActive,
    importSIGTAPData,
  } = useApp();

  const isAdmin = currentUser?.role === "admin";

  const [activeTab, setActiveTab] = useState<"medications" | "cids">("medications");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Modais de Cadastro
  const [isMedModalOpen, setIsMedModalOpen] = useState(false);
  const [isCidModalOpen, setIsCidModalOpen] = useState(false);
  const [isSigtapModalOpen, setIsSigtapModalOpen] = useState(false);

  // Estados Edição Medicamento
  const [isEditMedModalOpen, setIsEditMedModalOpen] = useState(false);
  const [editMedId, setEditMedId] = useState("");
  const [editMedName, setEditMedName] = useState("");
  const [editMedForm, setEditMedForm] = useState("");
  const [editMedSigtapCode, setEditMedSigtapCode] = useState("");
  const [editMedPcdts, setEditMedPcdts] = useState("");
  const [editMedActive, setEditMedActive] = useState(true);
  const [editMedLoading, setEditMedLoading] = useState(false);
  const [editMedError, setEditMedError] = useState("");
  const [editMedSuccess, setEditMedSuccess] = useState("");

  // Estados Edição CID / PCDT
  const [isEditCidModalOpen, setIsEditCidModalOpen] = useState(false);
  const [editCidId, setEditCidId] = useState("");
  const [editCidCode, setEditCidCode] = useState("");
  const [editCidDesc, setEditCidDesc] = useState("");
  const [editCidActive, setEditCidActive] = useState(true);
  const [editCidLoading, setEditCidLoading] = useState(false);
  const [editCidError, setEditCidError] = useState("");
  const [editCidSuccess, setEditCidSuccess] = useState("");

  // Estado Modal Confirmação Soft Delete
  const [confirmSoftDeleteModal, setConfirmSoftDeleteModal] = useState<{
    open: boolean;
    type: "medication" | "cid";
    id: string;
    title: string;
    targetActiveState: boolean;
  }>({
    open: false,
    type: "medication",
    id: "",
    title: "",
    targetActiveState: false,
  });

  // Sub-abas do Modal de Importação SIGTAP
  const [importMode, setImportMode] = useState<"datasus_files" | "csv_quick" | "manual_guide">(
    "datasus_files"
  );

  // Estados formulário Medicamento
  const [medName, setMedName] = useState("");
  const [medForm, setMedForm] = useState("");
  const [medSigtapCode, setMedSigtapCode] = useState("");

  // Estados formulário CID
  const [cidCode, setCidCode] = useState("");
  const [cidDesc, setCidDesc] = useState("");

  // Estados Importação SIGTAP Oficial DataSUS
  const [fileProcContent, setFileProcContent] = useState<string>("");
  const [fileProcName, setFileProcName] = useState<string>("");
  const [fileRlContent, setFileRlContent] = useState<string>("");
  const [fileRlName, setFileRlName] = useState<string>("");
  const [fileCidContent, setFileCidContent] = useState<string>("");
  const [fileCidName, setFileCidName] = useState<string>("");

  const [competencyResult, setCompetencyResult] = useState<SigtapCompetencyResult | null>(null);

  // Estados Importação SIGTAP CSV Rápido
  const [sigtapInputText, setSigtapInputText] = useState("");
  const [importStatus, setImportStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  // Contagens para filtros
  const activeMedsCount = useMemo(() => medications.filter((m) => m.active !== false).length, [medications]);
  const inactiveMedsCount = useMemo(() => medications.filter((m) => m.active === false).length, [medications]);
  const activeCidsCount = useMemo(() => cids.filter((c) => c.active !== false).length, [cids]);
  const inactiveCidsCount = useMemo(() => cids.filter((c) => c.active === false).length, [cids]);

  // Filtragem de medicamentos (Exclusivo CEAF + Status)
  const filteredMeds = useMemo(() => {
    return medications.filter((m) => {
      if (statusFilter === "active" && m.active === false) return false;
      if (statusFilter === "inactive" && m.active !== false) return false;

      const term = searchTerm.toLowerCase();
      return (
        m.name.toLowerCase().includes(term) ||
        (m.sigtap_code && m.sigtap_code.toLowerCase().includes(term)) ||
        (m.pharmaceutical_form && m.pharmaceutical_form.toLowerCase().includes(term))
      );
    });
  }, [medications, searchTerm, statusFilter]);

  // Filtragem de CIDs (PCDTs + Status)
  const filteredCids = useMemo(() => {
    return cids.filter((c) => {
      if (statusFilter === "active" && c.active === false) return false;
      if (statusFilter === "inactive" && c.active !== false) return false;

      const term = searchTerm.toLowerCase();
      return (
        c.code.toLowerCase().includes(term) ||
        c.description.toLowerCase().includes(term)
      );
    });
  }, [cids, searchTerm, statusFilter]);

  const handleSaveMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!medName.trim()) return;

    try {
      await addMedication({
        name: medName.trim(),
        sigtap_code: medSigtapCode.trim() || undefined,
        pharmaceutical_form: medForm.trim() || undefined,
        component: "CEAF", // Exclusivamente CEAF
        active: true,
      });

      setIsMedModalOpen(false);
      setMedName("");
      setMedForm("");
      setMedSigtapCode("");
    } catch (err: any) {
      alert(err.message || "Erro ao salvar medicamento.");
    }
  };

  const handleSaveCID = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!cidCode.trim() || !cidDesc.trim()) return;

    try {
      await addCID({
        code: cidCode.trim().toUpperCase(),
        description: cidDesc.trim(),
        active: true,
      });

      setIsCidModalOpen(false);
      setCidCode("");
      setCidDesc("");
    } catch (err: any) {
      alert(err.message || "Erro ao salvar CID-10.");
    }
  };

  // Handlers Edição Medicamento
  const handleOpenEditMed = (med: Medication) => {
    setEditMedId(med.id);
    setEditMedName(med.name);
    setEditMedForm(med.pharmaceutical_form || "");
    setEditMedSigtapCode(med.sigtap_code || "");
    setEditMedPcdts((med.compatible_cid_codes || []).join(", "));
    setEditMedActive(med.active !== false);
    setEditMedError("");
    setEditMedSuccess("");
    setIsEditMedModalOpen(true);
  };

  const handleUpdateMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !editMedId) return;
    if (!editMedName.trim()) {
      setEditMedError("A denominação do fármaco / concentração é obrigatória.");
      return;
    }

    setEditMedLoading(true);
    setEditMedError("");
    setEditMedSuccess("");

    try {
      const pcdtsList = editMedPcdts
        .split(",")
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean);

      const res = await updateMedication(editMedId, {
        name: editMedName.trim(),
        sigtap_code: editMedSigtapCode.trim() || undefined,
        pharmaceutical_form: editMedForm.trim() || undefined,
        active: editMedActive,
        compatible_cid_codes: pcdtsList,
      });

      if (!res.success) {
        setEditMedError(res.error || "Erro ao atualizar medicamento.");
      } else {
        setEditMedSuccess("Medicamento atualizado com sucesso no Supabase!");
        setTimeout(() => {
          setIsEditMedModalOpen(false);
          setEditMedSuccess("");
        }, 600);
      }
    } catch (err: any) {
      setEditMedError(err.message || "Erro ao atualizar medicamento.");
    } finally {
      setEditMedLoading(false);
    }
  };

  // Handlers Edição CID-10 / PCDT
  const handleOpenEditCid = (cid: CID) => {
    setEditCidId(cid.id);
    setEditCidCode(cid.code);
    setEditCidDesc(cid.description);
    setEditCidActive(cid.active !== false);
    setEditCidError("");
    setEditCidSuccess("");
    setIsEditCidModalOpen(true);
  };

  const handleUpdateCid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !editCidId) return;
    if (!editCidCode.trim() || !editCidDesc.trim()) {
      setEditCidError("Código CID-10 e descrição oficial são obrigatórios.");
      return;
    }

    setEditCidLoading(true);
    setEditCidError("");
    setEditCidSuccess("");

    try {
      const res = await updateCID(editCidId, {
        code: editCidCode.trim().toUpperCase(),
        description: editCidDesc.trim(),
        active: editCidActive,
      });

      if (!res.success) {
        setEditCidError(res.error || "Erro ao atualizar CID-10.");
      } else {
        setEditCidSuccess("Diagnóstico PCDT / CID-10 atualizado com sucesso no Supabase!");
        setTimeout(() => {
          setIsEditCidModalOpen(false);
          setEditCidSuccess("");
        }, 600);
      }
    } catch (err: any) {
      setEditCidError(err.message || "Erro ao atualizar CID-10.");
    } finally {
      setEditCidLoading(false);
    }
  };

  // Confirmação de Soft Delete (Inativação / Reativação sem Hard Delete)
  const handleExecuteSoftDelete = async () => {
    const { type, id, targetActiveState } = confirmSoftDeleteModal;
    if (!id) return;

    try {
      if (type === "medication") {
        await toggleMedicationActive(id, targetActiveState);
      } else {
        await toggleCIDActive(id, targetActiveState);
      }
      setConfirmSoftDeleteModal((prev) => ({ ...prev, open: false }));
    } catch (err: any) {
      alert("Erro ao alterar status operacional: " + (err.message || "Falha"));
    }
  };

  // Leitura de arquivo individual para o processador DataSUS
  const handleReadTextFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "proc" | "rl" | "cid"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = (evt.target?.result as string) || "";
      if (target === "proc") {
        setFileProcContent(text);
        setFileProcName(file.name);
      } else if (target === "rl") {
        setFileRlContent(text);
        setFileRlName(file.name);
      } else if (target === "cid") {
        setFileCidContent(text);
        setFileCidName(file.name);
      }
      setCompetencyResult(null);
      setImportStatus({ type: null, message: "" });
    };
    // Tenta ler com ISO-8859-1 (padrão DataSUS)
    reader.readAsText(file, "ISO-8859-1");
  };

  // Analisar arquivos oficiais DataSUS
  const handleAnalyzeDataSUSFiles = () => {
    if (!fileProcContent) {
      setImportStatus({
        type: "error",
        message: "Carregue o arquivo tb_procedimento.txt.",
      });
      return;
    }
    if (!fileRlContent) {
      setImportStatus({
        type: "error",
        message: "Carregue o arquivo rl_procedimento_cid.txt.",
      });
      return;
    }
    if (!fileCidContent) {
      setImportStatus({
        type: "error",
        message: "Carregue o arquivo tb_cid.txt.",
      });
      return;
    }

    try {
      const result = processSigtapCompetency(fileProcContent, fileRlContent, fileCidContent);
      setCompetencyResult(result);
      setImportStatus({
        type: "success",
        message: `Análise concluída com sucesso! Competência: ${result.competency} · ${result.totalCeafProcedures} medicamentos CEAF e ${result.totalCids} CIDs vinculados identificados.`,
      });
    } catch (err: any) {
      setImportStatus({
        type: "error",
        message: err.message || "Falha ao processar arquivos do DataSUS.",
      });
    }
  };

  // Incorporar resultado DataSUS no catálogo do PharmaCare
  const handleCommitDataSUS = () => {
    if (!competencyResult) return;
    try {
      const cidsToImport = competencyResult.cids.map((c) => ({
        code: c.code,
        description: c.description,
        active: true,
      }));

      const res = importSIGTAPData(cidsToImport, competencyResult.medications);
      setImportStatus({
        type: "success",
        message: `Catálogo atualizado com sucesso! ${res.medsAdded} novos medicamentos do CEAF e ${res.cidsAdded} novos CIDs de PCDTs incorporados.`,
      });
    } catch (err: any) {
      setImportStatus({
        type: "error",
        message: err.message || "Erro ao incorporar dados.",
      });
    }
  };

  // Baixar script de migração SQL para o Supabase
  const handleDownloadSQLMigration = () => {
    if (!competencyResult) return;
    const sql = generateSupabaseSigtapMigrationSQL(competencyResult);
    const blob = new Blob([sql], { type: "text/sql;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeComp = competencyResult.competency.replace(/\D/g, "") || "atual";
    link.setAttribute("download", `sigtap_competencia_${safeComp}.sql`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#171A20] tracking-tight">
              Catálogo Oficial do CEAF / SIGTAP
            </h1>
            <Badge variant="outline" className="text-xs">
              <Globe className="w-3 h-3 mr-1 text-emerald-600" />
              Exclusivo Componente Especializado
            </Badge>
          </div>
          <p className="text-xs text-[#5C5E62] mt-0.5">
            Banco oficial de medicamentos biológicos/alto custo e diagnósticos CID-10 dos Protocolos Clínicos (PCDTs).
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setImportStatus({ type: null, message: "" });
                  setIsSigtapModalOpen(true);
                }}
                className="border-[#D1D5DB] text-[#171A20] hover:bg-[#F4F4F6]"
              >
                <UploadCloud className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                Importar SIGTAP (Lote)
              </Button>

              {activeTab === "medications" ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsMedModalOpen(true)}
                  className="bg-[#E82127] hover:bg-[#C91A20] text-white"
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                  Cadastrar Medicamento
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsCidModalOpen(true)}
                  className="bg-[#E82127] hover:bg-[#C91A20] text-white"
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                  Cadastrar CID-10
                </Button>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-[#393C41] text-[#5C5E62] py-1 px-2.5">
                <Lock className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                Cadastro restrito a Administradores
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Role Notice Banner */}
      {!isAdmin ? (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 flex items-start gap-2.5 shadow-xs">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-amber-950">
              Perfil Atual: Farmacêutico ({currentUser?.full_name || "Usuário"}) · Modo Consulta.
            </span>
            <span className="block text-amber-800 mt-0.5">
              O catálogo de medicamentos e CIDs do CEAF (SIGTAP) é gerenciado centralmente pelo <strong>Administrador do Sistema</strong> para assegurar conformidade com os PCDTs estaduais. Você tem permissão de leitura total para selecionar diagnósticos e fármacos nos atendimentos clínicos.
            </span>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-900 flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold text-emerald-950">
                Perfil Atual: Administrador ({currentUser?.full_name || "Administrador"}) · Gestão Ativa de Catálogo.
              </span>
              <span className="block text-emerald-800 mt-0.5">
                Você tem permissão para cadastrar medicamentos, CIDs e realizar a incorporação em lote de arquivos da tabela SIGTAP do DataSUS para todo o estado.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-900 bg-emerald-100/90 px-3 py-1.5 rounded border border-emerald-300 shadow-xs shrink-0">
            <Database className="w-3.5 h-3.5 text-emerald-700" />
            <span className="font-semibold">Catálogo Sincronizado com Supabase</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[#E5E7EB] space-x-6">
        <button
          onClick={() => {
            setActiveTab("medications");
            setSearchTerm("");
          }}
          className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "medications"
              ? "border-[#171A20] text-[#171A20]"
              : "border-transparent text-[#5C5E62] hover:text-[#171A20]"
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>Medicamentos Especializados (CEAF)</span>
          <Badge variant="neutral">{medications.length}</Badge>
        </button>

        <button
          onClick={() => {
            setActiveTab("cids");
            setSearchTerm("");
          }}
          className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "cids"
              ? "border-[#171A20] text-[#171A20]"
              : "border-transparent text-[#5C5E62] hover:text-[#171A20]"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Diagnósticos PCDT (CID-10)</span>
          <Badge variant="neutral">{cids.length}</Badge>
        </button>
      </div>

      {/* Search Input & Status Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Input
            placeholder={
              activeTab === "medications"
                ? "Filtrar por fármaco, dosagem ou código SIGTAP..."
                : "Filtrar por código (ex: G35, K50) ou descrição da patologia..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-2.5 pointer-events-none" />
        </div>

        {/* Filtros de Status Operacional (Soft Delete) */}
        <div className="flex items-center gap-1 bg-[#F4F4F6] p-1 rounded-md border border-[#E5E7EB] text-xs shrink-0">
          <span className="text-[11px] font-medium text-[#5C5E62] px-1.5">Status:</span>
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              statusFilter === "all"
                ? "bg-white text-[#171A20] shadow-2xs font-semibold"
                : "text-[#5C5E62] hover:text-[#171A20]"
            }`}
          >
            Todos ({activeTab === "medications" ? medications.length : cids.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              statusFilter === "active"
                ? "bg-white text-emerald-800 shadow-2xs font-semibold"
                : "text-[#5C5E62] hover:text-[#171A20]"
            }`}
          >
            Ativos ({activeTab === "medications" ? activeMedsCount : activeCidsCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("inactive")}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              statusFilter === "inactive"
                ? "bg-white text-amber-800 shadow-2xs font-semibold"
                : "text-[#5C5E62] hover:text-[#171A20]"
            }`}
          >
            Inativos ({activeTab === "medications" ? inactiveMedsCount : inactiveCidsCount})
          </button>
        </div>
      </div>

      {/* Tabela de Medicamentos */}
      {activeTab === "medications" && (
        <Card className="border-[#E5E7EB] shadow-xs">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#171A20] text-white border-b border-[#282C34]">
                    <th className="py-2.5 px-4 font-semibold w-28">Código SIGTAP</th>
                    <th className="py-2.5 px-4 font-semibold">Fármaco / Concentração (DCB Oficial)</th>
                    <th className="py-2.5 px-4 font-semibold">Forma Farmacêutica</th>
                    <th className="py-2.5 px-4 font-semibold">PCDTs Autorizados (rl_procedimento_cid)</th>
                    <th className="py-2.5 px-4 font-semibold text-center w-24">Componente</th>
                    <th className="py-2.5 px-4 font-semibold text-center w-20">Status</th>
                    <th className="py-2.5 px-4 font-semibold text-right w-36">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] bg-white">
                  {filteredMeds.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-xs text-[#5C5E62]">
                        Nenhum medicamento localizado com os filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredMeds.map((med) => (
                      <tr
                        key={med.id}
                        className={`hover:bg-[#F9FAFB] transition-colors ${
                          med.active === false ? "bg-neutral-50/60 opacity-80" : ""
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-semibold text-[#171A20]">
                          {med.sigtap_code ? (
                            <span className="bg-[#F4F4F6] px-2 py-0.5 rounded border border-[#E5E7EB] text-[11px]">
                              {med.sigtap_code}
                            </span>
                          ) : (
                            <span className="text-[#9CA3AF] text-[10px] italic">0604... (PCDT)</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#171A20]">
                          <div className="flex items-center gap-1.5">
                            <span>{med.name}</span>
                            {med.active === false && (
                              <span className="text-[10px] text-amber-700 font-medium bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                Inativo
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[#5C5E62]">
                          {med.pharmaceutical_form || "Forma farmacêutica padronizada"}
                        </td>
                        <td className="py-3 px-4 text-[#5C5E62]">
                          {med.compatible_cid_codes && med.compatible_cid_codes.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {med.compatible_cid_codes.slice(0, 4).map((cid) => (
                                <span
                                  key={cid}
                                  className="font-mono text-[10px] bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.2 rounded"
                                >
                                  {cid}
                                </span>
                              ))}
                              {med.compatible_cid_codes.length > 4 && (
                                <span className="text-[10px] text-[#5C5E62] self-center">
                                  +{med.compatible_cid_codes.length - 4} CIDs
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-[#9CA3AF] italic">PCDT Geral CEAF</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-mono text-[10px] font-bold bg-[#F4F4F6] text-[#171A20] px-2 py-0.5 rounded border border-[#E5E7EB]">
                            CEAF (06.04)
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {med.active !== false ? (
                            <Badge variant="success">Ativo</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[#5C5E62] border-[#D1D5DB] bg-[#F4F4F6]">
                              Inativo
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditMed(med)}
                              disabled={!isAdmin}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-[#171A20] bg-white hover:bg-[#F4F4F6] border border-[#E5E7EB] rounded shadow-2xs transition-colors disabled:opacity-40"
                              title={isAdmin ? "Editar medicamento e PCDTs" : "Apenas administradores podem editar"}
                            >
                              <Pencil className="w-3 h-3 text-[#5C5E62]" />
                              <span>Editar</span>
                            </button>

                            {isAdmin && (
                              med.active !== false ? (
                                <button
                                  onClick={() =>
                                    setConfirmSoftDeleteModal({
                                      open: true,
                                      type: "medication",
                                      id: med.id,
                                      title: med.name,
                                      targetActiveState: false,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 rounded shadow-2xs transition-colors"
                                  title="Inativar medicamento (Soft Delete)"
                                >
                                  <EyeOff className="w-3 h-3 text-amber-600" />
                                  <span>Inativar</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    setConfirmSoftDeleteModal({
                                      open: true,
                                      type: "medication",
                                      id: med.id,
                                      title: med.name,
                                      targetActiveState: true,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded shadow-2xs transition-colors"
                                  title="Reativar medicamento no catálogo"
                                >
                                  <RotateCcw className="w-3 h-3 text-emerald-600" />
                                  <span>Reativar</span>
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de CIDs */}
      {activeTab === "cids" && (
        <Card className="border-[#E5E7EB] shadow-xs">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#171A20] text-white border-b border-[#282C34]">
                    <th className="py-2.5 px-4 font-semibold w-28">Código CID-10</th>
                    <th className="py-2.5 px-4 font-semibold">Descrição Oficial da Patologia (PCDT)</th>
                    <th className="py-2.5 px-4 font-semibold text-center w-28">Protocolo</th>
                    <th className="py-2.5 px-4 font-semibold text-center w-20">Status</th>
                    <th className="py-2.5 px-4 font-semibold text-right w-36">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] bg-white">
                  {filteredCids.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-xs text-[#5C5E62]">
                        Nenhum CID-10 localizado com os filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredCids.map((cid) => (
                      <tr
                        key={cid.id}
                        className={`hover:bg-[#F9FAFB] transition-colors ${
                          cid.active === false ? "bg-neutral-50/60 opacity-80" : ""
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-[#171A20]">
                          <span className="bg-[#F4F4F6] px-2 py-0.5 rounded border border-[#E5E7EB]">
                            {cid.code}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#171A20] font-medium">
                          <div className="flex items-center gap-1.5">
                            <span>{cid.description}</span>
                            {cid.active === false && (
                              <span className="text-[10px] text-amber-700 font-medium bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                Inativo
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="outline" className="text-[10px]">
                            CEAF / PCDT
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {cid.active !== false ? (
                            <Badge variant="success">Ativo</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[#5C5E62] border-[#D1D5DB] bg-[#F4F4F6]">
                              Inativo
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditCid(cid)}
                              disabled={!isAdmin}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-[#171A20] bg-white hover:bg-[#F4F4F6] border border-[#E5E7EB] rounded shadow-2xs transition-colors disabled:opacity-40"
                              title={isAdmin ? "Editar diagnóstico e PCDT" : "Apenas administradores podem editar"}
                            >
                              <Pencil className="w-3 h-3 text-[#5C5E62]" />
                              <span>Editar</span>
                            </button>

                            {isAdmin && (
                              cid.active !== false ? (
                                <button
                                  onClick={() =>
                                    setConfirmSoftDeleteModal({
                                      open: true,
                                      type: "cid",
                                      id: cid.id,
                                      title: `${cid.code} - ${cid.description}`,
                                      targetActiveState: false,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 rounded shadow-2xs transition-colors"
                                  title="Inativar CID-10 (Soft Delete)"
                                >
                                  <EyeOff className="w-3 h-3 text-amber-600" />
                                  <span>Inativar</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    setConfirmSoftDeleteModal({
                                      open: true,
                                      type: "cid",
                                      id: cid.id,
                                      title: `${cid.code} - ${cid.description}`,
                                      targetActiveState: true,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded shadow-2xs transition-colors"
                                  title="Reativar CID-10 no catálogo"
                                >
                                  <RotateCcw className="w-3 h-3 text-emerald-600" />
                                  <span>Reativar</span>
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal Novo Medicamento (Apenas Admin) */}
      <Dialog
        open={isMedModalOpen}
        onOpenChange={setIsMedModalOpen}
        title="Cadastrar Medicamento no CEAF (SIGTAP)"
        description="Adicione um fármaco especializado de alto custo ao catálogo estadual compartilhado."
      >
        <form onSubmit={handleSaveMedication} className="space-y-4">
          <Input
            label="Código do Procedimento SIGTAP (10 dígitos)"
            placeholder="Ex: 0604380014 (Grupo 06, Subgrupo 04)"
            value={medSigtapCode}
            onChange={(e) => setMedSigtapCode(e.target.value)}
          />

          <Input
            label="Denominação Comum Brasileira (DCB) / Concentração *"
            placeholder="Ex: Ustequinumabe 45mg/0,5mL ou Baricitinibe 4mg"
            value={medName}
            onChange={(e) => setMedName(e.target.value)}
            required
          />

          <Input
            label="Forma Farmacêutica"
            placeholder="Ex: Solução Injetável em frasco-ampola ou Comprimido Revestido"
            value={medForm}
            onChange={(e) => setMedForm(e.target.value)}
          />

          <div className="p-3 bg-[#F4F4F6] rounded border border-[#E5E7EB]">
            <span className="block text-xs font-semibold text-[#171A20]">
              Componente da Assistência Farmacêutica:
            </span>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="default">CEAF (Componente Especializado)</Badge>
              <span className="text-[11px] text-[#5C5E62]">
                Fixado obrigatoriamente para medicamentos de alto custo.
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsMedModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm" className="bg-[#E82127] hover:bg-[#C91A20] text-white">
              Salvar Medicamento
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal Novo CID (Apenas Admin) */}
      <Dialog
        open={isCidModalOpen}
        onOpenChange={setIsCidModalOpen}
        title="Cadastrar CID-10 (Protocolo CEAF)"
        description="Adicione uma patologia com Protocolo Clínico (PCDT) ativo."
      >
        <form onSubmit={handleSaveCID} className="space-y-4">
          <Input
            label="Código CID-10 *"
            placeholder="Ex: M05.8 ou G35"
            value={cidCode}
            onChange={(e) => setCidCode(e.target.value.toUpperCase())}
            required
          />

          <Input
            label="Descrição do Diagnóstico *"
            placeholder="Ex: Esclerose múltipla ou Artrite reumatoide"
            value={cidDesc}
            onChange={(e) => setCidDesc(e.target.value)}
            required
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCidModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm" className="bg-[#E82127] hover:bg-[#C91A20] text-white">
              Salvar CID-10
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal Editar Medicamento (Apenas Admin) */}
      <Dialog
        open={isEditMedModalOpen}
        onOpenChange={setIsEditMedModalOpen}
        title="Editar Medicamento do CEAF / SIGTAP"
        description="Atualize as informações cadastrais, código de procedimento ou CIDs autorizados no PCDT."
      >
        <form onSubmit={handleUpdateMedication} className="space-y-4">
          <Input
            label="Código do Procedimento SIGTAP (10 dígitos)"
            placeholder="Ex: 0604380014"
            value={editMedSigtapCode}
            onChange={(e) => setEditMedSigtapCode(e.target.value)}
          />

          <Input
            label="Denominação Comum Brasileira (DCB) / Concentração *"
            placeholder="Ex: Adalimumabe 40mg/0,8mL"
            value={editMedName}
            onChange={(e) => setEditMedName(e.target.value)}
            required
          />

          <Input
            label="Forma Farmacêutica"
            placeholder="Ex: Solução Injetável em seringa preenchida"
            value={editMedForm}
            onChange={(e) => setEditMedForm(e.target.value)}
          />

          <div>
            <label className="text-xs font-semibold text-[#171A20] block mb-1">
              CIDs Autorizados no Protocolo Clínico / PCDT:
            </label>
            <Input
              placeholder="Ex: M05.8, M06.0, K50.0 (separados por vírgula)"
              value={editMedPcdts}
              onChange={(e) => setEditMedPcdts(e.target.value)}
            />
            <p className="text-[11px] text-[#5C5E62] mt-1">
              Estes diagnósticos habilitam a validação clínica automática durante o registro de atendimento.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#171A20] block mb-1">
              Status Operacional (Soft Delete):
            </label>
            <select
              value={editMedActive ? "true" : "false"}
              onChange={(e) => setEditMedActive(e.target.value === "true")}
              className="w-full h-9 px-3 text-xs bg-white border border-[#E5E7EB] rounded focus:outline-none focus:ring-1 focus:ring-[#171A20]"
            >
              <option value="true">Ativo (Disponível para seleção em novos atendimentos)</option>
              <option value="false">Inativo (Descontinuado via Soft Delete - histórico preservado)</option>
            </select>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-[11px] text-blue-900 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold block text-blue-950">
                Política de Rastreabilidade e Auditoria do SUS:
              </span>
              <span>
                Para proteger os registros passados, itens cadastrados não sofrem deleção física (hard delete). Ao alterar para <strong>Inativo</strong>, o fármaco é ocultado das novas prescrições mantendo os prontuários anteriores 100% consistentes.
              </span>
            </div>
          </div>

          {editMedError && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{editMedError}</span>
            </div>
          )}

          {editMedSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{editMedSuccess}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditMedModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={editMedLoading}
              className="bg-[#171A20] hover:bg-[#282C34] text-white"
            >
              {editMedLoading ? "Gravando no Supabase..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal Editar CID-10 / PCDT (Apenas Admin) */}
      <Dialog
        open={isEditCidModalOpen}
        onOpenChange={setIsEditCidModalOpen}
        title="Editar Diagnóstico PCDT (CID-10)"
        description="Atualize o código CID ou a denominação oficial da patologia protocolada."
      >
        <form onSubmit={handleUpdateCid} className="space-y-4">
          <Input
            label="Código CID-10 *"
            placeholder="Ex: M05.8"
            value={editCidCode}
            onChange={(e) => setEditCidCode(e.target.value.toUpperCase())}
            required
          />

          <Input
            label="Descrição Oficial da Patologia (PCDT) *"
            placeholder="Ex: Artropatia psoriásica"
            value={editCidDesc}
            onChange={(e) => setEditCidDesc(e.target.value)}
            required
          />

          <div>
            <label className="text-xs font-semibold text-[#171A20] block mb-1">
              Status Operacional (Soft Delete):
            </label>
            <select
              value={editCidActive ? "true" : "false"}
              onChange={(e) => setEditCidActive(e.target.value === "true")}
              className="w-full h-9 px-3 text-xs bg-white border border-[#E5E7EB] rounded focus:outline-none focus:ring-1 focus:ring-[#171A20]"
            >
              <option value="true">Ativo (Disponível nos atendimentos clínicos)</option>
              <option value="false">Inativo (Descontinuado via Soft Delete - histórico preservado)</option>
            </select>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-[11px] text-blue-900 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold block text-blue-950">
                Preservação Histórica e Longitudinal:
              </span>
              <span>
                CIDs associados a atendimentos passados não podem ser deletados fisicamente. Ao inativar, novos registros não poderão selecionar este código, protegendo os relatórios estatísticos anteriores.
              </span>
            </div>
          </div>

          {editCidError && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{editCidError}</span>
            </div>
          )}

          {editCidSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{editCidSuccess}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditCidModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={editCidLoading}
              className="bg-[#171A20] hover:bg-[#282C34] text-white"
            >
              {editCidLoading ? "Gravando no Supabase..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal Confirmação de Soft Delete (Inativação / Reativação) */}
      <Dialog
        open={confirmSoftDeleteModal.open}
        onOpenChange={(open) =>
          setConfirmSoftDeleteModal((prev) => ({ ...prev, open }))
        }
        title={
          confirmSoftDeleteModal.targetActiveState
            ? "Reativar Item no Catálogo"
            : "Inativar Item no Catálogo (Soft Delete)"
        }
        description={
          !confirmSoftDeleteModal.targetActiveState
            ? "A exclusão física é permanentemente bloqueada. Ao confirmar, o registro fica inativo para novas seleções sem perda de dados."
            : "Ao reativar, este registro voltará imediatamente a ficar disponível para novos atendimentos no sistema."
        }
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-[#F4F4F6] rounded border border-[#E5E7EB]">
            <span className="text-[11px] font-semibold text-[#5C5E62] block uppercase tracking-wider">
              Item Selecionado:
            </span>
            <span className="text-sm font-bold text-[#171A20] block mt-0.5">
              {confirmSoftDeleteModal.title}
            </span>
            <span className="text-[11px] text-[#5C5E62] block mt-1">
              Categoria:{" "}
              {confirmSoftDeleteModal.type === "medication"
                ? "Medicamento do CEAF (06.04)"
                : "Diagnóstico PCDT / CID-10"}
            </span>
          </div>

          {!confirmSoftDeleteModal.targetActiveState ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 flex items-start gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Confirmação de Soft Delete:</span>
                <span className="leading-relaxed">
                  Este registro <strong>NÃO</strong> será excluído do banco de dados (zero perda de dados). Ele receberá a marcação <code>active: false</code> para não aparecer em novas seleções de atendimento, preservando integralmente o histórico clínico anterior.
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-900 flex items-start gap-2 text-xs">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Reativação Operacional:</span>
                <span className="leading-relaxed">
                  O registro receberá a marcação <code>active: true</code> e voltará imediatamente a ser exibido no formulário de atendimento e filtros ativos.
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setConfirmSoftDeleteModal((prev) => ({ ...prev, open: false }))
              }
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleExecuteSoftDelete}
              className={
                !confirmSoftDeleteModal.targetActiveState
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }
            >
              {!confirmSoftDeleteModal.targetActiveState
                ? "Confirmar Inativação (Soft Delete)"
                : "Confirmar Reativação"}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Modal Incorporação Oficial SIGTAP / CEAF (Apenas Admin) */}
      <Dialog
        open={isSigtapModalOpen}
        onOpenChange={setIsSigtapModalOpen}
        title="Incorporação de Competência SIGTAP (Exclusivo CEAF)"
        description="Atualize o catálogo estadual com os arquivos mensais oficiais do DataSUS (tb_procedimento + rl_procedimento_cid + tb_cid)."
      >
        <div className="space-y-4 text-xs">
          {/* Navegação entre modos do modal */}
          <div className="flex border-b border-[#E5E7EB] space-x-4">
            <button
              type="button"
              onClick={() => setImportMode("datasus_files")}
              className={`pb-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                importMode === "datasus_files"
                  ? "border-[#171A20] text-[#171A20]"
                  : "border-transparent text-[#5C5E62] hover:text-[#171A20]"
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Arquivos Oficiais DataSUS (.txt)
            </button>
            <button
              type="button"
              onClick={() => setImportMode("csv_quick")}
              className={`pb-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                importMode === "csv_quick"
                  ? "border-[#171A20] text-[#171A20]"
                  : "border-transparent text-[#5C5E62] hover:text-[#171A20]"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              CSV / Colar Rápido
            </button>
            <button
              type="button"
              onClick={() => setImportMode("manual_guide")}
              className={`pb-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                importMode === "manual_guide"
                  ? "border-[#171A20] text-[#171A20]"
                  : "border-transparent text-[#5C5E62] hover:text-[#171A20]"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Guia: O que Preciso?
            </button>
          </div>

          {importStatus.type && (
            <div
              className={`p-3 rounded border text-xs flex items-start gap-2 ${
                importStatus.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-red-50 border-red-200 text-red-900"
              }`}
            >
              {importStatus.type === "success" ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{importStatus.message}</span>
            </div>
          )}

          {/* MODO 1: ARQUIVOS OFICIAIS DATASUS */}
          {importMode === "datasus_files" && (
            <div className="space-y-4">
              <div className="p-3 bg-[#F4F4F6] rounded border border-[#E5E7EB]">
                <p className="text-[11px] text-[#393C41] leading-relaxed">
                  Carregue os 3 arquivos oficiais extraídos do pacote mensal <code>TabelaUnificada_AAAAMM.zip</code> do DataSUS. O sistema filtrará estritamente os procedimentos do <strong>Grupo 06 (Medicamentos) Subgrupo 04 (CEAF)</strong> e mapeará os CIDs autorizados por PCDT (<code>rl_procedimento_cid</code>).
                </p>
              </div>

              {/* 3 Uploaders de Arquivo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. tb_procedimento */}
                <div className="p-3 bg-white border border-[#D1D5DB] rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#171A20] text-[11px] flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      tb_procedimento.txt
                    </span>
                    {fileProcContent ? (
                      <Badge variant="success" className="text-[9px] py-0 px-1">Pronto</Badge>
                    ) : (
                      <Badge variant="neutral" className="text-[9px] py-0 px-1">Pendente</Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-[#5C5E62]">
                    Catálogo mestre SUS (Filtro 06.04)
                  </p>
                  <input
                    type="file"
                    accept=".txt,.csv"
                    onChange={(e) => handleReadTextFile(e, "proc")}
                    className="text-[10px] w-full file:mr-1 file:py-0.5 file:px-1.5 file:rounded file:border-0 file:text-[10px] file:bg-[#171A20] file:text-white cursor-pointer"
                  />
                  {fileProcName && (
                    <span className="block text-[10px] text-emerald-700 font-mono truncate">
                      {fileProcName}
                    </span>
                  )}
                </div>

                {/* 2. rl_procedimento_cid */}
                <div className="p-3 bg-white border border-[#D1D5DB] rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#171A20] text-[11px] flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-purple-600" />
                      rl_procedimento_cid.txt
                    </span>
                    {fileRlContent ? (
                      <Badge variant="success" className="text-[9px] py-0 px-1">Pronto</Badge>
                    ) : (
                      <Badge variant="neutral" className="text-[9px] py-0 px-1">Pendente</Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-[#5C5E62]">
                    Relação oficial Medicamento x PCDT
                  </p>
                  <input
                    type="file"
                    accept=".txt,.csv"
                    onChange={(e) => handleReadTextFile(e, "rl")}
                    className="text-[10px] w-full file:mr-1 file:py-0.5 file:px-1.5 file:rounded file:border-0 file:text-[10px] file:bg-[#171A20] file:text-white cursor-pointer"
                  />
                  {fileRlName && (
                    <span className="block text-[10px] text-emerald-700 font-mono truncate">
                      {fileRlName}
                    </span>
                  )}
                </div>

                {/* 3. tb_cid */}
                <div className="p-3 bg-white border border-[#D1D5DB] rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#171A20] text-[11px] flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                      tb_cid.txt
                    </span>
                    {fileCidContent ? (
                      <Badge variant="success" className="text-[9px] py-0 px-1">Pronto</Badge>
                    ) : (
                      <Badge variant="neutral" className="text-[9px] py-0 px-1">Pendente</Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-[#5C5E62]">
                    Descrições oficiais CID-10
                  </p>
                  <input
                    type="file"
                    accept=".txt,.csv"
                    onChange={(e) => handleReadTextFile(e, "cid")}
                    className="text-[10px] w-full file:mr-1 file:py-0.5 file:px-1.5 file:rounded file:border-0 file:text-[10px] file:bg-[#171A20] file:text-white cursor-pointer"
                  />
                  {fileCidName && (
                    <span className="block text-[10px] text-emerald-700 font-mono truncate">
                      {fileCidName}
                    </span>
                  )}
                </div>
              </div>

              {/* Botão de Análise */}
              <div className="flex items-center justify-between pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Carrega arquivos de teste já existentes na pasta sigtap_files
                    fetch("/sigtap_files/tb_procedimento.txt")
                      .catch(() => null);
                  }}
                  className="text-[11px] hidden"
                >
                  Testar
                </Button>
                <div className="ml-auto">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleAnalyzeDataSUSFiles}
                    disabled={!fileProcContent || !fileRlContent || !fileCidContent}
                    className="bg-[#171A20] hover:bg-[#282C34] text-white"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                    Processar Competência DataSUS
                  </Button>
                </div>
              </div>

              {/* Painel de Resultados da Análise */}
              {competencyResult && (
                <div className="p-3 bg-white border border-[#282C34] rounded shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E7EB] pb-2">
                    <div>
                      <span className="text-[11px] font-bold text-[#171A20] block">
                        Resultado da Análise · {competencyResult.competency}
                      </span>
                      <span className="text-[10px] text-[#5C5E62]">
                        Arquivos validados e filtrados exclusivamente para o CEAF (06.04).
                      </span>
                    </div>
                    <Badge variant="success">Filtro CEAF Ativo</Badge>
                  </div>

                  {/* Estatísticas */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="p-2 bg-[#F4F4F6] rounded">
                      <span className="text-base font-bold text-[#171A20] block">
                        {competencyResult.totalCeafProcedures}
                      </span>
                      <span className="text-[10px] text-[#5C5E62]">Medicamentos CEAF</span>
                    </div>
                    <div className="p-2 bg-[#F4F4F6] rounded">
                      <span className="text-base font-bold text-blue-700 block">
                        {competencyResult.totalCids}
                      </span>
                      <span className="text-[10px] text-[#5C5E62]">CIDs PCDT</span>
                    </div>
                    <div className="p-2 bg-[#F4F4F6] rounded">
                      <span className="text-base font-bold text-purple-700 block">
                        {competencyResult.totalRelations}
                      </span>
                      <span className="text-[10px] text-[#5C5E62]">Vínculos Mapeados</span>
                    </div>
                    <div className="p-2 bg-[#F4F4F6] rounded">
                      <span className="text-base font-bold text-emerald-700 block">
                        100%
                      </span>
                      <span className="text-[10px] text-[#5C5E62]">Padrão PCDT</span>
                    </div>
                  </div>

                  {/* Amostra Tabulada */}
                  <div>
                    <span className="text-[11px] font-semibold text-[#171A20] block mb-1">
                      Amostra de Medicamentos & CIDs Vinculados:
                    </span>
                    <div className="max-h-36 overflow-y-auto border border-[#E5E7EB] rounded divide-y divide-[#E5E7EB]">
                      {competencyResult.medications.slice(0, 5).map((m, idx) => (
                        <div key={idx} className="p-2 bg-white flex items-center justify-between text-[11px]">
                          <div>
                            <span className="font-mono font-bold text-blue-700 mr-2">
                              {m.sigtap_code}
                            </span>
                            <span className="font-semibold text-[#171A20]">{m.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {(m.compatible_cid_codes || []).slice(0, 3).map((c) => (
                              <span key={c} className="font-mono text-[9px] bg-gray-100 px-1 py-0.5 rounded border">
                                {c}
                              </span>
                            ))}
                            {(m.compatible_cid_codes?.length || 0) > 3 && (
                              <span className="text-[9px] text-[#5C5E62]">
                                +{(m.compatible_cid_codes?.length || 0) - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ações Finais */}
                  <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadSQLMigration}
                      className="text-[11px] h-8 text-[#171A20] border-[#D1D5DB]"
                    >
                      <Download className="w-3.5 h-3.5 mr-1 text-blue-600" />
                      Baixar Script SQL Supabase (.sql)
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleCommitDataSUS}
                      className="text-[11px] h-8 bg-[#E82127] hover:bg-[#C91A20] text-white font-semibold"
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      Incorporar ao PharmaCare Agora
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODO 2: CSV RÁPIDO */}
          {importMode === "csv_quick" && (
            <div className="space-y-3">
              <div className="p-3 bg-[#F4F4F6] rounded border border-[#E5E7EB] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#171A20]">
                    Arquivo CSV da Tabela SIGTAP
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const csvContent =
                        "NOME_MEDICAMENTO;FORMA_FARMACEUTICA;CODIGO_CID;DESCRICAO_CID\n" +
                        "Adalimumabe 40mg/0,8mL;Solução Injetável em seringa preenchida;M05.8;Outras artrites reumatoides soropositivas\n" +
                        "Infliximabe 100mg;Pó liofilizado para solução injetável;K50.0;Doença de Crohn do intestino delgado\n" +
                        "Etanercepte 50mg;Solução Injetável em caneta aplicadora;M45;Espondilite ancilosante\n" +
                        "Secuquinumabe 150mg;Solução Injetável em caneta preenchida;L40.0;Psoríase vulgar\n" +
                        "Fingolimode 0,5mg;Cápsula gelatinosa;G35;Esclerose múltipla\n";

                      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");
                      link.href = url;
                      link.setAttribute("download", "modelo_importacao_sigtap_ceaf.csv");
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="text-[11px] h-7 bg-white text-[#171A20]"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Baixar Modelo CSV
                  </Button>
                </div>
                <p className="text-[11px] text-[#5C5E62]">
                  Cole ou selecione um <code>.csv</code> com as colunas: <br />
                  <code className="text-[#171A20] font-mono">NOME_MEDICAMENTO;FORMA_FARMACEUTICA;CODIGO_CID;DESCRICAO_CID</code>
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#393C41] mb-1">
                  Cole os dados abaixo:
                </label>
                <textarea
                  rows={6}
                  value={sigtapInputText}
                  onChange={(e) => setSigtapInputText(e.target.value)}
                  placeholder="Exemplo:
Adalimumabe 40mg/0,8mL;Solução Injetável;M05.8;Outras artrites reumatoides
Infliximabe 100mg;Pó liofilizado;K50.0;Doença de Crohn
Golimumabe 50mg/0,5mL;Solução Injetável;M45;Espondilite ancilosante"
                  className="w-full p-2.5 text-xs font-mono bg-white border border-[#D1D5DB] rounded focus:ring-1 focus:ring-[#171A20] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (!sigtapInputText.trim()) return;
                    const lines = sigtapInputText.split("\n").filter((l) => l.trim().length > 0);
                    const parsedCids: Omit<CID, "id">[] = [];
                    const parsedMeds: Omit<Medication, "id">[] = [];

                    lines.forEach((line) => {
                      if (line.toLowerCase().includes("medicamento") || line.toLowerCase().includes("codigo")) return;
                      const sep = line.includes(";") ? ";" : ",";
                      const parts = line.split(sep).map((p) => p.trim().replace(/^["']|["']$/g, ""));
                      if (parts.length >= 4) {
                        if (parts[0]) {
                          parsedMeds.push({
                            name: parts[0],
                            pharmaceutical_form: parts[1] || undefined,
                            component: "CEAF",
                            active: true,
                            compatible_cid_codes: parts[2] ? [parts[2].toUpperCase()] : [],
                          });
                        }
                        if (parts[2] && parts[3]) {
                          parsedCids.push({
                            code: parts[2].toUpperCase(),
                            description: parts[3],
                            active: true,
                          });
                        }
                      }
                    });

                    const res = importSIGTAPData(parsedCids, parsedMeds);
                    setImportStatus({
                      type: "success",
                      message: `Importação rápida concluída: ${res.medsAdded} medicamentos e ${res.cidsAdded} CIDs adicionados.`,
                    });
                    setSigtapInputText("");
                  }}
                  className="bg-[#E82127] hover:bg-[#C91A20] text-white"
                >
                  Processar Linhas
                </Button>
              </div>
            </div>
          )}

          {/* MODO 3: GUIA & COMO BAIXAR NO DATASUS */}
          {importMode === "manual_guide" && (
            <div className="space-y-3 leading-relaxed text-[#171A20]">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-900 space-y-1.5">
                <span className="font-bold block text-xs">
                  O que é e onde baixar a Tabela Mensal do SIGTAP?
                </span>
                <p className="text-[11px] text-blue-800">
                  Todo início de mês o Ministério da Saúde disponibiliza a nova competência com inclusões e exclusões de medicamentos e CIDs de PCDTs.
                </p>
                <div className="pt-1 flex flex-wrap gap-2">
                  <a
                    href="http://sigtap.datasus.gov.br/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 underline hover:text-blue-900"
                  >
                    Portal SIGTAP (Menu Download)
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-blue-300">|</span>
                  <a
                    href="ftp://ftp.datasus.gov.br/dissemin/publicos/SIASUS/200801_/Tabelas/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 underline hover:text-blue-900"
                  >
                    FTP Oficial DataSUS
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-[11px] block">
                  Os 3 Arquivos que você precisa extrair do ZIP:
                </span>
                <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-[#393C41]">
                  <li>
                    <strong>tb_procedimento.txt:</strong> Contém todos os procedimentos do SUS. O PharmaCare aplica o filtro <code>0604...</code> (Grupo 06 = Medicamentos, Subgrupo 04 = CEAF).
                  </li>
                  <li>
                    <strong>rl_procedimento_cid.txt:</strong> A tabela de relacionamento oficial entre medicamento e CIDs autorizados no Protocolo Clínico (PCDT).
                  </li>
                  <li>
                    <strong>tb_cid.txt:</strong> Tabela com o código e descrição completa das doenças (CID-10).
                  </li>
                </ol>
              </div>

              <div className="p-2.5 bg-[#F4F4F6] rounded border border-[#E5E7EB]">
                <span className="font-bold text-[11px] block text-[#171A20] mb-0.5">
                  Automação via Linha de Comando (Terminal / DevOps):
                </span>
                <p className="text-[10px] text-[#5C5E62] mb-1.5">
                  Você também pode colocar os 3 arquivos dentro da pasta <code>sigtap_files/</code> no servidor e rodar:
                </p>
                <code className="block bg-[#171A20] text-emerald-400 p-2 rounded text-[11px] font-mono">
                  npm run sigtap:import
                </code>
              </div>
            </div>
          )}

          {/* Rodapé do Modal */}
          <div className="flex items-center justify-end pt-3 border-t border-[#E5E7EB]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsSigtapModalOpen(false)}
            >
              Fechar
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

