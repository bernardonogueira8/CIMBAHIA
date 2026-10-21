"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EstruturaRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/unidades");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh] text-slate-500 text-xs">
      Redirecionando para a central unificada de Unidades & Estrutura Territorial...
    </div>
  );
}
