"use client";

import React, { useState } from "react";
import {
  Building2,
  PlusCircle,
  Users,
  Shield,
  MapPin,
  CheckCircle,
  UserCheck,
  UserPlus,
  UserX,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Mail,
  User,
  Pencil,
  Lock,
} from "lucide-react";
import { useApp } from "@/lib/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Role, Unit, Profile } from "@/lib/types";

export default function UnidadesPage() {
  const {
    units,
    profiles,
    currentUser,
    addUnit,
    updateUnit,
    registerUser,
    updateUser,
    toggleUserActive,
  } = useApp();

  const [activeTab, setActiveTab] = useState<"units" | "users">("units");

  // Modais de Cadastro
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Modais de Edição
  const [isEditUnitModalOpen, setIsEditUnitModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);

  // Estados formulário Nova Unidade
  const [unitName, setUnitName] = useState("");
  const [macroregion, setMacroregion] = useState("Macrorregional Norte");
  const [municipality, setMunicipality] = useState("");
  const [cnes, setCnes] = useState("");

  // Estados formulário Editar Unidade
  const [editingUnitId, setEditingUnitId] = useState("");
  const [editUnitName, setEditUnitName] = useState("");
  const [editMacroregion, setEditMacroregion] = useState("Macrorregional Norte");
  const [editMunicipality, setEditMunicipality] = useState("");
  const [editCnes, setEditCnes] = useState("");
  const [editUnitActive, setEditUnitActive] = useState(true);
  const [editUnitLoading, setEditUnitLoading] = useState(false);
  const [editUnitError, setEditUnitError] = useState("");
  const [editUnitSuccess, setEditUnitSuccess] = useState("");

  // Estados formulário Novo Usuário (Restrito à Administração)
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("PharmaCare@2026");
  const [userCrf, setUserCrf] = useState("");
  const [userUnitId, setUserUnitId] = useState<string>(
    units[0]?.id || "11111111-1111-1111-1111-111111111111"
  );
  const [userRole, setUserRole] = useState<Role>("pharmacist");
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState("");
  const [userSuccess, setUserSuccess] = useState("");

  // Estados formulário Editar Usuário
  const [editingUserId, setEditingUserId] = useState("");
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserPassword, setEditUserPassword] = useState("");
  const [editUserCrf, setEditUserCrf] = useState("");
  const [editUserUnitId, setEditUserUnitId] = useState<string>("general");
  const [editUserRole, setEditUserRole] = useState<Role>("pharmacist");
  const [editUserActive, setEditUserActive] = useState(true);
  const [editUserLoading, setEditUserLoading] = useState(false);
  const [editUserError, setEditUserError] = useState("");
  const [editUserSuccess, setEditUserSuccess] = useState("");
  const [userActionLoadingId, setUserActionLoadingId] = useState<string | null>(null);

  const isAdmin = currentUser?.role === "admin";

  const handleSaveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitName.trim() || !macroregion.trim()) return;

    await addUnit({
      name: unitName.trim(),
      macroregion: macroregion.trim(),
      municipality: municipality.trim() || undefined,
      cnes: cnes.trim() || undefined,
      active: true,
    });

    setIsUnitModalOpen(false);
    setUnitName("");
    setMunicipality("");
    setCnes("");
  };

  const handleUpdateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUnitName.trim() || !editingUnitId) return;

    setEditUnitLoading(true);
    setEditUnitError("");
    setEditUnitSuccess("");

    try {
      const res = await updateUnit(editingUnitId, {
        name: editUnitName.trim(),
        macroregion: editMacroregion.trim(),
        municipality: editMunicipality.trim() || undefined,
        cnes: editCnes.trim() || undefined,
        active: editUnitActive,
      });

      if (!res.success) {
        setEditUnitError(res.error || "Falha ao atualizar unidade.");
        setEditUnitLoading(false);
        return;
      }

      setEditUnitSuccess("Unidade atualizada com sucesso no banco de dados!");
      setTimeout(() => {
        setIsEditUnitModalOpen(false);
        setEditUnitSuccess("");
      }, 1000);
    } catch (err: any) {
      setEditUnitError(err?.message || "Erro inesperado ao salvar alterações.");
    } finally {
      setEditUnitLoading(false);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError("");
    setUserSuccess("");

    if (!userName.trim() || !userEmail.trim()) {
      setUserError("Preencha o nome completo e o e-mail institucional.");
      return;
    }

    if (userPassword.length < 6) {
      setUserError("A senha provisória deve ter no mínimo 6 caracteres.");
      return;
    }

    setUserLoading(true);

    try {
      const res = await registerUser({
        full_name: userName.trim(),
        email: userEmail.trim().toLowerCase(),
        password: userPassword,
        crf: userCrf.trim() || undefined,
        unit_id: userRole === "admin" && userUnitId === "general" ? null : userUnitId,
        role: userRole,
      });

      if (!res.success) {
        setUserError(res.error || "Falha ao registrar usuário.");
        setUserLoading(false);
        return;
      }

      setUserSuccess(`Profissional ${userName} cadastrado com sucesso! As credenciais de acesso já estão ativas.`);
      setTimeout(() => {
        setIsUserModalOpen(false);
        setUserName("");
        setUserEmail("");
        setUserPassword("PharmaCare@2026");
        setUserCrf("");
        setUserSuccess("");
        setUserError("");
      }, 1200);
    } catch (err: any) {
      setUserError(err?.message || "Erro inesperado ao registrar usuário.");
    } finally {
      setUserLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserName.trim() || !editingUserId) return;

    setEditUserLoading(true);
    setEditUserError("");
    setEditUserSuccess("");

    if (editUserPassword && editUserPassword.length < 6) {
      setEditUserError("A nova senha deve ter no mínimo 6 caracteres.");
      setEditUserLoading(false);
      return;
    }

    try {
      const res = await updateUser(editingUserId, {
        full_name: editUserName.trim(),
        email: editUserEmail.trim().toLowerCase(),
        crf: editUserCrf.trim() || null,
        unit_id: editUserRole === "admin" && editUserUnitId === "general" ? null : editUserUnitId,
        role: editUserRole,
        password: editUserPassword.trim() || undefined,
        active: editUserActive,
      });

      if (!res.success) {
        setEditUserError(res.error || "Falha ao atualizar dados do usuário.");
        setEditUserLoading(false);
        return;
      }

      setEditUserSuccess("Cadastro do profissional atualizado com sucesso no Supabase!");
      setTimeout(() => {
        setIsEditUserModalOpen(false);
        setEditUserSuccess("");
      }, 1200);
    } catch (err: any) {
      setEditUserError(err?.message || "Erro inesperado ao atualizar usuário.");
    } finally {
      setEditUserLoading(false);
    }
  };

  const handleToggleUserStatus = async (user: Profile) => {
    const isCurrentlyActive = user.active !== false;
    const targetAction = isCurrentlyActive ? "inativar" : "reativar";
    const confirmMsg = isCurrentlyActive
      ? `Tem certeza que deseja inativar o acesso de ${user.full_name}? O profissional não conseguirá acessar o sistema até ser reativado.`
      : `Deseja reativar o acesso ao sistema para ${user.full_name}?`;

    if (!window.confirm(confirmMsg)) return;

    setUserActionLoadingId(user.id);
    try {
      const res = await toggleUserActive(user.id, !isCurrentlyActive);
      if (!res.success) {
        alert(res.error || `Erro ao ${targetAction} usuário.`);
      }
    } catch (err: any) {
      alert(err?.message || `Erro ao ${targetAction} usuário.`);
    } finally {
      setUserActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-2xl font-bold text-[#171A20] tracking-tight">
            Gestão de Unidades & Credenciamento de Usuários
          </h1>
          <p className="text-xs text-[#5C5E62] mt-0.5">
            Configuração das Bases Regionais de Saúde (BRS), núcleos e lotação dos farmacêuticos clínicos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "units" && isAdmin && (
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsUnitModalOpen(true)}
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Cadastrar Nova Unidade
            </Button>
          )}

          {activeTab === "users" && isAdmin && (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setUserError("");
                setUserSuccess("");
                setIsUserModalOpen(true);
              }}
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              Cadastrar Novo Usuário
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E5E7EB] space-x-4">
        <button
          onClick={() => setActiveTab("units")}
          className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "units"
              ? "border-[#171A20] text-[#171A20]"
              : "border-transparent text-[#5C5E62] hover:text-[#171A20]"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Unidades de Saúde (BRS)</span>
          <Badge variant="neutral">{units.length}</Badge>
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`pb-3 text-sm font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "users"
              ? "border-[#171A20] text-[#171A20]"
              : "border-transparent text-[#5C5E62] hover:text-[#171A20]"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Usuários & Lotação</span>
          <Badge variant="neutral">{profiles.length}</Badge>
        </button>
      </div>

      {/* Aba de Unidades */}
      {activeTab === "units" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#171A20] text-white border-b border-[#282C34]">
                    <th className="py-2.5 px-4 font-semibold">Nome da Unidade / BRS</th>
                    <th className="py-2.5 px-4 font-semibold">Macrorregional de Saúde</th>
                    <th className="py-2.5 px-4 font-semibold">Município</th>
                    <th className="py-2.5 px-4 font-semibold">CNES</th>
                    <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                    {isAdmin && (
                      <th className="py-2.5 px-4 font-semibold text-right">Ações</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] bg-white">
                  {units.map((u) => (
                    <tr key={u.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#171A20]">
                        {u.name}
                      </td>
                      <td className="py-3 px-4 text-[#5C5E62]">
                        {u.macroregion}
                      </td>
                      <td className="py-3 px-4 text-[#171A20]">
                        {u.municipality || "—"}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#5C5E62]">
                        {u.cnes || "—"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={u.active ? "success" : "neutral"}>
                          {u.active ? "Ativa" : "Inativa"}
                        </Badge>
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingUnitId(u.id);
                              setEditUnitName(u.name);
                              setEditMacroregion(u.macroregion);
                              setEditMunicipality(u.municipality || "");
                              setEditCnes(u.cnes || "");
                              setEditUnitActive(u.active);
                              setEditUnitError("");
                              setEditUnitSuccess("");
                              setIsEditUnitModalOpen(true);
                            }}
                            className="h-7 px-2.5 text-[11px]"
                          >
                            <Pencil className="w-3 h-3 mr-1" />
                            Editar
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aba de Usuários (Restrito à Administração) */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Banner de Controle de Acesso */}
          <div className="p-3 bg-[#F4F4F6] border border-[#E5E7EB] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#5C5E62]">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#171A20] shrink-0" />
              <span>
                {isAdmin ? (
                  <>
                    <strong className="text-[#171A20]">Área Administrativa Restrita:</strong> Você pode cadastrar, editar perfis, alterar lotações e redefinir senhas dos profissionais de saúde da rede.
                  </>
                ) : (
                  <>
                    <strong className="text-[#171A20]">Modo Consulta:</strong> Apenas administradores gerais possuem permissão para credenciar e alterar os vínculos dos farmacêuticos.
                  </>
                )}
              </span>
            </div>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setUserError("");
                  setUserSuccess("");
                  setIsUserModalOpen(true);
                }}
                className="shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                Novo Credenciamento
              </Button>
            )}
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#171A20] text-white border-b border-[#282C34]">
                      <th className="py-2.5 px-4 font-semibold">Nome do Profissional</th>
                      <th className="py-2.5 px-4 font-semibold">E-mail Institucional</th>
                      <th className="py-2.5 px-4 font-semibold">CRF</th>
                      <th className="py-2.5 px-4 font-semibold">Unidade Vinculada</th>
                      <th className="py-2.5 px-4 font-semibold text-center">Papel (Role)</th>
                      <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                      {isAdmin && (
                        <th className="py-2.5 px-4 font-semibold text-right">Ações</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB] bg-white">
                    {profiles.map((p) => {
                      const unit = units.find((u) => u.id === p.unit_id);
                      return (
                        <tr key={p.id} className="hover:bg-[#F9FAFB] transition-colors">
                          <td className="py-3 px-4 font-semibold text-[#171A20]">
                            {p.full_name}
                          </td>
                          <td className="py-3 px-4 font-mono text-[#5C5E62]">
                            {p.email}
                          </td>
                          <td className="py-3 px-4 font-mono text-[#171A20]">
                            {p.crf || "—"}
                          </td>
                          <td className="py-3 px-4 text-[#171A20]">
                            {unit ? unit.name : <span className="text-[#9CA3AF]">Acesso Geral (Sem unidade fixa)</span>}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge
                              variant={
                                p.role === "admin"
                                  ? "default"
                                  : p.role === "pharmacist"
                                  ? "success"
                                  : "neutral"
                              }
                            >
                              {p.role === "admin"
                                ? "Admin Geral"
                                : p.role === "pharmacist"
                                ? "Farmacêutico"
                                : "Visualizador"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {p.active !== false ? (
                              <Badge variant="success">Ativo</Badge>
                            ) : (
                              <Badge variant="danger">Inativo</Badge>
                            )}
                          </td>
                          {isAdmin && (
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingUserId(p.id);
                                    setEditUserName(p.full_name);
                                    setEditUserEmail(p.email);
                                    setEditUserCrf(p.crf || "");
                                    setEditUserUnitId(p.unit_id || "general");
                                    setEditUserRole(p.role);
                                    setEditUserActive(p.active !== false);
                                    setEditUserPassword("");
                                    setEditUserError("");
                                    setEditUserSuccess("");
                                    setIsEditUserModalOpen(true);
                                  }}
                                  className="h-7 px-2.5 text-[11px]"
                                >
                                  <Pencil className="w-3 h-3 mr-1" />
                                  Editar
                                </Button>

                                {p.id === currentUser?.id ? (
                                  <span
                                    className="text-[10px] text-gray-400 italic px-2 py-1"
                                    title="Não é possível inativar a própria conta logada"
                                  >
                                    (Você)
                                  </span>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleToggleUserStatus(p)}
                                    disabled={userActionLoadingId === p.id}
                                    className={`h-7 px-2.5 text-[11px] ${
                                      p.active !== false
                                        ? "text-red-700 hover:text-red-800 hover:bg-red-50 border-red-200"
                                        : "text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-200"
                                    }`}
                                  >
                                    {p.active !== false ? (
                                      <>
                                        <UserX className="w-3 h-3 mr-1 text-red-600" />
                                        Inativar
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                                        Reativar
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Nova Unidade */}
      <Dialog
        open={isUnitModalOpen}
        onOpenChange={setIsUnitModalOpen}
        title="Cadastrar Nova Unidade de Saúde"
        description="Adicione uma nova base regional de saúde à rede do Cuidado Farmacêutico."
      >
        <form onSubmit={handleSaveUnit} className="space-y-4">
          <Input
            label="Nome da Unidade / Núcleo *"
            placeholder="Ex: BRS Barreiras"
            value={unitName}
            onChange={(e) => setUnitName(e.target.value)}
            required
          />

          <div>
            <label className="text-xs font-semibold text-[#393C41] block mb-1">
              Macrorregional de Saúde *
            </label>
            <select
              value={macroregion}
              onChange={(e) => setMacroregion(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-white border border-[#D1D5DB] rounded focus:outline-none"
              required
            >
              <option value="Macrorregional Norte">Macrorregional Norte</option>
              <option value="Macrorregional Centro-Leste">Macrorregional Centro-Leste</option>
              <option value="Macrorregional Sudoeste">Macrorregional Sudoeste</option>
              <option value="Macrorregional Leste">Macrorregional Leste</option>
              <option value="Macrorregional Oeste">Macrorregional Oeste</option>
              <option value="Macrorregional Sul">Macrorregional Sul</option>
              <option value="Macrorregional Extremo-Sul">Macrorregional Extremo-Sul</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Município-Sede"
              placeholder="Ex: Barreiras"
              value={municipality}
              onChange={(e) => setMunicipality(e.target.value)}
            />
            <Input
              label="Código CNES"
              placeholder="Ex: 2801452"
              value={cnes}
              onChange={(e) => setCnes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsUnitModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Salvar Unidade
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal Editar Unidade */}
      <Dialog
        open={isEditUnitModalOpen}
        onOpenChange={setIsEditUnitModalOpen}
        title="Editar Unidade de Saúde"
        description="Atualize as informações cadastrais e status operacional da unidade."
      >
        <form onSubmit={handleUpdateUnit} className="space-y-4">
          {editUnitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{editUnitError}</span>
            </div>
          )}

          {editUnitSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{editUnitSuccess}</span>
            </div>
          )}

          <Input
            label="Nome da Unidade / Núcleo *"
            value={editUnitName}
            onChange={(e) => setEditUnitName(e.target.value)}
            required
          />

          <div>
            <label className="text-xs font-semibold text-[#393C41] block mb-1">
              Macrorregional de Saúde *
            </label>
            <select
              value={editMacroregion}
              onChange={(e) => setEditMacroregion(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-white border border-[#D1D5DB] rounded focus:outline-none"
              required
            >
              <option value="Macrorregional Norte">Macrorregional Norte</option>
              <option value="Macrorregional Centro-Leste">Macrorregional Centro-Leste</option>
              <option value="Macrorregional Sudoeste">Macrorregional Sudoeste</option>
              <option value="Macrorregional Leste">Macrorregional Leste</option>
              <option value="Macrorregional Oeste">Macrorregional Oeste</option>
              <option value="Macrorregional Sul">Macrorregional Sul</option>
              <option value="Macrorregional Extremo-Sul">Macrorregional Extremo-Sul</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Município-Sede"
              value={editMunicipality}
              onChange={(e) => setEditMunicipality(e.target.value)}
            />
            <Input
              label="Código CNES"
              value={editCnes}
              onChange={(e) => setEditCnes(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="editUnitActive"
              checked={editUnitActive}
              onChange={(e) => setEditUnitActive(e.target.checked)}
              className="w-4 h-4 rounded text-[#171A20] focus:ring-[#171A20]"
            />
            <label htmlFor="editUnitActive" className="text-xs font-semibold text-[#393C41] cursor-pointer">
              Unidade Ativa no Sistema
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F0F1F3]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditUnitModalOpen(false)}
              disabled={editUnitLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={editUnitLoading}
            >
              {editUnitLoading ? "Salvando no Supabase..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal Novo Usuário (Restrito à Administração) */}
      <Dialog
        open={isUserModalOpen}
        onOpenChange={setIsUserModalOpen}
        title="Cadastrar Novo Profissional / Usuário"
        description="Credencie um farmacêutico clínico ou gestor estadual no sistema oficial."
        maxWidth="md"
      >
        <form onSubmit={handleSaveUser} className="space-y-4">
          {userError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{userError}</span>
            </div>
          )}

          {userSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{userSuccess}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-[#393C41] block mb-1">
              Nome Completo do Profissional (com Título) *
            </label>
            <Input
              placeholder="Ex: Dra. Mariana Costa"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#393C41] block mb-1">
                E-mail Institucional *
              </label>
              <Input
                type="email"
                placeholder="nome@saude.ba.gov.br"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#393C41] block mb-1">
                CRF (Obrigatório para Farmacêutico)
              </label>
              <Input
                placeholder="Ex: CRF-BA 9540"
                value={userCrf}
                onChange={(e) => setUserCrf(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#393C41] block mb-1">
              Senha de Acesso Provisória *
            </label>
            <Input
              type="text"
              placeholder="Mínimo 6 caracteres"
              value={userPassword}
              onChange={(e) => setUserPassword(e.target.value)}
              required
            />
            <p className="text-[10px] text-[#5C5E62] mt-1">
              O profissional poderá utilizar esta senha para seu primeiro acesso ao sistema.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#393C41] block mb-1">
                Perfil de Acesso (Role) *
              </label>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as Role)}
                className="w-full h-9 px-3 text-xs bg-white border border-[#D1D5DB] rounded focus:outline-none"
              >
                <option value="pharmacist">Farmacêutico Clínico</option>
                <option value="admin">Administrador Geral</option>
                <option value="viewer">Visualizador / Auditoria</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#393C41] block mb-1">
                Unidade de Lotação *
              </label>
              <select
                value={userUnitId}
                onChange={(e) => setUserUnitId(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-white border border-[#D1D5DB] rounded focus:outline-none"
              >
                {userRole === "admin" && (
                  <option value="general">Acesso Geral Macrorregional (Sem unidade fixa)</option>
                )}
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0F1F3]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsUserModalOpen(false)}
              disabled={userLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={userLoading}
            >
              {userLoading ? "Cadastrando no Supabase..." : "Concluir Cadastro"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Modal Editar Usuário (Restrito à Administração) */}
      <Dialog
        open={isEditUserModalOpen}
        onOpenChange={setIsEditUserModalOpen}
        title="Editar Dados do Profissional"
        description="Atualize nome, e-mail institucional, lotação, perfil e senha de acesso."
        maxWidth="md"
      >
        <form onSubmit={handleUpdateUser} className="space-y-4">
          {editUserError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{editUserError}</span>
            </div>
          )}

          {editUserSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{editUserSuccess}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-[#393C41] block mb-1">
              Nome Completo do Profissional (com Título) *
            </label>
            <Input
              value={editUserName}
              onChange={(e) => setEditUserName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#393C41] block mb-1">
                E-mail Institucional *
              </label>
              <Input
                type="email"
                value={editUserEmail}
                onChange={(e) => setEditUserEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#393C41] block mb-1">
                CRF
              </label>
              <Input
                value={editUserCrf}
                onChange={(e) => setEditUserCrf(e.target.value)}
                placeholder="Ex: CRF-BA 9540"
              />
            </div>
          </div>

          <div className="p-3 bg-[#F4F4F6] border border-[#E5E7EB] rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#171A20]" />
              <label className="text-xs font-semibold text-[#171A20]">
                Redefinir Senha de Acesso (Opcional)
              </label>
            </div>
            <Input
              type="text"
              placeholder="Deixe em branco para manter a senha atual"
              value={editUserPassword}
              onChange={(e) => setEditUserPassword(e.target.value)}
            />
            <p className="text-[10px] text-[#5C5E62]">
              Caso o profissional tenha esquecido a senha, digite uma nova senha aqui para redefini-la imediatamente.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#393C41] block mb-1">
                Perfil de Acesso (Role) *
              </label>
              <select
                value={editUserRole}
                onChange={(e) => setEditUserRole(e.target.value as Role)}
                className="w-full h-9 px-3 text-xs bg-white border border-[#D1D5DB] rounded focus:outline-none"
              >
                <option value="pharmacist">Farmacêutico Clínico</option>
                <option value="admin">Administrador Geral</option>
                <option value="viewer">Visualizador / Auditoria</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#393C41] block mb-1">
                Unidade de Lotação *
              </label>
              <select
                value={editUserUnitId}
                onChange={(e) => setEditUserUnitId(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-white border border-[#D1D5DB] rounded focus:outline-none"
              >
                {editUserRole === "admin" && (
                  <option value="general">Acesso Geral Macrorregional (Sem unidade fixa)</option>
                )}
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status do Usuário: Ativo / Inativo */}
          <div className="p-3 bg-[#F4F4F6] border border-[#E5E7EB] rounded-lg flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                {editUserActive ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <UserX className="w-4 h-4 text-red-600" />
                )}
                <label className="text-xs font-semibold text-[#171A20] block">
                  Status de Atividade: {editUserActive ? "Conta Ativa" : "Conta Inativada"}
                </label>
              </div>
              <p className="text-[11px] text-[#5C5E62] mt-0.5">
                {editUserActive
                  ? "O profissional possui acesso permitido e pode autenticar no sistema."
                  : "Acesso bloqueado: o usuário não conseguirá realizar login."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentUser?.id === editingUserId}
                onClick={() => setEditUserActive(!editUserActive)}
                className={`h-7 px-2.5 text-xs font-medium ${
                  editUserActive
                    ? "text-red-700 hover:text-red-800 hover:bg-red-50 border-red-200"
                    : "text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-200"
                }`}
              >
                {editUserActive ? (
                  <>
                    <UserX className="w-3.5 h-3.5 mr-1 text-red-600" />
                    Inativar Usuário
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Reativar Usuário
                  </>
                )}
              </Button>
            </div>
          </div>
          {currentUser?.id === editingUserId && (
            <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
              Você está conectado com este perfil e não pode inativar seu próprio acesso.
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0F1F3]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditUserModalOpen(false)}
              disabled={editUserLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={editUserLoading}
            >
              {editUserLoading ? "Salvando no Supabase..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
