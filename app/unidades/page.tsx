"use client";

import React, { useState, useMemo } from "react";
import {
  Building2,
  PlusCircle,
  Users,
  MapPin,
  Mail,
  Phone,
  Pencil,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Stethoscope,
  Trash2,
  Plus,
  Compass,
  Layers,
  Search,
  Landmark,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  UserCheck,
} from "lucide-react";
import { useApp } from "@/lib/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import {
  Unit,
  UnidadeFarmaceutico,
  Municipio,
  Origem,
  Dires,
  Nucleo,
} from "@/lib/types";
import { BAHIA_MACRORREGIOES, BAHIA_BRS } from "@/lib/territory-data";
import { matchNormalized, normalizeText } from "@/lib/utils";

export default function UnidadesEstruturaPage() {
  const {
    units,
    municipios,
    origens,
    diresList,
    nucleos,
    currentUser,
    addUnit,
    updateUnitFull,
    addMunicipio,
    updateMunicipio,
    deleteMunicipio,
    addOrigem,
    updateOrigem,
    deleteOrigem,
    addNucleo,
    updateNucleo,
    deleteNucleo,
    addDires,
    updateDires,
    deleteDires,
  } = useApp();

  const isGestor = currentUser?.role === "admin" || currentUser?.role === "gestor";

  // Aba ativa principal
  const [activeMainTab, setActiveMainTab] = useState<"bases" | "municipios" | "nucleos" | "origens">("bases");

  // =========================================================================
  // 1. ESTADOS: BASES REGIONAIS & UNIDADES
  // =========================================================================
  const [unitSearch, setUnitSearch] = useState("");
  const [unitMacroFilter, setUnitMacroFilter] = useState("all");

  // Modal Nova/Editar Unidade
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isEditingUnit, setIsEditingUnit] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [unitName, setUnitName] = useState("");
  const [unitMacroregion, setUnitMacroregion] = useState("Macrorregional Centro-Leste");
  const [unitMunicipality, setUnitMunicipality] = useState("");
  const [unitCnes, setUnitCnes] = useState("");
  const [unitEmail, setUnitEmail] = useState("");
  const [unitPhone, setUnitPhone] = useState("");
  const [unitAddress, setUnitAddress] = useState("");
  const [unitActive, setUnitActive] = useState(true);
  const [unitLoading, setUnitLoading] = useState(false);
  const [unitError, setUnitError] = useState("");

  // Modal Gerenciar Farmacêuticos Responsáveis da Unidade
  const [isPharmacistModalOpen, setIsPharmacistModalOpen] = useState(false);
  const [activeUnitForPharm, setActiveUnitForPharm] = useState<Unit | null>(null);
  const [newPharmName, setNewPharmName] = useState("");
  const [newPharmCrf, setNewPharmCrf] = useState("");
  const [newPharmPhone, setNewPharmPhone] = useState("");
  const [newPharmEmail, setNewPharmEmail] = useState("");
  const [newPharmIsRt, setNewPharmIsRt] = useState(false);

  // Modal Gerenciar Municípios Abrangidos da Unidade
  const [isMunicipalitiesModalOpen, setIsMunicipalitiesModalOpen] = useState(false);
  const [activeUnitForMuns, setActiveUnitForMuns] = useState<Unit | null>(null);
  const [selectedMunIdToAdd, setSelectedMunIdToAdd] = useState("");

  // =========================================================================
  // 2. ESTADOS: MUNICÍPIOS (417)
  // =========================================================================
  const [munSearch, setMunSearch] = useState("");
  const [munMacroFilter, setMunMacroFilter] = useState("all");
  const [munBrsFilter, setMunBrsFilter] = useState("all");
  const [munPage, setMunPage] = useState(1);
  const [munPageSize, setMunPageSize] = useState(25);

  const [isMunEditModalOpen, setIsMunEditModalOpen] = useState(false);
  const [editingMun, setEditingMun] = useState<Municipio | null>(null);
  const [editMunName, setEditMunName] = useState("");
  const [editMunIbge, setEditMunIbge] = useState("");
  const [editMunBrsName, setEditMunBrsName] = useState("");

  // =========================================================================
  // 3. ESTADOS: ORIGENS DE DEMANDA
  // =========================================================================
  const [isOrigemModalOpen, setIsOrigemModalOpen] = useState(false);
  const [editingOrigem, setEditingOrigem] = useState<Origem | null>(null);
  const [origemName, setOrigemName] = useState("");
  const [origemSigla, setOrigemSigla] = useState("");
  const [origemDesc, setOrigemDesc] = useState("");
  const [origemActive, setOrigemActive] = useState(true);

  // =========================================================================
  // 4. ESTADOS: NÚCLEOS & DIRES
  // =========================================================================
  const [isNucleoModalOpen, setIsNucleoModalOpen] = useState(false);
  const [editingNucleo, setEditingNucleo] = useState<Nucleo | null>(null);
  const [nucleoCode, setNucleoCode] = useState("");
  const [nucleoName, setNucleoName] = useState("");
  const [nucleoMacro, setNucleoMacro] = useState("Macrorregional Leste");

  // =========================================================================
  // CÁLCULOS E FILTRAGENS
  // =========================================================================

  // Mapeamento automático de municípios que pertencem a cada base / unidade
  const unitMunicipalitiesMap = useMemo(() => {
    const map: Record<string, Municipio[]> = {};
    units.forEach((u) => {
      // 1. Municípios explicitamente vinculados em served_municipalities
      const directServed = u.served_municipalities || [];

      // 2. Municípios cujo brs_name corresponde à unidade
      const cleanUnitName = u.name
        .replace(/^(BRS|NRS|Base Regional de Saúde|Núcleo Regional de Saúde)\s+/i, "")
        .trim()
        .toLowerCase();

      const matchedMuns = municipios.filter((m) => {
        if (m.base_id === u.id) return true;
        if (m.brs_name) {
          const cleanBrs = m.brs_name
            .replace(/^(BRS|NRS|Base Regional de Saúde|Núcleo Regional de Saúde)\s+/i, "")
            .trim()
            .toLowerCase();
          return cleanBrs === cleanUnitName || m.brs_name.toLowerCase() === u.name.toLowerCase();
        }
        return false;
      });

      const combined = [...directServed];
      matchedMuns.forEach((m) => {
        if (!combined.some((c) => c.id === m.id || c.ibge_code === m.ibge_code)) {
          combined.push(m);
        }
      });

      map[u.id] = combined;
    });
    return map;
  }, [units, municipios]);

  // Filtragem de Unidades / Bases (insensível a acentuação)
  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      const matchSearch =
        matchNormalized(u.name, unitSearch) ||
        matchNormalized(u.municipality, unitSearch) ||
        matchNormalized(u.macroregion, unitSearch) ||
        (u.responsible_pharmacists || []).some(
          (p) =>
            matchNormalized(p.full_name, unitSearch) ||
            matchNormalized(p.crf, unitSearch)
        );

      if (!matchSearch) return false;

      if (unitMacroFilter !== "all" && !matchNormalized(u.macroregion, unitMacroFilter)) {
        return false;
      }

      return true;
    });
  }, [units, unitSearch, unitMacroFilter]);

  // Filtragem de Municípios (417) (insensível a acentuação)
  const filteredMunicipios = useMemo(() => {
    return municipios.filter((m) => {
      const matchSearch =
        matchNormalized(m.name, munSearch) ||
        m.ibge_code.includes(munSearch.trim()) ||
        matchNormalized(m.brs_name, munSearch);

      if (!matchSearch) return false;

      if (munMacroFilter !== "all" && m.macroregion !== munMacroFilter) {
        return false;
      }

      if (munBrsFilter !== "all") {
        const cleanFilter = normalizeText(munBrsFilter.replace(/^(BRS|NRS)\s+/i, ""));
        const cleanBrs = normalizeText((m.brs_name || "").replace(/^(BRS|NRS)\s+/i, ""));
        if (cleanBrs !== cleanFilter && m.brs_name !== munBrsFilter) return false;
      }

      return true;
    });
  }, [municipios, munSearch, munMacroFilter, munBrsFilter]);

  // Paginação dos Municípios
  const totalMunPages = Math.ceil(filteredMunicipios.length / munPageSize) || 1;
  const pagedMunicipios = useMemo(() => {
    const start = (munPage - 1) * munPageSize;
    return filteredMunicipios.slice(start, start + munPageSize);
  }, [filteredMunicipios, munPage, munPageSize]);

  // Total de Farmacêuticos Responsáveis cadastrados em todas as bases
  const totalPharmacistsCount = useMemo(() => {
    return units.reduce((acc, u) => acc + (u.responsible_pharmacists?.length || 0), 0);
  }, [units]);

  // =========================================================================
  // HANDLERS: UNIDADES & BASES
  // =========================================================================
  const handleOpenNewUnit = () => {
    setIsEditingUnit(false);
    setSelectedUnitId("");
    setUnitName("");
    setUnitMacroregion("Macrorregional Centro-Leste");
    setUnitMunicipality("");
    setUnitCnes("");
    setUnitEmail("");
    setUnitPhone("");
    setUnitAddress("");
    setUnitActive(true);
    setUnitError("");
    setIsUnitModalOpen(true);
  };

  const handleOpenEditUnit = (u: Unit) => {
    setIsEditingUnit(true);
    setSelectedUnitId(u.id);
    setUnitName(u.name);
    setUnitMacroregion(u.macroregion);
    setUnitMunicipality(u.municipality || "");
    setUnitCnes(u.cnes || "");
    setUnitEmail(u.email || "");
    setUnitPhone(u.phone || "");
    setUnitAddress(u.address || "");
    setUnitActive(u.active !== false);
    setUnitError("");
    setIsUnitModalOpen(true);
  };

  const handleSaveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitName.trim()) {
      setUnitError("O nome da Base Regional / Unidade é obrigatório.");
      return;
    }

    setUnitLoading(true);
    setUnitError("");
    try {
      if (isEditingUnit && selectedUnitId) {
        await updateUnitFull(selectedUnitId, {
          name: unitName.trim(),
          macroregion: unitMacroregion,
          municipality: unitMunicipality.trim() || null,
          cnes: unitCnes.trim() || null,
          email: unitEmail.trim() || null,
          phone: unitPhone.trim() || null,
          address: unitAddress.trim() || null,
          active: unitActive,
        });
      } else {
        await addUnit({
          name: unitName.trim(),
          macroregion: unitMacroregion,
          municipality: unitMunicipality.trim() || null,
          cnes: unitCnes.trim() || null,
          email: unitEmail.trim() || null,
          phone: unitPhone.trim() || null,
          address: unitAddress.trim() || null,
          active: true,
          responsible_pharmacists: [],
          served_municipalities: [],
        });
      }
      setIsUnitModalOpen(false);
    } catch (err: any) {
      setUnitError(err?.message || "Erro ao salvar unidade.");
    } finally {
      setUnitLoading(false);
    }
  };

  // Gerenciar Farmacêuticos
  const handleOpenPharmacists = (u: Unit) => {
    setActiveUnitForPharm(u);
    setNewPharmName("");
    setNewPharmCrf("");
    setNewPharmPhone("");
    setNewPharmEmail("");
    setNewPharmIsRt(false);
    setIsPharmacistModalOpen(true);
  };

  const handleAddPharmacist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUnitForPharm || !newPharmName.trim() || !newPharmCrf.trim()) return;

    const newPharm: UnidadeFarmaceutico = {
      id: `rf-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      unit_id: activeUnitForPharm.id,
      pharmacist_id: `p-${Date.now()}`,
      full_name: newPharmName.trim(),
      crf: newPharmCrf.trim().toUpperCase(),
      phone: newPharmPhone.trim() || null,
      email: newPharmEmail.trim() || null,
      is_technical_lead: newPharmIsRt,
      created_at: new Date().toISOString(),
    };

    const currentList = activeUnitForPharm.responsible_pharmacists || [];
    const updatedList = [...currentList, newPharm];

    await updateUnitFull(activeUnitForPharm.id, {
      responsible_pharmacists: updatedList,
    });

    setActiveUnitForPharm({
      ...activeUnitForPharm,
      responsible_pharmacists: updatedList,
    });

    setNewPharmName("");
    setNewPharmCrf("");
    setNewPharmPhone("");
    setNewPharmEmail("");
    setNewPharmIsRt(false);
  };

  const handleRemovePharmacist = async (pharmId: string) => {
    if (!activeUnitForPharm) return;
    const currentList = activeUnitForPharm.responsible_pharmacists || [];
    const updatedList = currentList.filter((p) => p.id !== pharmId);

    await updateUnitFull(activeUnitForPharm.id, {
      responsible_pharmacists: updatedList,
    });

    setActiveUnitForPharm({
      ...activeUnitForPharm,
      responsible_pharmacists: updatedList,
    });
  };

  // Gerenciar Municípios
  const handleOpenMunicipalities = (u: Unit) => {
    setActiveUnitForMuns(u);
    setSelectedMunIdToAdd("");
    setIsMunicipalitiesModalOpen(true);
  };

  const handleAddMunicipality = async () => {
    if (!activeUnitForMuns || !selectedMunIdToAdd) return;
    const munObj = municipios.find((m) => m.id === selectedMunIdToAdd);
    if (!munObj) return;

    const currentList = activeUnitForMuns.served_municipalities || [];
    if (currentList.some((m) => m.id === munObj.id)) {
      alert("Este município já está vinculado a esta base.");
      return;
    }

    const updatedList = [...currentList, munObj];
    await updateUnitFull(activeUnitForMuns.id, {
      served_municipalities: updatedList,
    });

    // Atualiza também a base no município
    await updateMunicipio(munObj.id, {
      base_id: activeUnitForMuns.id,
      brs_name: activeUnitForMuns.name.replace(/^BRS\s+/i, ""),
    });

    setActiveUnitForMuns({
      ...activeUnitForMuns,
      served_municipalities: updatedList,
    });
    setSelectedMunIdToAdd("");
  };

  const handleRemoveMunicipality = async (munId: string) => {
    if (!activeUnitForMuns) return;
    const currentList = activeUnitForMuns.served_municipalities || [];
    const updatedList = currentList.filter((m) => m.id !== munId);

    await updateUnitFull(activeUnitForMuns.id, {
      served_municipalities: updatedList,
    });

    setActiveUnitForMuns({
      ...activeUnitForMuns,
      served_municipalities: updatedList,
    });
  };

  // =========================================================================
  // HANDLERS: MUNICÍPIOS
  // =========================================================================
  const handleOpenEditMun = (m: Municipio) => {
    setEditingMun(m);
    setEditMunName(m.name);
    setEditMunIbge(m.ibge_code);
    setEditMunBrsName(m.brs_name || "");
    setIsMunEditModalOpen(true);
  };

  const handleSaveEditMun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMun) return;

    await updateMunicipio(editingMun.id, {
      name: editMunName.trim(),
      ibge_code: editMunIbge.trim(),
      brs_name: editMunBrsName.trim() || null,
    });

    setIsMunEditModalOpen(false);
  };

  // =========================================================================
  // HANDLERS: ORIGENS
  // =========================================================================
  const handleOpenOrigem = (orig?: Origem) => {
    if (orig) {
      setEditingOrigem(orig);
      setOrigemName(orig.name);
      setOrigemSigla(orig.sigla || "");
      setOrigemDesc(orig.description || "");
      setOrigemActive(orig.active);
    } else {
      setEditingOrigem(null);
      setOrigemName("");
      setOrigemSigla("");
      setOrigemDesc("");
      setOrigemActive(true);
    }
    setIsOrigemModalOpen(true);
  };

  const handleSaveOrigem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origemName.trim()) return;

    if (editingOrigem) {
      await updateOrigem(editingOrigem.id, {
        name: origemName.trim(),
        sigla: origemSigla.trim() || null,
        description: origemDesc.trim() || null,
        active: origemActive,
      });
    } else {
      await addOrigem({
        name: origemName.trim(),
        sigla: origemSigla.trim() || null,
        description: origemDesc.trim() || null,
        active: true,
      });
    }
    setIsOrigemModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Topo / Cabeçalho Unificado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-emerald-600" />
            Unidades & Estrutura Territorial da Bahia
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Central integrada: Bases Regionais de Saúde (BRS), Núcleos (NRS), Municípios jurisdicionados e Equipes Farmacêuticas.
          </p>
        </div>

        {isGestor && (
          <div className="flex items-center gap-2">
            <Button
              onClick={handleOpenNewUnit}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 text-xs"
            >
              <PlusCircle className="h-4 w-4" />
              Nova Base Regional / Unidade
            </Button>
          </div>
        )}
      </div>

      {/* Cards de Métricas Integradas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-700">Bases Regionais (BRS)</span>
              <Building2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{units.length}</div>
            <span className="text-[11px] text-slate-500">Unidades de referência SESAB</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-blue-700">Núcleos (NRS)</span>
              <Compass className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{nucleos.length || 9}</div>
            <span className="text-[11px] text-slate-500">Macrorregiões de saúde</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-indigo-700">Municípios Bahia</span>
              <MapPin className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{municipios.length}</div>
            <span className="text-[11px] text-slate-500">100% integrados às bases</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-700">Equipe Farmacêutica</span>
              <Stethoscope className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{totalPharmacistsCount}</div>
            <span className="text-[11px] text-slate-500">Responsáveis Técnicos & Pareceristas</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">Origens de Processo</span>
              <Landmark className="h-4 w-4 text-slate-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{origens.length}</div>
            <span className="text-[11px] text-slate-500">Judiciais e administrativas</span>
          </CardContent>
        </Card>
      </div>

      {/* Navegação por Abas Unificadas */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveMainTab("bases")}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${activeMainTab === "bases"
              ? "border-emerald-600 text-emerald-700 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
        >
          <Building2 className="h-4 w-4" />
          Bases Regionais & Equipes ({units.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab("municipios")}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${activeMainTab === "municipios"
              ? "border-emerald-600 text-emerald-700 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
        >
          <MapPin className="h-4 w-4" />
          Municípios da Bahia ({municipios.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab("nucleos")}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${activeMainTab === "nucleos"
              ? "border-emerald-600 text-emerald-700 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
        >
          <Compass className="h-4 w-4" />
          Núcleos (NRS) & DIRES
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab("origens")}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${activeMainTab === "origens"
              ? "border-emerald-600 text-emerald-700 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
        >
          <Landmark className="h-4 w-4" />
          Origens de Demanda ({origens.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: BASES REGIONAIS & UNIDADES (COM EQUIPES E MUNICÍPIOS INTEGRADOS) */}
      {/* ========================================================================= */}
      {activeMainTab === "bases" && (
        <div className="space-y-4">
          {/* Barra de Filtro de Unidades */}
          <Card>
            <CardContent className="p-3.5 flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar base por nome, município-sede, macrorregião ou farmacêutico..."
                  value={unitSearch}
                  onChange={(e) => setUnitSearch(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>

              <select
                value={unitMacroFilter}
                onChange={(e) => setUnitMacroFilter(e.target.value)}
                className="w-full sm:w-64 h-9 text-xs rounded-md border border-slate-200 bg-white px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Todas as Macrorregiões</option>
                {BAHIA_MACRORREGIOES.map((macro) => (
                  <option key={macro} value={macro}>
                    {macro}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          {/* Grid de Cards de Bases Regionais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUnits.map((unit) => {
              const munsOfThisBase = unitMunicipalitiesMap[unit.id] || [];
              const pharms = unit.responsible_pharmacists || [];
              const rtPharm = pharms.find((p) => p.is_technical_lead) || pharms[0];

              return (
                <Card
                  key={unit.id}
                  className="border-slate-200 shadow-sm hover:border-emerald-300 transition-all flex flex-col justify-between"
                >
                  <CardHeader className="p-4 pb-2 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-slate-900">{unit.name}</h3>
                          {unit.active === false ? (
                            <Badge variant="outline" className="text-[9px] text-slate-400">
                              Inativa
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[9px]">
                              Ativa
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Compass className="h-3.5 w-3.5 text-blue-600" />
                          <span>{unit.macroregion}</span>
                          {unit.cnes && <span>• CNES: {unit.cnes}</span>}
                        </div>
                      </div>

                      {isGestor && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditUnit(unit)}
                          className="h-8 w-8 p-0 text-slate-500 hover:text-slate-800"
                          title="Editar Unidade"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-3.5 text-xs flex-1">
                    {/* Contatos da Base */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{unit.email || "E-mail não informado"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                        <span>{unit.phone || "Telefone não informado"}</span>
                      </div>
                      {unit.address && (
                        <div className="sm:col-span-2 flex items-center gap-1.5 text-slate-500">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{unit.address}</span>
                        </div>
                      )}
                    </div>

                    {/* Bloco: Equipe de Farmacêuticos Responsáveis */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                          <Stethoscope className="h-3.5 w-3.5 text-emerald-600" />
                          Farmacêuticos Responsáveis ({pharms.length})
                        </span>
                        {isGestor && (
                          <button
                            type="button"
                            onClick={() => handleOpenPharmacists(unit)}
                            className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            Gerenciar Equipe
                          </button>
                        )}
                      </div>

                      {pharms.length === 0 ? (
                        <div className="p-2 border border-dashed border-slate-200 rounded text-slate-400 text-[11px] text-center">
                          Nenhum farmacêutico responsável cadastrado nesta base.
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {pharms.map((p) => (
                            <div
                              key={p.id}
                              className="bg-white p-2 rounded border border-slate-200 flex items-center justify-between text-[11px]"
                            >
                              <div className="truncate">
                                <span className="font-semibold text-slate-800">{p.full_name}</span>
                                <span className="text-slate-500 ml-1.5 font-mono">({p.crf})</span>
                                {p.is_technical_lead && (
                                  <Badge className="ml-1.5 text-[8px] bg-emerald-600 text-white">
                                    RT Titular
                                  </Badge>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                {p.phone && <span>{p.phone}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bloco: Municípios Jurisdicionados */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-indigo-600" />
                          Municípios Jurisdicionados ({munsOfThisBase.length})
                        </span>
                        {isGestor && (
                          <button
                            type="button"
                            onClick={() => handleOpenMunicipalities(unit)}
                            className="text-[11px] text-indigo-700 hover:text-indigo-900 font-semibold flex items-center gap-1"
                          >
                            <Pencil className="h-3 w-3" />
                            Vincular Cidades
                          </button>
                        )}
                      </div>

                      {munsOfThisBase.length === 0 ? (
                        <div className="p-2 border border-dashed border-slate-200 rounded text-slate-400 text-[11px] text-center">
                          Nenhum município associado a esta base no mapeamento.
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                          {munsOfThisBase.slice(0, 12).map((m) => (
                            <Badge
                              key={m.id}
                              variant="outline"
                              className="text-[10px] bg-slate-50 text-slate-700 border-slate-200"
                            >
                              {m.name}
                            </Badge>
                          ))}
                          {munsOfThisBase.length > 12 && (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200 cursor-pointer"
                              onClick={() => handleOpenMunicipalities(unit)}
                            >
                              +{munsOfThisBase.length - 12} municípios...
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: MUNICÍPIOS DA BAHIA (417) */}
      {/* ========================================================================= */}
      {activeMainTab === "municipios" && (
        <Card>
          <CardHeader className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold text-slate-800">
                Municípios do Estado da Bahia ({filteredMunicipios.length})
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Relação oficial dos 417 municípios da Bahia com vínculo territorial direto com BRS e NRS.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Filtros de Municípios */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Filtrar por nome ou código IBGE..."
                  value={munSearch}
                  onChange={(e) => {
                    setMunSearch(e.target.value);
                    setMunPage(1);
                  }}
                  className="pl-9 text-xs"
                />
              </div>

              <select
                value={munMacroFilter}
                onChange={(e) => {
                  setMunMacroFilter(e.target.value);
                  setMunPage(1);
                }}
                className="w-full text-xs p-2 rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Todas as Macrorregiões</option>
                {BAHIA_MACRORREGIOES.map((macro) => (
                  <option key={macro} value={macro}>
                    {macro}
                  </option>
                ))}
              </select>

              <select
                value={munBrsFilter}
                onChange={(e) => {
                  setMunBrsFilter(e.target.value);
                  setMunPage(1);
                }}
                className="w-full text-xs p-2 rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Todas as Unidades (BRS / NRS)</option>
                {BAHIA_BRS.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tabela de Municípios */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Município</th>
                    <th className="py-2.5 px-3">Código IBGE</th>
                    <th className="py-2.5 px-3">Unidade Regional (BRS/NRS)</th>
                    <th className="py-2.5 px-3">Núcleo (NRS)</th>
                    <th className="py-2.5 px-3">Macrorregião</th>
                    {isGestor && <th className="py-2.5 px-3 text-right">Ação</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pagedMunicipios.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {m.name}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{m.ibge_code}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-800">
                          {m.brs_name ? `${m.brs_name.replace(/^BRS\s+/i, "")}` : "Não vinculada"}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{m.nrs_name || "NRS"}</td>
                      <td className="py-2.5 px-3 text-slate-600">{m.macroregion || "Bahia"}</td>
                      {isGestor && (
                        <td className="py-2.5 px-3 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditMun(m)}
                            className="h-7 text-xs text-slate-500 hover:text-slate-800"
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
              <div>
                Mostrando {pagedMunicipios.length} de {filteredMunicipios.length} municípios
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMunPage(1)}
                  disabled={munPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMunPage((prev) => Math.max(prev - 1, 1))}
                  disabled={munPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="px-2 font-medium">
                  Página {munPage} de {totalMunPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMunPage((prev) => Math.min(prev + 1, totalMunPages))}
                  disabled={munPage === totalMunPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMunPage(totalMunPages)}
                  disabled={munPage === totalMunPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: NÚCLEOS REGIONAIS (NRS) & DIRES */}
      {/* ========================================================================= */}
      {activeMainTab === "nucleos" && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-800">
                  Núcleos Regionais de Saúde (NRS) da Bahia
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Coordenações macrorregionais de saúde que agrupam as Bases Regionais (BRS).
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {(nucleos.length > 0 ? nucleos : [
                  { id: "1", code: "NRS-LESTE", name: "NRS Salvador / Leste", macroregion: "Leste" },
                  { id: "2", code: "NRS-CENTRO-LESTE", name: "NRS Feira de Santana", macroregion: "Centro Leste" },
                  { id: "3", code: "NRS-NORTE", name: "NRS Juazeiro", macroregion: "Norte" },
                  { id: "4", code: "NRS-SUDOESTE", name: "NRS Vitória da Conquista", macroregion: "Sudoeste" },
                  { id: "5", code: "NRS-SUL", name: "NRS Ilhéus / Itabuna", macroregion: "Sul" },
                  { id: "6", code: "NRS-OESTE", name: "NRS Barreiras", macroregion: "Oeste" },
                  { id: "7", code: "NRS-CENTRO-NORTE", name: "NRS Jacobina", macroregion: "Centro Norte" },
                  { id: "8", code: "NRS-NORDESTE", name: "NRS Alagoinhas", macroregion: "Nordeste" },
                  { id: "9", code: "NRS-EXTREMO-SUL", name: "NRS Teixeira de Freitas", macroregion: "Extremo Sul" },
                ]).map((n) => (
                  <div key={n.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{n.name}</span>
                      <Badge variant="outline" className="text-[9px]">
                        {n.code}
                      </Badge>
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      Macrorregião: <strong>{n.macroregion}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-base font-semibold text-slate-800">
                Diretorias Regionais de Saúde (DIRES) - Histórico
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Divisões de referência histórica utilizadas na tramitação documental e em processos antigos do SEI.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
                {diresList.map((d) => (
                  <div key={d.id} className="p-2.5 bg-white border border-slate-200 rounded text-slate-800">
                    <span className="font-bold font-mono text-emerald-800">{d.code}</span>
                    <p className="text-[11px] text-slate-600 truncate">{d.name}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 4: ORIGENS DE DEMANDA */}
      {/* ========================================================================= */}
      {activeMainTab === "origens" && (
        <Card>
          <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-800">
                Origens da Demanda Administrativa & Judicial
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Entidades e órgãos que protocolam solicitações e mandados de medicamentos no sistema.
              </CardDescription>
            </div>
            {isGestor && (
              <Button
                type="button"
                size="sm"
                onClick={() => handleOpenOrigem()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Nova Origem
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {origens.map((o) => (
                <div
                  key={o.id}
                  className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{o.name}</span>
                      {o.sigla && (
                        <Badge variant="outline" className="text-[10px] bg-slate-50 font-mono">
                          {o.sigla}
                        </Badge>
                      )}
                    </div>
                    {o.description && (
                      <p className="text-[11px] text-slate-500">{o.description}</p>
                    )}
                  </div>

                  {isGestor && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenOrigem(o)}
                      className="h-8 w-8 p-0 text-slate-500 hover:text-slate-800"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NOVA / EDITAR BASE REGIONAL / UNIDADE */}
      {/* ========================================================================= */}
      {isUnitModalOpen && (
        <Dialog
          open={true}
          onOpenChange={() => setIsUnitModalOpen(false)}
          title={isEditingUnit ? "Editar Base Regional / Unidade" : "Nova Base Regional / Unidade"}
          description="Informe os dados cadastrais, contatos e macrorregião da unidade."
          maxWidth="md"
        >
          <form onSubmit={handleSaveUnit} className="space-y-3">
            {unitError && (
              <div className="p-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700">
                {unitError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome da Base Regional / Unidade *
              </label>
              <Input
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                placeholder="Ex: Base Regional de Saúde Feira de Santana"
                required
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Macrorregião de Saúde *
                </label>
                <select
                  value={unitMacroregion}
                  onChange={(e) => setUnitMacroregion(e.target.value)}
                  className="w-full text-xs p-2 rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {BAHIA_MACRORREGIOES.map((macro) => (
                    <option key={macro} value={macro}>
                      {macro}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Município-Sede
                </label>
                <Input
                  value={unitMunicipality}
                  onChange={(e) => setUnitMunicipality(e.target.value)}
                  placeholder="Ex: Feira de Santana"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Código CNES
                </label>
                <Input
                  value={unitCnes}
                  onChange={(e) => setUnitCnes(e.target.value)}
                  placeholder="Ex: 2605847"
                  className="text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Telefone Institucional
                </label>
                <Input
                  value={unitPhone}
                  onChange={(e) => setUnitPhone(e.target.value)}
                  placeholder="(75) 3602-5500"
                  className="text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                E-mail Institucional
              </label>
              <Input
                type="email"
                value={unitEmail}
                onChange={(e) => setUnitEmail(e.target.value)}
                placeholder="brs.unidade@saude.ba.gov.br"
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Endereço Físico
              </label>
              <Input
                value={unitAddress}
                onChange={(e) => setUnitAddress(e.target.value)}
                placeholder="Av. Exemplo, 1200 - Bairro, Cidade - BA"
                className="text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsUnitModalOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={unitLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                {unitLoading ? "Salvando..." : "Salvar Unidade"}
              </Button>
            </div>
          </form>
        </Dialog>
      )}

      {/* ========================================================================= */}
      {/* MODAL: GERENCIAR FARMACÊUTICOS DA BASE */}
      {/* ========================================================================= */}
      {isPharmacistModalOpen && activeUnitForPharm && (
        <Dialog
          open={true}
          onOpenChange={() => setIsPharmacistModalOpen(false)}
          title={`Equipe Farmacêutica: ${activeUnitForPharm.name}`}
          description="Cadastre os farmacêuticos responsáveis técnicos com número de CRF, telefone e e-mail."
          maxWidth="lg"
        >
          <div className="space-y-4">
            {/* Formulário Novo Farmacêutico */}
            <form onSubmit={handleAddPharmacist} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <span className="font-semibold text-xs text-slate-800 block">
                Adicionar Farmacêutico à Unidade
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nome Completo *
                  </label>
                  <Input
                    value={newPharmName}
                    onChange={(e) => setNewPharmName(e.target.value)}
                    placeholder="Dr(a). Nome do Farmacêutico"
                    required
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Número do CRF *
                  </label>
                  <Input
                    value={newPharmCrf}
                    onChange={(e) => setNewPharmCrf(e.target.value)}
                    placeholder="CRF-BA 1234"
                    required
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Telefone de Contato
                  </label>
                  <Input
                    value={newPharmPhone}
                    onChange={(e) => setNewPharmPhone(e.target.value)}
                    placeholder="(71) 99999-0000"
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    E-mail Institucional
                  </label>
                  <Input
                    type="email"
                    value={newPharmEmail}
                    onChange={(e) => setNewPharmEmail(e.target.value)}
                    placeholder="farmaceutico@saude.ba.gov.br"
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPharmIsRt}
                    onChange={(e) => setNewPharmIsRt(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Responsável Técnico (RT Titular da Unidade)</span>
                </label>

                <Button
                  type="submit"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Vincular Farmacêutico
                </Button>
              </div>
            </form>

            {/* Lista dos Farmacêuticos Atuais */}
            <div className="space-y-2">
              <span className="font-semibold text-xs text-slate-700 block">
                Farmacêuticos Vinculados ({activeUnitForPharm.responsible_pharmacists?.length || 0})
              </span>

              {(!activeUnitForPharm.responsible_pharmacists || activeUnitForPharm.responsible_pharmacists.length === 0) ? (
                <p className="text-xs text-slate-400 py-3 text-center border border-dashed rounded">
                  Nenhum farmacêutico cadastrado nesta base.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {activeUnitForPharm.responsible_pharmacists.map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          <span>{p.full_name}</span>
                          <span className="font-mono text-slate-500">({p.crf})</span>
                          {p.is_technical_lead && (
                            <Badge className="text-[8px] bg-emerald-600 text-white">
                              RT
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {p.phone && <span>Tel: {p.phone} • </span>}
                          {p.email && <span>E-mail: {p.email}</span>}
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePharmacist(p.id)}
                        className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 h-7 w-7 p-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPharmacistModalOpen(false)}
                className="text-xs"
              >
                Concluir
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* ========================================================================= */}
      {/* MODAL: GERENCIAR MUNICÍPIOS ABRANGIDOS DA BASE */}
      {/* ========================================================================= */}
      {isMunicipalitiesModalOpen && activeUnitForMuns && (
        <Dialog
          open={true}
          onOpenChange={() => setIsMunicipalitiesModalOpen(false)}
          title={`Municípios Jurisdicionados: ${activeUnitForMuns.name}`}
          description="Vincule ou remova municípios sob responsabilidade desta Base Regional."
          maxWidth="lg"
        >
          <div className="space-y-4">
            {/* Vincular novo município */}
            <div className="flex gap-2">
              <select
                value={selectedMunIdToAdd}
                onChange={(e) => setSelectedMunIdToAdd(e.target.value)}
                className="flex-1 text-xs p-2 rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Selecione um município da Bahia para vincular...</option>
                {municipios
                  .slice()
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} - BA ({m.brs_name ? `Atual: BRS ${m.brs_name}` : "Sem BRS"})
                    </option>
                  ))}
              </select>

              <Button
                type="button"
                size="sm"
                onClick={handleAddMunicipality}
                disabled={!selectedMunIdToAdd}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Vincular
              </Button>
            </div>

            {/* Lista dos Municípios Atuais */}
            <div className="space-y-2">
              <span className="font-semibold text-xs text-slate-700 block">
                Municípios Atendidos por esta Base ({unitMunicipalitiesMap[activeUnitForMuns.id]?.length || 0})
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto p-1 border rounded-lg bg-slate-50">
                {(unitMunicipalitiesMap[activeUnitForMuns.id] || []).map((m) => (
                  <div
                    key={m.id}
                    className="p-2 bg-white rounded border border-slate-200 text-xs flex items-center justify-between gap-1"
                  >
                    <span className="font-medium text-slate-800 truncate">{m.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMunicipality(m.id)}
                      className="text-slate-400 hover:text-rose-600 h-6 w-6 p-0"
                      title="Desvincular"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsMunicipalitiesModalOpen(false)}
                className="text-xs"
              >
                Fechar
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDITAR MUNICÍPIO */}
      {/* ========================================================================= */}
      {isMunEditModalOpen && editingMun && (
        <Dialog
          open={true}
          onOpenChange={() => setIsMunEditModalOpen(false)}
          title={`Editar Município: ${editingMun.name}`}
          description="Altere a Base Regional (BRS) de vínculo ou dados do município."
          maxWidth="md"
        >
          <form onSubmit={handleSaveEditMun} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome do Município *
              </label>
              <Input
                value={editMunName}
                onChange={(e) => setEditMunName(e.target.value)}
                required
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Código IBGE
                </label>
                <Input
                  value={editMunIbge}
                  onChange={(e) => setEditMunIbge(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Farmacêutico RT / Equipe
                </label>
                <div className="text-xs p-2 rounded-md bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-1.5 font-medium truncate">
                  <Stethoscope className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="truncate">{editingMun?.responsible_pharmacist || "Equipe da Base Regional"}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Base Regional (BRS) Vinculada *
              </label>
              <select
                value={editMunBrsName}
                onChange={(e) => setEditMunBrsName(e.target.value)}
                className="w-full text-xs p-2 rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="">Selecione a BRS de referência...</option>
                {BAHIA_BRS.map((b) => (
                  <option key={b.id} value={b.name.replace(/^BRS\s+/i, "")}>
                    {b.name} ({b.macroregion})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsMunEditModalOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                Salvar Alterações
              </Button>
            </div>
          </form>
        </Dialog>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NOVA / EDITAR ORIGEM */}
      {/* ========================================================================= */}
      {isOrigemModalOpen && (
        <Dialog
          open={true}
          onOpenChange={() => setIsOrigemModalOpen(false)}
          title={editingOrigem ? "Editar Origem de Demanda" : "Nova Origem de Demanda"}
          description="Cadastre órgãos ou canais oficiais que originam processos no CIMBAHIA."
          maxWidth="md"
        >
          <form onSubmit={handleSaveOrigem} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome da Origem / Entidade *
              </label>
              <Input
                value={origemName}
                onChange={(e) => setOrigemName(e.target.value)}
                placeholder="Ex: Tribunal de Justiça da Bahia"
                required
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sigla de Identificação
              </label>
              <Input
                value={origemSigla}
                onChange={(e) => setOrigemSigla(e.target.value)}
                placeholder="Ex: TJ-BA"
                className="text-xs font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Descrição e Finalidade
              </label>
              <textarea
                rows={3}
                value={origemDesc}
                onChange={(e) => setOrigemDesc(e.target.value)}
                placeholder="Descrição dos tipos de processos encaminhados por este órgão..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsOrigemModalOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                Salvar Origem
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}
