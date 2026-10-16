"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Building2,
  Stethoscope,
  LogIn,
  ShieldAlert,
  Info,
  CheckCircle2,
  HelpCircle,
  KeyRound,
} from "lucide-react";
import { useApp } from "@/lib/context/AppContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Profile } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const {
    loginWithCredentials,
    enterDemoMode,
    isAuthenticated,
    isDemoMode,
    currentUser,
    logout,
  } = useApp();

  // Estado do formulário de Login Institucional
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Estado do Modal de Recuperação de Senha
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryMsg, setRecoveryMsg] = useState("");
  const [recoveryError, setRecoveryError] = useState("");

  // Estado do Modal de Redefinição Direta de Senha (via token ou link de recovery)
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState("");
  const [resetError, setResetError] = useState("");

  useEffect(() => {
    if (!supabase) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsResetPasswordOpen(true);
      }
    });

    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      setIsResetPasswordOpen(true);
    }

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleUpdateNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    setResetMsg("");

    if (newPassword.length < 6) {
      setResetError("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setResetError("As senhas digitadas não conferem.");
      return;
    }

    setResetLoading(true);
    try {
      if (!supabase) throw new Error("Supabase não configurado.");
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setResetError(`Erro ao atualizar senha: ${error.message}`);
        setResetLoading(false);
        return;
      }

      setResetMsg("Senha alterada com sucesso! Você já pode realizar o login com suas novas credenciais.");
      setTimeout(() => {
        setIsResetPasswordOpen(false);
        setNewPassword("");
        setConfirmNewPassword("");
      }, 2000);
    } catch (err: any) {
      setResetError(err?.message || "Erro inesperado ao redefinir senha.");
    } finally {
      setResetLoading(false);
    }
  };

  // Submissão do Login Real no Supabase Auth
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await loginWithCredentials(email, password);
      if (!res.success) {
        setErrorMsg(
          res.error || "Credenciais inválidas. Verifique seu e-mail e senha cadastrados."
        );
        setLoading(false);
        return;
      }

      router.push("/indicadores");
    } catch (err: any) {
      setErrorMsg(err?.message || "Erro inesperado ao realizar autenticação.");
    } finally {
      setLoading(false);
    }
  };

  // Submissão do Esqueci Minha Senha
  const handleRecoveryPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError("");
    setRecoveryMsg("");

    if (!recoveryEmail.trim()) {
      setRecoveryError("Informe seu e-mail institucional cadastrado.");
      return;
    }

    setRecoveryLoading(true);

    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.resetPasswordForEmail(
          recoveryEmail.trim().toLowerCase(),
          {
            redirectTo: typeof window !== "undefined" ? `${window.location.origin}/login` : undefined,
          }
        );

        if (error) {
          setRecoveryError(`Falha ao solicitar redefinição: ${error.message}`);
          setRecoveryLoading(false);
          return;
        }

        setRecoveryMsg(
          "Solicitação enviada com sucesso! Caso seu e-mail esteja registrado na base institucional, você receberá o link de redefinição. Caso sua rede interna não receba e-mails externos, solicite a redefinição direta ao Administrador Geral da sua unidade."
        );
      } else {
        setRecoveryMsg("Ambiente local: Solicite a alteração da sua senha diretamente ao Administrador Geral no painel de Unidades & Usuários.");
      }
    } catch (err: any) {
      setRecoveryError(err?.message || "Erro inesperado ao processar recuperação.");
    } finally {
      setRecoveryLoading(false);
    }
  };

  // Acionamento do Modo de Amostra / Demonstração
  const handleDemoAccess = (profileId: string) => {
    enterDemoMode(profileId);
    router.push("/indicadores");
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-8">
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
      <div className="relative z-10 w-full max-w-md bg-[#171A20]/95 backdrop-blur-md border border-[#393C41] rounded-xl shadow-2xl p-6 sm:p-8 text-white animate-in zoom-in-95 duration-200">
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
              Acesso Restrito
            </Badge>
          </div>
          <p className="text-xs text-[#A0A2A8] mt-1 max-w-xs">
            Portal Oficial de Monitoramento Farmacêutico e Apuração de Indicadores Macrorregionais.
          </p>
        </div>

        {/* Mensagens de Alerta */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-[#E82127]/15 border border-[#E82127]/50 rounded-lg text-xs text-[#FCA5A5] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#E82127]" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Notificação de Sessão Ativa */}
        {isAuthenticated && currentUser && (
          <div className="mb-4 p-3 bg-[#282C34] border border-[#393C41] rounded-lg text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-white font-semibold">
                Sessão Ativa: {currentUser.full_name}
              </p>
              <p className="text-[10px] text-[#A0A2A8]">
                {isDemoMode ? "Ambiente de Amostra (Sandbox Local)" : "Ambiente Real Conectado"}
              </p>
            </div>
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <Button
                type="button"
                size="sm"
                onClick={() => router.push("/indicadores")}
                className="h-7 px-2.5 text-[11px] bg-white text-[#171A20] hover:bg-[#EEEEEE]"
              >
                Acessar Painel →
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={logout}
                className="h-7 px-2 text-[11px] text-[#FCA5A5] hover:bg-red-950/40"
              >
                Sair
              </Button>
            </div>
          </div>
        )}

        {/* FORMULÁRIO DE LOGIN INSTITUCIONAL */}
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
                className="w-full h-10 pl-9 pr-3 text-sm bg-[#282C34] border border-[#393C41] rounded-lg text-white placeholder-[#7A7D85] focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors"
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
              <button
                type="button"
                onClick={() => {
                  setRecoveryEmail(email !== "@saude.ba.gov.br" ? email : "");
                  setRecoveryError("");
                  setRecoveryMsg("");
                  setIsForgotModalOpen(true);
                }}
                className="text-[11px] text-[#A0A2A8] hover:text-white transition-colors cursor-pointer"
              >
                Esqueceu a senha?
              </button>
            </div>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-10 pl-9 pr-3 text-sm bg-[#282C34] border border-[#393C41] rounded-lg text-white placeholder-[#7A7D85] focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors"
                placeholder="••••••••••••"
              />
              <Lock className="w-4 h-4 text-[#8E9199] absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-white text-[#171A20] hover:bg-[#EEEEEE] font-semibold text-xs uppercase tracking-wider rounded-lg transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading ? (
              <span>Autenticando no Supabase...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Entrar no Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        {/* SEÇÃO SEPARADA: ACESSO DE AMOSTRA / DEMO (SANDBOX) */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#393C41]" />
          </div>
          <div className="relative flex justify-center text-center">
            <span className="bg-[#171A20] px-3 text-[10px] font-bold uppercase tracking-wider text-amber-400 border border-[#393C41] rounded-full py-0.5">
              Ambiente de Amostra (Demonstração)
            </span>
          </div>
        </div>

        <p className="text-[11px] text-[#A0A2A8] text-center mb-3">
          Acesse com uma persona de teste sem necessidade de credenciais:
        </p>

        {/* Botões de Acesso Rápido de Amostra */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => handleDemoAccess("11111111-0000-0000-0000-000000000001")}
            className="w-full text-left p-2.5 rounded-lg border border-[#393C41] bg-[#282C34]/60 hover:bg-[#282C34] hover:border-white/40 transition-colors flex items-center justify-between group cursor-pointer"
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
                  Amostra: Farmacêutica · BRS Paulo Afonso (Norte)
                </p>
              </div>
            </div>
            <span className="text-[9px] bg-emerald-950/60 text-emerald-400 border border-emerald-800/80 px-1.5 py-0.5 rounded font-mono">
              Amostra Local
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleDemoAccess("22222222-0000-0000-0000-000000000002")}
            className="w-full text-left p-2.5 rounded-lg border border-[#393C41] bg-[#282C34]/60 hover:bg-[#282C34] hover:border-white/40 transition-colors flex items-center justify-between group cursor-pointer"
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
                  Amostra: Administrador · Visão de Todas as Unidades
                </p>
              </div>
            </div>
            <span className="text-[9px] bg-amber-950/60 text-amber-400 border border-amber-800/80 px-1.5 py-0.5 rounded font-mono">
              Amostra Geral
            </span>
          </button>
        </div>

        {/* Rodapé institucional */}
        <div className="mt-6 pt-4 border-t border-[#393C41]/60 flex items-center justify-between text-[11px] text-[#7A7D85]">
          <span></span>
          <Link
            href="/"
            className="text-[#A0A2A8] hover:text-white transition-colors"
          >
            Voltar à Página Inicial →
          </Link>
        </div>
      </div>

      {/* MODAL DE RECUPERAÇÃO DE SENHA */}
      <Dialog
        open={isForgotModalOpen}
        onOpenChange={setIsForgotModalOpen}
        title="Recuperação de Senha Institucional"
        description="Solicite a redefinição de acesso para seu e-mail institucional."
        maxWidth="md"
      >
        <form onSubmit={handleRecoveryPassword} className="space-y-4">
          {recoveryError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{recoveryError}</span>
            </div>
          )}

          {recoveryMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{recoveryMsg}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-[#393C41] block mb-1">
              E-mail Institucional Cadastrado *
            </label>
            <Input
              type="email"
              placeholder="seu.email@saude.ba.gov.br"
              value={recoveryEmail}
              onChange={(e) => setRecoveryEmail(e.target.value)}
              required
            />
          </div>

          <div className="p-3 bg-[#F4F4F6] border border-[#E5E7EB] rounded text-[11px] text-[#5C5E62] space-y-2">
            <div className="flex items-start gap-2">
              <KeyRound className="w-4 h-4 text-[#171A20] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#171A20] block">Senha Padrão Inicial:</strong>
                Para os profissionais cadastrados, a senha padrão inicial configurada é <code className="bg-white px-1.5 py-0.5 rounded border border-gray-300 font-mono text-[#171A20]">PharmaCare@2026</code>.
              </div>
            </div>
            <div className="flex items-start gap-2 pt-1 border-t border-gray-200">
              <HelpCircle className="w-4 h-4 text-[#171A20] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#171A20] block">Acesso Gerenciado:</strong>
                Caso seu e-mail institucional pertença a uma intranet ou não receba mensagens externas, o Administrador Geral da Macrorregional pode redefinir sua senha diretamente pelo painel de <strong>Unidades & Usuários</strong>.
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0F1F3]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsForgotModalOpen(false)}
            >
              Fechar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={recoveryLoading}
            >
              {recoveryLoading ? "Enviando solicitação..." : "Enviar Solicitação"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* MODAL DE DEFINIÇÃO DE NOVA SENHA (VIA RECOVERY TOKEN/LINK) */}
      <Dialog
        open={isResetPasswordOpen}
        onOpenChange={setIsResetPasswordOpen}
        title="Definir Nova Senha de Acesso"
        description="Você acessou através de um link de recuperação. Crie uma nova senha de acesso institucional."
        maxWidth="md"
      >
        <form onSubmit={handleUpdateNewPassword} className="space-y-4">
          {resetError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{resetError}</span>
            </div>
          )}

          {resetMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{resetMsg}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-[#393C41] block mb-1">
              Nova Senha de Acesso * (mínimo 6 caracteres)
            </label>
            <Input
              type="password"
              placeholder="Digite sua nova senha"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#393C41] block mb-1">
              Confirme a Nova Senha *
            </label>
            <Input
              type="password"
              placeholder="Confirme a nova senha digitada"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0F1F3]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsResetPasswordOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={resetLoading}
            >
              {resetLoading ? "Salvando..." : "Salvar Nova Senha"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
