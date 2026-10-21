"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context/AppContext";

export default function RootRedirectPage() {
  const router = useRouter();
  const { isAuthenticated, currentUser, authChecked } = useApp();

  useEffect(() => {
    if (!authChecked) return;

    if (isAuthenticated || currentUser) {
      router.replace("/indicadores");
    } else {
      router.replace("/login");
    }
  }, [isAuthenticated, currentUser, authChecked, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#171A20] text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-[#E82127] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-[#A0A2A8] font-medium tracking-wide">
          Carregando CimBahia...
        </p>
      </div>
    </div>
  );
}
