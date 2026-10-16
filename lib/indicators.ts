import { Consultation, MonthlyComplementaryData, Patient, IndicatorRow } from "./types";

export interface IndicatorFilter {
  unitId?: string;
  macroregion?: string;
  year: number;
  month?: number; // 1-12 or undefined (all months)
}

export function calculateIndicators(
  consultations: Consultation[],
  monthlyData: MonthlyComplementaryData[],
  patients: Patient[],
  filter: IndicatorFilter
): IndicatorRow[] {
  // Filtrar consultas pelo período e unidade
  const filteredConsultations = consultations.filter((c) => {
    if (filter.unitId && c.unit_id !== filter.unitId) return false;
    const cDate = new Date(c.consultation_date);
    const cYear = cDate.getUTCFullYear();
    const cMonth = cDate.getUTCMonth() + 1;
    if (cYear !== filter.year) return false;
    if (filter.month && cMonth !== filter.month) return false;
    return true;
  });

  // Filtrar dados mensais complementares
  const filteredMonthly = monthlyData.filter((m) => {
    if (filter.unitId && m.unit_id !== filter.unitId) return false;
    if (m.year !== filter.year) return false;
    if (filter.month && m.month !== filter.month) return false;
    return true;
  });

  // Filtrar pacientes
  const filteredPatients = patients.filter((p) => {
    if (filter.unitId && p.unit_id !== filter.unitId) return false;
    return true;
  });

  // 1. Indicador 1: Número de pacientes em Acompanhamento Farmacoterapêutico
  const monthlyTotalFollowup = filteredMonthly.reduce(
    (acc, m) => acc + (m.total_patients_in_followup || 0),
    0
  );
  const activePatientsCount = filteredPatients.filter(
    (p) => p.status === "em_acompanhamento"
  ).length;
  const ind1Result = monthlyTotalFollowup > 0 ? monthlyTotalFollowup : activePatientsCount;

  // 2. Indicador 2: Pacientes atendidos no Acompanhamento Farmacoterapêutico no mês
  // COUNT(DISTINCT patient_id) onde is_pharmaceutical_guidance_only = false
  const followUpConsultations = filteredConsultations.filter(
    (c) => !c.is_pharmaceutical_guidance_only
  );
  const distinctFollowUpPatients = new Set(
    followUpConsultations.map((c) => c.patient_id)
  );
  const ind2Result = distinctFollowUpPatients.size;

  // 3. Indicador 3: Primeiras Consultas Farmacêuticas do Acompanhamento realizadas no mês
  // COUNT(DISTINCT patient_id) onde is_new_patient = true
  const firstConsultations = filteredConsultations.filter((c) => c.is_new_patient);
  const distinctFirstPatients = new Set(firstConsultations.map((c) => c.patient_id));
  const ind3Result = distinctFirstPatients.size;

  // 4. Indicador 4: Consultas Farmacêuticas de retorno do Acompanhamento realizadas no mês
  // COUNT(DISTINCT patient_id) onde is_new_patient = false
  const returnConsultations = filteredConsultations.filter((c) => !c.is_new_patient);
  const distinctReturnPatients = new Set(returnConsultations.map((c) => c.patient_id));
  const ind4Result = distinctReturnPatients.size;

  // 5. Indicador 5: Número de PRFs identificados no mês
  // COUNT(*) de consultation_prfs vinculados às consultas do mês
  const allPrfs = filteredConsultations.flatMap((c) => c.prfs || []);
  const ind5Result = allPrfs.length;

  // 6. Indicador 6: Porcentagem de PRFs resolvidos
  // Numerador: PRFs com status = 'Resolvido'
  // Denominador: Total de PRFs identificados
  const resolvedPrfsCount = allPrfs.filter((p) => p.status === "Resolvido").length;
  const ind6Denominator = ind5Result;
  const ind6Result =
    ind6Denominator > 0 ? Number(((resolvedPrfsCount / ind6Denominator) * 100).toFixed(1)) : 0;

  // 7. Indicador 7: Número médio de intervenções farmacêuticas por paciente atendido
  // Numerador: SUM(interventions_count) onde guidance = false
  // Denominador: COUNT(DISTINCT patient_id) atendidos
  const totalInterventions = followUpConsultations.reduce(
    (acc, c) => acc + (c.interventions_count || 0),
    0
  );
  const ind7Denominator = ind2Result;
  const ind7Result =
    ind7Denominator > 0 ? Number((totalInterventions / ind7Denominator).toFixed(2)) : 0;

  // 8. Indicador 8: Pacientes com Alta do Acompanhamento Farmacoterapêutico no mês
  // COUNT(DISTINCT patient_id) onde pharmaceutical_discharge = true
  const dischargeConsultations = filteredConsultations.filter(
    (c) => c.pharmaceutical_discharge
  );
  const distinctDischarged = new Set(dischargeConsultations.map((c) => c.patient_id));
  const ind8Result = distinctDischarged.size;

  // 9. Indicador 9: Atividades coletivas/grupos educativos realizados no mês
  const ind9Result = filteredMonthly.reduce(
    (acc, m) => acc + (m.collective_health_activities || 0),
    0
  );

  // 10. Indicador 10: Pacientes atendidos administrativamente na dispensação (Fonte AFSESAB)
  const ind10Result = filteredMonthly.reduce(
    (acc, m) => acc + (m.dispensing_administrative_patients || 0),
    0
  );

  // 11. Indicador 11: Cobertura de primeira dispensação realizada pelo farmacêutico no mês
  // Numerador: first_dispensing_by_pharmacist
  // Denominador: total_new_patients_month
  const firstDispensingTotal = filteredMonthly.reduce(
    (acc, m) => acc + (m.first_dispensing_by_pharmacist || 0),
    0
  );
  const totalNewPatients = filteredMonthly.reduce(
    (acc, m) => acc + (m.total_new_patients_month || 0),
    0
  );
  const ind11Result =
    totalNewPatients > 0
      ? Number(((firstDispensingTotal / totalNewPatients) * 100).toFixed(1))
      : 0;

  return [
    {
      number: 1,
      code: "IND-01",
      title: "Pacientes em Acompanhamento Farmacoterapêutico",
      description: "Número total de pacientes com plano de cuidado ativo na unidade.",
      method: "Contagem de pacientes ativos em acompanhamento",
      numerator: null,
      denominator: null,
      result: ind1Result,
      unit: "Pacientes",
      periodicity: "Mensal",
      interpretation: "Capacidade instalada e adesão ao serviço clínico.",
      meta: "Meta regional: ≥ 50",
    },
    {
      number: 2,
      code: "IND-02",
      title: "Pacientes Atendidos no Acompanhamento no Mês",
      description: "Pacientes únicos que passaram por consulta farmacêutica clínica no período.",
      method: "COUNT(DISTINCT patient_id) com orientação = Não",
      numerator: null,
      denominator: null,
      result: ind2Result,
      unit: "Pacientes",
      periodicity: "Mensal",
      interpretation: "Volume de produção clínica mensal efetiva.",
      meta: "Meta regional: ≥ 30",
    },
    {
      number: 3,
      code: "IND-03",
      title: "Primeiras Consultas Farmacêuticas no Mês",
      description: "Novos ingressos de pacientes no serviço de acompanhamento clínico.",
      method: "COUNT(DISTINCT patient_id) onde Paciente Novo = Sim",
      numerator: null,
      denominator: null,
      result: ind3Result,
      unit: "Consultas",
      periodicity: "Mensal",
      interpretation: "Taxa de captação de novos casos para o cuidado farmacêutico.",
      meta: "Meta regional: ≥ 8",
    },
    {
      number: 4,
      code: "IND-04",
      title: "Consultas de Retorno Realizadas no Mês",
      description: "Atendimentos subsequentes de acompanhamento e monitorização contínua.",
      method: "COUNT(DISTINCT patient_id) onde Paciente Novo = Não",
      numerator: null,
      denominator: null,
      result: ind4Result,
      unit: "Consultas",
      periodicity: "Mensal",
      interpretation: "Continuidade e longitudinalidade do cuidado.",
      meta: "Meta regional: ≥ 20",
    },
    {
      number: 5,
      code: "IND-05",
      title: "Problemas Relacionados à Farmacoterapia (PRF) Identificados",
      description: "Total de desvios, reações adversas, interações ou barreiras de adesão detectados.",
      method: "COUNT(*) de PRFs registrados nas consultas",
      numerator: null,
      denominator: null,
      result: ind5Result,
      unit: "PRFs",
      periodicity: "Mensal",
      interpretation: "Sensibilidade diagnóstica do farmacêutico na revisão da terapia.",
      meta: "Foco: Segurança e Efetividade",
    },
    {
      number: 6,
      code: "IND-06",
      title: "Taxa de Resolução de PRFs",
      description: "Proporção de problemas identificados que foram solucionados com intervenção.",
      method: "(PRFs 'Resolvidos' / Total de PRFs) × 100",
      numerator: resolvedPrfsCount,
      denominator: ind6Denominator,
      result: ind6Result,
      unit: "%",
      periodicity: "Mensal",
      interpretation: "Eficácia e resolutividade das condutas clínicas adotadas.",
      meta: "Meta de Qualidade: ≥ 70%",
    },
    {
      number: 7,
      code: "IND-07",
      title: "Média de Intervenções por Paciente Atendido",
      description: "Intensidade das ações farmacêuticas executadas para cada usuário avaliado.",
      method: "Total de intervenções / Pacientes atendidos",
      numerator: totalInterventions,
      denominator: ind7Denominator,
      result: ind7Result,
      unit: "Intervenções/paciente",
      periodicity: "Mensal",
      interpretation: "Complexidade farmacoterapêutica da população atendida.",
      meta: "Padrão esperado: 1,5 a 3,0",
    },
    {
      number: 8,
      code: "IND-08",
      title: "Pacientes com Alta Farmacêutica no Mês",
      description: "Pacientes que alcançaram estabilidade clínica, metas terapêuticas e autocuidado.",
      method: "COUNT(DISTINCT patient_id) onde Alta = Sim",
      numerator: null,
      denominator: null,
      result: ind8Result,
      unit: "Pacientes",
      periodicity: "Mensal",
      interpretation: "Rotatividade e sucesso do ciclo terapêutico do cuidado.",
      meta: "Alinhado com estabilidade",
    },
    {
      number: 9,
      code: "IND-09",
      title: "Atividades Coletivas e Grupos Educativos",
      description: "Ações de promoção da saúde e educação em grupo na macrorregião.",
      method: "Soma das atividades coletivas na competência",
      numerator: null,
      denominator: null,
      result: ind9Result,
      unit: "Atividades",
      periodicity: "Mensal",
      interpretation: "Impacto populacional e alcance comunitário.",
      meta: "Meta: ≥ 2/mês",
    },
    {
      number: 10,
      code: "IND-10",
      title: "Dispensação Administrativa no Mês (AFSESAB)",
      description: "Volume de usuários que retiraram medicamentos no balcão sem consulta clínica.",
      method: "Total de usuários com dispensação administrativa",
      numerator: null,
      denominator: null,
      result: ind10Result,
      unit: "Usuários",
      periodicity: "Mensal",
      interpretation: "Demanda total de distribuição logística de medicamentos CEAF.",
      meta: "Fonte Oficial AFSESAB",
    },
    {
      number: 11,
      code: "IND-11",
      title: "Cobertura de 1ª Dispensação por Farmacêutico",
      description: "Proporção de novos pacientes que receberam acolhimento farmacêutico na 1ª entrega.",
      method: "(1ªs dispensações pelo farmacêutico / Novos processos) × 100",
      numerator: firstDispensingTotal,
      denominator: totalNewPatients,
      result: ind11Result,
      unit: "%",
      periodicity: "Mensal",
      interpretation: "Acesso precoce à orientação farmacêutica qualificada na adesão inicial.",
      meta: "Meta SUS: ≥ 80%",
    },
  ];
}
