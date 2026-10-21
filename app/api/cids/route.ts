import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

let cachedCids: Array<{
  code: string;
  raw_code: string;
  description: string;
  category: string;
  category_desc: string;
  chapter: string;
  group_name: string;
}> | null = null;

function loadCids() {
  if (!cachedCids) {
    try {
      const filePath = path.join(process.cwd(), "data", "cids_completo.json");
      const fileData = fs.readFileSync(filePath, "utf-8");
      cachedCids = JSON.parse(fileData);
    } catch (e) {
      console.error("Erro ao carregar cids_completo.json", e);
      cachedCids = [];
    }
  }
  return cachedCids || [];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const chapter = searchParams.get("chapter");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 500);
  const getAll = searchParams.get("all") === "true";

  const allCids = loadCids();

  if (getAll) {
    return NextResponse.json({
      total: allCids.length,
      cids: allCids,
    });
  }

  let filtered = allCids;

  if (q) {
    filtered = filtered.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.raw_code.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.category_desc.toLowerCase().includes(q)
    );
  }

  if (chapter) {
    filtered = filtered.filter((c) => c.chapter.toLowerCase() === chapter.toLowerCase());
  }

  const total = filtered.length;
  const startIndex = (page - 1) * limit;
  const paginated = filtered.slice(startIndex, startIndex + limit);

  return NextResponse.json({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    cids: paginated,
  });
}
