"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Scale,
  ShieldCheck,
  Pill,
  BookOpen,
  Users,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Building2,
  FileText,
  LogIn,
  Stethoscope,
  Gavel,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/context/AppContext";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, currentUser } = useApp();
  const [quickSearchTerm, setQuickSearchTerm] = useState("");

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSearchTerm.trim()) {
      router.push(`/consulta-publica?q=${encodeURIComponent(quickSearchTerm.trim())}`);
    } else {
      router.push("/consulta-publica");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white">
      {/* ========================================================================= */}
      {/* CABEÇALHO INSTITUCIONAL PÚBLICO */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo / Marca */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs group-hover:bg-emerald-700 transition-colors">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-slate-900 font-sans">
                  CIMBAHIA
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  SESAB
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-none hidden sm:block">
                Centro de Informação sobre Medicamentos da Bahia
              </p>
            </div>
          </Link>

          {/* Navegação Rápida Superior */}
          <div className="flex items-center gap-3">
            <Link href="/consulta-publica">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-9 px-3 gap-1.5 text-slate-700 hover:text-slate-900 border-slate-300 shadow-xs font-semibold"
              >
                <Scale className="w-3.5 h-3.5 text-emerald-600" />
                <span>Consultar Pareceres</span>
              </Button>
            </Link>

            {isAuthenticated && currentUser ? (
              <Link href="/indicadores">
                <Button
                  size="sm"
                  className="text-xs h-9 px-3.5 bg-slate-900 hover:bg-slate-800 text-white gap-1.5 shadow-xs font-semibold"
                >
                  <span>Acessar Painel</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button
                  size="sm"
                  className="text-xs h-9 px-3.5 bg-slate-900 hover:bg-slate-800 text-white gap-1.5 shadow-xs font-semibold"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Acesso Restrito</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-slate-200/80 bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Superintendência de Assistência Farmacêutica • SAFTEC / DASF
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Centro de Informação sobre Medicamentos da Bahia
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 leading-relaxed">
            Unidade técnico-científica da Secretaria da Saúde do Estado da Bahia (SESAB)
            dedicada a promover o <strong>Uso Racional de Medicamentos (URM)</strong> no âmbito
            do SUS com base em evidências científicas independentes.
          </p>

          {/* Busca Rápida de Pareceres e CTAs */}
          <div className="pt-4 max-w-xl mx-auto space-y-4">
            <form onSubmit={handleQuickSearch} className="relative flex items-center shadow-sm rounded-xl">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={quickSearchTerm}
                onChange={(e) => setQuickSearchTerm(e.target.value)}
                placeholder="Buscar por fármaco, princípio ativo ou diagnóstico CID..."
                className="w-full h-11 pl-10 pr-28 text-xs sm:text-sm bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-emerald-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-sans"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Buscar</span>
              </button>
            </form>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link href="/consulta-publica" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-sm flex items-center justify-center gap-2"
                >
                  <Scale className="w-4 h-4" />
                  <span>Consultar Banco de Pareceres</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>

              <Link href="/login" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-11 px-5 border-slate-300 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4 text-slate-500" />
                  <span>Acesso de Pareceristas & Equipe</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* O QUE É O CIMBAHIA */}
      {/* ========================================================================= */}
      <section className="py-12 sm:py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Institucional
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              O que é o CIMBAHIA?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              O <strong>Centro de Informação sobre Medicamentos do Estado da Bahia (CIMBAHIA)</strong> é
              um setor vinculado à <strong>Diretoria de Assistência Farmacêutica (DASF)</strong>, integrante
              da <strong>Superintendência de Assistência Farmacêutica, Ciência e Tecnologia em Saúde (SAFTEC)</strong> da
              Secretaria da Saúde do Estado da Bahia (SESAB).
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Sua atuação tem como objetivo central fornecer informações técnico-científicas objetivas,
              independentes e atualizadas, devidamente avaliadas com base na melhor evidência clínica disponível,
              assegurando a segurança do paciente e a sustentabilidade do SUS.
            </p>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Diretrizes Fundamentais
            </h3>
            <ul className="space-y-3 text-xs text-slate-600">
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                <span>
                  <strong>Uso Racional de Medicamentos:</strong> Tratamentos indicados com precisão, na dose correta e pelo período adequado.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                <span>
                  <strong>Saúde Baseada em Evidências:</strong> Respaldo em estudos clínicos de alta qualidade e diretrizes nacionais/internacionais.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                <span>
                  <strong>Alinhamento Regulatório:</strong> Conformidade estrita com RENAME, Protocolos Clínicos (PCDT/MS) e Conitec.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                <span>
                  <strong>Transparência Pública:</strong> Apoio direto ao Judiciário, Ministério Público e cidadãos do Estado da Bahia.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PILARES DE ATUAÇÃO */}
        {/* ========================================================================= */}
        <div className="space-y-6 pt-6">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Competências
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Áreas de Atuação do Centro
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Pilar 1 */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5 hover:border-slate-300 transition-colors shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <Scale className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">
                Pareceres Farmacêuticos
              </h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Elaboração de pareceres técnicos fundamentados para instruir demandas administrativas e judiciais de medicamentos especializados.
              </p>
            </div>

            {/* Pilar 2 */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5 hover:border-slate-300 transition-colors shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <Gavel className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">
                Apoio ao Judiciário
              </h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Assessoramento a magistrados, Ministério Público (MPBA) e Defensoria Pública (DPE-BA) para qualificar a tomada de decisão jurídica.
              </p>
            </div>

            {/* Pilar 3 */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5 hover:border-slate-300 transition-colors shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <Compass className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">
                Apoio à Gestão do SUS
              </h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Subsídio aos gestores da SESAB na avaliação de tecnologias em saúde e incorporação/desincorporação de fármacos.
              </p>
            </div>

            {/* Pilar 4 */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5 hover:border-slate-300 transition-colors shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">
                Produção Científica
              </h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Desenvolvimento de notas técnicas, fichas informativas e boletins de farmacovigilância para os serviços de saúde.
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BANNER DE DESTAQUE: CONSULTA DE PARECERES */}
        {/* ========================================================================= */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800">
              Transparência & Jurisprudência Farmacêutica
            </span>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Consulte Pareceres Técnicos Emitidos
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pesquise o acervo de manifestações e fundamentações clínicas do CIMBAHIA por fármaco,
              diagnóstico CID-10 ou desfecho regulatório.
            </p>
          </div>

          <Link href="/consulta-publica" className="shrink-0 w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto h-11 px-6 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              <Scale className="w-4 h-4" />
              <span>Acessar Pareceres</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* ========================================================================= */}
        {/* QUEM PODE CONSULTAR */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Público-Alvo
            </span>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Quem pode utilizar o serviço?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center space-y-2">
              <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center mx-auto">
                <Stethoscope className="w-4 h-4 text-emerald-700" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Profissionais de Saúde</h4>
              <p className="text-[11px] text-slate-500">
                Médicos, farmacêuticos, enfermeiros e equipes do SUS buscando orientação posológica e evidências terapêuticas.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center space-y-2">
              <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center mx-auto">
                <Gavel className="w-4 h-4 text-blue-700" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Operadores do Direito</h4>
              <p className="text-[11px] text-slate-500">
                Magistrados, defensores e promotores de justiça que necessitam de parecer técnico em demandas de saúde.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center space-y-2">
              <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center mx-auto">
                <Users className="w-4 h-4 text-indigo-700" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Cidadãos e Pacientes</h4>
              <p className="text-[11px] text-slate-500">
                Usuários do SUS em busca de esclarecimentos sobre uso correto, protocolos e acesso a medicamentos pelo Estado.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* RODAPÉ INSTITUCIONAL & CONTATOS OFICIAIS DA SESAB */}
      {/* ========================================================================= */}
      <footer className="mt-auto border-t border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600">
            {/* Coluna 1: Órgão Oficial */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span className="font-bold text-slate-900">CIMBAHIA • SESAB</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Centro de Informação sobre Medicamentos do Estado da Bahia. Diretoria de Assistência Farmacêutica (DASF) / SAFTEC.
              </p>
              <p className="text-[11px] text-slate-400">
                Governo do Estado da Bahia — Secretaria da Saúde.
              </p>
            </div>

            {/* Coluna 2: Canais Oficiais */}
            <div className="space-y-2">
              <span className="font-bold text-slate-900 block">Canais de Contato</span>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <a
                    href="mailto:dasf.cimbahia@saude.ba.gov.br"
                    className="hover:text-emerald-700 hover:underline"
                  >
                    dasf.cimbahia@saude.ba.gov.br
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>(71) 3115-4247 / 3115-8389</span>
                </div>
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  <a
                    href="https://www.ba.gov.br/saude/atencao-a-saude/comofuncionaosus/medicamentos/centro-de-informacao-sobre-medicamentos"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-emerald-700 hover:underline"
                  >
                    Página Oficial SESAB (ba.gov.br)
                  </a>
                </div>
              </div>
            </div>

            {/* Coluna 3: Localização */}
            <div className="space-y-2">
              <span className="font-bold text-slate-900 block">Endereço Institucional</span>
              <div className="flex items-start gap-2 text-[11px] text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <span>
                  4ª Avenida, nº 400, Plataforma 6, Lado B, Centro Administrativo da Bahia (CAB), Salvador – BA, CEP 41750-300
                </span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <span>
              © {new Date().getFullYear()} CIMBAHIA — Centro de Informação sobre Medicamentos da Bahia. Todos os direitos reservados.
            </span>
            <div className="flex items-center gap-3">
              <Link href="/pareceres" className="hover:text-slate-600">
                Banco de Pareceres
              </Link>
              <span>•</span>
              <Link href="/login" className="hover:text-slate-600">
                Acesso Restrito
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
