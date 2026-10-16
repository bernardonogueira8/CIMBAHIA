"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { useApp } from "@/lib/context/AppContext";
import { Badge } from "@/components/ui/badge";

export function Header() {
  const pathname = usePathname();
  const {
    units,
    profiles,
    currentUser,
    selectedUnitId,
    activeUnit,
    selectedUnit,
    canEdit,
    isViewingOtherUnit,
    setCurrentUser,
    setSelectedUnitId,
  } = useApp();

  // Nas páginas de Landing Page e Login, a interface administrativa não é exibida
  if (pathname === "/" || pathname === "/login") {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E5E7EB] bg-white">
      {/* Top Bar */}
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

            {/* Profile Dropdown / Switcher for Testing */}
            <div className="flex items-center gap-2 pl-2 border-l border-[#E5E7EB]">
              <div className="text-right hidden lg:block">
                <p className="text-xs font-semibold text-[#171A20] leading-tight">
                  {currentUser.full_name}
                </p>
                <p className="text-[11px] text-[#5C5E62]">
                  {currentUser.crf || currentUser.role.toUpperCase()}
                </p>
              </div>

              {/* Quick switch profile for live testing admin vs pharmacist */}
              <select
                value={currentUser.id}
                onChange={(e) => {
                  const prof = profiles.find((p) => p.id === e.target.value);
                  if (prof) {
                    setCurrentUser(prof);
                    if (prof.unit_id) {
                      setSelectedUnitId(prof.unit_id);
                    }
                  }
                }}
                title="Trocar usuário simulado"
                className="h-8 px-2 text-xs bg-white border border-[#D1D5DB] rounded text-[#393C41] cursor-pointer focus:outline-none"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.role})
                  </option>
                ))}
              </select>

              <Link
                href="/login"
                title="Sair / Trocar Sessão"
                className="p-1.5 rounded text-[#5C5E62] hover:text-[#E82127] hover:bg-[#F4F4F6] transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </Link>
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
              className="text-xs font-medium text-[#171A20] hover:underline shrink-0"
            >
              Voltar para minha unidade
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
