"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldAlert,
  Building2,
  UserCheck,
  ChevronDown,
  Eye,
  Lock,
  Pencil,
  Activity,
  LogOut,
  User,
  Shield,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/lib/context/AppContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    units,
    profiles,
    currentUser,
    selectedUnitId,
    activeUnit,
    selectedUnit,
    canEdit,
    isViewingOtherUnit,
    isDemoMode,
    isAuthenticated,
    enterDemoMode,
    logout,
    setSelectedUnitId,
  } = useApp();

  // Nas páginas públicas ou se não autenticado (e não em demo), o cabeçalho não é exibido
  if (
    pathname === "/" ||
    pathname === "/login" ||
    (!isDemoMode && !isAuthenticated) ||
    !currentUser
  ) {
    return null;
  }

  const handleSignOut = async () => {
    await logout();
    router.push("/login");
  };

  // Iniciais do nome do usuário
  const initials = currentUser.full_name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E5E7EB] bg-white">
      {/* BANNER DE IDENTIFICAÇÃO DO MODO DE AMOSTRA / DEMONSTRAÇÃO */}
      {isDemoMode && (
        <div className="w-full bg-[#171A20] border-b border-[#393C41] px-4 py-1.5 text-white animate-in fade-in duration-200">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider">
                Amostra / Sandbox
              </span>
              <span className="text-[#A0A2A8] text-[11px]">
                Você está avaliando o sistema como:{" "}
                <strong className="text-white font-semibold">{currentUser.full_name}</strong> ({currentUser.role === "admin" ? "Gestor Geral" : "Farmacêutico"})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#A0A2A8] hidden md:inline">Trocar Persona de Teste:</span>
              <select
                value={currentUser.id}
                onChange={(e) => enterDemoMode(e.target.value)}
                className="h-6 px-1.5 text-[11px] bg-[#282C34] border border-[#393C41] rounded text-white cursor-pointer focus:outline-none"
              >
                {profiles
                  .filter((p) =>
                    [
                      "11111111-0000-0000-0000-000000000001",
                      "22222222-0000-0000-0000-000000000002",
                      "33333333-0000-0000-0000-000000000003",
                    ].includes(p.id)
                  )
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.role === "admin" ? "Gestor Geral" : "Farmacêutico"})
                    </option>
                  ))}
              </select>
              <button
                onClick={handleSignOut}
                className="text-[11px] text-amber-300 hover:text-white underline ml-2 cursor-pointer"
              >
                Sair da Amostra
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & System Name */}
          <div className="flex items-center gap-3">
            <Link href="/indicadores" className="flex items-center gap-2.5 group">
              <div className="w-10 h-7 rounded bg-[#EEEEEE] p-0.5 border border-[#E5E7EB] flex items-center justify-center shadow-xs group-hover:border-[#171A20] transition-colors">
                <img
                  src="/logo.svg"
                  alt="PharmaCare Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold text-[#171A20] tracking-tight">
                    PharmaCare
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E82127]" />
                </div>
                <p className="text-[11px] text-[#5C5E62] leading-none hidden sm:block">
                  Cuidado Farmacêutico & Macrorregionais
                </p>
              </div>
            </Link>
          </div>

          {/* Right Controls: Unit Selector + User Profile */}
          <div className="flex items-center gap-3">
            {/* Unit Context Selector */}
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <label className="text-[10px] font-medium uppercase text-[#5C5E62] block leading-none mb-1">
                  Unidade em Foco:
                </label>
                <div className="relative">
                  <select
                    value={selectedUnitId}
                    onChange={(e) => setSelectedUnitId(e.target.value)}
                    className="h-8 pl-8 pr-7 text-xs font-medium text-[#171A20] bg-[#F4F4F6] hover:bg-[#EAEBED] border border-[#E5E7EB] rounded cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#171A20] transition-colors appearance-none"
                  >
                    <option value="all">Todas as Unidades (Macrorregional)</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.municipality})
                      </option>
                    ))}
                  </select>
                  <Building2 className="w-3.5 h-3.5 text-[#5C5E62] absolute left-2.5 top-2.5 pointer-events-none" />
                  <ChevronDown className="w-3 h-3 text-[#5C5E62] absolute right-2 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Unit Permission Badge */}
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] uppercase font-medium text-[#5C5E62] leading-none mb-1">
                Vínculo de Trabalho
              </span>
              {canEdit ? (
                <Badge variant="success" className="text-[11px] py-0.5">
                  <Pencil className="w-3 h-3" />
                  {currentUser.role === "admin"
                    ? "Admin Geral (Permissão Total)"
                    : `${activeUnit?.name || "Sua Unidade"} · Permissão de Edição`}
                </Badge>
              ) : (
                <Badge variant="warning" className="text-[11px] py-0.5">
                  <Lock className="w-3 h-3" />
                  Somente Leitura
                </Badge>
              )}
            </div>

            {/* Profile Section - AUTENTICADO E SEGURO */}
            <div className="flex items-center gap-2 pl-3 border-l border-[#E5E7EB]">
              {/* Avatar com Iniciais */}
              <div className="w-8 h-8 rounded-full bg-[#171A20] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                {initials || <User className="w-4 h-4" />}
              </div>

              {/* Informações Reais do Usuário Autenticado */}
              <div className="text-right hidden sm:block">
                <div className="flex items-center justify-end gap-1.5">
                  <p className="text-xs font-bold text-[#171A20] leading-tight">
                    {currentUser.full_name}
                  </p>
                  {currentUser.role === "admin" && (
                    <span className="text-[9px] bg-red-100 text-red-700 px-1 py-0.2 rounded font-semibold">
                      ADMIN
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#5C5E62] leading-tight">
                  {currentUser.crf || currentUser.email}
                </p>
              </div>

              {/* Botão de Logout Seguro */}
              <button
                type="button"
                onClick={handleSignOut}
                title="Encerrar Sessão e Sair do Sistema"
                className="p-1.5 rounded text-[#5C5E62] hover:text-[#E82127] hover:bg-red-50 transition-colors ml-1 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Alert Banner when viewing another unit */}
      {isViewingOtherUnit && (
        <div className="w-full bg-[#FFF8E6] border-y border-[#FEE6A8] px-4 py-2 transition-all animate-in fade-in duration-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs text-[#8A5B00]">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#C67C00] shrink-0" />
              <span>
                <strong>Modo Visualização (Somente Leitura)</strong> — Você está visualizando os dados da unidade{" "}
                <span className="font-semibold underline">
                  {selectedUnit?.name || "selecionada"}
                </span>. A criação e alteração de registros estão restritas à sua unidade de lotação (
                <strong>{activeUnit?.name}</strong>).
              </span>
            </div>
            <button
              onClick={() => {
                if (currentUser.unit_id) {
                  setSelectedUnitId(currentUser.unit_id);
                }
              }}
              className="text-xs font-medium text-[#171A20] hover:underline shrink-0 cursor-pointer"
            >
              Voltar para minha unidade
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
