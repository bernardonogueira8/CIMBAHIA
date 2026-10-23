import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("Falha ao validar sessão na busca de CIDs:", authError.message);
    return NextResponse.json(
      { message: "Não foi possível validar a sessão." },
      { status: 503 }
    );
  }

  if (!user) {
    return NextResponse.json(
      { message: "Autenticação necessária." },
      { status: 401 }
    );
  }

  const { data: profileById, error: profileIdError } = await supabase
    .from("cb_profiles")
    .select("id")
    .eq("id", user.id)
    .eq("active", true)
    .maybeSingle();

  if (profileIdError) {
    console.error("Falha ao validar perfil na busca de CIDs:", profileIdError.message);
    return NextResponse.json(
      { message: "Não foi possível validar o perfil de acesso." },
      { status: 503 }
    );
  }

  let hasActiveProfile = Boolean(profileById);
  if (!hasActiveProfile && user.email) {
    const { data: profileByEmail, error: profileEmailError } = await supabase
      .from("cb_profiles")
      .select("id")
      .eq("email", user.email)
      .eq("active", true)
      .maybeSingle();

    if (profileEmailError) {
      console.error("Falha ao validar perfil na busca de CIDs:", profileEmailError.message);
      return NextResponse.json(
        { message: "Não foi possível validar o perfil de acesso." },
        { status: 503 }
      );
    }
    hasActiveProfile = Boolean(profileByEmail);
  }

  if (!hasActiveProfile) {
    return NextResponse.json(
      { message: "Acesso não autorizado." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const rawPage = Number(searchParams.get("page") || "1");
  const rawLimit = Number(searchParams.get("limit") || DEFAULT_LIMIT);
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit =
    Number.isInteger(rawLimit) && rawLimit > 0
      ? Math.min(rawLimit, MAX_LIMIT)
      : DEFAULT_LIMIT;
  const search = (searchParams.get("q") || "").trim();
  const chapter = (searchParams.get("chapter") || "").trim();
  const escapedSearch = search
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/[%_]/g, "\\$&");
  const start = (page - 1) * limit;

  // 1. Tenta consulta insensível a acentuação e maiúsculas via RPC cb_search_cids (PostgreSQL unaccent)
  const { data: rpcData, error: rpcError } = await supabase.rpc("cb_search_cids", {
    search_term: search,
    chapter_filter: chapter,
    page_limit: limit,
    page_offset: start,
  });

  if (!rpcError && Array.isArray(rpcData)) {
    const total = rpcData.length > 0 ? Number(rpcData[0].total_count || 0) : 0;
    const cids = rpcData.map(({ total_count, ...cid }) => cid);
    return NextResponse.json(
      {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        cids,
      },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      }
    );
  }

  if (rpcError) {
    console.warn("RPC cb_search_cids indisponível, aplicando fallback direto:", rpcError.message);
  }

  // 2. Fallback: consulta direta à tabela cb_cids
  let query = supabase
    .from("cb_cids")
    .select("id, code, description, chapter, group_name, active, created_at", {
      count: "exact",
    })
    .order("code")
    .range(start, start + limit - 1);

  if (escapedSearch) {
    query = query.or(
      `code.ilike."%${escapedSearch}%",description.ilike."%${escapedSearch}%"`
    );
  }
  if (chapter) query = query.eq("chapter", chapter);

  const { data, count, error } = await query;
  if (error) {
    console.error("Erro ao buscar CIDs em cb_cids:", error.message);
    return NextResponse.json(
      { message: "Não foi possível consultar o catálogo de CIDs." },
      { status: 500 }
    );
  }

  const total = count || 0;
  return NextResponse.json(
    {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      cids: data || [],
    },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    }
  );
}
