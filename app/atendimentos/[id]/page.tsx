"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  Building,
  Pill,
  Sparkles,
  History,
  Printer,
  ShieldCheck,
  Send,
  AlertTriangle,
  FileCheck,
  RefreshCw,
  ExternalLink,
  Save,
  Check,
  X,
  FileSearch,
  Copy,
  BookOpen,
  Scale,
  Trash2,
  ArrowRight,
} from "lucide-react";
import { useApp } from "@/lib/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { Processo, ProcessoItem, ProcessoStatus, TipoParecer, isProcessoInFirstStatus } from "@/lib/types";

export interface ComboDecisionHistoryItem {
  id: string;
  sourceType: "processo_anterior" | "precedente_cimbahia";
  processoSei?: string;
  pacienteNome?: string;
  isSamePatient?: boolean;
  data: string;
  status: "deferido" | "indeferido" | "em_exigencia" | "deferido_parcial";
  farmaceutico: string;
  farmaco: string;
  cidCode: string;
  cidDescricao?: string;
  fundamentacao: string;
  recomendacoes?: string;
  pcdtReferencia?: string;
}

interface PrecedentTemplate {
  keywords: string[];
  cidPrefixes: string[];
  pcdt: string;
  deferido: string;
  indeferido: string;
  em_exigencia: string;
  recomendacoes?: string;
}

const CIMBAHIA_COMBO_PRECEDENTS: PrecedentTemplate[] = [
  {
    keywords: ["adalimumabe", "humira"],
    cidPrefixes: ["m05", "m06", "m45", "l40", "k50"],
    pcdt: "PCDT Artrite Reumatoide / Doença Inflamatória Intestinal (Portaria SAS/MS)",
    deferido:
      "Atende aos critérios de inclusão do PCDT. Comprovada refratariedade prévia a MMCDs convencionais (Metotrexato em dose otimizada de 20-25mg/sem por mais de 12 semanas) e DAS28 > 3.6. Exames de rastreio de tuberculose latente (PPD/IGRA e RX de tórax) e sorologias virais (HIV, hepatites B e C) recentes e negativos. Dispensação inicial aprovada para 3 meses com monitoramento farmacoterapêutico.",
    indeferido:
      "Solicitação indeferida por não cumprimento dos critérios de inclusão do PCDT ministerial. Ausência de comprovação de falha terapêutica ou intolerância a pelo menos dois esquemas prévios com MMCDs sintéticos em doses plenas e tempo preconizado em protocolo.",
    em_exigencia:
      "Diligência documental indispensável: 1) Apresentar resultado de PPD/IGRA ou laudo de pneumologia recente (últimos 12 meses); 2) Relatório médico descritivo com cálculo de índice de atividade de doença (DAS28 / CDAI / BASDAI) antes do início da bioterapia.",
    recomendacoes:
      "Reavaliação de eficácia e segurança (DAS28 / CDAI e hemograma) a cada 3 a 6 meses. Notificar quaisquer infecções ativas.",
  },
  {
    keywords: ["infliximabe", "remicade"],
    cidPrefixes: ["k50", "k51", "m05", "m45"],
    pcdt: "PCDT Doenças Inflamatórias Intestinais (Crohn / RCU) - Portaria SAS/MS",
    deferido:
      "Critérios do PCDT integralmente atendidos. Paciente com Doença de Crohn / Retocolite Ulcerativa em atividade moderada a grave, refratária a corticoterapia e imunossupressor oral (Azatioprina). Colonoscopia com laudo anatomopatológico comprobatório anexada. Rastreio para tuberculose e hepatites virais sem alterações.",
    indeferido:
      "Solicitação não contemplada: ausência de laudo histopatológico/colonoscopia recente e não esgotamento das etapas terapêuticas prévias com corticosteroides e derivados de 5-ASA/imunomoduladores.",
    em_exigencia:
      "Pendente envio de: laudo histopatológico da biópsia endoscópica recente, TCLE assinado pelo médico e paciente e resultado de teste tuberculínico atualizado.",
    recomendacoes:
      "Acompanhamento em centro de infusão com checagem de reações anafiláticas e dosagem de calprotectina fecal para controle de resposta.",
  },
  {
    keywords: ["canabidiol", "cbd", "cannabis"],
    cidPrefixes: ["g40", "g35", "g80", "f84"],
    pcdt: "Demanda Extraordinária / Judicial CimBahia - Diretriz SESAB Canabinoides",
    deferido:
      "Demanda extraordinária aprovada pela Câmara Técnica CimBahia. Paciente diagnosticado com epilepsia farmacorresistente grave, comprovando refratariedade e falha a mais de três esquemas anticonvulsivantes em doses máximas toleradas. Prescrição com Notificação de Receita B e relatório neurológico circunstanciado anexados.",
    indeferido:
      "Indeferimento técnico: Ausência de comprovação de refratariedade aos antiepilépticos padronizados no SUS (Ácido Valproico, Carbamazepina, Clobazam, Lamotrigina, Levetiracetam) ou ausência de relatório neurológico pormenorizado.",
    em_exigencia:
      "Solicita-se complementação documental: 1) Termo de Consentimento Livre e Esclarecido (TCLE) padronizado da SESAB assinado pelo responsável; 2) Relatório neurológico quantificando a frequência mensal de crises convulsivas e reações adversas anteriores.",
    recomendacoes:
      "Controle rigoroso de interações medicamentosas via citocromo P450 e retorno trimestral com diário de crises convulsivas.",
  },
  {
    keywords: ["upadacitinibe", "rinvoq"],
    cidPrefixes: ["k51", "m05", "m06", "l40"],
    pcdt: "PCDT Retocolite Ulcerativa / Artrite Reumatoide - Inibidores de JAK",
    deferido:
      "Indicação clínica aprovada conforme PCDT da Retocolite Ulcerativa / AR. Comprovada perda de resposta secundária ou intolerância a anti-TNF prévio. Paciente sem fatores de risco cardiovascular agudo impeditivos, perfil lipídico e enzimas hepáticas basais compatíveis com a bula e protocolo.",
    indeferido:
      "Indeferido: ausência de comprovação de falha a biológico prévio de 1ª linha previsto em protocolo ou presença de contraindicação absoluta sem detalhamento médico.",
    em_exigencia:
      "Diligência: Enviar dosagem basal de colesterol total e frações, hemograma recente e comprovação de rastreio de tuberculose latente (PPD ou IGRA).",
    recomendacoes:
      "Monitorar perfil lipídico em 12 semanas e avaliar risco de eventos tromboembólicos e herpes-zóster.",
  },
  {
    keywords: ["ocrelizumabe", "ocrevus"],
    cidPrefixes: ["g35"],
    pcdt: "PCDT Esclerose Múltipla - Portaria Conjunta SAES/SCTIE nº 21/2021",
    deferido:
      "Paciente preenche rigorosamente todos os critérios de inclusão do PCDT da Esclerose Múltipla (Portaria Conjunta SAES/SCTIE nº 21/2021). Evidenciada falha a imunomoduladores de 1ª linha e ressonância magnética com critérios de McDonald preenchidos. Rastreio sorológico satisfatório.",
    indeferido:
      "Não atende aos critérios do PCDT: ausência de comprovação de falha a alternativas de primeira linha (Glatirâmer ou Betainterferona) e ausência de neuroimagem recente comprovando atividade inflamatória.",
    em_exigencia:
      "Pendente envio de laudo recente de Ressonância Magnética de Encéfalo/Medula com contraste (últimos 6 meses) e dosagem de imunoglobulinas basais (IgG e IgM).",
    recomendacoes:
      "Administração em ambiente hospitalar/ambulatorial com pré-medicação anti-histamínica e controle semestral de imunoglobulinas.",
  },
  {
    keywords: ["secuquinumabe", "cosentyx"],
    cidPrefixes: ["l40", "m45", "m07"],
    pcdt: "PCDT Psoríase / Espondilite Anquilosante - Portaria SAS/MS",
    deferido:
      "Critérios do PCDT atendidos. Paciente com Psoríase em placas moderada a grave com PASI > 10 e DLQI > 10, com refratariedade documentada a fototerapia e imunossupressor sistêmico oral (Metotrexato). Rastreio infeccioso atualizado.",
    indeferido:
      "Indeferido por não apresentação de índices de gravidade validados (PASI/DLQI) ou ausência de tentativa prévia de tratamentos sistêmicos convencionais da RENAME.",
    em_exigencia:
      "Solicita-se laudo dermatológico com cálculo do escore PASI e DLQI atualizados e resultado do teste tuberculínico (PPD).",
    recomendacoes:
      "Avaliar resposta terapêutica na 12ª semana de indução e manter vigilância contra infecções fúngicas mucocutâneas.",
  },
];

export default function DetalhesProcessoPage() {
  const params = useParams();
  const router = useRouter();
  const processoId = params?.id as string;

  const {
    processos,
    currentUser,
    tiposParecer,
    transicionarProcessoStatus,
    atribuirFarmaceuticoProcesso,
    emitirParecerProcesso,
    retificarParecerProcesso,
    updateProcesso,
    deleteProcesso,
  } = useApp();

  const isFarmaceutico =
    currentUser?.role === "farmaceutico" ||
    currentUser?.role === "admin" ||
    currentUser?.role === "gestor";

  // Processo atual
  const processo = useMemo(() => {
    return processos.find((p) => p.id === processoId) || null;
  }, [processos, processoId]);

  // Histórico de processos anteriores do mesmo paciente
  const patientPastProcessos = useMemo(() => {
    if (!processo || !processo.paciente_id) return [];
    return processos.filter(
      (p) =>
        p.id !== processo.id &&
        (p.paciente_id === processo.paciente_id ||
          (processo.paciente?.cpf && p.paciente?.cpf === processo.paciente.cpf))
    );
  }, [processo, processos]);

  // Estado local para os itens do processo (decisões individuais por combo fármaco+CID)
  const [itemsState, setItemsState] = useState<ProcessoItem[]>([]);
  const [activeItemIndex, setActiveItemIndex] = useState<number>(0);

  // Inicializa os itens quando o processo carrega
  React.useEffect(() => {
    if (processo && processo.items) {
      setItemsState(processo.items);
    }
  }, [processo]);

  // Estados do Parecer Consolidado Unificado
  const [selectedTipoParecerId, setSelectedTipoParecerId] = useState<string>("");
  const [consolidatedJustification, setConsolidatedJustification] = useState("");
  const [consolidatedRecommendations, setConsolidatedRecommendations] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Preenche valores iniciais se já tiver parecer
  React.useEffect(() => {
    if (processo?.parecer?.active_version) {
      setSelectedTipoParecerId(processo.parecer.active_version.tipo_parecer_id || "");
      setConsolidatedJustification(
        processo.parecer.active_version.technical_justification ||
          processo.parecer.active_version.clinical_foundation ||
          ""
      );
      setConsolidatedRecommendations(
        processo.parecer.active_version.recommendations || ""
      );
    }
  }, [processo]);

  // Modais
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isRectifyModalOpen, setIsRectifyModalOpen] = useState(false);
  const [rectificationReason, setRectificationReason] = useState("");

  // Modal de Histórico de Respostas do Combo (Fármaco + CID)
  const [isComboHistoryModalOpen, setIsComboHistoryModalOpen] = useState(false);
  const [selectedComboForHistory, setSelectedComboForHistory] = useState<{
    item: ProcessoItem;
    index: number;
  } | null>(null);
  const [comboHistoryFilter, setComboHistoryFilter] = useState<
    "todos" | "deferido" | "indeferido" | "em_exigencia" | "paciente"
  >("todos");
  const [copiedAlertText, setCopiedAlertText] = useState<string | null>(null);

  if (!processo) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Processo não encontrado</h2>
        <p className="text-xs text-slate-500">
          O processo solicitado não existe ou foi removido.
        </p>
        <Link href="/atendimentos">
          <Button variant="outline" size="sm" className="text-xs">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Voltar à Fila de Atendimentos
          </Button>
        </Link>
      </div>
    );
  }

  // Mapeamento dos 4 status simplificados
  const getNormalizedStatus = (st: ProcessoStatus): "triagem" | "aguardando_parecer" | "em_analise" | "concluido" => {
    if (st === "triagem" || st === "aguardando_triagem" || st === "em_triagem") return "triagem";
    if (st === "aguardando_parecer") return "aguardando_parecer";
    if (st === "em_analise" || st === "em_analise_farmaceutica" || st === "em_exigencia") {
      return "em_analise";
    }
    return "concluido";
  };

  const currentStage = getNormalizedStatus(processo.status);

  // Ação 1: Assumir Parecer
  const handleAssumirParecer = async () => {
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
      await atribuirFarmaceuticoProcesso(processo.id, currentUser.id);
      // Garante status 'em_analise'
      await transicionarProcessoStatus(
        processo.id,
        "em_analise",
        `Parecer assumido por ${currentUser.full_name} (${currentUser.crf || "CRF-BA"})`
      );
    } catch (err) {
      console.error(err);
      alert("Erro ao assumir o parecer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ação: Concluir Triagem (avança para aguardando_parecer)
  const handleConcluirTriagem = async () => {
    if (!processo) return;
    setIsSubmitting(true);
    try {
      await transicionarProcessoStatus(
        processo.id,
        "aguardando_parecer",
        `Triagem documental concluída por ${currentUser?.full_name || "Usuário"}. Encaminhado para a fila de parecer.`
      );
    } catch (err) {
      console.error(err);
      alert("Erro ao concluir a triagem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ação: Confirmar Exclusão do Processo
  const handleConfirmDeleteProcesso = async () => {
    if (!processo) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await deleteProcesso(processo.id);
      if (!res.success) {
        setDeleteError(res.error || "Erro ao excluir processo.");
      } else {
        router.push("/atendimentos");
      }
    } catch (err: unknown) {
      setDeleteError((err as Error).message || "Erro ao excluir processo.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Atualiza um item específico na lista local e salva no processo
  const handleUpdateItemDecision = async (
    index: number,
    status: ProcessoItem["status"],
    justification?: string
  ) => {
    const updated = [...itemsState];
    updated[index] = {
      ...updated[index],
      status: status,
      justification: justification !== undefined ? justification : updated[index].justification,
      evaluated_at: new Date().toISOString(),
      evaluated_by: currentUser?.full_name || "Farmacêutico Parecerista",
    };
    setItemsState(updated);

    try {
      await updateProcesso(processo.id, {
        items: updated,
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Resgate Enriquecido de Decisões e Respostas Anteriores para o combo (Fármaco + CID)
  const getComboDecisionsHistory = useCallback(
    (farmaco: string, cidCode: string, pacienteId?: string): ComboDecisionHistoryItem[] => {
      const decisions: ComboDecisionHistoryItem[] = [];
      const cleanFarmaco = (farmaco || "").toLowerCase().trim();
      const cleanCid = (cidCode || "").toLowerCase().trim();
      const cleanCidPrefix = cleanCid.split(".")[0];
      const farmacoKeyword = cleanFarmaco.split(" ")[0].replace(/[^a-z0-9]/gi, "");

      // 1. Processos reais cadastrados no sistema (outros processos)
      processos.forEach((p) => {
        if (p.id === processo.id) return;
        p.items?.forEach((it) => {
          const itemFarmaco = (it.farmaco_substancia || it.medication_name || "").toLowerCase().trim();
          const itemCid = (it.cid_code || "").toLowerCase().trim();
          const itemCidPrefix = itemCid.split(".")[0];

          // Critério de correspondência de fármaco
          const matchesFarmaco =
            itemFarmaco.length > 0 &&
            cleanFarmaco.length > 0 &&
            (itemFarmaco.includes(cleanFarmaco) ||
              cleanFarmaco.includes(itemFarmaco) ||
              (farmacoKeyword.length >= 3 && itemFarmaco.includes(farmacoKeyword)));

          // Critério de correspondência de CID (exato ou mesmo prefixo ex: K50 com K50.0)
          const matchesCid =
            itemCid.length > 0 &&
            cleanCid.length > 0 &&
            (itemCid === cleanCid ||
              itemCidPrefix === cleanCidPrefix ||
              cleanCid.startsWith(itemCidPrefix) ||
              itemCid.startsWith(cleanCidPrefix));

          if (matchesFarmaco && matchesCid) {
            const isSamePat = Boolean(
              pacienteId &&
                (p.paciente_id === pacienteId ||
                  (processo.paciente?.cpf && p.paciente?.cpf === processo.paciente.cpf))
            );

            const just =
              it.justification ||
              p.parecer?.active_version?.technical_justification ||
              p.parecer?.active_version?.clinical_foundation ||
              "";

            const regEffect = p.parecer?.active_version?.regulatory_effect as string | undefined;
            const rawStatus: "deferido" | "indeferido" | "em_exigencia" | "deferido_parcial" =
              it.status === "deferido" ||
              it.status === "indeferido" ||
              it.status === "em_exigencia" ||
              it.status === "deferido_parcial"
                ? it.status
                : regEffect === "deferido"
                ? "deferido"
                : regEffect === "indeferido"
                ? "indeferido"
                : regEffect === "exigencia" || regEffect === "em_exigencia"
                ? "em_exigencia"
                : regEffect === "deferido_parcial"
                ? "deferido_parcial"
                : p.status.includes("deferido")
                ? "deferido"
                : p.status.includes("indeferido")
                ? "indeferido"
                : p.status === "em_exigencia"
                ? "em_exigencia"
                : "deferido";

            decisions.push({
              id: `proc-${p.id}-${it.id}`,
              sourceType: "processo_anterior",
              processoSei: p.numero_sei,
              pacienteNome: p.paciente?.full_name || "Paciente do SUS",
              isSamePatient: isSamePat,
              data: p.parecer?.active_version?.created_at || p.data_abertura,
              status: rawStatus,
              farmaceutico:
                p.parecer?.active_version?.pharmacist_name ||
                p.assigned_pharmacist?.full_name ||
                it.evaluated_by ||
                "Farmacêutico(a) Parecerista CimBahia",
              farmaco: it.farmaco_substancia || it.medication_name,
              cidCode: it.cid_code,
              cidDescricao: it.cid_description,
              fundamentacao:
                just ||
                `Decisão registrada em processo prévio para ${it.medication_name} no diagnóstico ${it.cid_code}. Critérios de avaliação técnica aplicados.`,
              recomendacoes: p.parecer?.active_version?.recommendations || undefined,
            });
          }
        });
      });

      // 2. Precedentes Oficiais Padronizados CimBahia / PCDT SESAB
      let matchedPrecedent: PrecedentTemplate | undefined = CIMBAHIA_COMBO_PRECEDENTS.find(
        (prec) =>
          prec.keywords.some((kw) => cleanFarmaco.includes(kw)) &&
          (prec.cidPrefixes.some((pfx) => cleanCid.startsWith(pfx)) || cleanCid.length === 0)
      );

      if (!matchedPrecedent) {
        matchedPrecedent = CIMBAHIA_COMBO_PRECEDENTS.find((prec) =>
          prec.keywords.some((kw) => cleanFarmaco.includes(kw))
        );
      }

      if (matchedPrecedent) {
        decisions.push(
          {
            id: `prec-def-${farmacoKeyword}-${cleanCidPrefix}`,
            sourceType: "precedente_cimbahia",
            data: "2026-01-15",
            status: "deferido",
            farmaceutico: "Câmara Técnica CimBahia / Protocolos SESAB",
            farmaco: farmaco,
            cidCode: cidCode,
            pcdtReferencia: matchedPrecedent.pcdt,
            fundamentacao: matchedPrecedent.deferido,
            recomendacoes: matchedPrecedent.recomendacoes,
          },
          {
            id: `prec-indef-${farmacoKeyword}-${cleanCidPrefix}`,
            sourceType: "precedente_cimbahia",
            data: "2026-01-15",
            status: "indeferido",
            farmaceutico: "Câmara Técnica CimBahia / Protocolos SESAB",
            farmaco: farmaco,
            cidCode: cidCode,
            pcdtReferencia: matchedPrecedent.pcdt,
            fundamentacao: matchedPrecedent.indeferido,
            recomendacoes: "Orientar o requerente quanto a alternativas terapêuticas padronizadas no SUS.",
          },
          {
            id: `prec-exig-${farmacoKeyword}-${cleanCidPrefix}`,
            sourceType: "precedente_cimbahia",
            data: "2026-01-15",
            status: "em_exigencia",
            farmaceutico: "Câmara Técnica CimBahia / Protocolos SESAB",
            farmaco: farmaco,
            cidCode: cidCode,
            pcdtReferencia: matchedPrecedent.pcdt,
            fundamentacao: matchedPrecedent.em_exigencia,
            recomendacoes: "Fixar prazo de 30 dias para atendimento das pendências documentais.",
          }
        );
      } else {
        // Fallback institucional padronizado para qualquer outro combo
        decisions.push(
          {
            id: `prec-gen-def-${farmacoKeyword || "farmaco"}-${cleanCidPrefix || "cid"}`,
            sourceType: "precedente_cimbahia",
            data: "2026-01-10",
            status: "deferido",
            farmaceutico: "Comissão de Farmácia e Terapêutica • CimBahia",
            farmaco: farmaco,
            cidCode: cidCode,
            pcdtReferencia: "Diretrizes Clínicas e PCDT do Ministério da Saúde / SESAB",
            fundamentacao: `Solicitação atende aos critérios técnico-regulatórios do PCDT da patologia indicada e das normas de dispensação do CEAF/SUS. Relatório médico circunstanciado comprova o diagnóstico, refratariedade aos tratamentos prévios e exames de segurança atualizados. Deferimento favorável com monitoramento farmacoterapêutico.`,
            recomendacoes: "Dispensação programada com reavaliação periódica a cada 3 a 6 meses.",
          },
          {
            id: `prec-gen-indef-${farmacoKeyword || "farmaco"}-${cleanCidPrefix || "cid"}`,
            sourceType: "precedente_cimbahia",
            data: "2026-01-10",
            status: "indeferido",
            farmaceutico: "Comissão de Farmácia e Terapêutica • CimBahia",
            farmaco: farmaco,
            cidCode: cidCode,
            pcdtReferencia: "Diretrizes Clínicas e PCDT do Ministério da Saúde / SESAB",
            fundamentacao: `Solicitação indeferida por não cumprimento dos critérios de elegibilidade do protocolo clínico ministerial. Existem alternativas terapêuticas padronizadas de primeira linha no Componente Básico / Especializado da Assistência Farmacêutica não esgotadas, sem comprovação documental de falha ou contraindicação médica.`,
            recomendacoes: "Notificar polo de atendimento municipal para avaliar alternativas na RENAME.",
          },
          {
            id: `prec-gen-exig-${farmacoKeyword || "farmaco"}-${cleanCidPrefix || "cid"}`,
            sourceType: "precedente_cimbahia",
            data: "2026-01-10",
            status: "em_exigencia",
            farmaceutico: "Comissão de Farmácia e Terapêutica • CimBahia",
            farmaco: farmaco,
            cidCode: cidCode,
            pcdtReferencia: "Diretrizes Clínicas e PCDT do Ministério da Saúde / SESAB",
            fundamentacao: `Diligência técnica: O processo requer complementação documental para prosseguimento da análise. Solicita-se: 1) Relatório descritivo com histórico detalhado dos tratamentos anteriores e posologias; 2) Exames complementares comprobatórios do diagnóstico e segurança nos últimos 12 meses; 3) Laudo de Solicitação de Medicamento (LME) preenchido e assinado.`,
            recomendacoes: "Conceder prazo regulamentar para envio dos documentos pendentes.",
          }
        );
      }

      // Ordenação: 1º Deste mesmo paciente, 2º Processos anteriores reais, 3º Precedentes CimBahia
      return decisions.sort((a, b) => {
        if (a.isSamePatient && !b.isSamePatient) return -1;
        if (!a.isSamePatient && b.isSamePatient) return 1;
        if (a.sourceType === "processo_anterior" && b.sourceType !== "processo_anterior") return -1;
        if (a.sourceType !== "processo_anterior" && b.sourceType === "processo_anterior") return 1;
        return 0;
      });
    },
    [processos, processo]
  );

  // Ações de Histórico do Combo
  const handleOpenComboHistory = (item: ProcessoItem, index: number) => {
    setSelectedComboForHistory({ item, index });
    setComboHistoryFilter("todos");
    setIsComboHistoryModalOpen(true);
  };

  const handleApplyHistoryDecision = async (
    itemIndex: number,
    historyItem: ComboDecisionHistoryItem
  ) => {
    await handleUpdateItemDecision(
      itemIndex,
      historyItem.status as ProcessoItem["status"],
      historyItem.fundamentacao
    );
    setCopiedAlertText(
      `Decisão (${historyItem.status.toUpperCase()}) e fundamentação técnica aplicadas com sucesso ao item #${itemIndex + 1}!`
    );
    setTimeout(() => {
      setCopiedAlertText(null);
    }, 4000);
  };

  const handleCopyJustificationText = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedAlertText("Texto da fundamentação copiado para a área de transferência!");
    setTimeout(() => {
      setCopiedAlertText(null);
    }, 3000);
  };

  // Ação 2: Gerar Parecer Consolidado com base nas decisões de cada combo
  const handleGerarParecerConsolidado = () => {
    const totalItems = itemsState.length;
    const deferidos = itemsState.filter((it) => it.status === "deferido").length;
    const indeferidos = itemsState.filter((it) => it.status === "indeferido").length;
    const exigencias = itemsState.filter((it) => it.status === "em_exigencia").length;

    let conclusaoGeral = "DEFERIMENTO INTEGRAL";
    if (indeferidos === totalItems) {
      conclusaoGeral = "INDEFERIMENTO TÉCNICO";
    } else if (exigencias > 0) {
      conclusaoGeral = "PENDÊNCIA / EM EXIGÊNCIA";
    } else if (deferidos > 0 && indeferidos > 0) {
      conclusaoGeral = "DEFERIMENTO PARCIAL";
    }

    let texto = `PARECER TÉCNICO FARMACÊUTICO CONSOLIDADO - SESAB / CIMBAHIA\n`;
    texto += `PROCESSO SEI: ${processo.numero_sei}\n`;
    texto += `PACIENTE: ${processo.paciente?.full_name || "NÃO INFORMADO"} (CPF: ${
      processo.paciente?.cpf_not_provided ? "NÃO INFORMADO" : processo.paciente?.cpf || "N/I"
    })\n`;
    texto += `MUNICÍPIO / BRS: ${processo.municipio?.name || "BAHIA"} / ${
      processo.unidade?.name || "BASE REGIONAL"
    }\n`;
    texto += `ORIGEM: ${processo.origem?.name || "DEMANDA ADMINISTRATIVA"}\n`;
    texto += `--------------------------------------------------------------------------------\n\n`;
    texto += `1. ANÁLISE INDIVIDUALIZADA POR FÁRMACO E DIAGNÓSTICO (CID-10):\n\n`;

    itemsState.forEach((it, idx) => {
      const nome = it.farmaco_substancia || it.medication_name;
      const cid = it.cid_nao_informado ? "N/I (Investigação Diagnóstica)" : `${it.cid_code} - ${it.cid_description}`;
      const statusLabel =
        it.status === "deferido"
          ? "DEFERIDO"
          : it.status === "indeferido"
          ? "INDEFERIDO"
          : it.status === "em_exigencia"
          ? "EM EXIGÊNCIA"
          : it.status === "deferido_parcial"
          ? "DEFERIDO PARCIAL"
          : "PENDENTE DE AVALIAÇÃO";

      texto += `Item ${idx + 1}: Fármaco/Substância: ${nome}\n`;
      texto += `Diagnóstico: CID-10 ${cid}\n`;
      if (it.posology || it.monthly_quantity) {
        texto += `Posologia prescrita: ${it.posology || "Conforme receita"}${it.monthly_quantity ? ` | Qtd Mensal: ${it.monthly_quantity}` : ""}\n`;
      }
      texto += `Conclusão do Item: [${statusLabel}]\n`;
      texto += `Fundamentação Técnica: ${
        it.justification || "Avaliação clínica em conformidade com as diretrizes e protocolos vigentes."
      }\n\n`;
    });

    texto += `--------------------------------------------------------------------------------\n`;
    texto += `2. CONCLUSÃO REGULATÓRIA CONSOLIDADA:\n`;
    texto += `Diante do exame documental e técnico, opina-se pelo [${conclusaoGeral}] da demanda nos termos detalhados acima.\n`;

    setConsolidatedJustification(texto);

    // Sugere tipo de parecer compatível
    if (tiposParecer.length > 0 && !selectedTipoParecerId) {
      if (conclusaoGeral.includes("DEFERIMENTO INTEGRAL")) {
        const tp = tiposParecer.find((t) => t.regulatory_effect === "deferido");
        if (tp) setSelectedTipoParecerId(tp.id);
      } else if (conclusaoGeral.includes("INDEFERIMENTO")) {
        const tp = tiposParecer.find((t) => t.regulatory_effect === "indeferido");
        if (tp) setSelectedTipoParecerId(tp.id);
      }
    }
  };

  // Ação 3: Emitir e Concluir Parecer Oficial
  const handleEmitirParecer = async () => {
    if (!consolidatedJustification.trim()) {
      alert("Por favor, preencha a fundamentação consolidada do parecer.");
      return;
    }

    const tp = tiposParecer.find((t) => t.id === selectedTipoParecerId) || {
      id: "tp-default",
      title: "Parecer Técnico Farmacêutico Oficial",
      regulatory_effect: "deferido" as const,
    };

    setIsSubmitting(true);
    try {
      await emitirParecerProcesso(processo.id, {
        tipo_parecer_id: tp.id,
        tipo_parecer_title: tp.title,
        regulatory_effect: tp.regulatory_effect,
        technical_justification: consolidatedJustification,
        clinical_foundation: consolidatedJustification,
        recommendations: consolidatedRecommendations,
      });

      // Atualiza o status de forma direta para o status simplificado "concluido"
      await transicionarProcessoStatus(
        processo.id,
        "concluido",
        `Parecer consolidado emitido e processo concluído por ${
          currentUser?.full_name || "Farmacêutico"
        }`
      );

      alert("Parecer técnico emitido e processo concluído com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao emitir parecer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Retificação de Parecer
  const handleRetificarParecer = async () => {
    if (!rectificationReason.trim()) {
      alert("Informe o motivo da retificação.");
      return;
    }

    const tp = tiposParecer.find((t) => t.id === selectedTipoParecerId) || {
      id: "tp-retif",
      title: "Parecer Técnico Retificado",
      regulatory_effect: "deferido" as const,
    };

    setIsSubmitting(true);
    try {
      await retificarParecerProcesso(
        processo.id,
        {
          tipo_parecer_id: tp.id,
          tipo_parecer_title: tp.title,
          regulatory_effect: tp.regulatory_effect,
          technical_justification: consolidatedJustification,
          clinical_foundation: consolidatedJustification,
          recommendations: consolidatedRecommendations,
        },
        rectificationReason
      );

      setIsRectifyModalOpen(false);
      setRectificationReason("");
      alert("Parecer retificado com sucesso.");
    } catch (err) {
      console.error(err);
      alert("Erro ao retificar parecer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Topo / Voltar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/atendimentos">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-slate-600">
              <ArrowLeft className="h-4 w-4" />
              Voltar à Fila
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 font-mono">
                {processo.numero_sei}
              </h1>
              <Badge
                className={`text-xs ${
                  currentStage === "concluido"
                    ? "bg-emerald-600 text-white"
                    : currentStage === "em_analise"
                    ? "bg-amber-600 text-white"
                    : currentStage === "aguardando_parecer"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-600 text-white"
                }`}
              >
                {currentStage === "concluido"
                  ? "Concluído"
                  : currentStage === "em_analise"
                  ? "Em Análise"
                  : currentStage === "aguardando_parecer"
                  ? "Aguardando Parecer"
                  : "Criar Processo (Triagem)"}
              </Badge>
              {processo.priority === "urgente" && (
                <Badge variant="danger" className="text-[10px]">
                  Urgente
                </Badge>
              )}
              {processo.priority === "judicial" && (
                <Badge className="text-[10px] bg-purple-700 text-white">
                  Mandado Judicial
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Autuado em {formatDate(processo.data_abertura)} • Origem:{" "}
              {processo.origem?.name || "SESAB / CimBahia"}
            </p>
          </div>
        </div>

        {/* Botão de Histórico do Paciente e Impressão */}
        <div className="flex items-center gap-2">
          {patientPastProcessos.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsHistoryModalOpen(true)}
              className="text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50 gap-1.5"
            >
              <History className="h-3.5 w-3.5" />
              Histórico do Paciente ({patientPastProcessos.length})
            </Button>
          )}

          {processo.parecer?.active_version && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPrintModalOpen(true)}
              className="text-xs gap-1.5 text-slate-700"
            >
              <Printer className="h-3.5 w-3.5" />
              Imprimir Parecer
            </Button>
          )}

          {isProcessoInFirstStatus(processo) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setDeleteError(null);
                setIsDeleteModalOpen(true);
              }}
              className="text-xs gap-1.5 text-rose-700 border-rose-200 hover:bg-rose-50 hover:border-rose-300 transition-colors"
              title="Excluir Processo SEI (Permitido apenas no primeiro status)"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Excluir Processo
            </Button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LINHA DO TEMPO SIMPLIFICADA (4 ETAPAS) */}
      {/* ========================================================================= */}
      <Card className="bg-slate-50/50 border-slate-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            {/* 1. Criar Processo (Triagem) */}
            <div
              className={`p-2.5 rounded-lg border font-medium ${
                currentStage === "triagem"
                  ? "bg-blue-50 border-blue-300 text-blue-900 ring-2 ring-blue-500/20"
                  : "bg-white border-slate-200 text-slate-700"
              }`}
            >
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">
                Etapa 1
              </div>
              <div className="flex items-center justify-center gap-1.5 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Criar Processo (Triagem)</span>
              </div>
            </div>

            {/* 2. Aguardando Parecer */}
            <div
              className={`p-2.5 rounded-lg border font-medium ${
                currentStage === "aguardando_parecer"
                  ? "bg-blue-50 border-blue-400 text-blue-900 ring-2 ring-blue-500/20 shadow-sm"
                  : currentStage === "em_analise" || currentStage === "concluido"
                  ? "bg-white border-slate-200 text-slate-700"
                  : "bg-slate-100 border-slate-200 text-slate-400"
              }`}
            >
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">
                Etapa 2
              </div>
              <div className="flex items-center justify-center gap-1.5 font-semibold">
                {currentStage === "em_analise" || currentStage === "concluido" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Clock className="h-3.5 w-3.5 text-blue-600" />
                )}
                <span>Aguardando Parecer</span>
              </div>
            </div>

            {/* 3. Em Análise */}
            <div
              className={`p-2.5 rounded-lg border font-medium ${
                currentStage === "em_analise"
                  ? "bg-amber-50 border-amber-400 text-amber-900 ring-2 ring-amber-500/20 shadow-sm"
                  : currentStage === "concluido"
                  ? "bg-white border-slate-200 text-slate-700"
                  : "bg-slate-100 border-slate-200 text-slate-400"
              }`}
            >
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">
                Etapa 3
              </div>
              <div className="flex items-center justify-center gap-1.5 font-semibold">
                {currentStage === "concluido" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                ) : currentStage === "em_analise" ? (
                  <Clock className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
                ) : (
                  <div className="h-3.5 w-3.5 rounded-full border border-slate-300" />
                )}
                <span>Em Análise</span>
              </div>
            </div>

            {/* 4. Concluído */}
            <div
              className={`p-2.5 rounded-lg border font-medium ${
                currentStage === "concluido"
                  ? "bg-emerald-50 border-emerald-400 text-emerald-900 ring-2 ring-emerald-500/20 shadow-sm"
                  : "bg-slate-100 border-slate-200 text-slate-400"
              }`}
            >
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">
                Etapa 4
              </div>
              <div className="flex items-center justify-center gap-1.5 font-semibold">
                {currentStage === "concluido" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <div className="h-3.5 w-3.5 rounded-full border border-slate-300" />
                )}
                <span>Concluído</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* BANNER PARA TRIAGEM INICIAL (SE TRIAGEM) */}
      {/* ========================================================================= */}
      {currentStage === "triagem" && (
        <div className="p-4 bg-gradient-to-r from-slate-50 to-blue-50/50 border border-slate-300 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-700 text-white rounded-lg">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Processo em Triagem Inicial
              </h3>
              <p className="text-xs text-slate-600">
                Processo autuado no SEI. Conclua a conferência documental para encaminhá-lo à fila dos farmacêuticos pareceristas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={handleConcluirTriagem}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 flex items-center gap-2 shadow"
            >
              <ArrowRight className="h-4 w-4" />
              {isSubmitting ? "Atualizando..." : "Concluir Triagem → Enviar para Parecer"}
            </Button>

            {isFarmaceutico && (
              <Button
                type="button"
                onClick={handleAssumirParecer}
                disabled={isSubmitting}
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-50 text-xs px-3 py-2 flex items-center gap-1.5"
              >
                <UserCheck className="h-4 w-4" />
                Assumir Direto
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BANNER PARA ASSUMIR PARECER (SE AGUARDANDO PARECER) */}
      {/* ========================================================================= */}
      {currentStage === "aguardando_parecer" && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-lg">
              <FileSearch className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-blue-950">
                Processo pronto para avaliação técnica
              </h3>
              <p className="text-xs text-blue-700">
                Assuma este processo para iniciar a análise farmacêutica dos combos Fármaco + CID e emitir o laudo regulatório.
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleAssumirParecer}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 flex items-center gap-2 shadow"
          >
            <UserCheck className="h-4 w-4" />
            {isSubmitting ? "Assumindo..." : "Assumir Parecer Técnico"}
          </Button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DADOS DO PACIENTE & RECURSOS REAPROVEITADOS */}
      {/* ========================================================================= */}
      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Paciente Requerente
            </span>
            <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
              <span>{processo.paciente?.full_name || "Não informado"}</span>
              <Badge variant="outline" className="text-[9px]">
                {processo.paciente?.gender === "M"
                  ? "Masc"
                  : processo.paciente?.gender === "F"
                  ? "Fem"
                  : processo.paciente?.gender === "outro"
                  ? "Outro"
                  : "Sexo N/I"}
              </Badge>
            </div>
            <div className="text-slate-600 font-mono text-[11px]">
              {processo.paciente?.cpf_not_provided
                ? "CPF: Não Informado"
                : `CPF: ${processo.paciente?.cpf || "Não informado"}`}
            </div>
            <div className="text-slate-500 text-[11px]">
              CNS: {processo.paciente?.cns || "Não informado"}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Território & Base Regional
            </span>
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-emerald-600" />
              <span>{processo.municipio?.name || "Município não informado"} - BA</span>
            </div>
            <div className="text-slate-600 text-[11px]">
              Base Regional: {processo.unidade?.name || "Base da Bahia"}
            </div>
            <div className="text-slate-500 text-[11px]">
              Origem: {processo.origem?.name || "Demanda Administrativa"}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Responsável pelo Parecer
            </span>
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-blue-600" />
              <span>
                {processo.assigned_pharmacist?.full_name ||
                  processo.parecer?.active_version?.pharmacist_name ||
                  "Aguardando atribuição"}
              </span>
            </div>
            <div className="text-slate-500 text-[11px]">
              {processo.assigned_pharmacist?.crf
                ? `CRF: ${processo.assigned_pharmacist.crf}`
                : "Registro Farmacêutico CRF-BA"}
            </div>
            <div className="text-slate-500 text-[11px]">
              Assunto: {processo.assunto || "Solicitação de Medicamento"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* SEÇÃO PRINCIPAL: DECISÕES INDIVIDUAIS POR COMBO (FÁRMACO + CID) */}
      {/* ========================================================================= */}
      <Card className="border-slate-300 shadow-sm">
        <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/60 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Pill className="h-4 w-4 text-emerald-600" />
              Decisões Individuais por Combo (Fármaco + CID)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Cada par de substância e diagnóstico possui sua própria conclusão e fundamentação técnica.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            {itemsState.length} combo(s)
          </Badge>
        </CardHeader>
        <CardContent className="p-4 space-y-6">
          {/* Alerta de Feedback quando resposta é reaproveitada */}
          {copiedAlertText && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center justify-between gap-2 shadow-sm animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span className="font-semibold">{copiedAlertText}</span>
              </div>
              <button
                type="button"
                onClick={() => setCopiedAlertText(null)}
                className="text-emerald-700 hover:text-emerald-950 text-xs font-bold px-1.5"
              >
                ✕
              </button>
            </div>
          )}

          {itemsState.map((item, index) => {
            const comboHistoryList = getComboDecisionsHistory(
              item.farmaco_substancia || item.medication_name,
              item.cid_code,
              processo.paciente_id
            );

            return (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-4"
              >
                {/* Header do Item */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                      <h4 className="text-sm font-bold text-slate-900">
                        {item.farmaco_substancia || item.medication_name}
                      </h4>
                      <Badge className="bg-emerald-700 text-white text-[9px]">
                        Fármaco
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">Diagnóstico:</span>
                      {item.cid_nao_informado ? (
                        <Badge variant="outline" className="text-[10px] text-amber-700 bg-amber-50">
                          CID Não Informado / Investigação
                        </Badge>
                      ) : (
                        <span className="font-mono">
                          {item.cid_code} - {item.cid_description}
                        </span>
                      )}
                      {item.posology && (
                        <>
                          <span>•</span>
                          <span>Posologia: {item.posology}</span>
                        </>
                      )}
                      {item.monthly_quantity && (
                        <>
                          <span>•</span>
                          <span>Qtd: {item.monthly_quantity}/mês</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Botão de Histórico de Respostas do Combo */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenComboHistory(item, index)}
                      className="h-8 px-2.5 text-xs font-semibold border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-900 flex items-center gap-1.5 shadow-xs transition-all"
                    >
                      <History className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Histórico de Respostas do Combo</span>
                      {comboHistoryList.length > 0 && (
                        <Badge className="ml-0.5 bg-indigo-600 text-white text-[10px] px-1.5 py-0 h-4 font-mono">
                          {comboHistoryList.length}
                        </Badge>
                      )}
                    </Button>

                    {/* Status atual do item */}
                    <Badge
                      className={`text-xs px-2.5 py-1 ${
                        item.status === "deferido"
                          ? "bg-emerald-600 text-white"
                          : item.status === "indeferido"
                          ? "bg-rose-600 text-white"
                          : item.status === "em_exigencia"
                          ? "bg-amber-600 text-white"
                          : item.status === "deferido_parcial"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-500 text-white"
                      }`}
                    >
                      {item.status === "deferido"
                        ? "Deferido"
                        : item.status === "indeferido"
                        ? "Indeferido"
                        : item.status === "em_exigencia"
                        ? "Em Exigência"
                        : item.status === "deferido_parcial"
                        ? "Deferido Parcial"
                        : "Pendente"}
                    </Badge>
                  </div>
                </div>

                {/* Recurso: Respostas e Decisões Anteriores deste Combo */}
                {comboHistoryList.length > 0 && (
                  <div className="p-3 bg-gradient-to-r from-indigo-50/70 via-blue-50/40 to-indigo-50/70 border border-indigo-200/80 rounded-lg text-xs space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-indigo-950 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                        Respostas e decisões anteriores catalogadas para este combo ({comboHistoryList.length}):
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenComboHistory(item, index)}
                        className="text-[11px] text-indigo-700 hover:text-indigo-950 underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <BookOpen className="h-3 w-3" />
                        Ver Histórico Completo & Pareceres
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {comboHistoryList.slice(0, 2).map((dec: ComboDecisionHistoryItem, dIdx: number) => (
                        <div
                          key={dIdx}
                          className="bg-white p-2.5 rounded-md border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs"
                        >
                          <div className="text-slate-700 text-xs flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              <Badge
                                variant="outline"
                                className={`text-[9px] uppercase font-bold px-1.5 py-0 ${
                                  dec.status === "deferido"
                                    ? "border-emerald-300 text-emerald-800 bg-emerald-50"
                                    : dec.status === "indeferido"
                                    ? "border-rose-300 text-rose-800 bg-rose-50"
                                    : "border-amber-300 text-amber-800 bg-amber-50"
                                }`}
                              >
                                {dec.status.replace("_", " ")}
                              </Badge>
                              {dec.isSamePatient && (
                                <Badge className="bg-purple-100 text-purple-800 text-[9px] px-1 py-0">
                                  Deste Paciente
                                </Badge>
                              )}
                              <span className="text-[11px] text-slate-500 font-medium">
                                {dec.sourceType === "processo_anterior"
                                  ? `Processo SEI ${dec.processoSei} • ${formatDate(dec.data)}`
                                  : `${dec.pcdtReferencia || "Precedente Oficial CimBahia"}`}
                              </span>
                            </div>
                            <p className="line-clamp-2 text-[11px] text-slate-600">
                              {dec.fundamentacao}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleApplyHistoryDecision(index, dec)}
                            className="text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-900 font-semibold flex-shrink-0 h-7 px-2.5 gap-1"
                          >
                            <Check className="h-3 w-3" />
                            Reaproveitar Fundamentação
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Botões de Decisão do Combo */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Conclusão Técnica do Item:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateItemDecision(index, "deferido")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        item.status === "deferido"
                          ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Deferido
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdateItemDecision(index, "indeferido")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        item.status === "indeferido"
                          ? "bg-rose-600 text-white shadow-sm ring-2 ring-rose-600/30"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      <X className="h-3.5 w-3.5" />
                      Indeferido
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdateItemDecision(index, "em_exigencia")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        item.status === "em_exigencia"
                          ? "bg-amber-600 text-white shadow-sm ring-2 ring-amber-600/30"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Em Exigência / Pendência
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdateItemDecision(index, "deferido_parcial")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        item.status === "deferido_parcial"
                          ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Deferido Parcial
                    </button>
                  </div>
                </div>

                {/* Fundamentação Técnica Individual do Item */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">
                      Fundamentação Técnica e Justificativa Clínica do Fármaco:
                    </label>
                    <button
                      type="button"
                      onClick={() => handleOpenComboHistory(item, index)}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <History className="h-3 w-3" />
                      Histórico de respostas passadas deste combo
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={item.justification || ""}
                    onChange={(e) => {
                      const updated = [...itemsState];
                      updated[index] = {
                        ...updated[index],
                        justification: e.target.value,
                      };
                      setItemsState(updated);
                    }}
                    onBlur={() => {
                      updateProcesso(processo.id, { items: itemsState });
                    }}
                    placeholder="Justifique a conclusão técnica do fármaco com base no PCDT, portaria e critérios clínicos..."
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* SEÇÃO: PARECER CONSOLIDADO UNIFICADO */}
      {/* ========================================================================= */}
      <Card className="border-emerald-200 shadow-sm">
        <CardHeader className="p-4 border-b border-emerald-100 bg-emerald-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-emerald-600" />
              Parecer Técnico Consolidado Unificado
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Gere o laudo consolidando automaticamente as respostas individuais de cada fármaco + CID.
            </CardDescription>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={handleGerarParecerConsolidado}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Gerar Parecer Consolidado com Base nas Decisões
          </Button>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tipo de Parecer Regulatório *
              </label>
              <select
                value={selectedTipoParecerId}
                onChange={(e) => setSelectedTipoParecerId(e.target.value)}
                className="w-full text-xs p-2 rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Selecione o tipo de parecer...</option>
                {tiposParecer.map((tp) => (
                  <option key={tp.id} value={tp.id}>
                    {tp.title} ({tp.regulatory_effect.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Recomendações Clínicas / Dispensação
              </label>
              <input
                type="text"
                value={consolidatedRecommendations}
                onChange={(e) => setConsolidatedRecommendations(e.target.value)}
                placeholder="Ex: Reavaliação clínica trimestral com exames laboratoriais..."
                className="w-full text-xs p-2 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Texto Consolidado do Laudo / Fundamentação Regulamentar
            </label>
            <textarea
              rows={8}
              value={consolidatedJustification}
              onChange={(e) => setConsolidatedJustification(e.target.value)}
              placeholder="Clique em 'Gerar Parecer Consolidado' acima ou redija a fundamentação consolidada..."
              className="w-full text-xs p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono leading-relaxed"
            />
          </div>

          {/* Assinatura Digital e Ações de Emissão */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>
                Assinatura Digital:{" "}
                <strong>{currentUser?.full_name || "Farmacêutico Parecerista"}</strong> • CRF:{" "}
                <strong>{currentUser?.crf || "CRF-BA"}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              {processo.parecer?.active_version ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRectifyModalOpen(true)}
                  className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                >
                  Retificar Parecer
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleEmitirParecer}
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-5 flex items-center gap-1.5 shadow"
                >
                  <Send className="h-3.5 w-3.5" />
                  {isSubmitting ? "Emitindo..." : "Emitir e Concluir Parecer"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* HISTÓRICO DE AUDITORIA DO PROCESSO */}
      {/* ========================================================================= */}
      <Card>
        <CardHeader className="p-4 border-b border-slate-100">
          <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <History className="h-4 w-4 text-slate-500" />
            Trilha de Histórico e Auditoria do Processo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3 text-xs">
            {(processo.historico || []).map((h) => (
              <div
                key={h.id}
                className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-b-0 last:pb-0"
              >
                <div className="p-1 bg-slate-100 rounded text-slate-500 mt-0.5">
                  <Clock className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{h.user_name}</span>
                    <span className="text-[11px] text-slate-400">
                      {formatDate(h.timestamp)}
                    </span>
                  </div>
                  <p className="text-slate-600">{h.notes}</p>
                  {h.to_status && (
                    <Badge variant="outline" className="text-[9px] mt-1">
                      Status: {h.to_status}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* MODAL: HISTÓRICO COMPLETO DO PACIENTE */}
      {/* ========================================================================= */}
      {isHistoryModalOpen && processo.paciente && (
        <Dialog
          open={true}
          onOpenChange={() => setIsHistoryModalOpen(false)}
          title={`Histórico de Atendimentos: ${processo.paciente.full_name}`}
          description={`Processos e decisões já tomadas para o paciente (${patientPastProcessos.length} registros).`}
          maxWidth="lg"
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {patientPastProcessos.map((proc) => (
              <div
                key={proc.id}
                className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{proc.numero_sei}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {proc.status}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Entrada: {formatDate(proc.data_abertura)}
                  </span>
                </div>

                <p className="text-slate-700">{proc.assunto}</p>

                <div className="bg-white p-2.5 rounded border border-slate-200 space-y-1.5">
                  <span className="font-semibold text-[11px] text-slate-600 uppercase tracking-wider block">
                    Fármacos Avaliados:
                  </span>
                  {proc.items.map((item, idx) => (
                    <div key={idx} className="flex items-start justify-between border-b border-slate-100 pb-1.5 last:border-b-0 last:pb-0">
                      <div>
                        <span className="font-medium text-slate-900">
                          {item.farmaco_substancia || item.medication_name}
                        </span>
                        <span className="text-slate-500 font-mono ml-1">
                          (CID: {item.cid_code})
                        </span>
                        {item.justification && (
                          <p className="text-[11px] text-slate-600 italic mt-0.5">
                            {item.justification}
                          </p>
                        )}
                      </div>
                      <Badge className="text-[9px]">{item.status || "pendente"}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-xs"
              >
                Fechar
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* ========================================================================= */}
      {/* MODAL: IMPRESSÃO OFICIAL DO PARECER TÉCNICO */}
      {/* ========================================================================= */}
      {isPrintModalOpen && processo.parecer?.active_version && (
        <Dialog
          open={true}
          onOpenChange={() => setIsPrintModalOpen(false)}
          title="Laudo Oficial do Parecer Técnico"
          description="Documento oficial pronto para impressão ou arquivamento no processo SEI."
          maxWidth="lg"
        >
          <div className="space-y-4 max-h-[75vh] overflow-y-auto p-4 bg-white border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-900 font-sans">
            <div className="text-center pb-4 border-b border-slate-300 space-y-1">
              <div className="font-bold text-sm uppercase">Governo do Estado da Bahia</div>
              <div className="font-semibold">Secretaria da Saúde do Estado da Bahia - SESAB</div>
              <div className="text-[11px] text-slate-600">
                CIMBAHIA • Centro de Informações sobre Medicamentos da Bahia
              </div>
              <div className="text-sm font-bold mt-2 uppercase text-emerald-800">
                {processo.parecer.active_version.tipo_parecer_title}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded border border-slate-200 font-mono text-[11px]">
              <div>
                <strong>Processo SEI:</strong> {processo.numero_sei}
              </div>
              <div>
                <strong>Data de Emissão:</strong> {formatDate(processo.parecer.active_version.created_at)}
              </div>
              <div>
                <strong>Requerente:</strong> {processo.paciente?.full_name}
              </div>
              <div>
                <strong>CPF:</strong>{" "}
                {processo.paciente?.cpf_not_provided
                  ? "Não Informado"
                  : processo.paciente?.cpf || "Não informado"}
              </div>
              <div>
                <strong>Município / Base:</strong> {processo.municipio?.name} /{" "}
                {processo.unidade?.name}
              </div>
              <div>
                <strong>Efeito Regulatório:</strong>{" "}
                {processo.parecer.active_version.regulatory_effect.toUpperCase()}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold uppercase text-[11px] text-slate-700">
                Fundamentação e Análise Técnica Consolidada:
              </h4>
              <div className="p-3 bg-slate-50 rounded border border-slate-200 font-mono whitespace-pre-wrap text-[11px]">
                {processo.parecer.active_version.technical_justification}
              </div>
            </div>

            {processo.parecer.active_version.recommendations && (
              <div className="space-y-1">
                <h4 className="font-bold uppercase text-[11px] text-slate-700">
                  Recomendações e Monitoramento:
                </h4>
                <p className="text-slate-800">
                  {processo.parecer.active_version.recommendations}
                </p>
              </div>
            )}

            <div className="pt-6 text-center border-t border-slate-300 space-y-1">
              <div className="font-bold text-slate-900">
                {processo.parecer.active_version.pharmacist_name}
              </div>
              <div className="text-slate-600">
                Farmacêutico(a) Parecerista • CRF: {processo.parecer.active_version.crf}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-1">
                Autenticidade: {processo.parecer.active_version.signature_hash}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPrintModalOpen(false)}
                className="text-xs"
              >
                Fechar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => window.print()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" />
                Imprimir Documento
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RETIFICAR PARECER */}
      {/* ========================================================================= */}
      {isRectifyModalOpen && (
        <Dialog
          open={true}
          onOpenChange={() => setIsRectifyModalOpen(false)}
          title="Retificação de Parecer Técnico"
          description="Informe o motivo da retificação para criar uma nova versão auditada do laudo."
          maxWidth="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Justificativa da Retificação *
              </label>
              <textarea
                rows={3}
                value={rectificationReason}
                onChange={(e) => setRectificationReason(e.target.value)}
                placeholder="Ex: Correção de dosagem após novo laudo complementar anexado ao SEI..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsRectifyModalOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleRetificarParecer}
                disabled={isSubmitting}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
              >
                {isSubmitting ? "Salvando..." : "Confirmar Nova Versão"}
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* ========================================================================= */}
      {/* MODAL: HISTÓRICO DE RESPOSTAS PASSADAS DO COMBO (FÁRMACO + CID) */}
      {/* ========================================================================= */}
      {isComboHistoryModalOpen && selectedComboForHistory && (() => {
        const farmacoName =
          selectedComboForHistory.item.farmaco_substancia ||
          selectedComboForHistory.item.medication_name;
        const cidCode = selectedComboForHistory.item.cid_code;
        const cidDesc = selectedComboForHistory.item.cid_description;

        const allHistory = getComboDecisionsHistory(
          farmacoName,
          cidCode,
          processo.paciente_id
        );

        const samePatientCount = allHistory.filter((h: ComboDecisionHistoryItem) => h.isSamePatient).length;
        const deferidosCount = allHistory.filter((h: ComboDecisionHistoryItem) => h.status === "deferido").length;
        const indeferidosCount = allHistory.filter((h: ComboDecisionHistoryItem) => h.status === "indeferido").length;
        const exigenciasCount = allHistory.filter((h: ComboDecisionHistoryItem) => h.status === "em_exigencia").length;

        const visibleItems = allHistory.filter((h: ComboDecisionHistoryItem) => {
          if (comboHistoryFilter === "todos") return true;
          if (comboHistoryFilter === "paciente") return h.isSamePatient;
          return h.status === comboHistoryFilter;
        });

        return (
          <Dialog
            open={true}
            onOpenChange={() => setIsComboHistoryModalOpen(false)}
            title="Histórico de Respostas e Decisões Anteriores do Combo"
            description="Consulte decisões passadas, fundamentações técnicas de outros processos e jurisprudência padronizada do CimBahia/PCDT para este fármaco e diagnóstico."
            maxWidth="2xl"
          >
            <div className="space-y-4 max-h-[80vh] flex flex-col">
              {/* Header com os dados do Combo Atual */}
              <div className="p-3.5 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-700 text-white text-[10px]">
                      Item #{selectedComboForHistory.index + 1}
                    </Badge>
                    <h3 className="text-sm font-bold text-slate-900">
                      {farmacoName}
                    </h3>
                  </div>
                  <div className="text-xs text-slate-600 flex items-center gap-1.5">
                    <span className="font-semibold text-slate-700">CID:</span>
                    <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {cidCode}
                    </span>
                    <span>-</span>
                    <span>{cidDesc || "Diagnóstico informado"}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <Badge variant="outline" className="bg-white border-slate-300 font-mono">
                    {allHistory.length} precedente(s)
                  </Badge>
                  {deferidosCount > 0 && (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-mono">
                      {deferidosCount} Deferido(s)
                    </Badge>
                  )}
                  {indeferidosCount > 0 && (
                    <Badge variant="outline" className="bg-rose-50 text-rose-800 border-rose-300 font-mono">
                      {indeferidosCount} Indeferido(s)
                    </Badge>
                  )}
                  {exigenciasCount > 0 && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 font-mono">
                      {exigenciasCount} Exigência(s)
                    </Badge>
                  )}
                </div>
              </div>

              {/* Alerta de Feedback quando resposta é reaproveitada no modal */}
              {copiedAlertText && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs flex items-center justify-between gap-2 shadow-xs animate-in fade-in flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span className="font-semibold">{copiedAlertText}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCopiedAlertText(null)}
                    className="text-emerald-700 hover:text-emerald-950 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Filtros de Histórico */}
              <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-200 flex-shrink-0">
                <span className="text-xs font-semibold text-slate-600 mr-1 flex items-center gap-1">
                  Filtrar por:
                </span>
                <button
                  type="button"
                  onClick={() => setComboHistoryFilter("todos")}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    comboHistoryFilter === "todos"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Todos ({allHistory.length})
                </button>
                {samePatientCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setComboHistoryFilter("paciente")}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      comboHistoryFilter === "paciente"
                        ? "bg-purple-700 text-white shadow-xs"
                        : "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
                    }`}
                  >
                    Deste Paciente ({samePatientCount})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setComboHistoryFilter("deferido")}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    comboHistoryFilter === "deferido"
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                  }`}
                >
                  Deferidos ({deferidosCount})
                </button>
                <button
                  type="button"
                  onClick={() => setComboHistoryFilter("indeferido")}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    comboHistoryFilter === "indeferido"
                      ? "bg-rose-700 text-white shadow-xs"
                      : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                  }`}
                >
                  Indeferidos ({indeferidosCount})
                </button>
                <button
                  type="button"
                  onClick={() => setComboHistoryFilter("em_exigencia")}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    comboHistoryFilter === "em_exigencia"
                      ? "bg-amber-700 text-white shadow-xs"
                      : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                  }`}
                >
                  Em Exigência ({exigenciasCount})
                </button>
              </div>

              {/* Lista de Registros do Histórico */}
              <div className="overflow-y-auto space-y-3.5 pr-1 max-h-[50vh]">
                {visibleItems.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 space-y-2 border border-dashed border-slate-200 rounded-lg">
                    <AlertCircle className="h-7 w-7 text-slate-400 mx-auto" />
                    <p className="text-xs font-medium">
                      Nenhuma resposta encontrada para o filtro selecionado.
                    </p>
                    <button
                      type="button"
                      onClick={() => setComboHistoryFilter("todos")}
                      className="text-xs text-indigo-600 underline font-semibold"
                    >
                      Ver todas as respostas ({allHistory.length})
                    </button>
                  </div>
                ) : (
                  visibleItems.map((hist: ComboDecisionHistoryItem) => (
                    <div
                      key={hist.id}
                      className={`p-3.5 rounded-lg border transition-all ${
                        hist.isSamePatient
                          ? "bg-purple-50/30 border-purple-200 shadow-xs"
                          : "bg-white border-slate-200 shadow-xs hover:border-slate-300"
                      }`}
                    >
                      {/* Topo do Card de Histórico */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge
                            className={`text-xs px-2.5 py-0.5 font-bold uppercase ${
                              hist.status === "deferido"
                                ? "bg-emerald-600 text-white"
                                : hist.status === "indeferido"
                                ? "bg-rose-600 text-white"
                                : hist.status === "em_exigencia"
                                ? "bg-amber-600 text-white"
                                : "bg-blue-600 text-white"
                            }`}
                          >
                            {hist.status === "deferido"
                              ? "Deferido"
                              : hist.status === "indeferido"
                              ? "Indeferido"
                              : hist.status === "em_exigencia"
                              ? "Em Exigência"
                              : "Deferido Parcial"}
                          </Badge>

                          {hist.isSamePatient && (
                            <Badge className="bg-purple-700 text-white text-[10px] px-2 py-0.5">
                              Histórico Deste Paciente
                            </Badge>
                          )}

                          {hist.sourceType === "processo_anterior" ? (
                            <Badge variant="outline" className="font-mono text-[10px] text-slate-700 bg-slate-50 border-slate-300">
                              SEI: {hist.processoSei}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-indigo-700 bg-indigo-50 border-indigo-200">
                              Precedente Padronizado CimBahia
                            </Badge>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>Data: {formatDate(hist.data)}</span>
                          <span>•</span>
                          <span className="font-medium text-slate-700">{hist.farmaceutico}</span>
                        </div>
                      </div>

                      {/* Informações de Origem e PCDT */}
                      <div className="mt-2 text-[11px] text-slate-600 flex flex-wrap items-center gap-3">
                        {hist.sourceType === "processo_anterior" && (
                          <div>
                            <span className="font-semibold text-slate-700">Requerente:</span> {hist.pacienteNome}
                          </div>
                        )}
                        {hist.pcdtReferencia && (
                          <div>
                            <span className="font-semibold text-indigo-900">Referência Protocolar:</span>{" "}
                            <span className="text-indigo-800">{hist.pcdtReferencia}</span>
                          </div>
                        )}
                      </div>

                      {/* Texto da Fundamentação Técnica */}
                      <div className="mt-2.5 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          Fundamentação Técnica e Justificativa Clínica Aplicada:
                        </span>
                        <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap select-all">
                          {hist.fundamentacao}
                        </div>
                      </div>

                      {/* Recomendações (se houver) */}
                      {hist.recomendacoes && (
                        <div className="mt-2 text-xs text-slate-700 bg-indigo-50/50 p-2 rounded border border-indigo-100">
                          <strong className="text-indigo-950 font-semibold">Recomendações e Monitoramento: </strong>
                          {hist.recomendacoes}
                        </div>
                      )}

                      {/* Botões de Ação do Card */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                        <div className="text-[11px] text-slate-400">
                          {hist.sourceType === "processo_anterior"
                            ? "Decisão homologada em processo prévio"
                            : "Súmula técnica aprovada pela equipe clínica"}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyJustificationText(hist.fundamentacao)}
                            className="text-xs h-7 px-2.5 gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-100"
                          >
                            <Copy className="h-3 w-3 text-slate-500" />
                            Copiar Texto
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleApplyHistoryDecision(selectedComboForHistory.index, hist)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-3 gap-1.5 font-semibold shadow-xs"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Reaproveitar Esta Resposta na Decisão Atual
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Rodapé do Modal */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-3 border-t border-slate-200 flex-shrink-0">
                <span className="text-[11px] text-slate-500">
                  Mostrando {visibleItems.length} de {allHistory.length} respostas registradas para este combo
                </span>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/pareceres?substancia=${encodeURIComponent(farmacoName)}&cid=${encodeURIComponent(cidCode)}`}
                    target="_blank"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs text-indigo-700 border-indigo-300 hover:bg-indigo-50 gap-1.5"
                    >
                      <Scale className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Abrir Banco Completo de Pareceres</span>
                      <ExternalLink className="h-3 w-3 text-indigo-400" />
                    </Button>
                  </Link>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsComboHistoryModalOpen(false)}
                    className="text-xs px-4"
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </div>
          </Dialog>
        );
      })()}

      {/* Modal de Confirmação de Exclusão de Processo SEI */}
      <Dialog
        open={isDeleteModalOpen}
        onOpenChange={(open) => {
          setIsDeleteModalOpen(open);
          if (!open) setDeleteError(null);
        }}
        title="Excluir Processo SEI"
        description="Esta ação removerá o processo definitivamente do sistema."
        maxWidth="sm"
      >
        <div className="space-y-4 pt-1">
          {deleteError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{deleteError}</span>
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
            <div>
              <span className="text-slate-500">Nº do Processo SEI:</span>{" "}
              <strong className="font-mono text-slate-900">{processo.numero_sei}</strong>
            </div>
            <div>
              <span className="text-slate-500">Paciente:</span>{" "}
              <strong className="text-slate-900">{processo.paciente?.full_name || "Não informado"}</strong>
            </div>
            <div>
              <span className="text-slate-500">Status Atual:</span>{" "}
              <span className="font-semibold text-slate-700 capitalize">{processo.status.replace("_", " ")}</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Tem certeza de que deseja apagar este processo SEI? Como ele ainda está no primeiro status e não possui análise técnica concluída, a exclusão é permitida.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeleteError(null);
              }}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isDeleting}
              onClick={handleConfirmDeleteProcesso}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs flex items-center gap-1.5 shadow"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {isDeleting ? "Excluindo..." : "Sim, Excluir Processo"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
