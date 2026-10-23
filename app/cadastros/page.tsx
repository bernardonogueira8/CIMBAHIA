"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  FolderOpen,
  PlusCircle,
  Search,
  Pill,
  BookOpen,
  CheckCircle,
  AlertCircle,
  FileText,
  Pencil,
  EyeOff,
  Eye,
  Check,
  AlertTriangle,
  Scale,
  Sparkles,
  ClipboardCheck,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
} from "lucide-react";
import { useApp } from "@/lib/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { CID, Farmaco, TipoParecer } from "@/lib/types";
import { matchNormalized } from "@/lib/utils";

export default function CadastrosPage() {
  const {
    farmacos,
    tiposParecer,
    currentUser,
    addCID,
    updateCID,
    toggleCIDActive,
    addFarmaco,
    updateFarmaco,
    toggleFarmacoActive,
    deleteFarmaco,
    addTipoParecer,
    updateTipoParecer,
    toggleTipoParecerActive,
    importCIDsBatch,
  } = useApp();

  const isGestor = currentUser?.role === "admin" || currentUser?.role === "gestor";

  const [activeTab, setActiveTab] = useState<"farmacos" | "cids" | "tipos_parecer">("farmacos");

  // =========================================================================
  // 1. ESTADOS: FÁRMACOS & APRESENTAÇÕES (ANVISA / SUS)
  // =========================================================================
  const [farmacoSearch, setFarmacoSearch] = useState("");
  const [farmacoComponentFilter, setFarmacoComponentFilter] = useState("all");
  const [farmacoPage, setFarmacoPage] = useState(1);
  const [farmacoPageSize, setFarmacoPageSize] = useState(50);

  // Modal Novo / Editar Fármaco
  const [isFarmacoModalOpen, setIsFarmacoModalOpen] = useState(false);
  const [editingFarmaco, setEditingFarmaco] = useState<Farmaco | null>(null);
  const [farmacoName, setFarmacoName] = useState("");
  const [farmacoComponent, setFarmacoComponent] = useState("Componente Especializado / SUS");
  const [farmacoActive, setFarmacoActive] = useState(true);

  // =========================================================================
  // 2. ESTADOS: CIDs (CID-10)
  // =========================================================================
  const [cidSearch, setCidSearch] = useState("");
  const [cidPage, setCidPage] = useState(1);
  const [cidPageSize, setCidPageSize] = useState(50);
  const [pagedCids, setPagedCids] = useState<CID[]>([]);
  const [cidTotal, setCidTotal] = useState(0);
  const [isLoadingCids, setIsLoadingCids] = useState(false);
  const [cidLoadError, setCidLoadError] = useState("");
  const [cidRefreshKey, setCidRefreshKey] = useState(0);

  const [isCidModalOpen, setIsCidModalOpen] = useState(false);
  const [editingCid, setEditingCid] = useState<CID | null>(null);
  const [cidCode, setCidCode] = useState("");
  const [cidDesc, setCidDesc] = useState("");
  const [cidChapter, setCidChapter] = useState("");
  const [cidSaveError, setCidSaveError] = useState("");

  // =========================================================================
  // 3. ESTADOS: TIPOS DE PARECER
  // =========================================================================
  const [isTipoModalOpen, setIsTipoModalOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoParecer | null>(null);
  const [tipoCode, setTipoCode] = useState("");
  const [tipoTitle, setTipoTitle] = useState("");
  const [tipoEffect, setTipoEffect] = useState<TipoParecer["regulatory_effect"]>("deferido");
  const [tipoDesc, setTipoDesc] = useState("");

  // =========================================================================
  // FILTRAGEM E PAGINAÇÃO: FÁRMACOS
  // =========================================================================
  const filteredFarmacos = useMemo(() => {
    return farmacos.filter((f) => {
      const matchSearch =
        matchNormalized(f.name, farmacoSearch) ||
        matchNormalized(f.component, farmacoSearch);
      if (!matchSearch) return false;

      if (farmacoComponentFilter !== "all") {
        if (f.component !== farmacoComponentFilter) return false;
      }

      return true;
    });
  }, [farmacos, farmacoSearch, farmacoComponentFilter]);

  const totalFarmacoPages = Math.ceil(filteredFarmacos.length / farmacoPageSize) || 1;
  const pagedFarmacos = useMemo(() => {
    const start = (farmacoPage - 1) * farmacoPageSize;
    return filteredFarmacos.slice(start, start + farmacoPageSize);
  }, [filteredFarmacos, farmacoPage, farmacoPageSize]);

  // Lista de componentes únicos para o filtro
  const availableComponents = useMemo(() => {
    const set = new Set<string>();
    farmacos.forEach((f) => {
      if (f.component) set.add(f.component);
    });
    return Array.from(set);
  }, [farmacos]);

  // Handlers Fármaco
  const handleOpenFarmacoModal = (f?: Farmaco) => {
    if (f) {
      setEditingFarmaco(f);
      setFarmacoName(f.name);
      setFarmacoComponent(f.component || "Componente Especializado / SUS");
      setFarmacoActive(f.active);
    } else {
      setEditingFarmaco(null);
      setFarmacoName("");
      setFarmacoComponent("Componente Especializado / SUS");
      setFarmacoActive(true);
    }
    setIsFarmacoModalOpen(true);
  };

  const handleSaveFarmaco = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmacoName.trim()) return;

    if (editingFarmaco) {
      await updateFarmaco(editingFarmaco.id, {
        name: farmacoName.trim(),
        component: farmacoComponent.trim() || null,
        active: farmacoActive,
      });
    } else {
      await addFarmaco({
        name: farmacoName.trim(),
        component: farmacoComponent.trim() || null,
        active: true,
      });
    }
    setIsFarmacoModalOpen(false);
  };

  // =========================================================================
  // FILTRAGEM E PAGINAÇÃO: CIDs
  // =========================================================================
  useEffect(() => {
    let active = true;
    const abortController = new AbortController();
    setIsLoadingCids(true);
    setCidLoadError("");

    const loadCids = async () => {
      const searchParams = new URLSearchParams({
        q: cidSearch,
        page: String(cidPage),
        limit: String(cidPageSize),
      });
      const response = await fetch(`/api/cids?${searchParams}`, {
        signal: abortController.signal,
      });
      if (!active) return;

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || "Não foi possível consultar cb_cids.");
      }
      const result: { total: number; cids: CID[] } = await response.json();
      if (!active) return;

      setPagedCids(result.cids);
      setCidTotal(result.total);
      setIsLoadingCids(false);
    };

    const timeoutId = window.setTimeout(() => {
      loadCids().catch((error: unknown) => {
        if (!active || (error instanceof Error && error.name === "AbortError")) return;
        console.error("Erro ao buscar CIDs no Supabase:", error);
        setCidLoadError(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os CIDs do Supabase."
        );
        setPagedCids([]);
        setCidTotal(0);
        setIsLoadingCids(false);
      });
    }, 250);

    return () => {
      active = false;
      abortController.abort();
      window.clearTimeout(timeoutId);
    };
  }, [cidPage, cidPageSize, cidRefreshKey, cidSearch]);

  const totalCidPages = Math.ceil(cidTotal / cidPageSize) || 1;

  // Handlers CID
  const handleOpenCidModal = (cid?: CID) => {
    setCidSaveError("");
    if (cid) {
      setEditingCid(cid);
      setCidCode(cid.code);
      setCidDesc(cid.description);
      setCidChapter(cid.chapter || "");
    } else {
      setEditingCid(null);
      setCidCode("");
      setCidDesc("");
      setCidChapter("");
    }
    setIsCidModalOpen(true);
  };

  const handleSaveCid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cidCode.trim() || !cidDesc.trim()) return;

    try {
      if (editingCid) {
        const result = await updateCID(editingCid.id, {
          code: cidCode.trim().toUpperCase(),
          description: cidDesc.trim(),
          chapter: cidChapter.trim() || null,
        });
        if (!result.success) throw new Error(result.error || "Não foi possível atualizar o CID.");
      } else {
        await addCID({
          code: cidCode.trim().toUpperCase(),
          description: cidDesc.trim(),
          active: true,
        });
      }
      setCidRefreshKey((key) => key + 1);
      setIsCidModalOpen(false);
    } catch (error) {
      console.error("Erro ao salvar CID no Supabase:", error);
      setCidSaveError(
        error instanceof Error ? error.message : "Não foi possível salvar o CID."
      );
    }
  };

  // =========================================================================
  // HANDLERS: TIPOS DE PARECER
  // =========================================================================
  const handleOpenTipoModal = (tipo?: TipoParecer) => {
    if (tipo) {
      setEditingTipo(tipo);
      setTipoCode(tipo.code);
      setTipoTitle(tipo.title);
      setTipoEffect(tipo.regulatory_effect);
      setTipoDesc(tipo.description || "");
    } else {
      setEditingTipo(null);
      setTipoCode(`TP-${tiposParecer.length + 1}`);
      setTipoTitle("");
      setTipoEffect("deferido");
      setTipoDesc("");
    }
    setIsTipoModalOpen(true);
  };

  const handleSaveTipo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipoTitle.trim()) return;

    if (editingTipo) {
      await updateTipoParecer(editingTipo.id, {
        code: tipoCode.trim().toUpperCase(),
        title: tipoTitle.trim(),
        regulatory_effect: tipoEffect,
        description: tipoDesc.trim() || null,
      });
    } else {
      await addTipoParecer({
        code: tipoCode.trim().toUpperCase(),
        title: tipoTitle.trim(),
        regulatory_effect: tipoEffect,
        description: tipoDesc.trim() || null,
        active: true,
      });
    }
    setIsTipoModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Pill className="h-6 w-6 text-emerald-600" />
            Catálogo Unificado de Fármacos & CIDs
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestão simplificada: Fármaco / Apresentação, Componente oficial e Classificação Internacional de Doenças (CID-10).
          </p>
        </div>

        {isGestor && (
          <div className="flex items-center gap-2">
            {activeTab === "farmacos" && (
              <Button
                onClick={() => handleOpenFarmacoModal()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 text-xs"
              >
                <PlusCircle className="h-4 w-4" />
                Novo Fármaco
              </Button>
            )}

            {activeTab === "cids" && (
              <Button
                onClick={() => handleOpenCidModal()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 text-xs"
              >
                <PlusCircle className="h-4 w-4" />
                Novo CID-10
              </Button>
            )}

            {activeTab === "tipos_parecer" && (
              <Button
                onClick={() => handleOpenTipoModal()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 text-xs"
              >
                <PlusCircle className="h-4 w-4" />
                Novo Tipo de Parecer
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-700">Fármacos Cadastrados</span>
              <Pill className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {farmacos.length.toLocaleString("pt-BR")}
            </div>
            <span className="text-[11px] text-slate-500">Substâncias ativas / Apresentações</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-blue-700">Catálogo CID-10</span>
              <BookOpen className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {cidTotal.toLocaleString("pt-BR")}
            </div>
            <span className="text-[11px] text-slate-500">Diagnósticos clínicos cadastrados</span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-indigo-700">Tipos de Parecer</span>
              <Scale className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{tiposParecer.length}</div>
            <span className="text-[11px] text-slate-500">Modelos de laudo regulatório</span>
          </CardContent>
        </Card>
      </div>

      {/* Abas */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("farmacos")}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "farmacos"
              ? "border-emerald-600 text-emerald-700 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Pill className="h-4 w-4" />
          Fármacos & Apresentações ({farmacos.length.toLocaleString("pt-BR")})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("cids")}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "cids"
              ? "border-emerald-600 text-emerald-700 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Diagnósticos CID-10 ({cidTotal.toLocaleString("pt-BR")})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("tipos_parecer")}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "tipos_parecer"
              ? "border-emerald-600 text-emerald-700 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Scale className="h-4 w-4" />
          Tipos de Parecer ({tiposParecer.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: FÁRMACOS & APRESENTAÇÕES (SIMPLES: FÁRMACO + COMPONENTE) */}
      {/* ========================================================================= */}
      {activeTab === "farmacos" && (
        <Card>
          <CardHeader className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold text-slate-800">
                Catálogo de Fármacos & Apresentações ({filteredFarmacos.length.toLocaleString("pt-BR")})
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Lista unificada de substâncias ativas da Anvisa e Componentes do SUS (Fonte: Farmacos.xlsx).
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Barra de Filtros */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Pesquisar por nome do fármaco ou substância ativa..."
                  value={farmacoSearch}
                  onChange={(e) => {
                    setFarmacoSearch(e.target.value);
                    setFarmacoPage(1);
                  }}
                  className="pl-9 text-xs"
                />
              </div>

              <select
                value={farmacoComponentFilter}
                onChange={(e) => {
                  setFarmacoComponentFilter(e.target.value);
                  setFarmacoPage(1);
                }}
                className="w-full sm:w-72 h-9 text-xs rounded-md border border-slate-200 bg-white px-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Todos os Componentes</option>
                {availableComponents.map((comp) => (
                  <option key={comp} value={comp}>
                    {comp}
                  </option>
                ))}
                <option value="Componente Básico">Componente Básico</option>
                <option value="Componente Estratégico">Componente Estratégico</option>
                <option value="Não Padronizado / Judicial">Não Padronizado / Judicial</option>
              </select>
            </div>

            {/* Tabela de Fármacos */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Fármaco / Apresentação</th>
                    <th className="py-2.5 px-3">Componente</th>
                    <th className="py-2.5 px-3">Status</th>
                    {isGestor && <th className="py-2.5 px-3 text-right">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pagedFarmacos.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-900">{f.name}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-slate-50 text-slate-700 border-slate-200"
                        >
                          {f.component || "Componente Especializado / SUS"}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3">
                        {f.active !== false ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[9px]">
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-400 text-[9px]">
                            Inativo
                          </Badge>
                        )}
                      </td>
                      {isGestor && (
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenFarmacoModal(f)}
                              className="h-7 text-xs text-slate-500 hover:text-slate-800"
                            >
                              <Pencil className="h-3 w-3 mr-1" />
                              Editar
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleFarmacoActive(f.id, !f.active)}
                              className={`h-7 text-xs ${
                                f.active ? "text-slate-400 hover:text-rose-600" : "text-emerald-600 hover:text-emerald-800"
                              }`}
                            >
                              {f.active ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </Button>
                          </div>
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
                Exibindo {pagedFarmacos.length} de {filteredFarmacos.length.toLocaleString("pt-BR")} fármacos
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFarmacoPage(1)}
                  disabled={farmacoPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFarmacoPage((prev) => Math.max(prev - 1, 1))}
                  disabled={farmacoPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="px-2 font-medium">
                  Página {farmacoPage} de {totalFarmacoPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFarmacoPage((prev) => Math.min(prev + 1, totalFarmacoPages))}
                  disabled={farmacoPage === totalFarmacoPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFarmacoPage(totalFarmacoPages)}
                  disabled={farmacoPage === totalFarmacoPages}
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
      {/* ABA 2: CATÁLOGO DE CIDs (CID-10) */}
      {/* ========================================================================= */}
      {activeTab === "cids" && (
        <Card>
          <CardHeader className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold text-slate-800">
                Classificação Internacional de Doenças (CID-10) ({cidTotal.toLocaleString("pt-BR")})
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Catálogo de diagnósticos clínicos utilizados na fundamentação de pareceres.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Pesquisar por código CID ou descrição..."
                value={cidSearch}
                onChange={(e) => {
                  setCidSearch(e.target.value);
                  setCidPage(1);
                }}
                className="pl-9 text-xs"
              />
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Descrição Clínica</th>
                    <th className="py-2.5 px-3">Capítulo</th>
                    <th className="py-2.5 px-3">Status</th>
                    {isGestor && <th className="py-2.5 px-3 text-right">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cidLoadError && (
                    <tr>
                      <td
                        colSpan={isGestor ? 5 : 4}
                        className="px-3 py-6 text-center text-rose-700"
                      >
                        {cidLoadError}
                      </td>
                    </tr>
                  )}
                  {isLoadingCids && (
                    <tr>
                      <td
                        colSpan={isGestor ? 5 : 4}
                        className="px-3 py-6 text-center text-slate-500"
                      >
                        Buscando CIDs no Supabase...
                      </td>
                    </tr>
                  )}
                  {!isLoadingCids && !cidLoadError && pagedCids.length === 0 && (
                    <tr>
                      <td
                        colSpan={isGestor ? 5 : 4}
                        className="px-3 py-6 text-center text-slate-500"
                      >
                        Nenhum CID encontrado no Supabase.
                      </td>
                    </tr>
                  )}
                  {pagedCids.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">{c.code}</td>
                      <td className="py-2.5 px-3 text-slate-800 font-medium">{c.description}</td>
                      <td className="py-2.5 px-3 text-slate-500">{c.chapter || "---"}</td>
                      <td className="py-2.5 px-3">
                        {c.active !== false ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[9px]">
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-400 text-[9px]">
                            Inativo
                          </Badge>
                        )}
                      </td>
                      {isGestor && (
                        <td className="py-2.5 px-3 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenCidModal(c)}
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

            {/* Paginação CIDs */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
              <div>
                Exibindo {pagedCids.length} de {cidTotal.toLocaleString("pt-BR")} CIDs
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCidPage(1)}
                  disabled={cidPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCidPage((prev) => Math.max(prev - 1, 1))}
                  disabled={cidPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="px-2 font-medium">
                  Página {cidPage} de {totalCidPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCidPage((prev) => Math.min(prev + 1, totalCidPages))}
                  disabled={cidPage === totalCidPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCidPage(totalCidPages)}
                  disabled={cidPage === totalCidPages}
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
      {/* ABA 3: TIPOS DE PARECER */}
      {/* ========================================================================= */}
      {activeTab === "tipos_parecer" && (
        <Card>
          <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-800">
                Modelos de Parecer Técnico Regulatório
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Classificação legal e efeito regulatório utilizado pelos farmacêuticos pareceristas.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {tiposParecer.map((t) => (
                <div
                  key={t.id}
                  className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{t.title}</span>
                      <Badge
                        className={`text-[9px] uppercase ${
                          t.regulatory_effect === "deferido"
                            ? "bg-emerald-600 text-white"
                            : t.regulatory_effect === "indeferido"
                            ? "bg-rose-600 text-white"
                            : t.regulatory_effect === "exigencia"
                            ? "bg-amber-600 text-white"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        {t.regulatory_effect}
                      </Badge>
                    </div>
                    {t.description && <p className="text-[11px] text-slate-500">{t.description}</p>}
                  </div>

                  {isGestor && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenTipoModal(t)}
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
      {/* MODAL: NOVO / EDITAR FÁRMACO (CAMPOS SIMPLES: FÁRMACO/APRESENTAÇÃO + COMPONENTE) */}
      {/* ========================================================================= */}
      {isFarmacoModalOpen && (
        <Dialog
          open={true}
          onOpenChange={() => setIsFarmacoModalOpen(false)}
          title={editingFarmaco ? "Editar Fármaco / Apresentação" : "Novo Fármaco / Apresentação"}
          description="Informe o nome da substância ativa/apresentação e o componente de saúde."
          maxWidth="md"
        >
          <form onSubmit={handleSaveFarmaco} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fármaco / Apresentação (Substância Ativa) *
              </label>
              <Input
                value={farmacoName}
                onChange={(e) => setFarmacoName(e.target.value)}
                placeholder="Ex: Adalimumabe 40mg/0,8mL, Canabidiol 200mg/mL..."
                required
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Componente do SUS / Terapêutica *
              </label>
              <select
                value={farmacoComponent}
                onChange={(e) => setFarmacoComponent(e.target.value)}
                className="w-full text-xs p-2 rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="Componente Especializado / SUS">Componente Especializado / SUS</option>
                <option value="Componente Básico">Componente Básico</option>
                <option value="Componente Estratégico">Componente Estratégico</option>
                <option value="Não Padronizado / Judicial">Não Padronizado / Demanda Judicial</option>
                <option value="Fórmula Nutricional Especial">Fórmula Nutricional Especial</option>
                <option value="Insumo Especial de Saúde">Insumo Especial de Saúde</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={farmacoActive}
                  onChange={(e) => setFarmacoActive(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Fármaco Ativo para Seleção</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsFarmacoModalOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                Salvar Fármaco
              </Button>
            </div>
          </form>
        </Dialog>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NOVO / EDITAR CID-10 */}
      {/* ========================================================================= */}
      {isCidModalOpen && (
        <Dialog
          open={true}
          onOpenChange={() => setIsCidModalOpen(false)}
          title={editingCid ? "Editar Diagnóstico CID-10" : "Novo Diagnóstico CID-10"}
          description="Informe o código oficial da OMS e a descrição clínica correspondente."
          maxWidth="md"
        >
          <form onSubmit={handleSaveCid} className="space-y-3">
            {cidSaveError && (
              <p role="alert" className="text-xs text-rose-700">
                {cidSaveError}
              </p>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Código CID-10 *
              </label>
              <Input
                value={cidCode}
                onChange={(e) => setCidCode(e.target.value)}
                placeholder="Ex: M05.8, E10.9, G35..."
                required
                className="text-xs font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Descrição Diagnóstica *
              </label>
              <Input
                value={cidDesc}
                onChange={(e) => setCidDesc(e.target.value)}
                placeholder="Descrição clínica oficial..."
                required
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Capítulo / Grupo (Opcional)
              </label>
              <Input
                value={cidChapter}
                onChange={(e) => setCidChapter(e.target.value)}
                placeholder="Ex: Doenças do sistema osteomuscular..."
                className="text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsCidModalOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                Salvar CID
              </Button>
            </div>
          </form>
        </Dialog>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NOVO / EDITAR TIPO DE PARECER */}
      {/* ========================================================================= */}
      {isTipoModalOpen && (
        <Dialog
          open={true}
          onOpenChange={() => setIsTipoModalOpen(false)}
          title={editingTipo ? "Editar Tipo de Parecer" : "Novo Tipo de Parecer"}
          description="Defina o título e efeito regulatório do laudo pericial."
          maxWidth="md"
        >
          <form onSubmit={handleSaveTipo} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Código / Sigla *
              </label>
              <Input
                value={tipoCode}
                onChange={(e) => setTipoCode(e.target.value)}
                placeholder="Ex: TP-DEF, TP-IND..."
                required
                className="text-xs font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Título do Parecer *
              </label>
              <Input
                value={tipoTitle}
                onChange={(e) => setTipoTitle(e.target.value)}
                placeholder="Ex: Parecer Técnico Favorável ao Fornecimento..."
                required
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Efeito Regulatório *
              </label>
              <select
                value={tipoEffect}
                onChange={(e) =>
                  setTipoEffect(e.target.value as TipoParecer["regulatory_effect"])
                }
                className="w-full text-xs p-2 rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="deferido">Deferido (Favorável)</option>
                <option value="indeferido">Indeferido (Desfavorável)</option>
                <option value="exigencia">Em Exigência (Diligência / Pendência)</option>
                <option value="deferido_parcial">Deferido Parcial</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Descrição e Finalidade
              </label>
              <textarea
                rows={2}
                value={tipoDesc}
                onChange={(e) => setTipoDesc(e.target.value)}
                placeholder="Finalidade deste tipo de parecer regulatório..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsTipoModalOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                Salvar Tipo
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}
