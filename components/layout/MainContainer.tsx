"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/lib/context/AppContext";

export function MainContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isDemoMode, authChecked } = useApp();
  const isPublicPage = pathname === "/" || pathname === "/login";

  useEffect(() => {
    if (authChecked && !isPublicPage && !isAuthenticated && !isDemoMode) {
      router.replace("/login");
    }
  }, [authChecked, isPublicPage, isAuthenticated, isDemoMode, router]);

  if (isPublicPage) {
    return <main className="flex-1 w-full">{children}</main>;
  }

  // Enquanto verifica as credenciais de segurança e sessão ativa
  if (!authChecked) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-2 border-[#171A20] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-[#5C5E62] font-mono tracking-wide">
          Verificando credenciais e ambiente de segurança...
        </p>
      </div>
    );
  }

  // Se não autenticado e não estiver no modo de amostra, bloqueia a renderização e redireciona
  if (!isAuthenticated && !isDemoMode) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-2 border-[#E82127] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-[#E82127] font-semibold tracking-wide">
          Acesso restrito. Redirecionando para autenticação...
        </p>
      </div>
    );
  }

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {children}
    </main>
  );
}
