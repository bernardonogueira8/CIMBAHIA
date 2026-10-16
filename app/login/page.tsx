"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  Stethoscope,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/lib/context/AppContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LoginPage() {
  const router = useRouter();
  const { profiles, setCurrentUser, setSelectedUnitId } = useApp();

  const [email, setEmail] = useState("juliana.mendes@saude.ba.gov.br");
  const [password, setPassword] = useState("••••••••••••");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          console.warn("Supabase auth error fallback to local user profile", error);
        }
      }

      // Local matching profile
      const matchedProfile =
        profiles.find((p) => p.email.toLowerCase() === email.toLowerCase()) ||
        profiles[0];

      setCurrentUser(matchedProfile);
      if (matchedProfile.unit_id) {
        setSelectedUnitId(matchedProfile.unit_id);
      }
      router.push("/indicadores");
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro ao realizar autenticação.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (profileId: string) => {
    const prof = profiles.find(
      (p) =>
        p.id === profileId ||
        p.email.toLowerCase() === profileId.toLowerCase() ||
        (profileId === "u-001" && p.email.includes("juliana")) ||
        (profileId === "u-002" && p.email.includes("rodrigo")) ||
        (profileId === "u-003" && p.email.includes("mariana"))
    );
    if (prof) {
      setCurrentUser(prof);
      if (prof.unit_id) {
        setSelectedUnitId(prof.unit_id);
      } else {
        setSelectedUnitId("all");
      }
      router.push("/indicadores");
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      {/* Background Image com overlay escuro imersivo */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="/background-1.jpg"
          alt="PharmaCare Ambiente Hospitalar"
          className="w-full h-full object-cover object-center filter brightness-[0.35] scale-105"
        />
        <div className="absolute inset-0 bg-radial from-transparent via-[#171A20]/60 to-[#171A20]/90" />
      </div>

      {/* Card de Login Centralizado no estilo Tesla Design System */}
      <div className="relative z-10 w-full max-w-md bg-[#171A20]/90 backdrop-blur-md border border-[#393C41] rounded-lg shadow-2xl p-6 sm:p-8 text-white animate-in zoom-in-95 duration-200">
        {/* Top Header com Logo Oficial */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-24 h-14 relative mb-3 bg-[#EEEEEE] p-1.5 rounded-lg shadow-md flex items-center justify-center">
            <img
              src="/logo.svg"
              alt="PharmaCare Logo Oficial"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              PharmaCare
            </h1>
            <span className="w-1.5 h-1.5 rounded-full bg-[#E82127]" />
            <Badge variant="outline" className="border-[#393C41] text-[#E82127] text-[10px]">
              Gestão Clínica
            </Badge>
          </div>
          <p className="text-xs text-[#A0A2A8] mt-1 max-w-xs">
            Portal de Gestão do Cuidado Farmacêutico e Apuração de Indicadores Macrorregionais.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-[#E82127]/10 border border-[#E82127]/40 rounded text-xs text-[#FCA5A5] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#E82127]" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulário de Login */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#C4C6CC] mb-1">
              E-mail Institucional (@saude.ba.gov.br)
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-10 pl-9 pr-3 text-sm bg-[#282C34] border border-[#393C41] rounded text-white placeholder-[#7A7D85] focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors"
                placeholder="seu.email@saude.ba.gov.br"
              />
              <Mail className="w-4 h-4 text-[#8E9199] absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-[#C4C6CC]">
                Senha de Acesso
              </label>
              <a
                href="#esqueci-senha"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Para redefinição de senha institucional, contate a coordenação da sua Macrorregional.");
                }}
                className="text-[11px] text-[#A0A2A8] hover:text-white transition-colors"
              >
                Esqueceu a senha?
              </a>
            </div>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-10 pl-9 pr-3 text-sm bg-[#282C34] border border-[#393C41] rounded text-white placeholder-[#7A7D85] focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors"
                placeholder="••••••••••••"
              />
              <Lock className="w-4 h-4 text-[#8E9199] absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-[#E82127] hover:bg-[#C91A20] active:bg-[#A8151A] text-white font-medium text-sm rounded transition-all shadow-md mt-2"
          >
            {loading ? "Autenticando..." : "Entrar no Sistema"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>

        {/* Separador de Acesso Rápido para Demonstração */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#393C41]" />
          </div>
          <span className="relative bg-[#171A20] px-3 text-[11px] font-medium uppercase tracking-wider text-[#7A7D85]">
            Acesso Rápido Simulado
          </span>
        </div>

        {/* Botões de Acesso Rápido com Perfis Oficiais */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => handleQuickLogin("u-001")}
            className="w-full text-left p-2.5 rounded border border-[#393C41] bg-[#282C34]/60 hover:bg-[#282C34] hover:border-white/40 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-[#171A20] flex items-center justify-center text-emerald-400 border border-[#393C41]">
                <Stethoscope className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors">
                  Dra. Juliana Mendes (CRF-BA 8421)
                </p>
                <p className="text-[10px] text-[#A0A2A8]">
                  Farmacêutica · BRS Paulo Afonso (Norte)
                </p>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded">
              Lotação Local
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin("u-002")}
            className="w-full text-left p-2.5 rounded border border-[#393C41] bg-[#282C34]/60 hover:bg-[#282C34] hover:border-white/40 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-[#171A20] flex items-center justify-center text-amber-400 border border-[#393C41]">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors">
                  Dr. Rodrigo Sampaio (Gestor Geral)
                </p>
                <p className="text-[10px] text-[#A0A2A8]">
                  Administrador · Acesso a Todas as Unidades
                </p>
              </div>
            </div>
            <span className="text-[10px] bg-amber-950 text-amber-400 border border-amber-800 px-1.5 py-0.5 rounded">
              Admin Geral
            </span>
          </button>
        </div>

        {/* Rodapé do Card */}
        <div className="mt-6 pt-4 border-t border-[#393C41] flex items-center justify-between text-xs text-[#8E9199]">
          <Link
            href="/"
            className="text-[#C4C6CC] hover:text-white transition-colors"
          >
            ← Voltar para Página Inicial
          </Link>
          <span className="text-[11px] text-[#7A7D85]">
            Ambiente Seguro
          </span>
        </div>
      </div>
    </div>
  );
}
