"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FileText,
  PlusCircle,
  Users,
  FolderOpen,
  Building2,
  MapPin,
  ShieldCheck,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/context/AppContext";

export function Navigation() {
  const pathname = usePathname();
  const { canEdit, isAuthenticated, currentUser } = useApp();

  if (pathname === "/" || pathname === "/login" || !isAuthenticated || !currentUser) {
    return null;
  }

  const isGestor = currentUser.role === "admin" || currentUser.role === "gestor";

  const navItems = [
    {
      href: "/indicadores",
      label: "Painel de Indicadores",
      icon: BarChart3,
      exact: true,
    },
    {
      href: "/atendimentos",
      label: "Fila de Processos",
      icon: FileText,
      exact: false,
    },
    {
      href: "/atendimentos/novo",
      label: "Novo Processo",
      icon: PlusCircle,
      exact: true,
      disabled: !canEdit,
      badge: !canEdit ? "Bloqueado" : undefined,
    },
    {
      href: "/pareceres",
      label: "Banco de Pareceres",
      icon: Scale,
      exact: false,
    },
    {
      href: "/pacientes",
      label: "Pacientes",
      icon: Users,
      exact: false,
    },
    {
      href: "/cadastros",
      label: "Catálogos",
      icon: FolderOpen,
      exact: false,
    },
    {
      href: "/unidades",
      label: "Unidades",
      icon: Building2,
      exact: false,
    },
    {
      href: "/usuarios",
      label: "Gestão de Usuários",
      icon: ShieldCheck,
      exact: false,
      visible: isGestor,
    },
  ];

  return (
    <nav className="w-full bg-[#171A20] text-white border-b border-[#282C34]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-1 overflow-x-auto py-2 no-scrollbar">
          {navItems
            .filter((item) => item.visible !== false)
            .map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              if (item.disabled) {
                return (
                  <div
                    key={item.href}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#7A7D85] cursor-not-allowed opacity-50 shrink-0 select-none"
                    title="Ação desabilitada em modo Somente Leitura"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] bg-[#393C41] text-[#A0A2A8] px-1.5 py-0.2 rounded">
                        {item.badge}
                      </span>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded transition-colors shrink-0",
                    isActive
                      ? "bg-white text-[#171A20] shadow-xs font-semibold"
                      : "text-[#C4C6CC] hover:text-white hover:bg-[#282C34]"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-3.5 h-3.5",
                      isActive ? "text-[#E82127]" : "text-[#8E9199]"
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
        </div>
      </div>
    </nav>
  );
}
