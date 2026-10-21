"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  PlusCircle,
  Search,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Eye,
  UserCheck,
  Building,
  Pill,
  ShieldCheck,
  ArrowRight,
  Filter,
  Trash2,
} from "lucide-react";
import { useApp } from "@/lib/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { Processo, ProcessoStatus, isProcessoInFirstStatus } from "@/lib/types";

export default function AtendimentosPage() {
  const router = useRouter();
  const {
    processos,
    currentUser,
    origens,
    atribuirFarmaceuticoProcesso,
    transicionarProcessoStatus,
    deleteProcesso,
  } = useApp();

  const isFarmaceutico =
    currentUser?.role === "farmaceutico" ||
    currentUser?.role === "admin" ||
    currentUser?.role === "gestor";

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [origemFilter, setOrigemFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Estado para exclusão de processo
  const [processoToDelete, setProcessoToDelete] = useState<Processo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Mapeamento normalizado para os 4 status simplificados
  const getNormalizedStage = (st: ProcessoStatus): "triagem" | "aguardando_parecer" | "em_analise" | "concluido" => {
    if (st === "triagem" || st === "aguardando_triagem" || st === "em_triagem") return "triagem";
    if (st === "aguardando_parecer") return "aguardando_parecer";
    if (st === "em_analise" || st === "em_analise_farmaceutica" || st === "em_exigencia") {
      return "em_analise";
    }
    return "concluido";
  };

  // Filtragem dos processos
  const filteredProcessos = useMemo(() => {
    return processos.filter((p) => {
      // Busca textual
      const matchesSearch =
        p.numero_sei.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.paciente?.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.paciente?.cpf || "").includes(searchTerm) ||
        (p.municipio?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.assunto || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.items.some(
          (item) =>
            (item.farmaco_substancia || item.medication_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.cid_code.toLowerCase().includes(searchTerm.toLowerCase())
        );

      if (!matchesSearch) return false;

      // Status
      if (statusFilter !== "all") {
        const stage = getNormalizedStage(p.status);
        if (statusFilter === "triagem" && stage !== "triagem") return false;
        if (statusFilter === "aguardando_parecer" && stage !== "aguardando_parecer") return false;
        if (statusFilter === "em_analise" && stage !== "em_analise") return false;
        if (statusFilter === "concluido" && stage !== "concluido") return false;
      }

      // Origem
      if (origemFilter !== "all" && p.origem_id !== origemFilter) {
        return false;
      }

      // Prioridade
      if (priorityFilter !== "all" && p.priority !== priorityFilter) {
        return false;
      }

      return true;
    });
  }, [processos, searchTerm, statusFilter, origemFilter, priorityFilter]);

  // Contadores para os Cards de Métricas (Sequência de 4 etapas)
  const metrics = useMemo(() => {
    const total = processos.length;
    let triagem = 0;
    let aguardandoParecer = 0;
    let emAnalise = 0;
    let concluido = 0;

    processos.forEach((p) => {
      const stage = getNormalizedStage(p.status);
      if (stage === "triagem") triagem++;
      else if (stage === "aguardando_parecer") aguardandoParecer++;
      else if (stage === "em_analise") emAnalise++;
      else if (stage === "concluido") concluido++;
    });

    const gargalos = processos.filter(
      (p) => (p.days_in_current_status || 0) >= 5 && getNormalizedStage(p.status) !== "concluido"
    ).length;

    return { total, triagem, aguardandoParecer, emAnalise, concluido, gargalos };
  }, [processos]);

  // Navegar para a tela individual do processo
  const handleOpenProcesso = (procId: string) => {
    router.push(`/atendimentos/${procId}`);
  };

  // Puxar da Fila / Assumir Parecer e abrir diretamente a tela de análise
  const handleAssumirParecer = async (procId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    try {
      await atribuirFarmaceuticoProcesso(procId, currentUser.id);
      await transicionarProcessoStatus(
        procId,
        "em_analise",
        `Processo assumido da fila por ${currentUser.full_name}.`
      );
      router.push(`/atendimentos/${procId}`);
    } catch (err) {
      console.error(err);
      alert("Erro ao assumir o parecer.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!processoToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await deleteProcesso(processoToDelete.id);
      if (!res.success) {
        setDeleteError(res.error || "Não foi possível excluir o processo.");
      } else {
        setProcessoToDelete(null);
      }
    } catch (err: unknown) {
      setDeleteError((err as Error).message || "Erro ao excluir processo.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getPriorityBadge = (priority: Processo["priority"]) => {
    switch (priority) {
      case "urgente":
        return (
          <Badge variant="danger" className="text-[10px] uppercase font-semibold">
            Urgente
          </Badge>
        );
      case "judicial":
        return (
          <Badge className="text-[10px] uppercase font-semibold bg-purple-700 text-white">
            Judicial
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px] text-slate-600 bg-slate-50">
            Normal
          </Badge>
        );
    }
  };

  const getStageBadge = (status: ProcessoStatus) => {
    const stage = getNormalizedStage(status);
    switch (stage) {
      case "concluido":
        return (
          <Badge className="bg-emerald-600 text-white text-[10px] flex items-center gap-1 font-semibold">
            <CheckCircle2 className="h-3 w-3" />
            Concluído
          </Badge>
        );
      case "em_analise":
        return (
          <Badge className="bg-amber-600 text-white text-[10px] flex items-center gap-1 font-semibold">
            <ShieldCheck className="h-3 w-3" />
            Em Análise
          </Badge>
        );
      case "aguardando_parecer":
        return (
          <Badge className="bg-blue-600 text-white text-[10px] flex items-center gap-1 font-semibold">
            <Clock className="h-3 w-3" />
            Aguardando Parecer
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-600 text-white text-[10px] flex items-center gap-1 font-semibold">
            <FileText className="h-3 w-3" />
            Triagem
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Fila de Atendimentos & Processos SEI
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestão unificada do fluxo: Criar Processo (Triagem) → Aguardando Parecer → Em Análise → Concluído.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/atendimentos/novo">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-2 text-xs">
              <PlusCircle className="h-4 w-4" />
              Novo Processo SEI
            </Button>
          </Link>
        </div>
      </div>

      {/* Cards de Métricas Operacionais (4 Etapas Sequenciais) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card
          onClick={() => setStatusFilter("all")}
          className={`cursor-pointer transition-all border ${
            statusFilter === "all" ? "ring-2 ring-emerald-500 bg-emerald-50/20" : "hover:border-slate-300"
          }`}
        >
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Geral</span>
              <FileText className="h-4 w-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{metrics.total}</div>
            <span className="text-[11px] text-slate-500">Processos autuados</span>
          </CardContent>
        </Card>

        {/* 1. Criar Processo (Triagem) */}
        <Card
          onClick={() => setStatusFilter("triagem")}
          className={`cursor-pointer transition-all border ${
            statusFilter === "triagem" ? "ring-2 ring-slate-500 bg-slate-50" : "hover:border-slate-300"
          }`}
        >
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700">1. Triagem</span>
              <FileText className="h-4 w-4 text-slate-500" />
            </div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{metrics.triagem}</div>
            <span className="text-[11px] text-slate-500">Abertura de processo</span>
          </CardContent>
        </Card>

        {/* 2. Aguardando Parecer */}
        <Card
          onClick={() => setStatusFilter("aguardando_parecer")}
          className={`cursor-pointer transition-all border ${
            statusFilter === "aguardando_parecer" ? "ring-2 ring-blue-500 bg-blue-50/20" : "hover:border-slate-300"
          }`}
        >
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-blue-700">2. Aguardando Parecer</span>
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-700 mt-1">{metrics.aguardandoParecer}</div>
            <span className="text-[11px] text-slate-500">Fila para assumir</span>
          </CardContent>
        </Card>

        {/* 3. Em Análise */}
        <Card
          onClick={() => setStatusFilter("em_analise")}
          className={`cursor-pointer transition-all border ${
            statusFilter === "em_analise" ? "ring-2 ring-amber-500 bg-amber-50/20" : "hover:border-slate-300"
          }`}
        >
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-700">3. Em Análise</span>
              <ShieldCheck className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-700 mt-1">{metrics.emAnalise}</div>
            <span className="text-[11px] text-slate-500">Com parecerista</span>
          </CardContent>
        </Card>

        {/* 4. Concluído */}
        <Card
          onClick={() => setStatusFilter("concluido")}
          className={`cursor-pointer transition-all border ${
            statusFilter === "concluido" ? "ring-2 ring-emerald-500 bg-emerald-50/20" : "hover:border-slate-300"
          }`}
        >
          <CardContent className="p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-700">4. Concluído</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{metrics.concluido}</div>
            <span className="text-[11px] text-slate-500">Parecer finalizado</span>
          </CardContent>
        </Card>
      </div>

      {/* Alerta de Gargalos Operacionais */}
      {metrics.gargalos > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex items-center justify-between text-amber-900">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold">
                Atenção: {metrics.gargalos} processo(s) parado(s) há 5 dias ou mais sem movimentação!
              </p>
              <p className="text-xs text-amber-700">
                Processos prioritários requerem análise técnica imediata para não ultrapassar o SLA da SESAB.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-amber-300 text-amber-800 hover:bg-amber-100 text-xs"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
            }}
          >
            Ver Todos
          </Button>
        </div>
      )}

      {/* Barra de Filtros */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por Nº SEI, Paciente, CPF, Fármaco, CID ou Município..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 text-xs rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="all">Todos os Status</option>
                <option value="triagem">1. Criar Processo (Triagem)</option>
                <option value="aguardando_parecer">2. Aguardando Parecer</option>
                <option value="em_analise">3. Em Análise</option>
                <option value="concluido">4. Concluído</option>
              </select>

              <select
                value={origemFilter}
                onChange={(e) => setOrigemFilter(e.target.value)}
                className="h-10 text-xs rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Todas as Origens</option>
                {origens.map((origem) => (
                  <option key={origem.id} value={origem.id}>
                    {origem.sigla ? `${origem.sigla} - ${origem.name}` : origem.name}
                  </option>
                ))}
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="h-10 text-xs rounded-md border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Todas as Prioridades</option>
                <option value="normal">Normal</option>
                <option value="urgente">Urgente</option>
                <option value="judicial">Mandado Judicial</option>
              </select>

              {(searchTerm || statusFilter !== "all" || origemFilter !== "all" || priorityFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setOrigemFilter("all");
                    setPriorityFilter("all");
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista / Tabela de Processos SEI */}
      <Card>
        <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-800">
              Processos em Tramitação ({filteredProcessos.length})
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Clique sobre um processo para abrir a tela de análise técnica e decisões por Fármaco + CID.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredProcessos.length === 0 ? (
            <div className="py-12 px-4 text-center text-slate-500 space-y-3">
              <FileText className="h-12 w-12 mx-auto text-slate-300" />
              <div>
                <p className="font-semibold text-slate-800 text-sm">Fila de Processos Limpa & Pronta para Operação Real</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Nenhum processo anterior registrado. Comece autuando novos processos SEI para alimentar a fila de triagem e a avaliação dos pareceristas.
                </p>
              </div>
              <div>
                <Link href="/atendimentos/novo">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                    <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                    Autuar Primeiro Processo SEI
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Processo SEI / Data</th>
                    <th className="py-3 px-4">Requerente / Paciente</th>
                    <th className="py-3 px-4">Município / BRS</th>
                    <th className="py-3 px-4">Fármaco(s) & CID-10</th>
                    <th className="py-3 px-4">Parecerista</th>
                    <th className="py-3 px-4">Status & SLA</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProcessos.map((proc) => {
                    const stage = getNormalizedStage(proc.status);
                    const isDelayed = (proc.days_in_current_status || 0) >= 5 && stage !== "concluido";
                    const canAssumir =
                      isFarmaceutico &&
                      (stage === "aguardando_parecer" ||
                        (stage === "em_analise" && proc.assigned_pharmacist_id !== currentUser?.id));

                    return (
                      <tr
                        key={proc.id}
                        onClick={() => handleOpenProcesso(proc.id)}
                        className={`cursor-pointer transition-colors hover:bg-slate-50/80 ${
                          isDelayed ? "bg-amber-50/30" : ""
                        }`}
                      >
                        {/* Processo SEI & Data */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <span className="font-mono text-emerald-800">{proc.numero_sei}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] text-slate-500">
                              Entrada: {formatDate(proc.data_abertura)}
                            </span>
                            {getPriorityBadge(proc.priority)}
                          </div>
                        </td>

                        {/* Paciente */}
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900 flex items-center gap-1.5">
                            <span>{proc.paciente?.full_name || "Paciente não cadastrado"}</span>
                            <Badge variant="outline" className="text-[9px]">
                              {proc.paciente?.gender === "M"
                                ? "M"
                                : proc.paciente?.gender === "F"
                                ? "F"
                                : proc.paciente?.gender === "outro"
                                ? "Outro"
                                : "N/I"}
                            </Badge>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {proc.paciente?.cpf_not_provided
                              ? "CPF Não Informado"
                              : `CPF: ${proc.paciente?.cpf || "---"}`}
                          </div>
                        </td>

                        {/* Município / BRS */}
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">
                            {proc.municipio?.name ? `${proc.municipio.name} - BA` : "Bahia"}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {proc.unidade?.name || "Base Regional"}
                          </div>
                        </td>

                        {/* Fármacos & CID-10 */}
                        <td className="py-3 px-4">
                          <div className="space-y-1 max-w-xs">
                            {proc.items.slice(0, 2).map((item) => (
                              <div key={item.id} className="flex items-center gap-1.5 text-[11px]">
                                <Badge
                                  variant="outline"
                                  className="text-[9px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200"
                                >
                                  Fármaco
                                </Badge>
                                <span className="truncate text-slate-700 font-medium">
                                  {item.farmaco_substancia || item.medication_name}
                                </span>
                                <span className="text-slate-400 font-mono">
                                  ({item.cid_nao_informado ? "N/I" : item.cid_code})
                                </span>
                              </div>
                            ))}
                            {proc.items.length > 2 && (
                              <span className="text-[10px] text-slate-400 italic">
                                +{proc.items.length - 2} outro(s) item(ns)
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Parecerista */}
                        <td className="py-3 px-4">
                          {proc.assigned_pharmacist ? (
                            <div>
                              <div className="font-medium text-slate-800">
                                {proc.assigned_pharmacist.full_name}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {proc.assigned_pharmacist.crf || "Farmacêutico(a)"}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Fila Pública</span>
                          )}
                        </td>

                        {/* Status & SLA */}
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            {getStageBadge(proc.status)}
                            <div className="flex items-center gap-1 text-[11px]">
                              {isDelayed ? (
                                <span className="text-rose-600 font-medium flex items-center gap-0.5">
                                  <AlertTriangle className="h-3 w-3" />
                                  {proc.days_in_current_status}d na etapa
                                </span>
                              ) : (
                                <span className="text-slate-500">
                                  {proc.days_in_current_status || 1}d na etapa
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Ações */}
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {canAssumir && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => handleAssumirParecer(proc.id, e)}
                                className="h-8 text-xs border-blue-300 text-blue-700 hover:bg-blue-50 flex items-center gap-1 font-semibold"
                                title="Assumir este parecer e abrir a tela de análise técnica"
                              >
                                <UserCheck className="h-3.5 w-3.5" />
                                Assumir
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenProcesso(proc.id)}
                              className="h-8 text-xs text-slate-700 hover:bg-slate-100 flex items-center gap-1"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Abrir
                            </Button>

                            {isProcessoInFirstStatus(proc) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteError(null);
                                  setProcessoToDelete(proc);
                                }}
                                className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Excluir Processo SEI (Permitido apenas no primeiro status)"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Confirmação de Exclusão de Processo SEI */}
      <Dialog
        open={Boolean(processoToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setProcessoToDelete(null);
            setDeleteError(null);
          }
        }}
        title="Excluir Processo SEI"
        description="Esta ação removerá o processo definitivamente do sistema."
        maxWidth="sm"
      >
        <div className="space-y-4 pt-1">
          {deleteError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{deleteError}</span>
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
            <div>
              <span className="text-slate-500">Nº do Processo SEI:</span>{" "}
              <strong className="font-mono text-slate-900">{processoToDelete?.numero_sei}</strong>
            </div>
            <div>
              <span className="text-slate-500">Paciente:</span>{" "}
              <strong className="text-slate-900">{processoToDelete?.paciente?.full_name || "Não informado"}</strong>
            </div>
            <div>
              <span className="text-slate-500">Status Atual:</span>{" "}
              <span className="font-semibold text-slate-700 capitalize">{processoToDelete?.status.replace("_", " ")}</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Tem certeza de que deseja apagar este processo SEI? Como ele ainda está no primeiro status e não possui análise técnica concluída, a exclusão é permitida.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => {
                setProcessoToDelete(null);
                setDeleteError(null);
              }}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs flex items-center gap-1.5 shadow"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {isDeleting ? "Excluindo..." : "Sim, Excluir Processo"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
