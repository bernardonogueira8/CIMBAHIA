"use client";

import React, { useState } from "react";
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  Mail,
  Lock,
  Pencil,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Stethoscope,
  Building2,
  FileCheck2,
  Eye,
  EyeOff,
} from "lucide-react";
import { useApp } from "@/lib/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Role, Profile } from "@/lib/types";

export default function UsuariosPage() {
  const {
    profiles,
    units,
    currentUser,
    registerUser,
    updateUser,
    toggleUserActive,
  } = useApp();

  const isGestor = currentUser?.role === "admin" || currentUser?.role === "gestor";

  // Modal Novo Usuário
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [crf, setCrf] = useState("");
  const [role, setRole] = useState<Role>("farmaceutico");
  const [unitId, setUnitId] = useState<string>(units[0]?.id || "");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modal Editar Usuário
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCrf, setEditCrf] = useState("");
  const [editRole, setEditRole] = useState<Role>("farmaceutico");
  const [editUnitId, setEditUnitId] = useState<string>("general");
  const [editPassword, setEditPassword] = useState("");
  const [editActive, setEditActive] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) return;

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await registerUser({
        full_name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        crf: crf.trim() || undefined,
        unit_id: (role === "admin" || role === "gestor") && unitId === "general" ? null : unitId,
        role,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Falha ao registrar novo operador.");
        setLoading(false);
        return;
      }

      setSuccessMsg(`Operador ${name} cadastrado com sucesso! Credenciais ativas.`);
      setTimeout(() => {
        setIsNewUserModalOpen(false);
        setName("");
        setEmail("");
        setPassword("");
        setShowPassword(false);
        setCrf("");
        setSuccessMsg("");
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro inesperado ao cadastrar.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (profile: Profile) => {
    setSelectedProfile(profile);
    setEditName(profile.full_name);
    setEditEmail(profile.email);
    setEditCrf(profile.crf || "");
    setEditRole(profile.role);
    setEditUnitId(profile.unit_id || "general");
    setEditActive(profile.active !== false);
    setEditPassword("");
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile || !editName.trim()) return;

    setLoading(true);
    try {
      const res = await updateUser(selectedProfile.id, {
        full_name: editName.trim(),
        email: editEmail.trim().toLowerCase(),
        crf: editCrf.trim() || null,
        unit_id: (editRole === "admin" || editRole === "gestor") && editUnitId === "general" ? null : editUnitId,
        role: editRole,
        password: editPassword.trim() || undefined,
        active: editActive,
      });

      if (!res.success) {
        alert(res.error || "Falha ao atualizar dados.");
        setLoading(false);
        return;
      }

      setIsEditModalOpen(false);
    } catch (err: any) {
      alert("Erro ao atualizar: " + (err?.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (profile: Profile) => {
    const isCurrentlyActive = profile.active !== false;
    const msg = isCurrentlyActive
      ? `Deseja inativar o acesso de ${profile.full_name}?`
      : `Deseja reativar o acesso de ${profile.full_name}?`;

    if (window.confirm(msg)) {
      await toggleUserActive(profile.id, !isCurrentlyActive);
    }
  };

  // Filtragem
  const filteredProfiles = profiles.filter((p) => {
    const matchSearch =
      p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.crf && p.crf.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchRole =
      roleFilter === "all"
        ? true
        : roleFilter === "gestor"
        ? p.role === "admin" || p.role === "gestor"
        : roleFilter === "farmaceutico"
        ? p.role === "pharmacist" || p.role === "farmaceutico"
        : p.role === "viewer" || p.role === "administrativo";

    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E5E7EB] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#171A20]">
              Gestão de Usuários & Perfis de Acesso
            </h1>
            <Badge variant="outline" className="border-[#171A20] text-[#171A20] text-xs">
              {profiles.length} Operadores
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#5C5E62] mt-1">
            Controle de acesso restrito (RBAC): Administrativo (Triagem), Farmacêutico(a) (Pareceres) e Gestor (Administração).
          </p>
        </div>

        {isGestor && (
          <Button
            onClick={() => {
              setPassword("");
              setShowPassword(false);
              setIsNewUserModalOpen(true);
            }}
            size="sm"
            className="bg-[#171A20] hover:bg-[#282C34] text-white shrink-0 flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Operador</span>
          </Button>
        )}
      </div>

      {/* Cards de Explicativo dos Papéis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60">
          <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider mb-1">
            <FileCheck2 className="w-4 h-4 text-blue-600" />
            <span>Administrativo (Triagem)</span>
          </div>
          <p className="text-xs text-blue-800 leading-relaxed">
            Responsável pelo recebimento do Processo SEI, verificação de conformidade documental, laudos e encaminhamento para parecer.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider mb-1">
            <Stethoscope className="w-4 h-4 text-emerald-600" />
            <span>Farmacêutico(a) (Parecer Técnico)</span>
          </div>
          <p className="text-xs text-emerald-800 leading-relaxed">
            Responsável pela avaliação farmacoterapêutica, checagem de PCDTs/ANVISA, emissão e retificação de pareceres técnicos com CRF.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/60">
          <div className="flex items-center gap-2 text-purple-900 font-bold text-xs uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Gestor / Administrador</span>
          </div>
          <p className="text-xs text-purple-800 leading-relaxed">
            Visão geral de indicadores do estado, gestão de unidades, estrutura territorial, distribuição de filas e cadastro de operadores.
          </p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-[#E5E7EB]">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Buscar por nome, e-mail ou CRF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-[#5C5E62] shrink-0">Filtrar Papel:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 px-3 text-xs border border-[#E5E7EB] rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#171A20]"
          >
            <option value="all">Todos os Papéis</option>
            <option value="gestor">Gestor / Administrador</option>
            <option value="farmaceutico">Farmacêutico(a)</option>
            <option value="administrativo">Administrativo (Triagem)</option>
          </select>
        </div>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F4F4F6] text-[#5C5E62] font-semibold border-b border-[#E5E7EB]">
              <tr>
                <th className="py-3 px-4">Operador</th>
                <th className="py-3 px-4">Papel / Função</th>
                <th className="py-3 px-4">CRF</th>
                <th className="py-3 px-4">Unidade de Lotação</th>
                <th className="py-3 px-4">Status</th>
                {isGestor && <th className="py-3 px-4 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredProfiles.map((p) => {
                const isUserActive = p.active !== false;
                const assignedUnit = units.find((u) => u.id === p.unit_id);
                const isSuperAdmin = p.role === "admin" || p.role === "gestor";
                const isPharm = p.role === "pharmacist" || p.role === "farmaceutico";

                return (
                  <tr key={p.id} className="hover:bg-[#FAFAFB] transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-bold text-[#171A20]">{p.full_name}</span>
                        <span className="text-[11px] text-[#5C5E62] block">{p.email}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {isSuperAdmin ? (
                        <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider inline-flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          Gestor Geral
                        </span>
                      ) : isPharm ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider inline-flex items-center gap-1">
                          <Stethoscope className="w-3 h-3" />
                          Farmacêutico(a)
                        </span>
                      ) : (
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider inline-flex items-center gap-1">
                          <FileCheck2 className="w-3 h-3" />
                          Administrativo (Triagem)
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-gray-700">
                      {p.crf || "—"}
                    </td>

                    <td className="py-3 px-4 text-[#5C5E62]">
                      {isSuperAdmin && !p.unit_id ? (
                        <span className="italic font-medium text-purple-700">Acesso Global (Todas as Unidades)</span>
                      ) : (
                        assignedUnit?.name || "Sem unidade vinculada"
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <Badge
                        variant={isUserActive ? "success" : "neutral"}
                        className="text-[10px] uppercase font-semibold"
                      >
                        {isUserActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>

                    {isGestor && (
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded hover:bg-[#EEEEEE] text-[#5C5E62] hover:text-[#171A20] transition-colors cursor-pointer"
                            title="Editar dados do usuário"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(p)}
                            className={`p-1.5 rounded transition-colors cursor-pointer ${
                              isUserActive
                                ? "hover:bg-red-50 text-[#5C5E62] hover:text-red-600"
                                : "hover:bg-emerald-50 text-[#5C5E62] hover:text-emerald-600"
                            }`}
                            title={isUserActive ? "Inativar acesso" : "Reativar acesso"}
                          >
                            {isUserActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: NOVO OPERADOR */}
      <Dialog
        open={isNewUserModalOpen}
        onOpenChange={setIsNewUserModalOpen}
        title="Cadastrar Novo Operador no CimBahia"
        description="A criação de contas é exclusivamente interna e restrita à Gestão do Sistema."
        maxWidth="md"
      >
        <form onSubmit={handleRegisterUser} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-[#171A20] block mb-1">
              Nome Completo *
            </label>
            <Input
              placeholder="Ex: Dra. Juliana Mendes"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#171A20] block mb-1">
              E-mail Institucional *
            </label>
            <Input
              type="email"
              placeholder="Ex: juliana.mendes@saude.ba.gov.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#171A20] block mb-1">
                Papel no Sistema *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full h-10 px-3 text-xs border border-[#E5E7EB] rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#171A20]"
              >
                <option value="farmaceutico">Farmacêutico(a) (Pareceres)</option>
                <option value="administrativo">Administrativo (Triagem SEI)</option>
                <option value="gestor">Gestor / Administrador Geral</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#171A20] block mb-1">
                Número do CRF-BA (Se farmacêutico)
              </label>
              <Input
                placeholder="Ex: CRF-BA 8421"
                value={crf}
                onChange={(e) => setCrf(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#171A20] block mb-1">
              Unidade de Lotação *
            </label>
            <select
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              className="w-full h-10 px-3 text-xs border border-[#E5E7EB] rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#171A20]"
            >
              {(role === "admin" || role === "gestor") && (
                <option value="general">Visão Global / Todas as Unidades</option>
              )}
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.municipality || "Bahia"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#171A20] block mb-1">
              Senha Inicial Temporária * (mínimo 6 caracteres)
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
                aria-pressed={showPassword}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#5C5E62] hover:text-[#171A20] focus:outline-none focus:ring-2 focus:ring-[#171A20]"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsNewUserModalOpen(false);
                setPassword("");
                setShowPassword(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={loading}
              className="bg-[#171A20] text-white hover:bg-[#282C34]"
            >
              {loading ? "Cadastrando..." : "Cadastrar Operador"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* MODAL: EDITAR OPERADOR */}
      <Dialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Editar Dados do Operador"
        description="Atualize as informações funcionais, papel regulatório ou redefina a senha."
        maxWidth="md"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#171A20] block mb-1">
              Nome Completo *
            </label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#171A20] block mb-1">
              E-mail Institucional *
            </label>
            <Input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#171A20] block mb-1">
                Papel no Sistema *
              </label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as Role)}
                className="w-full h-10 px-3 text-xs border border-[#E5E7EB] rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#171A20]"
              >
                <option value="farmaceutico">Farmacêutico(a)</option>
                <option value="administrativo">Administrativo (Triagem)</option>
                <option value="gestor">Gestor / Administrador</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#171A20] block mb-1">
                CRF (se Farmacêutico)
              </label>
              <Input
                value={editCrf}
                onChange={(e) => setEditCrf(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#171A20] block mb-1">
              Unidade de Lotação
            </label>
            <select
              value={editUnitId}
              onChange={(e) => setEditUnitId(e.target.value)}
              className="w-full h-10 px-3 text-xs border border-[#E5E7EB] rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#171A20]"
            >
              <option value="general">Visão Global / Todas as Unidades</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#171A20] block mb-1">
              Nova Senha (deixe em branco para manter a atual)
            </label>
            <Input
              type="password"
              placeholder="••••••••••••"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="editActiveProfCheck"
              checked={editActive}
              onChange={(e) => setEditActive(e.target.checked)}
              className="w-4 h-4 rounded text-[#171A20]"
            />
            <label htmlFor="editActiveProfCheck" className="text-xs font-medium text-[#171A20] cursor-pointer">
              Conta de Acesso Ativa no Sistema
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={loading}
              className="bg-[#171A20] text-white hover:bg-[#282C34]"
            >
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
