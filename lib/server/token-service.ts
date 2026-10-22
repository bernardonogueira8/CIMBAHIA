// ==============================================================================
// CIMBAHIA - SERVIÇO DE AUTENTICAÇÃO E DUPLO TOKEN (SESAB / AFSESAB)
//
// 1. API 1: {{ baseUrl }}/api/v1/login -> Envia email e password -> Resgata "Token"
// 2. API 2: {{ baseUrl }}/logistica/login -> Envia email e password -> Resgata token XSRF
// 3. API Pacientes: {{ baseUrl }}/api/v1/pacientes/buscar-paciente
//    - Header: Authorization: Bearer <Token 1>
//    - Header: X-XSRF-TOKEN: <Token 2>
//    - Params: ?cns=&cpf=...&unidade_selecionada_id=9
// ==============================================================================

interface CachedToken {
  token: string;
  expiresAt: number; // timestamp em milissegundos
}

// Cache mantido no runtime do processo do servidor (Next.js Node process)
let cachedToken1: CachedToken | null = null;
let cachedToken2: CachedToken | null = null;

// Promises ativas para evitar requisições duplicadas simultâneas (lock / thundering herd)
let inFlightToken1Promise: Promise<string> | null = null;
let inFlightToken2Promise: Promise<string> | null = null;

// Margem de renovação antes da expiração (60 segundos)
const RENEWAL_BUFFER_MS = 60 * 1000;

function requireHttpsUrl(value: string, settingName: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${settingName} deve conter uma URL válida.`);
  }

  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error(`${settingName} deve usar HTTPS e não pode conter credenciais.`);
  }

  return url.toString().replace(/\/+$/, "");
}

/**
 * Normaliza e resolve a Base URL da SESAB
 */
export function getSesabBaseUrl(): string {
  const base =
    process.env.SESAB_BASE_URL ||
    process.env.AFSESAB_BASE_URL ||
    process.env.CPF_API_BASE_URL;

  if (!base) {
    throw new Error("Configure SESAB_BASE_URL com o endereço HTTPS oficial da SESAB.");
  }

  return requireHttpsUrl(base, "SESAB_BASE_URL");
}

/**
 * Obtém as credenciais de login (Email e Senha)
 */
export function getSesabCredentials(): { email: string; password: string } {
  const email =
    process.env.SESAB_API_EMAIL ||
    process.env.SESAB_EMAIL ||
    process.env.AUTH_API_EMAIL ||
    process.env.AUTH_API_1_CLIENT_ID ||
    "";

  const password =
    process.env.SESAB_API_PASSWORD ||
    process.env.SESAB_PASSWORD ||
    process.env.SESAB_PASSOWARD ||
    process.env.AUTH_API_PASSWORD ||
    process.env.AUTH_API_1_CLIENT_SECRET ||
    "";

  return { email, password };
}

/**
 * Extrai o token da resposta JSON (testando chaves com 'Token', 'token', 'access_token', etc.)
 */
function extractTokenFromResponse(data: any, customPath?: string): string | null {
  if (!data) return null;
  if (typeof data === "string") return data.trim();

  // 1. Caminho customizado se especificado (ex: "data.Token" ou "Token")
  if (customPath) {
    const parts = customPath.split(".");
    let current = data;
    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = current[part];
      } else {
        current = null;
        break;
      }
    }
    if (typeof current === "string" && current.trim()) {
      return current.trim();
    }
  }

  // 2. Chaves específicas do contrato da SESAB e padrões comuns
  const priorityKeys = [
    "Token", // Especificado pelo usuário: resgatar "Token"
    "token",
    "access_token",
    "accessToken",
    "xsrf_token",
    "csrf_token",
    "jwt",
    "authorization",
    "sessionToken",
    "token_acesso",
  ];

  for (const key of priorityKeys) {
    if (typeof data[key] === "string" && data[key].trim()) {
      return data[key].trim();
    }
  }

  // 3. Procura dentro de sub-objetos comuns (ex: data.Token, response.token)
  const nestedWrappers = ["data", "response", "result", "payload", "auth", "session"];
  for (const wrapper of nestedWrappers) {
    if (data[wrapper] && typeof data[wrapper] === "object") {
      const nested = extractTokenFromResponse(data[wrapper]);
      if (nested) return nested;
    }
  }

  return null;
}

/**
 * Extrai token de cookies Set-Cookie (ex: XSRF-TOKEN=... no endpoint /logistica/login)
 */
function extractXsrfFromCookies(headers: Headers): string | null {
  const setCookie = headers.get("set-cookie");
  if (!setCookie) return null;

  const match = setCookie.match(/XSRF-TOKEN=([^;]+)/i) || setCookie.match(/xsrf_token=([^;]+)/i);
  if (match && match[1]) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }
  return null;
}

/**
 * 1. OBTÉM TOKEN 1: POST /api/v1/login
 * Body: { "email": "...", "password": "..." } (ou passoward)
 * Retorna: "Token"
 */
export async function getValidToken1(forceRefresh = false): Promise<string> {
  const now = Date.now();

  if (
    !forceRefresh &&
    cachedToken1 &&
    cachedToken1.expiresAt > now + RENEWAL_BUFFER_MS
  ) {
    return cachedToken1.token;
  }

  if (inFlightToken1Promise) {
    return inFlightToken1Promise;
  }

  const baseUrl = getSesabBaseUrl();
  const loginUrl = requireHttpsUrl(
    process.env.SESAB_LOGIN_URL ||
      process.env.AUTH_API_1_URL ||
      `${baseUrl}/api/v1/login`,
    "SESAB_LOGIN_URL"
  );
  const { email, password } = getSesabCredentials();

  if (!email || !password) {
    throw new Error(
      "Credenciais SESAB não configuradas no .env.local (SESAB_API_EMAIL e SESAB_API_PASSWORD)."
    );
  }

  inFlightToken1Promise = (async () => {
    const payload = {
      email: email.trim(),
      password: password.trim(),
      passoward: password.trim(), // Compatibilidade com grafia informada
    };

    const timeoutMs = Number(process.env.SESAB_TIMEOUT_MS) || 15000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const resp = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "User-Agent": "CimBahia-Core/1.0",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
        redirect: "error",
      });

      if (!resp.ok) {
        const errText = await resp.text().catch(() => "");
        throw new Error(
          `Falha no Login 1 (/api/v1/login - Status ${resp.status}): ${errText.slice(0, 200)}`
        );
      }

      const json = await resp.json().catch(() => ({}));
      const token = extractTokenFromResponse(json, process.env.AUTH_API_1_TOKEN_PATH);

      if (!token) {
        throw new Error(
          "Login 1 bem-sucedido, mas a propriedade 'Token' não foi localizada na resposta JSON."
        );
      }

      const expiresInSec = Number(json.expires_in || json.expiresIn || process.env.AUTH_API_1_EXPIRES_IN || 3600);
      cachedToken1 = {
        token,
        expiresAt: Date.now() + expiresInSec * 1000,
      };

      return token;
    } catch (err: any) {
      if (err?.name === "AbortError" || String(err?.message || "").toLowerCase().includes("aborted")) {
        throw new Error(
          `Tempo limite esgotado (${timeoutMs / 1000}s) ao conectar com o serviço SESAB (/api/v1/login). O servidor estadual pode estar temporariamente inacessível.`
        );
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
      inFlightToken1Promise = null;
    }
  })();

  return inFlightToken1Promise;
}

/**
 * 2. OBTÉM TOKEN 2: POST /logistica/login
 * Body: { "email": "...", "password": "..." }
 * Retorna: token para uso no header X-XSRF-TOKEN
 */
export async function getValidToken2(forceRefresh = false): Promise<string> {
  const now = Date.now();

  if (
    !forceRefresh &&
    cachedToken2 &&
    cachedToken2.expiresAt > now + RENEWAL_BUFFER_MS
  ) {
    return cachedToken2.token;
  }

  if (inFlightToken2Promise) {
    return inFlightToken2Promise;
  }

  const baseUrl = getSesabBaseUrl();
  const logisticaUrl = requireHttpsUrl(
    process.env.SESAB_LOGISTICA_URL ||
      process.env.AUTH_API_2_URL ||
      `${baseUrl}/logistica/login`,
    "SESAB_LOGISTICA_URL"
  );
  const { email, password } = getSesabCredentials();

  if (!email || !password) {
    throw new Error(
      "Credenciais SESAB não configuradas no .env.local (SESAB_API_EMAIL e SESAB_API_PASSWORD)."
    );
  }

  inFlightToken2Promise = (async () => {
    const payload = {
      email: email.trim(),
      password: password.trim(),
      passoward: password.trim(),
    };

    const timeoutMs = Number(process.env.SESAB_TIMEOUT_MS) || 15000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const resp = await fetch(logisticaUrl, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "User-Agent": "CimBahia-Core/1.0",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
        redirect: "error",
      });

      if (!resp.ok) {
        const errText = await resp.text().catch(() => "");
        throw new Error(
          `Falha no Login 2 (/logistica/login - Status ${resp.status}): ${errText.slice(0, 200)}`
        );
      }

      // 1. Tenta extrair do cookie XSRF-TOKEN se presente
      let token2 = extractXsrfFromCookies(resp.headers);

      // 2. Tenta extrair do corpo JSON
      if (!token2) {
        const json = await resp.json().catch(() => ({}));
        token2 = extractTokenFromResponse(json, process.env.AUTH_API_2_TOKEN_PATH);
      }

      if (!token2) {
        throw new Error(
          "Login 2 (/logistica/login) bem-sucedido, mas o token XSRF não foi localizado no corpo nem nos cookies."
        );
      }

      const expiresInSec = Number(process.env.AUTH_API_2_EXPIRES_IN || 3600);
      cachedToken2 = {
        token: token2,
        expiresAt: Date.now() + expiresInSec * 1000,
      };

      return token2;
    } catch (err: any) {
      if (err?.name === "AbortError" || String(err?.message || "").toLowerCase().includes("aborted")) {
        throw new Error(
          `Tempo limite esgotado (${timeoutMs / 1000}s) ao conectar com o serviço SESAB (/logistica/login). O servidor estadual pode estar temporariamente inacessível.`
        );
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
      inFlightToken2Promise = null;
    }
  })();

  return inFlightToken2Promise;
}

/**
 * 3. OBTÉM OS CABEÇALHOS COMPLETOS PARA A REQUISIÇÃO DE PACIENTE
 * Retorna os headers configurados exatamente conforme especificado:
 * - Authorization: Bearer <Token 1>
 * - X-XSRF-TOKEN: <Token 2>
 */
export async function getSesabAuthHeaders(forceRefresh = false): Promise<{
  headers: Record<string, string>;
  token1Preview: string;
  token2Preview: string;
}> {
  const [token1, token2] = await Promise.all([
    getValidToken1(forceRefresh),
    getValidToken2(forceRefresh),
  ]);

  const authHeaderValue = token1.startsWith("Bearer ") ? token1 : `Bearer ${token1}`;

  const preview = (t: string) => {
    if (t.length <= 12) return t;
    return `${t.slice(0, 6)}...${t.slice(-4)}`;
  };

  return {
    headers: {
      "Authorization": authHeaderValue,
      "X-XSRF-TOKEN": token2,
      "Accept": "application/json",
      "User-Agent": "CimBahia-Core/1.0",
    },
    token1Preview: preview(token1),
    token2Preview: preview(token2),
  };
}

/**
 * Constrói a URL oficial de busca de paciente com os parâmetros solicitados
 * O endereço e os endpoints devem vir de variáveis de ambiente HTTPS.
 */
export function buildBuscarPacienteUrl(cpf: string, cns?: string | null, customUnidadeId?: string | null): string {
  const baseUrl = getSesabBaseUrl();
  const endpoint = requireHttpsUrl(
    process.env.SESAB_BUSCAR_PACIENTE_URL ||
    process.env.CPF_API_URL ||
    `${baseUrl}/api/v1/pacientes/buscar-paciente`,
    "SESAB_BUSCAR_PACIENTE_URL"
  );

  const cleanCpf = cpf.replace(/\D/g, "");
  const cleanCns = cns ? cns.replace(/\D/g, "") : "";
  const unidadeId = customUnidadeId || process.env.SESAB_UNIDADE_SELECIONADA_ID || "9";

  const url = new URL(endpoint);
  url.searchParams.set("cns", cleanCns);
  url.searchParams.set("cpf", cleanCpf);
  url.searchParams.set("unidade_selecionada_id", unidadeId);

  return url.toString();
}

/**
 * Invalida os tokens no cache em memória (usado para renovação imediata em caso de 401)
 */
export function invalidateTokens(): void {
  cachedToken1 = null;
  cachedToken2 = null;
  inFlightToken1Promise = null;
  inFlightToken2Promise = null;
}

/**
 * Retorna status de diagnóstico da conexão SESAB / AFSESAB
 */
export function getAuthDiagnostics() {
  const now = Date.now();
  const { email } = getSesabCredentials();
  const baseUrl =
    process.env.SESAB_BASE_URL ||
    process.env.AFSESAB_BASE_URL ||
    process.env.CPF_API_BASE_URL ||
    null;

  return {
    provider: "SESAB / AFSESAB Bahia",
    baseUrl,
    emailConfigured: Boolean(email),
    maskedEmail: email ? email.replace(/(.{2})(.*)(@.*)/, "$1***$3") : null,
    login1Endpoint: baseUrl ? `${baseUrl}/api/v1/login` : null,
    login2Endpoint: baseUrl ? `${baseUrl}/logistica/login` : null,
    buscarPacienteEndpoint: baseUrl ? `${baseUrl}/api/v1/pacientes/buscar-paciente` : null,
    secureTransportRequired: true,
    unidadeSelecionadaId: process.env.SESAB_UNIDADE_SELECIONADA_ID || "9",

    hasCachedToken1: Boolean(cachedToken1 && cachedToken1.expiresAt > now),
    token1ExpiresInSeconds: cachedToken1
      ? Math.max(0, Math.floor((cachedToken1.expiresAt - now) / 1000))
      : 0,

    hasCachedToken2: Boolean(cachedToken2 && cachedToken2.expiresAt > now),
    token2ExpiresInSeconds: cachedToken2
      ? Math.max(0, Math.floor((cachedToken2.expiresAt - now) / 1000))
      : 0,
  };
}
