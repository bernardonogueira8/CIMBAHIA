"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  Stethoscope,
  Users,
  FileCheck2,
  Layers,
  ChevronRight,
  Pill,
  Sparkles,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  const [activeIndicatorTab, setActiveIndicatorTab] = useState<"clinico" | "qualidade" | "gestao">("clinico");

  return (
    <div className="min-h-screen bg-[#F4F4F6] text-[#171A20] selection:bg-[#E82127] selection:text-white">
      {/* 1. FLOATING / TRANSPARENT NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#171A20]/80 backdrop-blur-md border-b border-[#393C41]/80 text-white transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-7 rounded bg-[#EEEEEE] p-0.5 border border-[#393C41] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <img
                  src="/logo.svg"
                  alt="PharmaCare Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-white">
                  PharmaCare
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#E82127]" />
              </div>
            </Link>

            {/* Nav Links */}
            <div className="hidden md:flex items-center space-x-6 text-xs font-medium text-[#C4C6CC]">
              <a href="#pilares" className="hover:text-white transition-colors">
                Pilares Clínicos
              </a>
              <a href="#indicadores" className="hover:text-white transition-colors">
                Os 11 Indicadores
              </a>
              <a href="#fluxo" className="hover:text-white transition-colors">
                Fluxo de Cuidado
              </a>
            </div>

            {/* CTAs */}
            <div className="flex items-center gap-2.5">
              <Link href="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-[#393C41] text-white hover:bg-[#282C34] hover:text-white text-xs"
                >
                  Entrar
                </Button>
              </Link>
              <Link href="/indicadores">
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-[#E82127] hover:bg-[#C91A20] active:bg-[#A8151A] text-white border-none text-xs shadow-md"
                >
                  Painel Clínico
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION FULL-BLEED (COM BACKGROUND-1.JPG DO BRANDBOOK) */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-[#171A20] text-white">
        {/* Background Image com overlay escuro imersivo */}
        <div className="absolute inset-0 z-0">
          <img
            src="/background-1.jpg"
            alt="Ambiente Clínico Hospitalar PharmaCare"
            className="w-full h-full object-cover object-center filter brightness-[0.30] scale-105 transform transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-radial from-transparent via-[#171A20]/70 to-[#171A20]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            {/* Eyebrow */}
            {/* Main Title */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]">
              O Futuro do Cuidado Farmacêutico.
            </h1>

            {/* Subheadline */}
            <p className="mt-5 text-base sm:text-lg text-[#C4C6CC] leading-relaxed font-normal">
              A plataforma definitiva para Bases Regionais e Núcleos Regionais de Saúde.
              Substitua planilhas manuais de indicadores por registro clínico ágil,
              gestão de PRFs e cálculo automatizado dos <strong>11 indicadores oficiais</strong> em tempo real.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link href="/indicadores">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-[#E82127] hover:bg-[#C91A20] active:bg-[#A8151A] text-white border-none font-semibold text-sm shadow-xl"
                >
                  Acessar Painel Clínico
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md text-sm font-medium"
                >
                  Login Institucional
                </Button>
              </Link>
            </div>
          </div>

          {/* KPI Strip (Tesla Engineering Numbers) */}
          <div className="mt-14 pt-8 border-t border-[#393C41]/80 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                11
              </div>
              <p className="text-xs text-[#A0A2A8] mt-1 uppercase font-medium tracking-wider">
                Indicadores Oficiais Apurados
              </p>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-[#E82127] tracking-tight">
                100%
              </div>
              <p className="text-xs text-[#A0A2A8] mt-1 uppercase font-medium tracking-wider">
                Isolamento por Unidade
              </p>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                0 min
              </div>
              <p className="text-xs text-[#A0A2A8] mt-1 uppercase font-medium tracking-wider">
                Cálculo Manual de Planilhas
              </p>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-emerald-400 tracking-tight">
                360°
              </div>
              <p className="text-xs text-[#A0A2A8] mt-1 uppercase font-medium tracking-wider">
                Visão Longitudinal do Paciente
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SEÇÃO PILARES CLÍNICOS (#pilares) */}
      <section id="pilares" className="py-20 bg-white border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="outline" className="mb-2">
              Engenharia de Dados em Saúde Pública
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#171A20] tracking-tight">
              Projetado para a rotina real do Farmacêutico Clínico
            </h2>
            <p className="text-xs sm:text-sm text-[#5C5E62] mt-2">
              Cada funcionalidade foi pensada para eliminar atritos burocráticos e colocar o cuidado centrado no usuário de medicamentos de alto custo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pilar 1 */}
            <div className="p-6 rounded border border-[#E5E7EB] bg-[#FAFAFB] hover:border-[#171A20] transition-colors group">
              <div className="w-10 h-10 rounded bg-[#171A20] text-white flex items-center justify-center mb-4 group-hover:bg-[#E82127] transition-colors">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#171A20] mb-2">
                Longitudinalidade & Evolução SOAP
              </h3>
              <p className="text-xs text-[#5C5E62] leading-relaxed">
                Acompanhe o paciente ao longo de todo o tratamento. Acesse consultas prévias, histórico de desfechos clínicos e anotações SOAP com um único clique.
              </p>
            </div>

            {/* Pilar 2 */}
            <div className="p-6 rounded border border-[#E5E7EB] bg-[#FAFAFB] hover:border-[#171A20] transition-colors group">
              <div className="w-10 h-10 rounded bg-[#171A20] text-white flex items-center justify-center mb-4 group-hover:bg-[#E82127] transition-colors">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#171A20] mb-2">
                Resolução Sistemática de PRFs
              </h3>
              <p className="text-xs text-[#5C5E62] leading-relaxed">
                Registro flexível de 0 a N Problemas Relacionados à Farmacoterapia por atendimento, categorizados em Adesão, Efetividade, Indicação e Segurança.
              </p>
            </div>

            {/* Pilar 3 */}
            <div className="p-6 rounded border border-[#E5E7EB] bg-[#FAFAFB] hover:border-[#171A20] transition-colors group">
              <div className="w-10 h-10 rounded bg-[#171A20] text-white flex items-center justify-center mb-4 group-hover:bg-[#E82127] transition-colors">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#171A20] mb-2">
                Fórmulas Oficiais Automatizadas
              </h3>
              <p className="text-xs text-[#5C5E62] leading-relaxed">
                Sem erros de digitação ou fórmulas corrompidas. O sistema apura numeradores e denominadores instantaneamente para toda a Macrorregional.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. OS 11 INDICADORES OFICIAIS (#indicadores) */}
      <section id="indicadores" className="py-20 bg-[#F4F4F6] border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="default">Metodologia Oficial</Badge>
                <span className="text-xs font-semibold text-[#5C5E62]">
                  Assistência Farmacêutica Especializada
                </span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold text-[#171A20] tracking-tight mt-1">
                Os 11 Indicadores do Cuidado Farmacêutico
              </h2>
              <p className="text-xs text-[#5C5E62] mt-1 max-w-2xl">
                O PharmaCare calcula automaticamente as 11 métricas estabelecidas pela coordenação estadual, organizadas em 3 domínios fundamentais.
              </p>
            </div>

            {/* Selector de Domínio */}
            <div className="flex bg-[#E5E7EB] p-1 rounded space-x-1 shrink-0">
              <button
                onClick={() => setActiveIndicatorTab("clinico")}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${activeIndicatorTab === "clinico"
                  ? "bg-[#171A20] text-white shadow-xs"
                  : "text-[#5C5E62] hover:text-[#171A20]"
                  }`}
              >
                Acompanhamento Clínico (5)
              </button>
              <button
                onClick={() => setActiveIndicatorTab("qualidade")}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${activeIndicatorTab === "qualidade"
                  ? "bg-[#171A20] text-white shadow-xs"
                  : "text-[#5C5E62] hover:text-[#171A20]"
                  }`}
              >
                Segurança & PRFs (3)
              </button>
              <button
                onClick={() => setActiveIndicatorTab("gestao")}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${activeIndicatorTab === "gestao"
                  ? "bg-[#171A20] text-white shadow-xs"
                  : "text-[#5C5E62] hover:text-[#171A20]"
                  }`}
              >
                Dispensação & Coletivo (3)
              </button>
            </div>
          </div>

          {/* Cards dos Indicadores */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeIndicatorTab === "clinico" && (
              <>
                <div className="bg-white p-5 rounded border border-[#E5E7EB] shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold bg-[#F4F4F6] text-[#171A20] px-2 py-0.5 rounded">
                      IND-01
                    </span>
                    <span className="text-[11px] text-[#5C5E62]">Mensal</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#171A20]">
                    Pacientes em Acompanhamento Farmacoterapêutico
                  </h3>
                  <p className="text-xs text-[#5C5E62] mt-1">
                    Número total de usuários com plano de cuidado farmacêutico ativo cadastrado na unidade.
                  </p>
                  <div className="mt-4 pt-3 border-t border-[#F0F1F3] text-[11px] font-mono text-[#171A20]">
                    Capacidade instalada da equipe clínica
                  </div>
                </div>

                <div className="bg-white p-5 rounded border border-[#E5E7EB] shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold bg-[#F4F4F6] text-[#171A20] px-2 py-0.5 rounded">
                      IND-02
                    </span>
                    <span className="text-[11px] text-[#5C5E62]">Mensal</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#171A20]">
                    Pacientes Atendidos no Acompanhamento no Mês
                  </h3>
                  <p className="text-xs text-[#5C5E62] mt-1">
                    Pacientes únicos atendidos em consulta clínica formal (exclui orientações pontuais de balcão).
                  </p>
                  <div className="mt-4 pt-3 border-t border-[#F0F1F3] text-[11px] font-mono text-[#171A20]">
                    COUNT(DISTINCT patient_id) [guidance = false]
                  </div>
                </div>

                <div className="bg-white p-5 rounded border border-[#E5E7EB] shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold bg-[#F4F4F6] text-[#171A20] px-2 py-0.5 rounded">
                      IND-03
                    </span>
                    <span className="text-[11px] text-[#5C5E62]">Mensal</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#171A20]">
                    Primeiras Consultas Farmacêuticas Realizadas
                  </h3>
                  <p className="text-xs text-[#5C5E62] mt-1">
                    Pacientes novos acolhidos para início do acompanhamento farmacoterapêutico no período.
                  </p>
                  <div className="mt-4 pt-3 border-t border-[#F0F1F3] text-[11px] font-mono text-[#171A20]">
                    COUNT(DISTINCT patient_id) [is_new_patient = true]
                  </div>
                </div>

                <div className="bg-white p-5 rounded border border-[#E5E7EB] shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold bg-[#F4F4F6] text-[#171A20] px-2 py-0.5 rounded">
                      IND-04
                    </span>
                    <span className="text-[11px] text-[#5C5E62]">Mensal</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#171A20]">
                    Consultas de Retorno Realizadas no Mês
                  </h3>
                  <p className="text-xs text-[#5C5E62] mt-1">
                    Atendimentos subsequentes para monitorização de efetividade, adesão e segurança.
                  </p>
                  <div className="mt-4 pt-3 border-t border-[#F0F1F3] text-[11px] font-mono text-[#171A20]">
                    COUNT(DISTINCT patient_id) [is_new_patient = false]
                  </div>
                </div>

                <div className="bg-white p-5 rounded border border-[#E5E7EB] shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold bg-[#F4F4F6] text-[#171A20] px-2 py-0.5 rounded">
                      IND-08
                    </span>
                    <span className="text-[11px] text-[#5C5E62]">Mensal</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#171A20]">
                    Pacientes com Alta do Acompanhamento
                  </h3>
                  <p className="text-xs text-[#5C5E62] mt-1">
                    Pacientes que alcançaram estabilidade clínica, autonomia e metas terapêuticas.
                  </p>
                  <div className="mt-4 pt-3 border-t border-[#F0F1F3] text-[11px] font-mono text-[#171A20]">
                    COUNT(DISTINCT patient_id) [discharge = true]
                  </div>
                </div>
              </>
            )}

            {activeIndicatorTab === "qualidade" && (
              <>
                <div className="bg-white p-5 rounded border border-[#E5E7EB] shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold bg-[#F4F4F6] text-[#171A20] px-2 py-0.5 rounded">
                      IND-05
                    </span>
                    <span className="text-[11px] text-[#5C5E62]">Mensal</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#171A20]">
                    PRFs Identificados no Mês
                  </h3>
                  <p className="text-xs text-[#5C5E62] mt-1">
                    Total de desvios, reações adversas e barreiras identificadas durante as consultas.
                  </p>
                  <div className="mt-4 pt-3 border-t border-[#F0F1F3] text-[11px] font-mono text-[#171A20]">
                    COUNT(*) de registros em consultation_prfs
                  </div>
                </div>

                <div className="bg-white p-5 rounded border border-[#E5E7EB] shadow-xs border-emerald-300">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                      IND-06
                    </span>
                    <span className="text-[11px] text-emerald-800 font-semibold">% Resolutividade</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#171A20]">
                    Porcentagem de PRFs Resolvidos
                  </h3>
                  <p className="text-xs text-[#5C5E62] mt-1">
                    Eficácia e resolutividade clínica das condutas e intervenções farmacêuticas pactuadas.
                  </p>
                  <div className="mt-4 pt-3 border-t border-[#F0F1F3] text-[11px] font-mono text-emerald-700">
                    (PRFs Resolvidos / Total de PRFs) × 100
                  </div>
                </div>

                <div className="bg-white p-5 rounded border border-[#E5E7EB] shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold bg-[#F4F4F6] text-[#171A20] px-2 py-0.5 rounded">
                      IND-07
                    </span>
                    <span className="text-[11px] text-[#5C5E62]">Mensal</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#171A20]">
                    Média de Intervenções por Paciente
                  </h3>
                  <p className="text-xs text-[#5C5E62] mt-1">
                    Intensidade de intervenções clínicas farmacêuticas executadas por paciente atendido.
                  </p>
                  <div className="mt-4 pt-3 border-t border-[#F0F1F3] text-[11px] font-mono text-[#171A20]">
                    Total Intervenções / Pacientes Atendidos
                  </div>
                </div>
              </>
            )}

            {activeIndicatorTab === "gestao" && (
              <>
                <div className="bg-white p-5 rounded border border-[#E5E7EB] shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold bg-[#F4F4F6] text-[#171A20] px-2 py-0.5 rounded">
                      IND-09
                    </span>
                    <span className="text-[11px] text-[#5C5E62]">Mensal</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#171A20]">
                    Atividades Coletivas e Grupos Educativos
                  </h3>
                  <p className="text-xs text-[#5C5E62] mt-1">
                    Número de ações coletivas de educação em saúde e promoção do uso racional de medicamentos.
                  </p>
                  <div className="mt-4 pt-3 border-t border-[#F0F1F3] text-[11px] font-mono text-[#171A20]">
                    monthly_data.collective_health_activities
                  </div>
                </div>

                <div className="bg-white p-5 rounded border border-[#E5E7EB] shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold bg-[#F4F4F6] text-[#171A20] px-2 py-0.5 rounded">
                      IND-10
                    </span>
                    <span className="text-[11px] text-[#5C5E62]">Mensal</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#171A20]">
                    Dispensação Administrativa (Fonte AFSESAB)
                  </h3>
                  <p className="text-xs text-[#5C5E62] mt-1">
                    Pacientes atendidos administrativamente na entrega logística regular de medicamentos.
                  </p>
                  <div className="mt-4 pt-3 border-t border-[#F0F1F3] text-[11px] font-mono text-[#171A20]">
                    monthly_data.dispensing_administrative_patients
                  </div>
                </div>

                <div className="bg-white p-5 rounded border border-[#E5E7EB] shadow-xs border-[#E82127]/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold bg-[#FFF0F0] text-[#E82127] px-2 py-0.5 rounded border border-[#FCD5D6]">
                      IND-11
                    </span>
                    <span className="text-[11px] text-[#E82127] font-semibold">% Cobertura</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#171A20]">
                    Cobertura de 1ª Dispensação por Farmacêutico
                  </h3>
                  <p className="text-xs text-[#5C5E62] mt-1">
                    Proporção de novos pacientes que receberam acolhimento farmacêutico no primeiro recebimento do medicamento.
                  </p>
                  <div className="mt-4 pt-3 border-t border-[#F0F1F3] text-[11px] font-mono text-[#E82127]">
                    (1ªs Dispensações / Total Novos Pacientes) × 100
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 5. FLUXO DO CUIDADO FARMACÊUTICO (#fluxo) */}
      <section id="fluxo" className="py-20 bg-white border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="outline" className="mb-2">
              Da Recepção à Alta Clínica
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-bold text-[#171A20] tracking-tight">
              O Fluxo Integrado de Atendimento
            </h2>
            <p className="text-xs sm:text-sm text-[#5C5E62] mt-2">
              Como o PharmaCare organiza as etapas clínicas em uma experiência sem papel e sem perda de dados.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 border border-[#E5E7EB] rounded bg-[#FAFAFB] relative">
              <span className="text-xs font-bold text-[#E82127] tracking-wider block mb-1">
                ETAPA 01
              </span>
              <h3 className="text-sm font-bold text-[#171A20] mb-1">
                Acolhimento & Triagem
              </h3>
              <p className="text-xs text-[#5C5E62]">
                Busca instantânea por CPF com máscara e verificação de consultas anteriores do usuário.
              </p>
            </div>

            <div className="p-4 border border-[#E5E7EB] rounded bg-[#FAFAFB] relative">
              <span className="text-xs font-bold text-[#E82127] tracking-wider block mb-1">
                ETAPA 02
              </span>
              <h3 className="text-sm font-bold text-[#171A20] mb-1">
                Avaliação da Terapia
              </h3>
              <p className="text-xs text-[#5C5E62]">
                Seleção rápida do CID-10 e dos biológicos/medicamentos em uso pelo paciente.
              </p>
            </div>

            <div className="p-4 border border-[#E5E7EB] rounded bg-[#FAFAFB] relative">
              <span className="text-xs font-bold text-[#E82127] tracking-wider block mb-1">
                ETAPA 03
              </span>
              <h3 className="text-sm font-bold text-[#171A20] mb-1">
                Detecção & Manejo de PRF
              </h3>
              <p className="text-xs text-[#5C5E62]">
                Inclusão dinâmica de desvios (Adesão, Efetividade, Indicação, Segurança) e conduta terapêutica.
              </p>
            </div>

            <div className="p-4 border border-[#E5E7EB] rounded bg-[#FAFAFB] relative">
              <span className="text-xs font-bold text-[#E82127] tracking-wider block mb-1">
                ETAPA 04
              </span>
              <h3 className="text-sm font-bold text-[#171A20] mb-1">
                Indicadores Alimentados
              </h3>
              <p className="text-xs text-[#5C5E62]">
                Ao salvar a consulta, a base macrorregional recalcula automaticamente os 11 indicadores do período.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* 6. CTA FINAL COM BACKGROUND-2.JPG */}
      <section className="relative py-28 bg-[#171A20] text-white overflow-hidden">
        {/* Background Image com overlay escuro */}
        <div className="absolute inset-0 z-0">
          <img
            src="/background-2.jpg"
            alt="Infraestrutura de Dados de Saúde"
            className="w-full h-full object-cover object-center filter brightness-[0.25]"
          />
          <div className="absolute inset-0 bg-[#171A20]/80" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
            Pronto para transformar a gestão clínica da sua Macrorregional?
          </h2>
          <p className="text-xs sm:text-sm text-[#C4C6CC] mt-4 max-w-xl mx-auto leading-relaxed">
            Acesse o sistema com suas credenciais institucionais ou navegue pela demonstração do painel oficial.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto bg-[#E82127] hover:bg-[#C91A20] active:bg-[#A8151A] text-white font-semibold text-sm shadow-xl">
                Acessar Sistema
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
            <Link href="/indicadores">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md text-sm font-medium">
                Ver Painel de Indicadores
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 7. FOOTER INSTITUCIONAL */}
      <footer className="bg-[#171A20] text-[#A0A2A8] py-12 border-t border-[#282C34] text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-[#282C34]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-7 rounded bg-[#EEEEEE] p-0.5 border border-[#393C41] flex items-center justify-center">
                <img
                  src="/logo.svg"
                  alt="PharmaCare Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-white font-bold text-sm block">
                  PharmaCare
                </span>
                <span className="text-[11px] text-[#7A7D85]">
                  Monitoramento e Gestão do Cuidado Farmacêutico
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs text-[#C4C6CC]">
              <Link href="/indicadores" className="hover:text-white transition-colors">
                Indicadores Oficiais
              </Link>
              <Link href="/atendimentos" className="hover:text-white transition-colors">
                Atendimentos Clínicos
              </Link>
              <Link href="/pacientes" className="hover:text-white transition-colors">
                Pacientes
              </Link>
              <Link href="/fechamento-mensal" className="hover:text-white transition-colors">
                Fechamento Mensal
              </Link>
              <Link href="/login" className="hover:text-white transition-colors">
                Portal de Acesso
              </Link>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#7A7D85]">
            <p>
              © 2026 PharmaCare · Sistema de Gestão do Cuidado e Acompanhamento Farmacoterapêutico.
            </p>
            <p>
              Padrão Visual: Tesla Design System (TDS) · Tecnologia: Next.js 16 + Supabase.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
