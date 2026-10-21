import { NextResponse } from "next/server";
import { INITIAL_BAHIA_MUNICIPIOS } from "@/lib/territory-data";
import { CpfLookupResult } from "@/lib/types";
import {
  getSesabAuthHeaders,
  buildBuscarPacienteUrl,
  invalidateTokens,
  getAuthDiagnostics,
  getSesabCredentials,
} from "@/lib/server/token-service";

export const maxDuration = 30;

// Função utilitária para limpar CPF/CNS/IBGE/CEP (somente dígitos)
function cleanDigits(value: any): string {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\D/g, "");
}

// Formata CPF para o padrão 000.000.000-00
function formatCPF(cpf: any): string {
  const digits = cleanDigits(cpf);
  if (digits.length !== 11) return String(cpf || "");
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

// Normaliza data de nascimento para YYYY-MM-DD (compatível com input type="date")
function normalizeDate(rawDate: string | null | undefined): string | null {
  if (!rawDate) return null;
  const str = String(rawDate).trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // DD/MM/YYYY ou DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    const day = d.padStart(2, "0");
    const month = m.padStart(2, "0");
    return `${y}-${month}-${day}`;
  }

  // Tenta Date parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  return str;
}

// Normaliza código de sexo da API para o padrão ('M' | 'F' | 'nao_informado')
function normalizeGender(rawSexo: any): "M" | "F" | "nao_informado" {
  if (rawSexo === null || rawSexo === undefined) return "nao_informado";
  const str = String(rawSexo).trim().toUpperCase();

  if (str === "F" || str === "2" || str === "FEMININO" || str === "MULHER") {
    return "F";
  }
  if (str === "M" || str === "1" || str === "MASCULINO" || str === "HOMEM") {
    return "M";
  }

  return "nao_informado";
}

// Resolve o município da Bahia a partir de múltiplos sinais da SESAB (IBGE, ID, Nome, CEP, UF)
function resolveBahiaMunicipio(
  rawMunId: any,
  rawIbge?: any,
  rawName?: any,
  rawCep?: any,
  rawUf?: any
) {
  // 1. Busca prioritária por código IBGE (6 dígitos como 292740 ou 7 dígitos como 2927408)
  const targetIbge = cleanDigits(rawIbge || "");
  if (targetIbge.length >= 6) {
    const foundByIbge = INITIAL_BAHIA_MUNICIPIOS.find(
      (m) =>
        m.ibge_code === targetIbge ||
        m.ibge_code.startsWith(targetIbge) ||
        targetIbge.startsWith(m.ibge_code)
    );
    if (foundByIbge) return foundByIbge;
  }

  // 2. Se o rawMunId for numérico com 6 ou 7 dígitos (ex: código IBGE no campo municipio_id)
  const munIdDigits = cleanDigits(rawMunId || "");
  if (munIdDigits.length >= 6) {
    const foundByMunDigits = INITIAL_BAHIA_MUNICIPIOS.find(
      (m) =>
        m.ibge_code === munIdDigits ||
        m.ibge_code.startsWith(munIdDigits) ||
        munIdDigits.startsWith(m.ibge_code)
    );
    if (foundByMunDigits) return foundByMunDigits;
  }

  // 3. Busca por ID direto do sistema (ex: mun-2927408) ou IDs corporativos conhecidos da SESAB
  if (rawMunId) {
    const targetStr = String(rawMunId).trim();
    const foundById = INITIAL_BAHIA_MUNICIPIOS.find(
      (m) => m.id.toLowerCase() === targetStr.toLowerCase()
    );
    if (foundById) return foundById;

    // ID 7733 é o código de município da capital Salvador na base corporativa SESAB / AFSESAB
    if (targetStr === "7733") {
      const sal = INITIAL_BAHIA_MUNICIPIOS.find((m) => m.ibge_code === "2927408");
      if (sal) return sal;
    }
  }

  // 4. Busca por Nome do município (removendo acentos, case e sufixo " - BA")
  const targetName = rawName || (typeof rawMunId === "string" && isNaN(Number(rawMunId)) ? rawMunId : null);
  if (targetName) {
    const normalizeStr = (s: string) =>
      s
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s*-\s*ba$/i, "")
        .trim()
        .toLowerCase();

    const targetNorm = normalizeStr(String(targetName));
    const foundByName = INITIAL_BAHIA_MUNICIPIOS.find(
      (m) => normalizeStr(m.name) === targetNorm
    );
    if (foundByName) return foundByName;
  }

  // 5. Fallback por faixa de CEP da capital / RMS (40000-000 a 41999-999 pertencem a Salvador)
  const cepDigits = cleanDigits(rawCep || "");
  if (cepDigits.length >= 2) {
    if (cepDigits.startsWith("40") || cepDigits.startsWith("41")) {
      const sal = INITIAL_BAHIA_MUNICIPIOS.find((m) => m.ibge_code === "2927408");
      if (sal) return sal;
    }
  }

  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Diagnóstico rápido de conexão e tokens
  if (searchParams.get("diagnostics") === "true") {
    return NextResponse.json({
      status: "ok",
      diagnostics: getAuthDiagnostics(),
    });
  }

  const cpfParam = searchParams.get("cpf");
  const cnsParam = searchParams.get("cns") || "";
  const unidadeParam = searchParams.get("unidade_selecionada_id") || "9";
  const simulateParam = searchParams.get("simulate") === "true";

  return handleCpfLookup(cpfParam, cnsParam, unidadeParam, simulateParam);
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const cpfParam = body.cpf || body.CPF;
    const cnsParam = body.cns || body.CNS || "";
    const unidadeParam = body.unidade_selecionada_id || body.unidadeId || "9";
    const simulateParam = Boolean(body.simulate);

    return handleCpfLookup(cpfParam, cnsParam, unidadeParam, simulateParam);
  } catch (error) {
    return NextResponse.json(
      { found: false, message: "Erro ao processar corpo da requisição." },
      { status: 400 }
    );
  }
}

async function handleCpfLookup(
  cpfParam: string | null,
  cnsParam: string | null = "",
  unidadeParam: string | null = "9",
  simulate: boolean = false
) {
  const cleanCpf = cleanDigits(cpfParam);

  if (!cleanCpf || cleanCpf.length !== 11) {
    return NextResponse.json(
      {
        found: false,
        message: "CPF inválido. Forneça um CPF com 11 dígitos numéricos.",
      },
      { status: 400 }
    );
  }

  const { email, password } = getSesabCredentials();
  const hasCredentials = Boolean(email && password);

  // 1. Se as credenciais estiverem configuradas, faz a chamada real via SESAB / AFSESAB
  if (hasCredentials) {
    try {
      // Obtém o par de tokens (Token 1 do /api/v1/login e Token 2 XSRF do /logistica/login) com cache em memória
      let authInfo;
      try {
        authInfo = await getSesabAuthHeaders(false);
      } catch (authErr: any) {
        console.error("Erro na autenticação SESAB (Token 1 ou Token 2):", authErr);
        const isTimeout =
          authErr?.name === "AbortError" ||
          String(authErr?.message || "").toLowerCase().includes("aborted") ||
          String(authErr?.message || "").toLowerCase().includes("tempo limite");

        return NextResponse.json(
          {
            found: false,
            cpf: cleanCpf,
            cpf_formatted: formatCPF(cleanCpf),
            message: isTimeout
              ? "O servidor da SESAB (afsesab.sesab.ba.gov.br) não respondeu no tempo hábil. Você pode preencher os dados do paciente manualmente."
              : `Falha na conexão com a SESAB: ${authErr.message}. Preencha os campos manualmente.`,
            auth_error: true,
            timeout: isTimeout,
          },
          { status: 200 }
        );
      }

      // Constrói a URL exata da SESAB:
      // http://afsesab.sesab.ba.gov.br/api/v1/pacientes/buscar-paciente?cns=&cpf=...&unidade_selecionada_id=9
      let fetchUrl = buildBuscarPacienteUrl(cleanCpf, cnsParam, unidadeParam);
      let headers: Record<string, string> = { ...authInfo.headers };

      const doFetch = async () => {
        const controller = new AbortController();
        const timeoutMs = Number(process.env.SESAB_TIMEOUT_MS) || 15000;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs); // 15s timeout
        return fetch(fetchUrl, {
          method: "GET",
          headers,
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));
      };

      let response = await doFetch();

      // Se retornar 401 ou 403, invalida o cache de ambos os tokens, renova e tenta mais uma vez
      if (response.status === 401 || response.status === 403) {
        console.warn("Token expirado na API de Paciente. Renovando Token 1 e Token 2 automaticamente...");
        invalidateTokens();
        try {
          const freshAuth = await getSesabAuthHeaders(true);
          headers = { ...freshAuth.headers };
          response = await doFetch();
        } catch (retryErr) {
          console.error("Falha ao renovar tokens SESAB após status 401:", retryErr);
        }
      }

      if (response.status === 404) {
        return NextResponse.json({
          found: false,
          cpf: cleanCpf,
          cpf_formatted: formatCPF(cleanCpf),
          message: "Paciente não localizado na base de dados da SESAB.",
        });
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        console.error("Erro na API da SESAB buscar-paciente:", response.status, errorText);
        return NextResponse.json(
          {
            found: false,
            cpf: cleanCpf,
            cpf_formatted: formatCPF(cleanCpf),
            message: `A API da SESAB retornou status ${response.status}. Verifique permissões da unidade ou credenciais.`,
          },
          { status: response.status }
        );
      }

      const data = await response.json();

      // Normaliza objeto (se vier em array ou subobjeto 'data' / 'paciente')
      const patientObj = Array.isArray(data)
        ? data[0] || {}
        : data.data || data.paciente || data.result || data;

      // Mapeia os dados do contrato da API da SESAB:
      // Status na raiz: "novo_paciente" (sem cadastro prévio no AFSESAB) ou "paciente_existe" (já cadastrado no AFSESAB)
      const rawStatus =
        data.status ??
        data.Status ??
        patientObj.status ??
        patientObj.Status ??
        "novo_paciente";

      const afsesabStatus = String(rawStatus).trim();
      const afsesabCadastrado = afsesabStatus === "paciente_existe";
      const afsesabLabel =
        afsesabStatus === "paciente_existe"
          ? "Cadastrado no AFSESAB"
          : afsesabStatus === "novo_paciente"
          ? "Novo Paciente (Sem cadastro no AFSESAB)"
          : afsesabStatus;
      const rawCns = patientObj.cns ?? patientObj.CNS ?? cnsParam ?? null;
      const rawNome = patientObj.nome ?? patientObj.Nome ?? patientObj.NOME ?? patientObj.full_name ?? null;
      const rawNasc = patientObj.nascimento ?? patientObj.Nascimento ?? patientObj.NASCIMENTO ?? patientObj.data_nascimento ?? null;
      const rawCpf = patientObj.cpf ?? patientObj.CPF ?? cleanCpf;
      const rawSexo =
        patientObj["cod-sexo"] ??
        patientObj.cod_sexo ??
        patientObj["cod_sexo"] ??
        patientObj.sexo ??
        patientObj.gender ??
        null;
      const rawBairro =
        patientObj.end_descricao_barrio ??
        patientObj.end_descricao_bairro ??
        patientObj.bairro ??
        patientObj.end_bairro ??
        null;
      const rawCep = patientObj.end_numero_cep ?? patientObj.cep ?? patientObj.CEP ?? null;

      // Extração robusta do município e UF da base da SESAB
      const rawIbge =
        patientObj.cod_municipio_ibge ??
        patientObj.codigo_municipio_ibge ??
        patientObj.ibge_municipio ??
        patientObj.municipio_ibge ??
        patientObj.cod_ibge ??
        patientObj.ibge ??
        null;
      const rawMunId =
        patientObj.municipio_id ??
        patientObj.cod_municipio ??
        patientObj.municipio ??
        null;
      const rawName =
        patientObj.nome_municipio ??
        patientObj.municipio_nome ??
        patientObj.cidade ??
        patientObj.end_municipio ??
        null;
      const rawUf =
        patientObj.end_sigla_uf ??
        patientObj.sigla_uf ??
        patientObj.uf ??
        "BA";

      const isOutsideBahia = Boolean(rawUf && String(rawUf).trim().toUpperCase() !== "BA");

      // Resolução inteligente para os 417 municípios da Bahia e dedução de BRS
      let resolvedMun = !isOutsideBahia
        ? resolveBahiaMunicipio(rawMunId, rawIbge, rawName, rawCep, rawUf)
        : null;

      // Fallback inteligente por CEP via ViaCEP caso os campos diretos da SESAB não tragam o código IBGE
      if (!resolvedMun && !isOutsideBahia && rawCep) {
        const cepClean = cleanDigits(rawCep);
        if (cepClean.length === 8 && cepClean.startsWith("4")) {
          try {
            const viaCepRes = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`, {
              signal: AbortSignal.timeout(2000),
            });
            if (viaCepRes.ok) {
              const viaCepData = await viaCepRes.json();
              if (viaCepData && !viaCepData.erro) {
                const ibge = cleanDigits(viaCepData.ibge);
                const city = viaCepData.localidade;
                resolvedMun = resolveBahiaMunicipio(null, ibge, city, cepClean, viaCepData.uf);
              }
            }
          } catch {
            // Falha silenciosa para não comprometer a consulta principal do paciente
          }
        }
      }

      const result: CpfLookupResult = {
        found: true,
        status: afsesabStatus,
        status_externo: afsesabStatus,
        afsesab_status: afsesabStatus,
        afsesab_status_label: afsesabLabel,
        cadastrado_afsesab: afsesabCadastrado,
        cns: rawCns ? String(rawCns).trim() : null,
        nome: rawNome ? String(rawNome).trim() : null,
        nascimento: normalizeDate(rawNasc),
        cpf: cleanDigits(rawCpf) || cleanCpf,
        cpf_formatted: formatCPF(cleanCpf),
        cod_sexo: rawSexo ? String(rawSexo) : null,
        gender: normalizeGender(rawSexo),
        end_descricao_barrio: rawBairro ? String(rawBairro).trim() : null,
        bairro: rawBairro ? String(rawBairro).trim() : null,
        end_numero_cep: rawCep ? cleanDigits(String(rawCep)) : null,
        cep: rawCep ? String(rawCep).trim() : null,
        logradouro: patientObj.end_nome_logradouro ? String(patientObj.end_nome_logradouro).trim() : null,
        numero: patientObj.end_numero ? String(patientObj.end_numero).trim() : null,
        complemento: patientObj.complemento ? String(patientObj.complemento).trim() : null,
        rg: patientObj.numero_identidade_rg ? String(patientObj.numero_identidade_rg).trim() : null,
        nome_mae: patientObj.nome_mae ? String(patientObj.nome_mae).trim() : null,
        email: patientObj.email ? String(patientObj.email).trim() : null,
        municipio_id: resolvedMun ? resolvedMun.id : rawMunId ? String(rawMunId) : null,
        municipio_ibge: resolvedMun ? resolvedMun.ibge_code : rawIbge ? String(rawIbge) : null,
        municipio_name: resolvedMun
          ? `${resolvedMun.name} - BA`
          : isOutsideBahia
          ? rawName ? `${rawName} - ${rawUf}` : `Outro Estado (${rawUf})`
          : typeof rawMunId === "string" ? rawMunId : null,
        brs_name: resolvedMun ? resolvedMun.brs_name : null,
        macroregion: resolvedMun ? resolvedMun.macroregion : null,
        base_id: resolvedMun ? resolvedMun.base_id : null,
        is_outside_bahia: isOutsideBahia,
        source: "external_api",
        message: "Dados localizados com sucesso na base de dados da SESAB.",
      };

      return NextResponse.json(result);
    } catch (fetchErr: any) {
      console.error("Erro de conexão com API SESAB:", fetchErr);
      if (simulate) {
        return handleSimulatedFallback(cleanCpf);
      }
      const isTimeout =
        fetchErr?.name === "AbortError" ||
        String(fetchErr?.message || "").toLowerCase().includes("aborted") ||
        String(fetchErr?.message || "").toLowerCase().includes("tempo limite");

      return NextResponse.json(
        {
          found: false,
          cpf: cleanCpf,
          cpf_formatted: formatCPF(cleanCpf),
          message: isTimeout
            ? "O servidor da SESAB não respondeu no prazo limite. Os campos estão liberados para preenchimento manual."
            : `Erro na comunicação com a API da SESAB: ${fetchErr.message}. Preencha manualmente.`,
          timeout: isTimeout,
        },
        { status: 200 }
      );
    }
  }

  // 2. Se as credenciais ainda não foram informadas no .env.local:
  // Fornece resposta com instruções amigáveis e suporte a simulate=true para testes
  if (simulate) {
    return handleSimulatedFallback(cleanCpf);
  }

  return NextResponse.json(
    {
      found: false,
      cpf: cleanCpf,
      cpf_formatted: formatCPF(cleanCpf),
      message:
        "Credenciais da SESAB não configuradas no arquivo .env.local. Preencha SESAB_API_EMAIL e SESAB_API_PASSWORD para ativar a busca real, ou passe simulate=true para testar.",
      instructions: {
        step1: "Abra o arquivo .env.local",
        step2: "Preencha SESAB_API_EMAIL e SESAB_API_PASSWORD",
        step3: "Acesse /api/cpf?diagnostics=true para verificar a conexão",
      },
    },
    { status: 200 }
  );
}

function handleSimulatedFallback(cleanCpf: string) {
  const fakeMun = INITIAL_BAHIA_MUNICIPIOS[Math.floor(Math.random() * INITIAL_BAHIA_MUNICIPIOS.length)];

  const simulatedResult: CpfLookupResult = {
    found: true,
    status: "novo_paciente",
    status_externo: "novo_paciente",
    afsesab_status: "novo_paciente",
    afsesab_status_label: "Novo Paciente (Sem cadastro no AFSESAB)",
    cadastrado_afsesab: false,
    cns: "70" + cleanCpf.slice(0, 8) + "0001",
    nome: "Paciente Teste da Silva",
    nascimento: "1988-06-15",
    cpf: cleanCpf,
    cpf_formatted: formatCPF(cleanCpf),
    cod_sexo: "F",
    gender: "F",
    end_descricao_barrio: "Centro",
    bairro: "Centro",
    end_numero_cep: "40000000",
    cep: "40000-000",
    municipio_id: fakeMun.id,
    municipio_ibge: fakeMun.ibge_code,
    municipio_name: `${fakeMun.name} - BA`,
    brs_name: fakeMun.brs_name || null,
    macroregion: fakeMun.macroregion || null,
    base_id: fakeMun.base_id || null,
    source: "simulation",
    message: "Modo Simulação: Credenciais reais da SESAB aguardando preenchimento no .env.local.",
  };

  return NextResponse.json(simulatedResult);
}
