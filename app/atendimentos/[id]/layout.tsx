import { Suspense } from "react";

export default function DetalhesProcessoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <div className="w-8 h-8 border-2 border-[#171A20] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[#5C5E62] font-mono tracking-wide">
            Carregando processo...
          </p>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
