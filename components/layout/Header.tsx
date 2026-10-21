"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Lock,
  Pencil,
  LogOut,
  User,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "@/lib/context/AppContext";
import { Badge } from "@/components/ui/badge";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    currentUser,
    activeUnit,
    canEdit,
    isAuthenticated,
    logout,
  } = useApp();

  // Nas páginas de autenticação ou se não logado, o cabeçalho não é renderizado
  if (pathname === "/" || pathname === "/login" || !isAuthenticated || !currentUser) {
    return null;
  }

  const handleSignOut = async () => {
    await logout();
    router.push("/login");
  };

  const initials = currentUser.full_name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  const roleLabel =
    currentUser.role === "admin" || currentUser.role === "gestor"
      ? "Gestor Geral"
      : currentUser.role === "administrativo"
      ? "Triagem Administrativa"
      : "Farmacêutico(a)";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E5E7EB] bg-white">
      {/* Top Bar Principal CimBahia */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & System Name */}
          <div className="flex items-center gap-3">
            <Link href="/indicadores" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#171A20] to-[#282C34] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5 text-[#E82127]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold text-[#171A20] tracking-tight">
                    CimBahia
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E82127]" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#5C5E62] bg-[#EEEEEE] px-1.5 py-0.2 rounded">
                    SESAB
                  </span>
                </div>
                <p className="text-[11px] text-[#5C5E62] leading-none hidden sm:block">
                  Regulação e Pareceres Farmacêuticos
                </p>
              </div>
            </Link>
          </div>

          {/* Right Controls: User Profile & Lotação */}
          <div className="flex items-center gap-4">
            {/* Unit Lotação Badge */}
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] uppercase font-medium text-[#5C5E62] leading-none mb-1">
                Lotação de Trabalho
              </span>
              {canEdit ? (
                <Badge variant="success" className="text-[11px] py-0.5">
                  <Pencil className="w-3 h-3" />
                  {currentUser.role === "admin" || currentUser.role === "gestor"
                    ? "Gestor Geral (Acesso Total)"
                    : `${activeUnit?.name || "Sua Unidade"} · Permissão Ativa`}
                </Badge>
              ) : (
                <Badge variant="warning" className="text-[11px] py-0.5">
                  <Lock className="w-3 h-3" />
                  Somente Leitura
                </Badge>
              )}
            </div>

            {/* Profile Section */}
            <div className="flex items-center gap-2 pl-3 border-l border-[#E5E7EB]">
              {/* Avatar com Iniciais */}
              <div className="w-8 h-8 rounded-full bg-[#171A20] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                {initials || <User className="w-4 h-4" />}
              </div>

              {/* Informações do Usuário Autenticado */}
              <div className="text-right hidden sm:block">
                <div className="flex items-center justify-end gap-1.5">
                  <p className="text-xs font-bold text-[#171A20] leading-tight">
                    {currentUser.full_name}
                  </p>
                  <span className="text-[9px] bg-red-100 text-red-700 px-1 py-0.2 rounded font-semibold uppercase">
                    {roleLabel}
                  </span>
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
    </header>
  );
}
