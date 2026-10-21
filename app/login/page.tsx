"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  LogIn,
  CheckCircle2,
  KeyRound,
  ShieldAlert,
} from "lucide-react";
import { useApp } from "@/lib/context/AppContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const { loginWithCredentials, isAuthenticated, currentUser } = useApp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Modal de Recuperação de Senha
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryMsg, setRecoveryMsg] = useState("");
  const [recoveryError, setRecoveryError] = useState("");

  // Modal de Redefinição Direta de Senha (via token ou link de recovery)
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
          "Solicitação enviada com sucesso! Se o e-mail estiver cadastrado na base, você receberá o link de redefinição."
        );
      } else {
        setRecoveryMsg("Ambiente local: Solicite a alteração da sua senha diretamente ao Gestor/Administrador do sistema.");
      }
    } catch (err: any) {
      setRecoveryError(err?.message || "Erro inesperado ao processar recuperação.");
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-8">
      {/* Background com visual institucional solene */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-[#121418]">
        <img
          src="/background-1.jpg"
          alt="CimBahia Ambiente Institucional"
          className="w-full h-full object-cover object-center filter brightness-[0.25] scale-105"
        />
        <div className="absolute inset-0 bg-radial from-transparent via-[#171A20]/70 to-[#171A20]/95" />
      </div>

      {/* Card de Login Centralizado */}
      <div className="relative z-10 w-full max-w-md bg-[#171A20]/95 backdrop-blur-md border border-[#393C41] rounded-xl shadow-2xl p-6 sm:p-8 text-white animate-in zoom-in-95 duration-200">
        {/* Top Header com Logo Oficial CimBahia */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#282C34] to-[#171A20] border border-[#393C41] p-3 shadow-lg flex items-center justify-center mb-3">
            <ShieldCheck className="w-9 h-9 text-[#E82127]" />
          </div>
          
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              CimBahia
            </h1>
            <span className="w-2 h-2 rounded-full bg-[#E82127]" />
            <Badge variant="outline" className="border-[#393C41] text-[#E82127] text-[10px] tracking-wider uppercase font-semibold">
              Oficial
            </Badge>
          </div>
          <p className="text-xs text-[#A0A2A8] mt-1.5 font-medium max-w-xs">
            Central Integrada de Regulação e Pareceres Farmacêuticos da Bahia
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
                Perfil: {currentUser.role === "admin" ? "Gestor Geral" : "Farmacêutico(a)"}
              </p>
            </div>
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <Button
                type="button"
                size="sm"
                onClick={() => router.push("/indicadores")}
                className="h-7 px-2.5 text-[11px] bg-white text-[#171A20] hover:bg-[#EEEEEE]"
              >
                Painel
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Formulário de Login */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#C4C6CC] block mb-1.5">
              E-mail Institucional *
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-10 pl-9 pr-3 text-sm bg-[#282C34] border border-[#393C41] rounded-lg text-white placeholder-[#7A7D85] focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors"
                placeholder="nome.sobrenome@saude.ba.gov.br"
              />
              <Mail className="w-4 h-4 text-[#8E9199] absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#C4C6CC]">
                Senha de Acesso *
              </label>
              <button
                type="button"
                onClick={() => {
                  setRecoveryEmail(email);
                  setRecoveryMsg("");
                  setRecoveryError("");
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
              <span>Autenticando...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Entrar no Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        {/* Informação Institucional sobre Cadastro */}
        <div className="mt-6 pt-4 border-t border-[#393C41]/60">
          <div className="p-3 bg-[#282C34]/50 border border-[#393C41] rounded-lg flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-[#A0A2A8] leading-relaxed">
              <strong className="text-white">Acesso Exclusivo:</strong> O cadastro de novos usuários (Administrativos e Farmacêuticos) é gerenciado internamente pela coordenação. Contate o Gestor da sua unidade para solicitação de credenciais.
            </div>
          </div>
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
                <p className="font-semibold text-[#171A20]">Como funciona a redefinição:</p>
                <p>
                  Um link criptografado com validade temporária será encaminhado para a sua caixa de entrada institucional.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsForgotModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={recoveryLoading}
              className="bg-[#171A20] text-white hover:bg-[#282C34]"
            >
              {recoveryLoading ? "Enviando..." : "Enviar Link de Recuperação"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* MODAL DE REDEFINIÇÃO DE SENHA */}
      <Dialog
        open={isResetPasswordOpen}
        onOpenChange={setIsResetPasswordOpen}
        title="Criar Nova Senha Institucional"
        description="Defina sua nova credencial de acesso seguro."
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
              Nova Senha * (mínimo 6 caracteres)
            </label>
            <Input
              type="password"
              placeholder="••••••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#393C41] block mb-1">
              Confirmar Nova Senha *
            </label>
            <Input
              type="password"
              placeholder="••••••••••••"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsResetPasswordOpen(false)}
            >
              Fechar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={resetLoading}
              className="bg-[#171A20] text-white hover:bg-[#282C34]"
            >
              {resetLoading ? "Salvando..." : "Confirmar Nova Senha"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
