export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    const missing = [
      !url && "NEXT_PUBLIC_SUPABASE_URL",
      !anonKey && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ].filter((value): value is string => Boolean(value));
    console.error(
      `[CIMBAHIA] Configuração do Supabase ausente: ${missing.join(", ")}.`
    );
    return null;
  }

  if (url.includes("seu-projeto") || anonKey.includes("sua-chave")) {
    console.error(
      "[CIMBAHIA] Configure valores reais para NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
    return null;
  }

  try {
    const parsedUrl = new URL(url);
    const isLocalhost = ["localhost", "127.0.0.1", "[::1]"].includes(
      parsedUrl.hostname
    );
    if (
      (parsedUrl.protocol !== "https:" &&
        !(parsedUrl.protocol === "http:" && isLocalhost)) ||
      parsedUrl.username ||
      parsedUrl.password
    ) {
      console.error(
        "[CIMBAHIA] NEXT_PUBLIC_SUPABASE_URL deve usar HTTPS e não pode conter credenciais."
      );
      return null;
    }
  } catch {
    console.error("[CIMBAHIA] NEXT_PUBLIC_SUPABASE_URL não é uma URL válida.");
    return null;
  }

  return { url, anonKey };
}
